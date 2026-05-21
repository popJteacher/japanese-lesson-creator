# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（**Phase 5 ① 完了** / `data/sources/goi_list_raw.json` 全 17,908 entries 凍結 / 抽出 script は archive 移管 / **Phase 5 ② に着手**）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①：完了** ✅ — Goi_List 全レベル抽出済（N5 422 / N4 788 / N3 2286 / N2 12754 / N1 1548 = 17,908 entries・UNKNOWN 0）
- **Phase 5 ②：着手中（active）** — `vocab_catalog.json` の確立
- **Phase 5 ③〜⑥**：未着手（順序依存・MIGRATION_PLAN § Phase 5 参照）
- **Phase 4 後 backlog**：着手保留（v3.12 person 品質修正 1-6 + 残り 436 件本生成）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active：Phase 5 ② — `vocab_catalog.json` の確立

**担当**：main 専属・プラン非依存
**依存**：Phase 5 ① 完了済 ✅

**やること：**

1. `scripts/build-catalog.mjs` 新規作成
   - 入力：`data/sources/goi_list_raw.json`（① 出力）＋ 既存 `data/lessons/lesson_01.json` / `lesson_02.json` の `vocabulary` 配列
   - スキーマ：source-agnostic（dedup キー = `word + reading`、`sourceIds[]` で複数ソース受入、`lessonRefs[]` で参照課を保持）
   - 出力：`data/vocab_catalog.json`
2. `scripts/classify-and-translate.mjs` を catalog 入力に切替（現状は何を入力にしているか先に grep して確認）
3. `npm run validate` で invariants が壊れていないこと確認

**完了条件**：`data/vocab_catalog.json` が SSOT 化・既存 lesson_NN.json と矛盾しない・`npm run validate` PASS。

**規模見積**：1-2 セッション。

**コスト**：$0（local 処理）

---

## 並行起動可能：Phase 5 ④（worktree） — 例文 master prompt template + build_prompts.py 拡張

main で ② 進行中に user が worktree セッションを別途立てれば並行可能。
**1 セッション = 1 worktree** の規律は維持（同時に main と worktree を同一セッションで触らない）。

worktree でやること（詳細は `docs/MIGRATION_PLAN.md` § Phase 5 ④）：

- `master_prompt_design_guide_v3_N.py` に `vocabulary_example_sentence` template 新設
- `build_prompts.py` を catalog 駆動 + 全 vocab_type 対応に拡張
- 例文 5 件 sample プロンプトを `data/image_prompts_lesson02_v3_N.json` に出力して人間レビュー
- **v3.12 person 品質修正 1-6 は別作業として PHASE_BACKLOG 残置**（混ぜない）

worktree セッション開始手順は `docs/WORKFLOW.md` 参照。

---

## ブロッカー

- なし。

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
python scripts/build_prompts.py --lesson 1       # worktree で実行（Phase 5 ④ で --catalog 追加予定）
```

参考（Phase 5 ① は完了・再実行不要）：
- 抽出 script は `archive/scripts_old/extract_goi_list_v1_phase5.mjs` に凍結済
- raw source：`data/sources/goi_list_raw.pdf`（1.58 MB）/ `data/sources/goi_list_raw.json`（5.44 MB・17,908 entries）

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
