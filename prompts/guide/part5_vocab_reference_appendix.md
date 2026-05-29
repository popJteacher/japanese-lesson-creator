# PART 5: Vocabulary Reference Appendix

> 対象：単語 / 役割 / 国籍 / 建物 / 物体 / 抽象 / 空間 / シンボル の lookup data。
> skill が prompt 生成時に word → 各種属性 を解決するときに参照。
> Python 辞書から Markdown 化（中身完全保全 — 実機検証で得た知識を無駄にしない）。
> Migrated from `scripts/build_prompts.py` (lines 103-497) + `prompts/master_prompt_design_guide_v4_0.py` (lines 2352-4336).
> See also: [PART 1](part1_universal_rules.md), [PART 3](part3_vocab_type_rules.md), [PART 4](part4_prompt_templates.md), [PART 6](part6_output_instructions.md).

---

## 5.1 PERSON_ROLE_LOOKUP

> word → role_key（[`ROLE_BASED_GENERIC_PROFILES`](#58-role_based_generic_profiles) のキー）。
> `vocab_type=person` で word が「人」で終わらない場合の dispatch table。

| Japanese word | role_key |
|---|---|
| 医者 | `doctor` |
| 会社員 | `company_employee` |
| 学生 | `student` |
| 大学生 | `student` |
| 先生 | `teacher` |
| 外国人 | `foreigner` |

---

## 5.2 PERSON_NATIONALITY_HINTS

> word → `{cultural_styling_hint, flag_shape_and_colors}`（[PART 1.1](part1_universal_rules.md#part-11-nationality_noun_policy) NATIONALITY_NOUN_POLICY 経由）。
> v4.0 全面改訂：全 7 国とも "modern daily casual wear" に統一。silhouette / fit / palette / footwear / optional non-hand accessory で国別 subtle 弁別。
> 伝統 silhouette 禁止は [NO_TRADITIONAL_SILHOUETTE_RULE](part1_universal_rules.md#no_traditional_silhouette_rule-v40-新規普遍ルール) で universal 集約。
> 国旗は両手で胸前で持つ hand-held flag pose のため accessory は「手以外」（shoulder-strap bag / cap / scarf / wristwatch）に限定。

### 日本人

**flag_shape_and_colors**：
```
the actual flag of Japan (Hinomaru): a white rectangular field with a single solid red disc/circle centered in the middle. ABSOLUTELY no text, letters, numbers, or words anywhere on the flag
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of contemporary Japan: a plain solid-color slightly oversized crew-neck t-shirt OR a plain solid-color button-up shirt, layered optionally over a simple plain knit pullover, paired with neat tailored trousers or dark jeans.
Footwear MUST be simple low-profile white or off-white canvas sneakers OR plain dark leather loafers.
Palette: Pick ONE color combination from: muted indigo top + cream trousers / charcoal top + warm sand trousers / cream top + muted indigo trousers / sage green top + charcoal trousers.
AVOID white top + solid red trousers, AVOID solid red top + white trousers, AVOID any large red circle motif centered on a white garment (these read as Japanese flag imagery on the body — the hand-held flag already carries that signal).
Optional non-hand accessory: a plain canvas tote bag slung by its strap over one shoulder OR a simple wristwatch. NO hand-held bag, NO hand-held book, NO hand-held prop of any kind (both hands hold the flag).
```

### 中国人

**flag_shape_and_colors**：
```
the actual flag of the People's Republic of China (Five-star Red Flag): a red field with one large yellow five-pointed star and four smaller yellow stars in the upper-left corner. ABSOLUTELY no text, letters, numbers, or words anywhere on the flag
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of contemporary China: a plain solid-color regular crew-neck top OR a plain solid-color button-up shirt with a regular (non-mandarin) collar, paired with neat tailored trousers.
Footwear MUST be simple plain leather loafers OR low-profile canvas or leather sneakers.
Palette: Pick ONE color combination from: soft jade top + cream trousers / muted indigo top + warm sand trousers / cream top + charcoal trousers / muted dusty rose top + indigo trousers.
AVOID any red + yellow color combination on the outfit (the Chinese flag uses red + yellow — the hand-held flag already carries that signal).
Optional non-hand accessory: a thin minimalist wristwatch OR a small plain leather messenger bag slung by its strap over one shoulder. NO hand-held bag, NO hand-held prop of any kind (both hands hold the flag).
```

### アメリカ人

**flag_shape_and_colors**：
```
the actual flag of the United States of America (Stars and Stripes): alternating red and white horizontal stripes covering the full flag, with a blue rectangular canton in the upper-left corner containing white five-pointed stars arranged in rows. ABSOLUTELY no text, letters, numbers, or words anywhere on the flag
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of the contemporary United States: a plain solid-color crew-neck t-shirt under an unbuttoned chore coat (work jacket with patch pockets) OR a plaid / check button-up flannel shirt worn open over a plain solid-color t-shirt, paired with straight-leg jeans or chinos.
Any plaid / check MUST be a non-flag, non-team check pattern in muted earth tones. The t-shirt MUST be a plain solid color with NO graphic, NO logo, NO print (per NATIONAL_SYMBOL_ISOLATION_RULE).
Footwear MUST be simple canvas sneakers OR plain work-style leather boots.
Palette: Pick ONE color combination from: cream tee + muted indigo coat + charcoal jeans / muted sand flannel + plain white tee + dark jeans / muted olive chore coat + cream tee + charcoal chinos.
Optional non-hand accessory: a plain solid-color baseball-style cap with NO logo, NO team emblem, NO flag motif OR a simple wristwatch. NO hand-held bag, NO hand-held prop of any kind (both hands hold the flag).
```

### 韓国人

**flag_shape_and_colors**：
```
the actual flag of South Korea (Taegukgi): a white rectangular field with the red-and-blue Taegeuk circle centered in the middle, and four black trigrams (one in each corner of the flag). ABSOLUTELY no text, letters, numbers, or words anywhere on the flag
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of contemporary K-fashion: a clean minimalist oversized trench-style coat OR a sharp-shouldered modern blazer worn open over a plain solid-color crew-neck top, paired with neat straight-leg trousers.
Footwear MUST be clean low-profile leather sneakers OR plain dark leather loafers.
Palette: Pick ONE color combination from: cream coat + charcoal top + dark trousers / muted dusty rose blazer + cream top + charcoal trousers / pale indigo coat + warm sand top + charcoal trousers / muted olive coat + cream top + warm sand trousers.
Optional non-hand accessory: a small structured plain leather crossbody bag slung by its strap over one shoulder OR a minimalist wristwatch. NO hand-held bag, NO hand-held prop of any kind (both hands hold the flag).
```

### ブラジル人

**flag_shape_and_colors**：
```
the actual flag of Brazil (Bandeira do Brasil): a green field with a large yellow rhombus/diamond in the center, containing a blue celestial sphere with white stars and a horizontal curved white band across the middle of the blue circle. ABSOLUTELY no text, letters, numbers, or words anywhere on the flag — even though the actual Brazilian flag contains the motto 'Ordem e Progresso' on the white band, render the band as completely blank white with no text on it
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of contemporary Brazil: a relaxed-fit lightweight linen camp-collar button-up shirt worn open over a plain solid-color tank top or short-sleeve t-shirt OR a relaxed short-sleeve top with a small subtle botanical print (tropical leaf or palm or floral in muted earth tones), paired with light cotton or linen trousers.
Footwear MUST be simple canvas sneakers OR plain flat leather sandals.
Palette: Pick ONE color combination from: terracotta tee + cream linen shirt + muted indigo trousers / sand-colored botanical-print top + cream trousers / muted sage linen shirt + cream tee + warm sand trousers.
AVOID any green + yellow color combination on the outfit (the Brazilian flag uses green + yellow — the hand-held flag already carries that signal, and the combination reads as national-team uniform).
Optional non-hand accessory: a small woven cord or bead bracelet in muted earth tones (NEVER in flag colors). NO hand-held bag, NO hand-held prop of any kind (both hands hold the flag).
```

### ベトナム人

**flag_shape_and_colors**：
```
the actual flag of Vietnam (Cờ đỏ sao vàng): a red rectangular field with a single large yellow five-pointed star centered in the middle. ABSOLUTELY no text, letters, numbers, or words anywhere on the flag
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of contemporary Vietnam: a plain solid-color short-sleeve crew-neck t-shirt OR a simple lightweight short-sleeve button-up blouse with a regular (non-mandarin) collar, paired with neat lightweight trousers.
Footwear MUST be simple canvas sneakers OR plain flat leather sandals.
Palette: Pick ONE color combination from: soft jade top + cream trousers / pale indigo top + warm sand trousers / cream blouse + muted indigo trousers / muted dusty rose top + cream trousers.
AVOID red top with any single yellow ornament centered on the chest (that reads as Vietnamese flag imagery on the body — the hand-held flag already carries that signal).
Optional non-hand accessory: a small woven rattan or lightweight canvas crossbody bag slung by its strap over one shoulder OR a simple wristwatch. NO tourist nón lá conical hat. NO hand-held bag, NO hand-held prop of any kind (both hands hold the flag).
```

### スペイン人

**flag_shape_and_colors**：
```
the actual flag of Spain (Bandera de España): three horizontal bands red-yellow-red with the middle yellow band twice as tall as each red band (1:2:1 proportion), and the Spanish coat-of-arms positioned on the yellow band toward the left side. ABSOLUTELY no text, letters, numbers, or words anywhere on the flag
```

**cultural_styling_hint**：
```
The outfit MUST be modern daily casual wear typical of contemporary Spain: a relaxed-fit lightweight linen or cotton button-up shirt with rolled sleeves worn open over a plain solid-color t-shirt, paired with light chinos.
Footwear MUST be simple plain canvas flat sneakers OR plain leather low-profile loafers. (NO woven jute-rope traditional espadrille sole, NO traditional regional footwear of any country.)
Palette: Pick ONE color combination from: cream tee + muted indigo linen shirt + warm sand chinos / terracotta tee + cream linen shirt + charcoal chinos / muted sage linen shirt + cream tee + warm sand chinos.
AVOID any red + yellow color combination on the outfit (the Spanish flag uses red + yellow — the hand-held flag already carries that signal).
Optional non-hand accessory: sunglasses pushed up on top of the head OR a thin lightweight modern scarf draped over the neck (NOT a manton-style traditional fringed shawl). NO hand-held bag, NO hand-held prop of any kind (both hands hold the flag).
```

---

## 5.3 PHENOTYPE_PROFILES

> profile_key → 1 文の concrete phenotype 記述（[PART 1.5 rule_b](part1_universal_rules.md#rule_b--adjacent-range-ok) 準拠の隣接 2 段階 range）。
> v3.12 / v4.0 共通：palette_freeze 継続。

| profile_key | description |
|---|---|
| `east_asian` | `fair to light-medium skin with straight black to dark-brown hair` |
| `southeast_asian` | `light-medium to medium olive-toned skin with straight black hair` |
| `mediterranean_eu` | `light-medium to olive-tan skin with wavy dark-brown to black hair` |
| `northern_eu` | `fair skin with straight to wavy light-brown or blond hair` |
| `west_african` | `deep brown skin with tightly coiled black hair` |
| `east_african` | `rich brown to deep brown skin with tightly coiled black hair` |
| `americas_diverse` | **SENTINEL** — `FALLBACK_TO_ROLE_PALETTE`（rule_c 特例：route here = use [ROLE_PHENOTYPE_PALETTE](#55-role_phenotype_palette) deterministic pick instead of this string） |

---

## 5.4 COUNTRY_TO_PROFILE

> nationality_noun → profile_key（lesson_01 の 7 国籍をカバー・将来国追加は 1 行追加だけ）。

| 国籍語 | profile_key |
|---|---|
| 日本人 | `east_asian` |
| 中国人 | `east_asian` |
| 韓国人 | `east_asian` |
| ベトナム人 | `southeast_asian` |
| スペイン人 | `mediterranean_eu` |
| アメリカ人 | `americas_diverse` |
| ブラジル人 | `americas_diverse` |

---

## 5.5 ROLE_PHENOTYPE_PALETTE

> 6 entries（人類スペクトラム fair → deep brown）。
> role nouns (医者・学生・先生 等) と `americas_diverse` fallback で使用。
> `sha256(word + PHENOTYPE_SALT) mod 6` で deterministic 選択（[PART 1.5 rule_d](part1_universal_rules.md#rule_d--role-via-hash)）。
> 各 entry は [PART 1.5 rule_a / rule_b](part1_universal_rules.md#part-15-phenotype_specification_rule) 準拠の 1 文記述。

| index | description |
|---|---|
| 0 | `fair skin with short straight light-brown hair` |
| 1 | `light-medium skin with shoulder-length wavy dark-brown hair` |
| 2 | `olive-tan skin with long straight black hair` |
| 3 | `light brown skin with short curly dark-brown hair` |
| 4 | `rich brown skin with shoulder-length loosely curly black hair` |
| 5 | `deep brown skin with very short tightly coiled black hair` |

**v3.12.1 改訂注**：初版 (v3.12.0) は skin tone 6 段階 gradient だったが、隣接 entry の hair 記述が同一（例 entry[4]/[5] が "tightly coiled black"）で視覚弁別不能なペアが発生した。本改訂で skin AND hair 両軸で全 entry が visibly 異なるよう書き直し、5-6 role を 1 課に並べたとき全員が一目で別人と判別可能にする。

---

## 5.6 FLAG_PLACEMENT_OPTIONS

> v4.0 で簡素化（[PART 1.7 FLAG_PLACEMENT_RULE](part1_universal_rules.md#part-17-flag_placement_rule)）。
> 全員固定 pose・deterministic-pick 不要。
> 1-entry list（`_deterministic_pick` の API 互換性のため list として保持）。

```
in both hands in front of the chest, at about chest-to-upper-waist height, both arms bent at the elbows
```

`flag_placement_for(word)` は word に依らず常に上記の文字列を返す。

---

## 5.7 PHENOTYPE_SALT

```
PHENOTYPE_SALT = "palette-pick"
```

> v3.12 salt 文字列。lesson_01 の 5 role + 2 americas_diverse（アメリカ人 / ブラジル人）計 7 word を [ROLE_PHENOTYPE_PALETTE](#55-role_phenotype_palette) の 6 buckets に分散させた際の skew が最小（skew=1, 理論最小値）になる salt を実機で選定した結果 `palette-pick` に確定。
> 候補 `phenotype` は skew=3、`role-pick` は skew=1（但し 5 role 内で同一 palette entry に 2 件衝突）、`palette-pick` は skew=1 かつ 5 role 全員が distinct entry。
> salt 変更は同じ word の phenotype hash を変えるため、v3.12 freeze 後の変更は major-version migration 扱い（[PART 1.5 rule_e](part1_universal_rules.md#rule_e--palette-freeze)）。

---

## 5.8 ROLE_BASED_GENERIC_PROFILES

> 役割ベースの汎用人物プロファイル。[PART 1.3 ROLE_VISUAL_IDENTITY_RULE](part1_universal_rules.md#part-13-role_visual_identity_rule) 準拠で全 5 role の `outfit_hints` を以下の規律で書く：
> (1) 最初の要素 = garment signature
> (2) 中間要素 = 補助
> (3) 最後の要素 = mandatory prop signature を "MUST visibly carry/wear ..." 形式で

### teacher

| 項目 | 値 |
|---|---|
| role_ja | 先生 |
| role_en | teacher |
| isolation_unsafe_props_excluded | `pointer`（ホワイトボードを必要とするため除外） |
| lesson_appearances | lesson_01 (p1 「先生」語彙) |

**outfit_hints**：
- `professional but approachable — blouse or collared shirt with a simple cardigan or open jacket`
- `muted color palette (white / muted warm blue / cool slate gray / beige)`
- `MUST visibly wear a rectangular plastic name-tag-style ID badge clipped to a thin strap or cord at chest level — the badge is a plain blank rectangle with NO text, NO icon, NO graphic, NO drawing of any kind on it. The rectangular shape alone identifies it as a generic ID badge (NOT a circular pendant, NOT a medallion, NOT a necklace)`
- `MUST visibly hold one thick textbook with a clearly visible spine and pages, held in one hand or tucked under one arm`

**scene_hints**：
- `in front of a whiteboard or blackboard`
- `at a desk with books and papers`
- `interacting with students`

### company_employee

| 項目 | 値 |
|---|---|
| role_ja | 会社員 |
| role_en | company employee / office worker |
| lesson_appearances | lesson_01 (p3 例文) |

**outfit_hints**：
- `navy blue or charcoal gray business suit (jacket + matching trousers or knee-length skirt)`
- `white or pale-blue dress shirt or blouse with a simple necktie or scarf`
- `a small wristwatch is an optional accessory`
- `MUST visibly carry a briefcase or laptop bag held by the handle in one hand`

**scene_hints**：
- `in front of an office building or company entrance`
- `at a desk with a laptop and documents`
- `walking with a briefcase on a city sidewalk`

### student

| 項目 | 値 |
|---|---|
| role_ja | 学生 |
| role_en | university or language school student |
| lesson_appearances | lesson_01 (p1 「学生」語彙) |

**outfit_hints**：
- `casual smart clothes — jeans or chinos with a simple t-shirt, hoodie, or light sweater`
- `no formal business attire`
- `MUST visibly wear a backpack on both shoulders (or one shoulder), with the backpack clearly visible from the front or side`
- `MUST visibly hold one textbook or spiral notebook in one hand`

**scene_hints**：
- `in a classroom or study space`
- `on a university campus`
- `reading or taking notes`

### doctor

| 項目 | 値 |
|---|---|
| role_ja | 医者 |
| role_en | doctor |
| isolation_unsafe_props_excluded | `otoscope`（耳に当てる文脈が必要なため除外） |
| lesson_appearances | lesson_01 (p1 「医者」語彙) |

**outfit_hints**：
- `white doctor's coat (open at the front) over a simple blouse or scrubs top`
- `MUST visibly wear a stethoscope draped around the neck with the chestpiece resting on the chest`
- `MUST visibly wear a small name badge clipped to the coat (no specific name written, just a generic badge silhouette)`
- `MAY also hold a clipboard or pen in one hand as a secondary prop`

**scene_hints**：
- `in a clinic or hospital room with examination table`
- `at a desk with medical chart`
- `in front of a hospital building`

### foreigner

| 項目 | 値 |
|---|---|
| role_ja | 外国人 |
| role_en | foreigner / non-Japanese person |
| lesson_appearances | lesson_01 (p1 「外国人」語彙) |

**outfit_hints**：
- `casual or smart casual clothes — blouse, shirt, or simple top with trousers or chinos`
- `MUST visibly hold a Japanese-language phrasebook or pocket textbook with the cover facing the viewer (cover shows a generic abstract book design — NO text, NO letters, NO flag motif)`
- `MUST visibly wear a small crossbody day bag with the strap diagonally across the chest`

**scene_hints**：
- `in a Japanese language classroom`
- `introducing oneself with a smile`
- `in a public space (station, store) interacting with Japanese people`

**notes**：肌色・髪色・目の色は意図的に多様化させる。特定国籍を示唆するステレオタイプ的装飾は避ける。phrasebook と crossbody bag の組み合わせで学習者 / 訪問者性を示し、teacher (lanyard+textbook) との signature 重複を避ける。

---

## 5.9 NAMED_CHARACTER_PROFILES

> lesson_01 の固定キャラクター（鈴木さん / リンさん / ケリーさん / キムさん / タノムさん）。
> **使用ルール**：画像プロンプトにキャラクター名（固有名詞）は絶対に記載しない。外見・服装・小道具のみでロールと出身を視覚的に表現する。名前ラベルは生成後にテキストオーバーレイで付与（GAS 側の責務）。
> **v4.0.5 (2026-05-26)**：[PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-114-person_reference_attachment_rule) により、各キャラに `portraitPath` を追加。例文画像（example_sentence）生成時、sentence 内に NAMED_CHARACTER が登場する場合は対応する portrait を reference として attach する（identity consistency 担保）。

### Reference image constants (v4.0.5)

例文画像生成で NAMED_CHARACTER の identity transfer に使用する portrait reference 一覧。`generate-image-prompt` skill が sentence 内の固有名詞を検出し、該当する path を `styleReferences[]` に push する（PART 1.14 detection algorithm 参照）。

| NAMED_CHARACTER | portraitPath | 役割 |
|---|---|---|
| 鈴木さん | `data/images/char_鈴木.png` | identity transfer — face / hair (graying salt-and-pepper short) / outfit (navy or charcoal business suit) / overall build (40s-50s Japanese male teacher) |
| リンさん | `data/images/char_リン.png` | identity transfer — face / hair (long straight dark, mid-length+) / outfit (casual smart top + jeans) / backpack accessory / 20s Chinese female student |
| ケリーさん | `data/images/char_ケリー.png` | identity transfer — face / hair (lighter brown or blonde) / outfit (smart casual blouse + cardigan/blazer) / 30s-40s American female teacher / Western phenotype |
| キムさん | `data/images/char_キム.png` | identity transfer — face / hair (short neat) / glasses (slim rectangular) / outfit (business casual dress shirt + slacks) / 20s Korean male office worker |
| タノムさん | `data/images/char_タノム.png` | identity transfer — face / hair (short dark) / outfit (white doctor's coat + simple shirt + stethoscope) / 20s Vietnamese male doctor / medium-brown skin tone / Southeast Asian features |

これら 5 件の portrait は `vocab_type == "character_asset"` で生成され、`master_image_registry.json` の `char_<name>` entry に格納される。reference 自体は generation 時に他キャラ ref を attach しない（generation 順序：character portrait → example_sentence）。

### 鈴木さん

| 項目 | 値 |
|---|---|
| gender | male |
| role_ja | 先生 |
| role_en | Japanese language teacher |
| nationality | Japanese |
| age_range | 40s-50s |
| portraitPath | `data/images/char_鈴木.png` |
| lesson_appearances | lesson_01 (p1 例文1-1/1-4, p3 例文3-2) |

| 項目 | 値 |
|---|---|
| gender | male |
| role_ja | 先生 |
| role_en | Japanese language teacher |
| nationality | Japanese |
| age_range | 40s-50s |
| lesson_appearances | lesson_01 (p1 例文1-1/1-4, p3 例文3-2) |

**character_visual_hints**：
- `graying or salt-and-pepper short hair`
- `conservative business suit — navy or charcoal, white shirt, subtle tie`
- `may carry a textbook or a marker`
- `calm, professional expression`
- `East Asian features — Japanese male teacher archetype`

**nationality_visual_hints**：
- `no nationality badge needed (Japanese teacher in Japanese classroom context is implicit)`
- `overall appearance should read as a senior Japanese educator`

**scene_hints**：
- `standing in front of a whiteboard with Japanese writing`
- `at a teacher's desk with books and papers`

_note：PDF p.5 モデル発話「鈴木さんは先生です」「鈴木さんは日本人です」の人物。

### リンさん

| 項目 | 値 |
|---|---|
| gender | female |
| role_ja | 学生 |
| role_en | university student |
| nationality | Chinese |
| age_range | 20s |
| affiliation | 東西大学 |
| portraitPath | `data/images/char_リン.png` |
| lesson_appearances | lesson_01 (p1 例文1-2/1-5, p2 全例文, p3 例文3-4) |

**character_visual_hints**：
- `long straight dark hair, mid-length or longer`
- `casual smart clothing — simple top with jeans or slacks`
- `backpack or notebook under arm`
- `bright, open expression — friendly language learner vibe`
- `East Asian features — young Chinese female student`

**nationality_visual_hints**：
- `small flag badge (China) on backpack strap is acceptable but optional`
- `features should suggest East Asian (Chinese) without being stereotypical`

**scene_hints**：
- `on a university campus or in a classroom`
- `holding a textbook or taking notes`

_note：PDF p.1 会話例「リンです。中国人です。東西大学の学生です。」の人物。

### ケリーさん

| 項目 | 値 |
|---|---|
| gender | female |
| role_ja | 先生（教師） |
| role_en | teacher (foreign language instructor) |
| nationality | American |
| age_range | 30s-40s |
| portraitPath | `data/images/char_ケリー.png` |
| lesson_appearances | lesson_01 (materialNeeds named_character_card; 会話例「アメリカから来ました」) |

**character_visual_hints**：
- `light complexion, Western (North American) features`
- `smart casual or business casual — blouse with cardigan or blazer`
- `may carry a textbook, folder, or whiteboard marker`
- `warm, engaging smile — approachable educator`

**nationality_visual_hints**：
- `small US flag badge or pin is acceptable but optional`
- `fair skin and lighter hair color (brown, blonde) suggests American/Western origin`
- `avoid heavy-handed 'American' stereotypes`

**scene_hints**：
- `standing in a classroom or language school setting`
- `interacting with students`

_note：PDF p.1 会話例「ケリーです。アメリカ人です。アメリカから来ました。先生です。」の人物。

### キムさん

| 項目 | 値 |
|---|---|
| gender | male |
| role_ja | 会社員 |
| role_en | company employee / office worker |
| nationality | Korean |
| age_range | 20s |
| portraitPath | `data/images/char_キム.png` |
| lesson_appearances | lesson_01 (p1 例文1-3, p2 例文2-3/2-5, p3 例文3-3) |

**character_visual_hints**：
- `short neat hair`
- `slim rectangular glasses`
- `business casual — dress shirt with slacks, no tie`
- `may carry a laptop bag or smartphone`
- `East Asian features — young Korean male office worker`

**nationality_visual_hints**：
- `small Korean flag badge on bag is acceptable but optional`
- `features should suggest East Asian (Korean) — similar to but distinct from Japanese`

**scene_hints**：
- `in an office building lobby or at a desk with laptop`
- `walking with a briefcase on a city sidewalk`

_note：PDF p.5 教え方の例・p.6 練習問題に登場。韓国人・会社員のモデル人物。

### タノムさん

| 項目 | 値 |
|---|---|
| gender | male |
| role_ja | 医者 |
| role_en | doctor |
| nationality | Vietnamese |
| age_range | 20s |
| portraitPath | `data/images/char_タノム.png` |
| lesson_appearances | lesson_01 (p3 例文3-1 「東西病院の医者です」) |

**character_visual_hints**：
- `short dark hair`
- `medium-brown warm skin tone (Southeast Asian)`
- `sporty or athletic build`
- `white doctor's coat over a simple shirt`
- `stethoscope around the neck`
- `Southeast Asian features — young Vietnamese male doctor`

**nationality_visual_hints**：
- `small Vietnamese flag badge on coat is acceptable but optional`
- `medium-brown skin tone and Southeast Asian features distinguish from East Asian characters`

**scene_hints**：
- `in a hospital corridor or examination room`
- `in front of a hospital building`

_note：v2.10 新設キャラクター。東西病院・医者・ベトナム人のモデル人物。

---

## 5.10 BUILDING_CUES

> [Template B `vocabulary_building`](part4_prompt_templates.md#template-b-vocabulary_building) で使用する 8 建物のデータ。
> v4.0.4 (2026-05-25) building 全面改訂：worktree image-prompt-plan の R1-R26 実機検証で確立した「universal cream background + 5-image reference attachment + universal rule A-1〜A-11 + per-vocab-type 4 件テーブル」設計に移行。学校 R25 / 大学 R26 / デパート R22 / 会社 R22 を採用版として本番化済。
> v4.0.4 fields は [PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4](part1_universal_rules.md#part-113-building_universal_rule_v4_0_4) と対応して per-building 変数を埋める。
> 旧 v3.0 fields（building_type / building_scale / primary_scene_cue / signage_text）は後方互換と未移行 building（駅 / スーパー）の現行 prompt 生成で残置。銀行 / 病院 は Phase 1-S1 (2026-05-29) で v4.0.4 fields に移行済。

### Reference image constants (v4.0.4)

全 building カード共通の reference image anchor：

| constant | path | 役割 |
|---|---|---|
| `BUILDING_BRAND_VOICE_REF` | `data/images/word_日本人.png` | image_1 anchor — brand voice / illustration tone / palette family / line weight |
| `BUILDING_ARCHITECTURAL_REF` | `data/images/vocab_病院.jpg` | image_5 anchor — architectural framing / close-up composition / building dominance ratio |

`image_2〜4` は per-building の `type_relevant_refs`（下記 v4_0_4 entry 内）から 3 件選ぶ。skill は計 5 枚を nanobanana チャットに添付して生成する（[PART 1.12 BUILDING_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-112-building_reference_attachment_rule)）。

### 学校 (v4.0.4 採用版 R25)

#### v4.0.4 fields

| 項目 | 値 |
|---|---|
| `vocab_type_desc` | `school` |
| `form_desc` | `a 2-3 story low-rise Japanese institutional school building with cream off-white walls, a slate-grey hip roof, and a central clock tower with a circular clock face that breaks the roofline at the building's vertical axis of symmetry` |
| `signature` | `the central clock tower with a circular clock face — the primary signature feature that identifies the building as a school at a glance` |
| `accent` | `warm yellow / sand-cream gold (a soft warm yellow within the muted pastel family — never saturated, never primary yellow)` |
| `accent_targets` | `accent color appears on: the clock tower trim, the entrance door frame, and the signboard frame — NOT on the main wall (walls stay cream)` |
| `label` | `SCHOOL` |
| `signboard_location` | `a single small rectangular signboard mounted on the wall directly above the main entrance, oriented horizontally, with the cream signboard background and a slate-navy outlined frame in accent warm yellow / sand-cream gold` |
| `signboard_location_short` | `above the main entrance` |
| `surroundings_context` | `campus` |
| `surroundings_block` | `a campus context: an auxiliary low-rise gymnasium or annex building is partially visible at the edge of the frame as a secondary mass (smaller / less detailed than the primary school), with a cream off-white sidewalk in front of the entrance and a few neat low shrubs flanking the entrance path. NO other freestanding buildings beyond the primary + one auxiliary. NO billboards, NO street vehicles, NO traffic signs.` |
| `framing_extra` | `BUILDING SCALE EMPHASIS: the school building DOMINATES the frame vertically — the clock tower top reaches the upper 8-12% of the canvas, the building edge-to-edge spans the horizontal frame, side wings extend off-frame at left and right. The building occupies 75% or more of the vertical canvas height. Figures are prominent at approximately 1/3 of the visible building height but do NOT shrink to background scale.` |
| `activities_block` | `4 figures in school uniforms, each engaged in a DIFFERENT activity at the school entrance: (1) one student entering the school gate from the sidewalk, body angled toward the entrance; (2) one student walking past in mid-stride along the sidewalk parallel to the building facade; (3) one student cycling on the sidewalk in the foreground — bicycle pose MUST follow [PART 1.13 A-11 cyclist pose specification](part1_universal_rules.md#part-113-building_universal_rule_v4_0_4) (torso leans forward, both hands grip handlebars, both feet on pedals in mid-pedaling rotation, NOT sitting upright with feet on ground); (4) two students chatting as a standing pair near the gate, both facing each other with natural posture. All figures wear school uniforms (white shirt + dark trousers or dark skirt + dark blazer optional) with the cyclist NOT wearing a warm yellow jacket (avoid accent color collision with the building accent).` |
| `landscaping_block` | `flanking the entrance path: 2-3 leafy summer trees with rounded canopies in muted warm green, drawn flat-vector style. NO flowers in pots, NO decorative urns, NO benches with text.` |
| `type_relevant_refs` | `["data/images/word_学生.png", "data/images/word_大学生.png", "data/images/word_先生.png"]` |

#### v3.0 fields (legacy / 未使用化 v4.0.4)

| 項目 | 値 |
|---|---|
| building_type | `school` |
| building_scale | `a cheerful Japanese elementary or junior high school building` |
| primary_scene_cue | `a prominent school gate in the foreground with two children in school uniforms — one with a randoseru backpack — walking through it` |
| signage_text | `SCHOOL` |

### 大学 (v4.0.4 採用版 R26)

#### v4.0.4 fields

| 項目 | 値 |
|---|---|
| `vocab_type_desc` | `university` |
| `form_desc` | `a 2-3 story university academic building with cream off-white walls, a slate-grey roof, and a stone-built campus gate at the front with vertical pillars and a horizontal stone sign beam above the gateway` |
| `signature` | `the stone-built campus gate with vertical pillars and the horizontal stone sign beam — the primary signature feature that identifies the building as a university at a glance` |
| `accent` | `sand-stone beige (a warm desaturated beige within the muted pastel family — evokes academic gravitas)` |
| `accent_targets` | `accent color appears on: the campus gate pillars, the stone sign beam, and the signboard frame — NOT on the main wall (walls stay cream)` |
| `label` | `UNIVERSITY` |
| `signboard_location` | `a single small rectangular signboard mounted on the horizontal sign beam above the campus gate, oriented horizontally, with the cream signboard background and a slate-navy outlined frame in accent sand-stone beige` |
| `signboard_location_short` | `on the sign beam above the campus gate` |
| `surroundings_context` | `campus (secondary academic building partially visible OK — 学び 12)` |
| `surroundings_block` | `a campus context: a secondary academic building of similar palette and roof slope is partially visible at the edge of the frame as a smaller secondary mass (less detailed than the primary), with a cream off-white sidewalk in front of the gate. NO other freestanding buildings beyond the primary + one secondary. NO billboards, NO street vehicles, NO traffic signs.` |
| `framing_extra` | `null` (default A-2 close-up framing applies — no extra emphasis needed because the campus gate signature is read at standard scale)` |
| `activities_block` | `4 figures in university-student casual wear, each engaged in a DIFFERENT activity at the campus gate: (1) one student entering through the gate from the sidewalk, body angled toward the entrance; (2) one student walking past in mid-stride along the sidewalk parallel to the gate, carrying a backpack; (3) one student cycling on the sidewalk in the foreground — bicycle pose MUST follow [PART 1.13 A-11 cyclist pose specification](part1_universal_rules.md#part-113-building_universal_rule_v4_0_4); the cyclist MUST NOT wear a warm yellow jacket (avoid accent color collision); (4) two students chatting as a standing pair near the gate, both facing each other with natural posture. All figures wear modern student casual (jacket + neat trousers / skirt + sneakers).` |
| `landscaping_block` | `flanking the gate path: 2-3 leafy summer trees with rounded canopies in muted warm green — all trees in leafy summer state (no winter bare branches, no autumn foliage). NO flowers in pots, NO decorative urns.` |
| `type_relevant_refs` | `["data/images/word_学生.png", "data/images/word_大学生.png", "data/images/word_先生.png"]` |

#### v3.0 fields (legacy / 未使用化 v4.0.4)

| 項目 | 値 |
|---|---|
| building_type | `university` |
| building_scale | `a grand campus entrance gate with tall pillars and a modern academic building behind it` |
| primary_scene_cue | `two young adult students in their 20s with backpacks walking through the campus gate` |
| signage_text | `UNIVERSITY` |

### デパート (v4.0.4 採用版 R22)

#### v4.0.4 fields

| 項目 | 値 |
|---|---|
| `vocab_type_desc` | `department store` |
| `form_desc` | `a 5-6 story urban mid-rise department store building with cream off-white walls and a slate-grey roofline; the upper floors extend off-frame at the top edge so only the ground floor and the next 2-3 floors are visible in close-up framing` |
| `signature` | `the 1st floor display windows showing fashion items + a small awning above the main entrance — the primary signature feature that identifies the building as a department store at a glance` |
| `accent` | `warm muted tan (a soft warm tan within the muted pastel family — evokes upscale commercial warmth)` |
| `accent_targets` | `accent color appears on: the awning, the display window frames, and the signboard frame — NOT on the main wall (walls stay cream)` |
| `label` | `DEPT. STORE` |
| `signboard_location` | `a single small rectangular signboard mounted on the wall directly above the main entrance (between the awning and the 2nd floor windows), oriented horizontally, with the cream signboard background and a slate-navy outlined frame in accent warm muted tan` |
| `signboard_location_short` | `above the main entrance, between the awning and the 2nd floor` |
| `surroundings_context` | `urban_corner` |
| `surroundings_block` | `an urban corner context: an adjacent commercial building of similar palette and roof slope is partially visible at the side edge of the frame (smaller / less detailed than the primary), with a cream off-white sidewalk in front of the entrance and a curbside lane edge visible at the bottom. NO other freestanding buildings beyond the primary + one adjacent. NO billboards, NO street vehicles in motion, NO traffic signs with text.` |
| `framing_extra` | `null` (default A-2 close-up framing — upper floors off-frame at top edge is intrinsic to this vocab type)` |
| `activities_block` | `4 figures in modern urban casual wear, each engaged in a DIFFERENT activity at the department store entrance: (1) one shopper entering the main entrance from the sidewalk, carrying an empty shopping bag, body angled toward the entrance; (2) one shopper walking past in mid-stride along the sidewalk parallel to the facade, carrying a filled shopping bag; (3) one shopper window-shopping at the 1st floor display window, body facing the display in side-view; (4) two shoppers chatting as a standing pair outside the entrance, both facing each other with natural posture. All figures wear modern urban casual (light jacket + neat trousers / dress + loafers or sneakers).` |
| `landscaping_block` | `flanking the entrance: 1-2 leafy summer trees with rounded canopies in muted warm green in narrow tree-pit planters along the sidewalk edge. NO flowers in pots, NO decorative urns.` |
| `type_relevant_refs` | `["data/images/word_会社員.png", "data/images/word_アメリカ人.png", "data/images/word_韓国人.png"]` |

#### v3.0 fields (legacy / 未使用化 v4.0.4)

| 項目 | 値 |
|---|---|
| building_type | `department store` |
| building_scale | `a tall elegant multi-story urban building — clearly upscale, not a supermarket` |
| primary_scene_cue | `wide elegant ground-floor display windows showing fashion items, with one shopper carrying a shopping bag near the entrance` |
| signage_text | `DEPT. STORE` |

### 会社 (v4.0.4 採用版 R22)

#### v4.0.4 fields

| 項目 | 値 |
|---|---|
| `vocab_type_desc` | `company office` |
| `form_desc` | `a 5-6 story urban mid-rise office building with cream off-white walls and a slate-grey roofline; the upper floors extend off-frame at the top edge so only the ground floor lobby and the next 2-3 floors are visible in close-up framing` |
| `signature` | `the ground-floor glass curtain-wall lobby + entrance doors — the primary signature feature that identifies the building as a company office at a glance` |
| `accent` | `dull muted blue (a desaturated soft blue within the muted pastel family — evokes corporate calm)` |
| `accent_targets` | `accent color appears on: the glass curtain-wall framing, the entrance door frame, and the signboard frame — NOT on the main wall (walls stay cream)` |
| `label` | `OFFICE` |
| `signboard_location` | `a single small rectangular signboard mounted on the wall directly above the main entrance (between the lobby curtain-wall and the 2nd floor windows), oriented horizontally, with the cream signboard background and a slate-navy outlined frame in accent dull muted blue` |
| `signboard_location_short` | `above the main entrance, between the lobby and the 2nd floor` |
| `surroundings_context` | `urban_corner` |
| `surroundings_block` | `an urban corner context: an adjacent commercial building of similar palette is partially visible at the side edge of the frame (smaller / less detailed than the primary), with a cream off-white sidewalk in front of the entrance and a curbside lane edge visible at the bottom. NO other freestanding buildings beyond the primary + one adjacent. NO billboards, NO street vehicles in motion, NO traffic signs with text.` |
| `framing_extra` | `null` (default A-2 close-up framing — upper floors off-frame at top edge is intrinsic to this vocab type)` |
| `activities_block` | `4 figures in business attire, each engaged in a DIFFERENT activity at the office entrance: (1) one office worker entering the lobby from the sidewalk, carrying a briefcase, body angled toward the entrance; (2) one office worker walking past in mid-stride along the sidewalk parallel to the facade, wearing a suit; (3) one office worker walking with a phone held to the ear in mid-conversation, body in side-view; (4) two office workers chatting as a standing pair outside the entrance, both facing each other with natural posture. All figures wear modern business attire (suit + tie / blazer + neat trousers + loafers).` |
| `landscaping_block` | `flanking the entrance: 1-2 leafy summer trees with rounded canopies in muted warm green in narrow tree-pit planters along the sidewalk edge. NO flowers in pots, NO decorative urns.` |
| `type_relevant_refs` | `["data/images/word_会社員.png", "data/images/word_アメリカ人.png", "data/images/word_韓国人.png"]` |

#### v3.0 fields (legacy / 未使用化 v4.0.4)

| 項目 | 値 |
|---|---|
| building_type | `company office` |
| building_scale | `a mid-sized modern office building, not a skyscraper` |
| primary_scene_cue | `automatic glass entrance doors with one office worker in a business suit walking in, carrying a briefcase` |
| signage_text | `OFFICE` |

### 銀行 (v4.0.4 fields 付与済 / R-iteration pending)

> Phase 1-S1 (2026-05-29) で v4.0.4 fields 付与。base = デパート R22 / 会社 R22 (urban mid-rise / urban_corner)。PNG 採用版確定後に行頭 comment に R-version を記録する（例: 銀行 R3 採用）。

#### v4.0.4 fields

| 項目 | 値 |
|---|---|
| `vocab_type_desc` | `bank branch` |
| `form_desc` | `a 3-4 story urban mid-rise bank branch building with cream off-white walls and a slate-grey roofline; the ground floor is a glass-front banking hall and the upper 2-3 floors extend toward the top edge of the frame in close-up framing` |
| `signature` | `the ground-floor glass-front banking hall revealing a teller counter inside, with a single ATM unit recessed in the wall beside the main entrance — the primary signature feature that identifies the building as a bank at a glance` |
| `accent` | `muted teal blue (a soft desaturated teal within the muted pastel family — evokes financial trust and calm; distinct from 会社's dull muted blue by its green undertone)` |
| `accent_targets` | `accent color appears on: the ATM unit surround, the entrance door frame, and the signboard frame — NOT on the main wall (walls stay cream)` |
| `label` | `BANK` |
| `signboard_location` | `a single small rectangular signboard mounted on the wall directly above the main entrance (between the banking-hall glass and the 2nd floor windows), oriented horizontally, with the cream signboard background and a slate-navy outlined frame in accent muted teal blue` |
| `signboard_location_short` | `above the main entrance, between the banking hall and the 2nd floor` |
| `surroundings_context` | `urban_corner` |
| `surroundings_block` | `an urban corner context: an adjacent commercial building of similar palette and roof slope is partially visible at the side edge of the frame (smaller / less detailed than the primary), with a cream off-white sidewalk in front of the entrance and a curbside lane edge visible at the bottom. NO other freestanding buildings beyond the primary + one adjacent. NO billboards, NO street vehicles in motion, NO traffic signs with text.` |
| `framing_extra` | `null` (default A-2 close-up framing — upper floors off-frame at top edge is intrinsic to this vocab type)` |
| `activities_block` | `4 figures in modern everyday and business-casual wear, each engaged in a DIFFERENT activity at the bank entrance: (1) one customer entering the main entrance from the sidewalk, carrying a document envelope, body angled toward the entrance; (2) one customer using the ATM unit beside the entrance, body facing the ATM in side-view; (3) one customer walking past in mid-stride along the sidewalk parallel to the facade; (4) two customers chatting as a standing pair outside the entrance, both facing each other with natural posture. All figures wear modern everyday or business-casual wear (light jacket + neat trousers / dress + loafers or sneakers); NO figure wears a teal-colored garment (avoid accent color collision with the building accent).` |
| `landscaping_block` | `flanking the entrance: 1-2 leafy summer trees with rounded canopies in muted warm green in narrow tree-pit planters along the sidewalk edge. NO flowers in pots, NO decorative urns.` |
| `type_relevant_refs` | `["data/images/word_会社員.png", "data/images/word_アメリカ人.png", "data/images/word_中国人.png"]` |

#### v3.0 fields (legacy / 未使用化 v4.0.4)

| 項目 | 値 |
|---|---|
| building_type | `bank` |
| building_scale | `a small to medium neighborhood bank branch — NOT a corporate skyscraper` |
| primary_scene_cue | `a single ATM unit beside the entrance door with one customer using it` |
| signage_text | `BANK` |

### 病院 (v4.0.4 fields 付与済 / R-iteration pending / image_5 architectural anchor として使用中)

> Phase 1-S1 (2026-05-29) で v4.0.4 fields 付与。base = 学校 R25 (low-rise institution / campus / BUILDING SCALE EMPHASIS)。**`data/images/vocab_病院.jpg` は全 building カードの image_5 architectural reference として現役（学校 / 大学 / デパート / 会社 の生成に使用済）。病院自身の生成では image_5 が病院そのものなので fidelity が高い。** PNG 採用版確定後に行頭 comment に R-version を記録する。

#### v4.0.4 fields

| 項目 | 値 |
|---|---|
| `vocab_type_desc` | `hospital` |
| `form_desc` | `a 2-3 story low-rise institutional hospital building with cream off-white walls, a slate-grey roof, and a covered entrance canopy projecting over the main entrance at the building's central vertical axis` |
| `signature` | `the covered entrance canopy with a wheelchair ramp leading up to it and a clearly visible red cross symbol on the facade above the canopy — the primary signature feature that identifies the building as a hospital at a glance` |
| `accent` | `soft warm sage green (a soft desaturated sage green within the muted pastel family — evokes clinical calm and care)` |
| `accent_targets` | `accent color appears on: the entrance canopy fascia, the entrance door frame, and the signboard frame — NOT on the main wall (walls stay cream). The red cross symbol is a SEPARATE dominant identifier rendered in deep muted red (the single saturated element permitted, as a recognized medical symbol).` |
| `label` | `HOSPITAL` |
| `signboard_location` | `a single small rectangular signboard mounted on the wall directly above the entrance canopy, oriented horizontally, with the cream signboard background and a slate-navy outlined frame in accent soft warm sage green` |
| `signboard_location_short` | `above the entrance canopy` |
| `surroundings_context` | `campus` |
| `surroundings_block` | `a hospital-grounds context: an auxiliary low-rise outpatient annex of similar palette and roof slope is partially visible at the edge of the frame as a secondary mass (smaller / less detailed than the primary), with a cream off-white sidewalk in front of the entrance and a few neat low shrubs flanking the entrance path beside the wheelchair ramp. NO other freestanding buildings beyond the primary + one annex. NO billboards, NO street vehicles, NO traffic signs.` |
| `framing_extra` | `BUILDING SCALE EMPHASIS: the hospital building DOMINATES the frame vertically — the red cross symbol sits in the upper 8-12% of the canvas, the building edge-to-edge spans the horizontal frame, side wings extend off-frame at left and right. The building occupies 75% or more of the vertical canvas height. Figures are prominent at approximately 1/3 of the visible building height but do NOT shrink to background scale.` |
| `activities_block` | `4 figures, each engaged in a DIFFERENT activity at the hospital entrance: (1) one visitor in everyday wear entering up the ramp toward the canopy entrance, body angled toward the entrance; (2) one medical staff member in light-colored scrubs walking past in mid-stride along the sidewalk parallel to the facade; (3) one wheelchair user in the foreground moving along the sidewalk toward the ramp — seated upright in the wheelchair, both hands on the wheel rims, body facing the ramp in 3/4 view; (4) two people (a visitor and a staff member) chatting as a standing pair near the entrance, both facing each other with natural posture. Visitors wear modern everyday casual; staff wear light-colored scrubs; NO figure wears a sage-green garment (avoid accent color collision with the building accent).` |
| `landscaping_block` | `flanking the entrance path: 2-3 leafy summer trees with rounded canopies in muted warm green, drawn flat-vector style, plus a few neat low shrubs. NO flowers in pots, NO decorative urns, NO benches with text.` |
| `type_relevant_refs` | `["data/images/word_医者.png", "data/images/word_先生.png", "data/images/word_学生.png"]` |

#### v3.0 fields (legacy / 未使用化 v4.0.4)

| 項目 | 値 |
|---|---|
| building_type | `hospital` |
| building_scale | `a medium to large hospital building with a calm, clean exterior` |
| primary_scene_cue | `a covered entrance canopy with a wheelchair ramp and a clearly visible red cross symbol on the facade` |
| signage_text | `HOSPITAL` |

### 駅 (v4.0.4 移行待ち)

| 項目 | 値 |
|---|---|
| building_type | `train station` |
| building_scale | `a Japanese train station entrance building` |
| primary_scene_cue | `ticket gates visible through the open entrance with one commuter walking in` |
| signage_text | `STATION` |

### スーパー (v4.0.4 移行待ち)

| 項目 | 値 |
|---|---|
| building_type | `supermarket` |
| building_scale | `a wide low-rise supermarket building with a broad storefront` |
| primary_scene_cue | `automatic sliding doors with a row of shopping carts beside them and one customer pushing a cart out` |
| signage_text | `SUPERMARKET` |

---

## 5.11 OBJECT_SIGNATURES

> [Template D `vocabulary_object_concrete`](part4_prompt_templates.md#template-d-vocabulary_object_concrete) で使用する物体カテゴリ別シグネチャー辞書（資料 11）。
> 構造：
> - `primary_signatures`：識別に最も重要な要素（必須）
> - `material_hints`：素材感を「記号」として伝えるテクスチャヒント
> - `avoid`：AI が混同しやすい誤り（ネガティブプロンプトに使用可）
> - `canonical_view`：推奨視点

### 雑誌 (magazine)

**primary_signatures**：
- `A bold magazine title/masthead banner printed across the very top of the cover — the single strongest identifier`
- `Multiple coverline headlines in different font sizes layered over a cover photo`
- `Visible physical thinness compared to a book — the spine is thin`

**material_hints**：
- `Subtle curved lines at the bottom edge of pages as flat paper edges (no gloss)`
- `A faint saddle-stitch line along the spine center`

**avoid**：Do not draw it as a thick hardcover book. Do not omit the masthead banner.
**canonical_view**：3/4 view from slightly above — shows front cover AND spine thickness

### 本 (book)

**primary_signatures**：
- `A clearly visible thick spine with visible page edges on the opposite side`
- `Hard or soft cover with a distinct rectangular cover design`
- `Significantly thicker than a magazine`

**material_hints**：
- `Page edge lines visible on the side — many thin horizontal lines stacked`
- `A bookmark ribbon or fabric tail hanging from the top of the spine`

**avoid**：Do not confuse with magazine (no masthead) or notebook (no cover art).
**canonical_view**：3/4 view — shows cover AND spine AND page edges simultaneously

### 新聞 (newspaper)

**primary_signatures**：
- `Large broadsheet format — significantly wider than a magazine`
- `Multi-column text layout visible (simplified as parallel vertical lines)`
- `Folded in half horizontally, with a visible fold crease`

**material_hints**：
- `Uncoated matte paper texture — no glossy highlight lines`
- `Slightly wrinkled or uneven edges suggesting newsprint`

**avoid**：Do not show it as glossy (that is magazine). Do not make it small.
**canonical_view**：Slight 3/4 from above — shows the fold and the column layout

### ノート (notebook)

**primary_signatures**：
- `Spiral binding coils clearly visible on the left or top edge`
- `OR: composition notebook with a simple plain cover and no imagery`
- `Ruled lines visible on the open pages`

**material_hints**：
- `Wire coil rings rendered as a series of small oval loops`
- `Slightly bent or dog-eared page corners`

**avoid**：Do not add a cover photo (that is a magazine). Do not use a thick spine.
**canonical_view**：3/4 from slightly above — shows spiral AND one page corner

### ケータイ・スマートフォン (smartphone)

**primary_signatures**：
- `App icon grid visible on the screen — small colored rounded squares in a 3×4 grid`
- `Rear camera module: a cluster of 2-3 circular lens openings in the top-left corner of the back`
- `Status bar at the top of the screen showing simplified time or signal icons`

**material_hints**：
- `A flat white reflection mark (single straight line, no gradient) across the top-right of the screen — symbolic glass surface`
- `Metallic thin frame line along the edges of the device`

**avoid**：Do not render as a plain black rectangle with no screen content.
**canonical_view**：Slight 3/4 from above showing screen face AND one side edge

### パソコン (laptop/computer)

**primary_signatures**：
- `Open laptop: screen + keyboard visible at an obtuse angle`
- `Desktop: separate monitor + keyboard unit clearly separated`
- `Screen shows a simplified UI — window chrome or desktop wallpaper`

**material_hints**：
- `Keyboard key grid — small uniform square keys arranged in rows`
- `Thin metallic body edges with rounded corners`

**avoid**：Do not show a closed laptop (indistinguishable from a book).
**canonical_view**：3/4 eye-level — shows screen face AND keyboard at angle

### テレビ (television)

**primary_signatures**：
- `Wide rectangular screen with a visible bezel frame`
- `A flat stand or wall-mount base below the screen`
- `A simplified image or pattern visible on the screen`

**material_hints**：
- `Thin flat highlight line across the top edge of the screen (symbolic, no gloss)`
- `Slim body depth visible from the side — modern flat panel`

**avoid**：Do not draw old CRT shape unless context requires it.
**canonical_view**：Slight 3/4 from eye level — shows screen AND stand base

### カメラ (camera)

**primary_signatures**：
- `A prominent circular lens barrel protruding from the front face`
- `A viewfinder bump on the top right of the body`
- `A shutter button clearly visible on the top surface`

**material_hints**：
- `Lens glass surface: concentric circles inside the barrel`
- `Textured grip on the right side of the body`

**avoid**：Do not flatten the lens — the circular protrusion is the key identifier.
**canonical_view**：3/4 from slightly above — shows lens front AND top shutter button

### 財布 (wallet)

**primary_signatures**：
- `Dashed stitching lines along all edges — the single strongest leather identifier`
- `Bi-fold structure with a visible center crease/fold line`
- `Multiple card slot openings peeking out from the top or side`

**material_hints**：
- `Subtle dot stippling pattern on the leather surface as symbolic grain texture`
- `A metal snap button or clasp on the closure point`

**avoid**：Do not omit the stitching. Without stitching it looks like a generic rectangle.
**canonical_view**：3/4 from slightly above — shows front face, fold crease, AND one edge

### カード (card)

**primary_signatures**：
- `A gold or silver EMV chip rectangle in the upper-left area — the definitive credit card symbol`
- `A horizontal magnetic stripe across the back (if back view) — dark brown stripe`
- `Perfectly precise rounded corners — sharper and more uniform than a folded wallet`

**material_hints**：
- `A thin diagonal white reflection line across the card surface (single flat line, no sheen)`
- `Holographic rainbow stripe near the chip (optional, for credit card)`

**avoid**：Do not confuse with smartphone (card has no screen/camera). Always include chip.
**canonical_view**：Slight 3/4 from above — shows card face AND one short edge thickness

### 車 (car)

**primary_signatures**：
- `Visible wheel arches with circular tires clearly rendered`
- `Side windows as distinct transparent (light blue tinted) shapes`
- `A door handle line along the side panel`

**material_hints**：
- `Thin white reflection line along the roof roofline (single flat line, no sheen)`
- `Headlight lens details — circular or trapezoidal lens shapes`

**avoid**：Do not draw without wheels — wheels are the primary vehicle identifier.
**canonical_view**：3/4 front-side view — shows front face, side, AND wheels

### 自転車 (bicycle)

**primary_signatures**：
- `Two equal-sized circular wheels with visible spoke lines`
- `A chain linking the rear wheel to the pedal crankset`
- `Handlebars and saddle as clearly distinct components`

**material_hints**：
- `Thin metal frame tubes — consistent line weight throughout`
- `Visible spokes radiating from the wheel hubs`

**avoid**：Do not omit spokes — without them it looks like a scooter or motorbike.
**canonical_view**：True side profile — the only view that shows the diamond frame clearly

### コップ・グラス (cup/glass)

**primary_signatures**：
- `Transparent or semi-transparent cylinder — show light blue interior tint`
- `A subtle flat highlight line on the left side of the glass (symbolic, no specular)`
- `No handle = glass/コップ; with handle = mug/マグカップ (distinguish clearly)`

**material_hints**：
- `Thin white flat line across the top rim (no shading)`
- `A faint liquid level line inside if drink contents are shown`

**avoid**：Do not make it fully opaque — transparency is the key identifier.
**canonical_view**：Slight 3/4 from above — shows opening rim AND side profile

### 茶碗 (rice bowl)

**primary_signatures**：
- `Shallow curved bowl shape with a curved inward foot ring at the base`
- `White rice texture inside if top view is shown — small grain dots`
- `Traditional ceramic pattern or simple band design on the exterior`

**material_hints**：
- `Matte ceramic surface — no glossy specular highlights`
- `A deep slate navy outline at the base contour`

**avoid**：Do not confuse with a coffee mug (no handle) or western bowl (no foot ring).
**canonical_view**：3/4 from slightly above — shows interior rice AND side profile

---

## 5.12 SPATIAL_GRID_PATTERNS

> [Template F `spatial_relation`](part4_prompt_templates.md#template-f-spatial_relation) と [Template G `demonstrative_kosoado`](part4_prompt_templates.md#template-g-demonstrative_kosoado) で使用する 9 方向 × {camera, layout, grid_aid} 辞書（資料 12）。
> `{CAMERA_SETUP}` placeholder に対応するパターンを転記する。

### 上 (to the top of / 上に)

| 項目 | 値 |
|---|---|
| camera | `Eye-level side view (50mm lens). The reference object at the center-bottom of the frame.` |
| layout | `The target object rests directly on top of the reference object's upper surface. Exaggerate the vertical gap slightly.` |
| grid_aid | `Draw 2-3 horizontal floor/shelf lines behind the scene to reinforce the vertical axis.` |

### 下 (under / below / 下に)

| 項目 | 値 |
|---|---|
| camera | `Eye-level side view (50mm lens). The reference object at the center-upper area.` |
| layout | `The target object is positioned directly below the reference object, resting on the floor/surface.` |
| grid_aid | `Draw a clear floor line to anchor both objects vertically.` |

### 中 (inside / 中に)

| 項目 | 値 |
|---|---|
| camera | `Slight elevated 3/4 view to show interior. The container reference object centered.` |
| layout | `The container walls are rendered as semi-transparent outlines so the interior target is visible.` |
| grid_aid | `A dashed inner rectangle inside the container outline reinforces the 'inside' concept.` |

### 前 (in front of / 前に)

| 項目 | 値 |
|---|---|
| camera | `FIRST-PERSON POV — no character drawn. The viewer IS the speaker looking forward.` |
| layout | `The reference object is at the center background. The target object is between the viewer and the reference, closer to the camera.` |
| grid_aid | `Floor tiles or a perspective grid strongly recommended to reinforce depth / front vs back.` |

### 後ろ (behind / 後ろに)

| 項目 | 値 |
|---|---|
| camera | `FIRST-PERSON POV — no character drawn. The viewer IS the speaker looking forward.` |
| layout | `The reference object is in the center foreground. The target object is partially hidden behind it, smaller due to perspective.` |
| grid_aid | `Use a perspective grid. The target object should be peeking out from behind the reference.` |

### 右 (to the right of / 右に)

| 項目 | 値 |
|---|---|
| camera | `BACK-FACING VIEW. Draw the character from behind (we see their back). Character faces forward.` |
| layout | `The target object is positioned to the RIGHT of the character from the character's own perspective — which is also the viewer's right.` |
| grid_aid | `An amber-colored right-pointing arrow above the target object reinforces the direction.` |

### 左 (to the left of / 左に)

| 項目 | 値 |
|---|---|
| camera | `BACK-FACING VIEW. Draw the character from behind (we see their back). Character faces forward.` |
| layout | `The target object is positioned to the LEFT of the character from the character's own perspective — which is also the viewer's left.` |
| grid_aid | `An amber-colored left-pointing arrow above the target object reinforces the direction.` |

### となり (next to / beside / そばに・となりに)

| 項目 | 値 |
|---|---|
| camera | `Eye-level front view (50mm lens).` |
| layout | `Both the reference object and target object are side by side at the same depth plane, with a small visible gap between them.` |
| grid_aid | `A double-headed horizontal arrow between the two objects reinforces adjacency.` |

### 間 (between / 間に)

| 項目 | 値 |
|---|---|
| camera | `Eye-level front view (50mm lens).` |
| layout | `Three objects in a horizontal row: Object A — Target — Object B. The target is centered exactly between A and B.` |
| grid_aid | `Two vertical dashed lines flanking the target define the 'between' space.` |

---

## 5.13 ABSTRACT_METAPHORS

> [Template I `abstract_concept`](part4_prompt_templates.md#template-i-abstract_concept) で使用する抽象概念のメタファー辞書（資料 10：TIAC）。
> 各 entry が `composition_mood` / `concept_definition` / `visual_metaphor` / `emotional_tone` / `color_adjustment` を持ち、template の対応 placeholder に転記。

### 感情・状態

#### 好き (like / love)

| 項目 | 値 |
|---|---|
| composition_mood | `warm and affectionate, centered figure-with-symbol composition` |
| concept_definition | `Positive emotional attachment to a person, thing, or activity` |
| visual_metaphor | `A character holding a large solid amber heart shape toward the viewer (no glow / no gradient), or cradling an object with both hands in a protective gesture` |
| emotional_tone | `warm, inviting, gentle` |
| color_adjustment | `Increase warm amber gold and symbol_pink_warm tones (use educational_symbol_colors)` |

#### 嫌い (dislike / hate)

| 項目 | 値 |
|---|---|
| composition_mood | `cool dismissive, figure turning away from object` |
| concept_definition | `Negative emotional rejection of a person, thing, or activity` |
| visual_metaphor | `A character turning away from an object with one hand held up (stop gesture), or an X mark hovering over the disliked object` |
| emotional_tone | `tense, rejecting` |
| color_adjustment | `Use symbol_blue_cool tones; avoid warm colors (use educational_symbol_colors)` |

#### 楽しい (fun / enjoyable)

| 項目 | 値 |
|---|---|
| composition_mood | `upbeat dynamic, multiple small sparkle marks around figure` |
| concept_definition | `A state of joy and engagement in an activity` |
| visual_metaphor | `A character with arms raised, surrounded by small star or sparkle shapes; OR two characters doing an activity together with visible energy lines` |
| emotional_tone | `energetic, light, celebratory` |
| color_adjustment | `Warm amber gold accents (color_palette.accent); high visual energy in composition` |

#### 悲しい (sad)

| 項目 | 値 |
|---|---|
| composition_mood | `quiet inward, downward composition with weight` |
| concept_definition | `A state of emotional sorrow or grief` |
| visual_metaphor | `A character sitting with head bowed; OR a wilting flower; OR a single teardrop shape above the character` |
| emotional_tone | `quiet, heavy, withdrawn` |
| color_adjustment | `Dominant cool slate gray and muted blue; reduce warm tones` |

#### 嬉しい (happy / glad)

| 項目 | 値 |
|---|---|
| composition_mood | `expansive open, radiating sparkles outward` |
| concept_definition | `A state of pleasure or delight, often in response to good news` |
| visual_metaphor | `A character with both hands raised in celebration, or a character receiving something with a big open smile; sparkle lines radiating outward` |
| emotional_tone | `bright, expansive, celebratory` |
| color_adjustment | `Maximum warm amber gold accents` |

#### 怒る (angry)

| 項目 | 値 |
|---|---|
| composition_mood | `sharp tense, jagged radiating lines` |
| concept_definition | `A state of strong displeasure or irritation` |
| visual_metaphor | `A character with a furrowed brow, clenched fist raised, with jagged spike lines or steam lines radiating from the head` |
| emotional_tone | `tense, sharp, kinetic` |
| color_adjustment | `symbol_red accent lines (use educational_symbol_colors); reduce soft tones` |

#### 疲れる (tired / exhausted)

| 項目 | 値 |
|---|---|
| composition_mood | `slumped heavy, downward depleted composition` |
| concept_definition | `A state of physical or mental depletion after effort` |
| visual_metaphor | `A character slumped in a chair or leaning against a wall, with downward drooping lines from the eyes or head` |
| emotional_tone | `heavy, slow, depleted` |
| color_adjustment | `Muted, desaturated palette; reduce bright accents` |

#### 心配 (worry / anxiety)

| 項目 | 値 |
|---|---|
| composition_mood | `uncertain inward, single floating question mark above` |
| concept_definition | `A state of mental unease about an uncertain future event` |
| visual_metaphor | `A character with one hand on their chin looking upward at a large question mark cloud; OR a character looking at a clock with a worried posture` |
| emotional_tone | `uncertain, tense, inward` |
| color_adjustment | `cool slate gray dominant (color_palette.sub_color); warm amber gold for the question mark symbol only` |

### 社会・関係

#### 友達・友情 (friendship)

| 項目 | 値 |
|---|---|
| composition_mood | `balanced symmetric, two figures or interlocked pieces` |
| concept_definition | `A close mutual bond of trust and affection between people` |
| visual_metaphor | `Two characters standing side by side, shoulders touching, both facing forward; OR two puzzle pieces fitting perfectly together with a small amber star mark at the joint (no lighting effect)` |
| emotional_tone | `warm, balanced, connected` |
| color_adjustment | `Equal warm amber gold on both characters; unified palette` |

#### 家族 (family)

| 項目 | 値 |
|---|---|
| composition_mood | `warm cluster, multiple figures harmonized` |
| concept_definition | `A group of people connected by blood, care, and shared life` |
| visual_metaphor | `Three or more figures of different heights standing together in a cluster, all facing forward` |
| emotional_tone | `warm, protective, stable` |
| color_adjustment | `Harmonized warm tones across all figures (skin tones naturally varied, but visually balanced)` |

#### 仕事 (work)

| 項目 | 値 |
|---|---|
| composition_mood | `focused structured, desk-anchored composition` |
| concept_definition | `Purposeful activity done as an occupation or duty` |
| visual_metaphor | `A character at a desk with papers/laptop and a clock visible in the background; OR a character in work attire carrying tools of their trade` |
| emotional_tone | `focused, purposeful, structured` |
| color_adjustment | `Neutral muted blue dominant; amber for accent details` |

#### 生活 (daily life / lifestyle)

| 項目 | 値 |
|---|---|
| composition_mood | `calm grounded, home-anchored everyday objects` |
| concept_definition | `The pattern of everyday activities that make up a person's life` |
| visual_metaphor | `A character in a home setting surrounded by everyday objects (bed, table, cup); OR a clock cycle with small icons around it showing morning/afternoon/night activities` |
| emotional_tone | `calm, routine, grounded` |
| color_adjustment | `Soft neutral palette; warm cream and muted blue` |

### 時間・変化

#### むかし (long ago / past)

| 項目 | 値 |
|---|---|
| composition_mood | `nostalgic distant, sepia-toned simplified scene` |
| concept_definition | `A time far in the past, often with nostalgic or historical connotation` |
| visual_metaphor | `An old-style calendar or scroll; OR a sepia-toned silhouette of an older-era scene (simplified house or clothing style); OR a clock with hands turning backward` |
| emotional_tone | `nostalgic, soft, distant` |
| color_adjustment | `warm amber gold and symbol_sepia tones dominant (use educational_symbol_colors); reduce bright colors` |

#### これから (from now on / future)

| 項目 | 値 |
|---|---|
| composition_mood | `hopeful forward, horizon-anchored facing right` |
| concept_definition | `The time ahead; a sense of beginning or forward momentum` |
| visual_metaphor | `A character walking forward on a path that extends into the horizon; OR a flat amber horizon band with figure silhouette facing right (no actual lighting)` |
| emotional_tone | `hopeful, forward-moving, open` |
| color_adjustment | `warm amber gold for the horizon/light source; symbol_sky_pale for the sky (use educational_symbol_colors)` |

#### 変わる (change)

| 項目 | 値 |
|---|---|
| composition_mood | `transitional, before/after split with curved transition arrow` |
| concept_definition | `A state of transformation from one form or condition to another` |
| visual_metaphor | `Two-panel before/after: left panel shows old state (muted colors), right panel shows new state (brighter colors), with a curved arc arrow between them` |
| emotional_tone | `dynamic, transitional` |
| color_adjustment | `Left panel: cool slate gray (color_palette.sub_color); Right panel: warm amber gold and muted warm blue` |

---

## 5.14 VISUAL_SYMBOLS

> 視覚的慣習シンボル一覧。例文画像（[Template C](part4_prompt_templates.md#template-c-example_sentence)）で使用。
> v3.4 (M-32) note：「2 択・比較」「怒り・感情」エントリは [Template J PAIR_CONTRAST](part3_vocab_type_rules.md#35-adjective-vocab_type--adjective) / [Template H SYMBOLIC_MOTION_LINES](part3_vocab_type_rules.md#34-action_verb-vocab_type--action_verb) / [Template I abstract_concept](part3_vocab_type_rules.md#36-abstract_concept-vocab_type--abstract_concept) と機能重複する。Template J/H/I 本文で表現できる場合はそちらを優先。VISUAL_SYMBOLS は例文画像の補助シンボルとして利用するのが原則。

| symbol_key | _en | description |
|---|---|---|
| 質問・疑問 | `question` | `A large, clearly drawn bold question mark symbol floats above the subject's head.` |
| はい・肯定 | `yes` | `A large symbol_green circle with a bold checkmark floats above the character (use educational_symbol_colors.symbol_green).` |
| いいえ・否定 | `no` | `A large symbol_red circle with a bold X mark floats above the character (use educational_symbol_colors.symbol_red).` |
| 動作の方向 | `action direction` | `A curved symbol_red or symbol_orange motion arrow indicates the direction of the action (use educational_symbol_colors).` |
| 指示・注目 | `pointing` | `The character points clearly with one hand toward the subject of attention.` |
| 2択・比較 | `yes/no split` | `A split image divided into two equal panels side by side. Left panel: yes/positive. Right panel: no/negative.` |
| 怒り・感情 | `emotion` | `A facial expression and body posture clearly convey the emotion. No ambiguity.` |
| 場所の提示 | `showing location` | `The character holds up a card or ID toward the viewer to indicate identity or location.` |
