#!/usr/bin/env node
// scripts/lib/export-skill-prompts.mjs
//
// data/image_prompts_skill.json から手動投入用のクリーン .txt を書き出す。
// 画像生成 UI (nanobanana / Imagen / Gemini chat) にコピペする想定。
//
// 使い方:
//   node scripts/lib/export-skill-prompts.mjs                     # 全件
//   node scripts/lib/export-skill-prompts.mjs --ids ex_L02_001,word_医者
//   node scripts/lib/export-skill-prompts.mjs --lesson 02         # ex_L02_*
//   node scripts/lib/export-skill-prompts.mjs --out custom/dir    # 出力先変更
//   node scripts/lib/export-skill-prompts.mjs --force             # 既存上書き
//
// 出力 1 ファイル/entry:
//   tmp/skill_prompts/{imageId}.txt
//
// 形式（ヘッダー 3 行 + 空行 + prompt 本文）:
//   # imageId: ex_L02_001
//   # word: これは時計です。 (This is a clock.)
//   # aspect_ratio: 16:9
//
//   [PURPOSE]
//   ...
//
// このスクリプトは read-only on JSON (re-export 何度走らせても idempotent)。

import fs from "node:fs";
import path from "node:path";

const SKILL_JSON = "data/image_prompts_skill.json";
const DEFAULT_OUT = "tmp/skill_prompts";

function parseArgs(argv) {
  const args = { ids: null, lesson: null, out: DEFAULT_OUT, force: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--force") args.force = true;
    else if (a === "--ids") args.ids = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--ids=")) args.ids = a.slice(6).split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--lesson") args.lesson = String(argv[++i]).padStart(2, "0");
    else if (a.startsWith("--lesson=")) args.lesson = String(a.slice(9)).padStart(2, "0");
    else if (a === "--out") args.out = argv[++i];
    else if (a.startsWith("--out=")) args.out = a.slice(6);
    else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function printHelp() {
  console.log(`export-skill-prompts.mjs — JSON → tmp/skill_prompts/*.txt

USAGE:
  node scripts/lib/export-skill-prompts.mjs [options]

OPTIONS:
  --ids <csv>       特定 imageId のみ展開 (例: ex_L02_001,word_医者)
  --lesson <NN>     特定の課のみ展開 (ex_L<NN>_* のみ)
  --out <dir>       出力ディレクトリ (既定: tmp/skill_prompts)
  --force           既存 .txt があれば上書き
  --help, -h        この help を表示

OUTPUT (1 file per entry):
  tmp/skill_prompts/{imageId}.txt
  ヘッダー 3 行 + 空行 + prompt 本文。画像生成 UI へ「prompt 本文」セクションを copy-paste、
  aspect ratio はヘッダーを見て UI 側で設定する。
`);
}

function selectEntries(allEntries, args) {
  if (args.ids) {
    const idSet = new Set(args.ids);
    return allEntries.filter((e) => idSet.has(e.imageId));
  }
  if (args.lesson) {
    const prefix = `ex_L${args.lesson}_`;
    return allEntries.filter((e) => e.imageId.startsWith(prefix));
  }
  return [...allEntries];
}

function buildTxt(entry) {
  return [
    `# imageId: ${entry.imageId}`,
    `# word: ${entry.word}${entry.en ? ` (${entry.en})` : ""}`,
    `# aspect_ratio: ${entry.aspect_ratio}`,
    "",
    entry.prompt.replace(/^\n+/, "").trimEnd() + "\n",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(SKILL_JSON)) {
    console.error(`ERROR: ${SKILL_JSON} not found. Run /generate-image-prompt first.`);
    process.exit(1);
  }

  const doc = JSON.parse(fs.readFileSync(SKILL_JSON, "utf8"));
  const all = doc.vocabulary || [];
  const selected = selectEntries(all, args);

  if (selected.length === 0) {
    console.error("no entries matched the filter.");
    if (args.ids) console.error(`  --ids filter: ${args.ids.join(",")}`);
    if (args.lesson) console.error(`  --lesson filter: ${args.lesson} (prefix ex_L${args.lesson}_)`);
    console.error(`  available imageIds in ${SKILL_JSON}: ${all.map((e) => e.imageId).join(", ") || "(empty)"}`);
    process.exit(1);
  }

  fs.mkdirSync(args.out, { recursive: true });

  let written = 0;
  let skipped = 0;
  for (const e of selected) {
    const file = path.join(args.out, `${e.imageId}.txt`);
    if (!args.force && fs.existsSync(file)) {
      skipped++;
      continue;
    }
    fs.writeFileSync(file, buildTxt(e));
    written++;
  }

  console.log(`exported: ${written} file(s) → ${args.out}/`);
  if (skipped > 0) console.log(`skipped:  ${skipped} (already exists; use --force to overwrite)`);
  for (const e of selected) {
    console.log(`  ${path.join(args.out, e.imageId + ".txt")}  [${e.aspect_ratio}]  ${e.word}`);
  }
}

main();
