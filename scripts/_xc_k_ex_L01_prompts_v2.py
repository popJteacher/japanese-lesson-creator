# -*- coding: utf-8 -*-
"""X-c-5 v2: ex_L01_001..018 prompts を Template C v4.0.6 + PART 3.9 v4.0.6 で再起案。

v1 (text-only) で実証された 5 つの失敗を Gemini 第二意見と統合して修正:
  (1) aspect ratio drift (16:9 → 1:1)    → [STRICT LAYOUT DIRECTIVE] block emit
  (2) identity-only standing pose         → role-specific canonical action
  (3) affiliation = building-front collage → indoor action at the institution
  (4) symbol leakage (giant orange arrow) → conditional {SYMBOL_PERMISSION_CLAUSE}
  (5) outfit redundancy with portrait ref → lean [CHARACTER_DESCRIPTIONS]

これらは PART 3.9 (5 subsections) + PART 4 Template C 改修済 + skill md 反映済。本
スクリプトはガイドに従って 18 件の prompt を機械的に組み立てる。
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
# 18 example の per-scene 設計 (v2 / PART 3.9 v4.0.6 準拠)
#   pattern: identity_role / identity_nationality / question_id / question_role /
#            question_nationality / answer_2panel_id / answer_2panel_role /
#            answer_2panel_nationality / who_silhouette / id_reveal / affiliation
#   scene_action: 屋内/屋外/2-panel etc を具体記述
#   horizontal_anchor: 16:9 enforcement のため左右に伸びる要素
#   visual_symbol: "" (no symbol) or 記述文 (PERMISSION clause emit)
# ─────────────────────────────────────────────────────────────
EXAMPLES = {
    # === p1 (5 declarative identity sentences) ===
    "ex_L01_001": {
        "pattern": "identity_role",
        "sentence_jp": "鈴木さんは先生です。",
        "sentence_en": "Suzuki-san is a teacher.",
        "scene_action": "An indoor scene set inside a bright, minimalist Japanese classroom. The Japanese male language teacher (鈴木さん, per attached portrait) stands behind a simple wooden teacher's podium at the right-center of the frame, in mid-lesson posture: one hand holding his thick textbook open against his chest, the other hand gesturing toward a large blank whiteboard. He looks slightly toward the viewer with a warm, confident, engaging closed-mouth smile.",
        "horizontal_anchor": "A wide, completely blank flat-vector whiteboard spans across the LEFT HALF of the frame from the left edge inward to the center — large enough to occupy roughly 40% of the canvas width — anchoring the 16:9 horizontal layout. A simple flat classroom wall extends behind it to the right edge.",
        "visual_symbol": "",
    },
    "ex_L01_002": {
        "pattern": "identity_role",
        "sentence_jp": "リンさんは大学生です。",
        "sentence_en": "Lin-san is a university student.",
        "scene_action": "An indoor scene set inside a modern university lecture hall. The Chinese female university student (リンさん, per attached portrait) is seated at a long horizontal row of student desks at the center-right of the frame, body angled at 3/4 view toward the viewer. Her open spiral notebook lies on the desk and she holds a simple pen in her writing hand, mid-note-taking posture. Her canvas backpack rests on the seat beside her with one strap visible.",
        "horizontal_anchor": "A long, continuous flat-vector lecture-hall desk row extends across the FULL BOTTOM HALF of the frame, edge to edge horizontally, with simple identical empty desk-and-chair silhouettes repeating to the left of her — anchoring the 16:9 horizontal layout. A blank lecture screen or simple wall extends behind to the upper portion.",
        "visual_symbol": "",
    },
    "ex_L01_003": {
        "pattern": "identity_role",
        "sentence_jp": "キムさんは会社員です。",
        "sentence_en": "Kim-san is a company employee.",
        "scene_action": "An indoor scene set inside a modern minimalist corporate office. The Korean male company employee (キムさん, per attached portrait) is seated at a wide office desk at the center-right of the frame, body angled toward the viewer in a professional working posture. His hands rest near a simple flat-panel computer monitor and a small stack of documents on the desk surface. He looks slightly toward the viewer with a polite composed closed-mouth smile.",
        "horizontal_anchor": "A wide, continuous flat-vector office desk surface extends across the FULL FRAME horizontally edge to edge — the desk + monitor + documents arrangement anchors the 16:9 horizontal layout. A minimalist office partition wall or window glass extends behind in the upper background.",
        "visual_symbol": "",
    },
    "ex_L01_004": {
        "pattern": "identity_nationality",
        "sentence_jp": "鈴木さんは日本人です。",
        "sentence_en": "Suzuki-san is Japanese.",
        "scene_action": "An indoor scene set inside the same Japanese classroom context. The Japanese male language teacher (鈴木さん, per attached portrait) is shown at the right-center of the frame in a calm, standing posture, body angled slightly toward the viewer, holding his textbook against his chest. The framing brings the character somewhat closer to the camera than ex_L01_001 so that his East Asian facial features and Japanese-male teacher silhouette read clearly. Expression: warm, reserved closed-mouth smile.",
        "horizontal_anchor": "A wide, plain flat-vector blackboard (slate-grey field, completely blank, no chalk marks, no text) spans across the LEFT HALF of the frame from left edge inward — anchoring the 16:9 horizontal layout.",
        "visual_symbol": "",
    },
    "ex_L01_005": {
        "pattern": "identity_nationality",
        "sentence_jp": "リンさんは中国人です。",
        "sentence_en": "Lin-san is Chinese.",
        "scene_action": "An indoor scene set inside the same university lecture hall context as ex_L01_002. The Chinese female university student (リンさん, per attached portrait) stands at the center-right of the frame in a casual upright posture, body angled at 3/4 toward the viewer, her canvas backpack on her back with both straps visible. She holds her closed spiral notebook in one hand at her side. The framing brings the character somewhat closer to the camera than ex_L01_002 so that her East Asian facial features and student silhouette read clearly. Expression: bright open friendly smile.",
        "horizontal_anchor": "A long row of empty lecture-hall desk silhouettes extends across the BOTTOM HALF of the frame edge to edge horizontally — anchoring the 16:9 horizontal layout. A blank wall extends behind.",
        "visual_symbol": "",
    },
    # === p2 (8 Q/A sentences) ===
    "ex_L01_006": {
        "pattern": "question_id",
        "sentence_jp": "リンさんですか。",
        "sentence_en": "Are you Lin-san?",
        "scene_action": "An indoor scene set inside the same university lecture hall context. The Chinese female university student (リンさん, per attached portrait) stands at the RIGHT side of the frame, body angled slightly toward the viewer (toward an off-frame speaker who is asking her identity). Her canvas backpack is on her back with straps visible, notebook in one hand at her side. Her expression is a slightly surprised, faintly uncertain closed-mouth response — as if being addressed by name.",
        "horizontal_anchor": "A long row of empty lecture-hall desks extends across the BOTTOM HALF of the frame edge to edge horizontally — anchoring the 16:9 horizontal layout.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red (per [PART 2 STYLE_BIBLE educational_symbol_colors.symbol_red](../../prompts/guide/part2_style_bible.md)) hovers in the LEFT-CENTER of the frame at the character's upper-chest level. It is exactly ONE question mark — no other symbols.",
    },
    "ex_L01_007": {
        "pattern": "answer_2panel_id",
        "sentence_jp": "はい、リンさんです。／いいえ、リンさんじゃありません。",
        "sentence_en": "Yes, I am Lin-san. / No, I am not Lin-san.",
        "scene_action": "A 2-PANEL composition split vertically down the middle by a thin slate-navy divider line that runs the full HEIGHT of the 16:9 frame, dividing the canvas into TWO EQUAL VERTICAL PANELS. LEFT PANEL (affirmative 'はい'): the Chinese female university student (リンさん, per attached portrait) stands centered in the panel in an open friendly stance with a subtle confirming closed-mouth smile. RIGHT PANEL (negative 'いいえ'): the SAME character (リンさん) stands centered in the panel with a subtle apologetic head-tilt and a slight hand-wave gesture indicating denial. In both panels, her canvas backpack is visible on her back, and her notebook is held in one hand. Same character, same outfit, same hair — only the symbol and micro-expression differ.",
        "horizontal_anchor": "The full-height vertical divider line at the exact horizontal CENTER of the frame is itself the 2-panel layout anchor. The 16:9 canvas is split into two equal 50%-width vertical panels.",
        "visual_symbol": "A small flat-vector green checkmark in muted symbolic green hovers in the LEFT PANEL at the character's upper-chest level. A small flat-vector red X mark in muted symbolic red hovers in the RIGHT PANEL at the character's upper-chest level. Exactly ONE checkmark and ONE X mark total — no other symbols.",
    },
    "ex_L01_008": {
        "pattern": "who_silhouette",
        "sentence_jp": "だれですか。",
        "sentence_en": "Who is it?",
        "scene_action": "An indoor scene set in a simple minimalist neutral interior (could be a classroom, hallway, or generic indoor space). A single generic adult standing figure occupies the right-center of the frame — wearing simple muted-blue casual top + dark slacks + simple sneakers (normal flat vector body). HOWEVER, the figure's face area is rendered as a UNIFORM SOFT SLATE-GRAY SILHOUETTE FILL — no eyes, no eyebrows, no nose, no mouth visible; the entire head is a featureless slate-gray flat shape, conveying 'identity unknown'. This is the intentional PART 1.8 FACIAL_FEATURES exception for this sentence only.",
        "horizontal_anchor": "A wide, simple flat-vector horizontal floor line + a simple wall horizon line extend across the FULL FRAME edge to edge — anchoring the 16:9 horizontal layout.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red hovers above and to one side of the figure at head level. Exactly ONE question mark — no other symbols.",
        "facial_features_override": True,
    },
    "ex_L01_009": {
        "pattern": "id_reveal",
        "sentence_jp": "キムさんです。",
        "sentence_en": "It is Kim-san.",
        "scene_action": "An indoor scene set in the same modern minimalist corporate office context as ex_L01_003. The Korean male company employee (キムさん, per attached portrait) stands at the CENTER of the frame, body angled slightly toward the viewer, clearly and confidently identified — slim rectangular glasses visible, business suit + tie visible, briefcase held by handle at his side. He looks directly toward the viewer with a polite composed closed-mouth smile, as the unambiguous answer to the implicit question 'who is it?'.",
        "horizontal_anchor": "A wide flat-vector office wall + a simple sleek office desk silhouette extend across the FULL FRAME horizontally edge to edge — anchoring the 16:9 horizontal layout. The desk is visible behind/beside him at simple flat scale.",
        "visual_symbol": "",
    },
    "ex_L01_010": {
        "pattern": "question_role",
        "sentence_jp": "先生ですか。",
        "sentence_en": "Are you a teacher?",
        "scene_action": "An indoor scene set inside the same Japanese classroom context as ex_L01_001. The Japanese male language teacher (鈴木さん, per attached portrait) stands at the RIGHT side of the frame near the teacher's podium, body angled slightly toward an off-frame speaker, holding his textbook against his chest. His expression is a calm, slightly engaged closed-mouth smile — as if listening to the question being asked.",
        "horizontal_anchor": "A wide, completely blank flat-vector whiteboard spans across the LEFT HALF of the frame from left edge inward — anchoring the 16:9 horizontal layout.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red hovers in the LEFT-CENTER of the frame at the character's upper-chest level. Exactly ONE question mark — no other symbols.",
    },
    "ex_L01_011": {
        "pattern": "answer_2panel_role",
        "sentence_jp": "はい、先生です。／いいえ、先生じゃありません。",
        "sentence_en": "Yes, I am a teacher. / No, I am not a teacher.",
        "scene_action": "A 2-PANEL composition split vertically by a thin slate-navy divider running the full HEIGHT of the 16:9 frame into TWO EQUAL VERTICAL PANELS. LEFT PANEL (affirmative 'はい'): the Japanese male language teacher (鈴木さん, per attached portrait) stands centered in the panel holding his thick textbook against his chest in a confident teacher's posture. RIGHT PANEL (negative 'いいえ'): the SAME character (鈴木さん) stands centered in the panel WITHOUT the textbook (one hand at his side, the other in a polite apologetic gesture, indicating denial of the teacher role). Same suit, same hair, same face — only the textbook presence + symbol + micro-expression differ.",
        "horizontal_anchor": "The full-height vertical divider line at the exact horizontal CENTER of the frame splits the 16:9 canvas into two equal 50%-width vertical panels.",
        "visual_symbol": "A small flat-vector green checkmark in muted symbolic green hovers in the LEFT PANEL at the character's upper-chest level. A small flat-vector red X mark in muted symbolic red hovers in the RIGHT PANEL at the character's upper-chest level. Exactly ONE checkmark and ONE X mark total — no other symbols.",
    },
    "ex_L01_012": {
        "pattern": "question_nationality",
        "sentence_jp": "韓国人ですか。",
        "sentence_en": "Are you Korean?",
        "scene_action": "An indoor scene set in the modern minimalist corporate office context. The Korean male company employee (キムさん, per attached portrait) stands at the RIGHT side of the frame, body angled slightly toward an off-frame speaker, slim rectangular glasses + business suit + briefcase clearly visible. His expression is a calm, slightly engaged closed-mouth smile — listening to the question.",
        "horizontal_anchor": "A wide flat-vector office wall + simple sleek office desk silhouette extend across the LEFT HALF of the frame from left edge inward — anchoring the 16:9 horizontal layout.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red hovers in the LEFT-CENTER of the frame at the character's upper-chest level. Exactly ONE question mark — no other symbols.",
    },
    "ex_L01_013": {
        "pattern": "answer_2panel_nationality",
        "sentence_jp": "はい、韓国人です。／いいえ、韓国人じゃありません。",
        "sentence_en": "Yes, I am Korean. / No, I am not Korean.",
        "scene_action": "A 2-PANEL composition split vertically by a thin slate-navy divider running the full HEIGHT of the 16:9 frame into TWO EQUAL VERTICAL PANELS. LEFT PANEL (affirmative 'はい'): the Korean male company employee (キムさん, per attached portrait) stands centered in the panel in a confident standing posture with a subtle confirming closed-mouth smile, briefcase held at his side. RIGHT PANEL (negative 'いいえ'): the SAME character (キムさん) stands centered in the panel with a subtle apologetic head-tilt + slight hand-wave gesture indicating denial, briefcase still held at his side. Same glasses, same suit, same face — only the symbol + micro-expression differ.",
        "horizontal_anchor": "The full-height vertical divider line at the exact horizontal CENTER of the frame splits the 16:9 canvas into two equal 50%-width vertical panels.",
        "visual_symbol": "A small flat-vector green checkmark in muted symbolic green hovers in the LEFT PANEL at the character's upper-chest level. A small flat-vector red X mark in muted symbolic red hovers in the RIGHT PANEL at the character's upper-chest level. Exactly ONE checkmark and ONE X mark total — no other symbols.",
    },
    # === p3 (5 affiliation sentences — INDOOR per v4.0.6 affiliation_indoor rule) ===
    "ex_L01_014": {
        "pattern": "affiliation",
        "sentence_jp": "タノムさんは東西病院の医者です。",
        "sentence_en": "Tanom-san is a doctor at Tozai Hospital.",
        "scene_action": "An indoor scene set INSIDE a bright, minimalist hospital consultation room. The Vietnamese male doctor (タノムさん, per attached portrait) stands at the right-center of the frame in a calm, welcoming consulting posture, body angled at 3/4 view toward the viewer (the patient's perspective), one hand gently resting near his stethoscope at chest level. His expression is a kind, reassuring closed-mouth smile with gentle attentive eyes.",
        "horizontal_anchor": "A wide medical consultation desk spans across the LEFT HALF of the frame from left edge inward, with a simple flat-panel medical monitor (displaying a blank textless interface — no diagrams, no charts) and a closed clipboard resting on the desk. A simple medical examination bed silhouette + horizontal medical equipment shelf extend along the upper-left wall — anchoring the 16:9 horizontal hospital interior.",
        "visual_symbol": "",
    },
    "ex_L01_015": {
        "pattern": "affiliation",
        "sentence_jp": "鈴木さんは東西学校の先生です。",
        "sentence_en": "Suzuki-san is a teacher at Tozai School.",
        "scene_action": "An indoor scene set INSIDE a school classroom (a Japanese school context — wider establishing shot than ex_L01_001). The Japanese male language teacher (鈴木さん, per attached portrait) stands at the right-center of the frame at his teacher's podium, mid-lesson, holding his textbook open against his chest while gesturing toward the wide blackboard. His expression is calm and engaged.",
        "horizontal_anchor": "A wide blank flat-vector blackboard (slate-grey field, completely blank, no chalk marks, no text) spans across the LEFT HALF of the frame from left edge inward. A row of empty student desk-and-chair silhouettes extends along the bottom edge of the frame from left to center — anchoring the 16:9 institutional school interior. Together the blackboard + student desks confirm the SCHOOL setting (vs the generic classroom of ex_L01_001).",
        "visual_symbol": "",
    },
    "ex_L01_016": {
        "pattern": "affiliation",
        "sentence_jp": "キムさんは東西銀行の会社員です。",
        "sentence_en": "Kim-san is a company employee at Tozai Bank.",
        "scene_action": "An indoor scene set INSIDE a bright, modern bank office (banking work area behind the customer counter). The Korean male company employee (キムさん, per attached portrait) is seated at a sleek minimalist desk at the center-right of the frame, body angled toward the viewer, in a focused professional working posture. His hands are near a simple flat-panel monitor and a calculator-shaped device on the desk surface. He looks slightly toward the viewer with a polite composed closed-mouth smile.",
        "horizontal_anchor": "A wide bank counter / teller window silhouette and a row of simple flat-vector cubicle partitions extend across the FULL UPPER HALF of the frame edge to edge horizontally, with a sleek banking desk in the foreground. Together they read unambiguously as 'inside a bank office' — anchoring the 16:9 banking interior.",
        "visual_symbol": "",
    },
    "ex_L01_017": {
        "pattern": "affiliation",
        "sentence_jp": "リンさんは東西大学の学生です。",
        "sentence_en": "Lin-san is a student at Tozai University.",
        "scene_action": "An indoor scene set INSIDE a university lecture hall (wider establishing shot than ex_L01_002 / 005). The Chinese female university student (リンさん, per attached portrait) is seated at her long lecture-hall desk at the center-right of the frame, body angled toward the viewer in a focused studying posture. Her open spiral notebook + open textbook lie on the desk surface, and she holds a pen poised mid-note. Her canvas backpack is on the seat beside her with one strap visible. Expression: alert, focused engagement.",
        "horizontal_anchor": "A long row of empty lecture-hall desks extends across the BOTTOM HALF of the frame edge to edge horizontally. A wide blank lecture screen or simple wall extends across the UPPER HALF of the frame edge to edge horizontally, reinforcing the institutional lecture-hall context — anchoring the 16:9 university interior.",
        "visual_symbol": "",
    },
    "ex_L01_018": {
        "pattern": "affiliation",
        "sentence_jp": "キムさんは東西デパートの会社員です。",
        "sentence_en": "Kim-san is a company employee at Tozai Department Store.",
        "scene_action": "An indoor scene set INSIDE a department store ground floor (sales floor near the main entrance — the employee work area). The Korean male company employee (キムさん, per attached portrait) stands at the right-center of the frame in a polite, professional welcoming posture: standing near a department store counter with one open hand gesturing welcomingly toward the entrance / shoppers (the viewer's perspective). His expression is a polite composed welcoming closed-mouth smile.",
        "horizontal_anchor": "A wide department store counter spans across the LEFT HALF of the frame from left edge inward, with simple flat-vector retail display window silhouettes (showing abstract clothing mannequin shapes — no text, no logos, no brand names) extending along the upper portion of the frame from left to center. Together they read unambiguously as 'inside a department store sales floor' — anchoring the 16:9 retail interior.",
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
            f"per PART 5.9 NAMED_CHARACTER_PROFILES). Inherit {prof['lean_inherit']} "
            f"from this reference. If this scene requires a different outfit or activity "
            f"than the portrait shows, preserve face structure, hair, build, and phenotype "
            f"while adapting surface clothing only."
        )
    return "\n".join(lines)


def build_character_descriptions(detected: list[str]) -> str:
    """v4.0.6 lean form: name role + portrait reference, NO outfit redescription."""
    if not detected:
        return ("Character in scene: a single generic adult figure (no specific "
                "NAMED_CHARACTER). See [SCENE & ACTION] for face/body treatment.")
    parts = []
    for i, name in enumerate(detected, start=1):
        prof = NAMED_CHARACTERS[name]
        parts.append(
            f"Character in scene: the {prof['role_en']} ({name}さん, {prof['age_text']}, "
            f"per attached portrait image_{i}). Identity (face/hair/outfit/build/phenotype) "
            f"is inherited from the portrait — do NOT redescribe."
        )
    return " ".join(parts)


def build_symbol_clause(visual_symbol: str) -> str:
    """v4.0.6 conditional symbol permission per PART 3.9 visual_symbol_restriction."""
    if visual_symbol:
        return (
            "VISUAL_SYMBOLS entries (question mark / checkmark / X mark / arrow) ARE "
            "PERMITTED — but ONLY exactly the symbols specified in the visual symbol "
            "block above. nanobanana MUST NEVER add any additional floating symbols, "
            "arrows, circles, or geometric shapes encircling characters or the scene."
        )
    return (
        "ABSOLUTELY NO floating symbols of any kind — no question marks, no checkmarks, "
        "no X marks, no arrows, no circles, no geometric shapes encircling characters, "
        "no callout balloons. The scene must communicate without any symbolic overlay."
    )


def build_visual_symbol_block(visual_symbol: str) -> str:
    if visual_symbol:
        return visual_symbol
    return "No visual symbol is used in this scene."


def build_prompt(*, sentence_jp, sentence_en, scene_action, horizontal_anchor,
                 visual_symbol, detected, facial_features_override=False):
    reference_block = build_reference_block(detected)
    if reference_block:
        reference_block = reference_block + "\n\n"

    char_descriptions = build_character_descriptions(detected)
    facial_block = FACIAL_FEATURES_OVERRIDE_BLOCK if facial_features_override else FACIAL_FEATURES_BLOCK
    symbol_block = build_visual_symbol_block(visual_symbol)
    symbol_clause = build_symbol_clause(visual_symbol)

    scene_combined = f"{scene_action}\n\n{horizontal_anchor}"

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

The scene above is built to satisfy PART 3.9 v4.0.6 (scene_action_focus /
affiliation_indoor / aspect_ratio_enforcement rule_b): the named character
is performing their canonical role action; if the sentence expresses
affiliation, the scene is INDOORS at the institution; and the background
includes a horizontally-stretching anchor that spans the 16:9 frame.

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
surfaces MUST be left BLANK — no signboard text, no English labels, no Japanese
kanji or kana, no street numbers, no logos. nanobanana frequently invents text
on building surfaces; this is PROHIBITED.
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
        lf = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n").rstrip(b"\n")
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

        prompt = build_prompt(
            sentence_jp=design["sentence_jp"],
            sentence_en=design["sentence_en"],
            scene_action=design["scene_action"],
            horizontal_anchor=design["horizontal_anchor"],
            visual_symbol=design.get("visual_symbol", ""),
            detected=detected,
            facial_features_override=design.get("facial_features_override", False),
        )

        errs = run_preflight(prompt, image_id, template_kind="example_sentence")
        if errs:
            fails.append((image_id, errs))
            print(f"FAIL {image_id}:")
            for e in errs:
                print(f"   - {e}")
            continue
        style_refs = [NAMED_CHARACTERS[name]["portraitPath"] for name in detected]
        print(f"PASS {image_id}  pattern={design['pattern']:<28} detected={detected} refs={len(style_refs)} sym={'Y' if design.get('visual_symbol') else 'N'}")

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
                "source": "X-c-5 v2 (2026-05-26) — Template C v4.0.6 + PART 3.9 v4.0.6 + Gemini review",
                "supersedes": "X-c-5 v1 (text-only path 一陣 / aspect drift / symbol leak / outfit redundancy)",
                "pattern": design["pattern"],
                "detected_named_characters": detected,
                "patternId": next((p["id"] for p in lesson["patterns"] for e in p["examples"] if e["imageId"] == image_id), None),
                "isAnchor": examples_by_id[image_id].get("isAnchor", False),
                "has_visual_symbol": bool(design.get("visual_symbol")),
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
    skill["_meta"]["generator"] = ".claude/skills/generate-image-prompt.md + scripts/_xc_k_ex_L01_prompts_v2.py"
    skill["_meta"]["model"] = "claude-opus-4-7"
    skill["_meta"]["totalEntries"] = len(skill["vocabulary"])
    skill["_meta"]["coveredVocabTypes"] = covered

    SKILL_JSON_PATH.write_text(
        json.dumps(skill, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\n[OK] overwrote {overwritten} ex_L01_* entries (v2). total = {len(skill['vocabulary'])}.")
    print(f"     guideManifestHash = {skill['_meta']['guideManifestHash']}")


if __name__ == "__main__":
    main()
