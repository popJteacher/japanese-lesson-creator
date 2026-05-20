// scripts/lib/audio-qc.mjs
// Phase 3 ④（two-pass 化版）：ffmpeg ベースの音声 QC パイプライン。
// raw mp3 Buffer を受け取り、QC 適用済みの mp3 Buffer を返す。
//
// 2-pass loudnorm 構成：
//   Pass 1（測定）  trim → loudnorm(I=-16, print_format=json) → null   出力捨て・JSON 取得
//   Pass 2（適用）  trim → loudnorm(I=-16, measured_*, linear=true)
//                      → fade in → fade out                              実出力 mp3
//
// なぜ two-pass か:
//   single-pass loudnorm は 3 秒ウィンドウのリアルタイム調整なので、
//   短尺（<3秒）や Q&A 形式（内部 silence 多）の audio で -16 LUFS から
//   2〜4 LUFS ずれることがある（L01_010 等で実測）。two-pass は先に
//   ファイル全体を測ってから線形ゲイン補正をするため精度 ±0.5 LUFS。
//
// 両端 trim は areverse の対称適用（stop_periods=1 を使うと文中 silence
// で stream が打ち切られるため避ける）。末尾フェードアウトも同じ areverse トリック。
//
// 出典：注記は NEXT_ACTIONS.md / docs/MIGRATION_PLAN.md Phase 3 ④ 参照。
// GAS では ffmpeg 不可だったため新規獲得機能。
//
// 公開 API:
//   applyQc(inputMp3Buffer, opts) → Promise<Buffer>
//   opts.ffmpegPath  既定: $FFMPEG_PATH || 'ffmpeg'
//   opts.bitrate     既定: '96k'

import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TRIM_OPTS = 'start_periods=1:start_duration=0.05:start_threshold=-50dB:detection=peak';
const TRIM_CHAIN = [
  `silenceremove=${TRIM_OPTS}`,
  'areverse',
  `silenceremove=${TRIM_OPTS}`,
  'areverse',
].join(',');
const FADE_CHAIN = [
  'afade=t=in:st=0:d=0.05',
  'areverse',
  'afade=t=in:st=0:d=0.1',
  'areverse',
].join(',');

const LOUDNORM_TARGET = 'I=-16:TP=-1.5:LRA=11';

export const QC_PIPELINE = {
  trimChain: TRIM_CHAIN,
  fadeChain: FADE_CHAIN,
  loudnormTarget: LOUDNORM_TARGET,
};

export async function applyQc(inputMp3Buffer, opts = {}) {
  if (!Buffer.isBuffer(inputMp3Buffer) || inputMp3Buffer.length === 0) {
    throw new Error('applyQc requires non-empty Buffer');
  }
  const ffmpegPath = opts.ffmpegPath || process.env.FFMPEG_PATH || 'ffmpeg';
  const bitrate = opts.bitrate || '96k';

  const dir = await mkdtemp(join(tmpdir(), 'audio-qc-'));
  const inPath = join(dir, 'in.mp3');
  const outPath = join(dir, 'out.mp3');
  try {
    await writeFile(inPath, inputMp3Buffer);

    // Pass 1: 測定（trim → loudnorm with print_format → discard）
    const measureFilter = `${TRIM_CHAIN},loudnorm=${LOUDNORM_TARGET}:print_format=json`;
    const pass1 = await runFfmpegCapture(ffmpegPath, [
      '-y', '-hide_banner', '-nostats',
      '-i', inPath,
      '-af', measureFilter,
      '-f', 'null', '-',
    ]);
    const measured = parseLoudnormJson(pass1.stderr);

    // 短尺ファイル（<0.5s 相当）は ebur128 が integrated loudness を測れず
    // input_i が "-inf" を返す。この場合は single-pass にフォールバック
    // （測定値なしで loudnorm を走らせる。精度は落ちるが crash しない）。
    const inputIVal = parseFloat(measured.input_i);
    const canTwoPass = Number.isFinite(inputIVal) && inputIVal > -99 && inputIVal < 0;

    const applyLoudnorm = canTwoPass
      ? `loudnorm=${LOUDNORM_TARGET}`
        + `:measured_I=${measured.input_i}`
        + `:measured_TP=${measured.input_tp}`
        + `:measured_LRA=${measured.input_lra}`
        + `:measured_thresh=${measured.input_thresh}`
        + `:offset=${measured.target_offset}`
        + `:linear=true`
      : `loudnorm=${LOUDNORM_TARGET}`;
    const applyFilter = `${TRIM_CHAIN},${applyLoudnorm},${FADE_CHAIN}`;
    await runFfmpegStrict(ffmpegPath, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', inPath,
      '-af', applyFilter,
      '-c:a', 'libmp3lame', '-b:a', bitrate,
      '-ar', '48000',  // libmp3lame は長尺×低 bitrate で 24kHz に勝手に落とすので固定
      outPath,
    ]);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// loudnorm print_format=json は stderr に複数行の JSON ブロックを吐く。
// "target_offset" を含む JSON オブジェクトを抜き出す。
function parseLoudnormJson(stderr) {
  const m = /\{[\s\S]*?"target_offset"\s*:\s*"[^"]*"\s*\}/.exec(stderr);
  if (!m) {
    throw new Error('loudnorm first-pass JSON が ffmpeg stderr から見つからない\n' + stderr.slice(-500));
  }
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    throw new Error(`loudnorm JSON parse 失敗: ${e.message}\nraw: ${m[0]}`);
  }
}

// 終了コードに関わらず stdout/stderr を返す（measure pass 用）
function runFfmpegCapture(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (e) => {
      if (e.code === 'ENOENT') {
        reject(new Error(`ffmpeg not found at "${ffmpegPath}". Install ffmpeg or set FFMPEG_PATH in .env`));
      } else { reject(e); }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`ffmpeg measure pass exit ${code}: ${stderr.trim().slice(-500)}`));
    });
  });
}

// 失敗時にエラーを投げる版（apply pass 用）
function runFfmpegStrict(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (e) => {
      if (e.code === 'ENOENT') {
        reject(new Error(`ffmpeg not found at "${ffmpegPath}". Install ffmpeg or set FFMPEG_PATH in .env`));
      } else { reject(e); }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg apply pass exit ${code}: ${stderr.trim().slice(-500)}`));
    });
  });
}
