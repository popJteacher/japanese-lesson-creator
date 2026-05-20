# -*- coding: utf-8 -*-
"""
apply_v3_4.py — master_prompt_design_guide v3.3 → v3.4 決定論パッチ

v3.3 で deferred になった残り 30+ 件を実装する。
  - M-5: BUILDING_BACKGROUND_EXACT 定数（ガイド側）
  - M-6: BUILDING_CUES に building_type フィールド（M-7 と統合）
  - M-7 wave: 5 補助辞書のキー正規化（"会社(company office)" → "会社"）
             + _en フィールド追加
             + M-52 ABSTRACT_METAPHORS composition_mood 全 13 件追加
             + PART 8 末尾プレースホルダ出所表新設
  - M-10: テンプレ G {SPEAKER_DESCRIPTION}/{LISTENER_DESCRIPTION} 出所明示
  - M-11: 改訂履歴 v3.3 セクション追加
  - M-27/M-40: iconization_level の note 拡充
  - M-32: VISUAL_SYMBOLS 機能重複 note
  - M-36: NATIONALITY_NOUN_POLICY subject_block_pattern 重複削除
  - M-39/M-41: focal_length 全 vocab_type マッピング新設

入力: prompts/master_prompt_design_guide_v3_3.py (hash 80de1a8e675f)
出力: prompts/master_prompt_design_guide_v3_4.py

M-15 wave (テンプレ D/H/J STRATEGY_BLOCK 構造化) は次パッチ (v3.5) で扱う。
"""
import ast
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_3.py")
DST = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_4.py")

L = lambda *xs: "\n".join(xs)


# ─────────────────────────────────────────────────────────────
# ヘッダー更新
# ─────────────────────────────────────────────────────────────
H_OLD = "# Version 3.3 | 2026-05-20 (= v3.2 + 監査72項目の決定論一括是正。全変更=apply_v3_3.py のみ)"
H_NEW = L(
    "# Version 3.4 | 2026-05-20 (= v3.3 + 残り個別修正 + M-7 wave 補助辞書キー正規化。全変更=apply_v3_4.py のみ)",
    "#   M-5: BUILDING_BACKGROUND_EXACT 定数（invariants.mjs C4 building 分岐と整合）",
    "#   M-6 + M-7 wave: 5 補助辞書のキー正規化（『会社(company office)』→『会社』）",
    "#                   + _en フィールド追加 + M-52 ABSTRACT_METAPHORS.composition_mood 13 件追加",
    "#   M-10: テンプレ G {SPEAKER_DESCRIPTION}/{LISTENER_DESCRIPTION} 出所明示",
    "#   M-11: 改訂履歴 v3.3 / v3.4 セクション追加",
    "#   M-27 / M-40: iconization_level の vocab_types 実態整合 note",
    "#   M-32: VISUAL_SYMBOLS 機能重複の note",
    "#   M-36: NATIONALITY_NOUN_POLICY subject_block_pattern 重複削除",
    "#   M-39 / M-41: focal_length_standards に vocab_type 別 lens マッピング新設",
    "#   PART 8 末尾: プレースホルダ出所表新設",
    "# Version 3.3 | 2026-05-20 (= v3.2 + 監査72項目の決定論一括是正。全変更=apply_v3_3.py のみ)",
)


# ─────────────────────────────────────────────────────────────
# M-5: BUILDING_BACKGROUND_EXACT 定数（STYLE_BIBLE 直下）
# ─────────────────────────────────────────────────────────────
M5_OLD = '''STYLE_BIBLE = {

  ## 全画像共通の固定フレーズ（変更厳禁）
  "core_style": "Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.",'''

