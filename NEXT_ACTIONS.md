# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-23（**Phase 5 ④' skill 実装完了 in worktree**：6-PART
ガイド reorganize / `.claude/skills/generate-image-prompt.md` / preflight 切出 /
invariants B' manifest hash check / lesson_01 smoke PASS。main への ff-merge と
Track 1 main B 残 8,149 件 resume + 人間タスク 2 件が残）

---

## 現在地

- **Phase 0／1／2／3／4：完了** ✅
- **Phase 5 ①／②／③：完了** ✅
- **v4.0 → v4.1 マスタープロンプトガイド (旧 .py 形式)：保全** ✅
  - B hash `891b73f5ae2d`（build_prompts.py が dead code 化されるまで継続）
- **Phase 5 ④ worktree A：完了 + 部分 deprecate** ✅⚠️
- **Phase 5 ④ main B：53% 完了**（catalog 9,359 件 typed・残 8,149 件は RPD リセット待ち）
- **Phase 5 ④' worktree skill 実装：完了** 🆕✅
  - 新 SSOT：`prompts/guide/part1-6_*.md`（6 ファイル・計 3,591 行）
  - manifest hash `1ca2f57ad927`（invariants B' で機械検証）
  - skill 定義：`.claude/skills/generate-image-prompt.md`（4 mode：daily-pull / lesson / explicit / chain）
  - preflight 切出：`scripts/lib/prompt_preflight.py`（CLI + Python import 両対応）
  - build_prompts.py：preflight を新 SSOT から import に書換（dead code 化中も同じ規律）
  - lesson_01 smoke：医者 prompt 1 件 → preflight PASS / `data/image_prompts_skill.json` 1 entry
  - 日次起動 wrapper：`scripts/schedule-daily-pull.bat`（人間が schtasks 登録）
- **Phase 5 ⑤／⑥：着手可**（worktree merge + Track 1 完了後）
- **Phase 4 後 backlog**：残置
- **Phase 3 後 backlog**：着手保留

生存中の GAS 自動 trigger：**0 件**。残存 GAS は手動実行用 3 系統のみ。

---

## active（独立 2 track + 人間タスク）

### Track 1：main session — main B 残 8,149 件 resume

**着手タイミング**：Tier 1 RPD 10K リセット後（PT 0:00 = JST 17:00）。

```
node scripts/classify-and-translate.mjs --classify
# typed 済 entry は自動 skip。残り 8,149 件のみ処理。
```

所要 ~30 分・~$1.50。`--concurrency 4` 推奨 / 2 日跨ぎ前提。

**完了条件**：catalog 全 17,508 件に vocab_type 付与 / WARN を `data/_meta/vocab_type_warnings.json` 出力 / `npm run validate` PASS。

### Track 2：worktree → main ff-merge

**着手タイミング**：いつでも可（Track 1 と独立）。

```
cd c:/Users/kohn0/Desktop/japanese-lesson-creator-main
git fetch && git merge --ff-only phase5-skill-implementation
```

merge 後 `npm run validate` で B (`891b73f5ae2d`) + B' (`1ca2f57ad927`) + C + D PASS を確認。

---

## 人間タスク（worktree merge 後の確認・任意）

1. **schtasks 登録**（daily 20 件自動起動）：
   ```
   schtasks /create /tn "ClaudeDailyPromptPull" /tr "\"c:\Users\kohn0\Desktop\japanese-lesson-creator-main\scripts\schedule-daily-pull.bat\"" /sc daily /st 09:00
   ```
   初回手動実行 `scripts\schedule-daily-pull.bat` で `claude -p "/generate-image-prompt mode=daily-pull limit=20"` の skill discover 挙動を確認。動かなければ bat 内の fallback 行に切替。
2. **明日 RPD リセット後**に main session で B resume コマンド実行（Track 1）。

---

## 両 track + 人間タスク完了後

```
npm run validate                          # B + B' + C + D PASS
node scripts/classify-and-translate.mjs --classify --dry-run  # 残 0 件確認
# skill 経由で lesson_01 / lesson_02 prompt 生成 PASS
```

