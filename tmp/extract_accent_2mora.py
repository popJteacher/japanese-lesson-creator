#!/usr/bin/env python3
# tmp/extract_accent_2mora.py
# 2 モーラ尾高型問題の検証用：複数の身近な 2 モーラ語のアクセント情報を抽出。

import json
import os
import pyopenjtalk
import re

WORDS = [
    "服", "靴", "池", "猫", "雨", "秋", "春", "海", "川", "山",
    "目", "口", "耳", "鼻", "手", "足", "声", "色", "肉", "魚",
]

PHONEME_TO_IPA = {
    'a': 'a', 'i': 'i', 'u': 'ɯ', 'e': 'e', 'o': 'o',
    'A': 'ḁ', 'I': 'i̥', 'U': 'ɯ̥', 'E': 'e̥', 'O': 'o̥',
    'k': 'k', 'g': 'ɡ', 's': 's', 'sh': 'ɕ', 'z': 'z', 'j': 'd͡ʑ',
    't': 't', 'd': 'd', 'ts': 't͡s', 'ch': 't͡ɕ',
    'n': 'n', 'h': 'h', 'f': 'ɸ', 'b': 'b', 'p': 'p',
    'm': 'm', 'y': 'j', 'r': 'ɾ', 'w': 'w',
    'ky': 'kʲ', 'gy': 'ɡʲ', 'ny': 'ɲ', 'hy': 'ç', 'by': 'bʲ', 'py': 'pʲ',
    'my': 'mʲ', 'ry': 'ɾʲ',
    'N': 'ɴ', 'cl': 'ʔ', 'sil': '', 'pau': '',
}


def extract(word):
    labels = pyopenjtalk.extract_fullcontext(word)
    phonemes = []
    for lab in labels:
        m = re.search(r'-([a-zA-Z]+)\+', lab)
        if not m: continue
        ph = m.group(1)
        if ph in ('sil', 'pau'): continue
        phonemes.append(ph)
    mora_count = accent_type = None
    for lab in labels:
        m = re.search(r'/F:(\d+)_(\d+)#', lab)
        if m:
            mora_count = int(m.group(1))
            accent_type = int(m.group(2))
            break
    # mora 列 + IPA 構築
    morae = []
    i = 0
    while i < len(phonemes):
        ph = phonemes[i]
        if ph in ('N', 'cl'):
            morae.append(('', ph)); i += 1; continue
        if ph in ('a','i','u','e','o','A','I','U','E','O'):
            morae.append(('', ph)); i += 1; continue
        if i + 1 < len(phonemes) and phonemes[i+1] in ('a','i','u','e','o','A','I','U','E','O'):
            morae.append((ph, phonemes[i+1])); i += 2; continue
        morae.append((ph, '')); i += 1
    parts = []
    for idx, (c, v) in enumerate(morae):
        parts.append(PHONEME_TO_IPA.get(c, c) + PHONEME_TO_IPA.get(v, v))
        if accent_type and accent_type > 0 and idx + 1 == accent_type:
            parts.append('ꜜ')
    ipa = ''.join(parts)
    return {
        'word': word,
        'mora_count': mora_count,
        'accent_type': accent_type,
        'accent_label': '平板' if accent_type == 0 else ('頭高' if accent_type == 1 else f'中高/尾高({accent_type})'),
        'mora_repr': [c+v for c,v in morae],
        'ipa': ipa,
    }


def main():
    results = [extract(w) for w in WORDS]
    out_path = 'tmp/google_smoke_ipa/accent_data_2mora.json'
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'wrote {len(results)} entries -> {out_path}')
    # サマリ表示
    for r in results:
        is_odaka_2mora = r['accent_type'] == r['mora_count'] == 2
        flag = ' ★2モーラ尾高型' if is_odaka_2mora else ''
        print(f"  {r['word']} ({''.join(r['mora_repr'])}) mora={r['mora_count']} accent={r['accent_type']} [{r['accent_label']}] ipa={r['ipa']}{flag}")


if __name__ == '__main__':
    main()
