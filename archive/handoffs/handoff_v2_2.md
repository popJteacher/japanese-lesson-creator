# 引き継ぎ資料 v2.2
**バージョン：v2.2（2026-05-17）**
**前資料：handoff_v2_1.md（2026-05-17）**
**このチャットで完了した作業：レジストリ3ファイル更新 + lesson_02「完成」の実態整理**

---

## ⚠️ このチャットで判明した重要な認識の修正

### lesson_02.json の「完成」は教育設計SSOTとしての完成に過ぎない

| レイヤー | 状態 | 授業での実用性 |
|---|---|---|
| **教育設計SSOT**（lesson_02.json v2.11.3） | ✅ 完成 | データとして正確。それ自体は授業で使えない |
| **語彙・例文画像**（image_prompts_lesson2.json） | ❌ **未作成** | GASが動けない → 語彙カード・例文画像が全て`null` |
| **語彙導入アクティビティ**（intro_activity_catalog L02エントリ） | ❌ **未追加** | スライドの導入部が機能しない |
| **メインアクティビティ**（activity_catalog ABC第2課対応） | ❌ **未追加** | 落としものゲーム等が推薦・生成されない |

**結論：次チャットの最優先は image_prompts_lesson2.json の作成。これを始めるほど画像生成が早く進む（1日25枚制限のため）。**

---

## 1. このチャットで完了したこと

### レジストリ3ファイル更新（v2.11.3 → 本番運用準備）

| ファイル | 更新内容 | 状態 |
|---|---|---|
| **master_image_registry.json** v1.7→v1.8 | L02語彙15件追加（word_病院はL01既存のためスキップ）。totalEntries: 71→86 | ✅ outputs/に生成済み |
| **master_audio_registry.json** v1.0→v1.1 | L02語彙15件 + 例文28件 = 計43件新規追加（word_病院上書き含む実件数75）。全エントリ audioUrl: null | ✅ outputs/に生成済み |
| **ruby_dictionary.js** v1.0→v1.1 | SECTION 6（VOCAB_LESSON2・15語）、SECTION 7（PEOPLE_LESSON2・2件）追加。大学生をVOCAB_LESSON1に追加（未収録を確認・修正）。WORD_RUBY Object.assignに両セクション追加。辞書エントリ数: 83件 | ✅ outputs/に生成済み |

### ruby_dictionary.js 動作確認（全テスト通過）

```
時計      → <ruby>時計<rt>とけい</rt></ruby>
消しゴム  → <ruby>消<rt>け</rt></ruby>しゴム
市役所    → <ruby>市役所<rt>しやくしょ</rt></ruby>
大学生    → <ruby>大学生<rt>だいがくせい</rt></ruby>  ← 今回追加
アインシュタイン → アインシュタイン（カタカナ・ふりがな不要）
医者（L01）→ <ruby>医者<rt>いしゃ</rt></ruby>（劣化なし）
東西大学（L01）→ <ruby>東西大学<rt>とうざいだいがく</rt></ruby>（複合語優先・劣化なし）
```

---

## 2. 次チャットで着手する作業（優先順）

### 優先①：image_prompts_lesson2.json の設計・作成【最優先】

**理由：GASパイプラインの前提。作成後すぐ流せる。1日25枚制限のため着手が早いほど良い。**

#### 対象画像の内訳

| カテゴリ | 件数 | 備考 |
|---|---|---|
| 語彙画像（vocab） | **14件** | 全15語のうち word_病院 は L01で生成済みのためスキップ |
| 例文画像（example） | **14件** | lesson_02.json の `_post_step_action` に「14例文が画像化対象」と明記 |
| **合計** | **28件** | |

#### 語彙画像14件のvocab_type分類（プロンプト設計の前提）

