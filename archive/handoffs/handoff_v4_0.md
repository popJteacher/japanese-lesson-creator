# 引き継ぎ資料 v4.0
**バージョン：v4.0（2026-05-17）**
**前資料：handoff_v3_0.md（2026-05-17）**
**このチャットで完了した作業：プロジェクト全体の進捗確認・ファイル差異解消・Step 3完了確認・全ドキュメント更新**

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **lesson_02 語彙 GAS投入** | `importFromLessonJson.gs` の `LESSON_FILE_IDS` に `lesson_02` のファイルIDを追加 → `importByFileId()` 実行 |
| **②** | **GASパイプライン稼働確認** | Vocabulary シートの列C/F/H/K を確認。classifyBatch がほぼ完了しているはず |
| **③** | **lesson_03.json 作成開始** | SKILL_v1_4.md の Step 1a（骨格設計）から開始 |

> **次チャットへのアップロード必須ファイル：**
> - `handoff_v4_0.md`（この資料）
> - `lesson_02_v2_11_9.json`（GAS投入対象）
> - 必要に応じて `lesson_template.json`（第3課作成時）

---

## §1. プロジェクト全体の位置づけ

```
【ライン A：japanese-lesson-creator】（Claude Code実装・リポジトリ）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTML/教案docxを生成するWebツール
  → 2026-05-17時点で全実装完了

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
| **Step 3** | **アクティビティ UI 実装（8件）** | ✅ **完了（今回確認）** | 実装済み・2026-05-17確認 |
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

### 動作確認結果（2026-05-17実施）

Plan_v1_1.md §7-2 の12項目チェック・Stage 1 既知9問題チェック：**全件PASS・回帰なし**

| # | 確認内容 | 結果 |
|---|---|---|
| 1 | フォーム生成（第1課 p1/p2/p3 + act_online_roulette） | ✅ 4ファイル・エラーなし |
| 2 | スライド総枚数 | ✅ 16枚（Plan記載の17はドキュメントミス） |
| 3〜12 | intro_activity・例文スコープ・まとめ・トグル・画像命名・FlowSynthesizer | ✅ 全PASS |

---

## §3. リポジトリのファイル構成と現在バージョン

### データファイル（data/）

| ファイル | バージョン | 最終更新 | 内容 |
|---|---|---|---|
| `lesson_01.json` | lessonVer 1.0 / fmt 2.7 | 2026-05-15 | 第1課「名詞」p1〜p3（3文型）・全必須フィールド完備 |
| `lesson_02.json` | **lessonVer 2.11.9** / fmt 2.7 | **2026-05-17** | 第2課「こそあど」p1〜p6（6文型）・完成 |
| `activity_catalog.json` | **v1.9** | **2026-05-17** | **58件**（validatedForLessons:[1]=40件・required=13件） |
| `intro_activity_catalog.json` | **v1.2** | **2026-05-17** | 導入アクティビティ6種類 |
| `master_image_registry.json` | **v1.9** | **2026-05-17** | 95件・**全imageUrl: null（GAS生成待ち）**※下記注意 |
| `master_audio_registry.json` | **v1.2** | 2026-05-17 | 84件・**全audioUrl: null（GAS生成待ち）** |
| `session_001.json`（リポジトリ） | fmt 2.0 | 2026-05-15 | ✅ 新フォーマット（mainActivities形式・flow廃止済み） |
| `session_001.json`（ナレッジコピー） | **fmt 1.0** | 2026-05-05 | ⚠️ **旧フォーマットのまま**（flow/activity残存・テスト時は使わない） |

> **⚠️ レジストリのURL状態に関する重要な注意（横断解析で判明）：**
> `master_image_registry.json` v1.9 の changelog には「v1.7 で27件のURL入力済み」とあるが、これは **GASパイプライン移行前の旧 image_prompts 方式**による生成記録。GASパイプライン移行時にレジストリは**構造のみにリセットされ、全URLが null** になっている。これは設計どおりの正しい状態で、GAS の `generateImageBatch` → `syncAll` が生成・書き戻すまで null のまま。char_*・world_map も含めて全て null。handoff_v2/v3_0 の「GAS生成後に自動更新」が現在の正しい認識。

### ソースファイル（src/）

| ファイル | 状態 | 備考 |
|---|---|---|
| `src/main.js` | ✅ 最新 | 常にFlowSynthesizer経由 |
| `src/ui/form.js` | ✅ 最新 | flow フィールド廃止・mainActivities形式 |
| `src/common/flow_synthesizer.js` | ✅ 最新 | |
| `src/common/image_resolver.js` | ✅ 最新 | lh3.googleusercontent.com/d/{id}=w{size} 形式 |
| `src/common/ruby_dictionary.js` | **✅ v1.2** | lesson_02語彙17/18語カバー済み（「病院」のみ未登録・要対応）|
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
| `SKILL_v1_4.md`（v1.4.1） | v1.4.1 | 課マスター作成ガイド（claude.aiチャット用） |
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

### 処理状況（2026-05-17時点）

| 処理 | 状況 |
|---|---|
| classifyBatch | 2026-05-16時点で残り約327語（毎時3語）。本日時点でほぼ完了しているはず |
| generateImageBatch | vocab_type埋まり次第処理・自動継続 |
| generateAudioBatch | 並行処理中・自動継続 |
| lesson_02語彙 | **GAS未投入**（手動作業①が必要） |

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

これらは解決済みだが、GAS で類似の不具合が出た場合の対処法として記録。

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

過去の全引き継ぎ資料で挙がった課題を横断追跡し、現在の解決状況をファイルで検証した結果。

### ✅ 解決済み（過去に「未解決」とされていたが現在は完了）

| 課題 | 初出 | 最後に「未解決」とされた資料 | 現在の状態（ファイル検証済み） |
|---|---|---|---|
| **残課題D：Skill設計・実装** | v10 | v14（未着手） | ✅ **SKILL_v1_4.md として実現**（v1.0→v1.4・168フィールド機械照合済み）。lesson_02 はこれを使って作成された |
| **残課題E：lesson_02照合・作成** | v11（残課題4） | v15 | ✅ **lesson_02 v2.11.9 完成**（canDoEn・practiceImageSource・isAnchor 全パターン設定済み） |
| **残課題B：lesson_01完成宣言** | v12 | v13（ブロッカー3件） | ✅ **2026-05-15 宣言済み**（v14） |
| **残課題A/F/G：activity_catalog整備** | v12 | v13 | ✅ **v1.9 完成**（58件・usedInLesson1 残存0件・prerequisitePatterns は grammarConcept ID 化済み） |
| **残課題C：Deep Research実施** | v12 | v12 | ✅ **v13 で完全解消**（57件に拡充） |
| **T-L1：act_hajimemashite_conversation catalog登録** | v9 | v9 | ✅ catalog に登録済み（validatedForLessons:[1]・required） |
| **T-L3：intro_act ABCactivityRef追加** | v9 | v9 | ✅ v10 で playerSteps 確定・lesson_01 に記入済み |
| **T-L5：「だれですか」人物識別問題** | v9 | v10 | ✅ namedCharacters[] 復活（v16）＋ char_* レジストリ登録で解決（画像URLはGAS生成待ち） |
| **Plan.md 7 Stage実装** | v15 | v17 | ✅ Stage 1〜7 全完了（v18） |
| **残課題I：session_001.json更新** | v14 | v14 | ✅ **リポジトリ側は fmt 2.0 完了**（※ナレッジコピーは旧版・後述） |
| **Step 3：アクティビティUI 8件** | handoff_v2 | handoff_v3_0 | ✅ 実装済み（activity_html.js 2,249行・本チャットで直接検証） |
| **canDoEn 未追加（lesson_02）** | v18 | v19 | ✅ lesson_02 v2.11.9 で全6パターン設定済み |
| **practiceImageSource 未追加（lesson_02）** | v19 | v19 | ✅ lesson_02 v2.11.9 で全6パターン設定済み |

### 🔄 進行中（設計どおり・放置でOK）

| 課題 | 状態 | 備考 |
|---|---|---|
| 全画像URL生成（95件 null） | GAS `generateImageBatch` が自動処理中 | char_*・world_map・word_*・ex_* 全て null。GAS生成→syncAll で順次解決 |
| 全音声URL生成（84件 null） | GAS `generateAudioBatch` が自動処理中 | 同上 |
| classifyBatch（語彙分類） | 毎時3語・自動 | 2026-05-16時点で残327語・本日ほぼ完了見込み |

### 🔴 未解決・要対応（次チャット以降）

| 課題 | 優先度 | 対応 |
|---|---|---|
| **lesson_02 GAS投入** | 高 | importByFileId（次チャット①） |
| **ナレッジ版 session_001.json が旧フォーマット（v1.0）** | 中 | リポジトリ版（v2.0）が正。ナレッジ版でテストしないこと。次回ナレッジ更新時に差し替え |
| **ruby_dictionary「病院」未登録** | 中 | lesson_02 授業前に追加（17/18語はカバー済み） |
| **act_info_gap_picture UI 未実装** | 中 | lesson_02 唯一の required アクティビティ。lesson_02 授業前に activity_blocks/ に実装 |
| **lesson_01 p3 キムさん重複** | 低 | 3-3（東西銀行）と3-5（東西デパート）でキムさん重複（v19既知） |
| **activity_html.js imageRegistry未接続** | 低 | 画像生成フェーズ完了後に各 build*() 関数へ接続（v19既知） |
| デザイン微調整 | 低 | 例文グリッド下線不揃い等（v18/v19既知・5件） |

---

## §6. 課マスター設計ライン

### 完成済みの課マスター

| 課 | ファイル | バージョン | 文型 | 状態 |
|---|---|---|---|---|
| 第1課 | `lesson_01.json` | fmt 2.7 / lessonVer 1.0 | p1〜p3（名詞・3文型） | ✅ 完成・GAS投入済み |
| 第2課 | `lesson_02.json` | fmt 2.7 / lessonVer 2.11.9 | p1〜p6（こそあど・6文型） | ✅ 完成・**GAS投入待ち** |
| 第3課以降 | — | — | — | ⏳ 未着手 |

### 第2課の内容（参考）

| パターン | 文型 | grammarConceptID | practiceImageSource |
|---|---|---|---|
| p1 | これ/それ/あれ は 〜 です | `kosoado_pronoun_thing` | `vocabulary`（物の語彙を使う） |
| p2 | 〜は 何ですか | `interrogative_what` | `vocabulary`（物の語彙を使う） |
| p3 | 〜の〜（所有） | `noun_no_possession` | `vocabulary`（物の語彙を使う） |
| p4 | 〜は どれですか | `interrogative_which_thing` | `vocabulary`（物の語彙を使う） |
| p5 | この/その/あの + N | `kosoado_attributive`（v14確定） | `namedCharacters`（人物カードを使う） |
| p6 | どの + N | `interrogative_which_attributive`（v14確定） | `namedCharacters`（人物カードを使う） |

> **注：** lesson_02 の practiceImageSource はこそあど課の特性上、p1〜p4 が `"vocabulary"`（物・場所カード）、p5〜p6 が `"namedCharacters"`（人物カード）となっている。lesson_01 の「疑問文→namedCharacters」のルールはそのまま適用されない。課の文型の性質に応じて判断する。

---

### SKILL.md v1.4.1 による課マスター作業ステップ（C-9・必須順序）

```
Step 1a：骨格設計
  テンプレートコピー → _meta/lesson/textbook_sources 記入
  → patterns[] エントリ数確定 → flow[] 骨格確定

  【骨格確定の中の重要サブステップ】
  ① 導入アクティビティの選定（文型ブロックごと）
  ② メインアクティビティの選定

