# 引き継ぎ資料：音声生成パイプライン専用
**バージョン：v2.0（2026-05-18）**
**前資料：audio_workflow_handoff_2026-05-18.md（ChatGPT作成版）**
**このバージョンで追加した内容：Claude による実ファイル分析・GASバグ修正（Phase 1）完了・Phase 2〜4 未対応として記録**

---

## ⛔ このドキュメントの編集ルール（次チャットの Claude へ）

- 各セクションは**追記のみ・削除禁止**
- 「対応済み」「未対応」の区分は必ず明記すること
- Phase が完了したら該当行に ✅ を付けてステータスを更新すること
- 前バージョンより短くなる場合は必ず理由を §8 に記録すること

---

## §1. パイプライン全体像

```
Google Sheets（SSOT）
  ↓
generateAudio.gs（GAS）
  ↓
Google Cloud TTS API（ja-JP-Wavenet-B）
  ↓
WAV音声生成・Google Drive audio/ フォルダに保存
  ↓
Spreadsheetに audioStatus / audioUrl を書き戻し
  ↓
syncAll()（syncRegistries.gs）
  ↓
master_audio_registry.json 更新
  ↓
build-embedded-data.py（手動実行）
  ↓
宿題HTML・教材ページへ音声URLを埋め込み
```

### 確定済み設定値（変更不要）

| 項目 | 値 |
|---|---|
| SPREADSHEET_ID | `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` |
| AUDIO_REGISTRY_ID | `1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0` |
| VOICE_NAME | `ja-JP-Wavenet-B` |
| LANGUAGE_CODE | `ja-JP` |
| AUDIO_ENCODING | `LINEAR16`（WAV形式で返ってくる） |
| SAMPLE_RATE | `24000` Hz |
| MAX_BATCH_SIZE | `50` 件/回 |
| DELAY_MS | `1000` ms |

### 自動タイマートリガー（稼働中）

| 関数 | 実行時刻 |
|---|---|
| `generateAudioBatch` | 毎日 10:00 |
| `syncAll` | 毎日 23:00 |

---

## §2. 問題の発端と分析経緯

### 2-1. ChatGPT による初期分析（2026-05-18）

音声ファイル10件（`word_お金.wav` 〜 `word_面白い.wav`）を ChatGPT に渡して分析。
以下の問題が指摘された。

| 指摘項目 | 詳細 |
|---|---|
| 全ファイルに二重WAVヘッダー | 冒頭ノイズの主因 |
| 音量差が最大約7dB | RMS値がファイルごとに大きくばらつく |
| 末尾無音が約200ms | 連続再生・Ankiでテンポが悪くなる |
| SSMLが未使用 | ピッチアクセント・読み方の制御ができていない |

### 2-2. Claude による独立した実ファイル分析（2026-05-18）

今回のチャットで添付された9件の新しいWAVファイルを実際に解析した結果：

| ファイル | 長さ | ピーク | RMS | 冒頭無音 | 末尾無音 |
|---|---|---|---|---|---|
| カラオケ | 0.921s | -4.3 dBFS | -20.3 dBFS | 51.4ms | 207.8ms |
| ギター | 0.823s | -9.5 dBFS | -22.4 dBFS | 9.8ms | 208.0ms |
| コンビニ | 0.862s | -4.1 dBFS | -17.3 dBFS | 50.9ms | 211.9ms |
| サッカー | 0.930s | -0.5 dBFS | -21.0 dBFS | 12.2ms | 214.0ms |
| 一年 | 0.832s | -6.1 dBFS | -18.3 dBFS | 23.0ms | 213.4ms |
| 中国人 | 1.092s | -8.7 dBFS | -19.2 dBFS | 49.4ms | 208.2ms |
| 九月 | 0.838s | -7.0 dBFS | -20.8 dBFS | 47.3ms | 210.0ms |
| 明日 | 0.739s | -3.7 dBFS | -23.1 dBFS | 17.5ms | 196.5ms |
| 終わる | 0.686s | -5.9 dBFS | -18.9 dBFS | 15.8ms | 215.8ms |

**ChatGPT評価との照合：**

