# -*- coding: utf-8 -*-
"""決定論 S列生成スクリプト（v3.2 主経路）— MVP: vocab_type=person のみ

入出力契約は docs/generator_contract.md を参照。
このスクリプトの設計原則:
  - v3.2 ガイドを Python モジュールとして直接 import する（文字列パース不可）。
  - GAS の build*Prompt_ は副経路フォールバックで v3.2 invariants を満たさないため
    参考にしない。
  - 出力 JSON は書き出し前に invariants C 相当の pre-flight 検査を通す。
    1 件でも違反があれば exit 非ゼロ・ファイルを書き出さない。
"""

import argparse
import datetime
import hashlib
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIDE_PATH = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_2.py")


def load_guide():
    spec = importlib.util.spec_from_file_location("guide_v3_2", GUIDE_PATH)
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


# ─────────────────────────────────────────────────────────────
# lesson_01 person 12 件の手動分類
# 出所: archive/misc/image_prompts_lesson01_v1_4.json の vocab_type 列。
# 将来は data/lesson_NN.json への取り込み（または GAS Vocabulary シート → repo）で置換する。
# ─────────────────────────────────────────────────────────────
PERSON_VOCAB_LESSON01 = [
    # ── 役割系 5（ROLE_BASED_GENERIC_PROFILES のキー） ──
    {"imageId":"word_医者","word":"医者","reading":"いしゃ","en":"doctor",
     "vocab_type":"person","kind":"role","role_key":"doctor"},
    {"imageId":"word_会社員","word":"会社員","reading":"かいしゃいん","en":"company employee",
     "vocab_type":"person","kind":"role","role_key":"company_employee"},
    {"imageId":"word_学生","word":"学生","reading":"がくせい","en":"student",
     "vocab_type":"person","kind":"role","role_key":"student"},
    {"imageId":"word_大学生","word":"大学生","reading":"だいがくせい","en":"university student",
     "vocab_type":"person","kind":"role","role_key":"student"},
    {"imageId":"word_先生","word":"先生","reading":"せんせい","en":"teacher",
     "vocab_type":"person","kind":"role","role_key":"teacher"},
    # ── 国籍系 7（NATIONALITY_NOUN_POLICY） ──
    {"imageId":"word_日本人","word":"日本人","reading":"にほんじん","en":"Japanese person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"white field with a single red circle in the center"},
    {"imageId":"word_中国人","word":"中国人","reading":"ちゅうごくじん","en":"Chinese person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"red field with a large yellow star and four smaller yellow stars in the upper-left corner"},
    {"imageId":"word_アメリカ人","word":"アメリカ人","reading":"あめりかじん","en":"American person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"red and white horizontal stripes with a small blue corner of white star shapes"},
    {"imageId":"word_韓国人","word":"韓国人","reading":"かんこくじん","en":"Korean person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"white field with a red-and-blue circle and black trigram marks"},
    {"imageId":"word_ブラジル人","word":"ブラジル人","reading":"ぶらじるじん","en":"Brazilian person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"green field with a yellow diamond and a small blue circle in the center"},
    {"imageId":"word_ベトナム人","word":"ベトナム人","reading":"べとなむじん","en":"Vietnamese person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"red field with a single large yellow star in the center"},
    {"imageId":"word_スペイン人","word":"スペイン人","reading":"すぺいんじん","en":"Spanish person",
     "vocab_type":"person","kind":"nationality",
     "flag_shape_and_colors":"red and yellow horizontal stripes with the yellow band twice as wide as each red band"},
]


# ─────────────────────────────────────────────────────────────
# 合成関数
# ─────────────────────────────────────────────────────────────
def compose_role_subject(g, role_key):
    """ROLE_BASED + 性別未指定 → CHARACTER_DESCRIPTION 文字列を組む"""
    role = g.ROLE_BASED_GENERIC_PROFILES[role_key]
    outfit_lines = "; ".join(role["outfit_hints"])
    return (
        f"A {role['role_en']} ({role['role_ja']}). "
        f"Outfit and props: {outfit_lines}. "
        f"The character's gender is unspecified — use a generic adult appearance with "
        f"warm medium skin tone, short to medium neat dark brown hair, "
        f"and a calm friendly expression. The role must be immediately readable from "
        f"clothing and props alone."
    )


def compose_role_pose():
    return ("Calm professional posture — standing relaxed with both feet flat on the ground, "
            "hands at the sides or lightly holding the role's typical prop; "
            "warm approachable expression")


def compose_nationality_subject(g, flag_shape_and_colors):
    return g.NATIONALITY_NOUN_POLICY["subject_block_pattern"].replace(
        "{FLAG_SHAPE_AND_COLORS}", flag_shape_and_colors
    )


def compose_nationality_pose():
    return ("Neutral approachable expression, relaxed standing pose with both feet flat "
            "on the ground, arms naturally at the sides")


def render_person(g, entry):
    template = g.PROMPT_TEMPLATES["vocabulary_person"]
    if entry["kind"] == "role":
        char_desc = compose_role_subject(g, entry["role_key"])
        char_pose = compose_role_pose()
    elif entry["kind"] == "nationality":
        char_desc = compose_nationality_subject(g, entry["flag_shape_and_colors"])
        char_pose = compose_nationality_pose()
    else:
        raise ValueError(f"unknown person kind: {entry['kind']}")
    text = (template
            .replace("[TARGET_WORD]", entry["word"])
            .replace("{CHARACTER_DESCRIPTION}", char_desc)
            .replace("{CHARACTER_POSE_AND_EXPRESSION}", char_pose))
    return text


# ─────────────────────────────────────────────────────────────
# Pre-flight invariants（invariants.mjs C 相当）
# ─────────────────────────────────────────────────────────────
BG_EXACT  = "soft cream off-white background (warm off-white, NOT pure stark white)"
NOT_TOKEN = "NOT pure stark white"

RE_FULLBODY     = re.compile(r"full[-\s]?body|head[-\s]?to[-\s]?toe", re.IGNORECASE)
RE_AREA_PERCENT = re.compile(r"fills\s+\d+\s*[-–]?\s*\d*\s*%\s+of\s+the\s+image\s+area", re.IGNORECASE)
RE_PORTRAIT_LENS= re.compile(r"85\s*mm\s+portrait\s+lens", re.IGNORECASE)
RE_FLAG_OR_NAT  = re.compile(r"flag|nationality|国旗", re.IGNORECASE)
RE_STRONG_TOKEN = re.compile(r"\b(must|never|DO NOT)\b")

PLACEHOLDERS = ["[TARGET_WORD]", "{CHARACTER_DESCRIPTION}",
                "{CHARACTER_POSE_AND_EXPRESSION}", "{FLAG_SHAPE_AND_COLORS}"]


def preflight(text, vocab_type, word):
    errs = []
    if BG_EXACT not in text:
        errs.append(f"[C4] {word}: background string 不一致（必須: '{BG_EXACT}'）")
    if NOT_TOKEN not in text:
        errs.append(f"[C5] {word}: NOT-token 不一致（必須: '{NOT_TOKEN}'）")
    if vocab_type == "person":
        if not RE_FULLBODY.search(text):
            errs.append(f"[C1] {word}: full-body / head-to-toe が無い")
        if RE_AREA_PERCENT.search(text):
            errs.append(f"[C1] {word}: 面積指定 'fills NN% of...' が残存")
        if RE_PORTRAIT_LENS.search(text):
            errs.append(f"[C1] {word}: '85mm portrait lens' が残存")
    if RE_FLAG_OR_NAT.search(text):
        if not RE_STRONG_TOKEN.search(text):
            errs.append(f"[C6] {word}: flag/nationality 文脈に強表現 must/never が無い")
    for p in PLACEHOLDERS:
        if p in text:
            errs.append(f"[PH] {word}: placeholder {p} 未置換")
    return errs


def guide_hash_lf_normalized(path):
    raw = open(path, "rb").read()
    lf = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n").rstrip(b"\n")
    return hashlib.sha256(lf).hexdigest()[:12]


# ─────────────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="決定論 S列生成（MVP: person のみ）")
    ap.add_argument("--lesson", type=int, default=1, help="課番号（MVP は 1 のみ）")
    ap.add_argument("--out", default=None, help="出力パス（既定: data/image_prompts_lessonNN_v3_2.json）")
    args = ap.parse_args()

    if args.lesson != 1:
        sys.exit("ABORT: MVP は lesson 1 のみ対応です（--lesson 1）。")

    g = load_guide()
    rendered = []
    all_errors = []
    for entry in PERSON_VOCAB_LESSON01:
        prompt = render_person(g, entry)
        errs = preflight(prompt, entry["vocab_type"], entry["word"])
        all_errors.extend(errs)
        rendered.append({
            "imageId":    entry["imageId"],
            "word":       entry["word"],
            "reading":    entry["reading"],
            "en":         entry["en"],
            "vocab_type": entry["vocab_type"],
            "prompt":     prompt,
        })

    if all_errors:
        print(f"=== invariant violations: {len(all_errors)} ===", file=sys.stderr)
        for e in all_errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit("ABORT: pre-flight 違反のため書き出しません。")

    out_path = args.out or os.path.join(
        ROOT, "data", f"image_prompts_lesson{args.lesson:02d}_v3_2.json"
    )
    out = {
        "_meta": {
            "lessonNo": args.lesson,
            "guideVersion": "v3.2",
            "guideHashNormalized": guide_hash_lf_normalized(GUIDE_PATH),
            "generatedAt": datetime.date.today().isoformat(),
            "generator": "scripts/build_prompts.py",
            "coveredVocabTypes": ["person"],
            "notes": ("MVP: vocab_type=person のみ実装。lesson_01 の person 12 件 "
                      "（役割系5＋国籍系7）。他 vocab_type のエントリは出力に含まない。"),
        },
        "vocabulary": rendered,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"OK: {len(rendered)} entries → {out_path}")
    print(f"  guideHashNormalized: {out['_meta']['guideHashNormalized']}")
    print(f"  Pre-flight invariants: PASS（{len(rendered)}件全て）")


if __name__ == "__main__":
    main()
