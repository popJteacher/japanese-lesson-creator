# 引き継ぎ資料：GASパイプライン 完全版
**バージョン：v8.0（2026-05-16）**
**前バージョン：gas_pipeline_handoff_v7.md**

---

## このプロジェクトの位置づけ（毎回確認）

```
【japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTMLを生成するWebツール
  → Plan_v1_1.md に従って Stage を進行中

【GASパイプライン】（本資料のスコープ）
  語彙・例文の画像・音声を自動生成してGoogle Driveに蓄積する
  → master_image_registry.json / master_audio_registry.json にURLを記録

【連携インターフェース】
  master_image_registry.json → image_resolver.js → slide_html.js
  master_audio_registry.json → homework_html.js（将来）
```

---

## 現在の状態（2026-05-16 深夜時点）

### ✅ 完了済み

| ステップ | 内容 | 状態 |
|---|---|---|
| setupAll() | Vocabulary / Examples / Log シート作成 | ✅ 完了 |
| seedAll() | lesson_01 語彙17語・例文15件投入 | ✅ 完了 |
| extractN5() | N5語彙412語追加 | ✅ 完了 |
| importLesson01() | 国籍語彙7語（全て既存でスキップ） | ✅ 完了 |
| タイマートリガー登録 | 8本すべて登録済み | ✅ 完了 |
| STYLE_RECIPE完全化 | sub_color / skin_tones 追加 | ✅ 完了 |
| OBJECT_SIGNATURES追加 | concrete_object 識別シグネチャー辞書 | ✅ 完了 |
| ABSTRACT_METAPHORS追加 | 抽象概念メタファー辞書 | ✅ 完了 |
| vocab_type空の語彙を画像生成スキップ | getPendingImageRows_() に条件追加 | ✅ 完了 |
| 音声発音修正 | TTS に日本語指示プレフィックス追加 | ✅ 完了 |

### 🔄 自動実行中（タイマーで進行中）

| トリガー | 関数 | 頻度 | 状態 |
|---|---|---|---|
| classifyBatch | Gemma 4 で en/vocab_type を付与 | **毎時** | 🔄 実行中（約3語/時） |
| generateImageBatch | Imagen 4 で語彙画像を生成 | 毎日 9:00・13:00・17:00 | 🔄 実行中 |
| generateAudioBatch | Gemini TTS で音声を生成 | 毎日 10:00・14:00・18:00 | 🔄 実行中 |
| syncAll | registry.json に書き戻し | 毎日 23:00 | 🔄 実行中 |

### ⏳ 自動完了待ち

| 項目 | 残件数（2026-05-16時点） | 完了見込み |
|---|---|---|
| classifyBatch（en/vocab_type付与） | 約327語 | 約5日後 |
| generateImageBatch（画像生成） | vocab_type埋まり次第自動開始 | classifyBatch完了後 |
| generateAudioBatch（音声生成） | 上限10件/日 | 並行処理中 |

---

## 確定済みの設定値

### ScriptProperties（設定済み）

| キー | 設定済み |
|---|---|
| `GEMINI_API_KEY` | ✅ |
| `SPREADSHEET_ID` | ✅ `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` |
| `IMAGE_FOLDER_ID` | ✅ |
| `AUDIO_FOLDER_ID` | ✅ |

### コード内の定数（確定済み）

```javascript
// 共通
SPREADSHEET_ID = "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk"

// EXTRACT_SETTINGS
GOI_LIST_FILE_ID: "1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA"  // テキスト形式のGoi_List

// LESSON_FILE_IDS
lesson_01: "1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c"

// SYNC_SETTINGS
IMAGE_REGISTRY_ID: "14NL_LqudXIQzY68klspH3SBlR21hiqbW"
AUDIO_REGISTRY_ID: "1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0"

// CLASSIFY_SETTINGS
MODEL: "gemma-4-26b-a4b-it"
BATCH_SIZE: 3

// IMAGE_SETTINGS
MODEL: "imagen-4.0-generate-001"

// AUDIO_SETTINGS
MODEL: "gemini-2.5-flash-preview-tts"
VOICE_NAME: "Aoede"
```

### タイマートリガー（登録済み・8本）

