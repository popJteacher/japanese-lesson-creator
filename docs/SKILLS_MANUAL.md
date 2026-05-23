# skill 操作マニュアル（初心者向け）

> 対象：Claude Code を使って日本語教材の画像 prompt を作りたい人（自分・他の先生・将来の自分も含む）。
> このプロジェクトで使う 2 つの skill `/generate-image-prompt` と `/export-skill-prompts` の使い方を、最初から最後まで具体的に解説します。
> 困ったらこのファイルだけ見れば動かせるように書きました。

---

## 0. 全体の流れ（先に絵で把握する）

```
                ┌──────────────────────────────────────────┐
                │ ① Claude Code を起動                       │
                │   cd c:\Users\kohn0\Desktop\japanese-...   │
                │   claude                                   │
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
   ┌─────────────────────────────────────────────────────────┐
   │ ② /generate-image-prompt で prompt を作る                │
   │   ・どの単語/例文の prompt を作るか mode で選ぶ             │
   │   ・data/image_prompts_skill.json に追記される             │
   └────────────────┬────────────────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────────────────┐
   │ ③ /export-skill-prompts で .txt に変換                   │
   │   ・tmp/skill_prompts/{imageId}.txt が 1 entry/1 file で  │
   │     書き出される                                          │
   └────────────────┬────────────────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────────────────────────────┐
   │ ④ .txt を開いて画像生成 UI に貼る                          │
   │   ・aspect ratio をヘッダーで確認 → UI で設定               │
   │   ・prompt 本文を全選択コピー → UI に貼り付け → 生成        │
   └─────────────────────────────────────────────────────────┘
```

**重要な原則**：
- **② は記録を残す**（同じ単語を二度起草しないようにするため）
- **③ は記録を読むだけ**（何度走らせても害なし）
- **④ は完全に手動**（user が UI で操作）

---

## 1. 前提条件

### 1.1 必要なもの

- Windows PC（このプロジェクトは Windows 想定）
- Claude Code が起動できる環境
- このプロジェクトの directory（`c:\Users\kohn0\Desktop\japanese-lesson-creator-main`）
- Node.js v18 以上（`npm` コマンドが動くこと）
- Python（`scripts/lib/prompt_preflight.py` が動くこと）

### 1.2 Claude Code を起動する

PowerShell や Command Prompt を開いて：

```cmd
cd c:\Users\kohn0\Desktop\japanese-lesson-creator-main
claude
```

これで Claude Code の対話画面に入ります。

### 1.3 skill が見えていることを確認

起動直後、Claude Code は available skills（使える skill 一覧）を読み込みます。次のように打ってみて、`generate-image-prompt` と `export-skill-prompts` が候補に出れば OK：

```
/
```

`/` だけ打つと slash command の候補が出ます。skill 名がリストに無ければ、起動 directory が間違っているか `.claude/skills/` フォルダが見えていません。

---

## 2. `/generate-image-prompt` — prompt を作る skill

### 2.1 何をする skill か

「この単語の画像を作りたい」「この例文を絵にしたい」というときに、画像生成 AI に渡すための**長い英語 prompt** を自動で書いてくれる skill です。

prompt は「6-PART マスタープロンプト設計ガイド」のルールに従って書かれます（人物の顔・服装・footwear・国旗の扱い等、教材として一貫した品質を保つための数百行のルール）。

書き終えた prompt は `data/image_prompts_skill.json` に保存されます。**保存することで「もう作った単語」が記録される**ので、次回同じ単語を二度起草しません。

### 2.2 4 つの mode

| mode | 用途 | 典型コマンド |
|---|---|---|
| `daily-pull` | catalog 全 17,508 件から、まだ作っていない単語を上から N 件 pick | `/generate-image-prompt` |
| `lesson` | 指定した課の単語と例文のうち、未作成のものを全件 | `/generate-image-prompt mode=lesson --lesson 02` |
| `explicit` | 単語名を直接指定 | `/generate-image-prompt mode=explicit --words 医者,会社員` |
| `chain` | 上記いずれかに `chain=true` を付ける。prompt 起草後に画像生成まで一気通貫 | `/generate-image-prompt mode=explicit --words 医者 chain=true` |

