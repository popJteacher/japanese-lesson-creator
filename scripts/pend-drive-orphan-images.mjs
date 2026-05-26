#!/usr/bin/env node
// scripts/pend-drive-orphan-images.mjs
// master_image_registry.json で imageUrl が Drive URL の entry 29 件を pending 化する。
// 経緯: ローカル環境移行後、これらの Drive 画像は SA からアクセス不可だったため
//      再 DL ではなく skill pipeline で再生成する方針に切替（2026-05-26 user 確定）。
//
// mutation:
//   - entry.status: 'generated'/'approved' → 'pending'
//   - images[0].originalImageUrl ← Drive URL (traceability)
//   - images[0].imageUrl ← null
//   - images[0].generatedAt ← null
//   - images[0].regenerate ← false
//   - images[0].pendedReason ← 'drive-orphaned'
//   - images[0].pendedAt ← today
//
// 使い方:
//   node scripts/pend-drive-orphan-images.mjs --dry-run    プレビュー
//   node scripts/pend-drive-orphan-images.mjs --apply      実適用 (registry 書き換え)

import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = resolve(ROOT, 'data/master_image_registry.json');

function isDriveUrl(u) {
  return typeof u === 'string' && u.includes('drive.google.com');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--apply');
  if (dryRun && !args.includes('--dry-run')) {
    console.log('(--dry-run 既定。実適用には --apply を付ける)');
  }

  const today = new Date().toISOString().slice(0, 10);
  const raw = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(raw);
  const entries = registry.entries || {};

  const mutations = [];
  for (const id of Object.keys(entries)) {
    const en = entries[id];
    const imgs = Array.isArray(en?.images) ? en.images : [];
    for (let i = 0; i < imgs.length; i++) {
      if (isDriveUrl(imgs[i]?.imageUrl)) {
        mutations.push({ id, imgIndex: i, oldUrl: imgs[i].imageUrl, oldStatus: en.status });
      }
    }
  }

  console.log(`===== pend-drive-orphan-images =====`);
  console.log(`registry: ${REGISTRY_PATH}`);
  console.log(`Drive orphan entries: ${mutations.length}`);
  console.log();

  for (const m of mutations) {
    console.log(`  - ${m.id}[${m.imgIndex}]  status=${m.oldStatus} → pending  url=${m.oldUrl.substring(0, 60)}... → null`);
  }

  if (dryRun) {
    console.log('\n(dry-run・registry は変更していない。実適用には --apply)');
    return;
  }

  // 適用
  for (const m of mutations) {
    const en = entries[m.id];
    const img = en.images[m.imgIndex];
    img.originalImageUrl = img.imageUrl;
    img.imageUrl = null;
    img.generatedAt = null;
    img.regenerate = false;
    img.pendedReason = 'drive-orphaned';
    img.pendedAt = today;
    en.status = 'pending';
  }

  // meta 更新
  if (!registry._meta) registry._meta = {};
  registry._meta.lastModified = today;
  if (!Array.isArray(registry._meta.changes)) registry._meta.changes = [];
  registry._meta.changes.push(
    `v1.10 (${today}): ローカル環境移行後 Drive アクセス不可となった 29 件 (ex_L01_*, char_*, vocab_*/word_*) を pending 化。元 URL は originalImageUrl に退避。今後 skill pipeline で再生成予定。`
  );

  // atomic write
  const tmp = REGISTRY_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  await rename(tmp, REGISTRY_PATH);

  console.log(`\n✓ ${mutations.length} 件を pending 化しました。registry 更新済み。`);
}

main().catch(e => { console.error(e); process.exit(1); });
