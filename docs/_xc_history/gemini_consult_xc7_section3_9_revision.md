# Gemini consult 第二回 — PART 3.9 v4.0.8 改修起案

> X-c-7 / 2026-05-27 / target consultant: Gemini 2.5 Pro (AI Studio)
> 第一回 artifact: [gemini_consult_ex_L01_v2_prompts.txt](gemini_consult_ex_L01_v2_prompts.txt) / [gemini_consult_char_portraits.txt](gemini_consult_char_portraits.txt)

---

## 1. Context

- **第一回 (X-c-6 / 5/27 午前)**: lesson_01 ex_L01_* v1 (text-only path) が大量に fail → char portrait + ex_L01_001/006/014 v2 prompt を Gemini に診断依頼。3 round の議論を経て PART 3.9 を 5→8 subsection に拡張し v4.0.7 を確定。invariants hash `c821d13e646e` → `8a608d9863c8`。
- **本回 (X-c-7)**: v4.0.7 に基づく v3 prompt 18 件を nanobanana で再生成（cost $0.6966 / styleRefs 15 件 attach / 5/27 11:22-25 JST）。user 実視で **18 件中 6 NG + 1 注意** が確定。
- 個別 retry では恒久解決しない設計欠落と判断したため、Gemini consult 第二回として §3.9 改修案を起案する。

---

## 2. Symptom Report — 6 NG + 1 注意

| ID | 例文 | NG 症状（user + Claude 客観評価） |
|---|---|---|
| **004** | 鈴木さんは日本人です。 | 教室で本を持って手を出す教師像。**001 (鈴木さんは先生です)とほぼ同一**。「日本人」visual cue ゼロ |
| **005** | リンさんは中国人です。 | 大学講堂で notebook 持って手を出す学生像。**002 (リンさんは大学生です)とほぼ同一**。「中国人」visual cue ゼロ |
| **010** | 先生ですか。 | 鈴木さん portrait 添付で「教室で本を持つ鈴木さん本人」+ ? overlay。**001 とほぼ同一**。「archetype の先生」として描かれていない |
| **011** | はい、先生です。／いいえ、先生じゃありません。 | 2-panel B archetype。両側ともネクタイ・スーツの「サラリーマン男性」。**「先生」固有 cue (chalk / 教壇 / 本) が消失** |
| **012** | 韓国人ですか。 | キム portrait 添付で「オフィスデスクで PC のキムさん本人」+ ? overlay。**完全な「会社員」絵**。「韓国人」visual cue ゼロ、例文との連結が切れている |
| **013** | はい、韓国人です。／いいえ、韓国人じゃありません。 | 2-panel B archetype。両側ともブリーフ持ちスーツ男性。「韓国人」cue 一切なし |
| 016 (注意) | キムさんは東西銀行の会社員です。 | cubicle オフィスにしか見えない。「銀行」固有 cue (窓口カウンター / 札束 / 金庫扉) なし、003/009 (キムさんは会社員) と差別化できない |

参考: 成功した同種 entry — 014 (タノムさん医者 INSIDE 病院: 白衣+聴診器+ベッド) / 015 (鈴木さん先生 INSIDE 学校: 黒板+生徒机) / 018 (キムさんデパート: 衣服売り場+ベスト制服)

---

## 3. Attachments (送付素材)

**Gemini に手動アップロードする画像 9 件:**
- `data/images/ex_L01_001.png` (成功 reference: 教師 role action)
- `data/images/ex_L01_004.png` (NG: 国籍 fail)
- `data/images/ex_L01_005.png` (NG: 国籍 fail)
- `data/images/ex_L01_010.png` (NG: archetype と NAMED 被り)
- `data/images/ex_L01_011.png` (NG: B archetype 「先生」性消失)
- `data/images/ex_L01_012.png` (NG: 国籍 + archetype 両方 fail)
- `data/images/ex_L01_013.png` (NG: B archetype 「韓国人」消失)
- `data/images/ex_L01_014.png` (成功 reference: 医者 INSIDE hospital)
- `data/images/ex_L01_016.png` (注意 reference: 銀行 affordance 弱)

**Gemini に貼り付けるプロンプト 9 件 verbatim:**
- [gemini_consult_xc7_prompts.txt](gemini_consult_xc7_prompts.txt) (61KB / 上記 9 ID 順)

---

## 4. 自己診断 — 4 つの根本原因仮説

### (A) §3.9.2 5a "introductory social gesture" exception の visual differentiation 不足

004 / 005 の SCENE & ACTION は `"same classroom context as ex_L01_001"` / `"same university lecture hall context as ex_L01_002"` と明示している。つまり **「教師の教室で gesture」を identity-only 国籍として描けと指示している**。当然、結果は role 例文と区別不能になる。

5a exception は背景 institution を role 例文と共有する設計だが、その背景は role を強く想起させる anchor (教室 → 教師 / 講堂 → 学生) になっており、国籍識別の妨げになる。

