# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 ⑥ コード退役完了・人間タスク 1 件待ち）

---

## 現在地

- **Phase 0／1／2／3：コード完了。**
  - Phase 3 ⑥ で gas/pipeline.gs を v7.4 に bump、音声セクション全削除済み
  - `archive/gas_old/generateAudio_v2_0_phase3_retired.gs` に保全完了
  - `invariants[A]` から `generateAudio.gs` が消滅したことを `npm run validate` で確認
- **Phase 4：未着手。** 別 worktree `phase4-prompt-plan` でプラン作成中。

---

## 今やること

**Phase 3 完了の最後の 1 ピース：人間タスク待ち。**

### 人間タスク（Claude Code 実行不可）

GAS エディタを開いて **`generateAudioBatch` トリガーを削除**してください：

1. https://script.google.com/ で対象プロジェクトを開く
2. 左サイドバーの ⏰ アイコン（トリガー）をクリック
3. 一覧から `generateAudioBatch`（毎日 10:00 / または 10:00/14:00/18:00 の 3 件）を見つける
4. 各行右端「⋮」→「トリガーを削除」
5. 確認：トリガー一覧に `generateAudioBatch` が 0 件であること

**生存トリガーが 0 件になった時点で Phase 3 は完了確定**。

### 確認後にこちらでやること

- `NEXT_ACTIONS.md` を Phase 4 active 化形に書き直す（このページの内容を全消し）
- Phase 4 のスライス分解（別 worktree `phase4-prompt-plan` のプラン文書を取り込んで実施）

---

## Phase 3 で残った課題（Phase 4 active 化時に取り戻す）

`docs/PHASE_BACKLOG.md` の Phase 4 セクション参照：
- **registry 未登録 120 件のバックフィル**：image 側不足分と統一処理予定
- **`word_新聞` の sync 漏れ**：`npm run sync-registries` 1 発で解消見込み

---

## ブロッカー

無し。トリガー削除は人間が GAS Web エディタで 1 分でできる作業。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=hash / C=件数 / D=音声 QC（55/55 PASS, 3 WARN）
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run validate-audio       # data/audio/*.mp3 の QC スペック検証
node scripts/_tts-smoke.mjs  # Phase 3 ② スモーク
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# Phase 3 ⑥ 最後の人間タスク：これを GAS から削除すると Phase 3 完了確定
generateAudioBatch        # 毎日 10:00（または 10/14/18 の 3 件）
```
