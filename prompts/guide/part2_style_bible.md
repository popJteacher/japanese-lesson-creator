# PART 2: STYLE_BIBLE

> 対象：全 vocab_type の視覚的基底（線・色・コントラスト・焦点距離・iconization level）。
> prompt template の `[STYLE RECIPE]` ブロック生成時に参照。
> Migrated from `prompts/master_prompt_design_guide_v4_0.py` (hash 891b73f5ae2d) — lines 877-1168.
> See also: [PART 1](part1_universal_rules.md), [PART 4](part4_prompt_templates.md), [PART 6](part6_output_instructions.md).

---

## Overview

資料 6 より：スタイル固定フレーズは 5〜7 トークン以内に収め、プロジェクト完了まで一言一句変えずに使用する。同義語の言い換えはスタイルドリフトの原因になる。

資料 11 より：カノニカル・パースペクティブ（斜め上 30-45 度）が識別速度・正確性を最大化する。v2.3 で反映。

旧方針（資料 9・v3.0 で廃止）：色は「色名 + #HEX + hex value」の三重指定で安定化（Double-Hex Anchoring）— v3.0 で **「色名のみ」に統一**（Imagen のテキスト描画バグ誘発とトークン浪費のため）。#HEX や hex value は本ガイドおよびテンプレート本文に一切書かない。

---

## BACKGROUND_BY_TYPE

