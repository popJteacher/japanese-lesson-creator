# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 ⑤ 完了・⑥ active 化）

---

## 現在地

- **Phase 0／1／2：完了。**
- **Phase 3：active。**
  - **①** Cloud TTS SA 鍵・疎通確認：**完了**
  - **②** ローカル TTS クライアント・1 件合成：**完了**
  - **③** バッチ＋月間文字カウンタ＋registry 連携：**完了**
  - **④** ffmpeg QC（two-pass loudnorm/silenceremove/afade）：**完了**
  - **⑤** 音声 QC スペック検証 + invariants[D]：**完了（2026-05-20）**
    - `npm run validate-audio` 提供（LUFS/TP/duration/codec/sample_rate 検証）
    - `invariants[D]` 統合：`npm run validate` で 55/55 PASS（3 WARN）
    - WARN/ERROR 二段判定：±1.5 LUFS 超で WARN、±4 LUFS 超で ERROR
    - WARN 3 件は L01_010/L02_026/L02_031（TP 制約で loudnorm が target に到達しない正常範囲）
- **Phase 4：未着手。** 別 worktree `phase4-prompt-plan` で並行プラン作成中。

生存中の GAS トリガー：`generateAudioBatch`（毎日 10:00）— Phase 3 ⑥ で引退。

### 既知の Phase 3 横断課題（⑥ に持ち越し）
- **registry 未登録 120 件のバックフィル** — Vocabulary シートに存在するが
  `master_audio_registry.json` にエントリが無い語。⑥ までに方針確定。
- **`word_新聞` の sync 漏れ** — sheet は `generated`+Drive URL だが
  registry の audioUrl 空。`npm run sync-registries` で解消するはず（未検証）。

---

## 今やること

**Phase 3 ⑥ — GAS `generateAudioBatch` 引退と Phase 3 確定。**

完了条件：

1. **コード退役**：`gas/pipeline.gs` から音声生成セクション（`generateAudioBatch` /
   `processAudioEntry_` / `callGoogleCloudTTS_` / `getAllAudioRows_` 等の
   ~250 行）を削除し、`archive/gas_old/generateAudio_v2_0.gs` として保全。
2. **GAS ヘッダー版**を v7.4 に bump（v7.3 → v7.4）。`validate.mjs` invariants[A]
   出力に反映。
3. **人間タスク**：GAS トリガー `generateAudioBatch`（毎日 10:00）を
   GAS エディタから削除。完了確認は「`ScriptApp.getProjectTriggers()` の
   ハンドラ一覧に `generateAudioBatch` が無い」こと（人間が GAS で確認）。
4. **NEXT_ACTIONS** から「生存中の GAS トリガー」行を消す（Phase 3 完了の証拠）。
5. **Phase 3 完了宣言**を `docs/MIGRATION_PLAN.md` Phase 3 セクションに 1 行追記。
6. 残課題（registry 未登録 120 件 + word_新聞 sync 漏れ）を
   `docs/PHASE_BACKLOG.md` の Phase 4 セクションに退避。

このスライスで Phase 3 完了。残る生存 GAS は画像生成のみ → Phase 4 で完全引退。

---

## ブロッカー

無し。GAS コードは Phase 1/2 で複数回退役させた前例があり、
`archive/gas_old/` 配下の構造は確立済み。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash / C=件数 / D=音声 QC
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run validate-audio       # data/audio/*.mp3 の QC スペック検証（55/55 PASS, 3 WARN）
node scripts/_tts-smoke.mjs  # Phase 3 ② スモーク
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 ⑥ で引退対象）
generateAudioBatch        # 毎日 10:00 ← ⑥ 完了時に人間が GAS から削除
```
