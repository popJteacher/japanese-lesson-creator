// X-c-7 Phase C — 残 NG 3 件 (005 / 012 / 013) v4.0.8 prompt
// PoC 4 件 (004/010/011/016) validated を踏まえて二次適用
// pole 緩和 wording: "optionally with or without a thin staff" (004 で pole 付きが pedagogy 的に許容のため)

import { readFileSync, writeFileSync } from 'node:fs';

const JSON_PATH = 'data/image_prompts_skill.json';

const STRICT_LAYOUT = `[STRICT LAYOUT DIRECTIVE]
ASPECT RATIO: MUST be 16:9 widescreen landscape (horizontal orientation).
DO NOT crop into a square 1:1 frame, NOT 4:3 landscape, NOT 3:4 vertical,
NOT 9:16 portrait. To enforce the 16:9 layout, the scene's background
elements MUST extend horizontally from the left edge to the right edge of
the frame — see the [SCENE & ACTION] block below for the specific
horizontal anchor (whiteboard / wide desk / institution interior / 2-panel
vertical divider). nanobanana defaults to 1:1; this directive is the
primary counterweight.`;

const UNIVERSAL_RULES = `FACIAL FEATURES RULE (v4.0 PART 1.8): Every character figure in the image
MUST clearly show all four primary facial features — eyes (with visible
pupils, not blank circles), eyebrows, nose, and mouth — drawn in flat
illustration style. NEVER omit any of these four features.
HEAD-BODY PROPORTION RULE (v4.0 PART 1.10): Every adult character figure
MUST be rendered with approximately 7-head-height proportion. NEVER render
adult roles with shorter 5-6 head proportions — that reads as childlike or
cartoonish. Working-age adults (20s-50s) must read as such by body
proportion alone.
FOOTWEAR RULE (v3.11 / preserved in v4.0): Every character figure MUST
visibly wear footwear on both feet (loafers / sneakers / etc.) whenever
both feet are inside the frame. Barefoot is NOT permitted.`;

const COMPOSITION = `Composition: Wide 16:9 shot, 50mm standard lens equivalent (natural
perspective). Characters occupy 60% of the frame. Eye-level view. Background
base: soft cream off-white background (warm off-white, NOT pure stark white).
Main characters are clearly separated from the background in visual contrast.`;

const STYLE_RECIPE = `[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with
consistent line weight. Completely flat solid color fills only. Color
palette: soft cream off-white background (warm off-white, NOT pure stark
white), deep slate navy outlines, muted warm colors, warm amber gold
accents for emphasis. This should look like it belongs in a brand style
guide, not like AI art. Keep line weights consistent.`;

const HORROR_VACUI_DEFENSE = `EXTERIOR BUILDING SIGNAGE RULE: Any background buildings, walls, windows, or
surfaces MUST be left featureless — no signboard text, no English labels, no
Japanese kanji or kana, no street numbers, no logos. nanobanana frequently
invents text on building surfaces; this is PROHIBITED.
HORROR VACUI DEFENSE (§3.9.7): All flat surfaces (whiteboards, screens, paper,
walls, monitors, badges, desks) MUST be rendered as solid, unbroken fields of
flat color. Scene-essential props are positively enumerated in the [SCENE &
ACTION] block; any flat surface NOT enumerated MUST be featureless.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.`;

const FLAG_BAN_GLOBAL = `The clothing, accessories, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, country indicator, political symbol, or flag-print on garments. Nationality is conveyed by phenotype and subtle outfit palette tendency only — no flag display in example-sentence illustrations.`;

const FLAG_BAN_OVERRIDE = `The clothing, accessories, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, country indicator, political symbol, or flag-print on garments, UNLESS explicitly directed in the [SCENE & ACTION] block to hold a specific national flag as a diegetic hand-held prop for an identity-only nationality sentence (per §3.9.2 5a v4.0.8 / §3.9.8.A).`;

