# プロンプトガイド レビュー・方針整理 引き継ぎ資料
**作成日：2026-05-18（v1.0）→ 更新：2026-05-18（v2.0）→ 更新：2026-05-18（v3.0）**
**対象チャット（v1.0）：マスタープロンプトガイドv2.6評価・パイプライン現状整理・v2.7方針策定**
**対象チャット（v2.0）：v2.7作成・横断精査・8問題修正**
**対象チャット（v3.0）：他AIによるv2.7評価の精査・v2.8作成（問題修正＋実務ルール補完＋横断精査）**
**前提資料：handoff_v4_7.md / master_prompt_design_guide_v2_7.py / master_prompt_design_guide_v2_8.py**

---

## ⚠️ この資料の位置づけ

この資料は **handoff_v4_7.md への追記ではない**。
プロンプトガイドのレビューと方針整理を記録するための独立した資料である。

- v1.0：ChatGPT評価の精査・パイプライン現状整理・v2.7方針策定
- v2.0：v2.7作成・横断精査・8問題修正
- **v3.0（本更新）：他AIによるv2.7評価2件の精査・v2.8作成（13問題修正＋実務ルール5種補完＋横断精査で4問題追加修正）**

次チャットで **v2.8 を他AIに再評価させる**際は、この資料と
`master_prompt_design_guide_v2_8.py` を両方アップロードしてこの資料を最初に読むこと。

---

## §0. 最新状況サマリー（v3.0時点・最重要）

```
現行ファイル : master_prompt_design_guide_v2_8.py（2310行・Python syntax VALID）
GRAMMAR_PATTERNS_C : 41エントリで確定（補完不要）
ステータス : 他AI再評価待ち（次チャット）
次の作業 : v2.8 を他AIに評価させる → 結果を踏まえ追加修正 → lesson_01/02 S列生成
```

**v2.7 → v2.8 で実施したこと（3フェーズ）：**

1. **問題修正フェーズ**：他AI評価2件 + 自己評価で検出した問題を修正（hex値混入・未定義参照・スタイル矛盾・Shh汚染等）
2. **実務ルール補完フェーズ**：Claudeが迷わず動くための5セクションを新設
3. **横断精査フェーズ**：全体を機械検証し、見落としていた4問題を追加発見・修正

---

## §1. 他AIによるv2.7評価の精査結果（v3.0新規）

v2.7 を他AI（2つの評価レポート）に評価させた。その精査結果。

### 1-1. 他AIが正確に指摘した点（採用した）

| 指摘 | 評価 | v2.8での対応 |
|---|---|---|
| `SET_EXPR_CULTURAL_NOTES` 未定義参照 | ✅ 正確 | 6表現分を新規定義 |
| UNIFIED_CHAR_SYSTEM/SEMANTIC_COLOR_UNIFIEDにhex値残存 | ✅ 部分的に正確 | 内部参照は許容。真の危険箇所を別途特定（下記1-3参照） |
| CLAUDE_DECISION_FLOW 不足 | ✅ 正確 | §0-B として新設 |
| QAにPASS/FAIL基準なし | ✅ 正確 | §6-B QA_PASS/FAIL_CRITERIA 新設（128px縮小テスト含む） |
| PLACEHOLDER_VALIDATION なし | ✅ 正確 | §0-A として新設 |
| PROMPT_LENGTH_POLICY なし | ✅ 正確 | §0-C として新設 |
| REGENERATION_RULES なし | ✅ 正確 | §7 として新設（7パターン） |
| STYLE_RECIPEとテンプレートのスタイル矛盾 | ✅ 正確 | WEATHER_FRAMES等5箇所修正 |
| `'Shh'` のテキスト汚染リスク | ✅ 正確（ただし誤箇所指摘） | shizuka_ni本体 + ADVERB原則の2箇所修正 |
| VISUAL_CANON_RULE なし | ✅ 正確 | §0-D として新設 |
| contrast_pairs の必要性 | ✅ 正確 | §3-6 CONTRAST_PAIRS 新設（8組） |

