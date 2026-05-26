#!/usr/bin/env node
// scripts/generate-images-local.mjs
// Phase 4 ③ + Phase 4 後 nanobanana 化：
// Nano Banana（既定）または Imagen 4 でローカルバッチ生成 + registry 連携 + 日次カウンタ。
// gas/pipeline.gs generateImageBatch の置き換え。出力先は data/images/{imageId}.png。
//
// 3 モード（auto がデフォルト）：
//   --print-prompts  : API 不要。プロンプトを Markdown に書き出し、Gemini 等で手生成
//                      → data/images/{imageId}.png に保存 → sync-only で registry 反映。
//   --sync-only      : API 不要。data/images/ を scan して registry を更新（手動 import）。
//   (default = auto) : 生成 → PNG 書き出し → registry 更新。
//
// バックエンド：
//   --backend nanobanana  （既定）gemini-2.5-flash-image / ~$0.0387/枚（output tokens ベース）
//                          aspect ratio / size / person generation は API 非対応。
//                          → プロンプト inline directive で制御（v3.11.1 以降）。
//   --backend imagen4     imagen-4.0-generate-001 / $0.04/枚固定。
//                          aspect ratio / size / personGeneration を API 経由で指定可能。
//
// 規律（generate-audio-local 流儀）：
//   - registry の entries に key (= imageId) が無いなら警告して skip。
//   - 既に data/images/{imageId}.png が存在し --force 無しなら skip。
//   - Drive URL（http://…）が registry に残っているのは「未ローカル化」とみなし対象に含める。
//   - 成功時は registry.entries[id] を：
//        images = [{ imageId: `${id}_001`, filename: `${id}.png`,
//                     imageUrl: `data/images/${id}.png`,
//                     promptRef: `${promptBasename}#${id}`,
//                     generatedAt: today, regenerate: false }]
//        status = 'generated'   （旧 'approved' も含めて常に下げる：v3.5 で見た目が変わるため再 review）
//
// 使い方:
//   npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --print-prompts
//   npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --sync-only
//   npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --dry-run
//   npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json --limit 1
//   npm run generate-images -- --prompts data/image_prompts_lesson01_v3_11_1.json     # 既定 nanobanana
//   npm run generate-images -- --prompts ... --backend imagen4                         # Imagen 4 切替
//   npm run generate-images -- --prompts ... --max-images 50                           # 日次上限
//   npm run generate-images -- --prompts ... --force                                   # 既存 PNG も上書き
//   npm run generate-images -- --prompts ... --backend imagen4 --person dont_allow     # Imagen 4 専用 option

import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnv,
  generateImage,
  DEFAULT_IMAGEN_MODEL,
  IMAGEN_PRICE_USD,
} from './lib/imagen-client.mjs';
import {
  generateNanobananaImage,
  DEFAULT_NANOBANANA_MODEL,
  NANOBANANA_PRICE_PER_M_OUTPUT_TOKENS,
  NANOBANANA_IMAGE_TOKEN_ESTIMATE,
} from './lib/nanobanana-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE_REGISTRY = resolve(ROOT, 'data/master_image_registry.json');
const IMAGES_DIR = resolve(ROOT, 'data/images');
const USAGE_FILE = resolve(ROOT, 'data/_meta/imagen_usage.json');
const DEFAULT_PROMPT_OUT_DIR = resolve(ROOT, '.tmp_verify');

const DEFAULT_MAX_IMAGES_DAY = 30;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// ────────────────────────────────────────────────────────────
// 小道具
// ────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nowISO() {
  return new Date().toISOString();
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
function isPng(buf) {
  if (!buf || buf.length < 8) return false;
  return buf.subarray(0, 8).equals(PNG_SIGNATURE);
}

// ────────────────────────────────────────────────────────────
// registry 更新ヘルパ
// ────────────────────────────────────────────────────────────
function buildImageRecord({ imageId, promptRef }) {
  return {
    imageId: `${imageId}_001`,
    filename: `${imageId}.png`,
    imageUrl: `data/images/${imageId}.png`,
    promptRef,
    generatedAt: todayISO(),
    regenerate: false,
  };
}
function applyRegistryUpdate(registry, imageId, promptRef) {
  const entry = registry.entries[imageId];
  if (!entry) throw new Error(`registry entry missing: ${imageId}`);
  entry.images = [buildImageRecord({ imageId, promptRef })];
  entry.status = 'generated';
}

// ────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────
const MODES = new Set(['auto', 'print-prompts', 'sync-only']);
const PERSON_OPTS = new Set(['allow_adult', 'dont_allow', 'allow_all']);
const BACKENDS = new Set(['nanobanana', 'imagen4']);
const DEFAULT_BACKEND = 'nanobanana';

