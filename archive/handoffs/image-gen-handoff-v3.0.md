# 引き継ぎ資料：画像生成ライン 完成版
**バージョン：image-gen-handoff-v3.0（2026-05-18）**
**前資料：image_gen_handoff_v2.md（2026-05-17）**
**スコープ：画像生成パイプライン確定 + master_prompt_design_guide v2.6 完成**

---

## ⛔ このドキュメントの編集ルール

| セクション | ルール |
|---|---|
| §2 完了した作業 | **追記のみ・削除禁止** |
| §4 プロンプトガイド v2.6 構成 | **追記のみ・削除禁止** |
| §5 設計決定の記録 | **追記のみ・削除禁止** |
| §7 GAS実装仕様 | **確定事項の追加のみ** |

---

## ⚠️ メインチャット統合時に最初にやること

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **v2.6 を1ファイルに統合** | v2_6.py + corrections + foundational → `v2_6_complete.py` を作成。詳細は §12。統合後にナレッジ登録。 |
| **②** | **Imagen 4 復帰テスト** | `generateImages.gs` のモデル名を `imagen-4.0-fast-generate-001` に変更 → `testSingleImage()` で1枚生成 → 成功確認 → タイマートリガー再設定（毎日午前9:00） |
| **③** | **GAS buildImagePrompt_() 拡張** | §7 の仕様に従い、新vocab_type（K〜T）と GRAMMAR_PATTERNS_C の分岐を追加 |
| **④** | **lesson_02 GAS投入** | `importFromLessonJson.gs` の `importByFileId()` 実行（handoff_v4_3.md の手順参照） |

> **アップロード必須ファイル（メインチャット統合時）：**
> - この資料（`image-gen-handoff-v3.0.md`）
> - `master_prompt_design_guide_v2_6.py`（2816行 / v2.6本体）
> - `master_prompt_design_guide_v2_6_corrections.py`（863行 / 修正・追加）
> - `master_prompt_design_guide_v2_6_foundational.py`（508行 / 横断的基盤原則）

---

## §1. このチャットの位置づけと作業範囲

```
【このチャット（画像生成専用ライン）で行った作業】

  Deep Research 4本の実施・受領
    ↓
  Research 結果の精査（3パス）
    ↓
  master_prompt_design_guide v2.6 作成（v2.5 の全面的拡張）
    ↓
  横断的矛盾の検出・解決

【この資料でカバーするスコープ】
  ✅ 画像生成API の確定方針
  ✅ master_prompt_design_guide v2.6 の全内容
  ✅ v2.5 → v2.6 で変わったこと・変わらないこと
  ✅ GAS buildImagePrompt_() の拡張仕様
  ✅ メインチャット統合時に必要な情報

【スコープ外（メインチャット側の handoff を参照）】
  ❌ lesson_NN.json 作成（SKILL_v1_6.md + handoff_v4_3.md）
  ❌ 音声生成パイプライン（handoff_v4_3.md）
  ❌ GASパイプライン全体の稼働状況（handoff_v4_3.md）
```

---

## §2. 完了した作業（このチャット全体）

### Deep Research 4本（受領・統合完了）

| プロンプト | 受領ファイル | カバー範囲 |
|---|---|---|
| ① L1〜L10 文法パターン別視覚化 | `日本語文法パターンの視覚化戦略_1_.docx` | 10文型の認知文法・フォース力学・tr/lm・ハイブリッドアーキテクチャ |
| ② 機能語・感動詞・副詞等 | `機能語の視覚化戦略_日本語教育_認知科学_デザイン.docx` | 代名詞・感動詞・定型表現・副詞4分類・助数詞 |
| ③ 時間・交通・家族・天気・感覚 | `日本語教材の視覚化戦略調査.docx` | 時間語彙・交通手段・家族（ウチ/ソト）・天気・感覚動詞 |
| ④ L11〜L22 複合文型 | `日本語文法パターンの視覚化戦略.docx` | 授受・比較・モダリティ・思考/発話引用・条件・経験・同時進行 |

