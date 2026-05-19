# 引き継ぎ資料：2ライン合流ポイントと将来拡張計画
**バージョン：v1.0（2026-05-15）**
**目的：GASパイプライン × japanese-lesson-creator の合流・今後の拡張計画を網羅する**

---

## このドキュメントの位置づけ

```
【ライン A】japanese-lesson-creator（Claude Code 実装）
  lesson_NN.json → スライド / 宿題 / アクティビティ HTML を生成する Web ツール
  → Plan_v1_1.md に従って Stage 1〜7 を進行中
  → Step 1（生成エンジン）・Step 2（フォーム UI）完了済み
  → 現在 Step 3（アクティビティ UI）実装中

【ライン B】GASパイプライン（本資料のスコープ）
  語彙・例文の画像・音声を自動生成して Google Drive に蓄積する
  → GASスクリプト 8本すべて完成
  → master_image_registry.json / master_audio_registry.json にURLを記録
  → ライン A が参照するデータを供給する

【合流インターフェース】（本資料の核心）
  master_image_registry.json  →  image_resolver.js  →  slide_html.js
  master_audio_registry.json  →  homework_html.js（将来）
  ※ 両 registry は build-embedded-data.py で data/*.js に変換される
```

---

## 第1章：プロジェクト全体像

### 1-1. システム全体のデータフロー

```
【コンテンツ設計層】
  lesson_NN.json（SSOT）
    ├── patterns[]：文型・canDo・例文・練習問題
    ├── vocabulary[]：語彙（imageId / audioId 参照）
    ├── namedCharacters[]：登場人物（imageId 参照）
    └── flow[]：授業進行順序

【資産生成層（ライン B）】
  GASパイプライン
    ├── Vocabulary / Examples シート（SSOT: スプレッドシート）
    ├── generateImages.gs   → images/ フォルダ
    ├── generateAudio.gs    → audio/ フォルダ
    └── syncRegistries.gs   → master_image_registry.json
                              master_audio_registry.json

【変換層】
  build-embedded-data.py（手動実行）
    → data/lesson_01.js / data/image_registry.js / data/audio_registry.js 等

【教材生成層（ライン A）】
  ブラウザ（完全静的）
    ├── FlowSynthesizer.synthesize()
    ├── slide_html.js         → スライド HTML
    ├── homework_html.js      → 宿題 HTML
    └── activity_html.js      → アクティビティ HTML
```

---

## 第2章：ライン B 完成状況（GASパイプライン）

### 2-1. 完成済みスクリプト全8本

| ファイル | バージョン | 役割 | 主な実行関数 | 状態 |
|---|---|---|---|---|
| `setupSpreadsheet.gs` | v1.0 | SS・シートの初期構築 | `setupAll()` | ✅ 完成 |
| `seedLesson01.gs` | v1.1 | 第1課の語彙・例文初期投入 | `seedLesson01()` | ✅ 完成 |
| `extractFromGoiList.gs` | v1.0 | N5語彙421語の投入 | `extractFromGoiList()` | ✅ 完成 |
| `importFromLessonJson.gs` | v1.0 | lesson_NN.json からの差分追加 | `importLesson01()` | ✅ 完成 |
| `classifyAndTranslate.gs` | v1.0 | en + vocab_type の自動付与 | `classifyBatch()` | ✅ 完成 |
| `generateImages.gs` | v5.0 | 語彙画像の生成（Imagen 4） | `generateImageBatch()` | ✅ 完成 |
| `generateAudio.gs` | v2.0 | 語彙・例文の音声生成（Gemini TTS） | `generateAudioBatch()` | ✅ 完成 |
| `syncRegistries.gs` | v1.1 | registry.json への書き戻し | `syncAll()` | ✅ 完成 |

> v1.1 での追加点：`setupSyncDailyTrigger()` 関数を追加（2026-05-15 本チャット）

### 2-2. 日次タイマー実行スケジュール（確定）

```
8:00   classifyBatch()       ← classifyAndTranslate.gs  Gemma 4
9:00   generateImageBatch()  ← generateImages.gs         Imagen 4
10:00  generateAudioBatch()  ← generateAudio.gs          Gemini TTS
23:00  syncAll()             ← syncRegistries.gs
       ↓（手動）
       build-embedded-data.py
```

### 2-3. 今回実装した機能・実装しなかった機能

