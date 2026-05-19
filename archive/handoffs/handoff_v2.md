# 引き継ぎ資料：統合版（2ライン合流 + GASパイプライン v8 統合）
**バージョン：v2.0（2026-05-16）**
**前資料：handoff_post_merger_v1.md（ラインA+B合流版）/ gas_pipeline_handoff_v8.md（GAS最新版）**
**このチャットで確認したこと：GAS v8 状態取り込み・SKILL.md v1.2 完成確認・B-1〜B-4 完了確認**

> ⚠️ **前回資料（handoff_post_merger_v1.md）からの主な変更点**
> - ライン B の B-1〜B-4「手動実行待ち」→ **全完了に更新**
> - SKILL.md「未着手」→ **v1.2 完成に更新**
> - GAS パイプライン詳細セクションを v8 情報で刷新
> - B-5（Imagen 4 Ultra・75枚/日化）→ **旧計画廃止・デュアルモデル戦略（50枚/日）に確定**

---

## 1. プロジェクト全体の位置づけ

```
【ライン A：japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTML/教案docxを生成するWebツール
  → Plan_v1_1.md に従って Stage を進行中

【ライン B：GASパイプライン】（本資料の主要スコープ）
  語彙・例文の画像・音声を自動生成してGoogle Driveに蓄積する
  → master_image_registry.json / master_audio_registry.json にURLを記録

【連携インターフェース】
  master_image_registry.json → image_resolver.js → slide_html.js
  master_audio_registry.json → homework_html.js（将来）
  build-embedded-data.py で両ラインを手動接続
```

---

## 2. 両ラインの現在地（2026-05-16 深夜時点）

### ライン A（japanese-lesson-creator）

| Step / Stage | 内容 | 状態 |
|---|---|---|
| Step 1 | 生成エンジン（4ファイル出力） | ✅ 完了（2026-05-14）|
| Step 2 | フォーム UI | ✅ 完了（2026-05-14）|
| Step 3 | アクティビティ UI 実装（8件・CLAUDE.md定義スコープ） | 🔄 進行中（8件全て未完了。act_online_roulette は Step 3 スコープ外で完了済み）|
| Stage 1〜7 | 命名規則統一・audioId・FlowSynthesizer修正・スライド更新・ビルド確認 | ✅ 全完了 |

**Step 3 残り8件（優先順）：**

| 優先 | ID | stage |
|---|---|---|
| 1 | `act_memory_matching` | stage2-3 |
| 2 | `act_vocab_bingo` | stage2-3 |
| 3 | `act_whiteboard_categorize` | stage2-3 |
| 4 | `act_grammar_auction` | stage3 |
| 5 | `act_battleship` | stage3-4 |
| 6 | `act_person_guessing_quiz` | stage3-4 |
| 7 | `act_personality_quiz` | stage3-4 |
| 8 | `act_hajimemashite_conversation` | stage4-5 |

### ライン B（GASパイプライン）

| タスク | 状態 | 備考 |
|---|---|---|
| GASスクリプト 8本 | ✅ 完成 | setupSpreadsheet / seedLesson01 / extractFromGoiList / importFromLessonJson / classifyAndTranslate / generateImages / generateAudio / syncRegistries |
| B-1：ScriptProperties 設定 | ✅ 完了 | GEMINI_API_KEY / SPREADSHEET_ID / IMAGE_FOLDER_ID / AUDIO_FOLDER_ID |
| B-2：スプレッドシート初期構築（setupAll） | ✅ 完了 | Vocabulary / Examples / Log シート作成済み |
| B-3：データ投入 | ✅ 完了 | seedAll（17語・15例文）/ extractN5（412語）/ importLesson01（国籍7語・全スキップ確認）|
| B-4：タイマートリガー登録 | ✅ 完了 | 8本全て登録済み（詳細は §4 参照）|
| B-5：デュアルモデル戦略（50枚/日）| ✅ 方針変更済み・完了 | 旧計画（Imagen 4 Ultra・75枚/日）は廃止。Ultraモデルの存在が確認できず、Standard+Fastの2モデルで50枚/日に変更 |

