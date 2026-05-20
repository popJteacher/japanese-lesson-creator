#!/usr/bin/env node
// scripts/generate-audio-local.mjs
// Phase 3 ③：Cloud TTS でローカルバッチ合成 + registry 連携 + 月間文字カウンタ。
//
// gas/pipeline.gs generateAudioBatch（line 2561+）のローカル等価。
// 違い：
//   - 出力は MP3（GAS は WAV）。意図的：サイズ・帯域・QC 容易性。
//   - 保存先は data/audio/<id>.mp3（Drive 直リンクではない）。
//   - registry を直接更新（sheet の audioStatus / audioUrl は書き換えない）。
//   - 月間文字カウンタ data/_meta/tts_usage.json で無料枠 100 万文字/月を監視。
//     既定上限 800,000 文字（無料枠 80%）。--max-chars で上書き可。
//
// 規律（registry-as-canon、Phase 2 sync-registries-local と一致）:
//   - registry.entries[id] が存在しない target は skip（warning ログ）。
//   - 既に registry.entries[id].audioUrl が local path で実ファイルもある target は skip。
//   - sheet 側 audioStatus は書き換えない（Phase 3 ⑥ で sheet 自体を引退させる前提）。
//
// 使い方:
//   npm run generate-audio                              # 通常実行
//   npm run generate-audio -- --dry-run                 # API 呼ばず対象だけ列挙
//   npm run generate-audio -- --limit 5                 # 先頭 5 件のみ
//   npm run generate-audio -- --only sentence           # 種別フィルタ
//   npm run generate-audio -- --max-chars 100000        # 月間上限を明示
//   npm run generate-audio -- --force                   # 既存ファイルも上書き
//   npm run generate-audio -- --no-qc                   # QC をスキップ（debug 用）

import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';
import { createSheetsClient, fetchVocabulary, fetchExamples } from './lib/sheets-client.mjs';
import { applyQc } from './lib/audio-qc.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_REGISTRY = resolve(ROOT, 'data/master_audio_registry.json');
const AUDIO_DIR = resolve(ROOT, 'data/audio');
const USAGE_FILE = resolve(ROOT, 'data/_meta/tts_usage.json');

const DEFAULT_MAX_CHARS_MONTH = 800_000;
const FREE_TIER_LIMIT = 1_000_000;
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };

// ────────────────────────────────────────────────────────────
// 小道具
// ────────────────────────────────────────────────────────────
function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7); // YYYY-MM
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== null) return fallback;
    throw e;
  }
}
async function writeJsonAtomic(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, path);
}
async function fileExists(path) {
  try { await stat(path); return true; } catch { return false; }
}

