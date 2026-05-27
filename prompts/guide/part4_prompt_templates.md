# PART 4: PROMPT_TEMPLATES

> 対象：vocab_type ごとの prompt 骨格テンプレ + placeholder。skill が [PART 5](part5_vocab_reference_appendix.md) lookup と [PART 3](part3_vocab_type_rules.md) vocab_type rule で埋めて完成形 prompt にする。
> Migrated from `prompts/master_prompt_design_guide_v4_0.py` (hash `891b73f5ae2d`) — lines 2706-3330 (templates) + 4805-4939 (PLACEHOLDER_ORIGINS).
> See also: [PART 1](part1_universal_rules.md), [PART 3](part3_vocab_type_rules.md), [PART 5](part5_vocab_reference_appendix.md), [PART 6](part6_output_instructions.md).

---

## vocab_type → template mapping

| vocab_type | template letter | template key | aspect ratio |
|---|---|---|---|
| `person` | A | `vocabulary_person` | 1:1 |
| `building` | B | `vocabulary_building` | 1:1 |
| `example_sentence` | C | `example_sentence` | 16:9 |
| `concrete_object` | D | `vocabulary_object_concrete` | 1:1 |
| `variant_grid` | E | `vocabulary_variant_grid` | 1:1 or 16:9 |
| `spatial_relation` | F | `spatial_relation` | 1:1 |
| `demonstrative` | G | `demonstrative_kosoado` | 1:1 or 16:9 |
| `action_verb` | H | `action_verb` | 1:1 or 16:9 |
| `abstract_concept` | I | `abstract_concept` | 1:1 |
| `adjective` | J | `vocabulary_adjective` | 1:1 |

