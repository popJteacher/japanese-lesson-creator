# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 完了確定・Phase 4 着手前）

---

## 現在地

- **Phase 0／1／2／3：完了。** すべてコード + GAS トリガー両面でクローズ済み。
  - 2026-05-20 Phase 3 ⑥ 確認時に発覚した orphan トリガー
    （`syncAll` / `classifyBatch`）も同日削除済み
- **Phase 4：active 候補（未着手）。** Imagen 呼び出しのローカル化で GAS 完全消滅。
  並行：別 worktree `phase4-prompt-plan` で master prompt guide 修正プラン作成中。

生存中の GAS トリガー：`generateImageBatch` × 3 件 — Phase 4 ⑥ で引退対象。

---

## 今やること

**Phase 4 のスライス分解と着手は新セッションで実施する。**

このセッションは Phase 3 クローズで終了。Phase 4 は別セッションで開始する
（memory [[parallel-worktrees]] ：1 セッション = 1 worktree、切替運用しない）。

### 並行プランニングとの依存関係（新セッション開始前に把握）

`phase4-prompt-plan` worktree で master prompt guide 修正プランが作成中。
プラン完了前に Phase 4 で進めて良いスライスは限定的：

| Phase 4 スライス | プラン依存 | 並行可否 |
|---|---|---|
| ① Imagen API SA 設定・疎通 | なし（インフラ） | OK |
| ② Imagen client library | なし（インフラ） | OK |
| ③ バッチ生成（実プロンプト送信） | **強依存** | プラン取り込み後 |
| ④ 画像 QC（必要なら） | 弱依存 | プラン取り込み後 |
| ⑤ 画像 QC invariants[E] | 弱依存 | プラン取り込み後 |
| ⑥ GAS generateImageBatch 引退 | 独立 | ③ 後 |

新セッションでは ① と ② を先行、プランが届いたら ③ 以降を組み直す。

### Phase 4 で取り戻す Phase 3 横断課題

`docs/PHASE_BACKLOG.md` の Phase 4 セクション参照：
- registry 未登録 120 件のバックフィル（image 側不足分と統一処理）
- `word_新聞` の sync 漏れ（`npm run sync-registries` 1 発で解消見込み）

---

## 新 Phase 4 セッションの開始方法

Claude Code 拡張機能で新セッション開始、最初のメッセージは：

```
CLAUDE.md と NEXT_ACTIONS.md と docs/SESSION_START.md を読む。

このセッションの目的は Phase 4（Imagen 呼び出しのローカル化）。
別 worktree `phase4-prompt-plan` で master prompt guide 修正プランが
並行作成中。プラン依存のないスライス ①（Imagen API SA 設定・疎通）と
② （client library）を先行して実装。③ 以降はプランが届いてから判断。

最初に Phase 4 のスライス分解（Phase 2/3 と同じく ①〜⑥ 程度）を
docs/MIGRATION_PLAN.md に書いてから着手すること。
```

---

## ブロッカー

無し。

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
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 10/14/18 時のいずれか
```
