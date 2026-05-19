# 引き継ぎ資料：GASパイプライン セットアップ完了 + 残課題
**バージョン：v7.0（2026-05-16）**
**前バージョン：gas_pipeline_handoff_v6.md**

---

## このプロジェクトの位置づけ（毎回確認）

```
【japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTMLを生成するWebツール
  → Plan_v1_1.md に従って Stage を進行中

【GASパイプライン】（本資料のスコープ）
  語彙・例文の画像・音声を自動生成してGoogle Driveに蓄積する
  → master_image_registry.json / master_audio_registry.json にURLを記録

【連携インターフェース】
  master_image_registry.json → image_resolver.js → slide_html.js
  master_audio_registry.json → homework_html.js（将来）
```

---

## 現在の状態（2026-05-16 深夜時点）

### ✅ 完了済み

| ステップ | 内容 | 状態 |
|---|---|---|
| setupAll() | Vocabulary / Examples / Log シート作成 | ✅ 完了 |
| seedAll() | lesson_01 語彙17語・例文15件投入 | ✅ 完了（※修正あり→後述）|
| extractN5() | N5語彙412語追加 | ✅ 完了 |
| importLesson01() | 国籍語彙7語（全て既存でスキップ） | ✅ 完了 |
| タイマートリガー登録 | 4本すべて登録済み | ✅ 完了 |

### 🔄 自動実行中（タイマーで進行中）

| トリガー | 関数 | 頻度 | 状態 |
|---|---|---|---|
| classifyBatch | Gemma 4 で en/vocab_type を付与 | **毎時** | 🔄 実行中（エラーあり→後述） |
| generateImageBatch | Imagen 4 で語彙画像を生成 | 毎日9:00 | 🔄 待機中 |
| generateAudioBatch | Gemini TTS で音声を生成 | 毎日10:00 | 🔄 待機中 |
| syncAll | registry.json に書き戻し | 毎日23:00 | 🔄 待機中 |

### ⬜ 未着手（次チャットで対応）

- `generateImages.gs` の STYLE_RECIPE 完全化（後述）
- `setupExamplesSheet` の `insertCheckboxes` 問題の根本修正（後述）
- 画像生成の動作確認（`testSingleImage()` 実行）

---

## このチャットで発生した問題と解決策（全件）

### 問題① ファイル構成の方針ミス

**発生した問題：**
- 最初「ファイルを分けることを推奨」と案内したが、GASで複数ファイルに分けると同一スコープを共有するため、同名関数が重複してエラーになることを見落としていた。
- 重複していた関数：`appendVocabRows_`、`getExistingWords_`（extractFromGoiList.gs と importFromLessonJson.gs の両方に存在）

**解決策：**
- 全スクリプトを**1ファイル（setupSpreadsheet.gs）に統合**した。
- GOI用の書き込み関数を `appendGoiVocabRows_` にリネーム（importFromLessonJson側は `appendVocabRows_` のまま）。

**現在の正しい関数名：**

| 関数名 | 用途 | 呼び出し元 |
|---|---|---|
| `appendGoiVocabRows_(sheet, entries)` | Goi_List語彙の書き込み（`e.level`, `e.pos1` を使う） | `runExtract_()` |
| `appendVocabRows_(sheet, entries)` | lesson JSON語彙の書き込み（`e.jlptLevel`, `e.pos` を使う） | `importByFileId()` |

---

### 問題② Examples データが1001行目から書き込まれた

**原因：**
- `setupExamplesSheet()` で `sheet.getRange(2, 9, 999, 1).insertCheckboxes()` を実行すると、GASが「2〜1000行目は使用中」と判断する。
- その結果 `appendRow()` が1001行目から書き込んでしまった。

**解決策（応急処置）：**
以下の `fixExamplesData()` 関数を実行してデータを2行目に移動した：

```javascript
function fixExamplesData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Examples");
  const lastRow = sheet.getLastRow();
  const numRows = lastRow - 1000;
  const data = sheet.getRange(1001, 1, numRows, 9).getValues();
  sheet.getRange(1001, 1, numRows, 9).clearContent();
  sheet.getRange(2, 1, numRows, 9).setValues(data);
  Logger.log("✅ 完了: " + numRows + "行を2行目に移動しました");
}
```

