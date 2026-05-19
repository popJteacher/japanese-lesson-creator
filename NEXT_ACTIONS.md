# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。

**最終更新：** 2026-05-19（Drive→repo 取り込み＝検証済・音声 round-trip 完了・画像 asset coverage は別 OPEN）

---

## 確定（解決済み・短期メモ）

- **v3.2 ガイド検証＝完了。** `prompts/master_prompt_design_guide_v3_2.py` は `apply_v3_2.py` を v3.1 入力に再実行した出力と LF 正規化後 SHA `566b8ad68753…` で完全一致。**正規の監査済み成果物**と決定論的に確定。`progress_handoff_v14_0.md` §6 の `d22730eb47e4` は誤記録。
- **Drive→repo 取り込み機構＝検証済・動作確認済。** 新 SYNC_SETTINGS（IMAGE=`17WnltHEvymkua4hgfak2951f5BgphV9O` / AUDIO=`1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M`）経由で `syncAll` が書き出した Drive 側 registry を repo に取り込む round-trip が成立（commit `9f4ac5b`）。現状は手動取り込み。
- **音声 round-trip＝検証済・完了。** `npm run missing-assets --type=audio` が 77 → 58 missing（-19・新規 fill）を確認。旧 ID `14NL…` / `1ANG…` の破損問題は新 ID 移行で恒久解消。

---

## 現在地（コマンド出力から機械導出）

| ライン | 状態 | 根拠 |
|---|---|---|
| Web ツール（A） | ERROR=0 / WARN=0 | `npm run validate` |
| 画像生成（B） | プロンプトガイド v3.2 hash OK（LF 正規化後）。v3.2 SMOKE 3 語は未実施。**画像 asset coverage は active 103 件中 62 missing のまま**（取り込み機構とは別の OPEN・下記①） | `npm run validate` invariants[B] ／ `npm run missing-assets --type=image` |
| 音声生成（C） | round-trip 完了。active 77 件中 58 missing（-19 進捗）。次の取り込みで更に減る見込み | `npm run missing-assets --type=audio` |
| GAS 正典 | `gas/pipeline.gs`。SYNC_SETTINGS は新 ID へ更新済 | line 3067-3068 |

---

## 今やること（順番通り・1〜3 件）

1. **【OPEN】画像 asset coverage の未充足 62 件＝画像生成バックログ（取り込み機構とは別問題・未解決）。**
   - 内訳：`null_imageUrl_rows=23` ＋ `no_images_array=39`（active 103 件のうち）。
   - 取り込みは動いている（19 件の URL refresh が成立）。**埋まらない理由は生成側＝Sheets で `pending` のまま処理されていない／`failed_final` で停まっている／`vocabType` 未分類 等**。
   - 切り分け（人間側）：Sheets の Vocabulary シート `imageStatus` 列で 62 件の分布を確認（`pending` / `failed_N` / `failed_final` / `skipped_no_prompt` / 空欄）。`failed_final` を `pending` に戻すリセット関数は `gas/pipeline.gs` line 3340 周辺。

2. **【自動化】Drive→repo 取り込みのスクリプト化。**
   - 現状は手動で取り込んだファイルを `data/master_*_registry.json` に上書きしている。
   - `scripts/pull-registries.mjs` を新設し `https://drive.google.com/uc?export=download&id={ID}` で取得 → 上書き → diff 確認の流れを自動化。
   - 認証要否（公開リンクで足りるか／`gcloud` / `service-account` が必要か）は試行で決める。`npm run pull-registries` を `package.json` に登録。

3. **【画像 SMOKE】v3.2 で SMOKE 3 語の S列を再生成（人間 + Claude Code）。**
   - 順序は `archive/handoffs/progress_handoff_v14_0.md` §4。
   - 生成 S列は `data/image_prompts_lessonNN_v3_N.json` に置く（`invariants[C]` が自動検査）。

---

## ブロッカー

- 無し。画像 ①の切り分けは Sheets `imageStatus` 列の目視。②の自動化は Drive 認証方式の決定後に着手。

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
# GAS 自動トリガー（既稼働・新 ID へ反映中）
generateAudioBatch        # 毎日 10:00
syncAll                   # 毎日 23:00 ／ 新 ID で復活

# Drive→repo 取り込み（現状手動・①で実行）
# 新 ID Drive リンクから master_*_registry.json をダウンロード →
# data/ に上書き → git diff で変化確認 → 必要なら commit
```