### master_prompt_design_guide v2.6 作成（3パス精査）

| パス | 作業 | 結果 |
|---|---|---|
| Pass 1 | v2.6 本体作成 | テンプレートC'（42文型）・K〜T（新10カテゴリ）・UNIFIED_CHAR_SYSTEM |
| Pass 2 | 抜け・漏れ修正 | 矛盾5件修正・エントリ17件追加・視覚記号ライブラリ15件新設 |
| Pass 3 | 横断的基盤原則 | 矛盾1件（肌色）解決・基盤原則7件明文化 |

---

## §3. 画像生成パイプラインの確定方針

### ✅ 確定：Imagen 4 課金API を使用

```
generateImages.gs の変更点（1箇所のみ）
  変更前: MODEL: "imagen-4.0-generate-exp"
  変更後: MODEL: "imagen-4.0-fast-generate-001"  ← 推奨（$0.02/枚）
  または: MODEL: "imagen-4.0-generate-001"        ← Standard版
```

**判断根拠（Kaggle/FLUX を使わない理由）：**

| 問題 | 詳細 |
|---|---|
| 量産速度が致命的 | 1枚5分以上・週30h上限。375件で31時間超（GPU枠ほぼ全消費） |
| 画風問題が未解決 | simplevectorflux v2との相性・512→1024リサイズ品質劣化 |
| プロンプト非互換 | v2.5は Gemini/Imagen 向けに最適化。FLUX向け全面書き直しが必要 |

**Imagen 4 のコスト試算：**

| フェーズ | 枚数 | Imagen 4 Fast（$0.02/枚） |
|---|---|---|
| 現在のbacklog | 375枚 | $7.50 |
| N5全語彙 | 約800枚 | $16.00 |
| N5+N4 | 約2,300枚 | $46.00 |
| N5〜N3（辞書全体） | 約6,000枚 | $120.00 |

**スプレッドシートID：** `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk`

---

## §4. master_prompt_design_guide v2.6 の構成

### ファイル構成（3ファイル・ロード順）

```
ロード順（優先度 高 → 低）:

  1. master_prompt_design_guide_v2_5.py  ← 既存・変更なし（SSOT）
       STYLE_BIBLE・テンプレートA〜J・GEMINI_STABILIZATION 等

  2. master_prompt_design_guide_v2_6.py  ← 新規（v2.6本体）
       テンプレートC'・テンプレートK〜T・UNIFIED_CHAR_SYSTEM 等

  3. master_prompt_design_guide_v2_6_corrections.py  ← 修正・追加
       矛盾修正5件・抜け追加17件・視覚記号ライブラリ15件

  4. master_prompt_design_guide_v2_6_foundational.py  ← 横断基盤原則
       CHARACTER_RENDERING_POLICY 等・矛盾1件解決・原則7件

  矛盾時の優先順位: foundational > corrections > v2.6本体 > v2.5
```

### v2.5 から変わったこと（v2.6 の追加内容）

```
【PART 8】GRAMMAR_PATTERNS_C（テンプレートC' / 例文画像）
  v2.5: {SCENE_DESCRIPTION} を丸投げ
  v2.6: grammarConcept の値で42の文型別サブ戦略から自動選択

【PART 9〜13】テンプレートK〜O（機能語・新品詞系）
  K: pronoun（代名詞・9語）
  L: interjection（感動詞・7語）
  M: set_expression（定型表現・6場面）
  N: adverb（副詞・18エントリ / 4分類）
  O: counter（助数詞・8種）

【PART 14〜18】テンプレートP〜T（新語彙カテゴリ）
  P: time（時間語彙・9エントリ）
  Q: transportation（交通手段・11種）
  R: family（家族語彙・7エントリ / ウチ・ソト二重体系）
  S: weather（天気・自然現象・8エントリ）
  T: sensory（感覚語彙・7エントリ / 能動・受動分離）

【PART 19】UNIFIED_CHAR_SYSTEM（統一キャラクター色彩システム）
  私(Ego)=テイルブルー #008080 / 左固定
  他者(Soto)=オレンジ #FF8C00 / 右固定

【PART 20】QA_CHECKLIST_v2_6（新テンプレートK〜T対応）

【PART 21】HOW_TO_USE_v2_6（vocab_type → テンプレート A〜T 完全対応表）
```

