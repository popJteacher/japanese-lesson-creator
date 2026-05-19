# 引き継ぎ資料：日本語教材向け音声自動生成ワークフローの問題点・改善点

**作成日**：2026-05-18  
**対象プロジェクト**：オンライン日本語レッスン／宿題HTML／将来的な日本語辞書サイト向けの音声生成パイプライン  
**対象範囲**：このチャットで確認した `master_audio_registry.json`、`handoff_audio_api_migration_v1.md`、および一部生成済みWAV音声ファイル  
**重要度**：高  
**結論**：現在の最大問題はTTSモデルの品質以前に、**Google Cloud TTSから返ってきたWAV音声を、既存処理でさらにWAV化している可能性が高いこと**。これにより、各音声の冒頭にWAVヘッダー由来のノイズが混入している。

---

## 0. この資料の目的

この資料は、現在の音声自動生成ワークフローについて、このチャットで判明した問題点・改善点・修正方針を次の作業者、またはClaude Code / Codex / ChatGPTに引き継ぐためのものです。

特に次の3点を中心に整理します。

1. 現在のプロジェクト構成とワークフロー
2. 実際に生成されたWAVファイルから判明した問題
3. 今後の修正優先順位と実装方針

---

## 1. 現在のプロジェクト概要

### 1-1. プロジェクトの目的

このプロジェクトは、日本語学習者向け教材で使う音声を自動生成するためのものです。

想定用途は以下です。

- オンライン日本語レッスン用の宿題HTML
- 語彙練習ページ
- 例文音声付き教材
- 将来的な日本語辞書サイト
- Ankiなどの学習素材への展開

対象音声は主に次の2種類です。

| 種類 | ID例 | 内容 |
|---|---|---|
| 語彙音声 | `word_お金`, `word_ギター` | 単語単体の読み上げ |
| 例文音声 | `sentence_ex_L02_001` | 日本語例文・会話文の読み上げ |

---

## 2. 現在のワークフロー推定

添付資料から判断すると、現在のワークフローはおおむね次の構造です。

```text
Google Sheets
  ↓
generateAudio.gs
  ↓
Google Cloud Text-to-Speech API
  ↓
WAV音声生成
  ↓
Google Driveへ保存
  ↓
Spreadsheetへステータス・URL反映
  ↓
syncAll()
  ↓
master_audio_registry.json 更新
  ↓
build-embedded-data.py
  ↓
宿題HTML・教材ページへ音声URLを埋め込み
```

音声生成部分は、以前は `Gemini TTS / gemini-2.5-flash-preview-tts / Aoede` を使用していましたが、現在は `Google Cloud TTS / ja-JP-Wavenet-B` に移行済みです。

---

## 3. 移行済みの内容

`handoff_audio_api_migration_v1.md` では、音声生成APIについて以下の移行が完了済みとされています。

| 項目 | 旧 | 新 |
|---|---|---|
| TTS API | Gemini TTS | Google Cloud Text-to-Speech |
| Voice | Aoede | `ja-JP-Wavenet-B` |
| モデル設計 | Gemini系の汎用TTS | 日本語対応WaveNet |
| 1回の処理件数 | 9件 | 50件 |
| APIキー | `GEMINI_API_KEY` | `GCP_TTS_KEY` |
| 出力形式 | Gemini由来の音声 | `LINEAR16` |

この移行自体は方向性として正しいです。Gemini TTSは多言語汎用TTSとしては便利ですが、日本語教材で重視されるピッチアクセント・助詞・文末イントネーションには弱い可能性があります。

ただし、今回の音声ファイル確認により、**移行後の保存処理に重大な問題が残っている可能性**が判明しました。

---

## 4. 添付レジストリから判明した状態

対象ファイル：`master_audio_registry.json`

### 4-1. レジストリの件数

確認結果は以下です。

| 項目 | 件数 |
|---|---:|
| `_meta.totalEntries` | 77 |
| 実際のキー数 | 84 |
| `status: outdated` | 7 |
| active扱いの件数 | 77 |
| `audioUrl` が入っている件数 | 0 |

### 4-2. 問題点

#### 問題A：件数表記が混在している

引き継ぎ資料では「全75エントリ」という記述がありましたが、`master_audio_registry.json` では active件数が77、全キー数が84です。

```text
handoff資料上の件数：75
registry上のactive件数：77
registry内の全キー数：84
outdated件数：7
```

このままだと以下のバグが起きる可能性があります。

- 生成完了判定が75件で止まり、2件が未生成になる
- outdated音声まで生成される
- activeな音声が生成対象から漏れる
- 宿題HTMLに古い例文の音声URLが混入する

