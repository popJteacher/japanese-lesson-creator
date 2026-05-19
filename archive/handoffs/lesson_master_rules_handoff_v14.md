# 課マスター作成ルール 引き継ぎ資料 v14
**作成日：2026-05-15**
**前バージョン：lesson_master_rules_handoff_v13.md**
**このチャットの目的：残課題F・G・H完了 / アクティビティUI実装 / lesson_01完成宣言 / ワークフロー全体整理**

---

## このチャットで完了・確定したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| 残課題F：prerequisitePatterns 値入れ | 9件にgrammarConceptID設定・grammar-agnostic 16件確定 | ✅ 完了 |
| 残課題G：usedInLesson1 廃止 | 全57件から削除・24件をvalidatedForLessons:[1]に移行 | ✅ 完了 |
| 残課題H：補助フィールド公式化 | _meta.taxonomyDefinition.optionalFieldsにA案で定義 | ✅ 完了 |
| activity_catalog v1.7 完成 | 上記3件を一括実装・lastModified 2026-05-15 | ✅ 完了 |
| 素材生成ワークフロー確認 | セッション確定時に一括生成・config問題なし | ✅ 確定 |
| 8件アクティビティUI実装 | Claude Codeが実装・E2E検証完了 | ✅ 完了 |
| CLAUDE.md / README.md 更新 | Step3追加・activity_catalog v1.7情報追記 | ✅ 完了 |
| **lesson_01 完成宣言** | 全ブロッカー解消・2026-05-15付けで宣言 | ✅ **完了** |

---

## v13 残課題の解消状況

| 残課題 | 内容 | 状態 |
|---|---|---|
| 残課題B | lesson_01 完成宣言 | ✅ **完全解消**（2026-05-15宣言） |
| 残課題F | prerequisitePatterns 値入れ | ✅ **完全解消** |
| 残課題G | usedInLesson1 廃止 | ✅ **完全解消** |
| 残課題H | 補助フィールド公式化 | ✅ **完全解消** |
| 残課題D | Skill 設計・実装 | **未着手**（次チャット以降） |
| 残課題E | lesson_02 照合・作成 | **未着手**（残課題D完了後） |

---

## ⚠️ 残課題（次チャット以降で対応）

### 残課題D：Skill 設計・実装（最優先）

**前提条件：** lesson_01 完成宣言（✅ 完了）

```
STEP 1: PDF「文型」セクション読み取り → アンカー例文確定
STEP 2: PDF「教え方の例N」読み取り → 素材・語彙・依存関係抽出
STEP 3: PDF「活動例」「プラスα」「注意」読み取り → catalog エントリ設計
STEP 4: lesson_NN.json 生成
STEP 5: 自動バリデーション（ルールA-1〜A-4・アンカー例文・vocabulary整合性）
```

**ゴールデンサンプル：** lesson_01.json（formatVersion 2.7・lessonVersion 1.0）

---

### 残課題E：lesson_02 照合・作成

**前提条件：** 残課題D（Skill実装）完了後

- lesson_02.json は現在 lessonVersion 1.0（未照合状態）
- Deep Research まとめ資料 v1.1 の Section 6.1 に lesson_02 相当の活動一覧記録済み
- lesson_02 の `required` アクティビティUI実装も別途必要（lesson_01の8件はlesson_01限定）

---

### 残課題I：session_001.json の更新（小作業）

**前提条件：** なし（すぐ実施可能）

現在の session_001.json は旧フォーマット（`mainActivities` フィールドなし）。
フォームUIで第1課 p1・p2・p3 を選択し、アクティビティを1件選択して生成したsession JSONを `data/session_001.json` として差し替え、`build-embedded-data.py` は不要（session は変換しない）。

---

## このチャットで確定した設計・方針

### 素材生成ワークフロー

```
セッション作成（フォームUI）
  ├─ lesson・学習者・アクティビティを同時に選択
  └─ 「教材を生成」→ 4ファイル一括生成
       ├─ スライドHTML ✅
       ├─ 宿題HTML ✅
       ├─ アクティビティHTML ✅（hasRequiredActivity=true時）
       └─ 教案docx ✅
```

**確定事項：**
- セッション確定時にアクティビティも同時選択・一括生成（2段階生成は不要）
- config は現状すべてフォールバック動作で実用上問題なし
- lesson_NN.json / activity_catalog.json にデータがある限り、UIは一度実装すれば以降自動生成

### アクティビティUI実装方針（確定）

