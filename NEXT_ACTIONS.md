# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**v3.12 取り込み完了 + v3.13 BACKLOG migrate 完了**。
main 側は **待ち状態**：次の active 化は worktree が v3.13 → Phase 5 ④ を完了して
ff-merge してくるか、user が Phase 5 ⑤⑥ の前倒し判断を下したとき）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①：完了** ✅ — Goi_List 全レベル抽出済（17,908 entries・UNKNOWN 0）
- **Phase 5 ②：完了** ✅ — `data/vocab_catalog.json` 確立（17,508 unique）／`classify-and-translate.mjs` を catalog 駆動化
- **Phase 5 ③：完了** ✅ — `scripts/import-lesson.mjs` 新規。lesson_01 / 02 で totalDelta=0（書き出しスキップ・冪等保証）。例文配線は ⑤ で実施。
- **v3.12 取り込み：完了** ✅ — `phase4-prompt-plan` を main に ff-merge（worktree で main 上に rebase 後）。invariants B hash = `2137a8e885ae`（v3.12）に更新済・validate PASS。
- **v3.13 BACKLOG migrate：完了** ✅ — `docs/PROMPT_GUIDE_v3_12.md` 末尾 handoff の 4 件（#1〜#4）を `docs/PHASE_BACKLOG.md` § 「v3.13 マスタープロンプトガイド修正候補」へ migrate。ガイド本体からは該当セクション削除済（v3.12 完了状態として保全）。
- **Phase 5 ④：worktree pending** — `master_prompt_design_guide_v3_N.py` 例文 template + `build_prompts.py` catalog 駆動拡張（v3.13 と並行 or 後着手）
- **Phase 5 ⑤：main 次タスク（④ 完了待ち）** — 例文配線 + smoke 生成
- **Phase 5 ⑥：未着手** — GAS 入力系 3 系統 + Sheet/Drive 退役（⑤ 完了後）
- **Phase 4 後 backlog**：着手保留（v3.12 修正候補 1-6 の本適用は v3.12 取り込みで完結。残り 436 件本生成 / v3.13 候補 4 件 / 画像 QC 仕様 / scene-rich テンプレ A2 設計 等）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（main 即時）：**なし**

main 側に即時 active タスクはない。次の active 化は以下のいずれか：

1. **worktree が v3.13 + Phase 5 ④ を完了して ff-merge してくる**
   → main で取り込み後、Phase 5 ⑤（例文配線 + smoke 生成）を active 化
2. **user が Phase 5 ⑥ を前倒しで主体的に進めたい場合**
   → ⑤ を待たず ⑥（GAS 退役）の準備に着手可能（ただし依存関係要再確認）

どちらの待ちかは user 判断。

---

## 並行起動可能：image-prompt-plan worktree で v3.13 着手

worktree セッションを別途立てて v3.13 を進行可能。
**1 セッション = 1 worktree** の規律は維持。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時 参照）：

```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main   # main の v3.12 merge + v3.13 BACKLOG migrate を取り込む
npm run validate           # baseline 確認（B hash = 2137a8e885ae のはず）
# v3.13 着手（#1 GARMENT_REGISTER_CONSISTENCY_RULE が最優先・docs/PHASE_BACKLOG.md 参照）
```

**Phase 5 ④（例文 template + build_prompts.py catalog 駆動拡張）は v3.13 後に
同じ worktree で着手**（`master_prompt_design_guide_v3_N.py` / `build_prompts.py` を
触るため worktree 専属）。詳細は `docs/MIGRATION_PLAN.md` § Phase 5 ④ 参照。

v3.13 と Phase 5 ④ を 1 worktree セッションに混ぜるか分けるかは user 判断
（混ぜると invariants B hash 更新が 1 回で済むが、commit slice が大きくなる）。

---

## ブロッカー

- Phase 5 ⑤ は ④ 完了に blocked（worktree 側の v3.13 + Phase 5 ④ 進捗待ち）。
- Phase 5 ⑥ は ⑤ 完了に blocked（vocab + 例文の両方が catalog + registry 経由で動くこと確認後に GAS 退役）。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=2137a8e885ae / C=12×5 / D=55/55（3 WARN）PASS
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
- v3.12 取り込み：merge SHA は `git log --merges` 不要（ff-only のため merge commit なし）。worktree 7 commits（`v3.12 ガイド本体` → `v3.12 シリーズ パッチノート + v3.13 backlog handoff`）が main tip にそのまま乗っている形。

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