// ============================================================
// ex_L01_005 — リンさんは中国人です。 (§3.9.2 5a + 中国国旗)
// 中国国旗: red rectangular field, upper-left に 1 large yellow 5-point star
// + その右に 4 smaller yellow 5-point stars in arc pattern
// styleReferences = ["data/images/char_リン.png"]
// ============================================================
const PROMPT_005 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
リンさんは中国人です。 (Lin-san is Chinese.)
The viewer must instantly read the sentence's grammatical core from the
visualized action — specifically, that the named character's NATIONALITY is
Chinese — communicated via the explicit hand-held Chinese national flag prop.

${STRICT_LAYOUT}

[REFERENCE]
Attached reference images per PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE:
image_1 = canonical portrait of the Chinese female university student (リンさん, per PART 5.9 NAMED_CHARACTER_PROFILES). Character identity MUST be derived EXCLUSIVELY from this attached image — render the exact face, hair, build, and phenotype shown in the reference. Default outfit (per portrait): FACE STRUCTURE, HAIR (long straight dark, past shoulders), OUTFIT (muted-blue top + blue jeans + canvas backpack on both shoulders), 7-head ADULT BUILD, and East Asian phenotype. If this scene requires a different outfit, preserve FACE STRUCTURE, HAIR, BUILD, and PHENOTYPE while replacing ONLY the outfit.

[SUBJECT]
Character in scene: the Chinese female university student (リンさん, in her early 20s, per attached portrait image_1). Character identity MUST be derived EXCLUSIVELY from the attached image. DO NOT redescribe hair color, eye shape, face contour, or the portrait's default outfit in this block.

${UNIVERSAL_RULES}

[SCENE & ACTION]
An indoor scene set inside a bright, minimalist university lecture hall context. The Chinese female university student (リンさん, per attached portrait) is positioned at the right-center of the frame.

§3.9.2 5a v4.0.8 NATIONALITY FLAG PROP: The subject MUST hold a small Chinese national flag prop in ONE hand at chest level, with the flag panel facing squarely toward the viewer, optionally with or without a thin staff. The flag MUST occupy 12-15% of the image fill. The flag MUST be rendered as a horizontal rectangular fabric panel with a SOLID RED background field, displaying ONE large yellow five-pointed star in the upper-left quadrant accompanied by FOUR smaller yellow five-pointed stars arranged in a small arc immediately to the right of the large star. Zero text, letters, or numbers on the flag itself. The subject's other hand executes a dynamic, mid-conversation social gesture — body angled in a 3/4 posture, extending the free arm in an open-palm introductory motion toward the viewer. They maintain engaged, direct eye contact, anchoring their nationality identity through the explicit Chinese flag prop combined with active social presence. The framing brings the character somewhat closer to the camera than ex_L01_002 so that her East Asian facial features, student silhouette, and the Chinese flag panel all read clearly.

The hand-held Chinese flag is a diegetic 3D physical prop placed within the scene space and does NOT count toward 2D UI overlay SYMBOL_COUNT limits.

A long, continuous horizontal row of wooden lecture-hall desk surfaces extending edge-to-edge. The seating area MUST be completely unpopulated, showing only bare chairs and bare desk surfaces with zero human figures, silhouettes, or personal items. The interior lecture-hall wall behind the desks MUST be a completely featureless, uninterrupted expanse of solid flat color. To enforce the 16:9 widescreen layout, the specified horizontal background anchor MUST physically intersect and bleed off both the extreme left and extreme right edges of the frame.

The scene above is built to satisfy PART 3.9 v4.0.8 (§3.9.1 edge-bleed / §3.9.2 5a v4.0.8 nationality flag prop required / §3.9.4 2D UI overlay / §3.9.6 particle visual mapping は = topic foreground anchor / §3.9.7 featureless surfaces). All Forbidden phrases ("Standing in front of", "Looking at the viewer" outside active gesture, "blank"/"empty"/"clean", "hovers"/"floating") are absent from this scene.

