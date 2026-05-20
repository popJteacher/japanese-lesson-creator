# -*- coding: utf-8 -*-
"""
apply_v3_3.py  —  master_prompt_design_guide v3.2 → v3.3 決定論パッチ

設計原則（apply_v3_2.py を踏襲）:
  - 全変更を MANIFEST ((label, old, new, expected_count)) で明示。
  - 件数アサート必須。ズレたら abort（ガイドのドリフトを検知）。
  - 全変更は本スクリプト＝唯一の出所。手作業 str_replace は使わない。
  - Wave 順序（M-49 → M-2 → M-7 → M-15 → M-28/37/42 → M-31 →
    M-47 → テンプレ F → 個別軽修正）で記録。

入力: prompts/master_prompt_design_guide_v3_2.py (hash 566b8ad68753 / LF 正規化後)
出力: prompts/master_prompt_design_guide_v3_3.py
副産物: archive/prompts/master_prompt_gemini_stabilization_legacy.py
  （Wave 1 で削除する PART 7 GEMINI_STABILIZATION の保全コピー）

参照: docs/PROMPT_GUIDE_V3_3_PATCHES.md（M-1〜M-72 の詳細）
      ~/.claude/plans/partitioned-bubbling-babbage.md（Step 1〜9 の手順）
"""
import ast
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_2.py")
DST = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_3.py")
LEGACY_DST = os.path.join(
    ROOT, "archive", "prompts", "master_prompt_gemini_stabilization_legacy.py"
)

L = lambda *xs: "\n".join(xs)


# ─────────────────────────────────────────────────────────────
# Wave 1: M-49 — PART 7 GEMINI_STABILIZATION 退役
#   M-13 / M-25 / M-45 / M-46 / M-68 を一括解消。
#   削除する PART 7 全体を legacy 保全ファイルに書き出し、ガイド本体からは
#   PART 7 ヘッダ〜GEMINI_STABILIZATION 辞書終端までを削除する。
#   color_space_protocol は失わないように新規 PART 6.5 として残置する
#   ためのテキストブロックを差し込む。
# ─────────────────────────────────────────────────────────────

# PART 7 全体（line 2491-2640 相当）
W1_PART7_OLD = '''## ============================================================
## PART 7: GEMINI STABILIZATION（資料9 の運用ルール）
## ============================================================
##
## v2.3 更新: production_rules の large_scale 定義を
##            3万枚超の量産規模に更新。
## ============================================================

GEMINI_STABILIZATION = {

  "session_management": {
    "max_turns_per_session": 4,
    "rationale":
      "Gemini 2.5 Flash Image はセッションが長引くにつれてスタイルドリフトが発生する。"
      "STYLE_BIBLE トークンへのアテンションが低下し、基本スタイル制約が崩れる。",

    "drift_detection_signals": [
      "ターン1には存在しなかった微細なディテール（衣服のシワ等）が自発的に追加され始める",
      "線画が過剰に細かくスケッチ風になる",
      "存在しないはずの3D的な陰影や髪のハイライトが追加される",
      "キャラクターの中核アイデンティティ（顔の骨格・目の形）が変質し始める",
      "色相が初回生成時と微妙にずれていく"
    ],

    "early_warning_checkpoint":
      "1セッション内で4回目のプロンプト送信前に必ず上記5点をチェック。"
      "1つでも該当したら即座にセッションを破棄。",

    "session_reset_protocol": {
      "step_1": "現セッションを破棄",
      "step_2": "これまでに生成した中で最もスタイルが純粋な画像を「リファレンス画像」として選定",
      "step_3": "新規セッションを開始し、リファレンス画像を1枚だけ投入",
      "step_4": "下記の reset_prompt_template を使って絶対的な基盤プロンプトを再送信",
      "step_5": "新規セッションで最初の画像を生成し、ドリフトがないことを確認してから本作業に進む"
    },

    "reset_prompt_template": """
Analyze the attached reference image. We are initiating a new production session.

You must STRICTLY inherit the exact minimal flat vector style, line weight, and flat color shading
properties of this specific reference image.

Constraint: Do not extrapolate, hallucinate, or add any complexity. Reassert the core style parameters:
clean geometric construction, zero gradients, pure vector art.

Based ONLY on this established stylistic foundation, generate the following new scene:
[NEW_SCENE_DESCRIPTION]
"""
  },

  "color_space_protocol": {
    "color_space": "sRGB only",
    "exif_handling": "リファレンス画像のEXIFメタデータは投入前に必ず削除する。",
    "bit_depth": "8-bit sRGB に変換してから投入する（16-bit や HDR は投入しない）",
    "preprocessing_workflow": [
      "1. 参照画像を画像編集ツールで開く",
      "2. 「sRGB IEC61966-2.1」プロファイルに変換",
      "3. 8-bit に変換（必要に応じて）",
      "4. EXIFメタデータを削除",
      "5. PNG または高品質 JPEG で保存"
    ]
  },

  "production_rules": {
    "small_scale": {
      "definition": "1課あたり数十枚以下（例: 第1課 18枚）",
      "approach":   "基本プロンプト + STYLE_BIBLE + vocab_type_check で安定生成可能",
      "session":    "通常運用で問題なし。4ターン超過時はリフレッシュ"
    },
    "medium_scale": {
      "definition": "50-300 枚規模（複数課横断）",
      "approach":   "Double-Hex Anchoring 厳密適用 + フレーム占有率の数値指定を必須化",
      "session":    "2-3ターンごとに新規セッションを推奨"
    },
    "large_scale": {
      "definition": "1,000枚以上の本格量産フェーズ（教材全課 + 辞書サービス）",
      "note":       "v2.3 更新: 辞書サービスとの画像共有により3万枚超の量産を想定",
      "approach":   "GEMINI_STABILIZATION 全項目を厳格適用。"
                    "vocab_type フィールドを全語彙に設定してから生成開始。"
                    "GAS の生成ループに vocab_type_check の自動判定ロジックを組み込む（将来実装）",
      "session":    "1セッション最大4ターン厳守。ドリフト検知時は即座にリセット",
      "cost_note":  "Gemini 2.5 Flash Image 5円/枚 × 3万枚 ≒ 15万円。"
                    "再生成率を5%削減するだけで約7,500円の節約になる。"
                    "vocab_type_check と regeneration_cost_check の徹底が最大のコスト対策。"
    },

    "session_boundary_triggers": [
      "4ターン目に達した時",
      "50枚生成した時",
      "ドリフト検知信号が1つでも観察された時",
      "新しい vocab_type のテンプレートに切り替える時",
      "新しい背景タイプ（屋内→屋外等）に切り替える時"
    ]
  },

  "symptom_cause_remedy": {

    "color_drift": {
      "symptom":  "衣服・背景の色が生成のたびに微妙に異なる。HEX 値を指定しても無視される。",
      "cause":    "LLM は HEX コードをテキストトークンとして確率的に処理する。"
                  "Gemini がデフォルトで物理的ライティングをシミュレートしてしまう。",
      "remedy_prompt": """
[COLOR MANAGEMENT BLOCK]
Render the illustration using STRICTLY flat colors. Apply zero gradients, zero ambient lighting,
zero drop shadows, and zero global illumination.

Strict Color Palette Mapping (sRGB constraint):
- Background: soft cream off-white (warm off-white, NOT pure stark white)
- Outline: deep slate navy
- Main color: muted warm blue
- Accent: warm amber gold
- Sub color: cool slate gray

All colors must be applied as 100% opaque, solid vector fills.
"""
    },

    "spatial_drift": {
      "symptom":  "生成のたびに被写体のサイズ・位置が変動する。",
      "cause":    "明示的なバウンディングボックス指定がない。焦点距離が欠落している。",
      "remedy_prompt": """
[CAMERA & SPATIAL CONTROL BLOCK]
Camera Setup: Canonical 3/4 view, 30-45 degrees above and slightly to one side.
Standard ~50mm-equivalent lens, no telephoto compression.

Framing & Spatial Locking:
- Subject is firmly anchored at the center of the frame.
- Subject occupies exactly [70-80]% of the overall frame area.
- Do not crop the subject's head or feet; maintain full-body or medium-long shot.
"""
    },

    "style_drift": {
      "symptom":  "4〜5ターン目からフラットベクタースタイルが崩れ、3D的陰影が追加される。",
      "cause":    "トークンアテンションの希釈。セッション継続によりスタイル制約への注意が低下する。",
      "remedy_prompt": """
[SYSTEM RESET — STYLE FIXATION BLOCK]
Analyze the attached reference image. We are initiating a new production session.

You must STRICTLY inherit the exact minimal flat vector style, line weight, and flat color shading
properties of this specific reference image.

Constraint: Do not extrapolate, hallucinate, or add any complexity. Reassert the core style parameters:
clean geometric construction, zero gradients, pure vector art.

Based ONLY on this established stylistic foundation, generate the following new scene:
[NEW_SCENE_DESCRIPTION]
"""
    }
  }
}'''

