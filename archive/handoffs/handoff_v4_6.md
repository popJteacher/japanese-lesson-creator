# 引き継ぎ資料 v4.6
**バージョン：v4.6（2026-05-18）**
**前資料：handoff_v4_5.md（2026-05-18）**
**このバージョンで修正した内容：画像生成テスト実施・STYLE_RECIPE hex値バグ修正・Imagen有料プラン確認・画像生成アーキテクチャ方針転換（全語彙マスターガイド参照プロンプト方式）・例文未投入問題の発見・GASへのS列追加・importImagePrompts関数の設計確定**

---

## ⛔ このドキュメントの編集ルール（次チャットの Claude へ）

### 削除・省略・短縮が禁止されているセクション

| セクション | ルール |
|---|---|
| §4 GASパイプライン解決済み問題 | **追記のみ・削除禁止**（再発時の対処記録） |
| §5 課題ライフサイクル一覧 | **追記のみ・削除禁止**（解決理由・経緯の記録） |
| §6 課マスター設計ライン | **確定事項の追加のみ・既存削除禁止** |
| §9 ロードマップ | **追記・チェック更新のみ**（完了状態の書き換えは可） |
| §10 このチャットで判明したこと | **追記のみ・削除禁止** |

### 引き継ぎ更新の手順（次 handoff 作成時）

```
1. この資料を全文読む
2. 今チャットで追加・変更・完了した内容を特定する
3. 各セクションに「追記」する（書き直しではなく）
4. バージョン番号を 4.6 → 4.7（または 5.0）に更新する
5. 更新後、変更した箇所の一覧を出力する
6. ファイル・スクリプト・SKILL のバージョン番号が実態と一致しているか確認すること
7. 全体として前バージョンより短くなっている場合は必ず理由を §10 に書く
```

### 禁止事項

- 「解決済みだから削除」による情報圧縮
- 「まとめると〜」「要約すると〜」による情報圧縮
- ファイル名・バージョン番号を確認せずに引き継ぐ
- 前バージョンより短い引き継ぎを確認なしに作成すること

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **GASにS列・importImagePrompts関数を追加** | §16 の設計に従い、Vocabulary シートに `imagePrompt`（S列）を追加し、プロンプト投入関数・buildImagePrompt_()修正を実装する |
| **②** | **⚠️ GCP_TTS_API_KEY → GCP_TTS_KEY に修正** | GASの `callGoogleCloudTTS_()` 内のキー名を修正して `testSingleAudio()` で確認 |
| **③** | **一時追加した関数の削除** | `fixAmeAme` / `fixWeatherVocabType` / `previewLesson02` / `importLesson02` を削除（`resetFailedImagesToPending` は残す） |
| **④** | **lesson_01・02のプロンプト生成** | master_prompt_design_guide_v2_6_complete.py を参照して lesson_01（17語）・lesson_02（18語）の imagePrompt JSON を生成 |
| **⑤** | **Goi_List N5語彙（412語）のプロンプト生成** | 同上・50語単位に分割して生成 |
| **⑥** | **例文を Examples シートに投入** | lesson_02.json の例文を読んで Examples シートに投入する関数を新規作成・実行 |
| **⑦** | **GASパイプライン稼働確認** | Vocabulary シートの列C/F/H/K を確認 |
| **⑧** | **lesson_03.json 作成開始** | SKILL_v1_6.md の Step 1a から |

> **次チャットへのアップロード必須ファイル：**
> - `handoff_v4_6.md`（この資料）
> - `SKILL_v1_6.md`（第3課作成時に参照）
> - `master_prompt_design_guide_v2_6_complete.py`（プロンプト生成時に参照・最重要）
> - 必要に応じて `lesson_template.json`

---

## §1. プロジェクト全体の位置づけ

```
【ライン A：japanese-lesson-creator】（Claude Code実装・リポジトリ）
  lesson_NN.json を読んでスライド/宿題/アクティビティHTML/教案docxを生成するWebツール
  → 2026-05-18時点で全実装完了

【ライン B：GASパイプライン】（Google Apps Script）
  語彙・例文の画像・音声を自動生成してGoogle Driveに蓄積する
  → 画像生成テスト成功（v4.6）。アーキテクチャ方針転換済み（§16参照）
  → ⚠️ 音声生成に GCP_TTS_API_KEY 問題あり（未修正）
  → ⚠️ 例文が Examples シートに未投入（lesson_02）

【連携インターフェース】
  master_image_registry.json → image_resolver.js → slide_html.js
  master_audio_registry.json → homework_html.js（将来）
  build-embedded-data.py で両ラインを手動接続（syncAll完了後に実行）
```

---

## §2. ライン A の完了状態（japanese-lesson-creator）

### 全ステップ完了一覧

