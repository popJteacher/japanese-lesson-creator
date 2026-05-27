# Gemini consult 第三回 reply — §3.9.8.C 適用範囲確認

> X-c-7 / 2026-05-27 / target consultant: Gemini 2.5 Pro (AI Studio)
> 前回回答: v4.0.8 difference patch (§3.9.2/3.9.3/3.9.8 + global constraint) を確定

---

## 1. 実装方針への回答（Gemini Q への返答）

> *How are you currently handling the injection of these specific archetype attributes—hardcoded into data models, or dynamically mapped during runtime?*

**現状**: lesson_01 ex_L01_* v3 prompt は応急コードとして `scripts/_xc_l_ex_L01_prompts_v3.py` に **hardcoded Python** で v4.0.7 verbatim phrase を文字列リテラル化（preflight PASS 用）。

**v4.0.8 で目指す姿**: §3.9.2 5a flag rule / §3.9.3.B institution anchor table / §3.9.8.A archetype cue table / §3.9.8.C question subject rule をすべて **universal lookup table** として `prompts/guide/part3_vocab_type_rules.md` 内に verbatim 表形式で書き、`/generate-image-prompt` skill が lesson_*.json の vocab/example を読んで該当行を **dynamically lookup → prompt injection** する方式に統一する。

これにより lesson_02 以降の例文（病院/銀行/駅/スーパー等）でも universal rule が自動適用され、課ごとの hardcoded Python は廃止できる。

---

## 2. 追加質問 D — §3.9.8.C の適用範囲精緻化（name-question vs identity-question）

`§3.9.8.C Question Subject Rule` は「identity-questioning yes-no sentences (e.g., "Are you a teacher?")」と定義されているが、lesson_01 には **異なる種類の yes-no question** が混在する。v4.0.7 では現状以下の挙動（user 実視で確定）:

| ID | 例文 | 種類 | v4.0.7 prompt 設計 | v4.0.7 実視評価 |
|---|---|---|---|---|
| **006** | リンさんですか。 | **name-question** (Are you Lin-san?) | NAMED_CHARACTER (リン) portrait + ? overlay | ✅ **OK** — リン本人を描いて「この人がリンさんか」を問う構図が成立 |
| **007** | はい、リンさんです。／いいえ、… | **name-affirmation 2-panel** | NAMED_CHARACTER (リン) で 2-panel A=○ / B=× | ✅ **OK** — リン本人が yes/no を表現 |
| **010** | 先生ですか。 | **role-question** (Are you a teacher?) | NAMED_CHARACTER (鈴木) portrait + ? overlay | ❌ **NG** — 鈴木さんは既知の教師なので意味論的に弱い |
| **012** | 韓国人ですか。 | **nationality-question** (Are you Korean?) | NAMED_CHARACTER (キム) portrait + ? overlay | ❌ **NG** — キムは既知の韓国人 + 国籍 cue 不在 |

§3.9.8.C を厳密適用すると 006 / 007 まで archetype 化されかねず、**user OK 出ている設計を regression させる懸念**がある。

**問い D**: §3.9.8.C を以下のいずれの定義で運用すべきか？

- **D-α**: name-question (subject が proper noun) は §3.9.8.C の **明示的例外** として NAMED_CHARACTER 保持。`identity-questioning` の定義を「role / nationality / occupation 等の **archetype-class 属性を問う** yes-no」に限定する。
- **D-β**: §3.9.8.C の定義を `proper-noun-questioning は NAMED_CHARACTER / class-attribute-questioning は archetype` と二分し、両者を `[SUBJECT]` block で機械的に切替えるルールにする。判定基準（例: 「『〇〇さん』『〇〇人』を含むか」「sentence の文型が `XさんはYです` か `Xですか` か」など）を verbatim で書きたい。
- **D-γ**: 別案があれば提示してほしい。

判定がブレないように、`/generate-image-prompt` skill が lesson_*.json から **機械的に branch できる verbatim 条件** で書いて欲しい（hardcoded Python ではなく universal rule に落とすため）。

---

## 3. PoC subset の扱い（保留）

E（PoC に 012 を加えるべきか）と F（archetype 学生 cue が NAMED_CHARACTER リンと衝突）については、v4.0.8 実装中の Claude Code 側判断で補う方針です。前者は cost 抑制、後者は実装時に prop variant を Claude 側で起案して試行 → 必要なら第四回 consult。

---

## 4. 期待する追加 deliverable

問い D への回答（D-α / D-β / D-γ の選択 + verbatim 条件式）。PART 3.9 v4.0.8 final patch にこの分岐を組み込み、`/generate-image-prompt` skill が lesson_*.json の例文を **読むだけで** archetype shift する/しないを自動判定できるようにしたい。
