# handoff_archive.md — 旧 handoff 索引（保全・参照用）

> `archive/` 配下に集約した過去資料の索引。**新セッションは原則読まない。**
> 特定の過去判断（バグ史・確定値の根拠）を調べる時だけ参照する。
> 確定設定値・スキーマは `docs/REFERENCE.md` に転記済み。整合性は実ファイル（`gas/pipeline.gs` / `data/*` / `prompts/master_prompt_design_guide_v3_2.py`）が正。

整備：2026-05-19（`_STEP3_ARCHIVE.md` ステップ4）

---

## archive/handoffs/（79 ファイル）

### 1. プロジェクト総合 handoff（v2 系・v3 系・v4 系）

| ファイル | 役割（要点のみ） | 反映先 |
|---|---|---|
| `handoff.md` | 初版 | — |
| `handoff_v2.md` 〜 `handoff_v2_9.md`（9 件） | Stage 1 各反復 | Stage 1 既知 9 問題（`docs/REFERENCE.md` §7） |
| `handoff_v3_0.md` | Stage 2 → 3 移行 | — |
| `handoff_v4_0.md` 〜 `handoff_v4_7.md`（9 件・`v4_2 (1)` 含む） | Stage 4（GAS 統合・音声）系 | `handoff_v4_4` の `VOICE_NAME=ja-JP-Wavenet-B` / `GCP_TTS_KEY` は **誤値**（`docs/REFERENCE.md` §8） |
| `handoff_merger_v1.md` / `handoff_post_merger_v1.md` | GAS スクリプト統合（monolith 化） | `gas/pipeline.gs` |

### 2. 進捗 handoff（画像プロンプトガイド系）

| ファイル | 焦点 | 反映先 |
|---|---|---|
| `progress_handoff_v8_0.md` 〜 `v13_0.md`（6 件） | v2.x → v3.0 → v3.1 ガイド進化 | `prompts/master_prompt_design_guide_v3_2.py` |
| `progress_handoff_v14_0.md` | **v3.2 ガイド確定**・7 項目矛盾解消・3 構造的事実残課題 | `docs/REFERENCE.md` §3-1 / §8（hash 誤記注記） |

### 3. プロンプトガイドレビュー系

| ファイル | 焦点 |
|---|---|
| `prompt_guide_review_handoff.md` 〜 `v7_0.md`（`v4 (1)` 含む 9 件） | v2.5 → v2.6 → v2.7 → v2.8 各反復のレビュー | `prompts/master_prompt_design_guide_v3_2.py` で集約 |

### 4. 課マスタールール handoff

| ファイル | 焦点 | 反映先 |
|---|---|---|
| `lesson_master_rules_handoff.md` 〜 `v19.md`（19 件） | lesson_NN.json スキーマ進化（audioId・isAnchor・canDoEn 追加など） | `docs/REFERENCE.md` §6 |

### 5. GAS パイプライン handoff（旧版）

| ファイル | 焦点 | 反映先 |
|---|---|---|
| `gas_pipeline_handoff_v1.md` 〜 `v8.md`（8 件） | GAS 統合・v5 系設計 | `gas/pipeline.gs`（v7.1 ヘッダー） |
| `pipeline_setup_guide.md` | GAS セットアップ手順 | （セットアップは ScriptProperties 設定のみ） |

### 6. 画像生成 handoff

| ファイル | 焦点 | 反映先 |
|---|---|---|
| `image-gen-handoff-v1.md` / `v3.0` / `v5.0` | 画像生成設計の旧スナップショット | `prompts/master_prompt_design_guide_v3_2.py` |
| `image_gen_handoff_v2.md` / `v4_0.md` | 同上 | 同上 |
| `image_generation_system_guide.md` | 画像生成システムガイド | `docs/REFERENCE.md` §3 |
| `handoff_image_pipeline_v3_1.md` | 画像パイプライン v3.1 | `gas/pipeline.gs` IMAGE_SETTINGS |

### 7. 音声 handoff

| ファイル | 焦点 | 反映先 |
|---|---|---|
| `audio_pipeline_handoff_v2_0.md` | Phase 1 WAV ヘッダー二重化バグ分析 | `docs/REFERENCE.md` §2-1 |
| `audio_workflow_handoff_2026-05-18.md` | 音声ワークフロー | 同上 |
| `handoff_audio_api_migration_v1.md` | Gemini TTS → Cloud TTS 移行 | `gas/pipeline.gs` AUDIO_SETTINGS |

