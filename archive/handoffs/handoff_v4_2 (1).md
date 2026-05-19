# 引き継ぎ資料 v4.2
**バージョン：v4.2（2026-05-18）**
**前資料：handoff_v4_1.md（2026-05-17）**
**このバージョンで修正した内容：lesson_02 品質問題の全件修正・3ファイル更新・SKILL v1.6 残課題追加**

---

## ⛔ このドキュメントの編集ルール（次チャットの Claude へ）

### 削除・省略・短縮が禁止されているセクション

| セクション | ルール |
|---|---|
| §4 GASパイプライン解決済み問題 | **追記のみ・削除禁止**（再発時の対処記録） |
| §5 課題ライフサイクル一覧 | **追記のみ・削除禁止**（解決理由・経緯の記録） |
| §6 課マスター設計ライン | **確定事項の追加のみ・既存削除禁止** |
| §9 ロードマップ | **追記・チェック更新のみ**（完了状態の書き換えは可） |
| §10 このチャットで判明したこと | **追記のみ・削除禁止** |

### 引き継ぎ更新の手順（次 handoff 作成時）

```
1. この資料を全文読む
2. 今チャットで追加・変更・完了した内容を特定する
3. 各セクションに「追記」する（書き直しではなく）
4. バージョン番号を 4.2 → 4.3（または 5.0）に更新する
5. 更新後、変更した箇所の一覧を出力する
6. ファイル・スクリプト・SKILL のバージョン番号が実態と一致しているか確認する
7. 全体として前バージョンより短くなっている場合は必ず理由を §10 に書く
```

### 禁止事項

- 「解決済みだから削除」による情報圧縮
- 「まとめると〜」「要約すると〜」による情報圧縮
- ファイル名・バージョン番号を確認せずに引き継ぐ（例：SKILL_v1_X.md のバージョンは毎回 project knowledge のファイル名で確認すること）
- 前バージョンより短い引き継ぎを確認なしに作成すること

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **lesson_02 語彙 GAS投入** | `importFromLessonJson.gs` の `LESSON_FILE_IDS` に `lesson_02` のファイルIDを追加 → `importByFileId()` 実行。**投入するファイルは `lesson_02_v2_11_10.json`（最新版）** |
| **②** | **GASパイプライン稼働確認** | Vocabulary シートの列C/F/H/K を確認。classifyBatch がほぼ完了しているはず |
| **③** | **SKILL v1.6 更新** | `teacher_real_object` を公式 type として追加（§13 参照）。その他 playerSteps ルール明文化・_step1c_check 記述修正も同時に実施 |
| **④** | **lesson_03.json 作成開始** | `SKILL_v1_5.md`（次バージョンは `SKILL_v1_6.md`）の Step 1a（骨格設計）から開始 |

> **次チャットへのアップロード必須ファイル：**
> - `handoff_v4_2.md`（この資料）
> - `lesson_02_v2_11_10.json`（GAS投入対象・**v4.1 の v2.11.9 ではなく v2.11.10 を使うこと**）
> - `SKILL_v1_5.md`（v1.6 更新作業に必要）
> - 必要に応じて `lesson_template.json`（第3課作成時）

---

## §1. プロジェクト全体の位置づけ

```
【ライン A：japanese-lesson-creator】（Claude Code実装・リポジトリ）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTML/教案docxを生成するWebツール
  → 2026-05-18時点で全実装完了

【ライン B：GASパイプライン】（Google Apps Script）
  語彙・例文の画像・音声を自動生成してGoogle Driveに蓄積する
  → 自動処理は稼働中。lesson_02 GAS投入のみ手動作業が残っている

【連携インターフェース】
  master_image_registry.json → image_resolver.js → slide_html.js
  master_audio_registry.json → homework_html.js（将来）
  build-embedded-data.py で両ラインを手動接続（syncAll完了後に実行）
```

---

## §2. ライン A の完了状態（japanese-lesson-creator）

### 全ステップ完了一覧

