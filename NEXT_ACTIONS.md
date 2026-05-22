# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**v4.0 取り込み完了**。worktree image-prompt-plan
で実装・実機検証 4 ラウンド 48 件 $1.86 で user OK → main へ ff-merge →
invariants B hash = `5338c98aab5d` 確認済 → 次は Phase 5 ④ 着手準備）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①／②／③：完了** ✅（catalog + import-lesson 配線済）
- **v3.12 取り込み：完了** ✅（旧 B hash = `2137a8e885ae`）
- **v3.13 BACKLOG migrate：完了** ✅（PHASE_BACKLOG に集約）
- **v4.0 マスタープロンプトガイド：実装・取り込み完了** ✅ 🆕
  - worktree image-prompt-plan で v4.0 主要改修（PART 1.1 国旗強化 / PART
    1.6 退役 / PART 1.7 簡素化 / PART 1.8 FACIAL_FEATURES / PART 1.9
    FLAG_SHAPE_DETAIL / PART 1.10 HEAD_BODY_PROPORTION）を完成
  - 全国共通 modern daily casual wear + 両手持ち国旗 pose に再設計
  - 実機検証：4 ラウンド・48 件 nanobanana 生成・$1.86 で user 視覚確認
    「とてもよくなりました」
  - main ff-merge 完了（commit `1a42cd4`） / invariants B hash =
    `5338c98aab5d` を `npm run validate` で確認 / data/images/word_*.png
    12 件（role 5 + nationality 7）を v4.0 で再生成済
- **Phase 5 ④：v4.0 完了済 → 着手可能** 🆕（例文 master prompt template
  新設 + build_prompts.py catalog 駆動拡張）
- **Phase 5 ⑤／⑥：未着手** — ④ 完了後
- **Phase 4 後 backlog**：v3.12 修正候補 1-6 は v4.0 で枠組み消失（retire
  予定・PHASE_BACKLOG 参照）。残り 436 件本生成 / 画像 QC 仕様 / scene-rich
  テンプレ A2 設計 等は残置。v4.0 由来「flag size 均一化」は user 手動で
  word_ベトナム人.png のみ差し替え → retire 済（2026-05-22）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（main 即時）：**なし**

v4.0 main 取り込み + docs 更新は完了。main 即時 active タスクはない。
次の active 化は **新たな worktree session で Phase 5 ④ を完了して ff-merge
してくる** とき。

---

## 並行起動可能：worktree で Phase 5 ④ 着手

新たな worktree session を立てて Phase 5 ④（例文 master prompt template
新設 + build_prompts.py catalog 駆動拡張）に着手可能。
**1 セッション = 1 worktree** の規律は維持。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時）：

```
cd .claude/worktrees/<new-worktree>
git merge --ff-only main      # v4.0 反映を取り込む
npm run validate              # baseline 確認（B hash = 5338c98aab5d v4.0 のはず）
# Phase 5 ④ 着手（docs/MIGRATION_PLAN.md § Phase 5 ④ 参照）
```

Phase 5 ④ 実装スコープ（`docs/MIGRATION_PLAN.md` § Phase 5 ④ を SSOT として参照）：

1. 例文画像用 master prompt template を v4.0 ガイドに新設
2. `scripts/build_prompts.py` を catalog 駆動に拡張（`--catalog` オプション・
   `data/vocab_catalog.json` を読んで例文画像プロンプトを生成）
3. lesson_02 例文 22 件の image_prompts を catalog 駆動で生成 → 実機検証

Phase 5 ④ 完了 → main ff-merge 後、別 worktree session で Phase 5 ⑤
（残 missing image 441 件 / audio 108 件のローカル本生成）に着手する分離が原則。

---

## ブロッカー

- Phase 5 ⑤ は Phase 5 ④ 完了に blocked。
- Phase 5 ⑥ は Phase 5 ⑤ 完了に blocked。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=5338c98aab5d(v4.0) / C=12×6 / D=55/55（3 WARN）PASS
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
node scripts/build-catalog.mjs [--dry-run | --verbose]
npm run import-lesson -- --lesson NN [--dry-run | --verbose]
python scripts/build_prompts.py --lesson 1       # v4.0 ガイド経由（--catalog 追加は Phase 5 ④）
```

参考（再実行不要）：
- Phase 5 ① 抽出 script：`archive/scripts_old/extract_goi_list_v1_phase5.mjs`
- raw source：`data/sources/goi_list_raw.pdf` / `data/sources/goi_list_raw.json`（17,908 entries）
- Phase 5 ② catalog：`data/vocab_catalog.json`（17,508 unique entries）
- v3.12 / v4.0 取り込み：merge SHA は `git log --merges` 不要（ff-only のため merge commit なし）
- v4.0 実装経緯：`handoff_archive.md` § 方針転換ログ 2026-05-22 / worktree
  memory `project_v4_0_pivot.md` / main memory `project_v4_0_pivot.md`
- v4.0 アーカイブ：`archive/prompts/master_prompt_design_guide_v3_12.py` +
  `archive/prompts/image_prompts_lesson01_v3_12.json`

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
