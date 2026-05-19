# 進捗引き継ぎ資料
**作成日：2026-05-19（v8.0）**
**このチャットでの作業完了分 + 次チャットへの申し送り**

---

## §0. 最新状況サマリー（v8.0時点・最重要）

```
現行ファイル : master_prompt_design_guide_v2_9.py（4,094行）
GASスクリプト: 整理・修正完了（v7.1ベース → 欠落修正済み）
ステータス   : GEMINI_API_KEY エラーで testSingleImage() が未完了
               → APIキーを確認・再設定してから再実行する

次の作業順序:
  ① GEMINI_API_KEY を確認・修正（§4参照）
  ② testSingleImage() で word_先生 を1語テスト生成
  ③ 成功後、importImagePromptsFromDriveJson() でS列投入
  ④ generateImageBatch() で lesson_01 17語バッチ生成
  ⑤ lesson_02 も同様に実施
```

---

## §1. このチャットで完了した作業

### 1-1. master_prompt_design_guide_v2_9.py（欠落5点修正）

v2.8 の既知欠落をすべて修正。

| 欠落 | 修正内容 |
|---|---|
| ① | `QA_CHECKLIST.vocab_type_check` に `set_expression`・`non_visual` チェック項目追加 |
| ② | ファイル先頭コメントの vocab_type → テンプレート対応表に `K`・`no_image_needed` 追記 |
| ③ | `ADJECTIVE_CATEGORY_MATRIX` に `physical_thickness`（厚い）・`speed_velocity`（速い）・`speed_early_time`（早い）追加 |
| ④ | `NON_VISUAL_VOCAB_POLICY` に「ね」共感アロー・「だいたい」アイソタイプの具体設計を追記 |
| ⑤ | `GRAMMAR_VISUAL_ENCODING_30` に優先度「高」5課追加（第3・5・13・14・16課） |

### 1-2. lesson_01_v1_2.json（vocab_type 設定完了）

全17語に `vocab_type` フィールドを追加。

```
医者・会社員・学生・大学生・先生・国籍7語 → "person"
病院・学校・銀行・大学・デパート         → "building"
```

### 1-3. lesson_02_vocab_typed.json（vocab_type 設定完了）

全18語に `vocab_type` フィールドを追加。

```
concrete_object: 時計・腕時計・ペン・鉛筆・ケータイ・本・雑誌・新聞・かばん・消しゴム・山・犬・写真（13語）
building:        ビル・病院・市役所（3語）
person:          人・わたし（2語）
```

### 1-4. image_prompts_lesson02_v1_0.json（S列プロンプト生成完了）

lesson_02 全18語の画像生成プロンプト JSON を生成。v2.9準拠。

### 1-5. GASスクリプト整理・修正（9件）

| # | 種類 | 内容 |
|---|---|---|
| 1 | 削除 | `buildWavBlob_()` – 死に体コード |
| 2 | 削除 | `columnLetter_()` – 未使用 |
| 3 | 削除 | `fixExamplesData()` – 旧バグ応急処置 |
| 4 | 削除 | `resetAllImagesToPendingForKaggle()` – 不要 |
| 5 | 削除 | `importImagePromptsFromJson()`（旧版） |
| 6 | 削除 | 重複 `checkStyleRecipe()` |
| 7 | 修正 | `STYLE_RECIPE` から `"Skin tones: naturally warm medium skin tone."` 削除 |
| 8 | 修正 | `PERSON_PROFILES["医者"]` から `"holding a clipboard"` 削除 |
| 9 | 追加 | `importImagePromptsFromDriveJson()` – Drive上JSONをS列に投入する新関数 |

### 1-6. S列データ入力規則エラーの解決

S列に誤ってN列の入力規則が適用されていた問題を解決。
`clearImagePromptColumnValidation()` 関数または手動削除で対応。

---

## §2. 現在止まっている箇所

`testSingleImage()` 実行時に **HTTP 400: API key not valid** エラーが発生。

```
❌ エラー: word_先生 → HTTP 400: API key not valid.
```

**原因の候補（§4で確認手順）：**
- `GEMINI_API_KEY` が ScriptProperties に未設定
- キーの値が正しくない（コピーミス・余分なスペース等）
- GCP コンソール発行のキーを誤って使っている（Imagen は AI Studio キーが必要）

---

## §3. 生成済みファイル一覧

| ファイル名 | 内容 | 状態 |
|---|---|---|
| `master_prompt_design_guide_v2_9.py` | プロンプト設計書（4,094行） | ✅ 完成 |
| `lesson_01_v1_2.json` | lesson_01 vocab_type設定済み | ✅ 完成 |
| `lesson_02_vocab_typed.json` | lesson_02 vocab_type設定済み | ✅ 完成 |
| `image_prompts_lesson01_v1_0.json` | lesson_01 S列プロンプト17語 | ✅ 完成（前チャット） |
| `image_prompts_lesson02_v1_0.json` | lesson_02 S列プロンプト18語 | ✅ 完成 |

---

## §4. 次チャットの最優先作業（APIキー修正）

