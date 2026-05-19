# Deep Research 統合まとめ資料 v1.1
**作成日：2026-05-14**
**目的：activity_catalog.json 拡充・後続課作成の参照資料（ナレッジ登録用）**

### 更新履歴
- **v1.1（2026-05-14）**: catalog v1.6 実装内容に同期。`purpose`フィールド表記を全29件分 `skillFocus` + `activityType` に分離。Section 5の修正事項を「実装済」マークに変更。
- **v1.0（2026-05-14）**: 初版。29件のアクティビティ詳細・6つの設計決定事項・後続課への申し送りを記録。

---

## 1. ドキュメント概要

### 1.1 参照元資料
| ID | ファイル名 | 内容 |
|---|---|---|
| R1 | 初級日本語アクティビティ調査報告.docx | N5文法パターン別アクティビティ（10パターン×4件＝40件） |
| R2 | オンライン日本語マンツーマン授業アクティビティ.docx | ビデオ通話ツール機能別アクティビティ（約20件） |
| R3 | 初級言語教育アプローチ調査.docx | TPR23件・言語ゲーム23件・TBLT21件 |
| R4 | 語学教育アクティビティ推薦システム設計調査.docx | 推薦システム設計理論・メタデータ設計 |

### 1.2 このドキュメントの使い方
- **今すぐ使う（lesson_01 catalog拡充）**：Section 3〜5
- **lesson_02以降の課を作るとき**：Section 6
- **推薦ロジック実装時**：Section 7

---

## 2. 確定した設計決定事項（①〜⑥）

| # | 論点 | 決定 | 理由 |
|---|---|---|---|
| ① | act_passport_controlの扱い | lesson_01簡略版として登録（年齢欄なし） | 名前・国籍・職業・所属だけでも活動の本質（本人確認Q&A）が成立するため |
| ② | act_google_maps_tourの扱い | lesson_02以降に移管。lesson_01では使わない | 活動の60%以上が〜があります・方向表現等の未習文型に依存するため |
| ③ | 1対1オンライン不向き3件 | 除外（走るディクテーション・ボード・レース・共通点探し） | 物理移動・複数人という構造が不可欠で、適応させると別の活動になるため |
| ④ | prerequisitePatternsの値体系 | grammarConceptベースIDに統一 | lesson_01.jsonにgammarConceptフィールドが既存。lesson番号依存を排除し推薦ロジックを汎用化 |
| ⑤ | スキャフォールディング度フィールド | 既存stageフィールドで代替（新フィールド不要） | stageは5段階で3段階のscaffoldingより粒度が細かく情報量が多い |
| ⑥ | Research4由来の追加メタデータ | interactionPatternのみ今すぐ追加、他は後日 | 1対1フィルターとして即機能するinteractionPatternのみ先行。詳細はSection 7参照 |

---

## 3. カタログスキーマ更新仕様

### 3.1 prerequisitePatterns grammarConcept ID体系

#### 確定済み（lesson_01・lesson_02）
| grammarConceptID | 対応文型 | 課 |
|---|---|---|
| `noun_predicate_affirmative` | 〜は〜です | lesson_01 p1 |
| `noun_predicate_question` | 〜ですか／はい・いいえ | lesson_01 p2 |
| `noun_no_affiliation` | 〜の〜です（所属） | lesson_01 p3 |
| `kosoado_pronoun_thing` | これ・それ・あれ | lesson_02 p1 |
| `interrogative_what` | 何ですか | lesson_02 p2 |
| `noun_no_possession` | 〜の〜です（所有） | lesson_02 p3 |
| `kosoado_attributive` | この・その・あの+N | lesson_02 p5 |
| `interrogative_which_thing` | どれ | lesson_02 p4 |
| `interrogative_which_attributive` | どの+N | lesson_02 p6 |

#### 暫定予約（lesson_03以降・課番号未確定）
以下はlesson_NN.json作成時に正式確定すること。

| grammarConceptID（暫定） | 対応文型 |
|---|---|
| `existence_location` | 〜に〜があります／います |
| `time_expression_clock` | 〜時〜分です |
| `amount_expression` | 〜円です |
| `vocabulary_inquiry_language` | 〜語で〜は何ですか |
| `te_form_request` | 〜てください |
| `desire_expression` | 〜たいです |
| `potential_expression` | 〜ができます |

#### 命名規則
`{品詞/構造}_{意味/機能}_{形}` の形式。例：`noun_predicate_affirmative`
- 小文字・アンダースコア区切り
- 日本語文法用語より英語の機能記述を優先（推薦ロジックで英語キーが扱いやすい）

---

### 3.2 stageフィールドとスキャフォールディング対応表

Research 1 の表記とcatalogのstageフィールドの対応関係。

| Research 1 表記 | catalog stage | 教師介入量 | 学習者の産出 |
|---|---|---|---|
| 高支援 | stage1, stage2 | 80〜100% | リピート・身体反応のみ |
| 中（選択肢提示） | stage3 | 40〜60% | 選択肢から選ぶ・部分産出 |
| 自律 | stage4, stage5 | 10〜30% | 自由産出・タスク遂行 |

---

### 3.3 interactionPatternフィールド仕様

```json
"interactionPattern": "pair"
```

| 値 | 意味 | このシステムでの該当 |
|---|---|---|
| `"pair"` | 2人（教師↔学習者） | ほぼ全件（1対1授業のため） |
| `"individual"` | 学習者単独 | 自習・宿題系アクティビティ |
| `"group"` | 3人以上 | 原則カタログに登録しない |

**運用ルール：** `"group"` のアクティビティは推薦候補から除外するフィルターを将来実装する。

---

### 3.3-bis skillFocus / activityType フィールド仕様（catalog v1.6で追加）

**`purpose` フィールドを廃止**し、軸を分離した2フィールドに置換しました。

```json
"skillFocus":   ["speaking", "listening", "reading", "writing"]
"activityType": ["tpr", "game", "roleplay", "task", "drill",
                  "quiz", "discussion", "presentation", "feedback_technique"]
```

#### skillFocus（学習者が主に使うスキル）
| 値 | 意味 |
|---|---|
| `speaking` | 発話・産出 |
| `listening` | 聴解 |
| `reading` | 読解 |
| `writing` | 書き取り・記述 |

#### activityType（活動の形式・構造）
| 値 | 意味 | 該当件数（v1.6時点） |
|---|---|---|
| `tpr` | 全身反応教授法 | 10件 |
| `game` | ゲーム型 | 18件 |
| `roleplay` | 役を演じる | 4件 |
| `task` | タスク型 | 11件 |
| `drill` | ドリル | 7件 |
| `quiz` | クイズ | 4件 |
| `discussion` | ディスカッション | 1件 |
| `presentation` | プレゼンテーション | 1件 |
| `feedback_technique` | 教師の指導技術 | 1件 |

**設計思想：** Research 4 が推奨するメタデータ分離設計に準拠。「スピーキング練習」と「ゲーム形式」を独立にフィルタリングできる。