> v3.4 (M-5) で導入された vocab_type 別の背景文字列定数。
> v4.0.4 (2026-05-25) 改訂：building の v4.0.4 採用 4 件（学校 / 大学 / デパート / 会社）は default cream に統合。`BACKGROUND_BY_TYPE["building"]` (pale sky-blue) は未移行 4 件（銀行 / 病院 / 駅 / スーパー）の legacy v3.0 generation 経路のみで使用。
> [`scripts/invariants.mjs`](../../scripts/invariants.mjs) の C4 不変条件と整合する SSOT。
> テンプレート本文の背景文字列はこの定数値を **一字一句一致**させる（[PART 6 preflight](part6_output_instructions.md#65-preflight-invariants-mechanical-gates) [C4] が機械検証）。

| key | 値 | scope |
|---|---|---|
| `default` | `soft cream off-white background (warm off-white, NOT pure stark white)` | 全 vocab_type の default。v4.0.4 採用 building 4 件も本値を使用 |
| `building` (legacy) | `pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette` | 未移行 building 4 件（銀行 / 病院 / 駅 / スーパー）の legacy v3.0 Template B 生成経路のみ |

`BUILDING_BACKGROUND_EXACT = BACKGROUND_BY_TYPE["building"]`（コード側エイリアス・legacy 用途のみ・v4.0.4 採用 4 件では参照されない）。

v4.0.4 採用 4 件の [Template B](part4_prompt_templates.md#template-b-v404--採用-4-件用) は `{BG_EXACT}` placeholder を `BACKGROUND_BY_TYPE["default"]` = BG_EXACT_CREAM で埋める（全 vocab_type 統一）。

---

## core_style

全画像共通の固定フレーズ（変更厳禁）。skill が `[STYLE RECIPE]` ブロックに必ずこの 1 行を入れる。

```
Minimalist flat vector illustration. Clean continuous black outlines with consistent line weight. Completely flat solid color fills only. No gradients, no shadows, no 3D effects, no photoreal textures. This should look like it belongs in a brand style guide, not like AI art.
```

---

## color_palette

大人・混合クラス向け。資料 7 より、大人向けは落ち着いたミュートカラーが認知負荷を下げる。

v3.0 改訂（問題F解決）：「色名 + #HEX + hex value」三重指定は (1) Imagen のテキスト描画バグを誘発（v2.5.1 で確認）、(2) 余分なトークンを消費。v2.9 実測で「色名のみ」でも品質が維持されることが確認済み。**全色を色名のみに統一する。#HEX・hex value は一切書かない**。

| token | 値 |
|---|---|
| `background` | `Soft cream off-white (warm off-white, NOT pure stark white)` |
| `outline` | `Deep slate navy` |
| `main_color` | `Muted warm blue` |
| `accent` | `Warm amber gold` |
| `sub_color` | `Cool slate gray` |
| `skin_tones` | `Skin tone is intentionally NOT specified — naturally diverse / multicultural variation expected.` |

### educational_symbol_colors

> v3.3 新規。VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS.color_adjustment で使う symbolic / pedagogical color tokens。
> `core_style` の 'flat solid' 規律内で使用。

| token | 用途 |
|---|---|
| `symbol_red` | `muted symbolic red`（質問・否定・警告用） |
| `symbol_green` | `muted symbolic green`（checkmark・正解用） |
| `symbol_orange` | `muted symbolic orange`（注意・選択用） |
| `symbol_blue_cool` | `cool slate blue`（冷却・否定情緒） |
| `symbol_pink_warm` | `warm muted pink`（好意・愛情情緒） |
| `symbol_sepia` | `muted sepia`（過去・記憶） |
| `symbol_sky_pale` | `pale sky blue`（未来・空間） |

### note

> v3.3: educational_symbol_colors サブセクションを追加し、VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS の symbolic 色を正式化。
>
> v3.2: 背景色名を SCENE と STYLE RECIPE で一致させ統一（旧『soft cream white』→『soft cream off-white (warm off-white, NOT pure stark white)』）。v3.1 までは SCENE のみ off-white で RECIPE は white のままだったため白飛びを「抑制」していたが、v3.2 で両者を同一表記にし矛盾を「除去」した。#HEX や hex value は引き続き一切書かない。
>
> 今後この背景色名は SCENE と STYLE RECIPE で常に一字一句一致させること（新・反ドリフト原則）。

---

## visual_contrast_principle

> v3.10 新規。普遍視覚対比規律。
> v3.9 実機検証で「light-blue cardigan + light-blue marker pen」のような「服と prop が同色相で prop が埋没する」事象が確認された。v3.9 では `compose_role_subject` 内に palette-aware prop contrast rule を加えたが、これは role 専用で他 vocab_type（concrete_object / adjective PAIR_CONTRAST / abstract_concept / spatial_relation / building）から見えなかった。v3.10 では STYLE_BIBLE 直下に普遍ルールとして昇格させ、将来の vocab_type 実装で同種「色被り埋没」事象を予防する。
>
> color_palette との関係：palette 自体は不変。本ルールは palette 内で「どの 2 色を組み合わせるか」の選択規律。
> educational_symbol_colors との関係：symbolic 色は「意味」で選び、本ルールは「視認性」で選ぶため両者直交。symbol_red は質問記号として常に red、visual_contrast_principle は symbol_red を置く背景や周辺要素の色を別系統にする判断を担う。

### principle

```
Within any single image, the main visual elements (subject vs. background, person vs. prop, paired objects, symbol vs. surrounding) must use colors drawn from STYLE_BIBLE.color_palette that visibly DIFFER in hue family AND/OR value, so that each element is immediately legible against its neighbor. The palette itself is unchanged — this rule governs which combinations within the palette to choose.
```

### sub_rules_by_situation

#### person_prop_contrast

```
A prop held in a person's hand or worn against the body MUST use a palette color whose hue family AND/OR value differs from the outfit's dominant color. Concretely (palette tokens): outfit = muted warm blue → prop = warm amber gold OR cool slate gray; outfit = cream/beige/white (e.g., white doctor's coat) → prop = cool slate gray OR muted warm blue; outfit = cool slate gray → prop = warm amber gold OR muted warm blue. NEVER default to warm amber gold for every prop — alternate between accent and main_color depending on outfit so that 12 role cards within a single lesson do not converge on the same prop color. Applied via compose_role_subject in scripts/build_prompts.py.
```

#### pair_contrast_two_objects

```
When two objects are shown in PAIR_CONTRAST layout (e.g., 大きい vs 小さい, 新しい vs 古い, 高い vs 安い), they MUST use two DIFFERENT palette tokens to read as visually separate items (e.g., left = muted warm blue object, right = warm amber gold object; OR left = cool slate gray, right = warm amber gold). Using the same color in both panels collapses the contrast that PAIR_CONTRAST is supposed to convey. Apply when scripts/build_prompts.py implements vocab_type=adjective.
```

#### single_object_vs_background

```
A single object placed on the cream off-white background MUST use a palette token (main_color = muted warm blue, accent = warm amber gold, or sub_color = cool slate gray) that contrasts with the cream background. Pure cream-on-cream or near-white objects (e.g., a white envelope) MUST have a clearly visible outline color (deep slate navy per STYLE_BIBLE.outline) AND a secondary accent element (e.g., a warm amber gold stamp on a cream envelope) to maintain legibility. Apply when scripts/build_prompts.py implements vocab_type=concrete_object.
```

#### symbol_vs_surrounding

```
Educational symbols (VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS.color_adjustment) are chosen by MEANING per educational_symbol_colors (symbol_red = question/negative, symbol_green = checkmark, etc.) — this is orthogonal to contrast. When a symbolic color is placed, the surrounding elements must use palette tokens that visually separate the symbol from its frame (e.g., a symbol_red question mark on a cream background with a cool slate gray subject is fine; the same symbol_red on a warm amber gold subject would blur).
```

#### two_persons_in_same_frame

```
Reserved for future templates that show two persons in the same frame (e.g., G demonstrative_kosoado with speaker + listener). Two persons MUST be outfitted in different palette tokens to remain visually distinguishable.
```

### rule_derivation_note

```
Specific rule statements injected into prompts (e.g., the PROP CONTRAST RULE in compose_role_subject) are derived FROM this principle, not duplicated independently. When updating the prop contrast wording, update both this principle AND the derived rule string. Future vocab_type implementations should also derive their contrast rules from here rather than inventing new color logic.
```

### scope

```
This rule is universally applied across all vocab_types and all templates. It does NOT replace educational_symbol_colors (which governs symbolic meaning) — the two systems operate on different axes (meaning vs. visibility) and are jointly enforced.
```

---

## focal_length_standards

v2.3 改訂 / v2.4 再改訂。

資料 11 より：カノニカル・パースペクティブ（斜め上 30-45 度）が最短の反応時間と最高の認識精度を記録する。v2.2 の "orthographic projection acceptable" は正面固定の印象を与えるため削除し、canonical 3/4 に変更。

v2.4 修正：「斜め上 30-45 度」は物体には適切だが、人物の Full-body shot に適用すると身体プロポーションが歪む（俯瞰で頭部が大きく、足が小さくなる）。**人物用と物体用でカノニカル視点を分けて定義する**。

### vocabulary_card_focal_length

```
Lens depends on subject type (NEVER a tight 85mm portrait/tele lens for full-body person cards). DEFAULT VIEW depends on subject type:
(1) FOR OBJECTS (concrete_object, adjective, abstract_concept): Canonical 3/4 perspective — camera positioned 30-45 degrees ABOVE and slightly to the side of the subject. This angle reveals both the front face and the top surface of the object simultaneously, maximizing recognition speed.
(2) FOR PERSONS (vocabulary_person): Horizontal 3/4 view at EYE LEVEL — camera positioned at the subject's eye height and rotated approximately 30-45 degrees to one side (diagonal front view, NOT overhead). This preserves natural body proportions while showing both the face and a partial side view of the body. Overhead angles distort full-body figures and should NOT be used for person vocabulary cards.
Frame the person with a standard ~50mm-equivalent lens at full standing distance: the WHOLE figure from the top of the head to the soles of BOTH feet is inside the frame, spanning about 80% of the image HEIGHT (measured by height, NOT by area), centered with empty side margins; do NOT crop at the waist, hips, thighs, or knees and do NOT zoom in to fill the frame.
Exception (objects only): use straight front-facing (0°) ONLY when the front face alone is the definitive identifier (e.g. a clock face, a screen, a signage board).
```

### example_image_focal_length

```
50mm standard lens equivalent, natural perspective close to human field of view
```

### building_image_focal_length

v4.0.4 採用 4 件（学校 / 大学 / デパート / 会社）：

```
50mm-equivalent lens at street-level low-angle 3/4 view, positioned at adult eye-height (~1.6m above ground), rotated 30-45 degrees off the building's primary facade, close to the building and looking slightly UP. Close-up framing — building does NOT fit entirely within frame; side wings off-frame OK; mid-rise upper floors off-frame OK.
```

v3.0 legacy（未移行 4 件 = 銀行 / 病院 / 駅 / スーパー）：

```
35mm wide-angle lens equivalent, slight three-quarter front angle at eye level
```

### occupancy_percentages

| vocab_type | 占有率 |
|---|---|
| `vocabulary_card` | OBJECTS / compact subjects: occupy **70-80% of the frame by AREA**. PERSONS: the full standing figure (head to soles of both feet) spans **about 80% of the image HEIGHT measured by height NOT area**, centered with empty side margins; never crop the figure to fill area |
| `example_image` | Characters occupy **60% of the frame** |
| `building_image` (v4.0.4 採用 4 件) | Building DOMINATES frame **75-85% vertically**, edge-to-edge horizontally; side wings off-frame; mid-rise upper floors off-frame OK; top of primary signature reaches upper 8-12% of canvas; figures prominent at ~1/3 of visible building height. Default cream off-white canvas background (universal). |
| `building_image` (v3.0 legacy 未移行 4 件) | Building occupies about **70% of the frame**, centered, against a full-bleed pale sky-blue background. (v3.0：旧『top third を typography 用余白に』指示は削除。帯文字は GAS 側オーバーレイの責務で、画像内に空サイン枠を描かせない＝問題 C 対策) |
| `spatial_relation` | Reference object (基準物) occupies **40-50% of the frame**; target object clearly visible in relation |
| `action_verb` | Action occupies **70% of the frame**; motion direction clearly readable |
| `variant_grid` | Each variant tile occupies **equal space** in a 2×2 or 1×N grid layout |
| `adjective` | Object(s) occupy **70-80% of the frame**. For PAIR_CONTRAST: each panel occupies 50% with equal-sized subjects. (v2.4) |

### note

資料 11：カノニカル視点の認知的根拠 — 斜め上 30-45 度から物体を見ると上面と側面の両方が見え、三次元構造・重要なパーツ（取っ手・ボタン・折り目等）を一瞬で把握できる。真正面や真上からの視点より識別速度・正確性が統計的に高い。

### lens_by_vocab_type

> v3.4 (M-39 / M-41) で導入された参照用 lens 一覧。

| vocab_type | lens |
|---|---|
| `person` | `~50mm equivalent (full standing)` |
| `concrete_object` | `~50mm canonical 3/4 (30-45 deg above)` |
| `abstract_concept` | `~50mm centered, eye level or slight elevation` |
| `adjective` | `~50mm canonical 3/4 (no telephoto compression)` |
| `action_verb` | `~50mm eye-level` |
| `spatial_relation` | `~50mm eye-level side view (or first-person POV for 前/後ろ)` |
| `demonstrative` | `~50mm eye-level` |
| `building` (v4.0.4 採用 4 件) | `~50mm street-level low-angle 3/4 at adult eye-height (~1.6m), 30-45° off facade, close-up framing (building extends off-frame at sides / mid-rise upper floors off-frame at top)` |
| `building` (v3.0 legacy 未移行 4 件) | `35mm wide-angle, slight three-quarter front at eye level` |
| `variant_grid` | `~50mm uniform across all tiles` |

---

## iconization_level_guide

> v2.3 新規。資料 11 より：4 段階のアイコン化レベルと語彙タイプ別の推奨を定義。
> 「スイートスポット」は **Detailed Flat**（具象的フラット）。

### level_1_abstract_icon

| 項目 | 内容 |
|---|---|
| description | 単純な幾何学的形状のみ。細部なし。 |
| when_to_use | UI ナビゲーション・熟練者向け概念アイコン |
| vocab_types | **NOT recommended for vocabulary cards** |

### level_2_flat_design

| 項目 | 内容 |
|---|---|
| description | 最小限の装飾・明確な色面・細部は簡略化。 |
| when_to_use | 人物の汎用シーン・家族・役割描写 |
| vocab_types | `person`, `building`, `spatial_relation`, `demonstrative` |

### level_3_detailed_flat ⭐ RECOMMENDED

| 項目 | 内容 |
|---|---|
| description | ステッチ・光沢線・素材記号など識別シグネチャーを含む。グラデーションは使わないが、記号的なテクスチャヒントは許容。 |
| when_to_use | **RECOMMENDED FOR MOST VOCABULARY CARDS** — 具体物・日常物体 |
| vocab_types | `concrete_object`, `abstract_concept`, `action_verb`（default; SEQUENCE_3PANEL strategy uses `level_2`）, `adjective` |

### level_4_realistic

| 項目 | 内容 |
|---|---|
| description | 精密なテクスチャ・照明効果。 |
| when_to_use | **本プロジェクトでは使用しない**（フラットベクター原則に反する） |
| vocab_types | — |

### note

資料 11：認知負荷が最も低く識別精度が高い「スイートスポット」は `level_3_detailed_flat`。完全なフラット（`level_2`）は具体物では質感の欠如により類似物体の混同リスクがあるが、`person` / `building` / `spatial_relation` / `demonstrative` では構図がアイデンティティを決定するため `level_2` で十分（v3.4 M-27/M-40：用途別に肯定的位置づけ）。

---

## vocabulary_card_style

語彙カード（1:1）専用スタイル。v2.4：人物は水平 3/4 ビュー（眼の高さ）、物体はカノニカル 3/4 ビュー（斜め上）。

```
Solid soft cream off-white background (warm off-white, NOT pure stark white). Single centered subject only (Exception: variant_grid テンプレ E は multi-tile composition を許可). Full-body shot with HORIZONTAL 3/4 view at eye level for characters; canonical 3/4 view (slight overhead) for objects and adjective subjects. No background elements, no secondary objects. Objects fill 70-80% of the frame by area; a full-body person is shown head to soles of both feet, spanning about 80% of the image HEIGHT (not area), centered with empty side margins — do NOT crop the figure to fill the frame.
```

---

## example_image_style

例文画像（16:9）専用スタイル。

```
Clean minimal background with only essential context. Characters take up the majority of the frame. Eye-level front or slight three-quarter view. Straight vertical lines for buildings. Flat warm tonal balance, no lighting effects, no shadows.
```

---

## constraints

全画像共通の制約（最後に必ず追加）。

v2.4 改訂：「no symbols」が教育的矢印・領域線・モーションラインまで排除する可能性を回避。各テンプレートの CONSTRAINTS ブロックに従う旨を明記。

v3.0 改訂：
- (a) v2.9.1 由来のテキスト絶対禁止の強い表現を採用（タイトル行・ラベル・キャプション・テキストオーバーレイを位置を問わず明示禁止。`word_先生` で上部に「教師」ラベルが出た弱表現バグを構造的に防止）。
- (b) ただし建物サイネージ例外（Template B の英語ラベル 1 個）を教育的ピクトグラフ例外と同じ構造で明示的に切り出し、グローバル制約と Template B の矛盾シグナルを解消。

```
No text, no letters, no numbers, no purely decorative symbols anywhere — including titles, labels, captions, watermarks, or any text overlay at any position in the rendered output. Exception 1 (EDUCATIONAL pictographic elements) — directional arrows, territory boundary lines, motion lines, panel dividers, and symbolic metaphor anchors (hearts, sparkles, teardrops, question marks, lightbulbs, stars, etc. as defined in ABSTRACT_METAPHORS / VISUAL_SYMBOLS) — are governed by each individual template's CONSTRAINTS block, NOT by this global rule. They are PERMITTED in templates C (example_sentence), F (spatial_relation), G (demonstrative_kosoado), H (action_verb), I (abstract_concept), and J (vocabulary_adjective) when explicitly described in the template. Exception 2 (BUILDING SIGNAGE) — Template B (vocabulary_building) ONLY permits exactly ONE short ENGLISH building-name label as described in that template's CONSTRAINTS block. No other text is ever allowed, not even a second English word. For all other templates, the default 'absolutely no text or symbols' rule applies.
```

---

## brand_declaration

プロンプト末尾に付ける「ブランド宣言文」（資料 6 より）。

```
Keep line weights consistent. Generate as if this is part of a unified educational brand style guide.
```
