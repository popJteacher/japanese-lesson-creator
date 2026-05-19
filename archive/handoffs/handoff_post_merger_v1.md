# 引き継ぎ資料：2ライン合流後・課マスターSkill化
**作成日：2026-05-16**
**前資料：handoff_merger_v1.md / lesson_master_rules_handoff_v19.md**
**このチャットで完了したこと：2ライン合流確認・SKILL化方針決定・lesson_template.json v1.2 作成**

---

## 1. 両ラインの現在地（正確な最新状態）

### ライン A（japanese-lesson-creator）

| Step / Stage | 内容 | 状態 |
|---|---|---|
| Step 1 | 生成エンジン（4ファイル出力） | ✅ 完了 |
| Step 2 | フォーム UI | ✅ 完了 |
| Step 3 | アクティビティ UI 8件 | ✅ 完了 |
| Stage 1〜7 | 命名規則統一・audioId・FlowSynthesizer修正・スライド更新・ビルド確認 | ✅ 全完了 |

> **注意**：handoff_merger_v1.md（付録B）はラインBが分岐した時点のスナップショットであり、Step3・Stage2〜7を「進行中」と記録しているが、これは古い情報。上記が正しい。

### ライン B（GASパイプライン）

| タスク | 状態 |
|---|---|
| GASスクリプト 8本（setupSpreadsheet / seedLesson01 / extractFromGoiList / importFromLessonJson / classifyAndTranslate / generateImages / generateAudio / syncRegistries） | ✅ 完成 |
| B-1〜B-4：手動セットアップ（ScriptProperties・SS初期構築・データ投入・タイマー登録） | ⏳ 手動実行待ち |
| B-5：Imagen 4 Ultra を generateImages.gs に追加（75枚/日化） | ⬜ 未着手 |

---

## 2. このチャットで決定した事項

### 2-1. SKILL化の方針

**課マスター作成プロセスをSKILL化する**という決定は以前のチャットで合意されていたが引き継ぎ資料に記録されていなかった。このチャットで再確認し、以下を決定した。

**形式：SKILL.md（`/mnt/skills/` 配下）**

| ファイル | 誰が読む | 用途 |
|---|---|---|
| CLAUDE.md | Claude Code（CLI） | 実装作業の自律動作ルール |
| README.md | 人間の開発者 | プロジェクト概要・セットアップ |
| SKILL.md | Claude AI（claude.ai） | タスク種別ごとの手順・基準 |

課マスター作成はClaude AIとのチャットで行う設計作業なので、SKILL.mdが正しい置き場所。CLAUDE.mdに書くとClaude Codeにしか自動参照されない。

**カバー範囲：L1（チェックリスト）＋ L2（テンプレートJSON）**

L3（GASによる自動生成）はライン B の「高品質テキスト生成ライン」に相当するが、基本パイプライン安定後の将来拡張。今回はスコープ外。

### 2-2. lesson_template.json v1.2 完成

`lesson_01.json v2.11.4` を SSOT として、課マスター作成用の骨格テンプレートを作成した。

**検証方法**：Pythonで全キーを再帰抽出し、テンプレートと1対1で機械照合。意図的除外を除いて差分ゼロを確認。

**意図的に除外したもの（新しい課には不要）**：
- `_meta.changes[]`（バージョン履歴）
- `_meta._phase1f_completed.*`（旧キャラクターシステム廃止の移行記録・lesson_01固有）
- `github._uploadFiles_deprecated`（v2.4廃止注記）

---

## 3. lesson_template.json v1.2 の仕様

### ファイル場所
`data/lesson_template.json`（リポジトリ管理推奨）

### トップレベル構造（9セクション）

```
_TEMPLATE_GUIDE  ← 使い方・チェックリスト（作業後削除可）
_meta
lesson
textbook_sources + textbook_compatibility_note
vocabulary (byPattern構造 + deprecation_note)
flow (8 typeを全網羅)
namedCharacters
patterns (p1/p2/p3)
github
```

