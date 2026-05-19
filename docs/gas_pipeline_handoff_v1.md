# 引き継ぎ資料：マルチメディア資産自動生成パイプライン設計
**作成日：2026-05-15**
**目的：GAS + Google AI Studio 無料枠を使った画像・音声の自動生成システム設計**
**関連プロジェクト：japanese-lesson-creator（教材生成ツール）・日本語辞書サイト（計画中）**

> ⚠️ **音声パイプライン記述は旧仕様（Gemini TTS / 10件/日 / .mp3）。**
> **現行仕様・バグ修正記録は handoff_v4_4.md §14 を参照してください。**
> - 現行音声API：Google Cloud TTS WaveNet（ja-JP-Wavenet-B）
> - 現行バッチ上限：50件/回（MAX_BATCH_SIZE）
> - 現行ファイル形式：.wav（LINEAR16）
> - WAVヘッダー二重化バグ修正済み（buildCloudTtsWavBlob_()）— v4.3以前の音声ファイルは使用不可

---

## このドキュメントの位置づけ

現在進行中の `japanese-lesson-creator` プロジェクト（Claude Codeで実装中）とは**別ルート**で進める作業。
語彙・例文に紐づく画像・音声を自動生成・蓄積するパイプラインを設計・実装する。

---

## 背景と目的

### 現状

```
lesson_01.json に17語の語彙があるが、すべての画像が揃っているわけではない
master_image_registry.json に imageId → Google Drive URL が登録されている
master_audio_registry.json は新規作成済み（全エントリ audioUrl: null）
```

### 目的

```
【短期】
  lesson_01〜NN の語彙・例文画像・音声を揃える
  → 教材生成ツールのスライド・宿題HTMLで正しく表示・再生される

【中長期】
  N5〜N1の全JLPT語彙の画像・音声を蓄積する
  → 日本語辞書サイトのコンテンツ基盤になる
  → データ・API販売（B2B）の資産になる
```

---

## 確定した API 制限（Google AI Studio 無料枠）

Google AI Studio のレート制限ページで実際に確認した値：

| モデル | 用途 | RPD（1日上限）| 備考 |
|---|---|---|---|
| Imagen 4 Generate | 画像生成 | **25件/日** | 無料枠 |
| Imagen 4 Fast Generate | 画像生成（高速） | **25件/日** | 無料枠 |
| ~~Gemini 2.5 Flash TTS~~ | ~~音声生成~~ | ~~**10件/日**~~ | ~~無料枠~~ → **現行は Google Cloud TTS WaveNet（GCP_TTS_KEY）を使用** |
| ~~Gemini 3.1 Flash TTS~~ | ~~音声生成~~ | ~~**10件/日**~~ | ~~無料枠~~ → **現行は不使用** |
| Gemma 4 26B | テキスト処理 | **1,500件/日** | 無料枠・TPM無制限 |
| Gemini 3.1 Flash Lite | テキスト処理 | **500件/日** | 無料枠 |

**重要な訂正：** 画像生成は1,500件/日ではなく **25件/日** が正しい値。

---

## 現実的なスケジュール

### 画像生成（25件/日）

| 対象 | 語彙数 | 必要日数 |
|---|---|---|
| N5 | 約800語 | 約32日 |
| N5 + N4 | 約2,300語 | 約92日 |
| N5 + N4 + N3 | 約6,000語 | 約240日 |

GASのタイマートリガーで毎日自動実行すれば、放置するだけで積み上がる。

### ~~音声生成（10件/日）~~ → 現行: 50件/回（Google Cloud TTS WaveNet）

> ⚠️ 以下のスケジュール試算は旧仕様（Gemini TTS 10件/日）に基づくため参考値です。
> 現行は MAX_BATCH_SIZE=50 のため約16倍の速度で処理可能です。

