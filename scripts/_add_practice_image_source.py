#!/usr/bin/env python3
"""
lesson_01.json の patterns[] に practiceImageSource フィールドを追加する。
  p1 → "vocabulary"
  p2 → "namedCharacters"
  p3 → "namedCharacters+vocab"
位置: practiceTemplates の直前 (canDoEn より後)。
"""
import json
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'data' / 'lesson_01.json'

SOURCE = {
    'p1': 'vocabulary',
    'p2': 'namedCharacters',
    'p3': 'namedCharacters+vocab',
}

with PATH.open('r', encoding='utf-8') as f:
    data = json.load(f)

updated = []
for pat in data['patterns']:
    pid = pat.get('id')
    if pid not in SOURCE:
        updated.append(pat)
        continue
    new_pat = {}
    inserted = False
    for k, v in pat.items():
        if k == 'practiceTemplates' and not inserted:
            new_pat['practiceImageSource'] = SOURCE[pid]
            inserted = True
        new_pat[k] = v
    if not inserted:
        # practiceTemplates が見つからなければ末尾に追加
        new_pat['practiceImageSource'] = SOURCE[pid]
    updated.append(new_pat)
    print(f'[{pid}] practiceImageSource = "{SOURCE[pid]}"')

data['patterns'] = updated

# _meta 更新
data['_meta']['lastModified'] = '2026-05-15'
data['_meta']['changes'].append(
    'v2.11.3 (2026-05-15): patterns[] に practiceImageSource フィールドを追加 '
    '(p1: "vocabulary", p2: "namedCharacters", p3: "namedCharacters+vocab")。'
    'homework_html.js が宿題の練習問題画像を文型ごとに切り替えるための分岐キー。'
    'formatVersion 2.7 維持。'
)

with PATH.open('w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f'[done] wrote {PATH}')
