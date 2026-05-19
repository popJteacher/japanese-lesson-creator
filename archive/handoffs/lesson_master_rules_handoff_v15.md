# 課マスター作成ルール 引き継ぎ資料 v15
**作成日：2026-05-15**
**前バージョン：lesson_master_rules_handoff_v14.md**
**このチャットの目的：生成フロー全面再設計の方針確定・Plan.md作成・Claude Code実装開始**

---

## このチャットで完了・確定したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| 問題診断 | form.jsがFlowSynthesizerをバイパスして独自flow生成していることを特定 | ✅ 完了 |
| 設計方針決定 | 全面再設計（Option B）に決定 | ✅ 確定 |
| スライド構成再設計 | 文型ブロック構造・例文/練習の分離・まとめ内容確定 | ✅ 確定 |
| 命名規則統一方針 | vocab_* → word_* に統一（辞書サイトとの資産共有を見据え） | ✅ 確定 |
| 音声設計方針 | 外部TTS API使用・audioId予約フィールド追加 | ✅ 確定 |
| 語彙/例文選択の予約 | vocabFilter / exampleFilter フィールドをsessionに追加予約 | ✅ 確定 |
| Plan.md作成 | 7 Stage構成の実装仕様書を作成 | ✅ 完了 |
| Claude Code実装開始 | Plan.mdをClaude Codeに渡し、確認質問に回答済み | ✅ 進行中 |

---

## 問題診断の結果（このチャットで判明）

### 根本原因

```
【正しい設計の流れ】
lesson_NN.json（SSOT）→ FlowSynthesizer → resolvedFlow → slide_html.js

【旧来の実際の流れ（バグ）】
form.js が flow[] を独自生成 ────────────→ resolvedFlow → slide_html.js
                                 ↑
                 FlowSynthesizer もレッスンデータも使わない
```

`form.js` の `buildSession()` が `flow[]` を独自生成し、`main.js` が `session.flow` 非空時に `FlowSynthesizer.synthesize()` をスキップする分岐を持っていた。

### 3つの症状の原因

| 症状 | 原因 |
|---|---|
| 導入アクティビティが出ない | form.jsが `intro_activity` typeを生成しない |
| 語彙スライドがない | 語彙カードは `introActivitySlide()` 内でのみ描画。同上 |
| 英語トグル | **実際には動作していた**（誤認）。canDoEnフィールドが未設定なだけ |

---

## 確定した設計決定（全項目）

### アーキテクチャ

| 決定事項 | 内容 |
|---|---|
| form.jsのflow生成廃止 | `buildSession()` から `flow[]` フィールドを完全に除去 |
| FlowSynthesizer必須化 | `session.flow` の有無に関わらず常に `FlowSynthesizer.synthesize()` を呼ぶ |
| SSOTの明確化 | `lesson_NN.json` の `flow[]` が唯一の授業フロー情報源 |

### スライド構成

```
【確定したスライド構成（第1課・全文型選択時の例：17枚）】
 1. 表紙
 2. 今日の目標（canDo一覧）
--- 文型ブロック × パターン数 ---
 3. 導入アクティビティ p1（語彙カードグリッド）
 4. 文型① スライド
 5. 例文① （p1のみ）
 6. 練習① （p1のみ）
 7. 導入アクティビティ p2
 8. 文型② スライド
 9. 例文② （p2のみ）
10. 練習② （p2のみ）
11. 導入アクティビティ p3
12. 文型③ スライド
13. 例文③ （p3のみ）
14. 練習③ （p3のみ）
--- 後半 ---
15. アクティビティの時間（切り替えスライド・詳細なし）
16. まとめ（canDo + アンカー例文1文×パターン）
```

### 各スライドの決定事項

| 項目 | 決定 |
|---|---|
| 例文スライド | 文型ブロック内・その文型のみ（per-pattern） |
| 練習スライド | 文型ブロック内・その文型のみ（per-pattern） |
| フォームの並び替え単位 | 文型ブロックごと（例文/練習は独立して動かせない） |
| アクティビティスライド | 切り替えの合図のみ（活動名のみ表示・手順等なし） |
| まとめの内容 | canDo3件 + アンカー例文1文×文型（案X） |
| アンカー例文の定義 | lesson_01.json の各例文に `isAnchor: true/false` フィールドを追加 |

