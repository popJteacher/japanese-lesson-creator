# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（v3.10 まで完了 / main = Phase 4 ランタイムに集中 / worktree = v3.10 の人間再検証待ち）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：**v3.10 まで完了**（hash `051af0bc7b64`）。
    主な変更：EXCEPTION 句 placeholder 化（v3.6）→ ISOLATION_SAFE_PROPS_RULE +
    cultural_styling_hint（v3.7）→ skin tone enumerate / 国別 phenotype /
    現代化伝統衣装許容（v3.8）→ NATIONAL_SYMBOL_ISOLATION_RULE 普遍化 +
    cultural_styling_hint 必須要素方式 + role prop palette-aware contrast rule（v3.9）→
    **ROLE_VISUAL_IDENTITY_RULE 普遍化 + VISUAL_CONTRAST_PRINCIPLE 普遍化 +
    アジア 4 か国 二色化必須化（v3.10）**。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。
    v3.7 → v3.8 → v3.9 で人間検証実施 → **v3.10 プロンプトでの再検証が未**。
  - **④⑤⑥** 未着手。

- **作業分担：** `docs/WORKFLOW.md` 参照。
  - **main**：Phase 4 ③④⑤⑥ ランタイム本体（generate-images-local.mjs / image QC /
    validate-images / GAS 退役）。registry / lesson_NN.json / data/images/。
  - **worktree (`phase4-prompt-plan`)**：マスタープロンプトガイド v3.10+ / `build_prompts.py` /
    `data/image_prompts_*.json` / `invariants.mjs` の B hash 行。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

### A. 人間（main・worktree 両方に共通）：v3.10 で 5-7 件再検証

`.tmp_verify/prompts_image_prompts_lesson01_v3_10.md` を使い、以下を重点確認：

- **役割系（最重要）**：v3.9 で識別性が弱かった teacher / foreigner が
  signature 強化で判別可能になったか
  - **teacher**：lanyard name badge（胸元）+ 厚 textbook が visible に出るか。
    cardigan + 教科書だけの「学生 casual」と区別できるか
  - **foreigner**：phrasebook（cover 正面）+ crossbody day bag が出るか。
    teacher と signature 重複していないか
  - **student / doctor / company_employee**："MUST visibly" 化で v3.9 と同等以上か
- **役割系の prop 視認性**：v3.10 で principle から derive された PROP CONTRAST RULE が
  効いているか（v3.9 から記述ほぼ同じだが、principle 経由で fallback がより明確に）
- **国籍系アジア 4 か国**：v3.9 で「全身 muted gray-blue 単色」収束していたのが
  TWO-COLOR RULE で改善したか
  - 日本：top と trousers が別色か（white+red flag-like 回避）
  - 中国：top と trousers が別色か（red+yellow 回避）
  - 韓国：jeogori と trousers が別色か / otgoreum ribbon が contrasting 色か
  - ベトナム：áo dài body と trousers が別色か（伝統的に当然）
- **国籍系欧米南米 3 か国**：v3.9 から変更なし、回帰がないか確認
- **会社員背景純白問題**：v3.9 で 1 件出た（確率揺れ仮説）→ v3.10 で再現するか
  ／しないか確認。再現するなら STYLE_BIBLE 強調補強を v3.11 で検討

結果に応じて：
- **OK** → main で Phase 4 ④（image QC）の設計に進む
- **NG**（特定要素だけ不適切 等）→ **worktree セッションを起こして v3.11 で微調整**

### B. main で並行できること（任意・人間検証と独立）

- **registry 未登録 120 件のバックフィル**（`docs/PHASE_BACKLOG.md` 参照）
- **`word_新聞` audio sync 漏れ**：`npm run sync-registries` 1 発で解消見込み（未検証）
- **旧版アーカイブ整理**：`prompts/master_prompt_design_guide_v3_2.py` 〜 `_v3_9.py`、
  `data/image_prompts_lesson01_v3_2.json` 〜 `_v3_9.json` を archive 化（v3_10 で代替）。
  ※ ただしこれは「ガイド系ファイル」なので **worktree でやる**（WORKFLOW.md 準拠）。
- **Phase 4 ④ 設計の下調べ**：image QC 仕様（PNG サイズ / 透過 / パレット適合 /
  余白比率 等の機械検証）を `docs/REFERENCE.md` に下書き → 実装は ④ 着手時。

### C. worktree（必要になったら別セッションで起動）

- **v3.11 で発見済み問題を直す**：人間検証で NG だった要素だけ調整
- **scene-rich テンプレ A2 設計**（`docs/PHASE_BACKLOG.md` の D 退避項目）
- **将来 vocab_type 実装時の VISUAL_CONTRAST_PRINCIPLE 適用**：
  concrete_object / adjective PAIR_CONTRAST / abstract_concept 実装で
  v3.10 で書いた principle.sub_rules_by_situation を参照し、各 vocab_type の
  contrast rule を derive

worktree セッション開始手順（`docs/WORKFLOW.md` §「セッション開始 / 終了チェックリスト」）：
```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main       # main の進捗を取り込む
npm run validate               # baseline 確認
```

---

## ブロッカー

- なし。人間が v3.10 で 5-7 件確認すれば次のスライス（main の ④ or worktree の v3.11）が決まる。

---

## Phase 4 後 backlog（プランに明示済）

- **scene-rich テンプレ A2 設計**（v3.8 監査で発見・`docs/PHASE_BACKLOG.md` 参照）
- **lesson_01 既存 41 件 person 画像の再生成**（visual continuity）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様**（lesson_NN.json スキーマ拡張）
- **M-48 FAMILY_TEMPLATES 活用**（vocab_type=family 設計）
- **registry 未登録 120 件のバックフィル**
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**：vocab_type=concrete_object / action_verb / adjective を実装するタイミングで `{STRATEGY_BLOCK}` 転記を追加（worktree で実装、VISUAL_CONTRAST_PRINCIPLE 参照）

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=051af0bc7b64 / C=12×9 / D=55/55（3 WARN）PASS
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

# v3.10 検証：Gemini / AI Studio で .tmp_verify/prompts_image_prompts_lesson01_v3_10.md
# のプロンプトを試す。特に：
#   - 役割 5 件：teacher の lanyard name badge + 厚 textbook が visible か、
#     foreigner の phrasebook + crossbody bag が visible か、両者が判別可能か
#   - 国籍アジア 4 件：top と trousers が別色になったか
#   - 会社員：背景純白問題が再現するか
```
