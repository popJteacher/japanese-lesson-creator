# プロンプトガイド レビュー・方針整理 引き継ぎ資料
**作成日：2026-05-18（v1.0）→ 更新：2026-05-18（v2.0）→ 更新：2026-05-18（v3.0）→ 更新：2026-05-18（v4.0）→ 更新：2026-05-18（v4.1）**
**対象チャット（v1.0）：マスタープロンプトガイドv2.6評価・パイプライン現状整理・v2.7方針策定**
**対象チャット（v2.0）：v2.7作成・横断精査・8問題修正**
**対象チャット（v3.0）：他AIによるv2.7評価の精査・v2.8作成（問題修正＋実務ルール補完＋横断精査）**
**対象チャット（v4.0）：Claudeによるv2.8独立評価・v2.9作成（5問題修正＋横断精査10問題追加修正）**
**対象チャット（v4.1）：例文画像フェーズの課題整理・Goi_Listテスト生成の方針追加**
**前提資料：handoff_v4_7.md / master_prompt_design_guide_v2_8.py / master_prompt_design_guide_v2_9.py**

---

## ⚠️ この資料の位置づけ

この資料は **handoff_v4_7.md への追記ではない**。
プロンプトガイドのレビューと方針整理を記録するための独立した資料である。

- v1.0：ChatGPT評価の精査・パイプライン現状整理・v2.7方針策定
- v2.0：v2.7作成・横断精査・8問題修正
- v3.0：他AIによるv2.7評価2件の精査・v2.8作成（13問題修正＋実務ルール5種補完＋横断精査で4問題追加修正）
- **v4.0（本更新）：Claudeによるv2.8独立評価・v2.9作成（5問題修正＋横断精査15問題修正）**

次チャットで **v2.9 を他AIに再評価させる**際は、この資料と
`master_prompt_design_guide_v2_9.py` を両方アップロードしてこの資料を最初に読むこと。

---

## §0. 最新状況サマリー（v4.0時点・最重要）

```
現行ファイル : master_prompt_design_guide_v2_9.py（2383行・Python syntax VALID）
GRAMMAR_PATTERNS_C : 41エントリで確定（変更なし）
ステータス : 他AI再評価待ち（次チャット）
次の作業 : v2.9 を他AIに評価させる → 結果を踏まえ追加修正 → lesson_01/02 S列生成
```

**v2.8 → v2.9 で実施したこと（2フェーズ）：**

1. **問題修正フェーズ（5問題）**：Claudeによるv2.8独立評価で検出した問題を修正
2. **横断精査フェーズ（10問題）**：v2.9全体を機械検証し、追加問題を発見・修正

---

## §1. Claudeによるv2.8評価の精査結果（v4.0新規）

v2.8 を Claude（Sonnet 4.6）が独立評価した。他AI2件の評価との比較。

### 1-1. Claudeのスコア評価

```
Claudeがプロンプトを書くための仕様書として : 89 / 100（他AI: 88）
Gemini画像生成の安定化ガイドとして         : 82 / 100（他AI: 80）
教材画像システム全体のマスターガイドとして  : 77 / 100（他AI: 76）
```

他AIと概ね一致。GeminiとシステムガイドはClaudeが若干高く評価（理由：QA/再生成ルールの網羅性と固定コスト設計の堅牢性を評価した）。

### 1-2. 他AI評価に対するClaudeの精査判断

| 他AI指摘 | Claudeの判断 | 理由 |
|---|---|---|
| A〜J v2.5依存が最大弱点 | ✅ 同意（優先度低） | handoff §5-1で意図的見送りが確認済み。方針変更不要 |
| hex値問題（SEMANTIC_COLOR_UNIFIED） | ✅ 同意（低リスク） | §0-A検証が機能すれば出力には混入しない |
| STYLE_RECIPE_COMPACT最優先 | ⚠️ 部分同意 | 有用だが優先度は中程度。§0-Cの計測基準未定義の方が即時リスク大 |
| generation_risk フィールド追加 | ⚠️ 優先度誇張 | §6-B PASS/FAIL と §7 REGENERATION_RULES で機能的に同等 |
| 回帰テストセット作成 | ✅ 有用だがスコープ外 | GASパイプライン側で管理すべき。v2.9本体への混入は責務混濁 |

