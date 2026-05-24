# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-24（**Phase α2 完了**：QC を loudnorm のみに簡素化＋
naturalness QC inline 統合＋120 件本走＋**重要発見：日本語アクセント指定は
IPA ではなく Google 独自の yomigana 記法 (^...!) のみ honored**。word_雪 を
yomigana_odaka `^ゆき!` で個別修正済。次セッションは **Phase α3 = アクセント
pipeline 構築（A 方針 = UniDic + LLM cross-check + override、ただし出力は
yomigana 記法）**。117 件＋null 7 件＝合計 124 件を一括再生成）

---

## 現在地

- **Phase 0 〜 5 ⑤ / α1 完了** ✅
- **Phase α2 完了** ✅ 🆕
  - audio-qc.mjs を **loudnorm のみ**に簡素化（silenceremove / afade 廃止）
    - 理由：user 視聴で「raw が自然 / qc が不自然」確定。語頭子音欠けと過剰フェード解消
  - generate-audio-local.mjs に自然さ QC inline 統合（α1 既出）
  - 120 件本走完了：成功 120/120、naturalness PASS 120/120
  - **重要発見**：Gemini QC は日本語アクセント核位置の誤りを検出できない
    （→ [[feedback-gemini-qc-misses-accent-errors]] memory）
  - **最重要発見**：日本語の SSML phoneme は **IPA ではなく `alphabet="yomigana"` のみ**
    が Google 公式仕様。IPA の downstep ꜜ や tone marker (˨˥ꜛ) は無視される。
    正解は `<phoneme alphabet="yomigana" ph="^ゆき!">雪</phoneme>` 記法
    （`^` = ピッチ句開始、`!` = 下降直前モーラの後）。
    OpenJTalk accent_type を `!` 位置に直接変換可能。
    （→ [[project-openjtalk-ipa-google-pipeline]] memory に詳細）
  - word_雪.mp3 を yomigana_odaka `^ゆき!` + 新 QC で個別修正済（user 視聴 OK）。
    他 9 件 (七日・消しゴム・二十日・二日・母・夜・来年・六日・安い) は
    `tmp/google_smoke_ipa/word_*__yomigana.mp3` に smoke 済（次セッションで視聴判定）
- **deferred 3 件**（worktree 担当・guide 修正必要）：vocab_男の人 / vocab_女の人 / word_秋
- **worktree `phase4-prompt-plan` で guide 修正中**（並行進行）

生存中の GAS 自動 trigger：**0 件**。

### スナップショット（2026-05-24・コマンドで再導出）

```
image_registry: pending 440 / generated 17 / rejected 27 / outdated 6 / (none) 1
image_prompts_skill.json: 30 entries / guideManifestHash 1ca2f57ad927
audio_registry:  null 7 / Drive URL 291 / local 168
validate:        ERROR 4 / WARN 9 / 自然さ 168/168 checked (4 WARN)
                 ※ ERROR 4 件は LUFS 極端 (word_八つ/八月/八十/四つ) — α3 再生成で
                 すべて新 QC 経由になるため自然解消見込み
```

---

## active

### Phase α3（次セッション開始点）：アクセント pipeline 構築（A 方針 + yomigana 記法）

**目的**：vocab_catalog.json 全 17508 件にアクセント情報を付与し、generate-audio-local.mjs
を **yomigana SSML 対応**に拡張、既存 audio を一括再生成して **NHK 系教科書アクセント**に揃える。

**設計方針：A = UniDic + LLM cross-check + 教師 override の 3 層ハイブリッド**
**＋ 出力は yomigana 記法 (`^...!`)**（user 確定 2026-05-24）

| 層 | 役割 | ソース | カバー目安 |
|---|---|---|---|
| **第 1 層：自動抽出** | 主辞書からアクセント自動取得 | **UniDic**（NHK 系整合性 ★★★★）| 95% |
| **第 2 層：LLM cross-check** | 「NHK 標準と一致するか」検証 | Gemini 2.5 Flash（~$1.7 / 17508 件）| 残差 5% を flag |
| **第 3 層：教師 override** | 違和感を手動修正 | Sheets `accent_override` 列 | 残り <1% |

**naist-jdic は使わない**（NHK 系整合性が UniDic より一段下のため）。pyopenjtalk-plus
は sudachipy 経由で UniDic を扱える可能性。要 PoC。

**yomigana 記法ルール（OpenJTalk accent_type からの機械変換・実装はこれだけ）：**
- accent_type=0 → `^[全mora]` 平板（!なし）
- accent_type=N (>0) → `^[1..Nモーラ]![N+1..全]`（N 番目モーラの後に !）
- 例：端 `^はし` / 箸 `^は!し` / 橋・雪 `^はし!` `^ゆき!` / 七日 `^なのか!` / 母 `^は!は`

