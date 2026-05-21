# 日本語教材イラスト生成 マスタープロンプト設計書
# Master Prompt Design Guide for Japanese Language Teaching Materials
# Version 3.8 | 2026-05-21 (= v3.7 + 単一画像 diversity 問題の構造的修正 + 国別 phenotype + 現代化伝統衣装の許容)
#   v3.7 実機検証で 5 問題（教育目的との不整合）が露呈：
#     (A) 「naturally diverse skin tone (multicultural variation)」を 1 枚生成
#         に投げると Imagen は中央値（medium-darker brown）を毎回選び、結果
#         全員が同じ肌色になる。"diverse" は単一画像生成では実装不能。
#     (B) ROLE/NATIONALITY のスキーマ非対称：ROLE は outfit_hints で強力な
#         視覚 ID（白衣・スーツ等）を持つが、NATIONALITY は flag 5-6% のみ。
#         v3.7 で追加した cultural_styling_hint も全て「modern X casual fashion」
#         で同 syntactic shape に収束し、garment type level の弁別性なし。
#     (C) compose_role_subject が "dark hair (dark brown to black)" を
#         ハードコードし、汎用役割（医者・会社員 等）まで東アジア前提に。
#     (D) 国別 phenotype hint 不在で、Imagen が「multicultural variation」を
#         「ethnically ambiguous medium tone」と解釈し続ける。
#     (E) 1 課内に 12 件並べた弁別性が「同じ casual + 6% flag」では不足。
#         教育的に初学者が「中国人」vs「日本人」をパッと判別できない。
#
#   v3.8 修正：
#     (1) skin tone / hair を enumerate 化（"pick one from: fair / medium / olive
#         / brown / deep brown"）。「diverse」では機械が動けないので具体的選択肢を渡す。
#     (2) PERSON_NATIONALITY_HINTS に apparent_features_hint を追加し、国別の
#         代表的 phenotype を「多様性を内包する形」で記述（diversity-acknowledging）。
#     (3) cultural_styling_hint を garment type レベルで分化（silhouette / 素材 /
#         レイヤー構造が国別に変わる）。各国に 2-3 個の concrete 服装例を持たせる。
#     (4) hard_constraints をさらに緩和：「caricature / tourist cliché / 祭礼
#         背景は禁止」だが、「現代化された伝統要素」「日常文脈の伝統衣装」は許容。
#         境界線は『この国の人が普通の火曜日に着るもの』 vs 『民族衣装ディスプレイ』。
#     (5) role 側の dark hair ハードコードも撤廃し、enumerate 化（hair color free）。
#     (6) subject_block_pattern に {APPARENT_FEATURES_HINT} placeholder 追加。
#
#   退避：PART 1.2 ISOLATION_SAFE_PROPS_RULE と直交する scene_hints 未使用問題
#   （ROLE_BASED_GENERIC_PROFILES に定義された scene_hints が build_prompts.py
#   に参照されていない）は v3.8 では触らず、docs/PHASE_BACKLOG.md に退避。
#   解決路としては「scene-rich テンプレ A2 を新設して outfit_hints + 最小背景要素
#   を併用」が候補だが、規模が大きいため別 Phase で検討。
# Version 3.7 | 2026-05-21 (= v3.6 + ISOLATION_SAFE_PROPS_RULE + 国籍系の文化的バリエーション)
#   v3.6 実機検証（2026-05-21）で 2 件の問題が露呈：
#     (a) teacher プロンプトが「指示棒で空中を指す」絵を生成。
#         outfit_hints に "pointer" が含まれるが、テンプレ A の SCENE が
#         "No other characters or objects in the frame" を強制するためホワイトボードが
#         描けず、pointer が単体で意味を成さない。同型の問題は doctor.otoscope も持つ。
#         → 新 PART 2.3 ISOLATION_SAFE_PROPS_RULE を明文化。outfit_hints は
#           「単体で意味が通る props」のみとし、context-dependent props
#           （pointer / otoscope / microphone / camera 等）を使用禁止リストに退避。
#           ROLE_BASED_GENERIC_PROFILES["teacher"] から pointer を、
#           ROLE_BASED_GENERIC_PROFILES["doctor"] から otoscope を削除。
#     (b) 国籍系 7 件が全員「同じ服装の同じ顔の人物」になり弁別不可。
#         NATIONALITY_NOUN_POLICY.subject_block_pattern が「A generic adult person in
#         plain, simple casual clothes」固定で、唯一の差別化軸が 3-4% の旗ピンのみ。
#         v3.3 M-47 wave で role には付与された multicultural variation 文も
#         nationality 側には未適用だった。
#         → hard_constraints の「stereotyped national costume 全面禁止」を
#           「caricature/tourist-cliché 禁止・contemporary cultural styling は許容」に改訂。
#           subject_block_pattern に {CULTURAL_STYLING_HINT} placeholder を新設し、
#           M-47 multicultural variation を nationality にも parity 適用。
#           国旗ピンサイズを 3-4% → 5-6% に微増（弁別性向上のため）。
# Version 3.6 | 2026-05-20 (= v3.5 + EXCEPTION 句の Imagen 解釈漏れ修正)
#   テンプレートA (vocabulary_person) の [CONSTRAINTS] にベタ書きされていた
#     EXCEPTION (NATIONALITY_NOUN_POLICY — applies ONLY to nationality-noun persons):
#     a small national-flag pin/patch is permitted ...
#   は、Imagen がメタ条件「applies ONLY to nationality-noun」を解釈できず、
#   role 系（医者・会社員・学生・大学生・先生）にも国旗ピン/バッジを描画していた
#   （実機検証 2026-05-20、word_学生 / word_会社員 の生成画像に国旗バッジを確認）。
#   本版で {NATIONALITY_EXCEPTION_BLOCK} placeholder 化し、build_prompts.py が
#   kind=nationality のみ EXCEPTION 句、kind=role には anti-flag 強表現
#   （must NEVER include any flag）を注入する。
# Version 3.5 | 2026-05-20 (= v3.4 + M-15 wave: テンプレ D/H/J を {STRATEGY_BLOCK} 構造化。全変更=apply_v3_5.py のみ)
#   M-15 wave: D/H/J 本文の戦略並置を {STRATEGY_BLOCK} 1 個に置換し、
#              新規 PART 4.10 OBJECT_STRATEGIES / 4.11 ACTION_VERB_STRATEGIES /
#              4.12 ADJECTIVE_STRATEGIES を辞書として分離（G の DEMONSTRATIVE_MODELS と同様）。
#              build_prompts.py の戦略展開ロジックは Phase 4 ② で同期実装。
# Version 3.4 | 2026-05-20 (= v3.3 + 残り個別修正 + M-7 wave 補助辞書キー正規化。全変更=apply_v3_4.py のみ)
#   M-5: BUILDING_BACKGROUND_EXACT 定数（invariants.mjs C4 building 分岐と整合）
#   M-6 + M-7 wave: 5 補助辞書のキー正規化（『会社(company office)』→『会社』）
#                   + _en フィールド追加 + M-52 ABSTRACT_METAPHORS.composition_mood 13 件追加
#   M-10: テンプレ G {SPEAKER_DESCRIPTION}/{LISTENER_DESCRIPTION} 出所明示
#   M-11: 改訂履歴 v3.3 / v3.4 セクション追加
#   M-27 / M-40: iconization_level の vocab_types 実態整合 note
#   M-32: VISUAL_SYMBOLS 機能重複の note
#   M-36: NATIONALITY_NOUN_POLICY subject_block_pattern 重複削除
#   M-39 / M-41: focal_length_standards に vocab_type 別 lens マッピング新設
#   PART 8 末尾: プレースホルダ出所表新設
# Version 3.3 | 2026-05-20 (= v3.2 + 監査72項目の決定論一括是正。全変更=apply_v3_3.py のみ)
#   詳細パッチ仕様: docs/PROMPT_GUIDE_V3_3_PATCHES.md（72 件・wave 構造）
#   Wave 1 (M-49): PART 7 GEMINI_STABILIZATION 退役 → archive 保全
#                  color_space_protocol だけ PART 6.5 として救出
#   Wave 2 (M-2):  'no decorative' → 'no purely decorative' 二層構造
#                  Exception 1 拡張で C/I を PERMITTED テンプレに追加
#   Wave 5 (M-28/37/42): SSOT 階層違反 (highlight/shadow/glossy/glow) 一括書換
#   Wave 6 (M-31): color_palette.educational_symbol_colors サブセクション追加
#   Wave 7 (M-47): skin tone NOT specified / hair varied dark で多文化配慮
#                  (v3.0 §3 繰越事項を最終解消)
#   Wave 8 (M-59/60/61): テンプレ F 単独不整合解消
#   Wave 9 個別軽修正: M-1 / M-3 / M-4 / M-8 / M-9 / M-22 / M-29 / M-35 /
#                  M-43 / M-44 / M-48 / M-58 / M-62 / M-63 / M-71 / M-72 等
# Version 3.2 | 2026-05-19 (= v3.1 + 監査7項目の決定論一括是正。全変更=apply_v3_2.py のみ)
#   1 サイズ×形状: 面積→高さ基準（Template A SCENE/occupancy/vocabulary_card_style/NATIONALITY×2）
#   2 レンズ: focal_length先頭の85mm portrait除去＋人物~50mm明記＋Template A重複是正
#   3 レンズ×角度: adjective J / spatial_drift remedy の85mm portraitを~50mmへ
#   4 背景色: SCENE と STYLE RECIPE を off-white で一致統一（抑制でなく除去。色名/note同期。
#     E14=color_drift remedy の活き残留も是正 / E15=NOT/not 大小を統一し一字一句一致）
#   5 Template A CONSTRAINTS: 弱表現→強表現＋NATIONALITY例外を明示再適用
#   7 abstract_concept: gradient-free tones を flat-solid-only に整合
#   ベース: v2.5（v2.5.1 が「回帰先」として確定した検証済みベースライン）
#   不採用: v2.6 / v2.7 / v2.8 / v2.9 / v2.9.1 の拡張スタック全体
#           （理由は下記 v3.0 改訂履歴 §0 を参照）

