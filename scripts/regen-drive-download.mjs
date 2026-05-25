#!/usr/bin/env node
// scripts/regen-drive-download.mjs
// audioSource='drive-download' (旧 GAS 生成 + α4 で download) 全件を
// local pipeline (Neural2 + yomigana SSML + applyQc) で再合成する。
//
// 既存 generate-audio-local.mjs は Sheet 駆動 (audioUrl 空のみ対象) なので
// drive-download 済 entry は触らない。本 script は registry 直接走査。
//
// 使い方:
//   node scripts/regen-drive-download.mjs --dry-run
//   node scripts/regen-drive-download.mjs --limit 5
//   node scripts/regen-drive-download.mjs                # 全 291 件
//   node scripts/regen-drive-download.mjs --no-naturalness  # naturalness skip

import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';
import { applyQc } from './lib/audio-qc.mjs';
import { checkNaturalness, isWarn as isNaturalnessWarn } from './lib/audio-naturalness-qc.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_REGISTRY = resolve(ROOT, 'data/master_audio_registry.json');
const AUDIO_DIR = resolve(ROOT, 'data/audio');
const VOCAB_CATALOG = resolve(ROOT, 'data/vocab_catalog.json');
const USAGE_FILE = resolve(ROOT, 'data/_meta/tts_usage.json');
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };
const NATURALNESS_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_CHARS = 800_000;

function monthKey(d = new Date()) { return d.toISOString().slice(0, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}
async function writeJsonAtomic(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, path);
}
function escapeSsml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function parseArgs(argv) {
  const args = {
    dryRun: false, limit: null, noNaturalness: false, maxChars: DEFAULT_MAX_CHARS,
    source: 'drive-download',  // target source filter
    notSource: null,           // 'tts-local-regen' で「今日 regen していない全件」を選べる
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-naturalness') args.noNaturalness = true;
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--max-chars') args.maxChars = parseInt(argv[++i], 10);
    else if (a === '--source') args.source = argv[++i];
    else if (a === '--not-source') { args.notSource = argv[++i]; args.source = null; }
    else { console.error(`Unknown arg: ${a}`); process.exit(2); }
  }
  return args;
}

function pickCatalogEntry(catalog, word) {
  // Find all catalog entries for the word, prefer one with valid accent_yomigana
  // (avoid duplicate-reading entries with accent_source='unknown')
  const matches = catalog.entries.filter(e => e.word === word);
  if (!matches.length) return null;
  // Prefer entries with accent_yomigana or accent_override
  const withAcc = matches.filter(e => e.accent_yomigana || e.accent_override);
  if (withAcc.length) {
    // If multiple, prefer one with accent_source != 'unknown' and accent_reject_reason absent
    const clean = withAcc.filter(e => e.accent_source && e.accent_source !== 'unknown' && !e.accent_reject_reason);
    return clean[0] || withAcc[0];
  }
  // Fallback: take first entry with any reading
  return matches[0];
}

