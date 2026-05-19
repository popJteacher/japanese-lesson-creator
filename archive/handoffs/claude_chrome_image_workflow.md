# Claude in Chrome 画像生成ワークフロー
## 日本語教材 AI画像生成 操作手順書
**対象モデル**: Gemini 2.0 Flash Experimental（AI Studio）  
**使用理由**: API コスト削減。無料枠を毎月使い倒して少しずつ積み上げる方針。  
**v2.4ガイド準拠**: GEMINI_STABILIZATION（最大4ターン/セッション）・vocab_type_check・QA_CHECKLIST

---

## 0. このファイルの使い方

このファイルを Claude in Chrome のチャットに貼り付けて起動します。  
毎回のセッション開始時に「**Section 1 の起動コマンド**」をコピーして貼るだけで OK です。

---

## 1. セッション開始コマンド（毎回ここをコピーして Claude in Chrome に貼る）

```
以下の手順書に従って、日本語教材の画像生成作業を進めてください。

【今日の作業対象】
- registry ファイル: master_image_registry.json（Google Drive / プロジェクト）
- 対象 Lesson: Lesson __ （___ ファイル名: image_prompts_lesson__.json）
- 画像保存先フォルダ: [Google Drive フォルダ URL をここに貼る]
- 1セッションで生成する枚数: 最大4枚（セッション管理ルール参照）

【手順】
1. image_prompts_lesson__.json を開いて status: "pending" のエントリを確認する
2. 最初の未処理エントリから順に Google AI Studio で生成する
3. 生成後は画像を指定フォルダに保存し、registry を更新する
4. 4枚生成したらセッションをリセットして報告する

詳細手順は以下のワークフロー文書に従うこと。
セッションルール（最大4ターン）は必ず守ること。
```

---

## 2. 前提条件（ユーザーが事前に準備するもの）

| 必要なもの | 場所 | 状態 |
|---|---|---|
| `master_image_registry.json` | Google Drive / プロジェクト | 最新版 |
| `image_prompts_lessonNN.json` | Google Drive | 当該 Lesson 分 |
| 画像保存先フォルダ | Google Drive | 作成済み |
| Google AI Studio | aistudio.google.com | ログイン済み |

### image_prompts_lessonNN.json の必須フィールド

```json
{
  "vocab_時計": {
    "imageId": "vocab_時計",
    "filename": "vocab_時計.png",
    "vocab_type": "concrete_object",
    "status": "pending",
    "prompt": "[PURPOSE]\nCreate a vocabulary card illustration...\n（v2.4テンプレートで生成したプロンプト全文）"
  },
  "ex_L02_001": {
    "imageId": "ex_L02_001",
    "filename": "ex_L02_001.png",
    "vocab_type": "example_sentence",
    "status": "pending",
    "prompt": "..."
  }
}
```

---

## 3. Claude in Chrome が行う全体フロー

```
セッション開始
  ↓
[Step A] image_prompts_lessonNN.json を読み込む
  ↓
status: "pending" のエントリを確認（最大4件をこのセッションで処理）
  ↓
[Step B] Google AI Studio を開く → New Chat → モデル設定
  ↓
[Step C] 1枚ずつ生成（最大4枚）
  ├─ プロンプト貼り付け → 生成 → QA チェック → 保存
  └─ 4枚完了 or ドリフト検知 → Step D へ
  ↓
[Step D] セッションリセット（New Chat）
  ↓
[Step E] registry + prompts JSON を更新
  ↓
報告: 何件生成したか、失敗・スキップはあるか
```

---

## 4. Step B: Google AI Studio の設定

1. `https://aistudio.google.com` を開く
2. **「New Chat」** をクリック（必ず新規チャットから開始）
3. モデルを **「Gemini 2.0 Flash Experimental」** に設定
   - 右上のモデル選択から「Gemini 2.0 Flash Experimental」を選ぶ
   - 画像生成に対応したモデルであることを確認