### 主要な設計判断

**vocabulary.byPattern**
- グループ数は固定ではない（lesson_01は p1_p2 / p1_p2_nationality / p3 の3グループ）
- グループキー名はpatternIdの組み合わせで命名する
- グループ単位の任意フィールド `_jlptLevel_note` を追加

**flow**
- 文型ブロック（intro_activity → pattern → example → practice）を3セット収録
- 2パターンの課：p3ブロック（4エントリ）を flow[] と patterns[] 両方から削除する
- `materialNeeds` の付与規則を _GUIDE で明示（intro_activity：必須 / pattern：オプション / example・practice・intro_slide・wrapUp・review：付与しない）
- `materialNeeds` の全フィールド（type / description / keywords / count / imageRef / reusedFrom / usedAlsoIn / characters / _note）を網羅

**patterns**
- `practiceTemplates[]` は複数可。疑問文パターンは質問・はい・いいえの3件セット（p2の実例で示している）
- `conversationPhrases[]` は任意フィールド（p1にのみ存在）
- `_grammarConcept_note` は全パターンに必須

**照合チェックリスト（postCompletionChecklist）はテンプレート内に内包**

```
□ 全【要入力】が埋まっている
□ patterns[]の全エントリにcanDoEn・practiceImageSource・isAnchorが設定されている
□ patterns[]の全examples[]にaudioId・isAnchorが設定されている
□ isAnchor:trueは各パターン1件のみ
□ 全vocabulary.words[]のimageIdが word_* 命名規則に従っている
□ 全examples[]のimageIdが ex_LNN_NNN 形式になっている
□ 全audioIdがmaster_audio_registry.jsonに予約エントリとして追加されている
□ 全imageIdがmaster_image_registry.jsonに追加されている
□ 新出語彙がruby_dictionary.jsに追加されている
□ namedCharacters[]のchar_*がmaster_image_registry.jsonに存在する
```

---

## 4. 残タスク（優先度順）

### 4-1. すぐに着手できるもの

| 優先 | タスク | 詳細 |
|---|---|---|
| 1 | **SKILL.md の作成** | `/mnt/skills/` 配下に `lesson-master-creation/SKILL.md` として作成。課マスター作成プロセス（Step 1a→1b→1c→照合）のフロー・判断基準・チェックリストを記述する |
| 2 | **lesson_02.json 整備** | 不足フィールド補完（canDoEn・practiceImageSource・audioId・isAnchor）。テンプレートのpostCompletionChecklistを使って照合する |
| 3 | **GAS セットアップ（手動）** | pipeline_setup_guide.md の手順に従い B-1〜B-4 を実施 |

### 4-2. GASセットアップ完了後

| タスク | 詳細 |
|---|---|
| B-5：Imagen 4 Ultra 追加 | generateImages.gs を修正して75枚/日化 |
| build-embedded-data.py 実行 | syncAll() 後に手動実行して両ラインを接続 |

### 4-3. 中長期

| タスク | 前提条件 |
|---|---|
| アクティビティ画像表示接続 | 画像生成フェーズ完了後 |
| lesson_template.json を使った lesson_03 以降の作成 | SKILL.md 完成後 |
| generateTextContent.gs の設計・実装 | 基本パイプライン安定後 |

---

## 5. SKILL.md 作成のための引き継ぎ情報

次チャットでSKILL.mdを作る際に必要な情報をここに記録する。

### 作成すべきSKILL.mdの仕様

**配置場所**：`/mnt/skills/user/lesson-master-creation/SKILL.md`（userスキルとして配置）

**トリガー条件（Claude AIが自動参照する条件）**：
「課マスターを作る」「lesson_NN.json を作る」「次の課を作る」「第N課のマスターを作成」などの発話

**カバーするプロセス**：

