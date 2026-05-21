# docs/WORKFLOW.md — main / worktree の役割分担と同期ポリシー

> このファイルは「どちらのブランチで何をやるか」「どう merge するか」を定める。
> 不変のプロジェクトルールは `CLAUDE.md`、現在地は `NEXT_ACTIONS.md`、退避中は
> `docs/PHASE_BACKLOG.md`。本ファイルは **不変の運用プロトコル**。

---

## なぜ 2 系統に分けるのか

Phase 4 移行中、**マスタープロンプトガイド** の進化と **Phase 4 ランタイム実装**
（`generate-images-local.mjs` 等）が並行して進む。両者を 1 ブランチで触ると：

- 同じ `scripts/build_prompts.py` を双方が編集して conflict
- 同じ `NEXT_ACTIONS.md` を双方が書き換えて状態が壊れる
- 「ガイドの実機検証」と「ランタイムの実機検証」が混ざってデバッグ困難

そのため：

- **main**：Phase 4 ランタイム本体（③④⑤⑥）と registry / runtime 成果物
- **`phase4-prompt-plan` worktree**（`.claude/worktrees/image-prompt-plan`）：
  マスタープロンプトガイドの著作 / build_prompts.py のロジック / 出力 JSON の再生成

CLAUDE.md memory: 「1 セッション = 1 worktree。切替運用はしない」を守る。
**並行作業の禁止**。1 つのセッションは 1 つの worktree（または main）にだけ住む。

---

## ファイル所有権（誰がどこを触ってよいか）

### worktree 専属（main から触らない）

```
prompts/master_prompt_design_guide_v3_N.py        # 任意の v3.N
scripts/build_prompts.py                           # render_person / PERSON_* 等
data/image_prompts_lessonNN_v3_N.json              # build_prompts.py の出力
archive/prompts/                                   # 旧版退避
docs/PROMPT_GUIDE_*.md                             # guide-specific 注記
scripts/invariants.mjs                             # B hash 行のみ（後述）
```

### main 専属（worktree から触らない）

```
scripts/generate-images-local.mjs                  # Phase 4 ③
scripts/lib/imagen-client.mjs                      # Phase 4 ②
scripts/lib/image-qc.mjs                           # Phase 4 ④（将来）
scripts/validate-images.mjs                        # Phase 4 ⑤（将来）
scripts/_imagen-smoke.mjs / check-imagen-key.mjs
scripts/invariants.mjs                             # A / C / D 検査本体（後述）
data/master_image_registry.json                    # runtime 成果物
data/images/                                       # runtime 成果物
data/_meta/imagen_usage.json                       # runtime カウンタ
gas/pipeline.gs                                    # Phase 4 ⑥ の退役対象
docs/MIGRATION_PLAN.md / docs/REFERENCE.md
docs/PHASE_BACKLOG.md
NEXT_ACTIONS.md                                    # 「現在地」の統合責任
package.json
.tmp_verify/                                       # 検証 artifact
.claude/                                           # ツール設定
```

### `scripts/invariants.mjs` の行レベル分離

```javascript
const CANONICAL = {
  gas: ...,                                       // ← main 所有
  promptGuide: ...,                               // ← worktree 所有
  promptGuideExpectedHashPrefix: 'XXXXXXXXXXXX',  // ← worktree 所有（B hash）
  sColumnDir / sColumnPattern: ...,               // ← main 所有
};
// checkPromptGuideHash 関数本体                   // ← main 所有
// その他 checkSColumnInvariants / checkAudioQc   // ← main 所有
```

通常 worktree は 2 行（`promptGuide` のパスと `promptGuideExpectedHashPrefix`）だけ
変更する。main がそれ以外を変更する。行が重ならない限り conflict しない。

---

## インターフェース契約（壊さない）

worktree → main の唯一の interface は **`data/image_prompts_lessonNN_v3_N.json`
のスキーマ**：

```json
{
  "_meta": {
    "lessonNo": <int>,
    "guideVersion": "v3.N",
    "guideHashNormalized": "<12hex>",
    "generatedAt": "YYYY-MM-DD",
    "generator": "scripts/build_prompts.py",
    "scriptHash": "<12hex>",
    "vocabTypesSource": "data/vocab_types_lessonNN.json",
    "vocabTypesMeta": {...},
    "coveredVocabTypes": [...],
    "notes": "..."
  },
  "vocabulary": [
    {
      "imageId": "word_XXX",
      "word": "...",
      "reading": "...",
      "en": "...",
      "vocab_type": "person|object|...",
      "prompt": "...（テンプレート展開後の全文）..."
    },
    ...
  ]
}
```

このスキーマさえ守れば、worktree は guide / build_prompts を自由に進化できる。
main 側の `generate-images-local.mjs` は `--prompts <path>` 引数で任意の v3_N JSON を
バージョン非依存に消費する。

スキーマを変えるとき（フィールド追加・削除）は **両ブランチで合意してから進める**。

---

## 同期の方向と頻度

### 基本：worktree → main の片方向 merge

- 1 つの guide バージョンが「実機検証 OK」または「main に取り込む価値あり」と
  判断されたら、worktree → main に fast-forward merge
- merge 後、worktree は main の tip と同じになる（fast-forward なので）

### 例外：main → worktree の同期

worktree で新バージョン作業を始める前に、main で進んだ commit を worktree に
取り込む（worktree がいつも最新 main を baseline にする）。

