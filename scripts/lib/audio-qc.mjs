// scripts/lib/audio-qc.mjs
// Phase 3 ④：ffmpeg ベースの音声 QC パイプライン。
// raw mp3 Buffer を受け取り、QC 適用済みの mp3 Buffer を返す。
//
// QC 内容（順番通り単一 ffmpeg 呼び出しで適用）:
//   1. silenceremove  前後の無音をトリム（-50dB / 50ms 単位）
//   2. loudnorm       EBU R128 / -16 LUFS 正規化（true peak -1.5dB）
//   3. afade in       先頭 50ms フェードイン
//   4. afade out      末尾 100ms フェードアウト（areverse トリックで尺非依存）
//
// 出典：注記は NEXT_ACTIONS.md / docs/MIGRATION_PLAN.md Phase 3 ④ 参照。
// GAS では ffmpeg 不可だったため新規獲得機能。
//
// 公開 API:
//   applyQc(inputMp3Buffer, opts) → Promise<Buffer>
//   opts.ffmpegPath  既定: $FFMPEG_PATH || 'ffmpeg'
//   opts.bitrate     既定: '96k'（音声向け、QC 後の音質保持）

import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 単一 -af チェーン。areverse,afade=in,areverse は「末尾フェードアウト」の
// 尺非依存トリック（先頭フェードインを掛けたいから一度反転→フェードイン→戻す）。
const FILTER_CHAIN = [
  'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-50dB:stop_periods=1:stop_duration=0.05:stop_threshold=-50dB:detection=peak',
  'loudnorm=I=-16:TP=-1.5:LRA=11',
  'afade=t=in:st=0:d=0.05',
  'areverse',
  'afade=t=in:st=0:d=0.1',
  'areverse',
].join(',');

export const QC_FILTER_CHAIN = FILTER_CHAIN;

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
    await runFfmpeg(ffmpegPath, [
      '-y',
      '-hide_banner',
      '-loglevel', 'error',
      '-i', inPath,
      '-af', FILTER_CHAIN,
      '-c:a', 'libmp3lame',
      '-b:a', bitrate,
      outPath,
    ]);
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function runFfmpeg(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (e) => {
      if (e.code === 'ENOENT') {
        reject(new Error(`ffmpeg not found at "${ffmpegPath}". Install ffmpeg or set FFMPEG_PATH in .env`));
      } else {
        reject(e);
      }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.trim().slice(-500)}`));
    });
  });
}
