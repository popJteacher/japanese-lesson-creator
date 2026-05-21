# -*- coding: utf-8 -*-
"""決定論 S列生成スクリプト（v3.8 主経路）— MVP: vocab_type=person のみ

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
  flag_shape_and_colors と cultural_styling_hint は PERSON_NATIONALITY_HINTS
  (v3.7 で旧 PERSON_FLAG_LOOKUP から改名・拡張) で word→各情報 を解決。
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
GUIDE_PATH = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_8.py")


def load_guide():
    spec = importlib.util.spec_from_file_location("guide_v3_8", GUIDE_PATH)
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


# ─────────────────────────────────────────────────────────────
# v3.6: {NATIONALITY_EXCEPTION_BLOCK} の kind 別注入文
#   role        → anti-flag 強表現を [CONSTRAINTS] に挿入。Imagen が
#                 「役職に旗は付かない」という慣習を持たないため、削除では
#                 不十分で明示的禁止が必要（v3.5 検証で role 5 件中 2 件確認 → 100% 推定）。
#   nationality → 旧 EXCEPTION 句を簡潔化して残す（v3.1 ラベルは v3.6 で外す）。
#                 NATIONALITY_NOUN_POLICY.subject_block_pattern に旗の描き方詳細あり。
# ─────────────────────────────────────────────────────────────
ROLE_ANTI_FLAG_BLOCK = (
    "The clothing, accessories, props, and any visible badges must NEVER include "
    "any flag, national emblem, nationality pin, country indicator, political "
    "symbol, or red-and-white circular badge. This is a role-based vocabulary "
    "card, not a nationality card."
)
NATIONALITY_EXCEPTION_BLOCK = (
    "EXCEPTION (NATIONALITY_NOUN_POLICY): a small national-flag pin/patch is "
    "permitted as a subtle nationality cue, at most about 4% of the image area. "
    "Absolutely no text, letters, or numbers on the flag itself."
)


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

PERSON_NATIONALITY_HINTS = {
    # v3.8 全面改訂：
    #   - apparent_features_hint（phenotype 範囲・enumerate 化）を追加
    #     → 単一画像 diversity 問題（"naturally diverse" が中央値に収束）の構造的修正
    #   - cultural_styling_hint を garment-type レベルで分化
    #     → 「modern X casual fashion」共通形からの脱却。各国に 2-3 個の concrete 例を渡し
    #       Imagen が discrete に選ぶようにする。modernized cultural dress / 日常文脈の
    #       伝統衣装も option として含む（caricature / 祭礼 / tourist cliché は禁止）。
    "日本人": {
        "flag_shape_and_colors":
            "white field with a single red circle in the center",
        "apparent_features_hint":
            "East Asian phenotype is most common in Japan. Pick ONE specific "
            "set of features from: (skin tone: fair OR light-medium) + "
            "(hair: dark straight black, OR dark straight dark-brown, OR "
            "slightly wavy black). The character may also reflect Japan's "
            "diverse population including mixed heritage, in which case "
            "skin tone may extend to medium and hair color may vary.",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) modern Japanese street fashion — high-waisted loose "
            "trousers with a layered loose-fit top, oversized cardigan, "
            "or a modern indigo-dyed denim jacket; "
            "(b) a clean contemporary outfit incorporating subtle Japanese "
            "design elements — a top with a simple wagara (traditional "
            "geometric/floral) pattern, or a modern noragi-inspired light "
            "jacket worn over simple trousers; "
            "(c) an everyday yukata in a non-festival summer-at-home context. "
            "A single subtle red accent (button, shoe stripe, scarf) is "
            "acceptable but optional.",
    },
    "中国人": {
        "flag_shape_and_colors":
            "red field with a large yellow star and four smaller yellow stars in the upper-left corner",
        "apparent_features_hint":
            "East Asian phenotype is most common in China. Pick ONE specific "
            "set of features from: (skin tone: fair OR light-medium) + "
            "(hair: dark straight black, OR dark straight dark-brown). "
            "China's population spans many regions and ethnic groups, so "
            "subtle facial variation is appropriate.",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) modern Chinese urban athleisure — a relaxed sweatshirt "
            "with jogger pants and sneakers; "
            "(b) modern Chinese smart-casual — a structured jacket over a "
            "simple t-shirt with neat trousers; "
            "(c) a modernized cheongsam/qipao-inspired top (NOT a full "
            "formal qipao — a contemporary blouse with subtle frog-button "
            "or mandarin-collar details) worn with simple modern trousers. "
            "A subtle warm red or yellow accent in one small element is "
            "acceptable but optional.",
    },
    "アメリカ人": {
        "flag_shape_and_colors":
            "red and white horizontal stripes with a small blue corner of white star shapes",
        "apparent_features_hint":
            "The United States population is highly diverse. Pick ONE "
            "specific set of features from: (skin tone: fair, light-medium, "
            "olive, brown, or deep brown) + (hair color: black, dark-brown, "
            "brown, blond, or red) + (hair texture: straight, wavy, or "
            "curly). All combinations are valid.",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) classic American casual — jeans with a graphic t-shirt and "
            "sneakers, optionally with a baseball cap; "
            "(b) American athleisure — a hoodie with jogger pants and "
            "athletic sneakers; "
            "(c) American smart-casual — a plaid button-up shirt over a "
            "tee with chinos, OR chinos with a polo shirt.",
    },
    "韓国人": {
        "flag_shape_and_colors":
            "white field with a red-and-blue circle and black trigram marks",
        "apparent_features_hint":
            "East Asian phenotype is most common in Korea. Pick ONE specific "
            "set of features from: (skin tone: fair OR light) + "
            "(hair: dark straight black, OR dark straight dark-brown, often "
            "styled neatly).",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) contemporary K-fashion oversized layering — an oversized "
            "t-shirt or sweater with wide-leg trousers and modern sneakers; "
            "(b) contemporary K-fashion structured outerwear — a structured "
            "trench-style coat or modern blazer over a simple top with "
            "neat trousers; "
            "(c) a hanbok-inspired modern top (high empire-waist line, "
            "soft pleating, in a non-festival modern color palette) worn "
            "with simple trousers — a daily-wear modernization, NOT a "
            "ceremonial hanbok.",
    },
    "ブラジル人": {
        "flag_shape_and_colors":
            "green field with a yellow diamond and a small blue circle in the center",
        "apparent_features_hint":
            "Brazil's population is highly diverse, reflecting European, "
            "African, Indigenous, and Asian heritage. Pick ONE specific set "
            "of features from: (skin tone: fair, light-medium, olive, "
            "brown, or deep brown) + (hair color: black or brown) + "
            "(hair texture: straight, wavy, curly, or tightly coiled).",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) Brazilian warm-weather casual — a light short-sleeve "
            "cotton top with shorts or light trousers and sandals or light "
            "sneakers; "
            "(b) Brazilian beach-town casual — a linen short-sleeve shirt "
            "over a tank top with light trousers; "
            "(c) a casual everyday top in green or yellow (football-supporter "
            "color palette) — NOT a full national-team uniform, just a "
            "casual top in green/yellow worn as everyday clothing.",
    },
    "ベトナム人": {
        "flag_shape_and_colors":
            "red field with a single large yellow star in the center",
        "apparent_features_hint":
            "Southeast Asian phenotype is most common in Vietnam. Pick ONE "
            "specific set of features from: (skin tone: light-medium OR "
            "medium OR olive) + (hair: straight black, OR straight "
            "dark-brown).",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) Vietnamese light-fabric casual — a cotton or linen "
            "short-sleeve shirt with simple light trousers, light sandals "
            "or canvas shoes; "
            "(b) Vietnamese casual blouse-and-skirt — a light cotton "
            "blouse with a flowing mid-length skirt; "
            "(c) a modern everyday áo dài (Vietnamese long tunic, a daily "
            "garment in many cities) in a simple solid color worn over "
            "simple trousers — modernized for daily wear, NOT a "
            "ceremonial / festival áo dài.",
    },
    "スペイン人": {
        "flag_shape_and_colors":
            "red and yellow horizontal stripes with the yellow band twice as wide as each red band",
        "apparent_features_hint":
            "Mediterranean European phenotype is most common in Spain. "
            "Pick ONE specific set of features from: (skin tone: fair, "
            "light-medium, or olive-tan) + (hair color: black, dark-brown, "
            "or occasionally lighter brown) + (hair texture: straight or "
            "wavy).",
        "cultural_styling_hint":
            "Pick ONE of the following outfit patterns: "
            "(a) Spanish Mediterranean smart-casual — a tailored linen "
            "shirt with chinos and leather loafers; "
            "(b) Spanish casual layered — a light blazer over a simple "
            "t-shirt with jeans and clean sneakers; "
            "(c) Spanish elegant casual — a draped top with wide trousers "
            "and minimalist sandals or loafers. "
            "A subtle warm red or gold accent in one small element is "
            "acceptable but optional.",
    },
}


def classify_person(word):
    """vocab_type=person の word をサブカテゴリに分類する。
    末尾が「人」(person suffix) → nationality。それ以外で ROLE_LOOKUP に該当 → role。
    どちらにも該当しなければ None（呼び出し側でエラー）。
    """
    if word.endswith("人") and word in PERSON_NATIONALITY_HINTS:
        return ("nationality", PERSON_NATIONALITY_HINTS[word])
    if word in PERSON_ROLE_LOOKUP:
        return ("role", {"role_key": PERSON_ROLE_LOOKUP[word]})
    return (None, None)


# ─────────────────────────────────────────────────────────────
# 合成関数
# ─────────────────────────────────────────────────────────────
def compose_role_subject(g, role_key):
    """v3.8: skin tone / hair を enumerate 化。
    v3.7 までの "naturally diverse skin tone (multicultural variation) and
    naturally varied dark hair (dark brown to black)" は単一画像生成では
    Imagen が中央値（medium-darker brown + dark hair）に収束し、結果
    全 role が同じ phenotype に。enumerate 化により discrete な選択を強制。
    """
    role = g.ROLE_BASED_GENERIC_PROFILES[role_key]
    outfit_lines = "; ".join(role["outfit_hints"])
    return (
        f"A {role['role_en']} ({role['role_ja']}). "
        f"Outfit and props: {outfit_lines}. "
        f"The character's gender is unspecified. "
        f"Pick ONE specific set of features from: "
        f"(skin tone: fair, light-medium, olive, brown, or deep brown) + "
        f"(hair color: black, dark-brown, brown, blond, or red) + "
        f"(hair texture: straight, wavy, or curly). "
        f"All combinations are valid — choose discretely, do not blend. "
        f"Calm friendly expression. The role must be immediately readable from "
        f"clothing and props alone."
    )


def compose_role_pose():
    return ("Calm professional posture — standing relaxed with both feet flat on the ground, "
            "hands at the sides or lightly holding the role's typical prop; "
            "warm approachable expression")


def compose_nationality_subject(g, flag_shape_and_colors, cultural_styling_hint,
                                apparent_features_hint):
    return (g.NATIONALITY_NOUN_POLICY["subject_block_pattern"]
            .replace("{FLAG_SHAPE_AND_COLORS}", flag_shape_and_colors)
            .replace("{CULTURAL_STYLING_HINT}", cultural_styling_hint)
            .replace("{APPARENT_FEATURES_HINT}", apparent_features_hint))


def compose_nationality_pose():
    return ("Neutral approachable expression, relaxed standing pose with both feet flat "
            "on the ground, arms naturally at the sides")


def render_person(g, entry, kind, sub):
    template = g.PROMPT_TEMPLATES["vocabulary_person"]
    if kind == "role":
        char_desc = compose_role_subject(g, sub["role_key"])
        char_pose = compose_role_pose()
        exception_block = ROLE_ANTI_FLAG_BLOCK
    elif kind == "nationality":
        char_desc = compose_nationality_subject(
            g,
            sub["flag_shape_and_colors"],
            sub["cultural_styling_hint"],
            sub["apparent_features_hint"],
        )
        char_pose = compose_nationality_pose()
        exception_block = NATIONALITY_EXCEPTION_BLOCK
    else:
        raise ValueError(f"unknown person kind: {kind}")
    return (template
            .replace("[TARGET_WORD]", entry["word"])
            .replace("{CHARACTER_DESCRIPTION}", char_desc)
            .replace("{CHARACTER_POSE_AND_EXPRESSION}", char_pose)
            .replace("{NATIONALITY_EXCEPTION_BLOCK}", exception_block))


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
                "{CHARACTER_POSE_AND_EXPRESSION}", "{FLAG_SHAPE_AND_COLORS}",
                "{CULTURAL_STYLING_HINT}", "{APPARENT_FEATURES_HINT}",
                "{NATIONALITY_EXCEPTION_BLOCK}"]


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
            print(f"  未分類: {w}（PERSON_ROLE_LOOKUP / PERSON_NATIONALITY_HINTS に追加が必要）",
                  file=sys.stderr)
        sys.exit(f"ABORT: {len(unclassified)} 件の person が役割/国籍に分類できない。")

    if all_errors:
        print(f"=== invariant violations: {len(all_errors)} ===", file=sys.stderr)
        for e in all_errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit("ABORT: pre-flight 違反のため書き出しません。")

    out_path = args.out or os.path.join(
        ROOT, "data", f"image_prompts_lesson{args.lesson:02d}_v3_8.json"
    )
    out = {
        "_meta": {
            "lessonNo": args.lesson,
            "guideVersion": "v3.8",
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
                      " の PERSON_ROLE_LOOKUP / PERSON_NATIONALITY_HINTS で解決する。"),
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
