// X-c-7 Phase B PoC — v4.0.8 prompt 書き換え 4 件 (004 / 010 / 011 / 016)
// universal rule: prompts/guide/part3_vocab_type_rules.md §3.9 v4.0.8
// guideManifestHash: a99d6c962a96
//
// 設計方針: image_prompts_skill.json の該当 entry の prompt field を v4.0.8 verbatim phrase で
// 上書き。styleReferences も Route 2 (010) で空配列に変更。
//
// Usage: node scripts/_xc_l_ex_L01_prompts_v4.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const JSON_PATH = 'data/image_prompts_skill.json';

// ============================================================
// v4.0.8 共通 wording
// ============================================================
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

// v4.0.8 — [CONSTRAINTS] 内の flag 行 2 形式
const FLAG_BAN_GLOBAL = `The clothing, accessories, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, country indicator, political symbol, or flag-print on garments. Nationality is conveyed by phenotype and subtle outfit palette tendency only — no flag display in example-sentence illustrations.`;

const FLAG_BAN_OVERRIDE = `The clothing, accessories, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, country indicator, political symbol, or flag-print on garments, UNLESS explicitly directed in the [SCENE & ACTION] block to hold a specific national flag as a diegetic hand-held prop for an identity-only nationality sentence (per §3.9.2 5a v4.0.8 / §3.9.8.A).`;

// ============================================================
// ex_L01_004 — 鈴木さんは日本人です (§3.9.2 5a + Japanese flag prop)
// ============================================================
const PROMPT_004 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
鈴木さんは日本人です。 (Suzuki-san is Japanese.)
The viewer must instantly read the sentence's grammatical core from the
visualized action — specifically, that the named character's NATIONALITY is
Japanese — communicated via the explicit hand-held national flag prop.

${STRICT_LAYOUT}

[REFERENCE]
Attached reference images per PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE:
image_1 = canonical portrait of the Japanese male language teacher (鈴木さん, per PART 5.9 NAMED_CHARACTER_PROFILES). Character identity MUST be derived EXCLUSIVELY from this attached image — render the exact face, hair, build, and phenotype shown in the reference. Default outfit (per portrait): FACE STRUCTURE, HAIR (salt-and-pepper short), OUTFIT (navy/charcoal suit + white shirt + slate-gray tie + ID lanyard), 7-head ADULT BUILD, and East Asian phenotype. If this scene requires a different outfit, preserve FACE STRUCTURE, HAIR, BUILD, and PHENOTYPE while replacing ONLY the outfit.

[SUBJECT]
Character in scene: the Japanese male language teacher (鈴木さん, in his 40s to 50s, per attached portrait image_1). Character identity MUST be derived EXCLUSIVELY from the attached image. DO NOT redescribe hair color, eye shape, face contour, or the portrait's default outfit in this block.

${UNIVERSAL_RULES}

[SCENE & ACTION]
An indoor scene set inside a bright, minimalist Japanese classroom. The Japanese male language teacher (鈴木さん, per attached portrait) is positioned at the right-center of the frame.

§3.9.2 5a v4.0.8 NATIONALITY FLAG PROP: The subject MUST hold a small Japanese national flag prop (a horizontal white rectangular fabric panel with a single solid red sun disc centered on it) in ONE hand at chest level, with the flag panel facing squarely toward the viewer. The flag MUST occupy 12-15% of the image fill, rendered as a flat solid-color fabric panel with no pole or staff and zero text, letters, or numbers on its surface. The subject's other hand executes a dynamic, mid-conversation social gesture — body angled in a 3/4 posture, extending the free arm in an open-palm introductory motion toward the viewer. They maintain engaged, direct eye contact, anchoring their nationality identity through the explicit Japanese flag prop combined with active social presence. The framing brings the character somewhat closer to the camera than ex_L01_001 so that his East Asian facial features, his Japanese-male teacher silhouette, and the Japanese flag panel all read clearly.

The hand-held Japanese flag is a diegetic 3D physical prop placed within the scene space and does NOT count toward 2D UI overlay SYMBOL_COUNT limits.

