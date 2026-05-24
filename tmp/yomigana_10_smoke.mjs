// tmp/yomigana_10_smoke.mjs
// 元の 10 単語を yomigana 記法 ^...! で再生成し、設計の汎用性を確証する。
// accent_data.json の accent_type を accent_type 番目のモーラの後に ! を置く規則で yomigana 化。

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, createTtsClient, synthesize } from '../scripts/lib/tts-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/google_smoke_ipa');
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };

await loadEnv(ROOT);
await mkdir(OUT_DIR, { recursive: true });
const tts = await createTtsClient({ rootDir: ROOT });

// 10 単語と mora 分割（hiragana）+ accent_type（OpenJTalk 抽出結果より）
// yomigana 記法: ^[mora1][mora2]...[!N番目モーラの後][...]
// accent_type=0 → ! なし、N>0 → N 番目モーラの後に !
const WORDS = [
  { id: 'word_安い',     word: '安い',     morae: ['や','す','い'],     accent_type: 2 },
  { id: 'word_七日',     word: '七日',     morae: ['な','の','か'],     accent_type: 3 },
  { id: 'word_消しゴム', word: '消しゴム', morae: ['け','し','ご','む'], accent_type: 4 },
  { id: 'word_雪',       word: '雪',       morae: ['ゆ','き'],           accent_type: 2 },
  { id: 'word_二十日',   word: '二十日',   morae: ['は','つ','か'],     accent_type: 3 },
  { id: 'word_二日',     word: '二日',     morae: ['ふ','つ','か'],     accent_type: 3 },
  { id: 'word_母',       word: '母',       morae: ['は','は'],           accent_type: 1 },
  { id: 'word_夜',       word: '夜',       morae: ['よ','る'],           accent_type: 1 },
  { id: 'word_来年',     word: '来年',     morae: ['ら','い','ね','ん'], accent_type: 4 },
  { id: 'word_六日',     word: '六日',     morae: ['む','い','か'],     accent_type: 3 },
];

function buildYomigana(morae, accent_type) {
  let s = '^';
  for (let i = 0; i < morae.length; i++) {
    s += morae[i];
    if (accent_type > 0 && i + 1 === accent_type) s += '!';
  }
  return s;
}

for (const w of WORDS) {
  const ph = buildYomigana(w.morae, w.accent_type);
  const ssml = `<speak><phoneme alphabet="yomigana" ph="${ph}">${w.word}</phoneme></speak>`;
  const buf = await synthesize(tts, { ssml, voice: VOICE });
  await writeFile(resolve(OUT_DIR, `${w.id}__yomigana.mp3`), buf);
  console.log(`  ✓ ${w.id.padEnd(20)} ph="${ph.padEnd(12)}" (${buf.length}B)`);
}

console.log('\n出力先: tmp/google_smoke_ipa/word_*__yomigana.mp3 (10 件)');
