# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-26 X-a-4 `docs/LESSON_SKILLS_MANUAL.md` 起草完了 🆕
（5 skill suite + 14 ルール出典 + 典型ワークフロー / 既存 SKILLS_MANUAL.md は画像 prompt 系のまま温存）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 α5 延長 / α5 fix-up / β1 / v4.0.4 skill 化 完了** ✅
- **Phase γ2 スライドデザイン微修正 全 12 ブロック user 視聴 OK** ✅
- **Phase X-a 全 4 ステップ完了** ✅ 🆕
  - X-a-1: `/lesson-scaffold NN`（seed mode 第3課で実視確認 PASS）
  - X-a-2: `/lesson-check NN` + `/lesson-fill-vocab NN`（lesson_01/02 で smoke PASS）
  - X-a-3: `/lesson-suggest-activities NN` + `/lesson-build-registry NN`
    （lesson_01/02 で smoke PASS）
  - X-a-4: [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) 起草
    （5 skill 概要表 + 14 ルール出典対応 + 典型ワークフロー） 🆕

### スナップショット（2026-05-26 X-a-4 完了直後・コマンドで再導出）

```
image_registry: pending 469 / generated 16 / outdated 6 / (none) 1 (drive=0/local=16)
                ↑ 29 件 Drive orphan を pending 化 (ex_L01_*×15 + char_*×5 + vocab/word_*×9)
image_prompts_skill.json: 30 entries / guideManifestHash 0673ca2d537e
audio_registry:  tts-local-regen 416 / (none) 50 (= 466 total)
                 word 416/466 全 user OK / sentence 50/466 は 5/24 のまま
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent unknown 502 / tts_workaround 0
ojad cache:     416 entries (389 ok / 22 not_found)
guide manifest: PART 1-6 .md 6 file / hash 0673ca2d537e
slide_html.js:  γ2 改修 12 ブロック user 視聴 OK
LUFS:           ERROR 20 / WARN 80（439/459 PASS）← 構造上既知制約
git:            main = origin/main 同期済（5/26 push 完了）
```

---

## active

### 次セッション着手点：**X-b (targetStudentLevel 導入) または X-c (例文 revision + 29 件再生成)**

γ2 全 12 ブロック視聴確定済（5/26）+ X-a 全 4 ステップ完了（5/26）。
残り：X-b / X-c の 2 件、優先順位は **X-b > X-c** 想定（kanji 表示制約が確定すると
例文 revision の語彙選定も決まるため）。

### (a) 課マスター作成 skill suite（モジュラー型）✅ 全完了

| Phase | skill | ファイル | 状態 |
|---|---|---|---|
| 1 | `/lesson-scaffold NN` | [.claude/skills/lesson-scaffold.md](.claude/skills/lesson-scaffold.md) + [scripts/lib/lesson-scaffold.mjs](scripts/lib/lesson-scaffold.mjs) + [scripts/lib/lesson-scaffold-pdf.py](scripts/lib/lesson-scaffold-pdf.py) | ✅ |
| 2 | `/lesson-check NN` | [.claude/skills/lesson-check.md](.claude/skills/lesson-check.md) + [scripts/lib/lesson-check.mjs](scripts/lib/lesson-check.mjs) | ✅ |
| 2 | `/lesson-fill-vocab NN` | [.claude/skills/lesson-fill-vocab.md](.claude/skills/lesson-fill-vocab.md) + [scripts/lib/lesson-fill-vocab.mjs](scripts/lib/lesson-fill-vocab.mjs) | ✅ |
| 3 | `/lesson-suggest-activities NN` | [.claude/skills/lesson-suggest-activities.md](.claude/skills/lesson-suggest-activities.md) + [scripts/lib/lesson-suggest-activities.mjs](scripts/lib/lesson-suggest-activities.mjs) | ✅ |
| 3 | `/lesson-build-registry NN` | [.claude/skills/lesson-build-registry.md](.claude/skills/lesson-build-registry.md) + [scripts/lib/lesson-build-registry.mjs](scripts/lib/lesson-build-registry.mjs) | ✅ |
| 4 | [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) | skill suite の全体像 + 使用フロー + 14 ルール出典対応表 | ✅ 🆕 |

**X-a で見つかった既存課題** (要 user 判断・優先度低):

- L2 主活動 `act_belongings_qa` は `prerequisitePatterns` 部分 satisfied (1/2)
  でも score 235 で top — 教科書 origin が強く効いている。問題ないが scoring 重みの
  見直し余地あり (現状はそのまま運用可)
- master_image_registry に `word_時計` と `vocab_時計` が両方 entry 化されている
  (legacy convention と new convention の重複)。data 整合の問題で skill の問題では
  ない。気になれば手で旧 entry を outdated 化

**X-a 改善候補** (skill md 強化・優先度低):

- scaffold seed 抽出を拡張: PDF ホワイトボード板書 → `practiceTemplates` seed /
  「教え方の例」section → intro_activity 候補紐付け / 注意・プラスα 抽出
