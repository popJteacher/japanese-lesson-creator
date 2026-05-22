# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**v3.13 → v4.0 pivot 確定**。worktree image-prompt-plan
で「アジア／西洋アシンメトリ」問題が論点化し、modern wear + 国旗強化への大方針
転換が決定。main 側 docs 整理完了 → 次は worktree session で v4.0 着手フェーズ）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①／②／③：完了** ✅（catalog + import-lesson 配線済）
- **v3.12 取り込み：完了** ✅（invariants B hash = `2137a8e885ae`）
- **v3.13 BACKLOG migrate：完了** ✅（PHASE_BACKLOG に集約）
- **v3.13 → v4.0 pivot：確定（docs 整理完了 2026-05-22）** 🆕
  - 経緯：worktree image-prompt-plan で v3.13 #1 着手前にアジア／西洋
    アシンメトリ問題（日中韓越のみ伝統服 → exoticization リスク + modern
    reality との乖離）が論点化。逆方向の simplification として全国
    modern daily casual wear + 国旗視認性強化へ pivot。
  - 反映済：`docs/MIGRATION_PLAN.md` § v4.0 新設 / `docs/PHASE_BACKLOG.md`
    v3.13-#1/#3 retire・#2 位置づけ変更・#4 のみ独立保持 /
    `handoff_archive.md` 方針転換ログに 1 行追記
- **v4.0 worktree 実装：未着手** — main の docs 整理完了で worktree 側
  の着手準備が整った
- **Phase 5 ④：v4.0 完了が prerequisite** — v4.0 → Phase 5 ④ → Phase 5 ⑤ → Phase 5 ⑥ の順序
- **Phase 5 ⑤／⑥：未着手** — Phase 5 ④ 完了後
- **Phase 4 後 backlog**：v3.12 修正候補 1-6 は v4.0 で枠組み消失見込み
  （v4.0 完了後に retire 予定）。残り 436 件本生成 / 画像 QC 仕様 /
  scene-rich テンプレ A2 設計 等は残置
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（main 即時）：**なし**

main 側の docs 整理（MIGRATION_PLAN / PHASE_BACKLOG / handoff_archive /
NEXT_ACTIONS）は完了。main 即時 active タスクはない。
次の active 化は **worktree が v4.0 を完了して ff-merge してくる** とき。

---

## 並行起動可能：image-prompt-plan worktree で v4.0 着手

worktree session を立てて v4.0 マスタープロンプトガイドの実装に着手可能。
**1 セッション = 1 worktree** の規律は維持。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時
＋ 本 NEXT_ACTIONS の指示）：

```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main       # v4.0 phase + v3.13 retire 反映を取り込む
npm run validate               # baseline 確認（B hash = 2137a8e885ae v3.12 のはず）
# v4.0 着手（docs/MIGRATION_PLAN.md § v4.0 マスタープロンプトガイド major-version 改修 参照）
```

worktree 側の実装スコープ（`docs/MIGRATION_PLAN.md` § v4.0 全文を SSOT として参照）：

1. `prompts/master_prompt_design_guide_v4_0.py` 新規作成（v3.12 派生 +
   PART 1.6 退役 + PART 1.7 国旗強化 + PART 1.8 不要）
2. `scripts/build_prompts.py` の `PERSON_NATIONALITY_HINTS` を全国 modern
   daily casual に書き直し（`TRADITIONAL_DRESS_PATTERN_LOOKUP` 退役）
3. `PROMPT_TEMPLATES["vocabulary_person"]` の pose / framing を国旗手持ち
   （d）対応に改修
4. `scripts/invariants.mjs` の B hash と promptGuide path を v4.0 に更新
5. `archive/prompts/` に v3.12 系を退避（v3_12.py + image_prompts JSON）
6. **視認性検証フロー**：d 案（手持ち国旗）で 7 国籍カード生成
   → 日中韓 3 か国が一目区別できるか目視確認 → 不足なら c 案（背景 banner）
   に切替 → 確定したら lesson_01 全 12 件再生成
7. 想定コスト：$1.00 前後（d 試行 $0.27 + 必要なら c 試行 $0.27 + 本生成 $0.46）

v4.0 完了 → main ff-merge 後、別 worktree session で Phase 5 ④（例文
template 新設 + build_prompts.py catalog 駆動拡張）に着手する分離が原則。
混ぜることは技術的に可能だが、スライス境界が崩れるため非推奨。

---

## ブロッカー

- Phase 5 ④ は v4.0 完了に blocked（v4.0 ガイドで動くため）。
- Phase 5 ⑤ は ④ 完了に blocked。
- Phase 5 ⑥ は ⑤ 完了に blocked。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=2137a8e885ae(v3.12) / C=12×5 / D=55/55（3 WARN）PASS
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
python scripts/build_prompts.py --lesson 1       # worktree で実行（v4.0 で --catalog 追加予定は Phase 5 ④）
```

参考（再実行不要）：
- Phase 5 ① 抽出 script：`archive/scripts_old/extract_goi_list_v1_phase5.mjs`
- raw source：`data/sources/goi_list_raw.pdf` / `data/sources/goi_list_raw.json`（17,908 entries）
- Phase 5 ② catalog：`data/vocab_catalog.json`（17,508 unique entries）
- v3.12 取り込み：merge SHA は `git log --merges` 不要（ff-only のため merge commit なし）
- v4.0 pivot 経緯：`handoff_archive.md` § 方針転換ログ 2026-05-22 / worktree
  memory `project_v4_0_pivot.md` / main memory `project_v4_0_pivot.md`

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
