# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-25 後半（**Phase α5 後半まで完了** 🆕：word audio 416 件
regen + user 視聴 → 12 件 NHK/OJAD override fix + 寝る tts_workaround 機構導入。
**次セッションは OJAD + NHK CSV 統合 (consensus engine)** →
詳細設計は [docs/design_ojad_nhk_consensus.md](docs/design_ojad_nhk_consensus.md)）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 / α2 / α3 / α4 / α5 完了** ✅

### α5（今回）🆕

#### 起点：α4 後の user 視聴で 40+ 件の accent 違和感報告

#### 診断
- 違和感 audio の **多くは drive-download 版**（旧 GAS pipeline 由来、yomigana SSML 未使用）
- 「読み違い」(一/ひと, 十/とお, 二/ふた 等) は Sheet の reading が和語形のため
- **TTS rendering bug 検証**：Neural2-B は SSML `<phoneme alphabet="yomigana">` を
  mid-sentence では実質無視（byte-level 確証、`tmp/tts_test/` で MD5 比較）
- 但し word 単独合成では yomigana を honor している（生成時に accent core を反映）

#### 修正
- `scripts/regen-drive-download.mjs` 新規（`--source` / `--not-source` flag 対応）
- `pickCatalogEntry` ロジックで accent を持つ catalog entry を優先選択
  → 一/ひと → いち, 十/とお → じゅう, 二/ふた → に, 赤/せき → あか 等を自動修正
- **本走 2 回完了**：
  1. drive-download 291 件 → tts-local-regen（10 分・errors 0）
  2. tts-local 未処理 125 件 → tts-local-regen（5 分・errors 0）
  - **合計 416/466 word audio が NHK 標準で統一**

#### 検証機構（α5 で導入）
- `scripts/check-accent-nhk.py`：javdejong/nhk-pronunciation CSV (100k entries) と
  vocab_catalog の自動突合 → mismatch report 出力
- `data/nhk_counter_accent.json`：NHK 新辞典 2016 付録 PDF から 4 助数詞 (日/人/年/分)
  の 1-20 + 例(何) entry を vision 抽出。既存 override 4 件と完全一致確認
- 結論：3 ソース (UniDic / NHK CSV / OJAD) 一致率高い。「違和感」≠「データ誤り」
  のケースがほとんど（個人 accent 直感差）

#### α5 後半（同日 user 視聴 → 12 件追加修正）🆕
- 視聴で 12 件 accent 違和感報告（もう/一番/火曜/金曜/土曜/日曜/卵/十六/女の人/男の人/寝る/二階）
- NHK CSV + OJAD で全 12 件 cross-check → 全 12 件 `accent_override` 追加 + 該当 regen
  - 寝る/二階: 旧 override 削除（NHK 平板採用）
  - 4 曜日: 平板 → 中高 3 (NHK + OJAD 一致)
  - 一番/卵: 平板 → 中高 (NHK + OJAD 一致)
- **寝る → にゃる TTS bug 発覚**: Google TTS が kanji 寝る を誤読
  - 12 variant A/B test → kanji surface + accent核なし phoneme tag が原因と確定
  - 対策: **tts_workaround 機構新設**（`vocab_catalog.json` の entry 単位フラグ）
    - `usePlainKana: true` → SSML スキップ、plain kana text で合成
  - generate-audio-local.mjs + regen-drive-download.mjs 両方 honor 済
  - 寝る: catalog に `tts_workaround.usePlainKana=true` 永続化 → 今後の regen で自動適用

#### 例文 audio (50 件) 保留中
- per-word phoneme 注入は **富士山 → ふじやま** で破綻、per-mora prosody はチョッピー化、
  pyopenjtalk 直接合成は HTS 1990 年代品質
- 候補: AivisSpeech / Azure Speech（β/γ/δ 完了後に再着手）

#### override 1 件 spot check 未済
- ボールペン (`^ぼーる!ぺん`) の NHK 新辞典 2016 検証は次セッション以降

### スナップショット（2026-05-25・コマンドで再導出）

```
image_registry: pending 440 / generated 17 / rejected 27 / outdated 6 / (none) 1
image_prompts_skill.json: 30 entries / guideManifestHash 1ca2f57ad927
audio_registry:  tts-local-regen 416 / (none) 50 (= 466 total)
                 word: 416/466 が今日 (5/25) regen 済 (Neural2 + yomigana SSML)
                 sentence: 50/466 は 5/24 のまま (今日触らず)
validate:        ERROR 28 / WARN 73 / 自然さ 190/459 checked (11 WARN)
                 ※ ERROR 28 件は LUFS R128 構造制約・再生成では解消しない既知問題
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent_yomigana 17008 / accent_override 17 (今日 +10, 寝る/二階 で
                既存 override 取り下げ + 12 件 NHK/OJAD 値で追加)
                accent unknown 500
                tts_workaround 1 (寝る: usePlainKana 🆕)
nhk cross-check (5/25 audio-only run, before α5 後半):
                match 267 / mismatch 91 / not_in_nhk 60 / multi_reading 18
                no_accent_in_catalog 41 / match_rate 74.6%
                ※ 12 件は手動 override で解消、残り 79 件は次セッション consensus engine で
```

