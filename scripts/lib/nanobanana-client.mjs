// scripts/lib/nanobanana-client.mjs
// Phase 4 後：Google AI Studio Nano Banana family（Gemini *-flash-image / *-pro-image）
// のローカル呼び出しクライアント。Imagen 4 client（lib/imagen-client.mjs）と
// 同じ位置付け（同じ GEMINI_API_KEY 流用、同じ retry/backoff 規律）。
//
// バックエンド：Google AI Studio（generativelanguage.googleapis.com）
// メソッド：`{model}:generateContent`（Imagen 4 の `:predict` とは別）
// 認証：Phase 1 で導入済みの GEMINI_API_KEY を流用（SA 不要）
// 既定モデル：gemini-2.5-flash-image（Nano Banana / v3.11.1 で user 手動検証済）
//
// 公開 API:
//   loadEnv(rootDir)                     .env を process.env に流し込む（imagen-client から再エクスポート）
//   DEFAULT_NANOBANANA_MODEL             既定値 = 'gemini-2.5-flash-image'
//   NANOBANANA_MODELS                    既知 3 モデルの Set
//   NANOBANANA_PRICE_PER_M_OUTPUT_TOKENS 単価（$/M output tokens・未確定モデルは null）
//   NANOBANANA_IMAGE_TOKEN_ESTIMATE      1 画像あたりの推定 output token 数（公式 ~1290）
//   estimateNanobananaCost(model, totalOutputTokens) → number | null
//   generateNanobananaImage({ prompt, model?, responseModalities?, retry?, onRetry? })
//                                        → { bytes: Buffer, mimeType, model, durationMs,
//                                            costUsd, sampleCount, usageMetadata }
//
// Imagen 4 client との差分（重要）:
//   - aspectRatio / imageSize / personGeneration API パラメータ未対応
//     → プロンプト inline directive（v3.11.1 で導入済）に頼る。指定不可。
//   - cost が token ベース（Imagen 4 は枚数ベース固定単価）
//     → 公式 ~1290 tokens/image × $30/M = ~$0.0387/image (Nano Banana の場合)
//     → 実コストは usageMetadata.candidatesTokenCount から都度算出
//   - 1 リクエストで複数枚生成は API レベルではサポートされるが本 client は 1 枚固定
//
// エラーマッピング（imagen-client.mjs と統一）:
//   401 → "GEMINI_API_KEY invalid"
//   403 → "permission denied / project lacks Nano Banana access"
//   429 → "rate limit exceeded (RPM/RPD)"
//   400 with billing keywords → "billing not enabled"
//   その他 4xx/5xx → HTTP status + body 抜粋

import { loadEnv } from './sheets-client.mjs';

export { loadEnv };

export const DEFAULT_NANOBANANA_MODEL = 'gemini-2.5-flash-image';

// 既知 3 モデル（2026-05-21 ListModels で実機確認）
export const NANOBANANA_MODELS = Object.freeze(new Set([
  'gemini-2.5-flash-image',          // displayName: Nano Banana（v3.11.1 7 件検証で使用）
  'gemini-3-pro-image-preview',      // displayName: Nano Banana Pro
  'gemini-3.1-flash-image-preview',  // displayName: Nano Banana 2
]));

// 単価（$ per 1M output tokens）
// 公式 https://ai.google.dev/gemini-api/docs/pricing 2026-05 時点
// preview 系は要 verify のため null（実機 token 数 + 実コストから後で確定）
export const NANOBANANA_PRICE_PER_M_OUTPUT_TOKENS = Object.freeze({
  'gemini-2.5-flash-image':         30.00,  // Nano Banana: $30/M out tokens
  'gemini-3-pro-image-preview':     null,   // Nano Banana Pro: TBD
  'gemini-3.1-flash-image-preview': null,   // Nano Banana 2: TBD
});

// 1 画像あたりの output token 数の経験的推定（公式 docs より）
// 実際の token 数は usageMetadata.candidatesTokenCount から取れるため、
// 本定数は preview 系で実機呼び出し前に「だいたい何ドル」を見積もる用途のみ。
export const NANOBANANA_IMAGE_TOKEN_ESTIMATE = 1290;

