# 課マスター作成ルール 引き継ぎ資料 v16
**作成日：2026-05-15**
**前バージョン：lesson_master_rules_handoff_v15.md**
**このチャットの追加内容：スライド仕様定義の着手・intro_activity_catalog設計の必要性確定・Claude Code実装範囲の限定**

---

## このチャットで完了・確定したこと（v15追加分）

| 項目 | 内容 | 状態 |
|---|---|---|
| スライド仕様（8typeのうち4type）| 表紙・intro_slide・main_activity・wrapUpの内容確定 | ✅ 確定 |
| intro_activityの内容分析 | 語彙カードではなくキャラクターカードが正しいと判明 | ✅ 確定 |
| namedCharacters問題の発見 | v2.6でデータ削除済み。復活が必要と確定 | ✅ 確定 |
| intro_activity_catalogの必要性 | 導入アクティビティをカタログ管理すべきと確定 | ✅ 確定 |
| Claude Code実装範囲の限定 | Stage 1・3・4・5のみ進行。Stage 2・6・7は仕様確定後 | ✅ 指示済み |

---

## v15からの変更点サマリー

v15時点では「Plan.md 7 Stage全部を実装」の方針でしたが、以下の問題が判明したため実装範囲を限定しました。

**判明した問題：**
1. `intro_activity` スライドの内容が未定義（語彙カードか・キャラクターカードか）
2. キャラクターカード生成に必要な `namedCharacters` データが lesson_01.json から削除済み（v2.6）
3. `intro_activity_catalog.json` がなければ lesson_02以降で自動生成ワークフローに乗らない
4. スライド仕様書が 8type中 4typeしか確定していない

---

## 確定済みスライド仕様（8typeのうち4type）

### ✅ 表紙
```
・レッスンタイトル（例：第1課 名詞）
・セッション日付
・学習者ID
```

### ✅ intro_slide（今日の目標）
```
・見出し「今日の目標」
・各文型のcanDoを1件ずつカード表示
  例）✓ 自分や他の人の名前・職業・国籍を「〜は〜です」で紹介できる。
```

### ✅ main_activity（アクティビティの時間）
```
・見出し「アクティビティの時間」
・選択された活動名のみ（例：はじめまして会話）
・詳細・手順・playerExplanationは表示しない
  （→ アクティビティHTMLに含まれるため）
```

### ✅ wrapUp（まとめ）
```
・見出し「まとめ」
・各文型のcanDo + アンカー例文1文をセットで表示
  例）✓ 〜は〜です → 鈴木さんは先生です。
       ✓ 〜ですか  → 先生ですか。→ はい、先生です。/いいえ、先生じゃありません。
       ✓ 〜の〜です → リンさんは東西大学の学生です。
```

---

## 未確定スライド仕様（次チャットで定義する4type）

| type | 未決定の主な論点 |
|---|---|
| `intro_activity` | キャラクターカード構成・intro_activity_catalogとの関係 |
| `pattern` | 文型構造の視覚化方法・表示要素の選定 |
| `example` | 例文カードのレイアウト・1スライドに何件表示するか |
| `practice` | 練習問題の表示形式・解答表示の有無 |

---

## intro_activity の設計（判明した事実と決定事項）

### 3つのintro_activityの内容

| | intro_act_p1 | intro_act_p2 | intro_act_p3 |
|---|---|---|---|
| **主素材** | キャラクターカード（5名） | p1のカードを再利用 | p1のカード再利用 + 建物カード |
| **補助素材** | 世界地図（国旗付き） | 有名人写真（教師が用意） | — |
| **activityId** | act_picture_card_vocab_intro | act_qa_pattern_intro | act_attribute_modeling_intro |
| **目的** | 人物・職業・国籍の語彙導入 | 「〜ですか？はい/いいえ」練習 | 「〜の〜です」所属表現の導入 |

### キャラクター5名（lesson_01 固有）

| 名前 | 職業 | 国籍 | imageId |
|---|---|---|---|
| 鈴木さん | 先生 | 日本人 | char_鈴木 |
| リンさん | 学生 | 中国人 | char_リン |
| キムさん | 会社員 | 韓国人 | char_キム |
| タノムさん | 医者 | ベトナム人 | char_タノム |
| ケリーさん | （外国人代表） | アメリカ人 | char_ケリー |

### namedCharacters問題と対応

**問題：** v2.6（Phase 1-F）でキャラクター概念廃止時に `characters` セクションを削除。キャラクターカード生成に必要なデータが lesson_01.json の活きた状態に存在しない。

**決定：案A（namedCharactersセクション復活）**
```json
// lesson_01.json に追加するセクション
"namedCharacters": [
  { "name": "鈴木さん", "occupation": "先生",   "nationality": "日本人",   "imageId": "char_鈴木"  },
  { "name": "リンさん",  "occupation": "学生",   "nationality": "中国人",   "imageId": "char_リン"  },
  { "name": "キムさん",  "occupation": "会社員", "nationality": "韓国人",   "imageId": "char_キム"  },
  { "name": "タノムさん","occupation": "医者",   "nationality": "ベトナム人","imageId": "char_タノム"},
  { "name": "ケリーさん","occupation": "外国人", "nationality": "アメリカ人","imageId": "char_ケリー"}
]
```