> **B-5 経緯（確定）**：v6以前の旧計画では Standard + Fast + Ultra の3モデルで25×3 = 75枚/日を想定していた。しかし Imagen 4 Ultra のモデル名が確認できなかったため、Standard + Fast のデュアル運用（25×2 = **50枚/日**）に方針変更済み。v8 の記載が正しい。

---

## 3. 課マスター設計ライン（SKILL化）

| タスク | 状態 | 備考 |
|---|---|---|
| SKILL.md 作成（/mnt/skills/ 配下） | ⚠️ 未デプロイ | v1.2 完成・168フィールド照合済み。現在は `/mnt/project/SKILL.md` としてプロジェクトナレッジ経由で参照可能。`/mnt/skills/user/` ディレクトリが存在せず、スキルとしての自動トリガーは未設定。 |
| lesson_template.json v1.2 作成 | ✅ 完成 | lesson_01.json v2.11.4 を SSOT として作成・差分ゼロ確認済み |
| design_tokens | ✅ 運用中 | JSON版（v1.1）はプロジェクトナレッジ内の設計仕様SSOT。実装は `src/styles/design_tokens.css`。役割分担は意図的。|
| lesson_02.json 整備 | ⏳ 未完了 | 不足フィールド補完（canDoEn・practiceImageSource・audioId・isAnchor）|

---

## 4. GASパイプライン詳細状態

### 自動実行中のトリガー（全8本・稼働中）

| 関数 | 頻度 | モデル | 状態 |
|---|---|---|---|
| `classifyBatch` | **毎時** | Gemma 4 26B（`gemma-4-26b-a4b-it`） | 🔄 3語/回。残り約327語（約5日で完了）|
| `generateImageBatch` | 毎日 9:00・13:00・17:00 | Imagen 4（`imagen-4.0-generate-001`） | 🔄 vocab_type 記入済み語彙のみ処理 |
| `generateAudioBatch` | 毎日 10:00・14:00・18:00 | Gemini TTS（`gemini-2.5-flash-preview-tts`） | 🔄 最大10件/日 |
| `syncAll` | 毎日 23:00 | - | 🔄 registry.json に書き戻し |

### 現在の処理待ち件数（2026-05-16時点）

| 処理 | 残件数 | 完了見込み |
|---|---|---|
| classifyBatch（en / vocab_type 付与） | 約327語 | 約5日後 |
| generateImageBatch（画像生成） | vocab_type 埋まり次第自動開始 | classifyBatch 完了後に加速 |
| generateAudioBatch（音声生成） | 並行処理中（10件/日） | |

### 確定済み設定値

**ScriptProperties（全て設定済み）：**

| キー | 状態 |
|---|---|
| `GEMINI_API_KEY` | ✅ 設定済み |
| `SPREADSHEET_ID` | ✅ `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` |
| `IMAGE_FOLDER_ID` | ✅ 設定済み |
| `AUDIO_FOLDER_ID` | ✅ 設定済み |

**コード内定数（確定済み）：**

```javascript
SPREADSHEET_ID: "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk"

// EXTRACT_SETTINGS
GOI_LIST_FILE_ID: "1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA"

// LESSON_FILE_IDS
lesson_01: "1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c"

// SYNC_SETTINGS
IMAGE_REGISTRY_ID: "14NL_LqudXIQzY68klspH3SBlR21hiqbW"
AUDIO_REGISTRY_ID: "1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0"

// CLASSIFY_SETTINGS
MODEL: "gemma-4-26b-a4b-it"
BATCH_SIZE: 3   // Gemma 4 thinking mode 対策で3に制限（理由は §5 問題⑨）

// IMAGE_SETTINGS
MODEL: "imagen-4.0-generate-001"

// AUDIO_SETTINGS
MODEL: "gemini-2.5-flash-preview-tts"
VOICE_NAME: "Aoede"
```