// ────────────────────────────────────────────────────────────
// 合成対象の抽出
//   audioStatus が 'pending' または空 + audioUrl 空 を unprocessed とみなす。
//   'generated' / 'failed_*' / 'skipped' などは触らない。
// ────────────────────────────────────────────────────────────
function extractTargets({ vocab, examples }) {
  const targets = [];

  for (const row of vocab.rows) {
    const audioId = String(row.audioId || '').trim();
    const audioStatus = String(row.audioStatus || '').trim();
    const audioUrl = String(row.audioUrl || '').trim();
    const word = String(row.word || '').trim();
    const reading = String(row.reading || '').trim();
    if (!audioId || !word) continue;
    if (audioUrl) continue;
    if (audioStatus && audioStatus !== 'pending') continue;
    targets.push({ kind: 'word', id: audioId, text: reading || word });
  }

  for (const row of examples.rows) {
    const id = String(row.id || '').trim();
    const audioStatus = String(row.audioStatus || '').trim();
    const audioUrl = String(row.audioUrl || '').trim();
    const textToSpeak = String(row.textToSpeak || '').trim();
    if (!id || !textToSpeak) continue;
    if (audioUrl) continue;
    if (audioStatus && audioStatus !== 'pending') continue;
    targets.push({ kind: 'sentence', id, text: textToSpeak });
  }

  return targets;
}

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    dryRun: false, limit: null, only: null,
    maxChars: DEFAULT_MAX_CHARS_MONTH, force: false, noQc: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--no-qc') args.noQc = true;
    else if (a === '--limit') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v <= 0) { console.error('--limit must be positive int'); process.exit(2); }
      args.limit = v;
    } else if (a === '--only') {
      const v = argv[++i];
      if (v !== 'word' && v !== 'sentence') { console.error('--only must be word|sentence'); process.exit(2); }
      args.only = v;
    } else if (a === '--max-chars') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v <= 0) { console.error('--max-chars must be positive int'); process.exit(2); }
      args.maxChars = v;
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/generate-audio-local.mjs [--dry-run] [--limit N] [--only word|sentence] [--max-chars N] [--force] [--no-qc]');
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`); process.exit(2);
    }
  }
  return args;
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  await loadEnv(ROOT);

  console.log('===== generate-audio-local 開始 =====');
  console.log(`  voice:        ${VOICE.name} (${VOICE.languageCode})`);
  console.log(`  audio dir:    ${relative(ROOT, AUDIO_DIR)}/`);
  console.log(`  qc:           ${args.noQc ? '無効（--no-qc）' : 'loudnorm + silenceremove + afade'}`);
  console.log(`  max chars/月: ${args.maxChars.toLocaleString()} (free tier ${FREE_TIER_LIMIT.toLocaleString()})`);
  if (args.dryRun) console.log('  mode: --dry-run（API 呼ばず、書き込みなし）');
  if (args.limit) console.log(`  --limit: ${args.limit}`);
  if (args.only) console.log(`  --only: ${args.only}`);
  if (args.force) console.log('  --force: 既存 mp3 も再合成');

  // Sheets → targets
  const sheets = await createSheetsClient({ rootDir: ROOT });
  const vocab = await fetchVocabulary(sheets);
  const examples = await fetchExamples(sheets);
  console.log(`  fetched: Vocabulary ${vocab.rows.length} / Examples ${examples.rows.length}`);

  let targets = extractTargets({ vocab, examples });
  if (args.only) targets = targets.filter(t => t.kind === args.only);
  console.log(`  targets:  ${targets.length} 件 (word=${targets.filter(t => t.kind === 'word').length} / sentence=${targets.filter(t => t.kind === 'sentence').length})`);

  // registry-as-canon: registry に entry が無い id は skip
  const registry = await readJson(AUDIO_REGISTRY);
  const inRegistry = targets.filter(t => registry.entries[t.id] !== undefined);
  const notInRegistry = targets.filter(t => registry.entries[t.id] === undefined);
  if (notInRegistry.length) {
    console.warn(`  ⚠ registry 未登録のため skip: ${notInRegistry.length} 件`);
    for (const t of notInRegistry.slice(0, 10)) console.warn(`     - ${t.id}`);
    if (notInRegistry.length > 10) console.warn(`     - ... +${notInRegistry.length - 10} more`);
  }
  targets = inRegistry;

  // 既存 mp3 ある & --force でなければ skip
  if (!args.force) {
    const before = targets.length;
    const filtered = [];
    for (const t of targets) {
      const mp3 = resolve(AUDIO_DIR, `${t.id}.mp3`);
      const exists = await fileExists(mp3);
      const regUrl = String(registry.entries[t.id]?.audioUrl || '');
      if (exists && regUrl.startsWith('data/audio/')) continue; // already done
      filtered.push(t);
    }
    const skipped = before - filtered.length;
    if (skipped) console.log(`  既生成 skip: ${skipped} 件（--force で再合成可）`);
    targets = filtered;
  }

  if (args.limit) targets = targets.slice(0, args.limit);
  console.log(`  実合成予定: ${targets.length} 件`);

  // 文字カウンタ
  const usage = await readJson(USAGE_FILE, { _meta: { description: 'Cloud TTS monthly character usage (Phase 3 ③)' }, months: {} });
  const mk = monthKey();
  const monthUsed = (usage.months[mk]?.charCount) ?? 0;
  const plannedChars = targets.reduce((s, t) => s + t.text.length, 0);
  console.log(`  当月 (${mk}) 使用済み: ${monthUsed.toLocaleString()} 文字 / 今回追加見込み: ${plannedChars.toLocaleString()}`);

  if (monthUsed + plannedChars > args.maxChars) {
    const room = Math.max(0, args.maxChars - monthUsed);
    console.error(`✗ 上限超過: ${monthUsed + plannedChars} > ${args.maxChars}（残り ${room} 文字）`);
    console.error('  対処：--limit で件数を絞る、--max-chars で上限を上げる（無料枠 100 万文字までは無料）');
    process.exit(3);
  }

  if (args.dryRun || targets.length === 0) {
    console.log('--- dry-run / 対象 0 件のため終了 ---');
    if (args.dryRun) {
      for (const t of targets.slice(0, 30)) {
        console.log(`     ${t.kind.padEnd(8)} ${t.id.padEnd(36)} chars=${String(t.text.length).padStart(3)}  text=${t.text}`);
      }
      if (targets.length > 30) console.log(`     ... +${targets.length - 30} more`);
    }
    return;
  }

  // 合成
  await mkdir(AUDIO_DIR, { recursive: true });
  const tts = await createTtsClient({ rootDir: ROOT });

  let okCount = 0, errCount = 0, charsThisRun = 0;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const out = resolve(AUDIO_DIR, `${t.id}.mp3`);
    const relPath = `data/audio/${t.id}.mp3`;
    try {
      const raw = await synthesize(tts, { text: t.text, voice: VOICE });
      const finalAudio = args.noQc ? raw : await applyQc(raw);
      await writeFile(out, finalAudio);
      registry.entries[t.id].audioUrl = relPath;
      charsThisRun += t.text.length;
      okCount++;
      const qcTag = args.noQc ? '' : ` → QC ${finalAudio.length}B`;
      console.log(`  ✓ [${i+1}/${targets.length}] ${t.id} (${t.text.length} chars, raw ${raw.length}B${qcTag})`);
    } catch (e) {
      errCount++;
      console.error(`  ✗ [${i+1}/${targets.length}] ${t.id}: ${e.message || e}`);
    }
  }

  // 使用量更新
  usage.months[mk] = {
    charCount: monthUsed + charsThisRun,
    lastUpdated: todayISO(),
  };
  await writeJsonAtomic(USAGE_FILE, usage);

  // registry 書き込み
  if (registry._meta) registry._meta.lastModified = todayISO();
  await writeJsonAtomic(AUDIO_REGISTRY, registry);

  console.log('\n===== generate-audio-local 完了 =====');
  console.log(`  成功: ${okCount} / エラー: ${errCount}`);
  console.log(`  今回文字数: ${charsThisRun.toLocaleString()} / 当月計: ${(monthUsed + charsThisRun).toLocaleString()} / 上限: ${args.maxChars.toLocaleString()}`);
  console.log(`  registry: ${relative(ROOT, AUDIO_REGISTRY)}`);
  console.log(`  usage:    ${relative(ROOT, USAGE_FILE)}`);
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
