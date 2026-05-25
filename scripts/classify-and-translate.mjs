#!/usr/bin/env node
// classify-and-translate.mjs — Phase 1 ② → Phase 5 ② で catalog 駆動に切替
// GAS classifyAndTranslate.gs (pipeline.gs v1.1) のローカル移植。
// 入出力契約・モデル・generationConfig・vocab_type 24 種・"other" フォールバックは GAS と一致させる。
//
// 入力ソース: data/vocab_catalog.json から lessonRefs.includes(`lesson_${NN}`) でフィルタ
//             （bySource.lesson_NN[0].imageId を採用）。
//             catalog 不在時は data/lesson_NN.json 直読にフォールバックする。
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
const FLASH_MODEL = 'gemini-2.5-flash';
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

// --classify (Gemini 2.5 Flash) は paid tier 想定で別 default。.env で上書き可。
const FLASH_RATE_DEFAULTS = { rpm: 1000, rpd: 100_000, concurrency: 8 };

const CATALOG_PATH = resolve(ROOT, 'data/vocab_catalog.json');
const WARNINGS_PATH = resolve(ROOT, 'data/_meta/vocab_type_warnings.json');
const CHECKPOINT_EVERY = 200;

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
    classify: false, smoke: false, concurrency: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--verify') args.verify = true;
    else if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--classify') args.classify = true;
    else if (a === '--smoke') args.smoke = true;
    else if (a.startsWith('--lesson=')) args.lesson = a.slice('--lesson='.length);
    else if (a === '--lesson') args.lesson = argv[++i];
    else if (a.startsWith('--only=')) args.only = a.slice('--only='.length);
    else if (a === '--only') args.only = argv[++i];
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.slice('--limit='.length), 10);
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a.startsWith('--concurrency=')) args.concurrency = parseInt(a.slice('--concurrency='.length), 10);
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10);
    else { console.error('Unknown arg:', a); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`classify-and-translate.mjs — Phase 1 ② ローカル分類・翻訳 / Phase 5 ④ B catalog 分類

使い方:
  (A) lesson 駆動 translate+classify（Gemma）:
    --lesson NN     対象課（例: 01）
    --verify        既存 vocab_types_lessonNN.json と比較のみ・書き込みなし
    --force         キャッシュ無視で全件再分類
    --only A,B,C    指定 word のみ処理
    --limit N       最大 N 件で打ち切り
    --dry-run       API を呼ばずに対象一覧だけ表示

  (B) catalog 駆動 vocab_type 分類（Gemini 2.5 Flash）— Phase 5 ④ B:
    --classify             catalog-driven 分類モードを有効化
    --smoke                lesson_02 18 件 + N5/N4 高頻度 82 件 = 100 件のみ
    --limit N              最大 N 件で打ち切り（--smoke と排他ではない）
    --force                既に vocab_type 付きの entry も再分類
    --concurrency N        並列 API call 数（既定 ${FLASH_RATE_DEFAULTS.concurrency}）
    --dry-run              対象一覧と件数のみ表示・API 呼ばない
    --only word1,word2,... 指定 word のみ処理
    対象範囲：lesson_01 entries は worktree A 担当のため skip 固定

  --help

環境変数（.env 推奨）:
  GEMINI_API_KEY  必須（実 API 呼び出し時のみ）
  GEMINI_RPM      Gemma RPM 上限（既定 ${RATE_DEFAULTS.rpm}）
  GEMINI_RPD      Gemma RPD 上限（既定 ${RATE_DEFAULTS.rpd}）
  GEMINI_TPM      Gemma TPM 概算上限（既定 ${RATE_DEFAULTS.tpm}）
  GEMINI_FLASH_RPM   Flash RPM 上限（既定 ${FLASH_RATE_DEFAULTS.rpm}）
  GEMINI_FLASH_RPD   Flash RPD 上限（既定 ${FLASH_RATE_DEFAULTS.rpd}）
`);
}

