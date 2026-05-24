# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-24（**Phase α3 完了**：integrity gate で pipeline bug 一掃 +
LLM cross-check 路線を Claude Code 直接レビューに pivot + override 機構実装 +
175 件再生成。次セッションは **user 視聴サンプル → 違和感あれば override 追加**
→ **Phase α4 = Drive 291 件ローカル化**）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 / α2 完了** ✅
- **Phase α3 完了** ✅ 🆕（前半 + 後半とも）

### α3 前半（既存）
- `scripts/extract-accent-catalog.py` 実装、UniDic+naist-jdic ハイブリッド抽出
- 17502/17508 件に accent_yomigana 付与（unidic 15162 / naist-jdic 2340）
- `_meta.schemaVersion: 1.0 → 1.1`
- generate-audio-local.mjs に SSML `<phoneme alphabet="yomigana">` 拡張

### α3 後半（今回）🆕
- **重要発見**：Gemini 2.5 Flash の accent 判定は信頼不能
  - 100 件 mid-range smoke で **44% wrong / 56% flag** された
  - 主因は **中高化バイアス**（大学・絶対・庭先・誇り・書斎 等の平板語を一律「中高」と誤判定）
  - LLM cross-check 路線は放棄。Claude Code 直接判定に pivot
- **整合性ゲート実装**（`extract-accent-catalog.py`）
  - reading ↔ accent_yomigana の bare kana 不整合を自動検出
  - 長音 ー と お段+う / え段+い は等価扱い（音的同一）
  - bug entry を `accent_source='unknown'` に降格
- **再抽出 → クリーン化**：unidic 14755 / naist-jdic 2253 / unknown 500
  - reject 内訳: nonkana 45 + mismatch 449 = 494 件降格
  - integrity 再計測：substantive mismatch 0 / non-kana 0 ✅
  - `_meta.schemaVersion: 1.1 → 1.2`、`accent_reject_counts` 追加
- **accent_override 機構実装**
  - `vocab_catalog.json` の entry に `accent_override` フィールド追加可
  - `generate-audio-local.mjs` 優先順を **override > accent_yomigana > plain text** に拡張
  - `accent_override_meta { source, addedAt, reason, previous_yomigana, previous_source }` も保存
- **116 word entries を Claude Code が直接 NHK 第2版照合**
  - 109 件は妥当（UniDic/naist 出力が NHK 主形 or 副位形）
  - **7 件 override 適用**（lesson_01/02 audio target）：
    | word | reading | override | 根拠 |
    |---|---|---|---|
    | 二階 | にかい | `^にか!い` | NHK 2型 中高 |
    | 寝る | ねる | `^ね!る` | NHK 1型 頭高 |
    | ボールペン | ぼーるぺん | `^ぼーる!ぺん` | NHK 3型 中高 |
    | 何日 | なんにち | `^な!んにち` | NHK 1型 |
    | 何人 | なんにん | `^な!んにん` | NHK 1型 |
    | 何年 | なんねん | `^な!んねん` | NHK 1型 |
    | 何分 | なんふん | `^な!んぷん` | NHK 1型 + 連濁 ふ→ぷ |
- **175 件再生成完了**（new QC + override-aware yomigana SSML）
  - 成功 175/175、accent 適用 126 件、naturalness PASS 164 / WARN 11 / ERROR 0
  - TTS 文字数 1,119 / 当月 6,739 / 上限 800,000
- **deferred 3 件**（worktree 担当・guide 修正必要）：vocab_男の人 / vocab_女の人 / word_秋
- **worktree `phase4-prompt-plan` で guide 修正中**（並行進行）

生存中の GAS 自動 trigger：**0 件**。

### スナップショット（2026-05-24・コマンドで再導出）

```
image_registry: pending 440 / generated 17 / rejected 27 / outdated 6 / (none) 1
image_prompts_skill.json: 30 entries / guideManifestHash 1ca2f57ad927
audio_registry:  null 7 / Drive URL 291 / local 168 + 7 = 175
validate:        ERROR 8 / WARN 26 / 自然さ 168/168 checked (11 WARN)
                 ※ ERROR 8 件はすべて単語短尺 audio の LUFS 限界
                   (loudnorm R128 統合 400ms 窓に対し audio が短すぎる構造問題)
                   再生成では解消しない既知制約。-21〜-24 LUFS 帯
                   対象: わたし/私/二十日/二十歳/八/八つ/八月/八十
vocab_catalog:  17508 entries (schemaVersion 1.2)
                accent_yomigana 17008 (unidic 14755 / naist-jdic 2253)
                accent_override 7 / accent unknown 500 (integrity-rejected を含む)
```

