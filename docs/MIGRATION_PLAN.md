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

# v4.0 マスタープロンプトガイド major-version 改修（worktree 専属・2026-05-22 pivot 決定）

> 本セクションは **Phase 5 ④ の prerequisite**。Phase 体系（GAS 依存を 1 つずつ
> 殺す）とは独立した、画像品質ラインの方針転換。worktree session
> （`.claude/worktrees/image-prompt-plan`）で着手し、main へ ff-merge する
> 既存 worktree フローに従う。

## 背景（pivot 経緯）

worktree image-prompt-plan セッション（2026-05-22）で v3.13-#1
GARMENT_REGISTER_CONSISTENCY_RULE 着手前の現状調査中、`PERSON_NATIONALITY_HINTS`
の構造的アシンメトリが論点化：

- **アジア 4 か国（日中韓越）**：伝統 silhouette（hanbok / qipao / áo dài /
  wagara）骨格 + 二色化 + 伝統 pattern が default
- **西洋・南米 3 か国（米伯西）**：modern garment + 地域 craft accent が default

ユーザー指摘：「アジア＝伝統服 / その他＝現代服」の暗黙の二分は
(1) **exoticization リスク**（実際の現地人は日常的に伝統服を着ない）
(2) **modern reality との乖離**（教科書 nationality 挿絵としても不自然）
を孕み、構造的修正が必要。v3.13-#3 は cascading 多軸 signature で拡張する
方向だったが、ユーザー提案により **逆方向の simplification = 全国共通
modern wear への統一** が採用された。

教育学的根拠：『みんなの日本語』『げんき』など主要教科書の nationality
挿絵は伝統服を使わず modern wear + 国旗 / 名札で機能している。確立された
方式に揃える方向。

## v4.0 設計核心

| 項目 | v3.12 | v4.0 |
|---|---|---|
| `PERSON_NATIONALITY_HINTS` | 国別に伝統 silhouette / craft accent / palette を持つ | 全国共通 "modern daily casual wear" 1 種類 |
| PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE | アジア 4 か国に MUST 適用 | **退役** |
| `TRADITIONAL_DRESS_PATTERN_LOOKUP` | 12+ entries | **退役**（lookup 自体不要） |
| TWO-COLOR RULE | アジア限定の asymmetric 適用 | **退役**（全国 modern で不要） |
| PART 1.7 FLAG_PLACEMENT_RULE | 5-6% ピン（左胸・袖等 4 options から hash 選択） | **再設計**：国旗視認性強化方式へ |
| PART 1.8 GARMENT_REGISTER_CONSISTENCY_RULE | v3.13-#1 提案 | **不要化**（伝統 register が消えるので一致問題が原理的に発生しない） |

## 国旗視認性方針

east_asian phenotype を共有する日中韓 3 か国の弁別は国旗依存になるため、
国旗視認性は **v4.0 の必須前提**。

- **第一試行：d（subject が手で国旗を持つ pose）** — 弁別性最大・教科書
  挿絵の慣用に最も近い
- **フォールバック：c（背景 banner / 後景に国旗）** — d で構図が崩れる
  ／視認性不足のときに切替

実機検証フェーズで d/c を判断する（事前確定しない）。

## v4.0 完了条件

```
全国 modern daily casual + 国旗視認性強化（d/c 方式確定）で
  lesson_01 person 全 12 件を v4.0 ガイド経由で再生成
+ 人間目視で日中韓 3 か国が国旗で一目区別可能
+ 7 国籍カードで exoticization なし（全員 modern wear）
+ npm run validate PASS（invariants B hash が v4.0 のものに更新）
+ archive/prompts/ に v3.12 系を退避済
```

## Phase 5 ④ との順序関係

**v4.0 が先**：Phase 5 ④（例文 master prompt template 新設 + build_prompts.py
catalog 駆動拡張）は v4.0 ガイド上で動くため、v4.0 完了後でないと着手できない。