### 8. その他

| ファイル | 役割 |
|---|---|
| `CLAUDE_OLD.md` | 旧長文 CLAUDE.md（17568 B）。役割が新 CLAUDE.md / NEXT_ACTIONS.md / PIPELINE_INVENTORY.md / docs/REFERENCE.md に分割された |
| `claude_chrome_image_workflow.md` | Claude in Chrome を使った画像 SMOKE のメモ |
| `claude_code_impl_lesson01.md` | lesson_01 実装メモ |
| `slide_spec_remaining_4types.md` | スライド仕様 4 種残り |

---

## archive/gas_old/（15 ファイル）

旧スタンドアロン `.gs` ファイル群＋非正典 monolith コピー＋Phase 1 ④ 退役 GAS。

| ファイル | 種別 | 注記 |
|---|---|---|
| `gas_pipeline_v5_3.gs` | 旧 monolith | patched との差分：`failed_N` リトライ未実装・`skipped_no_prompt` 未実装。**`gas/pipeline.gs` が正典**（patched 版） |
| `setupSpreadsheet.gs` / `seedLesson01.gs` / `extractFromGoiList.gs` / `importFromLessonJson.gs` / `classifyAndTranslate.gs` / `classifyAndTranslate_v1_1.gs` / `generateImages.gs` / `generateImages_v5_1.gs` / `generateAudio.gs` / `generateAudio (1).gs` / `syncRegistries.gs` | 旧スタンドアロン | **monolith にマージ済**。これらは死んだファイル（monolith 内のセクション名と同名なのが混乱の原因） |
| `Gasv5.json` | 古い Drive エクスポート | — |
| `japanese-lesson-pipeline.json` | 最新の Drive エクスポートバンドル（`setupSpreadsheet` ソース 152660 B） | 中身は `gas/pipeline.gs` と同じ（Drive 投入用 wrapper） |
| `exportVocabTypes_v1_0.gs` | Phase 1 ④ 退役（2026-05-20）| `gas/pipeline.gs` v7.2 から削除。後継 `scripts/classify-and-translate.mjs` が `data/vocab_types_lessonNN.json` を直接書く |
| `syncRegistries_v_NA.gs` | Phase 2 ⑥ 退役（2026-05-20）| `gas/pipeline.gs` v7.3 から削除。`loadJsonFromDriveById` のみ `importExamplesFromLesson02` 依存のため本体に残置。後継 `scripts/sync-registries-local.mjs` が Sheets API で `data/master_*_registry.json` を直接書く。同値検証 PASS（`archive/registries_snapshot_2026-05-20_gas/` と `scripts/diff-registries.mjs` 参照） |
| `generateAudio_v2_0_phase3_retired.gs` | Phase 3 ⑥ 退役（2026-05-20）| `gas/pipeline.gs` v7.4 から削除。後継 `scripts/generate-audio-local.mjs`（Cloud TTS Neural2 ローカル）+ `scripts/lib/audio-qc.mjs`（ffmpeg two-pass loudnorm/silenceremove/afade）+ `scripts/validate-audio.mjs`（invariants[D] = 音声 QC スペック検証）。GAS Trigger `generateAudioBatch`（毎日 10:00）削除済 |
| `generateImages_v5_3_phase4_retired.gs` | Phase 4 ⑥ 退役（2026-05-21）| `gas/pipeline.gs` v7.5 から削除（2815→799 行・**-2016 行**）。Option C で **画像生成 + 関連 Sheet 操作 utility 9 件 + loadJsonFromDriveById** を一括退役。後継 `scripts/generate-images-local.mjs`（Imagen 4 ローカル）+ `scripts/lib/imagen-client.mjs`（AI Studio key 経由）+ `prompts/master_prompt_design_guide_v3_11_1.py`。GAS Trigger `generateImageBatch` × 3 件（9 / 13 / 17 時）削除済。**Sheet 操作 utility 退役理由：Phase 2 で registry が SSOT 化後、Sheet 直接操作は drift を生む anti-pattern**。`loadJsonFromDriveById` は唯一 consumer `importExamplesFromLesson02` 退役で同時引退 |
| `nanobanana-client.mjs` 追加 + 既定 backend 切替 | Phase 4 後 nanobanana 化（2026-05-21）| Google AI Studio UI が Nano Banana family のみ提供 + user の手動検証も Nano Banana で実施しているため、本番自動 flow も nanobanana に統一して visual unity を達成。`scripts/lib/nanobanana-client.mjs` 新規（`gemini-2.5-flash-image` 既定・$30/M output tokens · ~$0.0387/img）。`generate-images-local.mjs` に `--backend nanobanana\|imagen4` フラグ追加（既定 nanobanana）。Imagen 4 は opt-in 残存。実機 5 件再生成 + human review で **PHASE_BACKLOG § Imagen 4 由来 3 項目（line weight / text bake-in / photoreal drift）が nanobanana では未再現を確認**（v3.12 主指針が「nanobanana 安全 = 項目 1-6 のみ必須対応」に確定） |

