# 引き継ぎ資料：マルチメディア資産自動生成パイプライン（音声生成実装）
**作成日：2026-05-15**
**チャットの位置づけ：gas_pipeline_handoff_v1.md の続き（音声生成 GAS 実装）**
**次チャットで着手：② スプレッドシート設計**

---

## このチャットで確認・決定・実装したこと

### A. Google AI Studio レート制限の精査結果（全件確認済み）

前チャット（gas_pipeline_handoff_v1.md）の分析は**全て正確だった**。
加えて、前チャットで言及されなかった有用なモデルが確認された。

#### 確定したレート制限（全モデル）

| モデル | カテゴリ | RPM | TPM | RPD | 用途 |
|---|---|---|---|---|---|
| Gemini 2.5 Flash | テキスト | 5 | 250K | 20 | 高品質テキスト処理 |
| Gemini 2.5 Flash Lite | テキスト | 10 | 250K | 20 | テキスト処理 |
| Gemini 3 Flash | テキスト | 5 | 250K | 20 | テキスト処理 |
| Gemini 3.1 Flash Lite | テキスト | 15 | 250K | 500 | テキスト処理（高RPD）|
| Gemma 4 26B | テキスト | 15 | 無制限 | 1,500 | テキスト処理・プロンプト生成 |
| Gemma 4 31B | テキスト | 15 | 無制限 | 1,500 | テキスト処理（大規模）|
| Gemini Embedding 1 | 埋め込み | 100 | 30K | 1,000 | 語彙品質チェック・重複検出 |
| Gemini Embedding 2 | 埋め込み | 100 | 30K | 1,000 | 同上（新版）|
| Gemini 2.5 Flash TTS | 音声生成 | 3 | 10K | **10** | 音声生成メイン |
| Gemini 3.1 Flash TTS | 音声生成 | 3 | 10K | **10** | 音声生成サブ（合計20/日）|
| Imagen 4 Generate | 画像生成 | - | - | **25** | 画像生成 |
| Imagen 4 Fast Generate | 画像生成 | - | - | **25** | 画像生成（高速）|
| Imagen 4 Ultra Generate | 画像生成 | - | - | **25** | 画像生成（高品質）★新発見 |

#### 前チャットからの修正・追加事項

**① Imagen 4 Ultra Generate（RPD:25）が新たに判明**
→ 画像生成の合計が 50枚/日 → **75枚/日** に拡張可能。
→ N5（約800語）の画像生成が約32日→**約11日**に短縮。

**② Gemma 4 31B（RPD:1,500）が新たに判明**
→ Gemma 4 26B と合わせてテキスト処理が**3,000件/日**に倍増。

**③ Gemini Embedding 1/2（各 RPD:1,000）が新たに判明**
→ 完全に前チャットで未言及。語彙QAの自動化に使える。
→ 活用案：語彙の意味的類似度チェック / vocab_type 自動分類 / 重複検出

**④ デュアルTTSモデル戦略が確定**
→ Gemini 2.5 Flash TTS（RPD:10）+ Gemini 3.1 Flash TTS（RPD:10）= **20件/日**

---

### B. 音声生成GASスクリプトの実装（完了）

#### 実装したファイル

| ファイル名 | Drive上の場所 | 説明 |
|---|---|---|
| `generateAudio.gs` | GAS プロジェクトに貼り付け | 音声生成スクリプト本体 |
| `audio_prompts_lesson1.json` | Google Drive（任意のフォルダ）| 音声生成タスクリスト |

#### 設計上の判断と理由

**判断①：入力JSONを image_prompts と同じ方式にした**

理由：v5（画像生成）が `image_prompts_lessonN.json` を Drive から読み込む方式で成功しており、同じパターンを踏襲することで教師の学習コストを最小化できる。スプレッドシート（②）が完成するまでの暫定的な入力方式としても機能する。

**判断②：WAV形式で保存（MP3ではない）**

