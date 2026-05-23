# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-23（**Track 1 + Track 2 両完了 → main へ merge 済 + 運用方針確定**：
Track 1 (catalog 全 17,508 件 typed) と Track 2 (Phase 5 ④' skill 実装 = 6-PART
ガイド + `.claude/skills/generate-image-prompt.md` + preflight 切出) を main へ
3-way merge 完了。validate PASS（B `891b73f5ae2d` + B' `1ca2f57ad927`）。運用方針
**Claude Code 上で手動 invoke を基本**と確定（schtasks 自動化は将来オプションで
保留）。残るは Phase 5 ⑤/⑥ と派生の専用カテゴリ判断）

---

## 現在地

- **Phase 0／1／2／3／4：完了** ✅
- **Phase 5 ①／②／③：完了** ✅
- **v4.0 → v4.1 マスタープロンプトガイド (旧 .py 形式)：保全** ✅
  - B hash `891b73f5ae2d`（`build_prompts.py` が dead code 化されるまで継続）
- **Phase 5 ④ worktree A：完了 + 部分 deprecate** ✅⚠️
  - Q1 A（example_sentence inline）/ Q2 A（`scripts/transcribe-lesson-vocab-types.mjs`）
    / preflight ロジック / v4.1 hash：**保全**
  - Q3 B（`build_prompts.py` の全 vocab_type dispatch / render_*）：**dead code 化**
- **Phase 5 ④ main B：完了** ✅
  - catalog 全 **17,508 件 typed**（17,491 件 B-scope + 17 件 worktree A 由来）
  - vocab_type 分布：abstract_concept 7,211 / concrete_object 2,914 / action_verb 2,406
    / adjective 1,215 / person 779 / adverb 754 / other 576 / building 450 / time 354
    / spatial_relation 207 / counter 125 / weather 121 / family 102 / 他 < 100 各種
  - WARN 576 件（all classified_as_other）→ `data/_meta/vocab_type_warnings.json`
    confidence 内訳 high 279 / medium 270 / low 27
  - 累積コスト：~$3.30
- **Phase 5 ④' = skill 実装：完了** ✅
  - 新 SSOT：`prompts/guide/part1_universal_rules.md` 〜 `part6_output_instructions.md`
    （6 ファイル・計 3,591 行）
  - **manifest hash `1ca2f57ad927`**（invariants B' で機械検証）
  - skill 定義：`.claude/skills/generate-image-prompt.md`
    （4 mode：daily-pull / lesson / explicit / chain）
  - preflight 切出：`scripts/lib/prompt_preflight.py`（CLI + Python import 両対応）
  - `scripts/build_prompts.py`：preflight を新 SSOT から import に書換
    （dead code 化中も同じ規律）
  - lesson_01 smoke：医者 prompt 1 件 → preflight PASS / `data/image_prompts_skill.json` 1 entry
  - 日次起動 wrapper：`scripts/schedule-daily-pull.bat`（人間が schtasks 登録）
- **Phase 5 ⑤／⑥：未着手** — 人間タスク #1 (schtasks) と専用カテゴリ判断完了後
- **Phase 4 後 backlog**：残置
- **Phase 3 後 backlog**：着手保留

生存中の GAS 自動 trigger：**0 件**。残存 GAS は手動実行用 3 系統のみ。

---

## active

### Phase 5 運用方針：**Claude Code 上で手動 invoke を基本**とする（user 確定 2026-05-23）

日次 prompt 生成は **interactive Claude Code session 内での手動 slash command 起動**
を基本ワークフローとする。schtasks による自動化は **当面導入しない**。

```
# 通常の運用（必要なときに実行）
/generate-image-prompt                              # daily-pull mode 20 件（デフォルト）
/generate-image-prompt limit=50                     # 多めに pull
/generate-image-prompt mode=lesson --lesson 02      # 課マスター作成時
/generate-image-prompt mode=explicit --words 医者,会社員
/generate-image-prompt chain=true                   # prompt 生成 + 画像生成まで一気通貫
```

**なぜ手動か**：user が「ためてある分を必要なときに pull したい」ため。日次強制起動
より、`data/image_prompts_skill.json` の溜まり具合を見て user が判断する方式を選択。

**将来的な自動化の余地**：`scripts/schedule-daily-pull.bat` と schtasks 手順は
コードとして残置している（下記 deprecated コマンド参照）。user の運用が変わって
「やっぱり毎朝 9:00 自動 pull したい」となったら、bat の `claude -p` 自動 discover
挙動を初回手動テストして OK なら schtasks 登録できる状態は保たれている。
復活手順は本ファイル末尾「将来の自動化オプション」セクション参照。

### 派生タスク（任意のタイミング・別セッション）：専用カテゴリ判断

Track 1 完了済 → 着手可能。`other` 576 件の中身（特に high confidence 279 件と
medium 270 件）を確認し、専用 vocab_type 新設 vs `other` 維持の判断を user と議論。
別セッションで議論する（user 確認済 2026-05-22）。

```
node -e "const d=require('./data/_meta/vocab_type_warnings.json').warnings||require('./data/_meta/vocab_type_warnings.json');console.log(d.filter(w=>w.confidence==='high').slice(0,30).map(w=>w.word+' ('+w.reading+')').join('\n'))"
# 上位 30 件目視 → カテゴリ提案
```

---

## 次のフェーズ

