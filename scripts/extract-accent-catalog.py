#!/usr/bin/env python3
# scripts/extract-accent-catalog.py
# Phase α3：vocab_catalog.json 全 entry にアクセント情報（yomigana 記法）を付与。
#
# 設計：A 方針ハイブリッド（user 確定 2026-05-24）
#   - 単一形態素 → UniDic (fugashi + unidic-lite) の aType を採用
#   - 複数形態素 → naist-jdic (pyopenjtalk) の全体 accent_type を採用
#   - 両方失敗 → accent_source='unknown' で skip（LLM cross-check 対象）
#
# 出力：vocab_catalog.json の各 entry に以下を追加
#   - accent_yomigana: "^なのか!" など Google SSML 用 yomigana 記法
#   - accent_type: 0=平板, 1=頭高, N>0=N モーラ目の後で下降
#   - mora_count: モーラ数（拗音は 1 mora）
#   - reading_kana: ひらがな読み（accent_source 由来）
#   - accent_source: "unidic" | "naist-jdic" | "unknown"
#
# 使い方:
#   python scripts/extract-accent-catalog.py --smoke  # 10 件 + 課題語で検証
#   python scripts/extract-accent-catalog.py          # 全 17508 件本走（vocab_catalog 上書き）

import argparse
import json
import os
import re
import sys

import fugashi
import unidic_lite
import pyopenjtalk

# ────────────────────────────────────────────────────────────
# kana / mora ヘルパー
# ────────────────────────────────────────────────────────────
SMALL_KANA = set('ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ')


def kata_to_hira(s):
    """カタカナをひらがなに変換（ひらがな・その他はそのまま）"""
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def split_morae(kana):
    """ひらがな/カタカナ文字列をモーラ列に分割（拗音は前と合体）"""
    morae = []
    i = 0
    while i < len(kana):
        c = kana[i]
        if i + 1 < len(kana) and kana[i + 1] in SMALL_KANA:
            morae.append(c + kana[i + 1])
            i += 2
        else:
            morae.append(c)
            i += 1
    return morae


def build_yomigana(kana, accent_type):
    """yomigana 記法 ^...! を生成。accent_type=0 は平板（!なし）"""
    morae = split_morae(kana)
    s = '^'
    for i, mora in enumerate(morae):
        s += mora
        if accent_type and accent_type > 0 and i + 1 == accent_type:
            s += '!'
    return s


# ────────────────────────────────────────────────────────────
# UniDic (fugashi) でアクセント取得
# ────────────────────────────────────────────────────────────
_tagger = None


def get_tagger():
    global _tagger
    if _tagger is None:
        _tagger = fugashi.Tagger(f'-d "{unidic_lite.DICDIR}"')
    return _tagger


def extract_via_unidic(word):
    """単一形態素のときだけ採用。複数形態素なら None を返す。"""
    tagger = get_tagger()
    nodes = list(tagger(word))
    if len(nodes) != 1:
        return None
    node = nodes[0]
    f = node.feature
    try:
        aType_str = f.aType
        if aType_str in (None, '', '*'):
            return None
        # aType は "2" or "2,3" 形式（複数候補）。最初を採用
        aType = int(aType_str.split(',')[0])
    except (ValueError, AttributeError):
        return None

    # UniDic の kana 属性
    kana_kata = f.kana or f.pron or ''
    if not kana_kata:
        return None
    reading = kata_to_hira(kana_kata)
    mora_count = len(split_morae(reading))
    yomigana = build_yomigana(reading, aType)
    return {
        'accent_type': aType,
        'mora_count': mora_count,
        'reading_kana': reading,
        'accent_yomigana': yomigana,
        'accent_source': 'unidic',
    }


