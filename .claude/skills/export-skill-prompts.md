---
name: export-skill-prompts
description: Export image prompts from data/image_prompts_skill.json into copy-paste-ready .txt files for manual image generation. Reads JSON (read-only), writes per-entry .txt files under tmp/skill_prompts/. Idempotent and safe to re-run.
allowed-tools: Read, Bash, Glob
---

# export-skill-prompts skill

Phase 5 ⑤ で導入された手動画像生成 workflow 用 skill。`/generate-image-prompt` が
JSON に蓄積した prompt を、画像生成 UI（nanobanana / Imagen / Gemini chat 等）に
そのまま copy-paste できる .txt ファイル群に展開する。

**JSON を変更しない**（read-only consumer）。何度走らせても害なし。

## 使い方

```
/export-skill-prompts [options]
```

| オプション | 用途 |
|---|---|
| （引数なし） | `data/image_prompts_skill.json` の全 entry を展開 |
| `--ids <csv>` | 特定 imageId のみ展開（例：`--ids ex_L02_001,word_医者`） |
| `--lesson <NN>` | 特定の課の例文のみ展開（`ex_L<NN>_*` を抽出） |
| `--out <dir>` | 出力先（既定：`tmp/skill_prompts/`） |
| `--force` | 既存 .txt があれば上書き |

### 例

```
# 全件展開
/export-skill-prompts

# 第 2 課の例文だけ
/export-skill-prompts --lesson 02

# 特定 ID だけ（vocab + example 混在 OK）
/export-skill-prompts --ids word_医者,ex_L02_001,ex_L02_015

# 上書き再生成（JSON が更新された後など）
/export-skill-prompts --lesson 02 --force
```

## 手順（skill 実行フロー）

このスキルは確定的な変換タスクなので、bash 1 行で完結する。LLM 解釈は不要。

### Step 1: bash で wrapper script を起動

```bash
node scripts/lib/export-skill-prompts.mjs [options]
```

引数を skill 入力からそのまま渡す。

### Step 2: 結果を user に報告

stdout に出る "exported: N file(s) → tmp/skill_prompts/" を user に伝える。
各 entry の `[aspect_ratio]` と word を 1 行ずつ報告。

## 出力ファイル形式

`tmp/skill_prompts/{imageId}.txt`：

```
# imageId: ex_L02_001
# word: これは時計です。 (This is a clock.)
# aspect_ratio: 16:9

[PURPOSE]
Create an example sentence illustration for ...
...
[CONSTRAINTS]
No text, no letters, ...
```

**user の使い方**：
1. `.txt` ファイルを開く
2. ヘッダー 3 行（`#` で始まる）を見て **aspect_ratio** を画像生成 UI のセレクタで設定
3. ヘッダー直後の空行以降（`[PURPOSE]` から末尾まで）を全選択してコピー
4. 画像生成 UI のチャットボックスに貼り付け → 生成

## 出力先と git ignore

- 既定の `tmp/skill_prompts/` は `.gitignore` 済（派生物・user 環境依存）
- 別ディレクトリへ出したい場合は `--out` 指定
- 生成された .txt は SSOT ではない（SSOT は `data/image_prompts_skill.json`）

## 制約

- `data/image_prompts_skill.json` を変更しない（read-only）
- 既存 .txt は **既定で skip**。`--force` で上書き
- フィルタで何も match しない場合は exit 1 で エラー報告（available imageIds を列挙）
- `data/image_prompts_skill.json` が無い場合は exit 1 で「先に /generate-image-prompt を実行」と報告

## 関連

- 起草 skill：[`.claude/skills/generate-image-prompt.md`](generate-image-prompt.md)
- 実装本体：[`scripts/lib/export-skill-prompts.mjs`](../../scripts/lib/export-skill-prompts.mjs)
- npm script：`npm run export-skill-prompts -- [options]`
- 出力 SSOT：[`data/image_prompts_skill.json`](../../data/image_prompts_skill.json)