理由：Gemini TTS API は raw PCM（audio/L16）を返す。GAS 環境でMP3エンコードは困難（外部ライブラリ不可）。WAVはPCMにヘッダーを付与するだけで生成できる。宿題HTMLはモダンブラウザで動作するためWAVで問題ない。将来的にMP3が必要な場合は Cloud Functions 等で変換レイヤーを追加する。

**判断③：textToSpeak フィールドで句点変換済み**

理由：lesson_01.json の例文は教科書表記（「／」「→」等の記号）で保存されている。これらを TTS に送るとポーズが入らない・誤読が起きるリスクがある。`audio_prompts_lesson1.json` の `textToSpeak` フィールドで事前にクリーニングし、ソースデータ（lesson_01.json）を汚さない設計にした。

**判断④：語彙はひらがな/カタカナ読みで TTS に送る**

理由：漢字1語（例：「医者」）をそのままTTSに送ると読み方が不安定になることがある。`reading` フィールドの「いしゃ」を `textToSpeak` に使うことで発音精度を確保。

**判断⑤：ログのスプレッドシート背景色を緑（#E8F5E9）に設定**

理由：v5の画像生成ログが青（#EAF4FF）のため、画像ログと音声ログを視覚的に区別するため。

#### script の主要関数

```
runAll()               メイン実行。スプレッドシートの✅記録を見て未生成のみ処理
processAudioEntry()    1エントリ処理（TTS呼び出し→WAV変換→Drive保存→ログ）
callGeminiTTS()        Gemini TTS API呼び出し。レスポンスのMIMEタイプからsampleRate自動検出
buildWavBlob()         PCM base64 → WAV Blob（44バイトのWAVヘッダーをGASで構築）
saveAudioToDrive()     Drive保存。同名ファイルがある場合は上書き（トラッシュ→再作成）
exportUrlsToJson()     スプレッドシートの✅行を読んでmaster_audio_registry.jsonを更新
testSingleAudio()      TARGET_IDを1件だけ生成して動作確認
```

#### デュアルモデル運用手順

```
【1回目】SETTINGS.MODEL = "gemini-2.5-flash-preview-tts"
  → runAll() → 最大9件生成（安全マージン1件残し）

【2回目】SETTINGS.MODEL = "gemini-3.1-flash-preview-tts" に変更
  → runAll() → 残りを最大9件生成

合計: 最大18件/日（実質2日で32件完了）
```

#### 生成スケジュール

| 対象 | 件数 | 必要日数 |
|---|---|---|
| lesson_01（語彙+例文） | 32件 | **2日** |
| N5全語彙 | 約800語 | 約40日 |
| N5+N4 | 約2,300語 | 約115日 |

#### SETTINGS に設定が必要なID（初回セットアップ時）

```javascript
SETTINGS = {
  API_KEY:          "YOUR_API_KEY",          // Google AI Studio のAPIキー
  AUDIO_FOLDER_ID:  "DRIVE_FOLDER_ID",       // 音声保存先Driveフォルダ（新規作成要）
  JSON_FILE_ID:     "AUDIO_PROMPTS_FILE_ID", // audio_prompts_lesson1.json のファイルID
  REGISTRY_FILE_ID: "REGISTRY_FILE_ID",      // master_audio_registry.json のファイルID
  SS_ID:            "SPREADSHEET_ID",        // ログ用スプレッドシートID（v5と共有可）
  SS_SHEET_NAME:    "音声生成ログ_L01",       // シート名（課ごとに変える）
}
```

**注意：v5の SS_ID と同じスプレッドシートを使いまわせる（シート名で区別）。**

#### 既知の不確定事項（次チャット開始前に確認推奨）

1. **モデル名の確認**：`gemini-2.5-flash-preview-tts` / `gemini-3.1-flash-preview-tts` が正確なAPIモデル名であることを Google AI Studio の Docs で確認すること。名前が違う場合は `callGeminiTTS()` の URL 部分のみ変更すればよい。

