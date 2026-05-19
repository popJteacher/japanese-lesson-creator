# 引き継ぎ資料 v2.5
**バージョン：v2.5（2026-05-17）**
**前資料：handoff_v2_4.md（2026-05-17）**
**このチャットで完了した作業：L3〜L10 文型シラバス抽出（PDF読み取り）**

---

## ⚠️ 次チャットで最初にやること（必須・順番通りに）

| 優先 | 作業 | 内容 |
|---|---|---|
| **①** | **L11〜L20 PDF読み取り** | 第11〜20課のPDFをアップロードして文型シラバスを抽出 |
| **②** | **さらに次のチャットでL21〜L30** | 第21〜30課のPDFをアップロードして文型シラバスを抽出 |
| **③** | **L21〜L30完了後：SKILL.md v1.4** | 全30課シラバス追加 ＋ 原則④改訂 |
| **④** | **lesson_02.json v2.11.7（12点修正）** | handoff_v2_4.md §2 の12点を一括修正 |
| **⑤** | **シラバスで全28例文を最終照合** | ③④完了後に実施 |
| **⑥** | **レジストリ3ファイル更新** | audio v1.2 / image v1.9 / ruby v1.2 |
| **⑦** | **image_prompts_lesson2.json 作成** | 語彙16件 ＋ 例文（照合後確定） |

---

## 1. チャット構成と進捗

シラバス読み取りは**3チャット分割**で実施中：

| チャット | 対象課 | 状態 |
|---|---|---|
| チャット①（本資料の前チャット） | L1〜L2 | ✅ 完了（handoff_v2_4.md に記録済み） |
| チャット②（本資料のチャット） | L3〜L10 | ✅ 完了（本資料 §2 に記録） |
| チャット③（次チャット） | L11〜L20 | ❌ 未実施 |
| チャット④（その次のチャット） | L21〜L30 | ❌ 未実施 |

---

## 2. 確定済み文型シラバス（L1〜L10）

> この表がSKILL.md v1.4の `§文型シラバス` に追加される内容の全体。
> L11〜L30は次チャット以降で追加する。

```markdown
## 文型シラバス（全課）
> 課マスター作成時の原則④の判断基準。
> 当該課より前の全確定パターンは例文の述語に使用不可（文法的骨格を除く）。

| 課 | パターンID | grammarConceptID | コア新文型 |
|---|---|---|---|
| L1 | p1 | noun_predicate_affirmative | 〜は〜です（肯定） |
| L1 | p2 | noun_predicate_question | 〜ですか / 〜じゃありません |
| L1 | p3 | noun_no_affiliation | 〜の〜（所属） |
| L2 | p1 | kosoado_pronoun_thing | これ/それ/あれ は〜です |
| L2 | p2 | interrogative_what | 何ですか |
| L2 | p3 | noun_no_possession | 〜の〜（所有） |
| L2 | p4 | interrogative_which_thing | 〜はどれですか |
| L2 | p5 | kosoado_attributive | この/その/あの＋N |
| L2 | p6 | interrogative_which_attributive | どの＋N＋ですか |
| L3 | p1 | verb_present_time_ni | 〜に〜ます（時刻＋動詞） |
| L3 | p2 | verb_time_range | 〜から〜まで〜ます／ません |
| L3 | p3 | verb_past | 〜ました／〜ませんでした |
| L3 | p4 | time_expressions | 時を表す言葉（「に」の有無） |
| L4 | p1 | verb_transitive_wo | 〜を〜ます（他動詞） |
| L4 | p2 | interrogative_what_transitive | 何を〜ますか |
| L4 | p3 | verb_location_de | 〜で〜を〜ます（動作の場所） |
| L4 | p4 | interrogative_where_de | どこで〜ますか |
| L5 | p1 | verb_movement_e | 〜へ行きます／来ます／帰ります |
| L5 | p2 | verb_movement_transport | 〜で〜へ行きます／来ます（交通手段） |
| L5 | p3 | interrogative_when | いつ〜ましたか |
| L5 | p4 | verb_movement_purpose | 〜へ〜に行きます（目的） |
| L5 | p5 | verb_invitation | 〜ませんか → 〜ましょう |
| L6 | p1 | adj_i_noun_modifier | い形容詞＋名詞 |
| L6 | p2 | adj_na_noun_modifier | な形容詞な＋名詞 |
| L6 | p3 | adj_i_predicate | 〜は〜いです／くないです |
| L6 | p4 | adj_na_predicate | 〜は〜です／じゃありません（な形容詞叙述） |
| L6 | p5 | interrogative_donna | どんな〜ですか |
| L6 | p6 | interrogative_dou | 〜はどうですか |
| L6 | p7 | adj_i_past | 〜かったです（い形容詞過去）／でした（な形容詞過去） |
| L6 | p8 | adj_conjunction_te | 〜くて／で〜です（形容詞の接続） |
| L6 | p9 | adj_contrast_ga | 〜ですが、〜です |
| L7 | p1 | existence_ni_ga | 〜に〜があります／がいます |
| L7 | p2 | existence_location_noun | 〜の（位置詞）に〜があります |
| L7 | p3 | existence_nani_ka_mo | 何かありますか／何もありません |
| L7 | p4 | counter_existence | 〜が〜つあります（助数詞） |
| L7 | p5 | location_wa_ni | 〜は（場所）にあります／います |
| L8 | p1 | wa_ga_description | 〜は〜が〜です（属性描写） |
| L8 | p2 | wa_ga_suki | 〜は〜が好きです／きらいです |
| L8 | p3 | wa_ga_possession | 〜は〜があります／います（所有） |
| L8 | p4 | wa_ga_hoshii | 〜は〜がほしいです |
| L8 | p5 | wa_ga_tai | 〜は〜を／が〜たいです |
| L9 | p1 | comparison_yori | 〜は〜より〜です |
| L9 | p2 | comparison_dochira | 〜と〜とどちら（のほう）が〜ですか／〜のほうが〜です |
| L9 | p3 | comparison_ichiban_list | 〜と〜と〜の中でどれがいちばん〜ですか |
| L9 | p4 | comparison_ichiban_category | 〜（の中）で何／どれがいちばん〜ですか |
| L10 | p1 | juuju_ageru | 〜は〜に〜をあげます |
| L10 | p2 | juuju_morau | 〜は〜に／から〜をもらいます |
| L10 | p3 | family_terms | 家族の呼称（お父さん vs 父 等） |
| L10 | p4 | juuju_kureru | 〜は（わたしに）〜をくれます |
| L11〜L30 | ... | ... | ...（次チャット以降で追加） |
```