- **Phase 5 ⑤ 着手可**：lesson_02 例文 5 件 smoke 生成 + import-lesson.mjs に skill 接続
- **Phase 5 ⑥ 着手可**：GAS 入力系 3 系統退役

```
npm run validate                          # B + B' + C + D PASS
# skill 経由で lesson_02 例文生成 → preflight PASS
```

---

## ブロッカー

- 専用カテゴリ判断：blocker なし（user 判断のみ）
- Phase 5 ⑤：blocker なし（skill 手動 invoke で着手可）
- Phase 5 ⑥：Phase 5 ⑤ 完了に blocked

---

## 将来規律（user 確認済）

- **新規 word list からの語彙追加時の vocab_type 分類**：将来別書籍 / 別ソースから
  catalog に語彙追加するときは Gemini API ではなく `/classify-vocab-type` skill
  方式に切替（今回の 17,491 件一括は bounded one-shot として API 完了済）。
  詳細は memory `feedback-skill-vs-api-for-classification`。
- **長時間 classify ジョブ着手前に AI Studio 残高確認**：2026-05-23 セッションで
  prepayment credits 枯渇により中断 → top up が必要だった。今後の bounded job 前は
  https://ai.studio/projects で残高を事前確認すること。
  memory `feedback-check-ai-studio-credits`。
- **worktree 起動時に `git merge --ff-only main` 必須**：本セッションの merge で
  ff-NG に陥った原因は worktree が main の Track 1 完了 commit を baseline に取り込
  まなかったこと。WORKFLOW.md L226-228 を毎回守る（worktree 開始の 3 ステップ目）。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=891b73f5ae2d / B'=1ca2f57ad927 / C / D PASS
npm run missing-assets             # 現状 image 441 / audio 108
npm run check-sa                   # Sheets API 疎通
npm run check-tts-sa               # Cloud TTS API 疎通
npm run check-ffmpeg               # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key           # AI Studio ListModels（Imagen 4 系）
npm run check-nanobanana-key       # AI Studio ListModels（Nano Banana）
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run generate-images -- --prompts <path> [--print-prompts | --sync-only | --dry-run]
                                  [--backend nanobanana|imagen4]
                                  [--limit N] [--max-images N] [--force]
                                  [--out <md>]
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs        # 実機 1 枚＝$0.04 (Imagen 4)
node scripts/_nanobanana-smoke.mjs    # 実機 1 枚＝~$0.0387 (Nano Banana)
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
node scripts/classify-and-translate.mjs --classify [--smoke|--limit N|--force|--concurrency N|--dry-run]
node scripts/build-catalog.mjs [--dry-run | --verbose]
node scripts/transcribe-lesson-vocab-types.mjs [--dry-run | --verbose]
npm run import-lesson -- --lesson NN [--dry-run | --verbose]
python scripts/lib/prompt_preflight.py < <json>   # skill から呼ばれる preflight CLI

# skill invoke（claude session 内）= **これが基本ワークフロー**
# /generate-image-prompt                          # daily-pull mode 20 件（デフォルト）
# /generate-image-prompt mode=lesson --lesson 01
# /generate-image-prompt mode=explicit --words 医者,会社員
# /generate-image-prompt chain=true               # prompt 生成 + 画像生成まで一気通貫

# ↓ 以下は ④' pivot 後 deprecated（skill 方式に置換済・dead code 維持）
python scripts/build_prompts.py --lesson NN          # 旧決定論版（dead code）
python scripts/build_prompts.py --catalog            # 旧決定論版（dead code）
```

---

## 将来の自動化オプション（現時点では未採用）

user 確定方針：**当面は手動 invoke**。下記は将来「やっぱり自動化したい」となった
ときの復活手順として残置。コード・bat は merge 済（本セッション）。

```
# (1) 初回手動テスト（claude -p の skill 自動 discover が動くか確認）
scripts\schedule-daily-pull.bat
type data\_meta\skill-daily-pull-YYYYMMDD.log         # 結果ログ確認

# (2) 動いたら schtasks 登録
schtasks /create /tn "ClaudeDailyPromptPull" ^
  /tr "\"c:\Users\kohn0\Desktop\japanese-lesson-creator-main\scripts\schedule-daily-pull.bat\"" ^
  /sc daily /st 09:00

# (3) 状態確認 / 解除
schtasks /query /tn "ClaudeDailyPromptPull" /v /fo LIST
schtasks /delete /tn "ClaudeDailyPromptPull" /f
```

注：`claude -p "/generate-image-prompt ..."` の skill 自動 discover 挙動は
**未検証**（bat L30 に明記）。動かなかった場合は bat L34-35 の fallback 行
（`claude -p "Read .claude/skills/generate-image-prompt.md ..."` 形式）に切替。

参考（再実行不要）：
- 決定論版 lesson_01 出力：`data/image_prompts_lesson01_v4_0.json`（32 件・skill 品質比較用）
- skill 出力 sample：`data/image_prompts_skill.json`（医者 1 件 smoke）
- v4.0 アーカイブ：`archive/prompts/master_prompt_design_guide_v3_12.py`
- 旧 worktree path（役目終了）：`.claude/worktrees/example-prompts`, `.claude/worktrees/skill-implementation`

人間タスク：
- skill の手動 invoke（必要なときに `/generate-image-prompt` 系を実行）
- 専用カテゴリ判断（任意のタイミング・別セッション）
- Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現