No 2D UI overlay symbol is used in this scene. The Chinese flag is a 3D diegetic prop and is exempt from the 2D UI symbol count.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
ABSOLUTELY NO floating 2D UI overlay symbols of any kind — no question marks, no checkmarks, no X marks, no arrows, no circles, no geometric shapes encircling characters, no callout balloons.
${FLAG_BAN_OVERRIDE} For ex_L01_005, the hand-held Chinese flag prop directed in the [SCENE & ACTION] block IS the §3.9.2 5a v4.0.8 directed exception and MUST be rendered.
${HORROR_VACUI_DEFENSE}`;

// ============================================================
// ex_L01_012 — 韓国人ですか。 (§3.9.8.C Route 2: archetype + 韓国国旗 + ? overlay)
// 韓国国旗 (太極旗): white field, center taegeuk (red top + blue bottom semicircle),
// 4 corners 4 trigrams (☰ ☷ ☵ ☲)
// styleReferences = [] (Route 2)
// ============================================================
const PROMPT_012 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
韓国人ですか。 (Are you Korean?)
The sentence is a class-attribute yes-no question (Route 2 per §3.9.8.C) about NATIONALITY. The viewer must instantly read it as asking about a GENERIC Korean nationality archetype — NOT about a specific named character. The explicit Korean flag prop communicates "is this person Korean?".

${STRICT_LAYOUT}

[SUBJECT]
§3.9.8.C Route 2 (Class Attribute) — Archetype shift: This sentence asks about a NATIONALITY attribute (\`韓国人\`), not about a specific named person. Therefore NO NAMED_CHARACTER portrait is attached.

Establish a SINGLE, highly specific generic Korean adult archetype: a generic Korean adult in their 20s to 30s, East Asian phenotype with fair-to-light-medium skin, short neat dark hair parted to one side, wearing simple modern daily casual wear (a plain muted-blue crewneck sweater over a white collared shirt, dark slim trousers, plain dark leather shoes on both feet), 7-head adult proportion.

§3.9.8.A diegetic prop (mandatory for nationality archetype — Korean): The archetype MUST hold a small South Korean national flag prop (the Taegukgi) in ONE hand at chest level, with the flag panel facing squarely toward the viewer, optionally with or without a thin staff. The flag MUST occupy 10-15% of the image fill. The flag MUST be rendered as a horizontal rectangular fabric panel with a SOLID WHITE background field, displaying a CENTERED CIRCULAR TAEGEUK symbol composed of two interlocked comma-shaped halves — the upper half is solid RED and the lower half is solid BLUE. In each of the FOUR corners of the flag, render one solid BLACK trigram (three short parallel lines or broken-line patterns, distinct between corners). Zero text, letters, or numbers on the flag itself.

The character holds the flag in one hand and stands in a neutral upright posture, body angled slightly toward an off-frame asker. Expression: a calm, mildly inquisitive closed-mouth smile. The character does NOT look at, point to, or react to any overlaid symbol.

These props are diegetic 3D physical objects and DO NOT count toward 2D UI overlay SYMBOL_COUNT limits.

${UNIVERSAL_RULES}

[SCENE & ACTION]
A simple, neutral interior space — flat-color cream wall behind the character, a thin floor baseline at the bottom of the frame, no role-specific furniture (no whiteboard, no podium, no desk, no office cubicle) so that the character's nationality (conveyed by the Korean flag prop) reads as the dominant identity cue. The generic Korean adult archetype (defined in [SUBJECT]) is positioned at the right-center of the frame, holding the South Korean flag described above in one hand at chest level.

A wide horizontally-stretching neutral wall plane behind the character, rendered as a single uninterrupted geometric block of solid flat color. To enforce the 16:9 widescreen layout, this wall plane MUST physically intersect and bleed off both the extreme left and extreme right edges of the frame.

A single large flat-vector question mark in muted symbolic red is placed in the LEFT-CENTER region of the frame as a 2D UI graphic mark. Render the symbol as a pure 2D graphic UI overlay composited flat against the picture plane. It MUST have zero depth, cast zero shadows, and exist completely outside the 3D diegetic scene space. The archetype MUST NOT interact with, look at, point to, or react to this overlay. Exactly ONE question mark in the entire frame — no other 2D UI symbols.

The scene above is built to satisfy PART 3.9 v4.0.8 (§3.9.1 edge-bleed / §3.9.2 5a v4.0.8 nationality flag prop required / §3.9.4 2D UI overlay / §3.9.6 particle visual mapping / §3.9.7 featureless surfaces / §3.9.8.A Korean nationality archetype prop / §3.9.8.C Route 2 class-attribute archetype shift). All Forbidden phrases ("Standing in front of", "Looking at the viewer" outside active gesture, "blank"/"empty"/"clean", "hovers"/"floating") are absent from this scene.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
VISUAL_SYMBOLS entries (question mark) ARE PERMITTED — but ONLY exactly ONE question mark specified in [SCENE & ACTION] above, rendered as a flat 2D UI overlay per §3.9.4. nanobanana MUST NEVER add any additional floating 2D UI symbols, arrows, circles, or geometric shapes encircling the character or the scene. The Korean flag held by the archetype is a diegetic 3D prop and is EXEMPT from this 2D UI symbol limit.
${FLAG_BAN_OVERRIDE} For ex_L01_012, the hand-held South Korean flag prop directed in the [SCENE & ACTION] block IS the §3.9.2 5a v4.0.8 / §3.9.8.A directed exception and MUST be rendered.
${HORROR_VACUI_DEFENSE}`;