**注意：** v2.6の「固定キャラ廃止方針（物語の連続性を持たせない）」とは矛盾しない。これはカード生成のためのデータ定義であり、キャラクターを課を跨いで追うことは今後もしない。

---

## intro_activity_catalog.json の設計方針

### 既存の activity_catalog.json との違い

| | activity_catalog.json | intro_activity_catalog.json |
|---|---|---|
| **役割** | 授業後半のメインアクティビティ | 文型導入前の語彙・文型導入アクティビティ |
| **選択者** | 教師がセッション作成時に選択 | lesson_NN.jsonのflow[]で自動決定 |
| **コンテンツ** | アクティビティHTML生成が必要 | スライドHTMLに組み込まれる |

### 設計の基本原則

```
【活動の構造・手順】→ カタログで管理（課に依存しない・再利用可能）
  act_picture_card_vocab_intro:
    playerSteps: [聞く・リピート・文字なしでトライ]
    defaultMaterialTypes: [named_character_card, auto_generated_vocab]

【使う素材・コンテンツ】→ lesson_NN.json で管理（課固有）
  materialNeeds: [具体的なキャラクター名・語彙リスト]
  namedCharacters: [課に登場する人物]
```

### 想定エントリ（第1課分）

| activityId | 活動名 | 対応パターン |
|---|---|---|
| act_picture_card_vocab_intro | 絵カードによる語彙・基本文型導入 | p1（全課共通） |
| act_qa_pattern_intro | 絵カードによる疑問文・応答導入 | p2（全課共通） |
| act_attribute_modeling_intro | モデル文拡張による所属・修飾の導入 | p3（全課共通） |

---

## Claude Code 実装状況（2026-05-15時点）

### 指示済み内容
```
進行可：Stage 1・3・4・5
保留中：Stage 2・6・7（スライド仕様確定後に渡す）
```

### Stage別状況

| Stage | 内容 | 状態 |
|---|---|---|
| Stage 1 | master_image_registry.json（vocab_* → word_*） | 🔄 進行中 |
| Stage 2 | lesson_01.json 更新 | ⏸ 保留（namedCharacters追加・仕様確定後） |
| Stage 3 | master_audio_registry.json 新規作成 | 🔄 進行中 |
| Stage 4 | session_001.json 更新 | 🔄 進行中 |
| Stage 5 | form.js / main.js アーキテクチャ修正 | 🔄 進行中 |
| Stage 6 | slide_html.js スライドレンダラー更新 | ⏸ 保留（スライド仕様確定後） |
| Stage 7 | ビルド・動作確認 | ⏸ Stage 6完了後 |

---

## 次チャットでやること

```
【優先順位順】

1. intro_activity_catalog.json の設計・作成
   → エントリ構造の確定
   → 第1課の3件（act_picture_card_vocab_intro等）のデータ作成

2. 残り4typeのスライド仕様定義
   → intro_activity（キャラクターカード構成）
   → pattern（文型構造の視覚化）
   → example（例文カードレイアウト）
   → practice（練習問題形式）

3. Plan.md 更新
   → Stage 2にnamedCharacters追加を明記
   → Stage 6にスライド仕様を追加
   → intro_activity_catalog作成StageをStage 2.5として追加

4. Claude CodeにStage 2・6・7を渡す
```

---

## 次チャットへのアップロード必須ファイル

- **この資料**（`lesson_master_rules_handoff_v16.md`）
- **`Plan.md`**（v1.0・2026-05-15）
- `activity_catalog.json`（v1.7・参照用）

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / lessonVersion 1.0 | ⏸ Stage 2保留中 |
| `lesson_02.json` | lessonVersion 1.0 | ⚠️ 未照合（残課題E） |
| `activity_catalog.json` | v1.7（57件） | ✅ 完成 |
| `intro_activity_catalog.json` | — | 🔲 次チャットで新規作成 |
| `session_001.json` | formatVersion 1.0 | 🔄 Stage 4で更新中 |
| `master_image_registry.json` | v1.4 | 🔄 Stage 1で更新中 |
| `master_audio_registry.json` | — | 🔄 Stage 3で新規作成中 |
| `Plan.md` | v1.0 | ✅ 作成済み（更新予定） |

---

## 守るべきルール（v16・追加分のみ）

| ルール | 内容 |
|---|---|
| NEW | `namedCharacters` はカード生成専用データ。固定キャラ廃止方針（物語連続性なし）とは別概念 |
| NEW | `intro_activity_catalog.json` は activity_catalog.json とは別ファイルで管理する |
| NEW | intro_activityスライドに表示するのは語彙カードではなくキャラクターカード（lesson_01の場合） |
| NEW | スライド仕様が未確定のStageはClaude Codeに渡さない |

---

*資料バージョン：v16（2026-05-15）*
*前バージョン：lesson_master_rules_handoff_v15.md*
