# 課マスター作成ルール 引き継ぎ資料 v12
**作成日：2026-05-14**
**前バージョン：lesson_master_rules_handoff_v11.md**
**このチャットの目的：残課題1（画像生成）完了・registry v1.7化・アクティビティカタログ設計**

---

## このチャットで完了・確定したこと

| 項目 | 内容 | 状態 |
|---|---|---|
| image_prompts_lesson1_v8.json 生成 | 新語彙8語+char×5+例文13件=27件のプロンプト作成 | ✅ 完了 |
| master_image_registry.json v1.7 | Claude Code が27件のURL反映・70エントリ化 | ✅ 完了 |
| master_prompt_design_guide_v2_5.py | NAMED_CHARACTER_PROFILES 5名分を新設(PART 2.3) | ✅ 作成済み（要アップロード） |
| 例文画像の整合確認 | ex_L01_001〜015 全15件をv2.10と照合・8件NEW/5件imageRef/2件KEEP | ✅ 確定 |
| activity_catalog スキーマ設計 | prerequisitePatterns追加・targetLessons→validatedForLessons rename | ✅ 設計確定（未実装） |
| act_hajimemashite_conversation 設計 | PDF原典照合・会話モデル・プラスα・注意を確定 | ✅ 設計確定（未実装） |
| act_person_guessing_quiz 設計 | PDF原典照合・人物当てクイズ設計確定 | ✅ 設計確定（未実装） |
| Deep Research プロンプト設計 | 4件のプロンプト作成・優先順位確定 | ✅ 完了（次チャットで実施） |

---

## v11 残課題の解消状況

| 残課題 | 内容 | 状態 |
|---|---|---|
| 残課題1 | 新規語彙の画像生成 | ✅ **完全解消**（27件生成・registry v1.7） |
| 残課題2 | lesson_01 完成宣言 | ⚠️ **保留中**（activity catalog更新後に宣言） |
| 残課題3 | Skill 設計・実装 | 未着手 |
| 残課題4 | lesson_02 照合・作成 | 未着手 |

---

## 確定した設計内容

### activity_catalog スキーマ変更（未実装）

```json
// 変更1: フィールド名変更（全18件に適用）
"targetLessons" → "validatedForLessons"
// 意味: 事前定義ではなく「実績として使われた課」の記録

// 変更2: 全エントリに追加（新規2件は必須・既存18件は今後順次）
"prerequisitePatterns": ["p1", "p2"]
// 意味: このアクティビティを使うのに必要な文型条件
// 推薦ロジック: session で扱った patterns ⊇ prerequisitePatterns → 候補に表示
```

### act_hajimemashite_conversation（未実装・catalog追加待ち）

```json
{
  "id": "act_hajimemashite_conversation",
  "name": "会話「はじめまして」",
  "fadingStage": "stage4-5",
  "prerequisitePatterns": ["p1", "p2", "p3"],
  "validatedForLessons": [1],
  "setup": {
    "format": "ペアワーク（マンツーマンは教師↔学習者）",
    "modelFirst": "教師が一人二役で会話モデルを示す",
    "mediaOptions": ["動画・音声（あれば）", "会話場面の絵カード", "会話モデルスライド"]
  },
  "conversationModel": {
    "A_line1": "はじめまして。___です。___（国籍）です。どうぞよろしく。",
    "B_line1": "はじめまして。___です。___から来ました。どうぞよろしく。",
    "A_line2": "___さんは___（職業）ですか。",
    "B_line2": "はい、___です。___さんは？",
    "A_line3": "わたしは___です。___（所属）の___です。"
  },
  "variations": [
    "名刺を使ったやりとり（ビジネス系クラス向け）",
    "簡単な名刺を作らせてから練習",
    "相手を次々と変えて繰り返し練習"
  ],
  "plusAlpha": [
    "「〜から来ました」は自己紹介表現としてそのまま教える",
    "教師も学習者の場合「先生＝教師」を伝え自己紹介では「先生」を使わないよう注意",
    "AもBも教師の場合は「わたしも教師です」＋「も」の使い方を教える"
  ],
  "caution": [
    "自由な自己紹介をさせるといろいろなバリエーションが出るのでこの例にこだわらない",
    "「〜さんは？」の文末は上がるイントネーションに注意させる"
  ],
  "materialNeeds": ["special_slide（会話モデル）", "named_character_card（モデル提示用）"]
}
```

