# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**

**最終更新：** 2026-05-20（v3.5 完了 / M-15 wave 反映済・残作業は main merge）

---

## 現在地（worktree `phase4-prompt-plan`）

- **Phase 4 ① ②**：完了。
- **v3.3 (72 件監査一括是正)**：完了（apply_v3_3.py, hash `80de1a8e675f`）。
- **v3.4 (v3.3 deferred + M-7 wave 補助辞書キー正規化)**：完了（apply_v3_4.py, hash `738af3e76983`）。
- **v3.5 (M-15 wave: D/H/J を `{STRATEGY_BLOCK}` 構造化)**：完了（apply_v3_5.py, hash `d6bf4c4eb90d`, 11 patch）。
  - テンプレ D 本文 → `{STRATEGY_BLOCK}` + 新規 PART 4.10 OBJECT_STRATEGIES（2 戦略）
  - テンプレ H 本文 → `{STRATEGY_BLOCK}` + 新規 PART 4.11 ACTION_VERB_STRATEGIES（5 戦略）
  - テンプレ J 本文 → `{STRATEGY_BLOCK}` + 新規 PART 4.12 ADJECTIVE_STRATEGIES（3 戦略）
  - HOW_TO_USE Step 3-C / Step 5-D / Step 6.5-C を新 PART に向け直し
  - PART 8.5 PLACEHOLDER ORIGINS の `{STRATEGY_BLOCK}` 行を「予定」→「実装済」に
  - HOW_TO_USE Step 5-A の `SYMBOLIC_MOTION` → `SYMBOLIC_MOTION_LINES` 名称統一（v3.5 監査で発見した v2.4 起源の truncated 表記。M-15 wave で lookup key 化したため同期修正）
  - `npm run validate`: B PASS (`d6bf4c4eb90d`) / C PASS (v3_2/v3_3/v3_4/v3_5.json 各 12 件)
  - build_prompts.py の戦略展開ロジックは Phase 4 ② で同期実装（本 v3.5 はガイド側構造変更のみ）

- **Phase 4 ③** バッチ生成：未着手（v3.5 を main に merge 後）。

---

## 残作業

### 1. **main への merge**

```
git checkout main
git merge phase4-prompt-plan
# conflict 想定: NEXT_ACTIONS.md（採用は本 worktree 側）
npm run validate    # B PASS / C PASS 再確認
```

### 2. **整理（任意・別コミット）**

- `prompts/master_prompt_design_guide_v3_2.py` / `_v3_3.py` / `_v3_4.py` を `archive/prompts/` へ移動
- `data/image_prompts_lesson01_v3_2.json` / `_v3_3.json` / `_v3_4.json` を削除（_v3_5.json で代替）

### 3. **Phase 4 ③ 以降**

- `scripts/generate-images-local.mjs` 実装
- lesson_01 person 12 件で実機検証（M-47 多文化対応 + M-7 キー正規化の画像品質確認）
- build_prompts.py に D/H/J 用の戦略展開ロジック実装（OBJECT_STRATEGIES / ACTION_VERB_STRATEGIES / ADJECTIVE_STRATEGIES から `{STRATEGY_BLOCK}` を 1 つ転記）→ vocab_type=concrete_object / action_verb / adjective を追加するタイミング

---

## Phase 4 後 backlog（plan に明示済）

- **lesson_01 既存 41 件 person 画像の再生成**（M-47 適用後の visual continuity 解消）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67・Phase 4 ② 拡張時に build_prompts.py へ）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23: テンプレ J 対義語仕様**（lesson_NN.json スキーマ拡張）
- **M-48: FAMILY_TEMPLATES 活用**（vocab_type=family 設計）
- **registry 未登録 120 件のバックフィル**
- **`word_新聞` の audio sync 漏れ**（`npm run sync-registries` 1 発で解消見込み）

---

## ブロッカー

なし。v3.5 で M-15 wave 完了。次は main merge → Phase 4 ③（バッチ生成）。

---

## 直近の確定コマンド

```
npm run validate             # B=hash d6bf4c4eb90d / C=12+12+12+12 件 / D=音声 QC（環境）
npm run missing-assets
python archive/prompts/apply_v3_3.py    # v3.2 → v3.3 再生成（79 patch）
python archive/prompts/apply_v3_4.py    # v3.3 → v3.4 再生成（63 patch）
python archive/prompts/apply_v3_5.py    # v3.4 → v3.5 再生成（10 patch）
python scripts/build_prompts.py --lesson 1   # data/image_prompts_lesson01_v3_5.json 再生成
```
