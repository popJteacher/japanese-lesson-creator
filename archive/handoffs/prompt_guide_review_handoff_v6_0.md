# プロンプトガイド レビュー・方針整理 引き継ぎ資料
**作成日：2026-05-18（v1.0）→ … → 更新：2026-05-18（v5.0）→ 更新：2026-05-18（v6.0）**
**対象チャット（v6.0）：医者画像の品質問題分析・v2.5.1横断確認・v2.6作成・肌色/アスペクト比問題の根本解明**
**前提資料：prompt_guide_review_handoff_v5_0.md / master_prompt_design_guide_v2_5_1.py**

---

## ⚠️ この資料の位置づけ

v5.0 からの差分のみ記載する。v1.0〜v5.0 の内容は `prompt_guide_review_handoff_v5_0.md` を参照。

- v6.0（本更新）：医者画像の品質問題の根本分析・v2.5.1横断確認・v2.6作成・肌色/アスペクト比問題の解明

---

## §0. 最新状況サマリー（v6.0時点・最重要）

```
現行ファイル : master_prompt_design_guide_v2_6.py（2810行・v2.5ベース + 3改善）
前バージョン : master_prompt_design_guide_v2_5_1.py（v5.0時点の確定版）
ステータス   : GASパイプライン経由での S列プロンプト生成待ち
次の作業     : v2.6（または v2.5.1）でlesson_01/02 S列プロンプトをJSON形式で生成
               → importImagePromptsFromJson() でS列に投入
               → generateImageBatch() 実行
```

**v6.0 で実施したこと：**

1. 医者画像（旧3枚 vs v2.5.1生成物）の品質差の根本原因を分析
2. v2.5.1 の横断的差分確認（v2.5との diff 完全取得）
3. v2.9の有益な改善3点を選択的に取り込んだ **v2.6 を作成**
4. v2.5 / v2.5.1 それぞれで医者プロンプトを生成・テスト
5. 肌色固定・アスペクト比問題の根本原因を GAS コードから特定

---

## §1. 医者画像の品質問題分析（v6.0新規）

### 1-1. 比較対象

| ファイル名 | 生成元 | 評価 |
|---|---|---|
| vocab_医者.png（医者1） | v7プロンプト・GAS経由 | 良い（アジア系・正面） |
| vocab_医者_2_.png（医者2） | v7プロンプト・GAS経由 | **最も好評・方針転換直前** |
| vocab_医者_1_.png（医者3） | v7プロンプト・GAS経由 | 良い（女性・正面） |
| Gemini_Generated_Image（v2.5.1） | v2.5.1プロンプト・手動 | 劣化 |

### 1-2. 医者2が好まれた理由の診断（3点）

**① クリップボードが視覚ノイズになっていた**
- `ROLE_BASED_GENERIC_PROFILES.doctor` に `"may carry a clipboard"` が記述されており、v2.5.1生成時にGeminiに採用された
- 語彙カードの目的（「医者」を一瞬で伝える）には白衣＋聴診器だけで十分
- v7プロンプトにはクリップボード記述がなかったため、医者1〜3にはクリップボードが出なかった

**② カメラアングルの差**
- v7プロンプト（医者1〜3）：旧仕様の `Eye-level camera angle`（ほぼ正面）
- v2.4以降のTemplate A：`HORIZONTAL 3/4 view at EYE LEVEL`（斜め前方）
- 語彙カードとしては正面向きのほうがアイコン的な明快さがある

**③ カラーパレットの単調化**
- 医者2：白コート + 青スクラブ + タンパンツ（3色コントラスト）
- v2.5.1生成物：白コート + 白パンツ系（メリハリが薄い）
- アンバーゴールドがパンツや服色に誤適用される問題も発生

---

## §2. v2.5.1横断確認の結果（v6.0新規）

### 2-1. diff結果（v2.5 vs v2.5.1）

**差分はhexの`#`除去のみ。構造・テンプレート・プロファイルはすべて100%同一。**

```python
# v2.5（変更前）
"similar to #FBFBFB, hex value FBFBFB"

# v2.5.1（変更後）
"similar to FBFBFB, hex value FBFBFB"
```

変更箇所：STYLE_BIBLE.color_palette（5色）＋テンプレートA〜JのSTYLE RECIPEブロック（計31箇所）のみ。

### 2-2. v2.9との比較で判明した事実

v2.9は「v2.5の拡張」ではなく**「v2.5を参照ファイルとして使うオーバーレイ設計」**。
テンプレートA〜Jの本体を含まず、v2.5を同時参照することが前提。

v2.9で解決されていたが、v2.5.1回帰時に失われた改善が3点あった（→§3で対処済み）。

---

## §3. v2.6 の作成（v6.0新規）

### 3-1. 作成方針

v2.5.1をベースに、v2.9の改善点のうち**副作用リスクが低く効果が明確な3点のみ**を選択的に取り込む。

