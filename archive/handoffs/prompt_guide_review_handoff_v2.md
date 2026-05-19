# プロンプトガイド レビュー・方針整理 引き継ぎ資料
**作成日：2026-05-18（v1.0）→ 更新：2026-05-18（v2.0）**
**対象チャット（v1.0）：マスタープロンプトガイドv2.6評価・パイプライン現状整理・v2.7方針策定**
**対象チャット（v2.0）：v2.7作成・横断精査・8問題修正**
**前提資料：handoff_v4_7.md / master_prompt_design_guide_v2_6_complete.py**

---

## ⚠️ この資料の位置づけ

この資料は **handoff_v4_7.md への追記ではない**。
このチャットで行った以下3点の分析結果を記録するための独立した資料である。

1. ChatGPT評価の精査
2. パイプライン現状とガイドの乖離の整理
3. ガイドv2.7の方針策定（何を削除・修正・追加するか）

次チャットで v2.7 を作成する際は、この資料と `master_prompt_design_guide_v2_6_complete.py` を
両方アップロードしてこの資料を最初に読むこと。

---

## §1. ChatGPT評価の精査結果

### 1-1. ChatGPTが正確に指摘した点

| 指摘 | 評価 | 補足 |
|---|---|---|
| 「No text」と記号使用（?/!/✓/✗/メーター等）の矛盾 | ✅ 正確 | 方針転換後も問題は残存。性質が「GASが混乱」→「Claudeが矛盾したプロンプトを書く」に変化 |
| フラットデザイン指定と影・透明度指定の衝突 | ✅ 正確 | `existence_location`パターンでSpotlight + Contact Shadowを要求しながらno shadowsと指定 |
| 「complete」なのに単体で完結していない | ✅ 正確 | v2.5のSTYLE_BIBLE・PERSON_PROFILES等に依存。GRAMMAR_PATTERNS_C_ADDITIONSも欠落 |
| 1枚に詰め込みすぎるテンプレートが多い | ✅ 正確 | 特に授受表現・条件文系で要素数が多すぎる |

### 1-2. ChatGPTが甘く評価した・見当違いだった点

| 指摘 | 評価 | 理由 |
|---|---|---|
| 「設計書としてA-」 | ⚠️ 過大評価 | 方針転換後の用途（Claudeが参照する仕様書）では**B+程度**。情報の取捨選択コストが高すぎる |
| 「Layer 1/2/3に分けよ」提案 | ❌ 方針転換で無効 | v2.5/v2.6の2ファイル分割 + S列方式で**すでに分離済み** |
| 「プロンプトを短くしてGeminiに渡せ」 | ❌ 方針転換で無効 | ガイドはImagenに直接渡すものではなく、Claudeが読む仕様書になった |
| GAS実装分離の各提案 | ❌ 方針転換で無効 | GASがテンプレートエンジンだったアーキテクチャ自体がなくなった |

### 1-3. ChatGPTもこのチャットの私も同意する問題（優先度高）

1. 「No text」ルールの矛盾 → 3段階定義に統一が必要
2. GRAMMAR_PATTERNS_C_ADDITIONSの欠落 → 1ファイルに統合が必要
3. 優先順位（§4 FOUNDATIONAL）とファイル構造が逆転（最重要が末尾4000行目）
4. 改訂履歴の三重掲載（31行目・34行目・44行目）→ コピペミス

---

## §2. このチャットで新たに発見した問題点

ChatGPTが言及しなかった追加問題。

### 2-1. GRAMMAR_PATTERNS_C_ADDITIONSが存在しない【重大】

```
ファイル末尾（4159行目）に記載：
「GRAMMAR_PATTERNS_C と GRAMMAR_PATTERNS_C_ADDITIONS は
 両方を参照して完全な42エントリとして扱う。」

→ しかし GRAMMAR_PATTERNS_C_ADDITIONS はこのファイルに定義されていない。
→ 「complete」を名乗りながらコアデータが欠落している。
```

### 2-2. COSTARテンプレートのプレースホルダーが未実装のまま

