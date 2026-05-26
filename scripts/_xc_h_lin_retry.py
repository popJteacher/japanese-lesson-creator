# -*- coding: utf-8 -*-
"""X-c-6 (a) v3: リン portrait のみ backpack 強調で再起案。

v2 で `MUST visibly wear a plain canvas backpack on both shoulders with both
shoulder straps clearly visible from the front` と書いたが nanobanana が
backpack をほぼ非表示に省略した。本 retry では backpack を CRITICAL identity
prop として明示し、view geometry も specify する。
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


def build_prompt():
    return """
[PURPOSE]
Create a canonical character portrait illustration for Japanese language
learning materials. The image must instantly communicate the visual identity
of a Chinese female university student (canonical lesson_01 character) at a
glance. This portrait is the canonical reference image that subsequent
example_sentence prompts (PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE) will
attach to maintain cross-example identity consistency. Identity is conveyed
through phenotype, outfit signature, and mandatory props ONLY — the
character's personal name MUST NEVER appear in the image.

[SUBJECT]
A specific adult Chinese woman in her early 20s.
Phenotype (per PART 5.3 east_asian profile + PART 5.9 character-specific overlay):
  fair to light-medium skin with East Asian features and long straight
  dark-brown to black hair reaching past the shoulders.

Outfit (per PART 5.8 ROLE_BASED_GENERIC_PROFILES student signature):
  - Casual smart clothes — a simple solid muted-blue short-sleeve crew-neck
    top, paired with well-fitting plain blue jeans. NO formal business attire.
  - BACKPACK (CRITICAL identity prop — DO NOT omit):
      She MUST visibly wear a clearly drawn plain canvas backpack on her back.
      The backpack body itself must be VISIBLE behind the shoulders as a
      distinct rounded rectangular shape (in muted slate-gray or muted warm
      blue), NOT hidden behind the figure and NOT replaced by a shoulder bag
      or sling bag with a single diagonal strap.
      In the 3/4 view angle, the FAR shoulder strap (the strap on the side of
      the body that is rotated away from the camera) is fully visible from
      shoulder to lower torso. The NEAR shoulder strap (the strap on the side
      rotated toward the camera) may be partly hidden by the arm but its
      upper portion at the shoulder must still be clearly drawn.
      A clear silhouette of the backpack body must protrude beyond the
      contour of the torso on at least one side, confirming "she is wearing
      a backpack" at a single glance.
      DO NOT replace the backpack with: a crossbody bag, a tote bag, a
      handbag, a shoulder bag, a fanny pack, or no bag at all.
  - She MUST visibly hold one closed spiral notebook in one hand at her side.
  - Footwear MUST be plain low-profile white canvas sneakers, visibly on
    both feet.

Pose and expression: standing upright in a light, friendly young-adult
stance with both feet flat on the ground at shoulder width, body angled at
a 3/4 view, the notebook held in one hand at the side. Both backpack
shoulder straps and the visible portion of the backpack body behind the
shoulders are clearly drawn. Expression: bright open friendly smile with
alert curious eyes — a welcoming language-learner vibe.

FACIAL FEATURES RULE (v4.0 PART 1.8): The character's face MUST clearly
show all four primary facial features — eyes (with visible pupils, not
blank circles), eyebrows (simple curved or angled lines above the eyes),
nose (a simple line or dot or small shape), and mouth (a simple line or
curve or small shape). NEVER omit any of these four features. Drawn in
flat illustration style — minimal but visibly present.

HEAD-BODY PROPORTION RULE (v4.0 PART 1.10) — CRITICAL FOR THIS GENERATION:
  - 7-HEAD-HEIGHT proportion (head height = approximately 1/7 of total
    body height).
  - In this 1:1 square frame, the standing figure occupies ~80% of the
    image HEIGHT. The HEAD alone occupies ~11-12% of the IMAGE HEIGHT
    (= 1/7 × 80%). LEGS from hip to floor occupy ~40% of image height.
  - NEVER render with 5-6 head proportion — that reads as childlike,
    cartoonish, or anime-cliche. Particular bias warning: a young woman
    with a backpack composition strongly biases nanobanana toward
    anime-style high-school / teen 5-6 head proportion. RESIST this —
    render as a young ADULT university student in her early 20s with full
    7-head proportion. The legs must be visibly LONG (~40% of image
    height from hip to ground), not short.
  - Working-age young adult (early 20s), NOT a teenager, NOT anime-style.