2. **WAV再生の確認**：生成したWAVファイルが宿題HTMLの `<audio>` タグで正常に再生されるかはテスト未実施。`testSingleAudio()` 実行後に Drive で直接再生して確認すること。

---

## 次チャットで着手すること：② スプレッドシート設計

### 目的

GASパイプライン全体（画像生成・音声生成）の**SSOT（Single Source of Truth）**となるスプレッドシートを設計・初期データ投入する。

### なぜスプレッドシートが必要か

現在の構成は各 lesson ごとに `image_prompts_lessonN.json` / `audio_prompts_lessonN.json` を手動で作成している。これはN5全語彙（800語以上）を扱う長期運用では管理が破綻する。スプレッドシートを SSOT にすることで：

- 語彙追加時は1行追記するだけで画像・音声両方の生成対象になる
- status 管理（pending/generated/approved/failed）が一元化される
- `syncRegistries.gs` でJSONレジストリへの自動書き出しができる

### 設計方針（gas_pipeline_handoff_v1.md から継承）

```
スプレッドシート構成:
  Vocabulary シート  → N5〜N1の全語彙（長期SSOT）
  Examples シート    → 全課の例文
  Log シート         → GAS実行ログ（画像・音声共通）
```

### Vocabulary シートのカラム設計（確定済み）

| 列 | フィールド | 型 | 例 | 備考 |
|---|---|---|---|---|
| A | word | string | 医者 | 漢字表記 |
| B | reading | string | いしゃ | ひらがな |
| C | en | string | doctor | 英語訳 |
| D | jlptLevel | enum | N5 | N5〜N1 |
| E | pos | string | noun | 品詞 |
| F | vocab_type | string | person | プロンプトテンプレート選択に使用 |
| G | imageId | string | word_医者 | master_image_registry のキー |
| H | imageStatus | enum | approved | pending/generated/approved/failed |
| I | imageUrl | string | https://... | 生成後に自動入力 |
| J | audioId | string | word_医者 | master_audio_registry のキー |
| K | audioStatus | enum | pending | pending/generated/approved/failed |
| L | audioUrl | string | null | 生成後に自動入力 |
| M | lessonRef | string | lesson_01 | どの課で使われるか |

### Examples シートのカラム設計（確定済み）

| 列 | フィールド | 型 | 例 | 備考 |
|---|---|---|---|---|
| A | id | string | sentence_ex_L01_001 | audio registryキー |
| B | lessonNo | number | 1 | |
| C | patternId | string | p1 | |
| D | sentence | string | 鈴木さんは先生です。 | lesson_01.jsonの原文 |
| E | sentenceEn | string | Suzuki-san is a teacher. | |
| F | textToSpeak | string | 鈴木さんは先生です。 | TTS送信テキスト（クリーニング済み）|
| G | audioStatus | enum | pending | |
| H | audioUrl | string | null | |
| I | isAnchor | boolean | TRUE | アンカー例文フラグ |

### 初期データ投入の優先順位

```
1. Vocabulary シート
   → audio_prompts_lesson1.json の17語をシードデータとして入力
   → imageStatus は master_image_registry.json から転記（lesson_01: approved）
   → audioStatus は全て pending

2. Examples シート
   → audio_prompts_lesson1.json の15件をシードデータとして入力
   → audioStatus は全て pending
```

### 既存 GAS v5 との関係（次チャットで決定すること）

現在の `GAS_Lesson_ImageGenerator_v5.gs` は `image_prompts_lessonN.json` を入力として動作しており、安定稼働している。スプレッドシートを追加した後の関係を決める必要がある。