// ────────────────────────────────────────────────────────────
// 入力ハーベスト & キャッシュ
// ────────────────────────────────────────────────────────────
async function harvestLessonVocab(lessonNN) {
  const lessonId = `lesson_${lessonNN}`;
  const catalogPath = resolve(ROOT, 'data/vocab_catalog.json');
  let catalog = null;
  try {
    catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }

  if (catalog) {
    // 順序源は lesson_NN.json の vocabulary.byPattern[*].words[*]
    // メタ（imageId）は catalog の bySource.<lessonId>[0] から引く
    const path = resolve(ROOT, `data/lesson_${lessonNN}.json`);
    const json = JSON.parse(await readFile(path, 'utf8'));
    const byKey = new Map();
    for (const e of catalog.entries) byKey.set(e.key, e);
    const byPattern = json?.vocabulary?.byPattern || {};
    const seen = new Set();
    const out = [];
    for (const pat of Object.values(byPattern)) {
      for (const w of (pat?.words || [])) {
        const key = `${w.word}|${w.reading || ''}`;
        const ce = byKey.get(key);
        if (!ce) continue;
        const meta = (ce.bySource[lessonId] || [])[0];
        if (!meta?.imageId || seen.has(meta.imageId)) continue;
        seen.add(meta.imageId);
        out.push({
          imageId: meta.imageId,
          word: ce.word,
          reading: ce.reading || '',
          pos: DEFAULT_POS,
          lessonRef: lessonId,
        });
      }
    }
    return out;
  }

  // フォールバック: catalog 不在時は lesson_NN.json 直読（旧挙動）
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
        lessonRef: lessonId,
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

// ════════════════════════════════════════════════════════════
// --classify モード（Phase 5 ④ B / catalog-driven / Gemini 2.5 Flash）
// ════════════════════════════════════════════════════════════

const JLPT_PRIORITY = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4, unknown: 5 };

function entryJlpt(entry) {
  return entry?.bySource?.goi_list_raw?.[0]?.jlpt
      || entry?.bySource?.lesson_01?.[0]?.jlptLevel
      || entry?.bySource?.lesson_02?.[0]?.jlptLevel
      || 'unknown';
}
function entryGoiNo(entry) {
  const n = entry?.bySource?.goi_list_raw?.[0]?.no;
  return n ? parseInt(n, 10) || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
}
function entryPos(entry) {
  return entry?.bySource?.goi_list_raw?.[0]?.pos
      || entry?.bySource?.lesson_01?.[0]?.pos
      || DEFAULT_POS;
}
function entryEn(entry) {
  return entry?.bySource?.lesson_02?.[0]?.en
      || entry?.bySource?.lesson_01?.[0]?.en
      || null;
}
function entryGoiShurui(entry) {
  return entry?.bySource?.goi_list_raw?.[0]?.goiShurui || null;
}

// 担当範囲フィルタ：lesson_01 entries は worktree A 担当のため除外
function isBScope(entry) {
  return !((entry.lessonRefs || []).includes('lesson_01'));
}

// smoke 構成：lesson_02 18 + N5/N4 高頻度 82 = 100
function pickSmokeSet(entries) {
  const lesson02 = entries.filter(e => (e.lessonRefs || []).includes('lesson_02'));
  const goiOnly = entries.filter(e =>
    !(e.lessonRefs || []).length
    && (e.sourceIds || []).includes('goi_list_raw')
    && ['N5', 'N4'].includes(entryJlpt(e))
  );
  goiOnly.sort((a, b) => {
    const ja = JLPT_PRIORITY[entryJlpt(a)] ?? 9;
    const jb = JLPT_PRIORITY[entryJlpt(b)] ?? 9;
    if (ja !== jb) return ja - jb;
    return entryGoiNo(a) - entryGoiNo(b);
  });
  const remaining = 100 - lesson02.length;
  return [...lesson02, ...goiOnly.slice(0, remaining)];
}

