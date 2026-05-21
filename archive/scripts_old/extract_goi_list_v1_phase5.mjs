#!/usr/bin/env node
// Phase 5 ① — Goi_List.pdf から全レベル語彙を抽出して JSON 凍結。
// GAS pipeline.gs § extractFromGoiList (v1.0) を Node に移植。
// DriveApp.getBlob().getDataAsString("UTF-8") は Node では fs.readFile + Buffer.toString('utf-8') で同等。
// PUA → ひらがな逆シフトと chunk ペアリングのロジックは GAS と 1:1。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_PDF = path.join(ROOT, 'data/sources/goi_list_raw.pdf');
const OUT_JSON   = path.join(ROOT, 'data/sources/goi_list_raw.json');

const LEVEL_TO_JLPT = {
  '1.初級前半': 'N5',
  '2.初級後半': 'N4',
  '3.中級前半': 'N3',
  '4.中級後半': 'N2',
  '5.上級前半': 'N2',
  '6.上級後半': 'N1',
};

function readGoiListBytes(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  return fixGoiListEncoding(buf.toString('utf-8'));
}

function fixGoiListEncoding(text) {
  return text.replace(/[䛳-䜝]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x1690)
  );
}

function parseGoiList(content) {
  const rawLines = content.split('\n');
  const chunks = [];
  let current = [];
  for (const line of rawLines) {
    const trimmed = line.replace(/\r$/, '').trimEnd();
    if (trimmed === '') {
      if (current.length > 0) { chunks.push(current); current = []; }
    } else {
      current.push(trimmed);
    }
  }
  if (current.length > 0) chunks.push(current);

  const isMainChunk = (chunk) => {
    if (chunk.length === 0) return false;
    const first = chunk[0];
    if (first.startsWith('No ')) return true;
    return /^\d+$/.test(first.split(' ')[0]);
  };

  const mainQueue = [];
  const goiPairs = [];
  for (const chunk of chunks) {
    if (isMainChunk(chunk)) mainQueue.push(chunk);
    else goiPairs.push({ mainChunk: mainQueue.shift() || [], goiChunk: chunk });
  }
  for (const chunk of mainQueue) goiPairs.push({ mainChunk: chunk, goiChunk: [] });

  const entries = [];
  for (const pair of goiPairs) {
    const mainRows = parseMainChunk(pair.mainChunk);
    const goiRows  = parseGoiChunk(pair.goiChunk);
    mainRows.forEach((row, i) => {
      row.goiShurui = goiRows[i] !== undefined ? goiRows[i] : '';
      entries.push(row);
    });
  }
  return entries;
}

// Anchor on the level token so we tolerate cases where PDF extraction
// collapses whitespace around reading/level boundaries (or even word/reading
// boundaries for katakana-repeat headwords).
const LEVEL_RE = /(\d\.(?:初級|中級|上級)(?:前半|後半))/;
const KATAKANA_SUFFIX_RE = /[ァ-ヶー・]+$/;

function splitWordReading(preLevel) {
  const spaceIdx = preLevel.search(/\s+/);
  if (spaceIdx >= 0) {
    return {
      word: preLevel.slice(0, spaceIdx),
      reading: preLevel.slice(spaceIdx).trim(),
    };
  }
  // No whitespace — try katakana-headword repetition first (e.g., インターナショナル×2)
  if (preLevel.length >= 2 && preLevel.length % 2 === 0) {
    const half = preLevel.length / 2;
    if (preLevel.slice(0, half) === preLevel.slice(half)) {
      return { word: preLevel.slice(0, half), reading: preLevel.slice(half) };
    }
  }
  // Fallback — peel a katakana suffix as reading
  const m = preLevel.match(KATAKANA_SUFFIX_RE);
  if (m && m[0].length < preLevel.length) {
    return {
      word: preLevel.slice(0, preLevel.length - m[0].length),
      reading: m[0],
    };
  }
  return { word: preLevel, reading: '' };
}

