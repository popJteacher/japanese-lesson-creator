# CLAUDE.md — Claude Code 自律動作ルール

このファイルを毎回読んでから作業を開始すること。

---

## プロジェクト概要

`design_brief.md` を参照。要点のみ:

- 教師が `session_NNN.json` をアップロード → スライド HTML / 宿題 HTML / アクティビティ HTML / 教案 docx の 4 ファイルをダウンロードできる Web ツール
- 完全静的（ブラウザだけで動く）
- Step 1: 生成エンジン完成 → Step 2: フォーム UI → Step 3: アクティビティ UI 実装

---

## 自律動作のルール

### 自分で判断して進めてよいこと

- バグの修正（原因が明確な場合）
- ライブラリのバージョン変更（同等機能で安定版への切り替え）
- コードのリファクタリング（動作を変えない範囲）
- 動作確認・スクリーンショット取得
- 既知問題リストの照合と確認

### 必ず報告してから進めること（人間の判断が必要）

- 設計方針の変更（例:「完全静的をやめてサーバーを使う」）
- スコープの追加（design_brief.md の「やらないこと」に触れる場合）
- 複数の解決策があり、トレードオフが生じる場合
- Step 完了 → 次 Step への移行

---

## 作業フロー（毎回この順番で進める）

```
1. 現状確認（どのファイルが存在するか・前回どこまで進んだか）
2. 今回のタスクを design_brief.md の完了定義と照合
3. 実装
4. 動作確認（session_001.json でテスト）
5. Stage 1 既知 9 問題リストと照合して再発がないか確認
6. 完了報告（完了したこと・残っていること・次にやること を明示）
```

---

## Step 1 の残タスク（完了済み）

- [x] index.html（ドロップゾーン）
- [x] src/main.js（オーケストレーション）
- [x] src/generators/slide_html.js（スライド HTML）
- [x] src/generators/lesson_plan_docx.js（教案 docx・骨格）
- [x] **教案 docx の Word 開けない問題を修正**
  - docx-js を完全に外し、OOXML を手書きで組み立て JSZip で zip 化するアプローチに切替
  - zip 構造完全（testzip OK）・必須 5 エントリ全存在・XML 整合・UTF-8 日本語正常
- [x] src/generators/homework_html.js（宿題 HTML）
- [x] src/generators/activity_html.js（アクティビティ HTML・hasRequiredActivity 時のみ）

**Step 1 完了 (2026-05-14)**: session_001.json ドロップで 4 ファイル全生成を確認、Stage 1 既知 9 問題 全て再発なしを確認。詳細は当日の動作確認ログ参照。

---

## Step 2 の残タスク（完了済み）

**Step 2 完了 (2026-05-14)**: フォーム UI から第1課 p1 のみ選択で 3 ファイル生成を確認、スライド内容のスコープ整合を確認。

- 実装: `src/ui/form.js`（557 行）/ `index.html` タブ UI 一体
- 確認内容:
  - 文型リスト表示（第1課 3 件 + 第2課 6 件 = 計 9 件・複数課を1リストに混在表示）
  - session 組立（buildSession で `teach[].lessonNo` / `flow[].lessonNo` に課番号を埋込・複数課対応）
  - スライド生成（第1課 p1 のみ選択時、スライドに p1 の文型「〜は〜です」と関連語彙のみ反映され p2/p3 のラベルは含まれないことをスコープ整合として確認）
  - アクティビティ未選択時は 3 ファイル生成（設計どおり）

---

## Plan v1.1（Stage 1〜7）：全完了済み（2026-05-17時点）

`Plan_v1_1.md` に記載の Stage 1〜7（命名規則統一・audioId追加・FlowSynthesizer修正・スライド更新・ビルド確認）は
**全ステージ完了済み**。再実行不要。

---

## Step 3: アクティビティ UI 実装（**完了済み** 2026-05-17確認）

**Step 3 完了確認 (2026-05-17)**：`activity_html.js`（2,249行）の `buildActivityBlock()` を直接検査し、
対象 8 件すべてが専用実装関数に分岐していることを確認。プレースホルダーは `default` 分岐（未知のIDへのフォールバック）にのみ残存し、通常運用では表示されない。

### 実装済み 8 件（確認済み）