# 置換後: PART 7 全体を削除し、color_space_protocol だけを救出した新 PART 6.5 に置換
W1_PART7_NEW = '''## ============================================================
## PART 6.5: OUTPUT_IMAGE_SPECIFICATIONS（出力 PNG QC 規律）
## ============================================================
##
## v3.3 新設（M-49 wave）: 旧 PART 7 GEMINI_STABILIZATION からの救出。
##   GEMINI_STABILIZATION 全体は Phase 4 で Imagen 4 ローカル化（個別 API・
##   chat-session なし）に移行したため適用不能となり退役。session_management /
##   drift_detection_signals / production_rules / cost_note 等は全削除。
##   ただし出力 PNG QC 規律として有用な color_space_protocol だけは
##   独立 PART として残置する。
##   保全コピー: archive/prompts/master_prompt_gemini_stabilization_legacy.py
## ============================================================

OUTPUT_IMAGE_SPECIFICATIONS = {

  "color_space_protocol": {
    "color_space": "sRGB only",
    "exif_handling": "出力 PNG は EXIF メタデータを書き出さない（または投入前に削除する）。",
    "bit_depth": "8-bit sRGB（16-bit / HDR は使用しない）",
    "preprocessing_workflow": [
      "1. 生成後の PNG を画像編集ツールで開く（必要時のみ）",
      "2. 「sRGB IEC61966-2.1」プロファイルに変換",
      "3. 8-bit に変換（必要に応じて）",
      "4. EXIFメタデータを削除",
      "5. PNG または高品質 JPEG で保存"
    ]
  }
}'''


# ─────────────────────────────────────────────────────────────
# Wave 2: M-2 — "purely decorative" 二層構造
#   M-14（テンプレ C VISUAL_SYMBOL_IF_NEEDED 手順明示） /
#   M-30（テンプレ C/D/E の "no symbols" 限定子化）連動。
#   グローバル constraints + テンプレ I/C/D/E CONSTRAINTS の統一。
# ─────────────────────────────────────────────────────────────

# Patch 2-1: グローバル constraints "no decorative" → "no purely decorative"
W2_1_OLD = '"No text, no letters, no numbers, no decorative symbols anywhere — "'
W2_1_NEW = '"No text, no letters, no numbers, no purely decorative symbols anywhere — "'

# Patch 2-2: Exception 1 拡張（ABSTRACT_METAPHORS / VISUAL_SYMBOLS の symbolic metaphor
#   anchor を明示し、PERMITTED テンプレに C / I を追加）
W2_2_OLD = L(
    '    "Exception 1 (EDUCATIONAL pictographic elements) — directional arrows, "',
    '    "territory boundary lines, motion lines, panel dividers — are governed by "',
    '    "each individual template\'s CONSTRAINTS block, NOT by this global rule. "',
    '    "They are PERMITTED in templates F (spatial_relation), G (demonstrative_kosoado), "',
    '    "H (action_verb), and J (vocabulary_adjective) when explicitly described "',
    '    "in the template. "',
)
W2_2_NEW = L(
    '    "Exception 1 (EDUCATIONAL pictographic elements) — directional arrows, "',
    '    "territory boundary lines, motion lines, panel dividers, and symbolic "',
    '    "metaphor anchors (hearts, sparkles, teardrops, question marks, "',
    '    "lightbulbs, stars, etc. as defined in ABSTRACT_METAPHORS / "',
    '    "VISUAL_SYMBOLS) — are governed by each individual template\'s CONSTRAINTS "',
    '    "block, NOT by this global rule. They are PERMITTED in templates C "',
    '    "(example_sentence), F (spatial_relation), G (demonstrative_kosoado), "',
    '    "H (action_verb), I (abstract_concept), and J (vocabulary_adjective) "',
    '    "when explicitly described in the template. "',
)

# Patch 2-3: テンプレ I CONSTRAINTS 統一
W2_3_OLD = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
    '""",',
    "",
    "  ## ─────────────────────────────────────────────",
    "  ## テンプレートJ: 形容詞語彙（1:1）【v2.4 新規】",
)
W2_3_NEW = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no purely decorative symbols inside the image. "
    "Symbolic metaphor anchors (as defined in ABSTRACT_METAPHORS) ARE PERMITTED as "
    "part of the intended pedagogical metaphor.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
    '""",',
    "",
    "  ## ─────────────────────────────────────────────",
    "  ## テンプレートJ: 形容詞語彙（1:1）【v2.4 新規】",
)

# Patch 2-4: テンプレ C CONSTRAINTS（M-30）
#   v3.2 で C は `"No text, no letters, no numbers, no symbols inside the image."`
#   (line 1176)。VISUAL_SYMBOLS 利用時の例外を明示。
W2_4_OLD = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
    '""",',
    "",
    "  ## ─────────────────────────────────────────────",
    "  ## テンプレートD: 語彙カード・具体物（1:1）【v2.3 新規】",
)
W2_4_NEW = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no purely decorative symbols inside the image. "
    "VISUAL_SYMBOLS entries (question mark / checkmark / X mark / arrow) ARE "
    "PERMITTED when {VISUAL_SYMBOL_IF_NEEDED} is populated.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
    '""",',
    "",
    "  ## ─────────────────────────────────────────────",
    "  ## テンプレートD: 語彙カード・具体物（1:1）【v2.3 新規】",
)

# Patch 2-5: テンプレ D CONSTRAINTS（M-30）
W2_5_OLD = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "Exception: {SIGNAGE_EXCEPTION_IF_ANY}",
)
W2_5_NEW = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no purely decorative symbols inside the image.",
    "Exception: {SIGNAGE_EXCEPTION_IF_ANY}",
)

# Patch 2-6: テンプレ E CONSTRAINTS（M-30）
W2_6_OLD = L(
    "All tiles must share identical illustration style — no tile should look more detailed than another.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
)
# E はもともと "no symbols" 文を含むため M-30 の置換は別パッチで処理
W2_6_OLD2 = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no symbols inside the image.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "All tiles must share identical illustration style — no tile should look more detailed than another.",
)
W2_6_NEW2 = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no purely decorative symbols inside the image.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "All tiles must share identical illustration style — no tile should look more detailed than another.",
)


# ─────────────────────────────────────────────────────────────
# Wave 7: M-47 / M-65 / M-66 / M-70 — 多文化対応・肌色/髪色固定撤廃
#   build_prompts.py compose_role_subject も同期更新する必要あり。
# ─────────────────────────────────────────────────────────────

# Patch 7-1: color_palette.skin_tones
W7_1_OLD = '"skin_tones":  "Naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults",'
W7_1_NEW = '"skin_tones":  "Skin tone is intentionally NOT specified — naturally diverse / multicultural variation expected.",'

# Patch 7-2a: CHARACTER_PROFILES generic_* skin (adult/boy/girl/middle 6 体)
W7_2a_OLD = '"warm medium skin tone"'
W7_2a_NEW = '"naturally diverse skin tone (multicultural variation expected)"'

# Patch 7-2b: senior 系（with natural age signs）2 体
W7_2b_OLD = '"warm medium skin tone with natural age signs"'
W7_2b_NEW = '"naturally diverse skin tone with natural age signs (multicultural variation expected)"'

# Patch 7-2c: FAMILY_TEMPLATES consistency_rules 3 件
W7_2c_OLD = '"All family members share warm medium skin tone for visual consistency"'
W7_2c_NEW = '"All family members share naturally diverse skin tones, harmonized but not identical (multicultural variation)"'

