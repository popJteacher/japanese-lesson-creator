# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-26 Phase X-a 課マスター作成 skill suite **Phase 2 完了** 🆕
（`/lesson-check NN` + `/lesson-fill-vocab NN` 実装。14 ルール lint
(A-2/A-3/A-4/A-5/A-6/B-5/B-6/B-7/B-8/B-9/C-10/C-11) + inheritance / jlpt 自動補完）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 α5 延長 / α5 fix-up / β1 / v4.0.4 skill 化 完了** ✅
- **Phase γ2 スライドデザイン微修正 大半着手**（user 視聴中・要確定）
- **Phase X-a Phase 1 + Phase 2 完了** 🆕
  - X-a-1: `/lesson-scaffold NN`（seed mode 第3課で実視確認 PASS）
  - X-a-2: `/lesson-check NN` + `/lesson-fill-vocab NN`（lesson_01/02 で smoke PASS）

### この回の γ2 改修内容 (2026-05-26) 🆕

`src/generators/slide_html.js` + `src/common/ruby_kuromoji.js`：

1. **文字間バランス**：`ruby + ruby { margin-left: -0.15em }` 削除（trial 同症状再現 →
   助詞「の／な／を／が」が後続漢字に密着する副作用の根絶）
2. **cover スライドから vocab プレビュー行を削除**（1 枚目に単語カード不要）
3. **例文スライド**：★代表例文 テキスト削除 / 画像を全 `aspect-16x9` 統一 /
   anchor 画像列 `minmax(0, 440px)` に拡大（grid item の 1.6 倍程度）/
   `.sentence` を `line-height: loose` でふりがな下線被り解消
4. **POS 線 (主語ゴールド / 述語青)** は自動 は/が 分割を廃止し、
   `examples[].highlight: {subject, predicate, particle, trailing}` 明示時のみ描画
5. **文型スライドのパターンボックス削除**（タイトル `〜は〜です` と本文 box の重複解消・試行）
6. **カードプレゼンター**：vocab / building / named-character すべてを
   `.vocab-presenter` でラップ → grid 一覧 + クリックで全画面ズーム（カルーセル方式廃止）
7. **スライドを自然フロー化**：`.slide` を `position: absolute; inset: 0` →
   `min-height: calc(100vh - 64px)` + page スクロール (trial 方針移植)。
   カードが見切れずに必ず全体表示される
8. **教師持込素材**：`materialNeeds[].type === "teacher_photo" / "world_map"` 指示時だけ描画 +
   Drag&Drop でファイル取込 + ←/→ カルーセル + 画像時はボタン hover only
9. **qa_card_pair**：`teacher_photo` 指定時は **N スロット横並び**（`materialNeeds[].count` で
   可変・デフォルト 4）+ **文型ボックス削除**（intro 段階で先回り開示しない pedagogy）
10. **ruby 複合語マージ**：2 漢字以下のみ単一 ruby、3 漢字以上は分割
    （東西病院 → `東西` + `病院` の 2 ruby に → 改行時 `病院` だけ次行に送れる）
11. **slide padding 縮小** (60/80/100 → 36/60/76) + 各カード画像 max-height 引き締め
12. **Drag&Drop**: document レベル `preventDefault` + file input を DOM 経由でクリック
    （detached input.click 黙殺ブラウザ対応）

### スナップショット（2026-05-26 γ2 改修途中・コマンドで再導出）

```
image_registry: pending 439 / generated 40 / approved 5 / outdated 6 / (none) 1
image_prompts_skill.json: 30 entries / guideManifestHash 0673ca2d537e
audio_registry:  tts-local-regen 416 / (none) 50 (= 466 total)
                 word 416/466 全 user OK / sentence 50/466 は 5/24 のまま
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent unknown 502 / tts_workaround 0
ojad cache:     416 entries (389 ok / 22 not_found)
guide manifest: PART 1-6 .md 6 file / hash 0673ca2d537e
slide_html.js:  γ2 改修 12 ブロック（user 試聴中）
```

---

## active

### 次セッション着手点：**γ2 確定 + Authoring Checklist 新設 + JLPT level-aware 生成**