| 関数 | 頻度 | 備考 |
|---|---|---|
| `classifyBatch` | **毎時** | 3語/回。Gemma 4 の thinking mode 対策でバッチサイズを3に制限 |
| `generateImageBatch` | 毎日 9:00・13:00・17:00 | 3回/日。エラー時の自動リカバリのため複数設定 |
| `generateAudioBatch` | 毎日 10:00・14:00・18:00 | 3回/日。同上 |
| `syncAll` | 毎日 23:00 | registry.json に書き戻し |

---

## v7.0 → v8.0 で発生した問題と解決策（全件）

---

### 問題① testSingleImage() が「pending行に見つからない」エラー

**原因：**
`testSingleImage()` は `imageStatus = "pending"` の行しか検索しない。
`word_先生` はすでに `approved` に設定されていたため見つからなかった。

**解決策：**
`retryImages()` を使うと imageStatus に関わらず強制再生成できる。

```javascript
// statusを問わず強制再生成
retryImages(["word_先生"]);
```

---

### 問題② STYLE_RECIPE が不完全だった

**不足していた内容：**
- `sub_color`（Cool slate gray `#6B7C85`）
- `skin_tones`（Naturally warm medium skin tone）

**解決策（v5.1で修正済み）：**
`generateImages.gs` の `STYLE_RECIPE` に以下を追加。

```javascript
"cool slate gray (similar to #6B7C85, hex value 6B7C85) as sub-color for secondary elements.",
"Skin tones: naturally warm medium skin tone — avoid both extremely pale and extremely dark defaults.",
```

**確認方法：**
```javascript
function checkStyleRecipe() {
  Logger.log(STYLE_RECIPE);
}
```
ログに `6B7C85` と `skin_tones` が含まれていれば ✅

---

### 問題③ concrete_object のプロンプトが語彙ごとに最適化されていなかった

**解決策（v5.1で修正済み）：**
`OBJECT_SIGNATURES` 辞書を新規追加し、`buildConcreteObjectPrompt_()` から参照するよう変更。

対応語彙：雑誌・本・新聞・ノート・ケータイ・スマートフォン・パソコン・テレビ・カメラ・財布

未収録の語彙は `OBJECT_SIGNATURE_DEFAULT`（汎用シグネチャー）にフォールバック。

---

### 問題④ abstract_concept のプロンプトにメタファーが入っていなかった

**解決策（v5.1で修正済み）：**
`ABSTRACT_METAPHORS` 辞書を新規追加し、`buildAbstractConceptPrompt_()` から参照するよう変更。

対応語彙：好き・嫌い・楽しい・悲しい・嬉しい・怒る・疲れる・心配・時間・お金・仕事・勉強・旅行

未収録の語彙は `ABSTRACT_METAPHOR_DEFAULT` にフォールバック。

---

### 問題⑤ generateImages.gs の完全書き換え時に seedVocabulary() に誤りが混入

**発生した問題：**
`seedVocabulary()` 内の `appendRow()` 直後に `sheet.getRange(..., 9).insertCheckboxes()` が追加されてしまった。
Vocabulary の9列目（I列）は `imageUrl`（テキスト欄）であり、チェックボックスは不要。

**解決策：**
問題の行を削除。`appendRow(row)` の1行だけ残す。

---

### 問題⑥ setupDailyTrigger() が完全書き換え時に消えていた

**解決策：**
`setupHourlyTrigger()` の直前に `setupDailyTrigger()` を追加。

```javascript
function setupDailyTrigger() {
  // classifyBatch を毎日 8:00 に実行（毎時が不要になった場合の切り替え用）
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "classifyBatch") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("classifyBatch").timeBased().everyDays(1).atHour(8).create();
  Logger.log("INFO: classifyBatch の日次トリガーを設定しました（毎日 8:00）");
}
```

---

### 問題⑦ generateImageBatch / generateAudioBatch がエラーで止まると1日の残クォータが無駄になる

**解決策：**
各バッチを1日3回実行するトリガーに変更。

```javascript
// 画像：9:00 / 13:00 / 17:00
function setupImageTriggersX3() { ... }

// 音声：10:00 / 14:00 / 18:00
function setupAudioTriggersX3() { ... }
```

