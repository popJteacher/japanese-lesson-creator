#!/usr/bin/env node
// scripts/check-accent-cross.mjs
// Phase α3 後半：vocab_catalog.json の accent_yomigana を Gemini 2.5 Flash で
// NHK 標準アクセントとの整合性 cross-check し、不一致を _meta.accent_review_queue に flag。
//
// 入力:  data/vocab_catalog.json の entry で accent_yomigana を持つもの
// 出力:  各 entry に accent_review: { verdict, suggested_yomigana, confidence, note, checkedAt, model }
//        _meta.accent_review_queue: shouldReview()=true な key の配列
//        _meta.accent_cross_checked_at, _meta.accent_review_summary
//
// 使い方:
//   node scripts/check-accent-cross.mjs --dry-run               対象一覧と概算コスト
//   node scripts/check-accent-cross.mjs --smoke                 1 batch (20 件) だけで疎通＋プロンプト確認
//   node scripts/check-accent-cross.mjs --limit 100             先頭 100 件
//   node scripts/check-accent-cross.mjs --only key1,key2        指定 key のみ
//   node scripts/check-accent-cross.mjs --force                 既に accent_review 付きでも再走
//   node scripts/check-accent-cross.mjs                         未走の全件
//
// 設計:
//   - batch 20 entries / call（コスト圧縮・order を key で復元）
//   - HARD ERROR にしない（1 batch 失敗しても続行）
//   - registry は atomic write（tmp → rename）
//   - 5 batch (= 100 件) ごとに checkpoint

import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { checkAccentBatch, shouldReview } from './lib/accent-cross-check.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CATALOG_PATH = resolve(ROOT, 'data/vocab_catalog.json');
const MODEL = 'gemini-2.5-flash';
const BATCH_SIZE = 20;

const RATE_DEFAULTS = { rpm: 1000, rpd: 100_000, concurrency: 4 };
const BACKOFF = { maxRetries: 5, baseDelayMs: 1000, jitterMs: 250 };
const CHECKPOINT_EVERY_BATCH = 5;

// ────────────────────────────────────────────────────────────
// .env loader
// ────────────────────────────────────────────────────────────
async function loadEnv() {
  const envPath = resolve(ROOT, '.env');
  try {
    const raw = await readFile(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
      if (!m) continue;
      const [, key, val] = m;
      if (process.env[key] === undefined) {
        process.env[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    dryRun: false, smoke: false, force: false,
    limit: null, only: null, concurrency: null, help: false,
    batchSize: BATCH_SIZE,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--smoke') args.smoke = true;
    else if (a === '--force') args.force = true;
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.slice('--limit='.length), 10);
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a.startsWith('--only=')) args.only = a.slice('--only='.length);
    else if (a === '--only') args.only = argv[++i];
    else if (a.startsWith('--concurrency=')) args.concurrency = parseInt(a.slice('--concurrency='.length), 10);
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10);
    else if (a.startsWith('--batch=')) args.batchSize = parseInt(a.slice('--batch='.length), 10);
    else if (a === '--batch') args.batchSize = parseInt(argv[++i], 10);
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`check-accent-cross.mjs — Phase α3 後半 アクセント LLM cross-check（Gemini 2.5 Flash）

使い方:
  --dry-run         対象 entry 数と概算コストだけ表示
  --smoke           1 batch (${BATCH_SIZE} 件) だけ実走（疎通＋プロンプト動作確認 ~$0.001）
  --limit N         先頭 N 件のみ
  --only k1,k2      指定 key のみ
  --force           既に accent_review 付きでも再走
  --concurrency N   並列 batch call 数（既定 ${RATE_DEFAULTS.concurrency}）
  --batch N         1 batch あたりの entry 数（既定 ${BATCH_SIZE}）

環境変数:
  GEMINI_API_KEY    必須
  GEMINI_FLASH_RPM  Flash RPM 上限（既定 ${RATE_DEFAULTS.rpm}）
  GEMINI_FLASH_RPD  Flash RPD 上限（既定 ${RATE_DEFAULTS.rpd}）

出力先: data/vocab_catalog.json（atomic 上書き）
  各 entry に accent_review: { verdict: 'ok'|'wrong'|'unsure', suggested_yomigana,
                                confidence, note, checkedAt, model }
  _meta.accent_review_queue: shouldReview() を満たす key の配列
  _meta.accent_cross_checked_at, _meta.accent_review_summary
`);
}

