# 引き継ぎ資料：画像生成ライン v5.0
**バージョン：image-gen-handoff-v5.0（2026-05-18）**
**前資料：image-gen-handoff-v4.0.md（2026-05-18）**
**このバージョンで追加した内容：Goi_List.pdf 精査完了・vocab_type自動マッピング仕様確定・classifyAndTranslate.gs v2.0 設計完了**

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
| **①** | **`generateImages.gs` モデル名変更** | `imagen-4.0-generate-exp` → `imagen-4.0-fast-generate-001`。変更後 `testSingleImage()` で1枚生成して動作確認 |
| **②** | **`generateImages.gs` buildImagePrompt_() 拡張** | vocab_type K〜T の switch-case を追加（§4 残タスク参照）。HOW_TO_USE_v2_6（master_prompt_design_guide_v2_6_complete.py 内）を参照 |
| **③** | **`classifyAndTranslate.gs` を v2.0 に更新** | §4 に完全な実装仕様を記載。主な変更点：①VALID_VOCAB_TYPES に K〜T 追加、②inferVocabTypeFromGoiList_() 追加、③buildPrompt_() 更新 |
| **④** | **Vocabulary シートに補助列追加** | O列（pos2）・P列（goiShurui）を追加。`setupSpreadsheet.gs` の headers 配列を更新（§4 参照） |
| **⑤** | **`extractFromGoiList.gs` appendVocabRows_() 更新** | 補助列追加に伴い、O列・P列への書き込みを追加（§4 参照） |
| **⑥** | **地名5語の vocab_type を設計確定** | アメリカ・カナダ・韓国・日本・日本語 → §3 §5(D-20) 参照。`concrete_object` か新 type `country` か要決定 |

> **次チャットへのアップロード必須ファイル：**
> - `image-gen-handoff-v5.0.md`（この資料）
> - `master_prompt_design_guide_v2_6_complete.py`（buildImagePrompt_() 拡張時の参照元）

---

## §1. このチャットで行った作業の概要

```
【v4.0 チャットからの継続作業】

  Goi_List.pdf を pdftotext で全文抽出（35,864行）
    ↓
  確認1: 定型表現10語・連体詞6語の具体的語彙を特定
    ↓
  確認2: 名詞298語の品詞2(詳細)サブカテゴリを完全集計
    ↓
  確認3: 語種列（和語/漢語/外来語）の画像プロンプト活用可否を判断 → 現時点では不要と決定
    ↓
  確認4: vocab_type 事前マッピング試算 → 57.3%（242/422語）が自動確定可能と判明
    ↓
  classifyAndTranslate.gs v2.0 の更新仕様を設計（inferVocabTypeFromGoiList_() 関数仕様）
    ↓
  Vocabulary シート補助列（O: pos2 / P: goiShurui）追加仕様を確定
```

---

## §2. 完了した作業

### v4.0 チャットより継承（削除禁止）

#### v2.6 の3ファイルを1ファイルに統合（v4.0 チャットで完了）

| 統合前（3ファイル） | 統合後（1ファイル） |
|---|---|
| `master_prompt_design_guide_v2_6.py`（2816行） | `master_prompt_design_guide_v2_6_complete.py`（4162行） |
| `master_prompt_design_guide_v2_6_corrections.py`（863行） | ↑ 全変数34件・Python構文OK |
| `master_prompt_design_guide_v2_6_foundational.py`（508行） | ↑ セクション §2>§3>§4 の優先順位明記 |

**検証結果（全項目クリア）：**
- ✅ Python 構文 OK
- ✅ 必須変数 34件 全存在
- ✅ 旧 END OF フッター内部混入 0件
- ✅ セクション順序 §2 < §3 < §4

**ユーザー側の残作業（v4.0 チャット時点）：**
- プロジェクトナレッジから旧3ファイルを削除
- `master_prompt_design_guide_v2_6_complete.py` をナレッジに登録

---

### v5.0 チャットで完了した作業

#### Goi_List.pdf 精査完了

- v4.0 では「途中・次チャットで継続」だったが、本チャットで全確認項目を完了（詳細は §3）
- `pdftotext -layout` で全文テキスト化（35,864行）し、Python スクリプトで集計・分析

#### classifyAndTranslate.gs v2.0 更新仕様の確定