A wide featureless whiteboard spanning the left half of the frame, rendered as a single, uninterrupted geometric block of solid flat white color. It MUST be absolutely devoid of any marker lines, scribbles, text, or pseudo-kanji. To enforce the 16:9 widescreen layout, the specified horizontal background anchor MUST physically intersect and bleed off both the extreme left and extreme right edges of the frame.

The scene above is built to satisfy PART 3.9 v4.0.8 (§3.9.1 edge-bleed / §3.9.2 5a v4.0.8 nationality flag prop required / §3.9.4 2D UI overlay / §3.9.6 particle visual mapping は = topic foreground anchor / §3.9.7 featureless surfaces). All Forbidden phrases ("Standing in front of", "Looking at the viewer" outside active gesture, "blank"/"empty"/"clean", "hovers"/"floating") are absent from this scene.

No 2D UI overlay symbol (question mark / checkmark / X / arrow) is used in this scene. The Japanese flag is a 3D diegetic prop and is exempt from the 2D UI symbol count.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
ABSOLUTELY NO floating 2D UI overlay symbols of any kind — no question marks, no checkmarks, no X marks, no arrows, no circles, no geometric shapes encircling characters, no callout balloons. The scene must communicate without any 2D overlay.
${FLAG_BAN_OVERRIDE} For ex_L01_004, the hand-held Japanese flag prop directed in the [SCENE & ACTION] block IS the §3.9.2 5a v4.0.8 directed exception and MUST be rendered.
${HORROR_VACUI_DEFENSE}`;

// ============================================================
// ex_L01_010 — 先生ですか (§3.9.8.C Route 2: archetype + ? overlay)
// styleReferences = [] (NAMED_CHARACTER portrait NOT attached per Route 2)
// ============================================================
const PROMPT_010 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
先生ですか。 (Are you a teacher?)
The sentence is a class-attribute yes-no question (Route 2 per §3.9.8.C). The
viewer must instantly read it as asking about a GENERIC teacher archetype — NOT
about a specific named character.

${STRICT_LAYOUT}

[SUBJECT]
§3.9.8.C Route 2 (Class Attribute) — Archetype shift: This sentence asks about an OCCUPATION attribute (\`先生\`), not about a specific named person. Therefore NO NAMED_CHARACTER portrait is attached.

Establish a SINGLE, highly specific generic teacher archetype: a generic Japanese-context language teacher in their 30s to 40s, East Asian phenotype with fair-to-light-medium skin, dark short hair neatly combed and parted to one side, wearing a conservative navy business suit jacket and matching trousers with a crisp plain white dress shirt and a subtle solid slate-gray necktie, plain dark leather loafers on both feet, 7-head adult proportion. The archetype MUST hold the §3.9.8.A diegetic prop combination: one piece of chalk in the writing hand AND a small textbook (rendered per §3.9.7 7d as a solid flat-color block with completely featureless cover and spine — zero text, zero pseudo-kanji) clasped against the chest with the non-writing arm. This precise visual configuration including the diegetic chalk-and-textbook prop combination is the strict master design. The model MUST internally lock this exact design before rendering. These props are diegetic 3D physical objects and do NOT count toward 2D UI overlay SYMBOL_COUNT limits.

${UNIVERSAL_RULES}

[SCENE & ACTION]
An indoor scene set inside a bright, minimalist Japanese classroom. The generic teacher archetype (defined in [SUBJECT]) is positioned at the right-center of the frame, captured mid-lesson behind a simple wooden teacher's podium. The teacher's writing hand grips a single piece of chalk poised in a writing gesture toward a wide flat whiteboard; the other arm holds the featureless solid-color textbook against the chest. The body is angled slightly toward an off-frame asker, expression a calm engaged closed-mouth smile. The teacher does NOT look at, point to, or react to any overlaid symbol.

A wide featureless whiteboard spanning the left half of the frame, rendered as a single, uninterrupted geometric block of solid flat white color. It MUST be absolutely devoid of any marker lines, scribbles, text, or pseudo-kanji. The interior classroom wall behind it MUST be a completely featureless, uninterrupted expanse of solid flat color. It MUST be absolutely devoid of posters, framed pictures, clocks, light switches, baseboards, or any architectural detailing. To enforce the 16:9 widescreen layout, the specified horizontal background anchor MUST physically intersect and bleed off both the extreme left and extreme right edges of the frame.

A single large flat-vector question mark in muted symbolic red is placed in the LEFT-CENTER region of the frame as a 2D UI graphic mark. Render the symbol as a pure 2D graphic UI overlay composited flat against the picture plane. It MUST have zero depth, cast zero shadows, and exist completely outside the 3D diegetic scene space. The teacher archetype MUST NOT interact with, look at, point to, or react to this overlay. Exactly ONE question mark in the entire frame — no other 2D UI symbols.

The scene above is built to satisfy PART 3.9 v4.0.8 (§3.9.1 edge-bleed / §3.9.2 object-manipulation via chalk + textbook / §3.9.4 2D UI overlay / §3.9.6 particle visual mapping / §3.9.7 featureless surfaces / §3.9.8.A teacher archetype prop / §3.9.8.C Route 2 class-attribute archetype shift). All Forbidden phrases ("Standing in front of", "Looking at the viewer" outside active gesture, "blank"/"empty"/"clean", "hovers"/"floating") are absent from this scene.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
VISUAL_SYMBOLS entries (question mark) ARE PERMITTED — but ONLY exactly ONE question mark specified in [SCENE & ACTION] above, rendered as a flat 2D UI overlay per §3.9.4. nanobanana MUST NEVER add any additional floating 2D UI symbols, arrows, circles, or geometric shapes encircling the character or the scene. The chalk and textbook held by the archetype are diegetic 3D props and are EXEMPT from this 2D UI symbol limit.
${FLAG_BAN_GLOBAL}
${HORROR_VACUI_DEFENSE}`;

