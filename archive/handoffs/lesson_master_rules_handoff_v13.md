# 課マスター作成ルール 引き継ぎ資料 v13
**作成日：2026-05-14**
**前バージョン：lesson_master_rules_handoff_v12.md**
**このチャットの目的：Deep Research統合・activity_catalog v1.6化・スキーマ整備**

---

## このチャットで完了・確定したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| Deep Research 4件の精査・洗い直し | R1〜R4 全内容を再読・不正確箇所の修正・除外判断 | ✅ 完了 |
| activity_catalog v1.6 | 28件→57件・スキーマ統一 | ✅ 完了 |
| purpose → skillFocus/activityType 分離 | 全57件に適用 | ✅ 完了 |
| interactionPattern フィールド追加 | 全57件に "pair" を設定 | ✅ 完了 |
| prerequisitePatterns grammarConcept化 | 旧p1/p2/p3 → noun_predicate_affirmative等 | ✅ 完了 |
| 新規29件のアクティビティ追加 | R3-TPR:7 / R3-ゲーム:8 / R3-TBLT:6 / R2:6 / R1:2 | ✅ 完了 |
| act_google_maps_tour lesson_02移管 | prereq=[existence_location], usedInLesson1:false | ✅ 完了 |
| act_passport_control 仕様修正 | 年齢欄なし（数字未習）をlesson1Noteに明記 | ✅ 完了 |
| _meta taxonomyDefinition 追加 | skillFocus/activityType/interactionPattern/stageの公式定義 | ✅ 完了 |
| まとめ資料 v1.1 作成 | catalog v1.6に同期（purpose→skillFocus/activityType） | ✅ 完了 |
| カタログ包括監査（18項目） | 全項目パス | ✅ 完了 |

---

## v12 残課題の解消状況

| 残課題 | 内容 | 状態 |
|---|---|---|
| 残課題A | activity_catalog v1.5化（スキーマ変更・2件追加） | ✅ **完全解消**（v1.6で超過達成） |
| 残課題B | lesson_01 完成宣言 | ⚠️ **保留中**（後述） |
| 残課題C | Deep Research 実施・catalog拡充 | ✅ **完全解消** |
| 残課題D | Skill 設計・実装 | 未着手 |
| 残課題E | lesson_02 照合・作成 | 未着手 |

---

## ⚠️ 残課題（次チャット以降で対応）

### 残課題B：lesson_01 完成宣言

**前提条件：** 残課題F・G完了後に宣言

**ブロッカー1（残課題F）：** 既存18件（＋新規grammar-agnostic以外）の `prerequisitePatterns` 値入れが未完
**ブロッカー2（残課題G）：** `usedInLesson1` と `validatedForLessons` の重複解消が未完
**ブロッカー3：** `lesson_01.flow[main_act_1].skipped: true` のまま（要確認：lesson_01完成の定義として解消が必要か？）

```
lesson_01.flow[main_act_1]:
  activityId: "act_hajimemashite_conversation"  ← カタログに存在 ✅
  skipped: true  ← 教師がsessionで選択する前の状態（設計上は正常？要確認）
```

---

### 残課題F：activity_catalog Step 2 — prerequisitePatterns 値入れ

**前提条件：** なし（すぐ実施可能）

現在 `prerequisitePatterns: []`（空）の40件のうち、値を入れるべきものを特定・入力する。

#### 入れるべきもの（lesson_01語彙前提の活動）

| ID | 推奨値 | 理由 |
|---|---|---|
| act_picture_card_vocab_intro | ["noun_predicate_affirmative"] | p1導入アクティビティ |
| act_qa_pattern_intro | ["noun_predicate_affirmative", "noun_predicate_question"] | p1→p2の橋渡し |
| act_attribute_modeling_intro | ["noun_predicate_affirmative", "noun_predicate_question", "noun_no_affiliation"] | p1/p2/p3統合 |
| act_three_hint_quiz | ["noun_predicate_affirmative", "noun_predicate_question"] | Yes/No質問で人物当て |
| act_shiritori_themed | [] | 語彙のみ・文法非依存でOK |
| act_online_roulette | [] | configurableFields設計のため文法を固定しない |
| act_culture_quiz | [] | 文化知識・文法非依存 |
| act_quick_qa | ["noun_predicate_affirmative", "noun_predicate_question"] | Q&A練習のため |
| act_word_association | [] | 語彙のみ |
| act_jlpt_time_attack | [] | テスト対策・文法非依存 |
| act_info_gap_picture | ["existence_location"] | 〜があります前提 |
| act_virtual_bg_tour | ["noun_predicate_affirmative"] | 「ここは〜です」程度の初歩でも可 |
| act_news_discussion | [] | N3以上・grammarConcept未定義 |
| act_two_min_presentation | ["noun_predicate_affirmative", "noun_predicate_question"] | 最低限p1/p2 |
| act_business_roleplay | ["noun_predicate_affirmative", "noun_predicate_question", "noun_no_affiliation"] | p1/p2/p3全て |
| act_retelling | [] | N3以上・grammarConcept未定義 |

