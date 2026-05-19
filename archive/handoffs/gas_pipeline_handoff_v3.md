# 引き継ぎ資料：マルチメディア資産自動生成パイプライン
**バージョン：v3.0（2026-05-15）**
**前バージョン：gas_pipeline_handoff_v1.md → gas_pipeline_handoff_v2.md → 本資料**
**次チャットで着手：③ スプレッドシート設計**

---

## このプロジェクトの位置づけ（毎回確認）

```
【japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTMLを生成するWebツール
  → Plan_v1_1.md に従ってStage 1〜7を進行中

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

## 全決定事項（このチャットで確定したもの）

### 決定1：アーキテクチャ（選択B）

スプレッドシートから直接読んで生成する。JSONファイルは入力として使わない。

```
【採用しなかった選択A】
  スプレッドシート → syncRegistries.gs → JSON → v5/generateAudio.gs
  メリット：既存スクリプト改修不要
  不採用理由：長期的にJSONの管理が増える

【採用した選択B】
  スプレッドシート（SSOT） → generateImages.gs（v5改修）→ 画像生成
                           → generateAudio.gs（改修）  → 音声生成
  メリット：課追加時は行追加だけ。JSONファイル管理不要
  注意：v5とgenerateAudio.gsのデータ読み込み部分を改修が必要
```

### 決定2：語彙ソースの優先順位

```
優先1：Goi_List.pdf（N5〜N1全語彙の一括生成）
  → extractFromGoiList.gs で自動投入
  → N5: 422語、N4: 792語

優先2：lesson_NN.json（課マスター完成時）
  → importFromLessonJson.gs で差分のみ追加
  → Goi_List未収録語（国籍語彙等）もここで補完

【重要】Goi_Listで先に資産を蓄積することで、
  課マスター作成を待たずに毎日API枠を使い切れる
  課マスター完成時はほぼ全語彙が生成済みになっている
```

### 決定3：Goi_List互換性評価の結果（確認済み）

| 確認ポイント | 結果 |
|---|---|
| `word_*` 命名規則 | ✅ Plan_v1_1.md Stage 1と一致 |
| registry構造 | ✅ image_resolver.jsがそのまま使える |
| build-embedded-data.py | ✅ エントリが増えても再実行するだけ |
| 例文場面画像 | ✅ 影響なし（引き続きimage_prompts手書き） |
| 国籍語彙（日本人等） | ⚠️ Goi_List未収録 → importFromLessonJsonで補完 |
| vocab_type自動分類精度 | ⚠️ Gemma 4 26Bで分類。誤分類はrejected→再生成で対処 |

### 決定4：レート制限（全モデル確定値）

| モデル | RPD | 用途 |
|---|---|---|
| Imagen 4 Generate | 25 | 画像生成 |
| Imagen 4 Fast Generate | 25 | 画像生成（高速）|
| Imagen 4 Ultra Generate | 25 | 画像生成（高品質）★前チャットで新発見 |
| Gemini 2.5 Flash TTS | 10 | 音声生成 |
| Gemini 3.1 Flash TTS | 10 | 音声生成（合計20/日）|
| Gemma 4 26B | 1,500 | テキスト処理・分類・翻訳 |
| Gemma 4 31B | 1,500 | テキスト処理（合計3,000/日）★新発見 |
| Gemini 3.1 Flash Lite | 500 | テキスト処理 |
| Gemini Embedding 1/2 | 各1,000 | 語彙QA・重複検出 ★新発見 |

**合計：画像75枚/日、音声20件/日、テキスト3,500件/日**

---

## 現在の実装状況

### 完成済みファイル

| ファイル | 状態 | 説明 |
|---|---|---|
| `generateAudio.gs` | ✅ 完成・未テスト | Gemini TTSで音声生成。PCM→WAV変換込み |
| `audio_prompts_lesson1.json` | ✅ 完成 | lesson_01の32件（語彙17+例文15）|
| `master_audio_registry.json` | ✅ 枠のみ | 全32エントリ audioUrl:null |
| `GAS_Lesson_ImageGenerator_v5.gs` | ✅ 稼働中 | 画像生成（改修前）|
| `master_image_registry.json` | ✅ v1.4 | lesson_01語彙: approved、lesson_02: pending |

### 未着手ファイル（作成順）

| # | ファイル | 役割 | 依存 |
|---|---|---|---|
| ③ | スプレッドシート | 全体SSOT | — |
| ④ | `extractFromGoiList.gs` | Goi_List→SS投入 | SS完成後 |
| ⑤ | `classifyAndTranslate.gs` | Gemma 4でen+vocab_type付与 | SS完成後 |
| ⑥ | `generateImages.gs`（v5改修）| SS読み込みに変更 | SS完成後 |
| ⑥ | `generateAudio.gs`（改修）| SS読み込みに変更 | SS完成後 |
| ⑦ | `importFromLessonJson.gs` | 課マスター→SS差分追加 | SS完成後 |
| ⑧ | `syncRegistries.gs` | SS→JSON registry書き出し | SS完成後 |

---

## ③ スプレッドシート設計（次チャットで着手）

### シート構成

```
スプレッドシート（1ファイル）
  ├── Vocabulary シート   ← 語彙の画像・音声管理（SSOT）
  ├── Examples シート     ← 例文の音声管理
  └── Log シート          ← GAS実行ログ（画像・音声共通）
