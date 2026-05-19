#!/usr/bin/env python3
"""
Apply 6 patches to the GAS pipeline source (v5.2) and produce v5.3.

Usage:
    python apply_v5_3_patches.py <input.json> <output.gs>

The input is the clasp-style JSON dump that contains a file entry named
"setupSpreadsheet" with the GAS source.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Patch helpers
# ---------------------------------------------------------------------------

def fix_japanese(s: str) -> str:
    """Best-effort recovery from latin-1-as-utf8 mojibake.

    Many of these dumps have Japanese characters that round-tripped through
    latin-1, leaving them displayable but byte-wrong. If we can safely round-
    trip back to UTF-8, do so; otherwise return as-is.
    """
    try:
        recovered = s.encode("latin-1").decode("utf-8")
        # Heuristic: only accept if the result has CJK characters
        if any("　" <= ch <= "鿿" or "＀" <= ch <= "￯" for ch in recovered):
            return recovered
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass
    return s


# ---------------------------------------------------------------------------
# Patch 1 — fallback CONSTRAINTS unification
# ---------------------------------------------------------------------------
P1_TARGETS = [
    "buildPersonPrompt_",
    "buildConcreteObjectPrompt_",
    "buildAbstractConceptPrompt_",
    "buildDefaultPrompt_",
]
P1_OLD = '"No text, no letters, no numbers, no symbols inside the image."'
P1_NEW = '"No text, no letters, no numbers, no symbols anywhere — including titles, labels, captions, or any text overlay at any position in the rendered output."'


def patch_1(src: str) -> str:
    """Replace the CONSTRAINTS string in exactly 4 functions."""
    fn_re = re.compile(
        r"(function\s+(" + "|".join(P1_TARGETS) + r")_\(.*?\)\s*\{.*?^\})",
        re.DOTALL | re.MULTILINE,
    )

    def repl(m: re.Match) -> str:
        body = m.group(1)
        if P1_OLD not in body:
            raise RuntimeError(f"P1: target line not found in {m.group(2)}_")
        new_body = body.replace(P1_OLD, P1_NEW)
        return new_body

    # Use a simpler per-function approach: find each function and patch only its body.
    out = src
    for name in P1_TARGETS:
        pattern = re.compile(
            r"(function\s+" + re.escape(name) + r"\([^)]*\)\s*\{)(.*?)(\n\}\n)",
            re.DOTALL,
        )
        m = pattern.search(out)
        if not m:
            raise RuntimeError(f"P1: function {name} not found")
        head, body, tail = m.group(1), m.group(2), m.group(3)
        if P1_OLD not in body:
            raise RuntimeError(f"P1: target constraint line not in {name}")
        new_body = body.replace(P1_OLD, P1_NEW)
        out = out[: m.start()] + head + new_body + tail + out[m.end():]
    return out


# ---------------------------------------------------------------------------
# Patch 2 — S列 validity threshold
# ---------------------------------------------------------------------------
def patch_2(src: str) -> str:
    old = '  if (row.imagePrompt && row.imagePrompt.trim() !== "") {\n    return row.imagePrompt.trim();\n  }'
    new = (
        '  // v5.3: §5確定ルール「S列有効判定：50文字以上」\n'
        '  if (row.imagePrompt && row.imagePrompt.trim().length > 50) {\n'
        '    return row.imagePrompt.trim();\n'
        '  }'
    )
    if old not in src:
        raise RuntimeError("P2: target if-block not found")
    return src.replace(old, new, 1)


# ---------------------------------------------------------------------------
# Patch 3 — reset function unification
# ---------------------------------------------------------------------------
P3_NEW = '''function resetFailedToPending(lessonRef) {
  const ss      = SpreadsheetApp.openById(IMAGE_SETTINGS.SPREADSHEET_ID);
  const sheet   = ss.getSheetByName(IMAGE_SETTINGS.VOCAB_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("データがありません"); return; }

  // H列(8)=imageStatus, I列(9)=imageUrl, M列(13)=lessonRef を一括で読み取り
  const range = sheet.getRange(2, 8, lastRow - 1, 6); // H～M
  const data  = range.getValues();
  let count   = 0;

  for (let i = 0; i < data.length; i++) {
    const imageStatus = String(data[i][0] || "").trim(); // H列
    const lessonRefVal = String(data[i][5] || "").trim(); // M列 (13 - 8 = 5)
    if (imageStatus !== "failed") continue;
    if (lessonRef && lessonRefVal !== lessonRef) continue;
    data[i][0] = "pending"; // imageStatus
    data[i][1] = "";        // imageUrl
    count++;
  }

  range.setValues(data);
  const scope = lessonRef ? " (lessonRef=\\"" + lessonRef + "\\")" : "";
  Logger.log("✅ " + count + " 件の failed → pending に変更しました" + scope);
}

// 後方互換エイリアス
function resetFailedImagesToPending() { resetFailedToPending(); }
'''


def patch_3(src: str) -> str:
    pattern = re.compile(
        r"function\s+resetFailedImagesToPending\(\)\s*\{.*?\n\}\n",
        re.DOTALL,
    )
    m = pattern.search(src)
    if not m:
        raise RuntimeError("P3: resetFailedImagesToPending() not found")
    return src[: m.start()] + P3_NEW + src[m.end():]


# ---------------------------------------------------------------------------
# Patch 4 — PERSON_PROFILES["会社員"] VISUAL_CANON
# ---------------------------------------------------------------------------
def patch_4(src: str) -> str:
    # The key 会社員 may appear as either proper UTF-8 or mojibake.
    candidates = [
        '"会社員":    "An office worker in business casual attire — collared shirt and trousers. Standing upright with a relaxed confident posture."',
    ]
    new_value = (
        '"会社員":    "An office worker in a navy blue or charcoal gray business suit, '
        'white shirt with a simple necktie or scarf, carrying a briefcase or laptop bag. '
        'Standing upright with a relaxed confident posture."'
    )
    for old in candidates:
        if old in src:
            return src.replace(old, new_value, 1)
    # Fallback: regex on the English part only.
    pattern = re.compile(
        r'"会社員":\s*"An office worker in business casual attire[^"]*"',
    )
    m = pattern.search(src)
    if not m:
        raise RuntimeError("P4: PERSON_PROFILES['会社員'] entry not found")
    return src[: m.start()] + new_value + src[m.end():]


# ---------------------------------------------------------------------------
# Patch 5 — addImagePromptColumn stub removal + clearDataValidations
# ---------------------------------------------------------------------------
def patch_5(src: str) -> str:
    # Step A: remove the broken stub at the file end.
    stub_pattern = re.compile(
        r"function\s+addImagePromptColumn\(\)\s*\{\s*\n"
        r"\s*//\s*\.\.\.\s*既存のコード\s*\.\.\..*?\n\}\s*",
        re.DOTALL,
    )
    new_src, n = stub_pattern.subn("", src)
    if n == 0:
        # Fallback: try with mojibake form or with relaxed Japanese
        stub_re2 = re.compile(
            r"function\s+addImagePromptColumn\(\)\s*\{\s*\n\s*//\s*\.\.\..*?既存.*?\n\}\s*",
            re.DOTALL,
        )
        new_src, n = stub_re2.subn("", src)
    if n == 0:
        raise RuntimeError("P5: broken addImagePromptColumn stub not found")

    # Step B: append clearDataValidations to the canonical addImagePromptColumn.
    canon_pattern = re.compile(
        r"(function\s+addImagePromptColumn\(\)\s*\{.*?sheet\.setColumnWidth\(S_COL,\s*600\);\s*\n)"
        r"(\s*Logger\.log\(\"✅ S列（imagePrompt）追加完了\"\);\s*\n\})",
        re.DOTALL,
    )
    m = canon_pattern.search(new_src)
    if not m:
        raise RuntimeError("P5: canonical addImagePromptColumn body not matched")
    inject = (
        "\n  // v5.3: S列に誤ってデータ入力規則が"
        "設定されないよう明示的にクリア\n"
        "  sheet.getRange(2, S_COL, sheet.getMaxRows() - 1, 1).clearDataValidations();\n"
    )
    return new_src[: m.end(1)] + inject + new_src[m.end(1):]


# ---------------------------------------------------------------------------
# Patch 6 — STYLE_RECIPE header comment normalisation
# ---------------------------------------------------------------------------
def patch_6(src: str) -> str:
    replacements = [
        ("master_prompt_design_guide_v2_5.py STYLE_BIBLE 完全準拠",
         "v2.9.1 相当の等価表現"),
        ("STYLE_BIBLE の core_style と color_palette の完全転記",
         "core_style + color_palette（色名）+ ゼロライティン"
         "グ節を合成した等価表現"),
    ]
    out = src
    for old, new in replacements:
        if old not in out:
            raise RuntimeError(f"P6: snippet not found: {old!r}")
        out = out.replace(old, new, 1)

    # Remove the sub_color/skin_tones marker line if present.
    header_line_re = re.compile(
        r"//\s*✓\s*v5\.2 追加: sub_color \(#6B7C85\) \+ skin_tones\n"
    )
    out = header_line_re.sub("", out, count=1)
    return out


# ---------------------------------------------------------------------------
# Header / version updates
# ---------------------------------------------------------------------------
def patch_header(src: str) -> str:
    out = src

    # Top banner version line: "最終更新: 2026-05-16 (v7.1)" → " (v5.3 / 2026-05-19)" style fix.
    # The header at the very top says v7.1 dated 2026-05-16. We update *generateImages*
    # banner specifically. The instructions ask "ファイル冒頭のバージョン表記を v5.2 → v5.3".
    # The generateImages-section header is "generateImages.gs  v5.2  (2026-05-18)" — bump to v5.3.
    pattern = re.compile(r"generateImages\.gs\s+v5\.2\s+\(2026-05-18\)")
    out, n = pattern.subn("generateImages.gs  v5.3  (2026-05-19)", out)
    if n == 0:
        raise RuntimeError("Header: generateImages.gs v5.2 banner not found")

    # Logger.log inside generateImageBatch.
    out2, n2 = re.subn(
        r'Logger\.log\("=====\s*generateImages\.gs v5\.2 開始\s*====="\);',
        'Logger.log("===== generateImages.gs v5.3 開始 =====");',
        out,
    )
    if n2 == 0:
        raise RuntimeError("Header: generateImageBatch start log line not found")
    out = out2

    # Append v5.3 change-log block to the file-level header comment of generateImages section.
    log_anchor = "v5.1 → v5.2 マージ:"
    if log_anchor not in out:
        raise RuntimeError("Header: v5.2 changelog anchor not found")
    v53_block = (
        "v5.2 → v5.3 パッチ (2026-05-19):\n"
        " *  [P1] フォールバック4関数（Person / ConcreteObject / AbstractConcept / Default）の\n"
        " *       CONSTRAINTS を「anywhere — including titles, labels, captions...」型に統一。\n"
        " *  [P2] S列有効判定を「50文字以上」に変更（§5 確定ルール）。\n"
        " *  [P3] resetFailedImagesToPending() を resetFailedToPending(lessonRef) に統一。\n"
        " *       旧関数名は後方互換エイリアスとして存続。\n"
        " *  [P4] PERSON_PROFILES[\"会社員\"] を VISUAL_CANON 準拠（スーツ＋ブリーフケース）に修正。\n"
        " *  [P5] addImagePromptColumn() の二重定義を解消し、データ入力規則クリアを統合。\n"
        " *  [P6] STYLE_RECIPE 上部コメントを v2.9.1 相当の等価表現に書き換え。\n"
        " *\n"
        " *  ─────────────────────────────────────────\n"
        " *  "
    )
    out = out.replace(log_anchor, v53_block + log_anchor, 1)
    return out


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------
def verify(src: str) -> None:
    # 1. No duplicate function definitions.
    fn_names = re.findall(r"^function\s+(\w+)\s*\(", src, re.MULTILINE)
    seen = {}
    for n in fn_names:
        seen[n] = seen.get(n, 0) + 1
    dups = [k for k, v in seen.items() if v > 1]
    if dups:
        raise RuntimeError(f"Verify: duplicate function definitions: {dups}")

    # 2. "inside the image" should not be present in the 4 patched functions' bodies.
    for name in P1_TARGETS:
        m = re.search(
            r"function\s+" + re.escape(name) + r"\([^)]*\)\s*\{(.*?)\n\}\n",
            src,
            re.DOTALL,
        )
        if not m:
            raise RuntimeError(f"Verify: function {name} not found in output")
        if "no symbols inside the image" in m.group(1):
            raise RuntimeError(f"Verify: 'inside the image' still in {name}")
        if "anywhere — including" not in m.group(1):
            raise RuntimeError(f"Verify: new CONSTRAINTS not in {name}")

    # 3. resetFailedToPending and alias must exist.
    if not re.search(r"function\s+resetFailedToPending\(", src):
        raise RuntimeError("Verify: resetFailedToPending() not defined")
    if not re.search(r"function\s+resetFailedImagesToPending\(\)\s*\{\s*resetFailedToPending\(\);", src):
        raise RuntimeError("Verify: resetFailedImagesToPending alias not defined")

    # 4. addImagePromptColumn defined exactly once.
    if seen.get("addImagePromptColumn", 0) != 1:
        raise RuntimeError(
            f"Verify: addImagePromptColumn defined {seen.get('addImagePromptColumn', 0)} times"
        )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input_json", help="clasp-style JSON dump")
    ap.add_argument("output_gs",  help="output .gs file path")
    ap.add_argument("--no-fix-japanese", action="store_true",
                    help="skip the latin-1-as-utf8 mojibake recovery")
    args = ap.parse_args(argv)

    raw = Path(args.input_json).read_text(encoding="utf-8")
    data = json.loads(raw)
    src = None
    for f in data["files"]:
        if f["name"] == "setupSpreadsheet":
            src = f["source"]
            break
    if src is None:
        sys.exit("setupSpreadsheet entry not found in JSON")

    if not args.no_fix_japanese:
        src = fix_japanese(src)

    src = patch_1(src)
    src = patch_2(src)
    src = patch_3(src)
    src = patch_4(src)
    src = patch_5(src)
    src = patch_6(src)
    src = patch_header(src)

    verify(src)

    Path(args.output_gs).write_text(src, encoding="utf-8")
    print(f"Wrote {args.output_gs} ({len(src):,} chars)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
