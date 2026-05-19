# 引き継ぎ資料 v2.9
**バージョン：v2.9（2026-05-17）**
**前資料：handoff_v2_8.md（2026-05-17）**
**このチャットで完了した作業：チャット⑥ 作業①②完了 + 導入アクティビティ全件照合**

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **intro_activity_catalog v1.2 修正（2点追加）** | §A の2件新規エントリを追加 |
| **②** | **lesson_02.json v2.11.9 修正（2点）** | §B の p2・p4 activityId を更新 |
| **③** | **lesson_02.json v2.11.9 修正（1点）** | §C の main_act_1 activityId を設定 |
| **④** | **第2課マスター完成確認 → 完成宣言** | 全ファイル状態確認・完成宣言 |

> **注：** 次チャットでは以下をアップロードして使用する（プロジェクトナレッジから参照しない）
> - `lesson_02_v2.11.8.json`（outputs/）← §B・§C の修正ベース
> - `intro_activity_catalog_v1.1.json`（プロジェクトナレッジ or outputs/）← §A の修正ベース

---

## §A. intro_activity_catalog v1.2 追加2件

### 追加1：`act_nani_desu_ka_intro`（p2「何ですか」専用）

**追加理由**：`act_qa_pattern_intro` は「〜ですか / はい・いいえ」クローズド疑問文の導入専用。
p2「何ですか」は**wh疑問文（開放型）**であり、活動構造・スライドテンプレートが根本的に異なる。
スライド自動生成時に「はい・いいえ」表示になるバグを予防するため、専用エントリが必要。

**追加先**：`intro_activity_catalog.activities[]` の末尾

```json
{
  "id": "act_nani_desu_ka_intro",
  "name": "意外な実物を使った『何ですか』導入",
  "nameEn": "Mystery Object Introduction for 'Nan desu ka'",
  "purpose": "見た目と中身が違う実物（ケーキに見える消しゴム・きれいな石けん等）を使って学習者が自然に「何ですか」と聞きたくなる状況を作る。教師の自問自答・否定先行（じゃありません）→ 正解提示の流れで wh疑問詞「何」を導入する。",
  "applicablePatternScope": "interrogative_what",
  "_applicablePatternScope_note": "p2（何ですか・wh疑問文）型の課で使用する。flow[].patternRef: 'p2' に対応。act_qa_pattern_intro（はい/いいえ型）とは別活動。",
  "duration": "4-7min",
  "prerequisitePatterns": [
    "kosoado_demonstrative_pronoun",
    "noun_predicate_affirmative"
  ],
  "reusableInLessons": "all",
  "slideDisplay": {
    "_note": "slide_html.js がこのセクションを読み取ってスライドをレンダリングする。",
    "layout": "mystery_object_reveal",
    "_layout_note": "実物写真またはプレースホルダー（？マーク）を中央表示。下部にパターン表示（これは何ですか / 〜じゃありません / これは〜です）。",
    "primaryMaterialTypes": [
      "teacher_real_object"
    ],
    "supplementaryMaterialTypes": [
      "auto_generated_vocab"
    ],
    "slideTitle": "何ですか？",
    "slideTitleEn": "What is it?",
    "instructionText": {
      "ja": "先生が持っているものを見てください。「何ですか」と聞いてみましょう。",
      "en": "Look at what the teacher is holding. Try asking 'Nan desu ka?' (What is it?)"
    },
    "patternDisplay": {
      "question": "これは　何ですか。",
      "negative": "〜　じゃありません。",
      "answer": "これは　〜　です。"
    }
  },
  "playerSteps": [
    {
      "step": 1,
      "ja": "先生が持っているものを見てください。「何ですか」と聞いてみましょう。",
      "en": "Look at what the teacher is holding. Ask 'Nan desu ka?' (What is it?)"
    },
    {
      "step": 2,
      "ja": "先生が「〜じゃありません」と言ったら、もう一度「何ですか」と聞きましょう。",
      "en": "When the teacher says 'It's not ~', ask 'What is it?' again."
    },
    {
      "step": 3,
      "ja": "正解を聞いたら「これは〜です」と繰り返してみましょう。",
      "en": "When you hear the answer, repeat 'Kore wa ~ desu'."
    }
  ],
  "teacherSteps": [
    {
      "step": 1,
      "ja": "意外性のある実物（ケーキに見える消しゴム・きれいな石けん等）を用意する。オンライン授業では写真をスライドに用意する（PDF p.029『実物が用意できない場合は写真を利用できる』）"
    },
    {
      "step": 2,
      "ja": "実物を隠しながら少しだけ見せ、学習者の「何?」という気持ちを引き出す"
    },
    {
      "step": 3,
      "ja": "教師自身が「何ですか」とつぶやきながら自問自答する（モデル発話）→ 学習者リピート"
    },
    {
      "step": 4,
      "ja": "「ケーキですか」→ 首を振りながら「いいえ、ケーキじゃありません」で否定先行（PDF p.029 教え方の例 2. 参照）"
    },
    {
      "step": 5,
      "ja": "「これは消しゴムです」と正解を提示 → 学習者リピート"
    },
    {
      "step": 6,
      "ja": "別の実物で繰り返し練習。慣れたら学習者が「何ですか」を使って質問する側になる"
    }
  ],
  "teacherTip": "意外性のある実物を使うことで、学習者が自然に『何?』と聞きたくなる状況を作れる（PDF p.029 記載）。実物がない場合はカービングされた野菜・きれいな石けん等の写真でも可。否定先行（じゃありません）で学習者の好奇心を引き出してから正解を言うと定着しやすい。",
  "materialNeeds_catalog": {
    "_note": "具体的な実物・写真は教師が自前で用意する（自動生成対象外）。auto_generated_vocab は p1 で導入済みの語彙カードを参照。",
    "primary": "teacher_real_object",
    "supplementary": [
      "auto_generated_vocab"
    ]
  },
  "_source_note": "PDF p.029 教え方の例 2.『「何ですか」の導入』に基づく。『一見、ほかのものに見えて実は違うものや、自然に「何?」と聞きたくなるようなものを用意する』（p.029）"
}
```

