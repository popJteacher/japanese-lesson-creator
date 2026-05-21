# NEXT_ACTIONS.md

> 1 ページ以内。毎回まるごと書き直す。解決済みは削除。**追記のみ禁止。**
> ここの記述は検証コマンド出力に劣後する（矛盾したらコマンドが正）。
> 移行ロードマップ全体は `docs/MIGRATION_PLAN.md`。退避中の項目は `docs/PHASE_BACKLOG.md`。
> main / worktree 役割分担は `docs/WORKFLOW.md`。

**最終更新：** 2026-05-21（**Phase 4 完了宣言** / GAS Triggers `generateImageBatch` × 3 件削除を人間検証済 / 生存中 GAS 自動 trigger = 0 件 / 次は Phase 5 設計議論 + Phase 4 後 backlog 優先度判断）

---

## 現在地

- **Phase 0／1／2／3／4：完了。** ✅
- **Phase 5：未着手・設計待ち** — user が優先度を確定したら NEXT_ACTIONS に降ろす
- **Phase 4 後 backlog：着手待ち** — `docs/PHASE_BACKLOG.md` に各項目の出所 / 退避理由 / 戻し方を記載済

生存中の GAS 自動 trigger：**0 件**（CLAUDE.md memory: GAS トリガーは文書を信用しない → 2026-05-21 人間が Triggers パネルで実視確認済）。
残存している GAS：手動実行用 `seedLesson01` / `extractFromGoiList` / `importFromLessonJson` の 3 系統のみ（自動実行されない）。

---

## 今やること（user 判断待ち）

以下 2 種類の作業が parallel に走り得る。user の優先度判断を待つ：

### 議題 A：Phase 5 設計議論（入力系のローカル化）

`docs/MIGRATION_PLAN.md` § Phase 5 にスコープ候補 6 項目を記載済。
着手前に user が以下を確定する：

1. **lesson_NN.json の repo 化**：Drive → `data/lessons/lesson_NN.json` に移す
2. **Goi_List.pdf の repo 取り込み**：PDF を repo に置くか / 抽出結果 JSON を固定化するか
3. **`extractFromGoiList.gs` の local 化**：PDF→JSON 抽出ロジックを Python or Node に移植
4. **`importFromLessonJson.gs` の local 化**：Sheet を経由せず registry に直接書く
5. **Sheet 自体の退役**：Vocabulary / Examples 撤去
6. **`seedLesson01.gs` の退役**：lesson_01 ハードコードを lesson_01.json + 汎用 importer に統合

優先順位 / 段階分け / スライス境界の議論が必要。完了条件は「新規課追加が
ローカルだけで完結する」。

### 議題 B：Phase 4 後 backlog の優先度判断

詳細は `docs/PHASE_BACKLOG.md` 参照。主な候補：

| 優先度候補 | 項目 | 想定コスト |
|---|---|---|
| 🔴 高 | v3.12 マスタープロンプトガイド修正（worktree 担当・9 項目） | API 課金なし |
| 🟡 中 | 残り 436 件の本生成（v3.12 改修後） | $17.4 |
| 🟡 中 | ③ で生成した 5 件の `--force` 再生成（v3.12 適用後） | $0.20 |
| 🟢 低 | lesson_01 既存 41 件 person 画像の再生成 | 数 $ |
| 🟢 低 | 画像 QC ④⑤ 実装（旧 Phase 4 ④⑤・photo drift 検出に有効と判明） | $0.80 校正 + 実装 |
| 🟢 低 | `scripts/apply_v5_3_patches.py` archive 移設（dead code 化） | なし |
| 🟢 低 | `docs/REFERENCE.md` 包括 audit（v7.3 時点で凍結気味） | なし |
| 🟢 低 | scene-rich テンプレ A2 設計 / OBJECT_SIGNATURES.avoid (M-67) / NAMED_CHARACTER_PROFILES 生成パス (M-16) / M-23 テンプレ J 対義語 / M-48 FAMILY_TEMPLATES / `scripts/build_prompts.py` D/H/J 戦略展開 | プラン依存 |

着手は user 判断。worktree 担当（プロンプト系）と main 担当（コード系）の振り分けは
`docs/WORKFLOW.md` 参照。

---

## ブロッカー

- なし。user 判断待ちのみ。

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

人間タスク：**なし**（Phase 4 完了で 0 件）。Phase 5 着手判断のみ。
