# -*- coding: utf-8 -*-
"""
apply_v3_5.py — master_prompt_design_guide v3.4 → v3.5 決定論パッチ

M-15 wave: テンプレ D / H / J を {STRATEGY_BLOCK} 構造化。
v2.4 改訂で demonstrative G について「複数戦略を全部書くと画像生成器が
混乱する」と認定して {MODEL_TYPE_BLOCK} で 1 つだけ展開する構造に修正した
教訓を D / H / J にも適用する。

変更内容:
  §1. テンプレ D 本文の [STRATEGY: OBJECT_ALONE] / [STRATEGY: HAND_HOLDING]
      並置を {STRATEGY_BLOCK} 1 個に置換。
  §2. テンプレ H 本文の 5 戦略 (MOTION_ARROW / OUTCOME / BEFORE_AFTER /
      SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES) 並置を {STRATEGY_BLOCK} に置換。
  §3. テンプレ J 本文の 3 戦略 (PAIR_CONTRAST / SINGLE_HIGHLIGHT /
      PROPERTY_OVERLAY) 並置を {STRATEGY_BLOCK} に置換。
  §4. 新規 PART 4.10 OBJECT_STRATEGIES / 4.11 ACTION_VERB_STRATEGIES /
      4.12 ADJECTIVE_STRATEGIES を辞書として追加。各戦略の本文は v3.4
      テンプレ本文から逐語移植 (semantic-preserving)。
  §5. HOW_TO_USE Step 3-C/D / Step 5-D / Step 6.5-C を更新し、
      {STRATEGY_BLOCK} の出所を新 PART に向ける。
  §6. PART 8.5 PLACEHOLDER ORIGINS の {STRATEGY_BLOCK} 行を「予定」→
      「実装済」に書換。

build_prompts.py の戦略選択ロジック (D/H/J を実際に描画するロジック) は
Phase 4 ② で vocab_type=concrete_object / action_verb / adjective を追加する
際に同期実装する。本 v3.5 パッチではガイド側の構造変更のみ。lesson01 は
依然 vocab_type=person 12 件のみで構成されるため、テンプレ D/H/J の構造変更
は invariants C に影響しない。

入力: prompts/master_prompt_design_guide_v3_4.py (hash 738af3e76983)
出力: prompts/master_prompt_design_guide_v3_5.py
"""
import ast
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_4.py")
DST = os.path.join(ROOT, "prompts", "master_prompt_design_guide_v3_5.py")

L = lambda *xs: "\n".join(xs)


# ─────────────────────────────────────────────────────────────
# ヘッダー更新
# ─────────────────────────────────────────────────────────────
H_OLD = "# Version 3.4 | 2026-05-20 (= v3.3 + 残り個別修正 + M-7 wave 補助辞書キー正規化。全変更=apply_v3_4.py のみ)"
H_NEW = L(
    "# Version 3.5 | 2026-05-20 (= v3.4 + M-15 wave: テンプレ D/H/J を {STRATEGY_BLOCK} 構造化。全変更=apply_v3_5.py のみ)",
    "#   M-15 wave: D/H/J 本文の戦略並置を {STRATEGY_BLOCK} 1 個に置換し、",
    "#              新規 PART 4.10 OBJECT_STRATEGIES / 4.11 ACTION_VERB_STRATEGIES /",
    "#              4.12 ADJECTIVE_STRATEGIES を辞書として分離（G の DEMONSTRATIVE_MODELS と同様）。",
    "#              build_prompts.py の戦略展開ロジックは Phase 4 ② で同期実装。",
    "# Version 3.4 | 2026-05-20 (= v3.3 + 残り個別修正 + M-7 wave 補助辞書キー正規化。全変更=apply_v3_4.py のみ)",
)