M5_NEW = '''## ─────────────────────────────────────────────────────────────
## v3.4 (M-5): vocab_type 別の背景文字列定数
##   invariants.mjs C4 の BACKGROUND_BY_TYPE と整合する SSOT 定数。
##   テンプレート本文の背景文字列はこの定数値を一字一句一致させる。
## ─────────────────────────────────────────────────────────────
BACKGROUND_BY_TYPE = {
  "default":  "soft cream off-white background (warm off-white, NOT pure stark white)",
  "building": "pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette",
}
BUILDING_BACKGROUND_EXACT = BACKGROUND_BY_TYPE["building"]


STYLE_BIBLE = {

  ## 全画像共通の固定フレーズ（変更厳禁）
  "core_style": "Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.",'''


# ─────────────────────────────────────────────────────────────
# M-11: 改訂履歴 v3.3 / v3.4 セクションを追加
#   現在のヘッダ直後（## 改訂履歴 セクション直下）に新セクションを差し込む。
# ─────────────────────────────────────────────────────────────
M11_OLD = '''## ============================================================
## 改訂履歴
## ============================================================
##
## ────────────────────────────────────────────────────────────
## v3.1 (2026-05-19): 問題F の完遂 + 背景クリーム化リグレッション是正'''
M11_NEW = '''## ============================================================
## 改訂履歴
## ============================================================
##
## ────────────────────────────────────────────────────────────
## v3.4 (2026-05-20): v3.3 deferred + M-7 wave 補助辞書キー正規化
## ────────────────────────────────────────────────────────────
##
## 背景: v3.3 で deferred とした個別修正 30+ 件 + M-7 wave 補助辞書キー正規化
##   を一括反映。apply_v3_4.py で決定論的に適用。
##
## §1. M-7 wave 完遂: BUILDING_CUES / OBJECT_SIGNATURES / ABSTRACT_METAPHORS /
##     SPATIAL_GRID_PATTERNS / VISUAL_SYMBOLS の 5 補助辞書のキーを日本語単体
##     に正規化（"会社(company office)" → "会社" + _en フィールド）。
##     これにより lesson_NN.json の word（bare 日本語）から直接 lookup できる。
## §2. M-52: ABSTRACT_METAPHORS 全 13 エントリに composition_mood フィールドを追加。
##     テンプレート I の {COMPOSITION_MOOD} プレースホルダ用。
## §3. PART 8 末尾にプレースホルダ出所表を新設。lesson_NN.json と補助辞書から
##     プロンプトテンプレートのどのプレースホルダがどの値で埋まるかを一覧化。
## §4. 個別修正: M-5/6/10/11/27/32/36/39/40/41。
##
## §5. v3.4 で残る backlog（v3.5 / Phase 4 後で対応）:
##   - M-15 wave: テンプレ D/H/J を {STRATEGY_BLOCK} 構造化（高インパクトの
##     構造変更。build_prompts.py の戦略選択ロジック新規実装と同期コミット
##     が必要なため、本 v3.4 では deferred）。
##   - M-23: テンプレ J 対義語仕様（lesson_NN.json スキーマ拡張が必要）。
##   - M-48: FAMILY_TEMPLATES 活用（vocab_type=family 設計）。
##   - M-67: OBJECT_SIGNATURES.avoid を build_prompts.py が
##     ネガティブプロンプトとして取り込む実装（Phase 4 ② 実装側 backlog）。
##
## ────────────────────────────────────────────────────────────
## v3.3 (2026-05-20): 監査72項目の決定論一括是正 + 多文化配慮対応
## ────────────────────────────────────────────────────────────
##
## 背景: v3.2 内部精読 9 周で 72 件の矛盾・未定義・規律違反を確定。
##   apply_v3_3.py で決定論的に一括是正。詳細は
##   docs/PROMPT_GUIDE_V3_3_PATCHES.md。全変更は apply_v3_3.py のみ。
##
## §0. v3.0 §3 繰越事項の解消（M-47 wave）
##   skin_tones の "warm medium 固定" を v3.3 で multicultural variation
##   採用に解消。compose_role_subject (build_prompts.py) も同期更新。
##
## §1. 主要 wave（詳細は PROMPT_GUIDE_V3_3_PATCHES.md）:
##   - Wave 1 (M-49): PART 7 GEMINI_STABILIZATION 退役 → archive 保全 /
##                    color_space_protocol を PART 6.5 として救出
##   - Wave 2 (M-2/14/30): "purely decorative" 二層構造 / Exception 1 拡張
##   - Wave 5 (M-28/37/42): SSOT 階層違反語（highlight/shadow/glossy/glow/
##                    specular）を flat 表現に一括書換
##   - Wave 6 (M-31/38/58/61b/64): color_palette.educational_symbol_colors
##                    サブセクション新設 / 各辞書の色名を symbol_* 参照に
##   - Wave 7 (M-47/65/66/70): 多文化配慮（skin NOT specified / hair varied dark）
##   - Wave 8 (M-59/60/61): テンプレ F 単独不整合解消
##   - Wave 9 個別: M-1/3/4/8/9/16/17/21/22/26/29/33/34/35/43/44/48/58/62/63/71/72
##
## §2. apply_v3_3.py は archive/prompts/ に保管。v3.3 確定後は再実行不要。
##
## ────────────────────────────────────────────────────────────
## v3.2 (2026-05-19): 監査7項目の決定論一括是正（apply_v3_2.py）
## ────────────────────────────────────────────────────────────
##
## 背景: v3.1 の実画像検査で 7 項目の取り残し・矛盾を確認。
##   apply_v3_2.py で決定論的に一括是正。全変更=apply_v3_2.py のみ。
##
## ────────────────────────────────────────────────────────────
## v3.1 (2026-05-19): 問題F の完遂 + 背景クリーム化リグレッション是正'''


