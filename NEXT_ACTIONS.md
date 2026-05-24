# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-24（worktree image-prompt-plan で **v4.0.4 building 改修 Stage 1 R9-R11 完了**。
R9 = person template 同型化 NG / R10 = universal template + STYLE_BIBLE 厳守 で R9 より悪化 /
R11 = pipeline 改修で reference attachment 化したが 1 件 word_学校 が user 病院手動品質に
達せず削除。**R12 = 5 軸統合（universal template + reference + per-building palette + people +
aspect-specific cross-ref）が次の方向**。pipeline 改修 + Phase 6 docs は完成済 / コミット保留）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①／②／③：完了** ✅（catalog + import-lesson 配線済）
- **v3.12 取り込み：完了** ✅（invariants B hash = `2137a8e885ae`）
- **v4.0 取り込み：完了** ✅（invariants B hash = `5338c98aab5d`・lesson_01 person 12 件再生成済）
- **v4.0.4 building 改修 Stage 1：R1-R11 完了** 🆕
  - smoke 37 件 / $1.59 使用済（実機 nanobanana 検証）
  - 対象 4 件：word_学校 / word_大学 / word_デパート / word_会社
  - **R11 で pipeline 改修（reference attachment）完成**：nanobanana-client.mjs + generate-images-local.mjs + data/_smoke_v4_0_4_building.json
  - **Phase 6 docs（Flux + 自作 LoRA 切替検討）追記済**：docs/MIGRATION_PLAN.md
  - 結論：text-only 限界実証（学び 6）/ STYLE_BIBLE 単一強制過剰（学び 7）/ people 含めるべき（学び 8）/ cross-ref aspect 別に specific（学び 9）
  - 詳細経緯：worktree memory `project_v4_0_4_building_stage1.md`（R12 設計仕様あり）
- **v4.0.4 building 改修 Stage 1 R12：未着手** ← 次セッション着手
- **v4.0.4 building 改修 Stage 2：R12 OK 後に着手**（ガイド本体取り込み）
- **Phase 5 ④：v4.0 完了済だが v4.0.4 building 取り込み後に着手推奨**
- **Phase 5 ⑤／⑥：未着手** — Phase 5 ④ 完了後
- **Phase 6（仮）：Flux + 自作 LoRA 切替検討** — docs/MIGRATION_PLAN.md に評価項目記載 / lesson 1-3 完了で 50-100 枚 confirmed カード蓄積後に着手判断
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

## 次セッション最優先：image-prompt-plan worktree で R12 着手

worktree session を立てて v4.0.4 building 改修 Stage 1 の R12（5 軸統合）に着手する。
**1 セッション = 1 worktree** の規律は維持。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時 ＋ 本指示）：

```
cd .claude/worktrees/image-prompt-plan
git pull --ff-only main          # main 側更新の取り込み（あれば）
npm run validate                 # baseline 確認（B hash = 5338c98aab5d v4.0 のはず）
# 必要なら memory 確認（学び 1-9 と project_v4_0_4_building_stage1.md 全文）
# R12 着手
```

### R12 設計仕様（worktree memory より要約）

**目的**：text-only path が R9/R10 連続失敗で根本的限界を実証（学び 6）。R11 で pipeline 改修
（reference attachment）は完成したが、design 全体としては universal template 構造 + per-building
palette 多様化 + people 追加 + aspect-specific cross-ref の **5 軸統合** が必要。

**作業手順**：

1. **`data/_smoke_v4_0_4_building.json` を R12 構造で書き直す（~800-1000 chars/件）**
   - universal 4-5 文（opener / palette family 制約 / lighting / tone / background）
   - per-building 変数 dict（subject_identity / facade_and_roof / signature_feature /
     palette_specific / people_in_scene / landscaping / foreground / label_text / label_placement）
   - cross-reference を aspect 別 inline：
     - "Match the illustration **style and brand voice** of image_1 (医者) and image_2 (日本人)"
     - "People in the scene should be drawn **similar to** image_1, image_2 (same series figures)"