// ============================================================
// ex_L01_013 — はい、韓国人です。／いいえ、韓国人じゃありません。
// 2-panel B-archetype (§3.9.8.B + §3.9.8.A Korean nationality cue)
// styleReferences = []
// ============================================================
const PROMPT_013 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
はい、韓国人です。／いいえ、韓国人じゃありません。 (Yes, I am Korean. / No, I am not Korean.)
This is a 2-panel class-attribute yes/no answer pair about NATIONALITY (§3.9.8.C Route 2 → §3.9.8.B B-archetype path with §3.9.8.A Korean flag prop).

${STRICT_LAYOUT}

[SUBJECT]
§3.9.8.B B-archetype (no NAMED_CHARACTER attached): Establish a SINGLE, highly specific generic Korean adult archetype for this scene: a generic Korean adult in their 20s to 30s, East Asian phenotype with fair-to-light-medium skin, short neat dark hair parted to one side, wearing simple modern daily casual wear (a plain muted-blue crewneck sweater over a white collared shirt, dark slim trousers, plain dark leather shoes on both feet), 7-head adult proportion.

§3.9.8.A diegetic prop (mandatory for Korean nationality archetype): The archetype MUST hold a small South Korean national flag prop (the Taegukgi) in ONE hand at chest level, with the flag panel facing squarely toward the viewer, optionally with or without a thin staff. The flag MUST occupy 10-15% of the image fill in each panel. The flag MUST be rendered as a horizontal rectangular fabric panel with a SOLID WHITE background field, displaying a CENTERED CIRCULAR TAEGEUK symbol composed of two interlocked comma-shaped halves — the upper half is solid RED and the lower half is solid BLUE. In each of the FOUR corners of the flag, render one solid BLACK trigram (three short parallel lines). Zero text, letters, or numbers on the flag itself.

This precise visual configuration including the diegetic Korean flag prop is the strict master template. The model MUST internally lock this exact design — including the Korean flag in the same hand at the same position — before rendering the panels. Both panels MUST display the identical flag prop configuration.

These props are diegetic 3D physical objects and DO NOT count toward 2D UI overlay SYMBOL_COUNT limits.

${UNIVERSAL_RULES}

[SCENE & ACTION]
LAYOUT OVERRIDE: The 16:9 frame MUST be split exactly down the middle by a thick, solid vertical divider line extending entirely from the top edge to the bottom edge, creating two strictly equal, isolated rectangular panels (LEFT PANEL and RIGHT PANEL).

