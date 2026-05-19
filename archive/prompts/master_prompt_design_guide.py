# 日本語教材イラスト生成 マスタープロンプト設計書
# Master Prompt Design Guide for Japanese Language Teaching Materials
# Version 2.2 | 2026-05-11 (Phase 1-F: 固定キャラ廃止 / ROLE_BASED_GENERIC_PROFILES 新設)

## ============================================================
## 改訂履歴
## ============================================================
##
## v1.0 (2026-05-04): 初版作成。資料①②③ をベースに STYLE_BIBLE / CHARACTER_PROFILES
##                    / PROMPT_TEMPLATES / BUILDING_CUES / VISUAL_SYMBOLS / QA_CHECKLIST
##                    / HOW_TO_USE の7部構成で策定。
##
## v2.0 (2026-05-07): 以下を追補。
##   - PART1 STYLE_BIBLE に Double-Hex Anchoring 厳密版(色名+#HEX+hex value 三重指定)
##   - PART1 STYLE_BIBLE に focal_length_standards(語彙85mm/例文50mm/建物35mm)
##   - PART2 CHARACTER_PROFILES に 6体追加(男の子・女の子・中年男女・高齢男女)
##   - PART2.5 FAMILY_TEMPLATES 新規追加(日本標準家族・3世代同居)
##   - PART3 PROMPT_TEMPLATES を 5ブロック構造に統一(PURPOSE/SUBJECT/SCENE & ACTION/STYLE RECIPE/CONSTRAINTS)
##   - PART3 vocabulary_building に「1語の看板」許容(横断論点β)
##   - PART4 BUILDING_CUES に signage_text フィールド追加(8建物分)
##   - PART6 QA_CHECKLIST に session_drift_check 追加(資料9 由来)
##   - PART8 GEMINI_STABILIZATION 新規追加(資料9 の運用ルール)
##   - PART9 HOW_TO_USE にキャラ追加・FAMILY_TEMPLATES の使い方を補記
##
## v2.1 (2026-05-07): キャラクター階層化(Layer 1/2/3)を導入。
##   - PART2 CHARACTER_PROFILES の全キャラに layer フィールド追加(primary/role_specific/generic)
##   - PART2 CHARACTER_PROFILES に 山田さん(会社員・Layer 2) を追加
##   - PART2 CHARACTER_PROFILES に 佐藤さん(医者・Layer 2) を追加
##   - PART9 HOW_TO_USE に教科書別 Layer 戦略を明文化
##     - 物語性なし教科書(ABC等): Layer 1 で教材システムが世界観を補う
##     - 物語性あり教科書(みんなの日本語・げんき等): Layer 1 を教科書キャラと同期
##   - 「textbook_character_mapping.json は Phase 4 で実装予定」を記録
##
## v2.2 (2026-05-11): Phase 1-F F-2 で固定キャラ概念を廃止。
##   - 廃止理由: lesson_02 v1.4(2026-05-11)で「固定キャラ廃止・教科書原典準拠(選択肢X)」を
##              確定し、lesson_01 v2.6 にも遡及適用(Phase 1-F F-1)。本ファイルもこれに整合させる。
##              ABC 教科書は物語性のない教材であり、固有名詞は画像と切り離すべき。
##              教師は授業中に学習者の実名で適宜置換する(教科書の意図)。
##              管理コスト > 教育的価値、将来の教材移行(げんき・みんなの日本語等)で
##              固定キャラが妨げになる。
##   主な変更:
##   - PART2 CHARACTER_PROFILES から Layer 1(田中先生・リンさん・ケリーさん)を削除
##   - PART2 CHARACTER_PROFILES から Layer 2(山田さん・佐藤さん)を削除
##   - PART2 の generic_* 8体は外見定義を維持(汎用シーン素材として有用)
##     ただし character_lock_phrase フィールドは削除(画像の人物一貫性は求めない)
##   - PART2.2 ROLE_BASED_GENERIC_PROFILES を新設
##     - 「先生役」「会社員役」「学生役」「医者役」「外国人役」等の役割ベースプロファイル
##     - 外見の固定なし・役割と一般的な服装・持ち物のヒントのみ
##     - 画像生成時は generic フラットベクター人物として描画(特定の人物像と紐付けない)
##   - PART9 HOW_TO_USE を全面改訂:
##     - Step 2 を「ROLE_BASED_GENERIC_PROFILES + generic_* キャラの活用」に再定義
##     - 「教科書別 Layer 戦略」セクションを「教科書別の固有名詞ハンドリング戦略」に書き換え
##   - 関連: vocab_selector.js の PERSON_PROFILES / CHARACTER_LOCKS も F-2b で修正済み
##   - 関連: SKILL.md v1.3(F-3)で固定キャラ廃止の方針を明文化
## ============================================================


## ============================================================
## このファイルの使い方
## ============================================================
##
## 全課共通のプロンプト設計ルールを定義したマスタードキュメントです。
## 新しい課の image_prompts_lesson_X.json を作成する際は、
## 必ずこのファイルの STYLE_BIBLE と ROLE_BASED_GENERIC_PROFILES を参照してください。
##
## v2.2 (Phase 1-F) より、固定キャラ概念は廃止されました。
## 人物画像は ROLE_BASED_GENERIC_PROFILES(役割ベース)と generic_* キャラ(汎用)を
## 組み合わせて生成し、特定の固有名詞(田中先生・リンさん 等)とは紐付けません。
##
## 資料出典:
##   資料5「Gemini 2.5 Flash Imageで同一キャラクターの外見を一貫させる実務ガイド」
##   資料6「AI画像生成におけるフラットベクターイラストのスタイル一貫性維持」
##   資料7「語学教材向けイラストのデザイン原則とAI画像生成プロンプトへの応用」
##   資料8「日本語教材向けに建物画像を分かりやすく生成する方法」
##   資料9「Gemini教材イラスト安定生成テクニック」 (v2 で統合)
## ============================================================


## ============================================================
## PART 1: STYLE BIBLE(全画像に必ず埋め込む固定フレーズ)
## ============================================================
##
## 資料6より: スタイル固定フレーズは5〜7トークン以内に収め、
## プロジェクト完了まで一言一句変えずに使用すること。
## 同義語の言い換えはスタイルドリフトの原因になる。
##
## 資料9より: 色は色名+#HEX+hex value の三重指定で安定化(Double-Hex Anchoring)。
##           焦点距離も明示することでパース歪みのハルシネーションを抑制する。
## ============================================================