# ─────────────────────────────────────────────────────────────
# 改訂履歴 v3.5 セクションを v3.4 セクションの直前に挿入
# ─────────────────────────────────────────────────────────────
REV_OLD = '''## ============================================================
## 改訂履歴
## ============================================================
##
## ────────────────────────────────────────────────────────────
## v3.4 (2026-05-20): v3.3 deferred + M-7 wave 補助辞書キー正規化'''
REV_NEW = '''## ============================================================
## 改訂履歴
## ============================================================
##
## ────────────────────────────────────────────────────────────
## v3.5 (2026-05-20): M-15 wave — テンプレ D/H/J を {STRATEGY_BLOCK} 構造化
## ────────────────────────────────────────────────────────────
##
## 背景: v2.4 改訂で demonstrative G について「複数戦略を全部書くと画像生成器が
##   混乱する」と認定して {MODEL_TYPE_BLOCK} で 1 つだけ展開する構造に修正した
##   教訓が、D / H / J には未適用だった。本 v3.5 で同型の構造化を実施。
##
## §1. テンプレ D 本文の [STRATEGY: OBJECT_ALONE] / [STRATEGY: HAND_HOLDING]
##     並置を {STRATEGY_BLOCK} 1 個に置換。戦略定義は新規 PART 4.10
##     OBJECT_STRATEGIES に分離。
## §2. テンプレ H 本文の 5 戦略 (MOTION_ARROW / OUTCOME / BEFORE_AFTER /
##     SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES) 並置を {STRATEGY_BLOCK} に置換。
##     戦略定義は新規 PART 4.11 ACTION_VERB_STRATEGIES に分離。
## §3. テンプレ J 本文の 3 戦略 (PAIR_CONTRAST / SINGLE_HIGHLIGHT /
##     PROPERTY_OVERLAY) 並置を {STRATEGY_BLOCK} に置換。戦略定義は新規 PART
##     4.12 ADJECTIVE_STRATEGIES に分離。
## §4. HOW_TO_USE Step 3-C / Step 5-D / Step 6.5-C を更新し、{STRATEGY_BLOCK}
##     の出所を新 PART に向ける。PART 8.5 PLACEHOLDER ORIGINS も同期。
## §5. build_prompts.py の戦略展開ロジックは Phase 4 ② で vocab_type=
##     concrete_object / action_verb / adjective を実装する際に同期追加する。
##     本 v3.5 ではガイド側の構造変更のみ。lesson01 は依然 person 12 件のみで
##     構成されるため invariants C 不変条件には影響しない。
##
## ────────────────────────────────────────────────────────────
## v3.4 (2026-05-20): v3.3 deferred + M-7 wave 補助辞書キー正規化'''


# ─────────────────────────────────────────────────────────────
# §1. テンプレ D 本文の戦略並置を {STRATEGY_BLOCK} に置換
# ─────────────────────────────────────────────────────────────
D_OLD = '''[SCENE & ACTION]
Display strategy: {DISPLAY_STRATEGY}
(Choose ONE of the strategies defined below. Default = "OBJECT_ALONE".)

[STRATEGY: OBJECT_ALONE]  ← Default
  The object is centered and fills 70-80% of the image.
  Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.
  This angle reveals the top surface AND one side face simultaneously.
  Exception: use straight front-facing ONLY if {FRONT_FACING_EXCEPTION} applies.
  Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional objects or context scene.

[STRATEGY: HAND_HOLDING]  ← Use when scale or embodied use matters
  The object is being held in a simple flat-vector hand (or pair of hands).
  Educational purpose:
    (1) Embodied cognition — showing the object in actual use reinforces meaning.
    (2) Scale fixation — the hand provides immediate, intuitive size reference
        (useful for 「ケータイ」「財布」「鍵」「コップ」など手のひらサイズの物体).
  Hand rendering rules (CRITICAL — AI image generators frequently fail at hands):
    - Render the hand as a SIMPLIFIED schematic shape, NOT a realistic anatomical hand.
    - Show only the cropped silhouette of the hand: palm + 3-4 visible finger shapes.
    - Use a single flat skin tone (warm medium) with consistent outline weight.
    - DO NOT attempt to render the entire arm, wrist details, knuckles, nails, or veins.
    - Crop the hand at the wrist or mid-forearm to keep the composition minimal.
    - If generating fails (extra fingers, malformed joints), fall back to OBJECT_ALONE.
  Composition:
    - The object occupies 60-65% of the frame; the hand occupies 15-20%; the rest is negative space.
    - The hand enters from the bottom or bottom-side of the frame, not from above.
    - Camera angle: canonical 3/4 view (30-45° above the object).
  Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional context scene.

Iconization level: Detailed Flat (level 3).'''
D_NEW = '''[SCENE & ACTION]
Display strategy: {DISPLAY_STRATEGY}
   (Choose EXACTLY ONE of: OBJECT_ALONE / HAND_HOLDING. Default = "OBJECT_ALONE".)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 4.10 OBJECT_STRATEGIES corresponding to {DISPLAY_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Iconization level: Detailed Flat (level 3).'''


