# プロンプトガイド レビュー・方針整理 引き継ぎ資料
**作成日：2026-05-19（v7.0）**
**対象チャット：A層矛盾解消（v2.7）・B/C層統合（v2.8）・S列プロンプト生成（lesson_01）・抜け漏れ精査**
**前提資料：prompt_guide_review_handoff_v6_0.md / master_prompt_design_guide_v2_6.py**

---

## ⚠️ この資料の位置づけ

v6.0 からの差分のみ記載する。v1.0〜v6.0 の内容は `prompt_guide_review_handoff_v6_0.md` を参照。

---

## §0. 最新状況サマリー（v7.0時点・最重要）

```
現行ファイル : master_prompt_design_guide_v2_8.py（3854行）
前バージョン : master_prompt_design_guide_v2_6.py（v6.0時点の確定版）
ステータス   : v2.8は内部矛盾解消＋B/C層統合完了。ただし5点の既知欠落あり（§4参照）
               → v2.9 作成が次チャットの最優先作業
次の作業順序:
  ① v2.8 の既知欠落5点を修正して v2.9 を作成（§4参照）
  ② lesson_01_v1_1.json の vocab_type を設定（17語・全件null→§3参照）
  ③ ⑮ 1語テスト生成（GAS経由・医者か先生）
  ④ ⑱ image_prompts_lesson01_v1_0.json を importImagePromptsFromJson() でS列に投入
  ⑤ ⑲ generateImageBatch() 実行（lesson_01 17語）
  ⑥ ⑰ lesson_02 S列プロンプト生成（18語）
```

**v7.0 で実施したこと：**

1. v2.6 の A層内部矛盾（肌色ルール・ハードコード・アスペクト比・vocab_type 未設定）を解消 → **v2.7 作成**
2. Deep Research「日本語教材の視覚エンコーディング方法論」を読み込み・統合 → **v2.8 作成**
3. lesson_01 全17語の S列プロンプト JSON 生成 → **image_prompts_lesson01_v1_0.json**
4. v2.8 の抜け漏れ精査を実施 → 5点の既知欠落を特定（§4参照）

---

## §1. v2.7 の変更内容（A層矛盾解消）

### 1-1. 変更一覧

| 変更ID | 内容 | 修正前（v2.6） | 修正後（v2.7） |
|---|---|---|---|
| A1 | 肌色ルールの自己矛盾 | `warm_skin_realistic.skin_prompt_phrase = "Skin tones: naturally warm medium skin tone."` を person に追記せよ | `diverse_unspecified`（肌色フレーズ一切書かない）に改訂 |
| A2 | generic_* 8体のハードコード | `"skin": "warm medium skin tone"` | `"skin": "UNSPECIFIED — do not emit a skin-tone phrase"` に変更 |
| A3 | アスペクト比ポリシー不在 | コメント・スタイル名にのみ存在 | `PART 1.2 ASPECT_RATIO_POLICY` 新設 |
| A4 | vocab_type 未設定 | 「始めないこと」の1行のみ | Step 0 をハードゲート化（停止条件・lesson側は別作業と明記） |

### 1-2. 肌色方針の確定（全バージョン共通ルール）

```
【汎用の職業・役割・家族の人物】
  → CHARACTER_RENDERING_POLICY.diverse_unspecified
  → プロンプトに肌色フレーズを「行ごと」書かない
  → 理由: handoff §4.2/§4.4/§10（追記が褐色固定の原因。多国籍学習者向けには非指定が正しい方針）

【例文画像・代名詞・感動詞等】
  → CHARACTER_RENDERING_POLICY.neutral_avatar_abstract
  → "Gender-neutral avatar, neutral cool light gray skin." を追記

【固定5名のみ（鈴木/リン/キム/タノム/ケリー）】
  → CHARACTER_RENDERING_POLICY.named_character_identity
  → 各 NAMED_CHARACTER_PROFILES の個別ヒントに従う（タノムさん=medium-brown等）
  → これがプロジェクト内で「肌色を明示してよい唯一の領域」

【旧フレーズ "Skin tones: naturally warm medium skin tone." は使用禁止】
```

### 1-3. アスペクト比ポリシーの確定