# ─────────────────────────────────────────────────────────────
# M-10: テンプレ G placeholder origins
# ─────────────────────────────────────────────────────────────
M10_OLD = '''  demonstrative の場合:
    Step 4-A: こ/そ/あ のどれか、対面型/並行型/心理的引き込みのどれかを決定
              （v2.4: 必ず1つだけ選択する。複数選んで混ぜないこと）
    Step 4-B: ARROW_SEMIOTICS から適切な矢印タイプを選択
    Step 4-C: テンプレートG（demonstrative_kosoado）を使用'''
M10_NEW = '''  demonstrative の場合:
    Step 4-A: こ/そ/あ のどれか、対面型/並行型/心理的引き込みのどれかを決定
              （v2.4: 必ず1つだけ選択する。複数選んで混ぜないこと）
    Step 4-B: ARROW_SEMIOTICS から適切な矢印タイプを選択
    Step 4-C: テンプレートG（demonstrative_kosoado）を使用
              → v3.4 (M-10): {SPEAKER_DESCRIPTION} / {LISTENER_DESCRIPTION} =
                CHARACTER_PROFILES.generic_* から generic_male_adult /
                generic_female_adult / generic_boy / generic_girl 等を選び、
                fixed_features を 1 文に展開して挿入する。
                ※ v3.3 多文化配慮: skin NOT specified / hair varied dark で展開。'''


# ─────────────────────────────────────────────────────────────
# M-27 / M-40: iconization_level note 拡充
# ─────────────────────────────────────────────────────────────
M27_OLD = '''    "note": "資料11: 認知負荷が最も低く識別精度が高い「スイートスポット」は level_3_detailed_flat。"
            "完全なフラット(level_2)は質感の欠如により類似物体の混同リスクがある。"'''
M27_NEW = '''    "note": "資料11: 認知負荷が最も低く識別精度が高い「スイートスポット」は level_3_detailed_flat。"
            "完全なフラット(level_2)は具体物では質感の欠如により類似物体の混同リスクがあるが、"
            "person / building / spatial_relation / demonstrative では構図がアイデンティティを"
            "決定するため level_2 で十分（v3.4 M-27/M-40: 用途別に肯定的位置づけ）。"'''


# ─────────────────────────────────────────────────────────────
# M-32: VISUAL_SYMBOLS 機能重複 note
# ─────────────────────────────────────────────────────────────
M32_OLD = '''VISUAL_SYMBOLS = {
  "質問・疑問(question)":'''