W7_2d_OLD = L(
    '    "consistency_rules": [',
    '      "All family members share warm medium skin tone",',
    '      "Hair colors stay within dark brown to black range"',
    '    ]',
    '  },',
    '',
    '  "young_family": {',
)
W7_2d_NEW = L(
    '    "consistency_rules": [',
    '      "All family members share naturally diverse skin tones, harmonized but not identical",',
    '      "Hair colors stay within naturally varied dark range (dark brown to black)"',
    '    ]',
    '  },',
    '',
    '  "young_family": {',
)

W7_2e_OLD = L(
    '    "consistency_rules": [',
    '      "All family members share warm medium skin tone",',
    '      "Parents look age-appropriate (30s) — younger than middle-aged"',
    '    ]',
    '  }',
)
W7_2e_NEW = L(
    '    "consistency_rules": [',
    '      "All family members share naturally diverse skin tones, harmonized but not identical",',
    '      "Parents look age-appropriate (30s) — younger than middle-aged"',
    '    ]',
    '  }',
)

# Patch 7-2f: QA_CHECKLIST.character_consistency の skin tone 言及
W7_2f_OLD = '"肌の色が指定の warm medium skin tone と一致しているか",'
W7_2f_NEW = '"肌の色が generic_* キャラ間で過剰にバラついていないか（v3.3: NOT specified / multicultural variation 採用）",'

# Patch 7-3a: generic_boy.hair
W7_3a_OLD = '"short slightly messy black hair"'
W7_3a_NEW = '"short slightly messy naturally varied dark hair (dark brown to black)"'

# Patch 7-3b: generic_male_middle.hair
W7_3b_OLD = '"short neat dark brown or black hair, slight gray at the temples"'
W7_3b_NEW = '"short neat naturally varied dark hair (dark brown to black), slight gray at the temples"'

# Patch 7-4: NATIONALITY_NOUN_POLICY.note 改訂
W7_4_OLD = L(
    '  "note":',
    '    "資料5/資料7 整合。多国籍学習者向けには肌色を指定しないことが望ましいが、"',
    '    "肌色の扱いは progress_handoff の問題A〜F 外のため v3.0 では "',
    '    "color_palette.skin_tones を継承（将来の人間判断事項・改訂履歴 §3）。",',
)
W7_4_NEW = L(
    '  "note":',
    '    "v3.3 で multicultural variation を採用済。skin tone は generic_* / "',
    '    "compose_role_subject で NOT specified、NAMED_CHARACTER のみ国籍 "',
    '    "specific 描写を維持（教育設計意図）。",',
)

# Patch 7-5: v3.0 §3 繰越事項マーキング
W7_5_OLD = L(
    '##   - generic_* / color_palette.skin_tones の「warm medium 固定」:',
    '##     多国籍学習者向けには肌色非指定が望ましいとの指摘があるが、',
    '##     これは progress_handoff_v12_0 の問題A〜F には含まれず、かつ',
    '##     「設計方針の変更」に該当するため本版では変更しない（要・人間判断）。',
)
W7_5_NEW = L(
    '##   - generic_* / color_palette.skin_tones の「warm medium 固定」:',
    '##     v3.3 で解消（multicultural variation 採用）。詳細は v3.3 改訂履歴を参照。',
    '##     旧記述: 多国籍学習者向けには肌色非指定が望ましいが、v3.0/v3.1/v3.2 では',
    '##     変更しない（要・人間判断）— v3.3 で完遂。',
)

# Patch 7-6: M-65 — ABSTRACT_METAPHORS["家族"].color_adjustment
W7_6_OLD = '"color_adjustment":   "Harmonized warm tones across all figures; matching skin tones"'
W7_6_NEW = '"color_adjustment":   "Harmonized warm tones across all figures (skin tones naturally varied, but visually balanced)"'

# Patch 7-7: M-66 — generic_* の allowed_changes に "skin_tone" を追加
#   各 generic_* は固有の allowed_changes リストを持つため、各キャラ個別に
#   末尾要素直前に "skin_tone" を挿入する。
#   現状（敢えて）リストの末尾要素手前ではなく、["scene", ...] の直後に挿入する。
W7_7a_OLD = '"allowed_changes": ["scene", "pose", "specific clothes color", "expression"],\n    "notes": "「男の人」の語彙カードや汎用シーンで使用。"'
W7_7a_NEW = '"allowed_changes": ["scene", "pose", "specific clothes color", "expression", "skin_tone", "hair_color"],\n    "notes": "「男の人」の語彙カードや汎用シーンで使用。"'

W7_7b_OLD = '"allowed_changes": ["scene", "pose", "specific clothes color", "expression"],\n    "notes": "「女の人」の語彙カードや汎用シーンで使用。"'
W7_7b_NEW = '"allowed_changes": ["scene", "pose", "specific clothes color", "expression", "skin_tone", "hair_color"],\n    "notes": "「女の人」の語彙カードや汎用シーンで使用。"'

W7_7c_OLD = '''"allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "items held (backpack/randoseru, ball, pencil, books)"],
    "notes": "「子ども」「男の子」「学校」「家族」関連で使用。"'''
W7_7c_NEW = '''"allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "items held (backpack/randoseru, ball, pencil, books)",
                        "skin_tone", "hair_color"],
    "notes": "「子ども」「男の子」「学校」「家族」関連で使用。"'''

W7_7d_OLD = '''"allowed_changes": ["scene", "pose", "hair style (loose / pigtails / one ponytail)",
                        "specific clothes color", "expression", "items held"],
    "notes": "「子ども」「女の子」「学校」「家族」関連で使用。"'''
W7_7d_NEW = '''"allowed_changes": ["scene", "pose", "hair style (loose / pigtails / one ponytail)",
                        "specific clothes color", "expression", "items held",
                        "skin_tone", "hair_color"],
    "notes": "「子ども」「女の子」「学校」「家族」関連で使用。"'''

W7_7e_OLD = '"allowed_changes": ["scene", "pose", "specific clothes color", "expression", "glasses on/off"],\n    "notes": "「お父さん」「中年男性」関連で使用。"'
W7_7e_NEW = '"allowed_changes": ["scene", "pose", "specific clothes color", "expression", "glasses on/off", "skin_tone", "hair_color"],\n    "notes": "「お父さん」「中年男性」関連で使用。"'

W7_7f_OLD = '''"allowed_changes": ["scene", "pose", "hair style (tied back / loose)",
                        "specific clothes color", "expression"],
    "notes": "「お母さん」「中年女性」関連で使用。"'''
W7_7f_NEW = '''"allowed_changes": ["scene", "pose", "hair style (tied back / loose)",
                        "specific clothes color", "expression",
                        "skin_tone", "hair_color"],
    "notes": "「お母さん」「中年女性」関連で使用。"'''

W7_7g_OLD = '''"allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "glasses on/off", "walking stick or cane present"],
    "notes": "「おじいさん」「祖父」関連で使用。"'''
W7_7g_NEW = '''"allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "glasses on/off", "walking stick or cane present",
                        "skin_tone"],
    "notes": "「おじいさん」「祖父」関連で使用。"'''

W7_7h_OLD = '''"allowed_changes": ["scene", "pose", "hair style (loose / tied back)",
                        "specific clothes color", "expression", "glasses on/off"],
    "notes": "「おばあさん」「祖母」関連で使用。"'''
W7_7h_NEW = '''"allowed_changes": ["scene", "pose", "hair style (loose / tied back)",
                        "specific clothes color", "expression", "glasses on/off",
                        "skin_tone"],
    "notes": "「おばあさん」「祖母」関連で使用。"'''


# ─────────────────────────────────────────────────────────────
# Wave 8: テンプレ F — M-59 / M-60 / M-61
# ─────────────────────────────────────────────────────────────

# Patch 8-1 (M-59): テンプレ F constraints に "zero global illumination" 追加
W8_1_OLD = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers inside the image.",
    "Directional arrows are PERMITTED if they clarify the position — use ARROW_SEMIOTICS rules.",
    "A single surface plane (desk/floor) IS REQUIRED — this is not a \"background element\" but",
    "a necessary spatial anchor.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows.",
)
W8_1_NEW = L(
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no purely decorative symbols anywhere — Exception 1 applies.",
    "Directional arrows are PERMITTED if they clarify the position — use ARROW_SEMIOTICS rules.",
    "A single surface plane (desk/floor) IS REQUIRED — this is not a \"background element\" but",
    "a necessary spatial anchor.",
    "No gradients, no shadows, no 3D effects, no photoreal textures.",
    "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
)