### アンカー例文（lesson_01）

| パターン | 例文番号 | 文 |
|---|---|---|
| p1 | 1-1 | 鈴木さんは先生です。 |
| p2 | 2-1 | 先生ですか。→ はい、先生です。/いいえ、先生じゃありません。 |
| p3 | 3-4 | リンさんは東西大学の学生です。（PDF原典・変更禁止） |

### 命名規則統一

| 資産種別 | 旧ID例 | 新ID例 | 備考 |
|---|---|---|---|
| 語彙画像 | `vocab_医者` | `word_医者` | lesson_01 全17語 |
| 語彙音声（新規） | なし | `word_医者` | audioUrl: null で予約 |
| 例文画像 | `ex_L01_001` | `ex_L01_001` | 変更なし |
| 例文音声（新規） | なし | `sentence_ex_L01_001` | audioUrl: null で予約 |

**理由：** 将来の日本語辞書サイト（画像・音声の資産共有）を見据えて、語彙資産を単語ベースのIDに統一。

### 音声設計方針

- **方式：** 外部TTS API（Google TTS / OpenAI TTS 等）で音声を事前生成 → Google Drive保存
- **管理：** `master_audio_registry.json`（画像と同じパイプライン）
- **実装：** 今回は `audioId` フィールド予約のみ。音声生成・宿題HTMLへの組み込みは次フェーズ
- **Web Speech APIは使わない**（音声品質の確保が必要なため）

### 将来の語彙/例文選択機能（フィールド予約のみ）

session_NNN.json の `teach[]` に以下を予約（`null` = 全件使用・現動作を変えない）:

```json
"teach": [
  {
    "lessonNo": 1, "patternId": "p1", "isNew": true,
    "vocabFilter": null,    // 将来：["医者", "先生"] のように指定可
    "exampleFilter": null   // 将来：["1-1", "1-3"] のように指定可
  }
]
```

**理由：** マネタイズ時に「語彙・例文のカスタム選択」を差別化機能として提供できる。課マスターの語彙・例文を充実させるほど選択肢が増える。

---

## システム動作環境（確認済み）

| 項目 | 内容 |
|---|---|
| 動作方式 | ブラウザのみで完結（サーバーサイド処理なし） |
| 起動方法 | `python -m http.server 8765` → `http://localhost:8765/` |
| エントリーポイント | `index.html`（フォームUI・生成・ダウンロードを1ファイルで担う） |
| 出力形式 | 4ファイルをBlobとして生成・`<a download>` でダウンロード |
| データ埋め込み | `scripts/build-embedded-data.py` がJSONをJSに変換してscriptタグで読む |
| 画像URL | Google Drive → `lh3.googleusercontent.com/d/<ID>=w<size>` 形式に変換 |

---

## Plan.md 概要（v1.0・2026-05-15作成）

**ファイル：** `Plan.md`（japanese-lesson-creator リポジトリのルートに配置）

| Stage | 内容 | 対象ファイル |
|---|---|---|
| Stage 1 | 命名規則統一（vocab_* → word_*） | `data/master_image_registry.json` |
| Stage 2 | lesson_01.json 更新（imageId変更・audioId予約・isAnchor・flow再設計） | `data/lesson_01.json` |
| Stage 3 | master_audio_registry.json 新規作成 | `data/master_audio_registry.json` |
| Stage 4 | session_001.json 更新（新フォーマット・vocabFilter/exampleFilter予約） | `data/session_001.json` |
| Stage 5 | アーキテクチャ修正（form.js flow廃止・main.js バイパス削除） | `src/ui/form.js` / `src/main.js` |
| Stage 6 | スライドレンダラー更新（文型ブロック対応・アクティビティ切替・まとめ改善） | `src/generators/slide_html.js` |
| Stage 7 | ビルド・動作確認（17枚チェックリスト12項目） | `build-embedded-data.py` + ブラウザ |

### 変更しないファイル
`flow_synthesizer.js` / `image_resolver.js` / `ruby_dictionary.js` / `design_tokens.json` / `fonts_imports.css` / `homework_html.js` / `activity_html.js`系

---

## Claude Codeへの回答済み確認事項

Claude Codeがプラン精査中に出した質問と、このチャットで確定した回答：

