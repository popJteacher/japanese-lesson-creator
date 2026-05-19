# 課マスター作成ルール 引き継ぎ資料 v19
**作成日：2026-05-15**
**前バージョン：lesson_master_rules_handoff_v18.md**
**このチャットの追加内容：Step 3完了・宿題HTML仕様確定・各種バグ修正・命名規則統一**

---

## このチャットで完了したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| Step 3: アクティビティUI 8件実装 | act_memory_matching / act_vocab_bingo / act_whiteboard_categorize / act_grammar_auction / act_battleship / act_person_guessing_quiz / act_personality_quiz / act_hajimemashite_conversation | ✅ |
| 複数アクティビティ対応（タブ形式） | mainActivities[] 2件以上でタブ切替HTML生成 | ✅ |
| アクティビティ英語トグル修正 | 全8活動で英語テキストにen-textクラス付与 | ✅ |
| アクティビティふりがな修正 | Stage 1 #3/#4 CSS違反修正・全漢字にruby付与 | ✅ |
| アクティビティゲームロジック修正 | whiteboard部分一致バグ・grammar_auction二重呼び等 | ✅ |
| 宿題HTML仕様確定・全面実装 | practiceImageSource分岐・音声ボタン・画像ペア対応 | ✅ |
| 宿題p3ペア生成修正 | 例文パースによる正しいキャラクター×建物ペア生成 | ✅ |
| 宿題ヒント表示トグル | 練習問題のラベルshow/hide切替ボタン追加 | ✅ |
| master_image_registry 命名規則統一 | vocab_* 18件をword_*にリネーム（v1.8） | ✅ |
| lesson_01.json practiceImageSource追加 | p1/p2/p3それぞれに画像ソース種別を定義（v2.11.4） | ✅ |
| スライドのアクティビティ枚数バグ修正 | mainActivities複数時も1枚のみ生成 | ✅ |

---

## v18からの変更サマリー

### activity_html.js（全面実装・v0.3-multi-tabs）

8件のアクティビティを専用UIとして実装（データ駆動・全課共通）：

| ID | 活動名 | 実装内容 |
|---|---|---|
| `act_memory_matching` | 神経衰弱 | 語彙JA/ENカードのペアマッチ。マッチ後「〜は〜です」文生成 |
| `act_vocab_bingo` | 語彙ビンゴ | 3×4グリッド。先生パネル（読み上げ用）付き |
| `act_whiteboard_categorize` | 語彙の仲間分け | ドラッグ＆ドロップ＋クリックでカテゴリ分類。採点ボタン |
| `act_grammar_auction` | 文法オークション | 1000コインで正文に賭ける。誤文→コイン没収 |
| `act_battleship` | 戦艦ゲーム | 職業(Y)×国籍(X)グリッド。「〜は〜ですか」で攻撃 |
| `act_person_guessing_quiz` | 人物当てクイズ | 「〜ですか」質問でキャラクターを当てる |
| `act_personality_quiz` | 性格診断クイズ | Yes/No回答→タイプ診断→自己紹介文テンプレ |
| `act_hajimemashite_conversation` | はじめまして会話 | 会話モデル表示＋名前/職業の自由記入欄 |

**複数アクティビティ対応**：
- `mainActivities[]` 2件以上 → タブ切替HTMLを自動生成（`buildFullPageMulti()`）
- 1件のみ → タブ非表示（従来と同じ見た目）
- v1.0形式 `session.activity.selectedId` にも後方互換対応

**インターフェイス**：
```javascript
buildActivityHtml(session, lessonDataMap, imageRegistry, activityCatalog)
// lessonDataMap = { 1: lesson_01_data, 2: lesson_02_data, ... }
```

**既知の未実装（画像表示）**：
- `imageRegistry` は引数で受け取るが `buildActivityBlock()` 以降に渡していない
- 全アクティビティがテキストベースのため現状は機能する
- 画像生成フェーズ（GASパイプライン完了後）に以下を実施すること：
  - imageRegistry を各 build*() 関数に渡す
  - act_person_guessing_quiz: キャラクター画像を表示
  - act_memory_matching: 語彙画像をカードに追加
  - act_vocab_bingo: 語彙画像をマスに追加