# Patch 8-3 (M-61): テンプレ F SUBJECT "bright red" → educational_symbol_colors.symbol_red
W8_3_OLD = "→ Render in a bold accent color (warm amber gold or bright red)."
W8_3_NEW = "→ Render in a bold accent color (warm amber gold or symbol_red from educational_symbol_colors)."


# ─────────────────────────────────────────────────────────────
# Wave 9: 個別軽修正
# ─────────────────────────────────────────────────────────────

# M-1: テンプレ C 背景文字列補修（C は "soft cream off-white background," のみで
#      修飾子 "(warm off-white, NOT pure stark white)" が欠落）
W9_M1_OLD = L(
    "Completely flat solid color fills only. Color palette: soft cream off-white background,",
    "deep slate navy outlines, muted warm colors,",
    "warm amber gold accents for emphasis.",
)
W9_M1_NEW = L(
    "Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),",
    "deep slate navy outlines, muted warm colors,",
    "warm amber gold accents for emphasis.",
)

# M-3: QA_CHECKLIST.building 改訂
W9_M3_OLD = L(
    '    "building": [',
    '      "建物の種類が外観だけで（看板を隠しても）わかるか",',
    '      "入口設備・利用者行動・周辺アンカーの3点セットが揃っているか（BUILDING_CUES 参照）"',
    '    ],',
)
W9_M3_NEW = L(
    '    "building": [',
    '      "建物の種類が外観だけで（看板の英語ラベルを隠しても）わかるか",',
    '      "primary_scene_cue（単一・低クラッター）が描かれているか（BUILDING_CUES 参照）",',
    '      "余計な看板・空のサイン枠・二次ラテン語（RECEPTION/ATM/OPEN 等）・日本語が無いか",',
    '      "看板の英語短語ラベル1個のみで、他のテキストが入っていないか"',
    '    ],',
)

# M-4: PART 8 内の旧 Step 8 完全削除
W9_M4_OLD = L(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Step 8: 建物画像の設計（vocab_type: building）",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "  → BUILDING_CUES から対象建物のエントリを参照",
    "  → テンプレートB（vocabulary_building）を使用（v2.3 で変更なし）",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Step 9: JSONプロンプトを記述する",
)
W9_M4_NEW = L(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Step 9: JSONプロンプトを記述する",
)

# M-8: テンプレ A STYLE RECIPE に sub_color 言及追加
#   v3.2 原文では template A constraints は "no decorative" (W2-1 適用前)
W9_M8_OLD = L(
    "Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),",
    "deep slate navy outlines, muted warm blue",
    "and warm amber gold as accents.",
    "This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.",
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no decorative symbols anywhere — including",
)
W9_M8_NEW = L(
    "Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),",
    "deep slate navy outlines, muted warm blue",
    "and warm amber gold as accents, cool slate gray for secondary elements.",
    "This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.",
    "",
    "[CONSTRAINTS]",
    "No text, no letters, no numbers, no decorative symbols anywhere — including",
)

# M-26: 教科書別ガイド「固定キャラ」記述
W9_M26_OLD = L(
    "  日本語の教え方ABC: 例文ごとにバラバラの人物名 → テキスト保持・画像は汎用人物",
    "  みんなの日本語:    固定キャラあり → テキスト保持・画像は汎用人物",
    "  げんき:           固定キャラあり → テキスト保持・画像は汎用人物",
)
W9_M26_NEW = L(
    "  日本語の教え方ABC: 例文ごとにバラバラの人物名 → テキスト保持・画像は汎用人物",
    "  みんなの日本語:    固定キャラあり → NAMED_CHARACTER_PROFILES（鈴木さん等5名）を使用、",
    "                                      それ以外の役割は ROLE_BASED_GENERIC_PROFILES",
    "  げんき:           固定キャラあり → 同上",
)

# M-29: DEMONSTRATIVE_MODELS の色表記不統一
W9_M29a_OLD = "(speaker's side): highlight with speaker's accent color (soft warm blue)."
W9_M29a_NEW = "(speaker's side): highlight with speaker's accent color (muted warm blue)."

W9_M29b_OLD = "(listener's side): highlight with listener's accent color (soft amber)."
W9_M29b_NEW = "(listener's side): highlight with listener's accent color (warm amber gold)."

W9_M29c_OLD = "Draw a shared ellipse close to them representing the こ zone (warm blue),\nthen a medium-distance zone representing そ (amber),"
W9_M29c_NEW = "Draw a shared ellipse close to them representing the こ zone (muted warm blue),\nthen a medium-distance zone representing そ (warm amber gold),"

W9_M29d_OLD = "Use the speaker's accent color (warm blue) to highlight BOTH the stretched"
W9_M29d_NEW = "Use the speaker's accent color (muted warm blue) to highlight BOTH the stretched"

# M-62: テンプレ G "warm amber gold for listener territory or accent"
W9_M62_OLD = "warm amber gold for listener territory or accent."
W9_M62_NEW = "warm amber gold for listener territory (also usable as accent in non-listener contexts)."

# M-63: テンプレ I "NO 'gradient-free tone' shading"
W9_M63_OLD = "Background: minimal — large flat SOLID color fields only. NO gradients, NO 'gradient-free tone' shading, NO lighting effects (must remain completely flat solid fills, consistent with the STYLE RECIPE)."
W9_M63_NEW = "Background: minimal — large flat SOLID color fields only. NO gradients, NO shading of any kind, NO lighting effects (must remain completely flat solid fills, consistent with the STYLE RECIPE)."

# M-71: ARROW_SEMIOTICS.curved_arc.use_cases — 「振り向く」削除＋note追加
W9_M71_OLD = L(
    '  "curved_arc": {',
    '    "shape":   "Curved arc arrow (semicircle shape)",',
    '    "meaning": "Rotation, turning, redirecting attention or gaze",',
    '    "use_cases": [',
    '      "「振り向く」— turning around",',
    '      "「こちらを向いて」— directing gaze toward speaker",',
    '      "「あ」の心理的引き込みで領域が曲線的に変形する動き"',
    '    ],',
    '    "color":   "Muted warm blue"',
    '  },',
)
W9_M71_NEW = L(
    '  "curved_arc": {',
    '    "shape":   "Curved arc arrow (semicircle shape)",',
    '    "meaning": "Rotation, turning, redirecting attention or gaze",',
    '    "use_cases": [',
    '      "「こちらを向いて」— directing gaze toward speaker",',
    '      "「あ」の心理的引き込みで領域が曲線的に変形する動き"',
    '    ],',
    '    "note":    "「振り向く」等の CURVED_MOTION 系動詞は、テンプレ H の "',
    '               "MOTION_ARROW 戦略 + ARROW_SEMIOTICS.curved_arc の "',
    '               "組合せで表現する（curved_arc 単独戦略は無い）。",',
    '    "color":   "Muted warm blue"',
    '  },',
)

# M-72: HOW_TO_USE Step 0 例示語差替
W9_M72_OLD = L(
    '    - 「写真を撮る」→ action_verb（動作が主）',
    '    - 「写真」単体 → concrete_object（物体として示す）',
    '    - 「元気」→ abstract_concept（目に見えない状態）',
)
W9_M72_NEW = L(
    '    - 「写真を撮る」→ action_verb（動作が主）',
    '    - 「ペン」→ concrete_object（物体として示す）',
    '    - 「嬉しい」→ abstract_concept（目に見えない状態）',
)

# M-9: iconization_level_guide vocab_types に action_verb 注記
W9_M9_OLD = '"vocab_types":  ["concrete_object", "abstract_concept", "action_verb", "adjective"]'
W9_M9_NEW = '"vocab_types":  ["concrete_object", "abstract_concept", "action_verb (default; SEQUENCE_3PANEL strategy uses level_2)", "adjective"]'

# M-43: iconization_level_guide.level_4_realistic.vocab_types 文字列→配列
W9_M43_OLD = '"vocab_types":  ["NOT used in this project"]'
W9_M43_NEW = '"vocab_types":  []  # NOT used in this project (level_4 realistic は本プロジェクト範囲外)'