## ============================================================
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
## v3.1 (2026-05-19): 問題F の完遂 + 背景クリーム化リグレッション是正
## ────────────────────────────────────────────────────────────
##
## 背景: v3.0 を実画像（word_アメリカ人）で検証した結果、人物カードが
##       純白(#FFFFFF)で出力されることが判明。原因調査で v3.0 の問題F
##       対策（hex全廃）が未完了であったこと、及びその副作用で複数
##       テンプレートに白飛びリグレッションが発生していたことを確認。
##
## [F-完遂] v3.0 §2-[3] は「#HEX を37箇所全削除」と記載していたが、実体は
##   spatial_relation / action_verb / vocabulary_adjective の本文、
##   ARROW_SEMIOTICS の color フィールド、GEMINI reset_prompt の
##   COLOR MANAGEMENT BLOCK に #HEX が残存していた（reset_prompt の
##   "soft cream white" は機械置換の削り残しの動かぬ証拠）。
##   v3.1 で残存 #HEX を実削除し、問題F を真に完遂。
##
## [背景-是正] v3.0 で hex アンカー(#FBFBFB)を外したことにより、SCENE の
##   "Solid white background" と STYLE の "soft cream white background"
##   の綱引きで前者が優勢化し純白化。該当テンプレートの SCENE 背景指定を
##   hex に依存しない文言
##   "Solid soft cream off-white background (warm off-white, NOT pure
##   stark white)" に統一（問題F を再発させずクリームを回復）。
##   対象: vocabulary_person / vocabulary_object_concrete(2サブ戦略) /
##         vocabulary_variant_grid / vocabulary_adjective(3箇所) /
##         STYLE_BIBLE.vocabulary_card_style。
##
## [整合] example_sentence STYLE RECIPE の "cream white or pale" 曖昧
##   ("or") を解消（v3.0 が Template B でのみ解消し C を残置していた）。
##   QA_CHECKLIST.style_consistency の背景文言を実体に同期し、
##   #HEX 残存ゼロを検証する項目を新設。
##   STYLE_BIBLE.color_palette.note を実体に合わせ改訂。
##
## 変更なし: テンプレートB(建物=淡いスカイブルー全面) / 国籍名詞戦略 /
##           §0 版系統確定 / その他 v3.0 の構造。
##
## ────────────────────────────────────────────────────────────
## v3.0 (2026-05-19): 【ベースライン確定版】v2.5回帰 + 建物英語ラベル化
##                    + 国籍名詞戦略の新設 + 内部矛盾の恒久解消
## ────────────────────────────────────────────────────────────
##
## §0. 版系統の確定（問題D の恒久解決）
##   v2.5.1 (2026-05-18) の改訂履歴は「ガイド設計方針: v2.5 に戻す
##   （v2.6〜v2.9 の拡張は不採用）」と明記していた。理由は v2.9 実生成テストで
##   色品質・アスペクト比・複数人物生成の退行を確認したため。
##   しかし v2.6→v2.7→v2.8→v2.9→v2.9.1 がその翌日に積み上げられ、v2.9.1 は
##   まさにその「不採用」と決めた拡張スタックそのものになっていた（自己矛盾）。
##   lesson_01/02 の実画像品質テスト（progress_handoff_v12_0 §1）でこの判断の
##   正しさが裏付けられた。
##   → v3.0 は v2.5 を唯一の正系ベースとして確定する。v2.6〜v2.9.1 は破棄。
##     ただし v2.9.1 の有益な改善1点（テキストラベル絶対禁止表現）のみ、
##     建物例外と整合する形で選択的に取り込む（§2-[5] 参照）。
##
##   【v2.6〜v2.9.1 拡張の採否マトリクス】
##     - hex完全除去（色名のみ）          : 採用（v3.0 §2-[3]。問題F解決）
##     - テキストラベル絶対禁止の文言強化  : 部分採用（建物例外を明示した上で）
##     - CHARACTER_RENDERING_POLICY 新設   : 不採用（複数人物・退行の温床）
##     - VISUAL_CANON_RULE（医者=聴診器等）: 不採用（A〜F外。将来検討）
##     - ASPECT_RATIO_POLICY 新設          : 不採用（GAS側責務。退行報告あり）
##     - NON_VISUAL_VOCAB_POLICY 新設      : 不採用（lesson_01/02 に該当語なし）
##     - ADJECTIVE_CATEGORY_MATRIX 新設    : 不採用（テンプレJで足りる）
##     - GRAMMAR_VISUAL_ENCODING_30 新設   : 不採用（例文画像は将来タスク）
##     - generic_* skin の UNSPECIFIED 化  : 不採用（A〜F外。下記 §3 で繰越明示）
##
## §1. 解決した既存問題（progress_handoff_v12_0 §1-2 の A〜F）
##   問題A【国籍人物カードの旗巨大化】
##     根本原因は問題E（ガイドに国籍名詞の描き方が未定義）。v3.0 §2-[6] で
##     NATIONALITY_NOUN_POLICY を新設し恒久解決。
##   問題B【建物カードの文字化け】
##     日本語サイネージ（漢字・かな）を画像生成器が描画できず確定的に文字化け。
##     v3.0 §2-[4][5] で建物サイネージを「英語短語ラベル1個」に確定。
##     ラテン文字は生成器が安定描画できるため文字化けが構造的に解消。
##   問題C【建物カードの情報過多・空パネル量産】
##     「3アンカー必須」「上1/3はtypography用余白」「sign panel を名指し」が
##     複合して空サイン枠の量産・RECEPTION等の余計なラテン語を誘発していた。
##     v3.0 §2-[4][5] で (a) 単一シーンキューに削減、(b) typography余白指示を
##     削除、(c) 反クラッター文を明示、(d) 許可ラベル1個以外の全文字を明示禁止。
##   問題D【ガイド本体の方針矛盾】 → §0 で恒久解決。
##   問題E【国籍名詞の視覚化戦略欠落】 → §2-[6] NATIONALITY_NOUN_POLICY で解決。
##   問題F【色指定方式の世代間矛盾】
##     色名+#HEX+hex value の三重指定が Imagen のテキスト描画バグを誘発し
##     （v2.5.1 で確認）、かつ冗長トークンを消費。v3.0 §2-[3] で全箇所を
##     「色名のみ」に統一（v2.9 実測で色名のみでも品質維持を確認済み）。
##   ガイド内部矛盾【グローバル制約 vs 建物テンプレ例外】
##     STYLE_BIBLE.constraints の「いかなる文字も禁止」と Template B の
##     「サイネージ1語は許可」が Imagen に矛盾シグナルを送っていた。
##     v3.0 §2-[5] でグローバル制約に建物サイネージ例外を明示的に切り出し、
##     教育的ピクトグラフ例外と同じ構造で整合化。
##
## §2. v3.0 の具体的変更点
##   [1] ヘッダ: 版を v3.0 に確定。本改訂履歴を新設。
##   [2] このファイルの使い方: v3.0 の最重要変更点（建物英語ラベル・
##       国籍名詞戦略）を追記。
##   [3] [PART 1] STYLE_BIBLE.color_palette および全 STYLE RECIPE ブロック:
##       「, similar to #XXXXXX, hex value XXXXXX」を全削除（37箇所）。
##       color_palette.note を色名のみ運用に改訂。skin_tones は §3 で繰越。
##   [4] [PART 3] テンプレートB(vocabulary_building) を全面改訂:
##       - [SUBJECT] 「Japanese signage word」→「ONE short ENGLISH
##         building-name label {SIGNAGE_TEXT}（生成器が描画可能な唯一の文字）」
##       - [SCENE & ACTION] 「3アンカー必須」→「単一の主要シーンキュー1行のみ」。
##         「上1/3はtypography用余白」の行を削除（GAS側オーバーレイの責務）。
##       - [CONSTRAINTS] 例外を英語ラベル1個に限定。RECEPTION 等の二次ラテン語・
##         日本語・数字を明示禁止。反クラッター文（記載要素以外を描かない）を追加。
##   [5] [PART 1] STYLE_BIBLE.constraints を改訂:
##       v2.9.1 由来の「titles/labels/captions を含むいかなる文字も禁止」の
##       強い表現を採用しつつ、建物サイネージ例外を教育的ピクトグラフ例外と
##       同じ構造で明示的に切り出し、内部矛盾を解消。
##   [6] [PART 1.1] NATIONALITY_NOUN_POLICY を新設（v2.5 に PART 1.1 はなし）:
##       国籍名詞語彙（アメリカ人・韓国人 等 / vocab_type=person）の視覚化標準。
##       人物が主役(70-80%)・国旗は4%以下の小ピン/ワッペン・手に持たない・
##       服全面印刷禁止・「PRIMARY/sole/facing forward」禁止・旗上の文字も禁止。
##       lesson_01 v1_2 スモークで実証済み（アメリカ人 ✅ PASS）の設計を恒久化。
##   [7] [PART 4] BUILDING_CUES を改訂:
##       全 signage_text を 「…」→ 英語短語（"BANK"/"UNIVERSITY" 等）。
##       各建物に primary_scene_cue を新設（単一・低クラッター）。
##       旧 entrance_cue/user_action_cue/surrounding_anchor は後方互換のため
##       残置するが Template B v3.0 では primary_scene_cue のみ使用。
##   [8] [PART 8] HOW_TO_USE: Step 2.5（建物）・Step 2-E（国籍名詞）を新設。
##
## §3. v3.0 で対応しない既知事項（A〜F 外・透明性のため明示）
##   - generic_* / color_palette.skin_tones の「warm medium 固定」:
##     v3.3 で解消（multicultural variation 採用）。詳細は v3.3 改訂履歴を参照。
##     旧記述: 多国籍学習者向けには肌色非指定が望ましいが、v3.0/v3.1/v3.2 では
##     変更しない（要・人間判断）— v3.3 で完遂。
##   - 例文画像(Template C)の文法→視覚エンコーディング体系: 将来タスク。
##   - lesson_NN.json 側の vocab_type=null 解消: .py では対応不可（別作業）。
##
## §4. 適用方法（重要・このガイド単体では既存画像は直らない）
##   v3.0 は設計書である。実効化には以下が必須:
##     (a) BUILDING_CUES.signage_text（英語化済み）を読む S列プロンプト生成を
##         再実行し、image_prompts_lesson01/02 を v1_4 として再生成する。
##     (b) 既に書き込まれた S列（旧 v1_x の日本語サイネージ）は上書きが必要。
##     (c) スモーク（銀行+アメリカ人 2語）→ 合格後フルバッチ、の順で進める。
##   ※ 既存生成済み画像（word_銀行__3_ 等）は本ガイドの変更だけでは修正されない。
##
## ────────────────────────────────────────────────────────────
## 以下、v2.5 までの改訂履歴（参考・原文保持）
## ────────────────────────────────────────────────────────────
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
## v2.5 (2026-05-14): NAMED_CHARACTER_PROFILES 新設（lesson_01 確定キャラクター5名）。
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
## ============================================================


## ============================================================
## このファイルの使い方
## ============================================================
##
## 全課共通のプロンプト設計ルールを定義したマスタードキュメント。
## 新しい課の image_prompts_lesson_X.json を作成する際は、
## 必ずこのファイルを参照してください。
##
## ★ v3.0 の最重要変更点（必読）:
##   (1) 建物の看板は「英語短語ラベル1個」のみ許可。日本語（漢字・かな）の
##       サイネージは画像生成器が描画できず確定的に文字化けするため全廃。
##       BUILDING_CUES.signage_text は英語（"BANK" 等）に確定済み。
##   (2) 国籍名詞語彙（アメリカ人・韓国人 等）は NATIONALITY_NOUN_POLICY
##       （PART 1.1）に従う。人物が主役・国旗は4%以下の小さなピンのみ。
##       「PRIMARY/sole identifier/旗をフレームの10-12%」等の旧記述は禁止。
##   (3) 色は「色名のみ」。#HEX や hex value は一切書かない（問題F解決）。
##   (4) 建物テンプレは単一シーンキュー＋反クラッター。
##       「上1/3 typography用余白」は書かない（GAS側オーバーレイの責務）。
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
## 資料9（旧方針）: 色は色名+#HEX+hex value の三重指定で安定化（Double-Hex
##            Anchoring）— ★ v3.0 で廃止。Imagen のテキスト描画バグ誘発と
##            トークン浪費のため「色名のみ」に統一（改訂履歴 v3.0 §2-[3]）。
## 資料11より: カノニカル・パースペクティブ(斜め上30-45度)が
##             識別速度・正確性を最大化する。v2.3 で反映。
## ============================================================

