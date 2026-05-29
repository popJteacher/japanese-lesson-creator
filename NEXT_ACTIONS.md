# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-29 (Phase 1-S1 完了 ✅ — 銀行/病院 v4.0.4 採用版化 done)

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 β1-v0.3 / γ2 / X-a〜X-g / Phase 1-S1 完了** ✅
- **Phase 1-S1 (本 session 完了)**: 銀行/病院 を v4.0.4 採用版化。design 確定 → guide/invariants 編集 (commit `a7c7478`) → prompt 起草 (preflight PASS) → user 手動生成 → 両方採用 → registry generated 化。
- **plan**: [C:\Users\kohn0\.claude\plans\abstract-cuddling-plum.md](C:\Users\kohn0\.claude\plans\abstract-cuddling-plum.md) (5 Phase plan / user 承認済)

### スナップショット（2026-05-29 Phase 1-S1 完了時点・コマンドで再導出）

```
image_registry:  496 entries / 441 missing (銀行/病院 解消・残 ex_L01_012/014-018・lesson_02 ex/word 系)
audio_registry:  468 entries / 2 missing (sentence_ex_L02_036/037 = 例文音声扱いで保留)
invariants:      A v7.5 / B 891b73f5ae2d / B' 1d273f8f1c3b / C / D 439/459 (80 WARN) / D' 451/459
非 D の ERROR:   0 (残 20 ERROR は既知 invariants[D] LUFS・触らない)
lesson_01/02:    data 不変
```

---

## active

### 5 Phase plan サマリ (詳細は plan file)

```
Phase 1-S1 (銀行/病院 v4.0.4 採用版化)                       ✅ 完了
Phase 2  (applicationExamples スライド render / 1 セッション)  ← 着手可 (並列可)
Phase 1-S2 (lesson_01 examples 7 件 / 1-1.5 セッション)        ← 次の本線
  ↓
Phase 1-S3 (lesson_02 画像約 25 件 / 1.5-2 セッション・skill 動的 lookup 初実証)
  ↓
Phase 3  (vocab のみスライド音声 / 1 セッション)
  ↓
Phase 4  (Phase δ アクティビティ HTML / 3-5 セッション)

常時並列可: Phase 5 (B-14 WARN 14 件への _sourceTag=practice_only / 0.5 セッション)
```

### 次セッション着手候補（どちらでも・並列可）

**A) Phase 1-S2 — lesson_01 examples 7 件再生成 (1-1.5 セッション)**
- 対象: ex_L01_012 / ex_L01_014〜018 (p3「〜の〜」例文画像が全滅)
- Template C v4.0.8 / NAMED_CHARACTER portrait reference (鈴木/リン/キム/ケリー/タノム・実在確認済) attach
- §3.9.2 5a / §3.9.3.B Institution Anchor / §3.9.8.A / §3.9.8.C 適用。ex_L01_018 (デパート) は §3.9.3.B Fallback
- 起草 → preflight PASS → user 手動生成 → R-iteration

**B) Phase 2 — applicationExamples スライド render (1 セッション)**
- [src/generators/slide_html.js](src/generators/slide_html.js) L1723-1841 の switch に `application_example` case 追加 (~40-60 行)
- [src/common/flow_synthesizer.js](src/common/flow_synthesizer.js) で pattern スライド直後に注入
- 学習者向け/教師向けの切り分けは **user 判断ポイント** ([memory: feedback_teacher_notes_not_on_learner_slides])
- 検証: lesson_01 p2 (4 件) + lesson_02 全 pattern (22 件) を実視

### 今 session の整理対象（untracked・任意削除）

- `data/_drafts/phase1_s1_lesson01_buildings.json` (v3.0 Legacy drafts・採用しない)
- `data/_drafts/_preflight_check.py` (Step 3 検証の使い捨て)
- `data/_bak_20260515/` (旧 homework テスト HTML・無関係)
- 採用 prompt `data/_drafts/prompt_銀行_v4_0_4.txt` / `prompt_病院_v4_0_4.txt` は provenance として commit 済

### 既存 ERROR (lesson-check で残る・本 plan のスコープ外)

- lesson_01 p1/p3: `practiceTemplates` 1 件 (B-6)
- lesson_02 p2: `practiceTemplates` 全件 blank=0 (B-6-2) / p4: 1 件 (B-6)

### 並行待機 / backlog

- **preflight signage validation 欠落** (再発防止の本丸): 銀行 ATM 文字 / HOSPITAL「CITY HOSPITAL」を捕捉できなかった。生成後 OCR or single-label check を skill/preflight に追加 ([memory: feedback_v3_legacy_template_quality_gap] 関連)
- **lesson_01 intro_act_p1 世界地図 Drop&Drag**
- **lesson_plan_docx.js の applicationExamples 対応** (Phase 2 完了後の任意拡張)
- **例文 audio の再検討**: AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証。sentence_ex_L02_036/037 の audio 2 件 pending も同方針で保留
- **同表記2読み恒久対策**: `pickCatalogEntry` を lesson_*.json reading 確定に切替
- **(b-3) 生成プロンプト側で超過漢字を平易表現に置換**
- **§3.9.3.B / §3.9.8.A 表の拡張**: lesson_02+ で 新 institution / 新 occupation token が出たら追加

