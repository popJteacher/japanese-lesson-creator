# ============================================================
# master_prompt_design_guide_v2_6_complete.py
# ============================================================
# 日本語教材イラスト生成 マスタープロンプト設計書（v2.6 統合完全版）
# Master Prompt Design Guide -- v2.6 Complete (Unified)
# バージョン：v2.6-complete
# 作成日：2026-05-18
# 統合元：
#   - master_prompt_design_guide_v2_6.py             (本体)
#   - master_prompt_design_guide_v2_6_corrections.py (修正・追加)
#   - master_prompt_design_guide_v2_6_foundational.py(横断的基盤原則)
#
# ──────────────────────────────────────────────────────────
# 【このファイルの使い方】
#
#   v2.5 と組み合わせる 2ファイル構成:
#     1. master_prompt_design_guide_v2_5.py      <- 変更なし (STYLE_BIBLE 等)
#     2. master_prompt_design_guide_v2_6_complete.py  <- このファイル
#
#   矛盾時の優先順位（高 -> 低）:
#     §4 FOUNDATIONAL > §3 CORRECTIONS > §2 CORE > v2.5
#
# 【セクション構成】
#   §1  改訂履歴
#   §2  CORE: v2.6 本体 (PART 8~21)
#   §3  CORRECTIONS: 修正・追加 (v2.6.1)
#   §4  FOUNDATIONAL: 横断的基盤原則 (最優先)
# ============================================================


## ============================================================
## §1. 改訂履歴（v2.5 → v2.6）
## ============================================================
## ============================================================
## 改訂履歴（v2.5 → v2.6）
## ============================================================


## ============================================================
## §2. CORE — v2.6 本体（PART 8〜21）
## 元ファイル: master_prompt_design_guide_v2_6.py
## ============================================================

## ============================================================
## 改訂履歴（v2.5 → v2.6）
## ============================================================
##
## v2.6 (2026-05-18): Deep Research 4本の結果を統合。
##
##   背景：
##     v2.5 時点で、以下のカテゴリのテンプレートが未設計だった。
##       ① テンプレートC（例文画像）の文法パターン別サブ戦略が丸投げ状態。
##          {SCENE_DESCRIPTION} に自由記述を求めるだけで、L1〜L22 の文型に
##          対応する視覚戦略が定義されていなかった。
##       ② 代名詞・感動詞・定型表現・副詞・助数詞（テンプレートK〜O未設計）
##       ③ 時間・交通・家族・天気・感覚（テンプレートP〜T未設計）
##
##   解決策：
##     Deep Research 4本（①L1-L10文法、②機能語、③新語彙カテゴリ、④L11-L22複合文型）
##     の結果を統合し、全テンプレートを v2.6 で完成させる。
##
##   主な変更：
##
##   [PART 8] GRAMMAR_PATTERNS_C（NEW：最高優先）
##     テンプレートC（example_sentence）に文法パターン別サブ戦略を追加。
##     grammarConcept フィールドの値でサブテンプレートを選択する。
##     対応文型：L1〜L22 全30課を網羅。
##     認知文法（Trajector/Landmark）・フォース・ダイナミクス理論を全文型に適用。
##     「視覚化困難な文型（限界文型）」の判定基準と2コマ救済設計を追加。
##
##   [PART 9〜13] テンプレートK〜O（NEW：機能語・新品詞系）
##     K: pronoun（代名詞）   L: interjection（感動詞）
##     M: set_expression（定型表現）   N: adverb（副詞）
##     O: counter（助数詞）
##
##   [PART 14〜18] テンプレートP〜T（NEW：新語彙カテゴリ）
##     P: time（時間語彙）   Q: transportation（交通手段）
##     R: family（家族語彙）   S: weather（天気・自然）
##     T: sensory（感覚語彙）
##
##   [PART 19] UNIFIED_CHAR_SYSTEM（NEW：Research④確定）
##     「私（Ego）= テイルブルー / 左固定」「他者（Soto）= オレンジ / 右固定」
##     の統一配置システム。授受表現・モダリティ・比較の全テンプレートで共有。
##
##   [PART 20] QA_CHECKLIST_v2_6（更新）
##     新テンプレートK〜T に対応したチェック項目を追加。
##     「限界文型」（直接視覚化困難な文型）の自動判定フローを追加。
##
##   [PART 21] HOW_TO_USE_v2_6（更新）
##     vocab_type → テンプレート対応表を A〜T 完全版に更新。
##     GAS buildImagePrompt() の switch-case 拡張仕様を記載。
##
## ============================================================


## ============================================================
## PART 19: UNIFIED CHARACTER & COLOR SYSTEM（Research④確定）
## ============================================================
##
## Research④の結論：授受表現・比較・モダリティで「誰が主語か」の
## 誤読を防ぐため、全テンプレートでキャラクター配置と色を固定する。
##
## ⚠️ 既存の STYLE_BIBLE.color_palette（クリーム背景・スレートネイビー輪郭等）は
##    語彙カード用の基本パレットとして維持。
##    この UNIFIED_CHAR_SYSTEM は、2人以上のキャラクターが登場する
##    「例文・授受・比較・モダリティ・代名詞・定型表現」画像に適用する。
## ============================================================

UNIFIED_CHAR_SYSTEM = {

  ## キャラクター固定配置ルール
  "character_placement": {
    "ego_watashi": {
      "position":    "LEFT half of the frame (画面左側)",
      "shirt_color": "Teal Blue, similar to #008080, hex value 008080",
      "role_label":  "自己 / 私（Ego / Speaker）",
      "outline_width": "BOLD 3.5px outline when Ego is the grammatical subject (Trajector)",
      "when_to_apply": "授受表現・比較・依頼・否定・欲求など、私が主格の文型すべて"
    },
    "soto_other": {
      "position":    "RIGHT half of the frame (画面右側)",
      "shirt_color": "Warm Orange, similar to #FF8C00, hex value FF8C00",
      "role_label":  "他者 / あなた・かれ・かのじょ（Soto / Other）",
      "outline_width": "Regular 1.5px outline when Soto is the secondary participant (Landmark)",
      "when_to_apply": "上記と同じシーン。右側に固定。"
    }
  },

  ## 文法記号専用カラーシステム（語彙カードパレットとは別）
  "grammar_signal_colors": {
    "permission_safe":   "ISO Green, similar to #009B48, hex value 009B48",
    "prohibition_danger":"ISO Red, similar to #D81E05, hex value D81E05",
    "obligation_command":"ISO Blue, similar to #002FA7, hex value 002FA7",
    "unnecessary_bypass":"Slate Gray, similar to #708090, hex value 708090",
    "comparison_winner": "Amber Gold, similar to #FFD700, hex value FFD700",
    "condition_if_frame":"Dotted border, Slate Gray (#708090)",
    "condition_then_arrow": "Neon Orange block arrow, similar to #FF8C00, hex value FF8C00",
    "benefactive_ego":   "Teal Blue arrow for ego-outward action (あげます)",
    "benefactive_soto":  "Orange arrow for soto-inward action (くれます)",
    "benefactive_blend": "Tip: Teal Blue, tail: Orange (もらいます)",
    "memory_stamp":      "Gold Yellow, similar to #FFD700, hex value FFD700",
    "anchor_pin":        "Red pin + Teal Blue anchor (住んでいます)"
  },

  ## ウチ・ソト境界の描画仕様
  "uchi_soto_boundary": {
    "uchi_inside": {
      "shape":      "Warm solid-line circle (実線円)",
      "fill":       "Semi-transparent warm pink #FFE0E0 (不透明度30%)",
      "meaning":    "内輪（自己・家族・親しい関係）",
      "example_words": ["父", "母", "兄", "姉", "弟", "妹"]
    },
    "soto_outside": {
      "shape":      "Cool dashed-line circle (点線円)",
      "fill":       "Semi-transparent cool gray #E0E8F0 (不透明度30%)",
      "meaning":    "外向き（相手の家族・敬意の対象）",
      "example_words": ["お父さん", "お母さん", "お兄さん", "お姉さん"]
    }
  },

  "note": (
    "このシステムの意義: 授受表現（あげます/もらいます/くれます）で"
    "矢印の方向だけでなく「誰が主語か」をキャラクターの色・輪郭太さ・位置で"
    "三重に固定することで、誤読率を最小化する（Research④）。"
    "将来的にGASのbuildImagePrompt()関数で、"
    "grammarConcept判定時にこのシステムを自動注入する。"
  )
}


## ============================================================
## PART 8: GRAMMAR_PATTERNS_C（テンプレートC' 文法パターン別サブ戦略）
## ============================================================
##
## 【概要】
##   テンプレートC（example_sentence）は、1つの例文を1枚の画像で表現する。
##   v2.5 では {SCENE_DESCRIPTION} が丸投げだった。
##   v2.6 では grammarConcept の値に基づいて以下のサブ戦略から選択する。
##
## 【使い方】
##   Step 1: lesson_NN.json の grammar[].grammarConcept フィールドを確認する。
##   Step 2: GRAMMAR_PATTERNS_C のキーと照合して戦略を選択する。
##   Step 3: 選択した戦略の visual_strategy.prompt_core を
##           テンプレートC の {SCENE_DESCRIPTION} に埋め込む。
##   Step 4: UNIFIED_CHAR_SYSTEM が必要な文型は必ず適用する。
##
## 【視覚化困難な文型（限界文型）】
##   直接描写が認知科学的に困難な文型は HARD_LIMIT フラグを持つ。
##   これらには 2コマ/3コマ救済設計（RESCUE_LAYOUT）を使用する。
##
## ============================================================

