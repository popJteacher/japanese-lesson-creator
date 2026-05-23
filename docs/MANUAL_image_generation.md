# MANUAL: 手動画像生成の流れ

> このマニュアルの位置づけ：単語・例文の画像を「Imagen / Nanobanana の UI に貼って手で生成し、
> プロジェクトに取り込む」までの作業手順書。初心者でも独力で回せることを目的にする。
>
> **状態のスナップショットは書かない**（古くなるため）。この文書は「やり方」だけを書く。
> 今どこまで生成済みかは `npm run missing-assets` 等のコマンドで毎回確認する。
> データの所在・状態の見方は [MANUAL_word_example_state.md](MANUAL_word_example_state.md) を参照。

---

## 1. 全体像（5 段階フロー）

```
 ┌──────────────────────────────────────────────────────────────────┐
 │ ① 何を生成するか決める                                              │
 │    npm run missing-assets で「画像 URL が null の id」を一覧確認     │
 │    or  data/master_image_registry.json の status:"pending" を見る   │
 └──────────────────────────────────────────────────────────────────┘
                            ↓
 ┌──────────────────────────────────────────────────────────────────┐
 │ ② プロンプト生成                                                    │
 │    Claude Code で  /generate-image-prompt  系コマンドを実行           │
 │    → data/image_prompts_skill.json に prompt が追記される            │
 └──────────────────────────────────────────────────────────────────┘
                            ↓
 ┌──────────────────────────────────────────────────────────────────┐
 │ ③ .txt に展開                                                       │
 │    npm run export-skill-prompts                                    │
 │    → tmp/skill_prompts/{imageId}.txt が出る（手作業の作業用ファイル） │
 └──────────────────────────────────────────────────────────────────┘
                            ↓
 ┌──────────────────────────────────────────────────────────────────┐
 │ ④ 画像生成 UI で手動生成（user 作業）                                │
 │    .txt の本文を Imagen / Nanobanana / Gemini chat に貼り付け        │
 │    → 生成された PNG を DL → data/images/{imageId}.png に保存          │
 └──────────────────────────────────────────────────────────────────┘
                            ↓
 ┌──────────────────────────────────────────────────────────────────┐
 │ ⑤ registry に取り込み                                                │
 │    npm run generate-images -- --sync-only ...                       │
 │    → status: pending → generated に昇格                              │
 └──────────────────────────────────────────────────────────────────┘
```

**所要時間の目安**（30 件まとめてやる場合）：

| 段階 | 内容 | 時間目安 |
|---|---|---|
| ① | 対象決定 | 5 分 |
| ② | プロンプト生成（skill 実行） | 10〜20 分（30 件で） |
| ③ | .txt 展開 | 数秒 |
| ④ | UI 貼付・DL・保存 | 30〜60 分（1 枚 1〜2 分） |
| ⑤ | sync-only 取り込み | 数秒 |

---

## 2. 前提（事前に確認すること）

### 2-1. 必要なツール

| ツール | 用途 | チェックコマンド |
|---|---|---|
| Node.js | npm スクリプト実行 | `node --version` |
| Claude Code（CLI） | skill 起動 | `claude --version` |
| Imagen 4 / Nanobanana / Gemini の **どれかの Web UI** | 画像生成本体 | （ブラウザでログイン可能か） |

### 2-2. プロジェクトのセルフチェック（任意・最初の 1 回だけ）

```
npm run validate       # invariants 全 PASS なら OK
npm run missing-assets # 画像 / 音声で未生成の件数を表示
```

---

## 3. 逐次手順

### Step 1：何を生成するか決める

#### パターン A：lesson_NN を全部完成させたい

第 NN 課の単語・例文の中で、まだ画像が無いものを Claude Code 側でまとめて拾わせる。
**コマンドは Step 2 を参照**（Claude Code 内で `/generate-image-prompt mode=lesson --lesson NN`）。

ここでは「対象が何件あるか」だけ先に見たい場合は次を実行：

