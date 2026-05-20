# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（v3.6 で EXCEPTION 句を kind 別注入に修正・v3.6 プロンプトでの再検証待ち）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：**完了**。
  - **②** Imagen client + smoke：**完了**。
  - **v3.3 → v3.5 プロンプト辞書修正**：main に merge 済み。
  - **v3.5 検証で発覚した EXCEPTION 句の Imagen 解釈漏れバグ → v3.6 で修正**：
    - `vocabulary_person` テンプレ [CONSTRAINTS] のベタ書き EXCEPTION 句が
      役割系（医者・会社員・学生・大学生・先生）にも国旗バッジを描画させていた
      （word_学生 / word_会社員 の v3.5 生成画像で実機確認）。
    - v3.6 で `{NATIONALITY_EXCEPTION_BLOCK}` placeholder 化。`build_prompts.py` が
      kind=role に anti-flag 強表現（must NEVER include any flag）、
      kind=nationality に EXCEPTION 句、をそれぞれ注入。
    - invariants[B] hash = `b7fe983e895f`（v3.6）／ invariants[C] は v3_2-v3_6 各 12 件 PASS。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。
    v3.5 プロンプトで 2 件手動生成済み（旗バグ確認用 / data/images/ には未保存）。
    **v3.6 プロンプトでの見た目再検証が未。**
  - **④⑤⑥** 未着手。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること（人間：v3.6 で再検証）

`.tmp_verify/prompts_image_prompts_lesson01_v3_6.md` は v3.6 で再生成済み。

```
# Step 1（既に実行済み・上書きでも可）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_6.json --print-prompts
   → .tmp_verify/prompts_image_prompts_lesson01_v3_6.md

# Step 2（人間）: .md を開き、最低 2 件をテスト
#   - 役割系の例（word_学生 or word_会社員）：旗が消えていることを確認
#   - 国籍系の例（word_日本人 or word_アメリカ人）：旗が小さく付くことを確認
#   生成 → DL → data/images/{imageId}.png に保存

# Step 3: registry 反映を確認
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_6.json --sync-only
   → updated: N が出れば成功（status='generated'、imageUrl が data/images/ に置き換わる）

# Step 4: 見た目判断
#   - OK：残りをどうするか判断（手動継続 / 一部 auto / 全件 auto）
#   - NG：v3.6 のどこを更に直すかを別 worktree で検討

# 参考：API で 1 枚試したい場合（$0.04）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_6.json --limit 1
```

### main で並行できること（任意）

- **`word_新聞` audio sync 漏れ**：`npm run sync-registries` 1 発で解消見込み（未検証）。
- **旧版アーカイブ整理**：`prompts/master_prompt_design_guide_v3_2.py` / `_v3_3.py` /
  `_v3_4.py` / `_v3_5.py` を `archive/prompts/` へ、`data/image_prompts_lesson01_v3_2.json`
  〜 `_v3_5.json` を削除（v3_6.json で代替）。同時に `scripts/invariants.mjs` の
  C 検査パターンも v3_6 のみへ絞る選択肢。

---

## ブロッカー

- なし。人間が v3.6 で最低 2 件（role × 1 / nationality × 1）の見た目を確認すれば次が決まる。

---

## Phase 4 後 backlog（プランに明示済）

- **lesson_01 既存 41 件 person 画像の再生成**（M-47 多文化対応の visual continuity）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67・build_prompts.py 戦略展開時）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様**（lesson_NN.json スキーマ拡張）
- **M-48 FAMILY_TEMPLATES 活用**（vocab_type=family 設計）
- **registry 未登録 120 件のバックフィル**
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**：vocab_type=concrete_object / action_verb / adjective を実装するタイミングで `{STRATEGY_BLOCK}` 転記を追加

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=b7fe983e895f / C=12×5 / D=55/55（3 WARN）PASS
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
npm run validate-audio       # data/audio/*.mp3 の QC スペック検証
node scripts/_tts-smoke.mjs       # Phase 3 ② スモーク
node scripts/_imagen-smoke.mjs    # Phase 4 ② スモーク（実機 1 枚＝$0.04）
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
python scripts/build_prompts.py --lesson 1     # data/image_prompts_lesson01_v3_6.json 再生成
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 9/13/17 時

# 上の「今やること」Step 2：Gemini / AI Studio で v3.6 プロンプトを試す。
# 役割系 1 枚（旗が消える）+ 国籍系 1 枚（旗が小さく残る）の 2 件で OK 判定。
```
