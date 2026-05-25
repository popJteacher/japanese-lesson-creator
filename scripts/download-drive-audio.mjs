#!/usr/bin/env node
// scripts/download-drive-audio.mjs
// Phase α4 ② 本走：master_audio_registry の Drive URL audio (291 件) を
// ローカル化（WAV → ffmpeg loudnorm → MP3）+ registry 書き換え + 自然さ QC inline。
//
// 入力: data/master_audio_registry.json の entry で audioUrl が drive.google.com
// 出力:
//   - data/audio/{audioId}.mp3（ffmpeg loudnorm + 48kHz mono + 96kbps）
//   - registry 更新: audioUrl=ローカルパス, originalAudioUrl=元 Drive URL, audioSource='drive-download'
//   - GEMINI_API_KEY あれば naturalness: { score, confidence, comments, checkedAt, model }
//
// 設計:
//   - registry-as-canon: 既に audioUrl がローカルパスの entry は skip
//   - HARD ERROR にしない（1 件失敗で全体は続行・ログのみ）
//   - registry は 10 件ごと atomic checkpoint
//   - Drive API → メタデータ無し alt=media で arraybuffer 取得
//   - applyQc は ffmpeg 経由なので入力が WAV でも自動検知して MP3 化される
//
// 使い方:
//   node scripts/download-drive-audio.mjs --dry-run         対象一覧
//   node scripts/download-drive-audio.mjs --smoke           1 件 (registry 書き換えなし・tmp/ に保存して終了)
//   node scripts/download-drive-audio.mjs --limit N         先頭 N 件
//   node scripts/download-drive-audio.mjs --only ID1,ID2    特定 audio ID
//   node scripts/download-drive-audio.mjs --force           既にローカル化済みでも再 DL
//   node scripts/download-drive-audio.mjs --no-naturalness  自然さ QC スキップ
//   node scripts/download-drive-audio.mjs --concurrency N   並列 DL 数（既定 4）
//   node scripts/download-drive-audio.mjs                   未ローカル化全件

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { loadEnv } from './lib/sheets-client.mjs';
import { applyQc } from './lib/audio-qc.mjs';
import { checkNaturalness, isWarn as isNaturalnessWarn } from './lib/audio-naturalness-qc.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const REGISTRY_PATH = resolve(ROOT, 'data/master_audio_registry.json');
const AUDIO_DIR = resolve(ROOT, 'data/audio');
const SMOKE_DIR = resolve(ROOT, 'tmp/drive_smoke');
const NATURALNESS_MODEL = 'gemini-2.5-flash';

const DEFAULT_CONCURRENCY = 4;
const CHECKPOINT_EVERY = 10;

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    dryRun: false, smoke: false, force: false, noNaturalness: false,
    limit: null, only: null, concurrency: null, help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--smoke') args.smoke = true;
    else if (a === '--force') args.force = true;
    else if (a === '--no-naturalness') args.noNaturalness = true;
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.slice(8), 10);
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a.startsWith('--only=')) args.only = a.slice(7);
    else if (a === '--only') args.only = argv[++i];
    else if (a.startsWith('--concurrency=')) args.concurrency = parseInt(a.slice(14), 10);
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10);
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`download-drive-audio.mjs — Phase α4 ② Drive 音声ローカル化

使い方:
  --dry-run          対象一覧だけ表示
  --smoke            1 件だけ tmp/drive_smoke/ に保存（registry 書き換え無し）
  --limit N          先頭 N 件
  --only ID1,ID2     特定 audio ID
  --force            既ローカル化済みも再 DL
  --no-naturalness   Gemini 自然さ QC をスキップ
  --concurrency N    並列数（既定 ${DEFAULT_CONCURRENCY}）

環境変数:
  GOOGLE_APPLICATION_CREDENTIALS  必須（SA JSON path）
  GEMINI_API_KEY                  自然さ QC 用（未設定なら自動 skip）
`);
}

// ────────────────────────────────────────────────────────────
// URL パース
// ────────────────────────────────────────────────────────────
function extractFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/[?&]id=([^&]+)|\/d\/([^\/?]+)|\/file\/d\/([^\/?]+)/);
  if (!m) return null;
  return m[1] || m[2] || m[3] || null;
}

function isDriveUrl(u) {
  return typeof u === 'string' && u.includes('drive.google.com');
}

function isLocalPath(u) {
  return typeof u === 'string' && u.startsWith('data/audio/');
}