#### 問題B：`audioUrl` がすべて `null`

`master_audio_registry.json` 上では、すべてのエントリで `audioUrl` が `null` でした。

考えられる原因は次のいずれかです。

1. 音声生成がまだ完了していない
2. Google Driveには音声があるが、`syncAll()` が未実行
3. `syncAll()` は実行済みだが、registry更新に失敗している
4. 生成済み音声のURL取得・書き込み処理に問題がある
5. `outdated` やステータス管理の影響で同期対象から外れている

### 4-3. 改善方針

レジストリには、少なくとも以下の検証処理を追加するべきです。

```text
- 全キー数
- active件数
- outdated件数
- audioUrlあり件数
- audioUrlなし件数
- sentenceフィールドあり/なし
- Spreadsheet側との件数差分
- Drive上のファイル実在確認
```

---

## 5. 実音声ファイルから判明した最大問題

### 5-1. 確認した音声ファイル

このチャットで、現在のワークフローから生成された一部音声として以下10ファイルを確認しました。

```text
word_お金.wav
word_ギター.wav
word_コンビニ.wav
word_サッカー.wav
word_一番.wav
word_金曜.wav
word_今日.wav
word_女の子.wav
word_暖かい.wav
word_面白い.wav
```

### 5-2. 結論

10ファイルすべてで、WAVファイルの内部にさらにWAVヘッダーが入っていました。

つまり、構造としては次のようになっていました。

```text
外側のWAVヘッダー
  ↓
dataチャンク
  ↓
内側のWAVヘッダー
  ↓
本当の音声データ
```

これは一般的なWAVファイルとしては不自然です。再生時に、内側のWAVヘッダー部分が音声データとして解釈され、冒頭に「プチッ」「ブツッ」というノイズが発生します。

### 5-3. 原因の推定

原因は、Google Cloud TTSから返ってきた `audioContent` を「生PCM」として扱い、既存の `buildWavBlob_()` で再度WAVヘッダーを付けていることだと考えられます。

現在の移行資料では、以下の設計になっています。

```text
Google Cloud TTS audioContent
  ↓
pcmBase64として扱う
  ↓
buildWavBlob_() に渡す
  ↓
WAVヘッダーを付けて保存
```

しかし、Google Cloud TTSで `audioEncoding: "LINEAR16"` を指定した場合、返ってくる音声はWAVとして保存可能なデータであり、既存処理でさらにWAVヘッダーを追加するべきではありません。

したがって、現在の最大問題は以下です。

```text
Google Cloud TTSのaudioContentを生PCMと誤解し、既存のbuildWavBlob_()で二重にWAV化している可能性が高い。
```

---

## 6. 音声分析結果

以下は、内側の正しいWAV部分を取り出した後の簡易分析結果です。

| ファイル | 長さ | 主な問題 | 修復後ピーク | 修復後RMS | 冒頭無音 | 末尾無音 |
|---|---:|---|---:|---:|---:|---:|
| `word_お金.wav` | 0.701s | 二重WAVヘッダー | -9.9 dBFS | -22.0 dBFS | 17.7ms | 218.3ms |
| `word_ギター.wav` | 0.823s | 二重WAVヘッダー | -9.5 dBFS | -22.4 dBFS | 11.9ms | 208.1ms |
| `word_コンビニ.wav` | 0.862s | 二重WAVヘッダー | -4.1 dBFS | -17.3 dBFS | 51.0ms | 214.4ms |
| `word_サッカー.wav` | 0.930s | 二重WAVヘッダー | -0.5 dBFS | -21.0 dBFS | 13.2ms | 216.6ms |
| `word_一番.wav` | 0.823s | 二重WAVヘッダー | -7.9 dBFS | -21.6 dBFS | 23.1ms | 210.5ms |
| `word_今日.wav` | 0.570s | 二重WAVヘッダー | -5.2 dBFS | -19.8 dBFS | 51.8ms | 203.3ms |
| `word_女の子.wav` | 0.945s | 二重WAVヘッダー | -5.2 dBFS | -17.5 dBFS | 21.5ms | 205.7ms |
| `word_暖かい.wav` | 0.900s | 二重WAVヘッダー | -4.2 dBFS | -22.8 dBFS | 14.1ms | 213.6ms |
| `word_金曜.wav` | 0.887s | 二重WAVヘッダー | -5.7 dBFS | -15.8 dBFS | 50.0ms | 206.0ms |
| `word_面白い.wav` | 0.938s | 二重WAVヘッダー | -4.9 dBFS | -19.2 dBFS | 17.6ms | 213.2ms |

### 6-1. 分析から分かること

