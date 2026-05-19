# -*- coding: utf-8 -*-
"""
apply_v3_2.py  —  master_prompt_design_guide v3.1 → v3.2 決定論パッチ
すべての編集を (ラベル, old, new, 期待件数) で明示。件数アサート必須。
全変更は本スクリプト＝唯一の出所。手作業 str_replace は使わない。
"""
import ast, sys

SRC = "/mnt/user-data/uploads/master_prompt_design_guide_v3_1.py"
DST = "/home/claude/master_prompt_design_guide_v3_2.py"

L = lambda *xs: "\n".join(xs)

# ── E1: Template A 全ブロック（項目1-人物SCENE / 2-Template Aレンズ /
#        4-Template A STYLE RECIPE off-white化 / 5-CONSTRAINTS強化＋国旗例外）
E1_OLD = L(
"[SCENE & ACTION]",
"Full-body shot. The character is centered and fills 70-80% of the image area.",
"Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at the",
"subject's eye height (not above, not below) and rotated approximately 30-45 degrees",
"to one side. This is a diagonal front view that shows both the front face and a partial",
"side view of the body simultaneously while preserving natural body proportions.",
"DO NOT use an overhead or bird's-eye angle for full-body person cards — overhead angles",
"distort body proportions (head appears large, feet small) and make the figure look",
"unstable. Keep both feet visible on a flat ground plane.",
"Solid soft cream off-white background (warm off-white, NOT pure stark white). No other characters or objects in the frame.",
"85mm portrait lens equivalent.",
"",
"[STYLE RECIPE — DO NOT CHANGE]",
"Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.",
"Completely flat solid color fills only. Color palette: soft cream white background,",
"deep slate navy outlines, muted warm blue",
"and warm amber gold as accents.",
"This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.",
"",
"[CONSTRAINTS]",
"No text, no letters, no numbers, no symbols inside the image.",
"No gradients, no shadows, no 3D effects, no photoreal textures.",
"Apply zero ambient lighting, zero drop shadows, zero global illumination.",
'"""',
)
E1_NEW = L(
"[SCENE & ACTION]",
"FULL-BODY SHOT — the entire figure from the very top of the head to the soles",
"of BOTH feet is fully inside the frame, with a clear empty margin above the head",
"and a visible strip of empty ground below both feet. This is NOT a portrait,",
"headshot, or waist-up crop.",
"The standing figure spans roughly 80% of the image HEIGHT (measured by height,",
"NOT by area), centered horizontally. Empty background on the left and right is",
"expected and correct — do NOT zoom or crop in to fill the sides; that side",
"margin is intentional.",
"Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at the",
"subject's eye height (not above, not below) and rotated approximately 30-45 degrees",
"to one side. This is a diagonal front view that shows both the front face and a partial",
"side view of the body simultaneously while preserving natural body proportions.",
"DO NOT use an overhead or bird's-eye angle. DO NOT crop the body at the head, neck,",
"waist, hips, thighs, or knees. Both feet and a small patch of the flat ground",
"directly beneath them must be clearly visible.",
"Solid soft cream off-white background (warm off-white, NOT pure stark white). No other characters or objects in the frame.",
"Framed as with a standard ~50mm-equivalent lens at full standing distance (NOT an 85mm tight portrait lens).",
"",
"[STYLE RECIPE — DO NOT CHANGE]",
"Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.",
"Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, not pure stark white),",
"deep slate navy outlines, muted warm blue",
"and warm amber gold as accents.",
"This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.",
"",
"[CONSTRAINTS]",
"No text, no letters, no numbers, no decorative symbols anywhere — including",
"titles, labels, captions, watermarks, or any text overlay at any position in",
"the rendered output.",
"EXCEPTION (v3.1 NATIONALITY_NOUN_POLICY — applies ONLY to nationality-noun",
"persons): a small national-flag pin/patch is permitted as a subtle nationality",
"cue, at most about 4% of the image area. Absolutely no text, letters, or",
"numbers on the flag itself.",
"No gradients, no shadows, no 3D effects, no photoreal textures.",
"Apply zero ambient lighting, zero drop shadows, zero global illumination.",
'"""',
)

# ── E2: 項目4 — 全 STYLE RECIPE の背景トークンを off-white に統一（除去）。
#        pristine 8件中 Template A の1件は E1 が消費するので残 7 件。
E2_OLD = "Color palette: soft cream white background,"
E2_NEW = "Color palette: soft cream off-white background (warm off-white, not pure stark white),"

# ── E3: 項目4 — STYLE_BIBLE.color_palette["background"] をRECIPEと一致させ統一
E3_OLD = '    "background":  "Soft cream white",'
E3_NEW = '    "background":  "Soft cream off-white (warm off-white, not pure stark white)",'

