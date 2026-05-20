#!/usr/bin/env node
// classify-and-translate.mjs — Phase 1 ②
// GAS classifyAndTranslate.gs (pipeline.gs v1.1) のローカル移植。
// 入出力契約・モデル・generationConfig・vocab_type 24 種・"other" フォールバックは GAS と一致させる。
//
// 入力ソース: data/lesson_NN.json の vocabulary.byPattern[*].words[*]（imageId/word/reading）
// 出力先   : data/vocab_types_lessonNN.json（exportVocabTypes の出力先と同一）
// 既存出力は cache として扱い、再分類スキップ。--force で無視。
//
// pos 列は repo に存在しないため、GAS seedVocabulary のデフォルト "名詞" を使う。
//
// 使い方:
//   node scripts/classify-and-translate.mjs --lesson 01
//   node scripts/classify-and-translate.mjs --lesson 01 --verify
//   node scripts/classify-and-translate.mjs --lesson 01 --only 医者,会社員,学生 --force
//   node scripts/classify-and-translate.mjs --lesson 01 --dry-run

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MODEL = 'gemma-4-26b-a4b-it';
const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_POS = '名詞';

// GAS pipeline.gs:737-746 と一致
const VALID_VOCAB_TYPES = [
  'person', 'building', 'concrete_object', 'action_verb', 'adjective',
  'abstract_concept', 'spatial_relation', 'demonstrative',
  'pronoun', 'interjection', 'set_expression', 'adverb', 'counter',
  'time', 'transportation', 'family', 'weather', 'sensory',
  'other',
];

// Gemini Free tier 想定。`.env` の GEMINI_RPM/RPD/TPM で上書き可。
const RATE_DEFAULTS = { rpm: 15, rpd: 1500, tpm: 1_000_000 };

const BACKOFF = {
  maxRetries: 5,
  baseDelayMs: 1000,
  jitterMs: 250,
};

// ────────────────────────────────────────────────────────────
// .env minimal loader（dotenv 依存を避ける）
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
    lesson: null, verify: false, force: false,
    only: null, limit: null, dryRun: false, help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--verify') args.verify = true;
    else if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--lesson=')) args.lesson = a.slice('--lesson='.length);
    else if (a === '--lesson') args.lesson = argv[++i];
    else if (a.startsWith('--only=')) args.only = a.slice('--only='.length);
    else if (a === '--only') args.only = argv[++i];
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.slice('--limit='.length), 10);
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`classify-and-translate.mjs — Phase 1 ② ローカル分類・翻訳

使い方:
  --lesson NN     対象課（必須・例: 01）
  --verify        既存 vocab_types_lessonNN.json と比較のみ・書き込みなし
  --force         キャッシュ無視で全件再分類
  --only A,B,C    指定 word のみ処理
  --limit N       最大 N 件で打ち切り
  --dry-run       API を呼ばずに対象一覧だけ表示
  --help

環境変数（.env 推奨）:
  GEMINI_API_KEY  必須（実 API 呼び出し時のみ）
  GEMINI_RPM      RPM 上限（既定 ${RATE_DEFAULTS.rpm}）
  GEMINI_RPD      RPD 上限（既定 ${RATE_DEFAULTS.rpd}）
  GEMINI_TPM      TPM 概算上限（既定 ${RATE_DEFAULTS.tpm}）
`);
}

// ────────────────────────────────────────────────────────────
// 入力ハーベスト & キャッシュ
// ────────────────────────────────────────────────────────────
async function harvestLessonVocab(lessonNN) {
  const path = resolve(ROOT, `data/lesson_${lessonNN}.json`);
  const json = JSON.parse(await readFile(path, 'utf8'));
  const byPattern = json?.vocabulary?.byPattern || {};
  const seen = new Set();
  const out = [];
  for (const pat of Object.values(byPattern)) {
    for (const w of (pat?.words || [])) {
      if (!w.imageId || seen.has(w.imageId)) continue;
      seen.add(w.imageId);
      out.push({
        imageId: w.imageId,
        word: w.word,
        reading: w.reading || '',
        pos: DEFAULT_POS,
        lessonRef: `lesson_${lessonNN}`,
      });
    }
  }
  return out;
}

async function readExistingTypes(lessonNN) {
  const path = resolve(ROOT, `data/vocab_types_lesson${lessonNN}.json`);
  try {
    const json = JSON.parse(await readFile(path, 'utf8'));
    const cache = new Map();
    for (const e of (json.vocabulary || [])) cache.set(e.imageId, e);
    return { path, json, cache };
  } catch (e) {
    if (e.code === 'ENOENT') return { path, json: null, cache: new Map() };
    throw e;
  }
}

