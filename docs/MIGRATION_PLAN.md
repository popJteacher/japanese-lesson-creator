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

# Phase 3：音声のローカル化＋音声 QC
Cloud TTS（Neural2）をローカルから呼ぶ＋月間文字カウンタ。ffmpeg で
loudnorm／トリム／フェード QC を追加（注記：移設でなく獲得。GAS は ffmpeg
不可で QC 不可能だった）。完了＝ generateAudioBatch の GAS 消滅・音声 QC 稼働。

# Phase 4：画像の呼び出し側ローカル化
Imagen 呼び出しをローカルへ。これで GAS は完全消滅。明示保留（移行を止めない
下流決定）：有料 Imagen 継続 か 自前 Stable Diffusion か は GAS 消滅"後"に別決定。

# 横断要件（全 Phase）
- データ＋行単位状態台帳（現シート：語彙438／例文1027＋status 列）を
  repo ローカル JSON に移す（SSOT）。
- 人間ビュー：シートの一覧性を `npm run status` 等で代替。
- 各 Phase に「完了＝この検証が通る」を1行明記。