- check lint で `_comment` field 内の "TODO" を除外する filter (現状は人間メモも拾う)
- build-registry: 既存 entry の `naturalness` / `images[].imageUrl` を見て、
  「画像/音声 generated 済だが lesson が参照していない」detect 機能 (孤立 detect)

### 🆕 (b) lesson に `targetStudentLevel` を導入 + level-aware 生成

**動機**：user 観察 — lesson_01 のスライドに「漢字・難しい表現が多すぎる」。
JLPT メタは既に存在するが生成側で参照していない:
- `patterns[].jlptLevel` ✅ 存在
- `vocabulary.byPattern[*].words[].jlptLevel` ✅ 存在（23 箇所付与済み）
- `lesson.level` は自由文字列（`"初級前半(Lv.1)"`）で機械判定不可
- `lesson.targetStudentLevel` ❌ まだ無い（X-a-3 の suggest-activities では
  patterns[].jlptLevel か "N5" fallback で代用している）

**実装**：
- (b-1) `lesson.targetStudentLevel: "N5" | "N4" | "N3" | "N2" | "N1"`
  enum を新設（lesson_01/02 で人間判断・教科書 ABC は典型 N5 想定）
- (b-2) `slide_html.js` / `homework_html.js` / `activity_html.js` で読取り:
  - 例文・指示文中の漢字で `kanjiJlptLevel > targetStudentLevel` のものは
    ふりがな強制 ON（既存 `.ruby-toggle` を無視して常時表示）
  - 語彙カードで `word.jlptLevel > targetStudentLevel` のものは「上級語」マーク
- (b-3) 後段：例文・指示文の語彙選定 (生成プロンプト) 側にも `targetStudentLevel`
  を渡し、超過漢字を平易表現に置換するロジック（δ 以降）

優先度：**X-a-4 (SKILLS_MANUAL) > (b-1)(b-2) > (b-3)**

### 🆕 (c) 例文 / 例文画像 revision + 画像 29 件再生成

**動機**：(1) lesson_01 視聴で「例文を見直したい」意向あり。(2) `targetStudentLevel`
導入 (X-b) 後は kanji jlptLevel 制約も入るため例文文面ごと再設計対象。
(3) ローカル環境移行で Drive 上の 29 件 (ex_L01_*×15 + char_*×5 + vocab/word_*×9)
が SA アクセス不可となり pending 化済 (5/26)。再生成タイミングと統合できる。

**順序**：例文 revision → image_prompts skill で再生成 → 画像配置 → registry generated 化。
ex_L01_* と char_* は強い依存関係 (同一 portrait) なので一括設計推奨。

### β1 残課題 / γ1 残作業

- **lesson_02 以降の β1 検証**：lesson_02 の practiceImageSource / 答え抽出
  ロジック未検証。lesson_02 で patterns を見て必要なら拡張
- **複数 practiceTemplates 対応**：現コードは `practiceTemplates[0]` のみ render
  （lesson_01 p2 は 3 templates あるが先頭のみ）
- **γ1 (スライド音声移植)**：user は γ2 デザインを優先したため後送り。
  homework の .audio-btn 機構を slide_html.js に移植

### 並行待機

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
  - 50 sentence audio は 5/24 のまま、homework UI からは消した状態
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
  (consensus `^ぼーるぺん` 平板 vs manual `^ぼーる!ぺん` 中高 4)
- **同表記2読み恒久対策**：`pickCatalogEntry` を lesson_*.json reading 確定に切替
- **lesson_02 以降の v4.0.4 building 移行**：病院 / 銀行 / 駅 / スーパー を
  PART 5.10 BUILDING_CUES に追加（v3.0 legacy → v4.0.4 採用）

### 触らない既知制約

- LUFS ERROR 20 件（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題）

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
    X-a-1  /lesson-scaffold NN (empty + PDF seed mode)             ✅ 完了
    X-a-2  /lesson-check + /lesson-fill-vocab                       ✅ 完了
    X-a-3  /lesson-suggest-activities + /lesson-build-registry     ✅ 完了
    X-a-4  docs/LESSON_SKILLS_MANUAL.md (suite まとめ)             ✅ 完了 🆕
  X-b    lesson.targetStudentLevel 導入 + level-aware 生成         次セッション
  X-c    例文 / 例文画像 revision + 29 件 (Drive orphan) 再生成    X-b 後
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)  ← user 教育判断・最重
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
  ε1     end-to-end 動作確認
  ε2     docs 整理 + 例文 audio 再検討
