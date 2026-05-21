# docs/PHASE_BACKLOG.md — Phase 別の退避中項目

> これは凍結ではなく退避。各項目は所属 Phase の active 化と同時に作業対象に戻る。
> ロードマップ本体は `docs/MIGRATION_PLAN.md`。現在 active な作業は `NEXT_ACTIONS.md`。

最終更新：2026-05-21（word_新聞 sync 漏れ解消・画像 QC 仕様 下書きを Phase 4 ④ 退避項目として追加）

---

## Phase 1（active）で取り出す項目

### v3.2 ガイド SMOKE 3 語の S列再生成
- 出所：旧 NEXT_ACTIONS ③（`archive/handoffs/progress_handoff_v14_0.md` §4 の手順）。
- 退避理由：Phase 1 で classify/translate をローカル化する際、ローカル分類で vocab_type を
  再走査して PASS を確認する形に組み込む（exportVocabTypes 引退の同値検証と一緒に走らせる）。
- 戻し方：Phase 1 完了条件の検証ステップとして実行。生成 S列は `data/image_prompts_lessonNN_v3_N.json`
  に置き、`invariants[C]` が自動検査する（`docs/REFERENCE.md` §3-3 に準拠）。

---

## Phase 2 で吸収される項目（個別作業として着手しない）

### Drive→repo 取り込みのスクリプト化（`scripts/pull-registries.mjs`）
- 出所：旧 NEXT_ACTIONS ②。`https://drive.google.com/uc?export=download&id={ID}` で取得して
  `data/master_*_registry.json` に上書きする自動化案。
- 退避理由：Phase 2 で registry を repo ネイティブ化する＝ローカルが registry を repo に
  直接書くため、Drive download/upload ループ自体が消滅する。先に作ると Phase 2 で捨てる。
- 戻し方：戻さない。Phase 2 で「Drive registry 経由の手作業ゼロ」を達成した時点で恒久解決。

---

## Phase 4 で取り出す項目（Phase 3 完了時に退避）

### registry 未登録 120 件のバックフィル
- 出所：Phase 3 ③ で `npm run generate-audio --dry-run` 実行時に検出。
  Vocabulary シートに存在するが `master_audio_registry.json` に entry が無い語
  （`word_十` / `word_遠い` / `word_十日` / `word_どこ` 等 120 件）。
- 退避理由：Phase 3 は registry-as-canon 規律で「registry に entry が無い id は skip + warning」。
  音声合成の対象から外れる。バックフィル方針（自動追加 vs 手動追加）は Phase 4 で
  画像 registry も含めて統一的に決める方が筋（同じ問題が image 側にもある）。
- 戻し方：Phase 4 active 化時に NEXT_ACTIONS に移す。registry 自動補完スクリプト
  `scripts/backfill-registries.mjs`（仮）で sheets → registry entry 自動生成。
  各 id に `audioUrl: null` の空 entry を作って後続の generate-audio で埋められる状態にする。
  120 件 + image 側不足分を一度に処理。

### 画像 QC 仕様（Phase 4 ④ 設計下書き）
- 出所：NEXT_ACTIONS B-4「Phase 4 ④ 設計の下調べ」として 2026-05-21 に main で作成。
  当初 `docs/REFERENCE.md` §3-4 に置いたが、REFERENCE は「実ファイルから転記された
  確定値」を置く文書であり DRAFT は規律違反のためここに退避。
- 退避理由：実装（`scripts/lib/image-qc.mjs`）がまだ存在しない。Phase 4 ④ active 化
  までは「設計案」であり、しきい値（ΔE / distinct color / 余白率）はすべて未校正。
- 戻し方：Phase 4 ④ 着手時に `_image-qc-calibrate.mjs`（後述 Step 1〜4）を実行して
  実機値で校正 → `image-qc.mjs` 内 `CALIBRATION` constant に転記 → 本セクションの
  確定値部分を `docs/REFERENCE.md` §3-4 に新規記載（DRAFT 昇格ではなく新規執筆）。
  本セクションは Phase 4 ④ 完了時に削除する。

