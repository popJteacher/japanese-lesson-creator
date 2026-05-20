# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 2 完了・Phase 3 active 化前）

---

## 現在地

- **Phase 0：完了。** repo-as-brain 規律確立／validator・invariants 稼働。
- **Phase 1：完了。** `vocab_type` をローカル `scripts/classify-and-translate.mjs` が生成。
  GAS `classifyAndTranslate` / `exportVocabTypes` は v7.2 で退役・`archive/gas_old/` 保全。
- **Phase 2：完了（2026-05-20）。** registry を repo ネイティブ化達成。
  - ローカル `scripts/sync-registries-local.mjs` が Sheets API → `data/master_*_registry.json` を直接書く
  - GAS `syncRegistries` セクション v7.3 で退役・`syncAll` トリガー人間削除済み
  - 同値検証 PASS（GAS Drive 最終出力と JSON 構造 deep diff で残差分 0 件）
  - Drive 上の旧 registry ファイル 2 件は archive snapshot として `archive/registries_snapshot_2026-05-20_gas/` に保全（Drive 本体は放置）
- **Phase 3：未着手（次の active 候補）。** 音声のローカル化＋音声 QC。
- **Phase 4：未着手。**

---

## 今やること

**Phase 3 のスライス分解を行うかどうかの判断ポイント。**

`docs/MIGRATION_PLAN.md` の Phase 3 定義：
> Cloud TTS（Neural2）をローカルから呼ぶ＋月間文字カウンタ。
> ffmpeg で loudnorm／トリム／フェード QC を追加（注記：移設でなく獲得。
> GAS は ffmpeg 不可で QC 不可能だった）。
> 完了＝ `generateAudioBatch` の GAS 消滅・音声 QC 稼働。

→ Phase 2 と同じく順序付きスライス（①〜⑥ 程度）に分解してから着手する。
分解は次セッション冒頭で行う（チャネル分担：`docs/SESSION_START.md` 参照）。

---

## ブロッカー

無し。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash OK / C=件数
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
node scripts/diff-registries.mjs <a.json> <b.json>   # JSON deep diff（_meta 日付 ignore）
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 で引退対象）
generateAudioBatch        # 毎日 10:00
```
