# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-24（**Phase α4 完了** 🆕：Drive 291 件を SA 経由で
ローカル化、WAV→ffmpeg loudnorm→MP3 変換、registry 書き換え。Phase α 全完了。
次セッションは **user 視聴サンプル（α3+α4）** → **Phase β1 = 宿題正解判定**）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 / α2 / α3 / α4 完了** ✅
- **Phase α 全完了** ✅ 🆕

### α4（今回）🆕
- **Drive SA smoke PASS**：既存 `secrets/sheets-sa.json` で 1 件 DL 成功
  - SA email: `sheets-reader@gen-lang-client-0575082983.iam.gserviceaccount.com`
  - owner=user 自身、共有設定済で 291 件アクセス可
  - **重要発見**：Drive 由来 audio は **WAV 形式**（既存 local 168 は MP3）
- `scripts/check-drive-sa.mjs` 新規（1 件 metadata + DL 試行・診断付き）
- `scripts/download-drive-audio.mjs` 新規（一括 DL pipeline）
  - flow: Drive WAV → `applyQc` (ffmpeg loudnorm) → MP3 96kbps 48kHz → `data/audio/{id}.mp3`
  - registry 更新: `audioUrl=ローカル`, `originalAudioUrl=元 Drive URL`, `audioSource='drive-download'`, `audioLocalizedAt`
  - 自然さ QC inline（Gemini、text lookup 失敗時は skip）
- **本走完了**：291/291 OK・132 秒・errors 0
  - raw DL: 10.35 MiB → QC out: 2.80 MiB (3.7x 圧縮)
  - naturalness 22/291 checked（lesson_NN.json に text ある entries のみ）
  - 残 269 件は vocab_catalog 専用 → 自然さ QC は **lookupText 拡張で将来カバー可能**
- **registry-as-canon 維持**：Drive 依存ゼロ、Drive 自動 trigger（GAS）も 0 件

### α3（前セッション・参考）
- integrity gate + accent_override 機構 + 175 件再生成
- 7 件 override 適用、Claude Code 直接 NHK 第2版照合
- LLM cross-check (Gemini Flash) は中高バイアスで実用不能と判明、scripts は参考残置

生存中の GAS 自動 trigger：**0 件**。
α4 完了で Phase 3 ⑥ 「GAS retired」相当が 100% 達成。

### スナップショット（2026-05-24・コマンドで再導出）

```
image_registry: pending 440 / generated 17 / rejected 27 / outdated 6 / (none) 1
image_prompts_skill.json: 30 entries / guideManifestHash 1ca2f57ad927
audio_registry:  null 7 / local 459 / drive 0 (= 466 total)
                 audioSource=drive-download 291 / tts-local 168
validate:        ERROR 28 / WARN 73 / 自然さ 190/459 checked (11 WARN)
                 ※ ERROR 28 件は全て単語短尺 audio の LUFS 限界
                   (loudnorm R128 統合 400ms 窓に対し audio が短すぎる構造問題)
                   再生成では解消しない既知制約。-19〜-24 LUFS 帯
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent_yomigana 17008 (unidic 14755 / naist-jdic 2253)
                accent_override 7 / accent unknown 500
```

---

## active

### 次セッション開始点：user 視聴サンプル → Phase β1

**user 視聴対象**（前 α3 後半 + 今 α4 合算）：
- 459 件のローカル audio が data/audio/ に揃った
- 内訳：tts-local 168 (new QC + override-aware yomigana SSML) + drive-download 291 (元 GAS 生成・WAV→MP3 化)
- 質感が混在する可能性：TTS Neural2 vs 元 Drive 生成（旧 voice/QC かも）

**手順（次セッション・user 視聴 + 必要なら override 追加）**：
1. `npm run start` でブラウザから lesson_01/02 を起動 → vocabulary タブで全件再生
2. 重点確認:
   - **質感の混在**：TTS 168 件 vs Drive 由来 291 件で voice 違いが出るか
   - **アクセント違和感**：7 override + 残 109 件 Claude 判定「妥当」
   - 既知 naturalness WARN 11 件（commented 3 件、特に sentence_ex_L02_026/033/035 の「です」消失）
3. 違和感あれば `vocab_catalog.json` に `accent_override` 追加 → `--force --only` で再生成
4. 完了次第 **Phase β1 = 宿題正解判定** に進む

**naturalness QC 拡張候補（後回し可）**：
- `lookupText()` を vocab_catalog → word 引きで拡張すれば Drive 由来 269 件もカバー
- 効果：459 全件 naturalness 取得、隠れた品質問題を発見できる
- コスト：269 × $0.0002 ≈ $0.05、~3 分
- 必要性：user 視聴で問題が見つかったら走らせる。事前は不要

**触らない既知制約**：
- LUFS ERROR 28 件（loudnorm R128 統合 400ms 窓の短尺 audio 構造問題、validate spec の方が tight すぎる）

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成  ✅ 全完了
  α1 ✅ 音声自然さ QC 実装（Gemini 2.5 Flash）
  α2 ✅ QC 簡素化 + naturalness inline + 120 件本走
  α3 ✅ accent pipeline + integrity gate + override 機構 + 175 件再生成
  α4 ✅ Drive 291 件のローカル化 (B) — WAV→MP3 + naturalness inline 🆕

Phase β  宿題完成（1 セッション）★次
  β1     正解判定 (D)・仕様確定済

Phase γ  スライド完成（1-2 セッション）
  γ1     音声再生（homework .audio-btn 機構を移植）
  γ2     デザイン微修正（session_001 起動 → 目視 → その場で拾う）

Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)  ← user 教育判断・最重
  δ3     recommender.js + form UI 統合 (H Stage 3)

Phase ε  統合テスト・リリース判断（1 セッション）
  ε1     end-to-end 動作確認
  ε2     docs 整理
```

**総推定**：8-12 セッション。worktree のガイド修正 + PNG 生成パイプは並行進行。

---

## 確定仕様

### β1 宿題正解判定 (D)
- **採点タイミング**：即時（設問ごとに判定 + ピンポンマーク + 音声フィードバック）
- **不正解時**：「もう一度」ボタンで何度でも retry
- **正解参照**：どのタイミングでも「正解を表示」ボタンで開ける
- **スコア**：表示しない（提出のみ・テストっぽさを避ける）

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

# 音声生成 (α3 後半完了・accent_override + yomigana SSML 統合済)
npm run generate-audio                          # 未生成のみ
npm run generate-audio -- --force               # 既存も上書き再合成
npm run generate-audio -- --no-accent           # accent 指定なし plain text

# 音声ローカル化 (α4 完了・再走は基本不要)
node scripts/check-drive-sa.mjs                 # 1 件 smoke (再確認用)
node scripts/download-drive-audio.mjs --force --only ID  # 特定 entry 再 DL

# 自然さ QC（個別）
node scripts/check-audio-naturalness.mjs --force --only ID1,ID2

# OpenJTalk accent 抽出（再構築が必要なときだけ）
python scripts/extract-accent-catalog.py        # 全 17508 件再抽出 + integrity gate
python tmp/inspect_accent_integrity.py          # reading ↔ yomigana 整合性レポート

# accent cross-check（Gemini 路線・参考残置・実用しない）
node scripts/check-accent-cross.mjs --dry-run

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
