# PART 1: Universal Rules

> 対象：全 vocab_type 共通の不変原則。skill / build_prompts.py / 人間レビューすべてが従う。
> Migrated from `prompts/master_prompt_design_guide_v4_0.py` (hash `891b73f5ae2d`) — header (lines 1-70) + 使い方 (820-875) + PART 1.1-1.10 (1172-2203).
> See also: [PART 2](part2_style_bible.md), [PART 3](part3_vocab_type_rules.md), [PART 5](part5_vocab_reference_appendix.md), [PART 6](part6_output_instructions.md).

---

## Overview

『日本語教材イラスト生成 マスタープロンプト設計書』v4.0（2026-05-22 major-version pivot）。

### v4.0 pivot 経緯

v3.12 まで「アジア 4 か国（日中韓越）は伝統 silhouette + textile pattern」「西洋 3 か国（米伯西）は modern garment + regional craft accent」という構造的アシンメトリで設計されていた。これは以下の問題を抱えていた：

- **(P1)** 暗黙の二分（アジア = 伝統服 / その他 = 現代服）が exoticization リスクを孕む
- **(P2)** modern reality（実際の現地人は日常的に伝統服を着ない）と乖離
- **(P3)** 教科書 nationality 挿絵の慣用（『みんなの日本語』『げんき』等は全員 modern wear + 国旗 / 名札で nationality を伝える）と異なる

worktree image-prompt-plan セッション（2026-05-22）で v3.13-#1 GARMENT_REGISTER_CONSISTENCY_RULE 着手前にこの asymmetry が論点化。逆方向の simplification = **全国共通 modern wear + 国旗視認性強化** への pivot を確定。

### v4.0 設計核心

