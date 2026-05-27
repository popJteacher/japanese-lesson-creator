# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-27 X-c-6 bake: PART 3.9 v4.0.7 (8 subsections) + Template C v4.0.7 + ex_L01_* 18 件 v3 prompt PASS 🆕

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 β1 / γ2 / X-a 全 4 / X-b 部分 / X-d 完了** ✅
- **Phase X-c 文書・データ・char_* portrait・infra・guide 更新 完了** ✅（**ex_L01_* 画像生成のみ未実施**）
  - **v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE 機構化** — 完了
  - **v4.0.6 example_sentence 5 universal subsections + Template C 改修** — 完了（v3 prompt 生成前に v4.0.7 で上書き）
  - **v4.0.7 example_sentence 8 universal subsections (5 refined + 3 new) + Template C 強化** 🆕（Gemini 3 round 統合）
    - [PART 3.9](prompts/guide/part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level) 5→**8 subsection** 拡張: 既存 3.9.1-3.9.5 を verbatim phrase + Forbidden phrase で強化、新規 **3.9.6 particle_visual_mapping** / **3.9.7 horror_vacui_blank_surfaces** (8 surface 7a-7h) / **3.9.8 two_panel_qa_pattern** (A NAMED_CHARACTER + B archetype) を追加
    - [Template C v4.0.7](prompts/guide/part4_prompt_templates.md) 改修: [SCENE & ACTION] 3 条件 → 6 条件 + Diegetic 文 + [CONSTRAINTS] に Horror Vacui defense 行追記 + [SUBJECT] lean form 強化
    - [skill md](.claude/skills/generate-image-prompt.md) lesson-examples flow に v4.0.7 9 項目追記
    - invariants.mjs hash 更新: `c821d13e646e` → `8a608d9863c8`
    - 確定 bias defeated: Native 1:1 Square / Object Isolation / Diegetic Confusion / Horror Vacui / Gibberish Hallucination / Dollhouse Scaling / Exterior Facade Literalism / Feature Blending / Relational Ambiguity / Layout Ignorance (2-panel)
  - **char_* portrait 5 件 生成・OK** (v2: PART 5.8 + 5.3 + 5.9 統合方針 / リン は v3 backpack 強調再生成)
  - **reference attachment infra 復元** (worktree `phase4-prompt-plan` 950dcfd → main / X-c-6a で commit)
  - **lesson_01 ex_L01_* 18 件 v3 prompt 完成** 🆕 ([scripts/_xc_l_ex_L01_prompts_v3.py](scripts/_xc_l_ex_L01_prompts_v3.py)): v4.0.7 verbatim phrase を hardcoded・preflight PASS 全 18 件（v2 は退避・unused）

### スナップショット（2026-05-27 X-c-6 bake 着地直後・コマンドで再導出）

```
image_registry:  generated 21 / pending 466 / outdated 6 / (none) 1 = total 494
                 ↑ char_* 5 件 (鈴木/リン/キム/タノム/ケリー) を generated 化済
                 ↑ ex_L01_* 18 件は registry status=pending (v1 PNG は退避済)
image_prompts_skill.json: 29 entries / guideManifestHash 8a608d9863c8 (v4.0.7 反映)
                          ↑ char_* 5 件 + ex_L01_* 18 件 (v3) + 6 件残置 (lesson_02 + word_医者)
audio_registry:  466 entries / 459 active (変化なし)
LUFS:            ERROR 20 / WARN 80 (439/459 PASS)← 構造上既知制約
imagen_usage:    2026-05-27 reset 想定 (前日 5/26 = 29/30 → 翌日 0/30)
git:             main → 本 commit (X-c-6 v4.0.7 bake) で更新中
data/images/_xc_text_only_v1/: ex_L01_*.png 18 件退避保存 (v1 text-only path 結果 / A/B 比較用)
```

---

## active

### 次セッション着手点：**X-c-6 (b) ex_L01_* 18 件 v3 生成 + X-c-7 user 実視**

#### 手順 (a) 当日 cap 確認 + 環境

- `data/_meta/imagen_usage.json` で 2026-05-27 daily count を確認 (reset 想定 0/30)
- `_xc_targets.json` を再生成: `python scripts/_xc_f_filter_xc_targets.py`

#### 手順 (b) ex_L01_* 18 件生成 (style refs 付き / cost ~$0.70)

