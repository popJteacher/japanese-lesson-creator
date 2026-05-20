# 確定した最終形
- パイプラインを完全ローカル化（Node/Python）。GAS・Google Sheets・Google Drive
  はランタイムから引退。データ・素材・registry は repo ローカル。外部 API
  （Gemma/Gemini 分類・翻訳、Cloud TTS、Imagen）はローカルから .env の鍵で呼ぶ。
- 規律は不変：小さく区切る／検証する／リポジトリが記憶／一度に一つ。
  変えるのは"狙う先"のみ＝各 Phase は GAS 依存を1つ殺す。
- 不変条件：各 Phase 完了後、人間の手作業 GAS は前 Phase より必ず減る。

# Phase 0（完了済み・現在地の明示）
真実の確定：repo-as-brain／REFERENCE.md 実測確定／validator・invariants。

# Phase 1：分類・翻訳のローカル化
- classify/translate 相当をローカルへ。GEMINI_API_KEY はローカル .env
  （初日から .gitignore 登録。過去に .gitignore バグを踏んだ前例あり）。
- API レート制限（RPM/TPM/RPD）へのスロットリング＋backoff を最初から設計
  （GAS の BATCH_SIZE:3 timeout 対策が API レート対策に置き換わるだけ）。
- 同値検証：ローカル分類出力 == 現 GAS 出力 を diff 確認してから切替。
  exportVocabTypes は"一度きりの基準スナップショット"として使い検証後に永久引退。
- 完了＝ exportVocabTypes 不要・vocab_type をローカルが生成・invariants C 継続 PASS。

# Phase 2：registry を repo ネイティブ化
ローカルが registry を repo に直接書く。Drive download/upload ループ廃止。
完了＝ Drive registry 経由の手作業ゼロ。

# Phase 3：音声のローカル化＋音声 QC（完了 2026-05-20）
Cloud TTS（Neural2）をローカルから呼ぶ＋月間文字カウンタ。ffmpeg で
loudnorm／トリム／フェード QC を追加（注記：移設でなく獲得。GAS は ffmpeg
不可で QC 不可能だった）。完了＝ generateAudioBatch の GAS 消滅・音声 QC 稼働。

**完了結果（2026-05-20 v7.4）**：
- ローカル `scripts/generate-audio-local.mjs` が Cloud TTS Neural2 でバッチ合成、
  `data/audio/*.mp3` を出力、`master_audio_registry.json` を local path に更新
- ffmpeg two-pass loudnorm + silenceremove + afade を `scripts/lib/audio-qc.mjs` で適用
- `invariants[D]`（55/55 PASS、3 WARN）で QC スペックを機械検証
- 月間文字カウンタ（既定上限 800,000 / 100 万文字無料枠の 80%）
- GAS `generateAudioBatch` セクション全削除 → `archive/gas_old/generateAudio_v2_0_phase3_retired.gs` に保全
- 横断課題は `docs/PHASE_BACKLOG.md` の Phase 4 セクションに退避（registry 未登録 120 件 + word_新聞 sync 漏れ）
- 残作業：人間タスクとして GAS Triggers `generateAudioBatch`（毎日 10:00）削除

## Phase 3 スライス（2026-05-20 確定）

順序付き ①〜⑥。各スライス完了時にコミット境界を切る。
active なスライスは `NEXT_ACTIONS.md` に 1 件だけ載せる。

- **①** Cloud TTS SA 鍵・`.env` 設計・`scripts/check-tts-sa.mjs` で疎通確認。
  完了＝ `npm run check-tts-sa` PASS。
- **②** `scripts/lib/tts-client.mjs` で Cloud TTS Neural2 を 1 件合成。
  まだ QC なし／バッチなし／カウンタなし。完了＝ 1 件 mp3 がローカルに出る。
- **③** `scripts/generate-audio-local.mjs` ＝ バッチ＋月間文字カウンタ＋上限ガード
  ＋ registry 連携（`status=null` のみ拾う）。完了＝ L02 例文の合成が一周し、
  `missing-assets` の `null_audioUrl` が減る。QC は未組込みでよい。
- **④** ffmpeg QC（loudnorm / トリム / フェード）パイプライン組込み。
  ③ の出力を QC 通したものに置換する。完了＝ 全 mp3 が QC 通過版。
- **⑤** 音声 QC スペック検証スクリプト（`npm run validate-audio` 系）。
  LUFS／duration／clipping を invariants に追加し、既存 GAS 生成音声との
  並列 A/B 確認も行う（bit 一致ではなくスペック合格を見る）。
  完了＝ invariants D（仮）= 音声 QC PASS が validate 出力に出る。
