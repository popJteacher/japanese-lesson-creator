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
//   npm run generate-audio -- --no-qc                   # 技術 QC をスキップ（debug 用）
//   npm run generate-audio -- --no-naturalness          # 自然さ QC（Gemini）をスキップ
//   npm run generate-audio -- --no-accent                # yomigana アクセント指定をスキップ
//
// 自然さ QC（Phase α2 統合・2026-05-24）:
//   GEMINI_API_KEY が .env にあれば、書き出し後に inline で自然さ評価を実行し
//   entry.naturalness = { score, confidence, comments, checkedAt, model } を書き戻す。
//   未設定なら自動 skip（fallback、ログのみ）。WARN/ERROR は生成を block しない。
//   遡及検査専用 CLI は scripts/check-audio-naturalness.mjs に残置。
//
// yomigana アクセント指定（Phase α3 統合・2026-05-24）:
//   vocab_catalog.json の各 entry に `accent_yomigana` (例: "^ゆき!") があれば、
//   SSML <phoneme alphabet="yomigana" ph="..."> で送信して教科書アクセントで合成。
//   なければ plain text fallback（既存挙動）。--no-accent でスキップ可。
//   word target のみ対象（sentence は対象外）。

import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, createTtsClient, synthesize } from './lib/tts-client.mjs';
import { createSheetsClient, fetchVocabulary, fetchExamples } from './lib/sheets-client.mjs';
import { applyQc } from './lib/audio-qc.mjs';
import { checkNaturalness, isWarn as isNaturalnessWarn } from './lib/audio-naturalness-qc.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_REGISTRY = resolve(ROOT, 'data/master_audio_registry.json');
const AUDIO_DIR = resolve(ROOT, 'data/audio');
const USAGE_FILE = resolve(ROOT, 'data/_meta/tts_usage.json');
const VOCAB_CATALOG = resolve(ROOT, 'data/vocab_catalog.json');