- `inferVocabTypeFromGoiList_()` 関数の完全仕様を設計（§4 に記載）
- vocab_type 自動マッピング率 57.3%（242/422語）と試算確定
- VALID_VOCAB_TYPES を旧9種類 → 新20種類（A〜T）に拡張する方針を確定

#### Vocabulary シート補助列仕様の確定

- O列: `pos2`（品詞2詳細）、P列: `goiShurui`（語種）の追加を確定
- `extractFromGoiList.gs` が既に `pos2` / `goiShurui` を変数として保持していることを確認済み

---

## §3. Goi_List.pdf 分析（完全版）

### ファイル基本情報

| 項目 | 値 |
|---|---|
| ページ数 | 780ページ |
| 総エントリ数 | 17,908語（v4.0 の 17,520 は概算） |
| テキスト行数 | 35,864行（pdftotext -layout で抽出） |
| 列構成 | No / 標準的な表記 / 読み / 語彙の難易度 / 品詞1 / 品詞2(詳細) / 語種 / 更新情報 |
| 文字化け | U+46F3〜U+471D のひらがな → offset -0x1690 で修正（`fixGoiListEncoding_()` 実装済み） |
| PDF内部構造 | 本体チャンク（46行）と語種チャンク（46行）が交互に出現（`parseGoiList_()` 実装済み） |

### 難易度レベル分布

| レベル | 語数 | JLPTの目安 | 備考 |
|---|---|---|---|
| 1.初級前半 | 422語 | N5相当 | 本チャットで精査済み |
| 2.初級後半 | 792語 | N4〜N5 | 未精査 |
| 3.中級前半 | 2,297語 | N3〜N4 | 未精査 |
| 4.中級後半 | 6,462語 | N2〜N3 | 未精査 |
| 5.上級前半 | 6,376語 | N1〜N2 | 未精査 |
| 6.上級後半 | 1,559語 | N1以上 | 未精査 |
| **合計** | **17,908語** | | |

### N5相当（1.初級前半）の品詞分布 ── 確定版

**注意：v4.0 では定型表現9語・合計421語と記載していたが、本チャットで直接抽出して確認した結果、定型表現10語・合計422語が正しい（D-18）。**

| 品詞1 | 語数 | v2.6テンプレート | 自動マッピング |
|---|---|---|---|
| 名詞 | 298 | A〜D / O〜S（語義による） | 部分的（下記サブカテゴリ参照） |
| イ形容詞 | 40 | J（adjective） | ✅ 品詞1で確定 |
| 動詞1類 | 23 | H（action_verb） | ✅ 品詞1で確定 |
| 接尾辞 | 19 | O or I（品詞2で分岐） | ✅ 品詞2で確定 |
| **定型表現** | **10** | **M（set_expression）** | ✅ 品詞1で確定 |
| 動詞2類 | 8 | H（action_verb） | ✅ 品詞1で確定 |
| 連体詞 | 6 | G（demonstrative） | ✅ 品詞1で確定 |
| ナ形容詞 | 5 | J（adjective） | ✅ 品詞1で確定 |
| 代名詞 | 4 | K（pronoun） | ✅ 品詞1で確定 |
| 副詞 | 4 | N（adverb） | ✅ 品詞1で確定 |
| 感動詞 | 2 | L（interjection） | ✅ 品詞1で確定 |
| 動詞3類 | 2 | H（action_verb） | ✅ 品詞1で確定 |
| 接頭辞 | 1 | I（abstract_concept） | ✅ 品詞1で確定 |

---

### 確認1：定型表現10語・連体詞6語の確定語彙

#### 定型表現 10語（全語テンプレートMで統一処理可）

| No | 語 | 読み | 品詞2 |
|---|---|---|---|
| 476 | ありがとう | アリガトウ | 感動詞-一般 |
| 20107 | お願いします | オネガイシマス | 定型句 |
| 2195 | おはよう | オハヨウ | 感動詞-一般 |
| 20108 | おはようございます | オハヨウゴザイマス | 定型句 |
| 6357 | こんにちは | コンニチハ | 定型句 |
| 6367 | こんばんは | コンバンハ | 定型句 |
| 6788 | さようなら | サヨウナラ | 感動詞-一般 |
| 6790 | さよなら | サヨナラ | 名詞-普通名詞-一般 |
| 20059 | 済みません | スミマセン | 動詞-一般 and 助動詞 |
| 14247 | 初めまして | ハジメマシテ | 感動詞-一般 |