### 1-3. Claudeが他AI・自己評価では未発見だった問題（新規発見・v4.0核心）

| 問題 | 重大度 | 内容 |
|---|---|---|
| §0-C 計測基準の欠落 | 🟡 | 語数上限が「prompt_core単体」か「完成プロンプト全体」か不明。STYLE_RECIPE≒91語・TEXT_POLICY≒30語の固定コスト込みでは「80-130w」が成立しない |
| CONTRAST_PAIRS の {OBJECT} | 🟡 | `motsu_vs_aru` に `{OBJECT}` プレースホルダーが残存。§0-A PLACEHOLDER_VALIDATION の誤検出を引き起こす |
| vocab_type 曖昧語彙の固定ルール欠落 | 🟡 | `いつ`（pronoun/time）・`どのくらい`（pronoun/adverb）・`ある/いる`（concrete_object/example_sentence）のvocab_type割当がレッスン間でブレるリスク |
| QA_PASS_CRITERIA の例文専用基準の誤適用 | 🟢 | リスト構造上、語彙カード処理時にEgo/Soto配置・矢印方向基準が全件適用される |
| v2.5同時アップロード要件の未明記 | 🟢 | A〜J生成開始後にv2.5がないと処理が途中停止するが、その要件が仕様書に明記されていなかった |

---

## §2. v2.9で修正した全問題リスト（v4.0新規）

### 2-1. 問題修正フェーズ（5件）

Claudeによるv2.8評価で発見した問題を修正。

| # | 重大度 | 問題 | 修正内容 |
|---|---|---|---|
| 1 | 🟡 | §0-C PROMPT_LENGTH_POLICY に計測基準がなく、語数の対象範囲が不明 | 「prompt_core単体」であることを明記。固定コスト（STYLE_RECIPE≒91語・肌色≒7語・TEXT_POLICY≒30語、合計≒128-130語）を表で明示。語数上限を実態に合わせ改訂（語彙カード: 80-130→50-80w、例文1シーン: 120-180→80-120w、複数コマ: 180-230→120-150w） |
| 2 | 🟡 | CONTRAST_PAIRS `motsu_vs_aru` に `{OBJECT}` プレースホルダー残存 | `"a tangible object (e.g. a cup, bag, or tool)"` に具体化 |
| 3 | 🟡 | §0-D VISUAL_CANON_RULE に vocab_type が曖昧な語彙の固定ルールがない | `いつ`・`どのくらい`・`ある/いる` の3ケースにvocab_type固定ルールを追記 |
| 4 | 🟢 | QA_PASS_CRITERIA にUNIVERSAL/EXAMPLE_ONLY の区分がなく語彙カードに例文専用基準が誤適用される | `QA_PASS_CRITERIA_UNIVERSAL`・`QA_PASS_CRITERIA_EXAMPLE_ONLY` に分割。同様に `QA_FAIL_CRITERIA` も分割。後方互換のため結合リストも維持 |
| 5 | 🟢 | A〜J使用時にv2.5同時アップロードが必要だが仕様書に記載なし | ヘッダー（L39）と§4冒頭（L801）の2箇所に「v2.5 なしでは処理を中断し追加を要求すること」を明記 |

### 2-2. 横断精査フェーズ（10件）

v2.9全体の機械検証で追加発見した問題を修正。