**根本修正（次チャットで対応）：**
`setupExamplesSheet()` から `insertCheckboxes()` の行を削除し、`seedExamples()` の `appendRow()` の直後にチェックボックスを1行ずつ追加する方式に変更する。

```javascript
// setupExamplesSheet() から削除
sheet.getRange(2, 9, 999, 1).insertCheckboxes();  // ← この行を削除

// seedExamples() の appendRow の後に追加
sheet.appendRow(row);
sheet.getRange(sheet.getLastRow(), 9).insertCheckboxes();  // ← 追加
```

---

### 問題③ Goi_List.pdf が本物のPDFだった

**原因：**
- Google Driveにアップロードしたファイルが実際のPDF（バイナリ）だった。
- コードが期待するのはテキスト形式（拡張子は.pdfだが中身はテキスト）。

**確認方法：**
- `testGoiListRead()` 実行で先頭行が `%PDF-1.7` なら本物のPDF → NG
- 先頭行が `No 標準的な表記...` なら正しいテキスト形式 → OK

**解決策：**
- プロジェクトナレッジにある `/mnt/project/Goi_List.pdf`（テキスト形式）をダウンロードしてDriveに再アップロードした。
- 新しいファイルID：`1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA`（`GOI_LIST_FILE_ID` に設定済み）

---

### 問題④ モデル名の変更（2件）

#### ④-a Gemma 4 テキスト分類モデル

| 変更前 | 変更後 |
|---|---|
| `gemma-4-26b-it` | `gemma-4-26b-a4b-it` |

`CLASSIFY_SETTINGS.MODEL` を変更済み。

#### ④-b Imagen 4 画像生成モデル

| 変更前 | 変更後 |
|---|---|
| `imagen-4.0-generate-exp` | `imagen-4.0-generate-001` |

`IMAGE_SETTINGS.MODEL` を変更済み。

**⚠️ 注意：次チャット開始時に必ず確認すること。**
モデル名は今後も変更される可能性がある。エラーが出たら最新のモデル名をGoogle AI Studioで確認する。

---

### 問題⑤ classifyBatch の JSON パース失敗

**原因：**
- Gemma 4 が「thinking mode」で思考テキスト（Self-Correction: ...）を余分に出力する。
- パーサーが `{...}` を抽出する際にその思考テキスト内の `}` を誤認識してパースに失敗する。

**ログでの見え方：**
```
JSONパース失敗: {"en": "foot", "vocab_type": "concrete_object"}
* Self-Correction on POS: The prompt says POS is "接尾辞". This is technically incorrect...
```

**解決策（次チャットで適用）：**
`buildPrompt_()` 関数の冒頭のプロンプト文を変更する：

```javascript
// 変更前
"You are a Japanese vocabulary classifier for JLPT learners.",

// 変更後
"You are a Japanese vocabulary classifier for JLPT learners. Do not think out loud. Do not self-correct. Output only the JSON object and nothing else.",
```

---

### 問題⑥ HTTP 500 / 429 / candidates が空エラー

| エラー | 原因 | 対処 |
|---|---|---|
| `HTTP 500 Internal error` | API一時エラー | 次回タイマー実行で自動再試行 |
| `HTTP 429 quota exceeded` | レート上限到達 | 正常動作。翌日リセット後に再試行 |
| `candidates[0].content.parts が空` | TTS一時エラー | 次回タイマー実行で自動再試行 |

これらはすべて `en` / `vocab_type` が空のまま残るので、次回の `classifyBatch()` / `generateAudioBatch()` 実行時に自動的に再処理される。

---

## 現在のコード設定値（確定済み）

### ScriptProperties（設定済み）

| キー | 設定済み |
|---|---|
| `GEMINI_API_KEY` | ✅ |
| `SPREADSHEET_ID` | ✅ `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` |
| `IMAGE_FOLDER_ID` | ✅ |
| `AUDIO_FOLDER_ID` | ✅ |

### コード内の定数（設定済み）

