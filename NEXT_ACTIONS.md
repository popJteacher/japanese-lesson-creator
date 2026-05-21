# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（worktree v3.9〜v3.11.1 + 旧版 archive 退避 取り込み完了 / Imagen API 疎通再確認済 / Phase 4 ⑥ preparation 完了 / Phase 4 ③ 本番投入準備中）

---

## v3.11 / v3.11.1 の位置づけ（重要）

- **v3.11**：設計本体（hash `29407f70fc19`）。Imagen 4 API 経由なら `--aspect 1:1` パラメータでアスペクト比指定するため inline directive 不要。
- **v3.11.1**：v3.11 を 1 か所だけ変更した派生（hash `a79e54a29e51`、現 active）。SCENE 句冒頭に inline で `ASPECT RATIO 1:1` directive を注入。**nanobanana (Gemini chat) のような API パラメータを持たない経路で人間検証する用**。
- **Imagen API は疎通中**（`npm run check-imagen-key` で 3 モデル全検出済）。worktree 側 commit baa2c92 の「AI Studio 一時的使用不可」は誤認の可能性大 — Phase 4 ③ 本番投入の判断は `--aspect 1:1` を渡せばどちらでも可。
- **rollback 手順**（必要になったとき）：`scripts/build_prompts.py` の `GUIDE_PATH` と `scripts/invariants.mjs` の `promptGuide` / `promptGuideExpectedHashPrefix` を v3.11 値（`29407f70fc19`）に戻す。**worktree 側で実施**。

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：完了（`check-imagen-key` PASS）。
  - **②** Imagen client + smoke：完了。
  - **マスタープロンプトガイド**：v3.11 完了 / v3.11.1 active。主な変更：
    EXCEPTION 句 placeholder 化（v3.6）→ ISOLATION_SAFE_PROPS_RULE + cultural_styling_hint（v3.7）→
    skin tone enumerate / 国別 phenotype / 現代化伝統衣装許容（v3.8）→
    NATIONAL_SYMBOL_ISOLATION_RULE 普遍化 + cultural_styling_hint 必須要素方式（v3.9）→
    ROLE_VISUAL_IDENTITY_RULE + VISUAL_CONTRAST_PRINCIPLE 普遍化 + アジア 4 か国二色化（v3.10）→
    PROMPT_LITERALIZATION_AVOIDANCE_RULE + footwear-mandatory + teacher lanyard 修正 + 日本人 yukata at-home 削除（v3.11）→
    inline ASPECT RATIO 1:1 directive（v3.11.1, nanobanana 用）。
  - **③** `scripts/generate-images-local.mjs`：コード完了（3 モード）。**v3.11.1 プロンプトでの人間再検証が未**。
  - **④** image QC：設計下書きを `docs/PHASE_BACKLOG.md` に退避。校正手順（Step 1〜4・$0.80 / 20 枚）から実装。
  - **⑤** 未着手。
  - **⑥** preparation 完了。`archive/gas_old/generateImages_v5_3_phase4_retired.gs`
    に退役対象 line range（750-2552 / 約 1803 行）と ⑥ 着手手順 10 ステップを
    manifest として記載。**実コード切り出しは ⑥ 着手時**（前提：人間検証 § A
    OK / ④⑤ 完了 / missing-assets null_imageUrl ≈ 0）。
- 旧版 v3.2〜v3.8 は `archive/prompts/` `archive/data_old/` に退避済（worktree 1791a43）。
- 作業分担：`docs/WORKFLOW.md` 参照。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

### A. 人間：v3.11.1 で 5-7 件再検証（nanobanana で）

`.tmp_verify/prompts_image_prompts_lesson01_v3_11_1.md` を使い、重点：

- **アスペクト比**：全件 1:1 SQUARE 出力か（v3.11.1 inline directive 動作）
- **先生**：lanyard が rectangular blank ID badge（鉛筆マーク無し）か
- **日本人**：footwear 着用か（裸足解消）
- **アメリカ人**：v3.10 で出た 0 度正面 view 再現するか（しなければ確率揺れ確定）
- **外国人**：phrasebook + crossbody bag が visible か（student と区別可能か）
- **その他 9 件**：v3.10 からの regression なし

結果に応じて：
- **OK** → main で Phase 4 ④（image QC）校正・実装に進む（`docs/PHASE_BACKLOG.md`「画像 QC 仕様」Step 1〜4）
- **NG** → worktree セッションを起こして v3.12 で微調整

### B. main で並行可能（任意・人間検証と独立）

- **なし**（⑥ preparation は完了済。次の main 作業は Phase 4 ④ 着手で、これは
  § A 検証 OK が前提）。

### C. worktree（必要になったら別セッションで起動）

- **v3.12 で発見済み問題を直す**：人間検証で NG だった要素だけ調整
- **`PROMPT_LITERALIZATION_AVOIDANCE_RULE` の audit pass**：v3.11 で新設したルールの
  audit_checklist_for_authors を使い、ガイド全体を grep 監査（"such as" / "e.g." /
  "may carry" / "small icon" 等）。新たな literalize リスクを v3.12 で書き直し
- **scene-rich テンプレ A2 設計**（`docs/PHASE_BACKLOG.md` D）
- **将来 vocab_type 実装時の VISUAL_CONTRAST_PRINCIPLE 適用**

worktree セッション開始手順（`docs/WORKFLOW.md`）：
```
cd .claude/worktrees/image-prompt-plan
git merge --ff-only main       # main の進捗を取り込む
npm run validate               # baseline 確認
```

---

## ブロッカー

- なし。人間が v3.11.1 で 5-7 件確認すれば次のスライス（main の ④ or worktree の v3.12）が決まる。

---

## Phase 4 後 backlog（プランに明示済）

- **scene-rich テンプレ A2 設計**
- **lesson_01 既存 41 件 person 画像の再生成**（visual continuity）
- **OBJECT_SIGNATURES.avoid 取り込み**（M-67）
- **NAMED_CHARACTER_PROFILES 生成パス実装**（M-16）
- **M-23 テンプレ J 対義語仕様**（lesson_NN.json スキーマ拡張）
- **M-48 FAMILY_TEMPLATES 活用**（vocab_type=family 設計）
- **`scripts/build_prompts.py` の D/H/J 戦略展開ロジック**：vocab_type=concrete_object / action_verb / adjective を実装するタイミングで `{STRATEGY_BLOCK}` 転記を追加（worktree で実装、VISUAL_CONTRAST_PRINCIPLE 参照）

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=a79e54a29e51 (v3.11.1 active) / C=12×4 / D=55/55（3 WARN）PASS
npm run missing-assets       # image 441 件未生成（registry stub あり） / audio 108 件未生成
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]    # Sheet 未登録 id を空 stub で追加（idempotent）
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

# v3.11.1 検証（nanobanana / Gemini chat で）：
# .tmp_verify/prompts_image_prompts_lesson01_v3_11_1.md のプロンプトを貼る。
#   - 出力が 1:1 SQUARE か（v3.11.1 inline ASPECT RATIO directive 動作確認）
#   - 先生：lanyard が rectangular blank ID badge か（鉛筆マーク無し）
#   - 日本人：footwear 着用か（裸足が解消したか）
#   - 外国人：v3.10 で未検証 → phrasebook + crossbody bag が visible か
#   - アメリカ人：正面 view が再現しないか（確率揺れ確定なら構造修正不要）
```
