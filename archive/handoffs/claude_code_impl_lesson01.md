# Claude Code 実装依頼：lesson_01 仕上げ
**作成日：2026-05-14**
**対象セッション：lesson_master_rules_handoff_v10 に基づく確定内容**
**更新：2026-05-14 TASK 2 スコープ確定（全タスク実施）**

---

## 対象ファイル

| ファイル | パス | 変更種別 |
|---|---|---|
| lesson_01.json | data/lesson_01.json | 修正・追加 |
| master_prompt_design_guide_v2_4.py | **下記手順で特定すること** | 追加 |
| activity_catalog.json | data/activity_catalog.json | 追加 |
| session_001.json | data/session_001.json | 修正（報告事項2） |

---

## 事前確認：TASK 2 のファイルパス特定

TASK 2 着手前に以下のコマンドでファイルを特定してください：

```bash
# 本リポジトリ外を含めてすべてのリポジトリを検索
glob **/master_prompt_design_guide_v2_4.py
# または
find . -name "master_prompt_design_guide_v2_4.py"
```

見つかったパスを TASK 2 の編集対象として使用してください。
**NAMED_CHARACTER_PROFILES の追加は image_prompts 生成パイプラインの動作に必須であるため、TASK 1・3 と同一セッションで必ず実施すること。**

---

## TASK 1：lesson_01.json の修正

### 1-A：_meta.changes に新バージョンエントリを追加

`changes` 配列の末尾に以下を追加：

```json
"v2.10 (2026-05-14): handoff_v10 確定内容を一括実装。(1) vocabulary 再設計: 男の人・女の人・外国人を削除、大学生を追加、会社→病院に差し替え、国籍語彙グループ(7語)を新設。totalWords: 12→17。(2) patterns[p1].examples: アンカー(1-1)を維持し4文を新規追加(計5文)。(3) patterns[p2].examples: アンカー2-1/2-2をPDF原典に修正、2-4/2-5を新規追加(計5文)。(4) patterns[p3].examples: 全5文を再設計(東西シリーズ・実名化・会社→病院)。(5) flow[intro_act_p1/p2/p3]にABCactivityRefを追加(T-L3)。(6) flow[intro_act_p1].materialNeedsにnamed_character_cardを追加(T-L4)。(7) patterns[p1].conversationPhrasesに〜から来ましたを追加。formatVersion 2.7維持。"
```

---

### 1-B：vocabulary セクションの全面更新

`vocabulary` セクションを以下の内容で**完全に置き換える**：

