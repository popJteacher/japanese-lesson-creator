# 引き継ぎ資料：マルチメディア資産自動生成パイプライン
**バージョン：v4.0（2026-05-15）**
**前バージョン：gas_pipeline_handoff_v3.md**
**次チャットで着手：④ extractFromGoiList.gs**

---

## このプロジェクトの位置づけ（毎回確認）

```
【japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTMLを生成するWebツール
  → Plan_v1_1.md に従ってStage 1〜7を進行中
  → Stage 1・2・3・4・5 は完了済み（2026-05-15 申し送りで確認）

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

## 実装ライン（Claude Code側）の確定済み申し送り（2026-05-15）

### ① 命名規則（vocab_* → word_*）：完了済み
- `master_image_registry.json`：全語彙キーが `word_*` に変換済み
- `lesson_01.json`：全17語の `imageId` が `word_*` に更新済み
- GASパイプラインは最初から `word_*` で進める（変換作業不要）

> **⚠ 注意**：プロジェクトファイル（/mnt/project/）の `master_image_registry.json` は
> まだ `vocab_*` のままに見えるが、これはスナップショットの古いバージョン。
> 実際のリポジトリは `word_*` 変換済みと確認済み。

### ② master_audio_registry.json：確定
- リポジトリに存在する。32エントリ（`word_*×17` + `sentence_ex_*×15`）、全null
- GASパイプラインが想定していた構造と完全一致
- `syncRegistries.gs` がこのファイルの `audioUrl` を埋めていく設計でOK

### ③ char_* 画像：生成不要・GASスコープ外
- `master_image_registry.json` に `char_鈴木〜char_ケリー` 5件が実URLつきで存在する
- GASパイプラインの生成対象スコープから除外
- `NamedCharacters` シートも作成不要

### ④ lesson_01.json の現在の構造（確定値）
- `vocabulary[].imageId = "word_{漢字}"` 形式で設定済み
- `vocabulary[].audioId = "word_{漢字}"` 形式で設定済み
- `examples[].audioId = "sentence_ex_L01_NNN"` 形式で設定済み
- `examples[].isAnchor` 確定値：
  - `true`：sentence_ex_L01_001（p1:1-1）、sentence_ex_L01_008（p2:2-4）、sentence_ex_L01_014（p3:3-4）
  - `false`：それ以外の12件
- `namedCharacters[]` セクション追加済み（char_* 5件が登録済み）
- `patterns[].canDoEn` フィールド追加済み（全課共通の新必須フィールド）
- `world_map` エントリが registry に追加済み（imageUrl: null のまま保持）

### ⑤ syncRegistries.gs の保護ルール（確定）
以下のエントリには絶対に触れないこと：
- `char_*`（5件）：実URL存在・上書き禁止
- `ex_L*`（例文画像）：GASスコープ外
- `world_map`：imageUrl: null のまま保持
- 更新対象は `word_*`（Vocabulary シート）と `sentence_ex_*`（Examples シート）のみ

### ⑥ build-embedded-data.py の実行タイミング（運用ルール）
- 課マスター更新時、または syncRegistries.gs 実行後に手動実行
- GASは毎日自動実行するが、build は手動
- 「画像があるのにHTMLに出ない」はほぼ build 未実行が原因

---

## このチャットで完了したこと（③ スプレッドシート設計）

### 完成済みGASスクリプト

| ファイル | バージョン | 状態 |
|---|---|---|
| `setupSpreadsheet.gs` | v1.0 | ✅ 完成 |
| `seedLesson01.gs` | v1.1 | ✅ 完成（word_* 適用・isAnchor確定値） |
| `syncRegistries.gs` | v1.0 | ✅ 完成 |

---

## setupSpreadsheet.gs の仕様

### 作成するシート構成
```
スプレッドシート（1ファイル）
  ├── Vocabulary シート（語彙の画像・音声管理）
  ├── Examples シート（例文の音声管理）
  └── Log シート（GAS実行ログ共通）