# M-22: vocabulary_card_style "Single centered subject only" + variant_grid 例外
W9_M22_OLD = '"Solid soft cream off-white background (warm off-white, NOT pure stark white). Single centered subject only. "'
W9_M22_NEW = '"Solid soft cream off-white background (warm off-white, NOT pure stark white). Single centered subject only (Exception: variant_grid テンプレ E は multi-tile composition を許可). "'

# M-35: テンプレ I ブロックラベル統一
W9_M35_OLD = '[SUBJECT — TIAC Layer 2: Object]'
W9_M35_NEW = '[SUBJECT]'

W9_M35b_OLD = '[SCENE & ACTION — TIAC Layer 3: Form]'
W9_M35b_NEW = '[SCENE & ACTION]'

# M-58: テンプレ B "muted warm colors" → 限定子付き
W9_M58_OLD = 'deep slate navy outlines, muted warm colors for the building facade,'
W9_M58_NEW = 'deep slate navy outlines, main_color and sub_color tones for the building facade (細部のみ educational_symbol_colors 許可),'

# M-21: BUILDING_CUES 旧 3 フィールド削除を「コメントアウト」する
#   = entrance_cue / user_action_cue / surrounding_anchor を残置するが、
#     冒頭コメントで「v3.3 で deprecated」を明記。
#   (BUILDING_CUES 冒頭コメント直後に追記する形)
W9_M21_OLD = L(
    "##   - 旧3フィールドは後方互換のため残置（旧 lesson の S列生成が参照する",
    "##     可能性があるため）。Template B v3.0 では使用しない。",
)
W9_M21_NEW = L(
    "##   - 旧3フィールドは後方互換のため残置（旧 lesson の S列生成が参照する",
    "##     可能性があるため）。Template B v3.0 では使用しない。",
    "## v3.3: entrance_cue / user_action_cue / surrounding_anchor は",
    "##       deprecated。primary_scene_cue が SSOT。新規 lesson から参照しない。",
)

# M-16+M-69: NAMED_CHARACTER_PROFILES の生成パス未実装 + lesson_appearances 更新規律（統合）
W9_M16_OLD = "NAMED_CHARACTER_PROFILES = {"
W9_M16_NEW = (
    "# v3.3 注記（M-16）: NAMED_CHARACTER_PROFILES の生成パスは未実装。\n"
    "#   Phase 4 後の named_character 拡張で build_prompts.py に組み込み予定。\n"
    "# v3.3 注記（M-69）: lesson_appearances 更新規律:\n"
    "#   - 新規 lesson で NAMED キャラが登場する時、該当キャラの lesson_appearances に lesson_NN を追記。\n"
    "#   - apply_vNN.py には反映しない（lesson データ独自管理）。\n"
    "NAMED_CHARACTER_PROFILES = {"
)

# M-17: NATIONALITY_NOUN_POLICY に「外国人は対象外」明示
W9_M17_OLD = '##   ※ 固定5名（鈴木さん等・NAMED_CHARACTER_PROFILES）には適用しない。\n##     固定キャラは各自の nationality_visual_hints に従う。'
W9_M17_NEW = '##   ※ 固定5名（鈴木さん等・NAMED_CHARACTER_PROFILES）には適用しない。\n##     固定キャラは各自の nationality_visual_hints に従う。\n##   ※ 「外国人」(generic role) は本ポリシーの対象外。flag pin を持たず、\n##     ROLE_BASED_GENERIC_PROFILES["foreigner"] で生成する。'

# M-33: HOW_TO_USE Step 2-B に優先順位明示
W9_M33_OLD = L(
    "  Step 2-A: 役割を特定 → ROLE_BASED_GENERIC_PROFILES から選択",
    "  Step 2-B: 年齢層・性別を選択 → CHARACTER_PROFILES の generic_* から選択",
)
W9_M33_NEW = L(
    "  Step 2-A: 役割を特定 → ROLE_BASED_GENERIC_PROFILES から選択",
    "            ※ 同じ役割について NAMED_CHARACTER と ROLE_BASED 両方が定義される時、",
    "              NAMED_CHARACTER_PROFILES（鈴木さん等）が優先される。",
    "  Step 2-B: 年齢層・性別を選択 → CHARACTER_PROFILES の generic_* から選択",
    "            v3.3 多文化配慮: skin tone は NOT specified / hair は varied dark を default。",
)

# M-34: iconization_level_guide vocab_types に spatial_relation / demonstrative 追加
W9_M34_OLD = '"vocab_types":  ["person", "building"]'
W9_M34_NEW = '"vocab_types":  ["person", "building", "spatial_relation", "demonstrative"]'

# M-44: flag pin 規律の明示
W9_M44_OLD = L(
    "- スタイル固定フレーズは同義語に言い換えない（\"flat\" → \"2D\" などは禁止）",
    "- 画像プロンプトに固有名詞（Tanaka-sensei, Yamada-san 等）を絶対に書かない",
)
W9_M44_NEW = L(
    "- スタイル固定フレーズは同義語に言い換えない（\"flat\" → \"2D\" などは禁止）",
    "- 画像プロンプトに固有名詞（Tanaka-sensei, Yamada-san 等）を絶対に書かない",
    "- flag pin / nationality_visual_hints 規律:",
    "    NAMED_CHARACTER_PROFILES: nationality_visual_hints は optional（キャラ設定に従う）",
    "    NATIONALITY_NOUN_POLICY:  「中国人」「アメリカ人」等の汎用語に対しては",
    "                              flag pin を必須化（小さく・4% 以下）",
)

# M-69: NAMED_CHARACTER_PROFILES.lesson_appearances 更新規律の注記
W9_M69_OLD = "# v3.3 注記（M-16）: NAMED_CHARACTER_PROFILES の生成パスは未実装。\n#   Phase 4 後の named_character 拡張で build_prompts.py に組み込み予定。\nNAMED_CHARACTER_PROFILES = {"
W9_M69_NEW = "# v3.3 注記（M-16）: NAMED_CHARACTER_PROFILES の生成パスは未実装。\n#   Phase 4 後の named_character 拡張で build_prompts.py に組み込み予定。\n# v3.3 注記（M-69）: lesson_appearances 更新規律:\n#   - 新規 lesson で NAMED キャラが登場する時、該当キャラの lesson_appearances に lesson_NN を追記。\n#   - apply_vNN.py には反映しない（lesson データ独自管理）。\nNAMED_CHARACTER_PROFILES = {"

# M-48: FAMILY_TEMPLATES 冒頭注記
W9_M48_OLD = L(
    "## ============================================================",
    "## PART 2.5: FAMILY TEMPLATES（家族構成テンプレート）",
    "## ============================================================",
    "## ※ v2.2 から変更なし。",
    "## ============================================================",
)
W9_M48_NEW = L(
    "## ============================================================",
    "## PART 2.5: FAMILY TEMPLATES（家族構成テンプレート）",
    "## ============================================================",
    "## ※ v2.2 から変更なし。",
    "## v3.3 注記（M-48）: 本テンプレートは現状未活用。Phase 4 後の",
    "##   vocab_type=family 設計時に activate 予定。",
    "## ============================================================",
)

# ─────────────────────────────────────────────────────────────
# Wave 5: SSOT 階層違反 wave（M-28 / M-37 / M-42）
# ─────────────────────────────────────────────────────────────

# M-28a: ケータイ material_hints
W5_28a_OLD = '"A thin diagonal white highlight line across the top-right of the screen — glass surface",'
W5_28a_NEW = '"A flat white reflection mark (single straight line, no gradient) across the top-right of the screen — symbolic glass surface",'

# M-28b: 茶碗 material_hints
W5_28b_OLD = '"A thin shadow ring under the base foot"'
W5_28b_NEW = '"A deep slate navy outline at the base contour"'

# M-28c: 雑誌 material_hints (glossy → flat)
W5_28c_OLD = '"Subtle curved lines at the bottom edge of pages suggesting glossy paper flex",'
W5_28c_NEW = '"Subtle curved lines at the bottom edge of pages as flat paper edges (no gloss)",'

# M-28d: 財布 material_hints (pebble grain → dot stippling)
W5_28d_OLD = '"Subtle pebble grain texture on the leather surface — tiny dot stippling pattern",'
W5_28d_NEW = '"Subtle dot stippling pattern on the leather surface as symbolic grain texture",'