```json
"vocabulary": {
  "_comment": "第1課の採用語彙。17語。派生物(スライド・宿題・materials・image_prompts)はこのリストに従う。v2.10: 男の人・女の人・外国人を削除、大学生を追加、会社→病院に差し替え、国籍語彙グループを新設。",
  "totalWords": 17,
  "readingNotation": "ひらがな(学習者向け表示と統一、横断論点α 整合)",
  "byPattern": {
    "p1_p2": {
      "patternIds": ["p1", "p2"],
      "vocabCount": 5,
      "description": "文型①②(〜は〜です / 〜ですか)で使用する職業の語彙。p1とp2で同じ語彙を共有(shareVocabWith)。v2.10: 男の人・女の人・外国人を削除し職業語のみに絞る。大学生を追加。",
      "words": [
        {
          "word": "医者",
          "reading": "いしゃ",
          "en": "doctor",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person"
        },
        {
          "word": "会社員",
          "reading": "かいしゃいん",
          "en": "company employee",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person"
        },
        {
          "word": "学生",
          "reading": "がくせい",
          "en": "student",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person"
        },
        {
          "word": "大学生",
          "reading": "だいがくせい",
          "en": "university student",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_note": "v2.10新規追加。Goi_List No.10351 確認済み(1.初級前半)。学生(普通名詞)との対比で導入。p3アンカー(東西大学の学生)と連動。"
        },
        {
          "word": "先生",
          "reading": "せんせい",
          "en": "teacher",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person"
        }
      ]
    },
    "p1_p2_nationality": {
      "patternIds": ["p1", "p2"],
      "vocabCount": 7,
      "description": "文型①②で使用する国籍語彙。v2.10新規グループ。Goi_ListにN5単独エントリなし(接尾辞「人」派生形のため)。授業実態・PDF根拠でN5相当と判断。",
      "_jlptLevel_note": "Goi_Listに〜人形は独立収録なし。国名(アメリカ・韓国・日本)はGoi_List N5確認済み。中国・ブラジル・ベトナム・スペインはGoi_List未収録のため参考値扱い。",
      "words": [
        {
          "word": "日本人",
          "reading": "にほんじん",
          "en": "Japanese",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.5 教え方の例1 教師モデル発話「鈴木さんは日本人です」"
        },
        {
          "word": "中国人",
          "reading": "ちゅうごくじん",
          "en": "Chinese",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.1 会話例「中国人です」(リンさん)"
        },
        {
          "word": "アメリカ人",
          "reading": "アメリカじん",
          "en": "American",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.1 会話例「アメリカから来ました」(ケリーさん)"
        },
        {
          "word": "韓国人",
          "reading": "かんこくじん",
          "en": "Korean",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.5 世界地図に韓国旗あり"
        },
        {
          "word": "ブラジル人",
          "reading": "ブラジルじん",
          "en": "Brazilian",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.5 世界地図に国旗あり"
        },
        {
          "word": "ベトナム人",
          "reading": "ベトナムじん",
          "en": "Vietnamese",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.5 世界地図に国旗あり"
        },
        {
          "word": "スペイン人",
          "reading": "スペインじん",
          "en": "Spanish",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_person",
          "_pdfSource": "PDF p.5 世界地図に国旗あり"
        }
      ]
    },
    "p3": {
      "patternIds": ["p3"],
      "vocabCount": 5,
      "description": "文型③(〜の〜)で使用する所属機関の語彙。v2.10: 会社→病院に差し替え(「会社の会社員」が不自然なため)。例文では「東西〇〇」の架空固有名詞を付与。",
      "words": [
        {
          "word": "病院",
          "reading": "びょういん",
          "en": "hospital",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_object",
          "_note": "v2.10: 会社から差し替え。「東西病院の医者です」で自然な所属表現が成立。"
        },
        {
          "word": "学校",
          "reading": "がっこう",
          "en": "school",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_object"
        },
        {
          "word": "銀行",
          "reading": "ぎんこう",
          "en": "bank",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_object"
        },
        {
          "word": "大学",
          "reading": "だいがく",
          "en": "university",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_object"
        },
        {
          "word": "デパート",
          "reading": "デパート",
          "en": "department store",
          "jlptLevel": "N5",
          "isFirstAppearance": true,
          "vocabType": "vocabulary_card",
          "imageRole": "vocab_object",
          "_note": "カタカナ語のため絵カード化は可能だが、「建物の外観」で表現する。"
        }
      ]
    }
  },
  "deprecation_note": "vocab_lesson1.json は Goi_List.pdf 由来の draft(104語、文字化け16語含む)。第1課の採用語彙のSSOTは本セクションの17語。v2.10で12語→17語に更新。"
}
```

---

### 1-C：patterns[p1].examples を全面更新

`patterns` 配列の `id: "p1"` エントリの `examples` を以下で**完全に置き換える**：

