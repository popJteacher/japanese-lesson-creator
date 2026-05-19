# 引き継ぎ資料 v2.8
**バージョン：v2.8（2026-05-17）**
**前資料：handoff_v2_7.md（2026-05-17）**
**このチャットで完了した作業：チャット⑤ 全5作業 + アクティビティ現状確認**

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **lesson_02.json v2.11.8 修正（4点）** | 下記 §A の4点を一括修正 |
| **②** | **activity_catalog v1.9 修正（1点）** | act_belongings_qa の activityType 修正 |
| **③** | **第2課マスター完成確認** | lesson_02.json の状態確認・完成宣言 |

> **注：** 次チャットでは lesson_02.json はプロジェクトナレッジから直接参照せず、  
> **このチャットで出力した `/outputs/lesson_02_v2.11.7.json` をアップロードして使用する**。  
> activity_catalog も同様にプロジェクトナレッジから参照する。

---

## §A. lesson_02.json v2.11.8 修正4点

### 修正1（低優先）：intro_act_p5 の activityId 変更

**変更箇所**：`flow[]` の `id: "intro_act_p5"` エントリ

```json
【旧】
"activityId": "act_picture_card_vocab_intro"

【新】
"activityId": "act_famous_person_intro"
```

**理由**：p5（この/その/あの+N）の導入は有名人写真を使う `act_famous_person_intro` が正しい。
`act_picture_card_vocab_intro` は p1（人物・職業語彙）用であり、p5 には不適切。

---

### 修正2（低優先）：intro_act_p6 の activityId 変更

**変更箇所**：`flow[]` の `id: "intro_act_p6"` エントリ

```json
【旧】
"activityId": "act_qa_pattern_intro"

【新】
"activityId": "act_famous_person_intro"
```

**理由**：p6（どの+N）の導入は p5 で使った有名人写真を並べて「どの人ですか」を導入する構造であり、
`act_famous_person_intro` がカバーしている（intro_activity_catalog v1.1 で明記済み）。

---

### 修正3（中優先）：p5 practiceTemplates に犬・写真を追加

**変更箇所**：`patterns[]` の `id: "p5"` エントリの `practiceTemplates`

```json
【旧】
"practiceTemplates": [
  { "pattern": "この人は　＿＿＿　です。", "hint": "(近くにいる人を指す)" },
  { "pattern": "その人は　＿＿＿　です。", "hint": "(相手のそばの人を指す)" },
  { "pattern": "あの人は　＿＿＿　です。", "hint": "(遠くの人を指す)" }
]

【新】
"practiceTemplates": [
  { "pattern": "この人は　＿＿＿　です。", "hint": "(近くにいる人を指す)" },
  { "pattern": "その人は　＿＿＿　です。", "hint": "(相手のそばの人を指す)" },
  { "pattern": "あの人は　＿＿＿　です。", "hint": "(遠くの人を指す)" },
  { "pattern": "この犬は　＿＿＿　です。", "hint": "(近くの犬を指す)" },
  { "pattern": "その写真は　＿＿＿　です。", "hint": "(相手のそばの写真を指す)" }
]
```

**理由**：p5 の vocabCount が v2.11.7 で 1→3（人・犬・写真）に更新されたが、
practiceTemplates は「人」のみのままだった。犬・写真を使った例を追加して語彙カバレッジを合わせる。

---

### 修正4（低優先）：lessonVersion と changes の更新

```json
【旧】
"lessonVersion": "2.11.7"

【新】
"lessonVersion": "2.11.8"
```

changes に以下のエントリを追加：
```
"v2.11.8 (2026-05-17): 低〜中優先残課題適用。(1) intro_act_p5 activityId: act_picture_card_vocab_intro → act_famous_person_intro。(2) intro_act_p6 activityId: act_qa_pattern_intro → act_famous_person_intro。(3) p5 practiceTemplates: 犬・写真のパターンを追加（vocabCount=3 に整合）。formatVersion 2.7 維持。"
```

