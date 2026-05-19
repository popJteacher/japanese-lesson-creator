# 引き継ぎ資料 v4.5
**バージョン：v4.5（2026-05-18）**
**前資料：handoff_v4_4.md（2026-05-18）**
**このバージョンで追加した内容：リポジトリ整理・Git初期化・GitHub push 完了を記録。ドキュメント3本（CLAUDE.md・pipeline_setup_guide.md・gas_pipeline_handoff_v1.md）の更新完了。全データファイルを最新版に差し替え（master_image_registry v2.0・lesson_02 v2.11.11・lesson_01 lessonVersion 1.1）。git に起因して発覚したスキーマフィールド名の実態（lessonVersion / lastModified）を記録。intro_activity_catalog 実エントリ数が 8 件であることを確認・CLAUDE.md を修正。v4.4 の「次チャット必須作業③ CLAUDE.md 更新」を完了としてクローズ。**

> **⚠️ v4.4 統合に関する最重要サマリ（次チャットの Claude は必ず最初に読むこと）：**
> 1. v4.3 では「`generateAudio.gs` v3.0（Google Cloud TTS WaveNet 移行）= ✅ 完了」と記録していたが、**その v3.0 にはWAVヘッダー二重化という重大バグが存在していた**。`audio_pipeline_handoff_v2_0.md` でバグの根本原因が特定され、**Phase 1（GAS修正・全件再生成トリガー）は完了済み**。**ただし Phase 2（音量正規化）・Phase 3（無音トリム/フェード）・Phase 4（SSMLアクセント補正）は未対応**。
> 2. v4.3 §13 の「移行時は `callGoogleCloudTTS_()` を置き換えるだけでよい（`buildWavBlob_()` 等の変更不要）」は **誤り**だった。実際には `buildWavBlob_()` の誤用がWAVヘッダー二重化の根本原因であり、新関数 `buildCloudTtsWavBlob_()` の新設が必要だった。§13 末尾に訂正注記を追記済み。
> 3. このプロジェクトには「Phase」という語が **3つの異なる文脈**で使われている。混同しないこと（詳細は §14-0）：
>    - **音声後処理 Phase 1〜4**：`audio_pipeline_handoff_v2_0.md` 由来。WAVバグ修正(1)・音量(2)・無音/フェード(3)・SSML(4)。**本資料 §14 で扱うのはこれ**。
>    - **TTSプロバイダ移行（v4.3 §13 でいう「Phase 2 以降」）**：VOICEVOX/AivisSpeech への将来移行。上記とは無関係。
>    - **プロジェクト設計フェーズ（`project_handoff_complete.md` の「Phase 1〜2 設計フェーズ」）**：プロジェクト全体の歴史区分。上記2つとは無関係。

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
4. バージョン番号を 4.4 → 4.5（または 5.0）に更新する
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
| **①** | **lesson_02 語彙 GAS投入** | `importFromLessonJson.gs` の `LESSON_FILE_IDS` に `lesson_02` のファイルIDを追加 → `importByFileId()` 実行。**投入するファイルは `lesson_02_v2_11_11.json`（最新版）** |
| **②** | **GASパイプライン稼働確認** | Vocabulary シートの列C/F/H/K を確認。classifyBatch がほぼ完了しているはず |
| **②-音声** | **音声パイプライン状態確認（v4.4 追加）** | (a) Vocabulary/Examples シートの `audioStatus` 列で `pending` がゼロになったか確認（Phase 1修正後の正常WAVで再生成されている）。(b) `syncAll()` 実行済み or 自動実行待ち → `master_audio_registry.json` に `audioUrl` が入っているか確認。(c) 完了後、§14 Phase 2・3 の Python/FFmpeg スクリプト作成に着手（依頼プロンプトは §14-9 にそのまま転記済み）。Phase 4（SSML）は試聴後 |
| **③** | **lesson_03.json 作成開始** | `SKILL_v1_6.md` の Step 1a（骨格設計）から開始 |
| ~~③~~ | ~~**CLAUDE.md 更新**~~ | **✅ v4.5 で完了済み**（L147: lessonVersion 1.1・L148: v2.11.11・L149: SKILL_v1_6.md・音声パイプライン仕様セクション新設・スキーマフィールド名注記追加） |

> **次チャットへのアップロード必須ファイル：**
> - `handoff_v4_5.md`（この資料）
> - `lesson_02_v2_11_11.json`（GAS投入対象・**v2.11.10 ではなく v2.11.11 を使うこと**）
> - `SKILL_v1_6.md`（第3課作成時に参照）
> - 必要に応じて `lesson_template.json`（第3課作成時）
> - 音声 Phase 2・3 着手時：統合スクリプトの最新版（Phase 1 修正済みのもの）・`master_audio_registry.json`（audioUrl が入った状態）
>
> **アップロード不要になったファイル（v4.5）：**
> - `audio_pipeline_handoff_v2_0.md`（§14 に統合済み）
> - `pipeline_setup_guide.md` / `gas_pipeline_handoff_v1.md`（リポジトリの docs/ で管理）

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
| **リポジトリ整理・Git初期化** | **フォルダ構成整理（docs/ gas/）・.gitignore・Git初期化・GitHub push** | ✅ **完了（v4.5）** | **2026-05-18** |
| **ドキュメント3本更新** | **CLAUDE.md・pipeline_setup_guide.md・gas_pipeline_handoff_v1.md を最新仕様に更新** | ✅ **完了（v4.5）** | **2026-05-18** |

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
| `lesson_01.json` | lessonVer **1.1** / fmt 2.7 | **2026-05-18** | 第1課「名詞」p1〜p3（3文型）・p3 3-5 キムさん重複解消（v4.3） |
| `lesson_02.json` | **lessonVer 2.11.11** / fmt 2.7 | **2026-05-18** | 第2課「こそあど」p1〜p6（6文型）・全残課題解消完了（v4.3） |
| `activity_catalog.json` | **v1.9** | **2026-05-17** | **58件**（validatedForLessons:[1]=40件・required=13件） |
| `intro_activity_catalog.json` | **v1.2** | **2026-05-17** | 導入アクティビティ8件 |
| `master_image_registry.json` | **v2.0** | **2026-05-18** | **109件**・全 imageUrl: null（GAS生成待ち）※下記注意 |
| `master_audio_registry.json` | **v1.2** | 2026-05-17 | 84件・全audioUrl: null（GAS生成待ち）※下記注意（v4.4 音声注記）|
| `image_prompts_lesson2.json` | **v2.0** | **2026-05-18** | 語彙17件・例文16件（計33件） |
| `session_001.json`（リポジトリ） | fmt 2.0 | 2026-05-15 | ✅ 新フォーマット（mainActivities形式・flow廃止済み） |
| `session_001.json`（ナレッジコピー） | **fmt 1.0** | 2026-05-05 | ⚠️ **旧フォーマットのまま**（flow/activity残存・テスト時は使わない） |

> **⚠️ レジストリのURL状態に関する重要な注意（v4.1で判明）：**
> `master_image_registry.json` v2.0 の全 imageUrl は null。GASパイプライン移行時にリセットされており、GAS の `generateImageBatch` → `syncAll` が生成・書き戻すまで null のまま。char_*・world_map も含めて全て null。これは設計どおりの正しい状態。

> **⚠️ v4.2 の master_image_registry 変更点：**
> v1.9（95件）→ v2.0（109件）。追加分は lesson_02 の例文 ex_L02_015〜028（14件・status: pending）。outdated 6件（ex_L02_002/005/006/011/012/013）は参照ミス追跡のため保持。

> **⚠️ v4.4 master_audio_registry の状態に関する重要な注意（音声）：**
> `master_audio_registry.json` v1.2 の全 audioUrl は依然 null だが、これは「未生成」ではなく「**Phase 1（WAVヘッダー二重化バグ）修正後に全件 `pending` へ戻して再生成中**」の状態。`resetToRegenerate()` を手動実行済み・`generateAudioBatch`（毎日10:00）が正常WAVで自動再生成中。完了後に `syncAll()` が `audioUrl` を書き戻す。**v4.3 までに生成された音声ファイルはWAVヘッダーが二重化した不良ファイルなので使用しないこと**（詳細は §14-3・§14-4）。

### ソースファイル（src/）