Step 1b：語彙設計
  パターン別語彙確定 → vocabulary.byPattern グループ設計
  → imageId/audioId 採番 → ruby_dictionary.js 追加対象の確認

Step 1c：例文設計
  パターン別例文作成（肯定・否定・疑問・疑問詞）
  → isAnchor:true を各パターン1件 → imageId/audioId 採番

Step 1d：materialNeeds 設計
  例文確定後に各 flow エントリの素材を A/B/C に分類して記録

Step 1e：アクティビティ選定（ABCの活動例とcatalogを照合）
  ← v4 C-9 ルールで必須ステップとして確定

Step 1f：照合
  postCompletionChecklist 全件 → formatVersion: "2.7" 確認
```

---

### SKILL.md の運用上の重要な注意（handoff_v2 §9 で確定）

| 項目 | 内容 |
|---|---|
| **カバー範囲** | L1（チェックリスト）＋ L2（テンプレートJSON記述）。**L3（GAS自動生成）はスコープ外** |
| **運用方法** | claude.ai チャットで **project knowledge として参照**するのが正しい運用。スキル自動トリガーではない |
| **CLAUDE.md の「SKILL.md を新規作成しない」禁止事項について** | これは **Claude Code 向けルール**。Windows 環境のため `/mnt/skills/user/` は存在しない。混同しないこと |
| **lesson_02 作成実績** | SKILL_v1_4.md を使って lesson_02 v2.11.9 を作成済み（残課題D の実質的な達成） |

### lesson_template.json v1.2 の意図的除外（lesson_03 以降で**コピーしない**項目）

新しい課を作成する際、テンプレートから以下の3項目は**コピーしてはいけない**（lesson_01 固有の移行記録のため）：

| 除外項目 | 理由 |
|---|---|
| `_meta.changes[]` | バージョン履歴。新規課は空配列で開始 |
| `_meta._phase1f_completed.*` | 旧キャラクターシステム廃止の移行記録（lesson_01 固有）|
| `github._uploadFiles_deprecated` | v2.4 で廃止された注記 |

---

### ⚠️ Step 1a の中で最も時間がかかるプロセス（重要）

課マスター設計で実際に最も工数がかかるのは、**flow[] の各 `intro_activity` と `main_activity` に対してカタログから適切なアクティビティを選定・照合・必要なら新規登録するプロセス**である。

---

#### プロセスA：導入アクティビティの選定（文型ブロックごと）

各パターン（intro_act_pN）に対して以下の手順を踏む。

**① 教科書PDF の「教え方の例」を確認する**
- そのパターンをどのように導入しているか（実物提示・絵カード・板書・Q&A等）
- 教師と学習者の往復（T-L）構造・ジェスチャー・タスクタイプを把握する

**② A-4ルール（v10で新設・必須）：依存関係チェック**
> 「教え方の例N」で使う素材・キャラクターが、それより前の手順（教え方の例1〜N-1）で**導入済みかを確認**する。依存がある場合は `reusedFrom` に明記する。

具体例（lesson_01）：
```
intro_act_p1（教え方の例1）
  → 鈴木さん・リンさん・キムさん・タノムさんを
    「名前付き絵カード」として視覚的に導入する
        ↓（依存）