function buildFlashPrompt(entry) {
  const vocabTypeList = VALID_VOCAB_TYPES.join(', ');
  const word = entry.word;
  const reading = entry.reading || '';
  const pos = entryPos(entry);
  const jlpt = entryJlpt(entry);
  const en = entryEn(entry);
  const shurui = entryGoiShurui(entry);
  const ctx = [
    `Word:    ${word}`,
    `Reading: ${reading}`,
    `POS:     ${pos}`,
    `JLPT:    ${jlpt}`,
  ];
  if (en) ctx.push(`English: ${en}`);
  if (shurui) ctx.push(`Goi shurui: ${shurui}`);

  return [
    'You are a Japanese vocabulary classifier for JLPT learners. Do not think out loud. Output only the JSON object.',
    `Given a Japanese word, choose ONE vocab_type from: [${vocabTypeList}].`,
    'Also self-rate confidence as "high", "medium", or "low".',
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
    '  pronoun         → personal/interrogative pronouns (わたし, あなた, だれ, etc.)',
    '  interjection    → response/filler words (はい, いいえ, あ, etc.)',
    '  set_expression  → fixed social phrases (おはよう, いただきます, etc.)',
    '  adverb          → degree/frequency/manner/time adverbs (とても, いつも, etc.)',
    '  counter         → counter suffixes (〜本, 〜枚, 〜冊, etc.)',
    '  time            → time words (〜時, 〜曜日, 季節, etc.)',
    '  transportation  → vehicles (電車, バス, タクシー, etc.)',
    '  family          → family terms (父, 母, お父さん, etc.)',
    '  weather         → weather/nature (雨, 雪, 晴れ, etc.)',
    '  sensory         → perception verbs (見ます, 聞きます, etc.)',
    '  other           → anything that doesn\'t fit above',
    '',
    'Confidence guide:',
    '  high   → unambiguous, the word clearly fits one category',
    '  medium → mostly clear but the category boundary is fuzzy',
    '  low    → genuinely ambiguous, multiple categories plausible, or you fall back to "other"',
    '',
    ...ctx,
    '',
    'Return ONLY valid JSON. Example: {"vocab_type": "person", "confidence": "high"}',
  ].join('\n');
}

const FLASH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    vocab_type: { type: 'STRING', enum: VALID_VOCAB_TYPES },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
  },
  required: ['vocab_type', 'confidence'],
};

async function callFlashOnce(entry, apiKey) {
  const url = `${ENDPOINT_BASE}/${FLASH_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: buildFlashPrompt(entry) }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 256,
      responseMimeType: 'application/json',
      responseSchema: FLASH_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
    },
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
  const respJson = JSON.parse(bodyText);
  let text;
  try {
    text = respJson.candidates[0].content.parts[0].text.trim();
  } catch {
    throw new Error('レスポンス構造が不正: ' + bodyText.slice(0, 200));
  }
  // responseSchema 経由でも稀に ```json fence が混入するので念のため剥がす
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(text);
  const vt = String(parsed.vocab_type || '').trim().toLowerCase();
  const finalVt = VALID_VOCAB_TYPES.includes(vt) ? vt : 'other';
  const conf = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
  return {
    vocab_type: finalVt,
    confidence: conf,
    fallback: finalVt !== vt,
    usage: respJson.usageMetadata || null,
  };
}