| ChatGPT指摘 | Claude実測 | 一致度 |
|---|---|---|
| 全ファイル二重WAVヘッダーあり | 全9件・byte 44で確認 | ✅ 完全一致 |
| 音量差が最大7dB | 実測で最大5.8dB差 | ✅ ほぼ一致 |
| 末尾無音 約200ms | 実測 196〜216ms | ✅ 完全一致 |
| 冒頭ノイズの主因はWAV二重化 | 構造から裏付け確認 | ✅ 一致 |

---

## §3. 二重WAVヘッダーの根本原因

### 原因

`generateAudio.gs` に以下の設計上の誤りがあった。

```
Google Cloud TTS API
  ↓ audioContent を返す（← これは既にWAVヘッダー付きの完全なWAVファイル）
  ↓
callGoogleCloudTTS_() が pcmBase64 という名前で返す（← 誤解を招く変数名）
  ↓
buildWavBlob_() に渡す（← 生PCM用の関数。WAVヘッダーを新たに追加する）
  ↓
WAVヘッダーが二重化した異常なWAVファイルが保存される
```

### 具体的なコード上の問題箇所（修正前）

```javascript
// callGoogleCloudTTS_() の戻り値（問題）
return {
  success:    true,
  pcmBase64:  json.audioContent,  // ← 変数名が誤解を招く
  sampleRate: AUDIO_SETTINGS.SAMPLE_RATE,
};

// processAudioEntry_() の処理（問題）
const wavBlob = buildWavBlob_(ttsResult.pcmBase64, ttsResult.sampleRate, row.filename);
//              ^^^^^^^^^^^^ 生PCM専用の関数にWAVデータを渡している
```

---

## §4. 対応済みフェーズ

### ✅ Phase 1：GAS修正・全件再生成（2026-05-18 完了）

**実施した変更（統合スクリプト `setupSpreadsheet.gs` 内の generateAudio セクション）：**

#### 変更1：`processAudioEntry_()` の修正

```javascript
// 変更前
const wavBlob = buildWavBlob_(ttsResult.pcmBase64, ttsResult.sampleRate, row.filename);

// 変更後
const wavBlob = buildCloudTtsWavBlob_(ttsResult.audioBase64, row.filename);
validateWavStructure_(wavBlob, row.audioId, ss);
```

#### 変更2：`callGoogleCloudTTS_()` の戻り値変更

```javascript
// 変更前
return {
  success:    true,
  pcmBase64:  json.audioContent,
  sampleRate: AUDIO_SETTINGS.SAMPLE_RATE,
};

// 変更後
return {
  success:     true,
  audioBase64: json.audioContent,
  sampleRate:  AUDIO_SETTINGS.SAMPLE_RATE,
};
```

#### 変更3：`buildCloudTtsWavBlob_()` 関数を新設

```javascript
// buildWavBlob_() の直後に追加
function buildCloudTtsWavBlob_(audioBase64, filename) {
  const audioBytes = Utilities.base64Decode(audioBase64);
  return Utilities.newBlob(audioBytes, "audio/wav", filename);
}
```

#### 変更4：ユーティリティ関数2つを追加

```javascript
// resetToRegenerate() — 既存音声を全件 pending に戻す（修正後に1度だけ実行済み）
// validateWavStructure_() — 生成直後に nested WAV header を自動検出してログに残す
```

**修正後の動作確認結果（word_医者.wav）：**

```
✅ validateWav [word_医者]: WAV構造 OK
✅ 完了: word_医者.wav → https://drive.google.com/uc?id=...
```

実ファイル解析でも確認済み：
- nested RIFF：**なし**（修正前は byte 44 に存在）
- サンプルレート：24000 Hz
- ファイルサイズ：32,980 bytes（正常）

**全件再生成の状況：**
- `resetToRegenerate()` を手動実行して全件を pending に戻し済み
- `generateAudioBatch` のタイマートリガー（毎日10:00）が自動的に再生成を進めている
- 全件完了の確認方法：SpreadsheetのVocabularyシートとExamplesシートで `audioStatus` 列の `pending` がゼロになること

---

## §5. 未対応フェーズ（全件生成完了後に実施）

