# 引き継ぎ資料 v3.0
**バージョン：v3.0（2026-05-17）**
**前資料：handoff_v2_9.md（2026-05-17）**
**このチャットで完了した作業：チャット⑦ 作業①②③完了 → 第2課マスター完成宣言**

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **lesson_02.json を GAS で投入** | `importByFileId()` で lesson_02 語彙をスプレッドシートへ |
| **②** | **GASパイプライン稼働確認** | 画像・音声の自動生成が進んでいるか確認 |
| **③** | **lesson_03.json の作成開始** | SKILL.md v1.4 の Step 1a〜1d に従って骨格設計 |

> **注：** 次チャットでは以下をアップロードして使用する
> - `handoff_v3_0.md`（この資料）
> - `lesson_02_v2_11_9.json`（outputs/）← GAS投入対象
> - 必要に応じて `lesson_template.json`（第3課作成時）

---

## §1. チャット⑦で完了した作業

| # | 作業 | 出力ファイル | バージョン |
|---|---|---|---|
| 作業① | intro_activity_catalog 修正（2件追加） | `intro_activity_catalog_v1_2.json` | v1.2 |
| 作業② | lesson_02.json 修正（3点） | `lesson_02_v2_11_9.json` | v2.11.9 |
| 作業③ | 第2課マスター完成確認・完成宣言 | — | 全件整合確認済み |

### 作業① 詳細：intro_activity_catalog v1.2

**追加エントリ（2件）：**

| id | name | 対象パターン | layout |
|---|---|---|---|
| `act_nani_desu_ka_intro` | 意外な実物を使った「何ですか」導入 | interrogative_what（p2） | `mystery_object_reveal` |
| `act_which_one_intro` | 複数の実物から1つを特定する「どれですか」導入 | interrogative_which_thing（p4） | `multiple_objects_selection` |

**追加 materialType（1件）：**
- `teacher_real_object`：ケーキに見える消しゴム等の意外な実物（自動生成対象外・プレースホルダー表示）

**追加理由（設計判断の記録）：**
- `act_qa_pattern_intro` は「〜ですか / はい・いいえ」クローズド疑問文専用
- p2「何ですか」（wh疑問文）・p4「どれですか」（選択疑問）は活動構造が根本的に異なる
- 旧状態のまま放置するとスライド自動生成時に「はい・いいえ」が誤表示されるバグが発生する

### 作業② 詳細：lesson_02.json v2.11.9

| 変更点 | 修正前 | 修正後 |
|---|---|---|
| `intro_act_p2` activityId | `act_qa_pattern_intro` | `act_nani_desu_ka_intro` |
| `intro_act_p4` activityId | `act_qa_pattern_intro` | `act_which_one_intro` |
| `main_act_1` activityId | `null` | `act_belongings_qa` |
| `main_act_1` skipped | `true` | `false` |
| `main_act_1` _skip_reason | （フィールド削除） | `_previous_skip_reason` にキー名変更して保存 |
| lessonVersion | `2.11.8` | `2.11.9` |

---

## §2. 各ファイルの現在地（第2課マスター完成時点）

| ファイル | バージョン | 状態 | 次アクション |
|---|---|---|---|
| **lesson_02.json** | v2.11.9 | ✅ **第2課マスター完成** | GAS投入（次チャット①番） |
| **intro_activity_catalog.json** | v1.2 | ✅ 完成 | 変更不要 |
| **activity_catalog.json** | v1.9 | ✅ 完成 | 変更不要 |
| **SKILL.md** | v1.4 | ✅ 完成 | 変更不要 |
| **master_audio_registry.json** | v1.2 | ✅ 完成 | GAS音声生成後に自動更新 |
| **master_image_registry.json** | v1.9 | ✅ 完成 | GAS画像生成後に自動更新 |
| **ruby_dictionary.js** | v1.2 | ✅ 完成 | 変更不要 |
| **image_prompts_lesson2.json** | v2.0 | ✅ 完成 | 変更不要 |

