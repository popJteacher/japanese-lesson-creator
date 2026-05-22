# docs/PHASE_BACKLOG.md — Phase 別の退避中項目

> これは凍結ではなく退避。各項目は所属 Phase の active 化と同時に作業対象に戻る。
> ロードマップ本体は `docs/MIGRATION_PLAN.md`。現在 active な作業は `NEXT_ACTIONS.md`。

最終更新：2026-05-22（v3.12 worktree merge を main 取り込み完了 → `docs/PROMPT_GUIDE_v3_12.md` 末尾 handoff の v3.13 BACKLOG 4 件 (#1〜#4) を新セクション「v3.13 マスタープロンプトガイド修正候補」として migrate）

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

## Phase 3 後 backlog（Phase 3 完了後に個別着手）

### 音声自然さチェック（発音・アクセント・プロソディ）
- 出所：Phase 5 設計議論（2026-05-21）。現 `invariants[D]` は技術スペック
  （LUFS / TP / 48kHz mono）のみで「自然さ」は未検証。人間の耳が SSOT 状態。
- 退避理由：Phase 5 完了条件「新規課追加がローカルだけで完結する」に不要・
  Phase 5 の主題（入力系ローカル化）と直交。Phase 3 のテーマ（音声・"獲得"
  系統）に分類される。
- 戻し方：Phase 5 完了後の任意のタイミングで着手（Phase 3 は既に完了済の
  ため即時着手可・user 判断のみ）。**user 確定（2026-05-21）：オプション (2)
  Gemini 2.5 audio マルチモーダルで実装**（包括的・~$0.5 / 500 ファイル・
  2-3 日想定）。
- 実装メモ：
  - 入力：`data/audio/*.mp3` + 元テキスト（`lesson_NN.json` から）
  - 呼出：Gemini 2.5 Flash で「この音声で対象語が自然な日本語アクセントで
    読まれているか・誤読や不自然なプロソディはないか」を確認
  - 出力：自然さスコア + 問題点コメント → registry に WARN として記録
  - `invariants[D]` に WARN 件数を集計（既存 LUFS WARN と同じ流儀）
  - **HARD ERROR にはしない**（人間レビューを置き換えない・補助に留める。
    CLAUDE.md memory `feedback_dont_preempt_visual_review` の音声版規律）
- 棄却された代替案（2026-05-21 user 議論）：
  - (1) Whisper round-trip：発音のみ対象・同音語判別不可で検出力低い
  - (3) F0 + OJAD：研究級・辞典データ入手困難・実装 2-4 週間

---

## Phase 4 後 backlog（Phase 4 完了後に個別着手）

### 画像 QC 仕様（旧 Phase 4 ④⑤ 設計下書き）
- **位置付け変更（2026-05-21）：** 当初 Phase 4 ④⑤ の設計下書きとして退避していたが、
  v3.11.1 人間検証で **④⑤ の機械検証は教育的・芸術的質の判定には役立たない**ことが
  判明（学生 2 アングル / 肌色収束 / 柄不足 等は ④⑤ では検出不能）。Phase 4 のコア
  目的「GAS 完全消滅」とは独立のため、`docs/MIGRATION_PLAN.md` Phase 4 完了条件
  を「③⑥ のみ」に再定義し、本項目は **Phase 4 後 backlog** に移管。
- 出所：NEXT_ACTIONS B-4「Phase 4 ④ 設計の下調べ」として 2026-05-21 に main で作成。
  当初 `docs/REFERENCE.md` §3-4 に置いたが、REFERENCE は「実ファイルから転記された
  確定値」を置く文書であり DRAFT は規律違反のためここに退避。
- 退避理由：実装（`scripts/lib/image-qc.mjs`）がまだ存在しない。しきい値（ΔE /
  distinct color / 余白率）はすべて未校正。④⑤ 着手は教育的質の改善（v3.12+ ガイド
  修正、後述「v3.12 マスタープロンプトガイド修正候補」）よりも優先度が下がる。
- 戻し方：Phase 4 完了後の任意のタイミングで `_image-qc-calibrate.mjs`（後述
  Step 1〜4・$0.80 / 20 枚）を実行して実機値で校正 → `image-qc.mjs` 内
  `CALIBRATION` constant に転記 → 本セクションの確定値部分を `docs/REFERENCE.md`
  §3-4 に新規記載（DRAFT 昇格ではなく新規執筆）。完了時に本セクションを削除する。
- 期待される効果：Imagen が技術的に壊れた画像を返した時の検出・再生成トリガー。
  教育的・芸術的質の改善には寄与しない（その役割は v3.12+ プロンプトガイド修正）。

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

### v3.12 マスタープロンプトガイド修正候補（worktree 担当・v3.11.1 人間検証 2026-05-21 で発見）
- 出所：main セッション（2026-05-21）が v3.11.1 で nanobanana で生成した
  7 件サンプル画像（学生 / スペイン / ベトナム / ブラジル / アメリカ / 日本 / 先生）
  をユーザーと目視レビューして発見。Phase 4 を「③⑥」最小スコープで完了させる
  方針に切替えたため、v3.12+ 修正は Phase 4 完了後の worktree 担当作業として退避。
- **Phase 5 との関係（2026-05-21 user 確定）：Phase 5 ④ には統合しない。別作業として
  独立着手する。** 理由は (a) v3.12 修正 1-6 は単語レベル（vocabulary_person）
  品質の観察に基づくため Phase 5 の例文 template 新設とは焦点が異なる、(b) 既存
  v3.11.1 画像は `--force` 再生成しない限り変わらないため timing 制約がなく独立。
  Phase 5 ④ の worktree セッションで一緒にやりたくなる誘惑があるが、混ぜると
  スライス境界が崩れるので分離する。
- 退避理由：構造修正にプロンプトガイド本体の改修が必要で、worktree 専属領域。
  main 側からは触らない（WORKFLOW.md §「worktree でやってよいこと」1-2 番）。
- 戻し方：Phase 4 完了後の任意のタイミングで worktree セッション
  （`.claude/worktrees/image-prompt-plan`）を起こし、`git merge --ff-only main` で
  本記載を取り込んでから優先度順に着手。
- 主要候補（**優先度順**）：

  1. **🔴 学生の同一人物 2 アングル問題**（**バグ**。1 件のプロンプトから
     Imagen/nanobanana が「character reference sheet」風の 2 view 画像を生成した）
     - 検証手段：`.tmp_verify/prompts_image_prompts_lesson01_v3_11_1.md` の
       student 該当プロンプト本文を grep。"view" / "angle" / "two" / "multiple"
       / "from different" 等の意図しない多視点示唆語を audit。
     - 修正候補：vocabulary_person template SCENE 句に
       「SINGLE subject only. NEVER render two or more views or poses of the
       same person in one frame.」を inline 追加。
     - 注意：nanobanana 特有の癖（reference sheet を好む）かどうかは Imagen API
       経由でも同じ問題が出るか別途検証要。

  2. **🔴 肌色の中央値収束問題**（v3.8 で導入した skin tone enumerate / 国別
     phenotype が **Imagen/nanobanana の bias で中央値 medium-warm tan に収束**。
     7 件全件で肌色が同一に見える）
     - 検証手段：v3.11.1 + v3.8 由来 PERSON_NATIONALITY_HINTS の skin tone
       enumerate 句が「Pick ONE from: fair / olive / medium / darker」のような
       選択肢方式かどうか確認。
     - 修正候補：enumerate 方式を廃止し、**国別 / role 別に explicit single tone
       を指定する方式**へ切替。例：`PERSON_NATIONALITY_HINTS["日本人"].skin_tone
       = "fair to medium fair"`、`["ブラジル人"].skin_tone = "warm medium-darker
       to deep olive"` 等の固定指定。enumerate は Imagen が安全側に倒すため効果
       なしと判明。
     - PROMPT_LITERALIZATION_AVOIDANCE_RULE.rule_a と整合（enumerate も
       placeholder の一種でモデルが literalize する）。

  3. **🟡 アジア国別 pattern allowance**（v3.10 で「アジア 4 か国二色化必須」を
     入れたが、ベトナム áo dài / 韓国 jeogori / 中国 qipao が flat solid color
     のみで柄なし。日本 wagara のみ柄あり）
     - 修正候補：`PERSON_NATIONALITY_HINTS` の韓国 / 中国 / ベトナムに以下を追加：
       - 韓国 jeogori：細密 embroidery（鶴・松・梅花文等の小型刺繍）を MUST 1 件
       - 中国 qipao / Tang suit：floral 紋様（牡丹 / 梅花 / 雲紋）を MUST 1 件
       - ベトナム áo dài：袖口・襟元に細い embroidery 線を MUST 1 件
     - TWO_COLOR_RULE との整合：柄入りは「主体色 + 柄色」で自動的に two-color
       条件を満たす（主体色を解除する必要なし）。

  4. **🟡 アメリカ人正面 view 再現問題**（v3.10 で発見された「アメリカ人だけ
     0 度正面 view」が v3.11.1 でも再現。確率揺れではなく **構造的問題**確定）
     - 修正候補：vocabulary_person template SCENE 句に普遍 VIEW_ANGLE RULE
       追加：「Subject MUST be rendered in 3/4 view (approx. 30-45 degrees off
       frontal). Pure 0-degree frontal view is NEVER permitted for vocabulary
       cards.」全 person 系プロンプトに自動適用。
     - PROMPT_LITERALIZATION_AVOIDANCE_RULE.rule_c と整合（MUST/NEVER）。

  5. **🟢 国旗パッチ placement の variation**（全 7 件で「左胸・同サイズ」に
     placement が画一化。NATIONAL_SYMBOL_ISOLATION_RULE は守られているが
     position が固定）
     - 修正候補：NATIONALITY_NOUN_POLICY に
       `FLAG_PLACEMENT_VARIATION_RULE` 追加：「Pick ONE: left chest pin /
       right sleeve patch / hat emblem / bag tag / phrasebook cover detail」
       のように 4-5 オプションから rotate。
     - 注意：rule_b（examples_only_when_literal）の正用例＝literal に描かせる
       のでこの形式で問題なし。

  6. **🟢 表情・姿勢の variation**（全 7 件で「mild smile + standing-facing-
     forward」に収束。髪型は curly/straight/wavy/short と差があるが表情と姿勢
     のみ画一）
     - 修正候補：`ROLE_BASED_GENERIC_PROFILES` の各 role に
       `pose_options` 2-3 件を追加（teacher: gesturing toward implied board /
       holding open book / pointing / etc.）。
     - expression_options も同様に role 別に 2-3 件指定。

- 補助メモ（main セッションで観察した v3.11.1 の **成功項目**。v3.12 で
  regression させないこと）：
  - ✓ アスペクト比 1:1 全件達成（v3.11.1 inline ASPECT RATIO directive 動作確認）
  - ✓ footwear 全員着用（v3.11 footwear-mandatory rule 動作確認）
  - ✓ 先生 lanyard が rectangular blank ID badge（鉛筆マーク消失・
    v3.11 PROMPT_LITERALIZATION_AVOIDANCE_RULE rule_a 動作確認）
  - ✓ NATIONAL_SYMBOL_ISOLATION_RULE：衣服内 flag print の事故ゼロ
  - ✓ アジア 4 か国の two-color 区別（v3.10 動作確認・パターン未充足は別件）

- **未検証**：外国人 signature（phrasebook + crossbody bag）が student と
  区別可能か。7 件サンプルに外国人未含。v3.12 検証時に必ず外国人を入れる。

#### Imagen 4 経由 5 件 smoke で 2026-05-21 に追加発見（v3.11.1 同一プロンプト・モデル差）

上記 6 項目は **nanobanana 7 件**由来。以下は同じ v3.11.1 プロンプトを
**Imagen 4 API**（`imagen-4.0-generate-001`）経由で 5 件（word_医者 / 会社員 /
学生 / 大学生 / 先生）生成し人間レビューで発見した、**Imagen 4 特有の構造的問題**。
nanobanana サンプルでは発生しなかった事象であり、Imagen 4 ⇄ nanobanana の
bias 差を意味する。v3.12 ではどちらのモデルでも安全に動くプロンプトに改修要。

7. **🔴 line weight / illustration style の語彙間不一致**（同一
   `vocabulary_person` テンプレで、医者は線が極めて細い or 線なし flat、
   先生は明らかに太線、学生・大学生は中間と、線の太さ・有無が語彙ごとにバラバラ）
   - 修正候補：vocabulary_person template に LINE_STYLE_LOCK 句を追加。
     例：「Clean vector-style illustration with consistent 2-3px medium-weight
     outline on all major shapes. NEVER render line-less flat shapes or
     heavy 5px+ bold outlines.」全 person 系で同一指定。
   - 参考：v3.11 で footwear-mandatory rule が動いたのと同じ規律（モデル
     依存の揺れを inline directive で潰す）。

8. **🔴 vocabulary text bake-in（学生に「学生」漢字焼き込み）**
   （word_学生 で画像左上に黒字の「学生」漢字が描画された。
   `PROMPT_LITERALIZATION_AVOIDANCE_RULE.rule_a` は placeholder 防止だが、
   **vocabulary word 自体の漢字テキスト出力を明示禁止していない**ことが露呈）
   - 修正候補：マスタールールに `NO_RENDERED_TEXT_RULE` を新設。
     「The image MUST NEVER contain any rendered text, letters, numbers,
     kanji, hiragana, katakana, watermarks, captions, or labels. Subject
     must be communicated by visual depiction alone. This includes any
     text on signs, badges, books, or clothing visible to the viewer.」
   - 副作用注意：会社員の ID badge は **blank rectangular plate** で OK
     （v3.11 lanyard rule と整合）、医者の白衣 / 学生のノートも文字なし。
     国旗の図像は text ではないので NATIONAL_SYMBOL_ISOLATION_RULE と
     衝突しない。
   - Imagen 4 は nanobanana より text generation が活発な傾向（一般的
     既知 bias）。明示禁止が必須。

9. **🔴 photorealistic style drift（会社員サンプルが illustration から
   完全に photoreal な被写体に崩壊）**
   （word_会社員 のみ filesize 1.6MB と他語彙の 2.5〜3 倍、画像内容も
   illustration ではなく photographic style。v3.11.1 プロンプトに
   `flat illustration` 等の style anchor は含まれているが Imagen 4 で
   しばしば無視される）
   - 修正候補：vocabulary_person template の冒頭 PART 0 相当に
     MEDIUM_LOCK 句を inline 配置：「MEDIUM: flat 2D vector illustration.
     NEVER photographic, photorealistic, 3D rendered, painterly, or
     sketch style. Output MUST resemble a clean educational textbook
     illustration with solid-fill shapes.」
   - 検出補助：将来 `image-qc.mjs` の D 検査（distinct color 数）が
     実装されたら photo drift は distinct color の急増で検出可能
     （illustration ≈ 50 色 vs photo ≈ 数千色）。**Phase 4 後 backlog の
     画像 QC ④⑤ 仕様（本ファイル上部）が photo drift 検出に有効である
     証拠** — ④⑤ 着手時の優先度判断材料に。

- **モデル差の重要観察（worktree への引き継ぎメモ）：**
  - v3.11.1 は当初「nanobanana 用 inline ASPECT RATIO 1:1 directive 追加 /
    Imagen 4 経由でも害なし」と判定したが、**害なしと品質同等は別物**。
    Imagen 4 経由では line weight / text / medium style の 3 軸で
    nanobanana より制御が弱い。
  - **2026-05-21 方針転換：nanobanana 一本化**。Google AI Studio UI が
    nanobanana のみ提供 + user の手動検証も nanobanana で実施しているため、
    本番自動 flow も nanobanana に統一（`scripts/generate-images-local.mjs`
    既定 backend = nanobanana。Imagen 4 は `--backend imagen4` で opt-in 残存）。
  - **v3.12 の設計指針は「nanobanana 安全」を主、「Imagen 4 安全」を従**に変更。
    具体的には：
    - 上記項目 1-6（nanobanana 由来）= **必須対応**
    - 項目 7-9（Imagen 4 由来：line weight / text bake-in / photoreal drift）
      = Imagen 4 fallback 使用時の品質保証として実装するが優先度↓
  - cross-check 推奨は維持（v3.12 検証時に nanobanana + Imagen 4 の両方で
    1-2 件サンプルを生成し、structural regression がないか確認）。
  - **2026-05-21 実機確認：項目 7-9 は nanobanana では未再現**。
    nanobanana 一本化直後に同じ v3.11.1 プロンプトで 5 件再生成（word_医者 /
    会社員 / 学生 / 大学生 / 先生・$0.1935）し human review した結果：
    - 7（線スタイル不一致）: nanobanana では出現せず（線重みが 5 件で統一）
    - 8（学生テキスト焼き込み）: nanobanana では出現せず（画像内 text なし）
    - 9（会社員 photoreal drift）: nanobanana では出現せず（5 件全件 illustration 統一・
      filesize も 944KB〜1009KB に収束、Imagen 4 時の 542KB-1606KB outlier 解消）
    → 項目 7-9 は **Imagen 4 モデル特性に起因する bias**であり、プロンプト
    側の必須対応ではなく Imagen 4 fallback の品質保証として後回しで OK。
    nanobanana では prompt の `flat illustration` style anchor が効くため
    MEDIUM_LOCK 句や NO_RENDERED_TEXT_RULE は **必須ではない**（あれば
    防御力↑）。v3.12 では項目 1-6 のみに集中して構わない。

---

### v3.13 マスタープロンプトガイド修正候補（worktree 担当・v3.12 取り込み 2026-05-22 で migrate）
- 出所：`docs/PROMPT_GUIDE_v3_12.md` 末尾 v3.13 BACKLOG handoff（worktree
  → main fast-forward merge 経由の引き継ぎ機構）。v3.12 シリーズ実装中／
  実機検証中に発見した次バージョン候補で、main session が migrate 完了印
  として handoff 元のセクションを削除する規約。
- 退避理由：v3.12 はガイド本体改修・実機検証・lesson_01 再生成まで完了
  しており、これ以上のガイド改修は v3.13 として独立 worktree session で
  着手する。Phase 5 ④（例文 template 新設）とは焦点が異なる
  （v3.13 は単語レベル改善・Phase 5 ④ は例文構造拡張）ため別作業として
  独立する（Phase 4 完了後 backlog の v3.12 セクションと同じ分離方針）。
- 戻し方：worktree セッション（`.claude/worktrees/image-prompt-plan`）で
  `git merge --ff-only main` 後、優先度順（#1 → #4）で着手。#1 は v3.12
  実機検証で既に再現観測されているため最優先。
- 想定コスト：実装はガイド本体改修と build_prompts.py の lookup 追加が
  中心で API コストは低い（再生成 smoke 5-10 件で $0.20-0.40）。

#### v3.13-#1: GARMENT_REGISTER_CONSISTENCY_RULE（新規普遍ルール）
- **背景**：v3.12 実機検証（韓国男性カード）で hanbok 風 jeogori トップ
  + modern gray trousers + 白スリップオン という「上=伝統 / 下=モダン /
  靴=モダン抜けすぎ」のレジスター不揃いが確認された。現在の v3.12 には
  衣服の register（伝統度／格式）を上下で揃えるルールが存在しない：
  `FOOTWEAR RULE`（両足に靴を履け・register 不問）/ `TWO-COLOR RULE`
  （上下で色を分けろ・register 不問）/ `TRADITIONAL_DRESS_PATTERN_RULE`
  （伝統 silhouette のとき pattern を入れろ・trousers と footwear は不問）。
- **提案**：PART 1.8 として GARMENT_REGISTER_CONSISTENCY_RULE を新設。
  ```
  原則: 上半身の register に trousers と footwear を揃える。
    rule_a: 上半身が伝統 silhouette のとき、trousers と footwear は
      (a) 同じ伝統 register（hanbok bottoms / 伝統低靴 等）OR
      (b) "muted modern neutral"（無装飾の cream/charcoal/indigo trousers
          + 無装飾の dark slip-on or simple flat = visually quiet 下半身）
      のいずれか。白スリップオン等の「新しすぎる」要素は (b) outlier として禁止。
    rule_b: 上半身が modern silhouette のとき、bottoms と footwear は modern。
  ```
- **スコープ**：日本人 (a) wagara top / (b) noragi、韓国 (a)(c) hanbok 系、
  中国 (a)(b) 中国服系、ベトナム (a)(b) áo dài 系 — すべての伝統 silhouette
  option に影響。FOOTWEAR RULE の許可リストから「visually loud」アイテムを
  register 別に切り分ける形になる。
- **実装難易度**：中。ガイド本体に rule 追記 + cultural_styling_hint の
  footwear 記述を整合。lesson_01 の現在の出力で 韓国・日本・ベトナム を
  再生成して効果検証。
- **優先度**：高（v3.12 実機で再現観測済 → v3.13 で最優先着手）。

#### v3.13-#2: role cards の plain-solid 明文化
- **背景**：`NATIONAL_SYMBOL_ISOLATION_RULE.(d)` は "graphic / printed /
  logo / patterned" garment や "unspecified print contents" を禁じているが、
  これは nationality cards 向けの規律。role cards (医者・先生・学生 等) には
  対応する明示的な plain-solid 規律が無く、nanobanana が生成的に小さな
  stripes / dots / texture を出す可能性が残る。
- **現状の実害**：未観測。lesson_01 の 5 role 画像（医者・先生・学生・
  大学生・会社員）は plain solid で出ている。ただし将来 lesson 数や role
  種類が増えたとき再発リスクあり。
- **提案**：`ROLE_BASED_GENERIC_PROFILES.[role].outfit_hints` の各エントリに
  "plain solid color (no stripes, no dots, no print, no pattern)" を追記、
  OR PART 2.2 注記として一括規律を明文化。
- **実装難易度**：低。テキスト追記のみ。
- **優先度**：低（実害観測されてから対応で十分）。

#### v3.13-#3: 伝統服が薄い／無い国の signature 多軸化
- **背景**：v3.12 の `TRADITIONAL_DRESS_PATTERN_RULE` は rule_e
  modern_styles_exempt で「伝統服がない国は entry 不要」を許容しているが、
  代替の signature 軸を提供していない。将来 ドイツ・フランス・カナダ・
  オーストラリア・オランダ 等が課に追加されたとき、cultural_styling_hint だけ
  で差別化するには記述コストが高く、Imagen の収束に再び負ける可能性がある。
- **提案**：v4.0（major-version）で `signature_for(word)` を cascading 構造化：
  ```python
  def signature_for(word):
      # 以下を順次試して最初に hit したものを返す
      return (
          TRADITIONAL_DRESS_PATTERN_LOOKUP.get(word) or
          MODERN_FASHION_ARCHETYPE_LOOKUP.get(word) or
          REGIONAL_CRAFT_ACCENT_LOOKUP.get(word) or
          FOOTWEAR_SIGNATURE_LOOKUP.get(word) or
          COLOR_PALETTE_SIGNATURE_LOOKUP.get(word) or
          None
      )
  ```
  各 lookup の例：
  | 軸 | 例 |
  |---|---|
  | modern fashion archetype | ドイツ = "minimalist Bauhaus-clean tailored coat" / フランス = "tailored navy blazer + silk scarf" / オーストラリア = "Akubra-style brimmed hat + rugged work jacket" |
  | regional craft accent | カナダ = "Cowichan-style chunky knit sweater" / メキシコ = "small huichol-bead bracelet" / アルゼンチン = "facón-belt detail" |
  | footwear signature | オランダ = "klompen-inspired wooden clog accent" / 英国 = "Wellington-style boots" / モロッコ = "babouche-style pointed slippers" |
  | color palette | スカンジナビア = "muted blue + cream" / 地中海 = "terracotta + olive + cream" |
- **実装難易度**：高（major-version 扱い）。v3.13 では設計検討のみ、実装は v4.0
  リリース時。lesson 拡張で新国追加が現実化する時期に着手。
- **優先度**：中（v4.0 候補・lesson 数 expansion 時に着手）。

#### v3.13-#4: 新語彙の自動分類サポート (vocab_subtype)
- **背景**：現在 `classify_person` は lookup miss すると build abort する設計
  で、新国籍・新役割は人間が必ず手動で `PERSON_NATIONALITY_HINTS` /
  `PERSON_ROLE_LOOKUP` 等に追加する必要がある。lesson 数増加に伴い、この
  manual lookup expansion が運用コストになる。
- **提案**：data 側に真実源を移す（`docs/MIGRATION_PLAN.md` 方向性と整合）：
  1. GAS Vocabulary シートに `vocab_subtype` 列を追加
     （例："nationality_east_asian" / "role_doctor" / "role_teacher" 等）
  2. `gas/pipeline.gs#exportVocabTypesAll()` で `vocab_types_lessonNN.json` に
     `vocab_subtype` を含めて export
  3. `scripts/build_prompts.py` は subtype を見て分類、必要 lookup の有無を
     pre-flight check で警告
- **実装難易度**：中（GAS 改修 + build_prompts 改修）。
- **優先度**：中（lesson 02, 03 拡張時に着手するのが自然）。
- **注意**：Phase 5 ⑥（GAS 入力系 3 系統 + Sheet/Drive 退役）と相互排他的に
  検討。Phase 5 で GAS が完全退役する場合、本提案の「GAS Vocabulary シートに
  vocab_subtype 列追加」は不適用となり、ローカル CSV / JSON で真実源を持つ
  設計に変える必要がある。Phase 5 ⑥ 実装方針確定後に再評価する。

---

### Phase 4 ③ 持ち越し分 436 件の本生成（v3.12 改修後に段階的実施）
- 出所：Phase 4 ③ を「5 件 smoke で同値検証 PASS」最小スコープで完了させた
  ため、残り 436 件は本 backlog 行き（2026-05-21 決定）。
- 退避理由：v3.11.1 で 6 件の構造的問題（前項「v3.12 マスタープロンプトガイド
  修正候補」参照）が露呈しており、v3.11.1 で全件生成すると v3.12 後の
  `--force` 再生成と二重コスト（$35 vs $18）。v3.12 完成後に生成する方が
  費用対効果が良い。
- 戻し方：v3.12 マスタープロンプトガイドが完成し worktree → main に merge された
  後、段階的に実施：
  ```
  # Step A: 50 件 medium（コスト $2 / sample 確認）
  npm run generate-images -- --prompts data/image_prompts_lesson01_v3_12.json --limit 50
  # Step B: 残り全件（コスト $15+ / 完走を見届ける）
  npm run generate-images -- --prompts data/image_prompts_lesson01_v3_12.json
  ```
  各 Step 後に人間目視 sample + `npm run missing-assets` で進捗確認。
  既に Phase 4 ③ で生成された 5 件は v3.11.1 由来のため、v3.12 で品質改善した
  い場合は `--force` で再生成（追加 $0.20）。
- 想定コスト合計：$17.4（最初の 5 件は ③ で計上済）+ v3.12 改修で
  品質改善を確認した imageId のみ `--force` で再生成（10-20 件想定で $0.4-0.8）。
- 完了基準：`npm run missing-assets` の image missing 件数が
  「未生成 examples」「未生成 named characters」等の構造的残件のみになる
  （目安：50 件以下）。

---

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
- セクション名「**Phase N 後 backlog**」は **テーマ別グルーピング**（Phase N の主題に
  分類されるが Phase N 中には拾わなかった作業）であり、**着手 gate ではない**。
  Phase N が既に完了している場合（現状 Phase 1〜4 すべて該当）、その backlog の項目は
  user 判断で即時着手可能。例：Phase 4 後 backlog は Phase 4（画像 line）テーマの
  退避項目で、Phase 4 完了済の現在は任意のタイミングで着手できる。