### 2.3 パラメータ一覧

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `mode` | string | `daily-pull` | 上の 4 mode のいずれか |
| `limit` | int | 20 | daily-pull で何件 pick するか |
| `--lesson` | int | — | lesson mode の課番号（例：`--lesson 02`） |
| `--words` | csv string | — | explicit mode の単語リスト（例：`--words 医者,会社員,先生`） |
| `chain` | bool | `false` | `true` にすると prompt 生成 + 画像生成まで一気通貫 |

### 2.4 実例で見る

**例 A：「今日 20 件分の prompt を作る」**

```
/generate-image-prompt
```

`mode=daily-pull limit=20` の省略形。catalog から作っていない単語を上から 20 件 pick。各単語について、ガイドを読み込み、テンプレに当てはめ、preflight に通し、JSON に追記します。

実行が終わると、何件作ったか、preflight で何件 PASS したか、失敗した entry があれば理由は何か、を報告してくれます。

**例 B：「第 2 課を全部やる」**

```
/generate-image-prompt mode=lesson --lesson 02
```

`data/lesson_02.json` を読んで、その中の vocabulary と例文（patterns[].examples[]）で **まだ画像が無いもの**を全件 pick して prompt 化。limit は無視されます（その課の全件）。

**例 C：「医者と会社員と先生の 3 つだけ作りたい」**

```
/generate-image-prompt mode=explicit --words 医者,会社員,先生
```

catalog から `医者` / `会社員` / `先生` を lookup して vocab_type を解決し、3 件の prompt を作ります。catalog に無い単語が含まれていると ABORT します（事前に classify が必要）。

**例 D：「ぜんぶ自動でやって、画像までほしい」**

```
/generate-image-prompt mode=explicit --words 医者 chain=true
```

医者の prompt を作って、そのまま `scripts/generate-images-local.mjs` を起動して画像生成（nanobanana 使用、~$0.04/件）まで自動。

### 2.5 失敗したらどうなる？

各 prompt は **preflight** という機械検査を通ります。検査項目：

| code | 何をチェック |
|---|---|
| `[C4]` | 背景文字列が正しい（`soft cream off-white background (warm off-white, NOT pure stark white)`） |
| `[C5]` | `NOT pure stark white` が入っている |
| `[C1] full-body` | person カードに `full-body` / `head-to-toe` が入っている |
| `[C1] area` | person カードに古い `fills NN% of...` 表記が残っていない |
| `[C1] lens` | person カードに古い `85mm portrait lens` が残っていない |
| `[C6]` | flag/nationality を語るときに `must` / `never` / `DO NOT` の強表現を使っている |
| `[PH]` | 未置換の `{PLACEHOLDER}` が残っていない |

preflight に失敗すると、skill は **最大 3 回まで自分で修正を試みます**（self-correction loop）。それでも直らなければ：

- その entry は `data/image_prompts_skill.json` に書き出されない
- `data/_meta/skill_prompt_failures.json` に記録される（人間レビュー対象）
- skill は次の単語に進む（途中で止まらない）

### 2.6 こんなときどうする？

**Q. 同じ単語を勝手に上書きしてほしい**

→ skill は既存の単語を上書きしません。新しく書き直したい時は `data/image_prompts_skill.json` 内の該当 entry を手で削除してから skill を再実行。

**Q. catalog に vocab_type が付いていない単語がある**

→ ABORT します。先に `node scripts/classify-and-translate.mjs --classify` で分類を済ませてください（Phase 5 ④ B の手順）。

**Q. ガイドの hash が一致しないと怒られる**

→ `prompts/guide/part1〜6_*.md` が変更されたが invariants が古い、または逆。`npm run validate` で原因を確認。

---

## 3. `/export-skill-prompts` — JSON を .txt に変換する skill

### 3.1 何をする skill か

`data/image_prompts_skill.json` の中身は読みにくい JSON（改行が `\n` でエスケープされている）。これを画像生成 UI に直接コピペできる **クリーンな .txt ファイル** に展開する skill です。

**変換するだけで、JSON を変更しません**。何度走らせても害なし。

### 3.2 出力ファイルの形式

各 entry が 1 ファイルになります（`tmp/skill_prompts/{imageId}.txt`）：

```
# imageId: ex_L02_001
# word: これは時計です。 (This is a clock.)
# aspect_ratio: 16:9

[PURPOSE]
Create an example sentence illustration for ...
（中略）
[CONSTRAINTS]
No text, no letters, ...
```