**理由：**
`generateImageBatch` は `imageStatus = "pending"` の行のみ処理するため、二重生成にならない。
エラーで途中終了しても、次の回で続きから処理される。

---

### 問題⑧ classifyBatch の JSON パース失敗（Gemma 4 thinking mode）

**原因：**
Gemma 4 が「thinking mode」で思考テキストを余分に出力する。
元の抽出ロジック `rawText.match(/\{[\s\S]*\}/)` は最後の `}` まで全部取り込むため、
思考テキスト内の `}` も含んでしまいパースに失敗する。

**ログでの見え方：**
```
JSONパース失敗: {"en": "foot", "vocab_type": "concrete_object"}
* Self-Correction: The prompt says POS is "接尾辞"...
```

**解決策：**
`parseGemmaResponse_()` の JSON 抽出ロジックを変更。
最初の `{` から最初の `}` までだけを取り出す。

```javascript
// ❌ 変更前（貪欲マッチ）
const jsonMatch = rawText.match(/\{[\s\S]*\}/);

// ✅ 変更後（最初の {} のみ）
const start = rawText.indexOf('{');
if (start === -1) throw new Error("JSONが見つかりません: " + rawText.substring(0, 200));
const end = rawText.indexOf('}', start);
if (end === -1) throw new Error("JSONが見つかりません: " + rawText.substring(0, 200));
const jsonMatch = [rawText.substring(start, end + 1)];
```

---

### 問題⑨ classifyBatch が GAS の 6分実行制限を超えてタイムアウト

**原因：**
Gemma 4 の thinking mode で一部の語彙（例：`あめ`、`映画`）が5分以上かかることがある。
`BATCH_SIZE: 50` では1バッチに最大750秒かかり、6分制限を大幅に超える。

**解決を試みた対策（全て失敗）：**

| 対策 | 結果 |
|---|---|
| `BATCH_SIZE: 10` | `映画` で140秒かかりタイムアウト |
| `thinkingConfig: { thinkingBudget: 0 }` | `"Thinking budget is not supported for this model."` でエラー |
| `deadline: 30`（UrlFetchApp） | 効果なし（30秒で打ち切られなかった） |
| MODEL: `gemini-2.0-flash` | `limit: 0`（このAPIキーでは使用不可） |
| MODEL: `gemini-1.5-flash` | `404 Not Found`（v1betaで未対応） |
| MODEL: `gemma-3-27b-it` | `404 Not Found`（v1betaで未対応） |
| MODEL: `gemini-2.5-flash-preview-04-17` | `404 Not Found`（v1betaで未対応） |

**結論：**
このAPIキーで v1beta の generateContent エンドポイントに使えるテキスト生成モデルは **`gemma-4-26b-a4b-it` のみ**。

**最終的な解決策：**
`BATCH_SIZE: 3` に設定。1バッチ最大210秒（3.5分）で6分制限以内に収まる。

```javascript
BATCH_SIZE: 3,
```

処理速度：約3語/時 × 24時間 = 最大72語/日。残り327語は約5日で完了。

---

### 問題⑩ vocab_type が空のまま画像生成が走り品質が低下する

**原因：**
`classifyBatch`（毎時）と `generateImageBatch`（1日3回）が並行して動いており、
`vocab_type` 未記入の語彙が先に画像生成されると汎用プロンプト（デフォルト）で処理される。

**解決策：**
`getPendingImageRows_()` に `vocab_type` 未記入のスキップ条件を追加。

```javascript
// ❌ 変更前
function getPendingImageRows_(ss) {
  return getAllImageRows_(ss).filter(function(r) {
    return r.imageStatus === "pending";
  });
}

// ✅ 変更後
function getPendingImageRows_(ss) {
  return getAllImageRows_(ss).filter(function(r) {
    return r.imageStatus === "pending" && r.vocabType !== "";
  });
}
```

これにより `classifyBatch` が `vocab_type` を記入した語彙だけが画像生成対象になる。

---

### 問題⑪ 音声の発音が不正確（「会社員」→「アイシェイン」）

**原因：**
Gemini TTS の Aoede ボイスは日本語専用ではない。
ひらがな（`かいしゃいん`）を送っても英語圏の発音モデルで処理され、
`k` が脱落して `aishain`（アイシェイン）のように聞こえる。