| ファイル | 状態 | 備考 |
|---|---|---|
| `src/main.js` | ✅ 最新 | 常にFlowSynthesizer経由 |
| `src/ui/form.js` | ✅ 最新 | flow フィールド廃止・mainActivities形式 |
| `src/common/flow_synthesizer.js` | ✅ 最新 | |
| `src/common/image_resolver.js` | ✅ 最新 | lh3.googleusercontent.com/d/{id}=w{size} 形式 |
| `src/common/ruby_dictionary.js` | **✅ v1.3** | lesson_02語彙18語カバー済み（「病院」はlesson_01収録済み）。ヘッダー参照バージョン修正済み（v4.3）|
| `src/styles/design_tokens.css` | ✅ 最新 | |
| `src/generators/slide_html.js` | ✅ 最新 | 全8typeスライド実装済み（Stage 6完了）|
| `src/generators/homework_html.js` | ✅ 最新 | |
| `src/generators/activity_html.js` | ✅ 最新 | 2,249行・9件実装済み |
| `src/generators/lesson_plan_docx.js` | ✅ 最新 | OOXML手書き・JSZip方式 |

### ドキュメント・設定ファイル

| ファイル | バージョン | 最終更新 | 変更内容 |
|---|---|---|---|
| `CLAUDE.md` | — | **2026-05-18** | **v4.5 で更新完了**：lessonVersion フィールド名・lesson バージョン修正・音声パイプライン仕様セクション新設・intro_activity_catalog 8件修正・スキーマフィールド名注記追加 |
| `README.md` | — | 2026-05-17 | ディレクトリ構成・build対象表を更新 |
| `docs/pipeline_setup_guide.md` | v1.1 | **2026-05-18** | **v4.5 で更新完了**：Gemini TTS → Cloud TTS WaveNet 全面更新・GCP_TTS_KEY 追加・冒頭注記追加 |
| `docs/gas_pipeline_handoff_v1.md` | — | **2026-05-18** | **v4.5 で更新完了**：旧仕様（Gemini TTS / .mp3 / 10件/日）に取り消し線・現行注記追加 |
| `scripts/build-embedded-data.py` | — | — | 全6ファイル対応済み（intro_activity_catalog・master_audio_registryを含む） |

### リポジトリ管理（v4.5 新設）

