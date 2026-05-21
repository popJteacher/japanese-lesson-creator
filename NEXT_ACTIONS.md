# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（Phase 4 ③ smoke 5 件完走 = $0.20 / 技術 QC A1–A4 全件 PASS / 人間目視で品質 3 課題発見＝v3.12 backlog に追記済 / 残作業は ⑥ のみ）

---

## 現在地

- **Phase 0／1／2／3：完了。**
- **Phase 4：着手中（残作業：⑥ 退役のみ）。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：v3.11.1 active（hash `a79e54a29e51`）。
  - **③** **完了（2026-05-21）。** `npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --limit 5` で
    5 件全 PASS（成功率 5/5・$0.20・PNG A1〜A4 全 PASS・registry が GAS Drive URL → `data/images/word_*.png` ローカルパスに置換）。
    人間目視で品質 3 課題（線スタイル不一致 / 学生テキスト焼き込み / 会社員 photoreal drift）発見＝v3.12 修正候補
    として `docs/PHASE_BACKLOG.md` § Imagen 4 経由 5 件 smoke 追加発見 に保全済。これら品質問題は **GAS 完全消滅という Phase 4 のコア目的とは独立**
    のため Phase 4 完了を妨げない（registry-as-canon 規律で `--force` 再生成可能）。
  - **④⑤** Phase 4 後 backlog に移管済（`docs/PHASE_BACKLOG.md`）。
  - **⑥** preparation 完了。`archive/gas_old/generateImages_v5_3_phase4_retired.gs` に
    line range 750-2552 と 10 ステップ手順を manifest 記載。**実コード切り出しはこれから**。

- 旧版 v3.2〜v3.8 は `archive/prompts/` `archive/data_old/` に退避済。
- 作業分担：`docs/WORKFLOW.md` 参照。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ 完了後に人間が削除。

未コミットの変更（③ 完走の成果物）：
- `data/master_image_registry.json`：word_医者 / 会社員 / 学生 / 大学生 / 先生 の 5 entry を Drive URL → local path に更新、`status: approved → generated`（word_大学生 のみ既に generated）、`_meta.lastModified: 2026-05-21` 付与
- `data/_meta/imagen_usage.json`：今日 5 枚 $0.20 を記録
- `data/images/word_医者.png` 他 4 件（新規・各 1024×1024 PNG）

---

## 今やること（順序固定）

### A. Phase 4 ③ commit（先に）

```
git add data/master_image_registry.json data/_meta/imagen_usage.json data/images/word_医者.png data/images/word_会社員.png data/images/word_学生.png data/images/word_大学生.png data/images/word_先生.png
git commit -m "feat(phase4): ③ smoke 5 件完走 — Imagen 4 経由 vocab_person 5 件を local 化"
```

### B. Phase 4 ⑥ 本番着手

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

- なし。⑥ → Phase 4 完了の一直線で進行可能。

---

## Phase 4 完了後 backlog（優先度未確定）

詳細は `docs/PHASE_BACKLOG.md` 参照。優先度はユーザー判断。

- **v3.12 マスタープロンプトガイド修正**（worktree 担当・**9 項目**＝nanobanana 由来 6 ＋ **Imagen 4 由来 3〔今回追加〕**）
  - nanobanana 6: 🔴 学生 2 アングル / 🔴 肌色中央値収束 / 🟡 アジア国別 pattern / 🟡 アメリカ人正面 view / 🟢 国旗 placement / 🟢 表情・姿勢 variation
  - Imagen 4 3 (新): 🔴 line weight 不一致 / 🔴 vocabulary text bake-in / 🔴 photoreal style drift
- **残り 436 件の本生成**（③ 持ち越し分・v3.12 改修後に段階的実施・$17.4）
- **③ で生成した 5 件の `--force` 再生成**（v3.12 適用後に品質改善確認・$0.20）
- **lesson_01 既存 41 件 person 画像の再生成**（visual continuity）
- **画像 QC ④⑤ 実装**（旧 Phase 4 ④⑤・$0.80 校正 + 実装・photo drift 検出に有効と判明）
- **scene-rich テンプレ A2 設計**
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様** / **M-48 FAMILY_TEMPLATES 活用**
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=a79e54a29e51 (v3.11.1) / C=12×4 / D=55/55（3 WARN）PASS
npm run missing-assets       # 現状 image 441 / audio 108（5 件 smoke は元から approved だったため count 不変）
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
