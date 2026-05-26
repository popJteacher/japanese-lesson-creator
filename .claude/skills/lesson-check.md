---
name: lesson-check
description: Lint a lesson_NN.json against the 14 master rules (A-2 ~ C-11) and run npm run validate. Reports ERROR / WARN / TODO and exits non-zero on ERROR. Phase 2 of the 課マスター作成 skill suite.
allowed-tools: Read, Bash, Glob, Grep
---

# lesson-check skill

課マスター作成 skill suite の **Phase 2 lint**。`data/lesson_NN.json` に
対して 14 ルール (出典: [archive/handoffs/lesson_master_rules_handoff_v2.md §3](../../archive/handoffs/lesson_master_rules_handoff_v2.md#L75))
を機械的に適用する。schema 検査 (`validate.mjs`) と組み合わせて使う。

`/lesson-scaffold` で生成した直後は TODO だらけになるので、1a→1e の各
ステップを終えるたびに `/lesson-check NN` を走らせて残 TODO を可視化する
ことを想定。

## 使い方

```
/lesson-check NN [--json]
```

| 引数 | 既定 | 説明 |
|---|---|---|
| `NN` (positional) | 必須 | 課番号 1-99。2 桁 zero-pad で扱う |
| `--json` | false | JSON 出力 (CI 用) |

### 例

```
/lesson-check 02         # data/lesson_02.json に対する lint レポート
/lesson-check 03 --json  # JSON で取り出す (差分パイプライン用)
```

## 手順 (skill 実行フロー)

### Step 1: 引数解釈と既存ファイル check

`NN` を 2 桁 zero-pad。`data/lesson_NN.json` が存在しなければ即 abort
(まず `/lesson-scaffold NN` を促す)。

### Step 2: schema 検査 (`validate.mjs`) を走らせる

```bash
node scripts/validate.mjs data/lesson_NN.json
```

これは _meta.lessonVersion / examples の必須 field / imageId 命名規則 /
flow per-pattern 構造 等の **schema 軸** を見る。

### Step 3: 14 ルール lint を走らせる

```bash
node scripts/lib/lesson-check.mjs --no NN
```

| 重大度 | 内容 |
|---|---|
| ERROR | A-2 / A-3 / A-4 形式 / A-5 / A-6 / B-5 / B-6 / B-7 / B-9 / C-11 違反 |
| WARN | A-4 文数 (複数文 canDo) / B-8 推奨時間範囲外 / C-10 changes 短文 / A-2 記述欠落 |
| TODO | 文字列値内の "TODO_*" / "TODO:" を全 path で列挙 |

ERROR > 0 で exit code 1。

### Step 4: user にガイダンスを echo

下記テンプレを出す:

```
✅ data/lesson_<NN>.json の lint 完了
  schema (validate.mjs): <PASS|FAIL>
  14 ルール: ERROR <N> / WARN <N> / TODO <N>

残 TODO は 1a→1e の順で潰す (出典: §C-9):
  1a 骨格 → 1b 語彙 → 1c 例文 → 1d 教具 → 1e 活動

他 skill との関係:
  /lesson-fill-vocab <NN>  — TODO_B-5 (jlptLevel) や _inheritedFromLessonX を自動補完
  /lesson-scaffold <NN>    — まだ data/lesson_NN.json を作っていない場合
```

## 14 ルールの check 内容

| ルール | 重大度 | check 内容 |
|---|---|---|
| A-1 | (chk 対象外) | PDF 照合は人間 review 領域 |
| A-2 | ERROR + WARN | namedCharacters[] 各エントリに name/id 必須 (ERROR)、occupation/role/source/etc 何か (WARN) |
| A-3 | ERROR | examples[].originalSources[] で sentence != originalSentence なら replacementNote 必須 (TODO_A-3 不可) |
| A-4 形式 | ERROR | canDo 末尾が可能形 (できる/できます/られる/える/せる/etc) で終わる |
| A-4 文数 | WARN | canDo が 1 文か (複数文は意図的な場合あり) |
| A-5 | ERROR | words[].vocabType ∈ {vocabulary_card, actual_object, scene_picture, contrast_picture} |
| A-6 | ERROR | words[].imageRole + examples[].imageRole ∈ {vocab_person, vocab_object, scene, contrast} |
| B-5 ① | ERROR | jlptLevel ∈ {N5,N4,N3,N2,N1} |
| B-5 ② | ERROR | isFirstAppearance が boolean |
| B-5 ③ | (chk 対象外) | 絵カード化不可語の `_note` は人間 review 領域 |
| B-6 | ERROR | practiceTemplates.length >= 2 |
| B-7 | ERROR | type 別 materialNeeds 政策 (intro_activity/main_activity 必須、review/intro_slide/example/wrapUp 禁止、pattern/practice optional)、TODO_B-7 不可 |
| B-8 | WARN | _recommendedMinutes が目安範囲内か (review 3-5 / intro_activity 5-10 / pattern 3-7 / main_activity 10-20 / wrapUp 2-5) |
| B-9 | ERROR | main_activity (skipped=false) の ABCactivityRef に activityName/fadingStage/taskType + playerSteps[] 非空 |
| C-9 | (chk 対象外) | 作業順序は手続的ルール (lint 不可) |
| C-10 | WARN | _meta.changes[] 各エントリは 30 文字以上 (object 形式は { version, changes[] } を再帰 check) |
| C-11 | ERROR | _meta.formatVersion + _meta.lessonVersion 両方存在 |
| C-12 | (chk 対象外) | 教案の手順は lesson_NN.json 領域外 |

## 出力例 (lesson_01 を実行した時)

```
checked: data/lesson_01.json
ERROR: 2
  [B-6] patterns[p1].practiceTemplates が 1 件 (≥2 必須)
  [B-6] patterns[p3].practiceTemplates が 1 件 (≥2 必須)
WARN:  3
  [A-4] patterns[p2].canDo が 2 文 (ルール上は 1 文。意図的なら無視可)
  [B-8] flow[pattern_p1](type=pattern) _recommendedMinutes=8 分が目安範囲 3-7 分の外
  [B-8] flow[pattern_p2](type=pattern) _recommendedMinutes=8 分が目安範囲 3-7 分の外
TODO:  0
```

(B-6 ERROR は project の v2.11.4 で p1/p3 を意図的に 1 template に削減したため。user が ルール側か lesson 側を更新するかを決定する。)

## 制約

- **lint は判定の補助、確定権は人間** — A-1 / A-3 の人物原典判定 / C-9 順序 / C-12 教案 は機械化不可
- **TODO スキャンは全文字列値を再帰** — `_comment` フィールドに「TODO」と書かれた長文も拾うので、本物の TODO と人間メモを区別したい場合は --json で path を見て filter する
- **lesson_NN.json が無い**ときは即 abort。`/lesson-scaffold NN` を先に走らせる
- **WARN / TODO は exit 0** — CI で blocking したいなら ERROR のみで判定する

## 失敗時の動作

| 状況 | 動作 |
|---|---|
| `NN` 範囲外 (1-99 以外) | exit 2 |
| `data/lesson_NN.json` が無い | exit 2 + メッセージ |
| JSON parse error | exit 2 |
| ERROR > 0 | exit 1 (lint 失敗) |
| ERROR = 0 (WARN / TODO 残あり) | exit 0 |

## 関連

- 14 ルール出典: [archive/handoffs/lesson_master_rules_handoff_v2.md](../../archive/handoffs/lesson_master_rules_handoff_v2.md)
- schema 検査: [scripts/validate.mjs](../../scripts/validate.mjs)
- 兄弟 skill: [/lesson-scaffold](lesson-scaffold.md) (Phase 1) / `/lesson-fill-vocab` (本 Phase 同時) / `/lesson-suggest-activities` `/lesson-build-registry` (Phase 3 未実装)
- 全体まとめ docs (最後に書く): `docs/SKILLS_MANUAL.md`