---

## archive/prompts/（14 ファイル）

プロンプトガイド旧版＋v3.2 適用器。

| ファイル | 役割 |
|---|---|
| `master_prompt_design_guide.py` / `_v2_3` / `_v2_4` / `_v2_5` / `_v2_5_1` / `_v2_6` / `_v2_6_complete` / `_v2_7` / `_v2_8` / `_v2_9` / `_v3_0` / `_v3_1` | プロンプトガイド旧版（v2 系・v3.0・v3.1） |
| `apply_v3_2.py` | v3.1 → v3.2 適用器（16 編集・件数アサート付き）。v3.2 確定後は再実行不要 |
| `d2.txt` | v3.1 → v3.2 全 diff（135 行・26 hunk） |

正典は `prompts/master_prompt_design_guide_v3_2.py`（hash `5d7e52f00e3f`）。

---

## archive/data_old/（21 ファイル）

非正典 lesson / catalog / registry / prompt JSON。

| 区分 | ファイル |
|---|---|
| 課マスター旧版 | `lesson_01_v1_1.json` / `lesson_02_v2_11_10.json` / `lesson_02_vocab_typed.json` |
| カタログ旧版 | `activity_catalog.json`（root 重複） / `_v1.7` / `_v1.9` / `intro_activity_catalog.json`（root 重複） / `lesson_template.json` |
| レジストリ旧版 | `master_audio_registry.json`（root 重複） / `master_image_registry.json`（root 旧版） / `master_image_registry_v2_0.json` |
| プロンプト JSON（旧 S列） | `image_prompts_lesson01_v1_0.json` 〜 `_v1_2`・`_SMOKE_v1_3` / `image_prompts_lesson02_v1_0.json` / `_v1_1` / `_lesson1_v8` / `_lesson2_v2.0` / `_v2_0` |
| 音声プロンプト旧版 | `audio_prompts_lesson1.json` |

正典は `data/lesson_NN.json` / `data/master_*_registry.json` / `data/activity_catalog.json` / `data/intro_activity_catalog.json`。

---

## archive/misc/（7 ファイル）

| ファイル | 役割 |
|---|---|
| `ruby_dictionary.js` | root 重複（正典は `src/common/ruby_dictionary.js`） |
| `ruby_dictionary_v1_3.js` | 旧版 |
| `activity_html.js` | root 旧版（正典は `src/generators/activity_html.js`） |
| `smoke_test_v3_1.json` | v3.1 SMOKE 入力。v3.2 で作り直し予定（`progress_handoff_v14_0` §4） |
| `japanese-lesson-asset-list.xlsx` | アセット一覧スプレッドシート（参考） |
| `image_prompts_lesson01_v1_4.json` | v3.0 系 S列（旧）・v3.2 で再生成待ち |
| `deep_research_integration_summary_v1.1.md` | activity_catalog v1.6 同期メモ |

---

## archive/screenshots/（3 ファイル）

`screencapture-file-C-Users-kohn0-Downloads-studentB-S002-html-*.png`（Stage 1 動作確認時のスクリーンショット・約 11 MB）。

---

## 方針転換ログ（時系列・特定の過去判断を調べる用）