STYLE_BIBLE = {

  ## 全画像共通の固定フレーズ(変更厳禁)
  "core_style": "Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.",

  ## カラーパレット(大人・混合クラス向け: 資料6の「大人向けパレット」より)
  ## 理由: 資料7より、大人向けは落ち着いたミュートカラーが認知負荷を下げる
  ## v2: Double-Hex Anchoring 厳密版(色名 + similar to #HEX + hex value 三重指定)
  "color_palette": {
    "background":  "Soft cream white, similar to #FBFBFB, hex value FBFBFB",
    "outline":     "Deep slate navy, similar to #1B2C40, hex value 1B2C40",
    "main_color":  "Muted warm blue, similar to #4A7FB5, hex value 4A7FB5",
    "accent":      "Warm amber gold, similar to #FAD141, hex value FAD141",
    "sub_color":   "Cool slate gray, similar to #6B7C85, hex value 6B7C85",
    "skin_tones":  "Naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults",
    "note": "Double-Hex Anchoring(資料9 1節): 色名 + similar to #HEX + hex value の三重指定で色ブレを最大限防止。LLMはHEX値をテキストトークンとして処理するため、複数フォーマットで同じ色情報を冗長に与えることで視覚的潜在空間への翻訳精度を高める。"
  },

  ## 焦点距離標準化(資料9 2節)
  ## v2 新規追加: フレーム占有率と組み合わせて空間的安定性を確保
  "focal_length_standards": {
    "vocabulary_card_focal_length": "85mm portrait lens equivalent, orthographic projection acceptable to completely eliminate perspective distortion",
    "example_image_focal_length":   "50mm standard lens equivalent, natural perspective close to human field of view",
    "building_image_focal_length":  "35mm wide-angle lens equivalent, captures surrounding environment context",
    "occupancy_percentages": {
      "vocabulary_card": "Subject occupies 70-80% of the frame",
      "example_image":   "Characters occupy 60% of the frame",
      "building_image":  "Building occupies 70% of the frame, with negative space in the top third for typography"
    },
    "note": "資料9 2節: 焦点距離が欠落すると、モデルはパース(遠近感)の歪みをハルシネーションとして追加してしまう。アスペクト比とフレーム占有率は独立した変数として両方を同時に制御する。"
  },

  ## 語彙カード(1:1)専用スタイル
  ## 資料7より: 語彙カードは極低情報量・純白背景・単一被写体に特化
  "vocabulary_card_style": "Solid white background. Single centered subject only. Full-body shot for characters, straight-on view for buildings. No background elements, no secondary objects. The subject must fill 70-80% of the frame.",

  ## 例文画像(16:9)専用スタイル
  ## 資料7より: 文のS+V+O関係が視覚的に明確であること
  "example_image_style": "Clean minimal background with only essential context. Characters take up the majority of the frame. Eye-level front or slight three-quarter view. Straight vertical lines for buildings. Soft natural indoor or outdoor daylight.",

  ## 全画像共通の制約(最後に必ず追加)
  ## 注意: vocabulary_building テンプレートのみ「1語の看板」を例外として許容(横断論点β)
  "constraints": "No text, no letters, no numbers, no symbols inside the image.",

  ## プロンプト末尾に付ける「ブランド宣言文」(資料6より)
  "brand_declaration": "Keep line weights consistent. Generate as if this is part of a unified educational brand style guide."
}


## ============================================================
## PART 2: CHARACTER PROFILES(汎用キャラの外見定義)
## ============================================================
##
## 資料5より: 同一画面内の人物表現は一貫させる(ファミリールック・服装トーン)。
## 資料7より: 多文化対応・ステレオタイプ排除・自然な多様性を確保する。
##
## v2.2 (Phase 1-F・2026-05-11): 固定キャラ概念を廃止。
##   理由:
##     - lesson_02 v1.4 で「固定キャラ廃止・教科書原典準拠(選択肢X)」を確定
##     - ABC 教科書は物語性のない教材であり、固有名詞は画像と切り離すべき
##     - 教師は授業中に学習者の実名で適宜置換する(教科書の意図)
##     - 管理コスト > 教育的価値(マンツーマン授業では教師本人がいる)
##     - 将来の教材移行(げんき・みんなの日本語等)で固定キャラが妨げになる
##
##   削除されたキャラ(履歴):
##     - Layer 1: 田中先生・リンさん・ケリーさん(主要キャラ)
##     - Layer 2: 山田さん・佐藤さん(職業特化)
##     これらは v2.1 まで character_lock_phrase で外見を固定していたが、
##     v2.2 では役割(先生・会社員・学生・医者・外国人)として
##     ROLE_BASED_GENERIC_PROFILES(PART 2.2)で抽象化された。
##
##   残された定義(本セクション):
##     - generic_* 8体(成人男女・中年男女・高齢男女・男の子・女の子)
##     - これらは「汎用シーン素材」として有用(背景人物・群衆・家族構成など)
##     - ただし character_lock_phrase は削除(画像の人物一貫性は求めない)
##     - fixed_features は外見描写の参考ヒントとして残す(必要に応じてプロンプトに採用)
##
##   layer フィールドは互換性のため残置するが意味は「generic」のみ存在する。
##
## ============================================================