# ─────────────────────────────────────────────────────────────
# §2. テンプレ H 本文の 5 戦略並置を {STRATEGY_BLOCK} に置換
# ─────────────────────────────────────────────────────────────
H_OLD_BODY = '''[SCENE & ACTION]
Visualization strategy: {VISUALIZATION_STRATEGY}
(Choose ONE of the strategies below.)

[STRATEGY: MOTION_ARROW]
  Show the character mid-action. Add a clear directional arrow (see ARROW_SEMIOTICS) indicating
  the path or direction of the action. The arrow color: warm amber gold or symbol_red (use educational_symbol_colors.symbol_red).
  The action must be at its peak moment — not before or after.

[STRATEGY: OUTCOME]
  Show the result of the action rather than the motion itself.
  Example for 「買う」: character holding shopping bag, cash register visible in background.
  Example for 「食べる」: character with chopsticks raised, bowl of food in front.
  The outcome must make the action verb unmistakable.

[STRATEGY: BEFORE_AFTER]
  Divide the image into two equal panels (left = before, right = after).
  Left panel: the state before the action.
  Right panel: the result after the action is completed.
  Use a thin dividing line between panels.
  Both panels share the same character, background color, and art style.
  A small rightward arrow between panels indicates time progression.
  Best for binary-state verbs: 切る・壊す・着る・脱ぐ・開ける・閉める etc.

[STRATEGY: SEQUENCE_3PANEL]  ← v2.4 新規
  Divide the image into three equal panels (left = beginning, middle = action peak, right = result).
  Left panel  (始まり): The initial state before the action starts. Character stands ready,
                       or the workspace/material is in its untouched state.
  Middle panel (中間):  The action at its peak with clear motion indicators
                       (motion lines, directional arrows, dynamic posture).
  Right panel  (終わり): The completed state showing the action's outcome.
  Use thin dividing lines between panels (deep slate navy, 1pt weight).
  Small rightward arrows between panels indicate time progression
  (place between left↔middle and between middle↔right).
  All three panels share the same character, background color, and art style.
  Best for THREE-PHASE verbs that have a clear start→peak→outcome structure:
    - 作る (make):   empty workspace / ingredients → assembling / mixing → completed product
    - 直す (fix):    broken object → repairing in progress → repaired object
    - 教える (teach): student looking puzzled → teacher explaining → student understanding
    - 準備する:      materials gathered → arranging → ready state
  Each panel occupies approximately 33% of the frame width.
  Iconization level: level_2_flat_design (avoid level_3 detail so the 3-panel
  layout doesn't become visually crowded).

[STRATEGY: SYMBOLIC_MOTION_LINES]
  Add motion lines (速度線) radiating from the moving part of the body or object.
  Motion lines are flat, vector-style — parallel curved or straight strokes in the
  direction of movement. Color: cool slate gray.

Camera: Eye-level, 50mm lens equivalent. Character and action fill 70% of frame.'''
H_NEW_BODY = '''[SCENE & ACTION]
Visualization strategy: {VISUALIZATION_STRATEGY}
   (Choose EXACTLY ONE of: MOTION_ARROW / OUTCOME / BEFORE_AFTER /
    SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES.)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 4.11 ACTION_VERB_STRATEGIES corresponding to {VISUALIZATION_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Camera: Eye-level, 50mm lens equivalent. Character and action fill 70% of frame.'''


