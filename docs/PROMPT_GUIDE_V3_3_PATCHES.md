# プロンプトガイド v3.2 → v3.3 修正 詳細パッチリスト（72 件）

> このドキュメントは `~/.claude/plans/partitioned-bubbling-babbage.md` の Step 1
> （`archive/prompts/apply_v3_3.py` 作成・72 件パッチ）の実行に必要な詳細を持つ。
> Source: `prompts/master_prompt_design_guide_v3_2.py` (hash `566b8ad68753` LF 正規化後 / 2026-05-19 確定)
> 9 周精読で確定した 72 件の old/new 差分を wave 構造で記録する。

## 適用順序（waves）

1. **M-49 wave**（PART 7 退役）— 大きな削除を先にやると後段の波及が単純化
2. **M-2 wave**（"purely decorative" 二層構造）— グローバル constraints + 全テンプレ A〜J
3. **M-7 wave**（補助辞書キー正規化 + プレースホルダ出所表）
4. **M-15 wave**（D/H/J を {STRATEGY_BLOCK} 構造化）
5. **SSOT 階層違反 wave**（M-28/37/42・core_style 違反語書換）
6. **M-31 wave**（educational_symbol_colors サブセクション）
7. **M-47 wave**（多文化対応・肌色/髪色固定撤廃）
8. **テンプレ F wave**（M-59/60/61）
9. **個別軽修正**（残り 30+ 件）

各 wave 適用後に invariants と build_prompts.py の同期更新が必要。
最終的に Step 7 `npm run validate` で全件 PASS を確認。

---

## Wave 1 — M-49（PART 7 GEMINI_STABILIZATION 全体退役）

### M-49 / M-13 / M-25 / M-45 / M-46 / M-68 一括解消

**Location**: `prompts/master_prompt_design_guide_v3_2.py:2491-2640` (PART 7 GEMINI_STABILIZATION 全体)

**Issue**: PART 7 は Gemini chat-session 前提で書かれており、Phase 4 で Imagen 4 ローカル化（個別 API・session 無し）後は適用不能。session_management / session_reset_protocol / drift_detection_signals / production_rules / cost_note などすべてが死コード化。

**Decision**: 案 (a) — `archive/prompts/master_prompt_gemini_stabilization_legacy.py` に保全して PART 7 全体を削除。`color_space_protocol`（出力 PNG QC 規律）だけは別 PART として残置。

**Change**:
1. **新規ファイル作成**: `archive/prompts/master_prompt_gemini_stabilization_legacy.py`
   - PART 7 全体（line 2491-2640）の内容をコピー
   - 冒頭に保全コメント追加: "Phase 4 ⑥ で archive 退役（v3.3）. 旧 Gemini chat-session 時代のドリフト対策"
2. **ガイド本体から削除**: `prompts/master_prompt_design_guide_v3_2.py:2491-2640` の PART 7 全体を削除
3. **color_space_protocol だけ救出**: PART 7 内の `color_space_protocol` 定義を新規 PART (例: PART 6.5 OUTPUT_IMAGE_SPECIFICATIONS) として残置。本体は同一文字列、配置のみ変更。
4. **PART 番号調整**: 旧 PART 8 → 新 PART 7 へリナンバリング

**新矛盾チェック**:
- ✓ M-13 (spatial_drift.remedy_prompt person 規律違反) — PART 7 削除で消滅
- ✓ M-25 (medium_scale.frame_occupation 規律違反) — 同上
- ✓ M-45 (Gemini cost_note) — 同上
- ✓ M-46 (session_boundary_triggers) — 同上
- ✓ M-68 (small_scale "第1課18枚" 古例示) — 同上
- ✓ color_space_protocol は QC で実用なので保持

---

## Wave 2 — M-2（"purely decorative" 二層構造）

### M-2 / M-14 / M-30 — グローバル constraints + テンプレ I/C 例外整合

**Location**:
- グローバル constraints: `prompts/master_prompt_design_guide_v3_2.py:464-478`
- テンプレ I CONSTRAINTS: `:1559`
- テンプレ C CONSTRAINTS: `:1176` (M-30 連動)
- テンプレ D CONSTRAINTS: `:1247` (M-30 連動)
- テンプレ E CONSTRAINTS: `:1291` (M-30 連動)
- HOW_TO_USE Step 7: `:2858-2863` (M-14)

**Issue**:
- M-2: テンプレ I が SUBJECT で "symbolic visual metaphor 必須" と言いつつ CONSTRAINTS で "no symbols" と言う自己矛盾
- M-30: テンプレ C/D/E の CONSTRAINTS が「no symbols」と限定子無し
- M-14: テンプレ C の {VISUAL_SYMBOL_IF_NEEDED} 選択手順が HOW_TO_USE に未明示

**Decision**: 案 (d) — pedagogical vs decorative の二分法導入。"purely decorative" 表現でグローバルとテンプレ I/C/D/E を統一。

**Change**:

**Patch 2-1 (グローバル constraints `:464`)**:
```diff
- "No text, no letters, no numbers, no decorative symbols anywhere — "
+ "No text, no letters, no numbers, no purely decorative symbols anywhere — "
```

**Patch 2-2 (グローバル Exception 1 examples `:471` 周辺)**:
```diff
- "Exception 1 (EDUCATIONAL pictographic elements) — directional arrows, "
- "territory boundary lines, motion lines, panel dividers — pictographic "
- "shapes used to teach grammar or spatial logic. They are PERMITTED "
- "in templates F, G, H, and J ..."
+ "Exception 1 (EDUCATIONAL pictographic elements) — directional arrows, "
+ "territory boundary lines, motion lines, panel dividers, and symbolic "
+ "metaphor anchors (hearts, sparkles, teardrops, question marks, "
+ "lightbulbs, stars, etc. as defined in ABSTRACT_METAPHORS / "
+ "VISUAL_SYMBOLS) — pictographic shapes used to teach grammar, spatial "
+ "logic, or abstract concepts. They are PERMITTED in templates C, F, "
+ "G, H, I, and J ..."
```

**Patch 2-3 (テンプレ I CONSTRAINTS `:1559`)**:
```diff
- "No text, no letters, no numbers, no symbols inside the image."
+ "No text, no letters, no numbers, no purely decorative symbols inside "
+ "the image. Symbolic metaphor anchors (as defined in ABSTRACT_METAPHORS) "
+ "ARE PERMITTED as part of the intended pedagogical metaphor."
```

**Patch 2-4 (テンプレ C CONSTRAINTS `:1176`) — M-30 連動**:
```diff
- "No text, no letters, no numbers, no symbols inside the image."
+ "No text, no letters, no numbers, no purely decorative symbols inside "
+ "the image. VISUAL_SYMBOLS entries (question mark / checkmark / X mark / "
+ "arrow) ARE PERMITTED when {VISUAL_SYMBOL_IF_NEEDED} is populated."
```