| Step / Stage | 内容 | 状態 | 完了日 |
|---|---|---|---|
| Step 1 | 生成エンジン（4ファイル出力） | ✅ 完了 | 2026-05-14 |
| Step 2 | フォーム UI | ✅ 完了 | 2026-05-14 |
| **Step 3** | **アクティビティ UI 実装（8件）** | ✅ **完了（v4.1で確認）** | 実装済み・2026-05-17確認 |
| Plan v1.1 Stage 1〜7 | 命名規則統一・audioId・FlowSynthesizer修正・スライド更新・ビルド確認 | ✅ 完了 | 2026-05-15 |
| データ同期 | 全データファイルを最新版に差し替え | ✅ 完了 | 2026-05-17 |

### Step 3 実装済み 8 件（activity_html.js 2,249行）

| activityId | 行範囲 | 実装内容の概要 |
|---|---|---|
| `act_memory_matching` | L566–780 | 神経衰弱：vocab から最大8ペア、クリックでめくる |
| `act_vocab_bingo` | L781–946 | ビンゴ：vocab≥16で4×4、未満は3×3 |
| `act_whiteboard_categorize` | L947–1140 | 仲間分け：byPattern グループをD&D |
| `act_grammar_auction` | L1141–1320 | 文オークション：正文2・誤文1でベット UI |
| `act_battleship` | L1321–1492 | 戦艦：行=職業5語・列=国籍5語のマス目 |
| `act_person_guessing_quiz` | L1493–1705 | 人物当て：namedCharacters フォールバック有 |
| `act_personality_quiz` | L1706–1860 | 性格診断：職業語彙から質問6問 |
| `act_hajimemashite_conversation` | L1861–2083 | 自己紹介会話ロールプレイ |

> `act_online_roulette`（L2084–2248）は Step 3 スコープ外で先行実装済み。

---

## §3. リポジトリのファイル構成と現在バージョン

### データファイル（data/）

| ファイル | バージョン | 最終更新 | 内容 |
|---|---|---|---|
| `lesson_01.json` | lessonVer **1.1** / fmt 2.7 | 2026-05-18 | 第1課「名詞」p1〜p3（3文型） |
| `lesson_02.json` | **lessonVer 2.11.11** / fmt 2.7 | 2026-05-18 | 第2課「こそあど」p1〜p6（6文型） |
| `activity_catalog.json` | **v1.9** | 2026-05-17 | **58件** |
| `intro_activity_catalog.json` | **v1.2** | 2026-05-17 | 導入アクティビティ8件 |
| `master_image_registry.json` | **v2.0** | 2026-05-18 | **109件**・全 imageUrl: null（GAS生成待ち） |
| `master_audio_registry.json` | **v1.2** | 2026-05-17 | 84件・全audioUrl: null（GAS生成待ち） |
| `image_prompts_lesson2.json` | **v2.0** | 2026-05-18 | ※現行GASでは不使用。新方式では参照して再活用する（§16参照） |
| `session_001.json`（リポジトリ） | fmt 2.0 | 2026-05-15 | ✅ 新フォーマット |
| `session_001.json`（ナレッジコピー） | **fmt 1.0** | 2026-05-05 | ⚠️ 旧フォーマットのまま（テスト時は使わない） |

### ソースファイル（src/）・ドキュメント

（v4.5 §3 の内容をすべて継承。変更なし。）

### プロジェクトナレッジ専用ファイル

| ファイル | バージョン | 用途 |
|---|---|---|
| `SKILL_v1_6.md` | **v1.6** | 課マスター作成ガイド |
| `lesson_template.json` | v1.2 | 新規課作成テンプレート |
| `master_prompt_design_guide_v2_5.py` | v2.5 | 画像生成プロンプト設計ガイド |
| `master_prompt_design_guide_v2_6_complete.py` | **v2.6** | **画像生成プロンプト設計ガイド完全版（最重要・§16参照）** |
| `ruby_dictionary_v1_3.js` | **v1.3** | SSoT版 |
| `generateImages_v5_1.gs` | v5.1 | ※GASには v5.2 が適用済み。参照用のみ |
| `classifyAndTranslate_v1_1.gs` | v1.1 | ※GASに適用済み。参照用のみ |

---

## §4. ライン B の現在状態（GASパイプライン）

### GASスクリプト 8本（v4.6 時点）

| スクリプト | 状態 | バージョン |
|---|---|---|
| `setupSpreadsheet.gs` | ✅ 補助列 O〜R 追加済み・**⚠️ S列（imagePrompt）未追加（次チャット必須）** | — |
| `seedLesson01.gs` | ✅ 完成（投入済み） | — |
| `extractFromGoiList.gs` | ✅ 完成（N5 412語投入済み） | — |
| `importFromLessonJson.gs` | ✅ lesson_02 投入済み・**⚠️ 例文投入機能なし（次チャット追加必要）** | — |
| `classifyAndTranslate.gs` | ✅ 稼働中 | **v1.1** |
| `generateImages.gs` | ✅ 稼働中・**⚠️ S列参照機能未追加（次チャット修正必要）** | **v5.2** |
| `generateAudio.gs` | ⚠️ GCP_TTS_API_KEY キー名不一致・音声生成失敗の可能性 | v3.0 |
| `syncRegistries.gs` | ✅ 稼働中（毎日23:00） | — |