---

## §3. 第2課マスター 整合確認サマリー（完成宣言根拠）

### flow[] 全件 activityId 対照表

| flow ID | type | activityId | カタログ照合 |
|---|---|---|---|
| intro_act_p1 | intro_activity | act_kosoado_object_intro | ✅ v1.2に存在 |
| intro_act_p2 | intro_activity | act_nani_desu_ka_intro | ✅ v1.2に存在（今回追加）|
| intro_act_p3 | intro_activity | act_possession_intro | ✅ v1.2に存在 |
| intro_act_p4 | intro_activity | act_which_one_intro | ✅ v1.2に存在（今回追加）|
| intro_act_p5 | intro_activity | act_famous_person_intro | ✅ v1.2に存在 |
| intro_act_p6 | intro_activity | act_famous_person_intro | ✅ v1.2に存在 |
| main_act_1 | main_activity | act_belongings_qa | ✅ activity_catalog v1.9に存在（今回接続）|

**全 intro_activity（6件）と main_activity（1件）のカタログ参照整合を確認。孤立エントリなし。**

### PDF照合サマリー（チャット⑦実施）

| 文型 | PDFの教え方の例 | カタログエントリ | 照合結果 |
|---|---|---|---|
| p1 これ・それ・あれ | 実物提示・kosoado_diagram（図1〜4） | act_kosoado_object_intro | ✅ 完全一致 |
| p2 何ですか | 意外な実物・否定先行・wh疑問 | act_nani_desu_ka_intro | ✅ 今回新規作成 |
| p3 〜の〜（所有） | 自分のかばん・省略形「わたしのです」 | act_possession_intro | ✅ 完全一致 |
| p4 どれですか | 複数並べ・ジェスチャー対比 | act_which_one_intro | ✅ 今回新規作成 |
| p5 この/その/あの | 有名人カード・板書対比 | act_famous_person_intro | ✅ 完全一致 |
| p6 どの人 | 複数カード・輪ジェスチャー | act_famous_person_intro | ✅ p5/p6共用設計で対応 |
| main 落としもの返しごっこ | オンライン版：持ち物Q&A | act_belongings_qa | ✅ 今回正式接続 |

---

## §4. 次チャット 作業詳細

### ①  lesson_02 語彙 GAS投入

**手順：**
```
1. lesson_02_v2_11_9.json を Google Drive にアップロード
2. importFromLessonJson.gs の LESSON_FILE_IDS に lesson_02 のファイルIDを追加
   const LESSON_FILE_IDS = {
     lesson_01: "...",
     lesson_02: "YOUR_LESSON_02_JSON_FILE_ID_HERE",  ← 追加
   };
3. previewImport("FILE_ID") でドライラン確認（書き込みなし）
4. importByFileId(LESSON_FILE_IDS.lesson_02, "lesson_02") を実行
5. Vocabulary シートに lesson_02 語彙が追加されたことを確認
```

**期待される投入語彙：** lesson_02 の vocabulary.byPattern に登録されている語彙群
（時計・ペン・かばん・本・雑誌・新聞・鉛筆・チョコレート・ケータイ等 + こそあど関連）

**重複処理：** 既存語彙（lesson_01 で登録済みのもの）は自動スキップされる

---

### ② GASパイプライン稼働確認

**確認事項：**

| 確認項目 | 確認方法 | 正常状態 |
|---|---|---|
| classifyBatch | スプレッドシート vocabulary 列C・F確認 | lesson_01/02 語彙の en・vocab_type が埋まっている |
| generateImageBatch | 列H（imageStatus）確認 | `generated` または `approved` が増えている |
| generateAudioBatch | 列K（audioStatus）確認 | `generated` が増えている |
| syncAll | master_image_registry.json の imageUrl | null → Drive URL に更新されている |

