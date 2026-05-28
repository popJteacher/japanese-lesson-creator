# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-28 X-g Phase 1 着地 ✅ (Goi_List skill 統合: _sourceTag schema + B-14/15/16 lint + lesson_01/02 migration)

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 β1-v0.3 / γ2 / X-a 全 4 / X-b 部分 / X-c (1〜7) / X-d / X-e / X-f / X-g Phase 1 完了** ✅
- **X-g Phase 1 (今 session)** Goi_List skill 統合の再発防止土台:
  - **`_sourceTag` enum 定義** (5 値): `pdf_introduction` / `goi_list_n5_supplement` / `teacher_addition` / `inherited_from_earlier_lesson` / `practice_only`。
  - **`scripts/lib/migrate-vocab-source-tag.mjs`**: lesson_01 全 17 vocab → `pdf_introduction`、lesson_02 全 25 vocab → 15 件 `pdf_introduction` + 10 件 `goi_list_n5_supplement` (X-f の p5_p6_thing が Goi_List N5 由来の commit log 明記)。
  - **validate.mjs**: `_sourceTag` 必須化 + enum 検証。
  - **lesson-check.mjs B-14/15/16 追加**: vocab×sentence 整合性 WARN / `_sourceTag` 必須 ERROR / `goi_list_n5_supplement` の Goi_List N5 実在 ERROR。
  - **docs**: REFERENCE.md §6-1 / lesson-check.md / lesson-scaffold.md 更新。scaffold に Phase 2 予告 (Goi_List N5 補強候補対話フェーズ) を入れる。
- **X-g Phase 2 (次セッション)**: lesson-scaffold skill に「PDF 導入語彙確定後の Goi_List N5 補強候補対話フェーズ」を追加。user が y/n/skip で個別判定可、部分 NG なら追加候補提示可。採用語に `goi_list_n5_supplement` 自動付与。

### スナップショット（2026-05-28 X-g Phase 1 着地直後・コマンドで再導出）

```
image_registry:  496 entries / 478 active / 443 missing (lesson_02 ex_L02_021〜035 等の生成待ち)
audio_registry:  466 entries / 459 active (変化なし)
invariants:      A v7.5 / B 891b73f5ae2d / B' 652aa0a3cbe3 / C / D 439/459 PASS (20 LUFS ERROR は既知制約) / D' 451/459
lesson_01:       v1.3 + _sourceTag migration (17 vocab 全 pdf_introduction)
lesson_02:       v2.14 + _sourceTag migration (15 pdf_introduction + 10 goi_list_n5_supplement)
lesson-check 02: ERROR 2 (既存 B-6-2 p2 / B-6 p4 — 本 plan スコープ外) / WARN 16 (新 B-14 が 10 件発火・user 判断待ち) / INFO 2 / TODO 0
lesson-check 01: ERROR 2 (既存 B-6 p1/p3) / WARN 8 (新 B-14 が 4 件発火) / INFO 0 / TODO 0
git:             main → X-g Phase 1 commit 予定
```

---

## active

### 次セッション着手点候補（user 判断）

