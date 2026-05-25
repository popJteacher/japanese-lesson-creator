# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-25（worktree image-prompt-plan で **v4.0.4 building 改修 Stage 1 R25+R26 完了 / 採用 4 件本番化 done**。
採用：学校 R25 / 大学 R26 / デパート R22 / 会社 R22。production PNG 配置 + registry production entry 4 件 update 済。
**次は Stage 2 (guide 本体取り込み)**。verification は build_prompts.py で生成した prompt と smoke prompt の diff
（API 費用なし）方針確定。当日 cap 3/62）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5 ①／②／③：完了** ✅（catalog + import-lesson 配線済）
- **v3.12 取り込み：完了** ✅（invariants B hash = `2137a8e885ae`）
- **v4.0 取り込み：完了** ✅（invariants B hash = `5338c98aab5d`・lesson_01 person 12 件再生成済）
- **v4.0.4 building 改修 Stage 1 (smoke R1-R26)：完了** ✅
  - smoke 100 件 / $3.99 使用済（R1-R11 = 37 件 $1.59 / R12-R24 = 60 件 $2.32 / R25-R26 = 3 件 $0.12）
  - **採用 4 件：学校 R25 / 大学 R26 / デパート R22 / 会社 R22**
  - 本番化済：採用 PNG 4 枚を production 名 cp（smoke 版は保持）、registry production entry 4 件 update
  - R25 で 学校 dominate frame 75%+ + blank text rule（学び 11 対策）
  - R26 で 大学 cyclist 姿勢明示（前傾 + 両手ハンドル + 両足ペダル on + dynamic motion + image_3 anchor）
  - **新規学び 10-12** 確立（symmetric form vs perspective 衝突 / blank text 暴走 / per-vocab-type surroundings context）
  - Phase 6 docs（Flux + 自作 LoRA 切替検討）追記済：docs/MIGRATION_PLAN.md
  - 詳細経緯：worktree memory `project_v4_0_4_building_stage1.md`
- **v4.0.4 building 改修 Stage 2 (guide 本体取り込み)：未着手** ← 次セッション最優先
- **Phase 5 ④：v4.0 完了済だが v4.0.4 building 取り込み後に着手推奨**
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

main 即時 active タスクはない。次の active 化は **worktree が Stage 2 を完了して ff-merge してくる** とき。

---

## 次セッション最優先：image-prompt-plan worktree で Stage 2 着手

worktree session を立てて v4.0.4 building Stage 2（guide 本体取り込み）に着手する。
verification は **build_prompts.py 経由で prompt 生成 → smoke 元 prompt と diff 取り（API 費用なし）** 方針確定。

worktree セッション開始手順（`docs/WORKFLOW.md` § worktree セッション開始時 ＋ 本指示）：

```
cd .claude/worktrees/image-prompt-plan
git pull --ff-only main          # main 側更新の取り込み（あれば）
npm run validate                 # baseline 確認（B hash = 5338c98aab5d v4.0 のはず）
# memory 確認: project_v4_0_4_building_stage1.md 全文 + feedback 学び 1-12
# Stage 2 着手
```

### Stage 2 作業手順（次セッション）

1. **`prompts/master_prompt_design_guide_v4_0.py` に新構造を実装**
   - `STYLE_BIBLE` に `building_universal_rule` (A-1〜A-10 / 学び 1-12 結晶) + `per_vocab_type_table["building"]` (4 vocab: 学校/大学/デパート/会社 の accent / signature / label / activities / refs / surroundings / palette) を新設
   - `PROMPT_TEMPLATES["vocabulary_building"]` を 旧版 (pale sky-blue / single signage_text / primary_scene_cue) → 新版 (universal rule + per-building 変数 + reference 5 枚) で全面書き直し
   - `BACKGROUND_BY_TYPE["building"]` 撤去（default cream に統合）
   - 旧 building テンプレを `archive/prompts_v4_0_4_pre_building_rewrite/` に退避

2. **`scripts/invariants.mjs` の C4 building 分岐を default cream 期待に更新**
   - line 49 `BACKGROUND_BY_TYPE.building` 撤去 / line 179 `type === 'building'` 分岐撤去（全 vocab_type が `BACKGROUND_BY_TYPE.default` 期待で統一）

3. **`scripts/build_prompts.py` に vocab_type=building 対応追加**
   - per-building dict 読み込み（per_vocab_type_table["building"][word]）
   - `styleReferences: [...]` 自動付与（per_vocab_type_table 参照）
   - `preflight()` の vocab_type=building 分岐

4. **`npm run validate` で新 B hash 確定**（guide 改修で hash 変動）
   - 新 B hash を `scripts/invariants.mjs` `EXPECTED_GUIDE_HASH` に更新

5. **Verification (no API)**
   - `python scripts/build_prompts.py --lesson 1`（building 4 件含む）
   - 出力された prompt JSON の 学校/大学/デパート/会社 4 entry を、smoke 採用版（R25/R26/R22/R22）と string-diff
   - 差分が「universal rule 共通部の文字列正規化のみ」レベルなら OK
   - 大きな差分があれば guide 側を修正 → 再生成 → diff

6. **Stage 2 完了 → 一括 commit**
   - 本セッションの WIP commit + Stage 2 まとめて

### Stage 1 採用 + universal rule 確定版（Stage 2 で取り込み予定）

