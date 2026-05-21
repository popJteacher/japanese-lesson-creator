# 確定した最終形
- パイプラインを完全ローカル化（Node/Python）。GAS・Google Sheets・Google Drive
  はランタイムから引退。データ・素材・registry は repo ローカル。外部 API
  （Gemma/Gemini 分類・翻訳、Cloud TTS、Imagen）はローカルから .env の鍵で呼ぶ。
- 規律は不変：小さく区切る／検証する／リポジトリが記憶／一度に一つ。
  変えるのは"狙う先"のみ＝各 Phase は GAS 依存を1つ殺す。
- 不変条件：各 Phase 完了後、人間の手作業 GAS は前 Phase より必ず減る。

# Phase 0（完了済み・現在地の明示）
真実の確定：repo-as-brain／REFERENCE.md 実測確定／validator・invariants。

# Phase 1：分類・翻訳のローカル化
- classify/translate 相当をローカルへ。GEMINI_API_KEY はローカル .env
  （初日から .gitignore 登録。過去に .gitignore バグを踏んだ前例あり）。
- API レート制限（RPM/TPM/RPD）へのスロットリング＋backoff を最初から設計
  （GAS の BATCH_SIZE:3 timeout 対策が API レート対策に置き換わるだけ）。
- 同値検証：ローカル分類出力 == 現 GAS 出力 を diff 確認してから切替。
  exportVocabTypes は"一度きりの基準スナップショット"として使い検証後に永久引退。
- 完了＝ exportVocabTypes 不要・vocab_type をローカルが生成・invariants C 継続 PASS。

# Phase 2：registry を repo ネイティブ化
ローカルが registry を repo に直接書く。Drive download/upload ループ廃止。
完了＝ Drive registry 経由の手作業ゼロ。

# Phase 3：音声のローカル化＋音声 QC（完了 2026-05-20）
Cloud TTS（Neural2）をローカルから呼ぶ＋月間文字カウンタ。ffmpeg で
loudnorm／トリム／フェード QC を追加（注記：移設でなく獲得。GAS は ffmpeg
不可で QC 不可能だった）。完了＝ generateAudioBatch の GAS 消滅・音声 QC 稼働。

**完了結果（2026-05-20 v7.4）**：
- ローカル `scripts/generate-audio-local.mjs` が Cloud TTS Neural2 でバッチ合成、
  `data/audio/*.mp3` を出力、`master_audio_registry.json` を local path に更新
- ffmpeg two-pass loudnorm + silenceremove + afade を `scripts/lib/audio-qc.mjs` で適用
- `invariants[D]`（55/55 PASS、3 WARN）で QC スペックを機械検証
- 月間文字カウンタ（既定上限 800,000 / 100 万文字無料枠の 80%）
- GAS `generateAudioBatch` セクション全削除 → `archive/gas_old/generateAudio_v2_0_phase3_retired.gs` に保全
- 横断課題は `docs/PHASE_BACKLOG.md` の Phase 4 セクションに退避（registry 未登録 120 件 + word_新聞 sync 漏れ）
- 残作業：人間タスクとして GAS Triggers `generateAudioBatch`（毎日 10:00）削除

## Phase 3 スライス（2026-05-20 確定）

順序付き ①〜⑥。各スライス完了時にコミット境界を切る。
active なスライスは `NEXT_ACTIONS.md` に 1 件だけ載せる。

- **①** Cloud TTS SA 鍵・`.env` 設計・`scripts/check-tts-sa.mjs` で疎通確認。
  完了＝ `npm run check-tts-sa` PASS。
- **②** `scripts/lib/tts-client.mjs` で Cloud TTS Neural2 を 1 件合成。
  まだ QC なし／バッチなし／カウンタなし。完了＝ 1 件 mp3 がローカルに出る。