---

## §B. activity_catalog v1.9 修正1点

### 修正：act_belongings_qa の activityType から "communicative" を削除

**変更箇所**：`activities[]` の `id: "act_belongings_qa"` エントリの `activityType` フィールド

現在の状態を確認後、`"communicative"` が含まれていれば削除する（taxonomy 未定義値）。

```json
【旧（例）】
"activityType": ["task", "communicative"]

【新】
"activityType": ["task"]
```

**理由**：`activityType` の許可値は `tpr/game/roleplay/task/drill/quiz/discussion/presentation/feedback_technique` のみ（v1.6で確定）。`"communicative"` は未定義値のため削除する。

変更後、`_meta.version` を `"1.9"` に更新し、changes に以下を追加：
```
"v1.9 (2026-05-17): act_belongings_qa の activityType から未定義値 'communicative' を削除。taxonomy 準拠対応。"
```

---

## 1. チャット構成と進捗

| チャット | 対象 | 状態 |
|---|---|---|
| チャット①〜④（過去） | L1〜L30 文型シラバス / lesson_02 基礎設計 | ✅ 完了 |
| **チャット⑤（本資料のチャット）** | **SKILL.md v1.4〜image_prompts v2.0** | **✅ 完了（下記 §2 に記録）** |
| チャット⑥（次チャット） | lesson_02.json v2.11.8 ＋ activity_catalog v1.9 | ❌ 未実施 |

---

## 2. チャット⑤で完了した作業（全5件）

| # | 作業 | 出力ファイル | バージョン |
|---|---|---|---|
| ① | SKILL.md 更新 | `SKILL_v1_4.md` | v1.4 |
| ② | lesson_02.json 修正（12点） | `lesson_02_v2.11.7.json` | v2.11.7 |
| ③ | 全28例文シラバス照合 | — | 全件 ✅ |
| ④-1 | master_audio_registry 更新 | `master_audio_registry_v1.2.json` | v1.2 |
| ④-2 | master_image_registry 更新 | `master_image_registry_v1.9.json` | v1.9 |
| ④-3 | ruby_dictionary 更新 | `ruby_dictionary_v1.2.js` | v1.2 |
| ⑤ | image_prompts_lesson2 作成 | `image_prompts_lesson2_v2.0.json` | v2.0 |

---

## 3. 各ファイルの現在地

| ファイル | バージョン | 状態 | 次アクション |
|---|---|---|---|
| **lesson_02.json** | v2.11.7 | outputs/生成済み | **v2.11.8（§A の4点修正）← 次チャット①番** |
| **activity_catalog.json** | v1.8 | プロジェクトナレッジ内 | **v1.9（§B の1点修正）← 次チャット②番** |
| SKILL.md | v1.4 | outputs/生成済み | ✅ 完了 |
| master_audio_registry.json | v1.2 | outputs/生成済み | ✅ 完了 |
| master_image_registry.json | v1.9 | outputs/生成済み | ✅ 完了 |
| ruby_dictionary.js | v1.2 | outputs/生成済み | ✅ 完了 |
| image_prompts_lesson2.json | v2.0 | outputs/生成済み | ✅ 完了 |
| intro_activity_catalog | v1.1 | ✅ 照合完了 | 変更不要 |

---

## 4. アクティビティ現状サマリー（照合済み）

### intro_activity_catalog v1.1 登録状況

| id | 対応パターン | 状態 |
|---|---|---|
| `act_picture_card_vocab_intro` | p1（人物・職業語彙） | ✅ |
| `act_qa_pattern_intro` | p2（疑問文・応答） | ✅ |
| `act_attribute_modeling_intro` | p3（所属〜の〜）※L01 | ✅ |
| `act_kosoado_object_intro` | p1（こそあど・もの） | ✅ L02 |
| `act_possession_intro` | p3（所有〜の〜） | ✅ L02 |
| `act_famous_person_intro` | p5/p6（連体詞・どの） | ✅ L02 |

