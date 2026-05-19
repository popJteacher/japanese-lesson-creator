#!/usr/bin/env python3
"""
build-embedded-data.py
-----------------------------------------------------------------------------
data/*.json を data/*.js (window.EmbeddedData 登録) に変換する。

目的:
  index.html を file:// でダブルクリックで開けるようにする。
  fetch() は file:// では同一オリジンチェックで失敗するが、
  <script src="data/lesson_01.js"> なら file:// でも読める。

使い方:
  python scripts/build-embedded-data.py

  data/*.json を編集したら必ず本スクリプトを再実行すること。
  (index.html が読むのは生成された .js のほうだけ。)

生成内容:
  data/lesson_01.js                 → window.EmbeddedData.lessons[1]
  data/lesson_02.js                 → window.EmbeddedData.lessons[2]
  data/activity_catalog.js          → window.EmbeddedData.activityCatalog
  data/intro_activity_catalog.js    → window.EmbeddedData.introActivityCatalog
  data/master_image_registry.js     → window.EmbeddedData.imageRegistry
  data/master_audio_registry.js     → window.EmbeddedData.audioRegistry

session_NNN.json はユーザーがアップロードする入力なので、ここでは変換しない。
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'

# (json_filename, js_filename, JS expression that receives the parsed JSON object)
TARGETS = [
    ('lesson_01.json',                'lesson_01.js',                'window.EmbeddedData.lessons[1]'),
    ('lesson_02.json',                'lesson_02.js',                'window.EmbeddedData.lessons[2]'),
    ('activity_catalog.json',         'activity_catalog.js',         'window.EmbeddedData.activityCatalog'),
    ('intro_activity_catalog.json',   'intro_activity_catalog.js',   'window.EmbeddedData.introActivityCatalog'),
    ('master_image_registry.json',    'master_image_registry.js',    'window.EmbeddedData.imageRegistry'),
    ('master_audio_registry.json',    'master_audio_registry.js',    'window.EmbeddedData.audioRegistry'),
]

HEADER = '''/**
 * {js_name} (auto-generated; do not edit)
 * -----------------------------------------------------------------------------
 * source: data/{json_name}
 * regenerate: python scripts/build-embedded-data.py
 *
 * file:// プロトコルで開いた index.html から fetch せずに参照できるよう、
 * JSON 内容をそのまま {target} に登録する。
 */
'use strict';
window.EmbeddedData = window.EmbeddedData || {{ lessons: {{}} }};
'''

LESSON_NO_RE = re.compile(r'lesson_(\d+)\.json$')


def main() -> int:
    if not DATA.is_dir():
        print(f'[error] {DATA} not found', file=sys.stderr)
        return 1

    out_count = 0
    for json_name, js_name, target in TARGETS:
        src = DATA / json_name
        dst = DATA / js_name
        if not src.exists():
            print(f'[skip] {src} not found')
            continue
        with src.open('r', encoding='utf-8') as f:
            obj = json.load(f)
        # JSON dump as JS literal. ensure_ascii=False so Japanese is readable.
        # JSON is a strict subset of JS object literal syntax so this is safe.
        body = json.dumps(obj, ensure_ascii=False, indent=2)
        # ensure target.lessons exists when assigning to lessons[N]
        ensure = ''
        if target.startswith('window.EmbeddedData.lessons['):
            ensure = 'window.EmbeddedData.lessons = window.EmbeddedData.lessons || {};\n'
        content = HEADER.format(js_name=js_name, json_name=json_name, target=target) + ensure + f'{target} = {body};\n'
        dst.write_text(content, encoding='utf-8')
        print(f'[ok]   {dst.relative_to(ROOT)}  ({len(content):,} bytes)')
        out_count += 1

    print(f'\nGenerated {out_count} file(s).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
