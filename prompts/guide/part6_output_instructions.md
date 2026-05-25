# PART 6: Output Instructions

> 対象：skill が prompt 生成して JSON 出力するときの規約 + preflight 検証ゲート。
> Migrated from `prompts/master_prompt_design_guide_v4_0.py` (lines 4340-4505)
> + `scripts/build_prompts.py` (lines 83-112) + `scripts/lib/prompt_preflight.py` (full).
> See also: [PART 1](part1_universal_rules.md), [PART 4](part4_prompt_templates.md).

---

## 6.1 Output JSON schema

skill が書き出すファイルは `data/image_prompts_skill.json`（catalog-driven 単一 JSON）。
形は既存 `data/image_prompts_lesson01_v4_0.json` を踏襲。

```jsonc
{
  "_meta": {
    "mode": "skill",
    "guideVersion": "v5.0",
    "guideManifestHash": "<sha256[:12] of concatenated 6 PART file hashes>",
    "generatedAt": "<ISO 8601>",
    "generator": ".claude/skills/generate-image-prompt.md",
    "model": "claude-opus-4-7",
    "totalEntries": 17,
    "coveredVocabTypes": ["person", "building", ...]
  },
  "vocabulary": [
    {
      "imageId": "word_医者",
      "word": "医者",
      "reading": "いしゃ",
      "en": "doctor",
      "vocab_type": "person",
      "prompt": "...\n[PURPOSE]\n...\n[SUBJECT]\n...\n[NEGATIVE]\n...",
      "aspect_ratio": "1:1",
      "preflight_passed": true,
      "retries": 0,
      "created_at": "2026-05-23T10:00:00Z"
    }
  ]
}
```

### Required per-entry fields