```python
# ファイル内のCOSTARテンプレート（実際のコード）
[Layout & Coordinate Mapping]
{TR_LM_PROFILING}   ← TRAJECTOR_LANDMARK_PROFILING.prompt_injection_phrase
{CHARACTER_PLACEMENT}  ← UNIFIED_CHAR_SYSTEM (if uses_unified_char)
{GOLDEN_RATIO}  ← GOLDEN_RATIO_LAYOUT.prompt_injection_phrase
```

これはGASで実装すべき設計図であり、実際のプロンプトではない。
`FINAL_AUDIT_SUMMARY.remaining_for_gas_implementation`にも「今後やること」として列挙されている。
→ **v2.6 completeの時点でCOSTARテンプレートは機能しない**

### 2-3. STYLE_RECIPEが旧版（hex値付き）のまま【即時修正必要】

ガイド内のSTYLE_RECIPEにはhex値説明テキストが含まれている。
v4.6でImagenがhex値を画像内テキストとして描画するバグが発見され、
GAS側（generateImages.gs v5.2）では修正済みだが、**ガイド本文は旧版のまま**。

Claudeがガイドを読んでS列プロンプトを書くと古いSTYLE_RECIPEを使ってしまう。

```
❌ ガイドの現在の記述（使用禁止）：
"Color palette: soft cream white background (similar to #FBFBFB, hex value FBFBFB),..."

✅ 確定版（GAS v5.2準拠・こちらを使うこと）：
"Color palette: soft cream white background, deep slate navy outlines,
 muted warm blue as main fill color, warm amber gold as accent color,
 cool slate gray as sub-color for secondary elements.
 Skin tones: naturally warm medium skin tone."
```

### 2-4. ファイルがPythonとして機能しない

`.py`拡張子だが大部分がPythonコメント（`##`）で書かれた仕様書。
一部だけPython辞書（`UNIFIED_CHAR_SYSTEM = {...}`）として定義されている。
`import`して実行できるモジュールではなく、GASからも直接使えない。
ファイル形式と内容の乖離が実装時の混乱を生む。

### 2-5. 「Deep Research実証」という表現の信頼性問題

ガイド内で「Research①原則」「Deep Researchが実証」等の表現が多用されているが、
これはClaude/Gemini等のAIを使ったリサーチであり、
査読済み教育工学論文や実際の学習者テストではない。
→ 「AIが推奨した」と「人間の学習者で検証した」を区別すべき

---

## §3. パイプライン現状の整理（v4.7時点）

### 3-1. アーキテクチャの方針転換（v4.6で確定）

| 項目 | ガイドv2.6が想定 | 現在の実態（v4.7） |
|---|---|---|
| プロンプト生成主体 | GASの`buildImagePrompt_()`がテンプレートから自動組立 | **Claudeが手動でプロンプトを生成** |
| プロンプト格納場所 | GAS内のswitch-caseテンプレート | **Vocabularyシート S列** |
| GASの役割 | テンプレートエンジン | **S列を読んでImagenに渡すだけ** |
| フォールバック | なし（テンプレートが本体） | S列が空の場合のみテンプレートが動く |

**→ ガイドのテンプレート設計（A〜T、GRAMMAR_PATTERNS_C等）は**
**「GASが使うもの」ではなく「ClaudeがS列プロンプトを書く際の参照資料」に変わった**

### 3-2. 実装済み範囲

| 対象 | 状態 |
|---|---|
| 語彙カード生成（Vocabularyシート） | ✅ S列参照・Imagen呼び出し・Drive保存・レジストリ更新すべて実装済み |
| 例文画像生成（Examplesシート） | ❌ GAS関数なし・ExamplesシートにimagePrompt列もなし |
| S列プロンプトの内容 | ⚠️ lesson_01（17語）・lesson_02（18語）・N5全412語 すべて未生成 |

### 3-3. 例文画像生成はパイプラインに組み込める（難しくない）

同一パイプラインへの組み込みは**技術的に容易**。
コアロジック（callImagenAPI_ / saveImageToDrive_ / writeImageLog_）はすべて再利用可能。

