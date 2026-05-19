# 日本語教材イラスト生成 マスタープロンプト設計書
# Master Prompt Design Guide for Japanese Language Teaching Materials
# Version 2.3 | 2026-05-13 (語彙タイプ別視覚化戦略の体系化)

## ============================================================
## 改訂履歴
## ============================================================
##
## v1.0 (2026-05-04): 初版作成。
##
## v2.0 (2026-05-07): Double-Hex Anchoring / focal_length_standards /
##                    CHARACTER_PROFILES 6体追加 / FAMILY_TEMPLATES /
##                    5ブロック構造統一 / GEMINI_STABILIZATION 追加。
##
## v2.1 (2026-05-07): キャラクター階層化(Layer 1/2/3)導入。
##
## v2.2 (2026-05-11): Phase 1-F F-2 で固定キャラ概念を廃止。
##                    ROLE_BASED_GENERIC_PROFILES 新設。
##
## v2.3 (2026-05-13): 語彙タイプ別視覚化戦略の体系化。
##   背景: 3万枚超の辞書サービス・教材を同一パイプラインで量産する規模において、
##         再生成率の削減がコスト直結課題となった。根本原因はテンプレートの
##         「語彙タイプ別の視覚戦略欠如」であると診断。本改訂で解決する。
##   資料出典:
##     資料10「語学教育における生成AI画像プロンプト工学：語彙カテゴリー別視覚化戦略」
##     資料11「日常物体の視覚的識別性を極大化するフラットベクターイラストのプロンプト設計」
##     資料12「初級日本語教育における空間語彙・指示語の視覚的提示」
##   主な変更:
##   [PART 1] STYLE_BIBLE
##     - focal_length_standards を改訂:
##       語彙カード（人物・物体）のデフォルト視点を
##       "orthographic/front-facing" から
##       "canonical 3/4 view (30-45° angle)" に変更。
##       認知科学的根拠: カノニカル・パースペクティブが識別速度・正確性を最大化(資料11)。
##     - iconization_level_guide 新規追加:
##       4段階のアイコン化レベルと語彙タイプ別の推奨レベルを定義。
##   [PART 3] PROMPT_TEMPLATES
##     - テンプレートA(vocabulary_person): カノニカル視点・表情・姿勢の具体化指示を追加。
##     - テンプレートD(vocabulary_object_concrete) 新規: 具体物用。
##       カノニカル視点・素材記号・機能コンテキスト。
##     - テンプレートE(vocabulary_variant_grid) 新規: 複数バリエーション並置。
##       カテゴリ境界の明確化・インターリービング効果。
##     - テンプレートF(spatial_relation) 新規: 位置名詞用。
##       虫の視点・3×3グリッド・ハイライト対比。
##     - テンプレートG(demonstrative_kosoado) 新規: 指示語(こ・そ・あ)用。
##       なわばり理論・対面型/並行型構図。
##     - テンプレートH(action_verb) 新規: 動作語彙用。
##       矢印・モーションブラー・before/after 2コマ。
##     - テンプレートI(abstract_concept) 新規: 抽象概念用。
##       TIAC 3層構造(Intent/Object/Form)・メタファー。
##   [PART 4.5] OBJECT_SIGNATURES 新規:
##     物体カテゴリ別の視覚的シグネチャー辞書。
##     類似形状物体（雑誌・携帯・カード・財布 等）の誤認防止に使用。
##   [PART 4.6] SPATIAL_GRID_PATTERNS 新規:
##     空間構図パターン辞書。空間関係・指示語テンプレートで参照。
##   [PART 4.7] ARROW_SEMIOTICS 新規:
##     矢印の意味分類（4種）。動作・空間テンプレートで参照。
##   [PART 4.8] ABSTRACT_METAPHORS 新規:
##     抽象概念のメタファー辞書（N5〜N3 頻出語）。
##   [PART 5] VISUAL_SYMBOLS: 内容維持。
##   [PART 6] QA_CHECKLIST:
##     - vocab_type_check 新規追加: 語彙タイプ別の識別性チェック。
##     - mayer_principles_check 新規追加: メイヤー12原則の適合確認。
##     - regeneration_cost_check 改訂: 再生成防止の観点を明示。
##   [PART 7] GEMINI_STABILIZATION: 内容維持。
##     - production_rules の large_scale 定義を 3万枚超の量産規模に更新。
##   [PART 8] HOW_TO_USE:
##     - vocab_type 判定フローを追加。
##     - 各テンプレートの選択基準を更新。
##     - lesson_NN.json の vocab_type フィールド仕様を追記。
## ============================================================


## ============================================================
## このファイルの使い方
## ============================================================
##
## 全課共通のプロンプト設計ルールを定義したマスタードキュメント。
## 新しい課の image_prompts_lesson_X.json を作成する際は、
## 必ずこのファイルを参照してください。
##
## v2.3 の最重要変更点:
##   語彙は「タイプ」によって最適なプロンプト戦略が異なります。
##   lesson_NN.json の vocabulary[].vocab_type を確認し、
##   対応するテンプレート(A〜I)を選択してください。
##
##   vocab_type → テンプレート 対応表:
##     person          → A (vocabulary_person)
##     building        → B (vocabulary_building)
##     concrete_object → D (vocabulary_object_concrete)
##                       ※ 類似形状が多い場合は E(variant_grid) も検討
##     spatial_relation→ F (spatial_relation)
##     demonstrative   → G (demonstrative_kosoado)
##     action_verb     → H (action_verb)
##     abstract_concept→ I (abstract_concept)
##     ※ example_sentence は常に C
##
## 資料出典:
##   資料5:  キャラクター一貫性
##   資料6:  フラットベクタースタイル一貫性
##   資料7:  語学教材イラストのデザイン原則
##   資料8:  建物画像生成
##   資料9:  Gemini安定化テクニック
##   資料10: 語彙カテゴリー別視覚化戦略(v2.3 新規)
##   資料11: 物体語彙の識別性向上(v2.3 新規)
##   資料12: 空間語彙・指示語の視覚的提示(v2.3 新規)
## ============================================================


## ============================================================
## PART 1: STYLE BIBLE（全画像に必ず埋め込む固定フレーズ）
## ============================================================
##
## 資料6より: スタイル固定フレーズは5〜7トークン以内に収め、
## プロジェクト完了まで一言一句変えずに使用すること。
## 同義語の言い換えはスタイルドリフトの原因になる。
##
## 資料9より: 色は色名+#HEX+hex value の三重指定で安定化
##            (Double-Hex Anchoring)。
## 資料11より: カノニカル・パースペクティブ(斜め上30-45度)が
##             識別速度・正確性を最大化する。v2.3 で反映。
## ============================================================

STYLE_BIBLE = {

  ## 全画像共通の固定フレーズ（変更厳禁）
  "core_style": "Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.",

  ## カラーパレット（大人・混合クラス向け）
  ## 理由: 資料7より、大人向けは落ち着いたミュートカラーが認知負荷を下げる
  ## v2: Double-Hex Anchoring 厳密版（色名 + similar to #HEX + hex value 三重指定）
  "color_palette": {
    "background":  "Soft cream white, similar to #FBFBFB, hex value FBFBFB",
    "outline":     "Deep slate navy, similar to #1B2C40, hex value 1B2C40",
    "main_color":  "Muted warm blue, similar to #4A7FB5, hex value 4A7FB5",
    "accent":      "Warm amber gold, similar to #FAD141, hex value FAD141",
    "sub_color":   "Cool slate gray, similar to #6B7C85, hex value 6B7C85",
    "skin_tones":  "Naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults",
    "note": "Double-Hex Anchoring(資料9 1節): 色名 + similar to #HEX + hex value の三重指定で色ブレを最大限防止。"
  },

  ## 焦点距離標準化（v2.3 改訂）
  ## 資料11より: カノニカル・パースペクティブ（斜め上30-45度）が
  ##             最短の反応時間と最高の認識精度を記録する。
  ##             v2.2 の "orthographic projection acceptable" は
  ##             正面固定の印象を与えるため削除し、canonical 3/4 に変更。
  "focal_length_standards": {
    "vocabulary_card_focal_length":
      "85mm portrait lens equivalent. "
      "DEFAULT VIEW: canonical 3/4 perspective — camera positioned 30-45 degrees above and "
      "slightly to the side of the subject. This angle reveals both the front face and one side "
      "of the object/character simultaneously, maximizing visual recognition speed. "
      "Exception: use straight front-facing (0°) ONLY when the front face alone is the definitive "
      "identifier (e.g. a clock face, a screen, a signage board).",
    "example_image_focal_length":
      "50mm standard lens equivalent, natural perspective close to human field of view",
    "building_image_focal_length":
      "35mm wide-angle lens equivalent, slight three-quarter front angle at eye level",
    "occupancy_percentages": {
      "vocabulary_card":   "Subject occupies 70-80% of the frame",
      "example_image":     "Characters occupy 60% of the frame",
      "building_image":    "Building occupies 70% of the frame, with negative space in the top third for typography",
      "spatial_relation":  "Reference object (基準物) occupies 40-50% of the frame; target object clearly visible in relation",
      "action_verb":       "Action occupies 70% of the frame; motion direction clearly readable",
      "variant_grid":      "Each variant tile occupies equal space in a 2×2 or 1×N grid layout"
    },
    "note": "資料11: カノニカル視点の認知的根拠 — 斜め上30-45度から物体を見ると上面と側面の両方が見え、三次元構造・重要なパーツ（取っ手・ボタン・折り目等）を一瞬で把握できる。真正面や真上からの視点より識別速度・正確性が統計的に高い。"
  },

  ## アイコン化レベルガイド（v2.3 新規）
  ## 資料11より: 4段階のアイコン化レベルと語彙タイプ別の推奨を定義。
  ## 「スイートスポット」は Detailed Flat（具象的フラット）。
  "iconization_level_guide": {
    "level_1_abstract_icon": {
      "description": "単純な幾何学的形状のみ。細部なし。",
      "when_to_use":  "UIナビゲーション・熟練者向け概念アイコン",
      "vocab_types":  ["NOT recommended for vocabulary cards"]
    },
    "level_2_flat_design": {
      "description": "最小限の装飾・明確な色面・細部は簡略化。",
      "when_to_use":  "人物の汎用シーン・家族・役割描写",
      "vocab_types":  ["person", "building"]
    },
    "level_3_detailed_flat": {
      "description": "ステッチ・光沢線・素材記号など識別シグネチャーを含む。"
                     "グラデーションは使わないが、記号的なテクスチャヒントは許容。",
      "when_to_use":  "RECOMMENDED FOR MOST VOCABULARY CARDS — 具体物・日常物体",
      "vocab_types":  ["concrete_object", "abstract_concept", "action_verb"]
    },
    "level_4_realistic": {
      "description": "精密なテクスチャ・照明効果。",
      "when_to_use":  "本プロジェクトでは使用しない（フラットベクター原則に反する）",
      "vocab_types":  ["NOT used in this project"]
    },
    "note": "資料11: 認知負荷が最も低く識別精度が高い「スイートスポット」は level_3_detailed_flat。"
            "完全なフラット(level_2)は質感の欠如により類似物体の混同リスクがある。"
  },

  ## 語彙カード（1:1）専用スタイル
  "vocabulary_card_style":
    "Solid white background. Single centered subject only. "
    "Full-body shot for characters, canonical 3/4 view for objects and characters. "
    "No background elements, no secondary objects. The subject must fill 70-80% of the frame.",

  ## 例文画像（16:9）専用スタイル
  "example_image_style":
    "Clean minimal background with only essential context. "
    "Characters take up the majority of the frame. "
    "Eye-level front or slight three-quarter view. "
    "Straight vertical lines for buildings. Soft natural indoor or outdoor daylight.",

  ## 全画像共通の制約（最後に必ず追加）
  "constraints":
    "No text, no letters, no numbers, no symbols inside the image.",

  ## プロンプト末尾に付ける「ブランド宣言文」（資料6より）
  "brand_declaration":
    "Keep line weights consistent. Generate as if this is part of a unified educational brand style guide."
}