```

---

## 確定仕様

### γ2 スライド変更（user 視聴 OK で確定 5/26）

- 例文 anchor 画像列：`minmax(0, 440px)` で 16:9 約 440×248px、grid item の 1.6 倍程度
  - ※将来 example image に char / vocab 画像が混入する場合の aspect 柔軟性は要対応
- POS 線：`examples[].highlight` 明示時のみ。自動 は/が 分割は廃止
  → AUTHORING_CHECKLIST.md で必須項目化対象
- パターンボックス：文型スライドから削除（タイトル重複解消）
- カードプレゼンター：grid + click-to-zoom（カルーセル廃止）。vocab / building /
  named-character すべてに適用
- スライド：`min-height: calc(100vh - 64px)` 自然フロー + page スクロール
- slide padding 縮小 + 画像 max-height 引き締め：自然フロー化と対。
  slide-body 36/60/76px、通常カード画像 max-height 40vh、語彙 160px、anchor 440px
- teacher_photo：`qa_card_pair` で N スロット横並び（`materialNeeds[].count` 可変・
  デフォルト 4）+ 文型ボックス削除（pedagogy）
- ruby マージ：2 漢字以下のみ単一 ruby、3 漢字以上は分割

### ローカル環境移行: Drive orphan pending 化 (5/26 確定)

- Drive 画像 29 件 (ex_L01_*×15 + char_*×5 + vocab/word_*×9) は SA アクセス不可
- registry mutation: `imageUrl=null` / `status='pending'` / `originalImageUrl` 保全
- 再生成は X-c (例文 revision と統合) で実施。当面 lesson_01 view は 29 件 broken
- script: `scripts/pend-drive-orphan-images.mjs --apply`（再現用に保存）

### β1 宿題正解判定 (D) — 実装済

- 採点タイミング：即時（設問ごと判定 + visual ○×）
- 不正解時：「もう一度」で × input のみクリア・○ 済み保持
- 正解参照：「正解を表示」ボタン トグル
- 正解ソース：examples[] 正規表現抽出 + namedCharacters fallback
- 判定粒度：複数解 any-match で○、per-input 緑/赤、句読点・空白無視
- 音声配置：語彙チェックカードのみ（例文・練習問題は audio 再検討待ちで保留）

### accent precedence (Phase α5 延長確定)

`accent_override (manual)` > `accent_consensus_override` >
`accent_yomigana (UniDic raw)` > plain text fallback

### v4.0.4 building design (skill 化済 / 採用 4 件)

- 採用版：学校 R25 / 大学 R26 / デパート R22 / 会社 R22
- universal rule A-1〜A-11 ([part1_universal_rules.md PART 1.13](prompts/guide/part1_universal_rules.md))
- 5-image reference attachment (image_1=brand voice / 2-4=type-relevant person / 5=architectural)
- 未移行 4 件 (銀行 / 病院 / 駅 / スーパー) は v3.0 legacy path

---

## ブロッカー / 並行

- γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：design insight 転記完了 → main へ ff-merge 済み
  (commit 5b12e93 + 8796634)。**今後のマスタープロンプトガイド修正用に削除しない方針確定**
- **不変条件 hash**：`scripts/invariants.mjs` の `guideManifestExpectedHashPrefix` は
  `0673ca2d537e`。今後 `prompts/guide/part1-6.md` を変更する人は invariants.mjs の
  hash も合わせて更新必須
- **building skill dispatch**：`BUILDING_V4_0_4_WORDS = {学校, 大学, デパート, 会社}`
  は `_meta.mode === 'skill'` 出力時のみ BG=CREAM + NOT_TOKEN 必須化（preflight.py +
  invariants.mjs 両方に定数定義）。未移行 4 件（銀行/病院/駅/スーパー）は v3.0 legacy 経路
- **Template B 2 系統**：`part4_prompt_templates.md` に v4.0.4 採用版（17 placeholders +
  5-image reference）と v3.0 Legacy 版が併記。skill 側は part5 BUILDING_CUES の
  `v4_0_4_*` fields 有無で dispatch

---

## 直近の確定コマンド

```
# 検証
npm run validate                # A=v7.5 / B=891b73f5ae2d / B'=0673ca2d537e / C / D / D' PASS

# 課マスター作成 skill suite (manual invoke)
/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf]
/lesson-check NN [--json]
/lesson-fill-vocab NN [--apply] [--json]
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
/lesson-build-registry NN [--apply] [--json]

# スライド γ2 動作確認
python -m http.server 8766 --bind 127.0.0.1   # http://127.0.0.1:8766/ で index.html
# JSON タブ → data/session_001.json → スライド HTML DL → 開く

# Audio 再生成
node scripts/regen-drive-download.mjs --accent-changed
node scripts/regen-drive-download.mjs --force
npm run generate-audio

# Accent consensus (UniDic + NHK + OJAD)
python scripts/scrape-ojad.py --audio-only
python scripts/build-accent-consensus.py --apply --audio-only

# 自然さ QC（個別）
node scripts/check-audio-naturalness.mjs --force --only ID1,ID2

# 画像
ls tmp/skill_prompts/
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only
```

---

## 関連ドキュメント

- [docs/LESSON_SKILLS_MANUAL.md](docs/LESSON_SKILLS_MANUAL.md) — 課マスター作成 5 skill suite マニュアル 🆕
- [docs/SKILLS_MANUAL.md](docs/SKILLS_MANUAL.md) — 画像 prompt 系 skill マニュアル
- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目
- [docs/design_ojad_nhk_consensus.md](docs/design_ojad_nhk_consensus.md) — α5 延長 consensus 設計
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules
- [design_brief.md](design_brief.md) — ツール設計書
