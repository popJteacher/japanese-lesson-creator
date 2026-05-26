# -*- coding: utf-8 -*-
"""X-c-4 v2: char_* portrait 5 件を PART 5.8 + 5.3 + 5.9 統合方針で再起案する。

旧版 (_xc_d_char_portrait_prompts.py) は PART 5.9 visual_hints のみ手書きで、
PART 5.8 role signature / PART 5.3 phenotype profile を利用せず head-body
proportion も bias-resist 弱かった。X-c-7 user 実視で ケリー / リン が 5-6
頭身 + role signature 弱 (cardigan vs blouse のみ等) と判明、再起案。

新方針:
  (1) Outfit DOMINANT signature = PART 5.8 ROLE_BASED_GENERIC_PROFILES から取得
      鈴木/ケリー = teacher / リン = student / キム = company_employee / タノム = doctor
  (2) Phenotype = PART 5.3 + 5.4 経由の標準 profile 文 + 5.9 character overlay
  (3) Head-body proportion = PART 1.10 + 数値直書き + bias-resist 警告
  (4) PART 5.2 nationality silhouette/fit/palette は適用しない (named character
      には冗長・role signature を弱める)
  (5) ROLE_ANTI_FLAG_BLOCK 維持 (named character は nationality card ではない)
"""
import datetime
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL_JSON_PATH = ROOT / "data" / "image_prompts_skill.json"
PREFLIGHT_SCRIPT = ROOT / "scripts" / "lib" / "prompt_preflight.py"

ROLE_ANTI_FLAG_BLOCK = (
    "The clothing, accessories, props, and any visible badges must NEVER include "
    "any flag, national emblem, nationality pin, country indicator, political symbol, "
    "or red-and-white circular badge. This is a character portrait of a specific person, "
    "not a nationality card."
)

HEAD_BODY_BLOCK_STRONG = """HEAD-BODY PROPORTION RULE (v4.0 PART 1.10) — CRITICAL FOR THIS GENERATION:
  - 7-HEAD-HEIGHT proportion (head height = approximately 1/7 of total body height).
  - In this 1:1 square frame, the standing figure occupies ~80% of the image HEIGHT.
    The HEAD alone occupies ~11-12% of the IMAGE HEIGHT (= 1/7 × 80%).
    LEGS from hip to floor occupy ~40% of image height.
  - NEVER render with 5-6 head proportion — that reads as childlike, cartoonish,
    or anime-cliche. {BIAS_NOTE}
  - {AGE_TEXT} — a working-age adult, NOT a teenager, NOT anime-style.
""".strip()

FACIAL_FEATURES_BLOCK = """FACIAL FEATURES RULE (v4.0 PART 1.8): The character's face MUST clearly show
all four primary facial features — eyes (with visible pupils, not blank circles),
eyebrows (simple curved or angled lines above the eyes), nose (a simple line or
dot or small shape), and mouth (a simple line or curve or small shape). NEVER
omit any of these four features. A faceless silhouette, blank face, partially-
rendered face, or 'stylized stock illustration without facial detail' is NOT
permitted. Facial features must be drawn in the same flat illustration style as
the rest of the body — minimal but visibly present.""".strip()

