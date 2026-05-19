# 教材生成 Web ツール 設計書（Claude Code 用）

## ゴール
教師が session_NNN.json をアップロードすると、ブラウザ上で
スライド HTML・宿題 HTML・アクティビティ HTML・教案 docx の 4 ファイルが
ダウンロードできる Web ツール。

---

## 自動化スコープの境界（重要）

**ツールが自動化するのは「session_NNN.json → 4 ファイル」の部分だけ。**

- 課マスター（lesson_NN.json）の作成 → 人間（ツール対象外）
- session_NNN.json の作成 → Step 1 では人間が JSON 直書き／Step 2 でフォーム UI を追加
- アクティビティの選定 → **教師が裁量で session の activityId を指定する**
  - 「この文型にこのアクティビティが合うか」の自動判定はしない
  - activity_catalog.json の `applicability` フィールドは現状 act_online_roulette のみ実装済み
  - 全 18 アクティビティへの applicability 展開は将来の独立タスク（Stage 2）
- 4 ファイルの生成 → ツールが自動化

---

## 動作環境

- 完全静的（ブラウザだけで動く・サーバー不要）
- **別リポジトリ**として作成（既存リポジトリ `japanese-lesson-html` とは独立）
- GitHub Pages でそのまま公開できる構成にする
- 教師は URL を開いてファイルをドラッグするだけ
- 将来マネタイズ時は同じフロントエンドにバックエンドを追加（書き直し不要）

### リポジトリ構成

| リポジトリ | 役割 |
|---|---|
| `japanese-lesson-html`（既存） | データ・ロジックの倉庫。lesson_NN.json / activity_catalog 等を管理 |
| `japanese-lesson-tool`（新規・仮名） | Web ツール本体。GitHub Pages で公開 |

既存リポジトリの資産は新リポジトリの `data/` と `src/common/` にコピーして持ち込む。
将来的に git submodule 化も可能だが、当面はコピーで十分。

---

## 入力

- 教師がアップロード: `session_NNN.json` 1 ファイルのみ
- ツール内蔵: `lesson_01.json` 〜 `lesson_NN.json`（ABC 準拠の課マスター）
- ツール内蔵: `activity_catalog.json`（全課共通の活動カタログ）
- ツール内蔵: `master_image_registry.json`（画像 URL レジストリ）
- ツール内蔵: `design_tokens.json`, `fonts_imports.css`（デザイン設定）

---

## 出力（4 ファイル）

| # | ファイル名 | 形式 | 用途 |
|---|---|---|---|
| 1 | `{prefix}_スライド.html` | HTML | 授業中に画面共有 |
| 2 | `{prefix}_宿題.html` | HTML | 学習者が自宅で自習 |
| 3 | `{prefix}_アクティビティ.html` | HTML | 授業中の操作型活動（hasRequiredActivity が true のとき） |
| 4 | `{prefix}_教案.docx` | docx | 教師が事前確認用（編集可能） |

`{prefix}` は `session.output.titlePrefix` と `studentIdInFilename` から組み立てる
（例: `studentA_S001`）。

---

## 既存資産の扱い

### 流用する（コピーして使う）

| 現リポジトリのパス | 用途 |
|---|---|
| `shared/common/flow_synthesizer.js` | session 合成ロジック |
| `shared/common/image_resolver.js` | imageId → URL 解決 |
| `shared/common/ruby_dictionary.js` | ふりがな辞書 |
| `shared/common/design_tokens.css` | 色・フォント値（CSS 化済み） |
| `design_tokens.json` | デザイン設定値（参照用） |
| `fonts_imports.css` | フォント読み込み |
| `lesson_configs/lesson_01.json` | 第1課 課マスター |
| `lesson_configs/lesson_02.json` | 第2課 課マスター |
| `session_configs/session_001.json` | セッション例（テンプレ） |
| `activity_catalog.json` | 活動カタログ |
| `master_image_registry.json` | 画像 URL レジストリ |

### 破棄する（参照しない・削除してよい）

| 現リポジトリのパス | 理由 |
|---|---|
| `shared/slide/` | Stage 1 実装・9 問題を抱えたまま。一から書き直す |
| `shared/homework/` | 同上 |
| `shared/activity/` | 同上 |
| `shared/lesson_plan/` | 同上 |
| `students/` 以下の生成済みファイル | C+B ハイブリッド方式の成果物。新方式では不要 |
| `students/*/sessions/*/data.js` | 新方式では data.js を事前生成しない |

---

## Stage 1 で発覚した既知問題（再発させない）

新実装で以下を最初から正しく作る:

| # | 問題 | 設計時の対策 |
|---|---|---|
| 1 | 画像が表示されない | image_resolver の呼び出しタイミングを明示。Google Drive URL 形式を最初に動作確認 |
| 2 | ふりがなサイズが本文より大きい | `--font-size-ruby` を相対値（em）に |
| 3 | ふりがな OFF でもスペース確保 | `display:none` で完全に消す。`opacity:0` を使わない |
| 4 | ふりがなの色が漢字と異なる | `color: inherit` で本文と一致させる |
| 5 | トグルボタンに不要なふりがな | UI 要素には ruby を一切書かない |
| 6 | スライドラベルが英語 | label を日本語にする |
| 7 | 学習目標スライドが空欄 | lesson_NN.json の `patterns[].canDo` から集約 |
| 8 | カウンタが期待値と合わない | subSlides 展開を最初から実装 |
| 9 | アクティビティのデザイン不一致 | スライド・宿題・アクティビティで共通の design_tokens を参照 |

---

## 処理フロー

