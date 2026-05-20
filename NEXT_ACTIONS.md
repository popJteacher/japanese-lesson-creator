# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 4 ① ② 完了確定）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。** Imagen 呼び出しのローカル化（GAS 完全消滅まで残 1 phase）。
  バックエンドは **Google AI Studio + GEMINI_API_KEY 流用**（Vertex AI ではない・SA 不要）。
  - **①** Imagen API 疎通：**完了**（`npm run check-imagen-key` PASS）。
  - **②** Imagen client + smoke：**完了**（`node scripts/_imagen-smoke.mjs` PASS、
    Standard 1 件 PNG 663,677 bytes / 27 秒 / $0.04 課金成立で billing 有効化も実機確認）。
  - 並行：別 worktree `phase4-prompt-plan` で master prompt guide 修正プラン作成中。
    ③ 以降は **プラン取り込み後に組み直す**（独立に走らせない）。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

**`phase4-prompt-plan` worktree の進捗確認・③ 着手判断。**

プラン非依存スライスは ① ② で打ち止め。次は ③ バッチ生成だが、③ は master
prompt guide 修正プランに **強依存**。次セッション開始時に：

1. `phase4-prompt-plan` worktree（`.claude/worktrees/image-prompt-plan`）の
   git log で進捗を確認する。
2. プラン docs が main へ merge 可能な状態なら：
   - merge してプロンプトビルドのローカル移植を含む ③ を組み直す
   - `scripts/generate-images-local.mjs`（バッチ＋registry 連携＋RPD/コスト
     ガード）を実装着手
3. まだ作成中なら ③ には入らず、Phase 3 横断課題（下）の片付けに回すか
   セッションを終了する。

### Phase 4 で取り戻す Phase 3 横断課題

`docs/PHASE_BACKLOG.md` の Phase 4 セクション参照：
- registry 未登録 120 件のバックフィル（image 側不足分と統一処理）
- `word_新聞` の audio sync 漏れ（`npm run sync-registries` 1 発で解消見込み）

これらは ③ の本体着手前に片付けてもよい（プラン非依存で進められる）。

---

## ブロッカー

- **③ 以降：** `phase4-prompt-plan` worktree の master prompt guide 修正プラン依存。
  プランが取り込まれるまでは ③ 詳細を確定できない。

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
```