```
Step 1a：骨格設計
  - lesson_template.json をコピーしてリネーム
  - lesson.no / title / topic / level / target を決める
  - textbook_sources を記入する
  - 文型数を決め patterns[] のエントリ数を確定する
  - flow[] の文型ブロック数を patterns[] に合わせる

Step 1b：語彙設計
  - 各パターンで使う語彙を確定する
  - vocabulary.byPattern グループを設計する（グループ数は語彙の性質による）
  - 各語彙の imageId（word_*）を採番し master_image_registry.json に追加する
  - 各語彙の audioId（word_*）を採番し master_audio_registry.json に追加する
  - isFirstAppearance を確認する（前課からの引き継ぎ語彙はfalse）
  - 新出語彙を ruby_dictionary.js に追加する

Step 1c：例文設計
  - 各パターンに例文を作成する
  - 例文網羅チェック（肯定・否定・疑問・疑問詞）を行う
  - isAnchor:true を各パターン1件のみ設定する
  - 教科書原文がある場合は originalSources[] に記録する
  - 各例文に imageId（ex_LNN_NNN）と audioId（sentence_ex_LNN_NNN）を採番する
  - 新しい imageId を master_image_registry.json に追加する
  - 新しい audioId を master_audio_registry.json に追加する

Step 1d：照合
  - postCompletionChecklist（テンプレート内）を全件実施する
  - lesson_NN.json の formatVersion が 2.7 であることを確認する
```

**判断基準として記録すべき事項**：

```
practiceImageSource の選択基準：
  vocabulary           → 語彙が視覚的に独立している場合（建物・物など）
  namedCharacters      → 人物の肯定・疑問文練習の場合
  namedCharacters+vocab → 所属（〜の〜）パターンの場合。3空欄テンプレート必須。

isAnchor の選択基準：
  そのパターンの「最も代表的な1文」を選ぶ。
  教科書のモデル文・練習問題の見本文が優先候補。

shareVocabWith の使いどころ：
  疑問文パターン（p2など）が肯定文パターン（p1）と同じ語彙を使う場合に指定する。
  vocabulary.byPattern では 同じグループに patternIds を複数列挙し、
  patterns[p2].shareVocabWith = 'p1' と設定する。

practiceTemplates の件数：
  肯定文パターン → 1件
  疑問文パターン → 3件（質問・はい応答・いいえ応答）
  所属パターン   → 1件（3空欄）

conversationPhrases の使いどころ：
  文型には含まれないが授業で自然に出るフレーズ（例:「〜から来ました」）がある場合のみ追加。
  不要なら conversationPhrases[] ごと削除する。
```

---

## 6. 次チャットへのアップロード必須ファイル

### SKILL.md 作成を続ける場合

| ファイル | 理由 |
|---|---|
| **この資料**（handoff_post_merger_v1.md） | 全決定事項の記録 |
| **lesson_template.json v1.2** | SKILL.md で参照するテンプレート |
| **lesson_01.json**（最新版） | SKILL.md の例示・チェック基準の根拠 |

### lesson_02.json 整備を続ける場合

| ファイル | 理由 |
|---|---|
| **この資料**（handoff_post_merger_v1.md） | 全決定事項の記録 |
| **lesson_template.json v1.2** | 照合チェックリストとして使用 |
| **lesson_02.json**（最新版） | 整備対象 |
| **CLAUDE.md** | スキーマ要件の確認 |

### GAS作業を続ける場合

| ファイル | 理由 |
|---|---|
| **gas_pipeline_handoff_v6.md** | GASの全決定事項 |
| **pipeline_setup_guide.md** | セットアップ手順書 |
| **generateImages.gs** | B-5（Imagen 4 Ultra追加）の修正対象 |

---

*作成日：2026-05-16*
*根拠資料：handoff_merger_v1.md / lesson_master_rules_handoff_v19.md / lesson_01.json v2.11.4 / CLAUDE.md / Plan_v1_1.md*