品詞2のバリエーション（感動詞-一般・定型句・名詞-一般等）は画像プロンプト生成上無視してよい。
テンプレートMの greeting サブカテゴリで全語統一処理可能。

#### 連体詞 6語（全語テンプレートGで統一処理可）

| No | 語 | 読み | 品詞1 | 備考 |
|---|---|---|---|---|
| 6128 | この | コノ | 連体詞 | G（demonstrative）確定 |
| 10181 | その | ソノ | 連体詞 | G 確定 |
| 12830 | どの | ドノ | 連体詞 | G 確定 |
| 6351 | こんな | コンナ | 連体詞 | G 確定 |
| 13048 | どんな | ドンナ | 連体詞 | G 確定 |
| 13049 | どんな | ドンナ | 連体詞 / 形状詞-一般 | 同語の別品詞登録（重複）|
| 2171 | 同じ | オナジ | **ナ形容詞**（品詞2に連体詞） | J（adjective）で処理 |

「あの」「そんな」「あんな」は N5 リストに存在しない。

---

### 確認2：名詞298語の品詞2サブカテゴリ完全分布

| 品詞2サブカテゴリ | 語数 | 割合 | vocab_type | 自動マッピング |
|---|---|---|---|---|
| 名詞-普通名詞-一般 | 143語 | 48% | **要AI分類** | ❌ AI分類必要 |
| 名詞-数詞 / 助数詞 | 71語 | 24% | counter (O) | ✅ 品詞2で確定 |
| 名詞-普通名詞-副詞可能 | 46語 | 15% | time (P) | ✅ 品詞2で確定 |
| 名詞-普通名詞-サ変可能 | 13語 | 4% | **要AI分類** | ❌ AI分類必要 |
| 代名詞（名詞扱い） | 10語 | 3% | pronoun (K) | ✅ 品詞2で確定 |
| 固有名詞-地名 | 5語 | 2% | **未設計** | ❌ 要設計（D-20） |
| 名詞-普通名詞-形状詞可能 | 5語 | 2% | adjective (J) | ✅ 品詞2で確定 |
| 形状詞-一般 | 2語 | 1% | adjective (J) | ✅ 品詞2で確定 |
| 副詞（名詞扱い） | 2語 | 1% | adverb (N) | ✅ 品詞2で確定 |
| 接頭辞系（名詞扱い） | 1語 | — | abstract_concept (I) | ✅ 品詞2で確定 |

**固有名詞-地名 5語（未設計）：**

| 語 | 読み |
|---|---|
| アメリカ | アメリカ |
| カナダ | カナダ |
| 韓国 | カンコク |
| 日本 | ニッポン |
| 日本語 | ニホンゴ |

→ 現時点では `inferVocabTypeFromGoiList_()` が `""` を返し、AI分類に委ねる（D-20）。

**名詞-普通名詞-一般（143語）のカテゴリ別内訳（手動分析）：**

| 推定カテゴリ | 代表的な語（サンプル） | 語数目安 |
|---|---|---|
| concrete_object | いす・犬・机・テレビ・時計・かばん・傘 | 約30〜40語 |
| person | 医者・学生・先生・会社員・男・女・友達 | 約10語 |
| building | アパート・家・駅・学校・銀行・大学・デパート | 約15語 |
| family（uchi） | 兄・姉・妹・弟・母・家族 | 約8語 |
| weather | 雨・風・雪 | 約3語 |
| abstract_concept | 意味・授業・宿題・仕事・勉強・名前 | 約20語 |
| food（concrete_object サブ） | アイス・いちご・コーヒー・魚・肉・パン | 約10語 |
| **未分類（AI必須）** | 挨拶・お金・歌・映画・英語・漢字 等 | **約75語** |

---

### 確認3：語種列の画像スタイル活用可否

**分布：**
- 和語：5,843語
- 漢語：8,761語
- 外来語：2,179語
- 混種語：707語

**判断（D-19）：現時点では活用しない。**

理由：既存テンプレート（A〜T）のスタイル選択は語義に依存しており、語種と独立している。「外来語＝西洋的スタイル」のような対応は意味的に不正確なケースが多い。Vocabulary シートには P列（goiShurui）として保存するが、buildImagePrompt_() では参照しない。