**Patch 2-5 (テンプレ D CONSTRAINTS `:1247`) — M-30 連動**:
```diff
- "No text, no letters, no numbers, no symbols inside the image."
+ "No text, no letters, no numbers, no purely decorative symbols inside the image."
```

**Patch 2-6 (テンプレ E CONSTRAINTS `:1291`) — M-30 連動**:
```diff
- "No text, no letters, no numbers, no symbols inside the image."
+ "No text, no letters, no numbers, no purely decorative symbols inside the image."
```

**Patch 2-7 (HOW_TO_USE Step 7 `:2858-2863`) — M-14 連動**:
```diff
+ {VISUAL_SYMBOL_IF_NEEDED} =
+   - 文型が「質問・否定・選択比較」を含むなら VISUAL_SYMBOLS から該当エントリの
+     value 文字列を 1 つ転記する。
+   - 通常の S+V+O 文（例「リンさんは中国人です」）なら空文字列でよい。
+   - 例: 「これは何ですか？」→ VISUAL_SYMBOLS["質問・疑問"].value を転記
+   - 必要なければ空文字列で削除（プレースホルダ残骸禁止）
```

**新矛盾チェック**:
- ✓ テンプレ A/B/F/G/H/J は元々「decorative」付き or 例外で対応済み → 影響なし
- ✓ ABSTRACT_METAPHORS 13 エントリは Exception 1 拡張で permitted
- ✓ invariants.mjs C 系は背景文字列チェックのみ → 影響なし

---

## Wave 3 — M-7（補助辞書キー正規化 + プレースホルダ出所表）

### M-7 / M-19 / M-20 / M-50〜M-57 / M-72 一括処理

**Issue**: 5 補助辞書のキーが複合形式（"会社(company office)"）で `word` 単体からアクセス不能。8 プレースホルダ（{COMPOSITION_NOTES}, {CONCEPT_DEFINITION}, {COMPOSITION_MOOD}, {REFERENCE_OBJECT}, {TARGET_OBJECT}, {SPATIAL_POSITION}, {CHARACTER_DESCRIPTION}, {ACTION_DESCRIPTION}, {TARGET_WORD_EN}, {ADJECTIVE_CATEGORY}, {ANCHOR_OBJECTS}, {ADJECTIVE_STRATEGY}）の出所が未定義。

**Decision**: 案 (a) — 全辞書のキーを日本語単体に正規化。各エントリに `_en` フィールドで英訳保持。HOW_TO_USE 末尾に「プレースホルダ出所表」新規セクション追加。

**Change**:

**Patch 3-1 (BUILDING_CUES キー正規化 `:1675-1745`)**:
```diff
- "会社(company office)":      { ... }
- "学校(school)":              { ... }
- "銀行(bank)":                { ... }
- "大学(university)":          { ... }
- "デパート(department store)": { ... }
- "病院(hospital)":            { ... }
- "駅(train station)":         { ... }
- "スーパー(supermarket)":     { ... }
+ "会社":     { "_en": "company office",      "building_type": "company office", ... }
+ "学校":     { "_en": "school",              "building_type": "school", ... }
+ "銀行":     { "_en": "bank",                "building_type": "bank", ... }
+ "大学":     { "_en": "university",          "building_type": "university", ... }
+ "デパート": { "_en": "department store",    "building_type": "department store", ... }
+ "病院":     { "_en": "hospital",            "building_type": "hospital", ... }
+ "駅":       { "_en": "train station",       "building_type": "train station", ... }
+ "スーパー": { "_en": "supermarket",         "building_type": "supermarket", ... }
```
※ `building_type` フィールド追加は M-6 統合（後述）

**Patch 3-2 (OBJECT_SIGNATURES キー正規化 `:1777-1986`)**:
- 全エントリのキーを「日本語(英訳)」→「日本語」へ変更
- 各エントリに `_en` フィールド追加で英訳保持
- 例: `"雑誌(magazine)"` → `"雑誌": { "_en": "magazine", ... }`

**Patch 3-3 (ABSTRACT_METAPHORS キー正規化 `:2148-2259`)**:
- 全 13 エントリのキーを「日本語」へ変更（`"好き(like / love)"` → `"好き": { "_en": "like / love", ... }`）
- ※ M-37 / M-64 / M-65 も同じ辞書を触るため統合実装

**Patch 3-4 (SPATIAL_GRID_PATTERNS キー正規化 `:2004-2055`)**:
- 現状: `"to the right (右に)"` (英語ベース)
- 新: `"右"` (bare form・助詞「に」を剥がし) + `_en: "to the right"` + `_jp_full: "右に"`
- lesson_NN.json の word が「上」「右」等 bare の前提

**Patch 3-5 (VISUAL_SYMBOLS キー正規化 `:2331-2353`)**:
- 例: `"質問・疑問(question)"` → `"質問・疑問": { "_en": "question", ... }`
- カテゴリラベルとして利用（lesson 側からは `VISUAL_SYMBOLS[category_name].value` で参照）