const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const VALID_RESPONSE_MODALITIES = new Set(['TEXT', 'IMAGE']);

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRY_DEFAULTS = Object.freeze({
  maxRetries: 4,
  baseDelayMs: 2000,
  jitterMs: 500,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function classifyError(status, bodyText) {
  if (status === 401) return new Error('GEMINI_API_KEY invalid (HTTP 401)');
  if (status === 403) return new Error(`permission denied / project lacks Nano Banana access (HTTP 403): ${bodyText.slice(0, 300)}`);
  if (status === 429) return new Error(`rate limit / capacity exhausted after retries (HTTP 429): ${bodyText.slice(0, 300)}`);
  if (status === 503) return new Error(`service unavailable after retries (HTTP 503): ${bodyText.slice(0, 300)}`);
  if (status === 400 && /billing|payment|FAILED_PRECONDITION/i.test(bodyText)) {
    return new Error(`billing not enabled — Nano Banana は無料枠なし。Enable billing at https://aistudio.google.com/apikey (HTTP 400): ${bodyText.slice(0, 300)}`);
  }
  return new Error(`Nano Banana API HTTP ${status}: ${bodyText.slice(0, 400)}`);
}

/**
 * 公式 token 数から cost を算出。preview 系の未確定モデルは null を返す。
 * @param {string} model モデル名
 * @param {number} totalOutputTokens usageMetadata.candidatesTokenCount（または totalTokenCount - prompt 分）
 * @returns {number|null} USD（null は単価未設定）
 */
export function estimateNanobananaCost(model, totalOutputTokens) {
  const pricePerM = NANOBANANA_PRICE_PER_M_OUTPUT_TOKENS[model];
  if (pricePerM == null) return null;
  if (!Number.isFinite(totalOutputTokens) || totalOutputTokens <= 0) return null;
  return (totalOutputTokens / 1_000_000) * pricePerM;
}

/**
 * Nano Banana で 1 枚 PNG を生成する。
 *
 * @param {object} opts
 * @param {string} opts.prompt          プロンプト本文（aspect ratio directive は本文に含めること）
 * @param {string} [opts.model]         既定 'gemini-2.5-flash-image'
 * @param {string[]} [opts.responseModalities] 既定 ['IMAGE']（'TEXT' を含めるとテキストも返す可能性）
 * @param {object} [opts.retry]         retry 設定（既定 RETRY_DEFAULTS）
 * @param {function} [opts.onRetry]     ({ attempt, status, delayMs }) => void
 * @returns {Promise<{ bytes: Buffer, mimeType: string, model: string, durationMs: number,
 *                     costUsd: number|null, sampleCount: number, usageMetadata: object|null }>}
 */
export async function generateNanobananaImage({
  prompt,
  model = DEFAULT_NANOBANANA_MODEL,
  responseModalities = ['IMAGE'],
  retry = RETRY_DEFAULTS,
  onRetry = null,
} = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('generateNanobananaImage: `prompt` (string) is required');
  }
  if (!NANOBANANA_MODELS.has(model)) {
    throw new Error(`generateNanobananaImage: unknown model "${model}" (allowed: ${[...NANOBANANA_MODELS].join(', ')})`);
  }
  if (!Array.isArray(responseModalities) || responseModalities.length === 0) {
    throw new Error('generateNanobananaImage: responseModalities must be non-empty array');
  }
  for (const m of responseModalities) {
    if (!VALID_RESPONSE_MODALITIES.has(m)) {
      throw new Error(`generateNanobananaImage: invalid responseModality "${m}" (allowed: ${[...VALID_RESPONSE_MODALITIES].join(', ')})`);
    }
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing (set in .env; .env.example 参照)');
  }

  const url = `${ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities,
    },
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
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  if (candidates.length === 0) {
    throw new Error(`Nano Banana response had no candidates: ${JSON.stringify(data).slice(0, 400)}`);
  }
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error(`Nano Banana candidate had no parts: ${JSON.stringify(candidates[0]).slice(0, 400)}`);
  }
  // 最初の inlineData (image/*) パートを採用。Text パートは無視（responseModalities 次第で来うる）。
  const imagePart = parts.find(p => p?.inlineData?.data && /^image\//i.test(p.inlineData.mimeType || ''));
  if (!imagePart) {
    const finishReason = candidates[0]?.finishReason;
    const textOnly = parts.map(p => p.text || '').filter(Boolean).join(' / ').slice(0, 200);
    throw new Error(
      `Nano Banana response had no image part (finishReason=${finishReason}, text="${textOnly}"). `
      + `Full: ${JSON.stringify(candidates[0]).slice(0, 400)}`
    );
  }
  const bytes = Buffer.from(imagePart.inlineData.data, 'base64');
  const mimeType = imagePart.inlineData.mimeType || 'image/png';

  const usageMetadata = data.usageMetadata || null;
  // candidatesTokenCount が output token 数（公式 ~1290/image）
  const outputTokens = usageMetadata?.candidatesTokenCount
    ?? (usageMetadata?.totalTokenCount != null && usageMetadata?.promptTokenCount != null
        ? usageMetadata.totalTokenCount - usageMetadata.promptTokenCount
        : null);
  const costUsd = estimateNanobananaCost(model, outputTokens ?? 0);

  return {
    bytes,
    mimeType,
    model,
    durationMs,
    costUsd,
    sampleCount: 1,
    usageMetadata,
  };
}
