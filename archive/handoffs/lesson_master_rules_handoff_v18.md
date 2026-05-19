# 課マスター作成ルール 引き継ぎ資料 v18
**作成日：2026-05-15**
**前バージョン：lesson_master_rules_handoff_v17.md**
**このチャットの追加内容：Plan.md v1.1 全Stage完了・バグ修正・canDoEn仕様追加**

---

## このチャットで完了したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| Stage 1〜7 全完了 | Plan.md v1.1 の全タスクをClaude Codeが完了 | ✅ |
| Bug① ふりがなトグル | ruby_dictionary.js を65→131エントリに拡充（根本解決） | ✅ |
| Bug② p2パターンボックス誤解析 | 「はい」「いいえ」をFIXED_PHRASESとして優先処理 | ✅ |
| Bug④A p2アンカー例文 | isAnchorを2-1→2-4に移動（先生ですか。→はい/いいえ） | ✅ |
| canDoEn 仕様追加 | 全課共通仕様としてcanDoEnフィールドを追加 | ✅ |
| activity_catalog リネーム | activity_catalog_v1.7.json → activity_catalog.json | ✅ |
| ブラウザ動作確認 | フォーム生成スライドで全機能を目視確認済み | ✅ |

---

## v17からの変更サマリー

### lesson_01.json（formatVersion 2.7維持、v2.11.2）
- 全17語に `imageId: "word_*"` と `audioId: "word_*"` 設定済み
- 全15例文に `audioId` と `isAnchor: true/false` 設定済み
- flow[] を16エントリの文型ブロック構造に再設計済み
- `namedCharacters[]` 5件追加済み
- **canDoEn を全パターン（p1/p2/p3）に追加済み**
  - p1: "Can introduce names, occupations, and nationalities using '~ wa ~ desu'."
  - p2: "Can ask about occupations and nationalities using '~ desu ka' and answer yes or no. Can confirm identity using 'dare desu ka'."
  - p3: "Can express affiliation (school, company, bank, etc.) using '~ no ~ desu'."

### slide_html.js
- patternRef 単位の example/practice 生成
- intro_activity 3 layout 実装
- pattern スライド：スロット式パターンボックス＋canDo＋canDoEn（英語トグル対応）＋語彙グリッド
- example スライド：アンカー大カード（16:9）＋4列グリッド
- practice スライド：空欄ボックス＋hint
- wrapUp：canDo＋アンカー例文セット
- mainActivity：活動名のみ（シンプル切り替えスライド）

### ruby_dictionary.js
- 65エントリ → 131エントリ（約2倍）
- 第1課の全語彙・UI文言・施設名・固有名詞をカバー
- **新しい課を追加するときは、その課の語彙を必ず追加すること**

### 新規作成ファイル
- `data/intro_activity_catalog.json`（3件のintro活動定義）
- `data/master_audio_registry.json`（32エントリ・全てnull予約状態）

---

## 現在のファイルバージョン

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / v2.11.2 | ✅ 完成 |
| `lesson_02.json` | lessonVersion 1.0 | ⚠️ 未照合（canDoEn未追加・残課題） |
| `activity_catalog.json` | v1.7（57件） | ✅ リネーム完了 |
| `intro_activity_catalog.json` | v1.0（3件） | ✅ 完成・配置済み |
| `session_001.json` | formatVersion 2.0 | ✅ 完成 |
| `master_image_registry.json` | v1.4相当 | ✅ world_map・char_*追加済み |
| `master_audio_registry.json` | v1.0 | 🔄 全URLがnull（音声生成待ち） |
| `ruby_dictionary.js` | 131エントリ | ✅ 第1課カバー完了 |
| `slide_html.js` | — | ✅ 全8type実装済み |
| `slide_spec_remaining_4types.md` | — | ✅ canDoEn追記済み |

---

## スライド仕様 確定済み全8type

| type | 見出し例 | 状態 |
|---|---|---|
| `title`（表紙） | — | ✅ |
| `intro_slide` | 今日の目標 | ✅（canDoEn対応済み） |
| `intro_activity` | 導入 | ✅（3 layout対応済み） |
| `pattern` | 文型①②③ | ✅（canDoEn対応済み） |
| `example` | 例文①②③ | ✅（16:9アンカー＋4列グリッド） |
| `practice` | 練習①②③ | ✅（空欄ボックス・口頭前提・解答なし） |
| `main_activity` | アクティビティの時間 | ✅（活動名のみ） |
| `wrapUp` | まとめ | ✅（canDo＋アンカー例文） |

---

## 全課共通の新ルール（v18追加）

| ルール | 内容 |
|---|---|
| NEW | `patterns[].canDoEn` は全課のJSONで必須フィールド。英語で「Can ～」形式で記述する |
| NEW | 新しい課を追加するときは `ruby_dictionary.js` にその課の語彙を追加する |
| NEW | 課マスター作成時に `canDoEn` を入れない場合、英語トグルでcanDo部分が空白になる |
| 継続 | 例文画像は16:9・語彙/キャラクター画像は1:1。サイズ統一不要 |
| 継続 | intro_activityはスライド埋め込み（別HTML不要） |
| 継続 | 課マスター作成時にアセット照合を実施し、不足画像を解消してから完成とする |
| 継続 | namedCharactersはカード生成専用。固定キャラ廃止方針とは別概念 |