### 触らない既知制約

- **invariants[D] 20 LUFS ERROR**（構造問題・触らない）
- **invariants[D] 80 WARN**（target ±1.5 を僅かに超過・TP 制約等で正常範囲）
- **lesson-check B-8** (pattern minutes 8 分 > 7 上限) は既存問題で独立

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成   ✅ 全完了
Phase β  宿題完成          ✅ v0.3 着地
Phase γ  スライド完成
  γ1     音声再生 (vocab のみ移植に再定義) — Phase 3 で実施予定
  γ2     デザイン微修正  ✅
Phase X (γ2 派生)          ✅ X-a〜X-g 全完了
Phase 1-S1 銀行/病院 v4.0.4 採用版化  ✅ 完了 (2026-05-29)
Phase 1-S2/S3 / Phase 2-5 — 順次 (詳細は plan file)
Phase δ  アクティビティ完成（3-5 セッション）
Phase ε  統合テスト・リリース判断
```

---

## 確定仕様

### 銀行/病院 v4.0.4 採用版 (Phase 1-S1 確定 / 2026-05-29)

- 採用版 building は **6 件** (学校 R25 / 大学 R26 / デパート R22 / 会社 R22 / 銀行 R1 / 病院 R1)。未移行は駅/スーパーの 2 件のみ
- 銀行: urban_corner / muted teal accent / glass banking hall + ATM。**ATM 機にテキスト残存 (signage 逸脱) を user 許容で採用**・registry `_v4_0_4_adopted` に明記
- 病院: campus / soft sage green accent / entrance canopy + 赤十字 (彩度例外) + wheelchair ramp。ルール完全適合
- `BUILDING_V4_0_4_WORDS` (preflight.py / invariants.mjs) = 6 件。B' hash = `1d273f8f1c3b`
- design doc: `data/_drafts/phase1_s1_v404_banking_hospital_design.json`

### v4.0.4 採用版経路 が building の本流

- 14 variable fields: vocab_type_desc / form_desc / signature / accent / accent_targets / label / signboard_location / signboard_location_short / surroundings_context / surroundings_block / framing_extra / activities_block / landscaping_block / type_relevant_refs
- constant: image_1 = `data/images/word_日本人.png` (brand voice) / image_5 = `data/images/vocab_病院.jpg` (architectural)
- universal rule A-1〜A-11 を Template B `[SCENE & ACTION]` に inline 展開 (PART 1.13)

### applicationExamples schema (X-e 確定) / Goi_List 補強 (X-g) / vocab _sourceTag (X-g)

- 詳細: [docs/REFERENCE.md §6-1](docs/REFERENCE.md) / [docs/LESSON_SKILLS_MANUAL.md §2.5](docs/LESSON_SKILLS_MANUAL.md)

### accent precedence (Phase α5 延長確定)

`accent_override (manual)` > `accent_consensus_override` > `accent_yomigana (UniDic raw)` > plain text fallback

---

## 直近の確定コマンド

```
# 検証
npm run validate
npm run missing-assets

# 課マスター作成 skill suite (manual invoke)
/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf]
/lesson-check NN [--json]
/lesson-fill-vocab NN [--apply] [--json]
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
/lesson-build-registry NN [--apply] [--json]

# 例文画像 prompt 生成 (lesson_02 以降は skill 経由を試す予定)
/generate-image-prompt mode=lesson-examples --lesson NN

# building prompt の preflight (単発)
python -c "import sys;sys.path.insert(0,'scripts/lib');import prompt_preflight as pf;print(pf.preflight(open('PATH',encoding='utf-8').read(),'building','WORD'))"

# スライド γ2 動作確認
python -m http.server 8766 --bind 127.0.0.1
```

---

## 関連ドキュメント

- [C:\Users\kohn0\.claude\plans\abstract-cuddling-plum.md](C:\Users\kohn0\.claude\plans\abstract-cuddling-plum.md) — 5 Phase plan
- [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) / [docs/SKILLS_MANUAL.md](docs/SKILLS_MANUAL.md)
- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) / [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md)
- [docs/REFERENCE.md](docs/REFERENCE.md) / [docs/WORKFLOW.md](docs/WORKFLOW.md) / [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) / [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md)
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — PART 1.12/1.13/1.14
- [prompts/guide/part3_vocab_type_rules.md](prompts/guide/part3_vocab_type_rules.md) — §3.2 building / §3.9 v4.0.8
- [prompts/guide/part4_prompt_templates.md](prompts/guide/part4_prompt_templates.md) — Template B v4.0.4 (採用 6 件) / Template C v4.0.8
- [prompts/guide/part5_vocab_reference_appendix.md](prompts/guide/part5_vocab_reference_appendix.md) — §5.9 / §5.10 BUILDING_CUES (銀行/病院 v4.0.4 fields)