intro_act_p2（教え方の例2）
  → 同じカードを使って「だれですか」練習
  → materialNeeds に reusedFrom: "intro_act_p1" を記録
```

**③ intro_activity_catalog.json を照合する**
- 既存エントリの `layout` / `teachingMethod` / `targetPattern` が当該文型と合致するか確認
- 疑問文の種類に注意：クローズド疑問（はい/いいえ）・wh疑問（何ですか）・選択疑問（どれですか）は**構造が根本的に異なる**ため別エントリが必要

**④ 合致するエントリがなければ新規設計・カタログ登録**
- lesson_02 での実例：
  - `act_qa_pattern_intro`（クローズド疑問専用）は p2「何ですか」（wh疑問）・p4「どれですか」（選択疑問）に使用不可
  - → `act_nani_desu_ka_intro`（layout: `mystery_object_reveal`）を新規作成してp2に対応
  - → `act_which_one_intro`（layout: `multiple_objects_selection`）を新規作成してp4に対応
  - → intro_activity_catalog.json に2件追加（v1.0→v1.2）

**⑤ flow[intro_act_pN].activityId に選定したIDを記入し、ABCactivityRef を追加する**

> **この判断を誤るとスライド自動生成時に誤ったUI（例：wh疑問文のスロットにはい/いいえが表示される）が出力されるバグになる。**

#### 現在の intro_activity_catalog.json v1.2（全6件）

| activityId | 対象パターンの性質 | layout |
|---|---|---|
| `act_picture_card_vocab_intro` | 語彙・基本文型（初出）| `character_card_grid` |
| `act_qa_pattern_intro` | クローズド疑問（はい/いいえ）のみ | `qa_card_pair` |
| `act_possession_intro` | 所属・修飾（〜の〜）| `attribute_expansion` |
| `act_famous_person_intro` | こそあど連体詞（この/その/あの）| `famous_person_card` |
| `act_nani_desu_ka_intro` | **wh疑問（何ですか）** | `mystery_object_reveal` |
| `act_which_one_intro` | **選択疑問（どれですか）** | `multiple_objects_selection` |

---

#### ABCactivityRef フィールド仕様（intro_activity・main_activity 両方に必須）

**v4 で確定。intro_activity と main_activity の全エントリに記入必須。**

```json
"ABCactivityRef": {
  "activityName": "活動の名称",
  "fadingStage": "stage1〜5のいずれか",
  "taskType": "語彙提示・リピート / 応答練習（Q&A）/ 自由対話 等",
  "playerSteps": [
    { "ja": "〜ましょう", "en": "..." },
    { "ja": "〜ましょう", "en": "..." },
    { "ja": "〜ましょう", "en": "..." }
  ]
}
```

**playerSteps[] 記述ルール（v4確定・変更不要）**

| ルール | 内容 |
|---|---|
| 上限 | **最大3ステップ**（認知負荷管理） |
| 文末 | 「〜ましょう」または「〜します」で統一 |
| 視点 | **学習者の行動のみ**（教師の操作・教具の指示は書かない） |
| 文型への言及 | **禁止**（「〜は〜ですを使って」は書かない） |
| 英訳 | **必須**（`en` フィールドに自然な英語で） |

#### lesson_01 intro_activity の ABCactivityRef 確定値（v10 で確定）

**intro_act_p1**（act_picture_card_vocab_intro / stage1）：
```json
"playerSteps": [
  { "ja": "絵カードを見て、先生の言葉をよく聞きましょう", "en": "Look at the picture cards and listen carefully to the teacher." },
  { "ja": "先生のあとについて、声に出して言ってみましょう", "en": "Repeat the words and phrases out loud after the teacher." },
  { "ja": "文字を見ないで言えるか、やってみましょう", "en": "Try saying the words without looking at the text." }
]
```

**intro_act_p2**（act_qa_pattern_intro / stage1〜2）：
```json
"playerSteps": [
  { "ja": "先生の質問を聞いて、「はい、〜です」か「いいえ、〜じゃありません」で答えましょう", "en": "Listen to the teacher's question and answer with 'Yes, ~' or 'No, it's not ~'." },
  { "ja": "「だれですか」という質問にも答えてみましょう", "en": "Also try answering the question 'Who is it?'" },
  { "ja": "慣れてきたら、自分でも質問してみましょう", "en": "When you're ready, try asking the questions yourself." }
]
```

**intro_act_p3**（act_attribute_modeling_intro / stage1）：
```json
"playerSteps": [
  { "ja": "先生のモデル文を聞いて、同じように言ってみましょう", "en": "Listen to the teacher's model sentence and repeat it the same way." },
  { "ja": "「〜の〜です」を使って、自分の国や職業・所属を言ってみましょう", "en": "Use the pattern '~ no ~ desu' to talk about your own country, job, or organization." },
  { "ja": "相手に「〜は〜の〜ですか」と質問してみましょう", "en": "Try asking your partner '~ wa ~ no ~ desu ka?'" }
]
```

---

#### プロセスB：メインアクティビティの選定

flow[main_act_1] に対して以下の手順を踏む。

**① activity_catalog.json から候補を絞り込む**

絞り込み条件（v13 確定スキーマ準拠）：
- `validatedForLessons` に当該課番号が含まれる（またはまだ入力されていない場合は `prerequisitePatterns` で判断）
- `prerequisitePatterns`（grammarConcept ID）が当該課で導入済みの文法概念を含む
- `contentRequirement.judgment === "required"`（専用UI対象）
- `fadingStage` が当該課の学習フェイズと合っている

**② スキップか有効化かを決める**
- 明確に合致するものがあれば `activityId` を設定・`skipped: false`
- 判断を保留する場合は `skipped: true` で `_skip_reason` を記録し、教師判断に委ねる
- **skipped: true のエントリでも ABCactivityRef は必須記録**（v5確定）

**③ マンツーマン授業向けの代替案を記録する（v6 拡張仕様）**

グループ活動はマンツーマンでそのまま使えないため、両方を記録する：
```json
"ABCactivityRef": {
  "activityName": "活動名(グループ版) / 代替案(マンツーマン版)",
  "groupVersion": { "description": "グループでの実施方法" },
  "soloVersion":  { "description": "マンツーマン用の代替方法（PDFコラム等を根拠に）" },
  "playerSteps": [ ... ]
}
```

#### lesson_01 / lesson_02 のメインアクティビティ確定値

| 課 | activityId | fadingStage | skipped | 根拠 |
|---|---|---|---|---|
| lesson_01 | `act_hajimemashite_conversation` | stage4〜5 | false | PDF第1課「活動例：会話『はじめまして』」|
| lesson_02 | `act_belongings_qa` | stage3〜4 | false | v2.11.9 で正式接続 |

**lesson_01 main_activity 確定 playerSteps：**
```json
"playerSteps": [
  { "ja": "名前と仕事を伝えましょう", "en": "Tell your partner your name and job." },
  { "ja": "相手に質問しましょう", "en": "Ask your partner a question." },
  { "ja": "次のパートナーに変わりましょう", "en": "Switch to the next partner." }
]
```

**lesson_02 main_activity（元々 skipped:true だった頃の ABCactivityRef 記録：v6 確定）：**
```json
"ABCactivityRef": {
  "activityName": "落としもの返しごっこ(グループ版) / 先生の持ち物Q&A(マンツーマン版)",
  "fadingStage": "stage4〜5",
  "groupVersion": { "description": "学習者を5人グループに分け、互いに持ち物を袋に入れ取り出しながら所有者を確認する" },
  "soloVersion":  { "description": "教師の持ち物・ペット・家族の写真を見せ質問させる（PDF p.034 オンライン授業コラム）" },
  "playerSteps": [
    { "ja": "先生の持ち物や写真を見ましょう", "en": "Look at the teacher's belongings or photos." },
    { "ja": "だれのものか質問しましょう", "en": "Ask who each item belongs to." },
    { "ja": "自分の持ち物や写真を見せましょう", "en": "Show your own belongings or photos." }
  ]
}
```

---

### 素材の3分類（v9 で確立）

各 flow エントリの `materialNeeds` を以下の3分類で整理する。

| 分類 | 意味 | materialNeeds.type | パイプライン上の扱い |
|---|---|---|---|
| **A：自動生成** | GAS + imageId で毎回生成できる | `auto_generated_vocab` | image_prompts → GAS → registry → generator |
| **B：教師が毎回用意** | 学習者・有名人の写真など授業ごとに変わる | `teacher_photo` | 教案 docx に指示として出力 |
| **C：一度作れば使い回し** | 世界地図・カレンダー等 | `special_slide` | 作成方法・保管場所を別途管理 |

第1課の分類状況：

| 素材 | 分類 | 状態 |
|---|---|---|
| 人物・職業カード（先生・会社員等） | A | ✅ 自動生成済み |
| 例文イラスト（15枚）| A | ✅ 自動生成済み |
| 世界地図（国旗付き）| C | `world_map` エントリ保護済み・imageUrl: null のまま |
| 有名人写真（「だれですか」導入用） | B | 教案に「教師が用意」と記載 |

---

### activity_catalog のスキーマ（現行・v1.9）

**v4〜v13 を経て確定した現行スキーマ。**

#### 必須フィールド

| フィールド | 説明 |
|---|---|
| `id` | アクティビティID（`act_*`） |
| `validatedForLessons` | 使用実績のある課番号の配列（v12 で `targetLessons` から rename） |
| `prerequisitePatterns` | 必要な grammarConcept ID の配列（v13 で確定） |
| `contentRequirement.judgment` | `"required"` / `"not_needed"` / `"slide_alt"` |
| `skillFocus` | `["speaking", "listening", ...]`（v13 で `purpose` から分離） |
| `activityType` | `["game", "roleplay", "drill", ...]`（v13 で分離） |
| `interactionPattern` | `"pair"` / `"group"` 等（v13 で追加） |

#### grammarConcept ID 体系（v13 確定）

| grammarConceptID | 文型 | 課・patternId |
|---|---|---|
| `noun_predicate_affirmative` | 〜は〜です | lesson_01 p1 |
| `noun_predicate_question` | 〜ですか／はい・いいえ | lesson_01 p2 |
| `noun_no_affiliation` | 〜の〜です（所属） | lesson_01 p3 |
| `kosoado_pronoun_thing` | これ・それ・あれ | lesson_02 p1 |
| `interrogative_what` | 何ですか | lesson_02 p2 |
| `noun_no_possession` | 〜の〜（所有） | lesson_02 p3 |
| `interrogative_which_thing` | どれですか | lesson_02 p4 |

#### 廃止・変更済みフィールド（次の課作成時に混同しないこと）

| フィールド | 変更内容 |
|---|---|
| `purpose` | → `skillFocus` + `activityType` に分離（v13）|
| `targetLessons` | → `validatedForLessons` に rename（v12）|
| `usedInLesson1` | → `validatedForLessons: [1]` に統合（v1.7で廃止済み）|

---

### imageRole 方針（v5 で確定・全課共通）

| imageRole | 使用場面 |
|---|---|
| `vocab_person` | 人物単体カード（職業・国籍など） |
| `vocab_object` | 建物・物体カード（学校・銀行・デパートなど） |
| `scene` | 場面・会話・所属を含む例文・指示詞文 |

---

### ⚠️ 全課共通の必須フィールド・設計ルール（v15〜v19 で確定）

**これらを入れ忘れると生成された HTML に具体的な不具合が発生する。**

#### 必須フィールド一覧

| フィールド | 場所 | 確定 | 未設定時の不具合 |
|---|---|---|---|
| `patterns[].canDoEn` | patterns[] 全件 | v18 | 英語トグル ON 時に canDo が空白になる |
| `patterns[].practiceImageSource` | patterns[] 全件 | v19 | 宿題の練習問題画像が誤生成される |
| `examples[].isAnchor` | 全例文 | v15 | まとめスライドとアンカー大カードが空欄 |
| `namedCharacters[]` | lesson 直下のセクション | v16 | intro_activity スライドがクラッシュする |
| `vocabulary[].imageId: "word_*"` | 全語彙 | v15 | 語彙画像が全件表示されない（旧 vocab_* は廃止）|
| `patterns[].canDoEn` 英語形式 | patterns[] | v18 | 「Can ～」形式で記述しないと英語トグルが不自然 |

#### canDoEn フィールド（v18 新規確定・全課必須）

```json
"patterns": [
  {
    "id": "p1",
    "canDo": "自分や他の人の名前・職業・国籍を「〜は〜です」で紹介できる。",
    "canDoEn": "Can introduce names, occupations, and nationalities using '~ wa ~ desu'."
  }
]
```

lesson_01 の確定値：
- p1: `"Can introduce names, occupations, and nationalities using '~ wa ~ desu'."`
- p2: `"Can ask about occupations and nationalities using '~ desu ka' and answer yes or no. Can confirm identity using 'dare desu ka'."`
- p3: `"Can express affiliation (school, company, bank, etc.) using '~ no ~ desu'."`

#### practiceImageSource フィールド（v19 新規確定・全課必須）

```json
"patterns": [{ "practiceImageSource": "namedCharacters" }]
```

| 値 | 使用場面 | practiceTemplates の空欄数 |
|---|---|---|
| `"vocabulary"` | 語彙が視覚的に独立しているパターン（物・建物） | テンプレート依存 |
| `"namedCharacters"` | 肯定文・疑問文パターン（人物カードで練習） | 2空欄 |
| `"namedCharacters+vocab"` | 所属（〜の〜）パターン（人物＋建物ペア） | **3空欄必須** |

lesson_01 の確定値：p1 → `"namedCharacters"` / p2 → `"namedCharacters"` / p3 → `"namedCharacters+vocab"`

**p3 の練習問題ペア生成について（v19 確定）：**
namedCharacters と建物語彙の単純な zip ではなく、`patterns[p3].examples[]` の文をパース（正規表現）してキャラクター × 建物の正しい組み合わせを使う。

#### isAnchor フィールド（v15 新規確定・全例文必須）

各パターンにつき **1件のみ** `isAnchor: true`、残りは `false`。

| 用途 | 場所 |
|---|---|
| まとめスライドの canDo + アンカー例文セット | wrapUp スライド |
| アンカー大カード（横幅100%・16:9画像） | example スライド先頭 |

lesson_01 確定アンカー例文：
- p1: `1-1`「鈴木さんは先生です。」
- p2: `2-4`「先生ですか。→ はい、先生です。/いいえ、先生じゃありません。」（v18 で 2-1 から移動）
- p3: `3-4`「リンさんは東西大学の学生です。」（PDF 原典・変更禁止）

#### namedCharacters[] セクション（v16 新規確定・全課必須）

**目的：カード生成専用。** v2.6 で削除された `characters` セクションとは別物。物語の連続性を持たせない方針（固定キャラ廃止）とは矛盾しない。

```json
"namedCharacters": [
  { "name": "鈴木さん", "occupation": "先生",   "nationality": "日本人",   "imageId": "char_鈴木"  },
  { "name": "リンさん",  "occupation": "学生",   "nationality": "中国人",   "imageId": "char_リン"  },
  { "name": "キムさん",  "occupation": "会社員", "nationality": "韓国人",   "imageId": "char_キム"  },
  { "name": "タノムさん","occupation": "医者",   "nationality": "ベトナム人","imageId": "char_タノム"},
  { "name": "ケリーさん","occupation": "外国人", "nationality": "アメリカ人","imageId": "char_ケリー"}
]
```

> **第2課以降はその課の namedCharacters を新たに定義する（第1課の5名を引き継がない）。**  
> namedCharacters[] の char_* は `master_image_registry.json` に登録が必要。

#### vocab_* → word_* 命名規則（v15 確定・違反厳禁）

語彙資産のIDはすべて `word_漢字表記` で統一する。**`vocab_*` プレフィックスは廃止済み・使用禁止。**

| 資産種別 | 旧ID（廃止）| 新ID（正しい）|
|---|---|---|
| 語彙画像 | `vocab_医者` | `word_医者` |
| 語彙音声 | （なし）| `word_医者` |
| 例文画像 | `ex_L01_001` | `ex_L01_001`（変更なし）|
| 例文音声 | （なし）| `sentence_ex_L01_001` |
| キャラクター | `char_鈴木` | `char_鈴木`（変更なし）|

**理由：** 将来の日本語辞書サイト（画像・音声資産の共有）を見据えた統一。

#### ruby_dictionary.js の更新義務（v18 確定）

**新しい課を追加するときは、その課の語彙を必ず `ruby_dictionary.js` に追加すること。**  
追加しないとふりがなトグルが機能しない。

lesson_01 は 131 エントリでカバー済み（v18 時点）。lesson_02 の語彙追加は次フェーズで実施予定。

---

### ⚠️ intro_activity スライドの正しい理解（v16 で判明）

**v16 以前の資料では誤解があった。** 正しい理解：

| | 旧理解（v16以前）| 正しい理解（v16以降）|
|---|---|---|
| intro_act_p1 の主素材 | 語彙カード（職業・国籍）| **キャラクターカード（namedCharacters 5名）** |
| 補助素材 | なし | 世界地図（国旗付き）|
| intro_act_p2 の主素材 | 新規カード | **p1のカードを再利用**（reusedFrom: "intro_act_p1"）|
| intro_act_p3 の主素材 | 新規カード | **p1のカード + 建物カード（vocab_object）** |

**各 intro_activity のスライド layout：**

| activityId | layout | スライドの内容 |
|---|---|---|
| `act_picture_card_vocab_intro` | `character_card_grid` | namedCharacters[] 5枚グリッド + world_map + 指示文 |
| `act_qa_pattern_intro` | `qa_card_pair` | キャラクターカード + 応答パターンボックス + 指示文 |
| `act_attribute_modeling_intro` | `attribute_expansion` | キャラクター + building_card + 短文→長文拡張 + 指示文 |

**データ取得元：** `intro_activity_catalog.json` の `slideDisplay` + `lesson_NN.json` の `namedCharacters[]`

---

### アーキテクチャ上の重要な確定事項（v15 で特定・修正済み）

**FlowSynthesizer バイパスバグの記録（再発防止のため）**

v15 以前は `form.js` が `buildSession()` 内で `flow[]` を独自生成し、`main.js` が `session.flow` 非空の場合に `FlowSynthesizer.synthesize()` をスキップする分岐を持っていた。この結果、導入アクティビティスライドが生成されない・語彙スライドが出ない等の問題が発生していた。

**修正済み（v15 以降）：**
- `form.js` の `buildSession()` は `flow[]` フィールドを返さない
- `main.js` は `session.flow` の有無に関わらず**常に** `FlowSynthesizer.synthesize()` を呼ぶ
- `lesson_NN.json` の `flow[]` が唯一の授業フロー情報源（SSOT）

```
【正しいデータフロー（v15以降）】
lesson_NN.json（SSOT）
  └─ FlowSynthesizer.synthesize(lesson, session, activityCatalog)
       └─ resolvedFlow
            └─ slide_html.js → スライドHTML
            └─ homework_html.js → 宿題HTML
            └─ activity_html.js → アクティビティHTML