```

### Vocabulary シート（14列）

| 列 | フィールド | 型 | 備考 |
|---|---|---|---|
| A | word | string | 漢字表記・キー列 |
| B | reading | string | ひらがな |
| C | en | string | 英語訳（Gemma自動生成）|
| D | jlptLevel | enum | N5〜N1（ドロップダウン）|
| E | pos | string | 品詞 |
| F | vocab_type | string | person/building 等（テンプレート選択）|
| G | imageId | string | `word_{漢字}`（image_registry キー）|
| H | imageStatus | enum | pending/generated/approved/failed（ドロップダウン）|
| I | imageUrl | string | GAS自動入力 |
| J | audioId | string | `word_{漢字}`（audio_registry キー）|
| K | audioStatus | enum | pending/generated/approved/failed（ドロップダウン）|
| L | audioUrl | string | GAS自動入力 |
| M | lessonRef | string | どの課で使われるか |
| N | source | enum | goi_list/lesson_import/manual（ドロップダウン）|

**重要：imageId と audioId は同じ `word_*` 形式で一致する。**

### Examples シート（9列）

| 列 | フィールド | 型 | 備考 |
|---|---|---|---|
| A | id | string | `sentence_ex_L01_NNN`・キー列 |
| B | lessonNo | number | 課番号 |
| C | patternId | string | p1/p2/p3 |
| D | sentence | string | 教科書原文 |
| E | sentenceEn | string | 英語訳 |
| F | textToSpeak | string | TTS送信テキスト（「／」「→」変換済み）|
| G | audioStatus | enum | pending/generated/approved/failed |
| H | audioUrl | string | GAS自動入力 |
| I | isAnchor | boolean | チェックボックス（true: 3件のみ）|

### Log シート（6列）
date / type / id / status / url / error

### 共有定数（全GSファイル共通）
```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
// setupSpreadsheet.gs に定義。同プロジェクト内の全.gsファイルで共有。
```

---

## seedLesson01.gs v1.1 の仕様

### 投入データ

**Vocabulary（17語）**

| 語 | imageId | imageStatus | vocab_type | source |
|---|---|---|---|---|
| 医者 | word_医者 | approved | person | lesson_import |
| 会社員 | word_会社員 | approved | person | lesson_import |
| 学生 | word_学生 | approved | person | lesson_import |
| 大学生 | word_大学生 | **pending** | person | lesson_import |
| 先生 | word_先生 | approved | person | lesson_import |
| 日本人〜スペイン人（7語） | word_*人 | **pending** | person | lesson_import |
| 病院 | word_病院 | **pending** | building | lesson_import |
| 学校 | word_学校 | approved | building | lesson_import |
| 銀行 | word_銀行 | approved | building | lesson_import |
| 大学 | word_大学 | approved | building | lesson_import |
| デパート | word_デパート | approved | building | lesson_import |

**全17語の audioStatus = pending（音声は全件未生成）**

pending の理由：
- `大学生`：registry未登録。Goi_List一括生成（④）で追加される
- `日本人〜スペイン人`（7語）：Goi_List未収録（〜人形は独立登録なし）。importFromLessonJson.gs（⑦）で補完
- `病院`：registry登録済みだが imageUrl:null（Goi_List生成待ち）

**Examples（15件）**

isAnchor: true = sentence_ex_L01_001（p1:1-1）/ _008（p2:2-4）/ _014（p3:3-4）のみ

---

## syncRegistries.gs v1.0 の仕様

### 実行方法
```
syncAll()    → 画像+音声 両方を同期（本番用）
testProtectedKeys() → 保護ロジックの動作確認（テスト用）
```

### 保護ロジック（isProtected 関数）
```javascript
const PROTECTED_PREFIXES = ["char_", "ex_L"];
const PROTECTED_EXACT    = ["world_map"];
// → char_鈴木, ex_L01_007, world_map 等は絶対に更新しない
```

### image_registry 更新ルール
- `approved` は degradeしない（SS側が `generated` でも registry の `approved` は維持）
- registry に未登録の imageId は警告してスキップ（新規追加は extractFromGoiList.gs 担当）
- ヘッダー行から列インデックスを動的取得（列追加・並び替えに耐性あり）

### 設定が必要な値（GASプロジェクト作成後に入力）
```javascript
const SYNC_SETTINGS = {
  SPREADSHEET_ID:    "YOUR_SS_ID",
  IMAGE_REGISTRY_ID: "YOUR_IMAGE_REGISTRY_FILE_ID",
  AUDIO_REGISTRY_ID: "YOUR_AUDIO_REGISTRY_FILE_ID",
};
```

---

## 全決定事項（v3からの継続）

### アーキテクチャ（選択B：確定）
```
スプレッドシート（SSOT） → generateImages.gs（v5改修）→ 画像生成
                        → generateAudio.gs（改修）  → 音声生成
                        → syncRegistries.gs         → JSON書き出し
