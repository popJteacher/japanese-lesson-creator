# ============================================================
# master_prompt_design_guide_v2_7.py
# 「Claudeがプロンプトを書くための仕様書」
# バージョン：v2.7
# 作成日：2026-05-18
# 前バージョン：v2.6_complete（master_prompt_design_guide_v2_6_complete.py）
# ============================================================
#
# 【v2.7 の変更概要】
#   v2.6 から v2.7 への主な変更:
#   - アーキテクチャ方針転換に伴う不要要素を削除（GAS実装メモ等）
#   - STYLE_RECIPE を確定版（hex値なし）に差し替え（冒頭に配置）
#   - TEXT_POLICY_A/B/C を新設（3段階テキスト制約を整理）
#   - アスペクト比（語彙1:1 / 例文16:9）を明示
#   - JSON出力フォーマット仕様を新設（§0）
#   - GRAMMAR_PATTERNS_C に ADDITIONS（5件）を統合（合計41エントリ）
#   - 改訂履歴の三重掲載を1箇所に統合
#   - ファイル構造を「Claudeが読む順」に再設計
#
# 【削除したもの】
#   - COSTAR テンプレートのプレースホルダー ({TR_LM_PROFILING} 等)
#   - GAS switch-case 拡張仕様（HOW_TO_USE_v2_6 内）
#   - FINAL_AUDIT_SUMMARY.remaining_for_gas_implementation
#   - v2.5 への依存記述（→ このファイル単体で完結）
#   - TEIMASU_DISAMBIGUATION.gas_implementation（GASコード部分のみ削除）
#   - HYBRID_ARCHITECTURE_PRINCIPLES.future_extension（将来フェーズのメモ）
#
# ============================================================


## ============================================================
## §0. このガイドの使い方（Claudeへの指示）
## ============================================================
##
## 【用途】
##   このガイドはVocabularyシートのS列（imagePrompt列）に投入する
##   JSON形式のプロンプトを Claudeが生成する際に参照する仕様書。
##
## 【出力フォーマット仕様】
##
##   以下のJSON形式で出力すること（importImagePromptsFromJson() に渡す形式）:
##
##   {
##     "word_先生":   "Minimalist flat vector illustration. [完成プロンプト全文]",
##     "word_医者":   "Minimalist flat vector illustration. [完成プロンプト全文]",
##     "ex_L01_007": "Minimalist flat vector illustration. [完成プロンプト全文]"
##   }
##
##   キー命名規則:
##     語彙カード → "word_[語彙]"  (Vocabularyシート G列の imageId と一致させる)
##     例文画像   → "ex_L[課番号2桁]_[連番3桁]" (ExamplesシートのimageId と一致)
##
##   バッチサイズ:
##     語彙カード: 50語単位で生成・投入を繰り返す
##     例文画像: 課単位（lesson_01なら全例文をまとめて）
##
## 【完成プロンプトの組み立て方】
##
##   ■ テンプレートK〜T（§4で本体定義済み）および §5 GRAMMAR_PATTERNS_C の場合:
##     完成プロンプト = STYLE_RECIPE + 肌色指定 + テンプレート prompt_core + TEXT_POLICY
##     ※ prompt_coreはフラグメントなので前後に追記する形でOK
##
##   ■ テンプレートA〜J（v2.5 PROMPT_TEMPLATES を参照する場合）:
##     v2.5テンプレートは内部に [STYLE RECIPE] ブロックを含む。
##     → v2.5テンプレートの [STYLE RECIPE] ブロックを §1 の STYLE_RECIPE に「置換」する。
##     → §0の式どおり STYLE_RECIPE を「前置」しない。（二重付加になる）
##     手順:
##       1. v2.5テンプレートを取得
##       2. [STYLE RECIPE — DO NOT CHANGE] ブロック全体を § 1 の STYLE_RECIPE で置換
##       3. 肌色指定を CHARACTER_RENDERING_POLICY に従って追記
##       4. [CONSTRAINTS] ブロックを対応する TEXT_POLICY に置換または追記
##
##   ■ 共通: テンプレート内プレースホルダー（{CHARACTER_DESCRIPTION} 等）を
##     lesson_NN.json の語彙情報で埋めてから出力する
##
## 【重要】STYLE_RECIPE は §1 の確定版を使うこと。
##          v2.6 以前のファイル内 STYLE_RECIPE（hex値付き）は使用禁止。
##
## ============================================================


## ============================================================
## §1. 変更禁止の基本設定（最優先）
## ============================================================

## ────────────────────────────────────────────────────────────
## 1-1. 確定版 STYLE_RECIPE（変更禁止・全プロンプトに必ず付加）
## ⚠️ v4.6 で Imagen が hex値を画像内テキストとして描画するバグが発見された。
##    GAS v5.2 で修正済み。このファイルでも hex値なし確定版に差し替える。
##    v2.6 以前のファイル内 STYLE_RECIPE は使用禁止。
## ────────────────────────────────────────────────────────────

STYLE_RECIPE = (
    "Minimalist flat vector illustration. "
    "Clean continuous black outlines with consistent line weight. "
    "Completely flat solid color fills only. "
    "Color palette: soft cream white background, "
    "deep slate navy outlines, "
    "muted warm blue as main fill color, "
    "warm amber gold as accent color, "
    "cool slate gray as sub-color for secondary elements. "
    "No gradients, no shadows, no 3D effects, no photoreal textures. "
    "Apply zero ambient lighting, zero drop shadows, zero global illumination. "
    "This should look like it belongs in a brand style guide, not like AI art. "
    "Keep line weights consistent."
)
## ⚠️ 肌色は STYLE_RECIPE に含めない。
##    vocab_type ごとに CHARACTER_RENDERING_POLICY（§2-3）を参照して
##    暖色肌（warm skin）かグレーアバター（#D3D3D3）かを個別に指定すること。
##    暖色肌の場合プロンプトに追加: "Skin tones: naturally warm medium skin tone."
##    グレーアバターの場合: "Gender-neutral avatar, neutral light gray skin (#D3D3D3)."

## ────────────────────────────────────────────────────────────
## 1-2. TEXT_POLICY（テキスト制約の3段階定義）
## 各テンプレートには TEXT_POLICY_A / B / C のいずれかを適用する。
## テンプレートの末尾に「TEXT_POLICY: X」と明記されている。
## ────────────────────────────────────────────────────────────

TEXT_POLICY_A = (
    "No text, no letters, no numbers. "
    "Educational pictographic symbols (directional arrows, motion lines, "
    "panel dividers, territory boundary lines) are permitted only when "
    "explicitly described in the template's CONSTRAINTS block."
)
## 適用 vocab_type（純粋イラスト系）:
##   person / building / concrete_object / variant_grid / abstract_concept
##   family / transportation / weather_noun（晴れ・雨・風・雪・台風 等 名詞天気）
## ※ action_verb の矢印・motion_line は CONSTRAINTS に明示されているため許可
## ※ v2.5テンプレート内の[CONSTRAINTS]記述が優先される

TEXT_POLICY_B = (
    "No words, no letters, no readable labels. "
    "Simple visual symbols are allowed: arrows, checkmark (✓), cross mark (✗), "
    "question mark (?), exclamation mark (!), abstract meters, calendar cells."
)
## 適用 vocab_type（記号許可系）:
##   action_verb / spatial_relation / demonstrative / adjective
##   example_sentence / pronoun / interjection / set_expression / adverb / sensory
##   weather_adjective（暑い・寒い 等 体感形容詞）

TEXT_POLICY_C = (
    "No words, no letters. "
    "Numbers and simple calendar marks are allowed only when teaching "
    "time, dates, counters, or quantities."
)
## 適用 vocab_type（数字・カレンダー許可系）:
##   time / counter

## ────────────────────────────────────────────────────────────
## 1-3. アスペクト比（GAS の API パラメータで制御）
## ────────────────────────────────────────────────────────────

ASPECT_RATIO = {
    "vocabulary_card": "1:1",
    "example_sentence_card": "16:9",
    "note": (
        "アスペクト比はGASのAPIパラメータで制御するため、"
        "プロンプト本文内に記述不要。"
        "ただし16:9ではClaudeがシーン構成を設計する際に"
        "左右方向のレイアウトを意識すること。"
    )
}


## ============================================================
## §2. キャラクター・カラーシステム
## ============================================================

## ────────────────────────────────────────────────────────────
## 2-1. UNIFIED_CHAR_SYSTEM（2名以上の例文・文法画像に適用）
## ────────────────────────────────────────────────────────────
## ⚠️ このシステムは 語彙カード（1人または人物なし）には適用しない。
##    2名以上登場する example_sentence / pronoun / interjection /
##    set_expression / benefactive 画像にのみ使用する。

UNIFIED_CHAR_SYSTEM = {

    "character_placement": {
        "ego_watashi": {
            "position":      "LEFT half of the frame",
            "shirt_color":   "Teal Blue #008080",
            "role":          "自己 / 私（Ego / Speaker）",
            "outline_width": "BOLD 3.5px when Ego is the grammatical subject (Trajector)",
        },
        "soto_other": {
            "position":      "RIGHT half of the frame",
            "shirt_color":   "Warm Orange #FF8C00",
            "role":          "他者 / あなた・かれ・かのじょ（Soto / Other）",
            "outline_width": "Regular 1.5px as secondary participant (Landmark)",
        }
    },

    "grammar_signal_colors": {
        "permission_safe":    "ISO Green #009B48",
        "prohibition_danger": "ISO Red #D81E05",
        "obligation_command": "ISO Blue #002FA7",
        "unnecessary_bypass": "Slate Gray #708090",
        "comparison_winner":  "Pure Gold #FFD700",
        "condition_if_frame": "Dotted border, Slate Gray #708090",
        "condition_then_arrow":"Neon Orange block arrow #FF8C00",
        "benefactive_ego":    "Teal Blue arrow (あげます)",
        "benefactive_soto":   "Orange arrow (くれます)",
        "benefactive_blend":  "Tip Teal Blue, tail Orange (もらいます)",
        "memory_stamp":       "Gold Yellow #FFD700",
        "anchor_pin":         "Red pin + Teal Blue anchor (住んでいます)",
    },

    "uchi_soto_boundary": {
        "uchi_inside": {
            "shape": "Warm solid-line circle",
            "fill":  "Semi-transparent warm pink #FFE0E0 (30% opacity)",
            "meaning": "内輪（自己・家族・親しい関係）",
        },
        "soto_outside": {
            "shape": "Cool dashed-line circle",
            "fill":  "Semi-transparent cool gray #E0E8F0 (30% opacity)",
            "meaning": "外向き（相手の家族・敬意の対象）",
        }
    },
}