| field | type | source |
|---|---|---|
| `imageId` | string | `word_<word>` （vocab） / `ex_lesson{NN}_p{P}_e{E}` （例文） |
| `word` | string | catalog or lesson JSON |
| `reading` | string | catalog or lesson JSON |
| `en` | string | catalog or lesson JSON |
| `vocab_type` | string | catalog の `vocab_type` フィールド（例文は `example_sentence`） |
| `prompt` | string | skill 生成 |
| `aspect_ratio` | string | `1:1` / `4:3` / `16:9` ([PART 4](part4_prompt_templates.md) で template ごとに決まる) |
| `preflight_passed` | bool | [§6.5](#65-preflight-invariants-mechanical-gates) PASS / FAIL |
| `retries` | int | 0-3 |
| `created_at` | string | ISO 8601 UTC |

### Optional fields

- `negative_prompt`: string（vocab_type 別の禁則文・PART 3 のフッタから）
- `notes`: string（人間レビュー用メモ）

### Append vs overwrite

- skill は word をキーとして既存 entry を **上書き**せず、未生成 word のみ append する（[skill 仕様](../../.claude/skills/generate-image-prompt.md) の `mode` を参照）。
- `--force` で上書き可（人間操作・自動 cron は使わない）。

---

## 6.2 QA_CHECKLIST (educational quality gates)

> 機械検証ではなく **人間目視の手がかり**。skill 出力後に user が確認するチェックリスト。
> Migrated from `master_prompt_design_guide_v4_0.py` lines 4340-4471.

### 既存チェック（v2.2 から維持）

#### character_consistency
- 同じ役割の人物が複数の画像に登場する場合、服装・髪型の整合性が取れているか
- 肌の色が generic_* キャラ間で過剰にバラついていないか（v3.3: NOT specified / multicultural variation 採用）
- 体型・シルエットが一致しているか
- 顔の形・髪型・髪の色が前回と大きくずれていないか
- 特徴的なアイテム（眼鏡・白衣・スーツ等）が一致しているか

#### style_consistency
- フラットベクタースタイルが維持されているか（グラデーション・影が入っていないか）
- 輪郭線の太さが均一か
- カラーパレットが規定の色調（[PART 2 STYLE_BIBLE](part2_style_bible.md) 参照）か
- プロンプト本文・ARROW_SEMIOTICS・reset_prompt に `#HEX` や hex value が一切残っていないか（問題F: 色名のみ運用 / v3.1 で全廃完了）
- 背景が指定通りか（語彙カード = 温かいオフホワイト〔純白ではない〕／例文 = 最小限の文脈／建物 = 淡いスカイブルー全面）
- 文字・数字・記号が画像内に入っていないか（建物の 1 語看板・矢印を除く）

#### session_drift_check
- 1 ターン目には無かった微細なディテールが自発的に追加されていないか
- 線画の太さがターン 1 から変動していないか
- 色相がリファレンス画像と一致しているか
- フレーム占有率（語彙 70-80% / 例文 60% / 建物 70%）が維持されているか

### v2.3 新規: vocab_type 別の識別性チェック

> 資料 11 より：語彙カードの教育的価値は「1 秒以内に正しく識別できるか」に集約される。
> チェック方法：完成した画像を初見で 3 秒間だけ見て、正しい語彙が想起できるか確認。

#### person
- その人物の「役割」が服装・持ち物・背景だけで即座にわかるか（[PART 5 ROLE_BASED_GENERIC_PROFILES](part5_vocab_reference_appendix.md#58-role_based_generic_profiles) 参照）
- 表情・姿勢が役割を補強しているか（医者 → 聴診器・先生 → マーカー 等）
- 多文化配慮：特定の国籍・文化のステレオタイプになっていないか

#### building
- 建物の種類が外観だけで（看板の英語ラベルを隠しても）わかるか
- primary_scene_cue（単一・低クラッター）が描かれているか（[PART 5 BUILDING_CUES](part5_vocab_reference_appendix.md#510-building_cues) 参照）
- 余計な看板・空のサイン枠・二次ラテン語（RECEPTION/ATM/OPEN 等）・日本語が無いか
- 看板の英語短語ラベル 1 個のみで、他のテキストが入っていないか

#### concrete_object
- その物体の視覚的シグネチャーが明確に描かれているか（[PART 5 OBJECT_SIGNATURES](part5_vocab_reference_appendix.md#511-object_signatures) 参照）
- 類似形状の物体（例：雑誌と本）と区別できるか
- カノニカル視点（斜め上 30-45 度）が採用されているか
- 素材感のシンボリックヒント（ステッチ・光沢線等）が入っているか

#### spatial_relation
- 基準物（ランドマーク）が無彩色、ターゲットが進出色（黄・赤）で描かれているか
- 位置関係が誤解なく 1 つの解釈しかできないか
- 「右・左」は背面構図を採用しているか（正面構図の場合は左右が逆転）
- 「前・後ろ」は一人称視点（虫の視点）になっているか
- 「中」は容器が半透明になっているか

#### demonstrative
- 話者の領域（こ）・聞き手の領域（そ）・共通外（あ）が色またはラインで明確に区分されているか
- 対面型か並行型か、どちらのモデルを使用しているかが画面から読み取れるか
- 物体がどのゾーンに属しているかが一目でわかるか

#### action_verb
- 「何をしているか」が動作の最高点またはアウトカムから 1 秒で理解できるか
- 矢印・モーションラインが動作の方向を明確にしているか（[PART 3.11 ARROW_SEMIOTICS](part3_vocab_type_rules.md#311-arrow_semiotics-reference) 参照）
- Before/After 戦略の場合：左右のパネルが同一スタイルで描かれているか

#### abstract_concept
- 使用したメタファー（[PART 5 ABSTRACT_METAPHORS](part5_vocab_reference_appendix.md#513-abstract_metaphors) 参照）が概念を直感的に伝えているか
- 感情トーンが色彩・構図・ポーズに反映されているか
- 他の抽象概念と混同しないか（例：「好き」と「嬉しい」が見分けられるか）

#### adjective
- 形容詞の「性質」が視覚化されているか（単独物体描画ではないか）
- PAIR_CONTRAST の場合：左右パネルが同一の物体クラス・同一視点・同一スケールで描かれているか
- PAIR_CONTRAST の場合：対比される性質が明確に見分けられるか（小さい/大きいなら 2 倍以上のサイズ差）
- SINGLE_HIGHLIGHT の場合：性質強調マーク（光・しわ等）が 3-5 個に収まっているか（多すぎないか）
- PROPERTY_OVERLAY の場合：オーバーレイマークがフラットな記号で描かれているか（写実的光・影になっていないか）
- 顔の表情で性質を示していないか（物体の見た目のみで意味を伝えること）

### v2.3 新規: メイヤー 12 原則チェック

> 資料 10 より：マルチメディア学習研究の知見をプロンプトに応用する。

- **一貫性の原理**：学習に無関係な装飾・背景ノイズが排除されているか（外因性負荷ゼロ）
- **シグナリングの原理**：重要な要素（ターゲット・役割・動作）が視覚的に際立っているか
- **空間的近接性の原理**：関連する要素（ターゲットとその識別シグネチャー）が画面内で近くに配置されているか
- **1 秒テスト**：その画像が何を意味するか、1 秒以内に判断できるか（Glanceability）

### v2.3 改訂: 再生成コスト防止チェック

> 3 万枚超の量産では、再生成 1 回あたり約 5 円（Gemini）のコストが発生する。
> 再生成率を 1% 下げるだけで約 1,500 円の削減になる。
> 以下のチェックで「後から直す」を防止する。

- 【最重要】上記 vocab_type_check のすべての項目をパスしているか
- 【最重要】上記 mayer_principles_check をパスしているか
- 再生成する場合：全文ゼロから書き直さず、崩れた属性だけを明示して修正する（資料 5 より）
- 再生成する場合：崩れた属性は何か？（例：財布のステッチが消えた → OBJECT_SIGNATURES を再参照して追記）
- セッションドリフトが検知されたら：そのセッションを破棄し新規セッションを開始
- 量産フェーズ開始前：vocab_type フィールドが catalog / lesson_NN.json に設定済みか確認（未設定のまま生成しない）

---

## 6.3 OUTPUT_IMAGE_SPECIFICATIONS (PNG technical specs)

> 生成画像（PNG）の出力仕様。skill が prompt を書く時点で意識する制約ではなく、
> 画像生成 backend（nanobanana / Imagen）の出力を後段で QC する規律。
> Migrated from `master_prompt_design_guide_v4_0.py` lines 4475-4501.

| 項目 | 規律 |
|---|---|
| color_space | `sRGB only` |
| bit_depth | `8-bit sRGB`（16-bit / HDR は使用しない） |
| exif_handling | 出力 PNG は EXIF メタデータを書き出さない（または投入前に削除する） |

### preprocessing workflow

1. 生成後の PNG を画像編集ツールで開く（必要時のみ）
2. 「sRGB IEC61966-2.1」プロファイルに変換
3. 8-bit に変換（必要に応じて）
4. EXIF メタデータを削除
5. PNG または高品質 JPEG で保存

---

## 6.4 Injected constraint blocks

> Migrated from `scripts/build_prompts.py` lines 100-113.
> skill は `vocab_type=person` かつ sub 判定（role vs nationality）に応じて、
> 下のブロックを `[CONSTRAINTS]` セクションに inline 注入する。

### ROLE_ANTI_FLAG_BLOCK

**When to use**: `vocab_type = person` AND `sub = role`（医者 / 会社員 / 先生 / 学生 / 大学生 / 外国人 等の役割系語彙）。

**Rationale**: Imagen / nanobanana は「役職に旗は付かない」という慣習を持たないため、
削除では不十分で明示的禁止が必要（v3.5 検証で role 5 件中 2 件に旗混入を確認）。

```
The clothing, accessories, props, and any visible badges must NEVER include any flag, national emblem, nationality pin, country indicator, political symbol, or red-and-white circular badge. This is a role-based vocabulary card, not a nationality card.
```

### NATIONALITY_EXCEPTION_BLOCK

**When to use**: `vocab_type = person` AND `sub = nationality`（日本人 / 中国人 / 韓国人 / ベトナム人 / アメリカ人 / スペイン人 / ブラジル人）。

**Rationale**: v4.0 で「全国 modern daily casual wear + 国旗両手持ち」に統一。旗は両手持ちで 12-15% 画面占有、文字なし。

```
EXCEPTION (NATIONALITY_NOUN_POLICY v4.0): a hand-held flag held in both hands in front of the chest is permitted as a clear nationality cue, occupying about 12-15% of the image area. The flag is a fabric panel with no pole or staff, face squarely toward the viewer. Absolutely no text, letters, or numbers on the flag itself.
```

---

## 6.5 Preflight invariants (mechanical gates)

> skill は prompt を JSON に書き出す前に、必ずこのゲートを通す。
> 違反があれば self-correction loop（[§6.6](#66-self-correction-loop)）に回す。
> SSOT: [`scripts/lib/prompt_preflight.py`](../../scripts/lib/prompt_preflight.py)（140 行・skill / build_prompts.py / human review すべての検証点）。

### Constants

| 定数 | 値 |
|---|---|
| `BG_EXACT_CREAM` | `soft cream off-white background (warm off-white, NOT pure stark white)` |
| `BG_EXACT_SKYBLUE` | `pale sky-blue background` (v3.0 legacy / 未移行 building 4 件のみ) |
| `NOT_TOKEN` | `NOT pure stark white` |
| `BUILDING_V4_0_4_WORDS` | `{"学校", "大学", "デパート", "会社"}` (frozenset) — v4.0.4 採用 building。BG = CREAM / NOT_TOKEN 必須 / 5-image reference / A-1〜A-11 適用 |

### Regex

| 名前 | パターン | 用途 |
|---|---|---|
| `RE_FULLBODY` | `full[-\s]?body\|head[-\s]?to[-\s]?toe` (i) | person で full-body 指定必須 |
| `RE_AREA_PERCENT` | `fills\s+\d+\s*[-–]?\s*\d*\s*%\s+of\s+the\s+image\s+area` (i) | person で面積指定残存検出 |
| `RE_PORTRAIT_LENS` | `85\s*mm\s+portrait\s+lens` (i) | person で portrait lens 指定残存検出 |
| `RE_FLAG_OR_NAT` | `flag\|nationality\|国旗` (i) | flag/nationality 文脈検出 |
| `RE_STRONG_TOKEN` | `\b(must\|never\|DO NOT)\b` | flag 文脈で強表現必須 |
| `RE_PLACEHOLDER_REMAIN` | `\[\{[A-Z_]+\}\]\|\{[A-Z_]+\}` | 未置換 placeholder 検出 |

### Gates (7 種類)

| code | 条件 | 違反 message |
|---|---|---|
| `[C4]` | 全 vocab_type | `background string 不一致（必須: '<BG_EXACT_*>'）`。v4.0.4 building 採用 4 件は BG_EXACT_CREAM 期待 / legacy building 4 件は BG_EXACT_SKYBLUE 期待 / それ以外は BG_EXACT_CREAM 期待 |
| `[C5]` | non-legacy path (= v4.0.4 building 採用 4 件 + 全 non-building vocab_type) | `NOT-token 不一致（必須: 'NOT pure stark white'）`。legacy building 4 件 (銀行 / 病院 / 駅 / スーパー) のみ skip |
| `[C1] full-body` | `template_kind == "person"` | `full-body / head-to-toe が無い` |
| `[C1] area` | `template_kind == "person"` | `面積指定 'fills NN% of...' が残存` |
| `[C1] lens` | `template_kind == "person"` | `'85mm portrait lens' が残存` |
| `[C6]` | RE_FLAG_OR_NAT match AND NOT RE_STRONG_TOKEN | `flag/nationality 文脈に強表現 must/never が無い` |
| `[PH]` | RE_PLACEHOLDER_REMAIN match | `未置換 placeholder 残存: [...]` |

### CLI invocation

skill は bash 経由で preflight を呼ぶ：

```bash
# 単発
echo '{"text": "<full prompt>", "template_kind": "person", "word": "医者"}' \
    | python scripts/lib/prompt_preflight.py
# exit 0 = PASS / exit 1 = errors（errors は stdout JSON）

# バッチ（JSON Lines 入力）
cat prompts.jsonl | python scripts/lib/prompt_preflight.py --batch
```

Python import 版（build_prompts.py 等）：

```python
from lib.prompt_preflight import preflight
errors = preflight(text, "person", "医者")
if errors:
    # handle
```

---

## 6.6 Self-correction loop

preflight が違反を返した場合、skill は **同じ prompt を再起草**する（next gen）。
write は **PASS 後のみ**。

### Procedure

1. preflight 違反 message を取得
2. 違反原因に応じた修正方針を選ぶ：
   - `[C4]` → `[STYLE RECIPE]` ブロックで BG 文字列を正規定数に修正
   - `[C5]` → `NOT pure stark white` を追記
   - `[C1] full-body` → `[SUBJECT]` に "full-body" / "head-to-toe" を明記
   - `[C1] area` → "fills NN% of..." を削除（v4.0 では全域占有しない）
   - `[C1] lens` → "85mm portrait lens" を削除（v4.0 でレンズ指定退役）
   - `[C6]` → flag/nationality 文脈に **must** / **never** / **DO NOT** を追記
   - `[PH]` → 未置換 placeholder を [PART 5 Reference](part5_vocab_reference_appendix.md) で解決
3. 再起草 → preflight 再実行
4. 最大 3 retries。3 回失敗したら：
   - その word を `_meta.failed_entries[]` に記録
   - skip して次の word へ進む
   - 人間レビュー対象として `data/_meta/skill_prompt_failures.json` に append

### Budget

| 試行 | 動作 |
|---|---|
| 1st | 初回起草 → preflight |
| 2nd (retry 1) | 違反項目を修正して再起草 → preflight |
| 3rd (retry 2) | 違反項目を再修正 → preflight |
| 4th (retry 3) | 最終試行。違反なら fail-skip |

---

## 6.7 Logging / provenance

skill は出力 JSON の `_meta` ブロックに provenance を必ず記録する。

| field | type | 値 |
|---|---|---|
| `mode` | string | `skill` （build_prompts.py との区別） |
| `guideVersion` | string | `v5.0` （PART 1-6 構造の version） |
| `guideManifestHash` | string | sha256[:12]、6 PART file の hash を連結して再 hash |
| `generatedAt` | string | ISO 8601 UTC |
| `generator` | string | `.claude/skills/generate-image-prompt.md` |
| `model` | string | Claude モデル ID（例：`claude-opus-4-7`） |
| `totalEntries` | int | この JSON の vocabulary 配列 length |
| `coveredVocabTypes` | string[] | vocabulary 配列に出現する vocab_type の集合 |

### guideManifestHash 算出方法

```python
import hashlib
parts = [
    "prompts/guide/part1_universal_rules.md",
    "prompts/guide/part2_style_bible.md",
    "prompts/guide/part3_vocab_type_rules.md",
    "prompts/guide/part4_prompt_templates.md",
    "prompts/guide/part5_vocab_reference_appendix.md",
    "prompts/guide/part6_output_instructions.md",
]
concat = ""
for p in parts:
    raw = open(p, "rb").read()
    lf = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n").rstrip(b"\n")
    concat += hashlib.sha256(lf).hexdigest()[:12]
manifest_hash = hashlib.sha256(concat.encode()).hexdigest()[:12]
```

`scripts/invariants.mjs` の B 不変条件は同じロジックで再算出した値と一致することを要求する（[PART 1.invariants](../../scripts/invariants.mjs) 参照）。

### Per-entry provenance

各 entry は `preflight_passed: true`（必須）と `retries: 0..3`（任意）を持つ。
`preflight_passed: false` の entry は JSON に書き出してはいけない（fail-skip 経路で `_meta.failed_entries[]` に行く）。