```
【GAS経由（語彙カード量産）】
  → generateImages.gs が API パラメータで ASPECT_RATIO:"1:1" を自動付与
  → プロンプト本文にアスペクト比文を「書かない」（二重指定になる）

【手動・別経路・例文（GAS関数なし）】
  → アスペクト比パラメータがなく Gemini が 16:9 を採用してしまう
  → プロンプト先頭に以下を1行追加:
    語彙カード(1:1): "Square 1:1 aspect ratio."
    例文画像(16:9): "Wide 16:9 aspect ratio."

lesson_01/02 の S列プロンプトは GAS経由前提 → アスペクト比文を書かない
```

---

## §2. v2.8 の変更内容（B/C層統合）

### 2-1. 統合した Deep Research 資料

**ファイル名：** 日本語教材の視覚エンコーディング方法論.docx
**理論的枠組み（統合済み）：** Krashen（理解可能入力）、Schmidt（気づき仮説）、Paivio（二重符号化）、Cohn（VNG）、McCloud（コマ間推論）、Neurath（アイソタイプ）、Mayer（空間近接性原則）、久野（共感制約理論）、Sweller（認知負荷理論）、JSL（日本手話の視覚的プロソディ）

### 2-2. 変更一覧

| 変更ID | 追加内容 | 場所 | 内容 |
|---|---|---|---|
| B1 | NON_VISUAL_VOCAB_POLICY | PART 1.3 | 画像化不適格語の3条件判定基準・語彙タイプ別判定結果・代替提示形式 |
| B2 | Template K | PROMPT_TEMPLATES末尾 | 定型表現・感動詞専用（ありがとう/すみません/おはよう/はい/いいえ等） |
| B3 | ADJECTIVE_CATEGORY_MATRIX | PART 4.4 | 形容詞カテゴリ別・3戦略選択マトリクス（PAIR_CONTRAST/SINGLE_HIGHLIGHT/PROPERTY_OVERLAY） |
| C1 | GRAMMAR_VISUAL_ENCODING_30 | PART 7（末尾） | 30課文型 → 視覚エンコーディング戦略対応表（29エントリ実装） |
| C2 | HOW_TO_USE Step 7 | HOW_TO_USE | 例文画像設計手順を grammarConceptID → GVE30 照合フローに全面更新 |
| C3 | HOW_TO_USE Step 6.6 | HOW_TO_USE | set_expression の社会的場面設計フロー追加 |

### 2-3. vocab_type → テンプレート対応表（v2.8確定版）

```
person          → A (vocabulary_person)
building        → B (vocabulary_building)
example_sentence→ C (example_sentence)
concrete_object → D (vocabulary_object_concrete)
                  ※ 類似形状が多い場合は E(variant_grid) も検討
spatial_relation→ F (spatial_relation)
demonstrative   → G (demonstrative_kosoado)
action_verb     → H (action_verb)
abstract_concept→ I (abstract_concept)
adjective       → J (vocabulary_adjective)
set_expression  → K (vocabulary_set_expression) ← v2.8 新規
non_visual      → 生成しない（imageStatus = 'no_image_needed'）← v2.8 新規
```

### 2-4. GRAMMAR_VISUAL_ENCODING_30 実装済みエントリ（29件）

```
L1: noun_predicate_affirmative / noun_predicate_question / noun_no_affiliation
L2: kosoado_pronoun_thing / noun_no_possession
L3: verb_present_time_ni / verb_time_range / verb_past
L4: verb_transitive_wo
L7: existence_ni_ga / counter_existence
L9: comparison_yori / comparison_ichiban_list
L10/L25: juuju_ageru / juuju_morau / juuju_kureru
L12: te_iru_progressive / te_iru_resultant_state
L16/L20: plain_form_introduction
L22: tara_conditional / to_invariable / nara_suggestion
L23/L24: adj_sou_appearance / you_desu_inference / rashii_hearsay_obj
L28: passive_direct
L29: causative_intransitive
L30: sonkeigo_special / kenjogo_o_suru
```

---

## §3. 作成済みの成果物

### 3-1. image_prompts_lesson01_v1_0.json

**lesson_01 S列プロンプト（17語）**。v2.7準拠で生成済み。

