// tmp/yuki_pitch_smoke.mjs
// 「雪」を尾高型 (ユ低→キ高) で発音させる試み。
// 漢字 + 複数の SSML pitch 表現を試して honored されるパターンを探す。

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadEnv, createTtsClient, synthesize } from '../scripts/lib/tts-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/google_smoke_ipa');
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };

await loadEnv(ROOT);
await mkdir(OUT_DIR, { recursive: true });
const tts = await createTtsClient({ rootDir: ROOT });

const hash = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12);

// 様々な pitch accent 指定方法を試す
const PATTERNS = [
  // baseline 参照
  { tag: 'ref_kanji', ssml: '<speak>雪</speak>' },
  // 1. IPA tone level markers (˥=high, ˨=low, ˩=lowest)
  { tag: 'tone_2_5',  ssml: '<speak><phoneme alphabet="ipa" ph="jɯ˨ki˥">雪</phoneme></speak>' },
  { tag: 'tone_1_5',  ssml: '<speak><phoneme alphabet="ipa" ph="jɯ˩ki˥">雪</phoneme></speak>' },
  // 2. IPA upstep ꜛ (逆向きの方向指示)
  { tag: 'upstep',    ssml: '<speak><phoneme alphabet="ipa" ph="jɯꜛki">雪</phoneme></speak>' },
  // 3. SSML <prosody pitch> を mora 単位で（漢字を分割して pitch 指定）
  { tag: 'prosody_pct',  ssml: '<speak><prosody pitch="-10%">ゆ</prosody><prosody pitch="+15%">き</prosody></speak>' },
  { tag: 'prosody_st',   ssml: '<speak><prosody pitch="-3st">ゆ</prosody><prosody pitch="+3st">き</prosody></speak>' },
  { tag: 'prosody_high', ssml: '<speak><prosody pitch="low">ゆ</prosody><prosody pitch="high">き</prosody></speak>' },
  // 4. 漢字 + prosody (漢字を pitch で囲む・全体の傾きだけ)
  { tag: 'prosody_kanji_rise', ssml: '<speak><prosody contour="(0%,-10%) (50%,0%) (100%,+15%)">雪</prosody></speak>' },
  // 5. ローマ字直接 (Google が pitch accent を解釈できるか)
  { tag: 'romaji_yuki',  ssml: '<speak>yuki</speak>' },
  // 6. <sub alias> で完全に置き換え
  { tag: 'sub_alias',  ssml: '<speak><sub alias="ゆきが">雪</sub></speak>' },
];

console.log('tag                 | hash          | (ref_kanji と一致なら ★)');
console.log('-'.repeat(70));
let refHash = null;
for (const p of PATTERNS) {
  const buf = await synthesize(tts, { ssml: p.ssml, voice: VOICE });
  const out = resolve(OUT_DIR, `word_雪__${p.tag}.mp3`);
  await writeFile(out, buf);
  const h = hash(buf);
  if (p.tag === 'ref_kanji') refHash = h;
  const mark = (p.tag !== 'ref_kanji' && h === refHash) ? '  ★同じ音' : '';
  console.log(`${p.tag.padEnd(20)} | ${h}  | ${mark}`);
}

console.log('\n出力先: tmp/google_smoke_ipa/word_雪__{tag}.mp3 (' + PATTERNS.length + ' パターン)');
