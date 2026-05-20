# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 4 ① 完了）

---

## 現在地

- **Phase 0／1／2／3：完了。** 全クローズ済み。
- **Phase 4：着手中。** Imagen 呼び出しのローカル化（GAS 完全消滅まで残 1 phase）。
  バックエンドは **Google AI Studio + GEMINI_API_KEY 流用**（Vertex AI ではない・SA 不要）。
  - **①** Imagen API 疎通：**完了**（`npm run check-imagen-key` PASS、
    Standard / Fast / Ultra の全 3 モデル検出）。
  - 並行：別 worktree `phase4-prompt-plan` で master prompt guide 修正プラン作成中。
    ③ 以降は **プラン取り込み後に組み直す**（独立に走らせない）。

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— ⑥ で引退対象。

---

## 今やること

**Phase 4 ②**：`scripts/lib/imagen-client.mjs` で `imagen-4.0-generate-001` を 1 件生成。
`scripts/_imagen-smoke.mjs` から固定プロンプトで叩き、`data/images/_smoke/` に PNG を 1 件吐く。
これにより **billing 有効化（Imagen 4 は無料枠なし・Standard $0.04/枚）** の最終検証も兼ねる。

完了条件：

1. `node scripts/_imagen-smoke.mjs` が exit 0 で終わる
2. `data/images/_smoke/*.png` が 1 件以上、サイズ > 0 で生成される
3. レスポンスのモデル名・サイズ・生成所要時間・想定課金額がログに出る

QC・バッチ・registry 連携はやらない（それぞれ ③④）。

### スライス ② 完了後

- 一旦コミット境界を切る（`feat(phase4): imagen client + smoke（Phase 4 ② 完了）`）。
- そのまま ③ には入らない。`phase4-prompt-plan` worktree の進捗を確認し、
  master prompt guide 修正プランが取り込み可能になったら ③ を組み直す。

### Phase 4 で取り戻す Phase 3 横断課題（再掲）

`docs/PHASE_BACKLOG.md` の Phase 4 セクション参照：
- registry 未登録 120 件のバックフィル（image 側不足分と統一処理）
- `word_新聞` の audio sync 漏れ（`npm run sync-registries` 1 発で解消見込み）

---

## ブロッカー

- **③ 以降は `phase4-prompt-plan` worktree の master prompt guide 修正プラン依存。**
  プランが取り込まれるまでは ② で停止する。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.4 / B=hash / C=件数 / D=音声 QC（55/55 PASS, 3 WARN）
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）★ Phase 4 ① で追加
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
generateImageBatch × 3 件   # 9/13/17 時

# Phase 4 ① の billing 有効化（② のスモーク前にやる）
# https://aistudio.google.com/apikey → 該当プロジェクトで billing を有効化
# GCP コンソールで月次予算アラートを設定
```