// ────────────────────────────────────────────────────────────
// レート制限
// ────────────────────────────────────────────────────────────
function makeRateLimiter({ rpm, rpd }) {
  const recent = [];
  let dailyCount = 0;
  return {
    async acquire() {
      if (dailyCount >= rpd) {
        throw new Error(`RPD 上限到達（${rpd}/日）。明日再実行してください。`);
      }
      const now = Date.now();
      const cutoff = now - 60_000;
      while (recent.length && recent[0] < cutoff) recent.shift();
      if (recent.length >= rpm) {
        const waitMs = recent[0] + 60_000 - now + 50;
        process.stderr.write(`  rate-limit: sleep ${waitMs}ms\n`);
        await new Promise(r => setTimeout(r, waitMs));
        return this.acquire();
      }
      recent.push(Date.now());
      dailyCount++;
    },
  };
}

async function callWithBackoff(fn) {
  let lastErr;
  for (let attempt = 0; attempt <= BACKOFF.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const retriable = e.status === 429 || (e.status >= 500 && e.status < 600);
      if (!retriable || attempt === BACKOFF.maxRetries) throw e;
      const delay = BACKOFF.baseDelayMs * 2 ** attempt + Math.random() * BACKOFF.jitterMs;
      process.stderr.write(`  retry ${attempt + 1}/${BACKOFF.maxRetries} after ${Math.round(delay)}ms (status=${e.status})\n`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ────────────────────────────────────────────────────────────
// catalog I/O
// ────────────────────────────────────────────────────────────
async function readCatalog() {
  return JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
}
async function writeCatalogAtomic(catalog) {
  const tmp = CATALOG_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  await rename(tmp, CATALOG_PATH);
}

// ────────────────────────────────────────────────────────────
// 対象抽出
// ────────────────────────────────────────────────────────────
function selectTargets(catalog, args) {
  const entries = catalog.entries || [];
  let targets = entries.filter(e =>
    typeof e.accent_yomigana === 'string' && e.accent_yomigana.length > 0
  );
  if (args.only) {
    const set = new Set(args.only.split(',').map(s => s.trim()));
    targets = targets.filter(e => set.has(e.key));
  }
  if (!args.force) {
    targets = targets.filter(e => !e.accent_review);
  }
  if (args.smoke) targets = targets.slice(0, args.batchSize);
  else if (args.limit) targets = targets.slice(0, args.limit);
  return targets;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }

  await loadEnv();
  const apiKey = process.env.GEMINI_API_KEY;

  const catalog = await readCatalog();
  const allEntries = catalog.entries || [];
  const totalWithAccent = allEntries.filter(e => e.accent_yomigana).length;
  const already = allEntries.filter(e => e.accent_yomigana && e.accent_review).length;

  const targets = selectTargets(catalog, args);
  const batches = chunk(targets, args.batchSize);

  // 概算コスト（Gemini 2.5 Flash GA: $0.30/M input, $2.50/M output）
  // 1 batch (20 件) ≈ 1500 input tokens (instructions + 20 entries) + 1000 output (results)
  const estInputTok = batches.length * (500 + args.batchSize * 50);
  const estOutputTok = batches.length * (args.batchSize * 50);
  const estCost = estInputTok / 1e6 * 0.30 + estOutputTok / 1e6 * 2.50;

  console.log(`vocab_catalog: total with accent=${totalWithAccent}, already cross-checked=${already}, target=${targets.length} (${batches.length} batches of ${args.batchSize})${args.smoke ? ' [smoke]' : ''}${args.force ? ' [force]' : ''}`);
  console.log(`estimated cost: ~$${estCost.toFixed(4)} (Gemini 2.5 Flash, batch=${args.batchSize})`);

  if (args.dryRun || targets.length === 0) {
    if (args.dryRun) {
      const head = targets.slice(0, 10).map(e => `  - ${e.key}  word=${e.word} reading=${e.reading} yomigana=${e.accent_yomigana} src=${e.accent_source}`).join('\n');
      console.log(`先頭 ${Math.min(10, targets.length)} 件:\n${head}`);
      if (targets.length > 10) console.log(`  ... ${targets.length - 10} more`);
    } else {
      console.log('nothing to do.');
    }
    return;
  }

  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY が未設定（.env または環境変数）。--dry-run で対象だけ確認可。');
    process.exit(1);
  }

  const rpm = parseInt(process.env.GEMINI_FLASH_RPM || RATE_DEFAULTS.rpm, 10);
  const rpd = parseInt(process.env.GEMINI_FLASH_RPD || RATE_DEFAULTS.rpd, 10);
  const concurrency = args.concurrency || parseInt(process.env.GEMINI_FLASH_CONCURRENCY || RATE_DEFAULTS.concurrency, 10);

  const limiter = makeRateLimiter({ rpm, rpd });
  const today = new Date().toISOString().slice(0, 10);

  // entries[] index map（key → entry 参照）
  const entryByKey = new Map();
  for (const e of allEntries) entryByKey.set(e.key, e);

  let doneBatches = 0, errBatches = 0;
  let okCount = 0, wrongCount = 0, unsureCount = 0, reviewFlagged = 0;
  const startedAt = Date.now();
  const totalUsage = { prompt: 0, candidates: 0, cached: 0 };

  async function processBatch(batch) {
    try {
      const slim = batch.map(e => ({
        key: e.key,
        word: e.word,
        reading: e.reading || e.reading_kana || '',
        accent_yomigana: e.accent_yomigana,
        accent_source: e.accent_source || 'unknown',
      }));
      await limiter.acquire();
      const r = await callWithBackoff(() => checkAccentBatch({
        entries: slim, apiKey, model: MODEL,
      }));
      totalUsage.prompt += r.usage.promptTokens;
      totalUsage.candidates += r.usage.candidatesTokens;
      totalUsage.cached += r.usage.cachedTokens;

      for (const res of r.results) {
        const entry = entryByKey.get(res.key);
        if (!entry) continue;
        entry.accent_review = {
          verdict: res.verdict,
          suggested_yomigana: res.suggested_yomigana,
          confidence: res.confidence,
          note: res.note,
          checkedAt: today,
          model: MODEL,
        };
        if (res.verdict === 'ok') okCount++;
        else if (res.verdict === 'wrong') wrongCount++;
        else unsureCount++;
        if (shouldReview(res)) {
          reviewFlagged++;
          process.stderr.write(`  REVIEW ${res.key}: verdict=${res.verdict} conf=${res.confidence} current=${entry.accent_yomigana} suggested=${res.suggested_yomigana || '(none)'} note=${res.note}\n`);
        }
      }
    } catch (e) {
      errBatches++;
      process.stderr.write(`  ERROR batch (${batch.length} entries starting ${batch[0]?.key}): ${String(e.message || e).slice(0, 200)}\n`);
    } finally {
      doneBatches++;
      if (doneBatches % 5 === 0 || doneBatches === batches.length) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = doneBatches / Math.max(elapsed, 0.001);
        const eta = (batches.length - doneBatches) / Math.max(rate, 0.001);
        process.stderr.write(`  [batch ${doneBatches}/${batches.length}] elapsed=${elapsed.toFixed(0)}s rate=${rate.toFixed(2)}/s eta=${eta.toFixed(0)}s ok=${okCount} wrong=${wrongCount} unsure=${unsureCount} flagged=${reviewFlagged} err=${errBatches}\n`);
      }
      if (doneBatches % CHECKPOINT_EVERY_BATCH === 0) {
        // _meta 更新は最後だけにして checkpoint は entries のみ反映
        await writeCatalogAtomic(catalog);
      }
    }
  }

  const queue = [...batches];
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const b = queue.shift();
      if (!b) break;
      await processBatch(b);
    }
  });
  await Promise.all(workers);

  // _meta 更新
  catalog._meta = catalog._meta || {};
  const reviewQueue = allEntries
    .filter(e => e.accent_review && shouldReview(e.accent_review))
    .map(e => e.key);
  catalog._meta.accent_cross_checked_at = today;
  catalog._meta.accent_review_queue = reviewQueue;
  catalog._meta.accent_review_summary = {
    total_checked: allEntries.filter(e => e.accent_review).length,
    ok: allEntries.filter(e => e.accent_review?.verdict === 'ok').length,
    wrong: allEntries.filter(e => e.accent_review?.verdict === 'wrong').length,
    unsure: allEntries.filter(e => e.accent_review?.verdict === 'unsure').length,
    flagged_for_review: reviewQueue.length,
    model: MODEL,
  };

  await writeCatalogAtomic(catalog);

  const uncachedPromptTok = Math.max(0, totalUsage.prompt - totalUsage.cached);
  const actualCost = uncachedPromptTok / 1e6 * 0.30 + totalUsage.cached / 1e6 * 0.075 + totalUsage.candidates / 1e6 * 2.50;

  console.log(`\n=== accent cross-check summary ===`);
  console.log(`batches processed : ${doneBatches}/${batches.length}  (errors: ${errBatches})`);
  console.log(`entries verdict   : ok=${okCount} wrong=${wrongCount} unsure=${unsureCount}`);
  console.log(`flagged for review: ${reviewFlagged}  (wrong + unsure[!low])`);
  console.log(`tokens            : prompt=${totalUsage.prompt} (cached=${totalUsage.cached}) output=${totalUsage.candidates}`);
  console.log(`actual cost (USD) : $${actualCost.toFixed(4)}`);
  console.log(`catalog updated   : ${CATALOG_PATH}`);
  console.log(`_meta.accent_review_queue length: ${reviewQueue.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