```

---

## §7. 語彙追加・GASパイプライン操作マニュアル

### パターン①：新しい課を追加する

```
1. lesson_NN.json を Google Drive にアップロード
2. importFromLessonJson.gs の LESSON_FILE_IDS に新ファイルIDを追加
3. previewImport("FILE_ID") でドライラン確認（書き込みなし）
4. importByFileId(LESSON_FILE_IDS.lesson_NN, "lesson_NN") を実行
5. Vocabulary シートに語彙が追加されたことを確認
6. あとは自動（classifyBatch → generateImageBatch → generateAudioBatch → syncAll）
```

### パターン②：Goi_List の N4語彙を追加する

```
1. EXTRACT_SETTINGS.TARGET_LEVELS に "2.初級後半" を追加
2. extractByLevel() を手動実行（N5は重複チェックで自動スキップ）
3. あとは自動（N4は788語・約11日で画像生成完了）
```

### パターン③：単語を1語だけ手動追加する

Vocabulary シートに直接1行入力する。C列（en）・F列（vocab_type）は空欄のまま `classifyBatch` が自動付与する。

| 列 | フィールド | 記入内容 |
|---|---|---|
| A | word | 漢字表記（例：旅行）|
| B | reading | ひらがな（例：りょこう）|
| C | en | **空欄**（classifyBatch が自動付与）|
| D | jlptLevel | N5〜N1 |
| E | pos | 品詞 |
| F | vocab_type | **空欄**（classifyBatch が自動付与）|
| G | imageId | `word_` + 漢字（例：word_旅行）|
| H | imageStatus | `pending` |
| I | imageUrl | **空欄**（generateImageBatch が自動入力）|
| J | audioId | `word_` + 漢字 |
| K | audioStatus | `pending` |
| L | audioUrl | **空欄**（generateAudioBatch が自動入力）|
| M | lessonRef | 任意（例：lesson_02）|
| N | source | `manual` |

### よく使うメンテナンス関数

| 関数 | 用途 |
|---|---|
| `retryImages(["word_XX"])` | imageStatus 問わず強制再生成 |
| `retryAudio(["word_XX"])` | audioStatus 問わず強制再生成 |
| `reclassifyWords(["XX"])` | en / vocab_type を再処理 |
| `previewClassify()` | 分類結果5件プレビュー（書き込みなし） |
| `checkStyleRecipe()` | STYLE_RECIPE に `#6B7C85` が含まれるか確認 |
| `previewPrompts()` | 最初の5件のプロンプトをAPIなしで確認 |
| `testProtectedKeys()` | 保護キーのチェックロジックをテスト |
| `fixExamplesData()` | Examples データが1001行目に入った場合の修正 |

