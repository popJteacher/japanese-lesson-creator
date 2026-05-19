# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。

**最終更新：** 2026-05-19（SYNC_SETTINGS 新 ID 反映・invariants B を LF 正規化に修正）

---

## 確定（解決済み・短期メモ）

- **v3.2 ガイド検証＝完了。** `prompts/master_prompt_design_guide_v3_2.py` は `apply_v3_2.py` を v3.1 入力に再実行した出力と LF 正規化後 SHA `566b8ad68753…` で完全一致。**正規の監査済み成果物**と決定論的に確定。`progress_handoff_v14_0.md` §6 の `d22730eb47e4` は誤記録。
- **音声 0 件の主因＝解消。** 旧 IMAGE_REGISTRY_ID `14NL…` / 旧 AUDIO_REGISTRY_ID `1ANG…` は破損した Drive ファイル。2026-05-19 に新 ID（IMAGE=`17WnltHEvymkua4hgfak2951f5BgphV9O` / AUDIO=`1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M`）へ移行し `syncAll` が復活した。round-trip 確認は Drive→repo 取り込み待ち。
- **未文書化ギャップを発見。** **Drive 上のレジストリ JSON → repo `data/master_*_registry.json` への取り込み手順が未文書化・現状手動**。`syncAll` は Drive 側を更新するだけで repo は触らない。将来スクリプト化する。

---

## 現在地（コマンド出力から機械導出）

| ライン | 状態 | 根拠 |
|---|---|---|
| Web ツール（A） | ERROR=0 / WARN=0 | `npm run validate` |
| 画像生成（B） | プロンプトガイド v3.2 hash OK（LF 正規化後）。v3.2 SMOKE 3 語は未実施 | `npm run validate` invariants[B] |
| 音声生成（C） | GAS 側 syncAll は新 ID で動作中。repo の `data/master_audio_registry.json` は 77/77 件 null のまま（Drive→repo 取り込み未実行） | `npm run missing-assets --type=audio` |
| GAS 正典 | `gas/pipeline.gs`。SYNC_SETTINGS は新 ID へ更新済 | line 3067-3068 |

---

## 今やること（順番通り・1〜3 件）

1. **【Drive→repo 取り込み】新 ID の Drive 上 registry JSON を repo に取り込む（手動・1 回）。**
   - 取得元：Drive ファイル ID `17WnltHEvymkua4hgfak2951f5BgphV9O`（image）/ `1y0-mzxQGfZVHyj6tT1ttXzt0knlueb3M`（audio）。
   - 取得後、`data/master_image_registry.json` / `data/master_audio_registry.json` を上書き。
   - 検証：`npm run missing-assets` で audio missing が 0 に近づくこと（音声バッチ進捗を反映）／image missing が減ること。

2. **【自動化】Drive→repo 取り込みのスクリプト化。**
   - `scripts/pull-registries.mjs` を新設。Drive ファイルを `https://drive.google.com/uc?export=download&id={ID}` で取得し `data/master_*_registry.json` に書き込む。
   - 認証無しで読める設定（リンク公開）か、`gcloud` / `service-account` が必要かは試行で決める。
   - `npm run pull-registries` として `package.json` に登録。

3. **【画像 SMOKE】v3.2 で SMOKE 3 語の S列を再生成（人間 + Claude Code）。**
   - 順序は `archive/handoffs/progress_handoff_v14_0.md` §4。
   - 生成 S列は `data/image_prompts_lessonNN_v3_N.json` に置く（`invariants[C]` が自動検査）。

---

## ブロッカー

- 無し。手動取り込みは Drive リンクが公開・ダウンロード可能であれば即可。スクリプト化は Drive 認証方式の決定後に着手。

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
