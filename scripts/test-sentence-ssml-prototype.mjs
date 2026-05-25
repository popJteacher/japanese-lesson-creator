#!/usr/bin/env node
// scripts/test-sentence-ssml-prototype.mjs
// 例文の per-word yomigana SSML 注入 prototype。
//
// 流れ:
//   1. fugashi (Python) で sentence を tokenize
//   2. 各 token を vocab_catalog で word lookup
//   3. accent_yomigana ある token は <phoneme alphabet="yomigana"> でラップ
//   4. それ以外 (粒子・助動詞・proper noun 等) は plain
//   5. 結合した SSML を Neural2 / Wavenet で合成
//
// 出力: tmp/sentence_prototype/
//   各 sentence につき 4 variant:
//     1_plain_neural2     現行 pipeline 相当
//     2_wrapped_neural2   per-word phoneme 注入 Neural2
//     3_plain_wavenet     Wavenet 平文
//     4_wrapped_wavenet   per-word phoneme 注入 Wavenet

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';
import { applyQc } from './lib/audio-qc.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/sentence_prototype');
const VOCAB_CATALOG = resolve(ROOT, 'data/vocab_catalog.json');
const VOICE_NEURAL2 = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };
const VOICE_WAVENET = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B' };

// 6 user-specified L02 sentences
const SENTENCES = [
  { id: 'L02_019', text: 'わたしのです。' },
  { id: 'L02_025', text: 'その人はアインシュタインです。' },
  { id: 'L02_026', text: 'あの人はアインシュタインです。' },
  { id: 'L02_028', text: 'ケリーさんのかばんはどのかばんですか。— そのかばんです。' },
  { id: 'L02_030', text: 'ケリーさんの消しゴムはどれですか。— これです。' },
  { id: 'L02_033', text: 'あの山は富士山です。' },
];

function escapeSsml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Run fugashi tokenizer in Python subprocess → JSON token list
async function tokenize(sentence) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', ['-c', `
import sys, json, fugashi
sys.stdout.reconfigure(encoding='utf-8')
t = fugashi.Tagger()
sentence = sys.argv[1]
tokens = []
for w in t(sentence):
    f = w.feature
    tokens.append({
        'surface': w.surface,
        'kana': getattr(f, 'kana', '') or '',
        'pos1': getattr(f, 'pos1', '') or '',
        'pos2': getattr(f, 'pos2', '') or '',
    })
print(json.dumps(tokens, ensure_ascii=False))
`, sentence], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    py.stdout.on('data', d => out += d.toString('utf8'));
    py.stderr.on('data', d => err += d.toString('utf8'));
    py.on('close', code => {
      if (code !== 0) return reject(new Error(`fugashi failed (${code}): ${err}`));
      try { resolve(JSON.parse(out)); }
      catch (e) { reject(new Error(`parse failed: ${out}`)); }
    });
  });
}

// kana → hiragana
const K2H = (() => {
  const K = 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッーヮヰヱヵヶ';
  const H = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんぁぃぅぇぉゃゅょっーゎゐゑゕゖ';
  const m = new Map();
  for (let i = 0; i < K.length; i++) m.set(K[i], H[i]);
  return s => Array.from(s).map(c => m.get(c) || c).join('');
})();

// Look up catalog: try (surface, kana→hira) then (surface) alone (pick first w/ accent)
function buildCatalogLookup(catalog) {
  const byKey = new Map();
  const byWord = new Map();
  for (const e of catalog.entries) {
    if (!e.word) continue;
    const acc = e.accent_override || e.accent_yomigana;
    if (!acc) continue;
    byKey.set(`${e.word}|${e.reading}`, acc);
    if (!byWord.has(e.word)) byWord.set(e.word, acc);  // prefer first w/ accent
  }
  return { byKey, byWord };
}

function lookupAccent(lookup, surface, kana) {
  const reading = K2H(kana);
  const k = `${surface}|${reading}`;
  if (lookup.byKey.has(k)) return lookup.byKey.get(k);
  if (lookup.byWord.has(surface)) return lookup.byWord.get(surface);
  return null;
}

// Build SSML from tokens, wrapping where accent is available
function buildSsml(tokens, lookup) {
  const parts = ['<speak>'];
  for (const t of tokens) {
    const acc = lookupAccent(lookup, t.surface, t.kana);
    if (acc) {
      parts.push(`<phoneme alphabet="yomigana" ph="${escapeSsml(acc)}">${escapeSsml(t.surface)}</phoneme>`);
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
  const lookup = buildCatalogLookup(catalog);
  console.log(`catalog accent lookup built: ${lookup.byWord.size} word, ${lookup.byKey.size} word-reading pairs`);
  const tts = await createTtsClient({ rootDir: ROOT });

  for (const s of SENTENCES) {
    console.log(`\n--- ${s.id}: ${s.text} ---`);
    const tokens = await tokenize(s.text);
    console.log(`  tokens: ${tokens.map(t => t.surface).join(' | ')}`);
    const wrappedSsml = buildSsml(tokens, lookup);
    const plainSsml = `<speak>${escapeSsml(s.text)}</speak>`;
    console.log(`  wrapped SSML: ${wrappedSsml.slice(0, 250)}`);

    const tokensWithAccent = tokens.filter(t => lookupAccent(lookup, t.surface, t.kana));
    console.log(`  accent-wrapped: ${tokensWithAccent.map(t => t.surface).join(',')} (${tokensWithAccent.length}/${tokens.length} tokens)`);

    // 4 variants
    for (const [label, voice, ssml] of [
      ['1_plain_neural2',   VOICE_NEURAL2, plainSsml],
      ['2_wrapped_neural2', VOICE_NEURAL2, wrappedSsml],
      ['3_plain_wavenet',   VOICE_WAVENET, plainSsml],
      ['4_wrapped_wavenet', VOICE_WAVENET, wrappedSsml],
    ]) {
      try {
        const raw = await synthesize(tts, { ssml, voice });
        const qc = await applyQc(raw);
        const fn = resolve(OUT_DIR, `sentence_${s.id}_${label}.mp3`);
        await writeFile(fn, qc);
        console.log(`  ✓ ${label} → ${qc.length}B`);
      } catch (e) {
        console.error(`  ✗ ${label}: ${e.message || e}`);
      }
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`output: ${OUT_DIR}`);
  console.log(`各 sentence 4 variant 試聴:`);
  console.log(`  1_plain_neural2   (現行 pipeline と同等)`);
  console.log(`  2_wrapped_neural2 (per-word phoneme 注入・Neural2)`);
  console.log(`  3_plain_wavenet   (Wavenet 平文)`);
  console.log(`  4_wrapped_wavenet (per-word phoneme 注入・Wavenet)`);
}

main().catch(e => { console.error(e); process.exit(1); });
