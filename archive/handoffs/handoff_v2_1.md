# 引き継ぎ資料 v2.1
**バージョン：v2.1（2026-05-17）**
**前資料：handoff_v2.md（2026-05-16）**
**このチャットで完了した作業：lesson_02.json v2.1 → v2.11.3 整備（Step 1a-fix〜Step 1d・網羅的分析チェック）**

---

## 1. このチャットで完了したこと

### lesson_02.json v2.1 → v2.11.3（SKILL.md v1.2 完全準拠）

| Step | 内容 | 状態 |
|---|---|---|
| Step 1a-fix | flow[]文型ブロック構造再設計（18→28エントリ）・ABCactivityRef×6追加・namedCharacters[]新設・github.repo修正 | ✅ |
| Step 1b-fix | vocabulary 全16語 imageId/audioId追加・vocabType修正・病院 isFirstAppearance修正・_inheritedFromLesson1 更新 | ✅ |
| Step 1c-fix | patterns全6件に canDoEn/practiceImageSource追加・examples全28件に isAnchor/imageId/audioId/sentenceEn追加 | ✅ |
| Step 1d | postCompletionChecklist 初回27/27クリア | ✅ |
| 網羅的分析チェック | 9箇所の旧キャラ参照（やまだまさし/すずきはなこ・v1.4廃止済み）をアクティブセクションから除去 | ✅ |
| 最終検証 | postCompletionChecklist 34/34 全件クリア | ✅ |

**出力ファイル：lesson_02.json v2.11.3**（outputs/ に生成済み。プロジェクトナレッジに再アップロード必須）

---

## 2. 分析チェックで発見・対処した全問題

### ❌→✅ 修正済み（9箇所）

| # | 場所 | 問題 | 対処 |
|---|---|---|---|
| 1 | `vocabulary.primaryCharacter_note` | やまだまさし/すずきはなこ/primaryCharacterId参照（v1.4廃止済みシステム） | 内容を廃止済み旨に書き換え |
| 2 | `vocabulary.byPattern.p5_p6_person.description` | 架空キャラ参照 | アインシュタイン/generic説明に書き換え |
| 3 | `patterns[p5]._vocabCount_note` | characters セクション参照（廃止済み） | 更新 |
| 4 | `patterns[p5].cautionNote` | やまだまさし/すずきはなこへの置換記述（現実と逆）| アインシュタイン使用の記述に更新 |
| 5 | `patterns[p5].plusAlpha[0]` | 架空キャラ呼び捨て説明 | アインシュタイン呼び捨ての説明に更新 |
| 6 | `patterns[p5].canDo` | 「やまだまさしです」が例に使われていた | 「アインシュタインです」に修正 |
| 7 | `flow[intro_act_p5]._assignmentNote` | 架空キャラで代替と記述（現在はアインシュタイン） | 更新 |
| 8 | `flow[intro_act_p5].materialNeeds.description` | 架空キャラの似顔絵と記述 | アインシュタイン/generic に更新 |
| 9 | `flow[intro_act_p5].materialNeeds.keywords` | ["やまだまさし","すずきはなこ"] | ["アインシュタイン（generic elderly man）"] に更新 |

### ⚠️ 許容範囲と判断（修正不要）

| # | 場所 | 内容 | 判断 |
|---|---|---|---|
| A | `examples[5-1][5-2].originalSources.replacementNote` | "v1.4: 架空キャラ→アインシュタインに戻す" の言及 | 変更歴の記録。機能的影響なし。保持可 |
| B | `textbook_sources._comment` | 変更歴の補足注記として「（注: v1.4で...廃止）」を追記 | 意図的な歴史記録。機能的影響なし |
| C | `_inheritedFromLesson1.words` に 男の人/女の人/外国人/会社 | L01 v2.10 で削除された語が残存 | lesson_02 v1.1（L01 v2.10以前）に作成された記録。examples 内で使用されていないため機能的影響なし |
| D | `消しゴム` reading: "けしゴム" | readingNotation は "ひらがな統一" だが ゴム はカタカナ語 | "けしごむ"（全ひらがな）か "けしゴム"（慣用的表記）かは教師の設計判断。ruby_dictionary.js 追加時に教師が決定する |
| E | `flow[review]._sourceLesson_note` | SKILL.md テンプレートにあるが未設定 | 任意フィールド。機能的影響なし |
| F | `flow[intro_act_p5/p6].materials` | "架空有名人の写真または似顔絵" / "p5 の有名人写真を再利用" と記述 | materials フィールドは教師向けメモ。"有名人（アインシュタイン等）の似顔絵" と読み替えれば問題なし。次チャットで必要なら修正可 |

---

## 3. lesson_02.json v2.11.3 最終状態

| 項目 | 値 |
|---|---|
| formatVersion | 2.7 |
| lessonVersion | 2.11.3 |
| lastModified | 2026-05-17 |
| flow[]エントリ数 | 28（4エントリ×6文型 + review + intro_slide + main_act_1 + wrapUp） |
| patterns数 | 6（p1〜p6） |
| namedCharacters[] | 5件（鈴木/リン/キム/タノム/ケリー・L01から継承） |
| vocabulary.totalWords | 16語 |
| 例文数 | 28件（ex_L02_001〜ex_L02_028） |
| postCompletionChecklist | **34/34 全件クリア ✅** |

