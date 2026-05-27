# -*- coding: utf-8 -*-
"""X-c-6 v3: ex_L01_001..018 prompts を Template C v4.0.7 + PART 3.9 v4.0.7 で再起案。

v2 (X-c-5) からの差分: Gemini 第三/四意見統合 (3 round) で確定した verbatim wording を
反映する。新規 defeats:
  - Native 1:1 Square Bias        → §3.9.1 edge-bleed Required phrase
  - Default Standing Portrait     → §3.9.2 object-manipulation Required phrase
  - Identity-only declarative     → §3.9.2 5a/5b Identity-only exception
  - Exterior Facade Literalism    → §3.9.3 "INSIDE the [INSTITUTION]" Required phrase
  - Diegetic Confusion (symbols)  → §3.9.4 "2D graphic UI overlay" Required phrase
  - Feature Blending (refs)       → §3.9.5 "EXCLUSIVELY from attached image"
  - Relational Ambiguity (粒子)   → §3.9.6 particle verbatim phrases
  - Horror Vacui / Gibberish      → §3.9.7 8-surface featureless verbatim phrases
  - Layout Ignorance (2-panel)    → §3.9.8 A/B verbatim block

guideManifestHash 期待値: 64b1a47cd005 (v4.0.7 / 5 refined + 3 new subsections)
"""
import datetime
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL_JSON_PATH = ROOT / "data" / "image_prompts_skill.json"
LESSON_JSON_PATH = ROOT / "data" / "lesson_01.json"
PREFLIGHT_SCRIPT = ROOT / "scripts" / "lib" / "prompt_preflight.py"

# ─────────────────────────────────────────────────────────────
# PART 5.9 NAMED_CHARACTER_PROFILES (lean form / inherit aspects)
# ─────────────────────────────────────────────────────────────
NAMED_CHARACTERS = {
    "鈴木": {
        "portraitPath": "data/images/char_鈴木.png",
        "role_ja": "先生",
        "role_en": "Japanese male language teacher",
        "age_text": "in his 40s to 50s",
        "lean_inherit": "FACE STRUCTURE, HAIR (salt-and-pepper short), OUTFIT (navy/charcoal suit + white shirt + slate-gray tie + ID lanyard), 7-head ADULT BUILD, and East Asian phenotype",
    },
    "リン": {
        "portraitPath": "data/images/char_リン.png",
        "role_ja": "大学生",
        "role_en": "Chinese female university student",
        "age_text": "in her early 20s",
        "lean_inherit": "FACE STRUCTURE, HAIR (long straight dark, past shoulders), OUTFIT (muted-blue top + blue jeans + canvas backpack on both shoulders), 7-head ADULT BUILD, and East Asian phenotype",
    },
    "ケリー": {
        "portraitPath": "data/images/char_ケリー.png",
        "role_ja": "先生",
        "role_en": "American female language teacher",
        "age_text": "in her 30s to 40s",
        "lean_inherit": "FACE STRUCTURE, HAIR (light-brown to honey-blonde shoulder-length), OUTFIT (cream blouse + muted warm-blue cardigan + dark-navy slacks + blank lanyard badge), 7-head ADULT BUILD, and Western Northern-European phenotype",
    },
    "キム": {
        "portraitPath": "data/images/char_キム.png",
        "role_ja": "会社員",
        "role_en": "Korean male company employee",
        "age_text": "in his mid-to-late 20s",
        "lean_inherit": "FACE STRUCTURE, HAIR (short neat dark parted to one side), SLIM RECTANGULAR GLASSES, OUTFIT (navy/charcoal business suit + white shirt + muted-blue tie + briefcase), 7-head ADULT BUILD, and East Asian phenotype",
    },
    "タノム": {
        "portraitPath": "data/images/char_タノム.png",
        "role_ja": "医者",
        "role_en": "Vietnamese male doctor",
        "age_text": "in his mid-to-late 20s",
        "lean_inherit": "FACE STRUCTURE, HAIR (short dark), MEDIUM-BROWN warm skin, OUTFIT (open white doctor's coat + muted-blue shirt + slate-gray stethoscope around neck + blank name badge), 7-head ADULT BUILD, and Southeast Asian phenotype",
    },
}


# ─────────────────────────────────────────────────────────────
# v4.0.7 verbatim phrases (PART 3.9 各 subsection から)
# ─────────────────────────────────────────────────────────────

# §3.9.1 aspect_ratio_enforcement Required phrase (edge-bleed)
EDGE_BLEED_REQUIRED = (
    "To enforce the 16:9 widescreen layout, the specified horizontal background "
    "anchor MUST physically intersect and bleed off both the extreme left and "
    "extreme right edges of the frame."
)

# §3.9.2 scene_action_focus Required phrase (object-manipulation)
OBJECT_MANIPULATION_REQUIRED = (
    "The character MUST be actively, physically manipulating an object related to "
    "their role (e.g., hands gripping a keyboard, fingers writing on a board, palm "
    "flat on the open textbook, hand resting on the stethoscope at chest level). "
    "DO NOT render a passive standing pose."
)

# §3.9.2 Identity-only exception 5a (nationality)
IDENTITY_5A_NATIONALITY = (
    "The subject is actively engaged in a dynamic, mid-conversation social gesture — "
    "body angled in a 3/4 posture, extending one arm in an open-palm introductory "
    "motion toward the viewer. They maintain engaged, direct eye contact, anchoring "
    "their identity through active social presence rather than a static pose."
)

# §3.9.2 Identity-only exception 5b (role identity without affiliation)
IDENTITY_5B_ROLE = (
    "The subject is captured mid-action in their canonical role activity, "
    "physically manipulating the primary tool of their profession (e.g., holding "
    "up a textbook, gesturing to a board) while making direct, engaged eye contact "
    "with the viewer to deliver instruction or service."
)

# §3.9.3 affiliation_indoor Required phrase
AFFILIATION_INSIDE_REQUIRED = (
    "The scene is strictly an INDOOR interior shot fully enclosed by walls. "
    "The character is INSIDE the {institution}."
)

