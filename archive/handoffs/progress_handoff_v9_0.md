# 進捗引き継ぎ資料
**作成日：2026-05-19（v9.0）**
**このチャットでの作業完了分 + 次チャットへの申し送り**

---

## §0. 最新状況サマリー（v9.0時点・最重要）

```
現行ファイル : master_prompt_design_guide_v2_9_1.py（4,121行）
             image_prompts_lesson01_v1_1.json（17語・v2.9.1準拠）
             image_prompts_lesson02_v1_1.json（18語・v2.9.1準拠）
             generateImages_v5_1.gs（S列優先ロジック追加）

GAS実機状況 : generateImages.gs は実機で v5.2 になっている（内容未確認）
ステータス   : word_先生 のテスト生成で「教師」テキスト問題を修正済み
               → 2回目テストで合格画像を確認（テキストなし・フルボディ・スタイル合格）
               → ただし GAS v5.2 の実態が不明なため、次チャットで突き合わせが必要

次チャットの最優先作業:
  ① generateImages.gs（実機 v5.2）をアップロードして内容確認
  ② master_prompt_design_guide_v2_9_1.py と突き合わせ
  ③ 矛盾点・問題点を洗い出してGASを整理・修正
  ④ 整理後に importImagePromptsFromDriveJson() でS列投入
  ⑤ resetFailedToPending("lesson_01") → generateImageBatch() 実行
```

---

## §1. このチャットで完了した作業

### 1-1. 問題分析：テスト画像「教師」テキスト生成の根本原因特定

`testSingleImage()` で `word_先生` を生成したところ、画像上部に「教師」という
テキストラベルが出力された問題の根本原因を特定した。

**原因：v2.4 で加えた `"inside the image"` 限定句の副作用**

| バージョン | 制約文 | 問題 |
|---|---|---|
| v7（動作済み） | `No text, no letters, no numbers, no symbols.` | なし |
| v2.9（問題あり） | `No text, ... no symbols inside the image.` | Imagenが「外側はOK」と解釈してタイトルを生成 |

v2.4 でテンプレートF/G/H/J（矢印許可）のためにグローバル制約を弱めた副作用として、
Template A/C/D/E/I にも弱い表現が混入していた。

### 1-2. master_prompt_design_guide_v2_9_1.py（パッチ修正・完成）

v2.9 に対してピンポイントの CONSTRAINTS 修正のみ実施。

| 修正対象 | 旧 | 新 |
|---|---|---|
| STYLE_BIBLE global constraints | `inside the image` | `anywhere — including titles, labels, captions...` |
| **Template A** vocabulary_person | `inside the image` | `anywhere — including titles, labels, captions...` |
| **Template C** example_sentence | `inside the image` | `anywhere` + 教育的記号（✓/✗/❓）はSCENE記述で許可 |
| **Template D** vocabulary_object | `inside the image` | `anywhere — including titles, labels, captions...` |
| **Template E** vocabulary_variant_grid | `inside the image` | `anywhere — including titles, labels, captions...` |
| **Template I** abstract_concept | `inside the image` | `anywhere` + 抽象メタファー記号はSCENE記述で許可 |

**意図的に変更しなかったもの：**
- Template B（建物）：既に `anywhere in the image` 形式で問題なし
- Template F/G/H/J/K：教育的記号を明示許可しており現状維持
- HEXコード：v2.9の「色名のみ・品質維持確認済み」設計を維持
- カメラ角度：v2.4の俯瞰防止修正を維持

```
ファイル : master_prompt_design_guide_v2_9_1.py（4,121行）
行数増加 : 4,094行（v2.9）→ 4,121行（v2.9.1）
```

### 1-3. image_prompts_lesson01_v1_1.json（S列プロンプト再生成・完成）

v2.9.1 の修正済み CONSTRAINTS を適用して全17語を再生成。

```
person:   医者・会社員・学生・大学生・先生・国籍7語（12語）→ Template A
building: 病院・学校・銀行・大学・デパート（5語）         → Template B
```

**全語 CONSTRAINTS チェック：** `anywhere — including titles, labels, captions...` ✅

v1_0 との主な差分：
- 旧：`No text, no letters, no numbers, no symbols inside the image.`
- 新：`No text, no letters, no numbers, no symbols anywhere — including titles, labels, captions, or any text overlay at any position in the rendered output.`
- 国籍7語：旗バッジ（形状・色）の CONSTRAINTS 例外を明示追加