## ─────────────────────────────────────────────────────────────
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
  "core_style": "Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.",

  ## カラーパレット（大人・混合クラス向け）
  ## 理由: 資料7より、大人向けは落ち着いたミュートカラーが認知負荷を下げる
  ## v3.0 改訂（問題F解決）: 色名 + #HEX + hex value の三重指定は
  ##   (1) Imagen のテキスト描画バグを誘発（v2.5.1 で確認）、
  ##   (2) 余分なトークンを消費。
  ##   v2.9 実測で「色名のみ」でも品質が維持されることが確認済み。
  ##   よって全色を「色名のみ」に統一する。#HEX・hex value は一切書かない。
  "color_palette": {
    "background":  "Soft cream off-white (warm off-white, NOT pure stark white)",
    "outline":     "Deep slate navy",
    "main_color":  "Muted warm blue",
    "accent":      "Warm amber gold",
    "sub_color":   "Cool slate gray",
    "skin_tones":  "Skin tone is intentionally NOT specified — naturally diverse / multicultural variation expected.",
    "educational_symbol_colors": {
      "_purpose":          "VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS.color_adjustment で使う symbolic / pedagogical color tokens. core_style の 'flat solid' 規律内で使用。",
      "symbol_red":        "muted symbolic red (質問・否定・警告用)",
      "symbol_green":      "muted symbolic green (checkmark・正解用)",
      "symbol_orange":     "muted symbolic orange (注意・選択用)",
      "symbol_blue_cool":  "cool slate blue (冷却・否定情緒)",
      "symbol_pink_warm":  "warm muted pink (好意・愛情情緒)",
      "symbol_sepia":      "muted sepia (過去・記憶)",
      "symbol_sky_pale":   "pale sky blue (未来・空間)"
    },
    "note": "v3.3: educational_symbol_colors サブセクションを追加し、VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS の symbolic 色を正式化。v3.2: 背景色名を SCENE と STYLE RECIPE で一致させ統一（旧『soft cream white』→『soft cream off-white (warm off-white, NOT pure stark white)』）。v3.1 までは SCENE のみ off-white でRECIPEは white のままだったため白飛びを「抑制」していたが、v3.2 で両者を同一表記にし矛盾を「除去」した。#HEや hex value は引き続き一切書かない。今後この背景色名は SCENE と STYLE RECIPE で常に一字一句一致させること（新・反ドリフト原則）。"
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
      "Lens depends on subject type (NEVER a tight 85mm portrait/tele lens for full-body person cards). "
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
      "Frame the person with a standard ~50mm-equivalent lens at full standing "
      "distance: the WHOLE figure from the top of the head to the soles of BOTH "
      "feet is inside the frame, spanning about 80% of the image HEIGHT (measured "
      "by height, NOT by area), centered with empty side margins; do NOT crop at "
      "the waist, hips, thighs, or knees and do NOT zoom in to fill the frame. "
      "Exception (objects only): use straight front-facing (0°) ONLY when the front face alone "
      "is the definitive identifier (e.g. a clock face, a screen, a signage board).",
    "example_image_focal_length":
      "50mm standard lens equivalent, natural perspective close to human field of view",
    "building_image_focal_length":
      "35mm wide-angle lens equivalent, slight three-quarter front angle at eye level",
    "occupancy_percentages": {
      "vocabulary_card":   "OBJECTS/compact subjects: occupy 70-80% of the frame by AREA. PERSONS: the full standing figure (head to soles of both feet) spans about 80% of the image HEIGHT measured by height NOT area, centered with empty side margins; never crop the figure to fill area",
      "example_image":     "Characters occupy 60% of the frame",
      "building_image":    "Building occupies about 70% of the frame, centered, against a full-bleed pale sky-blue background. (v3.0: 旧『top third を typography 用余白に』指示は削除。帯文字はGAS側オーバーレイの責務で、画像内に空サイン枠を描かせない＝問題C対策)",
      "spatial_relation":  "Reference object (基準物) occupies 40-50% of the frame; target object clearly visible in relation",
      "action_verb":       "Action occupies 70% of the frame; motion direction clearly readable",
      "variant_grid":      "Each variant tile occupies equal space in a 2×2 or 1×N grid layout",
      "adjective":         "Object(s) occupy 70-80% of the frame. For PAIR_CONTRAST: each panel occupies 50% with equal-sized subjects.  (v2.4)"
    },
    "note": "資料11: カノニカル視点の認知的根拠 — 斜め上30-45度から物体を見ると上面と側面の両方が見え、三次元構造・重要なパーツ（取っ手・ボタン・折り目等）を一瞬で把握できる。真正面や真上からの視点より識別速度・正確性が統計的に高い。",
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
      "vocab_types":  ["person", "building", "spatial_relation", "demonstrative"]
    },
    "level_3_detailed_flat": {
      "description": "ステッチ・光沢線・素材記号など識別シグネチャーを含む。"
                     "グラデーションは使わないが、記号的なテクスチャヒントは許容。",
      "when_to_use":  "RECOMMENDED FOR MOST VOCABULARY CARDS — 具体物・日常物体",
      "vocab_types":  ["concrete_object", "abstract_concept", "action_verb (default; SEQUENCE_3PANEL strategy uses level_2)", "adjective"]
    },
    "level_4_realistic": {
      "description": "精密なテクスチャ・照明効果。",
      "when_to_use":  "本プロジェクトでは使用しない（フラットベクター原則に反する）",
      "vocab_types":  []  # NOT used in this project (level_4 realistic は本プロジェクト範囲外)
    },
    "note": "資料11: 認知負荷が最も低く識別精度が高い「スイートスポット」は level_3_detailed_flat。"
            "完全なフラット(level_2)は具体物では質感の欠如により類似物体の混同リスクがあるが、"
            "person / building / spatial_relation / demonstrative では構図がアイデンティティを"
            "決定するため level_2 で十分（v3.4 M-27/M-40: 用途別に肯定的位置づけ）。"
  },

  ## 語彙カード（1:1）専用スタイル
  ## v2.4: 人物は水平3/4ビュー（眼の高さ）、物体はカノニカル3/4ビュー（斜め上）。
  "vocabulary_card_style":
    "Solid soft cream off-white background (warm off-white, NOT pure stark white). Single centered subject only (Exception: variant_grid テンプレ E は multi-tile composition を許可). "
    "Full-body shot with HORIZONTAL 3/4 view at eye level for characters; "
    "canonical 3/4 view (slight overhead) for objects and adjective subjects. "
    "No background elements, no secondary objects. Objects fill 70-80% of the frame by area; a full-body person is shown head to soles of both feet, spanning about 80% of the image HEIGHT (not area), centered with empty side margins — do NOT crop the figure to fill the frame.",

  ## 例文画像（16:9）専用スタイル
  "example_image_style":
    "Clean minimal background with only essential context. "
    "Characters take up the majority of the frame. "
    "Eye-level front or slight three-quarter view. "
    "Straight vertical lines for buildings. Flat warm tonal balance, no lighting effects, no shadows.",

  ## 全画像共通の制約（最後に必ず追加）
  ## v2.4 改訂: 「no symbols」が教育的矢印・領域線・モーションラインまで排除する
  ##           可能性を回避。各テンプレートの CONSTRAINTS ブロックに従う旨を明記。
  ## v3.0 改訂: (a) v2.9.1 由来のテキスト絶対禁止の強い表現を採用
  ##           （タイトル行・ラベル・キャプション・テキストオーバーレイを
  ##            位置を問わず明示禁止。word_先生 で上部に「教師」ラベルが
  ##            出た弱表現バグを構造的に防止）。
  ##           (b) ただし建物サイネージ例外（Template B の英語ラベル1個）を
  ##            教育的ピクトグラフ例外と同じ構造で明示的に切り出し、
  ##            グローバル制約と Template B の矛盾シグナルを解消。
  "constraints":
    "No text, no letters, no numbers, no purely decorative symbols anywhere — "
    "including titles, labels, captions, watermarks, or any text overlay "
    "at any position in the rendered output. "
    "Exception 1 (EDUCATIONAL pictographic elements) — directional arrows, "
    "territory boundary lines, motion lines, panel dividers, and symbolic "
    "metaphor anchors (hearts, sparkles, teardrops, question marks, "
    "lightbulbs, stars, etc. as defined in ABSTRACT_METAPHORS / "
    "VISUAL_SYMBOLS) — are governed by each individual template's CONSTRAINTS "
    "block, NOT by this global rule. They are PERMITTED in templates C "
    "(example_sentence), F (spatial_relation), G (demonstrative_kosoado), "
    "H (action_verb), I (abstract_concept), and J (vocabulary_adjective) "
    "when explicitly described in the template. "
    "Exception 2 (BUILDING SIGNAGE) — Template B (vocabulary_building) ONLY "
    "permits exactly ONE short ENGLISH building-name label as described in "
    "that template's CONSTRAINTS block. No other text is ever allowed, not "
    "even a second English word. "
    "For all other templates, the default 'absolutely no text or symbols' rule applies.",

  ## プロンプト末尾に付ける「ブランド宣言文」（資料6より）
  "brand_declaration":
    "Keep line weights consistent. Generate as if this is part of a unified educational brand style guide."
}


