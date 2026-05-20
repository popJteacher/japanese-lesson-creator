# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 2 ①②③ 完了・④ 同値検証 active へ）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／validator・invariants 稼働。
- **Phase 1：完了。** `vocab_type` をローカル `scripts/classify-and-translate.mjs` が生成。
  GAS `classifyAndTranslate` / `exportVocabTypes` は v7.2 で退役・`archive/gas_old/` 保全。
- **Phase 2：active。** registry を repo ネイティブ化。①②③ 完了。
  - ① SA 設置と `.env`/`.gitignore` 拡張・`googleapis` 追加・`npm run check-sa` 疎通済み
  - ② `scripts/lib/sheets-client.mjs`（loadEnv / createSheetsClient / fetchSheet /
    requireColumns / SHEET_SCHEMAS / fetchVocabulary / fetchExamples）
  - ③ `scripts/sync-registries-local.mjs`（GAS syncAll 等価・atomic write）
    初回実行で word_雑誌 / word_写真 の音声 URL 2 件を repo に反映。idempotent 確認済み。
- **Phase 3〜4：未着手。**

---

## 今やること（Phase 2 ④ active から続き・順番通り）

すべて `[Phase 2]` 接頭辞を付ける。`/` 区切りは「実行主体／補足」。

1. **[Phase 2 ④ / 人間タスク] GAS syncAll を 1 回手動実行 → Drive snapshot 取得。**
   - GAS スクリプトエディタで関数 `syncAll` を選択 → 「実行」。
   - 完了後、Drive で以下 2 ファイルをダウンロード（右クリック → ダウンロード）：
     - `master_image_registry.json` (ID: `17WnltHEvymkua4hgfak2951f5BgphV9O`)
     - `master_audio_registry.json` (ID: `1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M`)
   - ローカルの `archive/registries_snapshot_2026-05-20_gas/` に保存（Claude Code がディレクトリ作成・diff 実施）。

2. **[Phase 2 ④ / Claude Code] 同値 diff の実施。**
   - 同タイミングで `npm run sync-registries` を再実行（シート状態を揃える）。
   - `archive/registries_snapshot_2026-05-20_gas/*.json` と `data/master_*_registry.json` を diff。
   - 期待：`_meta.lastUpdated` / `_meta.lastModified` 以外ゼロ差分。
   - 差分があれば原因分析（status 上書きルール、protected キー、未登録 skip など）。

3. **[Phase 2 ⑤ / Claude Code] Drive snapshot を archive/ に確定保管。**
   - `archive/registries_snapshot_2026-05-20_gas/` を tracked のままコミット。
   - `handoff_archive.md` に「Drive registry SSOT 引退」を 1 行追記。

4. **[Phase 2 ⑥ / 人間 + Claude Code] GAS syncAll 引退（v7.3）。**
   - 人間：GAS Triggers から `syncAll`（毎日 23:00）を削除。
   - Claude Code：`gas/pipeline.gs` の syncRegistries セクション撤去 → ヘッダー v7.3。
   - `archive/gas_old/syncRegistries_v_NA.gs` に退避。
   - `scripts/invariants.mjs` の GAS 期待 section リストを v7.3 用に更新。
   - 人間：v7.3 を GAS エディタに貼り直す。

5. **[Phase 2 完了条件]** Drive registry 経由の手作業ゼロ／`npm run sync-registries` が動作（達成済み）／
   `syncAll` トリガー＋セクション消滅／invariants A/B/C 継続 PASS。

---

## ブロッカー

無し。④ 人間タスク待ち。

---

## 直近の確定コマンド

```
npm run validate             # スキーマ + invariants A/B/C（A は v7.2・section 5 件）
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Phase 2 ① 疎通確認（Vocabulary 先頭 3 行表示）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]   # Phase 2 ③
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]   # Phase 1
```

人間側（Claude Code 実行不可）：

```
# Phase 2 ④ active：GAS syncAll を 1 回手動実行 → Drive registry をダウンロード
syncAll                   # 毎日 23:00 トリガーは ⑥ まで現状維持
generateAudioBatch        # 毎日 10:00（Phase 3 で引退）
```
