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

> v4.0.4 (2026-05-25) 全面改訂：worktree image-prompt-plan の R1-R26 実機検証で確立した「universal cream background + 5-image reference attachment + universal rule A-1〜A-11 + per-vocab-type 4 件テーブル」設計に移行。Stage 1 採用 4 件（学校 R25 / 大学 R26 / デパート R22 / 会社 R22）は本仕様で本番化済。
>
> 旧 v3.0 design（pale sky-blue background / 70% frame / single primary_scene_cue / text-only generation）は未移行 4 件（銀行 / 病院 / 駅 / スーパー）で残置。v4.0.4 移行時に下記新仕様に統一する。

### v4.0.4 採用 4 件 (学校 / 大学 / デパート / 会社)

#### Aspect ratio / framing

- 1:1 square
- Close-up framing — building does NOT fit entirely within frame; side wings extend off-frame, mid-rise の上層階も off-frame OK
- BUILDING DOMINATES frame 75-85% vertically (R25 学校 validation で確定した dominance 閾値)
- Top of primary signature feature reaches upper 8-12% of canvas
- Figures prominent at approximately 1/3 of visible building height

詳細は [PART 1.13 A-2 Framing](part1_universal_rules.md#a-2-framing) 参照。

#### Camera

- Street-level low-angle 3/4 at adult eye-height (~1.6m)
- Rotated 30-45 degrees off the building's primary facade
- Close to building, looking slightly UP
- NOT isometric top-down, NOT bird's-eye, NOT elevation drawing

詳細は [PART 1.13 A-1 Camera](part1_universal_rules.md#a-1-camera) 参照。

#### Background / Walls / Palette

- 背景 = `soft cream off-white background (warm off-white, NOT pure stark white)` = `BG_EXACT_CREAM`（[PART 2 STYLE_BIBLE.color_palette.background](part2_style_bible.md#color_palette) と一致）
- Walls = cream off-white（CONSTANT 全 building 共通）
- Roof = slate-grey（CONSTANT 全 building 共通）
- Accent = ONE color per vocab_type from muted pastel family（PER-VOCAB-TYPE）
  - 学校 = warm yellow / sand-cream gold
  - 大学 = sand-stone beige
  - デパート = warm muted tan
  - 会社 = dull muted blue

詳細は [PART 1.13 A-4 Palette](part1_universal_rules.md#a-4-palette) 参照。BACKGROUND_BY_TYPE.building は v4.0.4 で撤去済（全 vocab_type が universal cream に統合）。

#### Reference images (5-image attachment)

- image_1 = `data/images/word_日本人.png` (brand voice anchor / constant)
- image_2-4 = per-building from [PART 5.10 BUILDING_CUES[X].type_relevant_refs](part5_vocab_reference_appendix.md#510-building_cues)
- image_5 = `data/images/vocab_病院.jpg` (architectural & framing anchor / constant)

詳細は [PART 1.12 BUILDING_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-112-building_reference_attachment_rule) 参照。

#### Signage rules (single English signboard)

- Exactly ONE English signboard with building name (SCHOOL / UNIVERSITY / DEPT. STORE / OFFICE)
- Signboard location is per-vocab-type（[PART 5.10 signboard_location field](part5_vocab_reference_appendix.md#510-building_cues)）
- 信号 cue は a single label only — 旧 v3.0 の `primary_scene_cue` 単一 cue 制約は v4.0.4 では `{ACTIVITIES_BLOCK}` (4-figure variety) に置き換え
- 全 surface blank rule（[PART 1.13 A-9](part1_universal_rules.md#a-9-blank-text-surfaces)）厳守：signboard 以外の全 surface は text-free

#### Figures (4-5 名 different activities)

- 4-5 figures in scene, each engaged in a DIFFERENT activity（[PART 5.10 activities_block](part5_vocab_reference_appendix.md#510-building_cues) 参照）
- Activity types: entering / walking past mid-stride / cycling / chatting / window-shopping / phone-walking 等
- Cyclist は 6-axis pose specification（[PART 1.13 A-11](part1_universal_rules.md#a-11-cyclist-pose-when-cyclist-is-in-activities_block)）必須

#### Surroundings (per-vocab-type context)

- isolated / campus / urban_corner / urban_street の 4 種から per-vocab-type 選択
  - 学校 = campus（auxiliary gymnasium / annex 描画 OK）
  - 大学 = campus（secondary academic building 描画 OK）
  - デパート = urban_corner（adjacent commercial building 描画 OK）
  - 会社 = urban_corner（adjacent commercial building 描画 OK）

詳細は [PART 1.13 A-10 Surroundings context](part1_universal_rules.md#a-10-surroundings-context-per-vocab-type) 参照。

#### Ground / Pavement

- Sidewalk and paved ground = cream off-white (NOT slate-grey, NOT asphalt-dark)
- Subtle slate-navy outline only（curb edge / paving joint）

詳細は [PART 1.13 A-8 Ground / Pavement](part1_universal_rules.md#a-8-ground--pavement) 参照。

#### Universal rule reference

[Template B](part4_prompt_templates.md#template-b-vocabulary_building) は `{BUILDING_UNIVERSAL_RULE}` placeholder で [PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4](part1_universal_rules.md#part-113-building_universal_rule_v4_0_4) 本文を inline 展開する（A-1〜A-11 全文）。skill は per-building 変数（{ACCENT} / {SIGNATURE} / {ACTIVITIES_BLOCK} / {SURROUNDINGS_BLOCK} 等）を PART 5.10 BUILDING_CUES から解決して埋める。

### 未移行 4 件 (銀行 / 病院 / 駅 / スーパー)

> v4.0.4 fields 未付与。当面 v3.0 path で生成される（次の旧 v3.0 仕様）。lesson_02 以降で BUILDING_CUES に v4_0_4_* fields を追加した時点で v4.0.4 採用 4 件と同じ path に統合する。

#### Aspect ratio / framing (v3.0)

- 1:1 square
- Building occupies about 70% of frame, centered

#### Camera (v3.0)

- Slight three-quarter front angle at eye level
- 35mm wide-angle lens equivalent
- Natural perspective, no fisheye distortion
- Straight vertical lines

#### Background note (v3.0)

- 背景は `pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette`
- これは `BG_EXACT_SKYBLUE`（[PART 2 BACKGROUND_BY_TYPE](part2_style_bible.md#background_by_type) / [PART 6 preflight C4](part6_output_instructions.md#65-preflight-invariants-mechanical-gates) 必須一致）

#### Signage rules (v3.0)

- **Exactly ONE short ENGLISH building-name label** — small, on entrance fascia
- `{SIGNAGE_TEXT}` は [`BUILDING_CUES[X].signage_text`](part5_vocab_reference_appendix.md#510-building_cues)（英語値のみ）
- 日本語（kanji/kana）・第 2 英単語・RECEPTION/ATM/OPEN 等の二次ラベル・数字 すべて禁止
- 旧「上 1/3 typography 用余白」指示は v3.0 で削除（GAS オーバーレイの責務だった機構が廃止）

#### Scene cue selection (v3.0)

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
> **v4.0.6 (2026-05-26 X-c)**：lesson_01 ex_L01_* 18 件の text-only 一陣失敗 + Gemini 第二意見を踏まえて 5 つの subsection を追加（aspect_ratio_enforcement / scene_action_focus / affiliation_indoor / visual_symbol_restriction / reference_redundancy_avoidance）。これらは Template C 経由の全 lesson 共通規律。
> **v4.0.7 (2026-05-27 X-c-6)**：v4.0.6 5 subsection を Gemini 第三/四意見で literal phrase 強化（Forbidden phrases 列挙含む）+ 3 subsection 新設（**particle_visual_mapping** / **horror_vacui_blank_surfaces** / **two_panel_qa_pattern**）。Gemini 命名の bias（Native 1:1 Square / Object Isolation / Diegetic Confusion / Horror Vacui / Gibberish Hallucination / Dollhouse Scaling / Exterior Facade Literalism / Feature Blending）を直接 defeat する verbatim wording に統一。

### Aspect ratio / framing

- 16:9 wide
- Characters occupy 60% of frame
- 50mm standard lens equivalent

### Camera

- Eye-level
- Simple minimal background with only essential context
- Main characters clearly separated from background in visual contrast

### 3.9.1 aspect_ratio_enforcement (v4.0.6 新規 / v4.0.7 強化)

> Template C は 16:9 だが、nanobanana / gemini-2.5-flash-image は **画像生成 API として aspect ratio パラメータを持たず、テキスト directive にも 1:1 default bias がある**。`Wide 16:9 shot` の 1 行だけでは default に倒れる。lesson_01 X-c v1 text-only 一陣 18 件全件で 16:9 → 1:1 drift が発生し、X-c-7 PoC を毀損した。
>
> **Defeats**: Native 1:1 Square Bias / Object Isolation Bias / Center-Weighted Cropping Bias / Dollhouse Scaling Bias.

```
Strict 16:9 enforcement requires (a) a dedicated [STRICT LAYOUT DIRECTIVE] block placed
HIGH in the prompt (between [PURPOSE] and [REFERENCE]) and (b) a horizontally-stretching
background element described in [SCENE & ACTION] that explicitly INTERSECTS AND BLEEDS
OFF both the extreme left and extreme right edges of the frame. Text-only ratio request
without a physical edge-bleeding anchor is insufficient — nanobanana collapses to its
native 1:1 bias and shrinks any "wide" element to a disconnected prop ("dollhouse" scaling).
```

#### Required phrase (v4.0.7 verbatim, in [SCENE & ACTION])

```
To enforce the 16:9 widescreen layout, the specified horizontal background anchor MUST
physically intersect and bleed off both the extreme left and extreme right edges of the
frame.
```

#### Forbidden phrases (v4.0.7)

- `Wide 16:9 shot` を **anchor 文なしで単独** で使うこと（必ず edge-bleed 文と組で）
- `A whiteboard in the background`（disconnected miniature prop に倒れる）
- `Centered in the frame`（center-weighted bias を悪化させる）

#### rule_a — STRICT LAYOUT DIRECTIVE block (位置 + 文言)

[Template C](part4_prompt_templates.md#template-c-example_sentence) は `[PURPOSE]` 直下に以下のブロックを必ず emit する：

```
[STRICT LAYOUT DIRECTIVE]
ASPECT RATIO: MUST be 16:9 widescreen landscape (horizontal orientation). DO NOT crop
into a square 1:1 frame, NOT 4:3 landscape, NOT 3:4 vertical, NOT 9:16 portrait. To
enforce the 16:9 layout, the scene's background elements MUST extend horizontally
from the left edge to the right edge of the frame — see the [SCENE & ACTION] block
below for the specific horizontal anchors. nanobanana defaults to 1:1; this directive
is the primary counterweight.
```

#### rule_b — horizontally-stretching anchor in [SCENE & ACTION]

各 example の `{SCENE_DESCRIPTION}` に「画面の左端から右端まで横方向に伸びる」背景要素を**必ず**含める：

| 種類 | 横方向 anchor 例 |
|---|---|
| 教室シーン | wide blank whiteboard / blackboard spanning across the left half |
| オフィス／カウンター | wide desk surface or counter spanning horizontally |
| 屋外建物前 | building facade running along the left half (close-up framing) |
| 大学・講堂 | long lecture-hall desk row running horizontally |
| 病院診察室 | wide consultation desk + medical equipment shelf in horizontal layout |
| 2-panel Q/A | full-width vertical divider line splitting 16:9 frame into 2 equal panels |

#### rule_c — strong words

`MUST`, `DO NOT`, `NEVER` を使う（[PART 1.4 rule_c](part1_universal_rules.md#part-14-prompt_literalization_avoidance_rule)）。`should` / `may` は 16:9 で禁止。

### 3.9.2 scene_action_focus (v4.0.6 新規 / v4.0.7 強化)

> 例文画像の教育的価値は「sentence の文法関係が一目でわかる」ことにある。Identity card 風の立ち姿だけでは sentence 内容と画像が乖離する（例：「鈴木さんは先生です」を ホワイトボード横で立つだけの絵にすると「ここは教室」としか伝わらず「鈴木さんは教師」が確定しない）。
>
> **Defeats**: Default Standing Portrait Bias / Subject-Environment Disconnection.

```
For every example_sentence (with the identity-only exception below), the [SCENE_DESCRIPTION]
MUST anchor the sentence's grammatical or semantic core in a ROLE-SPECIFIC ACTION rather
than a passive standing pose. The character MUST be actively, physically manipulating an
object related to their role (hands gripping a keyboard, fingers writing on a board, hand
on stethoscope at chest, palm flat on textbook, etc.). The viewer must read the sentence
purpose from the action, not from the absence of conflicting cues.
```

#### Required phrase (v4.0.7 verbatim, in [SCENE & ACTION])

```
The character MUST be actively, physically manipulating an object related to their role
(e.g., hands gripping a keyboard, fingers writing on a board, palm flat on the open
textbook, hand resting on the stethoscope at chest level). DO NOT render a passive
standing pose.
```

#### Forbidden phrases (v4.0.7)

- `Standing in front of`
- `Standing next to`
- `Looking at the viewer` （注：dead-eyed passport-style に限る。**active role action 中の eye contact は OK** — §3.9.2 identity-only exception 参照）
- `Posing naturally`

#### Per-role canonical actions (推奨参照表)

| role (PART 5.8 role_key) | canonical action | accompanying scene anchor |
|---|---|---|
| teacher | standing at a teacher's podium / chalk in hand at blackboard / gesturing toward whiteboard | wide blank whiteboard or blackboard along left half |
| student | seated at lecture-hall desk with open notebook and pen in hand / taking notes / raising hand | long horizontal lecture desk surface + chair |
| company_employee | seated at office desk with PC monitor and documents / typing / standing with briefcase at office entrance | wide office desk + flat-panel monitor |
| doctor | standing in consultation room facing patient/viewer / one hand on stethoscope / examining a clipboard | wide consultation desk + medical chart on flat panel |
| foreigner / learner | with open phrasebook in hands speaking to a Japanese person / at a station information board | minimal urban or classroom context spanning horizontally |

#### Identity-only exception (v4.0.7 拡張 / Gemini Q5)

文の主旨が **nationality / identity** （例：「鈴木さんは日本人です」「リンさんは中国人です」）で、manipulable object を伴う role action が文意に乖離する場合、**3.9.2 の object-manipulation MUST は適用除外**。代わりに以下のいずれかを使う：

**(5a) Nationality identity**（〜は[国籍]です）の Required phrase:

```
The subject is actively engaged in a dynamic, mid-conversation social gesture — body
angled in a 3/4 posture, extending one arm in an open-palm introductory motion toward
the viewer. They maintain engaged, direct eye contact, anchoring their identity through
active social presence rather than a static pose.
```

**(5b) Role identity without affiliation**（〜は[役職]です・affiliation なし）の Required phrase:

```
The subject is captured mid-action in their canonical role activity, physically
manipulating the primary tool of their profession (e.g., holding up a textbook,
gesturing to a board) while making direct, engaged eye contact with the viewer to
deliver instruction or service.
```

> **Eye contact 解釈ルール**: "engaged eye contact during an active physical gesture or role action" IS PERMITTED（identity を viewer に伝える効果あり）。Forbidden phrase の `Looking at the viewer` は exclusively **passport-style, dead-eyed, physically static standing pose with arms hanging limply at the sides** を指す。Active gesture or role action 中の eye contact はこの禁止に該当しない。

> **Flag prop 禁止**: identity-only であっても国旗 prop は禁止（[PART 6.4 ROLE_ANTI_FLAG_BLOCK](part6_output_instructions.md#role_anti_flag_block) は named character / role 系の標準）。

### 3.9.3 affiliation_indoor (v4.0.6 新規 / v4.0.7 強化)

> 〜の〜（institution の role）パターン（lesson_01 p3）は「キャラが建物の前に立つ立ち姿」ではなく **「その建物の中で職務を遂行している」** シーンで描く。建物前立ち姿は **location 意味（〜にいます）** に誤読される。
>
> **Defeats**: Exterior Facade Literalism / Dollhouse Scaling Bias.

```
For sentences expressing professional affiliation (〜は〜の〜です), the scene MUST be set
strictly INDOORS at the institution, FULLY ENCLOSED BY WALLS, with the character actively
performing their role within that institution's recognizable interior. The institution-
character relationship reads as "this person works/studies/treats AT this institution" —
NOT "this person stands in front of this institution".
```

#### Required phrase (v4.0.7 verbatim, in [SCENE & ACTION])

```
The scene is strictly an INDOOR interior shot fully enclosed by walls. The character
is INSIDE the [INSTITUTION].
```

#### Forbidden phrases (v4.0.7)

- `At the [INSTITUTION]`（exterior-facade に倒れる）
- `Outside the [INSTITUTION]`
- `In front of the [INSTITUTION]`
- `Near the [INSTITUTION]`

#### 実装テーブル

| 文型例 | 建物 | 屋内シーン | 識別要素 (建物種別) |
|---|---|---|---|
| 〜は〜病院の医者です | hospital | 診察室 (consultation room) | 診察デスク + 医療チャート (flat panel) + 検査ベッド shadow |
| 〜は〜学校の先生です | school | 教室 (classroom) | wide blackboard + 教壇 + 並ぶ生徒 desk silhouette |
| 〜は〜銀行の会社員です | bank | 銀行業務オフィス | カウンター + 計算機 + 電卓 + 受付窓口 silhouette |
| 〜は〜大学の学生です | university | 講義室 (lecture hall) | 長卓 + 教科書 + 講義スクリーン (blank) |
| 〜は〜デパートの会社員です | department store | 売り場フロア入口 | カウンター + 商品棚 silhouette + ガラス展示窓 |

text-only 出力でも nanobanana が「屋外建物 + 立ち姿」に倒れる bias を回避するため、prompt 本文に必ず `INDOOR scene set inside ...` と明示する。

### 3.9.4 visual_symbol_restriction (v4.0.6 新規 / v4.0.7 Diegetic Confusion 対応)

> 例文によっては question mark / checkmark / X mark / arrow を使うが、**「symbol を出して良い」という許可文言を全 example に常駐させると nanobanana が「何かマークを入れろ」と過剰解釈して floating arrow / encircling shape を捏造する** (lesson_01 ex_L01_016 で実証された)。symbol 必要例文だけに permission を限定し、不要例文は明示的に禁止する。
>
> **v4.0.7 追加**: 許可された symbol 自体も、3D scene space に置こうとすると **Diegetic Confusion** で physical object（neon sign / balloon / 持ち物）化する。Symbol は **必ず 2D UI overlay として composited** されねばならない。
>
> **Defeats**: Semantic Literalism / Abstract Symbol Objectification / Diegetic Confusion / Center-Weighted Subject Bias.

```
The "VISUAL_SYMBOLS ARE PERMITTED" clause in [CONSTRAINTS] MUST be emitted ONLY when the
example explicitly needs a question mark / checkmark / X mark / arrow. For example_sentences
that do not use any symbol (declarative statements, affiliation statements, simple identity
statements), the clause MUST be replaced with an explicit prohibition of all floating
symbols, encircling shapes, and abstract overlays. When a symbol IS permitted, it MUST be
described as a flat 2D UI overlay composited against the picture plane — NEVER as a 3D
object occupying scene space, and the character MUST NOT interact with it.
```

#### Required phrase for SYMBOL position (v4.0.7 verbatim, in [SCENE & ACTION])

```
Render the symbol as a pure 2D graphic UI overlay composited flat against the picture
plane. It MUST have zero depth, cast zero shadows, and exist completely outside the 3D
diegetic scene space. The character MUST NOT interact with, look at, point to, or react
to this overlay.
```

#### Forbidden phrases for SYMBOL position (v4.0.7)

- `hovers at chest level`
- `floating in the air`
- `next to the character`
- `suspended above`
- `projected onto`
- `holographic`

#### Symbol 使用パターン分類

| sentence パターン | symbol | [CONSTRAINTS] 出力 |
|---|---|---|
| 〜です（declarative） | なし | `ABSOLUTELY NO floating symbols of any kind — no question marks, no checkmarks, no X marks, no arrows, no circles, no geometric shapes encircling the scene, no callout balloons.` |
| 〜ですか（question） | symbol_red question mark | `VISUAL_SYMBOLS entries ARE PERMITTED — but ONLY the single large question mark specified above, rendered as a flat 2D UI overlay per §3.9.4. nanobanana MUST NEVER add additional floating symbols, arrows, circles, or shapes encircling the character.` |
| はい〜／いいえ〜（2-panel) | green checkmark + red X | 2-panel divider + 各 panel に 1 symbol。「ONLY exactly two symbols (one ✓, one ✗), each rendered as a flat 2D UI overlay per §3.9.4」と明示。詳細は §3.9.8 |
| identification reveal | optional small arrow | symbol 必要時のみ permission, 不要時は禁止。 |

#### Symbol 使用パターン分類

| sentence パターン | symbol | [CONSTRAINTS] 出力 |
|---|---|---|
| 〜です（declarative） | なし | `ABSOLUTELY NO floating symbols of any kind — no question marks, no checkmarks, no X marks, no arrows, no circles, no geometric shapes encircling the scene, no callout balloons.` |
| 〜ですか（question） | symbol_red question mark | `VISUAL_SYMBOLS entries ARE PERMITTED — but ONLY the single large question mark specified above. nanobanana MUST NEVER add additional floating symbols, arrows, circles, or shapes encircling the character.` |
| はい〜／いいえ〜（2-panel) | green checkmark + red X | 2-panel divider + 各 panel に 1 symbol。「ONLY exactly two symbols (one ✓, one ✗)」と明示。 |
| identification reveal | optional small arrow | symbol 必要時のみ permission, 不要時は禁止。 |

### 3.9.5 reference_redundancy_avoidance (v4.0.6 新規 / v4.0.7 強化)

> [PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-114-person_reference_attachment_rule) で portrait を attach した場合、[SUBJECT] 内で **衣装・髪・顔の詳細を再記述すると nanobanana が image と text 指示の間で矛盾を起こし、結果として両方を中途半端に reflect する**。
>
> **Defeats**: Feature Blending / Drift Bias caused by conflicting text/image embeddings competing for latent space.

```
When a NAMED_CHARACTER portrait is attached via [REFERENCE], the [SUBJECT] section
MUST be lean — describe WHO is in the scene (role + name reference) and the rendering
intent (e.g., posture, expression baseline), but DO NOT duplicate the outfit / hair /
face details. Those are inherited EXCLUSIVELY from the attached portrait per
[PART 1.14 rule_b].
```

#### Required phrase (v4.0.7 verbatim, in [SUBJECT])

```
Character identity MUST be derived EXCLUSIVELY from the attached image. Render the
exact face, hair, and build shown in the reference. Replace ONLY the outfit with
[NEW_OUTFIT] when the scene action requires a different outfit than the portrait.
When the scene uses the portrait's default outfit, do NOT mention outfit at all.
```

#### Forbidden phrases (v4.0.7)

- 衣装・髪色・目の形・顔の輪郭の **textual re-description**（reference image と embedding 競合）
- `as shown in the reference image with X hair and Y outfit`（reference 指定と text 指定の二重情報）
- `inspired by the reference`（曖昧な参照、identity drift を許す）

#### Lean [SUBJECT] form (canonical wording)

```
Character in scene: <role description> (<NAMED_CHARACTER name reference>, per attached
portrait image_N). Character identity MUST be derived EXCLUSIVELY from the attached
image — render the exact face, hair, build, and phenotype shown in the reference. This
block specifies only role contextualization and any scene-specific posture/expression
that differs from the portrait's default.
```

#### Scene-deviation override (when scene outfit ≠ portrait outfit)

```
NOTE: while the attached portrait shows <character> in <portrait-outfit>, this scene
requires <scene-outfit>. Preserve FACE STRUCTURE, HAIR, BUILD, and PHENOTYPE from the
portrait; replace ONLY the outfit with <scene-outfit>.
```

### 3.9.6 particle_visual_mapping (v4.0.7 新規 / Gemini Q2)

> 日本語 particle は文中の意味関係を運ぶ。画像で同等の関係を伝えるには、各 particle に対応する **visual syntax** を定める必要がある。曖昧な spatial descriptor（near / by / around）は関係が確定しないため禁止。
>
> **Defeats**: Relational Ambiguity Bias.

| Particle | Semantic role | Required SCENE phrase (verbatim) | Forbidden phrase |
|---|---|---|---|
| は | topic (given) | `Render the subject in the primary foreground plane at 60% frame scale, establishing them as the absolute visual anchor of the composition.` | `standing in the background`, `visible in the scene` |
| が | focus (new info) | `Render the subject actively executing the verb with distinct, dynamic physical motion, isolating their action from the static background elements.` | `standing passively`, `posing naturally`, `looking at the camera` |
| に | target / recipient | `Lock the subject's exact eyeline directly onto the target, and extend their arm in a rigid, unbroken trajectory pointing squarely at the target.` | `looking vaguely towards`, `near the target`, `facing the target` |
| で | locale / instrument | `Fully enclose the subject within the specified interior architecture, ensuring bounding walls or large stationary instruments physically frame their immediate working space.` | `standing outside`, `holding the tool loosely`, `in front of` |
| を | direct object | `Ensure the subject's hands are in direct physical contact with the object, actively gripping, holding, or manipulating its surface.` | `looking at the object`, `object is placed on the table near them` |
| の | possession ("私の本") | `The subject MUST be physically clasping the object firmly against their own torso, visually locking the item to their personal body mass.` | `the object is next to the character`, `holding the object out`, `the object belongs to them` |
| へ | direction (movement) | `Angle the subject's body profile horizontally across the frame, with their leading foot suspended in mid-stride pointing toward the target destination edge.` | `facing the viewer`, `arrived at`, `standing at` |

> **Notes**:
> - の (institutional affiliation, e.g. 大学**の**学生) は §3.9.3 affiliation_indoor で別扱い。の (possession, e.g. 私**の**本) のみ上表を適用。
> - が の Required phrase は **action 動詞** を伴う sentence 用。stative copula sentence（誰**が**先生ですか — 行動なし）は §3.9.2 Identity-only exception を適用。

### 3.9.7 horror_vacui_blank_surfaces (v4.0.7 新規 / Gemini (d) + Q3 + Q7)

> "blank whiteboard" や "empty desks" 等の **欠落を語る wording** は、nanobanana の **Horror Vacui (Fear of Empty Space) / Gibberish Hallucination** bias を直撃し、模様の代わりに pseudo-kanji / 幽霊生徒 / fake document / 偽 UI を捏造する。**「無い」ではなく「solid 何々がある」と positive に書く**。
>
> **Defeats**: Horror Vacui / Gibberish Hallucination / Textual Hallucination Bias.

```
All flat surfaces (whiteboards, screens, paper, walls, monitors, badges, desks) MUST be
rendered as solid, unbroken fields of flat color. "Empty" or "blank" means a solid
geometric color block, NOT an absence of people. Do NOT write "blank" / "empty" / "clean"
/ "unoccupied" / "nobody is" — these word stems trigger the model to generate the very
things that usually occupy those objects to define what they are.
```

#### Required SCENE phrase per surface (v4.0.7 verbatim)

| # | surface | Required SCENE phrase | Forbidden phrase |
|---|---|---|---|
| 7a | unused whiteboard | `A wide featureless whiteboard spanning the left half of the frame, rendered as a single, uninterrupted geometric block of solid flat white color. It MUST be absolutely devoid of any marker lines, scribbles, text, or pseudo-kanji.` | `A blank whiteboard`, `An empty whiteboard`, `A clean whiteboard ready for writing` |
| 7b | unoccupied lecture-hall desks | `A long, continuous horizontal row of wooden lecture-hall desk surfaces extending edge-to-edge. The seating area MUST be completely unpopulated, showing only bare chairs and bare desk surfaces with zero human figures, silhouettes, or personal items.` | `Empty desks`, `An empty classroom`, `Unoccupied seats`, `Nobody is sitting there` |
| 7c | flat-panel medical monitor | `A flat-panel medical monitor angled toward the viewer, its screen rendered as a completely solid, featureless dark-slate rectangle. The screen MUST NOT display any UI elements, charts, text, lines, or data visualization.` | `A blank monitor`, `A monitor showing a blank screen`, `An empty display`, `The screen is off` |
| 7d | textbook held by character | `A thick textbook rendered as a solid, flat-color geometric block. The cover, spine, and any visible pages MUST be completely blank, displaying absolute zero text, lines, pseudo-kanji, or interior illustrations.` | `An open textbook showing pages`, `A detailed book`, `Reading a book` |
| 7e | ID name-badge | `A plain rectangular plastic ID badge, rendered as a single, uninterrupted solid-color polygon. It MUST contain zero text, zero profile photos, zero graphic logos, and zero dividing lines.` | `A name tag`, `An ID card with a photo`, `A staff badge` |
| 7f | desk surface (cleared) | `The desk surface MUST be rendered as an entirely bare, completely cleared geometric plane of solid color. It MUST be absolutely devoid of any scattered papers, pens, coffee cups, or hallucinated office clutter.` | `A typical office desk`, `A desk with paperwork`, `A realistic workspace` |
| 7g | office computer monitor | `An office computer monitor featuring a completely solid, uniform dark-slate screen area. The screen MUST NOT display any desktop icons, application windows, text, taskbars, or UI elements of any kind.` | `A computer screen showing work`, `A monitor with data`, `An active computer` |
| 7h | interior wall | `The interior background wall MUST be a completely bare, uninterrupted expanse of solid flat color. It MUST be absolutely devoid of posters, framed pictures, clocks, light switches, baseboards, or any architectural detailing.` | `A decorated wall`, `A typical classroom wall`, `An office background` |

#### Positive enumeration addendum (v4.0.7)

scene-essential prop（医療診察室の clipboard、教室の textbook on podium、銀行カウンターの計算機 等）が必要な場合は、**desk featureless rule (7f) を上書き** して positive enumerate する：

```
The desk surface displays exactly <N> <prop list — e.g. "one closed clipboard at the
right side and one flat-panel medical monitor at the left center">; the rest of the
surface is bare and devoid of any other items.
```

### 3.9.8 two_panel_qa_pattern (v4.0.7 新規 / Gemini Q4 + Q6)

> はい〜／いいえ〜の対比 sentence（lesson_01 ex_L01_007 / 011 / 013）は、**vertical divider が無視される / 2 character が identity drift する / 余分な symbol が捏造される** の 3 failure mode がある。divider 強制 + identity lock + symbol count strict の 3 段 enforcement が必要。
>
> **Defeats**: Layout Ignorance Bias / Identity Drift Across Panels / Symbol Over-Generation Bias.

#### A. NAMED_CHARACTER 付き 2-panel（portrait reference あり）

[SCENE & ACTION] block (verbatim):

```
LAYOUT OVERRIDE: The 16:9 frame MUST be split exactly down the middle by a thick, solid
vertical divider line extending entirely from the top edge to the bottom edge, creating
two strictly equal, isolated rectangular panels (LEFT PANEL and RIGHT PANEL).

LEFT PANEL (Affirmation): Render the specified character (per attached portrait) inside
the left half. They exhibit a bright, affirming open-mouth smile. A pure 2D graphic
overlay of a single green checkmark is composited flat against the picture plane in the
left-center of this panel.

RIGHT PANEL (Negation): Render an EXACT visual clone of the character (same attached
portrait) inside the right half. They exhibit a negating expression with closed eyes
and hands crossed in an 'X' gesture. A pure 2D graphic overlay of a single red X-mark
is composited flat against the picture plane in the right-center of this panel.

IDENTITY LOCK: The character in the LEFT PANEL and the character in the RIGHT PANEL
MUST be identical in every physical detail (face, hair, build, outfit, phenotype). Zero
identity drift is permitted between the two panels.

SYMBOL COUNT STRICT ENFORCEMENT: There MUST be exactly TWO symbols in the entire output
image — exactly ONE green checkmark (left) and exactly ONE red X-mark (right). DO NOT
render any other symbols, floating shapes, UI elements, or background text.
```

#### B. NAMED_CHARACTER なし 2-panel（generic role/nationality archetype）

[SUBJECT] block (verbatim — character archetype の **fully specified** description が必要):

```
Establish a SINGLE, highly specific generic character archetype for this scene: <INSERT
EXACT AGE RANGE, HAIR, PHENOTYPE, OUTFIT DETAILS per PART 5.8 role_key + PART 5.3
phenotype>. This precise visual configuration serves as the strict master template. The
model MUST internally lock this exact design before rendering the panels.
```

[SCENE & ACTION] block (verbatim):

```
LAYOUT OVERRIDE: The 16:9 frame MUST be split exactly down the middle by a thick, solid
vertical divider line extending entirely from the top edge to the bottom edge, creating
two strictly equal, isolated rectangular panels (LEFT PANEL and RIGHT PANEL).

LEFT PANEL (Affirmation): Render the master character template inside the left half.
They exhibit a bright, affirming open-mouth smile. A pure 2D graphic overlay of a single
green checkmark is composited flat against the picture plane in the left-center of this
panel.

RIGHT PANEL (Negation): EXACT CLONE. Render a 1:1 visual clone of the left-panel
character inside the right half. The ONLY permitted differences are the facial expression
(closed eyes, negating) and the arm gesture (hands crossed in an 'X'). The face structure,
hair strands, outfit folds, and body proportions MUST be mathematically identical to the
left panel.

SYMBOL COUNT STRICT ENFORCEMENT: There MUST be exactly TWO symbols in the entire output
image — exactly ONE green checkmark (left) and exactly ONE red X-mark (right). DO NOT
render any other symbols, floating shapes, UI elements, or background text.
```

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