```bash
# dry-run で 18 件確認 (--limit 18 安全帯)
npm run generate-images -- --prompts data/_xc_targets.json --limit 18 --dry-run

# 本実行 (char_* は --force 無しなら自動 skip / ex_L01_* のみ pending → 生成)
npm run generate-images -- --prompts data/_xc_targets.json --limit 18
```

期待ログ: `styleRefs:  total 17 件 attached (nanobanana multi-image input, v4.0.4 R11)`
(NAMED_CHARACTER 検出 17 件 / だれですか 0 件)

#### 手順 (c) user 実視 + 確認ポイント（v4.0.7 で新規/強化）

- **16:9 enforcement**: edge-bleed Required phrase (§3.9.1) で 1:1 drift が止まるか
- **role action vs 立ち姿**: object-manipulation Required phrase (§3.9.2) で動作中に見えるか
- **identity-only 国籍 (004/005/012)**: 5a "introductory social gesture" で活きた identity に見えるか
- **affiliation 屋内 (014-018)**: "INSIDE the [INSTITUTION]" で建物前立ち姿が完全に消えるか
- **diegetic symbol (006/008/010/012)**: "2D UI overlay" で symbol が neon sign 化しないか
- **Horror Vacui (全件)**: whiteboard/desk/wall に pseudo-kanji / fake document が生まれないか
- **2-panel (007/011/013)**: vertical divider + identity lock + exactly 2 symbol が enforced されるか
  - 特に B モード (011/013) で archetype clone が drift しないか

#### 手順 (d) v4.0.7 PoC 確定 (X-c-7)

- NG → v3 prompt の該当エントリを単一 entry filter JSON で個別 retry (memory [feedback-image-gen-must-dry-run-and-limit](C:\Users\kohn0\.claude\projects\c--Users-kohn0-Desktop-japanese-lesson-creator-main\memory\feedback_image_gen_must_dry_run_and_limit.md))
- OK → lesson_02 以降の例文も `/generate-image-prompt --lesson 02` skill 経由で v4.0.7 を自動適用（PART 3.9 v4.0.7 は universal なので lesson 不問）

### β1 残課題 / γ1 残作業

- **lesson_02 以降の β1 検証**：lesson_02 の practiceImageSource / 答え抽出ロジック未検証
- **複数 practiceTemplates 対応**：現コードは `practiceTemplates[0]` のみ render
- **γ1 (スライド音声移植)**：homework の .audio-btn 機構を slide_html.js に移植