```

### Vocabulary シート（確定カラム）

| 列 | フィールド | 型 | 例 | 備考 |
|---|---|---|---|---|
| A | word | string | 医者 | 漢字表記 |
| B | reading | string | いしゃ | ひらがな |
| C | en | string | doctor | 英語訳（Gemma自動生成）|
| D | jlptLevel | enum | N5 | N5〜N1 |
| E | pos | string | 名詞 | Goi_Listの品詞1 |
| F | vocab_type | string | person | A〜Jテンプレート選択キー |
| G | imageId | string | word_医者 | master_image_registryキー |
| H | imageStatus | enum | approved | pending/generated/approved/failed |
| I | imageUrl | string | https://... | GAS自動入力 |
| J | audioId | string | word_医者 | master_audio_registryキー |
| K | audioStatus | enum | pending | pending/generated/approved/failed |
| L | audioUrl | string | — | GAS自動入力 |
| M | lessonRef | string | lesson_01 | どの課で使われるか（任意）|
| N | source | string | goi_list | goi_list / lesson_import / manual |

### Examples シート（確定カラム）

| 列 | フィールド | 型 | 例 | 備考 |
|---|---|---|---|---|
| A | id | string | sentence_ex_L01_001 | audio registryキー |
| B | lessonNo | number | 1 | |
| C | patternId | string | p1 | |
| D | sentence | string | 鈴木さんは先生です。 | 教科書原文 |
| E | sentenceEn | string | Suzuki-san is a teacher. | |
| F | textToSpeak | string | 鈴木さんは先生です。 | TTS送信テキスト |
| G | audioStatus | enum | pending | |
| H | audioUrl | string | — | GAS自動入力 |
| I | isAnchor | boolean | TRUE | |

### Log シート（共通）

| 列 | フィールド | 備考 |
|---|---|---|
| A | date | 実行日時 |
| B | type | image / audio / classify |
| C | id | word_医者 等 |
| D | status | ✅ 成功 / ❌ エラー |
| E | url | Drive URL |
| F | error | エラー詳細（失敗時）|

### 初期データ投入計画

```
Step 1: lesson_01の17語をVocabularyシートに手動入力（シードデータ）
  → imageStatus: approved（master_image_registry v1.4から転記）
  → audioStatus: pending（全件）

Step 2: lesson_01の15例文をExamplesシートに手動入力
  → audioStatus: pending（全件）
  → audio_prompts_lesson1.json から転記

Step 3: extractFromGoiList.gsでN5全語彙を自動投入（422語）
  → 重複チェックしてからword列で照合。lesson_01の17語は上書きしない

Step 4: classifyAndTranslate.gsでen+vocab_type自動付与
```

---

## vocab_type マッピング（master_prompt_design_guide_v2_5.py準拠）

```
person           → テンプレートA（医者・先生・学生・会社員 等）
building         → テンプレートB（病院・学校・銀行・大学 等）
concrete_object  → テンプレートD（本・ペン・財布 等）
action_verb      → テンプレートH（食べる・飲む・読む 等）
adjective        → テンプレートJ（大きい・小さい・新しい 等）
abstract_concept → テンプレートI（時間・気持ち・自由 等）
spatial_relation → テンプレートF（上・下・右・左 等）
demonstrative    → テンプレートG（これ・それ・あれ 等）
```

Gemma 4 26Bへの分類プロンプト方針：
- 品詞+語彙+英語訳を渡してvocab_typeを1語で返させる
- 不明な場合は `abstract_concept` をデフォルトにする

---

## generateAudio.gsの仕様（完成済み・参照用）

### 重要仕様

```javascript
// モデル名（要確認：Google AI Studio Docsで正式名称を確認すること）
"gemini-2.5-flash-preview-tts"  // 2.5 Flash TTS
"gemini-3.1-flash-preview-tts"  // 3.1 Flash TTS（デュアルモデル時）