将来拡張：「和語→watercolor風」「漢語→clean line-art風」のような追加ルールを設ける場合に再検討。

**実装上の注意：** `extractFromGoiList.gs` の `parseGoiList_()` は既に `goiShurui` を取得している。`appendVocabRows_()` を更新して P 列に書き込むだけでよい（追加の解析コスト不要）。

---

### 確認4：vocab_type 自動マッピング試算結果

| 分類 | 語数 | 割合 |
|---|---|---|
| 品詞1だけで自動確定 | 242語 | **57.3%** |
| AI分類が必要（主に名詞-普通名詞-一般） | 180語 | 42.7% |
| **合計** | **422語** | |

AI分類が必要な180語の内訳（品詞1が名詞・品詞2が普通名詞-一般/サ変可能/固有名詞）。これらは `inferVocabTypeFromGoiList_()` が `""` を返し、従来通り Gemma 4 API に委ねる。

---

### Goi_List にある情報 vs. プロンプト生成に必要な情報（更新版）

| 必要フィールド | Goi_Listに存在 | 現在の取得方法 | 状態 |
|---|---|---|---|
| word（標準表記） | ✅ | Goi_Listから直接 | OK |
| reading（読み） | ✅ | Goi_Listから直接 | OK |
| pos1（品詞1） | ✅ | Goi_Listから直接 | OK |
| pos2（品詞2詳細） | ✅ | Goi_Listから直接 | **→ O列追加で対応（D-22）** |
| goiShurui（語種） | ✅ | Goi_Listから直接 | **→ P列追加で保存（D-19/D-22）** |
| difficulty（難易度） | ✅ | Goi_Listから直接 | OK |
| en（英語訳） | ❌ | classifyAndTranslate.gs で AI生成 | 稼働中 |
| vocab_type（A〜T） | ❌ | **inferVocabTypeFromGoiList_() で57%自動化（D-21）** | **v2.0で対応予定** |
| familyForm（uchi/soto） | ❌ | 未実装 | 要実装 |
| adverbType（degree等） | ❌ | 未実装 | 要実装 |
| timeSubtype（clock等） | ❌ | 未実装 | 要実装 |
| perceptionType（active等） | ❌ | 未実装 | 要実装 |
| grammarConcept | ❌ | lesson_NN.json から参照 | lesson側で管理 |

---

## §4. 実装仕様（次チャットで実装するコード）

### 4-1. classifyAndTranslate.gs v2.0 への変更点

現在の `classifyAndTranslate.gs` は v1.0（2026-05-15）。以下3点を変更して v2.0 とする。

---

#### 変更①：VALID_VOCAB_TYPES を 9種類 → 20種類に拡張

```javascript
// 変更前（v1.0）: 旧9種類
const VALID_VOCAB_TYPES = [
  "person", "building", "concrete_object", "action_verb",
  "adjective", "abstract_concept", "spatial_relation", "demonstrative", "other",
];

// 変更後（v2.0）: 全20種類（master_prompt_design_guide_v2_6_complete.py 準拠）
const VALID_VOCAB_TYPES = [
  // v2.5 完成（A〜J）
  "person",           // A
  "building",         // B
  "example_sentence", // C（GASからは通常使わない）
  "concrete_object",  // D
  "variant_grid",     // E（GASからは通常使わない）
  "spatial_relation", // F
  "demonstrative",    // G
  "action_verb",      // H
  "abstract_concept", // I
  "adjective",        // J
  // v2.6 追加（K〜T）
  "pronoun",          // K
  "interjection",     // L
  "set_expression",   // M
  "adverb",           // N
  "counter",          // O
  "time",             // P
  "transportation",   // Q
  "family",           // R
  "weather",          // S
  "sensory",          // T
  // フォールバック
  "other",
];
```

---

#### 変更②：inferVocabTypeFromGoiList_() を新規追加

`classifyBatch()` 内の AI 呼び出し前に挿入する事前マッピング関数。