| Step / Stage | 内容 | 状態 | 完了日 |
|---|---|---|---|
| Step 1 | 生成エンジン（4ファイル出力） | ✅ 完了 | 2026-05-14 |
| Step 2 | フォーム UI | ✅ 完了 | 2026-05-14 |
| **Step 3** | **アクティビティ UI 実装（8件）** | ✅ **完了（v4.1で確認）** | 実装済み・2026-05-17確認 |
| Plan v1.1 Stage 1〜7 | 命名規則統一・audioId・FlowSynthesizer修正・スライド更新・ビルド確認 | ✅ 完了 | 2026-05-15 |
| データ同期 | 全データファイルを最新版に差し替え | ✅ 完了 | 2026-05-17 |

### Step 3 実装済み 8 件（activity_html.js 2,249行）

| activityId | 行範囲 | 実装内容の概要 |
|---|---|---|
| `act_memory_matching` | L566–780 | 神経衰弱：vocab から最大8ペア、クリックでめくる |
| `act_vocab_bingo` | L781–946 | ビンゴ：vocab≥16で4×4、未満は3×3 |
| `act_whiteboard_categorize` | L947–1140 | 仲間分け：byPattern グループをD&D |
| `act_grammar_auction` | L1141–1320 | 文オークション：正文2・誤文1でベット UI |
| `act_battleship` | L1321–1492 | 戦艦：行=職業5語・列=国籍5語のマス目 |
| `act_person_guessing_quiz` | L1493–1705 | 人物当て：namedCharacters フォールバック有 |
| `act_personality_quiz` | L1706–1860 | 性格診断：職業語彙から質問6問 |
| `act_hajimemashite_conversation` | L1861–2083 | 自己紹介会話ロールプレイ |

> `act_online_roulette`（L2084–2248）は Step 3 スコープ外で先行実装済み。

---

## §3. リポジトリのファイル構成と現在バージョン

### データファイル（data/）

| ファイル | バージョン | 最終更新 | 内容 |
|---|---|---|---|
| `lesson_01.json` | lessonVer 1.0 / fmt 2.7 | 2026-05-15 | 第1課「名詞」p1〜p3（3文型）・全必須フィールド完備 |
| `lesson_02.json` | **lessonVer 2.11.10** / fmt 2.7 | **2026-05-18** | 第2課「こそあど」p1〜p6（6文型）・品質修正完了（v4.2） |
| `activity_catalog.json` | **v1.9** | **2026-05-17** | **58件**（validatedForLessons:[1]=40件・required=13件） |
| `intro_activity_catalog.json` | **v1.2** | **2026-05-17** | 導入アクティビティ8件 |
| `master_image_registry.json` | **v2.0** | **2026-05-18** | **109件**・全 imageUrl: null（GAS生成待ち）※下記注意 |
| `master_audio_registry.json` | **v1.2** | 2026-05-17 | 84件・全audioUrl: null（GAS生成待ち） |
| `image_prompts_lesson2.json` | **v2.0** | **2026-05-18** | 語彙17件・例文16件（計33件） |
| `session_001.json`（リポジトリ） | fmt 2.0 | 2026-05-15 | ✅ 新フォーマット（mainActivities形式・flow廃止済み） |
| `session_001.json`（ナレッジコピー） | **fmt 1.0** | 2026-05-05 | ⚠️ **旧フォーマットのまま**（flow/activity残存・テスト時は使わない） |

> **⚠️ レジストリのURL状態に関する重要な注意（v4.1で判明）：**
> `master_image_registry.json` v2.0 の全 imageUrl は null。GASパイプライン移行時にリセットされており、GAS の `generateImageBatch` → `syncAll` が生成・書き戻すまで null のまま。char_*・world_map も含めて全て null。これは設計どおりの正しい状態。

> **⚠️ v4.2 の master_image_registry 変更点：**
> v1.9（95件）→ v2.0（109件）。追加分は lesson_02 の例文 ex_L02_015〜028（14件・status: pending）。outdated 6件（ex_L02_002/005/006/011/012/013）は参照ミス追跡のため保持。

### ソースファイル（src/）