# ─────────────────────────────────────────────────────────────
# §3. テンプレ J 本文の 3 戦略並置を {STRATEGY_BLOCK} に置換
# ─────────────────────────────────────────────────────────────
J_OLD_BODY = '''[SCENE & ACTION]
Visualization strategy: {ADJECTIVE_STRATEGY}
(Choose ONE of the strategies below.)

[STRATEGY: PAIR_CONTRAST]  ← Default for most adjectives
  Two side-by-side panels showing the same object class in two contrasting states.
  Left panel:  the CONTRASTING (opposite) state — rendered in muted neutral tone
               (cool slate gray outline + desaturated fill).
  Right panel: the TARGET state (the adjective being taught) — rendered with
               full color palette and slight emphasis (size, brightness, or accent).
  Use a thin dividing line between panels (deep slate navy, 1pt weight).
  Both panels use the same camera angle, same object orientation, same scale of the panel itself.
  Examples:
    - 大きい: small ball (gray, ~25% of panel) | large ball (amber, ~75% of panel)
    - 新しい: old worn book (muted) | new shiny book (full color + subtle shine marks)
    - きれい: cluttered desk (gray) | clean tidy desk (full color)
    - 高い (expensive): plain item (gray) | premium item with simple ornament (amber accent)
  Each panel occupies 50% of the frame.

[STRATEGY: SINGLE_HIGHLIGHT]  ← Use when contrast pair is awkward
  A single object that strongly embodies the adjective quality.
  The defining quality is visually exaggerated:
    - For 大きい: oversized version of a familiar object (ball, cup) filling the frame.
    - For きれい: object rendered with subtle "sparkle" marks (3-5 small 4-pointed
      amber stars near the object — NOT realistic shine, just symbolic).
    - For 新しい: object rendered with crisp clean lines, slight shine highlight as
      a single short flat line on a corner.
    - For 古い: object rendered with subtle wrinkle marks, slight color desaturation,
      a small worn spot indicated by a curved line.
  The object fills 70-80% of the frame. Solid soft cream off-white background (warm off-white, NOT pure stark white).
  DO NOT rely on a character's facial expression to convey the quality —
  use the object's own appearance and symbolic marks only.

[STRATEGY: PROPERTY_OVERLAY]  ← Use for invisible qualities
  Single object with a symbolic property indicator overlaid.
  Property indicators are flat symbolic marks, NOT photoreal effects:
    - Warm (温かい):  3-5 short curved wavy lines rising upward in amber, above the object.
    - Cold (寒い):    3-5 small angular flake-like shapes in cool blue, around the object.
    - Heavy (重い):   3-5 short downward arrows in slate gray, below the object.
    - Light (軽い):   3-5 short upward dotted-line marks in amber, around the object.
  Keep overlay marks small and minimal — they should clarify the quality without
  competing visually with the anchor object.
  Object fills 65-70% of the frame. Solid soft cream off-white background (warm off-white, NOT pure stark white).

Camera: Eye-level or canonical 3/4 view depending on the anchor object's nature.'''
J_NEW_BODY = '''[SCENE & ACTION]
Visualization strategy: {ADJECTIVE_STRATEGY}
   (Choose EXACTLY ONE of: PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY.
    Default = "PAIR_CONTRAST".)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 4.12 ADJECTIVE_STRATEGIES corresponding to {ADJECTIVE_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Camera: Eye-level or canonical 3/4 view depending on the anchor object's nature.'''


# ─────────────────────────────────────────────────────────────
# §4. 新規 PART 4.10 / 4.11 / 4.12 を PART 4.9 と PART 5 の間に挿入
# ─────────────────────────────────────────────────────────────
INSERT_OLD = '''  "psychological_pull": """
[MODEL TYPE: PSYCHOLOGICAL PULL (心理的引き込み)]
Show the speaker's こ territory as a soft elliptical shape around the speaker.
Then show the ellipse STRETCHING and deforming toward the target object as if the
speaker were pulling it into their territory.
The speaker leans forward or extends one hand toward the object in a protective
or possessive gesture.
Use the speaker's accent color (muted warm blue) to highlight BOTH the stretched
territory AND the target object — this color binding shows psychological ownership.
The listener is omitted from this model (single-speaker focus).
"""
}


## ============================================================
## PART 5: VISUAL SYMBOLS（視覚的慣習シンボル一覧）'''