```
node -e "const r=require('./data/master_image_registry.json').entries; const p=Object.entries(r).filter(([k,v])=>k.startsWith('ex_L02_')&&v.status==='pending'); console.log('lesson_02 例文 pending:', p.length);"
```

`ex_L02_` の部分を見たい課に書き換える。`word_*` / `vocab_*` を見たい時は prefix を変える。

#### パターン B：特定の単語だけ生成したい

語を直接指定する。例：

```
/generate-image-prompt mode=explicit --words 時計,鉛筆,本
```

#### パターン C：日次運用（溜まった pending から N 件 pull）

```
/generate-image-prompt              # デフォルト 20 件
/generate-image-prompt limit=50     # 多めに pull
```

---

### Step 2：プロンプト生成（Claude Code 内で skill を起動）

Claude Code を起動して、上のコマンドのどれかを打つ：

```
# lesson 単位
/generate-image-prompt mode=lesson --lesson 02

# 単語ピンポイント
/generate-image-prompt mode=explicit --words 時計,鉛筆

# 日次 pull
/generate-image-prompt limit=30
```

**結果**：
- `data/image_prompts_skill.json` に対象 word/example の prompt が追記される
- preflight（プロンプト構造の自動検証）が走り、PASS したものだけ残る
- ログに `preflight 5/5 PASS / retries 0` のような行が出れば OK

**よくある詰まり**：
- `manifest hash mismatch` と出たら、プロンプトガイド（`prompts/guide/part1_*` 〜 `part6_*`）が編集されている。
  通常運用では起きない。出たらまず編集していないか確認。
- `target word が catalog に無い` → `npm run import-lesson -- --lesson NN` を先に走らせる必要がある。

---

### Step 3：.txt に展開

```
# 全件を .txt に展開
npm run export-skill-prompts

# 第 2 課のみ
npm run export-skill-prompts -- --lesson 02

# 特定 ID のみ
npm run export-skill-prompts -- --ids word_時計,ex_L02_001

# 既存 .txt を上書き
npm run export-skill-prompts -- --force
```

**結果**：[tmp/skill_prompts/](../tmp/skill_prompts/) 配下に `{imageId}.txt` が並ぶ。

**.txt の中身**（先頭 3 行が情報・本文がプロンプト）：

```
# imageId: ex_L02_001
# word: これは時計です。 (This is a clock.)
# aspect_ratio: 16:9

[PURPOSE]
（プロンプト本文…）
```

---

### Step 4：画像生成 UI で手動生成（user 作業）

これだけは Claude Code が代行できない部分。

#### 4-1. 推奨 UI

| UI | 適性 | アスペクト指定 |
|---|---|---|
| Imagen 4（AI Studio Image generation） | 単語向け（人物・物体・建物） | UI 側で 1:1 / 16:9 を選択 |
| Nanobanana（Gemini 2.5 flash image） | 例文（シーン）向け | プロンプト本文に inline directive で入る |
| Gemini chat | クイック確認 | 自動 |

> **どれを使うかは user の好み**。プロンプトはどの UI でも動くように書かれている。

#### 4-2. 手順

1. `tmp/skill_prompts/{imageId}.txt` を開く
2. 先頭 3 行のヘッダーを **見て、UI 側のアスペクトを設定**（例：`16:9`）
3. **本文（4 行目以降）だけを** UI のプロンプト欄に貼り付け
4. 生成
5. 気に入った PNG を DL
6. **ファイル名を `{imageId}.png` にリネーム**して `data/images/` に保存
   - 例：`ex_L02_001.png` という名前で `data/images/ex_L02_001.png` に置く
   - ヘッダー 1 行目の `# imageId: ` の値をそのまま使えば良い

#### 4-3. 命名規則（厳守）

| 種類 | ファイル名 | 例 |
|---|---|---|
| 単語（旧命名） | `word_{単語}.png` | `data/images/word_時計.png` |
| 単語（新命名） | `vocab_{単語}.png` | `data/images/vocab_時計.png` |
| 例文 | `ex_L{NN}_{NNN}.png` | `data/images/ex_L02_001.png` |
| キャラクター | `char_{名前}.png` | `data/images/char_鈴木.png` |

