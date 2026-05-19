# 引き継ぎ資料：画像生成ライン v4.0
**バージョン：image-gen-handoff-v4.0（2026-05-18）**
**前資料：image-gen-handoff-v3.0.md（2026-05-18）**
**このバージョンで追加した内容：Goi_List.pdf 初期分析結果・v2.6_complete 統合完了**

---

## ⛔ このドキュメントの編集ルール

| セクション | ルール |
|---|---|
| §2 完了した作業 | **追記のみ・削除禁止** |
| §3 Goi_List分析 | **追記のみ・削除禁止** |
| §5 設計決定の記録 | **追記のみ・削除禁止** |

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **Goi_List.pdf を再読み込みして精査を完了する** | 下記 §3 の「次チャットでの継続作業」を参照。今チャットでは時間切れのため途中 |
| **②** | **プロンプト作成に不足している資料を特定する** | §3 の分析結果をもとに、vocab_type 別に不足情報を列挙する |
| **③** | **classifyAndTranslate.gs の更新仕様を確定する** | 新 vocab_type（K〜T）と補助列の自動分類ロジックを設計する |

> **次チャットへのアップロード必須ファイル：**
> - `image-gen-handoff-v4.0.md`（この資料）
> - `Goi_List.pdf`（精査継続のため）
> - `image-gen-handoff-v3.0.md`（前資料・参照用）
> - `master_prompt_design_guide_v2_6_complete.py`（統合済み・参照用）

---

## §1. このチャットで行った作業の概要

```
【前チャット（image-gen-handoff-v3.0）からの継続作業】

  master_prompt_design_guide_v2_6_complete.py を作成
    ↓
  統合作業の見落とし確認・修正（END OF フッター混入を除去）
    ↓
  Goi_List.pdf の初期分析（時間切れのため途中）
```

---

## §2. 完了した作業

### v2.6 の3ファイルを1ファイルに統合（完了）

| 統合前（3ファイル） | 統合後（1ファイル） |
|---|---|
| `master_prompt_design_guide_v2_6.py`（2816行） | `master_prompt_design_guide_v2_6_complete.py`（4162行） |
| `master_prompt_design_guide_v2_6_corrections.py`（863行） | ↑ 全変数34件・Python構文OK |
| `master_prompt_design_guide_v2_6_foundational.py`（508行） | ↑ セクション §2>§3>§4 の優先順位明記 |

**検証結果（全項目クリア）：**
- ✅ Python 構文 OK
- ✅ 必須変数 34件 全存在
- ✅ 旧 END OF フッター内部混入 0件
- ✅ `## 適用方法:` 末尾の1件のみ
- ✅ セクション順序 §2 < §3 < §4

**ユーザー側の残作業：**
- プロジェクトナレッジから旧3ファイルを削除
- `master_prompt_design_guide_v2_6_complete.py` をナレッジに登録

---

## §3. Goi_List.pdf 初期分析（途中・次チャットで継続）

### ファイル基本情報

| 項目 | 値 |
|---|---|
| ページ数 | 780ページ |
| 総エントリ数 | 約17,520語 |
| 列構成 | No / 標準的な表記 / 読み / 語彙の難易度 / 品詞1 / 品詞2(詳細) / 語種 / 更新情報 |

### 難易度レベル分布

| レベル | 語数 | JLPTの目安 |
|---|---|---|
| 1.初級前半 | 422語 | N5相当 |
| 2.初級後半 | 792語 | N4〜N5 |
| 3.中級前半 | 2,297語 | N3〜N4 |
| 4.中級後半 | 6,462語 | N2〜N3 |
| 5.上級前半 | 6,376語 | N1〜N2 |
| 6.上級後半 | 1,559語 | N1以上 |
| **合計** | **17,908語** | |

### N5相当（1.初級前半）の品詞分布（421語）