### デュアルモデル戦略（画像・音声の上限を2倍にする方法）

```javascript
// 画像：タイマー自動（Standard）+ 手動でFastモデルに切替え実行 → 最大50枚/日
IMAGE_SETTINGS.MODEL: "imagen-4.0-fast-generate-001"  // 手動時に変更して再実行

// 音声：タイマー自動（Flash）+ 手動で別モデルに切替え → 最大20件/日
AUDIO_SETTINGS.MODEL: "gemini-3.1-flash-preview-tts"  // 使用可能か要確認
```

---

## §8. 次チャット 作業詳細

### ① lesson_02 語彙 GAS投入

```
1. lesson_02_v2_11_9.json を Google Drive にアップロード
2. importFromLessonJson.gs の LESSON_FILE_IDS に追加：
   lesson_02: "YOUR_LESSON_02_JSON_FILE_ID_HERE"
3. previewImport("ファイルID") でドライラン確認
4. importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02") を実行
5. Vocabulary シートで lesson_02 語彙の追加を確認
```

**期待される投入語彙：** こそあど関連・時計・ペン・かばん・本・雑誌・新聞・鉛筆・チョコレート・ケータイ等  
**重複処理：** 既存語彙（lesson_01 で登録済み）は自動スキップ

### ② GASパイプライン稼働確認

