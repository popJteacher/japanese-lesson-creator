# japanese-lesson-creator

教師が `session_NNN.json` をアップロードすると、ブラウザ上で
**スライド HTML / 宿題 HTML / アクティビティ HTML / 教案 docx** の 4 ファイルが
ダウンロードできる Web ツール。

詳細な設計は [`design_brief.md`](./design_brief.md) を参照。

---

## 教師の使い方(最も簡単)

1. このリポジトリ全体をダウンロード(GitHub なら「Download ZIP」)
2. 解凍して **`index.html` をダブルクリック**
3. ブラウザが開いたら、`session_NNN.json` をドロップ領域にドラッグ
4. 4 ファイルが下に表示される(クリックでダウンロード)

> インターネット接続が必要(フォントと画像が CDN/Google Drive 経由のため)。

---

## 4 ファイルの内容

| ファイル | 形式 | 用途 |
|---|---|---|
| `{prefix}_スライド.html` | HTML | 授業中の画面共有用。矢印キーでナビ・ふりがなトグル |
| `{prefix}_宿題.html` | HTML | 学習者が自宅で自習。穴埋め欄・チェックボックスあり |
| `{prefix}_アクティビティ.html` | HTML | 授業中の操作型活動(ルーレット 等)。`hasRequiredActivity` が true のときのみ生成 |
| `{prefix}_教案.docx` | docx | 教師が事前確認・授業中参照。Word で編集可能 |

`{prefix}` は `session.output.titlePrefix` と `studentIdInFilename` から組み立てる(例: `studentA_S001`)。

---

## 開発者向け

### 動作環境

- 完全静的(サーバー不要)
- ブラウザだけで動く(JSZip 等は CDN から読み込み)
- GitHub Pages にそのまま公開できる

### ローカル開発

ダブルクリックで `index.html` を開けば動くが、開発時に DevTools の挙動などで HTTP 経由の方が便利な場合もある。

```bash
# Python で簡易サーバーを起動
python -m http.server 8000

# Node.js なら
npx serve .

# どちらかで http://localhost:8000 を開く
```

### データの更新手順 ⚠ 重要

`data/*.json` を編集したら、**必ず** 以下を実行して `data/*.js` を再生成すること。
`index.html` は `.js` のほうしか読み込まない(`file://` で fetch が使えないため)。

```bash
python scripts/build-embedded-data.py
```

対象:

| 編集する .json | 再生成される .js | 登録先 |
|---|---|---|
| `data/lesson_01.json` | `data/lesson_01.js` | `window.EmbeddedData.lessons[1]` |
| `data/lesson_02.json` | `data/lesson_02.js` | `window.EmbeddedData.lessons[2]` |
| `data/activity_catalog.json` | `data/activity_catalog.js` | `window.EmbeddedData.activityCatalog` |
| `data/master_image_registry.json` | `data/master_image_registry.js` | `window.EmbeddedData.imageRegistry` |
| `data/intro_activity_catalog.json` | `data/intro_activity_catalog.js` | `window.EmbeddedData.introActivityCatalog` |
| `data/master_audio_registry.json` | `data/master_audio_registry.js` | `window.EmbeddedData.audioRegistry` |

`session_NNN.json` はユーザーがアップロードする入力なので変換しない。

### ディレクトリ構成

```
.
├── index.html                         # エントリポイント
├── data/
│   ├── lesson_01.json / .js           # 課マスター(JSON は SSOT, JS は file:// 用)
│   ├── lesson_02.json / .js
│   ├── activity_catalog.json / .js    # v1.9（2026-05-17 更新）
│   ├── intro_activity_catalog.json / .js  # v1.2（2026-05-17 追加）
│   ├── master_image_registry.json / .js
│   ├── master_audio_registry.json / .js
│   └── session_001.json (例)          # ユーザーがアップロードするテンプレ
├── src/
│   ├── main.js                         # ドロップ→合成→4 ファイル生成のオーケストレーション
│   ├── common/                         # session 合成・画像解決・ふりがな辞書
│   ├── generators/                     # 4 ファイルそれぞれのジェネレーター
│   │   └── activity_html.js            # ※ Step 3 で 8 件の UI を追加実装中
│   └── styles/                         # design_tokens / fonts_imports
├── scripts/
│   └── build-embedded-data.py          # data/*.json → data/*.js 変換
├── design_brief.md                     # 設計書
├── CLAUDE.md                           # Claude Code 用作業ルール
└── README.md
```

### 進捗

- **Step 1**: `session_NNN.json` をアップロード → 4 ファイルダウンロード（**完了 2026-05-14**）
- **Step 2**: フォーム UI で session JSON を組み立てる（**完了 2026-05-14**）
- **Step 3**: アクティビティ UI 実装（**作業中**）
  - `act_online_roulette`: 完了
  - 残り 8 件（`act_memory_matching` / `act_vocab_bingo` / `act_whiteboard_categorize` / `act_grammar_auction` / `act_battleship` / `act_person_guessing_quiz` / `act_personality_quiz` / `act_hajimemashite_conversation`）: 未実装

詳細は `CLAUDE.md` の「Step 3」セクションおよび `design_brief.md` を参照。