M32_NEW = '''## v3.4 (M-32) note: VISUAL_SYMBOLS のうち「2択・比較」「怒り・感情」エントリは
##   それぞれテンプレ J (PAIR_CONTRAST) / テンプレ H (SYMBOLIC_MOTION_LINES) /
##   テンプレ I (abstract_concept) と機能重複する。
##   - テンプレ J/H/I 本文で表現できる場合はそちらを優先。
##   - VISUAL_SYMBOLS は例文画像（テンプレ C）の補助シンボルとして利用するのが原則。
VISUAL_SYMBOLS = {
  "質問・疑問(question)":'''


# ─────────────────────────────────────────────────────────────
# M-36: NATIONALITY_NOUN_POLICY subject_block_pattern 重複削除
# ─────────────────────────────────────────────────────────────
M36_OLD = '''  "subject_block_pattern":
    "A generic adult person in plain, simple casual clothes, neutral and "
    "welcoming expression, standing relaxed. A small {FLAG_SHAPE_AND_COLORS} "
    "national-flag pin (a small circular badge, about 3-4% of the frame) is "
    "on the chest or bag strap as a subtle nationality cue. The person is the "
    "clear main subject, shown full-body from the top of the head to the soles "
    "of both feet, spanning about 80% of the image HEIGHT (NOT area), centered "
    "with empty side margins (do NOT crop the figure to fill the frame).",'''
M36_NEW = '''  "subject_block_pattern":
    "A generic adult person in plain, simple casual clothes, neutral and "
    "welcoming expression, standing relaxed. A small {FLAG_SHAPE_AND_COLORS} "
    "national-flag pin (a small circular badge, about 3-4% of the frame) is "
    "on the chest or bag strap as a subtle nationality cue. "
    "The person is the clear main subject. "
    "v3.4 (M-36): 身体高さ規律はテンプレ A SCENE&ACTION に集約済。"
    "本 subject_block_pattern では人物のアイデンティティ記述のみを行い、"
    "サイズ・フレーミング規律は重複させない。",'''


# ─────────────────────────────────────────────────────────────
# M-39 / M-41: focal_length_standards に全 vocab_type lens マッピング
# ─────────────────────────────────────────────────────────────
M39_OLD = '''    "note": "資料11: カノニカル視点の認知的根拠 — 斜め上30-45度から物体を見ると上面と側面の両方が見え、三次元構造・重要なパーツ（取っ手・ボタン・折り目等）を一瞬で把握できる。真正面や真上からの視点より識別速度・正確性が統計的に高い。"
  },'''
M39_NEW = '''    "note": "資料11: カノニカル視点の認知的根拠 — 斜め上30-45度から物体を見ると上面と側面の両方が見え、三次元構造・重要なパーツ（取っ手・ボタン・折り目等）を一瞬で把握できる。真正面や真上からの視点より識別速度・正確性が統計的に高い。",
    ## v3.4 (M-39 / M-41): vocab_type 別 lens 一覧（参照用）
    "lens_by_vocab_type": {
      "person":           "~50mm equivalent (full standing)",
      "concrete_object":  "~50mm canonical 3/4 (30-45 deg above)",
      "abstract_concept": "~50mm centered, eye level or slight elevation",
      "adjective":        "~50mm canonical 3/4 (no telephoto compression)",
      "action_verb":      "~50mm eye-level",
      "spatial_relation": "~50mm eye-level side view (or first-person POV for 前/後ろ)",
      "demonstrative":    "~50mm eye-level",
      "building":         "35mm wide-angle, slight three-quarter front at eye level",
      "variant_grid":     "~50mm uniform across all tiles"
    }
  },'''