| # | 重大度 | 問題 | 修正内容 |
|---|---|---|---|
| 6  | 🔴 | ヘッダーL43「v2.9以降で対応予定」がv2.9ファイル自身に記載 | 「v3.0以降で対応予定」に修正 |
| 7  | 🔴 | フッターL2374「v2.8 では参照のみ」がv2.9ファイルに残存 | 「v2.9 では参照のみ」に修正 |
| 8  | 🔴 | `inference_deshoo` の `solid cyan` がSTYLE_RECIPEパレット外色 | `warm amber gold` に修正 |
| 9  | 🔴 | `TIME_FRAMES jikan_clock` の `bold cyan or red` も同様にパレット外 | `bold warm amber gold or ISO red` に修正 |
| 10 | 🟡 | §0-B Step4の「手順1を参照」「手順2を参照」の参照先が§0本文に存在しない（ラベルなし） | §0本文の「■ K〜T」「■ A〜J」ブロックに **【手順1】【手順2】** ラベルを追加。Step4・§4冒頭・§4完成例・フッターの計4箇所を「§0 の【手順1/2】」形式に統一 |
| 11 | 🟡 | `request_tekudasai` の `{TARGET_LOCATION/ACTION}` スラッシュプレースホルダー | `{TARGET_LOCATION}` に正規化 |
| 12 | 🟡 | `desire_tai` の `{DESIRED_OBJECT/ACTION}` スラッシュプレースホルダー | `{DESIRED_OBJECT_OR_ACTION}` に正規化 |
| 13 | 🟡 | `comparison_ichiban` の `#1 gold badge icon` がTEXT_POLICY_B下で数字出力リスク | `first-place crown icon (no numerals or text labels)` に変更 |
| 14 | 🟡 | `modality_unnecessary` の `'0%' badge` が同様に数字出力リスク | `empty meter bar with a red ✗ overlay` に変更 |
| 15 | 🟢 | QA_CHECKLISTとフッター手順5の語数チェック文言に「prompt_core」明記なし | 「prompt_coreの語数（固定コスト除く）」に明記 |

**#8・#9が特に重要**：`cyan` はSTYLE_RECIPEに存在しないパレット外色であり、Geminiが指定色通りに描画した場合、パレット非準拠画像が量産される。横断精査をしなければS列生成時に全件パレット違反が発生していた。

---

## §3. v2.9の構造（v4.0新規）

```
§0   このガイドの使い方（Claudeへの指示）
  §0-A PLACEHOLDER_VALIDATION   ← v2.8新設（出力前セルフチェック5項目）
  §0-B CLAUDE_DECISION_FLOW     ← v2.8新設（迷い時の優先ルール5ステップ）
       ■【手順1】K〜T節          ← v2.9でラベル追加
       ■【手順2】A〜J節          ← v2.9でラベル追加
  §0-C PROMPT_LENGTH_POLICY     ← v2.8新設・v2.9で計測基準と語数上限を改訂
  §0-D VISUAL_CANON_RULE        ← v2.8新設・v2.9でvocab_type曖昧語彙ルール追記
§1   変更禁止の基本設定（STYLE_RECIPE / TEXT_POLICY_A/B/C / アスペクト比）
§2   キャラクター・カラーシステム
  2-1 UNIFIED_CHAR_SYSTEM（hex値あり＝内部参照のみ）
  2-2 SEMANTIC_COLOR_UNIFIED（hex値あり＝内部参照のみ）
  2-3 CHARACTER_RENDERING_POLICY（hex削除・skin_prompt_phrase方式）
§3   FOUNDATIONAL原則
  3-1〜3-5（v2.7から維持）
  3-6 CONTRAST_PAIRS            ← v2.8新設・v2.9で{OBJECT}プレースホルダー修正
§4   テンプレートA〜T（A〜Jはv2.5参照／K〜Tは本体定義）
     ← v2.9でv2.5同時アップロード必須を2箇所明記
§5   GRAMMAR_PATTERNS_C（41エントリ確定・16:9）
     ← v2.9でスラッシュPH・数字記号・パレット外色を修正
§6   QAチェックリスト
  §6-B QA_PASS/FAIL_CRITERIA    ← v2.8新設・v2.9でUNIVERSAL/EXAMPLE_ONLY分割
§7   REGENERATION_RULES         ← v2.8新設・v2.9でprompt_core語数参照に更新
```

---