---

### 追加2：`act_which_one_intro`（p4「どれですか」専用）

**追加理由**：`act_qa_pattern_intro` は「〜ですか / はい・いいえ」クローズド疑問文の導入専用。
p4「どれですか」は**複数の選択肢から1つを特定する選択疑問**であり、「はい・いいえ」とは活動構造が根本的に異なる。
p4 は第2課固有だけでなく、将来の課（どちら・どれ系）でも再利用できる設計にする。

**追加先**：`intro_activity_catalog.activities[]` の末尾（act_nani_desu_ka_intro の次）

```json
{
  "id": "act_which_one_intro",
  "name": "複数の実物から1つを特定する『どれですか』導入",
  "nameEn": "Multiple Object Selection Introduction for 'Dore desu ka'",
  "purpose": "複数の同種の物（ペン・鍵・時計等）を並べて「〜さんのペンはどれですか」と問い、「これです/それです/あれです」で特定させる。指示代名詞（これ/それ/あれ）と組み合わせた選択疑問詞「どれ」を導入する。全体を輪を描く指示ジェスチャーで「どれ」の意味を視覚的に補強することが教育効果のカギ。",
  "applicablePatternScope": "interrogative_which_thing",
  "_applicablePatternScope_note": "p4（どれですか）型の課で使用する。flow[].patternRef: 'p4' に対応。act_qa_pattern_intro（はい/いいえ型）とは別活動。将来の『どちら』系課でも代用可。",
  "duration": "4-7min",
  "prerequisitePatterns": [
    "kosoado_demonstrative_pronoun",
    "noun_no_possession"
  ],
  "reusableInLessons": "all_dore_dochira_courses",
  "slideDisplay": {
    "_note": "slide_html.js がこのセクションを読み取ってスライドをレンダリングする。",
    "layout": "multiple_objects_selection",
    "_layout_note": "同種の物を3〜5個横並びで表示する。下部にパターン表示（〜さんの〜はどれですか / これです / それです / あれです）。",
    "primaryMaterialTypes": [
      "auto_generated_vocab"
    ],
    "supplementaryMaterialTypes": [],
    "slideTitle": "どれですか？",
    "slideTitleEn": "Which one is it?",
    "instructionText": {
      "ja": "複数の中から1つを選んで「これです」「それです」「あれです」と答えましょう。",
      "en": "Choose one from several options and answer 'Kore desu', 'Sore desu', or 'Are desu'."
    },
    "patternDisplay": {
      "question": "〜さんの　〜は　どれですか。",
      "answer_near": "これです。",
      "answer_mid": "それです。",
      "answer_far": "あれです。"
    }
  },
  "playerSteps": [
    {
      "step": 1,
      "ja": "先生が並べた複数の物をよく見てください。",
      "en": "Look carefully at the several items the teacher has laid out."
    },
    {
      "step": 2,
      "ja": "「〜さんの〜はどれですか」と聞かれたら、「これです/それです/あれです」で答えましょう。",
      "en": "When asked '~ san's ~ - which one is it?', answer with 'Kore desu', 'Sore desu', or 'Are desu'."
    },
    {
      "step": 3,
      "ja": "慣れたら「〜さんの〜はどれですか」と先生に質問してみましょう。",
      "en": "When you're ready, try asking the teacher '~ san's ~ - which one is it?'"
    }
  ],
  "teacherSteps": [
    {
      "step": 1,
      "ja": "同種の物を4〜5本/個並べる（ペン・鍵・時計等）。マンツーマン・オンラインでは教師の手元に複数並べてカメラで見せる（PDF p.031『4、5人の学習者のペンを集めて』→ マンツーマン版に調整）"
    },
    {
      "step": 2,
      "ja": "1本ずつ指して「これです。これです。」とモデルを見せた後、全体を大きく輪を描いて指して「どれですか？」と板書・ジェスチャーで対比させる（PDF p.031 ジェスチャー記述参照）"
    },
    {
      "step": 3,
      "ja": "「〜さんのペンはどれですか」と質問 → 学習者が「これです/それです/あれです」で指して答える"
    },
    {
      "step": 4,
      "ja": "『どちら』（2択の場合）も紹介できる（PDF p.031 プラスα: 選ぶ対象が2つの場合は『どちら』を使う）"
    },
    {
      "step": 5,
      "ja": "慣れたら学習者が質問する側になり、役割を交代する"
    }
  ],
  "teacherTip": "「これ」のときは1本ずつ指し、「どれ」のときは全体を大きく輪を描くジェスチャーで意味を視覚的に補強する（PDF p.031 教え方の例 4. 記述）。オンライン授業では複数のペン等を机の上に並べてカメラで見せる。選択肢が2つのときは『どちら』への橋渡しとして活用できる。",
  "materialNeeds_catalog": {
    "_note": "実物の複数並べが最も効果的。オンラインでは語彙カードのスライド表示（auto_generated_vocab）で代替。",
    "primary": "auto_generated_vocab",
    "supplementary": []
  },
  "_source_note": "PDF p.031 教え方の例 4.『「どれ」の導入』に基づく。『4、5人の学習者のペンを集めて机に並べ、「〜さんのペンはどれですか」と質問する』（p.031）"
}
```

