# -*- coding: utf-8 -*-
"""決定論 S列生成スクリプト（v3.5 主経路）— MVP: vocab_type=person のみ

入出力契約は docs/generator_contract.md を参照。
このスクリプトの設計原則:
  - v3.5 ガイドを Python モジュールとして直接 import する（文字列パース不可）。
  - vocab_type の真実源は data/vocab_types_lessonNN.json（GAS Vocabulary
    シートからの export 経由・現状はブートストラップ済）。archive 参照しない。
  - GAS の build*Prompt_ は副経路フォールバックで v3.2 invariants を満たさないため
    参考にしない。
  - 出力 JSON は書き出し前に invariants C 相当の pre-flight 検査を通す。
    1 件でも違反があれば exit 非ゼロ・ファイルを書き出さない。
  - 出力 _meta に provenance（guideHash・vocabTypesSource・script）を記録する。

サブカテゴリ（role / nationality）の決定:
  vocab_type=person のうち、word が "人" で終わるものは国籍名詞
  （NATIONALITY_NOUN_POLICY）として扱う。それ以外は役割系（ROLE_BASED_GENERIC_PROFILES）
  で、role_key は PERSON_ROLE_LOOKUP で word→role_key を解決。
  flag_shape_and_colors は PERSON_FLAG_LOOKUP で word→flag を解決。
  これらは現状スクリプト内 config。Sheets / lesson_NN.json に格上げ予定（NEXT_ACTIONS）。
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
GUIDE_PATH = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_5.py")


def load_guide():
    spec = importlib.util.spec_from_file_location("guide_v3_5", GUIDE_PATH)
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


# ─────────────────────────────────────────────────────────────
# サブカテゴリ lookup（vocab_type=person 内の役割/国籍分岐）
# 将来は Vocabulary シート / lesson_NN.json に新列として格上げ予定。
# ─────────────────────────────────────────────────────────────
PERSON_ROLE_LOOKUP = {
    # word → role_key (ROLE_BASED_GENERIC_PROFILES のキー)
    "医者":     "doctor",
    "会社員":   "company_employee",
    "学生":     "student",
    "大学生":   "student",
    "先生":     "teacher",
    "外国人":   "foreigner",
}

PERSON_FLAG_LOOKUP = {
    # word → flag_shape_and_colors（NATIONALITY_NOUN_POLICY.flag_shape_and_colors_hint 準拠）
    "日本人":     "white field with a single red circle in the center",
    "中国人":     "red field with a large yellow star and four smaller yellow stars in the upper-left corner",
    "アメリカ人": "red and white horizontal stripes with a small blue corner of white star shapes",
    "韓国人":     "white field with a red-and-blue circle and black trigram marks",
    "ブラジル人": "green field with a yellow diamond and a small blue circle in the center",
    "ベトナム人": "red field with a single large yellow star in the center",
    "スペイン人": "red and yellow horizontal stripes with the yellow band twice as wide as each red band",
}


def classify_person(word):
    """vocab_type=person の word をサブカテゴリに分類する。
    末尾が「人」(person suffix) → nationality。それ以外で ROLE_LOOKUP に該当 → role。
    どちらにも該当しなければ None（呼び出し側でエラー）。
    """
    if word.endswith("人") and word in PERSON_FLAG_LOOKUP:
        return ("nationality", {"flag_shape_and_colors": PERSON_FLAG_LOOKUP[word]})
    if word in PERSON_ROLE_LOOKUP:
        return ("role", {"role_key": PERSON_ROLE_LOOKUP[word]})
    return (None, None)


# ─────────────────────────────────────────────────────────────
# 合成関数
# ─────────────────────────────────────────────────────────────
def compose_role_subject(g, role_key):
    """v3.3 (M-47 wave): skin tone NOT specified / hair varied dark で多文化配慮対応。"""
    role = g.ROLE_BASED_GENERIC_PROFILES[role_key]
    outfit_lines = "; ".join(role["outfit_hints"])
    return (
        f"A {role['role_en']} ({role['role_ja']}). "
        f"Outfit and props: {outfit_lines}. "
        f"The character's gender is unspecified — use a generic adult appearance with "
        f"naturally diverse skin tone (multicultural variation) and "
        f"naturally varied dark hair (dark brown to black), "
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


def render_person(g, entry, kind, sub):
    template = g.PROMPT_TEMPLATES["vocabulary_person"]
    if kind == "role":
        char_desc = compose_role_subject(g, sub["role_key"])
        char_pose = compose_role_pose()
    elif kind == "nationality":
        char_desc = compose_nationality_subject(g, sub["flag_shape_and_colors"])
        char_pose = compose_nationality_pose()
    else:
        raise ValueError(f"unknown person kind: {kind}")
    return (template
            .replace("[TARGET_WORD]", entry["word"])
            .replace("{CHARACTER_DESCRIPTION}", char_desc)
            .replace("{CHARACTER_POSE_AND_EXPRESSION}", char_pose))


# ─────────────────────────────────────────────────────────────
# Pre-flight invariants（invariants.mjs C 相当）
# ─────────────────────────────────────────────────────────────
BG_EXACT  = "soft cream off-white background (warm off-white, NOT pure stark white)"
NOT_TOKEN = "NOT pure stark white"

RE_FULLBODY      = re.compile(r"full[-\s]?body|head[-\s]?to[-\s]?toe", re.IGNORECASE)
RE_AREA_PERCENT  = re.compile(r"fills\s+\d+\s*[-–]?\s*\d*\s*%\s+of\s+the\s+image\s+area", re.IGNORECASE)
RE_PORTRAIT_LENS = re.compile(r"85\s*mm\s+portrait\s+lens", re.IGNORECASE)
RE_FLAG_OR_NAT   = re.compile(r"flag|nationality|国旗", re.IGNORECASE)
RE_STRONG_TOKEN  = re.compile(r"\b(must|never|DO NOT)\b")

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


def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(65536), b""):
            h.update(c)
    return h.hexdigest()[:12]


# ─────────────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="決定論 S列生成（MVP: person のみ）")
    ap.add_argument("--lesson", type=int, default=1, help="課番号（MVP は 1 のみ対応）")
    ap.add_argument("--vocab-types", default=None,
                    help="vocab_types JSON のパス（既定: data/vocab_types_lessonNN.json）")
    ap.add_argument("--out", default=None,
                    help="出力パス（既定: data/image_prompts_lessonNN_v3_2.json）")
    args = ap.parse_args()

    if args.lesson != 1:
        sys.exit("ABORT: MVP は lesson 1 のみ対応です（--lesson 1）。")

    vocab_types_path = args.vocab_types or os.path.join(
        ROOT, "data", f"vocab_types_lesson{args.lesson:02d}.json"
    )
    if not os.path.exists(vocab_types_path):
        sys.exit(
            f"ABORT: vocab_types ファイルが不在: {vocab_types_path}\n"
            "  人間タスク: gas/pipeline.gs#exportVocabTypesAll() を実行し、Drive 上の "
            f"vocab_types_lesson{args.lesson:02d}.json を repo に取り込んでください。"
        )

    with open(vocab_types_path, encoding="utf-8") as f:
        vt_doc = json.load(f)
    persons = [v for v in vt_doc.get("vocabulary", []) if v.get("vocab_type") == "person"]
    if not persons:
        sys.exit(f"ABORT: vocab_type=person のエントリが {vocab_types_path} に無い")

    g = load_guide()
    rendered = []
    all_errors = []
    unclassified = []

    for entry in persons:
        kind, sub = classify_person(entry["word"])
        if kind is None:
            unclassified.append(entry["word"])
            continue
        prompt = render_person(g, entry, kind, sub)
        all_errors.extend(preflight(prompt, "person", entry["word"]))
        rendered.append({
            "imageId":    entry["imageId"],
            "word":       entry["word"],
            "reading":    entry["reading"],
            "en":         entry["en"],
            "vocab_type": entry["vocab_type"],
            "prompt":     prompt,
        })

    if unclassified:
        for w in unclassified:
            print(f"  未分類: {w}（PERSON_ROLE_LOOKUP / PERSON_FLAG_LOOKUP に追加が必要）",
                  file=sys.stderr)
        sys.exit(f"ABORT: {len(unclassified)} 件の person が役割/国籍に分類できない。")

    if all_errors:
        print(f"=== invariant violations: {len(all_errors)} ===", file=sys.stderr)
        for e in all_errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit("ABORT: pre-flight 違反のため書き出しません。")

    out_path = args.out or os.path.join(
        ROOT, "data", f"image_prompts_lesson{args.lesson:02d}_v3_5.json"
    )
    out = {
        "_meta": {
            "lessonNo": args.lesson,
            "guideVersion": "v3.5",
            "guideHashNormalized": guide_hash_lf_normalized(GUIDE_PATH),
            "generatedAt": datetime.date.today().isoformat(),
            "generator": "scripts/build_prompts.py",
            "scriptHash": file_hash(os.path.abspath(__file__)),
            "vocabTypesSource": os.path.relpath(vocab_types_path, ROOT).replace("\\", "/"),
            "vocabTypesMeta": vt_doc.get("_meta", {}),
            "coveredVocabTypes": ["person"],
            "notes": ("MVP: vocab_type=person のみ実装。lesson_01 の person 12 件 "
                      "（役割系5＋国籍系7）。他 vocab_type のエントリは出力に含まない。"
                      " サブカテゴリ（role/nationality）は scripts/build_prompts.py 内"
                      " の PERSON_ROLE_LOOKUP / PERSON_FLAG_LOOKUP で解決する。"),
        },
        "vocabulary": rendered,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"OK: {len(rendered)} entries → {out_path}")
    print(f"  guideHashNormalized: {out['_meta']['guideHashNormalized']}")
    print(f"  vocabTypesSource:    {out['_meta']['vocabTypesSource']}")
    print(f"  Pre-flight invariants: PASS（{len(rendered)} 件全て）")


if __name__ == "__main__":
    main()
