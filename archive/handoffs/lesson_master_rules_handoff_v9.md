# 課マスター作成ルール 引き継ぎ資料 v9
**作成日：2026-05-14**
**前バージョン：lesson_master_rules_handoff_v8.md（2026-05-14）**
**このチャットの目的：lesson_01.json を「ツールで使える状態」に完成させる**

---

## 前チャットで完了したこと

| 項目 | 内容 |
|---|---|
| T1〜T3 | lesson_01.json のレベル1問題修正・formatVersion 2.7 統一 |
| T5 | englishToggle / furiganaToggle 実装（activity_html.js に実装済み） |
| T6 | boardWriting / teachingHint 追加（p1/p2/p3 全3パターン） |
| Step 1 | 生成エンジン完成・動作確認済み |
| Step 2 | フォームUI完成・動作確認済み |

---

## タスク一覧

| タスク | 内容 | 担当 |
|---|---|---|
| **T-L1** | `act_hajimemashite_conversation` を `activity_catalog.json` に登録する | チャット（設計）→ Claude Code（実装） |
| **T-L2** | `session_001.json` の `mainActivities[].activityId` を正式IDに更新 | Claude Code |
| **T-L3** | 導入アクティビティ（p1/p2/p3）に `ABCactivityRef` を追加する | チャット（設計）→ Claude Code（実装） |
| **T-L4** | 4ファイル生成 → 目視確認 | Claude Code |
| **T-L5** | 「だれですか」問題の解決（固定キャラ廃止との衝突・設計判断が必要） | チャット（設計決定）→ Claude Code（実装） |
| **T-L6** | ABC精読で特定した素材の全量照合（A/B/C分類の完成） | チャット（ABC再精読 + 判断） |

---

## T-L1：act_hajimemashite_conversation の catalog 登録

### 現状の問題

`lesson_01.json` の `flow[main_act_1].activityId = "act_hajimemashite_conversation"` が
`activity_catalog.json` の 18件に存在しない。
→ ツールが `hasRequiredActivity: false` と判定し、アクティビティHTMLが生成されない。

また `session_001.json` の `mainActivities` は動作確認用に `act_online_roulette` で仮置き中。

### 登録に必要な確定済み情報（lesson_01.json ABCactivityRef より）

- **activityName**：会話「はじめまして」
- **fadingStage**：stage4〜5
- **taskType**：自由対話
- **playerSteps**：
  1. 名前と仕事を伝えましょう
  2. 相手に質問しましょう
  3. 次のパートナーに変わりましょう
- **教科書根拠**：日本語の教え方ABC 第1課 活動例「はじめまして」会話

### 参考：catalog の既存アクティビティ構造

```json
{
  "id": "act_xxx",
  "name": "活動名",
  "nameEn": "Activity Name",
  "stage": ["stage4", "stage5"],
  "level": ["N5"],
  "purpose": ["speaking"],
  "duration": "10-15min",
  "description": "...",
  "playerExplanation": { "ja": "〜しましょう", "en": "..." },
  "teacherTip": "...",
  "defaultMaterialTypes": ["special_handout"],
  "usedInLesson1": true,
  "contentRequirement": { "judgment": "required" },
  "textbookOrigins": [{ "textbookId": "ABC", "lesson": 1 }]
}
```

---

## T-L3：導入アクティビティの ABCactivityRef 追加

### 現状

`intro_act_p1 / p2 / p3` には catalog ID だけが割り当てられていて、
`ABCactivityRef`（playerSteps・fadingStage）がない。
教案 docx に「どう導入するか」の詳細が出ない状態。

| intro_activity | catalog ID | ABCの内容 | fadingStage |
|---|---|---|---|
| p1 | act_picture_card_vocab_intro | 人物・職業の絵カードを1枚ずつ見せ、名前を言いながら職業を導入 | stage1 |
| p2 | act_qa_pattern_intro | 「〜ですか」の質問パターンを絵カードを使って教師がモデルを示す | stage1〜2 |
| p3 | act_attribute_modeling_intro | 教師が自分の所属をモデルとして示し「〜の〜です」を導入 | stage1 |

**次チャットで決めること：** 各 intro_activity の `playerSteps[]`（学習者視点・最大3ステップ・ja/en）。

---

## T-L5：「だれですか」問題（設計判断が必要）

### 発見した設計上の衝突

p2（〜ですか）には2種類の質問が混在している。

| 質問タイプ | 例 | generic 画像で成立するか |
|---|---|---|
| 属性 YES/NO 問い | 「リンさんは**先生**ですか？」 | ✅ 名前は文中にある。画像は職業を示せばよい |
| **人物識別問い** | 「**だれ**ですか？ → キムさんです」 | ❌ 画像から誰かを識別する必要がある |

`ex_L01_010`（だれですか。— キムさんです。）は generic キャラで画像生成済みだが、
キムさんの識別情報がない。スライドでは教師がコンテキストを与えられるが、
**宿題では学習者が一人で「だれ？」を判断しなければならない。**

### 解決の選択肢