SCENE_ACTION_BLOCK = """[SCENE & ACTION]
ASPECT RATIO: The output image MUST be 1:1 SQUARE — equal width and height
(e.g., 1024×1024). DO NOT output 16:9 widescreen, 4:3 landscape, 3:4 vertical,
9:16 portrait, or any other ratio. Square 1:1 only.
FULL-BODY SHOT — the entire figure from the very top of the head to the soles
of BOTH feet is fully inside the frame, with a clear empty margin above the
head and a visible strip of empty ground below both feet. This is NOT a
portrait, headshot, or waist-up crop.
The standing figure spans roughly 80% of the image HEIGHT (measured by height,
NOT by area), centered horizontally. Empty background on the left and right
is expected and correct — do NOT zoom or crop in to fill the sides.
Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at
the subject's eye height (not above, not below) and rotated approximately
30-45 degrees to one side. DO NOT use an overhead or bird's-eye angle.
DO NOT crop the body at the head, neck, waist, hips, thighs, or knees.
Both feet and a small patch of the flat ground directly beneath them must
be clearly visible.
FOOTWEAR RULE (v3.11 / PART 1.11): Both feet MUST visibly wear the footwear
specified in the [SUBJECT] section above. Barefoot is NOT permitted.
Solid soft cream off-white background (warm off-white, NOT pure stark white).
No other characters or objects in the frame.
Framed as with a standard ~50mm-equivalent lens at full standing distance
(NOT an 85mm tight portrait lens).""".strip()

STYLE_RECIPE_BLOCK = """[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with
consistent line weight. Completely flat solid color fills only. Color palette:
soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue and warm amber gold as accents,
cool slate gray for secondary elements. This should look like it belongs in
a brand style guide, not like AI art. Keep line weights consistent.""".strip()


def build_prompt(*, target_desc, phenotype_block, outfit_block, pose_expression,
                 age_text, bias_note):
    head_body = HEAD_BODY_BLOCK_STRONG.format(
        BIAS_NOTE=bias_note, AGE_TEXT=age_text
    )
    return f"""
[PURPOSE]
Create a canonical character portrait illustration for Japanese language
learning materials. The image must instantly communicate the visual identity
of {target_desc} at a glance. This portrait is the canonical reference image
that subsequent example_sentence prompts (PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE)
will attach to maintain cross-example identity consistency. Identity is
conveyed through phenotype, outfit signature, and mandatory props ONLY —
the character's personal name MUST NEVER appear in the image.

[SUBJECT]
{phenotype_block}

{outfit_block}

Pose and expression: {pose_expression}
The character's role must be immediately obvious from clothing, posture, and
props alone — at a glance the viewer must read the correct profession.

{FACIAL_FEATURES_BLOCK}

{head_body}

{SCENE_ACTION_BLOCK}

{STYLE_RECIPE_BLOCK}

[CONSTRAINTS]
No text, no letters, no numbers, no decorative symbols anywhere — including
titles, labels, captions, watermarks, or any text overlay at any position in
the rendered output. Any ID badge / name badge worn is a PLAIN BLANK
RECTANGLE with no text, no icon, no graphic.
{ROLE_ANTI_FLAG_BLOCK}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""".strip()