## ────────────────────────────────────────────────────────────
## 2-2. SEMANTIC_COLOR_UNIFIED（統合セマンティックカラー表）
## ────────────────────────────────────────────────────────────

SEMANTIC_COLOR_UNIFIED = {

    "master_color_table": {
        "ego_self":           {"hex": "#008080", "name": "Teal Blue",    "use": "私(Ego)シャツ・あげます矢印・住んでいます錨"},
        "soto_other":         {"hex": "#FF8C00", "name": "Warm Orange",  "use": "他者(Soto)シャツ・くれます矢印・たら因果矢印"},
        "permission_safe":    {"hex": "#009B48", "name": "ISO Green",    "use": "許可・進行・推奨・条件成立・肯定チェック✓"},
        "prohibition_neg":    {"hex": "#D81E05", "name": "ISO Red",      "use": "禁止・警告・否定✗・取り消し線（不透明100%）"},
        "negation_personal":  {"hex": "#CC3333", "name": "Dusky Red",    "use": "個人意志の否定シールド（半透明50%）"},
        "obligation_cmd":     {"hex": "#002FA7", "name": "ISO Blue",     "use": "義務・指示・強制"},
        "question_uncertain": {"hex": "#FFC107", "name": "Amber Yellow", "use": "？マーク・電球・探索・未確定（Sotoオレンジとの衝突回避のため#FF8C00は使わない）"},
        "neutral_base":       {"hex": "#708090", "name": "Slate Gray",   "use": "背景・比較基準・不活性lm・修飾ベース"},
        "highlight_winner":   {"hex": "#FFD700", "name": "Pure Gold",    "use": "勝者・最高値・記憶スタンプ・今日・ハイライト月（例文カード専用）"},
        "vocab_card_accent":  {"hex": "#FAD141", "name": "Amber Gold",   "use": "語彙カード(person等)のアクセントのみ（例文カードには使わない）"},
        "social_constraint":  {"hex": "#E05C2A", "name": "Warm Red",     "use": "社会的規範の引き戻し(わけにはいかない・70%不透明)"},
    },

    "key_rules": {
        "gold_separation": (
            "#FAD141（語彙カードアクセント）と #FFD700（例文カード文法強調）は排他。混在禁止。"
        ),
        "red_3types": (
            "否定の赤3種: "
            "〜ません → 半透明シールド #CC3333(50%) / "
            "〜てはいけません → ISO実線円 #D81E05(100%) / "
            "〜わけにはいかない → 背後引力 #E05C2A(70%)"
        ),
        "orange_separation": (
            "Soto #FF8C00（人物シャツ）と疑問 #FFC107（？記号）は異なる用途。"
            "疑問・未確定の記号には必ず #FFC107 を使う。"
        ),
    }
}

## ────────────────────────────────────────────────────────────
## 2-3. CHARACTER_RENDERING_POLICY（vocab_type別・肌色ルール）
## ────────────────────────────────────────────────────────────

CHARACTER_RENDERING_POLICY = {

    "warm_skin_realistic": {
        "applies_to": ["person", "building", "family"],
        "spec": "STYLE_RECIPE 準拠の 'naturally warm medium skin tone'",
    },

    "neutral_avatar_abstract": {
        "applies_to": [
            "example_sentence", "pronoun", "interjection",
            "set_expression", "adverb", "sensory"
        ],
        "spec": (
            "Gender-neutral minimal avatar. "
            "Neutral light gray or neutral beige skin (#D3D3D3). "
            "No ethnic hairstyle, no culturally specific clothing "
            "except the role-marking shirt color (Ego=teal #008080 / Soto=orange #FF8C00)."
        ),
    },

    "context_dependent": {
        "applies_to": [
            "concrete_object", "action_verb", "adjective",
            "abstract_concept", "spatial_relation", "demonstrative",
            "counter", "time", "transportation", "weather",
            "variant_grid",  # 人物が脇役なら neutral avatar / 人物が主役なら warm skin
        ],
        "spec": "人物が脇役（比較対象として登場）→ neutral avatar。人物が主役 → warm skin。",
    },

    "critical_note": (
        "同一レッスン内で person語彙カード（暖色肌）と example_sentence（グレーアバター）が"
        "混在しても問題ない。前者は職業の学習、後者は文型の学習で認知タスクが異なる。"
        "重要なのは『同じvocab_type内では一貫していること』。"
    )
}


## ============================================================
## §3. FOUNDATIONAL 原則（横断的・全テンプレート共通）
## ============================================================

## ────────────────────────────────────────────────────────────
## 3-1. TRAJECTOR_LANDMARK_PROFILING（全文型共通・誤読防止の中核原則）
## ────────────────────────────────────────────────────────────

TRAJECTOR_LANDMARK_PROFILING = {

    "principle": (
        "テキストなし静止画では『どれが主語(tr)で、どれが背景の参照点(lm)か』を"
        "輪郭線の太さと色彩コントラストで前景化することが誤読を防ぐ中核原則。"
    ),

    "universal_rules": {
        "trajector_profiling": "主格(tr)の輪郭線: BOLD 3.5px。色: ビビッドな原色。",
        "landmark_demotion":   "参照点(lm)の輪郭線: THIN 1.5px。色: 彩度を落とした無彩色（60%不透明度）。",
    },

    "prompt_injection_phrase": (
        "The grammatical SUBJECT ({TRAJECTOR}) must have a BOLD thick outline (3.5px) "
        "and vivid saturated color. "
        "The reference/background element ({LANDMARK}) must have a THIN outline (1.5px) "
        "and muted desaturated gray color (60% opacity). "
        "Maximize the visual contrast between subject and reference."
    ),
}

## ────────────────────────────────────────────────────────────
## 3-2. STROKE_STYLE_SEMANTICS（線種の普遍ルール）
## ────────────────────────────────────────────────────────────

STROKE_STYLE_SEMANTICS = {

    "principle": (
        "実線(Solid) = 存在する既知の物質・確定した事実 /"
        "破線(Dashed) = 未知・疑問・不確実・仮定・変化のプロセス"
    ),

    "solid_line_usage": [
        "確定した人物・物体（通常の語彙カード）",
        "確定した事実の発話バブル（〜と言いました）",
        "高確信度の推論（〜と思います・〜でしょう）",
    ],

    "dashed_line_usage": [
        "疑問代名詞の対象シルエット（だれ・なに・どこ・いつ）",
        "未完了の時制副詞（まだ〜ていません）",
        "仮定条件のフレーム（〜ば の左パネル）",
        "低確信度バブル（〜かもしれません）",
        "ソト境界円（くれます・お父さん等のソト形）",
        "行動結果ゴースト（〜てください の予想結果シルエット）",
    ],
}

## ────────────────────────────────────────────────────────────
## 3-3. GOLDEN_RATIO_LAYOUT（標準構図：縦 20/60/20 分割）
## ────────────────────────────────────────────────────────────

GOLDEN_RATIO_LAYOUT = {

    "principle": "全語彙カード・例文カードのレイアウトを縦3ゾーンで統一する。",

    "vertical_zones": {
        "top_20_percent":    "コンテキスト・記号エフェクト領域（太陽・カレンダー・吹き出し・確信度メーター等）",
        "center_60_percent": "メインアクター / メインオブジェクト領域（tr を最大コントラストで配置）",
        "bottom_20_percent": "修飾インジケータ領域（タイムライン・程度スケール・before/afterアイコン等）",
    },

    "applicability": {
        "strict":   ["example_sentence", "adverb", "time", "pronoun"],
        "flexible": ["person", "concrete_object", "building"],
    },
}

## ────────────────────────────────────────────────────────────
## 3-4. UNIVERSAL_VS_CULTURAL_SYMBOLS（文化安全テーブル）
## ────────────────────────────────────────────────────────────

UNIVERSAL_VS_CULTURAL_SYMBOLS = {

    "universal_safe": {
        "vector_arrow":       "方向・指示・移動・変化（太さと色で定義を厳密化）",
        "facial_expressions": "喜び・悲しみ・驚き等の基本感情",
        "question_exclaim":   "？と！（グローバルに浸透した情報探索記号）",
        "scale_battery_bar":  "充填率による程度・量の表現",
    },

    "culture_dependent_rules": {
        "bowing_angle": {
            "15_degrees": "挨拶（おはようございます等）",
            "30_degrees": "丁寧（よろしくおねがいします・おじゃまします）",
            "45_degrees": "謝罪・深い敬意（すみません）",
            "rule": "お辞儀を描く全画像でこの角度規格を明示的にプロンプト指定する。"
        },
        "gassho_hands": "眼前に和食トレイを必ず配置し『日本の食前マナー』として文脈固定",
        "nose_pointing_watashi": "鼻を指すジェスチャー + 自身へ向かうカーブ矢印を必ず重畳",
        "x_o_marks": "色情報を必須併用（赤=否定/✗、緑=肯定/✓）。記号単独で意味を担わせない。",
    },
}

## ────────────────────────────────────────────────────────────
## 3-5. ADVERB_ANCHOR_PRINCIPLE（副詞の必須アンカー原則）
## ────────────────────────────────────────────────────────────

ADVERB_ANCHOR_PRINCIPLE = {

    "principle": (
        "副詞は単独で意味が完結しない。視覚化では必ず"
        "『ベースとなる動作・状態（被修飾語=アンカー）』を固定し、"
        "その量・頻度・様態・時間軸上の位置を記号的に重ね合わせる。"
    ),

    "mandatory_rule": (
        "ADVERB_FRAMES の全エントリで、修飾対象（アンカー）を必ず描画する。"
        "  程度副詞: アンカー物体 + 評価バー"
        "  頻度副詞: アンカー動作 + カレンダーグリッド"
        "  様態副詞: アンカー動作 + 様態記号（速度線・Shh等）"
        "  時制副詞: アンカー動作 + タイムライン位置"
    ),

    "default_anchors": {
        "degree":    "「スープを飲んで熱いと感じる人物」",
        "frequency": "「ジョギングをする人物」",
        "manner":    "「走る/歩く人物」または「部屋の中の様子」",
        "temporal":  "「ご飯を食べる」アクション（タイムライン上に配置）"
    },
}


