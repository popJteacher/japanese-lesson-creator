# docs/REFERENCE.md — 不変仕様・スキーマ・確定設定値

> 参照用の安定文書。プロトコルではない（プロトコルは `CLAUDE.md`）。
> 全ての確定値は **実ファイル** から転記する。handoff の文章とは合わせない。
> 矛盾があれば実ファイルが正、handoff は archive へ送る。

最終整備：2026-05-19（`_STEP3_ARCHIVE.md` ステップ3）

---

## 1. GAS パイプラインの正典

**正典＝`gas/pipeline.gs`**（hash 先頭：`a33271d4368e9c12`／元名 `gas_pipeline_v5_3_patched.gs`）。

- **GAS は1ファイル**。GAS プロジェクト側は monolith として運用されている（分割すると動かない）。
- ルートに散らかっていた `setupSpreadsheet.gs` / `generateAudio.gs` / `generateImages.gs` / `classifyAndTranslate.gs` / `extractFromGoiList.gs` / `importFromLessonJson.gs` / `syncRegistries.gs` / `seedLesson01.gs` は **monolith 内のコメント区切りセクション名**であって独立ファイルではない（一致するファイル名が存在するのは旧スタンドアロン版＝archive 行き）。
- デプロイ＝`gas/pipeline.gs` を丸ごと GAS スクリプトエディタに貼る。
- **monolith は分割しない**。特に `loadJsonFromDrive_` と `loadJsonFromDriveById`、`getExistingKeys` と `getExistingWords_` は **名前が似ているが署名・挙動が別物**。**「重複だから統合」を絶対にしない。**

### 1-1. ヘッダー版とセクション版（実ファイル `gas/pipeline.gs` より）

| 部位 | バージョン表記 | 注記 |
|---|---|---|
| ファイル先頭ヘッダー | `v7.3`（2026-05-20） | line 4。Phase 2 ⑥ で syncRegistries 退役 |
| `setupSpreadsheet` セクション | （無記） | line 28 |
| `seedLesson01` セクション | `v1.1` | line 179 |
| `extractFromGoiList` セクション | `v1.0` | line 361 |
| `importFromLessonJson` セクション | `v1.0` | line 569 |
| `generateImages` セクション | `v5.3`（2026-05-19） | line 986・最新パッチ＝`failed_N` リトライ＋`skipped_no_prompt` |
| `generateAudio` セクション | コメント `v2.0` | line 2766・**コメントは古いが実装は Cloud TTS WaveNet（Neural2）**。コメントと実装が乖離している点に注意 |
| `loadJsonFromDriveById`（保留ユーティリティ） | （無記） | line 2820 周辺。`importExamplesFromLesson02` 依存のため syncRegistries 撤去後も残置 |

> **ヘッダー版とセクション版のドリフトは仕様**（実害は今のところ無し）。`npm run validate` で検出するチェックを入れている。
> 退役済セクション：`classifyAndTranslate` / `exportVocabTypes`（v7.2・Phase 1 ④）、`syncRegistries`（v7.3・Phase 2 ⑥）。すべて `archive/gas_old/` に保全。

---

## 2. 音声パイプラインの確定値（`gas/pipeline.gs` AUDIO_SETTINGS より）

| 項目 | 値 | 出所 |
|---|---|---|
| API | Google Cloud TTS WaveNet | `texttospeech.googleapis.com` |
| **VOICE_NAME** | **`ja-JP-Neural2-B`** | line 2790 |
| LANGUAGE_CODE | `ja-JP` | line 2791 |
| AUDIO_ENCODING | `LINEAR16`（WAV 互換 PCM） | line 2792 |
| SAMPLE_RATE | `24000` Hz | line 2793 |
| MAX_BATCH_SIZE | `50` 件/回 | line 2802 |
| DELAY_MS | `1000` ms | line 2797 |
| VOCAB_SHEET_NAME | `Vocabulary` | line 2776 |
| EXAMPLES_SHEET_NAME | `Examples` | line 2777 |
| LOG_SHEET_NAME | `Log` | line 2778 |
| **ScriptProperties キー** | **`GCP_TTS_API_KEY`** | line 2970（**live プロジェクトで確認済**） |
| AUDIO_FOLDER_ID | ScriptProperty `AUDIO_FOLDER_ID` | line 2779 |

### 2-1. WAV ヘッダー二重化バグ対処

