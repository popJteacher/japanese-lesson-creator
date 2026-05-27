# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-27 X-c-7 完了: v4.0.8 4 改修 (§3.9.2 5a flag prop / §3.9.3.B institution anchor / §3.9.8.A archetype cue / §3.9.8.C subject bifurcation) PoC 6/7 PASS 🆕

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 β1 / γ2 / X-a 全 4 / X-b 部分 / X-c (1〜6 + 7) / X-d 完了** ✅
- **X-c-7: v4.0.8 universal rule 確定 + lesson_01 ex_L01_* 7 件再生成** 🆕（016 のみ v4.0.9 backlog 行き）
  - v4.0.7 PoC 18 件 → user 実視で 6 NG + 1 注意 → Gemini consult 第二/三回で §3.9.2 5a / §3.9.3.B / §3.9.8.A / §3.9.8.C 4 改修確定
  - v4.0.8 PoC validated: 004 日本国旗 / 005 中国国旗 / 010 teacher archetype / 011 2-panel teacher / 012 Korean archetype / 013 2-panel 太極旗 — **すべて user 実視 OK**
  - v4.0.8.1 微修正: §3.9.2 5a の pole 緩和 ("optionally with a thin staff")
  - artifact: [gemini_consult_xc7_section3_9_revision.md](docs/_xc_history/gemini_consult_xc7_section3_9_revision.md) / [prompts.txt](docs/_xc_history/gemini_consult_xc7_prompts.txt) / [round3_reply.md](docs/_xc_history/gemini_consult_xc7_round3_reply.md)
  - 総コスト X-c-7: $0.97 (18+4+3=25 枚)

### スナップショット（2026-05-27 X-c-7 着地直後・コマンドで再導出）

```
image_registry:  generated 39 / pending 448 / outdated 6 / (none) 1 = total 494
                 ↑ ex_L01_001〜018 全 18 件 generated 化 (v4.0.7 11 件 + v4.0.8 7 件)
                 ↑ char_* 5 件 + word_* 12 件 (v4.0 nationality+role)
audio_registry:  466 entries / 459 active (変化なし)
LUFS:            ERROR 20 / WARN 80 (439/459 PASS) ← 構造上既知制約
imagen_usage:    2026-05-27 = 25/30 (残 5 枚) / 累計 $0.97
git:             main → X-c-7 v4.0.8 着地 commit で更新中
```

---

## active

### 次セッション着手点：**(候補 A) β1 残課題 → γ1 → δ 着手 / (候補 B) 016 + lesson_02 銀行 v4.0.9**

着手判断は user 次第。優先度は β1/γ1/δ > 016 単独修正 (016 は lesson_02 で銀行が再登場した際にまとめて対応する方が効率的)。

### β1 残課題 / γ1 残作業

- **lesson_02 以降の β1 検証**：lesson_02 の practiceImageSource / 答え抽出ロジック未検証
- **複数 practiceTemplates 対応**：現コードは `practiceTemplates[0]` のみ render
- **γ1 (スライド音声移植)**：homework の .audio-btn 機構を slide_html.js に移植

### Phase δ（アクティビティ完成 / 3-5 セッション想定）

- δ1 画像組み込み 6 ブロック (E)
- δ2 applicability メタデータ 57 件 (H Stage 2)
- δ3 recommender.js + form UI 統合 (H Stage 3)

### 並行待機

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
- **同表記2読み恒久対策**：`pickCatalogEntry` を lesson_*.json reading 確定に切替
- **lesson_02 以降の v4.0.4 building 移行**：病院 / 銀行 / 駅 / スーパー を PART 5.10 BUILDING_CUES に追加
- **(b-3) 生成プロンプト側で超過漢字を平易表現に置換**
- **016 銀行 §3.9.3.B 強化 (v4.0.9)**：cubicle 問題は v4.0.8 で解決したが「銀行確定」cue 不足（札束/円看板/ATM/金庫扉 等が必要）/ character の "カウンター後ろ" 強制配置 / ホテル・役所・受付との明示的 disambiguation。lesson_02 で銀行 entry 再登場時に Gemini consult 第三回相当で詰める
- **§3.9.3.B / §3.9.8.A 表の拡張**: lesson_02+ で 新 institution / 新 occupation token が出たら追加（rule 本文は universal なので未登録でも skill は適用するが verbatim 識別子があるほど安定）
- **`/generate-image-prompt` skill の完全 universal 化**：現状は X-c-7 で `scripts/_xc_l_ex_L01_prompts_v4.mjs` + `_v4_round2.mjs` の hardcoded Node script で適用したが、lesson_02 以降は skill の Route 1/2 機械判定 + lookup table 動的 injection に移行（既に skill md には仕様 10-13 が記載済 / 実 invoke テストは未実施）