| 機能カテゴリ | 内容 | 今回の状態 | 備考 |
|---|---|---|---|
| **画像生成ライン** | vocab_type 別テンプレートで AI 画像を生成 | ✅ **完成** | |
| **音声生成ライン** | 語彙・例文の TTS 音声を生成 | ✅ **完成** | |
| **テキスト分類** | en・vocab_type の空欄補完（Gemma 4） | ✅ **完成** | 品質チェックではなく空欄補完ツール |
| **高品質テキスト生成** | canDo文・例文の新規生成（Gemini 2.5 Flash） | ❌ **未着手** | 第3章で詳述 |
| **品質チェック** | Embedding による類似度検証・重複検出 | ❌ **未着手** | 第3章で詳述 |

### 2-4. ScriptProperties（全スクリプト共通）

| キー | 値 | 使用スクリプト |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio APIキー | classify / image / audio |
| `SPREADSHEET_ID` | スプレッドシートID | 全スクリプト |
| `IMAGE_FOLDER_ID` | Drive images/ フォルダID | generateImages.gs |
| `AUDIO_FOLDER_ID` | Drive audio/ フォルダID | generateAudio.gs |

### 2-5. 命名規則（確定・変更不可）

```
imageId / audioId:  "word_{漢字}"       例: word_医者、word_日本人
例文 audioId:       "sentence_ex_LNN_NNN" 例: sentence_ex_L01_001
キャラクター:       "char_{氏名}"        例: char_鈴木（保護対象）
例文画像:           "ex_LNN_NNN"         例: ex_L01_007（保護対象）
静的アセット:       任意                 例: world_map（保護対象）
```

---

## 第3章：利用可能なリソース全体像

### 3-1. 確定済みレート制限（Google AI Studio 無料枠）

| カテゴリ | モデル | RPD | 備考 |
|---|---|---|---|
| **画像生成** | Imagen 4 Generate | 25/日 | |
| | Imagen 4 Fast Generate | 25/日 | |
| | Imagen 4 Ultra Generate | 25/日 | ★ 新発見・未使用 |
| | **合計** | **75/日** | |
| **音声生成** | Gemini 2.5 Flash TTS | 10/日 | |
| | Gemini 3.1 Flash TTS | 10/日 | |
| | **合計** | **20/日** | |
| **テキスト処理** | Gemma 4 26B | 1,500/日 | 現在: 空欄補完に使用中 |
| | Gemma 4 31B | 1,500/日 | ★ 未使用 |
| | Gemini 3.1 Flash Lite | 500/日 | ★ 未使用 |
| | Gemini 2.5 Flash | 20/日 | ★ 高品質用・未使用 |
| | **合計** | **3,520/日** | |
| **品質チェック** | Gemini Embedding 1 | 1,000/日 | ★ 新用途・未使用 |
| | Gemini Embedding 2 | 1,000/日 | ★ 新用途・未使用 |
| | **合計** | **2,000/日** | |

### 3-2. 画像生成スケジュールへの影響

Imagen 4 Ultra の追加で N5 語彙処理が大幅短縮される：

```
変更前（2モデル・50枚/日）：N5約800語 → 約16日
変更後（3モデル・75枚/日）：N5約800語 → 約11日
```

---

## 第4章：合流ポイントの詳細

### 4-1. 現状の接続状態

ライン A（japanese-lesson-creator）は現在、**ダミーの imageUrl** で動作している。
ライン B の資産が蓄積され `syncAll()` → `build-embedded-data.py` が完了すると、
自動的に実画像・実音声に切り替わる設計になっている。

```
【現在の状態】
  data/image_registry.js   ← master_image_registry.json から生成（一部 URL が null）
  data/audio_registry.js   ← master_audio_registry.json から生成（全件 null）

【GAS完了後の状態】
  data/image_registry.js   ← 全語彙の Google Drive URL が入る
  data/audio_registry.js   ← 全語彙・例文の Google Drive URL が入る
```

### 4-2. 合流のための残タスク

#### ライン B 側（GASパイプライン）

| # | タスク | 実行者 | 完了条件 |
|---|---|---|---|
| B-1 | GAS ScriptProperties を設定 | **手動（人）** | 4キー全登録 |
| B-2 | setupAll() でSSを初期構築 | **手動（人）** | SSが作成される |
| B-3 | 初期データ投入（4ステップ） | **手動（人）** | 全語彙が SS に登録される |
| B-4 | タイマートリガー登録（4本） | **手動（人）** | 4件のトリガーが登録される |
| B-5 | Imagen 4 Ultra を generateImages.gs に追加 | **GAS修正** | 3モデル合計75枚/日に |

#### ライン A 側（japanese-lesson-creator）

Plan_v1_1.md の Stage 進行に従う。音声・画像の接続に関係する Stage は以下：

