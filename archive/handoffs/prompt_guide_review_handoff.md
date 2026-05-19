# プロンプトガイド レビュー・方針整理 引き継ぎ資料
**作成日：2026-05-18**
**対象チャット：マスタープロンプトガイドv2.6評価・パイプライン現状整理・v2.7方針策定**
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

## §7. 次チャットの作業順序

### 最優先（授業準備に直結）

```
① この資料を読む
② master_prompt_design_guide_v2_6_complete.py を読む
③ lesson_01・02（35語）のS列プロンプトをJSON形式で生成
   → 確定版STYLE_RECIPE（§4-2の①）を使うこと
   → TEXT_POLICY_Aを各語彙に適用
④ importImagePromptsFromJson() でS列に投入
⑤ generateImageBatch() 実行
```

### 語彙画像が安定したら

```
⑥ N5全412語のプロンプト生成（50語単位・9回）
⑦ v2.7作成（この資料の§5に従って）
```

### 例文画像フェーズ（語彙完了後）

```
⑧ ExamplesシートにimagePrompt列を追加
⑨ generateExampleImageBatch()をGASに追加（アスペクト比16:9）
⑩ lesson_01・02の例文プロンプトをGRAMMAR_PATTERNS_C参照で生成・投入
```

---

## §8. 参考：現在のガイドで「今すぐ使える」箇所

次チャットでS列プロンプトを生成する際、以下はそのまま参照できる。

| 参照箇所 | 使い方 |
|---|---|
| PART 8: GRAMMAR_PATTERNS_C | 例文画像のシーン設計（`prompt_core`を参照） |
| PART 19: UNIFIED_CHAR_SYSTEM | 2人以上のキャラクターが登場する語彙・例文で使用 |
| テンプレートA〜T | vocab_typeに対応する視覚戦略を参照 |
| BUILDING_CUES辞書（GAS内） | 建物系語彙のプロンプト設計に参照 |
| PERSON_PROFILES辞書（GAS内） | 職業・人物系語彙のプロンプト設計に参照 |
| §5-B 固有名詞-地名5語の方針 | handoff_v4_7.mdに確定済み |

**ただしSTYLE_RECIPEはガイド内の記述を使わず、この資料の§4-2-①の確定版を使うこと。**

---

*作成：2026-05-18*
*根拠：マスタープロンプトガイドv2.6評価チャット（ChatGPT評価精査・パイプライン整理・v2.7方針策定）*
*次資料：handoff_v4_7.md（パイプライン全体の引き継ぎ）と併用すること*