### 触らない既知制約

- LUFS ERROR 20 件（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題）
- lesson-check B-6 (p1/p3 practiceTemplates ≥2 必須)・B-8 (pattern minutes 8 分 > 7 上限) は既存問題で X-c とは独立

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成   ✅ 全完了
Phase β  宿題完成
  β1 ✅ 正解判定 (D)・homework_html.js 改修・user 試聴 OK
Phase γ  スライド完成
  γ1     音声再生（homework .audio-btn 機構を移植）  ← user 都合で後送り
  γ2     デザイン微修正  ← 全 12 ブロック視聴 OK ✅
Phase X (γ2 派生・user 要望)
  X-a    課マスター作成 skill suite                                ✅ 全完了
  X-b    lesson.targetStudentLevel + 上級語 pill 機構             ✅ 部分着地
  X-d    復習機能 + intro_activity fallback テンプレ修正           ✅ 着地
  X-c    例文 revision + v4.0.5 PERSON ref + v4.0.6/7/8 example_sentence
    X-c-1〜3  PART 1.14 + lesson_01 v2.12 + registry renumber       ✅ 完了
    X-c-4    char_* portrait 5 件生成 (v2 + リン v3)               ✅ 完了
    X-c-5 v1 ex_L01_* 18 件 text-only 一陣 (失敗 / _xc_text_only_v1/ 退避) — 学び記録済
    X-c-5 v2 PART 3.9 v4.0.6 + Template C 改修 + 18 件 prompt 再起案  ✅ 完了 (v3 で上書き)
    X-c-6 bake PART 3.9 v4.0.7 + Template C v4.0.7 + 18 件 v3 prompt  ✅ 完了
    X-c-7 v4.0.8 4 改修 + lesson_01 7 件再生成 + user 実視 OK 6/7    ✅ 完了 🆕
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
```

---

## 確定仕様

### v4.0.8 example_sentence 4 改修 (X-c-7 確定 / 2026-05-27)

PART 3.9 + Template C + skill md を改修：

| § | 改修 | Defeats |
|---|---|---|
| §3.9.2 5a | National Flag Prop 必須化 (12-15% image fill / hand-held / pole optional / [CONSTRAINTS] global flag ban を identity-only example_sentence で override) | Identity Card Collapse / Phenotype-Only Insufficiency |
| §3.9.3.B | Institution Anchor Table (病院/銀行/学校/デパート/会社 verbatim cue) + ≥2 anchors MUST appear + unlisted institution fallback rule | Generic Office Fallback / Institution Affordance Collapse |
| §3.9.8.A | Archetype Cue Table (先生=chalk+textbook / 学生=notebook+backpack / 会社員=briefcase+lanyard / 医者=stethoscope+clipboard / Nationality=national flag prop) - **diegetic 3D props / 2D UI SYMBOL_COUNT に加算しない** | Archetype Generic Collapse / Occupation Cue Loss |
| §3.9.8.C | Subject Bifurcation Rule (D-β / Gemini round 3) - Route 1 proper noun `〜さん` → NAMED retain / Route 2 class attribute `〜人` or OCCUPATION_TOKEN → archetype shift + portrait detach | Subject Selection Ambiguity / Identity-Question Semantic Collapse |

skill 機械判定 trigger（[skill md v4.0.8 §10-13](.claude/skills/generate-image-prompt.md)）:
- `if "さん" in sentence_jp:` → Route 1 (NAMED retain)
- `if any(tok in sentence_jp for tok in OCCUPATION_TOKENS) or "人" in sentence_jp:` → Route 2 (archetype shift)
- OCCUPATION_TOKENS = {"先生", "学生", "大学生", "会社員", "医者"} (§3.9.8.A 表 keys)

### v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE (X-c 確定 / 2026-05-26)

- **対象**: `vocab_type == "example_sentence"` で sentence または `sceneCharacters[]` に NAMED_CHARACTER を含むカード
- **検出**: sentence string match + `examples[].sceneCharacters[]` の UNION (PART 1.14 detection algorithm)
- **attach 数**: 1-4 件 per request
- **portraitPath**: PART 5.9 NAMED_CHARACTER_PROFILES の各 entry に登録済 (5 件)
- **enforcement**: `nanobanana-client.mjs` の `referenceImages` 引数 + `generate-images-local.mjs` の `loadReferenceImages()` helper
- **guide manifest hash**: `652aa0a3cbe3` (v4.0.8.1 反映後)

### γ2 スライド変更（user 視聴 OK で確定 5/26）

- 例文 anchor 画像列：`minmax(0, 440px)` で 16:9 約 440×248px
- POS 線：`examples[].highlight` 明示時のみ。自動 は/が 分割は廃止
- カードプレゼンター：grid + click-to-zoom（カルーセル廃止）
- スライド：`min-height: calc(100vh - 64px)` 自然フロー + page スクロール

### β1 宿題正解判定 (D) — 実装済

- 採点タイミング：即時（設問ごと判定 + visual ○×）
- 不正解時：「もう一度」で × input のみクリア・○ 済み保持
- 正解参照：「正解を表示」ボタン トグル
- 判定粒度：複数解 any-match で○、per-input 緑/赤、句読点・空白無視

### accent precedence (Phase α5 延長確定)

`accent_override (manual)` > `accent_consensus_override` > `accent_yomigana (UniDic raw)` > plain text fallback

### v4.0.4 building design (skill 化済 / 採用 4 件)

- 採用版：学校 R25 / 大学 R26 / デパート R22 / 会社 R22
- universal rule A-1〜A-11 (PART 1.13)
- 5-image reference attachment (PART 1.12)
- 未移行 4 件 (銀行 / 病院 / 駅 / スーパー) は v3.0 legacy path

---

## ブロッカー / 並行

- δ/ε：blocker なし
- worktree `phase4-prompt-plan`：design insight 転記完了 → main へ ff-merge 済み・reference attachment infra (worktree 950dcfd) も X-c-6a で復元済
- **不変条件 hash**：`scripts/invariants.mjs` の `guideManifestExpectedHashPrefix` は `652aa0a3cbe3` (v4.0.8.1 確定値)
- **画像生成 routine**: 必ず `--dry-run + --limit N` 安全帯 (memory [feedback-image-gen-must-dry-run-and-limit](C:\Users\kohn0\.claude\projects\c--Users-kohn0-Desktop-japanese-lesson-creator-main\memory\feedback_image_gen_must_dry_run_and_limit.md) 記録済)
- **building skill dispatch**：`BUILDING_V4_0_4_WORDS = {学校, 大学, デパート, 会社}` は `_meta.mode === 'skill'` 出力時のみ BG=CREAM + NOT_TOKEN 必須化

---

## 直近の確定コマンド

```
# 検証
npm run validate                # A=v7.5 / B=891b73f5ae2d / B'=652aa0a3cbe3 (v4.0.8.1) / C / D / D' PASS (exit=1 は既知 LUFS ERROR 20 件のみ)