# ── E4: 項目4 — color_palette.note の反ドリフト文言を v3.2 決定に改訂
E4_OLD = ('    "note": "v3.0方針→v3.1で完遂: 色名のみ運用。#HEX や \'hex value\' をプロンプトに'
          '一切書かない（v3.0は37箇所削除と記載も実際は本文/ARROW_SEMIOTICS/reset_promptに残存。'
          'v3.1で実削除し完了）。色名表記の一字一句を変えないことでスタイルドリフトを防止する（資料6）。"')
E4_NEW = ('    "note": "v3.2: 背景色名を SCENE と STYLE RECIPE で一致させ統一'
          '（旧『soft cream white』→『soft cream off-white (warm off-white, not pure stark white)』）。'
          'v3.1 までは SCENE のみ off-white でRECIPEは white のままだったため白飛びを「抑制」していたが、'
          'v3.2 で両者を同一表記にし矛盾を「除去」した。#HEや hex value は引き続き一切書かない。'
          '今後この背景色名は SCENE と STYLE RECIPE で常に一字一句一致させること（新・反ドリフト原則）。"')

# ── E5: 項目2 — focal_length 先頭のグローバル 85mm portrait を除去
E5_OLD = '      "85mm portrait lens equivalent. "'
E5_NEW = '      "Lens depends on subject type (NEVER a tight 85mm portrait/tele lens for full-body person cards). "'

# ── E6: 項目1/2 — focal_length 人物分岐に高さ基準 ~50mm フレーミングを追記
E6_OLD = '      "used for person vocabulary cards. "'
E6_NEW = L(
'      "used for person vocabulary cards. "',
'      "Frame the person with a standard ~50mm-equivalent lens at full standing "',
'      "distance: the WHOLE figure from the top of the head to the soles of BOTH "',
'      "feet is inside the frame, spanning about 80% of the image HEIGHT (measured "',
'      "by height, NOT by area), centered with empty side margins; do NOT crop at "',
'      "the waist, hips, thighs, or knees and do NOT zoom in to fill the frame. "',
)

# ── E7: 項目1 — occupancy_percentages.vocabulary_card を人物=高さ/物体=面積に分離
E7_OLD = '      "vocabulary_card":   "Subject occupies 70-80% of the frame",'
E7_NEW = ('      "vocabulary_card":   "OBJECTS/compact subjects: occupy 70-80% of the frame by AREA. '
          'PERSONS: the full standing figure (head to soles of both feet) spans about 80% of the image '
          'HEIGHT measured by height NOT area, centered with empty side margins; never crop the figure to fill area",')

# ── E8: 項目1/6 — vocabulary_card_style(保護文字列) の must fill を分離
E8_OLD = '    "No background elements, no secondary objects. The subject must fill 70-80% of the frame.",'
E8_NEW = ('    "No background elements, no secondary objects. Objects fill 70-80% of the frame by area; '
          'a full-body person is shown head to soles of both feet, spanning about 80% of the image HEIGHT '
          '(not area), centered with empty side margins — do NOT crop the figure to fill the frame.",')

# ── E9: 項目1 — NATIONALITY_NOUN_POLICY.principle を高さ基準に
E9_OLD = '    "non-stereotyped appearance fills 70-80% of the frame. Nationality is "'
E9_NEW = L(
'    "non-stereotyped appearance is shown full-body from the top of the head to "',
'    "the soles of both feet, spanning about 80% of the image HEIGHT (by height, "',
'    "NOT area), centered with empty side margins. Nationality is "',
)

# ── E10: 項目1 — NATIONALITY_NOUN_POLICY.subject_block_pattern を高さ基準に
E10_OLD = '    "clear main subject and fills 70-80% of the frame.",'
E10_NEW = L(
'    "clear main subject, shown full-body from the top of the head to the soles "',
'    "of both feet, spanning about 80% of the image HEIGHT (NOT area), centered "',
'    "with empty side margins (do NOT crop the figure to fill the frame).",',
)

# ── E11: 項目3a — adjective J の 85mm portrait（望遠×俯瞰矛盾）を是正
E11_OLD = "85mm portrait lens equivalent. (Eye-level for human-scale items; canonical 3/4 for smaller objects.)"
E11_NEW = "Standard ~50mm-equivalent lens, no telephoto compression (Eye-level for human-scale items; canonical 3/4 for smaller objects)."

# ── E12: 項目3b — spatial_drift remedy の 85mm portrait（同矛盾）を是正
E12_OLD = L(
"Camera Setup: Canonical 3/4 view, 30-45 degrees above and slightly to one side.",
"85mm portrait lens equivalent.",
)
E12_NEW = L(
"Camera Setup: Canonical 3/4 view, 30-45 degrees above and slightly to one side.",
"Standard ~50mm-equivalent lens, no telephoto compression.",
)

