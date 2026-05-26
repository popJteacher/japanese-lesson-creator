---
name: lesson-build-registry
description: For every imageId / audioId referenced by lesson_NN.json (vocab words, examples, materialNeeds keywords), propose pending entries in master_image_registry / master_audio_registry. Dry-run by default; --apply writes. Phase 3 of the 課マスター作成 skill suite.
allowed-tools: Read, Bash, Glob, Grep
---

# lesson-build-registry skill

課マスター作成 skill suite の **Phase 3 registry 整合**。`data/lesson_NN.json` が
参照する全 `imageId` / `audioId` について、`data/master_image_registry.json` /
`data/master_audio_registry.json` に対応する pending entry が無ければ提案する。
dry-run 既定 / `--apply` で書き戻し。

これを走らせると、新課を追加した直後でも GAS 生成パイプライン
(`vocab_*` / `ex_L*_*` / `sentence_ex_*`) が registry を読んでそのまま動く状態にできる。

参考：
- registry 構造: [data/master_image_registry.json](../../data/master_image_registry.json) の
  `_meta.primaryKeyRules` / `_meta.statusValues`
- 14 ルール B-7: 教具 (materialNeeds[]) — auto_generated_vocab に keywords[] を入れる

## 使い方

```
/lesson-build-registry NN [--apply] [--json]
```

| 引数 | 既定 | 説明 |
|---|---|---|
| `NN` (positional) | 必須 | 課番号 1-99。2 桁 zero-pad で扱う |
| `--apply` | false | registry を直接上書き (既定: dry-run) |
| `--json` | false | JSON 出力 |

### 例

```
# dry-run (差分のみ表示・書き込まない)
/lesson-build-registry 03

# 適用
/lesson-build-registry 03 --apply
```

## 手順 (skill 実行フロー)

### Step 1: 引数解釈と既存ファイル check

`NN` を 2 桁 zero-pad。次のいずれかが無ければ即 abort：

- `data/lesson_NN.json`
- `data/master_image_registry.json`
- `data/master_audio_registry.json`

### Step 2: dry-run で差分提示

```bash
node scripts/lib/lesson-build-registry.mjs --no NN
```

出力例 (lesson_02 で 1 件提案された例):

```
target: data/lesson_02.json (L2)
mode:   dry-run (no changes written)

▼ image registry (data/master_image_registry.json)
  new pending entries:    1
    + word_アインシュタイン  (keyword)
  usedInLessons updates:  0
  existing OK:            46
  lesson refs w/o id:     0

▼ audio registry (data/master_audio_registry.json)
  new pending entries:    0
  existing OK:            46
  lesson refs w/o id:     0
```

### Step 3: user に確認 → --apply

差分が妥当なら user の許可を取って書き戻す：

```bash
node scripts/lib/lesson-build-registry.mjs --no NN --apply
```

書き戻し後は **必ず** `npm run validate` を走らせる (registry hash が
invariants に組み込まれていれば自動 detect される)。

### Step 4: 次に推奨

```
npm run validate                              # schema / invariants
/lesson-check NN                              # 14 ルール lint
# (画像生成)
npm run generate-images -- --prompts data/image_prompts_lesson<NN>.json --sync-only
# (音声生成)
npm run generate-audio
```

## 走査対象と判定

| ソース | imageId | audioId |
|---|---|---|
| `vocabulary.byPattern[*].words[].imageId / audioId` | ✓ | ✓ |
| `patterns[].examples[].imageId / audioId` | ✓ | ✓ |
| `flow[].materialNeeds[].type === 'auto_generated_vocab'` の `keywords[]` | △ | × |

△：vocabulary 配下に既に entry がある word は **二重提案しない**。
keyword に「(generic elderly man with white hair)」のような **括弧内説明**
が付いている場合は括弧以降を strip して基底語のみ採用する。

### 既存判定

| registry の状態 | 動作 |
|---|---|
| 同 id 存在 + `usedInLessons` に NN 含む | `existing OK` (no-op) |
| 同 id 存在 + `usedInLessons` に NN 不在 | `usedInLessons updates` (--apply で NN 追加) |
| 同 id 不在 | `new pending entries` (--apply で pending entry を追加) |
| lesson 側に imageId / audioId が無い | `lesson refs w/o id` (警告。lesson 側に id 付与が必要) |

## 提案 entry の shape

### image registry — vocab (`auto_generated_vocab`)