| 方針 | 内容 |
|---|---|
| ファイル構造 | `src/generators/activity_blocks/` 配下に各活動1ファイル |
| 共通ヘルパー | `_shared.js`（flattenAllVocab / getVocabByPattern / getCharacterCards 等） |
| データ駆動 | 特定の課にハードコードしない。lesson_NN.json / registry 依存 |
| 教師情報 | teacherTip / teacherNote は学習者画面HTMLに含めない |
| 不足データ | generator内でlesson vocabularyから動的生成（personality_quiz質問・grammar_auction誤文） |

### 実装済みアクティビティ（lesson_01対応・全件）

| ID | stage | 実装状況 |
|---|---|---|
| act_online_roulette | stage4 | ✅ 実装済み（既存） |
| act_memory_matching | stage2-3 | ✅ 実装済み（本日） |
| act_vocab_bingo | stage2-3 | ✅ 実装済み（本日） |
| act_whiteboard_categorize | stage2-3 | ✅ 実装済み（本日） |
| act_grammar_auction | stage3 | ✅ 実装済み（本日） |
| act_battleship | stage3-4 | ✅ 実装済み（本日） |
| act_person_guessing_quiz | stage3-4 | ✅ 実装済み（本日） |
| act_personality_quiz | stage3-4 | ✅ 実装済み（本日） |
| act_hajimemashite_conversation | stage4-5 | ✅ 実装済み（本日） |

lesson_02以降で新たな `required` 活動が追加された場合は、同様に `activity_blocks/` に追加実装する。

---

## 現在のワークフロー全体像

### レイヤー構造

```
【課マスター層】
  lesson_01.json ✅ 完成宣言済み（2026-05-15）
  lesson_02.json ⚠️ 未照合（lessonVersion 1.0・残課題E）
  lesson_03以降  ❌ 未作成（Skill未設計・残課題D）
  activity_catalog.json ✅ v1.7完成

【セッション層】
  フォームUI ✅ 動作中（Step 2完了）
  session_001.json ⚠️ 旧フォーマット（mainActivities未設定・残課題I）

【素材生成層】
  スライドHTML ✅
  宿題HTML ✅
  教案docx ✅
  アクティビティHTML ✅（lesson_01の全required活動対応済み）
```

### マイルストーン

| マイルストーン | 状態 |
|---|---|
| lesson_01 単体でのツール完成 | ✅ **達成（2026-05-15）** |
| lesson_02 対応 | 🔲 残課題D・E完了後 |
| 複数課対応（lesson_03以降） | 🔲 Skill実装後 |

---

## activity_catalog スキーマ（v1.7確定）

```json
{
  "id": "act_xxx",
  "name": "日本語名",
  "nameEn": "English Name",
  "stage": ["stage1〜5"],
  "level": ["N5", ...],
  "skillFocus": ["speaking", "listening", "reading", "writing"],
  "activityType": ["tpr", "game", "roleplay", "task", "drill", "quiz",
                   "discussion", "presentation", "feedback_technique"],
  "interactionPattern": "pair",
  "prerequisitePatterns": ["grammarConceptID", ...],
  "validatedForLessons": [1, 2, ...],
  "contentRequirement": {"judgment": "required|not_needed|slide_alt", "reason": "..."},
  "duration": "X-Ymin",
  "preparation": "...",
  "tools": [...],
  "description": "...",
  "procedure": [...],
  "materials": [...],
  "stt_ttt_ratio": "STT X%",
  "applicableLessons": "...",
  "lesson1Note": "...",
  "source": "...",
  "playerExplanation": {"ja": "...", "en": "..."},
  "teacherTip": "...",
  "defaultMaterialTypes": [...]
}
```

**廃止フィールド（v1.7）：** `usedInLesson1`（→ validatedForLessonsに統合）
**任意フィールド（v1.7公式化）：** `caution` / `variations` / `plusAlpha` / `conversationModel` / `textbookOrigins`

---

## grammarConcept ID 体系（確定済み）

### lesson_01 確定分
| grammarConceptID | 文型 | lesson_01 patternId |
|---|---|---|
| `noun_predicate_affirmative` | 〜は〜です | p1 |
| `noun_predicate_question` | 〜ですか／はい・いいえ | p2 |
| `noun_no_affiliation` | 〜の〜です（所属） | p3 |

### lesson_02 確定分
| grammarConceptID | 文型 | lesson_02 patternId |
|---|---|---|
| `kosoado_pronoun_thing` | これ・それ・あれ | p1 |
| `interrogative_what` | 何ですか | p2 |
| `noun_no_possession` | 〜の〜です（所有） | p3 |
| `interrogative_which_thing` | どれ | p4 |
| `kosoado_attributive` | この・その・あの+N | p5 |
| `interrogative_which_attributive` | どの+N | p6 |