INSERT_NEW = '''  "psychological_pull": """
[MODEL TYPE: PSYCHOLOGICAL PULL (心理的引き込み)]
Show the speaker's こ territory as a soft elliptical shape around the speaker.
Then show the ellipse STRETCHING and deforming toward the target object as if the
speaker were pulling it into their territory.
The speaker leans forward or extends one hand toward the object in a protective
or possessive gesture.
Use the speaker's accent color (muted warm blue) to highlight BOTH the stretched
territory AND the target object — this color binding shows psychological ownership.
The listener is omitted from this model (single-speaker focus).
"""
}


## ============================================================
## PART 4.10: OBJECT STRATEGIES（具体物テンプレ D 用の戦略定義）
## ============================================================
##
## v3.5 (M-15 wave) 新規追加。
##
## テンプレートD（vocabulary_object_concrete）で使用する 2 つの display
## strategy をここに分離した。テンプレートDの {STRATEGY_BLOCK} には、以下の
## いずれか 1 つの値をプロンプト生成時にコピーして埋め込む。
##
## ⚠ 重要: 同一プロンプト内に複数の戦略を書かないこと。画像生成器が混乱する
##   （v2.4 改訂で demonstrative G について確立された運用ルール）。
##
## 戦略選択ガイド（HOW_TO_USE Step 3-D も参照）:
##   - OBJECT_ALONE (デフォルト):
##       単独描画。スケール感の補強が不要な物体に。
##       大きすぎる物体（机・自転車・冷蔵庫 等）は必ずこちら。
##   - HAND_HOLDING:
##       手で持って提示。スケール感（実際の大きさ）と「使う」イメージが
##       語彙理解に重要な、手のひらサイズの物体（ケータイ・財布・鍵・
##       コップ・本 等）。AI による手の生成が安定しない場合は
##       OBJECT_ALONE にフォールバック。
## ============================================================

OBJECT_STRATEGIES = {

  "OBJECT_ALONE": """
[STRATEGY: OBJECT_ALONE]
The object is centered and fills 70-80% of the image.
Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.
This angle reveals the top surface AND one side face simultaneously.
Exception: use straight front-facing ONLY if {FRONT_FACING_EXCEPTION} applies.
Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional objects or context scene.
""",

  "HAND_HOLDING": """
[STRATEGY: HAND_HOLDING]
The object is being held in a simple flat-vector hand (or pair of hands).
Educational purpose:
  (1) Embodied cognition — showing the object in actual use reinforces meaning.
  (2) Scale fixation — the hand provides immediate, intuitive size reference
      (useful for 「ケータイ」「財布」「鍵」「コップ」など手のひらサイズの物体).
Hand rendering rules (CRITICAL — AI image generators frequently fail at hands):
  - Render the hand as a SIMPLIFIED schematic shape, NOT a realistic anatomical hand.
  - Show only the cropped silhouette of the hand: palm + 3-4 visible finger shapes.
  - Use a single flat skin tone (warm medium) with consistent outline weight.
  - DO NOT attempt to render the entire arm, wrist details, knuckles, nails, or veins.
  - Crop the hand at the wrist or mid-forearm to keep the composition minimal.
  - If generating fails (extra fingers, malformed joints), fall back to OBJECT_ALONE.
Composition:
  - The object occupies 60-65% of the frame; the hand occupies 15-20%; the rest is negative space.
  - The hand enters from the bottom or bottom-side of the frame, not from above.
  - Camera angle: canonical 3/4 view (30-45° above the object).
Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional context scene.
"""
}


## ============================================================
## PART 4.11: ACTION VERB STRATEGIES（動作動詞テンプレ H 用の戦略定義）
## ============================================================
##
## v3.5 (M-15 wave) 新規追加。
##
## テンプレートH（action_verb）で使用する 5 つの visualization strategy を
## ここに分離した。テンプレートHの {STRATEGY_BLOCK} には、以下のいずれか
## 1 つの値をプロンプト生成時にコピーして埋め込む。
##
## ⚠ 重要: 同一プロンプト内に複数の戦略を書かないこと。
##
## 戦略選択ガイド（HOW_TO_USE Step 5-A / 5-B も参照）:
##   - MOTION_ARROW       → 方向性のある移動動詞（行く・来る・投げる 等）
##   - OUTCOME            → 結果が視覚的に明確な動詞（買う・食べる・飲む 等）
##   - BEFORE_AFTER       → 変化を伴う2状態動詞（切る・壊す・着る・開ける 等）
##   - SEQUENCE_3PANEL    → 3フェーズ動詞（作る・直す・教える・準備する 等）
##   - SYMBOLIC_MOTION_LINES → 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）
##
## M-71 連動: 「振り向く」等の CURVED_MOTION 系動詞は MOTION_ARROW +
##   ARROW_SEMIOTICS.curved_arc の組合せで表現する（curved_arc 単独戦略は無い）。
## ============================================================

ACTION_VERB_STRATEGIES = {

  "MOTION_ARROW": """
[STRATEGY: MOTION_ARROW]
Show the character mid-action. Add a clear directional arrow (see ARROW_SEMIOTICS) indicating
the path or direction of the action. The arrow color: warm amber gold or symbol_red (use educational_symbol_colors.symbol_red).
The action must be at its peak moment — not before or after.
""",

  "OUTCOME": """
[STRATEGY: OUTCOME]
Show the result of the action rather than the motion itself.
Example for 「買う」: character holding shopping bag, cash register visible in background.
Example for 「食べる」: character with chopsticks raised, bowl of food in front.
The outcome must make the action verb unmistakable.
""",

  "BEFORE_AFTER": """
[STRATEGY: BEFORE_AFTER]
Divide the image into two equal panels (left = before, right = after).
Left panel: the state before the action.
Right panel: the result after the action is completed.
Use a thin dividing line between panels.
Both panels share the same character, background color, and art style.
A small rightward arrow between panels indicates time progression.
Best for binary-state verbs: 切る・壊す・着る・脱ぐ・開ける・閉める etc.
""",

  "SEQUENCE_3PANEL": """
[STRATEGY: SEQUENCE_3PANEL]
Divide the image into three equal panels (left = beginning, middle = action peak, right = result).
Left panel  (始まり): The initial state before the action starts. Character stands ready,
                     or the workspace/material is in its untouched state.
Middle panel (中間):  The action at its peak with clear motion indicators
                     (motion lines, directional arrows, dynamic posture).
Right panel  (終わり): The completed state showing the action's outcome.
Use thin dividing lines between panels (deep slate navy, 1pt weight).
Small rightward arrows between panels indicate time progression
(place between left↔middle and between middle↔right).
All three panels share the same character, background color, and art style.
Best for THREE-PHASE verbs that have a clear start→peak→outcome structure:
  - 作る (make):   empty workspace / ingredients → assembling / mixing → completed product
  - 直す (fix):    broken object → repairing in progress → repaired object
  - 教える (teach): student looking puzzled → teacher explaining → student understanding
  - 準備する:      materials gathered → arranging → ready state
Each panel occupies approximately 33% of the frame width.
Iconization level: level_2_flat_design (avoid level_3 detail so the 3-panel
layout doesn't become visually crowded).
""",

  "SYMBOLIC_MOTION_LINES": """
[STRATEGY: SYMBOLIC_MOTION_LINES]
Add motion lines (速度線) radiating from the moving part of the body or object.
Motion lines are flat, vector-style — parallel curved or straight strokes in the
direction of movement. Color: cool slate gray.
"""
}


## ============================================================
## PART 4.12: ADJECTIVE STRATEGIES（形容詞テンプレ J 用の戦略定義）
## ============================================================
##
## v3.5 (M-15 wave) 新規追加。
##
## テンプレートJ（vocabulary_adjective）で使用する 3 つの visualization
## strategy をここに分離した。テンプレートJの {STRATEGY_BLOCK} には、以下の
## いずれか 1 つの値をプロンプト生成時にコピーして埋め込む。
##
## ⚠ 重要: 同一プロンプト内に複数の戦略を書かないこと。
##
## 戦略選択ガイド（HOW_TO_USE Step 6.5-B も参照）:
##   - PAIR_CONTRAST (デフォルト):
##       対立する性質との並置（左:対比 / 右:ターゲット）。
##       対義語のペアが明確にある形容詞に最適（大きい/小さい・新しい/古い 等）。
##   - SINGLE_HIGHLIGHT:
##       ターゲットの性質を強調した単独描画。
##       対義語が描きにくい・対比が冗長になる時に。
##   - PROPERTY_OVERLAY:
##       不可視の性質を記号オーバーレイで表現。
##       温度・重さなど物理的に見えない性質に。
## ============================================================

ADJECTIVE_STRATEGIES = {

  "PAIR_CONTRAST": """
[STRATEGY: PAIR_CONTRAST]
Two side-by-side panels showing the same object class in two contrasting states.
Left panel:  the CONTRASTING (opposite) state — rendered in muted neutral tone
             (cool slate gray outline + desaturated fill).
Right panel: the TARGET state (the adjective being taught) — rendered with
             full color palette and slight emphasis (size, brightness, or accent).
Use a thin dividing line between panels (deep slate navy, 1pt weight).
Both panels use the same camera angle, same object orientation, same scale of the panel itself.
Examples:
  - 大きい: small ball (gray, ~25% of panel) | large ball (amber, ~75% of panel)
  - 新しい: old worn book (muted) | new shiny book (full color + subtle shine marks)
  - きれい: cluttered desk (gray) | clean tidy desk (full color)
  - 高い (expensive): plain item (gray) | premium item with simple ornament (amber accent)
Each panel occupies 50% of the frame.
""",

  "SINGLE_HIGHLIGHT": """
[STRATEGY: SINGLE_HIGHLIGHT]
A single object that strongly embodies the adjective quality.
The defining quality is visually exaggerated:
  - For 大きい: oversized version of a familiar object (ball, cup) filling the frame.
  - For きれい: object rendered with subtle "sparkle" marks (3-5 small 4-pointed
    amber stars near the object — NOT realistic shine, just symbolic).
  - For 新しい: object rendered with crisp clean lines, slight shine highlight as
    a single short flat line on a corner.
  - For 古い: object rendered with subtle wrinkle marks, slight color desaturation,
    a small worn spot indicated by a curved line.
The object fills 70-80% of the frame. Solid soft cream off-white background (warm off-white, NOT pure stark white).
DO NOT rely on a character's facial expression to convey the quality —
use the object's own appearance and symbolic marks only.
""",

  "PROPERTY_OVERLAY": """
[STRATEGY: PROPERTY_OVERLAY]
Single object with a symbolic property indicator overlaid.
Property indicators are flat symbolic marks, NOT photoreal effects:
  - Warm (温かい):  3-5 short curved wavy lines rising upward in amber, above the object.
  - Cold (寒い):    3-5 small angular flake-like shapes in cool blue, around the object.
  - Heavy (重い):   3-5 short downward arrows in slate gray, below the object.
  - Light (軽い):   3-5 short upward dotted-line marks in amber, around the object.
Keep overlay marks small and minimal — they should clarify the quality without
competing visually with the anchor object.
Object fills 65-70% of the frame. Solid soft cream off-white background (warm off-white, NOT pure stark white).
"""
}


## ============================================================
## PART 5: VISUAL SYMBOLS（視覚的慣習シンボル一覧）'''