LEFT PANEL (Affirmation — "Yes, I am Korean"): Render the master Korean archetype template inside the left half, holding the South Korean flag in the right hand at chest level. The character exhibits a bright, affirming open-mouth smile and slightly raises the flag in a confident "yes" posture. A pure 2D graphic UI overlay of a single green checkmark is composited flat against the picture plane in the left-center of this panel.

RIGHT PANEL (Negation — "No, I am not Korean"): EXACT CLONE of the left panel — render a 1:1 visual clone of the left-panel character inside the right half, including the IDENTICAL South Korean flag in the SAME hand at the SAME chest-level position. The ONLY permitted differences are the facial expression (closed eyes or downturned mouth, negating) and the free-hand gesture (the non-flag hand crossed in front of the chest forming an 'X' with the flag-holding arm — the flag itself remains visible and identical). The face structure, hair strands, outfit folds, body proportions, AND the South Korean flag prop configuration MUST be mathematically identical to the left panel. Zero identity drift is permitted between the two panels.

A pure 2D graphic UI overlay of a single red X-mark is composited flat against the picture plane in the right-center of this panel.

SYMBOL COUNT STRICT ENFORCEMENT: There MUST be exactly TWO 2D UI overlay symbols in the entire output image — exactly ONE green checkmark (left panel) and exactly ONE red X-mark (right panel). DO NOT render any other 2D UI symbols, floating shapes, UI elements, or background text. The South Korean flag held by the archetype in both panels is a diegetic 3D prop and is EXEMPT from this 2D UI symbol count.

This [SCENE & ACTION] block is a verbatim §3.9.8 B two-panel pattern with §3.9.8.A Korean nationality archetype prop injection per PART 3.9 v4.0.8 (no NAMED_CHARACTER attached). Both panels MUST be 1:1 visual clones including the diegetic Korean flag prop, differing only in expression and the free-hand gesture.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
VISUAL_SYMBOLS entries are PERMITTED per §3.9.8 — but ONLY exactly TWO 2D UI overlay symbols total (one green checkmark in the LEFT PANEL, one red X-mark in the RIGHT PANEL), each rendered as a flat 2D UI overlay per §3.9.4. nanobanana MUST NEVER add any additional floating 2D UI symbols, arrows, circles, or geometric shapes. The South Korean flag held by the archetype in both panels is a diegetic 3D prop and is EXEMPT from this 2D UI symbol limit.
${FLAG_BAN_OVERRIDE} For ex_L01_013, the hand-held South Korean flag prop directed in the [SCENE & ACTION] block IS the §3.9.2 5a v4.0.8 / §3.9.8.A directed exception and MUST be rendered in BOTH panels.
${HORROR_VACUI_DEFENSE}`;

// ============================================================
const json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

const patches = [
  { id: 'ex_L01_005', prompt: PROMPT_005, styleRefs: ['data/images/char_リン.png'] },
  { id: 'ex_L01_012', prompt: PROMPT_012, styleRefs: [] }, // Route 2
  { id: 'ex_L01_013', prompt: PROMPT_013, styleRefs: [] },
];

for (const p of patches) {
  const e = json.vocabulary.find((x) => x.imageId === p.id);
  if (!e) { console.error(`MISSING entry: ${p.id}`); process.exit(1); }
  e.prompt = p.prompt;
  e.styleReferences = p.styleRefs;
  e._meta = e._meta || {};
  e._meta.guideVersion = 'v4.0.8';
  e._meta.updatedAt = new Date().toISOString();
  console.log(`  ✓ patched ${p.id} (prompt ${p.prompt.length}B / styleRefs ${p.styleRefs.length})`);
}

json._meta.lastPatchedFor = 'X-c-7 PoC round 2 (005/012/013)';
json._meta.lastPatchedAt = new Date().toISOString();

writeFileSync(JSON_PATH, JSON.stringify(json, null, 2) + '\n');
console.log(`\nDone. Updated 3 entries.`);
