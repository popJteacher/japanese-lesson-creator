# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 1 完了確認・Phase 2 スライス確定）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／validator・invariants 稼働。
- **Phase 1：完了。** `vocab_type` をローカル `scripts/classify-and-translate.mjs` が生成。
  GAS `classifyAndTranslate` / `exportVocabTypes` は v7.2 で退役・`archive/gas_old/` に保全。
  live GAS は v7.2 貼り替え済み・`classifyBatch` トリガーは元々不在。
- **Phase 2：active。** registry を repo ネイティブ化。Drive download/upload ループ廃止。
- **Phase 3〜4：未着手。** 詳細は `docs/MIGRATION_PLAN.md`。

---

## 今やること（Phase 2 active・順番通り）

すべて `[Phase 2]` 接頭辞を付ける。`/` 区切りは「実行主体／補足」。

1. **[Phase 2 / Claude Code] Service Account 設置と `.env`・`.gitignore` 拡張。**
   `.env.example` に `GOOGLE_APPLICATION_CREDENTIALS=secrets/sheets-sa.json` を追加。
   `.gitignore` に `secrets/` を追加（**最初の commit と同タイミング**で登録。.env 同様）。
   人間タスク：GCP で SA 作成 → JSON を `secrets/sheets-sa.json` に保存
   → Drive で SA メールに Vocabulary シートを read 共有。

2. **[Phase 2 / Claude Code] Sheets 読み出しクライアント。**
   `scripts/lib/sheets-client.mjs`：`googleapis` で Vocabulary / Examples シート全行を取得。
   必須列（imageId/audioId/imageUrl/imageStatus/audioUrl/audioStatus）の存在検証付き。

3. **[Phase 2 / Claude Code] `scripts/sync-registries-local.mjs`（syncAll ローカル等価）。**
   Vocabulary → `data/master_image_registry.json` + `data/master_audio_registry.json`。
   Examples → `data/master_audio_registry.json`（例文音声）。
   PROTECTED_PREFIXES=["char_","ex_L"] / PROTECTED_EXACT=["world_map"] を保持。
   `package.json` に `npm run sync-registries` を追加。

4. **[Phase 2 / 同値検証] GAS syncAll 出力 vs ローカル出力の diff。**
   GAS syncAll を 1 回走らせて Drive registry をスナップショット取得（人間タスク）。
   ローカル sync 出力と diff → `_meta.lastModified` 以外ゼロ差分を確認。
   2〜3 日並行運用してドリフトを観察。

5. **[Phase 2 / Claude Code] Drive registry を archive/ に保管。**
   `archive/registries_snapshot_YYYYMMDD/master_*_registry.json` をコミット。
   `handoff_archive.md` に「Drive registry SSOT 引退」を 1 行追記。
   Drive ファイル本体は放置（rename も削除もしない）。

6. **[Phase 2 / 人間タスク + Claude Code] GAS syncAll 引退（v7.3）。**
   人間：GAS Triggers から `syncAll` を削除。
   Claude Code：`gas/pipeline.gs` から syncRegistries セクションを撤去 → ヘッダー v7.3。
   `archive/gas_old/syncRegistries_v_NA.gs` に退避。
   `scripts/invariants.mjs` の GAS 期待 section リストを更新。

7. **[Phase 2 完了条件]** Drive registry 経由の手作業ゼロ／`npm run sync-registries` が動作／
   `syncAll` トリガー＋セクション消滅／invariants A/B/C 継続 PASS。

---

## ブロッカー

無し。

---

## 直近の確定コマンド

```
npm run validate           # スキーマ + invariants A/B/C（A は v7.2・section 5 件）
npm run missing-assets     # imageUrl/audioUrl null 列挙
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]   # Phase 1 成果
```

人間側（Claude Code 実行不可）：

```
# Phase 2 active 中は GAS 自動トリガーは現状維持
generateAudioBatch        # 毎日 10:00（Phase 3 で引退）
syncAll                   # 毎日 23:00（Phase 2 ⑥ で引退予定）
```