```json
"examples": [
  {
    "no": "1-1",
    "pattern": "〜は〜です",
    "vocab": "先生",
    "sentence": "鈴木さんは先生です。",
    "sentenceEn": "Suzuki-san is a teacher.",
    "imageId": "ex_L01_001",
    "imageRole": "vocab_person",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "鈴木さんは先生です。",
        "replacementNote": "PDF p.5 教え方の例1 教師モデル発話。アンカー例文・変更禁止。"
      }
    ],
    "_comment": "p1アンカー例文。PDF p.5原典。鈴木さん(先生・日本人・男性)。"
  },
  {
    "no": "1-2",
    "pattern": "〜は〜です",
    "vocab": "大学生",
    "sentence": "リンさんは大学生です。",
    "sentenceEn": "Lin-san is a university student.",
    "imageId": "ex_L01_002",
    "imageRole": "vocab_person",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10新規追加)",
        "replacementNote": "リンさんは教科書原典固有名詞。大学生はv2.10新規追加語彙。p3アンカー(東西大学の学生)と連動。"
      }
    ],
    "_comment": "大学生の導入例文。リンさん(学生・中国人・女性・東西大学)。"
  },
  {
    "no": "1-3",
    "pattern": "〜は〜です",
    "vocab": "会社員",
    "sentence": "キムさんは会社員です。",
    "sentenceEn": "Kim-san is a company employee.",
    "imageId": "ex_L01_003",
    "imageRole": "vocab_person",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10新規追加)",
        "replacementNote": "キムさんは教科書原典固有名詞。会社員ロールをキムさんに割り当て(handoff_v10キャラプロファイル確定)。"
      }
    ],
    "_comment": "会社員の導入例文。キムさん(会社員・韓国人・男性)。"
  },
  {
    "no": "1-4",
    "pattern": "〜は〜です",
    "vocab": "日本人",
    "sentence": "鈴木さんは日本人です。",
    "sentenceEn": "Suzuki-san is Japanese.",
    "imageId": "ex_L01_004",
    "imageRole": "vocab_person",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "鈴木さんは日本人です。",
        "replacementNote": "PDF p.5 教え方の例1 教師モデル発話に準拠。国籍語彙の導入例文。"
      }
    ],
    "_comment": "日本人の導入例文。鈴木さん(先生・日本人・男性)。PDF p.5直接引用。"
  },
  {
    "no": "1-5",
    "pattern": "〜は〜です",
    "vocab": "中国人",
    "sentence": "リンさんは中国人です。",
    "sentenceEn": "Lin-san is Chinese.",
    "imageId": "ex_L01_005",
    "imageRole": "vocab_person",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "中国人です。",
        "replacementNote": "PDF p.1 会話例「リンです。中国人です。」に準拠。主語を明示する形に展開。"
      }
    ],
    "_comment": "中国人の導入例文。リンさん(学生・中国人・女性)。PDF p.1会話例由来。"
  }
]
```

---

### 1-D：patterns[p2].examples を全面更新

`id: "p2"` エントリの `examples` を以下で**完全に置き換える**：

```json
"examples": [
  {
    "no": "2-1",
    "pattern": "〜ですか",
    "vocab": null,
    "sentence": "リンさんですか。",
    "sentenceEn": "Is it Lin-san?",
    "imageId": "ex_L01_006",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "リンさんですか。",
        "replacementNote": "PDF p.6 文型セクション 2-1 原典。v2.10修正: 旧「リンさんは先生ですか」→原典通りに修正(述語なし)。アンカー例文・変更禁止。"
      }
    ],
    "_comment": "p2アンカー例文(2-1)。PDF p.6文型原典。述語なしの最小形。"
  },
  {
    "no": "2-2",
    "pattern": "はい〜です／いいえ〜じゃありません",
    "vocab": null,
    "sentence": "はい、リンさんです。／いいえ、リンさんじゃありません。",
    "sentenceEn": "Yes, it's Lin-san. / No, it's not Lin-san.",
    "imageId": "ex_L01_007",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "はい、リンさんです。／いいえ、リンさんじゃありません。",
        "replacementNote": "PDF p.6 文型セクション 2-2 原典。v2.10修正: 旧「はい、先生です」→原典通りに修正。アンカー例文・変更禁止。"
      }
    ],
    "_comment": "p2アンカー例文(2-2)。肯定・否定応答のセット。PDF p.6文型原典。"
  },
  {
    "no": "2-3",
    "pattern": "だれですか",
    "vocab": null,
    "sentence": "だれですか。→ キムさんです。",
    "sentenceEn": "Who is it? → It's Kim-san.",
    "imageId": "ex_L01_010",
    "imageRole": "vocab_person",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "だれですか。－キムさんです。",
        "replacementNote": "PDF p.6 文型セクション 2-3 原典。変更なし。アンカー例文・変更禁止。"
      }
    ],
    "_comment": "p2アンカー例文(2-3)。疑問詞「だれ」。キムさん(会社員・韓国人・男性)が視覚的に識別できるNAMED_CHARACTER_PROFILESと連動。"
  },
  {
    "no": "2-4",
    "pattern": "〜ですか(職業)",
    "vocab": "先生",
    "sentence": "先生ですか。→ はい、先生です。／いいえ、先生じゃありません。",
    "sentenceEn": "Are you a teacher? → Yes, I am. / No, I'm not.",
    "imageId": "ex_L01_008",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10新規追加)",
        "replacementNote": "PDF p.4「職業・国籍の練習」に根拠。p2パターンを職業語彙に拡張。"
      }
    ],
    "_comment": "職業疑問文の追加例文。p2アンカー(名前疑問)を職業に拡張。"
  },
  {
    "no": "2-5",
    "pattern": "〜ですか(国籍)",
    "vocab": "韓国人",
    "sentence": "韓国人ですか。→ はい、韓国人です。／いいえ、韓国人じゃありません。",
    "sentenceEn": "Are you Korean? → Yes, I am. / No, I'm not.",
    "imageId": "ex_L01_009",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10新規追加)",
        "replacementNote": "PDF p.4「職業・国籍の練習」に根拠。p2パターンを国籍語彙に拡張。キムさん(韓国人)のプロファイルと連動。"
      }
    ],
    "_comment": "国籍疑問文の追加例文。国籍語彙グループ(p1_p2_nationality)とp2パターンの接続。"
  }
]
```