### ⚠️ 未解決問題一覧（次チャット対応必要）

| 問題 | 優先度 | 対応内容 |
|---|---|---|
| S列（imagePrompt）未追加 | **高** | setupSpreadsheet.gs に追加・importImagePrompts()関数を新規作成 |
| generateImages.gs がS列を参照していない | **高** | buildImagePrompt_()を修正してS列を最優先参照に |
| GCP_TTS_API_KEY → GCP_TTS_KEY 不一致 | **高** | callGoogleCloudTTS_()のキー名を修正 |
| lesson_02 例文が Examples シートに未投入 | **高** | importExamplesFromLessonJson()関数を新規作成 |
| 全語彙の imagePrompt が未生成 | **高** | Claude がマスターガイド参照でJSONを生成→GASで投入 |
| IMAGE_REGISTRY_ID typo疑い（BlR vs BlV） | 中 | 実際のDriveファイルIDで確認・統一 |
| 一時追加関数の削除 | 低 | fixAmeAme・fixWeatherVocabType・previewLesson02・importLesson02 |

### STYLE_RECIPE 修正済み（v4.6）

hex値のテキスト描画バグを修正。現在の正しい STYLE_RECIPE：

```javascript
const STYLE_RECIPE = [
  "Minimalist flat vector illustration.",
  "Clean continuous black outlines with consistent line weight.",
  "Completely flat solid color fills only.",
  "Color palette: soft cream white background,",
  "deep slate navy outlines,",
  "muted warm blue as main fill color,",
  "warm amber gold as accent color,",
  "cool slate gray as sub-color for secondary elements.",
  "Skin tones: naturally warm medium skin tone.",
  "No gradients, no shadows, no 3D effects, no photoreal textures.",
  "Apply zero ambient lighting, zero drop shadows, zero global illumination.",
  "This should look like it belongs in a brand style guide, not like AI art.",
  "Keep line weights consistent.",
].join(" ");
```

> **⚠️ GASエディタの STYLE_RECIPE がこの内容に更新されていることを確認すること。**
> 旧バージョンには `hex value FBFBFB` 等の記述があり、Imagenが画像内にテキストを描画するバグが発生していた。

### 確定済み設定値

```javascript
SPREADSHEET_ID:    "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk"
GOI_LIST_FILE_ID:  "1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA"
LESSON_FILE_IDS:
  lesson_01: "1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c"
  lesson_02: "← v4.5 で入力済み（GASエディタの LESSON_FILE_IDS を確認）"
IMAGE_REGISTRY_ID: "14NL_LqudXIQzY68klspH3SBlV21hiqbW"  ← handoff記載値（typo疑い・要確認）
AUDIO_REGISTRY_ID: "1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0"
CLASSIFY_SETTINGS.MODEL:  "gemma-4-26b-a4b-it"（BATCH_SIZE: 3）
IMAGE_SETTINGS.MODEL:     "imagen-4.0-generate-001"（v4.6 で確定）
AUDIO_SETTINGS.VOICE_NAME: "ja-JP-Wavenet-B"
AUDIO_SETTINGS.MAX_BATCH_SIZE: 50
```

### ScriptProperties（全設定済み）

| プロパティキー | 用途 | 状態 |
|---|---|---|
| `GEMINI_API_KEY` | classifyBatch / generateImageBatch | ✅ |
| `GCP_TTS_KEY` | generateAudioBatch（Cloud TTS） | ✅ 登録済み・ただしGASコードのキー名が不一致 |
| `SPREADSHEET_ID` | 全スクリプト共通 | ✅ |
| `IMAGE_FOLDER_ID` | generateImages.gs | ✅ v4.6 で正しいフォルダIDに修正済み |
| `AUDIO_FOLDER_ID` | generateAudio.gs | ✅ |

### 使用可能なモデル（確定情報）

| 用途 | モデル | 状態 |
|---|---|---|
| テキスト分類 | `gemma-4-26b-a4b-it` | ✅ 使用可 |
| 画像生成 | `imagen-4.0-generate-001` | ✅ **有料プランで使用可（v4.6確認）** |
| 画像生成（代替・高速） | `imagen-4.0-fast-generate-001` | ✅ デュアル運用で50枚/日 |
| 音声生成 | `ja-JP-Wavenet-B`（Google Cloud TTS） | ✅ ただしキー名不一致で失敗中 |
| ❌ 使用不可 | `imagen-4.0-generate-exp` | **404エラー（存在しないモデル名）** |
| ❌ 使用不可 | `gemini-2.0-flash` / `gemma-3-27b-it` | limit:0 または404 |

### GASパイプライン 解決済みの問題（記録・再発時の対処法）

（v4.5 §4 の内容をすべて継承。以下に v4.6 で追加した解決済み問題を追記。）