# ─────────────────────────────────────────────────────────────
# M-7 wave: BUILDING_CUES キー正規化 + building_type (M-6) + _en
#   8 エントリすべてに対して、キー名と先頭 2 フィールドを書換。
# ─────────────────────────────────────────────────────────────
def make_building_patches():
    """各 building 用の (old, new) を返す。"""
    bld = [
        ("会社", "company office"),
        ("学校", "school"),
        ("銀行", "bank"),
        ("大学", "university"),
        ("デパート", "department store"),
        ("病院", "hospital"),
        ("駅", "train station"),
        ("スーパー", "supermarket"),
    ]
    out = []
    for ja, en in bld:
        old = f'  "{ja}({en})": {{\n    "building_scale":'
        new = f'  "{ja}": {{\n    "_en":                "{en}",\n    "building_type":      "{en}",\n    "building_scale":'
        out.append((f"M7-BLD {ja}", old, new))
    return out

BUILDING_PATCHES = make_building_patches()


# ─────────────────────────────────────────────────────────────
# M-7 wave: OBJECT_SIGNATURES キー正規化 + _en
# ─────────────────────────────────────────────────────────────
def make_object_patches():
    objs = [
        ("雑誌", "magazine"),
        ("本", "book"),
        ("新聞", "newspaper"),
        ("ノート", "notebook"),
        ("ケータイ・スマートフォン", "smartphone"),
        ("パソコン", "laptop/computer"),
        ("テレビ", "television"),
        ("カメラ", "camera"),
        ("財布", "wallet"),
        ("カード", "card"),
        ("車", "car"),
        ("自転車", "bicycle"),
        ("コップ・グラス", "cup/glass"),
        ("茶碗", "rice bowl"),
    ]
    out = []
    for ja, en in objs:
        old = f'  "{ja}({en})": {{\n    "primary_signatures":'
        new = f'  "{ja}": {{\n    "_en":                "{en}",\n    "primary_signatures":'
        out.append((f"M7-OBJ {ja}", old, new))
    return out

OBJECT_PATCHES = make_object_patches()


# ─────────────────────────────────────────────────────────────
# M-7 wave: ABSTRACT_METAPHORS キー正規化 + _en + M-52 composition_mood
#   13 エントリ全てに composition_mood を追加。値は短文 mood 記述。
# ─────────────────────────────────────────────────────────────
ABSTRACT_PATCHES = []
ABSTRACT_DATA = [
    ("好き",         "like / love",                     "warm and affectionate, centered figure-with-symbol composition"),
    ("嫌い",         "dislike / hate",                  "cool dismissive, figure turning away from object"),
    ("楽しい",       "fun / enjoyable",                 "upbeat dynamic, multiple small sparkle marks around figure"),
    ("悲しい",       "sad",                             "quiet inward, downward composition with weight"),
    ("嬉しい",       "happy / glad",                    "expansive open, radiating sparkles outward"),
    ("怒る",         "angry",                           "sharp tense, jagged radiating lines"),
    ("疲れる",       "tired / exhausted",               "slumped heavy, downward depleted composition"),
    ("心配",         "worry / anxiety",                 "uncertain inward, single floating question mark above"),
    ("友達・友情",   "friendship",                      "balanced symmetric, two figures or interlocked pieces"),
    ("家族",         "family",                          "warm cluster, multiple figures harmonized"),
    ("仕事",         "work",                            "focused structured, desk-anchored composition"),
    ("生活",         "daily life / lifestyle",          "calm grounded, home-anchored everyday objects"),
    ("むかし",       "long ago / past",                 "nostalgic distant, sepia-toned simplified scene"),
    ("これから",     "from now on / future",            "hopeful forward, horizon-anchored facing right"),
    ("変わる",       "change",                          "transitional, before/after split with curved transition arrow"),
]
for ja, en, mood in ABSTRACT_DATA:
    old = f'  "{ja}({en})": {{\n    "concept_definition":'
    new = f'  "{ja}": {{\n    "_en":                "{en}",\n    "composition_mood":   "{mood}",\n    "concept_definition":'
    ABSTRACT_PATCHES.append((f"M7-ABS {ja}", old, new))


