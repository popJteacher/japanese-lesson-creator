# 進捗引き継ぎ資料
**作成日：2026-05-19（v10.0）**
**このチャットでの作業完了分 + 次チャットへの申し送り**

---

## §0. 最新状況サマリー（v10.0時点・最重要）

```
現行ファイル : gas_pipeline_v5_3.gs（Claude Code により生成・全6パッチ検証済み）
             master_prompt_design_guide_v2_9_1.py（4,121行・変更なし）
             image_prompts_lesson01_v1_1.json（17語・v2.9.1準拠・S列投入準備完了）
             image_prompts_lesson02_v1_0.json（18語・v2.9準拠・要再生成）

GAS実機状況 : gas_pipeline_v5_3.gs をまだ GAS エディタに貼り付けていない
             → 貼り付けと testSingleImage() が次チャットの最初のタスク

次チャットの最優先作業:
  ① gas_pipeline_v5_3.gs を GAS エディタに貼り付け・保存
  ② testSingleImage()（TARGET="word_先生"）で CONSTRAINTS 修正の効果を確認
  ③ importImagePromptsFromDriveJson() で lesson_01 S列を投入
  ④ resetFailedToPending("lesson_01") → generateImageBatch() 実行
  ⑤ lesson_02 用に image_prompts_lesson02_v1_1.json を再生成（v1_0 は v2.9 形式で要更新）
  ⑥ importImagePromptsFromDriveJson() で lesson_02 S列を投入
  ⑦ resetFailedToPending("lesson_02") → generateImageBatch() 実行
```

---

## §1. このチャットで完了した作業

### 1-1. GAS v5.2 と master_prompt_design_guide_v2_9_1.py の突き合わせ（コード監査）

5つの観点で徹底的に突き合わせを実施し、以下の問題を特定した。

#### 最重要発見：v5.1 で入れた修正の大半が v5.2 で失われていた

| 項目 | handoff が想定する v5.1 | 実機 v5.2 の実態 |
|---|---|---|
| フォールバックCONSTRAINTS | `anywhere — including...` に統一 | **`inside the image` のまま（未反映）** |
| S列有効判定 | 50文字以上 | **非空判定のみ（変質）** |
| S列フィールド名 | handoffは `sPrompt` と記載 | **`imagePrompt`（名称不一致）** |
| reset関数名・仕様 | `resetFailedToPending("lesson_01")` | **`resetFailedImagesToPending()`（引数なし・全件のみ）** |
| 医者clipboard削除 | 削除済み | ✅ 反映済み |

#### その他の発見

| 観点 | 発見内容 |
|---|---|
| `addImagePromptColumn()` 二重定義 | v5.2 末尾に壊れた stub が残存。後勝ちで S_COL/sheet が未定義 → 実行時エラー |
| `PERSON_PROFILES["会社員"]` | "business casual" で VISUAL_CANON（スーツ+ブリーフケース）と不一致 |
| STYLE_RECIPE コメント | "完全転記/変更厳禁/v2_5準拠/skin_tones追加" 等が不正確 |
| lesson_02 JSON | プロジェクトに v1_0 のみ存在（v2.9形式 = `inside the image` ×15）。v1_1 は欠落 |
| `/mnt/project/generateImages.gs` | v5.0（2026-05-15）。v5.2 とは別物。以降は gas_pipeline_v5_3.gs を正とする |

### 1-2. gas_pipeline_v5_3.gs の作成（Claude Code）

突き合わせ結果に基づき 6 パッチを適用した統合スクリプトを生成。
Claude Code の検証スクリプト（`scripts/apply_v5_3_patches.py`）により全項目合格を確認。

| パッチ | 内容 | 検証 |
|---|---|---|
| PATCH 1 | `buildPersonPrompt_` / `buildConcreteObjectPrompt_` / `buildAbstractConceptPrompt_` / `buildDefaultPrompt_` の CONSTRAINTS を `anywhere — including titles, labels, captions...` に統一 | ✅ |
| PATCH 2 | S列有効判定を `trim().length > 50` に修正（§5確定ルール準拠） | ✅ |
| PATCH 3 | `resetFailedToPending(lessonRef)` 新設・`lessonRef` 引数で課を絞り込み可。`resetFailedImagesToPending()` を後方互換エイリアスとして残置 | ✅ |
| PATCH 4 | `PERSON_PROFILES["会社員"]` を VISUAL_CANON_RULE 準拠（ネイビー/チャコールのスーツ＋ブリーフケース）に修正 | ✅ |
| PATCH 5 | `addImagePromptColumn()` の二重定義を解消。壊れた stub を削除し、`clearDataValidations()` を正規定義に統合 | ✅ |
| PATCH 6 | STYLE_RECIPE コメントを「v2.9.1 相当の等価表現」に是正。`完全準拠`/`完全転記`/`v5.2追加sub_color` 等の不正確表現を除去 | ✅ |

