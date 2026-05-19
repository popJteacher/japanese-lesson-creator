# PIPELINE_INVENTORY.md

> 実ファイルから機械導出した棚卸し。語りではない。
> 生成手順は `CLAUDE.md` 末尾「セッションの開始と終了」を参照。
> 次回更新：`scripts/build-inventory.mjs`（NEXT_ACTIONS ③）で自動化予定。
> 最終生成日：2026-05-19（`_STEP3_ARCHIVE.md` 完了後）

---

## ライン A：Web ツール（教材生成・静的）

入力：`session_NNN.json` ＋ `lesson_NN.json`（埋め込み）／出力：スライド HTML・宿題 HTML・アクティビティ HTML・教案 docx

| 種別 | 正典パス |
|---|---|
| エントリ HTML | `index.html` |
| オーケストレーション | `src/main.js` |
| 共通モジュール | `src/common/flow_synthesizer.js` / `image_resolver.js` / `ruby_dictionary.js` / `ruby_kuromoji.js` |
| CSS | `src/styles/design_tokens.css` / `fonts_imports.css` |
| UI | `src/ui/form.js` |
| 生成器 | `src/generators/slide_html.js` / `homework_html.js` / `lesson_plan_docx.js` / `activity_html.js` |
| 活動ブロック分割 | `src/generators/activity_blocks/*.js`（10 ファイル） |

---

## ライン B：画像生成パイプライン

| 種別 | 正典パス | 注記 |
|---|---|---|
| GAS（monolith） | `gas/pipeline.gs` | hash `a33271d4368e`・元 `gas_pipeline_v5_3_patched.gs` |
| プロンプトガイド | `prompts/master_prompt_design_guide_v3_2.py` | hash `5d7e52f00e3f` |
| レジストリ | `data/master_image_registry.json` | active 103・**62 missing**（`npm run missing-assets --type=image`） |
| 不変条件チェッカー | `scripts/invariants.mjs` | invariants A/B/C を `npm run validate` から自動実行 |

S列プロンプト JSON は `data/image_prompts_lessonNN_v3_N.json` に配置すれば `invariants[C]` が自動検査する。現状未配置（v3.2 SMOKE 後）。

---

## ライン C：音声生成パイプライン

| 種別 | 正典パス／値 | 注記 |
|---|---|---|
| GAS | `gas/pipeline.gs`（generateAudio セクション） | コメント v2.0 だが実装は Cloud TTS Neural2 |
| VOICE_NAME | `ja-JP-Neural2-B` | `docs/REFERENCE.md` §2 |
| TTS キー property | `GCP_TTS_API_KEY` | live 確認済 |
| レジストリ | `data/master_audio_registry.json` | active 77・**77 missing** すべて null（`npm run missing-assets --type=audio`） |

⚠️ **音声 0 件は未解決の②**。`NEXT_ACTIONS.md` 参照。

---

## ライン D：データ（課マスターとカタログ）

| 種別 | 正典パス |
|---|---|
| 課マスター | `data/lesson_01.json` / `data/lesson_02.json` |
| アクティビティカタログ | `data/activity_catalog.json` / `intro_activity_catalog.json` |
| レジストリ | `data/master_image_registry.json` / `master_audio_registry.json` |
| 派生 .js | `data/*.js`（`scripts/build-embedded-data.py` 出力） |
| テストセッション | `data/session_001.json` / `session_002.json` / `session_test.json` |

---

## ライン E：検証スクリプト

| コマンド | 内部 | 終了コード |
|---|---|---|
| `npm run validate` | `scripts/validate.mjs` → スキーマ検査 ＋ `invariants.mjs` の A/B/C を呼び出し | エラー 1 件以上で 1 |
| `npm run missing-assets` | `scripts/missing-assets.mjs` | 未設定 1 件以上で 1 |
| `node scripts/invariants.mjs` | 単独実行（validate と同じ結果） | エラー 1 件以上で 1 |

`scripts/_*.py` / `_*.js` は Stage 1〜7 の使い捨て検証スクリプト（再実行不要）。

---

## ライン F：アーカイブ

`archive/`（サブディレクトリ別の集約・索引は `handoff_archive.md`）：

| ディレクトリ | 件数 | 内容 |
|---|---|---|
| `archive/handoffs/` | 79 | handoff 全鎖・progress 全鎖・旧 CLAUDE.md・各種ガイド |
| `archive/gas_old/` | 14 | 旧 monolith・旧スタンドアロン `.gs`・古い Drive バンドル |
| `archive/prompts/` | 14 | プロンプトガイド v2.x〜v3.1・v3.2 適用器（`apply_v3_2.py` / `d2.txt`） |
| `archive/data_old/` | 21 | 課マスター旧版・カタログ旧版・レジストリ旧版・旧 S列 JSON |
| `archive/misc/` | 7 | root 重複・SMOKE 旧版・xlsx 等 |
| `archive/screenshots/` | 3 | Stage 1 動作確認スクショ |

---

## ルート構成（リストラ後）

```
.gitignore
CLAUDE.md                 ← プロトコル（恒久）
NEXT_ACTIONS.md           ← 現在地・次の行動（1ページ・毎回書換）
PIPELINE_INVENTORY.md     ← 本ファイル
README.md
design_brief.md           ← プロジェクト仕様
index.html                ← Web ツールエントリ
package.json              ← npm run validate / missing-assets
handoff_archive.md        ← archive/ の索引

archive/   docs/   gas/   prompts/   data/   src/   scripts/   .claude/   .git/
```

---

## 整合性アラート

- **音声 0 件**（77/77 audioUrl null）— 原因未特定（②・`NEXT_ACTIONS.md` 参照）。
- **画像 62 件 missing**（`null_imageUrl` 33 ＋ `no_images_array` 29）— v3.2 S列再生成・SMOKE 待ち。
- **GAS ヘッダー版とセクション版のドリフト**（v7.1 / v5.3 / v2.0）— 仕様。実害なし。`invariants[A]` で情報として表示。
- **`progress_handoff_v14_0.md` §6 の v3.2 ガイド hash `d22730eb47e4` は誤記** — 実ファイルは `5d7e52f00e3f`（`docs/REFERENCE.md` §8）。
