# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（Phase 4 ⑥ Option C コード完了 / gas/pipeline.gs 2815→799 行 / Sheet 操作 utility 9 件 + loadJsonFromDriveById も同時退役 / validate ERROR 0 + GAS ヘッダー v7.5 検出 / **残作業：人間タスク = GAS Triggers 削除 → Phase 4 完了宣言**）

---

## 現在地

- **Phase 0／1／2／3：完了。**
- **Phase 4：着手中（残作業：人間タスク + 完了宣言のみ）。**
  - **①〜⑤**：完了（③ は smoke 5 件で同値検証 PASS、④⑤ は Phase 4 後 backlog 移管）
  - **⑥ コード**：**完了（2026-05-21）。**
    - `gas/pipeline.gs`：v7.4 → **v7.5**（2815→799 行・-2016 行）
    - Cut 範囲（Option C）：
      - **Range A**（line 750-2528）：generateImages.gs 主要 6 関数 + build*Prompt_ × 19 + その他 helper = 1779 行
      - **Range B**（line 2545-2803）：loadJsonFromDriveById + 9 Sheet 操作 utility = 259 行
    - 保全：`archive/gas_old/generateImages_v5_3_phase4_retired.gs`（171 → 2222 行）
    - 検証：`npm run validate` ERROR 0 / invariants[A] から `generateImages.gs v5.3` 行が自動消失 / `npm run check-imagen-key` PASS

生存中の GAS トリガー：`generateImageBatch` × 3 件（9 / 13 / 17 時）— **人間タスク：削除待ち**。

---

## 今やること

### A. ⑥ コミット（即実行）

`gas/pipeline.gs` / `archive/gas_old/generateImages_v5_3_phase4_retired.gs` / `docs/REFERENCE.md` / `NEXT_ACTIONS.md` を 1 commit。

### B. 人間タスク（Claude Code 実行不可）

GAS エディタを開き、Triggers パネルから以下 3 件を削除：

```
generateImageBatch  09:00 daily
generateImageBatch  13:00 daily
generateImageBatch  17:00 daily
```

削除後、Triggers パネルの一覧に `generateImageBatch` が含まれないことを目視確認
（`feedback_verify_gas_triggers.md` memory：文書を信用せず必ず実視）。
削除確認できたらこのファイルに「人間タスク完了」と一言コメントしてください。

### C. Phase 4 完了宣言（人間タスク完了後）

- `docs/MIGRATION_PLAN.md` Phase 4 セクションに完了マーク
- `NEXT_ACTIONS.md` を「Phase 5 設計議論 / Phase 4 後 backlog 優先度判断」に書き直し

---

## Phase 4 完了後の重要議題

### Phase 5 設計（仮称：入力系のローカル化）

2026-05-21 user 確認で **「完全ローカル」想定との gap** が判明。Phase 4 完了後も
以下が GAS/Drive/Sheets 依存のまま残る：

| 依存先 | 何が残るか |
|---|---|
| **GAS（手動実行）** | `seedLesson01.gs` / `extractFromGoiList.gs` / `importFromLessonJson.gs` の 3 系統 |
| **Google Drive** | Goi_List.pdf（N5 語彙原典）/ lesson_NN.json（課マスター） |
| **Google Sheets** | Vocabulary / Examples シート（registry の入力源） |

`docs/MIGRATION_PLAN.md` 冒頭の「GAS・Google Sheets・Google Drive はランタイムから引退」は長期 vision として書かれていたが、Phase 1〜4 にはこの作業が割り当てられていない（横断要件として line 137-138 に書かれているのみ）。

**Phase 5（仮）として議論すべき項目：**
1. lesson_NN.json を Drive → repo 直置きに移行
2. Goi_List.pdf を repo 取り込み or 抽出結果 JSON 固定化
3. `extractFromGoiList.gs` の local 化
4. `importFromLessonJson.gs` の local 化（Sheet 経由を撤廃し registry に直接書く）
5. Sheet 自体の退役
6. `seedLesson01.gs` の退役（lesson_01.json + 汎用 importer に統合）

着手は Phase 4 完了宣言後に user 判断。

### Phase 4 後 backlog（既存）

詳細は `docs/PHASE_BACKLOG.md` 参照。優先度は user 判断。

- **v3.12 マスタープロンプトガイド修正**（worktree 担当・9 項目）
- **残り 436 件の本生成**（③ 持ち越し分・v3.12 改修後・$17.4）
- **③ で生成した 5 件の `--force` 再生成**（v3.12 適用後・$0.20）
- **lesson_01 既存 41 件 person 画像の再生成**
- **画像 QC ④⑤ 実装**（旧 Phase 4 ④⑤・$0.80 校正 + 実装）
- **`scripts/apply_v5_3_patches.py` archive 移設**（今回 cut で dead code 化した one-shot patcher）
- **`docs/REFERENCE.md` 包括 audit**（v7.3 時点で凍結気味・line 番号 / AUDIO_SETTINGS 詳細 等が drift）
- その他：scene-rich テンプレ A2 設計 / OBJECT_SIGNATURES.avoid 取り込み (M-67) / NAMED_CHARACTER_PROFILES 生成パス実装 (M-16) / M-23 テンプレ J 対義語 / M-48 FAMILY_TEMPLATES / `scripts/build_prompts.py` D/H/J 戦略展開

---

## ブロッカー

- なし。⑥ コード commit → 人間タスク → 完了宣言 の一直線。

---

## 直近の確定コマンド

```
npm run validate             # invariants A=v7.5 / B=a79e54a29e51 / C=12×4 / D=55/55（3 WARN）PASS
npm run missing-assets       # 現状 image 441 / audio 108（v3.12 後 backlog で削減予定）
npm run check-sa             # Sheets API 疎通
npm run check-tts-sa         # Cloud TTS API 疎通
npm run check-ffmpeg         # ffmpeg / ffprobe / filter / encoder 疎通
npm run check-imagen-key     # AI Studio ListModels（Imagen 4 系の検出）— 直近 PASS
npm run sync-registries [-- --dry-run | --verbose | --only image|audio]
npm run backfill-registries [-- --dry-run | --verbose | --only image|audio]
npm run generate-audio [-- --dry-run | --limit N | --only word|sentence | --max-chars N | --force | --no-qc]
npm run generate-images -- --prompts <path> [--print-prompts | --sync-only | --dry-run]
                                  [--limit N] [--max-images N] [--force]
                                  [--person allow_adult|dont_allow|allow_all]
                                  [--aspect 1:1] [--size 1K|2K] [--out <md>]
npm run validate-audio
node scripts/_tts-smoke.mjs
node scripts/_imagen-smoke.mjs    # 実機 1 枚＝$0.04
node scripts/diff-registries.mjs <a.json> <b.json>
npm run classify -- --lesson NN [--verify|--force|--only A,B|--dry-run]
python scripts/build_prompts.py --lesson 1       # worktree で実行
```

人間側（Claude Code 実行不可）：

```
# 退役対象 GAS トリガー（Phase 4 ⑥ commit 完了後に GAS Triggers パネルから削除）
generateImageBatch  09:00 daily
generateImageBatch  13:00 daily
generateImageBatch  17:00 daily

# 削除後の確認
GAS エディタ → Triggers パネル → 一覧が generateImageBatch を含まないことを目視
（memory: GAS トリガーは文書を信用しない）
```
