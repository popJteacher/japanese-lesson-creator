#!/usr/bin/env node
// missing-assets.mjs — レジストリから imageUrl/audioUrl が未設定のエントリを列挙する。
// 正典: data/master_image_registry.json / data/master_audio_registry.json
//
// 使い方:
//   node scripts/missing-assets.mjs                 人間可読レポート + 件数
//   node scripts/missing-assets.mjs --json          JSON 出力（CI 用）
//   node scripts/missing-assets.mjs --type=image    片方だけ
//   node scripts/missing-assets.mjs --type=audio
//
// 終了コード: 未設定が 0 件なら 0、1 件以上なら 1（CI で使うため）

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMG_PATH = resolve(ROOT, 'data/master_image_registry.json');
const AUD_PATH = resolve(ROOT, 'data/master_audio_registry.json');

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const typeArg = [...args].find(a => a.startsWith('--type='))?.slice(7);
const wantImage = !typeArg || typeArg === 'image';
const wantAudio = !typeArg || typeArg === 'audio';

const isOutdated = (rec) => rec?.status === 'outdated' || rec?._outdated_reason;

async function loadJson(p) {
  const txt = await readFile(p, 'utf-8');
  return JSON.parse(txt);
}

async function scanImages() {
  const reg = await loadJson(IMG_PATH);
  const entries = reg.entries || {};
  const missing = [];
  for (const [id, rec] of Object.entries(entries)) {
    if (isOutdated(rec)) continue;
    const images = Array.isArray(rec.images) ? rec.images : [];
    if (images.length === 0) {
      missing.push({ id, reason: 'no_images_array', status: rec.status ?? null });
      continue;
    }
    for (const im of images) {
      if (!im.imageUrl) {
        missing.push({
          id,
          imageId: im.imageId ?? null,
          reason: 'null_imageUrl',
          status: rec.status ?? null,
        });
      }
    }
  }
  return {
    totalEntries: Object.keys(entries).length,
    activeEntries: Object.values(entries).filter((r) => !isOutdated(r)).length,
    metaTotal: reg?._meta?.totalEntries ?? null,
    missing,
  };
}

async function scanAudio() {
  const reg = await loadJson(AUD_PATH);
  const entries = reg.entries || {};
  const missing = [];
  for (const [id, rec] of Object.entries(entries)) {
    if (isOutdated(rec)) continue;
    if (!rec.audioUrl) {
      missing.push({ id, reason: 'null_audioUrl', status: rec.status ?? null });
    }
  }
  return {
    totalEntries: Object.keys(entries).length,
    activeEntries: Object.values(entries).filter((r) => !isOutdated(r)).length,
    metaTotal: reg?._meta?.totalEntries ?? null,
    missing,
  };
}

const out = {};
if (wantImage) out.image = await scanImages();
if (wantAudio) out.audio = await scanAudio();

const exit = Object.values(out).some((r) => r.missing.length > 0) ? 1 : 0;

if (asJson) {
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exit(exit);
}

const lines = [];
const fmtSummary = (label, r) => {
  const active = r.activeEntries;
  const total = r.totalEntries;
  const meta = r.metaTotal != null ? ` (meta totalEntries=${r.metaTotal})` : '';
  lines.push(
    `## ${label}\n  entries: ${total} (active=${active}${meta == null ? '' : meta})\n  missing: ${r.missing.length}`
  );
};

if (out.image) {
  fmtSummary('master_image_registry.json', out.image);
  if (out.image.missing.length > 0) {
    lines.push('  missing IDs:');
    for (const m of out.image.missing) {
      const sub = m.imageId ? ` / ${m.imageId}` : '';
      lines.push(`    - ${m.id}${sub}  [${m.reason}; status=${m.status ?? 'null'}]`);
    }
  }
}
if (out.audio) {
  fmtSummary('master_audio_registry.json', out.audio);
  if (out.audio.missing.length > 0) {
    lines.push('  missing IDs:');
    for (const m of out.audio.missing) {
      lines.push(`    - ${m.id}  [${m.reason}; status=${m.status ?? 'null'}]`);
    }
  }
}

process.stdout.write(lines.join('\n') + '\n');
process.exit(exit);