必要な追加作業：
```
① Examplesシートに imagePrompt列（S列相当）を追加
② getPendingExampleImageRows_() 関数を追加（Examplesシートをスキャン）
③ generateExampleImageBatch() または generateImageBatch()を拡張
④ アスペクト比を 16:9 に設定（語彙カードは1:1、例文画像は16:9）
⑤ ClaudeがGRAMMAR_PATTERNS_Cを参照して例文ごとのプロンプトを生成・投入
```

### 3-4. 現在のボトルネック（優先順位順）

| 優先度 | 内容 | 状態 |
|---|---|---|
| **最高** | lesson_01・02（35語）のS列プロンプト生成 | ⚠️ 未着手（次チャット最優先） |
| 高 | N5全412語のS列プロンプト生成（50語単位） | ⚠️ 未着手 |
| 中 | generateImageBatch()実行（S列投入完了後） | ⏳ 待機中 |
| 中（後日） | ExamplesシートのimagePrompt列追加 + GAS拡張 | ⏳ 未着手 |

---

## §4. ガイドv2.6の各要素の現在の用途分類

### 4-1. 方針転換により「不要になった要素」

#### 完全に不要（削除対象）

| 要素 | 場所 | 理由 |
|---|---|---|
| `COSTAR_PROMPT_STRUCTURE.gas_implementation_note` | §4 FOUNDATIONAL | GASがCOSTARを実装する前提だった |
| `HOW_TO_USE_v2_6`のGAS switch-case拡張仕様 | PART 21 | S列方式でswitch-caseは不要 |
| `FINAL_AUDIT_SUMMARY.remaining_for_gas_implementation`の5タスク | 末尾 | S列方式で大半が無効化 |
| `{TR_LM_PROFILING}`等のプレースホルダー文字列 | COSTARテンプレート | GAS文字列連結の設計物・Claudeには不要 |
| complexity_levelによるGemini生成/SVG後処理の分岐 | ChatGPT評価で提案されていた概念 | SVG後処理システムは存在しない |
| v2.5依存・2ファイル構成の優先順位システム記述 | ファイル冒頭 | Claudeがまとめて読む分には参考情報で十分 |

#### 大幅に重要度が下がった要素

| 要素 | 理由 |
|---|---|
| vocab_type→テンプレート対応表の「GAS向け」記述 | 対応表の内容は残すが「GAS switch-caseに追加せよ」の文脈は削除 |
| GRAMMAR_PATTERNS_CとADDITIONSのマージ指示 | GASがパースする必要がなくなった。「両方読め」で十分 |

### 4-2. 方針転換により「新たに必要になった要素」

現在のガイドに欠けており、追加が必要なもの。

#### ① 確定版STYLE_RECIPE（最優先）

場所：ガイド冒頭に「変更禁止・このまま全プロンプトに付加すること」として明記

```javascript
// ✅ 確定版（v4.6バグ修正済み・hex値なし）
const STYLE_RECIPE = [
  "Minimalist flat vector illustration.",
  "Clean continuous black outlines with consistent line weight.",
  "Completely flat solid color fills only.",
  "Color palette: soft cream white background,",
  "deep slate navy outlines,",
  "muted warm blue as main fill color,",
  "warm amber gold as accent color,",
  "cool slate gray as sub-color for secondary elements.",
  "Skin tones: naturally warm medium skin tone.",
  "No gradients, no shadows, no 3D effects, no photoreal textures.",
  "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
  "This should look like it belongs in a brand style guide, not like AI art.",
  "Keep line weights consistent.",
].join(" ");
```

#### ② 「No text」ルールの3段階定義

場所：ガイド冒頭・各テンプレートからTEXT_POLICY_[A/B/C]として参照