```javascript
/**
 * inferVocabTypeFromGoiList_()
 *
 * Goi_List の品詞1（pos1）・品詞2（pos2）から vocab_type を事前マッピングする。
 * 確定できる場合は vocab_type 文字列を返す。
 * 確定できない場合（名詞-普通名詞-一般 等）は "" を返す → AI分類へ。
 *
 * 期待効果：N5語彙422語のうち約57%（242語）でAI呼び出しを省略可能。
 *
 * @param {string} pos1 - 品詞1（Goi_List の列E に相当。Vocabulary シートの E列）
 * @param {string} pos2 - 品詞2(詳細)（Vocabulary シートの O列。要補助列追加）
 * @returns {string} vocab_type または ""
 */
function inferVocabTypeFromGoiList_(pos1, pos2) {
  pos1 = (pos1 || "").trim();
  pos2 = (pos2 || "").trim();

  switch (pos1) {
    case "定型表現": return "set_expression";   // M ✅ 全10語確定
    case "感動詞":   return "interjection";      // L ✅ 全2語確定
    case "副詞":     return "adverb";            // N ✅ 全4語確定
    case "動詞1類":
    case "動詞2類":
    case "動詞3類":  return "action_verb";       // H ✅ 全33語確定
    case "イ形容詞":
    case "ナ形容詞": return "adjective";         // J ✅ 全45語確定
    case "代名詞":   return "pronoun";           // K ✅ 全4語確定
    case "連体詞":   return "demonstrative";     // G ✅ 全6語確定
    case "接頭辞":   return "abstract_concept";  // I ✅ 全1語確定
    case "接尾辞":
      // 助数詞を含む接尾辞 → counter、それ以外 → abstract_concept
      return pos2.includes("助数詞") ? "counter" : "abstract_concept";

    case "名詞":
      // --- 品詞2で細分化 ---
      if (pos2.includes("固有名詞-人名"))         return "person";         // A
      if (pos2.includes("固有名詞-地名"))          return "";               // 未設計→AI（D-20）
      if (pos2.includes("数詞") ||
          pos2.includes("助数詞"))                return "counter";        // O
      if (pos2.includes("形状詞可能") ||
          pos2.includes("形状詞-一般"))            return "adjective";      // J
      if (pos2.includes("副詞可能"))               return "time";           // P（朝・昼・今日等）
      if (pos2.includes("代名詞"))                 return "pronoun";        // K（あれ・どれ等）
      // 名詞-普通名詞-一般、名詞-普通名詞-サ変可能 等 → AI分類
      return "";

    default:
      return "";
  }
}
```

---

#### 変更③：classifyBatch() に事前マッピングを組み込む

`getPendingRows_()` が返すオブジェクトに `pos2` を追加し（後述）、
AI呼び出し前に事前マッピングを試みる。

```javascript
// classifyBatch() 内の batch.forEach ブロックを以下に変更

batch.forEach(function(row, i) {
  try {
    Logger.log("  [" + (i + 1) + "/" + batch.length + "] " + row.word + " を処理中...");

    // 【v2.0追加】Goi_List品詞情報からの事前マッピング
    // pos2 は Vocabulary シート O列から取得（getPendingRows_() が返す）
    var preMapping = inferVocabTypeFromGoiList_(row.pos, row.pos2);

    if (preMapping !== "") {
      // 事前マッピング確定 → AI呼び出しをスキップ
      sheet.getRange(row.rowIndex, 6).setValue(preMapping);  // F: vocab_type
      // en は別途AI生成が必要なため、en が空の場合のみ AI を呼ぶ
      if (row.en === "") {
        var enOnly = callGemmaAPI_enOnly_(row.word, row.reading, row.pos);
        sheet.getRange(row.rowIndex, 3).setValue(enOnly);    // C: en
      }
      logToSheet_(ss, "classify_pre", row.word, "success",
                  row.en + " / " + preMapping + " (pre-mapped)");
      successCount++;
    } else {
      // 事前マッピング不可 → 従来通りAI分類
      const result = callGemmaAPI_(row.word, row.reading, row.pos);
      sheet.getRange(row.rowIndex, 3).setValue(result.en);
      sheet.getRange(row.rowIndex, 6).setValue(result.vocab_type);
      logToSheet_(ss, "classify", row.word, "success",
                  result.en + " / " + result.vocab_type);
      successCount++;
    }

  } catch (e) {
    Logger.log("  ERROR: " + row.word + " → " + e.message);
    logToSheet_(ss, "classify", row.word, "failed", e.message);
    failCount++;
  }

  if (i < batch.length - 1) {
    Utilities.sleep(CLASSIFY_SETTINGS.SLEEP_MS);
  }
});
```

---

