---
name: lesson-suggest-activities
description: For each flow step of type intro_activity / main_activity in lesson_NN.json, propose activityId candidates from intro_activity_catalog / activity_catalog, scored by pattern jlptLevel, grammarConcept, fadingStage, prerequisitePatterns. Read-only. Phase 3 of the 課マスター作成 skill suite.
allowed-tools: Read, Bash, Glob, Grep
---

# lesson-suggest-activities skill

課マスター作成 skill suite の **Phase 3 候補提示**。`data/lesson_NN.json` の
`flow[]` を走査し、`type ∈ {intro_activity, main_activity}` の各 step に対して、
適合する `activityId` 候補を catalog から絞り込んで score 付きで提示する。

`/lesson-scaffold` 直後で各 flow step の `activityId` が TODO のとき、
あるいは既設定 activityId が妥当か再評価したい時に使う。**read-only**
（lesson_NN.json は変更しない）。

ルール出典：[archive/handoffs/lesson_master_rules_handoff_v2.md §3 B-9](../../archive/handoffs/lesson_master_rules_handoff_v2.md#L75)
(活動例の必須 field — 活動名 / 設定 / 準備物 / 会話例 / fadingStage / ABC 対応)。

## 使い方

```
/lesson-suggest-activities NN [--type intro|main|all] [--top N] [--json]
```

| 引数 | 既定 | 説明 |
|---|---|---|
| `NN` (positional) | 必須 | 課番号 1-99。2 桁 zero-pad で扱う |
| `--type T` | `all` | `intro` / `main` / `all` で対象 step を絞る |
| `--top N` | 5 | 各 step ごとの候補表示件数 |
| `--json` | false | JSON 出力 (CI / 差分パイプライン用) |

### 例

```
# 全 intro/main step の上位 5 候補
/lesson-suggest-activities 03

# intro_activity だけ、上位 3 候補
/lesson-suggest-activities 03 --type intro --top 3

# main_activity だけ JSON で
/lesson-suggest-activities 02 --type main --json
```

## 手順 (skill 実行フロー)

### Step 1: 引数解釈と既存ファイル check

`NN` を 2 桁 zero-pad。`data/lesson_NN.json` / `data/intro_activity_catalog.json` /
`data/activity_catalog.json` が無ければ即 abort。

### Step 2: helper を起動

```bash
node scripts/lib/lesson-suggest-activities.mjs --no NN [--type T] [--top N]
```

出力例 (lesson_01 / `intro_act_p1` 部分):

```
▼ flow[intro_act_p1] (type=intro_activity, patternRef=p1)
  context: targetJlpt=N5, grammarConcept=noun_predicate_affirmative, fadingStage=stage1
  current: activityId=act_picture_card_vocab_intro
  候補 top 5:
    ★ score= 125 act_picture_card_vocab_intro  「絵カードによる語彙・基本文型導入」
             - ★ 現在セット済み (activityId=act_picture_card_vocab_intro)
             - prerequisitePatterns 全て satisfied
       score=  25 act_qa_pattern_intro  「絵カードによる疑問文・応答導入」
             - prerequisitePatterns 全て satisfied
       ...
```

### Step 3: user に結果を渡す

- ★ 印は **既に lesson に設定済みの activityId**。多くの場合 top に来るはず
- score がトップでも ★ と異なる候補があれば、user に「現状維持か入れ替えか」を相談
- score < 0 は事実上除外（level 不一致等）

### Step 4: 採用した activityId は手動で lesson_NN.json に書き込む

このスキルは **書き込まない**。候補から user が選んだ activityId を編集して
入れる。書き込み後は:

```
/lesson-check NN     # 14 ルール lint (B-9 含む)
npm run validate     # schema
```

## スコアリング詳細

### intro_activity (intro_activity_catalog.json から候補)

| 観点 | 点 |
|---|---|
| `applicablePatternScope` がパターンの `grammarConcept` と完全一致 | +50 |
| `applicablePatternScope` と `grammarConcept` が部分マッチ (substring) | +20 |
| `prerequisitePatterns[]` が全て satisfied (過去課 + 当課の grammarConcept 集合) | +20 |
| `prerequisitePatterns[]` が未充足 1 件ごと | −10 |
| `reusableInLessons === 'all'` または当課番号を明示 | +5 |
| `reusableInLessons === 'all_*'` (scope 限定 hint) | +2 |
| ★ 既設定 activityId と一致 | +100 (sort top) |

### main_activity (activity_catalog.json から候補)

| 観点 | 点 |
|---|---|
| `level[]` に targetJlpt を含む | +30 |
| `level[]` に targetJlpt 不在 | −100 (除外) |
| `applicableLessons === 'all'` | +10 |
| `applicableLessons[]` に当課番号を明示 | +30 |
| `applicableLessons[]` 配列で当課不在 | −100 (除外) |
| `stage[]` と step の `ABCactivityRef.fadingStage` が一致 | +20 |
| `prerequisitePatterns[]` 全て satisfied | +15 |
| `prerequisitePatterns[]` 部分 satisfied (1 件 ×5) | +5 〜 |
| `prerequisitePatterns[]` 全て未充足 | −30 |
| `validatedForLessons[]` に当課番号 | +25 |
| `textbookOrigins[]` に当課由来 | +25 |
| ★ 既設定 activityId と一致 | +100 (sort top) |

### 「targetJlpt」の決定優先順位

1. `lesson.targetStudentLevel` (新 enum field、未導入の課ではこれは無い)
2. `patterns[patternRef].jlptLevel` (step に patternRef がある場合)
3. `"N5"` (fallback)

### 「knownGrammarConcepts」の集合

- 過去課 (lesson_01..lesson_NN-1) の `patterns[].grammarConcept` 全部
- 当課 (lesson_NN) の `patterns[].grammarConcept` 全部

これは `prerequisitePatterns[]` の充足判定に使う。当課のパターン同士は
**互いに既習扱い**（順序を厳密に見ない簡易実装）。

## 制約

- **書き込まない** — 候補を提示するだけ。activityId の確定は user 判断
- **catalog の重複登録**：`activity_catalog.json` には intro 系 3 件
  (`act_picture_card_vocab_intro` / `act_qa_pattern_intro` / `act_attribute_modeling_intro`)
  が main 候補としても登録されているので、main_activity の候補リストにも出る。これは
  catalog 設計上の選択 (intro 活動を main としても再利用できる)
- **fadingStage の表記揺れ**：`"stage4〜5"` / `"stage1"` 等を許容するために
  `〜/、,スペース/` で split して照合
- **scoring は heuristic** — N5 教材を N4 で再利用したい場合は手動で
  activityId をセットして良い (skill の score を絶対基準にしない)
- **過去課 grammarConcept の網羅性**：当課より前の lesson_*.json が無ければ
  `knownGrammarConcepts` は当課分のみ
- **applicableLessons の 'all'** は弱い適合 (+10)、明示 list inclusion は強い (+30)

## 失敗時の動作

| 状況 | 動作 |
|---|---|
| `NN` 範囲外 (1-99 以外) | exit 2 |
| `data/lesson_NN.json` 不在 | exit 2 |
| `data/intro_activity_catalog.json` 不在 | exit 2 |
| `data/activity_catalog.json` 不在 | exit 2 |
| JSON parse error | exit 2 |
| 候補ゼロ件 (全 score < -50) | 該当 step に「候補なし」表示 (exit 0) |

read-only なので副作用無く何度でも実行できる。

## 関連

- 14 ルール B-9: [archive/handoffs/lesson_master_rules_handoff_v2.md](../../archive/handoffs/lesson_master_rules_handoff_v2.md)
- catalog 構造: [data/activity_catalog.json](../../data/activity_catalog.json) (58 件) /
  [data/intro_activity_catalog.json](../../data/intro_activity_catalog.json) (8 件)
- 兄弟 skill: [/lesson-scaffold](lesson-scaffold.md) (Phase 1) /
  [/lesson-check](lesson-check.md) + [/lesson-fill-vocab](lesson-fill-vocab.md) (Phase 2) /
  [/lesson-build-registry](lesson-build-registry.md) (同 Phase 3)
- 全体まとめ docs: [docs/LESSON_SKILLS_MANUAL.md](../../docs/LESSON_SKILLS_MANUAL.md)