### このAPIキーで使えるモデル一覧（確定情報）

| 用途 | モデル | 状態 |
|---|---|---|
| テキスト分類 | `gemma-4-26b-a4b-it` | ✅ 使用可 |
| テキスト分類（代替・未確認） | `gemma-4-31b-it` | 未確認 |
| 画像生成 | `imagen-4.0-generate-001` | ✅ 使用可（25枚/日）|
| 画像生成（代替） | `imagen-4.0-fast-generate-001` | ✅ 使用可（25枚/日）|
| 音声生成 | `gemini-2.5-flash-preview-tts` | ✅ 使用可（10件/日）|
| 音声生成（代替・未確認） | `gemini-3.1-flash-preview-tts` | 未確認 |
| ❌ 使用不可 | `gemini-2.0-flash` | limit: 0 |
| ❌ 使用不可 | `gemini-1.5-flash` | 404 Not Found |
| ❌ 使用不可 | `gemma-3-27b-it` | 404 Not Found |
| ❌ 使用不可 | `gemini-2.5-flash-preview-04-17` | 404 Not Found |

### レート制限（確定値）

| モデル | RPD | 現在の用途 |
|---|---|---|
| Gemma 4 26B | 1,500 | classifyBatch（毎時3語）|
| Imagen 4 Standard | 25 | generateImageBatch（1日最大25枚）|
| Imagen 4 Fast | 25 | デュアル運用時の追加（手動）|
| Gemini 2.5 Flash TTS | 10 | generateAudioBatch（1日最大10件）|
| Gemini 3.1 Flash TTS | 10 | デュアル運用時の追加（手動・未確認）|

### 保護対象エントリ（syncRegistries.gs で保護済み）

| プレフィックス | 対象 | 理由 |
|---|---|---|
| `char_` | char_鈴木〜char_ケリー | 実URL存在・上書き禁止 |
| `ex_L`（前方一致） | ex_L01_007〜015 等の例文画像 | GASスコープ外 |
| `world_map`（完全一致） | 地図画像 | imageUrl: null のまま保持 |

---

## 5. GASパイプライン v7→v8 で解決した問題（記録）

### 問題① testSingleImage() が「pending行に見つからない」エラー
- **原因**：`approved` 済みの語彙は `testSingleImage()` の検索対象外
- **解決**：`retryImages(["word_先生"])` を使う（imageStatus 問わず強制再生成）

### 問題② STYLE_RECIPE が不完全
- **解決**：`sub_color`（Cool slate gray `#6B7C85`）と `skin_tones`（naturally warm medium）を追加
- **確認**：`checkStyleRecipe()` でログに `6B7C85` が含まれるか確認

### 問題③ concrete_object プロンプトが語彙ごとに最適化されていなかった
- **解決**：`OBJECT_SIGNATURES` 辞書を新規追加（雑誌・本・新聞・ノート・ケータイ 等10語）
- 未収録語彙は `OBJECT_SIGNATURE_DEFAULT` にフォールバック

### 問題④ abstract_concept プロンプトにメタファーが入っていなかった
- **解決**：`ABSTRACT_METAPHORS` 辞書を新規追加（好き・嫌い・楽しい・悲しい 等13語）
- 未収録語彙は `ABSTRACT_METAPHOR_DEFAULT` にフォールバック

### 問題⑤ generateImages.gs 完全書き換え時に seedVocabulary() に誤りが混入
- **内容**：9列目（imageUrl）にチェックボックスが挿入された
- **解決**：問題の `insertCheckboxes()` 行を削除

### 問題⑥ setupDailyTrigger() が消えていた
- **解決**：`setupHourlyTrigger()` の直前に再追加（classifyBatch 日次切り替え用）

### 問題⑦ バッチエラーで1日の残クォータが無駄になる
- **解決**：各バッチを1日3回実行に変更
  - 画像：9:00 / 13:00 / 17:00
  - 音声：10:00 / 14:00 / 18:00