**Patch 3-6 (HOW_TO_USE 末尾に「プレースホルダ出所表」新規セクション追加)**:
PART 8 末尾 (`:2993` 直前) に以下を追加:
```python
## ────────────────────────────────────────────────────────────
## プレースホルダ出所表（PART 3 PROMPT_TEMPLATES が使用する全プレースホルダ）
## ────────────────────────────────────────────────────────────
##
## A. 文型固定（lesson_NN.json から直接展開）
##   {WORD_JP}                  = vocabulary[i].word
##   {WORD_EN}                  = vocabulary[i].word_en（または _en lookup）
##   {SCENE_DESCRIPTION_JP/EN}  = examples[i].textToSpeak（C テンプレ）
##
## B. 補助辞書 lookup（M-7 正規化後）
##   {BUILDING_TYPE}            = BUILDING_CUES[word].building_type
##   {PRIMARY_SCENE_CUE}        = BUILDING_CUES[word].primary_scene_cue
##   {SIGNAGE_TEXT}             = BUILDING_CUES[word].signage_text
##   {OBJECT_DESCRIPTION}       = OBJECT_SIGNATURES[word].canonical_view + .primary_signatures (M-19)
##   {MATERIAL_TEXTURE_HINT}    = OBJECT_SIGNATURES[word].material_hints
##   {AVOID_LIST}               = OBJECT_SIGNATURES[word].avoid（M-67・ネガティブプロンプト用）
##   {VISUAL_METAPHOR}          = ABSTRACT_METAPHORS[word].visual_metaphor
##   {CONCEPT_DEFINITION}       = ABSTRACT_METAPHORS[word].concept_en（M-51）
##   {COMPOSITION_MOOD}         = ABSTRACT_METAPHORS[word].composition_mood（M-52・新規フィールド追加要）
##   {REFERENCE_OBJECT}         = lesson_NN.json examples[i].reference_object（M-53）
##   {TARGET_OBJECT}            = lesson_NN.json examples[i].target_object（M-53/M-54）
##   {SPATIAL_POSITION}         = SPATIAL_GRID_PATTERNS[direction].position_description（M-53）
##   {ACTION_DESCRIPTION}       = lesson_NN.json vocabulary[i].action_description（M-55）
##   {ADJECTIVE_CATEGORY}       = lesson_NN.json vocabulary[i].adjective_category（M-57）
##   {ANCHOR_OBJECTS}           = lesson_NN.json vocabulary[i].anchor_objects（M-57）
##   {ADJECTIVE_STRATEGY}       = lesson_NN.json vocabulary[i].adjective_strategy（M-57・M-15 wave 連動）
##
## C. CHARACTER_PROFILES lookup（M-47 wave 適用後・gender 不指定）
##   {CHARACTER_DESCRIPTION}    = compose_role_subject(g, role_key) の出力（M-55）
##   {SPEAKER_DESCRIPTION}      = 同上（テンプレ G・M-10）
##   {LISTENER_DESCRIPTION}     = 同上（テンプレ G・M-10）
##
## D. その他
##   {VISUAL_SYMBOL_IF_NEEDED}  = VISUAL_SYMBOLS[category].value または空文字列（M-14）
##   {COMPOSITION_NOTES}        = テンプレ C 固有・examples[i].composition_notes または空文字列（M-50）
##   {TARGET_WORD_EN}           = vocabulary[i]._en または word_en（M-56）
##   {FRONT_FACING_EXCEPTION}   = OBJECT_SIGNATURES[word].front_facing_exception または空（M-20）
##   {SIGNAGE_EXCEPTION_IF_ANY} = OBJECT_SIGNATURES[word].signage_exception または空（M-20）
```

**Patch 3-7 (M-72 — HOW_TO_USE Step 0 例示語差替 `:2673-2679`)**:
```diff
- 「写真」単体 → concrete_object（物体として示す）
- 「元気」→ abstract_concept（目に見えない状態）
+ 「ペン」→ concrete_object（物体として示す）
+ 「嬉しい」→ abstract_concept（目に見えない状態）
```
※ 「写真」「元気」は補助辞書未収録だが、「ペン」「嬉しい」は OBJECT_SIGNATURES / ABSTRACT_METAPHORS 収録済（要確認）。未収録ならガイド側で別の収録済語に差替。

**Patch 3-8 (M-52 — ABSTRACT_METAPHORS 全 13 エントリに `composition_mood` フィールド追加)**:
13 エントリすべてに `composition_mood: "<短文記述>"` を追加。値例:
- 好き: `"warm and affectionate, centered figure-with-symbol composition"`
- 嫌い: `"cool dismissive, figure turning away from object"`
- 楽しい: `"upbeat dynamic, multiple small sparkle marks around figure"`
- ... (残り 10 エントリも同様に視覚 mood を 1 行記述)

**新矛盾チェック**:
- ✓ build_prompts.py の lookup は `dict[word]` 直接アクセスで動作
- ✓ HOW_TO_USE / PIPELINE_INVENTORY / docs/REFERENCE.md §3 の参照 → 別途更新（実装ステップ Step 6）
- ⚠ data/image_prompts_lesson01_v3_2.json は v3.3 再生成で更新（Step 5）
- ⚠ build_prompts.py 内 PERSON_ROLE_LOOKUP / PERSON_FLAG_LOOKUP の hardcode は M-47 wave で別途撤廃

---

## Wave 4 — M-15（D/H/J を {STRATEGY_BLOCK} 構造化）

### M-15 / M-19 / M-20 / M-71 一括処理

**Location**:
- テンプレ D: `prompts/master_prompt_design_guide_v3_2.py:1203-1232`
- テンプレ H: `:1452-1517`
- テンプレ J: `:1593-1631`
- ARROW_SEMIOTICS.curved_arc.use_cases: `:2098-2101`（M-71）

**Issue**: v2.4 改訂で demonstrative G について「複数戦略を全部書くと画像生成器が混乱する」と認定して `{MODEL_TYPE_BLOCK}` で 1 つだけ展開する構造に修正した教訓が、D/H/J には適用されていない。D は OBJECT_ALONE + HAND_HOLDING 並置、H は 5 戦略並置、J は 3 戦略並置。

**Decision**: 案 (a) — D/H/J を G 同様の `{STRATEGY_BLOCK}` 構造に書き換え。

**Change**:

**Patch 4-1 (テンプレ D 構造化 `:1203-1232`)**:
- 現状: 本文中に "Option A: OBJECT_ALONE — ... Option B: HAND_HOLDING — ..." を並置
- 新: 本文を `{STRATEGY_BLOCK}` 1 個に置換し、戦略定義を新規 PART 4.10 OBJECT_STRATEGIES に移動

**Patch 4-2 (テンプレ H 構造化 `:1452-1517`)**:
- 現状: MOTION_ARROW / OUTCOME / BEFORE_AFTER / SEQUENCE_3PANEL / SYMBOLIC_MOTION_LINES の 5 戦略を本文に並置
- 新: 本文を `{STRATEGY_BLOCK}` 1 個に置換し、戦略定義を新規 PART 4.11 ACTION_VERB_STRATEGIES に移動
- 戦略選択は HOW_TO_USE Step 5-B に従う

**Patch 4-3 (テンプレ J 構造化 `:1593-1631`)**:
- 現状: PAIR_CONTRAST / SINGLE_HIGHLIGHT / PROPERTY_OVERLAY の 3 戦略を並置
- 新: 本文を `{STRATEGY_BLOCK}` 1 個に置換し、戦略定義を新規 PART 4.12 ADJECTIVE_STRATEGIES に移動

**Patch 4-4 (新規 PART 4.10 / 4.11 / 4.12 追加)**:
各 PART に当該戦略の定義を移植。冒頭に "Choose ONLY ONE strategy from below" を G と同様に明示。

**Patch 4-5 (HOW_TO_USE Step 3-D / 5-B / 6.5-B 更新)**:
戦略選択基準の参照先を新規 PART 4.10/4.11/4.12 に向ける。

**Patch 4-6 (テンプレ D `{OBJECT_DESCRIPTION}` プレースホルダ追加・M-19)**:
- `{OBJECT_DESCRIPTION}` を OBJECT_SIGNATURES[word].canonical_view + .primary_signatures から compose する旨を HOW_TO_USE に明記

**Patch 4-7 (テンプレ D `{FRONT_FACING_EXCEPTION}` / `{SIGNAGE_EXCEPTION_IF_ANY}` プレースホルダ・M-20)**:
- OBJECT_SIGNATURES に該当フィールド追加 or 空文字列対応を HOW_TO_USE に明記

