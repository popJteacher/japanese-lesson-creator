#!/usr/bin/env node
// scripts/validate-audio.mjs
// Phase 3 ⑤：音声 QC スペック検証。
// data/audio/*.mp3 を ffprobe + ffmpeg (ebur128) で計測し、
// Phase 3 ④ の QC パイプライン出力仕様を満たしているかを判定する。
//
// 検査項目とスペック:
//   codec        = mp3                          QC pipeline 固定出力
//   sample_rate  = 48000 Hz                     Cloud TTS Neural2 ja-JP 出力
//   channels     = 1 (mono)                     同上
//   bit_rate     >= 64,000                      過剰圧縮の検出（QC は 96kbps target）
//   duration     0.15 〜 30.0 秒                 2 文字語（人=ひと 等）の許容下限
//   I (LUFS)     -16 ± 1.5（duration >= 0.5s）  two-pass loudnorm 精度（WARN 閾値）
//                  -16 ± 4.0 を超えると ERROR（pipeline 破綻の検出）
//                  ±1.5〜±4.0 の中間は WARN（TP 制約等で target に届かない正常範囲）
//                  duration < 0.5s は計測不能のため skip（ebur128 gating 制約）
//   TP (dBFS)    <= -1.0                        loudnorm TP=-1.5（測定誤差込み）
//
// 使い方:
//   node scripts/validate-audio.mjs                単独実行・全 mp3 検証
//   node scripts/validate-audio.mjs --json         JSON 出力
//   node scripts/validate-audio.mjs --quiet        PASS 行は省略・違反のみ
//   node scripts/validate-audio.mjs data/audio/X.mp3 個別指定
//
// 終了コード: ERROR が 1 件以上なら 1、それ以外 0
//
// 公開 API:
//   measureAudio(path, opts)         単一ファイル計測 → { codec, sample_rate, ..., I, TP }
//   validateOne(path, measure)       スペック判定 → { errors[], warns[] }
//   runAudioValidation(opts)         data/audio/*.mp3 一括検証 → invariants 形式

import { readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { loadEnv } from './lib/sheets-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const AUDIO_DIR = resolve(ROOT, 'data/audio');

// ────────────────────────────────────────────────────────────
// スペック
// ────────────────────────────────────────────────────────────
export const AUDIO_SPEC = {
  codec: 'mp3',
  sampleRate: 48000,
  channels: 1,
  bitRateMin: 64000,
  durationMin: 0.15,
  durationMax: 30.0,
  lufsTarget: -16,
  // 2 段判定：WARN を越えるとレポートに警告、ERROR を越えると invariant 失敗。
  // 内側に収まらない理由の代表は TP 制約（input_tp が -2dB 付近で +3dB ゲイン
  // をかけると TP -1.5dB を超える → loudnorm が安全に gain を絞る → output_i
  // が target から外れる）。これは pipeline 破綻ではなく content 由来の制約。
  lufsToleranceWarn: 1.5,
  lufsToleranceError: 4.0,
  // ebur128 の integrated loudness は 3 秒 short-term ブロックを使うため、
  // この閾値以下のファイルは I=-70（floor）になる。spec から除外する。
  lufsMeasurableMinDuration: 0.5,
  truePeakMax: -1.0,
};

// ────────────────────────────────────────────────────────────
// 計測
// ────────────────────────────────────────────────────────────
function runCapture(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (e) => {
      if (e.code === 'ENOENT') {
        reject(new Error(`${cmd} not found. Install ffmpeg or set FFMPEG_PATH / FFPROBE_PATH in .env`));
      } else { reject(e); }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exit ${code}: ${stderr.trim().slice(-300)}`));
    });
  });
}

export async function measureAudio(path, opts = {}) {
  const ffmpegPath = opts.ffmpegPath || process.env.FFMPEG_PATH || 'ffmpeg';
  const ffprobePath = opts.ffprobePath || process.env.FFPROBE_PATH || 'ffprobe';

  // ffprobe で codec / sample_rate / channels / bit_rate / duration
  const probe = await runCapture(ffprobePath, [
    '-v', 'error',
    '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration,bit_rate',
    '-of', 'json',
    path,
  ]);
  const meta = JSON.parse(probe.stdout);
  const stream = (meta.streams || [])[0] || {};
  const format = meta.format || {};

  // ffmpeg + ebur128 で LUFS / true peak
  const ebur = await runCapture(ffmpegPath, [
    '-nostats', '-hide_banner',
    '-i', path,
    '-filter:a', 'ebur128=peak=true',
    '-f', 'null', '-',
  ]);
  const text = ebur.stderr;
  // ebur128 は running measurement を毎フレーム stderr に流す（最初は I=-70.0）。
  // 集計結果は最後の "Summary:" ブロックに出る。そこから読む。
  const summaryIdx = text.lastIndexOf('Summary:');
  const summary = summaryIdx >= 0 ? text.slice(summaryIdx) : text;
  const mI = /\bI:\s*(-?\d+(?:\.\d+)?)\s*LUFS/.exec(summary);
  const mTP = /Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/.exec(summary);

  return {
    codec: stream.codec_name || null,
    sample_rate: stream.sample_rate ? parseInt(stream.sample_rate, 10) : null,
    channels: stream.channels ?? null,
    bit_rate: format.bit_rate ? parseInt(format.bit_rate, 10) : null,
    duration: format.duration ? parseFloat(format.duration) : null,
    I: mI ? parseFloat(mI[1]) : null,
    TP: mTP ? parseFloat(mTP[1]) : null,
  };
}

// ────────────────────────────────────────────────────────────
// スペック判定
// ────────────────────────────────────────────────────────────
export function validateOne(filename, m, spec = AUDIO_SPEC) {
  const errors = [];
  const warns = [];
  const tag = `[${filename}]`;
  if (m.codec !== spec.codec) errors.push(`${tag} codec=${m.codec} (期待: ${spec.codec})`);
  if (m.sample_rate !== spec.sampleRate) errors.push(`${tag} sample_rate=${m.sample_rate} (期待: ${spec.sampleRate})`);
  if (m.channels !== spec.channels) errors.push(`${tag} channels=${m.channels} (期待: ${spec.channels})`);
  if (m.bit_rate == null || m.bit_rate < spec.bitRateMin) {
    errors.push(`${tag} bit_rate=${m.bit_rate} (期待: >= ${spec.bitRateMin})`);
  }
  if (m.duration == null || m.duration < spec.durationMin || m.duration > spec.durationMax) {
    errors.push(`${tag} duration=${m.duration} (期待: ${spec.durationMin}-${spec.durationMax})`);
  }
  // LUFS は短尺ファイルでは ebur128 が原理的に測れない（gating block 制約）。
  // duration が閾値未満なら LUFS チェックを skip し、TP のみ確認する。
  const lufsCheckable = m.duration != null && m.duration >= spec.lufsMeasurableMinDuration;
  if (lufsCheckable) {
    if (m.I == null) {
      errors.push(`${tag} LUFS 計測不能（ebur128 出力からパース失敗）`);
    } else {
      const off = Math.abs(m.I - spec.lufsTarget);
      if (off > spec.lufsToleranceError) {
        errors.push(`${tag} I=${m.I} LUFS (期待: ${spec.lufsTarget} ± ${spec.lufsToleranceError} = ERROR 閾値)`);
      } else if (off > spec.lufsToleranceWarn) {
        warns.push(`${tag} I=${m.I} LUFS (target ${spec.lufsTarget} ± ${spec.lufsToleranceWarn} を ${off.toFixed(1)} 超過。TP 制約等で正常範囲)`);
      }
    }
  }
  if (m.TP == null) {
    errors.push(`${tag} TP 計測不能（ebur128 出力からパース失敗）`);
  } else if (m.TP > spec.truePeakMax) {
    errors.push(`${tag} TP=${m.TP} dBFS (期待: <= ${spec.truePeakMax})`);
  }
  return { errors, warns };
}

// ────────────────────────────────────────────────────────────
// バッチ
// ────────────────────────────────────────────────────────────
async function listMp3(dir) {
  let entries;
  try { entries = await readdir(dir); } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  return entries.filter((n) => n.endsWith('.mp3')).sort().map((n) => resolve(dir, n));
}

export async function runAudioValidation(opts = {}) {
  // validate.mjs / invariants.mjs から呼ばれた場合 .env が未 load の可能性。
  // FFMPEG_PATH / FFPROBE_PATH を解決するため自己 loadEnv する（冪等）。
  await loadEnv(ROOT);
  const audioDir = opts.audioDir || AUDIO_DIR;
  const errors = [];
  const warns = [];
  const infos = [];

  const files = await listMp3(audioDir);
  if (files.length === 0) {
    infos.push(`invariants[D] data/audio/ が空 or 不在 → スキップ`);
    return { errors, warns, infos, total: 0, passed: 0 };
  }

  let passed = 0;
  let warned = 0;
  for (const f of files) {
    let m;
    try {
      m = await measureAudio(f, opts);
    } catch (e) {
      errors.push(`invariants[D] ${basename(f)}: 計測失敗: ${e.message}`);
      continue;
    }
    const r = validateOne(basename(f), m);
    if (r.errors.length === 0) {
      passed++;
      if (r.warns.length > 0) warned++;
    }
    for (const e of r.errors) errors.push(`invariants[D] ${e}`);
    for (const w of r.warns) warns.push(`invariants[D] ${w}`);
  }

  infos.push(
    `invariants[D] 音声 QC: ${passed}/${files.length} PASS`
    + (warned > 0 ? `（うち ${warned} WARN）` : '')
    + `（spec: -16±${AUDIO_SPEC.lufsToleranceWarn} LUFS WARN / ±${AUDIO_SPEC.lufsToleranceError} ERROR / TP≤${AUDIO_SPEC.truePeakMax} / mp3 ${AUDIO_SPEC.sampleRate}Hz mono）`
  );
  return { errors, warns, infos, total: files.length, passed, warned };
}

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { json: false, quiet: false, files: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--quiet') args.quiet = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/validate-audio.mjs [--json] [--quiet] [path/to/file.mp3 ...]');
      process.exit(0);
    } else if (a.startsWith('--')) {
      console.error(`Unknown arg: ${a}`); process.exit(2);
    } else {
      args.files.push(resolve(ROOT, a));
    }
  }
  return args;
}

async function mainCli() {
  await loadEnv(ROOT);
  const args = parseArgs(process.argv);

  const targets = args.files.length > 0 ? args.files : await listMp3(AUDIO_DIR);
  if (targets.length === 0) {
    console.log('検査対象 mp3 が無い（data/audio/ が空）');
    process.exit(0);
  }

  let passed = 0;
  let warnedCount = 0;
  const errLines = [];
  const warnLines = [];
  const detail = [];
  for (const f of targets) {
    let m;
    try {
      m = await measureAudio(f);
    } catch (e) {
      errLines.push(`[${basename(f)}] 計測失敗: ${e.message}`);
      continue;
    }
    const r = validateOne(basename(f), m);
    detail.push({ file: basename(f), measure: m, errors: r.errors, warns: r.warns });
    if (r.errors.length === 0) {
      passed++;
      if (r.warns.length > 0) warnedCount++;
    }
    errLines.push(...r.errors);
    warnLines.push(...r.warns);
  }

  if (args.json) {
    process.stdout.write(JSON.stringify({
      spec: AUDIO_SPEC, total: targets.length, passed, warnedCount, files: detail,
    }, null, 2) + '\n');
    process.exit(errLines.length > 0 ? 1 : 0);
  }

  if (!args.quiet) {
    for (const d of detail) {
      const status = d.errors.length > 0 ? '✗' : (d.warns.length > 0 ? '!' : '✓');
      const I = d.measure.I != null ? `${d.measure.I.toFixed(1)} LUFS` : 'I=?';
      const TP = d.measure.TP != null ? `TP=${d.measure.TP.toFixed(1)}` : 'TP=?';
      const dur = d.measure.duration != null ? `${d.measure.duration.toFixed(2)}s` : 'dur=?';
      console.log(`  ${status} ${d.file.padEnd(36)} ${I.padStart(12)}  ${TP.padStart(8)}  ${dur.padStart(7)}`);
    }
  }
  console.log(`\nspec: codec=${AUDIO_SPEC.codec} ${AUDIO_SPEC.sampleRate}Hz mono / bitRate>=${AUDIO_SPEC.bitRateMin} / dur=${AUDIO_SPEC.durationMin}-${AUDIO_SPEC.durationMax}s / I=${AUDIO_SPEC.lufsTarget}±${AUDIO_SPEC.lufsToleranceWarn} LUFS WARN / ±${AUDIO_SPEC.lufsToleranceError} ERROR / TP<=${AUDIO_SPEC.truePeakMax}`);
  console.log(`result: ${passed}/${targets.length} PASS` + (warnedCount > 0 ? ` （うち ${warnedCount} WARN）` : ''));
  if (warnLines.length > 0) {
    console.log(`\nwarns:`);
    for (const w of warnLines) console.log(`  ! ${w}`);
  }
  if (errLines.length > 0) {
    console.log(`\nerrors:`);
    for (const e of errLines) console.log(`  ✗ ${e}`);
  }
  process.exit(errLines.length > 0 ? 1 : 0);
}

// 単独実行のみ CLI を動かす（import 用途は exports を利用）
import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  mainCli().catch((e) => {
    console.error('✗ ' + (e.message || e));
    process.exit(1);
  });
}