# 課マスター作成 skill suite (manual invoke)
/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf]
/lesson-check NN [--json]
/lesson-fill-vocab NN [--apply] [--json]
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
/lesson-build-registry NN [--apply] [--json]

# 例文画像 prompt 生成 (lesson_02 以降は skill 経由を試す予定)
/generate-image-prompt mode=lesson-examples --lesson NN

# スライド γ2 動作確認
python -m http.server 8766 --bind 127.0.0.1   # http://127.0.0.1:8766/ で index.html
```

---

## 関連ドキュメント

- [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) — 課マスター作成 5 skill suite マニュアル
- [docs/SKILLS_MANUAL.md](docs/SKILLS_MANUAL.md) — 画像 prompt 系 skill マニュアル
- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules (PART 1.12 building + PART 1.14 person ref)
- [prompts/guide/part3_vocab_type_rules.md](prompts/guide/part3_vocab_type_rules.md) — **PART 3.9 v4.0.8 (§3.9.2 5a flag prop + §3.9.3.B institution anchor + §3.9.8.A archetype cue + §3.9.8.C subject bifurcation)** 🆕
- [prompts/guide/part4_prompt_templates.md](prompts/guide/part4_prompt_templates.md) — Template C v4.0.8 [SCENE & ACTION] conditions (c)/(g)/(h) 強化
- [prompts/guide/part5_vocab_reference_appendix.md](prompts/guide/part5_vocab_reference_appendix.md) — NAMED_CHARACTER_PROFILES (portraitPath 5 件)
- [design_brief.md](design_brief.md) — ツール設計書
