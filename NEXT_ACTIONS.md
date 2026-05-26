# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-26 X-c: v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE + lesson_01 p2 分離型再構成 🆕

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 β1 / γ2 / X-a 全 4 / X-b 部分 / X-d 完了** ✅
- **Phase X-c 文書・データ整備完了** ✅ 🆕（画像生成は次セッション着手）
  - **v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE 機構化** (PART 1.12 building の人物版・cross-example same-character coherence)
    - [PART 1.14 新設](prompts/guide/part1_universal_rules.md): scope / Principle / rule_a (per-character 1-image) / rule_b (ROLE+ASPECT cross-ref) / rule_c (placeholders) / rule_d (cost) / Detection algorithm (sentence + sceneCharacters union)
    - [PART 5.9 NAMED_CHARACTER_PROFILES 拡張](prompts/guide/part5_vocab_reference_appendix.md): 各 entry に `portraitPath` field 追加 (5 entries) + Reference image constants table 新設
    - [Template C 改修](prompts/guide/part4_prompt_templates.md): `[REFERENCE]` section + `{NAMED_CHARACTER_REFERENCES}` placeholder + styleReferences output JSON field
    - [generate-image-prompt skill md 改修](.claude/skills/generate-image-prompt.md): `mode=lesson-examples` 新規追加・NAMED_CHARACTER detection (sentence + sceneCharacters union) ロジック
    - invariants.mjs guide manifest hash 更新: `0673ca2d537e` → `15bd5fbf566b`
  - **lesson_01.json v2.12 (lessonVersion 1.2)** — [scripts/_xc_lesson01_p2_separation.py](scripts/_xc_lesson01_p2_separation.py)
    - patterns[p2].examples を 5 件 → **8 件**に分離型再構成: 旧 2-3(Q+A)/2-4(Q+肯定+否定)/2-5(Q+肯定+否定) を Q と A 別 example に分割
    - anchor を 旧 2-4(先生ですか) → **新 2-1(リンさんですか)** に戻す (PDF p.6 文型 2-1 原典回帰)
    - patterns[p3].examples の imageId/audioId を **ex_L01_011..015 → ex_L01_014..018** に shift
    - 全 examples (p1+p2+p3 = 18 件) に `sceneCharacters[]` field 追加 (主語省略文の addressee 明示用)
    - **キャラ分布**: リン 4 / 鈴木 4 / キム 5 / タノム 1 / なし 1(p2-3 だれですか)
  - **master_image_registry.json renumber** — [scripts/_xc_registry_p2_renumber.py](scripts/_xc_registry_p2_renumber.py)
    - ex_L01 entries: 15 → **18 件**: 新規 ex_L01_011/012/013 (p2 拡張 2-6/2-7/2-8) + ex_L01_014-018 (p3 shift)
    - 旧 p3 entry (011-015) は内部 imageId / filename / promptRef 含めて完全 rename

### スナップショット（2026-05-26 X-c 着地直後・コマンドで再導出）

```
image_registry:  generated 16 / pending 471 / outdated 6 / (none) 1 = total 494
                 ↑ ex_L01_* 15 → 18 件 (p2 8 件化・p3 shift)
                 ↑ char_* 6 件 (鈴木/リン/キム/タノム/ケリー/einstein_style) は pending 維持
image_prompts_skill.json: 30 entries / guideManifestHash 15bd5fbf566b (X-c update 前は 0673ca2d537e)
                          ↑ PART 1.14 + PART 4 Template C 改修 + PART 5.9 portraitPath 反映済
audio_registry:  466 entries / 459 active (X-c で変化なし)
vocab_catalog:   17508 entries (schemaVersion 1.2・X-c で変化なし)
LUFS:            ERROR 20 / WARN 80 (439/459 PASS)← 構造上既知制約
git:             main = 8a6be89 (X-d)・X-c の commit は未作成
```

---

## active

### 次セッション着手点：**X-c 画像生成 (char_* → ex_L01_*)**

文書・データ整備は完了したので、次は画像生成の実行。
**順序**: char_* portrait 6 件を先に生成・確定 → その portrait を reference として ex_L01_* 18 件を生成 (PART 1.14 自動 attachment)。

#### 手順 (a) char_* portrait 6 件生成

| char | portraitPath | profile (PART 5.9) |
|---|---|---|
| char_鈴木 | data/images/char_鈴木.png | 40s-50s 日本人男性教師 / navy or charcoal business suit |
| char_リン | data/images/char_リン.png | 20s 中国人女性大学生 / casual smart top + jeans + backpack |
| char_ケリー | data/images/char_ケリー.png | 30s-40s 米国人女性教師 / smart casual blouse + cardigan |
| char_キム | data/images/char_キム.png | 20s 韓国人男性会社員 / slim rectangular glasses + business casual |
| char_タノム | data/images/char_タノム.png | 20s ベトナム人男性医者 / white doctor's coat + stethoscope |
| char_einstein_style | data/images/char_einstein_style.png | (lesson_02 用・X-c スコープ外・pending 維持) |

skill 起動: `/generate-image-prompt mode=explicit --words 鈴木,リン,キム,タノム,ケリー`
※ vocab_catalog に NAMED_CHARACTER として entry がない場合、まず character_asset として catalog 登録が必要。

#### 手順 (b) ex_L01_* 18 件 prompt 生成

skill 起動: `/generate-image-prompt mode=lesson-examples --lesson 01`
- 自動的に PART 1.14 detection (sentence + sceneCharacters union) で NAMED_CHARACTER 検出
- styleReferences[] に portraitPath を自動 push
- Template C で [REFERENCE] section を render (NAMED_CHARACTER 不在の ex_L01_008「だれですか」は省略)

#### 手順 (c) 画像生成 + 配置 + registry generated 化