| 対象 | 語彙数 | 必要日数 |
|---|---|---|
| N5 | 約800語 | ~~約80日~~ → 現行: 約16日 |
| 例文（lesson_01） | 15件 | ~~2日~~ → 現行: 当日中 |

~~画像より遅いが、無料で高品質な音声が蓄積できる。~~
→ 現行は Google Cloud TTS WaveNet を使用（GCP 請求あり・高品質WAV）。

---

## システム設計

### 全体構成

```
【SSOT：Googleスプレッドシート】
  Vocabulary シート：word / reading / en / jlptLevel / pos
                     imageId / imageStatus / imageUrl
                     audioId / audioStatus / audioUrl
  Examples シート：  no / lessonNo / patternNo / sentence / sentenceEn
                     imageId / imageStatus / imageUrl
                     audioId / audioStatus / audioUrl
  Log シート：       date / type / id / status / error

         ↓ GASが毎日読む
【GAS スクリプト群】
  generateImages.gs  → Imagen 4 API（25件/日）
  ~~generateAudio.gs   → Gemini TTS API（10件/日）~~
  → 現行: generateAudio.gs → Google Cloud TTS WaveNet（50件/回・WAV/LINEAR16）
  textAssist.gs      → Gemma 4 API（1,500件/日）
  syncRegistries.gs  → JSON更新

         ↓ 生成結果を保存
【Google Drive】
  images/ フォルダ：  word_医者.png, word_先生.png ...
  audio/ フォルダ：   ~~word_医者.mp3, word_先生.mp3 ...~~ → 現行: word_医者.wav, word_先生.wav（WAV / LINEAR16）

         ↓ レジストリに反映
【master_image_registry.json】  → japanese-lesson-creatorで参照
【master_audio_registry.json】  → 宿題HTML・辞書サイトで参照
```

---

## スプレッドシート設計

### Vocabulary シート（語彙データベース）

| 列 | フィールド | 例 | 備考 |
|---|---|---|---|
| A | word | 医者 | 漢字表記 |
| B | reading | いしゃ | ひらがな |
| C | en | doctor | 英語訳 |
| D | jlptLevel | N5 | N5〜N1 |
| E | pos | noun | 品詞 |
| F | vocab_type | person | **master_prompt_design_guide のテンプレート選択に使用** |
| G | imageId | word_医者 | master_image_registry のキー |
| H | imageStatus | generated | pending / generated / failed |
| I | imageUrl | https://drive... | 生成後に自動入力 |
| J | audioId | word_医者 | master_audio_registry のキー |
| K | audioStatus | pending | pending / generated / failed |
| L | audioUrl | null | 生成後に自動入力 |
| M | lessonRef | lesson_01 | どの課で使われるか（任意） |

### vocab_type の値（master_prompt_design_guide_v2_5.py 準拠）

| vocab_type | 対応テンプレート | 例 |
|---|---|---|
| person | A | 医者・先生・学生 |
| building | B | 病院・学校・銀行・大学・デパート |
| concrete_object | D | 本・ペン・財布 |
| action_verb | H | 食べる・飲む・読む |
| adjective | J | 大きい・小さい・新しい |
| abstract_concept | I | 時間・気持ち・自由 |
| spatial_relation | F | 上・下・右・左 |
| demonstrative | G | これ・それ・あれ |

### 優先度の設定方法

`jlptLevel` でソートし、N5 → N4 → N3 の順に `imageStatus=pending` の行から処理する。
`lessonRef` が入っている語彙（教材で実際に使う語）を最優先にする。

---

## GASスクリプト設計

### generateImages.gs