| ファイル | 状態 | 備考 |
|---|---|---|
| `src/main.js` | ✅ 最新 | 常にFlowSynthesizer経由 |
| `src/ui/form.js` | ✅ 最新 | flow フィールド廃止・mainActivities形式 |
| `src/common/flow_synthesizer.js` | ✅ 最新 | |
| `src/common/image_resolver.js` | ✅ 最新 | lh3.googleusercontent.com/d/{id}=w{size} 形式 |
| `src/common/ruby_dictionary.js` | **✅ v1.2** | lesson_02語彙17/18語カバー済み（「病院」のみ未登録・要対応）**ヘッダーの参照バージョン表記が v2.11.7・17語のまま → 次チャットで v2.11.10・18語に修正**|
| `src/styles/design_tokens.css` | ✅ 最新 | |
| `src/generators/slide_html.js` | ✅ 最新 | 全8typeスライド実装済み（Stage 6完了）|
| `src/generators/homework_html.js` | ✅ 最新 | |
| `src/generators/activity_html.js` | ✅ 最新 | 2,249行・9件実装済み |
| `src/generators/lesson_plan_docx.js` | ✅ 最新 | OOXML手書き・JSZip方式 |

### ドキュメント・設定ファイル

| ファイル | バージョン | 最終更新 | 変更内容 |
|---|---|---|---|
| `CLAUDE.md` | — | **2026-05-17** | activity_catalog v1.9・intro_activity_catalog追加・Step 3完了反映 |
| `README.md` | — | **2026-05-17** | ディレクトリ構成・build対象表を更新 |
| `scripts/build-embedded-data.py` | — | — | 全6ファイル対応済み（intro_activity_catalog・master_audio_registryを含む） |

### プロジェクトナレッジ専用ファイル（SSOT・リポジトリには入れない）

| ファイル | バージョン | 用途 |
|---|---|---|
| `SKILL_v1_5.md` | **v1.5**（**→ v1.6 更新が次チャット③の作業**） | 課マスター作成ガイド（claude.aiチャット用） |
| `lesson_template.json` | v1.2 | 新規課作成のベーステンプレート |
| `master_prompt_design_guide_v2_5.py` | v2.5 | 画像生成プロンプト設計ガイド（GAS用） |
| `ruby_dictionary_v1_2.js` | v1.2 | SSoT版（リポジトリ版と同一内容） |

---

## §4. ライン B の現在状態（GASパイプライン）

### GASスクリプト 8本（全完成・稼働中）

| スクリプト | 状態 |
|---|---|
| `setupSpreadsheet.gs` | ✅ 完成（初期構築済み） |
| `seedLesson01.gs` | ✅ 完成（投入済み） |
| `extractFromGoiList.gs` | ✅ 完成（N5 412語投入済み）|
| `importFromLessonJson.gs` | ✅ 完成・**lesson_02のファイルID未入力** |
| `classifyAndTranslate.gs` | ✅ 稼働中（毎時3語・自動） |
| `generateImages.gs` | ✅ 稼働中（1日3回・自動） |
| `generateAudio.gs` | ✅ 稼働中（1日3回・自動） |
| `syncRegistries.gs` | ✅ 稼働中（毎日23:00・自動） |

### 自動タイマートリガー（全稼働中）

| 関数 | 頻度 | モデル |
|---|---|---|
| `classifyBatch` | 毎時 | Gemma 4 26B（`gemma-4-26b-a4b-it`）・3語/回 |
| `generateImageBatch` | 毎日 9:00・13:00・17:00 | Imagen 4（`imagen-4.0-generate-001`）・最大25枚/日 |
| `generateAudioBatch` | 毎日 10:00・14:00・18:00 | Gemini TTS（`gemini-2.5-flash-preview-tts`）・最大10件/日 |
| `syncAll` | 毎日 23:00 | — |

### 確定済み設定値（変更不要）