- **2026-05-22 v3.13 → v4.0 pivot**：worktree image-prompt-plan で v3.13 #1
  (GARMENT_REGISTER_CONSISTENCY_RULE) 着手前にアジア／西洋アシンメトリ問題
  （日中韓越のみ伝統 silhouette・米伯西は modern + craft accent → 構造的
  exoticization リスク + modern reality との乖離）が論点化。逆方向の
  simplification として **v4.0 = 全国 modern daily casual wear + 国旗視認性
  強化（d 手持ち優先・c 背景 banner フォールバック）** へ pivot 確定。
  PHASE_BACKLOG v3.13-#1 (register 一致)・#3 (signature 多軸化) は v4.0
  採用により原理的に不要化・retire。#2 (role plain-solid) は modern wear
  統一で副次的に解消見込み。#4 (vocab_subtype) のみ独立 backlog として保持。
  関連 memory：worktree 側 `project_v4_0_pivot.md` /
  main 側 `project_v4_0_pivot.md`（同名・worktree 起源情報を main 視点で保持）。

- **2026-05-22 v4.0 実装完了**：worktree image-prompt-plan で v4.0 ガイド本体
  + build_prompts.py 改修 + invariants 更新を実装し、4 ラウンド・nanobanana
  48 件・$1.86 で実機検証 → user 視覚 OK「とてもよくなりました」→ main へ
  ff-merge（commit `1a42cd4` / B hash `2137a8e885ae` → `5338c98aab5d`）。
  data/images/word_*.png 12 件（role 5 + nationality 7）を v4.0 再生成済。
  残課題：flag size の国別バラツキ（10-25% / nanobanana 確率揺れ / user
  手動再生成予定・PHASE_BACKLOG「Phase 4 後 backlog」に記録）。
  archive：`archive/prompts/master_prompt_design_guide_v3_12.py` +
  `archive/prompts/image_prompts_lesson01_v3_12.json` に v3.12 系を保全。

- **2026-05-22 v4.0 flag size 残課題 retire**：v4.0 取り込み後の人間レビューで
  `word_ベトナム人.png` のみ flag size が異常に大（他 11 件は許容内）。user が
  worktree で `--force` 再生成 → main に手動コピー反映（hash
  `298b98de2a77` → `971f22c6285d`）。PHASE_BACKLOG「flag size 均一化」項目は
  retire。今後 lesson 拡張で新規 outlier が出た場合は per-image 対応。

- **2026-05-22 Phase 5 ④ アーキテクチャ pivot：決定論 → Claude Code スキル方式**：
  worktree example-prompts で Phase 5 ④ worktree A の Q1A / Q2A / Q3B を実装中、
  user との対話で **build_prompts.py 決定論方式は本来の設計意図と乖離**している
  ことが判明（GAS 時代の実運用は「Claude-in-chat が普遍ルール従って prompt 書く →
  importImagePrompts で S 列投入」だった）。Goi_List 17,508 件への自動展開には
  決定論 + 手書き辞書では原理的に不可能。Claude API（Sonnet）案も検討したが
  user 指示で **Claude Code スキル `/generate-image-prompt` 方式**に確定（API
  課金 0・サブスク内・GAS 時代の流れを取り戻す）。worktree A の Q1A
  （example_sentence inline）/ Q2A（transcribe スクリプト）/ preflight 関数群 /
  v4.1 hash は保全。Q3B の Python dispatch / render_* / compose_* / classify_person
  等は dead code 化（v4.1 commit `a830c95` は履歴として保持）。実機検証で得た
  PERSON_NATIONALITY_HINTS / BUILDING_CUES / OBJECT_SIGNATURES 等の知識は
  ガイド PART 4 Reference Appendix として転記して保全。Phase 5 ④' = pivot 後の
  本格実装は新規 fresh worktree session で着手予定。関連 memory：
  `project_phase5_pivot_to_claude_code_skill.md` /
  `feedback_skill_over_api_for_prompt_gen.md`。

- 2026-05-23 Phase 5 ④' worktree skill 実装完了：6-PART .md ガイド (manifest hash
  1ca2f57ad927) + `.claude/skills/generate-image-prompt.md` (4 mode) + preflight
  切出 `scripts/lib/prompt_preflight.py` + invariants B' 機械検証。lesson_01 smoke
  PASS (医者)。schedule は Windows schtasks ローカル方式採用（remote /schedule
  は見送り）。subagent Write が permission denied で全 6 PART を main session で
  直接 Write した経緯あり (settings.local.json では subagent 解除されない harness 仕様)。