### 1-2. 他AIが過大評価・文脈を無視した点（採用しなかった）

| 指摘 | 評価 | 理由 |
|---|---|---|
| 「単体完結」矛盾が最大の弱点 | ⚠️ 過大評価 | handoff §9-2で意図的見送りが確認済み。ヘッダー表記修正のみで対応（v2.5依存は維持） |
| FINAL_PROMPT_FORBIDDEN_TOKENS が最優先 | ⚠️ 優先度判断の相違 | PLACEHOLDER_VALIDATIONの方が即時的な実務リスクと判断し優先 |
| 方針A（v2.5統合）推奨 | ❌ 見送り | A〜J重複を避けるため。完全単体完結はv2.9以降の課題 |

### 1-3. 他AIが見落とし・自己評価で新規発見した点（重要）

他AI2件はいずれもhex値問題を「SEMANTIC_COLOR_UNIFIED」中心に指摘したが、
**真に危険なのは CHARACTER_RENDERING_POLICY だった**。

```
他AIの指摘 : SEMANTIC_COLOR_UNIFIEDのhex値（→ 実は内部参照のみで低リスク）
自己発見   : CHARACTER_RENDERING_POLICY の #D3D3D3
            （→ skin_prompt_phraseとしてプロンプトに直接書く設計 = 高リスク）
```

この他、自己評価で以下を追加発見・修正：
- `existence_location` の spotlight と STYLE_RECIPE の no-shadows の構造的矛盾（→ 例外注記を明示）
- ADVERB_ANCHOR_PRINCIPLE の `Shh`（他AIはSET_EXPR_FRAMESと誤認していた）

---

## §2. v2.8で修正した全問題リスト（v3.0新規）

### 2-1. 問題修正フェーズ（14箇所）

| # | 重大度 | 問題 | 修正内容 |
|---|---|---|---|
| 1 | 🔴 | CHARACTER_RENDERING_POLICY の `#D3D3D3` がプロンプトに混入する設計 | hex削除・`skin_prompt_phrase`フィールドに色名のみで定義（neutral/warm/context_dependent全て） |
| 2 | 🔴 | `SET_EXPR_CULTURAL_NOTES` 未定義参照 | 6表現（itadakimasu/ojama_shimasu/yoroshiku/sumimasen/gochisousama/otsukaresama）を新規定義 |
| 3 | 🟡 | `shizuka_ni` の `'Shh'` 文字列がGeminiにテキスト描画させるリスク | `finger-to-lips silence gesture`に変更 |
| 4 | 🟡 | ADVERB_ANCHOR_PRINCIPLE の `Shh` 表記 | 同上の表現に変更 |
| 5 | 🟡 | `existence_location` の spotlight と no-shadows の矛盾 | `flat circular highlight ring`に変更＋`style_exception_note`で例外明示 |
| 6 | 🟡 | WEATHER_FRAMES のフラットデザイン違反（ame_rain水たまり反射） | flat oval puddle・no reflectionsに修正 |
| 7 | 🟡 | 同（yuki_snow ソフト背景） | solid pale blue-gray・flat fillに修正 |
| 8 | 🟡 | 同（hare_sunny 空の背景） | solid cream white・no sky gradientに修正 |
| 9 | 🟡 | 同（taifuu_typhoon ドラマチック空） | solid dark slate gray・flat fillに修正 |
| 10 | 🟡 | 同（atsui_hot/samui_cold ambient overlay） | solid background・flat fillに修正 |
| 11 | 🟢 | nigiyaka_ni の colorful music notes（パレット外色） | 承認パレット（amber gold）に統一 |
| 12 | 🟢 | TIME_FRAMES kisetsu_season の prompt_core にhex値 | 色名（soft pink/warm amber gold等）に変更 |
| 13 | 🟡 | GRAMMAR_PATTERNS_C の prompt_core 内hex値6箇所（negation_masen/modality_prohibition/modality_obligation/conditional_ba/social_constraint_wakeni） | すべて色名に変換 |
| 14 | 🟢 | ヘッダーの「単体完結」表記が実態と乖離 | 「A〜Jはv2.5参照・単体完結はv2.9以降」に修正 |

