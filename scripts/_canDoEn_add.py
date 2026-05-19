#!/usr/bin/env python3
"""
lesson_01.json の patterns[].canDo の直後に canDoEn フィールドを追加する。
slide_html.js は既に canDoEn の出力に対応済み(introGoalsSlide / patternIntroSlide / wrapUpSlide)。
"""
import json
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'data' / 'lesson_01.json'

CANDOEN = {
    'p1': "Can introduce names, occupations, and nationalities using '~ wa ~ desu'.",
    'p2': "Can ask about occupations and nationalities using '~ desu ka' and answer with yes/no. Can confirm identity using 'dare desu ka'.",
    'p3': "Can express affiliation (school, company, bank, etc.) using '~ no ~ desu'.",
}

with PATH.open('r', encoding='utf-8') as f:
    data = json.load(f)

# patterns の各エントリで、canDo の直後に canDoEn を挿入する。
# dict は挿入順を保持するため、新しい dict を構築して順序を制御する。
updated = []
for pat in data['patterns']:
    pid = pat.get('id')
    if pid not in CANDOEN:
        updated.append(pat)
        continue
    new_pat = {}
    for k, v in pat.items():
        new_pat[k] = v
        if k == 'canDo':
            new_pat['canDoEn'] = CANDOEN[pid]
    updated.append(new_pat)
    print(f'[{pid}] canDoEn added')

data['patterns'] = updated

# _meta 更新
data['_meta']['lastModified'] = '2026-05-15'
data['_meta']['changes'].append(
    'v2.11.2 (2026-05-15): canDoEn フィールドを全 patterns (p1/p2/p3) に追加。'
    '英語トグル時に「今日の目標」スライド・文型スライド・まとめスライドの canDo に英語訳が表示される。'
    'formatVersion 2.7 維持。'
)

with PATH.open('w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f'[done] wrote {PATH}')
