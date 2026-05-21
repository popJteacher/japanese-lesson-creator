# PROMPT_GUIDE_v3_12 — v3.12 シリーズのパッチノートと v3.13 backlog handoff

> **本ファイルの目的**
> worktree → main の fast-forward merge 時に、main session がこのファイルを
> 開いて以下を実施する：
> (1) v3.12 シリーズの実装サマリを確認
> (2) 末尾の **v3.13 BACKLOG ITEMS** を `docs/PHASE_BACKLOG.md` に追記
> (3) 追記が済んだら、本ファイルの該当 backlog セクションを削除
>    （= 「migration 完了印」として）
>
> docs/WORKFLOW.md § ファイル所有権：本ファイル (`docs/PROMPT_GUIDE_*.md`) は
> worktree 専属。`docs/PHASE_BACKLOG.md` は main 専属で worktree から触れない。
> よって本 handoff 方式が両者のルールを破らない唯一の経路。

---

## v3.12 シリーズ 実装サマリ

### v3.12.0 (2026-05-21) — 3 universal rules
- **PART 1.5 PHENOTYPE_SPECIFICATION_RULE**：enumerate 全面禁止 (rule_a) /
  隣接 2 段階 range 許容 (rule_b) / nationality は
  `COUNTRY_TO_PROFILE → PHENOTYPE_PROFILES` (rule_c) / role は
  `ROLE_PHENOTYPE_PALETTE` から sha256 deterministic (rule_d) / palette は
  v3.12 で fix (rule_e)
- **PART 1.6 TRADITIONAL_DRESS_PATTERN_RULE**：cultural traditional silhouette
  指定時は MUST 1 つの visible textile element を含む。lookup は
  scripts/build_prompts.py の `TRADITIONAL_DRESS_PATTERN_LOOKUP`。
- **PART 1.7 FLAG_PLACEMENT_RULE**：flag 位置を universal 4 options から word
  hash で deterministic 選択（garment 上のみ）。
- 既存問題 (Z1) phenotype 中央値収束 / (Z2) アジア伝統服が無地化 /
  (Z3) flag 位置画一化、いずれも構造的に解決。

### v3.12.1 (2026-05-21) — palette 改訂 + yukata 矛盾解消
- **(A) ROLE_PHENOTYPE_PALETTE 改訂**：v3.12.0 では entry[4]/[5] が
  「rich brown vs deep brown + tightly coiled black hair」で hair が同一だった
  ため、医者 (palette[4]) と 先生 (palette[5]) が視覚的に判別不能。
  全 6 entry を skin + hair length + hair texture の 3 軸で弁別化。
- **(B) 日本人 cultural_styling_hint option (c) yukata 削除**：yukata は
  one-piece の伝統衣装だが TWO-COLOR RULE が "top and trousers" の対比を
  要求するため Imagen に矛盾シグナルを送っていた。option (c) 削除後は
  (a) wagara top / (b) noragi jacket の 2 piece 構成のみとなり、TWO-COLOR
  RULE と整合。yukata 系文化要素は (a) wagara が代替表現として担う。
- 上記 2 件は v3.12 シリーズ内の minor tuning。guide PART 1.5 rule_e の
  palette-freeze 精神は次の major-version (v4.0) まで再適用する前提。

---

## v3.13 BACKLOG ITEMS（main session → docs/PHASE_BACKLOG.md に migrate）

以下を `docs/PHASE_BACKLOG.md` § 「v3.13 マスタープロンプトガイド修正候補」
（新規セクション）として追記してください。追記後、本ファイルから本セクション
を削除して「migration 完了」を示してください。

---

### v3.13-#1: GARMENT_REGISTER_CONSISTENCY_RULE（新規普遍ルール）

**背景**：v3.12 実機検証（韓国男性カード）で、hanbok 風 jeogori トップ
+ modern gray trousers + 白スリップオン という「上=伝統 / 下=モダン /
靴=モダン抜けすぎ」のレジスター不揃いが確認された。現在の v3.12 には
衣服の register（伝統度／格式）を上下で揃えるルールが存在しない：
- `FOOTWEAR RULE`：両足に靴を履け（register 不問）
- `TWO-COLOR RULE`：上下で色を分けろ（register 不問）
- `TRADITIONAL_DRESS_PATTERN_RULE`：伝統 silhouette のとき pattern を入れろ
  （trousers と footwear は不問）

**提案**：PART 1.8 として GARMENT_REGISTER_CONSISTENCY_RULE を新設。
```
原則: 上半身の register に trousers と footwear を揃える。
  rule_a: 上半身が伝統 silhouette のとき、trousers と footwear は
    (a) 同じ伝統 register（hanbok bottoms / 伝統低靴 等）OR
    (b) "muted modern neutral"（無装飾の cream/charcoal/indigo trousers
        + 無装飾の dark slip-on or simple flat = visually quiet 下半身）
    のいずれか。白スリップオン等の「新しすぎる」要素は (b) outlier として禁止。
  rule_b: 上半身が modern silhouette のとき、bottoms と footwear は modern。
```