async function classifyFlashWithBackoff(entry, { apiKey, limiter }) {
  let lastErr;
  for (let attempt = 0; attempt <= BACKOFF.maxRetries; attempt++) {
    await limiter.acquire();
    try {
      return await callFlashOnce(entry, apiKey);
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

async function writeCatalogAtomic(catalog) {
  const tmp = CATALOG_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  const { rename } = await import('node:fs/promises');
  await rename(tmp, CATALOG_PATH);
}

async function loadWarnings() {
  try {
    return JSON.parse(await readFile(WARNINGS_PATH, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function writeWarnings(warnings, runMeta) {
  const out = {
    _meta: {
      generatedAt: new Date().toISOString(),
      generator: 'scripts/classify-and-translate.mjs --classify',
      model: FLASH_MODEL,
      ...runMeta,
      warnCount: warnings.length,
    },
    warnings,
  };
  await writeFile(WARNINGS_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

async function runClassifyMode(args) {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
  const entries = catalog.entries || [];

  // 1) B scope（lesson_01 を除外）
  let pool = entries.filter(isBScope);

  // 2) smoke 構成（lesson_02 18 + N5/N4 高頻度 82）
  if (args.smoke) {
    pool = pickSmokeSet(pool);
  }

  // 3) --only filter
  if (args.only) {
    const set = new Set(args.only.split(',').map(s => s.trim()));
    pool = pool.filter(e => set.has(e.word));
  }

  // 4) 既に vocab_type 付きなら skip（--force で無視）
  if (!args.force) {
    pool = pool.filter(e => !e.vocab_type);
  }

  // 5) --limit
  if (args.limit) pool = pool.slice(0, args.limit);

  const mode = args.smoke ? 'smoke' : 'full';
  const totalCatalog = entries.length;
  const bScopeTotal = entries.filter(isBScope).length;
  const alreadyTyped = entries.filter(e => isBScope(e) && e.vocab_type).length;
  console.log(`catalog: total=${totalCatalog}, B scope=${bScopeTotal}, already typed=${alreadyTyped}, work=${pool.length}, mode=${mode}${args.force ? '+force' : ''}`);

  if (args.dryRun) {
    const head = pool.slice(0, 15).map(e => `  - ${e.word}(${e.reading}) [${entryJlpt(e)}] lessonRefs=${JSON.stringify(e.lessonRefs)}`).join('\n');
    console.log(`先頭 ${Math.min(15, pool.length)} 件:\n${head}`);
    if (pool.length > 15) console.log(`  ... ${pool.length - 15} more`);
    return;
  }

  if (pool.length === 0) {
    console.log('nothing to do.');
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY が未設定（.env または環境変数）。--dry-run で対象だけ確認可。');
    process.exit(1);
  }

  const rpm = parseInt(process.env.GEMINI_FLASH_RPM || FLASH_RATE_DEFAULTS.rpm, 10);
  const rpd = parseInt(process.env.GEMINI_FLASH_RPD || FLASH_RATE_DEFAULTS.rpd, 10);
  const concurrency = args.concurrency || parseInt(process.env.GEMINI_FLASH_CONCURRENCY || FLASH_RATE_DEFAULTS.concurrency, 10);

  const limiter = makeRateLimiter({ rpm, rpd });
  const today = new Date().toISOString().slice(0, 10);

  // entries[] の index を引くマップ（write-back のため）
  const indexByKey = new Map();
  entries.forEach((e, i) => indexByKey.set(e.key, i));

  // 既存 warnings は追記マージ（重複は key+model+run で dedup）。
  // api_error は transient quota 起因がほとんどなので run 開始時に剥がし、
  // 今回 retry で成功すれば warnings に残らないようにする。
  const existingWarnings = await loadWarnings();
  const warnings = (existingWarnings?.warnings || []).filter(w => w.reason !== 'api_error');
  const warnKeysSeen = new Set(warnings.filter(w => w.run === mode).map(w => w.key));

  let done = 0, errCount = 0, warnCount = 0;
  const startedAt = Date.now();
  const inputUsageTokens = { prompt: 0, candidates: 0, cached: 0 };

  async function processOne(entry) {
    try {
      const r = await classifyFlashWithBackoff(entry, { apiKey, limiter });
      const idx = indexByKey.get(entry.key);
      entries[idx] = {
        ...entries[idx],
        vocab_type: r.vocab_type,
        vocab_type_meta: {
          source: FLASH_MODEL,
          classifiedAt: today,
          confidence: r.confidence,
          ...(r.fallback ? { fallback: 'unknown_label_to_other' } : {}),
        },
      };
      if (r.usage) {
        inputUsageTokens.prompt += r.usage.promptTokenCount || 0;
        inputUsageTokens.candidates += r.usage.candidatesTokenCount || 0;
        inputUsageTokens.cached += r.usage.cachedContentTokenCount || 0;
      }
      const isWarn = r.confidence === 'low' || r.vocab_type === 'other' || r.fallback;
      if (isWarn && !warnKeysSeen.has(entry.key)) {
        warnings.push({
          key: entry.key,
          word: entry.word,
          reading: entry.reading,
          jlpt: entryJlpt(entry),
          vocab_type: r.vocab_type,
          confidence: r.confidence,
          reason: r.fallback ? 'fallback_to_other' : (r.vocab_type === 'other' ? 'classified_as_other' : 'low_confidence'),
          run: mode,
          classifiedAt: today,
        });
        warnKeysSeen.add(entry.key);
        warnCount++;
      }
    } catch (e) {
      errCount++;
      const key = entry.key;
      if (!warnKeysSeen.has(key)) {
        warnings.push({
          key, word: entry.word, reading: entry.reading,
          jlpt: entryJlpt(entry),
          reason: 'api_error',
          error: String(e.message || e).slice(0, 200),
          run: mode,
          classifiedAt: today,
        });
        warnKeysSeen.add(key);
      }
      process.stderr.write(`  ERROR ${entry.word}: ${String(e.message || e).slice(0, 160)}\n`);
    } finally {
      done++;
      if (done % 25 === 0 || done === pool.length) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = done / Math.max(elapsed, 0.001);
        const eta = (pool.length - done) / Math.max(rate, 0.001);
        process.stderr.write(`  [${done}/${pool.length}] elapsed=${elapsed.toFixed(0)}s rate=${rate.toFixed(1)}/s eta=${eta.toFixed(0)}s warn=${warnCount} err=${errCount}\n`);
      }
      if (done % CHECKPOINT_EVERY === 0) {
        await writeCatalogAtomic(catalog);
        await writeWarnings(warnings, { run: mode, partial: true, processed: done, total: pool.length });
      }
    }
  }

  // 並列実行（worker pool パターン）
  const queue = [...pool];
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const e = queue.shift();
      if (!e) break;
      await processOne(e);
    }
  });
  await Promise.all(workers);

  // 最終 write
  await writeCatalogAtomic(catalog);

  // usage summary
  const totalPromptTok = inputUsageTokens.prompt;
  const totalOutTok = inputUsageTokens.candidates;
  const totalCachedTok = inputUsageTokens.cached;
  // Gemini 2.5 Flash GA pricing (2025-2026): $0.30/M input uncached, $0.075/M input cached, $2.50/M output
  const uncachedPromptTok = Math.max(0, totalPromptTok - totalCachedTok);
  const estCost = uncachedPromptTok / 1e6 * 0.30 + totalCachedTok / 1e6 * 0.075 + totalOutTok / 1e6 * 2.50;

  await writeWarnings(warnings, {
    run: mode,
    partial: false,
    processed: done,
    total: pool.length,
    errors: errCount,
    usageTokens: { prompt: totalPromptTok, output: totalOutTok, cached: totalCachedTok },
    estimatedCostUsd: Number(estCost.toFixed(4)),
  });

  const finalCatalogTyped = entries.filter(e => isBScope(e) && e.vocab_type).length;
  console.log(`\n=== --classify summary (${mode}) ===`);
  console.log(`processed         : ${done}/${pool.length}`);
  console.log(`errors            : ${errCount}`);
  console.log(`warnings written  : ${warnings.length} (in ${WARNINGS_PATH})`);
  console.log(`B-scope typed now : ${finalCatalogTyped}/${bScopeTotal}`);
  console.log(`tokens: prompt=${totalPromptTok} (cached=${totalCachedTok}) output=${totalOutTok}`);
  console.log(`est cost (USD)    : $${estCost.toFixed(4)}`);
  console.log(`catalog updated   : ${CATALOG_PATH}`);
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  if (args.help || (!args.lesson && !args.classify)) {
    printHelp();
    process.exit(args.help ? 0 : 2);
  }

  if (args.classify) {
    await loadEnv();
    return await runClassifyMode(args);
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
      source: `data/vocab_catalog.json (lessonRefs=lesson_${lessonNN}) + data/lesson_${lessonNN}.json (順序源)`,
      rowCount: vocabulary.length,
    },
    vocabulary,
  };
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nwrote: ${outPath} (${vocabulary.length} entries; new=${fresh.size})`);
}

main().catch(e => { console.error(e); process.exit(1); });