選択基準：`lesson_NN.json` の `vocabulary[].vocab_type` または `data/vocab_catalog.json` の `vocab_type` を確認し、上記の対応テンプレートを使用。`vocab_type` 未設定の語彙はまず分類を行う（[PART 1 使い方](part1_universal_rules.md#使い方) 参照）。

---

## Template A: vocabulary_person

> v2.3 修正：カノニカル視点・表情・姿勢の具体化指示を追加。
> v2.4 修正：「Full-body shot + 30-45 度俯瞰」の矛盾を解消。人物には水平方向 3/4 ビュー（眼の高さで斜め前方）を使用。

```
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The image must instantly communicate the meaning of the word "[TARGET_WORD]" at a glance.

[SUBJECT]
{CHARACTER_DESCRIPTION}
Pose and expression: {CHARACTER_POSE_AND_EXPRESSION}
The character's role must be immediately obvious from clothing, posture, and props alone.
FACIAL FEATURES RULE (v4.0 PART 1.8): The character's face MUST clearly show
all four primary facial features — eyes (with visible pupils, not blank circles),
eyebrows (simple curved or angled lines above the eyes), nose (a simple line or
dot or small shape), and mouth (a simple line or curve or small shape). NEVER
omit any of these four features. A faceless silhouette, blank face, partially-
rendered face, or 'stylized stock illustration without facial detail' is NOT
permitted, even when the outfit (business suit, doctor coat, uniform, etc.) is
the dominant role signature. Facial features must be drawn in the same flat
illustration style as the rest of the body — minimal but visibly present.
HEAD-BODY PROPORTION RULE (v4.0 PART 1.10): The character MUST be rendered as
an adult standing figure with approximately 7-head-height proportion (head
height = approximately 1/7 of total body height). NEVER render adult roles
with shorter 5-6 head proportions which read as childlike or cartoonish. This
is especially important for role cards with childhood-bias triggers — business
suit + briefcase, school-style casual + backpack, uniforms — where nanobanana
tends to default to anime salaryman/student cliché short proportions. The
character must read as a working-age adult (approximately 20s-50s) by body
proportion alone. Exception: explicit child NAMED_CHARACTERs with documented
child age_range follow their own fixed_features.

[SCENE & ACTION]
ASPECT RATIO (v3.11.1 TEMPORARY for Gemini fallback): The output image MUST be
1:1 SQUARE — equal width and height (e.g., 1024×1024). DO NOT output 16:9
widescreen, 4:3 landscape, 3:4 vertical, 9:16 portrait, or any other ratio.
Square 1:1 only.
FULL-BODY SHOT — the entire figure from the very top of the head to the soles
of BOTH feet is fully inside the frame, with a clear empty margin above the head
and a visible strip of empty ground below both feet. This is NOT a portrait,
headshot, or waist-up crop.
The standing figure spans roughly 80% of the image HEIGHT (measured by height,
NOT by area), centered horizontally. Empty background on the left and right is
expected and correct — do NOT zoom or crop in to fill the sides; that side
margin is intentional.
Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at the
subject's eye height (not above, not below) and rotated approximately 30-45 degrees
to one side. This is a diagonal front view that shows both the front face and a partial
side view of the body simultaneously while preserving natural body proportions.
DO NOT use an overhead or bird's-eye angle. DO NOT crop the body at the head, neck,
waist, hips, thighs, or knees. Both feet and a small patch of the flat ground
directly beneath them must be clearly visible.
FOOTWEAR RULE (v3.11): Both feet MUST visibly wear footwear (shoes, sandals,
espadrilles, ballet flats, work boots, sneakers, loafers, or similar). Barefoot
is NOT permitted in vocabulary cards — even when the cultural styling implies
an at-home or indoor context, the subject must be depicted in a public/outdoor
moment with footwear visible on both feet.
Solid soft cream off-white background (warm off-white, NOT pure stark white). No other characters or objects in the frame.
Framed as with a standard ~50mm-equivalent lens at full standing distance (NOT an 85mm tight portrait lens).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue
and warm amber gold as accents, cool slate gray for secondary elements.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no decorative symbols anywhere — including
titles, labels, captions, watermarks, or any text overlay at any position in
the rendered output.
{NATIONALITY_EXCEPTION_BLOCK}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "person"`
**Aspect ratio**: 1:1 (square; v3.11.1 Gemini fallback)
**Rule references**: [PART 1.1 NATIONALITY_NOUN_POLICY](part1_universal_rules.md#part-11-nationality_noun_policy), [PART 1.5 PHENOTYPE](part1_universal_rules.md#part-15-phenotype_specification_rule), [PART 1.7 FLAG_PLACEMENT](part1_universal_rules.md#part-17-flag_placement_rule), [PART 1.8 FACIAL_FEATURES](part1_universal_rules.md#part-18-facial_features_rule), [PART 1.10 HEAD_BODY_PROPORTION](part1_universal_rules.md#part-110-head_body_proportion_rule), [PART 1.11 FOOTWEAR](part1_universal_rules.md#part-111-footwear_rule), [PART 3.1 person](part3_vocab_type_rules.md#31-person-vocab_type--person), [PART 5.1 PERSON_ROLE_LOOKUP](part5_vocab_reference_appendix.md#51-person_role_lookup), [PART 5.2 PERSON_NATIONALITY_HINTS](part5_vocab_reference_appendix.md#52-person_nationality_hints), [PART 5.8 ROLE_BASED_GENERIC_PROFILES](part5_vocab_reference_appendix.md#58-role_based_generic_profiles), [PART 6.4 NATIONALITY_EXCEPTION_BLOCK / ROLE_ANTI_FLAG_BLOCK](part6_output_instructions.md#64-injected-constraint-blocks)
**Placeholders**: `[TARGET_WORD]`, `{CHARACTER_DESCRIPTION}`, `{CHARACTER_POSE_AND_EXPRESSION}`, `{NATIONALITY_EXCEPTION_BLOCK}`

---

## Template B: vocabulary_building

> v4.0.4 (2026-05-25) 全面改訂：worktree image-prompt-plan の R1-R26 実機検証で確立した universal cream background + 5-image reference attachment + universal rule A-1〜A-11 + per-vocab-type 4 件テーブル 設計に移行。
> Stage 1 採用 4 件（学校 R25 / 大学 R26 / デパート R22 / 会社 R22）は本テンプレートで本番化済。
> v3.0 旧テンプレ（pale sky-blue background / 70% frame / single primary_scene_cue）は未移行 4 件（銀行 / 病院 / 駅 / スーパー）向けに本セクション末尾に Legacy として残置。

### Template B (v4.0.4 — 採用 4 件用)

```
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The building must be IMMEDIATELY and UNAMBIGUOUSLY recognizable as a [{VOCAB_TYPE_DESC}] at a glance.
Echoing the style and brand voice of the 5 attached reference images per PART 1.12 BUILDING_REFERENCE_ATTACHMENT_RULE:
- image_1 ({REF1_DESC}) = brand voice / line weight / palette family / illustration tone anchor
- image_2 ({REF2_DESC}) = type-relevant person reference A
- image_3 ({REF3_DESC}) = type-relevant person reference B
- image_4 ({REF4_DESC}) = type-relevant person reference C
- image_5 ({REF5_DESC}) = architectural & close-up framing anchor

[SUBJECT]
The primary subject is {FORM_DESC}.
The primary signature feature is {SIGNATURE} — render this feature clearly and prominently
so that a learner identifies the building as a [{VOCAB_TYPE_DESC}] from this signature alone.
Accent color: {ACCENT} — applied to {ACCENT_TARGETS}; walls remain cream off-white;
roof remains slate-grey.
A single ENGLISH signboard with the building name "{LABEL}" is mounted {SIGNBOARD_LOCATION}.
This signboard is the ONLY text-bearing surface anywhere in the image.

[SCENE & ACTION]
{BUILDING_UNIVERSAL_RULE}

(The universal rule above expands [PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4]
A-1 Camera through A-11 Cyclist pose inline. The per-building variables
{ACCENT}, {SIGNATURE}, {LABEL}, {SIGNBOARD_LOCATION}, {SURROUNDINGS_BLOCK},
{ACTIVITIES_BLOCK}, {LANDSCAPING_BLOCK}, and {FRAMING_EXTRA} are resolved
by the skill from PART 5.10 BUILDING_CUES[X] for the target word.)

Surroundings: {SURROUNDINGS_BLOCK}

{FRAMING_EXTRA}

Figures in scene: {ACTIVITIES_BLOCK}

Landscaping: {LANDSCAPING_BLOCK}

ASPECT RATIO: The output image MUST be 1:1 SQUARE — equal width and height
(e.g., 1024×1024). DO NOT output 16:9 widescreen, 4:3 landscape, 3:4 vertical,
9:16 portrait, or any other ratio.

Background: {BG_EXACT} — the canvas background color (visible only in the small
strip above the building roofline and any narrow vertical strips at the canvas edge).
NEVER use pale sky-blue, NEVER use a graduated sky background.
The cream off-white background is the universal v4.0.4 convention shared with all
other vocab_types — no per-vocab-type background overrides.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, slate-grey roof, {ACCENT} for accent details on {ACCENT_TARGETS}.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
EXCEPTION (per PART 1.13 A-7): EXACTLY ONE short ENGLISH building-name label
"{LABEL}" is permitted — one English word (or short multi-word label like "DEPT. STORE"),
small, mounted {SIGNBOARD_LOC_SHORT}. This is the SOLE permitted text.
BLANK TEXT SURFACES RULE (PART 1.13 A-9): Absolutely NO other text of any kind anywhere
in the image — no Japanese (kanji/kana), no second English word, no "RECEPTION" / "ATM" /
"OPEN" / "WELCOME" / "MENU" or any other label, no numbers, no titles, no captions,
no street numbers, no phone numbers, no decorative symbols that resemble letters.
All other plaques, walls, gates, doors, vehicles, surfaces, address plates,
bulletin boards, name plates, billboards, banners, posters, window lettering MUST
be left BLANK. nanobanana default behavior often adds spurious text-bearing
surfaces — this constraint MUST override that default.

No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "building"` AND `word` has v4.0.4 fields in [PART 5.10 BUILDING_CUES](part5_vocab_reference_appendix.md#510-building_cues)（学校 / 大学 / デパート / 会社）
**Aspect ratio**: 1:1
**Rule references**: [PART 1.12 BUILDING_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-112-building_reference_attachment_rule), [PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4](part1_universal_rules.md#part-113-building_universal_rule_v4_0_4), [PART 2 color_palette](part2_style_bible.md#color_palette), [PART 3.2 building](part3_vocab_type_rules.md#32-building-vocab_type--building), [PART 5.10 BUILDING_CUES](part5_vocab_reference_appendix.md#510-building_cues)

**Placeholders (v4.0.4 — 17 種)**:

| placeholder | source |
|---|---|
| `{VOCAB_TYPE_DESC}` | PART 5.10 BUILDING_CUES[X].vocab_type_desc |
| `{FORM_DESC}` | PART 5.10 BUILDING_CUES[X].form_desc |
| `{SIGNATURE}` | PART 5.10 BUILDING_CUES[X].signature |
| `{ACCENT}` | PART 5.10 BUILDING_CUES[X].accent |
| `{ACCENT_TARGETS}` | PART 5.10 BUILDING_CUES[X].accent_targets |
| `{LABEL}` | PART 5.10 BUILDING_CUES[X].label |
| `{SIGNBOARD_LOCATION}` | PART 5.10 BUILDING_CUES[X].signboard_location |
| `{SIGNBOARD_LOC_SHORT}` | PART 5.10 BUILDING_CUES[X].signboard_location_short |
| `{SURROUNDINGS_BLOCK}` | PART 5.10 BUILDING_CUES[X].surroundings_block |
| `{FRAMING_EXTRA}` | PART 5.10 BUILDING_CUES[X].framing_extra（null の場合は省略） |
| `{ACTIVITIES_BLOCK}` | PART 5.10 BUILDING_CUES[X].activities_block |
| `{LANDSCAPING_BLOCK}` | PART 5.10 BUILDING_CUES[X].landscaping_block |
| `{REF1_DESC}` | constant: "the Japanese-person card / brand voice anchor" |
| `{REF2_DESC}` | per-building: derived from BUILDING_CUES[X].type_relevant_refs[0] |
| `{REF3_DESC}` | per-building: derived from BUILDING_CUES[X].type_relevant_refs[1] |
| `{REF4_DESC}` | per-building: derived from BUILDING_CUES[X].type_relevant_refs[2] |
| `{REF5_DESC}` | constant: "the hospital building card / architectural & close-up framing anchor" |
| `{BUILDING_UNIVERSAL_RULE}` | PART 1.13 BUILDING_UNIVERSAL_RULE_V4_0_4 全文 inline 展開 (A-1〜A-11) |
| `{BG_EXACT}` | constant: `soft cream off-white background (warm off-white, NOT pure stark white)` = [PART 6.5 BG_EXACT_CREAM](part6_output_instructions.md#65-preflight-invariants-mechanical-gates) |

**styleReferences (output JSON field)**:
```json
"styleReferences": [
  "data/images/word_日本人.png",
  "<image_2 absolute path from type_relevant_refs[0]>",
  "<image_3 absolute path from type_relevant_refs[1]>",
  "<image_4 absolute path from type_relevant_refs[2]>",
  "data/images/vocab_病院.jpg"
]
```

### Template B (v3.0 Legacy — 未移行 4 件用 / 銀行 / 病院 / 駅 / スーパー)

> v3.0 全面改訂（問題 B/C/内部矛盾を恒久解決）：看板を「英語短語ラベル 1 個」に確定、単一シーンキュー、反クラッター。
> v4.0.4 移行待ち。lesson_02 以降で BUILDING_CUES に v4_0_4_* fields を追加した時点で本 Legacy テンプレートから上記 v4.0.4 テンプレートに移行する。

```
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The building must be IMMEDIATELY and UNAMBIGUOUSLY recognizable as a [{BUILDING_TYPE}] at a glance.

[SUBJECT]
The main subject is [{BUILDING_DESCRIPTION_AND_SCALE}].
Exactly ONE short ENGLISH building-name label, the single word [{SIGNAGE_TEXT}],
is printed cleanly and legibly on the building's fascia or a small sign above
the main entrance. This English word is the ONLY text anywhere in the image.
Do NOT render any Japanese characters, kanji, kana, or any non-Latin script.
Do NOT render any second word, slogan, address, phone number, or brand name.

[SCENE & ACTION]
Viewed from a slight three-quarter front angle at eye level, 35mm wide-angle lens equivalent.
Straight vertical lines, natural perspective with no fisheye distortion.
A flat pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette.
The building occupies about 70% of the frame and is centered.

Single identifying scene cue (use ONLY this one cue — do not add others):
[{PRIMARY_SCENE_CUE}]

Keep the composition calm and uncluttered. Render ONLY the building, the single
English label, and the one scene cue above. Do NOT invent or add any extra
signs, signboards, banners, posters, billboards, blank framed boards, screens,
display panels, window lettering, secondary buildings, vehicles, or background
clutter that is not explicitly described here.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: pale sky-blue background,
deep slate navy outlines, main_color and sub_color tones for the building facade (細部のみ educational_symbol_colors 許可),
warm amber gold for accent details.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
EXCEPTION (per 資料8, v3.0): EXACTLY ONE short ENGLISH building-name label
[{SIGNAGE_TEXT}] is permitted — one English word only, small, on the entrance fascia.
This is the SOLE permitted text. Absolutely NO other text of any kind:
no Japanese (kanji/kana), no second English word, no "RECEPTION"/"ATM"/"OPEN"
or any other label, no numbers, no titles, no captions, no decorative symbols
anywhere else in the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "building"` AND word does NOT have v4.0.4 fields in PART 5.10 BUILDING_CUES（銀行 / 病院 / 駅 / スーパー）
**Aspect ratio**: 1:1
**Rule references**: [PART 2 STYLE_BIBLE](part2_style_bible.md#background_by_type) (BG_EXACT_SKYBLUE for legacy), [PART 3.2 building (未移行 4 件)](part3_vocab_type_rules.md#未移行-4-件-銀行--病院--駅--スーパー), [PART 5.10 BUILDING_CUES](part5_vocab_reference_appendix.md#510-building_cues)
**Placeholders**: `[{BUILDING_TYPE}]`, `[{BUILDING_DESCRIPTION_AND_SCALE}]`, `[{SIGNAGE_TEXT}]`, `[{PRIMARY_SCENE_CUE}]`

---

## Template C: example_sentence

> v4.1 (2026-05-22) Phase 5 ④ Q1 A：v4.0 universal rules（PART 1.8 FACIAL_FEATURES / PART 1.10 HEAD_BODY_PROPORTION / FOOTWEAR_RULE）を `vocabulary_person` 同様に inline 追加。
> v4.0.5 (2026-05-26)：[PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-114-person_reference_attachment_rule) の `[REFERENCE]` セクションを追加。sentence 内に NAMED_CHARACTER が登場する場合のみ、対応 portrait を 1〜4 枚 attach し identity transfer を行う。NAMED_CHARACTER 不在の例文では `[REFERENCE]` セクション自体を出力しない（skill が分岐）。
> v4.0.6 (2026-05-26 X-c)：[PART 3.9 v4.0.6 5 subsections](part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level) 反映：
>   1. **[STRICT LAYOUT DIRECTIVE] ブロックを [PURPOSE] 直下に新設** (16:9 default-1:1 drift 防止)
>   2. **[SUBJECT] は REFERENCE attached 時 lean form** (衣装重複削除)
>   3. **{SYMBOL_PERMISSION_CLAUSE}** placeholder 化 (symbol 不要例文では explicit 禁止文に切替・skill が分岐)
>   4. **{SCENE_DESCRIPTION} は role action + horizontal anchor** を含む (PART 3.9 scene_action_focus / affiliation_indoor)
> v4.0.7 (2026-05-27 X-c-6)：[PART 3.9 v4.0.7 8 subsections](part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level) 反映（Gemini 第三/四意見統合）：
>   1. **{SCENE_DESCRIPTION}** に edge-bleed 文必須（§3.9.1 Required phrase）
>   2. **{SCENE_DESCRIPTION}** に object-manipulation 文必須・identity-only 例外あり（§3.9.2 / §3.9.2 5a/5b）
>   3. **{SCENE_DESCRIPTION}** affiliation は "INSIDE the [INSTITUTION]" 文必須（§3.9.3）
>   4. **{VISUAL_SYMBOL_IF_NEEDED}** は **2D UI overlay** 文必須（§3.9.4 Diegetic Confusion 対応）
>   5. **[SUBJECT]** lean form 強化：`EXCLUSIVELY from the attached image`（§3.9.5）
>   6. **{SCENE_DESCRIPTION}** particle visual mapping 適用（§3.9.6）
>   7. **{SCENE_DESCRIPTION}** blank surface は positive featureless wording（§3.9.7 / Horror Vacui 対応）
>   8. **2-panel Q/A** sentence は §3.9.8 の verbatim block を [SCENE & ACTION] 丸ごと差し替え

```
[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
[{SENTENCE_JP}] ({SENTENCE_EN})
The viewer must instantly read the sentence's grammatical core (role identity /
affiliation / question / affirmation-negation) from the visualized action — not
from the absence of conflicting cues.

[STRICT LAYOUT DIRECTIVE]
ASPECT RATIO: MUST be 16:9 widescreen landscape (horizontal orientation). DO NOT
crop into a square 1:1 frame, NOT 4:3 landscape, NOT 3:4 vertical, NOT 9:16
portrait. To enforce the 16:9 layout, the scene's background elements MUST
extend horizontally from the left edge to the right edge of the frame — see the
[SCENE & ACTION] block below for the specific horizontal anchor (whiteboard /
wide desk / building facade / 2-panel vertical divider). nanobanana defaults to
1:1; this directive is the primary counterweight.

[REFERENCE]
(This section is emitted ONLY when the sentence contains one or more NAMED_CHARACTERs from PART 5.9 NAMED_CHARACTER_PROFILES. If no NAMED_CHARACTER is detected, the entire [REFERENCE] section is omitted by the skill.)
{NAMED_CHARACTER_REFERENCES}

[SUBJECT]
{CHARACTER_DESCRIPTIONS}
(When a NAMED_CHARACTER portrait is attached above, the [CHARACTER_DESCRIPTIONS]
text MUST be lean — per [PART 3.9.5 reference_redundancy_avoidance](part3_vocab_type_rules.md#395-reference_redundancy_avoidance-v406-新規--v407-強化), character identity
MUST be derived EXCLUSIVELY from the attached image. DO NOT redescribe hair color,
eye shape, face contour, or the portrait's default outfit. When the scene requires
a different outfit, use the Scene-deviation override formulation; otherwise omit
outfit text entirely.)

FACIAL FEATURES RULE (v4.0 PART 1.8): Every character figure in the image MUST
clearly show all four primary facial features — eyes (with visible pupils, not
blank circles), eyebrows (simple curved or angled lines above the eyes), nose
(a simple line or dot or small shape), and mouth (a simple line or curve or
small shape). NEVER omit any of these four features. A faceless silhouette,
blank face, partially-rendered face, or 'stylized stock illustration without
facial detail' is NOT permitted, even when the outfit (business suit, doctor
coat, uniform, etc.) is the dominant role signature. Facial features must be
drawn in the same flat illustration style as the rest of the body — minimal
but visibly present.
HEAD-BODY PROPORTION RULE (v4.0 PART 1.10): Every adult character figure MUST
be rendered with approximately 7-head-height proportion (head height =
approximately 1/7 of total body height). NEVER render adult roles with shorter
5-6 head proportions which read as childlike or cartoonish. This is especially
important for figures with childhood-bias triggers — business suit + briefcase,
school-style casual + backpack, uniforms — where nanobanana tends to default
to anime salaryman/student cliché short proportions. Adult characters
(approximately 20s-50s) must read as working-age adults by body proportion
alone. Exception: explicit child NAMED_CHARACTERs with documented child
age_range follow their own fixed_features.
FOOTWEAR RULE (v3.11 / preserved in v4.0): Every character figure MUST visibly
wear footwear on both feet (shoes, sandals, sneakers, loafers, work boots, or
similar) whenever both feet are inside the frame. Barefoot is NOT permitted in
example-sentence illustrations — even when the cultural styling implies an
at-home or indoor context. If the composition crops feet out of frame
(waist-up shots etc.), this rule does not apply to the cropped figures.

[SCENE & ACTION]
{SCENE_DESCRIPTION}
The {SCENE_DESCRIPTION} above MUST satisfy ALL the following conditions
(per [PART 3.9 v4.0.7 subsections 1-3 + 6-8](part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level)):
  (a) **Edge-bleed (§3.9.1)**: the specified horizontal background anchor MUST
      physically intersect and bleed off both the extreme left and extreme right
      edges of the frame.
  (b) **Object-manipulation (§3.9.2)**: the character MUST be actively, physically
      manipulating an object related to their role — NOT a passive standing pose.
      EXCEPTION: identity-only declaratives (nationality / role identity without
      affiliation) follow §3.9.2 Identity-only exception 5a/5b instead.
  (c) **Indoor enclosure (§3.9.3)**: for affiliation sentences (〜の〜), the scene
      is strictly an INDOOR interior shot fully enclosed by walls; the character
      is INSIDE the institution — NEVER "at" / "outside" / "in front of" it.
  (d) **Particle visual mapping (§3.9.6)**: the dominant Japanese particles in the
      sentence MUST be reflected via the §3.9.6 verbatim phrases (は/が/に/で/を/の/へ).
  (e) **Featureless surfaces (§3.9.7)**: any flat surface mentioned (whiteboard /
      desk / monitor / textbook / badge / wall) MUST use the §3.9.7 positive
      "featureless solid color block" wording — NEVER the words "blank" / "empty"
      / "clean" / "unoccupied" / "nobody is".
  (f) **2-panel pattern (§3.9.8)**: for はい〜／いいえ〜 sentences, REPLACE this
      entire [SCENE & ACTION] block with the verbatim §3.9.8 A or B block.
The characters' actions and relationship must make the sentence meaning visually obvious without any text.
{VISUAL_SYMBOL_IF_NEEDED}
(When a symbol IS permitted per §3.9.4, the {VISUAL_SYMBOL_IF_NEEDED} placeholder
MUST emit the §3.9.4 verbatim "pure 2D graphic UI overlay composited flat against
the picture plane" phrase. The character MUST NOT interact with, look at, point to,
or react to the overlay. Forbidden positional phrases: "hovers at chest level",
"floating in the air", "next to the character", "suspended above", "projected onto",
"holographic".)

Composition: Wide 16:9 shot, 50mm standard lens equivalent (natural perspective).
Characters occupy 60% of the frame.
{COMPOSITION_NOTES}
Eye-level view. Simple minimal background with only essential context.
Main characters are clearly separated from the background in visual contrast.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm colors,
warm amber gold accents for emphasis.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
{SYMBOL_PERMISSION_CLAUSE}
(SYMBOL_PERMISSION_CLAUSE is one of two forms per [PART 3.9 visual_symbol_restriction](part3_vocab_type_rules.md#visual_symbol_restriction-v406-新規):
  • SYMBOL-USING example: "VISUAL_SYMBOLS entries (question mark / checkmark /
    X mark / arrow) ARE PERMITTED — but ONLY exactly the symbols specified in
    {VISUAL_SYMBOL_IF_NEEDED} above. nanobanana MUST NEVER add any additional
    floating symbols, arrows, circles, or geometric shapes encircling characters
    or the scene."
  • NO-SYMBOL example: "ABSOLUTELY NO floating symbols of any kind — no question
    marks, no checkmarks, no X marks, no arrows, no circles, no geometric shapes
    encircling characters, no callout balloons. The scene must communicate
    without any symbolic overlay.")
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
(v4.0.7 / §3.9.7 horror_vacui_blank_surfaces — Horror Vacui defense): All flat
surfaces (whiteboards, screens, paper, walls, monitors, badges, desks) MUST be
rendered as solid, unbroken fields of flat color. "Empty" or "blank" means a
solid geometric color block, NOT an absence of people. Scene-essential props must
be positively enumerated per §3.9.7 Positive enumeration addendum.
```

**Used for**: `vocab_type = "example_sentence"`（lesson-level、語彙ではない）
**Aspect ratio**: 16:9
**Rule references**: [PART 1.5 PHENOTYPE](part1_universal_rules.md#part-15-phenotype_specification_rule), [PART 1.8 FACIAL_FEATURES](part1_universal_rules.md#part-18-facial_features_rule), [PART 1.10 HEAD_BODY_PROPORTION](part1_universal_rules.md#part-110-head_body_proportion_rule), [PART 1.11 FOOTWEAR](part1_universal_rules.md#part-111-footwear_rule), [PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE](part1_universal_rules.md#part-114-person_reference_attachment_rule), [PART 3.9 example_sentence](part3_vocab_type_rules.md#39-example_sentence), [PART 5.9 NAMED_CHARACTER_PROFILES](part5_vocab_reference_appendix.md#59-named_character_profiles), [PART 5.14 VISUAL_SYMBOLS](part5_vocab_reference_appendix.md#514-visual_symbols)
**Placeholders**: `[{SENTENCE_JP}]`, `{SENTENCE_EN}`, `{CHARACTER_DESCRIPTIONS}`, `{SCENE_DESCRIPTION}`, `{VISUAL_SYMBOL_IF_NEEDED}`, `{COMPOSITION_NOTES}`, `{NAMED_CHARACTER_REFERENCES}` (v4.0.5 / [PART 1.14](part1_universal_rules.md#part-114-person_reference_attachment_rule); the entire `[REFERENCE]` section is omitted when no NAMED_CHARACTER is detected), `{SYMBOL_PERMISSION_CLAUSE}` (v4.0.6 / [PART 3.9 visual_symbol_restriction](part3_vocab_type_rules.md#visual_symbol_restriction-v406-新規); skill が symbol-using / no-symbol で 2 form を分岐 emit)

**styleReferences (output JSON field)**: 0-4 paths drawn from PART 5.9 NAMED_CHARACTER_PROFILES `portraitPath` field per character detected in `{SENTENCE_JP}`. Empty array `[]` when no NAMED_CHARACTER appears. Same `referenceImages: [{bytes, mimeType}, ...]` attachment mechanism as PART 1.12 building — `nanobanana-client.mjs` is unchanged.
```json
"styleReferences": [
  "data/images/char_鈴木.png"
]
```

---

## Template D: vocabulary_object_concrete

> v2.3 新規。v2.4：DISPLAY_STRATEGY サブ戦略を導入（OBJECT_ALONE / HAND_HOLDING）。

```
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The image must instantly and UNAMBIGUOUSLY communicate the meaning of "[TARGET_WORD]" at a glance.
A learner must distinguish this object from similar-shaped objects without any text clues.

[SUBJECT]
The subject is: {OBJECT_DESCRIPTION}
Visual signature (distinctive identifying details — DO NOT OMIT):
{VISUAL_SIGNATURE}
These signature details are the primary means of identification. Render them clearly.

[SCENE & ACTION]
Display strategy: {DISPLAY_STRATEGY}
   (Choose EXACTLY ONE of: OBJECT_ALONE / HAND_HOLDING. Default = "OBJECT_ALONE".)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 3.3 OBJECT_STRATEGIES corresponding to {DISPLAY_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Iconization level: Detailed Flat (level 3).
Include symbolic material texture hints:
{MATERIAL_TEXTURE_HINT}
These are symbolic (not photorealistic) — thin lines, dashes, or highlights to suggest material.
No actual shading or gradients.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue
and warm amber gold as accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
Exception: {SIGNAGE_EXCEPTION_IF_ANY}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
For HAND_HOLDING strategy: render the hand as flat schematic silhouette only —
no anatomical detail, no nails, no realistic skin texture.
```

**Used for**: `vocab_type = "concrete_object"`
**Aspect ratio**: 1:1
**Rule references**: [PART 2 iconization_level_guide](part2_style_bible.md#level_3_detailed_flat--recommended), [PART 3.3 object_concrete](part3_vocab_type_rules.md#33-object_concrete-vocab_type--concrete_object), [PART 5.11 OBJECT_SIGNATURES](part5_vocab_reference_appendix.md#511-object_signatures)
**Placeholders**: `[TARGET_WORD]`, `{OBJECT_DESCRIPTION}`, `{VISUAL_SIGNATURE}`, `{DISPLAY_STRATEGY}`, `{STRATEGY_BLOCK}`, `{MATERIAL_TEXTURE_HINT}`, `{SIGNAGE_EXCEPTION_IF_ANY}`

---

## Template E: vocabulary_variant_grid

> v2.3 新規。資料 11：カテゴリ境界の明確化（インターリービング）。類似物体を並置することで「A と B の違い」が脳内に刻まれる。

```
[PURPOSE]
Create a vocabulary comparison grid illustration for Japanese language learning materials.
The image shows {GRID_SIZE} related but distinct objects side by side.
Learners must instantly distinguish each object from the others.

[SUBJECT]
Grid layout: {GRID_SIZE} equal tiles in a {GRID_ARRANGEMENT} arrangement.
Each tile contains one object:
{TILE_DESCRIPTIONS}

Each object must display its distinctive visual signature clearly:
{TILE_SIGNATURES}

[SCENE & ACTION]
Each tile has an equal-sized soft cream off-white background cell (warm off-white, NOT pure stark white).
All objects rendered at the same canonical 3/4 view and same scale.
Thin dividing lines between tiles (deep slate navy, 1pt weight).
No labels, no numbers, no captions inside the image.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Uniform color palette across all tiles.
Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm colors as fills.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
All tiles must share identical illustration style — no tile should look more detailed than another.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "variant_grid"`
**Aspect ratio**: 1:1 または 16:9
**Rule references**: [PART 3.10 variant_grid](part3_vocab_type_rules.md#310-variant_grid-vocab_type--variant_grid), [PART 5.11 OBJECT_SIGNATURES](part5_vocab_reference_appendix.md#511-object_signatures)
**Placeholders**: `{GRID_SIZE}`, `{GRID_ARRANGEMENT}`, `{TILE_DESCRIPTIONS}`, `{TILE_SIGNATURES}`

---

## Template F: spatial_relation

> v2.3 新規。v2.4 修正：背景指示の矛盾を解消し「最小限の環境コンテキスト」に統一。
> 資料 12：位置名詞（上・下・前・後ろ・右・左・中）の最適提示法。

```
[PURPOSE]
Create a spatial relationship illustration for Japanese language learning materials.
The image must instantly and unambiguously show the positional relationship: [{TARGET_WORD_JP}] ({TARGET_WORD_EN}).
Example: 「箱の上に猫がいます。」

[SUBJECT]
Reference object (基準物 / landmark): {REFERENCE_OBJECT}
→ Render in neutral, desaturated color (cool gray tones). It is the anchor point.
Target object (ターゲット): {TARGET_OBJECT}
→ Render in a bold accent color (warm amber gold or symbol_red from educational_symbol_colors).
This strong color contrast immediately directs the learner's eye to the target.

[SCENE & ACTION]
Spatial relationship: The {TARGET_OBJECT} is positioned [{SPATIAL_POSITION}] the {REFERENCE_OBJECT}.
The positional relationship must be UNAMBIGUOUS. Exaggerate the position slightly if needed for clarity.

Camera setup:
{CAMERA_SETUP}

Layout guidance (v2.4 unified background rule):
- Use a MINIMAL ENVIRONMENTAL CONTEXT to convey real-world scale.
  This means ONE simple surface plane is required — e.g., a plain desk surface,
  a floor with subtle depth lines, or a flat tabletop. The surface should be drawn
  with thin deep slate navy outlines on a soft cream off-white background.
- DO NOT use a completely blank/empty white background — without any surface,
  the spatial relationship becomes abstract and learners lose the real-world anchor.
- DO NOT add room walls, furniture beyond the reference object, decorative items,
  or any clutter — keep the environmental context to a single surface only.
- The reference object fills 40-50% of the frame. The target object is clearly visible.
- Subtle grid lines or floor depth lines on the single surface plane are ENCOURAGED
  to reinforce spatial depth (optional but recommended for 上・下・前・後ろ).

Special rules:
- For 右（right）/ 左（left）: Use BACK-FACING VIEW.
  Draw the character from behind, so that the character's right = viewer's right.
  This eliminates the left-right reversal confusion of face-to-face illustrations.
- For 中（inside）: Use transparency — render the container walls as semi-transparent outlines
  so the interior target object is visible.
- For 前（front）/ 後ろ（behind）: Use FIRST-PERSON POV.
  No character drawn in the scene. The viewer IS the speaker looking at the scene.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines,
neutral gray for reference object, bold accent for target object.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols anywhere — Exception 1 applies.
Directional arrows are PERMITTED if they clarify the position — use ARROW_SEMIOTICS rules.
A single surface plane (desk/floor) IS REQUIRED — this is not a "background element" but
a necessary spatial anchor.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "spatial_relation"`
**Aspect ratio**: 1:1
**Rule references**: [PART 3.8 spatial_relation](part3_vocab_type_rules.md#38-spatial_relation-vocab_type--spatial_relation), [PART 3.11 ARROW_SEMIOTICS](part3_vocab_type_rules.md#311-arrow_semiotics-reference), [PART 5.12 SPATIAL_GRID_PATTERNS](part5_vocab_reference_appendix.md#512-spatial_grid_patterns)
**Placeholders**: `[{TARGET_WORD_JP}]`, `{TARGET_WORD_EN}`, `{REFERENCE_OBJECT}`, `{TARGET_OBJECT}`, `[{SPATIAL_POSITION}]`, `{CAMERA_SETUP}`

---

## Template G: demonstrative_kosoado

> v2.3 新規。v2.4 修正：`{MODEL_TYPE_BLOCK}` 1 つだけ展開する構造に変更。3 モデル定義は [PART 3.7](part3_vocab_type_rules.md#37-demonstrative_kosoado-vocab_type--demonstrative) DEMONSTRATIVE_MODELS に分離。

```
[PURPOSE]
Create a demonstrative pronoun illustration for Japanese language learning materials.
The image must instantly convey the spatial territory logic of [{TARGET_WORD_JP}] ({TARGET_WORD_EN}).

⚠ IMPORTANT — Choose ONLY ONE model type per image:
This template supports three mutually exclusive territory models
(FACE_TO_FACE / PARALLEL / PSYCHOLOGICAL_PULL).
Pick exactly ONE based on the lesson's teaching goal, then expand the
{MODEL_TYPE_BLOCK} placeholder below with the corresponding text from
PART 3.7 DEMONSTRATIVE_MODELS. Do NOT include multiple models in one prompt —
combining them confuses the image generator and produces incoherent layouts.

Target demonstrative: {KO_SO_A_TYPE}
Selected model: {MODEL_TYPE_NAME} (one of: face_to_face / parallel / psychological_pull)

[SUBJECT]
{SPEAKER_DESCRIPTION} is the speaker (話者).
{LISTENER_DESCRIPTION} is the listener (聞き手).
   (Omit listener if MODEL_TYPE_NAME == "parallel" with single speaker,
    or if first-person POV is used.)
Target object: {TARGET_OBJECT}

[SCENE & ACTION]
{MODEL_TYPE_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE of the three model description
     blocks from PART 3.7 DEMONSTRATIVE_MODELS. Do not paste more than one.

Camera: Eye-level, 50mm lens equivalent. Characters fill 60% of the frame.
Minimal background — a simple floor plane with subtle depth lines is recommended.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines,
muted warm blue for speaker territory,
warm amber gold for listener territory (also usable as accent in non-listener contexts).
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
Territory boundary lines and directional arrows ARE PERMITTED to clarify the こ/そ/あ zones.
No letters, numbers, or Japanese text inside the image (zone shapes and arrows only).
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "demonstrative"`
**Aspect ratio**: 1:1 または 16:9
**Rule references**: [PART 3.7 demonstrative_kosoado](part3_vocab_type_rules.md#37-demonstrative_kosoado-vocab_type--demonstrative)
**Placeholders**: `[{TARGET_WORD_JP}]`, `{TARGET_WORD_EN}`, `{KO_SO_A_TYPE}`, `{MODEL_TYPE_NAME}`, `{SPEAKER_DESCRIPTION}`, `{LISTENER_DESCRIPTION}`, `{TARGET_OBJECT}`, `{MODEL_TYPE_BLOCK}`

---

## Template H: action_verb

> v2.3 新規。v2.4：SEQUENCE_3PANEL 戦略を追加（3 フェーズ動詞用）。資料 10：動作は静止画において最も困難な表現。5 つの方法（MOTION_ARROW / OUTCOME / BEFORE_AFTER / SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES）から戦略選択。

```
[PURPOSE]
Create a vocabulary illustration for the Japanese action verb "[TARGET_WORD]" ({TARGET_WORD_EN}).
The image must convey the action itself — not just the actor standing still.
A learner must understand WHAT is being done, not just WHO is doing it.

[SUBJECT]
{CHARACTER_DESCRIPTION}
Action being performed: {ACTION_DESCRIPTION}

[SCENE & ACTION]
Visualization strategy: {VISUALIZATION_STRATEGY}
   (Choose EXACTLY ONE of: MOTION_ARROW / OUTCOME / BEFORE_AFTER /
    SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES.)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 3.4 ACTION_VERB_STRATEGIES corresponding to {VISUALIZATION_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Camera: Eye-level, 50mm lens equivalent. Character and action fill 70% of frame.
   (For SEQUENCE_3PANEL: each panel's character fills ~70% of that panel.)
Simple minimal background — enough context to ground the action, no clutter.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue,
warm amber gold for directional arrows and accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
Directional arrows and motion lines ARE PERMITTED — they are the primary motion indicators.
Panel divider lines ARE PERMITTED for BEFORE_AFTER and SEQUENCE_3PANEL strategies.
No text, no letters, no numbers inside the image.
No gradients, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "action_verb"`
**Aspect ratio**: 1:1 または 16:9
**Rule references**: [PART 3.4 action_verb](part3_vocab_type_rules.md#34-action_verb-vocab_type--action_verb), [PART 3.11 ARROW_SEMIOTICS](part3_vocab_type_rules.md#311-arrow_semiotics-reference)
**Placeholders**: `[TARGET_WORD]`, `{TARGET_WORD_EN}`, `{CHARACTER_DESCRIPTION}`, `{ACTION_DESCRIPTION}`, `{VISUALIZATION_STRATEGY}`, `{STRATEGY_BLOCK}`

---

## Template I: abstract_concept

> v2.3 新規。資料 10：TIAC（Text-to-Image for Abstract Concepts）3 層構造 — Intent / Object / Form。

```
[PURPOSE]
Create a vocabulary card illustration for the abstract Japanese concept "[TARGET_WORD]" ({TARGET_WORD_EN}).
The image must convey the MEANING and FEELING of this abstract word through symbolic visual metaphor.
There is no physical object to depict directly — use the metaphor defined below.

[SUBJECT]
Conceptual definition: {CONCEPT_DEFINITION}
Visual metaphor / symbolic object: {VISUAL_METAPHOR}
This metaphor is the concrete anchor that makes the abstract concept visible.
Render it clearly and centrally. Do not add competing visual elements.

[SCENE & ACTION]
Emotional tone: {EMOTIONAL_TONE}
Composition mood: {COMPOSITION_MOOD}
Color tone adjustment: {COLOR_TONE_ADJUSTMENT}
  (Example: warmth → add amber gold; coldness → cool slate blue tones)
The scene should feel {EMOTIONAL_TONE} — convey this through character posture,
spatial composition, and symbolic elements, NOT through facial expressions alone.

Camera: Centered, eye-level or slight elevation. Subject fills 70% of frame.
Background: minimal — large flat SOLID color fields only. NO gradients, NO shading of any kind, NO lighting effects (must remain completely flat solid fills, consistent with the STYLE RECIPE).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue,
warm amber gold for warmth and positivity accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image. Symbolic metaphor anchors (as defined in ABSTRACT_METAPHORS) ARE PERMITTED as part of the intended pedagogical metaphor.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "abstract_concept"`
**Aspect ratio**: 1:1
**Rule references**: [PART 3.6 abstract_concept](part3_vocab_type_rules.md#36-abstract_concept-vocab_type--abstract_concept), [PART 5.13 ABSTRACT_METAPHORS](part5_vocab_reference_appendix.md#513-abstract_metaphors)
**Placeholders**: `[TARGET_WORD]`, `{TARGET_WORD_EN}`, `{CONCEPT_DEFINITION}`, `{VISUAL_METAPHOR}`, `{EMOTIONAL_TONE}`, `{COMPOSITION_MOOD}`, `{COLOR_TONE_ADJUSTMENT}`

---

## Template J: vocabulary_adjective

> v2.4 新規。形容詞は単独の物体描画では意味が伝わりにくく対比 / 強調 / オーバーレイの 3 戦略を用意。

```
[PURPOSE]
Create a vocabulary card illustration for the Japanese adjective "[TARGET_WORD]" ({TARGET_WORD_EN}).
The image must instantly communicate the adjectival quality. Adjectives describe a property,
not an object, so a single isolated object is rarely sufficient — visual contrast or
symbolic emphasis is required.

[SUBJECT]
Adjective category: {ADJECTIVE_CATEGORY}
   (one of: size / quantity / state / appearance / quality / age / temperature / value)
Anchor object(s): {ANCHOR_OBJECTS}
   The concrete object(s) that carry the adjectival quality.
   For PAIR_CONTRAST: two instances of the same object class.
   For SINGLE_HIGHLIGHT or PROPERTY_OVERLAY: one object.

[SCENE & ACTION]
Visualization strategy: {ADJECTIVE_STRATEGY}
   (Choose EXACTLY ONE of: PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY.
    Default = "PAIR_CONTRAST".)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 3.5 ADJECTIVE_STRATEGIES corresponding to {ADJECTIVE_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Camera: Eye-level or canonical 3/4 view depending on the anchor object's nature.
Standard ~50mm-equivalent lens, no telephoto compression (Eye-level for human-scale items; canonical 3/4 for smaller objects).
Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional scene context.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines,
muted warm blue and warm amber gold as accents,
cool slate gray for contrasting/muted state.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
For PAIR_CONTRAST: a single thin vertical dividing line IS PERMITTED.
For SINGLE_HIGHLIGHT: small flat symbolic marks (sparkles, shine lines, worn marks)
ARE PERMITTED — limit to 3-5 marks, rendered as simple flat shapes, NOT as
photographic shine or lens flare.
For PROPERTY_OVERLAY: 3-5 schematic indicator marks (wavy lines, arrows, flake shapes)
ARE PERMITTED — flat symbolic style only.
No text, no letters, no numbers inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
```

**Used for**: `vocab_type = "adjective"`
**Aspect ratio**: 1:1
**Rule references**: [PART 3.5 adjective](part3_vocab_type_rules.md#35-adjective-vocab_type--adjective)
**Placeholders**: `[TARGET_WORD]`, `{TARGET_WORD_EN}`, `{ADJECTIVE_CATEGORY}`, `{ANCHOR_OBJECTS}`, `{ADJECTIVE_STRATEGY}`, `{STRATEGY_BLOCK}`

---

## PLACEHOLDER_ORIGINS Reference

> 各テンプレートの placeholder がどこから値を取るかの一覧（A-D カテゴリ別）。
> skill は placeholder ごとに対応するソースを Read / lookup して埋める。

### Category A — `data/lessons/lesson_NN.json` 直接フィールド

| placeholder | source | 例 |
|---|---|---|
| `[TARGET_WORD]` | `vocabulary[i].word` | `医者` |
| `{TARGET_WORD_EN}` | `vocabulary[i].en` | `doctor` |
| `[{TARGET_WORD_JP}]` | `vocabulary[i].word`（spatial / demonstrative） | `右` |
| `[{SENTENCE_JP}]` | `patterns[p].examples[e].jp` | `田中さんは医者です。` |
| `{SENTENCE_EN}` | `patterns[p].examples[e].en` | `Mr. Tanaka is a doctor.` |
| `[{BUILDING_TYPE}]` | `vocabulary[i].en` または catalog | `bank` |
| `{KO_SO_A_TYPE}` | `vocabulary[i].word` の prefix（こ/そ/あ） | `そ` |
| `{ADJECTIVE_CATEGORY}` | `vocabulary[i].category` または skill 推論 | `size` |

### Category B — Auxiliary dictionary lookups（[PART 5](part5_vocab_reference_appendix.md)）

| placeholder | source | reference |
|---|---|---|
| `{CHARACTER_DESCRIPTION}` | role / nationality lookup | [PART 5.1](part5_vocab_reference_appendix.md#51-person_role_lookup) / [5.2](part5_vocab_reference_appendix.md#52-person_nationality_hints) / [5.8](part5_vocab_reference_appendix.md#58-role_based_generic_profiles) |
| `{CHARACTER_POSE_AND_EXPRESSION}` | role-default | [PART 5.8](part5_vocab_reference_appendix.md#58-role_based_generic_profiles) |
| `[{BUILDING_DESCRIPTION_AND_SCALE}]` (v3.0 legacy) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) building_scale |
| `[{SIGNAGE_TEXT}]` (v3.0 legacy) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) signage_text |
| `[{PRIMARY_SCENE_CUE}]` (v3.0 legacy) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) primary_scene_cue |
| `{VOCAB_TYPE_DESC}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) vocab_type_desc |
| `{FORM_DESC}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) form_desc |
| `{SIGNATURE}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) signature |
| `{ACCENT}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) accent |
| `{ACCENT_TARGETS}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) accent_targets |
| `{LABEL}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) label |
| `{SIGNBOARD_LOCATION}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) signboard_location |
| `{SIGNBOARD_LOC_SHORT}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) signboard_location_short |
| `{SURROUNDINGS_BLOCK}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) surroundings_block |
| `{FRAMING_EXTRA}` (v4.0.4 / optional) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) framing_extra |
| `{ACTIVITIES_BLOCK}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) activities_block |
| `{LANDSCAPING_BLOCK}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) landscaping_block |
| `{REF2_DESC}`, `{REF3_DESC}`, `{REF4_DESC}` (v4.0.4) | building lookup | [PART 5.10](part5_vocab_reference_appendix.md#510-building_cues) type_relevant_refs |
| `{REF1_DESC}`, `{REF5_DESC}` (v4.0.4) | constant | [PART 1.12](part1_universal_rules.md#part-112-building_reference_attachment_rule) rule_a (BRAND_VOICE_REF / ARCHITECTURAL_REF) |
| `{BUILDING_UNIVERSAL_RULE}` (v4.0.4) | universal rule inline | [PART 1.13](part1_universal_rules.md#part-113-building_universal_rule_v4_0_4) A-1〜A-11 full text |
| `{BG_EXACT}` (v4.0.4) | constant | [PART 6.5](part6_output_instructions.md#65-preflight-invariants-mechanical-gates) BG_EXACT_CREAM |
| `{OBJECT_DESCRIPTION}`, `{VISUAL_SIGNATURE}`, `{MATERIAL_TEXTURE_HINT}` | object lookup | [PART 5.11](part5_vocab_reference_appendix.md#511-object_signatures) |
| `{CONCEPT_DEFINITION}`, `{VISUAL_METAPHOR}`, `{EMOTIONAL_TONE}`, `{COMPOSITION_MOOD}`, `{COLOR_TONE_ADJUSTMENT}` | abstract lookup | [PART 5.13](part5_vocab_reference_appendix.md#513-abstract_metaphors) |
| `{CAMERA_SETUP}`, `[{SPATIAL_POSITION}]` | spatial grid pattern | [PART 5.12](part5_vocab_reference_appendix.md#512-spatial_grid_patterns) |
| `{NATIONALITY_EXCEPTION_BLOCK}` | role or nationality dispatch | [PART 6.4](part6_output_instructions.md#64-injected-constraint-blocks) |

### Category C — Strategy blocks（[PART 3](part3_vocab_type_rules.md)）

| placeholder | source |
|---|---|
| `{STRATEGY_BLOCK}` (D) | [PART 3.3 OBJECT_STRATEGIES](part3_vocab_type_rules.md#33-object_concrete-vocab_type--concrete_object) |
| `{STRATEGY_BLOCK}` (H) | [PART 3.4 ACTION_VERB_STRATEGIES](part3_vocab_type_rules.md#34-action_verb-vocab_type--action_verb) |
| `{STRATEGY_BLOCK}` (J) | [PART 3.5 ADJECTIVE_STRATEGIES](part3_vocab_type_rules.md#35-adjective-vocab_type--adjective) |
| `{MODEL_TYPE_BLOCK}` (G) | [PART 3.7 DEMONSTRATIVE_MODELS](part3_vocab_type_rules.md#37-demonstrative_kosoado-vocab_type--demonstrative) |

### Category D — Composition variables / Other

| placeholder | source |
|---|---|
| `{SCENE_DESCRIPTION}`, `{COMPOSITION_NOTES}` (C) | skill が文脈を読んで作成 |
| `{VISUAL_SYMBOL_IF_NEEDED}` (C) | [PART 5.14 VISUAL_SYMBOLS](part5_vocab_reference_appendix.md#514-visual_symbols) を skill が選択 |
| `{DISPLAY_STRATEGY}` (D) | skill が word から判定（OBJECT_ALONE / HAND_HOLDING） |
| `{VISUALIZATION_STRATEGY}` (H) | skill が verb から判定（5 戦略のいずれか） |
| `{ADJECTIVE_STRATEGY}` (J) | skill が形容詞 + category から判定（3 戦略のいずれか） |
| `{MODEL_TYPE_NAME}` (G) | skill が文脈から選定（face_to_face / parallel / psychological_pull） |
| `{REFERENCE_OBJECT}`, `{TARGET_OBJECT}` (F) | lesson context + skill |
| `{SPEAKER_DESCRIPTION}`, `{LISTENER_DESCRIPTION}` (G) | lesson context + [PART 5.9 NAMED_CHARACTER_PROFILES](part5_vocab_reference_appendix.md#59-named_character_profiles) |
| `{ACTION_DESCRIPTION}` (H) | skill が verb の semantics から作成 |
| `{ANCHOR_OBJECTS}` (J) | skill が形容詞から提案 |
| `{GRID_SIZE}`, `{GRID_ARRANGEMENT}`, `{TILE_DESCRIPTIONS}`, `{TILE_SIGNATURES}` (E) | lesson context |
| `{SIGNAGE_EXCEPTION_IF_ANY}` (D) | object lookup に signage がある場合のみ |
