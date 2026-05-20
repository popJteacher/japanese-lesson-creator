// scripts/lib/imagen-client.mjs
// Phase 4 ②：Google AI Studio Imagen 4 のローカル呼び出しクライアント。
// gas/pipeline.gs の generateImageBatch が直接 REST で叩いていた相当をローカルへ。
//
// バックエンド：Google AI Studio（generativelanguage.googleapis.com）
// 認証：Phase 1 で導入済みの GEMINI_API_KEY を流用（SA 不要）
// 既定モデル：imagen-4.0-generate-001（Standard, $0.04/image）
//
// 公開 API:
//   loadEnv(rootDir)                                  .env を process.env に流し込む（既存 sheets-client.mjs を再エクスポート）
//   DEFAULT_IMAGEN_MODEL / IMAGEN_PRICE_USD           既定値
//   generateImage({ prompt, model?, aspectRatio?, imageSize?, personGeneration?, sampleCount? })
//                                                     → { bytes: Buffer, mimeType, model, durationMs, costUsd }
//
// エラーマッピング（① の check-imagen-key と整合）:
//   401 → "GEMINI_API_KEY invalid"
//   403 → "permission denied / project lacks Imagen access"
//   429 → "rate limit exceeded (RPM/RPD)"
//   400 with billing keywords → "billing not enabled (Imagen 4 has no free tier)"
//   その他 4xx/5xx → HTTP status + body 抜粋

import { loadEnv } from './sheets-client.mjs';

export { loadEnv };

export const DEFAULT_IMAGEN_MODEL = 'imagen-4.0-generate-001';

// Imagen 4 価格表（公式 https://ai.google.dev/gemini-api/docs/pricing 2026-05）
export const IMAGEN_PRICE_USD = Object.freeze({
  'imagen-4.0-fast-generate-001':  0.02,
  'imagen-4.0-generate-001':       0.04,
  'imagen-4.0-ultra-generate-001': 0.06,
});

const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const VALID_ASPECT_RATIOS = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);
const VALID_IMAGE_SIZES = new Set(['1K', '2K']);
const VALID_PERSON_GENERATION = new Set(['dont_allow', 'allow_adult', 'allow_all']);

// 一時障害（サーバ側容量不足・upstream timeout）は backoff で粘る。
// 永続障害（400 billing / 401 / 403 / 4xx with validation）は即時失敗。
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRY_DEFAULTS = Object.freeze({
  maxRetries: 4,
  baseDelayMs: 2000,
  jitterMs: 500,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function classifyError(status, bodyText) {
  if (status === 401) return new Error('GEMINI_API_KEY invalid (HTTP 401)');
  if (status === 403) return new Error(`permission denied / project lacks Imagen access (HTTP 403): ${bodyText.slice(0, 300)}`);
  if (status === 429) return new Error(`rate limit / capacity exhausted after retries (HTTP 429): ${bodyText.slice(0, 300)}`);
  if (status === 503) return new Error(`service unavailable after retries (HTTP 503): ${bodyText.slice(0, 300)}`);
  if (status === 400 && /billing|payment|FAILED_PRECONDITION/i.test(bodyText)) {
    return new Error(`billing not enabled — Imagen 4 has no free tier. Enable billing at https://aistudio.google.com/apikey (HTTP 400): ${bodyText.slice(0, 300)}`);
  }
  return new Error(`Imagen API HTTP ${status}: ${bodyText.slice(0, 400)}`);
}

export async function generateImage({
  prompt,
  model = DEFAULT_IMAGEN_MODEL,
  aspectRatio = '1:1',
  imageSize = '1K',
  personGeneration = 'allow_adult',
  sampleCount = 1,
  retry = RETRY_DEFAULTS,
  onRetry = null,
} = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('generateImage: `prompt` (string) is required');
  }
  if (!VALID_ASPECT_RATIOS.has(aspectRatio)) {
    throw new Error(`generateImage: invalid aspectRatio "${aspectRatio}" (allowed: ${[...VALID_ASPECT_RATIOS].join(', ')})`);
  }
  if (!VALID_IMAGE_SIZES.has(imageSize)) {
    throw new Error(`generateImage: invalid imageSize "${imageSize}" (allowed: ${[...VALID_IMAGE_SIZES].join(', ')})`);
  }
  if (!VALID_PERSON_GENERATION.has(personGeneration)) {
    throw new Error(`generateImage: invalid personGeneration "${personGeneration}" (allowed: ${[...VALID_PERSON_GENERATION].join(', ')})`);
  }
  if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 4) {
    throw new Error(`generateImage: sampleCount must be integer 1..4 (got ${sampleCount})`);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing (set in .env; .env.example 参照)');
  }

  const url = `${ENDPOINT_BASE}/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`;
  const body = {
    instances: [{ prompt }],
    parameters: { sampleCount, imageSize, aspectRatio, personGeneration },
  };

  const cfg = { ...RETRY_DEFAULTS, ...(retry || {}) };
  const startedAt = Date.now();
  let lastStatus = 0;
  let lastBody = '';
  let resp;
  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (resp.ok) break;
    lastStatus = resp.status;
    lastBody = await resp.text();
    if (!RETRY_STATUSES.has(resp.status) || attempt === cfg.maxRetries) {
      throw classifyError(lastStatus, lastBody);
    }
    const delay = cfg.baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * cfg.jitterMs);
    if (typeof onRetry === 'function') {
      onRetry({ attempt: attempt + 1, status: lastStatus, delayMs: delay });
    }
    await sleep(delay);
  }
  const durationMs = Date.now() - startedAt;

  const data = await resp.json();
  const predictions = Array.isArray(data.predictions) ? data.predictions : [];
  if (predictions.length === 0) {
    throw new Error(`Imagen response had no predictions: ${JSON.stringify(data).slice(0, 400)}`);
  }
  const first = predictions[0];
  const b64 = first.bytesBase64Encoded;
  if (!b64 || typeof b64 !== 'string') {
    throw new Error(`Imagen prediction missing bytesBase64Encoded: ${JSON.stringify(first).slice(0, 400)}`);
  }
  const bytes = Buffer.from(b64, 'base64');
  const unitPrice = IMAGEN_PRICE_USD[model];
  const costUsd = unitPrice == null ? null : unitPrice * predictions.length;

  return {
    bytes,
    mimeType: first.mimeType || 'image/png',
    model,
    durationMs,
    costUsd,
    sampleCount: predictions.length,
  };
}