1. **X-g Phase 2: lesson-scaffold への Goi_List N5 補強候補対話フェーズ追加** — 本セッションで土台 (lint + schema + migration) が完了。次は能動選定の本体。lesson_03 着手前 or 並行で実装。Step 3 後半に N5 422 件から各 pattern 文型コンテキスト沿いの候補抽出 → user との y/n/skip 対話 → 採用語に `goi_list_n5_supplement` 自動付与 (B-16 検証通過必須)。
2. **B-14 WARN 14 件の人間 review** — 本セッションで検出された「vocab カード提示のみ・sentence 不在」14 件 (lesson_01 4 件: アメリカ人/ブラジル人/ベトナム人/スペイン人 / lesson_02 10 件: 腕時計/鉛筆/雑誌/新聞/ノート/傘/かぎ/辞書/教科書/机) は pedagogy 上正常 (ABC 教科書の典型「全 vocab をカードで提示するが例文では一部のみ使う」パターン)。対処は `_sourceTag="practice_only"` 付与で B-14 を skip するか、例文追加 (推奨は前者・cheap)。本セッションでは未対処。
3. **UI フォームの 例文/練習しよう を文型ブロック化** — 現状 example/practice は単一 stage entry。lesson 側は文型ブロック構造 (example_pN / practice_pN × N) なのに UI から制御不能。`rebuildStages` 改修で文型ごとに 3 つ組 stage を生成。
4. **p5/p6 新 vocab 10 件 + 例文画像 (ex_L02_034/035 更新版) の画像生成** — `/generate-image-prompt` で word_カメラ〜word_靴 + ex_L02_034 (どのカメラ) / ex_L02_035 (どの自転車) の prompt 起草 → 画像生成。X-f で pending のまま残置。
5. **applicationExamples の render 先実装** — 会話例スライド (新 `flow.type='dialogue_example'`) or 教案 docx の応用ガイド section。pedagogy review 必要、1-2 セッション規模。
6. **Phase γ1 (スライド音声移植)** — homework の `.audio-btn` 機構を slide_html.js に移植。user 都合で後送り中。
7. **Phase δ (アクティビティ完成・3-5 セッション想定)** — δ1 画像組み込み 6 ブロック / δ2 applicability メタデータ 57 件 / δ3 recommender.js + form UI 統合
8. **lesson_03 着手** — `/lesson-scaffold 03 --pdf data/sources/pdfs/第03課.pdf` で新フローを実機検証 (skill の初本番運用)。X-g Phase 2 完了後の方が望ましい (Goi_List 統合が初実証になる)。

### 既存 ERROR (lesson-check で残る・本 plan のスコープ外)

- lesson_01 p1/p3: `practiceTemplates` が 1 件 (B-6) — v2.11.4 で意図的に 1 template に削減した経緯。ルール側 or lesson 側を更新するか判断保留
- lesson_02 p2: `practiceTemplates` 全件 blank=0 (B-6-2) — 「これは何ですか/それは何ですか/あれは何ですか」hint-only template 3 件のみ。pedagogy 上 input なしが意図的なら lesson_02 p2 templates の見直し or B-6-2 緩和 (p2 のような疑問固定 pattern は除外) を検討
- lesson_02 p4: `practiceTemplates` が 1 件 (B-6) — どれ pattern は単一 template が pedagogy 上自然

### 並行待機 / backlog

- **applicationExamples の render 先実装** (上記 5)
- **Q 単体画像への再生成**: examples sentence が Q 形式に整理された後、対応する画像 (ex_L02_021〜023/027/028/029/030/034/035 等) を Q 単体場面に最適化。`--dry-run` + `--limit` 安全帯で別 session
- **lesson_01 intro_act_p1 世界地図 Drop&Drag**: act_picture_card_vocab_intro の character_card_grid layout に world_map スロット併存。slide_html.js layout 改修 + lesson_01 materialNeeds 移行。1 セッション規模
- **lesson_plan_docx.js の applicationExamples 対応**: 教案 docx に「応用ガイド」section を追加
- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
- **同表記2読み恒久対策**：`pickCatalogEntry` を lesson_*.json reading 確定に切替
- **lesson_02 以降の v4.0.4 building 移行**：病院 / 銀行 / 駅 / スーパー を PART 5.10 BUILDING_CUES に追加
- **(b-3) 生成プロンプト側で超過漢字を平易表現に置換**
- **016 銀行 §3.9.3.B 強化 (v4.0.9)**：lesson_02 で銀行 entry 再登場時に Gemini consult 第三回相当で詰める
- **§3.9.3.B / §3.9.8.A 表の拡張**: lesson_02+ で 新 institution / 新 occupation token が出たら追加
- **`/generate-image-prompt` skill の完全 universal 化**：lesson_02 以降は skill の Route 1/2 機械判定 + lookup table 動的 injection に移行 (skill md には仕様 §10-13 記載済 / 実 invoke テストは未実施)

### 触らない既知制約

- **invariants[D] 20 LUFS ERROR**（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題・触らない）
- **invariants[D] 80 WARN**（target ±1.5 を僅かに超過・TP 制約等で正常範囲）
- **lesson-check B-8** (pattern minutes 8 分 > 7 上限) は既存問題で独立

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成   ✅ 全完了
Phase β  宿題完成
  β1 ✅ v0.1 正解判定 (D)・homework_html.js 改修・user 試聴 OK
  β1 ✅ v0.3 multi-template render + uniform judge UI