#### 変更④：getPendingRows_() に pos2・en を追加

```javascript
// 変更前（v1.0）: 14列取得
const data = sheet.getRange(2, 1, lastRow - 1, 14).getValues();

// 変更後（v2.0）: 16列取得（O列=pos2 まで）
const data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();

// pending.push() の中身に pos2 と en を追加
pending.push({
  rowIndex: i + 2,
  word:     word,
  reading:  reading,
  en:       en,        // ← v2.0追加（en が空か確認用）
  pos:      pos,
  pos2:     String(row[14]).trim(),  // O列: pos2（補助列追加後）
});
```

---

#### 変更⑤：buildPrompt_() の vocab_type ガイドを更新

```javascript
function buildPrompt_(word, reading, pos) {
  const vocabTypeList = VALID_VOCAB_TYPES.join(", ");

  return [
    "You are a Japanese vocabulary classifier for JLPT learners.",
    "Given a Japanese word, return ONLY a JSON object with these two keys:",
    '- "en": English translation (short, 1-4 words, lowercase)',
    '- "vocab_type": one of [' + vocabTypeList + ']',
    "",
    "Vocab type guide (choose the most specific match):",
    "  person          ← people (医者, 学生, 先生, 会社員, 友達)",
    "  building        ← buildings / facilities (病院, 学校, 銀行, 駅, デパート)",
    "  concrete_object ← tangible items (本, ペン, 財布, 犬, 机, テレビ)",
    "  action_verb     ← verbs / actions (食べる, 読む, 飲む, 行く)",
    "  adjective       ← i-adj / na-adj (大きい, 新しい, 便利, 好き)",
    "  abstract_concept← abstract nouns (時間, 意見, 気持ち, 意味)",
    "  spatial_relation← location words (上, 下, 右, 左, そば, となり)",
    "  demonstrative   ← ko-so-a-do words (これ, それ, あれ, どれ, この, その)",
    "  pronoun         ← pronouns / wh-words (私, あなた, 彼, 何, どこ, いつ)",
    "  interjection    ← exclamations / response words (はい, いいえ, えー)",
    "  set_expression  ← fixed greetings / phrases (ありがとう, こんにちは, すみません)",
    "  adverb          ← adverbs (とても, もっと, ゆっくり, もう, まだ)",
    "  counter         ← counters / numbers (一, 二, 枚, 本, 回, 円, 月)",
    "  time            ← time expressions (今日, 明日, 朝, 午後, 来月, 先週)",
    "  transportation  ← vehicles / transport (電車, バス, 飛行機, 自転車)",
    "  family          ← family members (父, 母, 兄, 姉, 妹, 弟, 家族)",
    "  weather         ← weather / nature (雨, 雪, 晴れ, 風, 天気)",
    "  sensory         ← sensory / perception words (見る, 聞く, においがする)",
    "  other           ← use ONLY if nothing above fits",
    "",
    "Word:    " + word,
    "Reading: " + reading,
    "POS:     " + pos,
    "",
    "Return ONLY valid JSON. No explanation. No markdown. No backticks.",
    'Example: {"en": "doctor", "vocab_type": "person"}',
  ].join("\n");
}
```

---

### 4-2. Vocabulary シート 補助列追加仕様

`setupSpreadsheet.gs` の `setupVocabularySheet()` にある `headers` 配列に追記。

```javascript
// 変更前（14列）
const headers = [
  "word", "reading", "en", "jlptLevel", "pos", "vocab_type",
  "imageId", "imageStatus", "imageUrl",
  "audioId", "audioStatus", "audioUrl",
  "lessonRef", "source",
];

// 変更後（16列）
const headers = [
  "word",        // A
  "reading",     // B
  "en",          // C
  "jlptLevel",   // D
  "pos",         // E: pos1（品詞1・正規化済み）
  "vocab_type",  // F
  "imageId",     // G
  "imageStatus", // H
  "imageUrl",    // I
  "audioId",     // J
  "audioStatus", // K
  "audioUrl",    // L
  "lessonRef",   // M
  "source",      // N
  "pos2",        // O: 品詞2(詳細)・Goi_Listそのまま（inferVocabTypeFromGoiList_() が参照）
  "goiShurui",   // P: 語種（和語/漢語/外来語/混種語）・将来拡張用
];

// 列幅追加（O・P列）
sheet.setColumnWidth(15, 250); // O: pos2
sheet.setColumnWidth(16, 80);  // P: goiShurui
```