## ============================================================
## PART 2: CHARACTER PROFILES（汎用キャラの外見定義）
## ============================================================
## ※ v2.2 から変更なし。詳細はv2.2コメントを参照。
## ============================================================

CHARACTER_PROFILES = {

  "generic_male_adult": {
    "role": "男の人（汎用成人男性）",
    "layer": "generic",
    "gender": "male",
    "age_range": "30s",
    "fixed_features": {
      "face":   "pleasant approachable face with dark eyes and a relaxed friendly smile",
      "hair":   "short neat dark brown hair",
      "skin":   "warm medium skin tone",
      "outfit": "casual everyday clothes — simple shirt and trousers",
      "build":  "average height and build"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression"],
    "notes": "「男の人」の語彙カードや汎用シーンで使用。"
  },

  "generic_female_adult": {
    "role": "女の人（汎用成人女性）",
    "layer": "generic",
    "gender": "female",
    "age_range": "30s",
    "fixed_features": {
      "face":   "warm friendly face with dark brown eyes and a natural gentle smile",
      "hair":   "medium length dark brown hair worn loose",
      "skin":   "warm medium skin tone",
      "outfit": "casual everyday clothes — simple blouse and trousers",
      "build":  "average height and build"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression"],
    "notes": "「女の人」の語彙カードや汎用シーンで使用。"
  },

  "generic_boy": {
    "role": "男の子（汎用子ども）",
    "layer": "generic",
    "gender": "male",
    "age_range": "8-10 (elementary school age)",
    "fixed_features": {
      "face":   "round cheerful face with big bright dark eyes and a wide playful smile",
      "hair":   "short slightly messy black hair",
      "skin":   "warm medium skin tone",
      "outfit": "casual children's clothes — simple t-shirt and shorts, sneakers",
      "build":  "small child proportions, head approximately 1/5 of total body height"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "items held (backpack/randoseru, ball, pencil, books)"],
    "notes": "「子ども」「男の子」「学校」「家族」関連で使用。"
  },

  "generic_girl": {
    "role": "女の子（汎用子ども）",
    "layer": "generic",
    "gender": "female",
    "age_range": "8-10 (elementary school age)",
    "fixed_features": {
      "face":   "round cheerful face with big bright dark eyes and a sweet playful smile",
      "hair":   "shoulder-length dark brown hair, often tied in two pigtails or worn loose",
      "skin":   "warm medium skin tone",
      "outfit": "casual children's clothes — simple t-shirt or blouse with skirt or shorts, sneakers",
      "build":  "small child proportions, head approximately 1/5 of total body height"
    },
    "allowed_changes": ["scene", "pose", "hair style (loose / pigtails / one ponytail)",
                        "specific clothes color", "expression", "items held"],
    "notes": "「子ども」「女の子」「学校」「家族」関連で使用。"
  },

  "generic_male_middle": {
    "role": "中年男性（汎用・父親世代）",
    "layer": "generic",
    "gender": "male",
    "age_range": "40s-50s",
    "fixed_features": {
      "face":   "calm reliable face with dark eyes, mild smile lines around the eyes, and a steady warm expression",
      "hair":   "short neat dark brown or black hair, slight gray at the temples",
      "skin":   "warm medium skin tone",
      "outfit": "casual smart everyday clothes — collared shirt or simple sweater with trousers",
      "build":  "average height, slightly fuller build than generic_male_adult"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "glasses on/off"],
    "notes": "「お父さん」「中年男性」関連で使用。"
  },

  "generic_female_middle": {
    "role": "中年女性（汎用・母親世代）",
    "layer": "generic",
    "gender": "female",
    "age_range": "40s-50s",
    "fixed_features": {
      "face":   "warm caring face with dark brown eyes, mild smile lines, and a gentle expression",
      "hair":   "medium length dark brown hair, often tied back or worn in a soft layered style, slight gray strands acceptable",
      "skin":   "warm medium skin tone",
      "outfit": "casual smart everyday clothes — simple blouse with trousers or modest skirt",
      "build":  "average height, slightly fuller build than generic_female_adult"
    },
    "allowed_changes": ["scene", "pose", "hair style (tied back / loose)",
                        "specific clothes color", "expression"],
    "notes": "「お母さん」「中年女性」関連で使用。"
  },

  "generic_male_senior": {
    "role": "高齢男性（汎用・おじいさん）",
    "layer": "generic",
    "gender": "male",
    "age_range": "60s-70s",
    "fixed_features": {
      "face":   "kind weathered face with gentle dark eyes, visible smile lines, and a peaceful warm expression",
      "hair":   "short neat fully gray or white hair, sometimes thinning slightly",
      "skin":   "warm medium skin tone with natural age signs",
      "outfit": "comfortable everyday clothes — collared shirt with simple cardigan or vest, relaxed trousers",
      "build":  "slightly shorter and slimmer build than younger adults, gentle posture"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "glasses on/off", "walking stick or cane present"],
    "notes": "「おじいさん」「祖父」関連で使用。"
  },

  "generic_female_senior": {
    "role": "高齢女性（汎用・おばあさん）",
    "layer": "generic",
    "gender": "female",
    "age_range": "60s-70s",
    "fixed_features": {
      "face":   "kind warm face with gentle dark eyes, visible smile lines, and a peaceful caring expression",
      "hair":   "short or medium-length fully gray or white hair, often worn in a neat style",
      "skin":   "warm medium skin tone with natural age signs",
      "outfit": "comfortable everyday clothes — simple blouse with cardigan and modest trousers or long skirt",
      "build":  "slightly shorter and slimmer build than younger adults, gentle posture"
    },
    "allowed_changes": ["scene", "pose", "hair style (loose / tied back)",
                        "specific clothes color", "expression", "glasses on/off"],
    "notes": "「おばあさん」「祖母」関連で使用。"
  },
}


## ============================================================
## PART 2.2: ROLE_BASED_GENERIC_PROFILES（役割ベースの汎用人物プロファイル）
## ============================================================
## ※ v2.2 から変更なし。
## ============================================================

ROLE_BASED_GENERIC_PROFILES = {

  "teacher": {
    "role_ja": "先生",
    "role_en": "teacher",
    "outfit_hints": [
      "professional but approachable — blouse / shirt with simple cardigan or jacket",
      "muted color palette (white / muted blue / soft gray / beige)",
      "may carry a textbook, marker, or pointer"
    ],
    "scene_hints": [
      "in front of a whiteboard or blackboard",
      "at a desk with books and papers",
      "interacting with students"
    ],
    "lesson_appearances": "lesson_01 (p1 「先生」語彙)"
  },

  "company_employee": {
    "role_ja": "会社員",
    "role_en": "company employee / office worker",
    "outfit_hints": [
      "navy blue or charcoal gray business suit",
      "white shirt or blouse with a simple necktie or scarf",
      "may carry a briefcase, laptop bag, or documents",
      "small wristwatch acceptable"
    ],
    "scene_hints": [
      "in front of an office building or company entrance",
      "at a desk with a laptop and documents",
      "walking with a briefcase on a city sidewalk"
    ],
    "lesson_appearances": "lesson_01 (p3 例文)"
  },

  "student": {
    "role_ja": "学生",
    "role_en": "university or language school student",
    "outfit_hints": [
      "casual smart clothes — jeans or slacks with a simple top",
      "may carry a backpack, notebook, or textbook",
      "no formal business attire"
    ],
    "scene_hints": [
      "in a classroom or study space",
      "on a university campus",
      "reading or taking notes"
    ],
    "lesson_appearances": "lesson_01 (p1 「学生」語彙)"
  },

  "doctor": {
    "role_ja": "医者",
    "role_en": "doctor",
    "outfit_hints": [
      "white doctor's coat (open at the front) over a simple blouse or shirt",
      "stethoscope around the neck",
      "name badge clipped to the coat (no specific name written)",
      "may carry a clipboard, otoscope, or pen"
    ],
    "scene_hints": [
      "in a clinic or hospital room with examination table",
      "at a desk with medical chart",
      "in front of a hospital building"
    ],
    "lesson_appearances": "lesson_01 (p1 「医者」語彙)"
  },

  "foreigner": {
    "role_ja": "外国人",
    "role_en": "foreigner / non-Japanese person",
    "outfit_hints": [
      "casual or smart casual clothes — blouse, shirt, simple top with trousers or skirt",
      "may carry a phrasebook, language textbook, or notebook"
    ],
    "scene_hints": [
      "in a Japanese language classroom",
      "introducing oneself with a smile",
      "in a public space (station, store) interacting with Japanese people"
    ],
    "lesson_appearances": "lesson_01 (p1 「外国人」語彙)",
    "notes": "肌色・髪色・目の色は意図的に多様化させる。特定国籍を示唆するステレオタイプ的装飾は避ける。"
  }
}


## ============================================================
## PART 2.5: FAMILY TEMPLATES（家族構成テンプレート）
## ============================================================
## ※ v2.2 から変更なし。
## ============================================================

FAMILY_TEMPLATES = {

  "standard_three_generation_family": {
    "description": "祖父母・両親・子ども2人の3世代6人家族。",
    "members": {
      "grandfather":   "generic_male_senior",
      "grandmother":   "generic_female_senior",
      "father":        "generic_male_middle",
      "mother":        "generic_female_middle",
      "older_child":   "generic_boy",
      "younger_child": "generic_girl"
    },
    "consistency_rules": [
      "All family members share warm medium skin tone for visual consistency",
      "Hair colors stay within dark brown to black range (gray for seniors)",
      "Outfit color tones harmonize across the family (avoid clashing brights)"
    ]
  },

  "nuclear_family": {
    "description": "両親と子ども2人の4人家族。",
    "members": {
      "father":    "generic_male_middle",
      "mother":    "generic_female_middle",
      "son":       "generic_boy",
      "daughter":  "generic_girl"
    },
    "consistency_rules": [
      "All family members share warm medium skin tone",
      "Hair colors stay within dark brown to black range"
    ]
  },

  "young_family": {
    "description": "若い両親と子ども1〜2人の家族。",
    "members": {
      "father": "generic_male_adult",
      "mother": "generic_female_adult",
      "child":  "generic_boy"
    },
    "consistency_rules": [
      "All family members share warm medium skin tone",
      "Parents look age-appropriate (30s) — younger than middle-aged"
    ]
  }
}


## ============================================================
## PART 3: PROMPT TEMPLATES（画像種類別テンプレート）
## ============================================================
##
## v2.3 新規テンプレート一覧:
##   A: vocabulary_person        人物語彙（修正）
##   B: vocabulary_building      建物語彙（変更なし）
##   C: example_sentence         例文画像（変更なし）
##   D: vocabulary_object_concrete  具体物語彙（新規）
##   E: vocabulary_variant_grid  複数並置（新規）
##   F: spatial_relation         空間関係・位置名詞（新規）
##   G: demonstrative_kosoado    指示語こそあど（新規）
##   H: action_verb              動作語彙（新規）
##   I: abstract_concept         抽象概念語彙（新規）
##
## 選択基準:
##   lesson_NN.json の vocabulary[].vocab_type を確認し
##   上記の対応テンプレートを使用すること。
##   vocab_type 未設定の語彙はまず分類を行うこと（HOW_TO_USE 参照）。
## ============================================================

PROMPT_TEMPLATES = {

  ## ─────────────────────────────────────────────
  ## テンプレートA: 語彙カード・人物（1:1）
  ## v2.3 修正: カノニカル視点・表情・姿勢の具体化指示を追加
  ## ─────────────────────────────────────────────
  "vocabulary_person": """
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The image must instantly communicate the meaning of the word "[TARGET_WORD]" at a glance.

[SUBJECT]
{CHARACTER_DESCRIPTION}
Pose and expression: {CHARACTER_POSE_AND_EXPRESSION}
The character's role must be immediately obvious from clothing, posture, and props alone.

[SCENE & ACTION]
Full-body shot. The character is centered and fills 70-80% of the image area.
Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.
This angle shows both the front face and a partial side view simultaneously.
Solid white background. No other characters or objects in the frame.
85mm portrait lens equivalent.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm blue (similar to #4A7FB5, hex value 4A7FB5)
and warm amber gold (similar to #FAD141, hex value FAD141) as accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートB: 語彙カード・建物（1:1）
  ## 変更なし
  ## ─────────────────────────────────────────────
  "vocabulary_building": """
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The building must be IMMEDIATELY and UNAMBIGUOUSLY recognizable as a [{BUILDING_TYPE}] at a glance.

[SUBJECT]
The main subject is [{BUILDING_DESCRIPTION_AND_SCALE}].
A single short Japanese signage word [{SIGNAGE_TEXT}] is mounted clearly near the entrance.

[SCENE & ACTION]
Viewed from a slight three-quarter front angle at eye level, 35mm wide-angle lens equivalent.
Straight vertical lines, natural perspective with no fisheye distortion.
Pale blue or soft cream sky background.

Functional cues — 3 anchors required (per 資料8):
- Entrance cue: [{ENTRANCE_CUE}]
- User action cue: [{USER_ACTION_CUE}]
- Surrounding anchor: [{SURROUNDING_ANCHOR}]

The building fills 70% of the frame. Negative space in the top one-third for typography.
Entrance and functional cues are clearly visible.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white or pale sky-blue background,
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm colors for the building facade,
warm amber gold (similar to #FAD141, hex value FAD141) for accent details.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
EXCEPTION (per 資料8): A single short Japanese building name signage [{SIGNAGE_TEXT}] is permitted —
limited to ONE word only, small, mounted on the building entrance.
No other text, letters, numbers, or symbols anywhere in the image.
No gradients, no shadows, no 3D effects.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートC: 例文画像（16:9）
  ## 変更なし
  ## ─────────────────────────────────────────────
  "example_sentence": """
[PURPOSE]
Create an example sentence illustration for Japanese language learning materials.
The image must clearly convey the grammatical relationship in the sentence:
[{SENTENCE_JP}] ({SENTENCE_EN})

[SUBJECT]
{CHARACTER_DESCRIPTIONS}

[SCENE & ACTION]
{SCENE_DESCRIPTION}
The characters' actions and relationship must make the sentence meaning visually obvious without any text.
{VISUAL_SYMBOL_IF_NEEDED}

Composition: Wide 16:9 shot, 50mm standard lens equivalent (natural perspective).
Characters occupy 60% of the frame.
{COMPOSITION_NOTES}
Eye-level view. Simple minimal background with only essential context.
Main characters are clearly separated from the background in visual contrast.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white or pale background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm colors,
warm amber gold (similar to #FAD141, hex value FAD141) accents for emphasis.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートD: 語彙カード・具体物（1:1）【v2.3 新規】
  ## ─────────────────────────────────────────────
  ## 資料10より: 具体物は質感（Materiality）・知覚的詳細・機能コンテキストが鍵。
  ## 資料11より: カノニカル視点 + 物体固有の視覚的シグネチャーで識別性を最大化。
  ##             アイコン化レベル level_3_detailed_flat が最適スイートスポット。
  ## ─────────────────────────────────────────────
  "vocabulary_object_concrete": """
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The image must instantly and UNAMBIGUOUSLY communicate the meaning of "[TARGET_WORD]" at a glance.
A learner must distinguish this object from similar-shaped objects without any text clues.

[SUBJECT]
The subject is: {OBJECT_DESCRIPTION}
Visual signature (distinctive identifying details — DO NOT OMIT):
{VISUAL_SIGNATURE}
These signature details are the primary means of identification. Render them clearly.

[SCENE & ACTION]
The object is centered and fills 70-80% of the image.
Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.
This angle reveals the top surface AND one side face simultaneously.
Exception: use straight front-facing ONLY if {FRONT_FACING_EXCEPTION} applies.
Solid white background. No additional objects or context scene.
85mm portrait lens equivalent.

Iconization level: Detailed Flat (level 3).
Include symbolic material texture hints:
{MATERIAL_TEXTURE_HINT}
These are symbolic (not photorealistic) — thin lines, dashes, or highlights to suggest material.
No actual shading or gradients.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm blue (similar to #4A7FB5, hex value 4A7FB5)
and warm amber gold (similar to #FAD141, hex value FAD141) as accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
Exception: {SIGNAGE_EXCEPTION_IF_ANY}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートE: 複数バリエーション並置（1:1 または 16:9）【v2.3 新規】
  ## ─────────────────────────────────────────────
  ## 資料11より: カテゴリ境界の明確化（インターリービング）に効果的。
  ##             類似物体を並置することで「AとBの違い」が脳内に刻まれる。
  ##             グリッド形式（2×2 または 1×N）で均一スタイル・白背景。
  ## 使用場面: 雑誌/本/冊子、カード/スマホ/財布 など形状が似た語彙セット。
  ## ─────────────────────────────────────────────
  "vocabulary_variant_grid": """
[PURPOSE]
Create a vocabulary comparison grid illustration for Japanese language learning materials.
The image shows {GRID_SIZE} related but distinct objects side by side.
Learners must instantly distinguish each object from the others.

[SUBJECT]
Grid layout: {GRID_SIZE} equal tiles in a {GRID_ARRANGEMENT} arrangement.
Each tile contains one object:
{TILE_DESCRIPTIONS}

Each object must display its distinctive visual signature clearly:
{TILE_SIGNATURES}

[SCENE & ACTION]
Each tile has an equal-sized white background cell.
All objects rendered at the same canonical 3/4 view and same scale.
Thin dividing lines between tiles (deep slate navy, 1pt weight).
No labels, no numbers, no captions inside the image.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Uniform color palette across all tiles.
Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm colors as fills.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
All tiles must share identical illustration style — no tile should look more detailed than another.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートF: 空間関係・位置名詞（1:1）【v2.3 新規】
  ## ─────────────────────────────────────────────
  ## 資料12より: 位置名詞（上・下・前・後ろ・右・左・中）の最適提示法。
  ##   - 「虫の視点（一人称視点）」が日本語らしい発話を促す。
  ##     話者の姿は画面に描き込まず、学習者の目線＝カメラ位置に固定。
  ##   - 基準物（ランドマーク）を無彩色、ターゲットを進出色（赤・黄）で描く。
  ##   - 「右・左」は背面構図（キャラクターの背中越し）で学習者の左右と一致させる。
  ##   - 3×3グリッド構図で位置関係を構造的に提示。
  ## 資料10より: VSD（Visual Scene Display）— 自然な風景としてスケール感を保持。
  ## ─────────────────────────────────────────────
  "spatial_relation": """
[PURPOSE]
Create a spatial relationship illustration for Japanese language learning materials.
The image must instantly and unambiguously show the positional relationship: [{TARGET_WORD_JP}] ({TARGET_WORD_EN}).
Example: 「箱の上に猫がいます。」

[SUBJECT]
Reference object (基準物 / landmark): {REFERENCE_OBJECT}
→ Render in neutral, desaturated color (cool gray tones). It is the anchor point.
Target object (ターゲット): {TARGET_OBJECT}
→ Render in a bold accent color (warm amber gold #FAD141 or bright red).
This strong color contrast immediately directs the learner's eye to the target.

[SCENE & ACTION]
Spatial relationship: The {TARGET_OBJECT} is positioned [{SPATIAL_POSITION}] the {REFERENCE_OBJECT}.
The positional relationship must be UNAMBIGUOUS. Exaggerate the position slightly if needed for clarity.

Camera setup:
{CAMERA_SETUP}

Layout guidance:
- Use a simple, minimal scene (e.g., a plain desk surface or room corner).
  Do not use a blank white background — a minimal environmental context helps convey real-world scale.
- The reference object fills 40-50% of the frame. The target object is clearly visible.
- Grid lines or floor tiles in the background are ENCOURAGED to reinforce spatial depth.

Special rules:
- For 右（right）/ 左（left）: Use BACK-FACING VIEW.
  Draw the character from behind, so that the character's right = viewer's right.
  This eliminates the left-right reversal confusion of face-to-face illustrations.
- For 中（inside）: Use transparency — render the container walls as semi-transparent outlines
  so the interior target object is visible.
- For 前（front）/ 後ろ（behind）: Use FIRST-PERSON POV.
  No character drawn in the scene. The viewer IS the speaker looking at the scene.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white or pale background,
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40),
neutral gray for reference object, bold accent (similar to #FAD141, hex value FAD141) for target object.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers inside the image.
Directional arrows are PERMITTED if they clarify the position — use ARROW_SEMIOTICS rules.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートG: 指示語こそあど（1:1 または 16:9）【v2.3 新規】
  ## ─────────────────────────────────────────────
  ## 資料12より: 「こ・そ・あ」はなわばり理論（テリトリー）で理解させる。
  ##   対面型: 話者の領域（こ）・聞き手の領域（そ）・共通の外（あ）を色分け。
  ##   並行型: 近接共有（こ）→ 中距離（そ）→ 遠距離（あ）を距離感で表現。
  ##   心理的距離（引き込み）: 領域の形を対象物に向けて変形・人物のポーズ。
  ## ─────────────────────────────────────────────
  "demonstrative_kosoado": """
[PURPOSE]
Create a demonstrative pronoun illustration for Japanese language learning materials.
The image must instantly convey the spatial territory logic of [{TARGET_WORD_JP}] ({TARGET_WORD_EN}).
Target demonstrative: {KO_SO_A_TYPE} — ({MODEL_TYPE}: {MODEL_DESCRIPTION})

[SUBJECT]
{SPEAKER_DESCRIPTION} is the speaker (話者).
{LISTENER_DESCRIPTION} is the listener (聞き手). (Omit if parallel model or first-person POV)
Target object: {TARGET_OBJECT}

[SCENE & ACTION]
Territory model: {MODEL_TYPE}

[MODEL TYPE: FACE-TO-FACE (対面型)]
  Speaker and listener stand facing each other.
  Divide the space between them with a clear VISUAL BOUNDARY LINE (dashed or subtle line).
  Color code the territories:
  - 「こ」zone (speaker's side): highlight with speaker's accent color (soft warm blue).
  - 「そ」zone (listener's side): highlight with listener's accent color (soft amber).
  - 「あ」zone (outside both): neutral gray zone beyond both territories.
  The target object [{TARGET_OBJECT}] is placed in the [{TARGET_ZONE}] zone.
  Both speaker and listener face each other with clear pointing gesture toward the target object.

[MODEL TYPE: PARALLEL (並行型)]
  Speaker and listener stand side by side, both facing the same direction.
  Draw a shared ellipse close to them labeled こ (warm blue), then a medium-distance marker
  labeled そ (amber), then a far-distance marker labeled あ (gray).
  The target object is positioned at the [{DISTANCE_ZONE}] marker.
  Use concentric distance rings or floor depth lines to clarify distance.

[MODEL TYPE: PSYCHOLOGICAL PULL (心理的引き込み)]
  Show the speaker's こ territory normally shaped as a circle around them.
  Then show the circle STRETCHING and deforming toward the target object as if pulling it in.
  The speaker leans forward or reaches toward the object with both hands in a protective gesture.
  Use the speaker's accent color to highlight the stretched territory AND the target object
  to show psychological ownership.

Camera: Eye-level, 50mm lens equivalent. Characters fill 60% of the frame.
Minimal background — a simple floor plane with subtle depth lines is recommended.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40),
muted warm blue (similar to #4A7FB5, hex value 4A7FB5) for speaker territory,
warm amber gold (similar to #FAD141, hex value FAD141) for listener territory or accent.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
Territory boundary lines and directional arrows ARE PERMITTED to clarify the こ/そ/あ zones.
No letters, numbers, or Japanese text inside the image (zone shapes and arrows only).
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートH: 動作語彙（1:1 または 16:9）【v2.3 新規】
  ## ─────────────────────────────────────────────
  ## 資料10より: 動作は静止画において最も困難な表現。
  ##   方法1: モーションブラー + 方向性（軌跡の表現）
  ##   方法2: 矢印シンボル（「矢印は動詞である」）
  ##   方法3: 相互作用の結果描写（動作の outcome を示す）
  ##   方法4: Before/After 2コマ（変化を伴う動詞に最適）
  ## ARROW_SEMIOTICS を参照して矢印タイプを選択すること。
  ## ─────────────────────────────────────────────
  "action_verb": """
[PURPOSE]
Create a vocabulary illustration for the Japanese action verb "[TARGET_WORD]" ({TARGET_WORD_EN}).
The image must convey the action itself — not just the actor standing still.
A learner must understand WHAT is being done, not just WHO is doing it.

[SUBJECT]
{CHARACTER_DESCRIPTION}
Action being performed: {ACTION_DESCRIPTION}

[SCENE & ACTION]
Visualization strategy: {VISUALIZATION_STRATEGY}

[STRATEGY: MOTION_ARROW]
  Show the character mid-action. Add a clear directional arrow (see ARROW_SEMIOTICS) indicating
  the path or direction of the action. The arrow color: warm amber gold #FAD141 or bright red.
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

[STRATEGY: SYMBOLIC_MOTION_LINES]
  Add motion lines (速度線) radiating from the moving part of the body or object.
  Motion lines are flat, vector-style — parallel curved or straight strokes in the
  direction of movement. Color: cool slate gray #6B7C85.

Camera: Eye-level, 50mm lens equivalent. Character and action fill 70% of frame.
Simple minimal background — enough context to ground the action, no clutter.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm blue (similar to #4A7FB5, hex value 4A7FB5),
warm amber gold (similar to #FAD141, hex value FAD141) for directional arrows and accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
Directional arrows and motion lines ARE PERMITTED — they are the primary motion indicators.
No text, no letters, no numbers inside the image.
No gradients, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートI: 抽象概念語彙（1:1）【v2.3 新規】
  ## ─────────────────────────────────────────────
  ## 資料10より: TIAC（Text-to-Image for Abstract Concepts）3層構造。
  ##   Layer 1 Intent（意図層）: 概念の定義をLLMで言語化。
  ##   Layer 2 Object（対象層）: 概念を象徴する具体物・場面に置換。
  ##   Layer 3 Form（形式層）: 画風・色彩で抽象度・感情を調整。
  ## ABSTRACT_METAPHORS 辞書を参照してLayer 2 の置換を行うこと。
  ## ─────────────────────────────────────────────
  "abstract_concept": """
[PURPOSE]
Create a vocabulary card illustration for the abstract Japanese concept "[TARGET_WORD]" ({TARGET_WORD_EN}).
The image must convey the MEANING and FEELING of this abstract word through symbolic visual metaphor.
There is no physical object to depict directly — use the metaphor defined below.

[SUBJECT — TIAC Layer 2: Object]
Conceptual definition: {CONCEPT_DEFINITION}
Visual metaphor / symbolic object: {VISUAL_METAPHOR}
This metaphor is the concrete anchor that makes the abstract concept visible.
Render it clearly and centrally. Do not add competing visual elements.

[SCENE & ACTION — TIAC Layer 3: Form]
Emotional tone: {EMOTIONAL_TONE}
Composition mood: {COMPOSITION_MOOD}
Color tone adjustment: {COLOR_TONE_ADJUSTMENT}
  (Example: warmth → add amber gold; coldness → cool slate blue tones)
The scene should feel {EMOTIONAL_TONE} — convey this through character posture,
spatial composition, and symbolic elements, NOT through facial expressions alone.

Camera: Centered, eye-level or slight elevation. Subject fills 70% of frame.
Background: minimal — a suggestion of environment (soft gradient-free tones acceptable
as large flat color fields, not as lighting effects).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm blue (similar to #4A7FB5, hex value 4A7FB5),
warm amber gold (similar to #FAD141, hex value FAD141) for warmth and positivity accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
"""
}


## ============================================================
## PART 4: BUILDING CUES REFERENCE（建物別・機能手掛かり一覧）
## ============================================================
## ※ v2.2 から変更なし。
## ============================================================

BUILDING_CUES = {

  "会社(company office)": {
    "building_scale":     "a mid-sized modern office building, not a skyscraper",
    "entrance_cue":       "automatic glass doors with a simple rectangular company nameplate beside the entrance",
    "user_action_cue":    "one office worker in a business suit walking in, another walking out, both carrying briefcases",
    "surrounding_anchor": "a clean paved walkway and a small potted plant by the entrance door",
    "signage_text":       "「会社」"
  },

  "学校(school)": {
    "building_scale":     "a cheerful Japanese elementary or junior high school building",
    "entrance_cue":       "a prominent school gate with a fence in the foreground",
    "user_action_cue":    "two children in school uniforms — one carrying a randoseru backpack — walking through the gate",
    "surrounding_anchor": "a small playground area with equipment visible on one side",
    "signage_text":       "「学校」"
  },

  "銀行(bank)": {
    "building_scale":     "a small to medium neighborhood bank branch — NOT a corporate skyscraper",
    "entrance_cue":       "an ATM unit clearly visible beside the entrance door",
    "user_action_cue":    "one customer using the ATM, another walking toward the entrance holding a bank card",
    "surrounding_anchor": "a reception counter faintly visible through the glass window",
    "signage_text":       "「銀行」"
  },

  "大学(university)": {
    "building_scale":     "a grand campus entrance gate with tall pillars and a modern academic building behind it",
    "entrance_cue":       "a bulletin board with papers posted on it near the entrance path",
    "user_action_cue":    "three young adult students in their 20s in casual clothes with backpacks or laptops walking near the gate",
    "surrounding_anchor": "a bicycle parking rack with several bikes just inside the gate, a tree-lined walkway",
    "signage_text":       "「大学」"
  },

  "デパート(department store)": {
    "building_scale":     "a tall elegant multi-story urban building — clearly upscale, not a supermarket",
    "entrance_cue":       "wide elegant display windows on the ground floor showing fashion items and accessories",
    "user_action_cue":    "two shoppers near the entrance, both carrying large shopping bags",
    "surrounding_anchor": "an escalator faintly visible through the glass facade",
    "signage_text":       "「デパート」"
  },

  "病院(hospital)": {
    "building_scale":     "a medium to large hospital building with a calm, clean exterior",
    "entrance_cue":       "a covered entrance canopy with a wheelchair ramp beside the main door",
    "user_action_cue":    "a medical staff member in scrubs near the entrance, one patient with a family member",
    "surrounding_anchor": "an ambulance bay or emergency vehicle space at the side",
    "signage_text":       "「病院」"
  },

  "駅(train station)": {
    "building_scale":     "a Japanese train station entrance building",
    "entrance_cue":       "ticket gates or ticket machines slightly visible through the entrance, a route map board",
    "user_action_cue":    "commuters walking in and out, one person checking a transit card",
    "surrounding_anchor": "a bus stop sign or taxi waiting area near the entrance, a clock above the entrance",
    "signage_text":       "「駅」"
  },

  "スーパー(supermarket)": {
    "building_scale":     "a wide low-rise supermarket building with a broad storefront",
    "entrance_cue":       "automatic sliding doors with shopping carts and baskets near the entrance",
    "user_action_cue":    "customers leaving with grocery bags, one person pushing a cart",
    "surrounding_anchor": "simple vegetable or sale posters near the entrance windows",
    "signage_text":       "「スーパー」"
  }
}


## ============================================================
## PART 4.5: OBJECT SIGNATURES（物体カテゴリ別・視覚的シグネチャー辞書）
## ============================================================
##
## v2.3 新規追加。資料11より。
##
## 目的:
##   日常物体は「形状が似通いがちなカテゴリ（例: 雑誌・本・冊子）」が多く、
##   フラットデザインでは特に混同リスクが高い。
##   各物体固有の「視覚的シグネチャー（識別標識）」をプロンプトに組み込むことで
##   1秒以内の識別（Glanceability）を実現する。
##
## 使い方:
##   テンプレートD（vocabulary_object_concrete）の
##   {VISUAL_SIGNATURE} と {MATERIAL_TEXTURE_HINT} に転記する。
##
## 構造:
##   primary_signatures: 識別に最も重要な要素（必須）
##   material_hints:     素材感を「記号」として伝えるテクスチャヒント
##   avoid:              AIが混同しやすい誤りの描写（ネガティブプロンプトに使用可）
## ============================================================

OBJECT_SIGNATURES = {

  ## ────────────────────────────
  ## 情報・メディア系
  ## ────────────────────────────

  "雑誌(magazine)": {
    "primary_signatures": [
      "A bold magazine title/masthead banner printed across the very top of the cover — the single strongest identifier",
      "Multiple coverline headlines in different font sizes layered over a cover photo",
      "Visible physical thinness compared to a book — the spine is thin"
    ],
    "material_hints": [
      "Subtle curved lines at the bottom edge of pages suggesting glossy paper flex",
      "A faint saddle-stitch line along the spine center"
    ],
    "avoid": "Do not draw it as a thick hardcover book. Do not omit the masthead banner.",
    "canonical_view": "3/4 view from slightly above — shows front cover AND spine thickness"
  },

  "本(book)": {
    "primary_signatures": [
      "A clearly visible thick spine with visible page edges on the opposite side",
      "Hard or soft cover with a distinct rectangular cover design",
      "Significantly thicker than a magazine"
    ],
    "material_hints": [
      "Page edge lines visible on the side — many thin horizontal lines stacked",
      "A bookmark ribbon or fabric tail hanging from the top of the spine"
    ],
    "avoid": "Do not confuse with magazine (no masthead) or notebook (no cover art).",
    "canonical_view": "3/4 view — shows cover AND spine AND page edges simultaneously"
  },

  "新聞(newspaper)": {
    "primary_signatures": [
      "Large broadsheet format — significantly wider than a magazine",
      "Multi-column text layout visible (simplified as parallel vertical lines)",
      "Folded in half horizontally, with a visible fold crease"
    ],
    "material_hints": [
      "Uncoated matte paper texture — no glossy highlight lines",
      "Slightly wrinkled or uneven edges suggesting newsprint"
    ],
    "avoid": "Do not show it as glossy (that is magazine). Do not make it small.",
    "canonical_view": "Slight 3/4 from above — shows the fold and the column layout"
  },

  "ノート(notebook)": {
    "primary_signatures": [
      "Spiral binding coils clearly visible on the left or top edge",
      "OR: composition notebook with a simple plain cover and no imagery",
      "Ruled lines visible on the open pages"
    ],
    "material_hints": [
      "Wire coil rings rendered as a series of small oval loops",
      "Slightly bent or dog-eared page corners"
    ],
    "avoid": "Do not add a cover photo (that is a magazine). Do not use a thick spine.",
    "canonical_view": "3/4 from slightly above — shows spiral AND one page corner"
  },

  ## ────────────────────────────
  ## デジタル機器系
  ## ────────────────────────────

  "ケータイ・スマートフォン(smartphone)": {
    "primary_signatures": [
      "App icon grid visible on the screen — small colored rounded squares in a 3×4 grid",
      "Rear camera module: a cluster of 2-3 circular lens openings in the top-left corner of the back",
      "Status bar at the top of the screen showing simplified time or signal icons"
    ],
    "material_hints": [
      "A thin diagonal white highlight line across the top-right of the screen — glass surface",
      "Metallic thin frame line along the edges of the device"
    ],
    "avoid": "Do not render as a plain black rectangle with no screen content.",
    "canonical_view": "Slight 3/4 from above showing screen face AND one side edge"
  },

  "パソコン(laptop/computer)": {
    "primary_signatures": [
      "Open laptop: screen + keyboard visible at an obtuse angle",
      "Desktop: separate monitor + keyboard unit clearly separated",
      "Screen shows a simplified UI — window chrome or desktop wallpaper"
    ],
    "material_hints": [
      "Keyboard key grid — small uniform square keys arranged in rows",
      "Thin metallic body edges with rounded corners"
    ],
    "avoid": "Do not show a closed laptop (indistinguishable from a book).",
    "canonical_view": "3/4 eye-level — shows screen face AND keyboard at angle"
  },

  "テレビ(television)": {
    "primary_signatures": [
      "Wide rectangular screen with a visible bezel frame",
      "A flat stand or wall-mount base below the screen",
      "A simplified image or pattern visible on the screen"
    ],
    "material_hints": [
      "Thin glossy highlight across the top edge of the screen",
      "Slim body depth visible from the side — modern flat panel"
    ],
    "avoid": "Do not draw old CRT shape unless context requires it.",
    "canonical_view": "Slight 3/4 from eye level — shows screen AND stand base"
  },

  "カメラ(camera)": {
    "primary_signatures": [
      "A prominent circular lens barrel protruding from the front face",
      "A viewfinder bump on the top right of the body",
      "A shutter button clearly visible on the top surface"
    ],
    "material_hints": [
      "Lens glass surface: concentric circles inside the barrel",
      "Textured grip on the right side of the body"
    ],
    "avoid": "Do not flatten the lens — the circular protrusion is the key identifier.",
    "canonical_view": "3/4 from slightly above — shows lens front AND top shutter button"
  },

  ## ────────────────────────────
  ## 財布・カード系
  ## ────────────────────────────

  "財布(wallet)": {
    "primary_signatures": [
      "Dashed stitching lines along all edges — the single strongest leather identifier",
      "Bi-fold structure with a visible center crease/fold line",
      "Multiple card slot openings peeking out from the top or side"
    ],
    "material_hints": [
      "Subtle pebble grain texture on the leather surface — tiny dot stippling pattern",
      "A metal snap button or clasp on the closure point"
    ],
    "avoid": "Do not omit the stitching. Without stitching it looks like a generic rectangle.",
    "canonical_view": "3/4 from slightly above — shows front face, fold crease, AND one edge"
  },

  "カード(card)": {
    "primary_signatures": [
      "A gold or silver EMV chip rectangle in the upper-left area — the definitive credit card symbol",
      "A horizontal magnetic stripe across the back (if back view) — dark brown stripe",
      "Perfectly precise rounded corners — sharper and more uniform than a folded wallet"
    ],
    "material_hints": [
      "A thin diagonal white specular highlight across the card surface — plastic sheen",
      "Holographic rainbow stripe near the chip (optional, for credit card)"
    ],
    "avoid": "Do not confuse with smartphone (card has no screen/camera). Always include chip.",
    "canonical_view": "Slight 3/4 from above — shows card face AND one short edge thickness"
  },

  ## ────────────────────────────
  ## 乗り物系
  ## ────────────────────────────

  "車(car)": {
    "primary_signatures": [
      "Visible wheel arches with circular tires clearly rendered",
      "Side windows as distinct transparent (light blue tinted) shapes",
      "A door handle line along the side panel"
    ],
    "material_hints": [
      "Thin white highlight curve along the roof roofline — metal sheen",
      "Headlight lens details — circular or trapezoidal lens shapes"
    ],
    "avoid": "Do not draw without wheels — wheels are the primary vehicle identifier.",
    "canonical_view": "3/4 front-side view — shows front face, side, AND wheels"
  },

  "自転車(bicycle)": {
    "primary_signatures": [
      "Two equal-sized circular wheels with visible spoke lines",
      "A chain linking the rear wheel to the pedal crankset",
      "Handlebars and saddle as clearly distinct components"
    ],
    "material_hints": [
      "Thin metal frame tubes — consistent line weight throughout",
      "Visible spokes radiating from the wheel hubs"
    ],
    "avoid": "Do not omit spokes — without them it looks like a scooter or motorbike.",
    "canonical_view": "True side profile — the only view that shows the diamond frame clearly"
  },

  ## ────────────────────────────
  ## 食器・キッチン系
  ## ────────────────────────────

  "コップ・グラス(cup/glass)": {
    "primary_signatures": [
      "Transparent or semi-transparent cylinder — show light blue interior tint",
      "A subtle specular highlight line on the left side of the glass",
      "No handle = glass/コップ; with handle = mug/マグカップ (distinguish clearly)"
    ],
    "material_hints": [
      "Thin white highlight arc across the top rim",
      "A faint liquid level line inside if drink contents are shown"
    ],
    "avoid": "Do not make it fully opaque — transparency is the key identifier.",
    "canonical_view": "Slight 3/4 from above — shows opening rim AND side profile"
  },

  "茶碗(rice bowl)": {
    "primary_signatures": [
      "Shallow curved bowl shape with a curved inward foot ring at the base",
      "White rice texture inside if top view is shown — small grain dots",
      "Traditional ceramic pattern or simple band design on the exterior"
    ],
    "material_hints": [
      "Matte ceramic surface — no glossy specular highlights",
      "A thin shadow ring under the base foot"
    ],
    "avoid": "Do not confuse with a coffee mug (no handle) or western bowl (no foot ring).",
    "canonical_view": "3/4 from slightly above — shows interior rice AND side profile"
  }
}


## ============================================================
## PART 4.6: SPATIAL GRID PATTERNS（空間構図パターン辞書）
## ============================================================
##
## v2.3 新規追加。資料12より。
##
## 目的:
##   テンプレートF（spatial_relation）とG（demonstrative_kosoado）で使用。
##   {CAMERA_SETUP} フィールドに対応するパターンを転記する。
## ============================================================

SPATIAL_GRID_PATTERNS = {

  "on_top (上に)": {
    "camera":   "Eye-level side view (50mm lens). The reference object at the center-bottom of the frame.",
    "layout":   "The target object rests directly on top of the reference object's upper surface. Exaggerate the vertical gap slightly.",
    "grid_aid": "Draw 2-3 horizontal floor/shelf lines behind the scene to reinforce the vertical axis."
  },

  "under / below (下に)": {
    "camera":   "Eye-level side view (50mm lens). The reference object at the center-upper area.",
    "layout":   "The target object is positioned directly below the reference object, resting on the floor/surface.",
    "grid_aid": "Draw a clear floor line to anchor both objects vertically."
  },

  "inside (中に)": {
    "camera":   "Slight elevated 3/4 view to show interior. The container reference object centered.",
    "layout":   "The container walls are rendered as semi-transparent outlines so the interior target is visible.",
    "grid_aid": "A dashed inner rectangle inside the container outline reinforces the 'inside' concept."
  },

  "in front of (前に)": {
    "camera":   "FIRST-PERSON POV — no character drawn. The viewer IS the speaker looking forward.",
    "layout":   "The reference object is at the center background. The target object is between the viewer and the reference, closer to the camera.",
    "grid_aid": "Floor tiles or a perspective grid strongly recommended to reinforce depth / front vs back."
  },

  "behind (後ろに)": {
    "camera":   "FIRST-PERSON POV — no character drawn. The viewer IS the speaker looking forward.",
    "layout":   "The reference object is in the center foreground. The target object is partially hidden behind it, smaller due to perspective.",
    "grid_aid": "Use a perspective grid. The target object should be peeking out from behind the reference."
  },

  "to the right (右に)": {
    "camera":   "BACK-FACING VIEW. Draw the character from behind (we see their back). Character faces forward.",
    "layout":   "The target object is positioned to the RIGHT of the character from the character's own perspective — which is also the viewer's right.",
    "grid_aid": "An amber-colored right-pointing arrow above the target object reinforces the direction."
  },

  "to the left (左に)": {
    "camera":   "BACK-FACING VIEW. Draw the character from behind (we see their back). Character faces forward.",
    "layout":   "The target object is positioned to the LEFT of the character from the character's own perspective — which is also the viewer's left.",
    "grid_aid": "An amber-colored left-pointing arrow above the target object reinforces the direction."
  },

  "next to / beside (そばに・となりに)": {
    "camera":   "Eye-level front view (50mm lens).",
    "layout":   "Both the reference object and target object are side by side at the same depth plane, with a small visible gap between them.",
    "grid_aid": "A double-headed horizontal arrow between the two objects reinforces adjacency."
  },

  "between (間に)": {
    "camera":   "Eye-level front view (50mm lens).",
    "layout":   "Three objects in a horizontal row: Object A — Target — Object B. The target is centered exactly between A and B.",
    "grid_aid": "Two vertical dashed lines flanking the target define the 'between' space."
  }
}


## ============================================================
## PART 4.7: ARROW SEMIOTICS（矢印の意味分類）
## ============================================================
##
## v2.3 新規追加。資料12より。
## 資料10より: 「矢印は動詞である（Arrows are the Verbs of Diagrams）」
##
## 目的:
##   テンプレートF・G・H で矢印を使用する際の選択基準を定義する。
##   矢印は単なる装飾ではなく、伝達する意味によって形状を使い分けること。
## ============================================================

ARROW_SEMIOTICS = {

  "straight_bold": {
    "shape":   "Thick straight arrow with solid arrowhead",
    "meaning": "Direct movement toward a destination; forceful approach",
    "use_cases": [
      "「行く」「来る」— movement toward a location",
      "空間関係での強調（ここ！→）",
      "「こ」のなわばり内への引き込み"
    ],
    "color":   "Warm amber gold #FAD141 or bright red"
  },

  "straight_long_thin": {
    "shape":   "Long thin arrow with small arrowhead",
    "meaning": "Pointing into the distance; extending the viewer's line of sight",
    "use_cases": [
      "「あそこ」「あちら」— pointing to distant objects",
      "Far-distance markers in demonstrative kosoado illustrations"
    ],
    "color":   "Cool slate gray #6B7C85"
  },

  "curved_arc": {
    "shape":   "Curved arc arrow (semicircle shape)",
    "meaning": "Rotation, turning, redirecting attention or gaze",
    "use_cases": [
      "「振り向く」— turning around",
      "「こちらを向いて」— directing gaze toward speaker",
      "「あ」の心理的引き込みで領域が曲線的に変形する動き"
    ],
    "color":   "Muted warm blue #4A7FB5"
  },

  "double_headed": {
    "shape":   "Arrow with arrowheads on both ends",
    "meaning": "Comparison, reciprocal relationship, distance measurement",
    "use_cases": [
      "「となりに」— adjacency with measured gap",
      "「間に」— between two reference points",
      "語彙比較グリッドでの category boundary line"
    ],
    "color":   "Cool slate gray #6B7C85"
  },

  "motion_lines": {
    "shape":   "Multiple parallel curved or straight strokes radiating from a moving object",
    "meaning": "Speed, vibration, kinetic energy",
    "use_cases": [
      "「走る」「飛ぶ」「投げる」— fast physical action",
      "動作の軌跡を強調する補助線として"
    ],
    "color":   "Cool slate gray #6B7C85, thin weight"
  }
}


## ============================================================
## PART 4.8: ABSTRACT METAPHORS（抽象概念のメタファー辞書）
## ============================================================
##
## v2.3 新規追加。資料10より TIAC（Text-to-Image for Abstract Concepts）に基づく。
##
## 目的:
##   テンプレートI（abstract_concept）の
##   {VISUAL_METAPHOR}・{EMOTIONAL_TONE}・{COLOR_TONE_ADJUSTMENT} に転記する。
##
## 対象語彙: N5〜N3 頻出の抽象的語彙・感情・状態語。
## ============================================================

ABSTRACT_METAPHORS = {

  ## ────────────────────────────
  ## 感情・状態
  ## ────────────────────────────

  "好き(like / love)": {
    "concept_definition": "Positive emotional attachment to a person, thing, or activity",
    "visual_metaphor":    "A character holding a large glowing heart shape toward the viewer, or cradling an object with both hands in a protective gesture",
    "emotional_tone":     "warm, inviting, gentle",
    "color_adjustment":   "Increase warm amber gold and soft rose-pink tones"
  },

  "嫌い(dislike / hate)": {
    "concept_definition": "Negative emotional rejection of a person, thing, or activity",
    "visual_metaphor":    "A character turning away from an object with one hand held up (stop gesture), or an X mark hovering over the disliked object",
    "emotional_tone":     "tense, rejecting",
    "color_adjustment":   "Use cooler blue-gray tones; avoid warm colors"
  },

  "楽しい(fun / enjoyable)": {
    "concept_definition": "A state of joy and engagement in an activity",
    "visual_metaphor":    "A character with arms raised, surrounded by small star or sparkle shapes; OR two characters doing an activity together with visible energy lines",
    "emotional_tone":     "energetic, light, celebratory",
    "color_adjustment":   "Bright amber gold accents; high visual energy in composition"
  },

  "悲しい(sad)": {
    "concept_definition": "A state of emotional sorrow or grief",
    "visual_metaphor":    "A character sitting with head bowed; OR a wilting flower; OR a single teardrop shape above the character",
    "emotional_tone":     "quiet, heavy, withdrawn",
    "color_adjustment":   "Dominant cool slate gray and muted blue; reduce warm tones"
  },

  "嬉しい(happy / glad)": {
    "concept_definition": "A state of pleasure or delight, often in response to good news",
    "visual_metaphor":    "A character with both hands raised in celebration, or a character receiving something with a big open smile; sparkle lines radiating outward",
    "emotional_tone":     "bright, expansive, celebratory",
    "color_adjustment":   "Maximum warm amber gold accents"
  },

  "怒る(angry)": {
    "concept_definition": "A state of strong displeasure or irritation",
    "visual_metaphor":    "A character with a furrowed brow, clenched fist raised, with jagged spike lines or steam lines radiating from the head",
    "emotional_tone":     "tense, sharp, kinetic",
    "color_adjustment":   "Red-orange accent lines; reduce soft tones"
  },

  "疲れる(tired / exhausted)": {
    "concept_definition": "A state of physical or mental depletion after effort",
    "visual_metaphor":    "A character slumped in a chair or leaning against a wall, with downward drooping lines from the eyes or head",
    "emotional_tone":     "heavy, slow, depleted",
    "color_adjustment":   "Muted, desaturated palette; reduce bright accents"
  },

  "心配(worry / anxiety)": {
    "concept_definition": "A state of mental unease about an uncertain future event",
    "visual_metaphor":    "A character with one hand on their chin looking upward at a large question mark cloud; OR a character looking at a clock with a worried posture",
    "emotional_tone":     "uncertain, tense, inward",
    "color_adjustment":   "Cool gray dominant; amber gold for the question mark symbol only"
  },

  ## ────────────────────────────
  ## 社会・関係
  ## ────────────────────────────

  "友達・友情(friendship)": {
    "concept_definition": "A close mutual bond of trust and affection between people",
    "visual_metaphor":    "Two characters standing side by side, shoulders touching, both facing forward; OR two puzzle pieces fitting perfectly together with light radiating from the join",
    "emotional_tone":     "warm, balanced, connected",
    "color_adjustment":   "Equal warm amber gold on both characters; unified palette"
  },

  "家族(family)": {
    "concept_definition": "A group of people connected by blood, care, and shared life",
    "visual_metaphor":    "Three or more figures of different heights standing together in a cluster, all facing forward",
    "emotional_tone":     "warm, protective, stable",
    "color_adjustment":   "Harmonized warm tones across all figures; matching skin tones"
  },

  "仕事(work)": {
    "concept_definition": "Purposeful activity done as an occupation or duty",
    "visual_metaphor":    "A character at a desk with papers/laptop and a clock visible in the background; OR a character in work attire carrying tools of their trade",
    "emotional_tone":     "focused, purposeful, structured",
    "color_adjustment":   "Neutral muted blue dominant; amber for accent details"
  },

  "生活(daily life / lifestyle)": {
    "concept_definition": "The pattern of everyday activities that make up a person's life",
    "visual_metaphor":    "A character in a home setting surrounded by everyday objects (bed, table, cup); OR a clock cycle with small icons around it showing morning/afternoon/night activities",
    "emotional_tone":     "calm, routine, grounded",
    "color_adjustment":   "Soft neutral palette; warm cream and muted blue"
  },

  ## ────────────────────────────
  ## 時間・変化
  ## ────────────────────────────

  "むかし(long ago / past)": {
    "concept_definition": "A time far in the past, often with nostalgic or historical connotation",
    "visual_metaphor":    "An old-style calendar or scroll; OR a sepia-toned silhouette of an older-era scene (simplified house or clothing style); OR a clock with hands turning backward",
    "emotional_tone":     "nostalgic, soft, distant",
    "color_adjustment":   "Warm amber and sepia tones dominant; reduce bright colors"
  },

  "これから(from now on / future)": {
    "concept_definition": "The time ahead; a sense of beginning or forward momentum",
    "visual_metaphor":    "A character walking forward on a path that extends into the horizon; OR a sunrise scene with a figure facing the light",
    "emotional_tone":     "hopeful, forward-moving, open",
    "color_adjustment":   "Warm amber gold for the horizon/light source; blue for the sky"
  },

  "変わる(change)": {
    "concept_definition": "A state of transformation from one form or condition to another",
    "visual_metaphor":    "Two-panel before/after: left panel shows old state (muted colors), right panel shows new state (brighter colors), with a curved arc arrow between them",
    "emotional_tone":     "dynamic, transitional",
    "color_adjustment":   "Left panel: cool gray; Right panel: warm amber and blue"
  }
}


## ============================================================
## PART 5: VISUAL SYMBOLS（視覚的慣習シンボル一覧）
## ============================================================
## ※ v2.2 から変更なし。例文画像（テンプレートC）で使用。
## ============================================================

VISUAL_SYMBOLS = {
  "質問・疑問(question)":
    "A large, clearly drawn bold question mark symbol floats above the subject's head.",

  "はい・肯定(yes)":
    "A large bright green circle with a bold checkmark floats above the character.",

  "いいえ・否定(no)":
    "A large red circle with a bold X mark floats above the character.",

  "動作の方向(action direction)":
    "A curved red or orange motion arrow indicates the direction of the action.",

  "指示・注目(pointing)":
    "The character points clearly with one hand toward the subject of attention.",

  "2択・比較(yes/no split)":
    "A split image divided into two equal panels side by side. Left panel: yes/positive. Right panel: no/negative.",

  "怒り・感情(emotion)":
    "A facial expression and body posture clearly convey the emotion. No ambiguity.",

  "場所の提示(showing location)":
    "The character holds up a card or ID toward the viewer to indicate identity or location."
}


## ============================================================
## PART 6: QA CHECKLIST（生成後の品質チェックリスト）
## ============================================================
##
## v2.3 更新:
##   - vocab_type_check 新規追加（語彙タイプ別の識別性チェック）
##   - mayer_principles_check 新規追加（メイヤー12原則の適合確認）
##   - regenerate_trigger を regeneration_cost_check に改訂
##     （再生成防止の観点＝コスト削減を明示）
## ============================================================

QA_CHECKLIST = {

  ## ─────────────────────────
  ## 既存チェック項目（v2.2 から維持）
  ## ─────────────────────────

  "character_consistency": [
    "同じ役割の人物が複数の画像に登場する場合、服装・髪型の整合性が取れているか",
    "肌の色が指定の warm medium skin tone と一致しているか",
    "体型・シルエットが一致しているか",
    "顔の形・髪型・髪の色が前回と大きくずれていないか",
    "特徴的なアイテム（眼鏡・白衣・スーツ等）が一致しているか"
  ],

  "style_consistency": [
    "フラットベクタースタイルが維持されているか（グラデーション・影が入っていないか）",
    "輪郭線の太さが均一か",
    "カラーパレットが規定の色調（STYLE_BIBLE 参照）か",
    "背景が指定通りか（語彙カードは白、例文は最小限、建物はパールスカイブルー）",
    "文字・数字・記号が画像内に入っていないか（建物の1語看板・矢印を除く）"
  ],

  "session_drift_check": [
    "1ターン目には無かった微細なディテールが自発的に追加されていないか",
    "線画の太さがターン1から変動していないか",
    "色相がリファレンス画像と一致しているか",
    "フレーム占有率（語彙70-80% / 例文60% / 建物70%）が維持されているか"
  ],

  ## ─────────────────────────
  ## v2.3 新規: 語彙タイプ別の識別性チェック
  ## ─────────────────────────
  ## 資料11より: 語彙カードの教育的価値は「1秒以内に正しく識別できるか」に集約される。
  ## チェック方法: 完成した画像を初見で3秒間だけ見て、正しい語彙が想起できるか確認。

  "vocab_type_check": {

    "person": [
      "その人物の「役割」が服装・持ち物・背景だけで即座にわかるか（ROLE_BASED_GENERIC_PROFILES 参照）",
      "表情・姿勢が役割を補強しているか（医者→聴診器・先生→マーカー等）",
      "多文化配慮: 特定の国籍・文化のステレオタイプになっていないか"
    ],

    "building": [
      "建物の種類が外観だけで（看板を隠しても）わかるか",
      "入口設備・利用者行動・周辺アンカーの3点セットが揃っているか（BUILDING_CUES 参照）"
    ],

    "concrete_object": [
      "その物体の視覚的シグネチャーが明確に描かれているか（OBJECT_SIGNATURES 参照）",
      "類似形状の物体（例: 雑誌と本）と区別できるか",
      "カノニカル視点（斜め上30-45度）が採用されているか",
      "素材感のシンボリックヒント（ステッチ・光沢線等）が入っているか"
    ],

    "spatial_relation": [
      "基準物（ランドマーク）が無彩色、ターゲットが進出色（黄・赤）で描かれているか",
      "位置関係が誤解なく1つの解釈しかできないか",
      "「右・左」は背面構図を採用しているか（正面構図の場合は左右が逆転）",
      "「前・後ろ」は一人称視点（虫の視点）になっているか",
      "「中」は容器が半透明になっているか"
    ],

    "demonstrative": [
      "話者の領域（こ）・聞き手の領域（そ）・共通外（あ）が色またはラインで明確に区分されているか",
      "対面型か並行型か、どちらのモデルを使用しているかが画面から読み取れるか",
      "物体がどのゾーンに属しているかが一目でわかるか"
    ],

    "action_verb": [
      "「何をしているか」が動作の最高点またはアウトカムから1秒で理解できるか",
      "矢印・モーションラインが動作の方向を明確にしているか（ARROW_SEMIOTICS 参照）",
      "Before/After 戦略の場合: 左右のパネルが同一スタイルで描かれているか"
    ],

    "abstract_concept": [
      "使用したメタファー（ABSTRACT_METAPHORS 参照）が概念を直感的に伝えているか",
      "感情トーンが色彩・構図・ポーズに反映されているか",
      "他の抽象概念と混同しないか（例: 「好き」と「嬉しい」が見分けられるか）"
    ]
  },

  ## ─────────────────────────
  ## v2.3 新規: メイヤー12原則チェック
  ## ─────────────────────────
  ## 資料10より: マルチメディア学習研究の知見をプロンプトに応用する。

  "mayer_principles_check": [
    "一貫性の原理: 学習に無関係な装飾・背景ノイズが排除されているか（外因性負荷ゼロ）",
    "シグナリングの原理: 重要な要素（ターゲット・役割・動作）が視覚的に際立っているか",
    "空間的近接性の原理: 関連する要素（ターゲットとその識別シグネチャー）が画面内で近くに配置されているか",
    "1秒テスト: その画像が何を意味するか、1秒以内に判断できるか（Glanceability）"
  ],

  ## ─────────────────────────
  ## v2.3 改訂: 再生成コスト防止チェック
  ## ─────────────────────────
  ## 3万枚超の量産では、再生成1回あたり約5円（Gemini）のコストが発生する。
  ## 再生成率を1%下げるだけで約1,500円の削減になる。
  ## 以下のチェックで「後から直す」を防止する。

  "regeneration_cost_check": [
    "【最重要】上記 vocab_type_check のすべての項目をパスしているか",
    "【最重要】上記 mayer_principles_check をパスしているか",
    "再生成する場合: 全文ゼロから書き直さず、崩れた属性だけを明示して修正する（資料5より）",
    "再生成する場合: 崩れた属性は何か？（例: 財布のステッチが消えた → OBJECT_SIGNATURES を再参照して追記）",
    "セッションドリフトが検知されたら: そのセッションを破棄し新規セッションを開始（GEMINI_STABILIZATION 参照）",
    "量産フェーズ開始前: vocab_type フィールドが lesson_NN.json に設定済みか確認（未設定のまま生成しない）"
  ]
}


## ============================================================
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
- Background: soft cream white #FBFBFB (hex value FBFBFB)
- Outline: deep slate navy #1B2C40 (hex value 1B2C40)
- Main color: muted warm blue #4A7FB5 (hex value 4A7FB5)
- Accent: warm amber gold #FAD141 (hex value FAD141)
- Sub color: cool slate gray #6B7C85 (hex value 6B7C85)

All colors must be applied as 100% opaque, solid vector fills.
"""
    },

    "spatial_drift": {
      "symptom":  "生成のたびに被写体のサイズ・位置が変動する。",
      "cause":    "明示的なバウンディングボックス指定がない。焦点距離が欠落している。",
      "remedy_prompt": """
[CAMERA & SPATIAL CONTROL BLOCK]
Camera Setup: Canonical 3/4 view, 30-45 degrees above and slightly to one side.
85mm portrait lens equivalent.

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
}


## ============================================================
## PART 8: HOW TO USE（新しい課のJSONを作るときの手順）
## ============================================================
##
## v2.3 で全面更新: vocab_type 判定フロー・テンプレート選択基準・
##                  lesson_NN.json の vocab_type フィールド仕様を追記。
## ============================================================

HOW_TO_USE = """
【新しい課（例: 第3課）の image_prompts_lessonN.json を作るとき】

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 0: lesson_NN.json の vocab_type フィールドを設定する（v2.3 新規）
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  vocabulary[].vocab_type に以下のいずれかを設定する:

    "person"           → 人物（医者・先生・学生・男の人 等）
    "building"         → 建物・施設（病院・学校・銀行 等）
    "concrete_object"  → 具体的な物体（雑誌・ケータイ・財布・車 等）
    "spatial_relation" → 位置名詞（上・下・前・後ろ・右・左・中 等）
    "demonstrative"    → 指示語（これ・それ・あれ・ここ・そこ・あそこ 等）
    "action_verb"      → 動作語彙（買う・食べる・走る・会う 等）
    "abstract_concept" → 抽象概念・感情・状態（好き・嫌い・楽しい・大変 等）

  判断が難しい語彙の基準:
    - 「写真を撮る」→ action_verb（動作が主）
    - 「写真」単体 → concrete_object（物体として示す）
    - 「元気」→ abstract_concept（目に見えない状態）
    - 「右側の席」→ spatial_relation（位置関係が主）

  vocab_type 未設定のままプロンプト作成を始めないこと。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: STYLE_BIBLE を確認する
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → "core_style" と "color_palette" と "constraints" は変更しない
  → "focal_length_standards" を参照（v2.3: カノニカル視点がデフォルト）
  → "iconization_level_guide" で推奨レベルを確認（多くの語彙は level_3_detailed_flat）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2: 人物画像の設計（vocab_type: person）
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 2-A: 役割を特定 → ROLE_BASED_GENERIC_PROFILES から選択
  Step 2-B: 年齢層・性別を選択 → CHARACTER_PROFILES の generic_* から選択
  Step 2-C: outfit_hints / scene_hints を組み合わせる
  Step 2-D: 同一セット内の整合性確保（同じ役割なら同じ generic_* を採用）
  → テンプレートA（vocabulary_person）を使用
  → 画像プロンプトに固有名詞（Tanaka-sensei 等）は絶対に書かない

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: 具体物画像の設計（vocab_type: concrete_object）【v2.3 新規】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 3-A: OBJECT_SIGNATURES で対象語彙のエントリを確認
            → primary_signatures / material_hints / avoid を読む
  Step 3-B: canonical_view の指示を確認（物体ごとに最適角度が異なる）
  Step 3-C: テンプレートD（vocabulary_object_concrete）を使用
            → {VISUAL_SIGNATURE} に primary_signatures を転記
            → {MATERIAL_TEXTURE_HINT} に material_hints を転記
  Step 3-D: 類似形状の物体がある場合はテンプレートE（vocabulary_variant_grid）も検討
            例: 「雑誌」単体 → テンプレートD
                「雑誌・本・新聞の違い」を示したい → テンプレートE

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 4: 空間・指示語画像の設計（vocab_type: spatial_relation / demonstrative）【v2.3 新規】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  spatial_relation の場合:
    Step 4-A: SPATIAL_GRID_PATTERNS で対象語彙のエントリを確認
    Step 4-B: {CAMERA_SETUP} フィールドにパターンを転記
    Step 4-C: テンプレートF（spatial_relation）を使用
    注意: 右・左 → 背面構図。前・後ろ → 一人称視点。中 → 半透明容器。

  demonstrative の場合:
    Step 4-A: こ/そ/あ のどれか、対面型/並行型/心理的引き込みのどれかを決定
    Step 4-B: ARROW_SEMIOTICS から適切な矢印タイプを選択
    Step 4-C: テンプレートG（demonstrative_kosoado）を使用

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 5: 動作語彙画像の設計（vocab_type: action_verb）【v2.3 新規】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 5-A: 動作のタイプを判断し戦略を選択:
    MOTION_ARROW     → 方向性のある移動動詞（行く・来る・投げる 等）
    OUTCOME          → 結果が視覚的に明確な動詞（買う・食べる・飲む 等）
    BEFORE_AFTER     → 変化を伴う動詞（切る・壊す・着る 等）
    SYMBOLIC_MOTION  → 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）
  Step 5-B: ARROW_SEMIOTICS から矢印タイプを選択
  Step 5-C: テンプレートH（action_verb）を使用

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 6: 抽象概念語彙画像の設計（vocab_type: abstract_concept）【v2.3 新規】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 6-A: ABSTRACT_METAPHORS で対象語彙のエントリを確認
            未収録の場合は TIAC 3層構造で設計する:
              Layer 1 Intent: 概念をシンプルな日本語で定義
              Layer 2 Object: 概念を象徴する具体物・場面に置換
              Layer 3 Form:   画風・感情トーン・色彩を指定
  Step 6-B: テンプレートI（abstract_concept）を使用
            → {VISUAL_METAPHOR}・{EMOTIONAL_TONE}・{COLOR_TONE_ADJUSTMENT} を転記

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 7: 例文画像の設計（テンプレートC）
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → テンプレートC（example_sentence）を使用（v2.3 で変更なし）
  → VISUAL_SYMBOLS から必要なシンボルを参照
  → S+V+O 関係が視覚的に明確になるよう構図を設計

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 8: 建物画像の設計（vocab_type: building）
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → BUILDING_CUES から対象建物のエントリを参照
  → テンプレートB（vocabulary_building）を使用（v2.3 で変更なし）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 9: JSONプロンプトを記述する
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → テンプレートの [ ] 部分を埋める
  → STYLE_BIBLE の固定フレーズは一言一句変えない
  → 全テンプレートが5ブロック構造（PURPOSE/SUBJECT/SCENE & ACTION/STYLE RECIPE/CONSTRAINTS）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 10: 生成時のセッション管理
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → GEMINI_STABILIZATION の session_management に従う
  → 1セッション最大4ターンまで
  → vocab_type が切り替わるタイミングで新規セッションを推奨

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 11: 生成後に QA_CHECKLIST で確認する
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → style_consistency / session_drift_check（全テンプレート共通）
  → vocab_type_check の該当タイプ項目
  → mayer_principles_check（1秒テストを必ず実施）
  → regeneration_cost_check でコスト意識を維持

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【量産フェーズの判断基準（v2.3 更新）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  small_scale (1課 数十枚以下):
    → 基本プロンプト + STYLE_BIBLE + vocab_type_check で OK

  medium_scale (50-300枚):
    → Double-Hex Anchoring 厳密適用 + フレーム占有率の数値指定を必須化

  large_scale (1,000枚以上 / 辞書サービス込みで3万枚超):
    → vocab_type 全語彙設定完了を確認してから開始
    → GEMINI_STABILIZATION 全項目を厳格適用
    → QA_CHECKLIST の regeneration_cost_check を毎枚実施
    → API コスト最適化の検討（Flux Schnell / Stable Diffusion 等の比較テスト）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【重要な注意事項】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

- スタイル固定フレーズは同義語に言い換えない（"flat" → "2D" などは禁止）
- 画像プロンプトに固有名詞（Tanaka-sensei, Yamada-san 等）を絶対に書かない
- vocab_type 未設定のまま生成しない — 分類を先に完了させる
- OBJECT_SIGNATURES の avoid リストをネガティブプロンプトに必ず組み込む
- 空間関係の「右・左」で正面構図を使わない（背面構図を使う）
- リファレンス画像は sRGB / 8-bit / EXIF削除済み で投入する

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【lesson_NN.json の vocab_type フィールド仕様】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  vocabulary 配列に以下のフィールドを追加:

  {
    "word": "雑誌",
    "reading": "ざっし",
    "en": "magazine",
    "imageId": "vocab_雑誌",
    "vocab_type": "concrete_object",          ← v2.3 新規フィールド
    "variant_grid_group": "print_media"       ← 省略可: 並置グリッドで使うグループ名
  }

  variant_grid_group の例:
    "print_media"      → 雑誌・本・新聞・ノート
    "payment_items"    → カード・財布・お金
    "digital_devices"  → ケータイ・パソコン・カメラ
    "transport"        → 車・電車・自転車・バス

━━━━━━━━━━━━━━━━━━━━━━━━━━━
【教科書別の固有名詞ハンドリング戦略（v2.2 から維持）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  共通原則: 教科書例文の固有名詞は lesson_NN.json に保持。
           画像プロンプトには絶対に固有名詞を書かない。
           画像は ROLE_BASED_GENERIC_PROFILES + generic_* キャラで描画。

  日本語の教え方ABC: 例文ごとにバラバラの人物名 → テキスト保持・画像は汎用人物
  みんなの日本語:    固定キャラあり → テキスト保持・画像は汎用人物
  げんき:           固定キャラあり → テキスト保持・画像は汎用人物
"""


## ============================================================
## END OF FILE
## ============================================================
##
## このファイルは画像生成系 SSOT（Single Source of Truth）です。
## 修正する際は必ず以下のルールに従ってください:
##   1. バージョン番号を更新（2.3 → 2.4 等）
##   2. 改訂履歴コメントに変更内容を追記
##   3. 派生物（image_prompts_lessonN.json）との整合性を確認
##
## 関連 SSOT:
##   - lesson_configs/lesson_NN.json（vocab_type フィールドを含む教育設計系 SSOT）
##   - design_tokens.json（デザイン系 SSOT）
##
## v2.3 新規追加の参照辞書:
##   - OBJECT_SIGNATURES    (PART 4.5): 物体識別シグネチャー
##   - SPATIAL_GRID_PATTERNS(PART 4.6): 空間構図パターン
##   - ARROW_SEMIOTICS      (PART 4.7): 矢印の意味分類
##   - ABSTRACT_METAPHORS   (PART 4.8): 抽象概念メタファー辞書
## ============================================================