# ─────────────────────────────────────────────────────────────
# M-7 wave: SPATIAL_GRID_PATTERNS キー正規化（"on_top (上に)" → "上"）
# ─────────────────────────────────────────────────────────────
SPATIAL_DATA = [
    ('"on_top (上に)"',                  '"上"',  "to the top of",       "on top, above (上に)"),
    ('"under / below (下に)"',           '"下"',  "to the bottom of",    "under / below (下に)"),
    ('"inside (中に)"',                  '"中"',  "inside",              "inside (中に)"),
    ('"in front of (前に)"',             '"前"',  "in front of",         "in front of (前に)"),
    ('"behind (後ろに)"',                '"後ろ"', "behind",              "behind (後ろに)"),
    ('"to the right (右に)"',            '"右"',  "to the right of",     "to the right (右に)"),
    ('"to the left (左に)"',             '"左"',  "to the left of",      "to the left (左に)"),
    ('"next to / beside (そばに・となりに)"',  '"となり"', "next to / beside",    "next to / beside (そばに・となりに)"),
    ('"between (間に)"',                 '"間"',  "between",             "between (間に)"),
]
SPATIAL_PATCHES = []
for old_key, new_key, en, full_jp in SPATIAL_DATA:
    # 単純なキー rename + _en + _jp_full 追加
    old = f'  {old_key}: {{\n    "camera":'
    new = f'  {new_key}: {{\n    "_en":        "{en}",\n    "_jp_full":   "{full_jp}",\n    "camera":'
    SPATIAL_PATCHES.append((f"M7-SPA {new_key}", old, new))


# ─────────────────────────────────────────────────────────────
# M-7 wave: VISUAL_SYMBOLS キー正規化
# ─────────────────────────────────────────────────────────────
VISUAL_DATA = [
    ("質問・疑問", "question"),
    ("はい・肯定", "yes"),
    ("いいえ・否定", "no"),
    ("動作の方向", "action direction"),
    ("指示・注目", "pointing"),
    ("2択・比較", "yes/no split"),
    ("怒り・感情", "emotion"),
    ("場所の提示", "showing location"),
]
VISUAL_PATCHES = []
for ja, en in VISUAL_DATA:
    old = f'  "{ja}({en})":'
    new = f'  "{ja}":  # _en="{en}" (v3.4 M-7)\n   '
    VISUAL_PATCHES.append((f"M7-VIS {ja}", old, new))


