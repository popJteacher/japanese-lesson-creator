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

**v4.0.6 (2026-05-26 X-c) 仕様** — [PART 3.9 example_sentence 5 subsections](../../prompts/guide/part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level) を skill が遵守して prompt を組み立てる：

1. **`[STRICT LAYOUT DIRECTIVE]` 必須**：[PURPOSE] 直下に Template C の v4.0.6 STRICT directive ブロックを必ず emit（16:9 default-1:1 drift 防止）。
2. **`{SCENE_DESCRIPTION}` の 3 条件**：(a) NAMED_CHARACTER の canonical role action を含む、(b) affiliation 文 (〜の〜) は屋内シーン、(c) horizontally-stretching anchor を含む。skill が文型を判定して per-pattern recipe を適用：
   - **identity card (〜は[role/nationality]です)**：role action canonical (teacher = at podium, student = at desk, etc.)
   - **question (〜ですか)**：被質問者が canonical role action 中で、question mark が 1 つだけフロート
   - **2-panel hai/iie**：縦割り divider が 16:9 全幅、各 panel に 1 symbol
   - **affiliation (〜は〜の〜です)**：屋内 (consultation room / classroom / office desk / lecture hall / store counter) で role action
3. **`{SYMBOL_PERMISSION_CLAUSE}` の 2 form 分岐**：visual_symbol が必要な例文 (question / 2-panel) は permission 文、それ以外 (declarative / affiliation / identity) は **explicit 禁止** 文。
4. **`{CHARACTER_DESCRIPTIONS}` lean form**：portrait reference が attach されている場合、衣装・髪・顔の詳細を再記述しない（reference に identity transfer を委ねる）。role context + posture intent のみ書く。
5. **scene-deviation override**：scene が portrait と異なる outfit/activity を要求する場合のみ explicit override 文を [SUBJECT] に追記。

**v4.0.7 (2026-05-27 X-c-6) 仕様** — [PART 3.9 v4.0.7 8 subsections](../../prompts/guide/part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level) 追加遵守（v4.0.6 を上書き・包含）：

1. **§3.9.1 edge-bleed**：`{SCENE_DESCRIPTION}` 末尾に PART 3.9.1 Required phrase（`physically intersect and bleed off both the extreme left and extreme right edges`）を必ず含める。
2. **§3.9.2 object-manipulation**：`{SCENE_DESCRIPTION}` に PART 3.9.2 Required phrase（`actively, physically manipulating an object related to their role`）を含める。Forbidden phrases (`Standing in front of` / `Standing next to` / `Posing naturally`) は出力に絶対含めない。
3. **§3.9.2 Identity-only exception**：sentence が nationality declarative（〜は[国籍]です）の場合は §3.9.2 5a の Required phrase を `{SCENE_DESCRIPTION}` に **代わりに** emit。role identity without affiliation（〜は[役職]です・affiliation なし）は §3.9.2 5b。
4. **§3.9.3 INSIDE**：affiliation 文の `{SCENE_DESCRIPTION}` に PART 3.9.3 Required phrase（`strictly an INDOOR interior shot fully enclosed by walls. The character is INSIDE the [INSTITUTION]`）を必ず含める。
5. **§3.9.4 2D UI overlay**：`{VISUAL_SYMBOL_IF_NEEDED}` placeholder は symbol 必要時のみ emit、その内容は PART 3.9.4 Required phrase（`pure 2D graphic UI overlay composited flat against the picture plane. It MUST have zero depth, cast zero shadows...`）。Forbidden positional phrases (`hovers`, `floating`, `next to`, `suspended above`) は絶対含めない。
6. **§3.9.5 EXCLUSIVELY**：`{CHARACTER_DESCRIPTIONS}` lean form に PART 3.9.5 Required phrase（`Character identity MUST be derived EXCLUSIVELY from the attached image`）を必ず含める。
7. **§3.9.6 particle mapping**：sentence の dominant particle (は/が/に/で/を/の/へ) を §3.9.6 表から lookup し、対応する verbatim phrase を `{SCENE_DESCRIPTION}` に inline する。Forbidden ambiguous descriptor (`near`, `by`, `around`) は出力に絶対含めない。
8. **§3.9.7 featureless surfaces**：`{SCENE_DESCRIPTION}` 内で flat surface (whiteboard / desk / monitor / textbook / badge / wall) に言及する際は §3.9.7 表 (7a-7h) の Required phrase を verbatim 使用。Forbidden word stems (`blank`, `empty`, `clean`, `unoccupied`, `nobody is`) は絶対含めない。scene-essential prop は §3.9.7 Positive enumeration addendum で positively enumerate。
9. **§3.9.8 2-panel pattern**：sentence が はい〜／いいえ〜パターン の場合、`{SCENE_DESCRIPTION}` ではなく **[SCENE & ACTION] block 全体** を §3.9.8 A (NAMED_CHARACTER 付き) または §3.9.8 B (generic archetype) の verbatim block で置換する。`{SUBJECT}` も §3.9.8 B の場合は archetype 仕様で置換。

**v4.0.8 (2026-05-27 X-c-7) 仕様** — [PART 3.9 v4.0.8 4 改修](../../prompts/guide/part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level) 追加遵守（v4.0.7 を上書き・包含）：