## §4. 横断精査でクリーンと確認した項目（v4.0新規）

次の他AI評価で「これは既に確認済み」と伝えられる項目。

```
✅ Python syntax VALID（2383行）
✅ GRAMMAR_PATTERNS_C : 実41 = 表記41（一致・補完不要で確定）
✅ TEXT_POLICY A/B/C  : §1-2定義 ⇔ §4対応表 完全一致
✅ QA_PASS_CRITERIA_UNIVERSAL / EXAMPLE_ONLY : 正確に分割済み
✅ QA_FAIL_CRITERIA_UNIVERSAL / EXAMPLE_ONLY : 正確に分割済み
✅ 後方互換リスト（QA_PASS_CRITERIA / QA_FAIL_CRITERIA）: 維持済み
✅ スラッシュプレースホルダー : ゼロ（全2件を正規化済み）
✅ パレット外色名（cyan等）: ゼロ（全2件をwarm amber gold / ISO redに修正済み）
✅ prompt_core内のhex値 : ゼロ（§0-A検証で保護）
✅ CONTRAST_PAIRS の {OBJECT} : 削除済み（具体的な記述に置換）
✅ SET_EXPR_CULTURAL_NOTES : 定義済み（v2.8対応）
✅ REGENERATION_RULES ⇔ QA_FAIL_CRITERIA : 全FAIL条件に対応策あり
✅ フッター手順サマリー ⇔ 実セクション : 参照整合（手順1/2ラベルも一致）
✅ バージョン表記 : ヘッダー・フッター・変更概要すべてv2.9で統一
```

---

## §5. v2.9に残存する既知事項（v4.0新規・他AI評価時の論点）

### 5-1. 意図的に残している（再指摘されても方針は変えない）

| 事項 | 理由 |
|---|---|
| テンプレートA〜J本体がv2.5参照（単体完結未達） | A〜J重複回避のため意図的見送り。v3.0以降の課題 |
| UNIFIED_CHAR_SYSTEM/SEMANTIC_COLOR_UNIFIEDにhex値 | 内部参照辞書。prompt_coreは色名使用済み。§0-A検証で出力時に保護 |
| §0-A/B/C/D がコメント記述・他はPython辞書 | 「Claudeへの指示＝散文」「参照データ＝辞書」の意図的使い分け |
| existence_location の構造的style例外 | flat ring化＋例外注記で対応。完全解消ではなくClaude個別判断を残す設計 |
| certainty meter の XX% 表記が複数残存 | Geminiへの「充填量の指示」として機能する記述（例: `certainty meter at 70-80%`）。数字を画像に描かせる意図はなく、メーターの充填率を指定するもの。TEXT_POLICY_B が許可する `abstract meters` の範囲内と判断して許容 |

### 5-2. 軽微・化粧上の未対応（優先度低）

| 事項 | 状態 |
|---|---|
| 見出し記法の不統一（`## §0-A.` vs `## 2-3.`） | 機能影響なし。修正リスク＞便益のため見送り |

### 5-3. 他AI評価で確認してほしい観点（重点チェック依頼）

次チャットで他AIに評価させる際、以下を重点的に見てもらう：

```
1. §0-C PROMPT_LENGTH_POLICY の改訂後語数上限（prompt_core 50-80w）が
   実際のK〜Tテンプレートで達成可能か（例: SENSORYやFAMILYの複雑なエントリで足りるか）

2. 新設した横断精査修正（#6〜#15）に既存テンプレートとの矛盾や
   Claudeが誤読する曖昧さがないか

3. REGENERATION_RULES の7パターンが例文画像固有の失敗を網羅しているか
   （特に: 授受表現で矢印方向は正しいが受益者と物の移動が混同されるケース、
    〜たら/〜ばのコマ割りはされているが分岐方向が逆になるケース）

4. CONTRAST_PAIRS 8組以外に、lesson_01/02 の語彙で混同しやすいペアがないか
   （lesson_01/02の語彙リストはlesson_01_v1_1.json / lesson_02_v2_11_11.json を参照）

5. v2.9の修正で GRAMMAR_PATTERNS_C 内の各エントリとの一貫性が保たれているか
   （特にinference_deshoo の certainty meter 色変更が他の推量系エントリと統一されているか）
```