---

## active

### 次セッション開始点：OJAD + NHK CSV consensus 統合（α5 後半延長）

**目的**：catalog の accent_yomigana を 3 ソース consensus (UniDic + NHK CSV + OJAD)
で底上げ。将来追加 entry も自動 NHK 標準化。

**詳細設計**：[docs/design_ojad_nhk_consensus.md](docs/design_ojad_nhk_consensus.md)

**実装段取り**：
1. OJAD scraper (`scripts/scrape-ojad.py`) - 459 audio-only words から開始
2. NHK lookup の module 化 (`scripts/lib/nhk-lookup.py`)
3. consensus engine (`scripts/build-accent-consensus.py`) + 正規化 (う↔ー, 連濁)
4. catalog 一括 update + 該当 entry regen
5. user audition → 残り mismatch 手動判定

**完了後 → Phase β1 (宿題正解判定)** に進む

### β1 仕様（consensus 統合完了後）
- **採点タイミング**：即時（設問ごとに判定 + ピンポンマーク + 音声フィードバック）
- **不正解時**：「もう一度」ボタンで何度でも retry
- **正解参照**：どのタイミングでも「正解を表示」ボタンで開ける
- **スコア**：表示しない（提出のみ・テストっぽさを避ける）

### 並行待機（β1 後に着手）

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
- **ボールペン override** の NHK 新辞典 2016 PDF 検証（寝る/二階 は 5/25 後半に
  override 削除済）

### 触らない既知制約
- LUFS ERROR 28 件（短尺 audio × loudnorm R128 統合 400ms 窓の構造問題）

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成  ✅ 全完了
  α1 ✅ 音声自然さ QC 実装（Gemini 2.5 Flash）
  α2 ✅ QC 簡素化 + naturalness inline + 120 件本走
  α3 ✅ accent pipeline + integrity gate + override 機構 + 175 件再生成
  α4 ✅ Drive 291 件のローカル化 (B) — WAV→MP3 + naturalness inline
  α5 ✅ word audio 416 件 NHK 標準統一 + NHK CSV 突合機構
        後半（同日）✅ 12 件 NHK/OJAD override fix + tts_workaround 機構 🆕
        延長（次セッション）⏳ OJAD + NHK consensus engine 統合

Phase β  宿題完成（1 セッション）
  β1     正解判定 (D)・仕様確定済（consensus 統合後に着手）

Phase γ  スライド完成（1-2 セッション）
  γ1     音声再生（homework .audio-btn 機構を移植）
  γ2     デザイン微修正（session_001 起動 → 目視 → その場で拾う）

Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)  ← user 教育判断・最重
  δ3     recommender.js + form UI 統合 (H Stage 3)

Phase ε  統合テスト・リリース判断（1 セッション）
  ε1     end-to-end 動作確認
  ε2     docs 整理 + 例文 audio 再検討
```

**総推定**：7-10 セッション。worktree のガイド修正 + PNG 生成パイプは並行進行。

---

## 確定仕様

### β1 宿題正解判定 (D)
- 採点タイミング：即時（設問ごと判定 + ピンポンマーク + 音声フィードバック）
- 不正解時：「もう一度」で何度でも retry
- 正解参照：「正解を表示」ボタンでいつでも開ける
- スコア：表示しない

### γ2 スライドデザイン微修正 (F)
- 着手時に session_001 を生成 → ブラウザで目視 → user とその場で修正点を拾う
- 仕入れ方式：walkthrough（事前リスト化しない）

### δ2 applicability スキーマ（H Stage 2）
既存 `act_online_roulette.applicability` をベースに 57 件付与：
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

---

## ブロッカー / 並行

- β/γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：guide 修正中（並行・干渉なし）

---

## 直近の確定コマンド

```
# 検証
npm run validate                   # A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D / D' 各 PASS

# Audio 再生成 (α5 後・通常は不要)
node scripts/regen-drive-download.mjs --source drive-download           # drive-download のみ
node scripts/regen-drive-download.mjs --not-source tts-local-regen      # 今日 regen していない全件
npm run generate-audio                                                   # 新規 Sheet 追加分のみ
npm run generate-audio -- --force                                        # 全件上書き

# NHK 突合 (mismatch 検出)
python scripts/check-accent-nhk.py --audio-only                          # 既 audio entry のみ
python scripts/check-accent-nhk.py --only WORD,WORD                      # 特定 word のみ

# 自然さ QC（個別）
node scripts/check-audio-naturalness.mjs --force --only ID1,ID2

# OpenJTalk accent 抽出（再構築が必要なときだけ）
python scripts/extract-accent-catalog.py        # 全 17508 件再抽出 + integrity gate
python tmp/inspect_accent_integrity.py          # reading ↔ yomigana 整合性レポート

# 画像
ls tmp/skill_prompts/
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only
```

---

## 関連ドキュメント

- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り（5 段階）
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目
- [design_brief.md](design_brief.md) — ツール設計書