#### 設計（パイプライン位置）

```
generate-images-local.mjs (Imagen 4 呼出)
  → PNG Buffer
  → image-qc.mjs::inspect(buf, { vocabType, expectedSize })    ← ここで検証
  → { hardErrors[], warnings[], meta }
  → hardErrors > 0 なら data/images/ に書かず status=failed_qc に倒す
  → 全 PASS（または WARN のみ）なら書き込み + registry 更新
```

audio QC（`applyQc` が変換器）と異なり画像 QC は **検証専用**（PNG を改変しない）。
理由：Imagen 出力は確定の PNG であり、ffmpeg 相当の自動補正（loudnorm 等）に対応する
画像処理（リサイズ・背景置換）はやらない方針（プロンプト側で制御する規律のため）。

#### 検証項目（HARD = ERROR / SOFT = WARN）

**A. フォーマット・形状（HARD）**

| # | 検査 | 期待値 | 出所 |
|---|---|---|---|
| A1 | PNG signature | 先頭 8 byte = `89 50 4E 47 0D 0A 1A 0A` | IHDR chunk parse 前段 |
| A2 | 幅・高さ | `--size 1K` → 1024×1024 / `--size 2K` → 2048×2048 | imagen-client.mjs VALID_IMAGE_SIZES |
| A3 | アスペクト比 | width == height（`--aspect 1:1` 想定。他比率は将来） | imagen-client.mjs `aspectRatio` |
| A4 | bit depth | 8（IHDR byte 24） | Imagen 実測（`.tmp_verify/_imagen_smoke.png`） |
| A5 | color type | 2（RGB）または 6（RGBA） | Imagen 実測 = 2。RGBA は手動 import 由来想定 |
| A6 | ファイルサイズ範囲 | 100KB ≤ size ≤ 5MB（1024px の場合） | smoke 実測 663KB を中心に上下 1 桁 |

A1〜A4 が外れたら **HARD ERROR**（registry に書かず再生成）。
A5 は WARN（パレット PNG など想定外色空間で来た場合のみ）。
A6 は WARN（極端な値だけ捕捉する保険）。

**B. 背景色（HARD/WARN）**

vocab_type 別の期待色（プロンプトガイド §3-3 M-5 と整合）：

| vocab_type 群 | 期待背景色（RGB 近似・**未校正**） | 許容 ΔE2000 |
|---|---|---|
| default（`person` / `concrete_object` / `abstract_concept` / `action_verb` / `adjective` 等） | warm off-white `cream` ≈ (248, 244, 232) ± | **未校正**。Step 3 のルールで決定 |
| `building` | pale sky-blue ≈ (190, 220, 240) ± | 同上 |
| `flag` | 国旗・例外（背景チェック対象外） | スキップ |

**サンプリング方法：**
- 上端 8 行・下端 8 行・左端 8 列・右端 8 列の **角を除いた中央領域**から
  ピクセル中央値（median, not mean — 服のはみ出しに頑健）を取る
- 4 辺の中央値の最大-最小差が ΔE > 5 → WARN（背景にムラがある可能性）
- 全体中央値が期待色から外れた距離で HARD/WARN 判定

**理由：** Imagen は時々背景に淡いグラデーションを残す。`flat-solid-only`
（プロンプト §3-3 不変条件 #3）の機械検証として最低限の数値裏付けを得る。

**C. 余白・配置（WARN のみ）**

人物（`vocab_type=person`）専用：
- 上端 4 行が全部背景色である（頭頂上に margin）
- 下端 4 行が全部背景色である（足元が切れていない）
- 左端 / 右端 4 列の上位 60% が背景色である（左右に "empty margin" がある）

これらは Imagen の構図ブレ検出。すべて満たさなくても画像として使えることがあるので
**WARN のみ**（人間レビュー喚起）。HARD には絶対しない。

**D. flat color 適合度（WARN のみ）**

