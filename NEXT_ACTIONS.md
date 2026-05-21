# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-21（v3.8: 単一画像 diversity 問題の構造的修正 + 国別 phenotype + 現代化伝統衣装許容・人間再検証待ち）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了。
  - **②** Imagen client + smoke：完了。
  - **v3.3 → v3.7 プロンプト辞書**：完了済み（main merge 済み）。
  - **v3.8（今回）**：v3.7 検証で発覚した **5 件の教育目的との不整合** を一括修正：
    - (A) `"naturally diverse skin tone (multicultural variation)"` は単一画像生成では
      Imagen が中央値（medium-darker）を毎回選び、結果全員同じ肌色に。
      → skin tone / hair color / hair texture を **enumerate 化**（"pick one from: A / B / C"）。
    - (B) cultural_styling_hint が全て「modern X casual fashion」共通形 → garment-type
      レベルで分化。各国に 2-3 個の concrete 例を渡す（silhouette / 素材 / レイヤー）。
    - (C) `compose_role_subject` の `dark hair (dark brown to black)` 東アジア前提を撤廃
      → hair color も enumerate 化（黒/茶/金/赤）。
    - 国別 **apparent_features_hint** 新規追加（diversity-acknowledging な phenotype 範囲）。
    - hard_constraints をさらに緩和：caricature / 祭礼 / tourist cliché は禁止のまま、
      **現代化伝統衣装 / 日常文脈の伝統衣装を許容**（wagara 柄 / 日常 yukata / hanbok-inspired modern / 日常 áo dài 等）。
      境界線：「この国の人が普通の火曜日に着るもの」OK、「民族衣装ディスプレイ」NG。
    - 国旗ピンサイズ 5-6% 維持。
    - invariants[B] hash = `477425a647a6`（v3.8）／ C は v3_2-v3_8 各 12 件 PASS。
    - **退避**：`ROLE_BASED_GENERIC_PROFILES.scene_hints` 未使用問題（D）は
      `docs/PHASE_BACKLOG.md` に退避。v3.8 後の実機検証で要否を判断。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。
    v3.7 で 4 件手動検証 → 5 問題発覚 → v3.8 で構造修正。
    **v3.8 プロンプトでの再検証（最低 3-4 件、特に国籍）が未。**
  - **④⑤⑥** 未着手。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること（人間：v3.8 で再検証 — 弁別性チェック）

`.tmp_verify/prompts_image_prompts_lesson01_v3_8.md` は v3.8 で再生成済み。

```
# Step 1（既に実行済み・上書き可）
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_8.json --print-prompts

# Step 2（人間）: 最低 3-4 件、特に国籍系の弁別性を確認
#   - word_日本人 / word_中国人 / word_韓国人 を 1 セット
#     → 3 枚並べて「同じ人」に見えないこと
#     → wagara / 日常 yukata / cheongsam-inspired / K-fashion 等の文化要素が
#       caricature にならず自然に出ているか
#     → 肌色が「いつもの medium-darker」ではなく enumerate された範囲で
#       異なる選択が出ているか
#   - word_医者 / word_先生 のような role を 1-2 件
#     → 肌色 / 髪色が enumerate により多様に出るか
#     → pointer / otoscope が消えても識別可能か

# Step 3: registry 反映
npm run generate-images -- --prompts data/image_prompts_lesson01_v3_8.json --sync-only

# Step 4: 見た目判断
#   - OK：残り（特に lesson_01 12 件並べての overall 弁別性）を確認 → 運用判断
#   - NG：phenotype hint / cultural_styling_hint の文言を国別に調整
#         （特定の国の出力だけ修正したい等）
```

### main で並行できること（任意）

- **`word_新聞` audio sync 漏れ**：`npm run sync-registries` 1 発で解消見込み（未検証）。
- **旧版アーカイブ整理**：`prompts/master_prompt_design_guide_v3_2.py` 〜 `_v3_7.py`、
  `data/image_prompts_lesson01_v3_2.json` 〜 `_v3_7.json` を archive 化（v3_8 で代替）。

---

## ブロッカー

- なし。人間が v3.8 で 3-4 件の見た目を確認すれば次が決まる。

---

## Phase 4 後 backlog（プランに明示済）

- **scene-rich テンプレ A2 設計**（v3.8 監査で発見した scene_hints 未使用問題・`docs/PHASE_BACKLOG.md` に詳細）
- **lesson_01 既存 41 件 person 画像の再生成**（visual continuity）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67・build_prompts.py 戦略展開時）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様**（lesson_NN.json スキーマ拡張）
- **M-48 FAMILY_TEMPLATES 活用**（vocab_type=family 設計）
- **registry 未登録 120 件のバックフィル**
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**：vocab_type=concrete_object / action_verb / adjective を実装するタイミングで `{STRATEGY_BLOCK}` 転記を追加

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=477425a647a6 / C=12×7 / D=55/55（3 WARN）PASS
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
python scripts/build_prompts.py --lesson 1     # data/image_prompts_lesson01_v3_8.json 再生成
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 9/13/17 時

# 上の「今やること」Step 2：Gemini / AI Studio で v3.8 プロンプトを試す。
# 特に国籍 3-4 件で「同じ人に見えない」「肌色 / 服装が多様」「ステレオタイプでない」
# 「学習者がパッと識別できる」の 4 点を確認できれば OK 判定。
```