## ============================================================
## §4. テンプレートA〜T（語彙カード・vocab_type別）
## ============================================================
##
## 【vocab_type → テンプレート 対応表（完全版）】
##
##   A: person           → vocabulary_person
##   B: building         → vocabulary_building
##   C: example_sentence → GRAMMAR_PATTERNS_C を参照 (§5)
##   D: concrete_object  → vocabulary_object_concrete
##   E: variant_grid     → vocabulary_variant_grid
##   F: spatial_relation → spatial_relation
##   G: demonstrative    → demonstrative_kosoado
##   H: action_verb      → action_verb
##   I: abstract_concept → abstract_concept
##   J: adjective        → vocabulary_adjective
##   K: pronoun          → PRONOUN_FRAMES
##   L: interjection     → INTERJECTION_FRAMES
##   M: set_expression   → SET_EXPR_FRAMES
##   N: adverb           → ADVERB_FRAMES（18エントリ・本ファイル§4に定義済み）
##   O: counter          → COUNTER_FRAMES
##   P: time             → TIME_FRAMES
##   Q: transportation   → TRANSPORT_FRAMES
##   R: family           → FAMILY_FRAMES（8エントリ・本ファイル§4に定義済み）
##   S: weather          → WEATHER_FRAMES
##   T: sensory          → SENSORY_FRAMES
##
## 【完成プロンプトの作り方】
##   テンプレートK〜T および §5 の場合（§0 の手順1を参照）:
##
##   例（テンプレートK・わたし）:
##   ---
##   Minimalist flat vector illustration. Clean continuous black outlines ...
##   [STYLE_RECIPE全文]
##   Gender-neutral avatar, neutral light gray skin (#D3D3D3).
##
##   Single person centered, facing camera directly. Their right index finger
##   points toward their own nose/face. A curved self-referential arrow loops
##   from the person back to themselves.
##
##   No words, no letters, no readable labels. Simple visual symbols are allowed:
##   arrows, checkmark (✓), ...
##   [TEXT_POLICY_B全文]
##   ---
##
##   テンプレートA〜Jの場合は §0 手順2（v2.5テンプレの置換方式）を参照。
##
## ============================================================

## ── テンプレートA〜J（v2.5 準拠・STYLE_RECIPE は §1 確定版に差し替えること） ──
##
## これらのテンプレートは v2.5 の PROMPT_TEMPLATES に定義されている。
## プロンプト生成時は v2.5 の該当テンプレートを参照し、
## [STYLE RECIPE] ブロックを §1 の STYLE_RECIPE（hex値なし確定版）に置き換えること。
##
## TEXT_POLICY の適用（§1 の定義に従う）:
##   TEXT_POLICY_A: A (person), B (building), D (concrete_object), E (variant_grid),
##                  I (abstract_concept), Q (transportation), R (family)
##                  ※ H (action_verb) も A だが矢印・motion_line は CONSTRAINTS で許可
##   TEXT_POLICY_B: F (spatial_relation), G (demonstrative), H (action_verb),
##                  J (adjective), K (pronoun), L (interjection), M (set_expression),
##                  N (adverb), T (sensory)
##                  ※ S (weather) は名詞→A / 体感形容詞→B で使い分け
##   TEXT_POLICY_C: O (counter), P (time)
##
## 以下はテンプレートK〜T（v2.6 新規）の本体を定義する。

## ── テンプレートK: PRONOUN_FRAMES（代名詞） ──
## TEXT_POLICY: TEXT_POLICY_B

PRONOUN_FRAMES = {

    "watashi": {
        "label": "わたし（I / 1人称）",
        "prompt_core": (
            "Single person centered, facing camera directly. "
            "Their right index finger points toward their own nose/face. "
            "A curved self-referential arrow loops from the person back to themselves. "
            "Solid white background, no other characters."
        ),
    },

    "anata": {
        "label": "あなた（You / 2人称）",
        "prompt_core": (
            "TWO characters: LEFT speaker in 3/4 side view, "
            "index finger pointing directly at RIGHT character. "
            "RIGHT listener facing forward with a highlight focus ring around them. "
            "A bold straight arrow from speaker to listener."
        ),
    },

    "kare": {
        "label": "かれ（He / 3人称男性）",
        "prompt_core": (
            "THREE characters: FOREGROUND: two characters (speaker left, listener right) conversing. "
            "BACKGROUND CENTER: a male figure slightly apart, highlighted with a focus ring. "
            "A dotted arrow from the speaker points toward the background male figure."
        ),
    },

    "kanojo": {
        "label": "かのじょ（She / 3人称女性）",
        "prompt_core": (
            "Same layout as 'kare'. "
            "BACKGROUND CENTER: a female figure (distinct hairstyle) slightly apart, highlighted. "
            "Dotted arrow from speaker."
        ),
    },

    "minna": {
        "label": "みんな（Everyone）",
        "prompt_core": (
            "4-5 diverse character silhouettes spread across the frame, all facing inward. "
            "A soft dashed circular boundary encloses all figures. "
            "Characters vary in size and hairstyle to show diversity."
        ),
    },

    "dare": {
        "label": "だれ（Who / 疑問代名詞：人）",
        "prompt_core": (
            "A person-shaped blank silhouette with DASHED outline (unknown identity). "
            "A large bold '?' symbol positioned at head level inside the silhouette. "
            "Small searching character on the side looking toward the silhouette."
        ),
    },

    "nani": {
        "label": "なに（What / 疑問代名詞：物）",
        "prompt_core": (
            "An object-shaped blank silhouette with DASHED outline. "
            "A large '?' symbol inside the silhouette. "
            "Person leaning toward the mystery object, looking curiously."
        ),
    },

    "doko": {
        "label": "どこ（Where / 疑問代名詞：場所）",
        "prompt_core": (
            "A simplified map or abstract space layout. "
            "A location pin with DASHED outline and '?' symbol at an uncertain spot. "
            "Person looking at the map with hand shading eyes (searching gesture)."
        ),
    },

    "itsu": {
        "label": "いつ（When / 疑問代名詞：時）",
        "prompt_core": (
            "A clock face where the hands are replaced by a large '?' symbol. "
            "Or a calendar grid where the specific date cell shows '?' instead of a number."
        ),
    },
}

## ── テンプレートL: INTERJECTION_FRAMES（感動詞） ──
## TEXT_POLICY: TEXT_POLICY_B

INTERJECTION_FRAMES = {

    "hai_ee": {
        "label": "はい・ええ（肯定）",
        "prompt_core": (
            "Person with a gentle smile, mouth slightly open. "
            "Short vertical motion lines above head to show nodding. "
            "A speech bubble from mouth containing a large GREEN CHECKMARK ✓."
        ),
    },

    "iie": {
        "label": "いいえ（否定）",
        "prompt_core": (
            "Person with slightly furrowed brows, "
            "one hand raised palm-outward in front of face. "
            "Horizontal motion lines beside head to show head-shaking. "
            "A speech bubble containing a large RED CROSS ✗."
        ),
    },

    "a_aa": {
        "label": "あ・ああ（発見・驚き）",
        "prompt_core": (
            "Person with wide eyes and small round open mouth (discovery expression). "
            "Above head: a yellow lightbulb or bold '!' exclamation icon. "
            "Eyes directed upward-diagonally toward something just discovered."
        ),
    },

    "oo_sugoi": {
        "label": "おー・すごい（感嘆・称賛）",
        "prompt_core": (
            "Person with hands clasped together, star-gleam eyes, and widely open 'O'-shaped mouth in awe. "
            "Sparkling star particles/diamond shapes raining down from above."
        ),
    },

    "naruhodo": {
        "label": "なるほど（納得・理解の完了）",
        "prompt_core": (
            "Person with a knowing expression (eyes slightly narrowed), "
            "one index finger raised and touching palm of other hand. "
            "Behind head: wavy confused lines transitioning to a clean straight arrow "
            "(from confusion to clarity)."
        ),
    },

    "sou_desu_ka": {
        "label": "そうですか（聞き取り・受容）",
        "prompt_core": (
            "Person in a slightly forward-leaning listening posture, "
            "mouth in a neutral straight line, eyes focused on an implied speaker. "
            "A speech bubble containing a wavy acknowledgment line or small ◎."
        ),
    },

    "sumimasen": {
        "label": "すみません（謝罪・呼びかけ）",
        "prompt_core": (
            "Person in a slight bow (45 degrees forward). "
            "A speech bubble containing a small heart with a crack line (apology), "
            "or an exclamation mark (attention-getting)."
        ),
    },
}

## ── テンプレートM: SET_EXPR_FRAMES（定型表現） ──
## TEXT_POLICY: TEXT_POLICY_B
## 注意: カメラアングル・文化的注意事項は SET_EXPR_CAMERA_ANGLES / SET_EXPR_CULTURAL_NOTES を参照

SET_EXPR_FRAMES = {

    "ohayou_gozaimasu": {
        "label": "おはようございます",
        "prompt_core": (
            "SCENE: morning setting with sunlight through a window (yellow-orange sunrise icon top-left). "
            "TWO characters: one doing a slight 15-degree bow greeting, the other responding with a smile."
        ),
    },

    "itadakimasu": {
        "label": "いただきます",
        "prompt_core": (
            "SCENE: dining table with a simple meal (bowl/plate with steam rising). "
            "Person(s) in HANDS-TOGETHER prayer/gratitude gesture (itadakimasu pose) before eating. "
            "Chopsticks + fork icon or steam cloud."
        ),
    },

    "gochisousama_deshita": {
        "label": "ごちそうさまでした",
        "prompt_core": (
            "SCENE: dining table with EMPTY clean dishes (meal finished). "
            "Chopsticks returned to chopstick rest. "
            "Person with a satisfied gentle smile."
        ),
    },

    "yoroshiku_onegaishimasu": {
        "label": "よろしくおねがいします",
        "prompt_core": (
            "SCENE: formal introduction or handover context. "
            "Person doing a 30-degree bow, both hands presenting a document or card. "
            "The other person receiving with a respectful posture."
        ),
    },

    "otsukaresama_desu": {
        "label": "おつかれさまです",
        "prompt_core": (
            "SCENE: end-of-workday setting (late afternoon light). "
            "Person in work clothes putting on a coat to leave. "
            "Another person nearby acknowledging with a nod."
        ),
    },

    "ojama_shimasu": {
        "label": "おじゃまします",
        "prompt_core": (
            "SCENE: at the entrance threshold of someone else's home or office. "
            "Person at the doorway doing a slight bow before stepping inside. "
            "Shoe removal area (genkan / step difference) clearly visible."
        ),
    },
}