// 音声フォーマット
// APIレスポンス: audio/L16;codec=pcm;rate=24000（raw PCM）
// 保存形式: .wav（44バイトのWAVヘッダーをGASで構築）
// ブラウザ再生: モダンブラウザで.wav再生可能

// バッチサイズ
MAX_BATCH_SIZE: 9  // RPD:10の安全マージン
DELAY_MS: 6000     // API間隔
```

### ④改修後の変更点（選択B対応）

現在の `generateAudio.gs` は `audio_prompts_lesson1.json` を Drive から読む。
改修後はスプレッドシートの Examples / Vocabulary シートから直接読む。

変更が必要な関数：
- `runAll()` → `loadJsonFromDrive()` の呼び出しをシート読み込みに置き換え
- `testSingleAudio()` → 同上

変更しない関数（コアロジック・そのまま流用可）：
- `processAudioEntry()` / `callGeminiTTS()` / `buildWavBlob()` / `saveAudioToDrive()`
- `exportUrlsToJson()` → registry書き出しロジックはそのまま

---

## GAS v5（画像生成）の改修ポイント（参照用）

現在の v5 は `image_prompts_lessonN.json` を読む。
改修後はスプレッドシートの Vocabulary シートから読む。

変更が必要な関数：
- `runAll()` → JSONロードをシート読み込みに置き換え
- `buildImagePrompt()` → vocab_typeとmaster_prompt_design_guide_v2_5.pyのテンプレートを使って自動構築
- `exportUrlsToJson()` → Vocabulary シートのimageUrl列を更新 + registry JSON書き出し

例文の場面画像（`ex_L01_011`等）：**引き続きimage_prompts_lessonN.jsonから読む（変更なし）**
→ v5の `imageRef` コピー機能もそのまま維持

---

## 次チャットの進め方

### アップロード推奨ファイル

| ファイル | 必須/任意 |
|---|---|
| この資料（`gas_pipeline_handoff_v3.md`） | **必須** |
| `master_image_registry.json` | **必須**（スプレッドシート初期データ参照）|
| `master_audio_registry.json` | **必須**（同上）|
| `Goi_List.pdf` | **必須**（extractFromGoiList.gs実装時）|
| `master_prompt_design_guide_v2_5.py` | 任意（vocab_type設計参照）|

### 開始コマンド

```
gas_pipeline_handoff_v3.md の続きです。
③ スプレッドシート設計から始めてください。
Googleスプレッドシートを実際に作成する手順と、
初期データ投入スクリプトの実装から進めます。
```

### 進行順序

```
③ スプレッドシート設計・作成（構成確定・初期17語手動入力手順）
④ extractFromGoiList.gs（Goi_List.pdf → Vocabularyシート自動投入）
⑤ classifyAndTranslate.gs（Gemma 4でen+vocab_type自動付与）
⑥ v5改修 + generateAudio.gs改修（シート読み込みに変更）
⑦ importFromLessonJson.gs（課マスター差分追加）
⑧ syncRegistries.gs（スプレッドシート→JSON書き出し）
⑨ タイマートリガー設定（毎日自動実行）
```

---

## 参照すべきプロジェクトファイル一覧

| ファイル | 内容 | 参照タイミング |
|---|---|---|
| `lesson_01.json` | 第1課の教育設計データ | importFromLessonJson.gs実装時 |
| `master_prompt_design_guide_v2_5.py` | 画像プロンプトテンプレートA〜J | v5改修・buildImagePrompt設計時 |
| `image_resolver.js` | registry参照ロジック | registry構造変更時（互換性確認）|
| `Plan_v1_1.md` | japanese-lesson-creator側のタスク | 命名規則・連携確認時 |
| `gas_pipeline_handoff_v1.md` | パイプライン設計の背景（長期計画）| 背景確認が必要な場合 |

---

*資料バージョン：v3.0（2026-05-15）*
*作成チャット：GASパイプライン音声生成実装 + アーキテクチャ確定チャット*
