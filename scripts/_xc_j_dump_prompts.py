# -*- coding: utf-8 -*-
"""X-c-5 review: 5 char_* + 18 ex_L01_* の prompt 一覧を Markdown にダンプする。

user が Gemini に第二意見を求めるため、コピペしやすい形で出力。
出力先: .tmp_verify/xc_ex_L01_prompts_dump.md
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "data" / "image_prompts_skill.json"
OUT = ROOT / ".tmp_verify" / "xc_ex_L01_prompts_dump.md"

CONTEXT = """\
# X-c lesson_01 prompts (5 char_* portraits + 18 ex_L01_* example sentences)

> 2026-05-26 X-c の v4.0.5 PoC 一陣。
> char_* portraits は **Template A vocabulary_person** ベース、PART 5.8 ROLE_BASED_GENERIC_PROFILES + PART 5.3 PHENOTYPE_PROFILES + PART 5.9 NAMED_CHARACTER_PROFILES 統合で起案 (v2 + リン v3)。生成済み・user 視認 OK。
> ex_L01_* example sentences は **Template C example_sentence** ベース、PART 1.14 PERSON_REFERENCE_ATTACHMENT_RULE 適用 (sentence + sceneCharacters の UNION で NAMED_CHARACTER 検出 → portrait を styleReferences として attach)。
>
> ### 確認済みの問題 (text-only v1 生成 → 失敗)
> 1. **aspect ratio = 1:1 に倒れる** (Template C に STRICT 16:9 directive がない)
> 2. **キャラ identity drift** (ref attachment infra 未実装で text-only path 生成だったため)
> 3. **prop の選択的非表示** (backpack 等)
>
> ### 現状 (本 dump 時点)
> - char_* portrait 5 件は生成・user 視認 OK
> - reference attachment infra は復元済 (`scripts/lib/nanobanana-client.mjs` + `scripts/generate-images-local.mjs` の `referenceImages` / `styleReferences` 機構)
> - ex_L01_* prompts は **下記の v1 状態**。これから Gemini に第二意見を求めて改訂したい
>
> ### Gemini への依頼内容 (案)
> 1. 各 prompt について、画像生成 (nanobanana / gemini-2.5-flash-image) が再現性高くこの sentence の意図を視覚化できるかの評価
> 2. 特に問題となる箇所 (vague / ambiguous / over-specified / redundant)
> 3. 16:9 aspect ratio を強制する STRICT directive 案
> 4. NAMED_CHARACTER portrait reference を有効活用させる prompt 文言案 (PART 1.14 rule_b ROLE+ASPECT addressing)
> 5. 視覚的に教育的価値が高い改善案 (例: 「鈴木さんは先生です」の scene でより教師らしさが伝わる構図)

---
"""


def main():
    data = json.loads(SKILL.read_text(encoding="utf-8"))
    char_entries = sorted(
        [v for v in data["vocabulary"] if v["imageId"].startswith("char_")],
        key=lambda v: v["imageId"],
    )
    ex_entries = sorted(
        [v for v in data["vocabulary"] if v["imageId"].startswith("ex_L01_")],
        key=lambda v: v["imageId"],
    )

    lines = [CONTEXT, ""]

    lines.append("## Part 1: Character portrait prompts (5 件)")
    lines.append("")
    lines.append("これらは生成済 + user 視認 OK のため改訂不要だが、ex_L01_* prompts が reference する対象なので Gemini 評価の文脈として掲載。")
    lines.append("")
    for i, v in enumerate(char_entries, 1):
        lines.append(f"### [{i}/{len(char_entries)}] `{v['imageId']}` — {v['word']}")
        lines.append("")
        lines.append(f"- **EN**: {v['en']}")
        lines.append(f"- **vocab_type**: {v['vocab_type']}")
        lines.append(f"- **aspect_ratio**: {v['aspect_ratio']}")
        lines.append(f"- **styleReferences**: {v.get('styleReferences', [])}")
        lines.append("")
        lines.append("**Prompt:**")
        lines.append("")
        lines.append("```")
        lines.append((v.get("prompt") or "").rstrip())
        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append("")

    lines.append("## Part 2: Example-sentence prompts (18 件) — Gemini レビュー対象")
    lines.append("")
    for i, v in enumerate(ex_entries, 1):
        meta = v.get("_meta", {}) or {}
        lines.append(f"### [{i}/{len(ex_entries)}] `{v['imageId']}` — {v['word']}")
        lines.append("")
        lines.append(f"- **EN**: {v['en']}")
        lines.append(f"- **vocab_type**: {v['vocab_type']}")
        lines.append(f"- **aspect_ratio**: {v['aspect_ratio']} (target — current text-only output drifted to 1:1)")
        lines.append(f"- **styleReferences**: {v.get('styleReferences', [])}")
        lines.append(f"- **detected NAMED_CHARACTERs**: {meta.get('detected_named_characters', [])}")
        lines.append(f"- **patternId**: {meta.get('patternId')}")
        lines.append(f"- **isAnchor**: {meta.get('isAnchor', False)}")
        lines.append("")
        lines.append("**Prompt:**")
        lines.append("")
        lines.append("```")
        lines.append((v.get("prompt") or "").rstrip())
        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"  char_*: {len(char_entries)} entries")
    print(f"  ex_L01_*: {len(ex_entries)} entries")
    print(f"  total chars: {sum(len(v.get('prompt','')) for v in char_entries+ex_entries)}")


if __name__ == "__main__":
    main()