### 並行待機

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
- **同表記2読み恒久対策**：`pickCatalogEntry` を lesson_*.json reading 確定に切替
- **lesson_02 以降の v4.0.4 building 移行**：病院 / 銀行 / 駅 / スーパー を PART 5.10 BUILDING_CUES に追加
- **(b-3) 生成プロンプト側で超過漢字を平易表現に置換**
- **§3.9.3 / §3.9.7 表の拡張**: lesson_02+ で 新 institution / surface が出たら追加（rule 本文は universal なので未登録でも skill は適用するが verbatim 識別子があるほど安定）

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
  X-c    例文 revision + v4.0.5 PERSON ref + v4.0.6/v4.0.7 example_sentence
    X-c-1〜3  PART 1.14 + lesson_01 v2.12 + registry renumber       ✅ 完了
    X-c-4    char_* portrait 5 件生成 (v2 + リン v3)               ✅ 完了
    X-c-5 v1 ex_L01_* 18 件 text-only 一陣 (失敗 / _xc_text_only_v1/ 退避) — 学び記録済
    X-c-5 v2 PART 3.9 v4.0.6 + Template C 改修 + 18 件 prompt 再起案  ✅ 完了 (v3 で上書き)
    X-c-6 bake PART 3.9 v4.0.7 + Template C v4.0.7 + 18 件 v3 prompt  ✅ 完了 🆕
    X-c-6 (b) ex_L01_* 18 件 v3 生成 (ref attach 付き)            次セッション
    X-c-7    user 実視 → v4.0.7 PoC 確定                          次セッション
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
```

---

## 確定仕様

### v4.0.7 example_sentence 8 universal subsections (X-c-6 確定 / 2026-05-27)

PART 3.9 を 5→8 subsection に拡張 (Gemini 3 round 統合 / lesson 不問の全 example_sentence 共通)：

| § | name | Defeats (bias 名) |
|---|---|---|
| 3.9.1 | aspect_ratio_enforcement (edge-bleed) | Native 1:1 Square / Object Isolation / Center-Weighted Cropping / Dollhouse Scaling |
| 3.9.2 | scene_action_focus (object-manipulation) + Identity-only exception 5a/5b | Default Standing Portrait / Subject-Environment Disconnection |
| 3.9.3 | affiliation_indoor ("INSIDE the [INSTITUTION]") | Exterior Facade Literalism / Dollhouse Scaling |
| 3.9.4 | visual_symbol_restriction (2D UI overlay) | Semantic Literalism / Abstract Symbol Objectification / Diegetic Confusion |
| 3.9.5 | reference_redundancy_avoidance (EXCLUSIVELY) | Feature Blending / Drift Bias |
| 3.9.6 | **particle_visual_mapping** (は/が/に/で/を/の/へ verbatim table) | Relational Ambiguity |
| 3.9.7 | **horror_vacui_blank_surfaces** (8 surface 7a-7h + positive enumeration) | Horror Vacui / Gibberish Hallucination / Textual Hallucination |
| 3.9.8 | **two_panel_qa_pattern** (A NAMED_CHARACTER + B archetype) | Layout Ignorance / Identity Drift Across Panels / Symbol Over-Generation |

### v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE (X-c 確定 / 2026-05-26)

- **対象**: `vocab_type == "example_sentence"` で sentence または `sceneCharacters[]` に NAMED_CHARACTER を含むカード
- **検出**: sentence string match + `examples[].sceneCharacters[]` の UNION (PART 1.14 detection algorithm)
- **attach 数**: 1-4 件 per request
- **portraitPath**: PART 5.9 NAMED_CHARACTER_PROFILES の各 entry に登録済 (5 件)
- **enforcement**: `nanobanana-client.mjs` の `referenceImages` 引数 + `generate-images-local.mjs` の `loadReferenceImages()` helper
- **guide manifest hash**: `8a608d9863c8` (v4.0.7 反映後)

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
- worktree `phase4-prompt-plan`：design insight 転記完了 → main へ ff-merge 済み・reference attachment infra (worktree 950dcfd) も X-c-6a で復元済 (memory [feedback-design-vs-pipeline-transcription-gap](C:\Users\kohn0\.claude\projects\c--Users-kohn0-Desktop-japanese-lesson-creator-main\memory\feedback_design_vs_pipeline_transcription_gap.md) 記録済)
- **不変条件 hash**：`scripts/invariants.mjs` の `guideManifestExpectedHashPrefix` は `8a608d9863c8` (v4.0.7 反映後)
- **画像生成 routine**: 必ず `--dry-run + --limit N` 安全帯 (memory [feedback-image-gen-must-dry-run-and-limit](C:\Users\kohn0\.claude\projects\c--Users-kohn0-Desktop-japanese-lesson-creator-main\memory\feedback_image_gen_must_dry_run_and_limit.md) 記録済 / 2026-05-26 失態から)
- **building skill dispatch**：`BUILDING_V4_0_4_WORDS = {学校, 大学, デパート, 会社}` は `_meta.mode === 'skill'` 出力時のみ BG=CREAM + NOT_TOKEN 必須化

---

## 直近の確定コマンド

```
# 検証
npm run validate                # A=v7.5 / B=891b73f5ae2d / B'=8a608d9863c8 (v4.0.7) / C / D / D' PASS (exit=1 は既知 LUFS ERROR 20 件のみ)

# X-c-6 (b) ex_L01_* 画像生成 (次セッション)
python scripts/_xc_f_filter_xc_targets.py                                   # _xc_targets.json refresh
npm run generate-images -- --prompts data/_xc_targets.json --limit 18 --dry-run
npm run generate-images -- --prompts data/_xc_targets.json --limit 18       # 本実行 ~$0.70 (cap 確認後)

# 課マスター作成 skill suite (manual invoke)
/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf]
/lesson-check NN [--json]
/lesson-fill-vocab NN [--apply] [--json]
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
/lesson-build-registry NN [--apply] [--json]

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
- [prompts/guide/part3_vocab_type_rules.md](prompts/guide/part3_vocab_type_rules.md) — **PART 3.9 v4.0.7 (example_sentence 8 universal subsections)** 🆕
- [prompts/guide/part4_prompt_templates.md](prompts/guide/part4_prompt_templates.md) — Template C v4.0.7 [STRICT LAYOUT DIRECTIVE] + 6-condition SCENE & ACTION + Horror Vacui defense
- [prompts/guide/part5_vocab_reference_appendix.md](prompts/guide/part5_vocab_reference_appendix.md) — NAMED_CHARACTER_PROFILES (portraitPath 5 件)
- [design_brief.md](design_brief.md) — ツール設計書