```
[ユーザー] session_NNN.json をドラッグ
    ↓
[ツール] JSON をパース
    ↓
[ツール] session.teach[].lessonNo から必要な lesson_NN.json を内蔵から読み込み
    ↓
[ツール] flow_synthesizer.synthesize(lesson, session, activityCatalog)
    ↓ 戻り値: { resolvedFlow, flowMeta, warnings, hasRequiredActivity }
    ↓
[ツール] 4 つの生成関数を呼ぶ:
    ├─ generateSlideHtml(resolvedFlow, lesson, session)
    ├─ generateHomeworkHtml(lesson, session)
    ├─ generateActivityHtml(activityCatalog, session)  ※ hasRequiredActivity 時のみ
    └─ generateLessonPlanDocx(resolvedFlow, flowMeta, lesson, session)
    ↓
[ツール] 4 ファイルを Blob で生成 → ダウンロードリンクを表示
```

---

## ディレクトリ構成（推奨）

```
project-root/                         # 新規フォルダ（既存リポジトリとは別）
├── index.html                        # エントリポイント
├── src/
│   ├── main.js                       # ファイルドロップ・全体オーケストレーション
│   ├── common/                       # 既存リポジトリの shared/common/ からコピー
│   │   ├── flow_synthesizer.js       # ← shared/common/flow_synthesizer.js
│   │   ├── image_resolver.js         # ← shared/common/image_resolver.js
│   │   └── ruby_dictionary.js        # ← shared/common/ruby_dictionary.js
│   ├── generators/                   # 新規作成（Stage 1 の shared/{slide,homework,...} は使わない）
│   │   ├── slide_html.js             # スライド HTML 生成（新規）
│   │   ├── homework_html.js          # 宿題 HTML 生成（新規）
│   │   ├── activity_html.js          # アクティビティ HTML 生成（新規）
│   │   └── lesson_plan_docx.js       # 教案 docx 生成（新規）
│   └── styles/
│       ├── design_tokens.css         # ← shared/common/design_tokens.css
│       ├── fonts_imports.css         # ← shared/common/fonts_imports.css
│       ├── slide.css                 # 新規
│       ├── homework.css              # 新規
│       └── activity.css             # 新規
├── data/                             # 既存リポジトリからコピー
│   ├── lesson_01.json                # ← lesson_configs/lesson_01.json
│   ├── lesson_02.json                # ← lesson_configs/lesson_02.json
│   ├── activity_catalog.json         # ← activity_catalog.json（ルート）
│   └── master_image_registry.json   # ← master_image_registry.json（ルート）
└── lib/
    └── docx.min.js                   # docx 生成ライブラリ（CDN でも可）
```

---

## 開発ステップ

### Step 1: 生成エンジン（最初に作る）

1. `index.html` に「session_NNN.json をドラッグ」する領域だけ作る
2. ドロップされた JSON をパース → コンソールに resolvedFlow を出力（synthesize の動作確認）
3. **教案 docx** を最初に作る（最もシンプル・テキスト中心）
4. **スライド HTML** を作る（画像表示・ふりがな・design_tokens 適用）
5. **宿題 HTML** を作る
6. **アクティビティ HTML** を作る（hasRequiredActivity 時のみ）
7. session_001.json で動作確認 → session_002.json（教師が手書き）でも動くか確認

### Step 2: フォーム UI（エンジンが動いてから足す）

1. 「session_NNN.json をアップロード」または「フォームから作る」の切り替えを追加
2. フォーム UI を実装:
   - 学習者・日付・授業時間の入力
   - 文型のチェックボックス（内蔵 lesson から自動生成）
   - 活動の選択（activity_catalog から自動生成）
3. フォーム入力 → session_NNN.json オブジェクトを組み立てる関数
4. 組み立てた session を Step 1 のエンジンに渡す
5. （オプション）作った session を JSON ダウンロードできるようにする

---

## やらないこと（スコープ外）

- 課マスター（lesson_NN.json）を編集する UI
- 教師が新しい lesson_NN.json を作る支援機能
- **アクティビティの自動推薦（activity_recommender）**
  - 教師が session で activityId を直接指定する
  - applicability に基づく候補絞り込みは将来タスク
- サーバー側の処理
- ログイン・課金・ユーザー管理（マネタイズ時に追加）
- 教師コミュニティの教材シェア（マネタイズ時に追加）
- handoff ファイル・SKILL.md・段階管理ファイルの生成

---

## 完了の定義

### Step 1 完了

- session_001.json をドラッグしたら 4 ファイルがダウンロードできる
- 4 ファイルがブラウザ／Word で開いて中身が正しく表示される
- Stage 1 で発覚した 9 問題が再発していない

### Step 2 完了

- フォームを埋めて生成ボタンを押したら、同じ 4 ファイルがダウンロードできる
- フォームから作った session JSON を保存・再アップロードして同じ結果が得られる

---

## Claude Code への引き渡し手順

1. GitHub で新リポジトリ `japanese-lesson-tool`（仮名）を作成
2. ローカルに clone
3. 既存リポジトリ `japanese-lesson-html` から以下をコピー:
   - `shared/common/flow_synthesizer.js` → `src/common/`
   - `shared/common/image_resolver.js` → `src/common/`
   - `shared/common/ruby_dictionary.js` → `src/common/`
   - `shared/common/design_tokens.css` → `src/styles/`
   - `shared/common/fonts_imports.css` → `src/styles/`
   - `lesson_configs/lesson_01.json` → `data/`
   - `lesson_configs/lesson_02.json` → `data/`
   - `session_configs/session_001.json` → `data/`（動作確認用）
   - `activity_catalog.json` → `data/`
   - `master_image_registry.json` → `data/`
4. この design_brief.md を新リポジトリのルートに置く
5. Claude Code を起動して「design_brief.md を読んで Step 1 から実装してほしい」と伝える
