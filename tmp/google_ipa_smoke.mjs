// tmp/google_ipa_smoke.mjs
// tmp/google_smoke_ipa/accent_data.json を読み、Google Cloud TTS に
// SSML <phoneme alphabet="ipa" ph="..."> で送信。baseline (ひら直書き) と
// ipa (IPA + downstep ꜜ) の 2 パターンを生成し、tmp/google_smoke_ipa/ に保存。
//
// 検証目的：Google Cloud TTS Neural2-B が IPA tone marker (ꜜ) を honored か。
// もし pitch が変わって聞こえれば、OpenJTalk の accent を Google に渡せる
// pipeline が成立する。変わらなければ Google は構造的に不適と確定。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, createTtsClient, synthesize } from '../scripts/lib/tts-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/google_smoke_ipa');
const ACCENT_JSON = resolve(OUT_DIR, 'accent_data.json');
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };

await loadEnv(ROOT);
await mkdir(OUT_DIR, { recursive: true });
const tts = await createTtsClient({ rootDir: ROOT });

const entries = JSON.parse(await readFile(ACCENT_JSON, 'utf8'));

// XML/SSML 用エスケープ
function escapeForSsml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const READING_HIRA = {
  word_安い: 'やすい', word_七日: 'なのか', word_消しゴム: 'けしごむ',
  word_雪: 'ゆき', word_二十日: 'はつか', word_二日: 'ふつか',
  word_母: 'はは', word_夜: 'よる', word_来年: 'らいねん', word_六日: 'むいか',
};

for (const e of entries) {
  if (e.error) { console.error(`  ✗ ${e.id} extract error: ${e.error}`); continue; }
  const hira = READING_HIRA[e.id];

  // baseline: ひら直書き
  const baseBuf = await synthesize(tts, { text: hira, voice: VOICE });
  await writeFile(resolve(OUT_DIR, `${e.id}__baseline.mp3`), baseBuf);

  // ipa: SSML <phoneme alphabet="ipa" ph="..."> で OpenJTalk 抽出 IPA を渡す
  const ssml = `<speak><phoneme alphabet="ipa" ph="${escapeForSsml(e.ipa)}">${escapeForSsml(e.word)}</phoneme></speak>`;
  try {
    const ipaBuf = await synthesize(tts, { ssml, voice: VOICE });
    await writeFile(resolve(OUT_DIR, `${e.id}__ipa.mp3`), ipaBuf);
    console.log(`  ✓ ${e.id.padEnd(20)} accent=${e.accent_type}/${e.mora_count}  ipa="${e.ipa}"`);
  } catch (err) {
    console.error(`  ✗ ${e.id} ipa synth failed: ${String(err.message || err).slice(0, 200)}`);
  }
}

console.log(`\n出力先: tmp/google_smoke_ipa/ (各単語 __baseline.mp3 と __ipa.mp3 が並ぶ)`);
