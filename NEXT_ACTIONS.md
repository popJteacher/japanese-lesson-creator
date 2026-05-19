# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。

**最終更新：** 2026-05-19（`_STEP3_ARCHIVE.md` 完了直後・`docs/REFERENCE.md` を実 GAS から整備済／`prompts/master_prompt_design_guide_v3_2.py` は `apply_v3_2.py` 再実行で正規の監査済み成果物と決定論的に確定済（改行正規化後 SHA `566b8ad687532f255a09176a5f1b3d115ef6b37994348bbd7a33f2113a653581`・handoff §6 の `d22730eb47e4` は誤記録））

---

## 現在地（コマンド出力から機械導出）

| ライン | 状態 | 根拠 |
|---|---|---|
| Web ツール（A） | コード一式・正典 `data/lesson_NN.json` は ERROR=0 / WARN=0 で合格 | `npm run validate` |
| 画像生成（B） | プロンプトガイド v3.2 確定（hash `5d7e52f00e3f`）。**画像レジストリ active 103 件中 62 件 missing**。v3.2 S列再生成・SMOKE 3 語は未実施 | `npm run missing-assets --type=image` ＋ invariants[B] OK |
| 音声生成（C） | Phase 1 修正（`buildCloudTtsWavBlob_()`）は GAS 正典に取り込み済。**だが audioUrl は 77/77 件全て null**（生成→Drive→syncAll パイプラインのどこかで止まっている。原因未特定） | `npm run missing-assets --type=audio` |
| GAS 正典 | `gas/pipeline.gs`（hash `a33271d4368e`）。ヘッダー v7.1 / generateImages v5.3 / generateAudio コメント v2.0（実装は Cloud TTS Neural2）。**ドリフトは仕様**で実害なし | invariants[A] |
| ルート整理 | 旧 handoff・旧 monolith・旧プロンプトガイド・root 重複 → `archive/`（4 サブディレクトリ計 ~130 件）に集約。索引は `handoff_archive.md` | `ls archive/` |

---

## 今やること（順番通り・1〜3 件）

1. **【音声未解決 ②】audioUrl が 1 件も埋まっていない原因を特定する（人間側＝Claude Code は live シートを見られない）。**
   - **`GCP_TTS_API_KEY` 名ズレ仮説は棄却済**（live プロジェクトで property 名が `GCP_TTS_API_KEY` であることを確認済）。原因は別。
   - チェックリスト（人間が GAS / Sheets で確認）：
     - **a)** `generateAudioBatch` を手動実行し、Logger 出力を読む（`===== generateAudio.gs v2.0 開始 =====` 以降のエラー行）。
     - **b)** Sheets の `Log` シートで audio 行の `error` 列を見る（バッチ実行後にレコードが書かれているか）。
     - **c)** Sheets の `Vocabulary` / `Examples` シートで `audioStatus` 列（W 列周辺）を見る。`pending` / `success` / `failed_*` のどれが立っているか。
     - **d)** `syncAll` を手動実行し、`AUDIO_REGISTRY_ID = 1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0` の Drive ファイルに反映されるか確認。
     - **e)** `AUDIO_FOLDER_ID` ScriptProperty に Drive の音声フォルダ ID が設定されているか確認（未設定だと書き出しが落ちる）。
   - 上記の出力を次セッションに貼り付け → Claude Code が原因切り分けを進める。**false-close 禁止**（直っていないのに「直った」と書かない）。

2. **【画像 SMOKE】v3.2 で SMOKE 3 語の S列を再生成（人間 + Claude Code 協働）。**
   - 順序は `archive/handoffs/progress_handoff_v14_0.md` §4 ステップ ①〜④。
   - 生成した S列 JSON は `data/image_prompts_lessonNN_v3_N.json` に置く（`invariants[C]` が自動検査する命名規則）。
   - SMOKE 3 語の合格基準：人物=全身／銀行=スカイブルー／物体=レンズ崩れなし。

3. **【整備】`scripts/build-inventory.mjs` を作成し `PIPELINE_INVENTORY.md` を自動再生成可能にする。**
   - `ls archive/` カウント・SHA256・レジストリ件数を機械収集。
   - `npm run inventory` で再現できるようにする（`PIPELINE_INVENTORY.md` の手書き本文を機械生成版に置き換え）。

---

## ブロッカー

- 音声未解決 ② — Claude Code は live GAS / Sheets を見られないため、原因特定は人間側のログ確認待ち。

---

## 直近の確定コマンド

```
npm run validate           # lesson_NN.json スキーマ + invariants A/B/C を一括実行
npm run missing-assets     # imageUrl/audioUrl null エントリの列挙
node scripts/invariants.mjs                       # invariants 単独実行（同じ結果）
node scripts/missing-assets.mjs --type=image
node scripts/missing-assets.mjs --type=audio
node scripts/missing-assets.mjs --json
```

人間側（Claude Code 実行不可）：

```
# GAS 手動実行（音声未解決②の切り分け）
generateAudioBatch()      # 手動・Logger 出力を読む
syncAll()                 # AUDIO_REGISTRY 反映

# GAS 自動トリガー（既稼働）
generateAudioBatch        # 毎日 10:00
syncAll                   # 毎日 23:00

# 画像 SMOKE（v3.2 S列再生成後）
testSingleImage()
```
