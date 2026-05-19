# 日本語教材イラスト生成 マスタープロンプト設計書
# Master Prompt Design Guide for Japanese Language Teaching Materials
# Version 2.8 | 2026-05-19 (B層テンプレート追加・C層文法視覚化体系・v2.7ベース)

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
##
## v2.4 (2026-05-13): テンプレート整合性修正 + 形容詞テンプレート新設。
##   背景: v2.3 を実運用に投入する直前のレビューで、テンプレート間の整合性問題
##         および形容詞語彙の戦略欠落が判明。本改訂で解消する。
##   主な変更:
##   [A群] 整合性修正（4件）
##     - [PART 1] STYLE_BIBLE.constraints を改訂:
##       「no symbols」が矢印・領域線・モーションラインまで排除する可能性を回避。
##       教育的ピクトグラフ要素は各テンプレートの CONSTRAINTS ブロックに従う旨を明記。
##     - [PART 3] テンプレートA(vocabulary_person) のカメラ角度を修正:
##       v2.3 の「Full-body shot + 30-45度俯瞰」は身体プロポーションが歪む矛盾があった。
##       人物用カノニカル視点を「水平方向の3/4ビュー（眼の高さで斜め前方）」に変更。
##       焦点距離標準（focal_length_standards）にも人物専用の指示を追加。
##     - [PART 3] テンプレートF(spatial_relation) の背景指示を統一:
##       「白背景にするな」と「pale background」が同居していた矛盾を解消。
##       「最小限の環境コンテキスト（机面/床面）を持つ薄い背景」に統一。
##     - [PART 3] テンプレートG(demonstrative_kosoado) の構造を再設計:
##       3つのモデル（対面型/並行型/心理的引き込み）を全部書いた状態が画像生成器を
##       混乱させていた。{MODEL_TYPE_BLOCK} で1つだけ展開する構造に変更し、
##       "Choose ONLY ONE model type" を冒頭で明示。
##       3モデルの定義は新規 PART 4.9 DEMONSTRATIVE_MODELS に分離。
##   [B群] 機能追加（3件）
##     - [PART 1] vocab_type に "adjective" を追加。
##     - [PART 3] テンプレートJ(vocabulary_adjective) 新規:
##       形容詞（大きい・小さい・きれい・新しい等）専用の視覚化戦略。
##       PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY の3戦略を提供。
##     - [PART 3] テンプレートD に DISPLAY_STRATEGY: HAND_HOLDING サブ戦略を追加:
##       身体化認知とスケール固定の効果。
##       AIによる手の生成失敗リスクへの注意（簡略化シルエット推奨）も明記。
##     - [PART 3] テンプレートH に VISUALIZATION_STRATEGY: SEQUENCE_3PANEL を追加:
##       BEFORE_AFTER（2コマ）に加え、3段階構造（始まり/中間/終わり）の動詞用。
##       作る・直す・教える など3フェーズの動作に最適。
##   [PART 6] QA_CHECKLIST.vocab_type_check に "adjective" 項目を追加。
##   [PART 8] HOW_TO_USE を更新:
##     - Step 0 の vocab_type 一覧に "adjective" を追加。
##     - Step 6.5 を新設（形容詞語彙の設計手順）。
##     - Step 3 に HAND_HOLDING の選択基準を追記。
##     - Step 5 に SEQUENCE_3PANEL の選択基準を追記。
##     - Step 4 に「Choose ONLY ONE model type」の運用注意を追記。
##
## v2.5 (2026-05-14)
##
## v2.5.1 (2026-05-18): hex値フォーマット修正（Imagen テキスト描画バグ回避）。
##   STYLE_RECIPE 内 `similar to #XXXXXX` の # を除去し `similar to XXXXXX` に変更。
##   ガイド設計方針: v2.5 に戻す（v2.6〜v2.9 の拡張は不採用）。
##   理由: v2.9 実生成テスト（2026-05-18）で色品質・アスペクト比・複数人物生成の
##         問題を確認。lesson_01/02 は テンプレートA・B・D のみで対応可能。
##
## v2.6 (2026-05-18): v2.9 改善点の選択的取り込み（3件）。
##   背景: v2.5.1 は構造的に v2.5 と同一だが、医者画像の品質問題の根本原因が
##         v2.5 自体に内在していることが横断レビュー（2026-05-18）で判明。
##         v2.9 の全面採用は見送り、有益な改善3点のみを選択的に取り込む。
##   変更 [1] STYLE_RECIPE の hex値を完全除去（色名のみに統一）:
##     「」等の冗長な二重指定を廃止。
##     色名のみ（"soft cream white background" 等）に統一。
##     STYLE_BIBLE.color_palette も同様に整理。
##     理由: v2.5.1 の `similar to XXXX, hex value XXXX` は
##           Gemini に対して余分なトークンを消費する。
##           v2.9 実測で色名のみでも品質維持が確認済み。
##   変更 [2] 肌色を STYLE_RECIPE から分離（CHARACTER_RENDERING_POLICY 新設）:
##     STYLE_BIBLE.color_palette から skin_tones フィールドを削除。
##     PART 2.4 として CHARACTER_RENDERING_POLICY を新設。
##     vocab_type 別（warm_skin / neutral_avatar / context_dependent）に分類。
##     理由: 語彙カード（暖色肌）と例文画像（グレーアバター）で
##           肌色ルールが異なるため、STYLE_RECIPE への混在は誤適用の原因になる。
##   変更 [3] VISUAL_CANON_RULE 新設（PART 1 末尾に追加）:
##     語彙ごとのカノニカルな視覚アイデンティティを固定するルール。
##     特に「医者」は聴診器のみ（クリップボード禁止）を明示。
##     ROLE_BASED_GENERIC_PROFILES.doctor の `may carry a clipboard` を削除。
##     理由: role profile の「may carry」が Gemini に積極採用され、
##           語彙カードの構図が複雑化する問題を根本解決する。: NAMED_CHARACTER_PROFILES 新設（lesson_01 確定キャラクター5名）。
##   背景: lesson_01.json v2.10 で confirmed された 5 名のキャラクタープロファイルを
##         画像生成パイプラインの SSOT として登録。
##   主な変更:
##   [PART 2.3] NAMED_CHARACTER_PROFILES 新規追加:
##     - 鈴木さん（先生・日本人・男性・40〜50代）
##     - リンさん（学生・中国人・女性・20代・東西大学）
##     - ケリーさん（先生・アメリカ人・女性・30〜40代）
##     - キムさん（会社員・韓国人・男性・20代・メガネ）
##     - タノムさん（医者・ベトナム人・男性・20代・褐色肌）
##   各プロファイルに: gender / role_ja / role_en / nationality / age_range /
##   character_visual_hints / nationality_visual_hints / scene_hints /
##   lesson_appearances / _note を定義。
##   使用ルール: 固有名詞は画像プロンプトに含めない。テンプレートAを使用。
##              名前ラベルはテキストオーバーレイで付与（GAS側の責務）。
##
## v2.7 (2026-05-19): A層内部矛盾の解消（v2.6ベース・構造は維持）。
##   背景: handoff_v6.0 のレビューで、v2.6 が自身の確定方針と
##         矛盾する記述を出荷時点で含んでいることが判明（A層問題）。
##         Deep Research を要さず是正可能な4点のみを本版で修正する。
##         B層（不足テンプレート）・C層（例文の文法視覚化体系）は対象外。
##   変更 [A1] 肌色ルールの自己矛盾を解消:
##     CHARACTER_RENDERING_POLICY を全面改訂。
##     旧 warm_skin_realistic（"Skin tones: naturally warm medium skin tone."
##     を person/family に追記せよ）を廃止し、diverse_unspecified
##     （汎用人物は肌色フレーズを書かない＝多様性維持）に置換。
##     肌色明示は named_character_identity（固定5名のみ）に限定。
##     根拠: handoff_v6.0 §4.2/§4.4/§10（当該一文が褐色固定の原因。
##           多国籍学習者向けには肌色指定なしが正しい方針）。
##   変更 [A2] generic_* 8体の skin ハードコードを無効化:
##     CHARACTER_PROFILES の generic_*（成人/子/中年/高齢）の
##     "skin":"warm medium skin tone" を UNSPECIFIED マーカーに変更。
##     高齢2体の「年齢サイン（シワ・笑い皺）」は描画対象として保持し、
##     肌の「色」のみ非指定化。FAMILY_TEMPLATES.consistency_rules の
##     「全員 warm medium で固定」を「1枚内のみ相互整合・絶対色は非指定」に修正。
##   変更 [A3] ASPECT_RATIO_POLICY 新設（PART 1.2）:
##     handoff_v6.0 §10 の確定ルール（GAS経由=自動1:1／手動・例文=
##     先頭に 'Square 1:1 aspect ratio.' 等を追加）をガイド本体に昇格。
##     経路別の挙動・落とし穴・二重指定回避を明文化。
##   変更 [A4] HOW_TO_USE Step 0 をハードゲート化:
##     vocab_type 未設定時の「停止条件」を明記。
##     lesson_01/02 が全件 null である現状（別作業での修正対象）を注記。
##     Step 1/Step 2 に A1・A3 の適用チェックを追記。
##   非対象（次版以降）:
##     - B層: pronoun/interjection/set_expression/adverb/counter/time/
##            sensory のテンプレート・Step 不在（applies_to にのみ存在）。
##     - C層: 例文画像の文法関係→視覚エンコーディング体系（Deep Research要）。
##     - 残A4: lesson_01/02 の vocab_type=null 解消は lesson_NN.json 側の
##            別作業（本 .py では対応不可。ゲートで停止させる対応のみ）。
##
## v2.8 (2026-05-19): B層テンプレート追加・C層文法視覚化体系の統合（v2.7ベース）。
##   背景: Deep Research「日本語教材の視覚エンコーディング方法論」（2026-05-19）の
##         知見を統合。B層（テンプレート欠落）・C層（例文の文法視覚化体系未整備）
##         という2つの構造的欠陥を解消する。本改訂によりガイドは L1〜L30 全課の
##         語彙カード・例文画像プロンプトを設計するのに必要な情報を全て網羅する。
##   理論的根拠（Deep Researchで確立）:
##     - Krashen の理解可能入力仮説 + Schmidt の気づき仮説（VIE の必要性）
##     - Paivio の二重符号化理論（視覚と言語の統合による認知負荷削減）
##     - Cohn の視覚叙事文法（VNG）+ McCloud のコマ間推論（文法関係の時系列表現）
##     - Neurath のアイソタイプ（シリアル反復による数量・存在の明示）
##   変更 [B1] NON_VISUAL_VOCAB_POLICY 新設（PART 1.3）:
##     接尾辞・接頭辞・文脈依存助詞など「画像生成すべきでない語」を判定する
##     3条件（Context Dependency / Cognitive Multi-Interpretation /
##     Morphemic Floatability）と代替提示形式を定義。
##   変更 [B2] Template K: vocabulary_set_expression 新設（PART 3）:
##     定型表現・感動詞（ありがとう/すみません/おはよう/はい/いいえ等）専用テンプレート。
##     社会的場面最小描写（Minimal Social Context）+ 感情オーバーレイ記号で生成。
##   変更 [B3] Template J（形容詞）の補強:
##     感覚的・評価的・抽象的・身体感覚形容詞の3戦略選択マトリクスを
##     ADJECTIVE_CATEGORY_MATRIX として追加（PART 4 末尾）。
##   変更 [C1] GRAMMAR_VISUAL_ENCODING_30 新設（PART 7）:
##     L1〜L30 全課の grammarConceptID → 視覚エンコーディング戦略の完全対応表。
##     各文型に：推奨パネル構成 / 具体的構図設計 / 使用する視覚記号 /
##     回避すべき失敗 / 理論的根拠 を収録。
##   変更 [C2] HOW_TO_USE Step 7 を全面更新（例文画像設計手順の具体化）:
##     「VISUAL_SYMBOLS を参照」の3行から、grammarConceptID との照合 →
##     GRAMMAR_VISUAL_ENCODING_30 でパネル数と構図を特定 → テンプレートCへ展開
##     という設計フローに更新。
##   変更 [HOW_TO_USE] Step 0 の vocab_type 一覧に set_expression を追加。
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
##   対応するテンプレート(A〜J)を選択してください。
##
##   vocab_type → テンプレート 対応表:
##     person          → A (vocabulary_person)
##     building        → B (vocabulary_building)
##     concrete_object → D (vocabulary_object_concrete)
##                       ※ 類似形状が多い場合は E(variant_grid) も検討
##                       ※ スケール固定が重要な場合は HAND_HOLDING 戦略も検討（v2.4）
##     spatial_relation→ F (spatial_relation)
##     demonstrative   → G (demonstrative_kosoado)
##                       ※ 必ず3モデルのうち1つだけを選んで展開する（v2.4）
##     action_verb     → H (action_verb)
##                       ※ 3フェーズ動詞には SEQUENCE_3PANEL 戦略も検討（v2.4）
##     abstract_concept→ I (abstract_concept)
##     adjective       → J (vocabulary_adjective)  ※ v2.4 新規
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
## 資料9より: 色は色名での指定を基本とする。
##            v2.6 で hex値の二重指定（Double-Hex Anchoring）を廃止。
##            色名のみで Gemini の色品質が維持できることを v2.9 実測で確認済み。
## 資料11より: カノニカル・パースペクティブ(斜め上30-45度)が
##             識別速度・正確性を最大化する。v2.3 で反映。
## ============================================================