順序：
```
[現在] → v4.0 worktree session → main ff-merge → Phase 5 ④ worktree session
       → main ff-merge → Phase 5 ⑤ → Phase 5 ⑥
```

v4.0 と Phase 5 ④ を同 worktree session で混ぜることは技術的に可能だが、
スライス境界が崩れるため分離（v4.0 完了 → main へ ff-merge → 別 worktree
session で Phase 5 ④ 着手）が原則。user 判断で混ぜることは妨げない。

## worktree 側 実装スコープ

- `prompts/master_prompt_design_guide_v4_0.py` 新規作成（v3.12 派生 +
  PART 1.6 退役 + PART 1.7 国旗強化 + PART 1.8 不要）
- `scripts/build_prompts.py` の `PERSON_NATIONALITY_HINTS` を全国 modern
  daily casual に書き直し
- `PROMPT_TEMPLATES["vocabulary_person"]` の pose / framing を国旗手持ち
  （d）対応に改修
- lesson_01 全 12 件再生成（既存 v3.12 image は invalidate・nanobanana
  ~$0.50 想定）
- `scripts/invariants.mjs` の B hash と promptGuide path を v4.0 に更新
- `archive/prompts/` に v3.12 系を退避（master_prompt_design_guide_v3_12.py
  + image_prompts_lesson01_v3_12.json）
- 視認性検証：d 案で 7 国籍カード生成 → 日中韓 3 か国が一目区別できるか
  目視確認 → 不足なら c 案に切替して再生成 → 確定したら lesson_01 全件再生成

## 想定コスト

- 7 国籍カード 1 round（d 試行）：~$0.27（nanobanana）
- 必要なら c 案で 7 国籍カード再生成：~$0.27
- lesson_01 person 全 12 件本生成：~$0.46
- 合計：$1.00 前後

## PHASE_BACKLOG v3.13 候補の扱い

- `v3.13-#1` GARMENT_REGISTER_CONSISTENCY_RULE：**v4.0 pivot で不要化** →
  PHASE_BACKLOG で retire
- `v3.13-#2` role cards plain-solid 明文化：**v4.0 で副次的に解消見込み**
  （modern wear 統一で plain-solid 規律がより自然に成立）→ 位置づけ変更で残置
- `v3.13-#3` 伝統服が薄い／無い国の signature 多軸化：**v4.0 が逆方向で
  解消** → PHASE_BACKLOG で retire
- `v3.13-#4` 新語彙の自動分類サポート (vocab_subtype)：**v4.0 とは独立**
  → PHASE_BACKLOG で保持（Phase 5 ⑥ との相互排他性は引き続き保留）

---

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
   **2026-05-22 update**：v3.12 修正候補 1-6 は v4.0 pivot（全国 modern
   daily casual wear への統一）で枠組み自体が消えるため、v4.0 完了後に
   PHASE_BACKLOG から retire 予定。v4.0 worktree session で 1-6 を
   個別に追従しない。
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