---

## §6. パイプライン現状（v4.7時点・v3.0から変更なし）

参考のため再掲。詳細は handoff_v4_7.md を参照。

| 対象 | 状態 |
|---|---|
| 語彙カード生成（Vocabularyシート） | ✅ S列参照・Imagen呼び出し・Drive保存・レジストリ更新すべて実装済み |
| 例文画像生成（Examplesシート） | ❌ GAS関数なし・imagePrompt列もなし（語彙完了後に着手） |
| S列プロンプトの内容 | ⚠️ lesson_01/02・N5全412語 すべて未生成 |

**現在のボトルネック（優先順位順）：**

```
最高 : lesson_01・02（35語）のS列プロンプト生成（v2.9評価完了後に着手）
高   : N5全412語のS列プロンプト生成（50語単位）
中   : generateImageBatch()実行（S列投入完了後）
中   : ExamplesシートのimagePrompt列追加 + GAS拡張（語彙完了後）
```

---

## §7. 次チャットの作業順序（v4.1更新済み）

```
✅ ① v1.0 資料作成（v2.6評価チャット）
✅ ② v2.7 作成（v2.7作成チャット）
✅ ③ v2.7 横断精査・8問題修正（v2.7作成チャット）
✅ ④ 他AIによるv2.7評価2件の精査（v2.8作成チャット）
✅ ⑤ v2.8 作成：13問題修正＋実務ルール5種補完（v2.8作成チャット）
✅ ⑥ v2.8 横断精査：4問題追加発見・修正（v2.8作成チャット）
✅ ⑦ Claudeによるv2.8独立評価（v2.9作成チャット）
✅ ⑧ v2.9 作成：5問題修正（v2.9作成チャット）
✅ ⑨ v2.9 横断精査：10問題追加発見・修正（v2.9作成チャット）
⬜ ⑩ 他AIによるv2.9評価 ← 別途実施予定
⬜ ⑪ 評価結果を踏まえた追加修正があれば実施
⬜ ⑫ Goi_Listから多様な種類の単語をセレクトしてテスト画像生成 ← 次チャット
⬜ ⑬ テスト結果を踏まえたガイド修正（必要に応じて）
⬜ ⑭ lesson_01（17語）・lesson_02（18語）のvocab_type一覧確認
⬜ ⑮ §4対応表でテンプレート選択 → S列プロンプトをJSON形式で生成
⬜ ⑯ importImagePromptsFromJson() でS列に投入
⬜ ⑰ generateImageBatch() 実行
```

### 7-1. 他AI評価チャットに渡すファイル

```
- master_prompt_design_guide_v2_9.py（v2.9作成チャットで作成）
- prompt_guide_review_handoff_v4.md（この資料・変更経緯と既知事項の参照用）
```

### 7-2. ⑫ Goi_Listテスト画像生成チャットの進め方

**目的：** v2.9ガイドを使って実際に画像プロンプトを生成し、様々なvocab_typeで品質を確認する。
lesson_01/02のS列プロンプト本番投入前に、ガイドの設計上の問題点を実生成で検出する。

**テスト対象の選び方：**

各vocab_typeを最低1語ずつカバーするよう、Goi_List（N5語彙）から語彙を選定する。
以下を参考にテンプレートの多様性を確保すること。

