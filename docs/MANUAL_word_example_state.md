# MANUAL: 単語・例文の管理状態をどこで見るか

> このマニュアルの位置づけ：GAS 時代に Spreadsheet を見て確認していた「単語 / 例文の進捗」を、
> 今はどこを見れば把握できるのかを説明する。データフローと、status の意味と、よく使うクエリ集。
>
> **状態のスナップショットは書かない**（古くなるため）。この文書は「見方」だけを書く。
> 実際の生成手順は [MANUAL_image_generation.md](MANUAL_image_generation.md) を参照。

---

## 1. GAS 時代と現在の対比

### 1-1. 全体構造の変化

```
【GAS 時代】
                ┌─────────────────────────────┐
                │ Google Spreadsheet (master) │  ← user が直接見て確認
                │  - Vocabulary シート         │
                │  - Examples シート           │
                │  - imageStatus / imageUrl   │
                └────────────┬────────────────┘
                             │  GAS trigger
                ┌────────────┴────────────────┐
                │ Google Drive (images/audio) │
                └─────────────────────────────┘

【現在】
                ┌─────────────────────────────┐
                │  data/lesson_NN.json        │  ← 課マスター（人間が書く）
                │  data/vocab_catalog.json    │  ← 横断 catalog
                │  data/master_image_registry │  ← 画像の進捗台帳
                │  data/master_audio_registry │  ← 音声の進捗台帳
                └────────────┬────────────────┘
                             │  npm scripts
                ┌────────────┴────────────────┐
                │ data/images/  data/audio/   │
                └─────────────────────────────┘
```

### 1-2. 「あの情報はどこで見ていたか」対比表

| 知りたいこと | GAS 時代 | 現在 |
|---|---|---|
| この単語の画像、まだか？ | Vocabulary シートの `imageStatus` 列 | `data/master_image_registry.json` の `entries["word_X"].status` |
| この例文の画像、まだか？ | Examples シートの `imageStatus` 列 | `data/master_image_registry.json` の `entries["ex_L02_001"].status` |
| 未生成だけ一覧したい | Spreadsheet のフィルタ機能 | `npm run missing-assets` |
| 課全体の進捗 | シートを上から眺める | `node -e ...` でフィルタクエリ（後述 §5） |
| プロンプトを生成したか | Spreadsheet の `imagePrompt` 列 | `data/image_prompts_skill.json` に entry があるか |
| 生成済み画像のサムネ | Drive の `images/` フォルダ | エクスプローラーで `data/images/` を開く |

---

## 2. データフロー（lesson_NN.json から画像 PNG まで）

```
                                      ┌──────────────────────┐
                                      │ data/lesson_NN.json  │ (1) user が課マスターを編集
                                      │  - patterns[]        │
                                      │  - vocabulary{}      │
                                      │  - examples[]        │
                                      └──────────┬───────────┘
                                                 │
                                  npm run import-lesson
                                                 │
                ┌────────────────────────────────┼────────────────────────────────┐
                ↓                                ↓                                ↓
   ┌────────────────────┐         ┌───────────────────────────┐         ┌─────────────────────┐
   │ vocab_catalog.json │         │ master_image_registry.json│         │master_audio_registry│
   │  全課横断の語彙台帳 │         │  画像の進捗台帳           │         │  音声の進捗台帳       │
   │  word ⇄ imageId 紐付│         │  status: pending → ...   │         │  audioUrl: null/…    │
   └────────────────────┘         └────────────┬──────────────┘         └─────────────────────┘
                                                │
                              /generate-image-prompt
                                                │
                                                ↓
                                  ┌──────────────────────────────┐
                                  │ data/image_prompts_skill.json│ (2) skill が prompt を蓄積
                                  │  - vocabulary[].prompt       │
                                  └──────────────┬───────────────┘
                                                 │
                              npm run export-skill-prompts
                                                 │
                                                 ↓
                                  ┌──────────────────────────────┐
                                  │ tmp/skill_prompts/*.txt      │ (3) user 手作業用ファイル
                                  └──────────────┬───────────────┘
                                                 │
                                user が UI に貼って画像生成・DL・保存
                                                 │
                                                 ↓
                                  ┌──────────────────────────────┐
                                  │ data/images/{imageId}.png    │ (4) 実画像
                                  └──────────────┬───────────────┘
                                                 │
                       npm run generate-images -- --sync-only
                                                 │
                                                 ↓
                       registry.entries[id].status = "generated"
                                          .images[0].imageUrl = "data/images/...png"
```