# §3.9.4 visual_symbol_restriction Required phrase (2D UI overlay)
DIEGETIC_OVERLAY_REQUIRED = (
    "Render the symbol as a pure 2D graphic UI overlay composited flat against "
    "the picture plane. It MUST have zero depth, cast zero shadows, and exist "
    "completely outside the 3D diegetic scene space. The character MUST NOT "
    "interact with, look at, point to, or react to this overlay."
)

# §3.9.7 8 surface verbatim phrases
SURFACE_7A_WHITEBOARD = (
    "A wide featureless whiteboard spanning the left half of the frame, rendered "
    "as a single, uninterrupted geometric block of solid flat white color. It MUST "
    "be absolutely devoid of any marker lines, scribbles, text, or pseudo-kanji."
)
SURFACE_7B_LECTURE_DESKS = (
    "A long, continuous horizontal row of wooden lecture-hall desk surfaces "
    "extending edge-to-edge. The seating area MUST be completely unpopulated, "
    "showing only bare chairs and bare desk surfaces with zero human figures, "
    "silhouettes, or personal items."
)
SURFACE_7C_MEDICAL_MONITOR = (
    "A flat-panel medical monitor angled toward the viewer, its screen rendered "
    "as a completely solid, featureless dark-slate rectangle. The screen MUST NOT "
    "display any UI elements, charts, text, lines, or data visualization."
)
SURFACE_7D_TEXTBOOK = (
    "A thick textbook rendered as a solid, flat-color geometric block. The cover, "
    "spine, and any visible pages MUST be completely featureless, displaying "
    "absolute zero text, lines, pseudo-kanji, or interior illustrations."
)
SURFACE_7E_BADGE = (
    "A plain rectangular plastic ID badge, rendered as a single, uninterrupted "
    "solid-color polygon. It MUST contain zero text, zero profile photos, zero "
    "graphic logos, and zero dividing lines."
)
SURFACE_7F_DESK_BARE = (
    "The desk surface MUST be rendered as an entirely bare, completely cleared "
    "geometric plane of solid color. It MUST be absolutely devoid of any "
    "scattered papers, pens, coffee cups, or hallucinated office clutter."
)
SURFACE_7G_OFFICE_MONITOR = (
    "An office computer monitor featuring a completely solid, uniform dark-slate "
    "screen area. The screen MUST NOT display any desktop icons, application "
    "windows, text, taskbars, or UI elements of any kind."
)
SURFACE_7H_WALL = (
    "The interior background wall MUST be a completely featureless, uninterrupted "
    "expanse of solid flat color. It MUST be absolutely devoid of posters, framed "
    "pictures, clocks, light switches, baseboards, or any architectural detailing."
)

# §3.9.7 Positive enumeration helper
def enumerate_props(n: int, prop_list: str) -> str:
    return (
        f"The desk surface displays exactly {n} {prop_list}; the rest of the "
        f"surface is bare and devoid of any other items."
    )

# §3.9.8 two-panel blocks
def two_panel_block_A(character_role_en: str, named_char_jp: str) -> str:
    """§3.9.8 A: NAMED_CHARACTER 付き 2-panel."""
    return f"""LAYOUT OVERRIDE: The 16:9 frame MUST be split exactly down the middle by a thick, solid vertical divider line extending entirely from the top edge to the bottom edge, creating two strictly equal, isolated rectangular panels (LEFT PANEL and RIGHT PANEL).

LEFT PANEL (Affirmation): Render the {character_role_en} ({named_char_jp}, per attached portrait) inside the left half. They exhibit a bright, affirming open-mouth smile. A pure 2D graphic overlay of a single green checkmark is composited flat against the picture plane in the left-center of this panel.

RIGHT PANEL (Negation): Render an EXACT visual clone of the character (same attached portrait) inside the right half. They exhibit a negating expression with closed eyes and hands crossed in an 'X' gesture. A pure 2D graphic overlay of a single red X-mark is composited flat against the picture plane in the right-center of this panel.

IDENTITY LOCK: The character in the LEFT PANEL and the character in the RIGHT PANEL MUST be identical in every physical detail (face, hair, build, outfit, phenotype). Zero identity drift is permitted between the two panels.

SYMBOL COUNT STRICT ENFORCEMENT: There MUST be exactly TWO symbols in the entire output image — exactly ONE green checkmark (left) and exactly ONE red X-mark (right). DO NOT render any other symbols, floating shapes, UI elements, or background text."""


def two_panel_block_B(archetype_description: str) -> str:
    """§3.9.8 B: NAMED_CHARACTER なし 2-panel (archetype 仕様)."""
    return f"""LAYOUT OVERRIDE: The 16:9 frame MUST be split exactly down the middle by a thick, solid vertical divider line extending entirely from the top edge to the bottom edge, creating two strictly equal, isolated rectangular panels (LEFT PANEL and RIGHT PANEL).

LEFT PANEL (Affirmation): Render the master character template inside the left half. They exhibit a bright, affirming open-mouth smile. A pure 2D graphic overlay of a single green checkmark is composited flat against the picture plane in the left-center of this panel.

RIGHT PANEL (Negation): EXACT CLONE. Render a 1:1 visual clone of the left-panel character inside the right half. The ONLY permitted differences are the facial expression (closed eyes, negating) and the arm gesture (hands crossed in an 'X'). The face structure, hair strands, outfit folds, and body proportions MUST be mathematically identical to the left panel.

SYMBOL COUNT STRICT ENFORCEMENT: There MUST be exactly TWO symbols in the entire output image — exactly ONE green checkmark (left) and exactly ONE red X-mark (right). DO NOT render any other symbols, floating shapes, UI elements, or background text."""


def two_panel_subject_B(archetype_description: str) -> str:
    """§3.9.8 B 専用 [SUBJECT] block."""
    return (
        f"Establish a SINGLE, highly specific generic character archetype for this "
        f"scene: {archetype_description}. This precise visual configuration serves "
        f"as the strict master template. The model MUST internally lock this exact "
        f"design before rendering the panels."
    )