---

### 3.4 既存28件のprerequisitePatterns更新方針 ✅ catalog v1.6で実装済

既存28件のうち10件（新規追加分）は `["p1", "p2"]` 等のローカルIDで登録済み。
以下の対応表で grammarConcept IDへ変換が必要。

| 旧値 | 新値 |
|---|---|
| `"p1"` | `"noun_predicate_affirmative"` |
| `"p2"` | `"noun_predicate_question"` |
| `"p3"` | `"noun_no_affiliation"` |

影響範囲：act_hajimemashite_conversation・act_person_guessing_quiz・act_celebrity_party・act_mystery_guest・act_identity_guessing・act_passport_control・act_virtual_treasure・act_reaction_quiz・act_hot_seat の9件。

---

## 4. 今回追加アクティビティ詳細（29件）

> **v1.1 更新メモ：** v1.0で `**purpose**:` と記載していた箇所は、catalog v1.6で `skillFocus` + `activityType` の2フィールドに分離されました。本セクションは v1.1 でこの新スキーマに合わせて更新済です。

追加対象の内訳：
- Research 3 TPR：7件
- Research 3 言語ゲーム：8件（10件－除外2件）
- Research 3 TBLT：6件（7件－除外1件）
- Research 2 オンライン特化：6件
- Research 1 p1/p2補完：2件

---

### 4.1 Research 3：TPR（7件）

TPRアクティビティの共通仕様：
- `prerequisitePatterns: []`（grammar-agnostic・語彙のみ必要）
- `interactionPattern: "pair"`
- `defaultMaterialTypes: ["none"]`
- `contentRequirement.judgment: "not_needed"`
- `source: "初級言語教育アプローチ調査.docx §1.4"`

---

#### act_simon_says（サイモン・セズ）
- **nameEn**: Simon Says
- **stage**: [stage1, stage2]
- **level**: [N5, N4, N3]
- **skillFocus**: [listening]
- **activityType**: [tpr]
- **duration**: 5-8min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet]
- **description**: 「サイモンが言います」という前置きがある命令のみ動作し、ない命令では静止するTPR定番ゲーム。聴解への集中力を高める。オンラインではカメラ前でのジェスチャーで代用。
- **procedure**:
  1. ルール説明：「先生が『サイモンが言います、〜てください』と言ったら動いてください。先生だけが言ったら動かないでください」
  2. ゆっくりした命令から始め、慣れたら速度を上げる
  3. 「違う動作をした／動いてしまった」場合のアウトを演出してゲーム性を高める
- **teacherTip**: 初回はわざとゆっくり・明確に。慣れてきたら「サイモンが言います」の省略タイミングを予測させないよう混ぜる速度を上げる。オンラインでは身体全体が映るようカメラを引いてもらう。
- **stt_ttt_ratio**: STT 10%（反応のみ）
- **lesson1Note**: 〜てください（p8相当）が未習のため、英語や日本語の動詞原形で指示して問題ない。語彙のウォームアップとして有効。
- **usedInLesson1**: true

---

#### act_simon_lies（サイモン・ライズ）
- **nameEn**: Simon Lies
- **stage**: [stage2]
- **level**: [N5, N4]
- **skillFocus**: [listening]
- **activityType**: [tpr]
- **duration**: 5-8min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet]
- **description**: 教師の言葉と動作が一致している場合のみ模倣し、不一致（言葉とは違う動作）の場合は静止する。言語と行動の対応に高い注意力を要求するサイモン・セズの発展版。
- **procedure**:
  1. ルール説明：「先生の言葉と動作が同じときだけ動いてください。違うときは動かないでください」
  2. 最初は一致させて学習者を慣れさせる
  3. 突然不一致（「ジャンプ」と言いながら座る）を混ぜる
- **teacherTip**: サイモン・セズより難度が高いため、act_simon_saysの後に行う。「引っかかること」を楽しむ雰囲気作りが重要。
- **stt_ttt_ratio**: STT 5%
- **usedInLesson1**: true

---

#### act_finger_tpr（フィンガーTPR）
- **nameEn**: Finger TPR
- **stage**: [stage1]
- **level**: [N5]
- **skillFocus**: [listening]
- **activityType**: [tpr]
- **duration**: 5min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet, カメラ]
- **description**: 指を「人」に見立て、机の上・箱の中・画面内のオブジェクトに対して前置詞（上・下・右・左・中）や動作（走る・ジャンプ）を表現する。狭いスペースで実施できるオンライン向きのTPR変形版。
- **procedure**:
  1. 教師が指を「歩かせる」動作を見せてルールを示す
  2. 命令を出す（例：「右に歩いてください」）
  3. 学習者がカメラ前で指を使って動作を再現する
- **teacherTip**: カメラに対して手の動きが見えやすいアングルを最初に確認する。位置語彙（上・下・右・左・隣・中）の導入直後のTPR確認として最適。
- **stt_ttt_ratio**: STT 5%
- **usedInLesson1**: true

---

#### act_action_song（アクション・ソング）
- **nameEn**: Action Song
- **stage**: [stage1]
- **level**: [N5, N4]
- **skillFocus**: [listening]
- **activityType**: [tpr]
- **duration**: 5-7min
- **preparation**: 歌の音源（任意）またはア・カペラで可
- **tools**: [Zoom, Google Meet]
- **description**: 歌詞に合わせて身体を動かす。"Head, Shoulders, Knees and Toes"（あたま・かた・ひざ・あし）のような身体部位の歌、または"If You're Happy and You Know It"などを日本語版で行う。リズムが記憶の定着を加速する。
- **procedure**:
  1. 教師がお手本を見せる（歌いながら動作）
  2. 学習者と一緒に動作を合わせながら歌う
  3. 速度を上げてチャレンジモードにする
- **teacherTip**: Brain Breakとしても機能する。集中力が切れたタイミングに挟む使い方が効果的。語彙導入→アクション・ソングで定着、という流れが定番。
- **stt_ttt_ratio**: STT 40%（歌いながら動く）
- **usedInLesson1**: true

---

#### act_recipe_mime（料理レシピ・マイム）
- **nameEn**: Recipe Mime
- **stage**: [stage2]
- **level**: [N5, N4]
- **skillFocus**: [listening]
- **activityType**: [tpr]
- **duration**: 8-10min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet]
- **description**: 架空の料理を作る一連の動作（卵を割る・かき混ぜる・味見する）を教師の指示に従って演じるTPR。料理に関する動詞を身体で覚える。
- **procedure**:
  1. 「今から料理を作ります」と宣言
  2. 一連の動作を命令する（「卵を割ってください」「混ぜてください」「火をつけてください」）
  3. 学習者が動作を演じる
  4. 慣れたら学習者が命令側に交代