4. 設定:
   - Temperature: デフォルトのまま
   - Output: Image + Text（画像生成モードを有効にする）

---

## 5. Step C: 1枚あたりの生成手順

### 5-1. プロンプト投入

1. `image_prompts_lessonNN.json` の対象エントリの `prompt` フィールドをコピー
2. AI Studio のチャット入力欄に貼り付け
3. 送信（Enter または送信ボタン）
4. 生成完了まで待つ（通常 15〜40 秒）

### 5-2. QA チェック（生成結果の確認）

生成された画像に対して以下を確認する（**1秒テスト**: 一瞬見て意味が伝わるか）

**全テンプレート共通**
- [ ] グラデーション・影が入っていないか（フラットベクター維持）
- [ ] 文字・数字が画像内に入っていないか（建物の1語看板・矢印を除く）
- [ ] 輪郭線の太さが均一か

**vocab_type 別チェック**
| vocab_type | 確認ポイント |
|---|---|
| `person` | 役割が服装・持ち物だけで即わかるか |
| `building` | 施設の種類が外観だけでわかるか |
| `concrete_object` | 類似物体と区別できるか（視覚シグネチャーが見えるか） |
| `action_verb` | 何をしているか 1 秒で理解できるか |
| `example_sentence` | S+V+O の関係が視覚的に明確か |

### 5-3. 判定と処理

**OK の場合**
1. 画像を右クリック → ダウンロード
2. ファイル名を `filename` フィールドの値に変更（例: `vocab_時計.png`）
3. Google Drive の画像保存先フォルダにアップロード
4. アップロード後、Drive の共有リンクを取得（`https://drive.google.com/uc?id=...` 形式）

**NG の場合（1回まで再試行）**
1. 崩れた属性を特定してプロンプトに追記
   - 例: 「グラデーションが入った → "Apply ZERO gradients, ZERO shadows" を先頭に追加」
   - 例: 「シグネチャーが消えた → VISUAL_SIGNATURE の記述を強調」
2. 再生成（これも1ターンとしてカウント）
3. 2回試みてもNGなら `status: "skip"` で記録してスキップ

---

## 6. セッション管理ルール（v2.4 GEMINI_STABILIZATION より）

### 最大 4 ターン/セッション

```
ターン1: 1枚目を生成
ターン2: 2枚目を生成
ターン3: 3枚目を生成
ターン4: 4枚目を生成
→ 必ず New Chat でセッションリセット
```

- 再生成もターン数にカウントする
- 4ターン到達前でも以下に該当したら即リセット

### ドリフト検知シグナル（1つでも該当したらリセット）

| シグナル | 説明 |
|---|---|
| 線画がスケッチ風に | 輪郭線が細かくなる・ハッチングが入る |
| 3D陰影が追加された | 影・ハイライトが自発的に追加される |
| 色がずれてきた | スキントーン・服の色が初回と微妙に違う |
| 構図が変わった | フレーム占有率が著しく変化している |

### セッションリセット手順

1. AI Studio で **「New Chat」** をクリック
2. 新しいチャットで同じモデル設定を確認
3. 次のプロンプトから通常通り続ける

---

## 7. Step E: ファイルの更新

### image_prompts_lessonNN.json の更新

生成完了したエントリの `status` を変更:

```json
"vocab_時計": {
  "imageId": "vocab_時計",
  "filename": "vocab_時計.png",
  "vocab_type": "concrete_object",
  "status": "generated",          ← "pending" から変更
  "generatedAt": "2026-05-XX",    ← 生成日を記入
  "imageUrl": "https://drive.google.com/uc?id=XXXX",  ← Drive URL
  "prompt": "..."
}
```

### master_image_registry.json の更新

対応するエントリを同様に更新:

```json
"vocab_時計": {
  ...
  "status": "generated",           ← "pending" から変更
  "images": [
    {
      "imageId": "vocab_時計_001",
      "filename": "vocab_時計.png",
      "imageUrl": "https://drive.google.com/uc?id=XXXX",   ← 追記
      "promptRef": "image_prompts_lesson2.json#vocab_時計",
      "generatedAt": "2026-05-XX",                         ← 追記
      "regenerate": false
    }
  ]
}
```

---

## 8. 特殊エントリの扱い

### `char_einstein_style`（character_asset）

著名人風キャラ素材。通常の vocab テンプレートとは異なる。  
promptRef のプロンプトをそのまま使用するが、生成結果の「顔の類似性」に注意。  
肖像権の観点から、実在する特定の人物に似せすぎないよう確認すること。

### `famous_persons_grid`（special_grid_image）

複数人物を並置するグリッド画像。  
プロンプトに格子状配置の指示が含まれているか確認してから生成。

---

## 9. トラブル対応

| 症状 | 原因 | 対処 |
|---|---|---|
| 画像が生成されない | モデルが画像非対応 | モデルを「Gemini 2.0 Flash Experimental」に変更 |
| 毎回スタイルがバラバラ | セッションドリフト | 即 New Chat でリセット |
| 手が変形している | AI の手生成失敗 | プロンプトに「simplified schematic hand」を追記、または OBJECT_ALONE に切り替え |
| 文字が画像に入る | constraints が効いていない | [CONSTRAINTS] ブロックの先頭に "NO TEXT WHATSOEVER" を追加 |
| ダウンロードできない | Drive の権限設定 | 保存先フォルダの権限を確認 |

---

## 10. セッション終了の報告フォーマット

作業終了時に Claude in Chrome が報告する内容:

```
【本日の作業報告】
対象 Lesson: Lesson 02
生成完了: X件
  - vocab_時計.png ✓
  - vocab_腕時計.png ✓
  - ...
スキップ（QA NG）: X件
  - ex_L02_XXX（理由: ）
セッション数: X セッション（合計 Xターン）

残り pending: X件
次回推奨開始エントリ: XXXX
```

---

## 11. Lesson 03 以降への適用

新しい Lesson の画像生成を始めるときの手順:

### Step 1: lesson_NN.json に vocab_type を設定
```json
"vocabulary": [
  {
    "word": "食堂",
    "vocab_type": "building",     ← 必須（v2.4 より）
    "imageId": "vocab_食堂"
  }
]
```

### Step 2: master_prompt_design_guide_v2_4.py を参照してプロンプトを作成
vocab_type → テンプレート対応表:
- `person` → テンプレート A
- `building` → テンプレート B（+ BUILDING_CUES）
- `concrete_object` → テンプレート D（HAND_HOLDING 戦略も検討）
- `adjective` → テンプレート J（v2.4 新規）
- `action_verb` → テンプレート H（SEQUENCE_3PANEL も検討）
- `spatial_relation` → テンプレート F
- `demonstrative` → テンプレート G（モデルを1つだけ選ぶ）
- `abstract_concept` → テンプレート I

### Step 3: image_prompts_lessonNN.json を作成して Google Drive に保存
（Section 2 のフォーマット参照）

### Step 4: master_image_registry.json に新規エントリを追加（status: "pending"）

### Step 5: このワークフロー文書の Section 1 コマンドを使ってセッション開始

---

## 12. 進捗トラッカー（更新しながら使う）

| Lesson | 総件数 | 生成済 | 残り | 最終更新 |
|---|---|---|---|---|
| Lesson 01 | 18件 | 18件 ✅ | 0件 | 2026-05-12 |
| Lesson 02 | 30件 | 0件 | 30件 | — |
| Lesson 03 | — | — | — | — |

---

*このファイルは Google Drive に保存して、Claude in Chrome のセッション開始時に参照すること。*  
*master_prompt_design_guide_v2_4.py と合わせて使用。*