```javascript
SPREADSHEET_ID:    "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk"
GOI_LIST_FILE_ID:  "1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA"
LESSON_FILE_IDS:
  lesson_01: "1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c"
  lesson_02: "← Google DriveにアップロードしたファイルIDを入力"
IMAGE_REGISTRY_ID: "14NL_LqudXIQzY68klspH3SBlR21hiqbW"
AUDIO_REGISTRY_ID: "1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0"
CLASSIFY_SETTINGS.MODEL:  "gemma-4-26b-a4b-it"（BATCH_SIZE: 3）
IMAGE_SETTINGS.MODEL:     "imagen-4.0-generate-001"
AUDIO_SETTINGS.MODEL:     "gemini-2.5-flash-preview-tts"（VOICE_NAME: "Aoede"）
```

### 保護対象エントリ（syncRegistries.gs で保護済み）

| プレフィックス | 対象 | 理由 |
|---|---|---|
| `char_` | char_鈴木〜char_ケリー | 実URL存在・上書き禁止 |
| `ex_L`（前方一致） | ex_L01_007〜015 等 | GASスコープ外 |
| `world_map`（完全一致） | 地図画像 | imageUrl: null のまま保持 |

### 使用可能なモデル（確定情報）

| 用途 | モデル | 状態 |
|---|---|---|
| テキスト分類 | `gemma-4-26b-a4b-it` | ✅ 使用可 |
| 画像生成 | `imagen-4.0-generate-001` | ✅ 25枚/日 |
| 画像生成（代替） | `imagen-4.0-fast-generate-001` | ✅ 25枚/日（デュアル運用で50枚/日化） |
| 音声生成 | `gemini-2.5-flash-preview-tts` | ✅ 10件/日 |
| ❌ 使用不可 | `gemini-2.0-flash` / `gemini-1.5-flash` / `gemma-3-27b-it` | limit:0 または404 |

### GASパイプライン v7→v8 で解決済みの問題（記録・再発時の対処法）

| 問題 | 原因 | 解決策（適用済み） |
|---|---|---|
| **音声発音が不正確**（「会社員」→「アイシェイン」） | Aoede ボイスは日本語専用でなく英語圏発音で処理 | TTSテキストに「日本語で読み上げてください：」プレフィックス付与。**`systemInstruction` は TTS で非対応（HTTP 500）** |
| **classifyBatch が6分制限でタイムアウト** | GAS実行時間制限 | `BATCH_SIZE: 3`（1バッチ最大210秒）。このAPIキーで generateContent に使えるのは `gemma-4-26b-a4b-it` のみ |
| **classifyBatch JSONパース失敗** | Gemma 4 thinking mode の思考テキスト内の `}` を誤取得 | `parseGemmaResponse_()` を最初の `{}` のみ抽出に変更 |
| **vocab_type 空のまま画像生成→品質低下** | 分類前の行が画像生成対象になっていた | `getPendingImageRows_()` に `vocabType !== ""` 条件追加 |
| **バッチエラーで残クォータ無駄** | 1日1回実行で失敗すると無駄 | 1日3回実行に変更（画像9/13/17時・音声10/14/18時）|
| **STYLE_RECIPE 不完全** | sub_color / skin_tones 欠落 | `#6B7C85`追加。`checkStyleRecipe()` で確認可 |
| **concrete_object プロンプト未最適化** | 語彙ごとの特徴未指定 | `OBJECT_SIGNATURES` 辞書追加（雑誌・本・新聞等10語）|

---

## §5. 課題ライフサイクル一覧（全引き継ぎ資料 v4〜v19 + v2/v3 横断追跡）

### ✅ 解決済み（過去に「未解決」とされていたが現在は完了）

（v4.1 内容を全て継承・追記のみ）

