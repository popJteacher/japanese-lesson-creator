#!/usr/bin/env python3
"""
scripts/scrape-ojad.py
OJAD (Online Japanese Accent Dictionary, https://www.gavo.t.u-tokyo.ac.jp/ojad/) を
polite rate で scrape し、accent 情報を data/external/ojad_cache.json に蓄積する。

Cache format:
  {
    "metadata": {
      "scraped_at": ISO,
      "ojad_url_template": "...",
      "entry_count": N,
    },
    "entries": {
      "<word>": {
        "scraped_at": ISO,
        "url": "https://...",
        "status": "ok" | "not_found" | "http_error" | "parse_error",
        "results": [
          {
            "midashi_word": "金曜日",        # OJAD lemma (検索 word と異なる場合あり)
            "kana": "きんようび",            # mora 順の連結
            "morae": ["き", "ん", "よ", "う", "び"],  # 各 mora の char
            "mora_count": 5,
            "accent_pos": 3,                # 1-indexed (0 = 平板)
            "yomigana": "^きんよ!うび",      # 我々の表記法に変換
          },
          ...
        ]
      }
    }
  }

Usage:
  # Audio 対象 word のみ scrape (459 件)
  python scripts/scrape-ojad.py --audio-only
  # 特定 word
  python scripts/scrape-ojad.py --only WORD1,WORD2
  # 全 catalog (17k, polite rate で 2-3 時間)
  python scripts/scrape-ojad.py --all
  # cache 既存 entry を refresh
  python scripts/scrape-ojad.py --audio-only --refresh
"""
from __future__ import annotations
import argparse, json, sys, time, re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data/external/ojad_cache.json'
VOCAB_CATALOG = ROOT / 'data/vocab_catalog.json'
AUDIO_REGISTRY = ROOT / 'data/master_audio_registry.json'

OJAD_URL = 'https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:{word}'
USER_AGENT = 'japanese-lesson-creator (educational accent research; contact via Claude Code session)'
SLEEP_BETWEEN = 0.6  # polite rate, 0.5+ per design doc
TIMEOUT = 30


def parse_accented_word(span) -> dict | None:
    """Parse one <span class="accented_word"> and return {kana, morae, mora_count, accent_pos, yomigana}.

    accent_pos: 0 = 平板, N>=1 = drop after Nth mora (1-indexed from start).
    """
    mora_spans = span.find_all('span', class_=re.compile(r'\bmola_-\d+\b'))
    if not mora_spans:
        return None
    morae: list[str] = []
    accent_pos_from_end: int | None = None
    total = len(mora_spans)
    for s in mora_spans:
        chars = [c.get_text() for c in s.find_all('span', class_='char')]
        mora_kana = ''.join(chars)
        morae.append(mora_kana)
        cls = s.get('class', [])
        if 'accent_top' in cls:
            for c in cls:
                m = re.match(r'mola_(-?\d+)$', c)
                if m:
                    accent_pos_from_end = abs(int(m.group(1)))
                    break
    accent_pos = 0 if accent_pos_from_end is None else (total - accent_pos_from_end + 1)
    yomigana = to_yomigana(morae, accent_pos)
    return {
        'kana': ''.join(morae),
        'morae': morae,
        'mora_count': total,
        'accent_pos': accent_pos,
        'yomigana': yomigana,
    }


def to_yomigana(morae: list[str], accent_pos: int) -> str:
    """Convert (morae, accent_pos) to our yomigana SSML notation.
    type 0 平板:   ^あいうえお
    type N >= 1:  ^XXX!YYY  (! goes after the Nth mora)
    """
    if accent_pos <= 0:
        return '^' + ''.join(morae)
    return '^' + ''.join(morae[:accent_pos]) + '!' + ''.join(morae[accent_pos:])


def parse_search_html(html: str) -> list[dict]:
    """Parse OJAD search results page. Return list of dictionary-form entries.

    Each search hit is one <tr> containing:
      <td class="midashi"> — has midashi_word (lemma)
      <td class="katsuyo katsuyo_jisho_js"> — dictionary-form accented_word
      <td class="katsuyo katsuyo_masu_js"> — masu-form (verbs)
      ... etc
    For nouns/adjectives only katsuyo_jisho_js is populated.
    """
    soup = BeautifulSoup(html, 'html.parser')
    out = []
    # find each row containing a td.midashi (the search result rows)
    for midashi_td in soup.find_all('td', class_='midashi'):
        row = midashi_td.find_parent('tr')
        if row is None:
            continue
        word_p = midashi_td.find('p', class_='midashi_word')
        midashi_word = word_p.get_text(strip=True) if word_p else None
        # Look for the jisho (dictionary) form accented_word in the same row
        jisho_td = row.find('td', class_=re.compile(r'\bkatsuyo_jisho_js\b'))
        if jisho_td is None:
            continue
        aw = jisho_td.find('span', class_='accented_word')
        if aw is None:
            continue
        parsed = parse_accented_word(aw)
        if not parsed:
            continue
        parsed['midashi_word'] = midashi_word
        out.append(parsed)
    return out