#### すべてのファイルに二重WAVヘッダーがある

これは最優先で修正すべき問題です。

#### 音量差が大きい

RMS値を見ると、もっとも大きい `word_金曜.wav` は約 -15.8 dBFS、もっとも小さい `word_暖かい.wav` は約 -22.8 dBFSです。

差は約7 dBあります。

教材音声としては、単語ごとに聞こえ方がかなり変わる可能性があります。

#### 末尾無音がやや長い

多くの音声で末尾無音が約200msあります。

単語音声としては完全な問題ではありませんが、辞書サイト・Anki・連続再生ではテンポがやや悪くなる可能性があります。

---

## 7. 現在の主要問題一覧

### 優先度：最重要

#### 問題1：WAVヘッダーが二重化している

- すべての確認済みWAVで発生
- 冒頭ノイズの主因と考えられる
- TTSモデルではなく保存処理の問題
- `buildWavBlob_()` の再利用が原因の可能性が高い

#### 問題2：Google Cloud TTSの返却形式に対する理解がコードと合っていない

- `LINEAR16` の返却結果を `pcmBase64` と名付けている
- その結果、「WAVヘッダーを付ける必要がある」と誤解しやすい
- 変数名・戻り値設計も修正した方がよい

#### 問題3：生成後の音声処理がない

現在のワークフローには、以下が不足しています。

- 音量正規化
- 冒頭ノイズ除去
- fade in
- fade out
- 末尾無音調整
- 品質チェック

### 優先度：高

#### 問題4：`master_audio_registry.json` の `audioUrl` がすべて `null`

- 音声生成とレジストリ更新がつながっていない可能性がある
- 宿題HTML・辞書サイト側では音声を参照できない状態

#### 問題5：件数管理が不安定

- 75 / 77 / 84 の数字が混在
- `outdated` の扱いが明確に処理されているか不明

#### 問題6：SSMLが本格利用されていない

- 移行資料ではSSMLの利用可能性に触れている
- しかしコード例では `input: { text: text }` になっている
- ピッチアクセント・読み方・ポーズ制御には `input: { ssml: ssml }` が必要

### 優先度：中

#### 問題7：単語音声だけでは自然なイントネーション学習に限界がある

以下の語は、単語単体と文中で自然な聞こえ方が変わりやすいです。

```text
今日
一番
金曜
暖かい
面白い
お金
```

単語音声だけでなく、短い例文音声も用意した方が教材として自然です。

#### 問題8：品質レビュー用のステータスが足りない

現在の状態管理は、主に生成済みかどうかに寄っていると見られます。

教材品質を安定させるには、以下のようなレビュー状態が必要です。

```text
pending
processing
generated
checked
needs_fix
regenerated
outdated
```

---

## 8. すぐに行うべき修正

## 修正1：Google Cloud TTSの音声は `buildWavBlob_()` に渡さない

### 現在の問題ある流れ

```text
Google Cloud TTS audioContent
  ↓
base64Decode
  ↓
buildWavBlob_()
  ↓
WAVヘッダーを追加
  ↓
保存
```

### 修正後の流れ

```text
Google Cloud TTS audioContent
  ↓
base64Decode
  ↓
そのまま audio/wav Blob として保存
```

### 修正イメージ

```javascript
function buildGoogleTtsAudioBlob_(audioBase64, fileName) {
  const bytes = Utilities.base64Decode(audioBase64);
  return Utilities.newBlob(bytes, "audio/wav", fileName + ".wav");
}
```

`callGoogleCloudTTS_()` の戻り値も、`pcmBase64` ではなく `audioBase64` に変更することを推奨します。

```javascript
return {
  success: true,
  audioBase64: json.audioContent,
  format: "wav",
  provider: "google-cloud-tts",
  voiceName: AUDIO_SETTINGS.VOICE_NAME
};
```

### 重要

`pcmBase64` という名前は避けるべきです。

理由：

```text
pcmBase64 = 生PCM = WAVヘッダーがない = buildWavBlob_()が必要
```

という誤解を生みやすいからです。

---

## 9. generateAudio.gs の推奨修正方針

### 9-1. `callGoogleCloudTTS_()` の戻り値を変更

変更前のイメージ：

```javascript
return {
  success: true,
  pcmBase64: json.audioContent,
  sampleRate: AUDIO_SETTINGS.SAMPLE_RATE,
};
```

変更後のイメージ：

```javascript
return {
  success: true,
  audioBase64: json.audioContent,
  audioEncoding: AUDIO_SETTINGS.AUDIO_ENCODING,
  mimeType: "audio/wav",
  fileExtension: ".wav",
  provider: "google-cloud-tts",
  voiceName: AUDIO_SETTINGS.VOICE_NAME,
};
```