| グループ | 語 | vocab_type | 備考 |
|---|---|---|---|
| p1_p2（職業） | 医者・会社員・学生・大学生・先生 | person | VISUAL_CANON_RULE適用済み（医者=聴診器のみ、先生=マーカーor教科書） |
| p1_p2_nationality（国籍） | 日本人・中国人・アメリカ人・韓国人・ブラジル人・ベトナム人・スペイン人 | person | フラッグバッジ戦略（国旗デザインの形状・色を主要識別子として使用） |
| p3（建物） | 病院・学校・銀行・大学・デパート | building | BUILDING_CUES（v2.8版）準拠 |

**適用済みポリシー：**
- A1: 肌色フレーズなし（diverse_unspecified）
- A3: アスペクト比プレフィックスなし（GAS経由前提）
- VISUAL_CANON_RULE: 医者のクリップボード禁止・先生のマーカーor教科書

**⚠️ 重要注意：** このJSONは v2.7 準拠で生成しています。v2.8/v2.9の方針と相違はありませんが、次チャットで vocab_type 設定が完了してから S列投入に進むこと。

### 3-2. lesson_01_v1_1.json の vocab_type 未設定（要修正）

全17語が `vocab_type: null` のまま。次チャットの作業①として修正が必要。

```
設定値一覧（確定）:
  医者・会社員・学生・大学生・先生    → "person"
  日本人〜スペイン人（7語）          → "person"
  病院・学校・銀行・大学・デパート    → "building"
```

---

## §4. v2.8 の既知欠落（次チャットで v2.9 として修正）

精査により特定した欠落5点。**次チャットの最初の作業として v2.9 を作成すること。**

### 欠落①（必須修正）: QA_CHECKLIST が未更新

`QA_CHECKLIST` に `set_expression`（Template K）と `non_visual` のチェック項目が未追加。
**修正内容：** `QA_CHECKLIST.vocab_type_check` に以下を追加：
- `set_expression` チェック: 「NON_VISUAL_VOCAB_POLICY の3条件を通過しているか」「Template K の {MINIMAL_CONTEXT} が社会的機能を最小限で体現できているか」「感情オーバーレイ記号が3点以内か」
- `non_visual` チェック: 「imageStatus = 'no_image_needed' が設定されているか」「誤って画像生成されていないか」

### 欠落②（必須修正）: ファイル先頭の vocab_type → テンプレート対応表が未更新

ファイル先頭（約172行目）の HOW_TO_USE 説明コメント内の対応表に `set_expression → K` と `non_visual → no_image_needed` が未反映。
**修正内容：** 以下2行を追加：
```
##     set_expression  → K (vocabulary_set_expression) ※ v2.8 新規
##     non_visual      → 生成しない（imageStatus = 'no_image_needed'）※ v2.8 新規
```

### 欠落③（推奨修正）: B-4 多義・同音異義語弁別が不完全

`ADJECTIVE_CATEGORY_MATRIX` に以下が未収録：
- **はやい（速い/早い）2分岐弁別** — 資料B-4の設計仕様を収録する
  - 速い（移動速度）: 動的モーメント、スピードトレイル5本
  - 早い（時間的早期）: 目覚まし時計＋飛び起きる人物＋地平線から1/10の太陽
- **厚い（物理的厚み）** — 資料では `暑い/熱い/厚い` の3分岐弁別として独立設計。v2.8では `physical_size` に誤収録。独立エントリ `physical_thickness` として分離する。

### 欠落④（推奨修正）: B-3 代替提示の具体例が浅い

`NON_VISUAL_VOCAB_POLICY.alternative_presentation.examples` に資料の具体仕様を追加：
- **「ね」（共感アロー）**: 「おいしい」のイラストに「共感アロー（右方向へ緩やかにカーブするピンク色点線矢印）」を伸ばし、隣の人物が同調してうなずく（縦モーションライン）
- **「だいたい」（アイソタイプ統計プロット）**: 10個の皿を一列に並べ、9個にリンゴを載せ1個を空にする。10分の9が満たされている全体量プロット＋不確定範囲アロー（端がギザギザ・グレー）

### 欠落⑤（次チャット以降に段階追加）: GVE30 の 14課分が未収録