# ─────────────────────────────────────────────────────────────
# PART 8 末尾: プレースホルダ出所表（M-7 wave / M-50-M-57 統合）
# ─────────────────────────────────────────────────────────────
PLACEHOLDER_ORIGIN_TABLE_OLD = '''## END OF FILE
## ============================================================
##
## このファイルは画像生成系 SSOT（Single Source of Truth）です。'''
PLACEHOLDER_ORIGIN_TABLE_NEW = '''## ============================================================
## PART 8.5: PLACEHOLDER ORIGINS（プレースホルダ出所表）
## ============================================================
##
## v3.4 (M-7 / M-50-M-57 統合): PART 3 PROMPT_TEMPLATES が使用する全プレースホルダ
##   の出所を一覧化。lesson_NN.json の word / examples / vocabulary[] フィールド
##   から、補助辞書の lookup を経て、プロンプト本文のどこに展開されるかを
##   明示する。build_prompts.py 実装の参照表。
##
## A. 文型固定（lesson_NN.json から直接展開）
##   {WORD_JP} / [TARGET_WORD] / [TARGET_WORD_JP]  = vocabulary[i].word
##   {WORD_EN} / {TARGET_WORD_EN}                  = vocabulary[i].en（または _en lookup）
##   {SENTENCE_JP}                                 = examples[i].textToSpeak
##   {SENTENCE_EN}                                 = examples[i].textEn or translate
##   {SCENE_DESCRIPTION}                           = examples[i].sceneDescription（テンプレ C）
##
## B. 補助辞書 lookup（M-7 正規化後・キーは bare 日本語 word）
##   {BUILDING_TYPE}            = BUILDING_CUES[word].building_type（M-6）
##   {BUILDING_DESCRIPTION_AND_SCALE} = BUILDING_CUES[word].building_scale
##   {PRIMARY_SCENE_CUE}        = BUILDING_CUES[word].primary_scene_cue
##   {SIGNAGE_TEXT}             = BUILDING_CUES[word].signage_text
##   {OBJECT_DESCRIPTION}       = OBJECT_SIGNATURES[word].canonical_view
##                                + .primary_signatures 連結 (M-18 / M-19)
##   {VISUAL_SIGNATURE}         = OBJECT_SIGNATURES[word].primary_signatures
##   {MATERIAL_TEXTURE_HINT}    = OBJECT_SIGNATURES[word].material_hints
##   {AVOID_LIST}               = OBJECT_SIGNATURES[word].avoid（M-67・ネガティブプロンプト用）
##   {FRONT_FACING_EXCEPTION}   = OBJECT_SIGNATURES[word].front_facing_exception（任意・M-20）
##   {SIGNAGE_EXCEPTION_IF_ANY} = OBJECT_SIGNATURES[word].signage_exception（任意・M-20）
##   {VISUAL_METAPHOR}          = ABSTRACT_METAPHORS[word].visual_metaphor
##   {CONCEPT_DEFINITION}       = ABSTRACT_METAPHORS[word].concept_definition（M-51）
##   {EMOTIONAL_TONE}           = ABSTRACT_METAPHORS[word].emotional_tone
##   {COMPOSITION_MOOD}         = ABSTRACT_METAPHORS[word].composition_mood（M-52）
##   {COLOR_TONE_ADJUSTMENT}    = ABSTRACT_METAPHORS[word].color_adjustment
##   {SPATIAL_POSITION}         = SPATIAL_GRID_PATTERNS[direction]._en（M-53）
##   {CAMERA_SETUP}             = SPATIAL_GRID_PATTERNS[direction].camera（テンプレ F）
##   {REFERENCE_OBJECT}         = lesson_NN.json examples[i].reference_object（M-53・要追加）
##   {TARGET_OBJECT}            = lesson_NN.json examples[i].target_object（M-53/M-54・要追加）
##   {ADJECTIVE_CATEGORY}       = lesson_NN.json vocabulary[i].adjective_category（M-57）
##   {ANCHOR_OBJECTS}           = lesson_NN.json vocabulary[i].anchor_objects（M-57）
##   {ADJECTIVE_STRATEGY}       = lesson_NN.json vocabulary[i].adjective_strategy（M-57・M-15 wave 連動）
##   {ACTION_DESCRIPTION}       = lesson_NN.json vocabulary[i].action_description（M-55・要追加）
##
## C. CHARACTER_PROFILES lookup（v3.3 多文化対応・gender 不指定）
##   {CHARACTER_DESCRIPTION}    = build_prompts.py compose_role_subject(g, role_key) または
##                                compose_nationality_subject(g, flag_shape_and_colors)
##   {SPEAKER_DESCRIPTION}      = CHARACTER_PROFILES.generic_* fixed_features 1 文展開（M-10）
##   {LISTENER_DESCRIPTION}     = 同上（M-10）
##   {CHARACTER_POSE_AND_EXPRESSION} = compose_role_pose() / compose_nationality_pose()
##   {CHARACTER_DESCRIPTIONS}   = テンプレ C 用・複数キャラ記述の連結
##
## D. その他
##   {VISUAL_SYMBOL_IF_NEEDED}  = VISUAL_SYMBOLS[category] または空文字列（M-14）
##   {COMPOSITION_NOTES}        = テンプレ C 固有・examples[i].composition_notes または空（M-50）
##   {FLAG_SHAPE_AND_COLORS}    = build_prompts.py PERSON_FLAG_LOOKUP[word]
##   {STRATEGY_BLOCK}           = (v3.5 M-15 wave 予定) — テンプレ D/H/J 用の戦略ブロック
##   {MODEL_TYPE_BLOCK}         = DEMONSTRATIVE_MODELS[model_type_name] の値を転記（テンプレ G）
##   {MODEL_TYPE_NAME}          = lesson_NN.json vocabulary[i].model_type_name
##   {KO_SO_A_TYPE}             = lesson_NN.json vocabulary[i].ko_so_a_type
##   {TARGET_ZONE}              = lesson_NN.json vocabulary[i].target_zone
##   {DISPLAY_STRATEGY}         = lesson_NN.json vocabulary[i].display_strategy
##   {VISUALIZATION_STRATEGY}   = lesson_NN.json vocabulary[i].visualization_strategy
##   {GRID_SIZE} / {GRID_ARRANGEMENT} / {TILE_DESCRIPTIONS} / {TILE_SIGNATURES}
##                              = lesson_NN.json variant_grid_group ベースで build_prompts が合成

## ============================================================
## END OF FILE
## ============================================================
##
## このファイルは画像生成系 SSOT（Single Source of Truth）です。'''