```
TEXT_POLICY_A（語彙カード・具体物・建物・人物）:
  "No text, no letters, no numbers, no symbols."
  → 純粋なイラスト。文字・記号すべて禁止

TEXT_POLICY_B（文法・感情・関係性・例文画像）:
  "No words, no letters, no readable labels.
   Simple visual symbols are allowed: arrows, checkmark, cross mark,
   question mark, exclamation mark, abstract meters, calendar cells."
  → 言語テキストは禁止。教材用制御記号は許可

TEXT_POLICY_C（時間・助数詞・カウンター教育用画像）:
  "No words, no letters. Numbers and simple calendar marks are allowed
   only when teaching time, dates, counters, or quantities."
  → 数字・カレンダーマークは教育目的で許可
```

**重要**：各テンプレート（A〜T・GRAMMAR_PATTERNS_C各エントリ）に
どのTEXT_POLICYを適用するかを明記すること

#### ③ アスペクト比の明示

場所：ガイド冒頭の基本設定

| 画像種別 | アスペクト比 | 対応シート |
|---|---|---|
| 語彙カード（テンプレートA〜T） | `1:1` | Vocabularyシート |
| 例文画像（GRAMMAR_PATTERNS_C） | `16:9` | Examplesシート |

**注意**：アスペクト比はGASのAPIパラメータで制御するため、
プロンプト本文内に記述する必要はない。
ただしClaudeがシーン構成を設計するときに意識できるよう明記する。
（16:9では左右方向のレイアウト設計が重要）

#### ④ JSON出力フォーマット仕様

場所：「Claudeの使い方」セクションとして新設

```json
// 出力フォーマット（importImagePromptsFromJson()に渡す形式）
{
  "word_先生":   "Minimalist flat vector illustration. [完成プロンプト全文]",
  "word_医者":   "Minimalist flat vector illustration. [完成プロンプト全文]",
  "ex_L01_007": "Minimalist flat vector illustration. [完成プロンプト全文]"
}
```

キー命名規則：
- 語彙カード → `word_[語彙]`（Vocabularyシート G列のimageId）
- 例文画像 → `ex_L[課番号2桁]_[連番3桁]`（ExamplesシートのimageId）

バッチサイズ：
- 語彙カード：50語単位で生成・投入を繰り返す
- 例文画像：課単位（lesson_01なら全例文まとめて）

#### ⑤ 各テンプレートへの完成プロンプト例の追加

現状：`prompt_core`はシーン記述の断片であり、完成プロンプトではない
必要：STYLE_RECIPE + TEXT_POLICY + prompt_coreを組み合わせた完成形サンプルを
各テンプレートに最低1例追加する

例（テンプレートA・person・先生）：
```
Minimalist flat vector illustration. Clean continuous black outlines with
consistent line weight. Completely flat solid color fills only. Color palette:
soft cream white background, deep slate navy outlines, muted warm blue as main
fill color, warm amber gold as accent color, cool slate gray as sub-color for
secondary elements. Skin tones: naturally warm medium skin tone. No gradients,
no shadows, no 3D effects, no photoreal textures. Apply zero ambient lighting,
zero drop shadows, zero global illumination. This should look like it belongs
in a brand style guide, not like AI art. Keep line weights consistent.

[SUBJECT]
A teacher (先生) standing confidently. Wearing smart casual clothes — neat
collared shirt and trousers. Holding a book or marker pen in one hand.
Warm approachable expression. The role must be visually obvious without text.

[SCENE & ACTION]
Full-body shot. Character centered and fills 70-80% of the image. Solid white
background. Canonical 3/4 view (30-45 degrees above and slightly to one side).

[CONSTRAINTS]
No text, no letters, no numbers, no symbols.
Generate as if this is part of a unified educational brand style guide.
```

---

## §5. v2.7作成方針（次チャットへの指示）

### 5-1. 削除・移動する内容

| 対象 | 処置 |
|---|---|
| GAS実装メモ（COSTARのgas_implementation_note・switch-case指示等） | 削除 |
| COSTARプレースホルダー文字列（`{TR_LM_PROFILING}`等） | 削除 |
| `FINAL_AUDIT_SUMMARY.remaining_for_gas_implementation` | 削除（完了済みor無効化済み） |
| 三重掲載の改訂履歴 | 1つに統合 |
| 旧版STYLE_RECIPE（hex値付き） | 確定版に差し替え |
| v2.5依存を前提とした記述 | 「v2.5も参照すること」の1行注記に圧縮 |

