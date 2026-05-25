# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-25（worktree image-prompt-plan で **v4.0.4 building Stage 2 後 cleanup 完了**。
smoke entry 22 件 + smoke PNG 22 枚削除 + `_smoke_v4_0_4_building.json` archive 化。
残 registry entry 491 / B hash `078fd0bd9ffe` 不変 / validate PASS。
worktree は ff-merge 待ち状態）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①／②／③：完了** ✅（catalog + import-lesson 配線済）
- **v3.12 取り込み：完了** ✅（invariants B hash = `2137a8e885ae`）
- **v4.0 取り込み：完了** ✅（旧 invariants B hash = `5338c98aab5d`・lesson_01 person 12 件再生成済）
- **v4.0.4 building 改修 Stage 1 (smoke R1-R26)：完了** ✅
  - smoke 100 件 / $3.99 使用済
  - 採用 4 件確定：学校 R25 / 大学 R26 / デパート R22 / 会社 R22
  - 本番化済（cp + production registry entry 4 件 update）
- **v4.0.4 building 改修 Stage 2 (guide 本体取り込み)：完了** ✅
  - 新 invariants B hash = `078fd0bd9ffe`
  - `prompts/master_prompt_design_guide_v4_0.py`:
    - `BUILDING_BRAND_VOICE_REF` + `BUILDING_ARCHITECTURAL_REF` + `BUILDING_UNIVERSAL_RULE_V4_0_4` (A-1〜A-11) 新規
    - `BUILDING_CUES` 4 採用 entry に v4_0_4_* fields 追加（後方互換のため旧 fields 残置）
    - `PROMPT_TEMPLATES["vocabulary_building"]` 全面書き直し（旧 pale sky-blue → 新 universal rule + per-building + 5-image ref）
    - `BACKGROUND_BY_TYPE["building"]` 撤去
  - `scripts/invariants.mjs`: C4/C5 の building 分岐撤去（全 vocab_type で default cream 統一）
  - `scripts/build_prompts.py`: `render_building()` 新規 / `main()` で buildings 反復 / preflight に building branch / PLACEHOLDERS 17 個追加
- **v4.0.4 building Stage 2 後 cleanup：完了** ✅ 🆕
  - `master_image_registry.json`: `_smoke_only: true` entry 22 件削除（R12-R26 検証 + 採用源 smoke r25/r26/r22）
  - `data/images/`: 対応 smoke PNG 22 枚削除
  - `data/_smoke_v4_0_4_building.json` → `archive/data/` に退避
  - 採用 4 件 production entry (word_学校 / word_大学 / word_デパート / word_会社) は維持
  - validate PASS（B hash `078fd0bd9ffe` 不変 / 残 registry entry 491 / 音声 55/55 PASS 3 WARN）
- **Phase 5 ④：v4.0 完了済だが v4.0.4 取り込み後に着手推奨** ← Stage 2+cleanup 完了で着手可
- **Phase 5 ⑤／⑥：未着手** — Phase 5 ④ 完了後
- **Phase 6（仮）：Flux + 自作 LoRA 切替検討** — lesson 1-3 完了 + 50-100 枚 confirmed カード蓄積後に着手判断
- **Phase 4 後 backlog**：v3.12 修正候補 1-6 は v4.0 完了で retire 済。残り 436 件本生成 /
  画像 QC 仕様 / scene-rich テンプレ A2 設計 等は残置
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active（main 即時）：**なし**

main 即時 active タスクはない。次の active 化は **worktree が ff-merge してくる** とき。

---

## 次セッション最優先：main への ff-merge or 新 lesson 展開

選択肢:

### (C) main への ff-merge（推奨・Stage 1+2+cleanup 一括取り込み）
1. main branch に切替
2. `git merge --ff-only phase4-prompt-plan` (worktree から)
3. main 側の NEXT_ACTIONS / docs を整合化
4. main の commit 履歴に Stage 1+2+cleanup を取り込む（`ed83027` まで）

### (B) 新 lesson の building 同型展開（lesson_02 building の v4_0_4_* fields 追加）
1. `BUILDING_CUES["病院"]` / `["銀行"]` / `["駅"]` / `["スーパー"]` に v4_0_4_* fields 追加
2. lesson_02 vocab_types_lesson02.json で対象 building を確認
3. build_prompts.py --lesson 2 で 検証
4. user 目視で OK なら本番化（実機 ~$0.04 × N 件）

優先順は user 判断。recommend = (C) ff-merge → (B) lesson_02 展開 の順。

---

## ブロッカー

- Phase 5 ④ は v4.0 完了済だが、v4.0.4 building Stage 2+cleanup 後（now done）に着手可
- Phase 5 ⑤ は ④ 完了に blocked
- Phase 5 ⑥ は ⑤ 完了に blocked
- Phase 6 LoRA 切替は lesson 1-3 完了 + spike test PASS が前提

---

## 当日 cap / wip 状態（次セッション開始時の注意）

- **当日 cap 3/62 使用済**（R25 学校 + R25 大学 + R26 大学 = 3 件 $0.1161）
- **wip 状態**: なし（Stage 2 commit = `ef3f228` / cleanup commit = `ed83027`）

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=078fd0bd9ffe(v4.0.4) / C 7 files / D=55/55（3 WARN）PASS
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
                                  # prompt JSON 内 styleReferences: [...] で参照画像添付 (v4.0.4 R11)
                                  # ⚠ FOREGROUND 推奨（2026-05-25 background run で registry + usage NULL 破損例あり）
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs        # 実機 1 枚＝$0.04 (Imagen 4)
node scripts/_nanobanana-smoke.mjs    # 実機 1 枚＝~$0.0387 (Nano Banana)
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
node scripts/build-catalog.mjs [--dry-run | --verbose]
npm run import-lesson -- --lesson NN [--dry-run | --verbose]
python scripts/build_prompts.py --lesson 1       # v4.0.4: person 12 + building 3 (学校/大学/デパート) → image_prompts_lesson01_v4_0_4.json
                                                  # building 出力 entry には styleReferences: [...] (5 枚) 自動付与
                                                  # 未移行 building (病院/銀行/駅/スーパー) は skip + stderr warn
```

参考（再実行不要）：
- v4.0.4 building Stage 1+2+cleanup 経緯：worktree memory `project_v4_0_4_building_stage1.md`
  / 学び `feedback_nanobanana_prompt_design.md` 学び 1-13 全文

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