- `imageStatus = "pending"` 行のみ処理するため二重生成なし

### 問題⑧ classifyBatch の JSON パース失敗（Gemma 4 thinking mode）
- **原因**：Gemma 4 の思考テキスト内の `}` を含んでしまいパースエラー
- **解決**：`parseGemmaResponse_()` の抽出を貪欲マッチ → 最初の `{}` のみに変更

```javascript
// 変更後（最初の {} のみ取り出す）
const start = rawText.indexOf('{');
const end = rawText.indexOf('}', start);
const jsonMatch = [rawText.substring(start, end + 1)];
```

### 問題⑨ classifyBatch が GAS 6分制限を超えてタイムアウト
- **失敗した対策**：BATCH_SIZE 削減 / thinkingBudget:0 / deadline:30 / モデル変更（全て不可）
- **結論**：このAPIキーで v1beta の generateContent に使えるのは `gemma-4-26b-a4b-it` のみ
- **最終解決**：`BATCH_SIZE: 3`（1バッチ最大210秒・6分制限以内）

### 問題⑩ vocab_type 空のまま画像生成が走り品質低下
- **解決**：`getPendingImageRows_()` に `r.vocabType !== ""` の条件を追加

### 問題⑪ 音声の発音が不正確（「会社員」→「アイシェイン」）
- **原因**：Aoede ボイスは日本語専用ではなく、英語圏の発音で処理される
- **解決**：TTS テキストに「日本語で読み上げてください：」プレフィックスを付与
- **注意**：`systemInstruction` は TTS エンドポイントで非対応（HTTP 500）

---

## 6. 語彙追加マニュアル（次課以降の手順）

### パターン①：新しい課（lesson_02以降）を追加する

1. `lesson_NN.json` を Google Drive にアップロード
2. `LESSON_FILE_IDS` に新ファイルIDを追加
3. `importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02")` を手動実行
4. あとは自動（classifyBatch → generateImageBatch → generateAudioBatch → syncAll）

### パターン②：Goi_List の N4語彙を追加する

1. `EXTRACT_SETTINGS.TARGET_LEVELS` に `"2.初級後半"` を追加
2. `extractByLevel()` を手動実行（N5は重複チェックで自動スキップ）
3. あとは自動（N4は788語・約11日で画像生成完了）

### パターン③：単語を1語だけ手動追加する

Vocabulary シートに直接1行入力（C列・F列は空欄のまま classifyBatch が自動付与）。

| 列 | フィールド | 記入内容 |
|---|---|---|
| A | word | 漢字表記（例：旅行）|
| B | reading | ひらがな（例：りょこう）|
| C | en | **空欄**（classifyBatch が自動付与）|
| D | jlptLevel | N5〜N1 |
| E | pos | 品詞 |
| F | vocab_type | **空欄**（classifyBatch が自動付与）|
| G | imageId | `word_` + 漢字（例：word_旅行）|
| H | imageStatus | `pending` |
| I | imageUrl | **空欄**（generateImageBatch が自動入力）|
| J | audioId | `word_` + 漢字（例：word_旅行）|
| K | audioStatus | `pending` |
| L | audioUrl | **空欄**（generateAudioBatch が自動入力）|
| M | lessonRef | 任意（例：lesson_02）|
| N | source | `manual` |

---

## 7. よく使うメンテナンス関数

| 関数 | 用途 |
|---|---|
| `retryImages(["word_XX"])` | imageStatus 問わず強制再生成 |
| `retryAudio(["word_XX"])` | audioStatus 問わず強制再生成 |
| `reclassifyWords(["XX"])` | en / vocab_type を再処理 |
| `previewPrompts()` | 最初の5件のプロンプトをAPIなしで確認 |
| `checkStyleRecipe()` | STYLE_RECIPE に `#6B7C85` が含まれるか確認 |
| `previewClassify()` | 分類結果5件プレビュー（SSへの書き込みなし）|
| `testProtectedKeys()` | 保護キーのチェックロジックをテスト |
| `fixExamplesData()` | Examples データが1001行目に入った場合の修正 |