SET_EXPR_CAMERA_ANGLES = {
    "ohayou_gozaimasu":       "対面アイレベル（15度お辞儀 + 朝日窓）",
    "itadakimasu":            "俯瞰（テーブル面から真上 / 和食セット全体）",
    "gochisousama_deshita":   "俯瞰（同上 / 空の食器・箸置きに戻った箸）",
    "yoroshiku_onegaishimasu":"対面ウェストショット（30度お辞儀 / 両手で資料差し出し）",
    "otsukaresama_desu":      "対面ミディアム（夕方背景 + 退勤者がコート着用）",
    "ojama_shimasu":          "斜め俯瞰（玄関口 / 靴脱ぎ場・段差が見える角度）",
}

## ── テンプレートN: ADVERB_FRAMES（副詞） ──
## TEXT_POLICY: TEXT_POLICY_B（程度・頻度・様態）/ TEXT_POLICY_C（時制副詞でカレンダー数字が必要な場合）
## 注意: 副詞アンカー必須（ADVERB_ANCHOR_PRINCIPLE §3-5参照）

ADVERB_FRAMES = {

    ## ─── 程度副詞 ───
    "totemo_very": {
        "label": "とても（very / 高い程度）", "adverb_type": "degree",
        "prompt_core": (
            "Degree meter bar at 90-100%. "
            "{ANCHOR_OBJECT} in an exaggerated version of the described property. "
            "A bold upward arrow pressing the meter to maximum."
        ),
    },
    "sukoshi_little": {
        "label": "すこし（a little / 低い程度）", "adverb_type": "degree",
        "prompt_core": (
            "Degree meter bar at only 20-30%. "
            "{ANCHOR_OBJECT} in a subtle/slight version of the described property."
        ),
    },
    "amari_nai": {
        "label": "あまり〜ない（not much / 度合い文脈）", "adverb_type": "degree",
        "prompt_core": (
            "Degree meter bar at 20-30% with a faint cross-line or low marker. "
            "{ANCHOR_OBJECT} barely showing the property."
        ),
    },
    "zenzen_nai": {
        "label": "ぜんぜん〜ない（not at all / 度合い文脈）", "adverb_type": "degree",
        "prompt_core": (
            "Degree meter bar at 0%. A red ✗ badge on the empty meter. "
            "{ANCHOR_OBJECT} showing none of the property."
        ),
    },
    "motto_more": {
        "label": "もっと（more）", "adverb_type": "degree",
        "prompt_core": (
            "{ANCHOR_OBJECT} currently at a MID-LEVEL state. Degree meter at 50-60%. "
            "A bold UPWARD CHEVRON (》) or thick upward arrow pushing beyond the current value."
        ),
    },

    ## ─── 頻度副詞 ───
    "itsumo_always": {
        "label": "いつも（always）", "adverb_type": "frequency",
        "prompt_core": (
            "7-cell calendar grid. ALL 7 cells contain the activity icon. "
            "A circular repeat arrow below the grid."
        ),
    },
    "yoku_often": {
        "label": "よく（often / 5〜6回程度）", "adverb_type": "frequency",
        "prompt_core": (
            "7-cell calendar grid. 5-6 cells contain the activity icon. 1-2 cells empty."
        ),
    },
    "tamani_rarely": {
        "label": "たまに（rarely / 1〜2回程度）", "adverb_type": "frequency",
        "prompt_core": (
            "7-cell calendar grid. Only 1 randomly placed cell contains the activity icon. "
            "6 cells are empty light gray."
        ),
    },
    "amari_frequency": {
        "label": "あまり〜ない（not much / 頻度文脈）", "adverb_type": "frequency",
        "prompt_core": (
            "7-cell calendar grid. Only 1 cell has the activity icon. "
            "A small ✗ or low-opacity overlay on that cell. 5-6 cells empty gray."
        ),
    },
    "zenzen_frequency": {
        "label": "ぜんぜん〜ない（not at all / 頻度文脈）", "adverb_type": "frequency",
        "prompt_core": (
            "7-cell calendar grid. ALL 7 cells empty gray. "
            "A single red ✗ badge overlaid on the entire grid."
        ),
    },

    ## ─── 様態副詞 ───
    "yukkuri_slowly": {
        "label": "ゆっくり（slowly）", "adverb_type": "manner",
        "prompt_core": (
            "{ACTOR} performing {ACTION} at a slow pace. "
            "Only 1-2 thin, widely-spaced motion trail lines behind the moving part. "
            "Motion arc is long and gradual."
        ),
    },
    "hayaku_quickly": {
        "label": "はやく（quickly）", "adverb_type": "manner",
        "prompt_core": (
            "{ACTOR} performing {ACTION} at high speed. "
            "5-8 dense bold speed lines behind the moving part. "
            "2-3 ghost motion trails at decreasing opacity."
        ),
    },
    "shizuka_ni_quietly": {
        "label": "静かに（quietly）", "adverb_type": "manner",
        "prompt_core": (
            "Person performing {QUIET_ACTION} with a 'Shh' gesture (index finger to lips). "
            "A crossed-out speaker icon near any sound source. "
            "Only 1-2 thin, sparse motion trail lines."
        ),
    },
    "nigiyaka_ni_noisily": {
        "label": "にぎやかに（noisily）", "adverb_type": "manner",
        "prompt_core": (
            "Person in an energetic open-arms gesture. "
            "Colorful music notes (multiple colors and sizes) bursting from a speaker icon. "
            "Multiple star/asterisk sparks flying outward."
        ),
    },

    ## ─── 時制副詞 ───
    "mou_already": {
        "label": "もう（already）", "adverb_type": "temporal",
        "prompt_core": (
            "A short timeline from left (past) to right (now). "
            "A green checkmark stamp sits LEFT of the 'now' marker. "
            "Person in a relaxed/completed posture."
        ),
    },
    "mada_not_yet": {
        "label": "まだ〜ていません（not yet）", "adverb_type": "temporal",
        "prompt_core": (
            "Timeline from left (past) to right (future). "
            "An empty dashed circle sits RIGHT of the 'now' marker. "
            "Person in a waiting or preparation posture."
        ),
    },
    "korekara_from_now": {
        "label": "これから（from now on）", "adverb_type": "temporal",
        "prompt_core": (
            "Timeline from left (past) to right (future). "
            "A bold forward-pointing arrow starts FROM the 'now' marker going RIGHTWARD. "
            "Person in a departing/starting posture."
        ),
    },
    "sakki_a_while_ago": {
        "label": "さっき（a short while ago）", "adverb_type": "temporal",
        "prompt_core": (
            "Timeline. Activity icon placed IMMEDIATELY LEFT of the 'now' marker. "
            "A short leftward arrow with a tiny clock indicating minimal elapsed time. "
            "No checkmark (contrast with 'mou')."
        ),
    },
}

## ── テンプレートO: COUNTER_FRAMES（助数詞） ──
## TEXT_POLICY: TEXT_POLICY_C（数字は教育目的で許可）
## 注意: COUNTER_SUBITIZING_PRINCIPLE を適用すること（3〜4個・重なりなし）

COUNTER_FRAMES = {

    "_subitizing_rule": (
        "全助数詞に適用: Arrange exactly 3 (or 4) objects with NO OVERLAP, "
        "evenly spaced in a grid or isometric layout (subitizing-optimized). "
        "No object should obscure another."
    ),

    "hon_long_thin": {
        "label": "〜本（細長いもの）",
        "prompt_core": (
            "{N} {LONG_THIN_OBJECT}s (e.g., pencils/bottles) arranged side by side vertically. "
            "A small counter badge showing [{OBJECT_ICON} × {N}] in the corner."
        ),
    },
    "mai_flat": {
        "label": "〜枚（薄いもの）",
        "prompt_core": (
            "{N} {FLAT_OBJECT}s fanned out or stacked with slight offset showing multiple layers. "
            "Counter badge [{OBJECT_ICON} × {N}]."
        ),
    },
    "satsu_bound": {
        "label": "〜冊（本・ノート）",
        "prompt_core": (
            "{N} {BOUND_OBJECT}s arranged in a small stack or row, spines visible. "
            "Counter badge [{OBJECT_ICON} × {N}]."
        ),
    },
    "hiki_small_animal": {
        "label": "〜匹（小動物）",
        "prompt_core": (
            "{N} {SMALL_ANIMAL}s in simple sitting or standing poses, arranged in a row. "
            "Counter badge [{ANIMAL_ICON} × {N}]."
        ),
    },
    "tou_large_animal": {
        "label": "〜頭（大型動物）",
        "prompt_core": (
            "{N} {LARGE_ANIMAL}s (simplified silhouettes) arranged with scale cues. "
            "Counter badge [{ANIMAL_ICON} × {N}]."
        ),
    },
    "dai_machine": {
        "label": "〜台（機械・乗り物）",
        "prompt_core": (
            "{N} {MACHINE_OBJECT}s in canonical view, arranged in a row. "
            "Counter badge [{MACHINE_ICON} × {N}]."
        ),
    },
    "ko_small_object": {
        "label": "〜個（小さな個体）",
        "prompt_core": (
            "{N} {ROUND_OBJECT}s arranged naturally (e.g., in a bowl or in a row). "
            "Counter badge [{OBJECT_ICON} × {N}]."
        ),
    },
    "hai_cup": {
        "label": "〜杯（カップ）",
        "prompt_core": (
            "{N} cups/bowls of {CONTENT} in a row. Steam lines if hot. "
            "Counter badge [{CUP_ICON} × {N}]."
        ),
    },
}