# ── E13: 項目7 — abstract_concept の gradient-free tones を flat-only に整合
E13_OLD = L(
"Background: minimal — a suggestion of environment (soft gradient-free tones acceptable",
"as large flat color fields, not as lighting effects).",
)
E13_NEW = ("Background: minimal — large flat SOLID color fields only. NO gradients, "
           "NO 'gradient-free tone' shading, NO lighting effects (must remain completely "
           "flat solid fills, consistent with the STYLE RECIPE).")

# ── E14: 項目4 — color_drift remedy_prompt の活き残留（E2が別表記で取りこぼし）
E14_OLD = "- Background: soft cream white"
E14_NEW = "- Background: soft cream off-white (warm off-white, NOT pure stark white)"

# ── E15: 項目4 — off-white表記の NOT/not 大小分裂を解消（新・反ドリフト規則=一字一句一致 の自己遵守）
E15_OLD = "off-white, not pure stark white"
E15_NEW = "off-white, NOT pure stark white"

# ── ヘッダ
H_OLD = "# Version 3.1 | 2026-05-19 (= v3.0 + 問題F完遂 + 背景クリーム化リグレッション是正)"
H_NEW = L(
"# Version 3.2 | 2026-05-19 (= v3.1 + 監査7項目の決定論一括是正。全変更=apply_v3_2.py のみ)",
"#   1 サイズ×形状: 面積→高さ基準（Template A SCENE/occupancy/vocabulary_card_style/NATIONALITY×2）",
"#   2 レンズ: focal_length先頭の85mm portrait除去＋人物~50mm明記＋Template A重複是正",
"#   3 レンズ×角度: adjective J / spatial_drift remedy の85mm portraitを~50mmへ",
"#   4 背景色: SCENE と STYLE RECIPE を off-white で一致統一（抑制でなく除去。色名/note同期。",
"#     E14=color_drift remedy の活き残留も是正 / E15=NOT/not 大小を統一し一字一句一致）",
"#   5 Template A CONSTRAINTS: 弱表現→強表現＋NATIONALITY例外を明示再適用",
"#   7 abstract_concept: gradient-free tones を flat-solid-only に整合",
)

# 実行順序が重要: E1（Template A全置換）→ E2（残り7件の cream トークン）
MANIFEST = [
    ("H  ヘッダ",                         H_OLD,  H_NEW,  1),
    ("E1 Template A 全ブロック(1/2/4/5)", E1_OLD, E1_NEW, 1),
    ("E2 STYLE RECIPE 背景統一(項目4)",   E2_OLD, E2_NEW, 7),
    ("E3 color_palette背景名(項目4)",     E3_OLD, E3_NEW, 1),
    ("E4 color_palette.note(項目4)",      E4_OLD, E4_NEW, 1),
    ("E5 focal_length先頭(項目2)",        E5_OLD, E5_NEW, 1),
    ("E6 focal_length人物分岐(項目1/2)",  E6_OLD, E6_NEW, 1),
    ("E7 occupancy vocab_card(項目1)",    E7_OLD, E7_NEW, 1),
    ("E8 vocabulary_card_style(項目1/6)", E8_OLD, E8_NEW, 1),
    ("E9 NATIONALITY principle(項目1)",   E9_OLD, E9_NEW, 1),
    ("E10 NATIONALITY subject(項目1)",    E10_OLD,E10_NEW,1),
    ("E11 adjective J 85mm(項目3a)",      E11_OLD,E11_NEW,1),
    ("E12 spatial_drift 85mm(項目3b)",    E12_OLD,E12_NEW,1),
    ("E13 abstract_concept flat(項目7)",  E13_OLD,E13_NEW,1),
    ("E14 color_drift活き残留(項目4)",    E14_OLD,E14_NEW,1),
    ("E15 NOT/not 大小統一(項目4)",       E15_OLD,E15_NEW,11),
]

def main():
    text = open(SRC, encoding="utf-8").read()
    print("=== 編集マニフェスト（件数アサート） ===")
    for label, old, new, expect in MANIFEST:
        n = text.count(old)
        status = "OK " if n == expect else "FAIL"
        print(f"[{status}] {label}: 期待{expect} 実{n}")
        if n != expect:
            sys.exit(f"ABORT: {label} の出現数が期待と不一致（{n}≠{expect}）。原本変更未反映の可能性。")
        text = text.replace(old, new)
    ast.parse(text)  # 構文保証
    open(DST, "w", encoding="utf-8").write(text)
    print("=== Python 構文 OK / 書き込み完了 ===")

if __name__ == "__main__":
    main()
