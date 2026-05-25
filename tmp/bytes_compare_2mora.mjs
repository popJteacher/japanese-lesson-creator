// tmp/bytes_compare_2mora.mjs
// 2 モーラ尾高型単語について、IPA ꜜ あり vs なしで Google TTS 出力 bytes が
// 一致するか検証。bytes 一致なら「Google が末尾 ꜜ を実質無視している」確定。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadEnv, createTtsClient, synthesize } from '../scripts/lib/tts-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/google_smoke_ipa');
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };

// 2 モーラ尾高型 5 件 (extract_accent_2mora.py 結果から抜粋)
const CASES = [
  { word: '服',   reading: 'ふく',   odaka: 'ɸɯ̥kɯꜜ',  heiban: 'ɸɯ̥kɯ'  },
  { word: '靴',   reading: 'くつ',   odaka: 'kɯ̥t͡sɯꜜ', heiban: 'kɯ̥t͡sɯ' },
  { word: '池',   reading: 'いけ',   odaka: 'ikeꜜ',    heiban: 'ike'    },
  { word: '川',   reading: 'かわ',   odaka: 'kawaꜜ',   heiban: 'kawa'   },
  { word: '山',   reading: 'やま',   odaka: 'jamaꜜ',   heiban: 'jama'   },
];

await loadEnv(ROOT);
await mkdir(OUT_DIR, { recursive: true });
const tts = await createTtsClient({ rootDir: ROOT });

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);

console.log('word  | baseline(ひら) | ipa(ꜜあり) | ipa(ꜜなし) | ꜜ差異');
console.log('-'.repeat(80));

for (const c of CASES) {
  const baseBuf  = await synthesize(tts, { text: c.reading, voice: VOICE });
  const odakaSsml  = `<speak><phoneme alphabet="ipa" ph="${c.odaka}">${c.word}</phoneme></speak>`;
  const heibanSsml = `<speak><phoneme alphabet="ipa" ph="${c.heiban}">${c.word}</phoneme></speak>`;
  const odakaBuf  = await synthesize(tts, { ssml: odakaSsml,  voice: VOICE });
  const heibanBuf = await synthesize(tts, { ssml: heibanSsml, voice: VOICE });
  await writeFile(resolve(OUT_DIR, `word_${c.word}__baseline.mp3`), baseBuf);
  await writeFile(resolve(OUT_DIR, `word_${c.word}__ipa_odaka.mp3`),  odakaBuf);
  await writeFile(resolve(OUT_DIR, `word_${c.word}__ipa_heiban.mp3`), heibanBuf);
  const odakaH  = hash(odakaBuf);
  const heibanH = hash(heibanBuf);
  const same = odakaH === heibanH ? '★bytes 一致 (ꜜ 無効)' : '★bytes 異なる (ꜜ 効いてる)';
  console.log(`${c.word.padEnd(4)} | ${hash(baseBuf)}     | ${odakaH}   | ${heibanH}   | ${same}`);
}

console.log('\n出力先: tmp/google_smoke_ipa/word_<word>__{baseline,ipa_odaka,ipa_heiban}.mp3');
