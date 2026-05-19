#!/usr/bin/env python3
"""
master_image_registry.json の命名規則完全統一:
  - 残存する vocab_* キー (lesson_01 legacy + lesson_02 vocab) を全て word_* にリネーム
  - 重複がある場合 (vocab_X と word_X が両方存在) は word_X 側を保持し vocab_X を削除
  - ex_L*_* と char_* は変更しない (前回の Stage 1 Plan 準拠)
  - imageUrl/promptRef 等の内部フィールドは保持

事前監査結果に基づく:
  - lesson_01.json の全 imageId 参照は既に word_* で解決済み (37/37 OK)
  - 重複(vocab_X & word_X 両方)はゼロ → 単純リネームのみで完結
"""
import json
import sys
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / 'data' / 'master_image_registry.json'

with PATH.open('r', encoding='utf-8') as f:
    data = json.load(f)

entries = data.get('entries', {})
old_keys = list(entries.keys())

# 対象: vocab_* で始まる全エントリ
vocab_keys = [k for k in old_keys if k.startswith('vocab_')]

renamed = []
collisions = []
new_entries = {}

# 元の挿入順を保持しつつ rename
for k in old_keys:
    if k.startswith('vocab_'):
        new_k = 'word_' + k[len('vocab_'):]
        if new_k in entries:
            # word_X が先に存在 → vocab_X を捨てる(word_X を保持)
            collisions.append((k, new_k))
            continue
        if new_k in new_entries:
            collisions.append((k, new_k))
            continue
        new_entries[new_k] = entries[k]
        renamed.append((k, new_k))
    else:
        new_entries[k] = entries[k]

data['entries'] = new_entries

# _meta 更新
meta = data.setdefault('_meta', {})
meta['lastUpdated'] = '2026-05-15'
changes = meta.setdefault('changes', [])
changes.append(
    'v1.8 (2026-05-15): 命名規則完全統一。残存していた vocab_* キー(18件) を全て word_* に rename。'
    'Stage 1 で残置されていた lesson_01 legacy(vocab_男の人/女の人/外国人/会社) と '
    'lesson_02 想定 vocab(時計/腕時計/ペン/鉛筆/ケータイ/本/雑誌/新聞/かばん/消しゴム/ビル/市役所/山/人) が対象。'
    'ex_L*_* と char_* は変更なし。重複(vocab_X と word_X 両方存在) は 0 件。'
)

with PATH.open('w', encoding='utf-8', newline='\n') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f'[done] wrote {PATH}')
print(f'[info] renamed: {len(renamed)} keys')
for old, new in renamed:
    print(f'    {old}  →  {new}')
if collisions:
    print(f'[warn] collisions (vocab_X removed because word_X already existed): {len(collisions)}')
    for old, new in collisions:
        print(f'    {old}  (kept {new})')
else:
    print('[info] collisions: 0')
