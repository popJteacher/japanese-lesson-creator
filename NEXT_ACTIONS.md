# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**Phase 5 ④ A pivot + B partial 統合 merge**：worktree
phase5-example-prompts を main へ merge。worktree A は Q1A/Q2A 保全・Q3B は dead
code 化・**Phase 5 ④' = `/generate-image-prompt` skill 方式へ pivot**。main B は
本セッションで `--classify` 実装 + 9,342 件 typed まで進行・残 8,149 件は RPD リセット
後 resume。両 track は独立並行で進む）

---

## 現在地

- **Phase 0／1／2／3／4：完了** ✅
- **Phase 5 ①／②／③：完了** ✅
- **v4.0 → v4.1 マスタープロンプトガイド：取り込み完了** ✅
  - B hash `891b73f5ae2d`（v4.1 = v4.0 + example_sentence template に FACIAL_FEATURES
    / HEAD_BODY_PROPORTION / FOOTWEAR_RULE inline 追加）
- **Phase 5 ④ worktree A：完了 + 部分 deprecate** ✅⚠️
  - Q1 A（example_sentence inline）/ Q2 A（`scripts/transcribe-lesson-vocab-types.mjs`）
    / preflight ロジック / v4.1 hash：**保全**
  - Q3 B（`build_prompts.py` の全 vocab_type dispatch / render_*）：**dead code 化**
    （④' skill 方式に置換予定・git 履歴として残置）
- **Phase 5 ④ main B：53% 完了** 🆕
  - `--classify` mode 実装済（commit `0830fd1`）
  - catalog に **9,359 件 vocab_type 付与**（lesson_01 17 件 worktree A 由来 +
    9,342 件 Gemini 由来）・残り 8,149 件は **RPD 10K リセット待ち**
  - 信頼度：high 8,539 / medium 809 / low 11 / WARN 336（all classified_as_other）
- **Phase 5 ④' = アーキテクチャ pivot 後の本格実装：未着手** 🆕
- **Phase 5 ⑤／⑥：未着手** — ④（A 完了済）+ ④' + B 全完了後
- **Phase 4 後 backlog**：残置
- **Phase 3 後 backlog**：着手保留

生存中の GAS 自動 trigger：**0 件**。残存 GAS は手動実行用 3 系統のみ。

---

## active（独立並行 2 track）

### Track 1：main session — B 残 8,149 件 resume

**着手タイミング**：Tier 1 RPD 10K リセット後（PT 0:00 = JST 17:00 リセット）。

**コマンド**：
```
node scripts/classify-and-translate.mjs --classify
# typed 済 entry は自動 skip。残り 8,149 件のみ処理。
```

所要見込み：~30 分・~$1.50（implicit cache 発火次第減少）。
本日 9,775 件消費済のため、リセット日翌日でも今日の続きを足すと再度 RPD 抵触可能性。
`--concurrency 4` で慎重に進める / 2 日跨ぎ前提とする / Flash-Lite 切替検討も可。

**完了条件**：
- catalog 全 17,508 件に vocab_type 付与
- WARN 件数を `data/_meta/vocab_type_warnings.json` に出力済
- `npm run validate` PASS

**専用カテゴリ判断（動物・自然物・国名 等）**：全分類完了後に別セッションで議論
（user 確認済 2026-05-22）。

### Track 2：新規 fresh worktree session — Phase 5 ④' skill 実装

**着手タイミング**：いつでも可（Track 1 と独立）。

**起動手順**：
```
cd c:/Users/kohn0/Desktop/japanese-lesson-creator-main
git worktree add .claude/worktrees/skill-implementation -b phase5-skill-implementation main
cd .claude/worktrees/skill-implementation
claude
```

**スコープ**（`docs/MIGRATION_PLAN.md` § Phase 5 ④' を SSOT として参照）：
1. ガイドを **6 部構成**に reorganize（user 提案 2026-05-22）：
   - PART 1: Universal Rules（全 vocab_type 共通）— 既存 PART 1.1〜1.10 +
     **NATIONAL_SYMBOL_ISOLATION_RULE 新規追加**（旧 PERSON_NATIONALITY_HINTS の
     「服に国旗色を再現しない」原則を universal 化）
   - PART 2: STYLE_BIBLE
   - PART 3: **vocab_type 別ルール（新セクション・user 提案の核心）** — 3.person /
     3.building / 3.object_concrete / 3.action_verb / 3.adjective /
     3.abstract_concept / 3.demonstrative_kosoado / 3.spatial_relation /
     3.example_sentence の独立サブセクション。aspect ratio / camera / pose /
     strategy 選択基準等を PROMPT_TEMPLATES の自然文から抽出して整理
   - PART 4: PROMPT_TEMPLATES（骨格・placeholder のみ・rule 詳細は PART 1+2+3 参照）
   - PART 5: **Vocabulary Reference Appendix（新セクション）** —
     PERSON_NATIONALITY_HINTS / PERSON_ROLE_LOOKUP / ROLE_BASED_GENERIC_PROFILES /
     BUILDING_CUES / OBJECT_SIGNATURES / ABSTRACT_METAPHORS / PHENOTYPE_PROFILES /
     COUNTRY_TO_PROFILE / ROLE_PHENOTYPE_PALETTE 等を Python 辞書から
     Markdown 風 reference へ転記（中身保全）
   - PART 6: Output Instructions（LLM 用出力指示 + preflight 制約）
