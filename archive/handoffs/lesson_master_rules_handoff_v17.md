# 課マスター作成ルール 引き継ぎ資料 v17
**作成日：2026-05-15**
**前バージョン：lesson_master_rules_handoff_v16.md**
**このチャットの追加内容：intro_activity_catalog.json 作成・スライド仕様8type全確定・Plan.md v1.1更新**

---

## このチャットで完了・確定したこと（v16追加分）

| 項目 | 内容 | 状態 |
|---|---|---|
| intro_activity_catalog.json 作成 | v1.0 完成・日本語の教え方ABC PDF準拠確認済み | ✅ 完成 |
| スライド仕様 残り4type定義 | intro_activity・pattern・example・practice | ✅ 確定 |
| スライド仕様 全8type完成 | slide_spec_remaining_4types.md に記録 | ✅ 完成 |
| 例文画像アスペクト比の確定 | 例文=16:9・語彙/キャラクター=1:1（テンプレートC根拠） | ✅ 確定 |
| intro_activity アーキテクチャ決定 | 全30課分析に基づきスライド埋め込み維持 | ✅ 確定 |
| アセット照合設計の確定 | 課マスター作成時点でアセット不足を検出・解消する方針 | ✅ 確定 |
| world_map gap の発見と対応方針 | Stage 2-5 でmaster_image_registry.jsonに追加 | ✅ Plan.mdに反映 |
| Plan.md v1.1 作成 | Stage 2に2-4・2-5追加、Stage 2.5新規追加、Stage 6に6-4〜6-7追加 | ✅ 完成 |

---

## v16からの変更点サマリー

### 新規作成ファイル
- `intro_activity_catalog.json` v1.0（3件：act_picture_card_vocab_intro / act_qa_pattern_intro / act_attribute_modeling_intro）
- `slide_spec_remaining_4types.md`（残り4typeのスライド仕様定義書）

### Plan.md v1.0 → v1.1 の変更
| Stage | 変更内容 |
|---|---|
| Stage 2 | 目的に⑤namedCharacters復活・⑥アセット照合を追加。2-4（namedCharacters追加）・2-5（world_map・char_* 追加）を新設 |
| **Stage 2.5（新規）** | intro_activity_catalog.json の配置とビルド対象追加 |
| Stage 6 | 目的文を更新。6-4（intro_activity 3 layout）・6-5（pattern）・6-6（example・16:9対応）・6-7（practice）を新設 |

---

## 確定済みスライド仕様（全8type）

### ✅ 表紙（v16確定）
レッスンタイトル・セッション日付・学習者ID

### ✅ intro_slide（v16確定）
見出し「今日の目標」・各文型のcanDoを1件ずつカード表示

### ✅ intro_activity（本チャット確定）
```
見出し：「導入」＋ activityId のname
layout: character_card_grid → namedCharacters[] 5枚グリッド＋world_map＋指示文
layout: qa_card_pair        → キャラクターカード＋応答パターンボックス＋指示文
layout: attribute_expansion → キャラクター＋building_card＋短文→長文拡張＋指示文
データ取得：intro_activity_catalog.slideDisplay ＋ lesson_NN.json.namedCharacters[]
```

### ✅ pattern（本チャット確定）
```
見出し：「文型①②③」
パターンボックス（助詞=グレー / 名詞スロット=ベージュ / 語尾=アンバー）
canDo（小さく）
語彙カードグリッド（1:1画像・word・reading・en）
表示しない：practiceTemplates / cautionNote / plusAlpha
```

### ✅ example（本チャット確定）
```
見出し：「例文①②③」
アンカー例文（isAnchor: true）：横幅100%・左38%が16:9画像・右テキスト＋★
その他例文（4件）：4列グリッド・16:9画像上部＋テキスト下部
画像比率：例文画像=16:9 / 語彙・キャラクター画像=1:1（統一不要）
```

### ✅ practice（本チャット確定）
```
見出し：「練習①②③」
practiceTemplates[] を全件縦並び
「＿＿＿」→ 下線ボックスに変換
hint を薄字で表示
解答表示なし（口頭練習前提）
```

### ✅ main_activity（v16確定）
見出し「アクティビティの時間」・選択された活動名のみ

### ✅ wrapUp（v16確定）
見出し「まとめ」・canDo + アンカー例文セット表示

---

## intro_activity_catalog.json の設計

### アーキテクチャ決定（全30課分析に基づく）
- **スライド埋め込み維持**（別HTML出力不要）
- 根拠：全30課で学習者操作は口頭リピート/口頭回答のみ。UIへの能動的操作ゼロ。
- 記録場所：`intro_activity_catalog.json` の `_meta.architectureDecision`