### 9-2. Cloud TTS専用のBlob生成関数を作る

```javascript
function buildCloudTtsWavBlob_(audioBase64, fileNameWithoutExt) {
  const bytes = Utilities.base64Decode(audioBase64);
  return Utilities.newBlob(
    bytes,
    "audio/wav",
    fileNameWithoutExt + ".wav"
  );
}
```

### 9-3. 既存 `buildWavBlob_()` は残してもよいが、Cloud TTSでは使わない

将来、別APIが本当に生PCMを返す場合に備えて `buildWavBlob_()` を残すこと自体は問題ありません。

ただし、関数名・コメントを明確にしてください。

```javascript
// 生PCM専用。Google Cloud TTS LINEAR16のaudioContentには使用しない。
function buildWavBlobFromRawPcm_(pcmBase64, sampleRate, fileNameWithoutExt) {
  // ...
}
```

### 9-4. `processAudioEntry_()` の修正イメージ

```javascript
const ttsResult = callGoogleCloudTTS_(row.textToSpeak);

if (!ttsResult.success) {
  // エラー処理
  return;
}

const audioBlob = buildCloudTtsWavBlob_(
  ttsResult.audioBase64,
  row.audioId
);

const file = saveAudioToDrive_(audioBlob, row.audioId);
```

既存の `saveAudioToDrive_()` がBlobを受け取る設計なら、保存部分は大きく変えなくてよいはずです。

---

## 10. 生成済み音声への対応

すでに生成された音声は、すべて再生成するのが安全です。

### 理由

- 二重WAVヘッダーが全サンプルで確認された
- 既存音声をそのまま使うと冒頭ノイズが残る
- 後からHTMLや辞書サイトに埋め込むと、修正が面倒になる

### 対応方針

```text
1. generateAudio.gs を修正
2. 既存音声ファイルを削除、または別フォルダに退避
3. Spreadsheet上の音声生成ステータスを pending に戻す
4. activeなエントリのみ再生成
5. syncAll() を実行
6. master_audio_registry.json の audioUrl を確認
7. 宿題HTMLを再ビルド
```

### 注意

`outdated` のエントリは再生成対象から除外すること。

---

## 11. 音量差への対応

### 11-1. 現状

修復後のRMS値でも、音声によって最大約7dB程度の差がありました。

例：

```text
word_金曜.wav    約 -15.8 dBFS
word_暖かい.wav  約 -22.8 dBFS
```

この差は教材音声としては大きめです。

### 11-2. 原因

単語ごとの音韻構造、長さ、母音・子音のバランスにより、TTS出力の実効音量は変わります。

Google TTSの `volumeGainDb` だけでは、ファイルごとの聞こえ方を均一化できません。

### 11-3. 推奨対応

生成後に loudness normalization を行います。

推奨ツール：FFmpeg

単語・例文教材向けの初期値：

```bash
ffmpeg -i input.wav -af "loudnorm=I=-18:LRA=7:TP=-1.5" output.wav
```

より聞き取りやすさを重視するなら：

```bash
ffmpeg -i input.wav -af "loudnorm=I=-16:LRA=7:TP=-1.5" output.wav
```

### 11-4. 推奨値

| 用途 | 推奨ラウドネス |
|---|---:|
| 辞書サイト | -18 LUFS |
| Anki・短い単語音声 | -16〜-18 LUFS |
| 長めの例文 | -18 LUFS |
| BGMなし教材 | -18 LUFS |

---

## 12. 冒頭ノイズ・クリック音への対応

### 12-1. 最優先対応

まずは二重WAVヘッダーを解消してください。

これだけで、現在確認されている冒頭ノイズの多くは改善されるはずです。

### 12-2. 追加対応

二重WAVヘッダー修正後も微小なクリック音が残る場合は、以下を追加します。

```text
- 冒頭の極小無音・ノイズをトリム
- 10〜20msのfade in
- 10〜30msのfade out
```

FFmpeg例：

```bash
ffmpeg -i input.wav -af "afade=t=in:st=0:d=0.02,afade=t=out:st=0.78:d=0.02" output.wav
```

ただし、`st=0.78` のようなfade out開始時刻は音声長によって変わるため、自動処理ではPythonなどで長さを取得してから設定する方が安全です。

---

## 13. 末尾無音への対応

### 13-1. 現状

今回確認した音声では、末尾無音がおおむね200ms前後ありました。

これは大きな欠陥ではありませんが、連続再生・Anki・辞書サイトでは少しテンポが悪くなる可能性があります。

### 13-2. 推奨値

