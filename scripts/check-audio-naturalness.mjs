#!/usr/bin/env node
// scripts/check-audio-naturalness.mjs
// Phase α1：master_audio_registry.json のローカル音声に対し、Gemini 2.5 Flash
// audio multimodal で「自然さ QC」を走らせ、registry に naturalness を追記する。
//
// 入力:
//   data/master_audio_registry.json の entry で audioUrl が `data/audio/*.mp3`
//   （Drive URL のみの entry は対象外＝Phase α3 でローカル化された後に走る）
// 出力:
//   各 entry に naturalness: { score, confidence, comments, checkedAt, model } を追記
//
// 使い方:
//   node scripts/check-audio-naturalness.mjs --dry-run            対象一覧のみ
//   node scripts/check-audio-naturalness.mjs --smoke              1 件だけ走らせて疎通確認
//   node scripts/check-audio-naturalness.mjs --limit 5            上位 5 件
//   node scripts/check-audio-naturalness.mjs --only sentence_ex_L01_001,...
//   node scripts/check-audio-naturalness.mjs --force              既に naturalness 付きでも再走
//   node scripts/check-audio-naturalness.mjs                      未走の全件
//
// 設計判断:
//   - HARD ERROR にしない: 1 件失敗しても全体は続行（ログに記録）
//   - registry は atomic write（tmp → rename）
//   - 25 件ごとに checkpoint
//   - lesson_NN.json から audio ID → 元テキストを引く（patterns[].examples / vocabulary.byPattern[].words）

import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { checkNaturalness, isWarn } from './lib/audio-naturalness-qc.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const REGISTRY_PATH = resolve(ROOT, 'data/master_audio_registry.json');
const AUDIO_DIR = resolve(ROOT, 'data/audio');
const MODEL = 'gemini-2.5-flash';

// Gemini 2.5 Flash paid tier 想定（classify-and-translate.mjs の Flash 既定と同一）
const RATE_DEFAULTS = { rpm: 1000, rpd: 100_000, concurrency: 4 };
const BACKOFF = { maxRetries: 5, baseDelayMs: 1000, jitterMs: 250 };
const CHECKPOINT_EVERY = 25;

// ────────────────────────────────────────────────────────────
// .env loader（classify-and-translate.mjs と同流儀の最小実装）
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
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`check-audio-naturalness.mjs — Phase α1 音声自然さ QC（Gemini 2.5 Flash multimodal）

使い方:
  --dry-run         対象 entry の一覧だけ表示（API 呼ばない）
  --smoke           1 件だけ実走（疎通確認・課金 ~$0.001）
  --limit N         上位 N 件のみ
  --only id1,id2    指定 audio ID のみ
  --force           既に naturalness 付きでも再走（更新）
  --concurrency N   並列 API call 数（既定 ${RATE_DEFAULTS.concurrency}）

環境変数:
  GEMINI_API_KEY    必須
  GEMINI_FLASH_RPM  Flash RPM 上限（既定 ${RATE_DEFAULTS.rpm}）
  GEMINI_FLASH_RPD  Flash RPD 上限（既定 ${RATE_DEFAULTS.rpd}）

出力先: data/master_audio_registry.json（atomic 上書き）
  各 entry に naturalness: { score: 1-5, confidence: 'high'|'medium'|'low',
                              comments: string[], checkedAt: 'YYYY-MM-DD', model }
  を追記。WARN しきい = score<=3 または confidence==='low'。
`);
}

// ────────────────────────────────────────────────────────────
// audio ID → 元テキスト lookup（lesson_NN.json から）
// audioId は word_* / sentence_ex_LNN_NNN / sentence_LNN_NNN 等
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

// audio ID から所属レッスン番号を推定
//   sentence_ex_L01_001 → '01'
//   sentence_ex_L02_003 → '02'
//   word_医者 → 全レッスンを横断（catalog 引きは別途検討）
function guessLessonNN(audioId) {
  const m = /_L(\d{2})_/.exec(audioId);
  if (m) return m[1];
  // word_* は所属レッスンを直接持たないため、lesson_01 / lesson_02 を順に探す
  return null;
}