30課対応表のうち以下14課がGVE30未収録。**課が進むにつれて追加していく方針でよい。** ただし lesson_02 以降の例文設計時に必要になる課（L3-L5）は優先的に追加すること。

**優先度：高（lesson_02〜L5の例文設計時に必要）**

| 課 | grammarConceptID | 資料のkey_symbol |
|---|---|---|
| 第3課 | kosoado_location（新規）| 立ち位置ピット（丸い台座）＋建物断面図 |
| 第5課 | verb_movement_e | 右向き移動アロー（青・太）＋目的地アイコン |
| 第14課 | te_kudasai | 依頼手差し出し（Initial）→ 応答笑顔（Peak） |
| 第16課 | te_sequential | 3パネル＋インジケータードット（数字不使用） |
| 第13課 | wa_ga_tai | 思考バブルに欲しいオブジェクト（鮮やかな色） |

**優先度：中（L6〜L12で必要）**

| 課 | grammarConceptID | 資料のkey_symbol |
|---|---|---|
| 第8課（形容詞） | adj_i_predicate 等 | GVE30エントリとして追加（ADJECTIVE_CATEGORY_MATRIXへの参照で可） |
| 第17課 | nai_de_kudasai | フラット禁止リング⃠のレイヤー合成 |
| 第18課 | koto_ga_dekiru | 指先から音符が舞い上がる（能力解放） |
| 第19課 | ta_koto_ga_aru | ギザギザ輪郭の思考バブル（古い写真風） |
| 第21課 | plain_to_omou | あご手当てポーズ＋半透明実線バブル |

**優先度：低（L22以降）**

| 課 | grammarConceptID | 備考 |
|---|---|---|
| 第22課 | noun_modification_verb | 入れ子構造（オブジェクト内に購買シーン包摂） |
| 第23課 | toki_present/toki_past | 条件文トポロジー（黄色信号） |
| 第27課 | verb_potential_form | 赤✕vs緑✓対比 |
| 第28課 | te_shimau | 遺憾 Peak→Release（割れグラス＋青い縦線） |

---

## §5. パイプライン現状（v7.0更新）

| 対象 | 状態 |
|---|---|
| マスタープロンプトガイド | ✅ v2.8 確定（B/C層統合済み）。ただし§4の5点欠落あり → v2.9で修正要 |
| S列プロンプト（lesson_01 語彙） | ✅ image_prompts_lesson01_v1_0.json 生成済み（17語・v2.7準拠） |
| lesson_01_v1_1.json vocab_type | ❌ 全17語 null（§3-2の設定値で修正要） |
| lesson_02 S列プロンプト | ⬜ 未着手（lesson_02_v2_11_11.json の vocab_type 設定が先行作業） |
| GAS PERSON_PROFILES["医者"] | ⚠️ clipboard の記述が残存（S列プロンプトが優先されるため現時点は許容） |
| 語彙カード生成（Vocabularyシート） | ✅ GAS実装済み・S列参照・Imagen呼び出し・Drive保存 |
| 例文画像生成（Examplesシート） | ❌ GAS関数なし・設計方針未決定（語彙カード完了後に着手） |

---

## §6. 次チャットの作業順序（v7.0更新）

```
✅ ①〜⑭（v6.0まで）完了
✅ A層矛盾解消・v2.7作成（本チャット）
✅ B/C層統合・v2.8作成（本チャット）
✅ lesson_01 S列プロンプト生成（本チャット）
✅ v2.8 抜け漏れ精査（本チャット）

⬜ v2.9作成（欠落①②③④の修正）← 次チャット最優先
   ①  QA_CHECKLIST に set_expression / non_visual 項目を追加
   ②  ファイル先頭の vocab_type → テンプレート対応表を更新
   ③  ADJECTIVE_CATEGORY_MATRIX に hasYai（速い/早い）と physical_thickness を追加
   ④  NON_VISUAL_VOCAB_POLICY.alternative_presentation.examples に ね / だいたい を追加
   ⑤  GVE30 優先度「高」の5課（第3・5・13・14・16課）を追加

⬜ lesson_01_v1_1.json の vocab_type 設定（17語・§3-2の値で確定）
⬜ ⑮ 1語テスト生成（GAS経由・医者か先生）← テストはv2.9完成後に実施
⬜ ⑱ image_prompts_lesson01_v1_0.json を importImagePromptsFromJson() でS列に投入
⬜ ⑲ generateImageBatch() 実行（lesson_01 17語）
⬜ ⑰ lesson_02 S列プロンプト生成（vocab_type確定後）
⬜ lesson_02_v2_11_11.json の vocab_type 設定（先行作業）
```