| 問題 | 原因 | 解決策（適用済み） |
|---|---|---|
| **音声発音が不正確** | Aoede ボイスの英語圏発音 | TTSテキストにプレフィックス付与 |
| **classifyBatch タイムアウト** | GAS6分制限 | BATCH_SIZE: 3 |
| **classifyBatch JSONパース失敗** | Gemma 4 thinking mode | parseGemmaResponse_()修正 |
| **vocab_type 空のまま画像生成** | 分類前行が対象になっていた | vocabType !== "" 条件追加 |
| **STYLE_RECIPE に hex値テキストが混入** | STYLE_RECIPEに `#FBFBFB` 等を記述 → Imagenが画像内にテキストとして描画 | **hex値の説明テキストを削除（v4.6）** |
| **imagen-4.0-generate-exp → 404** | 存在しないモデル名 | **`imagen-4.0-generate-001` に修正（v4.6）** |
| **Imagen 無料プランでは使用不可** | AI Studio 無料枠はImagenに非対応 | **有料プラン（Pay-as-you-go）に変更（v4.6）** |
| **IMAGE_FOLDER_ID が不正** | フォルダではなく別のファイルを指していた | **正しいフォルダIDに修正（v4.6）** |
| **雨・あめの vocab_type が "other"** | Gemma 分類失敗 | 直接書き込みで修正済み（v4.5） |
| **Gemma API で HTTP 500** | サーバー側一時エラー | reclassifyWords()ではなく直接書き込みで対処 |
| **K〜T vocab_type が "other" に落ちていた** | VALID_VOCAB_TYPES が旧9種 | v1.1で19種に拡張（v4.4） |

---

## §5. 課題ライフサイクル一覧

（v4.5 §5 の内容をすべて継承。以下に v4.6 で追加した課題を追記。）

| 課題 | 発生バージョン | 解決バージョン | 解決内容 |
|---|---|---|---|
| 画像生成システム未対応①②③ | v4.3以前 | v4.4 | K〜T対応・補助列・VALID_VOCAB_TYPES拡張 |
| 補助列O〜R未追加 | v4.4 | v4.5 | addAuxiliaryColumns()実行済み |
| lesson_02 語彙GAS未投入 | v4.4 | v4.5 | 9語追加完了 |
| 固有名詞地名5語vocab_type未確定 | v4.4 | v4.5 | Vocabularyシートに手動入力済み |
| STYLE_RECIPE hex値テキスト描画バグ | v4.5で発見 | **v4.6** | hex値の説明文を削除・画像内テキストが消えた |
| imagen-4.0-generate-exp 404エラー | v4.5 | **v4.6** | imagen-4.0-generate-001 に修正 |
| IMAGE_FOLDER_ID 設定ミス | v4.6で発見 | **v4.6** | 正しいDriveフォルダIDに修正 |
| **GASのS列（imagePrompt）未追加** | v4.6で設計確定 | **未解決（次チャット）** | §16の設計に従い実装が必要 |
| **generateImages.gsがS列を参照していない** | v4.6で設計確定 | **未解決（次チャット）** | buildImagePrompt_()修正が必要 |
| **GCP_TTS_API_KEY キー名不一致** | v4.5で発見 | **未解決（次チャット）** | callGoogleCloudTTS_()のキー名修正が必要 |
| **lesson_02例文がExamplesシートに未投入** | v4.6で発見 | **未解決（次チャット）** | importExamplesFromLessonJson()新規作成が必要 |
| **全語彙のimagePromptが未生成** | v4.6でアーキテクチャ確定 | **未解決（次チャット）** | マスターガイド参照でプロンプト生成→投入 |

---

## §5-B. 固有名詞-地名 5語の vocab_type 確定記録（v4.4・v4.5）

| 語 | vocab_type | 画像化方針 | シート入力 |
|---|---|---|---|
| アメリカ | `concrete_object` | 星条旗＋アメリカ大陸シルエット | ✅ 入力済み |
| カナダ | `concrete_object` | メープルリーフ旗＋カナダシルエット | ✅ 入力済み |
| 韓国 | `concrete_object` | 太極旗＋朝鮮半島シルエット | ✅ 入力済み |
| 日本 | `concrete_object` | 日の丸＋富士山シルエット | ✅ 入力済み |
| 日本語 | `abstract_concept` | 吹き出し内にひらがな＋言語メタファー | ✅ 入力済み |

---

## §6. 課マスター設計ライン

### 完成済みの課マスター

| 課 | ファイル | バージョン | 文型 | 状態 |
|---|---|---|---|---|
| 第1課 | `lesson_01.json` | fmt 2.7 / lessonVer 1.1 | p1〜p3（名詞・3文型） | ✅ 完成・GAS投入済み |
| 第2課 | `lesson_02.json` | fmt 2.7 / lessonVer 2.11.11 | p1〜p6（こそあど・6文型） | ✅ 完成・語彙GAS投入済み・**例文未投入** |
| 第3課以降 | — | — | — | ⏳ 未着手 |

### lesson_02 GAS投入結果（v4.5 確定）