### (B) [CONSTRAINTS] の `no flag display in example-sentence illustrations` と v4.0 pivot との直接矛盾

v4.0 pivot（2026-05-22）で確定した方針:
> 全国共通 "modern daily casual wear" 1 種類 + 国旗視認性強化（両手持ち pose / 12-15% image-fill / 単一 staff 対称 grip）

これは `word_日本 / word_中国 / word_韓国` 等の **word_nationality 単独カード** で実装済（成功）。

ところが PART 3.9 v4.0.7 の全 example_sentence prompt の [CONSTRAINTS] には verbatim で:
> The clothing, accessories, props, and any visible badges of all characters must NEVER include any national flag motif, national emblem, nationality pin, country indicator, political symbol, or flag-print on garments. Nationality is conveyed by phenotype and subtle outfit palette tendency only — no flag display in example-sentence illustrations.

が含まれており、国籍 visual cue の手段が `phenotype + outfit palette tendency` に限定されている。
日中韓は East Asian phenotype が共通のため、phenotype と subtle palette tendency だけでは識別不能（v4.0 pivot 時点で既に既知の制約）。

### (C) §3.9.8 B archetype の occupation/nationality cue 規定欠落

011 / 013 の SUBJECT は:
> Establish a SINGLE, highly specific generic character archetype: a generic Japanese-context language teacher ... wearing a conservative navy business suit jacket and matching trousers ...

— つまり archetype の visual cue が「conservative navy business suit」止まりで、**「先生」固有 cue（chalk / 教壇 / 黒板 / 教科書を持つ動作）も「韓国人」固有 cue（韓国国旗）も無い**。

結果として「先生」archetype と「韓国人」archetype の両方が **ただのサラリーマン男性** に収束する。

§3.9.8 は A=NAMED_CHARACTER, B=archetype, identity lock を規定するが、**B archetype 側の semantic cue 要件**を持たない。

### (D) ex_L01_010 / 012 の「NAMED_CHARACTER 添付 + ? overlay」設計の意味論的曖昧さ

「先生ですか？」「韓国人ですか？」は **質問者が問う相手** を描くのが自然だが、generate_prompts は NAMED_CHARACTER (鈴木 / キム) portrait を添付して **NAMED_CHARACTER 本人を描いている**。
- 010 は鈴木さんを描いて「先生ですか？」と問う → 鈴木さん本人は教師（既知）だから「Y/N 確定済」となり pedagogy として弱い
- 012 はキムさんを描いて「韓国人ですか？」と問う → キムさんは韓国人（既知）だから同様

§3.9.8 single panel + ? overlay の subject 選択ルールが、yes-no question の意味論を考慮していない。

---

## 5. 問い (Q1–Q4)

### Q1 — §3.9.2 5a の visual differentiation 強化と国旗解禁の trade-off

**現状**: identity-only 国籍 (004/005) で 5a "introductory social gesture" 単独では visual cue として不十分（004 vs 001、005 vs 002 で区別不能）。

**選択肢 α**: [CONSTRAINTS] の `no flag display in example-sentence illustrations` を撤回し、§3.9.2 5a に **「small national flag prop held in one hand at chest level (12-15% image fill)」** を必須化（word_nationality の v4.0 国旗強化を identity-only example_sentence にも継承）。

**選択肢 β**: 5a を撤廃し、identity-only 国籍は **2-panel split** （左: NAMED_CHARACTER portrait, 右: large national flag）に統一する。flag を「2D UI overlay 的な隣接 panel」として diegetic 化を回避。

**選択肢 γ**: 国旗禁止を維持しつつ、5a に「country-specific cultural environment cue (e.g., Mt. Fuji silhouette for 日本人 / 万里の長城 silhouette for 中国人)」を必須化。ただし v4.0 pivot で撤廃した exoticization の懸念に逆行する。

Gemini への問い: **α / β / γ のいずれ、または別の選択肢が word_nationality 国旗強化との設計整合と pedagogy（学習者が phenotype だけでなく明示的な visual cue から国籍を識別できる）の両立に最も適切か？ side effect も含めて評価して欲しい。**

---

### Q2 — yes-no question (010 / 012) における subject 選択ルール

**現状**: 「先生ですか？」「韓国人ですか？」のような identity-questioning yes-no で、prompt は NAMED_CHARACTER 本人を描いて ? overlay を載せる設計。だが pedagogy 的には「既知の正答を持つキャラを問う」のは弱い。

**選択肢 α**: NAMED_CHARACTER 添付を解除し、archetype 風 silhouette + ? overlay に変更（§3.9.8 single panel mode の SUBJECT を archetype 化）。
**選択肢 β**: 構図を「左: 質問者 (asker, 別の NAMED_CHARACTER もしくは silhouette) + 吹き出し / 右: 質問対象 (responder, NAMED_CHARACTER) + ? overlay」の二者構図に変更。`?` の所在を responder 側に置けば質問者は誰でもよい。
**選択肢 γ**: 現状維持。NAMED_CHARACTER は「例文の文法主語」を視覚化しているのであって、Y/N の答えはスライド上の text と音声で提示すれば足る。

