# -*- coding: utf-8 -*-
"""X-c-5: ex_L01_001..018 の Template C example_sentence prompt を構築し、
preflight 通過後に data/image_prompts_skill.json に append する。

PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE 準拠:
  - sentence + sceneCharacters の UNION で NAMED_CHARACTER 検出
  - 各検出 char の portraitPath を styleReferences[] に push
  - {NAMED_CHARACTER_REFERENCES} block を render (ROLE+ASPECT addressing)
  - 0 件検出時は [REFERENCE] section 全体を省略

[generate-image-prompt mode=lesson-examples --lesson 01] skill の決定論版実装。
skill の Step 1-6 を Python で再現するが、生成プロセスは Claude (この session) が
直接 prompt 本文を起案するのではなく、per-example の SCENE_DESCRIPTION 等を
本ファイルに inline で hardcoded した上で Template C にレンダリングする。
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
# PART 5.9 NAMED_CHARACTER_PROFILES (抽出 / portraitPath + 短形 hints)
# ─────────────────────────────────────────────────────────────
NAMED_CHARACTER_PROFILES = {
    "鈴木": {
        "portraitPath": "data/images/char_鈴木.png",
        "role_ja": "先生",
        "role_en": "Japanese language teacher",
        "nationality": "Japanese",
        "age_text": "in his 40s to 50s",
        "inherit_aspects": "FACE STRUCTURE, HAIR (graying salt-and-pepper short), OUTFIT (navy or charcoal business suit with white shirt and slate-gray necktie), 7-head ADULT BUILD, and East Asian phenotype",
        "visual_summary": "a Japanese male language teacher in his 40s-50s with salt-and-pepper short hair, wearing a navy or charcoal business suit with a white dress shirt, holding a thick textbook with visible spine",
    },
    "リン": {
        "portraitPath": "data/images/char_リン.png",
        "role_ja": "大学生",
        "role_en": "Chinese female university student",
        "nationality": "Chinese",
        "age_text": "in her early 20s",
        "inherit_aspects": "FACE STRUCTURE, HAIR (long straight dark-brown to black, past the shoulders), OUTFIT (muted-blue short-sleeve top + plain blue jeans), CANVAS BACKPACK with both straps visible, 7-head ADULT BUILD, and East Asian phenotype",
        "visual_summary": "a Chinese female university student in her early 20s with long straight dark hair, wearing a muted-blue top with blue jeans and a canvas backpack, carrying a notebook",
    },
    "ケリー": {
        "portraitPath": "data/images/char_ケリー.png",
        "role_ja": "先生",
        "role_en": "American female language teacher",
        "nationality": "American",
        "age_text": "in her 30s to 40s",
        "inherit_aspects": "FACE STRUCTURE, HAIR (light-brown to honey-blonde shoulder-length), OUTFIT (soft cream blouse layered under muted warm-blue cardigan + dark-navy slacks), LANYARD NAME BADGE (plain blank rectangular card), 7-head ADULT BUILD, and Western Northern-European phenotype",
        "visual_summary": "an American female language teacher in her 30s-40s with light-brown to honey-blonde shoulder-length hair, wearing a soft cream blouse under a muted warm-blue cardigan",
    },
    "キム": {
        "portraitPath": "data/images/char_キム.png",
        "role_ja": "会社員",
        "role_en": "Korean male company employee",
        "nationality": "Korean",
        "age_text": "in his mid-to-late 20s",
        "inherit_aspects": "FACE STRUCTURE, HAIR (short neat dark-brown to black, parted to one side), SLIM RECTANGULAR GLASSES with thin slate-gray frames, OUTFIT (light-blue button-up shirt without tie + charcoal slacks), SLIM LAPTOP BAG held by handle, 7-head ADULT BUILD, and East Asian phenotype",
        "visual_summary": "a Korean male company employee in his mid-to-late 20s with short neat dark hair and slim rectangular glasses, wearing a light-blue button-up shirt with charcoal slacks, carrying a slim laptop bag",
    },
    "タノム": {
        "portraitPath": "data/images/char_タノム.png",
        "role_ja": "医者",
        "role_en": "Vietnamese male doctor",
        "nationality": "Vietnamese",
        "age_text": "in his mid-to-late 20s",
        "inherit_aspects": "FACE STRUCTURE, HAIR (short dark-brown to black), MEDIUM-BROWN warm skin and Southeast Asian phenotype, OUTFIT (open white doctor's coat over muted-blue button-up shirt and dark slacks), STETHOSCOPE draped around the neck with both ends hanging forward at chest level, and 7-head ADULT BUILD",
        "visual_summary": "a Vietnamese male doctor in his mid-to-late 20s with medium-brown skin and short dark hair, wearing an open white doctor's coat over a muted-blue shirt with a stethoscope around the neck",
    },
}

# ─────────────────────────────────────────────────────────────
# 18 example の per-scene 設計
#   sentence_en: 英訳
#   scene: シーンの自然言語記述 (Template C [SCENE & ACTION] {SCENE_DESCRIPTION})
#   visual_symbol: question/checkmark/X mark 等 ({VISUAL_SYMBOL_IF_NEEDED})
#   composition: 16:9 composition 追加指示 ({COMPOSITION_NOTES})
# ─────────────────────────────────────────────────────────────
EXAMPLES = {
    "ex_L01_001": {
        "sentence_jp": "鈴木さんは先生です。",
        "sentence_en": "Suzuki-san is a teacher.",
        "scene": "The Japanese male language teacher (鈴木) stands in a calm Japanese classroom context — a clean cream off-white classroom wall behind him, with a faint flat-vector whiteboard at the side suggesting a teaching setting. He holds his thick textbook against his chest and looks slightly toward the viewer.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the right-center of the frame at about 60% frame height; the left third holds the suggestion of a whiteboard at the edge to anchor the classroom context.",
    },
    "ex_L01_002": {
        "sentence_jp": "リンさんは大学生です。",
        "sentence_en": "Lin-san is a university student.",
        "scene": "The Chinese female university student (リン) stands on a university campus walkway. A flat-vector campus context — a simple low-rise academic building edge and a few muted-green leafy trees — is visible behind her at small scale. She wears her canvas backpack with both shoulder straps over her shoulders and holds a notebook in one hand.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center-right at about 60% frame height; the left half holds the small-scale campus backdrop (academic building edge + trees) so the university context reads at a glance.",
    },
    "ex_L01_003": {
        "sentence_jp": "キムさんは会社員です。",
        "sentence_en": "Kim-san is a company employee.",
        "scene": "The Korean male company employee (キム) stands on a city sidewalk in front of a generic office building lobby. A flat-vector mid-rise office building edge with a simple glass-curtain-wall suggestion sits behind him at small scale. He carries his slim laptop bag by the handle at his side.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center at about 60% frame height; the right side holds a small flat-vector office building edge so the company-context reads at a glance. No signage text on the building.",
    },
    "ex_L01_004": {
        "sentence_jp": "鈴木さんは日本人です。",
        "sentence_en": "Suzuki-san is Japanese.",
        "scene": "The Japanese male language teacher (鈴木) stands centered, holding his thick textbook against his chest. The cream background is plain — no scene context beyond the figure — emphasizing the character's identity as the sole signal. The character's East Asian phenotype and conservative business suit serve as the visual cue for Japanese nationality.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character is centered horizontally at about 60% frame height with generous empty cream margins on both sides. No additional scene elements — pure identity card composition.",
    },
    "ex_L01_005": {
        "sentence_jp": "リンさんは中国人です。",
        "sentence_en": "Lin-san is Chinese.",
        "scene": "The Chinese female university student (リン) stands centered with her canvas backpack on her back and notebook in hand. The cream background is plain — no scene context beyond the figure — emphasizing the character's identity as the sole signal. The character's East Asian phenotype and casual smart wear serve as the visual cue for Chinese nationality.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character is centered horizontally at about 60% frame height with generous empty cream margins on both sides. No additional scene elements.",
    },
    "ex_L01_006": {
        "sentence_jp": "リンさんですか。",
        "sentence_en": "Are you Lin-san?",
        "scene": "The Chinese female university student (リン) stands at the right side of the frame, looking slightly toward the left where a large flat-vector question mark hovers in the air at upper-chest level. The question mark is the symbolic cue that someone (off-frame) is asking about her identity. She has a faint, slightly uncertain closed-mouth expression as if being addressed.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red (per PART 2 STYLE_BIBLE.educational_symbol_colors.symbol_red), positioned at upper-chest level to the left of the character.",
        "composition": "Wide 16:9 horizontal frame. The character occupies the right third at about 60% frame height. The question mark sits in the left-center of the frame so the visual signal 'someone is asking about her' reads at a glance.",
    },
    "ex_L01_007": {
        "sentence_jp": "はい、リンさんです。／いいえ、リンさんじゃありません。",
        "sentence_en": "Yes, I am Lin-san. / No, I am not Lin-san.",
        "scene": "A 2-panel layout split vertically down the middle by a thin flat-vector divider line. LEFT PANEL (affirmative 'はい'): the Chinese female university student (リン) stands centered in the panel with a small flat-vector green checkmark hovering at her upper-chest level on her side, indicating affirmation. RIGHT PANEL (negative 'いいえ'): the SAME character (リン) stands centered in the panel with a small flat-vector red X mark hovering at her upper-chest level on her side, indicating denial. The character looks identical in both panels — same outfit, same hair, same expression baseline — but with a subtle smile on the left and a subtle apologetic head-tilt on the right.",
        "visual_symbol": "A small muted symbolic green checkmark in the left panel and a small muted symbolic red X mark in the right panel, each positioned near the character's upper chest. No question mark.",
        "composition": "Wide 16:9 horizontal frame divided into 2 equal vertical panels by a thin slate-navy divider line at the center. Each panel holds one full-body figure at about 60% panel height. Both figures must be the same character — same identity, same outfit, same pose — only the symbol and micro-expression differ.",
    },
    "ex_L01_008": {
        "sentence_jp": "だれですか。",
        "sentence_en": "Who is it?",
        "scene": "A single generic adult figure stands centered in the frame with their face area rendered as a soft slate-gray silhouette — features intentionally indistinct (no clear eyes, nose, or mouth, just a featureless head shape filled in slate-gray) to convey 'unknown identity'. The body is rendered normally in flat vector (plain muted-blue casual top and dark slacks, with simple sneakers) so 'a person' is unambiguous, but WHO they are is the open question. A large flat-vector question mark in muted symbolic red hovers above and to the side of the figure at head level.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red, positioned above and to one side of the figure at head level.",
        "composition": "Wide 16:9 horizontal frame. The figure is centered at about 60% frame height. The question mark sits in the upper portion of the frame near the figure's head so the 'unknown identity' signal reads at a glance. NO NAMED_CHARACTER reference is used (this is the generic 'who' sentence).",
        "facial_features_override": True,  # special: face is intentionally silhouette
    },
    "ex_L01_009": {
        "sentence_jp": "キムさんです。",
        "sentence_en": "It is Kim-san.",
        "scene": "The Korean male company employee (キム) stands centered in the frame, fully visible and clearly identified — slim rectangular glasses, light-blue button-up shirt with charcoal slacks, slim laptop bag held by the handle at his side. A small flat-vector arrow (muted symbolic orange) gently points toward him from the upper-left, suggesting 'this person is the answer'. He looks slightly toward the viewer with a polite composed smile.",
        "visual_symbol": "A small flat-vector arrow in muted symbolic orange, gently pointing toward the character from the upper-left of the frame at head-to-shoulder level. No question mark.",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center at about 60% frame height. The arrow sits in the upper-left corner so the 'this is who it is' signal reads at a glance.",
    },
    "ex_L01_010": {
        "sentence_jp": "先生ですか。",
        "sentence_en": "Are you a teacher?",
        "scene": "The Japanese male language teacher (鈴木) stands at the right side of the frame, holding his thick textbook against his chest. A large flat-vector question mark in muted symbolic red hovers at his upper-chest level in the left-center of the frame, indicating that someone (off-frame) is asking him 'Are you a teacher?'. He has a calm, slightly engaged closed-mouth expression as if listening to the question.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red, positioned at upper-chest level to the left of the character.",
        "composition": "Wide 16:9 horizontal frame. The character occupies the right third at about 60% frame height. The question mark sits in the left-center of the frame.",
    },
    "ex_L01_011": {
        "sentence_jp": "はい、先生です。／いいえ、先生じゃありません。",
        "sentence_en": "Yes, I am a teacher. / No, I am not a teacher.",
        "scene": "A 2-panel layout split vertically down the middle by a thin flat-vector divider line. LEFT PANEL (affirmative 'はい'): the Japanese male language teacher (鈴木) stands centered in the panel holding his thick textbook against his chest with a small flat-vector green checkmark hovering at his upper-chest level on his side. RIGHT PANEL (negative 'いいえ'): the SAME character (鈴木) stands centered in the panel WITHOUT the textbook (the prop is replaced by an empty open hand at his side) and with a small flat-vector red X mark hovering at his upper-chest level on his side, indicating denial of the teacher role. The character looks identical in both panels — same suit, same hair, same face — only the prop, symbol, and micro-expression differ.",
        "visual_symbol": "A small muted symbolic green checkmark in the left panel and a small muted symbolic red X mark in the right panel. The prop (textbook) appears only in the left panel; in the right panel the same character has no textbook, signaling denial of the teacher role.",
        "composition": "Wide 16:9 horizontal frame divided into 2 equal vertical panels by a thin slate-navy divider line at the center. Each panel holds one full-body figure at about 60% panel height. Both figures must be the same character — same identity, same outfit, same face — only the symbol, the textbook presence, and the micro-expression differ.",
    },
    "ex_L01_012": {
        "sentence_jp": "韓国人ですか。",
        "sentence_en": "Are you Korean?",
        "scene": "The Korean male company employee (キム) stands at the right side of the frame, slim rectangular glasses and laptop bag visible. A large flat-vector question mark in muted symbolic red hovers at his upper-chest level in the left-center of the frame, indicating that someone (off-frame) is asking him 'Are you Korean?'. He has a calm, slightly engaged closed-mouth expression.",
        "visual_symbol": "A single large flat-vector question mark in muted symbolic red, positioned at upper-chest level to the left of the character.",
        "composition": "Wide 16:9 horizontal frame. The character occupies the right third at about 60% frame height. The question mark sits in the left-center.",
    },
    "ex_L01_013": {
        "sentence_jp": "はい、韓国人です。／いいえ、韓国人じゃありません。",
        "sentence_en": "Yes, I am Korean. / No, I am not Korean.",
        "scene": "A 2-panel layout split vertically down the middle by a thin flat-vector divider line. LEFT PANEL (affirmative 'はい'): the Korean male company employee (キム) stands centered in the panel with a small flat-vector green checkmark hovering at his upper-chest level on his side, indicating affirmation of Korean identity. RIGHT PANEL (negative 'いいえ'): the SAME character (キム) stands centered in the panel with a small flat-vector red X mark hovering at his upper-chest level on his side, indicating denial of Korean identity. The character looks identical in both panels — same glasses, same outfit, same face, same laptop bag — only the symbol and micro-expression differ.",
        "visual_symbol": "A small muted symbolic green checkmark in the left panel and a small muted symbolic red X mark in the right panel.",
        "composition": "Wide 16:9 horizontal frame divided into 2 equal vertical panels by a thin slate-navy divider line at the center. Each panel holds one full-body figure at about 60% panel height. Both figures must be the same character.",
    },
    "ex_L01_014": {
        "sentence_jp": "タノムさんは東西病院の医者です。",
        "sentence_en": "Tanom-san is a doctor at Tozai Hospital.",
        "scene": "The Vietnamese male doctor (タノム) stands at the center-right of the frame in his open white doctor's coat with stethoscope around the neck. A flat-vector hospital building edge sits behind him at small scale on the left side — a clean cream off-white mid-rise building facade with a recognizable hospital entrance (wide automatic-style doors implied by a simple wide opening, with a small cross emblem on the wall to suggest hospital, NO English text on the building). The doctor looks slightly toward the viewer with a kind reassuring expression.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center-right at about 60% frame height; the left half holds the small-scale hospital building edge so the affiliation context reads at a glance. The cross emblem is a small flat-vector shape (NO text), suggesting hospital function.",
    },
    "ex_L01_015": {
        "sentence_jp": "鈴木さんは東西学校の先生です。",
        "sentence_en": "Suzuki-san is a teacher at Tozai School.",
        "scene": "The Japanese male language teacher (鈴木) stands at the center-right of the frame holding his thick textbook against his chest. A flat-vector school building edge sits behind him at small scale on the left side — a 2-3 story cream off-white institutional school building with a slate-grey hip roof and a partial view of a central clock tower with a circular clock face (the school signature feature per PART 5.10), NO English signboard text visible. The teacher looks slightly toward the viewer with his calm composed expression.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center-right at about 60% frame height; the left half holds the small-scale school building edge with partial clock tower so the school affiliation reads at a glance.",
    },
    "ex_L01_016": {
        "sentence_jp": "キムさんは東西銀行の会社員です。",
        "sentence_en": "Kim-san is a company employee at Tozai Bank.",
        "scene": "The Korean male company employee (キム) stands at the center-right of the frame with his slim laptop bag held by the handle at his side. A flat-vector bank building edge sits behind him at small scale on the left side — a cream off-white institutional bank building with classical pillars at the entrance (the universal 'bank' visual signature) and a slate-grey roof, NO English signboard text visible.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center-right at about 60% frame height; the left half holds the small-scale bank building edge with pillars so the bank affiliation reads at a glance.",
    },
    "ex_L01_017": {
        "sentence_jp": "リンさんは東西大学の学生です。",
        "sentence_en": "Lin-san is a student at Tozai University.",
        "scene": "The Chinese female university student (リン) stands at the center-right of the frame with her canvas backpack on her back and notebook in one hand. A flat-vector university campus edge sits behind her at small scale on the left side — a low-rise cream off-white academic building with a slate-grey hip roof and large arched windows (the university signature), with a few muted-green leafy trees flanking it. NO English signboard text visible.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center-right at about 60% frame height; the left half holds the small-scale university building edge with trees so the campus affiliation reads at a glance.",
    },
    "ex_L01_018": {
        "sentence_jp": "キムさんは東西デパートの会社員です。",
        "sentence_en": "Kim-san is a company employee at Tozai Department Store.",
        "scene": "The Korean male company employee (キム) stands at the center-right of the frame with his slim laptop bag held by the handle at his side. A flat-vector department store edge sits behind him at small scale on the left side — a cream off-white commercial mid-rise building with large flat display windows facing the street (the department store visual signature), and a slate-grey roof, NO English signboard text visible.",
        "visual_symbol": "",
        "composition": "Wide 16:9 horizontal frame. The character occupies the center-right at about 60% frame height; the left half holds the small-scale department store building edge with display windows so the store affiliation reads at a glance.",
    },
}


def detect_named_characters(sentence: str, scene_characters: list[str]) -> list[str]:
    """PART 1.14 detection algorithm — sentence string + sceneCharacters の UNION (順序保持)。"""
    detected_a = []
    for name in NAMED_CHARACTER_PROFILES.keys():
        pos = sentence.find(name)
        if pos >= 0:
            detected_a.append((pos, name))
    detected_a.sort(key=lambda x: x[0])
    sentence_order = [name for _, name in detected_a]

    union = list(sentence_order)
    for name in scene_characters:
        if name in NAMED_CHARACTER_PROFILES and name not in union:
            union.append(name)
    return union[:4]  # rule_a: max 4


def build_reference_block(detected: list[str]) -> str:
    """{NAMED_CHARACTER_REFERENCES} を rule_b ROLE+ASPECT addressing で render。"""
    lines = []
    for i, name in enumerate(detected, start=1):
        prof = NAMED_CHARACTER_PROFILES[name]
        lines.append(
            f"image_{i} = canonical portrait of the {prof['role_en']} ({name}さん, per PART 5.9 NAMED_CHARACTER_PROFILES). "
            f"Inherit {prof['inherit_aspects']} from this reference. "
            f"If the scene below requires a different outfit or activity, preserve face structure, hair, build, and phenotype while adapting surface clothing only."
        )
    return "\n".join(lines)


def build_character_descriptions(detected: list[str]) -> str:
    """{CHARACTER_DESCRIPTIONS} を scene 内に登場する NAMED_CHARACTER 列で構築。"""
    if not detected:
        return "A single generic adult figure (no specific NAMED_CHARACTER — see the scene description for treatment)."
    parts = []
    for name in detected:
        prof = NAMED_CHARACTER_PROFILES[name]
        parts.append(f"{prof['visual_summary']}, {prof['age_text']}")
    return "Characters in scene: " + "; ".join(parts) + ". Each character is a full-body figure with both feet inside the frame and footwear visibly worn on both feet."


def build_prompt(sentence_jp, sentence_en, scene, visual_symbol, composition, detected, facial_features_override=False):
    """Template C example_sentence prompt を組み立てる。

    - 0 件検出時は [REFERENCE] section 全体を省略 (PART 1.14 rule_c)
    - facial_features_override=True (だれですか) の場合は FACIAL FEATURES 必須記述を緩和
    """
    char_descriptions = build_character_descriptions(detected)

    if detected:
        reference_block = (
            "[REFERENCE]\n"
            "Attached reference images per PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE:\n"
            f"{build_reference_block(detected)}\n"
        )
    else:
        reference_block = ""

    if facial_features_override:
        facial_block = (
            "FACIAL FEATURES RULE (modified for だれですか): The figure's face is intentionally rendered as a soft slate-gray silhouette WITHOUT clear eyes, eyebrows, nose, or mouth — the entire head fills as a slate-gray flat shape to convey 'unknown identity'. This is an explicit and intentional exception to PART 1.8 for this sentence only. All OTHER body parts (hands, feet, posture) are rendered normally per the flat vector style."
        )
    else:
        facial_block = (
            "FACIAL FEATURES RULE (v4.0 PART 1.8): Every character figure in the image MUST clearly show all four primary facial features — eyes (with visible pupils, not blank circles), eyebrows (simple curved or angled lines above the eyes), nose (a simple line or dot or small shape), and mouth (a simple line or curve or small shape). NEVER omit any of these four features. A faceless silhouette, blank face, partially-rendered face, or 'stylized stock illustration without facial detail' is NOT permitted, even when the outfit (business suit, doctor coat, uniform, etc.) is the dominant role signature. Facial features must be drawn in the same flat illustration style as the rest of the body — minimal but visibly present."
        )

    visual_symbol_block = visual_symbol if visual_symbol else "No question mark, checkmark, or X mark in this scene."

    return f"""