Cloud TTS は **既に WAV ヘッダー付きの完成 WAV** を返す。これに対して旧コードは **`buildWavBlob_()`（生 PCM 用）を被せていた**ためヘッダーが二重化していた。

正しい関数：

| 用途 | 関数 |
|---|---|
| Cloud TTS の完成 WAV | **`buildCloudTtsWavBlob_()`** — 受け取った base64 をそのまま Blob 化 |
| 生 PCM → WAV 化 | `buildWavBlob_()` — Gemini TTS など PCM が返るケース用 |

**Cloud TTS の戻り値に `buildWavBlob_()` を使わない。** v4.3 以前に生成された `.wav` は二重化されており、使用してはならない（再生成バッチで置き換え中）。

### 2-2. 自動トリガー（GAS Triggers 設定）

| 関数 | 実行時刻 | 状態 |
|---|---|---|
| `generateAudioBatch` | 毎日 10:00 | active（Phase 3 で引退予定） |
| ~~`syncAll`~~ | ~~毎日 23:00~~ | **退役済み（2026-05-20・Phase 2 ⑦）。** v7.3 でコード本体撤去・トリガーも human が削除済み。後継：`scripts/sync-registries-local.mjs`（ローカルから手動 / 必要時に実行） |

---

## 3. 画像パイプラインの確定値（`gas/pipeline.gs` IMAGE_SETTINGS より）

| 項目 | 値 | 出所 |
|---|---|---|
| MODEL | `imagen-4.0-generate-001` | line 1062 |
| MAX_BATCH_SIZE | `24` 件/回 | line 1065 |
| DELAY_MS | `2500` ms | line 1068 |
| ASPECT_RATIO | `1:1` | line 1072 |
| VOCAB_SHEET_NAME | `Vocabulary` | line 1050 |
| LOG_SHEET_NAME | `Log` | line 1051 |
| ScriptProperties キー（モデル呼出） | `GEMINI_API_KEY` | line 1034 注記 |
| IMAGE_FOLDER_ID | ScriptProperty `IMAGE_FOLDER_ID` | line 1054 |
| safetyFilterLevel | `block_only_high` | line 2644 |

### 3-1. プロンプトガイド正典

**`prompts/master_prompt_design_guide_v3_5.py`**（LF 正規化後 hash 先頭：`d6bf4c4eb90d`）。

- v3.4 → v3.5 適用器：`archive/prompts/apply_v3_5.py`（M-15 wave: テンプレ D/H/J を `{STRATEGY_BLOCK}` 構造化・11 編集）
  - D/H/J 本文の戦略並置を `{STRATEGY_BLOCK}` 1 個に置換
  - 新規 PART 4.10 OBJECT_STRATEGIES（2 戦略）/ 4.11 ACTION_VERB_STRATEGIES（5 戦略）/ 4.12 ADJECTIVE_STRATEGIES（3 戦略）として辞書化
  - HOW_TO_USE Step 3-C / Step 5-D / Step 6.5-C を新 PART に向け直し
  - HOW_TO_USE Step 5-A の `SYMBOLIC_MOTION` → `SYMBOLIC_MOTION_LINES` 名称統一（v2.4 から潜在していた truncated 表記を canonical key と一致化・M-15 wave で lookup key 化したため同期修正）
  - build_prompts.py の戦略展開ロジックは Phase 4 ② で同期実装（本パッチはガイド側構造変更のみ）
- v3.3 → v3.4 適用器：`archive/prompts/apply_v3_4.py`（v3.3 で deferred とした個別修正 + M-7 wave 補助辞書キー正規化・63 編集）
  - 個別: M-5 / M-10 / M-11 / M-27/M-40 / M-32 / M-36 / M-39/M-41 / M-6
  - M-7 wave: 5 補助辞書キー正規化（"会社(company office)" → "会社" + `_en`）/ M-52 composition_mood 13 件追加 / PART 8.5 プレースホルダ出所表新設
- v3.2 → v3.3 適用器：`archive/prompts/apply_v3_3.py`（件数アサート付き決定論パッチ・79 編集 / 72 件監査の主要分一括是正）
- v3.3 パッチ詳細仕様：`docs/PROMPT_GUIDE_V3_3_PATCHES.md`（9 wave 構造 / M-1〜M-72）
- v3.3 主要変更：
  - Wave 1 (M-49) PART 7 GEMINI_STABILIZATION 退役（archive 保全）／color_space_protocol を PART 6.5 として救出
  - Wave 2 (M-2) "purely decorative" 二層構造（グローバル constraints + テンプレ I/C/D/E 統一）
  - Wave 5 (M-28/37/42) SSOT 階層違反語（highlight / shadow / glossy / glow / specular）一括書換
  - Wave 6 (M-31) color_palette.educational_symbol_colors サブセクション新設
  - Wave 7 (M-47) skin tone NOT specified / hair varied dark で多文化配慮（v3.0 §3 繰越事項を最終解消）
