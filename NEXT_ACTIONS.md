# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 ④ 完了・⑤ active 化）

---

## 現在地

- **Phase 0／1／2：完了。**
- **Phase 3：active。**
  - **①** Cloud TTS SA 鍵・疎通確認：**完了**
  - **②** ローカル TTS クライアント・1 件合成：**完了**
  - **③** バッチ＋月間文字カウンタ＋registry 連携：**完了**
  - **④** ffmpeg QC（loudnorm/silenceremove/afade）：**完了（2026-05-20）**
    - `scripts/lib/audio-qc.mjs` に `applyQc` 実装、`npm run check-ffmpeg` 提供
    - 全 55 件を QC 適用版に置換（ffprobe: 48kHz mono / 99kbps / mp3 ✓）
    - silence trim 効果で 1.2 MB → 1.1 MB、loudnorm で -16 LUFS 正規化
- **Phase 4：未着手。** 別 worktree `phase4-prompt-plan` でマスタープロンプト
  ガイド修正プランを並行作成中（main 本筋には影響なし）。

生存中の GAS トリガー：`generateAudioBatch`（毎日 10:00）— Phase 3 ⑥ で引退。

### 既知の Phase 3 横断課題
- **registry 未登録 120 件のバックフィル** — Vocabulary シートに存在するが
  `master_audio_registry.json` にエントリが無い語。⑤/⑥ までに方針確定。
- **`word_新聞` の sync 漏れ** — sheet は `generated`+Drive URL だが
  registry の audioUrl 空。`npm run sync-registries` で解消するはず（未検証）。

---

## 今やること

**Phase 3 ⑤ — 音声 QC スペック検証スクリプト＋invariants 追加。**

完了条件：

1. `scripts/validate-audio.mjs` 新規作成。`data/audio/*.mp3` を ffprobe で計測：
   - **LUFS**：`-16 ± 1 LUFS`（loudnorm の目標値内）
   - **true peak**：`-1.5 dB 以下`（クリッピング無し）
   - **duration**：`0.3 〜 30 秒`（極端な短／長を検出）
   - **bit rate**：`>= 64 kbps`（過剰圧縮を検出）
   - **codec/sample rate**：`mp3 / 48 kHz`（QC 出力仕様の固定確認）
2. `npm run validate-audio` を package.json に追加。
3. `scripts/validate.mjs` の invariants[D] として音声 QC PASS を追加
   （invariants A=GAS版 / B=hash / C=件数 / D=音声 QC）。
   `npm run validate` で D の集計だけ走らせる（個別違反は --type=audio で詳細）。
4. 既存 55 件全件 PASS を確認。違反があれば QC パラメータを ④ 側で再調整。
5. （参考）GAS Drive 由来の Drive URL audio との並列 A/B：deep diff は意味が
   ないが「両方とも spec PASS」を確認すれば置換正当性の根拠になる。

このスライスで Phase 3 の品質保証ループが閉じる。⑥ で GAS を引退させる前に
**ローカル合成版が GAS 版と同等以上の品質である**ことを invariants で示すのが目的。

---

## ブロッカー

無し。④ の audio-qc / ffprobe がそのまま使える。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash / C=件数 / D=音声 QC（⑤ で追加予定）
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
node scripts/_tts-smoke.mjs  # Phase 3 ② スモーク（.tmp_verify/_tts_smoke.mp3）
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

Phase 3 ⑤ で追加予定：

```
npm run validate-audio        # data/audio/*.mp3 を ffprobe で計測してスペック PASS 判定
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 ⑥ で引退対象）
generateAudioBatch        # 毎日 10:00
```