**検証合格項目（Claude Code 実施）：**
- ✓ 関数名重複なし
- ✓ 上記4関数から `inside the image` が消え `anywhere — including...` が存在
- ✓ `inside the image` が buildPronounPrompt_ / buildTimePrompt_ 等（スコープ外・意図通り）に残存
- ✓ S列判定が `trim().length > 50` に変更済み
- ✓ `resetFailedToPending(lessonRef)` 新設、`resetFailedImagesToPending` がエイリアスとして残存
- ✓ `addImagePromptColumn` が1箇所のみ定義、`clearDataValidations` 統合済み
- ✓ STYLE_RECIPE コメントが v2.9.1 等価表現に変更
- ✓ ファイル冒頭・`generateImageBatch()` ログ・変更履歴ブロックすべて v5.3 / 2026-05-19 表記

---

## §2. 現在止まっている箇所

### 2-1. GAS エディタへの貼り付けがまだ

`gas_pipeline_v5_3.gs` は生成・検証済みだが、GAS実機への反映がまだ。
次チャットで最初に実施する。

### 2-2. lesson_02 S列プロンプト v1_1 が存在しない

プロジェクトの `image_prompts_lesson02_v1_0.json` は v2.9 形式（`inside the image` ×15）。
v2.9.1 準拠の v1_1 は前チャットで生成されたはずだが、プロジェクトに未保存。
lesson_02 の画像生成前に必ず v1_1 を再生成・確認すること。

### 2-3. 画像生成本番がまだ

lesson_01・lesson_02 とも imageStatus=pending の語彙が残っており、本番生成が未実施。

---

## §3. 生成済みファイル一覧（v10.0時点）

| ファイル名 | 内容 | 状態 |
|---|---|---|
| `gas_pipeline_v5_3.gs` | 全モジュール統合・6パッチ適用・検証済み | ✅ 完成（要GASエディタ反映） |
| `master_prompt_design_guide_v2_9_1.py` | プロンプト設計書（4,121行） | ✅ 完成（変更なし） |
| `image_prompts_lesson01_v1_1.json` | lesson_01 S列プロンプト 17語・v2.9.1準拠 | ✅ S列投入準備完了 |
| `image_prompts_lesson02_v1_1.json` | lesson_02 S列プロンプト 18語・v2.9.1準拠 | ❌ **要再生成**（v1_0のみ現存） |
| `lesson_01_v1_2.json` | lesson_01 vocab_type 設定済み | ✅ 完成（前チャット） |
| `lesson_02_vocab_typed.json` | lesson_02 vocab_type 設定済み | ✅ 完成（前チャット） |

---

## §4. 次チャットの作業手順（詳細）

### ステップ①②：GAS 貼り付けと動作確認

```
1. GAS エディタを開く
2. 既存の統合スクリプトを全選択・削除
3. gas_pipeline_v5_3.gs の内容をペースト・保存
4. testSingleImage()（TARGET_IMAGE_ID = "word_先生"）を実行
5. 生成画像に「教師」等のテキストラベルが出ないことを確認
   → 出なければ PATCH 1（CONSTRAINTS統一）が正常に機能している
```

### ステップ③④：lesson_01 S列投入・画像生成

```
1. image_prompts_lesson01_v1_1.json を Google Drive にアップロード
2. importImagePromptsFromDriveJson() を実行
   - PROMPT_JSON_FILE_ID に v1_1 のファイルIDを設定してから実行
3. S列（imagePrompt列）に17語分のプロンプトが入ったことを確認
4. resetFailedToPending("lesson_01") を実行
   → lesson_01 の failed 行が pending に戻る
5. generateImageBatch() を実行
   → MAX_BATCH_SIZE=24 で一括生成開始
6. 生成完了後 syncRegistries.gs を実行して registry に反映
```

### ステップ⑤：lesson_02 S列プロンプト v1_1 の再生成