- v3.1 → v3.2 適用器：`archive/prompts/apply_v3_2.py`（参考・16 編集）
- 旧版（v2.3〜v3.2）は `archive/prompts/` 配下
- ガイドは決定論パッチ（`apply_*.py`）でのみ改訂し、**手作業修正をしない**

### 3-2. リトライ・スキップ仕様（v5.3 パッチ）

`generateImages` セクションの `imageStatus` 列に書き込まれる状態値：

| 値 | 意味 |
|---|---|
| `pending` | 未生成・次回バッチ対象 |
| `success` | 生成済 |
| `skipped_no_prompt` | S列（imagePrompt）が空または 50 文字以下のためスキップ |
| `failed_1` / `failed_2` / `failed_3` | リトライ中（最大 3 回） |
| `failed_final` | 3 回失敗・自動再試行終了 |

### 3-3. S列プロンプト不変条件（`invariants.mjs` で検査）

| # | 不変条件 |
|---|---|
| 1 | 人物（`vocab_type=person`）プロンプトは「full-body」「head-to-toe」を含み、面積指定（`fills NN% of...`）を含まない |
| 2 | 物体（`concrete_object`）プロンプトは focal length `~50mm`（`85mm portrait lens equivalent` を含まない） |
| 3 | 抽象（`abstract_concept`）プロンプトは `flat-solid-only`（`gradient` 表現が残らない） |
| 4 | 背景文字列の一字一句一致（v3.3 M-5: vocab_type 別分岐）。default = `soft cream off-white background (warm off-white, NOT pure stark white)` / building = `pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette` |
| 5 | NOT/not 表記の一字一句一致（default のみ。building は確定色のため対象外） |
| 6 | 国旗例外規則（CONSTRAINTS）が強表現（`must` / `never`） |

---

## 4. 同期パイプラインの確定値

**v7.3（2026-05-20・Phase 2 ⑥）で GAS の syncRegistries セクションは退役。**
後継はローカル実装 `scripts/sync-registries-local.mjs`（Sheets API 経由・PROTECTED 規則を逐語継承）。

| 項目 | 値 | 出所（v7.3 以降） |
|---|---|---|
| SPREADSHEET_ID | `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` | `.env` の `SHEETS_SPREADSHEET_ID` ／ `gas/pipeline.gs` line 24 |
| IMAGE_REGISTRY_ID（旧 Drive snapshot） | `17WnltHEvymkua4hgfak2951f5BgphV9O` | `archive/gas_old/syncRegistries_v_NA.gs`（2026-05-19 新 ID。Drive 上のファイルは放置・SSOT は `data/master_image_registry.json`） |
| AUDIO_REGISTRY_ID（旧 Drive snapshot） | `1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M` | 同上（SSOT は `data/master_audio_registry.json`） |
| PROTECTED_PREFIXES | `["char_", "ex_L"]` | `scripts/sync-registries-local.mjs` line 44 |
| PROTECTED_EXACT | `["world_map"]` | `scripts/sync-registries-local.mjs` line 45 |

同値検証スナップショット：`archive/registries_snapshot_2026-05-20_gas/master_*_registry.json`（GAS syncAll 最終出力）と `data/master_*_registry.json`（ローカル sync 出力）を `scripts/diff-registries.mjs` で deep diff した結果、残差分 0 件（_meta 日付含む）。

---

## 5. 分類・抽出パイプライン

### 5-1. CLASSIFY_SETTINGS

| 項目 | 値 | 出所 |
|---|---|---|
| MODEL | `gemma-4-26b-a4b-it` | line 732（`gemma-4-26b-it` は存在しないので注意） |
| BATCH_SIZE | `3` | line 733 |
| SLEEP_MS | `500` | line 734 |
| API キー | `GEMINI_API_KEY`（ScriptProperty） | line 855 |

### 5-2. EXTRACT_SETTINGS

| 項目 | 値 | 出所 |
|---|---|---|
| SPREADSHEET_ID | `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` | line 366 |
| GOI_LIST_FILE_ID | `1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA` | line 367 |
| TARGET_LEVELS | `["1.初級前半"]` | line 368 |