async function lookupText(audioId) {
  const nn = guessLessonNN(audioId);
  const candidates = nn ? [nn] : ['01', '02'];
  for (const lessonNN of candidates) {
    const lesson = await loadLesson(lessonNN);
    if (!lesson) continue;
    // 例文: patterns[].examples[].audioId === audioId → .sentence
    for (const p of (lesson.patterns || [])) {
      for (const ex of (p.examples || [])) {
        if (ex.audioId === audioId) {
          return { text: ex.sentence, word: ex.vocab || null, lessonNN };
        }
      }
    }
    // 語彙: vocabulary.byPattern[].words[].audioId === audioId → .word
    const byPattern = lesson.vocabulary?.byPattern || {};
    for (const pat of Object.values(byPattern)) {
      for (const w of (pat.words || [])) {
        if (w.audioId === audioId) {
          // word の自然さ評価では reading（ふりがな）も text として渡したい場合があるが、
          // テキスト＝発音対象とすると word 単体（漢字 or かな表記）が SSOT。
          return { text: w.word, word: w.word, lessonNN };
        }
      }
    }
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// レート制限（classify-and-translate.mjs と同流儀）
// ────────────────────────────────────────────────────────────
function makeRateLimiter({ rpm, rpd }) {
  const recent = [];
  let dailyCount = 0;
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  return {
    async acquire() {
      if (Date.now() < dayStart.getTime()) dailyCount = 0;
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
function isLocalPath(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('http')) return false;
  return url.startsWith('data/audio/');
}

function selectTargets(registry, args) {
  const entries = registry.entries || {};
  let ids = Object.keys(entries).filter(id => isLocalPath(entries[id]?.audioUrl));
  if (args.only) {
    const set = new Set(args.only.split(',').map(s => s.trim()));
    ids = ids.filter(id => set.has(id));
  }
  if (!args.force) {
    ids = ids.filter(id => !entries[id]?.naturalness);
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

  await loadEnv();
  const apiKey = process.env.GEMINI_API_KEY;

  const registry = await readRegistry();
  const targets = selectTargets(registry, args);

  const totalLocal = Object.values(registry.entries || {}).filter(e => isLocalPath(e?.audioUrl)).length;
  const already = Object.values(registry.entries || {}).filter(e => isLocalPath(e?.audioUrl) && e?.naturalness).length;
  console.log(`audio registry: total local=${totalLocal}, already checked=${already}, target=${targets.length}${args.smoke ? ' [smoke]' : ''}${args.force ? ' [force]' : ''}`);

  if (args.dryRun || targets.length === 0) {
    if (args.dryRun) {
      const head = targets.slice(0, 15).map(id => `  - ${id}  (${registry.entries[id].audioUrl})`).join('\n');
      console.log(`先頭 ${Math.min(15, targets.length)} 件:\n${head}`);
      if (targets.length > 15) console.log(`  ... ${targets.length - 15} more`);
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

  let done = 0, errCount = 0, warnCount = 0;
  const startedAt = Date.now();
  const totalUsage = { prompt: 0, candidates: 0, cached: 0 };

  async function processOne(audioId) {
    const entry = registry.entries[audioId];
    try {
      const lookup = await lookupText(audioId);
      if (!lookup || !lookup.text) {
        throw new Error('元テキストが lesson_NN.json から見つからない');
      }
      const audioPath = resolve(ROOT, entry.audioUrl);
      const audioBuffer = await readFile(audioPath);
      await limiter.acquire();
      const r = await callWithBackoff(() => checkNaturalness({
        audioBuffer, mimeType: 'audio/mp3',
        text: lookup.text, word: lookup.word,
        apiKey, model: MODEL,
      }));
      entry.naturalness = {
        score: r.score,
        confidence: r.confidence,
        comments: r.comments,
        checkedAt: today,
        model: MODEL,
      };
      totalUsage.prompt += r.usage.promptTokens;
      totalUsage.candidates += r.usage.candidatesTokens;
      totalUsage.cached += r.usage.cachedTokens;
      if (isWarn(entry.naturalness)) {
        warnCount++;
        process.stderr.write(`  WARN ${audioId}: score=${r.score} conf=${r.confidence} ${r.comments.length ? '/ ' + r.comments.join(' / ') : ''}\n`);
      }
    } catch (e) {
      errCount++;
      process.stderr.write(`  ERROR ${audioId}: ${String(e.message || e).slice(0, 200)}\n`);
    } finally {
      done++;
      if (done % 10 === 0 || done === targets.length) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = done / Math.max(elapsed, 0.001);
        const eta = (targets.length - done) / Math.max(rate, 0.001);
        process.stderr.write(`  [${done}/${targets.length}] elapsed=${elapsed.toFixed(0)}s rate=${rate.toFixed(2)}/s eta=${eta.toFixed(0)}s warn=${warnCount} err=${errCount}\n`);
      }
      if (done % CHECKPOINT_EVERY === 0) {
        await writeRegistryAtomic(registry);
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

  // 最終 write
  await writeRegistryAtomic(registry);

  // Gemini 2.5 Flash GA pricing (2025-2026): $0.30/M input uncached, $0.075/M input cached, $2.50/M output
  // audio はテキスト換算 ~32 tokens/秒として promptTokenCount に含まれる
  const uncachedPromptTok = Math.max(0, totalUsage.prompt - totalUsage.cached);
  const estCost = uncachedPromptTok / 1e6 * 0.30 + totalUsage.cached / 1e6 * 0.075 + totalUsage.candidates / 1e6 * 2.50;

  console.log(`\n=== naturalness QC summary ===`);
  console.log(`processed         : ${done}/${targets.length}`);
  console.log(`errors            : ${errCount}`);
  console.log(`warnings (WARN)   : ${warnCount}  (score<=3 or confidence==='low')`);
  console.log(`tokens: prompt=${totalUsage.prompt} (cached=${totalUsage.cached}) output=${totalUsage.candidates}`);
  console.log(`est cost (USD)    : $${estCost.toFixed(4)}`);
  console.log(`registry updated  : ${REGISTRY_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
