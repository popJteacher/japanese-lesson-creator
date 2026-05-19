# 課マスター作成ルール 引き継ぎ資料 v10
**作成日：2026-05-14**
**前バージョン：lesson_master_rules_handoff_v9.md**
**このチャットの目的：lesson_01 を完成させ、Skill設計の基盤を作る**

---

## このチャットで完了・確定したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| T-L1 設計 | `act_hajimemashite_conversation` の catalog エントリ設計完了 | ✅ 設計完了・実装待ち |
| T-L3 設計 | `intro_act_p1/p2/p3` の `ABCactivityRef`（playerSteps・fadingStage）設計完了 | ✅ 設計完了・実装待ち |
| T-L5 解決方針 | 画像生成でキャラクタープロファイルを作る方向に確定（案B・案C 不採用） | ✅ 方針確定・実装待ち |
| T-L6 C素材確定 | 世界地図 = C（一度作れば全課で再利用・special_slide） | ✅ 確定 |
| PDF照合 | 第1課PDF全6ページを精読・重大な不整合を5件発見 | ✅ 完了 |
| 設計方針 | まっさらリセットではなく「プロセス再設計＋lesson_01修正」で進める | ✅ 確定 |
| Skill設計方針 | 5ステップのlesson作成Skillを設計、lesson_01完成後に実装 | ✅ 設計完了 |
| ルール追加 | A-4（教え方の例の依存関係チェック）を新設 | ✅ 確定 |

---

## PDF照合で発見した重大な不整合（未修正）

### ❌ 不整合1：p3 例文の全面問題

**PDF原典（page 6 文型セクション）のp3例文は1文のみ：**
```
リンさんは東西大学の学生です。
```

現在の lesson_01.json の p3 例文（3-1〜3-5 の5件）はすべて問題あり：

| No | 現在の文 | 問題 |
|---|---|---|
| 3-1 | Aさんは**会社の会社員**です。 | ルールA-1違反（PDF未掲載）＋不自然な日本語 |
| 3-2 | Bさんは学校の先生です。 | ルールA-1違反（PDF未掲載） |
| 3-3 | Aさんはさくら銀行の会社員です。 | ルールA-1違反（PDF未掲載） |
| 3-4 | リンさんは**さくら大学**の学生です。 | ルールA-3違反（PDF原典は**東西大学**） |
| 3-5 | Aさんはさくらデパートの会社員です。 | ルールA-1違反（PDF未掲載） |

**→ 対応方針（次チャットで決定が必要）：**
- アンカー例文（3-4）を `リンさんは東西大学の学生です。` に修正（ルールA-3優先）
- 追加例文（3-1〜3-3・3-5）は語彙リスト確定後に再生成
- 「会社の会社員」は廃止。代替案：`Aさんはみどり商事の会社員です。` 等（架空社名の方針決定が必要）

---

### ❌ 不整合2：国名・国籍語彙が vocabulary に未掲載

PDF page 5「教え方の例1」より：
> T：〈世界地図の日本のところを指しながら〉**鈴木さんは日本人です。**
> T：〈同様にほかの国籍も導入し、リピートさせる〉

PDF page 1「会話例」より：
> A：はじめまして。リンです。**中国人です。**どうぞよろしく。
> B：はじめまして。ケリーです。**アメリカ**から来ました。

**確実に必要な国籍語彙（次チャットで最終確定）：**

| 語 | 読み | 英語 | 根拠 |
|---|---|---|---|
| 日本人 | にほんじん | Japanese | 教え方の例1・教師モデル発話 |
| 中国人 | ちゅうごくじん | Chinese | 会話例・リンさん |
| アメリカ人 | アメリカじん | American | 会話例・ケリーさん |
| 韓国人 | かんこくじん | Korean | page 5 世界地図に韓国旗あり |

**検討中（次チャットで判断）：**
- 国名（日本・中国・アメリカ・韓国）も vocabulary に追加するか
- 他の国籍語彙（ブラジル人・ベトナム人 ← page 5 地図に国旗あり）の扱い
- 「〜から来ました」を lesson_01 の会話例フレーズとして記録するか

