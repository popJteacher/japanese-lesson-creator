# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（v3.3 実装完了・main への merge 待ち）

---

## 現在地（この worktree `phase4-prompt-plan`）

- **Phase 0／1／2／3：完了。**
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **v3.3 プロンプト辞書修正（72 件監査）：**
    本 worktree で Step 1〜7 **実装完了**。
    - apply_v3_3.py（79 patch・件数アサート全件 OK） → archive/prompts/
    - prompts/master_prompt_design_guide_v3_3.py 生成（hash `80de1a8e675f`）
    - scripts/invariants.mjs を v3.3 hash + C4/C5 type 分岐に更新
    - scripts/build_prompts.py を v3.3 ガイド + multicultural compose に更新
    - data/image_prompts_lesson01_v3_3.json（person 12 件・pre-flight PASS）
    - docs/REFERENCE.md §3 / §9 / §10 を v3.3 に同期
    - archive/prompts/master_prompt_gemini_stabilization_legacy.py（PART 7 保全）
    - **`npm run validate` 確認**：B PASS / C PASS（v3_2.json と v3_3.json 共に 12 件 OK）
      D 55 件は ffprobe 環境エラー（pre-existing・本作業外）
  - **③** バッチ生成：未着手（v3.3 を main に merge 後に着手）。

---

## 今やること

1. **main 側に戻って merge する**：
   ```
   git checkout main
   git merge phase4-prompt-plan
   # conflict 想定: NEXT_ACTIONS.md（main 側の merge 待ち記述と本 worktree の完了記述）
   #               → 本 worktree 側を採用してから書き直す
   npm run validate    # B PASS / C PASS 再確認
   ```

2. **v3.2 → v3.3 移行の後片付け（任意・別コミット）**：
   - `prompts/master_prompt_design_guide_v3_2.py` を `archive/prompts/` へ移動
   - `data/image_prompts_lesson01_v3_2.json` を削除（v3_3.json で置換済）

3. **Phase 4 ③ 着手**：
   - `scripts/generate-images-local.mjs` 実装
   - lesson_01 person 12 件で実機検証（M-47 多文化対応の画像品質確認 = plan の Step 8 相当）

---

## バックログ（Phase 4 後に倒す）

- **lesson_01 既存 41 件 person 画像の再生成**（M-47 適用後の visual continuity 解消）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67・Phase 4 ②で実装余地）
- **テンプレ D/H/J を {STRATEGY_BLOCK} 構造化**（M-15 wave・本 v3.3 では未実装）
  - 詳細は `docs/PROMPT_GUIDE_V3_3_PATCHES.md` Wave 4
  - 本 v3.3 では構造変更を deferring し、後日 v3.4 で apply_v3_4.py 化を想定
- **補助辞書のキー正規化**（M-7 wave・本 v3.3 では未実装）
  - 「会社(company office)」→「会社」+ `_en` フィールドへの構造変更
  - build_prompts.py の lookup ロジック改修を伴うため別パッチに分割
- **NAMED_CHARACTER_PROFILES 生成パスの実装**（M-16・Phase 4 後の named_character 拡張）
- **registry 未登録 120 件のバックフィル**（`docs/PHASE_BACKLOG.md` Phase 4 セクション）
- **`word_新聞` の audio sync 漏れ**（`npm run sync-registries` 1 発で解消見込み）

---

## ブロッカー

なし。本 worktree から main への merge を実施できる状態。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=hash 80de1a8e675f / C=12+12 件 / D=音声 QC（環境）
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
python archive/prompts/apply_v3_3.py    # v3.2 → v3.3 再生成（79 patch・件数アサート全件 OK）
python scripts/build_prompts.py --lesson 1   # data/image_prompts_lesson01_v3_3.json 再生成
```
