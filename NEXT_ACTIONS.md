# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-22（**Phase 5 ④ アーキテクチャ pivot**：build_prompts.py
決定論辞書方式 → **Claude Code スキル `/generate-image-prompt` 方式**へ大転換。
理由：Goi_List 17,508 件への自動展開には決定論 + 手書き辞書では原理的に到達
不可能。本来の設計意図は「ガイドの普遍ルールに従って LLM が prompt を書く」だった
が、v3.x → v4.0 移行時に「決定論辞書」化されていた誤読を訂正。Claude API も
検討したが user 指示で **Claude Code スキル方式に確定**（API 課金 0・サブスク内）。

---

## 現在地

- **Phase 0／1／2／3／4：完了** ✅
- **Phase 5 ①／②／③：完了** ✅
- **v4.0 マスタープロンプトガイド：実装・取り込み完了** ✅
  - 普遍ルール（PART 1.1〜1.10） / 全国 modern wear + 国旗両手持ち / STYLE_BIBLE 完成
- **Phase 5 ④ worktree A：部分完了 ✅ + 部分 deprecate** 🆕
  - **Q1 A：example_sentence template に v4.0 universal rules を inline 追加 → 完了・保全** ✅
  - **Q2 A：scripts/transcribe-lesson-vocab-types.mjs 新規 + lesson_01 17 件転写 → 完了・保全** ✅
  - **Q3 B：build_prompts.py を全 vocab_type + 例文に拡張 → 完了したが deprecate** ⚠️
    （Python dispatch / render_X 関数群は skill 方式への移行で dead code 化。
     ただし v4.1 hash・preflight ロジック・JSON 出力形式・transcribe スクリプトは生存）
- **Phase 5 ④' = アーキテクチャ pivot 後の本格実装：着手待ち** 🆕
- **Phase 5 ⑤／⑥：未着手** — ④' 完了後
- **Phase 4 後 backlog**：残置
- **Phase 3 後 backlog**：着手保留

生存中の GAS 自動 trigger：**0 件**。残存 GAS は手動実行用 3 系統のみ。

---

## active：次セッション（新規 worktree）で Phase 5 ④' 着手

### スコープ（`docs/MIGRATION_PLAN.md` § Phase 5 ④' 改訂版を SSOT として参照）

1. **ガイド reorganize**：`prompts/master_prompt_design_guide_v4_X.py` を以下 5 部構成に再編
   - PART 1: Universal Rules（不変規律・既存 PART 1.1〜1.10 をそのまま）
   - PART 2: STYLE_BIBLE
   - PART 3: PROMPT_TEMPLATES（既存 10 種・骨格）
   - PART 4: **Vocabulary Reference Appendix（新セクション）** ← 既存の
     PERSON_NATIONALITY_HINTS / PERSON_ROLE_LOOKUP / ROLE_BASED_GENERIC_PROFILES /
     BUILDING_CUES / OBJECT_SIGNATURES / ABSTRACT_METAPHORS / PHENOTYPE_PROFILES /
     COUNTRY_TO_PROFILE / ROLE_PHENOTYPE_PALETTE 等を **Python 辞書から Markdown 風
     reference として転記**。中身（実機検証で得た知識）は完全保全
   - PART 5: Output Instructions（LLM への出力指示・preflight 制約等）

2. **Claude Code スキル定義**：`.claude/skills/generate-image-prompt.md` 新規作成
   - 入力：words（単数 or 複数）/ mode（daily-pull / explicit / chain）/ limit
   - 手順：ガイド読込 → vocab_type 解決 → template 選択 → 普遍ルール適用 →
     Reference Appendix 参照（あれば）→ プロンプト英文生成 → preflight 検証 →
     違反あれば自己修正 → JSON 追記
   - 出力：`data/image_prompts_daily_YYYY-MM-DD.json` または lesson 指定なら
     `data/image_prompts_lessonNN_v4_X.json`

3. **preflight の独立化**：`scripts/build_prompts.py` から preflight 関数群を
   `scripts/lib/prompt-preflight.py`（または .mjs）に切り出し、スキルから bash で
   呼び出せるようにする

4. **chain mode**：スキル内で「prompt 生成完了後 → `npm run generate-images
   -- --prompts <tmp_json> --backend nanobanana` を bash で起動」を実装

