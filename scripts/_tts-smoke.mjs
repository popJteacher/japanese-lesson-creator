#!/usr/bin/env node
// scripts/_tts-smoke.mjs
// Phase 3 ② のスモークテスト。Neural2-B で 1 件だけ合成し
// .tmp_verify/_tts_smoke.mp3 に書き出す。
//
// 使い方:
//   node scripts/_tts-smoke.mjs
//
// 成功条件:
//   - .tmp_verify/_tts_smoke.mp3 が出力される
//   - 先頭が ID3 タグ または MPEG sync ワード（0xFFEx）で始まる
//
// 課金:
//   1 回 14 文字 × Neural2 = 月間無料枠 100 万文字に対し誤差。
//   何度走らせてもコスト事故にはならない。

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const SMOKE_TEXT = 'こんにちは。これはテストです。';
const VOICE_NAME = 'ja-JP-Neural2-B';
const OUT_DIR = resolve(ROOT, '.tmp_verify');
const OUT_PATH = resolve(OUT_DIR, '_tts_smoke.mp3');

function isMp3(buf) {
  if (buf.length < 3) return false;
  if (buf.subarray(0, 3).toString('ascii') === 'ID3') return true;
  // MPEG sync: 11 bits of 1 → 0xFF then top 3 bits of next byte
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

async function main() {
  await loadEnv(ROOT);
  const client = await createTtsClient({ rootDir: ROOT });

  const audio = await synthesize(client, {
    text: SMOKE_TEXT,
    voice: { languageCode: 'ja-JP', name: VOICE_NAME },
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, audio);

  const headerHex = Array.from(audio.subarray(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  const headerKind = audio.subarray(0, 3).toString('latin1') === 'ID3' ? 'ID3 tag' : 'MPEG sync';
  const valid = isMp3(audio);

  console.log('✓ Cloud TTS 合成 OK');
  console.log(`  text:    ${SMOKE_TEXT}`);
  console.log(`  voice:   ${VOICE_NAME}`);
  console.log(`  size:    ${audio.length} bytes`);
  console.log(`  header:  ${headerHex} (${headerKind}, mp3 valid: ${valid})`);
  console.log(`  out:     ${OUT_PATH}`);

  if (!valid) {
    console.error('✗ Audio header does not look like mp3');
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