#### 空配列で確定（grammar-agnostic）

TPR活動全般・カメラゲーム・ホワイトボード操作等は `[]` のまま確定：
`act_gesture_tpr`, `act_animal_yoga_tpr`, `act_simon_says`, `act_simon_lies`, `act_finger_tpr`, `act_action_song`, `act_multistep_seq`, `act_treasure_hunt_tpr`, `act_recipe_mime`, `act_memory_matching`, `act_vocab_bingo`, `act_pictionary`, `act_odd_one_out`, `act_chat_kanji_quiz`, `act_realtime_error_correction`, `act_whiteboard_categorize`, `act_silhouette_quiz`, `act_background_change`

TBLT（lesson_02以降）: `act_draw_this`, `act_map_navigation`, `act_family_tree`, `act_daily_routine_task`, `act_monster_design`, `act_school_schedule` → 各lesson確定後に入力。

---

### 残課題G：activity_catalog Step 3 — usedInLesson1 廃止

**前提条件：** 残課題F 完了後

`usedInLesson1` フィールドを廃止し `validatedForLessons` に一本化する。

```
作業内容：
1. 全57件で usedInLesson1:true の活動を validatedForLessons に [1] を追加
2. usedInLesson1 フィールドを全件から削除
3. lesson1Note フィールドは引き続き保持（有用な情報を含むため）
4. _meta.changes に v1.7 として記録
```

現状：`usedInLesson1 vs validatedForLessons 不一致: 24件`

---

### 残課題H：補助フィールドの扱い決定（中優先度）

`caution` / `variations` / `plusAlpha` が handoff v12 由来の2件のみに存在し、スキーマ定義がない。

| 選択肢 | 内容 |
|---|---|
| A）任意フィールドとして公式化 | _meta に定義を追加。新規追加時の記入ルールを明記 |
| B）teacherTip に統合・削除 | 2件の内容をteacherTipに移してフィールド削除 |

act_hajimemashite_conversation と act_person_guessing_quiz にのみ存在。どちらの値も有用なため**A案（任意フィールド公式化）推奨**。

---

### 残課題D：Skill 設計・実装

**前提条件：** 残課題B（lesson_01 完成宣言）完了後

```
STEP 1: PDF「文型」セクション読み取り → アンカー例文確定
STEP 2: PDF「教え方の例N」読み取り → 素材・語彙・依存関係抽出
STEP 3: PDF「活動例」「プラスα」「注意」読み取り → catalog エントリ設計
STEP 4: lesson_NN.json 生成
STEP 5: 自動バリデーション（ルールA-1〜A-4・アンカー例文・vocabulary 整合性）
```

---

### 残課題E：lesson_02 照合・作成

**前提条件：** 残課題D（Skill実装）完了後

lesson_02 は現在 `lessonVersion 1.0`（未照合状態）。
Deep Research まとめ資料 v1.1 の Section 6.1 に lesson_02 相当の活動一覧（指示語・p1〜p6）が記録済み。

---

## 確定した設計内容

### activity_catalog スキーマ（v1.6確定）

```json
// 必須フィールド（全57件）
{
  "id": "act_xxx",
  "name": "日本語名",
  "nameEn": "English Name",
  "stage": ["stage1〜5 のいずれか"],
  "level": ["N5", "N4", ...],
  "skillFocus": ["speaking", "listening", "reading", "writing"],
  "activityType": ["tpr", "game", "roleplay", "task", "drill",
                   "quiz", "discussion", "presentation", "feedback_technique"],
  "interactionPattern": "pair",
  "prerequisitePatterns": ["grammarConceptID", ...],
  "validatedForLessons": [1, 2, ...],
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
  "contentRequirement": {"judgment": "...", "reason": "..."},
  "playerExplanation": {"ja": "...", "en": "..."},
  "teacherTip": "...",
  "defaultMaterialTypes": [...]
}
```

**廃止フィールド（v1.6）：** `purpose`（→ skillFocus + activityType に分離）
**廃止予定（v1.7）：** `usedInLesson1`（→ validatedForLessons に統合・残課題G）
**任意フィールド：** `caution` / `variations` / `plusAlpha` / `conversationModel` / `textbookOrigins`

---

### grammarConcept ID 体系（確定済み）