5. **lesson_01 検証**：skill を手動 invoke して lesson_01 全 17 件 + 例文 15 件の
   prompt を生成し、現在の決定論版出力（`data/image_prompts_lesson01_v4_0.json`）と
   品質比較

### 完了条件
- `.claude/skills/generate-image-prompt.md` が存在し invoke 可能
- ガイドが PART 1-5 構造に reorganize 済（中身保全・hash 更新）
- lesson_01 17 件 + 例文の prompt をスキル経由で生成し preflight 全 PASS
- `invariants.mjs` の B hash を新ガイド hash に更新
- `npm run validate` invariants A/B/C PASS

### 並行：main B（vocab_type 分類・優先度低下）

main B（Gemini で 17,473 件分類）は依然必要（vocab_type は skill の入力）だが、
worktree A の pivot を受けて **着手順序が変わる**：

- **先に Phase 5 ④' 完了** → スキルが動くことを確認
- **後で main B** → vocab_type を catalog 全件に付与（skill が依存）

main B 自体の実装は変わらない。スコープも変わらない。**着手タイミングだけ後ろにずれる**。

### user 確認待ち項目（次セッション着手前）

1. **v4.1 commit `a830c95` の扱い**：
   - (a) 残す（Q1 A / Q2 A / preflight / hash は活きる・履歴として有用）← **推奨**
   - (b) 一部 revert（Q3 B 部分のみ）
2. **main B も Claude Code スキル化するか**：
   - vocab_type 分類も `/classify-vocab-type` スキルとして実装すれば Gemini API 不要
   - 既存 `scripts/classify-and-translate.mjs` の扱い

---

## 並行終了後の統合（Phase 5 ④' 完了 = Phase 5 ④ 全体完了）

```
.claude/skills/generate-image-prompt.md 経由で lesson_01 prompt 生成 PASS
npm run validate                                # invariants 全 PASS
（main B 完了後）skill が catalog 全件に対応可能になる
```

その後：
- **Phase 5 ⑤ 着手可**：日次 20 件運用開始 + lesson_02 全件生成
- **Phase 5 ⑥ 着手可**：GAS 入力系退役

---

## ブロッカー

- Phase 5 ④' 着手：blocker なし（user が新規 worktree session 起動するだけ）
- Phase 5 ⑤：Phase 5 ④' 完了に blocked
- Phase 5 ⑥：Phase 5 ⑤ 完了に blocked

---

## 直近の確定コマンド

```
npm run validate                   # invariants A=v7.5 / B=891b73f5ae2d(v4.1) / C / D
                                   # ※D は本 worktree 環境で ffprobe 未導入のため 0/55 PASS
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
node scripts/build-catalog.mjs [--dry-run | --verbose]
node scripts/transcribe-lesson-vocab-types.mjs [--dry-run | --verbose]   # Phase 5 ④ Q2 A
npm run import-lesson -- --lesson NN [--dry-run | --verbose]

# ↓ 以下は ④' pivot 後に deprecated 予定（skill 方式に置換）
python scripts/build_prompts.py --lesson NN          # 決定論版 dispatch（dead code 化予定）
python scripts/build_prompts.py --catalog            # 決定論版 catalog mode（dead code 化予定）

# ↓ Phase 5 ④' 着手後の新コマンド（未実装）
# /generate-image-prompt mode=daily-pull limit=20    # Claude Code スキル invoke
# /generate-image-prompt words=医者,会社員 chain=true  # chain mode
# /schedule で daily cron セットアップ
```

参考（再実行不要）：
- worktree A 成果物：`data/image_prompts_lesson01_v4_0.json`（決定論版 32 件・skill 出力との品質比較用に保持）
- worktree path：`c:/Users/kohn0/Desktop/japanese-lesson-creator-main/.claude/worktrees/example-prompts`
- Phase 5 ④ pivot 議論：本セッション 2026-05-22 / memory `project_phase5_pivot_to_claude_code_skill.md`

人間タスク：
- worktree A → main の ff-merge 実行（このセッション終了後）
- ff-merge 後、次の worktree session を立てて Phase 5 ④' 着手
- Phase 5 ⑥ まで進めば「Sheet 削除確認」が出現