2. **per-building palette を Gemini 提案準拠**（学び 7：muted pastel family 内多様化）
   - 学校 = muted brick red + beige stone + slate grey
   - 大学 = sand-colored stone + slate-grey + dull blue trim
   - デパート = warm muted tan + slate grey + dull blue trim（派生）
   - 会社 = muted steel grey + slate + dull blue glass（派生）

3. **per-building people_in_scene を追加**（学び 8）
   - 学校 = 子供 2 人 with randoseru
   - 大学 = 学生 2 人 with backpacks
   - デパート = shopper 1 人 with shopping bag
   - 会社 = office worker 1 人 with briefcase

4. **styleReferences は 2 枚維持**（または type-relevant per-building カスタム選定）
   - 共通候補：`["data/images/word_医者.png", "data/images/word_日本人.png"]`
   - type-relevant 案：会社 だけ word_会社員 を追加 / 学校・大学 だけ word_学生 を追加 等

5. **`npm run generate-images -- --prompts data/_smoke_v4_0_4_building.json --force --max-images 40`**
   で 4 件再生成（~$0.16 / cap reset 後）

6. **user 目視確認 → OK なら Stage 2 へ / NG なら 1 仮説 1 変数で R13 設計**

### R12 OK 後 Stage 2（guide 本体取り込み）

1. `prompts/master_prompt_design_guide_v4_0.py` の `PROMPT_TEMPLATES["vocabulary_building"]`
   を R12 universal template + per-building 変数構造で書き直す
2. `BACKGROUND_BY_TYPE["building"]` を削除（default cream に統合）
3. `STYLE_BIBLE.color_palette` に「per-vocab-type palette family 制約」階層を新設
   （person = muted warm blue dominant / building = muted pastel family 内 per-type 変化）
4. `scripts/invariants.mjs` の C4 building 分岐を default cream 期待に更新 + B hash 再計算
5. `scripts/build_prompts.py` に vocabulary_building 対応を追加（per-building dict 読み込み + styleReferences 自動付与）
6. archive に v4.0 building 旧テンプレを退避

想定コスト：Stage 2 検証 ~$0.20（4 件本生成）

---

## ブロッカー

- Phase 5 ④ は v4.0 完了済だが、v4.0.4 building 取り込み（Stage 2）後に着手推奨
- Phase 5 ⑤ は ④ 完了に blocked
- Phase 5 ⑥ は ⑤ 完了に blocked
- Phase 6 LoRA 切替は lesson 1-3 完了 + spike test PASS が前提

---

## R11 直後の状態（次セッション開始時の注意）

- **当日 cap 41/50 使用済**（明日 reset 後でないと smoke 不可。current cap 30 default で
  --max-images 40+ bump 必要）
- **registry 整合崩れ**：4 entries は status=generated のままだが、word_大学 / word_デパート /
  word_会社 PNG は user 削除済でファイル消失、word_学校 PNG は user 削除と申告だが disk 上残存。
  R12 で --force 再生成すれば整合回復するので即時対処は不要
- **pipeline 改修コミット保留**：scripts/lib/nanobanana-client.mjs / scripts/generate-images-local.mjs /
  data/_smoke_v4_0_4_building.json / docs/MIGRATION_PLAN.md / memory 3 ファイル / 本ファイル /
  handoff_archive.md が wip 状態。次セッション開始前に `git log --oneline -3` で commit 済み確認
- **smoke 残骸**：data/_smoke_v4_0_4_building.json は R11 状態（reference attachment 入り）。R12 で
  全面書換予定

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
                                  # v4.0.4 R11: prompt JSON 内 styleReferences: [...] で参照画像添付
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
- v4.0.4 building Stage 1 R1-R11 経緯：worktree memory `project_v4_0_4_building_stage1.md`
  / 学び `feedback_nanobanana_prompt_design.md` 学び 1-9 全文

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