# ─────────────────────────────────────────────────────────────
# §5. HOW_TO_USE Step 3-C 更新（{STRATEGY_BLOCK} 参照を新 PART 4.10 に向ける）
# ─────────────────────────────────────────────────────────────
STEP3C_OLD = '''  Step 3-C: テンプレートD（vocabulary_object_concrete）を使用
            → {VISUAL_SIGNATURE} に primary_signatures を転記
            → {MATERIAL_TEXTURE_HINT} に material_hints を転記
            → {DISPLAY_STRATEGY} を選択（v2.4 新規）:
              "OBJECT_ALONE"  → 単独描画（デフォルト）
              "HAND_HOLDING"  → 手で持つ描画（スケール固定・身体化認知）'''
STEP3C_NEW = '''  Step 3-C: テンプレートD（vocabulary_object_concrete）を使用
            → {VISUAL_SIGNATURE} に primary_signatures を転記
            → {MATERIAL_TEXTURE_HINT} に material_hints を転記
            → {DISPLAY_STRATEGY} を選択（v2.4 新規）:
              "OBJECT_ALONE"  → 単独描画（デフォルト）
              "HAND_HOLDING"  → 手で持つ描画（スケール固定・身体化認知）
            → v3.5 (M-15 wave): {STRATEGY_BLOCK} に PART 4.10 OBJECT_STRATEGIES
              の {DISPLAY_STRATEGY} 値（OBJECT_ALONE / HAND_HOLDING）に対応する
              ブロックをコピーして埋め込む。⚠ 複数戦略を混ぜないこと。'''