| 項目 | 状態 |
|---|---|
| Git 初期化 | ✅ 完了（2026-05-18） |
| GitHub リポジトリ | ✅ https://github.com/popJteacher/japanese-lesson-creator |
| ブランチ | `main`（`origin/main` にトラッキング済み） |
| コミット数 | 2（initial commit + fix: data files update） |
| 以降の push | `git push` のみで OK |
| .gitignore | ✅ 設定済み（ナレッジ専用ファイル・data/*.js・.claude/・.tmp_verify/ を除外） |
| フォルダ構成 | `docs/`（ドキュメント）・`gas/`（GASスクリプト受け皿・現在空）・`prompts/`（画像プロンプト設計）を追加 |

### リポジトリ フォルダ構成（v4.5 確定・git 追跡対象のみ）

```
japanese-lesson-creator/          ← リポジトリルート
│
├── .gitignore
├── CLAUDE.md                     ← Claude Code が自動参照（ルートに固定）
├── README.md
├── design_brief.md
├── index.html
│
├── data/                         ← *.json のみ追跡（*.js は build 生成物で除外）
│   ├── lesson_01.json            lessonVersion 1.1
│   ├── lesson_02.json            lessonVersion 2.11.11
│   ├── session_001.json          fmt 2.0
│   ├── session_002.json
│   ├── session_test.json
│   ├── activity_catalog.json     v1.9（58件）
│   ├── intro_activity_catalog.json  v1.2（8件）
│   ├── master_image_registry.json   v2.0（95エントリ）
│   └── master_audio_registry.json   v1.2
│
├── docs/                         ← ドキュメント類（v4.5 新設）
│   ├── pipeline_setup_guide.md   v1.1（Cloud TTS WaveNet 更新済み）
│   └── gas_pipeline_handoff_v1.md（旧仕様に注記追加済み）
│
├── gas/                          ← GASスクリプト受け皿（v4.5 新設・現在空）
│   └── .gitkeep
│
├── prompts/                      ← 画像プロンプト設計（*.py は .gitignore 除外）
│   └── （master_prompt_design_guide_v2_5.py は追跡対象外）
│
├── scripts/
│   └── build-embedded-data.py
│
└── src/
    ├── main.js
    ├── ui/
    │   └── form.js
    ├── common/
    │   ├── flow_synthesizer.js
    │   ├── image_resolver.js
    │   └── ruby_dictionary.js    v1.3
    ├── styles/
    │   ├── design_tokens.css
    │   └── fonts_imports.css
    └── generators/
        ├── slide_html.js
        ├── homework_html.js
        ├── activity_html.js      2,249行・9件実装済み
        └── lesson_plan_docx.js

【git 追跡対象外（.gitignore）】
  .claude/          ← Claude Code ローカル設定
  .tmp_verify/      ← 検証用テンポラリ
  data/*.js         ← build-embedded-data.py の生成物
  prompts/*.py      ← プロジェクトナレッジ専用
  SKILL*.md         ← プロジェクトナレッジ専用
  handoff_v*.md     ← プロジェクトナレッジ専用
  lesson_template.json ← プロジェクトナレッジ専用
```

### プロジェクトナレッジ専用ファイル（SSOT・リポジトリには入れない）

| ファイル | バージョン | 用途 |
|---|---|---|
| `SKILL_v1_6.md` | **v1.6**（v4.3 で作成完了） | 課マスター作成ガイド（claude.aiチャット用） |
| `lesson_template.json` | v1.2 | 新規課作成のベーステンプレート |
| `master_prompt_design_guide_v2_5.py` | v2.5 | 画像生成プロンプト設計ガイド（GAS用） |
| `ruby_dictionary_v1_3.js` | **v1.3** | SSoT版（v4.3 でヘッダー修正済み） |

---

## §4. ライン B の現在状態（GASパイプライン）

### GASスクリプト 8本（全完成・稼働中）

| スクリプト | 状態 |
|---|---|
| `setupSpreadsheet.gs` | ✅ 完成（初期構築済み）・**generateAudio セクションに Phase 1 WAVヘッダー修正適用済み（v4.4）** |
| `seedLesson01.gs` | ✅ 完成（投入済み） |
| `extractFromGoiList.gs` | ✅ 完成（N5 412語投入済み）|
| `importFromLessonJson.gs` | ✅ 完成・**lesson_02のファイルID未入力** |
| `classifyAndTranslate.gs` | ✅ 稼働中（毎時3語・自動） |
| `generateImages.gs` | ✅ 稼働中（1日3回・自動） |
| `generateAudio.gs` | ✅ **v3.0 + Phase 1 修正適用済み**（Google Cloud TTS WaveNet・1日1回・最大50件/回。**WAVヘッダー二重化バグは `buildCloudTtsWavBlob_()` 新設で修正済み**。実体は統合スクリプト `setupSpreadsheet.gs` の generateAudio セクション。詳細 §14） |
| `syncRegistries.gs` | ✅ 稼働中（毎日23:00・自動） |

### 自動タイマートリガー（全稼働中）

| 関数 | 頻度 | モデル |
|---|---|---|
| `classifyBatch` | 毎時 | Gemma 4 26B（`gemma-4-26b-a4b-it`）・3語/回 |
| `generateImageBatch` | 毎日 9:00・13:00・17:00 | Imagen 4（`imagen-4.0-generate-001`）・最大25枚/日 |
| `generateAudioBatch` | **毎日 10:00（1本のみ）** | **Google Cloud TTS WaveNet（`ja-JP-Wavenet-B`）・最大50件/回** |
| `syncAll` | 毎日 23:00 | — |

> **generateAudioBatch のトリガーを3本→1本に削減推奨**（v4.3）。MAX_BATCH_SIZE が 9→50 に増加したため、10:00 の1本で当日中に75件全て処理可能。

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
// v3.0 以降（MODEL フィールド廃止）
AUDIO_SETTINGS.VOICE_NAME:     "ja-JP-Wavenet-B"
AUDIO_SETTINGS.LANGUAGE_CODE:  "ja-JP"
AUDIO_SETTINGS.AUDIO_ENCODING: "LINEAR16"
AUDIO_SETTINGS.SAMPLE_RATE:    24000
AUDIO_SETTINGS.DELAY_MS:       1000
AUDIO_SETTINGS.MAX_BATCH_SIZE: 50
```

### ScriptProperties（全設定済み）

| プロパティキー | 用途 |
|---|---|
| `GEMINI_API_KEY` | AI Studio発行・classifyBatch / generateImageBatch |
| `GCP_TTS_KEY` | **Cloud Console発行（v4.3追加）・generateAudioBatch（Cloud TTS専用制限済み）** |
| `SPREADSHEET_ID` | 全スクリプト共通 |
| `IMAGE_FOLDER_ID` | generateImages.gs |
| `AUDIO_FOLDER_ID` | generateAudio.gs |

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
| **音声生成** | **`ja-JP-Wavenet-B`（Google Cloud TTS WaveNet）** | ✅ **50件/回・400万文字/月（無料枠）** |
| ❌ 使用不可 | `gemini-2.0-flash` / `gemini-1.5-flash` / `gemma-3-27b-it` | limit:0 または404 |
| ⚠️ 廃止（音声） | `gemini-2.5-flash-preview-tts`（Aoede） | v4.3 で Google Cloud TTS に移行済み |

### GASパイプライン 解決済みの問題（記録・再発時の対処法）

| 問題 | 原因 | 解決策（適用済み） |
|---|---|---|
| **音声発音が不正確**（「会社員」→「アイシェイン」） | Aoede ボイスは日本語専用でなく英語圏発音で処理 | TTSテキストに「日本語で読み上げてください：」プレフィックス付与。**`systemInstruction` は TTS で非対応（HTTP 500）** |
| **classifyBatch が6分制限でタイムアウト** | GAS実行時間制限 | `BATCH_SIZE: 3`（1バッチ最大210秒）。このAPIキーで generateContent に使えるのは `gemma-4-26b-a4b-it` のみ |
| **classifyBatch JSONパース失敗** | Gemma 4 thinking mode の思考テキスト内の `}` を誤取得 | `parseGemmaResponse_()` を最初の `{}` のみ抽出に変更 |
| **vocab_type 空のまま画像生成→品質低下** | 分類前の行が画像生成対象になっていた | `getPendingImageRows_()` に `vocabType !== ""` 条件追加 |
| **バッチエラーで残クォータ無駄** | 1日1回実行で失敗すると無駄 | 1日3回実行に変更（画像9/13/17時・音声10/14/18時）|
| **STYLE_RECIPE 不完全** | sub_color / skin_tones 欠落 | `#6B7C85`追加。`checkStyleRecipe()` で確認可 |
| **concrete_object プロンプト未最適化** | 語彙ごとの特徴未指定 | `OBJECT_SIGNATURES` 辞書追加（雑誌・本・新聞等10語）|
| **Gemini TTS の日本語ピッチアクセント不自然**（v4.3） | `gemini-2.5-flash-preview-tts` は多言語汎用モデル | **Google Cloud TTS WaveNet（`ja-JP-Wavenet-B`）に移行**（`generateAudio.gs` v3.0・`GCP_TTS_KEY` を ScriptProperties に登録・billing設定必須） |
| **WAVヘッダー二重化（冒頭ノイズ・全音声不良）**（v4.4） | Cloud TTS の `audioContent` は既にWAVヘッダー付き完成WAVなのに、生PCM用 `buildWavBlob_()` に渡して二重にWAVヘッダーを付与していた（変数名 `pcmBase64` が誤解を招いた） | **Phase 1 完了**：`callGoogleCloudTTS_()` の戻り値を `audioBase64` に変更、`buildCloudTtsWavBlob_()` を新設して `processAudioEntry_()` から呼ぶよう変更、`validateWavStructure_()`（nested RIFF 自動検出）・`resetToRegenerate()`（全件 pending 戻し）を追加。`word_医者.wav` で nested RIFF ゼロを確認。全件再生成は `generateAudioBatch`（毎日10:00）で自動進行中（詳細 §14-3・§14-4） |

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
| **lesson_02 materialNeeds 非標準 type** | — | v4.2 | ✅ `special_diagram`/`special_comparison_table` → `special_slide` に統一 |
| **lesson_02 A-4 reusedFrom 非対称** | — | v4.2 | ✅ intro_act_p3/p4 に `reusedFrom: "intro_act_p1"` 追加 |
| **lesson_02 `_meta._phase1f_handover` 混入** | — | v4.2 | ✅ lesson_02 の `_meta` から除去 |
| **master_image_registry L02 例文 14件未登録** | — | v4.2 | ✅ ex_L02_015〜028 を registry v2.0 に追加（status: pending） |
| **image_prompts_lesson2 語彙・例文の不整合** | — | v4.2 | ✅ 語彙3件追加（わたし/犬/写真）・例文5件追加・旧3件削除 |
| **SKILL v1.5 → v1.6 更新** | v4.2 | **v4.3** | ✅ teacher_real_object 公式追加・playerSteps 教師動作言及ルール明文化 |
| **ruby_dictionary ヘッダー修正** | v4.2 | **v4.3** | ✅ SECTION 6「v2.11.7・17語」→「v2.11.10・18語」。v1.3にバージョンアップ |
| **lesson_02 _step1c_check 記述修正** | v4.2 | **v4.3** | ✅「p4 に plusAlpha どちら を追加」→「examples[] に収録（SKILL 原則②）」に訂正 |
| **playerSteps ルール解釈の明文化** | v4.2 | **v4.3** | ✅ SKILL v1.6 で「教師動作の言及」行を追加（状況描写は許容・操作手順はteacherStepsへ） |
| **image_prompts 画像化対象マーク未付与 4件** | v4.2 | **v4.3** | ✅ ex_L02_022/025/026/028 の `_comment` に【画像化対象】マーク追加 |
| **lesson_01 p3 キムさん重複** | v19 | **v4.3** | ✅ 3-5「キムさんは東西デパートの会社員」→「ケリーさんは東西デパートの会社員」に変更（lesson_01 v1.1） |
| **Gemini TTS 日本語アクセント不自然** | v4.3 | **v4.3** | ✅ Google Cloud TTS WaveNet（ja-JP-Wavenet-B）に移行。generateAudio.gs v3.0・GCP_TTS_KEY 追加 |
| **WAVヘッダー二重化バグ（音声後処理 Phase 1）** | v4.4（`audio_pipeline_handoff_v2_0.md`） | **v4.4** | ✅ `buildCloudTtsWavBlob_()` 新設・`callGoogleCloudTTS_()` 戻り値変更・`validateWavStructure_()`/`resetToRegenerate()` 追加。`word_医者.wav` で nested RIFF ゼロ確認。全件再生成は自動進行中（§14-4） |
| **CLAUDE.md の古い情報（v4.3 で判明）** | v4.3 | **v4.5** | ✅ lessonVersion・SKILL_v1_6.md・音声パイプライン仕様セクション新設・スキーマフィールド名注記追加・intro_activity_catalog 8件修正まで全て完了 |
| **pipeline_setup_guide.md / gas_pipeline_handoff_v1.md の旧仕様記述** | v4.4 | **v4.5** | ✅ Gemini TTS → Cloud TTS WaveNet に全面更新。旧仕様に取り消し線・注記追加。docs/ フォルダに移動 |
| **リポジトリが Git 管理されていなかった** | — | **v4.5** | ✅ Git 初期化・GitHub push 完了（https://github.com/popJteacher/japanese-lesson-creator） |
| **data/ ファイルのバージョン不整合** | — | **v4.5** | ✅ master_image_registry v2.0・lesson_02 v2.11.11・lesson_01 lessonVersion 1.1 に更新。prompts/ 内の旧版 registry（v1.6）を削除 |
| **intro_activity_catalog CLAUDE.md 記載が 6 件だった** | — | **v4.5** | ✅ 実体 8 件を確認（act_attribute_modeling_intro / act_kosoado_object_intro が未掲載）。CLAUDE.md の表を全書き直し（id誤記・layout列の実態乖離も同時修正） |

### 🔴 未解決・要対応（次チャット以降）

| 課題 | 優先度 | 対応 |
|---|---|---|
| **lesson_02 GAS投入** | 高 | importByFileId（次チャット①）。**投入ファイル: lesson_02_v2_11_11.json** |
| ~~**CLAUDE.md の更新**~~ | ~~中~~ | **✅ v4.5 で完了** |
| **ナレッジ版 session_001.json が旧フォーマット（v1.0）** | 中 | リポジトリ版（v2.0）が正。ナレッジ版でテストしないこと |
| **ruby_dictionary「病院」未登録** | 中 | lesson_02 授業前に追加（lesson_01 収録済み語彙のため語彙データは正しいが JS ファイルへの記載が必要） |
| **act_info_gap_picture UI 未実装** | 中 | lesson_02 唯一の required アクティビティ。lesson_02 授業前に activity_blocks/ に実装 |
| **generateAudioBatch トリガー3本→1本に削減** | 低 | 任意・推奨。MAX_BATCH_SIZE=50 になり10:00の1本で75件全処理可能。**※`audio_pipeline_handoff_v2_0.md` §1 では既に「毎日10:00（1本のみ）」として記録されている＝実態は1本化済みの可能性が高い。次チャットでトリガー実体を1度確認すること（v4.4 横断確認事項）** |
| **音声後処理 Phase 2：音量正規化（loudnorm -18 LUFS）** | 中 | 全件生成完了後に Python+FFmpeg で実施。GAS単体不可。RMS最大5.8dB差を解消（§14-5・§14-9） |
| **音声後処理 Phase 3：冒頭/末尾無音調整・fade in/out** | 中 | 全件生成完了後に Phase 2 と一括実施。冒頭無音9.8〜51.4msのバラつき・末尾無音196〜216msを整える（§14-5・§14-9） |
| **音声後処理 Phase 4：SSMLアクセント補正** | 低〜中 | 試聴後に問題語（明日・一年・九月・終わる・中国人 等）を `needs_fix` にして SSML 設定→再生成（§14-5） |
| **品質管理ステータス拡充（checked / needs_fix / outdated）** | 低 | 現在 pending/generated/failed のみ。Phase 4 運用のため将来追加推奨（§14-6） |
| **activity_html.js imageRegistry未接続** | 低 | 画像生成フェーズ完了後に各 build*() 関数へ接続 |
| デザイン微調整 | 低 | 例文グリッド下線不揃い等（v18/v19既知・5件） |

---

## §6. 課マスター設計ライン

### 完成済みの課マスター

| 課 | ファイル | バージョン | 文型 | 状態 |
|---|---|---|---|---|
| 第1課 | `lesson_01.json` | fmt 2.7 / lessonVer **1.1** | p1〜p3（名詞・3文型） | ✅ 完成・GAS投入済み（v4.3 で p3 3-5 キムさん重複解消） |
| 第2課 | `lesson_02.json` | fmt 2.7 / lessonVer **2.11.11** | p1〜p6（こそあど・6文型） | ✅ 完成・**GAS投入待ち**（v4.3 で全残課題解消） |
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

### lesson_02 materialNeeds 公式 type 一覧（v4.3 確定）

SKILL v1.6 で `teacher_real_object` を公式追加済み（v4.3）。

| type | 説明 | 分類 |
|---|---|---|
| `auto_generated_vocab` | AI生成の語彙・場面イラスト | A |
| `named_character_card` | 名前付き人物カード | A |
| `special_slide` | 地図・比較表・領域対立図・こそあど一覧表など特殊スライド（v4.2で `special_diagram`/`special_comparison_table` を統合） | C |
| `special_handout` | 学習者配布物 | C |
| `teacher_photo` | 教師が自分で用意する写真・印刷物 | B |
| `teacher_real_object` | **教師が授業で実際に持参・提示する実物**（時計・ペン・かばん等）。写真と異なり物理的な実物（**v1.6 で公式追加済み**） | B |
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
1. lesson_02_v2_11_11.json を Google Drive にアップロード（v2.11.10 ではなく v2.11.11 を使うこと）
2. importFromLessonJson.gs の LESSON_FILE_IDS に追加：
   lesson_02: "YOUR_LESSON_02_JSON_FILE_ID_HERE"
3. previewImport("ファイルID") でドライラン確認
4. importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02") を実行
5. Vocabulary シートで lesson_02 語彙の追加を確認
```

**期待される投入語彙（18語）：** 時計・腕時計・ペン・鉛筆・ケータイ・本・雑誌・新聞・かばん・消しゴム・ビル・市役所・山・人・わたし・犬・写真（+ 病院はlesson_01 投入済み）

### ② GASパイプライン稼働確認

（Vocabulary シートの列C/F/H/K を確認。generateAudio.gs が v3.0・Google Cloud TTS WaveNet で稼働中であることも確認）

### ③ lesson_03.json の作成開始

SKILL_v1_6.md の Step 1a（骨格設計）から開始（SKILL v1.6 は v4.3 で完成済み）。  
第3課の文型シラバス（〜があります/います・〜で・〜に等）は SKILL §文型シラバスを参照。

---

## §9. ロードマップ

```
【完了済み（v4.3 時点）】
  ✅ ライン A 全工程（Step 1〜3・Stage 1〜7・データ同期）
  ✅ lesson_01.json v1.1（p3 3-5 キムさん重複解消）
  ✅ lesson_02.json v2.11.11（全残課題解消・画像化対象マーク・_step1c_check修正）
  ✅ activity_catalog v1.9（58件）/ intro_activity_catalog v1.2（8件）
  ✅ master_image_registry v2.0（109件）/ master_audio_registry v1.2（84件）
  ✅ image_prompts_lesson2.json v2.0（語彙17件・例文16件）
  ✅ ruby_dictionary.js v1.3（lesson_02語彙18語・ヘッダー修正済み）
  ✅ CLAUDE.md / README.md 更新
  ✅ SKILL_v1_6.md（teacher_real_object公式追加・playerStepsルール明文化）
  ✅ GASパイプライン 8本完成・稼働中
  ✅ generateAudio.gs v3.0（Gemini TTS → Google Cloud TTS WaveNet 移行済み）
  ✅ ScriptProperties に GCP_TTS_KEY 登録済み・billing設定済み

【完了済み（v4.4 追加）】
  ✅ 音声後処理 Phase 1：WAVヘッダー二重化バグ修正（buildCloudTtsWavBlob_()新設・全件 pending 戻し・自動再生成進行中）
  ✅ ChatGPT指摘の二重WAVヘッダーを Claude が実ファイル9件で独立再現・原因確定
  ✅ audio_pipeline_handoff_v2_0.md を本資料 §14 に全面統合（音声専用資料の役割を本資料に集約）

【完了済み（v4.5 追加）】
  ✅ CLAUDE.md 全面更新（lessonVersion フィールド名・lesson バージョン・音声パイプライン仕様・intro_activity 8件・スキーマ注記）
  ✅ pipeline_setup_guide.md v1.1 更新（Cloud TTS WaveNet 仕様に全面切替）
  ✅ gas_pipeline_handoff_v1.md 旧仕様に取り消し線・注記追加
  ✅ リポジトリ整理（docs/ gas/ フォルダ新設・.gitignore 設定）
  ✅ Git 初期化・GitHub push（https://github.com/popJteacher/japanese-lesson-creator）
  ✅ data/ 全ファイルを最新版に差し替え（master_image_registry v2.0・lesson_02 v2.11.11・lesson_01 lessonVersion 1.1）
  ✅ prompts/ 内の旧版 registry（v1.6）を削除
  ✅ intro_activity_catalog 実体 8 件確認・CLAUDE.md 表を全書き直し（id誤記・layout列乖離を同時修正）

【次チャット：必須】
  ① lesson_02 語彙 GAS投入（lesson_02_v2_11_11.json を使用）
  ② GASパイプライン稼働確認
  ③ lesson_03.json 作成開始（SKILL_v1_6.md Step 1a〜）
  ~~④ CLAUDE.md 更新~~ → **✅ v4.5 で完了**

【lesson_02 授業前に必須】
  ⑤ act_info_gap_picture UI 実装（activity_blocks/ に追加）

【その後：第2課授業実施まで】
  ⑥ 画像・音声の自動生成（GASタイマー・放置でOK。※音声は Phase 1 修正後の正常WAVで再生成中）
  ⑦ generateAudioBatch トリガーを3本→1本に削減（任意・推奨。※実態は1本化済みの可能性。要確認）
  ⑧ syncAll 実行 → master_image_registry / master_audio_registry 更新
  ⑨ build-embedded-data.py 実行 → HTML 反映
  ⑩ activity_html.js の imageRegistry 接続（画像生成完了後）
  ⑪ lesson_02 授業実施可能 🎉

【音声品質：全件生成完了後（v4.4 追加トラック・§14）】
  ⒜ 音声後処理 Phase 2：loudnorm（-18 LUFS）を全件適用（Python+FFmpeg）
  ⒝ 音声後処理 Phase 3：冒頭無音トリム・fade in/out・末尾無音130ms化（Phase 2 と一括）
  ⒞ QAログ出力（duration/peak/RMS/leading・trailing silence の処理前後比較）
  ⒟ 音声後処理 Phase 4：試聴→問題語を needs_fix→SSML設定→再生成
  ⒠ 品質管理ステータス拡充（checked/needs_fix/outdated）の検討

【低優先度・次チャット以降随時】
  ─ ナレッジ版 session_001.json を fmt 2.0 に更新

【中長期】
  ─ lesson_03〜NN の作成（SKILL に従って順次）
  ─ N4語彙追加（788語）→ extractByLevel() で実施
  ─ vocabFilter / exampleFilter の実装（マネタイズ差別化機能）
  ─ 日本語辞書サイトへの展開（word_*/sentence_* 資産の転用）
  ─ SaaS化・マネタイズ
  ─ VOICEVOX/AivisSpeech 品質比較（N5全語彙完了後・任意）