- **⑥** GAS `generateAudioBatch` 退役。コードを `archive/gas_old/` へ保全し、
  `gas/pipeline.gs` から該当セクション削除。人間が GAS トリガー
  `generateAudioBatch`（毎日 10:00）を削除し、削除確認を docs 反映。
  完了＝ 生存中の GAS トリガー 0 件・`NEXT_ACTIONS.md` の人間タスク欄が空。

# Phase 4：画像の呼び出し側ローカル化
Imagen 呼び出しをローカルへ。これで GAS は完全消滅。明示保留（移行を止めない
下流決定）：有料 Imagen 継続 か 自前 Stable Diffusion か は GAS 消滅"後"に別決定。

**着手結果（2026-05-20 着手 / 進行中）**：
- 別 worktree `phase4-prompt-plan`（`.claude/worktrees/image-prompt-plan`）で master prompt
  guide 修正プランを並行作成中。③ 以降は **プラン取り込み後に組み直す**（独立に走らせない）。
- 残作業：人間タスクとして GAS Triggers `generateImageBatch` × 3 件（9 / 13 / 17 時）削除 → ⑥ で実行。

## Phase 4 スライス（2026-05-20 確定）

順序付き ①〜⑥。Phase 3 と同じく各スライス完了時にコミット境界を切る。
active なスライスは `NEXT_ACTIONS.md` に 1 件だけ載せる。
③④⑤ は `phase4-prompt-plan` の master prompt guide 修正プラン取り込み後に
詳細を確定する（プラン依存）。① と ② は **プラン非依存・先行実装可**。

- **①** Imagen API バックエンド = **Google AI Studio**（Phase 1 の `GEMINI_API_KEY`
  を流用、SA 不要）。`.env` 設計・`scripts/check-imagen-key.mjs` で疎通確認。
  Imagen 4 に無料枠はなし（Fast $0.02 / Standard $0.04 / Ultra $0.06 per image）—
  事前に AI Studio コンソールで billing を有効化する人間タスクが前提。
  完了＝ `npm run check-imagen-key` PASS（ListModels が `imagen-4.0-generate-001`
  系を返し、`x-goog-user-project` 等の権限エラーが出ない）。プラン非依存。
- **②** `scripts/lib/imagen-client.mjs` で `imagen-4.0-generate-001` を 1 件生成。
  `scripts/_imagen-smoke.mjs` から固定プロンプトで叩く。まだ QC なし／バッチ
  なし／registry 連携なし。完了＝ 1 件 PNG が `data/images/_smoke/` に出る。
  プラン非依存。
- **③ ＜プラン強依存＞** `scripts/generate-images-local.mjs` ＝ プロンプトビルド
  ＋バッチ＋日次 RPD カウンタ＋上限ガード＋ registry 連携（`status=pending` /
  `null` のみ拾う・`master_image_registry.json` を local path で更新）。
  プロンプトビルドは取り込んだ master prompt guide 版を使う（GAS の v2.9.1
  相当 STYLE_RECIPE をローカルに移設）。完了＝ pending エントリの生成が一周し、
  `npm run missing-assets` の `no_images_array` 件数が減る。QC は未組込みでよい。
- **④ ＜プラン弱依存＞** 画像 QC パイプライン（`scripts/lib/image-qc.mjs`）。
  プラン側で確定したスタイル不変条件（サイズ／フォーマット／透過／余白／
  カラーチェック等）を機械検証として組み込み、③ の出力を QC 通過版に置換。
  「移設でなく獲得」枠（Phase 3 の ffmpeg と同様、GAS には不可能だった検証）。
  完了＝ 全 PNG が QC 通過版・QC ログが出力される。
- **⑤ ＜プラン弱依存＞** 画像 QC スペック検証スクリプト（`npm run validate-images`
  系）＋ `invariants[E]` を `npm run validate` 出力に追加。LUFS 相当として
  画像のサイズ／パレット適合／余白比率を検査。完了＝ `invariants[E]` 行が
  `npm run validate` 出力に出て PASS する。
- **⑥** GAS `generateImageBatch` 退役。コードを
  `archive/gas_old/generateImages_v5_3_phase4_retired.gs` に保全し、
  `gas/pipeline.gs` から該当セクション（generateImageBatch / testSingleImage /
  previewPrompts / retryImages / setupImageTriggersX3 / setupImageDailyTrigger
  および付随ヘルパ）を削除。人間が GAS トリガー `generateImageBatch` × 3 件を
  削除し、削除確認を docs 反映。完了＝ 生存中の GAS トリガー 0 件・GAS 完全消滅・
  `NEXT_ACTIONS.md` の人間タスク欄が空。

# 横断要件（全 Phase）
- データ＋行単位状態台帳（現シート：語彙438／例文1027＋status 列）を
  repo ローカル JSON に移す（SSOT）。
- 人間ビュー：シートの一覧性を `npm run status` 等で代替。
- 各 Phase に「完了＝この検証が通る」を1行明記。