**選択肢A（推奨）：スプレッドシートはSSOT、JSONは出力**
```
スプレッドシート（SSOT）
  → syncRegistries.gs が毎晩JSONを生成
  → image_prompts_lessonN.json / audio_prompts_lessonN.json を上書き
  → 既存の v5 / generateAudio.gs はJSONを読んで動作（変更不要）
```
メリット：既存スクリプトを改修しなくて済む。段階的移行が可能。

**選択肢B：スプレッドシートから直接生成**
```
スプレッドシート（SSOT）
  → generateImages.gs がシートを直接読んで生成
  → generateAudio.gs がシートを直接読んで生成
  → JSONファイルは不要（レジストリのみ残す）
```
メリット：JSONファイルの管理が不要。システムがシンプルになる。
デメリット：v5とgenerateAudio.gsの両方を改修が必要。

---

## プロジェクト全体の現在地

### japanese-lesson-creator（教材生成ツール）との関係

本パイプラインは `japanese-lesson-creator` プロジェクト（Claude Codeで実装中）とは**別ルート**で動いている。

```
【japanese-lesson-creator】（Claude Code実装・別ライン）
  lesson_01.json / session_001.json 等のデータを読み込んで
  スライド・宿題・アクティビティHTMLを自動生成する Web ツール
  → 現状：Stage 1の実装を破棄し、再実装中（project_handoff_complete.md参照）

【GASパイプライン】（本チャットで設計・実装）
  語彙・例文の画像・音声を自動生成して Google Drive に蓄積する
  → master_image_registry.json / master_audio_registry.json に URL を記録
  → japanese-lesson-creator が参照するデータを供給する役割

【連携フロー】
GASパイプライン（毎日自動実行）
  → master_image_registry.json を更新
  → master_audio_registry.json を更新

japanese-lesson-creator（必要時）
  → data/ フォルダのJSONを上記から取得して上書き
  → python scripts/build-embedded-data.py
  → 新しい語彙画像・音声が教材HTMLに反映
```

### 完成しているもの・未完成のもの

| 項目 | 状態 | ファイル |
|---|---|---|
| 画像生成GAS | ✅ 稼働中 | GAS_Lesson_ImageGenerator_v5.gs |
| lesson_01 画像 | ✅ 全17語 approved | master_image_registry.json v1.4 |
| lesson_02 画像 | ⏳ pending | master_image_registry.json |
| 音声生成GAS | ✅ 設計完了・未テスト | generateAudio.gs（今チャット作成）|
| 音声タスクリスト | ✅ 完成 | audio_prompts_lesson1.json（今チャット作成）|
| master_audio_registry | ✅ 枠のみ（全null）| master_audio_registry.json v1.0 |
| スプレッドシート | ❌ 未作成 | — |
| syncRegistries.gs | ❌ 未作成 | — |
| Imagen 4 Ultra 活用 | ❌ 未反映 | v5の設定を変更するだけ |

---

## 次チャット開始時のアップロード推奨ファイル

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| この資料（gas_pipeline_handoff_v2.md） | **必須** | 今チャットの全決定事項を含む |
| `generateAudio.gs` | 任意 | コードレビューが必要な場合 |
| `audio_prompts_lesson1.json` | 任意 | データ確認が必要な場合 |
| `master_audio_registry.json` | **必須** | スプレッドシート設計の参照元 |
| `master_image_registry.json` | **必須** | スプレッドシート設計の参照元 |
| `lesson_01.json` | 任意 | 例文データ確認が必要な場合 |
| `gas_pipeline_handoff_v1.md` | 任意 | 背景の長期計画を参照する場合 |

---

## チャット開始時の最初の一言テンプレート

```
gas_pipeline_handoff_v2.md の続きです。
② スプレッドシート設計から始めてください。

選択肢A（推奨：スプレッドシートはSSOT・JSONは出力）
または
選択肢B（スプレッドシートから直接生成）
どちらにするかを決めてから進めます。
```

---

*資料バージョン：v2.0（2026-05-15）*
*前バージョン：gas_pipeline_handoff_v1.md*
