#!/usr/bin/env python3
# tmp/unidic_poc.py
# Phase α3 第 1 タスク：UniDic 切替 PoC
#
# 目的：α2 で同梱済の sudachipy + sudachidict_core からアクセント情報が
# 取り出せるか確認。取れない場合は fugashi + unidic-lite を pip install して
# そちらで確認する。
#
# 出力：各単語の (surface, reading, accent_type, accent_source) を JSON で
# tmp/google_smoke_ipa/unidic_poc.json に書き出す。

import json
import os
import sys

# 出力先準備
OUT_PATH = 'tmp/google_smoke_ipa/unidic_poc.json'
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

# 検証単語：これまでの 10 件 + 「雪」の頭高/尾高/平板を比較するため数件追加
WORDS = [
    '安い', '七日', '消しゴム', '雪', '二十日', '二日', '母', '夜', '来年', '六日',
    '服', '靴', '池', '川', '山', '猫', '雨', '秋', '春', '海',
]

results = {'sudachipy': None, 'fugashi_unidic': None, 'naist_jdic_compare': None}

# ────────────────────────────────────────────────────────────
# 1. sudachipy + sudachidict_core でアクセント取れるか
# ────────────────────────────────────────────────────────────
try:
    from sudachipy import dictionary, tokenizer
    tok = dictionary.Dictionary().create()
    mode = tokenizer.Tokenizer.SplitMode.C
    sudachi_results = []
    sample_attrs_dumped = False
    for w in WORDS:
        morphs = list(tok.tokenize(w, mode))
        entry = {'word': w, 'morphs': []}
        for m in morphs:
            morph_data = {
                'surface': m.surface(),
                'reading': m.reading_form(),
                'pos': list(m.part_of_speech()),
                'normalized': m.normalized_form(),
                'dictionary_form': m.dictionary_form(),
            }
            # sudachi の Morpheme オブジェクトに accent 関連メソッドがあるか dump
            if not sample_attrs_dumped:
                attrs = [a for a in dir(m) if not a.startswith('_')]
                morph_data['_all_methods'] = attrs
                sample_attrs_dumped = True
            entry['morphs'].append(morph_data)
        sudachi_results.append(entry)
    results['sudachipy'] = {
        'status': 'ok',
        'samples': sudachi_results,
        'note': 'sudachi の Morpheme に accent 情報があるか _all_methods を確認',
    }
except Exception as e:
    results['sudachipy'] = {'status': 'error', 'error': str(e)}

# ────────────────────────────────────────────────────────────
# 2. fugashi + unidic-lite (アクセント情報が含まれる方の正攻法)
#    ※ unidic-lite には accent カラムがあるはず。試す。
# ────────────────────────────────────────────────────────────
try:
    import fugashi
    try:
        import unidic_lite
        tagger = fugashi.Tagger(f'-d "{unidic_lite.DICDIR}"')
        unidic_lite_available = True
    except ImportError:
        # unidic-lite ない場合、デフォルト辞書で
        tagger = fugashi.Tagger()
        unidic_lite_available = False

    fugashi_results = []
    for w in WORDS:
        nodes = tagger(w)
        entry = {'word': w, 'nodes': []}
        for n in nodes:
            node_data = {
                'surface': n.surface,
                'feature': str(n.feature),
                'feature_dict': dict(n.feature._asdict()) if hasattr(n.feature, '_asdict') else None,
            }
            entry['nodes'].append(node_data)
        fugashi_results.append(entry)
    results['fugashi_unidic'] = {
        'status': 'ok',
        'unidic_lite': unidic_lite_available,
        'samples': fugashi_results,
    }
except ImportError as e:
    results['fugashi_unidic'] = {'status': 'not_installed', 'error': str(e),
                                  'next_step': 'pip install fugashi unidic-lite'}
except Exception as e:
    results['fugashi_unidic'] = {'status': 'error', 'error': str(e)}

# ────────────────────────────────────────────────────────────
# 3. naist-jdic (pyopenjtalk-plus) 比較
# ────────────────────────────────────────────────────────────
try:
    import pyopenjtalk
    import re
    naist_results = []
    for w in WORDS:
        labels = pyopenjtalk.extract_fullcontext(w)
        mora_count = accent_type = None
        for lab in labels:
            m = re.search(r'/F:(\d+)_(\d+)#', lab)
            if m:
                mora_count = int(m.group(1))
                accent_type = int(m.group(2))
                break
        naist_results.append({
            'word': w, 'mora_count': mora_count, 'accent_type': accent_type,
        })
    results['naist_jdic_compare'] = {'status': 'ok', 'samples': naist_results}
except Exception as e:
    results['naist_jdic_compare'] = {'status': 'error', 'error': str(e)}

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f'wrote {OUT_PATH}')

# 簡潔サマリ (stdout は ASCII safe で)
print('---')
for src, r in results.items():
    if r:
        st = r.get('status', '?')
        print(f'  {src}: {st}')
        if src == 'sudachipy' and st == 'ok':
            attrs = r['samples'][0]['morphs'][0].get('_all_methods', [])
            accent_attrs = [a for a in attrs if 'accent' in a.lower() or 'pitch' in a.lower()]
            print(f'    accent/pitch-related methods: {accent_attrs or "(none found)"}')
        if src == 'fugashi_unidic' and st == 'ok':
            sample = r['samples'][0]['nodes']
            if sample:
                fd = sample[0].get('feature_dict') or {}
                accent_keys = [k for k in fd.keys() if 'accent' in k.lower() or 'aType' in k or 'a_type' in k.lower()]
                print(f'    accent-related feature keys: {accent_keys or "(none in first sample)"}')
                # 最初の単語の最初の node の features 全部表示
                if fd:
                    print(f'    all feature keys: {list(fd.keys())}')