[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
{sentence_jp} ({sentence_en})

{reference_block}[SUBJECT]
{char_descriptions}
{facial_block}
HEAD-BODY PROPORTION RULE (v4.0 PART 1.10): Every adult character figure MUST be rendered with approximately 7-head-height proportion (head height = approximately 1/7 of total body height). NEVER render adult roles with shorter 5-6 head proportions which read as childlike or cartoonish. This is especially important for figures with childhood-bias triggers — business suit + briefcase, school-style casual + backpack, uniforms — where nanobanana tends to default to anime salaryman/student cliché short proportions. Adult characters (approximately 20s-50s) must read as working-age adults by body proportion alone.
FOOTWEAR RULE (v3.11 / preserved in v4.0): Every character figure MUST visibly wear footwear on both feet (shoes, sandals, sneakers, loafers, work boots, or similar) whenever both feet are inside the frame. Barefoot is NOT permitted.
EXTERIOR BUILDING SIGNAGE RULE: Any building edges or backdrops referenced in the scene MUST be rendered WITHOUT any text — no signboard text, no English labels, no Japanese kanji or kana, no street numbers, no decorative letters. nanobanana frequently invents text on building surfaces; this is PROHIBITED.

[SCENE & ACTION]
{scene}
The characters' actions and relationship must make the sentence meaning visually obvious without any text.
{visual_symbol_block}

Composition: Wide 16:9 shot, 50mm standard lens equivalent (natural perspective).
Characters occupy 60% of the frame.
{composition}
Eye-level view. Simple minimal background with only essential context.
Main characters are clearly separated from the background in visual contrast.
Background base: soft cream off-white background (warm off-white, NOT pure stark white).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white), deep slate navy outlines, muted warm colors, warm amber gold accents for emphasis. This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image. VISUAL_SYMBOLS entries (question mark / checkmark / X mark / arrow) ARE PERMITTED when the visual symbol block above specifies them.
The clothing, accessories, props, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, or flag-print on garments. Nationality is conveyed by phenotype + outfit subtle palette tendency, not by flag display in example illustrations.
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
    existing_ids = {e["imageId"] for e in skill.get("vocabulary", [])}
    lesson = json.loads(LESSON_JSON_PATH.read_text(encoding="utf-8"))

    examples_by_id = {}
    for p in lesson.get("patterns", []):
        for ex in p.get("examples", []):
            examples_by_id[ex["imageId"]] = ex

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    new_entries = []
    fails = []

    for image_id, design in EXAMPLES.items():
        if image_id in existing_ids:
            print(f"SKIP {image_id}: already in image_prompts_skill.json")
            continue
        ex = examples_by_id.get(image_id)
        if not ex:
            fails.append(f"{image_id}: not found in lesson_01.json")
            continue
        scene_chars = ex.get("sceneCharacters", []) or []
        detected = detect_named_characters(design["sentence_jp"], scene_chars)

        prompt = build_prompt(
            sentence_jp=design["sentence_jp"],
            sentence_en=design["sentence_en"],
            scene=design["scene"],
            visual_symbol=design["visual_symbol"],
            composition=design["composition"],
            detected=detected,
            facial_features_override=design.get("facial_features_override", False),
        )

        errs = run_preflight(prompt, image_id, template_kind="example_sentence")
        if errs:
            fails.append((image_id, errs, prompt))
            print(f"FAIL {image_id}:")
            for e in errs:
                print(f"   - {e}")
            continue
        style_refs = [NAMED_CHARACTER_PROFILES[name]["portraitPath"] for name in detected]
        print(f"PASS {image_id}  detected={detected}  refs={len(style_refs)}")
        new_entries.append({
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
                "source": "X-c-5 (2026-05-26) skill mode=lesson-examples --lesson 01 (manual python impl)",
                "detected_named_characters": detected,
                "patternId": next((p["id"] for p in lesson["patterns"] for e in p["examples"] if e["imageId"] == image_id), None),
                "isAnchor": examples_by_id[image_id].get("isAnchor", False),
            },
        })

    if fails:
        print(f"\n[ABORT] {len(fails)} entries failed preflight — not writing to JSON.")
        sys.exit(1)

    if not new_entries:
        print("\n[NO-OP] all 18 entries already present.")
        return

    skill["vocabulary"].extend(new_entries)
    covered = sorted({e["vocab_type"] for e in skill["vocabulary"]})
    skill["_meta"]["mode"] = "skill"
    skill["_meta"]["guideVersion"] = "v5.0"
    skill["_meta"]["guideManifestHash"] = compute_manifest_hash()
    skill["_meta"]["generatedAt"] = now_iso
    skill["_meta"]["generator"] = ".claude/skills/generate-image-prompt.md + scripts/_xc_e_lesson_examples_prompts.py"
    skill["_meta"]["model"] = "claude-opus-4-7"
    skill["_meta"]["totalEntries"] = len(skill["vocabulary"])
    skill["_meta"]["coveredVocabTypes"] = covered

    SKILL_JSON_PATH.write_text(
        json.dumps(skill, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\n[OK] appended {len(new_entries)} entries. total = {len(skill['vocabulary'])}.")
    print(f"     guideManifestHash = {skill['_meta']['guideManifestHash']}")


if __name__ == "__main__":
    main()
