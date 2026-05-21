# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（**Phase 5 着手・スコープ確定** / スライス ①〜⑥ 確定 / 設計判断 6 項目を MIGRATION_PLAN に追記 / 音声自然さチェックを Phase 3 後 backlog に記録）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5：着手中（① active）** — スライス ①〜⑥ 確定（`docs/MIGRATION_PLAN.md` § Phase 5 参照）
- **Phase 4 後 backlog**：着手保留（v3.12 person 品質修正 1-6 + 残り 436 件本生成）
- **Phase 3 後 backlog**：着手保留（音声自然さチェック・Gemini 2.5 audio path）

生存中の GAS 自動 trigger：**0 件**（Phase 4 完了時点・人間検証済 2026-05-21）。
残存 GAS は手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson`
の 3 系統のみ（Phase 5 ⑥ で退役予定）。

---

## active：Phase 5 ① — Goi_List 全レベル抽出 + raw source 凍結

**担当**：main 専属・プラン非依存
**並行**：worktree セッションで ④ を別途立ち上げて並行起動可（後述）

**やること：**

1. 既存 `gas/pipeline.gs` の `extractFromGoiList` セクション（line 402-607）の抽出
   ロジックを Node 側に移植（DriveApp → fs read に置換）
2. Goi_List.pdf を Drive からダウンロードして `data/sources/goi_list_raw.pdf` に
   配置（sensitive でなければ commit。サイズ次第で .gitignore でも可）
3. 抽出 script `scripts/extract-goi-list.mjs` を新規作成し全レベル（N5/N4/N3/N2/N1）
   抽出 → `data/sources/goi_list_raw.json` 出力
   - スキーマ：`{ _meta: { extractedAt, source, totalLevels }, entries: [{ word, reading, jlpt, pos, ... }] }`
4. 結果を commit → 抽出 script を `archive/scripts_old/extract_goi_list_v1_phase5.mjs`
   に移管（一度きり実行・再実行不要）

**完了条件**：`data/sources/goi_list_raw.json` が全レベル commit 済・抽出 script 凍結済。

**規模見積**：1-2 セッション。GAS の `parseGoiList_` ロジックを素直に移植すれば動く想定。

**コスト**：$0（local 処理）

---

## 並行起動可能：Phase 5 ④（worktree） — 例文 master prompt template + build_prompts.py 拡張

main で ① 進行中に user が worktree セッションを別途立てれば並行可能。
**1 セッション = 1 worktree** の規律は維持（同時に main と worktree を同一セッションで触らない）。

worktree でやること（詳細は `docs/MIGRATION_PLAN.md` § Phase 5 ④）：

- `master_prompt_design_guide_v3_N.py` に `vocabulary_example_sentence` template 新設
- `build_prompts.py` を catalog 駆動 + 全 vocab_type 対応に拡張
- 例文 5 件 sample プロンプトを `data/image_prompts_lesson02_v3_N.json` に出力して人間レビュー
- **v3.12 person 品質修正 1-6 は別作業として PHASE_BACKLOG 残置**（混ぜない）

worktree セッション開始手順は `docs/WORKFLOW.md` 参照。

---

## ブロッカー

- なし。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=a79e54a29e51 / C=12×4 / D=55/55（3 WARN）PASS
npm run missing-assets             # 現状 image 441 / audio 108（Phase 5 ⑤ 完了後に減少）
npm run check-sa                   # Sheets API 疎通
npm run check-tts-sa               # Cloud TTS API 疎通
npm run check-ffmpeg               # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key           # AI Studio ListModels（Imagen 4 系）
npm run check-nanobanana-key       # AI Studio ListModels（Nano Banana）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run generate-images -- --prompts <path> [--print-prompts | --sync-only | --dry-run]
                                  [--backend nanobanana|imagen4]  # 既定 nanobanana
                                  [--limit N] [--max-images N] [--force]
                                  [--out <md>]
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs        # 実機 1 枚＝$0.04 (Imagen 4)
node scripts/_nanobanana-smoke.mjs    # 実機 1 枚＝~$0.0387 (Nano Banana)
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
python scripts/build_prompts.py --lesson 1       # worktree で実行（Phase 5 ④ で --catalog 追加予定）
```

人間タスク：**なし**（Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現）。