def scrape_one(word: str, session: requests.Session) -> dict:
    """Fetch + parse single word. Return result dict (status + results)."""
    url = OJAD_URL.format(word=quote(word, safe=''))
    try:
        r = session.get(url, timeout=TIMEOUT, headers={'User-Agent': USER_AGENT})
    except requests.RequestException as e:
        return {'status': 'http_error', 'error': str(e), 'url': url}
    if r.status_code != 200:
        return {'status': 'http_error', 'status_code': r.status_code, 'url': url}
    try:
        results = parse_search_html(r.text)
    except Exception as e:
        return {'status': 'parse_error', 'error': str(e), 'url': url}
    return {
        'status': 'ok' if results else 'not_found',
        'url': url,
        'results': results,
    }


def load_cache() -> dict:
    if CACHE.exists():
        with CACHE.open(encoding='utf-8') as f:
            return json.load(f)
    return {
        'metadata': {
            'created_at': datetime.now(timezone.utc).isoformat(),
            'ojad_url_template': OJAD_URL,
        },
        'entries': {},
    }


def save_cache(cache: dict):
    cache['metadata']['scraped_at'] = datetime.now(timezone.utc).isoformat()
    cache['metadata']['entry_count'] = len(cache['entries'])
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE.open('w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def select_words(args) -> list[str]:
    if args.only:
        return [w.strip() for w in args.only.split(',') if w.strip()]
    with VOCAB_CATALOG.open(encoding='utf-8') as f:
        catalog = json.load(f)
    entries = catalog.get('entries', catalog)
    if args.audio_only:
        with AUDIO_REGISTRY.open(encoding='utf-8') as f:
            reg = json.load(f)
        reg_entries = reg.get('entries', reg)
        audio_words = {k[5:] for k in reg_entries.keys() if k.startswith('word_')}
        words = sorted({e['word'] for e in entries if e.get('word') in audio_words})
    elif args.all:
        words = sorted({e['word'] for e in entries if e.get('word')})
    else:
        print('ERROR: specify one of --audio-only / --all / --only', file=sys.stderr)
        sys.exit(1)
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio-only', action='store_true', help='Only scrape words that have audio in registry')
    ap.add_argument('--all', action='store_true', help='Scrape all catalog words (~17k, 2-3 hr)')
    ap.add_argument('--only', help='Comma-separated word list')
    ap.add_argument('--refresh', action='store_true', help='Re-scrape even if cached')
    ap.add_argument('--limit', type=int, default=0, help='Stop after N new fetches (0=unlimited)')
    ap.add_argument('--sleep', type=float, default=SLEEP_BETWEEN, help=f'Sleep between requests (default {SLEEP_BETWEEN}s)')
    args = ap.parse_args()

    words = select_words(args)
    cache = load_cache()
    entries = cache['entries']

    todo = [w for w in words if args.refresh or w not in entries]
    print(f'Total words: {len(words)} | Already cached: {len(words) - len(todo)} | To fetch: {len(todo)}', file=sys.stderr)
    if args.limit > 0:
        todo = todo[:args.limit]
        print(f'Limiting to first {args.limit}', file=sys.stderr)

    session = requests.Session()
    n_ok = n_notfound = n_err = 0
    started = time.time()
    try:
        for i, word in enumerate(todo, 1):
            res = scrape_one(word, session)
            res['scraped_at'] = datetime.now(timezone.utc).isoformat()
            entries[word] = res
            if res['status'] == 'ok':
                n_ok += 1
                tag = f'{len(res["results"])} entries'
            elif res['status'] == 'not_found':
                n_notfound += 1
                tag = 'not found'
            else:
                n_err += 1
                tag = f'ERROR {res.get("error") or res.get("status_code")}'
            print(f'[{i:4d}/{len(todo)}] {word!r}: {tag}', file=sys.stderr)
            # Save every 25 to survive interruption
            if i % 25 == 0:
                save_cache(cache)
            time.sleep(args.sleep)
    except KeyboardInterrupt:
        print('\nInterrupted — saving cache...', file=sys.stderr)
    finally:
        save_cache(cache)
    elapsed = time.time() - started
    print(f'\n=== Summary ===', file=sys.stderr)
    print(f'  ok: {n_ok}  not_found: {n_notfound}  errors: {n_err}', file=sys.stderr)
    print(f'  elapsed: {elapsed:.1f}s ({len(todo)/max(elapsed,1):.2f} req/s)', file=sys.stderr)
    print(f'  cache: {CACHE} ({len(entries)} total entries)', file=sys.stderr)


if __name__ == '__main__':
    main()