1. **全国共通 "modern daily casual wear" に統一**。silhouette / fit / accessory tendency で国別 subtle 弁別、palette は country-today の modern fashion tendency に基づく（exoticization 回避・伝統服 cliché 回避）。
2. **伝統 silhouette は universal `NO_TRADITIONAL_SILHOUETTE_RULE` で明示禁止**（[PART 1.1](#part-11-nationality_noun_policy) hard_constraints）。hanbok / qipao / áo dài / yukata / wagara-cut kimono / cheongsam / jeogori / noragi / 祭礼衣装 すべて禁止。modernized form も禁止。
3. **国旗は両手で胸前で持つ hand-held flag pose** に切替（~12-15% of frame, flag face squarely toward viewer）。v3.12 の「衣服上の小さな pin/patch 5-6%」は退役。east_asian phenotype を共有する日中韓 3 か国の弁別が、衣服 silhouette + flag pose の組合せで明確になる設計。
4. **PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE は退役**（伝統 silhouette が消えたため原理的に不要）。
5. **PART 1.7 FLAG_PLACEMENT_RULE は簡素化**（全員固定 pose・deterministic-pick 不要）。
6. **PART 1.5 PHENOTYPE_SPECIFICATION_RULE は v4.0 でも維持**。palette_freeze は継続（PHENOTYPE_PROFILES / ROLE_PHENOTYPE_PALETTE / PHENOTYPE_SALT を変更しない）。
7. **NATIONAL_SYMBOL_ISOLATION_RULE は v4.0 でも core 規律として維持**。flag 記述のみ「pin/patch 5-6%, on chest or bag strap」→「hand-held flag 12-15%, held in both hands in front of the chest」に書き換え。衣服へのフラッグプリント禁止 (a)/(c)/(d) はむしろ v4.0 で強化される。
8. **`PERSON_NATIONALITY_HINTS` は全 7 国を B-rich 形式に書き直し**（silhouette / fit / accessory tendency + 国別 muted palette tendency）。実装は [PART 5](part5_vocab_reference_appendix.md#52-person_nationality_hints)。

### Rollback 手順（v4.0 で重大問題発生時）

1. `scripts/build_prompts.py` の `GUIDE_PATH` を `'prompts/master_prompt_design_guide_v3_12.py'` に戻す
2. `scripts/invariants.mjs` の `promptGuide` / `promptGuideExpectedHashPrefix` を v3.12 の値 (`2137a8e885ae`) に戻す
3. `scripts/invariants.mjs` の `sColumnPattern` を `/^image_prompts_lesson\d{2}_v3_\d+(_\d+)?\.json$/` に戻す
4. 再生成・validate → v3.12 完全復帰。本 v4.0 ファイルは保持（将来 v4.0 設計の参照 / 比較が必要な場合に再利用）。

---

## 使い方

全課共通のプロンプト設計ルールを定義したマスタードキュメント。新しい課の `image_prompts_lesson_X.json` を作成する際は必ずこのガイド（PART 1〜6）を参照する。

### v3.0 の最重要変更点（必読）

1. **建物の看板は「英語短語ラベル 1 個」のみ許可**。日本語（漢字・かな）のサイネージは画像生成器が描画できず確定的に文字化けするため全廃。`BUILDING_CUES.signage_text` は英語（"BANK" 等）に確定済み（[PART 5.10](part5_vocab_reference_appendix.md#510-building_cues)）。
2. **国籍名詞語彙**（アメリカ人・韓国人 等）は [`NATIONALITY_NOUN_POLICY`](#part-11-nationality_noun_policy)（PART 1.1）に従う。人物が主役・国旗は v4.0 で hand-held flag 12-15% に変更（v3.12 の "10-12% pin" 旧記述は禁止）。
3. **色は「色名のみ」**。`#HEX` や hex value は一切書かない（問題 F 解決・[PART 2 color_palette](part2_style_bible.md#color_palette)）。
4. **建物テンプレは単一シーンキュー＋反クラッター**。「上 1/3 typography 用余白」は書かない（[PART 3.2 building](part3_vocab_type_rules.md#32-building)）。

### vocab_type → テンプレート対応表

| vocab_type | テンプレート（[PART 4](part4_prompt_templates.md)）| 補足 |
|---|---|---|
| `person` | A `vocabulary_person` | — |
| `building` | B `vocabulary_building` | — |
| `concrete_object` | D `vocabulary_object_concrete` | 類似形状が多い場合は E (variant_grid) も検討。スケール固定が重要な場合は HAND_HOLDING 戦略 (v2.4) |
| `spatial_relation` | F `spatial_relation` | — |
| `demonstrative` | G `demonstrative_kosoado` | 必ず 3 モデルのうち 1 つだけを選んで展開 (v2.4) |
| `action_verb` | H `action_verb` | 3 フェーズ動詞には SEQUENCE_3PANEL 戦略 (v2.4) |
| `abstract_concept` | I `abstract_concept` | — |
| `adjective` | J `vocabulary_adjective` | v2.4 新規 |
| `example_sentence` | C `example_sentence` | 常に C |

### 資料出典

- 資料 5：キャラクター一貫性
- 資料 6：フラットベクタースタイル一貫性
- 資料 7：語学教材イラストのデザイン原則
- 資料 8：建物画像生成
- 資料 9：Gemini 安定化テクニック
- 資料 10：語彙カテゴリー別視覚化戦略 (v2.3 新規)
- 資料 11：物体語彙の識別性向上 (v2.3 新規)
- 資料 12：空間語彙・指示語の視覚的提示 (v2.3 新規)

---

## PART 1.1 NATIONALITY_NOUN_POLICY

> 国籍名詞語彙の視覚化標準。
> v3.0 新規（問題 E の恒久解決 / 問題 A の根本原因対策）。
> v4.0 (2026-05-22) major-version pivot：全国共通 modern daily casual wear + 国旗両手持ち（hand-held flag）に再設計。

### Scope

- `vocab_type == "person"` かつ語が **国籍名詞**（日本人 / 中国人 / アメリカ人 / 韓国人 / ブラジル人 / ベトナム人 / スペイン人 等）。
- 固定 5 名（鈴木さん等・[`NAMED_CHARACTER_PROFILES`](part5_vocab_reference_appendix.md#59-named_character_profiles)）には適用しない。固定キャラは各自の nationality_visual_hints に従う。
- 「外国人」(generic role) は本ポリシーの対象外。flag を持たず、[`ROLE_BASED_GENERIC_PROFILES["foreigner"]`](part5_vocab_reference_appendix.md#58-role_based_generic_profiles) で生成する。

使用テンプレート：[Template A `vocabulary_person`](part4_prompt_templates.md#template-a-vocabulary_person)。

### Principle

```
The PERSON is the subject. A specific adult in MODERN daily casual wear typical of the country today is shown full-body, from the top of the head to the soles of both feet, spanning about 80% of the image HEIGHT (by height, NOT area), centered with empty side margins. Nationality is conveyed by the combination of (a) phenotype typical of the country (per PART 1.5 PHENOTYPE_SPECIFICATION_RULE), (b) subtle modern-fashion tendency (silhouette / fit / palette of the country's contemporary daily wear), and (c) a hand-held flag held in both hands in front of the chest. Pedagogical goal: a learner glancing at 7 nationality cards in a single lesson must distinguish each at a glance — this requires per-country modern-fashion-tendency variation + clear flag visibility. NO traditional, ceremonial, or folkloric silhouettes are permitted, even in modernized form (see NO_TRADITIONAL_SILHOUETTE_RULE in hard_constraints).
```

### flag_hand_held_rule

v4.0.2 第二次検証：「2 本の旗竿が描かれる」「左右の手の高さが揃わない」事象が中国カード等で確認されたため、「単一 flag staff」「両手対称・同じ高さ」の明示句を追加。

```
Render the flag as a small rectangular hand-held flag — a single fabric panel attached to ONE flag staff (the staff is a single thin vertical stick/pole), held in both hands in front of the chest. EXACTLY ONE flag staff per card — never depict two separate poles, two flags, or one hand on a flag while the other hand rests elsewhere; both hands MUST grip the SAME single flag staff. Both hands are at the SAME height on the staff (typical grip: one hand near the bottom of the staff, the other hand slightly above it on the same staff, OR both hands at roughly the same vertical position holding the staff symmetrically). Both elbows are bent at SIMILAR angles — the pose is left-right symmetric, not lopsided. The flag occupies about 12-15% of the image area — clearly readable but smaller than the subject's torso. The flag face is squarely toward the viewer (parallel to the picture plane). The flag is held at about chest-to-upper-waist height. The subject remains the clear main subject; the flag is a clear nationality cue, NOT the primary subject and NOT a dominant element of the composition. Flag size guidance: 12-15% (readable at a glance) is the target; below 8% (too small to read) and above 25% (dominates the composition) are both prohibited.
```

### hard_constraints

- **DO NOT** make the flag 'PRIMARY', the 'sole identifier', or fill 25% or more of the frame. The flag is a clear nationality cue but the PERSON remains the subject.
- **DO NOT** print the flag across the whole shirt/clothing or any garment / accessory (see `NATIONAL_SYMBOL_ISOLATION_RULE` below).
- **DO NOT** render any text, letters, or numbers — not even on the flag.

#### NO_TRADITIONAL_SILHOUETTE_RULE (v4.0 新規・普遍ルール)

```
Nationality cards MUST depict modern daily casual wear. Traditional, ceremonial, or folkloric silhouettes — including but NOT limited to: hanbok / jeogori (Korean traditional), qipao / cheongsam / Tang jacket (Chinese traditional), áo dài / áo bà ba (Vietnamese traditional), yukata / kimono / noragi / wagara-cut top (Japanese traditional), sari / shalwar / kurta / thawb / dashiki / kente / huipil / any other country's traditional or festival dress — are NEVER permitted, even in modernized form, even in 'everyday' or 'modern-take' framing. The pedagogical principle: nationality is conveyed by phenotype + flag + subtle modern-fashion tendency, NOT by traditional dress display. This rule supersedes any per-country cultural_styling_hint phrasing that might be interpreted as suggesting a traditional silhouette.
```

- **DO NOT** use caricatured features (exaggerated facial features, stereotyped body proportions, ethnic-feature exaggeration).
- **DO NOT** use tourist-cliché props or backgrounds (panda, sombrero, sushi, tequila bottle, geisha-makeup, Fuji-san, cherry blossom festival, Olympics ceremony, etc.) as the nationality cue.

#### NATIONAL_SYMBOL_ISOLATION_RULE (v3.9 / v4.0 修正・普遍ルール)

```
The single hand-held flag held in both hands in front of the chest (12-15% of frame, per flag_hand_held_rule) is the ONLY permitted national-symbol occurrence in the image. The following are universally PROHIBITED across all current and future countries:

(a) National-flag motifs, prints, or graphics on any garment, bag, or accessory (no flag t-shirts, no flag bandanas, no flag-print bags, no flag-pattern scarves, no flag-color shoelaces).

(b) National-team / sports-federation / Olympic-team logos, crests, emblems, or jersey designs on any garment or accessory.

(c) Garment color combinations that directly replicate the national flag's color sequence in flag-like proportions (e.g., a red top + yellow trousers for a red-yellow flag country, a green top + yellow accessory for a green-yellow flag country — the hand-held flag already carries this signal and duplication produces flag-like imagery on the body).

(d) Garments described as 'graphic', 'printed', 'logo', 'patterned' or with unspecified print contents. Always EITHER specify a plain solid color OR name a non-national, non-team pattern explicitly (e.g., subtle stripes, dots, abstract shapes, botanical print in muted modern colors). v4.0 strengthens (d): since the hand-held flag now carries the clear nationality signal, garments SHOULD default to plain solid color or muted modern check / botanical / geometric prints — never traditional textile motifs (wagara / asanoha / seigaiha / phoenix / dragon / etc., which were permitted as cultural cues in v3.12 are now redirected by NO_TRADITIONAL_SILHOUETTE_RULE).
```

### subject_block_pattern

```
A specific adult person. {APPARENT_FEATURES_HINT} {CULTURAL_STYLING_HINT} Neutral and welcoming expression. The subject is holding a small rectangular {FLAG_SHAPE_AND_COLORS} hand-held flag attached to a SINGLE flag staff (one thin vertical pole only — NEVER two separate poles), {FLAG_PLACEMENT}, flag face squarely toward the viewer. Both hands grip the SAME single staff at similar heights with elbows bent at SIMILAR symmetric angles — never one hand high and the other low. The flag occupies about 12-15% of the image area as a clear nationality cue. The person remains the clear main subject; the flag is a clear identifier but NOT the primary subject. The subject's body MAY face the viewer slightly more head-on (about 15-30 degrees off frontal, instead of the standard 30-45 degree 3/4 view) to accommodate the chest-front flag pose, while still preserving natural body proportions and standing posture.
```

v3.4 (M-36)：身体高さ規律はテンプレ A SCENE&ACTION に集約済。本 `subject_block_pattern` では人物のアイデンティティ記述のみを行い、サイズ・フレーミング規律は重複させない。

### flag_shape_and_colors_hint

```
{FLAG_SHAPE_AND_COLORS} = a short shape/color description of the flag WITHOUT any text. e.g. アメリカ: 'red and white horizontal stripes with a small blue corner of white star shapes'; 韓国: 'white field with a red-and-blue circle and black trigram marks'; ブラジル: 'green field with a yellow diamond and a blue circle'. Describe shapes/colors only — never spell country names or render letters.
```

詳細は [PART 1.9 FLAG_SHAPE_DETAIL_RULE](#part-19-flag_shape_detail_rule) と [PART 5.2 PERSON_NATIONALITY_HINTS](part5_vocab_reference_appendix.md#52-person_nationality_hints) を参照。

### cultural_styling_hint_definition

```
{CULTURAL_STYLING_HINT} = a description of modern daily casual wear typical of the country today, expressed in concrete contemporary garment-type terms (silhouette, fit, layering, footwear, optional non-hand accessory). All 7 countries use modern wear only — traditional / modernized-traditional / ceremonial silhouettes are NEVER permitted (per NO_TRADITIONAL_SILHOUETTE_RULE in hard_constraints). Per-country variation is achieved by subtle differences in (i) silhouette / fit (e.g., minimalist contemporary vs. clean tailored vs. relaxed casual), (ii) palette tendency (country-today's modern-fashion muted color preference — NEVER flag-color combinations), (iii) footwear choice (sneakers / loafers / espadrille-style flats / etc.), and (iv) optional non-hand accessory (shoulder-strap bag / scarf / cap / wristwatch — but NEVER held in hand, since the hand-held flag occupies both hands). Caricature / folkloric national-costume display / tourist cliché remain prohibited (see hard_constraints).
```

### apparent_features_hint_definition

```
{APPARENT_FEATURES_HINT} = a SINGLE concrete description of the person's phenotype (skin tone, hair color, hair texture) typical and culturally appropriate for the country today, written per PHENOTYPE_SPECIFICATION_RULE (PART 1.5): one concrete value per dimension (rule_a), with optional adjacent 2-step ranges (rule_b). v3.8〜v3.11.1 で使われていた enumerate 形式 ('Pick ONE from: A / B / C') は PART 1.5 rule_a により v3.12 で禁止（v4.0 でも維持）。Diversity is achieved across cards via deterministic per-word selection in scripts/build_prompts.py phenotype_for(word), NOT within a single card's prompt. Nationality nouns route via COUNTRY_TO_PROFILE → PHENOTYPE_PROFILES (rule_c); the 'americas_diverse' profile falls back to ROLE_PHENOTYPE_PALETTE hash selection (rule_d).
```

---

## PART 1.2 ISOLATION_SAFE_PROPS_RULE

> 孤立人物カードの小道具規律（v3.7 新規）。
> Template A `vocabulary_person` は SCENE で "Solid soft cream off-white background. No other characters or objects in the frame" を強制するため、人物が手に持つ小道具は「単体で意味が通る」もののみに限定する。コンテキスト依存の小道具（pointer, otoscope, microphone, camera 等）は、本来必要なシーン要素が描けないため空中で意味不明な所作になる。

### Principle

```
When the prompt template forbids non-subject objects in the frame, every prop named in the character's outfit description must be self-contained — i.e., must read naturally when held alone, without any external scene element to interact with.
```

### isolation_safe_examples

- book / textbook / notebook (held against the body or open in hand)
- marker / pen / pencil (held alone is a writing/teaching cue)
- stethoscope (around the neck — does not need a patient)
- name badge / clipboard (worn or held)
- briefcase / laptop bag / backpack (held by handle / strap)
- documents / folder / single sheet of paper
- wristwatch / glasses / small jewelry

### isolation_unsafe_examples

> 該当 props は outfit_hints から削除する判定基準。

| Unsafe prop | 必要なシーン要素（不在のため不可） |
|---|---|
| `pointer / pointing stick` | whiteboard / blackboard / screen |
| `otoscope / stethoscope_in_use` | ear / patient |
| `microphone` | stage / audience |
| `camera (in act of taking)` | subject |
| `phone (in act of calling)` | the other party context（held alone は ok） |
| `umbrella (open, in rain)` | rain（closed/folded umbrella は ok） |

### enforcement

`ROLE_BASED_GENERIC_PROFILES` / `NAMED_CHARACTER_PROFILES` / `CHARACTER_PROFILES` のエントリに `isolation_unsafe_props_excluded` フィールドを持たせ、`outfit_hints` / `fixed_features` 本文から該当 props を除外したことを記録する。`build_prompts.py` は本フィールドを参照しない（除外は既に本文から削除済みである前提）。

---

## PART 1.3 ROLE_VISUAL_IDENTITY_RULE

> 役割視覚アイデンティティの普遍規律（v3.10 新規）。
> v3.9 実機検証で teacher / foreigner の visual identity が doctor / company_employee / student に比べて弱く、ロール即読み取り不能であることが露呈。

### Principle

```
Each role in ROLE_BASED_GENERIC_PROFILES must be identifiable as that role at a single glance, from the outfit and props alone, without scene context (since SCENE forbids non-subject objects). This requires every role to have at least one of the following visual signature types, and preferably both:

(a) a garment-level signature that is essentially unique to the role (white doctor's coat, business suit, school uniform),

OR (b) a mandatory prop signature drawn from ISOLATION_SAFE_PROPS_RULE (stethoscope around the neck, briefcase, backpack, lanyard name badge, visibly thick textbook).

Roles whose garments alone are generic smart-casual (teacher, foreigner, future additions) MUST compensate with a mandatory prop signature.
```

### must_carry_language_rule

```
Within ROLE_BASED_GENERIC_PROFILES.outfit_hints, the phrase 'may carry' is FORBIDDEN — Imagen interprets 'may' as optional and frequently omits the prop, removing the visual signature. Use 'MUST visibly carry' or 'MUST visibly wear' so the prop becomes a required element. Optional accessories (e.g., a wristwatch on a suit-wearing role) MAY still be written with permissive language, but the role's SIGNATURE prop (the one carrying visual identity) must be mandatory.
```

v3.11：`must_carry_language_rule` は [PART 1.4 PROMPT_LITERALIZATION_AVOIDANCE_RULE](#part-14-prompt_literalization_avoidance_rule) に普遍化された（role 限定ではなく全プロンプト記述に適用）。

### signature_uniqueness_rule

```
Different roles should not share their mandatory signature. If two roles converge on the same signature (e.g., both teacher and foreigner as 'generic smart-casual + textbook'), one must be differentiated by an additional signature element (e.g., teacher's lanyard name badge vs foreigner's phrasebook + day bag, or doctor's stethoscope vs nurse's scrubs + clipboard). The pedagogical test: showing a learner all current role cards in lesson_NN, each role must be unambiguously distinguishable.
```

### signature_examples_by_role_type

| role | garment | mandatory prop |
|---|---|---|
| `doctor` | 白衣 (open white coat) | stethoscope around neck + clipboard or name badge |
| `company_employee` | navy/charcoal business suit + necktie | briefcase or laptop bag |
| `student` | casual smart | backpack worn + visible textbook or notebook in hand |
| `teacher` | blouse + cardigan or jacket | lanyard name badge (no text, small icon) + thick textbook with visible spine held in hand or under arm |
| `foreigner` | casual or smart casual | language phrasebook with cover facing viewer + small day bag or shoulder strap |

**Future examples**（参考）：

| role | garment | mandatory prop |
|---|---|---|
| `police_officer` | uniform (peaked cap, badge silhouette, dark uniform shirt) — garment alone is signature | — |
| `restaurant_staff` | apron over plain shirt | order pad or small tray held in hand |
| `delivery_driver` | vest or jacket with reflective strip silhouette | parcel held in arms |
| `chef` | white chef coat with double-breasted button row + white toque hat — garment alone is signature | — |

### enforcement

`ROLE_BASED_GENERIC_PROFILES` の `outfit_hints` は本ルール準拠で書く：
1. 各 role の `outfit_hints` の最初の要素は garment signature を記述
2. 最後の要素は mandatory prop signature を `MUST visibly carry/wear ...` 形式で記述
3. 中間に補助要素（色・任意アクセサリ）を置く

`compose_role_subject` は `outfit_hints` をそのまま Outfit and props 行に展開するため、本ルール準拠の文言がそのまま Imagen に渡る。

---

## PART 1.4 PROMPT_LITERALIZATION_AVOIDANCE_RULE

> プロンプト literalize 回避規律（v3.11 新規）。
> v3.10 実機検証で teacher.outfit_hints に書いた "a small generic icon such as a book or pencil silhouette"（汎用 ID badge を意図した記述）を Imagen が「draw a book or pencil silhouette」と literalize し、首から鉛筆マーク付きペンダントが下がる絵を出した。

### Principle

```
Imagen treats every concrete noun, color, shape, or pattern in the prompt as a draw instruction. Words intended as 'examples' or 'placeholders' (such as / e.g. / for example / including) are NOT interpreted as illustrative — they become literal draw targets. Similarly, modal verbs (may / might / optional / possibly) signal to Imagen that the element is omittable, and it is often omitted. Author every line of every prompt with this literalization in mind: say exactly what you want drawn, and nothing more.
```

### rule_a — no examples for placeholders

```
When the intent is a BLANK or PLACEHOLDER element (e.g., a generic ID badge with no specific design, a plain envelope, an abstract background shape), NEVER write 'such as X or Y' or 'e.g., A, B, or C' to suggest possible content — Imagen will draw X, Y, A, B, or C literally. Instead write 'blank', 'plain', 'no marking', 'no icon', 'no decoration', 'no graphic', or 'unspecified content with no drawn elements' to force the absence.

BAD:  'a small icon such as a book or pencil silhouette' → Imagen draws a pencil.
GOOD: 'a plain blank rectangle with NO icon, NO text, NO graphic' → Imagen draws an empty rectangle.
```

### rule_b — examples only when literal

```
When 'such as / e.g.' IS the intended use (i.e., providing concrete draw choices that Imagen should literally pick from), this is ACCEPTABLE — but make the 'pick ONE' nature explicit.

OK: 'Pick ONE wagara pattern: asanoha (hemp-leaf), seigaiha (wave), or shippō (overlapping circles)' — Imagen picks one of the three and draws it.
OK: 'a botanical print such as palm leaves, monstera, or hibiscus in earthy tones' — any of these are acceptable to draw.

The distinguishing test: do you want Imagen to literally draw the example? If yes → fine. If no → use rule_a.
```

### rule_c — must or never, not may

```
Modal verbs 'may / might / optional / possibly' are NOT useful in Imagen prompts — they signal omittability and are often acted on. Universally rewrite:

(1) Elements that should appear → 'MUST visibly carry/wear/include'
(2) Elements that should NOT appear → 'MUST NEVER include' / 'absolutely no' / 'is PROHIBITED'
(3) Genuine optional accessories (where presence/absence both ok) → use 'MAY be present' (uppercase MAY) sparingly, and accept either outcome.

v3.10 ROLE_VISUAL_IDENTITY_RULE.must_carry_language_rule applied this to ROLE_BASED_GENERIC_PROFILES; v3.11 generalizes it.
```

### rule_d — specify, don't describe

```
Vague descriptors ('a small icon', 'some decoration', 'a touch of color', 'a slight accent') leave too much freedom and Imagen compensates with arbitrary content. Always specify:

(a) shape (rectangular / circular / square),
(b) size relative to frame (small ~5% / medium ~10% / large ~20%),
(c) color from STYLE_BIBLE.color_palette tokens,
(d) content (blank / specific named pattern / specific named object).

If genuine freedom is desired in one of these axes, set the others tightly to constrain the outcome.
```

### audit_checklist_for_authors

- Search the file/section for 'such as', 'e.g.', 'for example', 'including', 'like a' — for each match, verify `rule_a` or `rule_b` applies
- Search for 'may', 'might', 'possibly', 'optional', 'sometimes' — rewrite per `rule_c` (preserve genuine optionality with uppercase MAY)
- Search for 'small icon', 'some', 'a touch of', 'a slight', 'a hint of' — rewrite per `rule_d` (specify shape/size/color/content)
- For each BLANK/PLACEHOLDER intent, confirm the prompt says 'blank' / 'no [thing]' explicitly, not 'a generic X'

---

## PART 1.5 PHENOTYPE_SPECIFICATION_RULE

> 人物 phenotype 記述の普遍規律（v3.12 新規）。
> v3.8 以降の `apparent_features_hint` enumerate 形式（"Pick ONE specific set of features from..."）が Imagen を中央値（"ethnically ambiguous medium tone"）に倒す問題への構造的解決。

### Principle

```
A single image generation must receive a single concrete phenotype description, not a multi-option enumeration. Image generators (Imagen, nanobanana) interpret enumerate-style phrasing ('Pick ONE from: A / B / C') as a stability cue and collapse to the central/safest value, producing 'ethnically ambiguous medium tone' faces across all cards. Phenotype diversity is achieved across multiple images via per-card deterministic selection, NOT within a single image's prompt.
```

### rule_a — no enumerate

```
Within phenotype descriptions (skin tone, hair color, hair texture, facial features), the patterns 'Pick ONE from: A / B / C', 'A OR B OR C', 'choose one of A, B, C' are FORBIDDEN. Write exactly one concrete value per phenotype dimension.

BAD:  '(skin tone: fair OR light-medium OR olive OR brown OR deep brown) + (hair color: black OR dark-brown OR brown OR blond OR red)' → Imagen collapses to medium-brown skin + dark-brown hair every time.
GOOD: 'olive skin with straight black hair' → Imagen draws exactly that.
```

### rule_b — adjacent range ok

```
Adjacent 2-step ranges within a phenotype dimension are PERMITTED because the generator interprets them as a narrow band (still producing discrete pixel values, not an enumeration to collapse).

OK: 'fair to light-medium skin' (2 adjacent steps).
OK: 'dark-brown to black hair' (2 adjacent shades).
FORBIDDEN: 'fair to deep brown skin' (5+ steps spanning the whole spectrum — too wide; generator collapses to middle).
FORBIDDEN: 'any natural hair color' (unbounded; generator picks dark).
```

### rule_c — nationality via lookup

```
For nationality-noun person cards (vocab_type=person, word ends with '人'), phenotype is selected by COUNTRY_TO_PROFILE[word] → PHENOTYPE_PROFILES[profile], where each PHENOTYPE_PROFILES entry is exactly one concrete sentence written per rule_b. The mapping and the 7 profile sentences are encoded in scripts/build_prompts.py and may be expanded in future versions (adding a new country = adding one row to COUNTRY_TO_PROFILE; adding a new profile = adding one entry to PHENOTYPE_PROFILES).

Special case: COUNTRY_TO_PROFILE may map a country to 'americas_diverse', which falls back to ROLE_PHENOTYPE_PALETTE-style deterministic selection (per rule_d) because the country's population is too multi-ethnic for a single concrete description to be representative.
```

データは [PART 5.3 PHENOTYPE_PROFILES](part5_vocab_reference_appendix.md#53-phenotype_profiles) / [PART 5.4 COUNTRY_TO_PROFILE](part5_vocab_reference_appendix.md#54-country_to_profile) を参照。

### rule_d — role via hash

```
For role-noun person cards (vocab_type=person, word does NOT end with '人' — e.g. 医者 / 学生 / 先生 / 外国人 / 会社員), and for nationality nouns mapped to 'americas_diverse' (rule_c special case), phenotype is selected from ROLE_PHENOTYPE_PALETTE (6 entries spanning fair → deep brown with varied hair) via deterministic word hash: sha256(word + SALT) mod 6, where SALT is a short string chosen so that the lesson's role+americas word set distributes evenly across the 6 buckets (in v3.12, build_prompts.py uses SALT='palette-pick', selected empirically for lesson_01 to achieve skew=1, the theoretical minimum). The same word always yields the same phenotype across regenerations (reproducibility), but 5-6 role cards within a single lesson visibly differ from each other (per-lesson diversity).

Salt is frozen at v3.12 (changing it shifts hash output and breaks reproducibility — treat as major-version migration per rule_e).
```

データは [PART 5.5 ROLE_PHENOTYPE_PALETTE](part5_vocab_reference_appendix.md#55-role_phenotype_palette) を参照。

### rule_e — palette freeze

```
PHENOTYPE_PROFILES (7 entries) and ROLE_PHENOTYPE_PALETTE (6 entries) are FROZEN at v3.12. Changing either palette modifies the deterministic hash output for the same word and breaks reproducibility of previously-generated images. Palette modifications are treated as a major-version migration (v4.0+) requiring full re-generation and explicit migration notes. Adding a NEW country to COUNTRY_TO_PROFILE (routing to an existing PHENOTYPE_PROFILES entry) is a minor change and does NOT require a major-version bump.
```

v4.0：palette_freeze 継続。major-version migration の機会だったが phenotype 変更の必然性が無いため `PHENOTYPE_PROFILES` / `COUNTRY_TO_PROFILE` / `ROLE_PHENOTYPE_PALETTE` / `PHENOTYPE_SALT` すべて v3.12 から不変。

---

## PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE (RETIRED v4.0)

> v3.12 で導入された「アジア 4 か国の cultural traditional silhouette に 1 つの visible textile pattern を MUST 含める」universal rule。v4.0 で全国共通 modern daily casual wear に統一し、伝統 silhouette 自体が [NO_TRADITIONAL_SILHOUETTE_RULE](#no_traditional_silhouette_rule-v40-新規普遍ルール) で明示禁止となったため、本ルールが適用される situation が原理的に消滅し **退役**。

**旧 RULE 全文**：`archive/prompts/master_prompt_design_guide_v3_12.py` 1684-1778 行を参照。

**v4.0 における代替方針**：modern garment の subtle pattern（plaid check / botanical / geometric in muted modern colors）は各国 `cultural_styling_hint` で per-country に specify する。pattern lookup はもはや不要（`TRADITIONAL_DRESS_PATTERN_LOOKUP` / `pattern_for(word)` は v4.0 で削除）。

**将来の再活性化条件**：v5.0+ で「伝統服を含む文化的多様性を modern wear と並列で扱う」方針に転換した場合、本ルールを restore する設計判断が再び発生し得る。ただし「アジア / 西洋アシンメトリ」を再発させない構造が必要。

---

## PART 1.7 FLAG_PLACEMENT_RULE

> v3.12 で導入された「flag pin/patch の位置を 4 option から word hash で deterministic に選択」ルール。v4.0 で flag が「両手で胸前に持つ hand-held flag」固定 pose になったため、**簡素化**（全員固定 pose・deterministic-pick 不要）。

### Principle

```
v4.0 (2026-05-22): all nationality cards use a fixed flag pose — the subject holds a small rectangular hand-held flag in both hands in front of the chest, flag face squarely toward the viewer. There is no per-card placement variation. The {FLAG_PLACEMENT} placeholder in NATIONALITY_NOUN_POLICY.subject_block_pattern is kept for backward compatibility with the v3.12 pipeline structure but is now filled by a constant phrase rather than a deterministic pick.
```

### rule_a — constant placement

```
{FLAG_PLACEMENT} = 'in both hands in front of the chest, at about chest-to-upper-waist height, both arms bent at the elbows' — the same string for all 7 nationality words in lesson_01 and for any future country added. The flag pose is part of the v4.0 universal design (not per-country variation).
```

### rule_b — size governed by flag_hand_held_rule

```
Flag size (12-15% of frame, per PART 1.1 flag_hand_held_rule) is governed by NATIONALITY_NOUN_POLICY.flag_hand_held_rule, not by this rule. This rule governs placement (= constant 'in both hands in front of the chest') only.
```

### rule_c — single occurrence preserved

```
Exactly ONE flag occurrence per card (per NATIONAL_SYMBOL_ISOLATION_RULE). v3.12 from rule_c is preserved unchanged.
```

### enforcement

`build_prompts.py` の `flag_placement_for(word)` ヘルパーが constant string を返し、`NATIONALITY_NOUN_POLICY.subject_block_pattern` の `{FLAG_PLACEMENT}` placeholder に注入する。`FLAG_PLACEMENT_OPTIONS` in `scripts/build_prompts.py` is now a single-entry list （[PART 5.6](part5_vocab_reference_appendix.md#56-flag_placement_options)）。pre-flight invariant としての mechanical check は v4.0 段階では実装しない（v3.12 と同じ）。

---

## PART 1.8 FACIAL_FEATURES_RULE

> 顔のディテール必須化規律（v4.0 新規）。
> v4.0 実機検証（lesson_01 全 12 件 nanobanana 生成）で会社員カード 1 件において顔のディテール（目鼻口眉）が完全欠落する事象が確認された。特定の構図（suit + briefcase + 厳格姿勢）が "faceless silhouette stock image" の bias を強める潜在的構造問題と判断。

### Principle

```
All person vocabulary cards MUST clearly depict all four primary facial features (eyes, eyebrows, nose, mouth) drawn in the same flat illustration style as the rest of the body. Faceless silhouettes, blank faces, partially-rendered faces, or 'stylized illustration without facial detail' are NEVER permitted. The pedagogical principle: a vocabulary card is a character a learner looks at and identifies with — a faceless figure breaks that identification and reads as anonymous stock imagery, not a specific role/nationality.
```

### rule_a — four required features

```
The character's face MUST clearly show ALL FOUR of the following:

(1) eyes with visible pupils (not blank circles, not closed lines),
(2) eyebrows (simple curved or angled lines above the eyes),
(3) nose (a simple line, dot, or small shape — does not need to be anatomically detailed),
(4) mouth (a simple line, curve, or small shape — closed mouth in a calm expression is fine; teeth not required).

Omitting any one of these four counts as a faceless violation.
```

### rule_b — consistent with flat style

```
Facial features are drawn in the same flat illustration style as the rest of the body — clean continuous outlines, no gradients, no photoreal shading, no anatomical detail beyond what the flat vector style supports. The intent is 'minimal but present', not 'detailed portrait'. Even minimal features (a dot for the eye, a short curve for the mouth) satisfy the rule as long as they are visibly drawn.
```

### rule_c — avoid omission trigger contexts

```
nanobanana tends to omit facial features more often when the prompt heavily emphasizes a non-face signature (e.g., 'business suit + briefcase + professional posture' biases toward faceless stock illustration aesthetic). For these high-risk role compositions (company employee, doctor in full coat, banker, police officer, chef in toque), the rule MUST be doubly enforced by inline directive in PROMPT_TEMPLATES['vocabulary_person'] (see enforcement below). Do NOT rely on the default behavior; always include the FACIAL FEATURES directive.
```

### rule_d — named character consistency

```
NAMED_CHARACTER_PROFILES (鈴木さん等 固定キャラ) already specify facial features via fixed_features.face. Those entries already satisfy this rule. New named-character additions MUST include a fixed_features.face entry per this rule.
```

### enforcement

[Template A `vocabulary_person`](part4_prompt_templates.md#template-a-vocabulary_person) の `[SUBJECT]` セクション末尾に **FACIAL FEATURES inline directive** を埋め込む（v4.0 で追加）。directive 文字列は本ルール `rule_a` / `rule_b` 準拠で書き、全 person プロンプト（role / nationality / named-character）に自動的に適用される。

---

## PART 1.9 FLAG_SHAPE_DETAIL_RULE

> 国旗形状記述の詳細度規律（v4.0 新規）。
> v4.0 実機検証で複雑な国旗（米・西・伯）の構造要素の欠落・簡略化過多が確認された。flag は国家アイデンティティの中核であり、教材として正確性を可能な限り担保すべき。

### Principle

```
Each country's flag_shape_and_colors string MUST follow a three-layer template:

(1) INVOKE the flag by its formal name to leverage nanobanana's learned visual knowledge of standard world flags,
(2) provide a MINIMAL STRUCTURAL ANCHOR describing the most distinguishing visible elements (band orientation, color sequence, central or corner emblem position), and
(3) ENFORCE NO_TEXT_RULE explicitly.

This three-layer approach outperforms exhaustive geometric specification because nanobanana is an LLM-based generator with substantial learned knowledge of fixed world symbols like national flags — over-specifying every stripe count, star count, or shield internal heraldry introduces noise that conflicts with the learned representation.
```

### rule_a — invoke by formal name

```
Begin the flag_shape_and_colors string with 'the actual flag of <country>' or 'the actual <country> flag' — where the flag has a widely-recognized formal name in common English-language usage, append it in parentheses: 'flag of Japan (Hinomaru)', 'flag of South Korea (Taegukgi)', 'flag of the United States (Stars and Stripes)'. The word 'actual' signals to nanobanana that this is a real-world symbol it should render from its learned representation, NOT a freely-synthesized abstract design. Transliterations only — see rule_e.
```

### rule_b — minimal structural anchor

```
Follow the invoke phrase with 1-2 short sentences describing the most distinguishing visible structure: band orientation (horizontal/vertical), color sequence, central or corner emblem presence and approximate position. Do NOT exhaustively enumerate stripe counts, star counts, or exact proportions unless these are particularly load-bearing for the flag's identity (e.g., Spain's 1:2:1 band proportion is load-bearing because flags with red and yellow bands of equal width read as different flags). nanobanana cannot count to 50 stars perfectly even with specification — trust the invoke phrase for fine details and let the learned representation handle them.
```

### rule_c — enforce no text

```
End every flag_shape_and_colors string with an explicit NO_TEXT enforcement clause: 'ABSOLUTELY no text, letters, numbers, or words anywhere on the flag'. For flags whose actual real-world version contains text (Brazilian 'Ordem e Progresso' band, Saudi shahada inscription, Iraqi takbir, etc.), append a targeted override: 'even if the actual flag contains text/words in that area, render that area as blank/textless'. This overrides nanobanana's learned knowledge specifically for the text-rendering case while leaving the rest of the learned representation intact.
```

### rule_d — size realism

```
At 12-15% of frame size (per flag_hand_held_rule), the rendered flag is roughly 150-200 pixels per side. Exact pixel-level reproduction is impossible. The invoke phrase + minimal anchor + NO_TEXT enforcement typically achieves 'recognizable at a glance' fidelity at the correct level. Adding more geometric detail beyond the minimal anchor often introduces noise (rule_b).
```

### rule_e — latin script only in prompts

```
Even when invoking by formal name, use Latin-script transliteration only (Hinomaru, Taegukgi, Bandera de España, Stars and Stripes). NEVER include kanji, hangul, Chinese characters, Arabic script, Cyrillic, etc. in the prompt itself — nanobanana may attempt to render the non-Latin characters as text on the flag, violating rule_c.
```

### rule_f — invoke priority over geometric specification

```
v4.0.3 design decision (2026-05-22): when invoke-by-name and geometric specification conflict in writing strategy, INVOKE WINS. Historical example: v4.0.1 / v4.0.2 specified for Spain 'a small heraldic shield-shape (an escutcheon: a flat horizontal top edge, straight vertical sides for the upper portion, and a rounded curved point at the bottom)' — this exhaustive geometric description was nanobanana-suboptimal because nanobanana already knows the actual Spanish coat-of-arms silhouette from training. The v4.0.3 form 'the actual flag of Spain (Bandera de España)... with the Spanish coat-of-arms positioned on the yellow band toward the left side' invokes the learned representation cleanly and let nanobanana handle the heraldry details.
```

### country_addition_checklist

> ★ Claude Code 自動発動チェックリスト ★ — `scripts/build_prompts.py` が「ABORT: N 件の person が役割/国籍に分類できない」を出力し、unclassified word が「〜人」で終わる場合、Claude Code はユーザーからの明示依頼を待たずに本チェックリストを自動発動する。

**【手順】**

1. ABORT 出力から unclassified word を抽出。
2. `flag_shape_and_colors` を本ルール 3-layer template に従って作成案を作成：
   - **Layer 1** (rule_a INVOKE)：`'the actual flag of <country>'` + formal name in parentheses if widely-known.
   - **Layer 2** (rule_b ANCHOR)：1-2 sentences on band orientation / color sequence / central or corner emblem position. Avoid exhaustive enumeration.
   - **Layer 3** (rule_c NO_TEXT)：`'ABSOLUTELY no text, letters, numbers, or words anywhere on the flag'` + targeted override if the actual flag contains text. Latin-script only (rule_e). Trust nanobanana's learned knowledge for fine details (rule_f).
3. `cultural_styling_hint` を NO_TRADITIONAL_SILHOUETTE_RULE と `cultural_styling_hint_definition` 準拠で作成案を作成（modern daily casual wear / silhouette + fit + palette + footwear + optional non-hand accessory / 伝統 silhouette は全国禁止 / PART 1.4 rule_c 準拠で MUST / Pick ONE from 構文を使用）。
4. `phenotype_profile` を `PHENOTYPE_PROFILES` から選定：

   | 地域 | profile_key |
   |---|---|
   | 東アジア (日中韓) | `east_asian` |
   | 東南アジア (タイ印 vn フィリピン等) | `southeast_asian` |
   | 地中海欧州 (西伊 grc ポルトガル等) | `mediterranean_eu` |
   | 北欧/西欧 (独仏蘭スカンジナビア英愛等) | `northern_eu` |
   | 西/中アフリカ (ガーナ ナイジェリア等) | `west_african` |
   | 東アフリカ (ケニア エチオピア等) | `east_african` |
   | 多民族国家 (米伯 加 豪 比等) | `americas_diverse` |

   既存 profile で表現できない場合のみ `PHENOTYPE_PROFILES` に新 profile 追加を提案（palette_freeze 例外なので慎重に・[PART 1.5 rule_e](#rule_e--palette-freeze) 参照・user 合意必須）。
5. ユーザーに案を提示して合意を取る（CLAUDE.md「教育内容の確定は人間報告」規律に準拠）。
6. `build_prompts.py` に追記：`PERSON_NATIONALITY_HINTS['新国名'] = {...}` + `COUNTRY_TO_PROFILE['新国名'] = '<profile_key>'`
7. `python scripts/build_prompts.py --lesson NN` で再実行 → ABORT が消えることと invariants PASS を確認。
8. （任意・user 判断）lesson_NN の新国籍カードを 1 枚 smoke 生成して視覚検証。

---

## PART 1.10 HEAD_BODY_PROPORTION_RULE

> 頭身比規律（v4.0 第二次検証で新規）。
> v4.0 第一次実機検証で会社員カードと学生カードのみ頭身が短い（5-6 頭身）事象が確認された。特定 role（business suit + briefcase / casual smart + backpack）が anime/cartoon style の child proportion bias を誘発する構造的問題と判断。

### Scope

- `[Template A vocabulary_person]` 経由の全 person カード。
- 子供を意図する `NAMED_CHARACTER` 例外（`fixed_features.age_range` に "child" / "8-10 years" 等が含まれる場合）は本ルール対象外。
- `vocab_type=person` 以外には適用しない。

### Principle

```
All person vocabulary cards (except explicitly child NAMED_CHARACTERs) MUST depict an adult standing figure with approximately 7-head-height proportion: the total body height from top of head to bottom of feet is roughly 7 times the head height. This is the standard adult human proportion in educational illustration. nanobanana tends to default to 5-6 head proportion (childlike/cartoonish) when role signatures are dominant (business suit, school casual, uniform), so explicit directive is required.
```

### rule_a — seven head proportion

```
Adult standing figure: head height = approximately 1/7 of total body height. Legs from hip to floor occupy approximately the lower half (3.5/7) of the body. Torso (shoulder to hip) occupies approximately 2.5/7. Head occupies approximately 1/7 at the top. Arms hang naturally such that fingertips reach mid-thigh when relaxed. These are guideline proportions, not pixel-exact requirements — 'adult, not childlike' is the readable outcome.
```

### rule_b — no child proportions

```
NEVER render adult roles (business employee, doctor, teacher, student-as-adult, foreigner, all nationality nouns) with 5-6 head proportion which reads as childlike or cartoonish. The character must read as a working-age adult (approximately 20s-50s) by body proportion alone, even before considering facial features.
```

### rule_c — role trigger compensation

```
Roles with strong childhood-bias triggers — particularly
(a) business suit + briefcase (anime salaryman cliché tends toward shorter proportions),
(b) school-style casual + backpack + notebook (anime student cliché tends toward teen/child proportions),
(c) any uniform (police, chef, school staff) — MUST receive extra-explicit adult-proportion directive.

This is enforced via PROMPT_TEMPLATES['vocabulary_person'] [SUBJECT] inline directive rather than per-role outfit_hints customization.
```

### rule_d — named character exception

```
NAMED_CHARACTER_PROFILES with explicit child age_range (8-10 years, etc.) follow their own fixed_features and are exempt from this rule. New child named-characters MUST specify body proportion in fixed_features (e.g., '5-6 head proportion' for ~8-10 year olds).
```

### enforcement

[Template A `vocabulary_person`](part4_prompt_templates.md#template-a-vocabulary_person) の `[SUBJECT]` セクションに **HEAD-BODY PROPORTION inline directive** を埋め込む（v4.0.2 で追加）。directive 文字列は本ルール `rule_a` / `rule_b` / `rule_c` 準拠で書き、全 person プロンプトに自動適用される。

---

## PART 1.11 FOOTWEAR_RULE

> 履物の concrete 指定規律（v4.0 で `PERSON_NATIONALITY_HINTS` 全 7 国に inline 追加されたパターンを universal 化）。
> nanobanana は person prompt で footwear が未指定だと「裸足 / 不明瞭な silhouette」に倒れることが多い。各国 `cultural_styling_hint` で MUST visible footwear を concrete に指定する規律を universal rule として明文化。

### Scope

- `vocab_type == "person"` のすべて（role / nationality / named-character）。
- 特に nationality cards（全 7 国の `cultural_styling_hint`）には必須で含まれる。

### Principle

```
Every person vocabulary card MUST specify one concrete pair of footwear by type and (where ambiguous) color. The bare word 'shoes' is FORBIDDEN as it is interpreted by nanobanana as 'unspecified, often barefoot or vague silhouette'. Footwear is the second most common 'silently omitted' element after facial features (PART 1.8) and must be explicitly written to survive nanobanana's omission tendency.
```

### rule_a — concrete type + color

```
Specify exactly ONE concrete footwear type with optional color/material qualifier:
- 'plain low-profile white canvas sneakers'
- 'plain dark leather loafers'
- 'simple canvas flat sneakers'
- 'plain leather low-profile loafers'
- 'plain work-style leather boots'
- 'plain flat leather sandals'

BAD:  'shoes' / 'casual footwear' / 'something on the feet'
GOOD: 'simple low-profile white or off-white canvas sneakers'
```

### rule_b — MUST visible

```
Use the phrase 'Footwear MUST be ...' to make the element mandatory (per PART 1.4 rule_c). Modal verbs (may, can) are FORBIDDEN — they signal omittability.

BAD:  'may wear canvas sneakers'
GOOD: 'Footwear MUST be simple canvas sneakers'
```

### rule_c — no traditional footwear

```
Concrete footwear MUST be modern. Traditional or regional footwear (espadrille jute-rope soles, geta, zōri, traditional Korean kkotsin, etc.) are FORBIDDEN per NO_TRADITIONAL_SILHOUETTE_RULE (PART 1.1 hard_constraints). The cultural_styling_hint may explicitly note "(NO woven jute-rope traditional espadrille sole, NO traditional regional footwear of any country.)" when the country has a notable traditional footwear tradition that nanobanana might gravitate toward.
```

### rule_d — pick ONE pattern for variation

```
Per country, the cultural_styling_hint may specify a 2-option footwear choice using PART 1.4 rule_b form: 'Footwear MUST be simple low-profile white canvas sneakers OR plain dark leather loafers.' This gives nanobanana a tight 2-step variation band that does not collapse to vague (rule_b range principle from PART 1.5 applied to footwear).
```

### enforcement

`PERSON_NATIONALITY_HINTS` の各国 `cultural_styling_hint` 内に footwear 行を含める（v4.0 全 7 国に inline 追加済・[PART 5.2](part5_vocab_reference_appendix.md#52-person_nationality_hints) 参照）。`ROLE_BASED_GENERIC_PROFILES` の `outfit_hints` も同様に footwear 行を含めるべきだが、role の場合は garment signature 優先のため必須化していない（v4.1+ で再評価候補）。