**Patch 4-8 (M-71 — ARROW_SEMIOTICS.curved_arc.use_cases `:2098-2101`)**:
```diff
  "use_cases": [
-   "「振り向く」— turning around",
    "「こちらを向いて」— directing gaze toward speaker",
    "「あ」の心理的引き込みで領域が曲線的に変形する動き"
  ],
+ "note": "「振り向く」等の CURVED_MOTION 系動詞は、テンプレ H の MOTION_ARROW 戦略 "
+         "+ ARROW_SEMIOTICS.curved_arc の組合せで表現する（curved_arc 単独戦略は無い）。"
```

**新矛盾チェック**:
- ✓ G の {MODEL_TYPE_BLOCK} 構造と統一されるため、設計言語が一貫
- ✓ build_prompts.py が D/H/J 拡張時に「戦略選択」ロジックを共通実装可能
- ⚠ HOW_TO_USE の参照リンクが新規 PART に向くため、参照更新漏れに注意
- ✓ M-71 は H の 5 戦略を維持（CURVED_MOTION 戦略を新設しない）

---

## Wave 5 — SSOT 階層違反 wave（M-28 / M-37 / M-42）

### core_style 違反語の一括書換

**Location**:
- M-28: OBJECT_SIGNATURES.material_hints (`:1777-1988` 内の 7 エントリ)
- M-37: ABSTRACT_METAPHORS.visual_metaphor (`:2148-2259` 内の 3 エントリ)
- M-42: STYLE_BIBLE.example_image_style (`:383-385` 周辺)

**Issue**: core_style は SSOT 最強規律（"no gradients, no shadows, no lighting effects"）と宣言されているが、補助辞書 3 つが違反語を含む。

**Decision**: テーブル化された一括書換（ユーザー確定）。

**Change**:

| エントリ / 場所 | 現状 (old) | 修正後 (new) |
|---|---|---|
| OBJECT_SIGNATURES["ケータイ"].material_hints | `thin diagonal white highlight line` | `flat white reflection mark (single straight line, no gradient)` |
| OBJECT_SIGNATURES["茶碗"].material_hints | `thin shadow ring under the base foot` | `deep slate navy outline at the base contour` |
| OBJECT_SIGNATURES["雑誌"].material_hints | `glossy paper flex` | （削除 or `flat curved line as paper edge`） |
| OBJECT_SIGNATURES["財布"].material_hints | `subtle pebble grain texture` | `subtle dot stippling pattern as symbolic texture` |
| OBJECT_SIGNATURES["かばん"].material_hints (要該当エントリ確認) | `glossy / shiny material` | `flat solid color fills, no surface shine` |
| OBJECT_SIGNATURES["時計"].material_hints (要該当エントリ確認) | (shadow / highlight 系の語があれば) | flat 表現に書換 |
| OBJECT_SIGNATURES["本"].material_hints (要該当エントリ確認) | (同上) | flat 表現に書換 |
| ABSTRACT_METAPHORS["好き"].visual_metaphor | `A character holding a large glowing heart shape` | `A character holding a large solid amber heart shape with small star marks around it` |
| ABSTRACT_METAPHORS["友達"].visual_metaphor | `two puzzle pieces ... with light radiating from the join` | `two puzzle pieces ... with a small amber star mark at the joint` |
| ABSTRACT_METAPHORS["これから"].visual_metaphor | `a sunrise scene with a figure facing the light` | `a flat amber horizon band with figure silhouette facing right` |
| STYLE_BIBLE.example_image_style | `Soft natural indoor or outdoor daylight` | `flat warm tonal balance, no lighting effects, no shadows` |

**実装手順**:
1. OBJECT_SIGNATURES 全エントリを Grep で "highlight" / "shadow" / "glossy" / "shine" / "glow" / "gradient" / "pebble" 検索 → 該当 7 エントリを抽出 → 上記テーブルで書換
2. ABSTRACT_METAPHORS 全 13 エントリを同 Grep → 該当 3 エントリ書換
3. STYLE_BIBLE example_image_style 1 行書換

**新矛盾チェック**:
- ✓ core_style 表現 ("no gradients, no shadows") と整合
- ⚠ 画像品質への影響は実機検証必須（Step 8 で lesson_01 person/object 12 entries で確認）
- ✓ 補助辞書 SSOT 純度向上

---

## Wave 6 — M-31（educational_symbol_colors サブセクション）

### M-31 / M-38 / M-58 / M-61b / M-64 一括処理

**Location**:
- color_palette: `prompts/master_prompt_design_guide_v3_2.py:346-365` 周辺
- VISUAL_SYMBOLS: `:2331-2353`（M-31）
- ARROW_SEMIOTICS.straight_bold: `:2078` 周辺（M-38 "bright red"）
- ABSTRACT_METAPHORS.color_adjustment: `:2148-2259` 内 8 エントリ（M-64）
- テンプレ B / E "muted warm colors": `:1119, :1271` 周辺（M-58）
- テンプレ H の bright red 使用箇所（M-61b）

**Issue**: 補助辞書 3 つが color_palette 外の色名（bright red / red-orange / rose-pink / sepia / cool gray / blue 等）を使用。color_palette との不整合。

**Decision**: STYLE_BIBLE.color_palette に `educational_symbol_colors` サブセクションを新設し、symbolic/educational 用途の色を正式定義。

**Change**:

**Patch 6-1 (color_palette に educational_symbol_colors 追加)**:
```python
"educational_symbol_colors": {
    "_purpose": "VISUAL_SYMBOLS / ARROW_SEMIOTICS / ABSTRACT_METAPHORS.color_adjustment で使う "
                "symbolic / pedagogical color tokens. core_style の 'flat solid' 規律内で使用。",
    "symbol_red":          "muted symbolic red (#C44 相当)",  # 質問・否定・警告用
    "symbol_green":        "muted symbolic green (#5A8 相当)",  # checkmark・正解用
    "symbol_orange":       "muted symbolic orange (#D87 相当)",  # 注意・選択用
    "symbol_blue_cool":    "cool slate blue (#467 相当)",  # 冷却・否定情緒
    "symbol_pink_warm":    "warm muted pink (#D8A 相当)",  # 好意・愛情情緒
    "symbol_sepia":        "muted sepia (#A86 相当)",  # 過去・記憶
    "symbol_sky_pale":     "pale sky blue (#BCE 相当)",  # 未来・空間
}
```

**Patch 6-2 (VISUAL_SYMBOLS 各エントリの color 表現を symbol_* 参照に書換) — M-31**:
- "bright green" → "symbol_green"
- "bright red" → "symbol_red"
- "orange" → "symbol_orange"

**Patch 6-3 (ARROW_SEMIOTICS.straight_bold "bright red" → symbol_red) — M-38**:

