# PART 3: vocab_type-specific Rules

> 対象：vocab_type 固有のルール（aspect ratio / camera / pose / strategy 選択基準 + 各 strategy block 本体）。
> [PART 1](part1_universal_rules.md) universal rule の上に積まれる。[PART 4](part4_prompt_templates.md) PROMPT_TEMPLATES と対で機能。
> Migrated from `prompts/master_prompt_design_guide_v4_0.py` (hash `891b73f5ae2d`) — extracted from PROMPT_TEMPLATES (lines 2735-3330) + DEMONSTRATIVE_MODELS / OBJECT_STRATEGIES / ACTION_VERB_STRATEGIES / ADJECTIVE_STRATEGIES / SPATIAL_GRID_PATTERNS / ARROW_SEMIOTICS (lines 3697-4290).
> See also: [PART 1](part1_universal_rules.md), [PART 4](part4_prompt_templates.md), [PART 5](part5_vocab_reference_appendix.md).

---

## 3.1 person (vocab_type = person)

### Aspect ratio / framing

- 1:1 square（v3.11.1 Gemini fallback 規律）
- Full-body shot：頭から両足まで完全に枠内・80% of image HEIGHT
- 左右に empty margin（zoom/crop しない）

### Camera

- HORIZONTAL 3/4 view at EYE LEVEL
- 30-45° to one side（diagonal front view）
- 50mm-equivalent lens（NOT 85mm portrait lens）
- v4.0 nationality 例外：両手で胸前 flag pose を許容するため `15-30 degrees off frontal` も可

### Pose / Composition

- 立位・arms naturally at sides（role の場合）
- v4.0 nationality：arms bent at elbows, both hands holding hand-held flag in front of chest
- 表情：neutral and welcoming
- Both feet visible on flat ground

### Role vs Nationality dispatch