- PNG を 32 階調に量子化し distinct color 数を数える
- 系統別の WARN しきいは Step 3 のルールで決定
- 実機で校正するまで HARD は当てない

#### 出力スキーマ

`image-qc.mjs::inspect` の戻り値：

```javascript
{
  pass: true | false,                    // hardErrors.length === 0
  hardErrors: [                          // 致命的（再生成対象）
    { code: 'A2_SIZE', message: 'expected 1024×1024, got 1024×1280' }
  ],
  warnings: [                            // レビュー喚起
    { code: 'C_HEAD_MARGIN', message: 'top 4 rows contain non-background pixels' }
  ],
  meta: {                                // 計測値（registry / レポートに残す）
    width: 1024, height: 1024, bitDepth: 8, colorType: 2,
    fileSize: 663677,
    bgColor: { r: 248, g: 244, b: 232 },
    bgVarianceDeltaE: 2.1,
    distinctColors32: 47,
  }
}
```

#### `invariants[E]` 追加提案

Phase 3 ④ の `invariants[D]`（音声 QC PASS 集計）に倣い、
`scripts/invariants.mjs` に `checkImageQc` を追加：

- 入力：`data/master_image_registry.json` の active エントリ群
- 各エントリの `images[0].imageUrl` が `data/images/*.png` ローカルパスなら QC 再走査
  （`drive.google.com` URL は Phase 4 完了まで対象外＝WARN として未ローカル化件数を表示）
- 出力：`invariants[E] 画像 QC: NN/MM PASS（うち K WARN）`
- HARD ERROR の発生は invariants 全体を ERROR に倒す（validate exits non-zero）

これにより `npm run validate` 一発で 「ガイド hash（B）」「S列プロンプト（C）」
「音声 QC（D）」「画像 QC（E）」が一目で揃う。

#### 校正手順（Phase 4 ④ 着手時に必ず実行）

**Step 1: 校正サンプル生成**

`scripts/_image-qc-calibrate.mjs`（新規・smoke 系と同じ位置づけ）を作成し実行：

- 対象 vocab_type（4 系統・**最低 N=5 枚／系統 = 計 20 枚**）：
  - `vocabulary_person`（lesson_01 の 12 件から無作為 5 件）
  - `vocabulary_concrete_object`（v3.8 には未含のため lesson 全体から 5 件選定）
  - `vocabulary_abstract_concept`（同上）
  - `vocabulary_building`（同上。背景が pale sky-blue である唯一の系統）
- 各サンプルで Imagen 4 standard 呼出（1 枚 $0.04 × 20 = **$0.80**）
- 出力：`.tmp_verify/image_qc_calibration/{vocab_type}_{N}.png`
- 実行前に人間に課金額を提示して承認を取る（GEMINI_API_KEY 課金）

**Step 2: ピクセル統計の抽出**

同スクリプトで各 PNG から：
- 角を除く 4 辺の median RGB（B 検査用）
- 32 階調量子化後の distinct color 数（D 検査用）
- 上端・下端・左右端 4 行/列の背景色一致率（C 検査用・person のみ）

JSON を `.tmp_verify/image_qc_calibration/stats.json` に書き出し。

**Step 3: しきい値決定（機械的ルール・人間が眼で決めない）**

ピクセル統計に対して以下を計算：

- **B（背景色）：** vocab_type 別の median RGB を計算 → 期待値とする。
  ΔE2000 の **WARN しきい = 観測値の最大乖離 × 1.5**、
  **HARD しきい = 観測値の最大乖離 × 2.5**。
- **C（余白）：** 観測された不一致率の **95 パーセンタイル × 1.5** を WARN しきいに。
  HARD は設けない（人間レビューに委ねる）。
- **D（distinct color）：** vocab_type 別の観測値の **95 パーセンタイル × 1.2** を
  WARN しきいに。HARD は設けない。

すべてスクリプトが自動算出し JSON に記録（人間が「これくらいで」と決めない）。

**Step 4: 結果を仕様に反映**