**Patch 6-4 (テンプレ B "muted warm colors" → "main_color and sub_color 系列 (細部のみ educational_symbol_colors 許可)") — M-58**:

**Patch 6-5 (ABSTRACT_METAPHORS.color_adjustment 8 エントリ書換) — M-64**:
- 好き: "soft rose-pink" → "symbol_pink_warm"
- 嫌い: "cooler blue-gray" → "symbol_blue_cool"
- 楽しい: "Bright amber gold" → "warm amber gold" (color_palette accent と一致)
- 怒る: "Red-orange accent lines" → "symbol_red"
- 心配: "Cool gray" → "cool slate gray" (color_palette sub_color と一致)
- むかし: "sepia tones" → "symbol_sepia"
- これから: "blue for the sky" → "symbol_sky_pale"
- 変わる: "blue" → "symbol_sky_pale" or "muted warm blue" (文脈次第)

**新矛盾チェック**:
- ✓ color_palette が SSOT として全色を統括
- ✓ symbolic 色は core_style "flat solid" 規律内で使用（gradient/lighting 効果は付加しない）
- ⚠ Imagen 4 が `#hex` を文字列として解釈する場合があるため、本文では英語名のみで使用（hex はガイド内コメントのみ）

---

## Wave 7 — M-47（多文化対応・肌色/髪色固定撤廃）

### M-47 / M-65 / M-66 / M-70 一括処理（v3.0 §3 繰越事項解消）

**Location**:
- color_palette.skin_tones: `prompts/master_prompt_design_guide_v3_2.py:361` 周辺
- CHARACTER_PROFILES.generic_*.fixed_features (8 箇所): `:566-700`
- NATIONALITY_NOUN_POLICY.note: `:553-556`
- v3.0 §3 繰越事項: `:138-141`
- ABSTRACT_METAPHORS["家族"].color_adjustment: `:2219`（M-65）
- CHARACTER_PROFILES.allowed_changes: 各 generic_* 内（M-66）
- build_prompts.py compose_role_subject: `scripts/build_prompts.py:84-94`
- HOW_TO_USE Step 2-B: `:2696`

**Issue**: v3.0 §3 で繰越されていた「肌色 warm medium 固定」を多文化配慮として撤廃。同様に hair 色固定（generic_boy="black", others="dark brown", generic_male_middle="dark brown or black" の揺れ・M-70）も統一。

**Decision**: v3.3 で多文化対応を明示採用。NAMED_CHARACTER（鈴木さん等 5 名）の国籍 specific 描写は教育設計意図として維持。

**Change**:

**Patch 7-1 (color_palette.skin_tones `:361`)**:
```diff
- "skin_tones": "Naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults",
+ "skin_tones": "Skin tone is intentionally NOT specified — naturally diverse / multicultural variation expected.",
```

**Patch 7-2 (CHARACTER_PROFILES.generic_male_adult.fixed_features.skin `:566-700` 内)**:
全 8 キャラの `skin` フィールドを以下に統一:
```diff
- "skin": "warm medium skin tone",
+ "skin": "naturally diverse skin tone (multicultural variation expected)",
```

**Patch 7-3 (M-70 — CHARACTER_PROFILES.generic_*.fixed_features.hair 統一)**:
- adult / boy / girl / middle 系（6 キャラ）の hair:
  ```diff
  - "hair": "short neat dark brown hair" / "shoulder-length dark brown hair" / "short slightly messy black hair" / "dark brown or black hair, slight gray at the temples" / ...
  + "hair": "naturally varied dark hair (dark brown to black), <長さ・スタイル維持>"
  ```
- senior 系（2 キャラ）: `"fully gray or white hair"` を維持（加齢表現として保持）

**Patch 7-4 (NATIONALITY_NOUN_POLICY.note `:553-556`)**:
```diff
- "note": "肌色非指定が望ましいが本版では変更しない（将来の人間判断事項）"
+ "note": "v3.3 で multicultural variation を採用済。skin tone は generic_* / "
+         "compose_role_subject で NOT specified、NAMED_CHARACTER のみ国籍 "
+         "specific 描写を維持（教育設計意図）。"
```

**Patch 7-5 (v3.0 §3 繰越事項マーキング `:138-141`)**:
```diff
- "[3] skin_tones の "warm medium 固定" は変更しない（要・人間判断）"
+ "[3] skin_tones の "warm medium 固定" → v3.3 で解消（multicultural variation 採用）"
```

**Patch 7-6 (M-65 — ABSTRACT_METAPHORS["家族"].color_adjustment `:2219`)**:
```diff
- "Harmonized warm tones across all figures; matching skin tones"
+ "Harmonized warm tones across all figures (skin tones naturally varied, but visually balanced)"
```

**Patch 7-7 (M-66 — CHARACTER_PROFILES.allowed_changes)**:
各 generic_* の `allowed_changes` リストに `"skin_tone"` を追加（自由度反映）。

**Patch 7-8 (build_prompts.py compose_role_subject `scripts/build_prompts.py:84-94`)**:
```diff
def compose_role_subject(g, role_key):
    role = g.ROLE_BASED_GENERIC_PROFILES[role_key]
    outfit_lines = "; ".join(role["outfit_hints"])
    return (
        f"A {role['role_en']} ({role['role_ja']}). "
        f"Outfit and props: {outfit_lines}. "
        f"The character's gender is unspecified — use a generic adult appearance with "
-       f"warm medium skin tone, short to medium neat dark brown hair, "
-       f"and a calm friendly expression. "
+       f"naturally diverse skin tone (multicultural variation) and "
+       f"naturally varied dark hair (dark brown to black), "
+       f"and a calm friendly expression. "
        f"The role must be immediately readable from clothing and props alone."
    )
```

**Patch 7-9 (HOW_TO_USE Step 2-B `:2696`)**:
旧記述「CHARACTER_PROFILES の generic_* から選択」を以下に書換:
```python
## Step 2-B: 人物画像のキャラクター記述
##   - 決定論生成（build_prompts.py compose_role_subject）では gender 不指定 /
##     skin tone NOT specified / hair varied dark / friendly expression を default として使用
##   - CHARACTER_PROFILES.generic_* は将来の named_character 拡張や手動
##     オーバーライド時に参照する辞書として残置
##   - v3.3 多文化配慮対応に伴い、ROLE_BASED_GENERIC_PROFILES 経由で生成された
##     キャラは服装と props のみで役割を識別する
```

**新矛盾チェック**:
- ✓ NAMED_CHARACTER_PROFILES (鈴木さん等 5 名) は国籍 specific 描写を維持 → 教育設計意図と整合
- ✓ invariants.mjs に skin tone チェックは無い → 影響なし
- ⚠ 既存 lesson_01 41 件 person 画像は visual continuity を失う → backlog（既存画像再生成・Phase 4 後）
- ✓ Phase 4 ② 以降の building / object / abstract 拡張に skin 関連の干渉なし

