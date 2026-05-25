# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-25 v4.0.4 design insight skill 化完了（**worktree
phase4-prompt-plan で v4.0.4 building design insight を PART 1-6 .md に手動転記完了** 🆕：
PART 1.12 BUILDING_REFERENCE_ATTACHMENT_RULE + PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4
(A-1〜A-11 + 13 学び) + PART 3.2 building v4.0.4 design + PART 4 Template B
5-image reference (17 placeholders) + PART 5.10 BUILDING_CUES 4 件 v4_0_4_* fields
+ PART 2 BACKGROUND_BY_TYPE.building → legacy 専用化 + PART 6 + preflight.py
v4.0.4 採用 building も BG_EXACT_CREAM + NOT_TOKEN 必須化 + invariants.mjs B' hash
更新 (0673ca2d537e) + skill mode/legacy mode の分岐検査。main へ ff-merge 完了。
**次は Phase β1 (宿題正解判定) 着手**）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 / α2 / α3 / α4 / α5 / α5 後半 / α5 延長 完了** ✅

### α5 延長 fix-up (2026-05-25 後半) 🆕

user 試聴で 5 件 NG 判定 → catalog 修正 + regen → 全 OK 確定：

| word | 修正前 | 修正後 (yomigana SSML) | 備考 |
|---|---|---|---|
| する | consensus `^す!る` 頭高 | override `^する` 平板 | accent 核なしだが user OK |
| はい | consensus `^はい` 平板 | override `^は!い` 頭高 | NHK 1 標準 |
| 何分 | pickCatalogEntry が なにぶん entry を誤選択 | なんふん override `^な!んぷん` | catalog 同表記2読み問題 |
| 寝る | tts_workaround.usePlainKana (Google default) | override `^ねる!` 尾高 | **5/25 朝に確定したが延長 regen で plain に戻された再発バグ** |
| 分 | pickCatalogEntry が ぶん entry を誤選択 | ふん override `^ふ!ん` | catalog 同表記2読み問題 |

#### 同表記2読み問題の構造的根本原因
`pickCatalogEntry` は `word` 完全一致 → accent 付き entry → accent_source !== 'unknown' を優先で選択。
N5 教材ターゲットの reading (なんふん / ふん) を強制選択するため、不要 entry (なにぶん idx=4856 / ぶん idx=15406) の accent を全 clear して候補から除外する手当を実施。
**恒久対策（β 以降）**: pickCatalogEntry を lesson_*.json 参照経由の reading 確定に切り替えると安全。

### Phase α5 延長 本体（前回まで）

- `scripts/scrape-ojad.py` — OJAD scraper (0.6s sleep)
- `scripts/lib/{yomigana_normalize,nhk_lookup,ojad_lookup}.py` — 共通 lib
- `scripts/build-accent-consensus.py` — 3 ソース合議エンジン
- OJAD scrape: 416 word 中 389 ok / 22 not_found
- Consensus apply: 57 entries に accent_consensus_override 付与
- audio 一括 regen: 416 件 (--force, Neural2 + yomigana SSML, naturalness inline)
- fix-up: 5 件再修正 (上記)

#### precedence (audio 生成時・確定)
`accent_override (manual)` > `accent_consensus_override` > `accent_yomigana (UniDic raw)` > plain
- generate-audio-local.mjs / regen-drive-download.mjs 両方で honor

---

### 次セッション着手点：**Phase β1 (宿題正解判定)**

audio 確定済。β1 に着手可。

### スナップショット（2026-05-25 fix-up + D 案取り込み後・コマンドで再導出）

```
image_registry: pending 439 / generated 40 / approved 5 / outdated 6 / (none) 1
                (worktree D 案で rejected 27 件を消化: 22→generated + 5→approved)
image_prompts_skill.json: 30 entries / guideManifestHash 0673ca2d537e
audio_registry:  tts-local-regen 416 / (none) 50 (= 466 total)
                 word: 416/466 (5 件 fix-up 後・全 user OK)
                 sentence: 50/466 は 5/24 のまま (今回触らず)
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent_yomigana 17007 / accent_override 22 / accent_consensus_override 53
                accent unknown 502 (うち 何分(なにぶん)・分(ぶん) 2 件を新たに unknown 化)
                tts_workaround 0 (寝る usePlainKana 解除)
ojad cache:     416 entries (389 ok / 22 not_found)
data/images:    +6 PNG (vocab_大学.png / vocab_病院.jpg / word_{デパート,会社,大学,学校}.png)
                worktree phase4-prompt-plan v4.0.4 building Stage 1 採用版
```

