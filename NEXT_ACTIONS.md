# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-24（worktree image-prompt-plan で **v4.0.4 building 改修 Stage 1 R1-R8 完了**。
R8 で過剰規律窒息 ⇄ 過剰簡素化の両極端を経験。次セッション R9 で person template
同型化を試行する handoff。memory に学び 4/5 + Stage 1 project 記録を追記済み）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①／②／③：完了** ✅（catalog + import-lesson 配線済）
- **v3.12 取り込み：完了** ✅（invariants B hash = `2137a8e885ae`）
- **v4.0 取り込み：完了** ✅（invariants B hash = `5338c98aab5d`・lesson_01 person 12 件再生成済）
- **v4.0.4 building 改修 Stage 1：R1-R8 完了** 🆕
  - smoke 32 件 / $1.24 使用済（実機 nanobanana 検証）
  - 対象 4 件：word_学校 / word_大学 / word_デパート / word_会社（registry status=generated）
  - 結論：person template 同型化（[[feedback-nanobanana-prompt-design]] 学び 4/5）が次の方向
  - 詳細経緯：worktree memory `project_v4_0_4_building_stage1.md`
- **v4.0.4 building 改修 Stage 1 R9：未着手** ← 次セッション着手
- **v4.0.4 building 改修 Stage 2：R9 OK 後に着手**（ガイド本体取り込み）
- **Phase 5 ④：v4.0 完了済だが v4.0.4 building 取り込み後に着手推奨**
- **Phase 5 ⑤／⑥：未着手** — Phase 5 ④ 完了後
- **Phase 4 後 backlog**：v3.12 修正候補 1-6 は v4.0 完了で retire 済。残り 436 件本生成 /
  画像 QC 仕様 / scene-rich テンプレ A2 設計 等は残置
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（main 即時）：**なし**

main 即時 active タスクはない。次の active 化は **worktree が v4.0.4 building 取り込み
（Stage 2）を完了して ff-merge してくる** とき。

---

## 次セッション最優先：image-prompt-plan worktree で R9 着手

worktree session を立てて v4.0.4 building 改修 Stage 1 の R9（person template 同型化）に
着手する。**1 セッション = 1 worktree** の規律は維持。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時 ＋ 本指示）：

```
cd .claude/worktrees/image-prompt-plan
git pull --ff-only main          # main 側更新の取り込み（あれば）
npm run validate                 # baseline 確認（B hash = 5338c98aab5d v4.0 のはず）
# 必要なら memory 確認（学び 4/5 と project_v4_0_4_building_stage1.md）
# R9 着手
```

### R9 設計仕様（worktree memory より）

**目的**：v4.0.4 building Stage 1 で R1-R8 が両極端 swing で品質出ず。person prompts は
~6500 chars / 5 sections / universal rule の inline 名前付き invoke で安定生成しているので、
同型構造を building に適用して安定化する。

**作業手順**：

1. `data/_smoke_v4_0_4_building.json` の 4 prompt を以下構造に書き直す（~3500-4500 chars / 1 prompt）：
   ```
   [PURPOSE]   — instant communication
   [SUBJECT]   — architectural form + scene cue + people + 4 universal rule inline invoke
   [SCENE & ACTION] — ASPECT RATIO directive (1:1) + composition + background
   [STYLE RECIPE — DO NOT CHANGE] — palette + style discipline + CONTRAST RULE inline
   [CONSTRAINTS] — SIGNAGE_ISOLATION + text rules
   ```

2. inline 名前付き invoke する universal rule 4 つ（person prompts の書き方を手本に）：
   - **BUILDING_CONTRAST_RULE** (derived from STYLE_BIBLE.visual_contrast_principle):
     cream 背景 → 建物 primary = muted warm blue（cream/amber は accent only）
   - **BUILDING_TYPE_IDENTITY_RULE** (PART 1.3 ROLE_VISUAL_IDENTITY_RULE applied):
     3 signature 同時 (form + scene cue + people cue)
   - **HEAD-BODY PROPORTION RULE** (v4.0 PART 1.10): 建物 scene 内の人物も 7 頭身
   - **SIGNAGE_ISOLATION_RULE** (PART 1.1 NATIONAL_SYMBOL_ISOLATION applied): 1 English label のみ

3. `npm run generate-images -- --prompts data/_smoke_v4_0_4_building.json --force --max-images 40`
   で 4 件再生成（~$0.16）

4. user 目視確認 → OK なら Stage 2 へ / NG なら 1 仮説 1 変数で R10 設計

### Stage 2（R9 OK 後）

R9 で品質が確定したら本格取り込み：

1. `prompts/master_prompt_design_guide_v4_0.py` の `PROMPT_TEMPLATES["vocabulary_building"]`
   を R9 prompt 構造で書き直す（universal rule reference を含む形）
2. `BACKGROUND_BY_TYPE["building"]` を削除（default cream に統合）
3. `scripts/invariants.mjs` の C4 building 分岐を default cream 期待に更新 + B hash 再計算
4. `scripts/build_prompts.py` に vocabulary_building 対応を追加（現在 MVP person のみ）
5. archive に v4.0 building 旧テンプレを退避

想定コスト：Stage 2 検証 ~$0.20（4 件本生成）

---

## ブロッカー

- Phase 5 ④ は v4.0 完了済だが、v4.0.4 building 取り込み（Stage 2）後に着手推奨
  （building テンプレが安定してから例文テンプレ拡張するほうが土台が固い）
- Phase 5 ⑤ は ④ 完了に blocked
- Phase 5 ⑥ は ⑤ 完了に blocked

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=5338c98aab5d(v4.0) / C / D=55/55（3 WARN）PASS
npm run missing-assets             # image 437 / audio 108
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
python scripts/build_prompts.py --lesson 1       # MVP person のみ
```

参考（再実行不要）：
- v4.0 取り込み：merge SHA は `git log --merges` 不要（ff-only のため merge commit なし）
- v4.0.4 building Stage 1 経緯：worktree memory `project_v4_0_4_building_stage1.md`
  / 学び `feedback_nanobanana_prompt_design.md` 学び 4・5

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