**解決策：**
`callGeminiTTS_()` の `contents` テキストに日本語指示プレフィックスを追加。

```javascript
// ❌ 変更前
contents: [{ parts: [{ text: text }] }],

// ✅ 変更後
contents: [{ parts: [{ text: "日本語で読み上げてください：" + text }] }],
```

**補足：**
`systemInstruction` パラメータは TTS エンドポイントで非対応（HTTP 500 エラーになる）。
テキスト本文に指示を含める方式が有効。

---

## このAPIキーで使えるモデル一覧（確定情報）

| 用途 | モデル | エンドポイント | 状態 |
|---|---|---|---|
| テキスト分類 | `gemma-4-26b-a4b-it` | v1beta / generateContent | ✅ 使用可 |
| テキスト分類（代替） | `gemma-4-31b-it` | v1beta / generateContent | 未確認 |
| 画像生成 | `imagen-4.0-generate-001` | v1beta / predict | ✅ 使用可 |
| 画像生成（代替） | `imagen-4.0-fast-generate-001` | v1beta / predict | ✅ 使用可 |
| 音声生成 | `gemini-2.5-flash-preview-tts` | v1beta / generateContent | ✅ 使用可 |
| 音声生成（代替） | `gemini-3.1-flash-preview-tts` | v1beta / generateContent | 未確認 |
| ❌ 使用不可 | `gemini-2.0-flash` | - | limit: 0 |
| ❌ 使用不可 | `gemini-1.5-flash` | - | 404 Not Found |
| ❌ 使用不可 | `gemma-3-27b-it` | - | 404 Not Found |
| ❌ 使用不可 | `gemini-2.5-flash-preview-04-17` | - | 404 Not Found |

---

## パイプライン全体フロー

```
① extractN5() / importByFileId() / 手動入力
      ↓ Vocabulary シートに語彙を追加（en・vocab_type は空）

② classifyBatch（毎時・自動）
      ↓ Gemma 4 が en と vocab_type を判定して記入
      ↓ 現在 327語が処理待ち（約5日で完了）

③ generateImageBatch（1日3回・自動）
      ↓ vocab_type が埋まった語彙のみ対象
      ↓ vocab_type → テンプレート選択（A〜J）→ Imagen 4 で画像生成

④ generateAudioBatch（1日3回・自動）
      ↓ audioStatus = pending の語彙・例文を Gemini TTS で音声化
      ↓ ひらがな読みに「日本語で読み上げてください：」プレフィックスを付与

⑤ syncAll（毎日 23:00・自動）
      ↓ 生成済み URL を master_image_registry.json / master_audio_registry.json に書き戻し

⑥ build-embedded-data.py（手動）
      ↓ japanese-lesson-creator の HTML に最新 URL を反映
```

---

## 語彙追加マニュアル

### パターン①：新しい課（lesson_02以降）を追加する

1. `lesson_NN.json` を Google Drive にアップロード
2. ファイルIDを `LESSON_FILE_IDS` に追加
   ```javascript
   const LESSON_FILE_IDS = {
     lesson_01: "...",
     lesson_02: "新しいファイルID",  // ← 追加
   };
   ```
3. `importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02")` を手動実行
4. あとは自動（②〜⑤が順次処理）

### パターン②：Goi_List の N4語彙を追加する

1. `EXTRACT_SETTINGS.TARGET_LEVELS` を変更
   ```javascript
   TARGET_LEVELS: ["1.初級前半", "2.初級後半"],  // N4を追加
   ```
2. `extractByLevel()` を手動実行（N5は重複チェックで自動スキップ）
3. あとは自動（N4は788語・約11日で画像生成完了）

### パターン③：単語を1語だけ手動追加する

Vocabulary シートに直接1行入力する。

| 列 | 入力内容 | 例 |
|---|---|---|
| A: word | 漢字表記 | 旅行 |
| B: reading | ひらがな | りょこう |
| C: en | **空欄**（classifyBatch が自動付与） | |
| D: jlptLevel | N5〜N1 | N5 |
| E: pos | 品詞 | 名詞 |
| F: vocab_type | **空欄**（classifyBatch が自動付与） | |
| G: imageId | `word_` + 漢字 | word_旅行 |
| H: imageStatus | pending | pending |
| I: imageUrl | 空欄 | |
| J: audioId | `word_` + 漢字 | word_旅行 |
| K: audioStatus | pending | pending |
| L: audioUrl | 空欄 | |
| M: lessonRef | 任意 | lesson_02 |
| N: source | manual | manual |