function parseMainChunk(chunk) {
  const rows = [];
  for (const line of chunk) {
    if (line.startsWith('No ')) continue;
    const firstToken = line.split(' ')[0];
    if (!/^\d+$/.test(firstToken)) continue;
    const levelM = line.match(LEVEL_RE);
    if (!levelM) continue;

    const no = firstToken;
    const preLevel  = line.slice(no.length, levelM.index).trim();
    const level     = levelM[1];
    const postLevel = line.slice(levelM.index + levelM[0].length).trim();

    const { word, reading } = splitWordReading(preLevel);

    const sp = postLevel.indexOf(' ');
    const pos1 = sp >= 0 ? postLevel.slice(0, sp) : postLevel;
    const pos2 = sp >= 0 ? postLevel.slice(sp + 1).trim() : '';

    rows.push({ no, word, reading, level, pos1, pos2, goiShurui: '' });
  }
  return rows;
}

function parseGoiChunk(chunk) {
  const rows = [];
  for (const line of chunk) {
    if (line === '語種 更新情報') continue;
    const trimmed = line.trim();
    if (trimmed === '' || trimmed === '更新情報') continue;
    rows.push(trimmed);
  }
  return rows;
}

function katakanaToHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

function normalizePOS(pos1) {
  const map = {
    '動詞1類': '動詞',
    '動詞2類': '動詞',
    '動詞3類': '動詞',
    'イ形容詞': '形容詞',
    'ナ形容詞': '形容詞',
  };
  return map[pos1] || pos1;
}

function main() {
  if (!fs.existsSync(SOURCE_PDF)) {
    console.error(`ERROR: source PDF not found at ${SOURCE_PDF}`);
    process.exit(1);
  }

  const sourceStat = fs.statSync(SOURCE_PDF);
  const rawText = readGoiListBytes(SOURCE_PDF);
  const allEntries = parseGoiList(rawText);

  // Enrich each entry with jlpt + normalized fields. Preserve raw fields so
  // downstream Phase 5 steps can re-normalize if conventions change.
  const enriched = allEntries.map((e) => ({
    no: e.no,
    word: e.word,
    readingRaw: e.reading,
    reading: katakanaToHiragana(e.reading),
    level: e.level,
    jlpt: LEVEL_TO_JLPT[e.level] || null,
    pos1: e.pos1,
    pos: normalizePOS(e.pos1),
    pos2: e.pos2,
    goiShurui: e.goiShurui,
  }));

  const perLevelCount = {};
  const perJlptCount  = {};
  for (const e of enriched) {
    perLevelCount[e.level] = (perLevelCount[e.level] || 0) + 1;
    const k = e.jlpt || 'UNKNOWN';
    perJlptCount[k] = (perJlptCount[k] || 0) + 1;
  }
  const totalLevels = Object.keys(perLevelCount).length;

  const out = {
    _meta: {
      extractedAt: new Date().toISOString(),
      source: {
        path: path.relative(ROOT, SOURCE_PDF).replace(/\\/g, '/'),
        bytes: sourceStat.size,
        driveFileId: '1XzRtPCPJLBwJUTXEzOyWuNHI9b08DLqA',
      },
      generator: 'scripts/extract-goi-list.mjs (port of gas/pipeline.gs § extractFromGoiList v1.0)',
      totalEntries: enriched.length,
      totalLevels,
      perLevelCount,
      perJlptCount,
      levelToJlpt: LEVEL_TO_JLPT,
    },
    entries: enriched,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n', 'utf-8');

  console.log(`✓ wrote ${path.relative(ROOT, OUT_JSON).replace(/\\/g, '/')}`);
  console.log(`  totalEntries: ${enriched.length}`);
  console.log('  perLevelCount:');
  for (const [lv, c] of Object.entries(perLevelCount).sort()) {
    console.log(`    ${lv} (${LEVEL_TO_JLPT[lv] || '?'})  ${c}`);
  }
  console.log('  perJlptCount:');
  for (const [j, c] of Object.entries(perJlptCount).sort()) {
    console.log(`    ${j}  ${c}`);
  }
}

main();