## ============================================================
## PART 1.1: NATIONALITY_NOUN_POLICY（国籍名詞語彙の視覚化標準）
## ============================================================
## v3.0 新規（問題E の恒久解決 / 問題A の根本原因対策）。
##
## 背景:
##   「アメリカ人」「韓国人」等の国籍名詞（vocab_type=person）の描き方が
##   ガイド本体に未定義だった（問題E）。このためプロンプト自動生成が破綻し、
##   v1_1 では「旗をフレームの10-12%・PRIMARY・sole identifier・facing
##   forward」という内部矛盾した記述が生成され、国旗の巨大化・服全面印刷・
##   人物未完成描画が多発した（問題A）。
##   lesson_01 v1_2 スモークで「人物主役・小さな丸ピン・文字なし」設計が
##   ✅ PASS（アメリカ人）したため、その設計をガイド標準として恒久化する。
##
## 適用対象:
##   vocab_type == "person" かつ語が「国籍名詞」であるもの。
##   例: 日本人 / 中国人 / アメリカ人 / 韓国人 / ブラジル人 /
##       ベトナム人 / スペイン人 など。
##   ※ 固定5名（鈴木さん等・NAMED_CHARACTER_PROFILES）には適用しない。
##     固定キャラは各自の nationality_visual_hints に従う。
##   ※ 「外国人」(generic role) は本ポリシーの対象外。flag pin を持たず、
##     ROLE_BASED_GENERIC_PROFILES["foreigner"] で生成する。
##
## 使用テンプレート: テンプレートA（vocabulary_person）。
##
NATIONALITY_NOUN_POLICY = {

  "principle":
    # v3.8: 「generic / non-stereotyped」は単一画像生成で「中央値の同一人物」を
    # 量産する罠だった。具体的 phenotype + cultural styling を国別に enumerate し、
    # 1 枚生成では Imagen が discrete に選ぶよう構造化する。教育的弁別性と
    # 文化的尊重のバランスを取る。
    "The PERSON is the subject, not the flag. A specific adult with culturally "
    "appropriate phenotype and clothing for the country is shown full-body, "
    "from the top of the head to the soles of both feet, spanning about 80% "
    "of the image HEIGHT (by height, NOT area), centered with empty side "
    "margins. Nationality is conveyed by the combination of phenotype range, "
    "cultural styling, and a small national-flag pin or cloth patch. "
    "Pedagogical goal: a learner glancing at 7 nationality cards in a single "
    "lesson must distinguish each at a glance — this requires per-country "
    "phenotype and garment variation that goes beyond the flag alone, while "
    "respecting diversity within each country (no caricature, no folkloric "
    "national-costume display).",

  "flag_pin_rule":
    # v3.7: 3-4% → 5-6% に微増（実機検証で 3-4% は弁別不足が確認されたため）。
    "Render the flag as a SMALL circular pin or small rectangular cloth "
    "patch on the chest or on a bag strap. The flag must occupy about "
    "5-6% of the image area (slightly larger than v3.6 to improve "
    "readability without dominating the frame). It is a subtle secondary "
    "identifier, NOT the primary subject.",

  "hard_constraints": [
    "DO NOT make the flag 'PRIMARY', the 'sole identifier', or fill "
    "10-12% (or more) of the frame.",
    "DO NOT hold the flag in the hands or wave it.",
    "DO NOT print the flag across the whole shirt/clothing.",
    "DO NOT pose the person to present the flag toward the viewer "
    "('flag facing forward').",
    "DO NOT render any text, letters, or numbers — not even on the flag.",
    # v3.8: さらに緩和。caricature / tourist cliché / 祭礼背景は禁止のまま、
    #       現代化伝統要素 / 日常文脈の伝統衣装は許容。
    "DO NOT use caricatured features (exaggerated facial features, "
    "stereotyped body proportions, ethnic-feature exaggeration). "
    "DO NOT use tourist-cliché props or backgrounds (panda, sombrero, sushi, "
    "tequila bottle, geisha-makeup, Fuji-san, cherry blossom festival, "
    "Olympics ceremony, etc.) as the nationality cue. "
    "PERMITTED: (a) contemporary fashion typical of the country today, "
    "(b) modernized cultural dress (e.g., wagara-patterned modern shirt, "
    "K-fashion with hanbok-inspired details, áo dài in everyday casual "
    "context, modernized cheongsam-inspired top), (c) everyday traditional "
    "dress shown in a natural daily context (e.g., a yukata at home on a "
    "summer evening, NOT a festival/ceremonial display). "
    "The pedagogical boundary: 'this person on a Tuesday in their country' "
    "is PERMITTED; 'a folkloric national-costume display for tourists' "
    "is NOT. Cultural styling per country is encoded in "
    "PERSON_NATIONALITY_HINTS (scripts/build_prompts.py) and injected via "
    "{CULTURAL_STYLING_HINT}. Per-country phenotype range is encoded in "
    "the same structure as apparent_features_hint and injected via "
    "{APPARENT_FEATURES_HINT}.",
  ],

  "subject_block_pattern":
    # v3.8: 「generic / varies naturally」をやめ、{APPARENT_FEATURES_HINT} で
    #       国別の具体的な phenotype 範囲を、{CULTURAL_STYLING_HINT} で garment-type
    #       選択肢を渡し、Imagen に discrete な選択を強制する。両 hint は完結した
    #       文として書かれているため、subject_block_pattern 側はそれらを平叙で並列するだけ。
    "A specific adult person. {APPARENT_FEATURES_HINT} {CULTURAL_STYLING_HINT} "
    "Neutral and welcoming expression, standing relaxed. A small "
    "{FLAG_SHAPE_AND_COLORS} national-flag pin or cloth patch (about 5-6% "
    "of the frame) is on the chest or bag strap as a subtle nationality cue. "
    "The person is the clear main subject. "
    "v3.4 (M-36): 身体高さ規律はテンプレ A SCENE&ACTION に集約済。"
    "本 subject_block_pattern では人物のアイデンティティ記述のみを行い、"
    "サイズ・フレーミング規律は重複させない。",

  "flag_shape_and_colors_hint":
    "{FLAG_SHAPE_AND_COLORS} = a short shape/color description of the flag "
    "WITHOUT any text. e.g. アメリカ: 'red and white horizontal stripes with "
    "a small blue corner of white star shapes'; 韓国: 'white field with a "
    "red-and-blue circle and black trigram marks'; ブラジル: 'green field "
    "with a yellow diamond and a blue circle'. Describe shapes/colors only — "
    "never spell country names or render letters.",

  "cultural_styling_hint_definition":
    # v3.7 新規・v3.8 拡張。
    "{CULTURAL_STYLING_HINT} = a description of clothing typical of the "
    "country today, expressed in concrete garment-type terms (silhouette, "
    "fabric, layering, garment names) rather than abstract style names. "
    "v3.8 では 3 ルートを許容：(a) contemporary fashion typical of the "
    "country, (b) modernized cultural dress drawing from traditional design "
    "in a modern everyday garment, (c) everyday traditional dress in a "
    "natural daily context. Each country hint should provide 2-3 concrete "
    "examples so Imagen can pick discretely instead of converging on a "
    "single 'casual' prototype. Caricature / folkloric national-costume "
    "display / tourist cliché remain prohibited (see hard_constraints).",

  "apparent_features_hint_definition":
    # v3.8 新規。単一画像 diversity 問題（"naturally diverse" が中央値に
    # 収束する）の構造的解決として、enumerate 化した phenotype 範囲を渡す。
    "{APPARENT_FEATURES_HINT} = a description of the person's phenotype "
    "(skin tone, hair color, hair texture/style) drawn from the range "
    "typical and culturally appropriate for the country today, written as "
    "an explicit ENUMERATION ('pick one from: A / B / C') rather than "
    "abstract diversity language. This forces Imagen to make a discrete "
    "choice instead of converging on an 'ethnically ambiguous medium tone'. "
    "Each country hint MUST acknowledge the diversity within the country's "
    "population (e.g., 'East Asian phenotype most common, but Japan's "
    "diverse population including mixed heritage may also be represented'). "
    "Hint values per country are encoded in PERSON_NATIONALITY_HINTS "
    "(scripts/build_prompts.py).",

  "note":
    "v3.3 で multicultural variation を採用済。skin tone は generic_* / "
    "compose_role_subject で NOT specified、NAMED_CHARACTER のみ国籍 "
    "specific 描写を維持（教育設計意図）。"
    "v3.7: nationality 系にも multicultural variation parity を適用し、"
    "さらに {CULTURAL_STYLING_HINT} で国別の contemporary cultural cue を "
    "差し込めるようにした。subject_block_pattern が PERSON_NATIONALITY_HINTS "
    "に従って国別に異なる文字列を生成するため、生成画像の弁別性が確保される。",
}


## ============================================================
## PART 1.2: ISOLATION_SAFE_PROPS_RULE（孤立人物カードの小道具規律）
## ============================================================
## v3.7 新規。テンプレートA (vocabulary_person) は SCENE で
## "Solid soft cream off-white background. No other characters or objects in
## the frame" を強制するため、人物が手に持つ小道具は「単体で意味が通る」もの
## のみに限定する。コンテキスト依存の小道具（pointer, otoscope, microphone,
## camera 等）は、本来必要なシーン要素（whiteboard, ear, stage, subject 等）が
## 描けないため、空中で意味不明な所作になる。
##
## 適用：
##   - ROLE_BASED_GENERIC_PROFILES / NAMED_CHARACTER_PROFILES /
##     CHARACTER_PROFILES の outfit_hints / fixed_features は本ルール準拠で
##     書く。context-dependent な小道具は isolation_unsafe_props_excluded に
##     退避し、outfit_hints / fixed_features 本文には書かない。
##   - 将来 role / character を追加するときは ISOLATION_SAFE / UNSAFE を判定し、
##     UNSAFE のものは scene_hints（複数オブジェクト構図用）にのみ書く。
##
## 履歴：v3.6 → v3.7 移行時に teacher.pointer / doctor.otoscope を
##       outfit_hints から除外（実機検証で空中所作の絵が出たため）。
##
ISOLATION_SAFE_PROPS_RULE = {
  "principle":
    "When the prompt template forbids non-subject objects in the frame, "
    "every prop named in the character's outfit description must be "
    "self-contained — i.e., must read naturally when held alone, without "
    "any external scene element to interact with.",

  "isolation_safe_examples": [
    "book / textbook / notebook (held against the body or open in hand)",
    "marker / pen / pencil (held alone is a writing/teaching cue)",
    "stethoscope (around the neck — does not need a patient)",
    "name badge / clipboard (worn or held)",
    "briefcase / laptop bag / backpack (held by handle / strap)",
    "documents / folder / single sheet of paper",
    "wristwatch / glasses / small jewelry",
  ],

  "isolation_unsafe_examples": [
    # 本リストは outfit_hints に書かれた場合に削除する判定基準。
    # 該当の小道具は「シーン要素を要する」ため SCENE が許す構図でしか使わない。
    "pointer / pointing stick  →  needs a whiteboard / blackboard / screen",
    "otoscope / stethoscope_in_use  →  needs an ear / patient",
    "microphone  →  needs a stage / audience",
    "camera (in act of taking)  →  needs a subject",
    "phone (in act of calling)  →  needs the other party context (still ok if just held)",
    "umbrella (open, in rain)  →  needs rain (closed/folded umbrella is ok)",
  ],

  "enforcement":
    "ROLE_BASED_GENERIC_PROFILES / NAMED_CHARACTER_PROFILES / "
    "CHARACTER_PROFILES のエントリに『isolation_unsafe_props_excluded』フィールドを "
    "持たせ、outfit_hints / fixed_features 本文から該当 props を除外したことを記録する。"
    "build_prompts.py は本フィールドを参照しない（除外は既に本文から削除済みである前提）。",
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
      "skin":   "naturally diverse skin tone (multicultural variation expected)",
      "outfit": "casual everyday clothes — simple shirt and trousers",
      "build":  "average height and build"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "skin_tone", "hair_color"],
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
      "skin":   "naturally diverse skin tone (multicultural variation expected)",
      "outfit": "casual everyday clothes — simple blouse and trousers",
      "build":  "average height and build"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "skin_tone", "hair_color"],
    "notes": "「女の人」の語彙カードや汎用シーンで使用。"
  },

  "generic_boy": {
    "role": "男の子（汎用子ども）",
    "layer": "generic",
    "gender": "male",
    "age_range": "8-10 (elementary school age)",
    "fixed_features": {
      "face":   "round cheerful face with big bright dark eyes and a wide playful smile",
      "hair":   "short slightly messy naturally varied dark hair (dark brown to black)",
      "skin":   "naturally diverse skin tone (multicultural variation expected)",
      "outfit": "casual children's clothes — simple t-shirt and shorts, sneakers",
      "build":  "small child proportions, head approximately 1/5 of total body height"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "items held (backpack/randoseru, ball, pencil, books)",
                        "skin_tone", "hair_color"],
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
      "skin":   "naturally diverse skin tone (multicultural variation expected)",
      "outfit": "casual children's clothes — simple t-shirt or blouse with skirt or shorts, sneakers",
      "build":  "small child proportions, head approximately 1/5 of total body height"
    },
    "allowed_changes": ["scene", "pose", "hair style (loose / pigtails / one ponytail)",
                        "specific clothes color", "expression", "items held",
                        "skin_tone", "hair_color"],
    "notes": "「子ども」「女の子」「学校」「家族」関連で使用。"
  },

  "generic_male_middle": {
    "role": "中年男性（汎用・父親世代）",
    "layer": "generic",
    "gender": "male",
    "age_range": "40s-50s",
    "fixed_features": {
      "face":   "calm reliable face with dark eyes, mild smile lines around the eyes, and a steady warm expression",
      "hair":   "short neat naturally varied dark hair (dark brown to black), slight gray at the temples",
      "skin":   "naturally diverse skin tone (multicultural variation expected)",
      "outfit": "casual smart everyday clothes — collared shirt or simple sweater with trousers",
      "build":  "average height, slightly fuller build than generic_male_adult"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression", "glasses on/off", "skin_tone", "hair_color"],
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
      "skin":   "naturally diverse skin tone (multicultural variation expected)",
      "outfit": "casual smart everyday clothes — simple blouse with trousers or modest skirt",
      "build":  "average height, slightly fuller build than generic_female_adult"
    },
    "allowed_changes": ["scene", "pose", "hair style (tied back / loose)",
                        "specific clothes color", "expression",
                        "skin_tone", "hair_color"],
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
      "skin":   "naturally diverse skin tone with natural age signs (multicultural variation expected)",
      "outfit": "comfortable everyday clothes — collared shirt with simple cardigan or vest, relaxed trousers",
      "build":  "slightly shorter and slimmer build than younger adults, gentle posture"
    },
    "allowed_changes": ["scene", "pose", "specific clothes color", "expression",
                        "glasses on/off", "walking stick or cane present",
                        "skin_tone"],
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
      "skin":   "naturally diverse skin tone with natural age signs (multicultural variation expected)",
      "outfit": "comfortable everyday clothes — simple blouse with cardigan and modest trousers or long skirt",
      "build":  "slightly shorter and slimmer build than younger adults, gentle posture"
    },
    "allowed_changes": ["scene", "pose", "hair style (loose / tied back)",
                        "specific clothes color", "expression", "glasses on/off",
                        "skin_tone"],
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
      "may carry a textbook or marker"
    ],
    # v3.7 (ISOLATION_SAFE_PROPS_RULE):
    #   pointer はホワイトボードを必要とするため除外。textbook/marker は単体で成立。
    "isolation_unsafe_props_excluded": ["pointer"],
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
      "may carry a clipboard or pen"
    ],
    # v3.7 (ISOLATION_SAFE_PROPS_RULE):
    #   otoscope は耳に当てる文脈が必要なため除外。stethoscope/clipboard/pen は単体で成立。
    "isolation_unsafe_props_excluded": ["otoscope"],
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
##     skin_tone は naturally warm medium が基準だが、
##     nationality_visual_hints の指示で微調整する（過剰なステレオタイプは避ける）。
## ============================================================

