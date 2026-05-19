# マルチメディア資産自動生成パイプライン — セットアップ・運用手順書

**バージョン：v1.1（2026-05-18 更新）**
**対象パイプライン：GASパイプライン（gas_pipeline_handoff_v6.md 準拠）**

> ⚠️ **音声パイプラインの一次情報は handoff_v4_4.md §14 を参照してください。**
> 本ドキュメントの音声関連記述は v1.1 で現行仕様（Google Cloud TTS WaveNet）に更新済みですが、
> 詳細・バグ修正記録・Phase 2〜4 の手順は §14 が正本です。

---

## 目次

1. [パイプライン全体像](#1-パイプライン全体像)
2. [初回セットアップ手順](#2-初回セットアップ手順)（1回だけ実行）
3. [初期データ投入順序](#3-初期データ投入順序)（初回のみ）
4. [タイマートリガーの登録](#4-タイマートリガーの登録)
5. [日次運用フロー](#5-日次運用フロー)（タイマーで自動化）
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. パイプライン全体像

```
スプレッドシート（SSOT: 唯一の真実の源）
  │
  ├─ classifyAndTranslate.gs  ─→  en（英訳）+ vocab_type を自動付与  [Gemma 4]
  │                                毎日 8:00 自動実行
  │
  ├─ generateImages.gs        ─→  語彙画像を生成 → Drive images/ に保存  [Imagen 4]
  │                                毎日 9:00 自動実行
  │
  ├─ generateAudio.gs         ─→  語彙・例文の音声を生成 → Drive audio/ に保存  [Google Cloud TTS WaveNet]
  │                                毎日 10:00 自動実行
  │
  └─ syncRegistries.gs        ─→  master_image_registry.json
                                   master_audio_registry.json に書き戻す
                                   毎日 23:00 自動実行

                                   ↓（手動）
                               build-embedded-data.py
                                   ↓
                               data/*.js（japanese-lesson-creator が参照）
```

---

## 2. 初回セットアップ手順

> ⚠️ このセクションの手順は **プロジェクト開始時に1回だけ** 実行します。

### 2-1. Google Drive のフォルダ構成を作成

Google Drive 上に以下のフォルダを作成してください。
フォルダ名は変更可能ですが、ID をあとで ScriptProperties に登録します。

```
My Drive/
  japanese-lesson/
    images/      ← 生成した語彙画像を保存
    audio/       ← 生成した語彙・例文の音声を保存
```

各フォルダを開き、URL の `folders/` 以降の文字列を **フォルダID** としてメモしてください。

```
例: https://drive.google.com/drive/folders/1ABC...XYZ
                                           ^^^^^^^^^^^^  ← これがフォルダID
```

### 2-2. スプレッドシートを作成（setupAll の実行）

1. Google Apps Script エディタを開く
2. `setupSpreadsheet.gs` を開く
3. 関数 `setupAll()` を選択して ▶ 実行
4. 作成されたスプレッドシートの URL から **スプレッドシートID** をメモ

```
例: https://docs.google.com/spreadsheets/d/1DEF...UVW/edit
                                           ^^^^^^^^^^^  ← これがスプレッドシートID
```

### 2-3. ScriptProperties の設定

GASエディタ → 「プロジェクトの設定」→「スクリプト プロパティ」に以下を登録します。

| プロパティキー | 設定する値 | 使用スクリプト |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio で取得した API キー | classify / image |
| `GCP_TTS_KEY` | Google Cloud コンソールで取得した API キー（Cloud Text-to-Speech API 有効化が必要） | generateAudio.gs |
| `SPREADSHEET_ID` | 手順 2-2 でメモしたスプレッドシートID | 全スクリプト |
| `IMAGE_FOLDER_ID` | 手順 2-1 でメモした `images/` フォルダID | generateImages.gs |
| `AUDIO_FOLDER_ID` | 手順 2-1 でメモした `audio/` フォルダID | generateAudio.gs |

> **Gemini API キーの取得先：** https://aistudio.google.com/app/apikey
> **GCP API キーの取得先：** https://console.cloud.google.com/ → APIとサービス → 認証情報

### 2-4. syncRegistries.gs の定数を設定

`syncRegistries.gs` の冒頭にある `SYNC_SETTINGS` を編集してください。

```javascript
const SYNC_SETTINGS = {
  SPREADSHEET_ID:       "YOUR_SPREADSHEET_ID_HERE",     // ← 2-2 でメモしたID
  IMAGE_REGISTRY_ID:    "YOUR_IMAGE_REGISTRY_FILE_ID",  // ← master_image_registry.json の DriveファイルID
  AUDIO_REGISTRY_ID:    "YOUR_AUDIO_REGISTRY_FILE_ID",  // ← master_audio_registry.json の DriveファイルID
};
```

> `master_image_registry.json` と `master_audio_registry.json` は Google Drive 上のファイルです。
> ファイルを右クリック →「共有可能なリンクを取得」→ URL 中の `d/` と `/view` に挟まれた文字列が **DriveファイルID** です。

---

## 3. 初期データ投入順序

> ⚠️ このセクションの手順も **初回のみ** 実行します。タイマー自動実行とは別です。

以下の順序で手動実行してください。順序を守ることで重複登録を防げます。

### ステップ ① seedLesson01.gs — 第1課の基本語彙・例文を投入

```
実行関数: seedLesson01()
投入件数: 語彙 17語 ＋ 例文 15件
```

1. `seedLesson01.gs` を開く
2. 関数 `seedLesson01()` を選択して ▶ 実行
3. スプレッドシートの Vocabulary シートと Examples シートに行が追加されたことを確認

### ステップ ② extractFromGoiList.gs — N5語彙421語を投入

```
実行関数: extractFromGoiList()
投入件数: N5語彙 最大421語（seedと重複する語は自動スキップ）
```

1. `extractFromGoiList.gs` を開く
2. 関数 `extractFromGoiList()` を選択して ▶ 実行
3. ログで「スキップ: N件」「追加: N件」を確認

### ステップ ③ importFromLessonJson.gs — 国籍語彙等を補完

```
実行関数: importLesson01()
投入件数: 国籍語彙7語など（日本人・中国人・アメリカ人・韓国人・ブラジル人・ベトナム人・スペイン人）
※ これらは Goi_List に含まれないため、lesson_01.json から直接取得
```

1. `importFromLessonJson.gs` を開く
2. まず `previewImportLesson01()` でドライランして内容を確認（書き込みなし）
3. 問題なければ `importLesson01()` を実行

> **注意：** extractFromGoiList.gs の実行後に行うこと（重複チェックが前提）。

### ステップ ④ classifyAndTranslate.gs — en + vocab_type を自動付与

```
実行関数: classifyBatch()
対象: en（英訳）と vocab_type が「両方空」の行のみ処理
モデル: Gemma 4 26B（最大50語/回）
```

1. `classifyAndTranslate.gs` を開く
2. まず `previewClassify()` で最初の5件を確認（書き込みなし）
3. 問題なければ `classifyBatch()` を繰り返し実行して全語彙を処理
4. `en` 列と `vocab_type` 列が埋まったことを確認

> ステップ③で登録した国籍語彙7語は、`en` と `vocab_type` が lesson_01.json から設定済みのため、`classifyBatch()` はスキップします。

---

## 4. タイマートリガーの登録

> ⚠️ 各スクリプトで **1回だけ手動実行** してください。
> 関数内で既存トリガーを削除してから再登録するため、重複しません。

### 登録する関数一覧

| 実行する関数 | 登録用関数 | 実行時刻 | スクリプトファイル |
|---|---|---|---|
| `classifyBatch()` | `setupDailyTrigger()` | 毎日 **8:00** | classifyAndTranslate.gs |
| `generateImageBatch()` | `setupImageDailyTrigger()` | 毎日 **9:00** | generateImages.gs |
| `generateAudioBatch()` | `setupAudioDailyTrigger()` | 毎日 **10:00** | generateAudio.gs |
| `syncAll()` | `setupSyncDailyTrigger()` | 毎日 **23:00** | syncRegistries.gs |

### 登録手順（4本すべて同じ手順）

```
1. GASエディタで対象スクリプトを開く
2. 関数選択ドロップダウンで「setup〇〇DailyTrigger」を選択
3. ▶ 実行
4. ログに「✅ タイマートリガーを登録しました」と表示されることを確認
```

### 登録確認

GASエディタ左メニュー → 時計アイコン「トリガー」を開き、以下の4件が登録されていることを確認してください。

```
classifyBatch       時間ベース  毎日  8時〜9時
generateImageBatch  時間ベース  毎日  9時〜10時
generateAudioBatch  時間ベース  毎日  10時〜11時
syncAll             時間ベース  毎日  23時〜24時
```

---

## 5. 日次運用フロー

タイマー登録後は、以下が毎日自動で実行されます。通常は **何もしなくてよい** です。

```
8:00   classifyBatch()
         └─ en / vocab_type が空の行を Gemma 4 で処理（最大50語/回）

9:00   generateImageBatch()
         └─ imageStatus = "pending" の行を Imagen 4 で処理（最大24件/回）
         └─ 生成画像を Drive images/ に保存

10:00  generateAudioBatch()
         └─ audioStatus = "pending" の行を Google Cloud TTS WaveNet（ja-JP-Wavenet-B）で処理（最大50件/回・MAX_BATCH_SIZE）
         └─ 生成音声を Drive audio/ に保存（WAV / LINEAR16 形式）

23:00  syncAll()
         └─ スプレッドシートの生成済み URL を registry.json に書き戻す
         └─ master_image_registry.json / master_audio_registry.json を更新
```

### 手動ステップ（自動化対象外・意図的）

`syncAll()` が完了したあと、以下を **手動で実行** してください。

```bash
# japanese-lesson-creator リポジトリのルートで実行
python build-embedded-data.py
```

このスクリプトが `data/*.js` を更新し、HTMLスライドに最新の画像・音声URLが反映されます。

> 「画像があるのにHTMLに表示されない」場合は、ほぼ `build-embedded-data.py` の未実行が原因です。

### デュアルモデル戦略（レート上限の倍増）

**画像生成（generateImages.gs）：**
レート上限を2倍にするため、モデルを切り替えて1日2回実行できます。

```
1回目: MODEL = "imagen-4.0-generate-exp"       → 最大25件/日
2回目: MODEL = "imagen-4.0-fast-generate-exp"  → 最大25件/日
合計: 最大50件/日
```

**音声生成（generateAudio.gs）：**

> ⚠️ **以下の記述は旧仕様（Gemini TTS 時代）のため現行では無効です。**
> 現行は Google Cloud TTS WaveNet（ja-JP-Wavenet-B）を使用しており、
> MAX_BATCH_SIZE=50（1回最大50件）のため、毎日10:00の1本のトリガーで75件全処理が可能です。
> デュアルモデル戦略は音声には不要になりました。詳細は handoff_v4_4.md §14 参照。

~~```
1回目: MODEL = "gemini-2.5-flash-preview-tts"  → 最大10件/日
2回目: MODEL = "gemini-3.1-flash-preview-tts"  → 最大10件/日
合計: 最大20件/日
```~~

切り替えは `generateImages.gs` 冒頭の `const MODEL = ...` を編集して手動実行します（画像のみ）。

---

## 6. トラブルシューティング

### 生成に失敗した行を再試行する

スプレッドシートの `imageStatus` / `audioStatus` が `"failed"` になっている行を強制再生成します。

**画像の再生成：**
```javascript
// generateImages.gs で実行
retryImages(["word_医者", "word_先生"])  // 指定IDを強制再生成
testSingleImage()                        // TARGET_IMAGE_ID の1件だけテスト
```

`TARGET_IMAGE_ID` は `generateImages.gs` 内の定数を書き換えて使います。

**音声の再生成：**
```javascript
// generateAudio.gs で実行（現行: Google Cloud TTS WaveNet / WAV(LINEAR16) 形式）
retryAudio(["word_先生", "word_日本人"])  // 指定IDを強制再生成（GCP_TTS_KEY 使用）
testSingleAudio()                         // TARGET_AUDIO_ID の1件だけテスト（WAVヘッダー検証付き）
```

**分類の再処理：**
```javascript
// classifyAndTranslate.gs で実行
reclassifyWords(["医者", "先生"])  // 指定語のみ強制再処理
previewClassify()                   // 最初の5件を確認（書き込みなし）
```

### failed 行の確認方法

スプレッドシートの Vocabulary シートを開き、フィルタ機能で以下を確認してください。

```
imageStatus 列 → "failed" でフィルタ
audioStatus 列 → "failed" でフィルタ
```

または GASエディタ → 「実行」タブ → 各スクリプトのログ出力を確認してください。

### よくあるエラーと対処

| 症状 | 原因 | 対処 |
|---|---|---|
| `❌ master_image_registry.json の読み込みに失敗` | IMAGE_REGISTRY_ID が間違い / ファイルが存在しない | SYNC_SETTINGS の IMAGE_REGISTRY_ID を確認 |
| `⚠️ registry に未登録（スキップ）: word_XX` | SSに行はあるが registry.json にエントリがない | extractFromGoiList.gs / importFromLessonJson.gs を再実行して登録 |
| 画像があるのに HTML に反映されない | `build-embedded-data.py` が未実行 | python build-embedded-data.py を手動実行 |
| `classifyBatch` が全語彙をスキップする | en と vocab_type が両方埋まっている | 正常動作。空の行がなければ処理対象なし |
| 音声生成が1日10件で止まる | ~~Gemini TTS のレート上限~~ **旧仕様** | 現行は Google Cloud TTS WaveNet（MAX_BATCH_SIZE=50）。この症状は発生しない |
| `generateAudioBatch` が9件で止まる | ~~バッチサイズの上限~~ **旧仕様** | 現行の MAX_BATCH_SIZE=50 では発生しない |
| 音声ファイルが再生できない / 壊れている | WAVヘッダー二重化バグ（v4.3 以前の生成ファイル） | **v4.3 以前の .wav ファイルは使用不可**。`resetToRegenerate()` で全件 pending に戻して再生成済み（buildCloudTtsWavBlob_() で修正済み）。詳細は handoff_v4_4.md §14 |

### ScriptProperties の確認方法

```
GASエディタ → 歯車アイコン「プロジェクトの設定」
  → 下部「スクリプト プロパティ」セクション
  → GEMINI_API_KEY / GCP_TTS_KEY / SPREADSHEET_ID / IMAGE_FOLDER_ID / AUDIO_FOLDER_ID を確認
```

---

## 付録：全スクリプト一覧と役割

| スクリプトファイル | バージョン | 役割 | 主な実行関数 |
|---|---|---|---|
| `setupSpreadsheet.gs` | v1.0 | スプレッドシート・シートの初期構築 | `setupAll()` |
| `seedLesson01.gs` | v1.1 | 第1課の語彙・例文の初期投入 | `seedLesson01()` |
| `extractFromGoiList.gs` | v1.0 | N5語彙421語の投入 | `extractFromGoiList()` |
| `importFromLessonJson.gs` | v1.0 | lesson_NN.json からの差分追加 | `importLesson01()` |
| `classifyAndTranslate.gs` | v1.0 | en + vocab_type の自動付与（Gemma 4） | `classifyBatch()` |
| `generateImages.gs` | v5.0 | 語彙画像の生成（Imagen 4） | `generateImageBatch()` |
| `generateAudio.gs` | **v3.0** | 語彙・例文の音声生成（**Google Cloud TTS WaveNet** / WAV / LINEAR16） | `generateAudioBatch()` |
| `syncRegistries.gs` | v1.0 | registry.json への書き戻し | `syncAll()` |

---

*作成：2026-05-15 / gas_pipeline_handoff_v6.md 準拠*
