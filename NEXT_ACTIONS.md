# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 1 完了。Phase 2 active へ）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／validator・invariants 稼働。
- **Phase 1：完了。** `vocab_type` をローカル `scripts/classify-and-translate.mjs` が生成。
  vocab_type 17/17 完全一致 verify 済み。GAS `classifyAndTranslate.gs` / `exportVocabTypes.gs`
  は `gas/pipeline.gs` v7.2 から退役し `archive/gas_old/` に保全。
- **Phase 2：active。** registry を repo ネイティブ化。Drive download/upload ループ廃止。
- **Phase 3〜4：未着手。** 詳細は `docs/MIGRATION_PLAN.md`。

---

## 今やること（Phase 2 active）

すべて `[Phase 2]` 接頭辞を付ける。①は人間タスク、②③ は設計合意してから着手。

1. **[Phase 2 / 人間タスク] GAS 側のクリーンアップ。**
   - `gas/pipeline.gs` v7.2 を GAS エディタに貼り直す。
   - GAS トリガー一覧で `classifyBatch` のトリガーがあれば削除（関数本体が消えたため次回起動で参照エラー）。
   - `exportVocabTypesAll` の手動実行ボタンは GAS から消える。
2. **[Phase 2 / 設計合意必要] 現 registry フローの棚卸し。**
   - 真実源：`gas/pipeline.gs` の `syncAll` / registry 書き込み箇所。
   - repo 側 SSOT：`data/master_image_registry.json` / `data/master_audio_registry.json`。
   - 現状フロー（GAS → Drive → 人手で repo 取り込み）を 1 図 1 ページで言語化 → Claude Code が起案、人間が確認。
3. **[Phase 2 / 実装] ローカル registry writer。**
   - ローカルが `data/master_*_registry.json` に直接 append/update。
   - Drive 経由の registry sync コードを GAS から退役（archive へ）。
   - 完了条件：Drive registry 経由の手作業ゼロ／既存 lesson_01・lesson_02 で
     `npm run missing-assets` が GAS 介在なしで動く。

---

## ブロッカー

無し。

---

## 直近の確定コマンド

```
npm run validate           # スキーマ + invariants A/B/C（A は v7.2・section 5 件に縮小）
npm run missing-assets     # imageUrl/audioUrl null 列挙
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]   # Phase 1 成果
```

人間側（Claude Code 実行不可）：

```
# Phase 2 active 中は GAS 自動トリガーは現状維持
generateAudioBatch        # 毎日 10:00（Phase 3 で引退）
syncAll                   # 毎日 23:00（Phase 2 で引退予定）
# classifyBatch / exportVocabTypesAll は v7.2 で archive 行き済み
```