| 優先度 | vocab_type | 理由 |
|---|---|---|
| 🔴 必須 | person | lesson_01/02で最多使用 |
| 🔴 必須 | concrete_object | 最も量が多い汎用型 |
| 🔴 必須 | action_verb | 矢印・motion line の描画を確認 |
| 🔴 必須 | adjective | CONTRAST設計（2物体並置）を確認 |
| 🟡 推奨 | building | BUILDING_CUES 3アンカーの機能確認 |
| 🟡 推奨 | family | ウチ/ソト構図の分岐を確認 |
| 🟡 推奨 | time | TEXT_POLICY_Cと時計盤の処理を確認 |
| 🟡 推奨 | counter | サビタイジングレイアウトを確認 |
| 🟡 推奨 | adverb | ADVERB_ANCHOR_PRINCIPLE（アンカー物体）を確認 |
| 🟡 推奨 | transportation | 識別シグネチャー（パンタグラフ等）を確認 |
| 🟢 余裕があれば | sensory | miru/mieru, kiku/kikoeru の能動/受動矢印を確認 |
| 🟢 余裕があれば | weather | weather_noun（TEXT_POLICY_A）とweather_adjective（B）の使い分け確認 |

**テスト手順：**

```
1. Goi_List から上記vocab_typeをカバーする語彙を各1〜2語選定（合計15〜25語程度）
2. v2.9ガイドの §0-B CLAUDE_DECISION_FLOW に従いテンプレートを選択
3. §0-A PLACEHOLDER_VALIDATION で出力前チェック
4. §0-C PROMPT_LENGTH_POLICY でprompt_core語数を確認
5. JSON形式でプロンプトを出力
6. GAS の generateImageBatch() で実際に画像生成
7. §6-B QA_PASS/FAIL_CRITERIA で合否判定（vocab_typeに応じてUNIVERSAL/EXAMPLE_ONLY切り替え）
8. FAILが出た場合は §7 REGENERATION_RULES で修正し、ガイドの問題点として記録
```

**テスト後の判断軸：**

```
FAILが多いvocab_type → そのテンプレートの prompt_core を改訂検討
TEXT違反が出る → TEXT_POLICY または VISUAL_CANON_RULE を見直し
スタイル崩れが多い → STYLE_RECIPE の記述強化を検討
特定のFAILパターンが繰り返される → REGENERATION_RULES に追加登録
```

### 7-3. v2.9 を使ったS列プロンプト生成時の注意（評価完了後）

v2.8時点の注意（handoff v3.0 §7-2）に加え、v2.9では以下を追加で守ること：

```
① 肌色は CHARACTER_RENDERING_POLICY の skin_prompt_phrase をそのまま使う
   暖色肌: "Skin tones: naturally warm medium skin tone."
   グレー: "Gender-neutral avatar, neutral cool light gray skin."
   ※ hex値は絶対にプロンプトに書かない（§0-A検証）

② テンプレートA〜J: v2.5 の [STYLE RECIPE] ブロックを §1 確定版に「置換」
   テンプレートK〜T: STYLE_RECIPE + 肌色 + prompt_core + TEXT_POLICY を「連結」
   ※ 区別は §0-B Step4 の「■【手順1】」「■【手順2】」ラベルで確認

③ 出力前に §0-A PLACEHOLDER_VALIDATION の5項目を必ずセルフチェック
   （スラッシュPHは解消済みだが、単純プレースホルダーの置換漏れに注意）

④ prompt_core の語数は §0-C PROMPT_LENGTH_POLICY の上限内に収める
   【⚠️ v2.9改訂】語彙カード: 50-80w / 例文1シーン: 80-120w / 複数コマ: 120-150w
   ※ STYLE_RECIPE・肌色・TEXT_POLICYの固定コスト（≒128-130語）は除外して計測

⑤ 同じ語彙は §0-D VISUAL_CANON_RULE に従い視覚アイデンティティを固定する
   いつ・どのくらい・ある/いる は vocab_type を lesson_NN.json で一度決めたら全レッスンで維持

⑥ QA判定は imageId の prefix で適用基準を切り替える
   word_* → QA_PASS_CRITERIA_UNIVERSAL / QA_FAIL_CRITERIA_UNIVERSAL のみ
   ex_*   → UNIVERSAL + EXAMPLE_ONLY の両方を適用

⑦ 生成後 §6-B PASS/FAIL基準で判定 → FAILなら §7 REGENERATION_RULES で修正
```

---