### act_person_guessing_quiz（未実装・catalog追加待ち）

```json
{
  "id": "act_person_guessing_quiz",
  "name": "人物当てクイズ",
  "fadingStage": "stage3-4",
  "prerequisitePatterns": ["p1", "p2"],
  "validatedForLessons": [1],
  "setup": {
    "format": "教師主導→学習者同士",
    "method": "人物写真・絵カードの一部を隠し「〜ですか」で質問して当てる"
  },
  "teacherSteps": [
    "絵カードの一部を隠して提示",
    "「日本人ですか」「先生ですか」などヒントを出す",
    "学習者が「〜ですか」で質問→当てる"
  ],
  "variations": [
    "スターやスポーツ選手など学習者が知っている有名人を使う",
    "学校のスタッフや先生の写真を使う",
    "ペアで自分の家族・友達の写真を見せ合い「これはどなたですか」と質問"
  ],
  "plusAlpha": [
    "クラスメートについては「だれですか」でなく「どなたですか」を使う",
    "「〜じゃありません」と「〜ではありません」両方教えておく"
  ],
  "caution": [
    "質問文に続けてすぐ答えを言わない—学習者の反応（うなずき・首振り）を待ってから答える",
    "学習者の反応をよく見るようにする"
  ],
  "materialNeeds": ["named_character_card", "auto_generated_vocab（人物・職業）"]
}
```

### selectedId の設計方針（確定）

```
lesson_NN.json  → main activity の selectedId は持たない
session_NNN.json → 教師が選んだ selectedId を保持

UI設計: prerequisitePatterns でフィルターした候補一覧
      + validatedForLessons の実績
      + 将来的な評価スコア
      → 教師が選択
```

---

## ⚠️ 残課題（次チャット以降で対応）

### 残課題A：activity_catalog 更新（Claude Code に委託）

**前提条件：** なし（すぐ実施可能）

```
以下の変更を data/activity_catalog.json に適用してください：

1. スキーマ変更（全18件）
   - "targetLessons" フィールドを "validatedForLessons" に rename
   - 既存18件には prerequisitePatterns: [] を追加（空配列・今後順次入力）

2. 新規追加（2件）
   - act_hajimemashite_conversation（prerequisitePatterns: ["p1","p2","p3"]）
   - act_person_guessing_quiz（prerequisitePatterns: ["p1","p2"]）
   - 詳細は handoff_v12 の設計内容セクションを参照

3. _meta 更新
   - version を更新
   - changes に更新ログを追記

4. 完了後に .js ファイルを再生成
```

### 残課題B：lesson_01 完成宣言

**前提条件：** 残課題A（catalog更新）完了後

lesson_01 は「JSONデータ層として完成」。
残課題Aの解消をもって「教材として使用可能な完成状態」を宣言する。

### 残課題C：Deep Research の実施（次チャットで実施）

優先度・プロンプト詳細は下記セクション参照。
リサーチ結果をもとに activity_catalog を拡充する。

### 残課題D：Skill 設計・実装

**前提条件：** 残課題B（lesson_01 完成宣言）完了後

lesson_01 の完成版が Skill のゴールデンサンプルになる。

```
STEP 1: PDF「文型」セクション読み取り → アンカー例文確定
STEP 2: PDF「教え方の例N」読み取り → 素材・キャラ・語彙・依存関係抽出
STEP 3: PDF「活動例」「プラスα」「注意」読み取り → catalog エントリ設計
STEP 4: lesson_NN.json 生成
STEP 5: 自動バリデーション（ルールA-1〜A-4・アンカー例文・vocabulary 整合性）
```

### 残課題E：lesson_02 照合・作成

**前提条件：** 残課題D（Skill実装）完了後

---

## Deep Research プロンプト（次チャットで実施）

### 優先順位