### lesson_02.json flow[] の activityId 参照状況

| flow id | 現在の activityId | 修正後 |
|---|---|---|
| intro_act_p1 | `act_kosoado_object_intro` | ✅ 変更不要 |
| intro_act_p2 | `act_qa_pattern_intro` | ✅ 変更不要 |
| intro_act_p3 | `act_possession_intro` | ✅ 変更不要 |
| intro_act_p4 | `act_qa_pattern_intro` | ✅ 暫定（専用catalogなし・許容） |
| intro_act_p5 | `act_picture_card_vocab_intro` | **→ `act_famous_person_intro`（§A修正1）** |
| intro_act_p6 | `act_qa_pattern_intro` | **→ `act_famous_person_intro`（§A修正2）** |

### activity_catalog v1.8 の第2課向けアクティビティ

| id | 名称 | 登録方法 |
|---|---|---|
| `act_info_gap_picture` | 情報格差タスク | `validatedForLessons: [2]`（p3/p4対応） |
| `act_belongings_qa` | 先生の持ち物Q&A | `applicableLessons: [2]`（落としもの返しごっこのマンツーマン版） |

---

## 5. ロードマップ

```
【完了済み（チャット⑤まで）】
  ✅ SKILL.md v1.4
  ✅ lesson_02.json v2.11.7（12点修正）
  ✅ 全28例文シラバス照合（全件合格）
  ✅ master_audio_registry v1.2
  ✅ master_image_registry v1.9
  ✅ ruby_dictionary v1.2
  ✅ image_prompts_lesson2 v2.0（語彙16件・例文12件）
  ✅ intro_activity_catalog v1.1（6件・第2課3件含む）
  ✅ activity_catalog v1.8（第2課向け2件登録済み）

【次チャット（チャット⑥）：必須】
  ① lesson_02.json v2.11.8（§A 4点修正）
  ② activity_catalog v1.9（§B 1点修正）
  ③ 第2課マスター完成確認 → 完成宣言

【その後（第2課マスター完成後）】
  ④ GASへのL02語彙投入（importByFileId）
  ⑤ 画像・音声の自動生成（GAS処理）
  ⑥ syncAll → URL反映
  ⑦ lesson_02 授業実施可能 🎉
```

---

## 6. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 | 用途 |
|---|---|---|
| **この資料**（handoff_v2_8.md） | **必須** | 作業指示 |
| **lesson_02_v2.11.7.json**（outputs/） | **必須** | §A の4点修正のベース |

> ⚠️ **activity_catalog は次チャットでプロジェクトナレッジから直接参照する**。アップロード不要。

---

## 7. 次チャットの開始コマンド例

```
handoff_v2_8.md と lesson_02_v2.11.7.json をアップロードしました。

作業①：lesson_02.json v2.11.8 を作成してください。
変更内容は handoff_v2_8.md §A の4点です。
アップロードした lesson_02_v2.11.7.json をベースに修正してください。

作業②：activity_catalog v1.9 を作成してください。
変更内容は handoff_v2_8.md §B の1点です。
プロジェクトナレッジの activity_catalog を参照してください。
```

---

## 8. GASパイプライン継続タスク（handoff_v2_7.md から継続）

| タスク | 状態 |
|---|---|
| **GASへのL02語彙投入**（importByFileId） | ❌ 未実施（第2課マスター完成後・音声生成前に実行） |
| **ラインA Step 3**（アクティビティUI 8件） | 🔄 別ライン・並行可 |
| classifyBatch 完了待ち | 残り約327語 / 毎時3語ずつ自動処理中 |

---

*作成日：2026-05-17*
*根拠：チャット⑤ 全完了作業 ＋ アクティビティ照合結果*
*前資料：handoff_v2_7.md（2026-05-17）*