| Stage | 内容 | 音声・画像との関係 |
|---|---|---|
| Stage 1 | 命名規則統一（vocab_* → word_*） | ✅ 完了済み |
| Stage 2 | lesson_01.json に audioId 追加 | audioId の予約が完了すると GAS が処理開始できる |
| Stage 3 | master_audio_registry.json 新規作成 | ライン B の音声生成の出力先 |
| Stage 6 | スライドレンダラー更新 | audioId を使った音声再生 UI の実装（将来） |
| Stage 7 | ビルド・動作確認 | build-embedded-data.py 実行で両ラインが接続される |

#### 合流のゴールイメージ

```
① ライン B で語彙の画像・音声 URL が蓄積される
② syncAll() → build-embedded-data.py を実行
③ ライン A のブラウザで「語彙カードに画像が表示される」「例文に音声ボタンが出る」
```

---

## 第5章：未着手の将来拡張（テキスト処理・品質チェック）

### 5-1. 高品質テキスト生成ライン（未実装）

#### 概要

現在の `classifyAndTranslate.gs` は「空欄を埋める」だけのユーティリティ。
この拡張では **新しいコンテンツを生成する** GASスクリプトを追加する。

#### 想定ユースケース

| ユースケース | 使用モデル | 詳細 |
|---|---|---|
| canDo文の自動生成 | Gemini 2.5 Flash（20/日）| 文型パターン + JLPTレベルから「〜できる」形式の学習目標を生成 |
| 練習テンプレートの補充 | Gemma 4 26B / 31B | `practiceTemplates[]` の追加パターンを生成 |
| 例文の多様化 | Gemma 4 26B / 31B | 既存の例文を別シチュエーションで言い換えた例文を生成 |
| 英訳の品質向上 | Gemini 2.5 Flash（20/日）| Gemma 4 で付与した en の自然さを高品質モデルで校閲・修正 |

#### 想定アーキテクチャ

```
新規スクリプト: generateTextContent.gs
  入力: Vocabulary / Patterns シート
  処理: Gemini 2.5 Flash で高品質テキストを生成
  出力: SS の専用列（例: canDoJa / enRefined 列）
  → lesson_NN.json に手動マージ or 自動マージスクリプトを追加
```

#### 実装の前提条件

- SS に `canDoStatus` / `enRefinedStatus` 等の新しいステータス列を追加
- Gemini 2.5 Flash は RPD=20 のため、**1日20語彙分の高品質処理**が上限
- Gemma 4（3,000/日）との組み合わせで「粗→精」の2段階処理が効率的

---

### 5-2. 品質チェックライン（未実装）

#### 概要

Gemini Embedding モデル（各 1,000件/日）を使って、生成済みコンテンツの品質を自動検証する。

#### ユースケース A：画像プロンプト類似度チェック

```
目的: 異なる語彙が同じ見た目の画像になっていないか検出する
実装案:
  1. vocab_type ごとに生成したプロンプトを Embedding でベクトル化
  2. コサイン類似度が 0.95 以上のペアを「類似プロンプト警告」としてフラグ
  3. SS の imagePromptSimilarityAlert 列に記録
```

例：「医者」と「先生」が同じ「白衣の人物」画像にならないようにする

#### ユースケース B：語彙重複検出

```
目的: N5〜N1の語彙データベース構築時に意味的に重複する語彙を検出する
実装案:
  1. 全語彙の en（英訳）を Embedding でベクトル化
  2. 類似度が高い語彙ペアを重複候補としてリスト化
  3. 教師が確認して不要な重複語彙をマーク
```

#### ユースケース C：vocab_type 分類の精度検証

```
目的: classifyAndTranslate.gs が付与した vocab_type の妥当性を検証する
実装案:
  1. vocab_type ごとの代表語彙群をリファレンスとして Embedding 化
  2. 新規分類語彙の Embedding とリファレンスのコサイン類似度を計算
  3. 類似度が閾値以下の語彙を「分類要確認」としてフラグ
```

#### 実装の前提条件

- Gemini Embedding API の利用（REST API 経由で GAS から呼び出し可能）
- SS に `embeddingVector` 列を追加（または別シートで管理）
- ベクトルの保存には Google Drive の JSON ファイルを活用（SS のセル容量制限回避）
- 合計 2,000件/日（Embedding 1 + 2）の処理量

#### 想定スクリプト構成

```
新規: generateEmbeddings.gs   語彙・プロンプトのベクトル化
新規: qualityCheck.gs         類似度計算・フラグ付け
更新: setupSpreadsheet.gs     新しいシートの追加（EmbeddingStore シート等）
```

---