---

**version 更新（_meta）**：
```
"version": "1.2"
"lastModified": "2026-05-17"
```

changes に追加：
```
"v1.2 (2026-05-17): p2・p4 の専用 introアクティビティを新規追加。act_nani_desu_ka_intro（何ですか・wh疑問文）/ act_which_one_intro（どれですか・選択疑問）。act_qa_pattern_intro（はい/いいえ型）との責務分離を明確化。"
```

---

## §B. lesson_02.json v2.11.9 修正2点（activityId 更新）

### 修正1：`intro_act_p2` の activityId 変更

**変更箇所**：`flow[]` の `id: "intro_act_p2"` エントリ

```json
【旧】"activityId": "act_qa_pattern_intro"
【新】"activityId": "act_nani_desu_ka_intro"
```

### 修正2：`intro_act_p4` の activityId 変更

**変更箇所**：`flow[]` の `id: "intro_act_p4"` エントリ

```json
【旧】"activityId": "act_qa_pattern_intro"
【新】"activityId": "act_which_one_intro"
```

---

## §C. lesson_02.json v2.11.9 修正1点（main_act_1 接続）

### 修正3：`main_act_1` の activityId 設定・skipped 変更

**変更箇所**：`flow[]` の `id: "main_act_1"` エントリ

```json
【旧】
"activityId": null,
"skipped": true,

【新】
"activityId": "act_belongings_qa",
"skipped": false,
```