---

## 4. 残タスク（次チャットで着手）

### 優先①：master_image_registry.json への L02 語彙エントリ追加

**追加件数：15件**（`word_病院` は L01 で既存 → スキップ）

| imageId | word | reading (カタカナ) | en | context |
|---|---|---|---|---|
| word_時計 | 時計 | トケイ | clock | vocabulary_object |
| word_腕時計 | 腕時計 | ウデドケイ | wristwatch | vocabulary_object |
| word_ペン | ペン | ペン | pen | vocabulary_object |
| word_鉛筆 | 鉛筆 | エンピツ | pencil | vocabulary_object |
| word_ケータイ | ケータイ | ケータイ | cell phone | vocabulary_object |
| word_本 | 本 | ホン | book | vocabulary_object |
| word_雑誌 | 雑誌 | ザッシ | magazine | vocabulary_object |
| word_新聞 | 新聞 | シンブン | newspaper | vocabulary_object |
| word_かばん | かばん | カバン | bag | vocabulary_object |
| word_消しゴム | 消しゴム | ケシゴム | eraser | vocabulary_object |
| word_ビル | ビル | ビル | building | vocabulary_object |
| word_市役所 | 市役所 | シヤクショ | city hall | vocabulary_object |
| word_山 | 山 | ヤマ | mountain | vocabulary_object |
| word_人 | 人 | ヒト | person | vocabulary_person |
| word_わたし | わたし | ワタシ | I/me | vocabulary_person |

**追加エントリの JSON 形式（word_医者 を参考）：**

```json
"word_時計": {
  "type": "auto_generated_vocab",
  "word": "時計",
  "reading": "トケイ",
  "en": "clock",
  "context": "vocabulary_object",
  "firstLesson": 2,
  "usedInLessons": [2],
  "status": "pending",
  "images": []
}
```

> `reading` は registry 既存エントリに合わせてカタカナ表記。lesson_02.json の reading（ひらがな）とは別規則。

---

### 優先②：master_audio_registry.json への L02 エントリ追加（44件）

**語彙 16件（全て audioUrl: null）：**
word_時計 / word_腕時計 / word_ペン / word_鉛筆 / word_ケータイ / word_本 / word_雑誌 / word_新聞 / word_かばん / word_消しゴム / word_ビル / word_病院 / word_市役所 / word_山 / word_人 / word_わたし

> `word_病院` は image registry ではスキップしたが、audio は L02 として新規追加する。

**例文 28件（全て audioUrl: null）：**

| audioId | sentence |
|---|---|
| sentence_ex_L02_001 | これは時計です。 |
| sentence_ex_L02_002 | これは腕時計です。 |
| sentence_ex_L02_003 | これはケータイです。 |
| sentence_ex_L02_004 | それはペンです。 |
| sentence_ex_L02_005 | それは本です。 |
| sentence_ex_L02_006 | それは鉛筆です。 |
| sentence_ex_L02_007 | あれはABCビルです。 |
| sentence_ex_L02_008 | あれは病院です。 |
| sentence_ex_L02_009 | あれは山です。 |
| sentence_ex_L02_010 | 何ですか。 |
| sentence_ex_L02_011 | これは何ですか。— これは消しゴムです。 |
| sentence_ex_L02_012 | それは何ですか。— それは雑誌です。 |
| sentence_ex_L02_013 | あれは何ですか。— あれは市役所です。 |
| sentence_ex_L02_014 | これは何ですか。— これはケーキです。— いいえ、ケーキじゃありません。— 何ですか。— これは消しゴムです。 |
| sentence_ex_L02_015 | これはわたしのかばんです。 |
| sentence_ex_L02_016 | それはAさんのかばんです。 |
| sentence_ex_L02_017 | これはBさんの本ですか。— はい、わたしの本です。 |
| sentence_ex_L02_018 | これはCさんのかばんですか。— いいえ、わたしのかばんじゃありません。Aさんのかばんです。 |
| sentence_ex_L02_019 | わたしのです。 |
| sentence_ex_L02_020 | すみません。これはBさんのペンですか。— はい、そうです。わたしのです。どうも、ありがとう。 |
| sentence_ex_L02_021 | リンさんのペンはどれですか。— それです。 |
| sentence_ex_L02_022 | Aさんのかばんはどれですか。— これです。 |
| sentence_ex_L02_023 | Bさんの本はどちらですか。— こちらです。 |
| sentence_ex_L02_024 | この人はアインシュタインです。 |
| sentence_ex_L02_025 | その人はアインシュタインです。 |
| sentence_ex_L02_026 | あの人はアインシュタインです。 |
| sentence_ex_L02_027 | どの人ですか。— この人です。— その人はアインシュタインです。 |
| sentence_ex_L02_028 | Aさんのかばんはどのかばんですか。— そのかばんです。 |

---

### 優先③：ruby_dictionary.js への L02 語彙追加

