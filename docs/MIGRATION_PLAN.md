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

# 横断要件（全 Phase）
- データ＋行単位状態台帳（現シート：語彙438／例文1027＋status 列）を
  repo ローカル JSON に移す（SSOT）。
- 人間ビュー：シートの一覧性を `npm run status` 等で代替。
- 各 Phase に「完了＝この検証が通る」を1行明記。