**理由**：`act_belongings_qa`（先生の持ち物Q&A）は `activity_catalog v1.9` に `applicableLessons: [2]` として登録済みのマンツーマン版メインアクティビティ。PDF p.034 オンライン授業コラムの代替案そのものであり、第2課のメインアクティビティとして正式接続する。

> **注意**：`_skip_reason` フィールドは削除せず、`_skip_reason` → `_previous_skip_reason` にキー名変更して残す（設計判断の記録として保持）。

---

**lessonVersion 更新**（§B・§C を1回で適用）：
```json
【旧】"lessonVersion": "2.11.8"
【新】"lessonVersion": "2.11.9"
```

changes に追加：
```
"v2.11.9 (2026-05-17): 導入アクティビティ全件照合による修正。(1) intro_act_p2 activityId: act_qa_pattern_intro → act_nani_desu_ka_intro（何ですか専用に変更）。(2) intro_act_p4 activityId: act_qa_pattern_intro → act_which_one_intro（どれですか専用に変更）。(3) main_act_1 activityId: null → act_belongings_qa・skipped: true → false（メインアクティビティ正式接続）。formatVersion 2.7 維持。"
```

---

## 1. チャット⑥で完了した作業

| # | 作業 | 出力ファイル | バージョン |
|---|---|---|---|
| 作業① | lesson_02.json 修正（§A 4点） | `lesson_02_v2.11.8.json` | v2.11.8 |
| 作業② | activity_catalog 修正（§B 1点） | `activity_catalog_v1.9.json` | v1.9 |
| — | 導入アクティビティ全件照合 | — | 下記 §2 参照 |

---

## 2. 導入アクティビティ全件照合結果（完全版）

> **照合対象**：lesson_02.json v2.11.8 の `flow[]` intro_activity 全6件 + main_activity 1件  
> **照合ソース**：PDF「日本語の教え方ABC 第2課 p.026-034」教え方の例 1.〜6. + intro_activity_catalog v1.1 + activity_catalog v1.9

---

### p1：これ・それ・あれ
**flow エントリ**：`intro_act_p1` → `activityId: "act_kosoado_object_intro"`

**PDF の流れ（p.027-029）**：
- 実物（時計・ペン・本等）を手元に置き「これは時計です」→「それは〜です」→ 窓の外を指して「あれはABCビルです」
- 話し手・聞き手の領域対立図（図1〜4）で空間関係を視覚化
- オンラインでは自画面のものを「これ」、学習者画面のものを「それ」で練習

**カタログ照合**（`act_kosoado_object_intro` 確認済み）：
- `teacherSteps` に「カードを学習者側に向けて『それは〜です』」「building_card を遠くに見立てて『あれは〜です』を導入 → kosoado_diagram（図4）を参照」を明記 ✅
- `materialNeeds_catalog.supplementary: ["kosoado_diagram", "building_card"]` ✅
- `slideDisplay.layout: "kosoado_thing_intro"` ✅

**判定**：✅ **適切。PDF 流れと完全一致。修正不要。**

---

### p2：何ですか
**flow エントリ**：`intro_act_p2` → `activityId: "act_qa_pattern_intro"` ← **→ §B 修正1 で変更予定**

**PDF の流れ（p.029）**：
- 一見ほかのものに見える実物（ケーキに見える消しゴム・きれいな石けん等）を用意
- 教師が「これは何ですか」と自問自答（wh疑問文・開放型）
- 「ケーキじゃありません」で否定先行 → 「消しゴムです」で解決

**カタログ照合**（`act_qa_pattern_intro`）：
- `purpose: "疑問文「〜ですか」と応答パターン「はい/いいえ」を導入"` ← **yes/no 疑問文専用**
- `slideDisplay.instructionText: "「はい」か「いいえ」で答えましょう"` ← **完全に異なる文型**
- `patternDisplay.question: "〜ですか。"` ← **wh疑問でなく polar 疑問**

**判定**：❌ **ミスマッチ。スライド自動生成時に「はい・いいえ」表示になる。§B 修正1 で `act_nani_desu_ka_intro` へ変更（§A 追加1 で新規登録）。**

---

### p3：〜の〜（所有）
**flow エントリ**：`intro_act_p3` → `activityId: "act_possession_intro"`