### 2-2. 実務ルール補完フェーズ（新規5セクション）

| セクション | 内容 |
|---|---|
| §0-C PROMPT_LENGTH_POLICY | 語彙80-130w / 例文120-180w / 複数コマ180-230w の上限と削減優先順位 |
| §0-D VISUAL_CANON_RULE | 語彙ごとの視覚アイデンティティ固定（電車=パンタグラフ+架線+線路を常に維持等） |
| §3-6 CONTRAST_PAIRS | 混同しやすい語彙8組の差分設計（暑い環境/物体・見る/見える・父/お父さん・あまり程度/頻度等） |
| §6-B QA_PASS/FAIL_CRITERIA | 合格6基準・不合格8条件（128px縮小テスト含む） |
| §7 REGENERATION_RULES | FAIL判定別の再生成手順7パターン＋打ち切り基準（最大2回） |

### 2-3. 横断精査フェーズで追加発見・修正（4箇所）

問題修正・実務補完の後、機械検証で**見落としていた問題**を4件追加発見し修正した。

| # | 重大度 | 問題 | 修正内容 |
|---|---|---|---|
| 15 | 🔴 | §1-1注記（L242,244）に `#D3D3D3` 残存（フェーズ1の修正漏れ） | 色名に統一＋hex禁止注記追加 |
| 16 | 🔴 | §4 完成プロンプト例「テンプレートK」（L729）に `#D3D3D3` 残存（同上） | 色名に統一 |
| 17 | 🟡 | `COUNTER_SUBITIZING_PRINCIPLE` 命名不一致（実体は`COUNTER_FRAMES["_subitizing_rule"]`） | 実装名への正確な参照に修正 |
| 18 | 🟡 | GRAMMAR_PATTERNS_C末尾のギャップ注記が論理矛盾（37→41で「補完せよ」と誤読される） | 「41確定・追加照合不要」に整理 |

**#15・#16が特に重要**：フェーズ1で§2-3のhex値は直したが、同じ`#D3D3D3`が
プロンプト組み立ての参照箇所（§1-1注記・§4見本）に残っていた。
横断精査をしなければS列生成時に毎回hex値が混入していた。

---

## §3. v2.8の構造（v3.0新規）

```
§0   このガイドの使い方（Claudeへの指示）
  §0-A PLACEHOLDER_VALIDATION   ← v2.8新設（出力前セルフチェック5項目）
  §0-B CLAUDE_DECISION_FLOW     ← v2.8新設（迷い時の優先ルール5ステップ）
  §0-C PROMPT_LENGTH_POLICY     ← v2.8新設（プロンプト長上限）
  §0-D VISUAL_CANON_RULE        ← v2.8新設（語彙の視覚アイデンティティ固定）
§1   変更禁止の基本設定（STYLE_RECIPE / TEXT_POLICY_A/B/C / アスペクト比）
§2   キャラクター・カラーシステム
  2-1 UNIFIED_CHAR_SYSTEM（hex値あり＝内部参照のみ）
  2-2 SEMANTIC_COLOR_UNIFIED（hex値あり＝内部参照のみ）
  2-3 CHARACTER_RENDERING_POLICY（hex削除・skin_prompt_phrase方式に変更）
§3   FOUNDATIONAL原則
  3-1〜3-5（v2.7から維持）
  3-6 CONTRAST_PAIRS            ← v2.8新設
§4   テンプレートA〜T（A〜Jはv2.5参照／K〜Tは本体定義）
§5   GRAMMAR_PATTERNS_C（41エントリ確定・16:9）
§6   QAチェックリスト
  §6-B QA_PASS/FAIL_CRITERIA    ← v2.8新設
§7   REGENERATION_RULES         ← v2.8新設
```

---

## §4. 横断精査でクリーンと確認した項目（v3.0新規）

次の他AI評価で「これは既に確認済み」と伝えられる項目。