---

## 3. handoff_v2_4.md からの継続事項（変更なし）

### 3-1. lesson_02.json v2.11.7 修正12点（未実施）

handoff_v2_4.md §2 の12点をそのまま引き継ぐ。SKILL.md v1.4完成後に実施。

**主要修正のみ再掲（詳細はhandoff_v2_4.md §2参照）：**

| # | 修正箇所 | 内容 |
|---|---|---|
| 修正1 | p3-4 sentence | じゃありません削除（原則④違反） |
| 修正2〜5 | p5/p6 vocabCount | 1→3に更新（犬・写真を含む） |
| 修正6〜8 | _step1c_check | 例文件数・image_marking・material_usage更新 |
| 修正9〜10 | _step1a_completionChecklist | vocabulary「全18語」・flow「全28エントリ」 |
| 修正11〜12 | _step1c_check | character_layer / pattern_core_coverage更新 |

### 3-2. SKILL.md v1.4 で実施する変更（未実施）

**①原則④の改訂：**
```
【現在の記述（旧・削除する）】
原則④：前課パターンは自由使用可
前課（L1等）で導入済みの「〜ですか」「〜じゃありません」「はい/いいえ」は制限なく使用可。

【改訂後の記述】
原則④：前課パターンの使用制限
例文に使用できる要素は2種類のみ：
  ①当該課の新文型
  ②文法的骨格（助詞/です・ます/疑問の「か」/はい・いいえ/定型表現）
前課で「新文型」として導入されたパターンは例文の述語に使用してはならない。
→ §文型シラバスと照合して判断する。
```

**②全30課文型シラバスを追加（本資料 §2 ＋ 次チャット以降で完成）：**

L1〜L10は §2 に記載済み。L11〜L30は次チャット以降で追記する。

### 3-3. レジストリ3ファイル更新詳細（未実施）

handoff_v2_4.md §5 の内容をそのまま引き継ぐ。詳細は以下の通り。

**master_audio_registry.json v1.2（⚠️ 最優先）：**
- sentence更新：8件（sentence_ex_L02_016〜028の旧A/B/Cさん）
- 新規追加：9件（word_犬/写真 + sentence_ex_L02_029〜035）
- outdated化：7件（002/005/006/011/012/013/014）
- 更新後totalEntries：77件（active）

**master_image_registry.json v1.9：**
- 新規追加：9件（word_犬/写真 + ex_L02_029〜035）
- outdated化：6件（002/005/006/011/012/013）
- sentence更新：6件（003/004/007/008/009/010）

**ruby_dictionary.js v1.2：**
- SECTION 6（VOCAB_LESSON2）に追加：犬・写真（コメント「15語」→「17語」）
- SECTION 7（PEOPLE_LESSON2）：Cさん削除・タノムさん追加

### 3-4. image_prompts_lesson2.json 設計（未実施）