### v2.5 から変わらないこと

```
STYLE_BIBLE（固定フレーズ・カラーパレット・焦点距離）← 変更厳禁
テンプレートA（person）
テンプレートB（building）
テンプレートD（concrete_object）
テンプレートE（variant_grid）
テンプレートF（spatial_relation）
テンプレートG（demonstrative_kosoado）
テンプレートH（action_verb）
テンプレートI（abstract_concept）
テンプレートJ（vocabulary_adjective）
GEMINI_STABILIZATION
```

---

## §5. 設計決定の記録（このチャットで確定）

| # | 決定内容 | 根拠 |
|---|---|---|
| **D-1** | 画像生成：Imagen 4 Fast API（$0.02/枚）を使用。Kaggle/FLUX は不採用。 | 量産速度・画風・プロンプト互換性の三重問題。詳細は §3。 |
| **D-2** | master_prompt_design_guide v2.6 を3ファイル構成で完成。 | Research 4本の統合・3パスの精査完了。 |
| **D-3** | カラーシステムを2層に分離。 | STYLE_BIBLE（語彙カード）と UNIFIED_CHAR_SYSTEM（例文）は排他適用。 |
| **D-4** | ゴールドカラーを分離。 | 語彙カードアクセント=#FAD141 / 文法信号・勝者・記憶スタンプ=#FFD700。 |
| **D-5** | 否定の3パターンを視覚的に分離。 | 〜ません=半透明シールド(#CC333350%) / 〜てはいけません=ISO赤円(100%) / 〜わけにはいかない=社会的引力線(#E05C2A70%)。 |
| **D-6** | 〜ています を3つの grammarConcept ID に分離。 | teimasu_progressive / teimasu_resultant_state / teimasu_habitual。 |
| **D-7** | キャラクター描画方針をvocab_type別に確定。 | person/building/family = 暖色肌（STYLE_BIBLE準拠）/ example_sentence/pronoun等 = グレー中立アバター（Research③準拠）。 |
| **D-8** | 疑問・未確定の記号色を Amber Yellow #FFC107 に統一。 | Soto（#FF8C00 オレンジ）との衝突を回避。 |
| **D-9** | 線種セマンティクスを全画像共通ルールとして確定。 | 実線=既知/存在、破線=未知/疑問/変化。 |
| **D-10** | 黄金分割レイアウト（20/60/20）を全カードの標準構図として採用。 | Research②の認知負荷最小化原則。 |
| **D-11** | お辞儀の角度規格を確定。 | 15°=挨拶 / 30°=丁寧 / 45°=謝罪・深い敬意。文化的誤解リスク管理。 |
| **D-12** | Trajector/Landmark プロファイリングを全文型の普遍原則として確定。 | 主格tr=3.5px太線+高彩度 / 参照点lm=1.5px細線+グレー60%。 |
| **D-13** | COSTAR構造化プロンプトを複雑文型の推奨フォーマットとして採用。 | Research④の推奨。GAS実装時のプロンプト品質安定化。 |
| **D-14** | 副詞カードにはアンカー（被修飾語）を必ず描画する。 | Research②の「副詞は単独で意味が完結しない」原則。 |
| **D-15** | 助数詞カードの黄金数を3〜4個に確定。オクルージョン禁止。 | Research②のサビタイジング原則。 |

---

## §6. テンプレートC' の詳細（最高優先）

テンプレートC（例文画像）は毎課必ず生成されるため最優先。

### grammarConcept → サブテンプレート 対応表（全42文型）

**L1〜L5 基本文型（GRAMMAR_PATTERNS_C に定義）:**

| grammarConcept | 文型 | uses_unified_char | hard_limit |
|---|---|---|---|
| `noun_predicate_affirmative` | NはNです（等号・定義） | ✗ | ✗ |
| `existence_location` | Nがあります・います | ✗ | ✗ |
| `noun_predicate_question` | 〜ですか | ✓ | ✗ |
| `noun_no_affiliation` | 〜の〜（所属） | ✗ | ✗ |
| `noun_no_possession` | 〜の〜（所有） | ✗ | ✗ |
| `interrogative_which` | どれ・どの+N | ✗ | ✗ |

**L5〜L10 拡張文型:**

| grammarConcept | 文型 | uses_unified_char | hard_limit |
|---|---|---|---|
| `comparison_yori` | AはBより〜（2者比較） | ✗ | ✗ |
| `superlative_ichiban` | 〜がいちばん（最上級） | ✗ | ✗ |
| `desire_tai` | 〜たい（欲求） | ✗ | ✗ |
| `potential_dekimasu` | 〜ができます（能力） | ✗ | ✗ |
| `progressive_teimasu` | 〜ています（進行中） | ✗ | ✗ |
| `progressive_state_teimasu` | 〜ています（結果状態） | ✗ | ✗ |
| `habitual_teimasu` | 〜ています（習慣・職業） | ✗ | ✗ |
| `request_tekudasai` | 〜てください | ✓ | ✗ |
| `negation_masen` | 〜ません（個人否定） | ✗ | ✗ |
| `benefactive_teageru` | 〜てあげます | ✓ | ✗ |
| `benefactive_temorau` | 〜てもらいます | ✓ | ✗ |
| `benefactive_tekureru` | 〜てくれます | ✓ | ✗ |

**L11〜L22 複合文型:**

| grammarConcept | 文型 | uses_unified_char | hard_limit |
|---|---|---|---|
| `sequential_te_form` | 〜て〜（連続動作） | ✗ | ✗ |
| `simultaneous_nagara` | 〜ながら | ✗ | ✗ |
| `modality_permission` | 〜てもいいです | ✗ | ✗ |
| `modality_prohibition` | 〜てはいけません | ✗ | ✗ |
| `modality_obligation` | 〜なければなりません | ✗ | ✗ |
| `modality_unnecessary` | 〜なくてもいいです | ✗ | ✗ |
| `quotation_to_omoimasu` | 〜と思います | ✗ | ✗ |
| `quotation_to_iimashita` | 〜と言いました | ✗ | ✗ |
| `hearsay_sou_desu` | 〜そうです（伝聞） | ✗ | ✗ |
| `uncertainty_kamoshiremasen` | 〜かもしれません | ✗ | ✗ |
| `inference_deshoo` | 〜でしょう（推量70%） | ✗ | ✗ |
| `experience_ta_koto_ga_aru` | 〜たことがあります | ✗ | ✗ |
| `advice_ta_hou_ga_ii` | 〜たほうがいいです | ✗ | ✗ |
| `condition_tara` | 〜たら | ✗ | ✗ |
| `condition_ba` | 〜ば | ✗ | ✗ |
| `condition_nara` | 〜なら | ✓ | ✗ |

**HARD_LIMIT（2コマ/3コマ救済設計が必要）:**

| grammarConcept | 文型 | 救済レイアウト |
|---|---|---|
| `regret_teshimaimashita` | 〜てしまいました | 2コマ（驚き+後悔） |
| `expectation_hazu_desu` | 〜はずです | 証拠提示+予測対比 |
| `attempt_temimasu` | 〜てみます | 3ステップ小画面並置 |
| `social_constraint_wakeni` | 〜わけにはいかない | 意志ベクトル+社会的引力 |

---

## §7. GAS buildImagePrompt_() 拡張仕様

### switch-case に追加する分岐

```javascript
// generateImages.gs の buildImagePrompt_() 関数を以下のように拡張する

function buildImagePrompt_(row) {
  const vt = (row.vocabType || "other").toLowerCase();

  switch (vt) {
    // ─── v2.5 から継続（変更なし）───
    case "person":           return buildPersonPrompt_(row.word, row.en);
    case "building":         return buildBuildingPrompt_(row.word, row.en);
    case "concrete_object":  return buildConcreteObjectPrompt_(row.word, row.en);
    case "action_verb":      return buildActionVerbPrompt_(row.word, row.en);
    case "adjective":        return buildAdjectivePrompt_(row.word, row.en);
    case "abstract_concept": return buildAbstractConceptPrompt_(row.word, row.en);
    case "spatial_relation": return buildSpatialRelationPrompt_(row.word, row.en);
    case "demonstrative":    return buildDemonstrativePrompt_(row.word, row.en);

    // ─── v2.6 新規（テンプレートK〜T）───
    case "pronoun":          return buildPronounPrompt_(row.word, row.en);
    case "interjection":     return buildInterjectionPrompt_(row.word, row.en);
    case "set_expression":   return buildSetExpressionPrompt_(row.word, row.en);
    case "adverb":           return buildAdverbPrompt_(row.word, row.en, row.adverbType);
    case "counter":          return buildCounterPrompt_(row.word, row.en);
    case "time":             return buildTimePrompt_(row.word, row.en, row.timeSubtype);
    case "transportation":   return buildTransportPrompt_(row.word, row.en);
    case "family":           return buildFamilyPrompt_(row.word, row.en, row.familyForm);
    case "weather":          return buildWeatherPrompt_(row.word, row.en, row.pos);
    case "sensory":          return buildSensoryPrompt_(row.word, row.en, row.perceptionType);

    // ─── テンプレートC'（例文画像・v2.6 で大幅拡張）───
    case "example_sentence": return buildExampleSentencePrompt_(row);
      // 内部で row.grammarConcept → GRAMMAR_PATTERNS_C のキーを参照
      // HARD_LIMIT フラグで 2コマ/3コマレイアウトに自動切替

    default:                 return buildDefaultPrompt_(row.word, row.en);
  }
}
```

### buildExampleSentencePrompt_() の内部ロジック

```javascript
function buildExampleSentencePrompt_(row) {
  const concept = row.grammarConcept || "default";

  // COSTAR 構造でプロンプトを組み立てる（master_prompt_design_guide_v2_6.py 参照）
  const styleBlock  = STYLE_BIBLE_CORE;           // 最先端に配置
  const trLmBlock   = getTrLmProfiling_(concept);  // TRAJECTOR_LANDMARK_PROFILING
  const charBlock   = row.usesUnifiedChar          // UNIFIED_CHAR_SYSTEM
                      ? UNIFIED_CHAR_BLOCK
                      : CHARACTER_RENDERING_POLICY.neutral_avatar;
  const sceneBlock  = GRAMMAR_PATTERNS_C[concept]?.visual_strategy?.prompt_core
                      || GRAMMAR_PATTERNS_C_ADDITIONS[concept]?.visual_strategy?.prompt_core
                      || DEFAULT_SCENE_BLOCK;
  const colorBlock  = getRelevantColors_(concept); // SEMANTIC_COLOR_UNIFIED.master_color_table

  return [styleBlock, charBlock, trLmBlock, sceneBlock, colorBlock].join(" ");
}
```

### Vocabulary シートの補助列（新規追加推奨）

| 列名 | 型 | 値の例 | 適用 vocab_type |
|---|---|---|---|
| `grammarConcept` | string | `benefactive_teageru` | example_sentence |
| `familyForm` | string | `uchi` / `soto` | family |
| `perceptionType` | string | `active` / `passive` / `emission` | sensory |
| `adverbType` | string | `degree` / `frequency` / `manner` / `temporal` | adverb |
| `timeSubtype` | string | `clock` / `weekday` / `relative` 等 | time |

---

## §8. 横断的設計原則の一覧（foundational ファイルで定義）

### 原則1: キャラクター描画方針（CHARACTER_RENDERING_POLICY）

| vocab_type | 描画方針 |
|---|---|
| person, building, family | **暖色肌**（STYLE_BIBLE: "Naturally warm medium skin tone"） |
| example_sentence, pronoun, interjection, set_expression, adverb, sensory | **グレー中立アバター**（#D3D3D3 / ジェンダーニュートラル） |
| その他 | 人物が脇役なら中立アバター、主役なら暖色肌 |

### 原則2: Trajector/Landmark プロファイリング（全文型共通）

```
主格(tr): 輪郭線 3.5px BOLD + ビビッドな原色
参照点(lm): 輪郭線 1.5px THIN + 彩度を落とした無彩色(60%不透明度)
```

### 原則3: 線種セマンティクス（全画像共通）

```
実線(Solid) = 存在する既知の物質・確定した事実
破線(Dashed) = 未知・疑問・不確実・変化のプロセス・仮定
```

### 原則4: 統合セマンティックカラー表（SEMANTIC_COLOR_UNIFIED）

| 色名 | HEX | 用途 |
|---|---|---|
| Teal Blue | #008080 | 私(Ego)シャツ・あげます矢印 |
| Warm Orange | #FF8C00 | 他者(Soto)シャツ・くれます矢印・たら因果矢印 |
| ISO Green | #009B48 | 許可・進行・推奨・✓ |
| ISO Red | #D81E05 | ISO禁止円・警告・✗（不透明100%） |
| Dusky Red | #CC3333 | 個人否定シールド（半透明50%） |
| ISO Blue | #002FA7 | 義務・指示 |
| Amber Yellow | #FFC107 | 疑問・未確定の記号（Soto オレンジと弁別） |
| Slate Gray | #708090 | 背景・比較基準・不活性 |
| Pure Gold | #FFD700 | 勝者・記憶スタンプ・今日・ハイライト月（例文カード用） |
| Amber Gold | #FAD141 | 語彙カードのアクセントのみ（STYLE_BIBLE準拠） |
| Warm Red | #E05C2A | 社会的規範の引き戻し（70%不透明度） |

### 原則5: 黄金分割レイアウト（全カード共通構図）

```
上部 20%: コンテキスト記号（太陽・カレンダー・発話バブル・確信度メーター）
中央 60%: メインアクター・主体物（tr を最大コントラストで配置）
下部 20%: 修飾インジケータ（タイムライン・程度スケール・before/after）
```

### 原則6: ユニバーサル vs 文化依存記号

```
ユニバーサル（自由使用）:
  矢印・基本表情・？！・スケールバー

文化依存（パラメータ制御必須）:
  お辞儀 → 15°=挨拶 / 30°=丁寧 / 45°=謝罪・深い敬意
  いただきます合掌 → 必ず眼前に和食セットを配置して文脈固定
  鼻を指す「わたし」 → 自己参照矢印を必ず重畳
  ×マーク → 必ず色情報（赤）と併用（欧米圏の ✓ との混同回避）
```

### 原則7: COSTAR 構造化プロンプト（複雑文型の推奨構造）

```
[Context]   → 教育目的・対象者
[Objective] → 視覚化する文法パターン名
[Style]     → フラットベクター制約（最先端に配置・スタイルファースト原則）
[Layout]    → tr/lm 配置 + 黄金分割 + 線種セマンティクス
[Scene]     → GRAMMAR_PATTERNS_C の prompt_core を埋め込む
[Color]     → SEMANTIC_COLOR_UNIFIED から該当色のみ抽出
```

---

## §9. vocab_type → テンプレート 完全対応表

| vocab_type | テンプレート | バージョン | 定義ファイル |
|---|---|---|---|
| person | A | v2.5 | v2_5.py |
| building | B | v2.5 | v2_5.py |
| example_sentence | C'（grammarConcept で分岐） | v2.6 | v2_6.py + corrections |
| concrete_object | D | v2.5 | v2_5.py |
| variant_grid | E | v2.5 | v2_5.py |
| spatial_relation | F | v2.5 | v2_5.py |
| demonstrative | G | v2.5 | v2_5.py |
| action_verb | H | v2.5 | v2_5.py |
| abstract_concept | I | v2.5 | v2_5.py |
| adjective | J | v2.5 | v2_5.py |
| pronoun | K | v2.6 NEW | v2_6.py |
| interjection | L | v2.6 NEW | v2_6.py |
| set_expression | M | v2.6 NEW | v2_6.py |
| adverb | N | v2.6 NEW | v2_6.py + corrections |
| counter | O | v2.6 NEW | v2_6.py + corrections |
| time | P | v2.6 NEW | v2_6.py |
| transportation | Q | v2.6 NEW | v2_6.py |
| family | R | v2.6 NEW | v2_6.py + corrections |
| weather | S | v2.6 NEW | v2_6.py |
| sensory | T | v2.6 NEW | v2_6.py |

---

## §10. 視覚記号ライブラリ（VISUAL_SYMBOL_LIBRARY）の要約

corrections ファイルで定義した15記号。**Anti-Confusion Table** を参照することで混同を防ぐ。

| 記号 | 形状 | 色 | 文法 |
|---|---|---|---|
| 中空ダブルライン矢印 | 2重境界線の太い矢印 | テイルブルー or オレンジ | 授受（あげます/もらいます/くれます） |
| ISO禁止リング | 45°斜線付き外円 | ISO Red 100% | 〜てはいけません |
| 半透明拒絶シールド | 45°傾き半透明プレート | Dusky Red 50% | 〜ません |
| ISOソリッドサークル | 完全円+白ピクト | ISO Blue | 〜なければなりません |
| ダッシュ円+バイパス矢印 | 破線円+迂回矢印 | Gray/ISO Green | 〜なくてもいいです |
| 実線許可フレーム | 実線正方形+✓ | ISO Green | 〜てもいいです |
| 思考バブル | スカラップ外輪+3トレイル | 通常outline | 〜と思います・〜たい |
| 発話バブル | 楕円+鋭角テール | 通常outline | 〜と言いました |
| 破線バブル | 粗い破線角丸 | Slate Gray | 〜かもしれません |
| 二重レイヤーバブル | 2重楕円（外50%opacity） | Slate Gray | 〜そうです（伝聞） |
| 確信度メーターバー | 縦段階スケール4〜5段 | Gray→Cyan→Gold | モダリティ全般 |
| Y型分岐ゲート | 二股矢印フロー | Green/Gray | 〜ば |
| ブロック矢印 | ソリッド極太矢印 | Neon Orange | 〜たら |
| 記憶の閃光スタンプ | 放射8本アスタリスク | Gold #FFD700 | 〜たことがあります |
| アンカー&ピン | 錨+地図ピン | Red pin/Teal anchor | 〜に住んでいます |

**混同しやすいペア（Anti-Confusion Table）:**
- 拒絶シールド vs ISO禁止円 → 半透明50% vs 100%不透明
- 思考バブル vs 発話バブル → スカラップ3トレイル vs 楕円鋭角テール
- 破線バブル vs 通常バブル → 粗い破線 vs 実線
- Y型分岐 vs ブロック矢印 → 〜ば（論理条件）vs 〜たら（時系列）
- ISOソリッド円 vs 社会的引力線 → 外部ルール vs 内的規範

---

## §11. メインチャットへの統合指示

### handoff_v4_x.md に追記すべき内容

```
§13（画像生成ライン確定事項）に以下を追記:

  ✅ master_prompt_design_guide v2.6 完成（2026-05-18）
     - 3ファイル構成（v2_6.py / v2_6_corrections.py / v2_6_foundational.py）
     - テンプレート A〜T 完全カバー（v2.5 の A〜J に加え K〜T を新設）
     - テンプレートC' 42文型（L1〜L22）の文法パターン別サブ戦略
     - 横断的基盤原則 7件（CHARACTER_RENDERING_POLICY 等）
     - 詳細は image-gen-handoff-v3.0.md 参照

§5（課題ライフサイクル）に以下を追記:
  ✅ master_prompt_design_guide v2.5 → v2.6 改訂完了
  🔴 generateImages.gs の buildImagePrompt_() 拡張（§7 参照）
  🔴 Vocabulary シートへの補助列追加（grammarConcept/familyForm等）

§9（ロードマップ）に以下を追記:
  ✅ Deep Research 4本の実施・統合完了（2026-05-18）
  ✅ master_prompt_design_guide v2.6 完成
  → GAS buildImagePrompt_() 拡張
  → Imagen 4 復帰テスト + タイマートリガー再設定
```

### 注意事項

```
⚠️ v2.5 の STYLE_BIBLE は一切変更しない（変更厳禁の固定フレーズ）。
⚠️ v2.6 は v2.5 への追補。v2.5 を削除・置換しない。
⚠️ 3ファイルのロード順と優先順位を維持する:
   foundational > corrections > v2.6本体 > v2.5
⚠️ GRAMMAR_PATTERNS_C の grammarConcept キーは lesson_NN.json の
   grammarConcept フィールドと必ず一致させること。
```

---

## §12. 残タスク（このチャット以降）

### ⚠️ 次チャットで最初にやること（必須）

**v2.6 の3ファイルを1ファイルに統合する。**

現状、v2.6 は作業プロセスの都合で3ファイルに分かれているが、
プロンプト生成のたびに4ファイル（v2.5 + v2.6 x3）を参照するのは非現実的。
次チャットの冒頭で v2.6 の3ファイルを1つに統合し、
**「v2.5（不変）+ v2.6_complete（統合版）」の2ファイル構成にする。**

```
【統合後の構成】
  master_prompt_design_guide_v2_5.py    ← そのまま維持（変更なし）
  master_prompt_design_guide_v2_6_complete.py  ← 新規作成（以下3つを統合）
      = v2.6本体（テンプレートK〜T・C'）
      + corrections（修正・追加エントリ）
      + foundational（横断的基盤原則）
```

統合完了後にプロジェクトナレッジへ登録する。

---

### 全残タスク一覧

| タスク | 優先度 | 担当 | 内容 |
|---|---|---|---|
| **v2.6 の3ファイルを1ファイルに統合** | **最高（次チャット冒頭）** | Claude | v2_6.py + corrections + foundational → `v2_6_complete.py` に統合 |
| v2.6_complete をナレッジに登録 | **最高（統合直後）** | ユーザー | v2.5 と v2.6_complete の2ファイル構成でナレッジ更新 |
| Imagen 4 復帰テスト | **高** | メインチャット | モデル名変更 → 1枚テスト → タイマー再設定 |
| GAS buildImagePrompt_() 拡張 | **高** | メインチャット | §7 の switch-case を追加。全新 vocab_type に対応。 |
| Vocabulary シート補助列追加 | **高** | メインチャット | grammarConcept / familyForm / perceptionType / adverbType / timeSubtype |
| classifyAndTranslate.gs 更新 | 中 | メインチャット | 新 vocab_type を自動分類するロジックを追加 |
| 画風QAテスト | 中 | ユーザー | lesson_01 の数語で実際に生成し、v2.6 のテンプレートが正しく機能するか確認 |

---

## §13. クレジット表記（辞書サイト掲載用）

```
Images generated with Imagen 4 by Google (commercial license)
Language learning visual system designed using:
  - Cognitive Grammar theory (Langacker 2008)
  - Force Dynamics semantics (Talmy 2000)
  - Mayer's Multimedia Learning Principles (2009, 2026)
  - ISO 7001/7010 pictogram standards
  - JIS Z 8210 / JIS T 8005 guidelines
```

---

*作成日：2026-05-18*
*スコープ：画像生成ライン完成版（プロンプトガイドv2.6・設計原則・GAS拡張仕様）*
*前資料：image_gen_handoff_v2.md（2026-05-17）*
*メインチャット統合先：handoff_v4_x.md の §13・§14 に統合*