```
✅ Python syntax VALID
✅ GRAMMAR_PATTERNS_C : 実41 = 表記41（一致・補完不要で確定）
✅ TEXT_POLICY A/B/C  : §1-2定義 ⇔ §4対応表 完全一致（v2.7の8問題筆頭だった項目）
✅ SET_EXPR_CULTURAL_NOTES : 定義済み
✅ REGENERATION_RULES ⇔ QA_FAIL_CRITERIA : 全FAIL条件に対応策あり
✅ フッター手順サマリー ⇔ 実セクション : 参照整合
✅ CONTRAST_PAIRS ⇔ ADVERB_FRAMES : amari_nai/amari_frequency 実在・参照正確
✅ UNIFIED_CHAR/SEMANTIC_COLORのhex値 : 内部参照のみ・prompt_coreは色名使用・§0-A検証で保護
✅ prompt_core / skin_prompt_phrase 内のhex値 : ゼロ（注意書きを除く）
```

---

## §5. v2.8に残存する既知事項（v3.0新規・他AI評価時の論点）

次の他AIが指摘してくる可能性が高い項目。**意図的に残しているもの**と
**未対応のもの**を区別しておく。

### 5-1. 意図的に残している（再指摘されても方針は変えない）

| 事項 | 理由 |
|---|---|
| テンプレートA〜J本体がv2.5参照（単体完結未達） | A〜J重複回避のため意図的見送り。v2.9以降の課題 |
| UNIFIED_CHAR_SYSTEM/SEMANTIC_COLOR_UNIFIEDにhex値 | 内部参照辞書。prompt_coreは色名使用済み。§0-A検証で出力時に保護 |
| §0-A/B/C/D がコメント記述・他はPython辞書 | 「Claudeへの指示＝散文」「参照データ＝辞書」の意図的使い分け |
| existence_location の構造的なstyle例外 | spotlight→flat ring化＋例外注記で対応。完全な矛盾解消ではなくClaude個別判断を残す設計 |

### 5-2. 軽微・化粧上の未対応（優先度低）

| 事項 | 状態 |
|---|---|
| 見出し記法の不統一（`## §0-A.` vs `## 2-3.`） | 機能影響なし（番号で到達可能）。修正リスク＞便益のため見送り |

### 5-3. 他AI評価で確認してほしい観点

次チャットで他AIに評価させる際、以下を重点的に見てもらう：

```
1. §2-3 → §1-1注記 → §4見本 のhex値が完全に色名統一されているか
   （フェーズ1で漏れた経緯があるため、第三者の目で再確認したい）
2. 新設5セクション（§0-A/C/D・§3-6・§6-B・§7）に
   既存テンプレートとの矛盾や、Claudeが誤読する曖昧さがないか
3. REGENERATION_RULES の7パターンが、実際の生成失敗を網羅できているか
4. CONTRAST_PAIRS 8組以外に、混同しやすく追加すべきペアがないか
5. PROMPT_LENGTH_POLICY の語数上限が現実的か
   （例文画像でEgo/Soto+矢印+記号を入れて120-180wで足りるか）
```

---

## §6. パイプライン現状（v4.7時点・v2.0から変更なし）

参考のため再掲。詳細は handoff_v4_7.md を参照。

| 対象 | 状態 |
|---|---|
| 語彙カード生成（Vocabularyシート） | ✅ S列参照・Imagen呼び出し・Drive保存・レジストリ更新すべて実装済み |
| 例文画像生成（Examplesシート） | ❌ GAS関数なし・imagePrompt列もなし（語彙完了後に着手） |
| S列プロンプトの内容 | ⚠️ lesson_01/02・N5全412語 すべて未生成 |

**現在のボトルネック（優先順位順）：**

```
最高 : lesson_01・02（35語）のS列プロンプト生成（v2.8評価完了後に着手）
高   : N5全412語のS列プロンプト生成（50語単位）
中   : generateImageBatch()実行（S列投入完了後）
中   : ExamplesシートのimagePrompt列追加 + GAS拡張（語彙完了後）
```

---