その後：
- **Phase 5 ⑤ 着手可**：lesson_02 例文 5 件 smoke 生成 + import-lesson.mjs に skill 接続
- **Phase 5 ⑥ 着手可**：GAS 入力系 3 系統退役

---

## ブロッカー

- Track 1（main B resume）：**Tier 1 RPD 10K リセット待ち**（PT 0:00 = JST 17:00）
- Track 2（worktree merge）：blocker なし（user 任意タイミング）
- Phase 5 ⑤：Track 1 + Track 2 + 人間タスク #1 完了に blocked
- Phase 5 ⑥：Phase 5 ⑤ 完了に blocked

---

## 将来規律（user 確認済）

- **新規 word list からの語彙追加時の vocab_type 分類**：将来別書籍 / 別ソースから catalog に語彙追加するときは Gemini API ではなく `/classify-vocab-type` skill 方式に切替（memory `feedback-skill-vs-api-for-classification`）。
- **課マスター作成時の画像必須**：新規 lesson_NN.json 作成後、`/generate-image-prompt mode=lesson --lesson NN` で未生成 word の prompt を補充（[skill spec](.claude/skills/generate-image-prompt.md) Step 2 `mode = lesson`）。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D PASS
npm run missing-assets             # 現状 image 441 / audio 108
npm run check-sa                   # Sheets API 疎通
npm run check-tts-sa               # Cloud TTS API 疎通
npm run check-ffmpeg               # ffmpeg / ffprobe 疎通
npm run check-imagen-key           # Imagen 4
npm run check-nanobanana-key       # Nano Banana
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run generate-images -- --prompts <path> [--print-prompts | --sync-only | --dry-run]
                                  [--backend nanobanana|imagen4]
                                  [--limit N] [--max-images N] [--force]
                                  [--out <md>]
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs        # 実機 1 枚＝$0.04 (Imagen 4)
node scripts/_nanobanana-smoke.mjs    # 実機 1 枚＝~$0.0387 (Nano Banana)
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]   # 既存 Gemma lesson-driven
node scripts/classify-and-translate.mjs --classify [--smoke|--limit N|--force|--concurrency N|--dry-run]  # Phase 5 ④ B catalog-driven Gemini 2.5 Flash
node scripts/build-catalog.mjs [--dry-run | --verbose]
node scripts/transcribe-lesson-vocab-types.mjs [--dry-run | --verbose]   # worktree A 由来
npm run import-lesson -- --lesson NN [--dry-run | --verbose]

# Phase 5 ④' skill 経路（新規）
/generate-image-prompt                          # mode=daily-pull limit=20 (省略時 default)
/generate-image-prompt mode=lesson --lesson NN  # 課マスター内 未生成 word 全件
/generate-image-prompt mode=explicit --words 医者,会社員
/generate-image-prompt mode=explicit --words 医者 chain=true   # 画像生成まで連結
echo '{"text":"...","template_kind":"person","word":"..."}' | python scripts/lib/prompt_preflight.py
scripts\schedule-daily-pull.bat               # daily 20 件 batch wrapper（schtasks 経由想定）

# ↓ build_prompts.py（dead code 化中・preflight import は SSOT へ書換済）
python scripts/build_prompts.py --lesson NN          # lesson_01 検証用に残置
python scripts/build_prompts.py --catalog            # 同上
```

参考（再実行不要）：
- 決定論版 lesson_01 出力：`data/image_prompts_lesson01_v4_0.json`（32 件・skill 品質比較用）
- skill smoke 出力：`data/image_prompts_skill.json`（1 entry / 医者）
- v4.0 アーカイブ：`archive/prompts/master_prompt_design_guide_v3_12.py`
- 旧 worktree path：`c:/Users/kohn0/Desktop/japanese-lesson-creator-main/.claude/worktrees/example-prompts`（役目終了）
- Phase 5 ④ pivot 議論：worktree memory `project_phase5_pivot_to_claude_code_skill.md`