---

### 1-E：patterns[p3].examples を全面更新

`id: "p3"` エントリの `examples` を以下で**完全に置き換える**：

```json
"examples": [
  {
    "no": "3-1",
    "pattern": "〜の〜です(所属)",
    "vocab": "病院",
    "sentence": "タノムさんは東西病院の医者です。",
    "sentenceEn": "Tanom-san is a doctor at Tozai Hospital.",
    "imageId": "ex_L01_011",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10再設計)",
        "replacementNote": "v2.10: 旧「Aさんは会社の会社員」(不自然・A-1違反)を廃止。タノムさん(医者・ベトナム人)＋東西病院(東西シリーズ)に変更。会社→病院にvocab差し替えと連動。"
      }
    ],
    "_comment": "p3例文(病院・医者)。タノムさん(医者・ベトナム人・男性)。東西シリーズ統一。"
  },
  {
    "no": "3-2",
    "pattern": "〜の〜です(所属)",
    "vocab": "学校",
    "sentence": "鈴木さんは東西学校の先生です。",
    "sentenceEn": "Suzuki-san is a teacher at Tozai School.",
    "imageId": "ex_L01_012",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10再設計)",
        "replacementNote": "v2.10: 旧「Bさんは学校の先生」→鈴木さん(先生・日本人)＋東西学校に変更。所属名を東西シリーズに統一。"
      }
    ],
    "_comment": "p3例文(学校・先生)。鈴木さん(先生・日本人・男性)。東西シリーズ統一。"
  },
  {
    "no": "3-3",
    "pattern": "〜の〜です(所属)",
    "vocab": "銀行",
    "sentence": "キムさんは東西銀行の会社員です。",
    "sentenceEn": "Kim-san is an employee at Tozai Bank.",
    "imageId": "ex_L01_013",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10再設計)",
        "replacementNote": "v2.10: 旧「Aさんはさくら銀行の会社員」→キムさん(会社員・韓国人)＋東西銀行に変更。さくら→東西シリーズに統一。"
      }
    ],
    "_comment": "p3例文(銀行・会社員)。キムさん(会社員・韓国人・男性)。東西シリーズ統一。"
  },
  {
    "no": "3-4",
    "pattern": "〜の〜です(所属)",
    "vocab": "大学",
    "sentence": "リンさんは東西大学の学生です。",
    "sentenceEn": "Lin-san is a student at Tozai University.",
    "imageId": "ex_L01_014",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "リンさんは東西大学の学生です。",
        "replacementNote": "PDF p.6 文型セクション p3原典。v2.10修正: 旧「さくら大学」→「東西大学」(A-3違反修正・PDF原典通り)。アンカー例文・変更禁止。"
      }
    ],
    "_comment": "p3アンカー例文。PDF p.6原典。東西大学はPDF唯一の固有名詞。変更禁止。"
  },
  {
    "no": "3-5",
    "pattern": "〜の〜です(所属)",
    "vocab": "デパート",
    "sentence": "キムさんは東西デパートの会社員です。",
    "sentenceEn": "Kim-san is an employee at Tozai Department Store.",
    "imageId": "ex_L01_015",
    "imageRole": "scene",
    "originalSources": [
      {
        "textbookId": "ABC",
        "textbookName": "日本語の教え方ABC",
        "lesson": 1,
        "originalSentence": "(v2.10再設計)",
        "replacementNote": "v2.10: 旧「Aさんはさくらデパートの会社員」→キムさん(会社員・韓国人)＋東西デパートに変更。さくら→東西シリーズに統一。"
      }
    ],
    "_comment": "p3例文(デパート・会社員)。キムさん(会社員・韓国人・男性)。東西シリーズ統一。"
  }
]
```