// ============================================================
// ex_L01_011 — はい、先生です。／いいえ、先生じゃありません。
// 2-panel B-archetype (§3.9.8.B + §3.9.8.A teacher cue)
// styleReferences = [] (already empty in v3)
// ============================================================
const PROMPT_011 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
はい、先生です。／いいえ、先生じゃありません。 (Yes, I am a teacher. / No, I am not a teacher.)
This is a 2-panel class-attribute yes/no answer pair (§3.9.8.C Route 2 → §3.9.8.B B-archetype path with §3.9.8.A diegetic prop).

${STRICT_LAYOUT}

[SUBJECT]
§3.9.8.B B-archetype (no NAMED_CHARACTER attached): Establish a SINGLE, highly specific generic teacher archetype for this scene: a generic Japanese-context language teacher in their 30s to 40s, East Asian phenotype with fair-to-light-medium skin, dark short hair neatly combed and parted to one side, wearing a conservative navy business suit jacket and matching trousers with a crisp plain white dress shirt and a subtle solid slate-gray necktie, plain dark leather loafers on both feet, 7-head adult proportion.

§3.9.8.A diegetic prop (mandatory for teacher archetype): The archetype MUST hold one piece of chalk in the writing hand AND a small textbook (rendered per §3.9.7 7d as a solid flat-color block with completely featureless cover and spine — zero text, zero pseudo-kanji) clasped against the chest with the non-writing arm. This precise visual configuration including the diegetic chalk-and-textbook prop combination is the strict master template. The model MUST internally lock this exact design — including the §3.9.8.A diegetic chalk and textbook — before rendering the panels. Both panels MUST display the identical prop configuration.

These props (chalk, textbook) are diegetic 3D physical objects and DO NOT count toward 2D UI overlay SYMBOL_COUNT limits.

${UNIVERSAL_RULES}

[SCENE & ACTION]
LAYOUT OVERRIDE: The 16:9 frame MUST be split exactly down the middle by a thick, solid vertical divider line extending entirely from the top edge to the bottom edge, creating two strictly equal, isolated rectangular panels (LEFT PANEL and RIGHT PANEL).

LEFT PANEL (Affirmation — "Yes, I am a teacher"): Render the master teacher archetype template inside the left half, complete with chalk in the writing hand and textbook against the chest. The teacher exhibits a bright, affirming open-mouth smile and slightly tilts the chalk-holding hand upward in a confident "yes" posture. A pure 2D graphic UI overlay of a single green checkmark is composited flat against the picture plane in the left-center of this panel.

