# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 スライス確定・① active 化）

---

## 現在地

- **Phase 0／1／2：完了。** 詳細は `docs/MIGRATION_PLAN.md` および git 履歴。
- **Phase 3：active。** 音声のローカル化＋音声 QC。スライス ①〜⑥ は
  `docs/MIGRATION_PLAN.md` の Phase 3 セクション参照。
- **Phase 4：未着手。**

生存中の GAS トリガー：`generateAudioBatch`（毎日 10:00）— Phase 3 ⑥ で引退。

---

## 今やること

**Phase 3 ① — Cloud TTS SA 鍵・`.env` 設計・疎通確認スクリプト。**

完了条件：

1. Cloud TTS 用 SA JSON を `.env` 規定の場所に置く設計を確定
   （Phase 2 の Sheets SA と同型。`.gitignore` でルート保全済み＝ `e6700a5` 参照）。
2. `.env.example` に `GOOGLE_TTS_SA_JSON` 等の必要キーを追記。
3. `scripts/check-tts-sa.mjs` を新規作成し、`npm run check-tts-sa` で
   Cloud TTS API への疎通（voices.list など軽量呼び出し）PASS を確認。
4. `package.json` に `check-tts-sa` script を追加。

このスライスでは **音声を 1 件も合成しない**。鍵が通ることだけを確認する。
合成は ② で行う。

---

## ブロッカー

- Cloud TTS の SA 鍵（または既存 GCP プロジェクトの TTS 有効化）。
  Phase 2 で使った SA を流用するか新規発行するかは ① 着手時に判断。
  料金カウンタ設計は ③ で扱う（① ではまだ不要）。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash OK / C=件数
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通（Phase 2 で導入済み）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

Phase 3 ① で追加予定：

```
npm run check-tts-sa         # Cloud TTS 疎通（新設）
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 ⑥ で引退対象）
generateAudioBatch        # 毎日 10:00
```