---

## 8. デュアルモデル戦略（1日の上限を2倍にする方法）

タイマー自動では1モデル1日1サイクルのみ。手動でモデルを切り替えて再実行することで上限を倍増できる。

**画像（手動操作）：**
```javascript
// タイマー自動：imagen-4.0-generate-001 → 最大25枚
// 手動でモデル変更後に generateImageBatch() を実行 → さらに最大25枚
// 合計最大 50枚/日
MODEL: "imagen-4.0-fast-generate-001"
```

**音声（手動操作）：**
```javascript
// タイマー自動：gemini-2.5-flash-preview-tts → 最大10件
// 手動でモデル変更後に generateAudioBatch() を実行 → さらに最大10件
// 合計最大 20件/日
MODEL: "gemini-3.1-flash-preview-tts"  // 使用可能か要確認
```

---

## 9. 課マスター設計ライン（SKILL.md v1.2）仕様サマリー

### 配置場所・現状
- **コンテンツ**：`/mnt/project/SKILL.md`（プロジェクトナレッジ経由で参照可能・v1.2完成）
- **役割**：課マスター作成プロセスの設計仕様書。claude.ai チャットで project knowledge として参照する形が正しい運用。
- **注意**：CLAUDE.md の禁止事項（「SKILL.md を新規作成しない」）は Claude Code 向けルール。Windows 環境のため `/mnt/skills/user/` は存在しない。スキル自動トリガーではなく project knowledge 参照で運用する。

### カバー範囲
L1（チェックリスト）＋ L2（テンプレートJSON記述）。L3（GAS自動生成）はスコープ外。

### 全体フロー

```
Step 1a：骨格設計
  テンプレートコピー → _meta/lesson/textbook_sources 記入
  → patterns[] エントリ数確定 → flow[] 調整 → github 記入

Step 1b：語彙設計
  パターン別語彙確定 → vocabulary.byPattern グループ設計
  → imageId/audioId 採番 → レジストリ予約 → ruby_dictionary.js 追加

Step 1c：例文設計
  パターン別例文作成（肯定・否定・疑問・疑問詞）
  → isAnchor:true を各パターン1件 → imageId/audioId 採番

Step 1d：照合
  postCompletionChecklist 全件 → formatVersion: "2.7" 確認
```

### lesson_template.json v1.2 の意図的除外（新しい課には不要）

| 除外項目 | 理由 |
|---|---|
| `_meta.changes[]` | バージョン履歴（新規は空配列）|
| `_meta._phase1f_completed.*` | 旧キャラクターシステム廃止の移行記録（lesson_01固有）|
| `github._uploadFiles_deprecated` | v2.4廃止注記 |

---

## 10. 残タスク（優先度順）

### 10-1. すぐに着手できるもの

| 優先 | タスク | 状態 | 詳細 |
|---|---|---|---|
| 1 | **lesson_02.json 整備** | ⏳ 未完了 | v2.1 → v2.11.x への遡及適用。追加フィールド：canDoEn・practiceImageSource・audioId・isAnchor（examples/patterns）・namedCharacters[]・flow[]文型ブロック構造。同時に master_audio_registry・ruby_dictionary.js の L02 分を追加し、SKILL.md v1.2 の postCompletionChecklist で照合する |

### 10-2. GASパイプライン自動処理（進行中・放置でOK）

| タスク | 詳細 |
|---|---|
| classifyBatch 完了待ち | 残り約327語 / 約5日 / 毎時3語ずつ自動処理 |
| generateImageBatch | classifyBatch 完了後に本格化 |
| generateAudioBatch | 並行処理中（10件/日）|

### 10-3. syncAll 実行後（レジストリ更新後）