```json
{
  "type": "auto_generated_vocab",
  "word": "アインシュタイン",
  "reading": null,
  "en": null,
  "context": "vocabulary_person",     // imageRole から推定
  "firstLesson": 2,
  "usedInLessons": [2],
  "status": "pending",
  "images": [{
    "imageId": "word_アインシュタイン_001",
    "filename": "word_アインシュタイン.png",
    "imageUrl": null,
    "promptRef": "image_prompts_lesson02.json#word_アインシュタイン",
    "generatedAt": null,
    "regenerate": false
  }]
}
```

### image registry — example (`example_images`)

```json
{
  "type": "example_images",
  "lesson": 2,
  "patternId": "p1",
  "sentence": "これは時計です。",
  "sentenceEn": "This is a clock.",
  "slot": "文型p1 例文 1-1",
  "status": "pending",
  "images": [{
    "imageId": "ex_L02_001_img",
    "filename": "ex_L02_001.png",
    "imageUrl": null,
    "promptRef": "image_prompts_lesson2.json#ex_L02_001",
    "generatedAt": null,
    "regenerate": false
  }]
}
```

### audio registry — vocab or sentence

```json
{
  "audioUrl": null,
  "word": "アインシュタイン",         // sentence の場合は "sentence" key
  "reading": null,
  "_addedBy": "lesson-build-registry",
  "_addedAt": "2026-05-26",
  "_firstLesson": 2
}
```

audio registry は `status` field を主に使わないので、pending 状態は
`audioUrl: null` + `_addedBy` メタで表現する (既存 outdated entry とも衝突しない)。

## 命名 prefix の決定 (`word_` vs `vocab_`)

| 当課 lesson_NN.json の vocabulary[].imageId が… | keyword 提案時の prefix |
|---|---|
| `word_*` を 1 つでも使っている | `word_` |
| すべて `vocab_*` または imageId 不在 | `vocab_` (デフォルト) |

これは lesson_01 が legacy convention で `word_*` を使い続け、lesson_02+ が
`vocab_*` に統一しているため、当課の慣習に合わせる。手で書き換えて統一しても OK。

## 制約

- **registry の id は lesson 側が決める** — このスキルは「lesson が言う id」を
  registry に登録するだけで、新規 id を生成しない。例外: `materialNeeds.keywords[]`
  だけは vocabulary に登録されていない時に `{prefix}{keyword}` を guess する
- **promptRef のパスは guess** — `image_prompts_lesson{NN}.json#{imageId}` の形に
  decimal NN（先頭 0 付き）で出すが、lesson_01 は `image_prompts_lesson01_v4_0.json` 等
  の version 違いを使っている。生成後に手で書き直して良い (registry の promptRef は
  reference であって SSOT ではない)
- **書き戻しは決定論的** — entry の追加順序は image/audio 両方とも「lesson 走査順」
  に末尾追加。既存 entry の field 順序は保たれる
- **audio entry の `naturalness` 等は付けない** — 後段 (TTS 生成 + QC) が埋める
- **画像 entry の filename を `.png` 固定** — TTS のような audio とは別管理
- **`_meta.lastUpdated` / `lastModified` / `totalEntries` を自動 bump** —
  apply 時のみ
- **同一 lesson 内で imageId 衝突がある場合** は registry 側で last-write-wins
  (lesson_NN.json 側の重複を先に直すべき。`/lesson-check NN` で見つかる)

## 失敗時の動作

| 状況 | 動作 |
|---|---|
| `NN` 範囲外 (1-99 以外) | exit 2 |
| `data/lesson_NN.json` 不在 | exit 2 |
| `data/master_image_registry.json` 不在 | exit 2 |
| `data/master_audio_registry.json` 不在 | exit 2 |
| `--apply` で書き戻し失敗 (権限等) | exit 1 |
| JSON parse error | exit 2 |
| 差分 0 件 (全 existing OK) | exit 0、`new pending entries: 0` |

## 関連

- registry 構造: [data/master_image_registry.json](../../data/master_image_registry.json) `_meta.primaryKeyRules`
- 兄弟 skill: [/lesson-scaffold](lesson-scaffold.md) (Phase 1) /
  [/lesson-check](lesson-check.md) + [/lesson-fill-vocab](lesson-fill-vocab.md) (Phase 2) /
  [/lesson-suggest-activities](lesson-suggest-activities.md) (同 Phase 3)
- 全体まとめ docs: [docs/LESSON_SKILLS_MANUAL.md](../../docs/LESSON_SKILLS_MANUAL.md)