## 第6章：次チャットへの引き継ぎ

### 6-1. すぐに着手できるタスク（優先度：高）

| 優先 | タスク | 担当ライン | 詳細 |
|---|---|---|---|
| 1 | GAS セットアップ（手動） | ライン B | pipeline_setup_guide.md の手順に従う |
| 2 | Plan_v1_1.md Stage 2〜7 の実装 | ライン A（Claude Code）| audioId 追加・スライドレンダラー更新 |
| 3 | build-embedded-data.py 実行 | 両ライン合流 | syncAll() 後に手動実行 |

### 6-2. 近い将来に着手するタスク（優先度：中）

| タスク | 担当ライン | 前提条件 |
|---|---|---|
| Imagen 4 Ultra を generateImages.gs に追加 | ライン B | 現 GAS セットアップ完了後 |
| generateTextContent.gs の設計・実装 | ライン B（新規）| 基本パイプライン安定後 |
| Step 3 アクティビティ UI 完成 | ライン A | CLAUDE.md の対象8件を実装 |

### 6-3. 中長期タスク（優先度：低）

| タスク | 担当ライン | 前提条件 |
|---|---|---|
| generateEmbeddings.gs の実装 | ライン B（新規）| 語彙データが一定量蓄積後 |
| qualityCheck.gs の実装 | ライン B（新規）| Embedding 蓄積後 |
| N4〜N1語彙への拡張 | 両ライン | N5完成後 |
| 日本語辞書サイト向けのデータ整備 | 独立ライン | プロジェクト第2フェーズ |

### 6-4. 次チャットに必要なファイル

#### ライン B の作業を続ける場合

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| `gas_pipeline_handoff_v6.md` | 必須 | GAS の全決定事項 |
| `pipeline_setup_guide.md` | 必須 | セットアップ手順書 |
| 修正対象の `.gs` ファイル | 必須 | Imagen 4 Ultra 追加時など |

#### ライン A の作業を続ける場合

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| `CLAUDE.md` | 必須 | Claude Code の自律動作ルール |
| `Plan_v1_1.md` | 必須 | Stage 1〜7 の詳細仕様 |
| `lesson_01.json` | 必須 | Stage 2 以降の修正対象 |

---

## 付録A：generateImages.gs の vocab_type テンプレート対応表

| vocab_type | テンプレート | 生成戦略 |
|---|---|---|
| `person` | A | PERSON_PROFILES 辞書から人物描写を自動選択 |
| `building` | B | BUILDING_CUES 辞書から3つの手がかりを自動選択 |
| `concrete_object` | D | OBJECT_ALONE 戦略 |
| `action_verb` | H | MOTION_ARROW（矢印許可） |
| `adjective` | J | PAIR_CONTRAST（2物体対比） |
| `abstract_concept` | I | TIAC メタファー |
| `spatial_relation` | F | グリッド構図・境界線許可 |
| `demonstrative` | G | こ/そ/あ自動判定・領域色分け |
| `other` | デフォルト | 汎用プロンプト |

---

## 付録B：ライン A の現在地（CLAUDE.md より）

| Step | 内容 | 状態 |
|---|---|---|
| Step 1 | 生成エンジン（4ファイル出力） | ✅ 完了（2026-05-14） |
| Step 2 | フォーム UI | ✅ 完了（2026-05-14） |
| Step 3 | アクティビティ UI（8件） | 🔄 実装中 |

Plan_v1_1.md（アーキテクチャ再設計）は Step 3 と並行して進行中：

| Stage | 内容 | 状態 |
|---|---|---|
| Stage 1 | 命名規則統一 | ✅ 完了 |
| Stage 2 | lesson_01.json 更新 + audioId 追加 | 🔄 進行中 |
| Stage 2.5 | intro_activity_catalog.json 作成 | 🔄 進行中 |
| Stage 3〜7 | 以降の実装 | ⬜ 未着手 |

---

## 付録C：保護対象エントリ一覧（syncRegistries.gs）

```javascript
const PROTECTED_PREFIXES = ["char_", "ex_L"];
const PROTECTED_EXACT    = ["world_map"];
```

| エントリ | 理由 |
|---|---|
| `char_鈴木` 〜 `char_ケリー` | 実 URL が設定済み・上書き禁止 |
| `ex_L01_007` 〜 `ex_L01_015` | 例文画像は GAS スコープ外 |
| `world_map` | 静的アセット・手動管理 |

---

*作成日：2026-05-15*
*根拠資料：gas_pipeline_handoff_v6.md / Plan_v1_1.md / CLAUDE.md / pipeline_setup_guide.md*