| imageId | word | vocab_type | 備考 |
|---|---|---|---|
| word_時計 | 時計 | concrete_object | OBJECT_SIGNATURES 確認必須 |
| word_腕時計 | 腕時計 | concrete_object | 時計との差別化が重要 |
| word_ペン | ペン | concrete_object | HAND_HOLDING戦略推奨 |
| word_鉛筆 | 鉛筆 | concrete_object | ペンとの差別化 |
| word_ケータイ | ケータイ | concrete_object | HAND_HOLDING戦略推奨 |
| word_本 | 本 | concrete_object | 雑誌・新聞との差別化が重要 |
| word_雑誌 | 雑誌 | concrete_object | 本・新聞との差別化が重要 |
| word_新聞 | 新聞 | concrete_object | 本・雑誌との差別化が重要 |
| word_かばん | かばん | concrete_object | OBJECT_ALONE推奨 |
| word_消しゴム | 消しゴム | concrete_object | HAND_HOLDING戦略推奨 |
| word_ビル | ビル | building | BUILDING_CUES確認 |
| word_市役所 | 市役所 | building | BUILDING_CUES確認 |
| word_山 | 山 | concrete_object | 自然物・単独描画 |
| word_人 | 人 | person | generic_person（特定の職業なし） |

> **`word_わたし`（わたし/I）は画像化対象外**。「わたし」はpronoun型で代表画像が存在しない（第1人称指示は教師が口頭で示す）。vocabulary の imageId は設定済みだが image_prompts_lesson2.json には含めない。

#### 例文画像14件の選定基準
lesson_02.json のexamples[]の`_comment`に「🖼画像化対象」マークがあるものを抽出する。次チャットでlesson_02.jsonを参照して確定する。

#### プロンプト設計時の参照資料
- `master_prompt_design_guide_v2_5.py`：テンプレートA〜G・OBJECT_SIGNATURES・BUILDING_CUES
- `image_prompts_lesson1_v7.json`：フォーマットの参照例（vocabulary_images / example_images 構造）
- generateImages.gs の `OBJECT_SIGNATURES` 辞書：雑誌・本・新聞・ケータイ 等は既収録の可能性あり

---

### 優先②：intro_activity_catalog への第2課エントリ追加

**現状：第1課の3件のみ。第2課対応が必要な活動構造は少なくとも3種。**

#### 現在の登録エントリ（L01・3件）

| activityId | 活動名 | L02で転用可否 |
|---|---|---|
| act_picture_card_vocab_intro | 絵カードによる語彙・基本文型導入 | ⚠️ 構造は転用可だが、L02の「物の空間配置（こ/そ/あ）」には不十分 |
| act_qa_pattern_intro | 絵カードによる疑問文・応答導入 | ⚠️ 「何ですか」への転用は可能だが「どれ・どちら・どの」には不十分 |
| act_attribute_modeling_intro | モデル文拡張による所属・修飾の導入 | ❌ L01の職業・所属前提。L02の「〜の〜（所有）」には別設計が必要 |

#### 第2課で追加が必要なエントリ（3件・目安）

| 追加するactivityId（案） | 対応文型 | 活動の核心 |
|---|---|---|
| `act_kosoado_object_intro` | p1（これ/それ/あれ）、p2（何ですか） | 物カードを画面の左・中・右に配置し、話者と聞き手の距離感でこ/そ/あを導入 |
| `act_possession_intro` | p3（〜の〜）、p4（どれ） | 学習者の持ち物を使って「Aさんのかばん」の所有格を導入 |
| `act_famous_person_intro` | p5（この/その/あの人）、p6（どの〜） | アインシュタイン等の有名人写真を複数並べ「どの人ですか」を導入 |

> 次チャットでlesson_02.jsonのflow[]に設定されている`activityId`フィールドを確認し、既存IDとの整合を取ること。

---

### 優先③：activity_catalog への第2課ABC対応追加

**lesson_02.json の main_act_1 で `activityId: null`・`skipped: true` になっている理由：第2課のメイン活動「落としもの返しごっこ」はグループ5人前提で、マンツーマン・オンラインでは実施困難。**

#### 追加すべき内容

1. **既存アクティビティへのABC第2課対応付け**
   - `act_info_gap_picture`（情報ギャップ描写タスク）に ABC lesson_02 の textbookOrigins[] エントリを追加
   - p3〜p4の「どれですか」練習に対応可能

