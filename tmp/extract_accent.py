#!/usr/bin/env python3
# tmp/extract_accent.py
# OpenJTalk から 10 単語のアクセント情報を抽出し、JSON で stdout に出力。
# pyopenjtalk の extract_fullcontext() を使い、HTS フルコンテキストラベルから
# モーラ列とアクセント型を取り出す。
#
# 出力形式:
#   [{ "id": "word_七日", "word": "七日", "mora": ["ナ","ノ","カ"],
#      "accent_type": 1, "mora_count": 3, "ipa": "naꜜnoka" }, ...]
#
# accent_type: 0=平板, 1=頭高 (1モーラ目の後で下降), 2=2モーラ目の後で下降, ...

import sys
import json
import re
import pyopenjtalk

WORDS = [
    ("word_安い",     "安い"),
    ("word_七日",     "七日"),
    ("word_消しゴム", "消しゴム"),
    ("word_雪",       "雪"),
    ("word_二十日",   "二十日"),
    ("word_二日",     "二日"),
    ("word_母",       "母"),
    ("word_夜",       "夜"),
    ("word_来年",     "来年"),
    ("word_六日",     "六日"),
]

# OpenJTalk phoneme → IPA mapping
PHONEME_TO_IPA = {
    'a': 'a', 'i': 'i', 'u': 'ɯ', 'e': 'e', 'o': 'o',
    'A': 'ḁ', 'I': 'i̥', 'U': 'ɯ̥', 'E': 'e̥', 'O': 'o̥',
    'k': 'k', 'g': 'ɡ', 's': 's', 'sh': 'ɕ', 'z': 'z', 'j': 'd͡ʑ',
    't': 't', 'd': 'd', 'ts': 't͡s', 'ch': 't͡ɕ',
    'n': 'n', 'h': 'h', 'f': 'ɸ', 'b': 'b', 'p': 'p',
    'm': 'm', 'y': 'j', 'r': 'ɾ', 'w': 'w', 'v': 'v',
    'ky': 'kʲ', 'gy': 'ɡʲ', 'ny': 'ɲ', 'hy': 'ç', 'by': 'bʲ', 'py': 'pʲ',
    'my': 'mʲ', 'ry': 'ɾʲ', 'dy': 'dʲ', 'ty': 'tʲ',
    'N': 'ɴ', 'cl': 'ʔ',  # cl = 促音 (sokuon)
    'sil': '', 'pau': '',
}


def extract_accent_from_labels(labels):
    """
    HTS full-context labels から mora 列と accent_type を取り出す。
    各 label は "xx^xx-PH+xx=xx/A:.../F:5_1#0_xx@..." の形式。
    F: フィールドの "mora_count_accent_type" を抜く。
    A: フィールドの先頭値 (accent_position_relative) を mora 単位で見る。
    """
    # phoneme 列を抽出 (中央の "-PH+" 部分)
    phonemes = []
    for lab in labels:
        m = re.search(r'-([a-zA-Z]+)\+', lab)
        if not m:
            continue
        ph = m.group(1)
        if ph in ('sil', 'pau'):
            continue
        phonemes.append(ph)

    # accent_type は F: フィールドから (例: F:3_1#0_xx@... → 3 morae, accent_type 1)
    accent_type = None
    mora_count = None
    for lab in labels:
        m = re.search(r'/F:(\d+)_(\d+)#', lab)
        if m:
            mora_count = int(m.group(1))
            accent_type = int(m.group(2))
            break

    return phonemes, mora_count, accent_type


def phonemes_to_morae(phonemes):
    """
    phoneme 列を mora 列に変換 (1 mora = CV pair or special)。
    例: ['n','a','n','o','k','a'] → [('n','a'),('n','o'),('k','a')]
    """
    morae = []
    i = 0
    while i < len(phonemes):
        ph = phonemes[i]
        # 特殊モーラ: N (撥音), cl (促音) は単独で 1 mora
        if ph in ('N', 'cl'):
            morae.append(('', ph))
            i += 1
            continue
        # 子音 + 母音 のペア
        if ph in ('a', 'i', 'u', 'e', 'o', 'A', 'I', 'U', 'E', 'O'):
            # 母音単独 (1 mora)
            morae.append(('', ph))
            i += 1
            continue
        # 子音 + 次の母音
        if i + 1 < len(phonemes):
            next_ph = phonemes[i + 1]
            if next_ph in ('a', 'i', 'u', 'e', 'o', 'A', 'I', 'U', 'E', 'O'):
                morae.append((ph, next_ph))
                i += 2
                continue
        # それ以外 (子音単独・想定外)
        morae.append((ph, ''))
        i += 1
    return morae


def morae_to_ipa(morae, accent_type):
    """
    mora 列と accent_type から IPA 文字列を組み立て、accent_type 位置に
    downstep marker ꜜ を挿入する。
    accent_type=0: ꜜ なし (heiban)
    accent_type=N>0: N 番目の mora の後に ꜜ
    """
    parts = []
    for idx, (c, v) in enumerate(morae):
        c_ipa = PHONEME_TO_IPA.get(c, c)
        v_ipa = PHONEME_TO_IPA.get(v, v)
        parts.append(c_ipa + v_ipa)
        # accent_type=N: N 番目の mora (1-indexed) の後で下降
        if accent_type and accent_type > 0 and idx + 1 == accent_type:
            parts.append('ꜜ')
    return ''.join(parts)


def main():
    results = []
    for word_id, word in WORDS:
        try:
            labels = pyopenjtalk.extract_fullcontext(word)
            phonemes, mora_count, accent_type = extract_accent_from_labels(labels)
            morae = phonemes_to_morae(phonemes)
            ipa = morae_to_ipa(morae, accent_type)
            mora_kana = [c + v for c, v in morae]  # debug only
            results.append({
                'id': word_id,
                'word': word,
                'phonemes': phonemes,
                'mora_repr': mora_kana,
                'mora_count': mora_count,
                'accent_type': accent_type,
                'ipa': ipa,
            })
        except Exception as e:
            results.append({'id': word_id, 'word': word, 'error': str(e)})

    # Windows console は cp932 で IPA 文字を encode できないため、
    # JSON は utf-8 でファイルに直接書く。stdout には件数のみ報告。
    out_path = 'tmp/google_smoke_ipa/accent_data.json'
    import os
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'wrote {len(results)} entries → {out_path}')


if __name__ == '__main__':
    main()