### 1-4. image_prompts_lesson02_v1_1.json（S列プロンプト再生成・完成）

v2.9.1 の修正済み CONSTRAINTS を適用して全18語を再生成。

```
concrete_object: 時計・腕時計・ペン・鉛筆・ケータイ・本・雑誌・新聞・
                 かばん・消しゴム・山・犬・写真（13語）→ Template D
building:        ビル・病院・市役所（3語）              → Template B
person:          人・わたし（2語）                      → Template A
```

**特記事項：**
- 腕時計：ウォッチバンドを MANDATORY シグネチャーとして明示（時計との区別）
- 雑誌：マストヘッドバナーを MANDATORY とし「文字でなく色ブロックで」を明示
- 新聞：カラム線を MANDATORY とし「文字でなく平行線で」を明示
- わたし：胸に手を当てる自己指示ジェスチャーを明示
- 病院：`_note` フィールドに「lesson_01と同一・流用可」を記載

### 1-5. generateImages_v5_1.gs（S列優先ロジック実装・完成）

v5.0 に対して3点の機能追加・修正を実施。

**修正①：S列優先ロジック実装（最重要）**

```javascript
// getAllImageRows_(): 読み取り列を拡張
// 旧: sheet.getRange(2, 1, ..., 14)  ← A〜N列のみ（S列を読んでいなかった）
// 新: sheet.getRange(2, 1, ..., 19)  ← A〜S列（S列=imagePromptを読む）

// buildImagePrompt_(): S列優先分岐を追加
if (row.sPrompt && row.sPrompt.length > 50) {
  return row.sPrompt;   // S列プロンプトを最優先使用
}
// 空の場合のみ vocab_type テンプレートにフォールバック
```

**修正②：resetFailedToPending() 追加**

```javascript
resetFailedToPending()              // 全件リセット
resetFailedToPending("lesson_01")   // lesson_01 のみリセット
```

APIキーエラー等で `failed` になった語彙を `pending` に戻す。

**修正③：フォールバックテンプレートの CONSTRAINTS 修正**

| テンプレート | 修正 |
|---|---|
| buildPersonPrompt_（Template A） | `inside the image` → `anywhere...` |
| buildConcreteObjectPrompt_（Template D） | `inside the image` → `anywhere...` |
| buildAbstractConceptPrompt_（Template I） | `inside the image` → `anywhere...` |
| buildDefaultPrompt_（default） | `inside the image` → `anywhere...` |
| buildActionVerbPrompt_（Template H） | 矢印許可のため維持 |
| buildAdjectivePrompt_（Template J） | コントラスト記号許可のため維持 |

**修正④：PERSON_PROFILES["医者"] clipboard 削除**
```
旧: "...Professional confident posture, holding a clipboard."
新: "...Professional confident posture. DO NOT add a clipboard..."
```

---

## §2. 現在止まっている箇所

### 2-1. GAS実機 v5.2 の内容が未確認

GAS実機のgenerateImages.gsはv5.2になっているが、このチャットで作成した
v5.1との差分が不明。次チャットで突き合わせが必要。

### 2-2. GAS全体のコードが複雑化・散在している

以下の問題が複合的に存在することが判明：
- フォールバックテンプレートのベースが v2.5 系のまま残っている箇所がある
- S列優先ロジックは v5.1 で追加したが、v5.2 で上書きされた可能性
- 複数のスクリプトファイル間での設定重複・矛盾の可能性
- PERSON_PROFILES等の辞書とマスターガイドの VISUAL_CANON_RULE の整合性未確認

**→ 次チャットで全体を突き合わせて一度クリーンにする**

---

## §3. 生成済みファイル一覧（v9.0時点）

| ファイル名 | 内容 | 状態 |
|---|---|---|
| `master_prompt_design_guide_v2_9_1.py` | プロンプト設計書（4,121行）| ✅ 完成 |
| `image_prompts_lesson01_v1_1.json` | lesson_01 S列プロンプト17語・v2.9.1準拠 | ✅ 完成 |
| `image_prompts_lesson02_v1_1.json` | lesson_02 S列プロンプト18語・v2.9.1準拠 | ✅ 完成 |
| `generateImages_v5_1.gs` | S列優先・resetFailedToPending追加 | ✅ 完成（実機v5.2と要突き合わせ） |
| `lesson_01_v1_2.json` | lesson_01 vocab_type設定済み | ✅ 完成（前チャット） |
| `lesson_02_vocab_typed.json` | lesson_02 vocab_type設定済み | ✅ 完成（前チャット） |