#### lesson_01 確定分
| grammarConceptID | 文型 | lesson_01 patternId |
|---|---|---|
| `noun_predicate_affirmative` | 〜は〜です | p1 |
| `noun_predicate_question` | 〜ですか／はい・いいえ | p2 |
| `noun_no_affiliation` | 〜の〜です（所属） | p3 |

#### lesson_02 確定分
| grammarConceptID | 文型 | lesson_02 patternId |
|---|---|---|
| `kosoado_pronoun_thing` | これ・それ・あれ | p1 |
| `interrogative_what` | 何ですか | p2 |
| `noun_no_possession` | 〜の〜です（所有） | p3 |
| `interrogative_which_thing` | どれ | p4 |
| `kosoado_attributive` | この・その・あの+N | p5 |
| `interrogative_which_attributive` | どの+N | p6 |

#### 暫定予約（後続課確定後に正式化）
| grammarConceptID（暫定） | 対応文型 |
|---|---|
| `existence_location` | 〜に〜があります／います |
| `time_expression_clock` | 〜時〜分です |
| `amount_expression` | 〜円です |
| `vocabulary_inquiry_language` | 〜語で〜は何ですか |
| `te_form_request` | 〜てください |
| `desire_expression` | 〜たいです |
| `potential_expression` | 〜ができます |

**命名規則：** `{品詞/構造}_{意味/機能}_{形}` 形式、小文字・アンダースコア区切り。

---

### taxonomy 定義（v1.6確定・_metaに記録済み）

#### skillFocus
`speaking` / `listening` / `reading` / `writing`

#### activityType
| 値 | 意味 | 件数 |
|---|---|---|
| `tpr` | 全身反応教授法 | 10 |
| `game` | ゲーム型（競争・達成要素あり） | 18 |
| `task` | タスク型（目標達成型） | 11 |
| `drill` | ドリル（機械的・有意味練習） | 7 |
| `roleplay` | 役を演じる | 4 |
| `quiz` | クイズ（当てる・選ぶ） | 4 |
| `discussion` | ディスカッション | 1 |
| `presentation` | プレゼンテーション | 1 |
| `feedback_technique` | 教師の指導技術 | 1 |

#### interactionPattern
`"pair"` = 全57件（1対1授業のため `"group"` は原則登録しない）

---

### 設計決定事項（このチャットで確定）

| # | 論点 | 決定 | 実装状態 |
|---|---|---|---|
| ① | act_passport_control | lesson_01簡略版（年齢欄なし）として登録 | ✅ v1.6で実装 |
| ② | act_google_maps_tour | lesson_02以降に移管 | ✅ v1.6で実装 |
| ③ | 1対1不向き3件 | 除外（走るディクテーション・ボード・レース・共通点探し） | ✅ v1.6で未追加 |
| ④ | prerequisitePatterns体系 | grammarConceptIDベース | ✅ v1.6で実装 |
| ⑤ | スキャフォールディング度 | 既存stageフィールドで代替（新フィールド不要） | ✅ 設計確定 |
| ⑥ | Research4追加メタデータ | interactionPatternのみ今すぐ追加、他は後日 | ✅ v1.6で実装 |

---

### Research 4 未実装メタデータ（申し送り）

推薦ロジック実装時（残課題D以降）に追加を検討：

| フィールド | 優先度 | 詳細 |
|---|---|---|
| `interactivityType` | 🟡 推薦実装時 | "active"/"expository"/"blended" |
| `cafFocus` | 🟡 推薦実装時 | "complexity"/"accuracy"/"fluency"（SLA CAF指標） |
| `cefrLevel` | 🟢 既存levelで代替中 | A1〜B1 |
| `bloomLevel` | 🟢 将来検討 | 記憶〜創造の6段階 |

詳細はまとめ資料 v1.1 Section 6.3参照。

---

### Research 1 後続課申し送り（34件）

lesson_02以降の課を作る際にprerequisitePatternsを確定して追加。
詳細リストはまとめ資料 v1.1 Section 6.1 を参照。

#### 概要
| 文型 | 件数 | 暫定grammarConcept |
|---|---|---|
| 指示語 これ・それ・あれ | 4件 | `kosoado_pronoun_thing` |
| 〜にあります／います | 4件+R2の3件 | `existence_location` |
| 〜時〜分です | 4件 | `time_expression_clock` |
| 〜円です | 4件 | `amount_expression` |
| 〜語で〜は何ですか | 4件 | `vocabulary_inquiry_language` |
| 〜てください | 4件 | `te_form_request` |
| 〜たいです | 4件 | `desire_expression` |
| 〜ができます | 4件 | `potential_expression` |
| Research 2 lesson_02+ | 4件 | 各種 |

---

## 守るべきルール（v13・変更なし）

