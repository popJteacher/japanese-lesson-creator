# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-25（worktree image-prompt-plan で **v4.0.4 building Stage 2 後 cleanup 完了**。
smoke entry 22 件 + smoke PNG 22 枚削除 + `_smoke_v4_0_4_building.json` archive 化。
残 registry entry 491 / B hash `078fd0bd9ffe` 不変 / validate PASS。
⚠ **ff-merge 不可能を発見** — main が merge-base から 23 commit 先行 (Phase α1-α4 音声 QC + accent + Phase 5 ④/⑤)。
worktree は 6 commit 先行。両方が独立に進化 → 3-way merge or rebase が必要。
user 「main 側と一度相談」判断で merge は保留。次セッションは main 側で状態整理してから合流戦略を立てる）

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

## 次セッション最優先：main↔worktree 合流戦略の決定（user 相談待ち）

### 状況（2026-05-25 検出）

- **merge-base**: `1a42cd4 feat(phase4): v4.0 major-version pivot`
- **main 先行 23 commit** (新しい順):
  - `b4340dc feat(phase-α4): Drive 291 件のローカル化 (WAV→ffmpeg loudnorm→MP3)`
  - `f5bdf75 feat(phase-α3-後半): integrity gate + accent_override 機構 + 175 件再生成`
  - `d476293 feat(phase-α3-前半): UniDic+naist-jdic ハイブリッド抽出 + 17508 件 yomigana`
  - `1096953 discover(phase-α2): 日本語アクセント指定は IPA でなく yomigana 記法のみ`
  - `6178dc7 docs(phase-α3): NEXT_ACTIONS を A 方針 (UniDic + LLM cross-check + override) に書き換え`
  - `72238f5 feat(phase-α2): QC を loudnorm のみに簡素化 + 120 件本走`
  - `4de9c5a feat(phase-α1): 音声自然さ QC 実装 + 55 件 smoke 完了`
  - `c152a19 feat(phase5-⑤後半): import-lesson examples 対応 + 再生成 pipeline + マニュアル 2 本`
  - `5b79a84 docs: SKILLS_MANUAL.md 新規追加`
  - `4f0f244 feat(phase5-⑤): /export-skill-prompts skill + lesson_02 例文 5 件 smoke`
  - ... 他 13 件 (phase5-④/⑤ + skill 系統)
- **worktree 先行 6 commit**: f1a9236 / 950dcfd / c9f70e0 / ef3f228 / ed83027 / 4fbb148
- **main 側に未 commit 変更**: `M data/image_prompts_skill.json` + 多数の untracked (vocab_大学.png / vocab_病院.jpg / nhk_counter_accent.json / scripts/check-accent-nhk.py / scripts/test-tts-accent-rendering.mjs / tmp/ 配下)

### 予想される conflict 領域

- `scripts/invariants.mjs`（worktree が B hash 078fd0bd9ffe + C4/C5 building 分岐撤去 ↔ main が Phase 5 ④' で B' 系統追加？）
- `data/master_image_registry.json`（worktree が大幅編集 / main 側でも vocab_大学/vocab_病院 追加されている → registry も触っている可能性）
- `NEXT_ACTIONS.md`（main 専属違反: worktree が編集 / WORKFLOW.md の conflict policy = main 側採用）
- `data/lesson_*.json`（Phase 5 ⑤ で例文追加 / worktree は触っていない＝conflict なしのはず）
- main 側 untracked PNG（`vocab_大学.png` / `vocab_病院.jpg`）と worktree 削除済 smoke PNG の関係要確認

### 選択肢

#### (α) worktree を main に rebase 後 ff-merge
- worktree 側で `git rebase main` → conflict 解決 → 線形履歴を保つ
- 6 commit を書き換えるため commit hash 変わる

#### (β) main で 3-way merge commit
- main 側で `git merge phase4-prompt-plan` → conflict 解決 → merge commit
- worktree の commit hash を保つ / 履歴は分岐＋合流

#### (γ) main 側で状態整理してから合流
- まず main の未 commit 変更 (image_prompts_skill / accent 系) を commit or stash
- main 側 NEXT_ACTIONS の現状把握
- 改めて (α) or (β) を選ぶ

**user 判断: (γ)「main 側と一度相談」**。次セッション main 側で状態整理 → 合流戦略確定。

### 並行 backlog（merge 後）

- (B) 新 lesson の building 同型展開（lesson_02 building の v4_0_4_* fields 追加）
  - `BUILDING_CUES["病院"]` / `["銀行"]` / `["駅"]` / `["スーパー"]` に v4_0_4_* fields 追加
  - build_prompts.py --lesson 2 で検証 → user 目視 OK で本番化（実機 ~$0.04 × N 件）

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
