# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 1 ② 実装完了。SMOKE 検証は実 API キー待ち）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／validator・invariants 稼働。
- **Phase 1：active。** ① 完了（`.env.example` ＋ `.gitignore`）／② コード完了（`scripts/classify-and-translate.mjs`）／③ ④ 未着手。
- **Phase 2〜4：未着手。** 詳細は `docs/MIGRATION_PLAN.md`。

---

## 今やること（Phase 1 active・順番通り）

1. **[Phase 1 / 人間タスク] 実 `.env` をローカルに作成。**
   `.env.example` を `.env` にコピーし `GEMINI_API_KEY` を埋める
   （鍵入手元 https://aistudio.google.com/apikey）。Claude Code 側は実行不可。
2. **[Phase 1 / 人間タスク] SMOKE 3 語 verify。**
   `npm run classify -- --lesson 01 --verify --only 医者,会社員,学生` を実行し PASS=3 を確認。
   出力結果（vocab_type と en）を Claude Code にコピペ報告 → 次ステップへ。
3. **[Phase 1 / 同値検証 ③] 17 件 verify。**
   SMOKE 通過後 `npm run classify -- --lesson 01 --verify` で 17 件全数 PASS を確認。
   `vocab_type 不一致` が出たら原因を Claude Code が調査（プロンプト差分・モデル仕様変更等）。
4. **[Phase 1 完了条件 ④] exportVocabTypes 引退の印。**
   - verify 全 PASS 後 `npm run classify -- --lesson 01 --force` を実行し `data/vocab_types_lesson01.json` を
     local generator 由来に書き換える（`_meta.generator: scripts/classify-and-translate.mjs`）。
   - `gas/pipeline.gs` の `exportVocabTypesAll`／`classifyBatch` 系を `archive/gas/` へ移設（コードは消さず移動）。
   - `npm run validate` invariants C 継続 PASS を確認。

---

## ブロッカー

- **②③④ は GEMINI_API_KEY 待ち**（① の人間タスクが先行する）。
  鍵入手後は ② → ③ → ④ を一気通貫で実行できる。

---

## 直近の確定コマンド

```
npm run validate           # スキーマ + invariants A/B/C
npm run missing-assets     # imageUrl/audioUrl null 列挙
npm run classify -- --help # Phase 1 ② の使い方
npm run classify -- --lesson 01 --dry-run   # API 不要・対象 17 件を表示
```

人間側（Claude Code 実行不可）：

```
# Phase 1 進行中は GAS 自動トリガーは現状維持（停止しない）
generateAudioBatch        # 毎日 10:00（Phase 3 で引退）
syncAll                   # 毎日 23:00（Phase 2 で引退）
# classifyBatch / exportVocabTypesAll は Phase 1 ④ 完了時点で archive 行き
```