| 課題 | 初出 | 解決バージョン | 現在の状態 |
|---|---|---|---|
| **残課題D：Skill設計・実装** | v10 | v4.1 | ✅ SKILL_v1_5.md として実現 |
| **残課題E：lesson_02照合・作成** | v11 | v4.1 | ✅ lesson_02 v2.11.9 完成 |
| **残課題B：lesson_01完成宣言** | v12 | v14 | ✅ 2026-05-15 宣言済み |
| **残課題A/F/G：activity_catalog整備** | v12 | v4.1 | ✅ v1.9 完成（58件） |
| **lesson_02 materialNeeds 非標準 type** | — | **v4.2** | ✅ `special_diagram`/`special_comparison_table` → `special_slide` に統一 |
| **lesson_02 A-4 reusedFrom 非対称** | — | **v4.2** | ✅ intro_act_p3/p4 に `reusedFrom: "intro_act_p1"` 追加 |
| **lesson_02 `_meta._phase1f_handover` 混入** | — | **v4.2** | ✅ lesson_02 の `_meta` から除去 |
| **master_image_registry L02 例文 14件未登録** | — | **v4.2** | ✅ ex_L02_015〜028 を registry v2.0 に追加（status: pending） |
| **image_prompts_lesson2 語彙・例文の不整合** | — | **v4.2** | ✅ 語彙3件追加（わたし/犬/写真）・例文5件追加（029/031/033/034/035）・旧3件削除 |

### 🔴 未解決・要対応（次チャット以降）

| 課題 | 優先度 | 対応 |
|---|---|---|
| **lesson_02 GAS投入** | 高 | importByFileId（次チャット①）。**投入ファイル: lesson_02_v2_11_10.json** |
| **SKILL v1.5 → v1.6 更新** | 中 | 次チャット③。詳細は §13 参照 |
| **ruby_dictionary ヘッダー修正** | 低 | SECTION 6 の「lesson_02.json v2.11.7 SSOT・17語」→「v2.11.10・18語」に更新 |
| **lesson_02 _step1c_check 記述修正** | 低 | 「p4 に plusAlpha『どちら』を追加」と記述しているが実際は examples[] に収録済み。記述を実態と一致させる |
| **playerSteps ルール解釈の明文化** | 低 | 「先生が〜する」という教師動作への言及の許容範囲を SKILL に追記 |
| **image_prompts 画像化対象マーク未付与 4件** | 低 | ex_L02_022/025/026/028 が image_prompts に存在するが lesson_02 の `_comment` に「画像化対象」マークなし。lesson_02 側に `_comment` 追記または image_prompts 側を整理 |
| **ナレッジ版 session_001.json が旧フォーマット（v1.0）** | 中 | リポジトリ版（v2.0）が正。ナレッジ版でテストしないこと |
| **ruby_dictionary「病院」未登録** | 中 | lesson_02 授業前に追加 |
| **act_info_gap_picture UI 未実装** | 中 | lesson_02 唯一の required アクティビティ。lesson_02 授業前に実装 |
| **lesson_01 p3 キムさん重複** | 低 | 3-3（東西銀行）と3-5（東西デパート）でキムさん重複（v19既知） |
| **activity_html.js imageRegistry未接続** | 低 | 画像生成フェーズ完了後に各 build*() 関数へ接続 |
| デザイン微調整 | 低 | 例文グリッド下線不揃い等（v18/v19既知・5件） |

---

## §6. 課マスター設計ライン

### 完成済みの課マスター

| 課 | ファイル | バージョン | 文型 | 状態 |
|---|---|---|---|---|
| 第1課 | `lesson_01.json` | fmt 2.7 / lessonVer 1.0 | p1〜p3（名詞・3文型） | ✅ 完成・GAS投入済み |
| 第2課 | `lesson_02.json` | fmt 2.7 / lessonVer **2.11.10** | p1〜p6（こそあど・6文型） | ✅ 完成・**GAS投入待ち** |
| 第3課以降 | — | — | — | ⏳ 未着手 |

### 第2課の内容（参考）

| パターン | 文型 | grammarConceptID | practiceImageSource |
|---|---|---|---|
| p1 | これ/それ/あれ は 〜 です | `kosoado_pronoun_thing` | `vocabulary` |
| p2 | 〜は 何ですか | `interrogative_what` | `vocabulary` |
| p3 | 〜の〜（所有） | `noun_no_possession` | `vocabulary` |
| p4 | 〜は どれですか | `interrogative_which_thing` | `vocabulary` |
| p5 | この/その/あの + N | `kosoado_attributive` | `namedCharacters` |
| p6 | どの + N | `interrogative_which_attributive` | `namedCharacters` |

> p1〜p4 が `vocabulary`、p5〜p6 が `namedCharacters`。lesson_01 の「疑問文→namedCharacters」ルールはそのまま適用されない。

