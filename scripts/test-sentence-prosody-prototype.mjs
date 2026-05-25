#!/usr/bin/env node
// scripts/test-sentence-prosody-prototype.mjs
// 例文の per-mora <prosody pitch="±Nst"> 注入で accent 制御する prototype。
//
// 設計:
//   1. catalog 全 word から「compound-aware」reverse lookup (longest-match)
//   2. sentence を catalog word (longest match) で先に切り出す
//   3. 残りを fugashi で 粒度分解
//   4. catalog match の word は accent_yomigana を解析して per-mora prosody SSML 生成
//   5. それ以外は plain
//
// accent → pitch:
//   平板 (type 0): L H H H H ...  (最初低、以降高)
//   頭高 (type 1): H L L L L ...
//   中高 (type N>1): L H H ... H L L L (1 から N-1 まで高、N でも高、N+1 で低)
//   ※ type N の意味: accent核が N 番目のモーラ → N+1 で下がる
//
// SSML pitch:
//   H → +3st, L → -1.5st (asymmetric: 高は強調、低は控えめ — 自然さ重視)

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';
import { applyQc } from './lib/audio-qc.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/sentence_prototype');
const VOCAB_CATALOG = resolve(ROOT, 'data/vocab_catalog.json');
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };

const SMALL_KANA = new Set(['ゃ','ゅ','ょ','ぁ','ぃ','ぅ','ぇ','ぉ']);

const SENTENCES = [
  { id: 'L02_033', text: 'あの山は富士山です。' },
  { id: 'L02_025', text: 'その人はアインシュタインです。' },
  { id: 'L02_019', text: 'わたしのです。' },
];

function escapeSsml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Parse accent_yomigana like "^かれ!んだー" → { kana: 'かれんだー', accent_type: 2 }
function parseYomigana(yomi) {
  if (!yomi) return null;
  let s = yomi;
  if (s.startsWith('^')) s = s.slice(1);
  const bang = s.indexOf('!');
  let kana, accentType;
  if (bang === -1) {
    kana = s;
    accentType = 0;  // 平板
  } else {
    kana = s.slice(0, bang) + s.slice(bang + 1);
    // Count moras (excluding small kana) up to bang position
    let mora = 0;
    for (let i = 0; i < bang; i++) {
      if (!SMALL_KANA.has(s[i])) mora++;
    }
    accentType = mora;
  }
  return { kana, accent_type: accentType };
}

// Split kana into mora-groups (each group = 1 mora; small kana attach to previous char)
function splitMora(kana) {
  const groups = [];
  let cur = '';
  for (const ch of kana) {
    if (SMALL_KANA.has(ch) && cur) {
      cur += ch;
    } else {
      if (cur) groups.push(cur);
      cur = ch;
    }
  }
  if (cur) groups.push(cur);
  return groups;
}

// Pitch pattern: array of 'H' | 'L' per mora
function pitchPattern(moraCount, accentType) {
  const pattern = new Array(moraCount);
  if (accentType === 0) {
    // 平板: L H H H H ...
    for (let i = 0; i < moraCount; i++) pattern[i] = i === 0 ? 'L' : 'H';
  } else if (accentType === 1) {
    // 頭高: H L L L L
    for (let i = 0; i < moraCount; i++) pattern[i] = i === 0 ? 'H' : 'L';
  } else {
    // 中高/尾高 (type N>1): L H H H L L L (peak at N, drop after)
    for (let i = 0; i < moraCount; i++) {
      if (i === 0) pattern[i] = 'L';
      else if (i < accentType) pattern[i] = 'H';
      else if (i === accentType - 1) pattern[i] = 'H';  // last high before drop is at index accentType-1
      else pattern[i] = 'L';
    }
    // Correction: type=2 means downstep AFTER mora 2 → moras 1..2 high, 3+ low
    // Index: 0=L (initial low), 1=H, 2=H (peak), 3+=L
    // For accent_type=N (downstep after mora N):
    //   mora 1 (idx 0): L (rises)
    //   moras 2 to N (idx 1 to N-1): H
    //   moras N+1+ (idx N to end): L
    for (let i = 0; i < moraCount; i++) {
      if (i === 0) pattern[i] = 'L';
      else if (i < accentType) pattern[i] = 'H';
      else pattern[i] = 'L';
    }
  }
  return pattern;
}

const PITCH_HIGH = '+3st';
const PITCH_LOW  = '-2st';