**PDF の流れ（p.030）**：
- 教師が自分のかばんを持ち「これはわたしのかばんです」（自分の胸を指して「わたし」）
- 学習者のかばんを指して「それはAさんのかばんです」
- Q&A「これはBさんの本ですか → はい/いいえ、わたしのです」
- 省略形「わたしのです」も導入

**カタログ照合**（`act_possession_intro` 確認済み）：
- `teacherSteps` に「自分のかばんを持ち、自分の胸を指して『わたし』→『これはわたしのかばんです』」「学習者のかばんを指して『それはAさんのかばんです』」を明記 ✅
- `slideDisplay.patternDisplay.shortForm: "わたしのです。"` ✅（省略形対応）
- `teacherSteps 6: 「〜さんの〜はどれですか」（p4への橋渡し）を導入` ✅（p4への接続）

**判定**：✅ **適切。PDF 流れと完全一致。修正不要。**

---

### p4：どれですか
**flow エントリ**：`intro_act_p4` → `activityId: "act_qa_pattern_intro"` ← **→ §B 修正2 で変更予定**

**PDF の流れ（p.031）**：
- 4〜5本のペンを並べる
- 「〜さんのペンはどれですか」→ 学習者が「これです/それです/あれです」で1つを特定
- 1本ずつ指す「これ」とジェスチャーと、全体を輪を描く「どれ」のジェスチャーを対比

**カタログ照合**（`act_qa_pattern_intro`）：
- `purpose: "「はい/いいえ」応答パターンの導入"` ← **選択疑問でなくpolar疑問専用**
- `teacherSteps` はキャラクターカード1枚提示・yes/no Q&A ← **複数並べ選択とは活動構造が完全に異なる**
- `slideDisplay.layout: "qa_card_pair"` ← **"multiple_objects_selection" が必要**

**判定**：❌ **ミスマッチ（handoff v2.8 から「暫定・許容」のまま未解決）。§B 修正2 で `act_which_one_intro` へ変更（§A 追加2 で新規登録）。**

---

### p5：この/その/あの + N
**flow エントリ**：`intro_act_p5` → `activityId: "act_famous_person_intro"` ← チャット⑥で修正済み

**PDF の流れ（p.031-032）**：
- 有名人の写真・似顔絵を提示して「この人はアインシュタインです」
- カードを学習者側に向けて「その人は〜」→ 遠ざけて「あの人は〜」
- 「この・その・あの」を「これ・それ・あれ」と並べて板書し、後ろには必ず名詞が続くことを明示

**カタログ照合**（`act_famous_person_intro` 確認済み）：
- `applicablePatternScope: "kosoado_attributive_and_which_person"` → p5/p6 両方をカバー ✅
- `teacherSteps 2: "カードを学習者側に向けて『その人は〜』→ 遠ざけて『あの人は〜』"` ✅
- `teacherSteps 3: "『この・その・あの』と『これ・それ・あれ』の違いを板書"` ✅

**判定**：✅ **適切。チャット⑥で修正済み（act_picture_card_vocab_intro → act_famous_person_intro）。**

---

### p6：どの + N
**flow エントリ**：`intro_act_p6` → `activityId: "act_famous_person_intro"` ← チャット⑥で修正済み

**PDF の流れ（p.033）**：
- p5 で使った有名人の写真を複数枚ホワイトボードに貼る
- 教師が学習者側（少し離れた位置）から全体を大きく輪を描いて指し「どの人ですか」を導入
- 1枚ずつ「この人ですか。この人ですか」と確認 → 学習者が「この人です」→ 「その人は〜です」

**カタログ照合**（`act_famous_person_intro` 確認済み）：
- `_applicablePatternScope_note: "p5・p6 型の課で使用する"` → p6 明示 ✅
- `teacherSteps 4: "famous_person_card を3〜4枚並べ、少し離れた位置から全体を大きく輪を描いて指して『どの人ですか』を導入（PDF p.033 ジェスチャー参照）"` ✅
- `teacherSteps 5: "1枚ずつ『この人ですか。この人ですか』と指しながら確認"` ✅
- `slideDisplay.patternDisplay.question: "どの人ですか。"` ✅

**判定**：✅ **適切。チャット⑥で修正済み（act_qa_pattern_intro → act_famous_person_intro）。同一アクティビティがp5/p6の両ステップを自然にカバーしている。**