## §7. 次チャットの作業順序（v3.0更新済み）

```
✅ ① v1.0 資料作成（v2.6評価チャット）
✅ ② v2.7 作成（v2.7作成チャット）
✅ ③ v2.7 横断精査・8問題修正（v2.7作成チャット）
✅ ④ 他AIによるv2.7評価2件の精査（v2.8作成チャット）
✅ ⑤ v2.8 作成：13問題修正＋実務ルール5種補完（v2.8作成チャット）
✅ ⑥ v2.8 横断精査：4問題追加発見・修正（v2.8作成チャット）
⬜ ⑦ 他AIによるv2.8評価（次チャット）← この資料を最初に読ませる
⬜ ⑧ 評価結果を踏まえた追加修正があれば実施
⬜ ⑨ lesson_01（17語）・lesson_02（18語）のvocab_type一覧確認
⬜ ⑩ §4対応表でテンプレート選択 → S列プロンプトをJSON形式で生成
⬜ ⑪ importImagePromptsFromJson() でS列に投入
⬜ ⑫ generateImageBatch() 実行
```

### 7-1. 他AI評価チャットに渡すファイル

```
- master_prompt_design_guide_v2_8.py（v2.8作成チャットで作成）
- prompt_guide_review_handoff_v3.md（この資料・変更経緯と既知事項の参照用）
```

### 7-2. v2.8 を使ったS列プロンプト生成時の注意（評価完了後）

v2.7時点の注意（handoff v2.0 §9-4）に加え、v2.8では以下を必ず守る：

```
① 肌色は CHARACTER_RENDERING_POLICY の skin_prompt_phrase をそのまま使う
   暖色肌: "Skin tones: naturally warm medium skin tone."
   グレー: "Gender-neutral avatar, neutral cool light gray skin."
   ※ hex値（#D3D3D3等）は絶対にプロンプトに書かない（§0-A検証）

② テンプレートA〜J: v2.5 の [STYLE RECIPE] ブロックを §1 確定版に「置換」
   テンプレートK〜T: STYLE_RECIPE + 肌色 + prompt_core + TEXT_POLICY を「連結」

③ 出力前に §0-A PLACEHOLDER_VALIDATION の5項目を必ずセルフチェック
   （特に { } プレースホルダー残留と # hex値混入）

④ プロンプト長は §0-C PROMPT_LENGTH_POLICY の上限内に収める

⑤ 同じ語彙は §0-D VISUAL_CANON_RULE に従い視覚アイデンティティを固定する

⑥ 生成後 §6-B PASS/FAIL基準で判定 → FAILなら §7 REGENERATION_RULES で修正
```

---

## §8. 未解決の事項・次チャット以降の課題（v3.0更新）

| 問題 | 状態 | 優先度 |
|---|---|---|
| テンプレートA〜J本体がv2.7/v2.8に含まれずv2.5参照のまま | 意図的見送り | 低（v2.9検討） |
| existence_location の構造的style例外（Claude個別判断に委ねる設計） | v2.8で例外注記化・許容 | 低 |
| 見出し記法の不統一（§付き/なし混在） | 化粧上の問題・見送り | 低 |
| GRAMMAR_PATTERNS_C 41件中、v2.7で新規設計した6件の品質未検証 | ⚠️ 要検証 | 中（S列生成前に他AI評価で確認推奨） |
| 例文画像フェーズ（Examplesシート拡張・GAS関数追加） | 未着手 | 中（語彙完了後） |

---

*v1.0 作成：2026-05-18（マスタープロンプトガイドv2.6評価チャット）*
*v2.0 更新：2026-05-18（v2.7作成・横断精査・8問題修正チャット）*
*v3.0 更新：2026-05-18（他AIによるv2.7評価精査・v2.8作成チャット）*
*根拠：本チャットの他AI評価2件の精査・v2.8作成作業・横断精査スクリプト実行結果*
*次資料：handoff_v4_7.md（パイプライン全体）と併用すること*
*次チャットで使用：master_prompt_design_guide_v2_8.py + この資料*
