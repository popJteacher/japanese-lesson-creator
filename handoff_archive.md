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