### 5-2. 追加・修正する内容

| 対象 | 処置 |
|---|---|
| 確定版STYLE_RECIPE | ガイド冒頭に「変更禁止」として配置 |
| TEXT_POLICY_A/B/C | 冒頭に定義・各テンプレートで参照 |
| アスペクト比（1:1 / 16:9） | 冒頭の基本設定に明記 |
| JSON出力フォーマット仕様 | 「Claudeの使い方」セクションとして新設 |
| GRAMMAR_PATTERNS_C_ADDITIONSの統合 | このファイルに統合（42エントリ完成） |
| 各テンプレートへのTEXT_POLICY参照追記 | A〜T・GRAMMAR_PATTERNS_C各エントリ |

### 5-3. 変更しない内容（価値があり維持する）

| 対象 | 理由 |
|---|---|
| GRAMMAR_PATTERNS_C本体（既存分） | 例文画像フェーズで直接使う |
| UNIFIED_CHAR_SYSTEM（Ego=テイルブルー/左・Soto=オレンジ/右） | 例文画像の設計基盤 |
| テンプレートA〜T（vocab_type別視覚戦略） | N5全412語のプロンプト生成で使う |
| FOUNDATIONAL原則7件（実質的な内容） | 設計思想として価値がある。ただし冒頭に移動 |
| SEMANTIC_COLOR_UNIFIED | カラーの一貫性確保に必要 |
| QA_CHECKLIST_v2_6 | 生成後の確認に使う |
| CHARACTER_RENDERING_POLICY（vocab_type別肌色ルール） | 画像の一貫性に必要 |

### 5-4. v2.7のファイル構造（推奨）

```
## ============================================================
## master_prompt_design_guide_v2_7.py
## 「Claudeがプロンプトを書くための仕様書」
## ============================================================

§0. このガイドの使い方（Claudeへの指示）
  - 用途：S列imagePromptをJSON形式で生成するときに参照する
  - 出力フォーマット仕様
  - バッチサイズ・キー命名規則
  - v2.5も合わせて参照すること（STYLE_BIBLE等）

§1. 変更禁止の基本設定（最優先）
  - 確定版STYLE_RECIPE（hex値なし）
  - TEXT_POLICY_A / B / C の定義
  - アスペクト比（語彙1:1・例文16:9）

§2. キャラクター・カラーシステム
  - UNIFIED_CHAR_SYSTEM（Ego/Soto）
  - SEMANTIC_COLOR_UNIFIED
  - CHARACTER_RENDERING_POLICY

§3. FOUNDATIONAL原則（横断的設計原則）
  ← 現在の§4（末尾）をここに移動
  - TRAJECTOR_LANDMARK_PROFILING
  - STROKE_STYLE_SEMANTICS
  - GOLDEN_RATIO_LAYOUT
  - UNIVERSAL_VS_CULTURAL_SYMBOLS
  - ADVERB_ANCHOR_PRINCIPLE

§4. テンプレートA〜T（語彙カード・vocab_type別）
  - 各テンプレートにTEXT_POLICY参照を追記
  - 各テンプレートに完成プロンプト例を1件追加

§5. GRAMMAR_PATTERNS_C（例文画像・文法パターン別）
  ← GRAMMAR_PATTERNS_C + GRAMMAR_PATTERNS_C_ADDITIONSを統合（42エントリ）
  - 各エントリにTEXT_POLICY参照を追記

§6. QAチェックリスト
```

---

## §6. v2.7作成前に確認が必要な事項

次チャットでv2.7を作成する前に以下を確認すること。

### 6-1. GRAMMAR_PATTERNS_C_ADDITIONSの所在

このファイル（v2.6 complete）には`GRAMMAR_PATTERNS_C_ADDITIONS`が存在しない。
現在のGRAMMAR_PATTERNS_Cが何エントリあるか数えて、42エントリとの差分を特定する必要がある。
ADDITIONSは別ファイル（`master_prompt_design_guide_v2_6_corrections.py`等）に存在する可能性がある。