- **④ ＜並行 2 セッション・2026-05-22 設計確定＞** v4.0 完了済 →
  example-prompts worktree + 別 fresh main session の **並行スコープ**で進める。
  worktree report で 9 templates 未配線 / `vocab_catalog.json` の
  vocab_type 未付与 / `vocab_types_lesson02.json` 不在 / lesson_02 例文 28 件
  （NEXT_ACTIONS の「22 件」は誤記）が判明し、当初計画を 3 軸（Template scope
  / vocab_type fill / Builder scope）で再設計。

  **Q1 確定（A: v4.0 規律 inline 追加）：** v4.0 ガイドに既存の `example_sentence`
  template に PART 1.8 FACIAL_FEATURES / PART 1.10 HEAD_BODY_PROPORTION /
  FOOTWEAR 等の v4.0 universal rules を inline 追加して v4.0 標準化。
  「新設」は文言誤りで実態は **v4.0 規律適用**。

  **Q2 確定（A+B 並行）：** lesson 参照済 catalog 転写（A・決定論・worktree 担当）
  + Gemini 2.5 Flash で残り 17,473 件分類（B・main session 担当）。コスト
  ~$0.40-1.00。`vocab_types_lesson02.json` 不在のため、B の smoke 100 件は
  **lesson_02 18 件 + N5/N4 高頻度 82 件**で構成して lesson_02 vocab_type も
  smoke 段階で確定する設計。

  **Q3 確定（B: 例文 + 全 vocab_type 一気拡張）：** `build_prompts.py` を
  catalog 駆動 + 全 vocab_type（person / building / concrete_object /
  action_verb / adjective / abstract_concept / variant_grid / spatial_relation
  / demonstrative_kosoado）+ 例文 にスコープ拡張。9 templates + 例文を配線。

  **worktree (example-prompts) スコープ：**
  - Q1 A: `example_sentence` template v4.0 universal rules inline
  - Q3 B: `scripts/build_prompts.py` の dispatch + render 関数を 9 種類 + 例文に拡張
  - Q2 A 一部: `data/vocab_types_lesson01.json` の 17 件のみ catalog 転写
    （新規 `scripts/transcribe-lesson-vocab-types.mjs` 推奨）
  - `scripts/invariants.mjs` B hash 更新（v4.0 例文 inline 反映後）
  - 完了条件：`python scripts/build_prompts.py --lesson 1` で lesson_01 全 17 件
    （person 12 + building 5）の prompt JSON 出力・`invariants[C]` PASS

  **main 別セッションスコープ（fresh start）：**
  - Q2 B: `scripts/classify-and-translate.mjs` 拡張で Gemini 2.5 Flash classifier
    実装（`--classify` モード追加）
  - Smoke 100 件 = lesson_02 18 件 + N5/N4 高頻度 82 件
  - user 品質レビュー → 本番 17,473 件分類
  - `data/vocab_catalog.json` に vocab_type 書き戻し
  - WARN（confidence 低）件数を `data/_meta/vocab_type_warnings.json` に
  - 完了条件：catalog 全 17,508 件に vocab_type 付与・`python scripts/build_prompts.py
    --lesson 2` で lesson_02 全件（vocab + 例文 28 件）prompt JSON 出力可能になる

  **Phase 5 ④ 全体完了条件：** A + B 両方 ff-merge 後、`--lesson 1` / `--lesson 2`
  両方で prompt JSON 出力 + `npm run validate` PASS。

  注：v3.12 person 品質修正 1-6 は v4.0 で全国 modern wear に置換されるため
  退避項目自体が消える（PHASE_BACKLOG retire 済）。

