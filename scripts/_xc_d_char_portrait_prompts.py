# -*- coding: utf-8 -*-
"""X-c-4: char_* portrait 5 件の prompt を Template A 準拠で手書きし、
preflight に通過したら data/image_prompts_skill.json に append する。

design choice: Option C (PART 5.9 character_visual_hints を skill JSON に直挿入)。
PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE が参照する portrait の起点となるため、
他キャラ ref は attach しない (PART 5.9 line 351: generation 時は素 prompt)。

vocab_type は PART 5.9 line 351 の "character_asset" を採用。preflight の template_kind
は "person" を渡して C1 full-body / C4 BG / C5 NOT_TOKEN を厳格に通す。
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

# ROLE_ANTI_FLAG_BLOCK (PART 6.4) — 固定キャラは nationality card ではないので flag を排除
ROLE_ANTI_FLAG_BLOCK = (
    "The clothing, accessories, props, and any visible badges must NEVER include "
    "any flag, national emblem, nationality pin, country indicator, political symbol, "
    "or red-and-white circular badge. This is a character portrait, not a nationality card."
)


def build_prompt(*, target_desc, phenotype, hair, outfit, mandatory_prop, footwear, pose, expression, age_text):
    """Template A vocabulary_person 準拠の prompt を構築する。

    PART 5.9 visual_hints からの per-character 変数を埋め込み、
    PART 1.8 FACIAL FEATURES / PART 1.10 HEAD-BODY PROPORTION / PART 1.11 FOOTWEAR を inline で適用。
    """
    return f"""
[PURPOSE]
Create a canonical character portrait illustration for Japanese language learning materials.
The image must instantly communicate the visual identity of {target_desc} at a glance.
This portrait is the canonical reference image that subsequent example_sentence prompts (PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE) will attach to maintain cross-example identity consistency. Identity is conveyed through phenotype, outfit signature, and mandatory props ONLY — the character's personal name MUST NEVER appear in the image (no nameplate, no badge text, no caption).

[SUBJECT]
A specific adult person, {age_text}, with {phenotype}, {hair}. The character wears {outfit}. {mandatory_prop}. Footwear MUST be {footwear}.
Pose and expression: {pose}. Expression: {expression}.
The character's role must be immediately obvious from clothing, posture, and props alone.
FACIAL FEATURES RULE (v4.0 PART 1.8): The character's face MUST clearly show all four primary facial features — eyes (with visible pupils, not blank circles), eyebrows (simple curved or angled lines above the eyes), nose (a simple line or dot or small shape), and mouth (a simple line or curve or small shape). NEVER omit any of these four features. A faceless silhouette, blank face, partially-rendered face, or 'stylized stock illustration without facial detail' is NOT permitted, even when the outfit (business suit, doctor coat, uniform, etc.) is the dominant role signature. Facial features must be drawn in the same flat illustration style as the rest of the body — minimal but visibly present.
HEAD-BODY PROPORTION RULE (v4.0 PART 1.10): The character MUST be rendered as an adult standing figure with approximately 7-head-height proportion (head height = approximately 1/7 of total body height). NEVER render adult roles with shorter 5-6 head proportions which read as childlike or cartoonish. This is especially important for role cards with childhood-bias triggers — business suit + briefcase, school-style casual + backpack, uniforms — where nanobanana tends to default to anime salaryman/student cliché short proportions. The character must read as a working-age adult by body proportion alone.