- **③** `scripts/generate-audio-local.mjs` ＝ バッチ＋月間文字カウンタ＋上限ガード
  ＋ registry 連携（`status=null` のみ拾う）。完了＝ L02 例文の合成が一周し、
  `missing-assets` の `null_audioUrl` が減る。QC は未組込みでよい。
- **④** ffmpeg QC（loudnorm / トリム / フェード）パイプライン組込み。
  ③ の出力を QC 通したものに置換する。完了＝ 全 mp3 が QC 通過版。
- **⑤** 音声 QC スペック検証スクリプト（`npm run validate-audio` 系）。
  LUFS／duration／clipping を invariants に追加し、既存 GAS 生成音声との
  並列 A/B 確認も行う（bit 一致ではなくスペック合格を見る）。
  完了＝ invariants D（仮）= 音声 QC PASS が validate 出力に出る。
- **⑥** GAS `generateAudioBatch` 退役。コードを `archive/gas_old/` へ保全し、
  `gas/pipeline.gs` から該当セクション削除。人間が GAS トリガー
  `generateAudioBatch`（毎日 10:00）を削除し、削除確認を docs 反映。
  完了＝ 生存中の GAS トリガー 0 件・`NEXT_ACTIONS.md` の人間タスク欄が空。

# Phase 4：画像の呼び出し側ローカル化（完了 2026-05-21）
Imagen 呼び出しをローカルへ。これで **GAS の自動実行 trigger は完全消滅**（手動
GAS の seedLesson01 / extractFromGoiList / importFromLessonJson と Sheet / Drive
は **入力系として残存** — 別 Phase 5 で対処）。明示保留（移行を止めない下流
決定）：有料 Imagen 継続 か 自前 Stable Diffusion か は GAS trigger 消滅"後"に別決定。

**Phase 4 完了条件の再定義（2026-05-21）：**

当初のスライス ④⑤（image QC パイプライン + invariants[E]）は Phase 3 と同じ
「移設でなく獲得」枠で、当初は Phase 4 完了の必須項目として位置付けていた。
しかし v3.11.1 人間検証（2026-05-21）で **④⑤ の機械検証は教育的・芸術的
質の判定には役立たない**ことが判明（学生 2 アングル / 肌色収束 / 柄不足 /
正面 view 再現 等は ④⑤ では検出できない・防げない）。Phase 4 のコア目的は
「GAS 完全消滅」であり、これは ③ と ⑥ で達成可能。

→ **Phase 4 完了 = ③ + ⑥ で達成。④⑤ は `docs/PHASE_BACKLOG.md` の
Phase 4 後 backlog に明示移管。** registry-as-canon 規律により画像は後から
`--force` 再生成で差し替え可能なので、Phase 4 後の iterative 改善で
v3.12+ プロンプトガイドと併せて品質向上を追求する。

**完了結果（2026-05-21 v7.5）**：
- ローカル `scripts/generate-images-local.mjs` が Imagen 4 でバッチ生成、
  `data/images/*.png` を出力、`master_image_registry.json` を local path に更新
- Client は `scripts/lib/imagen-client.mjs` に retry/backoff・課金算出・billing 未有効化エラー判別込みで設置
- マスタープロンプトガイド：`prompts/master_prompt_design_guide_v3_11_1.py`（hash `a79e54a29e51`）
- ③ smoke 5 件完走（`word_医者 / 会社員 / 学生 / 大学生 / 先生`・$0.20）／PNG QC A1〜A4 全件 PASS
- 人間目視で品質 3 課題（線スタイル不一致 / 学生テキスト焼き込み / 会社員 photoreal drift）発見＝v3.12 修正候補として `docs/PHASE_BACKLOG.md` に保全（既存 6 + Imagen 4 由来 3 = 計 9 項目）
- GAS `generateImageBatch` セクション + 関連 Sheet 操作 utility 9 件全削除（gas/pipeline.gs 2815→799 行）→ `archive/gas_old/generateImages_v5_3_phase4_retired.gs` に保全（2222 行）
- GAS Triggers から `generateImageBatch` × 3 件（9 / 13 / 17 時）削除完了（2026-05-21 人間検証済）
- ④⑤（image QC / invariants[E]）と 残り 436 件本生成は `docs/PHASE_BACKLOG.md` Phase 4 後 backlog に移管