[SCENE & ACTION]
ASPECT RATIO: The output image MUST be 1:1 SQUARE — equal width and height
(e.g., 1024×1024). DO NOT output 16:9 widescreen, 4:3 landscape, 3:4
vertical, 9:16 portrait, or any other ratio. Square 1:1 only.
FULL-BODY SHOT — the entire figure from the very top of the head to the
soles of BOTH feet is fully inside the frame, with a clear empty margin
above the head and a visible strip of empty ground below both feet. This
is NOT a portrait, headshot, or waist-up crop.
The standing figure spans roughly 80% of the image HEIGHT (measured by
height, NOT by area), centered horizontally. Empty background on the left
and right is expected and correct.
Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned
at the subject's eye height (not above, not below) and rotated approximately
30-45 degrees to one side. This is critical for backpack visibility — the
3/4 angle reveals the backpack body protruding behind the shoulders. DO NOT
use an overhead or bird's-eye angle. DO NOT crop the body at the head,
neck, waist, hips, thighs, or knees. Both feet and a small patch of the
flat ground directly beneath them must be clearly visible.
FOOTWEAR RULE (v3.11 / PART 1.11): Both feet MUST visibly wear the plain
low-profile white canvas sneakers specified in the [SUBJECT] section.
Solid soft cream off-white background (warm off-white, NOT pure stark white).
No other characters or objects in the frame.
Framed as with a standard ~50mm-equivalent lens at full standing distance
(NOT an 85mm tight portrait lens).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with
consistent line weight. Completely flat solid color fills only. Color
palette: soft cream off-white background (warm off-white, NOT pure stark
white), deep slate navy outlines, muted warm blue and warm amber gold as
accents, cool slate gray for secondary elements. This should look like it
belongs in a brand style guide, not like AI art. Keep line weights
consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no decorative symbols anywhere — including
titles, labels, captions, watermarks, or any text overlay at any position
in the rendered output.
""".strip() + "\n" + ROLE_ANTI_FLAG_BLOCK + "\n" + """No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.""".strip()


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

    prompt = build_prompt()
    errs = run_preflight(prompt, "char_リン")
    if errs:
        print("FAIL char_リン:")
        for e in errs:
            print(f"   - {e}")
        sys.exit(1)
    print("PASS char_リン")

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    new_entry = {
        "imageId": "char_リン",
        "word": "リンさん",
        "reading": "りんさん",
        "en": "Lin-san (canonical Chinese female university student in lesson_01)",
        "vocab_type": "character_asset",
        "prompt": prompt,
        "aspect_ratio": "1:1",
        "preflight_passed": True,
        "retries": 0,
        "created_at": now_iso,
        "styleReferences": [],
        "_meta": {
            "source": "X-c-6 v3 リン retry (2026-05-26) — backpack CRITICAL identity prop emphasis",
            "supersedes": "X-c-4 v2 (backpack 非表示問題への retry)",
        },
    }
    if "char_リン" in by_id:
        skill["vocabulary"][by_id["char_リン"]] = new_entry
    else:
        skill["vocabulary"].append(new_entry)

    covered = sorted({e["vocab_type"] for e in skill["vocabulary"]})
    skill["_meta"]["mode"] = "skill"
    skill["_meta"]["guideVersion"] = "v5.0"
    skill["_meta"]["guideManifestHash"] = compute_manifest_hash()
    skill["_meta"]["generatedAt"] = now_iso
    skill["_meta"]["generator"] = ".claude/skills/generate-image-prompt.md + scripts/_xc_h_lin_retry.py"
    skill["_meta"]["model"] = "claude-opus-4-7"
    skill["_meta"]["totalEntries"] = len(skill["vocabulary"])
    skill["_meta"]["coveredVocabTypes"] = covered

    SKILL_JSON_PATH.write_text(
        json.dumps(skill, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"[OK] overwrote char_リン. total = {len(skill['vocabulary'])}.")
    print(f"     guideManifestHash = {skill['_meta']['guideManifestHash']}")


if __name__ == "__main__":
    main()