**注：IPA 時代の特例「単独 2 モーラ尾高型は ꜜ 省略」ルールは廃止**
- yomigana `^ゆき!` で正しく尾高型が合成されることを user 視聴で確認済
- IPA は末尾 ꜜ が無視され頭高に聞こえる問題があったが、yomigana 記法ではその問題が起きない

**前提（α2 で確定）**：
- pyopenjtalk-plus は Python 3.14 で pip install 済（cmake 不要）
- 試作スクリプト残置：
  - `tmp/extract_accent.py` — 10 単語の accent 抽出 PoC（naist-jdic 経由・UniDic 切替要）
  - `tmp/yomigana_10_smoke.mjs` — 10 単語の yomigana 記法 smoke（次セッションで視聴）
  - `tmp/yuki_pitch_smoke.mjs` / `tmp/bytes_compare_2mora.mjs` — IPA が部分 no-op の実証
  - `tmp/google_smoke_ipa/accent_data.json` / `accent_data_2mora.json`

**実行手順**：
1. **UniDic 切替 PoC**（最重要・最初の判断点）
   - sudachipy + sudachidict（α2 で既にインストール済）でアクセント情報が取れるか確認
   - 取れない場合は fugashi+unidic 等の代替を試す
   - 失敗時は naist-jdic で進める fallback も残す（user に確認）
2. **抽出 pipeline 本実装**（`scripts/extract-accent-catalog.py`）
   - vocab_catalog.json 全 entry を読み、word でループ
   - UniDic から accent_type / mora_count / reading（hiragana）取得
   - **yomigana 記法に変換**：accent_type を `!` 位置に置く規則で文字列生成
   - vocab_catalog.json に `accent_yomigana` / `accent_type` / `mora_count` / `accent_source` カラム追加
3. **LLM cross-check pipeline**（並走可）
   - 全 17508 件を Gemini 2.5 Flash に投げ「(word, reading, accent_yomigana) が NHK 標準と一致するか」確認
   - 不一致と判定された entry を `_meta.accent_review_queue` に flag
   - コスト目安 ~$1.7
4. **schema 更新**：vocab_catalog.json の `_meta.schemaVersion` を上げる
5. **generate-audio-local.mjs 拡張**：
   - registry.entries[id] に対応する vocab_catalog entry を引き、`accent_yomigana` があれば SSML `<phoneme alphabet="yomigana" ph="...">${word}</phoneme>` で送信
   - なければ plain text fallback（既存挙動）
6. **Sheets `accent_override` 列追加**：
   - 教師が違和感あった単語を手動上書きするレーン（yomigana 記法を直接書く）
   - generate-audio-local.mjs は override > vocab_catalog.accent_yomigana > fallback の優先順
7. **既存 117 件 + null 7 件を一括再生成**：
   - `npm run generate-audio -- --force --status=local-or-null` 等（CLI 拡張要）
   - 新 QC + yomigana pipeline で全件再生
8. **validate** で invariants[D] PASS / 自然さ QC 168/168 確認
9. **user 視聴で違和感ある単語があれば accent_override 登録**（10 件分の yomigana smoke も次セッション冒頭で視聴確認）

**注意事項**：
- AI Studio prepayment credits 確認（feedback_check_ai_studio_credits）
  → 17508 件 LLM cross-check (~$1.7) + 124 件 自然さ QC (~$0.025) = **要確認**
- Gemini naturalness QC はアクセント判定不可（α2 で実証・[[feedback-gemini-qc-misses-accent-errors]]）
  → LLM cross-check は別 prompt で「NHK 整合性」を明示的に問う設計が必須

**コスト目安**：
- Cloud TTS Neural2 $16/Mchar × 124 件 × ~20 char = **~$0.04**
- 自然さ QC $0.0002 × 124 件 = **~$0.025**
- LLM accent cross-check $0.0001 × 17508 件 = **~$1.75**
- pyopenjtalk / UniDic = ローカル・$0
- **合計 ~$1.85**（user prepayment credits 確認要）

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成（残 1-2 セッション）
  α1 ✅ 音声自然さ QC 実装（Gemini 2.5 Flash）
  α2 ✅ QC 簡素化 + naturalness inline + 120 件本走 + 雪 IPA 個別修正
  α3 ★次 OpenJTalk アクセント pipeline 構築 + 124 件 IPA 再生成
  α4   Drive 291 件のローカル化 (B) — SA Drive smoke で 5 分判定

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

**総推定**：10-14 セッション。worktree のガイド修正 + PNG 生成パイプは並行進行。

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
npm run validate                   # A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D PASS

# 音声 (α3 用 — 次セッションで実装拡張予定)
npm run generate-audio                                # 新 QC + 自然さ inline
npm run naturalness-check -- --force --only ID1,ID2  # 特定 entry 再走

# OpenJTalk accent 抽出 + yomigana smoke (α2 PoC)
python tmp/extract_accent.py                          # 10 単語の accent 抽出 → JSON (naist-jdic)
node tmp/yomigana_10_smoke.mjs                        # ★ 10 単語の yomigana 記法 smoke (α3 で視聴判定)

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
