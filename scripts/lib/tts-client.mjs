// scripts/lib/tts-client.mjs
// Phase 3 ②：Cloud Text-to-Speech ローカルクライアント。
// gas/pipeline.gs の generateAudioBatch が UrlFetchApp 経由で叩いていた
// texttospeech.googleapis.com/v1/text:synthesize をローカルから等価に呼ぶ。
//
// 公開 API:
//   loadEnv(rootDir)              .env を process.env に流し込む（sheets-client から re-export）
//   createTtsClient(opts)         認証込みの texttospeech v1 クライアントを返す
//   synthesize(client, params)    テキスト → mp3 Buffer
//   DEFAULT_VOICE / DEFAULT_AUDIO_CONFIG  既定値（②〜③ で利用）

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { google } from 'googleapis';

export { loadEnv } from './sheets-client.mjs';

// ────────────────────────────────────────────────────────────
// 既定ボイス・音声形式
//   ja-JP-Neural2-B は GAS generateAudioBatch と同じ系統（女性・教科書ナレ向き）。
//   ②〜③ ではこれを base にし、④ で QC 前提のチューニングを入れる。
// ────────────────────────────────────────────────────────────
export const DEFAULT_VOICE = {
  languageCode: 'ja-JP',
  name: 'ja-JP-Neural2-B',
};

export const DEFAULT_AUDIO_CONFIG = {
  audioEncoding: 'MP3',
};

// ────────────────────────────────────────────────────────────
// 認証クライアント生成
//   keyFile を opts で受け取る（テスタビリティのため）。未指定なら .env の
//   GOOGLE_APPLICATION_CREDENTIALS を使う（Phase 2 sheets-sa.json と同居）。
// ────────────────────────────────────────────────────────────
export async function createTtsClient({ rootDir, keyFile } = {}) {
  const credsRel = keyFile || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credsRel) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS missing (set in .env or pass keyFile)');
  }
  const absCreds = rootDir ? resolve(rootDir, credsRel) : resolve(credsRel);
  // 早期に存在確認（googleapis のエラーは分かりにくいため）
  await readFile(absCreds, 'utf8');

  const auth = new google.auth.GoogleAuth({
    keyFile: absCreds,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const tts = google.texttospeech({ version: 'v1', auth });
  return { tts, credentialsPath: absCreds };
}

// ────────────────────────────────────────────────────────────
// テキスト合成
//   戻り値: mp3 形式の Buffer（audioConfig.audioEncoding='MP3' 既定）
//   text または ssml のどちらかを必須とする。両方渡したら ssml 優先。
// ────────────────────────────────────────────────────────────
export async function synthesize(client, params = {}) {
  const { text, ssml, voice = DEFAULT_VOICE, audioConfig = DEFAULT_AUDIO_CONFIG } = params;
  if (!text && !ssml) {
    throw new Error('synthesize requires `text` or `ssml`');
  }
  const input = ssml ? { ssml } : { text };

  const resp = await client.tts.text.synthesize({
    requestBody: { input, voice, audioConfig },
  });
  const b64 = resp.data.audioContent;
  if (!b64) {
    throw new Error('TTS response missing audioContent');
  }
  return Buffer.from(b64, 'base64');
}