| 品詞1 | 語数 | v2.6テンプレート対応 |
|---|---|---|
| 名詞 | 298 | A〜D / P〜R / S（語義による） |
| イ形容詞 | 40 | J |
| 動詞1類 | 23 | H |
| 接尾辞 | 19 | I（抽象概念として処理） |
| 定型表現 | 9 | **M**（テンプレートM新設・要確認） |
| 動詞2類 | 8 | H |
| 連体詞 | 6 | G（指示詞系）or I |
| ナ形容詞 | 5 | J |
| 代名詞 | 4 | **K**（テンプレートK新設） |
| 副詞 | 4 | **N**（テンプレートN新設） |
| 感動詞 | 2 | **L**（テンプレートL新設） |
| 動詞3類 | 2 | H |
| 接頭辞 | 1 | I |

### Goi_List にある情報 vs. プロンプト生成に必要な情報

| 必要フィールド | Goi_Listに存在 | 現在の取得方法 | 状態 |
|---|---|---|---|
| word（標準表記） | ✅ | Goi_Listから直接 | OK |
| reading（読み） | ✅ | Goi_Listから直接 | OK |
| pos（品詞1） | ✅ | Goi_Listから直接 | OK |
| difficulty（難易度） | ✅ | Goi_Listから直接 | OK |
| en（英語訳） | ❌ | classifyAndTranslate.gs で AI生成 | 稼働中 |
| vocab_type（A〜T） | ❌ | classifyAndTranslate.gs で AI分類 | **新K〜T未対応** |
| familyForm（uchi/soto） | ❌ | 未実装 | **要実装** |
| adverbType（degree等） | ❌ | 未実装 | **要実装** |
| timeSubtype（clock等） | ❌ | 未実装 | **要実装** |
| perceptionType（active等） | ❌ | 未実装 | **要実装** |
| grammarConcept | ❌ | lesson_NN.json から参照 | lesson側で管理 |

### 次チャットでの継続作業（Goi_List精査）

以下を次チャットで確認する：

**確認1: 品詞1の「定型表現」「連体詞」の詳細**
```
- 「定型表現」9語の内容を確認（どんな表現か）
  → テンプレートMのどのサブカテゴリに当たるか
- 「連体詞」6語（この・その・あの・どの等）
  → テンプレートGで処理できるか確認
```

**確認2: 名詞298語のサブカテゴリ分布**
```
- 品詞2(詳細)の内訳を確認
  → 名詞-普通名詞-一般: 物体（D）・建物（B）・人物（A）等に分類
  → 名詞-数詞: 助数詞（O）に当たるか
  → 固有名詞: 地名・人名 → どのテンプレートで処理するか
```

**確認3: Goi_Listに欠けている情報で他に参照できる資料はあるか**
```
- JLPT公式語彙リスト（N5〜N1）との対応表
  → Goi_Listの難易度レベルとJLPT番号の正確な対応を確認
- みんなの日本語 / げんき 等の教科書の語彙リスト
  → lesson_01/02 の語彙がGoi_Listと一致しているか確認
- 語種（和語/漢語/外来語/混種語）の列 → 画像スタイルに使えるか
```

**確認4: classifyAndTranslate.gs への Goi_List 活用方針**
```
現状: lesson_NN.json の語彙を1語ずつAIで分類
改善案: Goi_Listの品詞1情報を使って vocab_type を事前マッピング
→ 例: 感動詞 → L / 代名詞 → K / 副詞 → N（ただし例外あり）
→ AIへの問い合わせ回数を削減できるか検討
```

---

## §4. v2.6 プロンプトガイドの現状と残タスク

### vocab_type → テンプレート 完全対応表（v2.6-complete）

| vocab_type | テンプレート | 状態 |
|---|---|---|
| person | A | ✅ v2.5 完成 |
| building | B | ✅ v2.5 完成 |
| example_sentence | C'（grammarConcept分岐・42文型） | ✅ v2.6 完成 |
| concrete_object | D | ✅ v2.5 完成 |
| variant_grid | E | ✅ v2.5 完成 |
| spatial_relation | F | ✅ v2.5 完成 |
| demonstrative | G | ✅ v2.5 完成 |
| action_verb | H | ✅ v2.5 完成 |
| abstract_concept | I | ✅ v2.5 完成 |
| adjective | J | ✅ v2.5 完成 |
| pronoun | K | ✅ v2.6 完成 |
| interjection | L | ✅ v2.6 完成 |
| set_expression | M | ✅ v2.6 完成 |
| adverb | N | ✅ v2.6 完成 |
| counter | O | ✅ v2.6 完成 |
| time | P | ✅ v2.6 完成 |
| transportation | Q | ✅ v2.6 完成 |
| family | R | ✅ v2.6 完成 |
| weather | S | ✅ v2.6 完成 |
| sensory | T | ✅ v2.6 完成 |