- **teacherTip**: オンラインでは実物の食材がなくても問題ない。「イメージの中で作る」という指示で成立。〜てください（将来のp8）との橋渡しになる活動。
- **stt_ttt_ratio**: STT 30%
- **usedInLesson1**: false
- **lesson1Note**: 動詞表現が必要なため lesson_08以降推奨。ウォームアップとして語彙なしで動作のみ行う場合はlesson_01でも可。

---

#### act_multistep_seq（多段階シーケンス）
- **nameEn**: Multi-step Sequences
- **stage**: [stage2, stage3]
- **level**: [N5, N4]
- **skillFocus**: [listening]
- **activityType**: [tpr]
- **duration**: 8-10min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet]
- **description**: 「本を開いて、鉛筆を持って、丸を描いてください」のように複数の命令を連続して出し、学習者が順番通りに全て実行する。作業記憶を鍛えながら複合的な指示理解を練習する。
- **procedure**:
  1. 2ステップから始める（「〜して、〜してください」）
  2. 慣れたら3〜4ステップに増やす
  3. 実行後に「何をしましたか」と振り返りで産出を促す
- **teacherTip**: ステップ数を増やすことで難度を調整できる万能の難度スライダー型活動。記憶への負荷を意識的に管理する。
- **stt_ttt_ratio**: STT 15%（振り返り時のみ）
- **usedInLesson1**: true

---

#### act_treasure_hunt_tpr（TPRトレジャーハント）
- **nameEn**: Treasure Hunt (TPR)
- **stage**: [stage2]
- **level**: [N5, N4]
- **skillFocus**: [listening, speaking]
- **activityType**: [tpr]
- **duration**: 8-10min
- **preparation**: なし（学習者の自宅環境を使用）
- **tools**: [Zoom, Google Meet, カメラ]
- **description**: 「黄色いものを持ってきてください」「小さいものを3つ持ってきてください」などの指示に従い、学習者が自室内で物を探して持ってくる。形容詞・色・数のTPR練習。オンラインならではの「実生活空間の活用」。
- **procedure**:
  1. 「部屋の中から〜を探して、カメラに見せてください」と指示
  2. 学習者が探してカメラに見せる
  3. 「それは何ですか」と確認して語彙の産出を促す
- **teacherTip**: act_virtual_treasureと組み合わせると効果的。「見つけたものについて話す」まで発展させると stage3へと橋渡しできる。
- **stt_ttt_ratio**: STT 30%
- **usedInLesson1**: true

---

### 4.2 Research 3：言語ゲーム（8件）

言語ゲームの共通仕様：
- `interactionPattern: "pair"`
- `source: "初級言語教育アプローチ調査.docx §2.4"`

---

#### act_two_truths（二つの真実、一つの嘘）
- **nameEn**: Two Truths and a Lie
- **stage**: [stage4, stage5]
- **level**: [N5, N4, N3]
- **skillFocus**: [speaking, listening]
- **activityType**: [game]
- **prerequisitePatterns**: ["noun_predicate_affirmative", "noun_predicate_question"]
- **duration**: 10-15min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet]
- **description**: 自分について2つの真実と1つの嘘を述べ、相手が「どれが嘘か」を質問を通じて見抜くゲーム。N5では「私は猫がいます」のような単純な〜は〜です文で実施。嘘の発見と真実の確認に〜ですか疑問文を自然に使う。
- **procedure**:
  1. 教師がモデルを示す（「私はXXXです。私はYYYです。私はZZZです。どれが嘘ですか？」）
  2. 学習者が自分の3文を考える（チャットで文字確認も可）
  3. 教師が「〜ですか」で質問して嘘を見抜く
  4. 役割を交代する
- **teacherTip**: 嘘の選択肢を「職業・国籍・所属」に絞るとlesson_01語彙を最大限活用できる。学習者が考える時間（30秒程度）をきちんと確保する。
- **contentRequirement**: {"judgment": "not_needed", "reason": "口頭のみで完結"}
- **stt_ttt_ratio**: STT 65%
- **usedInLesson1**: true

---

#### act_memory_matching（記憶マッチング）
- **nameEn**: Memory Matching
- **stage**: [stage2, stage3]
- **level**: [N5, N4]
- **skillFocus**: [listening, speaking]
- **activityType**: [game]
- **prerequisitePatterns**: []
- **duration**: 10-15min
- **preparation**: オンラインホワイトボード（Miro・Padlet・Zoomホワイトボード）に裏返しカードを事前配置
- **tools**: [Zoom, Google Meet, オンラインホワイトボード（Miro/Padlet）]
- **description**: 裏向きに並べた「絵カード」と「単語カード」のペアを1枚ずつめくって一致を探す。一致したら「〜は〜です」で文を作るルールを加えると産出練習になる。
- **procedure**:
  1. ホワイトボード上に絵カード（裏向き）と単語カード（裏向き）をランダム配置
  2. 学習者が2枚を選んでめくる
  3. 一致したら「〜は〜です」で文を作成
  4. 不一致なら元に戻して次の番
- **teacherTip**: Jamboard終了後はMiro（無料プランあり）またはZoomのホワイトボード機能で代替可能。カードの準備に時間がかかるので事前に作成しておく。
- **contentRequirement**: {"judgment": "required", "reason": "ホワイトボード上のカード配置が必要"}
- **defaultMaterialTypes**: ["activity_content"]
- **stt_ttt_ratio**: STT 50%
- **usedInLesson1**: true

---

#### act_vocab_bingo（語彙ビンゴ）
- **nameEn**: Vocabulary Bingo
- **stage**: [stage2, stage3]
- **level**: [N5, N4]
- **skillFocus**: [listening]
- **activityType**: [game]
- **prerequisitePatterns**: []
- **duration**: 10-15min
- **preparation**: 語彙ビンゴカード（学習者用）を事前に共有または授業中に作成
- **tools**: [Zoom, Google Meet, 画面共有]
- **description**: 語彙が書かれたマスに、教師が読み上げる定義・特徴・絵カードと一致するものをマークする。単語と意味の結びつきを強化する。オンラインではチャットに「BINGO！」と送る形式にするとゲーム性が増す。
- **procedure**:
  1. 学習者にビンゴカードを渡す（事前PDF共有またはホワイトボードで作成）
  2. 教師が定義・絵・例文等のヒントを出す（単語は言わない）
  3. 学習者が合致する単語をマークする
  4. ビンゴになったらチャットに送信
- **teacherTip**: 読み上げるヒントを「定義→例文→絵」の順に3段階出すことで、わからなくても最終的に参加できる足場が作れる。
- **contentRequirement**: {"judgment": "required", "reason": "ビンゴカードが必要"}
- **defaultMaterialTypes**: ["activity_content"]
- **stt_ttt_ratio**: STT 30%
- **usedInLesson1**: true

---