---

## active

### 次セッション開始点：user 視聴サンプル + override 追加（必要に応じ）

**今回 7 件の override 適用 + 116 件の Claude Code 直接レビュー済**だが、
user 視聴で残りの 109 件「妥当」判定が本当に違和感ないか確認する必要あり。

**手順（次セッション・~30 分）**：

1. **lesson_01/02 audio をブラウザで聴く**
   - 候補：lesson_01 起動 → vocabulary タブで全件再生
   - 特に user 既視聴の 10 件 + 今回 override した 7 件 + naturalness WARN 11 件を重点
2. **違和感あれば override 追加**
   - `data/vocab_catalog.json` の対象 entry に `accent_override` 直接編集（または小さい patch script）
   - 形式: `"accent_override": "^...!"` + `"accent_override_meta": {...}`
3. **対象 entry を --force 再生成**
   ```
   node scripts/generate-audio-local.mjs --force --only word_XX,word_YY
   ```
   ※ generate-audio-local.mjs に `--only` がなければ追加実装が必要（未確認）
4. **validate** で invariants[D'] 自然さ確認
5. **完了したら Phase α4 へ進む**

**naturalness WARN 11 件の優先確認候補**（コメント付き 3 件）：
- `sentence_ex_L02_026`: アインシュタイン「シュ」母音脱落 / 平板アクセント
- `sentence_ex_L02_033`: 富士山「です」聞き取れない
- `sentence_ex_L02_035`: その写真「です」聞き取れない
- ※ いずれも例文最後の「です」消失 → TTS Neural2-B の既知挙動の可能性

**LUFS ERROR 8 件は「触らない」**（短尺 audio の構造問題、validate spec の方が tight すぎ）

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成
  α1 ✅ 音声自然さ QC 実装（Gemini 2.5 Flash）
  α2 ✅ QC 簡素化 + naturalness inline + 120 件本走 + 雪 IPA 個別修正
  α3 ✅ accent pipeline + integrity gate + override 機構 + 175 件再生成 🆕
  α4 ★次 Drive 291 件のローカル化 (B) — SA Drive smoke で 5 分判定

Phase β  宿題完成（1 セッション）
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

**総推定**：9-13 セッション。worktree のガイド修正 + PNG 生成パイプは並行進行。

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

### α4 Drive ローカル化 (B)
- 既存 SA：`secrets/sheets-sa.json` (`sheets-reader@gen-lang-client-0575082983.iam.gserviceaccount.com`)
- α4 入り口で 1 件 SA Drive smoke test：成功 → 一括 DL / 失敗 → user に Drive 共有設定依頼

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

- α/β/γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：guide 修正中（並行・干渉なし）

---

## 直近の確定コマンド

```
# 検証
npm run validate                   # A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D / D' PASS

# 音声 (α3 後半完了 — accent_override + yomigana SSML 統合済)
npm run generate-audio                          # 未生成のみ
npm run generate-audio -- --force               # 既存も上書き再合成
npm run generate-audio -- --no-accent           # accent 指定なし plain text
node scripts/check-audio-naturalness.mjs --force --only ID1,ID2  # 特定 entry 自然さ再走

# OpenJTalk accent 抽出（再構築が必要なときだけ）
python scripts/extract-accent-catalog.py        # 全 17508 件再抽出 + integrity gate
python tmp/inspect_accent_integrity.py          # reading ↔ yomigana 整合性レポート

# accent cross-check（Gemini 路線・参考残置・実用しない）
node scripts/check-accent-cross.mjs --dry-run   # 対象 + 概算コスト
node scripts/check-accent-cross.mjs --smoke     # 1 batch (20 件) smoke

# 画像 prompt 展開
ls tmp/skill_prompts/

# 画像取り込み（user PNG 作業完了後）
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
