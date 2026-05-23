# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-23（**Phase 5 ⑤ 後半完了 + 再生成 pipeline 起動**：
import-lesson.mjs に examples harvest 追加・lesson_01/02 dry-run で
`total delta: 0`（べき等性確認）。lesson_01 例文 15 + 主要単語 12 件を `status: rejected`
に下げ、user 再生成プロセス待ち。次は user 手作業フェーズ）

---

## 現在地

- **Phase 0 〜 5 ④' 完了** ✅（詳細は git log）
- **Phase 5 ⑤ 前半完了** ✅：lesson_02 例文 5 件 smoke / `image_prompts_skill.json` 6 entries
- **`/export-skill-prompts` skill 実装完了** ✅
- **Phase 5 ⑤ 後半完了** ✅ 🆕 — `scripts/import-lesson.mjs` 拡張
  - `harvestExamples()` / `updateImageRegistryForExamples()` / `updateAudioRegistryForExamples()` 追加
  - 既存 entry は status/images 不変、新規 entry は `type: 'example_images'` の pending stub
  - lesson_01：vocab 17 / examples 15 → `total delta: 0`（unchanged）
  - lesson_02：vocab 18 / examples 28 → `total delta: 0`（unchanged）
- **再生成 pipeline 起動** ✅ 🆕 — user 依頼の 27 件を `status: rejected` 化
  - 単語 12 件：vocab_男の人 / vocab_女の人 / vocab_外国人 / vocab_会社 /
    word_学校 / word_銀行 / word_大学 / word_デパート / word_病院 /
    word_赤い / word_明るい / word_秋
  - 例文 15 件：ex_L01_001 〜 ex_L01_015
  - 全 entry の `images[].regenerate = true` も同時にセット
- **マニュアル 2 本整備** ✅ 🆕 — 初心者向け
  - `docs/MANUAL_image_generation.md`：手動画像生成 5 段階フロー + コマンド辞書
  - `docs/MANUAL_word_example_state.md`：GAS 時代との対比 + データフロー + status の意味 + クエリ集
- **Phase 5 ⑥ 未着手**：GAS 入力系 3 系統退役

生存中の GAS 自動 trigger：**0 件**。

### registry スナップショット（2026-05-23）

| status | 件数 |
|---|---|
| pending | 440 |
| generated | 24（lesson_01 例文・lesson_01 単語の一部・char_）|
| approved | 0（user 確認待ちにより全 rejected/pending 化）|
| rejected | 27（再生成対象）|
| outdated | 6（ex_L02_002/005/006/011/012/013）|

---

## active

### A. 再生成 27 件の画像を user 手作業で作り直す

**目的**：user 依頼に基づき、lesson_01 例文 15 + 単語 12 件の画像を新規生成する。

**手順**（[docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) 参照）：

```
# (1) プロンプト生成（Claude Code 内）
/generate-image-prompt mode=lesson --lesson 01           # 例文 + 単語の lesson_01 分
/generate-image-prompt mode=explicit --words 男の人,女の人,外国人,会社   # lesson_NN 未紐付の先行画像分

# (2) .txt 展開
npm run export-skill-prompts -- --lesson 01
npm run export-skill-prompts -- --ids vocab_男の人,vocab_女の人,vocab_外国人,vocab_会社

# (3) 画像生成（user 手作業）
# - tmp/skill_prompts/*.txt の本文を Imagen / Nanobanana / Gemini chat に貼る
# - DL した PNG を data/images/{imageId}.png として上書き保存
#   （注意：古い PNG はそのまま上書きしてよい。--sync-only で status: rejected → generated に上がる）

# (4) registry 取り込み
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only
```

**注意**：vocab_男の人 などは lesson_01 にも lesson_02 にも未紐付（catalog 上の先行画像）。
mode=lesson では拾えないため、mode=explicit で個別指定。

### B. Phase 5 ⑥ 着手可：GAS 入力系 3 系統退役

- 残存 GAS：`extractFromGoiList` / `importFromLessonJson` / `seedLesson01` の 3 系統
- ローカル後継：それぞれ `scripts/build-catalog.mjs` / `scripts/import-lesson.mjs` / 同
- 退役条件：A の再生成が完了し、lesson_01 が「Claude Code 完結ルート」で表示確認できること
- blocked by：A 完了

### C. 派生タスク（任意のタイミング・別セッション）：専用カテゴリ判断

Track 1 完了済。`other` 576 件の中身（high 279 / medium 270 / low 27）を確認し、
専用 vocab_type 新設 vs `other` 維持を user と議論。別セッション推奨。

```
node -e "const d=require('./data/_meta/vocab_type_warnings.json').warnings||require('./data/_meta/vocab_type_warnings.json');console.log(d.filter(w=>w.confidence==='high').slice(0,30).map(w=>w.word+' ('+w.reading+')').join('\n'))"
```

---

## ブロッカー

- A：blocker なし（user 手作業）
- B：A 完了に blocked
- C：blocker なし（user 判断のみ）

---

## 将来規律（user 確認済）

- **新規 word list からの語彙追加時の vocab_type 分類**：Gemini API ではなく
  `/classify-vocab-type` skill 方式に切替（メモリ `feedback-skill-vs-api-for-classification`）
- **長時間 classify ジョブ着手前に AI Studio 残高確認**（メモリ `feedback-check-ai-studio-credits`）
- **worktree 起動時に `git merge --ff-only main` 必須**（[WORKFLOW.md L226-228](docs/WORKFLOW.md)）
- **skill 起動は手動 invoke を基本**とする（schtasks 自動化は将来オプション・bat は残置）

---

## 直近の確定コマンド

```
# 検証
npm run validate                   # invariants A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D PASS
npm run missing-assets             # image 441 / audio 108

# 課マスター → registry 配線（vocab + examples）
npm run import-lesson -- --lesson NN [--dry-run | --verbose]

# プロンプト生成（Claude Code session 内・手動 invoke）
/generate-image-prompt                              # daily-pull mode 20 件
/generate-image-prompt mode=lesson --lesson 01      # 課単位
/generate-image-prompt mode=explicit --words 医者,会社員
/generate-image-prompt chain=true                   # 生成まで一気通貫

# .txt 展開（手動投入用）
npm run export-skill-prompts                        # 全件
npm run export-skill-prompts -- --lesson 01         # 課単位
npm run export-skill-prompts -- --ids vocab_男の人
npm run export-skill-prompts -- --force             # 上書き

# 画像 registry 取り込み
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only

# 状態確認クエリ（コピペ用）
node -e "const r=require('./data/master_image_registry.json').entries; const c={}; for(const v of Object.values(r)){c[v.status||'(none)']=(c[v.status||'(none)']||0)+1;} console.log(c);"
node -e "const r=require('./data/master_image_registry.json').entries; const j=Object.entries(r).filter(([k,v])=>v.status==='rejected'); console.log('rejected:',j.length); j.forEach(([k])=>console.log(' ',k));"
```

---

## 関連ドキュメント

- [docs/MANUAL_image_generation.md](docs/MANUAL_image_generation.md) — 手動画像生成の段取り（5 段階）
- [docs/MANUAL_word_example_state.md](docs/MANUAL_word_example_state.md) — どこに何があるか / status の見方 / クエリ集
- [docs/REFERENCE.md](docs/REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — main / worktree の使い分け
- [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