| ID | 行範囲 | 実装内容の概要 |
|---|---|---|
| `act_memory_matching` | L566–780 | 神経衰弱：vocab から最大8ペア生成、クリックでめくる UI |
| `act_vocab_bingo` | L781–946 | ビンゴ：vocab≥16で4×4、未満は3×3。無作為呼出し |
| `act_whiteboard_categorize` | L947–1140 | 仲間分け：byPattern グループをカテゴリラベルにD&D |
| `act_grammar_auction` | L1141–1320 | 文オークション：正文2・誤文1を生成してベット UI |
| `act_battleship` | L1321–1492 | 戦艦：行=職業5語・列=国籍5語のマス目 |
| `act_person_guessing_quiz` | L1493–1705 | 人物当て：例文から人物プール構築、namedCharactersフォールバック有 |
| `act_personality_quiz` | L1706–1860 | 性格診断：職業語彙から質問6問、yes数で結果判定 |
| `act_hajimemashite_conversation` | L1861–2083 | 自己紹介会話：namedCharactersで会話ペア生成 |

参考：`act_online_roulette` は L2084–2248（165行）。

---

## data/activity_catalog.json について（**v1.9**）

現在のバージョンは **v1.9（2026-05-17 更新）**。
`data/activity_catalog.json` を編集したら必ず `python scripts/build-embedded-data.py` を実行して `data/activity_catalog.js` を再生成すること。

### v1.9 で重要なフィールド

| フィールド | 意味 | 使いどころ |
|---|---|---|
| `validatedForLessons` | この活動が使える課番号の配列（例: `[1, 2]`） | フォーム UI で課ごとにアクティビティ候補を絞り込む際に参照 |
| `contentRequirement.judgment` | `"required"` = 専用 UI が必要 / `"not_needed"` = スライドで代替可 / `"slide_alt"` = スライド代替推奨 | activity_html.js の生成対象フィルタ |
| `prerequisitePatterns` | 必要な文法概念 ID の配列 | 将来の推薦フィルター用。現状は参照しない |

`usedInLesson1` フィールドは v1.7 で廃止済み。`validatedForLessons` に一本化されている。

---

## data/intro_activity_catalog.json について（**v1.2**）

**v1.2（2026-05-17 更新）**。文型導入前の語彙・文型導入アクティビティのカタログ。`activity_catalog.json`（メインアクティビティ）とは**別ファイル**で管理する。

### 登録済みエントリ（8件）

| activityId | 活動名 |
|---|---|
| `act_picture_card_vocab_intro` | 絵カードによる語彙・基本文型導入 |
| `act_qa_pattern_intro` | 絵カードによる疑問文・応答導入 |
| `act_attribute_modeling_intro` | モデル文拡張による所属・修飾の導入 |
| `act_kosoado_object_intro` | 実物・絵カードによるこそあど語彙導入 |
| `act_possession_intro` | 持ち物・所有表現の導入（〜の〜） |
| `act_famous_person_intro` | 有名人写真による指示連体詞・疑問詞の導入（この/その/あの＋どの） |
| `act_nani_desu_ka_intro` | 意外な実物を使った「何ですか」導入（wh疑問） |
| `act_which_one_intro` | 複数の実物から1つを特定する「どれですか」導入 |

> **注意**：`act_qa_pattern_intro` は「〜ですか / はい・いいえ」クローズド疑問文専用。wh疑問（何ですか）には `act_nani_desu_ka_intro`、選択疑問（どれですか）には `act_which_one_intro` を使う。

---

## GASパイプライン — 音声生成の現行仕様

> **詳細は handoff_v4_4.md §14 が一次情報。本セクションは最小サマリーのみ。**

| 項目 | 現行仕様 |
|---|---|
| 音声API | Google Cloud TTS WaveNet（ja-JP-Wavenet-B） |
| 形式 | WAV / LINEAR16 |
| バッチ上限 | 50件/回（MAX_BATCH_SIZE） |
| APIキー | `GCP_TTS_KEY`（ScriptProperties） |
| Phase 1（WAVヘッダー二重化バグ） | ✅ 修正済み（`buildCloudTtsWavBlob_()` 新設） |
| Phase 2（音量正規化） | ⏳ 未対応（全件生成完了後に Python+FFmpeg で実施予定） |
| Phase 3（冒頭/末尾無音調整） | ⏳ 未対応（Phase 2 と一括実施予定） |
| Phase 4（SSMLアクセント補正） | ⏳ 未対応（試聴後に問題語を対象に実施予定） |

⚠️ **v4.3 以前に生成された .wav ファイルはWAVヘッダー二重化の不良ファイル。使用しないこと。**

---

## 課マスター（lesson_NN.json）の現在地

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | lessonVer 1.1 | ✅ 完成・GAS投入済み |
| `lesson_02.json` | **v2.11.11** | ✅ **第2課マスター完成**・GAS投入待ち |
| `lesson_03.json` | — | ⏳ 未着手（SKILL_v1_6.md Step 1a から開始） |