// ────────────────────────────────────────────────────────────
// レート制限（RPM スライディングウィンドウ + RPD カウンタ）
// ────────────────────────────────────────────────────────────
function makeRateLimiter({ rpm, rpd }) {
  const recent = []; // ms timestamps in last 60s
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

// ────────────────────────────────────────────────────────────
// Prompt & response（GAS pipeline.gs:872-941 と一致）
// ────────────────────────────────────────────────────────────
function buildPrompt(word, reading, pos) {
  const vocabTypeList = VALID_VOCAB_TYPES.join(', ');
  return [
    'You are a Japanese vocabulary classifier for JLPT learners. Do not think out loud. Do not self-correct. Output only the JSON object and nothing else.',
    'Given a Japanese word, return ONLY a JSON object with these two keys:',
    '- "en": English translation (short, 1-4 words, lowercase)',
    `- "vocab_type": one of [${vocabTypeList}]`,
    '',
    'Vocab type guide:',
    '  person          → words for people (医者, 学生, 先生, 会社員, etc.)',
    '  building        → buildings / facilities (病院, 学校, 銀行, 大学, etc.)',
    '  concrete_object → tangible items (本, ペン, 財布, 電話, etc.)',
    '  action_verb     → verbs / actions (食べる, 読む, 飲む, 行く, etc.)',
    '  adjective       → i-adj / na-adj (大きい, 新しい, 便利, etc.)',
    '  abstract_concept→ abstract nouns (時間, 気持ち, 意見, etc.)',
    '  spatial_relation→ location words (上, 下, 右, 左, そば, etc.)',
    '  demonstrative   → ko-so-a-do words (これ, それ, あれ, どれ, etc.)',
    '── New types (K-T) ──',
    '  pronoun         ← personal/interrogative pronouns (わたし, あなた, だれ, etc.)',
    '  interjection    ← response/filler words (はい, いいえ, あ, etc.)',
    '  set_expression  ← fixed social phrases (おはよう, いただきます, etc.)',
    '  adverb          ← degree/frequency/manner/time adverbs (とても, いつも, etc.)',
    '  counter         ← counter suffixes (〜本, 〜枚, 〜冊, etc.)',
    '  time            ← time words (〜時, 〜曜日, 季節, etc.)',
    '  transportation  ← vehicles (電車, バス, タクシー, etc.)',
    '  family          ← family terms (父, 母, お父さん, etc.)',
    '  weather         ← weather/nature (雨, 雪, 晴れ, etc.)',
    '  sensory         ← perception verbs (見ます, 聞きます, etc.)',
    '  other           → anything that doesn\'t fit above',
    '',
    `Word:    ${word}`,
    `Reading: ${reading}`,
    `POS:     ${pos}`,
    '',
    'Return ONLY valid JSON. No explanation. No markdown. No backticks.',
    'Example: {"en": "doctor", "vocab_type": "person"}',
  ].join('\n');
}

function parseGemmaResponse(responseJson, word) {
  let rawText = '';
  try {
    rawText = responseJson.candidates[0].content.parts[0].text.trim();
  } catch {
    throw new Error('レスポンス構造が不正: ' + JSON.stringify(responseJson).slice(0, 200));
  }
  rawText = rawText
    .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

  const start = rawText.indexOf('{');
  const end = start === -1 ? -1 : rawText.indexOf('}', start);
  if (start === -1 || end === -1) {
    throw new Error('JSONが見つかりません: ' + rawText.slice(0, 200));
  }
  let parsed;
  try { parsed = JSON.parse(rawText.slice(start, end + 1)); }
  catch { throw new Error('JSONパース失敗: ' + rawText.slice(start, end + 1).slice(0, 200)); }

  if (!parsed.en || typeof parsed.en !== 'string')
    throw new Error("'en' フィールドが不正: " + JSON.stringify(parsed));
  if (!parsed.vocab_type || typeof parsed.vocab_type !== 'string')
    throw new Error("'vocab_type' フィールドが不正: " + JSON.stringify(parsed));

  const vt = parsed.vocab_type.trim().toLowerCase();
  const finalVt = VALID_VOCAB_TYPES.includes(vt) ? vt : 'other';
  if (finalVt !== vt) {
    process.stderr.write(`  WARN: '${word}' の vocab_type '${vt}' が未知。'other' に変換します\n`);
  }
  return { en: parsed.en.trim().toLowerCase(), vocab_type: finalVt };
}

async function callGeminiOnce({ word, reading, pos, apiKey }) {
  const url = `${ENDPOINT_BASE}/${MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(word, reading, pos) }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 100, topP: 0.9 },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const bodyText = await res.text();
  if (res.status !== 200) {
    const err = new Error(`HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return parseGemmaResponse(JSON.parse(bodyText), word);
}

async function classifyWithBackoff({ word, reading, pos }, { apiKey, limiter }) {
  let lastErr;
  for (let attempt = 0; attempt <= BACKOFF.maxRetries; attempt++) {
    await limiter.acquire();
    try {
      return await callGeminiOnce({ word, reading, pos, apiKey });
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
// Verify モード：normalized en 一致 + vocab_type 完全一致
// ────────────────────────────────────────────────────────────
const ARTICLE_RE = /^(a|an|the)\s+/i;
function normalizeEn(s) {
  return String(s || '').toLowerCase().trim().replace(ARTICLE_RE, '');
}

function diffEntry(existing, fresh) {
  const sameVocabType = existing.vocab_type === fresh.vocab_type;
  const sameEn = normalizeEn(existing.en) === normalizeEn(fresh.en);
  return { sameVocabType, sameEn, pass: sameVocabType && sameEn };
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.lesson) {
    printHelp();
    process.exit(args.help ? 0 : 2);
  }

  await loadEnv();

  const lessonNN = String(args.lesson).padStart(2, '0');
  const wordsAll = await harvestLessonVocab(lessonNN);
  const { path: outPath, json: existingJson, cache } = await readExistingTypes(lessonNN);

  const onlySet = args.only ? new Set(args.only.split(',').map(s => s.trim())) : null;
  let work = wordsAll.filter(w => !onlySet || onlySet.has(w.word));
  if (!args.force && !args.verify) {
    work = work.filter(w => !cache.has(w.imageId));
  }
  if (args.verify) {
    work = work.filter(w => cache.has(w.imageId));
  }
  if (args.limit) work = work.slice(0, args.limit);

  console.log(`lesson_${lessonNN}: total=${wordsAll.length} cached=${cache.size} work=${work.length} mode=${args.verify ? 'verify' : args.force ? 'force' : 'incremental'}`);

  if (args.dryRun) {
    for (const w of work) console.log(`  - ${w.imageId} ${w.word}(${w.reading})`);
    return;
  }

  if (work.length === 0) {
    console.log('nothing to do.');
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY が未設定（.env または環境変数）。--dry-run で対象だけ確認可。');
    process.exit(1);
  }

  const limiter = makeRateLimiter({
    rpm: parseInt(process.env.GEMINI_RPM || RATE_DEFAULTS.rpm, 10),
    rpd: parseInt(process.env.GEMINI_RPD || RATE_DEFAULTS.rpd, 10),
  });

  const verifyReport = { pass: [], vtMismatch: [], enMismatch: [], errors: [] };
  const fresh = new Map(); // imageId → result

  for (let i = 0; i < work.length; i++) {
    const w = work[i];
    process.stderr.write(`[${i + 1}/${work.length}] ${w.word} ... `);
    try {
      const r = await classifyWithBackoff(w, { apiKey, limiter });
      fresh.set(w.imageId, r);
      process.stderr.write(`${r.en} / ${r.vocab_type}\n`);
      if (args.verify) {
        const existing = cache.get(w.imageId);
        const d = diffEntry(existing, r);
        if (d.pass) verifyReport.pass.push({ w, existing, fresh: r });
        else if (!d.sameVocabType) verifyReport.vtMismatch.push({ w, existing, fresh: r });
        else verifyReport.enMismatch.push({ w, existing, fresh: r });
      }
    } catch (e) {
      process.stderr.write(`ERROR: ${e.message}\n`);
      if (args.verify) verifyReport.errors.push({ w, error: e.message });
    }
  }

  if (args.verify) {
    console.log('\n=== verify report ===');
    console.log(`PASS              : ${verifyReport.pass.length}`);
    console.log(`vocab_type 不一致 : ${verifyReport.vtMismatch.length}`);
    console.log(`en 不一致のみ     : ${verifyReport.enMismatch.length}`);
    console.log(`error             : ${verifyReport.errors.length}`);
    for (const r of verifyReport.vtMismatch) {
      console.log(`  [VT] ${r.w.word}: existing=${r.existing.vocab_type} → fresh=${r.fresh.vocab_type}`);
    }
    for (const r of verifyReport.enMismatch) {
      console.log(`  [EN] ${r.w.word}: existing='${r.existing.en}' → fresh='${r.fresh.en}' (normalized=${normalizeEn(r.fresh.en)})`);
    }
    for (const r of verifyReport.errors) {
      console.log(`  [ERR] ${r.w.word}: ${r.error}`);
    }
    const failed = verifyReport.vtMismatch.length + verifyReport.errors.length;
    process.exit(failed > 0 ? 1 : 0);
  }

  // 書き出し: 既存 cache + 新規 fresh をマージ
  const merged = new Map(cache);
  for (const w of wordsAll) {
    if (fresh.has(w.imageId)) {
      const r = fresh.get(w.imageId);
      merged.set(w.imageId, {
        imageId: w.imageId,
        word: w.word,
        reading: w.reading,
        en: r.en,
        vocab_type: r.vocab_type,
        lessonRef: w.lessonRef,
      });
    }
  }
  const vocabulary = wordsAll
    .map(w => merged.get(w.imageId))
    .filter(Boolean);

  const today = new Date().toISOString().slice(0, 10);
  const out = {
    _meta: {
      lessonNo: parseInt(lessonNN, 10),
      generatedAt: today,
      generator: 'scripts/classify-and-translate.mjs',
      source: `data/lesson_${lessonNN}.json (local classify; exportVocabTypes 引退)`,
      rowCount: vocabulary.length,
    },
    vocabulary,
  };
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nwrote: ${outPath} (${vocabulary.length} entries; new=${fresh.size})`);
}

main().catch(e => { console.error(e); process.exit(1); });
