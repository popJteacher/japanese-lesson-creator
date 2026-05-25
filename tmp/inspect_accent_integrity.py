#!/usr/bin/env python3
"""Phase α3 後半・前処理：vocab_catalog.json の accent_yomigana 整合性チェック。

判定軸：
  1) yomigana に kana 以外の文字（漢字・全角ローマ字・記号 ㏿ 等）が混入していないか
  2) yomigana の bare kana （^! を除いた部分）が catalog の reading と一致するか
     （長音 ー と お段+う / え段+い は等価扱い）
"""

import json
import re
import sys

CATALOG = 'data/vocab_catalog.json'

LONG_VOWEL_MAP = {
    'あ': 'あ', 'い': 'い', 'う': 'う', 'え': 'え', 'お': 'お',
    'か': 'あ', 'き': 'い', 'く': 'う', 'け': 'え', 'こ': 'お',
    'さ': 'あ', 'し': 'い', 'す': 'う', 'せ': 'え', 'そ': 'お',
    'た': 'あ', 'ち': 'い', 'つ': 'う', 'て': 'え', 'と': 'お',
    'な': 'あ', 'に': 'い', 'ぬ': 'う', 'ね': 'え', 'の': 'お',
    'は': 'あ', 'ひ': 'い', 'ふ': 'う', 'へ': 'え', 'ほ': 'お',
    'ま': 'あ', 'み': 'い', 'む': 'う', 'め': 'え', 'も': 'お',
    'や': 'あ', 'ゆ': 'う', 'よ': 'お',
    'ら': 'あ', 'り': 'い', 'る': 'う', 'れ': 'え', 'ろ': 'お',
    'わ': 'あ', 'を': 'お',
    'が': 'あ', 'ぎ': 'い', 'ぐ': 'う', 'げ': 'え', 'ご': 'お',
    'ざ': 'あ', 'じ': 'い', 'ず': 'う', 'ぜ': 'え', 'ぞ': 'お',
    'だ': 'あ', 'ぢ': 'い', 'づ': 'う', 'で': 'え', 'ど': 'お',
    'ば': 'あ', 'び': 'い', 'ぶ': 'う', 'べ': 'え', 'ぼ': 'お',
    'ぱ': 'あ', 'ぴ': 'い', 'ぷ': 'う', 'ぺ': 'え', 'ぽ': 'お',
    'ゃ': 'あ', 'ゅ': 'う', 'ょ': 'お',
}


def kata_to_hira(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def normalize_long(s):
    """長音表記揺れを吸収して正規化（音的等価形）。
       - katakana → hiragana
       - お段+う → お段+お、え段+い → え段+え
       - ー → 直前モーラの母音複製
    """
    if not s:
        return ''
    s = kata_to_hira(s)
    s = re.sub(r'([こそとのほもよろごぞどぼぽ])う', r'\1お', s)
    s = re.sub(r'([けせてねへめれげぜでべぺ])い', r'\1え', s)
    s = re.sub(r'(きゅ|しゅ|ちゅ|にゅ|ひゅ|みゅ|りゅ|ぎゅ|じゅ|びゅ|ぴゅ)う', r'\1う', s)  # ゅ+う は そのまま
    s = re.sub(r'(きょ|しょ|ちょ|にょ|ひょ|みょ|りょ|ぎょ|じょ|びょ|ぴょ)う', lambda m: m.group(1) + 'お', s)
    s = re.sub(r'(きぇ|しぇ|ちぇ|にぇ|ひぇ|みぇ|りぇ|ぎぇ|じぇ|びぇ|ぴぇ)い', lambda m: m.group(1) + 'え', s)
    # ー → previous vowel
    out = []
    for i, c in enumerate(s):
        if c == 'ー':
            prev = out[-1] if out else ''
            v = LONG_VOWEL_MAP.get(prev, '')
            out.append(v)
        else:
            out.append(c)
    return ''.join(out)


def bare_kana(yomi):
    return yomi.replace('^', '').replace('!', '')


KANA_RE = re.compile(r'^[぀-ゟ゠-ヿー]*$')


def is_pure_kana(s):
    return bool(KANA_RE.match(s))


def main():
    with open(CATALOG, 'r', encoding='utf-8') as f:
        cat = json.load(f)
    arr = [e for e in cat['entries'] if e.get('accent_yomigana')]

    exact = 0
    long_only = 0          # 長音表記揺れだけの差（音的等価・OK）
    subst_mismatch = 0     # 本当の kana 違い
    non_kana = 0           # 漢字/全角ローマ字/記号混入
    by_src = {'unidic': {'ok': 0, 'long': 0, 'subst': 0, 'nonkana': 0},
              'naist-jdic': {'ok': 0, 'long': 0, 'subst': 0, 'nonkana': 0},
              'unknown': {'ok': 0, 'long': 0, 'subst': 0, 'nonkana': 0}}
    samples_subst = []
    samples_nonkana = []
    for e in arr:
        src = e.get('accent_source', 'unknown')
        if src not in by_src:
            by_src[src] = {'ok': 0, 'long': 0, 'subst': 0, 'nonkana': 0}
        reading = e.get('reading', '')
        yomi = e['accent_yomigana']
        bare = bare_kana(yomi)
        if not is_pure_kana(bare):
            non_kana += 1
            by_src[src]['nonkana'] += 1
            if len(samples_nonkana) < 10:
                samples_nonkana.append({'word': e['word'], 'reading': reading, 'yomi': yomi, 'src': src})
            continue
        rn = normalize_long(reading)
        bn = normalize_long(bare)
        if rn == bn:
            # check whether the un-normalized strings also match (no long-vowel diff)
            if kata_to_hira(reading) == bare:
                exact += 1
                by_src[src]['ok'] += 1
            else:
                long_only += 1
                by_src[src]['long'] += 1
        else:
            subst_mismatch += 1
            by_src[src]['subst'] += 1
            if len(samples_subst) < 15:
                samples_subst.append({
                    'word': e['word'], 'reading': reading, 'yomi': yomi, 'src': src,
                    'r_norm': rn, 'b_norm': bn,
                })

    print(f'total with yomigana   : {len(arr)}')
    print(f'  exact (kana eq)     : {exact}')
    print(f'  long-vowel-only diff: {long_only}  (sound-equivalent, OK)')
    print(f'  substantive mismatch: {subst_mismatch}  (REAL bug)')
    print(f'  non-kana char in y  : {non_kana}      (漢字/全角ローマ字/記号混入)')
    print(f'  total REAL bad      : {subst_mismatch + non_kana}')
    print()
    print('by source:')
    for src, d in by_src.items():
        total = sum(d.values())
        if total == 0:
            continue
        bad = d['subst'] + d['nonkana']
        print(f'  {src:11s} : ok={d["ok"]} long={d["long"]} subst={d["subst"]} nonkana={d["nonkana"]} '
              f'-> {bad}/{total} bad ({bad/total*100:.1f}%)')
    print()
    print('sample non-kana (first 10):')
    for s in samples_nonkana:
        print(' ', s)
    print()
    print('sample substantive mismatch (first 15):')
    for s in samples_subst:
        print(' ', s)


if __name__ == '__main__':
    main()