---

## active

### β1 仕様（consensus 完了後）
- **採点タイミング**：即時（設問ごとに判定 + ピンポンマーク + 音声フィードバック）
- **不正解時**：「もう一度」ボタンで何度でも retry
- **正解参照**：どのタイミングでも「正解を表示」ボタンで開ける
- **スコア**：表示しない（提出のみ・テストっぽさを避ける）

### 並行待機（β1 後に着手）

- **例文 audio の再検討**：AivisSpeech 試用 or 商用 (Azure/ElevenLabs) 検証
  - 50 sentence audio は 5/24 のまま（per-word phoneme は 富士山 で破綻・
    per-mora prosody はチョッピー化・pyopenjtalk は HTS 90 年代品質）
- **ボールペン override** の NHK 新辞典 2016 PDF 検証
  (今日 consensus が `^ぼーるぺん` 平板を提案、manual は `^ぼーる!ぺん` 中高 4 → 要確認)
- **同表記2読み恒久対策**: pickCatalogEntry を lesson_*.json reading 確定に切替
  (今回 fix-up は手動で不要 entry の accent を clear したが、本筋ではない)
- **同表記2読み恒久対策の β 以降タスク化**: pickCatalogEntry を lesson_*.json reading 確定に
  切替（α5 延長 fix-up で手動 catalog 修正したが本筋ではない）
- **lesson_02 以降の v4.0.4 building 移行**: 病院 / 銀行 / 駅 / スーパー の v4_0_4_* fields を
  PART 5.10 BUILDING_CUES に追加（Stage 2 同型展開・採用 4 件と同じ universal rule A-1〜A-11 適用）

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
        後半 ✅ 12 件 NHK/OJAD override fix + tts_workaround 機構
        延長 ✅ OJAD scraper + Consensus engine + 57 件 consensus override 🆕

Phase β  宿題完成（1 セッション）
  β1     正解判定 (D)・仕様確定済（user 試聴 OK 出たら着手）

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

**総推定**：6-9 セッション。worktree のガイド修正 + PNG 生成パイプは並行進行。

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

### accent precedence (Phase α5 延長確定)
`accent_override (manual)` > `accent_consensus_override` > `accent_yomigana (UniDic raw)` > plain text fallback

---

## ブロッカー / 並行

- β/γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：design insight 転記完了 → main へ ff-merge 済み（2026-05-25）

---

## 直近の確定コマンド

```
# 検証
npm run validate                   # A=v7.5 / B=891b73f5ae2d / B'=0673ca2d537e / C / D / D' 各 PASS

# Audio 再生成
node scripts/regen-drive-download.mjs --accent-changed     # consensus 持つ entry のみ
node scripts/regen-drive-download.mjs --force              # 全 word_* 強制 regen
node scripts/regen-drive-download.mjs --source drive-download  # 旧 GAS 由来のみ
node scripts/regen-drive-download.mjs --not-source tts-local-regen  # 今日 regen していない全件
npm run generate-audio                                      # 新規 Sheet 追加分のみ

# Accent consensus (UniDic + NHK + OJAD)
python scripts/scrape-ojad.py --audio-only                  # OJAD scrape (~6 min)
python scripts/scrape-ojad.py --only WORD,WORD              # 特定 word 追加 scrape
python scripts/build-accent-consensus.py --dry-run --audio-only  # report のみ
python scripts/build-accent-consensus.py --apply --audio-only    # catalog 更新

# NHK 突合 (mismatch 検出)
python scripts/check-accent-nhk.py --audio-only             # 既 audio entry のみ
python scripts/check-accent-nhk.py --only WORD,WORD         # 特定 word のみ

# 自然さ QC（個別）
node scripts/check-audio-naturalness.mjs --force --only ID1,ID2

# OpenJTalk accent 抽出（再構築が必要なときだけ）
python scripts/extract-accent-catalog.py        # 全 17508 件再抽出 + integrity gate

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
- [docs/design_ojad_nhk_consensus.md](docs/design_ojad_nhk_consensus.md) — α5 延長 consensus 設計 (実装済)
- [design_brief.md](design_brief.md) — ツール設計書