| 確認項目 | 確認方法 |
|---|---|
| classifyBatch | Vocabulary シート 列C（en）・列F（vocab_type）の埋まり具合 |
| generateImageBatch | 列H（imageStatus）が `generated` / `approved` になっているか |
| generateAudioBatch | 列K（audioStatus）が `generated` になっているか |
| syncAll | master_image_registry.json の imageUrl が Drive URL に更新されているか |

### ③ lesson_03.json の作成開始

SKILL_v1_4.md の Step 1a（骨格設計）から開始する。  
第3課の文型シラバス（〜があります/います・〜で・〜に等）は SKILL_v1_4.md §文型シラバスを参照。

---

## §9. ロードマップ

```
【完了済み（このチャットまで）】
  ✅ ライン A 全工程（Step 1〜3・Stage 1〜7・データ同期）
  ✅ lesson_01.json / lesson_02.json v2.11.9
  ✅ activity_catalog v1.9（58件）/ intro_activity_catalog v1.2
  ✅ master_image_registry v1.9 / master_audio_registry v1.2
  ✅ ruby_dictionary.js v1.2（lesson_02語彙17/18語）
  ✅ CLAUDE.md / README.md 更新
  ✅ SKILL_v1_4.md v1.4.1
  ✅ GASパイプライン 8本完成・稼働中

【次チャット（チャット⑨）：必須】
  ① lesson_02 語彙 GAS投入（importByFileId）
  ② GASパイプライン稼働確認
  ③ lesson_03.json 作成開始（SKILL_v1_4.md Step 1a〜）

【lesson_02 授業前に必須】
  ④ ruby_dictionary.js に「病院」を追加
  ⑤ act_info_gap_picture UI 実装（activity_blocks/ に追加）

【その後：第2課授業実施まで】
  ⑥ 画像・音声の自動生成（GASタイマー・放置でOK）
  ⑦ syncAll 実行 → master_image_registry / master_audio_registry 更新
  ⑧ build-embedded-data.py 実行 → HTML 反映
  ⑨ activity_html.js の imageRegistry 接続（画像生成完了後）
  ⑩ lesson_02 授業実施可能 🎉

【中長期】
  ─ lesson_03〜NN の作成（SKILL_v1_4.md に従って順次）
  ─ N4語彙追加（788語）→ extractByLevel() で実施
  ─ vocabFilter / exampleFilter の実装（マネタイズ差別化機能）
  ─ 日本語辞書サイトへの展開（word_*/sentence_* 資産の転用）
  ─ SaaS化・マネタイズ（課単位または月額）
  ─ lesson_01 p3 キムさん重複問題の解消（設計上の検討）
```