Phase γ  スライド完成
  γ1     音声再生（homework .audio-btn 機構を移植）  ← user 都合で後送り
  γ2     デザイン微修正  ← 全 12 ブロック視聴 OK ✅
Phase X (γ2 派生・user 要望)
  X-a    課マスター作成 skill suite                                ✅ 全完了
  X-b    lesson.targetStudentLevel + 上級語 pill 機構             ✅ 部分着地
  X-d    復習機能 + intro_activity fallback テンプレ修正           ✅ 着地
  X-c    例文 revision + v4.0.5 PERSON ref + v4.0.6/7/8           ✅ 完了
  X-e    applicationExamples schema (data 整備 + skill 強制)       ✅ 着地
  X-f    復習 UI 連動 fix + intro_act fallback fix + l02 p5/p6     ✅ 着地
  X-g    Goi_List skill 統合
    Phase 1 ✅ _sourceTag schema + B-14/15/16 lint + migration     ← 今 session
    Phase 2 ⏳ lesson-scaffold への Goi_List N5 補強対話フェーズ    ← 次 session
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
```

---

## 確定仕様

### vocab `_sourceTag` schema (X-g Phase 1 確定 / 2026-05-28)

- 詳細: [docs/REFERENCE.md §6-1](docs/REFERENCE.md)
- **enum 5 値**: `pdf_introduction` / `goi_list_n5_supplement` / `teacher_addition` / `inherited_from_earlier_lesson` / `practice_only`
- **強制**: lesson-check B-15 (必須 ERROR) / B-16 (goi_list_n5_supplement の Goi_List N5 実在 ERROR・捏造防止)
- **関連 lint**: B-14 WARN (vocab×sentence 整合性 — `practice_only` は skip)
- migration script: `scripts/lib/migrate-vocab-source-tag.mjs` (--apply で書き戻し)

### applicationExamples schema (X-e 確定 / 2026-05-27)

- 詳細: [docs/REFERENCE.md §6-1](docs/REFERENCE.md)
- **基本ルール (skill 強制)**: `examples[]` = 各課 PDF 文型欄基本形のみ / `applicationExamples[]` = 教え方の例・プラスα・活動例・応答セット由来
- **宿題 generator は `examples[]` のみ参照** (controlled practice の純度担保)
- **applicationExamples は画像不要** (registry に entry を作らない)
- skill 検出: lesson-check B-12 (応答混入 WARN) + B-13 (examples 空 WARN)
- lesson-scaffold `buildApplicationExample` で seed 化

### β1-v0.3 multi-template render (2026-05-27 確定)

- `exerciseHtml` は `templates: [{html, blankCount}]` 配列を受け取り、`.templates-block` 内に縦並びで render
- `blankCount=0` の template は `.template-row.no-input` クラス付与で灰色テキスト hint 表示
- judge UI 有効化条件: **全 templates が同 blank 数 (uniform)** AND (vocabulary source なら `blankCount=1`)
- 異形 templates (blank 数バラバラ) は input は出すが judge UI 無し → 自己採点
- `_meta.version` = `'0.3-multi-template-render'`

### v4.0.8 example_sentence 4 改修 (X-c-7 確定 / 2026-05-27)

PART 3.9 + Template C + skill md を改修：

| § | 改修 | Defeats |
|---|---|---|
| §3.9.2 5a | National Flag Prop 必須化 (12-15% image fill / hand-held / pole optional / [CONSTRAINTS] global flag ban を identity-only example_sentence で override) | Identity Card Collapse / Phenotype-Only Insufficiency |
| §3.9.3.B | Institution Anchor Table (病院/銀行/学校/デパート/会社 verbatim cue) + ≥2 anchors MUST appear + unlisted institution fallback rule | Generic Office Fallback / Institution Affordance Collapse |
| §3.9.8.A | Archetype Cue Table (先生=chalk+textbook / 学生=notebook+backpack / 会社員=briefcase+lanyard / 医者=stethoscope+clipboard / Nationality=national flag prop) - **diegetic 3D props / 2D UI SYMBOL_COUNT に加算しない** | Archetype Generic Collapse / Occupation Cue Loss |
| §3.9.8.C | Subject Bifurcation Rule - Route 1 proper noun `〜さん` → NAMED retain / Route 2 class attribute `〜人` or OCCUPATION_TOKEN → archetype shift + portrait detach | Subject Selection Ambiguity / Identity-Question Semantic Collapse |

### v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE (X-c 確定 / 2026-05-26)

- **対象**: `vocab_type == "example_sentence"` で sentence または `sceneCharacters[]` に NAMED_CHARACTER を含むカード
- **portraitPath**: PART 5.9 NAMED_CHARACTER_PROFILES に 5 件登録済
- **enforcement**: `nanobanana-client.mjs` の `referenceImages` 引数 + `generate-images-local.mjs` の `loadReferenceImages()` helper
- **guide manifest hash**: `652aa0a3cbe3` (v4.0.8.1 反映後)

### accent precedence (Phase α5 延長確定)

`accent_override (manual)` > `accent_consensus_override` > `accent_yomigana (UniDic raw)` > plain text fallback

### v4.0.4 building design (skill 化済 / 採用 4 件)

- 採用版：学校 R25 / 大学 R26 / デパート R22 / 会社 R22
- 未移行 4 件 (銀行 / 病院 / 駅 / スーパー) は v3.0 legacy path

---

## ブロッカー / 並行

- δ/ε：blocker なし
- **不変条件 hash**：`scripts/invariants.mjs` の `guideManifestExpectedHashPrefix` は `652aa0a3cbe3` (v4.0.8.1 確定値)
- **画像生成 routine**: 必ず `--dry-run + --limit N` 安全帯
- **building skill dispatch**：`BUILDING_V4_0_4_WORDS = {学校, 大学, デパート, 会社}` は `_meta.mode === 'skill'` 出力時のみ BG=CREAM + NOT_TOKEN 必須化

---

## 直近の確定コマンド

```
# 検証
npm run validate                # A=v7.5 / B=891b73f5ae2d / B'=652aa0a3cbe3 / C / D / D' PASS

