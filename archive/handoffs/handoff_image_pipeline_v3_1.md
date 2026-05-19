# 引き継ぎ資料：画像生成プロンプト v3.1 修正完了
**作成日：2026-05-19**
**前チャットの作業：マスタープロンプトガイドの監査 → v3.1 一括修正 → SMOKEテスト準備**

---

## ⚠️ 次チャットで最初にやること

**SMOKEテスト結果の精査**（2語：アメリカ人・銀行）

`smoke_test_v3_1.json` を使って生成した画像を添付し、以下の合格基準を確認する。

| 語 | 確認項目 | 合格 | 不合格 |
|---|---|---|---|
| アメリカ人 | 背景色 | 温かいオフホワイト（クリーム系） | 純白 / スカイブルー |
| アメリカ人 | スタイル | フラットベクター・テキストなし | リアル調・文字混入 |
| 銀行 | 背景色 | 淡いスカイブルー全面 | 白 / グレー |
| 銀行 | 看板 | 英語1語「BANK」のみ | 日本語 / 複数語 / なし |

**合格 → フルバッチ（第1課 17語）へ進む**
**不合格 → 画像を添付して「SMOKEテスト不合格。精査してください」と伝える**

---

## 次チャットへのアップロード必須ファイル

| ファイル | 役割 |
|---|---|
| `master_prompt_design_guide_v3_1.py` | 修正済みガイド本体（このチャットの成果物） |
| `smoke_test_v3_1.json` | SMOKEテスト用プロンプト（2語・パイプライン互換） |
| `v3_1_変更点サマリ.md` | 修正内容の差分記録 |
| このファイル（引き継ぎ資料） | 経緯・状況説明 |

---

## このチャットで行ったこと

### 1. 発端
添付画像の精査依頼。人物（アメリカ人）の背景が純白、建物（銀行）が淡いスカイブルー——なぜ違うのかという問いから始まった。

### 2. 背景差異の原因特定
v3.0 のテンプレート設計を精査した結果、**意図的な仕様差**（人物＝白、建物＝スカイブルー）であることを確認。ただし過去画像（vocab_アメリカ人.png、word_アメリカ人__2_.png）と今回生成（word_アメリカ人__3_.png）を比較すると、過去は温かいクリーム系、今回は純白という差異が判明。

### 3. v3.0 の全面監査
マスタープロンプトガイド v3.0（2953行）を精査し、**6つの問題**を発見。

### 4. 発見した問題一覧

| # | 重要度 | 問題 | 影響テンプレート |
|---|---|---|---|
| 1 | 🔴 最重要 | 問題F「hex全廃（37箇所）」が未完了。changelog・STYLE_BIBLEの主張と実体が不一致。`#FBFBFB ()` の空括弧が機械置換の削り残しの証拠。 | spatial_relation / action_verb / vocabulary_adjective / ARROW_SEMIOTICS / reset_prompt |
| 2 | 🔴 重要 | 白飛びリグレッション：v3.0のhex削除でSCENE「Solid white」が優勢化し純白化 | vocabulary_person |
| 3 | 🔴 重要 | 同リグレッションが人物以外にも波及 | vocabulary_object_concrete / vocabulary_variant_grid / vocabulary_adjective |
| 4 | 🟡 中 | example_sentenceのSTYLE RECIPEに「or」曖昧表現が残存（v3.0がBのみ直しCを放置） | example_sentence |
| 5 | 🟡 中 | QA_CHECKLISTが純白を「仕様どおり合格」として通過させる構造（白飛びを検出不能） | QA_CHECKLIST |
| 6 | 🟢 軽微 | vocabulary_object_concreteの背景指定が2サブ戦略に重複記述（片側のみ修正する地雷） | vocabulary_object_concrete |

### 5. v3.1 一括修正
全6問題を一括適用。**16箇所の置換を件数アサート付きで適用、全項目通過**。

| 修正 | 内容 |
|---|---|
| 問題F完遂 | テンプレート本文・ARROW_SEMIOTICS・reset_promptの残存#HEX15個を一掃。`()` 空括弧も除去。 |
| 背景クリーム化 | SCENE背景指定を `Solid soft cream off-white background (warm off-white, NOT pure stark white).` に統一（人物・具体物×2・グリッド・形容詞×3・STYLE_BIBLE） |
| example_sentence | `soft cream white or pale background` → `soft cream off-white background` |
| QA更新 | 背景文言を実体に同期 ＋ #HEX残存ゼロ検証の項目を新設 |
| ドキュメント | バージョンをv3.1に更新、改訂履歴・color_palette.noteを実体に合わせ改訂 |

### 6. SMOKE準備
`smoke_test_v3_1.json` を作成（パイプライン互換スキーマ：`vocabulary` 配列 + `imageId`/`word`/`reading`/`en`/`vocab_type`/`prompt` の6フィールド）。

---

## 修正しなかったこと（意図的）

- **テンプレートB（建物）**：スカイブルー全面の仕様は v3.0 で完成済み。変更なし。
- **STYLE RECIPEの `soft cream white background`**：パレット色名（STYLE_BIBLE色名と一致必須）なので変更しない。修正が効くのはSCENE側が `off-white (NOT pure stark white)` を明示するようになったため。
- **v3.1改訂履歴コメント内の `#FFFFFF`/`#FBFBFB` の2箇所**：問題説明のドキュメント記述。プロンプトには注入されない。

---

## ファイル状態（2026-05-19 時点）

| ファイル | バージョン | 状態 |
|---|---|---|
| master_prompt_design_guide_v3_1.py | v3.1 | ✅ 完成・6問題修正済み |
| smoke_test_v3_1.json | smoke_v3_1 | ✅ 作成済み・パイプライン互換 |
| image_prompts_lesson01_v1_4.json | v1_4 | ⏳ SMOKEテスト合格後にv3.1ベースで再生成が必要 |
| master_image_registry_v2_0.json | v2.0 | ⏳ フルバッチ後に更新 |
