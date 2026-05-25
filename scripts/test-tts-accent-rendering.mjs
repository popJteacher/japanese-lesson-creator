#!/usr/bin/env node
// scripts/test-tts-accent-rendering.mjs
// TTS accent rendering 診断テスト。
// 同じ単語を 4 variant で合成して、Neural2 が phoneme alphabet="yomigana" を
// honor しているかどうかを A/B 視聴で切り分ける。
//
// 出力: tmp/tts_test/<word>_<variant>.mp3
// 各単語につき 4 ファイル:
//   1_plain        — 平文 (SSML なし、TTS 自前の accent 推定)
//   2_correct      — SSML + yomigana 正解 accent
//   3_wrong        — SSML + yomigana 意図的に間違った accent (反対側)
//   4_wavenet      — Wavenet voice + yomigana 正解 accent (比較ボイス)
//
// 診断ロジック:
//   - 2 と 3 が同じに聞こえる → Neural2 は yomigana を無視している（バグ確定）
//   - 1 と 2 が同じに聞こえる → 元から TTS は同じ accent を出す（yomigana は無効でも結果同じ）
//   - 2 と 4 が大きく違う → voice 違いの影響大

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir } from 'node:fs/promises';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'tmp/tts_test');

// 単語 + 正解 yomigana + 意図的に間違えた yomigana (accent core 位置を反対側にする)
const TESTS = [
  { word: 'カレンダー', correct: '^かれ!んだー',   wrong: '^かれんだー!' },     // 中高 2 vs 尾高 5
  { word: 'クラス',     correct: '^く!らす',       wrong: '^くらす' },           // 頭高 1 vs 平板
  { word: '駅',         correct: '^え!き',         wrong: '^えき' },             // 頭高 1 vs 平板
  { word: '親切',       correct: '^し!んせつ',     wrong: '^しんせつ' },         // 頭高 1 vs 平板
  { word: '帰る',       correct: '^か!える',       wrong: '^かえる' },           // 頭高 1 vs 平板
  { word: '青い',       correct: '^あお!い',       wrong: '^あおい' },           // 中高 2 vs 平板
];

const VOICE_NEURAL2 = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };
const VOICE_WAVENET = { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B' };

function escapeSsml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function main() {
  await loadEnv(ROOT);
  await mkdir(OUT_DIR, { recursive: true });
  const tts = await createTtsClient({ rootDir: ROOT });

  console.log('===== TTS accent rendering diagnostic =====');
  console.log(`output: tmp/tts_test/`);
  console.log(`tests: ${TESTS.length} 単語 × 4 variant = ${TESTS.length * 4} ファイル`);

  for (const t of TESTS) {
    console.log(`\n--- ${t.word} ---`);
    const baseId = t.word;

    // 1 plain
    {
      const buf = await synthesize(tts, { text: t.word, voice: VOICE_NEURAL2 });
      const fn = resolve(OUT_DIR, `${baseId}_1_plain.mp3`);
      await writeFile(fn, buf);
      console.log(`  ✓ 1_plain (Neural2, no SSML) → ${buf.length}B`);
    }

    // 2 correct phoneme yomigana on Neural2
    {
      const ssml = `<speak><phoneme alphabet="yomigana" ph="${escapeSsml(t.correct)}">${escapeSsml(t.word)}</phoneme></speak>`;
      const buf = await synthesize(tts, { ssml, voice: VOICE_NEURAL2 });
      const fn = resolve(OUT_DIR, `${baseId}_2_correct.mp3`);
      await writeFile(fn, buf);
      console.log(`  ✓ 2_correct (Neural2, yomigana=${t.correct}) → ${buf.length}B`);
    }

    // 3 intentionally wrong phoneme yomigana on Neural2
    {
      const ssml = `<speak><phoneme alphabet="yomigana" ph="${escapeSsml(t.wrong)}">${escapeSsml(t.word)}</phoneme></speak>`;
      const buf = await synthesize(tts, { ssml, voice: VOICE_NEURAL2 });
      const fn = resolve(OUT_DIR, `${baseId}_3_wrong.mp3`);
      await writeFile(fn, buf);
      console.log(`  ✓ 3_wrong   (Neural2, yomigana=${t.wrong}) → ${buf.length}B`);
    }

    // 4 correct phoneme yomigana on Wavenet
    {
      const ssml = `<speak><phoneme alphabet="yomigana" ph="${escapeSsml(t.correct)}">${escapeSsml(t.word)}</phoneme></speak>`;
      const buf = await synthesize(tts, { ssml, voice: VOICE_WAVENET });
      const fn = resolve(OUT_DIR, `${baseId}_4_wavenet.mp3`);
      await writeFile(fn, buf);
      console.log(`  ✓ 4_wavenet (Wavenet,  yomigana=${t.correct}) → ${buf.length}B`);
    }
  }

  console.log('\n=== 完了 ===');
  console.log('視聴ガイド (各単語につき):');
  console.log('  1 vs 2: TTS 自前推定 vs yomigana 正解指定 → 同じなら yomigana 無視');
  console.log('  2 vs 3: yomigana 正解 vs 意図的に間違い  → 同じなら Neural2 が phoneme を無視している証拠');
  console.log('  2 vs 4: Neural2 vs Wavenet (両方 yomigana 正解) → voice 系統の差を見る');
}

main().catch(e => { console.error(e); process.exit(1); });