新規9語：腕時計・ペン・鉛筆・ケータイ・消しゴム・ビル・市役所・山・わたし
スキップ9語（既存）：時計・本・雑誌・新聞・かばん・病院・人・犬・写真

### lesson_02 例文の状態（v4.6 発見）

lesson_02.json の例文は Vocabulary シートに**投入されていない**。
generateAudio.gs は Examples シートを読んで音声生成するため、例文音声が生成されない状態。
lesson_01 は seedExamples()で15件投入済み。lesson_02 用の同等関数が存在しない。

```
必要な作業：
importExamplesFromLessonJson() を新規作成
  → lesson_02.json の patterns[*].examples[] を読む
  → id / lessonNo / patternId / sentence / sentenceEn / textToSpeak を抽出
  → Examples シートに差分追加
```

（§6 続き：v4.1〜v4.5 §6 のすべての内容を継承。変更なし。）

---

## §7. 語彙追加・GASパイプライン操作マニュアル

（v4.5 §7 の内容をすべて継承。）

### 画像生成のコスト目安（v4.6 確認）

| モデル | 単価 | lesson_01+02（35語） | N5全語彙（412語） |
|---|---|---|---|
| imagen-4.0-generate-001 | 約 $0.04/枚 | 約 $1.4 | 約 $16.5 |
| imagen-4.0-fast-generate-001 | 約 $0.02/枚 | 約 $0.7 | 約 $8.2 |

> **⚠️ プロンプトが確定してから一括生成すること。スタイルが合わない状態で生成すると費用が無駄になる。**

---

## §8. 次チャット 作業詳細

### ① GASへのS列追加と関数修正

**a. setupSpreadsheet.gs に S列を追加**

```javascript
function addImagePromptColumn() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  // 現在の最大列数を確認して S列（19列目）を追加
  const requiredCols = 19;
  const currentMax   = sheet.getMaxColumns();
  if (currentMax < requiredCols) {
    sheet.insertColumnsAfter(currentMax, requiredCols - currentMax);
  }
  sheet.getRange(1, 19).setValue("imagePrompt");
  const headerRange = sheet.getRange(1, 19);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#E8F5E9");
  headerRange.setColumnWidth(19, 600); // プロンプトは長いので幅を広く
  Logger.log("✅ S列（imagePrompt）追加完了");
}
```

**b. プロンプト投入関数を追加**

```javascript
// jsonData 例: { "word_先生": "...", "word_医者": "..." }
function importImagePrompts(jsonData) {
  const ss    = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Vocabulary");
  const lastRow = sheet.getLastRow();
  const data    = sheet.getRange(2, 1, lastRow - 1, 19).getValues();

  let count = 0;
  data.forEach(function(row, i) {
    const imageId = String(row[6] || "").trim(); // G列: imageId
    if (jsonData[imageId]) {
      sheet.getRange(i + 2, 19).setValue(jsonData[imageId]); // S列
      count++;
    }
  });
  Logger.log("✅ " + count + " 件のプロンプトを投入しました");
}
```

**c. generateImages.gs の buildImagePrompt_() を修正**

```javascript
function buildImagePrompt_(row) {
  // ① S列（imagePrompt）にカスタムプロンプトがあれば最優先
  if (row.imagePrompt && row.imagePrompt.trim() !== "") {
    return row.imagePrompt;
  }
  // ② なければ vocab_type からテンプレート生成（フォールバック）
  const vt   = (row.vocabType || "other").toLowerCase();
  // ... 以下既存のswitch-case
}
```

**d. getAllImageRows_() に S列読み込みを追加**

```javascript
const imagePrompt = row.length > 18 ? String(row[18] || "").trim() : ""; // S列
// rows.push({ ... imagePrompt: imagePrompt, ... })
```

### ② GCP_TTS_KEY 修正

GASエディタで `GCP_TTS_API_KEY` を検索 → `GCP_TTS_KEY` に変更 → `testSingleAudio()` で確認。

### ③ 例文投入関数の新規作成

```javascript
function importExamplesFromLesson02() {
  // lesson_02.json を Drive から読み込む
  // patterns[*].examples[] を抽出
  // Examples シートに差分追加（id が存在しなければ追加）
  // isAnchor チェックボックスを1行ずつ追加
}
```

### ④ lesson_01・02 のプロンプト生成（Claude側作業）

master_prompt_design_guide_v2_6_complete.py を読み込み、以下の形式で JSON を生成：

```json
{
  "word_先生": "[PURPOSE] Create a vocabulary card...",
  "word_医者": "[PURPOSE] Create a vocabulary card...",
  ...
}
```

- lesson_01（17語）・lesson_02（18語）は授業で使うため高品質が必要
- char_鈴木 との画風統一を意識したプロンプトを生成すること

### ⑤ Goi_List N5 全語彙のプロンプト生成

412語を50語単位に分割してプロンプト生成 → 順次 importImagePrompts() で投入。

---

## §9. ロードマップ