---

## 3. registry の中身を読む（最重要）

正典：[data/master_image_registry.json](../data/master_image_registry.json)

### 3-1. トップレベル構造

```jsonc
{
  "_meta": { ... },
  "entries": {
    "word_時計":   { "type": "auto_generated_vocab", "status": "pending", ... },
    "ex_L02_001":  { "type": "example_image",       "status": "pending", ... },
    "char_鈴木":   { "type": "named_character_portrait", "status": "generated", ... },
    ...
  }
}
```

### 3-2. 1 エントリの典型

```jsonc
"word_時計": {
  "type": "auto_generated_vocab",
  "word": "時計",
  "reading": "とけい",
  "en": "clock",
  "context": "vocabulary_object",
  "firstLesson": 2,
  "usedInLessons": [2],
  "status": "pending",          // ← ここが進捗
  "images": [
    {
      "imageId": "word_時計_001",
      "filename": "word_時計.png",
      "imageUrl": null,         // ← 生成後にここが埋まる
      "promptRef": "image_prompts_lesson2.json#word_時計",
      "generatedAt": null,
      "regenerate": false
    }
  ]
}
```

### 3-3. status の意味（image registry）

| status | 意味 | 次にやること |
|---|---|---|
| `pending` | 未生成。これからプロンプト生成 → 画像生成する対象 | プロンプト生成 → 手動画像生成 |
| `generated` | 画像 PNG 生成済み・人間レビュー待ち | 目視確認 → approved に上げる（または rejected） |
| `approved` | レビュー済み・採用確定 | そのまま使う（再生成しない） |
| `rejected` | 品質 NG・再生成必要 | 再度プロンプト生成 / 画像生成 |
| `outdated` | 古い設計のエントリ | `_outdated_replacedBy` の参照先を見る |

### 3-4. id の prefix で「何のための画像か」がわかる

| prefix | 種類 | 例 |
|---|---|---|
| `word_*` | 単語画像（旧命名・現在も主流） | `word_医者` |
| `vocab_*` | 単語画像（新命名） | `vocab_時計` |
| `ex_L{NN}_{NNN}` | 例文画像 | `ex_L02_001` |
| `char_*` | 固有キャラクター | `char_鈴木` |
| `famous_*` / `world_*` | 特殊（地図・著名人など） | `world_map` |

**注意**：REFERENCE.md には `scene_L{NN}_*` という命名規則が予約定義されているが、
2026-05-23 時点で registry に実体ゼロ。**現状の例文画像はすべて `ex_L*` に集約されている**。

---

## 4. lesson_NN.json と registry の関係

### 4-1. lesson_NN.json 側で参照される id

[data/lesson_02.json](../data/lesson_02.json) の中：

```jsonc
"patterns": [
  {
    "examples": [
      {
        "no": "1-1",
        "sentence": "これは時計です。",
        "imageId": "ex_L02_001",        // ← registry の key と一致
        "audioId": "sentence_ex_L02_001",
        "imageRole": "scene",            // ← 画像の役割タグ
        "isAnchor": true
      }
    ]
  }
],
"vocabulary": {
  "byPattern": {
    "p1": {
      "words": [
        {
          "word": "時計",
          "imageId": "word_時計",        // ← registry の key と一致
          "imageRole": "vocab_object"
        }
      ]
    }
  }
}
```

### 4-2. `imageRole` フィールドの意味

`imageRole` は **画像の中身分類**で、登場する場所で値が変わる：

| `imageRole` 値 | 出る場所 | 意味 |
|---|---|---|
| `vocab_person` | 単語 / 例文両方 | 人物画 |
| `vocab_object` | 単語 / 例文両方 | 物体画 |
| `vocab_building` | 単語 / 例文両方 | 建物画 |
| `scene` | 例文のみ | 場面画（人物 + 物 + 背景の構成） |

**ファイル名や registry の prefix とは独立**。例えば `ex_L02_001` の `imageRole` が `scene` でも `vocab_person` でも、ファイル名は変わらず `ex_L02_001.png`。

---

## 5. よく使うクエリ集（コピペで動く）

### 5-1. 全体サマリ