Gemini への問い: **§3.9.8 single panel + ? overlay の subject 選択ルールを yes-no question の意味論に適合させる verbatim phrase を起案して欲しい。**

---

### Q3 — §3.9.8 B archetype の occupation/nationality cue 必須化

**現状**: 011 / 013 の B archetype SUBJECT は「conservative navy business suit」止まりで、role/identity を visual に伝える固有 cue を持たない。結果として「先生」も「韓国人」も「ただのサラリーマン男性」になる。

**起案 (verbatim phrase 案)**:
> §3.9.8.A archetype cue MUST be embedded — the B-archetype SUBJECT block MUST explicitly enumerate ONE occupation-defining hand-held prop OR identity-defining environmental anchor, drawn from a §3.9.X verbatim lookup table:
> - 先生 (teacher archetype): one piece of chalk in writing hand + small textbook in non-writing hand
> - 学生 (student archetype): open spiral notebook in writing hand + canvas backpack on back
> - 会社員 (company employee archetype): briefcase in one hand + lanyard ID badge visible
> - 医者 (doctor archetype): stethoscope around neck + clipboard in one hand
> - 日本人 / 中国人 / 韓国人 / アメリカ人 etc.: small national flag prop (10-15% image fill) held in one hand at chest level

Gemini への問い: **このアプローチで §3.9.8 B archetype の cue 欠落を恒久解決できるか？ verbatim lookup table のどの行を追加 / 修正すべきか？ 副作用 (e.g., B side の symbol 数増加が §3.9.8 SYMBOL_COUNT STRICT ENFORCEMENT と衝突) を評価して欲しい。**

---

### Q4 — §3.9.3 affiliation_indoor の institution-specific interior cue 強化

**現状**: §3.9.3 は「INSIDE the [INSTITUTION]」phrase 止まりで、institution 固有の interior 描写は prompt-side の自由記述に委ねられている。016 (銀行) では cubicle オフィスにしか見えず、003/009 (会社員) と差別化できない。

**起案 (verbatim 表案)**:
> §3.9.3.B Institution-specific interior anchor table (verbatim cues — at least 2 of the listed anchors MUST appear in [SCENE & ACTION]):
> - 病院: examination bed / stethoscope on wall hook / IV stand / medical record clipboard
> - 銀行: teller counter with low partition / window grille / number-call display / safe vault door
> - 学校 / 大学: blackboard or whiteboard with chalk tray / student desks / lectern
> - デパート: clothing rack with hanging garments / display mannequin / cashier register / shopping bag stack
> - 会社 (corporate office): cubicle partition wall / multiple desks / wall clock / printer/copier

Gemini への問い: **この institution-specific anchor table を §3.9.3 に組み込むべきか？ lookup table のサイズ・適用範囲 (lesson_02+ にも universal) と保守コストの trade-off を評価して欲しい。lookup 不在 institution が出た場合のフォールバック挙動はどう設計すべきか？**

---

## 6. 期待する deliverable

Gemini からの最終回答として欲しいもの:

1. **Q1–Q4 各設問への評価**（選択肢 α/β/γ どれを推奨するか / 別案提示 / side effect）
2. **PART 3.9 v4.0.8 差分パッチ提案** — どの subsection (3.9.2 / 3.9.3 / 3.9.8) にどう verbatim phrase を追加 / 修正するか、unified diff 風の text で
3. **影響範囲評価** — 既存 §3.9.1 / 3.9.4 / 3.9.5 / 3.9.6 / 3.9.7 との衝突有無、Template C [SCENE & ACTION] への波及
4. **検証手順案** — 改修後 v4.0.8 PoC として再生成すべき entry の最小集合（cost 抑制のため）

これを踏まえ Claude Code 側で:
- PART 3.9 / Template C / build_prompts skill md / invariants hash 更新
- 該当 entry の v4 prompt 再起案 → 部分再生成 → user 実視 → v4.0.8 確定
を実施する。

---

## 7. 参考 (本回 consult で前提となる過去判断)

- v4.0 pivot (2026-05-22): `handoff_archive.md § 方針転換ログ 2026-05-22` / [docs/MIGRATION_PLAN.md](../MIGRATION_PLAN.md) § v4.0 マスタープロンプトガイド major-version 改修
- v4.0.7 8 subsection 確定 (2026-05-27 第一回 consult): [gemini_consult_ex_L01_v2_prompts.txt](gemini_consult_ex_L01_v2_prompts.txt) / [PART 3.9 §3.9.1–§3.9.8](../../prompts/guide/part3_vocab_type_rules.md#39-example_sentence-no-vocab_type--lesson-level)
- Template C v4.0.7: [PART 4](../../prompts/guide/part4_prompt_templates.md)
- NAMED_CHARACTER_PROFILES (5 件 portrait): [PART 5.9](../../prompts/guide/part5_vocab_reference_appendix.md)