```

---

## §10. このチャットで判明したこと・確定した事項

（v4.1 §10 の内容をすべて継承。以下に v4.2・v4.3 で追加した判明事項を追記。）

| 判明事項 | 詳細 |
|---|---|
| **Step 3 は実装済みだった**（v4.1 継承） | CLAUDE.md の「保留中」記載は誤り。activity_html.js 2,249行を直接検査し8件全て確認 |
| **build-embedded-data.py は完成済み**（v4.1 継承） | intro_activity_catalog / master_audio_registry を含む全6ファイルが既にTARGETSリストに入っていた |
| **session_001.json はリポジトリ側のみ fmt 2.0**（v4.1 継承） | ナレッジのコピーは旧 fmt 1.0 のまま |
| **SKILL バージョン参照が v1.4 のまま引き継がれていた**（v4.1 継承） | v4.1 で全箇所を v1.5 に修正済み |
| **lesson_02 に materialNeeds 非標準 type が存在した**（v4.2） | `special_diagram`/`special_comparison_table` を `special_slide` に統一済み。`teacher_real_object` は v1.6 で公式追加済み |
| **A-4ルールの reusedFrom が非対称だった**（v4.2） | intro_act_p3/p4 に `reusedFrom: "intro_act_p1"` を追加済み |
| **`_meta._phase1f_handover` が lesson_02 に混入していた**（v4.2） | `_meta` から除去済み |
| **master_image_registry に lesson_02 例文 14件が未登録だった**（v4.2） | ex_L02_015〜028（14件・status: pending）を追加済み |
| **image_prompts_lesson2 が lesson_02 の現行版と乖離していた**（v4.2） | vocabulary 3語追加・例文5件追加・旧例文3件削除で修正済み |
| **lesson_01 p3 キムさん重複を解消**（v4.3） | 3-5「キムさんは東西デパートの会社員」→「ケリーさんは東西デパートの会社員」に変更。p3の5名が1例文ずつ担当する構造に整理 |
| **lesson_02 の低優先度残課題を全て解消**（v4.3） | _step1c_check C-4 文言修正（4-3はplusAlphaでなくexamples[]に収録）・画像化対象マーク4件追加（ex_L02_022/025/026/028）。第1・2課マスターの既知課題ゼロ達成 |
| **ruby_dictionary ヘッダー修正**（v4.3） | SECTION 6「v2.11.7・17語」→「v2.11.10・18語」に修正。v1.3にバージョンアップ |
| **SKILL v1.6 作成完了**（v4.3） | teacher_real_object を materialNeeds 公式 type として追加。playerSteps「教師動作言及」の解釈を明文化 |
| **音声生成 API を Gemini TTS → Google Cloud TTS WaveNet に移行**（v4.3） | `generateAudio.gs` v3.0 で callGeminiTTS_() を callGoogleCloudTTS_() に置換。AUDIO_SETTINGS から MODEL 廃止・VOICE_NAME/LANGUAGE_CODE/AUDIO_ENCODING/SAMPLE_RATE/DELAY_MS/MAX_BATCH_SIZE を更新。GCP_TTS_KEY を ScriptProperties に追加 |
| **音声生成バッチ能力が大幅向上**（v4.3） | MAX_BATCH_SIZE: 9→50・DELAY_MS: 6000ms→1000ms。75件が当日中に処理可能（旧: 約8日）。トリガー3本→1本に削減推奨 |
| **CLAUDE.md に複数の古い情報が残存（v4.3 で判明）** | L147: lesson_01 バージョン表記が「v2.11.x」（正: lessonVer 1.1）・L148: lesson_02 が「v2.11.9」（正: v2.11.11）・L149: SKILL.md 参照が「v1.4」（正: v1.6）・generateAudio.gs v3.0 の記録なし。次チャットで更新が必要 |
| **v3.0（Cloud TTS）に WAVヘッダー二重化バグが存在した**（v4.4） | v4.3 では「generateAudio.gs v3.0 = ✅ 完了」と記録していたが、その v3.0 の音声は全件WAVヘッダー二重化の不良ファイルだった。ChatGPT が初期指摘 → Claude が実ファイル9件で独立再現（byte 44 に nested RIFF）→ 原因は生PCM用 `buildWavBlob_()` の誤用と確定。**Phase 1 修正完了**（§14-3・§14-4） |
| **v4.3 §13 の記述が誤りだった**（v4.4） | §13 の「移行時は `callGoogleCloudTTS_()` を置き換えるだけでよい（`buildWavBlob_()` 等の変更不要）」は誤り。実際は `buildWavBlob_()` の誤用が根本原因で、新関数 `buildCloudTtsWavBlob_()` の新設が必須だった。§13 末尾に訂正注記を追記済み |
| **「Phase」という語が3系統で衝突していた**（v4.4） | ①音声後処理 Phase 1〜4（§14）②v4.3 §13 の TTSプロバイダ移行「Phase 2 以降」③`project_handoff_complete.md` のプロジェクト設計フェーズ Phase 1〜2。**いずれも無関係**。v4.4 ヘッダー警告・§14-0 で明示的に整理 |
| **音声後処理 Phase 2〜4 は未対応として明示記録**（v4.4） | Phase 2（音量正規化 -18 LUFS）・Phase 3（冒頭/末尾無音・fade）・Phase 4（SSMLアクセント補正）は全件生成完了後に着手。GAS単体では loudnorm 不可（Python+FFmpeg 必須）。依頼プロンプトを §14-9 に転記済み |
| **generateAudioBatch トリガー本数の記述が資料間で不整合**（v4.4 横断確認事項） | handoff §4/§5 では「3本→1本に削減推奨（未実施前提）」だが、`audio_pipeline_handoff_v2_0.md` §1 では「毎日10:00（1本のみ）」と記録。**実態が既に1本化済みの可能性が高い**。次チャットで GAS トリガー実体を1度確認すること |
| **generateAudio.gs / setupSpreadsheet.gs の Phase 1 修正にバージョン番号が未付与**（v4.4） | `audio_pipeline_handoff_v2_0.md` は「統合スクリプト（修正済みのもの）」とのみ記載しバージョンを付与していない。トレーサビリティのため次回 generateAudio セクションを `v3.1`（または setupSpreadsheet.gs 全体のリビジョン）として記録することを推奨 |
| **音声専用引き継ぎ資料を本資料に集約**（v4.4） | 今後 audio_pipeline_handoff を独立資料として持ち回らず、handoff_vX.X §14 に集約・更新する運用とした。`audio_pipeline_handoff_v2_0.md` 自体は履歴資料として保持（削除しない） |
| **課マスターのバージョンフィールド名は `lessonVersion`（`lessonVer` ではない）**（v4.5） | git 監査中に判明。`lesson_01.json` / `lesson_02.json` ともに `_meta.lessonVersion` フィールドを使用。handoff/CLAUDE.md に記載していた `lessonVer` は誤表記。CLAUDE.md のスキーマ要件に注記追加済み |
| **カタログ系 JSON の更新日フィールドは `lastModified`（`lastUpdated` ではない）**（v4.5） | git 監査中に判明。`activity_catalog.json` / `intro_activity_catalog.json` ともに `_meta.lastModified` を使用。`lastUpdated` はこれらのファイルに存在しない。CLAUDE.md に注記追加済み |
| **intro_activity_catalog の実エントリ数は 8 件（CLAUDE.md 記載は 6 件で誤りだった）**（v4.5） | git 監査中に判明。CLAUDE.md の表に id 誤記（`act_possession_intro` が `act_attribute_modeling_intro` の名前を使っていた）・layout 列の実態乖離（実ファイルに layout フィールドなし）も発見。CLAUDE.md の表を 8 件・2 カラム構成に全書き直し |
| **リポジトリに `prompts/master_image_registry.json`（v1.6）が混入していた**（v4.5） | `data/master_image_registry.json`（v2.0）が正規。旧版は git rm で削除済み |
| **GitHub リポジトリ URL が確定**（v4.5） | https://github.com/popJteacher/japanese-lesson-creator。Private リポジトリ。force push で auto-init commit を上書き、ローカルの 2 コミットが唯一の履歴 |

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
handoff_v4_5.md と lesson_02_v2_11_11.json と SKILL_v1_6.md をアップロードしました。

作業①：lesson_02_v2_11_11.json を GAS で Vocabulary シートに投入します。
importFromLessonJson.gs の LESSON_FILE_IDS に lesson_02 を追加して
importByFileId() を実行する手順を確認してください。

作業②：GASパイプラインの稼働状況を確認してください。
（generateAudio.gs が v3.0（Google Cloud TTS WaveNet）に移行済みであることも確認）

作業③：確認が取れたら lesson_03.json の作成を開始します。
SKILL_v1_6.md の Step 1a から始めてください。
```