γ2 の改修は user 試聴中。視聴後に「採用 / 戻す / さらに調整」を確定する。
そのうえで以下 2 件の新規 work が user 要望として残っています:

### 🆕 (a) 課マスター作成 skill suite（モジュラー型）

**Phase 1 + Phase 2 完了** 🆕

| Phase | skill | ファイル | 状態 |
|---|---|---|---|
| 1 | `/lesson-scaffold NN` | [.claude/skills/lesson-scaffold.md](.claude/skills/lesson-scaffold.md) + [scripts/lib/lesson-scaffold.mjs](scripts/lib/lesson-scaffold.mjs) + [scripts/lib/lesson-scaffold-pdf.py](scripts/lib/lesson-scaffold-pdf.py) | ✅ 完了 |
| 2 | `/lesson-check NN` | [.claude/skills/lesson-check.md](.claude/skills/lesson-check.md) + [scripts/lib/lesson-check.mjs](scripts/lib/lesson-check.mjs) | ✅ 完了 🆕 |
| 2 | `/lesson-fill-vocab NN` | [.claude/skills/lesson-fill-vocab.md](.claude/skills/lesson-fill-vocab.md) + [scripts/lib/lesson-fill-vocab.mjs](scripts/lib/lesson-fill-vocab.mjs) | ✅ 完了 🆕 |
| 3 | `/lesson-suggest-activities NN` | jlptLevel + patternId で activity_catalog 絞り込み候補提示 | 未着手 |
| 3 | `/lesson-build-registry NN` | lesson_NN.json から master_image_registry / master_audio_registry pending 自動生成 | 未着手 |
| 4 | `docs/SKILLS_MANUAL.md` | skill suite の全体像 + 使用フロー + 14 ルール出典の対応表 | 未着手 |

**X-a-1 (scaffold)** 実装済の挙動:
- `/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf]`
- empty mode (PDF なし placeholder) / seed mode (PDF を PyMuPDF → vision 抽出 → cache)
- 14 ルール自動保証 B-6 (practiceTemplates ≥2) / B-7 (intro_act/main_act materialNeeds) /
  C-9 (1a→1e) / C-11 (formatVersion/lessonVersion)
- **2026-05-26 第3課で seed mode 実視確認 PASS** (title / patterns 6 件 / vocab 4 group 16 語 /
  namedCharacter 1 件 / mainActivity playerSteps 3 件すべて vision 抽出成功)
- 検証 artifact `data/lesson_03.json` は意図的に削除 (seed cache は保持・gitignore 済)

**X-a-2 (check + fill-vocab)** 実装済の挙動 🆕:
- `/lesson-check NN [--json]`: schema 検査 (validate.mjs) + 14 ルール lint (A-2/A-3/A-4/
  A-5/A-6/B-5/B-6/B-7/B-8/B-9/C-10/C-11) + TODO 全文字列 scan。ERROR/WARN/TODO 別出力
- `/lesson-fill-vocab NN [--apply] [--json]`: 過去課からの inheritance マーク +
  vocab_catalog からの jlptLevel 補完。**既存ユーザー値は上書きしない**。dry-run 既定
- 実適用は `--apply` 明示時のみ (CLAUDE.md「教育内容の確定は人間に報告してから」遵守)

**X-a-2 で見つかった既存課題** (本セッションでは未修正・user 判断待ち):
- lesson_01 p1/p3 / lesson_02 p4: `practiceTemplates` 1 件のみ (B-6 違反)
  → v2.11.4 で意図的に削減された経緯あり。ルール側 or lesson 側どちらを更新するか要決定
- lesson_01 p2 / lesson_02 p1/p3/p4: `canDo` 複数文 (A-4 文数 WARN)
  → 1 文制約はルール建前。lesson 側の詳細記述を残すなら A-4 文数を WARN のまま運用継続でも OK
- lesson_02 病院: `_inheritedFromLessonX: "lesson_01"` 欠落
  → `/lesson-fill-vocab 02 --apply` で補完可能 (dry-run 確認済・user 判断で適用)

**X-a 改善候補** (skill md 強化・優先度低):
- scaffold seed 抽出を拡張: PDF ホワイトボード板書 → `practiceTemplates` seed /
  「教え方の例」section → intro_activity 候補紐付け / 注意・プラスα 抽出
