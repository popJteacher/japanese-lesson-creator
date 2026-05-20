# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 2 コード完了・人間タスク 1 件待ち）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／validator・invariants 稼働。
- **Phase 1：完了。** `vocab_type` をローカル `scripts/classify-and-translate.mjs` が生成。
  GAS `classifyAndTranslate` / `exportVocabTypes` は v7.2 で退役・`archive/gas_old/` 保全。
- **Phase 2：コード完了（⑦ 完了条件 人間タスク 1 件待ち）。**
  - ① `.env` 設置 + `googleapis` + `npm run check-sa` 疎通
  - ② `scripts/lib/sheets-client.mjs`
  - ③ `scripts/sync-registries-local.mjs`（GAS syncAll 等価・atomic write・idempotent 確認済み）
  - ④ 同値検証 PASS（`scripts/diff-registries.mjs` で残差分 0 件）
  - ⑤ `archive/registries_snapshot_2026-05-20_gas/` に GAS 最終出力を保全
  - ⑥ `gas/pipeline.gs` v7.3 で syncRegistries セクション退役（174 行純減）。
    `loadJsonFromDriveById` のみ残置（importExamplesFromLesson02 依存）。
- **Phase 3〜4：未着手。**

---

## 今やること

**[Phase 2 ⑦ / 人間タスク] GAS 側の最終クリーンアップ（実害なし＝急ぎではない）。**

1. **GAS スクリプトエディタを開く** → `gas/pipeline.gs` の中身を全選択コピーで貼り替え（v7.3 を live に反映）。
   - 既存の syncAll / syncImageRegistry / syncAudioRegistry / saveJsonToDriveById /
     setupSyncDailyTrigger / testProtectedKeys は GAS 側から自動的に消える。
2. **GAS Triggers 画面で `syncAll` トリガー（毎日 23:00）を削除。**
   - 削除しない場合：23:00 に「`syncAll is not defined`」エラーで即座に no-op 終了。
     データ破壊なし・スプレッドシート操作なし・実害ゼロ。気付いた時に削除すればよい。
3. **完了確認：** 翌日 23:00 以降に GAS Triggers 画面で `syncAll` が消えていれば Phase 2 完了。

→ 完了報告で **Phase 3 着手** に進む。

---

## ブロッカー

無し（Phase 2 完了条件は人間タスク待ちのみ）。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash OK / C=件数
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通（Vocabulary 先頭 3 行）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
node scripts/diff-registries.mjs <gas-snapshot> <local-registry>   # 同値検証
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# Phase 2 ⑦：v7.3 貼り替え + syncAll トリガー削除（実害なし・任意のタイミング）
# 残る生存 GAS トリガー（Phase 3 で引退予定）：
generateAudioBatch        # 毎日 10:00
```

---

## 本日（2026-05-20）のコミット履歴（参考・git log で再導出可能）

```
e3640b6 chore(phase2): GAS syncRegistries 退役（Phase 2 ⑤⑥ 完了・v7.3）
892f840 test(phase2): 同値検証 PASS（Phase 2 ④ 完了）
781c07d docs(next): Phase 2 ①②③ 完了 → ④ 同値検証 active
edaaa7f feat(phase2): sync-registries-local.mjs と初回実行（Phase 2 ③ 完了）
01190b8 feat(phase2): Sheets 読み出しクライアント（Phase 2 ② 完了）
983e1c0 chore(phase2): googleapis 追加と SA 疎通確認スクリプト（Phase 2 ① 追補）
e6b66da chore(phase2): .env / .gitignore に SA 設置の場所を確保（Phase 2 ① 完了）
d05c677 docs(next): Phase 2 スライスを 7 項に確定（registry repo ネイティブ化）
```