```javascript
function generateDailyImages() {
  const LIMIT = 24; // 安全マージン1件残す
  const sheet = getSheet('Vocabulary');
  const pendingRows = getPendingRows(sheet, 'imageStatus', LIMIT);
  
  pendingRows.forEach(row => {
    try {
      const prompt = buildImagePrompt(row.word, row.reading, row.en, row.jlptLevel);
      const imageBlob = callImagenAPI(prompt);
      const driveUrl = saveToGoogleDrive(imageBlob, `word_${row.word}.png`, 'images');
      
      updateCell(sheet, row.index, 'imageUrl', driveUrl);
      updateCell(sheet, row.index, 'imageStatus', 'generated');
      logSuccess('image', row.word);
      
    } catch(e) {
      updateCell(sheet, row.index, 'imageStatus', 'failed');
      logError('image', row.word, e.message);
    }
    
    Utilities.sleep(2500); // レート制限対策
  });
}
```

### ~~generateAudio.gs~~ （以下は旧仕様の疑似コード。現行は generateAudio.gs v3.0 / Google Cloud TTS WaveNet / WAV / buildCloudTtsWavBlob_() 使用）

```javascript
// ⚠️ 以下は旧仕様（Gemini TTS / .mp3 / LIMIT=9）の参考コードです。
// 現行仕様は handoff_v4_4.md §14 を参照してください。
function generateDailyAudio() {
  const LIMIT = 9; // ← 旧仕様。現行は MAX_BATCH_SIZE=50
  const sheet = getSheet('Vocabulary');
  const pendingRows = getPendingRows(sheet, 'audioStatus', LIMIT);
  
  pendingRows.forEach(row => {
    try {
      // 読みがな（ひらがな）で読み上げ
      const audioBlob = callGeminiTTSAPI(row.reading);  // ← 旧仕様。現行は callGoogleCloudTTS_()
      const driveUrl = saveToGoogleDrive(audioBlob, `word_${row.word}.mp3`, 'audio');  // ← 旧.mp3。現行は.wav
      
      updateCell(sheet, row.index, 'audioUrl', driveUrl);
      updateCell(sheet, row.index, 'audioStatus', 'generated');
      logSuccess('audio', row.word);
      
    } catch(e) {
      updateCell(sheet, row.index, 'audioStatus', 'failed');
      logError('audio', row.word, e.message);
    }
    
    Utilities.sleep(6000); // ← 旧仕様。現行は DELAY_MS=1000ms
  });
}
```

### syncRegistries.gs

```javascript
function syncMasterRegistries() {
  // スプレッドシートの generated 行を読んで
  // master_image_registry.json と master_audio_registry.json を更新する
  const vocabRows = getGeneratedRows('Vocabulary');
  
  const imageRegistry = buildImageRegistry(vocabRows);
  const audioRegistry = buildAudioRegistry(vocabRows);
  
  saveJsonToDrive(imageRegistry, 'master_image_registry.json');
  saveJsonToDrive(audioRegistry, 'master_audio_registry.json');
}
```

---

## プロンプトテンプレート（スタイル仕様）

**`master_prompt_design_guide_v2_5.py` がこのパイプラインのプロンプト設計のSSOTです。**

このファイルには以下が定義されており、GASスクリプトはここから読み取って自動でプロンプトを組み立てます。

```
STYLE_BIBLE        → 全画像共通の固定フレーズ（変更厳禁）
                     Double-Hex Anchoring カラーパレット
                     focal_length_standards（人物/物体別）

テンプレートA〜J    → vocab_typeごとの最適プロンプト構造
                     A: person / B: building / C: example_sentence
                     D: concrete_object / H: action_verb
                     J: adjective / F: spatial / G: demonstrative

NAMED_CHARACTER_PROFILES → lesson_01 の5名のビジュアルプロファイル
                           鈴木さん・リンさん・ケリーさん・キムさん・タノムさん

GEMINI_STABILIZATION    → APIの安定生成ルール・セッション管理

QA_CHECKLIST           → 生成後の品質チェック基準
```

### GASでのプロンプト自動組み立てフロー