<!-- ↓ 2026-05-25 D 案取り込み: worktree phase4-prompt-plan の v4.0.4 building 経緯。
     当該作業は main 側 5/22 Phase 5 ④ pivot (Claude Code skill 方式) を knowing せず
     並行進化したため code (build_prompts.py / guide v4.0.py 改修) は dead = drop。
     design insight (5-image reference attach / building layout determinism / cyclist
     pose 6 軸明示 等) は後続 worktree session で PART 1-6 .md へ手動転記予定。
     取り込みは PNG 6 件 + archive smoke json + registry generated 化のみ。 -->

- **2026-05-24 v4.0.4 building Stage 1 R9-R11 → R12 へ**：worktree image-prompt-plan で
  R9 (person template 同型化 7464 chars) NG → R10 (universal template + STYLE_BIBLE 厳守
  1700 chars) で R9 より悪化 → R11 (pipeline 改修で reference attachment 実装：
  nanobanana-client.mjs の referenceImages 引数 + generate-images-local.mjs の
  styleReferences loader / 1 件 word_学校 smoke) でも user 病院手動品質に達せず削除。
  text-only path の cross-vocab-type style coherence 限界（feedback 学び 6）・STYLE_BIBLE
  単一強制過剰（学び 7）・人物含めるべき（学び 8）・cross-ref aspect 別 specific（学び 9）
  を新規追記。R12 = 5 軸統合（universal template + reference attachment + per-building
  palette + people + aspect-specific cross-ref）へ。Phase 6 (Flux + 自作 LoRA 切替検討) を
  docs/MIGRATION_PLAN.md に追加・着手判断基準 4 条件 + spike スライス案あり。
  関連 memory：worktree 側 `project_v4_0_4_building_stage1.md` / 同 `feedback_nanobanana_prompt_design.md`（学び 1-9）。

- **2026-05-24 v4.0.4 building Stage 1 R12-R24 完了 / R23+R22 採用判定**：R12 (5 軸統合 + A/B
  比較) で text-only 限界実証 → R13-R20 で minimal palette + 3/4 isometric + low-angle + 人物
  variety を順次積層 → **R21 (Gemini ヒント取り込み: close-up framing + side wings off-frame
  + figures prominent 1/3) で学校採用候補確定** → R22 で残り 3 件展開 → R23 で道路色
  cream 統一 (GROUND/PAVEMENT rule 新設) → R24 (Gemini 3 軸: dramatic 3-point perspective
  + 街角 continuation + 大きな signboard + ref 切替 image_5=デパート R22) **失敗**：学校
  building の symmetric institutional form と dramatic perspective が衝突 → 学校 R23 採用
  継続判定。Stage 1 確定採用 = 学校 R23 / 大学 R23 / デパート R22 / 会社 R22。新規学び 10-12
  追記 (symmetric form vs perspective 衝突 / blank text 暴走 / per-vocab-type surroundings
  context)。**user 重要訂正**: 「single freestanding building」universal rule は誤り、大学・
  学校・デパート・会社では周辺 building/補助施設の描画が自然 → per-vocab-type で柔軟に。
  R25 (学校サイズ拡大 + 大学微修正: 木一貫 + 人物服 accent 衝突回避) を明日着手後 Stage 2
  (PROMPT_TEMPLATES["vocabulary_building"] guide 取り込み + invariants B hash 再計算 +
  build_prompts.py 対応) へ。当日 cap 60/60 上限到達・cost ~$2.32 (R12-R24 で 60 件)。
  関連 memory：worktree 側 `project_v4_0_4_building_stage1.md`（R12-R24 経緯 + universal
  rule 確定版 + per-vocab-type table）/ 同 `feedback_nanobanana_prompt_design.md` 学び 10-12。