- **L1-3**：ヘッダー（imageId / 単語 + 英訳 / aspect ratio）
- **L4**：空行（区切り）
- **L5 以降**：prompt 本文（画像生成 UI に貼り付ける部分）

### 3.3 パラメータ一覧

| パラメータ | デフォルト | 説明 |
|---|---|---|
| （なし） | — | 全 entry を展開 |
| `--ids <csv>` | — | 特定 imageId のみ（例：`--ids word_医者,ex_L02_001`） |
| `--lesson <NN>` | — | 特定の課の例文のみ（`ex_L<NN>_*` を抽出） |
| `--out <dir>` | `tmp/skill_prompts` | 出力先ディレクトリ |
| `--force` | false | 既存 .txt があれば上書き |
| `--help` / `-h` | — | help 表示 |

### 3.4 実例で見る

**例 A：「全部 .txt にしてほしい」**

```
/export-skill-prompts
```

`data/image_prompts_skill.json` 内の全 entry が `tmp/skill_prompts/{imageId}.txt` に書き出されます。

**例 B：「第 2 課の例文だけ」**

```
/export-skill-prompts --lesson 02
```

`ex_L02_*` だけを書き出し。語彙（`word_*`）は対象外。

**例 C：「医者と何ですか、この 2 つだけ」**

```
/export-skill-prompts --ids word_医者,ex_L02_010
```

明示的に指定した 2 件だけ書き出し。語彙と例文を混在指定 OK。

**例 D：「JSON 更新した、もう一度 .txt 作り直したい」**

```
/export-skill-prompts --force
```

既存 .txt を上書きします。`--force` を付けないと既存ファイルは skip されます（履歴が消えるのを防ぐため）。

**例 E：「別の場所に出したい」**

```
/export-skill-prompts --out my-prompts/lesson02 --lesson 02
```

`my-prompts/lesson02/ex_L02_001.txt` のような形で出力先を変更。共有用フォルダにまとめて出すときなどに便利。

### 3.5 こんなときどうする？

**Q. 「no entries matched the filter」と出る**

→ 指定した imageId が JSON に無いか、誤字。エラーメッセージに `available imageIds` が列挙されるので、その中から選び直してください。

**Q. JSON が無いと言われる**

→ まだ `/generate-image-prompt` を一度も実行していない状態。先に prompt を起草してください。

**Q. tmp/skill_prompts/ が見つからない**

→ skill 初回実行時に自動で作られます。手動で作る必要はありません。

---

## 4. 画像生成 UI への貼り付け（手動）

skill が出力した .txt を画像生成 AI（nanobanana / Imagen / Gemini chat / ChatGPT 等）に貼って画像を作る手順。

### 4.1 ファイルを開く

エクスプローラーで `c:\Users\kohn0\Desktop\japanese-lesson-creator-main\tmp\skill_prompts\` を開き、`ex_L02_001.txt`（例）を `メモ帳` か `VS Code` 等で開きます。

### 4.2 aspect ratio を UI で設定

ヘッダー L3 に書いてある値：

```
# aspect_ratio: 16:9
```

これを画像生成 UI の「画像比率」「Aspect」等のセレクタで合わせます。

| ファイルのヘッダー | UI 側設定 | 用途 |
|---|---|---|
| `aspect_ratio: 1:1` | 正方形 / Square / 1:1 | 語彙カード（word_*） |
| `aspect_ratio: 16:9` | 横長 / Landscape / 16:9 | 例文画像（ex_*） |
| `aspect_ratio: 4:3` | 4:3 | （将来用） |

### 4.3 prompt 本文をコピー

`[PURPOSE]` から末尾の `[CONSTRAINTS]` ブロック最後の行まで、全部を選択してコピーします。ヘッダー L1-3 と空行 L4 はコピーしません（メモ用の情報）。

### 4.4 UI に貼って生成

画像生成 UI のテキスト入力欄に貼り付けて、生成ボタンを押します。

**注意**：日本語は prompt 本文に含まれていません（`[これは時計です。] (This is a clock.)` の 1 行だけ目的の説明として）。本文は全部英語なので、UI 側の言語設定は英語のままで大丈夫です。

---

## 5. 一連のワークフロー（コピペで動くサンプル）

「新しい課（第 3 課）を作って、画像 prompt を全部用意して、.txt にも出す」の最短手順：

```
# (1) Claude Code を起動
cd c:\Users\kohn0\Desktop\japanese-lesson-creator-main
claude