2. **新規アクティビティの追加（マンツーマン版）**
   - 「先生の持ち物Q&A」：PDF p.034 オンライン授業コラム記載のマンツーマン代替案
   - 教師の持ち物・ペット・家族写真を使って「先生の○○ですか」の Q&A
   - activity_catalog に `act_belongings_qa` として新規追加

---

## 3. lesson_02.json の完成状態（参照用）

### 教育設計SSOT として完成しているもの

| 項目 | 値 | 状態 |
|---|---|---|
| lessonVersion | 2.11.3 | ✅ |
| formatVersion | 2.7 | ✅ |
| postCompletionChecklist | 34/34 全件クリア | ✅ |
| PDF照合（ABC p.026-034） | v1.3で完了・修正9件適用 | ✅ |
| 例文数 | 28件（p1=9/p2=5/p3=6/p4=3/p5=3/p6=2） | ✅ |
| 語彙数 | 16語 | ✅ |
| flow[]エントリ数 | 28件 | ✅ |
| namedCharacters[] | 5件（L01から継承） | ✅ |
| 旧キャラ参照除去 | 9箇所除去済み | ✅ |

### 授業実施に向けて残っているもの（本資料§2参照）

| 項目 | 状態 |
|---|---|
| image_prompts_lesson2.json | ❌ 未作成 |
| GASへのL02語彙投入（importByFileId） | ❌ 未実行 |
| intro_activity_catalog L02エントリ | ❌ 未追加 |
| activity_catalog ABC L02対応 | ❌ 未追加 |

---

## 4. GASパイプライン状態（handoff_v2.md §4 から継続・変更なし）

### 自動実行中トリガー（全8本・稼働中）

| 関数 | 頻度 | モデル | 備考 |
|---|---|---|---|
| `classifyBatch` | 毎時 | Gemma 4 26B | BATCH_SIZE: 3（6分制限対策）|
| `generateImageBatch` | 毎日 9:00/13:00/17:00 | Imagen 4（imagen-4.0-generate-001） | vocab_type記入済みのみ処理 |
| `generateAudioBatch` | 毎日 10:00/14:00/18:00 | Gemini TTS（gemini-2.5-flash-preview-tts） | 最大10件/日 |
| `syncAll` | 毎日 23:00 | — | registry.jsonに書き戻し |

### GASへのL02語彙投入（次チャットで実行）

```javascript
// importFromLessonJson.gs に lesson_02 の Google Drive ファイルIDを追加して実行
// LESSON_FILE_IDS に追加:
lesson_02: "【lesson_02.json v2.11.3 のGoogle DriveファイルID】"

// 実行:
importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02")
// → Vocabularyシートに15語、Examplesシートに28件が追加される
// → classifyBatch → generateImageBatch → generateAudioBatch が自動処理を開始
```

> **ただし image_prompts_lesson2.json が完成してからでも遅くない。** GASの自動生成は `master_prompt_design_guide_v2_5.py` のテンプレートを使うため、image_prompts_lesson2.json がなくても自動生成は動く（プロンプトはGAS側で自動組み立て）。ただし例文画像は GAS の自動生成スコープ外（GASは語彙画像のみ）のため、例文画像は image_prompts_lesson2.json 経由での手動生成が必要。

### 確定済みScriptProperties・設定値

```
SPREADSHEET_ID:    1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk
GOI_LIST_FILE_ID:  1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA
lesson_01 FileID:  1vKN8hDNRvdPOXTqywu8Lyskf-xRI3f0c
IMAGE_REGISTRY_ID: 14NL_LqudXIQzY68klspH3SBlR21hiqbW
AUDIO_REGISTRY_ID: 1ANG89c6z8qpSyNdTQ5zB3y73yD7z9vL0
```

---

## 5. ライン A（japanese-lesson-creator）の現在地

**変更なし。handoff_v2.md §2 参照。**

Step 3 残り8件（act_memory_matching / act_vocab_bingo / act_whiteboard_categorize / act_grammar_auction / act_battleship / act_person_guessing_quiz / act_personality_quiz / act_hajimemashite_conversation）

---

## 6. lesson_02 授業実施までの全タスクロードマップ