| 用途 | 末尾無音の目安 |
|---|---:|
| 単語音声 | 100〜150ms |
| 例文音声 | 150〜250ms |
| 会話形式 | 文脈に応じて調整 |

### 13-3. 対応方針

単語音声は100〜150ms程度に揃えるとよいです。

ただし、優先順位は以下です。

```text
1. 二重WAVヘッダー修正
2. 音量正規化
3. fade in/out
4. 末尾無音調整
```

---

## 14. GASだけで完結させる場合の限界

Google Apps Scriptは、API呼び出し・Google Drive保存・Spreadsheet更新には向いています。

しかし、以下の音声後処理にはあまり向いていません。

```text
- loudness normalization
- fade in/out
- silence trimming
- waveform analysis
- batch audio validation
```

これらはFFmpegやPythonの方が適しています。

したがって、将来的には以下のように役割分担するのが望ましいです。

```text
GAS：
  - Google Sheets読み込み
  - TTS API呼び出し
  - Drive保存
  - ステータス管理
  - registry同期

Python / FFmpeg：
  - 音量正規化
  - 冒頭・末尾処理
  - 音声品質チェック
  - ファイル構造検証
```

---

## 15. 推奨アーキテクチャ：短期・中期・長期

### 15-1. 短期対応：GAS内の保存処理だけ直す

最短で直すべきことはこれです。

```text
Cloud TTSのaudioContentを buildWavBlob_() に渡さない
```

これだけで、二重WAVヘッダー問題は解消する可能性が高いです。

短期対応の目標：

```text
- 冒頭ノイズを消す
- 正常なWAVファイルを生成する
- 既存パイプラインを大きく壊さない
```

### 15-2. 中期対応：Python/FFmpegで後処理を追加

中期的には、音声生成後にPython/FFmpegで以下を自動処理します。

```text
- nested WAV header検出
- loudnorm
- fade in/out
- 末尾無音調整
- RMS/peak/長さのログ出力
```

中期対応の目標：

```text
- 音量を安定させる
- 教材として聞きやすい音声にする
- 品質チェックを自動化する
```

### 15-3. 長期対応：TTSプロバイダ差し替え可能な設計にする

将来的に以下のTTS候補へ移行・比較できるようにします。

```text
- Google Cloud TTS WaveNet
- Google Cloud TTS Neural2
- Google Cloud TTS Chirp 3 HD
- Azure TTS
- Amazon Polly
- VOICEVOX
- AivisSpeech
```

長期的には、TTS呼び出し部分を抽象化するのが望ましいです。

```javascript
function synthesizeAudio_(entry) {
  switch (AUDIO_SETTINGS.PROVIDER) {
    case "google-cloud-tts":
      return synthesizeWithGoogleCloudTts_(entry);
    case "voicevox":
      return synthesizeWithVoicevox_(entry);
    default:
      throw new Error("Unknown provider");
  }
}
```

---

## 16. SSML・読み上げテキストの改善

### 16-1. 現状

現在のコード例では、Google Cloud TTSに以下の形式でテキストを渡しています。

```javascript
input: { text: text }
```

この方式では、読み方やポーズの制御が限定的です。

### 16-2. 改善方針

必要に応じてSSMLを使えるようにします。

```javascript
input: { ssml: ssml }
```

SSMLを使うと、以下を制御できます。

```text
- 読み方
- ポーズ
- 速度
- ピッチ
- 文の区切り
- 一部語句の読み替え
```

### 16-3. ただし全件SSML化は不要

最初からすべての語彙をSSML化する必要はありません。

推奨は以下です。

```text
通常語：textToSpeakをそのまま使用
問題語：SSMLを使用
固有名詞：必要に応じて読み仮名・phoneme指定
会話文：breakを入れる
```

### 16-4. SSML対象になりやすい語

今回のサンプルでは、特に以下は注意対象です。

```text
今日
一番
金曜
女の子
暖かい
面白い
お金
```

理由：

```text
- ピッチアクセントの影響が大きい
- 単語単体と文中で聞こえ方が変わりやすい
- 学習者が真似しやすい語なので、教材音声の自然さが重要
```

---

## 17. 単語音声と例文音声の使い分け

### 17-1. 単語音声だけでは不十分な場合

日本語では、単語単体の発音と文中の自然なイントネーションが異なることがあります。

例：

```text
今日
暖かい
面白い
一番
金曜
```

単語だけで聞くと自然でも、例文内では不自然になる場合があります。

### 17-2. 推奨

語彙音声に加えて、短い例文音声も用意するとよいです。

例：

```text
今日は暖かいです。
この映画は面白いです。
金曜日に行きます。
お金があります。
サッカーが好きです。
```