---

### 4-3. extractFromGoiList.gs appendVocabRows_() 更新

O・P列への書き込みを追加。

```javascript
// 変更前（v1.0）: 14列書き込み
return [
  e.word, reading, "", jlpt, pos, "",
  wordKey, "pending", "",
  wordKey, "pending", "",
  "", "goi_list",
];
// sheet.getRange(startRow, 1, rows.length, 14).setValues(rows);

// 変更後（v2.0）: 16列書き込み
return [
  e.word,        // A: word
  reading,       // B: reading
  "",            // C: en
  jlpt,          // D: jlptLevel
  pos,           // E: pos（pos1正規化済み）
  "",            // F: vocab_type
  wordKey,       // G: imageId
  "pending",     // H: imageStatus
  "",            // I: imageUrl
  wordKey,       // J: audioId
  "pending",     // K: audioStatus
  "",            // L: audioUrl
  "",            // M: lessonRef
  "goi_list",    // N: source
  e.pos2 || "",  // O: pos2（品詞2詳細・inferVocabTypeFromGoiList_() が参照）
  e.goiShurui || "", // P: goiShurui（語種・将来拡張用）
];
// sheet.getRange(startRow, 1, rows.length, 16).setValues(rows);
```

---

### 4-4. generateImages.gs 残タスク（前チャットより継続）

| 変更箇所 | 内容 | 優先度 |
|---|---|---|
| モデル名 | `imagen-4.0-generate-exp` → `imagen-4.0-fast-generate-001` | **高** |
| `buildImagePrompt_()` | K〜T の switch-case 追加（HOW_TO_USE_v2_6 参照） | **高** |
| `testSingleImage()` | モデル名変更後に実行して動作確認 | **高** |

---

## §5. 設計決定の記録（追記のみ・削除禁止）

（image-gen-handoff-v3.0 §5 → v4.0 §5 の D-1〜D-15 は全て継承。v4.0 での追加 D-16・D-17 も継承。以下は v5.0 チャットでの追加分）

### v4.0 チャット追加分（継承）

| # | 決定内容 | 根拠 |
|---|---|---|
| **D-16** | v2.6_complete は 4ファイル → 2ファイル構成に変更（v2.5 + v2.6_complete） | 4ファイル参照は非現実的（image-gen-handoff-v3.0 §12） |
| **D-17** | Goi_List.pdf の難易度レベルと JLPT の対応は「1.初級前半≈N5」として扱う | v4.0 初期分析。v5.0 で pdftotext 直接抽出により確認完了 |

### v5.0 チャット追加分

| # | 決定内容 | 根拠 |
|---|---|---|
| **D-18** | N5（1.初級前半）の定型表現は **10語**（v4.0 の9語は誤り） | pdftotext 全文抽出で直接カウント。No.20059「済みません」が前回漏れていた |
| **D-19** | 語種列（和語/漢語/外来語/混種語）は現時点では画像スタイルへ活用しない | 語義依存度の方が高く、語種とスタイルの対応が意味的に不正確なケースが多い。Vocabulary シート P列に保存し将来拡張の余地を残す |
| **D-20** | 名詞-固有名詞-地名（アメリカ・カナダ・韓国・日本・日本語）の vocab_type は未確定 | 既存テンプレート（A〜T）に適切な対応なし。`inferVocabTypeFromGoiList_()` は `""` を返し AI 判断に委ねる。次チャットで `concrete_object` か新 type `country` かを決定すること |
| **D-21** | `classifyAndTranslate.gs` に `inferVocabTypeFromGoiList_()` を追加し AI 問い合わせを約57%削減 | N5語彙422語の試算：242語が品詞1・品詞2情報だけで自動確定。残180語（主に名詞-普通名詞-一般）は引き続きAI分類 |
| **D-22** | Vocabulary シートに pos2（O列）・goiShurui（P列）を追加。14列 → 16列に拡張 | `inferVocabTypeFromGoiList_()` が pos2 を参照するため必須。`extractFromGoiList.gs` はすでに `e.pos2` / `e.goiShurui` を保持しており、`appendVocabRows_()` に2列追加するだけで対応可能 |
| **D-23** | `classifyBatch()` の pendingRows の判定条件：en と vocab_type が**両方**空の行を対象としていたが、v2.0 では「vocab_type が空」の行を対象に変更する | 事前マッピングで vocab_type が埋まっても en が空のままになりうる。en の付与は別途 `callGemmaAPI_enOnly_()` で行うか、AI 呼び出し時に取得済みのものを使う。実装は次チャットで確定 |