```
【完了済み】
  ✅ lesson_02.json v2.11.3（教育設計SSOT・PDF照合済み・34/34クリア）
  ✅ master_image_registry.json v1.8（L02語彙15件予約）
  ✅ master_audio_registry.json v1.1（L02語彙+例文44件予約）
  ✅ ruby_dictionary.js v1.1（VOCAB_LESSON2・PEOPLE_LESSON2追加）

【次チャット: 必須】
  ① image_prompts_lesson2.json 作成（語彙14件 + 例文14件 = 28件）
  ② intro_activity_catalog L02エントリ追加（3件）
  ③ activity_catalog ABC L02対応追加

【次チャット後: GAS投入】
  ④ GASへのL02語彙投入（importByFileId）
  ⑤ 画像・音声の自動生成（GAS自動処理・25件/日）

【生成完了後】
  ⑥ syncAll → master_image_registry.json URL反映
  ⑦ build-embedded-data.py 実行（ラインA連携）
  ⑧ lesson_02 授業実施可能 🎉
```

---

## 7. handoff_v2.md §10 残タスク更新状況

| 優先 | タスク | 状態（更新） |
|---|---|---|
| ✅ 完了 | lesson_02.json 整備 | v2.11.3・2026-05-17・34/34クリア |
| ✅ 完了 | レジストリ更新（image/audio/ruby） | 3ファイル更新・2026-05-17 |
| 1 | **image_prompts_lesson2.json 作成** | ❌ 未着手（次チャット最優先） |
| 2 | **intro_activity_catalog L02追加** | ❌ 未着手（次チャット） |
| 3 | **activity_catalog ABC L02対応** | ❌ 未着手（次チャット） |
| 4 | GAS L02語彙投入 | ❌ 未着手（③完了後に実行） |
| 継続 | lesson_03以降の作成 | ⏸ lesson_02授業実施準備が完了するまで保留 |
| 継続 | ラインA Step 3（アクティビティUI 8件） | 🔄 別ライン・並行可 |

---

## 8. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 | 理由 |
|---|---|---|
| **この資料**（handoff_v2_2.md） | **必須** | 全決定事項・問題記録の参照元 |
| **lesson_02.json v2.11.3** | **必須** | 例文画像対象14件の確定・activityId確認 |
| **master_prompt_design_guide_v2_5.py** | **必須** | image_prompts設計のSSOT（テンプレート・OBJECT_SIGNATURES・BUILDING_CUES） |
| **image_prompts_lesson1_v7.json** | **必須** | フォーマット参照例（JSONの構造を踏襲する） |
| **intro_activity_catalog.json** | **必須** | L02エントリ追加の作業対象 |
| **activity_catalog_v1_7.json** | **必須** | ABC L02対応追加の作業対象 |
| generateImages.gs | 推奨 | OBJECT_SIGNATURES収録済み語彙の確認 |
| handoff_v2.md | 推奨 | GASパイプライン詳細・ラインA詳細の参照元 |

---

## 9. 次チャットの開始コマンド例

```
handoff_v2_2.md と各ファイルをアップロードしました。
lesson_02の授業実施準備として以下を行います。

優先順：
1. image_prompts_lesson2.json の作成
   - 語彙画像14件（word_病院はL01既存のためスキップ、word_わたしは画像化対象外）
   - 例文画像14件（lesson_02.jsonの_commentに🖼マークのある例文から選定）
   - master_prompt_design_guide_v2_5.py と image_prompts_lesson1_v7.json を参照して設計

2. intro_activity_catalog.json に第2課エントリ3件を追加
   - act_kosoado_object_intro（こ/そ/あ + 何ですか）
   - act_possession_intro（〜の〜 + どれ）
   - act_famous_person_intro（この/その/あの人 + どの〜）

3. activity_catalog_v1_7.json にABC第2課対応を追加
   - 既存act_info_gap_pictureにtextbookOrigins[]を追加
   - act_belongings_qa（先生の持ち物Q&A・マンツーマン版）を新規追加
```

---

*作成日：2026-05-17*
*根拠：handoff_v2_1.md / handoff_v2.md / lesson_02.json v2.11.3 / SKILL.md v1.2 / intro_activity_catalog.json v1.0 / activity_catalog_v1_7.json*