## Phase 4 スライス（2026-05-20 確定）

順序付き ①〜⑥。Phase 3 と同じく各スライス完了時にコミット境界を切る。
active なスライスは `NEXT_ACTIONS.md` に 1 件だけ載せる。
③④⑤ は `phase4-prompt-plan` の master prompt guide 修正プラン取り込み後に
詳細を確定する（プラン依存）。① と ② は **プラン非依存・先行実装可**。

- **①** Imagen API バックエンド = **Google AI Studio**（Phase 1 の `GEMINI_API_KEY`
  を流用、SA 不要）。`.env` 設計・`scripts/check-imagen-key.mjs` で疎通確認。
  Imagen 4 に無料枠はなし（Fast $0.02 / Standard $0.04 / Ultra $0.06 per image）—
  事前に AI Studio コンソールで billing を有効化する人間タスクが前提。
  完了＝ `npm run check-imagen-key` PASS（ListModels が `imagen-4.0-generate-001`
  系を返し、`x-goog-user-project` 等の権限エラーが出ない）。プラン非依存。
- **②** `scripts/lib/imagen-client.mjs` で `imagen-4.0-generate-001` を 1 件生成。
  `scripts/_imagen-smoke.mjs` から固定プロンプトで叩く。まだ QC なし／バッチ
  なし／registry 連携なし。完了＝ 1 件 PNG が `.tmp_verify/_imagen_smoke.png`
  に出力され、PNG 署名（`89 50 4E 47`）が検出される。billing 有効化の最終
  検証も兼ねる。プラン非依存。
- **③ ＜プラン強依存＞** `scripts/generate-images-local.mjs` ＝ プロンプトビルド
  ＋バッチ＋日次 RPD カウンタ＋上限ガード＋ registry 連携（`status=pending` /
  `null` のみ拾う・`master_image_registry.json` を local path で更新）。
  プロンプトビルドは取り込んだ master prompt guide 版を使う（GAS の v2.9.1
  相当 STYLE_RECIPE をローカルに移設）。完了条件（**2026-05-21 最小化版**）＝
  **`--limit 5` で 5 件 smoke 生成して PNG 出力 / registry 更新 / missing-assets
  件数 -5 を同値検証 PASS**（コスト $0.20）。残り全件生成は v3.12 マスタープロンプト
  ガイド修正後に Phase 4 後 backlog として段階的実施する。QC は未組込みでよい。
  **理由**：v3.11.1 で 6 件の構造的問題が露呈しており、全件生成すると v3.12 後の
  `--force` 再生成と二重コスト（$35 vs $18）。Phase 4 のコア目的は「GAS 完全消滅」
  でこれは ⑥ で達成されるため、③ は「ローカル化稼働の同値検証」最小で十分。
- **④ ＜Phase 4 後 backlog 移管・2026-05-21＞** 画像 QC パイプライン
  （`scripts/lib/image-qc.mjs`）。プラン側で確定したスタイル不変条件
  （サイズ／フォーマット／透過／余白／カラーチェック等）を機械検証として
  組み込む「移設でなく獲得」枠。設計下書きは `docs/PHASE_BACKLOG.md` に退避済。
  Phase 4 完了後に個別着手。
- **⑤ ＜Phase 4 後 backlog 移管・2026-05-21＞** 画像 QC スペック検証スクリプト
  （`npm run validate-images` 系）＋ `invariants[E]` を `npm run validate`
  出力に追加。LUFS 相当として画像のサイズ／パレット適合／余白比率を検査。
  Phase 4 完了後に個別着手。