STYLE_BIBLE = {

  ## 全画像共通の固定フレーズ（変更厳禁）
  "core_style": "Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.",

  ## カラーパレット（大人・混合クラス向け）
  ## 理由: 資料7より、大人向けは落ち着いたミュートカラーが認知負荷を下げる
  ## v2.6: hex値を完全除去し色名のみに統一（v2.9 実測で色名のみでも品質維持を確認）。
  ##       skin_tones は CHARACTER_RENDERING_POLICY（PART 2.4）に移動。
  "color_palette": {
    "background":  "Soft cream white",
    "outline":     "Deep slate navy",
    "main_color":  "Muted warm blue",
    "accent":      "Warm amber gold",
    "sub_color":   "Cool slate gray",
    "note": "v2.6: 色名のみで指定。hex値の二重指定は廃止（Gemini の不要トークン消費を削減）。"
            "肌色は vocab_type 別に異なるため PART 2.4 CHARACTER_RENDERING_POLICY を参照。"
  },

  ## 焦点距離標準化（v2.3 改訂 / v2.4 再改訂）
  ## 資料11より: カノニカル・パースペクティブ（斜め上30-45度）が
  ##             最短の反応時間と最高の認識精度を記録する。
  ##             v2.2 の "orthographic projection acceptable" は
  ##             正面固定の印象を与えるため削除し、canonical 3/4 に変更。
  ## v2.4 修正: 「斜め上30-45度」は物体には適切だが、人物の Full-body shot に
  ##           適用すると身体プロポーションが歪む（俯瞰で頭部が大きく、足が小さくなる）。
  ##           人物用と物体用でカノニカル視点を分けて定義する。
  "focal_length_standards": {
    "vocabulary_card_focal_length":
      "85mm portrait lens equivalent. "
      "DEFAULT VIEW depends on subject type: "
      "(1) FOR OBJECTS (concrete_object, adjective, abstract_concept): "
      "Canonical 3/4 perspective — camera positioned 30-45 degrees ABOVE and "
      "slightly to the side of the subject. This angle reveals both the front face "
      "and the top surface of the object simultaneously, maximizing recognition speed. "
      "(2) FOR PERSONS (vocabulary_person): "
      "Horizontal 3/4 view at EYE LEVEL — camera positioned at the subject's eye height "
      "and rotated approximately 30-45 degrees to one side (diagonal front view, NOT overhead). "
      "This preserves natural body proportions while showing both the face and a partial "
      "side view of the body. Overhead angles distort full-body figures and should NOT be "
      "used for person vocabulary cards. "
      "Exception (objects only): use straight front-facing (0°) ONLY when the front face alone "
      "is the definitive identifier (e.g. a clock face, a screen, a signage board).",
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
      "variant_grid":      "Each variant tile occupies equal space in a 2×2 or 1×N grid layout",
      "adjective":         "Object(s) occupy 70-80% of the frame. For PAIR_CONTRAST: each panel occupies 50% with equal-sized subjects.  (v2.4)"
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
      "vocab_types":  ["concrete_object", "abstract_concept", "action_verb", "adjective"]
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
  ## v2.4: 人物は水平3/4ビュー（眼の高さ）、物体はカノニカル3/4ビュー（斜め上）。
  "vocabulary_card_style":
    "Solid white background. Single centered subject only. "
    "Full-body shot with HORIZONTAL 3/4 view at eye level for characters; "
    "canonical 3/4 view (slight overhead) for objects and adjective subjects. "
    "No background elements, no secondary objects. The subject must fill 70-80% of the frame.",

  ## 例文画像（16:9）専用スタイル
  "example_image_style":
    "Clean minimal background with only essential context. "
    "Characters take up the majority of the frame. "
    "Eye-level front or slight three-quarter view. "
    "Straight vertical lines for buildings. Soft natural indoor or outdoor daylight.",

  ## 全画像共通の制約（最後に必ず追加）
  ## v2.4 改訂: 「no symbols」が教育的矢印・領域線・モーションラインまで排除する
  ##           可能性を回避。各テンプレートの CONSTRAINTS ブロックに従う旨を明記。
  "constraints":
    "No text, no letters, no numbers, no decorative symbols inside the image. "
    "Exception: EDUCATIONAL pictographic elements — directional arrows, "
    "territory boundary lines, motion lines, panel dividers — are governed by "
    "each individual template's CONSTRAINTS block, NOT by this global rule. "
    "They are PERMITTED in templates F (spatial_relation), G (demonstrative_kosoado), "
    "H (action_verb), and J (vocabulary_adjective) when explicitly described "
    "in the template. For all other templates, the default 'no symbols' rule applies.",

  ## プロンプト末尾に付ける「ブランド宣言文」（資料6より）
  "brand_declaration":
    "Keep line weights consistent. Generate as if this is part of a unified educational brand style guide."
}


## ============================================================
## PART 1.1: VISUAL_CANON_RULE（語彙ごとの視覚アイデンティティ固定）
## ============================================================
##
## v2.6 新設。v2.9 §0-D VISUAL_CANON_RULE を選択的取り込み。
##
## 【目的】
##   Claudeが都度プロンプトを生成する方式では、同じ語彙でも毎回表現がブレるリスクがある。
##   以下のルールで視覚的一貫性を維持する。
##
## 【原則】
##   各語彙は「カノニカルな視覚アイデンティティ」を1つ持つ。
##   同じ語彙が別のレッスンや別のバッチで再度生成される場合も、
##   同じシーン構成・同じ識別シグネチャーを維持すること。
##
## 【具体的なルール】
##   ① OBJECT_SIGNATURES / BUILDING_CUES の識別シグネチャーは変更しない。
##   ② 人物の役割を示すコアアイテムは以下で固定し、他の小道具は追加しない:
##
##     役割          コアアイテム（MUST）           禁止小道具（MUST NOT）
##     ──────────────────────────────────────────────────────────────
##     先生          マーカー または 教科書を持つ   ─
##     医者          白衣 ＋ 聴診器（首にかける）   クリップボード、聴診器以外の
##                                                   医療器具（耳鏡等）
##     学生          バックパック または ノート      ─
##     会社員        スーツ ＋ ブリーフケース       ─
##     ──────────────────────────────────────────────────────────────
##
##   ③ レッスン番号が変わっても「新幹線→在来線に変えた方が面白い」等の
##      独自判断をしない。
##   ④ variant_grid では個々の語彙のシグネチャーをそのまま使う。
##
## 【再生成時のルール】
##   REGENERATION_RULES に従って再生成する場合も、
##   主役オブジェクトの視覚アイデンティティは変更しない。
##   変更が許されるのは「背景・構図の細部・装飾要素」のみ。
##
## ============================================================


## ============================================================
## PART 1.2: ASPECT_RATIO_POLICY（アスペクト比の確定ルール）
## ============================================================
##
## v2.7 新設【A層矛盾の解消】:
##   v2.6 までは "(1:1)" "(16:9)" がコメントとスタイル名にしか現れず、
##   プロンプト本文にアスペクト比文を入れるか否かのルールが .py 内に
##   明文化されていなかった。一方 handoff_v6.0 §4.1 / §10 では
##   「GAS経由なら自動 1:1。手動/別経路では 16:9 になるため
##   先頭に 'Square 1:1 aspect ratio.' を追加」が確定ルールとして
##   記録されている。この確定ルールをガイド本体に昇格させる。
##
## 【経路別の確定挙動】
##   ┌─────────────┬───────────────────────────────────────────┐
##   │ 生成経路       │ アスペクト比の扱い                          │
##   ├─────────────┼───────────────────────────────────────────┤
##   │ GAS経由        │ generateImages.gs が API パラメータで        │
##   │ (語彙カード)    │ ASPECT_RATIO:"1:1" を渡す。プロンプト本文に  │
##   │               │ アスペクト比文を入れない（二重指定回避）。    │
##   ├─────────────┼───────────────────────────────────────────┤
##   │ 手動 / 別経路   │ アスペクト比パラメータが無く、Gemini が       │
##   │ (テスト・例文)  │ デフォルト 16:9 を採用してしまう。            │
##   │               │ → プロンプト先頭に下記フレーズを必ず追加。    │
##   └─────────────┴───────────────────────────────────────────┘
##
## ============================================================

ASPECT_RATIO_POLICY = {

  ## プロンプト本文に入れる先頭フレーズ（手動/別経路でのみ使用）
  "manual_prefix": {
    "vocabulary_card": "Square 1:1 aspect ratio.",        # A/B/D/E/F/G/H/I/J（1:1系）
    "example_image":   "Wide 16:9 aspect ratio.",          # C（例文・16:9系）
    "_usage": (
      "プロンプト文字列の最先頭（[PURPOSE] より前）に1行で置く。"
      "GAS経由生成では絶対に追加しないこと（API パラメータと二重指定になり"
      "Gemini のアテンションを乱す）。"
    ),
  },

  ## 経路の判定ガイド
  "routing": {
    "gas_pipeline": {
      "applies_to": "Vocabularyシート経由の語彙カード量産（importImagePromptsFromJson → generateImageBatch）",
      "aspect_handling": "generateImages.gs が ASPECT_RATIO:'1:1' を付与（コード側責務）",
      "prompt_prefix": None,   # 本文には何も足さない
      "_evidence": "handoff_v6.0 §4.1 / generateImages.gs L61 ASPECT_RATIO:'1:1'",
    },
    "manual_or_other": {
      "applies_to": (
        "手動での Gemini 直接入力（プロンプト検証・1語テスト）、"
        "および例文画像（Examplesシート＝現時点で GAS 関数が存在しない経路）"
      ),
      "aspect_handling": "アスペクト比パラメータが無い → Gemini が 16:9 を既定採用してしまう",
      "prompt_prefix": "manual_prefix の該当値を先頭に1行追加する",
      "_evidence": "handoff_v6.0 §4.1 / §10 / §6（例文画像 GAS 関数なし）",
    },
  },

  ## 既知の落とし穴
  "pitfalls": [
    "GAS経由なのに 'Square 1:1 aspect ratio.' を本文に書く → API と二重指定。書かない。",
    "手動テストで先頭フレーズを忘れる → 語彙カードが 16:9 で生成され構図が崩れる。",
    "例文(C)に '1:1' を付ける → 16:9 前提の構図指示（Wide 16:9 shot）と矛盾する。"
    "例文は example_image の '16:9' を使う。",
  ],

  "critical_note": (
    "アスペクト比は『どの経路で生成するか』だけで決まる。語彙タイプでは決まらない。"
    "lesson_01/02 の S列プロンプトは GAS経由前提なので、本文にアスペクト比文を"
    "入れないこと（handoff §7 ⑮〜⑲ の作業順序と整合）。"
  ),
}


## ============================================================
## PART 1.3: NON_VISUAL_VOCAB_POLICY（画像化不適格語彙の判定基準）
## ============================================================
##
## v2.8 新設【B層対応】。
## Deep Research「日本語教材の視覚エンコーディング方法論」§B-3 より統合。
##
## 【目的】
##   画像生成を「すべき語彙」と「すべきでない語彙」を判定する。
##   不適格語彙を誤生成するとクオリティのばらつきと工数の浪費が発生する。
##   以下の3条件でいずれか1つでも該当したら「単独の画像生成を中止」する。
##
## ============================================================

NON_VISUAL_VOCAB_POLICY = {

  ## ── 3条件（いずれか1つ該当で即・生成中止）──────────────────────

  "unsuitability_criteria": {
    "criterion_1_context_dependency": {
      "label": "文脈依存極大性（Context Dependency）",
      "definition": (
        "その語彙自体が具体的な物理的指示対象を全く持たず、"
        "他の統語的文脈と結合して初めて意味が創出される語。"
      ),
      "examples": ["〜が（接続助詞）", "〜から（理由・起点）", "〜ね", "〜よ", "〜は（対比）"],
    },
    "criterion_2_multi_interpretation": {
      "label": "認知的多元解釈性（Cognitive Multi-Interpretation）",
      "definition": (
        "提示したイラストが、学習者の国籍や文化的背景によって"
        "3通り以上の異なる概念に分散するリスクがある語。"
      ),
      "examples": ["やっと（安堵・疲労・時間超過のいずれにも解釈される）", "ちょうど", "もう"],
    },
    "criterion_3_morphemic_floatability": {
      "label": "形態素単独浮遊性（Morphemic Floatability）",
      "definition": (
        "単独で自立的な意味構造（シニフィエ）を持たず、"
        "名詞や動詞に付着してのみ機能する語。"
      ),
      "examples": [
        "お〜/ご〜（接頭辞）", "〜さ・〜み・〜け（接尾辞）",
        "〜的（接尾辞）", "こと・もの（形式名詞）", "〜化（名詞化接尾辞）",
      ],
    },
  },

  ## ── 語彙タイプ別の判定結果（Goi_List 初級前半を踏まえた実用判定）──

  "type_judgments": {
    "接尾辞":   "❌ 生成不適格（criterion_3: 形態素単独浮遊性）",
    "接頭辞":   "❌ 生成不適格（criterion_3: 形態素単独浮遊性）",
    "感動詞":   "⚠️  要判断（はい/いいえ → Template K で生成可 / ああ・うん → 不適格）",
    "定型表現": "✅ Template K で生成可（社会的場面最小描写）",
    "副詞":     "⚠️  要判断（やっと/もう → criterion_2 で不適格 / だいたい → 代替提示）",
    "連体詞":   "⚠️  要判断（この/その/あの → Template G で生成可 / あんな → 不適格）",
    "代名詞":   "⚠️  要判断（こそあど系 → Template G / わたし/あなた → person として可）",
    "数詞":     "✅ Template D (Isotype グリッド) で生成可 ※ 助数詞と一体で設計する",
  },

  ## ── 不適格語彙の代替提示形式 ──────────────────────────────────────

  "alternative_presentation": {
    "method": "文脈内提示（In-Context Embedded Representation）",
    "principle": (
      "不適格語を単独の画像カードにするのではなく、"
      "その語が自然に登場する例文画像の中に「埋め込む」。"
      "例文スライド（Template C）の SCENE_DESCRIPTION に"
      "その語の機能を体現した場面を描写することで、"
      "視覚的文脈ごと提示する。"
    ),
    "examples": [
      "接尾辞「〜さん」→ 例文「鈴木さんは先生です」の人物カードに名前ラベル（GAS側テキスト処理）",
      "副詞「やっと」→ 例文画像（Template C）内の表情・汗ピクトで文脈化",
      "形式名詞「こと」→ 例文「ピアノを弾くことができます」の能力場面で文脈化",
    ],
    "_note": "独立した vocab_card を生成しない。スプレッドシートの imageStatus を 'no_image_needed' にセットする。",
  },

  "critical_note": (
    "Step 0 の vocab_type 設定時に、設定候補が上記の判定表に照らして"
    "不適格に該当する場合は、vocab_type = 'non_visual' を設定し、"
    "imageStatus = 'no_image_needed' とする。"
    "量産フェーズでこの判定を飛ばすと、不適格語の誤生成が大量発生する。"
  ),
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Generator naturally varies skin tone; this is a deliberate diversity policy, not a pale/dark default.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Generator naturally varies skin tone; this is a deliberate diversity policy, not a pale/dark default.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Generator naturally varies skin tone; this is a deliberate diversity policy, not a pale/dark default.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Generator naturally varies skin tone; this is a deliberate diversity policy, not a pale/dark default.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Generator naturally varies skin tone; this is a deliberate diversity policy, not a pale/dark default.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Generator naturally varies skin tone; this is a deliberate diversity policy, not a pale/dark default.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Age signs (gentle wrinkles, smile lines) ARE rendered; skin COLOR is left unspecified.",
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
      "skin":   "UNSPECIFIED — do not emit a skin-tone phrase (CHARACTER_RENDERING_POLICY.diverse_unspecified). Age signs (gentle wrinkles, smile lines) ARE rendered; skin COLOR is left unspecified.",
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
      "stethoscope around the neck — THIS IS THE ONLY REQUIRED PROP",
      "name badge clipped to the coat (no specific name written)",
      "DO NOT add clipboard, otoscope, pen, or any other props — stethoscope alone is sufficient"
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
## PART 2.3: NAMED_CHARACTER_PROFILES（第1課 名前付きキャラクタープロファイル）
## ============================================================
##
## v2.5 新規追加。lesson_01.json の materialNeeds[named_character_card] で参照。
##
## 使用ルール:
##   - 画像プロンプトにキャラクター名（固有名詞）は絶対に記載しない。
##   - 外見・服装・小道具のみでロールと出身を視覚的に表現する。
##   - 名前ラベルは生成後にテキストオーバーレイで付与する（GAS 側の責務）。
##   - テンプレートA（vocabulary_person）を使用し、
##     character_visual_hints ブロックをそのまま SUBJECT に展開する。
##   - 全キャラクター共通の前提: STYLE_BIBLE の color_palette に従う。
##   - 肌色について（v2.7 改訂）:
##       固定5名は CHARACTER_RENDERING_POLICY.named_character_identity に該当する
##       「唯一の肌色明示領域」。各人物の skin_tone は
##       character_visual_hints / nationality_visual_hints の個別記述に従う
##       （例: タノムさん = medium-brown / ケリーさん = fair）。
##       これらはキャラクター識別のための意図的アイデンティティであり、
##       全レッスンで一貫させる（資料5）。
##       ※「naturally warm medium を一律基準にする」という旧 v2.6 以前の前提は
##         廃止（汎用人物の褐色固定の一因だったため。handoff §4.2/§4.4）。
##         一律フレーズは使わず、必ず人物ごとの個別ヒントで表現すること。
## ============================================================

NAMED_CHARACTER_PROFILES = {

  "鈴木さん": {
    "gender": "male",
    "role_ja": "先生",
    "role_en": "Japanese language teacher",
    "nationality": "Japanese",
    "age_range": "40s-50s",
    "character_visual_hints": [
      "graying or salt-and-pepper short hair",
      "conservative business suit — navy or charcoal, white shirt, subtle tie",
      "may carry a textbook or a marker",
      "calm, professional expression",
      "East Asian features — Japanese male teacher archetype"
    ],
    "nationality_visual_hints": [
      "no nationality badge needed (Japanese teacher in Japanese classroom context is implicit)",
      "overall appearance should read as a senior Japanese educator"
    ],
    "scene_hints": [
      "standing in front of a whiteboard with Japanese writing",
      "at a teacher's desk with books and papers"
    ],
    "lesson_appearances": "lesson_01 (p1 例文1-1/1-4, p3 例文3-2)",
    "_note": "PDF p.5 モデル発話「鈴木さんは先生です」「鈴木さんは日本人です」の人物。"
  },

  "リンさん": {
    "gender": "female",
    "role_ja": "学生",
    "role_en": "university student",
    "nationality": "Chinese",
    "age_range": "20s",
    "affiliation": "東西大学",
    "character_visual_hints": [
      "long straight dark hair, mid-length or longer",
      "casual smart clothing — simple top with jeans or slacks",
      "backpack or notebook under arm",
      "bright, open expression — friendly language learner vibe",
      "East Asian features — young Chinese female student"
    ],
    "nationality_visual_hints": [
      "small flag badge (China) on backpack strap is acceptable but optional",
      "features should suggest East Asian (Chinese) without being stereotypical"
    ],
    "scene_hints": [
      "on a university campus or in a classroom",
      "holding a textbook or taking notes"
    ],
    "lesson_appearances": "lesson_01 (p1 例文1-2/1-5, p2 全例文, p3 例文3-4)",
    "_note": "PDF p.1 会話例「リンです。中国人です。東西大学の学生です。」の人物。"
  },

  "ケリーさん": {
    "gender": "female",
    "role_ja": "先生（教師）",
    "role_en": "teacher (foreign language instructor)",
    "nationality": "American",
    "age_range": "30s-40s",
    "character_visual_hints": [
      "light complexion, Western (North American) features",
      "smart casual or business casual — blouse with cardigan or blazer",
      "may carry a textbook, folder, or whiteboard marker",
      "warm, engaging smile — approachable educator"
    ],
    "nationality_visual_hints": [
      "small US flag badge or pin is acceptable but optional",
      "fair skin and lighter hair color (brown, blonde) suggests American/Western origin",
      "avoid heavy-handed 'American' stereotypes"
    ],
    "scene_hints": [
      "standing in a classroom or language school setting",
      "interacting with students"
    ],
    "lesson_appearances": "lesson_01 (materialNeeds named_character_card; 会話例「アメリカから来ました」)",
    "_note": "PDF p.1 会話例「ケリーです。アメリカ人です。アメリカから来ました。先生です。」の人物。"
  },

  "キムさん": {
    "gender": "male",
    "role_ja": "会社員",
    "role_en": "company employee / office worker",
    "nationality": "Korean",
    "age_range": "20s",
    "character_visual_hints": [
      "short neat hair",
      "slim rectangular glasses",
      "business casual — dress shirt with slacks, no tie",
      "may carry a laptop bag or smartphone",
      "East Asian features — young Korean male office worker"
    ],
    "nationality_visual_hints": [
      "small Korean flag badge on bag is acceptable but optional",
      "features should suggest East Asian (Korean) — similar to but distinct from Japanese"
    ],
    "scene_hints": [
      "in an office building lobby or at a desk with laptop",
      "walking with a briefcase on a city sidewalk"
    ],
    "lesson_appearances": "lesson_01 (p1 例文1-3, p2 例文2-3/2-5, p3 例文3-3)",
    "_note": "PDF p.5 教え方の例・p.6 練習問題に登場。韓国人・会社員のモデル人物。"
  },

  "タノムさん": {
    "gender": "male",
    "role_ja": "医者",
    "role_en": "doctor",
    "nationality": "Vietnamese",
    "age_range": "20s",
    "character_visual_hints": [
      "short dark hair",
      "medium-brown warm skin tone (Southeast Asian)",
      "sporty or athletic build",
      "white doctor's coat over a simple shirt",
      "stethoscope around the neck",
      "Southeast Asian features — young Vietnamese male doctor"
    ],
    "nationality_visual_hints": [
      "small Vietnamese flag badge on coat is acceptable but optional",
      "medium-brown skin tone and Southeast Asian features distinguish from East Asian characters"
    ],
    "scene_hints": [
      "in a hospital corridor or examination room",
      "in front of a hospital building"
    ],
    "lesson_appearances": "lesson_01 (p3 例文3-1 「東西病院の医者です」)",
    "_note": "v2.10 新設キャラクター。東西病院・医者・ベトナム人のモデル人物。"
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
      "Do NOT specify an absolute skin tone. Leave skin tone unspecified (CHARACTER_RENDERING_POLICY.diverse_unspecified). Within a SINGLE generated image, family members should look like a plausible family (mutually consistent skin tone WITHIN that one image), but the absolute tone is left to the generator and varies across images — this is the intended diversity policy.",
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
      "Do NOT specify an absolute skin tone. Mutually consistent WITHIN a single image only; absolute tone left unspecified (CHARACTER_RENDERING_POLICY.diverse_unspecified).",
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
      "Do NOT specify an absolute skin tone. Mutually consistent WITHIN a single image only; absolute tone left unspecified (CHARACTER_RENDERING_POLICY.diverse_unspecified).",
      "Parents look age-appropriate (30s) — younger than middle-aged"
    ]
  }
}


## ============================================================
## PART 2.4: CHARACTER_RENDERING_POLICY（vocab_type別・肌色ルール）
## ============================================================
##
## v2.6 新設。STYLE_BIBLE から skin_tones を分離して移動。
## v2.7 改訂【A層矛盾の解消】:
##   v2.6 では warm_skin_realistic.skin_prompt_phrase に
##   "Skin tones: naturally warm medium skin tone." を定義し、
##   「person 語彙カードにこの一文を追記せよ」と指示していた。
##   しかし handoff_v6.0 §4.2 / §4.4 / §10 は、まさにこの一文の追記が
##   褐色固定の根本原因であり、「多様な国籍の生徒を想定する本プロジェクトでは
##   肌色指定をプロンプトに入れないことが正しい方針」と確定している。
##   v2.6 はこの確定方針と内部矛盾していたため、v2.7 で次のとおり是正する:
##
##   方針: 汎用の役割・職業人物カード、および例文画像は
##         「肌色フレーズをプロンプトに入れない（NO_SKIN_PHRASE）」をデフォルトとする。
##         肌色を指定してよいのは、肌色そのものが
##         「キャラクター一貫性のための意図的アイデンティティ」である場合に限る
##         （= NAMED_CHARACTER_PROFILES の固定5名／1枚内の家族の相互整合のみ）。
##
##   重要: 「肌色を入れない」は「白人にする」でも「褐色にする」でもない。
##         指定を外すことで Gemini が自然に多様な肌色を生成する状態を保つ、
##         という積極的な多様性方針である（handoff §4.4）。
##
## プロンプト生成時は vocab_type を確認し、下記の skin_prompt_phrase を
## CONSTRAINTS ブロックの後に追記する。NO_SKIN_PHRASE の場合は
## 肌色に関する行を一切追記しない（空文字を入れるのでもなく、行ごと省く）。
## ============================================================

NO_SKIN_PHRASE = ""  # 肌色フレーズを追記しないことを示す番兵値。空行も入れない。

CHARACTER_RENDERING_POLICY = {

  "diverse_unspecified": {
    "applies_to": ["person", "building", "family"],
    "spec": (
      "DO NOT add any skin-tone phrase to the prompt. "
      "Leave skin tone unspecified so the generator naturally varies it. "
      "This is a deliberate diversity policy for a multinational learner base "
      "— it is NOT a default to pale and NOT a default to dark."
    ),
    "skin_prompt_phrase": NO_SKIN_PHRASE,
    "_note": (
      "汎用の職業・役割・家族の人物カードに適用。handoff §4.4/§10 の確定方針。"
      "肌色フレーズは行ごと省く（『Skin tones: ...』を書かない）。"
      "1枚に複数人物（家族など）を描く場合の『1枚内での相互整合』は、"
      "FAMILY_TEMPLATES.consistency_rules の per-image 表現で担保する"
      "（特定の肌色を全レッスンで固定する記述は使わない）。"
    ),
  },

  "neutral_avatar_abstract": {
    "applies_to": [
      "example_sentence", "pronoun", "interjection",
      "set_expression", "adverb", "sensory"
    ],
    "spec": (
      "Gender-neutral minimal avatar. "
      "Neutral light gray skin — cool light gray tone, not warm beige and not dark. "
      "No ethnic hairstyle, no culturally specific clothing."
    ),
    "skin_prompt_phrase": "Gender-neutral avatar, neutral cool light gray skin.",
    "_note": (
      "文型・文法学習用の例文画像に適用。学習者が人物の属性でなく"
      "文型そのものに集中できるよう、属性を中立化する。"
      "これは『肌色を指定しない』のではなく『中立アバターという様式を指定する』"
      "ケースであり、diverse_unspecified とは目的が異なる（A層方針の例外ではない）。"
      "プロンプト本文に hex値（#D3D3D3 等）を絶対に含めないこと。"
    ),
  },

  "context_dependent": {
    "applies_to": [
      "concrete_object", "action_verb", "adjective",
      "abstract_concept", "spatial_relation", "demonstrative",
      "counter", "time", "variant_grid"
    ],
    "spec": (
      "人物が脇役（比較対象として登場）→ neutral gray avatar。"
      "人物が主役 → diverse_unspecified（肌色フレーズを追記しない）。"
    ),
    "skin_prompt_phrase": {
      "主役（diverse）": NO_SKIN_PHRASE,
      "脇役（neutral）": "Gender-neutral avatar, neutral cool light gray skin.",
    },
  },

  "named_character_identity": {
    "applies_to": ["named_character_card"],
    "spec": (
      "固定5名（NAMED_CHARACTER_PROFILES）のみ。肌色がキャラクター識別の"
      "意図的アイデンティティである場合に限り、その人物固有の "
      "character_visual_hints / nationality_visual_hints の記述に従う。"
      "全レッスンで一貫させること（資料5: キャラクター一貫性）。"
    ),
    "skin_prompt_phrase": "（各 NAMED_CHARACTER_PROFILES のヒントに従う。一律フレーズは使わない）",
    "_note": (
      "ここだけが『肌色を明示してよい』唯一の領域。"
      "汎用の医者・先生カード（ROLE_BASED_GENERIC_PROFILES）には適用しない"
      "— それらは diverse_unspecified（肌色指定なし）。"
    ),
  },

  "critical_note": (
    "同一レッスン内で person 語彙カード（肌色指定なし＝多様）と "
    "example_sentence（グレーアバター）が混在しても問題ない。"
    "前者は職業の学習、後者は文型の学習で認知タスクが異なる。"
    "v2.7 の要点: 汎用人物は『肌色を書かない』、中立アバターは『中立様式を書く』、"
    "固定5名は『その人物固有の肌色を書く』。この3者を混同しないこと。"
  )
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
## v2.4 で追加・修正:
##   A: テンプレートA カメラ角度を「水平3/4ビュー(眼の高さ)」に修正
##   D: HAND_HOLDING サブ戦略を追加（身体化認知・スケール固定）
##   F: 背景指示の矛盾を解消（最小限の環境コンテキストに統一）
##   G: 3モデルを {MODEL_TYPE_BLOCK} で1つだけ展開する構造に変更
##      → 3モデル定義は PART 4.9 DEMONSTRATIVE_MODELS に分離
##   H: SEQUENCE_3PANEL 戦略を追加（3フェーズ動詞用）
##   J: vocabulary_adjective    形容詞語彙（新規 — v2.4）
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
  ## v2.4 修正: 「Full-body shot + 30-45度俯瞰」の矛盾を解消。
  ##           人物には水平方向3/4ビュー（眼の高さで斜め前方）を使用。
  ##           俯瞰だと身体プロポーションが歪み、教科書的な汎用人物に見えなくなる。
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
Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at the
subject's eye height (not above, not below) and rotated approximately 30-45 degrees
to one side. This is a diagonal front view that shows both the front face and a partial
side view of the body simultaneously while preserving natural body proportions.
DO NOT use an overhead or bird's-eye angle for full-body person cards — overhead angles
distort body proportions (head appears large, feet small) and make the figure look
unstable. Keep both feet visible on a flat ground plane.
Solid white background. No other characters or objects in the frame.
85mm portrait lens equivalent.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines, muted warm blue
and warm amber gold as accents.
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
deep slate navy outlines, muted warm colors for the building facade,
warm amber gold for accent details.
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
Completely flat solid color fills only. Color palette: soft cream white or pale background,
deep slate navy outlines, muted warm colors,
warm amber gold accents for emphasis.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートD: 語彙カード・具体物（1:1）【v2.3 新規】
  ## v2.4 追加: DISPLAY_STRATEGY サブ戦略を導入。
  ##           HAND_HOLDING（手による保持）は身体化認知 + スケール固定に有効。
  ##           ただしAIによる手の生成失敗リスク（指の本数誤り・関節崩壊）に注意。
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
Display strategy: {DISPLAY_STRATEGY}
(Choose ONE of the strategies defined below. Default = "OBJECT_ALONE".)

[STRATEGY: OBJECT_ALONE]  ← Default
  The object is centered and fills 70-80% of the image.
  Camera angle: canonical 3/4 view — positioned 30-45 degrees above and slightly to one side.
  This angle reveals the top surface AND one side face simultaneously.
  Exception: use straight front-facing ONLY if {FRONT_FACING_EXCEPTION} applies.
  Solid white background. No additional objects or context scene.

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
  Solid white background. No additional context scene.

Iconization level: Detailed Flat (level 3).
Include symbolic material texture hints:
{MATERIAL_TEXTURE_HINT}
These are symbolic (not photorealistic) — thin lines, dashes, or highlights to suggest material.
No actual shading or gradients.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines, muted warm blue
and warm amber gold as accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
Exception: {SIGNAGE_EXCEPTION_IF_ANY}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
For HAND_HOLDING strategy: render the hand as flat schematic silhouette only —
no anatomical detail, no nails, no realistic skin texture.
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
Color palette: soft cream white background,
deep slate navy outlines, muted warm colors as fills.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
All tiles must share identical illustration style — no tile should look more detailed than another.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートF: 空間関係・位置名詞（1:1）【v2.3 新規】
  ## v2.4 修正: 背景指示の矛盾を解消。
  ##           v2.3 で「白背景にするな」と STYLE RECIPE の「pale background」が
  ##           同居していたため、「最小限の環境コンテキスト（机面・床面）」に統一。
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

Layout guidance (v2.4 unified background rule):
- Use a MINIMAL ENVIRONMENTAL CONTEXT to convey real-world scale.
  This means ONE simple surface plane is required — e.g., a plain desk surface,
  a floor with subtle depth lines, or a flat tabletop. The surface should be drawn
  with thin deep slate navy outlines on a soft cream (#FBFBFB) background.
- DO NOT use a completely blank/empty white background — without any surface,
  the spatial relationship becomes abstract and learners lose the real-world anchor.
- DO NOT add room walls, furniture beyond the reference object, decorative items,
  or any clutter — keep the environmental context to a single surface only.
- The reference object fills 40-50% of the frame. The target object is clearly visible.
- Subtle grid lines or floor depth lines on the single surface plane are ENCOURAGED
  to reinforce spatial depth (optional but recommended for 上・下・前・後ろ).

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
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines,
neutral gray for reference object, bold accent for target object.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers inside the image.
Directional arrows are PERMITTED if they clarify the position — use ARROW_SEMIOTICS rules.
A single surface plane (desk/floor) IS REQUIRED — this is not a "background element" but
a necessary spatial anchor.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートG: 指示語こそあど（1:1 または 16:9）【v2.3 新規】
  ## v2.4 修正: 3つのモデル（対面型/並行型/心理的引き込み）を全部書いた構造は
  ##           画像生成器を混乱させていた。{MODEL_TYPE_BLOCK} 1つだけ展開する
  ##           構造に変更し、"Choose ONLY ONE model type" を冒頭で明示。
  ##           3モデルの定義は PART 4.9 DEMONSTRATIVE_MODELS に分離。
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

⚠ IMPORTANT — Choose ONLY ONE model type per image:
This template supports three mutually exclusive territory models
(FACE_TO_FACE / PARALLEL / PSYCHOLOGICAL_PULL).
Pick exactly ONE based on the lesson's teaching goal, then expand the
{MODEL_TYPE_BLOCK} placeholder below with the corresponding text from
PART 4.9 DEMONSTRATIVE_MODELS. Do NOT include multiple models in one prompt —
combining them confuses the image generator and produces incoherent layouts.

Target demonstrative: {KO_SO_A_TYPE}
Selected model: {MODEL_TYPE_NAME} (one of: face_to_face / parallel / psychological_pull)

[SUBJECT]
{SPEAKER_DESCRIPTION} is the speaker (話者).
{LISTENER_DESCRIPTION} is the listener (聞き手).
   (Omit listener if MODEL_TYPE_NAME == "parallel" with single speaker,
    or if first-person POV is used.)
Target object: {TARGET_OBJECT}

[SCENE & ACTION]
{MODEL_TYPE_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE of the three model description
     blocks from PART 4.9 DEMONSTRATIVE_MODELS. Do not paste more than one.

Camera: Eye-level, 50mm lens equivalent. Characters fill 60% of the frame.
Minimal background — a simple floor plane with subtle depth lines is recommended.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines,
muted warm blue for speaker territory,
warm amber gold for listener territory or accent.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
Territory boundary lines and directional arrows ARE PERMITTED to clarify the こ/そ/あ zones.
No letters, numbers, or Japanese text inside the image (zone shapes and arrows only).
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートH: 動作語彙（1:1 または 16:9）【v2.3 新規】
  ## v2.4 追加: SEQUENCE_3PANEL 戦略を追加（始まり/中間/終わりの3コマ）。
  ##           BEFORE_AFTER（2コマ）では捉えきれない3フェーズ動詞用。
  ##           例: 作る・直す・教える・準備する など。
  ## ─────────────────────────────────────────────
  ## 資料10より: 動作は静止画において最も困難な表現。
  ##   方法1: モーションブラー + 方向性（軌跡の表現）
  ##   方法2: 矢印シンボル（「矢印は動詞である」）
  ##   方法3: 相互作用の結果描写（動作の outcome を示す）
  ##   方法4: Before/After 2コマ（変化を伴う動詞に最適）
  ##   方法5: 3コマシーケンス（v2.4 新規。3フェーズ動詞に最適）
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
(Choose ONE of the strategies below.)

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
  direction of movement. Color: cool slate gray #6B7C85.

Camera: Eye-level, 50mm lens equivalent. Character and action fill 70% of frame.
   (For SEQUENCE_3PANEL: each panel's character fills ~70% of that panel.)
Simple minimal background — enough context to ground the action, no clutter.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines, muted warm blue,
warm amber gold for directional arrows and accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
Directional arrows and motion lines ARE PERMITTED — they are the primary motion indicators.
Panel divider lines ARE PERMITTED for BEFORE_AFTER and SEQUENCE_3PANEL strategies.
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
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines, muted warm blue,
warm amber gold for warmth and positivity accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no symbols inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートJ: 形容詞語彙（1:1）【v2.4 新規】
  ## ─────────────────────────────────────────────
  ## 形容詞（大きい・小さい・きれい・新しい・古い・高い・安い 等）は
  ## 単独の物体描画では意味が伝わりにくい。「大きい」という性質は対比なしには
  ## 視覚化できないため、3つの戦略を用意する:
  ##   PAIR_CONTRAST    — 対比による視覚化（最も汎用性が高い）
  ##   SINGLE_HIGHLIGHT — 性質を強調した単独描画（記号的アクセントで補強）
  ##   PROPERTY_OVERLAY — 性質を象徴するオーバーレイ（光・しわ等の記号）
  ## ─────────────────────────────────────────────
  "vocabulary_adjective": """
[PURPOSE]
Create a vocabulary card illustration for the Japanese adjective "[TARGET_WORD]" ({TARGET_WORD_EN}).
The image must instantly communicate the adjectival quality. Adjectives describe a property,
not an object, so a single isolated object is rarely sufficient — visual contrast or
symbolic emphasis is required.

[SUBJECT]
Adjective category: {ADJECTIVE_CATEGORY}
   (one of: size / quantity / state / appearance / quality / age / temperature / value)
Anchor object(s): {ANCHOR_OBJECTS}
   The concrete object(s) that carry the adjectival quality.
   For PAIR_CONTRAST: two instances of the same object class.
   For SINGLE_HIGHLIGHT or PROPERTY_OVERLAY: one object.

[SCENE & ACTION]
Visualization strategy: {ADJECTIVE_STRATEGY}
(Choose ONE of the strategies below.)

[STRATEGY: PAIR_CONTRAST]  ← Default for most adjectives
  Two side-by-side panels showing the same object class in two contrasting states.
  Left panel:  the CONTRASTING (opposite) state — rendered in muted neutral tone
               (cool slate gray #6B7C85 outline + desaturated fill).
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
  The object fills 70-80% of the frame. Solid white background.
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
  Object fills 65-70% of the frame. Solid white background.

Camera: Eye-level or canonical 3/4 view depending on the anchor object's nature.
85mm portrait lens equivalent. (Eye-level for human-scale items; canonical 3/4 for smaller objects.)
Solid white background (#FBFBFB). No additional scene context.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines,
muted warm blue and warm amber gold as accents,
cool slate gray for contrasting/muted state.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
For PAIR_CONTRAST: a single thin vertical dividing line IS PERMITTED.
For SINGLE_HIGHLIGHT: small flat symbolic marks (sparkles, shine lines, worn marks)
ARE PERMITTED — limit to 3-5 marks, rendered as simple flat shapes, NOT as
photographic shine or lens flare.
For PROPERTY_OVERLAY: 3-5 schematic indicator marks (wavy lines, arrows, flake shapes)
ARE PERMITTED — flat symbolic style only.
No text, no letters, no numbers inside the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートK: 定型表現・感動詞（1:1）【v2.8 新規】
  ## ─────────────────────────────────────────────
  ## vocab_type: "set_expression" に対応。
  ## ありがとう / すみません / おはよう / はい / いいえ 等、
  ## テキストを排除した静止画で社会的機能を伝える語群。
  ## 設計原則: Minimal Social Context（社会的場面最小描写）+
  ##           感情オーバーレイ記号（身体ジェスチャー + 光線ピクト）の統合。
  ## 理論的根拠: Schmidt の気づき仮説（社会的文脈が言語機能の習得を促進）、
  ##             日本手話（JSL）の感情プロソディ（空間スペース・頭部傾き）、
  ##             共感制約理論（久野）。
  ## 画像化不適格の場合は使用しない（NON_VISUAL_VOCAB_POLICY 参照）。
  ## ─────────────────────────────────────────────
  "vocabulary_set_expression": """
[PURPOSE]
Create a vocabulary card illustration for the Japanese set expression "{TARGET_WORD}" ({TARGET_WORD_EN}).
This is a social expression — its meaning must be communicated entirely through
body language, gesture, and minimal social context, without any text.

[SUBJECT]
{SOCIAL_SCENE_DESCRIPTION}
Two generic adult figures (LEFT person = Orange fill / RIGHT person = Cool gray fill).
These are flat silhouette-style characters with simple schematic faces.

[SCENE & ACTION]
Social context: {MINIMAL_CONTEXT}
— Use the absolute minimum environmental elements needed to make the social function obvious.
  A single prop, a simple gesture, or an environmental cue is sufficient.

Body language encoding:
{BODY_LANGUAGE_SPEC}

Emotional overlay symbols (flat pictographic elements, placed near the relevant character):
{EMOTIONAL_OVERLAY_SPEC}

Composition: Characters occupy 70% of the frame. Scene fills 1:1 square format.
Camera: Eye-level front view at chest/head height of figures. 50mm standard lens equivalent.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream white background,
deep slate navy outlines, muted warm blue and warm amber gold as accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.

[CONSTRAINTS]
No text, no letters, no numbers inside the image.
Motion lines indicating nodding (vertical) or head-shake (horizontal) ARE PERMITTED.
Simple flat emotional overlay symbols (hearts, teardrops, exclamation marks as flat shapes,
morning sun, check marks / X marks as flat icons) ARE PERMITTED — limit to 3 symbols maximum.
A single-direction pointing arrow from the emotional symbol to the relevant character IS PERMITTED.
Generate as if this is part of a unified educational brand style guide.
""",
}  ## END PROMPT_TEMPLATES


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
## PART 4.4: ADJECTIVE_CATEGORY_MATRIX（形容詞カテゴリ別・図示戦略選択基準）
## ============================================================
##
## v2.8 新設【B3: Template J補強】。
## Deep Research §B-2「形容詞の図示選択マトリクス」より統合。
## Template J（vocabulary_adjective）の {ADJECTIVE_STRATEGY} 選択を
## 語彙カテゴリに基づいて決定するためのルックアップ辞書。
##
## 使い方: 形容詞語彙の vocab_type="adjective" を設定した後、
##   1. 下記テーブルで語彙カテゴリ（形容詞の種類）を特定。
##   2. 推奨戦略（PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY）を選択。
##   3. Template J の {ADJECTIVE_STRATEGY} スロットに展開する。
##
## ============================================================

ADJECTIVE_CATEGORY_MATRIX = {

  ## ── 身体感覚系 ─────────────────────────────────────────────────
  "sensory_pain": {
    "examples": ["痛い"],
    "strategy": "SINGLE_HIGHLIGHT",
    "rationale": "痛みは絶対感覚。比較不要。物理的トリガー（踏む）+ 局所スパーク記号の直接合成。",
    "design_spec": (
      "人物が床のブロックを踏んだ瞬間。足裏から黄色・赤の鋭角稲妻マーク（スパーク）を発散。"
      "顔：目を閉じ（アーチ型）、頭上にジグザグスパイラルライン。"
    ),
  },
  "sensory_temperature_heat": {
    "examples": ["暑い", "熱い"],
    "strategy": "PAIR_CONTRAST",
    "sub_strategy": "暑い=EXTREME_CONTRAST（気候）/ 熱い=PROPERTY_OVERLAY（物体温度）",
    "design_spec": {
      "暑い": (
        "2分割並置。左（暑い）：真っ赤な太陽・陽炎ライン・汗をかく人物・温度計MAX。"
        "右（寒い）：青い雪の結晶・コートを着て凍える人物・温度計MIN。"
      ),
      "熱い": (
        "PROPERTY_OVERLAY。超クローズアップ：マグカップ + 垂直湯気3本 + "
        "指先触れた瞬間の黄色衝撃火花 + 手を引くアクションライン。"
      ),
    },
  },
  "sensory_temperature_cold": {
    "examples": ["冷たい"],
    "strategy": "PROPERTY_OVERLAY",
    "design_spec": "冷えたグラス/缶。表面に水滴の凝結ピクト（小さな青い雫3〜5個）。手が触れた際の「ひんやりライン（青の波線）」。",
  },
  "sensory_weight": {
    "examples": ["重い", "軽い"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": (
      "2つの同一の箱。左（重い）：持ち手の腕が大きく沈み、下向きの太い重力アロー3本。"
      "右（軽い）：腕が軽々と高く上がり、上向きの細いアンバー点線アロー3本。"
    ),
  },
  "sensory_taste": {
    "examples": ["おいしい", "まずい", "甘い", "辛い"],
    "strategy": "PROPERTY_OVERLAY",
    "design_spec": {
      "おいしい": "人物が皿の料理を口に含み、頬に手を当て目を閉じる。頬ピンク。料理から湯気3本 + 白いミニスター（輝き）。",
      "まずい":   "顔を背ける（45度回転）。口元から「苦いライン（青いジグザグ）」。眉間にしわ（V字線）。",
      "甘い":     "ケーキや飴。ピンク・パステルの「甘い感覚ドット」を周囲に3点。",
      "辛い":     "人物の口から「赤い炎ピクト（V字の先端が尖った形）」。額に汗の青い雫。",
    },
  },

  ## ── 評価的・主観的 ─────────────────────────────────────────────
  "evaluative_positive": {
    "examples": ["きれい", "かわいい", "楽しい", "面白い"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": {
      "きれい":   "左（散らかった部屋、ダークグレー塗り）vs 右（整頓され輝きスター3点舞う部屋、フルカラー）。",
      "かわいい": "SINGLE_HIGHLIGHT。子猫のアイコン。周囲に「ピンクのハート3点」+ 「キラキラ星形2点」フロート。",
      "楽しい":   "SINGLE_HIGHLIGHT。両腕を上げ飛び上がる人物。周囲に黄色アンバーのエネルギードット5点。",
      "面白い":   "PAIR_CONTRAST。左（つまらない：横たわる人物、グレー）vs 右（笑い転げる：アハハ線）。",
    },
  },
  "evaluative_negative": {
    "examples": ["きたない", "難しい", "忙しい"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": {
      "きたない": "左（ゴミ散乱した机、ダーク塗り）vs 右（清潔な机、フルカラー）。",
      "難しい":   "SINGLE_HIGHLIGHT。人物の前に複雑な迷路。腕組み・頭傾き・頭上に巨大「？」マーク。",
      "忙しい":   "SINGLE_HIGHLIGHT。人物の周囲に大量のタスクアイテム（書類・時計・電話）が渦巻く。汗ピクト。",
    },
  },

  ## ── 物理的性質 ──────────────────────────────────────────────────
  "physical_size": {
    "examples": ["大きい", "小さい"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": (
      "同一の接地線上に、同じオブジェクト（例：犬）を並置。"
      "左（大きい）：接地線からの高さが右の3倍。寸法指示線（双矢印）。"
      "右（小さい）：ミニチュアサイズ。同様に寸法線。"
    ),
  },
  "physical_age": {
    "examples": ["新しい", "古い"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": (
      "同一の本のペア。左（新しい）：鮮やかなカラー表紙・折れなし・輝きマーク。"
      "右（古い）：くすんだグレー表紙・折れ・傷のシワライン3本。"
    ),
  },
  "physical_value": {
    "examples": ["高い（値段）", "安い"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": (
      "同一の商品タグ付きアイテムのペア。"
      "左（高い）：タグに大きな「円記号 + 山のような積み重ね線（金額の高さ）」。"
      "右（安い）：タグに小さな「円記号 + 低い線」。価格バーグラフのような比較。"
      "※ 数字は禁止。相対的な量を抽象的な長さのバーで表す。"
    ),
  },
  "physical_brightness": {
    "examples": ["明るい", "暗い"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": (
      "部屋（窓1つ）を2分割。左（明るい）：窓から強い光線が差し込み、フロア全体が暖かい黄色フラットカラー。"
      "右（暗い）：窓が閉まり、部屋全体がダークスレートグレーのフラット塗り。"
    ),
  },

  ## ── 距離・空間 ──────────────────────────────────────────────────
  "spatial_distance": {
    "examples": ["遠い", "近い"],
    "strategy": "PAIR_CONTRAST",
    "design_spec": (
      "同一パネル内：左（近い）: 2つの人物アイコンが接近（間に短い双矢印）。"
      "右（遠い）: 同じ2アイコンが画面の両端に分離し、間に長い点線双矢印。"
    ),
  },

  "critical_note": (
    "選択戦略に迷ったときのデフォルト: PAIR_CONTRAST が最も汎用性が高い。"
    "感覚的・絶対的な形容詞（痛い・熱い等）のみ SINGLE_HIGHLIGHT / PROPERTY_OVERLAY に切り替える。"
    "根拠: Mayer の空間近接性原則（比較対象は同一パネル内に並置することで注意分割を防ぐ）。"
  ),
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
## PART 4.9: DEMONSTRATIVE MODELS（指示語こそあどの3モデル定義）
## ============================================================
##
## v2.4 新規追加。
##
## テンプレートG（demonstrative_kosoado）で使用する3つの territory model を
## ここに分離した。テンプレートGの {MODEL_TYPE_BLOCK} には、以下のいずれか
## 1つの値をプロンプト生成時にコピーして埋め込む。
##
## ⚠ 重要: 同一プロンプト内に複数のモデルを書かないこと。画像生成器が混乱する。
##
## モデル選択ガイド:
##   - FACE_TO_FACE (対面型):
##       話者と聞き手が向かい合うシーン。学習者に「自分と相手の領域の違い」を
##       明示したい時。最も入門的・直感的。
##   - PARALLEL (並行型):
##       話者と聞き手が並んで同じ方向を見る。距離感（近・中・遠）を強調したい時。
##   - PSYCHOLOGICAL_PULL (心理的引き込み):
##       話者の領域が対象に向かって変形する。心理的所有・関与度を示したい時（中上級）。
## ============================================================

DEMONSTRATIVE_MODELS = {

  "face_to_face": """
[MODEL TYPE: FACE-TO-FACE (対面型)]
Speaker and listener stand facing each other.
Divide the space between them with a clear VISUAL BOUNDARY LINE (dashed or subtle line).
Color code the territories:
- 「こ」zone (speaker's side): highlight with speaker's accent color (soft warm blue).
- 「そ」zone (listener's side): highlight with listener's accent color (soft amber).
- 「あ」zone (outside both): neutral gray zone beyond both territories.
The target object [{TARGET_OBJECT}] is placed in the [{TARGET_ZONE}] zone.
Both speaker and listener face each other with clear pointing gesture toward the target object.
""",

  "parallel": """
[MODEL TYPE: PARALLEL (並行型)]
Speaker and listener stand side by side, both facing the same direction.
Draw a shared ellipse close to them representing the こ zone (warm blue),
then a medium-distance zone representing そ (amber),
then a far-distance zone representing あ (gray).
The target object is positioned at the [{DISTANCE_ZONE}] marker.
Use concentric distance rings or floor depth lines (parallel horizontal lines
receding into the distance) to clarify the three distance levels.
""",

  "psychological_pull": """
[MODEL TYPE: PSYCHOLOGICAL PULL (心理的引き込み)]
Show the speaker's こ territory as a soft elliptical shape around the speaker.
Then show the ellipse STRETCHING and deforming toward the target object as if the
speaker were pulling it into their territory.
The speaker leans forward or extends one hand toward the object in a protective
or possessive gesture.
Use the speaker's accent color (warm blue) to highlight BOTH the stretched
territory AND the target object — this color binding shows psychological ownership.
The listener is omitted from this model (single-speaker focus).
"""
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
    ],

    "adjective": [
      "形容詞の「性質」が視覚化されているか（単独物体描画ではないか）",
      "PAIR_CONTRAST の場合: 左右パネルが同一の物体クラス・同一視点・同一スケールで描かれているか",
      "PAIR_CONTRAST の場合: 対比される性質が明確に見分けられるか（小さい/大きいなら2倍以上のサイズ差）",
      "SINGLE_HIGHLIGHT の場合: 性質強調マーク（光・しわ等）が3-5個に収まっているか（多すぎないか）",
      "PROPERTY_OVERLAY の場合: オーバーレイマークがフラットな記号で描かれているか（写実的光・影になっていないか）",
      "顔の表情で性質を示していないか（物体の見た目のみで意味を伝えること）"
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
## v2.4 で追補: adjective タイプ追加（Step 6.5 新設）。
##              テンプレートD HAND_HOLDING 戦略の選択基準（Step 3-D）。
##              テンプレートG 1モデル展開ルール（Step 4 demonstrative）。
##              テンプレートH SEQUENCE_3PANEL 戦略の選択基準（Step 5-B）。
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
    "adjective"        → 形容詞（大きい・小さい・きれい・新しい・古い 等）【v2.4 新規】
    "set_expression"   → 定型表現・感動詞（ありがとう・すみません・はい・いいえ・おはよう 等）【v2.8 新規】
    "non_visual"       → 画像生成不適格語（接尾辞・接頭辞・文脈依存副詞等）【v2.8 新規】
                         → imageStatus = 'no_image_needed' に設定。画像は生成しない。

  判断が難しい語彙の基準:
    - 「写真を撮る」→ action_verb（動作が主）
    - 「写真」単体 → concrete_object（物体として示す）
    - 「元気」→ abstract_concept（目に見えない状態）
    - 「右側の席」→ spatial_relation（位置関係が主）
    - 「大変（な仕事）」→ abstract_concept（感情・評価を伴う）
    - 「大きい（机）」→ adjective（物体の性質を示す形容詞）

  ━━ ハードゲート（v2.7 / A層対応・厳守）━━
  vocab_type 未設定のままプロンプト作成を始めないこと。
  これは推奨ではなく停止条件である:

    1) 対象 lesson_NN.json の vocabulary[] を走査する。
    2) vocab_type が null / 空 / 未定義の語彙が1件でもあれば、
       プロンプト生成を開始せず、まず分類を完了させる
       （または人間に分類確認を依頼する）。
    3) 既知の未設定例: lesson_01_v1_1.json / lesson_02_v2_11_11.json は
       vocabulary[].vocab_type が全件 null（2026-05-18 時点）。
       → S列プロンプト生成の前段として、Step 0 の8分類で
         vocab_type を確定させる作業が必須。これは本ガイド(.py)では
         なく lesson_NN.json 側の修正であり、別作業として実施する。
    4) 量産フェーズ（N5全412語）に入る前にも同ゲートを再確認する。

  ※注: CHARACTER_RENDERING_POLICY.applies_to には
    pronoun / interjection / set_expression / adverb / counter / time /
    sensory も列挙されているが、これらに対応する PROMPT_TEMPLATE と
    本 HOW_TO_USE の Step はまだ存在しない（B層・別途対応）。
    現時点でこれらの語が出た場合は、人間に提示方式を確認してから進める
    （場当たり生成しない）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: STYLE_BIBLE を確認する
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → "core_style" と "color_palette" と "constraints" は変更しない
  → "focal_length_standards" を参照（v2.3: カノニカル視点がデフォルト）
  → "iconization_level_guide" で推奨レベルを確認（多くの語彙は level_3_detailed_flat）

  ━━ v2.7 追加チェック（A層対応・厳守）━━
  ① アスペクト比: PART 1.2 ASPECT_RATIO_POLICY を確認する。
     - GAS経由（語彙カード量産）→ 本文にアスペクト比文を入れない。
     - 手動/別経路・例文 → 先頭に manual_prefix の該当フレーズを1行追加。
     lesson_01/02 の S列は GAS経由前提 → アスペクト比文は書かない。
  ② 肌色: PART 2.4 CHARACTER_RENDERING_POLICY を確認する。
     - 汎用の職業・役割・家族の人物（diverse_unspecified）
       → 肌色フレーズを一切書かない（行ごと省く。空文字でもない）。
     - 例文・代名詞等（neutral_avatar_abstract）
       → "Gender-neutral avatar, neutral cool light gray skin." を追記。
     - 固定5名のみ（named_character_identity）
       → 各 NAMED_CHARACTER_PROFILES の個別ヒントに従う。
     旧 "Skin tones: naturally warm medium skin tone." は使用禁止
     （褐色固定の原因。handoff §4.2/§4.4/§10）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2: 人物画像の設計（vocab_type: person）
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 2-A: 役割を特定 → ROLE_BASED_GENERIC_PROFILES から選択
  Step 2-B: 年齢層・性別を選択 → CHARACTER_PROFILES の generic_* から選択
  Step 2-C: outfit_hints / scene_hints を組み合わせる
  Step 2-D: 同一セット内の整合性確保（同じ役割なら同じ generic_* を採用）
  Step 2-E:【v2.7・A層】肌色フレーズを付けない。
           汎用の職業・役割人物は CHARACTER_RENDERING_POLICY.diverse_unspecified
           に該当 → "Skin tones: ..." の行を書かない（多様性のため意図的に非指定）。
           固定5名（鈴木/リン/キム/タノム/ケリー）を描く場合のみ
           NAMED_CHARACTER_PROFILES の個別ヒントに従う。
  → テンプレートA（vocabulary_person）を使用
  → 画像プロンプトに固有名詞（Tanaka-sensei 等）は絶対に書かない

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: 具体物画像の設計（vocab_type: concrete_object）【v2.3 新規 / v2.4 追補】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 3-A: OBJECT_SIGNATURES で対象語彙のエントリを確認
            → primary_signatures / material_hints / avoid を読む
  Step 3-B: canonical_view の指示を確認（物体ごとに最適角度が異なる）
  Step 3-C: テンプレートD（vocabulary_object_concrete）を使用
            → {VISUAL_SIGNATURE} に primary_signatures を転記
            → {MATERIAL_TEXTURE_HINT} に material_hints を転記
            → {DISPLAY_STRATEGY} を選択（v2.4 新規）:
              "OBJECT_ALONE"  → 単独描画（デフォルト）
              "HAND_HOLDING"  → 手で持つ描画（スケール固定・身体化認知）
  Step 3-D: HAND_HOLDING を選ぶ判断基準（v2.4 新規）:
            ✓ 手のひらサイズの物体である（ケータイ・財布・鍵・コップ・本 等）
            ✓ スケール感（実際の大きさ）が語彙理解に重要
            ✓ 「使う」イメージが意味理解を助ける
            ✗ 大きすぎる物体（机・自転車・冷蔵庫 等）→ OBJECT_ALONE
            ✗ AIによる手の生成が安定しない場合は OBJECT_ALONE にフォールバック
  Step 3-E: 類似形状の物体がある場合はテンプレートE（vocabulary_variant_grid）も検討
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
              （v2.4: 必ず1つだけ選択する。複数選んで混ぜないこと）
    Step 4-B: ARROW_SEMIOTICS から適切な矢印タイプを選択
    Step 4-C: テンプレートG（demonstrative_kosoado）を使用
              → {MODEL_TYPE_NAME} に "face_to_face" / "parallel" / "psychological_pull"
                のいずれか1つを記入
              → {MODEL_TYPE_BLOCK} に PART 4.9 DEMONSTRATIVE_MODELS の該当値を
                コピーして埋め込む
              → ⚠ 重要（v2.4）: 同一プロンプト内に複数のモデルを書かないこと。
                画像生成器が3つのモデルを混合して破綻した構図を出力する原因になる。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 5: 動作語彙画像の設計（vocab_type: action_verb）【v2.3 新規 / v2.4 追補】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 5-A: 動作のタイプを判断し戦略を選択:
    MOTION_ARROW       → 方向性のある移動動詞（行く・来る・投げる 等）
    OUTCOME            → 結果が視覚的に明確な動詞（買う・食べる・飲む 等）
    BEFORE_AFTER       → 変化を伴う2状態動詞（切る・壊す・着る・開ける 等）
    SEQUENCE_3PANEL    → 3フェーズ動詞（作る・直す・教える・準備する 等）【v2.4 新規】
    SYMBOLIC_MOTION    → 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）
  Step 5-B: BEFORE_AFTER vs SEQUENCE_3PANEL の判断基準（v2.4 新規）:
    BEFORE_AFTER を選ぶ:
      ✓ 2状態（前/後）で意味が完結する動詞
      ✓ 中間プロセスが視覚的に重要でない
      例: 切る（切る前/切った後）、開ける（閉まっている/開いている）
    SEQUENCE_3PANEL を選ぶ:
      ✓ 始まり・中間・終わりの3フェーズがそれぞれ意味の理解に重要
      ✓ プロセス自体が動詞の本質
      例: 作る（材料/組立中/完成）、教える（困惑/説明中/理解）
  Step 5-C: ARROW_SEMIOTICS から矢印タイプを選択
  Step 5-D: テンプレートH（action_verb）を使用
            → {VISUALIZATION_STRATEGY} に上記5戦略のいずれかを記入

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
Step 6.5: 形容詞語彙画像の設計（vocab_type: adjective）【v2.4 新規】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  形容詞は「性質」を視覚化する必要があり、単独物体描画では意味が伝わりにくい。
  必ず以下の3戦略のいずれかを選択する。

  Step 6.5-A: ADJECTIVE_CATEGORY を分類:
    size       → 大きい・小さい・高い・低い・長い・短い
    quantity   → 多い・少ない
    state      → きれい・汚い・元気・暇
    appearance → 新しい・古い・若い
    quality    → いい・悪い
    age        → 古い・新しい
    temperature→ 暑い・寒い・熱い・冷たい
    value      → 高い（高価）・安い

  Step 6.5-B: ADJECTIVE_STRATEGY を選択:
    PAIR_CONTRAST    → デフォルト。対立する性質との並置（左:対比 / 右:ターゲット）
                       例: 大きい/小さい・新しい/古い・きれい/汚い
                       対義語のペアが明確にある形容詞に最適。
    SINGLE_HIGHLIGHT → ターゲットの性質を強調した単独描画
                       例: 「きれい」→ ピカピカの机にスパークル記号
                       対義語が描きにくい・対比が冗長になる時に。
    PROPERTY_OVERLAY → 不可視の性質を記号オーバーレイで表現
                       例: 「暑い」→ 物体の上に上昇する波線（amber）
                          「重い」→ 物体の下に下向き矢印（gray）
                       温度・重さなど物理的に見えない性質に。

  Step 6.5-C: テンプレートJ（vocabulary_adjective）を使用
              → {ADJECTIVE_CATEGORY} に分類を記入
              → {ANCHOR_OBJECTS} に対象物体を記入
              → {ADJECTIVE_STRATEGY} に選択した戦略名を記入

  Step 6.5-D: ⚠ 注意:
              ✗ 顔の表情で形容詞を示さないこと（「大きい」→ 驚いた顔 はNG）
              ✗ 物体の見た目とシンボルマークのみで意味を伝える
              ✗ SINGLE_HIGHLIGHT のシンボルマークは3-5個まで（過剰にしない）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 6.6: 定型表現・感動詞の設計（vocab_type: set_expression）【v2.8 新規】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 6.6-A: NON_VISUAL_VOCAB_POLICY で画像化可否を確認
    → 3条件チェック。いずれか該当 → vocab_type="non_visual" / imageStatus="no_image_needed"
    → 全条件クリア → Template K（vocabulary_set_expression）を使用

  Step 6.6-B: 語彙ごとの社会的場面設計
    → {MINIMAL_CONTEXT}: 社会的機能を最小限の要素で表現する場面を1行で記述
      例）ありがとう: "one person receiving a gift box with both hands from another"
          すみません（謝罪）: "a person who has accidentally spilled water, bowing to another"
          すみません（呼びかけ）: "a person raising one hand straight up to call a waiter"
          おはよう: "two people near a window showing a half-risen orange sun"
          はい: "a person nodding with a green circle icon in the background"
          いいえ: "a person shaking their head with a red X icon in the background"
    → {BODY_LANGUAGE_SPEC}: ジェスチャー・頭部動作・モーションラインを具体的に指定
    → {EMOTIONAL_OVERLAY_SPEC}: 感情を示すフラット記号（ハート・汗・輝き等）を最大3点指定

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 7: 例文画像の設計（テンプレートC）【v2.8 全面更新】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  手順:
  1. 例文の grammarConceptID を lesson_NN.json の patterns[].grammarConceptID から取得する。

  2. GRAMMAR_VISUAL_ENCODING_30 でそのエントリを参照する。
     → panels（パネル数）を確認: 1パネル / 2パネル / 3パネル
     → layout（構図設計）を確認: プロンプトの {SCENE_DESCRIPTION} に展開する
     → visual_symbols（使用許可の視覚記号）を確認: {VISUAL_SYMBOL_IF_NEEDED} に展開する
     → avoid（典型的失敗）を最終チェックに使用する
     → theory（理論的根拠）は必要に応じて教材設計メモに記録する

  3. パネル数に応じた {COMPOSITION_NOTES} を設定する:
     - 1パネル: "Single panel. Wide 16:9. Characters occupy 60% of the frame."
     - 2パネル: "Two-panel horizontal sequence. Panel 1 on the left, Panel 2 on the right.
                A thin vertical dividing line separates the panels.
                Each panel occupies 50% of the 16:9 frame."
     - 3パネル: "Three-panel horizontal sequence. Panels equally divide the 16:9 frame.
                Thin vertical dividing lines separate the panels."

  4. 人物描写には CHARACTER_RENDERING_POLICY.neutral_avatar_abstract を適用する。
     → "Gender-neutral avatar, neutral cool light gray skin." を CONSTRAINTS 後に追記。
     ※ ただし授受（L10/L24/L25）では「話者=オレンジ左固定/他者=グレー右」のカラーコードを
       GRAMMAR_VISUAL_ENCODING_30 の指示に従って適用する（視点固定のため）。

  5. テンプレートC（example_sentence）の全スロットを埋める。

  6. GRAMMAR_VISUAL_ENCODING_30 に対応エントリがない grammarConceptID の場合:
     → B層未整備（現在の GRAMMAR_VISUAL_ENCODING_30 はコア文型のみカバー）。
     → 人間に設計方針を確認してから進む（場当たり生成しない）。

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
    "variant_grid_group": "print_media",      ← 省略可: 並置グリッドで使うグループ名
    "display_strategy": "OBJECT_ALONE"        ← v2.4 新規: concrete_object 用
                                                 "OBJECT_ALONE" または "HAND_HOLDING"
  }

  formative_adjective 例（v2.4 新規）:
  {
    "word": "大きい",
    "reading": "おおきい",
    "en": "big / large",
    "imageId": "vocab_大きい",
    "vocab_type": "adjective",                ← v2.4 新規値
    "adjective_category": "size",             ← v2.4 新規フィールド
    "adjective_strategy": "PAIR_CONTRAST",    ← v2.4 新規フィールド
    "anchor_objects": ["ball"]                ← 描画する物体クラス
  }

  demonstrative 例（v2.4 改訂）:
  {
    "word": "これ",
    "reading": "これ",
    "en": "this (near speaker)",
    "imageId": "vocab_これ",
    "vocab_type": "demonstrative",
    "model_type_name": "face_to_face",        ← v2.4 新規: 必ず1つだけ指定
    "ko_so_a_type": "こ",
    "target_zone": "こ"
  }

  action_verb 例（v2.4 拡張）:
  {
    "word": "作る",
    "reading": "つくる",
    "en": "to make",
    "imageId": "vocab_作る",
    "vocab_type": "action_verb",
    "visualization_strategy": "SEQUENCE_3PANEL"  ← v2.4 新規値が選択肢に追加
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
##
## v2.4 新規追加の参照辞書:
##   - DEMONSTRATIVE_MODELS (PART 4.9): 指示語の3モデル定義（テンプレートG用）
## ============================================================


## ============================================================
## PART 7: GRAMMAR_VISUAL_ENCODING_30（30課文型 → 視覚エンコーディング対応表）
## ============================================================
##
## v2.8 新設【C層対応】。
## Deep Research「日本語教材の視覚エンコーディング方法論」§A + §30課対応表 より統合。
##
## 【目的】
##   Template C（example_sentence）の {SCENE_DESCRIPTION} / {COMPOSITION_NOTES} /
##   {VISUAL_SYMBOL_IF_NEEDED} を設計する際のSSOT。
##   各 grammarConceptID に対して、以下を提供する:
##     - panels        : 推奨パネル数（1 / 2 / 3）
##     - panel_type    : McCloud/Cohn の分類（Establisher / Peak / Action-to-Action 等）
##     - layout        : 具体的な構図設計の記述
##     - visual_symbols: 使用を許可・推奨する視覚記号
##     - avoid         : 典型的失敗（やってはいけない表現）
##     - theory        : 認知的・理論的根拠（DRから引用）
##
## 【使い方】（Step 7 参照）
##   1. 設計する例文の grammarConceptID を lesson_NN.json の patterns[].grammarConceptID から取得。
##   2. 下記辞書から対応するエントリを参照。
##   3. panels・layout を Template C の空スロットに展開してプロンプトを作成。
##   4. visual_symbols から必要な記号を ARROW_SEMIOTICS / VISUAL_SYMBOLS から取得。
##   5. avoid を最終チェックに使用。
##
## ============================================================

GRAMMAR_VISUAL_ENCODING_30 = {

  ## ──────────────────────────────────────────────────────────
  ## L1: 名詞述語文
  ## ──────────────────────────────────────────────────────────
  "noun_predicate_affirmative": {
    "target": "〜は〜です（肯定）",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "人物（左・中央）と、その役割を示す職業サイン（右）を並置。"
      "人物は ROLE_BASED_GENERIC_PROFILES のコアアイテムで役割を体現。"
      "人物と役職/属性の間に視線の繋がり（視線コーン：薄い黄透過線）を配置して"
      "「=」関係を暗示する。背景は最小限の職場コンテキスト。"
    ),
    "visual_symbols": ["視線コーン（薄黄透過）", "職業アイコン"],
    "avoid": "人物と役職を別パネルに分けない（空間近接原則）。矢印は不要（= 関係は視線で示す）。",
    "theory": "Mayer 空間近接性原則：比較・関連要素は同一パネル内で最も効率的に処理される。",
  },
  "noun_predicate_question": {
    "target": "〜ですか / 〜じゃありません",
    "panels": 2,
    "panel_type": "Action-to-Action",
    "layout": (
      "パネル1（疑問）：口元から「？マーク付き発話バブル（実線）」が出る人物A（左）と、"
      "人物B（右、属性不明：シルエット＋グレー）。"
      "パネル2（否定）：人物Bが大きく首を横に振る（横モーションライン2本）。"
      "背後に赤いフラット✕アイコン（不透明度80%）。"
    ),
    "visual_symbols": ["？マーク発話バブル", "横モーションライン（首振り）", "赤✕アイコン"],
    "avoid": "否定を1パネルで描くと首振りと発話が混在して読み取りにくくなる。",
    "theory": "VNG Peak（最大情報量のモーメント）を2パネルで段階的に提示することで認知負荷を分散。",
  },
  "noun_no_affiliation": {
    "target": "〜の〜（所属）",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "人物（左）と建物アイコン（右）を、共通のパステルカラー「閉合バブル境界線」で包摂。"
      "人物から建物に向けて腕を伸ばし、建物の看板に軽く手を触れる（接触ジェスチャー）。"
      "バブル内部はフラットな薄い青色で塗る（所属領域を示す）。"
    ),
    "visual_symbols": ["閉合バブル境界線（パステルブルー・破線）", "手先接触ジェスチャー"],
    "avoid": "人物から建物への指示矢印は使用しない（矢印は動作を示すため所属関係と混同される）。",
    "theory": "ゲシュタルト心理学：閉合の法則 + 二重符号化理論（空間スキーマとしての統合）。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L2: こそあど・所有
  ## ──────────────────────────────────────────────────────────
  "kosoado_pronoun_thing": {
    "target": "これ/それ/あれ は〜です",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "話者（左）と聞き手（右）、オブジェクトを1パネルに配置。"
      "話者・聞き手・オブジェクトの3点間に、それぞれ「距離指示コーン"
      "（長さの異なる3色の透過フラット光線）」を照射して三称を弁別。"
      "これ=暖色短線（話者近傍）、それ=青中線（聞き手近傍）、あれ=グレー長線（遠方）。"
    ),
    "visual_symbols": ["距離指示コーン（長さ・色で距離を弁別）"],
    "avoid": "オブジェクトを3つ別々に描かない（1つのオブジェクトと話者・聞き手の配置で示す）。",
    "theory": "空間トポロジー + Mayer 近接性原則。",
  },
  "noun_no_possession": {
    "target": "〜の〜（所有）",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "人物（左）とオブジェクト（例：バッグ）を近接配置。"
      "人物とオブジェクトを共通の薄い青い「閉合バブル境界線（破線）」で包摂。"
      "人物の手先がオブジェクトに直接触れているか、腕の中に抱え込む（パーソナルスペース取り込み）。"
    ),
    "visual_symbols": ["閉合バブル境界線（破線）", "手先接触・抱え込みジェスチャー"],
    "avoid": "人物からオブジェクトへの指示矢印を使わない。",
    "theory": "ゲシュタルト閉合の法則 + 二重符号化理論（空間スキーマ）。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L3: 動詞現在形・時間表現
  ## ──────────────────────────────────────────────────────────
  "verb_present_time_ni": {
    "target": "〜に〜ます（時刻＋動詞）",
    "panels": 2,
    "panel_type": "Moment-to-Moment",
    "layout": (
      "パネル1：時計（針で時刻を示す・数字禁止）と眠っている人物（ベッド）。"
      "パネル2：同人物が跳び起きて前方へステップアロー（起床アクション）。"
      "2パネルを繋ぐ時間経路ライン（細い横直線矢印）。"
    ),
    "visual_symbols": ["時計（針のみ・文字盤なし）", "前方ステップアロー"],
    "avoid": "数字で時刻を表記しない（数字禁止ルール）。",
    "theory": "コマ間推論（McCloud）：時間の順序マッピング。",
  },
  "verb_time_range": {
    "target": "〜から〜まで〜ます/ません",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "左端の起点アイコン（家など）から右端の終点アイコン（学校など）の間に、"
      "両端に矢印が付いた「レンジブラケット（双矢印の境界線）」を架橋。"
      "双矢印の上に行為を示すアクションアイコン（歩く人物の小アイコン）。"
    ),
    "visual_symbols": ["双矢印レンジブラケット", "起点・終点アイコン"],
    "avoid": "時間範囲を2つの別々のコマで分割しない（一目で範囲全体が見える構図）。",
    "theory": "空間レンジの認知モデル。",
  },
  "verb_past": {
    "target": "〜ました/〜ませんでした（過去）",
    "panels": 2,
    "panel_type": "Action-to-Action",
    "layout": (
      "パネル1（現在）：現在の状況（例：晴天で歩く人物・フルカラー）。"
      "パネル2（過去）：過去を示す「昨日カレンダーアイコン（丸印付き）+ 過去の出来事」。"
      "過去パネルの輪郭を薄いグレーのビネット（周囲ぼかし＝平面では薄い枠）で示す。"
    ),
    "visual_symbols": ["カレンダーアイコン（過去日付に丸）", "時間遷移ライン（左向き）"],
    "avoid": "過去・現在を同一パネルに混在させない。",
    "theory": "時間軸の左向き推移、McCloud の移行遷移。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L4: 他動詞・〜で（場所）
  ## ──────────────────────────────────────────────────────────
  "verb_transitive_wo": {
    "target": "〜を〜ます（他動詞）",
    "panels": 1,
    "panel_type": "Peak",
    "layout": (
      "人物の手元のオブジェクトから口・目的地へ向かう「エネルギー伝達ライン（赤または青の短矢印）」。"
      "オブジェクトと人物のアクション接点に「ヒットマーク（アクション完了を示す★or火花）」。"
      "人物は動作のピーク（ビーム直後、コップが傾いた瞬間など）で描く。"
    ),
    "visual_symbols": ["エネルギー伝達矢印（短・赤）", "ヒットマーク（★または火花）"],
    "avoid": "静止した人物がオブジェクトを持っているだけの絵にしない（動作のピークを描く）。",
    "theory": "VNG のPeak（最大エネルギーのモーメント）。他動詞のエネルギー伝達。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L7: 存在・助数詞
  ## ──────────────────────────────────────────────────────────
  "existence_ni_ga": {
    "target": "〜に〜があります/がいます",
    "panels": 1,
    "panel_type": "Containment",
    "layout": (
      "場所を示す「容器（太い実線の部屋・机・箱）」を中央に配置。"
      "その内部に、あります→静止した幾何学的オブジェクト（整列）。"
      "います→生物アイコン（猫など）の尾をわずかに非対称にして「生命活性」を示す。"
    ),
    "visual_symbols": ["容器モデル（太実線の境界）", "生物の微細非対称（尾の曲がり）"],
    "avoid": "あります/います を同一の完全静止シルエットで描かない（生物/非生物の弁別が失われる）。",
    "theory": "アイソタイプ + 空間の「入れ物（Containment）」モデル。",
  },
  "counter_existence": {
    "target": "〜が〜つあります（助数詞）",
    "panels": 1,
    "panel_type": "Isotype Grid",
    "layout": (
      "完全に同一サイズ・同一形状のオブジェクトのフラットアイコンを、"
      "等間隔で水平一列に並置（シリアル反復）。変形・拡大・縮小禁止。"
      "太い点線の容器フレームで一括り。"
    ),
    "visual_symbols": ["アイソタイプ・シリアル反復グリッド（全同一サイズ）"],
    "avoid": "大中小の異なるサイズで数量を表現しない（面積による量感は認知的誤認を招く）。",
    "theory": "Neurath のアイソタイプ：シリアル反復による数量表現。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L10/L25: 授受動詞
  ## ──────────────────────────────────────────────────────────
  "juuju_ageru": {
    "target": "〜は〜に〜をあげます / てあげます",
    "panels": 1,
    "panel_type": "Peak",
    "layout": (
      "話者（オレンジ・左・固定）から他者（グレー・右）へ向けて、"
      "オブジェクトを両手で引き渡す。「赤色の太い直進方向アロー（左→右）」を横に走らせる。"
      "てあげる: オブジェクトの代わりに動作を示すアクションアイコンを「思考バブル風吹き出し」に入れて接続。"
    ),
    "visual_symbols": ["左→右 直進赤アロー", "話者オレンジ色コード（全授受で固定）"],
    "avoid": "話者の立ち位置を左固定にしないと視点が混乱する（全授受表現で左=話者を絶対固定）。",
    "theory": "久野の共感制約理論。Uchi-Soto モデル。空間レイアウトの固定化で認知摩擦をゼロ化。",
  },
  "juuju_morau": {
    "target": "〜は〜に/から〜をもらいます / てもらいます",
    "panels": 2,
    "panel_type": "Initial → Peak",
    "layout": (
      "パネル1（依頼）：話者（オレンジ・左）が他者（グレー・右）に向けてお辞儀 + 両手を差し出す。"
      "パネル2（受取）：他者からオブジェクトを話者が両腕でパーソナルスペース内に取り込む。"
    ),
    "visual_symbols": ["お辞儀ポーズ（頭部前傾）", "腕でのパーソナルスペース取り込み"],
    "avoid": "もらうとくれるを同じ1枚の引き渡しシーンで描かない（依頼パネルの前置が必須）。",
    "theory": "久野の共感制約理論。「もらう」は事前の依頼行為の後に来る自発的獲得。",
  },
  "juuju_kureru": {
    "target": "〜は（わたしに）〜をくれます / てくれます",
    "panels": 1,
    "panel_type": "Peak",
    "layout": (
      "他者（グレー・右）から話者（オレンジ・左）へ向けてオブジェクトを渡す。"
      "アロー方向は右→左。"
      "話者の顔周囲に「感謝・温かさを示す黄色のドット星形（輝き）を3点」配置。"
    ),
    "visual_symbols": ["右→左 直進青アロー", "話者周囲の黄色輝きドット3点"],
    "avoid": "あげる（左→右アロー）とくれる（右→左アロー）の向きを混同しない。",
    "theory": "授受動詞の指向性ベクトル。視点固定によるEmpathyエンコーディング。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L12: ている（アスペクト二義性）
  ## ──────────────────────────────────────────────────────────
  "te_iru_progressive": {
    "target": "〜ています（動作の進行）",
    "panels": 1,
    "panel_type": "Peak（動的オーバーレイ）",
    "layout": (
      "人物の動作ピーク（例：走る人物・食べる人物）を単一パネルで描く。"
      "腕・足の軌道に沿って「2〜3本の湾曲モーションライン（風切り線）」を重ねる。"
      "身体を動作方向に25度傾斜させる。背景に流れる横線（オプション）。"
    ),
    "visual_symbols": ["湾曲モーションライン（風切り線）2〜3本", "身体傾斜（25度）"],
    "avoid": "風切り線なしの完全直立静止ポーズは進行中に見えない。",
    "theory": "VNG の Peak（極大エネルギーモーメント）。McCloud の瞬間遷移。",
  },
  "te_iru_resultant_state": {
    "target": "〜ています（結果状態）",
    "panels": 2,
    "panel_type": "Initial → Release",
    "layout": (
      "パネル1（Initial）：変化を起こすアクションの瞬間（例：コップが手から滑る）。"
      "パネル2（Release）：アクション完了後の静止結果状態（例：床に割れたコップ）。"
      "パネル2からは動的アクションラインを完全に除去。"
      "「接地線（グラウンドライン）」のみ太く描写して静止を示す。"
    ),
    "visual_symbols": ["グラウンドライン（太・静止を示す）"],
    "avoid": "結果状態を1パネルで描き衝突火花を重ねると『進行』と混同される。",
    "theory": "VNG Release（余韻・結果）パネル：エネルギー伝達が停止した事後状態。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L9/L22: 比較・条件
  ## ──────────────────────────────────────────────────────────
  "comparison_yori": {
    "target": "〜は〜より〜です（比較）",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "同一の太い黒の接地線（グラウンドライン）を共有した状態で2つの比較対象を並置。"
      "主語（は）側の対象の直上にのみ「上方向の青い寸法矢印 + 差分を示す点線補助グリッド」。"
      "主語側の対象全体に「半透明の黄色スポットライトコーン」をオーバーレイ（顕著性向上）。"
    ),
    "visual_symbols": ["共通接地線", "上方向寸法矢印（主語側のみ）", "黄スポットライトコーン"],
    "avoid": "2つの比較対象を別フレームに分けない（空間分離はスプリット・アテンション効果を生む）。",
    "theory": "Mayer の空間近接性原則 + スプリット・アテンション効果の回避。",
  },
  "comparison_ichiban_list": {
    "target": "〜の中でどれがいちばん〜ですか / 一番〜です",
    "panels": 1,
    "panel_type": "Establisher",
    "layout": (
      "3つ以上の同一カテゴリオブジェクトを等間隔で並置。"
      "1位（一番〜）のオブジェクトの後方にのみ「密なスピードライン（5本・シャープ平行線）」。"
      "1位の直上に「王冠ピクトまたはゴールドスター（フラット）」。"
      "他のオブジェクトはすべてフラットグレーで均一に描写し、薄い点線フレームで一括り。"
    ),
    "visual_symbols": ["王冠または1番ゴールドスター", "スピードライン（1位のみ）", "他グループの点線フレーム"],
    "avoid": "全オブジェクトにそれぞれスピードラインを付けない（1位以外はゼロにして対比を明確化）。",
    "theory": "ゲシュタルト対比の原則：1位とその他の視覚的差別化。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L16: 普通形・社会的距離
  ## ──────────────────────────────────────────────────────────
  "plain_form_introduction": {
    "target": "普通形 vs 丁寧形の使い分け（社会的距離）",
    "panels": 2,
    "panel_type": "Social Space",
    "layout": (
      "パネル1（です・ます体）：2人が一定の距離を保ちお辞儀（身体傾斜15度）。"
      "パネル2（普通形）：同じ2人が肩を組み、距離ゼロで笑い合う（親密ジェスチャー）。"
    ),
    "visual_symbols": ["お辞儀モーションライン（丁寧）", "肩組み・ゼロ距離（親密）"],
    "avoid": "文法形の差を発話バブル内のテキストで示さない（テキスト禁止）。",
    "theory": "社会的距離（ウチ・ソト）の空間化。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L22: 条件
  ## ──────────────────────────────────────────────────────────
  "tara_conditional": {
    "target": "〜たら（一回的・時間的前後関係）",
    "panels": 2,
    "panel_type": "Action-to-Action（時間経路）",
    "layout": (
      "パネル1：前提アクションの完了（例：旅行カバンを車に積む）。"
      "パネル2：目的地到着後の予期しない出来事（例：雨が降り始め、頭上に「！」）。"
      "パネル1→パネル2を繋ぐ「緩やかに蛇行するS字型の時間経路ライン」。"
    ),
    "visual_symbols": ["S字型時間経路ライン（ステップシーケンス）", "発見の「！」マーク"],
    "avoid": "パネル1→パネル2の接続に直線極太アローを使わない（機械的必然性＝「と」と混同）。",
    "theory": "McCloud のコマ間推論：Action-to-Action 遷移。",
  },
  "to_invariable": {
    "target": "〜と（恒常的・機械的結果）",
    "panels": 2,
    "panel_type": "Moment-to-Moment（即時・必然）",
    "layout": (
      "パネル1：トリガーアクションの超クローズアップ（例：自販機ボタンを押す指先）。"
      "パネル2：即座の機械的結果（例：缶ジュースが落下口に静止）。"
      "2パネルを跨ぐ「隙間のない極太直線アロー（赤色）」: 時間差なし・機械的必然性を示す。"
    ),
    "visual_symbols": ["隙間なし極太直線アロー（赤・パネルを跨ぐ）"],
    "avoid": "パネル間に隙間を空けたり細い矢印を使うと「たら」との弁別が失われる。",
    "theory": "McCloud：機械的必然性は最短Gutter（コマ間隔）で表現する。",
  },
  "nara_suggestion": {
    "target": "〜なら（逆時間関係・文脈依存）",
    "panels": 2,
    "panel_type": "逆時間シーケンス",
    "layout": (
      "右パネル（未来のアクション・意図）：飛行機に乗り込む人物。"
      "左パネル（現在・事前の必要アクション）：チケットを購入する人物。"
      "右（未来）から左（現在）へ向けて「左向きUターンアロー（ループ状）」を走らせる。"
    ),
    "visual_symbols": ["Uターンアロー（右→左・逆時間を示す）"],
    "avoid": "「なら」を他の条件文と同じ左→右の直線アローで描かない（時間逆行が表現できない）。",
    "theory": "日本語教育：「なら」の逆時間関係（未来の意図 → 事前の準備）。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L23/L24: 様態・推量・伝聞
  ## ──────────────────────────────────────────────────────────
  "adj_sou_appearance": {
    "target": "〜そう（様態：今にも〜しそうだ）",
    "panels": 1,
    "panel_type": "Peak（限界状態のクローズアップ）",
    "layout": (
      "対象オブジェクトの物理的限界状態をクローズアップ（例：コップがテーブルの端から2/3はみ出し）。"
      "落下方向に「赤色の鋭い下向きウェイトアロー」を重ねて瞬時性・差し迫り感を表現。"
    ),
    "visual_symbols": ["下向きウェイトアロー（赤・鋭角）", "限界状態クローズアップ構図"],
    "avoid": "「今にも〜しそう」をただの通常状態の絵で描かない（限界状態の極限クローズアップが必須）。",
    "theory": "Schmidt の気づき仮説：顕著性（Salience）の最大化。",
  },
  "you_desu_inference": {
    "target": "〜ようです（直接証拠に基づく推量）",
    "panels": 1,
    "panel_type": "Establisher + 推論トポロジー",
    "layout": (
      "人物（左）の「視線コーン（薄い黄色透過フラットカラー）」を、"
      "外部のエビデンス（例：泥だらけの靴が玄関に並んでいる）に衝突させる。"
      "思考バブル（実線）内に推論結果アイコンを配置。"
    ),
    "visual_symbols": ["視線コーン（黄色透過）", "実線思考バブル（直接証拠 = 確度高）"],
    "avoid": "すべてのモーダル表現で同じ考え込むポーズを描かない（ラインの形状で弁別する）。",
    "theory": "Schmidt の気づき仮説。証拠源と推論の経路を視覚化。",
  },
  "rashii_hearsay_obj": {
    "target": "〜らしいです（伝聞・間接情報）",
    "panels": 1,
    "panel_type": "Establisher + 伝随経路",
    "layout": (
      "外部の複数他者シルエット（グレー）の口元から「同心円状の点線波紋（伝随ライン）」を発散させ、"
      "人物の耳に接続する。思考バブルは「破線」で描き、内部の結論の不透明度を50%に下げる。"
    ),
    "visual_symbols": ["点線同心円波紋（伝随ライン）", "破線思考バブル（間接・不確実）"],
    "avoid": "ようだ（実線バブル）とらしい（破線バブル）のバブルスタイルを混同しない。",
    "theory": "情報の不確実性（確率スケール）のビジュアル化。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L28/L29: 受け身・使役
  ## ──────────────────────────────────────────────────────────
  "passive_direct": {
    "target": "〜は〜に（受け身）",
    "panels": 2,
    "panel_type": "Initial → Peak（顕著性反転）",
    "layout": (
      "パネル1（Initial）：被動作主（主語・青色服）を前景（大・彩色）に配置。"
      "動作主（Agent・グレー服）を背景（小・無彩色）に配置（顕著性を意図的に逆転）。"
      "パネル2（Peak）：動作主が手を伸ばして被動作主に当たる。被動作主が驚き表情（目見開き + 衝撃ピクト）で前方に揺れる。"
    ),
    "visual_symbols": ["前景：被動作主（大・彩色）", "背景：動作主（小・無彩色）", "驚き衝撃ピクト"],
    "avoid": "動作主と被動作主を等身大・同距離の横並びで1パネルに描かない（標準語順バイアスが起きる）。",
    "theory": "VIE（視覚的入力強化）：被動作主への注視を強制することで canonical-order strategy を遮断。",
  },
  "causative_intransitive": {
    "target": "〜は〜を（使役）/ 〜させられる（使役受身）",
    "panels": 2,
    "panel_type": "Initial → Peak",
    "layout": {
      "使役（させる）": (
        "パネル1：指示者（左・険しい眉・右手を斜め下に向ける命令ポーズ） + 実行者（右・下を向き困惑）。"
        "赤い直線命令アローを指示者から実行者へ。"
        "パネル2：実行者が（涙のフラットピクト付きで）指示された行為を遂行。指示者は背後に腕組みで立つ。"
      ),
      "使役受身（させられる）": (
        "パネル1：上記と同様の命令場面。"
        "パネル2：指示者は画面から消失（または薄いグレーのシルエット）。"
        "実行者が一人で夜間（三日月ピクト）に大量タスクを前に猫背で取り組む。冷や汗ピクト（青い雫）。"
      ),
    },
    "visual_symbols": ["赤い命令アロー", "猫背ポーズ（不本意のエンコード）", "冷や汗青い雫ピクト", "三日月（孤独・夜間）"],
    "avoid": "使役受身で実行者が良い姿勢・ニュートラル表情で描かれると、不本意性が表現できない。",
    "theory": "Sweller の認知負荷理論：強制の起点と不本意な持続労働を時間分割することで文法スキーマを段階的構築。",
  },

  ## ──────────────────────────────────────────────────────────
  ## L30: 敬語
  ## ──────────────────────────────────────────────────────────
  "sonkeigo_special": {
    "target": "尊敬語（いらっしゃる・召し上がる・おっしゃる等）",
    "panels": 1,
    "panel_type": "Establisher（垂直軸・社会的ランク）",
    "layout": (
      "目上の人物（右）を「一段高いプラットフォーム（台座）」の上に立たせる。"
      "話し手（左・低い位置）は身体軸を15〜30度前傾（お辞儀）させ、視線を斜め上に向ける。"
      "目上の人物の周囲に「ゴールドの4角星形ピクトを3点浮遊」させて高貴さを示す。"
    ),
    "visual_symbols": ["台座（一段高いプラットフォーム）", "前傾お辞儀（15〜30度）", "ゴールド4角星ピクト3点"],
    "avoid": "社長と平社員を同一高さの水平線上・同サイズ・同ポーズで並べない（上下関係が消える）。",
    "theory": "日本手話（JSL）の垂直軸ランキング + 社会的距離（ウチ・ソト）空間化。",
  },
  "kenjogo_o_suru": {
    "target": "謙譲語（お〜します・いたします等）",
    "panels": 1,
    "panel_type": "Establisher（自己縮小）",
    "layout": (
      "目上の人物（右・ニュートラル直立）に対して、話し手（左）が"
      "特定の行為（お茶を運ぶ等）を行いながら45度のお辞儀。"
      "話し手は脇を完全に締め、手を極めて低い位置に保ち（Signing Space の縮小）。"
      "話し手の身体ボリュームを視覚的に収縮させた姿勢。"
    ),
    "visual_symbols": ["45度深いお辞儀ライン", "Signing Space 縮小（脇締め・低い手位置）"],
    "avoid": "謙譲と尊敬のポーズに差がなく「お茶を出しているだけの絵」にしない（肘の角度が重要）。",
    "theory": "JSL の Signing Space 縮小が謙譲のプロソディマーカーとして機能する（Hoza, 2007）。",
  },
}
## END GRAMMAR_VISUAL_ENCODING_30