### lesson_02 materialNeeds 公式 type 一覧（v4.2 確定）

SKILL v1.5 で定義された6種に加え、**`teacher_real_object` を v1.6 で公式追加予定**。

| type | 説明 | 分類 |
|---|---|---|
| `auto_generated_vocab` | AI生成の語彙・場面イラスト | A |
| `named_character_card` | 名前付き人物カード | A |
| `special_slide` | 地図・比較表・領域対立図・こそあど一覧表など特殊スライド（**v4.2で `special_diagram`/`special_comparison_table` を統合**） | C |
| `special_handout` | 学習者配布物 | C |
| `teacher_photo` | 教師が自分で用意する写真・印刷物 | B |
| `teacher_real_object` | **教師が用意する実物**（時計・ペン・かばん等）。写真と異なり物理的な実物（**v1.6 で公式追加予定**） | B |
| `none` | 板書のみ・素材不要 | — |

---

（§6 続き：SKILL.md 運用・Step 1a〜1f・プロセスA・プロセスB・素材3分類・activity_catalog スキーマ・imageRole方針・必須フィールド一覧・canDoEn・practiceImageSource・isAnchor・namedCharacters・vocab_* → word_*・ruby_dictionary・intro_activityスライド・FlowSynthesizerバイパスバグ記録は v4.1 §6 の内容をすべて継承。変更なし。）

---

## §7. 語彙追加・GASパイプライン操作マニュアル

（v4.1 §7 の内容をすべて継承。変更なし。）

---

## §8. 次チャット 作業詳細

### ① lesson_02 語彙 GAS投入

```
1. lesson_02_v2_11_10.json を Google Drive にアップロード（v2.11.9 ではなく v2.11.10 を使うこと）
2. importFromLessonJson.gs の LESSON_FILE_IDS に追加：
   lesson_02: "YOUR_LESSON_02_JSON_FILE_ID_HERE"
3. previewImport("ファイルID") でドライラン確認
4. importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02") を実行
5. Vocabulary シートで lesson_02 語彙の追加を確認
```

**期待される投入語彙（18語）：** 時計・腕時計・ペン・鉛筆・ケータイ・本・雑誌・新聞・かばん・消しゴム・ビル・市役所・山・人・わたし・犬・写真（+ 病院はlesson_01 投入済み）

### ② GASパイプライン稼働確認

（v4.1 §8 の内容と同じ）

### ③ SKILL v1.5 → v1.6 更新（詳細は §13 参照）

```
SKILL_v1_5.md をアップロードして以下を追加・修正：
1. materialNeeds type 一覧に teacher_real_object を追加（説明・分類Bと明記）
2. playerSteps ルールに「先生が〜する」表現の許容範囲を追記
3. postCompletionChecklist の materialNeeds チェック項目を更新
4. 版履歴に v1.6 追加
5. SKILL_v1_6.md として出力
```

### ④ lesson_03.json の作成開始

SKILL_v1_6.md（③完了後）の Step 1a（骨格設計）から開始。  
第3課の文型シラバス（〜があります/います・〜で・〜に等）は SKILL §文型シラバスを参照。

---

## §9. ロードマップ