# ─────────────────────────────────────────────────────────────
# §5b. HOW_TO_USE Step 5-D 更新
# ─────────────────────────────────────────────────────────────
STEP5D_OLD = '''  Step 5-C: ARROW_SEMIOTICS から矢印タイプを選択
  Step 5-D: テンプレートH（action_verb）を使用
            → {VISUALIZATION_STRATEGY} に上記5戦略のいずれかを記入'''
STEP5D_NEW = '''  Step 5-C: ARROW_SEMIOTICS から矢印タイプを選択
  Step 5-D: テンプレートH（action_verb）を使用
            → {VISUALIZATION_STRATEGY} に上記5戦略のいずれかを記入
            → v3.5 (M-15 wave): {STRATEGY_BLOCK} に PART 4.11
              ACTION_VERB_STRATEGIES の {VISUALIZATION_STRATEGY} 値に対応する
              ブロックをコピーして埋め込む。⚠ 複数戦略を混ぜないこと。'''


# ─────────────────────────────────────────────────────────────
# §5c. HOW_TO_USE Step 6.5-C 更新
# ─────────────────────────────────────────────────────────────
STEP65C_OLD = '''  Step 6.5-C: テンプレートJ（vocabulary_adjective）を使用
              → {ADJECTIVE_CATEGORY} に分類を記入
              → {ANCHOR_OBJECTS} に対象物体を記入
              → {ADJECTIVE_STRATEGY} に選択した戦略名を記入'''