| ルール | 内容 |
|---|---|
| A-1 | 例文はPDF照合してから書く（照合なしに例文を作らない） |
| A-2 | 登場人物を勝手に作らない |
| A-3 | 教科書の固有名詞は変えない（東西大学・リンさん等） |
| A-4 | 「教え方の例N」で使う素材・キャラクターが、それより前の手順で導入済みかを確認する |
| B-9 | 活動例の必須フィールド（id / name / stage / skillFocus / activityType / prerequisitePatterns / procedure / teacherTip 等） |
| **NEW** | catalogの `prerequisitePatterns` は必ず grammarConcept ID を使う（p1/p2/p3等の課ローカルIDは使わない） |
| **NEW** | catalog新規追加時は `skillFocus` + `activityType` + `interactionPattern` を必ず設定する |

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | パス | 状態 |
|---|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / lessonVersion 1.0 | `data/lesson_01.json` | ⚠️ 完成宣言保留（残課題B） |
| `lesson_02.json` | v1.0 | `data/lesson_02.json` | 未照合 |
| `activity_catalog.json` | **v1.6（57件）** | `data/activity_catalog.json` | ✅ 本チャットで完成 |
| `session_001.json` | formatVersion 1.0 | `data/session_001.json` | プロトタイプ・lesson_01確定後に再生成 |
| `master_image_registry.json` | v1.4 | `data/master_image_registry.json` | 前チャットから変化なし |
| `deep_research_integration_summary_v1.1.md` | **v1.1** | `outputs/` | ✅ ナレッジ登録用資料 |
| `master_prompt_design_guide_v2_5.py` | v2.5 | `prompts/` | Claude Codeへの適用要確認 |

---

## 次チャットの作業順序

```
1. 残課題F: prerequisitePatterns 値入れ（Step 2）
   → 上記の「入れるべきもの」リストを参照して catalog v1.7 へ更新

2. 残課題G: usedInLesson1 廃止（Step 3）
   → validatedForLessons に一本化 → catalog v1.7（Fと同時実装可）

3. 残課題H: 補助フィールド公式化の判断
   → caution/variations/plusAlpha を任意フィールドとして _meta に定義
   → 推奨：A案（任意フィールド公式化）

4. 残課題B: lesson_01 完成宣言
   → F・G完了後に宣言
   → main_act_1のskipped状態が完成の定義上問題ないか確認

5. 残課題D: Skill 設計・実装
   → lesson_01 完成版をゴールデンサンプルとして使用

6. 残課題E: lesson_02 照合・作成
   → Skill を使って作成
   → まとめ資料 v1.1 Section 6.1 の指示語関連アクティビティ4件を追加
```

---

## 次チャットへのアップロード必須ファイル

- この資料（`lesson_master_rules_handoff_v13.md`）
- `activity_catalog.json`（v1.6・57件・outputs/に出力済み）
- `deep_research_integration_summary_v1.1.md`（ナレッジ登録後は不要）

---

## 補足：activity_catalog v1.6 の全件概要

### lesson_01 で使える候補（prerequisitePatternsが lesson_01 の文型を充足する活動）

| stage | ID | skillFocus | activityType |
|---|---|---|---|
| stage1 | act_picture_card_vocab_intro | listening/speaking | drill |
| stage1 | act_qa_pattern_intro | listening/speaking | drill |
| stage1-2 | act_attribute_modeling_intro | listening/speaking | drill |
| stage1 | act_reaction_quiz | listening | tpr |
| stage3-4 | act_person_guessing_quiz | speaking/listening | game |
| stage3-4 | act_mystery_guest | speaking/listening | game |
| stage3-4 | act_hot_seat | speaking/listening | game |
| stage3 | act_grammar_auction | reading/speaking | game |
| stage3-4 | act_twenty_questions | speaking/listening | game |
| stage3-4 | act_battleship | speaking | game |
| stage3-4 | act_personality_quiz | speaking/listening | quiz |
| stage3-4 | act_two_choice_quiz | speaking | quiz |
| stage4-5 | act_hajimemashite_conversation | speaking/listening | roleplay |
| stage4-5 | act_celebrity_party | speaking | game |
| stage4-5 | act_identity_guessing | speaking | game |
| stage4-5 | act_passport_control | speaking/listening | roleplay |
| stage4-5 | act_virtual_treasure | speaking | task |
| stage4-5 | act_two_truths | speaking/listening | game |
| stage4-5 | act_virtual_card_exchange | speaking/listening | roleplay |

### grammar-agnostic（全課で使える）

TPR全般・記憶マッチング・ビンゴ・ピクショナリー・仲間外れ等 計30件以上。

---

*資料バージョン：v13（2026-05-14）*
*前バージョン：lesson_master_rules_handoff_v12.md*
