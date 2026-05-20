# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**

**最終更新：** 2026-05-20（v3.3 → v3.4 完了 / 残 M-15 wave のみ次セッション）

---

## 現在地（worktree `phase4-prompt-plan`）

- **Phase 4 ① ②**：完了。
- **v3.3 (72 件監査一括是正)**：完了（apply_v3_3.py, hash `80de1a8e675f`）。
- **v3.4 (v3.3 deferred + M-7 wave 補助辞書キー正規化)**：完了（apply_v3_4.py, hash `738af3e76983`）。
  - 個別: M-5 / M-10 / M-11 / M-27/M-40 / M-32 / M-36 / M-39/M-41 / M-6（M-7 統合）
  - M-7 wave: 5 補助辞書（BUILDING_CUES / OBJECT_SIGNATURES / ABSTRACT_METAPHORS / SPATIAL_GRID_PATTERNS / VISUAL_SYMBOLS）をキー正規化＋`_en` フィールド追加
  - M-52: ABSTRACT_METAPHORS 全 13 件に `composition_mood` 追加
  - PART 8.5 プレースホルダ出所表新設
  - `npm run validate`: B PASS (`738af3e76983`) / C PASS (v3_2.json, v3_3.json, v3_4.json 各 12 件)

- **Phase 4 ③** バッチ生成：未着手（v3.4 を main に merge 後）。

---

## 残作業

### 1. **M-15 wave**（次セッションで apply_v3_5.py として実装）

テンプレ D / H / J を `{STRATEGY_BLOCK}` 構造化（PATCHES.md Wave 4）：

- テンプレ D（2 戦略: OBJECT_ALONE / HAND_HOLDING）
- テンプレ H（5 戦略: MOTION_ARROW / OUTCOME / BEFORE_AFTER / SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES）
- テンプレ J（3 戦略: PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY）

実装：
1. 新規 PART 4.10 OBJECT_STRATEGIES / 4.11 ACTION_VERB_STRATEGIES / 4.12 ADJECTIVE_STRATEGIES を辞書として追加
2. テンプレ本文の `[STRATEGY: ...]` ブロックを `{STRATEGY_BLOCK}` プレースホルダに置換
3. HOW_TO_USE Step 3-D / 5-B / 6.5-B の参照を新 PART に向け直し
4. `scripts/build_prompts.py` に戦略選択 → ブロック展開ロジック実装（非 person 拡張時）
5. invariants C2/C3 への影響確認（テンプレ D/H/J は invariants C の対象外なので影響なし見込み）

理由で次回送り：構造変更が大きく、build_prompts.py の戦略選択ロジックを新規実装する必要があるため、別パッチとした。

### 2. **main への merge**

```
git checkout main
git merge phase4-prompt-plan
# conflict 想定: NEXT_ACTIONS.md（採用は本 worktree 側）
npm run validate    # B PASS / C PASS 再確認
```

### 3. **整理（任意・別コミット）**

- `prompts/master_prompt_design_guide_v3_2.py` / `_v3_3.py` を `archive/prompts/` へ移動
- `data/image_prompts_lesson01_v3_2.json` / `_v3_3.json` を削除（_v3_4.json で代替）

### 4. **Phase 4 ③ 以降**

- `scripts/generate-images-local.mjs` 実装
- lesson_01 person 12 件で実機検証（M-47 多文化対応 + M-7 キー正規化の画像品質確認）

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

なし。M-15 wave を実装するか、現状の v3.4 で main merge するかを次セッションで判断。

---

## 直近の確定コマンド

```
npm run validate             # B=hash 738af3e76983 / C=12+12+12 件 / D=音声 QC（環境）
npm run missing-assets
python archive/prompts/apply_v3_3.py    # v3.2 → v3.3 再生成（79 patch）
python archive/prompts/apply_v3_4.py    # v3.3 → v3.4 再生成（63 patch）
python scripts/build_prompts.py --lesson 1   # data/image_prompts_lesson01_v3_4.json 再生成
```