STEP65C_NEW = '''  Step 6.5-C: テンプレートJ（vocabulary_adjective）を使用
              → {ADJECTIVE_CATEGORY} に分類を記入
              → {ANCHOR_OBJECTS} に対象物体を記入
              → {ADJECTIVE_STRATEGY} に選択した戦略名を記入
              → v3.5 (M-15 wave): {STRATEGY_BLOCK} に PART 4.12
                ADJECTIVE_STRATEGIES の {ADJECTIVE_STRATEGY} 値（PAIR_CONTRAST
                / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY）に対応するブロックを
                コピーして埋め込む。⚠ 複数戦略を混ぜないこと。'''


# ─────────────────────────────────────────────────────────────
# §6. PART 8.5 PLACEHOLDER ORIGINS の {STRATEGY_BLOCK} 行を「予定」→「実装済」に
# ─────────────────────────────────────────────────────────────
PH_OLD = '''##   {STRATEGY_BLOCK}           = (v3.5 M-15 wave 予定) — テンプレ D/H/J 用の戦略ブロック'''
PH_NEW = '''##   {STRATEGY_BLOCK}           = OBJECT_STRATEGIES / ACTION_VERB_STRATEGIES /
##                                ADJECTIVE_STRATEGIES の該当値を転記（テンプレ
##                                D/H/J・v3.5 M-15 wave）'''


# ─────────────────────────────────────────────────────────────
# §7. HOW_TO_USE Step 5-A の SYMBOLIC_MOTION → SYMBOLIC_MOTION_LINES
#   v2.4 から潜在していた truncated 表記を canonical key に統一。
#   M-15 wave で {VISUALIZATION_STRATEGY} が PART 4.11 ACTION_VERB_STRATEGIES の
#   lookup key に昇格したため、ここでの誤記は lesson 設計者の lookup miss を
#   引き起こす（pre-existing bug を M-15 と同期コミットで解消）。
# ─────────────────────────────────────────────────────────────
S5A_OLD = '''    SYMBOLIC_MOTION    → 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）'''
S5A_NEW = '''    SYMBOLIC_MOTION_LINES → 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）'''


# ─────────────────────────────────────────────────────────────
# MANIFEST
# ─────────────────────────────────────────────────────────────
MANIFEST = [
    ("H  ヘッダ → v3.5",                                H_OLD,       H_NEW,       1),
    ("REV 改訂履歴 v3.5 セクション挿入",                REV_OLD,     REV_NEW,     1),
    ("M-15 §1 テンプレ D 本文 → {STRATEGY_BLOCK}",      D_OLD,       D_NEW,       1),
    ("M-15 §2 テンプレ H 本文 → {STRATEGY_BLOCK}",      H_OLD_BODY,  H_NEW_BODY,  1),
    ("M-15 §3 テンプレ J 本文 → {STRATEGY_BLOCK}",      J_OLD_BODY,  J_NEW_BODY,  1),
    ("M-15 §4 PART 4.10/4.11/4.12 新規挿入",            INSERT_OLD,  INSERT_NEW,  1),
    ("M-15 §5a HOW_TO_USE Step 3-C 更新",                STEP3C_OLD,  STEP3C_NEW,  1),
    ("M-15 §5b HOW_TO_USE Step 5-D 更新",                STEP5D_OLD,  STEP5D_NEW,  1),
    ("M-15 §5c HOW_TO_USE Step 6.5-C 更新",              STEP65C_OLD, STEP65C_NEW, 1),
    ("M-15 §6 PART 8.5 {STRATEGY_BLOCK} 行 実装済化",    PH_OLD,      PH_NEW,      1),
    ("M-15 §7 Step 5-A SYMBOLIC_MOTION_LINES 名称統一",  S5A_OLD,     S5A_NEW,     1),
]


def main():
    if not os.path.exists(SRC):
        sys.exit(f"ABORT: source ガイドが不在: {SRC}")
    text = open(SRC, encoding="utf-8").read()
    print(f"=== apply_v3_5.py 編集マニフェスト（{len(MANIFEST)} 件・件数アサート） ===")
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