教材としては、以下の2段構成が理想です。

```text
1. 単語音声：意味確認・語彙練習用
2. 例文音声：自然なイントネーション・文脈理解用
```

---

## 18. 品質管理ステータスの追加提案

現在は、おそらく生成ステータス中心の管理です。

今後は、教材品質を管理するために以下のステータスを導入することを推奨します。

| status | 意味 |
|---|---|
| `pending` | 未生成 |
| `processing` | 生成中 |
| `generated` | 生成済み・未確認 |
| `checked` | 試聴済み・問題なし |
| `needs_fix` | 問題あり・再生成必要 |
| `regenerated` | 修正後再生成済み |
| `outdated` | 古い例文・使用しない |

さらに、以下の列・フィールドもあるとよいです。

| フィールド | 用途 |
|---|---|
| `audioUrl` | 実際の音声URL |
| `audioProvider` | google-cloud-tts / voicevox等 |
| `voiceName` | ja-JP-Wavenet-B等 |
| `audioFormat` | wav / mp3 / ogg |
| `loudnessStatus` | normalized / not_normalized |
| `qaStatus` | unchecked / ok / needs_fix |
| `qaNotes` | イントネーション・ノイズなどのメモ |
| `generatedAt` | 生成日時 |
| `updatedAt` | 更新日時 |

---

## 19. レジストリ構造の改善提案

現在の `master_audio_registry.json` は、エントリによって情報量が異なります。

例：

```json
"word_医者": {
  "audioUrl": null
}
```

一方で、sentenceを持つものもあります。

```json
"sentence_ex_L02_001": {
  "audioUrl": null,
  "sentence": "これは時計です。"
}
```

### 19-1. 推奨する標準構造

```json
{
  "audioId": "word_お金",
  "type": "word",
  "lesson": "Lxx",
  "displayText": "お金",
  "textToSpeak": "おかね",
  "ssml": null,
  "audioUrl": null,
  "status": "pending",
  "qaStatus": "unchecked",
  "provider": "google-cloud-tts",
  "voiceName": "ja-JP-Wavenet-B",
  "audioFormat": "wav",
  "generatedAt": null,
  "updatedAt": null,
  "notes": ""
}
```

### 19-2. メリット

```text
- wordとsentenceを同じ形式で扱える
- textToSpeakとdisplayTextを分離できる
- SSMLを後から追加できる
- 品質チェック情報を蓄積できる
- 再生成対象を絞り込みやすい
```

---

## 20. 音声ファイル検証スクリプトの提案

### 20-1. nested WAV header検出

Pythonで次のような検証をすると、二重WAVヘッダーを自動検出できます。

```python
from pathlib import Path

for path in Path("audio").glob("*.wav"):
    data = path.read_bytes()
    inner_riff = data.find(b"RIFF", 12)
    if inner_riff != -1:
        print(f"NG nested WAV header: {path.name}, inner RIFF at byte {inner_riff}")
    else:
        print(f"OK: {path.name}")
```

今回のサンプルでは、すべて `inner RIFF at byte 44` のような状態でした。

### 20-2. 音量・長さ・無音チェック

今後は以下の数値を自動でログ化するとよいです。

```text
- duration
- peak dBFS
- RMS dBFS
- leading silence
- trailing silence
- nested WAV header有無
- sample rate
- channel count
- bit depth
```

---

## 21. FFmpeg後処理パイプライン案

### 21-1. 最小構成

```bash
ffmpeg -i input.wav -af "loudnorm=I=-18:LRA=7:TP=-1.5" output.wav
```

### 21-2. fade in/out込み

```bash
ffmpeg -i input.wav -af "afade=t=in:st=0:d=0.02,loudnorm=I=-18:LRA=7:TP=-1.5" output.wav
```

### 21-3. 単語音声向けの理想処理

処理内容：

```text
1. WAV構造チェック
2. 必要ならnested header修復
3. 先頭ノイズ・無音トリム
4. 10〜20ms fade in
5. loudnorm
6. 末尾無音を100〜150msに調整
7. 10〜20ms fade out
8. 出力ファイル保存
9. QAログ生成
```

### 21-4. 注意

FFmpeg処理をGAS内で直接行うのは難しいため、次のどれかが現実的です。

```text
- ローカルPCでPython + FFmpegを実行
- GitHub Actionsで処理
- Cloud Runに音声後処理APIを作る
- Codex/Claude Codeでローカル処理スクリプトを作る
```

---

## 22. Google Drive / URL同期の確認ポイント

`master_audio_registry.json` の `audioUrl` がすべて `null` なので、以下を確認してください。