- **⑥** GAS `generateImageBatch` 退役。コードを
  `archive/gas_old/generateImages_v5_3_phase4_retired.gs` に保全し、
  `gas/pipeline.gs` から該当セクション（generateImageBatch / testSingleImage /
  previewPrompts / retryImages / setupImageTriggersX3 / setupImageDailyTrigger
  および付随ヘルパ）を削除。人間が GAS トリガー `generateImageBatch` × 3 件を
  削除し、削除確認を docs 反映。完了＝ 生存中の GAS トリガー 0 件・GAS 完全消滅・
  `NEXT_ACTIONS.md` の人間タスク欄が空。

# Phase 5：入力系のローカル化（未着手・スコープ確定 2026-05-21）

Phase 4 完了時点で **trigger 駆動の GAS 自動実行は 0 件**になったが、以下が
入力系として残存し、user が当初想定していた「完全ローカル」とは gap がある：

| 依存先 | 現状の役割 |
|---|---|
| **GAS（手動実行）** | `seedLesson01.gs` / `extractFromGoiList.gs` / `importFromLessonJson.gs` の 3 系統 |
| **Google Drive** | `Goi_List.pdf` / `lesson_NN.json` が Drive 上に存在し GAS が読む |
| **Google Sheets** | Vocabulary / Examples シートが行単位状態台帳として残存 |

冒頭の「GAS・Google Sheets・Google Drive はランタイムから引退」（line 2-4）を
完成させるための Phase。Phase 1〜4 が「実行系のローカル化」だったのに対し、
Phase 5 は「**入力系（編集 / 取り込み）のローカル化**」。

**完了条件：**

```
gas/pipeline.gs 削除済（⑥）
+ 新規課追加がローカルだけで完結する（⑤ で例文画像 line 含めて達成）
+ Vocabulary / Examples シート撤去済（人間タスクとして残る）
```

## 設計判断（2026-05-21 user 議論で確定）

1. **catalog アーキテクチャは source 非依存**：`data/vocab_catalog.json` を SSOT として
   確立し、`sourceIds[]` で複数ソース（Goi_List N5〜N1 / 将来別書籍 / 自作リスト）を
   受け入れる構造にする。dedup キー = word+reading。Goi_List を SSOT そのものとはせず
   「最初の流入元」として扱う。
2. **抽出 script は移植せず凍結**：`extractFromGoiList.gs` のロジックは一度だけ
   local 実行 → `data/sources/goi_list_raw.json` に凍結 → 抽出 script は archive 行き。
   将来別ソースが来たら新規 importer を書く（既存 script は触らない・メンテ不要）。
3. **例文画像 line を Phase 5 に統合**：完了条件「新規課追加がローカルだけで完結」を
   満たすには例文画像のローカル生成が必須。例文用 master prompt template は worktree
   側で新設し、build_prompts.py を catalog 駆動 + 全 vocab_type 対応に拡張する。
4. **catalog-driven 先行 prompt 生成 + 予算駆動 batch 生成**：vocabulary 画像は catalog
   全件に対して先行 prompt 生成（無料）＋ `npm run generate-images -- --limit N` で
   user 都合の batch 生成（コスト分散）。例文は lesson-scoped のため先行生成不可。
5. **v3.12 マスタープロンプトガイド person 品質修正は Phase 5 と独立**：修正 1-6 は
   PHASE_BACKLOG「Phase 4 後 backlog」に残置。Phase 5 ④ の worktree 作業とは別
   タイミングで着手（既存 v3.11.1 画像は --force 再生成しない限り変わらないため
   timing 制約なし・user 判断 2026-05-21）。
6. **音声自然さチェックは Phase 5 と独立**：Gemini 2.5 audio path で PHASE_BACKLOG
   「Phase 3 後 backlog」に記録済（着手は Phase 5 完了後・user 判断 2026-05-21）。

## Phase 5 スライス（2026-05-21 確定）

順序付き ①〜⑥。Phase 3/4 と同じく各スライス完了時にコミット境界を切る。
active なスライスは `NEXT_ACTIONS.md` に 1 件だけ載せる。
**① と ④ は依存関係なく並行可能**（main / worktree 別セッションで進める。
1 セッション = 1 worktree の規律は維持）。