### ステップ1：現状確認

GASエディタで以下を実行してキーの状態を確認。

```javascript
function checkApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!key) {
    Logger.log("❌ GEMINI_API_KEY が設定されていません");
  } else {
    Logger.log("✅ キーの先頭5文字: " + key.substring(0, 5) + "...");
    Logger.log("✅ キーの長さ: " + key.length + "文字");
  }
}
```

### ステップ2：キーを再設定

```
GASエディタ
  → 左メニュー「⚙ プロジェクトの設定」
  → 「スクリプト プロパティ」タブ
  → GEMINI_API_KEY の値を更新

キー取得先: https://aistudio.google.com/app/apikey
           ↑ GCP コンソールではなく AI Studio から取得すること
```

### ステップ3：テスト → バッチ生成

```
testSingleImage()                   ← word_先生 1語テスト
  ↓ 成功（✅）
importImagePromptsFromDriveJson()   ← S列にプロンプト投入
  ↓ ※ PROMPT_JSON_FILE_ID の設定が必要（§5参照）
generateImageBatch()                ← lesson_01 17語バッチ生成
  ↓ 完了
lesson_02 も同様に実施
```

---

## §5. importImagePromptsFromDriveJson() の使い方

```
1. image_prompts_lesson01_v1_0.json を Google Drive にアップロード

2. ファイルを右クリック → 「リンクをコピー」
   URL: https://drive.google.com/file/d/【ここがファイルID】/view

3. GASスクリプトの importImagePromptsFromDriveJson() 冒頭を編集:
   const PROMPT_JSON_FILE_ID = "ここにファイルIDを貼り付ける";

4. importImagePromptsFromDriveJson() を実行

5. Vocabulary シートの S列を確認
   → 各語彙行に長い英語テキストが入っていればOK
```

---

## §6. lesson_02 の特記事項

S列投入・バッチ生成時に注意：

| 語 | 注意点 |
|---|---|
| 病院 | lesson_01 と同じ画像を流用してもよい。生成をスキップする場合は imageStatus を `approved` にする |
| わたし | 自己指示ジェスチャー（胸に手を当てる）で生成。想定外の結果が出たら `retryImages(["word_わたし"])` で再生成 |
| 山 | 建物グループの語だが vocab_type=concrete_object で設計（遠景ランドマーク） |

---

## §7. 未解決の事項

| 問題 | 優先度 | 対処方針 |
|---|---|---|
| GEMINI_API_KEY 無効 | 🔴 最優先 | AI Studio でキーを再取得・再設定 |
| lesson_01 画像生成未実施 | 🔴 次 | APIキー修正後に testSingleImage() → generateImageBatch() |
| lesson_02 画像生成未実施 | 🟠 その後 | lesson_01 完了後に実施 |
| 例文画像の GAS 関数なし | 🟡 中 | 語彙カード完了後に設計 |
| GVE30 残り14課未収録 | 🟡 中 | 課進行に応じて段階追加 |
| BUILDING_CUES に ビル・市役所 未登録 | 🟢 低 | S列プロンプトが優先されるため現時点は不要 |

---

## §8. 重要ルール確認（v2.9確定・全版共通）

```
【肌色】
  汎用人物 → 肌色フレーズを書かない（diverse_unspecified）
  例文人物 → "Gender-neutral avatar, neutral cool light gray skin."
  固定5名  → 各 NAMED_CHARACTER_PROFILES の個別ヒントに従う
  旧フレーズ "Skin tones: naturally warm medium skin tone." は使用禁止

【アスペクト比】
  GAS経由  → 本文にアスペクト比文を書かない（API側で1:1付与）
  手動・例文 → 先頭に "Square 1:1 aspect ratio." / "Wide 16:9 aspect ratio."

【VISUAL_CANON_RULE】
  医者   = 白衣 + 聴診器（首）のみ。クリップボード禁止。
  先生   = マーカー または 教科書を持つ。

【vocab_type 設定ゲート】
  vocab_type = null のままプロンプト生成を始めない（停止条件）

【S列プロンプト優先】
  generateImageBatch() は S列が埋まっている場合は S列を最優先で使用
  S列が空の場合のみ vocab_type からテンプレート自動生成にフォールバック
```

---

## §9. 次チャットに渡すファイル（必須）

```
1. master_prompt_design_guide_v2_9.py  ← 最重要・プロンプト設計のSSOT
2. image_prompts_lesson01_v1_0.json    ← S列投入用（前チャット生成）
3. image_prompts_lesson02_v1_0.json    ← S列投入用（このチャット生成）
4. lesson_01_v1_2.json                 ← vocab_type 設定済み
5. lesson_02_vocab_typed.json          ← vocab_type 設定済み
```

---

*v7.0：2026-05-19（A層矛盾解消・v2.7、B/C層統合・v2.8、lesson_01 S列生成、抜け漏れ精査）*
*v8.0：2026-05-19（v2.9作成、lesson_01/02 vocab_type設定、lesson_02 S列生成、GAS整理、APIキーエラー発生）*
