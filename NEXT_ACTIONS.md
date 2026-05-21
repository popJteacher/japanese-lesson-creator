# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（**Phase 5 ③ 完了** / `scripts/import-lesson.mjs` 新設・lesson_01/02 で冪等同値検証 PASS / **main 次タスクは Phase 5 ⑤、ただし worktree の ④ 完了待ち**）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①：完了** ✅ — Goi_List 全レベル抽出済（17,908 entries・UNKNOWN 0）
- **Phase 5 ②：完了** ✅ — `data/vocab_catalog.json` 確立（17,508 unique）／`classify-and-translate.mjs` を catalog 駆動化
- **Phase 5 ③：完了** ✅ — `scripts/import-lesson.mjs` 新規（GAS `seedLesson01.gs` vocab 部のローカル等価実装）。`npm run import-lesson -- --lesson 01` および `02` で **catalog + image + audio registries** に対し **totalDelta=0**（書き出しスキップ・冪等保証）。合成 lesson_99 で新規 entry 作成パスも動作確認済（成立 / 削除済）。例文配線は ⑤ で行う。
- **Phase 5 ④：worktree active（並行起動可能）** — `master_prompt_design_guide_v3_N.py` 例文 template + `build_prompts.py` catalog 駆動拡張
- **Phase 5 ⑤：main 次タスク（④ 完了待ち）** — 例文配線 + smoke 生成
- **Phase 5 ⑥：未着手** — GAS 入力系 3 系統 + Sheet/Drive 退役（⑤ 完了後）
- **Phase 4 後 backlog**：着手保留（v3.12 person 品質修正 1-6 + 残り 436 件本生成）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active：main 側

**主タスクなし。** Phase 5 ⑤ は worktree の ④ 完了待ちで blocked。

main 側で実行可能な選択肢（user 判断・優先度低）：

- **A.** Phase 4 後 backlog（v3.12 person 品質修正 1-6）に着手 — `docs/PHASE_BACKLOG.md` 参照
- **B.** Phase 3 後 backlog（音声自然さチェック・Gemini 2.5 audio path）に着手
- **C.** Phase 5 ⑤ の事前準備（要件再確認・データ構造下調べのみ・実装は ④ 完了後）

A/B/C いずれも user に確認してから着手すること（active タスクとして固定はしない）。

---

## 並行起動可能：Phase 5 ④（worktree）

main の ③ が完了したので、user が worktree セッションを別途立てれば独立に進行可能。
**1 セッション = 1 worktree** の規律は維持。

worktree でやること（詳細は `docs/MIGRATION_PLAN.md` § Phase 5 ④）：

- `master_prompt_design_guide_v3_N.py` に `vocabulary_example_sentence` template 新設
- `build_prompts.py` を catalog 駆動 + 全 vocab_type 対応に拡張
- 例文 5 件 sample プロンプトを `data/image_prompts_lesson02_v3_N.json` に出力して人間レビュー
- **v3.12 person 品質修正 1-6 は別作業として PHASE_BACKLOG 残置**（混ぜない）

worktree セッション開始手順は `docs/WORKFLOW.md` 参照。

---

## ブロッカー

- Phase 5 ⑤ は ④ 完了に blocked（worktree 側の進捗待ち）。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=a79e54a29e51 / C=12×4 / D=55/55（3 WARN）PASS
npm run missing-assets             # 現状 image 441 / audio 108（Phase 5 ⑤ 完了後に減少）
npm run check-sa                   # Sheets API 疎通
npm run check-tts-sa               # Cloud TTS API 疎通
npm run check-ffmpeg               # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key           # AI Studio ListModels（Imagen 4 系）
npm run check-nanobanana-key       # AI Studio ListModels（Nano Banana）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run generate-images -- --prompts <path> [--print-prompts | --sync-only | --dry-run]
                                  [--backend nanobanana|imagen4]  # 既定 nanobanana
                                  [--limit N] [--max-images N] [--force]
                                  [--out <md>]
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs        # 実機 1 枚＝$0.04 (Imagen 4)
node scripts/_nanobanana-smoke.mjs    # 実機 1 枚＝~$0.0387 (Nano Banana)
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
                                  # Phase 5 ② で catalog 駆動化（vocab_catalog.json を参照）
node scripts/build-catalog.mjs [--dry-run | --verbose]
                                  # catalog を再構築する時のみ
npm run import-lesson -- --lesson NN [--dry-run | --verbose]
                                  # Phase 5 ③ で新設。lesson_NN.json → catalog + registry 配線（vocab のみ）
                                  # 既存 entry に対しては totalDelta=0 で書き出しスキップ（冪等）
python scripts/build_prompts.py --lesson 1       # worktree で実行（Phase 5 ④ で --catalog 追加予定）
```

参考（再実行不要）：
- Phase 5 ① 抽出 script：`archive/scripts_old/extract_goi_list_v1_phase5.mjs`
- raw source：`data/sources/goi_list_raw.pdf`（1.58 MB）/ `data/sources/goi_list_raw.json`（5.44 MB・17,908 entries）
- Phase 5 ② catalog：`data/vocab_catalog.json`（9.85 MB・17,508 unique entries・schemaVersion 1.0）
- Phase 5 ③ importer：`scripts/import-lesson.mjs`（GAS `seedLesson01.gs` vocab 部の冪等ローカル実装）

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