# v3.3 注記（M-16）: NAMED_CHARACTER_PROFILES の生成パスは未実装。
#   Phase 4 後の named_character 拡張で build_prompts.py に組み込み予定。
# v3.3 注記（M-69）: lesson_appearances 更新規律:
#   - 新規 lesson で NAMED キャラが登場する時、該当キャラの lesson_appearances に lesson_NN を追記。
#   - apply_vNN.py には反映しない（lesson データ独自管理）。
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
## v3.3 注記（M-48）: 本テンプレートは現状未活用。Phase 4 後の
##   vocab_type=family 設計時に activate 予定。
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
      "All family members share naturally diverse skin tones, harmonized but not identical (multicultural variation)",
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
      "All family members share naturally diverse skin tones, harmonized but not identical",
      "Hair colors stay within naturally varied dark range (dark brown to black)"
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
      "All family members share naturally diverse skin tones, harmonized but not identical",
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
FULL-BODY SHOT — the entire figure from the very top of the head to the soles
of BOTH feet is fully inside the frame, with a clear empty margin above the head
and a visible strip of empty ground below both feet. This is NOT a portrait,
headshot, or waist-up crop.
The standing figure spans roughly 80% of the image HEIGHT (measured by height,
NOT by area), centered horizontally. Empty background on the left and right is
expected and correct — do NOT zoom or crop in to fill the sides; that side
margin is intentional.
Camera angle: HORIZONTAL 3/4 view at EYE LEVEL — the camera is positioned at the
subject's eye height (not above, not below) and rotated approximately 30-45 degrees
to one side. This is a diagonal front view that shows both the front face and a partial
side view of the body simultaneously while preserving natural body proportions.
DO NOT use an overhead or bird's-eye angle. DO NOT crop the body at the head, neck,
waist, hips, thighs, or knees. Both feet and a small patch of the flat ground
directly beneath them must be clearly visible.
Solid soft cream off-white background (warm off-white, NOT pure stark white). No other characters or objects in the frame.
Framed as with a standard ~50mm-equivalent lens at full standing distance (NOT an 85mm tight portrait lens).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue
and warm amber gold as accents, cool slate gray for secondary elements.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no decorative symbols anywhere — including
titles, labels, captions, watermarks, or any text overlay at any position in
the rendered output.
{NATIONALITY_EXCEPTION_BLOCK}
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
""",

  ## ─────────────────────────────────────────────
  ## テンプレートB: 語彙カード・建物（1:1）
  ## v3.0 全面改訂（問題B/C/内部矛盾を恒久解決）:
  ##   - [SUBJECT] 看板を「英語短語ラベル1個」に確定（日本語は文字化け確定の
  ##     ため全廃）。{SIGNAGE_TEXT} には BUILDING_CUES の英語値のみを注入する。
  ##   - [SCENE & ACTION] 「3アンカー必須」を廃し {PRIMARY_SCENE_CUE} 1行に。
  ##     「上1/3 typography用余白」の指示を削除（GAS側オーバーレイの責務。
  ##     これが空のサイン枠量産＝問題C の主因だった）。
  ##   - [CONSTRAINTS] 許可は英語ラベル1個のみ。RECEPTION/ATM/BANK重複等の
  ##     二次ラテン語・日本語・数字を明示禁止。反クラッター文を追加。
  ## {SIGNAGE_TEXT}        = BUILDING_CUES[...]["signage_text"]（英語短語）
  ## {PRIMARY_SCENE_CUE}   = BUILDING_CUES[...]["primary_scene_cue"]（単一キュー）
  ## ─────────────────────────────────────────────
  "vocabulary_building": """
[PURPOSE]
Create a vocabulary card illustration for Japanese language learning materials.
The building must be IMMEDIATELY and UNAMBIGUOUSLY recognizable as a [{BUILDING_TYPE}] at a glance.

[SUBJECT]
The main subject is [{BUILDING_DESCRIPTION_AND_SCALE}].
Exactly ONE short ENGLISH building-name label, the single word [{SIGNAGE_TEXT}],
is printed cleanly and legibly on the building's fascia or a small sign above
the main entrance. This English word is the ONLY text anywhere in the image.
Do NOT render any Japanese characters, kanji, kana, or any non-Latin script.
Do NOT render any second word, slogan, address, phone number, or brand name.

[SCENE & ACTION]
Viewed from a slight three-quarter front angle at eye level, 35mm wide-angle lens equivalent.
Straight vertical lines, natural perspective with no fisheye distortion.
A flat pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette.
The building occupies about 70% of the frame and is centered.

Single identifying scene cue (use ONLY this one cue — do not add others):
[{PRIMARY_SCENE_CUE}]