### activity_catalog.json との違い
| | activity_catalog | intro_activity_catalog |
|---|---|---|
| 選択 | 教師が手動選択 | flow[]で自動決定 |
| 出力 | 別HTMLファイル | スライドHTMLに埋め込み |
| 件数 | 57件 | 3件（第1課分） |

### materialTypes（5タイプ定義済み）
| タイプ | 取得元 | fallback |
|---|---|---|
| named_character_card | lesson_NN.json > namedCharacters[] | テキストカード |
| auto_generated_vocab | lesson_NN.json > vocabulary | テキストカード |
| building_card | lesson_NN.json > vocabulary（imageRole: vocab_building）| テキストカード |
| world_map | static asset（master_image_registry.json） | 国名テキストリスト |
| teacher_photo | 教師が自前で用意 | プレースホルダー表示 |

---

## アセット照合設計（本チャットで確定）

**原則：** 課マスター作成時点で、その課の導入アクティビティに必要な画像を照合し不足を解消する。ランタイムフォールバックに依存しない。

**第1課の不足アセット（Stage 2-5で対応）：**
| imageId | 対応 |
|---|---|
| world_map | master_image_registry.json に static_asset として追加 |
| char_鈴木・char_リン・char_キム・char_タノム・char_ケリー | 同上（named_character・1:1生成） |

---

## Claude Code 実装状況（2026-05-15時点）

### 指示済み内容（v16から変化なし）
Stage 1・3・4・5 → 進行中
Stage 2・6・7 → 保留中（本チャットで仕様確定）

### 次チャットでClaude Codeに渡すStage

**Stage 2（lesson_01.json 更新 + アセット照合）**
→ Plan.md v1.1 の Stage 2（2-1〜2-5）を渡す

**Stage 6（スライドレンダラー更新）**
→ Plan.md v1.1 の Stage 6（6-1〜6-7）を渡す
→ `slide_spec_remaining_4types.md` も参照資料として添付

**Stage 7（ビルド・動作確認）**
→ Plan.md v1.1 の Stage 7 をそのまま渡す

---

## 次チャットでやること

```
【タスク4のみ】
Claude Code に Stage 2・6・7 を渡す

渡し方：
1. Plan.md v1.1 の Stage 2 セクションをそのまま渡す
2. Plan.md v1.1 の Stage 6 セクション + slide_spec_remaining_4types.md を渡す
3. Plan.md v1.1 の Stage 7 セクションを渡す
4. Stage 1・3・4・5 の完了報告を受けてから Stage 2 を開始させる
```

---

## 次チャットへのアップロード必須ファイル

- **この資料**（`lesson_master_rules_handoff_v17.md`）
- **`Plan_v1_1.md`**
- **`slide_spec_remaining_4types.md`**（Stage 6の参照資料）
- **`intro_activity_catalog.json`**（Stage 2.5の配置用）

---

## ファイルバージョン（次チャット開始時点）

| ファイル | バージョン | 状態 |
|---|---|---|
| `lesson_01.json` | formatVersion 2.7 / lessonVersion 1.0 | ⏸ Stage 2保留中 |
| `lesson_02.json` | lessonVersion 1.0 | ⚠️ 未照合（残課題E） |
| `activity_catalog.json` | v1.7（57件） | ✅ 完成 |
| `intro_activity_catalog.json` | v1.0（3件） | ✅ 完成・配置待ち |
| `session_001.json` | formatVersion 1.0 | 🔄 Stage 4で更新中 |
| `master_image_registry.json` | v1.4 | 🔄 Stage 1で更新中 |
| `master_audio_registry.json` | — | 🔄 Stage 3で新規作成中 |
| `Plan.md` | v1.1 | ✅ 完成 |
| `slide_spec_remaining_4types.md` | — | ✅ 完成 |

---

## 守るべきルール（v17・追加分のみ）

| ルール | 内容 |
|---|---|
| NEW | 例文画像は16:9・語彙/キャラクター画像は1:1。サイズ統一不要 |
| NEW | intro_activityはスライド埋め込み。全30課分析に基づく確定済み決定 |
| NEW | 課マスター作成時にアセット照合を実施し、不足画像を解消してから完成とする |
| NEW | intro_activity_catalog.jsonのfallbackフィールドが定義されているが、ランタイム依存は避ける |
| 継続 | namedCharactersはカード生成専用。固定キャラ廃止方針（物語連続性なし）とは別概念 |
| 継続 | intro_activity_catalogとactivity_catalogは別ファイルで管理 |
| 継続 | スライド仕様が未確定のStageはClaude Codeに渡さない |

---

*資料バージョン：v17（2026-05-15）*
*前バージョン：lesson_master_rules_handoff_v16.md*
