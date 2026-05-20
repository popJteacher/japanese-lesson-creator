# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 4 ③ コード完了 / v3.5 見た目 1 枚の人間検証待ち）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：**完了**。
  - **②** Imagen client + smoke：**完了**（実機 1 枚 PNG / billing 確認）。
  - **v3.3 → v3.5 プロンプト辞書修正**：**main に merge 済み**（`phase4-prompt-plan` fast-forward）。
    `npm run validate`：B = `d6bf4c4eb90d` / C = v3_2/v3_3/v3_4/v3_5 各 12 件 / D = 55/55（3 WARN）PASS。
  - **③** `scripts/generate-images-local.mjs`：**コード完了**（`--print-prompts` / `--sync-only` / auto の 3 モード）。
    実機 0 枚。v3.5 プロンプトでの見た目検証が未。
  - **④⑤⑥** 未着手。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること（人間：v3.5 見た目を 1 枚で確認）

API 課金ゼロで 1 枚だけ手動確認するルート。

```
# Step 1: プロンプト Markdown を出す（既に走らせて出力済み・再実行で上書き）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_5.json --print-prompts
   → .tmp_verify/prompts_image_prompts_lesson01_v3_5.md に 12 件分

# Step 2（人間）: .md を開き 1 件（例：word_医者）のコードブロックをコピペ
#   → Gemini（gemini.google.com）または AI Studio Image で生成（1:1 / 1K）
#   → DL して data/images/word_医者.png に保存（imageId そのまま）

# Step 3: registry 反映を確認
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_5.json --sync-only
   → updated: 1 が出れば成功
     registry.entries["word_医者"].images[0].imageUrl が
     旧 Drive URL → "data/images/word_医者.png" に置き換わる、status='generated'

# Step 4: 見た目判断 → 次セッションで報告
#   - OK：残り 11 件をどうするか判断（手動継続 / 一部 auto / 全件 auto）
#   - NG：v3.5 プロンプトのどこを直すかを別 worktree で検討

# 参考：API で 1 枚試したい場合（$0.04）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_5.json --limit 1
```

### main で並行できること（任意）

- **`word_新聞` audio sync 漏れ**：`npm run sync-registries` 1 発で解消見込み（未検証）。
- **整理コミット（任意）**：`prompts/master_prompt_design_guide_v3_2.py` / `_v3_3.py` / `_v3_4.py`
  を `archive/prompts/` へ移し、`data/image_prompts_lesson01_v3_2.json` / `_v3_3.json` / `_v3_4.json`
  を削除（_v3_5.json で代替）。同時に `scripts/invariants.mjs` と `scripts/build_prompts.py`
  を v3_5 のみ参照に絞る必要あり。

---

## ブロッカー

- なし。人間の 1 枚見た目検証で ③ の閉じ方が決まる。

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
npm run validate             # invariants A=v7.4 / B=d6bf4c4eb90d / C=12×4 / D=55/55（3 WARN）PASS
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
python scripts/build_prompts.py --lesson 1     # data/image_prompts_lesson01_v3_5.json 再生成
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 9/13/17 時

# 上の「今やること」Step 2：Gemini / AI Studio で 1 枚だけ生成し
# data/images/word_医者.png として保存。
```