```text
1. Google Drive上に音声ファイルが実際に保存されているか
2. ファイル名がregistryのaudioIdと一致しているか
3. saveAudioToDrive_() がURLを返しているか
4. updateAudioStatus_() がSpreadsheetにURLを書き込んでいるか
5. syncAll() がSpreadsheetのURLをregistryに反映しているか
6. outdatedエントリを除外しているか
7. build-embedded-data.py が最新registryを読んでいるか
```

---

## 23. 生成対象のフィルタリングルール

今後の生成対象は以下のように明確化するべきです。

### 23-1. 生成するもの

```text
status が空、pending、needs_fix、regenerated待ち
かつ
status != outdated
かつ
audioUrl が null または forceRegenerate = true
```

### 23-2. 生成しないもの

```text
status = outdated
audioUrl があり qaStatus = checked
非表示・削除予定の例文
旧バージョンの会話文
```

### 23-3. 疑似コード

```javascript
function shouldGenerateAudio_(entry) {
  if (entry.status === "outdated") return false;
  if (entry.qaStatus === "checked" && entry.audioUrl) return false;
  if (entry.audioUrl && !entry.forceRegenerate) return false;
  return true;
}
```

---

## 24. TTSモデル自体の評価

### 24-1. Google Cloud TTS WaveNet-Bは短期的には妥当

現在選んでいる `ja-JP-Wavenet-B` は、以下の点で妥当です。

```text
- GASから呼び出しやすい
- Google Cloud内で管理しやすい
- 無料枠が大きい
- 日本語対応
- 教材用として明瞭
```

### 24-2. ただし、ピッチアクセントは完全ではない

WaveNetに移行しても、日本語ピッチアクセントが常に教材品質になるとは限りません。

特に以下は要注意です。

```text
- 助詞：は、が、を、に
- 疑問文：何ですか、どれですか
- 外来語：サッカー、ギター、コンビニ
- 固有名詞：ケリー、タノム、アインシュタイン
- 形容詞：暖かい、面白い
- 時間表現：今日、金曜
```

### 24-3. 将来比較候補

以下は中長期で比較する価値があります。

| 候補 | 長所 | 注意点 |
|---|---|---|
| Google Neural2 | より自然な可能性 | 無料枠が少なめ |
| Google Chirp 3 HD | 高品質の可能性 | 仕様・料金・GAS適性確認が必要 |
| Azure TTS | 日本語品質が高い可能性 | 別クラウド管理が必要 |
| VOICEVOX | ピッチ・日本語らしさに強い | サーバー構築が必要 |
| AivisSpeech | 品質期待値が高い | 運用設計が必要 |

---

## 25. イントネーション改善方針

### 25-1. まずはTTS変更ではなくデータ設計を改善

イントネーション問題は、TTSモデルだけでなく、入力テキスト設計でも改善できます。

改善順序：

```text
1. 表示用テキストと読み上げ用テキストを分ける
2. 読み間違いが出る語に textToSpeak を設定
3. 会話文に適切な区切りを入れる
4. 問題語だけSSML化
5. それでも不自然なものだけ別モデルで比較
```

### 25-2. 会話文の注意

現在の例文には、以下のような会話形式があります。

```text
これは何ですか。— これは消しゴムです。
```

TTSにそのまま渡すと、ダッシュ記号や会話の間が不自然になる可能性があります。

改善案：

```xml
<speak>
  これは何ですか。<break time="400ms"/>
  これは消しゴムです。
</speak>
```

または、会話文は1ファイルではなく、話者ごとに分ける設計も検討できます。

---

## 26. 今後の実行順序

### Phase 1：緊急修正

```text
1. generateAudio.gsでCloud TTS音声をbuildWavBlob_()に渡さないよう修正
2. 10件程度を再生成
3. nested WAV headerが消えたか確認
4. 冒頭ノイズが消えたか試聴
5. 問題なければ全件再生成
```

### Phase 2：同期・レジストリ修正

```text
1. Spreadsheetの生成状況を確認
2. active/outdated件数を整理
3. syncAll() を実行
4. master_audio_registry.jsonにaudioUrlが入るか確認
5. 件数チェックを自動化
```

### Phase 3：音声後処理

```text
1. Python/FFmpegスクリプトを作成
2. loudnormを適用
3. fade in/outを適用
4. 末尾無音を調整
5. QAログを出力
```

### Phase 4：教材品質チェック

```text
1. 単語音声を試聴
2. 不自然な語をneeds_fixにする
3. textToSpeakまたはSSMLで補正
4. 再生成
5. checkedに変更
```

### Phase 5：将来改善

