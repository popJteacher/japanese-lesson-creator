---
name: generate-image-prompt
description: Generate image prompts for Japanese vocabulary words using the 6-part master prompt design guide. Supports 4 modes (daily-pull / lesson / explicit / chain) to fill missing image prompts in data/image_prompts_skill.json.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# generate-image-prompt skill

Phase 5 ④' で導入された Claude Code スキル方式の本体。普遍ルールに従って画像プロンプトを生成する。
GAS 時代の `importImagePrompts()` の流れを取り戻す設計：チャット越し Claude（= skill = この場所）が プロンプトを書き、`scripts/generate-images-local.mjs` が nanobanana / Imagen に投げる役割分担。

## 使い方

```
/generate-image-prompt [mode=<mode>] [<options>]
```

`<mode>` は以下のいずれか（省略時は `daily-pull`）：

| mode | 用途 |
|---|---|
| `daily-pull` | catalog 全体から image 未生成な word を `limit` 件 pick（デフォルト 20 件） |
| `lesson` | `--lesson NN` 指定で、その課マスターに含まれる word のうち image 未生成のみ pick |
| `lesson-examples` | `--lesson NN` 指定で、その課マスターの `patterns[].examples[]` から **例文画像 (`ex_L*_*`)** を生成（[PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE](../../prompts/guide/part1_universal_rules.md#part-114-person_reference_attachment_rule) 準拠・NAMED_CHARACTER 検出 + portrait attach）。v4.0.5 新規（2026-05-26 X-c） |
| `explicit` | `--words 医者,会社員` で語指定 |
| `chain` | mode は他のいずれかと組み合わせて `chain=true`。prompt 生成後そのまま画像生成まで走らせる |

### 例

```
# 日次 20 件 pull（デフォルト・schedule で自動起動）
/generate-image-prompt

# 課マスター作成時の画像未生成補充（user 提案 2026-05-22）
/generate-image-prompt mode=lesson --lesson 02

# 単発生成
/generate-image-prompt mode=explicit --words 医者,会社員,先生

# 一気通貫（プロンプト生成 + Gemini 画像生成）
/generate-image-prompt mode=explicit --words 医者 chain=true
```

## 入力

| 引数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `mode` | string | `daily-pull` | 上記 4 mode のいずれか |
| `limit` | int | 20 | daily-pull の上限件数 |
| `--lesson` | int | — | lesson mode の課番号（NN）|
| `--words` | csv string | — | explicit mode の語リスト |
| `chain` | bool | `false` | true で画像生成まで実行 |

## 手順（skill 実行フロー）

### Step 1: ガイドを Read

skill 実行のたびに必ず次の 6 ファイルを Read：

1. `prompts/guide/part1_universal_rules.md` — 全 vocab_type 共通の不変原則
2. `prompts/guide/part2_style_bible.md` — 線・色・コントラスト・焦点距離
3. `prompts/guide/part3_vocab_type_rules.md` — vocab_type 別ルール + strategy blocks
4. `prompts/guide/part4_prompt_templates.md` — テンプレ骨格 + placeholder
5. `prompts/guide/part5_vocab_reference_appendix.md` — lookup data（PERSON_NATIONALITY_HINTS / BUILDING_CUES / OBJECT_SIGNATURES / ABSTRACT_METAPHORS 等）
6. `prompts/guide/part6_output_instructions.md` — 出力 JSON 規約 + preflight 仕様

PART 5 のサブセクションは word の vocab_type に応じて必要部分のみ Read offset/limit で絞ってよい。

### Step 2: 対象 word リストを構築

#### `mode = daily-pull`

```bash
# 1. catalog から vocab_type 付き word を抽出
# 2. data/image_prompts_skill.json で既存 word を確認
# 3. data/master_image_registry.json で status を確認
# 4. prompt 未作成 OR status が null/pending な word を `limit` 件 pick
```

Python helper：
```python
import json, sys
catalog = json.load(open("data/vocab_catalog.json"))
skill = {}
try:
    skill = json.load(open("data/image_prompts_skill.json"))
except FileNotFoundError:
    pass
existing_words = {e["word"] for e in skill.get("vocabulary", [])}
# vocab_type 付与済 & skill JSON に未登録 な word のみ抽出
candidates = [
    e for e in catalog.get("entries", [])
    if e.get("vocab_type") and e["word"] not in existing_words
]
limit = 20
words = candidates[:limit]
```

#### `mode = lesson`

```bash
# 1. data/lessons/lesson_NN.json を Read
# 2. patterns[].examples[] と vocabulary[] から word を抽出
# 3. 既存の image_prompts_skill.json + master_image_registry.json で
#    既に prompt or image がある word を除外
# 4. 残り全件を対象に（limit なし）
```

「課マスター作成時に画像必須」運用：新規 lesson_NN.json を作ったら `mode=lesson --lesson NN` で残り全件を補充。

#### `mode = lesson-examples`（v4.0.5 / X-c 新規）

例文画像（`ex_L*_*`）の prompt を Template C で生成する。
[PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE](../../prompts/guide/part1_universal_rules.md#part-114-person_reference_attachment_rule) に従い NAMED_CHARACTER 自動検出 + portrait reference 自動 attach を行う。

```bash
# 1. data/lesson_NN.json を Read（patterns[].examples[] + namedCharacters[]）
# 2. master_image_registry.json で各 ex_L*_* の状態を確認
# 3. status=pending or images[0].imageUrl=null な ex_L*_* を抽出
# 4. --force 指定時は status=generated 含めて全件再生成
```

入力 patterns[].examples[] から `ex_L*_*` の imageId を抽出し、各 example について Template C で prompt 生成。

**NAMED_CHARACTER 検出ロジック（PART 1.14 detection algorithm）**:

```python
# 1. lesson.namedCharacters[] を取得（鈴木さん / リンさん / キムさん / タノムさん / ケリーさん 等）
# 2. 検出 set = (a) sentence string 検出 + (b) example.sceneCharacters[] (任意 / v4.0.5) の UNION
#    (a) sentence.contains("鈴木") / sentence.contains("リン") etc.
#        順序: sentence 内の登場順 (string.find() で sort)
#    (b) example.sceneCharacters: ["鈴木"] 等の明示宣言（主語省略文の addressee 表示用）
#        順序: 配列順
#    最終 union 順序: (a) 先 (sentence-occurrence)、続いて (b) 未登場分のみ (array order)
#    重複は de-dup
# 3. 最大 4 件まで（PART 1.14 rule_a; 5+ は warning log + 切り捨て）
# 4. 各検出 NAMED_CHARACTER の portraitPath を PART 5.9 から resolve
#    （lesson.namedCharacters[i].portraitPath が優先・無ければ PART 5.9 entry の portraitPath）
# 5. styleReferences[] に 0〜4 件 push（順序は union 順）
# 6. {NAMED_CHARACTER_REFERENCES} block を render（PART 1.14 rule_b: ROLE+ASPECT addressing）
```

**`[REFERENCE]` セクションの省略**：

検出件数 0 のとき（例：「だれですか。→ キムさんです。」のように Q だけの分離型で NAMED_CHARACTER 不在の場合）、出力 prompt 本文から `[REFERENCE]` セクション全体を skill が削除する。`styleReferences: []` のままで `image_prompts_skill.json` に記録する。

#### `mode = explicit`

`--words` で渡された word を catalog で lookup して vocab_type を解決。catalog に無い word は ABORT。

### Step 3: 各 word について prompt を起草

word を 1 件ずつ処理：

1. **vocab_type を取得**：catalog から、または `vocab_types_lesson{NN}.json` から
2. **テンプレ選択**：[PART 4](../../prompts/guide/part4_prompt_templates.md) の vocab_type → template 対応表
3. **placeholder 埋め**：
   - Category A (lesson JSON 直接) → そのまま
   - Category B (lookup) → [PART 5](../../prompts/guide/part5_vocab_reference_appendix.md) から該当データを取得
   - Category C (strategy / model block) → [PART 3](../../prompts/guide/part3_vocab_type_rules.md) から選択（vocab_type の skill 判定）
   - Category D (composition variable) → skill が文脈から決定
4. **普遍ルール適用**：
   - [PART 1.1 NATIONALITY_NOUN_POLICY](../../prompts/guide/part1_universal_rules.md#part-11-nationality_noun_policy)（nationality の場合）
   - [PART 1.5 PHENOTYPE](../../prompts/guide/part1_universal_rules.md#part-15-phenotype_specification_rule)
   - [PART 1.8 FACIAL_FEATURES](../../prompts/guide/part1_universal_rules.md#part-18-facial_features_rule)（person）
   - [PART 1.10 HEAD_BODY_PROPORTION](../../prompts/guide/part1_universal_rules.md#part-110-head_body_proportion_rule)（person）
   - [PART 1.11 FOOTWEAR](../../prompts/guide/part1_universal_rules.md#part-111-footwear_rule)（person）
5. **injected constraint block**：
   - role の場合：`{NATIONALITY_EXCEPTION_BLOCK}` に [ROLE_ANTI_FLAG_BLOCK](../../prompts/guide/part6_output_instructions.md#role_anti_flag_block) を注入
   - nationality の場合：[NATIONALITY_EXCEPTION_BLOCK](../../prompts/guide/part6_output_instructions.md#nationality_exception_block) を注入

### Step 4: preflight 検証

各 prompt を bash で preflight に通す：

```bash
echo '{"text": "<full prompt>", "template_kind": "<vocab_type>", "word": "<word>"}' \
    | python scripts/lib/prompt_preflight.py
```

- exit 0 → PASS、次の word へ
- exit 1 → 違反を読んで [§Step 5 self-correction](#step-5-self-correction-loop-max-3-retries) へ

### Step 5: self-correction loop (max 3 retries)

違反 error code（[PART 6 §6.5](../../prompts/guide/part6_output_instructions.md#65-preflight-invariants-mechanical-gates)）に応じて修正：

| code | 修正方針 |
|---|---|
| `[C4]` | `[STYLE RECIPE]` の BG 文字列を [PART 2 BACKGROUND_BY_TYPE](../../prompts/guide/part2_style_bible.md#background_by_type) 定数値に修正 |
| `[C5]` | `NOT pure stark white` を追記 |
| `[C1] full-body` | `[SUBJECT]` に "full-body" / "head-to-toe" を明記 |
| `[C1] area` | "fills NN% of..." を削除（v4.0 で退役） |
| `[C1] lens` | "85mm portrait lens" を削除（v4.0 で退役） |
| `[C6]` | flag/nationality 文脈に **must** / **never** / **DO NOT** を追記 |
| `[PH]` | 未置換 placeholder を [PART 5](../../prompts/guide/part5_vocab_reference_appendix.md) で解決 |

3 retries 失敗 → `_meta.failed_entries[]` に append、skip して次の word へ。

### Step 6: 出力 JSON 更新

`data/image_prompts_skill.json` に append：

```python
import json, datetime, hashlib

def manifest_hash():
    parts = [
        "prompts/guide/part1_universal_rules.md",
        "prompts/guide/part2_style_bible.md",
        "prompts/guide/part3_vocab_type_rules.md",
        "prompts/guide/part4_prompt_templates.md",
        "prompts/guide/part5_vocab_reference_appendix.md",
        "prompts/guide/part6_output_instructions.md",
    ]
    concat = ""
    for p in parts:
        raw = open(p, "rb").read()
        lf = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n").rstrip(b"\n")
        concat += hashlib.sha256(lf).hexdigest()[:12]
    return hashlib.sha256(concat.encode()).hexdigest()[:12]

try:
    out = json.load(open("data/image_prompts_skill.json"))
except FileNotFoundError:
    out = {"_meta": {}, "vocabulary": []}

out["_meta"] = {
    "mode": "skill",
    "guideVersion": "v5.0",
    "guideManifestHash": manifest_hash(),
    "generatedAt": datetime.datetime.utcnow().isoformat() + "Z",
    "generator": ".claude/skills/generate-image-prompt.md",
    "model": "claude-opus-4-7",  # session model
    "totalEntries": len(out["vocabulary"]),
    "coveredVocabTypes": sorted({e["vocab_type"] for e in out["vocabulary"]}),
}

# entry は word をキーとして上書きしないこと（既存があれば skip）
# explicit に --force があれば上書き可
```

### Step 7 (chain mode のみ): 画像生成

`chain=true` の場合、prompt が PASS した word について：

```bash
# 1. data/image_prompts_skill.json の最新 entry list から
#    今回処理分の word を抽出して一時 JSON を作成
# 2. generate-images.mjs に投げる
npm run generate-images -- \
    --prompts data/image_prompts_skill.json \
    --backend nanobanana \
    --limit <N>
```

`generate-images.mjs` 側で必要なら `--from-skill` フラグ追加を検討（現状は既存の `--prompts` 経路を流用）。

## 制約

- **API 課金 0**：本 skill は Claude Code サブスクリプション内で動作。プロンプト生成に外部 API は使わない。
- **画像生成は別**：chain mode でも画像生成（nanobanana / Imagen）は件単価がかかる（~$0.04/件）。
- **vocab_type 前提**：対象 word は catalog で vocab_type が付与済みであること。未付与は ABORT。
- **preflight 必須**：preflight FAIL の entry は JSON に書き出してはいけない。
- **invariants 整合性**：書き出した JSON は `npm run validate` invariants A/B/C/D PASS と整合する状態にする。

## 失敗時の動作

- preflight 3 retries 失敗：`_meta.failed_entries[]` に記録、skip、次へ
- catalog に vocab_type 未付与：その word のみ ABORT、log 出力、次へ
- catalog 全 ABORT（lesson mode で対象 word が全件 vocab_type 未付与）：処理中止 + 人間に報告（main session で Gemini classify-and-translate.mjs を回すよう促す）
- ガイド hash 不整合（B invariant 失敗）：処理開始前に検出して ABORT、人間に報告

## 関連

- 設計：[docs/MIGRATION_PLAN.md § Phase 5 ④'](../../docs/MIGRATION_PLAN.md)
- preflight：[scripts/lib/prompt_preflight.py](../../scripts/lib/prompt_preflight.py)
- 自動起動：[`/schedule`](.) で daily cron セットアップ予定
- 画像生成 backend：[scripts/lib/nanobanana-client.mjs](../../scripts/lib/nanobanana-client.mjs) / [imagen-client.mjs](../../scripts/lib/imagen-client.mjs)
- 旧経路（dead code）：[scripts/build_prompts.py](../../scripts/build_prompts.py)（lesson_01 比較検証用に残置 / Phase 5 ④' 完了後 archive 行き）