#### act_twenty_questions（20の質問）
- **nameEn**: Twenty Questions
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [game]
- **prerequisitePatterns**: ["noun_predicate_question"]
- **duration**: 10-15min
- **preparation**: なし（no-prep）
- **tools**: [Zoom, Google Meet]
- **description**: 教師が「動物・植物・物・人」のいずれかを思い浮かべ、学習者が最大20回のYes/No質問で正解を導くゲーム。疑問文の集中練習として機能する。act_identity_guessing（人物版）のより広い概念版。
- **procedure**:
  1. 教師が何かを決める
  2. 学習者が「〜ですか」でYes/No質問（最大20回）
  3. 教師が「はい、そうです」「いいえ、違います」で答える
  4. 正解または20回終了で次のラウンド
- **teacherTip**: 最初は答えを絞りやすい「職業カテゴリ（医者・先生・学生）」など狭い範囲から始める。慣れたら「動物→食べ物→有名人」と広げる。チャットに「残り〇回」と書いて緊張感を演出。
- **contentRequirement**: {"judgment": "not_needed", "reason": "口頭のみで完結"}
- **stt_ttt_ratio**: STT 70%
- **usedInLesson1**: true

---

#### act_pictionary（ピクショナリー）
- **nameEn**: Pictionary
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [game]
- **prerequisitePatterns**: []
- **duration**: 10-15min
- **preparation**: オンラインホワイトボードまたはZoomホワイトボード
- **tools**: [Zoom, Google Meet, オンラインホワイトボード]
- **description**: 出題者が語彙をホワイトボードに絵だけで描き、回答者が「〜ですか」で確認しながら言語化する。非言語情報を日本語に変換するトレーニング。語彙の視覚的定着に効果的。
- **procedure**:
  1. 出題語彙をチャット（相手に見えないよう）で教師が管理
  2. 描く側（学習者または教師）がホワイトボードに絵を描く
  3. 回答者が「〜ですか」と確認しながら当てる
  4. 役割を交代
- **teacherTip**: Zoomのホワイトボード機能は画面共有不要で両者が描ける。絵が苦手な学習者には「上手に描かなくていい」と伝えてハードルを下げる。
- **contentRequirement**: {"judgment": "not_needed", "reason": "ホワイトボードはツール機能で完結"}
- **stt_ttt_ratio**: STT 60%
- **usedInLesson1**: true

---

#### act_grammar_auction（文法オークション）
- **nameEn**: Grammar Auction
- **stage**: [stage3]
- **level**: [N5, N4]
- **skillFocus**: [reading, speaking]
- **activityType**: [game]
- **prerequisitePatterns**: ["noun_predicate_affirmative", "noun_predicate_question"]
- **duration**: 15-20min
- **preparation**: 正文・誤文混在リスト（スライドまたは画面共有）・架空の予算設定
- **tools**: [Zoom, Google Meet, 画面共有]
- **description**: 複数の文（正文と誤文が混在）を提示し、「正しいと思う文」を架空の予算内で競り落とす。文法の正確性を意識させる。競り落とした文が実は誤文だったときの「損失」が学習を深める。
- **procedure**:
  1. 学習者に架空の予算を伝える（例：1000コイン）
  2. 各文を1つずつ提示し「これに何コイン賭けますか」と聞く
  3. 全文終了後に正解を発表し、正文に賭けた分は回収、誤文に賭けた分は没収
  4. 誤文について「なぜ間違いか」を一緒に確認する
- **teacherTip**: 誤文は学習者がよく犯すエラーから作ると精度が高まる。採点は即時フィードバックが重要。マンツーマンでは「賭け金」は架空で十分ゲーム性が出る。
- **contentRequirement**: {"judgment": "required", "reason": "正誤文リストのスライドが必要"}
- **defaultMaterialTypes**: ["activity_content"]
- **stt_ttt_ratio**: STT 50%
- **usedInLesson1**: true

---

#### act_odd_one_out（仲間外れ）
- **nameEn**: Odd One Out
- **stage**: [stage3]
- **level**: [N5, N4]
- **skillFocus**: [speaking]
- **activityType**: [game]
- **prerequisitePatterns**: []
- **duration**: 8-12min
- **preparation**: なし（no-prep）または語彙カード
- **tools**: [Zoom, Google Meet, チャット（語彙提示用）]
- **description**: 4つの語彙を提示し「仲間外れ」を選んでその理由を説明する。（例：医者・先生・会社員・リンゴ → リンゴが仲間外れ・理由：人ではないから）。語彙の意味的ネットワークの構築に効果的。
- **procedure**:
  1. チャットに4単語を送る（またはスライドで提示）
  2. 学習者が「〜は仲間外れです」と答える
  3. 「なぜですか」と理由を問う
  4. 別のセットに移る
- **teacherTip**: 1つの「正解」より複数の解釈が出る問題が良い授業になる（例：医者・先生・学生・会社員のうち「先生は学校にいる、他は違う」など）。理由説明で発話量が増える。
- **contentRequirement**: {"judgment": "not_needed", "reason": "チャットで単語提示可"}
- **stt_ttt_ratio**: STT 60%
- **usedInLesson1**: true

---

#### act_battleship（バトルシップ）
- **nameEn**: Battleship
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking]
- **activityType**: [game]
- **prerequisitePatterns**: ["noun_predicate_question"]
- **duration**: 15-20min
- **preparation**: バトルシップ用グリッドシート（縦軸・横軸に語彙配置）を事前作成・共有
- **tools**: [Zoom, Google Meet, 画面共有, チャット]
- **description**: 座標軸に語彙・文法項目を配置した格子を使い、「〜は〜ですか」の質問を繰り返して相手の「船」の位置を当てる。疑問文を大量かつ自然に繰り返す構造。
- **procedure**:
  1. 各自のグリッドシートに「船」（2〜3マス）をランダム配置（相手に見せない）
  2. 交互に「（縦軸語彙）は（横軸語彙）ですか」と質問
  3. 命中したら「はい、そうです（Hit!）」、外れたら「いいえ（Miss）」
  4. 先に全ての船を沈めた方が勝ち
- **teacherTip**: 縦軸に人名、横軸に職業を配置すると「田中さんは先生ですか」の形になりlesson_01語彙を使いやすい。グリッドの事前作成がやや手間だが一度作ると繰り返し使える。
- **contentRequirement**: {"judgment": "required", "reason": "グリッドシートが必要"}
- **defaultMaterialTypes**: ["activity_content"]
- **stt_ttt_ratio**: STT 70%
- **usedInLesson1**: true

---

### 4.3 Research 3：TBLT（6件）

TBLTアクティビティの共通仕様：
- `interactionPattern: "pair"`
- `source: "初級言語教育アプローチ調査.docx §3.4"`
- 多くは未習文型を前提とするため `prerequisitePatterns: []`（後続課で更新）

---