---

## §4. 次チャットの最優先作業（GAS突き合わせ）

### 持ち込むファイル（必須）

```
1. generateImages.gs（GAS実機から直接コピーしたもの・v5.2）  ← 最重要
2. master_prompt_design_guide_v2_9_1.py
3. image_prompts_lesson01_v1_1.json
4. 本ハンドオフ（progress_handoff_v9_0.md）
```

### 確認する観点

```
① GAS v5.2 と v5.1 の差分
   → S列優先ロジックが v5.2 にあるか？
   → resetFailedToPending() があるか？
   → CONSTRAINTS が "inside the image" のままか？

② GAS内フォールバックテンプレートとマスターガイドの整合性
   → PERSON_PROFILES の内容が VISUAL_CANON_RULE と一致しているか
   → BUILDING_CUES が BUILDING_CUES辞書（マスターガイド）と一致しているか
   → STYLE_RECIPE 文字列が v2.9.1 の core_style と一致しているか

③ 複数スクリプトファイル間の整合性
   → 設定値（SPREADSHEET_ID, IMAGE_FOLDER_ID等）の重複・矛盾
   → 列番号マッピング（A〜S）の各スクリプト間での一致

④ 不要コード・デッドコードの有無
   → v5.0以前の残骸関数
```

---

## §5. 確定ルール（v2.9.1・全版共通）

```
【テキスト禁止制約】
  Template A/C/D/E/I（語彙カード・例文）:
    "No text, no letters, no numbers, no symbols anywhere —
     including titles, labels, captions, or any text overlay
     at any position in the rendered output."
  Template F/G/H/J/K（矢印・記号を使う教育テンプレート）:
    "No text, no letters, no numbers inside the image."
    + 各テンプレートの明示的な記号許可文

【肌色ルール】
  汎用人物（person, building）→ 肌色フレーズなし（diverse_unspecified）
  例文人物（example_sentence）→ "Gender-neutral avatar, neutral cool light gray skin."
  固定5名 → 各 NAMED_CHARACTER_PROFILES の個別ヒントに従う
  旧フレーズ "Skin tones: naturally warm medium skin tone." は使用禁止

【アスペクト比】
  GAS経由 → プロンプト本文にアスペクト比文を書かない（API側で1:1付与）
  手動・例文 → 先頭に "Square 1:1 aspect ratio." / "Wide 16:9 aspect ratio."

【VISUAL_CANON_RULE】
  医者   = 白衣 + 聴診器（首）のみ。クリップボード禁止。
  先生   = マーカー または 教科書を持つ。ホワイトボード背景不要。

【S列プロンプト優先】
  generateImageBatch() は S列が埋まっている場合は S列を最優先で使用
  S列が空の場合のみ vocab_type テンプレートにフォールバック
  （S列有効判定：50文字以上）

【vocab_type 設定ゲート】
  vocab_type = null のままプロンプト生成を始めない（停止条件）
```

---

## §6. 未解決の事項

| 問題 | 優先度 | 対処方針 |
|---|---|---|
| GAS実機 v5.2 の内容確認 | 🔴 最優先 | 次チャットで突き合わせ |
| GASコード全体の整合性・複雑化 | 🔴 最優先 | 次チャットでクリーン化 |
| lesson_01 画像生成未実施 | 🔴 次 | GAS整理後 resetFailedToPending → generateImageBatch |
| lesson_02 画像生成未実施 | 🟠 その後 | lesson_01 完了後 |
| 例文画像の GAS 関数なし | 🟡 中 | 語彙カード完了後に設計 |
| GVE30 残り14課未収録 | 🟡 中 | 課進行に応じて段階追加 |
| BUILDING_CUES に ビル・市役所 未登録 | 🟢 低 | S列プロンプトが優先されるため現時点は不要 |

---

*v8.0：2026-05-19（v2.9作成、lesson_01/02 vocab_type設定、lesson_02 S列生成、GAS整理、APIキーエラー発生）*
*v9.0：2026-05-19（テスト画像分析・根本原因特定、v2.9.1作成、JSON v1.1再生成、generateImages v5.1作成、GAS v5.2との突き合わせを次チャットに申し送り）*