function parseArgs(argv) {
  const args = {
    prompts: null,
    mode: 'auto',
    backend: DEFAULT_BACKEND,
    dryRun: false,
    limit: null,
    maxImages: DEFAULT_MAX_IMAGES_DAY,
    force: false,
    person: 'allow_adult',
    aspect: '1:1',
    size: '1K',
    out: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompts') args.prompts = argv[++i];
    else if (a === '--print-prompts') args.mode = 'print-prompts';
    else if (a === '--sync-only') args.mode = 'sync-only';
    else if (a === '--backend') {
      const v = argv[++i];
      if (!BACKENDS.has(v)) die(`--backend must be one of ${[...BACKENDS].join(',')}`);
      args.backend = v;
    } else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--limit') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v <= 0) die('--limit must be positive int');
      args.limit = v;
    } else if (a === '--max-images') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v <= 0) die('--max-images must be positive int');
      args.maxImages = v;
    } else if (a === '--person') {
      const v = argv[++i];
      if (!PERSON_OPTS.has(v)) die(`--person must be one of ${[...PERSON_OPTS].join(',')}`);
      args.person = v;
    } else if (a === '--aspect') {
      args.aspect = argv[++i];
    } else if (a === '--size') {
      args.size = argv[++i];
    } else if (a === '--out') {
      args.out = argv[++i];
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      die(`Unknown arg: ${a}`);
    }
  }
  if (!args.prompts) die('--prompts <path> is required');
  if (!MODES.has(args.mode)) die(`bad mode: ${args.mode}`);
  return args;
}
function die(msg) { console.error(msg); process.exit(2); }
function printHelp() {
  console.log([
    'Usage: node scripts/generate-images-local.mjs --prompts <path> [mode] [options]',
    '',
    'Modes:',
    '  (default)         生成 + 書き出し + registry 更新',
    '  --print-prompts   プロンプトを Markdown に書き出し（API 不要・$0）',
    '  --sync-only       data/images/ を scan して registry を更新（API 不要・$0）',
    '',
    'Backends:',
    '  --backend nanobanana  （既定）gemini-2.5-flash-image・~$0.0387/枚（token ベース）',
    '  --backend imagen4     imagen-4.0-generate-001・$0.04/枚固定',
    '',
    'Options:',
    '  --prompts <path>     prompt JSON（image_prompts_lessonNN_vX_Y.json）',
    '  --dry-run            auto モードで対象だけ列挙（API 呼ばず・書き込みなし）',
    '  --limit N            この実行で N 件まで',
    '  --max-images N       日次上限（default ' + DEFAULT_MAX_IMAGES_DAY + '）',
    '  --force              既存 data/images/{id}.png も上書き',
    '  --person <opt>       (imagen4 専用) allow_adult | dont_allow | allow_all（default allow_adult）',
    '  --aspect <ratio>     (imagen4 専用) 1:1 / 3:4 / 4:3 / 9:16 / 16:9（default 1:1）',
    '  --size <res>         (imagen4 専用) 1K | 2K（default 1K）',
    '                       ※ nanobanana では --person / --aspect / --size は API 非対応のため無視される',
    '                          （aspect ratio はプロンプト inline directive で制御）',
    '  --out <path>         --print-prompts の出力先 .md パス',
  ].join('\n'));
}

// ────────────────────────────────────────────────────────────
// プロンプト JSON のロードと検証
// ────────────────────────────────────────────────────────────
async function loadPromptsFile(promptsPath) {
  const abs = resolve(ROOT, promptsPath);
  const json = await readJson(abs);
  if (!json || !Array.isArray(json.vocabulary)) {
    throw new Error(`prompts file invalid: ${abs} (no vocabulary[])`);
  }
  const promptBasename = basename(abs);
  return { promptsPath: abs, promptBasename, json };
}