---

### homework_html.js（v0.2 全面実装）

**確定した宿題の構造**：
```
1. ヘッダー（課名・日付・学習者名・名前記入欄）
2. 語彙チェック（全語彙・1:1画像・ふりがな・英訳）
3. パターンブロック × 教えるpattern数
   a) canDo表示（英語トグル対応）
   b) 例文を読んでみよう（例文 + 16:9画像 + 音声ボタン）
   c) 練習問題（絵を見て文を完成させよう）← practiceImageSourceで分岐
4. 振り返りチェックリスト（canDoチェックボックス）
```

**練習問題の画像タイプルール**（lesson_NN.json の `patterns[].practiceImageSource` で制御）：

| practiceImageSource | 画像 | テンプレート形式 | 空欄数 |
|---|---|---|---|
| `"vocabulary"` | 語彙1:1画像（word_*） | わたしは＿です。等 | テンプレート依存 |
| `"namedCharacters"` | キャラクターカード（char_*） | ＿さんは＿です。等 | テンプレート依存 |
| `"namedCharacters+vocab"` | キャラクター＋建物ペア | ＿さんは＿の＿です。 | 3 |

**lesson_01.json での設定**：

| pattern | practiceImageSource | practiceTemplates |
|---|---|---|
| p1 | `"namedCharacters"` | `"＿＿＿さんは＿＿＿です。"` |
| p2 | `"namedCharacters"` | `"＿＿＿さんは＿＿＿ですか。"` 他 |
| p3 | `"namedCharacters+vocab"` | `"＿＿＿さんは＿＿＿の＿＿＿です。"` |

**p3ペア生成ロジック**：
- `pattern.examples[].sentence` を正規表現でパース
- `RE_AFFIL = /^(\S+?)さんは(?:東西)?(\S+?)の(\S+?)です。?$/`
- characterName → namedCharacters[] を逆引き → char.imageId
- buildingWord → vocabulary.byPattern.p3.words[] を逆引き → word.imageId
- **第1課の正しいペア**：タノム+病院 / 鈴木+学校 / キム+銀行 / リン+大学 / キム+デパート

**音声ボタン**：
- audioUrl あり → `🔊` 押下可
- audioUrl null → `🔇` グレーアウト（音声生成後に自動有効化）

**ヒント表示トグル**：
- ツールバーに「💡 ヒントを隠す / 💡 ヒントを見る」ボタン
- `body.hide-labels .hint-cell-label { display: none }`
- デフォルト：ラベル表示

**インターフェイス（slide_html.jsと統一）**：
```javascript
// ctx から受け取る
ctx.session        // session_NN.json
ctx.lessonsByNo    // { 1: lesson_01, 2: lesson_02, ... }
ctx.imageRegistry  // master_image_registry.json
ctx.audioRegistry  // master_audio_registry.json（main.jsで追加）
```

**main.js の変更**：
- `loadAudioRegistry()` を新設
- `ctx.audioRegistry` として全ジェネレーターに渡す

---

### master_image_registry.json（v1.8）

**命名規則統一**：
- `vocab_*` プレフィックス 18件 → `word_*` にリネーム完了
- `vocab_*` 残存ゼロ
- `ex_L*_*`（28件）・`char_*`（6件）は変更なし

**現在のエントリ構成**：
| カテゴリ | 件数 |
|---|---|
| `word_*`（語彙画像） | 35件 |
| `char_*`（キャラクター画像） | 6件 |
| `ex_L01_*`（例文画像） | 28件 |
| その他（world_map 等） | 2件 |
| **合計** | **71件** |

**画像生成状況**：
- lesson_01 関連：全URLが Google Drive URL で解決済み
- lesson_02 想定語彙（word_時計 等 14件）：URLあり（生成済み）

---

### lesson_01.json（formatVersion 2.7 / v2.11.4）