| 優先度 | Research | 理由 |
|---|---|---|
| 🔴 最優先 | Research 1（N5文法パターン別） | catalog拡充に直結 |
| 🔴 最優先 | Research 2（オンラインマンツーマン） | 授業形態に直結 |
| 🟡 次点 | Research 3（TPR・ゲーム・タスク） | 活動タイプの理論補強 |
| 🟢 将来 | Research 4（推薦システム設計） | Skill完成後に活用 |

### Research 1：N5文法パターン別アクティビティ調査

```
初級日本語（N5レベル・第1〜15課相当）の授業で使えるコミュニカティブ・
アクティビティを、文法パターン別に網羅的に調査してください。

【調査対象の文法パターン（優先度順）】
1. 〜は〜です／〜じゃありません（名詞文・否定）
2. 〜ですか（疑問文・yes/no）
3. これ／それ／あれ・この／その／あの（指示語）
4. 〜に〜があります／います（存在・場所）
5. 〜時〜分です（時刻）
6. 〜円です（数・金額）
7. 〜語で〜は何ですか（語彙確認）
8. 〜てください（指示・依頼）
9. 〜たいです（希望）
10. 〜ができます（可能）

【各アクティビティについて整理する項目】
- アクティビティ名（日本語・英語）
- 活動タイプ（TPR／ゲーム／ロールプレイ／タスク／クイズ／ドリル 等）
- 概要（3〜5行）
- 前提となる文法・語彙条件（prerequisitePatterns）
- 準備物・教材
- 所要時間の目安
- スキャフォールディング段階（高支援〜自律）
- 出典・参考文献

【特に重視する観点】
- 語彙数が極めて少ない完全初心者でも参加できること
- 言語産出（スピーキング）を引き出せること
- 繰り返し練習が自然にできる構造
- ゲーム性・動機づけが高いもの

できる限り多くのアクティビティを列挙してください（目標30件以上）。
学術論文・教師向け実践資料・CLT（コミュニカティブ言語教授法）の
文献も参照してください。
```

### Research 2：オンライン・マンツーマン日本語授業のアクティビティ設計

```
ビデオ通話（Zoom・Google Meet等）を使ったマンツーマン日本語授業に
特化したアクティビティを調査・整理してください。

【授業形態の前提】
- 教師1名・学習者1名（マンツーマン）
- ビデオ通話環境（画面共有・チャット・ホワイトボード機能あり）
- 学習者レベル：完全初心者〜中級（N5〜N3）
- 学習者年齢：混在（子ども〜社会人）

【調査内容】
1. マンツーマン授業でのみ／特に有効なアクティビティ
2. ビデオ通話ツールの機能を活かしたアクティビティ
   - 画面共有（スライド・画像・Google Maps等）
   - バーチャル背景
   - チャット機能
   - リアクション・スタンプ機能
   - 共同ホワイトボード（Jamboard・Miro等）
3. 対面授業からオンラインへの変換ノウハウ
4. 教材ゼロ・準備最小限で実施できるアクティビティ（no-prep）

【各アクティビティについて整理する項目】
- アクティビティ名
- 使用ツール・機能
- 手順（教師・学習者それぞれの動作）
- 対面との差異・オンラインならではの利点
- 必要な語彙・文法レベル
- 所要時間

文献・実践報告・オンライン語学教育の研究を参照してください。
```

### Research 3：TPR・ゲーム型・タスク型の初級言語教育アクティビティ総合調査

```
以下の3つのアプローチについて、初級言語教育（特に初期段階・
完全初心者）における理論的背景・代表的活動・実践上の知見を
網羅的に調査してください。

【アプローチ①：TPR（全身反応教授法）とその発展形】
- TPRの理論的背景（Asher理論）と有効性のエビデンス
- 基本TPRアクティビティの具体例
- TPR-S（Total Physical Response Storytelling）
- TPRのオンライン・マンツーマン適用方法
- 年齢別（子ども／大人）の適用上の注意

【アプローチ②：ゲーム型アクティビティ（Language Games）】
- 初級に適したゲームの類型（記憶ゲーム・推測ゲーム・
  ビンゴ・カードゲーム・クイズ等）
- 各ゲームの言語習得上の効果
- ゲームを語彙・文法練習に転用する設計原則
- マンツーマン環境でのゲーム実施の工夫

【アプローチ③：タスク基盤型教授法（TBLT）の初級適用】
- 初級学習者向けタスクの設計原則
- 情報ギャップ活動の具体例（初級レベル）
- pre-task／during-task／post-task の構造
- 完全初心者への足場掛け（scaffolding）方法

各アプローチについて：理論背景・代表的アクティビティ20件以上・
実践上の注意点・参考文献を含めてください。
```