## ── テンプレートP: TIME_FRAMES（時間語彙） ──
## TEXT_POLICY: TEXT_POLICY_C（カレンダー数字・時刻数字は許可）

TIME_FRAMES = {

    "youbi_weekday": {
        "label": "〜曜日（曜日）",
        "prompt_core": (
            "A 7-cell horizontal calendar bar (Mon-Sun). Target day cell highlighted in gold. "
            "Each cell contains a nature element pictogram (no text): "
            "Mon=crescent moon, Tue=flame, Wed=water drop, Thu=tree, "
            "Fri=coin/star, Sat=hill, Sun=sun circle."
        ),
    },
    "tsuki_month": {
        "label": "〜月（月）",
        "prompt_core": (
            "A circular calendar wheel divided into 12 equal sectors. "
            "Target month sector highlighted in gold with a tiny seasonal symbol inside. "
            "Other sectors in light gray."
        ),
    },
    "kisetsu_season": {
        "label": "春・夏・秋・冬（季節）",
        "prompt_core": (
            "Circular 4-quadrant wheel: "
            "Spring (pink #FFB7C5) = cherry blossom, "
            "Summer (gold #FFD700) = sunflower, "
            "Autumn (brown #D2691E) = maple leaf, "
            "Winter (light blue #87CEEB) = snowflake. "
            "Target season at full opacity; others at 40%."
        ),
    },
    "jikan_clock": {
        "label": "〜時・〜分（時刻）",
        "prompt_core": (
            "Clock face in muted neutral gray at 70% opacity. "
            "Hour hand and minute hand pointing to {TIME} highlighted in bold cyan or red. "
            "Minute sector filled with a semi-transparent color wedge."
        ),
    },
    "kyou_ashita_kinou": {
        "label": "今日・明日・昨日（相対的日付）",
        "prompt_core": (
            "3 calendar cells in a row: "
            "LEFT (yesterday): light blue with leftward arrow. "
            "CENTER (today): gold outline with downward pointer. "
            "RIGHT (tomorrow): light green with rightward arrow."
        ),
    },
    "raishuu_senshuu": {
        "label": "来週・先週（相対的な週）",
        "prompt_core": (
            "3-row calendar grid (each row = 7 days). "
            "TOP ROW (last week): light blue with ↑ arrow. "
            "MIDDLE ROW (this week): grayed out. "
            "BOTTOM ROW (next week): light green with ↓ arrow."
        ),
    },
    "mainichi_every_day": {
        "label": "毎日（every day）",
        "prompt_core": (
            "7-cell calendar grid with the SAME activity icon in EVERY cell. "
            "A circular cycle arrow below the grid."
        ),
    },
    "jikantai_time_of_day": {
        "label": "朝・昼・夜・午前・午後（時間帯）",
        "prompt_core": (
            "A semicircular arc representing the day cycle. "
            "Sun icon at the appropriate position: LEFT=morning, TOP=noon, RIGHT=evening. "
            "For 午前/午後: LEFT half gold, RIGHT half indigo."
        ),
    },
    "goro_approximately": {
        "label": "〜ごろ（約・おおよその時刻）",
        "prompt_core": (
            "Clock face with hands pointing to {APPROXIMATE_TIME}. "
            "Around the hand tip: 2-3 concentric fuzzy arcs (ripple lines) showing time ambiguity range."
        ),
    },
}

## ── テンプレートQ: TRANSPORT_FRAMES（交通手段） ──
## TEXT_POLICY: TEXT_POLICY_A

TRANSPORT_FRAMES = {

    "densha_train": {
        "label": "電車（在来線）",
        "prompt_core": (
            "COMMUTER TRAIN in 3/4 front angle view. "
            "On top: a pantograph (zigzag current collector) touching overhead electric wires. "
            "Below: two steel rails on gravel ballast. "
            "Overhead wire poles visible beside the track. "
            "Regular train car with multiple sliding doors."
        ),
    },
    "shinkansen_bullet": {
        "label": "新幹線",
        "prompt_core": (
            "SHINKANSEN (bullet train) in dramatic 3/4 front angle. "
            "Distinctive AERODYNAMIC LONG NOSE on the front car. "
            "No overhead wires (clean roof). Running on an elevated concrete viaduct. "
            "Bold horizontal speed lines in the background."
        ),
    },
    "chikatetsu_subway": {
        "label": "地下鉄",
        "prompt_core": (
            "SUBWAY TRAIN emerging from a circular concrete tunnel opening. "
            "The tunnel interior is dark charcoal gray with headlights illuminating the space. "
            "NO overhead wires on the roof. Dark atmospheric background."
        ),
    },
    "basu_bus": {
        "label": "バス",
        "prompt_core": (
            "CITY BUS in 3/4 front angle. "
            "Multiple large sliding/folding passenger doors visible on the side. "
            "Large front windshield. Two side mirrors extending from front."
        ),
    },
    "takushi_taxi": {
        "label": "タクシー",
        "prompt_core": (
            "TAXI in side profile view. "
            "Roof-mounted illuminated sign (あんどん / vacancy display). "
            "Checker stripe or pattern along the lower body. "
            "4-door sedan shape clearly different from private cars."
        ),
    },
    "kuruma_car": {
        "label": "車（自動車）",
        "prompt_core": (
            "PRIVATE CAR in side profile view. "
            "No roof sign, no checker pattern (contrasting with taxi). "
            "Clean sedan or hatchback silhouette. "
            "Driver visible through windshield."
        ),
    },
    "jitensha_bicycle": {
        "label": "自転車",
        "prompt_core": (
            "BICYCLE in side profile view. "
            "Frame, two wheels, handlebars, and seat clearly visible. "
            "Optional: front basket or rear rack."
        ),
    },
    "hikoki_airplane": {
        "label": "飛行機",
        "prompt_core": (
            "AIRPLANE in side profile with wings clearly showing. "
            "Tail fin with geometric pattern. Engines under wings or on tail."
        ),
    },
    "fune_ship": {
        "label": "船（ふね）",
        "prompt_core": (
            "FERRY or CARGO SHIP in side profile view. "
            "Hull, deck, and superstructure clearly visible. "
            "Water line at the base."
        ),
    },
}

## ── テンプレートR: FAMILY_FRAMES（家族語彙） ──
## TEXT_POLICY: TEXT_POLICY_A
## 注意: ウチ形（自分の家族）とソト形（相手の家族）で構図が異なる

FAMILY_FRAMES = {

    "_uchi_soto_rule": (
        "ウチ形（父・母・兄・弟等）: 実線暖色バブル内に Ego と家族が両方存在。"
        "ソト形（お父さん・お母さん等）: Ego がバブル外のグレーゾーンにいて外側から参照。"
    ),

    "chichi_my_father": {
        "label": "父（ちち / 自分の父）", "form": "uchi",
        "prompt_core": (
            "Inside warm solid-line uchi bubble: "
            "a middle-aged male figure (casual home clothes, warm smile) "
            "standing beside a shorter Ego. "
            "1:0.75 height ratio (father taller). Both inside the same warm bubble."
        ),
    },
    "otousan": {
        "label": "お父さん（相手の父への敬意）", "form": "soto",
        "prompt_core": (
            "LEFT: Ego OUTSIDE bubble in a respectful slight bow. "
            "RIGHT: dashed cool-gray bubble containing a middle-aged male figure (father of Soto). "
            "Ego's bow directed toward the dashed bubble."
        ),
    },
    "haha_my_mother": {
        "label": "母（はは / 自分の母）", "form": "uchi",
        "prompt_core": (
            "Inside warm uchi bubble: "
            "a middle-aged female figure (warm casual clothes) "
            "standing beside a shorter Ego. "
            "Both inside the same warm bubble."
        ),
    },
    "okaasan": {
        "label": "お母さん（相手の母への敬意）", "form": "soto",
        "prompt_core": (
            "Same soto layout as otousan. "
            "Dashed bubble: middle-aged female figure (mother of Soto)."
        ),
    },
    "ani_my_elder_brother": {
        "label": "兄（あに / 自分の兄）", "form": "uchi",
        "prompt_core": (
            "Inside warm uchi bubble: a taller older male figure "
            "gently placing a hand on the shoulder of shorter Ego. "
            "1:0.75 height ratio clearly visible."
        ),
    },
    "ane_my_elder_sister": {
        "label": "姉（あね / 自分の姉）", "form": "uchi",
        "prompt_core": (
            "Inside warm uchi bubble: a taller older FEMALE figure "
            "(smart casual, longer hairstyle to distinguish from male 'ani') "
            "gently placing a hand on shoulder of shorter Ego. 1:0.75 height ratio."
        ),
    },
    "otouto_my_younger_brother": {
        "label": "弟（おとうと / 自分の弟）", "form": "uchi",
        "prompt_core": (
            "Inside warm uchi bubble: Ego (taller) with a shorter younger male character beside them. "
            "Younger brother in casual youth clothing. Rounder head shape. 1:0.75 height ratio (Ego taller)."
        ),
    },
    "imouto_my_younger_sister": {
        "label": "妹（いもうと / 自分の妹）", "form": "uchi",
        "prompt_core": (
            "Inside warm uchi bubble: Ego (taller) with a shorter younger FEMALE character beside them. "
            "Younger sister in cute child-style clothing, feminine hairstyle hint. "
            "1:0.75 height ratio (Ego taller)."
        ),
    },
}

## ── テンプレートS: WEATHER_FRAMES（天気・自然） ──
## TEXT_POLICY: TEXT_POLICY_A（名詞天気）/ TEXT_POLICY_B（体感形容詞）

