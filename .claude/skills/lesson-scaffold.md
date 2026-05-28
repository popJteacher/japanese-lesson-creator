---
name: lesson-scaffold
description: Scaffold a new lesson_NN.json with the v2.7 schema. Reads the corresponding 第NN課.pdf when present (vision-based seed extraction); falls back to empty placeholder skeleton when no PDF. Phase 1 MVP of the 課マスター作成 skill suite.
allowed-tools: Read, Write, Bash, Glob, Grep
---

# lesson-scaffold skill

課マスター作成 skill suite の **Phase 1 MVP**。`data/lesson_NN.json` に v2.7 schema
の placeholder skeleton を書き出す。教科書 PDF (`data/sources/pdfs/第NN課.pdf`) が
存在すれば vision で読み取り、`patterns[]` / `vocabulary` / `mainActivity` を
pre-fill する (seed mode)。PDF がなければ empty placeholder skeleton を出す
(empty mode)。

設計判断と背景は [NEXT_ACTIONS.md § 🆕 (a) 課マスター作成 skill suite](../../NEXT_ACTIONS.md)
を参照。14 ルール出典は
[archive/handoffs/lesson_master_rules_handoff_v2.md §3](../../archive/handoffs/lesson_master_rules_handoff_v2.md#L75)。

## 使い方

```
/lesson-scaffold NN [--patterns p1,p2,p3] [--force] [--no-pdf] [--pdf <path>]
```

| 引数 | 既定 | 説明 |
|---|---|---|
| `NN` (positional) | 必須 | 課番号 1-99。2 桁 zero-pad で扱う |
| `--patterns p1,p2,p3` | `p1` | 生成する pattern ID 列 (PDF 読み後に補正可) |
| `--force` | false | 既存 `data/lesson_NN.json` を上書き |
| `--no-pdf` | false | PDF があっても seed 抽出をスキップして empty mode |
| `--pdf <path>` | 自動 | PDF パスを上書き (既定: `data/sources/pdfs/第NN課.pdf`) |

### 例

```
# empty mode (PDF なしで雛形だけ生成)
/lesson-scaffold 03 --patterns p1,p2,p3 --no-pdf

# PDF seed mode (data/sources/pdfs/第03課.pdf を読んで pre-fill)
/lesson-scaffold 03 --patterns p1,p2,p3,p4
```

## 手順 (skill 実行フロー)

### Step 1: 引数解釈と既存ファイル check

`NN` を 2 桁 zero-pad (`03` 等)。`data/lesson_NN.json` が既に存在し `--force` なしなら
**即 abort** (事故防止: 既存課マスターを誤って空にしない)。

### Step 2: PDF の有無判定

- `--no-pdf` 指定時 → **empty mode**、Step 4 へ
- 既定パス: `data/sources/pdfs/第NN課.pdf` (`--pdf` で上書き)
- 存在しなければ user に通知して **empty mode**、Step 4 へ
- 存在 + `data/lesson_seed_cache/lesson_NN.json` 既存 → cache hit、Step 3 をスキップして
  cache を seed として使い Step 4 へ

### Step 3: PDF を読んで seed JSON を作る (seed mode のみ)

PDF が見つかった & cache がない場合：

#### 3-1. PDF を PNG に展開

```bash
python scripts/lib/lesson-scaffold-pdf.py \
    "data/sources/pdfs/第NN課.pdf" \
    "tmp/pdf_pages/l<NN>"
```

stderr に `rendered N pages` が出る。

#### 3-2. 各ページを vision で読む

`tmp/pdf_pages/l<NN>/page_01.png` から順に Read tool で読み、以下を抽出：

| 抽出対象 | seed JSON のキー |
|---|---|
| 課タイトル (例: 「こそあど」) | `lesson.title` |
| **「文型」セクションの番号付き例文 (PDF 一番始めの基本形)** | `patterns[].examples[]` (各文の no/sentence) — **PDF 文型欄基本形のみ** |
| **「教え方の例」「プラスα」「活動例」「会話例」由来の応用** | `patterns[].applicationExamples[]` (各文の no=`app-N`/sentence) — **画像不要** |
| 「文法知識の整理」要旨 (1-2 文) | `lesson.grammarMemo.general` |
| 「導入語彙」リスト | `vocabulary.<groupKey>.words[]` |
| 「教え方の例」のキャラ名 (固有名詞のみ) | A-2/A-3 ルールに従い `namedCharacters[]` |
| 「活動例」名・fading stage・taskType | `mainActivity.{activityName, fadingStage, taskType}` |
| 「注意」「プラスα」 | `patterns[].cautionNote[]` / `plusAlpha[]` |

抽出時に**しないこと**：
- ❌ 独自キャラ (田中先生・山田さん等) を作る — A-2 違反
- ❌ canDo を 2 文以上にする / 「〜できる」以外の形にする — A-4 違反
- ❌ jlptLevel を捏造 — PDF に書いてなければ `"N5"` 既定
- ❌ practiceTemplates を 1 件にする — B-6 違反 (最低 2 件は scaffold 側で常に保証)
- ❌ practiceTemplates 全件を blank=0 (`＿＿＿` なし) にする — B-6-2 違反
- ❌ **PDF 文型欄以外の例文 (教え方の例・プラスα・活動例) を `examples[]` に入れる** — B-12 違反 (`applicationExamples[]` 行き)
- ❌ **`examples[]` を空にして `applicationExamples[]` のみ作る** — B-13 違反 (宿題 generator が機能しなくなる)
- ❌ **PDF にない vocab を独自判断で `_sourceTag="pdf_introduction"` として入れる** — B-15 違反候補 (`goi_list_n5_supplement` or `teacher_addition` を使う・出どころ捏造禁止)

抽出時に**すること** (Phase 1 of Goi_List skill 統合・2026-05-28+)：
- ✅ vocab word 全件に `_sourceTag` を付与する。PDF 導入語彙由来は `pdf_introduction`、Goi_List N5 由来は `goi_list_n5_supplement`、教師独自判断は `teacher_addition`。enum は B-15 / 詳細は [docs/REFERENCE.md §6-1](../../docs/REFERENCE.md)
- ✅ vocab word が examples / applicationExamples / practiceTemplates の sentence に登場するか自己確認 (`/lesson-check` B-14 で機械検出可)。意図的に sentence 抜きで vocab カードだけ提示する場合は `_sourceTag="practice_only"`

#### 3-3. seed を JSON ファイルに保存

`data/lesson_seed_cache/lesson_NN.json` に保存 (gitignored)。
形式は `scripts/lib/lesson-scaffold.mjs` の冒頭コメント参照。
これにより同じ NN を再 scaffold した時は PDF を再読しなくて済む。

```python
import json, os
os.makedirs("data/lesson_seed_cache", exist_ok=True)
with open(f"data/lesson_seed_cache/lesson_{NN}.json", "w", encoding="utf-8") as f:
    json.dump(seed, f, ensure_ascii=False, indent=2)
```

### Step 4: scaffold helper を呼ぶ

```bash
# empty mode
node scripts/lib/lesson-scaffold.mjs --no NN --patterns p1,p2,p3

# seed mode
node scripts/lib/lesson-scaffold.mjs --no NN --patterns p1,p2,p3 \
    --seed data/lesson_seed_cache/lesson_NN.json
```

`✅ wrote data/lesson_NN.json (patterns: ..., seed: yes|no)` が stdout に出る。

### Step 5: user にガイダンスを echo

下記テンプレを user に出す。`<NN>` は zero-pad、`<patterns>` は csv：

```
✅ data/lesson_<NN>.json を生成 (patterns: <patterns>、seed: <yes|no>)

次の作業順 (課マスター作成ルール §C-9 Step 1a→1e):
  1a 骨格    : _meta / lesson / textbook_sources を埋める
  1b 語彙    : vocabulary.byPattern[].words[] を PDF 照合後に追加 (A-1)
  1c 例文    : patterns[].examples[] を PDF 照合後に追加 (A-1)
  1d 教具    : flow[].materialNeeds[] を例文確定後に追加 (B-7 必須対象: intro_activity / main_activity)
  1e 活動    : flow[].activityId を activity_catalog / intro_activity_catalog から選定

埋める時に守る 14 ルール（出典: archive/handoffs/lesson_master_rules_handoff_v2.md §3）:
  A-1  PDF 照合してから例文を書く
  A-2  教科書にない人物を作らない (固有名詞は教科書原典 or A/Bさん記号)
  A-3  教科書の固有名詞を変えた時は replacementNote に理由
  A-4  canDo は「〜できる」で 1 文型 1 文
  A-5  vocabType を全語に付与 (vocabulary_card / actual_object / scene_picture / contrast_picture)
  A-6  imageRole を全語・全例文に付与 (vocab_person / vocab_object / scene / contrast)
  B-5  語彙 3 点セット (jlptLevel / isFirstAppearance / 絵カード化不可語の理由)
  B-6   practiceTemplates ≥ 2  ← scaffold が常に保証済
  B-6-2 practiceTemplates 全件 blank=0 (`＿＿＿` なし) 不可
  B-6-3 practiceTemplates の blank 数は uniform 推奨 (異形は judge UI 無効化)
  B-6-4 practiceTemplates ≥4 件は INFO (multi-template render で縦並びになるためスクロール量に注意)
  B-7  materialNeeds 必須対象 = intro_activity, main_activity (他は禁止)
  B-8  推奨時間 (復習 3-5分 / 導入 5-10分 / 文型 3-7分 / メイン 10-20分 / まとめ 2-5分)
  B-9  活動例の必須 field (活動名 / 設定 / 準備物 / 会話例 / fadingStage / ABC対応)
  B-12 examples[] に応答/応用混入禁止 (em-dash / 「はい〜です」/「いいえ〜じゃありません」/指示応答 / 「そうです」/ 「〜のです」省略形) → applicationExamples[] へ
  B-13 examples[] が空で applicationExamples[] のみは不可 (宿題 generator が機能しない)
  C-9  Step 1a→1e の順序を守る (今あなたが見ている順序)
  C-10 _meta.changes には変更内容 + 変更理由を両方書く
  C-11 formatVersion (全課共通) と lessonVersion (この課) を _meta に並べる
  C-12 教案の手順は ABC 準拠で書く (課マスターには teachingHint 1-2 文のみ)

examples[] / applicationExamples[] の役割分担 (基本ルール・docs/REFERENCE.md §6-1):
  examples[]            = 各課 PDF の「文型」セクション (一番始めに提示される基本形例文一覧) に
                          明記されたものだけ。Q 形式 or 基本宣言形のみ。応答・応用は含めない。
                          宿題練習問題はこの配列のみ参照。blank 構成が uniform になるよう揃える。
  applicationExamples[] = 教え方の例・プラスα・活動例・会話例から拾った応用表現。
                          sentence 形は出典のまま (A 単独 / Q+A 結合 / 複合会話)。
                          画像不要 (imageId 省略可)。宿題練習問題には使われない。

次セッション skill (Phase 2 以降):
  /lesson-fill-vocab <NN>       — vocab_catalog + 他課から自動補完
  /lesson-check <NN>            — 14 ルール + B-14/15/16 (vocab×sentence + _sourceTag 系) 準拠 lint
  /lesson-suggest-activities    — activity_catalog から activityId 候補提示
  /lesson-build-registry        — master_image/audio_registry pending 生成

Phase 2 of Goi_List skill 統合 (未実装・lesson_03 着手前 or 並行で実装予定):
  本 skill Step 3 の後半に「Goi_List N5 補強候補対話フェーズ」を追加し、
  PDF 導入語彙確定後に data/sources/goi_list_raw.json の N5 範囲
  (422 件) から各 pattern の文型コンテキストに沿った関連語を抽出して
  user に y/n/skip で個別判定させる。採用語には _sourceTag="goi_list_n5_supplement"
  を自動付与 (B-16 が範囲実在を検証)。
```

## seed mode と empty mode の比較

| 項目 | empty mode | seed mode |
|---|---|---|
| 起動条件 | `--no-pdf` 指定 or PDF 不在 | PDF 存在 (cache 優先) |
| `lesson.title` 等 | TODO_A-1 placeholder | PDF から課タイトル |
| `patterns[].examples[]` | TODO 1 件のみ | PDF の番号付き例文を全件 |
| `vocabulary` | placeholder 1 group | PDF の語彙リストから rough group |
| `namedCharacters[]` | `[]` | PDF 出現の固有名詞のみ |
| `mainActivity` (flow main_act_1) | TODO | PDF の活動例名・fadingStage |
| 14 ルール準拠 | scaffold 側で保証 (B-6 / B-7 必須対象等) | + seed 抽出時に A-2/A-3/A-4 を遵守 |

どちらも生成後の JSON は **必ず人間 review が要る** (A-1 ルール: PDF を読んで例文を確定するのは人間)。
seed mode は「下書きの量を減らす」だけで「確定」ではない。

## 制約

- **既存 `data/lesson_NN.json` 上書き禁止** (`--force` 必要)
- **PDF は data/sources/pdfs/ に user が手動コピー** (`cp ~/Downloads/第*.pdf data/sources/pdfs/`)。
  著作権物なので gitignore 済
- **seed cache は再現性のために保存** (PDF 削除されても seed は残る)。cache を消したい時は
  `rm data/lesson_seed_cache/lesson_NN.json` を user が手動実行
- **PDF 読み取り精度に保証なし**：vision が誤読する可能性あり。seed 後の人間 review 必須
- **invariants 整合性**：生成した JSON は `npm run validate` に通る形を目指す
  (`_meta.formatVersion` が "2.7" であること等)

## 失敗時の動作

| 状況 | 動作 |
|---|---|
| `NN` 範囲外 (1-99 以外) | exit 2 + エラーメッセージ |
| `--patterns` のいずれかが `p<N>` 形式でない | exit 2 |
| `data/lesson_NN.json` が既存で `--force` なし | exit 1 |
| PDF が想定パスにない | empty mode で続行 (user に通知) |
| PyMuPDF 未インストール | empty mode にフォールバック (PDF 読み skip) |
| vision で読めない (画像が荒い等) | 当該ページの抽出を skip し他ページから集約。失敗ページ数を user に報告 |

## 関連

- 14 ルール出典：[archive/handoffs/lesson_master_rules_handoff_v2.md](../../archive/handoffs/lesson_master_rules_handoff_v2.md)
- 直近 schema 状態：[archive/handoffs/lesson_master_rules_handoff_v19.md](../../archive/handoffs/lesson_master_rules_handoff_v19.md)
- 既存サンプル：[data/lesson_01.json](../../data/lesson_01.json) (formatVersion 2.7 / v2.11.4)
- skill suite 全体：[NEXT_ACTIONS.md § 🆕 (a)](../../NEXT_ACTIONS.md)
- 後続 skill (未実装)：`/lesson-fill-vocab` `/lesson-check` `/lesson-suggest-activities`
  `/lesson-build-registry` (Phase 2-3)
- 全体まとめ docs：[docs/LESSON_SKILLS_MANUAL.md](../../docs/LESSON_SKILLS_MANUAL.md)
