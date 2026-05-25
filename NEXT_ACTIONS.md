# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-25 Phase β1 完了 + v4.0.4 design insight skill 化完了
（**β1 = 宿題練習問題の正解判定 UI + 音声配置整理 完了 (user 試聴 OK)
／ v4.0.4 building design insight を worktree phase4-prompt-plan で
PART 1-6 .md に手動転記 → main へ ff-merge 済み** 🆕：
PART 1.12 + 1.13 (A-1〜A-11 + 13 学び) / PART 3.2 / PART 4 Template B
(5-image reference + 17 placeholders) / PART 5.10 BUILDING_CUES 4 件
v4_0_4_* fields / PART 2 BACKGROUND_BY_TYPE.building → legacy 専用化 /
PART 6 + preflight.py で v4.0.4 採用 building も BG_EXACT_CREAM + NOT_TOKEN
必須 / invariants.mjs B' hash 0673ca2d537e。**次は Phase γ1 (スライド音声移植) 着手**）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 〜 α5 延長 / α5 fix-up / β1 / v4.0.4 skill 化 完了** ✅

### v4.0.4 skill 化 (2026-05-25 完了) 🆕

worktree image-prompt-plan の R1-R26 実機検証で結晶した v4.0.4 building design insight
を main 側 skill 形式に転記:

- `prompts/guide/part1_universal_rules.md`：PART 1.12 BUILDING_REFERENCE_ATTACHMENT_RULE
  (5-image ref attach) + PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4 (A-1 Camera 〜
  A-11 Cyclist pose + 13 学び cross-reference 表)
- `prompts/guide/part3_vocab_type_rules.md`：3.2 building 全面書き換え (v4.0.4 採用 4 件
  と v3.0 legacy 未移行 4 件の 2 路線併記)
- `prompts/guide/part4_prompt_templates.md`：Template B 全面書き換え (5-image ref +
  17 placeholders) + PLACEHOLDER_ORIGINS Category B 拡張
- `prompts/guide/part5_vocab_reference_appendix.md`：BUILDING_CUES 4 件 (学校 R25 /
  大学 R26 / デパート R22 / 会社 R22) に v4_0_4_* fields 追加 + 共通 REF 定数
- `prompts/guide/part2_style_bible.md`：BACKGROUND_BY_TYPE.building を legacy 専用化
  + focal_length / occupancy / lens の v4.0.4 採用版併記
- `prompts/guide/part6_output_instructions.md`：BUILDING_V4_0_4_WORDS 定数 + C5 分岐
- `scripts/lib/prompt_preflight.py`：v4.0.4 採用 building も BG_EXACT_CREAM + NOT_TOKEN
  必須化（`_is_legacy_building(template_kind, word)` で分岐）
- `scripts/invariants.mjs`：guideManifestExpectedHashPrefix 1ca2f57ad927 →
  0673ca2d537e に更新 + C 検査で _meta.mode='skill' のみ v4.0.4 採用判定

### Phase β1 (2026-05-25 完了)

`src/generators/homework_html.js` 改修:

- **正解抽出** (lesson_01 examples[] + namedCharacters fallback):
  - p1: `^(\S+?)さんは(\S+?)です。?$` で examples 抽出 + occupation/nationality 補完
  - p2: 質問形式 examples 不在のため namedCharacters の occupation/nationality のみ
  - p3: 既存 RE_AFFIL でパース済 → `[char, building, occupation]` + 東西 prefix 有/無 2 形
  - `isMeaningfulAttr` で "——" placeholder を除外
- **判定 UI**: 答え合わせ / もう一度 / 正解を表示 ボタン
- **複数解許容**: any-match で○判定、per-input は「いずれかの正解組のその位置」一致で緑/赤
- **もう一度**: ×の input だけクリア、○ 済みは保持
- **正解を表示**: トグル式
- **音声配置の変更**: 例文・練習問題の音声ボタン削除 / 語彙チェック 17 カードに移設

### スナップショット（2026-05-25 v4.0.4 skill 化完了後・コマンドで再導出）

```
image_registry: pending 439 / generated 40 / approved 5 / outdated 6 / (none) 1
                (worktree D 案で rejected 27 件を消化: 22→generated + 5→approved)
image_prompts_skill.json: 30 entries / guideManifestHash 0673ca2d537e
audio_registry:  tts-local-regen 416 / (none) 50 (= 466 total)
                 word: 416/466 (α5 fix-up 後・全 user OK)
                 sentence: 50/466 は 5/24 のまま (β1 では触らず)
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent_yomigana 17007 / accent_override 22 / accent_consensus_override 53
                accent unknown 502
                tts_workaround 0 (寝る usePlainKana 解除)
ojad cache:     416 entries (389 ok / 22 not_found)
homework β1:    p1×5 + p2×5 + p3×5 = 15 exercise に judgement UI + 17 語彙カードに音声
guide manifest: PART 1-6 .md 6 file / hash 0673ca2d537e
```

---

## active

### 次セッション着手点：**Phase γ1 (スライド音声移植)**

β1 + v4.0.4 skill 化完了。γ1 着手可。

### β1 残課題（必要時に対応）

