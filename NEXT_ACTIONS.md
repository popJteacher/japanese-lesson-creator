# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（v3.11.1 人間検証完了 / Phase 4 完了条件を ③⑥ 最小に再定義 / ④⑤ を Phase 4 後 backlog に移管 / v3.12 修正候補を PHASE_BACKLOG に退避 / Phase 4 ③ 本番投入準備完了）

---

## Phase 4 完了条件の再定義（2026-05-21）

- **Phase 4 完了 = ③ + ⑥**（GAS 完全消滅で達成）
- ④⑤（画像 QC / invariants[E]）は **Phase 4 後 backlog に移管**
  （`docs/PHASE_BACKLOG.md` § Phase 4 後 backlog）
- 理由：v3.11.1 人間検証で **④⑤ の機械検証は教育的・芸術的質の判定には役立たない**
  ことが判明。registry-as-canon 規律で画像は `--force` で後から差し替え可能なため、
  Phase 4 後に v3.12+ プロンプト改修と併せて iterative 改善する方が費用対効果が良い

---

## 現在地

- **Phase 0／1／2／3：完了。**
- **Phase 4：着手中（残作業：③ 本番 → ⑥ 退役）。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：v3.11.1 active（hash `a79e54a29e51`）。
    v3.11.1 = v3.11 + nanobanana 用 inline ASPECT RATIO 1:1 directive。
    Imagen 4 API 経由でも害なし。
  - **③** `scripts/generate-images-local.mjs`：コード完了。**v3.11.1 で 7 件人間検証完了
    （アスペクト比 / footwear / lanyard / 国旗 isolation 等の構造要件は OK / 教育的質
    の細部問題 6 件は v3.12 候補として PHASE_BACKLOG に退避）。本番投入待ち**。
  - **④⑤** **Phase 4 後 backlog に移管**（`docs/PHASE_BACKLOG.md` 参照）。
  - **⑥** preparation 完了。`archive/gas_old/generateImages_v5_3_phase4_retired.gs` に
    line range 750-2552 と 10 ステップ手順を manifest 記載。実コード切り出しは ⑥ 着手時。

- 旧版 v3.2〜v3.8 は `archive/prompts/` `archive/data_old/` に退避済。
- 作業分担：`docs/WORKFLOW.md` 参照。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること（順序固定）

### A. Phase 4 ③ 本番投入（段階的）

`v3_11_1.json` で 441 件を段階的に生成。コスト試算：Standard $0.04 × 441 ≒ **$17.64**。

```
# Step 1: 5 件 smoke（コスト $0.20 / 人間目視で技術不良なし確認）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --limit 5

# Step 2: 50 件中規模（コスト $2 / sample 確認）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --limit 50

# Step 3: 全件（コスト $15+ / 完走を見届ける）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json

# 完走確認
npm run validate
npm run missing-assets         # null_imageUrl が 0 件付近まで減少していること
```

各 Step 後に：
- ローカル `data/images/` で目視 sample（10-20 枚）
- registry 更新確認
- 明らかな技術不良があれば該当 imageId を `status=pending` に戻して `--force` 再生成

### B. Phase 4 ⑥ 本番着手（③ 完走後）

`archive/gas_old/generateImages_v5_3_phase4_retired.gs` に記載済の 10 ステップ手順に従う：

```
1. archive ファイルに gas/pipeline.gs line 750-2552 を切り出してコピー
2. line 2553 以降の utility 群（loadJsonFromDriveById 等）が IMAGE_SETTINGS /
   PERSON_PROFILES 等の定数を参照していないか grep で確認
3. gas/pipeline.gs から line 750-2552 を削除
4. npm run validate / npm run check-imagen-key で残余整合性確認
5. scripts/invariants.mjs の CANONICAL.gas から generateImages.gs を削除
6. commit
7. 人間タスク：GAS Triggers から generateImageBatch × 3 件削除
```

### C. Phase 4 完了宣言

- 人間が GAS Triggers 削除を完了
- `docs/MIGRATION_PLAN.md` Phase 4 セクションに完了マーク
- `NEXT_ACTIONS.md` を「Phase 4 後 backlog の優先度判断」に書き直し

---

## ブロッカー

- なし。③ → ⑥ → Phase 4 完了の一直線で進行可能。

---

## Phase 4 完了後 backlog（優先度未確定）

詳細は `docs/PHASE_BACKLOG.md` 参照。優先度はユーザー判断。

- **v3.12 マスタープロンプトガイド修正**（worktree 担当・6 項目）
  - 🔴 学生 2 アングルバグ / 🔴 肌色中央値収束 /
  - 🟡 アジア国別 pattern allowance / 🟡 アメリカ人正面 view /
  - 🟢 国旗 placement variation / 🟢 表情・姿勢 variation
- **lesson_01 既存 41 件 person 画像の再生成**（visual continuity）
- **画像 QC ④⑤ 実装**（旧 Phase 4 ④⑤・$0.80 校正 + 実装）
- **scene-rich テンプレ A2 設計**
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様** / **M-48 FAMILY_TEMPLATES 活用**
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=a79e54a29e51 (v3.11.1) / C=12×4 / D=55/55（3 WARN）PASS
npm run missing-assets       # 現状 image 441 / audio 108 件未生成（③ 完走で image が 0 付近に）
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）— 直近 PASS
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run generate-images -- --prompts <path> [--print-prompts | --sync-only | --dry-run]
                                  [--limit N] [--max-images N] [--force]
                                  [--person allow_adult|dont_allow|allow_all]
                                  [--aspect 1:1] [--size 1K|2K] [--out <md>]
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs    # 実機 1 枚＝$0.04
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
python scripts/build_prompts.py --lesson 1       # worktree で実行
```

人間側（Claude Code 実行不可・⑥ 完了時に必要）：

```
# 退役対象 GAS トリガー（Phase 4 ⑥ commit 完了後に GAS Triggers パネルから削除）
generateImageBatch × 3 件   # 9 / 13 / 17 時

# 削除後の確認（CLAUDE.md memory: GAS トリガーは文書を信用しない）
GAS エディタ → Triggers パネル → 一覧が generateImageBatch を含まないことを目視
```