### 3-2. v2.6の3つの変更

**変更[1]：STYLE_RECIPEのhex値を完全除去（色名のみに統一）**

```python
# v2.5.1（変更前）― 冗長な二重指定が残存
"similar to FBFBFB, hex value FBFBFB"

# v2.6（変更後）― 色名のみ
"soft cream white background"
"deep slate navy outlines"
"muted warm blue as main fill"
"warm amber gold as accent"
```

全テンプレートSTYLE RECIPEブロック（31箇所）を一括変更。
根拠：v2.9実測で色名のみでも品質維持を確認済み。冗長トークンを削減。

---

**変更[2]：肌色をSTYLE_RECIPEから分離（PART 2.4 CHARACTER_RENDERING_POLICY 新設）**

STYLE_BIBLE.color_palette から `skin_tones` フィールドを削除し、vocab_type別に分類した独立セクションとして移動。

```python
CHARACTER_RENDERING_POLICY = {
  "warm_skin_realistic":    { "applies_to": ["person", "building", "family"], ... },
  "neutral_avatar_abstract": { "applies_to": ["example_sentence", "pronoun", ...], ... },
  "context_dependent":      { "applies_to": ["concrete_object", "action_verb", ...], ... },
}
```

根拠：語彙カード（暖色肌）と例文画像（グレーアバター）で肌色ルールが異なるため、STYLE_RECIPEへの混在は誤適用の原因になる。

---

**変更[3]：VISUAL_CANON_RULE 新設（PART 1.1）+ doctorプロファイル修正**

語彙ごとのカノニカルな視覚アイデンティティを固定するルールを明記。

```
役割      コアアイテム（MUST）              禁止小道具（MUST NOT）
医者      白衣 ＋ 聴診器（首にかける）      クリップボード・聴診器以外の医療器具
先生      マーカー または 教科書を持つ      ─
```

`ROLE_BASED_GENERIC_PROFILES.doctor` を修正：

```python
# v2.5.1（変更前）
"may carry a clipboard, otoscope, or pen"

# v2.6（変更後）
"stethoscope around the neck — THIS IS THE ONLY REQUIRED PROP"
"DO NOT add clipboard, otoscope, pen, or any other props"
```

---

### 3-3. v2.6 の注意点

- GASの `generateImages.gs` の `PERSON_PROFILES["医者"]` には `holding a clipboard` が**まだ残っている**
- ユーザー判断により現時点では修正対象外
- v2.6はプロンプトガイドの修正であり、GASコード本体は別途対応が必要

---

## §4. 肌色・アスペクト比問題の根本解明（v6.0新規）

### 4-1. アスペクト比が16:9になった原因

**GASを経由せず手動でGeminiに直接プロンプトを入力したため。**

GASの `generateImages.gs` は APIパラメータで `ASPECT_RATIO: "1:1"` を設定している。
手動生成ではこのパラメータが存在しないため、Geminiがデフォルトの16:9を採用した。

```javascript
// generateImages.gs L61
ASPECT_RATIO: "1:1",  // ← GAS経由なら必ず1:1になる
```

→ **GAS経由で生成すれば自動的に1:1になる。手動生成時は `Square 1:1 aspect ratio.` を先頭に追加する（v5.0 §4 参照）。**

---

### 4-2. 肌色が褐色に固定された原因

**v2.4・v2.5・v2.5.1のすべてで、Template Aの[CONSTRAINTS]に肌色指定は存在しない。**

```python
# v2.4/v2.5/v2.5.1 共通 Template A [CONSTRAINTS]
"No text, no letters, no numbers, no symbols inside the image."
"No gradients, no shadows, no 3D effects, no photoreal textures."
"Apply zero ambient lighting, zero drop shadows, zero global illumination."
# ← 肌色の記述なし
```

GASの `buildPersonPrompt_` にも肌色指定はない。

旧3枚（医者1〜3）がバラバラだったのは、GAS経由・肌色指定なしのため**Geminiが自由解釈した結果**。
v2.5/v2.5.1テスト時に褐色で固定されたのは、**Claude（私）が手動プロンプト生成時に `Skin tones: naturally warm medium skin tone.` を追記したため**。

### 4-3. 肌色に関する3バージョンの差分

| バージョン | Template A [CONSTRAINTS]内の肌色指定 | STYLE_BIBLEの skin_tones フィールド |
|---|---|---|
| v2.4 | **なし** | あり（参照用） |
| v2.5 | **なし** | あり（参照用） |
| v2.5.1 | **なし** | あり（参照用） |
| v2.6 | **なし** | 削除・CHARACTER_RENDERING_POLICYに移動 |

**3バージョン間に実質的な差はない。**

### 4-4. 多様な国籍の生徒への対応

肌色指定をプロンプトに追記しなければ、Geminiが自動的に多様な肌色を生成する。
GAS経由で生成する限り、`Skin tones: ...` の行を追加しない限り固定されない。
多様な学習者を想定した多様な肌色表現を維持するには、**肌色指定をプロンプトに入れないこと**が方針として確認された。