---

## 6. lesson_NN.json スキーマ要件

### 6-1. 必須フィールド（v2.11 以降）

#### `_meta`

- `lessonVersion`（`lessonVer` は誤名）
- `lastModified`（`lastUpdated` は誤名）
- `formatVersion`, `description`, `createdAt`, `changes`

#### `patterns[]`

| フィールド | 必須 | 用途 |
|---|---|---|
| `id` | ✅ | `p1`/`p2`/... |
| `pattern` | ✅ | 表記（例: `〜は〜です`） |
| `label` | ✅ | スライドタイトル |
| `grammarConcept` | ✅ | snake_case 英語の文法概念 ID |
| `jlptLevel` | ✅ | `N5`/`N4`/... |
| `canDo` | ✅ | 「今日の目標」スライド日本語 |
| `canDoEn` | ✅ | 英語トグル時 |
| `vocabCount` | ✅ | 数 |
| `examples` | ✅ | 配列 |
| `practiceTemplates` | ✅ | 配列 |
| `shareVocabWith` | 任意 | 別文型 ID |

#### `patterns[].examples[]`

| フィールド | 必須 | 用途 |
|---|---|---|
| `no` | ✅ | `1-1` 形式 |
| `sentence` | ✅ | 日本語 |
| `sentenceEn` | ✅ | 英訳 |
| `imageId` | ✅ | `^ex_L\d{2}_\d{3}$` |
| `imageRole` | ✅ | `scene` / `vocab_person` 等 |
| `audioId` | ✅ | `^sentence_ex_L\d{2}_\d{3}$` |
| `isAnchor` | ✅ | boolean。**1 文型につき true は 1 件のみ** |

#### `vocabulary.byPattern[*].words[]`

| フィールド | 必須 |
|---|---|
| `word`, `reading`, `en`, `jlptLevel`, `isFirstAppearance`, `vocabType`, `imageRole` | ✅ |
| `imageId`（`word_X` 命名規則・registry と対応） | ✅ |
| `audioId`（`word_X` 命名規則・registry と対応） | ✅ |

#### `flow[]`

各文型分 `intro_act_pN → pattern_pN → example_pN → practice_pN` を含む。`example_pN` / `practice_pN` は `patternRef` で対象文型を指定する。

#### `namedCharacters[]`

各課の固有人物（intro_activity スライドで参照）：`name` / `occupation` / `nationality` / `imageId`。

### 6-2. レジストリ ID 命名規則（`master_image_registry.json` `_meta.primaryKeyRules` より）

| エントリ種 | キー命名 | 例 |
|---|---|---|
| `auto_generated_vocab` | `vocab_{word}` | `vocab_医者` |
| `auto_generated_action` | `action_L{NN}_{serial3}` | `action_L11_001` |
| `auto_generated_situation` | `sit_L{NN}_{serial3}` | `sit_L21_001` |
| `auto_generated_scene` | `scene_L{NN}_{serial3}` | `scene_L12_001` |
| `example_images` | `ex_L{NN}_{serial3}` | `ex_L01_001` |

### 6-3. status 値（image registry）

| 値 | 意味 |
|---|---|
| `pending` | 未生成。GAS の生成対象 |
| `generated` | 生成済み。人間レビュー待ち |
| `approved` | レビュー済み。GAS はスキップ |
| `rejected` | 品質 NG。再生成が必要（GAS が pending 扱いにする） |
| `outdated` | 古い設計のエントリ。`_outdated_replacedBy` で新エントリを参照 |

---

## 7. Stage 1 既知 9 問題（旧 `CLAUDE.md` より転記・解消済の固定値）

| # | 問題 | 対策 |
|---|---|---|
| 1 | Google Drive 画像が表示されない | `lh3.googleusercontent.com/d/{id}=w{size}` に正規化 |
| 2 | ふりがなが本文より大きい | `--font-size-ruby` を独立変数化 |
| 3 | ふりがな OFF でもスペース残る | `display: none` で完全消去 |
| 4 | ふりがな色が漢字と違う | `color: inherit` |
| 5 | トグルボタンに ruby | UI 要素には rubify しない |
| 6 | スライドラベルが英語 | すべて日本語化 |
| 7 | 学習目標スライドが空欄 | `teach[].patternId → patterns.canDo` 集約 |
| 8 | カウンタが合わない | subSlides 展開・1/N 表示一致 |
| 9 | デザイン不一致 | 共通 design_tokens を全 HTML に埋め込み |