# ────────────────────────────────────────────────────────────
# naist-jdic (pyopenjtalk) でアクセント取得
# ────────────────────────────────────────────────────────────
def extract_via_naist(word):
    try:
        labels = pyopenjtalk.extract_fullcontext(word)
    except Exception:
        return None
    mora_count = accent_type = None
    for lab in labels:
        m = re.search(r'/F:(\d+)_(\d+)#', lab)
        if m:
            mora_count = int(m.group(1))
            accent_type = int(m.group(2))
            break
    if mora_count is None or accent_type is None:
        return None
    # pyopenjtalk.g2p で reading をかな取得
    try:
        reading_kata = pyopenjtalk.g2p(word, kana=True)
        reading = kata_to_hira(reading_kata)
    except Exception:
        return None
    if not reading:
        return None
    yomigana = build_yomigana(reading, accent_type)
    return {
        'accent_type': accent_type,
        'mora_count': mora_count,
        'reading_kana': reading,
        'accent_yomigana': yomigana,
        'accent_source': 'naist-jdic',
    }


# ────────────────────────────────────────────────────────────
# A 方針ハイブリッド
# ────────────────────────────────────────────────────────────
def extract_accent(word):
    # 1st: UniDic（単一形態素のみ）
    r = extract_via_unidic(word)
    if r:
        return r
    # 2nd: naist-jdic（複合語含む全般）
    r = extract_via_naist(word)
    if r:
        return r
    # 失敗
    return {'accent_source': 'unknown'}


# ────────────────────────────────────────────────────────────
# CLI
# ────────────────────────────────────────────────────────────
SMOKE_WORDS = [
    # α2 user 指摘 10 件
    '安い', '七日', '消しゴム', '雪', '二十日', '二日', '母', '夜', '来年', '六日',
    # 2 モーラ尾高型サンプル
    '服', '靴', '池', '川', '山',
    # 頭高型サンプル
    '猫', '雨', '秋', '春', '海',
    # 平板型サンプル（推定）
    'ラジオ', 'テレビ', 'コンピュータ',
    # 拗音含む
    '消しゴム',
    # 撥音含む
    '来年', '万年筆',
]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--smoke', action='store_true', help='smoke 検証（少数語）')
    p.add_argument('--input', default='data/vocab_catalog.json', help='入力 vocab_catalog')
    p.add_argument('--output', default='data/vocab_catalog.json', help='出力（同パスで上書き既定）')
    p.add_argument('--limit', type=int, default=None, help='処理件数上限（debug 用）')
    args = p.parse_args()

    if args.smoke:
        print('=== smoke mode (results -> tmp/google_smoke_ipa/extract_smoke.json) ===')
        results = []
        for w in dict.fromkeys(SMOKE_WORDS):  # dedup preserving order
            r = extract_accent(w)
            r['word'] = w
            results.append(r)
        out = 'tmp/google_smoke_ipa/extract_smoke.json'
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f'wrote {len(results)} entries -> {out}')
        return

    print(f'reading {args.input} ...')
    with open(args.input, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    entries = catalog['entries']
    print(f'  total entries: {len(entries)}')

    counts = {'unidic': 0, 'naist-jdic': 0, 'unknown': 0}
    sample_misses = []
    for i, e in enumerate(entries):
        if args.limit and i >= args.limit:
            break
        word = e.get('word', '')
        if not word:
            continue
        r = extract_accent(word)
        e.update(r)
        counts[r.get('accent_source', 'unknown')] += 1
        if r.get('accent_source') == 'unknown' and len(sample_misses) < 20:
            sample_misses.append(word)
        if (i + 1) % 1000 == 0:
            print(f'  {i+1}/{len(entries)} processed')

    # schema 更新
    catalog.setdefault('_meta', {})
    catalog['_meta']['schemaVersion'] = '1.1'
    catalog['_meta']['accent_added_at'] = '2026-05-24'
    catalog['_meta']['accent_source_counts'] = counts

    # atomic write
    tmp = args.output + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    os.replace(tmp, args.output)
    print(f'wrote {args.output}')
    print(f'  source counts: {counts}')
    if sample_misses:
        print(f'  sample misses (first 20): {sample_misses}')


if __name__ == '__main__':
    main()
