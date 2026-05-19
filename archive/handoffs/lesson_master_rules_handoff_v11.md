# 課マスター作成ルール 引き継ぎ資料 v11
**作成日：2026-05-14**
**前バージョン：lesson_master_rules_handoff_v10.md**
**このチャットの目的：lesson_01 の vocabulary・例文・キャラクタープロファイルを確定し、実装を完了させる**

---

## このチャットで完了・確定したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| vocabulary 確定 | 17語（グループ3構成）に再設計。男の人・女の人・外国人・会社を削除。大学生・国籍7語・病院を追加 | ✅ 実装完了 |
| p1 例文確定 | 5文（1-1〜1-5）。アンカー維持＋大学生・会社員・日本人・中国人を追加 | ✅ 実装完了 |
| p2 例文確定 | 5文（2-1〜2-5）。アンカー2-1/2-2をPDF原典に修正。職業・国籍の追加例文2文を新設 | ✅ 実装完了 |
| p3 例文確定 | 5文（3-1〜3-5）。東西シリーズ統一・全文実名化・会社→病院差し替え | ✅ 実装完了 |
| キャラクタープロファイル確定 | 5名（鈴木・リン・ケリー・キム・タノム）の職業・国籍・性別・視覚的特徴を確定 | ✅ 実装完了 |
| 〜から来ました | patterns[p1].conversationPhrases に会話フレーズとして記録 | ✅ 実装完了 |
| NAMED_CHARACTER_PROFILES | master_prompt_design_guide_v2_4.py に5名分を新規追加 | ✅ 実装完了 |
| activity_catalog 更新 | act_hajimemashite_conversation を正式追加（18→19件） | ✅ 実装完了 |
| session_001 修正 | activityId を act_online_roulette → act_hajimemashite_conversation に修正 | ✅ 実装完了 |
| ファイル移動 | master_prompt_design_guide_v2_4.py を旧プロジェクトから prompts/ に移動 | ✅ 完了 |
| 回帰テスト | 4ファイル全生成・Stage 1 既知9問題再発なし | ✅ 完了 |

---

## v10 からの不整合解消状況

| 不整合番号 | 内容 | 状態 |
|---|---|---|
| 不整合1 | p3 例文の全面問題（さくら・Aさん・会社の会社員） | ✅ 解消 |
| 不整合2 | 国名・国籍語彙が vocabulary に未掲載 | ✅ 解消 |
| 不整合3 | named_character_card が materialNeeds にない | ✅ 解消 |
| 不整合4 | p2 アンカー例文が PDF 原典と不一致 | ✅ 解消 |
| 不整合5 | 男の人・女の人が vocabulary に混在 | ✅ 解消（削除） |

---

## 確定した設計内容（記録）

### キャラクタープロファイル（5名）

| キャラ | 性別 | 職業 | 国籍 | 所属 | 視覚的特徴 |
|---|---|---|---|---|---|
| 鈴木さん | 男性 | 先生 | 日本人 | — | グレー髪・スーツ・40〜50代 |
| リンさん | 女性 | 学生 | 中国人 | 東西大学 | ロングヘア・カジュアル・20代 |
| ケリーさん | 女性 | 先生（教師） | アメリカ人 | — | 欧米系・30〜40代 |
| キムさん | 男性 | 会社員 | 韓国人 | — | 短髪・メガネ・ビジネスカジュアル・20代 |
| タノムさん | 男性 | 医者 | ベトナム人 | — | 短髪・褐色肌・スポーティ・20代 |

### vocabulary（17語・3グループ）

| グループ | 語数 | 語彙 |
|---|---|---|
| p1_p2（職業） | 5語 | 医者・会社員・学生・大学生・先生 |
| p1_p2_nationality（国籍） | 7語 | 日本人・中国人・アメリカ人・韓国人・ブラジル人・ベトナム人・スペイン人 |
| p3（所属機関） | 5語 | 病院・学校・銀行・大学・デパート |

**Goi_List照合メモ：**
- 職業5語・大学・学校・銀行・デパートは1.初級前半（N5）確認済み
- 病院はN5相当（授業実態・PDF根拠）
- 国籍語彙（〜人形）はGoi_Listに独立収録なし。国名(アメリカ・韓国・日本・カナダ)はN5確認済み。中国・ブラジル・ベトナム・スペインはGoi_List未収録のため参考値扱い

### p1 例文（5文）

| No | 文 | vocab |
|---|---|---|
| 1-1 | 鈴木さんは先生です。| 先生（アンカー・PDF p.5） |
| 1-2 | リンさんは大学生です。| 大学生 |
| 1-3 | キムさんは会社員です。| 会社員 |
| 1-4 | 鈴木さんは日本人です。| 日本人（PDF p.5） |
| 1-5 | リンさんは中国人です。| 中国人（PDF p.1） |

### p2 例文（5文）

| No | 文 | 種別 |
|---|---|---|
| 2-1 | リンさんですか。| アンカー（PDF p.6） |
| 2-2 | はい、リンさんです。／いいえ、リンさんじゃありません。| アンカー（PDF p.6） |
| 2-3 | だれですか。→ キムさんです。| アンカー（PDF p.6） |
| 2-4 | 先生ですか。→ はい、先生です。／いいえ、先生じゃありません。| 職業追加 |
| 2-5 | 韓国人ですか。→ はい、韓国人です。／いいえ、韓国人じゃありません。| 国籍追加 |

### p3 例文（5文）

| No | 文 | vocab |
|---|---|---|
| 3-1 | タノムさんは東西病院の医者です。| 病院 |
| 3-2 | 鈴木さんは東西学校の先生です。| 学校 |
| 3-3 | キムさんは東西銀行の会社員です。| 銀行 |
| 3-4 | リンさんは東西大学の学生です。| 大学（アンカー・PDF p.6） |
| 3-5 | キムさんは東西デパートの会社員です。| デパート |

