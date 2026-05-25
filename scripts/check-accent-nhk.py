#!/usr/bin/env python3
"""
scripts/check-accent-nhk.py
NHK 発音アクセント辞典 (2版) ベースの CSV と vocab_catalog を突き合わせて
accent 不一致を検出するレポート script。

Source: javdejong/nhk-pronunciation (ACCDB_unicode.csv, ~100K entries, NHK 2版 1998 由来)
CSV path: tmp/nhk_csv/ACCDB_unicode.csv (本 script は外部参照のみ・git には CSV を含めない)

Usage:
  python scripts/check-accent-nhk.py                  # 全 catalog 突合せ → tmp/accent_mismatch_report.json
  python scripts/check-accent-nhk.py --audio-only     # 既 audio 生成済 entry のみ対象
  python scripts/check-accent-nhk.py --only WORD,...  # 特定 word のみ
"""
from __future__ import annotations
import csv, json, sys, argparse, os, re
from pathlib import Path
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
NHK_CSV = ROOT / 'tmp/nhk_csv/ACCDB_unicode.csv'
VOCAB_CATALOG = ROOT / 'data/vocab_catalog.json'
AUDIO_REGISTRY = ROOT / 'data/master_audio_registry.json'
OUT_REPORT = ROOT / 'tmp/accent_mismatch_report.json'

# Small kana that combine with previous (form 1 mora together)
SMALL_KANA = set('ゃゅょぁぃぅぇぉ')

KATAKANA = 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッーヮヰヱヵヶ'
HIRAGANA = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉゃゅょっーゎゐゑゕゖ'
K2H = str.maketrans(KATAKANA, HIRAGANA)

def kata_to_hira(s: str) -> str:
    return s.translate(K2H)


def parse_accent(midashigo1: str, ac: str) -> tuple[int, int]:
    """NHK accent encoding → (accent_type, mora_count).
    midashigo1: katakana (e.g., 'カレンダー')
    ac: pitch pattern (e.g., '2000') — 1=high, 2=high+downstep, 0=low. left-pad with 0s.
    Returns: (accent_type_1indexed_or_0_for_平板, char_count)
    NOTE: NHK ac string uses CHARACTER positions (including ー). We return char-based position.
    """
    strlen = len(midashigo1)
    padded = '0' * (strlen - len(ac)) + ac
    # find first '2' — that's the downstep position (1-indexed)
    for i, c in enumerate(padded):
        if c == '2':
            return (i + 1, strlen)
    return (0, strlen)  # no '2' = 平板


def char_pos_to_yomigana_pos(hira: str, char_pos: int) -> int:
    """Given hiragana and char position (1-indexed) where ! should go,
    return the actual string index for ! insertion, handling small kana correctly.

    NHK char_pos is based on katakana char count (ー counted as 1).
    For yomigana, ! goes after the Nth char including ー and small kana absorbed.

    Simple case: ! goes at position = char_pos (after Nth char of hira).
    But if the char at position char_pos+1 is a small kana (ゃゅょ etc), it belongs
    to the previous mora — we need to include it before !.

    Wait — NHK char position counts each kana char including ー. Small kana (ゃ etc)
    in compound mora are typically NOT separate chars in midashigo1 either... let me
    just use char-based insertion and verify.
    """
    if char_pos <= 0:
        return 0
    pos = min(char_pos, len(hira))
    # If next char is a small kana attaching to current, include it
    while pos < len(hira) and hira[pos] in SMALL_KANA:
        pos += 1
    return pos


def to_yomigana(midashigo1: str, ac: str) -> str:
    accent_type, _ = parse_accent(midashigo1, ac)
    hira = kata_to_hira(midashigo1)
    if accent_type == 0:
        return '^' + hira
    pos = char_pos_to_yomigana_pos(hira, accent_type)
    return '^' + hira[:pos] + '!' + hira[pos:]


def normalize_reading(s: str) -> str:
    """For matching: katakana → hiragana, strip whitespace"""
    if not s:
        return ''
    return kata_to_hira(s).strip()


def build_nhk_index() -> dict:
    """Read NHK CSV and build: {(word, reading_hira): [entries]}"""
    if not NHK_CSV.exists():
        print(f'ERROR: NHK CSV not found at {NHK_CSV}', file=sys.stderr)
        print('Download via: curl -sL -o tmp/nhk_csv/ACCDB_unicode.csv https://raw.githubusercontent.com/javdejong/nhk-pronunciation/master/ACCDB_unicode.csv', file=sys.stderr)
        sys.exit(1)
    idx_by_word = defaultdict(list)
    idx_by_word_reading = defaultdict(list)
    with NHK_CSV.open(encoding='utf-8') as f:
        for row in csv.reader(f):
            if len(row) < 19:
                continue
            kanji = row[7]              # kanjiexpr
            mid = row[5]                # midashigo (katakana form)
            mid1 = row[15]              # midashigo1 (canonical katakana)
            ac = row[18]                # accent pattern
            if not mid1 or not ac:
                continue
            reading_hira = kata_to_hira(mid)
            yomigana = to_yomigana(mid1, ac)
            accent_type, mora = parse_accent(mid1, ac)
            entry = {
                'kanji': kanji,
                'reading': reading_hira,
                'midashigo1': mid1,
                'ac': ac,
                'accent_type': accent_type,
                'mora': mora,
                'yomigana': yomigana,
                'wav': row[2],
                'full_entry': row[8],
            }
            idx_by_word[kanji].append(entry)
            idx_by_word_reading[(kanji, reading_hira)].append(entry)
    return {'by_word': dict(idx_by_word), 'by_word_reading': dict(idx_by_word_reading)}


def lookup(idx: dict, word: str, reading: str) -> list:
    """Lookup with fallback: exact (word, reading) → word only"""
    reading_n = normalize_reading(reading)
    hits = idx['by_word_reading'].get((word, reading_n), [])
    if hits:
        return hits
    # Fallback: word match only (may have multiple readings)
    return idx['by_word'].get(word, [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio-only', action='store_true', help='Only check entries that have an audio file in registry')
    ap.add_argument('--only', help='Comma-separated word list to limit to')
    ap.add_argument('--out', default=str(OUT_REPORT))
    args = ap.parse_args()

    print('Loading NHK CSV index...', file=sys.stderr)
    idx = build_nhk_index()
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
        # Map registry IDs (word_X) to words for filtering
        for k in regentries.keys():
            if k.startswith('word_'):
                audio_ids.add(k[5:])  # the word part after 'word_'

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
        'matches': [],         # accents agree
        'mismatches': [],      # accents disagree
        'not_in_nhk': [],      # NHK doesn't have it
        'multiple_nhk_readings': [],  # NHK has multiple readings, none matched exactly
        'no_catalog_accent': [],  # catalog accent_yomigana is null/unknown
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

        # Exact reading match preferred
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

    # Summary
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
