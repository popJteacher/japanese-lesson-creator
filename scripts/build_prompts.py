# -*- coding: utf-8 -*-
"""決定論 S列生成スクリプト（v3.12 主経路 / nanobanana 固定運用）— MVP: vocab_type=person のみ

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

v3.12 (2026-05-21): 3 universal rules を実装。
  - PART 1.5 PHENOTYPE_SPECIFICATION_RULE: phenotype_for(word) が
    COUNTRY_TO_PROFILE → PHENOTYPE_PROFILES (rule_c) または
    ROLE_PHENOTYPE_PALETTE の deterministic 選択 (rule_d) で単一 concrete
    記述を返す。enumerate 表現は廃止。
  - PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE: pattern_for(word) が
    TRADITIONAL_DRESS_PATTERN_LOOKUP から country 用 textile element を返し、
    cultural_styling_hint の末尾に append される。lookup に entry が無い
    country では何も append しない（rule_e modern_styles_exempt）。
  - PART 1.7 FLAG_PLACEMENT_RULE: flag_placement_for(word) が
    FLAG_PLACEMENT_OPTIONS から sha256(word+'flag-placement') mod 4 で位置を
    選び、subject_block_pattern の {FLAG_PLACEMENT} に注入する。
  - 共通: _deterministic_pick(word, options, salt) ヘルパーで sha256 ベース
    選択を集約。
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
# v3.12 主経路（nanobanana 固定運用）。
# v3.11.1 のロールバックは prompts/master_prompt_design_guide_v3_11_1.py
# 末尾の rollback 手順参照。
GUIDE_PATH = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_12.py")


def load_guide():
    spec = importlib.util.spec_from_file_location("guide_v3_12", GUIDE_PATH)
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
    # v3.9 全面改訂（v3.8 実機検証フィードバック反映）：
    #   - v3.8 で「3 option pick ONE（うち option (a) modern X casual）」構造を採ったが、
    #     Imagen は常に最 safe な (a) を選び、5/7 か国（米・韓・中・スペイン・一部
    #     ブラジル）が「t-shirt + casual pants + 旗ピン」の同型に収束。文化要素が
    #     option (b)/(c) にしか無い国（日: wagara/yukata、ベトナム: áo dài）だけ
    #     成功した。3 option 並列構造そのものが収束の原因。
    #   - v3.9 で全国「modern X casual」option を撤廃し、必須要素方式に再構成：
    #     全 option が culturally identifiable element を必ず含む。Imagen は文化
    #     要素を必ず持つ 1 つを discrete に選ぶ。
    #   - アメリカ人 "graphic t-shirt" → Imagen が国旗プリント化した実機事故を受け
    #     "plain solid-color OR non-flag/non-team patterned" に書き換え。
    #   - ブラジル人 green/yellow football-supporter palette → 旗類似/CBF クレスト
    #     混入の高リスクを受け option ごと撤去、botanical/linen/woven-craft で再構成。
    #   - 中国人 / スペイン人 "subtle warm red or yellow accent" → 旗ピン (red+yellow)
    #     と合わさり旗類似化するため撤去。「avoid red+yellow combination」明示。
    #   - 普遍 hard_constraint = NATIONAL_SYMBOL_ISOLATION_RULE は
    #     prompts/master_prompt_design_guide_v3_9.py PART 1.1 に追加済み。
    #     本辞書はそのルール準拠で書く。
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
            # v3.12.1: option (c) yukata を削除。yukata は one-piece の伝統衣装
            # だが、その後の TWO-COLOR RULE が "top and trousers MUST be in
            # two clearly different colors" を要求するため、Imagen に矛盾シグナル
            # （one-piece に対して上下対比を求める）を送っていた。両 (a)(b) は
            # 2-piece (top + trousers / jacket + inner-top + trousers) なので
            # TWO-COLOR RULE と整合。yukata 系の文化要素は (a) wagara で
            # 別 garment 形で表現する。
            "The outfit MUST include at least one culturally identifiable "
            "Japanese element. Pick ONE of the following patterns: "
            "(a) a clean contemporary top with a subtle wagara (traditional "
            "Japanese geometric or floral) pattern — e.g., asanoha (hemp-leaf), "
            "seigaiha (wave), shippō (overlapping circles) — worn over simple "
            "trousers; "
            "(b) a modern noragi-inspired light jacket (kimono-cut workwear "
            "silhouette, straight sleeves, wide front overlap with a simple "
            "tie or button closure) worn over a plain top and trousers. "
            # v3.10 二色化必須化（旗色 overlap 回避）:
            "TWO-COLOR RULE: top and trousers MUST be in two clearly "
            "different colors, NOT a single all-over color. Recommended "
            "combinations: muted indigo top + cream trousers / sage green "
            "top + charcoal trousers / soft beige top + muted indigo "
            "trousers / charcoal noragi + cream inner-top + indigo trousers. "
            "AVOID flag-like combinations: NEVER white top + solid red "
            "trousers, NEVER solid red top + white trousers, NEVER a "
            "large red circle motif centered on a white garment. The flag "
            "pin already carries the white+red signal.",
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
            "The outfit MUST include at least one culturally identifiable "
            "Chinese element. Pick ONE of the following patterns: "
            "(a) a modernized cheongsam/qipao-inspired top — a contemporary "
            "blouse with subtle frog-button closures and a mandarin (stand) "
            "collar, NOT a full formal qipao — worn with simple modern "
            "trousers; "
            "(b) a Tang-jacket-inspired short jacket (stand collar, "
            "straight-cut front, frog-button or knot closures) over a "
            "plain top with neat trousers; "
            "(c) a modern outfit with a clearly Chinese silk-print scarf "
            "(traditional motif such as cloud, peony, or phoenix in muted "
            "modern colors) as the cultural accent, worn over a plain blouse "
            "and trousers. "
            "Color note: AVOID a red+yellow color combination on the outfit "
            "(the flag pin already carries that signal). Prefer muted "
            "earth tones, cream, indigo, cool blue, or soft jade. "
            # v3.10 二色化必須化:
            "TWO-COLOR RULE: top and trousers MUST be in two clearly "
            "different colors (NOT all-over a single color). Recommended "
            "combinations: soft jade top + cream trousers / indigo top + "
            "warm sand trousers / cream blouse with indigo frog buttons + "
            "charcoal trousers / muted dusty rose top + indigo trousers. "
            "If choosing pattern (c), the silk scarf provides a third "
            "accent color drawn from cool/earth palette (NOT red+yellow).",
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
            "The outfit MUST include at least one culturally identifiable "
            "American element drawn from American daily-wear heritage. "
            "Pick ONE of the following patterns: "
            "(a) American workwear-heritage casual — a denim or canvas chore "
            "coat (work jacket with patch pockets) over a plain crew-neck "
            "t-shirt with straight-leg jeans and work-style boots or "
            "sneakers; "
            "(b) American flannel-shirt casual — a plaid or check flannel "
            "button-up shirt (a non-national, non-team check pattern) worn "
            "open over a plain solid-color t-shirt, with jeans or chinos; "
            "(c) American varsity/collegiate casual — a varsity-cut letterman-"
            "style jacket (NO team logo, NO letter on the chest, NO flag "
            "motif; just the silhouette: wool body, contrast leather sleeves, "
            "ribbed collar/cuffs/hem) over a plain t-shirt with jeans. "
            "T-shirt rule: any t-shirt MUST be a plain solid color OR have "
            "a small abstract / botanical / geometric print that is "
            "explicitly NOT a flag, NOT a national symbol, and NOT a team "
            "logo (per NATIONAL_SYMBOL_ISOLATION_RULE).",
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
            "The outfit MUST include at least one culturally identifiable "
            "Korean element. Pick ONE of the following patterns: "
            "(a) a hanbok-inspired modern top — a soft empire-waist line "
            "with a high cropped jeogori-style bodice and gently flowing "
            "lower hem, in a non-festival modern muted color palette — "
            "worn with simple modern trousers as daily wear (NOT a "
            "ceremonial hanbok); "
            "(b) contemporary K-fashion structured outerwear with a "
            "distinctly Korean silhouette — a long oversized minimalist "
            "trench-style coat or a clean-line modern blazer with sharp "
            "shoulders, over a plain top with neat trousers and clean "
            "modern sneakers or loafers; "
            "(c) a modern outfit incorporating a clearly hanbok-inspired "
            "accent — a wrap-front blouse with a single fabric ribbon-tie "
            "(otgoreum-inspired) at the chest in a contrasting muted color, "
            "worn with simple trousers. "
            # v3.10 二色化必須化:
            "TWO-COLOR RULE: top and trousers MUST be in two clearly "
            "different colors (NOT all-over a single color). For pattern "
            "(a), the jeogori top should be one color and the trousers "
            "another — recommended: soft sage jeogori + cream trousers / "
            "muted dusty rose jeogori + charcoal trousers / pale indigo "
            "jeogori + warm sand trousers. For pattern (c), the otgoreum "
            "ribbon-tie should be in a clearly contrasting third color "
            "(e.g., cream blouse + indigo ribbon + charcoal trousers). "
            "For pattern (b), the trench/blazer and the trousers underneath "
            "should differ in value (e.g., cream coat + charcoal trousers, "
            "or indigo coat + warm sand trousers).",
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
            "The outfit MUST include at least one culturally identifiable "
            "Brazilian element drawn from daily life (NOT football/team "
            "colors). Pick ONE of the following patterns: "
            "(a) a Brazilian botanical-print short-sleeve top — a relaxed-fit "
            "shirt or blouse with a tropical leaf/palm/floral print in "
            "earthy natural tones (terracotta, sand, sage, muted indigo — "
            "EXPLICITLY NOT green-and-yellow national-team colors) — worn "
            "with light trousers and casual sandals or canvas sneakers; "
            "(b) Brazilian beach-town linen layering — a loose breathable "
            "linen camp-collar shirt worn open over a plain tank top with "
            "light drawstring trousers and havaianas-style flat sandals; "
            "(c) a modern everyday outfit accented with Brazilian artisan "
            "craft — a plain solid-color top and trousers paired with a "
            "small visible braided/woven cord bracelet or beaded accessory "
            "(fita-do-bonfim-inspired wish-ribbon style, in muted earth "
            "tones, NOT national flag colors) as the cultural accent. "
            "Color note: AVOID green + yellow as the dominant garment "
            "palette (the flag pin already carries that signal and the "
            "combination reads as a national-team uniform).",
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
            "The outfit MUST include at least one culturally identifiable "
            "Vietnamese element. Pick ONE of the following patterns: "
            "(a) a modern everyday áo dài — a long-tunic top reaching "
            "mid-thigh to knee with a mandarin (stand) collar and side "
            "slits, worn over loose trousers as daily wear (NOT a "
            "ceremonial / festival áo dài, NOT with elaborate embroidery); "
            "(b) a modernized áo bà ba-inspired outfit — a simple "
            "lightweight cotton tunic with side splits over loose drawstring "
            "trousers, traditionally Southern Vietnamese daily wear "
            "modernized for contemporary urban use; "
            "(c) a modern outfit accented with a Vietnamese non-conical "
            "woven straw or rattan crossbody bag (clearly Vietnamese craft "
            "object, NOT a tourist nón lá conical hat) worn over a simple "
            "linen blouse with light trousers. "
            "Color note: AVOID a red top with a single yellow ornament "
            "centered on the chest (that reads as the Vietnamese flag). "
            # v3.10 二色化必須化（áo dài は伝統的に body と trousers が別色）:
            "TWO-COLOR RULE: the áo dài or áo bà ba body and the trousers "
            "underneath MUST be in two clearly different colors — this is "
            "traditional and authentic (a single all-over color reads as "
            "uniform, not daily wear). Recommended combinations: soft "
            "jade áo dài + cream trousers / pale indigo áo dài + warm sand "
            "trousers / muted dusty rose áo dài + cream trousers / cream "
            "áo bà ba + indigo trousers. AVOID red áo dài + yellow trousers "
            "(flag-like).",
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
            "The outfit MUST include at least one culturally identifiable "
            "Spanish/Iberian element. Pick ONE of the following patterns: "
            "(a) Spanish summer espadrille casual — a loose-fit linen "
            "button-up shirt with rolled sleeves over a plain tee with "
            "light chinos and visible woven jute-soled espadrilles (clearly "
            "espadrilles, the iconic Spanish/Catalan footwear) — the "
            "espadrille is the cultural anchor; "
            "(b) Andalusian-inspired draped casual — a draped flowing top "
            "with subtle geometric Moorish-inspired trim/edging (small "
            "tile-pattern accent at the hem or sleeve, in muted earthy "
            "tones), worn with wide trousers and minimalist leather "
            "sandals; "
            "(c) a modern outfit accented with a clearly Spanish manton-"
            "inspired fringed shawl or scarf draped over one shoulder "
            "(traditional Spanish embroidered shawl silhouette modernized "
            "in solid muted color with a single visible fringed edge), "
            "worn over a plain top and trousers. "
            "Color note: AVOID a red+yellow color combination on the "
            "outfit (the flag pin already carries that signal). Prefer "
            "muted earth tones, terracotta, cream, indigo, or cool blue.",
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
# v3.12 universal rule data tables（プロンプトガイド PART 1.5/1.6/1.7 参照）
# ─────────────────────────────────────────────────────────────

# PART 1.5 PHENOTYPE_SPECIFICATION_RULE データ群
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
# TRADITIONAL_DRESS_PATTERN_LOOKUP (country → 1 つの concrete English pattern)
#   rule_c (English motif names only) 準拠：kanji / hangul / 非ラテン文字を含めない。
#   rule_e (modern_styles_exempt) 準拠：modern 衣装中心の country は entry 不要。
#   v3.12 では 4 Asian countries のみ entry を持つ（cultural silhouette が
#   plain solid color に倒れやすい順）。残り 3 国は cultural_styling_hint 自体に
#   modern pattern が組み込まれているため exempt。
TRADITIONAL_DRESS_PATTERN_LOOKUP = {
    "日本人":
        "a subtle wagara textile pattern (asanoha hemp-leaf or seigaiha "
        "wave motif, woven in a tone-on-tone contrast)",
    "韓国人":
        "fine traditional Korean embroidery — a crane or pine-branch "
        "motif worked in a single contrasting thread color along the "
        "collar edge or cuff",
    "中国人":
        "a small traditional Chinese embroidered motif (peony or "
        "plum-blossom) worked at the chest or shoulder of the garment",
    "ベトナム人":
        "a thin contrasting embroidered border running along the collar, "
        "cuff, and side-slit hem of the garment",
}

# PART 1.7 FLAG_PLACEMENT_RULE データ
#
# FLAG_PLACEMENT_OPTIONS (4 entries・既存衣服に乗る選択肢のみ)
#   rule_a (garment_only) 準拠：hat / bag / book / shoe は含まない。
#   選択：sha256(word + 'flag-placement') mod 4。
#   各 entry は subject_block_pattern の {FLAG_PLACEMENT} に直挿し可能な
#   完結した前置詞句として書く（"is positioned {FLAG_PLACEMENT} as a ..."）。
FLAG_PLACEMENT_OPTIONS = [
    "as a circular pin on the left chest of the outer garment",
    "as a circular pin on the right chest near the collar",
    "as a small rectangular cloth patch on the right upper sleeve",
    "as a small rectangular cloth patch on the left upper sleeve near the shoulder",
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


def pattern_for(word):
    """PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE 準拠で word に対応する
    textile pattern 文字列を返す。lookup に entry が無ければ None
    (rule_e modern_styles_exempt)。
    """
    return TRADITIONAL_DRESS_PATTERN_LOOKUP.get(word)


def flag_placement_for(word):
    """PART 1.7 FLAG_PLACEMENT_RULE 準拠で word に対応する flag 位置記述を返す。
    必ず FLAG_PLACEMENT_OPTIONS から 1 つ選ぶ (sha256 mod 4)。
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
    pattern = pattern_for(word)
    if pattern:
        cultural_styling_hint = (
            cultural_styling_hint
            + f" TRADITIONAL DRESS PATTERN (v3.12 PART 1.6): the garment MUST "
              f"visibly include {pattern}."
        )
    flag_placement = flag_placement_for(word)
    return (g.NATIONALITY_NOUN_POLICY["subject_block_pattern"]
            .replace("{FLAG_SHAPE_AND_COLORS}", flag_shape_and_colors)
            .replace("{CULTURAL_STYLING_HINT}", cultural_styling_hint)
            .replace("{APPARENT_FEATURES_HINT}", phenotype_sentence)
            .replace("{FLAG_PLACEMENT}", flag_placement))


def compose_nationality_pose():
    return ("Neutral approachable expression, relaxed standing pose with both feet flat "
            "on the ground, arms naturally at the sides")


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
                "{FLAG_PLACEMENT}",  # v3.12 PART 1.7
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
                    help="出力パス（既定: data/image_prompts_lessonNN_v3_12.json）")
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
        ROOT, "data", f"image_prompts_lesson{args.lesson:02d}_v3_12.json"
    )
    out = {
        "_meta": {
            "lessonNo": args.lesson,
            "guideVersion": "v3.12",
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
                      " の PERSON_ROLE_LOOKUP / PERSON_NATIONALITY_HINTS で解決する。"
                      " v3.12: 3 universal rules (PART 1.5 PHENOTYPE_SPECIFICATION_RULE / "
                      "PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE / PART 1.7 FLAG_PLACEMENT_RULE) "
                      "を実装。phenotype / pattern / flag-placement は word hash + lookup で "
                      "deterministic に解決。"),
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