const DEFAULT_MAX_CHARS_MONTH = 800_000;
const FREE_TIER_LIMIT = 1_000_000;
const VOICE = { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' };
const NATURALNESS_MODEL = 'gemini-2.5-flash';

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
function escapeSsml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
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
    // word は vocab_catalog lookup 用、text は plain text fallback 用
    targets.push({ kind: 'word', id: audioId, text: reading || word, word, reading });
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
    maxChars: DEFAULT_MAX_CHARS_MONTH, force: false, noQc: false, noNaturalness: false, noAccent: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--no-qc') args.noQc = true;
    else if (a === '--no-naturalness') args.noNaturalness = true;
    else if (a === '--no-accent') args.noAccent = true;
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
      console.log('Usage: node scripts/generate-audio-local.mjs [--dry-run] [--limit N] [--only word|sentence] [--max-chars N] [--force] [--no-qc] [--no-naturalness] [--no-accent]');
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

  // 自然さ QC は GEMINI_API_KEY があれば自動 ON。--no-naturalness で明示 OFF。
  const geminiKey = process.env.GEMINI_API_KEY;
  const naturalnessOn = !args.noNaturalness && !!geminiKey && !args.dryRun;
  const naturalnessLabel = args.noNaturalness
    ? '無効（--no-naturalness）'
    : !geminiKey
      ? '無効（GEMINI_API_KEY 未設定）'
      : args.dryRun
        ? '無効（--dry-run）'
        : `有効（${NATURALNESS_MODEL}）`;

  // vocab_catalog から accent lookup map を作成（word target のみ対象）
  // key 形式: "word|reading"（vocab_catalog の entry.key と一致）
  // 優先順: accent_override (manual) > accent_consensus_override > accent_yomigana > plain
  // - accent_override: 教師が手動で NHK 標準と違う UniDic/naist 結果を上書きする用途
  // - accent_consensus_override: scripts/build-accent-consensus.py が UniDic+NHK+OJAD 合議で書く
  const accentMap = new Map();
  const ttsWorkaroundMap = new Map();  // word → { usePlainKana, ... } (Phase α5 後半・2026-05-25)
  let accentLabel;
  let overrideCount = 0;
  let consensusCount = 0;
  let workaroundCount = 0;
  if (args.noAccent) {
    accentLabel = '無効（--no-accent）';
  } else {
    try {
      const catalog = await readJson(VOCAB_CATALOG);
      for (const e of (catalog.entries || [])) {
        if (!e.key) continue;
        if (e.accent_override) {
          accentMap.set(e.key, e.accent_override);
          overrideCount++;
        } else if (e.accent_consensus_override) {
          accentMap.set(e.key, e.accent_consensus_override);
          consensusCount++;
        } else if (e.accent_yomigana) {
          accentMap.set(e.key, e.accent_yomigana);
        }
        if (e.tts_workaround && e.word) {
          ttsWorkaroundMap.set(e.word, e.tts_workaround);
          workaroundCount++;
        }
      }
      accentLabel = `有効（vocab_catalog から ${accentMap.size} 件、うち override ${overrideCount} / consensus ${consensusCount}、TTS workaround ${workaroundCount} 件）`;
    } catch (e) {
      accentLabel = `無効（vocab_catalog 読み込み失敗: ${String(e.message || e).slice(0, 80)}）`;
    }
  }

  console.log('===== generate-audio-local 開始 =====');
  console.log(`  voice:         ${VOICE.name} (${VOICE.languageCode})`);
  console.log(`  audio dir:     ${relative(ROOT, AUDIO_DIR)}/`);
  console.log(`  technical qc:  ${args.noQc ? '無効（--no-qc）' : '2-pass loudnorm (I=-16)'}`);
  console.log(`  naturalness:   ${naturalnessLabel}`);
  console.log(`  accent (yomigana): ${accentLabel}`);
  console.log(`  max chars/月:  ${args.maxChars.toLocaleString()} (free tier ${FREE_TIER_LIMIT.toLocaleString()})`);
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
  let accentAppliedCount = 0;
  let naturalnessOkCount = 0, naturalnessWarnCount = 0, naturalnessErrCount = 0;
  const today = todayISO();
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const out = resolve(AUDIO_DIR, `${t.id}.mp3`);
    const relPath = `data/audio/${t.id}.mp3`;
    try {
      // word target で accent_yomigana がある場合は SSML <phoneme alphabet="yomigana">、
      // それ以外は plain text fallback。sentence は常に plain text。
      // ただし tts_workaround.usePlainKana=true の word は SSML をスキップして
      // text=reading (kana) で送る（Google TTS の kanji 誤読 bug 対策、例：寝る→にゃる）。
      const workaround = t.kind === 'word' && t.word ? ttsWorkaroundMap.get(t.word) : null;
      const accentYomigana = !workaround?.usePlainKana && t.kind === 'word' && t.word && t.reading
        ? accentMap.get(`${t.word}|${t.reading}`)
        : null;
      let raw;
      let accentTag = '';
      if (workaround?.usePlainKana) {
        raw = await synthesize(tts, { text: t.reading || t.text, voice: VOICE });
        accentTag = ` [tts_workaround:usePlainKana]`;
      } else if (accentYomigana) {
        const ssml = `<speak><phoneme alphabet="yomigana" ph="${escapeSsml(accentYomigana)}">${escapeSsml(t.word)}</phoneme></speak>`;
        raw = await synthesize(tts, { ssml, voice: VOICE });
        accentAppliedCount++;
        accentTag = ` [accent="${accentYomigana}"]`;
      } else {
        raw = await synthesize(tts, { text: t.text, voice: VOICE });
      }
      const finalAudio = args.noQc ? raw : await applyQc(raw);
      await writeFile(out, finalAudio);
      registry.entries[t.id].audioUrl = relPath;
      charsThisRun += t.text.length;
      okCount++;
      const qcTag = args.noQc ? '' : ` → QC ${finalAudio.length}B`;
      console.log(`  ✓ [${i+1}/${targets.length}] ${t.id} (${t.text.length} chars, raw ${raw.length}B${qcTag})${accentTag}`);

      // 自然さ QC (Phase α2 inline)。HARD ERROR にせず生成は続行する。
      if (naturalnessOn) {
        try {
          const nat = await checkNaturalness({
            audioBuffer: finalAudio,
            mimeType: 'audio/mp3',
            text: t.text,
            word: t.kind === 'word' ? t.text : null,
            apiKey: geminiKey,
            model: NATURALNESS_MODEL,
          });
          const naturalness = {
            score: nat.score,
            confidence: nat.confidence,
            comments: nat.comments,
            checkedAt: today,
            model: NATURALNESS_MODEL,
          };
          registry.entries[t.id].naturalness = naturalness;
          if (isNaturalnessWarn(naturalness)) {
            naturalnessWarnCount++;
            const tag = `score=${nat.score} conf=${nat.confidence}`;
            const cm = nat.comments.length ? ` / ${nat.comments.join(' / ')}` : '';
            process.stderr.write(`    ⚠ naturalness WARN ${t.id}: ${tag}${cm}\n`);
          } else {
            naturalnessOkCount++;
          }
        } catch (e) {
          naturalnessErrCount++;
          process.stderr.write(`    ⚠ naturalness ERROR ${t.id}: ${String(e.message || e).slice(0, 200)}\n`);
        }
      }
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
  console.log(`  accent (yomigana) 適用: ${accentAppliedCount} 件`);
  if (naturalnessOn) {
    console.log(`  naturalness: PASS ${naturalnessOkCount} / WARN ${naturalnessWarnCount} / ERROR ${naturalnessErrCount}`);
  }
  console.log(`  今回文字数: ${charsThisRun.toLocaleString()} / 当月計: ${(monthUsed + charsThisRun).toLocaleString()} / 上限: ${args.maxChars.toLocaleString()}`);
  console.log(`  registry: ${relative(ROOT, AUDIO_REGISTRY)}`);
  console.log(`  usage:    ${relative(ROOT, USAGE_FILE)}`);
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
