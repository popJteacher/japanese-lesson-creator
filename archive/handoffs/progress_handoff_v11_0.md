# 進捗引き継ぎ資料
**作成日：2026-05-19（v11.0）**
**このチャットでの作業完了分 + 次チャットへの申し送り**

---

## §0. 最新状況サマリー（v11.0時点・最重要）

```
現行ファイル : gas_pipeline_v5_3_patched.gs（v5.4相当・Claude Code 作成・検証済み）
               → GASエディタへの適用がまだ（次チャット最初のタスク）
             master_prompt_design_guide_v2_9_1.py（4,121行・変更なし）
             image_prompts_lesson01_v1_1.json（17語・v2.9.1準拠・S列投入待ち）
             image_prompts_lesson02_v1_1.json（18語・v2.9.1準拠・S列投入待ち）
               → v10.0 時点では「要再生成」としていたが、プロジェクト内に
                 v2.9.1 準拠のものが存在することを今チャットで確認。再生成不要。

GAS実機状況 : gas_pipeline_v5_3.gs（6パッチ版）は適用済み
             gas_pipeline_v5_3_patched.gs（追加3変更・v5.4相当）は未適用
             → 次チャットで v5.4 を GAS エディタに適用してから生成を開始すること

次チャットの最優先作業:
  ① gas_pipeline_v5_3_patched.gs を GAS エディタに貼り付け・保存（v5.4 として）
  ② testSingleImage()（TARGET="word_先生"）で動作確認
  ③ importImagePromptsFromDriveJson() で lesson_01 S列を投入
  ④ generateImageBatch() で lesson_01 画像生成
  ⑤ importImagePromptsFromDriveJson() で lesson_02 S列を投入
  ⑥ generateImageBatch() で lesson_02 画像生成
  ⑦ 完了後 syncRegistries.gs を実行

別チャット:
  ・画像データの品質検討（このチャットで分岐。別チャット参照）
```

---

## §1. このチャットで完了した作業

### 1-1. gas_pipeline_v5_3.gs の GAS エディタ適用（v10.0 からの持ち越し）

v10.0 時点で「要適用」だった gas_pipeline_v5_3.gs を GAS エディタに適用済み。

### 1-2. image_prompts_lesson02_v1_1.json の存在確認

v10.0 handoff では「要再生成」としていたが、プロジェクト内に
`image_prompts_lesson02_v1_1.json`（44K・v2.9.1準拠）が存在することを確認。
CONSTRAINTS が `anywhere — including titles, labels, captions...` に統一済みで、
再生成不要と判断。

### 1-3. gas_pipeline_v5_3_patched.gs（v5.4相当）の作成（Claude Code）

v5.3 に対して以下3変更＋1修正を追加適用。

| 変更 | 内容 | 検証 |
|---|---|---|
| 変更1 | `processImageEntry_` 冒頭に S列チェックを追加。`row.imagePrompt` が 50文字以下の場合、API 呼び出しをせず `"skipped_no_prompt"` を書き込んで早期 return | ✅ |
| 変更2 | `getPendingImageRows_` が `"pending"` に加えて `"failed_1"` / `"failed_2"` / `"failed_3"` も収集するよう変更。pending を先に処理し、failed_* は残り枠で処理 | ✅ |
| 変更3 | catch ブロックにリトライカウンタを実装。失敗回数を `"failed_N"` 形式で管理し、3回目の失敗で `"failed_final"` に変更して自動再試行を停止 | ✅ |
| 修正 | `resetFailedToPending(lessonRef)` の判定を `imageStatus === "failed"` から `/^failed/.test(imageStatus)` に変更。`failed_1` / `failed_2` / `failed_3` / `failed_final` すべてが pending に戻る。`skipped_no_prompt` は対象外（`failed` で始まらないため） | ✅ |

**ステータス遷移（v5.4）：**

```
pending
  → 生成成功:  generated
  → 失敗1回目: failed_1     ← 次バッチで自動再試行
  → 失敗2回目: failed_2     ← 次バッチで自動再試行
  → 失敗3回目: failed_final ← 自動停止。手動確認が必要
  → S列なし:   skipped_no_prompt ← 再試行しない。S列投入後に手動で pending に変更
```

**generateImageBatch() のログ出力（v5.4）：**
```
成功: N / エラー: N / スキップ: N 件
```