```text
1. Neural2 / Chirp 3 HD / VOICEVOXなどで比較サンプルを作る
2. 料金・運用・品質を比較
3. 辞書サイト公開前に最終音声仕様を決める
```

---

## 27. 完了判定チェックリスト

### 27-1. WAV構造

```text
[ ] 生成済みWAV内に2つ目の RIFF ヘッダーがない
[ ] 冒頭のクリック音が消えている
[ ] sample rate が想定どおり
[ ] channel count が想定どおり
[ ] ファイルが通常のプレイヤーで正常再生できる
```

### 27-2. 音量

```text
[ ] 音声ごとの聞こえ方が大きく違わない
[ ] loudnorm適用済み
[ ] peakが0 dBFS付近でクリップしていない
[ ] 小さい単語と大きい単語の差が許容範囲内
```

### 27-3. 無音・ノイズ

```text
[ ] 冒頭ノイズがない
[ ] 冒頭に不自然な長い無音がない
[ ] 末尾無音が長すぎない
[ ] fade in/outでクリックが抑えられている
```

### 27-4. レジストリ

```text
[ ] active件数が正しい
[ ] outdated件数が正しい
[ ] audioUrlがactiveエントリに入っている
[ ] outdatedエントリに新規音声が生成されていない
[ ] HTMLビルド用データにURLが反映されている
```

### 27-5. 教材品質

```text
[ ] 単語音声が自然
[ ] 例文音声が自然
[ ] 疑問文のイントネーションが不自然でない
[ ] 助詞の高低が極端におかしくない
[ ] 固有名詞・外来語の読みが正しい
```

---

## 28. 次にClaude Code / Codexへ依頼する場合のプロンプト例

```text
以下のプロジェクトでは、Google Apps ScriptでGoogle Cloud Text-to-Speech APIを呼び出し、日本語教材用の単語・例文音声をWAV生成しています。

現在、生成されたWAVファイルを確認したところ、すべてのファイルでWAVヘッダーが二重化していることが分かりました。原因は、Google Cloud TTSのaudioContentを生PCMとして扱い、既存のbuildWavBlob_()で再度WAVヘッダーを付けていることだと考えています。

対応してほしいこと：
1. generateAudio.gsを確認し、Google Cloud TTSのaudioContentをbuildWavBlob_()に渡していないか確認してください。
2. Cloud TTS用には、base64Decodeしたbytesをそのまま audio/wav Blob として保存する処理に変更してください。
3. 変数名 pcmBase64 は audioBase64 に変更してください。
4. buildWavBlob_() は生PCM専用であることが分かる名前・コメントに変更してください。
5. outdatedエントリを生成対象から除外してください。
6. 生成後にnested WAV headerを検出する簡易検証関数を追加してください。
7. 修正後、10件だけテスト生成し、WAV内部に2つ目のRIFFがないことを確認してください。

既存のDrive保存、Spreadsheet更新、syncAllの仕組みはできるだけ壊さないでください。
```

---

## 29. 最終結論

現在のワークフローは、全体設計の方向性は悪くありません。

特に以下は良い判断です。

```text
- Gemini TTSからGoogle Cloud TTSへ移行したこと
- GASパイプラインを維持していること
- textToSpeakを残していること
- 将来VOICEVOX/AivisSpeechも比較対象にしていること
```

しかし、現時点で最も大きな問題は以下です。

```text
Google Cloud TTSから返ってきた音声を、既存のbuildWavBlob_()で再度WAV化しているため、WAVヘッダーが二重化し、冒頭ノイズが発生している可能性が高い。
```

したがって、最初にやるべきことはTTSモデルの再検討ではありません。

最優先は次の修正です。

```text
Cloud TTSのaudioContentをそのまま audio/wav Blob として保存する。
```

その後、以下を順番に進めるべきです。

```text
1. 二重WAVヘッダー修正
2. 全音声の再生成
3. audioUrl同期の確認
4. 音量正規化
5. fade in/out・末尾無音調整
6. SSMLによる問題語の補正
7. 品質レビュー体制の追加
```

この順番で進めれば、現在のワークフローは「大量に音声を生成する仕組み」から、「教材品質の音声を安定して量産する仕組み」に近づけられます。

---

## 30. 付録：このチャットで作成された参考ファイル

このチャットでは、検証用として二重WAVヘッダーを取り除いた修正版サンプルZIPも作成済みです。

```text
repaired_audio_samples.zip
```

このZIPは恒久的な成果物ではなく、原因確認用の参考ファイルです。正式な対応としては、既存音声を修復して使い続けるより、`generateAudio.gs` を修正したうえで全件再生成することを推奨します。
