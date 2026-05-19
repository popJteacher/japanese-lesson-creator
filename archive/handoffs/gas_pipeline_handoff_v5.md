# 引き継ぎ資料：マルチメディア資産自動生成パイプライン
**バージョン：v5.0（2026-05-15）**
**前バージョン：gas_pipeline_handoff_v4.md**
**次チャットで着手：⑤ classifyAndTranslate.gs**

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

## このチャットで完了したこと（④ extractFromGoiList.gs）

### 完成済みGASスクリプト

| ファイル | バージョン | 状態 |
|---|---|---|
| `setupSpreadsheet.gs` | v1.0 | ✅ 完成 |
| `seedLesson01.gs` | v1.1 | ✅ 完成 |
| `syncRegistries.gs` | v1.0 | ✅ 完成 |
| **`extractFromGoiList.gs`** | **v1.0** | **✅ 完成（このチャット）** |

---

## ④ extractFromGoiList.gs v1.0 の仕様

### 実行関数一覧

| 関数名 | 用途 | SS書き込み |
|---|---|---|
| `extractN5()` | N5語彙（421語）を投入 ← **通常使用** | あり |
| `extractByLevel()` | `TARGET_LEVELS` 指定レベルを投入 | あり |
| `previewExtract()` | 解析結果をログに表示（ドライラン） | **なし** |
| `testGoiListRead()` | ファイル読み込みと文字修正テスト | なし |

### 設定値（実行前に入力必須）

```javascript
const EXTRACT_SETTINGS = {
  SPREADSHEET_ID:   "YOUR_SPREADSHEET_ID_HERE",
  GOI_LIST_FILE_ID: "YOUR_GOI_LIST_FILE_ID_HERE",  // DriveのファイルID
  TARGET_LEVELS:    ["1.初級前半"],  // N5のみ
  WRITE_LOG:        true,
};
```

**GOI_LIST_FILE_IDの取得方法：**
Google Drive で Goi_List.pdf を右クリック → 「リンクを取得」→
URL中の `/d/{ここ}/view` 部分がファイルID

### 処理フロー

```
1. DriveApp.getFileById(fileId).getBlob().getDataAsString("UTF-8")
   → UTF-8テキストとして読み込み（実態はTSV相当のテキスト）

2. 文字化け修正
   → U+46F3〜U+471D の範囲を offset -0x1690 でひらがなに変換
   → 例: 䜙(U+4719) → ら(U+3089), 䛺(U+46FA) → な(U+306A)

3. チャンク構造をパース
   → 本体チャンク（No/word/reading/level/pos1/pos2）と
     語種チャンク（和語/漢語/外来語/混種語）が交互に出現
   → 各チャンク46行、空行区切り

4. TARGET_LEVELS でフィルタリング

5. Vocabulary シートの A列（word）と重複チェック
   → seedLesson01.gs で投入済みの17語はスキップ

6. 新規語彙をバッチ書き込み（appendRow × N ではなく setValues で1回）
```

### Goi_List.pdf の実際の構造（調査済み確定値）

```
実態：UTF-8テキストファイル（.pdf 拡張子は名前のみ）
総行数：36,597行
総エントリ数：17,908語
チャンク構造：46行単位で交互（本体 / 語種）

難易度別語数：
  1.初級前半（N5）: 421語
  2.初級後半（N4）: 788語
  3.中級前半（N3）: 2,286語
  4.中級後半（N2）: 6,426語
  5.上級前半（N2）: 6,328語
  6.上級後半（N1）: 1,548語

フィールド（スペース区切り6列）：
  No  word  reading（カタカナ）  level  pos1  pos2（スペース含む可）

文字化け：
  U+46F3〜U+471D が offset 0x1690 ずれたひらがな（っ〜ろ の範囲）
  → GAS内で regex replace で一括修正
```

### 書き込まれる Vocabulary シート列の値

| 列 | フィールド | 設定値 | 備考 |
|---|---|---|---|
| A | word | Goi_List の word | 漢字/かな/カナ |
| B | reading | カタカナ→ひらがな変換済み | katakanaToHiragana_() |
| C | en | "" | classifyAndTranslate.gs で付与 |
| D | jlptLevel | "N5"/"N4" 等 | レベルマッピングで変換 |
| E | pos | 正規化済み品詞 | 動詞1/2/3類→動詞, イ/ナ形容詞→形容詞 |
| F | vocab_type | "" | classifyAndTranslate.gs で付与 |
| G | imageId | "word_{word}" | |
| H | imageStatus | "pending" | |
| I | imageUrl | "" | |
| J | audioId | "word_{word}" | |
| K | audioStatus | "pending" | |
| L | audioUrl | "" | |
| M | lessonRef | "" | |
| N | source | "goi_list" | |

