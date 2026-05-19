# docs/generator_contract.md — 決定論 S列生成スクリプトの契約

> 短い spec。実装は `scripts/build_prompts.py`（MVP は person のみ）。
> 主経路は **v3.2 ガイドから直接生成**する。GAS の `build*Prompt_`
> （副経路フォールバック）は v3.2 invariants 違反のため移植元にしない。

最終更新：2026-05-19（person MVP 着手時）

---

## 1. 役割

`prompts/master_prompt_design_guide_v3_2.py`（hash `566b8ad68753` LF 正規化後）から、画像生成 GAS が S列に投入する prompt 文字列を**決定論的に**生成する。生成物は `data/image_prompts_lessonNN_v3_N.json`（`invariants.mjs` C が自動検査する命名規則）。

主経路：**ガイド `PROMPT_TEMPLATES` ＋ プロファイル辞書 → 文字列置換 → JSON 出力**。
副経路：GAS `build*Prompt_`（v5.3）は S列が空（<50字）のときだけ動くフォールバック。**主経路と整合させない**（GAS 側は v3.2 invariants を満たさない古いテンプレを持つ）。

---

## 2. 入出力契約

### 入力（per-entry）

| フィールド | 型 | 必須 | 用途 |
|---|---|---|---|
| `imageId` | string | ✅ | `word_X` 形式（registry 鍵） |
| `word` | string | ✅ | 日本語表記 |
| `reading` | string | ✅ | よみがな |
| `en` | string | ✅ | 英訳（target 説明用） |
| `vocab_type` | string | ✅ | `person` / `building` / `concrete_object` / `spatial_relation` / `demonstrative` / `action_verb` / `abstract_concept` / `adjective` のいずれか |
| （person のとき）`role_key` | string | 任意 | `ROLE_BASED_GENERIC_PROFILES` のキー（`doctor`/`teacher` 等）。`nationality` の場合は不要 |
| （person のとき）`gender` | string | 任意 | `male` / `female` / `neutral` |
| （person 国籍のとき）`flag_shape_and_colors` | string | 任意 | `NATIONALITY_NOUN_POLICY.flag_shape_and_colors_hint` 準拠の文字列 |

> 当面 vocab_type と補助フィールドの真実源は `archive/misc/image_prompts_lesson01_v1_4.json`（人手分類）。次タスクで `data/lesson_NN.json` への取り込み（または GAS Vocabulary シート → repo への取り込み）に格上げする。

### 出力（ファイル全体）

```json
{
  "_meta": {
    "lessonNo": 1,
    "guideVersion": "v3.2",
    "guideHashNormalized": "566b8ad68753",
    "generatedAt": "YYYY-MM-DD",
    "generator": "scripts/build_prompts.py",
    "coveredVocabTypes": ["person"],
    "notes": "MVP: person のみ実装。他 vocab_type のエントリは出力に含めない。"
  },
  "vocabulary": [
    {
      "imageId": "word_医者",
      "word": "医者",
      "reading": "いしゃ",
      "en": "doctor",
      "vocab_type": "person",
      "prompt": "[PURPOSE]\n...\n[CONSTRAINTS]\n..."
    }
  ]
}
```

- ファイル名：`data/image_prompts_lessonNN_v3_N.json`（`invariants.mjs` の正規表現 `/^image_prompts_lesson\d{2}_v3_\d+\.json$/` にマッチさせる）。
- `prompt` は **GAS が S列にそのまま入れて Imagen に流す最終文字列**（プレースホルダ残置禁止）。
- v3.2 ガイドのテンプレ複数行をそのまま展開し、`[TARGET_WORD]` / `{CHARACTER_DESCRIPTION}` / `{CHARACTER_POSE_AND_EXPRESSION}` 等を置換完了済とする。

---

## 3. 合格条件（hard）

生成された `prompt` は **`scripts/invariants.mjs` C** を 1 件もエラーなく通すこと。

| invariant | person | building | object | abstract |
|---|---|---|---|---|
| C1 person `full-body`/`head-to-toe` 必須・`fills NN% of` 禁止・`85mm portrait lens` 禁止 | ✅ | — | — | — |
| C2 object `~50mm` 必須・`85mm portrait lens` 禁止 | — | — | ✅ | — |
| C3 abstract `flat-solid-only` 必須・`gradient` 禁止 | — | — | — | ✅ |
| C4 背景文字列 `soft cream off-white background (warm off-white, NOT pure stark white)` 一字一句一致 | ✅ | （建物は別背景） | ✅ | ✅ |
| C5 `NOT pure stark white` 一字一句一致（小文字 `not` への揺れ禁止） | ✅ | — | ✅ | ✅ |
| C6 国旗関連プロンプトに `must` / `never` 強表現 | ✅（国籍時のみ） | — | — | — |

MVP（person）が満たすのは C1・C4・C5・C6（国籍時）。

---

## 4. 失敗時の振る舞い

- vocab_type が想定外 → エラー終了（exit 非ゼロ）。silent skip しない。
- 置換結果に `[`・`{`・プレースホルダ残骸 → エラー終了。
- 出力 JSON は invariants C を pre-flight で内部実行し、違反があればファイルを書かずに終了。

---

## 5. MVP のスコープ（今回・person のみ）

- 対象：lesson_01 の vocab_type=person 12 件（archive/misc/image_prompts_lesson01_v1_4.json の分類を信頼）
  - 役割系 5：医者・会社員・学生・大学生・先生 → `ROLE_BASED_GENERIC_PROFILES` ＋ `CHARACTER_PROFILES.generic_*`
  - 国籍系 7：日本人・中国人・アメリカ人・韓国人・ブラジル人・ベトナム人・スペイン人 → `NATIONALITY_NOUN_POLICY.subject_block_pattern`
- 出力：`data/image_prompts_lesson01_v3_2.json`（person 12 件のみ）
- 検証：`npm run validate` の invariants[C] が ERROR=0 を返す

building / object / abstract / spatial_relation 等は本 MVP の範囲外。設計分岐（5 で人間判断を待つ）次第で次タスクへ。
