#!/usr/bin/env python3
"""
lesson_01.json の practice 仕様を更新:
  - p1: practiceImageSource を "vocabulary" → "namedCharacters" に変更
        practiceTemplates を「＿＿＿さんは＿＿＿です。」(2 blanks) に置換
  - p3: practiceTemplates を「＿＿＿さんは＿＿＿の＿＿＿です。」(3 blanks) に置換
  - p2 は触らない (既に namedCharacters)
"""
import json
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'data' / 'lesson_01.json'

with PATH.open('r', encoding='utf-8') as f:
    data = json.load(f)

P1_NEW_TEMPLATES = [
    { 'pattern': '＿＿＿さんは＿＿＿です。', 'hint': '(名前・職業/国籍)' },
]
P3_NEW_TEMPLATES = [
    { 'pattern': '＿＿＿さんは＿＿＿の＿＿＿です。', 'hint': '(名前・所属・職業)' },
]

for pat in data['patterns']:
    pid = pat.get('id')
    if pid == 'p1':
        old_src = pat.get('practiceImageSource')
        pat['practiceImageSource'] = 'namedCharacters'
        pat['practiceTemplates'] = P1_NEW_TEMPLATES
        print(f'[p1] practiceImageSource: "{old_src}" → "namedCharacters"')
        print(f'[p1] practiceTemplates: 1 件に置換 — {P1_NEW_TEMPLATES[0]["pattern"]}')
    elif pid == 'p3':
        pat['practiceTemplates'] = P3_NEW_TEMPLATES
        print(f'[p3] practiceTemplates: 1 件に置換 — {P3_NEW_TEMPLATES[0]["pattern"]}')

# _meta 更新
data['_meta']['lastModified'] = '2026-05-15'
data['_meta']['changes'].append(
    'v2.11.4 (2026-05-15): p1/p3 の practice 仕様更新。'
    '(1) p1: practiceImageSource を "vocabulary" → "namedCharacters" に変更。'
    'practiceTemplates を「＿＿＿さんは＿＿＿です。」(2 blanks, 名前+職業/国籍) に置換。'
    '(2) p3: practiceTemplates を「＿＿＿さんは＿＿＿の＿＿＿です。」(3 blanks, 名前+所属+職業) に置換。'
    '宿題HTMLで人物カード+空欄入力による文型練習を実現。formatVersion 2.7 維持。'
)

with PATH.open('w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f'[done] wrote {PATH}')

# 検証
with PATH.open('r', encoding='utf-8') as f:
    verify = json.load(f)
print('\n=== verify ===')
for pat in verify['patterns']:
    print(f'  {pat["id"]}: practiceImageSource={pat.get("practiceImageSource")}')
    for t in pat.get('practiceTemplates', []):
        n_blanks = t['pattern'].count('＿') // 3  # ＿＿＿ = 1 blank
        print(f'      [{n_blanks} blanks] "{t["pattern"]}"  hint="{t.get("hint","")}"')