2. `.claude/skills/generate-image-prompt.md` スキル定義新規作成
   - 入力：words / mode（daily-pull / explicit / chain）/ limit
   - 手順：ガイド読込 → vocab_type 解決 → template 選択 → 普遍ルール適用 →
     Reference Appendix 参照 → preflight 検証 → 違反時自己修正 → JSON 追記
3. preflight 関数群を `scripts/lib/prompt-preflight.py` に独立化（skill から bash 経由）
4. chain mode：skill 内で `npm run generate-images` を bash 起動
5. lesson_01 で skill invoke → 既存決定論版（`image_prompts_lesson01_v4_0.json`）と
   品質比較

**完了条件**：
- `.claude/skills/generate-image-prompt.md` invoke 可能
- ガイド PART 1-6 構造で reorganize 済・B hash 更新
- lesson_01 17 件 + 例文の prompt を skill 経由で生成し preflight 全 PASS
- `npm run validate` invariants A/B/C PASS

---

## 両 track 完了後

両 track 完了後、Phase 5 ④ 全体完了。

```
npm run validate                          # B hash 新ガイド版 PASS / C PASS
node scripts/classify-and-translate.mjs --classify --dry-run  # 残 0 件確認
# skill 経由で lesson_01 / lesson_02 prompt 生成 PASS
```

その後：
- **Phase 5 ⑤ 着手可**：日次 20 件運用開始（`/schedule` で skill 自動起動）+
  lesson_02 全件生成
- **Phase 5 ⑥ 着手可**：GAS 入力系 3 系統退役

---

## ブロッカー

- Track 1（main B resume）：**Tier 1 RPD 10K リセット待ち**（PT 0:00 = JST 17:00）
- Track 2（④' skill）：blocker なし（user が新規 worktree session 起動するだけ）
- Phase 5 ⑤：Track 1 + Track 2 両方完了に blocked
- Phase 5 ⑥：Phase 5 ⑤ 完了に blocked

---

## 将来規律（user 確認済 2026-05-22）

- **新規 word list からの語彙追加時の vocab_type 分類**：将来別書籍 / 別ソースから
  catalog に語彙追加するときは Gemini API ではなく `/classify-vocab-type` skill
  方式に切替（今回の 17,491 件一括は bounded one-shot として API 継続）。
  詳細は memory `feedback-skill-vs-api-for-classification`。

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=891b73f5ae2d(v4.1) / C / D PASS
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
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]         # 既存 Gemma lesson-driven
node scripts/classify-and-translate.mjs --classify [--smoke|--limit N|--force|--concurrency N|--dry-run]  # Phase 5 ④ B catalog-driven Gemini 2.5 Flash
node scripts/build-catalog.mjs [--dry-run | --verbose]
node scripts/transcribe-lesson-vocab-types.mjs [--dry-run | --verbose]   # worktree A 由来
npm run import-lesson -- --lesson NN [--dry-run | --verbose]

# ↓ 以下は ④' pivot 後 deprecated（skill 方式に置換予定・dead code）
python scripts/build_prompts.py --lesson NN          # 決定論版 dispatch（dead code 化予定）
python scripts/build_prompts.py --catalog            # 決定論版 catalog mode（dead code 化予定）

# ↓ Phase 5 ④' 着手後の新コマンド（未実装）
# /generate-image-prompt mode=daily-pull limit=20    # Claude Code スキル invoke
# /generate-image-prompt words=医者,会社員 chain=true  # chain mode
# /schedule で daily cron セットアップ
```

参考（再実行不要）：
- 決定論版 lesson_01 出力：`data/image_prompts_lesson01_v4_0.json`（32 件・skill 品質比較用）
- v4.0 アーカイブ：`archive/prompts/master_prompt_design_guide_v3_12.py`
- 旧 worktree path：`c:/Users/kohn0/Desktop/japanese-lesson-creator-main/.claude/worktrees/example-prompts`（役目終了・新規 ④' は別 worktree）
- Phase 5 ④ pivot 議論：本セッション 2026-05-22 / worktree memory `project_phase5_pivot_to_claude_code_skill.md`

人間タスク：
- 新規 worktree session を立てて Phase 5 ④' に着手（任意のタイミング）
- 明日 RPD リセット後に main session で B resume コマンド実行
- Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現
