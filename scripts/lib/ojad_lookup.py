"""
scripts/lib/ojad_lookup.py
OJAD cache (data/external/ojad_cache.json) からの lookup module。

Cache は scripts/scrape-ojad.py で構築。本 module は読み出しのみ提供。

Usage:
    from scripts.lib.ojad_lookup import load_cache, lookup_by_word, lookup_by_reading

    cache = load_cache()
    entries = lookup_by_word(cache, '寝る')        # 全 result
    entries = lookup_by_reading(cache, '寝る', 'ねる')  # reading 一致のみ
"""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CACHE = ROOT / 'data/external/ojad_cache.json'


def load_cache(path: Path | None = None) -> dict:
    path = path or DEFAULT_CACHE
    if not path.exists():
        print(f'WARNING: OJAD cache not found at {path}', file=sys.stderr)
        return {'metadata': {}, 'entries': {}}
    with path.open(encoding='utf-8') as f:
        return json.load(f)


def lookup_by_word(cache: dict, word: str) -> list:
    """word で cache 検索。Returns: list of OJAD result entries (may be empty)."""
    entry = cache.get('entries', {}).get(word)
    if not entry or entry.get('status') != 'ok':
        return []
    return entry.get('results', [])


def lookup_by_reading(cache: dict, word: str, reading: str, strict: bool = True) -> list:
    """word + reading で cache 検索。
    strict=True (default): kana 完全一致のみ返す（無ければ空 list）。
      OJAD 検索が relevant でない lemma を返すケース (例: 十六 → 十六分) を排除する。
    strict=False: kana 一致なければ全 results を返す。
    """
    results = lookup_by_word(cache, word)
    if not results or not reading:
        return results if not strict else []
    exact = [r for r in results if r.get('kana') == reading]
    if exact:
        return exact
    return [] if strict else results