// ────────────────────────────────────────────────────────────
// 各モードの実装
// ────────────────────────────────────────────────────────────
async function runPrintPrompts({ json, promptBasename, args }) {
  const guideVersion = json._meta?.guideVersion || 'unknown';
  const guideHash = json._meta?.guideHashNormalized || 'unknown';
  const lessonNo = json._meta?.lessonNo;
  const outPath = args.out
    ? resolve(ROOT, args.out)
    : resolve(DEFAULT_PROMPT_OUT_DIR, `prompts_${basename(promptBasename, '.json')}.md`);

  const lines = [];
  lines.push(`# Image prompts — manual generation guide`);
  lines.push(`> Generated ${todayISO()} from \`${promptBasename}\` (${guideVersion} / hash ${guideHash})`);
  lines.push(`> Lesson: ${lessonNo ?? '?'}  ·  Entries: ${json.vocabulary.length}`);
  lines.push('');
  lines.push(`## How to use`);
  lines.push('');
  lines.push(`1. For each entry below, copy the prompt code block.`);
  lines.push(`2. Paste into Gemini ([gemini.google.com](https://gemini.google.com)) or AI Studio Image generation.`);
  lines.push(`3. UI settings to choose:`);
  lines.push(`   - Aspect ratio: **square (1:1)**`);
  lines.push(`   - Quality / size: 1K is fine`);
  lines.push(`4. Download the generated PNG and **save** to:`);
  lines.push(`   \`data/images/{imageId}.png\`  (exact filename — see each section header)`);
  lines.push(`5. After saving any/all files, run sync to update the registry:`);
  lines.push('   ```');
  lines.push(`   npm run generate-images -- --prompts ${relative(ROOT, args.promptsAbs).replace(/\\/g, '/')} --sync-only`);
  lines.push('   ```');
  lines.push('');
  lines.push(`---`);
  lines.push('');

  for (let i = 0; i < json.vocabulary.length; i++) {
    const v = json.vocabulary[i];
    lines.push(`## ${i + 1}. \`${v.imageId}\` — ${v.word} (${v.en})`);
    lines.push('');
    lines.push(`- reading: ${v.reading ?? '-'}`);
    lines.push(`- vocab_type: ${v.vocab_type ?? '-'}`);
    lines.push(`- **save as:** \`data/images/${v.imageId}.png\``);
    lines.push('');
    lines.push('```');
    lines.push((v.prompt || '').trim());
    lines.push('```');
    lines.push('');
    lines.push(`---`);
    lines.push('');
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, lines.join('\n'), 'utf8');

  console.log('===== generate-images-local --print-prompts =====');
  console.log(`  prompts:    ${promptBasename}`);
  console.log(`  entries:    ${json.vocabulary.length}`);
  console.log(`  output:     ${relative(ROOT, outPath)}`);
  console.log(`  next step:  open the .md, paste each prompt into Gemini,`);
  console.log(`              save each image as data/images/{imageId}.png,`);
  console.log(`              then run --sync-only to update the registry.`);
}

async function runSyncOnly({ json, promptBasename, args }) {
  const registry = await readJson(IMAGE_REGISTRY);
  let updated = 0, missingEntry = 0, missingFile = 0, badPng = 0;
  const updatedIds = [];
  const missingFileIds = [];

  for (const v of json.vocabulary) {
    const id = v.imageId;
    if (!registry.entries[id]) {
      console.warn(`  ⚠ registry 未登録 (skip): ${id}`);
      missingEntry++;
      continue;
    }
    const pngPath = resolve(IMAGES_DIR, `${id}.png`);
    if (!(await fileExists(pngPath))) {
      missingFile++;
      missingFileIds.push(id);
      continue;
    }
    const buf = await readFile(pngPath);
    if (!isPng(buf)) {
      console.warn(`  ⚠ PNG 署名が壊れている (skip): data/images/${id}.png`);
      badPng++;
      continue;
    }
    applyRegistryUpdate(registry, id, `${promptBasename}#${id}`);
    updated++;
    updatedIds.push(id);
  }

  console.log('===== generate-images-local --sync-only =====');
  console.log(`  prompts:        ${promptBasename}`);
  console.log(`  entries in JSON: ${json.vocabulary.length}`);
  console.log(`  updated:        ${updated}  (registry status='generated')`);
  console.log(`  missing entry:  ${missingEntry}`);
  console.log(`  missing PNG:    ${missingFile}`);
  console.log(`  bad PNG:        ${badPng}`);
  if (updated > 0) {
    if (registry._meta) registry._meta.lastModified = todayISO();
    if (!args.dryRun) {
      await writeJsonAtomic(IMAGE_REGISTRY, registry);
      console.log(`  ✓ ${relative(ROOT, IMAGE_REGISTRY)} 書き込み完了`);
    } else {
      console.log(`  (dry-run: registry には書き込まない)`);
    }
    console.log(`  updated IDs: ${updatedIds.join(', ')}`);
  }
  if (missingFile > 0) {
    console.log(`  missing PNG IDs (まだ手保存していない or 別名で保存中):`);
    for (const id of missingFileIds.slice(0, 20)) console.log(`     - ${id}`);
    if (missingFileIds.length > 20) console.log(`     - ... +${missingFileIds.length - 20} more`);
  }
}