- **2026-05-25 v4.0.4 building Stage 1 R25-R26 完了 / 採用 4 件確定 + 本番化 done**：R25
  (学校 = R23 + dominate frame 75%+ + blank text rule / 大学 = R23 + 全樹木 leafy summer +
  cyclist 服 warm yellow 禁止 + blank text rule + 副 academic building OK) で 2 件生成
  $0.0774。学校 R25 = user OK 採用、大学 R25 = cyclist 姿勢が「自転車に座っているだけ」の
  静的不自然姿勢で NG → R26 (R25 + cyclist 姿勢明示: 前傾 torso + 両手ハンドル + 両足ペダル on
  + dynamic motion + 7-head proportion + image_3 anchor) で再生成 $0.0387、user OK 採用。
  Stage 1 最終採用 = 学校 R25 / 大学 R26 / デパート R22 / 会社 R22。**本番化済**: 採用 4 PNG
  を production 名 cp (`data/images/word_学校.png` 他 3 件)、registry production entry 4 件
  update (generatedAt + promptRef + `_v4_0_4_adopted` 注記)。新規学び 13: cyclist 姿勢は
  default で不自然になりがち、6 軸明示 specify 必須 (a-f: torso 前傾 / 両手 grip / 両足 pedal
  on / frame size / 7-head proportion / motion line)。Universal rule A-1〜A-11 結晶
  (A-11 cyclist pose 新設)。**インシデント**: 最初の generate-images background run で
  `master_image_registry.json` (240KB) と `data/_meta/imagen_usage.json` (711B) が両方
  NULL bytes で破損 → Claude file-history `559ab4a0-...@v1` から registry 復元 + usage
  再構築 → foreground 再実行で成功。教訓: generate-images は必ず foreground 実行。
  当日 cap 3/62 (R25 2 件 + R26 1 件 = $0.1161)。次セッション = Stage 2 (guide 本体取り込み)
  / verification は build_prompts.py で生成した prompt と smoke prompt の no-API diff 方針。
  関連 memory：worktree 側 `project_v4_0_4_building_stage1.md` (R25-R26 + 本番化 + universal
  rule A-1〜A-11 確定版 update) / 同 `feedback_nanobanana_prompt_design.md` 学び 13 追加。

- **2026-05-25 v4.0.4 building Stage 2 完了 / guide 本体取り込み + invariants B hash 更新 +
  build_prompts.py building 対応 + no-API verification PASS**：Stage 1 結晶 (A-1〜A-11 +
  per-vocab-type table 4 採用) を guide に取り込み。
  (1) `prompts/master_prompt_design_guide_v4_0.py`:
  `BUILDING_BRAND_VOICE_REF` (image_1 = word_日本人.png) +
  `BUILDING_ARCHITECTURAL_REF` (image_5 = vocab_病院.jpg) +
  `BUILDING_UNIVERSAL_RULE_V4_0_4` (A-1〜A-11 multi-paragraph string) 新規。
  `BUILDING_CUES` 4 採用 entry (学校/大学/デパート/会社) に v4_0_4_* fields 17 種追加
  (vocab_type_desc / form_desc / signature / accent / accent_targets / label /
  signboard_location / surroundings_context / surroundings_block /
  framing_extra (学校 のみ) / activities_block / landscaping_block /
  type_relevant_refs (3 件 list))。
  `PROMPT_TEMPLATES["vocabulary_building"]` 全面書き直し (旧 ~1700 chars pale sky-blue
  full-bleed → 新 ~5100 chars universal rule + per-building 変数 + 5-image reference)。
  `BACKGROUND_BY_TYPE["building"]` 撤去 + `BUILDING_BACKGROUND_EXACT` constant 削除。
  (2) `scripts/invariants.mjs`: `BACKGROUND_BY_TYPE.building` 撤去 + C4/C5 で
  `type === 'building'` / `type !== 'building'` 例外撤去 + `promptGuideExpectedHashPrefix`
  を旧 `5338c98aab5d` → 新 `078fd0bd9ffe` に更新。
  (3) `scripts/build_prompts.py`: `render_building(g, entry)` 新規 (返り値 = (prompt,
  styleReferences) or (None, None) for unmigrated)、`main()` で buildings 反復 +
  `buildings_skipped` 追跡、`preflight()` に building branch (person 専用 full-body /
  area% / portrait lens チェック skip)、`PLACEHOLDERS` に v4.0.4 building 17 種追加、
  出力 JSON entry に `styleReferences: [path, ...]` (5 枚) 付与、出力 path
  `image_prompts_lesson01_v4_0_4.json` / `coveredVocabTypes: ["person","building"]` /
  `renderedCounts` + `buildingsSkipped` _meta 追加。
  (4) `npm run validate` PASS (B 078fd0bd9ffe / C 7 files including v4_0_4.json 15
  entries / D 55/55 PASS 3 WARN)。
  (5) **no-API Verification PASS**: `python scripts/build_prompts.py --lesson 1` で
  15 entries 生成 (12 person + 3 building = 学校 path / 大学 path / デパート path; 病院 +
  銀行 = 2 件 skip / 未移行)。学校 prompt len=10966 / 大学 len=11212 / デパート len=10323
  (smoke R25/R26 より長い：universal rule explicit セクション化 + image_5 cross-ref 強化
  のため)、styleReferences 全件 5 枚正しく付与、placeholder 全消失、
  [A-1]〜[A-11] / BUILDING SCALE EMPHASIS / BLANK TEXT SURFACES / image_5 病院 anchor
  全て含む。今後 lesson_02 以降の building (病院/銀行/駅/スーパー) も同型展開で対応可能。
  関連 memory：worktree 側 `project_v4_0_4_building_stage1.md` Stage 2 done section
  / B hash = 078fd0bd9ffe / 本セッション = WIP commit c9f70e0 (本番化) + 最終 commit
  (Stage 2)。次セッション = cleanup or 新 lesson 展開 or main ff-merge。

