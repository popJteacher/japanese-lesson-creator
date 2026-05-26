#!/usr/bin/env python
"""
scripts/lib/lesson-scaffold-pdf.py

/lesson-scaffold が使う PDF → PNG レンダラ。
PyMuPDF (fitz) で各ページを 180 DPI の PNG に書き出す。

使い方:
    python scripts/lib/lesson-scaffold-pdf.py <pdf_path> <out_dir> [--dpi 180]

出力: <out_dir>/page_01.png, page_02.png, ...
"""

import argparse
import os
import sys

import fitz  # PyMuPDF


def render_pdf_to_pngs(pdf_path: str, out_dir: str, dpi: int = 180) -> int:
    if not os.path.exists(pdf_path):
        print(f"pdf not found: {pdf_path}", file=sys.stderr)
        return 2
    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    try:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=dpi)
            out = os.path.join(out_dir, f"page_{i + 1:02d}.png")
            pix.save(out)
        n = len(doc)
    finally:
        doc.close()
    print(f"rendered {n} pages → {out_dir}")
    return 0


def main():
    p = argparse.ArgumentParser(description="render PDF pages to PNG (lesson-scaffold helper)")
    p.add_argument("pdf_path")
    p.add_argument("out_dir")
    p.add_argument("--dpi", type=int, default=180)
    args = p.parse_args()
    sys.exit(render_pdf_to_pngs(args.pdf_path, args.out_dir, dpi=args.dpi))


if __name__ == "__main__":
    main()