```
【完了済み（v4.6 時点）】
  ✅ ライン A 全工程（Step 1〜3・Stage 1〜7・データ同期）
  ✅ lesson_01.json v1.1 / lesson_02.json v2.11.11（全課題解消）
  ✅ activity_catalog v1.9（58件）/ intro_activity_catalog v1.2（8件）
  ✅ master_image_registry v2.0（109件）/ master_audio_registry v1.2（84件）
  ✅ ruby_dictionary.js v1.3 / CLAUDE.md / README.md 更新
  ✅ SKILL_v1_6.md（teacher_real_object・playerSteps追加）
  ✅ GASパイプライン 8本完成・稼働中
  ✅ generateAudio.gs v3.0（Google Cloud TTS WaveNet）
  ✅ master_prompt_design_guide_v2_6_complete.py（K〜T・UNIFIED_CHAR_SYSTEM）
  ✅ classifyAndTranslate.gs v1.1（19種）
  ✅ generateImages.gs v5.2 マージ版（K〜T詳細ルックアップ + OBJECT_SIGNATURES等）
  ✅ 地名5語 vocab_type Vocabularyシート入力済み
  ✅ 補助列 O〜R 追加済み
  ✅ lesson_02 語彙GAS投入（9語追加）
  ✅ STYLE_RECIPE hex値バグ修正（v4.6）
  ✅ imagen-4.0-generate-001 でのテスト生成成功（v4.6）
  ✅ 画像生成アーキテクチャ方針確定（全語彙マスターガイド参照方式・v4.6）

【次チャット：必須】
  ① GASにS列（imagePrompt）追加・importImagePrompts()追加・buildImagePrompt_()修正
  ② GCP_TTS_KEY キー名修正（音声生成の復旧）
  ③ 一時追加関数の削除
  ④ lesson_01・02（35語）のimagePrompt JSON生成（マスターガイド参照）
  ⑤ Goi_List N5（412語）のimagePrompt JSON生成（50語単位・順次）
  ⑥ lesson_02 例文の Examples シート投入（importExamplesFromLesson02()新規作成）
  ⑦ GASパイプライン稼働確認（列C/F/H/K）

【lesson_02 授業前に必須】
  ⑧ act_info_gap_picture UI 実装

【その後：第2課授業実施まで】
  ⑨ 全語彙imagePrompt投入完了後 → generateImageBatch()自動実行
  ⑩ 音声自動生成（generateAudioBatch・修正後）
  ⑪ syncAll → master_image_registry / master_audio_registry 更新
  ⑫ build-embedded-data.py 実行 → HTML 反映
  ⑬ lesson_02 授業実施可能 🎉

【lesson_03以降】
  ⑭ lesson_03.json 作成開始（SKILL_v1_6.md Step 1a〜）

【低優先度・随時】
  ─ IMAGE_REGISTRY_ID の BlR vs BlV typo を確認・統一
  ─ 補助列 O〜R を高優先語彙から順次入力
  ─ ナレッジ版 session_001.json を fmt 2.0 に更新
  ─ generateAudioBatch トリガーを3本→1本に削減

【中長期】
  ─ N4語彙追加（788語）→ extractByLevel() で実施
  ─ vocabFilter / exampleFilter 実装
  ─ 日本語辞書サイトへの展開
  ─ SaaS化・マネタイズ
  ─ VOICEVOX/AivisSpeech 品質比較（N5全語彙完了後）
```

---

## §10. このチャットで判明したこと・確定した事項

（v4.1〜v4.5 §10 の内容をすべて継承。以下に v4.6 で追加した判明事項を追記。）

