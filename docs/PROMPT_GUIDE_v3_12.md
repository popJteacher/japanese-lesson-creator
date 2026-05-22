# PROMPT_GUIDE_v3_12 — v3.12 シリーズのパッチノート

> **本ファイルの状態（2026-05-22）：v3.12 完了状態として保全。**
> 当初末尾に置いていた v3.13 BACKLOG handoff は main session
> （2026-05-22）が `docs/PHASE_BACKLOG.md` § 「v3.13 マスタープロンプト
> ガイド修正候補」へ migrate 完了。本ファイルは以降 v3.12 の実装サマリ
> のみを保持する archival doc。
>
> 次バージョン候補（v3.13・v4.0）は `docs/PHASE_BACKLOG.md` を SSOT として
> 参照。worktree session で v3.13 着手時は main を ff-merge してから
> PHASE_BACKLOG を読む。

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

## 次バージョン候補

v3.13・v4.0 の修正候補は `docs/PHASE_BACKLOG.md` § 「v3.13 マスタープロンプト
ガイド修正候補」に集約済（2026-05-22 main session migrate）。本ファイルから
新規候補を提案する場合は worktree → main fast-forward merge 経由で
PHASE_BACKLOG に追記する handoff 方式を踏襲する
（`docs/WORKFLOW.md` § ファイル所有権参照）。