# M-28e: テレビ material_hints (glossy highlight → flat)
W5_28e_OLD = '"Thin glossy highlight across the top edge of the screen",'
W5_28e_NEW = '"Thin flat highlight line across the top edge of the screen (symbolic, no gloss)",'

# M-28f: カード material_hints (specular highlight → flat)
W5_28f_OLD = '"A thin diagonal white specular highlight across the card surface — plastic sheen",'
W5_28f_NEW = '"A thin diagonal white reflection line across the card surface (single flat line, no sheen)",'

# M-28g: 車 material_hints (metal sheen → flat)
W5_28g_OLD = '"Thin white highlight curve along the roof roofline — metal sheen",'
W5_28g_NEW = '"Thin white reflection line along the roof roofline (single flat line, no sheen)",'

# M-28h: コップ specular highlight
W5_28h_OLD = '"A subtle specular highlight line on the left side of the glass",'
W5_28h_NEW = '"A subtle flat highlight line on the left side of the glass (symbolic, no specular)",'

# M-28i: コップ highlight arc
W5_28i_OLD = '"Thin white highlight arc across the top rim",'
W5_28i_NEW = '"Thin white flat line across the top rim (no shading)",'

# M-37a: ABSTRACT_METAPHORS["好き"].visual_metaphor (glowing heart)
W5_37a_OLD = '"visual_metaphor":    "A character holding a large glowing heart shape toward the viewer, or cradling an object with both hands in a protective gesture",'
W5_37a_NEW = '"visual_metaphor":    "A character holding a large solid amber heart shape toward the viewer (no glow / no gradient), or cradling an object with both hands in a protective gesture",'

# M-37b: ABSTRACT_METAPHORS["友達"].visual_metaphor (light radiating)
W5_37b_OLD = '"visual_metaphor":    "Two characters standing side by side, shoulders touching, both facing forward; OR two puzzle pieces fitting perfectly together with light radiating from the join",'
W5_37b_NEW = '"visual_metaphor":    "Two characters standing side by side, shoulders touching, both facing forward; OR two puzzle pieces fitting perfectly together with a small amber star mark at the joint (no lighting effect)",'

# M-37c: ABSTRACT_METAPHORS["これから"].visual_metaphor (sunrise)
W5_37c_OLD = '"visual_metaphor":    "A character walking forward on a path that extends into the horizon; OR a sunrise scene with a figure facing the light",'
W5_37c_NEW = '"visual_metaphor":    "A character walking forward on a path that extends into the horizon; OR a flat amber horizon band with figure silhouette facing right (no actual lighting)",'

# M-42: STYLE_BIBLE.example_image_style (Soft natural indoor or outdoor daylight)
W5_42_OLD = '"Eye-level front or slight three-quarter view. "\n    "Straight vertical lines for buildings. Soft natural indoor or outdoor daylight.",'
W5_42_NEW = '"Eye-level front or slight three-quarter view. "\n    "Straight vertical lines for buildings. Flat warm tonal balance, no lighting effects, no shadows.",'


# ─────────────────────────────────────────────────────────────
# Wave 6: M-31 / M-38 / M-58 / M-61b / M-64 — educational_symbol_colors
# ─────────────────────────────────────────────────────────────

# Patch 6-1: color_palette に educational_symbol_colors サブセクション追加
#   v3.2 原文の skin_tones 行を anchor として、その直後に新セクションを挿入
W6_1_OLD = L(
    '    "skin_tones":  "Naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults",',
    '    "note": "v3.2: 背景色名を SCENE と STYLE RECIPE で一致させ統一（旧『soft cream white』→『soft cream off-white (warm off-white, NOT pure stark white)』）。v3.1 までは SCENE のみ off-white でRECIPEは white のままだったため白飛びを「抑制」していたが、v3.2 で両者を同一表記にし矛盾を「除去」した。#HEや hex value は引き続き一切書かない。今後この背景色名は SCENE と STYLE RECIPE で常に一字一句一致させること（新・反ドリフト原則）。"',
)
W6_1_NEW = L(
    '    "skin_tones":  "Naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults",',
    '    "educational_symbol_colors": {',
    '      "_purpose":          "VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS.color_adjustment で使う symbolic / pedagogical color tokens. core_style の \'flat solid\' 規律内で使用。",',
    '      "symbol_red":        "muted symbolic red (質問・否定・警告用)",',
    '      "symbol_green":      "muted symbolic green (checkmark・正解用)",',
    '      "symbol_orange":     "muted symbolic orange (注意・選択用)",',
    '      "symbol_blue_cool":  "cool slate blue (冷却・否定情緒)",',
    '      "symbol_pink_warm":  "warm muted pink (好意・愛情情緒)",',
    '      "symbol_sepia":      "muted sepia (過去・記憶)",',
    '      "symbol_sky_pale":   "pale sky blue (未来・空間)"',
    '    },',
    '    "note": "v3.3: educational_symbol_colors サブセクションを追加し、VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS の symbolic 色を正式化。v3.2: 背景色名を SCENE と STYLE RECIPE で一致させ統一（旧『soft cream white』→『soft cream off-white (warm off-white, NOT pure stark white)』）。v3.1 までは SCENE のみ off-white でRECIPEは white のままだったため白飛びを「抑制」していたが、v3.2 で両者を同一表記にし矛盾を「除去」した。#HEや hex value は引き続き一切書かない。今後この背景色名は SCENE と STYLE RECIPE で常に一字一句一致させること（新・反ドリフト原則）。"',
)

# Patch 6-2 (M-31): VISUAL_SYMBOLS bright green / bright red / orange を symbol_* 参照に
W6_2a_OLD = '"A large bright green circle with a bold checkmark floats above the character."'
W6_2a_NEW = '"A large symbol_green circle with a bold checkmark floats above the character (use educational_symbol_colors.symbol_green)."'

W6_2b_OLD = '"A large red circle with a bold X mark floats above the character."'
W6_2b_NEW = '"A large symbol_red circle with a bold X mark floats above the character (use educational_symbol_colors.symbol_red)."'

W6_2c_OLD = '"A curved red or orange motion arrow indicates the direction of the action."'
W6_2c_NEW = '"A curved symbol_red or symbol_orange motion arrow indicates the direction of the action (use educational_symbol_colors)."'

# Patch 6-3 (M-38): ARROW_SEMIOTICS.straight_bold "Warm amber gold or bright red" → symbol_red
W6_3_OLD = '"color":   "Warm amber gold or bright red"'
W6_3_NEW = '"color":   "Warm amber gold or symbol_red (use educational_symbol_colors.symbol_red)"'

# Patch 6-4 (M-61b): テンプレ H 内の bright red 使用箇所
W6_4_OLD = "The arrow color: warm amber gold or bright red."
W6_4_NEW = "The arrow color: warm amber gold or symbol_red (use educational_symbol_colors.symbol_red)."

# Patch 6-5 (M-64): ABSTRACT_METAPHORS.color_adjustment 系の symbolic 色を symbol_* に
W6_5a_OLD = '"color_adjustment":   "Increase warm amber gold and soft rose-pink tones"'
W6_5a_NEW = '"color_adjustment":   "Increase warm amber gold and symbol_pink_warm tones (use educational_symbol_colors)"'

W6_5b_OLD = '"color_adjustment":   "Use cooler blue-gray tones; avoid warm colors"'
W6_5b_NEW = '"color_adjustment":   "Use symbol_blue_cool tones; avoid warm colors (use educational_symbol_colors)"'

W6_5c_OLD = '"color_adjustment":   "Bright amber gold accents; high visual energy in composition"'
W6_5c_NEW = '"color_adjustment":   "Warm amber gold accents (color_palette.accent); high visual energy in composition"'

W6_5d_OLD = '"color_adjustment":   "Red-orange accent lines; reduce soft tones"'
W6_5d_NEW = '"color_adjustment":   "symbol_red accent lines (use educational_symbol_colors); reduce soft tones"'

W6_5e_OLD = '"color_adjustment":   "Cool gray dominant; amber gold for the question mark symbol only"'
W6_5e_NEW = '"color_adjustment":   "cool slate gray dominant (color_palette.sub_color); warm amber gold for the question mark symbol only"'

W6_5f_OLD = '"color_adjustment":   "Warm amber and sepia tones dominant; reduce bright colors"'
W6_5f_NEW = '"color_adjustment":   "warm amber gold and symbol_sepia tones dominant (use educational_symbol_colors); reduce bright colors"'

