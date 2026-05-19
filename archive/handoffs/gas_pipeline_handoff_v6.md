# 引き継ぎ資料：マルチメディア資産自動生成パイプライン
**バージョン：v6.0（2026-05-15）**
**前バージョン：gas_pipeline_handoff_v5.md**
**次チャットで着手：⑧ タイマートリガー設定 + 手順ドキュメント作成**

---

## このプロジェクトの位置づけ（毎回確認）

```
【japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTMLを生成するWebツール
  → Plan_v1_1.md に従ってStage 1〜7を進行中
  → Stage 1・2・3・4・5 は完了済み

【GASパイプライン】（本資料のスコープ）
  語彙・例文の画像・音声を自動生成してGoogle Driveに蓄積する
  → master_image_registry.json / master_audio_registry.json にURLを記録
  → japanese-lesson-creatorが参照するデータを供給する

【連携インターフェース】
  master_image_registry.json  →  image_resolver.js  →  slide_html.js
  master_audio_registry.json  →  homework_html.js（将来）
  ※両registryはbuild-embedded-data.pyでdata/*.jsに変換される
```

---

## このチャットで完了したこと

### 完成済みGASスクリプト（全8本中7本完了）

| ファイル | バージョン | 状態 |
|---|---|---|
| `setupSpreadsheet.gs` | v1.0 | ✅ 完成（過去チャット）|
| `seedLesson01.gs` | v1.1 | ✅ 完成（過去チャット）|
| `syncRegistries.gs` | v1.0 | ✅ 完成（過去チャット）|
| `extractFromGoiList.gs` | v1.0 | ✅ 完成（過去チャット）|
| **`classifyAndTranslate.gs`** | **v1.0** | **✅ 完成（v5チャット）**|
| **`generateAudio.gs`** | **v2.0** | **✅ 完成（このチャット・SS読み込みに改修）**|
| **`generateImages.gs`** | **v5.0** | **✅ 完成（このチャット・SS読み込みに改修）**|
| **`importFromLessonJson.gs`** | **v1.0** | **✅ 完成（このチャット）**|

### ⚠ 未着手（次チャットで対応）

| # | タスク | 内容 |
|---|---|---|
| **⑧** | **タイマートリガー設定** | 各スクリプトのトリガー関数を呼び出す手順の整理 |
| **⑨** | **手順ドキュメント作成** | パイプライン全体の初回セットアップ〜日次運用の手順書 |

---

## 各スクリプトの仕様（完成分）

### ⑤ classifyAndTranslate.gs v1.0

**目的：** Vocabulary シートの `en`（C列）・`vocab_type`（F列）が空の行に Gemma 4 で自動付与

| 関数名 | 用途 |
|---|---|
| `classifyBatch()` | 最大50語/回を処理 ← **タイマー設定先** |
| `previewClassify()` | 最初の5件だけ API 確認（書き込みなし）|
| `reclassifyWords(["医者"])` | 指定語のみ強制再処理 |
| `setupDailyTrigger()` | 毎日8:00トリガーを登録 |

```javascript
// ScriptProperties 設定値
GEMINI_API_KEY   // Gemini API キー
SPREADSHEET_ID   // スプレッドシートID
```

**バッチサイズ：** 50語/回（Gemma 4 26B: 1,500 RPD 安全マージン）
**モデル：** `gemma-4-26b-it`（代替: `gemma-4-31b-it`）

---

### ⑥b generateAudio.gs v2.0

**目的：** SS の audioStatus = "pending" 行に対して Gemini TTS で音声生成

| 関数名 | 用途 |
|---|---|
| `generateAudioBatch()` | 最大9件/回を処理 ← **タイマー設定先** |
| `testSingleAudio()` | 1件テスト（`TARGET_AUDIO_ID` を指定）|
| `retryAudio(["word_先生"])` | 指定IDを強制再生成 |
| `setupAudioDailyTrigger()` | 毎日10:00トリガーを登録 |

```javascript
// ScriptProperties 設定値
GEMINI_API_KEY   // Gemini API キー
SPREADSHEET_ID   // スプレッドシートID
AUDIO_FOLDER_ID  // Drive の audio/ フォルダID
```

**主な変更点（v1.0 → v2.0）：**
- 入力: `audio_prompts_lesson1.json` → Vocabulary + Examples シート直接読み込み
- pending 判定: ログSSの✅確認 → `audioStatus = "pending"` に変更
- `exportUrlsToJson()` を廃止（`syncRegistries.gs` が代替）
- デュアルモデル戦略は維持（MODEL を切り替えて合計20件/日）

**テキスト仕様：**
- Vocabulary: B列（reading・ひらがな）をそのまま TTS に送る
- Examples: F列（textToSpeak）を TTS に送る

---

### ⑥a generateImages.gs v5.0

**目的：** SS の imageStatus = "pending" 行に対して Imagen 4 で画像生成

| 関数名 | 用途 |
|---|---|
| `generateImageBatch()` | 最大24件/回を処理 ← **タイマー設定先** |
| `testSingleImage()` | 1件テスト（`TARGET_IMAGE_ID` を指定）|
| `previewPrompts()` | プロンプトだけ確認（API呼び出しなし）|
| `retryImages(["word_先生"])` | 指定IDを強制再生成 |
| `setupImageDailyTrigger()` | 毎日9:00トリガーを登録 |