**`word_` と `vocab_` のどちらにすべきか**：基本は `.txt` のヘッダー `# imageId:` に書いてある通りに従う。
自分で勝手にどちらかに統一しない（registry がそのキーで pending を待っているため）。

---

### Step 5：registry に取り込み

`data/images/` に置いた PNG を registry に反映する。これで `status: pending` → `generated` になる。

```
# 直近に生成した prompt JSON を指定（lesson 単位など）
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only
```

**結果**：
- ログに `updated: N` と出る（N = registry に反映された件数）
- `missing_file: M` と出たら、PNG が `data/images/` に無いか、ファイル名が違う
- `bad_png: K` と出たら、ファイルが PNG として壊れている（DL し直す）

**取り込み後の確認**：

```
npm run missing-assets   # 件数が減っていれば OK
```

---

## 4. トラブルシューティング

### Q1. `/generate-image-prompt` を打ったら `manifest hash mismatch` と出た

プロンプトガイドが編集されている。基本的に手動で編集はしない設計。
[prompts/guide/](../prompts/guide/) 配下を `git diff` で確認し、意図しない編集なら戻す。

### Q2. `--sync-only` で `missing_file` が出る

- `data/images/` に PNG が存在しない
- ファイル名が違う（`ex_L02_1.png` ではなく `ex_L02_001.png` のように **3 桁 0 詰め必須**）
- `.PNG`（大文字）ではなく `.png`（小文字）

### Q3. 同じ imageId で複数回生成して比較したい

- 1 枚目を DL → `ex_L02_001_v1.png` のような **別名で一旦保存**
- 2 枚目を DL → `ex_L02_001_v2.png`
- 採用するものを `ex_L02_001.png` にリネーム
- `--sync-only` を実行

`v1` / `v2` 等の suffix 付きファイルは sync 対象外。捨てるか `data/images/_drafts/` のような自作サブフォルダに移動する（registry は無視する）。

### Q4. 既存の `data/images/{id}.png` を新しい絵で差し替えたい

```
# 上書き保存 → sync-only で再吸収
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only
```

registry の `status` は `generated` のまま（既存値が保持される）。
**画像の差し替えだけしたい場合**は単純に PNG を上書き保存すれば OK で、registry の値は変わらない（同じ id だから）。

### Q5. `chain=true` で一気通貫したい

```
/generate-image-prompt mode=explicit --words 時計 chain=true
```

これでプロンプト生成 → そのまま API 呼出 → `data/images/` 保存 → registry 更新まで一気に走る。
手動 UI を経由しないため UI の試行錯誤ができない代わりに、コストは API 課金（Nanobanana ~$0.04/枚、Imagen $0.04/枚）。

---

## 5. 関連ファイル（コマンド辞書）

```
# プロンプト生成（Claude Code 内）
/generate-image-prompt                              # daily-pull 20 件
/generate-image-prompt limit=50                     # 多めに
/generate-image-prompt mode=lesson --lesson 02      # 課単位
/generate-image-prompt mode=explicit --words 医者
/generate-image-prompt chain=true                   # 一気通貫

# .txt 展開（PowerShell / bash）
npm run export-skill-prompts                        # 全件
npm run export-skill-prompts -- --lesson 02         # 課単位
npm run export-skill-prompts -- --ids ex_L02_001    # ID 指定
npm run export-skill-prompts -- --force             # 上書き

# registry 取り込み
npm run generate-images -- --prompts data/image_prompts_skill.json --sync-only

# 状態確認
npm run missing-assets                              # 未生成件数
npm run validate                                    # 整合性
```

関連ドキュメント：

- [MANUAL_word_example_state.md](MANUAL_word_example_state.md) — どこに何があるか・status の見方
- [REFERENCE.md](REFERENCE.md) — 命名規則・スキーマ詳細
- [WORKFLOW.md](WORKFLOW.md) — main / worktree の使い分け
- `.claude/skills/generate-image-prompt.md` — skill の詳細仕様
- `.claude/skills/export-skill-prompts.md` — export skill の詳細仕様