---

### ❌ 不整合3：「だれですか」に必要なキャラクター導入がintro_act_p1にない

**PDFのフロー依存関係：**
```
intro_act_p1（教え方の例1）
  → 鈴木さん・リンさん・キムさん・タノムさんを
    「名前付き絵カード」として視覚的に導入する
        ↓
intro_act_p2（教え方の例2）
  → 同じカードを使って「だれですか」練習
        ↓
pattern_p2 例文（ex_L01_010）
  → だれですか → キムさんです（成立）
```

**現在の問題：**
- intro_act_p1 は「役割ベースの汎用絵カード（先生・学生…）」のみ
- 名前付きキャラクターカード（鈴木さん・リンさん・キムさん・タノムさん）が存在しない
- そのため p2 の「だれですか」に視覚的根拠がない

**解決方針（確定）：**
- `master_prompt_design_guide` に `NAMED_CHARACTER_PROFILES` セクションを新設
- 各キャラクターに視覚的に識別可能な外見を定義
- `intro_act_p1` の `materialNeeds` にキャラクターカード追加
- 役割ベース vocab 画像とは別物（共存する）
- `lesson_01.json` の characters セクション復活は**しない**（v2.6廃止維持）
- キャラクタープロファイルは `image_prompts` 側に持たせる

**PDFから確認できるキャラクター情報：**

| キャラクター | 職業 | 国籍 | PDF根拠 |
|---|---|---|---|
| 鈴木さん | 先生 | （未記載・日本人と推定） | page 5 教え方の例1 |
| リンさん | 学生・東西大学 | 中国人 | page 1 会話例・page 2 教え方の例3 |
| キムさん | **不明** | **不明** | page 3 p2手順で名前のみ登場 |
| タノムさん | **不明** | **不明** | page 4 p2手順で名前のみ登場 |
| ケリーさん | 教師 | アメリカ | page 1 会話例 |

**→ キムさん・タノムさんの職業・国籍はPDFの他ページに記載の可能性あり。**
次チャットで追加PDFがあれば照合。なければ「視覚的識別性のみ定義・職業・国籍は不明とする」方針で進める。

---

### ❌ 不整合4：p2 アンカー例文の正確な形

PDF page 6「文型」セクションの原典：
```
2-1  リンさんですか。
2-2  はい、リンさんです。／いいえ、リンさんじゃありません。
```

現在の lesson_01.json：
```
2-1  リンさんは先生ですか。（述語あり → 教科書原典は述語なし）
2-2  はい、先生です。（名前ではなく職業で応答 → 教科書原典はリンさんです）
```

**→ 文型セクションの原典に合わせて修正が必要か、それとも「教え方の例」での運用形として許容するかの判断が必要。**
（PDFの文型セクションは最もシンプルな形を示しており、教師が授業で拡張するのが前提のため、どちらも正しい可能性がある。次チャットで確認。）

---

### ❌ 不整合5：「男の人」「女の人」の位置づけ

現在のvocabulary p1_p2 に含まれているが、これは職業ではなく性別カテゴリー。
PDFでの使用文脈が不明確。次チャットで確認。

---

## 確定済みの設計内容（実装待ち）

### T-L1：act_hajimemashite_conversation catalog エントリ

