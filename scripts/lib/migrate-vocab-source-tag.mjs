#!/usr/bin/env node
// scripts/lib/migrate-vocab-source-tag.mjs
//
// One-shot migration: lesson_NN.json の全 vocab word に `_sourceTag` を後付けする。
// Phase 1 of Goi_List skill 統合 (2026-05-28)。
//
// 既存 lesson は handcrafted で出どころが暗黙だったため、initial assignment は heuristic:
//   - lesson_01 全 vocab        → "pdf_introduction"
//   - lesson_02 p5_p6_thing     → "goi_list_n5_supplement" (X-f commit log で明記)
//   - lesson_02 その他          → "pdf_introduction"
//
// user は後で個別に書き換えてよい (e.g. PDF 再照合で teacher_addition に降格)。
//
// 使い方:
//   node scripts/lib/migrate-vocab-source-tag.mjs                # dry-run, lesson_01/02 両方
//   node scripts/lib/migrate-vocab-source-tag.mjs --apply        # 書き戻し
//   node scripts/lib/migrate-vocab-source-tag.mjs --no 02 --apply

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const noArg = (() => {
  const i = args.indexOf("--no");
  return i >= 0 ? args[i + 1] : null;
})();

const TARGETS = noArg ? [noArg.padStart(2, "0")] : ["01", "02"];

// lesson_02 X-f で追加された Goi_List N5 由来 10 件
const LESSON_02_GOI_GROUP = "p5_p6_thing";

function decideSourceTag(lessonNo, groupKey, word) {
  if (lessonNo === "02" && groupKey === LESSON_02_GOI_GROUP) {
    return "goi_list_n5_supplement";
  }
  return "pdf_introduction";
}

async function migrateOne(lessonNo) {
  const path = resolve(ROOT, `data/lesson_${lessonNo}.json`);
  const raw = await readFile(path, "utf-8");
  const doc = JSON.parse(raw);
  const groups = doc?.vocabulary?.byPattern ?? {};

  const changes = [];
  let skipped = 0;

  for (const [groupKey, group] of Object.entries(groups)) {
    if (!Array.isArray(group?.words)) continue;
    for (const w of group.words) {
      if (w._sourceTag) {
        skipped++;
        continue;
      }
      const tag = decideSourceTag(lessonNo, groupKey, w);
      changes.push({ groupKey, word: w.word, reading: w.reading, tag });
      w._sourceTag = tag;
    }
  }

  return { path, doc, changes, skipped };
}

async function main() {
  for (const no of TARGETS) {
    let result;
    try {
      result = await migrateOne(no);
    } catch (e) {
      console.error(`[lesson_${no}] error: ${e.message}`);
      process.exit(1);
    }
    const { path, doc, changes, skipped } = result;
    console.log(`\n=== lesson_${no}.json ===`);
    console.log(`target: ${path}`);
    console.log(`mode:   ${apply ? "apply (writes file)" : "dry-run"}`);
    console.log(`changes: ${changes.length}`);
    const byTag = {};
    for (const c of changes) byTag[c.tag] = (byTag[c.tag] || 0) + 1;
    for (const [tag, n] of Object.entries(byTag)) {
      console.log(`  ${tag}: ${n}`);
    }
    if (changes.length > 0 && !apply) {
      console.log("  (first 20)");
      for (const c of changes.slice(0, 20)) {
        console.log(`    [${c.groupKey}] ${c.word}(${c.reading}) → ${c.tag}`);
      }
    }
    console.log(`skipped (already set): ${skipped}`);

    if (apply && changes.length > 0) {
      await writeFile(path, JSON.stringify(doc, null, 2) + "\n", "utf-8");
      console.log(`  ✅ wrote ${path}`);
    }
  }
}

await main();