---

## §13. 音声生成 API 移行の記録（v4.3 確定・参照用）

`handoff_audio_api_migration_v1.md`（v1.2）に基づく変更内容の記録。

### 変更ファイル
- `generateAudio.gs` v2.0 → v3.0（callGeminiTTS_() → callGoogleCloudTTS_() 置換）
- ScriptProperties に `GCP_TTS_KEY` を追加（GAS側はユーザーが実施済み）

### Cloud TTS エラー発生時の対処
| エラー | 対処 |
|---|---|
| `HTTP 403: API_KEY_INVALID` | ScriptProperties の GCP_TTS_KEY を再確認 |
| `HTTP 403: ACCESS_DENIED` | Cloud Console で Cloud Text-to-Speech API を有効化 |
| `HTTP 403: BILLING_DISABLED` | Cloud Console → お支払い から請求先アカウントを設定 |
| `audioContent が空` | `ja-JP-Wavenet-B` のスペルを確認 |

### 将来の音声API移行について
VOICEVOX / AivisSpeech は音質最高・コストゼロだが GAS から直接呼び出せない（ローカルエンジン）。N5全語彙完了後に聴き比べを実施し、Phase 2 以降で移行検討。移行時は `callGoogleCloudTTS_()` を置き換えるだけでよい（`buildWavBlob_()` 等の変更不要）。

