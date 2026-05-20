#!/usr/bin/env node
// scripts/diff-registries.mjs
// Phase 2 ④ 同値検証用：GAS Drive snapshot と ローカル sync 出力を JSON 構造で deep diff。
// _meta.lastModified / _meta.lastUpdated は同じ日に走らせれば一致するが、
// テキストではなく JSON 構造で比較するため改行コード（LF/CRLF）の違いは無視される。
//
// 使い方:
//   node scripts/diff-registries.mjs <gas-snapshot.json> <local-registry.json>
//
// 終了コード:
//   0: 差分なし
//   1: 差分あり（詳細を stdout に）
//   2: ファイル読み込み・パース失敗

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// JSON Pointer (RFC 6901) ライクなパスで差分を列挙
function deepDiff(a, b, path = '') {
  const diffs = [];
  if (a === b) return diffs;
  if (typeof a !== typeof b) {
    diffs.push({ path: path || '/', kind: 'type', a: typeof a, b: typeof b });
    return diffs;
  }
  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const cp = `${path}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`;
      if (!(k in a)) { diffs.push({ path: cp, kind: 'only_in_b', b: b[k] }); continue; }
      if (!(k in b)) { diffs.push({ path: cp, kind: 'only_in_a', a: a[k] }); continue; }
      diffs.push(...deepDiff(a[k], b[k], cp));
    }
    return diffs;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      diffs.push({ path: path || '/', kind: 'array_length', a: a.length, b: b.length });
    }
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      diffs.push(...deepDiff(a[i], b[i], `${path}/${i}`));
    }
    return diffs;
  }
  if (a !== b) {
    diffs.push({ path: path || '/', kind: 'value', a, b });
  }
  return diffs;
}

const IGNORE_PATHS = new Set([
  '/_meta/lastUpdated',
  '/_meta/lastModified',
]);

function filterIgnored(diffs) {
  return diffs.filter(d => !IGNORE_PATHS.has(d.path));
}

function formatValue(v) {
  if (v === undefined) return '(undefined)';
  const s = JSON.stringify(v);
  if (s.length <= 80) return s;
  return s.slice(0, 77) + '...';
}

async function main() {
  const [, , aPath, bPath] = process.argv;
  if (!aPath || !bPath) {
    console.error('Usage: node scripts/diff-registries.mjs <a.json> <b.json>');
    process.exit(2);
  }
  let a, b;
  try {
    a = JSON.parse(await readFile(resolve(aPath), 'utf8'));
    b = JSON.parse(await readFile(resolve(bPath), 'utf8'));
  } catch (e) {
    console.error('✗ parse error: ' + (e.message || e));
    process.exit(2);
  }

  const allDiffs = deepDiff(a, b);
  const filtered = filterIgnored(allDiffs);

  console.log(`比較: ${aPath}`);
  console.log(`    ↔ ${bPath}`);
  console.log(`  全差分: ${allDiffs.length} 件`);
  console.log(`  無視対象（_meta 日付）: ${allDiffs.length - filtered.length} 件`);
  console.log(`  残差分: ${filtered.length} 件`);

  if (filtered.length === 0) {
    console.log('\n✓ 同値（_meta 日付を除く全フィールド一致）');
    process.exit(0);
  }

  console.log('\n--- 残差分の詳細 ---');
  for (const d of filtered.slice(0, 50)) {
    if (d.kind === 'value') {
      console.log(`  [value]   ${d.path}`);
      console.log(`    a: ${formatValue(d.a)}`);
      console.log(`    b: ${formatValue(d.b)}`);
    } else if (d.kind === 'only_in_a') {
      console.log(`  [only_a]  ${d.path} = ${formatValue(d.a)}`);
    } else if (d.kind === 'only_in_b') {
      console.log(`  [only_b]  ${d.path} = ${formatValue(d.b)}`);
    } else if (d.kind === 'type') {
      console.log(`  [type]    ${d.path}: a=${d.a} b=${d.b}`);
    } else if (d.kind === 'array_length') {
      console.log(`  [arr_len] ${d.path}: a.length=${d.a} b.length=${d.b}`);
    }
  }
  if (filtered.length > 50) {
    console.log(`  ... 他 ${filtered.length - 50} 件`);
  }
  process.exit(1);
}

main();