---

## Wave 8 — テンプレ F（M-59 / M-60 / M-61）

### テンプレ F (spatial_relation) の単独不整合 3 件

**Location**: `prompts/master_prompt_design_guide_v3_2.py:1321-1367` 周辺

**Issue**:
- M-59: テンプレ F constraints に "zero global illumination" 欠落（他 9 テンプレすべてに存在）
- M-60: テンプレ F SCENE `:1335` 背景文字列 "soft cream off-white background" — 修飾子 `(warm off-white, NOT pure stark white)` 欠落（M-1 同型）
- M-61: テンプレ F SUBJECT `:1321` "bright red" 使用（color_palette 外・M-31 同型）

**Decision**: 3 件とも他テンプレと同一表現に統一。

**Change**:

**Patch 8-1 (M-59 — テンプレ F constraints `:1366-1367`)**:
```diff
- "No text, no letters, no numbers, no decorative symbols anywhere — Exception 1 applies."
+ "Apply zero ambient lighting, zero drop shadows, zero global illumination. "
+ "No text, no letters, no numbers, no purely decorative symbols anywhere — Exception 1 applies."
```
※ "purely decorative" 適用は M-2 wave 連動

**Patch 8-2 (M-60 — テンプレ F SCENE 背景文字列 `:1335`)**:
```diff
- Color palette: soft cream off-white background,
+ Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
```

**Patch 8-3 (M-61 — テンプレ F SUBJECT `:1321`)**:
```diff
- bright red reference object
+ symbol_red reference object (using educational_symbol_colors.symbol_red)
```
※ educational_symbol_colors の正式化（M-31 wave）と整合。

**Patch 8-4 (M-61b — テンプレ H の bright red 使用箇所も同様に書換)**:
※ テンプレ H 本文の `bright red` も `symbol_red` に統一。Grep で `bright red` を全件検出して書換。

**新矛盾チェック**:
- ✓ 他 9 テンプレと表現統一・invariants C4/C5 PASS
- ✓ educational_symbol_colors サブセクション（M-31 wave）と整合

---

## Wave 9 — 個別軽修正（残り 30+ 件）

以下は wave に統合されない単独修正。各項目で location / decision / change を記載。

### M-1 — テンプレ C 背景文字列補修

**Location**: `:1170`

**Change**:
```diff
- Completely flat solid color fills only. Color palette: soft cream off-white background,
+ Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
```

---

### M-3 — QA_CHECKLIST.building が v3.0 改訂と矛盾

**Location**: `:2412-2415`

**Change** (案 (a) v3.0 仕様):
```diff
  "building": [
-   "建物の種類が外観だけで（看板を隠しても）わかるか",
-   "入口設備・利用者行動・周辺アンカーの3点セットが揃っているか（BUILDING_CUES 参照）"
+   "建物の種類が外観だけで（看板の英語ラベルを隠しても）わかるか",
+   "primary_scene_cue（単一・低クラッター）が描かれているか（BUILDING_CUES 参照）",
+   "余計な看板・空のサイン枠・二次ラテン語（RECEPTION/ATM/OPEN 等）・日本語が無いか",
+   "看板の英語短語ラベル1個のみで、他のテキストが入っていないか"
  ]
```

---

### M-4 — PART 8 内の旧 Step 8 完全削除

**Location**: `:2865-2871`

**Change** (案 (a) 完全削除):
```diff
- Step 8: 建物画像の設計（vocab_type: building）
-
-   → BUILDING_CUES から対象建物のエントリを参照
-   → テンプレートB（vocabulary_building）を使用（v2.3 で変更なし）
```
Step 番号は飛ぶ（Step 7 → Step 9）が、PART 8 内には既に Step 2.5 / Step 6.5 の割込み番号があり、連続性は厳密でない設計。

---

### M-5 — invariants C4/C5 type 分岐

**Location**:
- ガイド: STYLE_BIBLE 直下に `BUILDING_BACKGROUND_EXACT` 定数追加
- invariants: `scripts/invariants.mjs:36-178`

**Change**:

**ガイド側 (新規定数追加・STYLE_BIBLE 直下推奨)**:
```python
# 建物用背景文字列（テンプレ B 専用・全文一致用）
BUILDING_BACKGROUND_EXACT = (
    "pale sky-blue background fills the entire frame edge to edge (full-bleed); "
    "no border, no vignette"
)
```

**invariants.mjs 側 (`scripts/invariants.mjs:36`)**:
```diff
- const BACKGROUND_EXACT = 'soft cream off-white background (warm off-white, NOT pure stark white)';
+ const BACKGROUND_BY_TYPE = {
+   default:  'soft cream off-white background (warm off-white, NOT pure stark white)',
+   building: 'pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette',
+ };
```

invariants C4/C5 関数内のロジックを `BACKGROUND_BY_TYPE[type] || BACKGROUND_BY_TYPE.default` に変更。C5（NOT_TOKEN）は building には適用しない（pale sky-blue は確定色のため揺れ防止トークン不要）。

---

### M-6 — BUILDING_CUES に building_type フィールド追加

**Location**: `:1675-1745` (BUILDING_CUES 8 エントリすべて)

**Change**: 各エントリに `"building_type"` フィールドを 1 行追加。
※ M-7 wave のキー正規化と統合実装可能。
※ 値: キー名括弧内の英訳をそのまま転記（"company office" / "school" / "bank" / "university" / "department store" / "hospital" / "train station" / "supermarket"）。

---

### M-8 — テンプレ A STYLE RECIPE に sub_color 言及追加

**Location**: `:1066-1071`

**Change**:
```diff
  Completely flat solid color fills only. Color palette: soft cream off-white background (warm off-white, NOT pure stark white),
  deep slate navy outlines, muted warm blue
- and warm amber gold as accents.
+ and warm amber gold as accents, cool slate gray for secondary elements.
```

---

### M-9 — iconization_level_guide vocab_types 戦略単位分類

**Location**: iconization_level_guide セクション内 (PART 1 STYLE_BIBLE 下部)

**Change**:
- `level_3.vocab_types` から `"action_verb"` を:
  ```python
  "action_verb (default; SEQUENCE_3PANEL strategy uses level_2)"
  ```
- または `level_2.vocab_types` に追加:
  ```python
  "action_verb (SEQUENCE_3PANEL only)"
  ```

---

### M-10 — テンプレ G `{SPEAKER_DESCRIPTION}` / `{LISTENER_DESCRIPTION}` 出所明示

**Location**: HOW_TO_USE Step 4 demonstrative `:2771-2782`