---

## data/lesson_NN.json スキーマ要件（全課共通仕様）

新規に lesson_NN.json を作成する場合・既存ファイルを編集する場合は、以下のフィールド要件に必ず従うこと。
**slide_html.js は全課共通の汎用ロジックなので、ここを満たしていればスライド生成側の修正は不要**。

### patterns[] エントリ必須フィールド

| フィールド | 型 | 必須 | 用途 |
|---|---|---|---|
| `id` | string | ✅ | `p1`/`p2`/... 文型 ID |
| `pattern` | string | ✅ | 文型の表記（例: `〜は〜です`） |
| `label` | string | ✅ | スライドタイトル・パターンボックスで使用 |
| `grammarConcept` | string | ✅ | 教科書非依存の文法概念 ID（snake_case 英語） |
| `jlptLevel` | string | ✅ | `N5`/`N4`/... |
| `canDo` | string | ✅ | 「今日の目標」「文型」「まとめ」スライドに日本語で表示 |
| **`canDoEn`** | **string** | **✅ (v2.11.2 以降)** | **英語トグル ON 時に上記 3 スライドで `.en-text` 付きで表示。lesson_NN.json 作成時に必ず追加すること。** |
| `vocabCount` | number | ✅ | 文型で扱う語彙数 |
| `shareVocabWith` | string\|null | 任意 | 別の文型 ID の語彙を流用する場合 |
| `examples` | array | ✅ | 例文配列。各 example は `isAnchor: true/false` 必須（true は 1 文型 1 件のみ） |
| `practiceTemplates` | array | ✅ | 練習テンプレ配列 |

### examples[] エントリ必須フィールド

| フィールド | 必須 | 用途 |
|---|---|---|
| `no` | ✅ | 例文番号（例: `1-1`） |
| `sentence` | ✅ | 例文本文（日本語） |
| `sentenceEn` | ✅ | 例文英訳（英語トグル時表示） |
| `imageId` | ✅ | `ex_LNN_NNN` 形式・master_image_registry.json と対応 |
| `imageRole` | ✅ | `scene`（16:9 表示）/ `vocab_person`（1:1 表示）等 |
| **`audioId`** | **✅ (v2.11 以降)** | **`sentence_ex_LNN_NNN` 形式（master_audio_registry.json で予約）** |
| **`isAnchor`** | **✅ (v2.11 以降)** | **boolean。1 文型につき true は 1 件のみ。代表例文として大カード描画＋まとめスライドのアンカー表示に使用** |
| `originalSources` | 任意 | PDF/教科書由来の根拠記録 |

### vocabulary[].words[] 必須フィールド

| フィールド | 必須 | 用途 |
|---|---|---|
| `word` / `reading` / `en` / `jlptLevel` / `isFirstAppearance` / `vocabType` / `imageRole` | ✅ | 従来通り |
| **`imageId`** | **✅ (v2.11 以降)** | **`word_X` 命名規則（master_image_registry.json と対応）** |
| **`audioId`** | **✅ (v2.11 以降)** | **`word_X` 命名規則（master_audio_registry.json で予約）** |

### namedCharacters[] セクション（intro_activity スライドで参照）

各課の固有人物を定義する。

```json
"namedCharacters": [
  { "name": "氏名さん", "occupation": "職業", "nationality": "国籍", "imageId": "char_氏名" }
]
```

### flow[] エントリ

文型ブロック構造（v2.11 以降）：`intro_act_pN → pattern_pN → example_pN → practice_pN` を各文型分繰り返す。
`example_pN` / `practice_pN` は `patternRef` で対象文型を指定する。

> **`_meta` バージョン管理フィールド名（実態から確定）：**
> - 課マスター（lesson_NN.json）のバージョンフィールドは `lessonVersion`（`lessonVer` ではない）
> - カタログ系 JSON の更新日フィールドは `lastModified`（`lastUpdated` ではない）

---

## Step 1 完了の定義

以下が全て満たされたら Step 1 完了。人間に報告する。

1. session_001.json をドラッグしたら 4 ファイルがダウンロードできる
2. 4 ファイルがブラウザ／Word で開いて中身が正しく表示される
3. Stage 1 既知 9 問題が再発していない（下記リスト参照）

---

## Step 2 完了の定義

以下が全て満たされたら Step 2 完了。人間に報告する。