| # | 質問内容 | 回答 |
|---|---|---|
| Q1（前回） | isAnchor が複数ある場合の挙動 | **最初の1件のみ表示**（`find()` で先頭一致） |
| Q2（前回） | vocab_* → word_* の変更漏れ（slide_html.js等5ファイル） | **Stage 6に追加して修正**（`'vocab_' + word` → `'word_' + word`） |
| Q3 (1/3) | slide_html.js 1119行の vocabCardHtml プレフィックス変更をどのStageで行うか | **Stage 6に追加して修正** |
| Q4 (2/3) | master_image_registry.json の vocab_男の人 等17件以外の vocab_* キーの扱い | **Plan通り17件のみ変更・残りは触らない** |
| Q5 (3/3) | session_001.json の teach[] をp1/p2/p3の3件に拡張してよいか | **Plan例の通り3件に拡張** |

---

## 残課題（v14から継続）

| 残課題 | 内容 | 状態 |
|---|---|---|
| **Plan.md実装** | 上記7 Stageの実装（Claude Code担当） | 🔄 **進行中** |
| 残課題D | Skill 設計・実装（lesson_03以降の効率的作成） | ⏸ Plan.md完了後 |
| 残課題E | lesson_02 照合・作成 | ⏸ 残課題D完了後 |
| 残課題I | session_001.json 更新 | ✅ **Plan.md Stage 4として統合** |

---

## 今後の開発ロードマップ（このチャットで合意）

```
【近期】
  Plan.md 7 Stage実装完了
    └─ 動作確認（17枚スライド・全チェックリスト通過）

【中期】
  残課題D: Skill設計・lesson_03以降の効率的作成
  残課題E: lesson_02照合・完成
  音声生成パイプライン構築（外部TTS API + Google Drive）
  宿題HTMLへの音声・フラッシュカード実装
  スライドデザイン改善（別タスク）

【長期・マネタイズ】
  語彙/例文の選択機能実装（vocabFilter / exampleFilter）
  複数教科書対応（みんなの日本語・げんき等）
  日本語辞書サイト構築（word_* 資産の流用）
  SaaS化（教師が教科書データをアップロードして教材生成）
```

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / lessonVersion 1.0 | 🔄 Stage 2で更新予定 |
| `lesson_02.json` | lessonVersion 1.0 | ⚠️ 未照合（残課題E） |
| `activity_catalog.json` | v1.7（57件） | ✅ 完成 |
| `session_001.json` | formatVersion 1.0 | 🔄 Stage 4で更新予定 |
| `master_image_registry.json` | v1.4 | 🔄 Stage 1で更新予定 |
| `master_audio_registry.json` | — | 🔄 Stage 3で新規作成予定 |
| `Plan.md` | v1.0 | ✅ 作成済み（2026-05-15） |

---

## 守るべきルール（v15・変更なし）

| ルール | 内容 |
|---|---|
| A-1 | 例文はPDF照合してから書く |
| A-2 | 登場人物を勝手に作らない |
| A-3 | 教科書の固有名詞は変えない（東西大学・リンさん等） |
| A-4 | 「教え方の例N」で使う素材が前の手順で導入済みか確認する |
| NEW | catalogの `prerequisitePatterns` は必ず grammarConcept ID を使う |
| NEW | `usedInLesson1` は廃止済み。使用禁止 |
| NEW | アクティビティUIは特定の課にハードコードしない |
| NEW | `vocab_*` プレフィックスは廃止。語彙資産は `word_*` に統一 |
| NEW | `audioId` / `vocabFilter` / `exampleFilter` は予約フィールド。実装は次フェーズ |

---

## 次チャットへのアップロード必須ファイル

- **この資料**（`lesson_master_rules_handoff_v15.md`）
- **`Plan.md`**（Claude Codeに渡した実装仕様書）
- `activity_catalog.json`（v1.7・変更があった場合のみ）

---

## 次チャットでの最初の確認事項

1. Claude CodeによるPlan.md実装の完了状況を確認する
2. Stage 7チェックリスト（17枚・12項目）の結果を確認する
3. 問題があれば修正指示を出す
4. 完了後、次の作業（デザイン改善 or 残課題D）を決める

---

*資料バージョン：v15（2026-05-15）*
*前バージョン：lesson_master_rules_handoff_v14.md*
