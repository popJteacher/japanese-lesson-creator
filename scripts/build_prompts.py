# -*- coding: utf-8 -*-
"""決定論 S列生成スクリプト（v4.0 主経路 / nanobanana 固定運用）— MVP: vocab_type=person のみ

入出力契約は docs/generator_contract.md を参照。
このスクリプトの設計原則:
  - ガイドを Python モジュールとして直接 import する（文字列パース不可）。
  - vocab_type の真実源は data/vocab_types_lessonNN.json。archive 参照しない。
  - 出力 JSON は書き出し前に invariants C 相当の pre-flight 検査を通す。
    1 件でも違反があれば exit 非ゼロ・ファイルを書き出さない。
  - 出力 _meta に provenance（guideHash・vocabTypesSource・script）を記録する。

サブカテゴリ（role / nationality）の決定:
  vocab_type=person のうち、word が "人" で終わるものは国籍名詞
  （NATIONALITY_NOUN_POLICY）として扱う。それ以外は役割系
  （ROLE_BASED_GENERIC_PROFILES）で、role_key は PERSON_ROLE_LOOKUP で
  word→role_key を解決。flag_shape_and_colors と cultural_styling_hint は
  PERSON_NATIONALITY_HINTS で word→各情報 を解決。

v4.0.1 (2026-05-22): 実機検証フィードバック反映。
  - PERSON_NATIONALITY_HINTS の flag_shape_and_colors を米西伯中 4 国で
    詳細化（FLAG_SHAPE_DETAIL_RULE - PART 1.9 準拠）。日韓越は既に十分。
  - FACIAL_FEATURES_RULE (PART 1.8) はガイド本体の PROMPT_TEMPLATES
    ["vocabulary_person"] に inline directive として組み込み済。
    build_prompts.py 側の compose 関数は変更不要（template 経由で自動適用）。

v4.0 (2026-05-22): 全国共通 modern daily casual wear + 国旗両手持ち pivot。
  - PERSON_NATIONALITY_HINTS の cultural_styling_hint を全 7 国とも
    B-rich modern wear 形式に書き換え（silhouette / fit / palette tendency /
    footwear / optional non-hand accessory）。各国 hint には silhouette の
    positive 記述のみ書き、伝統 silhouette 禁止は universal
    NO_TRADITIONAL_SILHOUETTE_RULE (ガイド PART 1.1 hard_constraints) に集約。
  - PERSON_NATIONALITY_HINTS の apparent_features_hint dead field を削除
    （v3.12 以降は phenotype_for(word) が動的計算するため未参照）。
  - TRADITIONAL_DRESS_PATTERN_LOOKUP / pattern_for() を削除
    （ガイド PART 1.6 退役に伴い）。
  - FLAG_PLACEMENT_OPTIONS を 1 entry の定数 list に縮約。
    flag_placement_for() は word に依らず定数文字列を返す
    （ガイド PART 1.7 簡素化に伴い）。
  - NATIONALITY_EXCEPTION_BLOCK を hand-held flag 形式に書き換え
    （5-6% pin → 12-15% hand-held flag）。
  - compose_nationality_subject() から pattern_for(word) append 処理を削除。
  - compose_nationality_pose() を「arms holding the flag in front of the chest」
    形式に書き換え。

v3.12 から維持されているもの:
  - phenotype_for(word) / PHENOTYPE_PROFILES / COUNTRY_TO_PROFILE /
    ROLE_PHENOTYPE_PALETTE / PHENOTYPE_SALT（PART 1.5 rule_e palette_freeze 継続）
  - _deterministic_pick() helper（phenotype 選択に引き続き使用）
  - preflight 検査（背景文字列 / NOT トークン / full-body / 国旗強表現 / placeholder 残存）
  - ROLE_ANTI_FLAG_BLOCK（role cards は flag を持たない・引き続き有効）
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
# v4.0 主経路（nanobanana 固定運用）。
# Rollback to v3.12: GUIDE_PATH を 'master_prompt_design_guide_v3_12.py' に戻し、
# scripts/invariants.mjs の promptGuideExpectedHashPrefix を v3.12 の 2137a8e885ae に戻す。
GUIDE_PATH = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v4_0.py")


def load_guide():
    spec = importlib.util.spec_from_file_location("guide_v4_0", GUIDE_PATH)
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
    "EXCEPTION (NATIONALITY_NOUN_POLICY v4.0): a hand-held flag held in "
    "both hands in front of the chest is permitted as a clear nationality "
    "cue, occupying about 12-15% of the image area. The flag is a fabric "
    "panel with no pole or staff, face squarely toward the viewer. "
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
    # v4.0 (2026-05-22) 全面改訂：
    #   旧 v3.8〜v3.12 の cultural_styling_hint は (a)/(b)/(c) で modernized
    #   cultural dress / 伝統 silhouette を主軸としていたが、これがアジア／
    #   西洋アシンメトリ問題（日中韓越のみ伝統 silhouette / 米伯西は modern
    #   garment + regional craft accent）を生んでいた。v4.0 では全 7 国とも
    #   "modern daily casual wear" に統一し、国別 subtle 弁別は silhouette /
    #   fit / palette tendency / footwear / optional non-hand accessory で行う。
    #
    # 伝統 silhouette 禁止（hanbok / qipao / áo dài / yukata / wagara-cut /
    #   noragi / cheongsam / jeogori / etc.）は universal NO_TRADITIONAL_
    #   SILHOUETTE_RULE（ガイド PART 1.1 hard_constraints）で集約管理。
    #   各国 hint には silhouette の positive 記述のみ書く。
    #
    # 国旗は両手で胸前で持つ hand-held flag pose で表示されるため、
    #   accessory は「手以外」（shoulder-strap bag / cap / scarf / wristwatch）
    #   に限定。各国 hint 末尾で「NO hand-held bag / no hand-held prop」を明示。
    #
    # PART 1.4 PROMPT_LITERALIZATION_AVOIDANCE_RULE 準拠：
    #   palette は「Pick ONE color combination from: ...」(rule_b 適合) で書き、
    #   「preferred / tendency / may carry」は使わない（modal verbs は omit 信号）。
    #   garment は MUST で固定し、accessory のみ「Optional non-hand accessory」と
    #   uppercase MAY 概念で書く（rule_c rule (3) 準拠）。
    #
    # apparent_features_hint field は v3.12 で dead code 化（phenotype_for が
    # 動的計算）→ v4.0 で完全削除。
    "日本人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            "the actual flag of Japan (Hinomaru): a white rectangular "
            "field with a single solid red disc/circle centered in the "
            "middle. ABSOLUTELY no text, letters, numbers, or words "
            "anywhere on the flag",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "contemporary Japan: a plain solid-color slightly oversized "
            "crew-neck t-shirt OR a plain solid-color button-up shirt, "
            "layered optionally over a simple plain knit pullover, paired "
            "with neat tailored trousers or dark jeans. "
            "Footwear MUST be simple low-profile white or off-white "
            "canvas sneakers OR plain dark leather loafers. "
            "Palette: Pick ONE color combination from: muted indigo top + "
            "cream trousers / charcoal top + warm sand trousers / cream "
            "top + muted indigo trousers / sage green top + charcoal "
            "trousers. "
            "AVOID white top + solid red trousers, AVOID solid red top + "
            "white trousers, AVOID any large red circle motif centered on "
            "a white garment (these read as Japanese flag imagery on the "
            "body — the hand-held flag already carries that signal). "
            "Optional non-hand accessory: a plain canvas tote bag slung "
            "by its strap over one shoulder OR a simple wristwatch. NO "
            "hand-held bag, NO hand-held book, NO hand-held prop of any "
            "kind (both hands hold the flag).",
    },
    "中国人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            "the actual flag of the People's Republic of China "
            "(Five-star Red Flag): a red field with one large yellow "
            "five-pointed star and four smaller yellow stars in the "
            "upper-left corner. ABSOLUTELY no text, letters, numbers, "
            "or words anywhere on the flag",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "contemporary China: a plain solid-color regular crew-neck "
            "top OR a plain solid-color button-up shirt with a regular "
            "(non-mandarin) collar, paired with neat tailored trousers. "
            "Footwear MUST be simple plain leather loafers OR low-profile "
            "canvas or leather sneakers. "
            "Palette: Pick ONE color combination from: soft jade top + "
            "cream trousers / muted indigo top + warm sand trousers / "
            "cream top + charcoal trousers / muted dusty rose top + "
            "indigo trousers. "
            "AVOID any red + yellow color combination on the outfit "
            "(the Chinese flag uses red + yellow — the hand-held flag "
            "already carries that signal). "
            "Optional non-hand accessory: a thin minimalist wristwatch "
            "OR a small plain leather messenger bag slung by its strap "
            "over one shoulder. NO hand-held bag, NO hand-held prop of "
            "any kind (both hands hold the flag).",
    },
    "アメリカ人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            "the actual flag of the United States of America (Stars "
            "and Stripes): alternating red and white horizontal "
            "stripes covering the full flag, with a blue rectangular "
            "canton in the upper-left corner containing white five-"
            "pointed stars arranged in rows. ABSOLUTELY no text, "
            "letters, numbers, or words anywhere on the flag",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "the contemporary United States: a plain solid-color crew-"
            "neck t-shirt under an unbuttoned chore coat (work jacket "
            "with patch pockets) OR a plaid / check button-up flannel "
            "shirt worn open over a plain solid-color t-shirt, paired "
            "with straight-leg jeans or chinos. "
            "Any plaid / check MUST be a non-flag, non-team check "
            "pattern in muted earth tones. The t-shirt MUST be a plain "
            "solid color with NO graphic, NO logo, NO print (per "
            "NATIONAL_SYMBOL_ISOLATION_RULE). "
            "Footwear MUST be simple canvas sneakers OR plain work-"
            "style leather boots. "
            "Palette: Pick ONE color combination from: cream tee + muted "
            "indigo coat + charcoal jeans / muted sand flannel + plain "
            "white tee + dark jeans / muted olive chore coat + cream tee "
            "+ charcoal chinos. "
            "Optional non-hand accessory: a plain solid-color baseball-"
            "style cap with NO logo, NO team emblem, NO flag motif OR a "
            "simple wristwatch. NO hand-held bag, NO hand-held prop of "
            "any kind (both hands hold the flag).",
    },
    "韓国人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            "the actual flag of South Korea (Taegukgi): a white "
            "rectangular field with the red-and-blue Taegeuk circle "
            "centered in the middle, and four black trigrams (one in "
            "each corner of the flag). ABSOLUTELY no text, letters, "
            "numbers, or words anywhere on the flag",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "contemporary K-fashion: a clean minimalist oversized trench-"
            "style coat OR a sharp-shouldered modern blazer worn open "
            "over a plain solid-color crew-neck top, paired with neat "
            "straight-leg trousers. "
            "Footwear MUST be clean low-profile leather sneakers OR "
            "plain dark leather loafers. "
            "Palette: Pick ONE color combination from: cream coat + "
            "charcoal top + dark trousers / muted dusty rose blazer + "
            "cream top + charcoal trousers / pale indigo coat + warm "
            "sand top + charcoal trousers / muted olive coat + cream "
            "top + warm sand trousers. "
            "Optional non-hand accessory: a small structured plain "
            "leather crossbody bag slung by its strap over one shoulder "
            "OR a minimalist wristwatch. NO hand-held bag, NO hand-held "
            "prop of any kind (both hands hold the flag).",
    },
    "ブラジル人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            # NO_TEXT 強制で "Ordem e Progresso" 帯のテキスト描画を回避。
            "the actual flag of Brazil (Bandeira do Brasil): a green "
            "field with a large yellow rhombus/diamond in the center, "
            "containing a blue celestial sphere with white stars and "
            "a horizontal curved white band across the middle of the "
            "blue circle. ABSOLUTELY no text, letters, numbers, or "
            "words anywhere on the flag — even though the actual "
            "Brazilian flag contains the motto 'Ordem e Progresso' on "
            "the white band, render the band as completely blank "
            "white with no text on it",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "contemporary Brazil: a relaxed-fit lightweight linen camp-"
            "collar button-up shirt worn open over a plain solid-color "
            "tank top or short-sleeve t-shirt OR a relaxed short-sleeve "
            "top with a small subtle botanical print (tropical leaf or "
            "palm or floral in muted earth tones), paired with light "
            "cotton or linen trousers. "
            "Footwear MUST be simple canvas sneakers OR plain flat "
            "leather sandals. "
            "Palette: Pick ONE color combination from: terracotta tee + "
            "cream linen shirt + muted indigo trousers / sand-colored "
            "botanical-print top + cream trousers / muted sage linen "
            "shirt + cream tee + warm sand trousers. "
            "AVOID any green + yellow color combination on the outfit "
            "(the Brazilian flag uses green + yellow — the hand-held "
            "flag already carries that signal, and the combination "
            "reads as national-team uniform). "
            "Optional non-hand accessory: a small woven cord or bead "
            "bracelet in muted earth tones (NEVER in flag colors). NO "
            "hand-held bag, NO hand-held prop of any kind (both hands "
            "hold the flag).",
    },
    "ベトナム人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            "the actual flag of Vietnam (Cờ đỏ sao vàng): a red "
            "rectangular field with a single large yellow five-pointed "
            "star centered in the middle. ABSOLUTELY no text, letters, "
            "numbers, or words anywhere on the flag",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "contemporary Vietnam: a plain solid-color short-sleeve "
            "crew-neck t-shirt OR a simple lightweight short-sleeve "
            "button-up blouse with a regular (non-mandarin) collar, "
            "paired with neat lightweight trousers. "
            "Footwear MUST be simple canvas sneakers OR plain flat "
            "leather sandals. "
            "Palette: Pick ONE color combination from: soft jade top + "
            "cream trousers / pale indigo top + warm sand trousers / "
            "cream blouse + muted indigo trousers / muted dusty rose "
            "top + cream trousers. "
            "AVOID red top with any single yellow ornament centered on "
            "the chest (that reads as Vietnamese flag imagery on the "
            "body — the hand-held flag already carries that signal). "
            "Optional non-hand accessory: a small woven rattan or "
            "lightweight canvas crossbody bag slung by its strap over "
            "one shoulder OR a simple wristwatch. NO tourist nón lá "
            "conical hat. NO hand-held bag, NO hand-held prop of any "
            "kind (both hands hold the flag).",
    },
    "スペイン人": {
        "flag_shape_and_colors":
            # v4.0.3 (FLAG_SHAPE_DETAIL_RULE 3-layer invoke 方針・2026-05-22):
            # v4.0.2 の exhaustive geometric specification（escutcheon shape +
            # vertical division line 等）が nanobanana-suboptimal だったため、
            # invoke 方式に変更。1:2:1 比率は load-bearing なので明示維持。
            "the actual flag of Spain (Bandera de España): three "
            "horizontal bands red-yellow-red with the middle yellow "
            "band twice as tall as each red band (1:2:1 proportion), "
            "and the Spanish coat-of-arms positioned on the yellow "
            "band toward the left side. ABSOLUTELY no text, letters, "
            "numbers, or words anywhere on the flag",
        "cultural_styling_hint":
            "The outfit MUST be modern daily casual wear typical of "
            "contemporary Spain: a relaxed-fit lightweight linen or "
            "cotton button-up shirt with rolled sleeves worn open over "
            "a plain solid-color t-shirt, paired with light chinos. "
            "Footwear MUST be simple plain canvas flat sneakers OR plain "
            "leather low-profile loafers. (NO woven jute-rope traditional "
            "espadrille sole, NO traditional regional footwear of any "
            "country.) "
            "Palette: Pick ONE color combination from: cream tee + muted "
            "indigo linen shirt + warm sand chinos / terracotta tee + "
            "cream linen shirt + charcoal chinos / muted sage linen "
            "shirt + cream tee + warm sand chinos. "
            "AVOID any red + yellow color combination on the outfit "
            "(the Spanish flag uses red + yellow — the hand-held flag "
            "already carries that signal). "
            "Optional non-hand accessory: sunglasses pushed up on top "
            "of the head OR a thin lightweight modern scarf draped over "
            "the neck (NOT a manton-style traditional fringed shawl). "
            "NO hand-held bag, NO hand-held prop of any kind (both "
            "hands hold the flag).",
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
# universal rule data tables（プロンプトガイド PART 1.5/1.6/1.7 参照）
# v3.12 (3 universal rules 導入) → v4.0 (PART 1.6 退役・PART 1.7 簡素化)
# ─────────────────────────────────────────────────────────────

# PART 1.5 PHENOTYPE_SPECIFICATION_RULE データ群
# v4.0 (2026-05-22): PART 1.5 rule_e palette_freeze を継続。major-version
# migration の機会だったが、phenotype 変更の必然性が無いため
# PHENOTYPE_PROFILES / COUNTRY_TO_PROFILE / ROLE_PHENOTYPE_PALETTE /
# PHENOTYPE_SALT すべて v3.12 から不変。reproducibility 維持。
#
# PHENOTYPE_PROFILES (7 entries・各 1 文の concrete 記述)
#   rule_b 準拠で skin tone / hair に隣接 2 段階までの range を含めて良い。
#   rule_a 準拠で 'OR' や 'pick one from' は使わない。
#   americas_diverse は特例：rule_c で多民族国家として ROLE_PHENOTYPE_PALETTE
#   にフォールバックする marker としてのみ存在し、本辞書の文字列は使わない。
PHENOTYPE_PROFILES = {
    "east_asian":
        "fair to light-medium skin with straight black to dark-brown hair",
    "southeast_asian":
        "light-medium to medium olive-toned skin with straight black hair",
    "mediterranean_eu":
        "light-medium to olive-tan skin with wavy dark-brown to black hair",
    "northern_eu":
        "fair skin with straight to wavy light-brown or blond hair",
    "west_african":
        "deep brown skin with tightly coiled black hair",
    "east_african":
        "rich brown to deep brown skin with tightly coiled black hair",
    "americas_diverse":
        # SENTINEL: rule_c special case — country routes here means use
        # ROLE_PHENOTYPE_PALETTE deterministic pick instead of this string.
        "FALLBACK_TO_ROLE_PALETTE",
}

# COUNTRY_TO_PROFILE: lesson_01 の 7 国籍をカバー。将来国追加は 1 行追加だけ。
COUNTRY_TO_PROFILE = {
    "日本人":     "east_asian",
    "中国人":     "east_asian",
    "韓国人":     "east_asian",
    "ベトナム人": "southeast_asian",
    "スペイン人": "mediterranean_eu",
    "アメリカ人": "americas_diverse",
    "ブラジル人": "americas_diverse",
}

# ROLE_PHENOTYPE_PALETTE (6 entries・人類スペクトラム fair → deep brown)
#   role nouns (医者・学生・先生 等) と americas_diverse fallback で使用。
#   sha256(word + PHENOTYPE_SALT) mod 6 で deterministic 選択。
#   各 entry は rule_a / rule_b 準拠の 1 文記述。
#
# v3.12.1 改訂：初版 (v3.12.0) は skin tone を 6 段階で gradient させたが、
#   隣接 entry の hair 記述が同一（例 entry[4]/[5] が "tightly coiled black"）
#   だったため、視覚的に弁別不能なペアが発生。実機検証（lesson_01 の 医者
#   palette[4] と 先生 palette[5]）で顕在化。本改訂で skin AND hair の両軸で
#   全 entry が visibly 異なるよう書き直し、5-6 role を 1 課に並べたとき
#   全員が一目で別人と判別可能にする。
#   注：palette content の変更で同じ word の phenotype 文字列が変わる
#       （hash index は不変だが、index の指す文字列が変わる）。本改訂は
#       v3.12 シリーズ内の minor tuning (v3.12.1) として扱う — guide PART 1.5
#       rule_e の palette-freeze 精神は次の major-version (v4.0) まで再適用。
ROLE_PHENOTYPE_PALETTE = [
    "fair skin with short straight light-brown hair",
    "light-medium skin with shoulder-length wavy dark-brown hair",
    "olive-tan skin with long straight black hair",
    "light brown skin with short curly dark-brown hair",
    "rich brown skin with shoulder-length loosely curly black hair",
    "deep brown skin with very short tightly coiled black hair",
]

# PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE データ
#
# v4.0 (2026-05-22) で退役。v3.12 では 4 Asian countries の伝統 silhouette に
# 1 つの visible textile pattern を MUST 含める rule を実装していたが、v4.0 で
# 伝統 silhouette 自体が NO_TRADITIONAL_SILHOUETTE_RULE で禁止されたため、
# lookup が適用される situation が原理的に消滅。
# TRADITIONAL_DRESS_PATTERN_LOOKUP / pattern_for(word) は削除。
# 旧データは archive/prompts/master_prompt_design_guide_v3_12.py / 旧
# build_prompts.py git history 参照。

# PART 1.7 FLAG_PLACEMENT_RULE データ
#
# v4.0 (2026-05-22) で簡素化。v3.12 では 4 entry × sha256 mod 4 の deterministic
# 選択だったが、v4.0 では全員固定 pose（hand-held flag in both hands in front of
# the chest）になり、placement 選択肢が原理的に 1 つに収束。
# FLAG_PLACEMENT_OPTIONS は 1 entry の list として保持（_deterministic_pick の API
# 互換性のため）。flag_placement_for(word) は word に依らず同じ文字列を返す。
FLAG_PLACEMENT_OPTIONS = [
    "in both hands in front of the chest, at about chest-to-upper-waist "
    "height, both arms bent at the elbows",
]


# ─────────────────────────────────────────────────────────────
# v3.12 deterministic-pick ヘルパー
# ─────────────────────────────────────────────────────────────
def _deterministic_pick(word, options, salt):
    """sha256(word + salt) を 16 進整数化し len(options) で剰余を取って
    options[idx] を返す。同じ (word, salt, options) で常に同じ結果。

    PHENOTYPE_SPECIFICATION_RULE rule_d / FLAG_PLACEMENT_RULE rule_b で使用。
    """
    if not options:
        raise ValueError("_deterministic_pick: options must not be empty")
    h = hashlib.sha256((word + salt).encode("utf-8")).hexdigest()
    idx = int(h, 16) % len(options)
    return options[idx]


# v3.12 salt 文字列：lesson_01 の 5 role + 2 americas_diverse (アメリカ人/ブラジル人)
# 計 7 word を ROLE_PHENOTYPE_PALETTE の 6 buckets に分散させた際の skew が
# 最小（skew=1, 理論最小値）になる salt を実機で選定した結果 'palette-pick'。
# 候補 'phenotype' は skew=3、'role-pick' は skew=1 (但し 5 role 内で同一 palette
# entry に 2 件衝突)、'palette-pick' は skew=1 かつ 5 role 全員が distinct entry。
# salt を変更すると同じ word の phenotype hash が変わるため、v3.12 freeze 後の
# 変更は major-version migration 扱い（PART 1.5 rule_e palette-freeze 同様）。
PHENOTYPE_SALT = "palette-pick"


def phenotype_for(word):
    """PART 1.5 PHENOTYPE_SPECIFICATION_RULE 準拠で word に対応する 1 文の
    concrete phenotype 記述を返す。

    rule_c: nationality nouns (word が COUNTRY_TO_PROFILE にある) は
            COUNTRY_TO_PROFILE → PHENOTYPE_PROFILES で profile 解決。
            americas_diverse は rule_c 特例で ROLE_PHENOTYPE_PALETTE に
            フォールバック (rule_d 同様の deterministic pick)。
    rule_d: role nouns (word が COUNTRY_TO_PROFILE に無い) は
            ROLE_PHENOTYPE_PALETTE から sha256 ベースで 1 entry 選択。
    """
    if word in COUNTRY_TO_PROFILE:
        profile_key = COUNTRY_TO_PROFILE[word]
        profile = PHENOTYPE_PROFILES[profile_key]
        if profile == "FALLBACK_TO_ROLE_PALETTE":
            # americas_diverse: 多民族国家として ROLE_PHENOTYPE_PALETTE で
            # deterministic 選択 (rule_c 特例)。
            return _deterministic_pick(word, ROLE_PHENOTYPE_PALETTE, PHENOTYPE_SALT)
        return profile
    # role nouns: ROLE_PHENOTYPE_PALETTE から deterministic pick (rule_d)。
    return _deterministic_pick(word, ROLE_PHENOTYPE_PALETTE, PHENOTYPE_SALT)


def flag_placement_for(word):
    """PART 1.7 FLAG_PLACEMENT_RULE (v4.0 簡素化版) 準拠で word に対応する
    flag 位置記述を返す。v4.0 では全員固定 pose（hand-held flag in both hands
    in front of the chest）のため、word に依らず FLAG_PLACEMENT_OPTIONS[0] を
    返す。_deterministic_pick 経由で呼び出すことで v3.12 と同じ API
    signature を維持（FLAG_PLACEMENT_OPTIONS が 1 entry の場合 index 0 が必ず
    選択される）。
    """
    return _deterministic_pick(word, FLAG_PLACEMENT_OPTIONS, "flag-placement")


# ─────────────────────────────────────────────────────────────
# 合成関数
# ─────────────────────────────────────────────────────────────
def compose_role_subject(g, role_key, word):
    """v3.12: phenotype は PART 1.5 PHENOTYPE_SPECIFICATION_RULE rule_d 準拠で
    phenotype_for(word) が返す単一 concrete 記述に切替。v3.8〜v3.11.1 の
    enumerate ("Pick ONE from: A / B / C") は中央値収束を起こすため廃止。

    PROP CONTRAST RULE は v3.10 から継続（STYLE_BIBLE.visual_contrast_principle.
    sub_rules_by_situation.person_prop_contrast から derive）。本ルールは
    role-based subject_block にのみ適用、nationality 系には適用しない。
    """
    role = g.ROLE_BASED_GENERIC_PROFILES[role_key]
    outfit_lines = "; ".join(role["outfit_hints"])
    phenotype = phenotype_for(word)
    return (
        f"A {role['role_en']} ({role['role_ja']}). "
        f"Outfit and props: {outfit_lines}. "
        f"The character's gender is unspecified. "
        # v3.12 PHENOTYPE_SPECIFICATION_RULE rule_d: 単一 concrete 記述
        f"Apparent features: {phenotype}. "
        f"Calm friendly expression. The role must be immediately readable from "
        f"clothing and props alone. "
        # v3.10 prop contrast rule
        # (derived from STYLE_BIBLE.visual_contrast_principle.sub_rules_by_situation.person_prop_contrast):
        f"PROP CONTRAST RULE (derived from STYLE_BIBLE."
        f"visual_contrast_principle.person_prop_contrast): Any prop held in "
        f"the hand or worn against the body (book, marker, pen, clipboard, "
        f"stethoscope, briefcase, laptop bag, notebook, folder, lanyard "
        f"name badge, crossbody bag, etc.) MUST use a color drawn from "
        f"STYLE_BIBLE.color_palette that visibly differs in hue family "
        f"AND/OR value from the outfit's dominant color, so the prop is "
        f"immediately legible against the clothing. Concretely: if the "
        f"outfit is muted warm blue, the prop should be warm amber gold or "
        f"cool slate gray; if the outfit is cream/beige/white (e.g., a "
        f"white doctor's coat), the prop should be cool slate gray or "
        f"muted warm blue; if the outfit is cool slate gray, the prop "
        f"should be warm amber gold or muted warm blue. Do NOT default to "
        f"warm amber gold for every prop — alternate between accent and "
        f"main_color depending on outfit so that 12 role cards within a "
        f"single lesson do not converge on the same prop color."
    )


def compose_role_pose():
    return ("Calm professional posture — standing relaxed with both feet flat on the ground, "
            "hands at the sides or lightly holding the role's typical prop; "
            "warm approachable expression")


def compose_nationality_subject(g, word, flag_shape_and_colors, cultural_styling_hint):
    """v3.12: 3 universal rules を統合して nationality subject_block を組む。
      - PHENOTYPE_SPECIFICATION_RULE (PART 1.5): phenotype_for(word) で
        {APPARENT_FEATURES_HINT} を動的計算。enumerate 表現の静的データは廃止。
      - TRADITIONAL_DRESS_PATTERN_RULE (PART 1.6): pattern_for(word) が
        非 None なら cultural_styling_hint の末尾に textile element を append。
      - FLAG_PLACEMENT_RULE (PART 1.7): flag_placement_for(word) で
        {FLAG_PLACEMENT} placeholder を deterministic に置換。
    """
    phenotype_sentence = (
        f"Apparent features: {phenotype_for(word)}."
    )
    # v4.0 (2026-05-22): pattern_for(word) append 処理を削除（PART 1.6 退役）。
    # 旧 v3.12 では伝統 silhouette を持つアジア 4 か国に textile pattern を
    # cultural_styling_hint 末尾に append していたが、v4.0 で伝統 silhouette
    # が全国禁止されたため不要。
    flag_placement = flag_placement_for(word)
    return (g.NATIONALITY_NOUN_POLICY["subject_block_pattern"]
            .replace("{FLAG_SHAPE_AND_COLORS}", flag_shape_and_colors)
            .replace("{CULTURAL_STYLING_HINT}", cultural_styling_hint)
            .replace("{APPARENT_FEATURES_HINT}", phenotype_sentence)
            .replace("{FLAG_PLACEMENT}", flag_placement))


def compose_nationality_pose():
    # v4.0 (2026-05-22): 両手で flag を胸前で持つ pose へ書き換え。
    # 旧 v3.12: "arms naturally at the sides" → v4.0 と直接矛盾。
    return ("Neutral approachable expression, standing pose with both "
            "feet flat on the ground, both arms bent at the elbows "
            "holding a hand-held flag in front of the chest")


def render_person(g, entry, kind, sub):
    template = g.PROMPT_TEMPLATES["vocabulary_person"]
    word = entry["word"]
    if kind == "role":
        char_desc = compose_role_subject(g, sub["role_key"], word)
        char_pose = compose_role_pose()
        exception_block = ROLE_ANTI_FLAG_BLOCK
    elif kind == "nationality":
        # v3.12: apparent_features_hint は phenotype_for(word) で動的計算するため
        # PERSON_NATIONALITY_HINTS からは参照しない（PHENOTYPE_SPECIFICATION_RULE）。
        char_desc = compose_nationality_subject(
            g,
            word,
            sub["flag_shape_and_colors"],
            sub["cultural_styling_hint"],
        )
        char_pose = compose_nationality_pose()
        exception_block = NATIONALITY_EXCEPTION_BLOCK
    else:
        raise ValueError(f"unknown person kind: {kind}")
    return (template
            .replace("[TARGET_WORD]", word)
            .replace("{CHARACTER_DESCRIPTION}", char_desc)
            .replace("{CHARACTER_POSE_AND_EXPRESSION}", char_pose)
            .replace("{NATIONALITY_EXCEPTION_BLOCK}", exception_block))


# ─────────────────────────────────────────────────────────────
# Phase 5 ④ Q3 B: 残り 8 vocab_type template + example_sentence の render 関数
# 設計方針：
#   - lookup-driven (building / concrete_object / abstract_concept): word →
#     guide のデータ table 直接参照 → placeholder 置換。table 未掲載なら ABORT
#     with informative message.
#   - strategy-driven (action_verb / adjective / demonstrative / variant_grid /
#     spatial_relation / example_sentence): 完全 deterministic 化には per-word
#     データ追加表が要る。本 worktree session の責務は配線完成までで、未掲載
#     word での invocation 時には「どこに何を足せばよいか」を明示して ABORT。
#   - lesson_01 では person + building のみ exercise される。他 7 template の
#     dispatch 実行は main session の Q2 B 完了後、--lesson 2 や --catalog で。
# ─────────────────────────────────────────────────────────────


def _require_table_entry(table, word, table_name, hint_path):
    """guide のデータ table から word に対応する entry を取得。
    無ければ informative error で abort。
    """
    if word not in table:
        sys.exit(
            f"ABORT: '{word}' が {table_name} に未掲載。\n"
            f"  追加先: {hint_path}\n"
            f"  既存キー（参考）: {list(table.keys())[:5]} ..."
        )
    return table[word]


def render_building(g, entry):
    """vocabulary_building template を BUILDING_CUES から組み立てる。"""
    word = entry["word"]
    cue = _require_table_entry(
        g.BUILDING_CUES, word, "BUILDING_CUES",
        "prompts/master_prompt_design_guide_v4_0.py § PART 4.4 BUILDING_CUES",
    )
    template = g.PROMPT_TEMPLATES["vocabulary_building"]
    return (template
            .replace("[{BUILDING_TYPE}]", cue["building_type"])
            .replace("[{BUILDING_DESCRIPTION_AND_SCALE}]", cue["building_scale"])
            .replace("[{SIGNAGE_TEXT}]", cue["signage_text"])
            .replace("[{PRIMARY_SCENE_CUE}]", cue["primary_scene_cue"]))


def _per_entry_data_required_abort(vocab_type, word, needed_fields, hint):
    """strategy-driven template が per-word データを要求するが未提供の場合の
    abort 共通ハンドラ。informative message で次セッションへ申し送る。"""
    sys.exit(
        f"ABORT: vocab_type='{vocab_type}' word='{word}' の prompt 生成には\n"
        f"  per-word データが必要：{needed_fields}\n"
        f"  追加先: {hint}\n"
        f"  注：本 render 関数は Phase 5 ④ Q3 B で配線完成のみ。データ表整備は\n"
        f"  Phase 5 ④ 後または Phase 5 ⑤ 着手後の人間／main session タスク。"
    )


def render_object_concrete(g, entry):
    """vocabulary_object_concrete を OBJECT_SIGNATURES から組み立てる。
    DISPLAY_STRATEGY / SIGNAGE_EXCEPTION は per-word 判断のためデフォルト適用。
    """
    word = entry["word"]
    sig = _require_table_entry(
        g.OBJECT_SIGNATURES, word, "OBJECT_SIGNATURES",
        "prompts/master_prompt_design_guide_v4_0.py § PART 4.5 OBJECT_SIGNATURES",
    )
    # OBJECT_SIGNATURES の構造想定：primary_signatures[] / material_hints[] /
    # avoid[]。template の {OBJECT_DESCRIPTION} に概念説明、
    # {VISUAL_SIGNATURE} に primary_signatures、{MATERIAL_TEXTURE_HINT} に
    # material_hints を充てる。display strategy は OBJECT_ALONE デフォルト。
    sig_lines = sig.get("primary_signatures") or []
    material_lines = sig.get("material_hints") or []
    object_desc = sig.get("_en") or word
    strategy_block = (g.OBJECT_STRATEGIES.get("OBJECT_ALONE", "")
                      if hasattr(g, "OBJECT_STRATEGIES") else "")
    template = g.PROMPT_TEMPLATES["vocabulary_object_concrete"]
    return (template
            .replace("[TARGET_WORD]", word)
            .replace("{OBJECT_DESCRIPTION}", object_desc)
            .replace("{VISUAL_SIGNATURE}", "; ".join(sig_lines) or word)
            .replace("{DISPLAY_STRATEGY}", "OBJECT_ALONE")
            .replace("{STRATEGY_BLOCK}", strategy_block)
            .replace("{MATERIAL_TEXTURE_HINT}", "; ".join(material_lines) or "—")
            .replace("{SIGNAGE_EXCEPTION_IF_ANY}", "なし"))


def render_abstract_concept(g, entry):
    """abstract_concept を ABSTRACT_METAPHORS から組み立てる。"""
    word = entry["word"]
    meta = _require_table_entry(
        g.ABSTRACT_METAPHORS, word, "ABSTRACT_METAPHORS",
        "prompts/master_prompt_design_guide_v4_0.py § PART 4.8 ABSTRACT_METAPHORS",
    )
    template = g.PROMPT_TEMPLATES["abstract_concept"]
    return (template
            .replace("[TARGET_WORD]", word)
            .replace("{TARGET_WORD_EN}", meta.get("_en") or entry.get("en") or "")
            .replace("{CONCEPT_DEFINITION}", meta.get("concept_definition", ""))
            .replace("{VISUAL_METAPHOR}", meta.get("visual_metaphor", ""))
            .replace("{EMOTIONAL_TONE}", meta.get("emotional_tone", "neutral"))
            .replace("{COMPOSITION_MOOD}", meta.get("composition_mood", "calm centered"))
            .replace("{COLOR_TONE_ADJUSTMENT}", meta.get("color_tone_adjustment", "default palette")))


def render_action_verb(g, entry):
    """action_verb template の配線。strategy 選択と CHARACTER/ACTION 記述は
    per-word データが必要。未掲載なら informative abort。"""
    word = entry["word"]
    # 期待される per-word データ：character_description, action_description,
    # visualization_strategy ∈ {MOTION_ARROW/OUTCOME/BEFORE_AFTER/SEQUENCE_3PANEL/SYMBOLIC_MOTION_LINES}
    return _per_entry_data_required_abort(
        "action_verb", word,
        ["character_description", "action_description", "visualization_strategy"],
        "guide PART 4.11 ACTION_VERB_STRATEGIES は戦略 block のみ。per-word "
        "選択と CHARACTER_DESCRIPTION/ACTION_DESCRIPTION は将来 "
        "ACTION_VERB_PROFILES = {word: {...}} 形式で追加予定。",
    )


def render_adjective(g, entry):
    """vocabulary_adjective template の配線。ADJECTIVE_STRATEGIES は 3 戦略 block
    のみ。per-word の category / anchor_objects 等は要追加表。"""
    word = entry["word"]
    return _per_entry_data_required_abort(
        "adjective", word,
        ["adjective_category", "anchor_objects", "strategy"],
        "guide PART 4.12 ADJECTIVE_STRATEGIES は戦略 block のみ。per-word "
        "ADJECTIVE_PROFILES = {word: {...}} 形式の表が将来必要。",
    )


def render_demonstrative_kosoado(g, entry):
    """demonstrative_kosoado template の配線。DEMONSTRATIVE_MODELS は 3 model block
    のみ。per-word の SPEAKER/LISTENER/TARGET_OBJECT は要追加表。"""
    word = entry["word"]
    return _per_entry_data_required_abort(
        "demonstrative", word,
        ["ko_so_a_type", "model_type_name", "speaker_description",
         "listener_description", "target_object"],
        "guide PART 4.9 DEMONSTRATIVE_MODELS は model block のみ。per-word "
        "DEMONSTRATIVE_PROFILES が将来必要。",
    )


def render_variant_grid(g, entry):
    """vocabulary_variant_grid は比較対象セットの定義が必要。スカラ word への
    自動 dispatch は通常不要（lesson 設計時に明示的に呼ぶ）。"""
    word = entry["word"]
    return _per_entry_data_required_abort(
        "variant_grid", word,
        ["grid_size", "grid_arrangement", "tile_descriptions[]", "tile_signatures[]"],
        "通常 lesson 設計時に explicit に呼ぶ。VARIANT_GRID_SETS = {set_id: {...}} "
        "形式の表追加が前提。",
    )


def render_spatial_relation(g, entry):
    """spatial_relation template の配線。7 標準位置語（上下左右前後中）の
    REFERENCE_OBJECT / TARGET_OBJECT / SPATIAL_POSITION は要追加表。"""
    word = entry["word"]
    return _per_entry_data_required_abort(
        "spatial_relation", word,
        ["target_word_jp", "target_word_en", "reference_object",
         "target_object", "spatial_position", "camera_setup"],
        "SPATIAL_RELATION_PROFILES = {上/下/前/後ろ/右/左/中: {...}} 形式の "
        "表追加が必要。",
    )


def render_example_sentence(g, example, lesson_no):
    """example_sentence template の配線。lesson_NN.json の patterns[].examples[]
    から呼び出される。per-sentence の CHARACTER_DESCRIPTIONS / SCENE_DESCRIPTION
    /VISUAL_SYMBOL_IF_NEEDED は今 lesson JSON に持たない fields のため、
    sentence/sentenceEn から最小の prompt を heuristic 構成する scaffold。
    将来 lesson_NN.json に example.imagePrompt = {characters, scene,
    visualSymbol, composition} を追加すれば deterministic 化できる。
    """
    sentence_jp = example.get("sentence", "")
    sentence_en = example.get("sentenceEn", "")
    if not sentence_jp:
        sys.exit(f"ABORT: example_sentence: sentence が空 (lesson {lesson_no}, "
                 f"no={example.get('no')})")
    # 詳細記述が lesson JSON に未付与の場合の heuristic defaults。
    # v4.0 universal rules（FACIAL_FEATURES / HEAD_BODY_PROPORTION / FOOTWEAR）は
    # template 本体に v4.1 で inline 済（Q1 A）なので、ここでは character identity の
    # 最小記述だけ提供すればよい（重複記述を避ける）。
    img_prompt_meta = example.get("imagePrompt") or {}
    character_descriptions = img_prompt_meta.get(
        "characterDescriptions",
        "Two generic adult Japanese speakers in modern daily casual wear, "
        "neutral approachable expressions.",
    )
    scene_description = img_prompt_meta.get(
        "sceneDescription",
        f"A simple eye-level scene that visually depicts the sentence: "
        f"'{sentence_jp}'. The scene must make the sentence meaning obvious "
        f"without text.",
    )
    visual_symbol = img_prompt_meta.get("visualSymbolIfNeeded", "")
    composition_notes = img_prompt_meta.get("compositionNotes", "")
    template = g.PROMPT_TEMPLATES["example_sentence"]
    return (template
            .replace("[{SENTENCE_JP}]", sentence_jp)
            .replace("{SENTENCE_EN}", sentence_en)
            .replace("{CHARACTER_DESCRIPTIONS}", character_descriptions)
            .replace("{SCENE_DESCRIPTION}", scene_description)
            .replace("{VISUAL_SYMBOL_IF_NEEDED}", visual_symbol)
            .replace("{COMPOSITION_NOTES}", composition_notes))


# ─────────────────────────────────────────────────────────────
# vocab_type → render 関数 dispatch（Q3 B）
# vocab_type 文字列は data/vocab_types_lesson*.json および将来 main の Q2 B
# classifier 出力で使われる canonical 値に合わせる。person + building は
# lesson_01 で確認済、それ以外は main Q2 B 完了後に実 exercise される。
# ─────────────────────────────────────────────────────────────
def render_vocab_entry(g, entry):
    """vocabulary 1 件分の prompt を vocab_type に応じて dispatch。"""
    vt = entry.get("vocab_type")
    if vt is None:
        sys.exit(f"ABORT: vocab_type 未設定: {entry.get('word', '?')} "
                 f"(imageId={entry.get('imageId', '?')})")
    word = entry["word"]
    if vt == "person":
        kind, sub = classify_person(word)
        if kind is None:
            sys.exit(f"ABORT: '{word}' が PERSON_ROLE_LOOKUP / "
                     f"PERSON_NATIONALITY_HINTS のいずれにも未掲載")
        return render_person(g, entry, kind, sub)
    if vt == "building":
        return render_building(g, entry)
    if vt == "concrete_object":
        return render_object_concrete(g, entry)
    if vt == "abstract_concept":
        return render_abstract_concept(g, entry)
    if vt == "action_verb":
        return render_action_verb(g, entry)
    if vt == "adjective":
        return render_adjective(g, entry)
    if vt == "demonstrative":
        return render_demonstrative_kosoado(g, entry)
    if vt == "variant_grid":
        return render_variant_grid(g, entry)
    if vt == "spatial_relation":
        return render_spatial_relation(g, entry)
    sys.exit(f"ABORT: 未対応 vocab_type='{vt}' (word={word})")


def flatten_examples(lesson_doc):
    """lesson_NN.json の patterns[].examples[] を flatten。"""
    examples = []
    for pat in lesson_doc.get("patterns", []) or []:
        for ex in pat.get("examples", []) or []:
            if ex.get("imageId"):
                examples.append(ex)
    return examples


# ─────────────────────────────────────────────────────────────
# Pre-flight invariants（invariants.mjs C 相当）
# ─────────────────────────────────────────────────────────────
BG_EXACT_CREAM  = "soft cream off-white background (warm off-white, NOT pure stark white)"
BG_EXACT_SKYBLUE = "pale sky-blue background"
NOT_TOKEN = "NOT pure stark white"

RE_FULLBODY      = re.compile(r"full[-\s]?body|head[-\s]?to[-\s]?toe", re.IGNORECASE)
RE_AREA_PERCENT  = re.compile(r"fills\s+\d+\s*[-–]?\s*\d*\s*%\s+of\s+the\s+image\s+area", re.IGNORECASE)
RE_PORTRAIT_LENS = re.compile(r"85\s*mm\s+portrait\s+lens", re.IGNORECASE)
RE_FLAG_OR_NAT   = re.compile(r"flag|nationality|国旗", re.IGNORECASE)
RE_STRONG_TOKEN  = re.compile(r"\b(must|never|DO NOT)\b")
# 任意の未置換 placeholder を検出する汎用パターン:
#   {WORD_LIKE} または [{WORD_LIKE}] — 大文字英字 + アンダースコア
RE_PLACEHOLDER_REMAIN = re.compile(r"\[\{[A-Z_]+\}\]|\{[A-Z_]+\}")


# vocab_type / 例文 ごとの BG 期待値
def _expected_bg(template_kind):
    return BG_EXACT_SKYBLUE if template_kind == "building" else BG_EXACT_CREAM


def preflight(text, template_kind, word):
    """template_kind: vocab_type 文字列 or 'example_sentence' を受ける。
    BG / NOT_TOKEN / 残存 placeholder / person 特有制約 / flag 文脈強表現
    を invariants.mjs C 相当でチェック。
    """
    errs = []
    bg_expected = _expected_bg(template_kind)
    if bg_expected not in text:
        errs.append(f"[C4] {word}: background string 不一致（必須: '{bg_expected}'）")
    # NOT pure stark white は cream BG template にのみ必須
    if template_kind != "building" and NOT_TOKEN not in text:
        errs.append(f"[C5] {word}: NOT-token 不一致（必須: '{NOT_TOKEN}'）")
    if template_kind == "person":
        if not RE_FULLBODY.search(text):
            errs.append(f"[C1] {word}: full-body / head-to-toe が無い")
        if RE_AREA_PERCENT.search(text):
            errs.append(f"[C1] {word}: 面積指定 'fills NN% of...' が残存")
        if RE_PORTRAIT_LENS.search(text):
            errs.append(f"[C1] {word}: '85mm portrait lens' が残存")
    if RE_FLAG_OR_NAT.search(text):
        if not RE_STRONG_TOKEN.search(text):
            errs.append(f"[C6] {word}: flag/nationality 文脈に強表現 must/never が無い")
    leftovers = RE_PLACEHOLDER_REMAIN.findall(text)
    if leftovers:
        # 重複除去して順序保持
        seen = set()
        uniq = [x for x in leftovers if not (x in seen or seen.add(x))]
        errs.append(f"[PH] {word}: 未置換 placeholder 残存: {uniq[:5]}")
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
# main（Phase 5 ④ Q3 B 拡張版 — 全 vocab_type + 例文 + --catalog mode）
# ─────────────────────────────────────────────────────────────
def _process_vocab_entries(g, entries, source_label):
    """vocab entries 群を render_vocab_entry で dispatch し、preflight を回す。"""
    rendered, all_errors = [], []
    for entry in entries:
        if not entry.get("vocab_type"):
            print(f"  WARN: vocab_type 未設定 skip: {entry.get('word', '?')}",
                  file=sys.stderr)
            continue
        prompt = render_vocab_entry(g, entry)
        all_errors.extend(preflight(prompt, entry["vocab_type"], entry["word"]))
        rendered.append({
            "imageId":    entry.get("imageId") or f"word_{entry['word']}",
            "word":       entry["word"],
            "reading":    entry.get("reading", ""),
            "en":         entry.get("en", ""),
            "vocab_type": entry["vocab_type"],
            "prompt":     prompt,
            "_source":    source_label,
        })
    return rendered, all_errors


def _process_examples(g, lesson_doc, lesson_no):
    """lesson_NN.json の patterns[].examples[] を flatten し
    render_example_sentence を回す。"""
    rendered, all_errors = [], []
    for ex in flatten_examples(lesson_doc):
        prompt = render_example_sentence(g, ex, lesson_no)
        # example_sentence は word 概念がないので imageId を word 代用
        all_errors.extend(preflight(prompt, "example_sentence", ex["imageId"]))
        rendered.append({
            "imageId":     ex["imageId"],
            "sentence":    ex.get("sentence", ""),
            "sentenceEn":  ex.get("sentenceEn", ""),
            "pattern":     ex.get("pattern", ""),
            "vocab_type":  "example_sentence",
            "prompt":      prompt,
        })
    return rendered, all_errors


def main():
    ap = argparse.ArgumentParser(
        description="Phase 5 ④ 決定論 prompt 生成（全 vocab_type + 例文）",
    )
    ap.add_argument("--lesson", type=int, default=None,
                    help="課番号 (--catalog と排他)")
    ap.add_argument("--catalog", action="store_true",
                    help="data/vocab_catalog.json の vocab_type 付き entries を一気生成")
    ap.add_argument("--vocab-types", default=None,
                    help="--lesson モードで vocab_types JSON のパス上書き")
    ap.add_argument("--out", default=None,
                    help="出力パス（既定: --lesson は data/image_prompts_lessonNN_v4_0.json、"
                         "--catalog は data/image_prompts_catalog_v4_0.json）")
    args = ap.parse_args()

    if args.lesson is None and not args.catalog:
        sys.exit("ABORT: --lesson NN か --catalog のいずれかを指定してください。")
    if args.lesson is not None and args.catalog:
        sys.exit("ABORT: --lesson と --catalog は排他です。")

    g = load_guide()

    if args.catalog:
        # ─── --catalog mode ─────────────────────────────────────────
        catalog_path = os.path.join(ROOT, "data", "vocab_catalog.json")
        if not os.path.exists(catalog_path):
            sys.exit(f"ABORT: {catalog_path} が不在")
        with open(catalog_path, encoding="utf-8") as f:
            cat = json.load(f)
        entries_with_type = [e for e in cat.get("entries", []) if e.get("vocab_type")]
        entries_without_type = len(cat.get("entries", [])) - len(entries_with_type)
        print(f"catalog: {len(entries_with_type)} entries with vocab_type "
              f"({entries_without_type} skipped without vocab_type)")
        if entries_without_type > 0:
            print(f"  注：vocab_type 未設定の {entries_without_type} 件は main の Q2 B "
                  f"（Gemini classify）完了後に埋まる予定")
        rendered, all_errors = _process_vocab_entries(
            g, entries_with_type, "catalog",
        )
        out_path = args.out or os.path.join(
            ROOT, "data", "image_prompts_catalog_v4_0.json",
        )
        meta_source = "data/vocab_catalog.json"
    else:
        # ─── --lesson NN mode ───────────────────────────────────────
        vocab_types_path = args.vocab_types or os.path.join(
            ROOT, "data", f"vocab_types_lesson{args.lesson:02d}.json",
        )
        if not os.path.exists(vocab_types_path):
            sys.exit(
                f"ABORT: vocab_types ファイルが不在: {vocab_types_path}\n"
                f"  対処：main session 側で classify-and-translate.mjs により "
                f"lesson_{args.lesson:02d} の vocab_type を生成する必要あり。",
            )
        with open(vocab_types_path, encoding="utf-8") as f:
            vt_doc = json.load(f)
        vocab_entries = vt_doc.get("vocabulary", [])
        if not vocab_entries:
            sys.exit(f"ABORT: {vocab_types_path} に vocabulary entries が無い")
        rendered_vocab, errs_vocab = _process_vocab_entries(
            g, vocab_entries, f"vocab_types_lesson{args.lesson:02d}",
        )

        # 例文：lesson_NN.json から patterns[].examples[] を読む
        lesson_path = os.path.join(ROOT, "data", f"lesson_{args.lesson:02d}.json")
        rendered_examples, errs_examples = [], []
        if os.path.exists(lesson_path):
            with open(lesson_path, encoding="utf-8") as f:
                lesson_doc = json.load(f)
            try:
                rendered_examples, errs_examples = _process_examples(
                    g, lesson_doc, args.lesson,
                )
            except SystemExit as e:
                # render_example_sentence は ABORT exit を投げる — そのまま伝播
                raise
        else:
            print(f"  notice: {lesson_path} 不在のため例文 prompt は生成しない")

        rendered = rendered_vocab + rendered_examples
        all_errors = errs_vocab + errs_examples
        out_path = args.out or os.path.join(
            ROOT, "data", f"image_prompts_lesson{args.lesson:02d}_v4_0.json",
        )
        meta_source = os.path.relpath(vocab_types_path, ROOT).replace("\\", "/")

    if all_errors:
        print(f"\n=== invariant violations: {len(all_errors)} ===", file=sys.stderr)
        for e in all_errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit("ABORT: pre-flight 違反のため書き出しません。")

    covered = sorted({e["vocab_type"] for e in rendered})
    out = {
        "_meta": {
            "mode":                 "catalog" if args.catalog else f"lesson{args.lesson:02d}",
            "guideVersion":         "v4.0",
            "guideHashNormalized":  guide_hash_lf_normalized(GUIDE_PATH),
            "generatedAt":          datetime.date.today().isoformat(),
            "generator":            "scripts/build_prompts.py",
            "scriptHash":           file_hash(os.path.abspath(__file__)),
            "source":               meta_source,
            "coveredVocabTypes":    covered,
            "totalEntries":         len(rendered),
            "notes": (
                "Phase 5 ④ Q3 B 拡張版（2026-05-22）：vocabulary 9 vocab_type + "
                "例文 (example_sentence) の dispatch + render 関数 完成。person + "
                "building は完全実装（BUILDING_CUES driven）、abstract_concept / "
                "concrete_object は data table 引きで実装、action_verb / adjective / "
                "demonstrative / variant_grid / spatial_relation / example_sentence "
                "は配線完成・per-word データ未整備 word で invocation 時は informative "
                "abort。catalog mode は main Q2 B の vocab_type 付与後に有効化される。"
            ),
        },
        "vocabulary": rendered,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\nOK: {len(rendered)} entries → {out_path}")
    print(f"  guideHashNormalized: {out['_meta']['guideHashNormalized']}")
    print(f"  source:              {meta_source}")
    print(f"  coveredVocabTypes:   {covered}")
    print(f"  Pre-flight invariants: PASS（{len(rendered)} 件全て）")


if __name__ == "__main__":
    main()
