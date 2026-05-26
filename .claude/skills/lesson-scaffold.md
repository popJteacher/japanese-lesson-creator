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
| 「文型」セクションの番号付き例文 | `patterns[].examples[]` (各文の no/sentence) |
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
  B-6  practiceTemplates ≥ 2  ← scaffold が常に保証済
  B-7  materialNeeds 必須対象 = intro_activity, main_activity (他は禁止)
  B-8  推奨時間 (復習 3-5分 / 導入 5-10分 / 文型 3-7分 / メイン 10-20分 / まとめ 2-5分)
  B-9  活動例の必須 field (活動名 / 設定 / 準備物 / 会話例 / fadingStage / ABC対応)
  C-9  Step 1a→1e の順序を守る (今あなたが見ている順序)
  C-10 _meta.changes には変更内容 + 変更理由を両方書く
  C-11 formatVersion (全課共通) と lessonVersion (この課) を _meta に並べる
  C-12 教案の手順は ABC 準拠で書く (課マスターには teachingHint 1-2 文のみ)

次セッション skill (Phase 2 以降):
  /lesson-fill-vocab <NN>       — vocab_catalog + 他課から自動補完
  /lesson-check <NN>            — 14 ルール準拠 lint
  /lesson-suggest-activities    — activity_catalog から activityId 候補提示
  /lesson-build-registry        — master_image/audio_registry pending 生成
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
- 全体まとめ docs (最後に書く)：`docs/SKILLS_MANUAL.md`