```

### レート制限（確定値）

| モデル | RPD | 用途 |
|---|---|---|
| Imagen 4 Generate | 25 | 画像生成 |
| Imagen 4 Fast Generate | 25 | 画像生成（高速）|
| Imagen 4 Ultra Generate | 25 | 画像生成（高品質）|
| Gemini 2.5 Flash TTS | 10 | 音声生成 |
| Gemini 3.1 Flash TTS | 10 | 音声生成（合計20/日）|
| Gemma 4 26B | 1,500 | テキスト処理・分類・翻訳 |
| Gemma 4 31B | 1,500 | テキスト処理（合計3,000/日）|
| Gemini 3.1 Flash Lite | 500 | テキスト処理 |
| Gemini Embedding 1/2 | 各1,000 | 語彙QA・重複検出 |

**合計：画像75枚/日、音声20件/日、テキスト3,500件/日**

### 語彙ソース優先順位（確定）
```
優先1：Goi_List.pdf（N5〜N1全語彙の一括生成）
  → extractFromGoiList.gs で自動投入
  → N5: 422語、N4: 792語

優先2：lesson_NN.json（Goi_List未収録語の補完）
  → importFromLessonJson.gs で差分追加
  → 国籍語彙（日本人等7語）はここで補完
```

### vocab_type マッピング（master_prompt_design_guide_v2_5.py準拠）
```
person           → テンプレートA（医者・先生・学生・会社員・国籍語彙 等）
building         → テンプレートB（病院・学校・銀行・大学・デパート 等）
concrete_object  → テンプレートD（本・ペン・財布 等）
action_verb      → テンプレートH（食べる・飲む・読む 等）
adjective        → テンプレートJ（大きい・小さい・新しい 等）
abstract_concept → テンプレートI（時間・気持ち・自由 等）
spatial_relation → テンプレートF（上・下・右・左 等）
demonstrative    → テンプレートG（これ・それ・あれ 等）
```

### generateAudio.gs 仕様（参照用・改修前）
```javascript
MODEL: "gemini-2.5-flash-preview-tts"  // 1回目
// または "gemini-3.1-flash-preview-tts"  // 2回目（デュアルモデル戦略）
VOICE_NAME: "Aoede"   // 穏やか女性（日本語教材推奨）
DELAY_MS: 6000
MAX_BATCH_SIZE: 9     // RPD:10 の安全マージン
// 音声形式: audio/L16(PCM raw) → buildWavBlob() で WAV ヘッダー付与して .wav 保存
```

---

## 現在の実装状況

### 完成済みファイル

| ファイル | 状態 | 説明 |
|---|---|---|
| `setupSpreadsheet.gs` | ✅ 完成 | 3シート作成・書式・ドロップダウン設定 |
| `seedLesson01.gs` v1.1 | ✅ 完成 | lesson_01語彙17語+例文15件投入 |
| `syncRegistries.gs` v1.0 | ✅ 完成 | SS→JSON差分書き戻し（保護ロジック付き）|
| `generateAudio.gs` | ✅ 完成・改修前 | 現状はJSONファイル読み込み方式 |
| `audio_prompts_lesson1.json` | ✅ 完成 | lesson_01の32件（語彙17+例文15）|
| `master_audio_registry.json` | ✅ 完成 | 32エントリ audioUrl:null |
| `master_image_registry.json` | ✅ v1.4+変換済 | word_* に変換済み（申し送り確認）|

### 未着手ファイル（作成順）

| # | ファイル | 役割 | 依存 |
|---|---|---|---|
| **④** | `extractFromGoiList.gs` | Goi_List.pdf → Vocabularyシート自動投入 | SS完成後 |
| ⑤ | `classifyAndTranslate.gs` | Gemma 4でen+vocab_type自動付与 | SS完成後 |
| ⑥a | `generateImages.gs`（v5改修） | SS読み込みに変更 | SS完成後 |
| ⑥b | `generateAudio.gs`（改修） | SS読み込みに変更 | SS完成後 |
| ⑦ | `importFromLessonJson.gs` | 課マスター→SS差分追加（国籍語彙補完含む）| SS完成後 |
| ⑧ | タイマートリガー設定 | 毎日自動実行 | ⑥完成後 |

---

## ④ extractFromGoiList.gs の設計（次チャットで着手）

### 目的
Goi_List.pdf（N5〜N1全語彙）を読み取り、VocabularyシートにN5全語彙（422語）を自動投入する。

### 処理フロー
```
1. Goi_List.pdf を Drive から取得
2. N5セクションの語彙を抽出（word / reading / pos / jlptLevel）
3. Vocabularyシートの word列（A列）で重複チェック
4. 未登録の語彙のみ追加（lesson_01の17語はスキップ）
5. 新規行は以下で初期化：
   - imageStatus/audioStatus: "pending"
   - imageUrl/audioUrl: ""
   - imageId: "word_{word}"
   - audioId: "word_{word}"
   - source: "goi_list"
   - en/vocab_type: "" （classifyAndTranslate.gsで後から付与）