v18からの変更点：
- `patterns[].practiceImageSource` を全パターンに追加
- p1 practiceImageSource: `"namedCharacters"` に変更（旧: `"vocabulary"`）
- p1 practiceTemplates: `"＿＿＿さんは＿＿＿です。"` に変更
- p3 practiceTemplates: `"＿＿＿さんは＿＿＿の＿＿＿です。"` に変更

---

## 現在のファイルバージョン

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / v2.11.4 | ✅ 完成 |
| `lesson_02.json` | lessonVersion 1.0 | ⚠️ canDoEn未追加・practiceImageSource未追加 |
| `activity_catalog.json` | v1.7 | ✅ |
| `intro_activity_catalog.json` | v1.0（3件） | ✅ |
| `session_001.json` | formatVersion 2.0 | ✅ |
| `master_image_registry.json` | v1.8 | ✅ vocab_*残存ゼロ |
| `master_audio_registry.json` | v1.0 | 🔄 全URLがnull（音声生成待ち） |
| `ruby_dictionary.js` | 131エントリ | ✅ 第1課カバー完了 |
| `slide_html.js` | — | ✅ 全8type実装済み |
| `activity_html.js` | v0.3-multi-tabs | ✅ 全9活動実装済み |
| `homework_html.js` | v0.2 | ✅ practiceImageSource対応済み |

---

## スライド仕様 確定済み全8type（変更なし）

| type | 状態 |
|---|---|
| `title`（表紙） | ✅ |
| `intro_slide`（今日の目標） | ✅（canDoEn対応済み） |
| `intro_activity`（導入・3 layout） | ✅ |
| `pattern`（文型・canDoEn対応） | ✅ |
| `example`（例文・16:9アンカー＋4列） | ✅ |
| `practice`（練習・空欄ボックス） | ✅ |
| `main_activity`（アクティビティの時間） | ✅（複数選択時は活動名を1枚に列挙） |
| `wrapUp`（まとめ・canDo＋アンカー例文） | ✅ |

---

## 全課共通の新ルール（v19追加）

| ルール | 内容 |
|---|---|
| NEW | `patterns[].practiceImageSource` は全課のJSONで必須フィールド。値: `"vocabulary"` / `"namedCharacters"` / `"namedCharacters+vocab"` |
| NEW | practiceImageSource が未設定の場合は `"vocabulary"` として扱われる（後方互換） |
| NEW | p3（所属）パターンは `"namedCharacters+vocab"` を指定し、practiceTemplatesに3空欄テンプレートを設定すること |
| NEW | p2（疑問文）パターンは `"namedCharacters"` を指定する |
| 継続 | `patterns[].canDoEn` は必須フィールド（v18から） |
| 継続 | 語彙imageIdは `word_*` 命名規則（vocabulary 1:1画像） |
| 継続 | 新しい課を追加するときは `ruby_dictionary.js` に語彙を追加する |

---

## 残課題（次フェーズ以降）

| 課題 | 内容 | 優先度 | タイミング |
|---|---|---|---|
| lesson_02.json 整備 | canDoEn追加・practiceImageSource追加・imageId確認 | 中 | 次フェーズ |
| 画像URL設定 | GASパイプライン経由で画像生成 → imageUrlを埋める | 高 | 画像生成フェーズ |
| 音声生成 | master_audio_registry.json 全エントリがnull | 高 | 音声フェーズ（別途進行中） |
| アクティビティ画像表示 | imageRegistryをbuild*()関数に渡す＋各活動の画像表示実装 | 中 | 画像生成フェーズ完了後 |
| デザイン調整 | 例文グリッド下線不揃い・行間等の細部 | 低 | Step 3完了後 |
| lesson_02.json 照合 | 第2課画像プロンプト・例文整合性 | 中 | 次フェーズ |

---

## 設計上の重要な判断事項（このチャットで確定）

