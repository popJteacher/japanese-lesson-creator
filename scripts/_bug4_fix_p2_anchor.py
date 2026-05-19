#!/usr/bin/env python3
"""
Bug ④ A 修正: lesson_01.json の p2 アンカー位置を 2-1 から 2-4 に移動。

理由:
  ユーザー仕様の p2 アンカー例文は「先生ですか。→ はい、先生です。/いいえ、先生じゃありません。」
  これは lesson_01.json の例文 2-4 (imageId: ex_L01_008) の内容と一致する。
  例文番号は PDF 原典の順序を尊重し変更しない(2-1 は PDF p.6 文型セクション 2-1 原典「リンさんですか。」を維持)。
"""
import json
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'data' / 'lesson_01.json'

with PATH.open('r', encoding='utf-8') as f:
    data = json.load(f)

# Find p2 examples
moved_from = None
moved_to = None
for pat in data['patterns']:
    if pat.get('id') != 'p2':
        continue
    for ex in pat['examples']:
        if ex['no'] == '2-1' and ex.get('isAnchor') is True:
            ex['isAnchor'] = False
            moved_from = ex['no']
        if ex['no'] == '2-4':
            ex['isAnchor'] = True
            moved_to = ex['no']

assert moved_from == '2-1', f'Expected anchor at 2-1, found at {moved_from}'
assert moved_to == '2-4', f'Failed to mark 2-4 as anchor'
print(f'[bug4a] moved isAnchor: {moved_from} -> {moved_to}')

# Update _meta
data['_meta']['lastModified'] = '2026-05-15'
data['_meta']['changes'].append(
    'v2.11.1 (2026-05-15): Bug④A 修正。p2 アンカーを 2-1(リンさんですか。) から '
    '2-4(先生ですか。→ はい、先生です。/いいえ、先生じゃありません。) に移動。'
    'ユーザー仕様(handoff v15)に合わせて、より包括的な疑問+応答セット例文を p2 代表例文として位置付ける。'
    '例文番号(2-1/2-4)は PDF 原典順序を維持。formatVersion 2.7 維持。'
)

with PATH.open('w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f'[done] wrote {PATH}')