### 暫定予約
| grammarConceptID（暫定） | 対応文型 |
|---|---|
| `existence_location` | 〜に〜があります／います |
| `time_expression_clock` | 〜時〜分です |
| `amount_expression` | 〜円です |
| `vocabulary_inquiry_language` | 〜語で〜は何ですか |
| `te_form_request` | 〜てください |
| `desire_expression` | 〜たいです |
| `potential_expression` | 〜ができます |

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / lessonVersion 1.0 | ✅ **完成宣言済み（2026-05-15）** |
| `lesson_02.json` | lessonVersion 1.0 | ⚠️ 未照合 |
| `activity_catalog.json` | **v1.7（57件）** | ✅ 完成 |
| `session_001.json` | formatVersion 1.0 | ⚠️ 旧フォーマット（残課題I） |
| `master_image_registry.json` | v1.4 | 変化なし |
| `deep_research_integration_summary_v1.1.md` | v1.1 | ナレッジ登録済み |
| `CLAUDE.md` | Step3追記済み | ✅ 更新済み（2026-05-15） |
| `README.md` | Step2完了・Step3進捗追記済み | ✅ 更新済み（2026-05-15） |

### ツール側（japanese-lesson-creator）

| ファイル | 状態 |
|---|---|
| `src/generators/activity_html.js` | ✅ ハブ化済み |
| `src/generators/activity_blocks/_shared.js` | ✅ 新規作成済み |
| `src/generators/activity_blocks/roulette.js` | ✅ 移植済み |
| `src/generators/activity_blocks/memory_matching.js` | ✅ 実装済み |
| `src/generators/activity_blocks/vocab_bingo.js` | ✅ 実装済み |
| `src/generators/activity_blocks/whiteboard_categorize.js` | ✅ 実装済み |
| `src/generators/activity_blocks/grammar_auction.js` | ✅ 実装済み |
| `src/generators/activity_blocks/battleship.js` | ✅ 実装済み |
| `src/generators/activity_blocks/person_guessing_quiz.js` | ✅ 実装済み |
| `src/generators/activity_blocks/personality_quiz.js` | ✅ 実装済み |
| `src/generators/activity_blocks/hajimemashite_conversation.js` | ✅ 実装済み |
| `data/activity_catalog.json` | ✅ v1.7に更新・build済み |
| `data/session_test.json` | ✅ 8活動テスト用・新規作成済み |
| `data/session_001.json` | ⚠️ 旧フォーマットのまま（残課題I） |

---

## 守るべきルール（v14・変更なし）

| ルール | 内容 |
|---|---|
| A-1 | 例文はPDF照合してから書く（照合なしに例文を作らない） |
| A-2 | 登場人物を勝手に作らない |
| A-3 | 教科書の固有名詞は変えない（東西大学・リンさん等） |
| A-4 | 「教え方の例N」で使う素材・キャラクターが、それより前の手順で導入済みかを確認する |
| B-9 | 活動例の必須フィールド（id / name / stage / skillFocus / activityType / prerequisitePatterns / procedure / teacherTip 等） |
| NEW | catalogの `prerequisitePatterns` は必ず grammarConcept ID を使う（p1/p2/p3等の課ローカルIDは使わない） |
| NEW | catalog新規追加時は `skillFocus` + `activityType` + `interactionPattern` + `validatedForLessons` + `contentRequirement` を必ず設定する |
| NEW | `usedInLesson1` は廃止済み。使用禁止 |
| NEW | アクティビティUIは特定の課にハードコードしない。lesson_NN.json / registry からデータ駆動で生成する |

---

## 次チャットの作業順序

```
1. 残課題I（小作業）: session_001.json を新フォーマットに更新
   → フォームUIで第1課 全文型 + アクティビティ1件を選択して生成
   → data/session_001.json として保存

2. 残課題D: Skill 設計・実装（メイン作業）
   → lesson_01.json をゴールデンサンプルとして使用
   → PDF読み取り → lesson_NN.json 生成の5ステップ

3. 残課題E: lesson_02 照合・作成
   → Skill を使って作成
   → Deep Research まとめ資料 v1.1 Section 6.1 の指示語関連アクティビティ4件も追加
   → lesson_02 の required アクティビティUIも別途Claude Codeで実装
```

---

## 次チャットへのアップロード必須ファイル

- この資料（`lesson_master_rules_handoff_v14.md`）
- `activity_catalog.json`（v1.7・57件）※ 変更があった場合のみ

---

*資料バージョン：v14（2026-05-15）*
*前バージョン：lesson_master_rules_handoff_v13.md*