---

## §10. このチャットで判明したこと・確定した事項

| 判明事項 | 詳細 |
|---|---|
| **Step 3 は実装済みだった** | CLAUDE.md の「保留中」記載は誤り。activity_html.js 2,249行を直接検査し8件全て確認 |
| **build-embedded-data.py は完成済み** | intro_activity_catalog / master_audio_registry を含む全6ファイルが既にTARGETSリストに入っていた |
| **session_001.json はリポジトリ側のみ fmt 2.0** | リポジトリは Stage 4 で fmt 2.0 更新済み。**ただしプロジェクトナレッジのコピーは旧 fmt 1.0 のまま**（横断解析で判明） |
| **スライド総枚数は16枚が正しい** | Plan_v1_1.md の「17枚」はドキュメントの計算ミス（1+1+4+4+4+1+1=16） |
| **プロジェクトナレッジ ≠ ローカルリポジトリ** | Claude.ai側のデータ更新がリポジトリに未反映だった。今回一括同期完了 |
| **画像・音声レジストリは全URL null** | v13-v19 の「画像生成済み」記載は旧 image_prompts 方式。GASパイプライン移行時にリセットされ、現在は構造のみ・GAS生成待ち |
| **過去の残課題D（Skill）は SKILL.md として実現済み** | v12-v15 で繰り返し「未着手」とされていたが、SKILL_v1_4.md がその実装。lesson_02 はこれを使って作成された |
| **activity_catalog は58件**（旧資料の「15種類」は誤り） | project_handoff_complete.md の「15種類」は最初期の記載。v13 で57件→現在v1.9で58件 |
| **GASパイプライン解決済み11問題は §4 に記録** | 音声発音バグ・classifyBatch制限・JSON パース等。再発時の対処法として保存 |
| **lesson_template の3項目は lesson_03 でコピー禁止** | `_meta.changes[]` / `_meta._phase1f_completed.*` / `github._uploadFiles_deprecated`（§6 に記録）|