ruby_dictionary.js の `WORD_RUBY = Object.assign(...)` の直前に下記セクションを追加し、Object.assign に `VOCAB_LESSON2`・`PEOPLE_LESSON2` を追加する。

```javascript
// ============================================================================
// SECTION 8: 第2課の語彙（lesson_02.json v2.11.3 SSOT・15語）
// ============================================================================
// 病院（びょういん）は VOCAB_LESSON1 に既収録のため除外。
// 消しゴムの reading は けしゴム（慣用的カタカナ）か けしごむ（ひらがな統一）かを
// 教師が決定する。下記は けしゴム を採用（ゴムはカタカナ語として定着）。
// ----------------------------------------------------------------------------
const VOCAB_LESSON2 = {
  '時計':   '<ruby>時計<rt>とけい</rt></ruby>',
  '腕時計': '<ruby>腕時計<rt>うでどけい</rt></ruby>',
  'ペン':   'ペン',
  '鉛筆':   '<ruby>鉛筆<rt>えんぴつ</rt></ruby>',
  'ケータイ': 'ケータイ',
  '本':     '<ruby>本<rt>ほん</rt></ruby>',
  '雑誌':   '<ruby>雑誌<rt>ざっし</rt></ruby>',
  '新聞':   '<ruby>新聞<rt>しんぶん</rt></ruby>',
  'かばん': 'かばん',
  '消しゴム': '<ruby>消<rt>け</rt></ruby>しゴム',
  'ビル':   'ビル',
  '市役所': '<ruby>市役所<rt>しやくしょ</rt></ruby>',
  '山':     '<ruby>山<rt>やま</rt></ruby>',
  '人':     '<ruby>人<rt>ひと</rt></ruby>',
  'わたし': 'わたし',
};

// ============================================================================
// SECTION 9: 第2課で登場する人物名・固有名詞
// ============================================================================
const PEOPLE_LESSON2 = {
  'Cさん':         'Cさん',          // p3 例文（教科書記号。A/B は PEOPLE_LESSON1 に既収録）
  'アインシュタイン': 'アインシュタイン', // p5/p6 例文（著名人・さんなし）
};
```

**WORD_RUBY の Object.assign を変更：**

```javascript
// 変更前
const WORD_RUBY = Object.assign({}, PEOPLE_LESSON1, VOCAB_LESSON1, ORGANIZATIONS_LESSON1, UI_TERMS, PARTICLES);

// 変更後
const WORD_RUBY = Object.assign({}, PEOPLE_LESSON1, PEOPLE_LESSON2, VOCAB_LESSON1, VOCAB_LESSON2, ORGANIZATIONS_LESSON1, UI_TERMS, PARTICLES);
```

**追加後の動作確認コマンド：**

```bash
node -e "
const rd = require('./ruby_dictionary.js');
['時計','消しゴム','市役所','人','わたし','アインシュタイン','Cさん'].forEach(w =>
  console.log(w, '->', rd.rubifyWord(w))
);
"
```

**合わせて確認：** `大学生` が VOCAB_LESSON1 に未収録の可能性あり（lesson_01 v2.10 で追加）。ruby_dictionary.js 修正時に確認して、未収録なら VOCAB_LESSON1 に追加する。

---

## 5. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（handoff_v2_1.md） | **必須** | 全決定事項・問題記録の参照元 |
| **lesson_02.json v2.11.3** | **必須** | 整備済み最新版（outputs/ から取得） |
| **master_image_registry.json** | **必須** | 優先①の作業対象 |
| **master_audio_registry.json** | **必須** | 優先②の作業対象 |
| **ruby_dictionary.js** | **必須** | 優先③の作業対象 |
| handoff_v2.md | 推奨 | プロジェクト全体像 |

---

## 6. 次チャットの開始コマンド例

```
handoff_v2_1.md と各ファイルをアップロードしました。
lesson_02.json v2.11.3 の整備が完了しているので、レジストリ更新を行います。

優先順：
1. master_image_registry.json に L02 語彙15件を追加（word_病院はスキップ）
2. master_audio_registry.json に L02 語彙16件 + 例文28件 = 44件を追加
3. ruby_dictionary.js に VOCAB_LESSON2・PEOPLE_LESSON2 セクションを追加
   （合わせて 大学生 が VOCAB_LESSON1 に収録済みか確認）
```

---

## 7. handoff_v2.md §10 残タスク更新状況

| 優先 | タスク | 状態（更新） |
|---|---|---|
| ✅ 完了 | **lesson_02.json 整備** | v2.11.3・2026-05-17・34/34 クリア |
| 1 | **レジストリ更新（image/audio/ruby）** | ⏳ 未完了（次チャット） |
| 2 | lesson_03 以降の作成 | lesson_02 完成後に着手可 |
| 継続 | GAS 自動処理（classifyBatch 等） | 🔄 放置でOK |

---

*作成日：2026-05-17*  
*根拠：handoff_v2.md / lesson_02.json v2.11.3 / SKILL.md v1.2 / ruby_dictionary.js / master_image_registry.json / master_audio_registry.json*