CHARACTERS = [
    {
        "imageId": "char_鈴木",
        "word": "鈴木さん",
        "reading": "すずきさん",
        "en": "Suzuki-sensei (canonical Japanese male language teacher in lesson_01)",
        "params": {
            "target_desc": "a Japanese male language teacher (canonical lesson_01 character)",
            "age_text": "Working-age adult in his 40s to 50s",
            "phenotype_block": (
                "A specific adult Japanese man in his 40s to 50s.\n"
                "Phenotype (per PART 5.3 east_asian profile + PART 5.9 character-specific overlay):\n"
                "  fair to light-medium skin with East Asian features and salt-and-pepper short hair\n"
                "  (dark-brown to grey, neatly combed, parted to one side)."
            ),
            "outfit_block": (
                "Outfit (PART 5.9 Japanese-teacher overlay on PART 5.8 ROLE_BASED_GENERIC_PROFILES teacher signature):\n"
                "  - A conservative navy or charcoal business suit jacket and matching trousers,\n"
                "    with a crisp plain white dress shirt and a subtle solid slate-gray necktie.\n"
                "    (Note: in Japan, senior male teachers typically wear business suits rather than\n"
                "    the international cardigan-and-blouse teacher uniform — preserve this cultural fit.)\n"
                "  - He MUST visibly wear a rectangular plastic name-tag-style ID badge clipped to a\n"
                "    thin strap or cord at chest level — the badge is a plain blank rectangle with\n"
                "    NO text, NO icon, NO graphic, NO drawing of any kind on it. (rectangular shape,\n"
                "    NOT a circular pendant or medallion.)\n"
                "  - He MUST visibly hold one thick textbook with a clearly visible spine and pages,\n"
                "    tucked under one arm or clasped against the chest.\n"
                "  - Footwear MUST be plain dark leather loafers, visibly on both feet."
            ),
            "pose_expression": (
                "standing upright in a calm, composed senior educator's posture with both feet flat "
                "on the ground at shoulder width, body angled at a 3/4 view, the textbook clasped "
                "against the chest under one arm and the lanyard badge hanging at upper-chest level. "
                "Expression: warm but reserved closed-mouth smile suggesting decades of teaching "
                "experience, eyes engaged with the viewer."
            ),
            "bias_note": (
                "Particular bias warning: a 40s-50s man in a business suit can bias nanobanana toward "
                "a slightly stocky / shorter middle-aged office-worker proportion. RESIST this — "
                "render as a tall, mature adult educator with 7-head proportion."
            ),
        },
    },
    {
        "imageId": "char_リン",
        "word": "リンさん",
        "reading": "りんさん",
        "en": "Lin-san (canonical Chinese female university student in lesson_01)",
        "params": {
            "target_desc": "a Chinese female university student (canonical lesson_01 character)",
            "age_text": "Working-age young adult in her early 20s",
            "phenotype_block": (
                "A specific adult Chinese woman in her early 20s.\n"
                "Phenotype (per PART 5.3 east_asian profile + PART 5.9 character-specific overlay):\n"
                "  fair to light-medium skin with East Asian features and long straight dark-brown to\n"
                "  black hair reaching past the shoulders."
            ),
            "outfit_block": (
                "Outfit (per PART 5.8 ROLE_BASED_GENERIC_PROFILES student signature):\n"
                "  - Casual smart clothes — a simple solid muted-blue short-sleeve crew-neck top or\n"
                "    light sweater, paired with well-fitting plain blue jeans. NO formal business attire.\n"
                "  - She MUST visibly wear a plain canvas backpack on both shoulders with both shoulder\n"
                "    straps clearly visible from the front.\n"
                "  - She MUST visibly hold one closed spiral notebook in one hand at her side.\n"
                "  - Footwear MUST be plain low-profile white canvas sneakers, visibly on both feet."
            ),
            "pose_expression": (
                "standing upright in a light, friendly young-adult stance with both feet flat on the "
                "ground at shoulder width, body angled at a 3/4 view, the notebook held in one hand "
                "at the side and both backpack shoulder straps visible over the shoulders. "
                "Expression: bright open friendly smile with alert curious eyes — a welcoming "
                "language-learner vibe."
            ),
            "bias_note": (
                "Particular bias warning: a young woman with a backpack composition biases nanobanana "
                "toward an anime-style high-school / teen 5-6 head proportion. RESIST this — render "
                "as a young ADULT university student in her early 20s with full 7-head proportion."
            ),
        },
    },
    {
        "imageId": "char_ケリー",
        "word": "ケリーさん",
        "reading": "けりーさん",
        "en": "Kelly-sensei (canonical American female language teacher in lesson_01)",
        "params": {
            "target_desc": "an American female language teacher with Northern-European phenotype (canonical lesson_01 character)",
            "age_text": "Working-age adult in her 30s to 40s",
            "phenotype_block": (
                "A specific adult American woman in her 30s to 40s.\n"
                "Phenotype (per PART 5.3 northern_eu profile + PART 5.9 character-specific overlay):\n"
                "  fair skin with straight to wavy light-brown to honey-blonde shoulder-length hair,\n"
                "  parted to one side. Western Northern-European features."
            ),
            "outfit_block": (
                "Outfit (per PART 5.8 ROLE_BASED_GENERIC_PROFILES teacher signature):\n"
                "  - Professional but approachable — a soft cream-colored blouse layered under a\n"
                "    muted warm-blue simple cardigan, paired with plain dark-navy slacks.\n"
                "    Palette stays within the muted color family (white / muted warm blue /\n"
                "    cool slate gray / beige).\n"
                "  - She MUST visibly wear a rectangular plastic name-tag-style ID badge clipped to\n"
                "    a thin strap or cord at chest level — the badge is a plain blank rectangle with\n"
                "    NO text, NO icon, NO graphic. (rectangular shape, NOT a circular pendant.)\n"
                "  - She MUST visibly hold one thick textbook with a clearly visible spine and\n"
                "    pages, held under one arm against her side.\n"
                "  - Footwear MUST be plain dark leather low-profile loafers, visibly on both feet."
            ),
            "pose_expression": (
                "standing upright in an open, approachable teacher's stance with both feet flat on "
                "the ground at shoulder width, body angled at a 3/4 view, the lanyard badge hanging "
                "at upper-chest level and the textbook clasped under one arm. Expression: warm "
                "engaging open smile with open friendly eyes."
            ),
            "bias_note": (
                "Particular bias warning: a woman with a cardigan + textbook composition biases "
                "nanobanana toward 'anime-cute teacher' 5-6 head proportions. RESIST this bias — "
                "render as a tall, mature adult educator with 7-head proportion."
            ),
        },
    },
    {
        "imageId": "char_キム",
        "word": "キムさん",
        "reading": "きむさん",
        "en": "Kim-san (canonical Korean male company employee in lesson_01)",
        "params": {
            "target_desc": "a Korean male company employee (canonical lesson_01 character)",
            "age_text": "Working-age young adult in his mid-to-late 20s",
            "phenotype_block": (
                "A specific adult Korean man in his mid-to-late 20s.\n"
                "Phenotype (per PART 5.3 east_asian profile + PART 5.9 character-specific overlay):\n"
                "  fair to light-medium skin with East Asian features and short neat dark-brown to\n"
                "  black hair, parted to one side. He wears slim rectangular glasses with thin\n"
                "  slate-gray frames as his identity signature."
            ),
            "outfit_block": (
                "Outfit (per PART 5.8 ROLE_BASED_GENERIC_PROFILES company_employee signature):\n"
                "  - A navy blue or charcoal gray business suit (jacket + matching trousers), with\n"
                "    a crisp white or pale-blue dress shirt and a simple solid muted-blue necktie.\n"
                "  - He MUST visibly carry a slim solid-color leather briefcase or laptop bag held\n"
                "    by the handle in one hand at his side. (The briefcase / laptop bag is the\n"
                "    mandatory role signature distinguishing company_employee from student.)\n"
                "  - Footwear MUST be plain dark leather loafers, visibly on both feet."
            ),
            "pose_expression": (
                "standing upright in a professional but slightly relaxed young office-worker stance "
                "with both feet flat on the ground at shoulder width, body angled at a 3/4 view, "
                "the briefcase or laptop bag held by the handle at his side. Expression: polite "
                "composed closed-mouth smile with attentive eyes behind the slim rectangular glasses."
            ),
            "bias_note": (
                "Particular bias warning: a 20s man in a business suit can bias nanobanana toward "
                "the anime salaryman cliché 5-6 head proportion. RESIST this — render as a tall, "
                "young ADULT office worker with full 7-head proportion."
            ),
        },
    },
    {
        "imageId": "char_タノム",
        "word": "タノムさん",
        "reading": "たのむさん",
        "en": "Tanom-san (canonical Vietnamese male doctor in lesson_01)",
        "params": {
            "target_desc": "a Vietnamese male doctor (canonical lesson_01 character)",
            "age_text": "Working-age young adult in his mid-to-late 20s",
            "phenotype_block": (
                "A specific adult Vietnamese man in his mid-to-late 20s.\n"
                "Phenotype (per PART 5.3 southeast_asian profile + PART 5.9 character-specific overlay):\n"
                "  light-medium to medium olive-brown skin with Southeast Asian features and short\n"
                "  straight dark-brown to black hair, neatly trimmed."
            ),
            "outfit_block": (
                "Outfit (per PART 5.8 ROLE_BASED_GENERIC_PROFILES doctor signature):\n"
                "  - A clean open white doctor's coat (knee-length, fully open at the front)\n"
                "    worn over a simple plain muted-blue button-up shirt and plain dark slacks.\n"
                "  - He MUST visibly wear a slate-gray stethoscope draped around the back of the\n"
                "    neck with both ends hanging forward at chest level (the chestpiece resting\n"
                "    on the chest area above the coat pocket).\n"
                "  - He MUST visibly wear a small rectangular plastic name badge clipped to the\n"
                "    open white coat lapel — the badge is a plain blank rectangle with NO text,\n"
                "    NO icon, NO graphic.\n"
                "  - Footwear MUST be plain white low-profile canvas sneakers, visibly on both feet."
            ),
            "pose_expression": (
                "standing upright in a calm, attentive doctor's stance with both feet flat on the "
                "ground at shoulder width, body angled at a 3/4 view, both arms relaxed at the "
                "sides with the stethoscope draped around the back of the neck and hanging forward. "
                "Expression: kind reassuring closed-mouth smile with gentle attentive eyes."
            ),
            "bias_note": (
                "Particular bias warning: a young man in a white doctor's coat can bias nanobanana "
                "toward an anime-medical-school 5-6 head proportion. RESIST this — render as a "
                "young ADULT working doctor with full 7-head proportion."
            ),
        },
    },
]


