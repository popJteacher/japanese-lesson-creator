# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-24（**Phase α1 完了**：音声自然さ QC 実装＋55 件 smoke
本走（$0.0099 / 4 WARN）。次セッションは **Phase α2 null 115 件の新規 TTS** から。
worktree のガイド修正は引き続き並行）

---

## 現在地

- **Phase 0 〜 5 ⑤ 完了** ✅
- **Phase α1 完了** ✅ 🆕 — 音声自然さ QC 実装＋55 件 smoke
  - `scripts/lib/audio-naturalness-qc.mjs`（Gemini 2.5 Flash multimodal）
  - `scripts/check-audio-naturalness.mjs`（CLI runner, rate limit, worker pool）
  - `validate-audio.mjs` に invariants[D'] 自然さ集計を追加（HARD ERROR にしない）
  - `npm run naturalness-check` 追加
  - 55 件本走：0 ERROR / 4 WARN / $0.0099 / 42 秒
  - WARN 内容例：「先生」のアクセント平板化・「じゃ」が「ぢゃ」に聞こえる 等
    （Cloud TTS Neural2 の typical な癖を妥当に検出）
- **再生成 24 件 prompt staging 済**：20 ported + 4 fresh、preflight 全 PASS、
  `tmp/skill_prompts/` に 24 .txt 出力済。**user PNG 手作業待ち**
- **deferred 3 件**（worktree 担当・guide 修正必要）：vocab_男の人 / vocab_女の人 / word_秋
- **worktree `phase4-prompt-plan` で guide 修正中**（並行進行）

生存中の GAS 自動 trigger：**0 件**。

### スナップショット（2026-05-24・コマンドで再導出）

```
image_registry: pending 440 / generated 17 / rejected 27 / outdated 6 / (none) 1
image_prompts_skill.json: 30 entries / guideManifestHash 1ca2f57ad927
audio_registry:  null 115 / Drive URL 296 / local 55 (うち naturalness 済 55 / WARN 4)
```

---

## active

### Phase α2（次セッション開始点）：null 115 件の新規 TTS + pipeline 統合

**目的**：null 115 件の新規 TTS 生成。**併せて生成 pipeline に自然さ QC を統合**
し、「`generate-audio` 1 コマンドで TTS → 技術 QC (applyQc) → 自然さ QC →
registry 書き戻し」を完結させる。

**統合作業（user 確定 2026-05-24）**：
- `scripts/generate-audio-local.mjs` に自然さ QC 呼び出しを追加
  - 既存：`applyQc` (technical) はファイル書き出し直前に inline 済
  - 追加：書き出し後に `checkNaturalness` を呼び `entry.naturalness` を即書き戻し
- `--no-naturalness` フラグで skip 可（`--no-qc` と同流儀・GEMINI_API_KEY 未設定時の fallback）
- WARN/ERROR は生成自体を block しない（α1 設計と一致）
- 統合完了後、`npm run naturalness-check` は **遡及検査専用**として残す
  （新規 audio は pipeline で自動 QC されるが、orphan audio や `--force` 再走に使う）

**実行手順**：
1. **コード統合** — generate-audio-local.mjs に naturalness 呼び出しを inline 化（30 分想定）
2. `npm run generate-audio -- --status=null --dry-run` で 115 件確認
3. `npm run generate-audio -- --status=null` で生成（TTS + 両 QC が 1 パスで走る）
4. `npm run validate` で invariants[D] + invariants[D'] 両方 PASS を確認
5. WARN 件は 1 件ずつ user 視聴 → 手作業で再生成 or 許容判断

**コスト目安**：
- Cloud TTS Neural2 ja-JP $16/M chars × 115 件 × ~20 char = **~$0.04**
- 自然さ QC $0.0002 × 115 件 = **~$0.023**
- **合計 ~$0.07**（NEXT_ACTIONS α 帯予算 $0.5 に十分収まる）

**注意**：
- `feedback_check_ai_studio_credits` — 着手前に AI Studio prepayment credits を確認
- 既存 55 件の WARN 4 件（L01_008 / L01_010 / L02_018 / L02_028）は α2 着手と
  独立に user 視聴判断。pipeline 統合後 `--force --only ID...` で再生成可。

---

## スケジュール（α → β → γ → δ → ε）

```
Phase α  Audio 基盤完成（2-3 セッション）
  α1 ✅  音声自然さチェック (C)   完了：55/55 checked / 4 WARN
  α2 ★次 null 115 件の新規 TTS (A) ← α1 完了で QC 基盤あり
  α3     Drive 296 件のローカル化 (B)  ← SA Drive smoke で 5 分判定

Phase β  宿題完成（1 セッション）
  β1     正解判定 (D)・仕様確定済 ← 下記

Phase γ  スライド完成（1-2 セッション）
  γ1     音声再生（homework .audio-btn 機構を移植）
  γ2     デザイン微修正（session_001 起動 → 目視 → その場で拾う）

Phase δ  アクティビティ完成（3-5 セッション）
  δ1     画像組み込み 6 ブロック (E)
  δ2     applicability メタデータ 57 件 (H Stage 2)  ← user 教育判断・最重
  δ3     recommender.js + form UI 統合 (H Stage 3)

Phase ε  統合テスト・リリース判断（1 セッション）
  ε1     end-to-end 動作確認
  ε2     docs 整理（画像取り込み待ちの 1 行だけ残す）
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

### α3 Drive ローカル化 (B)
- 既存 SA：`secrets/sheets-sa.json` (`sheets-reader@gen-lang-client-0575082983.iam.gserviceaccount.com`)
- α3 入り口で 1 件 SA Drive smoke test：成功 → 一括 DL / 失敗 → user に Drive 共有設定依頼
- 事前準備しない（5 分判定でブロッカー回避）

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
δ2 着手時に schema 再レビュー（追加 field 必要性判定）→ 一括付与。

---

## 引き継ぎで失われていた TODO 群（このスケジュールに統合済）

- ❌→β1 宿題の正解/不正解判定機能
- ❌→γ1 スライドに音声再生機能
- ❌→γ2 スライドのデザイン微修正
- ⚠→δ1 アクティビティ画像組み込み（9 中 3 ブロックのみ実装済 / 残 6 ブロック）
- ❌→δ2+δ3 アクティビティ自動リコメンド機能（Stage 2/3・[design_brief.md](design_brief.md)）

**既に実装済（user 認識補正）**：
- ✅ スライド画像組み込み（`ImageResolver` 経由 7 箇所）
- ✅ 宿題画像組み込み（同 9 箇所）
- ✅ 宿題音声再生機能（`.audio-btn[data-src]` 機構）

---

## ブロッカー / 並行

- α/β/γ/δ/ε：blocker なし
- worktree `phase4-prompt-plan`：guide 修正中（並行・干渉なし）
  - 完了 → main ff-merge → skill 再起動 → 3 件 prompt 生成 → user PNG 全件生成

---

## 直近の確定コマンド

```
# 検証
npm run validate                   # A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D PASS
npm run missing-assets             # image 441 / audio 115（α3 完了後 0 を目指す）

# 音声 (α 用)
npm run generate-audio -- --status=null          # α2: null のみ拾う
npm run naturalness-check                        # α1 で実装。未走 entry のみ拾う
npm run naturalness-check -- --force --only ID1,ID2  # 特定 entry を再走

# 画像 prompt 展開（user PNG 作業用・既出力済）
ls tmp/skill_prompts/              # 24 .txt 確認

# 画像取り込み（user PNG 作業完了後）
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only

# 状態確認クエリ
node -e "const r=require('./data/master_image_registry.json').entries; const c={}; for(const v of Object.values(r)){c[v.status||'(none)']=(c[v.status||'(none)']||0)+1;} console.log(c);"
node -e "const r=require('./data/master_audio_registry.json').entries; let n=0,d=0,l=0; for(const v of Object.values(r)){if(!v.audioUrl)n++; else if(v.audioUrl.includes('drive.google.com'))d++; else l++;} console.log({null:n,drive:d,local:l});"
```

---

## 関連ドキュメント

- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り（5 段階）
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [docs/PHASE_BACKLOG.md](docs/PHASE_BACKLOG.md) — 退避中項目（特に Phase 3 後 backlog の音声自然さチェック仕様）
- [design_brief.md](design_brief.md) — ツール設計書（applicability / Stage 2/3 の出所）
