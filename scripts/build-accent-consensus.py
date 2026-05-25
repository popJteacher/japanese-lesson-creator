#!/usr/bin/env python3
"""
scripts/build-accent-consensus.py
Catalog の accent を 3 ソース (UniDic / NHK / OJAD) consensus で底上げする。

ソース:
  UniDic: catalog['accent_yomigana'] (accent_source='unidic' or 'naist-jdic')
  NHK:    NHK CSV (javdejong/nhk-pronunciation, ~100k entries)
  OJAD:   data/external/ojad_cache.json (scripts/scrape-ojad.py で構築)

Consensus 規則 (normalized 比較):
  全 3 一致              → high, no change
  NHK == OJAD != UniDic  → high, override (NHK 値採用)
  UniDic == X != Y       → med,  keep UniDic, flag for review
  全 3 異なる            → low,  keep UniDic, flag for review
  NHK のみ取れる         → med,  override (NHK 値採用)
  OJAD のみ取れる        → med,  override (OJAD 値採用)
  どちらも取れない       → none (UniDic only), confidence='low'

Usage:
  python scripts/build-accent-consensus.py --dry-run        # report のみ
  python scripts/build-accent-consensus.py --apply          # catalog 更新も実行
  python scripts/build-accent-consensus.py --audio-only     # audio 対象のみ
  python scripts/build-accent-consensus.py --only WORD,...  # 特定 word
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib.nhk_lookup import build_index as build_nhk_index, lookup as nhk_lookup, normalize_reading
from scripts.lib.ojad_lookup import load_cache as load_ojad_cache, lookup_by_reading as ojad_lookup
from scripts.lib.yomigana_normalize import normalize_for_match

ROOT = Path(__file__).resolve().parents[1]
VOCAB_CATALOG = ROOT / 'data/vocab_catalog.json'
AUDIO_REGISTRY = ROOT / 'data/master_audio_registry.json'
OUT_REPORT = ROOT / 'tmp/consensus_report.json'


def pick_best(hits: list, key_func) -> dict | None:
    """multi-hit から最頻 yomigana を選択（同票なら最初）"""
    if not hits:
        return None
    cnt = Counter(key_func(h) for h in hits if key_func(h))
    if not cnt:
        return None
    best_val, _ = cnt.most_common(1)[0]
    for h in hits:
        if key_func(h) == best_val:
            return h
    return None


def _plain_kana(yomi: str) -> str:
    """yomigana から ^/! を除去した plain kana"""
    return (yomi or '').replace('^', '').replace('!', '')


def select_raw_value(sources: dict, primary: str, catalog_reading: str | None,
                     prefer_external: bool = False) -> tuple[str, str]:
    """consensus 一致 (normalize 後) した複数 source から実際に保存する raw 値を選択。

    優先順:
      prefer_external=True (= change を推奨している場合):
        1. catalog reading と plain kana 一致する外部ソース (OJAD > NHK)
        2. 外部ソース (OJAD > NHK)
        3. primary
      prefer_external=False (= UniDic を維持する場合):
        1. catalog reading と plain kana 一致する任意ソース (OJAD > NHK > UniDic)
        2. primary
    Returns: (value, picked_source)
    """
    if prefer_external:
        if catalog_reading:
            for src in ('ojad', 'nhk'):
                if src in sources and _plain_kana(sources[src]) == catalog_reading:
                    return sources[src], src
        for src in ('ojad', 'nhk'):
            if src in sources:
                return sources[src], src
        if primary in sources:
            return sources[primary], primary
    else:
        if catalog_reading:
            for src in ('ojad', 'nhk', 'unidic'):
                if src in sources and _plain_kana(sources[src]) == catalog_reading:
                    return sources[src], src
        if primary in sources:
            return sources[primary], primary
    # Fallback: any available
    for src in ('nhk', 'ojad', 'unidic'):
        if src in sources:
            return sources[src], src
    return '', ''


def compute_consensus(unidic: str | None, nhk_val: str | None, ojad_val: str | None,
                      override: str | None, catalog_reading: str | None = None) -> dict:
    """3 ソースから consensus を計算。
    Returns: {
      'value': str | None,         # 採用 yomigana (None = no change recommended)
      'sources_present': [str],    # ['unidic', 'nhk', 'ojad'] 揃った分
      'normalized': {src: norm},   # 比較用 normalized form
      'agreement': str,            # 'all3' / 'nhk+ojad' / 'unidic+nhk' / ... / 'none'
      'confidence': 'high' | 'med' | 'low',
      'recommend_change': bool,
      'reason': str,
    }
    """
    sources = {}
    if unidic:
        sources['unidic'] = unidic
    if nhk_val:
        sources['nhk'] = nhk_val
    if ojad_val:
        sources['ojad'] = ojad_val

    norm = {k: normalize_for_match(v) for k, v in sources.items()}

    def mk(value: str | None, picked: str, agreement: str, confidence: str,
           recommend_change: bool, reason: str) -> dict:
        return {
            'value': value, 'picked_source': picked,
            'sources_present': list(sources.keys()),
            'normalized': norm,
            'agreement': agreement, 'confidence': confidence,
            'recommend_change': recommend_change, 'reason': reason,
        }

    # No external sources → keep UniDic, low confidence
    if 'nhk' not in sources and 'ojad' not in sources:
        return mk(unidic, 'unidic', 'unidic_only', 'low', False, 'No NHK/OJAD data')

    # All 3 sources present
    if 'unidic' in sources and 'nhk' in sources and 'ojad' in sources:
        u, n, o = norm['unidic'], norm['nhk'], norm['ojad']
        if u == n == o:
            v, src = select_raw_value(sources, 'unidic', catalog_reading)
            return mk(v, src, 'all3', 'high', False, '3 sources agree')
        if n == o and n != u:
            v, src = select_raw_value(sources, 'nhk', catalog_reading, prefer_external=True)
            return mk(v, src, 'nhk+ojad', 'high', True, f'NHK == OJAD overrides UniDic (raw from {src})')
        if u == n and u != o:
            v, src = select_raw_value(sources, 'unidic', catalog_reading)
            return mk(v, src, 'unidic+nhk', 'med', False, 'UniDic == NHK, OJAD disagrees — keep UniDic, flag for review')
        if u == o and u != n:
            v, src = select_raw_value(sources, 'unidic', catalog_reading)
            return mk(v, src, 'unidic+ojad', 'med', False, 'UniDic == OJAD, NHK disagrees — keep UniDic, flag for review')
        v, src = select_raw_value(sources, 'unidic', catalog_reading)
        return mk(v, src, 'all_disagree', 'low', False, '3 sources disagree — keep UniDic, manual review')

    # 2 sources: UniDic + (NHK or OJAD)
    if 'unidic' in sources and 'nhk' in sources:
        if norm['unidic'] == norm['nhk']:
            v, src = select_raw_value(sources, 'unidic', catalog_reading)
            return mk(v, src, 'unidic+nhk', 'med', False, 'UniDic == NHK (no OJAD data)')
        v, src = select_raw_value(sources, 'nhk', catalog_reading, prefer_external=True)
        return mk(v, src, 'nhk_overrides_unidic', 'med', True, f'NHK overrides UniDic (raw from {src})')
    if 'unidic' in sources and 'ojad' in sources:
        if norm['unidic'] == norm['ojad']:
            v, src = select_raw_value(sources, 'unidic', catalog_reading)
            return mk(v, src, 'unidic+ojad', 'med', False, 'UniDic == OJAD (no NHK data)')
        v, src = select_raw_value(sources, 'ojad', catalog_reading, prefer_external=True)
        return mk(v, src, 'ojad_overrides_unidic', 'med', True, f'OJAD overrides UniDic (raw from {src})')
    if 'nhk' in sources and 'ojad' in sources:
        if norm['nhk'] == norm['ojad']:
            v, src = select_raw_value(sources, 'nhk', catalog_reading, prefer_external=True)
            return mk(v, src, 'nhk+ojad_no_unidic', 'med', True, f'No UniDic, NHK == OJAD (raw from {src})')
        v, src = select_raw_value(sources, 'nhk', catalog_reading, prefer_external=True)
        return mk(v, src, 'nhk_ojad_disagree', 'low', True, 'No UniDic, NHK/OJAD disagree — adopt NHK with low conf')

    # Only NHK or only OJAD
    if 'nhk' in sources:
        return mk(sources['nhk'], 'nhk', 'nhk_only', 'med', True, 'NHK only')
    if 'ojad' in sources:
        return mk(sources['ojad'], 'ojad', 'ojad_only', 'med', True, 'OJAD only')

    return mk(None, '', 'none', 'low', False, 'no data')


def get_nhk_yomigana(nhk_idx, word: str, reading: str | None) -> str | None:
    """NHK lookup → best yomigana。strict: reading 完全一致のみ採用。
    catalog reading と NHK reading が異なる entry を採用する fallback は撤廃
    (例: 国(こく) で NHK くに entry を採るのを防ぐ)。

    例外として「は ↔ わ」(挨拶のひらがな表記差) と「カタカナ ↔ ひらがな」は同視。
    """
    if not reading:
        return None
    reading_n = normalize_reading(reading)
    # NHK CSV は hiragana keyed. lookup() が (word, reading) 完全一致を返す
    hits = nhk_lookup(nhk_idx, word, reading)
    if not hits:
        return None
    # 上位互換チェック: hit の reading が catalog reading と「は↔わ swap or 完全一致」のみ採用
    reading_norm = normalize_for_match(reading_n)
    valid = []
    for h in hits:
        h_reading = h.get('reading', '')
        if h_reading == reading_n:
            valid.append(h)
            continue
        # Allow は↔わ swap (こんにちは → こんにちわ)
        if h_reading.replace('わ', 'は') == reading_n or h_reading.replace('は', 'わ') == reading_n:
            valid.append(h)
            continue
        # Allow long-vowel normalize equality (おお ↔ おう)
        if normalize_for_match(h_reading) == reading_norm:
            valid.append(h)
            continue
    if not valid:
        return None
    best = pick_best(valid, lambda h: h.get('yomigana'))
    return best['yomigana'] if best else None


def get_ojad_yomigana(ojad_cache, word: str, reading: str | None) -> str | None:
    """OJAD cache lookup → best yomigana。strict (kana 完全一致のみ)。
    OJAD 検索が無関係な lemma を返すケース (例: 十六→十六分) を排除する。
    """
    reading_n = normalize_reading(reading or '')
    hits = ojad_lookup(ojad_cache, word, reading_n, strict=True)
    if not hits:
        return None
    return hits[0]['yomigana']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', default=True, help='Report only (default)')
    ap.add_argument('--apply', action='store_true', help='Write changes to catalog')
    ap.add_argument('--audio-only', action='store_true', help='Only consider entries with audio in registry')
    ap.add_argument('--only', help='Comma-separated word list')
    ap.add_argument('--out', default=str(OUT_REPORT))
    args = ap.parse_args()

    if args.apply:
        args.dry_run = False

    print('Loading NHK index...', file=sys.stderr)
    nhk_idx = build_nhk_index()
    print(f'  by_word: {len(nhk_idx["by_word"])} kanji', file=sys.stderr)

    print('Loading OJAD cache...', file=sys.stderr)
    ojad_cache = load_ojad_cache()
    print(f'  entries: {len(ojad_cache.get("entries", {}))}', file=sys.stderr)

    print('Loading vocab_catalog...', file=sys.stderr)
    with VOCAB_CATALOG.open(encoding='utf-8') as f:
        catalog = json.load(f)
    entries = catalog.get('entries', catalog)

    audio_words = None
    if args.audio_only:
        with AUDIO_REGISTRY.open(encoding='utf-8') as f:
            reg = json.load(f)
        reg_entries = reg.get('entries', reg)
        audio_words = {k[5:] for k in reg_entries.keys() if k.startswith('word_')}

    only_words = None
    if args.only:
        only_words = set(args.only.split(','))

    report = {
        'metadata': {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'catalog_total': len(entries),
            'audio_only': args.audio_only,
            'apply': args.apply,
        },
        'changes_high': [],         # high conf → recommend apply
        'changes_med': [],          # med conf → review then apply
        'no_change': [],            # sources agree, no change needed
        'review_low': [],           # 3 sources disagree
        'unidic_only': [],          # no NHK/OJAD data
    }

    counters = Counter()
    apply_changes = 0

    for e in entries:
        word = e.get('word', '')
        if not word:
            continue
        if only_words and word not in only_words:
            continue
        if audio_words is not None and word not in audio_words:
            continue

        reading = e.get('reading') or e.get('reading_kana')
        unidic_val = e.get('accent_yomigana')
        manual_override = e.get('accent_override')

        nhk_val = get_nhk_yomigana(nhk_idx, word, reading)
        ojad_val = get_ojad_yomigana(ojad_cache, word, reading)

        cons = compute_consensus(unidic_val, nhk_val, ojad_val, manual_override, catalog_reading=normalize_reading(reading or ''))
        counters[cons['agreement']] += 1
        counters[f'conf:{cons["confidence"]}'] += 1

        record = {
            'word': word,
            'reading': reading,
            'unidic': unidic_val,
            'nhk': nhk_val,
            'ojad': ojad_val,
            'manual_override': manual_override,
            'consensus_value': cons['value'],
            'picked_source': cons.get('picked_source', ''),
            'agreement': cons['agreement'],
            'confidence': cons['confidence'],
            'reason': cons['reason'],
        }

        # Routing
        if not cons['recommend_change']:
            if cons['agreement'] == 'all3':
                report['no_change'].append(record)
            elif cons['agreement'] == 'unidic_only':
                report['unidic_only'].append(record)
            elif cons['agreement'] in ('unidic+nhk', 'unidic+ojad'):
                report['no_change'].append(record)
            else:
                report['review_low'].append(record)
        else:
            if cons['confidence'] == 'high':
                report['changes_high'].append(record)
            else:
                report['changes_med'].append(record)

        # Apply
        if args.apply and cons['recommend_change'] and cons['confidence'] in ('high', 'med'):
            # Skip if manual override is present (manual beats consensus)
            if manual_override:
                continue
            e['accent_consensus_override'] = cons['value']
            e['accent_consensus_meta'] = {
                'source': 'build-accent-consensus',
                'addedAt': datetime.now(timezone.utc).date().isoformat(),
                'sources_present': cons['sources_present'],
                'picked_source': cons.get('picked_source', ''),
                'agreement': cons['agreement'],
                'confidence': cons['confidence'],
                'reason': cons['reason'],
                'unidic_previous': unidic_val,
                'nhk_value': nhk_val,
                'ojad_value': ojad_val,
            }
            apply_changes += 1

    # Summary
    m = report['metadata']
    m['agreement_counts'] = dict(counters)
    m['changes_high'] = len(report['changes_high'])
    m['changes_med'] = len(report['changes_med'])
    m['no_change'] = len(report['no_change'])
    m['review_low'] = len(report['review_low'])
    m['unidic_only'] = len(report['unidic_only'])
    if args.apply:
        m['applied_changes'] = apply_changes

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    if args.apply:
        with VOCAB_CATALOG.open('w', encoding='utf-8') as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
        print(f'\nCatalog updated: {apply_changes} entries got accent_consensus_override', file=sys.stderr)

    print('\n=== Summary ===', file=sys.stderr)
    for k in ['changes_high', 'changes_med', 'no_change', 'review_low', 'unidic_only']:
        print(f'  {k}: {m[k]}', file=sys.stderr)
    print(f'\nReport: {args.out}', file=sys.stderr)


if __name__ == '__main__':
    main()
