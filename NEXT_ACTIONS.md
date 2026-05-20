# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 ② 完了・③ active 化）

---

## 現在地

- **Phase 0／1／2：完了。** 詳細は `docs/MIGRATION_PLAN.md` および git 履歴。
- **Phase 3：active。** 音声のローカル化＋音声 QC。スライス ①〜⑥ は
  `docs/MIGRATION_PLAN.md` の Phase 3 セクション参照。
  - **①** Cloud TTS SA 鍵・`.env` 設計・疎通確認スクリプト：**完了**
  - **②** ローカル TTS クライアント・1 件合成：**完了（2026-05-20）**
    - `scripts/lib/tts-client.mjs` に `createTtsClient` / `synthesize` を実装
    - `node scripts/_tts-smoke.mjs` で `ja-JP-Neural2-B` の合成 PASS
    - `.tmp_verify/_tts_smoke.mp3`（19,776 bytes・MPEG sync `ff f3 84 c4`）生成確認
- **Phase 4：未着手。**

生存中の GAS トリガー：`generateAudioBatch`（毎日 10:00）— Phase 3 ⑥ で引退。

---

## 今やること

**Phase 3 ③ — `scripts/generate-audio-local.mjs` でバッチ化＋月間文字カウンタ＋registry 連携。**

完了条件：

1. `scripts/generate-audio-local.mjs` を作る。Vocabulary／Examples の
   `audioStatus=null` 行を対象に Cloud TTS で合成し、
   `data/audio/<id>.mp3` に書き出す。
2. `data/_meta/tts_usage.json`（仮）に月別の文字消費量を追記。Cloud TTS
   無料枠 100 万文字/月を超えないよう **上限ガード**（既定上限 800,000 文字。
   `--max-chars` で上書き可）。超過しそうなら処理中断＋差分レポート出力。
3. `master_audio_registry.json` を更新する（imageRegistry と同じ構造で
   `audioUrl` を相対パス `data/audio/<id>.mp3` に切替）。
4. `npm run generate-audio` を package.json に追加。CLI フラグ：
   `--dry-run`（API 呼ばずに対象件数だけ表示）／`--limit N`（先頭 N 件のみ）／
   `--only word|sentence`（種別フィルタ）／`--max-chars N`。
5. `npm run missing-assets` の `null_audioUrl` 件数が 0 になるまで一周。
   QC（loudnorm/トリム/フェード）は **④ で導入**。ここではまだ raw mp3 でよい。

このスライスでは GCP 課金が本格化する（L02 例文 30+ 件 ≒ 1,500 文字 ≒ 数銭〜数十銭）。
無料枠 100 万文字/月を意識した上限ガード設計が ③ の山。

---

## ブロッカー

無し。② の `lib/tts-client.mjs` をそのまま再利用する。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash OK / C=件数
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
node scripts/_tts-smoke.mjs  # Phase 3 ② スモーク（.tmp_verify/_tts_smoke.mp3）
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

Phase 3 ③ で追加予定：

```
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N]
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 ⑥ で引退対象）
generateAudioBatch        # 毎日 10:00
```
