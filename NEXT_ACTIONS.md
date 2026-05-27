# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-27 β1-v0.3 multi-template render 着地 + applicationExamples plan 確定 (実装は別 session) 🆕

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 β1-v0.3 / γ2 / X-a 全 4 / X-b 部分 / X-c (1〜7) / X-d 完了** ✅
- **β1-v0.3 (今 session)**: [homework_html.js](src/generators/homework_html.js) v0.3 multi-template render 🆕
  - `practiceTemplates[0]` 固定 → 全 templates 縦並びに展開
  - uniform 構成 (全 templates 同 blank 数) のみ judge UI 有効、異形は自己採点
  - blank=0 templates は input なしでテキスト hint 表示 → lesson_02 p2/p6 の「judge-btn 出るのに input 0」矛盾 bug 解消
  - lesson_01 退行確認: p1/p3 judge UI 維持。p2 異形 templates の judge UI は消失 (設計通り)
  - lesson_02 改善: p1/p5 uniform 多 template で judge UI 動作、p2/p4/p6 は判定なし (適切)
- **applicationExamples schema plan 確定 (今 session 着地)** 🆕 — 実装は **別 session**
  - **基本ルール (skill で強制予定)**: 「PDF 文型欄 = `examples` / 教え方の例・プラスα・活動例 = `applicationExamples`」
  - sentence 形は出典のまま (A 単独 / Q+A 結合 / 複合会話)、`applicationExamples` は **画像不要**
  - 既存 Q+A 画像は `examples` sentence (Q 形式) に流用、Q 単体最適化画像への再生成は backlog
  - `applicationExamples` の render 先 (会話例スライド / 教案 docx 応用ガイド) は backlog
  - plan: [C:\Users\kohn0\.claude\plans\2-or-validated-pancake.md](C:\Users\kohn0\.claude\plans\2-or-validated-pancake.md)

### スナップショット（2026-05-27 β1-v0.3 着地直後・コマンドで再導出）

```
image_registry:  494 entries / missing 449 (変化なし、本 session では registry 未更新)
audio_registry:  466 entries / 459 active (変化なし)
invariants:      A v7.5 / B 891b73f5ae2d / B' 652aa0a3cbe3 / C / D 439/459 PASS / D' PASS
homework_html:   v0.3 multi-template render (lesson_01 退行 0, lesson_02 改善 OK)
git:             main → β1-v0.3 + plan 確定 commit 予定
```

---

## active

### 次セッション着手点：**applicationExamples 実装 (plan 2-or-validated-pancake)**

着手前に plan ファイルを再読すること: [C:\Users\kohn0\.claude\plans\2-or-validated-pancake.md](C:\Users\kohn0\.claude\plans\2-or-validated-pancake.md)

実装順 (plan の Section 番号):
1. docs/REFERENCE.md に applicationExamples schema 定義追加
2. lesson_01.json p2 を v2.13 (examples = Q 4 件 / applicationExamples = A 4 件) に update
3. lesson_02.json p3/p4/p5/p6 を update (examples = PDF 文型欄準拠 Q / applicationExamples = 教え方の例・活動例由来 A)
4. lesson_02.json intro_act_p5/p6 に teacher_photo materialNeed 追加 (Drop&Drag 化)
5. master_image_registry.json + .js: 既存 entry の sentence を新 Q 形式に同期
6. activity_catalog.js: act_whiteboard_categorize.validatedForLessons = [1, 2]
7. lesson-check.mjs: B-6 強化 (B-6-2/3/4) + B-12 (examples 応答混入 WARN) + B-13 (examples 空 WARN)
8. lesson-scaffold.mjs: applicationExamples seed + docstring 拡充
9. npm run validate + homework_l02 verify + スライド実視
10. NEXT_ACTIONS.md / handoff_archive.md / git commit

### Phase γ / δ 残作業

- **γ1 (スライド音声移植)**：homework の .audio-btn 機構を slide_html.js に移植 (user 都合で後送り中)
- **Phase δ**（アクティビティ完成 / 3-5 セッション想定）
  - δ1 画像組み込み 6 ブロック (E)
  - δ2 applicability メタデータ 57 件 (H Stage 2)
  - δ3 recommender.js + form UI 統合 (H Stage 3)

### 並行待機 / backlog

- **applicationExamples の render 先実装**: 会話例スライド (新 flow.type='dialogue_example') or 教案 docx の応用ガイド section。pedagogy review 必要、1-2 セッション規模
- **Q 単体画像への再生成**: examples sentence が Q 形式に整理された後、対応する画像 (ex_L02_021〜023/029/030/032 等) を Q 単体場面に最適化。`--dry-run` + `--limit` 安全帯で別 session
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

- LUFS ERROR 20 件（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題）
- lesson-check B-8 (pattern minutes 8 分 > 7 上限) は既存問題で独立
- 旧 B-6 (practiceTemplates ≥2 必須) は次 session の B-6 強化で再定義される

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成   ✅ 全完了
Phase β  宿題完成
  β1 ✅ v0.1 正解判定 (D)・homework_html.js 改修・user 試聴 OK
  β1 ✅ v0.3 multi-template render + uniform judge UI 🆕
Phase γ  スライド完成
  γ1     音声再生（homework .audio-btn 機構を移植）  ← user 都合で後送り
  γ2     デザイン微修正  ← 全 12 ブロック視聴 OK ✅
Phase X (γ2 派生・user 要望)
  X-a    課マスター作成 skill suite                                ✅ 全完了
  X-b    lesson.targetStudentLevel + 上級語 pill 機構             ✅ 部分着地
  X-d    復習機能 + intro_activity fallback テンプレ修正           ✅ 着地
  X-c    例文 revision + v4.0.5 PERSON ref + v4.0.6/7/8           ✅ 完了
  X-e    applicationExamples schema (data 整備 + skill 強制)       ← 別 session 実装 🆕
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
```

---

## 確定仕様

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
/lesson-check NN [--json]
/lesson-fill-vocab NN [--apply] [--json]
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
/lesson-build-registry NN [--apply] [--json]

# 例文画像 prompt 生成 (lesson_02 以降は skill 経由を試す予定)
/generate-image-prompt mode=lesson-examples --lesson NN

# 宿題 lesson_02 ad-hoc 検証 (β1-v0.3 確認用)
node scripts/_verify_homework_html_l02.cjs

# スライド γ2 動作確認
python -m http.server 8766 --bind 127.0.0.1   # http://127.0.0.1:8766/ で index.html
```

---

## 関連ドキュメント

- [C:\Users\kohn0\.claude\plans\2-or-validated-pancake.md](C:\Users\kohn0\.claude\plans\2-or-validated-pancake.md) — **次 session 実装 plan** 🆕
- [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) — 課マスター作成 5 skill suite マニュアル
- [docs/SKILLS_MANUAL.md](docs/SKILLS_MANUAL.md) — 画像 prompt 系 skill マニュアル
- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules (PART 1.12 building + PART 1.14 person ref)
- [prompts/guide/part3_vocab_type_rules.md](prompts/guide/part3_vocab_type_rules.md) — PART 3.9 v4.0.8
- [prompts/guide/part4_prompt_templates.md](prompts/guide/part4_prompt_templates.md) — Template C v4.0.8
- [prompts/guide/part5_vocab_reference_appendix.md](prompts/guide/part5_vocab_reference_appendix.md) — NAMED_CHARACTER_PROFILES (portraitPath 5 件)
- [design_brief.md](design_brief.md) — ツール設計書