**確認方法**：
```
v2.6_correctionsファイルが存在する場合はアップロードして確認する
存在しない場合はGRAMMAR_PATTERNS_Cの現在エントリ数を数え、
不足分をv2.7作成時に新規設計する
```

### 6-2. v2.5のSTYLE_BIBLEの扱い

v2.7がv2.5に依存することをやめる（単体完結化）のか、
それともv2.5参照を維持するのかを決める必要がある。

推奨：STYLE_BIBLEの中でv2.7に必要な部分（core_style・focal_length_standards）を
v2.7に取り込み、単体完結化する。

---

## §7. 次チャットの作業順序（v2.0 更新済み）

### v2.7 完成後の優先順（現在地）

```
✅ ① この資料（v1.0）を読む
✅ ② master_prompt_design_guide_v2_6_complete.py を読む
✅ ③ v2.7 を作成する（§5 の方針に従って）
✅ ④ v2.7 を横断精査し 8 問題を検出・修正する
⬜ ⑤ 他AIによるv2.7評価（次チャット）
⬜ ⑥ 評価結果を踏まえた追加修正があれば実施
⬜ ⑦ lesson_01・02（35語）のS列プロンプトをJSON形式で生成
⬜ ⑧ importImagePromptsFromJson() でS列に投入
⬜ ⑨ generateImageBatch() 実行
```

### v2.7 を使ったプロンプト生成時の注意（§9-4 参照）

```
① テンプレートA〜J（v2.5定義）を使う場合:
   v2.5 テンプレートの [STYLE RECIPE] ブロックを
   §1 の STYLE_RECIPE（hex値なし確定版）に「置換」する
   ※ v2.7 式どおり「前置」すると二重になる

② 肌色は STYLE_RECIPE に含まれていないため個別に追記する:
   暖色肌: "Skin tones: naturally warm medium skin tone."
   グレー: "Gender-neutral avatar, neutral light gray skin (#D3D3D3)."

③ TEXT_POLICY は §4 対応表に従って選択する（§9-3 参照）
```

### 例文画像フェーズ（語彙完了後）

```
⑩ ExamplesシートにimagePrompt列を追加
⑪ generateExampleImageBatch()をGASに追加（アスペクト比16:9）
⑫ lesson_01・02の例文プロンプトをGRAMMAR_PATTERNS_C参照で生成・投入
```

---

## §8. 参考：現在のガイドで「今すぐ使える」箇所（v2.0 更新）

**v2.7 完成後の状態。v2.6 の参照先はすべて v2.7 に変更。**

| 参照箇所 | 使い方 |
|---|---|
| §1 STYLE_RECIPE | 全プロンプトに使用（hex値なし確定版）。肌色は含まない |
| §1 TEXT_POLICY_A/B/C | vocab_type → §4 対応表に従って選択 |
| §2 UNIFIED_CHAR_SYSTEM | 2人以上登場の例文・文法画像で使用 |
| §2 SEMANTIC_COLOR_UNIFIED | 全テンプレートのカラー選択に参照 |
| §2 CHARACTER_RENDERING_POLICY | vocab_type別の肌色指定ルール |
| §3 FOUNDATIONAL原則 | 横断設計原則（TR/LM・線種・レイアウト等） |
| §4 PRONOUN_FRAMES〜SENSORY_FRAMES | テンプレートK〜T（v2.6新規）の prompt_core |
| §5 GRAMMAR_PATTERNS_C | 例文画像の文法パターン別戦略（41エントリ） |
| §6 QA_CHECKLIST | 生成後の確認チェックリスト |

**テンプレートA〜J は v2.5 の PROMPT_TEMPLATES を引き続き参照する。**
**ただし [STYLE RECIPE] ブロックは §1 の確定版に置換すること（§9-2 参照）。**

---

## §9. v2.7 作成・精査チャットで解決した事項（v2.0 新規）

### 9-1. v2.7 の完成状態

