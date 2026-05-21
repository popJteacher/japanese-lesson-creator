# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（v3.11 まで完了 / main = Phase 4 ランタイムに集中 / worktree = v3.11 の人間再検証待ち）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：**v3.11 まで完了**（hash `29407f70fc19`）。
    主な変更：EXCEPTION 句 placeholder 化（v3.6）→ ISOLATION_SAFE_PROPS_RULE +
    cultural_styling_hint（v3.7）→ skin tone enumerate / 国別 phenotype /
    現代化伝統衣装許容（v3.8）→ NATIONAL_SYMBOL_ISOLATION_RULE 普遍化 +
    cultural_styling_hint 必須要素方式（v3.9）→ ROLE_VISUAL_IDENTITY_RULE 普遍化 +
    VISUAL_CONTRAST_PRINCIPLE 普遍化 + アジア 4 か国 二色化（v3.10）→
    **PROMPT_LITERALIZATION_AVOIDANCE_RULE 普遍化 + footwear-mandatory rule +
    teacher lanyard 修正 + 日本人 yukata at-home 削除 + TWO-COLOR rationale
    明文化（v3.11）**。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。
    v3.7 → v3.8 → v3.9 → v3.10 で人間検証実施 → **v3.11 プロンプトでの再検証が未**。
  - **④⑤⑥** 未着手。

- **作業分担：** `docs/WORKFLOW.md` 参照。
  - **main**：Phase 4 ③④⑤⑥ ランタイム本体（generate-images-local.mjs / image QC /
    validate-images / GAS 退役）。registry / lesson_NN.json / data/images/。
  - **worktree (`phase4-prompt-plan`)**：マスタープロンプトガイド v3.11+ / `build_prompts.py` /
    `data/image_prompts_*.json` / `invariants.mjs` の B hash 行。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

### A. 人間（main・worktree 両方に共通）：v3.11 で 5-7 件再検証

`.tmp_verify/prompts_image_prompts_lesson01_v3_11.md` を使い、以下を重点確認：

- **先生（最重要）**：lanyard ID badge が **rectangular blank**（鉛筆マーク無し）
  になったか。circular medallion pendant に誤解されていないか
- **日本人（最重要）**：**裸足ではなく footwear を履いているか**。yukata 選択時
  でも outdoor footwear が visible か。普遍 FOOTWEAR RULE が全 12 件に効くか
- **アメリカ人**：v3.10 で出た「0 度正面 view」が再現するか（しなければ確率揺れ確定）
- **外国人**：v3.10 で未検証だった signature（phrasebook + crossbody bag）が
  visible に出るか、student と区別可能か（学生 / 大学生は同じ role_key=student
  なので両者は意図的に同じ見た目になる）
- **その他 9 件**：v3.10 から regression がないか

結果に応じて：
- **OK** → main で Phase 4 ④（image QC）の設計に進む
- **NG**（特定要素だけ不適切 等）→ **worktree セッションを起こして v3.12 で微調整**

### B. main で並行できること（任意・人間検証と独立）

- **registry 未登録 120 件のバックフィル**（`docs/PHASE_BACKLOG.md` 参照）
- **`word_新聞` audio sync 漏れ**：`npm run sync-registries` 1 発で解消見込み（未検証）
- **旧版アーカイブ整理**：`prompts/master_prompt_design_guide_v3_2.py` 〜 `_v3_10.py`、
  `data/image_prompts_lesson01_v3_2.json` 〜 `_v3_10.json` を archive 化（v3_11 で代替）。
  ※ ただしこれは「ガイド系ファイル」なので **worktree でやる**（WORKFLOW.md 準拠）。
- **Phase 4 ④ 設計の下調べ**：image QC 仕様（PNG サイズ / 透過 / パレット適合 /
  余白比率 等の機械検証）を `docs/REFERENCE.md` に下書き → 実装は ④ 着手時。

### C. worktree（必要になったら別セッションで起動）

- **v3.12 で発見済み問題を直す**：人間検証で NG だった要素だけ調整
- **PROMPT_LITERALIZATION_AVOIDANCE_RULE の audit pass**：v3.11 で新設した本ルール
  の audit_checklist_for_authors を使って、ガイド全体を grep 監査（"such as" /
  "e.g." / "may carry" / "small icon" 等）。新たな literalize リスクが
  見つかれば該当箇所を v3.12 で書き直し
- **scene-rich テンプレ A2 設計**（`docs/PHASE_BACKLOG.md` の D 退避項目）
- **将来 vocab_type 実装時の VISUAL_CONTRAST_PRINCIPLE 適用**：concrete_object /
  adjective PAIR_CONTRAST / abstract_concept 実装で principle.sub_rules_by_situation
  を参照し、各 vocab_type の contrast rule を derive

worktree セッション開始手順（`docs/WORKFLOW.md` §「セッション開始 / 終了チェックリスト」）：
```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main       # main の進捗を取り込む
npm run validate               # baseline 確認
```

---

## ブロッカー

- なし。人間が v3.11 で 5-7 件確認すれば次のスライス（main の ④ or worktree の v3.12）が決まる。

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
npm run validate             # invariants A=v7.4 / B=29407f70fc19 / C=12×10 / D=55/55（3 WARN）PASS
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

# v3.11 検証：Gemini / AI Studio で .tmp_verify/prompts_image_prompts_lesson01_v3_11.md
# のプロンプトを試す。特に：
#   - 先生：lanyard が rectangular blank ID badge か（鉛筆マーク無し）
#   - 日本人：footwear 着用か（裸足が解消したか）
#   - 外国人：v3.10 で未検証 → phrasebook + crossbody bag が visible か
#   - アメリカ人：正面 view が再現しないか（確率揺れ確定なら構造修正不要）
```