function pickTtsWorkaround(catalog, word) {
  // Find any catalog entry for the word that has tts_workaround (Phase α5 後半)
  for (const e of catalog.entries) {
    if (e.word === word && e.tts_workaround) return e.tts_workaround;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  await loadEnv(ROOT);

  const geminiKey = process.env.GEMINI_API_KEY;
  const naturalnessOn = !args.noNaturalness && !!geminiKey && !args.dryRun;

  const registry = await readJson(AUDIO_REGISTRY);
  const catalog = await readJson(VOCAB_CATALOG);

  // Find target entries by source filter
  const matchedEntries = [];
  for (const [id, e] of Object.entries(registry.entries)) {
    const src = e.audioSource;
    if (args.source && src === args.source) {
      matchedEntries.push({ id, entry: e });
    } else if (args.notSource && src !== args.notSource) {
      matchedEntries.push({ id, entry: e });
    }
  }
  const filterDesc = args.notSource ? `not '${args.notSource}'` : `'${args.source}'`;
  console.log(`===== regen-audio 開始 =====`);
  console.log(`  audioSource filter: ${filterDesc}`);
  console.log(`  候補: ${matchedEntries.length} 件`);
  const driveDownloadEntries = matchedEntries;  // keep var name for downstream code

  // Build targets
  const targets = [];
  const noCatalogMatch = [];
  for (const { id, entry } of driveDownloadEntries) {
    // ID format: word_<kanji> or sentence_<id>
    if (id.startsWith('word_')) {
      const word = id.substring(5);
      const catEntry = pickCatalogEntry(catalog, word);
      if (!catEntry) {
        noCatalogMatch.push(id);
        continue;
      }
      const reading = catEntry.reading || word;
      const yomigana = catEntry.accent_override || catEntry.accent_yomigana || null;
      const workaround = pickTtsWorkaround(catalog, word);
      targets.push({ kind: 'word', id, word, reading, text: reading, yomigana, workaround });
    } else {
      // sentence target — needs the textToSpeak from somewhere
      // Skip for now (sentences are handled separately and may not all be drive-download)
      // If needed, add Sheet lookup here.
      noCatalogMatch.push(id + ' (sentence-skip)');
    }
  }
  if (noCatalogMatch.length) {
    console.warn(`  ⚠ catalog 引き当てない or sentence: ${noCatalogMatch.length} 件 skip`);
    for (const id of noCatalogMatch.slice(0, 10)) console.warn(`     - ${id}`);
    if (noCatalogMatch.length > 10) console.warn(`     - ... +${noCatalogMatch.length - 10}`);
  }
  console.log(`  実際の合成対象: ${targets.length} 件`);

  if (args.limit) targets.length = Math.min(targets.length, args.limit);

  const yomiganaCount = targets.filter(t => t.yomigana).length;
  console.log(`  yomigana 指定: ${yomiganaCount} / ${targets.length} 件`);
  console.log(`  naturalness QC: ${naturalnessOn ? '有効' : '無効'}`);
  console.log(`  --dry-run: ${args.dryRun}`);

  if (args.dryRun) {
    console.log('\n--- dry-run sample ---');
    for (const t of targets.slice(0, 20)) {
      console.log(`  ${t.id.padEnd(30)} text="${t.text}" yomi=${t.yomigana || '(none)'}`);
    }
    if (targets.length > 20) console.log(`  ... +${targets.length - 20}`);
    return;
  }

  // Chars budget
  const usage = await readJson(USAGE_FILE);
  const mk = monthKey();
  const monthUsed = (usage.months[mk]?.charCount) ?? 0;
  const plannedChars = targets.reduce((s, t) => s + t.text.length, 0);
  console.log(`  当月使用: ${monthUsed.toLocaleString()} / 今回追加: ${plannedChars}`);
  if (monthUsed + plannedChars > args.maxChars) {
    console.error(`✗ 上限超過: ${monthUsed + plannedChars} > ${args.maxChars}`);
    process.exit(3);
  }

  await mkdir(AUDIO_DIR, { recursive: true });
  const tts = await createTtsClient({ rootDir: ROOT });

  let okCount = 0, errCount = 0, charsThisRun = 0;
  let yomiganaApplied = 0;
  let naturalnessOk = 0, naturalnessWarn = 0, naturalnessErr = 0;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const out = resolve(AUDIO_DIR, `${t.id}.mp3`);
    const relPath = `data/audio/${t.id}.mp3`;
    try {
      let raw;
      let tag = '';
      if (t.workaround?.usePlainKana) {
        // TTS bug workaround: kanji 誤読を避けるため plain kana text で合成
        raw = await synthesize(tts, { text: t.reading, voice: VOICE });
        tag = ` [tts_workaround:usePlainKana]`;
      } else if (t.yomigana) {
        const ssml = `<speak><phoneme alphabet="yomigana" ph="${escapeSsml(t.yomigana)}">${escapeSsml(t.word)}</phoneme></speak>`;
        raw = await synthesize(tts, { ssml, voice: VOICE });
        yomiganaApplied++;
        tag = ` [yomi="${t.yomigana}"]`;
      } else {
        raw = await synthesize(tts, { text: t.text, voice: VOICE });
        tag = ` [plain]`;
      }
      const qc = await applyQc(raw);
      await writeFile(out, qc);

      // Update registry: switch to tts-local, keep originalAudioUrl as historical reference
      registry.entries[t.id].audioUrl = relPath;
      registry.entries[t.id].audioSource = 'tts-local-regen';
      registry.entries[t.id].audioLocalizedAt = todayISO();
      registry.entries[t.id].regenReason = 'drive-download accent fix (Neural2 + yomigana SSML)';

      charsThisRun += t.text.length;
      okCount++;
      console.log(`  ✓ [${i+1}/${targets.length}] ${t.id} (${t.text.length}c, ${raw.length}→${qc.length}B)${tag}`);

      if (naturalnessOn) {
        try {
          const nat = await checkNaturalness({
            audioBuffer: qc, mimeType: 'audio/mp3', text: t.text, word: t.word,
            apiKey: geminiKey, model: NATURALNESS_MODEL,
          });
          registry.entries[t.id].naturalness = {
            score: nat.score, confidence: nat.confidence, comments: nat.comments,
            checkedAt: todayISO(), model: NATURALNESS_MODEL,
          };
          if (isNaturalnessWarn(registry.entries[t.id].naturalness)) {
            naturalnessWarn++;
            process.stderr.write(`    ⚠ nat WARN ${t.id}: score=${nat.score}\n`);
          } else {
            naturalnessOk++;
          }
        } catch (e) {
          naturalnessErr++;
          process.stderr.write(`    ⚠ nat ERR ${t.id}: ${String(e.message).slice(0,100)}\n`);
        }
      }

      // Save registry every 25 entries to be resilient
      if ((i + 1) % 25 === 0) {
        await writeJsonAtomic(AUDIO_REGISTRY, registry);
      }
    } catch (e) {
      errCount++;
      console.error(`  ✗ [${i+1}/${targets.length}] ${t.id}: ${e.message || e}`);
    }
  }

  // Final save
  usage.months[mk] = { charCount: monthUsed + charsThisRun, lastUpdated: todayISO() };
  await writeJsonAtomic(USAGE_FILE, usage);
  if (registry._meta) registry._meta.lastModified = todayISO();
  await writeJsonAtomic(AUDIO_REGISTRY, registry);

  console.log(`\n===== 完了 =====`);
  console.log(`  成功: ${okCount} / エラー: ${errCount}`);
  console.log(`  yomigana 適用: ${yomiganaApplied} / ${targets.length}`);
  if (naturalnessOn) console.log(`  naturalness: PASS ${naturalnessOk} / WARN ${naturalnessWarn} / ERR ${naturalnessErr}`);
  console.log(`  今回文字数: ${charsThisRun} / 当月計: ${monthUsed + charsThisRun}`);
}

main().catch(e => { console.error(e); process.exit(1); });
