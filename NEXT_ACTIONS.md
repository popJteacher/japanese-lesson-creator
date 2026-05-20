# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 4 ① ② 完了 / v3.3 プロンプト実装は別 worktree で進行中）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。**
  - **①** Imagen API 疎通：**完了**（`npm run check-imagen-key` PASS）。
  - **②** Imagen client + smoke：**完了**（PNG 663 KB / 27 秒 / $0.04 課金で billing 実機確認）。
  - **v3.3 プロンプト辞書修正（72 件）**：別 worktree
    `.claude/worktrees/image-prompt-plan`（branch `phase4-prompt-plan`）で
    **実装進行中**。プランは `C:\Users\kohn0\.claude\plans\partitioned-bubbling-babbage.md`。
    Step 1〜7 完了予定。`main` への merge 待ち。
  - **③** バッチ生成（`scripts/generate-images-local.mjs`）：未着手。
    v3.3 プロンプトを `main` に merge してから着手する。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

**main 側はプロンプト実装の merge 待ち。** 別 worktree のセッションが
Step 1〜7 を完了してから新セッションで main に戻り：

1. `git log phase4-prompt-plan` で Step 1〜7 のコミット履歴を確認
2. `git merge phase4-prompt-plan`（NEXT_ACTIONS.md だけが conflict する想定）
3. `npm run validate` で全件 PASS 確認（v3.3 hash に置き換わる）
4. Phase 4 ③（`scripts/generate-images-local.mjs`）の実装着手判断
5. ④⑤⑥ と進める

### main で並行できること（プラン非依存・任意）

merge 待ちの間でも main 側で独立に進められる作業：

- **registry 未登録 120 件のバックフィル**（`docs/PHASE_BACKLOG.md` Phase 4 セクション）
- **`word_新聞` の audio sync 漏れ**（`npm run sync-registries` 1 発で解消見込み）

これらをやるか、merge を待つだけかはセッション開始時に判断する。

---

## ブロッカー

- **③ 以降：** 別 worktree での v3.3 プロンプト実装（Step 1〜7）の完了と
  `phase4-prompt-plan` → `main` merge を待つ。

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
node scripts/_tts-smoke.mjs     # Phase 3 ② スモーク
node scripts/_imagen-smoke.mjs  # Phase 4 ② スモーク（実機 1 件＝$0.04）
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 4 ⑥ で引退対象）
generateImageBatch × 3 件   # 9/13/17 時

# 今は VSCode 側で次のフォルダを開いて新セッションを起動：
#   c:\Users\kohn0\Desktop\japanese-lesson-creator-main\.claude\worktrees\image-prompt-plan
# 最初のメッセージは partitioned-bubbling-babbage.md を読ませて Step 1 から実装。
```