```
【完了済み（v4.2 時点）】
  ✅ ライン A 全工程（Step 1〜3・Stage 1〜7・データ同期）
  ✅ lesson_01.json / lesson_02.json v2.11.10（品質修正完了）
  ✅ activity_catalog v1.9（58件）/ intro_activity_catalog v1.2（8件）
  ✅ master_image_registry v2.0（109件）/ master_audio_registry v1.2（84件）
  ✅ image_prompts_lesson2.json v2.0（語彙17件・例文16件）
  ✅ ruby_dictionary.js v1.2（lesson_02語彙17/18語・「病院」はlesson_01収録済み）
  ✅ CLAUDE.md / README.md 更新
  ✅ SKILL_v1_5.md
  ✅ GASパイプライン 8本完成・稼働中

【次チャット（チャット⑨）：必須】
  ① lesson_02 語彙 GAS投入（lesson_02_v2_11_10.json を使用）
  ② GASパイプライン稼働確認
  ③ SKILL v1.5 → v1.6 更新（teacher_real_object 公式追加等）
  ④ lesson_03.json 作成開始（SKILL_v1_6.md Step 1a〜）

【lesson_02 授業前に必須】
  ⑤ ruby_dictionary.js に「病院」を追加
  ⑥ act_info_gap_picture UI 実装（activity_blocks/ に追加）

【その後：第2課授業実施まで】
  ⑦ 画像・音声の自動生成（GASタイマー・放置でOK）
  ⑧ syncAll 実行 → master_image_registry / master_audio_registry 更新
  ⑨ build-embedded-data.py 実行 → HTML 反映
  ⑩ activity_html.js の imageRegistry 接続（画像生成完了後）
  ⑪ lesson_02 授業実施可能 🎉

【低優先度・次チャット以降随時】
  ─ ruby_dictionary ヘッダー修正（v2.11.7→v2.11.10・17語→18語）
  ─ lesson_02 _step1c_check 記述修正（どちら の配置説明を実態に合わせる）
  ─ image_prompts 画像化対象マーク未付与 4件の整合
  ─ ナレッジ版 session_001.json を fmt 2.0 に更新

【中長期】
  ─ lesson_03〜NN の作成（SKILL に従って順次）
  ─ N4語彙追加（788語）→ extractByLevel() で実施
  ─ vocabFilter / exampleFilter の実装（マネタイズ差別化機能）
  ─ 日本語辞書サイトへの展開（word_*/sentence_* 資産の転用）
  ─ SaaS化・マネタイズ
  ─ lesson_01 p3 キムさん重複問題の解消
```

---

## §10. このチャットで判明したこと・確定した事項

（v4.1 §10 の内容をすべて継承。以下に v4.2 で追加した判明事項を追記。）

| 判明事項 | 詳細 |
|---|---|
| **Step 3 は実装済みだった**（v4.1 継承） | CLAUDE.md の「保留中」記載は誤り。activity_html.js 2,249行を直接検査し8件全て確認 |
| **build-embedded-data.py は完成済み**（v4.1 継承） | intro_activity_catalog / master_audio_registry を含む全6ファイルが既にTARGETSリストに入っていた |
| **session_001.json はリポジトリ側のみ fmt 2.0**（v4.1 継承） | ナレッジのコピーは旧 fmt 1.0 のまま |
| **SKILL バージョン参照が v1.4 のまま引き継がれていた**（v4.1 継承） | v4.1 で全箇所を v1.5 に修正済み |
| **lesson_02 に materialNeeds 非標準 type が存在した** | SKILL v1.5 定義外の `teacher_real_object`（5件）・`special_diagram`（2件）・`special_comparison_table`（2件）を使用。v4.2 で `special_diagram`/`special_comparison_table` を `special_slide` に統一。`teacher_real_object` は概念が正しいため v1.6 で公式追加予定 |
| **A-4ルールの reusedFrom が非対称だった** | `intro_act_p1` の `auto_generated_vocab` が `usedAlsoIn: [intro_act_p2/p3/p4]` と宣言しているが、受け取り側 intro_act_p3/p4 に `reusedFrom` が未設定。v4.2 で intro_act_p3/p4 に `reusedFrom: "intro_act_p1"` を追加 |
| **`_meta._phase1f_handover` が lesson_02 に混入していた** | lesson_01 固有の修正タスク記録（F-1〜F-4）が lesson_02 の `_meta` に残存。v4.2 で除去 |
| **master_image_registry に lesson_02 例文 14件が未登録だった** | lesson_02 v2.11.5〜v2.11.9 での例文再設計時に registry 更新が未完了。v4.2 で ex_L02_015〜028（14件・status: pending）を追加。outdated 6件（002/005/006/011/012/013）は追跡用に保持 |
| **image_prompts_lesson2 が lesson_02 の現行版と乖離していた** | v2.11.5 で追加した語彙（わたし/犬/写真）と例文（029/031/033/034/035）が未追加。削除済み例文（011/012/013）が残存。v4.2 で全て修正 |
| **3ファイル横断の整合性が完全に取れた** | lesson_02（28例文）↔ registry pending（28件）が完全一致。vocab prompt（17語）↔ lesson_02 vocab（病院除く17語）が完全一致 |
| **p4「どちら」の examples 配置は正しい** | _step1c_check では「plusAlpha として追加」と記述しているが、教科書原典例文（orig=True）なので examples[] への配置は原則②（構造上の必然・教科書原典維持）の適用として正しい。ただし _step1c_check の文言が実態と乖離している（低優先度の修正タスクとして記録） |
| **image_prompts に画像化対象マーク外の例文が4件存在** | ex_L02_022/025/026/028 は image_prompts に存在するが lesson_02 の `_comment` に「画像化対象」マークがない。旧バージョン時代からの名残。低優先度の整合タスクとして記録 |