```json
{
  "id": "act_hajimemashite_conversation",
  "name": "会話「はじめまして」",
  "nameEn": "\"Hajimemashite\" Free Conversation",
  "stage": ["stage4", "stage5"],
  "level": ["N5"],
  "purpose": ["speaking", "self_introduction"],
  "duration": "10-15min",
  "preparation": "なし(必要に応じて会話ガイドカード)",
  "tools": ["Zoom", "Google Meet"],
  "description": "第1課の3文型（〜は〜です／〜ですか／〜の〜です）を使い、学習者が自由に自己紹介会話を行う。名前・職業・所属を相互に伝え合い、質問し合うことで、習得文型を実際のコミュニケーション場面で運用する。複数ペアとの交代を想定した活動。",
  "procedure": [
    "教師が会話の流れをモデルで示す(名前・仕事を伝える→質問する)",
    "学習者がパートナーに名前・仕事・所属を伝える",
    "相手に質問する(例:「〜さんはどこの〜ですか」)",
    "合図で次のパートナーに交代し、同じ会話を繰り返す"
  ],
  "materials": [],
  "stt_ttt_ratio": "STT 80%",
  "applicableLessons": [1],
  "usedInLesson1": true,
  "lesson1Note": "第1課の仕上げアクティビティ。p1〜p3の文型を自由に組み合わせて使う。マンツーマン授業では教師が複数ロールを演じるか、複数学習者参加時にペアを組む。",
  "source": "日本語の教え方ABC 第1課 活動例「はじめまして」会話",
  "contentRequirement": {
    "judgment": "required",
    "reason": "会話の流れ・交代タイミングを示すplayerStepsカードがactivity_htmlで必要"
  },
  "playerExplanation": {
    "ja": "パートナーに名前と仕事を伝えましょう。相手にも質問しましょう。合図で次のパートナーに交代します。",
    "en": "Tell your partner your name and job. Ask them questions too. When the teacher signals, switch to the next partner."
  },
  "teacherTip": "学習者がつまったときは「〜は何ですか」などのプロンプトをチャットに打ち視覚的にサポートする。交代合図は教師が出す。マンツーマン授業では教師が複数キャラクターを演じて交代を模倣することも可能。",
  "defaultMaterialTypes": ["special_handout"],
  "textbookOrigins": [
    {
      "textbookId": "ABC",
      "textbookName": "日本語の教え方ABC",
      "lesson": 1,
      "section": "活動例",
      "originalLabel": "会話「はじめまして」",
      "abstractionNote": "教科書の活動例をそのままcatalog化。ペア→次のパートナーへの交代という複数回の自己紹介交換の形式を保持。固有人物名は除外。"
    }
  ]
}
```

---

### T-L3：intro_act_p1/p2/p3 の ABCactivityRef

lesson_01.json の各 intro_act エントリに追加する。

**intro_act_p1：**
```json
"ABCactivityRef": {
  "activityName": "絵カードによる語彙・基本文型導入",
  "fadingStage": "stage1",
  "taskType": "語彙提示・リピート",
  "playerSteps": [
    { "ja": "絵カードを見て、先生の言葉をよく聞きましょう", "en": "Look at the picture cards and listen carefully to the teacher." },
    { "ja": "先生のあとについて、声に出して言ってみましょう", "en": "Repeat the words and phrases out loud after the teacher." },
    { "ja": "文字を見ないで言えるか、やってみましょう", "en": "Try saying the words without looking at the text." }
  ]
}
```

**intro_act_p2：**
```json
"ABCactivityRef": {
  "activityName": "絵カードによる疑問文・応答導入",
  "fadingStage": "stage1〜2",
  "taskType": "応答練習（Q&A）",
  "playerSteps": [
    { "ja": "先生の質問を聞いて、「はい、〜です」か「いいえ、〜じゃありません」で答えましょう", "en": "Listen to the teacher's question and answer with 'Yes, ~' or 'No, it's not ~'." },
    { "ja": "「だれですか」という質問にも答えてみましょう", "en": "Also try answering the question 'Who is it?'" },
    { "ja": "慣れてきたら、自分でも質問してみましょう", "en": "When you're ready, try asking the questions yourself." }
  ]
}
```

**intro_act_p3：**
```json
"ABCactivityRef": {
  "activityName": "モデル文拡張による所属・修飾の導入",
  "fadingStage": "stage1",
  "taskType": "モデル文リピート・自己産出",
  "playerSteps": [
    { "ja": "先生のモデル文を聞いて、同じように言ってみましょう", "en": "Listen to the teacher's model sentence and repeat it the same way." },
    { "ja": "「〜の〜です」を使って、自分の国や職業・所属を言ってみましょう", "en": "Use the pattern '~ no ~ desu' to talk about your own country, job, or organization." },
    { "ja": "相手に「〜は〜の〜ですか」と質問してみましょう", "en": "Try asking your partner '~ wa ~ no ~ desu ka?'" }
  ]
}
```

