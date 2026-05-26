---
name: lesson-fill-vocab
description: Fill `_inheritedFromLessonX` from earlier lessons and fill missing `jlptLevel` from vocab_catalog for lesson_NN.json vocabulary words. Dry-run by default; --apply writes back. Phase 2 of the 課マスター作成 skill suite.
allowed-tools: Read, Bash, Glob, Grep
---

# lesson-fill-vocab skill

課マスター作成 skill suite の **Phase 2 補完**。`data/lesson_NN.json` の
`vocabulary.byPattern[*].words[]` に対して 2 種類の自動補完を行う：

1. **既習語彙マーク**：過去課 (`lesson_XX.json` で XX < NN) に同じ
   (word, reading) があれば `isFirstAppearance: false` +
   `_inheritedFromLessonX: "lesson_XX"` を付与
2. **jlptLevel 補完**：既存値が空/TODO/enum 外なら `data/vocab_catalog.json`
   の `bySource[*].jlpt` から引いて埋める

ルール出典：[archive/handoffs/lesson_master_rules_handoff_v2.md §3 B-5](../../archive/handoffs/lesson_master_rules_handoff_v2.md#L75)
(語彙3点セット — JLPT・初出/既習・絵カード化不可語の理由)。

## 使い方

```
/lesson-fill-vocab NN [--apply] [--json]
```

| 引数 | 既定 | 説明 |
|---|---|---|
| `NN` (positional) | 必須 | 課番号 1-99。2 桁 zero-pad で扱う |
| `--apply` | false | data/lesson_NN.json を上書き (既定: dry-run のみ) |
| `--json` | false | JSON 出力 (CI / 差分パイプライン用) |

### 例

```
# dry-run (既定): 差分を表示するだけ。書き込まない
/lesson-fill-vocab 02

# 適用 (書き戻す)
/lesson-fill-vocab 02 --apply
```

## 手順 (skill 実行フロー)

### Step 1: 引数解釈と既存ファイル check

`NN` を 2 桁 zero-pad。`data/lesson_NN.json` が無ければ即 abort
(`/lesson-scaffold NN` を促す)。

### Step 2: helper を dry-run で起動

```bash
node scripts/lib/lesson-fill-vocab.mjs --no NN
```

差分が出る。例：
```
target: data/lesson_02.json
mode:   dry-run (no changes written)
changes: 1
  [p1_distant_building] 病院(びょういん) _inheritedFromLessonX: (unset) → "lesson_01" (set first-appearance lesson)
skipped: 0
```

### Step 3: user に確認 → --apply

人間が差分を見て妥当と判断したら、`--apply` 付きで再実行して書き戻す：

```bash
node scripts/lib/lesson-fill-vocab.mjs --no NN --apply
```

書き戻し後は **必ず** `npm run validate` を走らせて schema が崩れていない
ことを確認する。

### Step 4: 残作業を user に echo

下記テンプレを出す:

```
✅ data/lesson_<NN>.json の vocab 補完完了
   inheritance マーク: <N> 件
   jlptLevel 補完:     <N> 件
   skip 件数:          <N> 件 (catalog 不在 or source disagree)

skip された語彙は人間判断:
  - vocab_catalog に entry 無い場合 → catalog 側を拡張するか、jlptLevel を手動で入れる
  - source disagree (例: ['N4', 'N5']) → 教材方針に従って手動で入れる

次に推奨:
  /lesson-check <NN>    — 補完後の lint 再走
  npm run validate      — schema 検査
```

## 補完ロジック詳細

### (1) inheritance マーク

| 条件 | 動作 |
|---|---|
| (word, reading) が過去課に**未**登場 | 何もしない |
| (word, reading) が過去課にあり、`isFirstAppearance !== false` | `isFirstAppearance: false` に上書き |
| (word, reading) が過去課にあり、`_inheritedFromLessonX` 未設定 | 最初に登場した課を `lesson_XX` 形式でセット |
| (word, reading) が過去課にあり、`_inheritedFromLessonX` 既設定で異なる課 | user 値を尊重して**上書きしない** (skip log に出す) |

「最初に登場した課」は lesson_NN.json を昇順で走査して最初に hit した課。

### (2) jlptLevel 補完

| 条件 | 動作 |
|---|---|
| 既存値が N5-N1 のいずれか | **上書きしない** (人間値を尊重) |
| 既存値が空/未定義 + catalog に entry 無し | skip log に出す |
| 既存値が TODO + catalog の source が **1 種類の jlpt** | catalog 値で fill |
| 既存値が TODO + catalog の source が **複数 jlpt で disagree** | skip log に出す (人間判断) |

## 制約

- **vocab_catalog の reading 表記は学習者向けひらがな** — 「腕時計」(うでどけい) のような
  訓読み単語は厳格 match (`(word, reading)` 完全一致)。lesson 側でカタカナ書きと
  catalog 側でひらがな書きが食い違う場合は match しない (skip される)
- **ます形 vs 辞書形** — catalog は基本辞書形 (起きる) で保持。lesson 側が
  ます形 (起きます) で書く場合 catalog hit しない。これは仕様 (jlpt 補完だけが
  落ちる)
- **書き戻しは決定論的** — 既存 field の位置を変えない / 順序を変えない
  (JSON.stringify(doc, null, 2) で再出力するため field 順序は保持される)
- **--apply は git commit 前に diff 確認推奨** — 後で `git diff data/lesson_NN.json` で
  確認できる

## 失敗時の動作

| 状況 | 動作 |
|---|---|
| `NN` 範囲外 (1-99 以外) | exit 2 |
| `data/lesson_NN.json` が無い | exit 2 + メッセージ |
| `data/vocab_catalog.json` が無い | catalog 補完を skip (inheritance のみ実施) |
| JSON parse error | exit 2 |
| `--apply` で書き戻し失敗 (権限等) | exit 1 |

## 関連

- 14 ルール B-5: [archive/handoffs/lesson_master_rules_handoff_v2.md](../../archive/handoffs/lesson_master_rules_handoff_v2.md)
- vocab_catalog 構造: [data/vocab_catalog.json](../../data/vocab_catalog.json) (17,500+ entries / schemaVersion 1.2)
- 兄弟 skill: [/lesson-scaffold](lesson-scaffold.md) (Phase 1) / [/lesson-check](lesson-check.md) (本 Phase 同時) / `/lesson-suggest-activities` `/lesson-build-registry` (Phase 3 未実装)
- 全体まとめ docs (最後に書く): `docs/SKILLS_MANUAL.md`