W6_5g_OLD = '"color_adjustment":   "Warm amber gold for the horizon/light source; blue for the sky"'
W6_5g_NEW = '"color_adjustment":   "warm amber gold for the horizon/light source; symbol_sky_pale for the sky (use educational_symbol_colors)"'

W6_5h_OLD = '"color_adjustment":   "Left panel: cool gray; Right panel: warm amber and blue"'
W6_5h_NEW = '"color_adjustment":   "Left panel: cool slate gray (color_palette.sub_color); Right panel: warm amber gold and muted warm blue"'


# ─────────────────────────────────────────────────────────────
# ヘッダー / 改訂履歴
# ─────────────────────────────────────────────────────────────

H_OLD = "# Version 3.2 | 2026-05-19 (= v3.1 + 監査7項目の決定論一括是正。全変更=apply_v3_2.py のみ)"
H_NEW = L(
    "# Version 3.3 | 2026-05-20 (= v3.2 + 監査72項目の決定論一括是正。全変更=apply_v3_3.py のみ)",
    "#   詳細パッチ仕様: docs/PROMPT_GUIDE_V3_3_PATCHES.md（72 件・wave 構造）",
    "#   Wave 1 (M-49): PART 7 GEMINI_STABILIZATION 退役 → archive 保全",
    "#                  color_space_protocol だけ PART 6.5 として救出",
    "#   Wave 2 (M-2):  'no decorative' → 'no purely decorative' 二層構造",
    "#                  Exception 1 拡張で C/I を PERMITTED テンプレに追加",
    "#   Wave 5 (M-28/37/42): SSOT 階層違反 (highlight/shadow/glossy/glow) 一括書換",
    "#   Wave 6 (M-31): color_palette.educational_symbol_colors サブセクション追加",
    "#   Wave 7 (M-47): skin tone NOT specified / hair varied dark で多文化配慮",
    "#                  (v3.0 §3 繰越事項を最終解消)",
    "#   Wave 8 (M-59/60/61): テンプレ F 単独不整合解消",
    "#   Wave 9 個別軽修正: M-1 / M-3 / M-4 / M-8 / M-9 / M-22 / M-29 / M-35 /",
    "#                  M-43 / M-44 / M-48 / M-58 / M-62 / M-63 / M-71 / M-72 等",
    "# Version 3.2 | 2026-05-19 (= v3.1 + 監査7項目の決定論一括是正。全変更=apply_v3_2.py のみ)",
)


# ─────────────────────────────────────────────────────────────
# MANIFEST
# ─────────────────────────────────────────────────────────────
# (label, old, new, expected_count, replace_all_flag)
# expected_count=-1 → replace_all（件数アサート無効）
MANIFEST = [
    # === ヘッダ ===
    ("H  ヘッダ → v3.3",                        H_OLD,        H_NEW,        1,  False),

    # === Wave 1: M-49 PART 7 退役 ===
    ("W1 M-49 PART 7 → PART 6.5 救出+削除",     W1_PART7_OLD, W1_PART7_NEW, 1,  False),

    # === Wave 2: M-2 purely decorative + M-14 + M-30 ===
    ("W2-1 M-2 グローバル constraints",          W2_1_OLD,     W2_1_NEW,     1,  False),
    ("W2-2 M-2 Exception 1 拡張",                W2_2_OLD,     W2_2_NEW,     1,  False),
    ("W2-3 M-2 テンプレ I CONSTRAINTS",          W2_3_OLD,     W2_3_NEW,     1,  False),
    ("W2-4 M-30 テンプレ C CONSTRAINTS",         W2_4_OLD,     W2_4_NEW,     1,  False),
    ("W2-5 M-30 テンプレ D CONSTRAINTS",         W2_5_OLD,     W2_5_NEW,     1,  False),
    ("W2-6 M-30 テンプレ E CONSTRAINTS",         W2_6_OLD2,    W2_6_NEW2,    1,  False),

    # === Wave 5: SSOT 階層違反 (M-28/37/42) — Wave 6 より先（M-37 が color_adjustment と独立） ===
    ("W5 M-28a ケータイ highlight",              W5_28a_OLD,   W5_28a_NEW,   1,  False),
    ("W5 M-28b 茶碗 shadow",                     W5_28b_OLD,   W5_28b_NEW,   1,  False),
    ("W5 M-28c 雑誌 glossy",                     W5_28c_OLD,   W5_28c_NEW,   1,  False),
    ("W5 M-28d 財布 pebble",                     W5_28d_OLD,   W5_28d_NEW,   1,  False),
    ("W5 M-28e テレビ glossy",                   W5_28e_OLD,   W5_28e_NEW,   1,  False),
    ("W5 M-28f カード specular",                 W5_28f_OLD,   W5_28f_NEW,   1,  False),
    ("W5 M-28g 車 metal sheen",                  W5_28g_OLD,   W5_28g_NEW,   1,  False),
    ("W5 M-28h コップ specular",                 W5_28h_OLD,   W5_28h_NEW,   1,  False),
    ("W5 M-28i コップ highlight arc",            W5_28i_OLD,   W5_28i_NEW,   1,  False),
    ("W5 M-37a 好き glowing heart",              W5_37a_OLD,   W5_37a_NEW,   1,  False),
    ("W5 M-37b 友達 light radiating",            W5_37b_OLD,   W5_37b_NEW,   1,  False),
    ("W5 M-37c これから sunrise",                W5_37c_OLD,   W5_37c_NEW,   1,  False),
    ("W5 M-42 example_image_style daylight",     W5_42_OLD,    W5_42_NEW,    1,  False),

    # === Wave 6: M-31 educational_symbol_colors + M-38/58/61b/64 ===
    ("W6-1 M-31 educational_symbol_colors追加",  W6_1_OLD,     W6_1_NEW,     1,  False),
    ("W6-2a M-31 はい・肯定 → symbol_green",     W6_2a_OLD,    W6_2a_NEW,    1,  False),
    ("W6-2b M-31 いいえ・否定 → symbol_red",     W6_2b_OLD,    W6_2b_NEW,    1,  False),
    ("W6-2c M-31 動作の方向 → symbol_red/orange",W6_2c_OLD,    W6_2c_NEW,    1,  False),
    ("W6-3 M-38 ARROW_SEMIOTICS straight_bold",  W6_3_OLD,     W6_3_NEW,    1,  False),
    ("W6-4 M-61b テンプレ H bright red",         W6_4_OLD,     W6_4_NEW,    1,  False),
    ("W6-5a M-64 好き rose-pink",                W6_5a_OLD,    W6_5a_NEW,   1,  False),
    ("W6-5b M-64 嫌い blue-gray",                W6_5b_OLD,    W6_5b_NEW,   1,  False),
    ("W6-5c M-64 楽しい bright amber",           W6_5c_OLD,    W6_5c_NEW,   1,  False),
    ("W6-5d M-64 怒る red-orange",               W6_5d_OLD,    W6_5d_NEW,   1,  False),
    ("W6-5e M-64 心配 cool gray",                W6_5e_OLD,    W6_5e_NEW,   1,  False),
    ("W6-5f M-64 むかし sepia",                  W6_5f_OLD,    W6_5f_NEW,   1,  False),
    ("W6-5g M-64 これから blue sky",             W6_5g_OLD,    W6_5g_NEW,   1,  False),
    ("W6-5h M-64 変わる cool gray panel",        W6_5h_OLD,    W6_5h_NEW,   1,  False),

    # === Wave 7: M-47/65/66/70 多文化対応 ===
    ("W7-1 M-47 skin_tones not specified",        W7_1_OLD,     W7_1_NEW,    1,  False),
    ("W7-2a M-47 generic_* skin (adult系6)",      W7_2a_OLD,    W7_2a_NEW,   6,  False),
    ("W7-2b M-47 senior skin (age signs)",        W7_2b_OLD,    W7_2b_NEW,   2,  False),
    ("W7-2c M-47 family standard 3gen",           W7_2c_OLD,    W7_2c_NEW,   1,  False),
    ("W7-2d M-47 family nuclear",                 W7_2d_OLD,    W7_2d_NEW,   1,  False),
    ("W7-2e M-47 family young",                   W7_2e_OLD,    W7_2e_NEW,   1,  False),
    ("W7-2f M-47 QA_CHECKLIST skin",              W7_2f_OLD,    W7_2f_NEW,   1,  False),
    ("W7-3a M-70 generic_boy hair",               W7_3a_OLD,    W7_3a_NEW,   1,  False),
    ("W7-3b M-70 generic_male_middle hair",       W7_3b_OLD,    W7_3b_NEW,   1,  False),
    ("W7-4 M-47 NATIONALITY note",                W7_4_OLD,     W7_4_NEW,    1,  False),
    ("W7-5 M-47 v3.0 §3 マーキング",              W7_5_OLD,     W7_5_NEW,    1,  False),
    ("W7-6 M-65 家族 color_adjustment skin",      W7_6_OLD,     W7_6_NEW,    1,  False),
    ("W7-7a M-66 generic_male_adult allowed",     W7_7a_OLD,    W7_7a_NEW,   1,  False),
    ("W7-7b M-66 generic_female_adult allowed",   W7_7b_OLD,    W7_7b_NEW,   1,  False),
    ("W7-7c M-66 generic_boy allowed",            W7_7c_OLD,    W7_7c_NEW,   1,  False),
    ("W7-7d M-66 generic_girl allowed",           W7_7d_OLD,    W7_7d_NEW,   1,  False),
    ("W7-7e M-66 generic_male_middle allowed",    W7_7e_OLD,    W7_7e_NEW,   1,  False),
    ("W7-7f M-66 generic_female_middle allowed",  W7_7f_OLD,    W7_7f_NEW,   1,  False),
    ("W7-7g M-66 generic_male_senior allowed",    W7_7g_OLD,    W7_7g_NEW,   1,  False),
    ("W7-7h M-66 generic_female_senior allowed",  W7_7h_OLD,    W7_7h_NEW,   1,  False),

    # === Wave 8: テンプレ F (M-59/60/61) ===
    ("W8-1 M-59 テンプレ F constraints",          W8_1_OLD,     W8_1_NEW,    1,  False),
    ("W8-3 M-61 テンプレ F bright red",           W8_3_OLD,     W8_3_NEW,    1,  False),

    # === Wave 9: 個別軽修正 ===
    ("W9 M-1 テンプレ C 背景文字列補修",          W9_M1_OLD,    W9_M1_NEW,   1,  False),
    ("W9 M-3 QA_CHECKLIST building",              W9_M3_OLD,    W9_M3_NEW,   1,  False),
    ("W9 M-4 旧 Step 8 削除",                     W9_M4_OLD,    W9_M4_NEW,   1,  False),
    ("W9 M-8 テンプレ A sub_color 追加",          W9_M8_OLD,    W9_M8_NEW,   1,  False),
    ("W9 M-9 iconization level_3 action_verb",    W9_M9_OLD,    W9_M9_NEW,   1,  False),
    ("W9 M-16+M-69 NAMED_CHARACTER 注記",         W9_M16_OLD,   W9_M16_NEW,  1,  False),
    ("W9 M-17 NATIONALITY 外国人例外",            W9_M17_OLD,   W9_M17_NEW,  1,  False),
    ("W9 M-21 BUILDING_CUES 旧3フィールド注記",   W9_M21_OLD,   W9_M21_NEW,  1,  False),
    ("W9 M-22 vocabulary_card_style variant",     W9_M22_OLD,   W9_M22_NEW,  1,  False),
    ("W9 M-26 教科書別ガイド",                    W9_M26_OLD,   W9_M26_NEW,  1,  False),
    ("W9 M-29a soft warm blue → muted",           W9_M29a_OLD,  W9_M29a_NEW, 1,  False),
    ("W9 M-29b soft amber → warm amber gold",     W9_M29b_OLD,  W9_M29b_NEW, 1,  False),
    ("W9 M-29c parallel zone colors",             W9_M29c_OLD,  W9_M29c_NEW, 1,  False),
    ("W9 M-29d psych_pull warm blue",             W9_M29d_OLD,  W9_M29d_NEW, 1,  False),
    ("W9 M-33 Step 2 NAMED 優先",                 W9_M33_OLD,   W9_M33_NEW,  1,  False),
    ("W9 M-34 level_2 spatial/demonstrative",     W9_M34_OLD,   W9_M34_NEW,  1,  False),
    ("W9 M-35 テンプレ I [SUBJECT] ラベル",       W9_M35_OLD,   W9_M35_NEW,  1,  False),
    ("W9 M-35b テンプレ I [SCENE & ACTION]",      W9_M35b_OLD,  W9_M35b_NEW, 1,  False),
    ("W9 M-43 level_4_realistic empty list",      W9_M43_OLD,   W9_M43_NEW,  1,  False),
    ("W9 M-44 flag pin 規律",                     W9_M44_OLD,   W9_M44_NEW,  1,  False),
    ("W9 M-48 FAMILY_TEMPLATES 注記",             W9_M48_OLD,   W9_M48_NEW,  1,  False),
    ("W9 M-58 テンプレ B muted warm colors",      W9_M58_OLD,   W9_M58_NEW,  1,  False),
    ("W9 M-62 テンプレ G listener territory",     W9_M62_OLD,   W9_M62_NEW,  1,  False),
    ("W9 M-63 テンプレ I gradient-free quote",    W9_M63_OLD,   W9_M63_NEW,  1,  False),
    # M-69 は M-16 と統合済（W9 M-16+M-69）。単独パッチなし。
    ("W9 M-71 ARROW_SEMIOTICS curved_arc",        W9_M71_OLD,   W9_M71_NEW,  1,  False),
    ("W9 M-72 HOW_TO_USE Step 0 例示語",          W9_M72_OLD,   W9_M72_NEW,  1,  False),
]