```javascript
function buildImagePrompt(row) {
  // 1. vocab_typeでテンプレートを選択
  const template = selectTemplate(row.vocab_type);  // A〜J

  // 2. STYLE_BIBLEの固定フレーズを取得（変更不可）
  const styleCore = STYLE_BIBLE.core_style;
  const colorSpec = STYLE_BIBLE.color_palette;

  // 3. テンプレートに語彙情報を埋め込む
  return template
    .replace('{WORD}', row.word)
    .replace('{READING}', row.reading)
    .replace('{EN}', row.en)
    .replace('{STYLE_RECIPE}', styleCore);
}
```

**この設計により、新しい語彙が追加されても `vocab_type` を設定するだけで正しいプロンプトが自動生成されます。**

---

## タイマートリガー設定

GASのトリガー画面で以下を設定する：

| 関数名 | 実行タイミング | 説明 |
|---|---|---|
| `generateDailyImages` | 毎日 午前9:00 | 画像を24件生成 |
| ~~`generateDailyAudio`~~ → 現行: `generateAudioBatch` | 毎日 午前10:00 | ~~音声を9件生成~~ → 現行: 最大50件生成（Google Cloud TTS WaveNet / WAV） |
| `syncMasterRegistries` | 毎日 午後11:00 | レジストリをJSON化して保存 |

---

## japanese-lesson-creator との連携

現在のプロジェクトでは `master_image_registry.json` を `data/` フォルダに置いてビルドしている。
このパイプラインが `master_image_registry.json` を更新したら、プロジェクト側では `build-embedded-data.py` を実行するだけで新しい画像が教材に反映される。

```
【更新フロー】
GASパイプライン（毎日）
  → master_image_registry.json を更新
  → master_audio_registry.json を更新

japanese-lesson-creator（必要時）
  → data/ フォルダのJSONを上記から取得して上書き
  → python scripts/build-embedded-data.py
  → 新しい語彙画像・音声が教材HTMLに反映
```

---

## Gemma 4 / Gemini 3.1 Flash Lite の活用場面

| 用途 | モデル | 具体例 |
|---|---|---|
| 英語訳の品質チェック | Gemma 4 26B | 「いしゃ」→「doctor」が適切か確認 |
| canDo文の生成補助 | Gemma 4 26B | lesson_02以降のcanDo文の初稿生成 |
| practiceTemplates生成 | Gemma 4 26B | 文型から練習問題テンプレートを生成 |
| 例文の自然さチェック | Gemini 3.1 Flash Lite | 例文が不自然でないか確認 |
| audioプロンプト最適化 | Gemini 3.1 Flash Lite | TTS用の読み上げテキスト調整 |

---

## 次チャットで決めること

1. **スプレッドシートの初期データ入力方法**
   - N5語彙リストをどこから取得するか（既存の `vocab_lesson1.json` の Goi_Listから？）
   - lesson_01.json の17語を最初のシードデータとして入力

2. **既存 GAS_Lesson_ImageGenerator_v5.gs との関係**
   - 既存スクリプトを改修するか、新規に作るか
   - 現在のスクリプトの仕組みを確認してから判断

3. **Google Drive のフォルダ構成**
   - images/ と audio/ をどのフォルダIDに紐づけるか

4. **registryのJSON形式**
   - 現在の `master_image_registry.json` のスキーマに合わせる必要あり
   - `master_audio_registry.json` は新規のため設計の自由度あり

---

## アップロード推奨ファイル（次チャット開始時）

- この資料（`gas_pipeline_handoff_v1.md`）
- `master_prompt_design_guide_v2_5.py`（プロンプト設計のSSOT・**最重要**）
- `GAS_Lesson_ImageGenerator_v5.gs`（現在のスクリプトを確認するため）
- `master_image_registry.json`（現在のスキーマ確認のため）
- `image_prompts_lesson1_v7.json`（現在のプロンプト実例確認のため）

※ `master_audio_registry.json` は `data/` フォルダに存在することを確認済み。スキーマ確認が必要な場合は追加でアップロードする。

---

*資料バージョン：v1.0（2026-05-15）*
