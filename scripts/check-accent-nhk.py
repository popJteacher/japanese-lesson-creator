#!/usr/bin/env python3
"""
scripts/check-accent-nhk.py
NHK 発音アクセント辞典 (2版) ベースの CSV と vocab_catalog を突き合わせて
accent 不一致を検出するレポート script。

NHK lookup ロジックは scripts/lib/nhk_lookup.py に切り出して再利用可能化済 (α5 延長)。
本 script はその CLI wrapper として機能する。

Source: javdejong/nhk-pronunciation (ACCDB_unicode.csv, ~100K entries, NHK 2版 1998 由来)
CSV path: tmp/nhk_csv/ACCDB_unicode.csv (本 script は外部参照のみ・git には CSV を含めない)

Usage:
  python scripts/check-accent-nhk.py                  # 全 catalog 突合せ → tmp/accent_mismatch_report.json
  python scripts/check-accent-nhk.py --audio-only     # 既 audio 生成済 entry のみ対象
  python scripts/check-accent-nhk.py --only WORD,...  # 特定 word のみ
"""
from __future__ import annotations
import json, sys, argparse
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib.nhk_lookup import build_index, lookup, normalize_reading

ROOT = Path(__file__).resolve().parents[1]
VOCAB_CATALOG = ROOT / 'data/vocab_catalog.json'
AUDIO_REGISTRY = ROOT / 'data/master_audio_registry.json'
OUT_REPORT = ROOT / 'tmp/accent_mismatch_report.json'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio-only', action='store_true', help='Only check entries that have an audio file in registry')
    ap.add_argument('--only', help='Comma-separated word list to limit to')
    ap.add_argument('--out', default=str(OUT_REPORT))
    args = ap.parse_args()

    print('Loading NHK CSV index...', file=sys.stderr)
    idx = build_index()
    print(f'  by_word: {len(idx["by_word"])} unique kanji, by_word_reading: {len(idx["by_word_reading"])} pairs', file=sys.stderr)

    print('Loading vocab_catalog...', file=sys.stderr)
    with VOCAB_CATALOG.open(encoding='utf-8') as f:
        catalog = json.load(f)
    entries = catalog.get('entries', catalog)

    audio_ids = None
    if args.audio_only:
        with AUDIO_REGISTRY.open(encoding='utf-8') as f:
            reg = json.load(f)
        regentries = reg.get('entries', reg)
        audio_ids = set()
        for k in regentries.keys():
            if k.startswith('word_'):
                audio_ids.add(k[5:])

    only_words = None
    if args.only:
        only_words = set(args.only.split(','))

    report = {
        'metadata': {
            'source': 'javdejong/nhk-pronunciation (NHK 2版 1998 由来 CSV)',
            'source_url': 'https://github.com/javdejong/nhk-pronunciation',
            'generated_at': __import__('datetime').datetime.now().isoformat(),
            'catalog_entries_total': len(entries),
            'audio_only': args.audio_only,
        },
        'matches': [],
        'mismatches': [],
        'not_in_nhk': [],
        'multiple_nhk_readings': [],
        'no_catalog_accent': [],
    }

    for e in entries:
        word = e.get('word', '')
        reading = e.get('reading', '')
        if not word:
            continue
        if only_words and word not in only_words:
            continue
        if audio_ids is not None and word not in audio_ids:
            continue

        cat_yomigana = e.get('accent_override') or e.get('accent_yomigana')
        cat_source = e.get('accent_source', '?')

        nhk_hits = lookup(idx, word, reading)
        if not nhk_hits:
            report['not_in_nhk'].append({
                'word': word, 'reading': reading,
                'cat_yomigana': cat_yomigana, 'cat_source': cat_source,
            })
            continue

        reading_n = normalize_reading(reading)
        exact = [h for h in nhk_hits if h['reading'] == reading_n]
        if not exact and len(nhk_hits) > 1:
            report['multiple_nhk_readings'].append({
                'word': word, 'reading': reading,
                'cat_yomigana': cat_yomigana, 'cat_source': cat_source,
                'nhk_readings': [{'reading': h['reading'], 'yomigana': h['yomigana']} for h in nhk_hits[:5]],
            })
            continue

        target_hits = exact if exact else nhk_hits
        nhk_yomiganas = [h['yomigana'] for h in target_hits]

        if not cat_yomigana:
            report['no_catalog_accent'].append({
                'word': word, 'reading': reading,
                'cat_source': cat_source,
                'nhk_yomigana': nhk_yomiganas[0],
                'nhk_alternates': nhk_yomiganas[1:] if len(nhk_yomiganas) > 1 else [],
            })
            continue

        if cat_yomigana in nhk_yomiganas:
            report['matches'].append({
                'word': word, 'reading': reading, 'yomigana': cat_yomigana,
            })
        else:
            report['mismatches'].append({
                'word': word, 'reading': reading,
                'cat_yomigana': cat_yomigana, 'cat_source': cat_source,
                'cat_is_override': bool(e.get('accent_override')),
                'nhk_yomigana': nhk_yomiganas[0],
                'nhk_alternates': nhk_yomiganas[1:] if len(nhk_yomiganas) > 1 else [],
            })

    m = report['metadata']
    m['matches'] = len(report['matches'])
    m['mismatches'] = len(report['mismatches'])
    m['not_in_nhk'] = len(report['not_in_nhk'])
    m['multiple_nhk_readings'] = len(report['multiple_nhk_readings'])
    m['no_catalog_accent'] = len(report['no_catalog_accent'])
    total_checked = m['matches'] + m['mismatches']
    m['match_rate'] = f'{m["matches"]}/{total_checked} ({100*m["matches"]/total_checked:.1f}%)' if total_checked else 'n/a'

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f'\n=== Summary ===')
    for k in ['matches', 'mismatches', 'not_in_nhk', 'multiple_nhk_readings', 'no_catalog_accent']:
        print(f'  {k}: {m[k]}')
    print(f'  match rate: {m["match_rate"]}')
    print(f'\nReport written to: {args.out}')


if __name__ == '__main__':
    main()