---

## ブラウザ動作確認で確認済みの内容

| # | 確認項目 | 結果 |
|---|---|---|
| 1 | ふりがなトグル ON/OFF | ✅ 全スライドで動作 |
| 2 | 英語トグル ON/OFF | ✅ 語彙・例文・canDoEn で動作 |
| 3 | 文型パターンボックスのカラーコーディング | ✅ 助詞/名詞スロット/語尾が正しく色分け |
| 4 | p2「はい」「いいえ」の誤解析なし | ✅ 修正済み |
| 5 | p2アンカー例文「先生ですか。→はい/いいえ」 | ✅ 修正済み |
| 6 | 例文スライドのアンカー大カード＋4列グリッド | ✅ |
| 7 | 導入アクティビティ3 layout | ✅ |
| 8 | まとめスライドにcanDo＋アンカー例文 | ✅ |
| 9 | スライド総枚数 15枚（mainActivities=[]時） | ✅ |

---

## 未解決のデザイン問題（後フェーズで対応）

| 問題 | 詳細 | 優先度 |
|---|---|---|
| 例文グリッドの下線不揃い | 一部カードに助詞下線なし | 低 |
| 下線付き文章の行間詰まり | 下線でテキストがはみ出す | 低 |
| 導入スライド指示文の折り返し | 長文が上端でクリップされることがある | 低 |
| p3パターンボックス上部クリップ | スクロール位置によっては見切れる | 低 |
| キムさん例文の画像構図 | 画像コンテンツの問題（コードバグではない） | 低 |

---

## 残課題（次フェーズ以降）

| 課題 | 内容 | タイミング |
|---|---|---|
| lesson_02.json 照合 | canDoEn追加・imageId確認・未照合のまま | Step 3完了後 |
| 画像URL設定 | world_map / char_* 5件のimageUrlがnull | 画像生成フェーズ |
| 音声生成 | master_audio_registry.json 全エントリがnull | 音声フェーズ |
| デザイン調整 | 上記デザイン問題 | Step 3完了後 |

---

## 次のステップ：Step 3 アクティビティUI実装

CLAUDE.md に定義済みの未実装8件：

| 優先 | ID | stage | 概要 |
|---|---|---|---|
| 1 | `act_memory_matching` | stage2-3 | 語彙カードの神経衰弱 |
| 2 | `act_vocab_bingo` | stage2-3 | 語彙ビンゴ |
| 3 | `act_whiteboard_categorize` | stage2-3 | 語彙の仲間分け |
| 4 | `act_grammar_auction` | stage3 | 正しい文を競り落とすゲーム |
| 5 | `act_battleship` | stage3-4 | 文型を使った戦艦ゲーム |
| 6 | `act_person_guessing_quiz` | stage3-4 | 人物当てクイズ |
| 7 | `act_personality_quiz` | stage3-4 | 性格診断風クイズ |
| 8 | `act_hajimemashite_conversation` | stage4-5 | 自己紹介会話ロールプレイ |

**Step 3 完了の定義（CLAUDE.md より）：**
- 上記8件すべてでplaceholderが消え、実際に動くUIが表示される
- `act_online_roulette` と同様に lesson_NN.json のデータを読んで自動生成される
- Stage 1 既知9問題が再発していない

**実装方針（CLAUDE.md より）：**
- `act_online_roulette` の実装を参考にする
- UI に使うデータは `lesson_NN.json`（vocabulary・patterns・examples）と `master_image_registry.json` から読む
- デザインは `design_tokens.json` の CSS 変数に従う
- 教師向け情報（teacherTip 等）は学習者画面には含めない
- データ駆動で実装する。特定の課にハードコードしない
- 1件実装するごとに session_001.json でテストして動作確認してから次に進む

---

## 次チャットへのアップロード必須ファイル

- **この資料**（`lesson_master_rules_handoff_v18.md`）
- **`CLAUDE.md`**（Step 3の定義・実装方針が記載）
- **`Plan_v1_1.md`**（完了済み・参照用）

---

## 次チャットでClaude Codeに渡す指示

```
Step 3 を開始してください。
CLAUDE.md の「Step 3: アクティビティUI実装」セクションを読んでから着手してください。

未実装8件を優先順位順に1件ずつ実装してください：
1. act_memory_matching
2. act_vocab_bingo
3. act_whiteboard_categorize
4. act_grammar_auction
5. act_battleship
6. act_person_guessing_quiz
7. act_personality_quiz
8. act_hajimemashite_conversation

各件の実装後に session_001.json で動作確認してから次に進んでください。
実装参考：act_online_roulette の既存実装を参照してください。
```

---

*資料バージョン：v18（2026-05-15）*
*前バージョン：lesson_master_rules_handoff_v17.md*