---

## よく使うメンテナンス関数

| 関数 | 用途 | 注意 |
|---|---|---|
| `retryImages(["word_XX"])` | 特定語彙の画像を強制再生成 | imageStatus に関わらず実行 |
| `retryAudio(["word_XX"])` | 特定語彙の音声を強制再生成 | 同上 |
| `reclassifyWords(["XX"])` | 特定語彙の en/vocab_type を再処理 | - |
| `previewPrompts()` | 最初の5件のプロンプトをログ確認 | API呼び出しなし |
| `checkStyleRecipe()` | STYLE_RECIPE の内容を確認 | `#6B7C85` が含まれるか確認 |
| `fixExamplesData()` | Examples データが1001行目に入った場合の修正 | 通常不要 |
| `previewClassify()` | 分類結果を5件プレビュー | SS への書き込みなし |
| `testProtectedKeys()` | 保護キーのチェックロジックをテスト | - |

---

## レート制限（確定値）

| モデル | RPD | 現在の用途 |
|---|---|---|
| Gemma 4 26B（gemma-4-26b-a4b-it） | 1,500 | classifyBatch（毎時3語） |
| Imagen 4（imagen-4.0-generate-001） | 25 | generateImageBatch（1日最大25枚） |
| Imagen 4 Fast（imagen-4.0-fast-generate-001） | 25 | generateImageBatch 代替（合計50枚/日） |
| Gemini 2.5 Flash TTS | 10 | generateAudioBatch（1日最大10件） |
| Gemini 3.1 Flash TTS | 10 | generateAudioBatch 代替（合計20件/日） |

---

## デュアルモデル戦略（1日の上限を2倍にする方法）

画像・音声ともに、モデルを切り替えて2回実行することで1日の処理数を倍にできる。

**画像（手動実行が必要）：**
```javascript
// 1回目（タイマー自動）
MODEL: "imagen-4.0-generate-001"  → 最大25枚/日

// 2回目（手動でモデル変更後に generateImageBatch() 実行）
MODEL: "imagen-4.0-fast-generate-001"  → さらに最大25枚/日
```

**音声（手動実行が必要）：**
```javascript
// 1回目（タイマー自動）
MODEL: "gemini-2.5-flash-preview-tts"  → 最大10件/日

// 2回目（手動でモデル変更後に generateAudioBatch() 実行）
MODEL: "gemini-3.1-flash-preview-tts"  → さらに最大10件/日
```

---

## 保護対象エントリ（絶対に上書きしてはいけない）

`syncRegistries.gs` の `PROTECTED_PREFIXES` / `PROTECTED_EXACT` で保護済み。

| プレフィックス | 対象 | 理由 |
|---|---|---|
| `char_` | char_鈴木〜char_ケリー | 実URL存在・上書き禁止 |
| `ex_L` | ex_L01_007〜015 等の例文画像 | GASスコープ外 |
| `world_map`（完全一致） | 地図画像 | imageUrl: null のまま保持 |

---

## 次チャットに必要なファイル

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（`gas_pipeline_handoff_v8.md`） | **必須** | 全決定事項の参照元 |
| 現在のGASコード（setupSpreadsheet.gs） | 任意 | コード修正が必要な場合 |
| `master_prompt_design_guide_v2_5.py` | 任意 | STYLE_RECIPE等の変更が必要な場合 |

---

## 次チャットの開始コマンド例

```
gas_pipeline_handoff_v8.md の続きです。

現在の状態：
- classifyBatch が毎時3語ずつ処理中（残り約XX語）
- generateImageBatch が vocab_type 済みの語彙を毎日3回処理中
- generateAudioBatch が毎日3回処理中

確認・対応をお願いしたいこと：
[ここに具体的な作業を書く]
```

---

*作成：2026-05-16*
*根拠：gas_pipeline_handoff_v7.md + このチャットで発生した全問題と解決策*
