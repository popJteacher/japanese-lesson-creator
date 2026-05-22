# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**Phase 5 ④ 並行スコープ確定**：Option Y で
worktree (example-prompts) + 別 main session の 2 セッション並行。Q1=A
inline / Q2=A+B 並行 / Q3=B 全 vocab_type 一気拡張。lesson_02 vocab_types
JSON 不在発見・main Q2 B smoke 100 件に lesson_02 18 件含める設計に変更）

---

## 現在地

- **Phase 0／1／2／3／4：完了** ✅
- **Phase 5 ①／②／③：完了** ✅
- **v4.0 マスタープロンプトガイド：実装・取り込み完了** ✅
  - B hash `5338c98aab5d` / commit `1a42cd4`+`dcf76d5` / nationality 7 + role 5 PNG 生成済
  - `word_ベトナム人.png` のみ flag size 異常で手動再生成・差し替え済（`763a6d5`）
- **Phase 5 ④：並行スコープ確定（2026-05-22）** 🆕 — worktree + 別 main 2 セッション並行
- **Phase 5 ⑤／⑥：未着手** — ④ 完了後
- **Phase 4 後 backlog**：v3.12 修正候補 1-6 / flag size 均一化 retire 済。残り 436 件本生成 / 画像 QC 仕様 / scene-rich テンプレ A2 設計 等は残置
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（並行 2 系統）

### A. worktree (example-prompts) — 配線 + 例文 template v4.0 化

**担当**：`.claude/worktrees/example-prompts` 内 別 Claude Code セッション
**ブランチ**：`phase5-example-prompts`

スコープ（`docs/MIGRATION_PLAN.md` §Phase 5 ④ 改訂版を SSOT として参照）：

1. **Q1 A**: 既存 `PROMPT_TEMPLATES["example_sentence"]` template に v4.0 universal
   rules（PART 1.8 FACIAL_FEATURES / PART 1.10 HEAD_BODY_PROPORTION / FOOTWEAR
   等）を inline 追加して v4.0 標準化
2. **Q3 B**: `scripts/build_prompts.py` を **全 vocab_type 一気拡張**
   - 9 個の未配線 template を配線：`vocabulary_building` / `vocabulary_object_concrete`
     / `vocabulary_variant_grid` / `spatial_relation` / `demonstrative_kosoado`
     / `action_verb` / `abstract_concept` / `vocabulary_adjective` / `example_sentence`
   - 各 template の render 関数 + dispatch elif 追加
   - `--lesson NN` 入力（既存）+ `--catalog` モード（追加）両対応
3. **Q2 A**: lesson 参照済 catalog 転写
   - **`data/vocab_types_lesson02.json` は不在**（要新規作成は main の Q2 B 側）
   - worktree 側は **lesson_01 17 件のみ転写**（`data/vocab_types_lesson01.json` →
     `data/vocab_catalog.json` の該当 entries に vocab_type 書き込み）
   - 推奨：新規 `scripts/transcribe-lesson-vocab-types.mjs`（決定論・API 不要）
4. **invariants 更新**：`scripts/invariants.mjs` の B hash 行 + sColumnPattern（必要なら）
   を v4.0 例文 inline 反映後の hash に更新

完了条件：
- `python scripts/build_prompts.py --lesson 1` で lesson_01 全 17 件（person 12 + building 5）の prompt が `data/image_prompts_lesson01_v4_0.json` に出力される
- `npm run validate` PASS（B hash 更新済）
- 9 templates の dispatch + render 関数 完成
- catalog の lesson_01 17 件に vocab_type が書き込まれている

### B. main 別セッション（fresh） — Gemini 分類 + Phase 5 ④ catalog 完成

**担当**：このセッション終了後、user が起動する **新規 main Claude Code セッション**
（同じ main ディレクトリ・main ブランチで作業）

スコープ：

1. `scripts/classify-and-translate.mjs` を Gemini 2.5 Flash で
   vocab_type 分類できるよう拡張（既存 translate 系と並列の `--classify` モード）
2. **Smoke 100 件**：**lesson_02 18 件 + N5/N4 高頻度 82 件** で構成
   - lesson_02 18 件を必ず含めることで「user 品質レビュー」と「lesson_02 vocab_type 確定」を同時達成
   - smoke コスト：~$0.005
3. user 品質レビュー → 不足あれば prompt 調整 + 再 smoke
4. **本番 17,473 件** 分類（lesson_01 17 件は worktree A で確定済なので skip）
   - コスト見込み：**~$0.40-1.00**（Gemini 2.5 Flash + prompt caching）
5. catalog に書き戻し → `npm run validate` PASS

完了条件：
- `data/vocab_catalog.json` の全 17,508 件に vocab_type 付与（うち lesson_01 17 件は worktree 由来・lesson_02 18 件含む残り 17,491 件は Gemini 由来）
- WARN（confidence 低）件数を `data/_meta/vocab_type_warnings.json` に出力
- `python scripts/build_prompts.py --lesson 2` で lesson_02 vocab + 例文 28 件の prompt が出力可能になる

---

## 並行終了後の統合（Phase 5 ④ 全体完了）

A + B 両方が ff-merge されて main tip に合流した時点で Phase 5 ④ 完了。完了確認：

```
python scripts/build_prompts.py --lesson 1     # 17 件 PASS
python scripts/build_prompts.py --lesson 2     # vocab + 例文 28 件 PASS
npm run validate                                # invariants 全 PASS
```

その後：
- **Phase 5 ⑤ 着手可**：lesson_01 building 5 件 + lesson_02 全件を nanobanana で実機生成（コスト ~$1.32）
- **Phase 5 ⑥ 着手可**：GAS 入力系退役

---

## ブロッカー

- worktree A 着手：blocker なし（user が新規 Claude Code セッション起動するだけ）
- main B 着手：blocker なし（**本セッション終了後**、user が新規 main セッション起動）
- Phase 5 ⑤：Phase 5 ④（A + B 両方）完了に blocked
- Phase 5 ⑥：Phase 5 ⑤ 完了に blocked

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=5338c98aab5d(v4.0) / C / D PASS
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
python scripts/build_prompts.py --lesson 1     # v4.0 ガイド経由（Phase 5 ④ で全 vocab_type 対応 + --catalog 追加予定）
```

参考（再実行不要）：
- v4.0 アーカイブ：`archive/prompts/master_prompt_design_guide_v3_12.py` +
  `archive/prompts/image_prompts_lesson01_v3_12.json`
- worktree path：`c:/Users/kohn0/Desktop/japanese-lesson-creator-main/.claude/worktrees/example-prompts`
- Phase 5 ④ 設計議論ログ：main session 2026-05-22

人間タスク：
- **次セッション起動**（並行可・順不同）：
  1. worktree A：`cd .claude/worktrees/example-prompts && claude` で着手
  2. main B：新規 main session 起動で着手
- Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現