CHARACTER_PROFILES = {

  ## ─────────────────────────────────────────────
  ## 汎用キャラ(8体)— あらゆるシーンで使用可能な役者
  ## ─────────────────────────────────────────────
  ## v2.2 (Phase 1-F) より、固定キャラ(田中先生・リンさん・ケリーさん・
  ## 山田さん・佐藤さん)は廃止された。本セクションは「汎用人物素材」として
  ## 機能する。語彙カード(男の人・女の人・子ども・お母さん 等)や、
  ## 背景人物・家族シーン・群衆描写などで使用する。
  ## 役割(先生・会社員・医者 等)に応じた一般的な服装・持ち物のヒントは
  ## PART 2.2 ROLE_BASED_GENERIC_PROFILES を参照すること。
  ## ─────────────────────────────────────────────

  "generic_male_adult": {
    "role": "男の人(汎用成人男性)",
    "layer": "generic",
    "gender": "male",
    "age_range": "30s",
    "fixed_features": {
      "face":        "pleasant approachable face with dark eyes and a relaxed friendly smile",
      "hair":        "short neat dark brown hair",
      "skin":        "warm medium skin tone",
      "outfit":      "casual everyday clothes — simple shirt and trousers",
      "build":       "average height and build"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression"],
    "notes": "「男の人」の語彙カードや汎用シーンで使用。家族設定では兄・若い父親役として登場可能。"
  },

  "generic_female_adult": {
    "role": "女の人(汎用成人女性)",
    "layer": "generic",
    "gender": "female",
    "age_range": "30s",
    "fixed_features": {
      "face":        "warm friendly face with dark brown eyes and a natural gentle smile",
      "hair":        "medium length dark brown hair worn loose",
      "skin":        "warm medium skin tone",
      "outfit":      "casual everyday clothes — simple blouse and trousers",
      "build":       "average height and build"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression"],
    "notes": "「女の人」の語彙カードや汎用シーンで使用。家族設定では姉・若い母親役として登場可能。"
  },

  ## v2 新規追加: 子ども(男の子)
  "generic_boy": {
    "role": "男の子(汎用子ども)",
    "layer": "generic",
    "gender": "male",
    "age_range": "8-10 (elementary school age)",
    "fixed_features": {
      "face":        "round cheerful face with big bright dark eyes and a wide playful smile",
      "hair":        "short slightly messy black hair",
      "skin":        "warm medium skin tone",
      "outfit":      "casual children's clothes — simple t-shirt and shorts, sneakers",
      "build":       "small child proportions, head approximately 1/5 of total body height"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "items held (backpack/randoseru, ball, pencil, books)"],
    "notes": "「子ども」「男の子」「学校」「家族」関連で使用。家族設定時は generic_male_middle / generic_female_middle と肌色を揃える(warm medium skin tone)。学校シーンではランドセル背負いも可。"
  },

  ## v2 新規追加: 子ども(女の子)
  "generic_girl": {
    "role": "女の子(汎用子ども)",
    "layer": "generic",
    "gender": "female",
    "age_range": "8-10 (elementary school age)",
    "fixed_features": {
      "face":        "round cheerful face with big bright dark eyes and a sweet playful smile",
      "hair":        "shoulder-length dark brown hair, often tied in two pigtails or worn loose",
      "skin":        "warm medium skin tone",
      "outfit":      "casual children's clothes — simple t-shirt or blouse with skirt or shorts, sneakers",
      "build":       "small child proportions, head approximately 1/5 of total body height"
    },
    "allowed_changes": ["scene", "pose", "hair style (loose / pigtails / one ponytail)", "specific clothes color", "expression", "items held"],
    "notes": "「子ども」「女の子」「学校」「家族」関連で使用。家族設定時は generic_male_middle / generic_female_middle と肌色を揃える(warm medium skin tone)。"
  },

  ## v2 新規追加: 中年男性(父親世代)
  "generic_male_middle": {
    "role": "中年男性(汎用・父親世代)",
    "layer": "generic",
    "gender": "male",
    "age_range": "40s-50s",
    "fixed_features": {
      "face":        "calm reliable face with dark eyes, mild smile lines around the eyes, and a steady warm expression",
      "hair":        "short neat dark brown or black hair, slight gray at the temples",
      "skin":        "warm medium skin tone",
      "outfit":      "casual smart everyday clothes — collared shirt or simple sweater with trousers",
      "build":       "average height, slightly fuller build than generic_male_adult"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "glasses on/off"],
    "notes": "「お父さん」「中年男性」関連で使用。家族設定では父親役として中心人物。generic_female_middle と肌色を揃え、夫婦として組み合わせ可能。"
  },

  ## v2 新規追加: 中年女性(母親世代)
  "generic_female_middle": {
    "role": "中年女性(汎用・母親世代)",
    "layer": "generic",
    "gender": "female",
    "age_range": "40s-50s",
    "fixed_features": {
      "face":        "warm caring face with dark brown eyes, mild smile lines around the eyes, and a gentle expression",
      "hair":        "medium length dark brown hair, often tied back or worn in a soft layered style, slight gray strands acceptable",
      "skin":        "warm medium skin tone",
      "outfit":      "casual smart everyday clothes — simple blouse with trousers or modest skirt",
      "build":       "average height, slightly fuller build than generic_female_adult"
    },
    "allowed_changes": ["scene", "pose", "hair style (tied back / loose)", "specific clothes color", "expression"],
    "notes": "「お母さん」「中年女性」関連で使用。家族設定では母親役として中心人物。generic_male_middle と肌色を揃え、夫婦として組み合わせ可能。"
  },

  ## v2 新規追加: 高齢男性(おじいさん)
  "generic_male_senior": {
    "role": "高齢男性(汎用・おじいさん)",
    "layer": "generic",
    "gender": "male",
    "age_range": "60s-70s",
    "fixed_features": {
      "face":        "kind weathered face with gentle dark eyes, visible smile lines and crow's feet, and a peaceful warm expression",
      "hair":        "short neat fully gray or white hair, sometimes thinning slightly",
      "skin":        "warm medium skin tone with natural age signs",
      "outfit":      "comfortable everyday clothes — collared shirt with simple cardigan or vest, relaxed trousers",
      "build":       "slightly shorter and slimmer build than younger adults, gentle posture"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "glasses on/off", "walking stick or cane present"],
    "notes": "「おじいさん」「祖父」関連で使用。家族設定では祖父役。generic_female_senior と組み合わせて夫婦として登場可能。肌色は warm medium で他世代と統一。"
  },

  ## v2 新規追加: 高齢女性(おばあさん)
  "generic_female_senior": {
    "role": "高齢女性(汎用・おばあさん)",
    "layer": "generic",
    "gender": "female",
    "age_range": "60s-70s",
    "fixed_features": {
      "face":        "kind warm face with gentle dark eyes, visible smile lines, soft cheeks, and a peaceful caring expression",
      "hair":        "short or medium-length fully gray or white hair, often worn in a neat style",
      "skin":        "warm medium skin tone with natural age signs",
      "outfit":      "comfortable everyday clothes — simple blouse with cardigan and modest trousers or long skirt",
      "build":       "slightly shorter and slimmer build than younger adults, gentle posture"
    },
    "allowed_changes": ["scene", "pose", "hair style (loose / tied back)", "specific clothes color", "expression", "glasses on/off"],
    "notes": "「おばあさん」「祖母」関連で使用。家族設定では祖母役。generic_male_senior と組み合わせて夫婦として登場可能。肌色は warm medium で他世代と統一。"
  },

}


## ============================================================
## PART 2.2: ROLE_BASED_GENERIC_PROFILES(役割ベースの汎用人物プロファイル)
## ============================================================
##
## v2.2 (Phase 1-F・2026-05-11) 新規追加。
##
## 固定キャラ(田中先生・リンさん・ケリーさん・山田さん・佐藤さん)を廃止した代わりに、
## 「役割」ベースで人物画像生成のヒントを提供するセクション。
##
## 設計原則:
##   - 固有の外見(顔・髪・肌色・固有名詞)は固定しない
##   - 役割(role)に応じた一般的な服装・持ち物・場面のヒントのみ提供
##   - 画像生成時は generic フラットベクター人物として描画(特定の人物像と紐付けない)
##   - 教師は授業中に学習者の実名で適宜置換するため、画像にも特定名前を埋め込まない
##
## 使い方:
##   image_prompts_lessonN.json の人物画像プロンプトに以下を組み合わせる:
##     1. STYLE_BIBLE の固定フレーズ(必須)
##     2. CHARACTER_PROFILES の generic_* キャラから 1 体選択(年齢層・性別)
##     3. ROLE_BASED_GENERIC_PROFILES から「役割」を選択し、outfit_hints / scene_hints
##        を取り入れる(服装・持ち物・場面)
##     4. その人物に名前(田中・リン 等)を付けない
##        Gemini プロンプトに固有名詞(Yamada-san, Tanaka-sensei 等)も書かない
##
## 例:
##   lesson_01 p3-1 「Aさんは会社の会社員です。」の画像生成:
##     - STYLE_BIBLE: flat vector illustration, ...
##     - CHARACTER_PROFILES["generic_male_adult"] の fixed_features を採用
##     - ROLE_BASED_GENERIC_PROFILES["company_employee"] の outfit_hints を採用
##       (navy/gray business suit, white shirt, simple necktie)
##     - 名前は付けない(画像内のテキストにも Yamada とは書かない)
##
## ============================================================

ROLE_BASED_GENERIC_PROFILES = {

  "teacher": {
    "role_ja": "先生",
    "role_en": "teacher",
    "description_ja": "学校・大学・語学教室などの先生役。授業を教える場面、ホワイトボードの前に立つ場面、生徒と話す場面で使用。",
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
    "lesson_appearances": "lesson_01 (p1 「先生」語彙・p1-1「鈴木さんは先生です」・p3-2「Bさんは学校の先生です」)",
    "notes": "性別・年齢は自由。汎用人物素材から組み合わせる。固有名詞(田中先生・鈴木さん 等)はテキスト側のみで使用し、画像には埋め込まない。"
  },

  "company_employee": {
    "role_ja": "会社員",
    "role_en": "company employee / office worker",
    "description_ja": "オフィス・会社・銀行・デパートなどに勤める会社員役。スーツ姿でビジネスバッグを持つ場面が多い。",
    "outfit_hints": [
      "navy blue or charcoal gray business suit",
      "white shirt or blouse with a simple necktie or scarf",
      "may carry a briefcase, laptop bag, or documents",
      "small wristwatch acceptable"
    ],
    "scene_hints": [
      "in front of an office building or company entrance",
      "at a desk with a laptop and documents",
      "in front of a bank or department store building"
    ],
    "lesson_appearances": "lesson_01 (p1 「会社員」語彙・p3-1/3-3/3-5「Aさんは...の会社員です」)",
    "notes": "性別は自由(教科書の Aさんは性別不定)。建物との組み合わせ(さくら銀行・さくらデパート等)では建物画像とサイズ感を合わせる。"
  },

  "student": {
    "role_ja": "学生",
    "role_en": "student",
    "description_ja": "大学生・専門学校生・語学学校生など。リュック・ノート・教科書を持つ場面が多い。",
    "outfit_hints": [
      "casual everyday clothes — t-shirt or sweater with jeans or chinos",
      "may wear a hoodie, jacket, or simple coat depending on season",
      "carrying a backpack (often large), notebook, or smartphone"
    ],
    "scene_hints": [
      "in front of a university or school building",
      "at a desk with notebooks and laptop",
      "walking on campus or in a hallway"
    ],
    "lesson_appearances": "lesson_01 (p1 「学生」語彙・p2-1「リンさんは先生ですか」・p3-4「リンさんはさくら大学の学生です」)",
    "notes": "若年〜20代前半の年齢層を想定。教科書の「リンさん」等は固有名詞だが、画像には名前を埋め込まず汎用学生として描画する。"
  },

  "doctor": {
    "role_ja": "医者",
    "role_en": "doctor",
    "description_ja": "病院・診療所などで働く医者役。白衣・聴診器・名札が定番の装い。",
    "outfit_hints": [
      "white doctor's coat (open at the front) over a simple blouse or shirt",
      "stethoscope around the neck",
      "name badge clipped to the coat (no specific name written)",
      "may carry a clipboard, otoscope, or pen"
    ],
    "scene_hints": [
      "in a clinic or hospital room with examination table",
      "at a desk with medical chart",
      "in front of a hospital building (with cross sign or 病院 signage)"
    ],
    "lesson_appearances": "lesson_01 (p1 「医者」語彙)",
    "notes": "性別は自由(医療職の多様性を表現するため女性も積極的に採用)。名札の名前は判読不能な記号で代用(固有名詞を埋め込まない)。"
  },

  "foreigner": {
    "role_ja": "外国人",
    "role_en": "foreigner / non-Japanese person",
    "description_ja": "日本語学習者の代表として登場する外国人役。多文化・多人種の多様性を表現する。",
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
    "notes": "肌色・髪色・目の色は意図的に多様化させる(画像セット全体で偏りが出ないよう注意)。特定の国籍を示唆する民族服やステレオタイプ的な装飾は避ける。"
  }

}


## ============================================================
## PART 2.5: FAMILY TEMPLATES(家族構成テンプレート)
## ============================================================
##
## v2 新規追加: N5「私の家族」「家族紹介」など家族関連の語彙・例文で使用。
## 同一家族として登場させる際は、以下のテンプレートを参照することで
## 視覚的な一貫性(同じ肌色・似た髪色・統一感のある服装トーン)を維持する。
##
## ファミリールック原則:
## 1. 全員の skin tone を同一に揃える(warm medium skin tone)
## 2. 髪色も近いトーンに揃える(濃いブラウン〜黒の範囲)
## 3. 服装は世代別の典型(子=カジュアル、中年=スマートカジュアル、高齢=落ち着いた色)
## ============================================================

FAMILY_TEMPLATES = {

  ## 標準的な3世代核家族(N5 で最も使用頻度が高い)
  "standard_three_generation_family": {
    "description": "祖父母・両親・子ども2人の3世代6人家族。N5「私の家族」で標準的に使用。",
    "members": {
      "grandfather": "generic_male_senior",
      "grandmother": "generic_female_senior",
      "father":      "generic_male_middle",
      "mother":      "generic_female_middle",
      "older_child": "generic_boy",
      "younger_child": "generic_girl"
    },
    "consistency_rules": [
      "All family members share warm medium skin tone for visual consistency",
      "Hair colors stay within dark brown to black range (gray for seniors)",
      "Outfit color tones harmonize across the family (avoid clashing brights)"
    ],
    "notes": "祖父母+両親+兄妹の典型構成。男女のバランスも取れている。"
  },

  ## 核家族(両親 + 子ども2人)
  "nuclear_family": {
    "description": "両親と子ども2人の4人家族。日課・買い物などのシーンで頻出。",
    "members": {
      "father":      "generic_male_middle",
      "mother":      "generic_female_middle",
      "son":         "generic_boy",
      "daughter":    "generic_girl"
    },
    "consistency_rules": [
      "All family members share warm medium skin tone",
      "Hair colors stay within dark brown to black range"
    ],
    "notes": "祖父母を含まない4人家族。日常シーンに適する。"
  },

  ## 若い家族(若い両親 + 幼児)
  "young_family": {
    "description": "若い両親と子ども1〜2人の家族。買い物・公園シーンで使用。",
    "members": {
      "father":      "generic_male_adult",
      "mother":      "generic_female_adult",
      "child":       "generic_boy"
    },
    "consistency_rules": [
      "All family members share warm medium skin tone",
      "Parents look age-appropriate (30s) — younger than middle-aged"
    ],
    "notes": "両親を generic_*_adult にすることで若い家族を表現。子は1人でも複数でも可。"
  },

  ## 拡張家族(v2.2 で固定キャラ廃止に伴い再定義)
  "extended_family_template": {
    "description": "中心人物(generic_* キャラから 1 体選択)を起点に親族を追加するテンプレート。v2.2 (Phase 1-F) で固定キャラ廃止に伴い、特定の名前付きキャラ前提を撤廃。",
    "usage": "例: ある家族の物語シーン(例文「これは私の家族です」等)を描く場合、まず中心人物を generic_* から選択(例: generic_female_adult)し、その肌色を基準に父=generic_male_middle・母=generic_female_middle・祖父=generic_male_senior 等で構成する。",
    "consistency_rules": [
      "The center person's skin tone determines the family's skin tone (all family share the same warm medium / warm light olive tone)",
      "Hair colors should be in the same family of tones",
      "Override generic_*_middle/senior skin tone to match the center person if needed"
    ],
    "_v2_2_note": "v2.1 までは『田中先生の家族』『リンさんの家族』等を描く前提だったが、v2.2 で固定キャラを廃止したため、家族シーンは generic_* キャラのみで構成する。教科書例文に固有名詞が含まれる場合も、画像生成プロンプトには固有名詞を書かない。"
  }
}


## ============================================================
## PART 3: PROMPT TEMPLATES(画像種類別テンプレート)
## ============================================================
##
## 資料7より: 画像の種類(語彙カード・例文・場面)ごとに
## 最適な構成・情報量・スタイルが異なる。
## 資料6より: プロンプトは 5 ブロック構造で書く(v2 で統一):
##   ①PURPOSE   ②SUBJECT   ③SCENE & ACTION   ④STYLE RECIPE — DO NOT CHANGE   ⑤CONSTRAINTS
##
## v2: 全テンプレートを5ブロック構造に統一。vocabulary_building には
##     横断論点β「1語の看板OK」を反映。
## ============================================================

PROMPT_TEMPLATES = {

  ## ─────────────────────────────────────────────
  ## テンプレートA: 語彙カード・人物(1:1)
  ## ─────────────────────────────────────────────
  "vocabulary_person": """
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The image must instantly communicate the meaning of the word "[TARGET_WORD]" at a glance.

[SUBJECT]
{CHARACTER_LOCK_PHRASE}

[SCENE & ACTION]
{CHARACTER_ACTION_AND_POSE}
Full-body shot. The character is centered in the frame and fills 70-80% of the image area.
Eye-level camera angle, 85mm portrait lens equivalent (orthographic projection acceptable).
Solid white background. No other characters or objects in the frame.

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
  ## テンプレートB: 語彙カード・建物(1:1)
  ## ─────────────────────────────────────────────
  ## 資料8より: 入口設備+利用者行動+周辺アンカーの3点セット
  ## 資料7より: カノニカルアングル(正面またはやや斜め前)が識別に最適
  ## v2: 横断論点β を反映 — 「1語の看板」だけは例外として許容
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
Pale blue or soft cream sky background (Gemini does not support transparent backgrounds reliably).

Functional cues — 3 anchors required (per 資料8):
- Entrance cue: [{ENTRANCE_CUE}]
- User action cue: [{USER_ACTION_CUE}]
- Surrounding anchor: [{SURROUNDING_ANCHOR}]

The building fills 70% of the frame. Negative space in the top one-third for typography.
Entrance and functional cues are clearly visible. No extreme wide angle.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white or pale sky-blue background,
deep slate navy outlines (similar to #1B2C40, hex value 1B2C40), muted warm colors for the building facade,
warm amber gold (similar to #FAD141, hex value FAD141) for accent details.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
EXCEPTION (per 資料8): A single short Japanese building name signage [{SIGNAGE_TEXT}] is permitted —
limited to ONE word only (e.g. 「銀行」「大学」「会社」), small, mounted on the building entrance.
No other text, letters, numbers, or symbols anywhere in the image. No English text.
No gradients, no shadows, no 3D effects.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートC: 例文画像(16:9)
  ## ─────────────────────────────────────────────
  ## 資料7より: S+V+O 関係が明確。主語・動詞・目的語の関係を構図で表現。
  ## 資料7より: 視覚的慣習(矢印・○×・?マーク)を積極的に使う。
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
"""
}


## ============================================================
## PART 4: BUILDING CUES REFERENCE(建物別・機能手掛かり一覧)
## ============================================================
##
## 資料8より:
## 建物識別には「入口設備・利用者行動・周辺アンカー」の3点セットが必須。
## 以下を各課のJSONプロンプトに組み込むこと。
##
## v2 新規追加: 各建物に signage_text フィールドを追加(横断論点β)。
## vocabulary_building テンプレートで使用される「1語の看板」の文言を定義。
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
## PART 5: VISUAL SYMBOLS(視覚的慣習シンボル一覧)
## ============================================================
##
## 資料7より: 動詞・質問・肯否などを静止画で表現するための視覚的慣習。
## 「矢印は動詞である」「○×は肯否である」
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
## PART 6: QA CHECKLIST(生成後の品質チェックリスト)
## ============================================================
##
## 資料5より: QAでは「本人性の固定要素8項目」を毎回確認する。
## 資料6より: スタイルドリフトの兆候に早期対応する。
## 資料7より: 認知負荷のチェックも含める。
## v2 追加(資料9): セッションドリフトのチェック項目を追加。
## ============================================================

QA_CHECKLIST = {

  "character_consistency": [
    "顔の形が前回と一致しているか",
    "髪型・髪の長さが一致しているか",
    "髪の色が一致しているか",
    "目の色が一致しているか",
    "肌の色が一致しているか",
    "特徴的なパーツ(ほくろ・眼鏡等)が一致しているか",
    "服装の色・スタイルが一致しているか",
    "体型・シルエットが一致しているか"
  ],

  "style_consistency": [
    "フラットベクタースタイルが維持されているか(グラデーション・影が入っていないか)",
    "輪郭線の太さが均一か",
    "カラーパレットが規定の色調か",
    "背景が指定通りか(語彙カードは白、例文は最小限、建物はパールスカイブルー)",
    "文字・数字・記号が画像内に入っていないか(建物の1語看板を除く)"
  ],

  "educational_effectiveness": [
    "その画像が何を意味するか、1秒以内に判断できるか(Glanceability)",
    "語彙カード: 背景に不要な要素が入っていないか",
    "例文画像: S+V+O の関係が視覚的に明確か",
    "建物: 施設の種類が一目でわかるか(外観だけでなく機能が見えるか)",
    "多文化配慮: 特定の文化・人種のステレオタイプになっていないか"
  ],

  ## v2 新規追加(資料9 由来): セッションドリフトのチェック
  "session_drift_check": [
    "1ターン目には無かった微細なディテール(衣服のシワ・髪のグラデーション・不要な背景オブジェクト)が自発的に追加されていないか",
    "線画の太さがターン1から変動していないか(過剰に細かくスケッチ風になっていないか)",
    "色相がターン1のリファレンス画像と一致しているか(色シフトが起きていないか)",
    "フレーム占有率(語彙70-80% / 例文60% / 建物70%)が維持されているか"
  ],

  "regenerate_trigger": [
    "上記チェックリストの1つでもNGがあれば再生成対象とする",
    "再生成時は全文ゼロから書き直さず、崩れた属性だけを明示して修正する(資料5より)",
    "セッションドリフトが検知されたら、そのセッションを破棄し新規セッションを開始(資料9 3節)"
  ]
}


## ============================================================
## PART 7: GEMINI STABILIZATION(資料9 の運用ルール) ⭐ v2 新規
## ============================================================
##
## 資料9「Gemini教材イラスト安定生成テクニック」より:
##
## 数十枚規模のプロトタイプ作成では、基礎的なプロンプト構造で十分な結果が得られる。
## しかし、第2課以降における 100 枚以上の量産フェーズに移行すると、
## 拡散モデル特有の数学的限界が顕在化する:
##   - 色空間の平均化現象(カラーブリーディング)
##   - マルチターンセッションにおけるトークンアテンションの希釈(スタイルドリフト)
##   - 空間的配置のランダムな揺らぎ
##
## 本セクションは、これらの課題を克服し、ミニマルなフラットベクター制約下で
## 同一キャラクターを長期間にわたって再生産するための運用フレームワーク。
## ============================================================

GEMINI_STABILIZATION = {

  ## ─────────────────────────────────────────────
  ## 7.1 セッションマネジメント(資料9 3節)
  ## ─────────────────────────────────────────────
  ## マルチターンセッションのトークンアテンション希釈への対処。
  ## ─────────────────────────────────────────────
  "session_management": {
    "max_turns_per_session": 4,
    "rationale": "Gemini 2.5 Flash Image は 65,536 トークンの広大なコンテキストウィンドウを持つが、セッションが長引くにつれて過去の画像・指示がバッファに蓄積。モデルは厳格な STYLE_BIBLE トークンと後続のマイナー変更指示を数学的に平均化しようとし、基本スタイル制約へのアテンションが低下してドリフトが発生する。",

    "drift_detection_signals": [
      "ターン1には存在しなかった微細なディテール(衣服のシワ等)が自発的に追加され始める",
      "線画が過剰に細かくスケッチ風になる",
      "存在しないはずの 3D 的な陰影(シェーディング)や髪の毛のハイライトが追加される",
      "キャラクターの中核アイデンティティ(顔の骨格・目の形)が変質し始める",
      "色相が初回生成時と微妙にずれていく(特にスキントーン・衣服の色)"
    ],

    "early_warning_checkpoint": "1セッション内で4回目のプロンプト送信前に必ず上記5点をチェック。1つでも該当したら即座にセッションを破棄。",

    "session_reset_protocol": {
      "step_1": "現セッションを破棄(継続して画像生成を試みない)",
      "step_2": "これまでに生成した中で最もスタイルが純粋で完璧な画像を「リファレンス画像」として選定",
      "step_3": "新規セッションを開始し、リファレンス画像を1枚だけ投入",
      "step_4": "下記の reset_prompt_template を使って絶対的な基盤プロンプトを再送信",
      "step_5": "新規セッションで最初の画像を生成し、リファレンスからのドリフトがないことを確認してから本作業に進む"
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

  ## ─────────────────────────────────────────────
  ## 7.2 カラースペース運用(資料9 1節)
  ## ─────────────────────────────────────────────
  ## sRGB 色空間統一・参照画像の前処理。
  ## ─────────────────────────────────────────────
  "color_space_protocol": {
    "color_space": "sRGB only",
    "reason_to_avoid_other_spaces": "Display P3 / Adobe RGB で保存された参照画像は、Gemini が予測不可能な形で色空間を平均化処理してしまい、スキントーンや衣服の色にシフトを引き起こす。GeminiのAPIおよび生成パイプラインはネイティブにsRGB色空間を前提として最適化されている。",

    "exif_handling": "リファレンス画像のEXIFメタデータは投入前に必ず削除する。EXIF内の color profile 情報がモデルの判断に影響する場合がある。",

    "bit_depth": "8-bit sRGB に変換してから投入する(16-bit や HDR は投入しない)",

    "preprocessing_workflow": [
      "1. 参照画像を画像編集ツールで開く",
      "2. 「sRGB IEC61966-2.1」プロファイルに変換",
      "3. 8-bit に変換(必要に応じて)",
      "4. EXIF メタデータを削除(エクスポート時に「メタデータを保存しない」を選択)",
      "5. PNG または高品質 JPEG で保存"
    ]
  },

  ## ─────────────────────────────────────────────
  ## 7.3 量産ルール(資料9 全体運用)
  ## ─────────────────────────────────────────────
  ## 規模に応じた運用方針の使い分け。
  ## ─────────────────────────────────────────────
  "production_rules": {
    "small_scale": {
      "definition": "1課あたり数十枚以下(例: 第1課 18枚)",
      "approach": "基本プロンプト + STYLE_BIBLE + CHARACTER_PROFILES で安定生成可能",
      "session_management": "通常運用で問題なし。ただし4ターン超過時は念のためリフレッシュ"
    },
    "medium_scale": {
      "definition": "複数課にまたがる 50-100 枚規模",
      "approach": "上記 + Double-Hex Anchoring 厳密適用 + フレーム占有率の数値指定を必須化",
      "session_management": "2-3ターンごとに新規セッションを推奨"
    },
    "large_scale": {
      "definition": "100枚以上の本格量産フェーズ(N5全シラバス・複数課横断)",
      "approach": "GEMINI_STABILIZATION 全項目を厳格適用",
      "session_management": "1セッション最大4ターン厳守。ドリフト検知時は即座にリセット",
      "additional_safeguard": "QAチェックリストの session_drift_check を毎枚実施"
    },

    "session_boundary_triggers": [
      "4ターン目に達した時",
      "50枚生成した時",
      "ドリフト検知信号が1つでも観察された時",
      "新しいキャラクターを初投入する時(既存キャラとの分離のため)",
      "新しい背景タイプ(屋内→屋外等)に切り替える時"
    ]
  },

  ## ─────────────────────────────────────────────
  ## 7.4 症状→原因→対処プロンプト(資料9 全体構造)
  ## ─────────────────────────────────────────────
  ## 課題別の整理: 症状を観察したら、原因を理解し、対処プロンプトで修正。
  ## ─────────────────────────────────────────────
  "symptom_cause_remedy": {

    "color_drift": {
      "symptom": "同一キャラクターの衣服や同一の背景要素が、生成のたびに微妙に異なる色相・彩度・明度で出力される。プロンプトで HEX 値を指定しているにもかかわらず、その色が無視される、あるいは意図した色よりくすんだ色合いで再現される。完全なベタ塗りが求められる領域に意図しないグラデーションや陰影が混入する(カラーブリーディング)。",
      "cause": "(1) LLM は HEX コードを直接的な RGB ピクセル値ではなく英数字テキストトークンとして処理し、視覚的潜在空間へ確率的に翻訳する。(2) Gemini はデフォルトで現実世界の物理法則(ライティング・シャドウ)をシミュレートするルーチンを適用してしまう。(3) 入力リファレンス画像が Display P3 等の異なる色空間で保存されている場合、予測不可能な色平均化が発生する。",
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
Completely prevent any color bleeding, texture blending, or environmental light interference.
"""
    },

    "spatial_drift": {
      "symptom": "生成のたびにキャンバスに対する被写体(キャラクター)の相対的なサイズが激しく変動する。「画面の左側に配置」と指定してもキャラクターが中央や右側に移動してしまう。「正面」を指定しているにもかかわらず、わずかに俯瞰やあおりの視点になり、フラットベクター特有の平面的でミニマルな美観が損なわれる。",
      "cause": "(1) 明示的な空間境界(バウンディングボックス)指定がない場合、モデルはアクション(動作)トークンに引きずられて自動的にフレーミングをクロップ最適化しようとする。(2)「左側に配置」といった言語指示は絶対座標指定ではなく弱い推奨事項として扱われやすい。(3) 焦点距離(focal length)パラメータが欠落していると、モデルはパースの歪みをハルシネーションとして追加してしまう。",
      "remedy_prompt": """
[CAMERA & SPATIAL CONTROL BLOCK]
Camera Setup: Absolute front-facing, eye-level angle. Use an 85mm portrait lens equivalent
and orthographic projection to completely eliminate perspective distortion and maintain a flat 2D vector look.

Framing & Spatial Locking:
- Subject 1 is firmly anchored on the strict left side of the frame.
- Subject 2 is firmly anchored on the strict right side of the frame.

Occupancy Percentage: The combined subjects must occupy exactly [70]% of the overall frame area.
Negative Space: Ensure an expansive empty negative space in the top one-third of the composition for future typography.
Do not crop the subjects' heads or feet; maintain a full-body or medium-long shot within the bounds.
"""
    },

    "style_drift": {
      "symptom": "同一セッション内で4回目や5回目の連続したプロンプトを送信したあたりから、本来「ミニマルなフラットベクター」であったはずの画風が徐々に崩壊し始める。具体的には、線画が過剰に細かくスケッチ風になったり、本来存在しないはずの 3D 的な陰影(シェーディング)や髪の毛のハイライトが追加されたり、キャラクターの中核アイデンティティ(顔の骨格)が変質していく。",
      "cause": "「トークンアテンションの希釈(Token Attention Dilution)」。セッションが長引くにつれて、過去の画像・テキスト指示がバッファに蓄積され、モデルがターン1の厳格な STYLE_BIBLE トークンと後続のマイナー変更指示を平均化しようとする。基本スタイル制約へのアテンションが低下してドリフトが発生する。",
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
## PART 8: HOW TO USE(新しい課のJSONを作るときの手順)
## ============================================================
## v2 で更新: キャラ追加・FAMILY_TEMPLATES・GEMINI_STABILIZATION の使い方を追記。
## v2.2 (Phase 1-F) で更新: 固定キャラ廃止に伴い Step 2 を全面再設計。
##                          ROLE_BASED_GENERIC_PROFILES の使い方を追加。
## ============================================================

HOW_TO_USE = """
【新しい課(例: 第2課)の image_prompts_lessonN.json を作るとき】

Step 1: この設計書の STYLE_BIBLE を確認する
  → "core_style" と "color_palette" と "constraints" は変更しない
  → v2: "focal_length_standards" を必ず参照(語彙85mm/例文50mm/建物35mm)

Step 2: 人物画像の設計(v2.2: 固定キャラ廃止に伴い再設計)
  → 例文や語彙カードに人物が登場する場合、以下の手順で設計する:

    Step 2-A: 役割(role)を特定する
      lesson_NN.json の examples[].sentence や vocabulary を見て、
      その人物の役割を特定する(先生・会社員・学生・医者・外国人 等)
      → 該当する ROLE_BASED_GENERIC_PROFILES のエントリを参照する
      → 例: "Aさんは会社の会社員です" → "company_employee"
      → 例: "鈴木さんは先生です" → "teacher"
      → 例: "リンさんはさくら大学の学生です" → "student"

    Step 2-B: 年齢層・性別を選択する
      CHARACTER_PROFILES の generic_* キャラから 1 体選択する。
      → generic_male_adult / generic_female_adult (30s 成人)
      → generic_male_middle / generic_female_middle (40s-50s 中年)
      → generic_male_senior / generic_female_senior (60s-70s 高齢)
      → generic_boy / generic_girl (子ども 8-10)
      性別は教科書例文の指示に従う(指示がなければ多様性を優先)。

    Step 2-C: outfit_hints / scene_hints を組み合わせる
      ROLE_BASED_GENERIC_PROFILES の選択した役割から outfit_hints と
      scene_hints をプロンプトに採用する。
      → 服装の固有名詞(Yamada-san, Tanaka-sensei 等)は絶対に書かない
      → 名札・名刺の文字は判読不能な記号で代用する

    Step 2-D: 同一画像セット内の整合性を確保する
      同じ役割の人物が複数の画像に登場する場合(例: lesson_01 p3-1/3-3/3-5
      の Aさん)、同じ generic_* キャラを採用して服装・髪型を揃える。
      ただし character_lock_phrase は使わない(v2.2 で削除済み)。
      整合性は「同じ generic_* キャラを選ぶ」「outfit_hints を同じセットで
      指定する」の 2 点で担保する。

  → v2: 固有名詞(田中先生・リンさん 等)はテキスト側のみで使用し、
        画像生成プロンプトには絶対に書かない。
        教師は授業中に学習者の実名で適宜置換するため、画像は汎用人物として描画する。

Step 3: 家族を描く場合は FAMILY_TEMPLATES を参照する
  → standard_three_generation_family / nuclear_family / young_family から選択
  → consistency_rules に従い、全員の skin tone を統一(warm medium skin tone)
  → v2.2: 名前付きキャラの家族 という概念は廃止された。家族は generic_* キャラの
    組み合わせで構成する。

Step 4: 語彙に合わせて PROMPT_TEMPLATE を選ぶ
  → 人物 → テンプレートA (vocabulary_person)
  → 建物 → テンプレートB (vocabulary_building) + BUILDING_CUES を参照
            v2: signage_text フィールドで「1語の看板」を指定(横断論点β)
  → 例文 → テンプレートC (example_sentence) + VISUAL_SYMBOLS を参照

Step 5: JSONのプロンプトを記述する
  → テンプレートの [ ] 部分を埋める
  → STYLE_BIBLE の固定フレーズは一言一句変えない
  → v2: 全テンプレートを 5 ブロック構造で統一([PURPOSE][SUBJECT][SCENE & ACTION][STYLE RECIPE][CONSTRAINTS])

Step 6: 生成時のセッション管理(v2 新規)
  → GEMINI_STABILIZATION の session_management に従う
  → 1セッション最大4ターンまで
  → ドリフト検知信号を観察したら即座にセッション破棄 → リセットプロトコル実行

Step 7: 生成後に QA_CHECKLIST で確認する
  → character_consistency 8項目 / style_consistency 5項目 / educational_effectiveness 5項目
  → v2 新規: session_drift_check 4項目を追加
  → v2.2: character_consistency の項目は「特定の人物が同じ顔・服装で描かれているか」
          ではなく「同じ役割の人物が一貫した服装・場面で描かれているか」に再解釈する
  → NGがあれば崩れた属性だけを明示して再生成する

【量産フェーズの判断基準(v2 新規)】

  small_scale (1課 数十枚以下):
    → 基本プロンプト + STYLE_BIBLE + ROLE_BASED_GENERIC_PROFILES + generic_* キャラ で OK
    → 第1課 18枚はこれに該当

  medium_scale (50-100枚):
    → Double-Hex Anchoring 厳密適用 + フレーム占有率の数値指定を必須化
    → 2-3 ターンごとに新規セッション

  large_scale (100枚以上、N5全シラバス・複数課横断):
    → GEMINI_STABILIZATION 全項目を厳格適用
    → 1セッション最大4ターン厳守 / QA session_drift_check を毎枚実施

【重要な注意事項】
- スタイル固定フレーズは同義語に言い換えない("flat" → "2D" などは禁止)
- セッションが長くなったら新規チャットを開始してリファレンス画像を再入力する
- キャラクターが崩れたときは「前回のベスト画像 + 崩れた属性だけ修正」で対応する
- v2: リファレンス画像は必ず sRGB / 8-bit / EXIF削除済み で投入する
- v2: 看板テキストは vocabulary_building テンプレートでのみ許容(他テンプレートは No text 厳守)
- v2.2: 画像プロンプトには固有名詞(Tanaka-sensei, Yamada-san, Rin-san 等)を絶対に書かない

【参照すべき外部ファイル】

  プロジェクトナレッジ内の Deep Research 資料:
    資料5: キャラクター一貫性
    資料6: フラットベクタースタイル一貫性
    資料7: 語学教材イラストのデザイン原則
    資料8: 建物画像生成
    資料9: Gemini安定化テクニック (v2 で本ファイルに統合)


【教科書別の固有名詞ハンドリング戦略(v2.2 で書き換え)】

  このプロジェクトは複数教科書への対応を想定している(lesson_NN.json の textbook_sources 配列)。
  v2.2 (Phase 1-F) で固定キャラ概念を廃止したため、教科書ごとの固有名詞の扱いは
  「Layer 戦略」ではなく「テキストと画像の分離戦略」として再定義する。

  共通原則(全教科書共通):
    - 教科書例文に登場する固有名詞(鈴木さん・ミラーさん・メアリー 等)は
      lesson_NN.json の examples[].sentence にそのまま保持する
    - originalSources[] フィールドで教科書原文を追跡する
    - 画像生成プロンプトには絶対に固有名詞を書かない
    - 画像は ROLE_BASED_GENERIC_PROFILES + generic_* キャラで描画する
    - 教師は授業中に学習者の実名で適宜置換する

  教科書1: 日本語の教え方ABC(物語性なし、単発キャラ多用)
    特徴: 例文ごとにバラバラの人物名(鈴木・キム・山本・ロペス 等)、
          または教科書記号(Aさん・Bさん)が登場。物語的な連続性はない。
    ハンドリング:
      - 教科書例文の固有名詞は lesson_NN.json にそのまま記載
      - 教科書記号(Aさん・Bさん)も同様にそのまま記載
      - 例文中で同じ役割が連続する場合(例: lesson_01 p3-1/3-3/3-5 の Aさん=会社員)
        画像生成では同じ generic_* キャラを採用して服装・場面を揃える

  教科書2: みんなの日本語(物語性あり、固定キャラあり)
    特徴: マイク・ミラー、木村いずみ、ワン、サントス 等の固定キャラが
          複数の課を通じて登場。物語的な連続性がある。
    ハンドリング:
      - 教科書のキャラ名(ミラーさん・木村さん 等)は examples[].sentence にそのまま記載
      - 画像は generic_* + ROLE_BASED_GENERIC_PROFILES で描画(固有名詞を画像に埋め込まない)
      - 同一キャラが複数の課に登場する場合は、最初に登場した時の generic_* 選択を
        メモして次回も同じ選択をする(整合性確保は教師の運用任せ)

  教科書3: げんき(物語性あり、固定キャラあり)
    特徴: メアリー、たけし、ロバート、けんいち 等の固定キャラが登場。
          学生中心の物語が展開する。
    ハンドリング:
      - 教科書2 と同じ原則(テキスト保持・画像は汎用人物で描画)
      - メアリー(外国人留学生役)は "foreigner" の役割で描画

  ※ Phase 4 で textbook_character_mapping.json を実装する場合、本セクションは
    再度書き換える。現時点では「固有名詞の保持(テキスト) vs 汎用人物描画(画像)」の
    2 層で運用する。

【廃止された概念(v2.1 → v2.2 移行ガイド)】

  v2.1 までの概念              | v2.2 での対応
  ─────────────────────────────┼──────────────────────────────────────────────
  Layer 1(田中・リン・ケリー)| 廃止。examples のテキストでは教科書原典固有名詞を使用、
                              | 画像は汎用人物として描画
  Layer 2(山田・佐藤)         | 廃止。ROLE_BASED_GENERIC_PROFILES で
                              | "company_employee" / "doctor" として抽象化
  Layer 3(generic_*)          | 維持。「汎用キャラ」セクションに残置(CHARACTER_PROFILES)
  character_lock_phrase        | 廃止。役割と outfit_hints / scene_hints で整合性を担保
  textbook_character_mapping   | Phase 4 で再評価(現時点では各 lesson_NN.json で個別管理)
"""


## ============================================================
## END OF FILE
## ============================================================
##
## このファイルは画像生成系 SSOT(Single Source of Truth)です。
## 修正する際は必ず以下のルールに従ってください:
##   1. バージョン番号を更新(2.0 → 2.1 等)
##   2. 改訂履歴コメントに変更内容を追記
##   3. 派生物(image_prompts_lessonN.json)との整合性を確認
##   4. 必要に応じて docs/image_prompt_guidelines.md も更新
##
## 関連 SSOT:
##   - lesson_configs/lesson_NN.json (教育設計系 SSOT)
##   - design_tokens.json (デザイン系 SSOT)
##
## 関連規範 docs:
##   - docs/image_prompt_guidelines.md (本ファイルの規範文書版)
## ============================================================