> **🛠 v4.4 訂正注記（上記記述の誤りを訂正・原文は記録として保持）：**
> 1. **「移行時は `callGoogleCloudTTS_()` を置き換えるだけでよい（`buildWavBlob_()` 等の変更不要）」は誤りだった。** 実際には Cloud TTS の `audioContent` が「既にWAVヘッダー付きの完成WAV」であるのに対し `buildWavBlob_()` は「生PCMにWAVヘッダーを付与する」関数であり、両者の不整合がWAVヘッダー二重化バグの根本原因だった。Cloud TTS（および同様に完成WAV/エンコード済み音声を返すAPI）へ移行する場合は **`buildWavBlob_()` を使わず `buildCloudTtsWavBlob_()`（base64デコードしてそのまま Blob 化）を使う**必要がある。生PCMを返すAPIに移行する場合のみ `buildWavBlob_()` 系が必要。移行時は必ず `validateWavStructure_()` で nested RIFF を検査すること。
> 2. **ここでいう「Phase 2 以降」は TTSプロバイダ移行（VOICEVOX/AivisSpeech）の文脈**であり、§14 の「音声後処理 Phase 2（音量正規化）」とは**全く別物**。番号の衝突に注意（§14-0 参照）。
> 3. §14 に音声生成パイプラインの完全な引き継ぎ（`audio_pipeline_handoff_v2_0.md` 統合）を収録した。音声に関する判断は §14 を一次情報とすること。

---

## §14. 音声生成パイプライン完全引き継ぎ（`audio_pipeline_handoff_v2_0.md` v2.0 統合）

> **統合方針：** `audio_pipeline_handoff_v2_0.md`（v2.0・2026-05-18）の全セクションを情報欠落なく本資料に取り込む。原資料の編集ルール4項目（①各セクション追記のみ・削除禁止 ②「対応済み」「未対応」の区分を必ず明記 ③Phase 完了時に該当行へ ✅ ④前バージョンより短くなる場合は必ず理由を判明事項に記録）は本 §14 にもそのまま適用する。原資料の §番号は本資料では §14-N に対応させた（§14-1=原§1 …）。`audio_pipeline_handoff_v2_0.md` 自体は履歴資料として削除せず保持する。原資料の系譜は「`audio_workflow_handoff_2026-05-18.md`（ChatGPT作成版）→ `audio_pipeline_handoff_v2_0.md`（v2.0・Claude実ファイル分析+Phase 1完了版）→ 本資料 §14（v4.4 統合）」。

### §14-0. 「Phase」名前空間の整理（v4.4 で追加・最重要）

このプロジェクトで「Phase」は3つの無関係な文脈で使われている。混同するとパイプラインを壊す。

| 呼称 | 出典 | 意味 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|---|
| **音声後処理 Phase**（本 §14 で扱う） | `audio_pipeline_handoff_v2_0.md` | TTS出力WAVの品質処理 | WAVヘッダー二重化バグ修正（✅完了） | 音量正規化 loudnorm（⬜未対応） | 冒頭/末尾無音・fade（⬜未対応） | SSMLアクセント補正（⬜未対応） |
| **TTSプロバイダ移行 Phase**（v4.3 §13） | handoff_v4_3 §13 | 別TTSエンジンへの将来移行 | （番号未使用。「Phase 2 以降で移行検討」とだけ表現） | VOICEVOX/AivisSpeech 等への移行検討 | — | — |
| **プロジェクト設計 Phase** | `project_handoff_complete.md` | プロジェクト全体の歴史区分 | 設計フェーズ前半 | 設計フェーズ後半 | — | — |

**ルール：本 §14 で「Phase N」と書いてあれば必ず「音声後処理 Phase N」を指す。** 他2系統を指す時は必ず修飾語を付ける。

### §14-1. パイプライン全体像

```
Google Sheets（SSOT）
  ↓
generateAudio.gs（GAS）
  ↓
Google Cloud TTS API（ja-JP-Wavenet-B）
  ↓
WAV音声生成・Google Drive audio/ フォルダに保存
  ↓
Spreadsheetに audioStatus / audioUrl を書き戻し
  ↓
syncAll()（syncRegistries.gs）
  ↓
master_audio_registry.json 更新
  ↓
build-embedded-data.py（手動実行）
  ↓
宿題HTML・教材ページへ音声URLを埋め込み
```

**確定済み設定値（変更不要）**

| 項目 | 値 |
|---|---|
| SPREADSHEET_ID | `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` |
| AUDIO_REGISTRY_ID | `1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0` |
| VOICE_NAME | `ja-JP-Wavenet-B` |
| LANGUAGE_CODE | `ja-JP` |
| AUDIO_ENCODING | `LINEAR16`（WAV形式で返ってくる） |
| SAMPLE_RATE | `24000` Hz |
| MAX_BATCH_SIZE | `50` 件/回 |
| DELAY_MS | `1000` ms |

**自動タイマートリガー（稼働中）**

| 関数 | 実行時刻 |
|---|---|
| `generateAudioBatch` | 毎日 10:00 |
| `syncAll` | 毎日 23:00 |

> ※ 原資料は `generateAudioBatch` を「毎日10:00（1本のみ）」として記録。handoff §4/§5 の「3本→1本に削減推奨」と整合確認が必要（→ §10 横断確認事項）。

### §14-2. 問題の発端と分析経緯

**2-1. ChatGPT による初期分析（2026-05-18）**

音声ファイル10件（`word_お金.wav`〜`word_面白い.wav`）を ChatGPT に渡して分析し、以下が指摘された。