Keep the composition calm and uncluttered. Render ONLY the building, the single
English label, and the one scene cue above. Do NOT invent or add any extra
signs, signboards, banners, posters, billboards, blank framed boards, screens,
display panels, window lettering, secondary buildings, vehicles, or background
clutter that is not explicitly described here.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: pale sky-blue background,
deep slate navy outlines, main_color and sub_color tones for the building facade (細部のみ educational_symbol_colors 許可),
warm amber gold for accent details.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
EXCEPTION (per 資料8, v3.0): EXACTLY ONE short ENGLISH building-name label
[{SIGNAGE_TEXT}] is permitted — one English word only, small, on the entrance fascia.
This is the SOLE permitted text. Absolutely NO other text of any kind:
no Japanese (kanji/kana), no second English word, no "RECEPTION"/"ATM"/"OPEN"
or any other label, no numbers, no titles, no captions, no decorative symbols
anywhere else in the image.
No gradients, no shadows, no 3D effects, no photoreal textures.
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
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm colors,
warm amber gold accents for emphasis.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image. VISUAL_SYMBOLS entries (question mark / checkmark / X mark / arrow) ARE PERMITTED when {VISUAL_SYMBOL_IF_NEEDED} is populated.
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
   (Choose EXACTLY ONE of: OBJECT_ALONE / HAND_HOLDING. Default = "OBJECT_ALONE".)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 4.10 OBJECT_STRATEGIES corresponding to {DISPLAY_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Iconization level: Detailed Flat (level 3).
Include symbolic material texture hints:
{MATERIAL_TEXTURE_HINT}
These are symbolic (not photorealistic) — thin lines, dashes, or highlights to suggest material.
No actual shading or gradients.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue
and warm amber gold as accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
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
Each tile has an equal-sized soft cream off-white background cell (warm off-white, NOT pure stark white).
All objects rendered at the same canonical 3/4 view and same scale.
Thin dividing lines between tiles (deep slate navy, 1pt weight).
No labels, no numbers, no captions inside the image.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Uniform color palette across all tiles.
Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm colors as fills.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image.
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
→ Render in a bold accent color (warm amber gold or symbol_red from educational_symbol_colors).
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
  with thin deep slate navy outlines on a soft cream off-white background.
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
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines,
neutral gray for reference object, bold accent for target object.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols anywhere — Exception 1 applies.
Directional arrows are PERMITTED if they clarify the position — use ARROW_SEMIOTICS rules.
A single surface plane (desk/floor) IS REQUIRED — this is not a "background element" but
a necessary spatial anchor.
No gradients, no shadows, no 3D effects, no photoreal textures.
Apply zero ambient lighting, zero drop shadows, zero global illumination.
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
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines,
muted warm blue for speaker territory,
warm amber gold for listener territory (also usable as accent in non-listener contexts).
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
   (Choose EXACTLY ONE of: MOTION_ARROW / OUTCOME / BEFORE_AFTER /
    SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES.)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 4.11 ACTION_VERB_STRATEGIES corresponding to {VISUALIZATION_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Camera: Eye-level, 50mm lens equivalent. Character and action fill 70% of frame.
   (For SEQUENCE_3PANEL: each panel's character fills ~70% of that panel.)
Simple minimal background — enough context to ground the action, no clutter.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
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

[SUBJECT]
Conceptual definition: {CONCEPT_DEFINITION}
Visual metaphor / symbolic object: {VISUAL_METAPHOR}
This metaphor is the concrete anchor that makes the abstract concept visible.
Render it clearly and centrally. Do not add competing visual elements.

[SCENE & ACTION]
Emotional tone: {EMOTIONAL_TONE}
Composition mood: {COMPOSITION_MOOD}
Color tone adjustment: {COLOR_TONE_ADJUSTMENT}
  (Example: warmth → add amber gold; coldness → cool slate blue tones)
The scene should feel {EMOTIONAL_TONE} — convey this through character posture,
spatial composition, and symbolic elements, NOT through facial expressions alone.

Camera: Centered, eye-level or slight elevation. Subject fills 70% of frame.
Background: minimal — large flat SOLID color fields only. NO gradients, NO shading of any kind, NO lighting effects (must remain completely flat solid fills, consistent with the STYLE RECIPE).

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
deep slate navy outlines, muted warm blue,
warm amber gold for warmth and positivity accents.
This should look like it belongs in a brand style guide, not like AI art. Keep line weights consistent.

[CONSTRAINTS]
No text, no letters, no numbers, no purely decorative symbols inside the image. Symbolic metaphor anchors (as defined in ABSTRACT_METAPHORS) ARE PERMITTED as part of the intended pedagogical metaphor.
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
   (Choose EXACTLY ONE of: PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY.
    Default = "PAIR_CONTRAST".)

{STRATEGY_BLOCK}
   ↑ Replace this placeholder with EXACTLY ONE strategy block from
     PART 4.12 ADJECTIVE_STRATEGIES corresponding to {ADJECTIVE_STRATEGY}.
     Do not paste more than one — combining strategies confuses the image
     generator and produces incoherent compositions.

Camera: Eye-level or canonical 3/4 view depending on the anchor object's nature.
Standard ~50mm-equivalent lens, no telephoto compression (Eye-level for human-scale items; canonical 3/4 for smaller objects).
Solid soft cream off-white background (warm off-white, NOT pure stark white). No additional scene context.

[STYLE RECIPE — DO NOT CHANGE]
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight.
Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
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
"""
}


## ============================================================
## PART 4: BUILDING CUES REFERENCE（建物別・機能手掛かり一覧）
## ============================================================
## v3.0 改訂（問題B/C 解決）:
##   - signage_text: 「日本語」→「英語短語」に全件変更。
##     画像生成器は日本語（漢字・かな）を描画できず確定的に文字化けするため。
##     英語（ラテン文字）は安定描画できる。Template B はこの値のみ注入する。
##   - primary_scene_cue: 各建物に新設。Template B v3.0 が使う唯一のシーンキュー。
##     旧 entrance_cue/user_action_cue/surrounding_anchor を1つの低クラッターな
##     キューに統合（「3アンカー必須」が問題C＝情報過多の主因だった）。
##   - 旧3フィールドは後方互換のため残置（旧 lesson の S列生成が参照する
##     可能性があるため）。Template B v3.0 では使用しない。
## v3.3: entrance_cue / user_action_cue / surrounding_anchor は
##       deprecated。primary_scene_cue が SSOT。新規 lesson から参照しない。
## ============================================================

BUILDING_CUES = {

  "会社": {
    "_en":                "company office",
    "building_type":      "company office",
    "building_scale":     "a mid-sized modern office building, not a skyscraper",
    "primary_scene_cue":  "automatic glass entrance doors with one office worker in a business suit walking in, carrying a briefcase",
    "signage_text":       "OFFICE",
    "entrance_cue":       "automatic glass doors with a simple rectangular company nameplate beside the entrance",
    "user_action_cue":    "one office worker in a business suit walking in, another walking out, both carrying briefcases",
    "surrounding_anchor": "a clean paved walkway and a small potted plant by the entrance door"
  },

  "学校": {
    "_en":                "school",
    "building_type":      "school",
    "building_scale":     "a cheerful Japanese elementary or junior high school building",
    "primary_scene_cue":  "a prominent school gate in the foreground with two children in school uniforms — one with a randoseru backpack — walking through it",
    "signage_text":       "SCHOOL",
    "entrance_cue":       "a prominent school gate with a fence in the foreground",
    "user_action_cue":    "two children in school uniforms — one carrying a randoseru backpack — walking through the gate",
    "surrounding_anchor": "a small playground area with equipment visible on one side"
  },

  "銀行": {
    "_en":                "bank",
    "building_type":      "bank",
    "building_scale":     "a small to medium neighborhood bank branch — NOT a corporate skyscraper",
    "primary_scene_cue":  "a single ATM unit beside the entrance door with one customer using it",
    "signage_text":       "BANK",
    "entrance_cue":       "an ATM unit clearly visible beside the entrance door",
    "user_action_cue":    "one customer using the ATM, another walking toward the entrance holding a bank card",
    "surrounding_anchor": "a reception counter faintly visible through the glass window"
  },

  "大学": {
    "_en":                "university",
    "building_type":      "university",
    "building_scale":     "a grand campus entrance gate with tall pillars and a modern academic building behind it",
    "primary_scene_cue":  "two young adult students in their 20s with backpacks walking through the campus gate",
    "signage_text":       "UNIVERSITY",
    "entrance_cue":       "a bulletin board with papers posted on it near the entrance path",
    "user_action_cue":    "three young adult students in their 20s in casual clothes with backpacks or laptops walking near the gate",
    "surrounding_anchor": "a bicycle parking rack with several bikes just inside the gate, a tree-lined walkway"
  },

  "デパート": {
    "_en":                "department store",
    "building_type":      "department store",
    "building_scale":     "a tall elegant multi-story urban building — clearly upscale, not a supermarket",
    "primary_scene_cue":  "wide elegant ground-floor display windows showing fashion items, with one shopper carrying a shopping bag near the entrance",
    "signage_text":       "DEPT. STORE",
    "entrance_cue":       "wide elegant display windows on the ground floor showing fashion items and accessories",
    "user_action_cue":    "two shoppers near the entrance, both carrying large shopping bags",
    "surrounding_anchor": "an escalator faintly visible through the glass facade"
  },

  "病院": {
    "_en":                "hospital",
    "building_type":      "hospital",
    "building_scale":     "a medium to large hospital building with a calm, clean exterior",
    "primary_scene_cue":  "a covered entrance canopy with a wheelchair ramp and a clearly visible red cross symbol on the facade",
    "signage_text":       "HOSPITAL",
    "entrance_cue":       "a covered entrance canopy with a wheelchair ramp beside the main door",
    "user_action_cue":    "a medical staff member in scrubs near the entrance, one patient with a family member",
    "surrounding_anchor": "an ambulance bay or emergency vehicle space at the side"
  },

  "駅": {
    "_en":                "train station",
    "building_type":      "train station",
    "building_scale":     "a Japanese train station entrance building",
    "primary_scene_cue":  "ticket gates visible through the open entrance with one commuter walking in",
    "signage_text":       "STATION",
    "entrance_cue":       "ticket gates or ticket machines slightly visible through the entrance, a route map board",
    "user_action_cue":    "commuters walking in and out, one person checking a transit card",
    "surrounding_anchor": "a bus stop sign or taxi waiting area near the entrance, a clock above the entrance"
  },

  "スーパー": {
    "_en":                "supermarket",
    "building_type":      "supermarket",
    "building_scale":     "a wide low-rise supermarket building with a broad storefront",
    "primary_scene_cue":  "automatic sliding doors with a row of shopping carts beside them and one customer pushing a cart out",
    "signage_text":       "SUPERMARKET",
    "entrance_cue":       "automatic sliding doors with shopping carts and baskets near the entrance",
    "user_action_cue":    "customers leaving with grocery bags, one person pushing a cart",
    "surrounding_anchor": "simple vegetable or sale posters near the entrance windows"
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

  "雑誌": {
    "_en":                "magazine",
    "primary_signatures": [
      "A bold magazine title/masthead banner printed across the very top of the cover — the single strongest identifier",
      "Multiple coverline headlines in different font sizes layered over a cover photo",
      "Visible physical thinness compared to a book — the spine is thin"
    ],
    "material_hints": [
      "Subtle curved lines at the bottom edge of pages as flat paper edges (no gloss)",
      "A faint saddle-stitch line along the spine center"
    ],
    "avoid": "Do not draw it as a thick hardcover book. Do not omit the masthead banner.",
    "canonical_view": "3/4 view from slightly above — shows front cover AND spine thickness"
  },

  "本": {
    "_en":                "book",
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

  "新聞": {
    "_en":                "newspaper",
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

  "ノート": {
    "_en":                "notebook",
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

  "ケータイ・スマートフォン": {
    "_en":                "smartphone",
    "primary_signatures": [
      "App icon grid visible on the screen — small colored rounded squares in a 3×4 grid",
      "Rear camera module: a cluster of 2-3 circular lens openings in the top-left corner of the back",
      "Status bar at the top of the screen showing simplified time or signal icons"
    ],
    "material_hints": [
      "A flat white reflection mark (single straight line, no gradient) across the top-right of the screen — symbolic glass surface",
      "Metallic thin frame line along the edges of the device"
    ],
    "avoid": "Do not render as a plain black rectangle with no screen content.",
    "canonical_view": "Slight 3/4 from above showing screen face AND one side edge"
  },

  "パソコン": {
    "_en":                "laptop/computer",
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

  "テレビ": {
    "_en":                "television",
    "primary_signatures": [
      "Wide rectangular screen with a visible bezel frame",
      "A flat stand or wall-mount base below the screen",
      "A simplified image or pattern visible on the screen"
    ],
    "material_hints": [
      "Thin flat highlight line across the top edge of the screen (symbolic, no gloss)",
      "Slim body depth visible from the side — modern flat panel"
    ],
    "avoid": "Do not draw old CRT shape unless context requires it.",
    "canonical_view": "Slight 3/4 from eye level — shows screen AND stand base"
  },

  "カメラ": {
    "_en":                "camera",
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

  "財布": {
    "_en":                "wallet",
    "primary_signatures": [
      "Dashed stitching lines along all edges — the single strongest leather identifier",
      "Bi-fold structure with a visible center crease/fold line",
      "Multiple card slot openings peeking out from the top or side"
    ],
    "material_hints": [
      "Subtle dot stippling pattern on the leather surface as symbolic grain texture",
      "A metal snap button or clasp on the closure point"
    ],
    "avoid": "Do not omit the stitching. Without stitching it looks like a generic rectangle.",
    "canonical_view": "3/4 from slightly above — shows front face, fold crease, AND one edge"
  },

  "カード": {
    "_en":                "card",
    "primary_signatures": [
      "A gold or silver EMV chip rectangle in the upper-left area — the definitive credit card symbol",
      "A horizontal magnetic stripe across the back (if back view) — dark brown stripe",
      "Perfectly precise rounded corners — sharper and more uniform than a folded wallet"
    ],
    "material_hints": [
      "A thin diagonal white reflection line across the card surface (single flat line, no sheen)",
      "Holographic rainbow stripe near the chip (optional, for credit card)"
    ],
    "avoid": "Do not confuse with smartphone (card has no screen/camera). Always include chip.",
    "canonical_view": "Slight 3/4 from above — shows card face AND one short edge thickness"
  },

  ## ────────────────────────────
  ## 乗り物系
  ## ────────────────────────────

  "車": {
    "_en":                "car",
    "primary_signatures": [
      "Visible wheel arches with circular tires clearly rendered",
      "Side windows as distinct transparent (light blue tinted) shapes",
      "A door handle line along the side panel"
    ],
    "material_hints": [
      "Thin white reflection line along the roof roofline (single flat line, no sheen)",
      "Headlight lens details — circular or trapezoidal lens shapes"
    ],
    "avoid": "Do not draw without wheels — wheels are the primary vehicle identifier.",
    "canonical_view": "3/4 front-side view — shows front face, side, AND wheels"
  },

  "自転車": {
    "_en":                "bicycle",
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

  "コップ・グラス": {
    "_en":                "cup/glass",
    "primary_signatures": [
      "Transparent or semi-transparent cylinder — show light blue interior tint",
      "A subtle flat highlight line on the left side of the glass (symbolic, no specular)",
      "No handle = glass/コップ; with handle = mug/マグカップ (distinguish clearly)"
    ],
    "material_hints": [
      "Thin white flat line across the top rim (no shading)",
      "A faint liquid level line inside if drink contents are shown"
    ],
    "avoid": "Do not make it fully opaque — transparency is the key identifier.",
    "canonical_view": "Slight 3/4 from above — shows opening rim AND side profile"
  },

  "茶碗": {
    "_en":                "rice bowl",
    "primary_signatures": [
      "Shallow curved bowl shape with a curved inward foot ring at the base",
      "White rice texture inside if top view is shown — small grain dots",
      "Traditional ceramic pattern or simple band design on the exterior"
    ],
    "material_hints": [
      "Matte ceramic surface — no glossy specular highlights",
      "A deep slate navy outline at the base contour"
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

  "上": {
    "_en":        "to the top of",
    "_jp_full":   "on top, above (上に)",
    "camera":   "Eye-level side view (50mm lens). The reference object at the center-bottom of the frame.",
    "layout":   "The target object rests directly on top of the reference object's upper surface. Exaggerate the vertical gap slightly.",
    "grid_aid": "Draw 2-3 horizontal floor/shelf lines behind the scene to reinforce the vertical axis."
  },

  "下": {
    "_en":        "to the bottom of",
    "_jp_full":   "under / below (下に)",
    "camera":   "Eye-level side view (50mm lens). The reference object at the center-upper area.",
    "layout":   "The target object is positioned directly below the reference object, resting on the floor/surface.",
    "grid_aid": "Draw a clear floor line to anchor both objects vertically."
  },

  "中": {
    "_en":        "inside",
    "_jp_full":   "inside (中に)",
    "camera":   "Slight elevated 3/4 view to show interior. The container reference object centered.",
    "layout":   "The container walls are rendered as semi-transparent outlines so the interior target is visible.",
    "grid_aid": "A dashed inner rectangle inside the container outline reinforces the 'inside' concept."
  },

  "前": {
    "_en":        "in front of",
    "_jp_full":   "in front of (前に)",
    "camera":   "FIRST-PERSON POV — no character drawn. The viewer IS the speaker looking forward.",
    "layout":   "The reference object is at the center background. The target object is between the viewer and the reference, closer to the camera.",
    "grid_aid": "Floor tiles or a perspective grid strongly recommended to reinforce depth / front vs back."
  },

  "後ろ": {
    "_en":        "behind",
    "_jp_full":   "behind (後ろに)",
    "camera":   "FIRST-PERSON POV — no character drawn. The viewer IS the speaker looking forward.",
    "layout":   "The reference object is in the center foreground. The target object is partially hidden behind it, smaller due to perspective.",
    "grid_aid": "Use a perspective grid. The target object should be peeking out from behind the reference."
  },

  "右": {
    "_en":        "to the right of",
    "_jp_full":   "to the right (右に)",
    "camera":   "BACK-FACING VIEW. Draw the character from behind (we see their back). Character faces forward.",
    "layout":   "The target object is positioned to the RIGHT of the character from the character's own perspective — which is also the viewer's right.",
    "grid_aid": "An amber-colored right-pointing arrow above the target object reinforces the direction."
  },

  "左": {
    "_en":        "to the left of",
    "_jp_full":   "to the left (左に)",
    "camera":   "BACK-FACING VIEW. Draw the character from behind (we see their back). Character faces forward.",
    "layout":   "The target object is positioned to the LEFT of the character from the character's own perspective — which is also the viewer's left.",
    "grid_aid": "An amber-colored left-pointing arrow above the target object reinforces the direction."
  },

  "となり": {
    "_en":        "next to / beside",
    "_jp_full":   "next to / beside (そばに・となりに)",
    "camera":   "Eye-level front view (50mm lens).",
    "layout":   "Both the reference object and target object are side by side at the same depth plane, with a small visible gap between them.",
    "grid_aid": "A double-headed horizontal arrow between the two objects reinforces adjacency."
  },

  "間": {
    "_en":        "between",
    "_jp_full":   "between (間に)",
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
    "color":   "Warm amber gold or symbol_red (use educational_symbol_colors.symbol_red)"
  },

  "straight_long_thin": {
    "shape":   "Long thin arrow with small arrowhead",
    "meaning": "Pointing into the distance; extending the viewer's line of sight",
    "use_cases": [
      "「あそこ」「あちら」— pointing to distant objects",
      "Far-distance markers in demonstrative kosoado illustrations"
    ],
    "color":   "Cool slate gray"
  },

  "curved_arc": {
    "shape":   "Curved arc arrow (semicircle shape)",
    "meaning": "Rotation, turning, redirecting attention or gaze",
    "use_cases": [
      "「こちらを向いて」— directing gaze toward speaker",
      "「あ」の心理的引き込みで領域が曲線的に変形する動き"
    ],
    "note":    "「振り向く」等の CURVED_MOTION 系動詞は、テンプレ H の "
               "MOTION_ARROW 戦略 + ARROW_SEMIOTICS.curved_arc の "
               "組合せで表現する（curved_arc 単独戦略は無い）。",
    "color":   "Muted warm blue"
  },

  "double_headed": {
    "shape":   "Arrow with arrowheads on both ends",
    "meaning": "Comparison, reciprocal relationship, distance measurement",
    "use_cases": [
      "「となりに」— adjacency with measured gap",
      "「間に」— between two reference points",
      "語彙比較グリッドでの category boundary line"
    ],
    "color":   "Cool slate gray"
  },

  "motion_lines": {
    "shape":   "Multiple parallel curved or straight strokes radiating from a moving object",
    "meaning": "Speed, vibration, kinetic energy",
    "use_cases": [
      "「走る」「飛ぶ」「投げる」— fast physical action",
      "動作の軌跡を強調する補助線として"
    ],
    "color":   "Cool slate gray, thin weight"
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

  "好き": {
    "_en":                "like / love",
    "composition_mood":   "warm and affectionate, centered figure-with-symbol composition",
    "concept_definition": "Positive emotional attachment to a person, thing, or activity",
    "visual_metaphor":    "A character holding a large solid amber heart shape toward the viewer (no glow / no gradient), or cradling an object with both hands in a protective gesture",
    "emotional_tone":     "warm, inviting, gentle",
    "color_adjustment":   "Increase warm amber gold and symbol_pink_warm tones (use educational_symbol_colors)"
  },

  "嫌い": {
    "_en":                "dislike / hate",
    "composition_mood":   "cool dismissive, figure turning away from object",
    "concept_definition": "Negative emotional rejection of a person, thing, or activity",
    "visual_metaphor":    "A character turning away from an object with one hand held up (stop gesture), or an X mark hovering over the disliked object",
    "emotional_tone":     "tense, rejecting",
    "color_adjustment":   "Use symbol_blue_cool tones; avoid warm colors (use educational_symbol_colors)"
  },

  "楽しい": {
    "_en":                "fun / enjoyable",
    "composition_mood":   "upbeat dynamic, multiple small sparkle marks around figure",
    "concept_definition": "A state of joy and engagement in an activity",
    "visual_metaphor":    "A character with arms raised, surrounded by small star or sparkle shapes; OR two characters doing an activity together with visible energy lines",
    "emotional_tone":     "energetic, light, celebratory",
    "color_adjustment":   "Warm amber gold accents (color_palette.accent); high visual energy in composition"
  },

  "悲しい": {
    "_en":                "sad",
    "composition_mood":   "quiet inward, downward composition with weight",
    "concept_definition": "A state of emotional sorrow or grief",
    "visual_metaphor":    "A character sitting with head bowed; OR a wilting flower; OR a single teardrop shape above the character",
    "emotional_tone":     "quiet, heavy, withdrawn",
    "color_adjustment":   "Dominant cool slate gray and muted blue; reduce warm tones"
  },

  "嬉しい": {
    "_en":                "happy / glad",
    "composition_mood":   "expansive open, radiating sparkles outward",
    "concept_definition": "A state of pleasure or delight, often in response to good news",
    "visual_metaphor":    "A character with both hands raised in celebration, or a character receiving something with a big open smile; sparkle lines radiating outward",
    "emotional_tone":     "bright, expansive, celebratory",
    "color_adjustment":   "Maximum warm amber gold accents"
  },

  "怒る": {
    "_en":                "angry",
    "composition_mood":   "sharp tense, jagged radiating lines",
    "concept_definition": "A state of strong displeasure or irritation",
    "visual_metaphor":    "A character with a furrowed brow, clenched fist raised, with jagged spike lines or steam lines radiating from the head",
    "emotional_tone":     "tense, sharp, kinetic",
    "color_adjustment":   "symbol_red accent lines (use educational_symbol_colors); reduce soft tones"
  },

  "疲れる": {
    "_en":                "tired / exhausted",
    "composition_mood":   "slumped heavy, downward depleted composition",
    "concept_definition": "A state of physical or mental depletion after effort",
    "visual_metaphor":    "A character slumped in a chair or leaning against a wall, with downward drooping lines from the eyes or head",
    "emotional_tone":     "heavy, slow, depleted",
    "color_adjustment":   "Muted, desaturated palette; reduce bright accents"
  },

  "心配": {
    "_en":                "worry / anxiety",
    "composition_mood":   "uncertain inward, single floating question mark above",
    "concept_definition": "A state of mental unease about an uncertain future event",
    "visual_metaphor":    "A character with one hand on their chin looking upward at a large question mark cloud; OR a character looking at a clock with a worried posture",
    "emotional_tone":     "uncertain, tense, inward",
    "color_adjustment":   "cool slate gray dominant (color_palette.sub_color); warm amber gold for the question mark symbol only"
  },

  ## ────────────────────────────
  ## 社会・関係
  ## ────────────────────────────

  "友達・友情": {
    "_en":                "friendship",
    "composition_mood":   "balanced symmetric, two figures or interlocked pieces",
    "concept_definition": "A close mutual bond of trust and affection between people",
    "visual_metaphor":    "Two characters standing side by side, shoulders touching, both facing forward; OR two puzzle pieces fitting perfectly together with a small amber star mark at the joint (no lighting effect)",
    "emotional_tone":     "warm, balanced, connected",
    "color_adjustment":   "Equal warm amber gold on both characters; unified palette"
  },

  "家族": {
    "_en":                "family",
    "composition_mood":   "warm cluster, multiple figures harmonized",
    "concept_definition": "A group of people connected by blood, care, and shared life",
    "visual_metaphor":    "Three or more figures of different heights standing together in a cluster, all facing forward",
    "emotional_tone":     "warm, protective, stable",
    "color_adjustment":   "Harmonized warm tones across all figures (skin tones naturally varied, but visually balanced)"
  },

  "仕事": {
    "_en":                "work",
    "composition_mood":   "focused structured, desk-anchored composition",
    "concept_definition": "Purposeful activity done as an occupation or duty",
    "visual_metaphor":    "A character at a desk with papers/laptop and a clock visible in the background; OR a character in work attire carrying tools of their trade",
    "emotional_tone":     "focused, purposeful, structured",
    "color_adjustment":   "Neutral muted blue dominant; amber for accent details"
  },

  "生活": {
    "_en":                "daily life / lifestyle",
    "composition_mood":   "calm grounded, home-anchored everyday objects",
    "concept_definition": "The pattern of everyday activities that make up a person's life",
    "visual_metaphor":    "A character in a home setting surrounded by everyday objects (bed, table, cup); OR a clock cycle with small icons around it showing morning/afternoon/night activities",
    "emotional_tone":     "calm, routine, grounded",
    "color_adjustment":   "Soft neutral palette; warm cream and muted blue"
  },

  ## ────────────────────────────
  ## 時間・変化
  ## ────────────────────────────

  "むかし": {
    "_en":                "long ago / past",
    "composition_mood":   "nostalgic distant, sepia-toned simplified scene",
    "concept_definition": "A time far in the past, often with nostalgic or historical connotation",
    "visual_metaphor":    "An old-style calendar or scroll; OR a sepia-toned silhouette of an older-era scene (simplified house or clothing style); OR a clock with hands turning backward",
    "emotional_tone":     "nostalgic, soft, distant",
    "color_adjustment":   "warm amber gold and symbol_sepia tones dominant (use educational_symbol_colors); reduce bright colors"
  },

  "これから": {
    "_en":                "from now on / future",
    "composition_mood":   "hopeful forward, horizon-anchored facing right",
    "concept_definition": "The time ahead; a sense of beginning or forward momentum",
    "visual_metaphor":    "A character walking forward on a path that extends into the horizon; OR a flat amber horizon band with figure silhouette facing right (no actual lighting)",
    "emotional_tone":     "hopeful, forward-moving, open",
    "color_adjustment":   "warm amber gold for the horizon/light source; symbol_sky_pale for the sky (use educational_symbol_colors)"
  },

  "変わる": {
    "_en":                "change",
    "composition_mood":   "transitional, before/after split with curved transition arrow",
    "concept_definition": "A state of transformation from one form or condition to another",
    "visual_metaphor":    "Two-panel before/after: left panel shows old state (muted colors), right panel shows new state (brighter colors), with a curved arc arrow between them",
    "emotional_tone":     "dynamic, transitional",
    "color_adjustment":   "Left panel: cool slate gray (color_palette.sub_color); Right panel: warm amber gold and muted warm blue"
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
- 「こ」zone (speaker's side): highlight with speaker's accent color (muted warm blue).
- 「そ」zone (listener's side): highlight with listener's accent color (warm amber gold).
- 「あ」zone (outside both): neutral gray zone beyond both territories.
The target object [{TARGET_OBJECT}] is placed in the [{TARGET_ZONE}] zone.
Both speaker and listener face each other with clear pointing gesture toward the target object.
""",

  "parallel": """
[MODEL TYPE: PARALLEL (並行型)]
Speaker and listener stand side by side, both facing the same direction.
Draw a shared ellipse close to them representing the こ zone (muted warm blue),
then a medium-distance zone representing そ (warm amber gold),
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
## PART 5: VISUAL SYMBOLS（視覚的慣習シンボル一覧）
## ============================================================
## ※ v2.2 から変更なし。例文画像（テンプレートC）で使用。
## ============================================================

## v3.4 (M-32) note: VISUAL_SYMBOLS のうち「2択・比較」「怒り・感情」エントリは
##   それぞれテンプレ J (PAIR_CONTRAST) / テンプレ H (SYMBOLIC_MOTION_LINES) /
##   テンプレ I (abstract_concept) と機能重複する。
##   - テンプレ J/H/I 本文で表現できる場合はそちらを優先。
##   - VISUAL_SYMBOLS は例文画像（テンプレ C）の補助シンボルとして利用するのが原則。
VISUAL_SYMBOLS = {
  "質問・疑問":  # _en="question" (v3.4 M-7)
   
    "A large, clearly drawn bold question mark symbol floats above the subject's head.",

  "はい・肯定":  # _en="yes" (v3.4 M-7)
   
    "A large symbol_green circle with a bold checkmark floats above the character (use educational_symbol_colors.symbol_green).",

  "いいえ・否定":  # _en="no" (v3.4 M-7)
   
    "A large symbol_red circle with a bold X mark floats above the character (use educational_symbol_colors.symbol_red).",

  "動作の方向":  # _en="action direction" (v3.4 M-7)
   
    "A curved symbol_red or symbol_orange motion arrow indicates the direction of the action (use educational_symbol_colors).",

  "指示・注目":  # _en="pointing" (v3.4 M-7)
   
    "The character points clearly with one hand toward the subject of attention.",

  "2択・比較":  # _en="yes/no split" (v3.4 M-7)
   
    "A split image divided into two equal panels side by side. Left panel: yes/positive. Right panel: no/negative.",

  "怒り・感情":  # _en="emotion" (v3.4 M-7)
   
    "A facial expression and body posture clearly convey the emotion. No ambiguity.",

  "場所の提示":  # _en="showing location" (v3.4 M-7)
   
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
    "肌の色が generic_* キャラ間で過剰にバラついていないか（v3.3: NOT specified / multicultural variation 採用）",
    "体型・シルエットが一致しているか",
    "顔の形・髪型・髪の色が前回と大きくずれていないか",
    "特徴的なアイテム（眼鏡・白衣・スーツ等）が一致しているか"
  ],

  "style_consistency": [
    "フラットベクタースタイルが維持されているか（グラデーション・影が入っていないか）",
    "輪郭線の太さが均一か",
    "カラーパレットが規定の色調（STYLE_BIBLE 参照）か",
    "プロンプト本文・ARROW_SEMIOTICS・reset_prompt に #HEX や hex value が一切残っていないか（問題F: 色名のみ運用 / v3.1 で全廃完了）",
    "背景が指定通りか（語彙カード=温かいオフホワイト〔純白ではない〕／例文=最小限の文脈／建物=淡いスカイブルー全面）",
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
      "建物の種類が外観だけで（看板の英語ラベルを隠しても）わかるか",
      "primary_scene_cue（単一・低クラッター）が描かれているか（BUILDING_CUES 参照）",
      "余計な看板・空のサイン枠・二次ラテン語（RECEPTION/ATM/OPEN 等）・日本語が無いか",
      "看板の英語短語ラベル1個のみで、他のテキストが入っていないか"
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

  判断が難しい語彙の基準:
    - 「写真を撮る」→ action_verb（動作が主）
    - 「ペン」→ concrete_object（物体として示す）
    - 「嬉しい」→ abstract_concept（目に見えない状態）
    - 「右側の席」→ spatial_relation（位置関係が主）
    - 「大変（な仕事）」→ abstract_concept（感情・評価を伴う）
    - 「大きい（机）」→ adjective（物体の性質を示す形容詞）

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
            ※ 同じ役割について NAMED_CHARACTER と ROLE_BASED 両方が定義される時、
              NAMED_CHARACTER_PROFILES（鈴木さん等）が優先される。
  Step 2-B: 年齢層・性別を選択 → CHARACTER_PROFILES の generic_* から選択
            v3.3 多文化配慮: skin tone は NOT specified / hair は varied dark を default。
  Step 2-C: outfit_hints / scene_hints を組み合わせる
  Step 2-D: 同一セット内の整合性確保（同じ役割なら同じ generic_* を採用）
  → テンプレートA（vocabulary_person）を使用
  → 画像プロンプトに固有名詞（Tanaka-sensei 等）は絶対に書かない

  Step 2-E: ★ 国籍名詞語彙の場合（v3.0 新規 / 問題A・E 解決）
            対象: アメリカ人・韓国人・日本人・中国人・ブラジル人・
                  ベトナム人・スペイン人 等（vocab_type=person の国籍名詞）
            → PART 1.1 NATIONALITY_NOUN_POLICY に必ず従う。
            → テンプレートA を使用し、[SUBJECT] は
              NATIONALITY_NOUN_POLICY["subject_block_pattern"] を採用。
            → {FLAG_SHAPE_AND_COLORS} に flag_shape_and_colors_hint の要領で
              「文字なしの形・色のみ」を記述する（国名の綴りは絶対に書かない）。
            → ⚠ 旧 v1_1 由来の「PRIMARY / sole identifier / 10-12% /
              facing forward / 服全面印刷 / 手に持つ」は絶対に書かない
              （これらが問題A＝旗の巨大化の直接原因）。
            → 固定5名（鈴木さん等）には本ポリシーを適用しない。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2.5: 建物画像の設計（vocab_type: building）【v3.0 新規 / 問題B・C 解決】
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 2.5-A: BUILDING_CUES から対象建物のエントリを取得。
  Step 2.5-B: テンプレートB（vocabulary_building）を使用し、以下を注入:
              {BUILDING_TYPE}                = 英語の建物種別（例: bank）
              {BUILDING_DESCRIPTION_AND_SCALE} = ["building_scale"]
              {SIGNAGE_TEXT}   = ["signage_text"]（★英語短語。例: "BANK"）
              {PRIMARY_SCENE_CUE} = ["primary_scene_cue"]（★単一キュー1行のみ）
  Step 2.5-C: ⚠ 厳守事項（問題B・C の再発防止）:
              - 看板は英語短語1個のみ。日本語（「銀行」等）は注入しない
                （画像生成器が描画できず確定的に文字化けする）。
              - シーンキューは primary_scene_cue の1行のみ。
                旧 entrance_cue/user_action_cue/surrounding_anchor を
                3つ並べて注入しない（情報過多＝問題C の主因）。
              - 「上1/3はtypography用余白」を書かない。語ラベルの帯文字は
                GAS側オーバーレイの責務であり、画像内に空のサイン枠を
                描かせない。
              - 反クラッター文（テンプレB [SCENE & ACTION] 末尾）を必ず残す。
  Step 2.5-D: 本ガイドの変更だけでは既存 S列・既存画像は直らない。
              改訂履歴 §4 の適用手順（S列再生成 → スモーク → バッチ）に従う。

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
            → v3.5 (M-15 wave): {STRATEGY_BLOCK} に PART 4.10 OBJECT_STRATEGIES
              の {DISPLAY_STRATEGY} 値（OBJECT_ALONE / HAND_HOLDING）に対応する
              ブロックをコピーして埋め込む。⚠ 複数戦略を混ぜないこと。
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
              → v3.4 (M-10): {SPEAKER_DESCRIPTION} / {LISTENER_DESCRIPTION} =
                CHARACTER_PROFILES.generic_* から generic_male_adult /
                generic_female_adult / generic_boy / generic_girl 等を選び、
                fixed_features を 1 文に展開して挿入する。
                ※ v3.3 多文化配慮: skin NOT specified / hair varied dark で展開。
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
    SYMBOLIC_MOTION_LINES → 速度・強度が意味の動詞（走る・飛ぶ・叩く 等）
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
            → v3.5 (M-15 wave): {STRATEGY_BLOCK} に PART 4.11
              ACTION_VERB_STRATEGIES の {VISUALIZATION_STRATEGY} 値に対応する
              ブロックをコピーして埋め込む。⚠ 複数戦略を混ぜないこと。

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
              → v3.5 (M-15 wave): {STRATEGY_BLOCK} に PART 4.12
                ADJECTIVE_STRATEGIES の {ADJECTIVE_STRATEGY} 値（PAIR_CONTRAST
                / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY）に対応するブロックを
                コピーして埋め込む。⚠ 複数戦略を混ぜないこと。

  Step 6.5-D: ⚠ 注意:
              ✗ 顔の表情で形容詞を示さないこと（「大きい」→ 驚いた顔 はNG）
              ✗ 物体の見た目とシンボルマークのみで意味を伝える
              ✗ SINGLE_HIGHLIGHT のシンボルマークは3-5個まで（過剰にしない）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 7: 例文画像の設計（テンプレートC）
━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → テンプレートC（example_sentence）を使用（v2.3 で変更なし）
  → VISUAL_SYMBOLS から必要なシンボルを参照
  → S+V+O 関係が視覚的に明確になるよう構図を設計

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
- flag pin / nationality_visual_hints 規律:
    NAMED_CHARACTER_PROFILES: nationality_visual_hints は optional（キャラ設定に従う）
    NATIONALITY_NOUN_POLICY:  「中国人」「アメリカ人」等の汎用語に対しては
                              flag pin を必須化（小さく・4% 以下）
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
  みんなの日本語:    固定キャラあり → NAMED_CHARACTER_PROFILES（鈴木さん等5名）を使用、
                                      それ以外の役割は ROLE_BASED_GENERIC_PROFILES
  げんき:           固定キャラあり → 同上
"""


## ============================================================
## ============================================================
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
##   {STRATEGY_BLOCK}           = OBJECT_STRATEGIES / ACTION_VERB_STRATEGIES /
##                                ADJECTIVE_STRATEGIES の該当値を転記（テンプレ
##                                D/H/J・v3.5 M-15 wave）
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
