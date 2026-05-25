"""
scripts/lib/nhk_lookup.py
NHK 発音アクセント辞典 (2版・javdejong/nhk-pronunciation CSV ベース) の lookup module。

`scripts/check-accent-nhk.py` から lookup ロジックを切り出して再利用可能にしたもの。
CSV は tmp/nhk_csv/ACCDB_unicode.csv に置く前提（git ignore 対象・~10MB）。

Usage:
    from scripts.lib.nhk_lookup import build_index, lookup, to_yomigana, kata_to_hira

    idx = build_index()
    hits = lookup(idx, '一', 'いち')  # → [{yomigana, accent_type, ...}, ...]
"""
from __future__ import annotations
import csv, sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NHK_CSV = ROOT / 'tmp/nhk_csv/ACCDB_unicode.csv'

SMALL_KANA = set('ゃゅょぁぃぅぇぉ')

KATAKANA = 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッーヮヰヱヵヶ'
HIRAGANA = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉゃゅょっーゎゐゑゕゖ'
_K2H = str.maketrans(KATAKANA, HIRAGANA)


def kata_to_hira(s: str) -> str:
    return s.translate(_K2H) if s else s


def normalize_reading(s: str) -> str:
    """katakana → hiragana, strip whitespace (lookup key 正規化)"""
    if not s:
        return ''
    return kata_to_hira(s).strip()


def parse_accent(midashigo1: str, ac: str) -> tuple[int, int]:
    """NHK accent 表記 → (accent_type, char_count).
      midashigo1: 例 'カレンダー' (katakana, ー 含む char base)
      ac:         例 '2000'      ('1'=high, '2'=high+downstep, '0'=low; 左 padding)
    Returns: (accent_type, char_count)
      accent_type = position (1-indexed) of first '2' in padded ac, or 0 = 平板
    """
    strlen = len(midashigo1)
    padded = ('0' * (strlen - len(ac))) + ac
    for i, c in enumerate(padded):
        if c == '2':
            return (i + 1, strlen)
    return (0, strlen)


def _char_pos_to_yomi_pos(hira: str, char_pos: int) -> int:
    if char_pos <= 0:
        return 0
    pos = min(char_pos, len(hira))
    # If next char is small kana attaching to current mora, include it before !
    while pos < len(hira) and hira[pos] in SMALL_KANA:
        pos += 1
    return pos


def to_yomigana(midashigo1: str, ac: str) -> str:
    """NHK encoding → 我々の yomigana 表記 ('^...!...')."""
    accent_type, _ = parse_accent(midashigo1, ac)
    hira = kata_to_hira(midashigo1)
    if accent_type == 0:
        return '^' + hira
    pos = _char_pos_to_yomi_pos(hira, accent_type)
    return '^' + hira[:pos] + '!' + hira[pos:]


def build_index(csv_path: Path | None = None) -> dict:
    """NHK CSV を 2 段 index 化。
    Returns: {
      'by_word':           {kanji: [entry, ...]},
      'by_word_reading':   {(kanji, reading_hira): [entry, ...]},
    }
    entry = {kanji, reading, midashigo1, ac, accent_type, mora, yomigana, ...}
    """
    csv_path = csv_path or DEFAULT_NHK_CSV
    if not csv_path.exists():
        print(f'ERROR: NHK CSV not found at {csv_path}', file=sys.stderr)
        print('Download via: curl -sL -o tmp/nhk_csv/ACCDB_unicode.csv '
              'https://raw.githubusercontent.com/javdejong/nhk-pronunciation/master/ACCDB_unicode.csv',
              file=sys.stderr)
        raise FileNotFoundError(csv_path)
    by_word = defaultdict(list)
    by_word_reading = defaultdict(list)
    with csv_path.open(encoding='utf-8') as f:
        for row in csv.reader(f):
            if len(row) < 19:
                continue
            kanji = row[7]
            mid = row[5]
            mid1 = row[15]
            ac = row[18]
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
            }
            by_word[kanji].append(entry)
            by_word_reading[(kanji, reading_hira)].append(entry)
    return {'by_word': dict(by_word), 'by_word_reading': dict(by_word_reading)}


def lookup(idx: dict, word: str, reading: str | None = None) -> list:
    """word + 可能なら reading で lookup。reading 一致が無ければ word のみで返す。
    Returns: list of NHK entries (may be empty, single, or multiple).
    """
    if not word:
        return []
    if reading:
        reading_n = normalize_reading(reading)
        hits = idx['by_word_reading'].get((word, reading_n), [])
        if hits:
            return hits
    return idx['by_word'].get(word, [])