**A. 普遍ルール（全 building カード共通 / 学び 1-12 結晶）**
- A-1. Camera: street-level low-angle 3/4, eye-height, slightly looking up
- A-2. Framing: close-up（side wings off-frame OK / 上層階 off-frame OK）/ building DOMINATES frame 75%+ vertically
- A-3. Figures: 4-5 名、each DIFFERENT activity、prominent 1/3 of visible building height
- A-4. Palette: muted pastel family / Walls = cream off-white / Roof = slate-grey / Accent = per-vocab-type
- A-5. Reference: 5 枚 = image_1 brand voice (日本人) + image_2-4 type-relevant person + image_5 architectural anchor
- A-6. Outline: deep slate-navy / no gradients / shadows / 3D / 1:1
- A-7. Label: single signboard, type 別 English label, ONLY text element
- A-8. Ground/Pavement: sidewalk/paved ground = cream off-white、subtle outline only
- A-9. Blank text surfaces: named signboard 以外は全 blank（学び 11）
- A-10. Surroundings context: per-vocab-type（学び 12）
- A-11. Cyclist pose: 前傾 + 両手ハンドル + 両足ペダル on + dynamic motion + 7-head proportion + image_3 anchor（R26 学び）

**B. Per-vocab-type table 確定版（Stage 2 で取り込み予定）**

| building | accent | primary signature | label | activities 4 種 | type-relevant refs | surroundings |
|---|---|---|---|---|---|---|
| 学校 | warm yellow / sand-cream gold | 中央 clock tower | SCHOOL | 制服学生 entering/walking past/cycling/chatting | 学生 / 大学生 / 先生 | campus |
| 大学 | sand-stone beige | 石造 gate + sign beam | UNIVERSITY | 大学生 entering/walking past/cycling (前傾 pose)/chatting | 学生 / 大学生 / 先生 | campus（副 academic building OK） |
| デパート | warm muted tan | display windows + awning + 上層階 (off-frame) | DEPT. STORE | shopper entering/walking past/window-shopping/chatting | 会社員 / アメリカ人 / 韓国人 | urban_corner |
| 会社 | dull muted blue | glass curtain-wall + lobby (off-frame) | OFFICE | office worker entering/walking past/phone in hand/chatting | 会社員 / アメリカ人 / 韓国人 | urban_corner |

### Stage 2 完了後の cleanup（commit と同時 or 別 commit）

1. registry 一時 entry 一括 cleanup（R12-R26 で生成された 15+ 個の `_smoke_only=true` entry 削除）
2. data/images/ の不採用 PNG 削除（採用 4 枚は production 名で配置済・smoke 版 r25/r26/r22 等 15+ 枚削除）
3. `data/_smoke_v4_0_4_building.json` を `archive/data/` に退避（または Stage 2 取り込み参考として保全）

---

## ブロッカー

- Phase 5 ④ は v4.0 完了済だが、v4.0.4 building Stage 2 後に着手推奨
- Phase 5 ⑤ は ④ 完了に blocked
- Phase 5 ⑥ は ⑤ 完了に blocked
- Phase 6 LoRA 切替は lesson 1-3 完了 + spike test PASS が前提

---

## 当日 cap / wip 状態（次セッション開始時の注意）

- **当日 cap 3/62 使用中**（R25 学校 + R25 大学 + R26 大学 = 3 件 $0.1161）
- **wip 状態（コミット保留）**：
  - **本セッション分（WIP commit 候補）**：
    - `data/_smoke_v4_0_4_building.json`（R26 大学 1 entry 状態）
    - `data/master_image_registry.json`（R25 学校 + R25 大学 + R26 大学 一時 entry 追加 / production 4 entry update 済）
    - `data/images/word_学校.png` + `word_大学.png` + `word_デパート.png` + `word_会社.png`（production cp 済）
    - `data/images/word_学校_r25.png` + `word_大学_r25.png` + `word_大学_r26.png`（smoke 新規）
    - `data/_meta/imagen_usage.json`（2026-05-25 entry 追加）
    - `memory/project_v4_0_4_building_stage1.md`（R25-R26 + 採用判定 update 必要）
    - `memory/feedback_nanobanana_prompt_design.md`（学び 13 = cyclist 姿勢明示の追加検討）
    - `NEXT_ACTIONS.md`（本ファイル update 済）
    - `handoff_archive.md`（2026-05-25 R25-R26 + 本番化 entry 追加候補）
  - **前セッション残（WIP commit に含める）**：
    - `data/images/` 不採用 PNG 多数（R12-R24 smoke originals）
    - `data/images/vocab_大学.png` + `vocab_病院.jpg`（user 提供 reference）
    - Phase 6 docs（前々セッション保留分）
    - 既 update 済の R12-R24 一時 registry entries（前セッション）

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
                                  # ⚠ FOREGROUND 推奨（2026-05-25 background run で registry + usage NULL 破損例あり）
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs        # 実機 1 枚＝$0.04 (Imagen 4)
node scripts/_nanobanana-smoke.mjs    # 実機 1 枚＝~$0.0387 (Nano Banana)
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
node scripts/build-catalog.mjs [--dry-run | --verbose]
npm run import-lesson -- --lesson NN [--dry-run | --verbose]
python scripts/build_prompts.py --lesson 1       # MVP person のみ（Stage 2 で building 追加予定）
```

参考（再実行不要）：
- v4.0.4 building Stage 1 R1-R26 経緯：worktree memory `project_v4_0_4_building_stage1.md`
  / 学び `feedback_nanobanana_prompt_design.md` 学び 1-12 全文

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