---

## 次チャットで決定すること（優先順）

### 優先1：vocabulary の確定

**決定が必要な項目：**

1. **国籍語彙を追加するか・何語追加するか**
   - 最低限：日本人・中国人・アメリカ人（PDF明記）
   - 推奨追加：韓国人（page 5 地図に国旗）
   - 検討中：ブラジル人・ベトナム人・スペイン人（地図に国旗あり）
   - 国名（日本・中国・アメリカ…）も別エントリで追加するか

2. **「男の人」「女の人」を vocabulary に残すか**
   - 職業語彙ではなく性別語彙 → p1 の人物導入では使う可能性あり
   - PDF での使用文脈を次チャットで再確認推奨

3. **「〜から来ました」をフレーズとして lesson_01 に記録するか**
   - 会話例（page 1）に登場するが、本課の文型ではない
   - プラスα扱いとして materialNeeds か teachingHint に記録するか

---

### 優先2：p3 例文の再設計

**アンカー例文（変更禁止）：**
```
リンさんは東西大学の学生です。（PDF page 6 原典）
```

**追加例文の架空固有名詞方針（決定が必要）：**
現在「さくら○○」（さくら銀行・さくらデパート等）が使われているが、PDF原典に根拠がない。

選択肢：
- A：「さくら」シリーズを継続（架空感・シリーズ感あり）
- B：「みどり商事・東西銀行・ABCデパート」等の別名
- C：固有所属名は全廃、汎用名のみ（例：「ある大学の学生」→不自然）
- D：「会社員」「銀行員」等の職業のみで所属は付けない

**「会社の会社員」の修正案（A-1違反のため必ず修正）：**
→ vocabularyに「会社」が入っている以上、「〜会社の〜」形で例文を作る必要がある
→ 架空社名方針と連動して決定

---

### 優先3：キャラクタープロファイルの設計

**追加するもの：** `master_prompt_design_guide` の新セクション `NAMED_CHARACTER_PROFILES`

**確定できる情報（PDF由来）：**

| キャラ | 性別 | 職業 | 国籍 | 所属 | 視覚的特徴案 |
|---|---|---|---|---|---|
| 鈴木さん | 男性 | 先生 | 不明（日本人推定） | 不明 | グレー髪・スーツ・中年 |
| リンさん | 女性 | 学生 | 中国人 | 東西大学 | ロングヘア・カジュアル・若い |
| ケリーさん | 性別不明 | 教師 | アメリカ人 | 不明 | 欧米系・teaching appearance |
| キムさん | 不明 | **不明** | **不明** | 不明 | 短髪・メガネ・若い（仮） |
| タノムさん | 不明 | **不明** | **不明** | 不明 | スポーティ・褐色肌（仮） |

**キムさん・タノムさんは視覚的識別性のみ確保し、職業・国籍は「不明」のまま生成する方針でよいか → 次チャットで確認**

---

### 優先4：intro_act_p1 の materialNeeds 追加

キャラクタープロファイル確定後、`intro_act_p1` の materialNeeds に以下を追加：

```json
{
  "type": "named_character_card",
  "description": "名前付き人物絵カード（鈴木さん・リンさん・キムさん・タノムさん）。p1での人物・職業・国籍導入と、p2での「だれですか」Q&A練習の両方で使用する共通素材。NAMED_CHARACTER_PROFILESで定義された視覚的特徴を使って生成する。",
  "characters": ["鈴木さん", "リンさん", "キムさん", "タノムさん"],
  "usedAlsoIn": ["intro_act_p2", "pattern_p2"],
  "_note": "PDF page 4-5: 教え方の例1で人物を名前付きで導入し、教え方の例2で同じカードを再利用してQ&A練習する構造を反映。"
}
```

---

## 守るべきルール（更新版）

