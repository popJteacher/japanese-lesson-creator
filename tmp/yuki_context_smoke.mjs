// tmp/yuki_context_smoke.mjs
// 「ゆき」が人名（頭高）と一般名詞「雪」（尾高）で発音が分かれる可能性を検証。
// 6 パターンで生成し、Google が context をどう解釈するか確認する。

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

const PATTERNS = [
  // 1. ひらがな単独（現状 baseline）
  { tag: 'hira_yuki',       text: 'ゆき' },
  // 2. 漢字単独（Google が漢字「雪」を一般名詞として認識すれば尾高型に）
  { tag: 'kanji_yuki',      text: '雪' },
  // 3. 形容詞+名詞 context（フル文・「雪」部分を聴く）
  { tag: 'context_shiroi',  text: '白い雪' },
  // 4. 名詞+助詞+動詞 context（フル文・「雪」部分を聴く）
  { tag: 'context_furu',    text: '雪が降る' },
  // 5. 名詞+助詞のみ（短い context）
  { tag: 'context_ga',      text: '雪が' },
  // 6. SSML say-as: noun を試す (Google が honored するか不明)
  { tag: 'sayas_word',      ssml: '<speak><say-as interpret-as="characters">雪</say-as></speak>' },
];

for (const p of PATTERNS) {
  const buf = await synthesize(tts, p.ssml ? { ssml: p.ssml, voice: VOICE } : { text: p.text, voice: VOICE });
  const out = resolve(OUT_DIR, `word_雪__${p.tag}.mp3`);
  await writeFile(out, buf);
  console.log(`  ✓ ${p.tag.padEnd(18)} ${p.text || p.ssml.slice(0, 60)}`);
}

console.log('\n出力先: tmp/google_smoke_ipa/word_雪__*.mp3 (6 パターン)');