GRAMMAR_PATTERNS_C = {

  ## ─────────────────────────────────────────────────────────
  ## GROUP 1: L1〜L5 基本文型（等号・存在・疑問・所属）
  ## ─────────────────────────────────────────────────────────

  "noun_predicate_affirmative": {
    ## NはNです（等号・定義） L1
    "label":           "NはNです（等号・定義）",
    "schema":          "カテゴリ集合への静的帰属（認知文法：分類プロセス）",
    "trajector":       "主体（例：たなかさん）",
    "landmark":        "社会的カテゴリ（例：先生）",
    "visual_strategy": {
      "layout":        "LEFT: person silhouette → RIGHT: category boundary frame with attribute icons",
      "key_elements": [
        "概念カテゴリ境界枠（Boundary Frame）: 薄いグリーンの半透明角丸シールド。職業・役割の集合を表す。",
        "属性ピクトグラム（Attribute Icons）: 境界枠内部に、職業を100%定義するアイコン群（黒板・本・聴診器等）。",
        "同一性破線（Identity Dotted Line）: 人物の頭部から属性ピクトグラムへ伸びる細い接続破線。",
        "人物はカテゴリ枠の境界に半分重なるか、破線で接続することで包含関係を明示。"
      ],
      "prompt_core": (
        "Flat vector illustration. {PERSON_DESCRIPTION} on the left. "
        "On the right, a soft green semi-transparent rounded Boundary Frame labeled with "
        "attribute icons representing {CATEGORY} (no text, only icons like {ATTRIBUTE_ICONS}). "
        "A dashed dotted line connects the person to the Boundary Frame, showing category membership. "
        "The person slightly overlaps with the frame boundary to show inclusion. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "衣服のみに依存する描写（白衣＝医師 だけでは不十分）",
        "文字依存の名札・看板",
        "単なる人物の立ち姿（等号関係が消えるため）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "existence_location": {
    ## Nがあります・います（存在） L3/L4
    "label":           "Nがあります・います（存在と場所）",
    "schema":          "空間参照点への配置固定（認知文法：分析プロセス）",
    "trajector":       "存在する事物（例：本、犬）",
    "landmark":        "配置空間（例：机の上）",
    "visual_strategy": {
      "layout":        "CENTER-DOMINANT: landmark object in muted gray, trajector in vivid color with spotlight",
      "key_elements": [
        "ランドマーク（机・引き出し等）: 彩度を落とした無彩色（ライトグレー極細線）で描画。背景化する。",
        "トラジェクター（本・犬等）: 極太輪郭線 + ビビッドな原色。画面の認知的焦点に。",
        "存在の波紋（Existence Ripples）: トラジェクター底面から広がる2〜3重の薄い同心円弧。静的固定状態を示す。",
        "スポットライトレイヤー（Spotlight Layer）: トラジェクター周辺のみ高輝度。余分な情報を後退させる。",
        "接地シャドウ（Contact Shadow）: トラジェクター直下の極小の濃い影。物理的接触の証明。"
      ],
      "prompt_core": (
        "Flat vector illustration. {LANDMARK_OBJECT} drawn in muted light gray, serving as the background space. "
        "{TRAJECTOR_OBJECT} placed {LOCATION_PREPOSITION} the {LANDMARK_OBJECT}, "
        "drawn with bold vivid outlines and bright color filling 70% of the frame. "
        "2-3 thin concentric arcs radiate from the base of {TRAJECTOR_OBJECT} to signal static presence. "
        "A subtle spotlight highlight area surrounds {TRAJECTOR_OBJECT}. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "過剰に装飾された部屋の背景（窓・壁紙・ペン立てなど）",
        "トラジェクターとランドマークを同じ彩度で描く（焦点が消える）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "noun_predicate_question": {
    ## 〜ですか（疑問文） L1
    "label":           "〜ですか（疑問文・Yes/No応答）",
    "schema":          "情報の未確定状態（疑問の提示）",
    "visual_strategy": {
      "key_elements": [
        "疑問バブル（Question Cloud）: 話者の頭上または口元から伸びる、雲型の疑問バブル。",
        "バブル内部: 大きな「？」記号 + 問われている事物の薄いシルエット（輪郭のみ）。",
        "話者のポーズ: 首をわずかに傾けた、疑問を示すジェスチャー。",
        "相手のキャラクター: 画面右側に Soto キャラクター（オレンジシャツ）を配置。応答準備ポーズ。"
      ],
      "prompt_core": (
        "Flat vector illustration using the Ego-Soto character system. "
        "LEFT: Ego character (teal blue shirt) with head slightly tilted, "
        "a question cloud bubble rising from their mouth containing a large '?' symbol "
        "and a faint silhouette of {TOPIC_OBJECT}. "
        "RIGHT: Soto character (orange shirt) in a listening/responding posture. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["話者だけの単独絵（疑問の向かう先が消える）"]
    },
    "uses_unified_char": True,
    "hard_limit": False
  },

  "noun_no_affiliation": {
    ## 〜の〜です（所属・所有） L1
    "label":           "〜の〜です（所属・所有）",
    "schema":          "包含・帰属関係",
    "visual_strategy": {
      "key_elements": [
        "所属先（組織・場所）: 背景の右奥に大きく描画。建物アイコンや旗など。",
        "所属者（人物）: 前景に立つ人物。所属先に向けて指か視線を向ける。",
        "接続線（Belonging Line）: 人物と所属先をつなぐ太い弧線。所属関係を明示。",
        "所属先ロゴ的アイコン: テキスト不可。組織を象徴するシンプルなアイコン（校舎・会社ビル等）。"
      ],
      "prompt_core": (
        "Flat vector illustration. A person in the foreground facing slightly toward the right. "
        "In the background right, a simplified icon representing {ORGANIZATION} (building or symbol). "
        "A bold curved connection line links the person to the organization icon, "
        "showing belonging/affiliation. White background, clean flat design, no text."
      ),
      "avoid": ["テキストでの組織名表記"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  ## ─────────────────────────────────────────────────────────
  ## GROUP 2: L5〜L10 拡張文型（比較・欲求・能力・進行・依頼・否定・授受）
  ## ─────────────────────────────────────────────────────────

  "comparison_yori": {
    ## 〜よりNのほうが〜（比較） L9
    "label":           "AはBより〜（2者比較）",
    "schema":          "極性スケール上の不均等配列（認知文法：象徴的プロセス）",
    "trajector":       "優位な評価対象（例：東京）",
    "landmark":        "劣位な対象（例：大阪）",
    "visual_strategy": {
      "layout":        "2-item side-by-side with central comparative bar",
      "key_elements": [
        "垂直評価バー（Comparative Bar）: 中央に配置。目盛り付きの垂直スケール。",
        "優位側: 高彩度カラー + ゴールドオーラ + 上矢印シェブロン。",
        "劣位側: スレートグレー（不透明度60%）でモノトーン化。",
        "不等号くさび（Relational Wedge）: 優位→劣位へ先細りするウェッジ補助線。"
      ],
      "prompt_core": (
        "Flat vector illustration. LEFT: simplified icon of {ITEM_A} in high-saturation color "
        "with a gold aura circle and upward chevron above it. "
        "CENTER: vertical comparative scale bar with graduated marks. "
        "RIGHT: simplified icon of {ITEM_B} in muted slate gray (60% opacity). "
        "A relational wedge line connects A to B, tapering from wide to narrow to show inequality. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "スケール（ものさし）なしの単なるサイズ違いの並列（形容詞テンプレートJと混同される）",
        "3つ以上の要素（最上級テンプレートに移行すること）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "superlative_ichiban": {
    ## 〜がいちばん〜（最上級） L9
    "label":           "〜がいちばん〜（3者以上の最上級）",
    "schema":          "極性スケールの頂点選出",
    "visual_strategy": {
      "key_elements": [
        "3〜4項目を横並び or ピラミッド型に配置。",
        "1位要素: ゴールドの王冠アイコン or 5点星バッジを直上に浮遊配置。",
        "1位のカラー: ゴールドイエロー（#FFD700）。",
        "2位以下: スレートグレー（不透明度60%）でモノトーン化。",
        "表彰台（Podium）構造: 左から2位・1位・3位 の階段状配置も可。"
      ],
      "prompt_core": (
        "Flat vector illustration. Three items arranged as a podium: "
        "{WINNER_ITEM} in the center on the tallest block with a floating gold crown icon above it, "
        "{SECOND_ITEM} on the left on a medium block (muted gray), "
        "{THIRD_ITEM} on the right on the shortest block (muted gray). "
        "The winner is colored in gold-yellow (#FFD700), others in slate gray. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["1位が不明瞭な均等配置"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "desire_tai": {
    ## 〜たい（欲求・希望） L7
    "label":           "〜たい（欲求・希望）",
    "schema":          "心理的指向性エネルギーの牽引（フォース・ダイナミクス）",
    "trajector":       "欲求の主体（人間）",
    "landmark":        "欲求対象（アイス・食べ物等）",
    "visual_strategy": {
      "key_elements": [
        "思考バブル（Thought Cloud）: 丸い泡が連続して上昇し、大きな雲型を形成する古典的精神プロセスフレーム。",
        "バブル内部: 欲求対象を不透明度75%のゴーストとして描画（まだ手に入っていないことを示す）。",
        "磁力ドットベクトル: 人物の目元からバブル内の対象に向けた放射状の極細ドットライン。",
        "人物と対象の間: 明確な余白スペース（まだ手に入っていないことの物理的表現）。",
        "人物の手: 欲求対象に向けてわずかに伸ばされる。届いていない状態を維持すること。"
      ],
      "prompt_core": (
        "Flat vector illustration. LEFT: person (slight 3/4 view) looking toward upper right "
        "with hand barely extended but not reaching. "
        "A thought cloud bubble rises from their head. Inside the cloud: {DESIRED_OBJECT} "
        "drawn at 75% opacity to show it is imagined/not yet obtained. "
        "Fine radial dot lines flow from the person's eyes into the bubble. "
        "Clear empty space between person and object. White background, no text."
      ),
      "avoid": [
        "対象をすでに手に持っているか食べている描写（ています・ました になる）",
        "バブルなしの視線だけの表現（能力・指示と混同される）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "potential_dekimasu": {
    ## 〜ができます（能力・可能） L7
    "label":           "〜ができます（能力・可能）",
    "schema":          "潜在的出力の解放（アゴニスト内エネルギーの解放）",
    "visual_strategy": {
      "key_elements": [
        "スピーチバブル or アクション: 能力を発揮している動作（話す・泳ぐ等）。",
        "認定シールド（Verification Shield）: 緑色の盾 + 白チェックマークのバッジ。人物の背後か頭上に配置。",
        "解錠南京錠（Unlocked Padlock）: ゴールドの解錠状態の錠前アイコン。潜在的制限の解除を示す。",
        "成功のスターバースト: スピーチバブルや手の周辺に散らばるイエローのきらめきマーク（4角星）。",
        "バブル内部: 幾何学的に美しい音声波形（サインウェーブ）or 完成したパズルピース。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in the center performing {ABILITY_ACTION} "
        "(e.g. speaking Japanese — show a speech bubble with clean sound waves inside). "
        "Behind the person: a green shield badge with a white checkmark (Verification Shield). "
        "Near the action: a small unlocked gold padlock icon. "
        "Yellow starburst sparkles scattered around the action area. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "通常の動作と区別がつかない単一のポーズ（能力 vs 習慣が区別できない）",
        "シールド・解錠アイコンなしの描写"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "progressive_teimasu": {
    ## 〜ています（進行・継続） L8
    "label":           "〜ています（進行中・継続）",
    "schema":          "時間軸における連続的プロセスの捕捉（認知文法：内面視）",
    "visual_strategy": {
      "key_elements": [
        "シークエンス残像効果（Temporal Motion Trails）: 動作する手・足の周辺に不透明度10-30%の段階的ゴースト。",
        "時間進捗インジケーター（Progress Ring）: 画面隅に80%進捗の円形ローディングバー（「実行中」のメタファー）。",
        "アクションライン（Action Vibrancy Lines）: オブジェクト周辺の短い並行振動線。今まさに動いていることを示す。",
        "動作の中間点: 「完成前」の状態を捉える（本をめくり途中、歩みの中間点等）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person performing {ACTION} captured at the MID-POINT of the action, "
        "not the completed state. "
        "2-3 ghost silhouettes of the moving part (hand/foot) shown at decreasing opacity (30%, 15%, 5%) "
        "to show temporal motion trail. "
        "A small circular progress ring in the corner at 80% fill. "
        "Short parallel vibration lines around the moving object. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "完全に静止した完成ポーズ（存在・完了形と混同される）",
        "本を閉じて持っている絵（読みました になる）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "progressive_state_teimasu": {
    ## 〜ています（結果の状態） L12
    "label":           "〜ています（結果状態の継続）",
    "schema":          "動作完了後の影響状態の継続（認知文法：外面視）",
    "visual_strategy": {
      "key_elements": [
        "動作主（人物）は消失または背景に後退。",
        "対象物（Affected Object）が画面中央。",
        "変化の完了サイン: 割れたヒビ線・開ききったドア・散らばった状態。",
        "ビフォーアイコン: 画面隅に極小の「変化前」の状態を退避配置。",
        "→ 左下隅に小さく before → after の方向性を示す矢印セット。"
      ],
      "prompt_core": (
        "Flat vector illustration showing the RESULT STATE of {ACTION}. "
        "The main focus is {AFFECTED_OBJECT} in its changed state "
        "(e.g., door fully open, window broken, bag fully packed). "
        "No active person in the center — the result state IS the subject. "
        "In the bottom corner: a tiny 'before' icon with a right arrow showing the state change. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "動作進行中の描写（〜ています進行形テンプレートと混同）",
        "動作主が前景にいる構図（結果の状態ではなく「〜します」になる）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "request_tekudasai": {
    ## 〜てください（依頼・指示） L7
    "label":           "〜てください（依頼・指示）",
    "schema":          "社会的力学による行動の方向付け（フォース・ダイナミクス）",
    "visual_strategy": {
      "key_elements": [
        "案内点線ベクトル（Guidance Dotted Vector）: 話者の手元から行動目標へ向かう角丸湾曲した太い点線矢印。",
        "行動結果ゴースト（Action Ghost）: 要求されている行動のゴール地点に不透明度20%のホワイトシルエット。",
        "位置ターゲットリング: 目標地点の足元に同心円ターゲット（「ここに」の限定を示す）。",
        "話者のジェスチャー: 手のひらを上に向けた丁寧なエスコートポーズ（威圧的な指差しは禁止）。"
      ],
      "prompt_core": (
        "Flat vector illustration using UNIFIED_CHAR_SYSTEM. "
        "LEFT: Ego (teal blue shirt) with palm-up welcoming gesture toward the right. "
        "A curved dotted-line arrow flows from Ego's hand toward {TARGET_LOCATION/ACTION}. "
        "At the target: a faint 20%-opacity ghost silhouette of {EXPECTED_ACTION_RESULT}. "
        "Concentric target rings on the ground at the target point. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "人差し指で鋭く指し示すポーズ（命令形・位置確認と誤認される）",
        "ゴーストシルエットなし（行動結果が見えないと依頼の意味が消える）"
      ]
    },
    "uses_unified_char": True,
    "hard_limit": False
  },

  "negation_masen": {
    ## 〜ません・〜ない（否定） L2
    "label":           "〜ません・〜ない（否定）",
    "schema":          "アクション・関係性の物理的遮断（フォース・ダイナミクス：バリア）",
    "visual_strategy": {
      "key_elements": [
        "遮断バリア・シールド（Rejection Shield）: 赤い半透明プレートを人物と対象の間に差し挟む。",
        "ターゲット化されたダブルスラッシュ: 対象物のみの真上に赤い2本の取り消し線。対象物を局所的に無効化。",
        "拒絶ジェスチャー: 腕組みクロス or 手のひらを外に向けて押し出す拒絶ポーズ。",
        "⚠️ 画面全体を覆う巨大な✗は禁止（「このイラスト自体が誤回答」に誤認される）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in center with rejection gesture "
        "(arms crossed or palm-out push). "
        "Between the person and {REJECTED_OBJECT}: a semi-transparent red barrier shield "
        "at 45 degrees, clearly separating the two. "
        "On top of {REJECTED_OBJECT} only: two thin red diagonal slash lines "
        "(targeted cancellation, NOT covering the whole image). "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "画像全体を覆う✗マーク",
        "否定記号なしの単なる人物のポーズのみ"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "benefactive_teageru": {
    ## 〜てあげます（授受：私→他者） L10
    "label":           "〜てあげます（私が他者に施す）",
    "schema":          "ウチ→ソトへの恩恵移動。私が主格（Trajector）",
    "visual_strategy": {
      "layout":        "MUST use UNIFIED_CHAR_SYSTEM (Ego left/teal, Soto right/orange)",
      "key_elements": [
        "EgoのアウトラインをBOLD 3.5pxに拡大（主格強調）。",
        "物理移動ベクトル: 黒実線矢印 左→右。",
        "恩恵ハートベクトル（Benefactive Heart Vector）: テイルブルー色の太い矢印の軸にハートアイコンが融合。左→右。",
        "Egoのシャツ色（テイルブルー）と矢印色を一致させる（Egoの能動性を示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration with UNIFIED CHARACTER SYSTEM. "
        "LEFT: Ego character (teal blue shirt, BOLD 3.5px outline) facing right, "
        "performing {ACTION} with an outward gesture. "
        "RIGHT: Soto character (orange shirt, normal outline) receiving the action. "
        "A teal blue bold heart-embedded arrow flows LEFT→RIGHT representing the benefactive. "
        "A thin black line arrow also flows LEFT→RIGHT showing the physical transfer. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["矢印の方向を右→左にしないこと（もらいます になる）"]
    },
    "uses_unified_char": True,
    "hard_limit": False
  },

  "benefactive_temorau": {
    ## 〜てもらいます（授受：他者→私、私の依頼で） L10
    "label":           "〜てもらいます（他者から受領、私の依頼）",
    "schema":          "Soton action initiated by Ego's request → Ego受益",
    "visual_strategy": {
      "layout":        "MUST use UNIFIED_CHAR_SYSTEM",
      "key_elements": [
        "EgoのアウトラインをBOLD 3.5pxに拡大（受益者が主格）。",
        "依頼シグナルループ: Egoから Soに向かう細いピンクの点線ループ（お願いを示す）。",
        "物理移動ベクトル: 黒実線矢印 右→左。",
        "恩恵ベクトル: 先端がテイルブルー、根元がオレンジのグラデーションブロック矢印 右→左。",
        "EgoがSoに向けてお辞儀ジェスチャーをとる（依頼の明示）。"
      ],
      "prompt_core": (
        "Flat vector illustration with UNIFIED CHARACTER SYSTEM. "
        "LEFT: Ego character (teal blue shirt, BOLD outline) in a slight bow/request gesture. "
        "RIGHT: Soto character (orange shirt) performing {ACTION}. "
        "A thin pink dotted loop goes from Ego to Soto (request signal). "
        "A bold gradient arrow (orange tail → teal tip) flows RIGHT→LEFT (benefactive received by Ego). "
        "A thin black line arrow also flows RIGHT→LEFT (physical transfer). "
        "White background, clean flat design, no text."
      ),
      "avoid": ["依頼ループなし（くれます と区別できなくなる）"]
    },
    "uses_unified_char": True,
    "hard_limit": False
  },

  "benefactive_tekureru": {
    ## 〜てくれます（授受：他者→私、他者の自発的行為） L10
    "label":           "〜てくれます（他者が自発的に私に施す）",
    "schema":          "Soton's spontaneous action → Ego受益",
    "visual_strategy": {
      "layout":        "MUST use UNIFIED_CHAR_SYSTEM",
      "key_elements": [
        "Sotonのアウトラインを通常のまま（Sotonが行為者）。",
        "Egoをウチ境界円（破線の薄いピンク半円）で包む（私の領域を明示）。",
        "恩恵ベクトル: フルオレンジ色の太い矢印（Soton発）。Egoの境界円を突破して進入する構図。",
        "ハートアイコンを矢印軸に埋め込む。",
        "EgoはSotonの行動に対して驚き＋喜びの表情（星マークの飛散）。"
      ],
      "prompt_core": (
        "Flat vector illustration with UNIFIED CHARACTER SYSTEM. "
        "LEFT: Ego character (teal blue shirt) with a surprised-happy expression "
        "inside a dashed pink semicircle boundary (Uchi zone). "
        "RIGHT: Soto character (orange shirt) spontaneously performing {ACTION}. "
        "A full orange bold heart-embedded arrow flows RIGHT→LEFT, "
        "piercing through the Ego's boundary circle (entering Uchi zone). "
        "Small yellow star sparks near Ego to show unexpected joy. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "依頼ループを描く（もらいます になる）",
        "矢印をテイルブルーにする（あげます になる）"
      ]
    },
    "uses_unified_char": True,
    "hard_limit": False
  },

  ## ─────────────────────────────────────────────────────────
  ## GROUP 3: L11〜L16 複合文型（連続動作・同時進行・モダリティ・引用）
  ## ─────────────────────────────────────────────────────────

  "sequential_te_form": {
    ## 〜て、〜（連続動作） L11
    "label":           "〜て、〜（連続動作・時系列）",
    "schema":          "時間軸における動作の連鎖",
    "visual_strategy": {
      "layout":        "2-panel sequential (左→右: Action A → Action B)",
      "key_elements": [
        "左コマ: 動作A（例：手を洗う）",
        "右コマ: 動作B（例：食事をする）",
        "コマ間の接続矢印: ネオンオレンジのブロック矢印（直進型）。",
        "コマ枠: 両コマを同じスタイルの角丸フレームで囲む（シーケンスの一体性を示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration in 2-panel sequential layout. "
        "LEFT PANEL (rounded frame): Person performing {ACTION_A}. "
        "CENTER: Bold orange block arrow pointing right. "
        "RIGHT PANEL (rounded frame): Same person performing {ACTION_B}. "
        "Both panels have the same style and character appearance. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["1枚に2動作を混在（前後関係が消える）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "simultaneous_nagara": {
    ## 〜ながら（同時進行） L12
    "label":           "〜ながら（2動作の同時進行）",
    "schema":          "2つの動作プロセスの同時発生",
    "visual_strategy": {
      "key_elements": [
        "スプリット・ボディ構図: 1人のキャラクターの身体の上半身と下半身（または左右）から、それぞれ別の動作を対称的に引き出す。",
        "または無限ループバンド: 2つの独立した動作アイコンを∞の破線バンドで一つに結びつける。",
        "例：「音楽を聴きながら歩く」→ ヘッドホン（頭部）からの音符 + 足元のスピードライン を大きなループで包む。"
      ],
      "prompt_core": (
        "Flat vector illustration. A single person performing TWO ACTIONS SIMULTANEOUSLY. "
        "Upper body: {ACTION_1} with its visual signal (e.g., music notes from headphones). "
        "Lower body/feet: {ACTION_2} with its visual signal (e.g., walking speed lines). "
        "A large infinity-shaped (∞) dashed band encircles BOTH action signals together, "
        "showing they happen at the same time. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["2枚の別々のイラスト（同時進行ではなく順次になる）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "modality_permission": {
    ## 〜てもいいです（許可） L18
    "label":           "〜てもいいです（許可）",
    "schema":          "制限の解除（アゴニストの行動が承認される）",
    "visual_strategy": {
      "key_elements": [
        "ISO許可記号: 緑の正方形フレーム + 白い大チェックマーク（✓）。",
        "対象となるアクション（例：カメラで撮影する手）を中央に配置。",
        "緑フレームがアクションを包み込む構図。"
      ],
      "prompt_core": (
        "Flat vector illustration. "
        "CENTER: {PERMITTED_ACTION} (e.g., hand holding a camera in photography gesture). "
        "Surrounding the action: a green square frame with a large white checkmark (✓) inside. "
        "ISO-compliant green permission signal. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["4象限を1枚に詰め込みすぎ（語彙カードは1文型1枚が原則）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "modality_prohibition": {
    ## 〜てはいけません（禁止） L18
    "label":           "〜てはいけません（禁止）",
    "schema":          "アクションの完全遮断（アゴニストへの外力によるブロック）",
    "visual_strategy": {
      "key_elements": [
        "ISO禁止記号: 赤い円 + 45度斜線スラッシュ。",
        "対象となるアクションを禁止記号で包む。",
        "⚠️ 否定バリア（〜ません）との違い: 禁止は外部ルールによる遮断。記号はISO準拠の禁止円を使う。"
      ],
      "prompt_core": (
        "Flat vector illustration. "
        "CENTER: {PROHIBITED_ACTION} (e.g., hand holding a camera). "
        "Overlaid on the action: a red circle with a diagonal slash — ISO prohibition sign (No Entry variant). "
        "Bold red ISO prohibition circle at 100% opacity. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["否定バリア（〜ません）の遮断シールドを流用しないこと（ルール由来 vs 個人の意志の区別）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "modality_obligation": {
    ## 〜なければなりません（義務） L18
    "label":           "〜なければなりません（義務・強制）",
    "schema":          "外力による行動への強制推進（フォース・ダイナミクス）",
    "visual_strategy": {
      "key_elements": [
        "ISOソリッドブルーサークル + 白色のアクションピクト（義務ピクトグラム）。",
        "キャラクターの足元から行動目標に向かう太い黄色の折り曲げ強制矢印。",
        "期限シグナル: スマートフォンのプッシュ通知を模した時計マーク + ！マーク。"
      ],
      "prompt_core": (
        "Flat vector illustration. "
        "Person being 'pushed' toward {OBLIGATORY_ACTION} by a bold yellow angled force arrow. "
        "Above the action target: ISO mandatory circle (solid blue background, white pictogram inside). "
        "Near the person: a clock+exclamation notification badge showing urgency/deadline. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["許可の緑フレームと混同しないこと"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "modality_unnecessary": {
    ## 〜なくてもいいです（不必要） L18
    "label":           "〜なくてもいいです（不必要・任意）",
    "schema":          "強制力の不在（アンタゴニストがアゴニストを押し止めない）",
    "visual_strategy": {
      "key_elements": [
        "タスク対象をダッシュ枠（破線円）で囲む（義務のソリッド円とは対比）。",
        "バイパス曲線矢印: キャラクターがタスク対象を迂回して通り過ぎるドットライン。",
        "タスク対象の上: 「ー」（ダッシュ記号）または「0%」を重ねて「任意」を示す。"
      ],
      "prompt_core": (
        "Flat vector illustration. "
        "CENTER: {OPTIONAL_TASK_OBJECT} inside a dashed circle (not solid — showing it is optional). "
        "Person walking past it via a curved bypass dotted arrow, not stopping at the task. "
        "On the task object: a neutral dash '—' symbol or '0%' badge showing it is not required. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["禁止記号（赤い✗）を使う（禁止 vs 不必要の混同）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "quotation_to_omoimasu": {
    ## 〜と思います（思考・主観的確信） L16
    "label":           "〜と思います（主観的思考・高確信度）",
    "schema":          "精神プロセス：内部の高確信推論",
    "visual_strategy": {
      "key_elements": [
        "思考バブル（Thought Cloud）: スカラップ形状の外輪線 + 本人の頭部に向かう3個のトレイル。",
        "バブル内部: 電球アイコン + 思考対象の内容を絵で表す。",
        "確信度メーター: 画面隅に80〜90%位置を指すバー表示（確信度が高いことを示す）。",
        "話者の表情: 確信した穏やかな表情。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with a confident expression. "
        "A cloud-shaped thought bubble (scalloped outline with 3 trail circles connecting to head) "
        "rises from their head. Inside: a lightbulb icon + visual content of {THOUGHT_CONTENT}. "
        "In the corner: a small certainty meter bar pointing to 80-90%. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["発話バブル（楕円・ポインティングテール）と混同しないこと"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "quotation_to_iimashita": {
    ## 〜と言いました（引用・発話） L16
    "label":           "〜と言いました（発話引用）",
    "schema":          "発話行為の再現",
    "visual_strategy": {
      "key_elements": [
        "発話バブル（Speech Bubble）: 楕円形または角丸長方形 + 口元を指すポインティングテール（尾部）。",
        "バブル内部: 発話内容を絵で表す（テキスト不可）。",
        "スピーカーアイコンまたはダブルクォーテーション記号をバブルの外縁に重ねる。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with mouth open in a speaking expression. "
        "A speech bubble (smooth ellipse with a sharp pointing tail from the mouth) "
        "contains a visual representation of {SPEECH_CONTENT}. "
        "A small speaker/audio icon is placed near the bubble edge. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["思考バブル（雲形）を使う（思考 vs 発話の混同）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "hearsay_sou_desu": {
    ## 〜そうです（伝聞） L16
    "label":           "〜そうです（伝聞・第三者情報）",
    "schema":          "確信度不確定の情報伝達",
    "visual_strategy": {
      "key_elements": [
        "二重構造バブル: 発話バブルを2重にし、背後にもう1つの発話バブル（不透明度50%）を重ねる。",
        "背景に情報ソース: ニュース・TV・スマホなどの極小ピクトを背景左端に配置。",
        "情報ソースから破線矢印が伸び、人物のバブルに接続（伝わる経路を示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with a neutral, slightly uncertain expression. "
        "TWO speech bubbles: a main bubble in front and a slightly larger one behind it at 50% opacity, "
        "both containing visual content of {HEARSAY_CONTENT}. "
        "In the background left: a tiny TV/news icon as the hearsay source. "
        "A dashed arrow connects the source to the bubble, showing information relay. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["単一のスピーチバブル（直接発話と区別できない）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "uncertainty_kamoshiremasen": {
    ## 〜かもしれません（可能性・不確実） L16
    "label":           "〜かもしれません（低確信・不確実な可能性）",
    "schema":          "認識的モダリティ：確信度20-40%",
    "visual_strategy": {
      "key_elements": [
        "発話バブル: 角丸長方形、目の粗い点線（破線）で境界を描く（不確実性の外形）。",
        "バブル内部: 巨大な黄色またはグレーの「？」マーク + 薄いコンテンツ。",
        "確信度メーター: 20〜40%位置を指すグレーのドットスケール。",
        "バブル自体が宙に浮き、本人からの接続が破線で描かれる（「つながりが弱い」）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with an uncertain expression. "
        "A speech bubble with DASHED border (not solid) containing a large yellow '?' and "
        "a faint, low-opacity visual of {UNCERTAIN_CONTENT}. "
        "The bubble hovers slightly disconnected from the person with a dashed connection line. "
        "In the corner: a certainty meter at 20-40% in gray. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["実線バブル（と思います・でしょうと区別できない）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  ## ─────────────────────────────────────────────────────────
  ## GROUP 4: L15〜L22 複合・条件・経験・助言
  ## ─────────────────────────────────────────────────────────

  "experience_ta_koto_ga_aru": {
    ## 〜たことがあります（経験） L15
    "label":           "〜たことがあります（過去の経験の保有）",
    "schema":          "個人の時間軸上にアーカイブされた経験",
    "visual_strategy": {
      "key_elements": [
        "タイムライン曲線: 画面左（過去）から右（現在のキャラクター）へ延びる曲線。",
        "過去のイベントポイント: タイムライン上に「フラッシュ輝き（記憶の閃光）」や星マークをプロット。",
        "経験カウンター: キャラクターの頭上に「[経験アイコン] × チェックマーク」のバッジ。",
        "現在のキャラクター: タイムライン右端に立ち、過去を振り返る姿勢。"
      ],
      "prompt_core": (
        "Flat vector illustration. A curved timeline extends from the left (past) to the right. "
        "On the timeline: a gold starburst/flash stamp marking the moment of {PAST_EXPERIENCE}. "
        "A small icon of {EXPERIENCE_CONTENT} sits at that stamp point. "
        "RIGHT end of timeline: the main character standing, looking slightly back toward the past. "
        "Above the character: a badge showing [{EXPERIENCE_ICON} + green checkmark] "
        "indicating 'I have done this.' "
        "White background, clean flat design, no text."
      ),
      "avoid": ["現在進行中の動作として描く（たことがあります ≠ ています）"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "advice_ta_hou_ga_ii": {
    ## 〜たほうがいいです（助言） L15
    "label":           "〜たほうがいいです（助言・推奨）",
    "schema":          "2択の分岐ナビゲーション。推奨経路の明示。",
    "visual_strategy": {
      "key_elements": [
        "分岐道: キャラクターの前方に2つの道（上り坂の明るい道 vs 下り坂の危険な道）。",
        "推奨経路（たほうがいい）: グリーンのエフェクト + ISOブルーサークル + 親指立てのサムズアップ看板。",
        "非推奨経路（ないほうがいい）: JIS黄色警告三角標識を入り口に配置。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person standing at a FORK in the road. "
        "LEFT ROAD (recommended, going upward): bright green path with a large blue circle "
        "containing a thumbs-up icon — a navigation sign saying 'this way'. "
        "RIGHT ROAD (not recommended, going downward): dim path with a yellow warning triangle sign. "
        "Person looking toward the recommended road. "
        "White background, clean flat design, no text."
      ),
      "avoid": []
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "condition_tara": {
    ## 〜たら（完了後の条件） L22
    "label":           "〜たら（事象A完了後に事象Bが発生）",
    "schema":          "時間的順次実現（When / Once A is done, then B）",
    "visual_strategy": {
      "layout":        "2-panel: LEFT (completed condition) → RIGHT (result)",
      "key_elements": [
        "左コマ（If/When条件 完了状態）: 条件の「完了した瞬間」を描く（雨が降りきった状態・地面が濡れている）。",
        "右コマ（Then 結果）: 条件成立を受けた行動。",
        "コマ間接続: 直進型の太いネオンオレンジブロック矢印（〜たら の直接性・確実性を示す）。",
        "左コマのフレーム: 通常の角丸実線枠（不確定ではないため点線を使わない）。"
      ],
      "prompt_core": (
        "Flat vector illustration in 2-PANEL SEQUENTIAL layout. "
        "LEFT PANEL (solid frame): {CONDITION_A_COMPLETED_STATE} — showing the condition has FINISHED "
        "(e.g., rain has fallen and puddles are on the ground). "
        "CENTER: Bold neon orange BLOCK ARROW → pointing right. "
        "RIGHT PANEL (solid frame): Person performing {RESULT_ACTION_B}. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "左コマを点線フレームにしない（〜ば の仮定フレームと混同する）",
        "1枚に雨と室内を混在させる（因果関係が消える）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  "condition_ba": {
    ## 〜ば（論理的仮定条件） L22
    "label":           "〜ば（論理的仮定：IF条件ゲート）",
    "schema":          "論理的条件分岐（If condition matches → result）",
    "visual_strategy": {
      "layout":        "Flowchart: IF-GATE → 2 branches (meet/not meet)",
      "key_elements": [
        "左パネル（IF条件）: ボタン・スイッチ・条件オブジェクトを点線フレームで囲む（未確定）。",
        "中央: Y型分岐ゲート（フローチャートの菱形 or 分岐矢印）。",
        "上分岐（条件成立）: グリーン矢印 → 結果。",
        "下分岐（条件不成立）: グレー矢印 → 「変化なし」状態。"
      ],
      "prompt_core": (
        "Flat vector illustration in FLOWCHART layout. "
        "LEFT: {CONDITION_OBJECT/ACTION} inside a dashed rounded frame (IF condition — uncertain). "
        "CENTER: A Y-shaped split gate (diamond shape). "
        "UPPER BRANCH: Green arrow → {RESULT_IF_MET}. "
        "LOWER BRANCH: Gray dashed arrow → a neutral 'no change' icon. "
        "White background, clean flat design, no text."
      ),
      "avoid": [
        "〜たら の直進2コマレイアウトを使わない（論理分岐が消える）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  ## ─────────────────────────────────────────────────────────
  ## 限界文型（HARD_LIMIT = True）: 直接視覚化困難な文型
  ## 2コマ・3コマ救済設計（RESCUE_LAYOUT）を使用すること
  ## ─────────────────────────────────────────────────────────

  "regret_teshimaimashita": {
    ## 〜てしまいました（意図しない後悔・失敗） L15
    "label":           "〜てしまいました（意図しない完了・後悔）",
    "schema":          "意図しない完了結果 + 話者の後悔感情（二重描写必須）",
    "hard_limit": True,
    "rescue_layout":   "2コマ構成（直後の失敗 + 後悔反応）",
    "visual_strategy": {
      "key_elements": [
        "左コマ: 対象物に向かって「！」マークが噴出し、驚くキャラクターの顔（意図しなかったことを示す）。",
        "右コマ: 頭を抱えて落ち込む or 涙を流すキャラクター + 床に散らばった破片（後悔状態）。"
      ],
      "prompt_core": (
        "Flat vector illustration in 2-PANEL RESCUE LAYOUT. "
        "LEFT PANEL: Person with a shocked expression (!-mark explosion) "
        "as {ACCIDENTAL_EVENT} happens unintentionally. "
        "CENTER: Thin divider line (not an arrow — the two are simultaneous perspective). "
        "RIGHT PANEL: Person head-in-hands or crying (teardrop icon), "
        "with scattered fragments/result of {ACCIDENTAL_EVENT} on the floor. "
        "White background, clean flat design, no text."
      )
    },
    "uses_unified_char": False
  },

  "expectation_hazu_desu": {
    ## 〜はずです（客観的根拠に基づく確信） L16
    "label":           "〜はずです（客観的証拠に基づく強い確信）",
    "schema":          "論理的証拠と現実のギャップ / または証拠と予測の一致",
    "hard_limit": True,
    "rescue_layout":   "証拠提示 + 予測結果の対比構成",
    "visual_strategy": {
      "key_elements": [
        "キャラクターの手元に「時刻表 / スケジュール / 証拠ドキュメント」を拡大提示（客観的根拠）。",
        "腕時計を指して現在時刻を強調（証拠との照合）。",
        "背景にまだ起きていない事象（線路が空等）を「？」付き思考バブルで確認している構図。"
      ],
      "prompt_core": (
        "Flat vector illustration in EVIDENCE+PREDICTION layout. "
        "Person holding/pointing to a large document/timetable showing {EVIDENCE}. "
        "Person also pointing to their wristwatch showing the expected time. "
        "Background: the predicted event has NOT yet happened (empty space with a '?' bubble). "
        "White background, clean flat design, no text."
      )
    },
    "uses_unified_char": False
  },

  "attempt_temimasu": {
    ## 〜てみます（試しにやってみる） L15
    "label":           "〜てみます（試み・探索的行動）",
    "schema":          "探索的試行：未知→試行→評価の3段階",
    "hard_limit": True,
    "rescue_layout":   "3ステップ小画面並置",
    "visual_strategy": {
      "key_elements": [
        "ステップ1: 未知の対象を警戒して見る（頭上に「？」）。",
        "ステップ2: 少量を実際に試行（例：舌先をつける・少し開けてみる）。",
        "ステップ3: 評価結果（「！」マーク + ハートor星）。"
      ],
      "prompt_core": (
        "Flat vector illustration in 3-SMALL-PANEL layout (Step 1 → 2 → 3). "
        "Panel 1: Person looking cautiously at {UNKNOWN_OBJECT} with a '?' above their head. "
        "Panel 2: Person performing a TENTATIVE/SMALL ACTION (e.g., just touching, tasting a tiny bit). "
        "Panel 3: Person with a reaction expression (surprise+discovery '!' with heart or star). "
        "Small arrows between panels. White background, clean flat design, no text."
      )
    },
    "uses_unified_char": False
  },

  ## ─────────────────────────────────────────────────────────
  ## GROUP 5: 状態継続の追加パターン
  ## ─────────────────────────────────────────────────────────

  "habitual_teimasu": {
    ## 〜ています（習慣・職業） L12
    "label":           "〜ています（習慣・恒常的状態・職業）",
    "schema":          "長期的・社会的身分としての恒常状態",
    "visual_strategy": {
      "key_elements": [
        "住んでいます: 人物の胸元から伸びるアンカー（錨）ベクターが地図上の都市に突き刺さるアンカリング構図。",
        "働いています: 職業を示す「背景シャドーピクト（黒板・工場等）」を50%の薄さで背後に投影 + 現在の服装とリンク。",
        "ループ記号: 小さな∞マークまたは繰り返しサークル矢印を追加して「継続性」を示す。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in the foreground wearing {PROFESSION_ATTIRE}. "
        "Behind them: a 50%-opacity ghost background showing {PROFESSION_SETTING} (workplace/location). "
        "A small infinity (∞) symbol or circular repeat arrow near the person to show ongoing state. "
        "For 'sunde-imasu': an anchor icon from person's chest pointing to a city pin on a map. "
        "White background, clean flat design, no text."
      ),
      "avoid": ["一過性の動作（〜ています進行形）との混同"]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },
}

## ============================================================
## PART 9: PRONOUN_FRAMES（テンプレートK：代名詞）
## ============================================================
##
## Research②の結果。人称代名詞と疑問代名詞を体系化。
## 「こそあど」指示語（demonstrative: テンプレートG）とは区別する。
##   → こそあどは話者からの物理的距離が主軸
##   → 代名詞は指示対象の属性（人・物・場所・時）が主軸
## ============================================================

PRONOUN_FRAMES = {

  "watashi": {
    "label": "わたし（I / 1人称）",
    "actor_count": 1,
    "visual_strategy": {
      "key_elements": [
        "単一キャラクター（話者）を中央に配置。カメラ目線（正面）。",
        "話者の人差し指が自身の顔（鼻先）に向かっている（日本的自己参照ジェスチャー）。",
        "話者から自身に向かう湾曲した不透明な矢印（自己指示）。",
        "背景: 完全に無地。他者は登場させない。"
      ],
      "prompt_core": (
        "Flat vector illustration. Single person centered, facing camera directly. "
        "Their right index finger points toward their own nose/face. "
        "A curved self-referential arrow loops from the person back to themselves. "
        "Solid white background, no other characters, no text."
      ),
      "avoid": ["胸（チェスト）を指す西洋風ジェスチャーのみ（アジア圏学習者に伝わりにくい）"]
    }
  },

  "anata": {
    "label": "あなた（You / 2人称）",
    "actor_count": 2,
    "visual_strategy": {
      "key_elements": [
        "2名配置：話者（左・横顔）と聞き手（右・正面向き）。",
        "話者の人差し指が聞き手に向かう直線的な太い矢印。",
        "聞き手の周囲にフォーカスリング（ハイライト円）。"
      ],
      "prompt_core": (
        "Flat vector illustration. TWO characters: "
        "LEFT: speaker in 3/4 side view, index finger pointing directly at RIGHT character. "
        "RIGHT: listener facing forward with a highlight focus ring around them. "
        "A bold straight arrow from speaker to listener. "
        "White background, no text."
      ),
      "avoid": ["矢印なしの2ショット（単なる友達に見える）"]
    }
  },

  "kare": {
    "label": "かれ（He / 3人称男性）",
    "actor_count": 3,
    "visual_strategy": {
      "key_elements": [
        "3名：話者（前景左）・聞き手（前景右）・第三者男性（背景中央または奥）。",
        "話者から第三者に向かう点線矢印（第三者はその場にいるが会話の外側）。",
        "第三者のみ: 青みがかったカラーでハイライト or フォーカスリング。"
      ],
      "prompt_core": (
        "Flat vector illustration. THREE characters: "
        "FOREGROUND: two characters (speaker on left, listener on right) conversing. "
        "BACKGROUND CENTER: a male figure slightly apart from the conversation, highlighted. "
        "A dotted arrow from the speaker points toward the background male figure. "
        "White background, no text."
      ),
      "avoid": ["2名だけの構図（あなた と区別がつかない）"]
    }
  },

  "kanojo": {
    "label": "かのじょ（She / 3人称女性）",
    "actor_count": 3,
    "visual_strategy": {
      "key_elements": ["かれ と同一構図。第三者を女性のアウトラインで描画。"],
      "prompt_core": (
        "Same layout as 'kare'. BACKGROUND CENTER: a female figure (distinct outline/hairstyle) "
        "slightly apart, highlighted. Dotted arrow from speaker. White background, no text."
      ),
      "avoid": ["過度にステレオタイプな女性ジェスチャー（文化的偏見を避ける）"]
    }
  },

  "minna": {
    "label": "みんな（Everyone / We / They）",
    "actor_count": "4+",
    "visual_strategy": {
      "key_elements": [
        "4名以上の多様な人物シルエット（年齢・体格の多様性）を画面全域に配置。",
        "全員が中央を向いている。",
        "グループ全体を包み込む緩やかな円形の破線オーラ（包括を示す）。",
        "または両手を広げたジェスチャーで「全員」を包含するポーズ。"
      ],
      "prompt_core": (
        "Flat vector illustration. 4-5 diverse character silhouettes spread across the frame, "
        "all facing inward toward center. A soft dashed circular boundary encloses all figures. "
        "Characters vary in size and hairstyle to show diversity. "
        "White background, no text."
      ),
      "avoid": ["特定の性別・年代のみのグループ（家族や同僚に誤認される）"]
    }
  },

  "dare": {
    "label": "だれ（Who / 疑問代名詞：人）",
    "visual_strategy": {
      "key_elements": [
        "人物型シルエット（境界線は破線）。内部は空白。",
        "シルエットの頭部位置に大きな「？」記号。",
        "話者が破線シルエットに向かって「探求するジェスチャー」。"
      ],
      "prompt_core": (
        "Flat vector illustration. A person-shaped blank silhouette with DASHED outline (unknown identity). "
        "A large bold '?' symbol positioned at head level inside the silhouette. "
        "Small searching character on the side looking toward the silhouette. "
        "White background, no text."
      ),
      "avoid": ["具体的な顔パーツの描画（特定の誰かになる）"]
    }
  },

  "nani": {
    "label": "なに（What / 疑問代名詞：物）",
    "visual_strategy": {
      "key_elements": [
        "事物のシルエット（境界線は破線）。内部は空白。",
        "シルエット上に「？」記号。",
        "プレゼントボックスや中身の見えない袋を覗き込む人物。"
      ],
      "prompt_core": (
        "Flat vector illustration. An object-shaped blank silhouette with DASHED outline. "
        "A large '?' symbol inside the silhouette. "
        "Person leaning toward the mystery object, looking curiously. "
        "White background, no text."
      ),
      "avoid": ["具体的なアイテムの描画（りんご → リンゴの語彙カードになる）"]
    }
  },

  "doko": {
    "label": "どこ（Where / 疑問代名詞：場所）",
    "visual_strategy": {
      "key_elements": [
        "地図または抽象的な空間アイコン。",
        "特定の1点を指し示すピン（境界線は破線）＋「？」記号。",
        "人物が地図を見渡し、片手を額にかざして探索。"
      ],
      "prompt_core": (
        "Flat vector illustration. A simplified map or abstract space layout. "
        "A location pin with DASHED outline and '?' symbol at an uncertain spot. "
        "Person looking at the map with hand shading eyes (searching gesture). "
        "White background, no text."
      )
    }
  },

  "itsu": {
    "label": "いつ（When / 疑問代名詞：時）",
    "visual_strategy": {
      "key_elements": [
        "時計の文字盤の針の代わりに「？」が回転しているようなインフォグラフィック。",
        "またはカレンダー上の日付部分が「？」に置き換わった表現。"
      ],
      "prompt_core": (
        "Flat vector illustration. A clock face where the hands are replaced by a large '?' symbol. "
        "Or a calendar grid where the specific date cell shows '?' instead of a number. "
        "White background, no text."
      ),
      "avoid": ["通常の時計（「時間」「3時」の語彙カードに誤認される）"]
    }
  },
}


## ============================================================
## PART 10: INTERJECTION_FRAMES（テンプレートL：感動詞）
## ============================================================
##
## Research②の結果。文化的ジェスチャー差異を回避するため
## 「✓/✗ in 発話バブル」のハイブリッド手法を採用。
## ============================================================

INTERJECTION_FRAMES = {

  "hai_ee": {
    "label": "はい・ええ（肯定）",
    "visual_strategy": {
      "key_elements": [
        "穏やかな笑顔。口は軽く開いた発話状態。",
        "頭部に上下のブレ線（うなずきを示す動線）。",
        "発話バブル内部: 大きな緑色のチェックマーク「✓」または二重丸「◎」。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with a gentle smile, mouth slightly open. "
        "Short vertical motion lines above head to show nodding. "
        "A speech bubble from mouth containing a large GREEN CHECKMARK ✓ "
        "(or double circle ◎). White background, no text."
      ),
      "avoid": ["満面の笑みだけ（嬉しい・好きなど感情形容詞と区別できない）"]
    }
  },

  "iie": {
    "label": "いいえ（否定）",
    "visual_strategy": {
      "key_elements": [
        "眉をわずかにひそめた表情。",
        "片手を顔の前に掲げ、手のひらを外側に向けている（日本の否定ジェスチャー）。",
        "顔の横に左右の首振りを示すブレ線（横方向）。",
        "発話バブル内部: 大きな赤色のバツマーク「✗」。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with slightly furrowed brows, "
        "one hand raised palm-outward in front of face. "
        "Horizontal motion lines beside head to show head-shaking. "
        "A speech bubble containing a large RED CROSS ✗. "
        "White background, no text."
      ),
      "avoid": ["腕を完全に組むポーズ（威圧感・怒りを表現してしまう）"]
    }
  },

  "a_aa": {
    "label": "あ・ああ（発見・驚き）",
    "visual_strategy": {
      "key_elements": [
        "目を見開き、口を小さく丸く開けた「発見」の表情。",
        "頭上に黄色い電球（💡）または「！」マーク。",
        "視線は斜め上の何か（発見対象）に向かっている。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with wide eyes and small round open mouth (discovery expression). "
        "Above head: a yellow lightbulb or bold '!' exclamation icon. "
        "Eyes directed upward-diagonally toward something just discovered. "
        "White background, no text."
      )
    }
  },

  "oo_sugoi": {
    "label": "おー・すごい（感嘆・称賛）",
    "visual_strategy": {
      "key_elements": [
        "両手を胸の前で合わせ、目は輝き（星印）、口は大きく「お」の形に開く。",
        "頭上からキラキラした光のパーティクル（星・ひし形）が降っている。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with hands clasped together, "
        "star-gleam eyes, and widely open 'O'-shaped mouth in awe. "
        "Sparkling star particles/diamond shapes raining down from above. "
        "White background, no text."
      ),
      "avoid": ["泣き叫んでいるように見える口の開け方（悲しい・助けてと混同）"]
    }
  },

  "naruhodo": {
    "label": "なるほど（納得・理解の完了）",
    "visual_strategy": {
      "key_elements": [
        "人差し指を立てて、ポンと手のひらに置くジェスチャー（閃き・納得の日本的サイン）。",
        "目は細めた納得の表情。",
        "頭部背後: 波線（混沌・疑問）から直線・矢印（解決）へ変化する思考プロセスグラフィック。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person with a knowing expression (eyes slightly narrowed), "
        "one index finger raised and touching palm of other hand. "
        "Behind head: a graphic showing wavy confused lines transitioning to a clean straight arrow "
        "(from confusion to clarity). White background, no text."
      ),
      "avoid": ["腕組みして考え込んでいる構図（思考中に見えて、納得の完了が伝わらない）"]
    }
  },

  "sou_desu_ka": {
    "label": "そうですか（聞き取り・受容）",
    "visual_strategy": {
      "key_elements": [
        "首をわずかに前傾させ、口元は真一文字。",
        "目線は対峙する話者に向いている。",
        "発話バブル内部: 波線（同調）または小さな二重丸「◎」。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in a slightly forward-leaning listening posture, "
        "mouth in a neutral straight line, eyes focused on an implied speaker to the side. "
        "A speech bubble containing a wavy 'acknowledgment' line or small ◎. "
        "White background, no text."
      ),
      "avoid": ["睨みつけるような視線（疑っている・怒っているに誤解される）"]
    }
  },

  "sumimasen": {
    "label": "すみません（謝罪・呼びかけ）",
    "visual_strategy": {
      "key_elements": [
        "軽くお辞儀をするキャラクター（45度前傾）。",
        "発話バブル内部: 心臓 + ヒビ（申し訳なさ）または軽い感嘆符「!」。",
        "呼びかけ用途の場合: 手を軽く挙げるジェスチャー + 相手へ向けた視線。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in a slight bow (45 degrees forward). "
        "A speech bubble containing a small heart with a crack line (apology), "
        "or an exclamation mark (attention-getting). "
        "White background, no text."
      )
    }
  },
}


## ============================================================
## PART 11: SET_EXPR_FRAMES（テンプレートM：定型表現）
## ============================================================
##
## Research②の結果。場面・社会的文脈が意味の担い手。
## 「語」ではなく「場面全体」を描く。
## ============================================================

SET_EXPR_FRAMES = {

  "ohayou_gozaimasu": {
    "label": "おはようございます（朝の挨拶）",
    "scene_context": "朝・自宅玄関または職場入口",
    "visual_strategy": {
      "key_elements": [
        "背景: 窓から差し込む朝日。オレンジ〜イエローグラデーション（フラット表現）。",
        "アクター: 2名（挨拶する人 + 受ける人）。",
        "動作: 片方がお辞儀（軽く）。もう片方が応答するポーズ。",
        "場面シンボル: 太陽のアイコン（左上）。"
      ],
      "prompt_core": (
        "Flat vector illustration. SCENE: morning setting with sunlight through a window "
        "(yellow-orange sunrise icon top-left). "
        "TWO characters: one doing a slight bow greeting, the other responding with a smile. "
        "White background with morning atmosphere elements. No text."
      )
    }
  },

  "itadakimasu": {
    "label": "いただきます（食事前の挨拶）",
    "scene_context": "食事場面・食卓",
    "visual_strategy": {
      "key_elements": [
        "食卓シーン: テーブルの上に料理（シンプルな丼またはプレート）。",
        "アクター: 1〜2名が食事前に手を合わせるポーズ（合掌）。",
        "場面シンボル: フォーク + 箸のアイコン / 湯気アイコン。"
      ],
      "prompt_core": (
        "Flat vector illustration. SCENE: dining table with a simple meal (bowl/plate with steam rising). "
        "Person(s) in HANDS-TOGETHER prayer/gratitude gesture (itadakimasu pose) before eating. "
        "Chopsticks + fork icon or steam cloud. White background, no text."
      )
    }
  },

  "gochisousama_deshita": {
    "label": "ごちそうさまでした（食事後の挨拶）",
    "scene_context": "食事終了・空の皿",
    "visual_strategy": {
      "key_elements": [
        "テーブルの上の空のお皿（食べ終えた状態）。",
        "アクター: 1〜2名が手を合わせるポーズ（いただきます と同じジェスチャー）。",
        "違いを示す: 皿が空であること（before = いただきます / after = ごちそうさま）。"
      ],
      "prompt_core": (
        "Flat vector illustration. SCENE: dining table with EMPTY clean plates "
        "(meal is finished — contrast with the full plate of 'itadakimasu'). "
        "Person(s) in hands-together gratitude gesture after meal. "
        "White background, no text."
      )
    }
  },

  "yoroshiku_onegaishimasu": {
    "label": "よろしくおねがいします（初対面・依頼）",
    "scene_context": "初対面・ビジネスシーン・依頼場面",
    "visual_strategy": {
      "key_elements": [
        "2名がお互いにお辞儀をしている（ビジネス的な深いお辞儀）。",
        "手渡しされる名刺（カード）アイコン（名刺交換の場面を暗示）。",
        "または: 握手ジェスチャー（国際的な文脈用）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Two characters bowing toward each other (formal Japanese greeting bow). "
        "A small business card icon being exchanged between them, "
        "OR handshake gesture at the midpoint. White background, no text."
      )
    }
  },

  "otsukaresama_desu": {
    "label": "おつかれさまです（労いの挨拶）",
    "scene_context": "職場・仕事後",
    "visual_strategy": {
      "key_elements": [
        "疲れた様子のキャラクター（汗・ため息ライン・前かがみ）。",
        "もう1名のキャラクターが手を差し伸べる / 肩を軽く叩くジェスチャー。",
        "背景: 時計アイコンが夕方（または終業時刻）を示している。"
      ],
      "prompt_core": (
        "Flat vector illustration. Scene of end-of-work day. "
        "One character looking tired (slumped posture, sweat drop). "
        "Another character offering an encouraging pat on the shoulder or extending a hand. "
        "Clock icon showing late afternoon time. White background, no text."
      )
    }
  },

  "ojama_shimasu": {
    "label": "おじゃまします（他人の家・部屋に入る挨拶）",
    "scene_context": "玄関・他人の家の入口",
    "visual_strategy": {
      "key_elements": [
        "開いた扉 / 玄関口。",
        "アクター: 訪問者が扉の外側で軽くお辞儀をしているか、扉をノックしている。",
        "家主: 扉の内側で出迎えているポーズ。",
        "場面シンボル: ドアアイコン + 矢印（外→内への移行）。"
      ],
      "prompt_core": (
        "Flat vector illustration. SCENE: front door/entrance. "
        "VISITOR outside the open door in a slight bow posture. "
        "HOST inside the door welcoming them. "
        "An arrow showing the transition from outside to inside. "
        "White background, no text."
      )
    }
  },
}

## ============================================================
## PART 12: ADVERB_FRAMES（テンプレートN：副詞）
## ============================================================
##
## Research②の結果。修飾関係が必須で単独では意味が完結しない。
## 4分類（程度・頻度・様態・時制）で戦略が異なる。
## ============================================================

ADVERB_FRAMES = {

  ## ─── 程度副詞（Degree Adverbs） ───

  "totemo_very": {
    "label": "とても（very / 高程度）",
    "adverb_type": "degree",
    "anchor_object": "形容詞を持つ物体または人物の状態が必須",
    "visual_strategy": {
      "key_elements": [
        "評価バー（度数計）: 画面右端に縦の程度スケール。針が最大値（100%）を指す。",
        "アンカー物体（例：「とても大きい」→ 誇張スケールの大きな箱）が中央。",
        "「とても」の強度: アンカー物体の周囲に放射状の強調ラインを3〜5本配置。"
      ],
      "prompt_core": (
        "Flat vector illustration. CENTER: {ANCHOR_OBJECT} showing high-degree {ADJECTIVE} quality "
        "(e.g., exaggeratedly large, bright, hot). "
        "RIGHT SIDE: a vertical degree meter bar with the needle pointing to MAX (100%). "
        "3-5 radiating emphasis lines around the object showing intensity. "
        "White background, no text."
      )
    }
  },

  "sukoshi_a_little": {
    "label": "すこし（a little / 低程度）",
    "adverb_type": "degree",
    "visual_strategy": {
      "key_elements": [
        "評価バー: 針が25〜35%の低い位置を指す。",
        "アンカー物体の変化が微小（例：「少し大きい」→ ほんの少しだけサイズが違う2つの物体）。",
        "物体の周囲の強調ラインは1本のみ（とても の3〜5本と対比）。"
      ],
      "prompt_core": (
        "Flat vector illustration. CENTER: {ANCHOR_OBJECT} showing a SMALL degree of {ADJECTIVE} "
        "(minimal visible difference). "
        "RIGHT SIDE: degree meter at 25-35%. "
        "Only 1 thin emphasis line around the object. White background, no text."
      )
    }
  },

  "amari_nai": {
    "label": "あまり〜ない（not very / 低程度否定）",
    "adverb_type": "degree",
    "visual_strategy": {
      "key_elements": [
        "評価バー: 針が20〜30%の低い位置 + バー全体に薄い取り消し線。",
        "否定バリアシールド（小さめ）をアンカー物体の前に配置。"
      ],
      "prompt_core": (
        "Flat vector illustration. Degree meter at 20-30% with a light diagonal line across the bar. "
        "A small rejection shield in front of {ANCHOR_OBJECT} showing the quality is largely absent. "
        "White background, no text."
      )
    }
  },

  "zenzen_nai": {
    "label": "ぜんぜん〜ない（not at all / ゼロ否定）",
    "adverb_type": "degree",
    "visual_strategy": {
      "key_elements": [
        "評価バー: 針が0%（底部）。バー全体に太い赤取り消し線。",
        "対象物の周囲に完全な遮断バリア（完全否定）。",
        "0%バッジまたは空の円（ゼロを示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Degree meter at 0% with a bold red slash across the bar. "
        "Complete rejection shield around {ANCHOR_OBJECT}. "
        "A '0%' or empty circle badge. White background, no text."
      )
    }
  },

  ## ─── 頻度副詞（Frequency Adverbs） ───

  "itsumo_always": {
    "label": "いつも（always / 常時）",
    "adverb_type": "frequency",
    "visual_strategy": {
      "key_elements": [
        "7マスのカレンダーグリッド（月〜日）。全マスに同一の活動アイコン（チェックマーク）。",
        "∞ループ矢印をグリッドの下に配置（継続性を示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid (one week). "
        "EVERY cell contains the same small activity icon or green checkmark. "
        "An infinity (∞) loop arrow below the grid. White background, no text."
      )
    }
  },

  "tokidoki_sometimes": {
    "label": "ときどき（sometimes / 不定期）",
    "adverb_type": "frequency",
    "visual_strategy": {
      "key_elements": [
        "7マスのカレンダーグリッド。2〜3マスのみにアイコン（不規則に配置）。残りは空白。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid. "
        "Only 2-3 randomly placed cells contain the activity icon. "
        "Remaining cells are empty/gray. White background, no text."
      )
    }
  },

  "yoku_often": {
    "label": "よく（often / 高頻度）",
    "adverb_type": "frequency",
    "visual_strategy": {
      "key_elements": [
        "7マスのカレンダーグリッド。5〜6マスにアイコン（高頻度）。残り1〜2は空白。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid. "
        "5-6 cells filled with the activity icon. 1-2 cells empty. "
        "White background, no text."
      )
    }
  },

  ## ─── 様態副詞（Manner Adverbs） ───

  "yukkuri_slowly": {
    "label": "ゆっくり（slowly / 緩速）",
    "adverb_type": "manner",
    "visual_strategy": {
      "key_elements": [
        "動作する人物またはオブジェクトのスピードラインが少ない（1〜2本、細い）。",
        "モーション軌跡を長く・なだらかに描く（緩やかな弧線）。",
        "対比用: 同じ動作の「はやく」バージョンと並べる場合は、右側に多数・濃いスピードラインを配置。"
      ],
      "prompt_core": (
        "Flat vector illustration. {ACTOR} performing {ACTION} at a slow pace. "
        "Only 1-2 thin, widely-spaced motion trail lines behind the moving part. "
        "Motion arc is long and gradual. White background, no text."
      )
    }
  },

  "hayaku_quickly": {
    "label": "はやく（quickly / 高速）",
    "adverb_type": "manner",
    "visual_strategy": {
      "key_elements": [
        "多数の速度線（スピードライン: 5〜8本、濃い、密集）。",
        "動作の残像（モーションブラー効果: 2〜3段階のゴースト）。"
      ],
      "prompt_core": (
        "Flat vector illustration. {ACTOR} performing {ACTION} at high speed. "
        "5-8 dense bold speed lines behind the moving part. "
        "2-3 ghost motion trails at decreasing opacity. White background, no text."
      )
    }
  },

  ## ─── 時制副詞（Temporal Adverbs） ───

  "mou_already": {
    "label": "もう（already / 完了）",
    "adverb_type": "temporal",
    "visual_strategy": {
      "key_elements": [
        "タイムライン上で「現在地」より左（過去）に完了マーク（緑チェック）が置かれている。",
        "現在のキャラクターが「完了済み」の状態にいる。"
      ],
      "prompt_core": (
        "Flat vector illustration. A short timeline from left (past) to right (now). "
        "A green checkmark stamp sits LEFT of the 'now' marker — action is already done. "
        "Person in a relaxed/completed posture. White background, no text."
      )
    }
  },

  "mada_not_yet": {
    "label": "まだ〜ていません（not yet / 未完了）",
    "adverb_type": "temporal",
    "visual_strategy": {
      "key_elements": [
        "タイムライン上で「現在地」より右（未来）に未完了マーク（空のサークル / 破線）。",
        "現在のキャラクターが待機・準備中のポーズ。"
      ],
      "prompt_core": (
        "Flat vector illustration. Timeline from left (past) to right (future). "
        "An empty dashed circle sits RIGHT of the 'now' marker — action not yet done. "
        "Person in a waiting or preparation posture. White background, no text."
      )
    }
  },
}


## ============================================================
## PART 13: COUNTER_FRAMES（テンプレートO：助数詞）
## ============================================================
##
## Research②の結果。数量×物体カテゴリの組み合わせで意味が決まる。
## ============================================================

COUNTER_FRAMES = {

  "_base_layout": {
    "description": "全助数詞共通の基本レイアウト",
    "layout":      "物体を N個並べる（通常2〜4個）+ 数量を示す指アイコンまたは数字ピクト",
    "key_principle": (
      "物体の「カテゴリ」が助数詞の意味の本体。"
      "同じ「3」でも、3本・3枚・3頭では描くべき物体が全く異なる。"
      "物体 + カテゴリ記号 + 数量の三要素を1枚に収める。"
    )
  },

  "hon_long_thin": {
    "label": "〜本（細長いものを数える）",
    "target_objects": ["えんぴつ", "かさ", "ペン", "びん", "バナナ"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {LONG_THIN_OBJECT}s (e.g., pencils/bottles) "
        "arranged side by side vertically. "
        "A small counter badge showing [{OBJECT_ICON} × {N}] in the corner. "
        "White background, no text."
      )
    }
  },

  "mai_flat": {
    "label": "〜枚（薄いものを数える）",
    "target_objects": ["かみ", "きって", "T シャツ", "さら"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {FLAT_OBJECT}s (e.g., sheets of paper/stamps) "
        "fanned out or stacked with slight offset showing multiple layers. "
        "Counter badge [{OBJECT_ICON} × {N}]. White background, no text."
      )
    }
  },

  "satsu_bound": {
    "label": "〜冊（本・ノートを数える）",
    "target_objects": ["本", "ノート", "ざっし"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {BOUND_OBJECT}s (e.g., books) "
        "arranged in a small stack or row, spines visible. "
        "Counter badge [{OBJECT_ICON} × {N}]. White background, no text."
      )
    }
  },

  "hiki_small_animal": {
    "label": "〜匹（小動物を数える）",
    "target_objects": ["ねこ", "いぬ", "さかな", "うさぎ"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {SMALL_ANIMAL}s in simple sitting or standing poses, "
        "arranged in a row. Counter badge [{ANIMAL_ICON} × {N}]. "
        "White background, no text."
      )
    }
  },

  "tou_large_animal": {
    "label": "〜頭（大型動物を数える）",
    "target_objects": ["うし", "うま", "ぞう"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {LARGE_ANIMAL}s (simplified silhouettes) "
        "arranged in a row with scale cues. "
        "Counter badge [{ANIMAL_ICON} × {N}]. White background, no text."
      )
    }
  },

  "dai_machine": {
    "label": "〜台（機械・乗り物を数える）",
    "target_objects": ["くるま", "じてんしゃ", "パソコン"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {MACHINE_OBJECT}s in canonical view, "
        "arranged in a row. Counter badge [{MACHINE_ICON} × {N}]. "
        "White background, no text."
      )
    }
  },

  "ko_small_object": {
    "label": "〜個（小さな個体を数える）",
    "target_objects": ["りんご", "たまご", "みかん"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} {ROUND_OBJECT}s arranged naturally (e.g., in a bowl "
        "or in a row). Counter badge [{OBJECT_ICON} × {N}]. White background, no text."
      )
    }
  },

  "hai_cup": {
    "label": "〜杯（カップ・コップで数える）",
    "target_objects": ["みず", "コーヒー", "ごはん"],
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration. {N} cups/bowls of {CONTENT} in a row. "
        "Steam lines if hot. Counter badge [{CUP_ICON} × {N}]. "
        "White background, no text."
      )
    }
  },
}


## ============================================================
## PART 14: TIME_FRAMES（テンプレートP：時間語彙）
## ============================================================
##
## Research③の結果。空間的時間写像（Spatial-Temporal Mapping）を適用。
## ============================================================

TIME_FRAMES = {

  "_base_principle": (
    "時間語彙は物理的な実体を持たないため、"
    "人間が空間認知を利用して時間を理解する「空間的時間写像」を応用する。"
    "テキストを一切使わず、カレンダーグリッド・時計・タイムラインで表現する。"
  ),

  ## ─── 曜日 ───
  "youbi_weekday": {
    "label": "〜曜日（曜日全般）",
    "visual_strategy": {
      "key_elements": [
        "7連カレンダープログレスバー（7マスを横一列）。対象の曜日マスのみをゴールドでハイライト。",
        "各曜日の自然元素ピクトグラム（テキスト不可・絵のみ）:",
        "  月（月・ムーン）: 三日月アイコン",
        "  火（ひ・炎）: 炎アイコン",
        "  水（みず・水）: 水滴アイコン",
        "  木（き・木）: 木のアイコン",
        "  金（かね・金属）: コインまたは星アイコン",
        "  土（つち・土）: 山または土山アイコン",
        "  日（ひ・太陽）: 太陽アイコン"
      ],
      "prompt_core": (
        "Flat vector illustration. A 7-cell horizontal calendar bar (Mon-Sun). "
        "Target day cell highlighted in gold. "
        "Each cell contains a nature element pictogram (no text): "
        "Mon=crescent moon, Tue=flame, Wed=water drop, Thu=tree, "
        "Fri=coin/star, Sat=hill/earth mound, Sun=sun circle. "
        "White background, no text."
      )
    }
  },

  ## ─── 〜月（月） ───
  "tsuki_month": {
    "label": "〜月（月を数える）",
    "visual_strategy": {
      "key_elements": [
        "12分割カレンダーホイール（円形）。対象の月セクターのみをゴールドでハイライト。",
        "ハイライトセクター内部に季節のシンボルを極小配置（1・2月=雪、3・4・5月=桜、等）。"
      ],
      "prompt_core": (
        "Flat vector illustration. A circular calendar wheel divided into 12 equal sectors. "
        "The target month sector is highlighted in gold. "
        "Inside the highlighted sector: a tiny seasonal symbol (e.g., snowflake for Jan-Feb, "
        "cherry blossom for Mar-Apr-May). Other sectors in light gray. "
        "White background, no text."
      )
    }
  },

  ## ─── 季節 ───
  "kisetsu_season": {
    "label": "春・夏・秋・冬（季節）",
    "visual_strategy": {
      "key_elements": [
        "4分割の円形ホイール（4カルーセル）。各象限に季節のシンボル：",
        "  春（ピンク #FFB7C5）: 桜の花びら",
        "  夏（ゴールド #FFD700）: 向日葵",
        "  秋（ブラウン #D2691E）: もみじ・紅葉",
        "  冬（ライトブルー #87CEEB）: 雪の結晶",
        "対象の季節のセクターのみを100%不透明度でハイライト。"
      ],
      "prompt_core": (
        "Flat vector illustration. A circular 4-quadrant wheel, each sector containing a season symbol: "
        "TOP-LEFT Spring (pink #FFB7C5): cherry blossom petals. "
        "TOP-RIGHT Summer (gold #FFD700): sunflower. "
        "BOTTOM-RIGHT Autumn (brown #D2691E): maple leaf. "
        "BOTTOM-LEFT Winter (light blue #87CEEB): snowflake. "
        "Target season at full opacity; others at 40% opacity. "
        "White background, no text."
      )
    }
  },

  ## ─── 時刻 ───
  "jikan_clock": {
    "label": "〜時・〜分（時刻）",
    "visual_strategy": {
      "key_elements": [
        "時計盤自体をニュートラルグレー（不透明度70%）で描画（「時計という物体」ではなく「時間の概念」を示す）。",
        "短針・長針および指し示す目盛り部分のみをシアンまたはレッドでハイライト。",
        "「〜分」の場合: 対応するセクター（扇形エリア）を半透明カラー面で塗りつぶす。"
      ],
      "prompt_core": (
        "Flat vector illustration. Clock face in muted neutral gray at 70% opacity "
        "(to show it represents TIME CONCEPT, not a clock object). "
        "Hour hand and minute hand pointing to {TIME} highlighted in bold cyan or red. "
        "The minute sector filled with a semi-transparent color wedge. "
        "White background, no text."
      ),
      "avoid": ["完全不透明の時計（「時計」という物体の語彙カードと混同する）"]
    }
  },

  "goro_approximately": {
    "label": "〜ごろ（約・おおよその時刻）",
    "visual_strategy": {
      "key_elements": [
        "時計盤。針の周囲に同心円状の「ぼかし・揺らぎ」を表現する同調ベクターアーク。",
        "針の先端が複数の扇形エリアにまたがるように描く（曖昧さを表現）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Clock face with hands pointing to {APPROXIMATE_TIME}. "
        "Around the hand tip: 2-3 concentric fuzzy arcs (ripple lines) showing time ambiguity range. "
        "The exact position is deliberately blurred across a 30-minute range. "
        "White background, no text."
      )
    }
  },

  ## ─── 相対時間 ───
  "kyou_ashita_kinou": {
    "label": "今日・明日・昨日（相対的日付）",
    "visual_strategy": {
      "key_elements": [
        "3マスのカレンダーグリッド（横並び）。",
        "中央マス（今日）: ゴールド枠 + 下から上へのポインターインジケーター。",
        "右マス（明日）: ライトグリーンでハイライト。中央→右の右向き矢印。",
        "左マス（昨日）: ライトブルーでハイライト。中央→左の左向き矢印。"
      ],
      "prompt_core": (
        "Flat vector illustration. 3 calendar cells in a row: "
        "LEFT cell (yesterday): highlighted in light blue with a leftward arrow from center. "
        "CENTER cell (today): outlined in gold with a downward pointer indicator. "
        "RIGHT cell (tomorrow): highlighted in light green with a rightward arrow from center. "
        "White background, no text."
      )
    }
  },

  "raishuu_senshuu": {
    "label": "来週・先週（相対的な週）",
    "visual_strategy": {
      "key_elements": [
        "縦に3行並んだカレンダーグリッド（各行7マス）。",
        "中央行（今週）: グレーアウト。",
        "上行（先週）: ライトブルーでハイライト。上行全体にアップ↑矢印。",
        "下行（来週）: ライトグリーンでハイライト。下行全体にダウン↓矢印。"
      ],
      "prompt_core": (
        "Flat vector illustration. 3-row calendar grid (each row = 7 days). "
        "TOP ROW (last week): highlighted light blue with ↑ upward arrow on the left. "
        "MIDDLE ROW (this week): grayed out. "
        "BOTTOM ROW (next week): highlighted light green with ↓ downward arrow on the left. "
        "White background, no text."
      )
    }
  },

  "mainichi_every_day": {
    "label": "毎日（every day）",
    "visual_strategy": {
      "key_elements": [
        "7マスのグリッド（全マス）に同一の活動アイコン。",
        "∞ループ矢印またはサイクル矢印をグリッドの下に配置。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid with the SAME activity icon "
        "in EVERY cell (showing daily repetition). "
        "A circular cycle arrow below the grid. White background, no text."
      )
    }
  },

  ## ─── 時間帯 ───
  "jikantai_time_of_day": {
    "label": "朝・昼・夜・午前・午後（時間帯）",
    "visual_strategy": {
      "key_elements": [
        "24時間スプリット目盛りまたはアーク（半円のサン/ムーンアーク）。",
        "朝: オレンジ色の太陽が右下から昇る。",
        "昼: 太陽が弧の頂点（真上）。",
        "夜: 月・星が右上。",
        "午前: アークの左半分をゴールドで塗る。",
        "午後: アークの右半分を薄い紫・紺で塗る。"
      ],
      "prompt_core": (
        "Flat vector illustration. A semicircular arc (representing the day cycle from sunrise to sunset). "
        "Sun icon at the appropriate position on the arc: "
        "LEFT = morning, TOP = noon, RIGHT = evening. "
        "For 午前/午後: LEFT half of arc in gold (#FF8C00), RIGHT half in indigo (#191970). "
        "White background, no text."
      )
    }
  },
}


## ============================================================
## PART 15: TRANSPORT_FRAMES（テンプレートQ：交通手段）
## ============================================================
##
## Research③の結果。JIS Z 8210準拠。
## 乗り物ごとのカノニカルビューと識別シグネチャーを確定。
## ============================================================

TRANSPORT_FRAMES = {

  "_base_principle": (
    "交通手段語彙の核心課題:"
    "(1) 日本特有の類似鉄道体系（電車・新幹線・地下鉄）を非言語で100%誤認なく峻別すること。"
    "(2) 格助詞「〜で行きます」の手段的意味を語彙カードに埋め込むこと（動作シルエット）。"
  ),

  "_canonical_views": {
    "profile_side": ["飛行機", "船", "自転車", "バイク", "自動車", "タクシー"],
    "three_quarter": ["電車", "新幹線", "地下鉄", "バス"]
  },

  "densha_train": {
    "label": "電車（在来線）",
    "canonical_view": "3/4 斜め前方",
    "visual_signatures": [
      "車両上部: パンタグラフ（集電装置）と架線（オーバーヘッドワイヤー）が必須",
      "下部: 地上を走る2本のレール + バラスト（砂利）",
      "架線柱: 車両の側方に1本以上"
    ],
    "prompt_core": (
      "Flat vector illustration of a COMMUTER TRAIN in 3/4 front angle view. "
      "On top: a pantograph (zigzag current collector) touching overhead electric wires. "
      "Below: two steel rails on gravel ballast (ground level). "
      "Overhead wire poles visible beside the track. "
      "Regular-looking train car with multiple sliding doors. "
      "No text, clean flat design."
    )
  },

  "shinkansen_bullet": {
    "label": "新幹線（高速鉄道）",
    "canonical_view": "3/4 斜め前方（超流線型ロングノーズ強調）",
    "visual_signatures": [
      "超流線型のロングノーズ（先頭車両の空力形状）",
      "架線・架線柱は描かない（シンプルな天井）",
      "高架橋（コンクリートスラブ軌道）の上を走る",
      "背景: 速度感を示す平行スピードライン"
    ],
    "prompt_core": (
      "Flat vector illustration of a SHINKANSEN (bullet train) in dramatic 3/4 front angle. "
      "Distinctive AERODYNAMIC LONG NOSE on the front car. "
      "No overhead wires (clean roof). Running on an elevated concrete viaduct (not ground level). "
      "Bold horizontal speed lines in the background showing high speed. "
      "No text, clean flat design."
    )
  },

  "chikatetsu_subway": {
    "label": "地下鉄（地下鉄道）",
    "canonical_view": "正面〜3/4（トンネル断面アーク必須）",
    "visual_signatures": [
      "丸いコンクリートのトンネル断面アーク（地下であることの唯一のシグナル）",
      "架線なし（サードレール方式）",
      "背景全体: ダークチャコールグレー（地下空間）",
      "車両側面を光で浮かび上がらせる"
    ],
    "prompt_core": (
      "Flat vector illustration of a SUBWAY TRAIN emerging from a circular concrete tunnel opening. "
      "The tunnel interior is dark charcoal gray with the train headlights illuminating the space. "
      "NO overhead wires on the roof (clean top). "
      "Two steel rails visible on the tunnel floor. "
      "Dark atmospheric background to clearly indicate underground. "
      "No text, clean flat design."
    )
  },

  "basu_bus": {
    "label": "バス",
    "canonical_view": "3/4 斜め前方",
    "visual_signatures": [
      "複数の大型折戸扉（引き戸）",
      "巨大なフロントガラス",
      "2連バックミラー"
    ],
    "prompt_core": (
      "Flat vector illustration of a CITY BUS in 3/4 front angle. "
      "Multiple large sliding/folding passenger doors visible on the side. "
      "Large front windshield. Two side mirrors extending from front. "
      "No text, clean flat design."
    )
  },

  "takushi_taxi": {
    "label": "タクシー",
    "canonical_view": "真横（プロファイルビュー）",
    "visual_signatures": [
      "ルーフの「あんどん（社名表示灯）」: 車上の四角い標識",
      "ドアのチェッカーラインまたはストライプ",
      "一般乗用車との識別に必須"
    ],
    "prompt_core": (
      "Flat vector illustration of a TAXI in true side (profile) view. "
      "On the roof: a rectangular taxi sign/light (andon). "
      "On the door/lower body: a checker pattern or decorative stripe. "
      "No text, clean flat design."
    )
  },

  "jitensha_bicycle": {
    "label": "自転車",
    "canonical_view": "真横（プロファイルビュー）",
    "visual_signatures": [
      "三角形のフレーム構造（ダイヤモンドフレーム）",
      "前後2つの等径ホイール",
      "ペダル（クランクアーム + ペダル本体）"
    ],
    "prompt_core": (
      "Flat vector illustration of a BICYCLE in true side profile view. "
      "Classic diamond frame clearly visible (two triangles). "
      "Two equal-size wheels, pedals and crank arm visible. "
      "Optional: rider silhouette astride the saddle. "
      "No text, clean flat design."
    )
  },

  "hikouki_airplane": {
    "label": "飛行機",
    "canonical_view": "真横（やや下からの見上げ角度）",
    "visual_signatures": [
      "翼の下のジェットエンジン（円筒形）",
      "尾翼（垂直尾翼 + 水平尾翼）",
      "雲を突き抜け右上（未来）へ上昇する軌跡アーク"
    ],
    "prompt_core": (
      "Flat vector illustration of an AIRPLANE in side view (slightly looking up from below). "
      "Jet engines visible under the wings (cylindrical nacelles). "
      "Vertical and horizontal tail fins clearly shown. "
      "A rising arc trajectory going toward upper right. "
      "No text, clean flat design."
    )
  },

  "fune_ship": {
    "label": "船",
    "canonical_view": "真横",
    "visual_signatures": ["水面の波", "煙突からの航跡煙", "船体の喫水線"],
    "prompt_core": (
      "Flat vector illustration of a SHIP in true side profile. "
      "Water waves beneath the hull. Smokestack with exhaust trail above. "
      "Waterline clearly visible on the hull. "
      "No text, clean flat design."
    )
  },

  ## 手段アフォーダンス（〜で行きます の格助詞を示す構図要素）
  "_affordance_note": (
    "各乗り物カードに「乗り込もうとしているアクション」を重畳することで"
    "「〜で行きます」の手段的意味をカードに埋め込む。"
    "具体的には: 乗り物のドアが開いた状態 + 人物シルエットが片足を乗せている瞬間。"
    "自転車の場合: 人物シルエットがサドルをまたいで漕ぎ出そうとする関節角度を持たせる。"
  ),
}


## ============================================================
## PART 16: FAMILY_FRAMES（テンプレートR：家族語彙）
## ============================================================
##
## Research③の結果。ウチ・ソトの二重体系を視覚化。
## ============================================================

FAMILY_FRAMES = {

  "_uchi_soto_principle": (
    "日本語の家族語彙はウチ（内輪）とソト（外向き）の二重体系を持つ。"
    "「父」と「お父さん」は同一の絵で兼用することは不可能。"
    "ウチ形: 実線暖色バブル内部に自己（Ego）と家族を配置。"
    "ソト形: Egoはバブル外の冷淡ゾーンに配置し、相手家族は点線バブル内の別エリアに。"
  ),

  ## ウチ形（自分の家族を謙遜して呼ぶ）
  "chichi_my_father": {
    "label": "父（ちち / 自分の父）",
    "form":  "uchi",
    "visual_strategy": {
      "key_elements": [
        "実線暖色バブル（オレンジ系半透明円）内部に、",
        "Egoシルエット（小・左）と父のシルエット（やや大・右）を配置。",
        "両者が微笑み合い、肩を寄せ合っている。",
        "バブル内部に小さなハートアイコン（親密さ）。",
        "父の外見: 30〜50代男性を想起させるアパレル（スーツorカジュアル）。"
      ],
      "prompt_core": (
        "Flat vector illustration. A warm solid-line circular bubble (uchi zone). "
        "Inside: small Ego silhouette on the LEFT and a middle-aged male figure (father) on the RIGHT, "
        "both smiling and leaning slightly toward each other. "
        "Small heart icon between them. "
        "Outside the bubble: plain white background. "
        "No text, clean flat design."
      )
    }
  },

  "haha_my_mother": {
    "label": "母（はは / 自分の母）",
    "form":  "uchi",
    "visual_strategy": {
      "prompt_core": (
        "Same uchi layout as 'chichi'. Inside warm bubble: "
        "Ego silhouette (small, left) and a middle-aged female figure (mother, right). "
        "Heart icon between them. Plain white outside. No text."
      )
    }
  },

  "ani_my_elder_brother": {
    "label": "兄（あに / 自分の兄）",
    "form":  "uchi",
    "visual_strategy": {
      "age_differentiation": [
        "身長比: 兄（1.0） vs Ego（0.75）の比率。",
        "兄のアパレル: スマートカジュアル（シャツ + パンツ）。",
        "兄のジェスチャー: EgoのEgoの頭や肩に優しく手を置く（保護者ポーズ）。"
      ],
      "prompt_core": (
        "Inside warm uchi bubble: a taller older brother figure (smart casual) "
        "gently placing a hand on the shoulder of a shorter younger sibling (Ego). "
        "1:0.75 height ratio clearly visible. No text."
      )
    }
  },

  "otouto_my_younger_brother": {
    "label": "弟（おとうと / 自分の弟）",
    "form":  "uchi",
    "visual_strategy": {
      "age_differentiation": [
        "Ego（1.0）vs 弟（0.75）。弟が小さい。",
        "弟のアパレル: Tシャツ・サロペット or 幼い頭身（頭部をやや丸く強調）。"
      ],
      "prompt_core": (
        "Inside warm uchi bubble: Ego (taller) with a shorter, younger-looking brother beside them. "
        "Younger brother in casual children's style clothing, rounder head shape. "
        "1:0.75 height ratio (Ego taller). No text."
      )
    }
  },

  ## ソト形（相手の家族・敬意を表す形）
  "otousan_your_father": {
    "label": "お父さん（相手の父への敬意）",
    "form":  "soto",
    "visual_strategy": {
      "key_elements": [
        "Egoシルエット: バブルの外側（冷淡グレーゾーン）。お辞儀ジェスチャー。",
        "相手の父: 右側の点線バブル内（ソトエリア）。",
        "EgoからSotoへ向かう敬意の矢印（丁寧なお辞儀ジェスチャーのベクトル）。"
      ],
      "prompt_core": (
        "Flat vector illustration. LEFT: Ego character OUTSIDE any bubble, "
        "in a respectful bow posture with an arrow pointing toward the right. "
        "RIGHT: A dashed-line circle (soto zone) containing a middle-aged male figure. "
        "Clear distance/space between the two zones. No text."
      )
    }
  },

  "okaasan_your_mother": {
    "label": "お母さん（相手の母への敬意）",
    "form":  "soto",
    "visual_strategy": {
      "prompt_core": (
        "Same soto layout. RIGHT dashed bubble: middle-aged female figure. "
        "LEFT: Ego in bow posture. No text."
      )
    }
  },
}


## ============================================================
## PART 17: WEATHER_FRAMES（テンプレートS：天気・自然現象）
## ============================================================
##
## Research③の結果。ISO国際気象記号基準 + 身体化認知反応。
## 「物質降下現象（名詞）」と「体感物理量（形容詞）」を分離。
## ============================================================

WEATHER_FRAMES = {

  "_base_principle": {
    "noun_weather_focus": "物質降下現象（雨・雪等）: 環境オブジェクトが主役。人物は背景スケールとして存在。",
    "adj_weather_focus":  "体感物理量（暑い・寒い）: キャラクターの生理的反応が主役。",
    "teimasu_integration": "〜ています（継続中）の動態性を各カードに埋め込む。"
  },

  "ame_rain": {
    "label": "雨（あめ）",
    "pos":   "noun",
    "visual_strategy": {
      "key_elements": [
        "密集した斜めのシアンラインが画面上部から降下。",
        "地面（水たまり）に衝突して広がる同心円状の波紋リップル（〜ています動態性）。",
        "オプション: 傘を差す人物シルエット（スケールとして）。"
      ],
      "prompt_core": (
        "Flat vector illustration of RAIN. "
        "Dense parallel diagonal cyan rain streaks falling from top to bottom. "
        "At the ground: multiple concentric ripple circles (water impact rings) in puddles. "
        "Optional: umbrella-holding silhouette in background as scale reference. "
        "White/light gray background, no text."
      )
    }
  },

  "kaze_wind": {
    "label": "風（かぜ）",
    "pos":   "noun",
    "visual_strategy": {
      "key_elements": [
        "平行な流線ベクター（ストリームライン）が左から右へ横断。",
        "背景の木が右側へ大きくしなっている（変形アフォーダンス）。",
        "ちぎれた葉が宙を舞っている（複数の動態的な葉アイコン）。"
      ],
      "prompt_core": (
        "Flat vector illustration of WIND. "
        "Parallel horizontal stream curves (wind lines) sweeping from left to right. "
        "A single tree on the left side bending sharply to the right. "
        "Scattered flying leaves (5-7 leaf icons) in the air moving rightward. "
        "White background, no text."
      )
    }
  },

  "yuki_snow": {
    "label": "雪（ゆき）",
    "pos":   "noun",
    "visual_strategy": {
      "key_elements": [
        "大小さまざまな白丸（雪粒）+ 結晶記号が降下。",
        "地面に積もっていく白いレイヤー（積雪）。",
        "オプション: コートを着た人物シルエット。"
      ],
      "prompt_core": (
        "Flat vector illustration of SNOW. "
        "Various sizes of white circles and 6-pointed snowflake icons falling from top. "
        "A white snow accumulation layer building up on the ground. "
        "Soft blue-gray background to enhance snow visibility. No text."
      )
    }
  },

  "taifuu_typhoon": {
    "label": "台風（たいふう）",
    "pos":   "noun",
    "visual_strategy": {
      "key_elements": [
        "巨大な渦巻き（らせん）アイコン + 大粒の雨と強風ライン。",
        "傘が裏返って壊れているオブジェクト（台風の激しさを示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration of a TYPHOON. "
        "Large spiral/swirl icon in the center (storm system). "
        "Heavy rain streaks and bold wind stream lines. "
        "A broken inside-out umbrella on the ground showing intensity. "
        "Dark dramatic sky background. No text."
      )
    }
  },

  "atsui_hot": {
    "label": "暑い（あつい / 気温が高い）",
    "pos":   "adjective",
    "visual_strategy": {
      "key_elements": [
        "歪んだ巨大な赤い太陽（画面上部）。",
        "キャラクターが顔を上気させ（頬に斜線）、片手で団扇を激しく煽る。",
        "額から大粒の汗が飛び散っている（水滴アイコン複数）。",
        "背景: 赤みがかった大気（薄いオレンジ半透明オーバーレイ）。"
      ],
      "prompt_core": (
        "Flat vector illustration of HOT weather (feeling hot). "
        "A large distorted red sun icon at the top. "
        "Person fanning themselves vigorously with a uchiwa fan, flushed cheeks (diagonal lines), "
        "sweat drops flying from forehead. "
        "Warm reddish-orange ambient overlay in background. No text."
      )
    }
  },

  "samui_cold": {
    "label": "寒い（さむい / 気温が低い）",
    "pos":   "adjective",
    "visual_strategy": {
      "key_elements": [
        "青白い寒色（シアン〜ライトパープル）の背景。",
        "キャラクターが体を極限まで縮こまらせ、両腕を交差させて抱きしめている。",
        "口元から白い息（ベクターウェーブ: 白い曲線2〜3本）が立ち上る。",
        "全身が微細に震えていることを示す二重アウトライン（ブレを示すゴーストライン）。"
      ],
      "prompt_core": (
        "Flat vector illustration of COLD weather (feeling cold). "
        "Blue-lavender cool background. "
        "Person hugging themselves tightly (arms crossed over chest), hunched posture. "
        "White breath vapor (2-3 wavy lines) from their mouth. "
        "Double outline silhouette showing shivering. No text."
      )
    }
  },

  "hare_sunny": {
    "label": "晴れ（はれ）",
    "pos":   "noun",
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration of SUNNY weather. "
        "A clear golden yellow sun icon with uniform rays. "
        "Light blue sky background. No clouds. Optional: person in short sleeves enjoying the sunshine. "
        "No text, clean flat design."
      )
    }
  },

  "kumori_cloudy": {
    "label": "曇り（くもり）",
    "pos":   "noun",
    "visual_strategy": {
      "prompt_core": (
        "Flat vector illustration of CLOUDY weather. "
        "Multiple overlapping gray cloud icons covering most of the frame. "
        "No sun visible. Light gray background. No text."
      )
    }
  },
}


## ============================================================
## PART 18: SENSORY_FRAMES（テンプレートT：感覚語彙）
## ============================================================
##
## Research③の結果。共感覚的転換（音・匂い・味→視覚）。
## 能動的知覚（見る・聞く）と受動的知覚（見える・聞こえる）の
## 認知的差別化が最重要。
## ============================================================

SENSORY_FRAMES = {

  "_base_principle": {
    "active_perception":   "「見ます・聞きます」: キャラクターが能動的に対象に向かう。視線ベクトルが主体側から発射。",
    "passive_perception":  "「見えます・聞こえます」: 対象からキャラクターへ信号が自然に届く。キャラクターは別のことに集中している。",
    "emission_model":      "「〜がします」: 対象物から感覚シグナルが自発的に放出・放射される構図。"
  },

  "oto_ga_shimasu": {
    "label": "〜音がします（音の自発的放出）",
    "visual_strategy": {
      "key_elements": [
        "音源（ピアノ・目覚まし等）を中央に配置。",
        "音源から: カラフルな音符（8分音符・ト音記号）と同心円状の音波弧線が放射。",
        "キャラクターは自然な表情（驚かない）。耳に向かって波が届いている。"
      ],
      "prompt_core": (
        "Flat vector illustration. CENTER: {SOUND_SOURCE} (e.g., piano, alarm clock). "
        "Colorful music notes and concentric sound wave arcs radiating outward from the source. "
        "Optional: a nearby person with a neutral expression, small sound wave icon at their ear. "
        "White background, no text."
      )
    }
  },

  "nioi_ga_shimasu": {
    "label": "〜においがします（匂いの自発的放出）",
    "visual_strategy": {
      "key_elements": [
        "香気源（焼きたてのパン・花等）を中央に。",
        "上部へ向かってゆるやかにうねる3本の半透明ピンク・グリーンの波線（香気ストリーム）。",
        "波線の周囲に小さなきらめき（星）とハートマーク。"
      ],
      "prompt_core": (
        "Flat vector illustration. CENTER: {SCENT_SOURCE} (e.g., fresh bread, flower). "
        "3 gently wavy semi-transparent pink/green lines rising upward (aroma streams). "
        "Small sparkle stars and heart icons floating around the aroma streams. "
        "White background, no text."
      )
    }
  },

  "aji_ga_shimasu": {
    "label": "〜味がします（味の自発的感覚）",
    "visual_strategy": {
      "key_elements": [
        "味覚源（ケーキ・キャンディ等）を一口かじった人物。",
        "頬をピンクに染め、目を星型またはハート型に変えた表情。",
        "舌の上またはロの周囲に小さなスパーク（味覚の弾け）。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person taking a bite of {FOOD_ITEM}. "
        "Flushed pink cheeks, star/heart-shaped eyes showing taste sensation. "
        "Small sparkle pops around the mouth/tongue area. "
        "White background, no text."
      )
    }
  },

  "miemasu_can_see": {
    "label": "見えます（受動的・自発的に目に入る）",
    "visual_strategy": {
      "key_elements": [
        "⚠️ 能動的な視線ではない。キャラクターは別の活動中（本を読む・歩く等）。",
        "視界（窓・ドア等）の向こうに対象（富士山・電車等）がある。",
        "対象からキャラクターの瞳へ向かって: 優しく半透明な「光波コーン」が自然に流れ込む。",
        "キャラクターの表情: 特別な意図なしのニュートラル。"
      ],
      "prompt_core": (
        "Flat vector illustration showing SPONTANEOUS/PASSIVE VISION. "
        "Person sitting or standing engaged in ANOTHER ACTIVITY (reading, walking). "
        "Through a window/opening in the background: {VISIBLE_OBJECT} (e.g., Mt. Fuji, train). "
        "Semi-transparent light cone lines flow PASSIVELY from {VISIBLE_OBJECT} "
        "INTO the person's eyes — the light comes TO them. "
        "Person's expression: neutral, not actively looking. White background, no text."
      ),
      "avoid": [
        "目を見開いて対象に向かって視線を放射する描写（見ます になる）",
        "能動的な前のめりのポーズ"
      ]
    }
  },

  "kikoemasu_can_hear": {
    "label": "聞こえます（受動的・自発的に耳に入る）",
    "visual_strategy": {
      "key_elements": [
        "⚠️ キャラクターは別の活動に集中中（本を読む・スマホを操作する等）。",
        "音源（窓の外の鳥・雷等）が画面端にある。",
        "音源から同心円状の音波が広がり、キャラクターの耳に自然に届く。",
        "耳の横で小さな音波マーク（スパーク）がパッと弾ける。"
      ],
      "prompt_core": (
        "Flat vector illustration showing SPONTANEOUS/PASSIVE HEARING. "
        "Person engaged in ANOTHER ACTIVITY (reading, phone) facing AWAY from the sound source. "
        "BACKGROUND: {SOUND_SOURCE} (bird outside window, thunder in distance). "
        "Concentric pastel-blue sound wave rings radiating FROM the source "
        "and landing at the person's ear. "
        "A tiny sparkle icon at the ear tip showing the moment of reception. "
        "White background, no text."
      ),
      "avoid": ["能動的に耳を傾けるポーズ（聞きます になる）"]
    }
  },

  "mimasu_actively_look": {
    "label": "見ます（能動的・意図的に見る）",
    "visual_strategy": {
      "key_elements": [
        "キャラクターが対象物に向けて顔と体を完全に向け、目を大きく見開いている。",
        "キャラクターの瞳から対象へ向かう「極太の黄色い光線ベクトル」（能動的視線）。",
        "前のめりの積極的な姿勢。"
      ],
      "prompt_core": (
        "Flat vector illustration showing ACTIVE/INTENTIONAL LOOKING. "
        "Person facing directly toward {VIEWED_OBJECT}, eyes wide open in focused attention. "
        "Bold yellow light-beam lines shoot FROM the person's eyes TO {VIEWED_OBJECT}. "
        "Forward-leaning posture showing intentional focus. "
        "White background, no text."
      )
    }
  },

  "kikimasu_actively_listen": {
    "label": "聞きます（能動的・意図的に聞く）",
    "visual_strategy": {
      "key_elements": [
        "キャラクターが音源に向けて首をかしげ、耳の後ろに手を添える（能動的傾聴姿勢）。",
        "音源から耳へ向かって「吸い込まれるように直行する太い矢印」（能動的受信）。"
      ],
      "prompt_core": (
        "Flat vector illustration showing ACTIVE/INTENTIONAL LISTENING. "
        "Person turning their head toward {SOUND_SOURCE}, hand cupped behind ear. "
        "A bold direct arrow from {SOUND_SOURCE} to the person's ear (active reception). "
        "White background, no text."
      )
    }
  },
}


## ============================================================
## PART 20: QA_CHECKLIST_v2_6（更新版チェックリスト）
## ============================================================

QA_CHECKLIST_v2_6 = {

  ## 既存の vocab_type_check に追加するチェック項目
  "new_vocab_type_checks": {

    "pronoun": [
      "人称（1・2・3）に応じたアクター数（1名/2名/3名）が正しいか",
      "疑問代名詞（だれ・なに・どこ・いつ）は対象を破線シルエット+？で描いているか",
      "指示語（こそあど: テンプレートG）と混同していないか"
    ],

    "interjection": [
      "文化的ジェスチャー単体に依存せず、発話バブル内のISO記号（✓/✗）を使用しているか",
      "はい: 緑チェックマーク / いいえ: 赤バツマーク のコード一貫性",
      "感情形容詞（嬉しい・怒る）のテンプレートJと混同していないか"
    ],

    "set_expression": [
      "場面の三要素（物理的環境・アクター同士の立ち位置・行為コンテキスト）がすべて描かれているか",
      "いただきます vs ごちそうさま: 皿の中身（満杯 vs 空）で区別できているか",
      "おじゃまします: 扉の「外→内」への移行方向が明確か"
    ],

    "adverb": [
      "4分類（程度・頻度・様態・時制）のどれかを正しく使用しているか",
      "程度副詞: 評価バーが描かれているか（なし → 程度の強さが消える）",
      "頻度副詞: カレンダーグリッドのマス数が正しく反映されているか",
      "アンカー物体（修飾対象）が必ず存在しているか（副詞単独では意味が完結しない）"
    ],

    "counter": [
      "物体カテゴリと助数詞の対応が正しいか（例：本の花瓶を「〜枚」で数えていないか）",
      "数量バッジ（[アイコン × N]）が配置されているか",
      "同一カテゴリの物体を一列/グリッドで並べているか"
    ],

    "time": [
      "時刻カード: 時計盤を不透明度70%でグレーアウトしているか（物体の語彙カードでないことを示す）",
      "曜日カード: 7連プログレスバー + 自然元素ピクトグラムを使用しているか（テキスト不可）",
      "相対時間（今日・来週等）: タイムライン or グリッドと方向矢印が描かれているか",
      "季節: 4分割ホイール構造になっているか"
    ],

    "transportation": [
      "電車: パンタグラフ + 架線 + バラストのトリプル識別シグネチャーがあるか",
      "新幹線: 架線なし + コンクリート高架 + ロングノーズの識別シグネチャーがあるか",
      "地下鉄: トンネルアーク（暗い円形断面）+ 架線なし + 暗い背景があるか",
      "タクシー: あんどん（ルーフ表示灯）+ チェッカー模様があるか",
      "手段アフォーダンス: 「乗り込もうとしている」アクションが埋め込まれているか"
    ],

    "family": [
      "ウチ形（父・母・兄等）: 実線暖色バブル内に Ego と家族が両方いるか",
      "ソト形（お父さん・お母さん等）: Egoがバブル外のグレーゾーンにいるか",
      "兄/弟 の区別: 1:0.75 の身長比 + アパレル差が描かれているか",
      "「お父さん」と「父」を同一絵で兼用していないか（それぞれ別テンプレートが必須）"
    ],

    "weather": [
      "名詞天気（雨・雪等）: 環境オブジェクトが主役で人物はスケールとして背景にあるか",
      "体感形容詞（暑い・寒い）: キャラクターの生理的反応（汗・震え）が主役か",
      "「〜ています」の動態性: 波紋・しなり・ストリームラインが含まれているか"
    ],

    "sensory": [
      "見えます/聞こえます: キャラクターが別の活動に集中中で、信号が対象→人物へ自然に届いているか",
      "見ます/聞きます: 人物から対象へ能動的な光線ベクトル/矢印が描かれているか",
      "「〜がします」: 対象物から感覚シグナルが放射・放出される構図になっているか",
      "見えます vs 見ます の描き分けが1秒で判別できるか（Glanceability テスト）"
    ],
  },

  ## テンプレートC'（例文画像）専用チェック
  "example_sentence_c_prime_checks": [
    "grammarConcept の値が GRAMMAR_PATTERNS_C のキーと一致しているか",
    "HARD_LIMIT フラグが True の文型に対して RESCUE_LAYOUT（2コマ/3コマ）を使用しているか",
    "UNIFIED_CHAR_SYSTEM が必要な文型（uses_unified_char: True）で "
    "Ego=テイルブルー/左 / Soto=オレンジ/右 の配置になっているか",
    "授受表現（あげます・もらいます・くれます）で矢印の方向・色が正しいか",
    "思考バブル（雲形）と発話バブル（楕円+テール）を混同していないか",
    "否定バリア（〜ません）とISO禁止記号（〜てはいけません）を混同していないか",
    "条件文（〜たら: 直進2コマ）と（〜ば: Y型分岐）を混同していないか",
    "進行（〜ています: モーション残像）と結果状態（〜ています: 完了後の対象物）を"
    "描き分けられているか"
  ],
}


## ============================================================
## PART 21: HOW_TO_USE_v2_6（vocab_type → テンプレート 完全版）
## ============================================================

HOW_TO_USE_v2_6 = {

  "vocab_type_to_template": {
    ## v2.5 から継続（変更なし）
    "person":           "A  (vocabulary_person)            ← v2.5",
    "building":         "B  (vocabulary_building)          ← v2.5",
    "example_sentence": "C' (grammar_pattern_based)        ← v2.6 更新: grammarConcept で判定",
    "concrete_object":  "D  (vocabulary_object_concrete)   ← v2.5",
    "variant_grid":     "E  (vocabulary_variant_grid)      ← v2.5",
    "spatial_relation": "F  (spatial_relation)             ← v2.5",
    "demonstrative":    "G  (demonstrative_kosoado)        ← v2.5",
    "action_verb":      "H  (action_verb)                  ← v2.5",
    "abstract_concept": "I  (abstract_concept)             ← v2.5",
    "adjective":        "J  (vocabulary_adjective)         ← v2.5",
    ## v2.6 新規
    "pronoun":          "K  (PRONOUN_FRAMES)               ← v2.6 NEW",
    "interjection":     "L  (INTERJECTION_FRAMES)          ← v2.6 NEW",
    "set_expression":   "M  (SET_EXPR_FRAMES)              ← v2.6 NEW",
    "adverb":           "N  (ADVERB_FRAMES)                ← v2.6 NEW",
    "counter":          "O  (COUNTER_FRAMES)               ← v2.6 NEW",
    "time":             "P  (TIME_FRAMES)                  ← v2.6 NEW",
    "transportation":   "Q  (TRANSPORT_FRAMES)             ← v2.6 NEW",
    "family":           "R  (FAMILY_FRAMES)                ← v2.6 NEW",
    "weather":          "S  (WEATHER_FRAMES)               ← v2.6 NEW",
    "sensory":          "T  (SENSORY_FRAMES)               ← v2.6 NEW",
  },

  "gas_switch_case_extension": """
// generateImages.gs の buildImagePrompt_ 関数に追加する switch-case 拡張仕様
// 既存の case "person":, case "building": 等はそのまま維持。
// 以下を追加する:

    case "pronoun":
      return buildPronounPrompt_(row.word, row.en);

    case "interjection":
      return buildInterjectionPrompt_(row.word, row.en);

    case "set_expression":
      return buildSetExpressionPrompt_(row.word, row.en);

    case "adverb":
      return buildAdverbPrompt_(row.word, row.en, row.adverbType);

    case "counter":
      return buildCounterPrompt_(row.word, row.en);

    case "time":
      return buildTimePrompt_(row.word, row.en, row.timeSubtype);

    case "transportation":
      return buildTransportPrompt_(row.word, row.en);

    case "family":
      return buildFamilyPrompt_(row.word, row.en, row.familyForm);
      // row.familyForm = "uchi" | "soto"

    case "weather":
      return buildWeatherPrompt_(row.word, row.en, row.pos);

    case "sensory":
      return buildSensoryPrompt_(row.word, row.en, row.perceptionType);
      // row.perceptionType = "active" | "passive" | "emission"

// テンプレートC' の修正（example_sentence 用）:
    case "example_sentence":
      return buildExampleSentencePrompt_(row);
      // 内部で row.grammarConcept → GRAMMAR_PATTERNS_C のキーを参照
  """,

  "spreadsheet_new_columns": {
    "description": "Vocabulary シートに以下の補助列を追加することを推奨",
    "new_columns": {
      "familyForm":     "uchi | soto （family type のみ）",
      "perceptionType": "active | passive | emission （sensory type のみ）",
      "adverbType":     "degree | frequency | manner | temporal （adverb type のみ）",
      "timeSubtype":    "clock | weekday | month | season | relative | timeofday",
      "grammarConcept": "（既存フィールド）example_sentence の文法パターン識別に使用"
    },
    "note": (
      "これらは vocab_type を細分化するサブ分類フィールド。"
      "既存の classifyAndTranslate.gs に自動分類ロジックを追加、"
      "または手動で入力する。"
    )
  },

  "priority_for_implementation": [
    "① テンプレートC'（GRAMMAR_PATTERNS_C）: 毎課必ず生成されるため最高優先。",
    "   L1〜L5 の基本文型から実装開始し、lesson_01/02 の例文画像品質を即座に改善。",
    "② テンプレートR（family）: lesson_10 以降で必須。ウチ・ソトの二重体系。",
    "③ テンプレートK（pronoun）: lesson_01 の「わたし・あなた」から必要。",
    "④ テンプレートL（interjection）: lesson_01 の「はい・いいえ」から必要。",
    "⑤ テンプレートQ（transportation）: lesson_05 以降で必要。",
    "⑥ テンプレートP（time）: lesson_03 以降で必要。",
    "⑦ テンプレートS（weather）: lesson_12 以降で必要。",
    "⑧ テンプレートN（adverb）: 各課で出現。",
    "⑨ テンプレートM（set_expression）: lesson_01 から出現。",
    "⑩ テンプレートT（sensory）: lesson_19 以降で必要（最後回しでOK）。",
    "⑪ テンプレートO（counter）: lesson_11 以降で必要。",
  ]
}


## ============================================================
## §3. CORRECTIONS — 修正・追加エントリ（v2.6.1）
## 元ファイル: master_prompt_design_guide_v2_6_corrections.py
## 優先度: §2 CORE より高い（同名エントリは §3 が有効）
## ============================================================

## ============================================================
## [修正①] カラーシステムの適用範囲を明確化
## 矛盾：STYLE_BIBLE（語彙カード色）vs UNIFIED_CHAR_SYSTEM（例文カード色）
## ============================================================

COLOR_SYSTEM_RULES = {

  "scope_definition": {
    "STYLE_BIBLE_applies_to": [
      "vocab_type: person, building, concrete_object, variant_grid,",
      "spatial_relation, demonstrative, action_verb, abstract_concept, adjective",
      "→ すべての「語彙カード」画像（登場人物が1名、または人物なし）",
    ],
    "UNIFIED_CHAR_SYSTEM_applies_to": [
      "vocab_type: example_sentence（テンプレートC'）",
      "vocab_type: pronoun, interjection, set_expression",
      "→ 2名以上のキャラクターが登場するすべての画像",
      "→ 文法信号記号（矢印・バリア・モダリティ記号）を含むすべての画像",
    ],
    "key_rule": (
      "STYLE_BIBLE と UNIFIED_CHAR_SYSTEM は排他的。"
      "同一の画像に両方を適用しない。"
      "vocab_type が example_sentence の場合は必ず UNIFIED_CHAR_SYSTEM を使用。"
    )
  },

  ## ゴールドカラーの統一（矛盾⑤の解決）
  "gold_color_standard": {
    "vocabulary_card_accent":    "Warm Amber Gold #FAD141 (STYLE_BIBLE準拠)",
    "grammar_highlight_winner":  "Pure Gold #FFD700 (UNIFIED_CHAR_SYSTEM専用)",
    "usage_rule": (
      "#FAD141: 語彙カード（人物・物体・建物等）のアクセント色のみ。"
      "#FFD700: 例文カード内の「勝者・最高値・記憶スタンプ・今日・ハイライト月」に統一。"
      "語彙カードに #FFD700 を使わない。例文カードに #FAD141 を使わない。"
    )
  },

  ## 否定パターンの赤の使い分け（矛盾③の解決）
  "red_color_distinction": {
    "negation_masen_red": {
      "color":   "Dusky Translucent Red, similar to #CC3333, hex value CC3333, OPACITY 50%",
      "shape":   "Semi-transparent tilted shield/plate",
      "meaning": "個人の意志による否定（〜ません）",
      "rule":    "半透明であること。全面を覆わず、人物と対象の間にのみ配置。"
    },
    "prohibition_red": {
      "color":   "ISO Red, similar to #D81E05, hex value D81E05, OPACITY 100%",
      "shape":   "Solid circle with diagonal slash (ISO prohibition sign)",
      "meaning": "外部ルール・社会規範による禁止（〜てはいけません）",
      "rule":    "完全不透明であること。ISO規格の円形＋斜線の形状を厳守。"
    },
    "social_constraint_red": {
      "color":   "Warm Red #E05C2A at 70% opacity",
      "shape":   "Social pressure indicator (hand from society/clock pulling back)",
      "meaning": "社会的規範による行動抑止（〜わけにはいかない）",
      "rule":    "物理的バリアではなく、背後からの引力として描く。"
    },
    "summary": (
      "3種類の「否定的意味」は色の不透明度・形状・位置で必ず区別する。"
      "  〜ません: 半透明シールド（個人意志）"
      "  〜てはいけません: 100%不透明ISO円（外部ルール）"
      "  〜わけにはいかない: 背後からの引力（社会的抑止）"
    )
  }
}


## ============================================================
## [修正②] 〜ています の3サブパターンの grammarConcept ID を分離
## 矛盾：同一キーで3つの異なる視覚戦略
## ============================================================

TEIMASU_DISAMBIGUATION = {

  "grammarConcept_ids": {
    "progressive_ongoing":      "teimasu_progressive",
    "resultant_state":          "teimasu_resultant_state",
    "habitual_occupation":      "teimasu_habitual",
  },

  "decision_flowchart": """
  例文を受け取ったとき:
    動作主（人物）が動作の途中にいるか？
      YES → teimasu_progressive（進行中）
        例：「本を読んでいます」「走っています」
    動作は終わって、その結果の状態が続いているか？
      YES → teimasu_resultant_state（結果状態）
        例：「窓が開いています」「結婚しています」「着ています」
    長期的な職業・居住・習慣を表しているか？
      YES → teimasu_habitual（習慣・恒常状態）
        例：「東京に住んでいます」「学校で教えています」「毎日運動しています」
  """,

  "gas_implementation": """
  // lesson_NN.json の grammarConcept に以下の値を使用する:
  // "teimasu_progressive"      → GRAMMAR_PATTERNS_C["progressive_teimasu"]
  // "teimasu_resultant_state"  → GRAMMAR_PATTERNS_C["progressive_state_teimasu"]
  // "teimasu_habitual"         → GRAMMAR_PATTERNS_C["habitual_teimasu"]
  //
  // buildExampleSentencePrompt_() 内のマッピング:
  const TEIMASU_MAP = {
    "teimasu_progressive":     buildProgressivePrompt_,
    "teimasu_resultant_state": buildResultantStatePrompt_,
    "teimasu_habitual":        buildHabitualPrompt_,
  };
  """
}


## ============================================================
## [追加①] GRAMMAR_PATTERNS_C の欠落エントリ（5件）
## ============================================================

## 以下を GRAMMAR_PATTERNS_C に追加する

GRAMMAR_PATTERNS_C_ADDITIONS = {

  ## ─── 1. 〜でしょう（推量・確信度70%） ───
  "inference_deshoo": {
    "label":   "〜でしょう（推量・客観的観測に基づく推定）",
    "schema":  "認識的モダリティ：確信度60〜70%",
    "visual_strategy": {
      "key_elements": [
        "発話バブル: 楕円形・細い連続実線（かもしれません の破線より実線に近い）。",
        "バブル内部: 「？」と「！」のハイブリッドマーク（疑問と確信の中間）。",
        "確信度メーター: 60〜70%を指すソリッドなシアン色のスケール。",
        "バブルの位置: やや上方（天気図・グラフ等の客観的根拠オブジェクトと接続）。",
        "ニュース・天気予報的コンテキスト: 小さな天気図や棒グラフアイコンを背景右端に配置。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in a thinking/observing posture. "
        "A speech bubble (smooth ellipse, thin SOLID border — more certain than dashed) "
        "containing a hybrid '?!' combined icon. "
        "Corner: certainty meter pointing to 60-70% in solid cyan. "
        "Background right: a tiny weather chart or graph icon representing objective evidence. "
        "The bubble is positioned slightly upward-floating, connected to observation data. "
        "White background, no text."
      ),
      "certainty_scale_note": (
        "確信度スケール（フラットデザイン用）:"
        "  [かもしれません] 20-40% → 粗い点線バブル + グレーメーター"
        "  [でしょう]       60-70% → 細い実線バブル + シアンメーター ← ここ"
        "  [と思います]     80-90% → 太い実線バブル + 高コントラストメーター"
      ),
      "avoid": [
        "かもしれません の破線バブルを使わない（確信度の差が消える）",
        "と思います の雲形バブルを使わない（思考 vs 推量の区別が消える）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  ## ─── 2. 〜なら（文脈逆引き型条件） ───
  "condition_nara": {
    "label":   "〜なら（対話相手の情報を前提とした条件・助言）",
    "schema":  "文脈依存型条件：相手の発話内容を受けて条件を提示する",
    "visual_strategy": {
      "layout":  "Context-reversal layout: Soto's statement → Ego's conditional advice",
      "key_elements": [
        "中央に大きな「テーマボード（相手のセリフや状況）」を配置。",
        "  例：「これから京都へ行きます」→ 京都の名所ミニアイコン群を提示したボードカード。",
        "左側のEgo: ボードを指差し、そこから「なら→推奨案」の矢印を出すジェスチャー。",
        "右側のSoto: テーマボードを差し出している（話者・情報提供者）。",
        "ボードを「矢印で包み込む」: Egoがボードの情報を受けて助言するインタラクション構図。",
        "Soの発話バブル（楕円）→ボード→Egoの推奨矢印の三段階フロー。"
      ],
      "prompt_core": (
        "Flat vector illustration using UNIFIED CHARACTER SYSTEM. "
        "RIGHT: Soto character (orange shirt) presenting a large THEME BOARD card "
        "showing {SOTO_SITUATION_ICON} (e.g., Kyoto landmark icons = 'I'm going to Kyoto'). "
        "CENTER: The large theme board as a visual pivot. "
        "LEFT: Ego character (teal blue shirt) pointing TO the theme board "
        "and from it issuing a bold recommendation arrow toward {RECOMMENDED_ACTION}. "
        "A dotted circular arrow from Soto's board to Ego's advice showing context reversal. "
        "White background, no text."
      ),
      "avoid": [
        "〜たら の直進2コマレイアウトを使わない（文脈逆引き型ではなくなる）",
        "〜ば のY型分岐ゲートを使わない（論理条件ではなく文脈依存のため）"
      ]
    },
    "uses_unified_char": True,
    "hard_limit": False
  },

  ## ─── 3. 〜わけにはいかない（HARD_LIMIT：社会的規範による行動抑止） ───
  "social_constraint_wakeni": {
    "label":   "〜わけにはいかない（社会的規範・義務感による行動抑止）",
    "schema":  "心理的葛藤：行動したいが社会規範が内的に抑止する（物理的可能だが心理的不可）",
    "hard_limit": True,
    "rescue_layout": "意志ベクトル + 社会的引力の拮抗構図",
    "visual_strategy": {
      "key_elements": [
        "キャラクター: 強い前傾姿勢（右へ進もうとしている「意志ベクトル」を体全体で表現）。",
        "背後の社会的引力: キャラクターの背後から引き戻す「社会的な目・ルールボード・時計」。",
        "  → 会社ビルのシルエット・巨大な壁時計・「RULE」を象徴する旗。",
        "引き戻しベクター: 背後のアイコンからキャラクターの肩・腰へ向かう暖色の引き戻し線。",
        "物理的バリアはなし（〜てはいけません とは異なる）。",
        "拮抗感: キャラクターの体が前方向に傾きつつも足が地面に固定されている構図。"
      ],
      "prompt_core": (
        "Flat vector illustration. HARD LIMIT — USE 2-ELEMENT CONFLICT LAYOUT. "
        "Person leaning strongly FORWARD (right direction) showing strong personal will vector. "
        "But BEHIND them: large social constraint icons (company building, wall clock, rule flag) "
        "sending warm-colored pull-back lines to the person's shoulders, holding them back. "
        "NO physical barrier in front of the person (unlike prohibition). "
        "The conflict tension: forward-leaning body but feet fixed, showing internal constraint. "
        "Color: constraint lines in Warm Red #E05C2A at 70% opacity. "
        "White background, no text."
      ),
      "avoid": [
        "物理的なバリアや禁止円（〜てはいけません と混同される）",
        "単なる否定ポーズ（腕組みなど）—社会的引力の視覚化がないと意味が消える"
      ]
    },
    "uses_unified_char": False
  },

  ## ─── 4. 〜の〜（所有関係）NはNのNです ───
  "noun_no_possession": {
    "label":   "〜の〜（所有関係 / AのB）",
    "schema":  "所有・帰属：AがBを所持・所有している状態の明示",
    "visual_strategy": {
      "key_elements": [
        "所有者（A）と所有物（B）を同一フレームに配置。",
        "所有者の手元または身体に所有物を「接続」するアイコン:",
        "  → 所有者の輪郭から所有物へ向かう細い実線（所有の弧線）。",
        "  → または所有物に「A's」を示すタグアイコン（テキスト不可・シルエットのみ）。",
        "〜の〜（所属）との違い: 所属は組織・場所への帰属。所有は物体への権利。",
        "  → 所属: 建物アイコン + 接続弧線",
        "  → 所有: 物体アイコン + 手元への接続弧線"
      ],
      "prompt_core": (
        "Flat vector illustration. LEFT: {OWNER_PERSON} silhouette. "
        "RIGHT: {OWNED_OBJECT} drawn in vivid color. "
        "A thin curved arc connects FROM the owner TO the object, showing possession. "
        "The object has a small tag/label icon (no text) suggesting 'this belongs to owner'. "
        "White background, no text."
      ),
      "avoid": [
        "所属テンプレート（noun_no_affiliation）と混同しない",
        "所有者が物を手に持っているだけ（動詞「持つ」と区別がつかない）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },

  ## ─── 5. どれ・どの+N（疑問詞：選択） ───
  "interrogative_which": {
    "label":   "どれ・どの+N（選択肢の中からの疑問）",
    "schema":  "未決定の選択：複数の選択肢の中から1つを問う",
    "visual_strategy": {
      "key_elements": [
        "3〜4個の選択肢オブジェクトを横一列に並べる。",
        "各オブジェクトに破線のサークル枠（選択可能性を示す）。",
        "中央上部に大きな「？」マーク（下向き矢印で選択肢群を指している）。",
        "話者: 選択肢を指さして迷っているジェスチャー（顎に手を当てる・首を傾ける）。",
        "どれ: オブジェクト単体を指す。どの+N: 同カテゴリの複数バリアントを並べる。"
      ],
      "prompt_core": (
        "Flat vector illustration. 3-4 {OBJECT_TYPE}s in a row, each inside a dashed selection circle. "
        "Above them: a large '?' with a downward arrow pointing to the choices. "
        "LEFT: person in a pondering gesture (chin-on-hand or head tilted) looking at the options. "
        "All objects in the same color/style — none is highlighted yet (the choice is unknown). "
        "White background, no text."
      ),
      "avoid": [
        "1つだけ強調してしまう（どれかがすでに選ばれたように見える）",
        "だれ（人物の疑問代名詞）と混同しない（こちらは物体の選択）"
      ]
    },
    "uses_unified_char": False,
    "hard_limit": False
  },
}


## ============================================================
## [追加②] FAMILY_FRAMES の欠落エントリ（3件：姉・妹・分岐）
## ============================================================

FAMILY_FRAMES_ADDITIONS = {

  "ane_my_elder_sister": {
    "label": "姉（あね / 自分の姉）",
    "form":  "uchi",
    "visual_strategy": {
      "age_differentiation": [
        "身長比: 姉（1.0）vs Ego（0.75）の比率。",
        "姉のアパレル: スマートカジュアル（ブラウス + スカートまたはパンツ）。",
        "姉のジェスチャー: Ego の頭や肩に優しく手を置く（保護者ポーズ）。",
        "兄との区別: 姉はロングヘアまたはポニーテール等の性別的アウトラインを持つ。"
      ],
      "prompt_core": (
        "Inside warm uchi bubble: a taller older FEMALE figure (smart casual blouse/skirt, "
        "longer hairstyle to distinguish from male 'ani') "
        "gently placing a hand on the shoulder of shorter Ego. "
        "1:0.75 height ratio clearly visible. No text."
      )
    }
  },

  "ane_soto": {
    "label": "お姉さん（相手の姉への敬意）",
    "form":  "soto",
    "visual_strategy": {
      "prompt_core": (
        "Same soto layout. LEFT: Ego OUTSIDE bubble in respectful bow. "
        "RIGHT dashed bubble: taller female figure (older sister of Soto). "
        "Ego's bow arrow directed toward the dashed bubble. No text."
      )
    }
  },

  "imouto_my_younger_sister": {
    "label": "妹（いもうと / 自分の妹）",
    "form":  "uchi",
    "visual_strategy": {
      "age_differentiation": [
        "Ego（1.0）vs 妹（0.75）。妹が小さい。",
        "妹のアパレル: 幼い記号（Tシャツ・サロペット・丸みのある頭身）。",
        "弟との区別: 妹は女性的なヘアスタイル（おさげ・リボン等のアウトライン）。"
      ],
      "prompt_core": (
        "Inside warm uchi bubble: Ego (taller) with a shorter, younger FEMALE character beside them. "
        "Younger sister in cute/child-style clothing, feminine hairstyle hint (pigtails/ribbon outline), "
        "rounder head shape. 1:0.75 height ratio (Ego taller). No text."
      )
    }
  },
}


## ============================================================
## [追加③] ADVERB_FRAMES の欠落エントリ（8件）
## ============================================================

ADVERB_FRAMES_ADDITIONS = {

  ## ─── 程度副詞 ───

  "motto_more": {
    "label": "もっと（more / 現在値からさらに上へ）",
    "adverb_type": "degree",
    "visual_strategy": {
      "key_elements": [
        "評価バー: 現在の位置（例：50%）を示す針。",
        "針の真上から伸びる「上向きのシブロン記号（>）または太い上矢印」。",
        "「現在値より上」を示す明確な方向性が必要。",
        "アンカー物体: 現在の状態（例：温度が高い）が示されている状態から「もっと」を追加。"
      ],
      "prompt_core": (
        "Flat vector illustration. {ANCHOR_OBJECT} currently at a MID-LEVEL state. "
        "Degree meter at 50-60%. "
        "From the current needle position: a bold UPWARD CHEVRON (》) or thick upward arrow "
        "pushing beyond the current value, indicating 'even more'. "
        "White background, no text."
      )
    }
  },

  ## ─── 頻度副詞 ───

  "tamani_rarely": {
    "label": "たまに（rarely / 1〜2回程度）",
    "adverb_type": "frequency",
    "visual_strategy": {
      "key_elements": [
        "7マスのカレンダーグリッド。1マスのみにアイコン（ランダムに1つ）。",
        "6マスは空白（薄いグレー）。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid. "
        "Only 1 randomly placed cell contains the activity icon. "
        "6 cells are empty light gray. White background, no text."
      )
    }
  },

  "amari_frequency": {
    "label": "あまり〜ない（not much / 頻度文脈：ほとんどしない）",
    "adverb_type": "frequency",
    "disambiguation_note": (
      "⚠️ あまり〜ない の2つの文脈を区別すること:"
      "  度合い文脈（あまり辛くない）→ ADVERB_FRAMES['amari_nai']（評価バー20-30%）"
      "  頻度文脈（あまり行かない）   → この adverb_type='frequency' エントリ"
    ),
    "visual_strategy": {
      "key_elements": [
        "7マスのカレンダーグリッド。1マスにアイコン + 否定記号（✗）で1マス強調。",
        "5〜6マスは空白。",
        "度合い版との区別: カレンダーグリッドを使うこと（バーメーターは使わない）。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid. "
        "Only 1 cell has the activity icon (showing infrequency). "
        "A small ✗ or low-opacity overlay on that cell emphasizes the 'not much' aspect. "
        "5-6 cells are empty gray. White background, no text."
      )
    }
  },

  "zenzen_frequency": {
    "label": "ぜんぜん〜ない（not at all / 頻度文脈：全くしない）",
    "adverb_type": "frequency",
    "disambiguation_note": (
      "⚠️ ぜんぜん〜ない の2つの文脈を区別すること:"
      "  度合い文脈（ぜんぜん辛くない）→ ADVERB_FRAMES['zenzen_nai']（評価バー0% + 赤✗）"
      "  頻度文脈（ぜんぜん行かない）   → この adverb_type='frequency' エントリ"
    ),
    "visual_strategy": {
      "key_elements": [
        "7マスすべてが空白（薄いグレー）。",
        "グリッド全体に赤い✗マークを1つ重ねる（「一度もない」を示す）。"
      ],
      "prompt_core": (
        "Flat vector illustration. 7-cell calendar grid. "
        "ALL 7 cells are empty gray. "
        "A single red ✗ badge overlaid on the entire grid (not on individual cells). "
        "White background, no text."
      )
    }
  },

  ## ─── 時制副詞 ───

  "korekara_from_now": {
    "label": "これから（from now on / 今後・未来への推進）",
    "adverb_type": "temporal",
    "visual_strategy": {
      "key_elements": [
        "タイムライン。今▼マーカーの直上から右（未来方向）へ向かう太い推進矢印。",
        "人物のポーズ: 前向き・出発準備（コートを羽織る・鞄を持つ）姿勢。"
      ],
      "prompt_core": (
        "Flat vector illustration. Timeline from left (past) to right (future). "
        "A bold forward-pointing arrow starts FROM the 'now' marker going RIGHTWARD into the future. "
        "Person in a departing/starting posture (putting on coat, holding bag). "
        "White background, no text."
      )
    }
  },

  "sakki_a_while_ago": {
    "label": "さっき（a short while ago / 直近の過去）",
    "adverb_type": "temporal",
    "visual_strategy": {
      "key_elements": [
        "タイムライン。今▼マーカーのすぐ左隣（直近）にアイコンを配置。",
        "「今▼」から直近アイコンへの短い左向き矢印（直近の経過を示す）。",
        "もう（already）との違い: さっき は矢印が短い（直近）、もう は完了チェックを強調。"
      ],
      "prompt_core": (
        "Flat vector illustration. Timeline from left (past) to right (future). "
        "An activity icon placed IMMEDIATELY LEFT of the 'now' marker — very close, showing recency. "
        "A short leftward arrow from 'now' to the icon with a tiny clock indicating minimal elapsed time. "
        "No checkmark (contrast with 'mou' which emphasizes completion). "
        "White background, no text."
      )
    }
  },

  ## ─── 様態副詞 ───

  "shizuka_ni_quietly": {
    "label": "静かに（quietly / 音を立てない様態）",
    "adverb_type": "manner",
    "visual_strategy": {
      "key_elements": [
        "人差し指を唇に当てる「Shh」ジェスチャー（国際的な静粛サイン）。",
        "動作する人物: ゆっくりとした動きの軌跡線（少ない・薄い）。",
        "音源から出る波線に「消音マーク（スラッシュ付きのスピーカーアイコン）」。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person performing {QUIET_ACTION} "
        "with a 'Shh' gesture (index finger to lips). "
        "A crossed-out speaker icon near any sound source, showing silence. "
        "Only 1-2 thin, sparse motion trail lines. White background, no text."
      )
    }
  },

  "nigiyaka_ni_noisily": {
    "label": "にぎやかに（noisily / 活気があって騒がしい様態）",
    "adverb_type": "manner",
    "visual_strategy": {
      "key_elements": [
        "スピーカーアイコンから飛び出すカラフルな音符（複数色・複数サイズ）。",
        "笑い声を示す複数のアスタリスク記号（★・☆）が飛び散る。",
        "人物のポーズ: 両腕を広げた活発なジェスチャー。"
      ],
      "prompt_core": (
        "Flat vector illustration. Person in an energetic open-arms gesture. "
        "Colorful music notes (multiple colors and sizes) bursting from a speaker icon. "
        "Multiple star/asterisk sparks flying outward suggesting lively noise. "
        "White background, no text."
      )
    }
  },
}


## ============================================================
## [追加④] COUNTER_FRAMES のサビタイジング原則を各 prompt_core に追加
## ============================================================

COUNTER_SUBITIZING_PRINCIPLE = {
  "rule": (
    "全助数詞の prompt_core に以下のフレーズを必ず追加すること:"
    "'Arrange exactly 3 (or 4) objects with NO OVERLAP, "
    "evenly spaced in a grid or isometric layout (subitizing-optimized). "
    "No object should obscure another.'"
  ),
  "golden_number": "3または4個（4以下で瞬間数把握が可能）",
  "forbidden": "オクルージョン（重なり）・ファン状の重ね・ランダム配置",
  "alignment_by_type": {
    "hon_long_thin": "45度の等間隔斜め並置（3本の鉛筆を平行に）",
    "mai_flat":      "完全独立した等間隔グリッド並置（カードを重ねない）",
    "satsu_bound":   "縦置きアライメント（本の背表紙が見える横一列）",
    "hiki_small":    "全個体が同方向を向いた等間隔一列（3匹の猫が左向き）",
    "tou_large":     "アイソメトリック投影法での等間隔配置（スケール感を保つ）",
    "dai_machine":   "パーキング風アライメント（全台が同方向を向く）",
    "ko_small":      "逆三角形または2×2グリッド配置"
  },

  ## 各 counter の prompt_core 末尾に追加する標準フレーズ
  "injection_phrase": (
    "Arrange exactly 3 {OBJECT}s with NO OVERLAP, perfectly separated, "
    "evenly spaced using {ALIGNMENT_TYPE} layout. "
    "Subitizing-optimized: viewer can count at a glance. "
    "No object touches or overlaps another."
  )
}


## ============================================================
## [追加⑤] SET_EXPR_FRAMES のカメラアングル仕様を補完
## ============================================================

SET_EXPR_CAMERA_ANGLES = {
  "ohayou_gozaimasu":       "対面アイレベル（15度お辞儀 + 朝日窓）",
  "itadakimasu":            "俯瞰（テーブル面から真上 / 和食セット全体が見える角度）",
  "gochisousama_deshita":   "俯瞰（同上 / 空の食器・箸置きに戻った箸）",
  "yoroshiku_onegaishimasu":"対面ウェストショット（30度お辞儀 / 両手で資料差し出し）",
  "otsukaresama_desu":      "対面ミディアム（夕方背景 + 退勤者がコート着用）",
  "ojama_shimasu":          "斜め俯瞰（玄関口 / 靴脱ぎ場・段差が見える角度）"
}

SET_EXPR_CULTURAL_NOTES = {
  "itadakimasu": [
    "箸の持ち方: 親指と人差し指の間に挟んでいる状態を描く。",
    "仏箸（食事に箸を突き立てる）は絶対に描かない。",
    "合掌: 両手を胸の前でぴったり合わせる（片手だけでは不可）。"
  ],
  "gochisousama_deshita": [
    "空の食器は「汚れなし」のクリーンな空皿で表現（残飯なし）。",
    "箸は箸置きの上に戻されている状態。",
    "満足の笑みを口元に浮かべる。"
  ],
  "otsukaresama_desu": [
    "明らかに格上の人物（役員レベル）への適用場面は避ける（語用論的不適切）。",
    "同僚・部下・チームメンバー間の場面を設定する。"
  ]
}


## ============================================================
## [追加⑥] VISUAL_SYMBOL_LIBRARY（Research④ 統合視覚記号ライブラリ）
## 専用セクションとして追加
## ============================================================

VISUAL_SYMBOL_LIBRARY = {

  "_overview": (
    "フラットベクターデザインの制約（グラデーション不可・影不可）の中で"
    "日本語文法の意味を記号化するための統合ライブラリ。"
    "ISO 3864・ISO 7010・JIS T 8005 の国際標準を基盤とし、"
    "教材専用の拡張記号（恩恵ベクトル・確信度スケール等）を追加。"
    "このライブラリの記号は、GRAMMAR_PATTERNS_C の全エントリで参照される。"
  ),

  "symbol_table": {

    "hollow_double_line_arrow": {
      "shape":    "2重境界線の太い矢印（中空）",
      "color":    "内部: テイルブルー or オレンジ（発信元依存）",
      "meaning":  "恩恵（ベネファクティブ）の移動方向",
      "grammar":  ["あげます", "もらいます", "くれます"],
      "rule":     "内部にハートアイコンを必ず埋め込む。物理移動の実線矢印と必ず組み合わせる。"
    },

    "iso_prohibition_circle": {
      "shape":    "45度斜線付き外円（ISO禁止記号）",
      "color":    "ISO Red #D81E05 / 不透明度100%",
      "meaning":  "外部ルール・社会規範による禁止",
      "grammar":  ["〜てはいけません"],
      "rule":     "円形形状を厳守。半透明にしない。対象アクションの上に直接重ねる。"
    },

    "translucent_rejection_shield": {
      "shape":    "45度傾いた半透明プレート（シールド）",
      "color":    "Dusky Red #CC3333 / 不透明度50%",
      "meaning":  "個人の意志による否定・拒絶",
      "grammar":  ["〜ません", "〜ない"],
      "rule":     "半透明であること（ISOの実線円と区別）。人物と対象の間にのみ配置。"
    },

    "iso_mandatory_circle": {
      "shape":    "完全な円形（中に白色アクションピクト）",
      "color":    "ISO Blue #002FA7（背景）× White（ピクト）",
      "meaning":  "外部ルールによる義務・強制",
      "grammar":  ["〜なければなりません"],
      "rule":     "ISOソリッドブルー。ピクトグラムは白で内部に配置。黄色矢印との組み合わせ推奨。"
    },

    "dash_circle_bypass_arrow": {
      "shape":    "破線の円形 + 右側を迂回する曲線矢印",
      "color":    "背景: Slate Gray #708090 / 矢印: ISO Green #009B48",
      "meaning":  "不必要・任意（しなくてもよい）",
      "grammar":  ["〜なくてもいいです"],
      "rule":     "ソリッド円（義務）との対比で必ず破線にする。「ー」またはダッシュ記号を円内に配置。"
    },

    "solid_permission_frame": {
      "shape":    "実線の正方形フレーム + 大チェックマーク",
      "color":    "ISO Green #009B48",
      "meaning":  "許可・承認",
      "grammar":  ["〜てもいいです"],
      "rule":     "チェックマーク（✓）はフレーム内部に大きく配置。ISO正方形が標準。"
    },

    "thought_cloud_bubble": {
      "shape":    "スカラップ（貝殻状）外輪線 + 本人頭部への3個トレイル",
      "color":    "境界: outline #1B2C40 / 内部: cream white #FBFBFB",
      "meaning":  "思考・想像・欲求（頭の中の内容）",
      "grammar":  ["〜と思います", "〜たい（バブル版）"],
      "rule":     "トレイル（小丸）は3個。発話バブル（楕円＋テール）と混同しない。"
    },

    "speech_bubble_with_tail": {
      "shape":    "楕円形または角丸長方形 + 口元への鋭角ポインティングテール",
      "color":    "境界: outline #1B2C40 / 内部: cream white #FBFBFB",
      "meaning":  "発話・言語的発信",
      "grammar":  ["〜と言いました", "〜てください", "感動詞全般"],
      "rule":     "テール（尾部）は口元を正確に指す。スカラップ枠（思考バブル）と混同しない。"
    },

    "dashed_bubble": {
      "shape":    "粗い点線（破線）の角丸長方形バブル",
      "color":    "境界: Slate Gray #708090（破線）",
      "meaning":  "低確信度・不確実な推測",
      "grammar":  ["〜かもしれません"],
      "rule":     "破線の粗さで確信度を表す。実線（と思います）と明確に区別。バブル自体を宙に浮かせる。"
    },

    "double_layered_bubble": {
      "shape":    "2重に重なった楕円バブル（外側は極細実線・不透明度50%）",
      "color":    "外バブル境界: Slate Gray / 内バブル: 通常outline色",
      "meaning":  "伝聞（他者の言葉が回り込んで伝わる）",
      "grammar":  ["〜そうです（伝聞）"],
      "rule":     "背後のバブルを50%不透明度で重ねる。ニュースソースアイコンとの接続が必須。"
    },

    "certainty_meter_bar": {
      "shape":    "縦型の段階スケールバー（4〜5段階のステップ）",
      "color":    "0-30%: Gray / 40-60%: Slate / 70-90%: Cyan #008B8B / 100%: Gold",
      "meaning":  "認識的モダリティの確信度を定量的に示す",
      "grammar":  ["〜かもしれません（20-40%）", "〜でしょう（60-70%）", "〜と思います（80-90%）"],
      "rule":     "同一フレーム内で確信度の比較が必要な場合にのみ使用。単独語彙カードでは省略可。"
    },

    "y_gate_split": {
      "shape":    "二股に分かれる矢印フロー（フローチャートの分岐）",
      "color":    "成功経路: ISO Green #009B48 / 失敗経路: Slate Gray #708090",
      "meaning":  "論理的仮定の条件分岐（IF → THEN/ELSE）",
      "grammar":  ["〜ば"],
      "rule":     "〜たら の直進矢印と区別するため、必ずY型分岐構造を使う。"
    },

    "block_arrow": {
      "shape":    "立体感のある極太のブロック矢印（中空ではなくソリッド）",
      "color":    "Neon Orange #FF8C00",
      "meaning":  "時系列的な直接因果・完了後の即発生",
      "grammar":  ["〜たら（因果接続）", "〜て〜（連続動作の接続）"],
      "rule":     "〜ば の Y型分岐とは異なり、直進型。2コマの間に橋渡しするように配置。"
    },

    "memory_flash_stamp": {
      "shape":    "放射状の8本アスタリスク（フラッシュスタンプ）",
      "color":    "Gold Yellow #FFD700",
      "meaning":  "過去の経験が記憶に刻まれていることを示す",
      "grammar":  ["〜たことがあります"],
      "rule":     "タイムライン上の特定ポイントに重ねて配置。経験アイコンと組み合わせる。"
    },

    "anchor_and_pin": {
      "shape":    "地図ピン + 錨のシンボル（組み合わせ）",
      "color":    "ピン: ISO Red #D81E05 / 錨: Teal Blue #008080",
      "meaning":  "恒常的な居住・定着状態",
      "grammar":  ["〜に住んでいます（habitual_teimasu）"],
      "rule":     "人物の胸元から錨が伸び、地図上の都市ピンに突き刺さる構図。"
    },

    "social_pullback_lines": {
      "shape":    "社会的規範アイコンからキャラクターへの引き戻し線",
      "color":    "Warm Red #E05C2A / 不透明度70%",
      "meaning":  "社会的規範・義務感による行動抑止（物理的制限ではなく心理的制限）",
      "grammar":  ["〜わけにはいかない（HARD_LIMIT）"],
      "rule":     "ISO禁止円（外部ルール）とは形状・色・位置をすべて変える。物理バリアとして描かない。"
    },
  },

  "anti_confusion_table": {
    "description": "視覚的に混同しやすい記号ペアのクイックリファレンス",
    "pairs": [
      {
        "symbol_a": "translucent_rejection_shield（〜ません）",
        "symbol_b": "iso_prohibition_circle（〜てはいけません）",
        "key_diff": "半透明シールド vs 100%不透明ISO円。個人意志 vs 社会ルール。"
      },
      {
        "symbol_a": "thought_cloud_bubble（〜と思います）",
        "symbol_b": "speech_bubble_with_tail（〜と言いました）",
        "key_diff": "スカラップ3トレイル vs 楕円+鋭角テール。思考 vs 発話。"
      },
      {
        "symbol_a": "dashed_bubble（〜かもしれません）",
        "symbol_b": "speech_bubble_with_tail（普通のセリフ）",
        "key_diff": "粗い破線枠 vs 実線枠。不確実 vs 確定。"
      },
      {
        "symbol_a": "y_gate_split（〜ば）",
        "symbol_b": "block_arrow（〜たら）",
        "key_diff": "Y型分岐 vs 直進ブロック矢印。論理仮定 vs 時系列因果。"
      },
      {
        "symbol_a": "iso_mandatory_circle（〜なければなりません）",
        "symbol_b": "social_pullback_lines（〜わけにはいかない）",
        "key_diff": "外部ISOルール円 vs 内的社会引力。明示ルール vs 暗黙の規範。"
      },
    ]
  }
}


## ============================================================
## [追加⑦] Research① ハイブリッドアーキテクチャ設計原則
## ============================================================

HYBRID_ARCHITECTURE_PRINCIPLES = {

  "_note": (
    "Research①が提唱した「ハイブリッド型ジェネレーティブアーキテクチャ」。"
    "現在のImagen 4 + GAS パイプラインへの適用指針。"
  ),

  "ai_generation_strengths": [
    "キャラクターの表情・ポーズ・衣服",
    "背景のない単色フラットベクターアセット",
    "具体物（食べ物・乗り物・建物）の外観",
    "人物と物体の自然な位置関係"
  ],

  "ai_generation_weaknesses": [
    "正確な向きを維持した矢印（矢印が曲がる・消える・服の柄になる）",
    "論理的な境界線（ベン図・フレーム枠）",
    "厳密な✗・✓マーク（人物と融合してしまう）",
    "左右対称な2コマ分割構図（レイアウトが崩れる）",
    "確信度メーターやスケールバー（数値的精度が保てない）"
  ],

  "imagen4_prompt_compensation": {
    "description": (
      "Imagen 4 単独で生成する場合のプロンプト補強テクニック。"
      "完全なハイブリッド合成（AI+SVGオーバーレイ）は将来の拡張。"
    ),
    "for_arrows": (
      "矢印: 'a thick bold directional arrow clearly pointing from LEFT to RIGHT, "
      "the arrow is a distinct separate graphic element, NOT part of any character's clothing or body'"
    ),
    "for_barriers": (
      "バリア: 'a semi-transparent red rectangular panel positioned BETWEEN the characters, "
      "floating in midair, clearly separated from all figures'"
    ),
    "for_frames": (
      "境界枠: 'a clean rounded rectangle outline frame, completely separate from figures, "
      "drawn as a visible geometric border on the background'"
    ),
    "for_checks_crosses": (
      "記号: 'a bold {GREEN CHECKMARK / RED CROSS} symbol INSIDE the speech bubble, "
      "NOT overlapping any body part, clearly readable as a distinct icon'"
    )
  },

  "future_extension": (
    "将来的な理想構成（将来フェーズで検討）:"
    "Phase 1: Imagen 4 でキャラクターと背景のみを生成（記号なし）"
    "Phase 2: OpenCV で生成画像からキャラクター座標を取得"
    "Phase 3: SVG テンプレートレンダラーが矢印・記号・フレームを合成"
    "→ これにより記号の精度問題を完全解消できる"
  )
}


## ============================================================
## 変更サマリー（v2.6 → v2.6.1）
## ============================================================

V2_6_1_CHANGES = {
  "corrections": {
    "COLOR_SYSTEM_RULES": "カラーシステムの適用範囲を明確化（STYLE_BIBLE vs UNIFIED_CHAR_SYSTEM）",
    "gold_standard":      "#FAD141（語彙カード）と#FFD700（例文・文法）を明示的に分離",
    "red_distinction":    "3種の赤（否定シールド・ISO禁止・社会的引力）を色・不透明度・形状で区別",
    "teimasu_ids":        "〜ています の3サブパターンに独立した grammarConcept ID を割り当て",
    "amari_disambiguation": "あまり〜ない の度合い文脈vs頻度文脈を別エントリとして分離",
  },
  "additions": {
    "GRAMMAR_PATTERNS_C": "5エントリ追加: でしょう・なら・わけにはいかない・の（所有）・どれ/どの",
    "FAMILY_FRAMES":      "3エントリ追加: 姉（uchi）・お姉さん（soto）・妹（uchi）",
    "ADVERB_FRAMES":      "8エントリ追加: もっと・たまに・あまり（頻度）・ぜんぜん（頻度）"
                          "・これから・さっき・静かに・にぎやかに",
    "COUNTER_SUBITIZING": "サビタイジング原則を専用辞書として定義。各prompt_coreへの注入方法を明記",
    "SET_EXPR_CAMERA":    "6表現のカメラアングル仕様・文化的注意事項を専用辞書として追加",
    "VISUAL_SYMBOL_LIBRARY": "Research④統合視覚記号ライブラリを独立セクションとして新設（15記号）",
    "ANTI_CONFUSION_TABLE": "混同しやすい記号ペアのクイックリファレンスを追加",
    "HYBRID_ARCHITECTURE": "Research①のハイブリッド設計原則を独立セクションとして追加",
  },
  "total_grammar_patterns_c": {
    "v2_6":   "37エントリ（グループ1〜5）",
    "v2_6_1": "42エントリ（+5件：でしょう・なら・わけにはいかない・の（所有）・どれ）",
  },
  "total_symbol_library": {
    "v2_6":   "gramm signal_colorsに色コードのみ分散",
    "v2_6_1": "VISUAL_SYMBOL_LIBRARY として15記号を形状・色・文法・ルール付きで体系化",
  }
}


## ============================================================
## §4. FOUNDATIONAL — 横断的基盤原則（最優先）
## 元ファイル: master_prompt_design_guide_v2_6_foundational.py
## 優先度: §3 CORRECTIONS より高い。全テンプレートの上位原則。
## ============================================================

## ============================================================
## [矛盾解決・最重要] キャラクター描画方針の統一
## STYLE_BIBLE（暖色肌）vs Research③（グレー中立アバター）の衝突を解決
## ============================================================

CHARACTER_RENDERING_POLICY = {

  "conflict_summary": (
    "STYLE_BIBLE(v2.5): 'Naturally warm medium skin tone'（写実的暖色肌）"
    "Research③: 肌=#D3D3D3グレー or ニュートラルベージュ・ジェンダーニュートラル"
    "→ 両者は別の描画哲学。vocab_type ごとに適用先を確定する。"
  ),

  "resolution_rule": {
    "warm_skin_realistic": {
      "applies_to": ["person", "building", "family"],
      "spec": (
        "STYLE_BIBLE 準拠の 'naturally warm medium skin tone'。"
        "理由: これらは『特定の役割・人物・家族関係』を教える語彙カードであり、"
        "人間らしさ（医者・先生・父・母）の認識が学習目標そのもの。"
        "リアルな肌色がロール認識を助ける。"
      )
    },
    "neutral_avatar_abstract": {
      "applies_to": [
        "example_sentence", "pronoun", "interjection",
        "set_expression", "adverb", "sensory"
      ],
      "spec": (
        "Research③ 準拠の 'gender-neutral minimal avatar, "
        "neutral light gray or neutral beige skin (#D3D3D3), "
        "no ethnic hairstyle, no religious or culturally specific clothing "
        "except the role-marking shirt color (Ego=teal #008080 / Soto=orange #FF8C00)'。"
        "理由: これらは『文法関係・発話視点・場面』を教える抽象画像であり、"
        "特定の人物の属性は学習のノイズになる。"
        "文化中立アバターで認知負荷を最小化し、文化的偏見を排除する。"
      )
    },
    "context_dependent": {
      "applies_to": ["concrete_object", "action_verb", "adjective",
                     "abstract_concept", "spatial_relation", "demonstrative",
                     "counter", "time", "transportation", "weather"],
      "spec": (
        "人物が脇役の場合は neutral_avatar、人物が主役の場合は warm_skin。"
        "原則: 人物が『何者か』が問われない画像 → neutral avatar。"
      )
    }
  },

  "critical_note": (
    "⚠️ 同一レッスン内で『person語彙カードの先生（暖色肌）』と"
    "『example_sentenceの先生（グレーアバター）』が混在しても問題ない。"
    "前者は『先生という職業』の学習、後者は『文型』の学習で、"
    "認知タスクが異なるため学習者は別物として処理する（Research③が実証）。"
    "重要なのは『同じvocab_type内では一貫していること』。"
  )
}


## ============================================================
## [基盤原則①] Trajector/Landmark プロファイリング（全文型共通）
## Research①が「誤読を防ぐ中核的なデザイン原則」と明記
## ============================================================

TRAJECTOR_LANDMARK_PROFILING = {

  "principle": (
    "テキストなし静止画では『どれが主語(tr)で、どれが背景の参照点(lm)か』を"
    "輪郭線の太さと色彩コントラストで前景化(プロファイル)することが、"
    "誤読を防ぐための中核原則。これは授受表現だけでなく、"
    "tr/lm の区別がある【すべての】文型・語彙カードに適用する。"
  ),

  "universal_rules": {
    "trajector_profiling": (
      "主格(tr)の輪郭線: BOLD 3.5px。色: ビビッドな原色（プロファイル）。"
    ),
    "landmark_demotion": (
      "参照点(lm)の輪郭線: THIN 1.5px。色: 彩度を落とした無彩色"
      "（ライトグレー / 不透明度60%）。視覚的『ベース』に格下げ。"
    ),
    "color_contrast": (
      "tr と lm の間に最大の認知的コントラストを作る。"
      "tr=高彩度+太線、lm=低彩度+細線。"
    )
  },

  ## 各文型での tr/lm 対応（GRAMMAR_PATTERNS_C 全エントリに適用）
  "tr_lm_mapping": {
    "noun_predicate_affirmative": "tr=人物 / lm=カテゴリ枠",
    "existence_location":         "tr=存在物 / lm=配置空間（机等）",
    "comparison_yori":            "tr=優位対象 / lm=劣位対象",
    "desire_tai":                 "tr=欲求主体 / lm=欲求対象（ゴースト）",
    "potential_dekimasu":         "tr=能力主体 / lm=実行タスク",
    "progressive_teimasu":        "tr=動作主体 / lm=動作対象",
    "request_tekudasai":          "tr=依頼発話者 / lm=行動の受け手",
    "negation_masen":             "tr=否定主体 / lm=拒絶対象",
    "benefactive_teageru":        "tr=私(Ego) / lm=他者(Soto)",
    "benefactive_temorau":        "tr=私(Ego・受益者) / lm=他者(Soto)",
    "benefactive_tekureru":       "tr=他者(Soto・行為者) / lm=私(Ego・受益者)",
    "comparison_superlative":     "tr=1位要素 / lm=2位以下",
    "_general": "上記にないエントリも、文の主語をtr、目的語/背景をlmとして同原則を適用"
  },

  "prompt_injection_phrase": (
    "The grammatical SUBJECT ({TRAJECTOR}) must have a BOLD thick outline (3.5px) "
    "and vivid saturated color. "
    "The reference/background element ({LANDMARK}) must have a THIN outline (1.5px) "
    "and muted desaturated gray color (60% opacity). "
    "Maximize the visual contrast between subject and reference."
  ),

  "qa_check": (
    "生成画像で『どちらが主語か』が1秒で判別できるか？"
    "tr の輪郭が lm より明確に太く、彩度が高いか？"
  )
}


## ============================================================
## [基盤原則②] 線種セマンティクス（全画像共通）
## Research②が定義した普遍ルール
## ============================================================

STROKE_STYLE_SEMANTICS = {

  "principle": (
    "実線(Solid Line) = 『存在する既知の物質・確定した事実』"
    "破線(Dashed Line) = 『未知・疑問・不確実・変化のプロセス・仮定』"
    "この線種ルールは全テンプレートで一貫して適用する。"
  ),

  "solid_line_usage": [
    "確定した人物・物体（通常の語彙カード）",
    "確定した事実の発話バブル（〜と言いました）",
    "完了した条件（〜たら の左コマフレーム）",
    "高確信度の推論（〜と思います・〜でしょう）",
  ],

  "dashed_line_usage": [
    "疑問代名詞の対象シルエット（だれ・なに・どこ・いつ）",
    "疑問詞の選択肢枠（どれ・どの+N）",
    "未完了の時制副詞（まだ〜ていません）",
    "仮定条件のフレーム（〜ば の左パネル）",
    "低確信度バブル（〜かもしれません）",
    "ソト境界円（くれます・お父さん等のソト形）",
    "欲求対象のゴースト輪郭（〜たい）— ※半透明75%とも併用",
    "行動結果ゴースト（〜てください の予想結果シルエット）",
  ],

  "consistency_audit": (
    "v2.6 全エントリで線種を監査した結果、以下は一貫している:"
    "  dare/nani/doko/itsu → 破線シルエット ✓"
    "  mada_not_yet → 破線サークル ✓"
    "  condition_ba → 破線フレーム ✓"
    "  uncertainty_kamoshiremasen → 破線バブル ✓"
    "  inference_deshoo → 実線バブル（確信度中〜高）✓"
    "  benefactive_tekureru → ソト破線半円 ✓"
  ),

  "prompt_injection_phrase": (
    "Use SOLID outlines for known/certain elements. "
    "Use DASHED outlines for unknown/questioned/hypothetical/uncertain elements."
  )
}


## ============================================================
## [基盤原則③] セマンティックカラー統合・オレンジ衝突の解決
## Research②④のカラー体系を統合し矛盾を解消
## ============================================================

SEMANTIC_COLOR_UNIFIED = {

  "conflict_identified": (
    "Research②: 疑問・未確定 = 黄・オレンジ（？マーク・電球）"
    "Research④/UNIFIED_CHAR_SYSTEM: オレンジ #FF8C00 = Soto（他者）シャツ"
    "→ Sotoキャラの近傍に疑問符を置くと色が衝突し混同する。"
  ),

  "resolution": {
    "soto_character_orange": (
      "Soto キャラクターのシャツ: Warm Orange #FF8C00（変更なし・固定）"
    ),
    "question_uncertain_color": (
      "疑問・未確定の記号（？マーク・電球・探索エフェクト）は"
      "オレンジを【使わない】。代わりに Amber Yellow #FFC107 を使用する。"
      "理由: Soto のオレンジ #FF8C00 と確実に弁別するため。"
      "黄色寄りにシフトすることで、同一画面内で『他者キャラ』と"
      "『疑問記号』が視覚的に分離される。"
    ),
    "exception": (
      "Soto キャラクターが登場しない画像（pronoun の dare/nani 等、"
      "人物が1名以下）では従来通り Amber Yellow #FFC107 を使用。"
      "一貫性のため、Soto の有無にかかわらず疑問記号は常に #FFC107。"
    )
  },

  ## 統合セマンティックカラー表（全システムで共有する単一の真実）
  "master_color_table": {
    "ego_self":          {"hex": "#008080", "name": "Teal Blue",   "use": "私(Ego)シャツ・あげます矢印・住んでいます錨"},
    "soto_other":        {"hex": "#FF8C00", "name": "Warm Orange",  "use": "他者(Soto)シャツ・くれます矢印・たら因果矢印"},
    "permission_safe":   {"hex": "#009B48", "name": "ISO Green",    "use": "許可・進行・推奨・条件成立・肯定チェック✓"},
    "prohibition_neg":   {"hex": "#D81E05", "name": "ISO Red",      "use": "禁止・警告・否定✗・取り消し線（不透明100%）"},
    "negation_personal": {"hex": "#CC3333", "name": "Dusky Red",    "use": "個人意志の否定シールド（半透明50%）"},
    "obligation_cmd":    {"hex": "#002FA7", "name": "ISO Blue",     "use": "義務・指示・強制"},
    "question_uncertain":{"hex": "#FFC107", "name": "Amber Yellow", "use": "？マーク・電球・探索・未確定（※オレンジ回避）"},
    "neutral_base":      {"hex": "#708090", "name": "Slate Gray",   "use": "背景・比較基準・不活性lm・修飾ベース"},
    "highlight_winner":  {"hex": "#FFD700", "name": "Pure Gold",    "use": "勝者・最高値・記憶スタンプ・今日・ハイライト月"},
    "vocab_card_accent": {"hex": "#FAD141", "name": "Amber Gold",   "use": "語彙カード(person等)のアクセントのみ"},
    "social_constraint": {"hex": "#E05C2A", "name": "Warm Red",     "use": "社会的規範の引き戻し(わけにはいかない・70%)"},
  },

  "color_separation_rule": (
    "学習者が複数カードにまたがって『色の意味』を無意識に習得できるよう、"
    "このmaster_color_tableをシステム全体で固定する。"
    "1色1意味の原則を厳守し、同一画面で意味の衝突する色を併置しない。"
  )
}


## ============================================================
## [基盤原則④] 黄金分割レイアウトテンプレート（全カード共通構図）
## Research②が定義した標準構図
## ============================================================

GOLDEN_RATIO_LAYOUT = {

  "principle": (
    "全語彙カード・例文カードのレイアウトを縦3分割で統一する。"
    "学習者が視線移動パターンを固定でき、語彙解釈に認知リソースを集中できる。"
  ),

  "vertical_zones": {
    "top_20_percent": {
      "label":   "コンテキスト・記号エフェクト領域",
      "content": "太陽・カレンダー・発話吹き出し・思考バブル・確信度メーター",
      "note":    "文法信号や時間文脈の記号をここに集約"
    },
    "center_60_percent": {
      "label":   "メインアクター / メインオブジェクト領域",
      "content": "人物・主体物・矢印・数量オブジェクト",
      "note":    "tr(主格)をここに最大コントラストで配置"
    },
    "bottom_20_percent": {
      "label":   "修飾インジケータ / スケールバー領域",
      "content": "タイムライン・程度スケール・頻度カレンダー・before/afterアイコン",
      "note":    "副詞の度合い・時制、状態変化の補助情報をここに"
    }
  },

  "applicability": {
    "strict": ["example_sentence", "adverb", "time", "pronoun"],
    "flexible": ["person", "concrete_object", "building"],
    "note": (
      "副詞・時間・例文は3ゾーン厳密適用（スケールバー/タイムラインが下20%必須）。"
      "人物・物体カードは中央60%占有を主とし、上下ゾーンは任意。"
    )
  },

  "prompt_injection_phrase": (
    "Composition follows a 20/60/20 vertical layout: "
    "top 20% for context symbols (sun/calendar/bubble), "
    "center 60% for the main subject, "
    "bottom 20% for modifier indicators (timeline/scale bar). "
    "Keep the main subject anchored in the central 60% zone."
  )
}


## ============================================================
## [基盤原則⑤] ユニバーサル記号 vs 文化依存記号
## Research②の文化安全テーブル
## ============================================================

UNIVERSAL_VS_CULTURAL_SYMBOLS = {

  "universal_symbols": {
    "description": "文化を超えて安全に使える記号（全画像で自由に使用可）",
    "list": {
      "vector_arrow":       "方向・指示・移動・変化（太さと色で定義を厳密化）",
      "facial_expressions": "喜び・悲しみ・驚き等の基本感情（普遍的に認識される）",
      "question_exclaim":   "？と！（グローバルに浸透した情報探索記号）",
      "scale_battery_bar":  "充填率による程度・量の表現（デバイス普及で万国共通）"
    }
  },

  "culture_dependent_symbols": {
    "description": "文化依存。AI生成時にパラメータを厳密制御する必要あり",
    "controlled_elements": {

      "bowing_angle": {
        "risk": "他国では宗教儀礼や屈従と誤解されうる",
        "standard": {
          "15_degrees": "挨拶（おはようございます等）",
          "30_degrees": "丁寧（よろしくおねがいします・おじゃまします）",
          "45_degrees": "謝罪・深い敬意（すみません・ソト形の敬意）",
        },
        "rule": "お辞儀を描く全画像でこの角度規格を明示的にプロンプト指定する。"
      },

      "gassho_hands": {
        "risk": "仏教・ヒンドゥー教の祈り（ナマステ）と混同される",
        "mitigation": "眼前に和食トレイを必ず配置し『日本の食前マナー』として文脈固定（いただきます）"
      },

      "nose_pointing_watashi": {
        "risk": "アジア圏以外では『なぜ鼻を触る?』と疑問視される",
        "mitigation": "鼻を指すジェスチャー + 自身へ向かうカーブ矢印を必ず重畳して補強（watashi）"
      },

      "x_o_marks": {
        "risk": "欧米圏では X がチェックマーク（選択=肯定）として機能することがある",
        "mitigation": "色情報を必須併用（赤=否定/✗、緑=肯定/✓）。記号単独で意味を担わせない。"
      }
    }
  },

  "cross_reference": (
    "この原則は SET_EXPR_FRAMES（定型表現）・INTERJECTION_FRAMES（感動詞）・"
    "PRONOUN_FRAMES（watashi）に特に強く適用される。"
    "v2.6_corrections の SET_EXPR_CULTURAL_NOTES と整合。"
  )
}


## ============================================================
## [基盤原則⑥] 副詞のアンカー必須原則
## Research②：副詞は単独で意味が完結しない
## ============================================================

ADVERB_ANCHOR_PRINCIPLE = {

  "principle": (
    "副詞は単独で文を構成しない。視覚化では必ず"
    "『ベースとなる動作・状態（被修飾語=アンカー）』を固定し、"
    "その量・頻度・様態・時間軸上の位置をコントロールする"
    "修飾子（モディファイア）を記号的に重ね合わせる。"
  ),

  "mandatory_rule": (
    "ADVERB_FRAMES の全エントリで、修飾対象（アンカー）を必ず描画する。"
    "副詞記号（スケールバー・カレンダー・タイムライン）だけの画像は禁止。"
    "  程度副詞: アンカー物体 + 評価バー"
    "  頻度副詞: アンカー動作 + カレンダーグリッド"
    "  様態副詞: アンカー動作 + 様態記号（速度線・Shh等）"
    "  時制副詞: アンカー動作 + タイムライン位置"
  ),

  "default_anchors": {
    "degree":    "「スープを飲んで熱いと感じる人物」（熱さの度合いを示す共通アンカー）",
    "frequency": "「ジョギングをする人物」（頻度を示す共通アンカー）",
    "manner":    "「走る/歩く人物」または「部屋の中の様子」",
    "temporal":  "「ご飯を食べる」アクション（タイムライン上に配置）"
  },

  "qa_check": (
    "副詞カードに『何を修飾しているか』が描かれているか？"
    "スケールバーやカレンダーだけになっていないか？"
  )
}


## ============================================================
## [基盤原則⑦] COSTAR構造化プロンプト（GAS実装の推奨アーキテクチャ）
## Research④が推奨する複雑文型用プロンプト構造
## ============================================================

COSTAR_PROMPT_STRUCTURE = {

  "principle": (
    "複雑な文法パターン（GRAMMAR_PATTERNS_C の uses_unified_char=True や"
    "HARD_LIMIT=True のエントリ）では、単純な単語羅列ではなく"
    "COSTAR準拠の構造化プロンプトを使用する。"
  ),

  "template": '''
[Context]
An educational flat vector graphic for {LEARNER_LEVEL} Japanese language learners
to teach a grammar pattern without any textual letters. Extremely clean, direct,
universally comprehensible.

[Objective]
Visualize the specific grammatical structure: "{GRAMMAR_PATTERN_NAME}".

[Style]
Strict flat vector style, 2D graphic illustration, solid color blocks,
sharp clean outlines. No gradients, no drop shadows, no 3D rendering,
no blur. Pure white background (#FFFFFF). No text, no letters, no words.

[Layout & Coordinate Mapping]
{TR_LM_PROFILING}   ← TRAJECTOR_LANDMARK_PROFILING.prompt_injection_phrase
{CHARACTER_PLACEMENT}  ← UNIFIED_CHAR_SYSTEM (if uses_unified_char)
{GOLDEN_RATIO}  ← GOLDEN_RATIO_LAYOUT.prompt_injection_phrase
{STROKE_STYLE}  ← STROKE_STYLE_SEMANTICS.prompt_injection_phrase
{SCENE_SPECIFIC}  ← GRAMMAR_PATTERNS_C[concept].visual_strategy.prompt_core

[Color Palette]
Strictly limited to colors from SEMANTIC_COLOR_UNIFIED.master_color_table
relevant to this pattern. {RELEVANT_COLORS}
''',

  "style_first_rule": (
    "Research①原則: スタイル指示をプロンプト最先端に置く。"
    "AIは自然文の冗長指示をノイズ処理するため、"
    "カンマ区切りの記述的名詞・形容詞シーケンスで構成する。"
  ),

  "gas_implementation_note": (
    "buildExampleSentencePrompt_() は以下の順で文字列を連結する:"
    "  1. [Style] ブロック（最先端・固定）"
    "  2. [Context] + [Objective]"
    "  3. [Layout]: TR/LM + character placement + golden ratio + stroke style"
    "  4. [Scene]: GRAMMAR_PATTERNS_C の prompt_core"
    "  5. [Color]: master_color_table から該当色のみ抽出"
    "  末尾に STYLE_BIBLE.constraints の no-text制約を必ず付加。"
  )
}


## ============================================================
## 最終監査サマリー（3パス完了）
## ============================================================

FINAL_AUDIT_SUMMARY = {

  "audit_passes": {
    "pass_1": "v2.6 本体作成（テンプレートC'・K〜T・UNIFIED_CHAR_SYSTEM）",
    "pass_2": "v2.6_corrections（矛盾5件修正・抜け17件追加・記号ライブラリ15件）",
    "pass_3": "v2.6_foundational（横断的基盤原則7件・キャラ描画矛盾1件解決）← 本ファイル",
  },

  "pass_3_findings": {
    "critical_contradiction_resolved": [
      "キャラクター描画方針: STYLE_BIBLE暖色肌 vs Research③グレー中立アバター"
      " → vocab_type別の適用ルールを CHARACTER_RENDERING_POLICY で確定",
    ],
    "foundational_principles_added": [
      "① TRAJECTOR_LANDMARK_PROFILING（全文型共通の主格前景化）",
      "② STROKE_STYLE_SEMANTICS（実線=既知/破線=未知の普遍ルール）",
      "③ SEMANTIC_COLOR_UNIFIED（オレンジ衝突解決+統合カラー表）",
      "④ GOLDEN_RATIO_LAYOUT（20/60/20標準構図）",
      "⑤ UNIVERSAL_VS_CULTURAL_SYMBOLS（お辞儀角度規格等）",
      "⑥ ADVERB_ANCHOR_PRINCIPLE（副詞アンカー必須）",
      "⑦ COSTAR_PROMPT_STRUCTURE（GAS実装の推奨プロンプト構造）",
    ]
  },

  "now_complete": {
    "research_1_L1_L10":    "全10文型 + 認知文法tr/lm原則 + ハイブリッド設計 ✓",
    "research_2_function":  "代名詞9・感動詞7・定型6・副詞18・助数詞8 + 線種/カラー/構図/文化原則 ✓",
    "research_3_newvocab":  "時間9・交通9・家族7・天気8・感覚7 + キャラ描画方針 ✓",
    "research_4_L11_L22":   "複合文型全グループ + 統合記号ライブラリ15 + COSTAR ✓",
  },

  "cross_consistency_verified": [
    "カラー: master_color_table が単一の真実。全テンプレートが参照 ✓",
    "線種: 実線/破線が全エントリで一貫（consistency_audit済）✓",
    "tr/lm: 全GRAMMAR_PATTERNS_Cエントリにマッピング定義 ✓",
    "肌色: vocab_type別ルールで全画像の一貫性を担保 ✓",
    "赤の3用法: ISO禁止/個人否定/社会引力を不透明度・形状で分離 ✓",
    "ゴールド2用法: 語彙#FAD141 / 文法#FFD700 を排他分離 ✓",
    "オレンジ衝突: Soto#FF8C00 / 疑問#FFC107 に弁別 ✓",
    "〜ています3種: grammarConcept ID分離（progressive/state/habitual）✓",
  ],

  "remaining_for_gas_implementation": [
    "buildExampleSentencePrompt_() を COSTAR構造で実装",
    "TR/LM プロファイリングを全文型の prompt 連結ロジックに組込み",
    "master_color_table を GAS定数として一元管理",
    "Vocabulary シートに補助列追加（familyForm/perceptionType/adverbType/grammarConcept）",
    "CHARACTER_RENDERING_POLICY を vocab_type 判定ロジックに組込み",
  ]
}


## ============================================================
## END OF master_prompt_design_guide_v2_6_complete.py
## ============================================================
## 適用方法:
##   1. v2.5 と このファイル(v2_6_complete)を両方ロードする。
##   2. 矛盾時は §4 > §3 > §2 > v2.5 の順で優先する。
##   3. GRAMMAR_PATTERNS_C と GRAMMAR_PATTERNS_C_ADDITIONS は
##      両方を参照して完全な 42エントリとして扱う。
##   4. GAS の buildImagePrompt_() は HOW_TO_USE_v2_6 を参照する。
## ============================================================