def run_preflight(text, word):
    payload = json.dumps({"text": text, "template_kind": "person", "word": word}, ensure_ascii=False)
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

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    overwritten = 0
    fails = []

    for c in CHARACTERS:
        prompt = build_prompt(**c["params"])
        errs = run_preflight(prompt, c["imageId"])
        if errs:
            fails.append((c["imageId"], errs))
            print(f"FAIL {c['imageId']}:")
            for e in errs:
                print(f"   - {e}")
            continue
        print(f"PASS {c['imageId']}")
        new_entry = {
            "imageId": c["imageId"],
            "word": c["word"],
            "reading": c["reading"],
            "en": c["en"],
            "vocab_type": "character_asset",
            "prompt": prompt,
            "aspect_ratio": "1:1",
            "preflight_passed": True,
            "retries": 0,
            "created_at": now_iso,
            "styleReferences": [],
            "_meta": {
                "source": "X-c-4 v2 (2026-05-26) — PART 5.8 + 5.3 + 5.9 統合方針再起案",
                "design_choice": "Option C — PART 5.8 role signature dominant / PART 5.3 phenotype profile / PART 5.9 char overlay / PART 1.10 強化",
                "supersedes": "X-c-4 v1 (旧版 — PART 5.9 visual_hints のみ手書き)",
            },
        }
        if c["imageId"] in by_id:
            skill["vocabulary"][by_id[c["imageId"]]] = new_entry
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
    skill["_meta"]["generator"] = ".claude/skills/generate-image-prompt.md + scripts/_xc_g_char_portraits_v2.py"
    skill["_meta"]["model"] = "claude-opus-4-7"
    skill["_meta"]["totalEntries"] = len(skill["vocabulary"])
    skill["_meta"]["coveredVocabTypes"] = covered

    SKILL_JSON_PATH.write_text(
        json.dumps(skill, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\n[OK] overwrote {overwritten} char_* entries. total = {len(skill['vocabulary'])}.")
    print(f"     guideManifestHash = {skill['_meta']['guideManifestHash']}")


if __name__ == "__main__":
    main()