stats.json + 決定したしきい値を `image-qc.mjs` 内の `CALIBRATION` constant
として転記（`audio-qc.mjs` の `QC_PIPELINE` 露出と同じ流儀）。
完了したら本セクションの**確定値部分**（A〜D 仕様 / 出力スキーマ / invariants[E]）を
`docs/REFERENCE.md` §3-4 に**新規執筆**（DRAFT 昇格ではない）。
校正コスト（$0.80 / 20 枚）と最新校正日も REFERENCE に転記して再校正時の予算把握に使う。

校正対象 vocab_type を後で増やす場合（family / verb-action 等）は、
このスクリプトを再実行して該当系統の数値を追加する（差分追記方式）。

---

## Phase 4 完了後の content backlog

### 画像 asset coverage 62 件未充足
- 出所：旧 NEXT_ACTIONS ①。active 103 件中 62 missing
  （内訳：`null_imageUrl_rows=23` ＋ `no_images_array=39`）。
- 退避理由：これは生成側＝Sheets の `imageStatus` 列分布の問題
  （`pending` / `failed_N` / `failed_final` / `skipped_no_prompt` / 空欄）。
  Phase 4 で Imagen 呼び出しをローカル化した後、ローカル infra で補充する方がやり直しが少ない。
- 戻し方：Phase 4 完了後（GAS 完全消滅後）、ローカルから Imagen を直接叩いて
  62 件を埋める作業として戻す。`npm run missing-assets --type=image` の出力が
  そのままバックログとして使える。
- 参考：`failed_final` を `pending` に戻すリセット関数は `gas/pipeline.gs` line 3340 周辺
  （Phase 4 で GAS が消えるまでは GAS 側の暫定運用も可）。

### ROLE_BASED_GENERIC_PROFILES.scene_hints の未使用 / scene-rich テンプレ A2 設計
- 出所：v3.8 監査（2026-05-21）で発見。`ROLE_BASED_GENERIC_PROFILES`
  各 role に定義された `scene_hints`（教室・診察室・オフィス等の背景例）が
  `scripts/build_prompts.py` から **一切参照されていない**（grep で 0 hit）。
  約 50 行のデッドデータ。
- 退避理由：テンプレート A (vocabulary_person) の [SCENE & ACTION] が
  「Solid soft cream off-white background. No other characters or objects
  in the frame」を強制するため、`scene_hints` を使う設計が現状では成立しない。
  これと PART 1.2 ISOLATION_SAFE_PROPS_RULE（v3.7 で導入）により、role の
  視覚識別性は outfit_hints の prop 単体だけに依存する状態。
  解決路としては「scene-rich なテンプレ A2 を新設し、最小限の背景要素
  （teacher 後ろのホワイトボード輪郭、doctor の診察台の縁等）を許容する」
  だが、テンプレート全体の再設計が必要で v3.8 では膨らみすぎる。
- 戻し方：(a) v3.9 以降で「テンプレ A2 = vocabulary_person_scene_rich」を新設し、
  role 用に optionally 切り替え可能にする、もしくは (b) `scene_hints` 自体を
  削除して責務を outfit_hints + 単体 prop に完全集約する、のどちらかを選択。
  選択時の参考：v3.8 段階で role の outfit_hints だけで医者/会社員/学生/先生は
  十分弁別可能か実機検証（lesson_01 12 件を v3.8 で並列生成して判断）。

---

## 運用ルール

- 旧 NEXT_ACTIONS の OPEN は本ファイルに退避する。NEXT_ACTIONS には active な Phase の
  作業しか残さない（CLAUDE.md「最重要ルール」の規律）。
- 各項目は **所属 Phase ＋ 退避理由 ＋ 戻し方** の 3 点セットで記載する。
  記述不足のまま放置しない。
- 所属 Phase が active になったら NEXT_ACTIONS へ移し、本ファイルからは削除する。
- 永久に戻さない項目（Phase 2 で吸収されるなど）は「戻し方：戻さない」と明記する。