| タスク | 詳細 |
|---|---|
| build-embedded-data.py 実行 | syncAll() がレジストリJSONを更新した後、手動実行して両ラインを接続する |

### 10-4. 中長期

| タスク | 前提条件 |
|---|---|
| アクティビティ画像表示接続 | 画像生成フェーズ完了後 |
| lesson_03 以降の作成 | lesson_02.json 完成後・SKILL.md v1.2 に従って進める |
| generateTextContent.gs の設計・実装 | 基本パイプライン安定後 |
| N4語彙の追加（788語） | 基本パイプライン安定後・extractByLevel() で実施 |

---

## 11. パイプライン全体フロー（最新版）

```
① extractN5() / importByFileId() / 手動入力
      ↓ Vocabulary シートに語彙を追加（en・vocab_type は空）

② classifyBatch（毎時・自動・BATCH_SIZE: 3）
      ↓ Gemma 4 が en と vocab_type を判定して記入
      ↓ 現在 327語が処理待ち（約5日で完了）

③ generateImageBatch（1日3回・自動）
      ↓ vocab_type が埋まった語彙のみ対象（空欄はスキップ）
      ↓ vocab_type → テンプレート選択 → Imagen 4 で画像生成

④ generateAudioBatch（1日3回・自動）
      ↓ audioStatus = pending の語彙・例文を Gemini TTS で音声化
      ↓ 「日本語で読み上げてください：」プレフィックスを付与（発音修正）

⑤ syncAll（毎日 23:00・自動）
      ↓ 生成済み URL を master_image_registry.json / master_audio_registry.json に書き戻し

⑥ build-embedded-data.py（手動・必要時）
      ↓ japanese-lesson-creator の HTML に最新 URL を反映
```

---

## 12. 次チャットへのアップロード必須ファイル

### lesson_02.json 整備を続ける場合

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（handoff_v2.md） | **必須** | 全決定事項の参照元 |
| **lesson_template.json v1.2** | **必須** | 照合チェックリストとして使用 |
| **lesson_02.json**（最新版） | **必須** | 整備対象 |
| CLAUDE.md | 任意 | スキーマ要件の確認（プロジェクトナレッジに存在）|

### GAS作業を続ける場合

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（handoff_v2.md） | **必須** | 全決定事項の参照元・v8内容を統合済み |
| generateImages.gs | 任意 | 画像プロンプト・モデル設定・デュアルモデル運用の修正が必要な場合 |
| master_prompt_design_guide_v2_5.py | 任意 | STYLE_RECIPE 等の変更が必要な場合 |

### ライン A（Step 3 アクティビティ UI）を続ける場合

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| CLAUDE.md | **必須** | Claude Code の自律動作ルール・スキーマ要件・**Stage 1 既知9問題チェックリスト**（実装/修正のたびに照合必須） |
| この資料（handoff_v2.md） | 推奨 | プロジェクト全体像の把握 |

> ライン A の実装・修正時は CLAUDE.md の「Stage 1 既知 9 問題チェックリスト」（画像表示・ふりがな・カウンタ・デザイン統一など）を毎回照合すること。詳細は CLAUDE.md 参照。

---

## 13. 次チャットの開始コマンド例

**lesson_02.json 整備：**
```
handoff_v2.md と lesson_02.json の続きです。
lesson_02.json の不足フィールド補完（canDoEn / practiceImageSource / audioId / isAnchor）を行います。
SKILL.md v1.2 の postCompletionChecklist を使って照合してください。
```

**GAS パイプライン確認：**
```
handoff_v2.md の続きです。

現在の状態：
- classifyBatch が毎時3語ずつ処理中（残り約XX語）
- generateImageBatch が vocab_type 済みの語彙を毎日3回処理中

確認・対応をお願いしたいこと：
[ここに具体的な作業を書く]
```

---

*作成日：2026-05-16*
*根拠資料：gas_pipeline_handoff_v8.md / handoff_post_merger_v1.md / SKILL.md v1.2 / CLAUDE.md / README.md*
