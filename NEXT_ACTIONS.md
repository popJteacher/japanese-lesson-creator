# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 1 ① 完了：`.env.example` 追加・`.gitignore` 登録）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／`docs/REFERENCE.md` 実測確定／
  validator・invariants（`npm run validate` / `npm run missing-assets`）稼働。
- **Phase 1：active。** 分類・翻訳のローカル化。GAS の `classifyAndTranslate` を引退させる。
- **Phase 2〜4：未着手。** 詳細は `docs/MIGRATION_PLAN.md`。

---

## 今やること（Phase 1 active・順番通り）

以後どのスライスも所属 Phase を明示する運用。すべて `[Phase 1]` 接頭辞を付ける。

1. **[Phase 1] 人間タスク：実 `.env` をローカルに作成。**
   `.env.example` を `.env` にコピーし `GEMINI_API_KEY` を埋める
   （鍵入手元 https://aistudio.google.com/apikey）。Claude Code 側は実行不可。
2. **[Phase 1] ローカル classify/translate の実装＋レート制限／backoff。**
   Gemini API の RPM/TPM/RPD に対するスロットリング設計を最初から入れる
   （GAS の BATCH_SIZE:3 timeout 対策が API レート対策に置き換わるだけ）。
   入出力契約は GAS の `classifyAndTranslate.gs` を一次資料とする。
3. **[Phase 1] 同値検証。**
   ローカル分類出力 == 現 GAS 出力 を diff 確認してから切替。
   `exportVocabTypes` を一度きりの基準スナップショットとして使い、検証後に永久引退させる。
4. **[Phase 1 完了条件]** `exportVocabTypes` 不要・`vocab_type` をローカルが生成・
   `npm run validate` invariants C 継続 PASS・v3.2 SMOKE 3 語 PASS
   （`docs/PHASE_BACKLOG.md` の Phase 1 取り出し項目）。

---

## ブロッカー

無し。

---

## 直近の確定コマンド

```
npm run validate           # スキーマ + invariants A/B/C（B は LF 正規化後 SHA で照合）
npm run missing-assets     # imageUrl/audioUrl null 列挙
node scripts/invariants.mjs               # 単独実行（同じ結果）
node scripts/missing-assets.mjs --type=image
node scripts/missing-assets.mjs --type=audio
```

人間側（Claude Code 実行不可）：

```
# Phase 1 進行中は GAS 自動トリガーは現状維持（停止しない）
generateAudioBatch        # 毎日 10:00（Phase 3 で引退）
syncAll                   # 毎日 23:00（Phase 2 で引退）
```