WEATHER_FRAMES = {

    "ame_rain": {
        "label": "雨（あめ）", "pos": "noun",
        "prompt_core": (
            "Multiple diagonal rain streaks falling from the upper area. "
            "An umbrella held by a person or placed open on the ground. "
            "Wet ground with small puddle reflections."
        ),
    },
    "kaze_wind": {
        "label": "風（かぜ）", "pos": "noun",
        "prompt_core": (
            "Parallel horizontal stream curves (wind lines) sweeping left to right. "
            "A single tree on the left bending sharply to the right. "
            "Scattered flying leaves (5-7 icons) in the air moving rightward."
        ),
    },
    "yuki_snow": {
        "label": "雪（ゆき）", "pos": "noun",
        "prompt_core": (
            "Various sizes of white circles and 6-pointed snowflake icons falling from top. "
            "A white snow accumulation layer building up on the ground. "
            "Soft blue-gray background to enhance snow visibility."
        ),
    },
    "hare_sunny": {
        "label": "晴れ（はれ）", "pos": "noun",
        "prompt_core": (
            "A clear golden yellow sun icon with uniform rays. "
            "Light blue sky background. No clouds. "
            "Optional: person in short sleeves enjoying sunshine."
        ),
    },
    "kumori_cloudy": {
        "label": "曇り（くもり）", "pos": "noun",
        "prompt_core": (
            "Multiple overlapping gray cloud icons covering most of the frame. "
            "No sun visible. Light gray background."
        ),
    },
    "taifuu_typhoon": {
        "label": "台風（たいふう）", "pos": "noun",
        "prompt_core": (
            "Large spiral/swirl icon in the center (storm system). "
            "Heavy rain streaks and bold wind stream lines. "
            "A broken inside-out umbrella on the ground showing intensity. "
            "Dark dramatic sky background."
        ),
    },
    "atsui_hot": {
        "label": "暑い（あつい）", "pos": "adjective",
        "prompt_core": (
            "A large distorted red sun icon at the top. "
            "Person fanning themselves vigorously with a uchiwa fan, flushed cheeks (diagonal lines), "
            "sweat drops flying from forehead. "
            "Warm reddish-orange ambient overlay in background."
        ),
    },
    "samui_cold": {
        "label": "寒い（さむい）", "pos": "adjective",
        "prompt_core": (
            "Blue-lavender cool background. "
            "Person hugging themselves tightly (arms crossed), hunched posture. "
            "White breath vapor (2-3 wavy lines) from their mouth. "
            "Double outline silhouette showing shivering."
        ),
    },
}

## ── テンプレートT: SENSORY_FRAMES（感覚語彙） ──
## TEXT_POLICY: TEXT_POLICY_B

SENSORY_FRAMES = {

    "_key_distinction": {
        "active_perception":  "「見ます・聞きます」: 人物が能動的に対象へ向かう。視線/矢印が人物→対象。",
        "passive_perception": "「見えます・聞こえます」: 対象→人物へ信号が自然に届く。人物は別の活動中。",
        "emission_model":     "「〜がします」: 対象物から感覚シグナルが自発的に放出される。",
    },

    "mimasu_actively_look": {
        "label": "見ます（能動的・意図的に見る）",
        "prompt_core": (
            "Person facing directly toward {VIEWED_OBJECT}, eyes wide open in focused attention. "
            "Bold yellow light-beam lines shoot FROM the person's eyes TO {VIEWED_OBJECT}. "
            "Forward-leaning posture showing intentional focus."
        ),
    },
    "miemasu_can_see": {
        "label": "見えます（受動的・自発的に目に入る）",
        "prompt_core": (
            "Person engaged in ANOTHER ACTIVITY (reading, walking) facing AWAY. "
            "Through a window/opening: {VISIBLE_OBJECT}. "
            "Semi-transparent light cone lines flow PASSIVELY from the object INTO person's eyes. "
            "Person's expression: neutral, not actively looking."
        ),
    },
    "kikimasu_actively_listen": {
        "label": "聞きます（能動的・意図的に聞く）",
        "prompt_core": (
            "Person turning head toward {SOUND_SOURCE}, hand cupped behind ear. "
            "A bold direct arrow from {SOUND_SOURCE} to the person's ear."
        ),
    },
    "kikoemasu_can_hear": {
        "label": "聞こえます（受動的・自発的に耳に入る）",
        "prompt_core": (
            "Person engaged in ANOTHER ACTIVITY (reading, phone) facing AWAY from sound source. "
            "BACKGROUND: {SOUND_SOURCE}. "
            "Concentric pastel-blue sound wave rings radiating FROM the source TO person's ear. "
            "A tiny sparkle icon at the ear tip."
        ),
    },
    "oto_ga_shimasu": {
        "label": "〜音がします（音の自発的放出）",
        "prompt_core": (
            "CENTER: {SOUND_SOURCE}. "
            "Colorful music notes and concentric sound wave arcs radiating outward from the source. "
            "Optional: nearby person with neutral expression, small sound wave at their ear."
        ),
    },
    "nioi_ga_shimasu": {
        "label": "〜においがします（匂いの自発的放出）",
        "prompt_core": (
            "CENTER: {SCENT_SOURCE}. "
            "3 gently wavy semi-transparent pink/green lines rising upward (aroma streams). "
            "Small sparkle stars and heart icons floating around the aroma streams."
        ),
    },
    "aji_ga_shimasu": {
        "label": "〜味がします（味の自発的感覚）",
        "prompt_core": (
            "Person taking a bite of {FOOD_ITEM}. "
            "Flushed pink cheeks, star/heart-shaped eyes showing taste sensation. "
            "Small sparkle pops around the mouth/tongue area."
        ),
    },
}


## ============================================================
## §5. GRAMMAR_PATTERNS_C（例文画像・文法パターン別戦略）
## 合計 41 エントリ（v2.6 本体36件 + ADDITIONS 5件を統合）
## アスペクト比: 16:9
## TEXT_POLICY: TEXT_POLICY_B（例文画像は記号・矢印を多用するため）
##              ※ GRAMMAR_PATTERNS_C に時間文型は含まれないため TEXT_POLICY_C の適用なし
## ============================================================
##
## 【使い方】
##   1. lesson_NN.json の patterns[].examples[].grammarConcept を確認する
##   2. 下記のキーと照合して戦略を選択する
##   3. STYLE_RECIPE + uses_unified_char の判定 + prompt_core を組み立てる
##   4. hard_limit=True の文型は必ず rescue_layout（2コマ/3コマ）を使用する
##
## 【〜ています 3種の識別】
##   "teimasu_progressive"     → progressive_teimasu（動作進行中）
##   "teimasu_resultant_state" → progressive_state_teimasu（完了後の結果状態）
##   "teimasu_habitual"        → habitual_teimasu（習慣・恒常状態・職業）
##
## ============================================================