- nanobanana で 18 件生成 (chain=true で skill 内一気通貫も可)
- data/images/ 配下に配置
- registry status を pending → generated に更新

### β1 残課題 / γ1 残作業

- **lesson_02 以降の β1 検証**：lesson_02 の practiceImageSource / 答え抽出ロジック未検証
- **複数 practiceTemplates 対応**：現コードは `practiceTemplates[0]` のみ render (lesson_01 p2 は v2.12 で 1 template / p1/p3 は 1 件・lesson-check の B-6 ERROR は p1/p3 が ≥2 必須を満たさない既存問題)
- **γ1 (スライド音声移植)**：homework の .audio-btn 機構を slide_html.js に移植

### 並行待機

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証。p2 拡張で sentence audio が 5 → 8 件 + p1/p3 で計 18 件 (旧 15 → 新 18) になり再録対象
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
- **同表記2読み恒久対策**：`pickCatalogEntry` を lesson_*.json reading 確定に切替
- **lesson_02 以降の v4.0.4 building 移行**：病院 / 銀行 / 駅 / スーパー を PART 5.10 BUILDING_CUES に追加
- **PART 1.14 v4.0.5 PoC 後の判定**: ex_L01_* 生成・user 実視で identity consistency 評価 → 結果次第で lesson_02 以降に展開
- **(b-3) 生成プロンプト側で超過漢字を平易表現に置換**: X-c 完了後に着手 (元 NEXT_ACTIONS 並行待機項目)

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
  X-c    例文 revision + 21 件 (Drive orphan) 再生成 + v4.0.5 PERSON ref 機構化
    X-c-1  PART 1.14 + PART 5.9 portraitPath + Template C [REFERENCE]  ✅ 完了 🆕
    X-c-2  lesson_01 p2 分離型再構成 (5→8) + sceneCharacters[] + p3 shift ✅ 完了 🆕
    X-c-3  master_image_registry.json renumber (15→18 件 + sentence)   ✅ 完了 🆕
    X-c-4  char_* portrait 6 件生成 (除 einstein_style)                次セッション
    X-c-5  /generate-image-prompt mode=lesson-examples --lesson 01    次セッション
    X-c-6  画像配置 + registry generated 化 + 実視                     次セッション
    X-c-7  user 実視 OK で v4.0.5 PoC 確定 (NG なら roll-back 判断)    次セッション
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)  ← user 教育判断・最重
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
```

---

## 確定仕様

### v4.0.5 PERSON_REFERENCE_ATTACHMENT_RULE (X-c 確定 / 2026-05-26)

- **対象**: `vocab_type == "example_sentence"` で sentence または `sceneCharacters[]` に NAMED_CHARACTER を含むカード
- **検出**: sentence string match + `examples[].sceneCharacters[]` の UNION (PART 1.14 detection algorithm)
- **attach 数**: 1-4 件 per request (5+ は warning + 切り捨て)
- **portraitPath**: PART 5.9 NAMED_CHARACTER_PROFILES の各 entry に登録済 (5 件)
- **enforcement**: `nanobanana-client.mjs` 既存の `referenceImages` 機構を流用 (変更不要)
- **guide manifest hash**: `15bd5fbf566b` (前: `0673ca2d537e`)

### γ2 スライド変更（user 視聴 OK で確定 5/26）

- 例文 anchor 画像列：`minmax(0, 440px)` で 16:9 約 440×248px、grid item の 1.6 倍程度
- POS 線：`examples[].highlight` 明示時のみ。自動 は/が 分割は廃止
- パターンボックス：文型スライドから削除（タイトル重複解消）
- カードプレゼンター：grid + click-to-zoom（カルーセル廃止）
- スライド：`min-height: calc(100vh - 64px)` 自然フロー + page スクロール
- teacher_photo：`qa_card_pair` で N スロット横並び (デフォルト 4)
- ruby マージ：2 漢字以下のみ単一 ruby、3 漢字以上は分割

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

- γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：design insight 転記完了 → main へ ff-merge 済み
- **不変条件 hash**：`scripts/invariants.mjs` の `guideManifestExpectedHashPrefix` は `15bd5fbf566b` (X-c で更新済)
- **building skill dispatch**：`BUILDING_V4_0_4_WORDS = {学校, 大学, デパート, 会社}` は `_meta.mode === 'skill'` 出力時のみ BG=CREAM + NOT_TOKEN 必須化
- **Template B 2 系統**：`part4_prompt_templates.md` に v4.0.4 採用版と v3.0 Legacy 版が併記。skill 側は part5 BUILDING_CUES の `v4_0_4_*` fields 有無で dispatch
- **Template C v4.0.5**: `[REFERENCE]` section は NAMED_CHARACTER 検出時のみ skill が emit、不在時は省略

---

## 直近の確定コマンド

```
# 検証
npm run validate                # A=v7.5 / B=891b73f5ae2d / B'=15bd5fbf566b (X-c update) / C / D / D' PASS

# X-c 画像生成 (次セッション着手)
/generate-image-prompt mode=explicit --words 鈴木,リン,キム,タノム,ケリー   # char_* portrait 5 件
/generate-image-prompt mode=lesson-examples --lesson 01                      # ex_L01_* 18 件 (PART 1.14 自動 attach)

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
- [docs/design_ojad_nhk_consensus.md](docs/design_ojad_nhk_consensus.md) — α5 延長 consensus 設計
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules (PART 1.12 building + 🆕 PART 1.14 person)
- [prompts/guide/part5_vocab_reference_appendix.md](prompts/guide/part5_vocab_reference_appendix.md) — NAMED_CHARACTER_PROFILES (portraitPath 追加済)
- [design_brief.md](design_brief.md) — ツール設計書