- **lesson_02 以降の β1 検証**: 現状 lesson_01 のみ確認済。lesson_02 や将来課で
  practiceImageSource: "vocabulary" 経路 (blankCount===1 のみ judge UI 出力) と
  異なる template に対する答え抽出ロジックは未検証。lesson_02 で patterns を見て
  必要なら拡張する。
- **練習問題に複数 practiceTemplates がある場合**: 現コードは `practiceTemplates[0]`
  のみ使用 (lesson_01 p2 は 3 templates「質問/肯定/否定」あるが先頭 1 つのみ render)。
  全 templates 対応は γ 以降の拡張候補。

### 並行待機

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
  - 50 sentence audio は 5/24 のまま、β1 では UI から消した状態
  - 採用が決まったら homework_html.js の example-row に audioBtnHtml を戻す
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
  (consensus が `^ぼーるぺん` 平板を提案、manual は `^ぼーる!ぺん` 中高 4 → 要確認)
- **同表記2読み恒久対策**: pickCatalogEntry を lesson_*.json reading 確定に切替
  (α5 延長 fix-up で手動 catalog 修正したが本筋ではない)
- **lesson_02 以降の v4.0.4 building 移行**: 病院 / 銀行 / 駅 / スーパー の v4_0_4_* fields を
  PART 5.10 BUILDING_CUES に追加（Stage 2 同型展開・採用 4 件と同じ universal rule A-1〜A-11 適用）

### 触らない既知制約
- LUFS ERROR 28 件（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題）

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成  ✅ 全完了
Phase β  宿題完成
  β1 ✅ 正解判定 (D)・homework_html.js 改修・user 試聴 OK
Phase γ  スライド完成（1-2 セッション）
  γ1     音声再生（homework .audio-btn 機構を移植）  ← 次の着手候補
  γ2     デザイン微修正（session_001 起動 → 目視 → その場で拾う）
Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)  ← user 教育判断・最重
  δ3     recommender.js + form UI 統合 (H Stage 3)
Phase ε  統合テスト・リリース判断（1 セッション）
  ε1     end-to-end 動作確認
  ε2     docs 整理 + 例文 audio 再検討
```

**総推定**：5-8 セッション。

---

## 確定仕様

### β1 宿題正解判定 (D) — 実装済
- 採点タイミング：即時（設問ごと判定 + visual ○×）
- 不正解時：「もう一度」で何度でも retry（× input のみクリア・○ 済みは保持）
- 正解参照：「正解を表示」ボタンでトグル
- スコア：表示しない
- 正解ソース：examples[] 正規表現抽出 + namedCharacters fallback
- 判定粒度：複数解 any-match で○、per-input 緑/赤、句読点・空白無視
- フィードバック：visual のみ（音声 SFX なし）
- 音声配置：語彙チェックカードのみ（例文・練習問題は保留）

### γ2 スライドデザイン微修正 (F)
- 着手時に session_001 を生成 → ブラウザで目視 → user とその場で修正点を拾う

### δ2 applicability スキーマ（H Stage 2）
```json
{
  "patterns": "any" | ["p1", ...],
  "jlptLevels": ["N5", "N4", "N3", "N2", "N1"] subset,
  "fadingStages": ["controlled", "guided", "free"] subset,
  "duration": { "min": N, "max": N },
  "supportedLessons": [lesson_no],
  "studentLevel": ["beginner", "intermediate", "advanced"] subset
}
```

### accent precedence (Phase α5 延長確定)
`accent_override (manual)` > `accent_consensus_override` > `accent_yomigana (UniDic raw)` > plain text fallback

### v4.0.4 building design (skill 化済 / 採用 4 件)
- 採用版：学校 R25 / 大学 R26 / デパート R22 / 会社 R22
- universal rule A-1〜A-11 ([part1_universal_rules.md PART 1.13](prompts/guide/part1_universal_rules.md))
- 5-image reference attachment (image_1=brand voice / 2-4=type-relevant person / 5=architectural)
- per-vocab-type table (4 件 / [part5 BUILDING_CUES](prompts/guide/part5_vocab_reference_appendix.md))
- 未移行 4 件 (銀行 / 病院 / 駅 / スーパー) は v3.0 legacy path で生成（lesson_02 以降で順次移行）

---

## ブロッカー / 並行

- γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：design insight 転記完了 → main へ ff-merge 済み（2026-05-25）

---

## 直近の確定コマンド

```
# 検証
npm run validate                   # A=v7.5 / B=891b73f5ae2d / B'=0673ca2d537e / C / D / D' 各 PASS

# β1 動作確認（一時 verify 用）
node tmp/verify_homework_beta1.mjs                # verify_homework_beta1.html 生成
python -m http.server 8765 --bind 127.0.0.1       # ローカルサーバー
# → http://127.0.0.1:8765/verify_homework_beta1.html を開く

# Audio 再生成
node scripts/regen-drive-download.mjs --accent-changed     # consensus 持つ entry のみ
node scripts/regen-drive-download.mjs --force              # 全 word_* 強制 regen
npm run generate-audio                                      # 新規 Sheet 追加分のみ

# Accent consensus (UniDic + NHK + OJAD)
python scripts/scrape-ojad.py --audio-only                  # OJAD scrape (~6 min)
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
- [prompts/guide/part1_universal_rules.md](prompts/guide/part1_universal_rules.md) — universal rules (PART 1.1〜1.13)
- [design_brief.md](design_brief.md) — ツール設計書