- **④' ＜2026-05-22 アーキテクチャ pivot：Claude Code スキル方式＞**

  Phase 5 ④ worktree A 進行中の user との対話で、build_prompts.py 決定論方式が
  本来の設計意図と乖離していることが判明し、Claude Code スキル方式へ pivot。

  **pivot 理由：**
  - 当初設計：ガイドの普遍ルールに従って AI（チャット越し Claude）が prompt 書く →
    GAS 時代の実運用はこの形だった（`importImagePrompts()` で Claude 生成 JSON を
    S 列に投入する流れ）
  - v3.x → v4.0 ローカル化過程で `build_prompts.py` が「決定論 S列生成」と
    自己定義されてしまい、Python が手書き辞書を引いて穴埋めする形に変質
  - lesson_01 では辞書が整備されているため 17 件は動くが、Goi_List 17,508 件への
    自動展開には原理的に到達不可能
  - 当初 Claude API（Sonnet）案を検討したが、user 指示で **Claude Code スキル方式**
    に確定（API 課金 0・サブスクリプション内・GAS 時代の流れを取り戻す）

  **新アーキテクチャ：**

  | 役割 | 担当 | API 課金 |
  |---|---|---|
  | プロンプト生成（普遍ルール適用） | **Claude Code スキル `/generate-image-prompt`** | 0 |
  | プロンプト検証 | Python preflight（既存ロジック再利用） | 0 |
  | vocab_type 分類 | Gemini（既存 classify-and-translate.mjs） | 微小 |
  | 画像生成 | nanobanana / Imagen | 件単価 |
  | スケジューリング | Claude Code `/schedule` skill で daily 自動実行 | 0 |

  **運用モデル：**
  - メイン：毎日朝 X 時に Claude Code が自動起動 → 未着手 word を 20 件 pick →
    スキルで prompt 生成 → JSON 蓄積 → user が日中に手動で nanobanana 画像生成
  - chain mode：user 任意 trigger で Claude prompt + Gemini 画像 を 1 ショット連結
  - 累積：20 件/日 × 365 = 7,200 件/年 + chain 分 → 1-2 年で ~17,000 件カバー想定

  **worktree (Phase 5 ④' 専用 fresh worktree) スコープ：**
  - ガイドを 5 部構成に reorganize：PART 1 Universal Rules / PART 2 STYLE_BIBLE /
    PART 3 PROMPT_TEMPLATES / **PART 4 Vocabulary Reference Appendix（新規）** /
    PART 5 Output Instructions
  - PART 4 = 既存 PERSON_NATIONALITY_HINTS / PERSON_ROLE_LOOKUP /
    ROLE_BASED_GENERIC_PROFILES / BUILDING_CUES / OBJECT_SIGNATURES /
    ABSTRACT_METAPHORS / PHENOTYPE_PROFILES / COUNTRY_TO_PROFILE /
    ROLE_PHENOTYPE_PALETTE 等を **Python 辞書から Markdown 風 reference として転記**
    （中身は完全保全 — 何時間も実機検証で得た知識を無駄にしない）
  - `.claude/skills/generate-image-prompt.md` スキル定義新規作成
  - preflight 関数群を `scripts/lib/prompt-preflight.py` に切り出して skill から bash 経由で呼べる構造化
  - chain mode：スキル内で `npm run generate-images` を bash 起動して Gemini 画像生成と連結
  - lesson_01 で skill を手動 invoke して 17 件 + 例文 15 件の prompt 生成 →
    決定論版出力との品質比較
  - `invariants.mjs` の B hash を新ガイド hash に更新

  **完了条件：**
  - `.claude/skills/generate-image-prompt.md` invoke 可能
  - ガイド PART 1-5 構造で reorganize 済（中身保全・hash 更新）
  - lesson_01 17 件 + 例文の prompt を skill 経由で生成し preflight 全 PASS
  - `npm run validate` invariants A/B/C PASS

  **deprecated 範囲（worktree A の Q3 B 由来の Python コード）：**
  - `build_prompts.py` の `render_person` / `render_building` /
    `render_object_concrete` / `render_abstract_concept` /
    `render_action_verb` / `render_adjective` / `render_demonstrative_kosoado` /
    `render_variant_grid` / `render_spatial_relation` /
    `render_example_sentence` / `render_vocab_entry` dispatch / `compose_*` /
    `classify_person` / `phenotype_for` / `flag_placement_for` 等
  - これらは git history としては残るが、新アーキテクチャでは dead code 化
  - **Q1 A の example_sentence template inline 化（v4.1）は活きる**
  - **Q2 A の `scripts/transcribe-lesson-vocab-types.mjs` は活きる**
  - **preflight 関数群は新スキルの検証ゲートとして主役級に格上げ**

  **main B との関係：**
  - main B（Gemini で 17,473 件 vocab_type 分類）は依然必要（vocab_type は
    skill の入力）
  - ただし着手順序が変更：先に Phase 5 ④' 完了でスキルが動くことを確認 →
    後で main B で vocab_type を全件付与
  - main B も skill 方式に統一する余地あり（`/classify-vocab-type` スキル新規）—
    user 確認待ち

- **⑤** 例文配線 + smoke 生成。**main 専属・プラン依存（③ + ④' 完了後）**。
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