// ────────────────────────────────────────────────────────────
// 元テキスト lookup（audio ID → text・check-audio-naturalness.mjs と同流儀）
// ────────────────────────────────────────────────────────────
const LESSON_CACHE = new Map();
async function loadLesson(lessonNN) {
  if (LESSON_CACHE.has(lessonNN)) return LESSON_CACHE.get(lessonNN);
  const path = resolve(ROOT, `data/lesson_${lessonNN}.json`);
  try {
    const j = JSON.parse(await readFile(path, 'utf8'));
    LESSON_CACHE.set(lessonNN, j);
    return j;
  } catch (e) {
    if (e.code === 'ENOENT') { LESSON_CACHE.set(lessonNN, null); return null; }
    throw e;
  }
}
function guessLessonNN(audioId) {
  const m = /_L(\d{2})_/.exec(audioId);
  return m ? m[1] : null;
}
async function lookupText(audioId) {
  const nn = guessLessonNN(audioId);
  const candidates = nn ? [nn] : ['01', '02'];
  for (const lessonNN of candidates) {
    const lesson = await loadLesson(lessonNN);
    if (!lesson) continue;
    for (const p of (lesson.patterns || [])) {
      for (const ex of (p.examples || [])) {
        if (ex.audioId === audioId) {
          return { text: ex.sentence, word: ex.vocab || null, lessonNN };
        }
      }
    }
    const byPattern = lesson.vocabulary?.byPattern || {};
    for (const pat of Object.values(byPattern)) {
      for (const w of (pat.words || [])) {
        if (w.audioId === audioId) {
          return { text: w.word, word: w.word, lessonNN };
        }
      }
    }
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// registry I/O
// ────────────────────────────────────────────────────────────
async function readRegistry() {
  return JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
}
async function writeRegistryAtomic(registry) {
  const tmp = REGISTRY_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  await rename(tmp, REGISTRY_PATH);
}

// ────────────────────────────────────────────────────────────
// 対象抽出
// ────────────────────────────────────────────────────────────
function selectTargets(registry, args) {
  const entries = registry.entries || {};
  let ids = Object.keys(entries).filter(id => isDriveUrl(entries[id]?.audioUrl));
  if (args.only) {
    const set = new Set(args.only.split(',').map(s => s.trim()));
    ids = ids.filter(id => set.has(id));
  }
  if (!args.force) {
    // 既に audioUrl がローカルパスの entry は skip（=既にローカル化済み）
    ids = ids.filter(id => isDriveUrl(entries[id].audioUrl));
  }
  if (args.smoke) ids = ids.slice(0, 1);
  else if (args.limit) ids = ids.slice(0, args.limit);
  return ids;
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }

  await loadEnv(ROOT);

  const credsRel = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credsRel) {
    console.error('✗ GOOGLE_APPLICATION_CREDENTIALS が未設定');
    process.exit(1);
  }
  const credsAbs = resolve(ROOT, credsRel);

  const apiKey = process.env.GEMINI_API_KEY;
  const naturalnessEnabled = !args.noNaturalness && !!apiKey;
  const naturalnessLabel = args.noNaturalness
    ? '無効（--no-naturalness）'
    : (apiKey ? `有効 (${NATURALNESS_MODEL})` : '無効（GEMINI_API_KEY 未設定）');

  const registry = await readRegistry();
  const targets = selectTargets(registry, args);
  const totalDrive = Object.values(registry.entries || {}).filter(e => isDriveUrl(e?.audioUrl)).length;
  const alreadyLocal = Object.values(registry.entries || {}).filter(e => isLocalPath(e?.audioUrl)).length;

  console.log('===== download-drive-audio 開始 =====');
  console.log(`  SA creds       : ${credsAbs}`);
  console.log(`  audio dir      : data/audio/`);
  console.log(`  naturalness QC : ${naturalnessLabel}`);
  console.log(`  registry: total local=${alreadyLocal}, total drive=${totalDrive}, target=${targets.length}${args.smoke ? ' [smoke]' : ''}${args.force ? ' [force]' : ''}`);
  if (args.dryRun) console.log('  mode: --dry-run');
  if (args.limit) console.log(`  --limit: ${args.limit}`);

  if (args.dryRun || targets.length === 0) {
    if (args.dryRun) {
      const head = targets.slice(0, 15).map(id => `  - ${id}  ${registry.entries[id].audioUrl}`).join('\n');
      console.log(`先頭 ${Math.min(15, targets.length)} 件:\n${head}`);
      if (targets.length > 15) console.log(`  ... ${targets.length - 15} more`);
    } else {
      console.log('nothing to do.');
    }
    return;
  }

  await mkdir(args.smoke ? SMOKE_DIR : AUDIO_DIR, { recursive: true });

  // Drive auth
  const scope = 'https://www.googleapis.com/auth/drive.readonly';
  const auth = new google.auth.GoogleAuth({ keyFile: credsAbs, scopes: [scope] });
  const drive = google.drive({ version: 'v3', auth });

  const concurrency = args.concurrency || DEFAULT_CONCURRENCY;
  const today = new Date().toISOString().slice(0, 10);

  let done = 0, errCount = 0, naturalnessWarnCount = 0;
  let dlBytes = 0, qcBytes = 0;
  const startedAt = Date.now();

  async function processOne(audioId) {
    const entry = registry.entries[audioId];
    const fileId = extractFileId(entry.audioUrl);
    try {
      if (!fileId) throw new Error(`fileId 抽出失敗: ${entry.audioUrl}`);

      // 1) Download raw bytes from Drive
      const dlResp = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      const rawBuf = Buffer.from(dlResp.data);
      dlBytes += rawBuf.length;

      // 2) ffmpeg loudnorm + encode to MP3 (applyQc handles WAV/MP3 input)
      const qcBuf = await applyQc(rawBuf);
      qcBytes += qcBuf.length;

      // 3) Write to data/audio/{id}.mp3  (smoke は tmp/drive_smoke/)
      const targetDir = args.smoke ? SMOKE_DIR : AUDIO_DIR;
      const outPath = resolve(targetDir, `${audioId}.mp3`);
      const tmpPath = outPath + '.tmp';
      await writeFile(tmpPath, qcBuf);
      await rename(tmpPath, outPath);

      // smoke では registry を触らず終了
      if (args.smoke) {
        console.log(`  ✓ [SMOKE] ${audioId}: raw ${rawBuf.length}B → QC ${qcBuf.length}B → tmp/drive_smoke/${audioId}.mp3`);
        return;
      }

      // 4) registry 更新
      const localRel = `data/audio/${audioId}.mp3`;
      entry.originalAudioUrl = entry.audioUrl;
      entry.audioUrl = localRel;
      entry.audioSource = 'drive-download';
      entry.audioLocalizedAt = today;

      // 5) naturalness QC inline (failure は ERROR にしない・WARN ログのみ)
      let nlogTag = '';
      if (naturalnessEnabled) {
        try {
          const lookup = await lookupText(audioId);
          if (!lookup || !lookup.text) throw new Error('text not found in lesson_NN.json');
          const r = await checkNaturalness({
            audioBuffer: qcBuf, mimeType: 'audio/mp3',
            text: lookup.text, word: lookup.word,
            apiKey, model: NATURALNESS_MODEL,
          });
          entry.naturalness = {
            score: r.score, confidence: r.confidence, comments: r.comments,
            checkedAt: today, model: NATURALNESS_MODEL,
          };
          if (isNaturalnessWarn(entry.naturalness)) {
            naturalnessWarnCount++;
            nlogTag = ` [⚠ naturalness score=${r.score} conf=${r.confidence}${r.comments.length ? ' / ' + r.comments.join(' / ') : ''}]`;
          }
        } catch (e) {
          nlogTag = ` [naturalness fail: ${String(e.message || e).slice(0, 80)}]`;
        }
      }

      console.log(`  ✓ [${done + 1}/${targets.length}] ${audioId}: raw ${rawBuf.length}B → QC ${qcBuf.length}B${nlogTag}`);
    } catch (e) {
      errCount++;
      process.stderr.write(`  ERROR ${audioId} (fileId=${fileId || '?'}): ${String(e.message || e).slice(0, 200)}\n`);
    } finally {
      done++;
      if (!args.smoke && done % CHECKPOINT_EVERY === 0) {
        await writeRegistryAtomic(registry);
      }
      if (done % 25 === 0 || done === targets.length) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = done / Math.max(elapsed, 0.001);
        const eta = (targets.length - done) / Math.max(rate, 0.001);
        process.stderr.write(`  [${done}/${targets.length}] elapsed=${elapsed.toFixed(0)}s rate=${rate.toFixed(2)}/s eta=${eta.toFixed(0)}s err=${errCount} naturalness-warn=${naturalnessWarnCount}\n`);
      }
    }
  }

  const queue = [...targets];
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const id = queue.shift();
      if (!id) break;
      await processOne(id);
    }
  });
  await Promise.all(workers);

  if (!args.smoke) {
    await writeRegistryAtomic(registry);
  }

  console.log('\n===== download-drive-audio 完了 =====');
  console.log(`processed       : ${done}/${targets.length}`);
  console.log(`errors          : ${errCount}`);
  console.log(`naturalness WARN: ${naturalnessWarnCount}`);
  console.log(`raw DL total    : ${(dlBytes / 1024 / 1024).toFixed(2)} MiB`);
  console.log(`QC out total    : ${(qcBytes / 1024 / 1024).toFixed(2)} MiB`);
  if (!args.smoke) console.log(`registry updated: ${REGISTRY_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