**よく使うメンテナンス関数（handoff_v2.md §7 参照）：**
```javascript
retryImages(["word_XX"])      // 強制再生成
retryAudio(["word_XX"])       // 強制再生成
previewClassify()             // 分類プレビュー（書き込みなし）
checkStyleRecipe()            // #6B7C85 が含まれるか確認
```

---

### ③ lesson_03.json の作成開始

**前提条件：** lesson_02.json 完成確認済み（✅ 本チャットで完了）

**SKILL.md v1.4 Step 1a 骨格設計から開始：**
```
Step 1a：骨格設計
  テンプレートコピー → _meta/lesson/textbook_sources 記入
  → patterns[] エントリ数確定 → flow[] 調整

Step 1b：語彙設計
  パターン別語彙確定 → vocabulary.byPattern グループ設計
  → imageId/audioId 採番 → レジストリ予約 → ruby_dictionary.js 追加

Step 1c：例文設計
  パターン別例文作成（肯定・否定・疑問・疑問詞）
  → isAnchor:true を各パターン1件 → imageId/audioId 採番

Step 1d：照合
  postCompletionChecklist 全件 → formatVersion: "2.7" 確認
```

---

## §5. ロードマップ

```
【完了済み（チャット⑦まで）】
  ✅ lesson_02.json v2.11.9（第2課マスター完成）
  ✅ intro_activity_catalog v1.2（act_nani / act_which_one 追加）
  ✅ activity_catalog v1.9
  ✅ master_audio_registry v1.2
  ✅ master_image_registry v1.9
  ✅ ruby_dictionary.js v1.2
  ✅ image_prompts_lesson2.json v2.0
  ✅ SKILL.md v1.4

【次チャット（チャット⑧）：必須】
  ① lesson_02 語彙 GAS投入（importByFileId）
  ② GASパイプライン稼働確認
  ③ lesson_03.json 作成開始

【その後：第2課マスター→授業実施まで】
  ④ 画像・音声の自動生成（GASタイマー・放置でOK）
  ⑤ syncAll 実行 → master_image_registry / master_audio_registry 更新
  ⑥ build-embedded-data.py 実行 → HTML反映
  ⑦ lesson_02 授業実施可能 🎉

【中長期】
  ─ lesson_03〜NN の作成（SKILL.md v1.4 に従って順次）
  ─ N4語彙追加（788語）→ extractByLevel() で実施
  ─ slide_html.js Stage 6 実装（intro_activity スライドレンダリング）
  ─ 日本語辞書サイトへの展開（画像・音声資産の転用）
```

---

## §6. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 | 用途 |
|---|---|---|
| **この資料**（handoff_v3_0.md） | **必須** | 作業指示・現在地の把握 |
| **lesson_02_v2_11_9.json**（outputs/） | **必須** | GAS投入対象（importByFileId に渡す） |
| lesson_template.json | 任意 | lesson_03 作成時に参照 |

---

## §7. 次チャットの開始コマンド例

**GAS投入から始める場合：**
```
handoff_v3_0.md と lesson_02_v2_11_9.json をアップロードしました。

作業①：lesson_02_v2_11_9.json を GAS で Vocabulary シートに投入します。
importFromLessonJson.gs の LESSON_FILE_IDS に lesson_02 を追加して
importByFileId() を実行する手順を確認してください。

作業②：GASパイプラインの稼働状況を確認してください。

作業③：確認が取れたら lesson_03.json の作成を開始します。
SKILL.md v1.4 の Step 1a から始めてください。
```

**lesson_03 作成から始める場合：**
```
handoff_v3_0.md をアップロードしました。

lesson_03.json の作成を開始します。
SKILL.md v1.4 の Step 1a（骨格設計）から始めてください。
```

---

*作成日：2026-05-17*
*根拠：チャット⑦ 完了作業（作業①②③）＋ 第2課マスター完成宣言*
*前資料：handoff_v2_9.md（2026-05-17）*