[SCENE & ACTION]
ASPECT RATIO: The output image MUST be 1:1 SQUARE — equal width and height (e.g., 1024×1024). DO NOT output 16:9 widescreen, 4:3 landscape, 3:4 vertical, 9:16 portrait, or any other ratio. Square 1:1 only.
FULL-BODY SHOT — the entire figure from the very top of the head to the soles of BOTH feet is fully inside the frame, with a clear empty margin above the head and a visible strip of empty ground below both feet. This is NOT a portrait, headshot, or waist-up crop.
The standing figure spans roughly 80% of the image HEIGHT (measured by height, NOT by area), centered horizontally. Empty background on the left and right is expected and correct — do NOT zoom or crop in to fill the sides; that side margin is intentional.
Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at the subject's eye height (not above, not below) and rotated approximately 30-45 degrees to one side. This is a diagonal front view that shows both the front face and a partial side view of the body simultaneously while preserving natural body proportions. DO NOT use an overhead or bird's-eye angle. DO NOT crop the body at the head, neck, waist, hips, thighs, or knees. Both feet and a small patch of the flat ground directly beneath them must be clearly visible.
FOOTWEAR RULE (v3.11 / PART 1.11): Both feet MUST visibly wear the footwear specified above. Barefoot is NOT permitted in vocabulary cards.
Solid soft cream off-white background (warm off-white, NOT pure stark white). No other characters or objects in the frame.
Framed as with a standard ~50mm-equivalent lens at full standing distance (NOT an 85mm tight portrait lens).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white), deep slate navy outlines, muted warm blue and warm amber gold as accents, cool slate gray for secondary elements. This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no decorative symbols anywhere — including titles, labels, captions, watermarks, or any text overlay at any position in the rendered output.
{ROLE_ANTI_FLAG_BLOCK}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""".strip()


# ─────────────────────────────────────────────────────────────
# Per-character data (PART 5.9 NAMED_CHARACTER_PROFILES から抽出)
# ─────────────────────────────────────────────────────────────
CHARACTERS = [
    {
        "imageId": "char_鈴木",
        "word": "鈴木さん",
        "reading": "すずきさん",
        "en": "Suzuki-sensei (canonical Japanese male language teacher in lesson_01)",
        "params": {
            "target_desc": "a Japanese male language teacher (canonical lesson_01 character)",
            "age_text": "in his 40s to 50s",
            "phenotype": "light-medium to olive skin with East Asian features",
            "hair": "salt-and-pepper short hair (dark-brown to grey, neatly combed)",
            "outfit": "a conservative business suit — a navy or charcoal jacket and matching trousers — with a crisp plain white dress shirt and a subtle solid slate-gray necktie",
            "mandatory_prop": "He MUST visibly carry a thick textbook with the spine showing, held against the chest under one arm",
            "footwear": "plain dark leather loafers",
            "pose": "standing upright in a calm, composed teacher's posture with both feet flat on the ground at shoulder width, body angled at a 3/4 view, the textbook clasped against the chest under one arm",
            "expression": "warm but reserved closed-mouth smile suggesting a senior educator's experience, eyes engaged with the viewer",
        },
    },
    {
        "imageId": "char_リン",
        "word": "リンさん",
        "reading": "りんさん",
        "en": "Lin-san (canonical Chinese female university student in lesson_01)",
        "params": {
            "target_desc": "a Chinese female university student (canonical lesson_01 character)",
            "age_text": "in her early 20s",
            "phenotype": "fair to light-medium skin with East Asian features",
            "hair": "long straight dark-brown to black hair reaching past the shoulders",
            "outfit": "casual smart attire — a simple solid muted-blue short-sleeve crew-neck top tucked into well-fitting plain blue jeans",
            "mandatory_prop": "She MUST visibly wear a small plain canvas backpack on the back with both shoulder straps clearly visible, AND MUST visibly carry a closed notebook in one hand",
            "footwear": "plain low-profile white canvas sneakers",
            "pose": "standing upright in a light, friendly stance with both feet flat on the ground, body angled at a 3/4 view, one hand holding the notebook and the other arm relaxed at the side, both backpack shoulder straps over the shoulders",
            "expression": "bright open friendly smile with alert curious eyes — a welcoming language-learner vibe",
        },
    },
    {
        "imageId": "char_ケリー",
        "word": "ケリーさん",
        "reading": "けりーさん",
        "en": "Kelly-sensei (canonical American female language teacher in lesson_01)",
        "params": {
            "target_desc": "an American female language teacher with Western Northern-European phenotype (canonical lesson_01 character)",
            "age_text": "in her 30s to 40s",
            "phenotype": "fair to light-medium skin with Western Northern-European features",
            "hair": "light-brown to honey-blonde shoulder-length straight hair, parted to one side",
            "outfit": "smart casual layering — a soft cream-colored blouse layered under a muted warm-blue cardigan, paired with plain dark-navy slacks",
            "mandatory_prop": "She MUST visibly wear a small simple lanyard name badge around the neck — the badge is a plain blank rectangular card with NO text, NO icon, NO graphic — AND MUST visibly carry a thick textbook with the spine showing, held under one arm",
            "footwear": "plain dark leather low-profile loafers",
            "pose": "standing upright in an open, approachable teacher's stance with both feet flat on the ground, body angled at a 3/4 view, the lanyard badge hanging at upper-chest level and the textbook clasped under one arm",
            "expression": "warm engaging open smile with open friendly eyes",
        },
    },
    {
        "imageId": "char_キム",
        "word": "キムさん",
        "reading": "きむさん",
        "en": "Kim-san (canonical Korean male company employee in lesson_01)",
        "params": {
            "target_desc": "a Korean male company employee (canonical lesson_01 character)",
            "age_text": "in his mid-to-late 20s",
            "phenotype": "fair to light-medium skin with East Asian features",
            "hair": "short neat dark-brown to black hair, parted to one side",
            "outfit": "business casual — a crisp plain light-blue button-up dress shirt without a tie (collar visible), paired with charcoal slacks; he wears slim rectangular glasses with thin slate-gray frames",
            "mandatory_prop": "He MUST visibly carry a slim solid-color laptop bag held by its handle in one hand at his side",
            "footwear": "plain dark leather loafers",
            "pose": "standing upright in a professional but slightly relaxed office-worker stance with both feet flat on the ground, body angled at a 3/4 view, the laptop bag held by the handle at his side",
            "expression": "polite composed closed-mouth smile with attentive eyes behind the glasses",
        },
    },
    {
        "imageId": "char_タノム",
        "word": "タノムさん",
        "reading": "たのむさん",
        "en": "Tanom-san (canonical Vietnamese male doctor in lesson_01)",
        "params": {
            "target_desc": "a Vietnamese male doctor (canonical lesson_01 character)",
            "age_text": "in his mid-to-late 20s",
            "phenotype": "medium-brown warm skin with Southeast Asian features",
            "hair": "short dark-brown to black hair, neatly trimmed",
            "outfit": "a clean open white doctor's coat (knee-length, fully open at the front) worn over a plain muted-blue button-up shirt and plain dark slacks",
            "mandatory_prop": "He MUST visibly wear a slate-gray stethoscope draped around the back of the neck with both ends hanging forward at chest level (the chestpiece resting just above the coat pocket)",
            "footwear": "plain white low-profile canvas sneakers",
            "pose": "standing upright in a calm, attentive doctor's stance with both feet flat on the ground, body angled at a 3/4 view, both arms relaxed at the sides with the stethoscope draped around the neck",
            "expression": "kind reassuring closed-mouth smile with gentle attentive eyes",
        },
    },
]


def run_preflight(text, word):
    """preflight を template_kind=person で実行し、errors list を返す。"""
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
    """PART 1-6 guide files から sha256[:12] を再算出 (PART 6.7 algorithm)。"""
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

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    new_entries = []
    all_pass = True

    for c in CHARACTERS:
        if c["imageId"] in existing_ids:
            print(f"SKIP {c['imageId']}: already in image_prompts_skill.json")
            continue
        prompt = build_prompt(**c["params"])
        errs = run_preflight(prompt, c["imageId"])
        if errs:
            all_pass = False
            print(f"FAIL {c['imageId']}:")
            for e in errs:
                print(f"   - {e}")
            continue
        print(f"PASS {c['imageId']}")
        new_entries.append({
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
                "source": "X-c-4 (2026-05-26) handcraft per PART 5.9 NAMED_CHARACTER_PROFILES",
                "design_choice": "Option C — handwritten via Template A vocabulary_person + ROLE_ANTI_FLAG_BLOCK",
            },
        })

    if not all_pass:
        print("\n[ABORT] some entries failed preflight — not writing to JSON.")
        sys.exit(1)

    if not new_entries:
        print("\n[NO-OP] all 5 entries already present.")
        return

    skill["vocabulary"].extend(new_entries)
    covered = sorted({e["vocab_type"] for e in skill["vocabulary"]})
    skill["_meta"]["mode"] = "skill"
    skill["_meta"]["guideVersion"] = "v5.0"
    skill["_meta"]["guideManifestHash"] = compute_manifest_hash()
    skill["_meta"]["generatedAt"] = now_iso
    skill["_meta"]["generator"] = ".claude/skills/generate-image-prompt.md + scripts/_xc_d_char_portrait_prompts.py"
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