```
npm run missing-assets
```

→ 画像 / 音声で「URL が null」なエントリの件数を表示。CI でも使える。

### 5-2. status 別件数

```bash
node -e "const r=require('./data/master_image_registry.json').entries; const c={}; for(const v of Object.values(r)){c[v.status||'(none)']=(c[v.status||'(none)']||0)+1;} console.log(c);"
```

### 5-3. 特定の課の例文の進捗

```bash
# lesson_02 の例文
node -e "const r=require('./data/master_image_registry.json').entries; const e=Object.entries(r).filter(([k])=>k.startsWith('ex_L02_')); const c={}; e.forEach(([k,v])=>{c[v.status]=(c[v.status]||0)+1;}); console.log('ex_L02:',c);"
```

### 5-4. 生成済み（generated + approved）の一覧

```bash
node -e "const r=require('./data/master_image_registry.json').entries; const g=Object.entries(r).filter(([k,v])=>v.status==='generated'||v.status==='approved'); console.log('total:',g.length); g.forEach(([k,v])=>console.log(' ',k,'['+v.status+']'));"
```

### 5-5. 未生成（pending）の一覧

```bash
node -e "const r=require('./data/master_image_registry.json').entries; const p=Object.entries(r).filter(([k,v])=>v.status==='pending'); console.log('pending total:',p.length); p.slice(0,30).forEach(([k,v])=>console.log(' ',k));"
```

### 5-6. 特定の単語の状態を見る

```bash
node -e "const r=require('./data/master_image_registry.json').entries; console.log(JSON.stringify(r['word_時計'],null,2));"
```

### 5-7. プロンプトを生成済みかどうか

```bash
# image_prompts_skill.json に entry があるか
node -e "const j=require('./data/image_prompts_skill.json'); const ids=j.vocabulary.map(v=>v.imageId); console.log('skill prompts total:',ids.length); console.log(ids.slice(0,20));"
```

### 5-8. 第 N 課の単語のうち未生成のもの

```bash
# lesson_02 で必要な単語 imageId のうち pending を抽出
node -e "
const l=require('./data/lesson_02.json');
const r=require('./data/master_image_registry.json').entries;
const ids=[];
for(const p of (l.vocabulary?.byPattern||{} ? Object.values(l.vocabulary.byPattern) : [])){
  for(const w of (p.words||[])) if(w.imageId) ids.push(w.imageId);
}
const pending=ids.filter(id=>r[id]?.status==='pending');
console.log('lesson_02 vocab pending:', pending.length);
pending.forEach(id=>console.log(' ',id));
"
```

---

## 6. ファイル所在マップ

| 役割 | パス | 編集者 |
|---|---|---|
| 課マスター（人間の編集対象） | `data/lesson_NN.json` | user（チャットでレビュー → 確定後 commit） |
| 横断 catalog | `data/vocab_catalog.json` | スクリプト（`import-lesson` / `build-catalog`） |
| 画像進捗台帳 | `data/master_image_registry.json` | スクリプト（`import-lesson` / `generate-images-local`） |
| 音声進捗台帳 | `data/master_audio_registry.json` | スクリプト（`import-lesson` / `generate-audio-local`） |
| 生成済み画像 | `data/images/*.png` | user 手作業 or API |
| 生成済み音声 | `data/audio/*.wav` | スクリプト（Cloud TTS） |
| プロンプト蓄積 | `data/image_prompts_skill.json` | skill（`/generate-image-prompt`） |
| 手作業用 .txt | `tmp/skill_prompts/*.txt` | スクリプト（`export-skill-prompts`） |
| プロンプトガイド SSOT | `prompts/guide/part1_*` 〜 `part6_*` | （改訂はパッチスクリプト経由） |

---

## 7. 関連ドキュメント

- [MANUAL_image_generation.md](MANUAL_image_generation.md) — 手動画像生成の段取り
- [REFERENCE.md](REFERENCE.md) — 命名規則・スキーマ詳細（不変仕様）
- [WORKFLOW.md](WORKFLOW.md) — main / worktree の使い分け
- [MIGRATION_PLAN.md](MIGRATION_PLAN.md) — Phase 0〜5 全体ロードマップ
- [../NEXT_ACTIONS.md](../NEXT_ACTIONS.md) — 今やること（毎セッション書き直し）