## 2026-05-26 (γ2 スライドデザイン大幅改修・user 視聴中)

- **slide_html.js + ruby_kuromoji.js を 12 ブロック改修** (試行・user 確定待ち):
  (1) ruby + ruby 隣接マージ削除 (の/な/を/が 密着解消・trial 同症状)
  (2) cover から vocab プレビュー削除 (3) 例文 ★代表例文 文字削除・画像 16:9 統一・anchor 440px に拡大・行間 loose
  (4) POS 線を examples[].highlight 明示時のみ (自動 は/が 分割廃止)
  (5) 文型ボックス削除 (タイトル重複) (6) vocab-presenter (grid+zoom) を全カード適用
  (7) スライド絶対配置 → 自然フロー + page スクロール (trial 方針移植・カード見切れ根絶)
  (8) teacher_photo / world_map placeholder を materialNeeds drive + Drag&Drop + ←/→ + ホバー時のみボタン
  (9) qa_card_pair: teacher_photo 時 N スロット横並び + 文型ボックス削除 (intro pedagogy)
  (10) ruby マージ 2 漢字閾値 (東西病院 → 東西+病院 で改行可能化)
  (11) slide padding 縮小 + 各カード画像 max-height 引き締め
  (12) Drag&Drop document-level preventDefault + file input を DOM 経由でクリック (detached input.click 黙殺対応)
- **user 要望 (次セッション宿題)**：
  (a) docs/AUTHORING_CHECKLIST.md を新設し、POS 線 (examples[].highlight) と
      intro_activity 素材 (flow[].materialNeeds[].type / count) を必須項目化。
  (b) lesson.targetStudentLevel (N5〜N1 enum) を新設し、生成側で kanji jlptLevel
      > targetStudentLevel の漢字を ふりがな強制 ON / 上級語マーク等。
- **教育的所見**：intro_activity の段階で文型ボックスを表示するのは elicit を壊す
  (先に答えを見せている形)。qa_card_pair の文型ボックス削除はこの原則に基づく恒久判断。
- **trial プロジェクト所見の移植 (read-only 参照のみ)**：
  - 文字間バランス: ruby + ruby の隣接詰めルールが助詞密着の元凶 (trial が先に発見)
  - スライド見切れ: 16:9 固定 / overflow:hidden を局所解除し container-type:inline-size +
    min-height:85vh + sticky 制御バー (creator-main は構造が違うため min-height: 100vh - 64px に翻訳)

## 2026-05-26 (γ2 視聴確定 + ローカル環境移行 Drive orphan pending 化)

- **γ2 全 12 ブロック user 視聴 OK** (5/26)。残り 2 件 (slide padding 縮小 + POS 線
  explicit-only) もコード解説後 OK 確定。NEXT_ACTIONS の「確定仕様 γ2」セクションへ移設。
- **ローカル環境移行発覚**：master_image_registry の 29 件 (ex_L01_*×15 + char_*×5
  + vocab/word_*×9) が Drive URL 残置。SA `sheets-reader@gen-lang-client-...` が
  Drive 上の files にアクセス権なし (smoke test で確認・2 ファイルとも File not found)。