```bash
# worktree session 開始時に毎回：
cd .claude/worktrees/image-prompt-plan
git fetch                      # 必要なら
git merge --ff-only main       # main の進捗を取り込む（fast-forward 想定）
# fast-forward 不可なら何かおかしい（worktree がローカル変更を持っている）。要調査。
```

### main → main → worktree の流れ（典型）

```
main:     v3.5 ── v3.6 ── v3.7 ── v3.8 ──── (Phase4 ③進化)
                                      │
                                      └── ff-only main ──> worktree (v3.8 を baseline に)
                                                              │
                                                              └── v3.9 作業 ──┐
                                                                              │
worktree → main fast-forward merge                                            │
   ◀────────────────────────────────────────────────────────────────────────┘
```

---

## worktree でやってよいこと・やってはいけないこと

### worktree でやってよいこと

1. **マスタープロンプトガイドの新バージョン作成**（v3.9 / v4.0 等）
2. **`build_prompts.py` のロジック修正**（render_person / 各 LOOKUP の更新等）
3. **`invariants.mjs` の B hash と promptGuide パスの更新**（2 行のみ）
4. **`data/image_prompts_lessonNN_v3_N.json` の再生成**
5. **`archive/prompts/` への旧版退避**
6. **`docs/PROMPT_GUIDE_*.md` のパッチノート著作**

### worktree でやってはいけないこと（禁止）

1. **`NEXT_ACTIONS.md` の編集**（main 専属）
2. **`scripts/generate-images-local.mjs` 等 runtime コードの編集**（main 専属）
3. **`scripts/invariants.mjs` の B hash 以外の編集**（A/C/D 検査本体は main）
4. **`docs/MIGRATION_PLAN.md` / `docs/REFERENCE.md` / `docs/PHASE_BACKLOG.md` の編集**（main 専属）
5. **registry や lesson_*.json の編集**（main 専属の runtime データ）
6. **`gas/pipeline.gs` の編集**（main 専属）

**ガイド作業中に「main 専属ファイル」の変更が必要になったら：**

(a) worktree 側のセッションを終了する  
(b) main に戻って必要な変更を済ませる  
(c) worktree に戻り、`git merge --ff-only main` で取り込む  
(d) ガイド作業を続ける

並行で 2 セッション動かさない（CLAUDE.md memory）。

---

## merge 時の conflict 解決ルール

worktree → main の merge で conflict が起きたら、以下を優先：

| ファイル | conflict 時の採用方針 |
|---|---|
| `scripts/build_prompts.py` | worktree 側 |
| `prompts/master_prompt_design_guide_v3_N.py` | worktree 側（main は触らない前提） |
| `data/image_prompts_*.json` | worktree 側（main は触らない前提） |
| `scripts/invariants.mjs` | 行レベルで分離するため通常 conflict しない。起きたら手動で両方の意図を統合 |
| `NEXT_ACTIONS.md` | **main 側採用**。worktree のローカル NEXT_ACTIONS は無視 |
| `docs/REFERENCE.md` / `MIGRATION_PLAN.md` / `PHASE_BACKLOG.md` | **main 側採用**（worktree は触らない前提） |
| `package.json` / `package-lock.json` | **main 側採用**（worktree は触らない前提） |

通常はファイル所有権が分かれているので conflict はほぼ起きない。
起きた場合は「worktree がやってはいけないリスト」を破った可能性が高いので
原因調査も行う。

---

## セッション開始 / 終了チェックリスト

### main セッション開始時

```
1. CLAUDE.md を読む
2. 検証コマンド（npm run validate / npm run missing-assets）で現状を機械導出
3. NEXT_ACTIONS.md を読む（コマンドと矛盾したらコマンドが正）
4. 作業する（main 専属ファイルのみ）
5. もしマスタープロンプトガイド変更が必要になったら、ここでは触らず
   別セッションを worktree で立てて依頼
```

### worktree セッション開始時

```
1. CLAUDE.md と docs/WORKFLOW.md を読む（本ファイル）
2. cd .claude/worktrees/image-prompt-plan
3. git merge --ff-only main    # main の進捗を取り込む
4. npm run validate            # baseline 確認
5. ガイド作業を実施（worktree 専属ファイルのみ）
6. python scripts/build_prompts.py --lesson NN  # JSON 再生成
7. invariants.mjs の B hash と promptGuide パスを新版に更新
8. npm run validate            # 新版で PASS 確認
9. commit
```

### worktree セッション終了時

```
1. 「worktree やってはいけないリスト」のファイルを触っていないか確認
2. npm run validate が PASS することを確認
3. commit が clean に揃っているか確認（git status）
4. main 側のセッションが merge を行う前提で、ここでは merge しない
   （別セッションで main から fast-forward merge する）
```

### main セッションでの worktree merge

```
1. git fetch                                # 必要なら
2. git log phase4-prompt-plan ^main         # 取り込む commit を確認
3. git merge --ff-only phase4-prompt-plan   # fast-forward
4. npm run validate                         # 取り込み後の整合性確認
5. NEXT_ACTIONS.md を「現在地」で書き直す
6. commit（NEXT_ACTIONS.md の更新のみ。merge 自体は ff なので merge commit なし）
```

---

## 関連ドキュメント

- `CLAUDE.md` — プロジェクト不変ルール
- `docs/MIGRATION_PLAN.md` — Phase 0〜4 のロードマップ
- `NEXT_ACTIONS.md` — 現在地・次の行動
- `docs/PHASE_BACKLOG.md` — 退避中の項目
- `docs/REFERENCE.md` — 不変の仕様・スキーマ
