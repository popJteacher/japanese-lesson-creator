# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 ① 完了・② active 化）

---

## 現在地

- **Phase 0／1／2：完了。** 詳細は `docs/MIGRATION_PLAN.md` および git 履歴。
- **Phase 3：active。** 音声のローカル化＋音声 QC。スライス ①〜⑥ は
  `docs/MIGRATION_PLAN.md` の Phase 3 セクション参照。
  - **①** Cloud TTS SA 鍵・`.env` 設計・疎通確認スクリプト：**完了（2026-05-20）**
    - `scripts/check-tts-sa.mjs` で `npm run check-tts-sa` が PASS
    - SA `sheets-reader@gen-lang-client-0575082983` に
      `roles/serviceusage.serviceUsageConsumer` 付与済み
    - ja-JP Neural2-B/C/D 検出確認
- **Phase 4：未着手。**

生存中の GAS トリガー：`generateAudioBatch`（毎日 10:00）— Phase 3 ⑥ で引退。

---

## 今やること

**Phase 3 ② — `scripts/lib/tts-client.mjs` で Cloud TTS Neural2 を 1 件合成。**

完了条件：

1. `scripts/lib/tts-client.mjs` を新規作成し、Phase 2 の `lib/sheets-client.mjs` と
   同じスタイル（`loadEnv` 流用・`google.texttospeech` 認証クライアント生成）で
   `synthesize({ text, voice }) → mp3 Buffer` を提供する。
2. CLI から 1 件だけ合成する dry-run スクリプト（`scripts/_tts-smoke.mjs` 仮）を作り、
   `data/` 配下に test mp3 を 1 個出す。
3. mp3 が再生可能（ヘッダー `ID3` または MPEG sync）であることを確認。
4. まだ QC（loudnorm/トリム/フェード）／バッチ化／文字カウンタ／registry 連携は **しない**。
   それらは ③〜④ で導入。

このスライスでは GCP 課金が初発生する（1 件合成 ≒ 50 文字 → 数銭〜数十銭の桁）。
無料枠 100 万文字/月の範囲で問題なし。

---

## ブロッカー

無し。SA 設定は ① で済んでいるため ② はコード書きのみ。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash OK / C=件数
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通（Phase 3 ① 導入）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 ⑥ で引退対象）
generateAudioBatch        # 毎日 10:00
```