---

## §11. 将来の機能追加（マネタイズ・スケール関連）

（v4.1 §11 の内容をすべて継承。変更なし。）

| 機能 | 詳細 | 根拠 |
|---|---|---|
| **vocabFilter / exampleFilter 実装** | session の teach[] に `null` で予約済み | v15 で設計・予約確定 |
| **activity_html.js 画像接続** | imageRegistry を各 build*() 関数へ接続 | v19 で後回し確定 |
| **日本語辞書サイト** | word_* / sentence_* 資産をウェブ辞書に転用 | v15 設計方針 |
| **複数教科書対応** | みんなの日本語・げんき等 | v15 ロードマップ |
| **N4語彙追加（788語）** | extractByLevel() で実施 | handoff_v2 §10 |

---

## §12. 次チャットの開始コマンド例

**GAS投入から始める場合：**
```
handoff_v4_2.md と lesson_02_v2_11_10.json と SKILL_v1_5.md をアップロードしました。

作業①：lesson_02_v2_11_10.json を GAS で Vocabulary シートに投入します。
importFromLessonJson.gs の LESSON_FILE_IDS に lesson_02 を追加して
importByFileId() を実行する手順を確認してください。

作業②：GASパイプラインの稼働状況を確認してください。

作業③：SKILL_v1_5.md を v1.6 に更新します。
teacher_real_object を公式 type として追加・playerSteps ルール明文化・
_step1c_check 記述修正を行ってください（§13 参照）。

作業④：確認が取れたら lesson_03.json の作成を開始します。
SKILL_v1_6.md の Step 1a から始めてください。
```

---

## §13. SKILL v1.6 更新内容（次チャット③の作業詳細）

v4.2 の品質分析で判明した以下の3点を SKILL_v1_5.md に追記して SKILL_v1_6.md として出力する。

### 更新点①：materialNeeds type 一覧に `teacher_real_object` を追加

**追記場所：** Step 1d「materialNeeds 設計」の「type 選択肢」表

```
| teacher_real_object | 教師が授業で実際に持参・提示する実物（時計・ペン・かばん・野菜等）。写真・印刷物（teacher_photo）と区別する。購入・準備コストが生じる素材に使用。 |
```

**追記内容（postCompletionChecklist 更新）：**
```
□ materialNeeds が素材分類（A:auto_generated_vocab / B:teacher_photo または teacher_real_object / C:special_slide）で記述されている
```

### 更新点②：playerSteps ルールに「教師動作言及」の解釈を明文化

**追記場所：** ABCactivityRef 仕様「playerSteps[] 記述ルール」

```
| 教師動作の言及 | 「先生が〜している」という状況描写（見るべき対象の文脈）は許容。教師の操作手順（「先生がカードを並べてください」等の指示）は teacherSteps へ |
```

### 更新点③：版履歴に v1.6 を追加

```
- v1.6：teacher_real_object を materialNeeds 公式 type として追加。playerSteps「教師動作言及」の解釈を明文化。根拠：handoff_v4_2.md §13。
```

---

*作成日：2026-05-18*
*根拠：lesson_02 品質分析（横断的・網羅的）および優先度高の修正実施（v4.2 チャット）*
*前資料：handoff_v4_1.md（2026-05-17）*