// Build SSML span for a word given surface (kanji) + accent_yomigana
function wordToSsml(surface, yomigana) {
  const parsed = parseYomigana(yomigana);
  if (!parsed) return escapeSsml(surface);
  const moras = splitMora(parsed.kana);
  const pattern = pitchPattern(moras.length, parsed.accent_type);
  // BUT: TTS reads from surface (kanji). We need it to map kanji → moras.
  // Strategy: use phoneme tag for reading + prosody for pitch.
  // <phoneme alphabet="yomigana" ph="..."> for read accuracy
  // wrap each mora-yomigana in its own prosody. But phoneme inside prosody might not work.
  // Alternative: send the yomigana DIRECTLY as text with prosody (let TTS read the kana).
  // Issue: 富士山 written as "ふじさん" loses kanji display, but TTS produces same speech.
  // For audio-only output, kanji vs kana doesn't matter. Use kana.
  const parts = [];
  for (let i = 0; i < moras.length; i++) {
    const pitch = pattern[i] === 'H' ? PITCH_HIGH : PITCH_LOW;
    parts.push(`<prosody pitch="${pitch}">${escapeSsml(moras[i])}</prosody>`);
  }
  return parts.join('');
}

// Compound-aware tokenizer:
// 1. Try longest match from catalog words at each position
// 2. If no match, take next single char as plain
function tokenize(sentence, catalogByWord) {
  const tokens = [];
  let pos = 0;
  // Sort catalog words by length desc for longest-match-first
  while (pos < sentence.length) {
    let matched = null;
    // Try lengths 8 down to 1
    for (let len = Math.min(10, sentence.length - pos); len >= 1; len--) {
      const sub = sentence.substr(pos, len);
      if (catalogByWord.has(sub)) {
        matched = { surface: sub, yomigana: catalogByWord.get(sub), len };
        break;
      }
    }
    if (matched) {
      tokens.push({ kind: 'word', surface: matched.surface, yomigana: matched.yomigana });
      pos += matched.len;
    } else {
      // Take 1 char as plain
      tokens.push({ kind: 'plain', surface: sentence[pos] });
      pos += 1;
    }
  }
  return tokens;
}

function buildLookup(catalog) {
  // Build conflict-resolved lookup: prefer noun/verb entries, skip single-char & particle/aux entries
  const candidates = new Map();  // word → [{yomigana, pos, lessons}]
  for (const e of catalog.entries) {
    if (!e.word || e.word.length < 2) continue;  // skip single-char (avoid で/は/タイ false match)
    const acc = e.accent_override || e.accent_yomigana;
    if (!acc) continue;
    const pos = e.bySource?.goi_list_raw?.[0]?.pos1 || '';
    // Skip particles, auxiliary, conjunctions that may shadow real words
    if (['助詞','助動詞','接続詞','感動詞','副詞'].includes(pos)) continue;
    if (!candidates.has(e.word)) candidates.set(e.word, []);
    candidates.get(e.word).push({ yomigana: acc, pos, lessons: e.lessonRefs?.length || 0 });
  }
  const map = new Map();
  for (const [word, list] of candidates) {
    // Prefer entries with more lesson refs, then noun/verb
    list.sort((a, b) => (b.lessons - a.lessons) || 0);
    map.set(word, list[0].yomigana);
  }
  return map;
}

function buildSsml(tokens) {
  const parts = ['<speak>'];
  for (const t of tokens) {
    if (t.kind === 'word') {
      parts.push(wordToSsml(t.surface, t.yomigana));
    } else {
      parts.push(escapeSsml(t.surface));
    }
  }
  parts.push('</speak>');
  return parts.join('');
}

async function main() {
  await loadEnv(ROOT);
  await mkdir(OUT_DIR, { recursive: true });
  const catalog = JSON.parse(await readFile(VOCAB_CATALOG, 'utf8'));
  const lookup = buildLookup(catalog);
  console.log(`Lookup built: ${lookup.size} word entries with accent`);
  const tts = await createTtsClient({ rootDir: ROOT });

  for (const s of SENTENCES) {
    console.log(`\n--- ${s.id}: ${s.text} ---`);
    const tokens = tokenize(s.text, lookup);
    console.log(`  tokens (compound-aware):`);
    for (const t of tokens) {
      console.log(`    ${t.kind === 'word' ? '★' : '・'} ${t.surface} ${t.yomigana || ''}`);
    }
    const ssml = buildSsml(tokens);
    console.log(`  SSML: ${ssml}`);

    try {
      const raw = await synthesize(tts, { ssml, voice: VOICE });
      const qc = await applyQc(raw);
      const fn = resolve(OUT_DIR, `sentence_${s.id}_5_prosody.mp3`);
      await writeFile(fn, qc);
      console.log(`  ✓ saved ${fn} (${qc.length}B)`);
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`output: tmp/sentence_prototype/*_5_prosody.mp3`);
  console.log(`既存 variant と比較:`);
  console.log(`  1_plain_neural2     現行 pipeline 平文`);
  console.log(`  2_wrapped_neural2   per-word phoneme 注入`);
  console.log(`  5_prosody           per-mora prosody pitch 制御 ★今回`);
}

main().catch(e => { console.error(e); process.exit(1); });
