# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（**Phase 5 ③ 完了** / `image-prompt-plan` worktree が v3.12 で一段落・**main 即時 active = v3.12 取り込み + v3.13 BACKLOG migration**）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①：完了** ✅ — Goi_List 全レベル抽出済（17,908 entries・UNKNOWN 0）
- **Phase 5 ②：完了** ✅ — `data/vocab_catalog.json` 確立（17,508 unique）／`classify-and-translate.mjs` を catalog 駆動化
- **Phase 5 ③：完了** ✅ — `scripts/import-lesson.mjs` 新規（GAS `seedLesson01.gs` vocab 部のローカル等価実装）。`npm run import-lesson -- --lesson 01` および `02` で **catalog + image + audio registries** に対し **totalDelta=0**（書き出しスキップ・冪等保証）。合成 lesson_99 で新規 entry 作成パスも動作確認済（成立 / 削除済）。例文配線は ⑤ で行う。
- **image-prompt-plan worktree：v3.12 完了** — `phase4-prompt-plan` ブランチが main から **7 commits ahead**。v3.12 person 品質修正（PHASE_BACKLOG「Phase 4 後 backlog」由来）。main 側に未取り込み。
- **Phase 5 ④：worktree pending（v3.13 後）** — `master_prompt_design_guide_v3_N.py` 例文 template + `build_prompts.py` catalog 駆動拡張
- **Phase 5 ⑤：main 次タスク（④ 完了待ち）** — 例文配線 + smoke 生成
- **Phase 5 ⑥：未着手** — GAS 入力系 3 系統 + Sheet/Drive 退役（⑤ 完了後）
- **Phase 4 後 backlog**：着手保留（残り 436 件本生成）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（main 即時）：v3.12 取り込み + v3.13 BACKLOG migration

**担当**：main 専属・worktree（image-prompt-plan）が一段落したことを受けての取り込みフロー
**前提**：image-prompt-plan worktree が `phase4-prompt-plan` で 7 commits ahead・clean

**やること（順序固定）：**

1. `git fetch` → `git log phase4-prompt-plan ^main` で取り込み対象 commit を確認
2. `git merge --ff-only phase4-prompt-plan` で v3.12 を main に取り込み
3. `npm run validate` PASS 確認（invariants B hash が v3.12 のものに更新されているはず）
4. `docs/PROMPT_GUIDE_v3_12.md` を読み、**v3.13 BACKLOG 4 件**を抽出
5. 抽出した 4 件を `docs/PHASE_BACKLOG.md` の「Phase 4 後 backlog」セクションに migrate
6. migration 完了後、`PROMPT_GUIDE_v3_12.md` から該当 4 件のセクションを削除
   （v3.12 ガイド本体は v3.12 完了状態として保全。BACKLOG は別ファイル一元管理）
7. NEXT_ACTIONS.md を「v3.12 取り込み済・v3.13 候補は PHASE_BACKLOG 経由」で書き直し
8. commit（feat(prompt-plan): v3.12 取り込み + v3.13 BACKLOG migration 等）

**完了条件**：`git status` clean・`npm run validate` PASS・`docs/PHASE_BACKLOG.md` に v3.13 候補 4 件 記載・`docs/PROMPT_GUIDE_v3_12.md` から migration 済セクション削除済。

**規模見積**：1 セッション。

**コスト**：$0（merge + docs 整理のみ）

---

## 並行起動可能：image-prompt-plan worktree で v3.13 着手

main の v3.12 取り込みが完了したら、user が worktree セッションを別途立てて
v3.13 を進行可能。**1 セッション = 1 worktree** の規律は維持。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時 参照）：

```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main   # main の v3.12 merge + BACKLOG migration を取り込む
npm run validate           # baseline 確認
# v3.13 着手（#1 が即着手しやすい・docs/PHASE_BACKLOG.md 参照）
```

**Phase 5 ④（例文 template + build_prompts.py catalog 駆動拡張）は v3.13 後に
同じ worktree で着手**（`master_prompt_design_guide_v3_N.py` / `build_prompts.py` を
触るため worktree 専属）。詳細は `docs/MIGRATION_PLAN.md` § Phase 5 ④ 参照。

---

## ブロッカー

- Phase 5 ⑤ は ④ 完了に blocked（worktree 側の v3.13 + Phase 5 ④ 進捗待ち）。

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