```javascript
// setupSpreadsheet.gs 冒頭
const SPREADSHEET_ID = "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk";

// EXTRACT_SETTINGS
SPREADSHEET_ID:   "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk",
GOI_LIST_FILE_ID: "1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA",  // テキスト形式のGoi_List

// LESSON_FILE_IDS
lesson_01: "1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c",

// SYNC_SETTINGS
SPREADSHEET_ID:    "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk",
IMAGE_REGISTRY_ID: "14NL_LqudXIQzY68klspH3SBlR21hiqbW",
AUDIO_REGISTRY_ID: "1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0",

// CLASSIFY_SETTINGS
MODEL: "gemma-4-26b-a4b-it",  // 変更済み

// IMAGE_SETTINGS
MODEL: "imagen-4.0-generate-001",  // 変更済み
```

---

## タイマートリガー（登録済み）

| 関数 | 頻度 | 備考 |
|---|---|---|
| `classifyBatch` | **毎時** | 1日最大1,200回のAPI呼び出し（無料枠1,500以内） |
| `generateImageBatch` | 毎日9:00 | 25枚/日（1モデル） |
| `generateAudioBatch` | 毎日10:00 | 9件/日（安全マージン） |
| `syncAll` | 毎日23:00 | registry.json に書き戻し |

---

## 次チャットで対応する残課題

### 優先度：高

#### [1] classifyBatch の JSON パース失敗修正

`buildPrompt_()` の1行目を変更（問題⑤参照）。

#### [2] Imagen モデル名の確認

`testSingleImage()` を実行して画像が生成されるか確認する。
失敗したらモデル名を再確認する。

#### [3] generateImages.gs の STYLE_RECIPE 完全化

現在のGASコードの `STYLE_RECIPE` は `master_prompt_design_guide_v2_5.py` の STYLE_BIBLE から不完全に転記されている。

**不足している内容：**
- `sub_color`（Cool slate gray `#6B7C85`）が STYLE_RECIPE に含まれていない
- `skin_tones`（Naturally warm medium skin tone）が含まれていない
- `OBJECT_SIGNATURES`（類似形状物体の誤認防止辞書）が未使用
- `ABSTRACT_METAPHORS`（抽象概念メタファー辞書）が未使用
- `DEMONSTRATIVE_MODELS`（指示語の3構図モデル）が簡略化されている

対応方針：次チャットで `master_prompt_design_guide_v2_5.py` をアップロードして `generateImages.gs` を改良する。

### 優先度：中

#### [4] setupExamplesSheet の insertCheckboxes 問題の根本修正

再度 `setupAll()` を実行した場合に同じ問題が起きないよう修正する（問題②参照）。

#### [5] 音声生成の動作確認

`testSingleAudio()` を実行して音声が生成されるか確認する。

### 優先度：低

#### [6] syncAll() の動作確認

registry.json に正しく書き戻されているか確認する。

---

## 次チャットに必要なファイル

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（`gas_pipeline_handoff_v7.md`） | **必須** | 全決定事項の参照元 |
| `master_prompt_design_guide_v2_5.py` | **必須** | STYLE_RECIPE 完全化のため |
| 現在のGASコード（setupSpreadsheet.gs） | 任意 | 修正箇所の確認が必要な場合 |

---

## 次チャットの開始コマンド

```
gas_pipeline_handoff_v7.md の続きです。

残タスクは以下の優先順で対応してください：

[1] classifyBatch の JSON パース失敗修正
    buildPrompt_() の冒頭に "Do not think out loud..." を追加

[2] testSingleImage() で画像生成の動作確認

[3] generateImages.gs の STYLE_RECIPE 完全化
    master_prompt_design_guide_v2_5.py をアップロードして対応

[4] setupExamplesSheet の insertCheckboxes 問題の根本修正
```

---

## 参考：レート制限（確定値）

| モデル | RPD | 現在の用途 |
|---|---|---|
| Gemma 4 26B（gemma-4-26b-a4b-it） | 1,500 | classifyBatch（毎時50語） |
| Gemma 4 31B（gemma-4-31b-it） | 1,500 | classifyBatch 代替 |
| Imagen 4（imagen-4.0-generate-001） | 25 | generateImageBatch |
| Imagen 4 Fast（imagen-4.0-fast-generate-001） | 25 | generateImageBatch 代替 |
| Gemini 2.5 Flash TTS | 10 | generateAudioBatch |
| Gemini 3.1 Flash TTS | 10 | generateAudioBatch 代替 |

---

*作成：2026-05-16*
*根拠：gas_pipeline_handoff_v6.md + このチャットで発生した全問題*