| ルール | 内容 |
|---|---|
| A-1 | 例文はPDF照合してから書く（照合なしに例文を作らない） |
| A-2 | 登場人物を勝手に作らない |
| A-3 | 教科書の固有名詞は変えない（東西大学・リンさん等） |
| **A-4（新設）** | 「教え方の例N」で使う素材・キャラクターが、それより前の手順で導入済みかを確認する。依存がある場合は `reusedFrom` に明記する |
| B-9 | 活動例の必須フィールド（活動名・設定・準備物・会話例・fadingStage・catalog ID） |

---

## Skill設計方針（lesson_01完成後に実装）

### 5ステップのlesson作成Skill

```
STEP 1: PDF「文型」セクション読み取り
  → 公式アンカー例文を確定（これ以外の例文は追加扱い・変更・削除禁止）
  → パターン数とidを確定

STEP 2: PDF「教え方の例N」を1つずつ読む（N=パターン数）
  → 抽出項目：
     □ 使う素材（絵カード・世界地図・写真等）
     □ 登場するキャラクター名
     □ キャラクターの属性（職業・国籍）
     □ 前の「教え方の例」からの依存素材はあるか（A-4チェック）
     □ このステップで新たに導入される語彙

STEP 3: PDF「活動例」「プラスα」「注意」読み取り
  → 活動例 → catalog エントリ設計
  → プラスα → teachingHint / cautionNote に記録
  → 注意 → cautionNote に記録

STEP 4: 抽出結果をもとに lesson_NN.json を生成
  → vocabulary（アンカー例文・教え方の例全体から抽出）
  → patterns[].examples（アンカー例文＋vocabulary×文型構造）
  → flow[].materialNeeds（教え方の例から抽出した素材）
  → 必ずSTEP1〜3完了後に生成（バラバラに作らない）

STEP 5: 自動バリデーション
  → 例文の全キャラクターが intro_act の materialNeeds に存在するか
  → 例文の全語彙が vocabulary に登録されているか
  → ルールA-1〜A-4 に違反していないか
  → アンカー例文が原典通りか（固有名詞チェック）
```

### lesson_01 = Skillのゴールデンサンプル

lesson_01 の完成版が、Skill が目指すべき「正しい出力」の基準になる。
Skill実装時は lesson_01 を入力として与え、Skillの出力と照合して精度を検証する。

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | 場所 | 状態 |
|---|---|---|---|
| `lesson_01.json` | **formatVersion 2.7 / lessonVersion 1.0** | Claude Code `data/lesson_01.json` | ⚠️ 要修正（不整合1〜5） |
| `lesson_02.json` | v1.0 | Claude Code `data/lesson_02.json` | 未照合 |
| `activity_catalog.json` | **v1.4** | Claude Code `data/activity_catalog.json` | T-L1待ち |
| `session_001.json` | formatVersion 1.0 | Claude Code `data/session_001.json` | T-L2待ち |

---

## 次チャットの作業順序

```
1. vocabulary 確定（国籍語彙・男の人/女の人・〜から来ました）
2. p3 例文の架空固有名詞方針を決定
3. p3 例文を再設計（アンカー1文＋追加例文）
4. p2 アンカー例文の修正要否を確認
5. キャラクタープロファイル4名を確定
6. intro_act_p1 の materialNeeds に named_character_card 追加
7. 以上が確定したら Claude Code に実装依頼（T-L1〜T-L6）
8. 4ファイル生成・目視確認（T-L4）
9. lesson_01 完成宣言
10. Skill 設計・実装（lesson_02 以降の自動化準備）
```

---

## 次チャットへのアップロード必須ファイル

- `lesson_01.json`（Claude Code の `data/lesson_01.json` からダウンロード）
- `activity_catalog.json`（Claude Code の `data/activity_catalog.json` からダウンロード）
- `第1課.pdf`（今チャットでアップロードしたもの・再アップロード）
- この資料（`lesson_master_rules_handoff_v10.md`）

---

*資料バージョン：v10（2026-05-14）*
*前バージョン：lesson_master_rules_handoff_v9.md*