| 判明事項 | 詳細 |
|---|---|
| **Step 3 は実装済みだった**（v4.1） | activity_html.js 2,249行を直接検査し8件全て確認 |
| **build-embedded-data.py は完成済み**（v4.1） | 全6ファイルが既にTARGETSリストに入っていた |
| **session_001.json はリポジトリ側のみ fmt 2.0**（v4.1） | ナレッジのコピーは旧fmt 1.0のまま |
| **lesson_02に非標準 type が存在**（v4.2） | special_slide に統一済み |
| **lesson_01 p3 キムさん重複解消**（v4.3） | ケリーさんに変更済み |
| **音声生成 API 移行**（v4.3） | Gemini TTS → Google Cloud TTS WaveNet |
| **画像生成システムに3種の未対応問題**（v4.4） | v5.1/v5.2で解消 |
| **v5.1 と GAS v7.1 が並行開発で乖離**（v4.5） | v5.2マージ版を作成・適用済み |
| **GCP_TTS_API_KEY キー名不一致**（v4.5） | 音声生成が失敗している可能性。次チャット要修正 |
| **image_prompts_lesson2.json はGASパイプラインで不使用**（v4.5） | v5.0以降は自動生成方式 |
| **imagen-4.0-generate-exp は存在しない**（v4.6） | 404エラー。正しくは `imagen-4.0-generate-001` |
| **Imagen は AI Studio 無料プランでは使用不可**（v4.6） | 有料プランへの変更が必要（Pay-as-you-go） |
| **IMAGE_FOLDER_ID が不正だった**（v4.6） | "Invalid argument: parent.mimeType" エラー→正しいフォルダIDに修正済み |
| **STYLE_RECIPE に hex値テキスト描画バグ**（v4.6） | `#FBFBFB` 等の hex 値を STYLE_RECIPE に含めると Imagen が画像内にテキストとして描画する。hex値の説明を削除することで解消 |
| **char_鈴木 と word_先生 は異なる生成システム**（v4.6） | char_* は旧システムで手動生成済みのキャラクターカード。word_* は新パイプラインの語彙カード。別物として設計されているが画風統一が課題 |
| **2枚目の vocab_先生 は char_鈴木 に近いスタイル**（v4.6） | STYLE_RECIPE修正後の生成画像は背景色・輪郭・カラーパレットが近い。ただしプロンプトの詳細度が品質に直結 |
| **テンプレート自動生成では品質に限界がある**（v4.6） | vocab_type別テンプレートは語彙ごとの視覚ニュアンスを捉えきれない。マスターガイドを参照した語彙別カスタムプロンプトが必要 |
| **全語彙をマスターガイド参照プロンプト方式に統一する方針確定**（v4.6） | Goi_List N5全412語を含む全語彙について、Claude がマスターガイドを参照して語彙ごとの最適プロンプトを生成→S列に投入→GASが自動生成する方式に変更 |
| **image_prompts_lesson2.json は新方式で再活用できる**（v4.6） | 新方式のJSON形式に変換してS列投入に活用可能 |
| **例文が Examples シートに未投入**（v4.6） | importFromLessonJson.gs は語彙のみ対応。lesson_02 の例文音声が生成されない状態。importExamplesFromLessonJson()の新規作成が必要 |
| **補助列は O〜R（19列目はS列に imagePrompt を追加予定）**（v4.6） | 補助列が O(15), P(16), Q(17), R(18) に追加済み。S(19)は次チャットで追加予定 |

---

## §11. 将来の機能追加（マネタイズ・スケール関連）

（v4.1 §11 の内容をすべて継承。変更なし。）

| 機能 | 詳細 | 根拠 |
|---|---|---|
| **vocabFilter / exampleFilter 実装** | session の teach[] に `null` で予約済み | v15 で設計・予約確定 |
| **activity_html.js 画像接続** | imageRegistry を各 build*() 関数へ接続 | v19 で後回し確定 |
| **日本語辞書サイト** | word_* / sentence_* 資産をウェブ辞書に転用 | v15 設計方針 |
| **複数教科書対応** | みんなの日本語・げんき等 | v15 ロードマップ |
| **N4語彙追加（788語）** | extractByLevel() で実施 | handoff_v2 §10 |

---

## §12. 次チャットの開始コマンド例

```
handoff_v4_6.md と SKILL_v1_6.md と
master_prompt_design_guide_v2_6_complete.py をアップロードしました。

作業①：GASにS列（imagePrompt）を追加します。
addImagePromptColumn()・importImagePrompts()・buildImagePrompt_()修正の
コードを確認してください（§8参照）。

作業②：GCP_TTS_KEY のキー名不一致を修正します。

作業③：一時追加した関数を削除します。

作業④：lesson_01・02（35語）の imagePrompt を
マスターガイドを参照して生成してください。

作業⑤：Examples シートへの lesson_02 例文投入関数を作成してください。
```

---

## §13. 音声生成 API 移行の記録（v4.3 確定・参照用）

（v4.5 §13 の内容をすべて継承。）

### Cloud TTS エラー発生時の対処

| エラー | 対処 |
|---|---|
| `HTTP 403: API_KEY_INVALID` | **GASコードが `GCP_TTS_API_KEY` を参照していないか確認（v4.5発見）。正しくは `GCP_TTS_KEY`** |
| `HTTP 403: ACCESS_DENIED` | Cloud Console で Cloud Text-to-Speech API を有効化 |
| `HTTP 403: BILLING_DISABLED` | Cloud Console → お支払いから請求先アカウントを設定 |
| `audioContent が空` | `ja-JP-Wavenet-B` のスペルを確認 |

---

## §14. 画像生成システム v2.6 対応の記録（v4.4 確定・参照用）

（v4.5 §14 の内容をすべて継承。v4.6 ではアーキテクチャを変更。詳細は §16 参照。）

---

## §15. generateImages.gs v5.2 マージの記録（v4.5 確定・参照用）

（v4.5 §15 の内容をすべて継承。）

### v5.2 の現在の状態（v4.6 更新）

- **行数：** 1741行
- **GAS適用：** ✅ 完了
- **STYLE_RECIPE：** ✅ hex値バグ修正済み（v4.6）
- **モデル：** `imagen-4.0-generate-001`（v4.6で修正）
- **S列参照：** ⚠️ 未実装（次チャットで追加）

---

## §16. 画像生成アーキテクチャ 方針転換の記録（v4.6 確定）

### 背景

v4.6 でのテスト生成中に、テンプレート自動生成方式には以下の限界が判明した：