```javascript
// ScriptProperties 設定値
GEMINI_API_KEY   // Gemini API キー
SPREADSHEET_ID   // スプレッドシートID
IMAGE_FOLDER_ID  // Drive の images/ フォルダID
```

**vocab_type → テンプレート対応：**

| vocab_type | テンプレート | 特記事項 |
|---|---|---|
| `person` | A | `PERSON_PROFILES` 辞書から人物描写を自動選択 |
| `building` | B | `BUILDING_CUES` 辞書から3つの手がかりを自動選択 |
| `concrete_object` | D | OBJECT_ALONE戦略 |
| `action_verb` | H | MOTION_ARROW（矢印許可）|
| `adjective` | J | PAIR_CONTRAST（2物体対比）|
| `abstract_concept` | I | TIACメタファー |
| `spatial_relation` | F | グリッド構図・境界線許可 |
| `demonstrative` | G | こ/そ/あ自動判定・領域色分け |
| `other` | デフォルト | 汎用プロンプト |

**STYLE_RECIPE（master_prompt_design_guide_v2_5.py 準拠・変更厳禁）：**
スクリプト内の `STYLE_RECIPE` 定数に完全転記済み。

---

### ⑦ importFromLessonJson.gs v1.0

**目的：** `lesson_NN.json` の vocabulary セクションを読み込み、SS に未登録語を差分追加

| 関数名 | 用途 |
|---|---|
| `importLesson01()` | lesson_01.json を処理 ← **通常はこれ** |
| `importByFileId("FILE_ID", "lesson_02")` | 任意の課を処理 |
| `previewImportLesson01()` | ドライラン（書き込みなし）|
| `previewImport("FILE_ID", "lesson_02")` | 任意の課のドライラン |

**vocab_type 自動推定：**
- `BUILDING_WORDS` に含まれる → `building`
- `imageRole: "vocab_person"` → `person`
- `imageRole: "vocab_object"` (非建物) → `concrete_object`
- それ以外・不明 → `""` (空) → classifyAndTranslate.gs が付与

**国籍語彙7語の処理フロー：**
```
extractFromGoiList.gs → スキップ（Goi_List に〜人形なし）
importFromLessonJson.gs → ✅ lesson_01.json から追加
  日本人・中国人・アメリカ人・韓国人・ブラジル人・ベトナム人・スペイン人
  vocab_type: "person"、en: lesson JSON から取得済み
classifyAndTranslate.gs → スキップ（en・vocab_type が既に埋まっているため）
```

---

## 全決定事項（v5からの継続）

### アーキテクチャ（選択B：確定）

```
スプレッドシート（SSOT）
  → classifyAndTranslate.gs（Gemma 4）  → en + vocab_type 自動付与
  → generateImages.gs（Imagen 4）       → 画像生成
  → generateAudio.gs（Gemini TTS）      → 音声生成
  → syncRegistries.gs                   → JSON書き出し
```

### 日次タイマー実行順序（確定）

```
8:00  classifyBatch()      ← classifyAndTranslate.gs
9:00  generateImageBatch() ← generateImages.gs
10:00 generateAudioBatch() ← generateAudio.gs
23:00 syncAll()            ← syncRegistries.gs
```

### ScriptProperties（全スクリプト共通）

| キー | 値 | 使用スクリプト |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio APIキー | classify / image / audio |
| `SPREADSHEET_ID` | スプレッドシートID | 全スクリプト |
| `IMAGE_FOLDER_ID` | Drive images/ フォルダID | generateImages.gs |
| `AUDIO_FOLDER_ID` | Drive audio/ フォルダID | generateAudio.gs |

### 命名規則（確定・変更不可）

```
imageId / audioId: "word_{漢字}"  例: word_医者、word_日本人
```

### syncRegistries.gs 保護ロジック（変更なし）

```javascript
const PROTECTED_PREFIXES = ["char_", "ex_L"];
const PROTECTED_EXACT    = ["world_map"];
```

### レート制限（確定値）

| モデル | RPD | 用途 |
|---|---|---|
| Imagen 4 Generate / Fast | 各25 | 画像生成（合計50/日）|
| Gemini 2.5 Flash TTS | 10 | 音声生成 |
| Gemini 3.1 Flash TTS | 10 | 音声生成（合計20/日）|
| Gemma 4 26B / 31B | 各1,500 | テキスト処理（合計3,000/日）|

---

## ⑧ タイマートリガー設定（次チャットで着手）

### 設定方法

各スクリプトの `setup*DailyTrigger()` 関数を**1回だけ手動実行**する。
関数内で既存トリガーを削除してから再登録するため、重複しない。

### 設定する関数一覧