**Change**: 以下を追記:
```python
{SPEAKER_DESCRIPTION} / {LISTENER_DESCRIPTION} =
  CHARACTER_PROFILES.generic_* から generic_male_adult / generic_female_adult /
  generic_boy / generic_girl 等を選び、fixed_features を 1 文に展開して挿入する。
  ※ M-47 wave 適用後は skin tone NOT specified / hair varied dark で展開する。
```

---

### M-11 — 改訂履歴に v3.2 / v3.3 セクション追加

**Location**: `:17` 周辺（v3.1 見出し直上）

**Change**: v3.1 セクション直上に以下を追加:
```python
## ────────────────────────────────────────────────────────────
## v3.3 (2026-05-21): 監査72項目の決定論一括是正 + 多文化配慮対応
## ────────────────────────────────────────────────────────────
##
## 背景: v3.2 内部精読 9 周で 72 件の矛盾・未定義・規律違反を確定。
##   apply_v3_3.py で決定論的に一括是正。詳細は docs/PROMPT_GUIDE_V3_3_PATCHES.md。
##   全変更は apply_v3_3.py のみ（手作業修正なし）。
##
## §0. v3.0 §3 繰越事項の解消
##   skin_tones の "warm medium 固定" を「将来の人間判断事項」として
##   繰越していたが、v3.3 で明示的に解消（multicultural variation 採用）。
##
## §1. その他の修正（M-1〜M-72 一括）— PATCHES.md 参照
##
## ────────────────────────────────────────────────────────────
## v3.2 (2026-05-19): 監査7項目の決定論一括是正（apply_v3_2.py）
## ────────────────────────────────────────────────────────────
##
## 背景: v3.1 の実画像検査で 7 項目の取り残し・矛盾を確認。
##   apply_v3_2.py で決定論的に一括是正。
##   全変更は apply_v3_2.py のみ（手作業修正なし）。
```

---

### M-12 — "flat color shading" → "flat solid color fills" (2 箇所)

**Location**:
- PART 7 内（archive 退役対象だが念のため記載）: `:2528, :2629`
- M-49 wave で PART 7 全削除する場合は不要

**Change** (PART 7 退役と独立して残存箇所があれば):
```diff
- minimal flat vector style, line weight, and flat color shading
+ minimal flat vector style, line weight, and flat solid color fills
```

---

### M-13 — spatial_drift remedy_prompt の person 規律違反

**Location**: PART 7 内 `:2616`

**Decision**: M-49 wave で PART 7 全削除により自動解消。退役前に暫定対応する場合は 1 行コメント追加:
```python
# ⚠ NOTE: 下記 remedy_prompt は OBJECT 系の規律。person プロンプトには
#   "fills NN% of the image area" が invariants C1 違反になるため適用不可。
```

---

### M-14 — テンプレ C `{VISUAL_SYMBOL_IF_NEEDED}` 手順明示

**Resolution**: M-2 wave Patch 2-7 で HOW_TO_USE Step 7 に追記済。

---

### M-15 / M-16 / M-17 / M-18

- **M-15**: Wave 4 で処理済
- **M-16**: NAMED_CHARACTER_PROFILES の生成パス未実装 → ガイドに「Phase 4 後の named_character 拡張で対応」と注記追加（`:813-942` 冒頭）
- **M-17**: NATIONALITY_NOUN_POLICY に「外国人は対象外」明示 → `:553-556` のポリシー本文に追記
- **M-18**: OBJECT_SIGNATURES.canonical_view がテンプレ D に注入されない → M-7 wave の出所表で {OBJECT_DESCRIPTION} に canonical_view を含めることを明記

---

### M-19 / M-20 — テンプレ D プレースホルダ出所未定義

**Resolution**: M-7 wave Patch 3-6 の出所表に組込済。

---

### M-21 — BUILDING_CUES 旧 3 フィールド削除時期

**Location**: BUILDING_CUES 内の `entrance_cue` / `user_action_cue` / `surrounding_anchor` フィールド

**Change**: 旧 3 フィールドはコメントアウト or 削除（v3.0 で primary_scene_cue に集約済）。M-7 wave のキー正規化と一緒に処理可能。

---

### M-22 — vocabulary_card_style "Single centered subject only" vs variant_grid 衝突

**Location**: STYLE_BIBLE.vocabulary_card_style 周辺 + テンプレ E (variant_grid) `:1280-1300`

**Change**: vocabulary_card_style に variant_grid 例外を追記:
```diff
- "Single centered subject only"
+ "Single centered subject only (Exception: variant_grid テンプレ E は multi-tile composition を許可)"
```

---

### M-24 — Double-Hex Anchoring 廃止 vs 厳密適用矛盾

**Location**: production_rules.medium_scale `:2561`（PART 7 内・M-49 退役で自動解消）

**Decision**: M-49 wave で PART 7 全削除により自動解消。

---

### M-25 — medium_scale フレーム占有率 vs person HEIGHT 基準

**Resolution**: M-49 wave で PART 7 全削除により自動解消。

---

### M-26 — 教科書別ガイド「固定キャラ → 汎用人物」vs NAMED_CHARACTER 5 名

**Location**: `:2987` 周辺

**Change**: 教科書別ガイドの記述を修正:
```diff
- 固定キャラクター → 画像は汎用人物
+ 固定キャラクター → NAMED_CHARACTER_PROFILES（鈴木さん等 5 名）の特定キャラ描写を使用。
+ それ以外の役割は ROLE_BASED_GENERIC_PROFILES 経由で汎用キャラを生成。
```

---

### M-27 / M-40 — iconization_level vs テンプレ A/B 実態 / level_2 否定評価矛盾

**Location**: iconization_level_guide セクション

**Change**: `level_2.note` の「混同リスクあり」否定評価を削除し、person/building が level_2 を default とする理由を肯定的に記述。

---

### M-28 — Wave 5 で処理済

---

### M-29 — DEMONSTRATIVE_MODELS の色表記不統一

**Location**: DEMONSTRATIVE_MODELS `:2285-2321`

**Change**: "soft warm blue" → "muted warm blue"（color_palette との一致）/ "soft amber" → "warm amber gold"。Grep で該当色名を全件検出して統一。

---

### M-30 — Wave 2 で処理済

---

### M-31 — Wave 6 で処理済

---

### M-32 — VISUAL_SYMBOLS とテンプレ J/H/I の機能重複

**Location**: VISUAL_SYMBOLS の "2択・比較" / "怒り・感情" エントリ

**Change**: VISUAL_SYMBOLS の該当エントリ説明に「テンプレ J/H/I 本文で代替可能。VISUAL_SYMBOLS は補助として使用」と注記追加。または該当エントリを削除し、ABSTRACT_METAPHORS / 戦略本文に統合。

---

### M-33 — NAMED と ROLE_BASED の outfit 衝突

**Location**:
- NAMED_CHARACTER_PROFILES `:813-942`
- ROLE_BASED_GENERIC_PROFILES `:711-792`
- HOW_TO_USE Step 2-B