# ─────────────────────────────────────────────────────────────
# MANIFEST
# ─────────────────────────────────────────────────────────────
MANIFEST = [
    ("H  ヘッダ → v3.4",                              H_OLD,  H_NEW,  1),
    ("M-11 改訂履歴 v3.3/v3.4 セクション",            M11_OLD, M11_NEW, 1),
    ("M-5 BACKGROUND_BY_TYPE 定数",                   M5_OLD, M5_NEW, 1),
    ("M-10 テンプレ G placeholder origins",           M10_OLD, M10_NEW, 1),
    ("M-27/M-40 iconization_level note",             M27_OLD, M27_NEW, 1),
    ("M-32 VISUAL_SYMBOLS 重複 note",                M32_OLD, M32_NEW, 1),
    ("M-36 NATIONALITY subject_block 重複削除",      M36_OLD, M36_NEW, 1),
    ("M-39/M-41 lens_by_vocab_type マッピング",      M39_OLD, M39_NEW, 1),
    ("PART 8.5 プレースホルダ出所表",                 PLACEHOLDER_ORIGIN_TABLE_OLD, PLACEHOLDER_ORIGIN_TABLE_NEW, 1),
]

# M-7 wave 5 辞書のパッチを MANIFEST に追加
for label, old, new in BUILDING_PATCHES:
    MANIFEST.append((label, old, new, 1))
for label, old, new in OBJECT_PATCHES:
    MANIFEST.append((label, old, new, 1))
for label, old, new in ABSTRACT_PATCHES:
    MANIFEST.append((label, old, new, 1))
for label, old, new in SPATIAL_PATCHES:
    MANIFEST.append((label, old, new, 1))
for label, old, new in VISUAL_PATCHES:
    MANIFEST.append((label, old, new, 1))


def main():
    if not os.path.exists(SRC):
        sys.exit(f"ABORT: source ガイドが不在: {SRC}")
    text = open(SRC, encoding="utf-8").read()
    print(f"=== apply_v3_4.py 編集マニフェスト（{len(MANIFEST)} 件・件数アサート） ===")
    fail = []
    for label, old, new, expect in MANIFEST:
        n = text.count(old)
        status = " OK " if n == expect else "FAIL"
        if n != expect:
            fail.append((label, expect, n))
        print(f"[{status}] {label}: 期待{expect} 実{n}")
    if fail:
        for label, expect, n in fail:
            print(f"  ABORT cause: {label} 期待{expect} 実{n}", file=sys.stderr)
        sys.exit(f"ABORT: {len(fail)} 件の出現数が期待と不一致")

    for label, old, new, expect in MANIFEST:
        text = text.replace(old, new)

    try:
        ast.parse(text)
    except SyntaxError as e:
        sys.exit(f"ABORT: 適用結果が Python 構文エラー: {e}")

    with open(DST, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"=== 書き込み完了: {DST} ===")


if __name__ == "__main__":
    main()