| 指摘項目 | 詳細 |
|---|---|
| 全ファイルに二重WAVヘッダー | 冒頭ノイズの主因 |
| 音量差が最大約7dB | RMS値がファイルごとに大きくばらつく |
| 末尾無音が約200ms | 連続再生・Ankiでテンポが悪くなる |
| SSMLが未使用 | ピッチアクセント・読み方の制御ができていない |

**2-2. Claude による独立した実ファイル分析（2026-05-18）**

添付された9件の新しいWAVファイルを実際に解析した結果：

| ファイル | 長さ | ピーク | RMS | 冒頭無音 | 末尾無音 |
|---|---|---|---|---|---|
| カラオケ | 0.921s | -4.3 dBFS | -20.3 dBFS | 51.4ms | 207.8ms |
| ギター | 0.823s | -9.5 dBFS | -22.4 dBFS | 9.8ms | 208.0ms |
| コンビニ | 0.862s | -4.1 dBFS | -17.3 dBFS | 50.9ms | 211.9ms |
| サッカー | 0.930s | -0.5 dBFS | -21.0 dBFS | 12.2ms | 214.0ms |
| 一年 | 0.832s | -6.1 dBFS | -18.3 dBFS | 23.0ms | 213.4ms |
| 中国人 | 1.092s | -8.7 dBFS | -19.2 dBFS | 49.4ms | 208.2ms |
| 九月 | 0.838s | -7.0 dBFS | -20.8 dBFS | 47.3ms | 210.0ms |
| 明日 | 0.739s | -3.7 dBFS | -23.1 dBFS | 17.5ms | 196.5ms |
| 終わる | 0.686s | -5.9 dBFS | -18.9 dBFS | 15.8ms | 215.8ms |

**ChatGPT評価との照合：**

| ChatGPT指摘 | Claude実測 | 一致度 |
|---|---|---|
| 全ファイル二重WAVヘッダーあり | 全9件・byte 44で確認 | ✅ 完全一致 |
| 音量差が最大7dB | 実測で最大5.8dB差 | ✅ ほぼ一致 |
| 末尾無音 約200ms | 実測 196〜216ms | ✅ 完全一致 |
| 冒頭ノイズの主因はWAV二重化 | 構造から裏付け確認 | ✅ 一致 |

### §14-3. 二重WAVヘッダーの根本原因

**原因：** `generateAudio.gs` に以下の設計上の誤りがあった。

```
Google Cloud TTS API
  ↓ audioContent を返す（← これは既にWAVヘッダー付きの完全なWAVファイル）
  ↓
callGoogleCloudTTS_() が pcmBase64 という名前で返す（← 誤解を招く変数名）
  ↓
buildWavBlob_() に渡す（← 生PCM用の関数。WAVヘッダーを新たに追加する）
  ↓
WAVヘッダーが二重化した異常なWAVファイルが保存される
```

**具体的なコード上の問題箇所（修正前）：**

```javascript
// callGoogleCloudTTS_() の戻り値（問題）
return {
  success:    true,
  pcmBase64:  json.audioContent,  // ← 変数名が誤解を招く
  sampleRate: AUDIO_SETTINGS.SAMPLE_RATE,
};

// processAudioEntry_() の処理（問題）
const wavBlob = buildWavBlob_(ttsResult.pcmBase64, ttsResult.sampleRate, row.filename);
//              ^^^^^^^^^^^^ 生PCM専用の関数にWAVデータを渡している
```

### §14-4. ✅ 対応済みフェーズ：音声後処理 Phase 1（GAS修正・全件再生成／2026-05-18 完了）

実施した変更（統合スクリプト `setupSpreadsheet.gs` 内の generateAudio セクション）：

**変更1：`processAudioEntry_()` の修正**

```javascript
// 変更前
const wavBlob = buildWavBlob_(ttsResult.pcmBase64, ttsResult.sampleRate, row.filename);

// 変更後
const wavBlob = buildCloudTtsWavBlob_(ttsResult.audioBase64, row.filename);
validateWavStructure_(wavBlob, row.audioId, ss);
```

**変更2：`callGoogleCloudTTS_()` の戻り値変更**

```javascript
// 変更前
return { success: true, pcmBase64: json.audioContent, sampleRate: AUDIO_SETTINGS.SAMPLE_RATE };

// 変更後
return { success: true, audioBase64: json.audioContent, sampleRate: AUDIO_SETTINGS.SAMPLE_RATE };
```

**変更3：`buildCloudTtsWavBlob_()` 関数を新設（`buildWavBlob_()` の直後に追加）**

```javascript
function buildCloudTtsWavBlob_(audioBase64, filename) {
  const audioBytes = Utilities.base64Decode(audioBase64);
  return Utilities.newBlob(audioBytes, "audio/wav", filename);
}
```

**変更4：ユーティリティ関数2つを追加**

- `resetToRegenerate()` — 既存音声を全件 `pending` に戻す（修正後に1度だけ実行済み）
- `validateWavStructure_()` — 生成直後に nested WAV header を自動検出してログに残す

**修正後の動作確認結果（`word_医者.wav`）：**

```
✅ validateWav [word_医者]: WAV構造 OK
✅ 完了: word_医者.wav → https://drive.google.com/uc?id=...
```

実ファイル解析でも確認済み：nested RIFF **なし**（修正前は byte 44 に存在）／サンプルレート 24000 Hz／ファイルサイズ 32,980 bytes（正常）。

**全件再生成の状況：**
- `resetToRegenerate()` を手動実行して全件 `pending` に戻し済み
- `generateAudioBatch`（毎日10:00）が自動的に再生成を進行中
- 完了確認方法：Vocabulary／Examples シートの `audioStatus` 列で `pending` がゼロになること

### §14-5. ⬜ 未対応フェーズ（全件生成完了後に実施）

**⬜ Phase 2：音量正規化（Python + FFmpeg）**

問題：RMSが -17.3〜-23.1 dBFS と最大 5.8dB の差。連続再生時に音量感が変わる。

| 用途 | 推奨ラウドネス |
|---|---|
| 辞書サイト・単語音声 | -18 LUFS |
| Anki・短い単語音声 | -16〜-18 LUFS |
| 長めの例文 | -18 LUFS |

```bash
# 単語音声向け（-18 LUFS）
ffmpeg -i input.wav -af "loudnorm=I=-18:LRA=7:TP=-1.5" output.wav
# 聞き取りやすさ優先（-16 LUFS）
ffmpeg -i input.wav -af "loudnorm=I=-16:LRA=7:TP=-1.5" output.wav
```
**注意：** GAS単体では loudness normalization は不可。Python + FFmpeg が必要。

**⬜ Phase 3：冒頭・末尾の調整（Python + FFmpeg）**

- 問題1：冒頭無音のバラつき 9.8ms（ギター）〜51.4ms（カラオケ）。50ms前後が複数（カラオケ・コンビニ・中国人・九月）。
- 問題2：末尾無音が均一に長い（全ファイル196〜216ms）。辞書・連続再生・Anki でテンポが悪い。

| 用途 | 末尾無音の目安 |
|---|---|
| 単語音声 | 100〜150ms |
| 例文音声 | 150〜250ms |

```bash
# fade in 20ms + loudnorm 組み合わせ
ffmpeg -i input.wav -af "afade=t=in:st=0:d=0.02,loudnorm=I=-18:LRA=7:TP=-1.5" output.wav
```

**理想処理順序（Phase 2 と合わせて一括実施推奨）：**

```
1. WAV構造チェック（nested header 残存確認）
2. 先頭無音トリム
3. 10〜20ms fade in
4. loudnorm（-18 LUFS）
5. 末尾無音を 100〜150ms に調整
6. 10〜20ms fade out
7. QAログ出力（duration / peak / RMS / leading silence / trailing silence）
```

**⬜ Phase 4：SSMLによるアクセント補正**

問題：現在 `input: { text: text }` でテキストをそのまま渡しており、ピッチアクセント・読み方・ポーズの制御不可。

| 語 | 懸念点 |
|---|---|
| 明日 | アクセント型がTTSで不安定になりやすい |
| 一年 | 数詞のアクセントは文脈依存 |
| 九月 | 同上 |
| 終わる | 動詞のアクセントは単語単体と文中で変わりやすい |
| 中国人 | 複合語のアクセント |

実施手順：①全件生成後に試聴 → ②不自然語をスプレッドシートで `needs_fix` に → ③SSML設定 → ④再生成。