### 宿題の練習問題設計
- **わたしは〜ではなくキャラクター文型を使う**：第1課の例文は全てnamed_charactersを使っているため、宿題練習問題も同様にする
- **語彙チェックと練習問題は目的が異なる**：語彙チェック=語彙確認（ラベルあり）、練習問題=文型練習（ラベルはヒントとして表示可・トグル可）
- **p3練習問題の画像ペアはexamplesから生成**：namedCharactersと建物語彙の単純zipではなく、p3例文をパースして正しいキャラクター×建物の組み合わせを使う

### アクティビティの画像
- 現時点では全アクティビティがテキストベースで機能する
- imageRegistryは「接続済みだが未使用」の状態（意図的な後回し）
- 画像生成フェーズ完了後に接続を行う

### 複数アクティビティ選択
- mainActivities[] 複数 → 1つのHTMLにタブ形式で統合（B案採用）
- スライドの main_activity は複数選択時も1枚のみ生成（活動名を列挙）

---

## 次チャットへのアップロード必須ファイル

- **この資料**（`lesson_master_rules_handoff_v19.md`）
- **`CLAUDE.md`**

---

## 次チャットでClaude Codeに渡す指示候補

### 【A】lesson_02.json 整備（優先度：中）
```
lesson_02.json を lesson_01.json v2.11.4 の仕様に合わせて整備してください。

1. 全パターンに canDoEn を追加（英語で「Can ～」形式）
2. 全パターンに practiceImageSource を追加
   - 疑問文パターン → "namedCharacters"
   - 所属パターン → "namedCharacters+vocab"
   - それ以外 → 内容に応じて判断
3. practiceTemplates を対応する文型に合わせて更新
   （第1課の「さんは〜」形式に合わせる）
4. 全語彙の imageId を word_* 形式で確認・未設定は追加
5. namedCharacters[] が存在しない場合は適切なキャラクターを追加
```

### 【B】画像生成フェーズ対応（優先度：高・GASパイプライン完了後）
```
GASパイプラインで画像が生成されたら以下を実施してください。

1. master_image_registry.json の全 imageUrl が埋まっていることを確認
2. activity_html.js の imageRegistry 接続：
   - buildActivityBlock() に imageRegistry を引数として渡す
   - act_person_guessing_quiz: キャラクター画像を表示
   - act_memory_matching: 語彙画像をカードに追加
   - act_vocab_bingo: 語彙画像をマスに追加
3. Stage 1 既知9問題の再確認
```

---

## ブラウザ動作確認で確認済みの内容（このチャット）

| # | 確認項目 | 結果 |
|---|---|---|
| 1 | アクティビティ8件が全てプレースホルダーなしで表示 | ✅ |
| 2 | 複数アクティビティ選択でタブ切替UI表示 | ✅ |
| 3 | ふりがな・英語トグルが全アクティビティで動作 | ✅ |
| 4 | 宿題語彙チェック：全17語の画像が表示 | ✅ |
| 5 | 宿題p1練習：キャラクターカード＋2空欄テンプレート | ✅ |
| 6 | 宿題p2練習：キャラクターカード＋2空欄テンプレート | ✅ |
| 7 | 宿題p3練習：正しいキャラクター×建物ペア＋3空欄 | ✅ |
| 8 | 宿題ヒント表示トグル | ✅ |
| 9 | Stage 1 既知9問題（スライド側・宿題側）再発なし | ✅ |
| 10 | Stage 7-2 スライド生成 12/12 PASS | ✅ |

---

## 未解決のデザイン問題（後フェーズで対応）

| 問題 | 詳細 | 優先度 |
|---|---|---|
| 例文グリッドの下線不揃い | 一部カードに助詞下線なし | 低 |
| 下線付き文章の行間詰まり | 下線でテキストがはみ出す | 低 |
| 導入スライド指示文の折り返し | 長文が上端でクリップされることがある | 低 |
| p3パターンボックス上部クリップ | スクロール位置によっては見切れる | 低 |
| lesson_01 p3例文の重複 | キムさんが銀行員とデパート員の両方（課マスター設計の問題） | 中（次フェーズで検討） |

---

*資料バージョン：v19（2026-05-15）*
*前バージョン：lesson_master_rules_handoff_v18.md*