GRAMMAR_PATTERNS_C = {

    ## ─── GROUP 1: L1〜L5 基本文型 ───

    "noun_predicate_affirmative": {
        "label": "NはNです（等号・定義）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Flat vector illustration. {PERSON_DESCRIPTION} on the left. "
            "On the right, a soft green semi-transparent rounded Boundary Frame labeled with "
            "attribute icons representing {CATEGORY} (no text, only icons like {ATTRIBUTE_ICONS}). "
            "A dashed dotted line connects the person to the Boundary Frame. "
            "The person slightly overlaps with the frame boundary to show inclusion."
        ),
    },

    "existence_location": {
        "label": "Nがあります・います（存在と場所）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Flat vector illustration. {LANDMARK_OBJECT} drawn in muted light gray (background space). "
            "{TRAJECTOR_OBJECT} placed {LOCATION_PREPOSITION} the {LANDMARK_OBJECT}, "
            "drawn with bold vivid outlines and bright color filling 70% of the frame. "
            "2-3 thin concentric arcs radiate from the base to signal static presence. "
            "A subtle spotlight highlight area surrounds {TRAJECTOR_OBJECT}."
        ),
    },

    "noun_predicate_question": {
        "label": "〜ですか（疑問文）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "Ego character (teal blue shirt) with head slightly tilted, "
            "a question cloud bubble rising from their mouth containing a large '?' symbol "
            "and a faint silhouette of {TOPIC_OBJECT}. "
            "RIGHT: Soto character (orange shirt) in a listening/responding posture."
        ),
    },

    "noun_no_affiliation": {
        "label": "〜の〜です（所属・所有）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person standing beside or in front of a large organization/place icon "
            "(building silhouette, flag, or institutional symbol). "
            "A thin curved arc connects FROM the person TO the organization. "
            "A small membership tag icon (no text) on the person suggests 'belongs to'."
        ),
    },

    "noun_no_possession": {
        "label": "〜の〜（所有関係 / AのB）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "LEFT: {OWNER_PERSON} silhouette. RIGHT: {OWNED_OBJECT} drawn in vivid color. "
            "A thin curved arc connects FROM the owner TO the object, showing possession. "
            "The object has a small tag/label icon (no text) suggesting 'this belongs to owner'."
        ),
    },

    ## ─── GROUP 2: L6〜L10 動作・能力・授受 ───

    "potential_dekimasu": {
        "label": "〜ができます（能力・可能）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person in the center performing {ABILITY_ACTION}. "
            "Behind the person: a green shield badge with a white checkmark (Verification Shield). "
            "Near the action: a small unlocked gold padlock icon. "
            "Yellow starburst sparkles scattered around the action area."
        ),
    },

    "progressive_teimasu": {
        "label": "〜ています（進行中）", "uses_unified_char": False, "hard_limit": False,
        "grammarConcept_id": "teimasu_progressive",
        "prompt_core": (
            "Person performing {ACTION} captured at the MID-POINT of the action, not the completed state. "
            "2-3 ghost silhouettes of the moving part at decreasing opacity (30%, 15%, 5%). "
            "A small circular progress ring in the corner at 80% fill. "
            "Short parallel vibration lines around the moving object."
        ),
    },

    "progressive_state_teimasu": {
        "label": "〜ています（結果状態の継続）", "uses_unified_char": False, "hard_limit": False,
        "grammarConcept_id": "teimasu_resultant_state",
        "prompt_core": (
            "Main focus is {AFFECTED_OBJECT} in its changed state (e.g., door fully open, bag fully packed). "
            "No active person in the center — the result state IS the subject. "
            "In the bottom corner: a tiny 'before' icon with a right arrow showing the state change."
        ),
    },

    "habitual_teimasu": {
        "label": "〜ています（習慣・恒常状態・職業）", "uses_unified_char": False, "hard_limit": False,
        "grammarConcept_id": "teimasu_habitual",
        "prompt_core": (
            "Person in the foreground wearing {PROFESSION_ATTIRE}. "
            "Behind them: a 50%-opacity ghost background showing {PROFESSION_SETTING}. "
            "A small infinity (∞) symbol or circular repeat arrow near the person. "
            "For 'sunde-imasu': an anchor icon from person's chest pointing to a city pin on a map."
        ),
    },

    "request_tekudasai": {
        "label": "〜てください（依頼・指示）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "LEFT: Ego (teal blue shirt) with palm-up welcoming gesture. "
            "A curved dotted-line arrow flows from Ego's hand toward {TARGET_LOCATION/ACTION}. "
            "At the target: a faint 20%-opacity ghost silhouette of {EXPECTED_ACTION_RESULT}. "
            "Concentric target rings on the ground at the target point."
        ),
    },

    "negation_masen": {
        "label": "〜ません・〜ない（否定）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person in center with rejection gesture (arms crossed or palm-out push). "
            "Between the person and {REJECTED_OBJECT}: a semi-transparent red barrier shield "
            "(#CC3333 at 50% opacity) at 45 degrees. "
            "On top of {REJECTED_OBJECT}: two thin red diagonal slash lines (targeted cancellation). "
            "NOT covering the whole image."
        ),
    },

    "benefactive_teageru": {
        "label": "〜てあげます（私→他者）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "LEFT: Ego character (teal blue shirt, BOLD 3.5px outline) facing right, performing {ACTION}. "
            "RIGHT: Soto character (orange shirt, normal outline) receiving the action. "
            "A teal blue bold heart-embedded arrow flows LEFT→RIGHT (benefactive). "
            "A thin black line arrow also flows LEFT→RIGHT (physical transfer)."
        ),
    },

    "benefactive_temorau": {
        "label": "〜てもらいます（他者→私・私の依頼）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "LEFT: Ego character (teal blue shirt, BOLD outline) in a slight bow/request gesture. "
            "RIGHT: Soto character (orange shirt) performing {ACTION}. "
            "A thin pink dotted loop goes from Ego to Soto (request signal). "
            "A bold gradient arrow (orange tail → teal tip) flows RIGHT→LEFT. "
            "A thin black line arrow also flows RIGHT→LEFT."
        ),
    },

    "benefactive_tekureru": {
        "label": "〜てくれます（他者が自発的に私に施す）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "LEFT: Ego character (teal blue shirt) with surprised-happy expression "
            "inside a dashed pink semicircle boundary (Uchi zone). "
            "RIGHT: Soto character (orange shirt) spontaneously performing {ACTION}. "
            "A full orange bold heart-embedded arrow flows RIGHT→LEFT, "
            "piercing through the Ego's boundary circle. "
            "Small yellow star sparks near Ego."
        ),
    },

    ## ─── GROUP 3: L11〜L16 複合文型 ───

    "sequential_te_form": {
        "label": "〜て、〜（連続動作）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "2-panel sequential layout. "
            "LEFT PANEL (rounded frame): Person performing {ACTION_A}. "
            "CENTER: Bold orange block arrow pointing right. "
            "RIGHT PANEL (rounded frame): Same person performing {ACTION_B}."
        ),
    },

    "simultaneous_nagara": {
        "label": "〜ながら（同時進行）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "A single person performing TWO ACTIONS SIMULTANEOUSLY. "
            "Upper body: {ACTION_1} with its visual signal (e.g., music notes from headphones). "
            "Lower body/feet: {ACTION_2} with its visual signal (e.g., walking speed lines). "
            "A large infinity-shaped (∞) dashed band encircles BOTH action signals together."
        ),
    },

    "modality_permission": {
        "label": "〜てもいいです（許可）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "CENTER: {PERMITTED_ACTION} (e.g., hand holding a camera). "
            "Surrounding the action: a green square frame with a large white checkmark (✓) inside."
        ),
    },

    "modality_prohibition": {
        "label": "〜てはいけません（禁止）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "CENTER: {PROHIBITED_ACTION}. "
            "Overlaid on the action: a red circle with a diagonal slash — "
            "ISO prohibition sign (#D81E05, 100% opacity)."
        ),
    },

    "modality_obligation": {
        "label": "〜なければなりません（義務）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person being 'pushed' toward {OBLIGATORY_ACTION} by a bold yellow angled force arrow. "
            "Above the action target: ISO mandatory circle (solid blue #002FA7, white pictogram inside). "
            "Near the person: a clock+exclamation notification badge."
        ),
    },

    "modality_unnecessary": {
        "label": "〜なくてもいいです（不必要）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "CENTER: {OPTIONAL_TASK_OBJECT} inside a dashed circle (not solid — optional). "
            "Person walking past it via a curved bypass dotted arrow. "
            "On the task object: a neutral dash '—' symbol or '0%' badge."
        ),
    },

    "quotation_to_omoimasu": {
        "label": "〜と思います（主観的思考）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person with a confident expression. "
            "A cloud-shaped thought bubble (scalloped outline with 3 trail circles to head) rises. "
            "Inside: a lightbulb icon + visual content of {THOUGHT_CONTENT}. "
            "Corner: certainty meter bar pointing to 80-90%."
        ),
    },

    "quotation_to_iimashita": {
        "label": "〜と言いました（発話引用）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person speaking with a speech bubble (oval + pointing tail from mouth). "
            "Inside the bubble: visual content of {SPEECH_CONTENT}. "
            "A speaker icon or double quotation mark badge on the bubble exterior."
        ),
    },

    "inference_deshoo": {
        "label": "〜でしょう（推量・確信度60〜70%）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person in a thinking/observing posture. "
            "A speech bubble (smooth ellipse, thin SOLID border — more certain than dashed) "
            "containing a hybrid '?!' combined icon. "
            "Corner: certainty meter pointing to 60-70% in solid cyan. "
            "Background right: a tiny weather chart or graph icon."
        ),
    },

    "condition_nara": {
        "label": "〜なら（文脈逆引き型条件）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "RIGHT: Soto character (orange shirt) presenting a large THEME BOARD card "
            "showing {SOTO_SITUATION_ICON}. "
            "CENTER: The large theme board as a visual pivot. "
            "LEFT: Ego character (teal blue shirt) pointing TO the theme board "
            "and issuing a bold recommendation arrow toward {RECOMMENDED_ACTION}. "
            "A dotted circular arrow from Soto's board to Ego's advice."
        ),
    },

    "interrogative_which": {
        "label": "どれ・どの+N（選択肢の中からの疑問）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "3-4 {OBJECT_TYPE}s in a row, each inside a dashed selection circle. "
            "Above them: a large '?' with a downward arrow pointing to the choices. "
            "LEFT: person in a pondering gesture (chin-on-hand) looking at the options. "
            "All objects in the same color/style — none highlighted yet."
        ),
    },

    ## ─── GROUP 4: 条件・比較・経験 ───

    "conditional_tara": {
        "label": "〜たら（時系列因果条件）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "2-panel layout. "
            "LEFT PANEL: The IF condition — {CONDITION_STATE}. "
            "CENTER: Bold neon orange BLOCK ARROW pointing right (direct causation). "
            "RIGHT PANEL: The THEN result — {RESULT_STATE}. "
            "Both panels framed with solid rounded borders."
        ),
    },

    "conditional_ba": {
        "label": "〜ば（論理的仮定条件）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "A Y-GATE SPLIT layout (forked path). "
            "TOP path (condition met): {SUCCESS_PATH} with ISO Green #009B48 arrow. "
            "BOTTOM path (condition not met): {FAILURE_PATH} with Slate Gray #708090 arrow. "
            "The fork point shows the IF condition in a dashed frame."
        ),
    },

    "comparison_yori": {
        "label": "〜より〜（比較・上回る）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Two objects/characters side by side. "
            "LEFT: {REFERENCE} — muted gray, smaller or lower visual weight (Landmark). "
            "RIGHT: {SUPERIOR} — vivid color, larger or higher visual weight (Trajector). "
            "A downward-pointing bold arrow or 'winner crown' icon above {SUPERIOR}. "
            "A right-pointing comparison arrow between the two."
        ),
    },

    "experience_ta_koto_ga_aru": {
        "label": "〜たことがあります（経験）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Timeline from left (past) to right (now). "
            "A specific point in the LEFT/PAST area marked with a gold FLASH STAMP (8-pointed asterisk). "
            "On the stamp: a small icon representing {PAST_EXPERIENCE}. "
            "Person in the present (at 'now') with a nostalgic/confident expression, "
            "eyes glancing left toward the memory."
        ),
    },

    "desire_tai": {
        "label": "〜たい（欲求・希望）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person reaching toward or looking longingly at {DESIRED_OBJECT/ACTION}. "
            "The desired object has a semi-transparent ghost outline (75% opacity dashed border) "
            "or a heart-dotted line connecting from person to object. "
            "A small heart icon or upward-reaching gesture emphasizes the desire."
        ),
    },

    ## ─── GROUP 5: HARD_LIMIT 文型（救済レイアウト必須） ───

    "regret_teshimaimashita": {
        "label": "〜てしまいました（後悔）",
        "uses_unified_char": False, "hard_limit": True,
        "rescue_layout": "2コマ（意図しない失敗 + 後悔反応）",
        "prompt_core": (
            "2-PANEL RESCUE LAYOUT. "
            "LEFT PANEL: Person with a shocked expression (!-mark explosion) "
            "as {ACCIDENTAL_EVENT} happens unintentionally. "
            "CENTER: Thin divider line. "
            "RIGHT PANEL: Person head-in-hands or crying (teardrop icon), "
            "with scattered fragments/result on the floor."
        ),
    },

    "expectation_hazu_desu": {
        "label": "〜はずです（客観的根拠に基づく確信）",
        "uses_unified_char": False, "hard_limit": True,
        "rescue_layout": "証拠提示 + 予測結果の対比構成",
        "prompt_core": (
            "Person holding/pointing to a large document/timetable showing {EVIDENCE}. "
            "Person also pointing to their wristwatch showing the expected time. "
            "Background: the predicted event has NOT yet happened (empty space with a '?' bubble)."
        ),
    },

    "attempt_temimasu": {
        "label": "〜てみます（試み）",
        "uses_unified_char": False, "hard_limit": True,
        "rescue_layout": "3ステップ小画面並置",
        "prompt_core": (
            "3-SMALL-PANEL layout (Step 1 → 2 → 3). "
            "Panel 1: Person looking cautiously at {UNKNOWN_OBJECT} with a '?' above head. "
            "Panel 2: Person performing a TENTATIVE/SMALL ACTION (just touching, tasting a tiny bit). "
            "Panel 3: Person with discovery reaction ('!' with heart or star)."
        ),
    },

    "social_constraint_wakeni": {
        "label": "〜わけにはいかない（社会的規範による行動抑止）",
        "uses_unified_char": False, "hard_limit": True,
        "rescue_layout": "意志ベクトル + 社会的引力の拮抗構図",
        "prompt_core": (
            "Person leaning strongly FORWARD (right direction) showing strong personal will. "
            "BUT BEHIND them: large social constraint icons (company building, wall clock, rule flag) "
            "sending warm-colored pull-back lines (#E05C2A at 70%) to the person's shoulders. "
            "NO physical barrier in front (unlike prohibition). "
            "Forward-leaning body but feet fixed."
        ),
    },

    "uncertainty_kamoshiremasen": {
        "label": "〜かもしれません（不確実な推測）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Person with a slightly uncertain expression. "
            "A DASHED ROUGH-BORDER bubble (粗い破線) floating above their head "
            "(do NOT use solid border or scalloped thought bubble). "
            "Inside: visual content of {UNCERTAIN_CONTENT}. "
            "Corner: certainty meter at only 20-40% in gray."
        ),
    },

    ## ─── GROUP 6: 提案・誘い・比較（L6〜L9系）───

    "suggestion_mashou": {
        "label": "〜ましょう（提案・一緒にしよう）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "UNIFIED_CHAR_SYSTEM. Ego (teal blue) and Soto (orange) side by side facing the same direction. "
            "Both showing a ready/starting gesture (hands raised or stepping forward together). "
            "A shared forward-pointing arrow between them indicating joint movement toward {SHARED_ACTION}. "
            "Upbeat sparks/star icons above both characters."
        ),
    },

    "invitation_masenka": {
        "label": "〜ませんか（勧誘・丁寧な誘い）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "UNIFIED_CHAR_SYSTEM. Ego (teal blue) in an inviting open-palm gesture toward Soto. "
            "A soft curved dotted-line invitation arc from Ego toward {INVITED_ACTIVITY}. "
            "Soto in a considering/interested posture. "
            "A faint question mark near Soto (polite uncertainty). "
            "The activity/destination shown as a semi-transparent icon ahead."
        ),
    },

    "comparison_hoo_ga": {
        "label": "〜の方が〜より（比較・選択）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Two items/people side by side. "
            "LEFT: {REFERENCE} in muted gray, smaller scale (Landmark). "
            "RIGHT: {WINNER} in vivid full color, slightly larger scale (Trajector). "
            "A COMPARISON ARROW pointing from left to right with a 'greater-than (>)' symbol "
            "between the two, emphasizing {WINNER} is superior. "
            "No crown or trophy needed — size/color contrast communicates the comparison."
        ),
    },

    "comparison_ichiban": {
        "label": "〜がいちばん（最上級・3者以上の比較）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "Three items/people in a row: 1st, 2nd, 3rd place (or similar scale). "
            "WINNER in the center or left: vivid color, BOLD 3.5px outline, largest scale. "
            "Above WINNER: a gold trophy/crown or #1 gold badge icon. "
            "Others flanking: muted gray, smaller scale, thin outlines. "
            "A vertical scale bar on the side showing the winner at the top position."
        ),
    },

    "hearsay_sou_desu": {
        "label": "〜そうです（伝聞）", "uses_unified_char": True, "hard_limit": False,
        "prompt_core": (
            "RIGHT: A news/information source icon (small newspaper icon, phone screen, or Soto character). "
            "A speech bubble from the source flowing toward Ego. "
            "INSIDE the outer bubble: a SECOND INNER BUBBLE at 50% opacity (double-layered bubble). "
            "The inner bubble contains {REPORTED_CONTENT}. "
            "Ego receiving the information with a 'I heard that...' head-tilt posture."
        ),
    },

    "appearance_sou_desu": {
        "label": "〜そうです（様態・見た目から推測）", "uses_unified_char": False, "hard_limit": False,
        "prompt_core": (
            "A single {SUBJECT} that has a visually obvious appearance suggesting {QUALITY}. "
            "Example: a dessert that 'looks delicious' — rendered with appeal marks (swirls, sparkles). "
            "Person observing it with wide interested eyes and a thought bubble containing "
            "a lightbulb + the appearance quality icon. "
            "Corner: certainty meter at 70-80% (visual evidence basis)."
        ),
    },

    ## ─── ⚠️ ギャップ注記 ───
    ## v2.6 original に 37エントリ記載されているが、ファイル読み込み時の
    ## 一部トランケーションにより v2.7 には現在 41エントリ収録済み。
    ## 次の作業として v2.6_complete.py の全エントリを照合し、
    ## 上記に未収録のものがあれば追記すること。
    ## （照合ポイント: L13〜L22 の文型エントリ）
}