1. 「フォームで作成」タブの文型リストに、`window.EmbeddedData.lessons[]` 配下の全課の文型が表示される
2. 学習者 ID と文型 1 件以上を選択して「教材を生成」を押すと、生成エンジン（main.js）が起動して教材ファイルがダウンロードできる（アクティビティ未選択時は 3 ファイル、選択時は 4 ファイル）
3. 生成されたスライドの内容が選択文型のスコープと一致する（選択しなかった文型のラベル・例文が混入しない）
4. Stage 1 既知 9 問題が再発していない

---

## Stage 1 既知 9 問題チェックリスト

実装・修正のたびに照合すること:

| # | 問題 | 対策 | 確認方法 |
|---|---|---|---|
| 1 | Google Drive 画像が表示されない | `lh3.googleusercontent.com/d/{id}=w{size}` に正規化済み | スライドで画像が表示されるか目視 |
| 2 | ふりがなが本文より大きい | `--font-size-ruby` を独立変数化済み | ふりがなが本文より小さいか目視 |
| 3 | ふりがな OFF でもスペース残る | `display: none` で完全消去済み | OFF 時にスペースが残らないか確認 |
| 4 | ふりがな色が漢字と違う | `color: inherit` 済み | ふりがなと本文の色が一致するか目視 |
| 5 | トグルボタンに ruby | UI 要素には rubify しない済み | ボタンにふりがながないか確認 |
| 6 | スライドラベルが英語 | すべて日本語済み | ラベルが日本語かどうか確認 |
| 7 | 学習目標スライドが空欄 | `teach[].patternId → patterns.canDo` 集約済み | 目標スライドに文字が入っているか確認 |
| 8 | カウンタが合わない | subSlides 展開・1/N 表示一致済み | スライド枚数とカウンタが一致するか確認 |
| 9 | デザイン不一致 | 共通 design_tokens を全 HTML に埋め込み済み | 3 種の HTML でフォント・色が統一されているか確認 |

---

## ファイルパス対応表（コピー元 → 新リポジトリ）

| コピー元（japanese-lesson-html） | 新リポジトリのパス |
|---|---|
| `shared/common/flow_synthesizer.js` | `src/common/flow_synthesizer.js` |
| `shared/common/image_resolver.js` | `src/common/image_resolver.js` |
| `shared/common/ruby_dictionary.js` | `src/common/ruby_dictionary.js` |
| `shared/common/design_tokens.css` | `src/styles/design_tokens.css` |
| `shared/common/fonts_imports.css` | `src/styles/fonts_imports.css` |
| `lesson_configs/lesson_01.json` | `data/lesson_01.json` |
| `lesson_configs/lesson_02.json` | `data/lesson_02.json` |
| `session_configs/session_001.json` | `data/session_001.json` |
| `activity_catalog.json` | `data/activity_catalog.json` |
| `intro_activity_catalog.json` | `data/intro_activity_catalog.json` |
| `master_image_registry.json` | `data/master_image_registry.json` |
| `master_audio_registry.json` | `data/master_audio_registry.json` |

---

## 禁止事項

- `shared/slide/`, `shared/homework/`, `shared/activity/`, `shared/lesson_plan/` は参照しない（Stage 1 の破棄済み実装）
- `students/` 配下のファイルは参照しない
- `data.js` を事前生成する方式に戻さない
- handoff ファイル・SKILL.md・段階管理ファイルを新規作成しない
- 設計書（design_brief.md）のスコープ外の機能を追加しない

---

## 更新履歴

| 日付 | 更新内容 |
|---|---|
| 2026-05-14 | Step 1・Step 2 完了。Stage 1 既知 9 問題チェックリスト追加 |
| 2026-05-15 | Plan v1.1 Stage 1〜7 対応。スキーマ要件（audioId・isAnchor・canDoEn）追加 |
| 2026-05-17 | **activity_catalog を v1.9 に更新。intro_activity_catalog v1.2 セクション追加。lesson_02.json v2.11.9 完成状態を反映。ファイルパス対応表に intro_activity_catalog / master_audio_registry を追加。Plan v1.1 Stage 全完了を明記。SKILL.md v1.4 への参照を修正。** |
| 2026-05-17 | **Step 3 を「完了済み」に更新。activity_html.js（2,249行）の直接検査により対象8件全ての実装を確認。** |
| 2026-05-18 | generateAudio.gs を v3.0 に更新（Gemini TTS → Google Cloud TTS WaveNet 移行）。音声は ja-JP-Wavenet-B・WAV(LINEAR16)・MAX_BATCH_SIZE=50。 |
| 2026-05-18 | generateAudio.gs / setupSpreadsheet.gs に Phase 1 WAVヘッダー二重化バグ修正適用（buildCloudTtsWavBlob_() 新設・全件再生成進行中）。音声パイプライン詳細は handoff_v4_4.md §14 参照。 |