| 実行関数 | トリガー登録関数 | 実行時刻 | スクリプト |
|---|---|---|---|
| `classifyBatch()` | `setupDailyTrigger()` | 毎日 8:00 | classifyAndTranslate.gs |
| `generateImageBatch()` | `setupImageDailyTrigger()` | 毎日 9:00 | generateImages.gs |
| `generateAudioBatch()` | `setupAudioDailyTrigger()` | 毎日10:00 | generateAudio.gs |
| `syncAll()` | `setupSyncDailyTrigger()` | 毎日23:00 | syncRegistries.gs |

**⚠ 注意：syncRegistries.gs には `setupSyncDailyTrigger()` が未実装。**
次チャットで追加する必要がある。

### 確認方法

GAS エディタ → 時計アイコン「トリガー」→ 4件が登録されていることを確認

---

## ⑨ 手順ドキュメント（次チャットで作成）

### 作成する内容

以下の内容を Markdown 形式でまとめた `pipeline_setup_guide.md` を作成する：

1. **初回セットアップ手順**（1回だけ実行）
   - Google Drive フォルダ構成（images/ / audio/）
   - スプレッドシート作成（`setupAll()` 実行）
   - ScriptProperties の設定
   - 初期データ投入順序
   - タイマートリガーの登録

2. **初期データ投入順序**（初回のみ）
   ```
   ① seedLesson01.gs     → lesson_01語彙17語+例文15件を投入
   ② extractFromGoiList.gs → N5語彙421語を投入（seedと重複は自動スキップ）
   ③ importFromLessonJson.gs → 国籍語彙7語等を補完
   ④ classifyAndTranslate.gs → en + vocab_type を自動付与
   ```

3. **日次運用フロー**（タイマーで自動化）
   ```
   8:00  classifyBatch()      en/vocab_type が空の行を処理
   9:00  generateImageBatch() imageStatus=pending の行を処理
   10:00 generateAudioBatch() audioStatus=pending の行を処理
   23:00 syncAll()            registry.json に反映
   （手動）build-embedded-data.py で data/*.js を更新
   ```

4. **トラブルシューティング**
   - 生成失敗時の `retry*()` 関数の使い方
   - `failed` 行の確認方法

---

## 次チャットの進め方

### アップロード必須ファイル

| ファイル | 必須/任意 | 理由 |
|---|---|------|
| **この資料**（`gas_pipeline_handoff_v6.md`） | **必須** | 全決定事項の参照元 |
| `syncRegistries.gs` | **必須** | `setupSyncDailyTrigger()` を追記するため |

### 開始コマンド

```
gas_pipeline_handoff_v6.md の続きです。
残タスクは以下の2つです：

⑧ タイマートリガー設定
  - syncRegistries.gs に setupSyncDailyTrigger() を追加
  - 4本のトリガー登録手順を確認

⑨ 手順ドキュメント（pipeline_setup_guide.md）
  - 初回セットアップ手順
  - 初期データ投入順序
  - 日次運用フロー
  - トラブルシューティング

syncRegistries.gs をアップロードして進めてください。
```

### 進行順序

```
⑧ syncRegistries.gs に setupSyncDailyTrigger() を追加（小規模修正）
⑨ pipeline_setup_guide.md を作成（Markdown）
   → 全パイプラインの完成
```

---

## 参照すべきプロジェクトファイル一覧

| ファイル | 内容 | 参照タイミング |
|---|---|---|
| `master_prompt_design_guide_v2_5.py` | 画像プロンプトテンプレートA〜J | generateImages.gs 修正時 |
| `lesson_01.json` | 第1課の教育設計データ | importFromLessonJson.gs 修正時 |
| `syncRegistries.gs` | レジストリ同期ロジック | ⑧ トリガー追加時 |
| `Plan_v1_1.md` | japanese-lesson-creator側のタスク | 連携確認時 |

---

## 注意事項（次チャットで見落としやすい点）

```
1. syncRegistries.gs の setupSyncDailyTrigger() は未実装。
   既存の syncAll() 関数にトリガーを設定する関数を追加する。

2. generateAudio.gs は「デュアルモデル戦略」を採用。
   1回目: MODEL = "gemini-2.5-flash-preview-tts"
   2回目: MODEL = "gemini-3.1-flash-preview-tts" に変更して再実行
   → 合計20件/日

3. generateImages.gs も同様に2モデル利用可能。
   1回目: MODEL = "imagen-4.0-generate-exp"
   2回目: MODEL = "imagen-4.0-fast-generate-exp" に変更
   → 合計50件/日

4. importFromLessonJson.gs の実行タイミング：
   extractFromGoiList.gs 実行後に実行する（重複チェックが前提）。

5. classifyAndTranslate.gs は en + vocab_type が「両方空」の行のみ処理する。
   importFromLessonJson.gs で en/vocab_type を設定済みの行はスキップされる。

6. build-embedded-data.py は syncRegistries.gs 実行後に手動で実行する。
   GASの自動実行には含めない（意図的）。

7. pipeline_setup_guide.md（⑨）は次チャットで新規作成する。
   プロジェクトナレッジには現在存在しない。
```

---

*資料バージョン：v6.0（2026-05-15）*
*作成チャット：GASパイプライン generateImages/Audio/importFromLessonJson 実装チャット*
*前バージョン：gas_pipeline_handoff_v5.md*