| 案 | 内容 | メリット | デメリット |
|---|---|---|---|
| **案A** | 「だれですか」には名前ラベル付き画像を生成 | 問題設計が成立する | プロンプトの「No text」制約と衝突 |
| **案B** | 「だれですか」は教師提供素材を使う（自動生成しない） | ABC の本来の教え方に近い | 該当箇所が「画像なし」になる |
| **案C** | 「だれですか」を宿題の問題から外す | 実装が最もシンプル | p2 の練習が不完全になる |

### 影響範囲

- `lesson_01.json`：`ex_L01_010` の imageRole / _comment
- `image_prompts_lesson1_v7.json`：`ex_L01_010` のプロンプト（案A・B の場合）
- `master_image_registry.json`：`ex_L01_010` の status
- `homework_html.js`：問題設計（案C の場合）

---

## T-L6：ABC素材の全量照合

### 背景

ABC精読は「この文型の指導にどんな素材が必要か」を把握するために行った。
しかし**「ABC が必要と示した素材の全量」と「現在のパイプラインがカバーしている素材」の照合が未完了。**

### 素材の3分類（確立すべき体制）

| 分類 | 意味 | パイプライン上の扱い |
|---|---|---|
| **A：自動生成** | GAS + imageId で毎回生成できる | image_prompts に追加 → GAS → registry → generator |
| **B：教師が毎回用意** | 学習者・有名人の写真など授業ごとに変わる | `materialNeeds[type: teacher_photo]` → 教案に指示として出力 |
| **C：一度作れば使い回し** | 世界地図・カレンダー等 | `materialNeeds[type: special_slide]` → 作成方法・保管場所を別途決める |

### 第1課の現状（次チャットでABC再精読して確認）

| 素材 | ABC での用途 | 現状 | 分類 |
|---|---|---|---|
| 人物・職業カード（先生・会社員等） | p1 語彙導入 | ✅ 自動生成済み | A |
| 例文イラスト（9枚） | p1/p2/p3 例文 | ✅ 自動生成済み | A |
| 世界地図（国旗付き） | 国籍・国名導入 | `special_slide` 記録あり・画像未生成 | C → 未解決 |
| 有名人写真 | 「だれですか」導入 | T-L5 の衝突問題 | B → 未解決 |
| 国旗カード | 国名語彙 | lesson_01 に未記録 | 未分類 |

### 完了の定義

第1課の全素材が A/B/C に分類され、A は生成済み・B は教案に指示あり・C は管理方法が決まっている状態。

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | 場所 |
|---|---|---|
| `lesson_01.json` | **v2.9** | Claude Code `data/lesson_01.json` |
| `lesson_02.json` | **v2.2** | Claude Code `data/lesson_02.json` |
| `activity_catalog.json` | **v1.4** | Claude Code `data/activity_catalog.json` |
| `session_001.json` | mainActivities=act_online_roulette（仮置き） | Claude Code `data/session_001.json` |

⚠️ **次チャットへのアップロード必須ファイル**：
- `lesson_01.json`（Claude Code の `data/lesson_01.json` からダウンロード）
- `activity_catalog.json`（Claude Code の `data/activity_catalog.json` からダウンロード）
- `lesson_master_rules_handoff_v8.md`（詳細ルールの参照用）
- この資料（`lesson_master_rules_handoff_v9.md`）

---

## Claude Code との分業ルール

| 作業 | どこでやるか |
|---|---|
| 設計・判断・ABCとの照合 | **このチャット** |
| catalog / lesson_01 / session_001 の JSON 編集 | **Claude Code** |
| 4ファイル生成・動作確認 | **Claude Code** |
| data/*.json 編集後のビルド | **Claude Code**（`python scripts/build-embedded-data.py` を実行） |

---

## 守るべきルール（v8 §4 より抜粋）

- **A-1**：例文はPDF照合してから書く
- **A-2**：登場人物を勝手に作らない
- **A-3**：教科書の固有名詞は変えない
- **B-9**：活動例の必須フィールド（活動名・設定・準備物・会話例・fadingStage・catalog ID）
- catalog への新規登録は `textbookOrigins[]` で教科書根拠を明記する

---

## 完了の定義

以下が満たされたら lesson_01 完成とする：

1. `act_hajimemashite_conversation` が `activity_catalog.json` に正式登録されている
2. `session_001.json` の `mainActivities` が正式IDを参照している
3. `intro_act_p1/p2/p3` に `ABCactivityRef`（playerSteps・fadingStage）が追加されている
4. 「だれですか」問題の解決方針が決定され、関連ファイルに反映されている
5. 第1課の全素材が A/B/C に分類され、未解決のものがない
6. Claude Code で lesson_01 p1〜p3 を選択 → 4ファイルが正しく生成される
7. 生成された4ファイルを目視確認して内容が正しい

---

## 次の作業（lesson_01 完成後）

- **T7**：第3課（動詞文その1）の課マスター新規作成
- lesson_02 の素材全量照合（T-L6 と同じ手順で実施）

---

*資料バージョン：v9（2026-05-14）*
*前バージョン：lesson_master_rules_handoff_v8.md*