- word が「人」で終わる → **nationality**（[`PERSON_NATIONALITY_HINTS`](part5_vocab_reference_appendix.md#52-person_nationality_hints) lookup + `NATIONALITY_EXCEPTION_BLOCK` 注入）
- それ以外 → **role**（[`PERSON_ROLE_LOOKUP`](part5_vocab_reference_appendix.md#51-person_role_lookup) → [`ROLE_BASED_GENERIC_PROFILES`](part5_vocab_reference_appendix.md#58-role_based_generic_profiles) + `ROLE_ANTI_FLAG_BLOCK` 注入）
- 固定キャラ（鈴木さん等）→ [`NAMED_CHARACTER_PROFILES`](part5_vocab_reference_appendix.md#59-named_character_profiles) lookup（[PART 1.1 scope](part1_universal_rules.md#part-11-nationality_noun_policy) 例外として nationality / role policy の外）

### Universal rule references

[Template A](part4_prompt_templates.md#template-a-vocabulary_person) は以下 universal rule を inline directive として埋め込んでいる：

- [PART 1.5 PHENOTYPE_SPECIFICATION_RULE](part1_universal_rules.md#part-15-phenotype_specification_rule) — `{APPARENT_FEATURES_HINT}` 経由
- [PART 1.7 FLAG_PLACEMENT_RULE](part1_universal_rules.md#part-17-flag_placement_rule) — `{FLAG_PLACEMENT}` 経由（v4.0 constant）
- [PART 1.8 FACIAL_FEATURES_RULE](part1_universal_rules.md#part-18-facial_features_rule) — template inline directive
- [PART 1.10 HEAD_BODY_PROPORTION_RULE](part1_universal_rules.md#part-110-head_body_proportion_rule) — template inline directive
- [PART 1.11 FOOTWEAR_RULE](part1_universal_rules.md#part-111-footwear_rule) — template inline directive

---

## 3.2 building (vocab_type = building)

### Aspect ratio / framing

- 1:1 square
- Building occupies about 70% of frame, centered

### Camera

- Slight three-quarter front angle at eye level
- 35mm wide-angle lens equivalent
- Natural perspective, no fisheye distortion
- Straight vertical lines

### Background note

- 背景は `pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette`
- これは `BG_EXACT_SKYBLUE`（[PART 2 BACKGROUND_BY_TYPE](part2_style_bible.md#background_by_type) / [PART 6 preflight C4](part6_output_instructions.md#65-preflight-invariants-mechanical-gates) 必須一致）

### Signage rules

v3.0 全面改訂：
- **Exactly ONE short ENGLISH building-name label** — small, on entrance fascia
- `{SIGNAGE_TEXT}` は [`BUILDING_CUES[X].signage_text`](part5_vocab_reference_appendix.md#510-building_cues)（英語値のみ）
- 日本語（kanji/kana）・第 2 英単語・RECEPTION/ATM/OPEN 等の二次ラベル・数字 すべて禁止
- 旧「上 1/3 typography 用余白」指示は v3.0 で削除（GAS オーバーレイの責務だった機構が廃止）

### Scene cue selection

- 単一 `[{PRIMARY_SCENE_CUE}]`（[`BUILDING_CUES[X].primary_scene_cue`](part5_vocab_reference_appendix.md#510-building_cues)）
- 複数 cue 並置や架空の二次サイン・看板・banner 等は明示禁止（反クラッター原則）

---

## 3.3 object_concrete (vocab_type = concrete_object)

### Aspect ratio / framing

- 1:1 square
- Iconization level: **Detailed Flat (level 3)** — [PART 2 iconization_level_guide](part2_style_bible.md#level_3_detailed_flat--recommended)

### Camera

- Canonical 3/4 view（30-45° above and slightly to one side）
- 50mm-equivalent lens
- Exception：clock face / screen / signage board → straight front-facing (0°)

### Strategy choice: OBJECT_ALONE vs HAND_HOLDING

- **OBJECT_ALONE**（デフォルト）：単独描画。スケール感の補強が不要な物体。大きすぎる物体（机・自転車・冷蔵庫等）は必ずこちら。
- **HAND_HOLDING**：手で持って提示。スケール感（実際の大きさ）と「使う」イメージが語彙理解に重要な手のひらサイズの物体（ケータイ・財布・鍵・コップ・本等）。AI による手の生成が安定しない場合は `OBJECT_ALONE` にフォールバック。

### Strategy block: OBJECT_ALONE

```
[STRATEGY: OBJECT_ALONE]
The object is centered and fills 70-80% of the image.
Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.
This angle reveals the top surface AND one side face simultaneously.
Exception: use straight front-facing ONLY if {FRONT_FACING_EXCEPTION} applies.
Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional objects or context scene.
```

### Strategy block: HAND_HOLDING

```
[STRATEGY: HAND_HOLDING]
The object is being held in a simple flat-vector hand (or pair of hands).
Educational purpose:
  (1) Embodied cognition — showing the object in actual use reinforces meaning.
  (2) Scale fixation — the hand provides immediate, intuitive size reference
      (useful for 「ケータイ」「財布」「鍵」「コップ」など手のひらサイズの物体).
Hand rendering rules (CRITICAL — AI image generators frequently fail at hands):
  - Render the hand as a SIMPLIFIED schematic shape, NOT a realistic anatomical hand.
  - Show only the cropped silhouette of the hand: palm + 3-4 visible finger shapes.
  - Use a single flat skin tone (warm medium) with consistent outline weight.
  - DO NOT attempt to render the entire arm, wrist details, knuckles, nails, or veins.
  - Crop the hand at the wrist or mid-forearm to keep the composition minimal.
  - If generating fails (extra fingers, malformed joints), fall back to OBJECT_ALONE.
Composition:
  - The object occupies 60-65% of the frame; the hand occupies 15-20%; the rest is negative space.
  - The hand enters from the bottom or bottom-side of the frame, not from above.
  - Camera angle: canonical 3/4 view (30-45° above the object).
Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional context scene.
```

### Lookup data

- 物体ごとの `{OBJECT_DESCRIPTION}` / `{VISUAL_SIGNATURE}` / `{MATERIAL_TEXTURE_HINT}` は [PART 5.11 OBJECT_SIGNATURES](part5_vocab_reference_appendix.md#511-object_signatures) を参照。

---

## 3.4 action_verb (vocab_type = action_verb)

### Aspect ratio / framing

- 1:1 または 16:9（SEQUENCE_3PANEL の場合は 16:9 推奨）
- Character and action fill 70% of frame
- SEQUENCE_3PANEL：each panel ~70% within panel・各 panel 33% width

### Camera

- Eye-level, 50mm-equivalent lens
- 動作の peak moment（始まり前 / 終わり後ではなく）

### Iconization level

- デフォルト level_3_detailed_flat
- SEQUENCE_3PANEL strategy は level_2_flat_design（3-panel layout が視覚的に混みすぎるのを避ける）

### Strategy choice (5 種類)

- **MOTION_ARROW** — 方向性のある移動動詞（行く・来る・投げる 等）
- **OUTCOME** — 結果が視覚的に明確な動詞（買う・食べる・飲む 等）
- **BEFORE_AFTER** — 変化を伴う 2 状態動詞（切る・壊す・着る・開ける 等）
- **SEQUENCE_3PANEL** — 3 フェーズ動詞（作る・直す・教える・準備する 等）
- **SYMBOLIC_MOTION_LINES** — 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）

「振り向く」等の CURVED_MOTION 系動詞は `MOTION_ARROW` + [`ARROW_SEMIOTICS.curved_arc`](#311-arrow_semiotics-reference) の組合せで表現する（curved_arc 単独戦略は無い）。

### Strategy block: MOTION_ARROW

```
[STRATEGY: MOTION_ARROW]
Show the character mid-action. Add a clear directional arrow (see ARROW_SEMIOTICS) indicating
the path or direction of the action. The arrow color: warm amber gold or symbol_red (use educational_symbol_colors.symbol_red).
The action must be at its peak moment — not before or after.
```

### Strategy block: OUTCOME

```
[STRATEGY: OUTCOME]
Show the result of the action rather than the motion itself.
Example for 「買う」: character holding shopping bag, cash register visible in background.
Example for 「食べる」: character with chopsticks raised, bowl of food in front.
The outcome must make the action verb unmistakable.
```

### Strategy block: BEFORE_AFTER

```
[STRATEGY: BEFORE_AFTER]
Divide the image into two equal panels (left = before, right = after).
Left panel: the state before the action.
Right panel: the result after the action is completed.
Use a thin dividing line between panels.
Both panels share the same character, background color, and art style.
A small rightward arrow between panels indicates time progression.
Best for binary-state verbs: 切る・壊す・着る・脱ぐ・開ける・閉める etc.
```

### Strategy block: SEQUENCE_3PANEL

```
[STRATEGY: SEQUENCE_3PANEL]
Divide the image into three equal panels (left = beginning, middle = action peak, right = result).
Left panel  (始まり): The initial state before the action starts. Character stands ready,
                     or the workspace/material is in its untouched state.
Middle panel (中間):  The action at its peak with clear motion indicators
                     (motion lines, directional arrows, dynamic posture).
Right panel  (終わり): The completed state showing the action's outcome.
Use thin dividing lines between panels (deep slate navy, 1pt weight).
Small rightward arrows between panels indicate time progression
(place between left↔middle and between middle↔right).
All three panels share the same character, background color, and art style.
Best for THREE-PHASE verbs that have a clear start→peak→outcome structure:
  - 作る (make):   empty workspace / ingredients → assembling / mixing → completed product
  - 直す (fix):    broken object → repairing in progress → repaired object
  - 教える (teach): student looking puzzled → teacher explaining → student understanding
  - 準備する:      materials gathered → arranging → ready state
Each panel occupies approximately 33% of the frame width.
Iconization level: level_2_flat_design (avoid level_3 detail so the 3-panel
layout doesn't become visually crowded).
```

### Strategy block: SYMBOLIC_MOTION_LINES

```
[STRATEGY: SYMBOLIC_MOTION_LINES]
Add motion lines (速度線) radiating from the moving part of the body or object.
Motion lines are flat, vector-style — parallel curved or straight strokes in the
direction of movement. Color: cool slate gray.
```

### Universal rule references

- [PART 1.5 PHENOTYPE](part1_universal_rules.md#part-15-phenotype_specification_rule)、[PART 1.8 FACIAL_FEATURES](part1_universal_rules.md#part-18-facial_features_rule)、[PART 1.10 HEAD_BODY_PROPORTION](part1_universal_rules.md#part-110-head_body_proportion_rule)、[PART 1.11 FOOTWEAR](part1_universal_rules.md#part-111-footwear_rule) — character figure を含むため person rule に準ずる。

---

## 3.5 adjective (vocab_type = adjective)

### Aspect ratio / framing

- 1:1 square
- Object(s) occupy 70-80% of frame
- PAIR_CONTRAST：each panel 50%, equal-sized subjects

### Camera

- Eye-level または canonical 3/4 view（anchor object's nature による）
- 50mm-equivalent lens, no telephoto compression

### Strategy choice (3 種類)

- **PAIR_CONTRAST**（デフォルト）：対義語ペアが明確にある形容詞（大きい/小さい・新しい/古い 等）に最適
- **SINGLE_HIGHLIGHT**：対義語が描きにくい・対比が冗長になる時に
- **PROPERTY_OVERLAY**：温度・重さなど物理的に見えない性質に

### Strategy block: PAIR_CONTRAST

```
[STRATEGY: PAIR_CONTRAST]
Two side-by-side panels showing the same object class in two contrasting states.
Left panel:  the CONTRASTING (opposite) state — rendered in muted neutral tone
             (cool slate gray outline + desaturated fill).
Right panel: the TARGET state (the adjective being taught) — rendered with
             full color palette and slight emphasis (size, brightness, or accent).
Use a thin dividing line between panels (deep slate navy, 1pt weight).
Both panels use the same camera angle, same object orientation, same scale of the panel itself.
Examples:
  - 大きい: small ball (gray, ~25% of panel) | large ball (amber, ~75% of panel)
  - 新しい: old worn book (muted) | new shiny book (full color + subtle shine marks)
  - きれい: cluttered desk (gray) | clean tidy desk (full color)
  - 高い (expensive): plain item (gray) | premium item with simple ornament (amber accent)
Each panel occupies 50% of the frame.
```

### Strategy block: SINGLE_HIGHLIGHT

```
[STRATEGY: SINGLE_HIGHLIGHT]
A single object that strongly embodies the adjective quality.
The defining quality is visually exaggerated:
  - For 大きい: oversized version of a familiar object (ball, cup) filling the frame.
  - For きれい: object rendered with subtle "sparkle" marks (3-5 small 4-pointed
    amber stars near the object — NOT realistic shine, just symbolic).
  - For 新しい: object rendered with crisp clean lines, slight shine highlight as
    a single short flat line on a corner.
  - For 古い: object rendered with subtle wrinkle marks, slight color desaturation,
    a small worn spot indicated by a curved line.
The object fills 70-80% of the frame. Solid soft cream off-white background (warm off-white, NOT pure stark white).
DO NOT rely on a character's facial expression to convey the quality —
use the object's own appearance and symbolic marks only.
```

### Strategy block: PROPERTY_OVERLAY

```
[STRATEGY: PROPERTY_OVERLAY]
Single object with a symbolic property indicator overlaid.
Property indicators are flat symbolic marks, NOT photoreal effects:
  - Warm (温かい):  3-5 short curved wavy lines rising upward in amber, above the object.
  - Cold (寒い):    3-5 small angular flake-like shapes in cool blue, around the object.
  - Heavy (重い):   3-5 short downward arrows in slate gray, below the object.
  - Light (軽い):   3-5 short upward dotted-line marks in amber, around the object.
Keep overlay marks small and minimal — they should clarify the quality without
competing visually with the anchor object.
Object fills 65-70% of the frame. Solid soft cream off-white background (warm off-white, NOT pure stark white).
```

---

## 3.6 abstract_concept (vocab_type = abstract_concept)

### Aspect ratio / framing

- 1:1 square
- Subject fills 70% of frame

### Camera

- Centered, eye-level or slight elevation
- 50mm-equivalent lens

### Composition: visual_metaphor lookup

- TIAC（Text-to-Image for Abstract Concepts）3 層構造 — Intent / Object / Form
- Layer 2（Object）の置換は [PART 5.13 ABSTRACT_METAPHORS](part5_vocab_reference_appendix.md#513-abstract_metaphors) を参照
- 各 entry が `composition_mood` / `concept_definition` / `visual_metaphor` / `emotional_tone` / `color_adjustment` を持ち、それぞれ template の対応 placeholder に転記

### Emotional tone integration

- 感情は表情だけで伝えない — character posture / spatial composition / symbolic elements を使う
- 背景は large flat SOLID color fields のみ（NO gradients / NO shading / NO lighting — STYLE RECIPE 整合）

---

## 3.7 demonstrative_kosoado (vocab_type = demonstrative)

### Aspect ratio / framing

- 1:1 または 16:9
- Characters fill 60% of frame

### Camera

- Eye-level, 50mm lens equivalent
- Minimal background — simple floor plane with subtle depth lines is recommended

### Model choice (3 種類・mutually exclusive)

⚠ 同一プロンプト内に複数のモデルを書かないこと（画像生成器が混乱）。

- **face_to_face（対面型）**：話者と聞き手が向かい合うシーン。学習者に「自分と相手の領域の違い」を明示したい時。最も入門的・直感的。
- **parallel（並行型）**：話者と聞き手が並んで同じ方向を見る。距離感（近・中・遠）を強調したい時。
- **psychological_pull（心理的引き込み）**：話者の領域が対象に向かって変形する。心理的所有・関与度を示したい時（中上級）。

### Model block: face_to_face

```
[MODEL TYPE: FACE-TO-FACE (対面型)]
Speaker and listener stand facing each other.
Divide the space between them with a clear VISUAL BOUNDARY LINE (dashed or subtle line).
Color code the territories:
- 「こ」zone (speaker's side): highlight with speaker's accent color (muted warm blue).
- 「そ」zone (listener's side): highlight with listener's accent color (warm amber gold).
- 「あ」zone (outside both): neutral gray zone beyond both territories.
The target object [{TARGET_OBJECT}] is placed in the [{TARGET_ZONE}] zone.
Both speaker and listener face each other with clear pointing gesture toward the target object.
```

### Model block: parallel

```
[MODEL TYPE: PARALLEL (並行型)]
Speaker and listener stand side by side, both facing the same direction.
Draw a shared ellipse close to them representing the こ zone (muted warm blue),
then a medium-distance zone representing そ (warm amber gold),
then a far-distance zone representing あ (gray).
The target object is positioned at the [{DISTANCE_ZONE}] marker.
Use concentric distance rings or floor depth lines (parallel horizontal lines
receding into the distance) to clarify the three distance levels.
```

### Model block: psychological_pull

```
[MODEL TYPE: PSYCHOLOGICAL PULL (心理的引き込み)]
Show the speaker's こ territory as a soft elliptical shape around the speaker.
Then show the ellipse STRETCHING and deforming toward the target object as if the
speaker were pulling it into their territory.
The speaker leans forward or extends one hand toward the object in a protective
or possessive gesture.
Use the speaker's accent color (muted warm blue) to highlight BOTH the stretched
territory AND the target object — this color binding shows psychological ownership.
The listener is omitted from this model (single-speaker focus).
```

---

## 3.8 spatial_relation (vocab_type = spatial_relation)

### Aspect ratio / framing

- 1:1 square
- Reference object 40-50% of frame, target object clearly visible

### Camera

- v2.4 unified rule：ONE simple surface plane is required（plain desk surface / floor with subtle depth lines / flat tabletop）。完全に blank/empty white background は禁止。
- 室内・家具・装飾品は禁止（単一 surface のみ）

### SPATIAL_GRID_PATTERNS dispatch

position（上・下・中・前・後ろ・右・左・となり・間）ごとの camera setup は [PART 5.12 SPATIAL_GRID_PATTERNS](part5_vocab_reference_appendix.md#512-spatial_grid_patterns) を参照。各 entry が `_en` / `_jp_full` / `camera` / `layout` / `grid_aid` を持つ。

### Special rules

- **右・左**：BACK-FACING VIEW（character の背中越し）— 左右反転の混乱を排除
- **中**：transparency — container walls を semi-transparent outlines に
- **前・後ろ**：FIRST-PERSON POV（character を描かず viewer = speaker）

### Color principle

- Reference object: neutral / desaturated（cool gray tones）
- Target object: bold accent（warm amber gold OR symbol_red）

### ARROW_SEMIOTICS dependency

`{CAMERA_SETUP}` の `grid_aid` 内で arrow がある場合、[§3.11 ARROW_SEMIOTICS](#311-arrow_semiotics-reference) の色・形状規律に従う。

---

## 3.9 example_sentence (no vocab_type — lesson-level)

> `vocab_type` 不要。lesson_NN.json の `patterns[].examples[]` 全件に Template C を適用。

### Aspect ratio / framing

- 16:9 wide
- Characters occupy 60% of frame
- 50mm standard lens equivalent

### Camera

- Eye-level
- Simple minimal background with only essential context
- Main characters clearly separated from background in visual contrast

### Composition: CHARACTER_DESCRIPTIONS + SCENE

- `{CHARACTER_DESCRIPTIONS}` は登場人物（鈴木さん・林さん・ケリーさん 等の固定キャラ）の概要
- `{SCENE_DESCRIPTION}` は文の grammatical relationship を視覚化するシーン記述
- `{VISUAL_SYMBOL_IF_NEEDED}` は [PART 5.14 VISUAL_SYMBOLS](part5_vocab_reference_appendix.md#514-visual_symbols) から question mark / checkmark / X mark / arrow を選択
- `{COMPOSITION_NOTES}` は character 配置・focal point 等の補足

### Family composition hook（v3.3 M-48 reserved）

`FAMILY_TEMPLATES`（v3.3 で定義・vocab_type=family として将来活性化予定）は現状 inactive。Phase 4 後 backlog 案件。本 PART 3.9 では「家族関係を含む例文」は通常の `{CHARACTER_DESCRIPTIONS}` で扱う（father-mother-child 群を NAMED_CHARACTER として描く）。

### Universal rule references (v4.1 inline)

[Template C](part4_prompt_templates.md#template-c-example_sentence) に v4.1 で inline 追加された universal rules：
- [PART 1.8 FACIAL_FEATURES_RULE](part1_universal_rules.md#part-18-facial_features_rule) — 全 character figure
- [PART 1.10 HEAD_BODY_PROPORTION_RULE](part1_universal_rules.md#part-110-head_body_proportion_rule) — 全 adult character figure
- [PART 1.11 FOOTWEAR_RULE](part1_universal_rules.md#part-111-footwear_rule) — both feet がフレーム内のときのみ適用

---

## 3.10 variant_grid (vocab_type = variant_grid)

### Aspect ratio / framing

- 1:1 または 16:9
- Each variant tile occupies equal space in a 2×2 or 1×N grid layout

### Composition

- 全 tile で同 canonical 3/4 view + 同 scale
- 全 tile で identical illustration style（どの tile も他より detailed に見えない）
- Thin dividing lines between tiles（deep slate navy, 1pt weight）
- No labels / numbers / captions inside the image

### Use case

- 類似形状の語彙セット（雑誌 / 本 / 冊子・カード / スマホ / 財布 等）
- カテゴリ境界の明確化（インターリービング・資料 11）

### Tile signatures

- Each tile は [PART 5.11 OBJECT_SIGNATURES](part5_vocab_reference_appendix.md#511-object_signatures) の `primary_signatures` を踏襲
- Tile 数 / 配列は lesson 設計時に決定（`{GRID_SIZE}` / `{GRID_ARRANGEMENT}` placeholder）

---

## 3.11 ARROW_SEMIOTICS reference

> 矢印は単なる装飾ではなく、伝達する意味によって形状を使い分ける（資料 10：「矢印は動詞である」）。
> Template F (spatial_relation) / G (demonstrative_kosoado) / H (action_verb) で使用。

### straight_bold

| 項目 | 値 |
|---|---|
| shape | Thick straight arrow with solid arrowhead |
| meaning | Direct movement toward a destination; forceful approach |
| color | Warm amber gold or symbol_red (use educational_symbol_colors.symbol_red) |
| use_cases | 「行く」「来る」 — movement toward a location / 空間関係での強調（ここ！→）/ 「こ」のなわばり内への引き込み |

### straight_long_thin

| 項目 | 値 |
|---|---|
| shape | Long thin arrow with small arrowhead |
| meaning | Pointing into the distance; extending the viewer's line of sight |
| color | Cool slate gray |
| use_cases | 「あそこ」「あちら」 — pointing to distant objects / Far-distance markers in demonstrative kosoado illustrations |

### curved_arc

| 項目 | 値 |
|---|---|
| shape | Curved arc arrow (semicircle shape) |
| meaning | Rotation, turning, redirecting attention or gaze |
| color | Muted warm blue |
| use_cases | 「こちらを向いて」 — directing gaze toward speaker / 「あ」の心理的引き込みで領域が曲線的に変形する動き |
| note | 「振り向く」等の CURVED_MOTION 系動詞は、テンプレ H の MOTION_ARROW 戦略 + ARROW_SEMIOTICS.curved_arc の組合せで表現する（curved_arc 単独戦略は無い）。 |

### double_headed

| 項目 | 値 |
|---|---|
| shape | Arrow with arrowheads on both ends |
| meaning | Comparison, reciprocal relationship, distance measurement |
| color | Cool slate gray |
| use_cases | 「となりに」 — adjacency with measured gap / 「間に」 — between two reference points / 語彙比較グリッドでの category boundary line |

### motion_lines

| 項目 | 値 |
|---|---|
| shape | Multiple parallel curved or straight strokes radiating from a moving object |
| meaning | Speed, vibration, kinetic energy |
| color | Cool slate gray, thin weight |
| use_cases | 「走る」「飛ぶ」「投げる」 — fast physical action / 動作の軌跡を強調する補助線として |