### ⬜ Phase 2：音量正規化（Python + FFmpeg）

**問題：**
RMSが -17.3 dBFS〜-23.1 dBFS と最大 5.8dB の差がある。
教材音声として単語を連続再生した際に学習者が感じる音量感がかなり変わる。

**推奨値：**

| 用途 | 推奨ラウドネス |
|---|---|
| 辞書サイト・単語音声 | -18 LUFS |
| Anki・短い単語音声 | -16〜-18 LUFS |
| 長めの例文 | -18 LUFS |

**実施コマンド（FFmpeg）：**

```bash
# 単語音声向け（-18 LUFS）
ffmpeg -i input.wav -af "loudnorm=I=-18:LRA=7:TP=-1.5" output.wav

# 聞き取りやすさ優先（-16 LUFS）
ffmpeg -i input.wav -af "loudnorm=I=-16:LRA=7:TP=-1.5" output.wav
```

**注意：** GAS単体では loudness normalization は不可。Python + FFmpeg が必要。

---

### ⬜ Phase 3：冒頭・末尾の調整（Python + FFmpeg）

**問題1：冒頭無音のバラつき**
9.8ms（ギター）〜51.4ms（カラオケ）と大きくばらつく。
50ms前後のファイルが複数あり（カラオケ・コンビニ・中国人・九月）、
再生してもすぐ声が来ない印象につながる。

**問題2：末尾無音が長め・均一**
全ファイルで末尾無音が196〜216ms と均一に長い。
辞書サイト・連続再生・Ankiでテンポが悪くなる。

**推奨値：**

| 用途 | 末尾無音の目安 |
|---|---|
| 単語音声 | 100〜150ms |
| 例文音声 | 150〜250ms |

**実施コマンド（FFmpeg）：**

```bash
# fade in 20ms + loudnorm 組み合わせ
ffmpeg -i input.wav -af "afade=t=in:st=0:d=0.02,loudnorm=I=-18:LRA=7:TP=-1.5" output.wav
```

**理想処理順序（Phase 2と合わせて一括実施推奨）：**

```
1. WAV構造チェック（nested header 残存確認）
2. 先頭無音トリム
3. 10〜20ms fade in
4. loudnorm（-18 LUFS）
5. 末尾無音を 100〜150ms に調整
6. 10〜20ms fade out
7. QAログ出力（duration / peak / RMS / leading silence / trailing silence）
```

---

### ⬜ Phase 4：SSMLによるアクセント補正

**問題：**
現在は `input: { text: text }` でテキストをそのまま渡している。
ピッチアクセント・読み方・ポーズの制御ができない。

**SSML対象になりやすい語（今回のサンプルより）：**

| 語 | 懸念点 |
|---|---|
| 明日 | アクセント型がTTSで不安定になりやすい |
| 一年 | 数詞のアクセントは文脈依存 |
| 九月 | 同上 |
| 終わる | 動詞のアクセントは単語単体と文中で変わりやすい |
| 中国人 | 複合語のアクセント |

**実施手順：**

```
1. 全件生成後に音声を試聴
2. 不自然な語をスプレッドシートで needs_fix に変更
3. 問題語に対して SSML を設定
4. 再生成
```

**SSML使用例（GASコード）：**

```javascript
// テキストをそのまま渡す場合（現在）
input: { text: text }

// SSML を使う場合
input: { ssml: "<speak>" + ssml + "</speak>" }

// 会話文のポーズ例
const ssml = `これは何ですか。<break time="400ms"/>これは消しゴムです。`;
```

---

## §6. 将来の改善候補（優先度：低）

### TTSプロバイダ比較候補

現在の `ja-JP-Wavenet-B` は短期的には妥当だが、N5全語彙完了後に以下と比較検討する。

| 候補 | 長所 | 注意点 |
|---|---|---|
| Google Neural2 | より自然な可能性 | 無料枠が少なめ |
| Google Chirp 3 HD | 高品質の可能性 | 仕様・料金確認が必要 |
| VOICEVOX | ピッチ・日本語らしさに強い | サーバー構築が必要（GASから直接呼べない） |
| AivisSpeech | 品質期待値が高い | 運用設計が必要 |