- 語彙画像：16件（word_時計/腕時計/ペン/鉛筆/ケータイ/本/雑誌/新聞/かばん/消しゴム/ビル/市役所/山/人/犬/写真）
- 例文画像（確定）：12件（handoff_v2_4.md §6 参照）

### 3-5. 例文一覧（v2.11.6 / v2.11.7修正前）

handoff_v2_4.md §3 の28件をそのまま引き継ぐ。

---

## 4. 各ファイルの現在地

| ファイル | バージョン | 状態 | 次アクション |
|---|---|---|---|
| **lesson_02.json** | v2.11.6 | outputs/生成済み | **v2.11.7（12点修正）← シラバス完成後** |
| **SKILL.md** | v1.3 | プロジェクトナレッジ内・原則④旧版 | **v1.4（原則④改訂＋シラバス追加）← L21〜L30取得後** |
| **master_audio_registry.json** | v1.1 | ⚠️ sentence8件が旧内容 | **v1.2（sentence更新8件＋追加9件＋outdated 7件）** |
| master_image_registry.json | v1.8 | 未更新・sentence6件も要更新 | v1.9（sentence更新6件・追加9件・outdated 6件） |
| ruby_dictionary.js | v1.1 | 未更新 | v1.2（2語追加・1件削除・1件追加） |
| image_prompts_lesson2.json | — | 未作成 | 語彙16件＋例文（照合後） |
| intro_activity_catalog | v1.1 | ✅ 照合完了 | 変更不要 |
| activity_catalog | v1.8 | ✅ 照合完了 | 低優先修正1件 |

---

## 5. シラバス完成後のロードマップ

```
【完了済み】
  ✅ lesson_02.json v2.11.6
  ✅ SKILL.md v1.3
  ✅ intro_activity_catalog v1.1・activity_catalog v1.8
  ✅ master_image_registry.json v1.8
  ✅ master_audio_registry.json v1.1（sentence要更新）
  ✅ ruby_dictionary.js v1.1
  ✅ 文型シラバス L1〜L10（本資料 §2）

【次チャット（チャット③）：必須】
  ① L11〜L20 PDF読み取り → シラバス追記

【さらに次のチャット（チャット④）：必須】
  ② L21〜L30 PDF読み取り → シラバス追記
  ③ SKILL.md v1.4（原則④改訂＋全30課シラバス追加）
  ④ lesson_02.json v2.11.7（12点修正）
  ⑤ シラバスで全28例文を最終照合

【その後】
  ⑥ レジストリ3ファイル更新
     ・master_audio_registry v1.2（⚠️ 最優先）
     ・master_image_registry v1.9
     ・ruby_dictionary.js v1.2
  ⑦ image_prompts_lesson2.json 作成
  ⑧ GASへのL02語彙投入（importByFileId）
  ⑨ 画像・音声の自動生成（GAS処理）
  ⑩ syncAll → URL反映
  ⑪ lesson_02 授業実施可能 🎉
```

---

## 6. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 |
|---|---|
| **この資料**（handoff_v2_5.md） | **必須** |
| **第11〜20課PDF（10課分）** | **必須** |
| handoff_v2_4.md | 推奨（詳細参照用） |

> ⚠️ **次チャットでの開始コマンド例：**
> ```
> handoff_v2_5.mdと第11〜20課PDFをアップロードしました。
> 
> 作業：L11〜L20の文型シラバスをPDFから抽出してください。
> 抽出結果はhandoff_v2_5.md §2 の表に追記する形式でまとめてください。
> ```

---

## 7. 低優先の残課題（handoff_v2_4.md から継続）

| 課題 | 内容 | 優先度 |
|---|---|---|
| p5 practiceTemplates | 「人」のみ（犬・写真が未反映）。設計判断が必要 | 中 |
| intro_act_p5 activityId | `act_picture_card_vocab_intro` → `act_famous_person_intro` | 低 |
| intro_act_p6 activityId | `act_qa_pattern_intro` → `act_famous_person_intro` | 低 |
| activity_catalog act_belongings_qa | activityType の `"communicative"` は未定義値 → 削除 | 低 |

---

## 8. GASパイプライン継続タスク（handoff_v2.md から継続）

| タスク | 状態 |
|---|---|
| **GASへのL02語彙投入**（importByFileId） | ❌ 未実施（レジストリ更新後・音声生成前に実行） |
| **ラインA Step 3**（アクティビティUI 8件） | 🔄 別ライン・並行可 |
| classifyBatch 完了待ち | 残り約327語 / 毎時3語ずつ自動処理中 |

---

*作成日：2026-05-17*
*根拠：handoff_v2_4.md（全継続事項）＋ 第3〜10課PDF（文型シラバス新規抽出）*
*前資料：handoff_v2_4.md（2026-05-17）*