### 病院について（N4語彙の扱い）

- 病院は Goi_List では `2.初級後半（N4）` に分類
- `extractN5()` では追加されない（N5のみが対象）
- ただし `seedLesson01.gs` がすでに病院を `lesson_import` として投入済み
- → extractByLevel(N4) 実行時は word 重複チェックにより自動スキップ
- **action不要**：病院は既にSSにある。生成は generateImages.gs（⑥）に任せる

### 国籍語彙（日本人等7語）について

- 日本人・アメリカ人・イギリス人・フランス人・中国人・韓国人・スペイン人
- Goi_List に独立収録なし（〜人 形は別語として登録なし）
- extractFromGoiList.gs では**追加されない**
- → `importFromLessonJson.gs`（⑦）で補完（lesson_01.jsonから差分追加）

---

## 全決定事項（v4からの継続）

### アーキテクチャ（選択B：確定）

```
スプレッドシート（SSOT） → generateImages.gs（v5改修）→ 画像生成
                        → generateAudio.gs（改修）  → 音声生成
                        → syncRegistries.gs         → JSON書き出し
```

### 命名規則（vocab_* → word_*）：完了済み

- `master_image_registry.json`：全語彙キーが `word_*` に変換済み
- `imageId` / `audioId` はどちらも `word_{漢字}` 形式で統一

### syncRegistries.gs 保護ロジック（変更なし）

```javascript
const PROTECTED_PREFIXES = ["char_", "ex_L"];
const PROTECTED_EXACT    = ["world_map"];
// char_* / ex_L* / world_map は絶対に更新しない
```

### レート制限（確定値・変更なし）

| モデル | RPD | 用途 |
|---|---|---|
| Imagen 4 Generate/Fast/Ultra | 各25 | 画像生成（合計75/日）|
| Gemini 2.5 Flash TTS | 10 | 音声生成 |
| Gemini 3.1 Flash TTS | 10 | 音声生成（合計20/日）|
| Gemma 4 26B/31B | 各1,500 | テキスト処理（合計3,000/日）|

### vocab_type マッピング（master_prompt_design_guide_v2_5.py準拠）

```
person           → テンプレートA（医者・先生・学生 等）
building         → テンプレートB（病院・学校・銀行 等）
concrete_object  → テンプレートD（本・ペン・財布 等）
action_verb      → テンプレートH（食べる・飲む・読む 等）
adjective        → テンプレートJ（大きい・小さい・新しい 等）
abstract_concept → テンプレートI（時間・気持ち・自由 等）
spatial_relation → テンプレートF（上・下・右・左 等）
demonstrative    → テンプレートG（これ・それ・あれ 等）
```

---

## 現在の実装状況

### 完成済みファイル

| ファイル | 状態 | 説明 |
|---|---|---|
| `setupSpreadsheet.gs` | ✅ 完成 | 3シート作成・書式・ドロップダウン設定 |
| `seedLesson01.gs` v1.1 | ✅ 完成 | lesson_01語彙17語+例文15件投入 |
| `syncRegistries.gs` v1.0 | ✅ 完成 | SS→JSON差分書き戻し（保護ロジック付き）|
| `extractFromGoiList.gs` v1.0 | ✅ 完成 | Goi_List.pdf → Vocabularyシート自動投入 |
| `generateAudio.gs` | ✅ 完成・改修前 | 現状はJSONファイル読み込み方式 |
| `audio_prompts_lesson1.json` | ✅ 完成 | lesson_01の32件（語彙17+例文15）|
| `master_audio_registry.json` | ✅ 完成 | 32エントリ audioUrl:null |
| `master_image_registry.json` | ✅ v1.4+変換済 | word_* に変換済み |

### 未着手ファイル（作成順）

| # | ファイル | 役割 | 依存 |
|---|---|---|---|
| **⑤** | `classifyAndTranslate.gs` | Gemma 4でen+vocab_type自動付与 | extractFromGoiList完了後 |
| ⑥a | `generateImages.gs`（v5改修） | SS読み込みに変更 | SS完成後 |
| ⑥b | `generateAudio.gs`（改修） | SS読み込みに変更 | SS完成後 |
| ⑦ | `importFromLessonJson.gs` | 課マスター→SS差分追加（国籍語彙補完含む）| SS完成後 |
| ⑧ | タイマートリガー設定 | 毎日自動実行 | ⑥完成後 |

---

## ⑤ classifyAndTranslate.gs の設計（次チャットで着手）

### 目的