```javascript
// テキストをそのまま渡す場合（現在）
input: { text: text }
// SSML を使う場合
input: { ssml: "<speak>" + ssml + "</speak>" }
// 会話文のポーズ例
const ssml = `これは何ですか。<break time="400ms"/>これは消しゴムです。`;
```

### §14-6. 将来の改善候補（優先度：低）

**TTSプロバイダ比較候補**（`ja-JP-Wavenet-B` は短期的に妥当。N5全語彙完了後に比較検討）

| 候補 | 長所 | 注意点 |
|---|---|---|
| Google Neural2 | より自然な可能性 | 無料枠が少なめ |
| Google Chirp 3 HD | 高品質の可能性 | 仕様・料金確認が必要 |
| VOICEVOX | ピッチ・日本語らしさに強い | サーバー構築が必要（GASから直接呼べない） |
| AivisSpeech | 品質期待値が高い | 運用設計が必要 |

> ※ この比較は v4.3 §13「TTSプロバイダ移行」トラックと同一論点。§14-0 の名前空間整理を参照。

**品質管理ステータスの拡充（将来）** — 現在 `pending / generated / failed` のみ。将来追加推奨：

| status | 意味 |
|---|---|
| `checked` | 試聴済み・問題なし |
| `needs_fix` | 問題あり・再生成必要 |
| `outdated` | 古い例文・使用しない（現在も存在） |

### §14-7. 完了判定チェックリスト

**Phase 1（✅ 完了）**
```
[✅] generateAudio.gs の buildCloudTtsWavBlob_() を使う修正が適用された
[✅] word_医者.wav で nested WAV が検出されなかった
[✅] validateWav: WAV構造 OK がログに出た
[✅] resetToRegenerate() を実行して全件 pending に戻した
[  ] 全件の audioStatus が generated になった（自動進行中）
[  ] syncAll() が実行されて audioUrl が registry に反映された
```
**Phase 2・3（⬜ 未着手）**
```
[  ] Python/FFmpeg スクリプトが作成された
[  ] loudnorm が全ファイルに適用された
[  ] ファイルごとの聞こえ方の差が許容範囲内になった
[  ] fade in/out が適用された
[  ] 末尾無音が 100〜150ms に揃った
[  ] QAログが出力された
```
**Phase 4（⬜ 未着手）**
```
[  ] 全件音声を試聴した
[  ] 不自然な語のリストを作成した
[  ] SSML を設定して再生成した
[  ] 再生成後に試聴して OK を確認した
```

### §14-8. 原資料 §8 で判明したこと（記録・追記のみ）

- **2026-05-18**：ChatGPTが指摘した二重WAVヘッダー問題をClaudeが独立して実ファイル（9件）で再現・確認。byte 44 で nested RIFF を検出し、原因推定（`buildWavBlob_()` の誤用）が正しいことを裏付け。
- **2026-05-18**：GAS統合スクリプト（`setupSpreadsheet.gs`）の generateAudio セクションを修正。`testSingleAudio()` で `word_医者.wav` を生成し実ファイル解析でも nested RIFF ゼロを確認。修正は成功。
- **2026-05-18**：Phase 2（音量正規化）・Phase 3（fade・末尾無音調整）は全件生成完了後に Python/FFmpeg で一括実施する設計とした。GAS単体では loudness normalization は不可と確認。
- **2026-05-18**：Phase 4（SSML対応）は試聴ベースで問題語を特定してから実施。全件生成完了前には着手しない。

### §14-9. 次に着手すること・Phase 2・3 依頼プロンプト（原資料 §9 を転記）

**次に着手すること**
```
1. SpreadsheetでaudioStatusのpendingがゼロになったことを確認
2. syncAll() を実行（または自動実行されるのを待つ）
3. master_audio_registry.json の audioUrl が入っているか確認
4. Phase 2・3 の Python/FFmpeg スクリプトを Claude に作成してもらう
5. スクリプトをローカルPCまたはCloud環境で実行
6. Phase 4（SSML）は試聴後に着手
```

**次チャットへ渡すべき情報（原資料 §9 を転記）**

- このファイル（統合先である本 `handoff_v4_4.md`。原資料は `audio_pipeline_handoff_v2_0.md` を指定していたが、v4.4 で §14 に全面統合済みのため本資料に置き換え。原資料も履歴として保持）
- 統合スクリプトの最新版（Phase 1 修正済みのもの＝`setupSpreadsheet.gs` の generateAudio セクション）
- 必要であれば `master_audio_registry.json`（audioUrl が入った状態）

> ※ この3項目は本資料冒頭「次チャットへのアップロード必須ファイル」にも反映済み。両者は同一内容を指す。

**Phase 2・3 の Python/FFmpeg スクリプト依頼プロンプト例（そのまま使用可）**
```
音声生成パイプラインの後処理Pythonスクリプトを作成してください。
引き継ぎ資料 handoff_v4_4.md §14 を参照してください。

対象：Google Drive の audio/ フォルダにある WAV ファイル全件
処理内容：
  1. nested WAV header の残存確認（あれば警告ログ）
  2. 先頭無音トリム
  3. fade in 20ms
  4. loudnorm（I=-18:LRA=7:TP=-1.5）
  5. 末尾無音を 130ms に調整
  6. fade out 20ms
  7. QAログ出力（ファイル名・duration・peak・RMS・処理前後の比較）

実行環境：ローカルPC（Python 3.x + FFmpeg インストール済み想定）
入力フォルダ：./audio_input/
出力フォルダ：./audio_output/
```

### §14-10. 原資料との対応・保全記録

| 原資料（`audio_pipeline_handoff_v2_0.md`）セクション | 本資料での収録先 | 保全状況 |
|---|---|---|
| §1 パイプライン全体像・設定値・トリガー | §14-1 | 全項目転記 |
| §2 問題の発端と分析経緯（測定値9件・照合表） | §14-2 | 全データ転記 |
| §3 二重WAVヘッダーの根本原因（コード断片含む） | §14-3 | 全コード転記 |
| §4 対応済み Phase 1（変更1〜4・確認結果） | §14-4 | 全コード・確認結果転記 |
| §5 未対応 Phase 2/3/4（FFmpegコマンド・処理順序・SSML） | §14-5 | 全コマンド・手順転記 |
| §6 将来の改善候補（TTS比較・status拡充） | §14-6 | 全表転記 |
| §7 完了判定チェックリスト | §14-7 | 全項目転記 |
| §8 判明したこと | §14-8 | 全項目転記 |
| §9 次のチャットへの引き継ぎ（次に着手すること・次チャットへ渡すべき情報・依頼プロンプト） | §14-9（3サブセクション全て転記。「渡すべき情報」のファイル名はv4.4統合に合わせ更新・原指定も併記。プロンプト参照先を handoff_v4_4 §14 に更新） | 全文転記 |
| 原資料ヘッダーの系譜（前資料：audio_workflow_handoff_2026-05-18.md＝ChatGPT作成版） | §14-10 末尾の系譜注記 | 転記 |
| 原§の編集ルール4項（追記のみ・区分明記・✅更新・短縮時は理由記録） | §14 冒頭の統合方針に4項目とも明記 | ルール継承 |

> 情報の欠落なし。原資料 `audio_pipeline_handoff_v2_0.md` は履歴として削除せず保持。今後の音声更新は本 §14 を一次情報として追記していく。
>
> **系譜注記：** 音声引き継ぎ資料の系譜は `audio_workflow_handoff_2026-05-18.md`（ChatGPT作成版・初版）→ `audio_pipeline_handoff_v2_0.md`（v2.0・Claude が実ファイル9件を独立分析し Phase 1 GAS修正を完了した版）→ 本資料 §14（v4.4 で handoff 本流へ統合）。ChatGPT作成版は原資料 §2-1 の初期指摘（10ファイル `word_お金.wav`〜`word_面白い.wav`）の出所であり、現存する場合は参照可能だが一次情報は本 §14。

---

*作成日：2026-05-18*
*根拠：handoff_v4_3.md 全文継承 ＋ `audio_pipeline_handoff_v2_0.md`（v2.0）全面統合（音声後処理 Phase 1 完了・Phase 2〜4 未対応・WAVヘッダー二重化バグ根本原因確定・v4.3 §13 記述の訂正・「Phase」名前空間整理）*
*前資料：handoff_v4_3.md（2026-05-18）／統合元：audio_pipeline_handoff_v2_0.md（2026-05-18・履歴として保持）*