## §8. 未解決の事項・次チャット以降の課題（v4.1更新）

| 問題 | 状態 | 優先度 |
|---|---|---|
| テンプレートA〜J本体がv2.9に含まれずv2.5参照のまま | 意図的見送り | 低（v3.0検討） |
| existence_location の構造的style例外（Claude個別判断に委ねる設計） | v2.8で例外注記化・許容 | 低 |
| 見出し記法の不統一（§付き/なし混在） | 化粧上の問題・見送り | 低 |
| GRAMMAR_PATTERNS_C 41件中、v2.7で新規設計した6件の品質未検証 | ⚠️ 要検証 | 中（S列生成前に他AI評価で確認推奨） |
| inference_deshoo 等の certainty meter XX% 表記がGeminiに数字描画させるリスク | 許容（充填量指示として機能する設計）。懸念あれば次AI評価で確認 | 低 |
| Goi_Listを使ったテスト画像生成が未実施（ガイドの実生成品質が未検証） | ⚠️ 未着手 | 高（⑫で実施予定） |

### 8-1. 例文画像フェーズの未解決課題（v4.1新規）

ガイド上は例文画像生成が想定・設計済みだが、実運用に向けて以下3点の整理が必要。

| # | 課題 | 状態 | 優先度 |
|---|---|---|---|
| 1 | **設計方針の未決定**：旧設計（場面再現型・v2.5テンプレートC）と新設計（文法記号型・v2.9 GRAMMAR_PATTERNS_C）のどちらで例文画像を進めるかが未決定のまま両者が並存している | ⚠️ 要決定 | 高（語彙カードテスト完了後に決定） |
| 2 | **GASパイプライン未実装**：ExamplesシートへのimagePrompt列追加・`generateImageBatch()` の例文対応拡張がいずれも未実装 | ❌ 未着手 | 中（設計方針決定後に着手） |
| 3 | **grammarConcept_id の照合未実施**：lesson側の `grammarConcept_id` が GRAMMAR_PATTERNS_C のキーと一致しているかの確認が取れていない | ⚠️ 未確認 | 中（新設計採用時に必須） |

**課題1の補足（旧/新設計の違い）：**

```
旧設計（v2.5 テンプレートC）:
  - 構造: [PURPOSE] / [SUBJECT & CHARACTERS] / [SCENE & ACTION] / [CONSTRAINTS]
  - 画風: 場面再現型（「先生が教室に立っている」など状況を描写）
  - 実績: image_prompts_lesson1_v7.json で lesson_01 の例文画像を生成済み
  - 課題: STYLE_RECIPEにhex値が残存・v2.9のパレット・TEXT_POLICYと乖離

新設計（v2.9 GRAMMAR_PATTERNS_C）:
  - 構造: prompt_core + uses_unified_char + hard_limit
  - 画風: 文法記号型（Ego/Sotoキャラクター・矢印・バブルで文法構造を抽象化）
  - 実績: プロンプト未生成・画像未生成
  - 利点: v2.9ガイドとの完全整合・Ego/Soto統一・QA基準適用可

どちらを選択するかは学習目的・対象年齢・使用場面に応じて教師側で判断する。
```

---

*v1.0 作成：2026-05-18（マスタープロンプトガイドv2.6評価チャット）*
*v2.0 更新：2026-05-18（v2.7作成・横断精査・8問題修正チャット）*
*v3.0 更新：2026-05-18（他AIによるv2.7評価精査・v2.8作成チャット）*
*v4.0 更新：2026-05-18（Claudeによるv2.8独立評価・v2.9作成・横断精査チャット）*
*v4.1 更新：2026-05-18（例文画像フェーズ課題整理・Goi_Listテスト生成方針追加チャット）*
*根拠：本チャットのClaude独立評価・v2.9作成作業・横断精査スクリプト実行結果・例文画像設計調査*
*次資料：handoff_v4_7.md（パイプライン全体）と併用すること*
*次チャットで使用：master_prompt_design_guide_v2_9.py + この資料*