## ============================================================
## §6. QAチェックリスト
## ============================================================

QA_CHECKLIST = {

    "universal_checks": [
        "STYLE_RECIPE は §1 の確定版（hex値なし・肌色句なし）を使用しているか",
        "肌色は CHARACTER_RENDERING_POLICY（§2-3）に従って個別に追記しているか",
        "  → warm skin: 'Skin tones: naturally warm medium skin tone.'",
        "  → neutral: 'Gender-neutral avatar, neutral light gray skin (#D3D3D3).'",
        "TEXT_POLICY が §4 対応表の割り当てに従って正しく選択されているか（A/B/C）",
        "アスペクト比が正しいか（語彙1:1 / 例文16:9）",
        "TRAJECTOR が LANDMARK より輪郭が太く・彩度が高いか（3.5px vs 1.5px）",
        "実線/破線の使い分けが STROKE_STYLE_SEMANTICS に従っているか",
        "テンプレートA〜Jは v2.5 の [STYLE RECIPE] ブロックを §1 版に置換済みか（前置ではなく置換）",
    ],

    "vocab_type_checks": {
        "person":          ["役割（職業・関係）が服装・小道具・ポーズだけで明確か", "文字・名札に依存していないか"],
        "building":        ["BUILDING_CUES の3アンカー（入口・ユーザー行動・周辺）が描かれているか"],
        "concrete_object": ["OBJECT_SIGNATURES の識別シグネチャーが描かれているか", "カノニカル3/4ビューか"],
        "pronoun":         ["人称に応じたアクター数（1名/2名/3名+）が正しいか", "疑問代名詞は破線シルエット+？か"],
        "interjection":    ["発話バブル内のISO記号（✓/✗）を使用しているか", "文化的ジェスチャー単体に依存していないか"],
        "adverb":          ["アンカー物体が描かれているか（副詞記号だけの画像は禁止）"],
        "counter":         ["物体3〜4個・NO OVERLAP・サビタイジング最適化レイアウトか", "カウンターバッジが配置されているか"],
        "time":            ["時計盤を70%不透明度にしているか（物体カードでないことを示す）", "曜日カードは自然元素ピクトグラム（テキスト不可）か"],
        "transportation":  ["電車/新幹線/地下鉄の識別シグネチャー（パンタグラフ等）があるか"],
        "family":          ["ウチ形（実線暖色バブル）とソト形（破線グレーバブル）の構図が正しいか", "兄/姉/弟/妹の身長比・性別ヘアスタイルで区別できるか"],
        "weather":         ["名詞天気は環境が主役か / 体感形容詞は人物の生理的反応が主役か"],
        "sensory":         ["見えます/聞こえます: 人物が別の活動中で信号が受動的に届いているか", "見ます/聞きます: 能動的な視線/矢印が描かれているか"],
    },

    "example_sentence_checks": [
        "grammarConcept の値が GRAMMAR_PATTERNS_C のキーと一致しているか",
        "hard_limit=True の文型に RESCUE_LAYOUT（2コマ/3コマ）を使用しているか",
        "uses_unified_char=True の文型で Ego=テイルブルー/左 / Soto=オレンジ/右 の配置か",
        "授受表現（あげます・もらいます・くれます）で矢印の方向・色が正しいか",
        "思考バブル（雲形/スカラップ）と発話バブル（楕円+テール）を混同していないか",
        "否定バリア（〜ません・半透明シールド）とISO禁止記号（〜てはいけません・実線円）を混同していないか",
        "〜たら（直進2コマ）と〜ば（Y型分岐）を混同していないか",
        "〜ています 3種（進行/結果状態/習慣）を正しく選択しているか",
        "SEMANTIC_COLOR_UNIFIED の色を使用しているか（独自の色を使っていないか）",
    ],

}


## ============================================================
## END OF master_prompt_design_guide_v2_7.py
## ============================================================
## 完成プロンプトの組み立て手順（サマリー）:
##
##   1. lesson_NN.json の vocab_type を確認
##   2. §4 の対応テンプレートを選択（A〜T）
##   3. §1 の STYLE_RECIPE（hex値なし確定版）をプロンプト先頭に配置
##   4. テンプレート本文を続ける（プレースホルダーを語彙情報で埋める）
##   5. 該当する TEXT_POLICY（A/B/C）をプロンプト末尾に付加
##   6. §6 QAチェックリストで確認
##   7. JSON形式で出力（§0 の出力フォーマット仕様に従う）
##
## v2.5 からの主要引継ぎ（v2.7 では参照のみ）:
##   - テンプレートA〜J の詳細本文 → master_prompt_design_guide_v2_5.py に定義
##   - BUILDING_CUES（建物別アンカー辞書）→ v2.5 の PART 4
##   - OBJECT_SIGNATURES（物体識別シグネチャー辞書）→ v2.5 の PART 4.5
##   - ARROW_SEMIOTICS（矢印意味分類）→ v2.5 の PART 4.7
##   - ABSTRACT_METAPHORS（抽象概念メタファー辞書）→ v2.5 の PART 4.8
##   - DEMONSTRATIVE_MODELS（こそあど3モデル定義）→ v2.5 の PART 4.9
##   ※ 上記を参照する場合は v2.5 のファイルを合わせて読むこと。
##
## ============================================================