**リトライ回数の補足：**
MAX_RETRIES = 3 のため、failed_1 → failed_2 → failed_final の3回失敗で停止。
failed_3 はフィルタには含まれているが、このコードパスでは生成されない。
4回失敗で停止したい場合は MAX_RETRIES = 4 に変更する。

---

## §2. 現在止まっている箇所

### 2-1. gas_pipeline_v5_3_patched.gs の GAS エディタ未適用

Claude Code が生成・検証済みだが、GAS 実機への反映がまだ。
次チャットの最初のタスク。

### 2-2. lesson_01 / lesson_02 の S列投入・画像生成が未実施

両課とも imageStatus = pending の語彙が残っており、本番生成が未実施。
v5.4 を適用してから生成を開始すること。

---

## §3. 生成済みファイル一覧（v11.0時点）

| ファイル名 | 内容 | 状態 |
|---|---|---|
| `gas_pipeline_v5_3_patched.gs` | v5.3 に3変更＋1修正を追加・v5.4相当 | ✅ 完成（要GASエディタ反映） |
| `gas_pipeline_v5_3.gs` | 6パッチ統合版 | ✅ GASエディタ適用済み（v5.4で上書き予定） |
| `master_prompt_design_guide_v2_9_1.py` | プロンプト設計書（4,121行） | ✅ 完成（変更なし） |
| `image_prompts_lesson01_v1_1.json` | lesson_01 S列プロンプト 17語・v2.9.1準拠 | ✅ S列投入準備完了 |
| `image_prompts_lesson02_v1_1.json` | lesson_02 S列プロンプト 18語・v2.9.1準拠 | ✅ S列投入準備完了 |
| `lesson_01_v1_2.json` | lesson_01 vocab_type 設定済み | ✅ 完成 |
| `lesson_02_vocab_typed.json` | lesson_02 vocab_type 設定済み | ✅ 完成 |

---

## §4. 次チャットの作業手順（詳細）

### ステップ①②：GAS 貼り付けと動作確認

```
1. GAS エディタを開く
2. 既存スクリプトを全選択・削除
3. gas_pipeline_v5_3_patched.gs の内容をペースト・保存
4. testSingleImage()（TARGET_IMAGE_ID = "word_先生"）を実行
5. 生成画像にテキストラベルが出ないこと、正常完了ログが出ることを確認
   → skipped_no_prompt / failed_N カウントが正しく動作するかも確認可
```

### ステップ③④：lesson_01 S列投入・画像生成

```
1. image_prompts_lesson01_v1_1.json を Google Drive にアップロード
2. importImagePromptsFromDriveJson() を実行
   - PROMPT_JSON_FILE_ID に v1_1 のファイルIDを設定してから実行
3. S列（imagePrompt列）に17語分のプロンプトが入ったことを確認
4. generateImageBatch() を実行
   → MAX_BATCH_SIZE=24 で一括生成開始
   → S列なし語彙は skipped_no_prompt になる（正常動作）
5. 生成完了後 syncRegistries.gs を実行して registry に反映
```

### ステップ⑤⑥：lesson_02 S列投入・画像生成

```
1. image_prompts_lesson02_v1_1.json を Google Drive にアップロード
   ※ プロジェクト内に v2.9.1 準拠のファイルが存在することを確認済み
2. importImagePromptsFromDriveJson() を実行
3. S列に18語分のプロンプトが入ったことを確認
4. generateImageBatch() を実行
5. 生成完了後 syncRegistries.gs を実行
```

---

## §5. 確定ルール（v5.4・v2.9.1・全版共通）

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

【S列プロンプト運用（v5.4）】
  S列が 50文字以上 → S列プロンプトで生成（最優先）
  S列が空または 50文字未満 → skipped_no_prompt（フォールバックなし・生成しない）
  skipped_no_prompt からの復帰 → S列を投入してから手動で pending に変更

【failed ステータス運用（v5.4）】
  failed_1 / failed_2 / failed_3 → 次バッチで自動再試行
  failed_final → 自動停止。手動確認・resetFailedToPending() でリセット
  既存の "failed"（カウントなし）→ 0回失敗扱いで再試行対象