#### act_draw_this（私を描いて）
- **nameEn**: Draw This (Information Gap Drawing)
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [task]
- **prerequisitePatterns**: []
- **duration**: 15-20min
- **preparation**: 描写対象の絵（教師側のみ）・学習者用白紙またはホワイトボード
- **tools**: [Zoom, Google Meet, オンラインホワイトボード]
- **description**: 片方が絵を見て言葉で説明し、もう片方がそれを見ずに描く情報ギャップ活動。形容詞・色・形・位置の語彙を実用的に使う。完成した絵と原本の比較がフィードバックになる。
- **procedure**:
  1. 教師が絵を持ち、学習者には見せない
  2. 教師が絵を言葉で説明する（「右側に〜があります」「〜は赤いです」等）
  3. 学習者がホワイトボードまたは紙に描く
  4. 完成後に原本と比較・フィードバック
  5. 役割交代
- **teacherTip**: 初回は「形と色のみ」の単純な絵から始め、徐々に人物・場所を含む絵へ発展。語彙を段階的に追加できる万能タスク。
- **lesson1Note**: 色・形・位置語彙が前提（lesson_03以降推奨）。lesson_01でも「大きい・小さい、右・左」等の基本語彙を教師が提示しながら行えば実施可能。
- **stt_ttt_ratio**: STT 65%
- **usedInLesson1**: false

---

