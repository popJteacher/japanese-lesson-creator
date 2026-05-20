# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。

**最終更新：** 2026-05-20（Phase 3 ③ 完了・④ active 化）

---

## 現在地

- **Phase 0／1／2：完了。** 詳細は `docs/MIGRATION_PLAN.md` および git 履歴。
- **Phase 3：active。**
  - **①** Cloud TTS SA 鍵・疎通確認：**完了**
  - **②** ローカル TTS クライアント・1 件合成：**完了**
  - **③** バッチ＋月間文字カウンタ＋registry 連携：**完了（2026-05-20）**
    - `scripts/generate-audio-local.mjs` を実装、`npm run generate-audio` 提供
    - 52 件合成（word=9 / sentence=43, 計 753 文字, 全件成功）
    - `data/audio/*.mp3` 出力・`master_audio_registry.json` を local path に更新
    - `data/_meta/tts_usage.json` で月間 800,000 文字上限を監視
    - missing-assets `null_audioUrl`: 32 → 1
- **Phase 4：未着手。**

生存中の GAS トリガー：`generateAudioBatch`（毎日 10:00）— Phase 3 ⑥ で引退。

### 既知の Phase 3 横断課題（④ に影響なし）
- **registry 未登録 120 件**：Vocabulary シートに存在するが
  `master_audio_registry.json` にエントリが無い語（`word_十` / `word_遠い` 等）。
  ③ は registry-as-canon 規律に従い skip。バックフィル方法は ⑥ までに別途決める。
- **`word_新聞` の sync 漏れ**：sheet は `audioStatus='generated'` + Drive URL あり
  なのに registry の `audioUrl` が空。Phase 2 sync-registries の同期漏れ。
  `npm run sync-registries` を一度走らせれば解決するはず（未検証）。

---

## 今やること

**Phase 3 ④ — ffmpeg QC（loudnorm / トリム / フェード）パイプライン組込み。**

完了条件：

1. `scripts/lib/audio-qc.mjs` を新規作成。raw mp3 Buffer を受け取り、
   ffmpeg で以下を順に適用した mp3 Buffer を返す：
   - **loudnorm**：EBU R128 規格で -16 LUFS に正規化（音量を揃える）
   - **silenceremove**：前後の無音をトリム
   - **afade**：先頭 50ms フェードイン・末尾 100ms フェードアウト（ブツ切り防止）
2. ffmpeg の入手・パス解決：`ffmpeg.path` を `.env` で上書き可、未指定なら PATH 解決。
   存在しなければ早期エラー（`npm run check-ffmpeg` 仮）。
3. `scripts/generate-audio-local.mjs` を改修：合成後すぐ QC を適用し、
   QC 通過した mp3 を `data/audio/<id>.mp3` に保存。
4. 既存 52 件を `--force` で再生成し、QC 適用版に置換。
5. validate / missing-assets / 既存スクリプト全部が引き続き通る。

このスライスは **新規獲得**（GAS では ffmpeg 不可で QC できなかった）。
QC スペック検証スクリプトは ⑤ で導入。

---

## ブロッカー

- ffmpeg のローカル install。Windows は scoop/chocolatey/手動。
  人間タスク：着手前に `ffmpeg -version` が PowerShell で通ることを確認。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.3 / B=hash OK / C=件数
npm run missing-assets       # imageUrl/audioUrl null 列挙
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force]
node scripts/_tts-smoke.mjs  # Phase 3 ② スモーク（.tmp_verify/_tts_smoke.mp3）
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
```

Phase 3 ④ で追加予定：

```
npm run check-ffmpeg         # ffmpeg コマンド疎通（仮）
# generate-audio に QC が自動でかかる（フラグ追加なし）
```

人間側（Claude Code 実行不可）：

```
# 残る生存 GAS トリガー（Phase 3 ⑥ で引退対象）
generateAudioBatch        # 毎日 10:00
```