---

## §5. 医者プロンプトの生成結果（v6.0新規）

### 5-1. v2.6準拠プロンプト

テンプレートA・VISUAL_CANON_RULE・CHARACTER_RENDERING_POLICY を適用済み。
クリップボード禁止・肌色指定なし・hex値なし。

### 5-2. v2.5準拠プロンプト

テンプレートA適用・hex値あり（v2.5仕様通り）・クリップボード禁止なし（ROLE_BASED_GENERIC_PROFILESのまま）。

→ **次チャットでGAS経由での生成テストを推奨。**

---

## §6. パイプライン現状（v6.0更新）

| 対象 | 状態 |
|---|---|
| 語彙カード生成（Vocabularyシート） | ✅ GAS実装済み・S列参照・Imagen呼び出し・Drive保存 |
| 例文画像生成（Examplesシート） | ❌ GAS関数なし・設計方針未決定 |
| S列プロンプトの内容 | ⚠️ lesson_01/02 未生成（次チャットで着手） |
| マスタープロンプトガイド | ✅ v2.6 確定（v2.5.1ベース + 3改善） |
| GAS PERSON_PROFILES["医者"] | ⚠️ clipboardの記述が残存（現時点では修正対象外） |

---

## §7. 次チャットの作業順序（v6.0更新）

```
✅ ① v1.0〜⑪（v5.0まで）完了
✅ ⑫ 医者画像品質分析・v2.5.1横断確認（本チャット）
✅ ⑬ v2.6作成（本チャット）
✅ ⑭ 医者プロンプト生成・テスト・肌色/アスペクト比問題解明（本チャット）
⬜ ⑮ v2.6 GAS経由での1語テスト生成（色品質・肌色・アスペクト比の確認）
⬜ ⑯ lesson_01（17語）S列プロンプト生成（v2.6使用）← 次チャット最優先
⬜ ⑰ lesson_02（18語）S列プロンプト生成
⬜ ⑱ importImagePromptsFromJson() でS列に投入
⬜ ⑲ generateImageBatch() 実行
⬜ ⑳ N5全412語のS列プロンプト生成（50語単位）
```

---

## §8. 次チャットに渡すファイル（必須）

```
- master_prompt_design_guide_v2_6.py（本チャットで作成・最重要）
- prompt_guide_review_handoff_v6_0.md（この資料）
- lesson_01_v1_1.json（S列生成の語彙ソース）
- lesson_02_v2_11_11.json（S列生成の語彙ソース）
```

---

## §9. 未解決の事項・今後の課題（v6.0更新）

| 問題 | 状態 | 優先度 |
|---|---|---|
| v2.6 GAS経由テスト生成で品質確認 | ⬜ 未着手 | 高（⑮で確認推奨） |
| lesson_01/02 S列プロンプト生成 | ⬜ 未着手 | 最高（⑯〜⑰） |
| 例文画像の設計方針未決定 | ⚠️ 要決定 | 高（語彙カード完了後） |
| GAS PERSON_PROFILES["医者"] のclipboard残存 | ⚠️ 現時点で対応不要 | 低 |
| テンプレートK〜T の品質検証未実施 | 保管 | 低（lesson_03以降） |
| GRAMMAR_PATTERNS_C 41件の実生成品質未検証 | 保管 | 低（例文画像方針決定後） |
| 手動生成時の `Square 1:1` 追加ルール | ✅ v5.0 §4 に記載済み | 完了 |

---

## §10. 重要ルール確認（肌色・アスペクト比）

```
【アスペクト比】
  ✅ GAS経由 → 自動的に1:1（ASPECT_RATIO: "1:1"）
  ⚠️ 手動生成 → 16:9になる → 先頭に "Square 1:1 aspect ratio." を追加

【肌色】
  ✅ プロンプトに肌色指定なし → Geminiが自然に多様な肌色を生成
  ⚠️ "Skin tones: naturally warm medium skin tone." を追記すると褐色に固定される
  ✅ 多様な国籍の生徒を想定する本プロジェクトでは「肌色指定なし」が正しい方針

【VISUAL_CANON_RULE（v2.6）】
  医者 = 白衣 + 聴診器のみ。クリップボード禁止。
  これはプロンプトガイド（v2.6）に記載済み。
  GAS PERSON_PROFILES["医者"] には未反映（現時点対応不要）。
```

---

*v1.0〜v5.0：2026-05-18（各チャット）*
*v6.0 更新：2026-05-18（医者品質分析・v2.6作成・肌色/アスペクト比解明チャット）*
*根拠：v2.5.1 diff確認・generateImages.gs コード精査・Gemini生成テスト結果分析*
*次チャットで使用：master_prompt_design_guide_v2_6.py + この資料 + lesson_01/02 JSON*