```

### Goi_List.pdf の構造（事前調査済み）
- N5: 422語
- N4: 792語
- フォーマット：`番号 | 漢字 | 読み | 品詞 | 英語訳` 等（PDF解析が必要）

### 重要な制約
- lesson_01の17語は上書きしない（重複チェックで自動スキップ）
- `en` フィールドは Goi_List から取得できる場合は入力、できない場合は空欄で進む
  （classifyAndTranslate.gs で Gemma 4 が補完）
- 国籍語彙（日本人等7語）は Goi_List に独立収録なし
  → このスクリプトでは追加されない。importFromLessonJson.gs で補完

---

## 次チャットの進め方

### アップロード必須ファイル

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（`gas_pipeline_handoff_v4.md`） | **必須** | 全決定事項の参照元 |
| `Goi_List.pdf` | **必須** | extractFromGoiList.gs 実装の対象 |
| `master_prompt_design_guide_v2_5.py` | 任意 | vocab_type設計の参照 |

### 開始コマンド
```
gas_pipeline_handoff_v4.md の続きです。
④ extractFromGoiList.gs の実装から始めてください。
Goi_List.pdf の構造を確認してから実装に進みます。
```

### 進行順序（残タスク）
```
④ extractFromGoiList.gs（Goi_List.pdf → Vocabularyシート自動投入）
⑤ classifyAndTranslate.gs（Gemma 4でen+vocab_type自動付与）
⑥ generateImages.gs（v5改修：SSから読み込み）
   generateAudio.gs（改修：SSから読み込み）
⑦ importFromLessonJson.gs（課マスター差分追加・国籍語彙補完）
⑧ タイマートリガー設定（毎日自動実行）
```

---

## 参照すべきプロジェクトファイル一覧

| ファイル | 内容 | 参照タイミング |
|---|---|---|
| `Goi_List.pdf` | N5〜N1全語彙 | ④ extractFromGoiList.gs 実装時 |
| `master_prompt_design_guide_v2_5.py` | 画像プロンプトテンプレートA〜J | ⑥ generateImages.gs 改修時 |
| `lesson_01.json` | 第1課の教育設計データ | ⑦ importFromLessonJson.gs 実装時 |
| `generateAudio.gs` | 音声生成ロジック（改修前）| ⑥ generateAudio.gs 改修時 |
| `image_resolver.js` | registry参照ロジック | ⑥ 互換性確認時 |
| `Plan_v1_1.md` | japanese-lesson-creator側のタスク | 命名規則・連携確認時 |

---

## 注意事項（次チャットで見落としやすい点）

```
1. imageId と audioId は両方 "word_*" で同じ形式（統一済み）

2. syncRegistries.gs の保護ロジックは PROTECTED_PREFIXES と PROTECTED_EXACT で管理。
   新しい保護対象が増えたらここに追加する。

3. registry の "approved" ステータスは GAS が絶対に pending/generated に下げない。
   approved → generated への degradeはバグとして扱う。

4. Goi_List.pdf の parsing は GAS から DriveApp.getFileById で読み取り、
   Gemini 1.5 Flash 等のテキスト抽出 API を使う方法が安定。
   GAS 単体での PDF テキスト抽出は文字化けリスクがある。

5. 国籍語彙（日本人等7語）は extractFromGoiList.gs では追加されない。
   importFromLessonJson.gs（⑦）まで pending のまま放置でよい。

6. build-embedded-data.py は syncRegistries.gs 実行後に手動で実行する。
   GAS の自動実行には含めない（意図的）。
```

---

*資料バージョン：v4.0（2026-05-15）*
*作成チャット：GASパイプライン スプレッドシート設計・初期データ投入・syncRegistries実装チャット*
*前バージョン：gas_pipeline_handoff_v3.md*