### 品質管理ステータスの拡充（将来）

現在は `pending / generated / failed` のみ。
将来的には以下を追加推奨：

| status | 意味 |
|---|---|
| `checked` | 試聴済み・問題なし |
| `needs_fix` | 問題あり・再生成必要 |
| `outdated` | 古い例文・使用しない（現在も存在） |

---

## §7. 完了判定チェックリスト

### Phase 1（✅ 完了）

```
[✅] generateAudio.gs の buildCloudTtsWavBlob_() を使う修正が適用された
[✅] word_医者.wav でnested WAV が検出されなかった
[✅] validateWav: WAV構造 OK がログに出た
[✅] resetToRegenerate() を実行して全件 pending に戻した
[  ] 全件の audioStatus が generated になった（自動進行中）
[  ] syncAll() が実行されて audioUrl が registry に反映された
```

### Phase 2・3（⬜ 未着手）

```
[  ] Python/FFmpeg スクリプトが作成された
[  ] loudnorm が全ファイルに適用された
[  ] ファイルごとの聞こえ方の差が許容範囲内になった
[  ] fade in/out が適用された
[  ] 末尾無音が 100〜150ms に揃った
[  ] QAログが出力された
```

### Phase 4（⬜ 未着手）

```
[  ] 全件音声を試聴した
[  ] 不自然な語のリストを作成した
[  ] SSML を設定して再生成した
[  ] 再生成後に試聴して OK を確認した
```

---

## §8. このバージョンで判明したこと・追記事項

- **2026-05-18**：ChatGPTが指摘した二重WAVヘッダー問題をClaudeが独立して実ファイル（9件）で再現・確認した。byte 44 という共通の位置で nested RIFF が検出され、原因の推定（buildWavBlob_() の誤用）が正しかったことが裏付けられた。

- **2026-05-18**：GAS統合スクリプト（`setupSpreadsheet.gs`）内の generateAudio セクションを修正。`testSingleAudio()` で `word_医者.wav` を生成し、実ファイル解析でも nested RIFF がゼロであることを確認した。修正は成功。

- **2026-05-18**：Phase 2（音量正規化）・Phase 3（fade in/out・末尾無音調整）は全件生成完了後に Python/FFmpeg で一括実施する設計とした。GAS単体では loudness normalization は不可であることを確認。

- **2026-05-18**：Phase 4（SSML対応）は試聴ベースで問題語を特定してから実施。全件生成完了前には着手しない。

---

## §9. 次のチャットへの引き継ぎ

### 次に着手すること

```
1. SpreadsheetでaudioStatusのpendingがゼロになったことを確認
2. syncAll() を実行（または自動実行されるのを待つ）
3. master_audio_registry.json の audioUrl が入っているか確認
4. Phase 2・3 の Python/FFmpeg スクリプトを Claude に作成してもらう
5. スクリプトをローカルPCまたはCloud環境で実行
6. Phase 4（SSML）は試聴後に着手
```

### 次チャットへ渡すべき情報

- このファイル（`audio_pipeline_handoff_v2_0.md`）
- 統合スクリプトの最新版（修正済みのもの）
- 必要であれば `master_audio_registry.json`（audioUrlが入った状態）

### Phase 2・3 の Python/FFmpeg スクリプト依頼プロンプト例

```
音声生成パイプラインの後処理Pythonスクリプトを作成してください。
引き継ぎ資料 audio_pipeline_handoff_v2_0.md を参照してください。

対象：Google Drive の audio/ フォルダにある WAV ファイル全件
処理内容：
  1. nested WAV header の残存確認（あれば警告ログ）
  2. 先頭無音トリム
  3. fade in 20ms
  4. loudnorm（I=-18:LRA=7:TP=-1.5）
  5. 末尾無音を 130ms に調整
  6. fade out 20ms
  7. QAログ出力（ファイル名・duration・peak・RMS・処理前後の比較）

実行環境：ローカルPC（Python 3.x + FFmpeg インストール済み想定）
入力フォルダ：./audio_input/
出力フォルダ：./audio_output/
```