# 課マスター作成 skill suite (manual invoke)
/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf]
/lesson-check NN [--json]                # B-6-2/3/4 + B-12 + B-13 + B-14/15/16 (X-g Phase 1) 強化済
/lesson-fill-vocab NN [--apply] [--json]
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
/lesson-build-registry NN [--apply] [--json]

# X-g Phase 1 migration (one-shot・既に適用済)
node scripts/lib/migrate-vocab-source-tag.mjs [--apply] [--no NN]

# 例文画像 prompt 生成 (lesson_02 以降は skill 経由を試す予定)
/generate-image-prompt mode=lesson-examples --lesson NN

# 宿題 lesson_02 ad-hoc 検証 (β1-v0.3 確認用)
node scripts/_verify_homework_html_l02.cjs

# スライド γ2 動作確認 (X-e teacher_photo スロット視認用)
python -m http.server 8766 --bind 127.0.0.1   # http://127.0.0.1:8766/ で index.html
```

---

## 関連ドキュメント

- [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) — 課マスター作成 5 skill suite マニュアル
- [docs/SKILLS_MANUAL.md](docs/SKILLS_MANUAL.md) — 画像 prompt 系 skill マニュアル
- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）— **§6-1 に `_sourceTag` enum 追加 (X-g Phase 1) + applicationExamples (X-e)**
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules (PART 1.12 building + PART 1.14 person ref)
- [prompts/guide/part3_vocab_type_rules.md](prompts/guide/part3_vocab_type_rules.md) — PART 3.9 v4.0.8
- [prompts/guide/part4_prompt_templates.md](prompts/guide/part4_prompt_templates.md) — Template C v4.0.8
- [prompts/guide/part5_vocab_reference_appendix.md](prompts/guide/part5_vocab_reference_appendix.md) — NAMED_CHARACTER_PROFILES (portraitPath 5 件)
- [design_brief.md](design_brief.md) — ツール設計書