**Change**: HOW_TO_USE Step 2-B に優先順位を明示:
```python
## 同じ役割について NAMED と ROLE_BASED の両方が定義される場合、
## NAMED_CHARACTER_PROFILES が優先される。
## - 「先生」が「鈴木さん」を指す lesson context → 鈴木さん（business suit + tie）
## - 「先生」が generic teacher を指す lesson context → company_employee outfit
```

---

### M-34 — iconization_level_guide に spatial_relation / demonstrative 欠落

**Location**: iconization_level_guide.vocab_types

**Change**: `spatial_relation` と `demonstrative` を該当 level に追加:
- `spatial_relation` → level_2（オブジェクト 2 個 + 矢印で構成）
- `demonstrative` → level_2（人物 2 名 + zone 表現）

---

### M-35 — テンプレ I ブロックラベル不統一

**Location**: テンプレ I `:1531-1560` 内のブロック見出し

**Change**: `[SUBJECT — TIAC Layer 2: Object]` → 他テンプレと統一した `[SUBJECT]`（または全テンプレ統一形式に揃える）

---

### M-36 — NATIONALITY_NOUN_POLICY.subject_block_pattern とテンプレ A 重複

**Location**: NATIONALITY_NOUN_POLICY `:487-557`

**Change**: subject_block_pattern からテンプレ A SCENE&ACTION と重複する身体高さ規律記述を削除。

---

### M-37 — Wave 5 で処理済

---

### M-38 — Wave 6 で処理済

---

### M-39 / M-41 — spatial_relation の focal_length 規律分散

**Location**:
- SPATIAL_GRID_PATTERNS `:2004-2055`
- focal_length_standards / vocabulary_card_focal_length

**Change**:
- spatial_relation 用 focal_length を focal_length_standards に集約
- vocabulary_card_focal_length に全 vocab_types のマッピング表を新設（OBJECTS / PERSONS だけでなく building / spatial_relation / demonstrative / action_verb / abstract / adjective も）

---

### M-42 — Wave 5 で処理済

---

### M-43 — iconization_level_guide.level_4_realistic.vocab_types が文字列

**Location**: iconization_level_guide.level_4_realistic

**Change**:
```diff
- "vocab_types": "NOT used in this project"
+ "vocab_types": [],
+ "note": "NOT used in this project (level_4 realistic は本プロジェクト範囲外)"
```

---

### M-44 — NAMED_CHARACTER vs NATIONALITY_NOUN_POLICY の flag pin 規律差

**Location**:
- NAMED_CHARACTER_PROFILES 各キャラ
- NATIONALITY_NOUN_POLICY

**Change**: HOW_TO_USE に明示:
```python
## flag pin / nationality_visual_hints 規律:
## - NAMED_CHARACTER_PROFILES: nationality_visual_hints は optional（キャラ設定に従う）
## - NATIONALITY_NOUN_POLICY: 「中国人」「アメリカ人」等の汎用語に対しては
##   flag pin を必須化（小さく・4% 以下）
```

---

### M-45 / M-46 — Wave 1 で処理済

---

### M-47 — Wave 7 で処理済

---

### M-48 — FAMILY_TEMPLATES 未活用

**Resolution**: Phase 4 後 backlog（vocab_type=family の設計が必要）。本 v3.3 では FAMILY_TEMPLATES 冒頭に「Phase 4 後の family vocab_type で活用予定」と注記追加のみ。

---

### M-49 — Wave 1 で処理済

---

### M-50 〜 M-57 — Wave 3 で処理済（プレースホルダ出所表）

---

### M-58 — Wave 6 で処理済

---

### M-59 / M-60 / M-61 — Wave 8 で処理済

---

### M-61b — Wave 6 で処理済

---

### M-62 — テンプレ G "warm amber gold for listener territory or accent"

**Location**: テンプレ G `:1417`

**Change**:
```diff
- warm amber gold for listener territory or accent
+ warm amber gold for listener territory (also usable as accent in non-listener contexts)
```

---

### M-63 — テンプレ I "NO 'gradient-free tone' shading"

**Location**: テンプレ I `:1549`

**Change**: 過去用語 quote を削除し、core_style 表現で書換:
```diff
- NO 'gradient-free tone' shading
+ NO shading or gradients of any kind
```

---

### M-64 — Wave 6 で処理済

---

### M-65 / M-66 — Wave 7 で処理済

---

### M-67 — OBJECT_SIGNATURES.avoid 取り込み未実装

**Resolution**: Phase 4 ② で build_prompts.py に concrete_object 拡張時、OBJECT_SIGNATURES[word].avoid をネガティブプロンプトとして組込む実装を追加。本 v3.3 ではガイド側変更なし（実装側 backlog）。

---

### M-68 — Wave 1 で処理済（PART 7 退役で自動解消）

---

### M-69 — NAMED_CHARACTER_PROFILES.lesson_appearances 更新規律

**Location**: NAMED_CHARACTER_PROFILES `:813-942` 冒頭

**Change**: 注記追加:
```python
## lesson_appearances 更新規律:
## - 新規 lesson で NAMED キャラが登場する時、該当キャラの lesson_appearances に lesson_NN を追記
## - apply_vNN.py には反映しない（lesson データ独自管理）
```

---

### M-70 / M-71 / M-72 — Wave 7 / Wave 4 / Wave 3 で処理済

---

## 適用後の検証

詳細は plan ファイル `~/.claude/plans/partitioned-bubbling-babbage.md` Step 7-9 を参照。

1. **Step 7** — `npm run validate` で invariants 全件 PASS（C4/C5 type 分岐含む）
2. **Step 8** — 実機検証（lesson_01 person 12 entries を Imagen 4 で生成し、SSOT 階層違反書換と多文化対応の画像品質影響を確認）
3. **Step 9** — Phase 4 ⑥ で PART 7 archive 退役（M-49 wave 最終確定）

## 依存関係

- `apply_v3_3.py` 実装時、上記 wave 順序で適用すること（特に M-49 wave を先頭に置くと後段の波及が単純化）
- `scripts/build_prompts.py` の compose_role_subject 修正は M-47 wave と同期コミット
- `scripts/invariants.mjs` の type 分岐は M-5 と同期コミット
- `data/image_prompts_lesson01_v3_2.json` → `_v3_3.json` 再生成は wave 完了後（Step 5）

## 未確定・要次セッション判断

各 wave / 個別項目で「（要該当エントリ確認）」「（要 grep で全件検出）」と注記した箇所は、apply_v3_3.py 実装時に該当ガイド section を読んで verbatim 確認すること。本 PATCHES.md は実装者が判断に迷わない粒度を目標としているが、文字列の完全な verbatim match は実装時の guide read で最終確定する。