---

### 1-F：patterns[p1] に conversationPhrases を追加

`patterns` 配列の `id: "p1"` エントリの `plusAlpha` の直前に以下を追加：

```json
"conversationPhrases": [
  {
    "phrase": "〜から来ました。",
    "reading": "〜からきました",
    "en": "I came from ~. / I'm from ~.",
    "example": "アメリカから来ました。",
    "exampleEn": "I'm from America.",
    "pdfSource": "PDF p.1 会話例「アメリカから来ました。」(ケリーさん)",
    "note": "第1課の文型(p1〜p3)には含まれないが、会話例(はじめまして)で自然に登場するフレーズ。自己紹介活動で学習者が使いたがることが多い。プラスαとして紹介可。〜には国名が入る(日本・中国・アメリカ等)。"
  }
],
```

---

### 1-G：flow[intro_act_p1] に ABCactivityRef と named_character_card を追加

`flow` 配列の `id: "intro_act_p1"` エントリに以下を追加：

**ABCactivityRef（T-L3）：**

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
},
```

**materialNeeds に named_character_card を追加（T-L4）：**

既存の `materialNeeds` 配列に以下のオブジェクトを追加：

```json
{
  "type": "named_character_card",
  "description": "名前付き人物絵カード(鈴木さん・リンさん・キムさん・タノムさん・ケリーさん)。p1での人物・職業・国籍導入と、p2での「だれですか」Q&A練習の両方で使用する共通素材。NAMED_CHARACTER_PROFILESで定義された視覚的特徴を使って生成する。",
  "characters": ["鈴木さん", "リンさん", "キムさん", "タノムさん", "ケリーさん"],
  "usedAlsoIn": ["intro_act_p2", "pattern_p2"],
  "_note": "PDF p.4-5: 教え方の例1で人物を名前付きで導入し、教え方の例2で同じカードを再利用してQ&A練習する構造を反映。v2.10: ケリーさんを追加(会話例登場)。"
}
```

---

### 1-H：flow[intro_act_p2] と flow[intro_act_p3] に ABCactivityRef を追加

**intro_act_p2（T-L3）：**

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

**intro_act_p3（T-L3）：**

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

## TASK 2：master_prompt_design_guide_v2_4.py の更新

`CHARACTER_PROFILES` 辞書の閉じ括弧 `}` の直前（`generic_female_senior` エントリの後）に以下を追加：

```python
## ============================================================
## PART 2.3: NAMED_CHARACTER_PROFILES（名前付き教科書キャラクター）
## ============================================================
## v2.5 (2026-05-14): T-L5解決策として新設。
## lesson_01.jsonのcharactersセクション(廃止済み)とは別物。
## 視覚的定義のみをimage_prompts層に持たせる設計。
## lesson JSONには持たせない(固定キャラ廃止維持)。
## ============================================================

