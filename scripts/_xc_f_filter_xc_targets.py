# -*- coding: utf-8 -*-
"""X-c scope filter: char_* + ex_L01_* のみ抽出した一時 prompts JSON を生成する。

generate-images-local.mjs に --prompts として渡すための temp ファイル。
ex_L02_* は X-c scope 外のため除外する。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "image_prompts_skill.json"
DST = ROOT / "data" / "_xc_targets.json"


def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    keep = []
    for v in data.get("vocabulary", []):
        iid = v.get("imageId", "")
        if iid.startswith("char_") or iid.startswith("ex_L01_"):
            keep.append(v)
    # 順序保持: char_* 5 件を先、ex_L01_* 18 件を後
    char_entries = [v for v in keep if v["imageId"].startswith("char_")]
    ex_entries = [v for v in keep if v["imageId"].startswith("ex_L01_")]
    ordered = char_entries + ex_entries

    out = {
        "_meta": {
            **data.get("_meta", {}),
            "subset": "X-c targets (char_* + ex_L01_*) — extracted for generate-images-local",
            "extractedFrom": "data/image_prompts_skill.json",
            "totalEntries": len(ordered),
        },
        "vocabulary": ordered,
    }
    DST.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {DST.relative_to(ROOT)}: {len(ordered)} entries")
    print(f"  char_*:  {len(char_entries)}")
    print(f"  ex_L01_*: {len(ex_entries)}")


if __name__ == "__main__":
    main()