```
image_prompts_lesson02_v1_0.json（現存）は v2.9 形式のため再生成が必要。

生成条件（master_prompt_design_guide_v2_9_1.py 準拠）:
- 18語の vocab_type: concrete_object ×13、building ×3、person ×2
- CONSTRAINTS: anywhere — including titles, labels, captions...（絶対禁止）
- 腕時計: ウォッチバンドをMANDATORYシグネチャーとして明示（時計との区別）
- 雑誌: OBJECT_SIGNATURES["雑誌"] を参照してマストヘッドバナーをMANDATORYに
- 新聞: OBJECT_SIGNATURES["新聞"] を参照してカラム線をMANDATORYに
- わたし: 胸に手を当てる自己指示ジェスチャーを明示
- 病院: _note フィールドに「lesson_01と同一・流用可」を記載
- アスペクト比プレフィックスなし（GAS経由 = ASPECT_RATIO: "1:1" を API側で付与）
- 肌色フレーズなし（diverse_unspecified）

完成したら Drive にアップロードし、
importImagePromptsFromDriveJson() → resetFailedToPending("lesson_02")
→ generateImageBatch() の順で実行。
```

---

## §5. 確定ルール（v5.3・v2.9.1・全版共通）

```
【テキスト禁止制約】
  Template A/C/D/E/I（語彙カード・例文）:
    "No text, no letters, no numbers, no symbols anywhere —
     including titles, labels, captions, or any text overlay
     at any position in the rendered output."
  Template B（建物）:
    例外: 建物サイネージ1語のみ許可。それ以外は anywhere で禁止。
  Template F/G/H/J/K〜T（記号・矢印を使う教育テンプレート）:
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
  医者   = 白衣 + 聴診器（首にかける）のみ。クリップボード・他の医療器具禁止。
  先生   = マーカー または 教科書を持つ。ホワイトボード背景不要。
  会社員 = ネイビーまたはチャコールのビジネススーツ + ブリーフケース/ラップトップバッグ。
  学生   = バックパック または ノート。ビジネス服装禁止。

【S列プロンプト優先】
  generateImageBatch() は S列が 50文字以上の場合を S列を最優先で使用（v5.3）
  S列が空または50文字未満の場合のみ vocab_type テンプレートにフォールバック

【vocab_type 設定ゲート】
  vocab_type = null のままプロンプト生成を始めない（停止条件）

【reset関数の使い方（v5.3）】
  resetFailedToPending()              → 全件リセット
  resetFailedToPending("lesson_01")   → lesson_01 のみリセット
  resetFailedToPending("lesson_02")   → lesson_02 のみリセット
  ※ resetFailedImagesToPending() は旧名エイリアス（全件リセット相当）
```

---

## §6. 未解決の事項（v10.0時点）

| 問題 | 優先度 | 対処方針 |
|---|---|---|
| GAS v5.3 エディタ反映・testSingleImage() 確認 | 🔴 最優先 | 次チャット冒頭 |
| lesson_01 S列投入・画像生成 | 🔴 最優先 | 手順④③参照 |
| lesson_02 S列 v1_1 再生成 | 🔴 次 | 手順⑤参照 |
| lesson_02 画像生成 | 🟠 その後 | lesson_01 完了後 |
| 例文画像の GAS 関数なし | 🟡 中 | 語彙カード完了後に設計 |
| GVE30 残り14課未収録 | 🟡 中 | 課進行に応じて段階追加 |
| BUILDING_CUES に ビル・市役所 未登録 | 🟢 低 | S列プロンプト優先中は不要 |

---

## §7. ファイルの所在と ID

```
スプレッドシート ID : 1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk
lesson_01 JSON ID  : 1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c
lesson_02 JSON ID  : 1GyrtTYe9b-sPy10L4_XwB6dMmQdsfT2z
image registry ID  : 14NL_LqudXIQzY68klspH3SBlR21hiqbW
audio registry ID  : 1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0
lesson_01 S列 JSON : image_prompts_lesson01_v1_1.json（要 Drive アップロード）
                     Drive上ファイルID: PROMPT_JSON_FILE_ID に設定して使用
lesson_02 S列 JSON : image_prompts_lesson02_v1_1.json（要再生成 → Drive アップロード）
```

---

*v9.0：2026-05-19（テスト画像分析・根本原因特定、v2.9.1作成、JSON v1.1再生成、generateImages v5.1作成）*
*v10.0：2026-05-19（GAS v5.2 × マスターガイド v2.9.1 全面突き合わせ実施、6問題特定、Claude Code で gas_pipeline_v5_3.gs 生成・全パッチ検証合格）*