#### act_map_navigation（地図案内）
- **nameEn**: Map Navigation (Let's Use the Map)
- **stage**: [stage4]
- **level**: [N4, N3]
- **skillFocus**: [speaking, listening]
- **activityType**: [task]
- **prerequisitePatterns**: []
- **duration**: 15-20min
- **preparation**: 地図（白地図・Google Maps・手書き地図）
- **tools**: [Zoom, Google Meet, 画面共有, Google Maps（任意）]
- **description**: 地図上で目的地への道順を日本語で指示し、パートナーがそのルートをたどる。「〜へ曲がってください」「〜があります」等の方向・存在表現を実用的な文脈で練習する。
- **procedure**:
  1. 地図を共有し、出発点と目的地を設定
  2. 案内役が「まっすぐ行って、右に曲がってください」等と指示
  3. 聴く役がルートを指でたどる（または別の地図に書く）
  4. 役割交代
- **teacherTip**: Google Mapsのストリートビューを使うとact_google_maps_tourと組み合わせて実施できる（lesson_02以降）。
- **lesson1Note**: 方向表現（〜てください）・存在表現（〜があります）が必要。lesson_04以降推奨。
- **stt_ttt_ratio**: STT 60%
- **usedInLesson1**: false

---

#### act_family_tree（家系図作成）
- **nameEn**: Family Tree Chart
- **stage**: [stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [task]
- **prerequisitePatterns**: []
- **duration**: 15-20min
- **preparation**: 一部情報が欠けた家系図シート（教師・学習者でそれぞれ異なる情報が欠落）
- **tools**: [Zoom, Google Meet, 画面共有, ホワイトボード]
- **description**: AさんとBさんの家系図にそれぞれ異なる名前・関係が抜けており、互いに質問して全て埋める情報ギャップタスク。家族関係語彙と〜の〜（所有）が前提。
- **procedure**:
  1. 各自の欠落家系図を確認
  2. 「〜さんのお母さんは誰ですか」等で欠けた情報を聞く
  3. 情報を記入して完成させる
  4. 答え合わせ
- **teacherTip**: lesson_01のp3（〜の〜）の発展版として位置づけ可能。家族語彙（お父さん・お母さん・兄・姉等）の導入後に実施。
- **lesson1Note**: 家族語彙と所有表現が必要。lesson_02〜03以降推奨。
- **stt_ttt_ratio**: STT 65%
- **usedInLesson1**: false

---

#### act_daily_routine_task（日課の並べ替え）
- **nameEn**: Daily Routine Sorting
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [task]
- **prerequisitePatterns**: []
- **duration**: 15min
- **preparation**: なし（口頭のみで可）またはホワイトボードにカード配置
- **tools**: [Zoom, Google Meet, ホワイトボード（任意）]
- **description**: 自分の1日の活動をランダムな順序で話し、パートナーがそれを時系列に並べ直す。時刻表現と動詞（〜ます形）が必要。情報ギャップ構造で自然な対話が生まれる。
- **procedure**:
  1. 自分の1日の活動を5〜6件ランダムに話す（「7時に起きます」「朝ごはんを食べます」等）
  2. パートナーがホワイトボード等で時系列に並べる
  3. 答え合わせ・役割交代
- **teacherTip**: 時刻表現（〜時）の導入後にそのまま練習タスクとして使えるため、lesson_05相当の主活動として最適。
- **lesson1Note**: 動詞（〜ます）と時刻表現が必要。lesson_05以降推奨。
- **stt_ttt_ratio**: STT 70%
- **usedInLesson1**: false

---

#### act_monster_design（モンスター・デザイン）
- **nameEn**: Monster Design
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [task]
- **prerequisitePatterns**: []
- **duration**: 15-20min
- **preparation**: 白紙またはホワイトボード
- **tools**: [Zoom, Google Meet, オンラインホワイトボード]
- **description**: クライアント（教師）の要望（「目が3つ、手が6本、緑の体」等）を聞き取り、正確にモンスターを描く。数字・身体部位・色・形容詞の聴解練習。描いた絵と口頭説明の一致確認でフィードバックループが生まれる。
- **procedure**:
  1. 教師が要望を口頭で伝える
  2. 学習者がホワイトボードに描く
  3. 「確認してもいいですか」で聴き返し表現を練習
  4. 完成後に「〜があります」で描いたものを発表
- **teacherTip**: 誇張したデザインが出ると楽しい雰囲気になる。「足が10本でもOK」と言ってクリエイティビティを促す。
- **lesson1Note**: 身体部位・数・色が必要。lesson_03〜04以降推奨。
- **stt_ttt_ratio**: STT 50%
- **usedInLesson1**: false

---

#### act_school_schedule（学校の時間割）
- **nameEn**: School Schedule Coordination
- **stage**: [stage4]
- **level**: [N4, N3]
- **skillFocus**: [speaking, listening]
- **activityType**: [task]
- **prerequisitePatterns**: []
- **duration**: 15-20min
- **preparation**: 時間割・スケジュール表（教師・学習者で異なる予定）
- **tools**: [Zoom, Google Meet, 画面共有]
- **description**: 互いの異なるスケジュールを口頭で共有し、「いつなら一緒に〜できますか」と調整する。時間表現・曜日・予定の表現が前提の、実際のビジネスや日常会話に直結するタスク。
- **procedure**:
  1. 各自のスケジュール表を持つ（画面共有で提示しない）
  2. 「月曜日の3時はどうですか」等で空き時間を確認
  3. 合意できるタイミングを見つける
- **teacherTip**: ビジネス系学習者には会議調整シナリオで行うと実用性が高まる。
- **lesson1Note**: 時刻・曜日・〜は大丈夫ですか等の表現が必要。lesson_05以降推奨。
- **stt_ttt_ratio**: STT 70%
- **usedInLesson1**: false

---

### 4.4 Research 2：オンライン特化（6件）

Research 2活動の共通仕様：
- `interactionPattern: "pair"`
- `source: "オンライン日本語マンツーマン授業アクティビティ.docx"`

---

#### act_virtual_card_exchange（バーチャル名刺交換）
- **nameEn**: Virtual Business Card Exchange
- **stage**: [stage4, stage5]
- **level**: [N5, N4, N3]
- **skillFocus**: [speaking, listening]
- **activityType**: [roleplay]
- **prerequisitePatterns**: ["noun_predicate_affirmative", "noun_predicate_question", "noun_no_affiliation"]
- **duration**: 10min
- **preparation**: 名刺画像（教師が事前作成、または授業中に一緒に作る）
- **tools**: [Zoom バーチャル背景, Google Meet]
- **description**: 名刺画像をバーチャル背景に設定し、画面越しに「はじめまして」の挨拶と名刺交換を練習する。オンラインビジネスの実際の習慣をそのまま練習できる。act_hajimemashite_conversationの発展版または前段として使用可。
- **procedure**:
  1. 名刺画像（名前・会社名・役職を含む）を準備
  2. バーチャル背景に名刺を設定
  3. 「はじめまして」から始まる自己紹介会話を行う
  4. 相手の名刺の内容に基づき「〜ですか」で確認質問
- **teacherTip**: 名刺は授業開始前に「デジタル名刺ジェネレーター（Canva等）」で簡単に作れる。学習者に事前課題として作成させると次回の活動への興味が高まる。ビジネス系学習者に特に有効。
- **contentRequirement**: {"judgment": "slide_alt", "reason": "名刺画像があると没入感が増すが、口頭のみでも可"}
- **stt_ttt_ratio**: STT 65%
- **usedInLesson1**: true

---

#### act_chat_kanji_quiz（チャットで漢字変換クイズ）
- **nameEn**: Chat Kanji Conversion Quiz
- **stage**: [stage2, stage3]
- **level**: [N5]
- **skillFocus**: [reading, writing]
- **activityType**: [drill]
- **prerequisitePatterns**: []
- **duration**: 5-8min
- **preparation**: なし（no-prep）
- **tools**: [Zoom チャット, Google Meet チャット]
- **description**: 教師がひらがなで文をチャットに送り（例：「きょうはあついです」）、学習者が漢字変換して打ち返す（「今日は暑いです」）。変換候補から正しい漢字を選ぶ作業を通じて文字の形態認識能力を高める。キーボード入力の練習にもなる。
- **procedure**:
  1. 教師がひらがなのみの文をチャットに送る
  2. 学習者が変換して漢字交じりの文をチャットで返す
  3. 正解を確認し、間違いがあれば解説
- **teacherTip**: IMEの使い方（変換キー操作）が初めての学習者には最初に説明が必要。「今日（きょう）」「私（わたし）」など頻出漢字から始める。Brain Breakとして5分使うのが効果的。
- **contentRequirement**: {"judgment": "not_needed", "reason": "チャット機能のみで完結"}
- **stt_ttt_ratio**: STT 40%（タイピング中心）
- **usedInLesson1**: true

---

#### act_realtime_error_correction（リアルタイム誤用修正）
- **nameEn**: Real-time Error Correction via Chat
- **stage**: [stage3, stage4, stage5]
- **level**: [N5, N4, N3]
- **skillFocus**: [speaking]
- **activityType**: [feedback_technique]
- **prerequisitePatterns**: []
- **duration**: 随時（他のアクティビティと並行）
- **preparation**: なし（no-prep）
- **tools**: [Zoom チャット, Google Meet チャット]
- **description**: 学習者が話している間、教師がその中で出た誤用や不自然な表現をチャットにリアルタイムで記録する。会話の区切りでチャットを一緒に見直し、訂正する。音声での修正は聞き逃されやすいが、文字として残ることで確実なフィードバックになる。単独アクティビティというより「教師の指導テクニック」として全授業に応用できる。
- **procedure**:
  1. 他のアクティビティを実施中に教師がチャットへ誤用をメモ
  2. アクティビティ終了後「チャットを見てください」と促す
  3. 誤用を一緒に確認・正用を提示
  4. 学習者が正用でもう一度言い直す
- **teacherTip**: 誤用の全件修正は禁物。「この授業で最も重要な1〜2件」に絞る。会話の流れを止めないためにチャットへの記録は簡潔に（例：「× は先生です → ○ 先生です」）。
- **contentRequirement**: {"judgment": "not_needed", "reason": "チャット機能のみで完結"}
- **stt_ttt_ratio**: STT 80%（通常会話を妨げない）
- **usedInLesson1**: true

---

#### act_whiteboard_categorize（カテゴリ分類付箋ワーク）
- **nameEn**: Whiteboard Category Sort
- **stage**: [stage2, stage3]
- **level**: [N5, N4]
- **skillFocus**: [reading]
- **activityType**: [drill]
- **prerequisitePatterns**: []
- **duration**: 10-15min
- **preparation**: ホワイトボードにカテゴリ枠と単語付箋を事前配置
- **tools**: [Zoomホワイトボード, Miro, Padlet]
- **description**: 教師がホワイトボードに「名詞・動詞・形容詞」等のカテゴリ枠を作り、学習者が単語付箋をドラッグ＆ドロップで適切な枠に分類する。身体的な操作を伴うため抽象的な文法カテゴリの理解を助ける。
- **procedure**:
  1. ホワイトボードにカテゴリ枠（例：「職業」「国名」「動詞」）を作成
  2. 単語の付箋をバラバラに配置
  3. 学習者が付箋をドラッグして正しい枠へ移動
  4. 分類後「〜は〜です」で文作成
- **teacherTip**: ZoomのAnnotation機能（注釈）でも代用可能。付箋色を品詞ごとに変えると視覚的な効果が高まる。
- **contentRequirement**: {"judgment": "required", "reason": "ホワイトボード上の付箋配置が必要"}
- **defaultMaterialTypes**: ["activity_content"]
- **stt_ttt_ratio**: STT 40%
- **usedInLesson1**: true

---

#### act_silhouette_quiz（シルエット・クイズ）
- **nameEn**: Silhouette Quiz
- **stage**: [stage2, stage3]
- **level**: [N5, N4]
- **skillFocus**: [listening, speaking]
- **activityType**: [game]
- **prerequisitePatterns**: []
- **duration**: 5-8min
- **preparation**: なし（no-prep）またはシルエット画像（任意）
- **tools**: [Zoom カメラ, Google Meet カメラ]
- **description**: 物をカメラに極限まで近づける・または照明を背にして影だけを映し、「これは何だと思いますか」と質問する。カメラの画角制限を逆手に取ったオンライン特有の語彙クイズ。
- **procedure**:
  1. 物をカメラの前に持ってくる（または影だけを映す）
  2. 「これは何ですか」または「〜ですか」で質問
  3. 学習者が「〜です」「〜じゃありませんか」で答える
  4. 徐々に物を引いて全体を見せる
- **teacherTip**: 語彙カードの復習として使うと効果的。学習者に物を用意させて出題側にまわすとSTTが増える。act_virtual_treasureとの組み合わせで活動のバリエーションが広がる。
- **contentRequirement**: {"judgment": "not_needed", "reason": "身近な物をカメラで映すだけ"}
- **stt_ttt_ratio**: STT 50%
- **usedInLesson1**: true

---

#### act_background_change（背景変化探し）
- **nameEn**: Spot the Background Change
- **stage**: [stage2, stage3]
- **level**: [N5, N4]
- **skillFocus**: [speaking]
- **activityType**: [game]
- **prerequisitePatterns**: []
- **duration**: 5-8min
- **preparation**: なし（no-prep）
- **tools**: [Zoom バーチャル背景, Google Meet]
- **description**: 教師が一瞬カメラをオフにして背景や自分の何かを変え（背景画像変更・帽子を被る等）、「どこが変わりましたか」と質問する。オンラインならではの「画面の切り替え」を使った観察練習。変化を説明する語彙と「〜が変わりました」の表現練習になる。
- **procedure**:
  1. 教師がカメラをオフにして何かを変える
  2. カメラをオンに戻す
  3. 「どこが変わりましたか」と学習者に問う
  4. 学習者が変化を説明する
- **teacherTip**: 変化は1箇所から始め、慣れたら2〜3箇所に増やす。変化の大きさで難度が変わるので調整しやすい。Brain Breakとしても機能する。
- **contentRequirement**: {"judgment": "not_needed", "reason": "ツール機能のみ"}
- **stt_ttt_ratio**: STT 60%
- **usedInLesson1**: true

---

### 4.5 Research 1：p1/p2補完（2件）

---

#### act_personality_quiz（性格診断クイズ）
- **nameEn**: Personality Quiz
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking, listening]
- **activityType**: [quiz]
- **prerequisitePatterns**: ["noun_predicate_question"]
- **duration**: 15min
- **preparation**: 診断シート（質問と結果タイプ一覧）
- **tools**: [Zoom, Google Meet, 画面共有]
- **description**: 教師の「〜ですか」質問にYes/Noで答え続け、最後に「あなたは〇〇タイプです」と診断される。診断結果を使って自己紹介文を作る活動に発展させられる。
- **procedure**:
  1. 診断シートを画面共有
  2. 教師が「猫が好きですか」「朝早く起きますか」等の質問を出す
  3. 学習者が「はい」「いいえ」で答える
  4. 結果を「私は〜タイプです」と言わせる
- **teacherTip**: 結果の「タイプ名」をユーモラスにすると盛り上がる（「あなたは先生タイプです！」等）。lesson_01語彙（職業）を結果として使うと復習にもなる。
- **contentRequirement**: {"judgment": "required", "reason": "診断シートが必要"}
- **defaultMaterialTypes**: ["activity_content"]
- **stt_ttt_ratio**: STT 55%
- **usedInLesson1**: true
- **source**: "初級日本語アクティビティ調査報告.docx §2（疑問文アクティビティ）"

---

#### act_two_choice_quiz（二択クイズ：どちらが好き？）
- **nameEn**: Two-Choice Quiz
- **stage**: [stage3, stage4]
- **level**: [N5, N4]
- **skillFocus**: [speaking]
- **activityType**: [quiz]
- **prerequisitePatterns**: ["noun_predicate_question"]
- **duration**: 10min
- **preparation**: なし（no-prep）または絵カード2枚
- **tools**: [Zoom, Google Meet]
- **description**: 「リンゴとバナナ、どちらが好きですか」等の二択質問を互いに行う。文型が固定されているため発話のハードルが低く、答えが「どちらか」の2択なので応答も簡単。好みを共有しながらインタラクションを楽しめる。
- **procedure**:
  1. 教師がモデルを示す（「〜と〜、どちらが好きですか」）
  2. 教師→学習者で質問
  3. 学習者→教師で役割交代
  4. 面白い答えが出たら「なぜですか」で理由を問う
- **teacherTip**: 最初は食べ物・色など簡単な語彙で始め、慣れたら「猫と犬」「東京と大阪」等にテーマを広げる。「どちらも好きです」という答えへの対処法も教えておく。
- **contentRequirement**: {"judgment": "not_needed", "reason": "口頭のみで完結"}
- **stt_ttt_ratio**: STT 60%
- **usedInLesson1**: true
- **source**: "初級日本語アクティビティ調査報告.docx §2（疑問文アクティビティ）"

---

## 5. lesson_01カタログ修正事項

### 5.1 act_passport_control 仕様修正（決定①）✅ catalog v1.6で実装済

**変更内容：** 年齢欄なし・lesson_01簡略版として運用。

```json
// lesson1Note（更新後）
"lesson1Note": "年齢（数字）は未習のためパスポートテンプレートから除外。
名前・国籍・職業・所属の4項目のみで実施。
数字導入後（lesson_05相当以降）は年齢欄を追加したフルバージョンで実施可。"

// teacherTip 追記事項
"パスポートテンプレートは「名前：___、国籍：___、職業：___、所属：___」の4欄のみで作成。
年齢欄は入れない（数字未習のため）。"
```

### 5.2 act_google_maps_tour 移管（決定②）✅ catalog v1.6で実装済

**変更内容：** lesson_01のusedInLesson1をfalseに変更し、lesson_02以降向けに再設定。

```json
// 移管後の設定
"usedInLesson1": false,
"lesson1Note": "中核文型の〜があります・方向表現が未習のためlesson_01では使わない。
lesson_02以降のexistence_locationパターン導入後に実施。",
"prerequisitePatterns": ["existence_location"]   // v1.6で適用済
"validatedForLessons": []   // lesson_01から削除
```

---

## 6. 後続課への申し送り

### 6.1 Research 1 p3〜p10：34件の全一覧

後続課作成時にprerequisitePatternsを確定して追加する。

| ID | 名称 | 対応文型 | 想定grammarConcept（暫定） |
|---|---|---|---|
| act_mystery_box | ミステリー・ボックス | 指示語 これ・それ・あれ | kosoado_pronoun_thing |
| act_blind_drawing | ブラインド・ドローイング | 指示語・位置 | kosoado_pronoun_thing |
| act_unique_object_quiz | これは何ですか？ | 指示語 | kosoado_pronoun_thing |
| act_demonstrative_sugoroku | 指示語すごろく | 指示語 | kosoado_pronoun_thing, kosoado_attributive |
| act_spot_the_difference | まちがい探し | 〜にあります | existence_location |
| act_ideal_room_design | 理想の部屋デザイン | 〜にあります | existence_location |
| act_scavenger_hunt | スカベンジャー・ハント | 〜にあります | existence_location |
| act_dream_island | ドリーム・アイランド | 〜にあります | existence_location |
| act_fridge_check | リモート冷蔵庫チェック | 〜にあります | existence_location |
| act_room_layout_whiteboard | 理想の部屋レイアウト（WB） | 〜にあります・位置詞 | existence_location |
| act_google_maps_tour | Google Maps出身地ツアー | 〜にあります | existence_location |
| act_world_clock_quiz | 世界の今（時差クイズ） | 〜時〜分 | time_expression_clock |
| act_daily_timeline | 1日のタイムライン | 〜時〜分 | time_expression_clock |
| act_whose_schedule | 誰のスケジュール？ | 〜時〜分 | time_expression_clock |
| act_train_timetable | 列車の時刻表タスク | 〜時〜分 | time_expression_clock |
| act_flea_market | フリーマーケット | 〜円です | amount_expression |
| act_exact_change | ぴったり注文 | 〜円です | amount_expression |
| act_souvenir_budget | お土産予算タスク | 〜円です | amount_expression |
| act_price_guessing | 値段あてクイズ | 〜円です | amount_expression |
| act_vocab_hunting | ボキャブラリー・ハンティング | 〜語で〜は何ですか | vocabulary_inquiry_language |
| act_translation_relay | 翻訳リレー | 〜語で〜は何ですか | vocabulary_inquiry_language |
| act_symbol_deciphering | シンボル解読 | 〜語で〜は何ですか | vocabulary_inquiry_language |
| act_interview_dictation | インタビュー・ディクテーション | 〜語で〜は何ですか | vocabulary_inquiry_language |
| act_simon_says_jp | Simon Says JP（〜てください版） | 〜てください | te_form_request |
| act_origami_instruction | 折り紙マスター | 〜てください | te_form_request |
| act_classroom_rules_poster | 教室のルール・ポスター | 〜てください | te_form_request |
| act_route_guidance | 道案内シミュレーション | 〜てください・方向 | te_form_request |
| act_bucket_list | 私のやりたいことリスト | 〜たいです | desire_expression |
| act_dream_vacation | ドリーム・バケーション | 〜たいです | desire_expression |
| act_gift_task | 先生へのプレゼント | 〜たいです | desire_expression |
| act_which_do_you_want | どっちがしたい？ | 〜たいです | desire_expression |
| act_cando_bingo | Can-doビンゴ | 〜ができます | potential_expression |
| act_talent_show | タレント・ショー企画 | 〜ができます | potential_expression |
| act_survival_check | 街中のサバイバル・チェック | 〜ができます | potential_expression |
| act_looking_for_helper | 助っ人募集 | 〜ができます | potential_expression |

### 6.2 Research 2 lesson_02+対応アクティビティ

| ID | 名称 | 推奨lesson | 使用ツール |
|---|---|---|---|
| act_google_maps_route | 目的地までの道案内 | lesson_05以降 | Google Maps・注釈機能 |
| act_shop_roleplay_bg | 店員と客のロールプレイ | lesson_06以降 | バーチャル背景 |
| act_20_questions | 20の質問クイズ（no-prep版） | lesson_03以降 | 音声・チャット |
| act_story_mapping | ストーリー・マッピング | lesson_04以降 | ホワイトボード・画像挿入 |

---

### 6.3 Research 4：未実装メタデータ候補（決定⑥の申し送り）

推薦ロジック実装時（残課題D以降）に追加を検討するフィールド。

| フィールド名 | 型 | 候補値 | 出典 | 優先度 |
|---|---|---|---|---|
| `interactionPattern` | string | "individual"/"pair"/"group" | IEEE LOM準拠 | ✅ 今回実装済み |
| `interactivityType` | string | "active"/"expository"/"blended" | IEEE LOM | 🟡 推薦実装時 |
| `cafFocus` | string[] | "complexity"/"accuracy"/"fluency" | SLA研究CAF指標 | 🟡 推薦実装時 |
| `cefrLevel` | string[] | "A1"/"A2"/"B1" | CEFR/JFスタンダード | 🟢 既存levelで代替中 |
| `bloomLevel` | string | "remember"〜"create"（6段階） | Bloomデジタルタクソノミー | 🟢 将来検討 |

**各フィールドの詳細（選択肢①=今すぐ全追加 / ②=必要時に追加）の比較：**

- `interactivityType`（①：全28件に即付与できる・コスト低 / ②：推薦ロジック実装まで不要）
- `cafFocus`（①：SLA研究者視点での分類が必要・専門知識要 / ②：実際の学習者データがあって初めて有効）
- `bloomLevel`（①：Bloomの6段階は教育学的に正確な分類が難しい / ②：将来の学習目標設計フェーズで検討）

**推奨方針：** `interactivityType` のみ次のカタログ更新時に追加。`cafFocus` / `bloomLevel` はデータ蓄積後に検討。

---

## 7. Research 4：推薦システム設計エッセンス

### 7.1 知識グラフによるprerequisite構造

Research 4 が示した前提条件の記述方法は、現在の `prerequisitePatterns` 設計と整合している。

```
エンティティ：文法コンセプト（noun_predicate_affirmative等）
関係："Prerequisite-of"（前提条件である）

推薦ロジック：
session.teach[].grammarConcept ⊇ activity.prerequisitePatterns
→ このセッションで扱う文法が、活動の前提を満たす
→ 候補に表示
```

### 7.2 ハイブリッド推薦モデル（実装指針）

Research 4 が推奨するコールドスタート問題への対応：

```
Phase 1（データ少）：知識ベース推薦（ルールベース）
  If session.teach[].grammarConcept ⊇ act.prerequisitePatterns
  And session.duration >= act.duration（分）
  Then → 候補

Phase 2（データ蓄積後）：コンテンツベースフィルタリング
  act.interactionPattern == "pair"
  And act.level matches student.currentLevel
  Then → 重み付けスコア計算

Phase 3（評価データ蓄積後）：協調フィルタリング
  過去の教師評価データによる推薦精度向上
```

### 7.3 If-Thenルール設計例

```
Rule 1（前提条件）
If session.teach に noun_predicate_affirmative が含まれない
Then act_hajimemashite_conversation を除外

Rule 2（習得段階）
If session.currentStage == "stage1"
Then prerequisitePatterns!=[] のアクティビティを除外（TPRのみ推薦）

Rule 3（復習間隔）
If 前回 noun_predicate_affirmative 使用から7日以上経過
Then act_reaction_quiz を優先提示（分散学習）
```

### 7.4 教師ダッシュボード設計の4フェーズ（Research 4）

| フェーズ | 機能 | 実装優先度 |
|---|---|---|
| Awareness（気づき） | 活動候補の一覧表示・時間の可視化 | 🔴 最優先 |
| Interpretation（解釈） | 「このパターンの練習が不足」等のメッセージ | 🟡 次期 |
| Advising（助言） | 具体的な活動推薦（prerequisitePatternsベース） | 🟡 次期 |
| Enactment（執行） | 選択した活動のmaterialを即生成 | 🟢 将来 |

---

*資料バージョン：v1.1（2026-05-14）*
*次バージョン：lesson_02照合開始時に v1.2 として更新予定*