### GAS 実装の残タスク（優先度順）

| タスク | 優先度 | 内容 |
|---|---|---|
| `generateImages.gs` モデル名変更 | **高** | `imagen-4.0-generate-exp` → `imagen-4.0-fast-generate-001` |
| `generateImages.gs` buildImagePrompt_() 拡張 | **高** | 新vocab_type K〜T の switch-case 追加（HOW_TO_USE_v2_6 参照） |
| Vocabulary シート補助列追加 | **高** | familyForm / perceptionType / adverbType / timeSubtype / grammarConcept |
| `classifyAndTranslate.gs` 更新 | **中** | 新vocab_type K〜T を自動分類するロジック追加 |
| Imagen 4 復帰テスト | **高** | `testSingleImage()` で1枚生成 → 成功確認 → タイマートリガー再設定 |
| 画風QAテスト | **中** | lesson_01 の数語で実際に生成し v2.6 テンプレートの品質確認 |

---

## §5. 設計決定の記録

（image-gen-handoff-v3.0 §5 の内容を全て継承。以下は今チャットで追加分）

| # | 決定内容 | 根拠 |
|---|---|---|
| **D-16** | v2.6_complete は 4ファイル → 2ファイル構成に変更（v2.5 + v2.6_complete） | 4ファイル参照は非現実的（image-gen-handoff-v3.0 §12） |
| **D-17** | Goi_List.pdf の難易度レベルと JLPT の対応は「1.初級前半≈N5」として扱う | 初期分析で確認。ただし厳密な対応は次チャットで確認要 |

---

## §6. 参照資料の所在

| 資料 | 場所 | 備考 |
|---|---|---|
| master_prompt_design_guide_v2_5.py | プロジェクトナレッジ | 変更なし・STYLE_BIBLE等 |
| master_prompt_design_guide_v2_6_complete.py | **今チャットで生成・要ナレッジ登録** | 旧3ファイルを統合 |
| Goi_List.pdf | ユーザーが保持 | 17,520語・780ページ |
| handoff_v4_3.md | プロジェクトナレッジ | メインラインの最新状態 |
| image-gen-handoff-v3.0.md | ユーザーがアップロード済み | 画像ラインの前資料 |
| generateImages.gs | Google Apps Script | 要モデル名変更・要switch-case追加 |
| classifyAndTranslate.gs | Google Apps Script | 要新vocab_type対応 |

---

## §7. 次チャットの開始コマンド例

```
image-gen-handoff-v4.0.md と Goi_List.pdf をアップロードしました。

作業①：Goi_List.pdf を読み込んで、以下を確認してください。
  a. 品詞1「定型表現」9語・「連体詞」6語の具体的な語彙内容
  b. 名詞298語（N5相当）の品詞2(詳細)のサブカテゴリ分布
  c. Goi_Listの列「語種」（和語/漢語/外来語/混種語）が画像プロンプトに活用できるか
  d. Goi_Listの情報だけでvocab_type（A〜T）を自動マッピングできる割合の試算

作業②：上記の分析をもとに、プロンプト作成にさらに必要な外部資料があるか判断する。

作業③：classifyAndTranslate.gs に追加すべき自動分類ロジックの仕様を確定する。

参照: image-gen-handoff-v4.0.md §3「次チャットでの継続作業」
```

---

*作成日：2026-05-18*
*前資料：image-gen-handoff-v3.0.md*
*スコープ：v2.6統合完了・Goi_List初期分析・次チャット引き継ぎ*