---

## §7. 次チャットに渡すファイル（必須）

```
1. master_prompt_design_guide_v2_8.py  ← 本チャット作成・最重要
2. prompt_guide_review_handoff_v7_0.md ← この資料
3. image_prompts_lesson01_v1_0.json    ← lesson_01 S列プロンプト（17語）
4. lesson_01_v1_1.json                 ← vocab_type 設定の対象
5. lesson_02_v2_11_11.json             ← lesson_02 S列生成の対象
6. 日本語教材の視覚エンコーディング方法論.docx ← §4欠落③④⑤の追記作業に必要
```

---

## §8. 重要ルール確認（v7.0確定・全版共通）

```
【肌色】
  汎用人物 → 肌色フレーズを書かない（diverse_unspecified）
  例文人物 → "Gender-neutral avatar, neutral cool light gray skin."
  固定5名  → 各 NAMED_CHARACTER_PROFILES の個別ヒントに従う
  旧フレーズ "Skin tones: naturally warm medium skin tone." は使用禁止（全版共通）

【アスペクト比】
  GAS経由  → 本文にアスペクト比文を書かない（API側で1:1付与）
  手動・例文 → 先頭に "Square 1:1 aspect ratio." / "Wide 16:9 aspect ratio."

【VISUAL_CANON_RULE（v2.6〜）】
  医者   = 白衣 + 聴診器（首）のみ。クリップボード禁止。
  先生   = マーカー または 教科書を持つ。

【vocab_type 設定ゲート（v2.7〜）】
  vocab_type = null のままプロンプト生成を始めない（停止条件）

【画像化不適格語（v2.8〜）】
  接尾辞・接頭辞・文脈依存副詞等 → vocab_type = "non_visual"
  → imageStatus = "no_image_needed"
  → 代替提示: 例文画像のコンテキストに埋め込む

【GVE30 の使い方（v2.8〜）】
  例文画像設計時: grammarConceptID → GRAMMAR_VISUAL_ENCODING_30 参照
  → panels（パネル数）・layout（構図）・visual_symbols（使用記号）・avoid（失敗回避）を確認
  → 未収録のIDが出た場合は人間に確認してから進む（場当たり生成しない）
```

---

## §9. 未解決の事項（v7.0更新）

| 問題 | 状態 | 優先度 |
|---|---|---|
| v2.8 欠落①② QA/ヘッダー対応表 | ⬜ 未修正 | 高（v2.9 で修正） |
| v2.8 欠落③④ はやい弁別/ねだいたい代替 | ⬜ 未修正 | 中（v2.9 で修正） |
| v2.8 欠落⑤ GVE30 14課分未収録 | ⬜ 段階的追加 | 高（優先5課）〜低（残9課） |
| lesson_01_v1_1.json vocab_type=null | ⬜ 17語 null | 高（テスト前に必須） |
| lesson_02 vocab_type 設定 | ⬜ 未着手 | 高（⑰の前に必須） |
| 例文画像の GAS 関数なし | ⚠️ 設計方針未決定 | 高（語彙カード完了後） |
| GAS PERSON_PROFILES["医者"] の clipboard 残存 | ⚠️ 現時点で許容 | 低 |
| テンプレートK〜（GVE30未収録課） | ⬜ 段階追加 | 課進行に応じて |
| N5全412語の S列プロンプト生成 | ⬜ lesson_01/02完了後 | 中 |

---

*v1.0〜v6.0：2026-05-18（各チャット）*
*v7.0 更新：2026-05-19（A層矛盾解消・v2.7、B/C層統合・v2.8、lesson_01 S列生成、抜け漏れ精査）*
*根拠：Deep Research「日本語教材の視覚エンコーディング方法論.docx」・本チャット全作業記録*
*次チャットで使用：master_prompt_design_guide_v2_8.py + この資料 + image_prompts_lesson01_v1_0.json + lesson_01/02 JSON*