【reset関数の使い方（v5.4）】
  resetFailedToPending()              → 全件リセット（failed_* すべてを pending に）
  resetFailedToPending("lesson_01")   → lesson_01 のみリセット
  resetFailedToPending("lesson_02")   → lesson_02 のみリセット
  対象: /^failed/ に一致するすべてのステータス（failed_final 含む）
  対象外: skipped_no_prompt（手動で pending に変更が必要）

【vocab_type の位置づけ（v5.4以降）】
  画像生成ライン: S列があれば vocab_type は使われない（スキップで生成不可）
  教材生成ライン（SKILL.md）: 引き続き必要。lesson_NN.json に含まれる。
  Goi_List 語彙の vocab_type: classifyAndTranslate.gs が自動付与（毎時3語）
```

---

## §6. 未解決の事項（v11.0時点）

| 問題 | 優先度 | 対処方針 |
|---|---|---|
| gas_pipeline_v5_3_patched.gs の GAS エディタ反映 | 🔴 最優先 | 次チャット冒頭 |
| lesson_01 / lesson_02 の S列投入・画像生成 | 🔴 最優先 | §4 手順参照 |
| 画像データの品質検討 | 🔴 別チャット | 別チャットで実施中 |
| 例文画像の GAS 関数なし | 🟡 中 | 語彙カード完了後に設計。Examples シートに imageStatus/imageUrl 列も未追加 |
| GVE30 残り14課未収録 | 🟡 中 | 課進行に応じて段階追加 |
| BUILDING_CUES に ビル・市役所 未登録 | 🟢 低 | S列プロンプト優先中は不要 |

---

## §7. パイプライン設計メモ（このチャットで整理した知識）

### 語彙カード画像の生成フロー全体

```
【課マスターからの場合】
  lesson_NN.json（vocab_type付き）
    → importFromLessonJson.gs で Vocabulary シートに投入
    → Claude が master_prompt_design_guide を読んで S列プロンプト集を生成
    → image_prompts_lesson_NN_v1_1.json を Drive にアップロード
    → importImagePromptsFromDriveJson() で S列投入
    → 以降は GAS タイマーで自動（generateImageBatch → syncRegistries）

【Goi_List からの場合】
  extractFromGoiList.gs で Vocabulary シートに投入
    → classifyAndTranslate.gs が vocab_type を自動付与（毎時3語）
    → Claude が S列プロンプト集を生成・Drive アップロード・S列投入
    → 以降は同上
```

### 例文画像について（現状・将来）

```
現状:
  ・GAS 関数は存在しない（未実装）
  ・Examples シートに imageStatus / imageUrl 列がない
  ・ex_L* エントリは master_image_registry_v2_0.json で保護されている
  ・一部（ex_L01_007〜015）は過去に手動生成・URL あり

将来実装時に必要なもの:
  ・Examples シートへの imageStatus / imageUrl 列追加
  ・generateExampleImageBatch() 関数の新規作成
  ・Template C（16:9・キャラクター指定・会話シーン）に基づく S列プロンプト
  ・syncRegistries.gs の保護リストから ex_L* を外すタイミングの検討
```

---

## §8. ファイルの所在と ID

```
スプレッドシート ID : 1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk
lesson_01 JSON ID  : 1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c
lesson_02 JSON ID  : 1GyrtTYe9b-sPy10L4_XwB6dMmQdsfT2z
image registry ID  : 14NL_LqudXIQzY68klspH3SBlR21hiqbW
audio registry ID  : 1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0
lesson_01 S列 JSON : image_prompts_lesson01_v1_1.json（Drive アップロード後に PROMPT_JSON_FILE_ID を設定）
lesson_02 S列 JSON : image_prompts_lesson02_v1_1.json（Drive アップロード後に PROMPT_JSON_FILE_ID を設定）
```

---

*v10.0：2026-05-19（GAS v5.2 × マスターガイド v2.9.1 全面突き合わせ実施、6問題特定、Claude Code で gas_pipeline_v5_3.gs 生成・全パッチ検証合格）*
*v11.0：2026-05-19（gas_pipeline_v5_3.gs GASエディタ適用完了、lesson_02 v1_1 JSON 存在確認、Claude Code で v5.4 パッチ作成：S列なし→スキップ・failed 自動再試行・リトライカウンタ・resetFailedToPending 拡張）*