# ─────────────────────────────────────────────────────────────
# 18 example の per-scene 設計 (v3 / PART 3.9 v4.0.7 verbatim)
# ─────────────────────────────────────────────────────────────
EXAMPLES = {
    # === p1 (5 declarative identity sentences) ===
    "ex_L01_001": {
        "pattern": "identity_role",
        "sentence_jp": "鈴木さんは先生です。",
        "sentence_en": "Suzuki-san is a teacher.",
        "scene_action": (
            "An indoor scene set inside a bright, minimalist Japanese classroom. "
            "The Japanese male language teacher (鈴木さん, per attached portrait) is "
            "captured mid-lesson behind a simple wooden teacher's podium at the "
            "right-center of the frame. " + IDENTITY_5B_ROLE +
            " One palm rests flat on the open textbook on the podium, his other "
            "hand actively gestures toward the whiteboard. Expression: warm, "
            "engaged closed-mouth smile."
        ),
        "horizontal_anchor": (
            SURFACE_7A_WHITEBOARD + " " + SURFACE_7H_WALL.replace(
                "The interior background wall", "The interior classroom wall behind it") +
            " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_002": {
        "pattern": "identity_role",
        "sentence_jp": "リンさんは大学生です。",
        "sentence_en": "Lin-san is a university student.",
        "scene_action": (
            "An indoor scene set inside a modern university lecture hall. "
            "The Chinese female university student (リンさん, per attached portrait) "
            "is seated at the center-right of the frame at a lecture desk in an "
            "active studying posture. " + OBJECT_MANIPULATION_REQUIRED +
            " Specifically: her writing hand grips a pen mid-stroke on an open "
            "spiral notebook on the desk; her other hand rests palm-down on the "
            "desk surface beside the notebook. Her canvas backpack is on the seat "
            "beside her with one strap visible. Expression: focused engagement."
        ),
        "horizontal_anchor": (
            SURFACE_7B_LECTURE_DESKS + " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_003": {
        "pattern": "identity_role",
        "sentence_jp": "キムさんは会社員です。",
        "sentence_en": "Kim-san is a company employee.",
        "scene_action": (
            "An indoor scene set inside a modern minimalist corporate office. "
            "The Korean male company employee (キムさん, per attached portrait) is "
            "seated at a wide office desk at the center-right of the frame in an "
            "active working posture. " + OBJECT_MANIPULATION_REQUIRED +
            " Specifically: both hands rest on the keys of a flat-vector keyboard "
            "in front of him, mid-typing motion. Expression: focused composed "
            "concentration."
        ),
        "horizontal_anchor": (
            SURFACE_7G_OFFICE_MONITOR + " The monitor sits at the back of a wide "
            "office desk that extends across the FULL FRAME horizontally; " +
            enumerate_props(2, "one flat-vector keyboard directly in front of the "
                            "employee and one flat-vector mouse to its right") +
            " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_004": {
        "pattern": "identity_nationality",
        "sentence_jp": "鈴木さんは日本人です。",
        "sentence_en": "Suzuki-san is Japanese.",
        "scene_action": (
            "An indoor scene set inside the same Japanese classroom context as "
            "ex_L01_001. The Japanese male language teacher (鈴木さん, per attached "
            "portrait) is positioned at the right-center of the frame. " +
            IDENTITY_5A_NATIONALITY +
            " His textbook is held against his chest with his free arm, while the "
            "extended arm of his introductory gesture clearly conveys 'hello, I am'. "
            "The framing brings the character somewhat closer to the camera than "
            "ex_L01_001 so that his East Asian facial features and Japanese-male "
            "teacher silhouette read clearly."
        ),
        "horizontal_anchor": (
            SURFACE_7A_WHITEBOARD.replace(
                "featureless whiteboard", "featureless blackboard"
            ).replace(
                "solid flat white color", "solid flat slate-grey color"
            ).replace(
                "marker lines, scribbles, text, or pseudo-kanji",
                "chalk marks, scribbles, text, or pseudo-kanji"
            ) + " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_005": {
        "pattern": "identity_nationality",
        "sentence_jp": "リンさんは中国人です。",
        "sentence_en": "Lin-san is Chinese.",
        "scene_action": (
            "An indoor scene set inside the same university lecture hall context "
            "as ex_L01_002. The Chinese female university student (リンさん, per "
            "attached portrait) is positioned at the center-right of the frame. " +
            IDENTITY_5A_NATIONALITY +
            " Her closed spiral notebook is held in her non-gesturing hand at her "
            "side, and her canvas backpack is on her back with both straps visible. "
            "The framing brings the character somewhat closer to the camera than "
            "ex_L01_002 so that her East Asian facial features and student "
            "silhouette read clearly."
        ),
        "horizontal_anchor": (
            SURFACE_7B_LECTURE_DESKS + " " + SURFACE_7H_WALL.replace(
                "The interior background wall", "The interior lecture-hall wall "
                "behind the desks") + " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    # === p2 (8 Q/A sentences) ===
    "ex_L01_006": {
        "pattern": "question_id",
        "sentence_jp": "リンさんですか。",
        "sentence_en": "Are you Lin-san?",
        "scene_action": (
            "An indoor scene set inside the same university lecture hall context "
            "as ex_L01_002. The Chinese female university student (リンさん, per "
            "attached portrait) is seated at her lecture desk at the right side of "
            "the frame in the same active studying posture as ex_L01_002 (writing "
            "hand grips a pen mid-stroke on an open spiral notebook). Her body is "
            "angled slightly toward the viewer (toward an off-frame speaker who is "
            "addressing her by name). Her expression is a slightly surprised, "
            "faintly uncertain closed-mouth look — she has paused her writing "
            "mid-stroke to register being addressed. She does NOT look at, point "
            "to, or react to any overlaid symbol."
        ),
        "horizontal_anchor": (
            SURFACE_7B_LECTURE_DESKS + " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": (
            "A single large flat-vector question mark in muted symbolic red is "
            "placed in the LEFT-CENTER region of the frame as a graphic mark. " +
            DIEGETIC_OVERLAY_REQUIRED + " Exactly ONE question mark in the entire "
            "frame — no other symbols."
        ),
    },
    "ex_L01_007": {
        "pattern": "answer_2panel_id",
        "sentence_jp": "はい、リンさんです。／いいえ、リンさんじゃありません。",
        "sentence_en": "Yes, I am Lin-san. / No, I am not Lin-san.",
        "scene_action": "__TWO_PANEL_A__",
        "horizontal_anchor": "",
        "visual_symbol": "",
        "two_panel_named_char": "リン",
    },
    "ex_L01_008": {
        "pattern": "who_silhouette",
        "sentence_jp": "だれですか。",
        "sentence_en": "Who is it?",
        "scene_action": (
            "An indoor scene set in a simple minimalist neutral interior. A single "
            "generic adult standing figure occupies the right-center of the frame, "
            "wearing simple muted-blue casual top + dark slacks + simple sneakers "
            "(normal flat vector body, 7-head adult proportion). However, the "
            "figure's face area is rendered as a UNIFORM SOFT SLATE-GRAY "
            "SILHOUETTE FILL — no eyes, no eyebrows, no nose, no mouth visible; "
            "the entire head is a featureless slate-gray flat shape, conveying "
            "'identity unknown'. This is the intentional PART 1.8 FACIAL_FEATURES "
            "exception for this sentence only. The figure does NOT look at, point "
            "to, or react to any overlaid symbol."
        ),
        "horizontal_anchor": (
            SURFACE_7H_WALL + " A simple flat-vector horizontal floor line "
            "extends across the FULL FRAME edge to edge along the lower edge. " +
            EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": (
            "A single large flat-vector question mark in muted symbolic red is "
            "placed in the LEFT-CENTER region of the frame above head level as a "
            "graphic mark. " + DIEGETIC_OVERLAY_REQUIRED + " Exactly ONE question "
            "mark in the entire frame — no other symbols."
        ),
        "facial_features_override": True,
    },
    "ex_L01_009": {
        "pattern": "id_reveal",
        "sentence_jp": "キムさんです。",
        "sentence_en": "It is Kim-san.",
        "scene_action": (
            "An indoor scene set inside the same modern minimalist corporate "
            "office context as ex_L01_003. The Korean male company employee "
            "(キムさん, per attached portrait) is captured at the CENTER of the "
            "frame in the same active working posture as ex_L01_003. " +
            OBJECT_MANIPULATION_REQUIRED + " Specifically: both hands rest on the "
            "keys of a flat-vector keyboard, mid-typing motion. Slim rectangular "
            "glasses + business suit + tie clearly visible. He glances toward the "
            "viewer with a polite composed closed-mouth smile, as the unambiguous "
            "answer to the implicit question 'who is it?'."
        ),
        "horizontal_anchor": (
            SURFACE_7G_OFFICE_MONITOR + " The monitor sits at the back of a wide "
            "office desk that extends across the FULL FRAME horizontally; " +
            enumerate_props(2, "one flat-vector keyboard directly in front of the "
                            "employee and one flat-vector mouse to its right") +
            " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_010": {
        "pattern": "question_role",
        "sentence_jp": "先生ですか。",
        "sentence_en": "Are you a teacher?",
        "scene_action": (
            "An indoor scene set inside the same Japanese classroom context as "
            "ex_L01_001. The Japanese male language teacher (鈴木さん, per attached "
            "portrait) is captured mid-lesson behind his teacher's podium at the "
            "RIGHT side of the frame. " + IDENTITY_5B_ROLE +
            " One palm rests flat on the open textbook on the podium, his other "
            "hand actively gestures toward the whiteboard. His body is angled "
            "slightly toward an off-frame speaker (the asker), expression a calm "
            "engaged closed-mouth smile. He does NOT look at, point to, or react "
            "to any overlaid symbol."
        ),
        "horizontal_anchor": (
            SURFACE_7A_WHITEBOARD + " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": (
            "A single large flat-vector question mark in muted symbolic red is "
            "placed in the LEFT-CENTER region of the frame as a graphic mark. " +
            DIEGETIC_OVERLAY_REQUIRED + " Exactly ONE question mark in the entire "
            "frame — no other symbols."
        ),
    },
    "ex_L01_011": {
        "pattern": "answer_2panel_role",
        "sentence_jp": "はい、先生です。／いいえ、先生じゃありません。",
        "sentence_en": "Yes, I am a teacher. / No, I am not a teacher.",
        "scene_action": "__TWO_PANEL_B__",
        "horizontal_anchor": "",
        "visual_symbol": "",
        "two_panel_archetype": (
            "a generic Japanese-context language teacher in their 30s to 40s, "
            "East Asian phenotype with fair-to-light-medium skin, dark short hair "
            "neatly combed and parted to one side, wearing a conservative navy "
            "business suit jacket and matching trousers with a crisp plain white "
            "dress shirt and a subtle solid slate-gray necktie, plain dark leather "
            "loafers on both feet, holding a thick textbook (rendered per §3.9.7 "
            "7d as a solid flat-color block with completely featureless cover and "
            "spine — zero text, zero pseudo-kanji) clasped against the chest with "
            "one arm in the LEFT PANEL only; 7-head adult proportion"
        ),
    },
    "ex_L01_012": {
        "pattern": "question_nationality",
        "sentence_jp": "韓国人ですか。",
        "sentence_en": "Are you Korean?",
        "scene_action": (
            "An indoor scene set in the modern minimalist corporate office "
            "context. The Korean male company employee (キムさん, per attached "
            "portrait) is positioned at the RIGHT side of the frame. " +
            IDENTITY_5A_NATIONALITY +
            " His briefcase is held in his non-gesturing hand at his side. Slim "
            "rectangular glasses + business suit + tie clearly visible. The "
            "framing brings the character somewhat closer to the camera so that "
            "his East Asian facial features and company-employee silhouette read "
            "clearly. He does NOT look at, point to, or react to any overlaid "
            "symbol."
        ),
        "horizontal_anchor": (
            SURFACE_7G_OFFICE_MONITOR + " The monitor sits at the back of a wide "
            "office desk extending across the LEFT HALF of the frame. " +
            enumerate_props(2, "one flat-vector keyboard in front of the monitor "
                            "and one flat-vector mouse to its right") +
            " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": (
            "A single large flat-vector question mark in muted symbolic red is "
            "placed in the LEFT-CENTER region of the frame as a graphic mark. " +
            DIEGETIC_OVERLAY_REQUIRED + " Exactly ONE question mark in the entire "
            "frame — no other symbols."
        ),
    },
    "ex_L01_013": {
        "pattern": "answer_2panel_nationality",
        "sentence_jp": "はい、韓国人です。／いいえ、韓国人じゃありません。",
        "sentence_en": "Yes, I am Korean. / No, I am not Korean.",
        "scene_action": "__TWO_PANEL_B__",
        "horizontal_anchor": "",
        "visual_symbol": "",
        "two_panel_archetype": (
            "a generic Korean adult professional in their late 20s to early 30s, "
            "East Asian phenotype with fair-to-light-medium skin, short neat dark "
            "hair parted to one side, slim rectangular dark-frame glasses, "
            "wearing a navy or charcoal business suit jacket and matching trousers "
            "with a crisp plain white dress shirt and a subtle muted-blue solid "
            "necktie, plain dark leather loafers on both feet, holding a simple "
            "flat-vector briefcase by its handle at one side; 7-head adult "
            "proportion"
        ),
    },
    # === p3 (5 affiliation sentences — INDOOR per v4.0.7 §3.9.3) ===
    "ex_L01_014": {
        "pattern": "affiliation",
        "sentence_jp": "タノムさんは東西病院の医者です。",
        "sentence_en": "Tanom-san is a doctor at Tozai Hospital.",
        "scene_action": (
            AFFILIATION_INSIDE_REQUIRED.format(institution="hospital") +
            " The interior is a bright, minimalist hospital consultation room. "
            "The Vietnamese male doctor (タノムさん, per attached portrait) is "
            "captured at the right-center of the frame in active consulting "
            "action. " + OBJECT_MANIPULATION_REQUIRED + " Specifically: one hand "
            "rests on the stethoscope chestpiece at his own chest, the other hand "
            "holds an open clipboard at waist level as if reviewing patient notes. "
            "Body angled at 3/4 view toward the viewer (the patient's perspective). "
            "Expression: kind, reassuring closed-mouth smile with gentle attentive "
            "eyes engaged with the viewer."
        ),
        "horizontal_anchor": (
            "A wide medical consultation desk spans across the LEFT HALF of the "
            "frame from left edge inward; " +
            enumerate_props(1,
                "one flat-panel medical monitor at the back-left of the desk "
                "(rendered per §3.9.7 7c as a completely solid, featureless "
                "dark-slate rectangle — no UI elements, no charts, no text, no "
                "lines, no data visualization)") +
            " A simple medical examination bed silhouette and a horizontal medical "
            "equipment shelf extend along the upper-left wall. " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_015": {
        "pattern": "affiliation",
        "sentence_jp": "鈴木さんは東西学校の先生です。",
        "sentence_en": "Suzuki-san is a teacher at Tozai School.",
        "scene_action": (
            AFFILIATION_INSIDE_REQUIRED.format(institution="school") +
            " The interior is a Japanese school classroom (wider establishing "
            "shot than ex_L01_001). The Japanese male language teacher (鈴木さん, "
            "per attached portrait) is captured at the right-center of the frame "
            "at his teacher's podium mid-lesson. " + IDENTITY_5B_ROLE +
            " One palm rests flat on the open textbook on the podium, his other "
            "hand actively gestures toward the blackboard. Expression: calm, "
            "engaged closed-mouth smile."
        ),
        "horizontal_anchor": (
            SURFACE_7A_WHITEBOARD.replace(
                "featureless whiteboard", "featureless blackboard"
            ).replace(
                "solid flat white color", "solid flat slate-grey color"
            ).replace(
                "marker lines, scribbles, text, or pseudo-kanji",
                "chalk marks, scribbles, text, or pseudo-kanji"
            ) + " " + SURFACE_7B_LECTURE_DESKS.replace(
                "lecture-hall desk", "student classroom desk"
            ) + " The student desks fill the lower-left foreground; the blackboard "
            "fills the upper-left background. Together they confirm the SCHOOL "
            "setting (vs the generic classroom of ex_L01_001). " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_016": {
        "pattern": "affiliation",
        "sentence_jp": "キムさんは東西銀行の会社員です。",
        "sentence_en": "Kim-san is a company employee at Tozai Bank.",
        "scene_action": (
            AFFILIATION_INSIDE_REQUIRED.format(institution="bank office") +
            " The interior is a bright, modern bank work area behind the customer "
            "counter. The Korean male company employee (キムさん, per attached "
            "portrait) is seated at a sleek banking desk at the center-right of "
            "the frame in active working posture. " + OBJECT_MANIPULATION_REQUIRED +
            " Specifically: one hand operates the keys of a simple flat-vector "
            "calculator-shaped device on the desk, the other hand rests palm-down "
            "on the desk surface beside it. Expression: focused composed "
            "concentration with a polite glance toward the viewer."
        ),
        "horizontal_anchor": (
            "A wide bank counter / teller window silhouette and a row of simple "
            "flat-vector cubicle partitions extend across the FULL UPPER HALF of "
            "the frame edge to edge horizontally — together they read unambiguously "
            "as 'inside a bank work area'. A sleek banking desk in the foreground; " +
            enumerate_props(2, "one flat-vector calculator-shaped device in front "
                            "of the employee and one closed flat-vector ledger "
                            "book to its right") +
            " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_017": {
        "pattern": "affiliation",
        "sentence_jp": "リンさんは東西大学の学生です。",
        "sentence_en": "Lin-san is a student at Tozai University.",
        "scene_action": (
            AFFILIATION_INSIDE_REQUIRED.format(institution="university lecture hall") +
            " The interior is a university lecture hall (wider establishing shot "
            "than ex_L01_002 / 005). The Chinese female university student "
            "(リンさん, per attached portrait) is seated at her long lecture-hall "
            "desk at the center-right of the frame in active studying posture. " +
            OBJECT_MANIPULATION_REQUIRED + " Specifically: her writing hand grips "
            "a pen mid-stroke on an open spiral notebook on the desk, her other "
            "hand rests palm-down on the open textbook beside the notebook "
            "(textbook rendered per §3.9.7 7d as a solid flat-color block, cover "
            "and pages completely featureless — zero text, zero pseudo-kanji). "
            "Her canvas backpack is on the seat beside her with one strap visible. "
            "Expression: alert, focused engagement."
        ),
        "horizontal_anchor": (
            SURFACE_7B_LECTURE_DESKS + " " + SURFACE_7H_WALL.replace(
                "The interior background wall",
                "A wide lecture-hall front wall with a featureless lecture screen") +
            " " + EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
    "ex_L01_018": {
        "pattern": "affiliation",
        "sentence_jp": "キムさんは東西デパートの会社員です。",
        "sentence_en": "Kim-san is a company employee at Tozai Department Store.",
        "scene_action": (
            AFFILIATION_INSIDE_REQUIRED.format(institution="department store sales floor") +
            " The interior is a department store ground floor (sales floor near "
            "the main entrance — the employee work area behind the customer "
            "counter). The Korean male company employee (キムさん, per attached "
            "portrait) is captured at the right-center of the frame in active "
            "welcoming action. " + OBJECT_MANIPULATION_REQUIRED + " Specifically: "
            "one hand rests on the surface of the counter in front of him "
            "(palm-down, fingertips touching the counter), the other hand performs "
            "an open welcoming gesture toward the viewer (the shopper's "
            "perspective). Expression: polite composed welcoming closed-mouth "
            "smile."
        ),
        "horizontal_anchor": (
            "A wide department store counter spans across the LEFT HALF of the "
            "frame from left edge inward (rendered per §3.9.7 7f as a bare "
            "completely cleared geometric plane of solid color — devoid of "
            "scattered papers, pens, or hallucinated clutter). Simple flat-vector "
            "retail display window silhouettes (showing abstract clothing mannequin "
            "shapes — no text, no logos, no brand names) extend along the upper "
            "portion of the frame from left to center. Together they read "
            "unambiguously as 'inside a department store sales floor'. " +
            EDGE_BLEED_REQUIRED
        ),
        "visual_symbol": "",
    },
}


ROLE_ANTI_FLAG_BLOCK = (
    "The clothing, accessories, props, and any visible badges of all characters "
    "must NEVER include any national flag motif, national emblem, nationality pin, "
    "country indicator, political symbol, or flag-print on garments. Nationality is "
    "conveyed by phenotype and subtle outfit palette tendency only — no flag display "
    "in example-sentence illustrations."
)

STRICT_LAYOUT_BLOCK = """[STRICT LAYOUT DIRECTIVE]
ASPECT RATIO: MUST be 16:9 widescreen landscape (horizontal orientation).
DO NOT crop into a square 1:1 frame, NOT 4:3 landscape, NOT 3:4 vertical,
NOT 9:16 portrait. To enforce the 16:9 layout, the scene's background
elements MUST extend horizontally from the left edge to the right edge of
the frame — see the [SCENE & ACTION] block below for the specific
horizontal anchor (whiteboard / wide desk / institution interior / 2-panel
vertical divider). nanobanana defaults to 1:1; this directive is the
primary counterweight.""".strip()

FACIAL_FEATURES_BLOCK = """FACIAL FEATURES RULE (v4.0 PART 1.8): Every character figure in the image
MUST clearly show all four primary facial features — eyes (with visible
pupils, not blank circles), eyebrows, nose, and mouth — drawn in flat
illustration style. NEVER omit any of these four features.""".strip()

FACIAL_FEATURES_OVERRIDE_BLOCK = """FACIAL FEATURES RULE (override for だれですか): The single figure's face is
INTENTIONALLY rendered as a soft slate-gray silhouette WITHOUT clear eyes,
eyebrows, nose, or mouth — the entire head fills as a slate-gray flat shape
to convey 'unknown identity'. This is the explicit and intentional PART 1.8
exception for this sentence only. All OTHER body parts (hands, feet,
posture, footwear) are rendered normally per the flat vector style.""".strip()

HEAD_BODY_BLOCK = """HEAD-BODY PROPORTION RULE (v4.0 PART 1.10): Every adult character figure
MUST be rendered with approximately 7-head-height proportion. NEVER render
adult roles with shorter 5-6 head proportions — that reads as childlike or
cartoonish. Working-age adults (20s-50s) must read as such by body
proportion alone.""".strip()

FOOTWEAR_BLOCK = """FOOTWEAR RULE (v3.11 / preserved in v4.0): Every character figure MUST
visibly wear footwear on both feet (loafers / sneakers / etc.) whenever
both feet are inside the frame. Barefoot is NOT permitted.""".strip()

STYLE_RECIPE_BLOCK = """[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with
consistent line weight. Completely flat solid color fills only. Color
palette: soft cream off-white background (warm off-white, NOT pure stark
white), deep slate navy outlines, muted warm colors, warm amber gold
accents for emphasis. This should look like it belongs in a brand style
guide, not like AI art. Keep line weights consistent.""".strip()


def detect_named_characters(sentence: str, scene_characters: list[str]) -> list[str]:
    detected_a = []
    for name in NAMED_CHARACTERS.keys():
        pos = sentence.find(name)
        if pos >= 0:
            detected_a.append((pos, name))
    detected_a.sort(key=lambda x: x[0])
    sentence_order = [name for _, name in detected_a]
    union = list(sentence_order)
    for name in scene_characters:
        if name in NAMED_CHARACTERS and name not in union:
            union.append(name)
    return union[:4]


def build_reference_block(detected: list[str]) -> str:
    if not detected:
        return ""
    lines = ["[REFERENCE]", "Attached reference images per PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE:"]
    for i, name in enumerate(detected, start=1):
        prof = NAMED_CHARACTERS[name]
        lines.append(
            f"image_{i} = canonical portrait of the {prof['role_en']} ({name}さん, "
            f"per PART 5.9 NAMED_CHARACTER_PROFILES). Character identity MUST be "
            f"derived EXCLUSIVELY from this attached image — render the exact "
            f"face, hair, build, and phenotype shown in the reference. Default "
            f"outfit (per portrait): {prof['lean_inherit']}. If this scene "
            f"requires a different outfit, preserve FACE STRUCTURE, HAIR, BUILD, "
            f"and PHENOTYPE while replacing ONLY the outfit."
        )
    return "\n".join(lines)


def build_character_descriptions(detected: list[str], two_panel_archetype: str = "") -> str:
    """v4.0.7 lean form: §3.9.5 EXCLUSIVELY from attached image."""
    if two_panel_archetype:
        # §3.9.8 B archetype-locking SUBJECT
        return two_panel_subject_B(two_panel_archetype)
    if not detected:
        return ("Character in scene: a single generic adult figure (no specific "
                "NAMED_CHARACTER). See [SCENE & ACTION] for face/body treatment.")
    parts = []
    for i, name in enumerate(detected, start=1):
        prof = NAMED_CHARACTERS[name]
        parts.append(
            f"Character in scene: the {prof['role_en']} ({name}さん, "
            f"{prof['age_text']}, per attached portrait image_{i}). Character "
            f"identity MUST be derived EXCLUSIVELY from the attached image. "
            f"DO NOT redescribe hair color, eye shape, face contour, or the "
            f"portrait's default outfit in this block."
        )
    return " ".join(parts)


def build_symbol_clause(visual_symbol: str, is_two_panel: bool = False) -> str:
    """v4.0.7 conditional symbol permission per §3.9.4 / §3.9.8."""
    if is_two_panel:
        return (
            "VISUAL_SYMBOLS entries are PERMITTED per §3.9.8 — but ONLY exactly "
            "TWO symbols total (one green checkmark in the LEFT PANEL, one red "
            "X-mark in the RIGHT PANEL), each rendered as a flat 2D UI overlay "
            "per §3.9.4. nanobanana MUST NEVER add any additional floating "
            "symbols, arrows, circles, or geometric shapes."
        )
    if visual_symbol:
        return (
            "VISUAL_SYMBOLS entries (question mark / checkmark / X mark / arrow) "
            "ARE PERMITTED — but ONLY exactly the symbols specified in the visual "
            "symbol block above, each rendered as a flat 2D UI overlay per §3.9.4. "
            "nanobanana MUST NEVER add any additional floating symbols, arrows, "
            "circles, or geometric shapes encircling characters or the scene."
        )
    return (
        "ABSOLUTELY NO floating symbols of any kind — no question marks, no "
        "checkmarks, no X marks, no arrows, no circles, no geometric shapes "
        "encircling characters, no callout balloons. The scene must communicate "
        "without any symbolic overlay."
    )


def build_visual_symbol_block(visual_symbol: str) -> str:
    if visual_symbol:
        return visual_symbol
    return "No visual symbol is used in this scene."


def build_prompt(*, sentence_jp, sentence_en, scene_action, horizontal_anchor,
                 visual_symbol, detected, facial_features_override=False,
                 two_panel_mode=None, two_panel_named_char=None,
                 two_panel_archetype=None):
    """
    two_panel_mode: None | "A" (NAMED_CHARACTER) | "B" (archetype)
    """
    is_two_panel = two_panel_mode is not None
    reference_block = build_reference_block(detected)
    if reference_block:
        reference_block = reference_block + "\n\n"

    char_descriptions = build_character_descriptions(
        detected, two_panel_archetype=two_panel_archetype or "")
    facial_block = FACIAL_FEATURES_OVERRIDE_BLOCK if facial_features_override else FACIAL_FEATURES_BLOCK

    # 2-panel: replace entire [SCENE & ACTION] body with §3.9.8 verbatim block
    if two_panel_mode == "A":
        # Look up role description for the named character
        prof = NAMED_CHARACTERS[two_panel_named_char]
        scene_combined = two_panel_block_A(
            character_role_en=prof["role_en"],
            named_char_jp=f"{two_panel_named_char}さん",
        )
        symbol_block = ""  # symbols are inside the §3.9.8 block itself
        symbol_clause = build_symbol_clause("", is_two_panel=True)
        meta_paragraph = (
            "This [SCENE & ACTION] block is a verbatim §3.9.8 A two-panel pattern "
            "per PART 3.9 v4.0.7. The 16:9 frame is split by a thick vertical "
            "divider; identity-lock across panels MUST be enforced from the "
            "single attached portrait."
        )
    elif two_panel_mode == "B":
        scene_combined = two_panel_block_B(archetype_description=two_panel_archetype)
        symbol_block = ""
        symbol_clause = build_symbol_clause("", is_two_panel=True)
        meta_paragraph = (
            "This [SCENE & ACTION] block is a verbatim §3.9.8 B two-panel pattern "
            "per PART 3.9 v4.0.7 (no NAMED_CHARACTER attached). The [SUBJECT] block "
            "above provides the archetype master template; both panels MUST be "
            "1:1 visual clones differing only in expression and gesture."
        )
    else:
        scene_combined = f"{scene_action}\n\n{horizontal_anchor}"
        symbol_block = build_visual_symbol_block(visual_symbol)
        symbol_clause = build_symbol_clause(visual_symbol)
        meta_paragraph = (
            "The scene above is built to satisfy PART 3.9 v4.0.7 (§3.9.1 "
            "edge-bleed / §3.9.2 object-manipulation or identity-only exception "
            "5a/5b / §3.9.3 INSIDE the institution / §3.9.4 2D UI overlay / "
            "§3.9.6 particle visual mapping / §3.9.7 featureless surfaces). "
            "All Forbidden phrases (\"Standing in front of\", \"Looking at the "
            "viewer\" outside active gesture, \"blank\"/\"empty\"/\"clean\", "
            "\"hovers\"/\"floating\") are absent from this scene."
        )

    return f"""
[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
{sentence_jp} ({sentence_en})
The viewer must instantly read the sentence's grammatical core from the
visualized action, NOT from the absence of conflicting cues.

{STRICT_LAYOUT_BLOCK}

{reference_block}[SUBJECT]
{char_descriptions}

{facial_block}
{HEAD_BODY_BLOCK}
{FOOTWEAR_BLOCK}

[SCENE & ACTION]
{scene_combined}

{meta_paragraph}

{symbol_block}

Composition: Wide 16:9 shot, 50mm standard lens equivalent (natural
perspective). Characters occupy 60% of the frame. Eye-level view. Background
base: soft cream off-white background (warm off-white, NOT pure stark white).
Main characters are clearly separated from the background in visual contrast.

{STYLE_RECIPE_BLOCK}

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
{symbol_clause}
{ROLE_ANTI_FLAG_BLOCK}
EXTERIOR BUILDING SIGNAGE RULE: Any background buildings, walls, windows, or
surfaces MUST be left featureless — no signboard text, no English labels, no
Japanese kanji or kana, no street numbers, no logos. nanobanana frequently
invents text on building surfaces; this is PROHIBITED.
HORROR VACUI DEFENSE (§3.9.7): All flat surfaces (whiteboards, screens, paper,
walls, monitors, badges, desks) MUST be rendered as solid, unbroken fields of
flat color. Scene-essential props are positively enumerated in the [SCENE &
ACTION] block; any flat surface NOT enumerated MUST be featureless.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""".strip()


def run_preflight(text, word, template_kind="example_sentence"):
    payload = json.dumps({"text": text, "template_kind": template_kind, "word": word}, ensure_ascii=False)
    result = subprocess.run(
        [sys.executable, str(PREFLIGHT_SCRIPT)],
        input=payload,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    try:
        out = json.loads(result.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        return [f"preflight crash: stdout={result.stdout!r} stderr={result.stderr!r}"]
    return out.get("errors", [])


def compute_manifest_hash():
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
        raw = (ROOT / p).read_bytes()
        # Match invariants.mjs sha256PrefixNormalized: CRLF→LF, bare CR→LF, strip trailing \n+
        lf = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        lf = lf.rstrip(b"\n")
        concat += hashlib.sha256(lf).hexdigest()[:12]
    return hashlib.sha256(concat.encode()).hexdigest()[:12]


def main():
    skill = json.loads(SKILL_JSON_PATH.read_text(encoding="utf-8"))
    by_id = {e["imageId"]: i for i, e in enumerate(skill.get("vocabulary", []))}
    lesson = json.loads(LESSON_JSON_PATH.read_text(encoding="utf-8"))

    examples_by_id = {}
    for p in lesson.get("patterns", []):
        for ex in p.get("examples", []):
            examples_by_id[ex["imageId"]] = ex

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    overwritten = 0
    fails = []

    for image_id, design in EXAMPLES.items():
        ex = examples_by_id.get(image_id)
        if not ex:
            fails.append(f"{image_id}: not found in lesson_01.json")
            continue
        scene_chars = ex.get("sceneCharacters", []) or []
        detected = detect_named_characters(design["sentence_jp"], scene_chars)

        # 2-panel mode detection
        two_panel_mode = None
        two_panel_named_char = None
        two_panel_archetype = None
        if design.get("scene_action") == "__TWO_PANEL_A__":
            two_panel_mode = "A"
            two_panel_named_char = design["two_panel_named_char"]
        elif design.get("scene_action") == "__TWO_PANEL_B__":
            two_panel_mode = "B"
            two_panel_archetype = design["two_panel_archetype"]
            detected = []  # B mode = no NAMED_CHARACTER

        prompt = build_prompt(
            sentence_jp=design["sentence_jp"],
            sentence_en=design["sentence_en"],
            scene_action=design["scene_action"],
            horizontal_anchor=design["horizontal_anchor"],
            visual_symbol=design.get("visual_symbol", ""),
            detected=detected,
            facial_features_override=design.get("facial_features_override", False),
            two_panel_mode=two_panel_mode,
            two_panel_named_char=two_panel_named_char,
            two_panel_archetype=two_panel_archetype,
        )

        errs = run_preflight(prompt, image_id, template_kind="example_sentence")
        if errs:
            fails.append((image_id, errs))
            print(f"FAIL {image_id}:")
            for e in errs:
                print(f"   - {e}")
            continue
        style_refs = [NAMED_CHARACTERS[name]["portraitPath"] for name in detected]
        print(f"PASS {image_id}  pattern={design['pattern']:<28} detected={detected} refs={len(style_refs)} sym={'Y' if design.get('visual_symbol') or two_panel_mode else 'N'}")

        new_entry = {
            "imageId": image_id,
            "word": design["sentence_jp"],
            "reading": "",
            "en": design["sentence_en"],
            "vocab_type": "example_sentence",
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "preflight_passed": True,
            "retries": 0,
            "created_at": now_iso,
            "styleReferences": style_refs,
            "_meta": {
                "source": "X-c-6 v3 (2026-05-27) — Template C v4.0.7 + PART 3.9 v4.0.7 + Gemini 3 round review",
                "supersedes": "X-c-5 v2 (2026-05-26 / PART 3.9 v4.0.6 / not generated)",
                "pattern": design["pattern"],
                "detected_named_characters": detected,
                "patternId": next((p["id"] for p in lesson["patterns"] for e in p["examples"] if e["imageId"] == image_id), None),
                "isAnchor": examples_by_id[image_id].get("isAnchor", False),
                "has_visual_symbol": bool(design.get("visual_symbol")) or bool(two_panel_mode),
                "two_panel_mode": two_panel_mode,
                "facial_features_override": design.get("facial_features_override", False),
            },
        }
        if image_id in by_id:
            skill["vocabulary"][by_id[image_id]] = new_entry
            overwritten += 1
        else:
            skill["vocabulary"].append(new_entry)

    if fails:
        print(f"\n[ABORT] {len(fails)} entries failed preflight — not writing to JSON.")
        sys.exit(1)

    covered = sorted({e["vocab_type"] for e in skill["vocabulary"]})
    skill["_meta"]["mode"] = "skill"
    skill["_meta"]["guideVersion"] = "v5.0"
    skill["_meta"]["guideManifestHash"] = compute_manifest_hash()
    skill["_meta"]["generatedAt"] = now_iso
    skill["_meta"]["generator"] = ".claude/skills/generate-image-prompt.md + scripts/_xc_l_ex_L01_prompts_v3.py"
    skill["_meta"]["model"] = "claude-opus-4-7"
    skill["_meta"]["totalEntries"] = len(skill["vocabulary"])
    skill["_meta"]["coveredVocabTypes"] = covered

    SKILL_JSON_PATH.write_text(
        json.dumps(skill, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\n[OK] overwrote {overwritten} ex_L01_* entries (v3). total = {len(skill['vocabulary'])}.")
    print(f"     guideManifestHash = {skill['_meta']['guideManifestHash']}")


if __name__ == "__main__":
    main()