---

### main_act_1：メインアクティビティ（落としもの返しごっこ / 先生の持ち物Q&A）
**flow エントリ**：`main_act_1` → `activityId: null`（skipped: true） ← **→ §C 修正3 で変更予定**

**PDF の流れ（p.033-034）**：
- グループ版（5人）：ペン・鍵・時計等を集め袋に入れ、1枚ずつ取り出して「これはAさんのペンですか」→ 持ち主に返す
- マンツーマン版（PDF p.034 オンライン授業コラム）：教師の持ち物・ペット・家族の写真を見せて「先生の○○ですか」→ 逆に学習者の物・写真でも実施

**カタログ照合**：
- グループ版（落としもの返しごっこ）：グループ活動（5人前提）のためマンツーマン授業では実施不可 → skipped: true は設計上正しい
- マンツーマン代替案：`act_belongings_qa`（先生の持ち物Q&A）が `activity_catalog v1.9` に `applicableLessons: [2]` で登録済み
- しかし `main_act_1.activityId: null` のままで未接続

**判定**：🔶 **接続不在。act_belongings_qa は既存のカタログエントリとして整合する唯一のマンツーマン代替案。§C 修正3 で activityId を設定し、skipped: false にして正式接続する。**

---

## 3. 各ファイルの現在地

| ファイル | バージョン | 状態 | 次アクション |
|---|---|---|---|
| **lesson_02.json** | v2.11.8 | outputs/生成済み | **v2.11.9（§B 2点 + §C 1点）← 次チャット②③番** |
| **intro_activity_catalog.json** | v1.1 | プロジェクトナレッジ内 | **v1.2（§A 2件追加）← 次チャット①番** |
| **activity_catalog.json** | v1.9 | outputs/生成済み ✅ | 変更不要 |
| SKILL.md | v1.4 | outputs/生成済み ✅ | 変更不要 |
| master_audio_registry.json | v1.2 | outputs/生成済み ✅ | 変更不要 |
| master_image_registry.json | v1.9 | outputs/生成済み ✅ | 変更不要 |
| ruby_dictionary.js | v1.2 | outputs/生成済み ✅ | 変更不要 |
| image_prompts_lesson2.json | v2.0 | outputs/生成済み ✅ | 変更不要 |

---

## 4. ロードマップ

```
【完了済み（チャット⑥まで）】
  ✅ lesson_02.json v2.11.8（4点修正）
  ✅ activity_catalog v1.9（1点修正）
  ✅ 導入アクティビティ全件照合（全6文型 + main_act_1 完了）

【次チャット（チャット⑦）：必須】
  ① intro_activity_catalog v1.2（§A 2件追加）
  ② lesson_02.json v2.11.9（§B 2点 + §C 1点 修正）
  ③ 第2課マスター完成確認 → 完成宣言

【その後（第2課マスター完成後）】
  ④ GASへのL02語彙投入（importByFileId）
  ⑤ 画像・音声の自動生成（GAS処理）
  ⑥ syncAll → URL反映
  ⑦ lesson_02 授業実施可能 🎉
```

---

## 5. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 | 用途 |
|---|---|---|
| **この資料**（handoff_v2_9.md） | **必須** | 作業指示 |
| **lesson_02_v2.11.8.json**（outputs/） | **必須** | §B・§C の修正ベース |

> ⚠️ **intro_activity_catalog はプロジェクトナレッジから直接参照する**。アップロード不要。

---

## 6. 次チャットの開始コマンド例

```
handoff_v2_9.md と lesson_02_v2.11.8.json をアップロードしました。

作業①：intro_activity_catalog v1.2 を作成してください。
変更内容は handoff_v2_9.md §A の2件追加です。
プロジェクトナレッジの intro_activity_catalog v1.1 をベースに修正してください。

作業②：lesson_02.json v2.11.9 を作成してください。
変更内容は handoff_v2_9.md §B の2点 + §C の1点です。
アップロードした lesson_02_v2.11.8.json をベースに修正してください。

作業③：第2課マスター完成確認と完成宣言をしてください。
```

---

*作成日：2026-05-17*
*根拠：チャット⑥ 完了作業 ＋ 導入アクティビティ全件照合結果*
*前資料：handoff_v2_8.md（2026-05-17）*
