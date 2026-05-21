# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（v3.9 まで完了 / main = Phase 4 ランタイムに集中 / worktree = v3.9 の人間再検証待ち）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：**v3.9 まで完了**（hash `a317e0d226fb`）。
    主な変更：EXCEPTION 句 placeholder 化（v3.6）→ ISOLATION_SAFE_PROPS_RULE +
    cultural_styling_hint（v3.7）→ skin tone enumerate / 国別 phenotype /
    現代化伝統衣装許容（v3.8）→ **NATIONAL_SYMBOL_ISOLATION_RULE 普遍化 +
    cultural_styling_hint 必須要素方式 + role prop palette-aware contrast rule（v3.9）**。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。
    v3.7 で 4 件手動検証 → v3.8 で構造修正 → v3.8 で 10 件検証完了 →
    **v3.9 プロンプトでの再検証が未**。
  - **④⑤⑥** 未着手。

- **作業分担：** `docs/WORKFLOW.md` 参照。
  - **main**：Phase 4 ③④⑤⑥ ランタイム本体（generate-images-local.mjs / image QC /
    validate-images / GAS 退役）。registry / lesson_NN.json / data/images/。
  - **worktree (`phase4-prompt-plan`)**：マスタープロンプトガイド v3.9+ / `build_prompts.py` /
    `data/image_prompts_*.json` / `invariants.mjs` の B hash 行。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

### A. 人間（main・worktree 両方に共通）：v3.9 で 5-7 件再検証

`.tmp_verify/prompts_image_prompts_lesson01_v3_9.md` を使い、特に以下を重点確認：

- **国籍系（最重要）**：v3.8 で生成失敗していたパターンが解消したか
  - **アメリカ人**：Tシャツに国旗プリントが入らないか（v3.8 のバグ）
  - **ブラジル人**：緑黄 football-supporter 配色になっていないか（旗類似化）
  - **中国人 / スペイン人**：red+yellow combo を outfit に持たないか
  - 全 7 か国で「modern X casual + 旗ピン」共通形から脱却し、文化要素
    （wagara / 噲衣 / Tang-jacket / 漢服 / áo dài / 帆布 chore coat /
    flannel / 棕櫚プリント / 麻布 / espadrille 等）が必ず見えるか
- **役割系**：prop（マーカー・教科書・clipboard・briefcase 等）が服装と
  色対比して視認できるか（v3.8 の「light-blue 服 + light-blue ペン」問題）
- **enumerate 化された phenotype**：肌色・髪色・髪質が discrete に選ばれるか

結果に応じて：
- **OK** → main で Phase 4 ④（image QC）の設計に進む
- **NG**（特定の国だけ不適切 等）→ **worktree セッションを起こして v3.10 で微調整**

### B. main で並行できること（任意・人間検証と独立）

- **registry 未登録 120 件のバックフィル**（`docs/PHASE_BACKLOG.md` 参照）
- **`word_新聞` audio sync 漏れ**：`npm run sync-registries` 1 発で解消見込み（未検証）
- **旧版アーカイブ整理**：`prompts/master_prompt_design_guide_v3_2.py` 〜 `_v3_8.py`、
  `data/image_prompts_lesson01_v3_2.json` 〜 `_v3_8.json` を archive 化（v3_9 で代替）。
  ※ ただしこれは「ガイド系ファイル」なので **worktree でやる**（WORKFLOW.md 準拠）。
- **Phase 4 ④ 設計の下調べ**：image QC 仕様（PNG サイズ / 透過 / パレット適合 /
  余白比率 等の機械検証）を `docs/REFERENCE.md` に下書き → 実装は ④ 着手時。

### C. worktree（必要になったら別セッションで起動）

- **v3.10 で発見済み問題を直す**：人間検証で NG だった国だけ phenotype/cultural_styling_hint を調整
- **scene-rich テンプレ A2 設計**（`docs/PHASE_BACKLOG.md` の D 退避項目）

worktree セッション開始手順（`docs/WORKFLOW.md` §「セッション開始 / 終了チェックリスト」）：
```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main       # main の進捗を取り込む
npm run validate               # baseline 確認
```

---

## ブロッカー

- なし。人間が v3.9 で 5-7 件確認すれば次のスライス（main の ④ or worktree の v3.10）が決まる。

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
npm run validate             # invariants A=v7.4 / B=a317e0d226fb / C=12×8 / D=55/55（3 WARN）PASS
npm run missing-assets       # image registry 62 件 / audio 1 件（word_新聞）
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

# v3.9 検証：Gemini / AI Studio で .tmp_verify/prompts_image_prompts_lesson01_v3_9.md
# のプロンプトを試す。特に：
#   - 国籍 7 件：v3.8 の「同型 casual + 旗ピン」収束が解消したか
#   - アメリカ人：Tシャツ前面に国旗プリントが入らないか
#   - ブラジル人：緑黄 football 配色になっていないか
#   - 役割 5 件：prop が服装と色対比して視認できるか
```