### Research 4：語学教育アクティビティの評価・推薦システムの設計知識

```
語学教育用のアクティビティカタログを構築し、授業条件に応じて
適切なアクティビティを自動推薦するシステムを設計するための
知識・先行事例を調査してください。

【調査内容】

1. アクティビティ分類フレームワーク
   - 語学教育における活動分類の主要な体系
   - アクティビティのタグ付け・メタデータ設計の事例

2. アクティビティ有効性の評価指標
   - 言語習得研究で使われる有効性評価軸
   - 教師評価・学習者評価の収集方法
   - 既存の語学教材評価フレームワーク（ACTFL・CEFRベース等）

3. 文法前提条件（prerequisite）の記述方法
   - 「この活動には〇〇の文法知識が必要」を
     体系的に表現する方法論
   - シラバス設計との連携方法

4. 教育データを活用した推薦システムの先行事例
   - 語学教育分野での推薦システム・アダプティブラーニングの事例
   - 教師の意思決定支援ツールの設計原則
   - 小規模データから有用な推薦を導く方法

5. 日本語教育のアクティビティ・データベースの既存事例
   - JALT・国際交流基金・文化庁等の公開リソース

参考文献・論文・実践報告を可能な限り含めてください。
```

---

## 守るべきルール（v12・変更なし）

| ルール | 内容 |
|---|---|
| A-1 | 例文はPDF照合してから書く（照合なしに例文を作らない） |
| A-2 | 登場人物を勝手に作らない |
| A-3 | 教科書の固有名詞は変えない（東西大学・リンさん等） |
| A-4 | 「教え方の例N」で使う素材・キャラクターが、それより前の手順で導入済みかを確認する |
| B-9 | 活動例の必須フィールド（活動名・設定・準備物・会話例・fadingStage・catalog ID） |

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | パス | 状態 |
|---|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / lessonVersion v2.10 | `data/lesson_01.json` | ✅ JSONデータ層完成 |
| `lesson_02.json` | v1.0 | `data/lesson_02.json` | 未照合 |
| `activity_catalog.json` | v1.4（18件） | `data/activity_catalog.json` | ⚠️ スキーマ変更・2件追加 未実装 |
| `session_001.json` | formatVersion 1.0 | `data/session_001.json` | selectedId: null（仕様） |
| `master_image_registry.json` | **v1.7（70件）** | `data/master_image_registry.json` | ✅ 27件URL反映済み |
| `master_prompt_design_guide_v2_5.py` | v2.5 | `prompts/master_prompt_design_guide_v2_5.py` | ⚠️ 作成済みだがClaude Codeへの適用要確認 |
| `image_prompts_lesson1_v8.json` | v1.0 | `prompts/image_prompts_lesson1_v8.json` | ✅ 27件プロンプト完成 |

---

## 次チャットの作業順序

```
1. Claude Code に残課題Aを委託
   → activity_catalog v1.5 へ更新
   （スキーマ変更・act_hajimemashite_conversation・act_person_guessing_quiz追加）

2. lesson_01 完成宣言（残課題B）
   → catalog更新確認後に宣言

3. Deep Research 実施（残課題C）
   → Research 1・2 を優先実行
   → ユーザー用意の資料と合わせて activity_catalog を拡充

4. Skill 設計・実装（残課題D）
   → lesson_01 完成版をゴールデンサンプルとして使用

5. lesson_02 照合・作成（残課題E）
   → Skill を使って作成
```

---

## 次チャットへのアップロード必須ファイル

- この資料（`lesson_master_rules_handoff_v12.md`）
- ユーザー用意のアクティビティ資料（Deep Research と合わせて使用）

---

*資料バージョン：v12（2026-05-14）*
*前バージョン：lesson_master_rules_handoff_v11.md*