NAMED_CHARACTER_PROFILES = {

  "鈴木さん": {
    "textbook_origin": "日本語の教え方ABC lesson 1",
    "pdf_source": "PDF p.5 教え方の例1 教師モデル発話",
    "role_ja": "先生",
    "gender": "male",
    "nationality": "日本人",
    "age_range": "40s-50s",
    "fixed_features": {
      "face":   "calm reliable face with dark eyes, mild smile lines, and a steady warm expression",
      "hair":   "short neat gray hair",
      "skin":   "warm medium skin tone",
      "outfit": "professional suit and tie, formal teaching attire",
      "build":  "average height, professional posture"
    },
    "distinctive_feature": "gray hair + formal suit",
    "allowed_changes": ["scene", "pose", "expression"],
    "notes": "第1課の先生役。p1アンカー例文(鈴木さんは先生です)・p3例文(東西学校の先生)で使用。"
  },

  "リンさん": {
    "textbook_origin": "日本語の教え方ABC lesson 1",
    "pdf_source": "PDF p.1 会話例・p.2 教え方の例3",
    "role_ja": "学生",
    "gender": "female",
    "nationality": "中国人",
    "affiliation": "東西大学",
    "age_range": "20s",
    "fixed_features": {
      "face":   "warm friendly face with dark brown eyes and a cheerful natural smile",
      "hair":   "long straight black hair worn loose",
      "skin":   "warm light-medium skin tone",
      "outfit": "simple casual top and trousers or skirt, student-style",
      "build":  "average height, youthful build"
    },
    "distinctive_feature": "long straight hair + casual student style",
    "allowed_changes": ["scene", "pose", "expression", "specific clothes color"],
    "notes": "第1課の学生役。p2アンカー例文(リンさんですか)・p3アンカー例文(東西大学の学生)で使用。"
  },

  "ケリーさん": {
    "textbook_origin": "日本語の教え方ABC lesson 1",
    "pdf_source": "PDF p.1 会話例",
    "role_ja": "先生（教師）",
    "gender": "female",
    "nationality": "アメリカ人",
    "age_range": "30s-40s",
    "fixed_features": {
      "face":   "bright open face with light-colored eyes and a confident warm smile",
      "hair":   "medium-length light brown or blonde hair",
      "skin":   "light warm skin tone (Western appearance)",
      "outfit": "smart casual teaching attire — blouse with blazer or cardigan",
      "build":  "average height, professional posture"
    },
    "distinctive_feature": "Western appearance + teaching attire + light hair",
    "allowed_changes": ["scene", "pose", "expression", "specific clothes color"],
    "notes": "第1課の外国人教師役(アメリカ人女性)。会話例(はじめまして)で使用。先生＝教師の説明時に参照。"
  },

  "キムさん": {
    "textbook_origin": "日本語の教え方ABC lesson 1",
    "pdf_source": "PDF p.3 教え方の例2・p.6 文型 2-3",
    "role_ja": "会社員",
    "gender": "male",
    "nationality": "韓国人",
    "age_range": "20s",
    "fixed_features": {
      "face":   "pleasant approachable face with dark eyes and a neat composed expression",
      "hair":   "short neat black hair",
      "skin":   "warm light-medium skin tone (East Asian appearance)",
      "outfit": "business casual — light blue collared shirt, dark trousers",
      "build":  "average height, slim build"
    },
    "distinctive_feature": "thin rectangular glasses + short neat hair + business casual",
    "allowed_changes": ["scene", "pose", "expression"],
    "notes": "第1課のだれですかQ&A役。p2アンカー例文(だれですか→キムさんです)・p3例文(東西銀行/デパートの会社員)で使用。視覚識別性が重要(named_character_card)。"
  },

  "タノムさん": {
    "textbook_origin": "日本語の教え方ABC lesson 1",
    "pdf_source": "PDF p.4 教え方の例2手順",
    "role_ja": "医者",
    "gender": "male",
    "nationality": "ベトナム人",
    "age_range": "20s",
    "fixed_features": {
      "face":   "friendly open face with dark eyes and a warm energetic smile",
      "hair":   "short black hair, slightly casual",
      "skin":   "warm medium-brown skin tone (Southeast Asian appearance)",
      "outfit": "sporty casual wear (off-duty) or white medical coat (on-duty scenes)",
      "build":  "average to athletic build"
    },
    "distinctive_feature": "darker skin tone + sporty casual style (or white coat in medical scenes)",
    "allowed_changes": ["scene", "pose", "expression", "outfit (casual/medical coat)"],
    "notes": "第1課の医者役。p3例文(東西病院の医者)で使用。視覚識別性が重要(named_character_card)。"
  },

}
```

---

## TASK 3：activity_catalog.json の更新（T-L1）

`activities` 配列に以下のエントリを追加（既存エントリの末尾に追加）：

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
  "description": "第1課の3文型(〜は〜です／〜ですか／〜の〜です)を使い、学習者が自由に自己紹介会話を行う。名前・職業・所属を相互に伝え合い、質問し合うことで、習得文型を実際のコミュニケーション場面で運用する。複数ペアとの交代を想定した活動。",
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

## TASK 4：session_001.json の activityId 修正

`data/session_001.json` の `flow` 配列内で `activityId: "act_online_roulette"` となっている箇所を探し、以下のように修正する：

```json
"activityId": "act_hajimemashite_conversation"
```

**修正理由：** TASK 3 で `act_hajimemashite_conversation` が activity_catalog に正式登録されたため、session_001 で仮置きされていた `act_online_roulette` を本来の ID に戻す。

---

## 実装後の作業

### ステップ1：build スクリプト実行

```bash
python scripts/build-embedded-data.py
```

`data/*.js` が再生成されブラウザに反映されることを確認する。

### ステップ2：回帰テスト

- session_001 ドロップ → 4 ファイル全生成が正常完了するか確認
- Stage 1 既知 9 問題（handoff_v9 記録済み）が再発していないか確認

---

## 実装後の確認チェックリスト

実装完了後、以下を目視確認してください：

**lesson_01.json**
- [ ] `vocabulary.totalWords` が **17** になっているか
- [ ] `vocabulary.byPattern` に `p1_p2`・`p1_p2_nationality`・`p3` の3グループがあるか
- [ ] `p1_p2` の語数が **5語**（医者・会社員・学生・大学生・先生）か
- [ ] `p1_p2_nationality` の語数が **7語** か
- [ ] `p3` の語数が **5語**（病院・学校・銀行・大学・デパート）か
- [ ] `patterns[p1].examples` が **5文** あるか（1-1〜1-5）
- [ ] `patterns[p2].examples` が **5文** あるか（2-1〜2-5）
- [ ] `patterns[p3].examples` が **5文** あるか（3-1〜3-5）
- [ ] p2 アンカー 2-1 が `リンさんですか。` になっているか（述語なし）
- [ ] p2 アンカー 2-2 が `はい、リンさんです。／いいえ、リンさんじゃありません。` になっているか
- [ ] p3 アンカー 3-4 が `リンさんは東西大学の学生です。` になっているか
- [ ] p3 に `会社の会社員` が存在しないか（廃止確認）
- [ ] p3 に `さくら` が存在しないか（廃止確認）
- [ ] `Aさん`・`Bさん` が examples に存在しないか（廃止確認）
- [ ] `flow[intro_act_p1].ABCactivityRef` が追加されているか
- [ ] `flow[intro_act_p1].materialNeeds` に `named_character_card` があるか
- [ ] `patterns[p1].conversationPhrases` に `〜から来ました` があるか
- [ ] `_meta.changes` に v2.10 エントリがあるか

**master_prompt_design_guide_v2_4.py**
- [ ] `NAMED_CHARACTER_PROFILES` が5名分追加されているか（鈴木・リン・ケリー・キム・タノム）

**activity_catalog.json**
- [ ] `act_hajimemashite_conversation` が追加されているか

**session_001.json**
- [ ] `activityId` が `act_hajimemashite_conversation` になっているか

**ビルド・テスト**
- [ ] `build-embedded-data.py` が正常完了したか
- [ ] 4 ファイル全生成が正常完了したか

---

*実装依頼書バージョン：v1.1（2026-05-14）*
*更新内容：TASK 2 パス特定手順追加・TASK 4（session_001修正）追加・チェックリスト整理*
*対応する引き継ぎ資料：lesson_master_rules_handoff_v10.md*