- check lint で `_comment` field 内の "TODO" を除外する filter (現状は人間メモも拾う)

**PDF 運用**：
- 教科書 PDF (第2-30課) は `data/sources/pdfs/` に user が手動コピー (gitignore 済)
  - 例: `cp ~/Downloads/第*.pdf data/sources/pdfs/`
- seed 抽出 cache は `data/lesson_seed_cache/` に蓄積 (gitignore 済)
- PDF 不在の課は empty mode に自動 fallback

### 🆕 (b) lesson に `targetStudentLevel` を導入 + level-aware 生成

**動機**：user 観察 — lesson_01 のスライドに「漢字・難しい表現が多すぎる」。
JLPT メタは既に存在するが生成側で参照していない:
- `patterns[].jlptLevel` ✅ 存在
- `vocabulary.byPattern[*].words[].jlptLevel` ✅ 存在（23 箇所付与済み）
- `lesson.level` は自由文字列（`"初級前半(Lv.1)"`）で機械判定不可

**実装**：
- (b-1) `lesson.targetStudentLevel: "N5" | "N4" | "N3" | "N2" | "N1"`
  enum を新設（lesson_01/02 で人間判断・教科書 ABC は典型 N5 想定）
- (b-2) `slide_html.js` / `homework_html.js` / `activity_html.js` で読取り:
  - 例文・指示文中の漢字で `kanjiJlptLevel > targetStudentLevel` のものは
    ふりがな強制 ON（既存 `.ruby-toggle` を無視して常時表示）
  - 語彙カードで `word.jlptLevel > targetStudentLevel` のものは「上級語」マーク
- (b-3) 後段：例文・指示文の語彙選定 (生成プロンプト) 側にも `targetStudentLevel`
  を渡し、超過漢字を平易表現に置換するロジック（δ 以降）

優先度：**(a) > (b-1)(b-2) > (b-3)**（(a) は今すぐ運用化しないと忘れる）

### β1 残課題 / γ1 / γ2 残作業

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

- LUFS ERROR 28 件（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題）

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成   ✅ 全完了
Phase β  宿題完成
  β1 ✅ 正解判定 (D)・homework_html.js 改修・user 試聴 OK
Phase γ  スライド完成
  γ1     音声再生（homework .audio-btn 機構を移植）  ← user 都合で後送り
  γ2     デザイン微修正  ← 大半着手 / user 視聴中・要確定 🆕
Phase X (γ2 派生・user 要望)
  X-a    課マスター作成 skill suite                                ← 進行中
    X-a-1  /lesson-scaffold NN (empty + PDF seed mode)             ✅ 完了
    X-a-2  /lesson-check + /lesson-fill-vocab                       ✅ 完了 🆕
    X-a-3  /lesson-suggest-activities + /lesson-build-registry     次セッション
    X-a-4  docs/SKILLS_MANUAL.md (suite まとめ)
  X-b    lesson.targetStudentLevel 導入 + level-aware 生成        🆕
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

### γ2 スライド変更（試行・user 確定待ち）

- 例文 anchor 画像列：`minmax(0, 440px)` で 16:9 約 440×248px、grid item の 1.6 倍程度
- POS 線：`examples[].highlight` 明示時のみ。自動 は/が 分割は廃止
- パターンボックス：文型スライドから削除（タイトル重複解消の試行）
- カードプレゼンター：grid + click-to-zoom（カルーセル廃止）。vocab / building /
  named-character すべてに適用
- スライド：`min-height: calc(100vh - 64px)` 自然フロー + page スクロール
- teacher_photo：`qa_card_pair` で N スロット横並び（`materialNeeds[].count` 可変・
  デフォルト 4）+ 文型ボックス削除（pedagogy）
- ruby マージ：2 漢字以下のみ単一 ruby、3 漢字以上は分割

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
- **main は origin/main から 3 commit ahead**（5b12e93 / 8796634 / 3e4a58e）。
  次セッション開始時に push 判断（CLAUDE.md 「push は明示許可制」）
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

- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目
- [docs/design_ojad_nhk_consensus.md](docs/design_ojad_nhk_consensus.md) — α5 延長 consensus 設計
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules
- [design_brief.md](design_brief.md) — ツール設計書