# (2) Claude Code 内で：第 3 課の lesson JSON が既にあるとして prompt 起草
/generate-image-prompt mode=lesson --lesson 03

# (3) 終わったら .txt に展開
/export-skill-prompts --lesson 03

# (4) Claude Code を抜けて、エクスプローラーで以下を開いて画像生成
#     c:\Users\kohn0\Desktop\japanese-lesson-creator-main\tmp\skill_prompts\ex_L03_*.txt
```

「特定の 1 単語だけ画像を作りたい」最短手順：

```
# (1) 起動
cd c:\Users\kohn0\Desktop\japanese-lesson-creator-main
claude

# (2) prompt 作成
/generate-image-prompt mode=explicit --words 病院

# (3) .txt 化
/export-skill-prompts --ids word_病院

# (4) tmp/skill_prompts/word_病院.txt を開いて UI に貼る（aspect 1:1）
```

---

## 6. よくある質問（FAQ）

### Q1. skill 名を毎回タイプするのが面倒

`/` を打つと候補が出ます。`/gen` まで打てば `/generate-image-prompt` が候補に絞られて Tab 補完できます。

### Q2. どこに何が保存されているか整理したい

| 場所 | 内容 |
|---|---|
| `data/image_prompts_skill.json` | skill が起草した全 prompt（SSOT・追記式） |
| `tmp/skill_prompts/*.txt` | 手動投入用の派生ファイル（gitignore・いつでも再生成可） |
| `data/master_image_registry.json` | 生成された画像の status（pending → generated → approved） |
| `data/vocab_catalog.json` | 全 17,508 単語の vocab_type 分類済 SSOT |
| `prompts/guide/part1〜6_*.md` | プロンプト設計の不変ルール（変えないでください） |
| `.claude/skills/*.md` | skill の仕様書 |
| `scripts/lib/*.{mjs,py}` | skill が呼ぶヘルパー実装 |

### Q3. 毎日自動で 20 件 pull したい

`scripts/schedule-daily-pull.bat` と Windows タスクスケジューラ手順がコードとして残してあります。手順は `NEXT_ACTIONS.md` の「将来の自動化オプション」セクションを参照。

### Q4. skill が動かないとき

順番にチェック：

1. `cd` で正しい directory にいるか？（`pwd` で確認）
2. `npm run validate` が PASS するか？
3. `npm run check-imagen-key` で AI Studio key が生きているか？
4. `data/image_prompts_skill.json` が壊れていないか（JSON syntax）？
5. `prompts/guide/part1〜6_*.md` が全部あるか？

### Q5. preflight で何度も失敗する単語がある

`data/_meta/skill_prompt_failures.json` に記録されます。中身を見て、どの code（C4/C5/C1/C6/PH）で落ちているか確認。多くは：

- ガイド側のテンプレが新 vocab_type に未対応 → ガイド側の修正が必要
- 単語が catalog に無い・vocab_type 未付与 → classify を先に

### Q6. prompt の品質に納得いかない

prompt 本文を直接編集して画像生成 UI に貼っても OK（一発勝負）。ただし `data/image_prompts_skill.json` の方も合わせて編集しないと、次回 export で古い prompt が戻ってきます。

長期的に直したい場合は `prompts/guide/part1〜6_*.md` 側のルールを更新（手強い）。

### Q7. JSON のどの単語が画像 OK なのか分からない

`data/master_image_registry.json` の `entries` を見て `status` フィールド：

- `pending` → 画像未生成（または生成失敗）
- `generated` → 生成済・人間レビュー待ち
- `approved` → レビュー済 OK
- `rejected` → 品質 NG・再生成必要
- `outdated` → 古い設計の entry（無視）

### Q8. このマニュアル自体が古くなったら？

`docs/SKILLS_MANUAL.md` を編集してください。`.claude/skills/*.md` の spec が変わったときは、こちらも同時更新が望ましいです。

---

## 7. トラブルシューティング

### 「ABORT: N 件の person が役割/国籍に分類できない」

未知の国名（例：新しい国の語彙を追加した）が含まれている。`prompts/guide/part1_universal_rules.md` の §1.9 country_addition_checklist を見て、`PERSON_NATIONALITY_HINTS` と `COUNTRY_TO_PROFILE` を追加してください。

### 「prepayment credits depleted」

AI Studio の前払いクレジットが切れた。https://ai.studio/projects で top up。これは `/generate-image-prompt chain=true` 等で画像生成までやる時のみ発生（prompt 起草自体は Claude Code subscription 内なので 0 円）。

### 「fast-forward not possible」

worktree から main へ merge しようとして失敗。`docs/WORKFLOW.md` の「セッション開始 / 終了チェックリスト」§worktree セッション開始時 を参照。worktree で `git merge --ff-only main` を先に走らせる。

### .txt の文字化け

ファイルの BOM / encoding 問題。`.txt` は UTF-8 で書き出されます。古い メモ帳 で開く時は「文字コードの自動選択」を切って明示的に UTF-8 を選んでください。VS Code なら問題なし。

### 「skill が見えない」「skill list に出ない」

merge 直後など、その session 起動時にはまだ skill が認識されていない可能性。Claude Code を `exit` で抜けて、もう一度 `claude` で起動すると認識されます。

---

## 8. 用語集（最小限）

| 用語 | 意味 |
|---|---|
| skill | Claude Code に登録された slash command で、`.claude/skills/*.md` に仕様が書かれている |
| preflight | prompt を JSON に書き出す前に通す機械検査 |
| invariants | プロジェクト全体の不変条件（A=GAS / B=旧 guide hash / B'=新 guide manifest hash / C=lesson_01 JSON 件数 / D=音声 QC） |
| catalog | `data/vocab_catalog.json`。全 17,508 単語の vocab_type 分類済 SSOT |
| manifest hash | `prompts/guide/part1〜6.md` 6 ファイルから算出される 12 文字 hash（`1ca2f57ad927` が現行） |
| kosoado | これ・それ・あれ・どれ のような指示語 |
| vocab_type | 単語のカテゴリ（person / building / concrete_object / action_verb / adjective / abstract_concept / spatial_relation / demonstrative / example_sentence 等） |
| anchor | lesson 内で代表として最初に教える例文（`isAnchor: true`） |

---

## 9. 参考ドキュメント

| ファイル | 用途 |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | プロジェクト不変ルール |
| [`NEXT_ACTIONS.md`](../NEXT_ACTIONS.md) | 現在地・次の行動（1 ページ） |
| [`docs/WORKFLOW.md`](WORKFLOW.md) | main / worktree 役割分担 |
| [`docs/REFERENCE.md`](REFERENCE.md) | 不変の仕様・スキーマ |
| [`docs/MIGRATION_PLAN.md`](MIGRATION_PLAN.md) | Phase 0〜4 ロードマップ |
| [`.claude/skills/generate-image-prompt.md`](../.claude/skills/generate-image-prompt.md) | generate-image-prompt 詳細仕様 |
| [`.claude/skills/export-skill-prompts.md`](../.claude/skills/export-skill-prompts.md) | export-skill-prompts 詳細仕様 |
| [`prompts/guide/part1_universal_rules.md`](../prompts/guide/part1_universal_rules.md) | PART 1：普遍ルール |
| [`prompts/guide/part2_style_bible.md`](../prompts/guide/part2_style_bible.md) | PART 2：style bible |
| [`prompts/guide/part3_vocab_type_rules.md`](../prompts/guide/part3_vocab_type_rules.md) | PART 3：vocab_type 別ルール |
| [`prompts/guide/part4_prompt_templates.md`](../prompts/guide/part4_prompt_templates.md) | PART 4：テンプレ骨格 |
| [`prompts/guide/part5_vocab_reference_appendix.md`](../prompts/guide/part5_vocab_reference_appendix.md) | PART 5：lookup data |
| [`prompts/guide/part6_output_instructions.md`](../prompts/guide/part6_output_instructions.md) | PART 6：出力規約 + preflight |

---

## 10. このマニュアルのメンテナンス

skill 仕様（`.claude/skills/*.md`）を変更したときは、本マニュアルの対応セクションも合わせて更新してください。特に：

- 新しいパラメータを追加した → §2.3 or §3.3 のパラメータ表を更新
- 新しい mode を追加した → §2.2 の mode 表を更新
- preflight gate を追加した → §2.5 の表を更新
- 新しい skill を作った → 章を 1 つ追加

`scripts/lib/*.mjs` の挙動を変えた場合も同様。