- **①** Goi_List 全レベル抽出 + raw source 凍結。**main 専属・プラン非依存**。
  既存 `extractFromGoiList.gs` のロジックを一度だけ local 実行して全レベル
  （N5/N4/N3/N2/N1）を抽出し `data/sources/goi_list_raw.json` に凍結。
  抽出 script は `archive/scripts_old/` 行き（再実行不要）。
  完了＝`data/sources/goi_list_raw.json` が全レベル commit 済・抽出 script 凍結済。

- **②** `vocab_catalog.json` の確立。**main 専属・プラン非依存（① 完了後）**。
  `scripts/build-catalog.mjs` 新規作成（source-agnostic スキーマで構築・
  dedup = word+reading・`sourceIds[]` / `lessonRefs[]` 保持・既存 lesson_01/02
  vocabulary も統合）。`scripts/classify-and-translate.mjs` を catalog 入力に
  切替。完了＝`vocab_catalog.json` が SSOT 化・`npm run validate` PASS。

- **③** `import-lesson.mjs` の vocab 配線。**main 専属・プラン非依存（② 完了後）**。
  `scripts/import-lesson.mjs` 新規作成（lesson_NN.json → catalog 追記 +
  registry pending 追加・**vocab のみ**）。Drive 参照を `data/lessons/lesson_NN.json`
  に切替。**例文配線は ⑤ で行う**（④ worktree 作業を待たずに main 側を進める分離）。
  完了＝`npm run import-lesson -- --lesson 01` が `seedLesson01` 同等動作で完走。

- **④ ＜プラン強依存・worktree 専属＞** 例文 master prompt template 新設 +
  build_prompts.py 拡張。**① と並行可能**。`master_prompt_design_guide_v3_N.py`
  に `vocabulary_example_sentence` template 新設（STYLE_BIBLE / 不変条件を
  vocabulary_person から継承）。`build_prompts.py` を catalog 駆動 + 全 vocab_type
  （person / concrete_object / building / action_verb / adjective / etc.）+
  例文にスコープ拡張。**v3.12 person 品質修正 1-6 は別作業（PHASE_BACKLOG 残置）**。
  完了＝`python scripts/build_prompts.py --catalog` で vocab 全タイプ + 例文の
  prompt JSON 出力・`invariants[C]` PASS。

- **⑤** 例文配線 + smoke 生成。**main 専属・プラン依存（③ + ④ 完了後）**。
  ③ の `import-lesson.mjs` を ④ の builder に接続（vocab + 例文両方の prompt が
  registry に乗る）。lesson_02 例文 5 件 smoke 生成（nanobanana・~$0.20）で
  同値検証。完了＝lesson_02 例文 5 件が pending→ready まで通り、
  `missing-assets` の image missing が -5。

- **⑥** GAS 入力系 3 系統 + Sheet/Drive 退役。**main 専属・プラン非依存（⑤ 完了後）**。
  `gas/pipeline.gs` から seedLesson01 / extractFromGoiList / importFromLessonJson
  を削除 → `archive/gas_old/inputs_v1_phase5_retired.gs` に保全。`gas/` ディレクトリが
  空になればディレクトリごと撤去。**Sheet 削除は人間タスクとして残す**（Sheets API
  経由削除はやらない）。完了＝`gas/` ディレクトリ削除済・人間タスク欄に
  「Sheet (Vocabulary/Examples) 削除確認」のみ残る。

# 横断要件（全 Phase）
- データ＋行単位状態台帳（現シート：語彙438／例文1027＋status 列）を
  repo ローカル JSON に移す（SSOT）。**Phase 5 のメインゴール**として扱う。
- 人間ビュー：シートの一覧性を `npm run status` 等で代替。
- 各 Phase に「完了＝この検証が通る」を1行明記。