**スコープ**：日本人 (a) wagara top / (b) noragi、韓国 (a)(c) hanbok 系、
中国 (a)(b) 中国服系、ベトナム (a)(b) áo dài 系 — すべての伝統 silhouette
option に影響。FOOTWEAR RULE の許可リストから「visually loud」アイテムを
register 別に切り分ける形になる。

**実装難易度**：中。ガイド本体に rule 追記 + cultural_styling_hint の
footwear 記述を整合。lesson_01 の現在の出力で 韓国・日本・ベトナム を
再生成して効果検証。

---

### v3.13-#2: role cards の plain-solid 明文化

**背景**：`NATIONAL_SYMBOL_ISOLATION_RULE.(d)` は "graphic / printed /
logo / patterned" garment や "unspecified print contents" を禁じているが、
これは nationality cards 向けの規律。role cards (医者・先生・学生 等) には
対応する明示的な plain-solid 規律が無く、nanobanana が生成的に小さな
stripes / dots / texture を出す可能性が残る。

**現状の実害**：未観測。lesson_01 の 5 role 画像（医者・先生・学生・
大学生・会社員）は plain solid で出ている。ただし将来 lesson 数や role
種類が増えたとき再発リスクあり。

**提案**：`ROLE_BASED_GENERIC_PROFILES.[role].outfit_hints` の各エントリに
"plain solid color (no stripes, no dots, no print, no pattern)" を追記、
OR PART 2.2 注記として一括規律を明文化。

**実装難易度**：低。テキスト追記のみ。

**優先度**：低（実害観測されてから対応で十分）。

---

### v3.13-#3: 伝統服が薄い／無い国の signature 多軸化

**背景**：v3.12 の `TRADITIONAL_DRESS_PATTERN_RULE` は rule_e
modern_styles_exempt で「伝統服がない国は entry 不要」を許容しているが、
代替の signature 軸を提供していない。将来 ドイツ・フランス・カナダ・
オーストラリア・オランダ 等が課に追加されたとき、cultural_styling_hint だけ
で差別化するには記述コストが高く、Imagen の収束に再び負ける可能性がある。

**提案**：v4.0（major-version）で `signature_for(word)` を cascading 構造化：

```python
def signature_for(word):
    # 以下を順次試して最初に hit したものを返す
    return (
        TRADITIONAL_DRESS_PATTERN_LOOKUP.get(word) or
        MODERN_FASHION_ARCHETYPE_LOOKUP.get(word) or
        REGIONAL_CRAFT_ACCENT_LOOKUP.get(word) or
        FOOTWEAR_SIGNATURE_LOOKUP.get(word) or
        COLOR_PALETTE_SIGNATURE_LOOKUP.get(word) or
        None
    )
```

各 lookup の例：
| 軸 | 例 |
|---|---|
| modern fashion archetype | ドイツ = "minimalist Bauhaus-clean tailored coat" / フランス = "tailored navy blazer + silk scarf" / オーストラリア = "Akubra-style brimmed hat + rugged work jacket" |
| regional craft accent | カナダ = "Cowichan-style chunky knit sweater" / メキシコ = "small huichol-bead bracelet" / アルゼンチン = "facón-belt detail" |
| footwear signature | オランダ = "klompen-inspired wooden clog accent" / 英国 = "Wellington-style boots" / モロッコ = "babouche-style pointed slippers" |
| color palette | スカンジナビア = "muted blue + cream" / 地中海 = "terracotta + olive + cream" |

**実装難易度**：高（major-version 扱い）。v3.13 では設計検討のみ、実装は v4.0
リリース時。lesson 拡張で新国追加が現実化する時期に着手。

---

### v3.13-#4: 新語彙の自動分類サポート (vocab_subtype)

**背景**：現在 `classify_person` は lookup miss すると build abort する設計
で、新国籍・新役割は人間が必ず手動で `PERSON_NATIONALITY_HINTS` /
`PERSON_ROLE_LOOKUP` 等に追加する必要がある。lesson 数増加に伴い、この
manual lookup expansion が運用コストになる。

**提案**：data 側に真実源を移す（`docs/MIGRATION_PLAN.md` 方向性と整合）：

1. GAS Vocabulary シートに `vocab_subtype` 列を追加
   （例："nationality_east_asian" / "role_doctor" / "role_teacher" 等）
2. `gas/pipeline.gs#exportVocabTypesAll()` で `vocab_types_lessonNN.json` に
   `vocab_subtype` を含めて export
3. `scripts/build_prompts.py` は subtype を見て分類、必要 lookup の有無を
   pre-flight check で警告

**実装難易度**：中（GAS 改修 + build_prompts 改修）。
**優先度**：中（lesson 02, 03 拡張時に着手するのが自然）。

---

## Migration completion checklist (main session)

- [ ] v3.13-#1 を docs/PHASE_BACKLOG.md に追記
- [ ] v3.13-#2 を docs/PHASE_BACKLOG.md に追記
- [ ] v3.13-#3 を docs/PHASE_BACKLOG.md に追記
- [ ] v3.13-#4 を docs/PHASE_BACKLOG.md に追記
- [ ] 本ファイルから「v3.13 BACKLOG ITEMS」セクション全体を削除
- [ ] 本 checklist 自体も削除
- [ ] commit message に "docs(phase4): v3.13 backlog migrated from PROMPT_GUIDE_v3_12.md handoff"