// v4.0.4 R11 (X-c 復元 2026-05-26): styleReferences の解決とロード
// JSON 内の相対パス配列 → { bytes, mimeType }[] へ変換。imagen4 では未対応のため呼び側で警告。
const REF_MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
async function loadReferenceImages(refs) {
  if (!Array.isArray(refs) || refs.length === 0) return [];
  const out = [];
  for (const ref of refs) {
    if (typeof ref !== 'string') {
      throw new Error(`styleReferences entry must be a string path (got ${typeof ref})`);
    }
    const abs = resolve(ROOT, ref);
    const ext = ref.toLowerCase().slice(ref.lastIndexOf('.'));
    const mimeType = REF_MIME_BY_EXT[ext];
    if (!mimeType) {
      throw new Error(`styleReferences[*] must end in .png/.jpg/.jpeg/.webp (got "${ref}")`);
    }
    const bytes = await readFile(abs);
    out.push({ bytes, mimeType });
  }
  return out;
}

// バックエンドごとの 1 件生成呼び出し
async function callBackend(backend, prompt, args, styleReferences, onRetry) {
  if (backend === 'imagen4') {
    if (styleReferences && styleReferences.length > 0) {
      console.warn(`     ⚠ imagen4 backend は styleReferences 未対応のため無視されます`);
    }
    return await generateImage({
      prompt,
      aspectRatio: args.aspect,
      imageSize: args.size,
      personGeneration: args.person,
      sampleCount: 1,
      onRetry,
    });
  }
  // nanobanana（既定）
  const referenceImages = await loadReferenceImages(styleReferences);
  return await generateNanobananaImage({
    prompt,
    model: DEFAULT_NANOBANANA_MODEL,
    referenceImages,
    onRetry,
  });
}