**10. §3.9.2 5a National Flag Prop (identity-only nationality example_sentence)**

  - **トリガー判定**：`{SENTENCE_JP}` が `〜は[国籍]です` declarative かつ `〜人` substring を含む（`日本人` / `中国人` / `韓国人` / `ベトナム人` / `アメリカ人` / `スペイン人` / `ブラジル人` 等）
  - **アクション**：`{SCENE_DESCRIPTION}` に §3.9.2 5a v4.0.8 Required phrase を verbatim 埋め込む（"The subject MUST hold a small national flag prop representing the target country in ONE hand at chest level..." 全文）。flag は 12-15% image fill、手持ち、テキスト無し
  - **[CONSTRAINTS] override**：identity-only nationality example_sentence では skill が `[CONSTRAINTS]` の global flag ban 文を **次の override 形に置換** する：
    ```
    The clothing, accessories, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, country indicator, political symbol, or flag-print on garments, UNLESS explicitly directed in the [SCENE & ACTION] block to hold a specific national flag as a diegetic hand-held prop for an identity-only nationality sentence (per §3.9.2 5a v4.0.8 / §3.9.8.A).
    ```
  - **5b との分離**：sentence が `〜は[役職]です`（affiliation なし）の場合は 5b の object-manipulation Required phrase を emit し、global flag ban を保持（[PART 6.4 ROLE_ANTI_FLAG_BLOCK](../../prompts/guide/part6_output_instructions.md#role_anti_flag_block) 適用）

**11. §3.9.3.B Institution Anchor Table (affiliation 文)**

  - **トリガー判定**：`{SENTENCE_JP}` が `〜は〜の〜です` で第 1 の `の` の前が施設名（病院 / 銀行 / 学校 / 大学 / デパート / 会社 等）
  - **アクション**：§3.9.3.B 表から該当 institution の行を lookup、その verbatim cue list から **≥2 cue** を選んで `{SCENE_DESCRIPTION}` に inline する。例：銀行なら `teller counter with low partition` + `window grille`、病院なら `examination bed` + `stethoscope on wall hook`
  - **Unlisted institution fallback**：表に無い施設名（駅 / スーパー / 図書館 等）は §3.9.3.B Fallback Rule の verbatim phrase を emit（"the {SCENE_DESCRIPTION} MUST explicitly enumerate AT LEAST TWO distinct, highly specific functional fixtures or architectural elements native to that institution's interior. Generic desks, blank walls, generic office cubicles, or any visual configuration that could plausibly represent any indoor workplace are PROHIBITED."）

**12. §3.9.8.A Archetype Cue Table (2-panel B-archetype + Route 2 single panel)**

  - **トリガー判定**：(a) sentence が 2-panel `はい〜／いいえ〜` パターン かつ §3.9.8 B 経路に分岐するとき、または (b) §3.9.8.C Route 2 (class-attribute single panel + ? overlay)
  - **アクション**：§3.9.8.A 表から target class (先生 / 学生 / 大学生 / 会社員 / 医者 / 〜人) の行を lookup し、対応する diegetic prop verbatim phrase を §3.9.8.B SUBJECT block の `<INSERT §3.9.8.A diegetic prop>` placeholder に inject
  - **Prop の symbol counting**：これら prop は **3D diegetic objects** なので SYMBOL_COUNT STRICT ENFORCEMENT (checkmark/X-mark/?/arrow の 2D UI overlay count) に **加算しない**。skill は prompt 本文に "These are diegetic 3D props and DO NOT count toward 2D UI SYMBOL_COUNT limits." を明示 emit

**13. §3.9.8.C Subject Bifurcation Rule for Yes-No Questions (機械判定)**

  - **トリガー判定**：`{SENTENCE_JP}` が yes-no question または answer のパターン:
    - 単 panel `?`: 末尾が `ですか。` (例: `リンさんですか。` / `先生ですか。` / `韓国人ですか。`)
    - 2-panel はい/いいえ: `はい、〜です。／いいえ、〜じゃありません。` (例: `はい、リンさんです。／…` / `はい、先生です。／…`)
  - **Route 1 判定 (Proper Noun Route)**:
    ```python
    if "さん" in sentence_jp:
        route = "1_proper_noun"
        # NAMED_CHARACTER portrait を retain
        # styleReferences populated per PART 1.14 detection
    ```
    アクション：NAMED_CHARACTER portrait を attach、[SUBJECT] は §3.9.5 lean form、SCENE は単 panel mode なら NAMED_CHARACTER の role action + 1 `?` overlay、2-panel mode なら §3.9.8 A block (verbatim、両 panel で同じ portrait)
  - **Route 2 判定 (Class Attribute Route)**:
    ```python
    OCCUPATION_TOKENS = {"先生", "学生", "大学生", "会社員", "医者"}
    if any(tok in sentence_jp for tok in OCCUPATION_TOKENS) or "人" in sentence_jp:
        route = "2_class_attribute"
        # NAMED_CHARACTER attach を抑止、styleReferences = []
        # [REFERENCE] section を omit
    ```
    アクション：portrait attach せず、[SUBJECT] は §3.9.8.B archetype block を §3.9.8.A diegetic prop 埋め込みで emit、SCENE は単 panel mode なら archetype + 1 `?` overlay、2-panel mode なら §3.9.8 B block + §3.9.8.A prop で両 panel clone
  - **Tie-breaking**：Route 1 と Route 2 の両方がマッチする仮想ケース（`さん` と `〜人` の両方含む）は **Route 1 優先**。理由：name-question は class-attribute question より意味論的に specific
  - **No-match fallback**：どちらもマッチしない（未知の attribute を問う yes-no question）は **Route 1 + warning log entry**。`_meta.warnings[]` に「§3.9.8.C trigger no-match: <sentence>」を記録し、PART 3.9.8.A 表の拡張候補として保留

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
