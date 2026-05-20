# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 4 ① 完了 / ② コード完了・実機検証保留中）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。** Imagen 呼び出しのローカル化（GAS 完全消滅まで残 1 phase）。
  バックエンドは **Google AI Studio + GEMINI_API_KEY 流用**（Vertex AI ではない・SA 不要）。
  - **①** Imagen API 疎通：**完了**（`npm run check-imagen-key` PASS、
    Standard / Fast / Ultra の全 3 モデル検出）。
  - **②** Imagen client + smoke：**コード完了・実機検証保留**。
    `scripts/lib/imagen-client.mjs`（再試行 backoff 込み）と
    `scripts/_imagen-smoke.mjs` は実装済み・commit 済み。
    2026-05-20 中の実機検証は AI Studio 側 503 UNAVAILABLE（広域 transient
    障害）で 4 回 backoff 全敗。コード・鍵・billing 設定は通過済み。
  - 並行：別 worktree `phase4-prompt-plan` で master prompt guide 修正プラン作成中。
    ③ 以降は **プラン取り込み後に組み直す**（独立に走らせない）。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

**人間タスク：API 復旧待ちで `_imagen-smoke.mjs` を再実行。**

30〜60 分以上空けてから：

```
node scripts/_imagen-smoke.mjs
```

成功条件：

1. exit 0
2. `.tmp_verify/_imagen_smoke.png` が出力される
3. ヘッダーが PNG 署名（`89 50 4e 47 0d 0a 1a 0a`）

PASS したら新セッションで Claude Code に「Phase 4 ② 実機検証 PASS、確定コミットして
③ の準備に進んで」と伝える。Claude は：

- スモーク出力をログ確認（コミットしない・`.gitignore` 済み）
- `docs/MIGRATION_PLAN.md` の ② 着手結果を確定文に書き換え
- `NEXT_ACTIONS.md` を「② 完了 / ③ プラン待ち」に書き換え
- `chore(phase4): Phase 4 ② 実機検証 PASS 確定` で commit
- `phase4-prompt-plan` worktree のプラン進捗を確認し ③ 着手判断

503 が続くなら：

- 1 時間以上空けて再試行
- 24 時間以上 503 が続くようなら `docs/MIGRATION_PLAN.md` Phase 4 の決定保留事項
  に沿って Vertex AI バックエンド切替を検討（その時点で ① ② 一部やり直し）

### Phase 4 で取り戻す Phase 3 横断課題（再掲）

`docs/PHASE_BACKLOG.md` の Phase 4 セクション参照：
- registry 未登録 120 件のバックフィル（image 側不足分と統一処理）
- `word_新聞` の audio sync 漏れ（`npm run sync-registries` 1 発で解消見込み）

---

## ブロッカー

- **②：** Google AI Studio Imagen 4 系の transient 503（2026-05-20 セッション内
  4 回 backoff 全敗）。サーバ復旧次第ユーザがスモークを叩く。
- **③ 以降：** `phase4-prompt-plan` worktree の master prompt guide 修正プラン依存。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=hash / C=件数 / D=音声 QC（55/55 PASS, 3 WARN）
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run validate-audio       # data/audio/*.mp3 の QC スペック検証
node scripts/_tts-smoke.mjs  # Phase 3 ② スモーク
node scripts/_imagen-smoke.mjs  # Phase 4 ② スモーク（実機 1 件＝$0.04・要 API 復旧）★ NEW
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 9/13/17 時

# 直近の能動タスク
node scripts/_imagen-smoke.mjs   # 30〜60 分以上空けてから（API 503 復旧待ち）
```