---

## 8. handoff との既知の食い違い（注記・archive 行き）

| 出所 | 誤った記述 | 実ファイル | 採用 |
|---|---|---|---|
| `handoff_v4_4.md` §14 | VOICE_NAME = `ja-JP-Wavenet-B` | `ja-JP-Neural2-B`（line 2790） | 実ファイル |
| `handoff_v4_4.md` §14 | TTS キー property = `GCP_TTS_KEY` | `GCP_TTS_API_KEY`（line 2970・live 確認済） | 実ファイル |
| `progress_handoff_v14_0.md` §6 | v3.2 ガイド hash = `d22730eb47e4` | `5d7e52f00e3f`（`prompts/master_prompt_design_guide_v3_2.py`） | 実ファイル。**`apply_v3_2.py` を v3.1 入力に再実行した出力と改行正規化後 SHA が完全一致（`566b8ad687...`）したため、リポジトリの v3.2 は正規の監査済み成果物・handoff §6 の `d22730eb47e4` は誤記録と決定論的に確定（2026-05-19 検証）** |
| ライン B/C 旧 registry ID | `IMAGE_REGISTRY_ID=14NL_LqudXIQzY68klspH3SBlR21hiqbW` / `AUDIO_REGISTRY_ID=1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0`（旧 `audio_pipeline_handoff_v2_0.md` §1 など） | `IMAGE=17WnltHEvymkua4hgfak2951f5BgphV9O` / `AUDIO=1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M`（`gas/pipeline.gs` line 3067-3068） | 実ファイル。**旧 ID は Drive ファイル破損のため 2026-05-19 に新 ID へ移行。旧 ID は superseded（記録保全のみ）。音声 0 件問題（NEXT_ACTIONS の旧②）は新 ID への syncAll 復活により解消** |

これらの handoff は `archive/` 行き。詳細経緯は `handoff_archive.md` 参照。

---

## 9. 検証用ハッシュ（2026-05-20 時点）

| ファイル | SHA256 先頭 12 桁 | 算出方法 |
|---|---|---|
| `gas/pipeline.gs` | `a33271d4368e` | raw |
| `prompts/master_prompt_design_guide_v3_5.py` | `d6bf4c4eb90d` | **LF 正規化後**（`invariants.mjs` B の比較方法。canonical 正典） |
| `prompts/master_prompt_design_guide_v3_4.py` | `738af3e76983` | **LF 正規化後**（旧正典・v3.5 確定後は archive 候補） |
| `prompts/master_prompt_design_guide_v3_3.py` | `80de1a8e675f` | **LF 正規化後**（旧正典・v3.4 確定後は archive 候補） |
| `prompts/master_prompt_design_guide_v3_2.py` | `566b8ad68753` | **LF 正規化後**（旧正典。v3.3 確定後は archive 候補・参照のみ） |
| `apply_v3_5.py` | — | `archive/prompts/` 配下（11 patch・件数アサート付き / v3.5 確定後は検証時のみ再実行） |
| `apply_v3_4.py` | — | `archive/prompts/` 配下（63 patch / v3.4 確定後は検証時のみ再実行） |
| `apply_v3_3.py` | — | `archive/prompts/` 配下（79 patch / v3.3 確定後は検証時のみ再実行） |
| `apply_v3_2.py` | — | `archive/prompts/` 配下（履歴保全のみ） |

---

## 10. ファイル配置の正典マップ

| 役割 | 正典パス |
|---|---|
| GAS（monolith） | `gas/pipeline.gs` |
| プロンプトガイド | `prompts/master_prompt_design_guide_v3_5.py`（v3.2/v3.3/v3.4 は archive 候補） |
| 課マスター | `data/lesson_NN.json` |
| アクティビティカタログ | `data/activity_catalog.json` / `data/intro_activity_catalog.json` |
| レジストリ | `data/master_image_registry.json` / `data/master_audio_registry.json` |
| Web ツール HTML | `index.html` |
| 生成器（JS） | `src/generators/*.js` |
| 共通モジュール | `src/common/*.js` |
| CSS | `src/styles/*.css` |
| UI | `src/ui/form.js` |
| 検証スクリプト | `scripts/validate.mjs` / `scripts/missing-assets.mjs` / `scripts/invariants.mjs` |
| 旧資料アーカイブ | `archive/`（索引は `handoff_archive.md`） |