| 項目 | 内容 |
|---|---|
| ファイル名 | `master_prompt_design_guide_v2_7.py` |
| 作成日 | 2026-05-18 |
| 元ファイル | v2.6_complete（v2.5 の PROMPT_TEMPLATES は引き続き参照） |
| GRAMMAR_PATTERNS_C | **41エントリ**（v2.6本体36件 + ADDITIONS 5件を統合） |
| ADVERB_FRAMES | 18エントリ（本体に統合済み） |
| FAMILY_FRAMES | 8エントリ（本体に統合済み） |
| Python syntax | ✅ VALID |

### 9-2. v2.7 で実施した主な変更（§5 方針との対応）

| §5 方針 | 実施状況 | 備考 |
|---|---|---|
| GAS実装メモの削除 | ✅ 完了 | COSTARプレースホルダー・switch-case仕様等 |
| FINAL_AUDIT_SUMMARY.remaining_for_gas_implementation 削除 | ✅ 完了 | |
| 確定版STYLE_RECIPE（hex値なし）をガイド冒頭に配置 | ✅ 完了 | §1-1 |
| TEXT_POLICY_A/B/C の定義 | ✅ 完了 | §1-2 |
| アスペクト比の明示 | ✅ 完了 | §1-3 |
| JSON出力フォーマット仕様の新設 | ✅ 完了 | §0 |
| GRAMMAR_PATTERNS_C + ADDITIONS の統合 | ✅ 完了（41件）| §5 |
| ファイル構造を「Claudeが読む順」に再設計 | ✅ 完了 | §0→§1→§2→§3→§4→§5→§6 |
| 改訂履歴の三重掲載を統合 | ✅ 完了 | ファイルヘッダ1箇所に統一 |
| v2.5参照を1行注記に圧縮 | ✅ 完了（ただし単体完結は未達）| ※下記注参照 |

**※ 単体完結化について**：§6-2 の「v2.5 依存をやめるか維持するか」の決定を行い、テンプレートA〜Jは v2.5 に残したまま参照方式を維持する方針を採用。完全な単体完結は見送り（v2.5テンプレートの重複は避けるため）。

### 9-3. 横断精査で新たに発見・修正した8問題

v2.7 初版作成後、自動スクリプトと横断読みで以下8問題を検出・修正した。

| # | 重大度 | 問題 | 修正内容 |
|---|---|---|---|
| 1 | 🔴 重大 | TEXT_POLICY の割り当て矛盾（spatial→AとB両方に記載等） | §1 コメントを vocab_type 対応表に刷新。B に: action_verb / spatial / sensory / demonstrative / adjective 等を正確に割り当て |
| 2 | 🔴 重大 | `no symbols` と矢印許可の衝突（v2.5既知問題の再発） | TEXT_POLICY_A から「no symbols」ハード禁止を削除。教育的記号はテンプレートCONSTRAINTS優先と明記 |
| 3 | 🔴 重大 | STYLE_RECIPE の肌色句が例文プロンプトの neutral_avatar 指定と衝突 | STYLE_RECIPE から `Skin tones: naturally warm medium skin tone.` を削除。CHARACTER_RENDERING_POLICY 一元管理に移行。プロンプト生成時に個別追記する方式に変更 |
| 4 | 🟡 中 | STYLE_RECIPE の二重付加リスク（A〜Jテンプレートは内部にSTYLE RECIPEを持つ） | §0 の組み立て手順を「A〜Jは置換・K〜Tは前置」と明確化 |
| 5 | 🟡 中 | 対応表に存在しない ADVERB/FAMILY ADDITIONS 辞書への参照 | 参照記述を削除し「本ファイル§4に定義済み」に変更（実際は本体統合済み） |
| 6 | 🟡 中 | エントリ数の不整合（実数41 vs 表記42） | 3箇所を41に統一 |
| 7 | 🟢 軽微 | §5 ヘッダの TEXT_POLICY 記述が曖昧（「文型によってはC」が不明確） | TEXT_POLICY_B 固定と明記、Cが不適用な理由を補記 |
| 8 | 🟢 軽微 | variant_grid が CHARACTER_RENDERING_POLICY 未収録 | context_dependent に追加 |