# ─────────────────────────────────────────────────────────────
# Wave 1 副産物: archive 保全ファイル本文
# ─────────────────────────────────────────────────────────────
LEGACY_HEADER = '''# -*- coding: utf-8 -*-
"""
master_prompt_gemini_stabilization_legacy.py — Phase 4 ⑥ で archive 退役
（v3.3）。旧 Gemini chat-session 時代のドリフト対策。

このファイルは v3.2 ガイドの PART 7 GEMINI_STABILIZATION 全体を保全したもの。
v3.3 以降は Imagen 4 ローカル化（個別 API・session 無し）に移行したため
適用不能。session_management / drift_detection_signals / production_rules /
session_reset_protocol / cost_note などすべて死コード化。

出力 PNG QC として有用な color_space_protocol は v3.3 で PART 6.5
OUTPUT_IMAGE_SPECIFICATIONS として残置されている。

(M-13 / M-25 / M-45 / M-46 / M-49 / M-68 一括解消)
"""

'''


# ─────────────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────────────
def main():
    if not os.path.exists(SRC):
        sys.exit(f"ABORT: source ガイドが不在: {SRC}")

    text = open(SRC, encoding="utf-8").read()
    print(f"=== apply_v3_3.py 編集マニフェスト（{len(MANIFEST)} 件・件数アサート） ===")
    fail = []
    for label, old, new, expect, _ in MANIFEST:
        n = text.count(old)
        if n != expect:
            fail.append((label, expect, n))
            status = "FAIL"
        else:
            status = " OK "
        print(f"[{status}] {label}: 期待{expect} 実{n}")
    if fail:
        for label, expect, n in fail:
            print(f"  ABORT cause: {label} 期待{expect} 実{n}", file=sys.stderr)
        sys.exit(f"ABORT: {len(fail)} 件の出現数が期待と不一致")

    # 適用
    for label, old, new, expect, _ in MANIFEST:
        text = text.replace(old, new)

    # Python 構文保証
    try:
        ast.parse(text)
    except SyntaxError as e:
        sys.exit(f"ABORT: 適用結果が Python 構文エラー: {e}")

    # 出力
    with open(DST, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"=== 書き込み完了: {DST} ===")

    # 副産物: archive 保全
    legacy_body = LEGACY_HEADER + "GEMINI_STABILIZATION_LEGACY = " + repr(W1_PART7_OLD) + "\n"
    os.makedirs(os.path.dirname(LEGACY_DST), exist_ok=True)
    with open(LEGACY_DST, "w", encoding="utf-8") as f:
        f.write(legacy_body)
    print(f"=== legacy 保全ファイル: {LEGACY_DST} ===")


if __name__ == "__main__":
    main()
