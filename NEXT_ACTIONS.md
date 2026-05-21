# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（v3.8 完了 / word_新聞 sync 解消 / image QC 下書き完了し PHASE_BACKLOG 退避）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：v3.8 まで完了（hash `477425a647a6`）。
    主な変更：EXCEPTION 句 placeholder 化（v3.6）→ ISOLATION_SAFE_PROPS_RULE +
    cultural_styling_hint（v3.7）→ skin tone enumerate / 国別 phenotype /
    現代化伝統衣装許容（v3.8）。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。
    v3.7 で 4 件手動検証 → v3.8 で構造修正。**v3.8 プロンプトでの再検証が未。**
  - **④** image QC：設計下書き完了し `docs/PHASE_BACKLOG.md` に退避。
    Phase 4 ④ active 化時に校正手順（Step 1〜4・$0.80 / 20 枚）を実行して実装に入る。
  - **⑤⑥** 未着手。

- **作業分担（2026-05-21 から）：** `docs/WORKFLOW.md` 参照。
  - **main**：Phase 4 ③④⑤⑥ ランタイム本体（generate-images-local.mjs / image QC /
    validate-images / GAS 退役）。registry / lesson_NN.json / data/images/。
  - **worktree (`phase4-prompt-plan`)**：マスタープロンプトガイド v3.9+ / `build_prompts.py` /
    `data/image_prompts_*.json` / `invariants.mjs` の B hash 行。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

### A. 人間（main・worktree 両方に共通）：v3.8 で 3-4 件再検証

`.tmp_verify/prompts_image_prompts_lesson01_v3_8.md` を使い、特に国籍系で：

- 3 件並列（日本人 / 中国人 / 韓国人 等）が「同じ人に見えない」か
- 肌色が medium-darker 単色から脱却し fair〜olive 等の異なる選択が出るか
- wagara 柄 / cheongsam-inspired / K-fashion 等の文化要素が caricature にならず自然か
- 役割 1-2 件（医者 / 先生）で enumerate された多様性が出るか

結果に応じて：
- **OK** → main で Phase 4 ④（image QC）の校正・実装に進む（`docs/PHASE_BACKLOG.md`「画像 QC 仕様」の Step 1〜4）
- **NG**（特定の国だけ不適切 等）→ **worktree セッションを起こして v3.9 で微調整**

### B. main で並行できること（任意・人間検証と独立）

- **registry 未登録 120 件のバックフィル**（`docs/PHASE_BACKLOG.md` 参照）
- **旧版アーカイブ整理**：`prompts/master_prompt_design_guide_v3_2.py` 〜 `_v3_7.py`、
  `data/image_prompts_lesson01_v3_2.json` 〜 `_v3_7.json` を archive 化（v3_8 で代替）。
  ※ ただしこれは「ガイド系ファイル」なので **worktree でやる**（WORKFLOW.md 準拠）。

### C. worktree（必要になったら別セッションで起動）

- **v3.9 で発見済み問題を直す**：人間検証で NG だった国だけ phenotype/cultural_styling_hint を調整
- **scene-rich テンプレ A2 設計**（`docs/PHASE_BACKLOG.md` の D 退避項目）

worktree セッション開始手順（`docs/WORKFLOW.md` §「セッション開始 / 終了チェックリスト」）：
```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main       # main の進捗を取り込む
npm run validate               # baseline 確認
```

---

## ブロッカー

- なし。人間が v3.8 で 3-4 件確認すれば次のスライス（main の ④ or worktree の v3.9）が決まる。

---

## Phase 4 後 backlog（プランに明示済）

- **scene-rich テンプレ A2 設計**（v3.8 監査で発見・`docs/PHASE_BACKLOG.md` 参照）
- **lesson_01 既存 41 件 person 画像の再生成**（visual continuity）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様**（lesson_NN.json スキーマ拡張）
- **M-48 FAMILY_TEMPLATES 活用**（vocab_type=family 設計）
- **registry 未登録 120 件のバックフィル**
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**：vocab_type=concrete_object / action_verb / adjective を実装するタイミングで `{STRATEGY_BLOCK}` 転記を追加（worktree で実装）

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=477425a647a6 / C=12×7 / D=55/55（3 WARN）PASS
npm run missing-assets       # image registry 62 件 / audio 0 件
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
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

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 9/13/17 時

# v3.8 検証：Gemini / AI Studio で .tmp_verify/prompts_image_prompts_lesson01_v3_8.md
# のプロンプトを試す。特に国籍 3-4 件で弁別性を確認。
```