RIGHT PANEL (Negation — "No, I am not a teacher"): EXACT CLONE of the left panel — render a 1:1 visual clone of the left-panel character inside the right half, including the IDENTICAL §3.9.8.A diegetic chalk-and-textbook prop combination. The ONLY permitted differences are the facial expression (closed eyes or downturned mouth, negating) and the arm gesture (hands crossed in front of the chest in an 'X' shape — the chalk and textbook are still visibly held, just crossed). The face structure, hair strands, outfit folds, body proportions, AND the chalk + textbook prop configuration MUST be mathematically identical to the left panel. Zero identity drift is permitted between the two panels.

A pure 2D graphic UI overlay of a single red X-mark is composited flat against the picture plane in the right-center of this panel.

SYMBOL COUNT STRICT ENFORCEMENT: There MUST be exactly TWO 2D UI overlay symbols in the entire output image — exactly ONE green checkmark (left panel) and exactly ONE red X-mark (right panel). DO NOT render any other 2D UI symbols, floating shapes, UI elements, or background text. The chalk and textbook are diegetic 3D props and are EXEMPT from this 2D UI symbol count.

This [SCENE & ACTION] block is a verbatim §3.9.8 B two-panel pattern with §3.9.8.A teacher archetype prop injection per PART 3.9 v4.0.8 (no NAMED_CHARACTER attached). Both panels MUST be 1:1 visual clones including the diegetic prop, differing only in expression and arm gesture.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
VISUAL_SYMBOLS entries are PERMITTED per §3.9.8 — but ONLY exactly TWO 2D UI overlay symbols total (one green checkmark in the LEFT PANEL, one red X-mark in the RIGHT PANEL), each rendered as a flat 2D UI overlay per §3.9.4. nanobanana MUST NEVER add any additional floating 2D UI symbols, arrows, circles, or geometric shapes. The chalk and textbook held by the archetype in both panels are diegetic 3D props and are EXEMPT from this 2D UI symbol limit.
${FLAG_BAN_GLOBAL}
${HORROR_VACUI_DEFENSE}`;

// ============================================================
// ex_L01_016 — キムさんは東西銀行の会社員です
// §3.9.3.B Institution Anchor Table (bank: teller counter + window grille)
// styleReferences = ["data/images/char_キム.png"] (NAMED retain)
// ============================================================
const PROMPT_016 = `[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
キムさんは東西銀行の会社員です。 (Kim-san is a company employee at Tozai Bank.)
The viewer must instantly read this as an affiliation statement — Kim-san works
INSIDE a recognizable bank interior — via the §3.9.3.B Institution Anchor cues.

${STRICT_LAYOUT}

[REFERENCE]
Attached reference images per PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE:
image_1 = canonical portrait of the Korean male company employee (キムさん, per PART 5.9 NAMED_CHARACTER_PROFILES). Character identity MUST be derived EXCLUSIVELY from this attached image — render the exact face, hair, build, and phenotype shown in the reference. Default outfit (per portrait): FACE STRUCTURE, HAIR (short neat dark parted to one side), SLIM RECTANGULAR GLASSES, OUTFIT (navy/charcoal business suit + white shirt + muted-blue tie + briefcase), 7-head ADULT BUILD, and East Asian phenotype. If this scene requires a different outfit, preserve FACE STRUCTURE, HAIR, BUILD, and PHENOTYPE while replacing ONLY the outfit.

[SUBJECT]
Character in scene: the Korean male company employee (キムさん, in his mid-to-late 20s, per attached portrait image_1). Character identity MUST be derived EXCLUSIVELY from the attached image. DO NOT redescribe hair color, eye shape, face contour, or the portrait's default outfit in this block.

${UNIVERSAL_RULES}

[SCENE & ACTION]
The scene is strictly an INDOOR interior shot fully enclosed by walls. The character is INSIDE the bank.

§3.9.3.B Institution Anchor (bank): This bank interior MUST display AT LEAST TWO of the following verbatim anchor cues: (i) a teller counter with low partition spanning across the LEFT HALF of the frame as the horizontal layout anchor; (ii) a window grille (vertical metal-bar partition) visible above or behind the counter; (iii) a number-call display panel mounted on the back wall above the counter (rendered per §3.9.7 7g as a completely solid uniform dark-slate screen area — no digits, no text, no UI elements). For this scene, anchors (i), (ii), AND (iii) are ALL required to clearly distinguish the bank interior from a generic office.

The Korean male company employee (キムさん, per attached portrait) is positioned BEHIND the teller counter at the right-center of the frame, in mid-action: one hand resting on the counter surface (per §3.9.2 object-manipulation), the other hand actively gesturing toward an off-frame customer. He wears his canonical business suit (per portrait) and his lanyard ID badge is visible. His expression is a calm, engaged closed-mouth smile.

The teller counter surface MUST be rendered as an entirely bare, completely cleared geometric plane of solid color (per §3.9.7 7f), devoid of scattered papers, pens, coffee cups, or hallucinated office clutter. The interior bank wall behind the counter MUST be a completely featureless, uninterrupted expanse of solid flat color (per §3.9.7 7h), devoid of posters, framed pictures, clocks, or any architectural detailing other than the window grille and number-call display explicitly enumerated above.

To enforce the 16:9 widescreen layout, the teller counter MUST physically intersect and bleed off both the extreme left and extreme right edges of the frame.

The scene above is built to satisfy PART 3.9 v4.0.8 (§3.9.1 edge-bleed / §3.9.2 object-manipulation (counter + gesture) / §3.9.3 INSIDE the bank / §3.9.3.B teller counter + window grille + number-call display / §3.9.5 EXCLUSIVELY from attached portrait / §3.9.6 particle visual mapping は = topic anchor + の = institutional affiliation / §3.9.7 featureless surfaces). All Forbidden phrases ("Standing in front of", "At the bank", "Outside the bank", "blank"/"empty"/"clean", "hovers"/"floating") are absent from this scene.

No 2D UI overlay symbol is used in this scene.

${COMPOSITION}

${STYLE_RECIPE}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
ABSOLUTELY NO floating 2D UI overlay symbols of any kind — no question marks, no checkmarks, no X marks, no arrows, no circles, no geometric shapes encircling characters, no callout balloons. The scene must communicate without any 2D overlay.
${FLAG_BAN_GLOBAL}
${HORROR_VACUI_DEFENSE}`;

// ============================================================
// Apply patches to image_prompts_skill.json
// ============================================================
const json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

const patches = [
  { id: 'ex_L01_004', prompt: PROMPT_004, styleRefs: ['data/images/char_鈴木.png'] },
  { id: 'ex_L01_010', prompt: PROMPT_010, styleRefs: [] }, // Route 2: portrait detached
  { id: 'ex_L01_011', prompt: PROMPT_011, styleRefs: [] }, // Already empty
  { id: 'ex_L01_016', prompt: PROMPT_016, styleRefs: ['data/images/char_キム.png'] },
];

let updated = 0;
for (const p of patches) {
  const e = json.vocabulary.find((x) => x.imageId === p.id);
  if (!e) { console.error(`MISSING entry: ${p.id}`); process.exit(1); }
  e.prompt = p.prompt;
  e.styleReferences = p.styleRefs;
  e._meta = e._meta || {};
  e._meta.guideVersion = 'v4.0.8';
  e._meta.updatedAt = new Date().toISOString();
  updated++;
  console.log(`  ✓ patched ${p.id} (prompt ${p.prompt.length}B / styleRefs ${p.styleRefs.length})`);
}

// Update top-level _meta
json._meta = json._meta || {};
json._meta.guideManifestHash = 'a99d6c962a96';
json._meta.lastPatchedFor = 'X-c-7 PoC v4.0.8 (004/010/011/016)';
json._meta.lastPatchedAt = new Date().toISOString();

writeFileSync(JSON_PATH, JSON.stringify(json, null, 2) + '\n');
console.log(`\nDone. Updated ${updated} entries. _meta.guideManifestHash = a99d6c962a96`);