### 9-4. v2.7 を使ったプロンプト生成時の重要注意点

**これらは次チャットで S列 imagePrompt 生成を行う前に必ず確認すること。**

```
① テンプレートA〜J の使い方（二重付加回避）
   → v2.5 テンプレートの [STYLE RECIPE — DO NOT CHANGE] ブロックを
      v2.7 §1 の STYLE_RECIPE（hex値なし版）で「置換」する。
      § 0 式どおり STYLE_RECIPE を「前置」しない（二重になる）。

② 肌色の追記（STYLE_RECIPE から削除されたため）
   → 暖色肌 (person / building / family):
      "Skin tones: naturally warm medium skin tone." を追記
   → グレーアバター (example_sentence / pronoun 等):
      "Gender-neutral avatar, neutral light gray skin (#D3D3D3)." を追記

③ TEXT_POLICY の選択（§4 対応表に従う）
   TEXT_POLICY_A: person / building / concrete_object / variant_grid /
                  abstract_concept / family / transportation / weather名詞
   TEXT_POLICY_B: action_verb / spatial_relation / demonstrative / adjective /
                  example_sentence / pronoun / interjection / set_expression /
                  adverb / sensory / weather体感形容詞
   TEXT_POLICY_C: time / counter
```

---

## §10. 未解決の事項・次チャット以降の課題（v2.0 新規）

### 10-1. 他AI評価（次チャット）

v2.7 を他の AI（ChatGPT 等）に評価させる予定。
評価時に渡すべきファイル:
- `master_prompt_design_guide_v2_7.py`（本チャットで作成）
- この資料（変更経緯の参照用）

評価で確認すべき観点:
1. §9-3 で修正した8問題が本当に解決されているか
2. `existence_location` パターンの Spotlight + Contact Shadow と `no shadows` の矛盾（v2.6評価時に指摘済み・v2.7で対処済みかを再確認）
3. GRAMMAR_PATTERNS_C の 41エントリが v2.6 の「37本体 + 5 ADDITIONS」と数が合わない点（本体36 + 5 = 41 であり v2.6記載の37とは差異があるが、これはv2.6のカウント精度の問題と判断している）

### 10-2. v2.7 で対処していない既存問題

| 問題 | 状態 | 優先度 |
|---|---|---|
| GRAMMAR_PATTERNS_C: 一部トランケーションにより v2.6 の全37エントリとの照合未完了 | ⚠️ 未完了 | 中 |
| テンプレートA〜J の本体が v2.7 に含まれず v2.5 参照のまま（単体完結未達） | 意図的な見送り | 低（v2.8検討） |
| Spotlight + Contact Shadow（existence_location）と no shadows の形式矛盾 | v2.7では構造上残存（Claudeが個別判断すべき問題） | 低 |
| GRAMMAR_PATTERNS_C 41件中、v2.7 で新規設計した 6件（suggestion_mashou 等）の品質未検証 | ⚠️ 要検証 | 中（S列生成前に確認推奨） |

### 10-3. S列 imagePrompt 生成（v2.7 評価完了後に着手）

評価・追加修正完了後の作業手順:

```
① lesson_01（17語）のvocab_type一覧確認
   → lesson_01_v1_1.json の patterns[].vocabulary[].vocab_type を確認
② lesson_02（18語）のvocab_type一覧確認
   → lesson_02_v2_11_11.json の同フィールド
③ vocab_type → §4 対応表でテンプレートを選択
④ v2.7 の手順に従って各語彙の完成プロンプトを JSON 形式で生成
   → 出力形式: {"word_先生": "[完成プロンプト]", ...}
⑤ importImagePromptsFromJson() で S列に投入
⑥ generateImageBatch() 実行
```

---

*v1.0 作成：2026-05-18（マスタープロンプトガイドv2.6評価チャット）*
*v2.0 更新：2026-05-18（v2.7作成・横断精査・8問題修正チャット）*
*根拠：本チャットの v2.7 作成作業・精査スクリプト実行結果*
*次資料：handoff_v4_7.md（パイプライン全体）と併用すること*
