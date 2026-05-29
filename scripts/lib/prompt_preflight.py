# -*- coding: utf-8 -*-
"""画像プロンプト preflight 検証モジュール（Phase 5 ④' で build_prompts.py から切出）

invariants.mjs C 相当の機械検証ロジックを 1 箇所に集約する SSOT。
build_prompts.py（決定論版 / dead code 化予定）と .claude/skills/generate-image-prompt.md
（skill 版・本番経路）の両方から同じロジックを呼ぶことで、
両者の比較を apples-to-apples に保つ。

CLI 使用例（skill から bash 経由）:
    # 単発：標準入力に JSON
    echo '{"text": "...", "template_kind": "person", "word": "医者"}' \
        | python scripts/lib/prompt_preflight.py

    # バッチ：JSON Lines（1 行 1 entry）
    python scripts/lib/prompt_preflight.py --batch < prompts.jsonl

    # exit code: 全 PASS なら 0 / 1 件でも違反あれば 1
    # stdout: JSON で {ok: bool, errors: [...]} / batch 時は entry ごとに 1 行

Python import 使用例（build_prompts.py など）:
    from lib.prompt_preflight import preflight
    errors = preflight(text, "person", "医者")
"""

import io
import json
import re
import sys

# Windows console (cp932) で日本語入出力が化けないよう stdin / stdout の両方を UTF-8 に強制。
if sys.stdin.encoding and sys.stdin.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8", newline="")
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", newline="")

# ─────────────────────────────────────────────────────────────
# 期待値定数（v4.0 / v4.1 / v4.0.4 ガイド由来）
# ─────────────────────────────────────────────────────────────
BG_EXACT_CREAM = "soft cream off-white background (warm off-white, NOT pure stark white)"
BG_EXACT_SKYBLUE = "pale sky-blue background"
NOT_TOKEN = "NOT pure stark white"

# v4.0.4 building 採用 6 件（universal cream BG / 5-image reference / A-1〜A-11 適用）
# 未移行 building（駅 / スーパー）は legacy v3.0 pale sky-blue 経路
# 銀行 / 病院 は Phase 1-S1 (2026-05-29) で v4.0.4 移行
BUILDING_V4_0_4_WORDS = frozenset({"学校", "大学", "デパート", "会社", "銀行", "病院"})

# ─────────────────────────────────────────────────────────────
# 検出用正規表現
# ─────────────────────────────────────────────────────────────
RE_FULLBODY = re.compile(r"full[-\s]?body|head[-\s]?to[-\s]?toe", re.IGNORECASE)
RE_AREA_PERCENT = re.compile(
    r"fills\s+\d+\s*[-–]?\s*\d*\s*%\s+of\s+the\s+image\s+area", re.IGNORECASE
)
RE_PORTRAIT_LENS = re.compile(r"85\s*mm\s+portrait\s+lens", re.IGNORECASE)
RE_FLAG_OR_NAT = re.compile(r"flag|nationality|国旗", re.IGNORECASE)
RE_STRONG_TOKEN = re.compile(r"\b(must|never|DO NOT)\b")
# 未置換 placeholder 検出: {WORD_LIKE} または [{WORD_LIKE}]
RE_PLACEHOLDER_REMAIN = re.compile(r"\[\{[A-Z_]+\}\]|\{[A-Z_]+\}")


def _is_legacy_building(template_kind, word):
    """v3.0 legacy path で生成する building かどうか（pale sky-blue BG / C5 skip）。"""
    return template_kind == "building" and word not in BUILDING_V4_0_4_WORDS


def _expected_bg(template_kind, word):
    """template_kind + word ごとの BG 期待値を返す。

    v4.0.4: building の採用 6 件は cream / 未移行 2 件 (駅 / スーパー) は legacy sky-blue。
    """
    if _is_legacy_building(template_kind, word):
        return BG_EXACT_SKYBLUE
    return BG_EXACT_CREAM


def preflight(text, template_kind, word):
    """画像プロンプト 1 件を invariants.mjs C 相当でチェック。

    Args:
        text: prompt 全文（[STYLE_BIBLE] [SUBJECT] [POSE] [BG] [CONSTRAINTS] [NEG]）
        template_kind: vocab_type 文字列 ("person" / "building" / ...) または
            "example_sentence"
        word: エラーメッセージに含める identifier（word / imageId）
            building の場合は v4.0.4 採用 6 件か未移行 2 件かの判定にも使う

    Returns:
        list[str]: 違反メッセージ list。空 list なら PASS。
    """
    errs = []
    bg_expected = _expected_bg(template_kind, word)
    if bg_expected not in text:
        errs.append(f"[C4] {word}: background string 不一致（必須: '{bg_expected}'）")
    # NOT pure stark white は cream BG path（= non-legacy）にのみ必須
    if not _is_legacy_building(template_kind, word) and NOT_TOKEN not in text:
        errs.append(f"[C5] {word}: NOT-token 不一致（必須: '{NOT_TOKEN}'）")
    if template_kind == "person":
        if not RE_FULLBODY.search(text):
            errs.append(f"[C1] {word}: full-body / head-to-toe が無い")
        if RE_AREA_PERCENT.search(text):
            errs.append(f"[C1] {word}: 面積指定 'fills NN% of...' が残存")
        if RE_PORTRAIT_LENS.search(text):
            errs.append(f"[C1] {word}: '85mm portrait lens' が残存")
    if RE_FLAG_OR_NAT.search(text):
        if not RE_STRONG_TOKEN.search(text):
            errs.append(f"[C6] {word}: flag/nationality 文脈に強表現 must/never が無い")
    leftovers = RE_PLACEHOLDER_REMAIN.findall(text)
    if leftovers:
        seen = set()
        uniq = [x for x in leftovers if not (x in seen or seen.add(x))]
        errs.append(f"[PH] {word}: 未置換 placeholder 残存: {uniq[:5]}")
    return errs


def _run_single(entry):
    """1 entry を preflight して結果 dict を返す。"""
    text = entry.get("text", "")
    template_kind = entry.get("template_kind", "")
    word = entry.get("word", "?")
    errors = preflight(text, template_kind, word)
    return {"word": word, "ok": len(errors) == 0, "errors": errors}


def _main():
    """CLI entry point。

    --batch なしなら stdin から JSON 1 件を読む。
    --batch あれば stdin を JSON Lines として読み、各行を独立 preflight。
    exit code: 全 PASS なら 0、1 件でも違反あれば 1。
    """
    batch = "--batch" in sys.argv[1:]
    if batch:
        any_fail = False
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            entry = json.loads(line)
            result = _run_single(entry)
            if not result["ok"]:
                any_fail = True
            sys.stdout.write(json.dumps(result, ensure_ascii=False) + "\n")
        sys.exit(1 if any_fail else 0)
    else:
        entry = json.loads(sys.stdin.read())
        result = _run_single(entry)
        sys.stdout.write(json.dumps(result, ensure_ascii=False) + "\n")
        sys.exit(0 if result["ok"] else 1)


if __name__ == "__main__":
    _main()