---

## §6. vocab_type → テンプレート 完全対応表（v2.6-complete）

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

---

## §7. GAS 実装の残タスク一覧（優先度順・完全版）

| タスク | 優先度 | ファイル | 状態 |
|---|---|---|---|
| モデル名変更 `imagen-4.0-fast-generate-001` | **高** | `generateImages.gs` | 未実装 |
| `buildImagePrompt_()` switch-case K〜T 追加 | **高** | `generateImages.gs` | 未実装 |
| Imagen 4 復帰テスト（`testSingleImage()` 1枚） | **高** | `generateImages.gs` | 未実施 |
| `setupSpreadsheet.gs` headers 14列→16列 | **高** | `setupSpreadsheet.gs` | 未実装 |
| `extractFromGoiList.gs` appendVocabRows_() 16列対応 | **高** | `extractFromGoiList.gs` | 未実装（仕様は §4-3 に記載済み）|
| `classifyAndTranslate.gs` v2.0 実装（①〜⑤） | **高** | `classifyAndTranslate.gs` | 未実装（仕様は §4-1 に記載済み）|
| 地名5語の vocab_type 設計確定 | **中** | 設計決定 | D-20 未解決 |
| D-23 の pendingRows 条件変更と enOnly 呼び出し確定 | **中** | `classifyAndTranslate.gs` | 未設計 |
| 補助列 Q〜T（familyForm / adverbType / timeSubtype / perceptionType） | **低** | `classifyAndTranslate.gs` / シート | 未実装 |
| 画風QAテスト | **低** | `generateImages.gs` | モデル復帰後に実施 |

---

## §8. 参照資料の所在

| 資料 | 場所 | 備考 |
|---|---|---|
| master_prompt_design_guide_v2_5.py | プロジェクトナレッジ | 変更なし・STYLE_BIBLE等 |
| master_prompt_design_guide_v2_6_complete.py | プロジェクトナレッジ（要登録） | 旧3ファイルを統合・4162行 |
| Goi_List.pdf | ユーザーが保持 | 17,908語・780ページ・精査完了 |
| handoff_v4_3.md | プロジェクトナレッジ | メインライン（lesson作成）の最新状態 |
| generateImages.gs | Google Apps Script | 要モデル名変更・要switch-case追加 |
| classifyAndTranslate.gs | Google Apps Script | v1.0稼働中・v2.0仕様は §4-1 |
| extractFromGoiList.gs | Google Apps Script | v1.0稼働中・v2.0仕様は §4-3 |
| setupSpreadsheet.gs | Google Apps Script | 補助列追加仕様は §4-2 |

---

## §9. 次チャットの開始コマンド例

```
image-gen-handoff-v5.0.md と master_prompt_design_guide_v2_6_complete.py を
アップロードしました。

作業①：generateImages.gs のモデル名を変更してください。
  `imagen-4.0-generate-exp` → `imagen-4.0-fast-generate-001`
  変更後に testSingleImage() で1枚生成して動作を確認してください。

作業②：generateImages.gs の buildImagePrompt_() に vocab_type K〜T の
  switch-case を追加してください。
  master_prompt_design_guide_v2_6_complete.py の HOW_TO_USE_v2_6 セクションを参照。

作業③：classifyAndTranslate.gs を v2.0 に更新してください。
  image-gen-handoff-v5.0.md §4-1 の変更①〜⑤を全て実装してください。

作業④：setupSpreadsheet.gs と extractFromGoiList.gs を更新して
  Vocabulary シートを 14列 → 16列（pos2 / goiShurui 追加）に拡張してください。
  仕様は §4-2・§4-3 を参照。

参照: image-gen-handoff-v5.0.md §4（実装仕様）・§7（残タスク一覧）
```

---

*作成日：2026-05-18*
*前資料：image-gen-handoff-v4.0.md（2026-05-18）*
*スコープ：Goi_List.pdf 精査完了・classifyAndTranslate.gs v2.0 設計・補助列仕様確定*
