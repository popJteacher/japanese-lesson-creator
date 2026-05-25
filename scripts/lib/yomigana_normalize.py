"""
scripts/lib/yomigana_normalize.py
yomigana 文字列 (例: "^かよ!ー" / "^かよう") を比較用に正規化する。

主な変換:
  - 長音 ー ↔ 連続母音 (おう/えい etc) を統一  ※ NHK は ー 表記、UniDic は う/い 表記
  - 連濁 (が/ぎ/ぐ → か/き/く 等) を清音に剥がす  ※ catalog 側のほうが連濁あり
  - SSML 制御文字 ^ と ! は保持（accent核位置の意味を持つため比較対象）

NOTE: 連濁正規化は不完全（純粋に音韻のみで判定するため文脈情報を失う）。
      意図的な「型一致判定」用途であり、人間判読用には使わないこと。
"""
from __future__ import annotations

# 長音化規則:
#   お段 + う → お段ー  (例: とう→とー、こう→こー、ょう→ょー)
#   え段 + い → え段ー  (例: えい→えー、けい→けー、ぇい→ぇー)
#   ゅ + う → ゅー       (long u)
#   あ + あ / お + お / え + え → ー
# 「^」「!」は accent control 文字なので prev 走査時に skip する
LONG_VOWEL_BASE_O = set('おこそとのほもよろごぞどぼぽしんちっょ')  # 「+う」で ー 化
LONG_VOWEL_BASE_U = set('うくすつぬふむゆるぐずづぶぷゅ')          # 「+う」で ー 化
LONG_VOWEL_BASE_E = set('えけせてねへめれげぜでべぺぇ')             # 「+い」で ー 化
CONTROL_CHARS = set('^!')

RENDAKU_MAP = {
    'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
    'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
    'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
    'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
    'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
}


def _prev_non_control(out: list[str]) -> str:
    """out 末尾から ^/! を skip して直前の実 char を返す（無ければ '')"""
    j = len(out) - 1
    while j >= 0 and out[j] in CONTROL_CHARS:
        j -= 1
    return out[j] if j >= 0 else ''


def normalize_long_vowels(s: str) -> str:
    """連続母音 (おう/えい/ええ/おお/ょう/ゅう 等) を ー 表記に統一する。
    既に ー がある場合は維持。^/! は accent 制御文字として透過扱い。
    """
    out: list[str] = []
    for ch in s:
        prev = _prev_non_control(out)
        if not prev:
            out.append(ch)
            continue
        if ch == 'う' and prev in (LONG_VOWEL_BASE_O | LONG_VOWEL_BASE_U):
            out.append('ー')
        elif ch == 'い' and prev in LONG_VOWEL_BASE_E:
            out.append('ー')
        elif ch == 'お' and prev == 'お':
            out.append('ー')
        elif ch == 'え' and prev == 'え':
            out.append('ー')
        elif ch == 'あ' and prev == 'あ':
            out.append('ー')
        else:
            out.append(ch)
    return ''.join(out)


def remove_rendaku(s: str) -> str:
    """連濁文字を清音に戻す。比較目的のみ。"""
    return ''.join(RENDAKU_MAP.get(ch, ch) for ch in s)


def normalize_yomigana(s: str) -> str:
    """比較用の標準形に正規化:
      1. 長音 ー に統一
      2. 連濁を剥がす
      3. ^ と ! は維持（accent核位置）
    """
    if not s:
        return s
    s = normalize_long_vowels(s)
    s = remove_rendaku(s)
    return s


def normalize_for_match(s: str) -> str:
    """structural compare: yomigana の中身 (^ ! も含む位置) を正規化"""
    return normalize_yomigana(s)


if __name__ == '__main__':
    # Quick sanity checks
    pairs = [
        ('^かよう',  '^かよー'),   # おう → ー
        ('^かよ!う', '^かよ!ー'),
        ('^とうきょう', '^とーきょー'),
        ('^おねがい',  '^おねがい'),  # ねが (連濁) → 比較形は ねか
        ('^がっこう',  '^がっこー'),
    ]
    for a, b in pairs:
        na = normalize_yomigana(a)
        nb = normalize_yomigana(b)
        print(f'  {a!r} → {na!r}')
        print(f'  {b!r} → {nb!r}')
        print(f'  match: {na == nb}')
        print()
