# 課マスター作成 skill suite マニュアル

> 対象：教科書 PDF（みんなの日本語ABC）から `data/lesson_NN.json` を作る作業を、Claude Code の skill で
> 段階的に進めたい人。
> 5 つの skill `/lesson-scaffold` `/lesson-check` `/lesson-fill-vocab` `/lesson-suggest-activities`
> `/lesson-build-registry` の使い方・繋がり・出典 14 ルール対応を 1 ファイルにまとめます。
> 困ったらこのファイルだけ見れば新課を作れるように書きました。
>
> 画像 prompt 系 skill（`/generate-image-prompt` / `/export-skill-prompts`）は別マニュアル
> [`SKILLS_MANUAL.md`](SKILLS_MANUAL.md) を参照。

---

## 0. 全体の流れ（先に絵で把握する）

```
┌─────────────────────────────────────────────────────────────────┐
│ Step A   PDF を data/sources/pdfs/第NN課.pdf に置く（手動）      │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step B   /lesson-scaffold NN                                    │
│            → data/lesson_NN.json を生成（empty or PDF seed）     │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step C   /lesson-check NN  →  /lesson-fill-vocab NN [--apply]   │
│            → 14 ルール lint / 既習語マーク / jlptLevel 補完       │
│              (人間が 1a→1e の順で TODO を潰しながら)              │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step D   /lesson-suggest-activities NN [--type intro|main]      │
│            → flow[] の activityId 候補を提示（read-only）         │
│              user が選んで lesson_NN.json に手で書き戻す          │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step E   /lesson-build-registry NN [--apply]                    │
│            → master_image_registry / master_audio_registry に    │
│              pending entry を追加                                 │
└────────────────┬────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step F   /generate-image-prompt mode=lesson --lesson NN          │
│          /export-skill-prompts --lesson NN                       │
│            → 画像 prompt を起草・.txt 化して UI で画像生成        │
│              （詳細は SKILLS_MANUAL.md）                          │
└─────────────────────────────────────────────────────────────────┘
```

**この suite が守る原則**：

- **read / dry-run を既定**にする。書き戻しは `--apply` 明示が必要
- **書き込まない skill** も用意（`/lesson-check` `/lesson-suggest-activities`）。何度走らせても害なし
- **人間判断が必要なところで止める**（A-1 の PDF 照合、activityId 選定、教育内容の確定）
- **どの skill も npm run validate と /lesson-check を後段でかける前提**で動く

---

## 1. 5 skill の概要表