> **横断解析の総括（3回の精査を経た最終結論）：**
> ライン A（japanese-lesson-creator）は実装完全完了。過去資料で「未解決」とされた残課題（A〜I・T-L1〜L6）は**全て解決済み**であることをファイル検証で確認した（§5 課題ライフサイクル一覧）。現存する未解決項目は (1) lesson_02 GAS投入【次チャット必須】 (2) 全画像・音声URL生成【GAS自動・進行中】 (3) ナレッジ版 session_001.json 旧フォーマット (4) ruby_dictionary「病院」未登録 (5) act_info_gap_picture UI未実装 (6) lesson_01 p3キムさん重複 (7) デザイン微調整 — のみ。(1)〜(2) が本流、(3)〜(7) は授業前または将来対応。

---

## §11. 将来の機能追加（マネタイズ・スケール関連）

> 既知の未解決問題の一覧は **§5「課題ライフサイクル一覧」** に集約済み。本セクションは将来の拡張のみ記載する。

| 機能 | 詳細 | 根拠 |
|---|---|---|
| **vocabFilter / exampleFilter 実装** | session の teach[] に `null` で予約済み。将来「語彙・例文のカスタム選択」として提供できる差別化機能。課マスターの語彙・例文を充実させるほど選択肢が増える | v15 で設計・予約確定 |
| **activity_html.js 画像接続** | imageRegistry を各 build*() 関数へ接続。act_person_guessing_quiz（キャラ画像）/ act_memory_matching・act_vocab_bingo（語彙画像）の視覚化 | v19 で後回し確定 |
| **日本語辞書サイト** | word_* / sentence_* 資産（画像・音声）をウェブ辞書に転用。SaaS化・マネタイズの足がかり | v15 設計方針 |
| **複数教科書対応** | みんなの日本語・げんき等。textbook_sources[] に追加エントリで管理 | v15 ロードマップ |
| **N4語彙追加（788語）** | extractByLevel() で実施。基本パイプライン安定後 | handoff_v2 §10 |

---

## §12. 次チャットの開始コマンド例

**GAS投入から始める場合：**
```
handoff_v4_0.md と lesson_02_v2_11_9.json をアップロードしました。

作業①：lesson_02_v2_11_9.json を GAS で Vocabulary シートに投入します。
importFromLessonJson.gs の LESSON_FILE_IDS に lesson_02 を追加して
importByFileId() を実行する手順を確認してください。

作業②：GASパイプラインの稼働状況を確認してください。

作業③：確認が取れたら lesson_03.json の作成を開始します。
SKILL_v1_4.md の Step 1a から始めてください。
```

**lesson_03 作成から始める場合：**
```
handoff_v4_0.md をアップロードしました。
lesson_03.json の作成を開始します。
SKILL_v1_4.md の Step 1a（骨格設計）から始めてください。
```

---

*作成日：2026-05-17*
*根拠：チャット⑧完了作業（プロジェクト全体確認・ファイル同期・Step 3完了確認）*
*前資料：handoff_v3_0.md（2026-05-17）*