- 語彙ごとの視覚的ニュアンスがテンプレートで捉えきれない
- char_鈴木 との画風統一がテンプレートだけでは難しい
- マスターガイドには語彙別の詳細な視覚設計があるが、テンプレートでは1割も活用されていない

### 確定した方針

**全語彙（lesson語彙 + Goi_List N5全412語）について、Claude がマスターガイドを参照して語彙ごとの最適プロンプトを生成し、Vocabulary シートの S列に格納する。GAS は S列を最優先で参照して Imagen API に渡す。**

### 新しいワークフロー

```
1. Claude が master_prompt_design_guide_v2_6_complete.py を読む
2. 語彙リスト（50語単位）を受け取る
3. 各語彙について：
   - vocab_type を確認
   - ガイドの該当テンプレート・設計思想を参照
   - 語彙固有の視覚要素を考慮（文化・教育文脈）
   - STYLE_RECIPE を付加
4. JSON形式で出力：{ "word_先生": "...", ... }
5. GAS の importImagePrompts() でシートのS列に投入
6. generateImageBatch() が S列のプロンプトを使って自動生成
```

### GASへの変更内容（次チャットで実装）

| 変更内容 | 詳細 |
|---|---|
| S列（imagePrompt）追加 | Vocabulary シートの19列目に追加 |
| addImagePromptColumn() | S列ヘッダー追加関数 |
| importImagePrompts(jsonData) | JSONからS列に一括投入する関数 |
| buildImagePrompt_()修正 | S列が空でなければそれを返す（テンプレートはフォールバック） |
| getAllImageRows_()修正 | S列（row[18]）を読み込むよう拡張 |

### プロンプト生成の優先順位

| 優先度 | 語彙 | 理由 |
|---|---|---|
| 最高 | lesson_01・02 の全語彙（35語） | 授業で使う・char_鈴木と画風統一が重要 |
| 高 | Goi_List N5全語彙（412語） | N5は基礎語彙・品質が学習効果に直結 |
| 中 | N4語彙（788語・将来） | 追加時に同方式で生成 |

### テンプレート自動生成は「フォールバック」として維持

S列にプロンプトが入っていない語彙が追加された場合（新しい課・イレギュラーな語彙）は、テンプレート方式が自動で使われる。これにより新語彙が即座に処理対象になる利点を保持。

### 旧 image_prompts ファイルの扱い

`image_prompts_lesson2_v2_0.json` は新方式の入力として活用可能：
- すでに詳細なプロンプトが存在する33エントリをS列投入のJSONに変換
- STYLE_RECIPE を新方式（hex値なし）に更新して再利用

---

## §17. 画像生成テスト記録（v4.6）

### テスト対象：word_先生

| 試行 | モデル | 結果 | 問題 | 対応 |
|---|---|---|---|---|
| 第1回 | imagen-4.0-generate-exp | ❌ HTTP 404 | モデルが存在しない | imagen-4.0-generate-001 に変更 |
| 第2回 | imagen-4.0-generate-001 | ❌ HTTP 400 | Imagen は無料プランで使用不可 | 有料プラン（Pay-as-you-go）に変更 |
| 第3回 | imagen-4.0-generate-001 | ❌ Drive保存エラー | IMAGE_FOLDER_ID が不正 | 正しいフォルダIDに修正 |
| 第4回 | imagen-4.0-generate-001 | ⚠️ 生成成功・バグあり | STYLE_RECIPEの hex値が画像にテキストとして描画（`#FBFBBB` が左上に表示） | STYLE_RECIPE から hex値の説明を削除 |
| 第5回 | imagen-4.0-generate-001 | ✅ 生成成功 | char_鈴木 との画風差が課題 | アーキテクチャ方針転換を決定 |

### 生成済み画像（参考）

| ファイル名 | 状態 | 備考 |
|---|---|---|
| word_先生.png（第4回） | ⚠️ 左上に `#FBFBBB` テキスト混入 | バグあり・不使用 |
| vocab_先生.png（第5回） | ✅ 品質良好 | char_鈴木 に近いスタイル。ただしマスターガイド参照なしの汎用プロンプト |

### char_鈴木 との画風比較

| 要素 | char_鈴木（旧システム） | vocab_先生（新パイプライン第5回） |
|---|---|---|
| 背景色 | クリーム色 | ✅ 近い（ほぼ同等） |
| 輪郭線 | ネイビー細線 | ✅ 近い |
| カラーパレット | ネイビー・アンバー | ✅ 近い |
| 顔の描写 | 詳細あり | ✅ あり |
| 全体の画風 | セミフラットイラスト | ✅ 近い |
| プロンプト品質 | 専用設計 | ⚠️ テンプレート汎用（→マスターガイド方式で改善予定） |

---

*作成日：2026-05-18*
*根拠：画像生成テスト実施・STYLE_RECIPE修正・アーキテクチャ方針転換・例文未投入問題発見・GAS設計確定*
*前資料：handoff_v4_5.md（2026-05-18）*
