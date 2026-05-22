# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**Phase 5 ④ worktree A 完了**。Q1 A / Q2 A /
Q3 B 全実装済。`--lesson 1` で 32 件出力（vocab 17 + 例文 15）・preflight 全
PASS / `--catalog` で 17 件出力（main Q2 B 未完のため 17,491 件 skip）/
invariants A/B/C PASS。B hash `5338c98aab5d` → **`891b73f5ae2d` (v4.1)**）

---

## 現在地

- **Phase 0／1／2／3／4：完了** ✅
- **Phase 5 ①／②／③：完了** ✅
- **v4.0 マスタープロンプトガイド：実装・取り込み完了** ✅
- **Phase 5 ④ worktree A：完了** ✅ 🆕
  - Q1 A: `PROMPT_TEMPLATES["example_sentence"]` に v4.0 PART 1.8 FACIAL_FEATURES /
    PART 1.10 HEAD_BODY_PROPORTION / FOOTWEAR_RULE を inline → v4.0 vocabulary_person と
    挙動統一（template 自体に規律を焼き込む方式）
  - Q2 A: `scripts/transcribe-lesson-vocab-types.mjs`（決定論・API 不要）新規作成 →
    `data/vocab_types_lesson01.json` の vocab_type を `data/vocab_catalog.json` の
    lesson_01 該当 17 件（person 12 + building 5）に転写済・idempotent
  - Q3 B: `scripts/build_prompts.py` を全 vocab_type + 例文に拡張
    - 9 個の render 関数 + dispatch (`render_vocab_entry` / `render_example_sentence`)
    - `--lesson NN`（任意 NN）+ `--catalog` 両モード対応
    - preflight を vocab_type aware に書き換え（vocabulary_building は pale sky-blue BG・
      他は cream off-white BG / 残存 placeholder の汎用検出に変更）
  - invariants 更新：`scripts/invariants.mjs` の B hash `5338c98aab5d` →
    `891b73f5ae2d` に更新
- **Phase 5 ④ main B：未着手** — main 別 fresh セッションが要起動
- **Phase 5 ⑤／⑥：未着手** — ④ 全体完了後
- **Phase 4 後 backlog**：残置（438 件本生成 / 画像 QC 仕様 / scene-rich テンプレ A2 設計）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**。残存 GAS は手動実行用
`seedLesson01` / `extractFromGoiList` / `importFromLessonJson` の 3 系統のみ
（Phase 5 ⑥ で退役予定）。

---

## active：main B（fresh セッション起動待ち）

worktree A が完了したので、Phase 5 ④ 残りは **main B のみ**：

**スコープ**（`docs/MIGRATION_PLAN.md` §Phase 5 ④ 参照）：

1. `scripts/classify-and-translate.mjs` を Gemini 2.5 Flash で vocab_type 分類できるよう拡張
2. **Smoke 100 件**：lesson_02 18 件 + N5/N4 高頻度 82 件で構成（~$0.005）
3. user 品質レビュー → 不足あれば prompt 調整 + 再 smoke
4. **本番 17,473 件** 分類（lesson_01 17 件は worktree A 確定済なので skip）（~$0.40-1.00）
5. catalog 書き戻し → `npm run validate` PASS

完了条件：
- `data/vocab_catalog.json` の全 17,508 件に vocab_type 付与
  （うち lesson_01 17 件は worktree A 由来・残り 17,491 件は Gemini 由来）
- WARN（confidence 低）件数を `data/_meta/vocab_type_warnings.json` に出力
- `python scripts/build_prompts.py --lesson 2` で lesson_02 vocab + 例文 28 件分の prompt 出力可能になる

main B 着手手順：新規 main session 起動 → `git pull` でこの worktree A の ff-merge 反映を取り込む → スコープ着手。

---

## ブロッカー

- worktree A → main ff-merge：このセッション終了時に user が ff-merge 実行
- main B 着手：worktree A ff-merge 取り込み後、新規 main session で着手可
- Phase 5 ⑤：Phase 5 ④（A + B 両方）完了に blocked
- Phase 5 ⑥：Phase 5 ⑤ 完了に blocked

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=891b73f5ae2d(v4.1) / C / D
                                   # ※D は本 worktree 環境で ffprobe 未導入のため 0/55 PASS
                                   #   になる。main 側または ffmpeg 導入済 worktree で再確認
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
node scripts/transcribe-lesson-vocab-types.mjs [--dry-run | --verbose]    # Phase 5 ④ Q2 A (worktree 専属)
npm run import-lesson -- --lesson NN [--dry-run | --verbose]
python scripts/build_prompts.py --lesson NN          # vocab + 例文 dispatch (Phase 5 ④ Q3 B)
python scripts/build_prompts.py --catalog            # vocab_catalog 全件 dispatch (Phase 5 ④ Q3 B)
```

参考（再実行不要）：
- worktree A 出力：`data/image_prompts_lesson01_v4_0.json`（32 件 = person 12 + building 5 + 例文 15）
- worktree A 出力 catalog mode：`data/image_prompts_catalog_v4_0.json`（17 件・main Q2 B 完了で増える）
- v4.1 hash 計算根拠：`example_sentence` template に PART 1.8 / 1.10 / FOOTWEAR を inline
- worktree path：`c:/Users/kohn0/Desktop/japanese-lesson-creator-main/.claude/worktrees/example-prompts`
- Phase 5 ④ 設計議論ログ：main session 2026-05-22

人間タスク：
- worktree A → main の ff-merge 実行（このセッション終了後）
- ff-merge 後、main fresh session を起動して Phase 5 ④ main B 着手
- Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現