| Phase | skill | 何をする | 書き込み |
|---|---|---|---|
| 1 | [`/lesson-scaffold NN`](#2-lesson-scaffold----lessonnnjson-の雛形を作る) | `data/lesson_NN.json` の v2.7 schema 雛形を生成。PDF があれば vision で seed | 新規ファイル作成（既存は `--force` 必須） |
| 2 | [`/lesson-check NN`](#3-lesson-check----14-ルール-lint--validatemjs) | 14 ルール lint + `validate.mjs` を 1 コマンドで実行 | なし（read-only） |
| 2 | [`/lesson-fill-vocab NN`](#4-lesson-fill-vocab----既習語マーク--jlptlevel-補完) | 既習語マーク（`_inheritedFromLessonX`）+ `jlptLevel` を `vocab_catalog` から補完 | dry-run 既定 / `--apply` |
| 3 | [`/lesson-suggest-activities NN`](#5-lesson-suggest-activities----activityid-候補提示read-only) | `flow[]` の `activityId` 候補を catalog から scoring | なし（read-only） |
| 3 | [`/lesson-build-registry NN`](#6-lesson-build-registry----レジストリに-pending-entry-を提案) | `master_image_registry` / `master_audio_registry` に pending entry 追加 | dry-run 既定 / `--apply` |

各 skill の詳細スペックは [`.claude/skills/lesson-*.md`](../.claude/skills/) を参照。
本マニュアルは「典型的な使い方」と「他 skill との繋がり」中心にまとめます。

---

## 2. `/lesson-scaffold` — `lesson_NN.json` の雛形を作る

### 2.1 何をする skill か

新しい課を始めるときに、`data/lesson_NN.json` の **v2.7 schema placeholder skeleton** を一発で作る。
教科書 PDF が `data/sources/pdfs/第NN課.pdf` にあれば、vision で読んで `patterns[].examples[]` /
`vocabulary` / `mainActivity` などを pre-fill する（seed mode）。PDF が無ければ TODO だらけの空雛形が出る
（empty mode）。

### 2.2 典型コマンド

```
# (a) PDF を data/sources/pdfs/第03課.pdf に置いてから
/lesson-scaffold 03 --patterns p1,p2,p3,p4

# (b) PDF がまだ無い・無くてもいい場合
/lesson-scaffold 03 --patterns p1,p2,p3 --no-pdf

# (c) 既存 lesson_03.json を完全に上書きしたい時（事故防止のため明示）
/lesson-scaffold 03 --force
```

| 引数 | 既定 | 意味 |
|---|---|---|
| `NN` | 必須 | 課番号 1-99（2 桁 zero-pad） |
| `--patterns p1,p2,...` | `p1` | 生成する pattern ID 列 |
| `--no-pdf` | false | PDF があっても seed mode をスキップ |
| `--force` | false | 既存 `lesson_NN.json` を上書き |
| `--pdf <path>` | 自動 | PDF パス上書き（既定: `data/sources/pdfs/第NN課.pdf`） |

### 2.3 seed mode と empty mode の違い

| 項目 | empty mode | seed mode |
|---|---|---|
| 起動条件 | `--no-pdf` or PDF 不在 | PDF 存在（cache 優先） |
| `lesson.title` 等 | TODO_A-1 placeholder | PDF 抽出値 |
| `patterns[].examples[]` | TODO 1 件のみ | PDF の番号付き例文を全件 |
| `vocabulary` | placeholder 1 group | PDF の語彙リストから rough group |
| `mainActivity` | TODO | PDF の活動例名・fadingStage |
| **生成後の人間 review** | **必須**（A-1） | **必須**（A-1） |

「**seed mode は下書きの量を減らすだけで確定ではない**」。生成後に PDF と照合するのは
A-1 ルールに従って人間が必ずやる。

### 2.4 次にやること（skill の出力に echo される）

```
1a 骨格    : _meta / lesson / textbook_sources を埋める
1b 語彙    : vocabulary.byPattern[].words[] を PDF 照合後に追加（A-1）
1c 例文    : patterns[].examples[] を PDF 照合後に追加（A-1）
1d 教具    : flow[].materialNeeds[] を例文確定後に追加（B-7）
1e 活動    : flow[].activityId を catalog から選定 → /lesson-suggest-activities へ
```

順序（C-9）は **守る**。例文より先に materialNeeds を書かない。activityId は最後。

---

## 3. `/lesson-check` — 14 ルール lint + `validate.mjs`

### 3.1 何をする skill か

`data/lesson_NN.json` に対して

- `npm run validate` と同等の **schema 検査** (`scripts/validate.mjs`)
- **14 ルール lint** (`scripts/lib/lesson-check.mjs`)

を一気に走らせて ERROR / WARN / TODO を可視化する。何度走らせても害なし
（read-only）。`/lesson-scaffold` 直後は TODO だらけになるので、1a→1e の各ステップを
終えるたびに走らせて残 TODO を可視化する想定。

### 3.2 典型コマンド

```
# 通常の lint
/lesson-check 02

# JSON で取り出す（CI / 差分パイプライン用）
/lesson-check 03 --json
```

### 3.3 ERROR / WARN / TODO の見方

| 重大度 | 内容 |
|---|---|
| ERROR | A-2 / A-3 / A-4 形式 / A-5 / A-6 / B-5 / B-6 / B-7 / B-9 / C-11 違反（exit 1） |
| WARN | A-4 文数複数 / B-8 推奨時間範囲外 / C-10 changes 短文 / A-2 記述欠落（exit 0） |
| TODO | 文字列値内の "TODO_*" / "TODO:" を全 path で列挙（exit 0） |

`lesson_01` 実行時に出る代表的 ERROR（既知）：

```
ERROR: 2
  [B-6] patterns[p1].practiceTemplates が 1 件 (≥2 必須)
  [B-6] patterns[p3].practiceTemplates が 1 件 (≥2 必須)
```

これは v2.11.4 で p1/p3 を意図的に 1 template に削減したため。
プロジェクト方針として **ルール側を緩めるか lesson 側を 2 件に戻すか** は user 判断。

### 3.4 lint で見ない領域（chk 対象外）

| ルール | 見ない理由 |
|---|---|
| A-1 | PDF 照合は人間 review 領域 |
| B-5 ③ | 絵カード化不可語の `_note` は人間判断 |
| C-9 | 作業順序は手続的ルール（lint 不可） |
| C-12 | 教案の手順は `lesson_NN.json` 領域外 |

これらは「自動 check できない」だけで「無くてもいい」ではない。
作業中の自己 check 項目として頭に入れておく。

---

## 4. `/lesson-fill-vocab` — 既習語マーク + `jlptLevel` 補完

### 4.1 何をする skill か

`data/lesson_NN.json` の `vocabulary.byPattern[*].words[]` に対して、

1. **既習語彙マーク**：過去課（`lesson_XX.json` で XX < NN）に同じ `(word, reading)` があれば
   `isFirstAppearance: false` + `_inheritedFromLessonX: "lesson_XX"` を付与
2. **`jlptLevel` 補完**：既存値が空 / TODO / enum 外なら `data/vocab_catalog.json` から引いて埋める

の 2 種類の自動補完を行う。これは B-5 の語彙 3 点セット（jlptLevel / 初出 既習 / 絵カード化不可語）
のうち、機械的に決まる前 2 つを自動で埋める。

### 4.2 典型コマンド（必ず dry-run → apply の 2 段階）

```
# Step 1: 何が変わるか確認（書き込まない）
/lesson-fill-vocab 02

# Step 2: 差分が妥当なら適用
/lesson-fill-vocab 02 --apply

# Step 3: 検証
npm run validate
/lesson-check 02
```

### 4.3 skip される（人間判断が必要）ケース

| ケース | 動作 |
|---|---|
| `(word, reading)` が catalog に entry 無し | skip log → catalog 拡張か手動入力 |
| catalog の source が **複数 jlpt で disagree** (例: `['N4','N5']`) | skip log → 教材方針で手動判定 |
| 既存値が **N5-N1 のいずれか**（人間が既に入れた値） | **上書きしない**（人間値を尊重） |
| `_inheritedFromLessonX` が既に違う課に設定されている | skip（user 値を尊重） |

「人間値は触らない」が原則。skill が触るのは TODO / 空 / 明らかに catalog 由来で決まるもの だけ。

### 4.4 表記の罠

- **catalog の reading は学習者向けひらがな**。「腕時計」は「うでどけい」で完全一致が必要。
  カタカナ書き or 漢字 reading のままだと match しない（skip される）
- **ます形 vs 辞書形**：catalog は基本辞書形（起きる）で保持。lesson 側がます形（起きます）だと
  catalog hit しない → `jlptLevel` 補完だけ skip される（inheritance は別 path で生きる）

---

## 5. `/lesson-suggest-activities` — `activityId` 候補提示（read-only）

### 5.1 何をする skill か

`data/lesson_NN.json` の `flow[]` を走査し、`type ∈ {intro_activity, main_activity}` の各 step に対して、
`intro_activity_catalog.json` / `activity_catalog.json` から **scoring 付きで候補を提示**する。
書き込まない（read-only）。

scoring は

- 文型の `grammarConcept` との一致
- `prerequisitePatterns[]` の充足（過去課 + 当課の grammarConcept 集合と照合）
- `level[]` / `applicableLessons[]` / `stage[]` / `validatedForLessons[]` / `textbookOrigins[]`
  の各 hit
- ★ 既設定 `activityId` は +100（必ず top に来る）

を heuristic で合算したもの。出力の `★` 印は「既に lesson に設定されている activityId」。

### 5.2 典型コマンド

```
# 全 intro/main step の上位 5 候補
/lesson-suggest-activities 03

# intro_activity だけ、上位 3 候補
/lesson-suggest-activities 03 --type intro --top 3

# main_activity を JSON で（差分パイプライン用）
/lesson-suggest-activities 02 --type main --json
```

### 5.3 出力の読み方

```
▼ flow[intro_act_p1] (type=intro_activity, patternRef=p1)
  context: targetJlpt=N5, grammarConcept=noun_predicate_affirmative, fadingStage=stage1
  current: activityId=act_picture_card_vocab_intro
  候補 top 5:
    ★ score= 125 act_picture_card_vocab_intro  「絵カードによる語彙・基本文型導入」
             - ★ 現在セット済み (activityId=act_picture_card_vocab_intro)
             - prerequisitePatterns 全て satisfied
       score=  25 act_qa_pattern_intro          「絵カードによる疑問文・応答導入」
       ...
```

判断ポイント：

- ★ が top に来ていれば現状維持で OK
- ★ が top でなく、別の候補が score 上位 → 入れ替え候補（user が教育的に判定）
- score < 0 は事実上除外（level / applicableLessons 不一致）

### 5.4 採用したら手で書き戻す

この skill は **書き込まない**。採用 `activityId` は user が手で `lesson_NN.json` に書く。
書き込み後は：

```
/lesson-check NN     # B-9 含む 14 ルール lint
npm run validate     # schema
```

### 5.5 scoring の限界

- N5 教材を N4 で再利用したい場合は手動で `activityId` をセットして良い（skill の score を
  絶対基準にしない）
- 当課より前の `lesson_*.json` が無ければ `knownGrammarConcepts` は当課分のみ
- catalog の重複登録（intro 系活動が main にも登録されている等）はそのまま候補に出る

---

## 6. `/lesson-build-registry` — レジストリに pending entry を提案

### 6.1 何をする skill か

`data/lesson_NN.json` が参照する全 `imageId` / `audioId` について、対応する pending entry が
`master_image_registry.json` / `master_audio_registry.json` に無ければ提案する。
dry-run 既定 / `--apply` で書き戻し。

これを走らせると、新課を追加した直後でも、画像 prompt 起草 (`/generate-image-prompt`) や
音声生成 (`generate-audio`) パイプラインが registry を読んでそのまま動く状態になる。

### 6.2 典型コマンド

```
# dry-run
/lesson-build-registry 03

# 適用
/lesson-build-registry 03 --apply

# 後続
npm run validate
/lesson-check 03
```

### 6.3 走査対象

| ソース | imageId | audioId |
|---|---|---|
| `vocabulary.byPattern[*].words[].imageId / audioId` | ✓ | ✓ |
| `patterns[].examples[].imageId / audioId` | ✓ | ✓ |
| `flow[].materialNeeds[].type === 'auto_generated_vocab'` の `keywords[]` | △ | × |

△：vocabulary 配下に既に entry がある word は **二重提案しない**。
keyword に「(generic elderly man with white hair)」のような **括弧内説明** が付いている場合は
括弧以降を strip して基底語のみ採用する。

### 6.4 既存判定

| registry の状態 | 動作 |
|---|---|
| 同 id 存在 + `usedInLessons` に NN 含む | `existing OK`（no-op） |
| 同 id 存在 + `usedInLessons` に NN 不在 | `usedInLessons updates`（`--apply` で NN 追加） |
| 同 id 不在 | `new pending entries`（`--apply` で pending entry を追加） |
| lesson 側に imageId / audioId が無い | `lesson refs w/o id`（警告。lesson 側に id 付与が必要） |

### 6.5 命名 prefix の罠（`word_` vs `vocab_`）

- 当課 `vocabulary[].imageId` が `word_*` を 1 つでも使っていれば、keyword 提案も `word_` prefix
- すべて `vocab_*` または imageId 不在なら `vocab_` prefix（デフォルト）

lesson_01 が legacy convention で `word_*` を使い続け、lesson_02+ が `vocab_*` に統一しているため、
**当課の慣習に合わせる**。手で書き換えて統一しても OK。

### 6.6 制約

- **id は lesson 側が決める**。skill は「lesson が言う id」を registry に登録するだけ
  （新規 id を生成しない）。例外は keyword の guess のみ
- **`promptRef` は guess**（`image_prompts_lesson{NN}.json#{imageId}` の形）。
  lesson_01 は `image_prompts_lesson01_v4_0.json` 等の version 違いを使っているので、
  生成後に手で書き直して良い（promptRef は reference であって SSOT ではない）
- **audio entry の `naturalness` 等は付けない** — 後段の TTS 生成 + QC が埋める

---

## 7. 14 ルール出典対応表

ルール出典：[`archive/handoffs/lesson_master_rules_handoff_v2.md` §3](../archive/handoffs/lesson_master_rules_handoff_v2.md)
（原本では「全14項目」と呼称されているが実際の項目数は **15**。慣用的に「14 ルール」と呼ぶ）。

各ルールに対して、どの skill / 工程で機械化されているかをまとめる。
chk 対象外（人間 review 領域）は灰色背景イメージで読む。

### A：必須ルール（これが無いと課マスターが壊れる）

| # | ルール | 機械化 skill | 自動化レベル |
|---|---|---|---|
| **A-1** | 例文は PDF 照合してから書く | （`/lesson-scaffold` が seed mode で支援） | **人間 review 必須**（chk 不可） |
| **A-2** | 教科書にない人物を作らない | `/lesson-check`（namedCharacters[] の name/id 必須） | ERROR + WARN |
| **A-3** | 教科書の固有名詞を変えた時は `replacementNote` に理由 | `/lesson-check`（examples[].originalSources[]） | ERROR |
| **A-4** | canDo は「〜できる」で 1 文型 1 文 | `/lesson-check`（末尾形 + 文数） | ERROR（形式）+ WARN（文数） |
| **A-5** | `vocabType` を全語に付与 | `/lesson-check`（enum 4 値） | ERROR |
| **A-6** | `imageRole` を全語・全例文に付与 | `/lesson-check`（enum 4 値） | ERROR |

### B：品質ルール（これが無いと課によってバラつく）

| # | ルール | 機械化 skill | 自動化レベル |
|---|---|---|---|
| **B-5** ① | `jlptLevel` を書く | `/lesson-fill-vocab`（catalog から補完） + `/lesson-check`（enum 値） | 自動補完 + ERROR |
| **B-5** ② | 初出 / 既習を書く（`_inheritedFromLessonX`） | `/lesson-fill-vocab`（過去課走査） + `/lesson-check`（boolean 検査） | 自動補完 + ERROR |
| **B-5** ③ | 絵カード化不可語の理由を `_note` に書く | （chk 対象外） | **人間 review 必須** |
| **B-6** | `practiceTemplates` 最低 2 つ | `/lesson-scaffold`（常に 2 件保証） + `/lesson-check`（件数） | ERROR |
| **B-7** | `materialNeeds[]` 必須対象 = intro_activity, main_activity | `/lesson-check`（type 別政策） | ERROR |
| **B-8** | 推奨時間目安（復習 3-5 / 導入 5-10 / 文型 3-7 / メイン 10-20 / まとめ 2-5） | `/lesson-check`（範囲外検出） | WARN |
| **B-9** | 活動例の必須 field（活動名 / 設定 / 準備物 / 会話例 / fadingStage / ABC 対応） | `/lesson-check`（ABCactivityRef 検査）+ `/lesson-suggest-activities`（候補提示） | ERROR + 候補補助 |

### C：運用ルール（作業効率に関わる）

| # | ルール | 機械化 skill | 自動化レベル |
|---|---|---|---|
| **C-9** | Step 1a→1e の順序を守る | （`/lesson-scaffold` が出力で順序を示唆） | **人間遵守事項**（chk 不可） |
| **C-10** | `_meta.changes` には変更内容 + 変更理由を両方書く | `/lesson-check`（30 文字以上） | WARN |
| **C-11** | `formatVersion`（全課共通）+ `lessonVersion`（この課）両方並べる | `/lesson-check`（存在検査） | ERROR |
| **C-12** | 教案の手順は ABC 準拠で書く（課マスターには teachingHint 1-2 文のみ） | （chk 対象外） | **人間 review 必須** |

### この対応表の使い方

- 新課を作る時に「**A-1 / B-5 ③ / C-9 / C-12** は機械では見られない」ことを意識
- `/lesson-check` で ERROR が出たら、上の表で「どのルールか」を見て対処方針を決める
- B-5 ①② と B-9 は **複数 skill で重畳的にカバー**されている（fill-vocab の補完 + check の lint /
  suggest-activities の候補提示 + check の B-9 検査）

---

## 8. 典型ワークフロー

### 8.1 新課を一から作る（第 NN 課の PDF が手元にある場合）

```
# 0. PDF を置く（手動）
cp ~/Downloads/第NN課.pdf data/sources/pdfs/

# 1. lesson_NN.json の骨格を生成（PDF seed mode）
/lesson-scaffold NN --patterns p1,p2,p3,p4

# 2. lint で TODO を可視化
/lesson-check NN

# 3. 1a (骨格) → 1b (語彙) → 1c (例文) を手で埋めながら /lesson-check を反復

# 4. 既習語マーク・jlptLevel を自動補完
/lesson-fill-vocab NN          # dry-run で確認
/lesson-fill-vocab NN --apply

# 5. 1d (materialNeeds) を手で埋める

# 6. activityId 候補を提示
/lesson-suggest-activities NN

# 7. 採用した activityId を手で lesson_NN.json に書く

# 8. 14 ルール最終 lint
/lesson-check NN
npm run validate

# 9. レジストリに pending entry を追加
/lesson-build-registry NN              # dry-run
/lesson-build-registry NN --apply

# 10. 画像 prompt 起草 + .txt 化（詳細は SKILLS_MANUAL.md）
/generate-image-prompt mode=lesson --lesson NN
/export-skill-prompts --lesson NN
```

### 8.2 既存課を改善する（lesson_02 を見直したい）

```
# 1. 現状把握
/lesson-check 02

# 2. 既習語マークだけ更新（catalog が拡張された後など）
/lesson-fill-vocab 02

# 3. activityId を再評価
/lesson-suggest-activities 02

# 4. registry に漏れが無いか確認
/lesson-build-registry 02
```

### 8.3 catalog だけ更新したい（17,508 語の `vocab_catalog.json` に新規語追加 etc）

このマニュアルの範囲外。`scripts/extract-and-classify.mjs` / `data/vocab_catalog.json` の
直接編集で対応。`/lesson-fill-vocab` は catalog が更新されると自動的に新値を引くので、
catalog 更新後に各課で再走するのが順序。

---

## 9. こんなときどうする？

### Q1. PDF が無い課で `/lesson-scaffold` するとどうなる？

`empty mode` で全 TODO 雛形が出る。`--patterns p1,p2,p3` だけは正しく付ければ
構造の枠は出来上がる。あとは手で埋める。

### Q2. `/lesson-fill-vocab` で skip された語をどう扱う？

skip log に `(word, reading)` と理由（catalog 不在 / source disagree）が出る。
catalog 不在なら catalog 側を拡張するか、`jlptLevel` を手動で入れる。
source disagree なら教材方針で手動判定（例：「アメリカ人」が `['N4','N5']` で割れていたら
教科書 ABC の初出位置で決める）。

### Q3. `/lesson-suggest-activities` の score がトップでも違和感がある時

skill の score は heuristic。教育的判断（学習者属性・前後課との繋がり）は user が最終決定する。
score < 0 でも教育的に妥当なら採用して良い。ただし `/lesson-check` の B-9 ERROR が出るので、
`ABCactivityRef.fadingStage` や `playerSteps[]` を完備しているか確認。

### Q4. `/lesson-build-registry --apply` で書き戻した後に画像生成が動かない

順番にチェック：

1. `npm run validate` の invariants が PASS するか（hash 不整合は registry 変更が原因の可能性）
2. `master_image_registry.json` の `_meta.lastModified` が今日の日付に更新されているか
3. `image_prompts_lesson{NN}.json` の path が `promptRef` と一致しているか（lesson_01 は version 違い）

### Q5. lesson_01 の B-6 ERROR は直す？

p1/p3 を意図的に 1 template に削減した経緯がある（v2.11.4）。
**ルール側を緩めるか lesson 側を 2 件に戻すか** は user が教育的に判定する案件。
現状はそのまま運用可（ERROR 2 件は既知）。

### Q6. skill が `/lesson-` で見えない・候補に出ない

Claude Code 起動時に `.claude/skills/lesson-*.md` を読み込めていない可能性。

1. `cd c:\Users\kohn0\Desktop\japanese-lesson-creator-main` で起動 directory 確認
2. `claude` を一度 `exit` で抜けて再起動
3. `.claude/skills/lesson-scaffold.md` 等が物理的に存在するか確認

### Q7. このマニュアルが古くなったら？

skill の引数や挙動を変えた時、本マニュアルの **§1 概要表 / §2-6 各 skill 章 / §7 14 ルール表** を
合わせて更新する。`.claude/skills/lesson-*.md` を真実とし、本マニュアルは「初心者向け要約」と
位置付ける。

---

## 10. 関連ドキュメント

| ファイル | 用途 |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | プロジェクト不変ルール |
| [`NEXT_ACTIONS.md`](../NEXT_ACTIONS.md) | 現在地・次の行動（1 ページ） |
| [`docs/WORKFLOW.md`](WORKFLOW.md) | main / worktree 役割分担 |
| [`docs/REFERENCE.md`](REFERENCE.md) | 不変の仕様・スキーマ |
| [`docs/MIGRATION_PLAN.md`](MIGRATION_PLAN.md) | Phase 0〜5 ロードマップ |
| [`docs/SKILLS_MANUAL.md`](SKILLS_MANUAL.md) | **画像 prompt 系 skill** マニュアル（`/generate-image-prompt` / `/export-skill-prompts`） |
| [`archive/handoffs/lesson_master_rules_handoff_v2.md`](../archive/handoffs/lesson_master_rules_handoff_v2.md) | 14 ルール出典（§3） |
| [`.claude/skills/lesson-scaffold.md`](../.claude/skills/lesson-scaffold.md) | `/lesson-scaffold` 詳細仕様 |
| [`.claude/skills/lesson-check.md`](../.claude/skills/lesson-check.md) | `/lesson-check` 詳細仕様 |
| [`.claude/skills/lesson-fill-vocab.md`](../.claude/skills/lesson-fill-vocab.md) | `/lesson-fill-vocab` 詳細仕様 |
| [`.claude/skills/lesson-suggest-activities.md`](../.claude/skills/lesson-suggest-activities.md) | `/lesson-suggest-activities` 詳細仕様 |
| [`.claude/skills/lesson-build-registry.md`](../.claude/skills/lesson-build-registry.md) | `/lesson-build-registry` 詳細仕様 |
| [`scripts/lib/lesson-*.{mjs,py}`](../scripts/lib/) | skill が呼ぶヘルパー実装 |

---

## 11. このマニュアルのメンテナンス

- 新しい skill を suite に追加 → §1 概要表 + 新章を追加
- 既存 skill に引数追加 → 対応する §2-6 の章
- 14 ルールの追加・変更 → §7 対応表 + 出典 `lesson_master_rules_handoff_v2.md` も更新
- ワークフロー変更 → §0 全体図 + §8 典型ワークフロー