---

## ⚠️ 残課題（次チャット以降で対応）

### 残課題1：新規語彙の画像生成（ブロッカーではない）

Claude Code の実装完了報告より：
> 新規追加された vocabulary（**大学生・国籍7語**）に対応する画像が `master_image_registry.json` にないため、スライド/宿題で fallback 表示 `🖼️` が出る。

**対応方針：**
- image_prompts 生成パイプライン側で NAMED_CHARACTER_PROFILES と ROLE_BASED_GENERIC_PROFILES を使って画像を生成
- 生成後に master_image_registry.json を更新
- 動作には支障なし（graceful degradation 確認済み）

**生成が必要な画像（新規17語分）：**

| 語 | imageRole | 参照すべきプロファイル |
|---|---|---|
| 大学生 | vocab_person | ROLE_BASED_GENERIC_PROFILES["student"] |
| 日本人 | vocab_person | NAMED_CHARACTER_PROFILES["鈴木さん"] |
| 中国人 | vocab_person | NAMED_CHARACTER_PROFILES["リンさん"] |
| アメリカ人 | vocab_person | NAMED_CHARACTER_PROFILES["ケリーさん"] |
| 韓国人 | vocab_person | NAMED_CHARACTER_PROFILES["キムさん"] |
| ブラジル人 | vocab_person | generic（国旗バッジ付き汎用人物） |
| ベトナム人 | vocab_person | NAMED_CHARACTER_PROFILES["タノムさん"] |
| スペイン人 | vocab_person | generic（国旗バッジ付き汎用人物） |
| 病院 | vocab_object | ROLE_BASED_GENERIC_PROFILES["doctor"]文脈 |
| named_character_card × 5 | vocab_person | NAMED_CHARACTER_PROFILES 各キャラ |

---

### 残課題2：lesson_01 完成宣言

**lesson_01 は「JSONデータ層」として完成。**
ただし画像生成（残課題1）が未完了のため、「教材として使用可能な完成状態」は残課題1の解消後となる。

次チャットの冒頭で残課題1の状況を確認し、完了していれば lesson_01 完成宣言を行う。

---

### 残課題3：Skill 設計・実装

v10 で設計した 5 ステップの lesson 作成 Skill を実装する。

**前提条件：** lesson_01 完成宣言（残課題2）が完了していること。
lesson_01 の完成版が Skill のゴールデンサンプルになる。

**5ステップの概要（v10 から変更なし）：**
```
STEP 1: PDF「文型」セクション読み取り → アンカー例文確定
STEP 2: PDF「教え方の例N」読み取り → 素材・キャラ・語彙・依存関係抽出
STEP 3: PDF「活動例」「プラスα」「注意」読み取り → catalog エントリ設計
STEP 4: lesson_NN.json 生成
STEP 5: 自動バリデーション（ルールA-1〜A-4・アンカー例文・vocabulary 整合性）
```

---

### 残課題4：lesson_02 の照合・作成

lesson_02.json は未照合（v10 時点から変更なし）。
Skill 実装後は Skill を使って lesson_02 を作成する想定。

---

## 守るべきルール（v11・変更なし）

| ルール | 内容 |
|---|---|
| A-1 | 例文はPDF照合してから書く（照合なしに例文を作らない） |
| A-2 | 登場人物を勝手に作らない |
| A-3 | 教科書の固有名詞は変えない（東西大学・リンさん等） |
| A-4 | 「教え方の例N」で使う素材・キャラクターが、それより前の手順で導入済みかを確認する。依存がある場合は `reusedFrom` に明記する |
| B-9 | 活動例の必須フィールド（活動名・設定・準備物・会話例・fadingStage・catalog ID） |

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | パス | 状態 |
|---|---|---|---|
| `lesson_01.json` | **formatVersion 2.7 / lessonVersion v2.10** | `data/lesson_01.json` | ✅ JSONデータ層完成 |
| `lesson_02.json` | v1.0 | `data/lesson_02.json` | 未照合 |
| `activity_catalog.json` | **v1.5（19件）** | `data/activity_catalog.json` | ✅ 完了 |
| `session_001.json` | formatVersion 1.0 | `data/session_001.json` | ✅ activityId 修正済み |
| `master_prompt_design_guide_v2_4.py` | **v2.5** | `prompts/master_prompt_design_guide_v2_4.py` | ✅ NAMED_CHARACTER_PROFILES 追加済み・移動済み |
| `master_image_registry.json` | — | `data/master_image_registry.json` | ⚠️ 新規語彙の画像未登録 |

---

## 次チャットの作業順序

```
1. 残課題1（画像生成）の状況確認
   → 完了していれば master_image_registry.json の更新確認
   → 完了していなければ image_prompts パイプラインで対応してから再確認

2. lesson_01 完成宣言（残課題1 解消後）

3. Skill 設計・実装（残課題3）
   → lesson_01 をゴールデンサンプルとして投入
   → Skill 出力と lesson_01 を照合して精度検証

4. lesson_02 照合・作成（残課題4）
   → Skill を使って lesson_02 を作成
   → 第2課 PDF をアップロードして照合
```

---

## 次チャットへのアップロード必須ファイル

- この資料（`lesson_master_rules_handoff_v11.md`）
- `lesson_01.json`（Claude Code の `data/lesson_01.json` からダウンロード）
- `第2課.pdf`（Skill 実装後に lesson_02 作成を進める場合）

---

*資料バージョン：v11（2026-05-14）*
*前バージョン：lesson_master_rules_handoff_v10.md*