Vocabulary シートの `en`（英語訳）と `vocab_type` が空欄の行に対して、
Gemma 4 API を使って自動付与する。

### 処理フロー

```
1. Vocabulary シートから en="" の行を取得（最大1バッチ分）
2. word + reading + pos をGemma 4に送信
3. 以下のJSONを返させる：
   {
     "en": "doctor",
     "vocab_type": "person"
   }
4. Vocabulary シートの C列（en）と F列（vocab_type）を更新
5. Logシートに記録
```

### Gemma 4 APIの呼び出し方

```javascript
// GASからGemini API（Gemma 4）を呼び出す
const MODEL = "gemma-4-26b-it";  // または "gemma-4-31b-it"
const API_KEY = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
```

**注意：APIキーは ScriptProperties に保存（コードに直書きしない）**

### バッチサイズ

- Gemma 4 26B: 1,500 RPD → 1バッチ = 最大50語（安全マージン）
- N5 421語 ÷ 50 = 約8回の実行で完了

### プロンプト設計（JSON出力モード）

```
You are a Japanese vocabulary classifier for JLPT learners.
Given a Japanese word, return ONLY a JSON object with:
- "en": English translation (short, 1-4 words)
- "vocab_type": one of [person, building, concrete_object, action_verb,
  adjective, abstract_concept, spatial_relation, demonstrative, other]

Word: {word}
Reading: {reading}
POS: {pos}

Return only valid JSON. No explanation.
```

### vocab_type マッピング（参照用）

```
person        ← 医者, 学生, 先生 等（人を表す名詞）
building      ← 病院, 学校, 銀行, デパート等（建物・施設）
concrete_object ← 本, ペン, 財布 等（手で触れるもの）
action_verb   ← 食べる, 読む, 飲む 等（動詞全般）
adjective     ← 大きい, 新しい, 便利 等（イ/ナ形容詞）
abstract_concept ← 時間, 気持ち, 意見 等（抽象名詞）
spatial_relation ← 上, 下, 右, 左, そば 等（空間関係）
demonstrative ← これ, それ, あれ, どれ 等（指示語）
other         ← 上記に当てはまらないもの
```

---

## 次チャットの進め方

### アップロード必須ファイル

| ファイル | 必須/任意 | 理由 |
|---|---|------|
| **この資料**（`gas_pipeline_handoff_v5.md`） | **必須** | 全決定事項の参照元 |
| `master_prompt_design_guide_v2_5.py` | **必須** | vocab_typeテンプレート設計の参照 |

### 開始コマンド

```
gas_pipeline_handoff_v5.md の続きです。
⑤ classifyAndTranslate.gs の実装を始めてください。
master_prompt_design_guide_v2_5.py の vocab_type 設計を確認してから進みます。
```

### 進行順序（残タスク）

```
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
| `master_prompt_design_guide_v2_5.py` | 画像プロンプトテンプレートA〜J | ⑤⑥ 実装時 |
| `lesson_01.json` | 第1課の教育設計データ | ⑦ importFromLessonJson.gs 実装時 |
| `generateAudio.gs` | 音声生成ロジック（改修前）| ⑥ generateAudio.gs 改修時 |
| `image_resolver.js` | registry参照ロジック | ⑥ 互換性確認時 |
| `Plan_v1_1.md` | japanese-lesson-creator側のタスク | 命名規則・連携確認時 |

---

## 注意事項（次チャットで見落としやすい点）

```
1. imageId と audioId は両方 "word_*" で同じ形式（統一済み）

2. extractFromGoiList.gs は重複チェックをword列（A列）で行う。
   大文字小文字を区別する（String比較）。全角/半角も区別する。

3. 国籍語彙（日本人等7語）は extractFromGoiList.gs では追加されない。
   importFromLessonJson.gs（⑦）まで pending のまま放置でよい。

4. Goi_List.pdf の読み込みは DriveApp.getFileById().getBlob().getDataAsString("UTF-8")
   で直接読める（実態はテキストファイルのため）。
   Gemini APIによるテキスト抽出は不要。

5. 病院はN4語彙。extractN5()では追加されないが、seedLesson01.gs で
   lesson_import として投入済みなので問題なし。

6. classifyAndTranslate.gs の APIキーは
   PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY")
   で取得する（コードに直書き禁止）。

7. build-embedded-data.py は syncRegistries.gs 実行後に手動で実行する。
   GAS の自動実行には含めない（意図的）。
```

---

*資料バージョン：v5.0（2026-05-15）*
*作成チャット：GASパイプライン extractFromGoiList.gs 実装チャット*
*前バージョン：gas_pipeline_handoff_v4.md*