async function runAuto({ json, promptBasename, args }) {
  const registry = await readJson(IMAGE_REGISTRY);
  const usage = await readJson(USAGE_FILE, {
    _meta: { description: 'Image gen daily count (Phase 4 ③ + 後 nanobanana 化)' },
    days: {},
  });
  const day = todayISO();
  const dayUsed = usage.days[day]?.count ?? 0;

  const modelLabel = args.backend === 'imagen4'
    ? `${DEFAULT_IMAGEN_MODEL} ($${IMAGEN_PRICE_USD[DEFAULT_IMAGEN_MODEL]}/img fixed)`
    : `${DEFAULT_NANOBANANA_MODEL} (~$${(30 / 1_000_000 * NANOBANANA_IMAGE_TOKEN_ESTIMATE).toFixed(4)}/img · token ベース)`;
  const fallbackUnitCost = args.backend === 'imagen4'
    ? (IMAGEN_PRICE_USD[DEFAULT_IMAGEN_MODEL] ?? 0)
    : ((NANOBANANA_PRICE_PER_M_OUTPUT_TOKENS[DEFAULT_NANOBANANA_MODEL] ?? 0) / 1_000_000 * NANOBANANA_IMAGE_TOKEN_ESTIMATE);

  console.log('===== generate-images-local (auto) =====');
  console.log(`  prompts:    ${promptBasename}`);
  console.log(`  backend:    ${args.backend}`);
  console.log(`  model:      ${modelLabel}`);
  if (args.backend === 'imagen4') {
    console.log(`  aspect:     ${args.aspect}  size: ${args.size}  person: ${args.person}`);
  } else {
    console.log(`  aspect/size/person: API 非対応のためプロンプト inline directive に委ねる`);
    if (args.aspect !== '1:1' || args.size !== '1K' || args.person !== 'allow_adult') {
      console.warn(`  ⚠ --aspect / --size / --person 指定は nanobanana では無視されます`);
    }
  }
  console.log(`  daily used: ${dayUsed} / cap ${args.maxImages}  (today=${day})`);
  if (args.dryRun) console.log(`  mode:       --dry-run`);
  if (args.limit) console.log(`  --limit:    ${args.limit}`);
  if (args.force) console.log(`  --force:    上書き再生成`);

  // 対象選別
  const targets = [];
  let notInReg = 0, alreadyLocal = 0;
  for (const v of json.vocabulary) {
    const id = v.imageId;
    if (!registry.entries[id]) {
      console.warn(`  ⚠ registry 未登録 (skip): ${id}`);
      notInReg++;
      continue;
    }
    const pngPath = resolve(IMAGES_DIR, `${id}.png`);
    if (await fileExists(pngPath)) {
      if (!args.force) {
        alreadyLocal++;
        continue;
      }
    }
    targets.push({ id, prompt: v.prompt, word: v.word, en: v.en, styleReferences: v.styleReferences || [] });
  }
  console.log(`  targets:    ${targets.length}  (skip: ${alreadyLocal} 既ローカル / ${notInReg} 未登録)`);
  const refsCount = targets.reduce((n, t) => n + (t.styleReferences?.length || 0), 0);
  if (refsCount > 0) {
    if (args.backend === 'imagen4') {
      console.warn(`  ⚠ styleReferences total ${refsCount} 件 / imagen4 は未対応のため無視されます`);
    } else {
      console.log(`  styleRefs:  total ${refsCount} 件 attached (nanobanana multi-image input, v4.0.4 R11)`);
    }
  }

  const limited = args.limit ? targets.slice(0, args.limit) : targets;
  console.log(`  実行予定:   ${limited.length} 件`);

  // 上限チェック
  if (!args.dryRun && dayUsed + limited.length > args.maxImages) {
    const room = Math.max(0, args.maxImages - dayUsed);
    console.error(`✗ 日次上限超過: ${dayUsed} + ${limited.length} > ${args.maxImages}（残り ${room} 枚）`);
    console.error(`  対処：--limit ${room} で絞るか、--max-images で上限を上げる`);
    process.exit(3);
  }

  if (args.dryRun || limited.length === 0) {
    if (args.dryRun) {
      for (const t of limited.slice(0, 30)) {
        console.log(`     ${t.id.padEnd(30)} (${t.word} / ${t.en})`);
      }
      if (limited.length > 30) console.log(`     ... +${limited.length - 30} more`);
    }
    console.log('--- dry-run / 対象 0 件のため終了 ---');
    return;
  }

  await loadEnv(ROOT);
  await mkdir(IMAGES_DIR, { recursive: true });

  let okCount = 0, errCount = 0, costThisRun = 0;
  for (let i = 0; i < limited.length; i++) {
    const t = limited[i];
    const pngPath = resolve(IMAGES_DIR, `${t.id}.png`);
    try {
      const result = await callBackend(args.backend, t.prompt, args, t.styleReferences, ({ attempt, status, delayMs }) => {
        console.warn(`     ⚠ HTTP ${status} retry attempt ${attempt} in ${delayMs} ms`);
      });
      if (!isPng(result.bytes)) {
        throw new Error('response is not a PNG (signature mismatch)');
      }
      await writeFile(pngPath, result.bytes);
      applyRegistryUpdate(registry, t.id, `${promptBasename}#${t.id}`);
      okCount++;
      costThisRun += (result.costUsd ?? fallbackUnitCost);
      console.log(`  ✓ [${i + 1}/${limited.length}] ${t.id}  ${result.bytes.length}B  ${result.durationMs}ms  $${(result.costUsd ?? 0).toFixed(4)}`);
    } catch (e) {
      errCount++;
      console.error(`  ✗ [${i + 1}/${limited.length}] ${t.id}: ${e.message || e}`);
    }
  }

  // 使用量更新
  usage.days[day] = {
    count: dayUsed + okCount,
    cost_usd: Number(((usage.days[day]?.cost_usd ?? 0) + costThisRun).toFixed(4)),
    lastUpdated: nowISO(),
    lastBackend: args.backend,
  };
  await writeJsonAtomic(USAGE_FILE, usage);

  // registry 書き込み
  if (registry._meta) registry._meta.lastModified = todayISO();
  await writeJsonAtomic(IMAGE_REGISTRY, registry);

  console.log('\n===== generate-images-local (auto) 完了 =====');
  console.log(`  backend: ${args.backend} / 成功: ${okCount} / エラー: ${errCount}`);
  console.log(`  本実行コスト: $${costThisRun.toFixed(4)} / 当日累計: ${usage.days[day].count} 枚  $${usage.days[day].cost_usd}`);
  console.log(`  registry:  ${relative(ROOT, IMAGE_REGISTRY)}`);
  console.log(`  usage:     ${relative(ROOT, USAGE_FILE)}`);
}

// ────────────────────────────────────────────────────────────
// メイン
// ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  const { promptsPath, promptBasename, json } = await loadPromptsFile(args.prompts);
  args.promptsAbs = promptsPath;

  if (args.mode === 'print-prompts') {
    return runPrintPrompts({ json, promptBasename, args });
  }
  if (args.mode === 'sync-only') {
    return runSyncOnly({ json, promptBasename, args });
  }
  return runAuto({ json, promptBasename, args });
}

main().catch((e) => {
  console.error('✗ ' + (e.message || e));
  process.exit(1);
});