- **方針確定 (user)**：Drive 救出ではなく **pending 化して skill pipeline で再生成**。
  `scripts/pend-drive-orphan-images.mjs` で 29 件 mutation 適用。
  - status=generated/approved → pending
  - imageUrl Drive URL → null
  - originalImageUrl で元 URL 保全 (traceability)
  - pendedReason='drive-orphaned', pendedAt=2026-05-26
- **次セッション着手**：X-a-4 SKILLS_MANUAL.md / X-b targetStudentLevel / X-c 例文+
  例文画像 revision (29 件再生成と統合)。X-c で ex_L01_* と char_* は強依存 (同一
  portrait) のため一括設計推奨。
- **DL script 試作したが削除**：`scripts/download-drive-images.mjs` を audio 版から
  作成・dry-run/smoke は動作確認したが Drive アクセス不可で本走不能 → YAGNI で削除。
  将来 Drive 共有が設定された場合は audio script から再生成可能。

## 2026-05-26 (X-d: 復習機能 + intro_activity fallback テンプレ修正)

- **復習機能 reviewSlide 拡充**: 旧来「パターンラベル一覧」だけで抽象的すぎたところを、canDo-item (「今日の目標」と同テンプレ) を再利用し「パターン文字列 (大) + 代表例文 (isAnchor:true 画像 + 文)」表示に変更。user 確定の最小仕様: pattern label プレフィックス・canDo・英訳ラベルは全部削除。
- **form.js review UI 追加**: 「復習する文型 (任意)」セクションを文型選択直下に新設。selectedReviewPatterns Set → buildSession() で session.review[] に出力。
- **intro_activity fallback バグ修正**: lesson_02 の intro_activity 6 個は catalog 上 5 種類の layout 名を持つが slide_html.js 側で未実装だったため `character_card_grid` にフォールバック → lesson_02.namedCharacters (鈴木・リン・キム・タノム・ケリー) 5 人画像が全スライドに暴露されていた問題。renderMaterialDrivenLayout を新設し materialNeeds[].type 駆動 (vocab card / 教師写真スロット / 補助スライドスロット) に変更。
- **pedagogy ルール再徹底**: 私 (Claude) が renderMaterialDrivenLayout 初版で `slideDisplay.patternDisplay` と `materialNeeds[].description` を学習者向けスライドに描画して user 指摘 → 削除。memory `feedback_intro_activity_no_pattern.md` の How to apply を一般化 (新規 layout 関数にも適用)。新規 memory `feedback_teacher_notes_not_on_learner_slides.md` を追加。
- **material-driven-layout 横並びバグ修正**: `slide-body` の `align-items: flex-start` で flex item の幅が auto → `.material-driven-layout` が内容に縮み、子の `vp-list` grid が 1 列化していた。`width: 100%` を明示して全幅展開。
- **テスト用 session 残置**: `data/session_l02_with_review.json` — lesson_02 全文型 teach + lesson_01 全文型 review。X-c などで再利用可能。

## 2026-05-26 (X-b 部分着地 — furigana 強制 ON は断念)

- **X-b 採用**: `lesson.targetStudentLevel` enum (N5..N1) 新設・lesson_01/02 に "N5" 付与・
  validator enum チェック追加・slide_html.js に vocab card 上級語 pill 機構
  (word.jlptLevel > targetStudentLevel で右上 orange pill 自動発火)。
- **X-b 断念**: 「ふりがな OFF トグル時、超過 kanji の furigana だけ残す」force class 機構
  (ruby class="force" + body.no-ruby ruby:not(.force) で CSS 制御)。lesson_02 「建物」
  (N4 kanji) で動作確認したが、トグル OFF で furigana が残らなかった。原因特定せず削除。
  考えられる要因: ブラウザキャッシュ・CSS specificity・kuromoji の opts 受け渡し・
  buildAdvancedKanjiSet が空 set を返したケース 等。優先度低 (user 判断) で全削除。
  関連削除: data/kanji_jlpt.json, scripts.lib の force 系コード, main.js loadKanjiJlpt。
  vocab pill 機構と targetStudentLevel メタは将来課のために残置。
- **将来 (b-3) 復活余地**: 生成プロンプト側で超過漢字を平易表現に置換するロジック
  (例文設計時に level 制約をかける) は別アプローチとして X-c 後に検討可能。
