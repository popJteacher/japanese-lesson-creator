#!/usr/bin/env node
// scripts/lib/lesson-suggest-activities.mjs
//
// /lesson-suggest-activities NN の本体。data/lesson_NN.json の
// flow[].type ∈ {intro_activity, main_activity} の各 step に対し、
// data/intro_activity_catalog.json / data/activity_catalog.json から
// activityId 候補を絞り込み、スコア付きで提示する (read-only)。
//
// 既に activityId がセットされている step も対象 (★ 印で確認用に出す)。
//
// 使い方:
//   node scripts/lib/lesson-suggest-activities.mjs --no NN [--type intro|main|all] [--top N] [--json]
//
// 終了コード: 常に 0 (read-only)。lesson が無い等は 2。

import fs from "node:fs";

const DEFAULT_TOP = 5;

function parseArgs(argv) {
  const args = { no: null, type: "all", top: DEFAULT_TOP, asJson: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--no") args.no = parseInt(argv[++i], 10);
    else if (a.startsWith("--no=")) args.no = parseInt(a.slice(5), 10);
    else if (a === "--type") args.type = argv[++i];
    else if (a.startsWith("--type=")) args.type = a.slice(7);
    else if (a === "--top") args.top = parseInt(argv[++i], 10);
    else if (a.startsWith("--top=")) args.top = parseInt(a.slice(6), 10);
    else if (a === "--json") args.asJson = true;
    else { console.error(`unknown arg: ${a}`); process.exit(2); }
  }
  return args;
}

function printHelp() {
  console.log(`/lesson-suggest-activities helper

  --no NN          対象課 (1-99)。必須。
  --type T         intro / main / all (既定: all)
  --top N          各 step の候補表示件数 (既定: 5)
  --json           JSON 出力
  --help           このヘルプ
`);
}

function zeroPad(n) { return String(n).padStart(2, "0"); }
function loadJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

// ---- scoring ----

// intro_activity: pattern の grammarConcept と catalog の applicablePatternScope /
// prerequisitePatterns との一致を見る。reusableInLessons === 'all' は弱マッチ。
function scoreIntroCandidate(act, ctx) {
  let score = 0;
  const reasons = [];

  // grammarConcept exact match w/ applicablePatternScope
  if (ctx.grammarConcept && act.applicablePatternScope) {
    if (act.applicablePatternScope === ctx.grammarConcept) {
      score += 50;
      reasons.push(`applicablePatternScope=${act.applicablePatternScope} がパターン grammarConcept と一致`);
    } else if (act.applicablePatternScope.includes(ctx.grammarConcept) || ctx.grammarConcept.includes(act.applicablePatternScope)) {
      score += 20;
      reasons.push(`applicablePatternScope=${act.applicablePatternScope} とパターン grammarConcept=${ctx.grammarConcept} が部分マッチ`);
    }
  }

  // prerequisitePatterns: 過去課 + 当課パターンの grammarConcept で satisfy できるか
  if (Array.isArray(act.prerequisitePatterns) && act.prerequisitePatterns.length > 0) {
    const known = new Set(ctx.knownGrammarConcepts);
    const missing = act.prerequisitePatterns.filter((p) => !known.has(p));
    if (missing.length === 0) {
      score += 20;
      reasons.push(`prerequisitePatterns 全て satisfied`);
    } else {
      score -= 10 * missing.length;
      reasons.push(`prerequisitePatterns 未充足: ${missing.join(", ")}`);
    }
  }

  // reusableInLessons
  if (act.reusableInLessons === "all" || (Array.isArray(act.reusableInLessons) && act.reusableInLessons.includes(ctx.lessonNo))) {
    score += 5;
  } else if (typeof act.reusableInLessons === "string" && act.reusableInLessons.startsWith("all_")) {
    // 'all_kosoado_courses' 等は scope hint なので参考程度
    score += 2;
    reasons.push(`reusableInLessons=${act.reusableInLessons} (制限あり scope hint)`);
  }

  // 既設定 activityId と一致したら ★
  if (act.id === ctx.currentActivityId) {
    score += 100;
    reasons.unshift(`★ 現在セット済み (activityId=${act.id})`);
  }

  return { score, reasons };
}

// main_activity: catalog の level[] / applicableLessons / prerequisitePatterns / stage[] でフィルタ
function scoreMainCandidate(act, ctx) {
  let score = 0;
  const reasons = [];

  // level
  if (Array.isArray(act.level) && ctx.targetJlpt && act.level.includes(ctx.targetJlpt)) {
    score += 30;
    reasons.push(`level[] に ${ctx.targetJlpt} を含む`);
  } else if (Array.isArray(act.level) && ctx.targetJlpt) {
    score -= 100; // level ミスマッチは事実上除外
    reasons.push(`level[] に ${ctx.targetJlpt} 不在 (${act.level.join("|")})`);
  }

  // applicableLessons
  if (act.applicableLessons === "all") {
    score += 10;
  } else if (Array.isArray(act.applicableLessons) && act.applicableLessons.includes(ctx.lessonNo)) {
    score += 30;
    reasons.push(`applicableLessons[] に L${ctx.lessonNo} 明示`);
  } else if (Array.isArray(act.applicableLessons)) {
    score -= 100;
    reasons.push(`applicableLessons[] に L${ctx.lessonNo} 不在`);
  }

  // stage (fading)
  if (ctx.fadingStage && Array.isArray(act.stage)) {
    const stages = ctx.fadingStage.split(/[、〜~,\s/]+/).map((s) => s.trim()).filter(Boolean);
    if (stages.some((s) => act.stage.includes(s))) {
      score += 20;
      reasons.push(`stage[] と fadingStage=${ctx.fadingStage} が一致`);
    }
  }

  // prerequisitePatterns
  if (Array.isArray(act.prerequisitePatterns) && act.prerequisitePatterns.length > 0) {
    const known = new Set(ctx.knownGrammarConcepts);
    const satisfied = act.prerequisitePatterns.filter((p) => known.has(p));
    if (satisfied.length === act.prerequisitePatterns.length) {
      score += 15;
      reasons.push(`prerequisitePatterns 全て satisfied`);
    } else if (satisfied.length > 0) {
      score += 5 * satisfied.length;
      reasons.push(`prerequisitePatterns 部分 satisfied (${satisfied.length}/${act.prerequisitePatterns.length})`);
    } else {
      score -= 30;
      reasons.push(`prerequisitePatterns 未充足: ${act.prerequisitePatterns.join(", ")}`);
    }
  }

  // validatedForLessons / textbookOrigins ヒント
  if (Array.isArray(act.validatedForLessons) && act.validatedForLessons.includes(ctx.lessonNo)) {
    score += 25;
    reasons.push(`validatedForLessons に L${ctx.lessonNo} (運用実績あり)`);
  }
  if (Array.isArray(act.textbookOrigins)) {
    const hit = act.textbookOrigins.find((o) => o.lesson === ctx.lessonNo);
    if (hit) {
      score += 25;
      reasons.push(`textbookOrigins に L${ctx.lessonNo} (教科書由来)`);
    }
  }

  // 既設定 activityId と一致したら ★
  if (act.id === ctx.currentActivityId) {
    score += 100;
    reasons.unshift(`★ 現在セット済み (activityId=${act.id})`);
  }

  return { score, reasons };
}

// ---- main runner ----

function buildKnownGrammarConcepts(doc, currentPatternId) {
  // 当課の patterns[].grammarConcept のうち、currentPatternId 以下の id (p1, p2, ...) を「既知」とみなす
  // (intro/main は当該 step より前のパターンを既習として扱う)
  const concepts = [];
  for (const p of doc.patterns || []) {
    if (typeof p.grammarConcept === "string" && p.grammarConcept) concepts.push(p.grammarConcept);
  }
  // 過去課由来の grammarConcept も含めるべきだが、簡易実装として lesson_<前NN>.json を走査
  return concepts;
}

function buildPastGrammarConcepts(targetNo) {
  const out = [];
  const dataDir = "data";
  const re = /^lesson_(\d{2})\.json$/;
  const files = fs.readdirSync(dataDir)
    .map((n) => n.match(re))
    .filter((m) => m !== null)
    .map((m) => ({ no: parseInt(m[1], 10), file: m[0] }))
    .filter((x) => x.no < targetNo)
    .sort((a, b) => a.no - b.no);
  for (const { file } of files) {
    const doc = loadJson(`${dataDir}/${file}`);
    for (const p of doc.patterns || []) {
      if (typeof p.grammarConcept === "string" && p.grammarConcept) out.push(p.grammarConcept);
    }
  }
  return out;
}

function pickJlpt(doc, patternRef) {
  // target JLPT: lesson.targetStudentLevel > pattern.jlptLevel > "N5"
  if (doc.lesson && doc.lesson.targetStudentLevel) return doc.lesson.targetStudentLevel;
  if (patternRef && Array.isArray(doc.patterns)) {
    const p = doc.patterns.find((x) => x.id === patternRef);
    if (p && p.jlptLevel) return p.jlptLevel;
  }
  return "N5";
}

function buildCtx(doc, step, knownPast) {
  const lessonNo = doc.lesson && doc.lesson.no;
  const targetJlpt = pickJlpt(doc, step.patternRef);
  let grammarConcept = null;
  if (step.patternRef && Array.isArray(doc.patterns)) {
    const p = doc.patterns.find((x) => x.id === step.patternRef);
    if (p && p.grammarConcept) grammarConcept = p.grammarConcept;
  }
  const currentConcepts = (doc.patterns || []).map((p) => p.grammarConcept).filter(Boolean);
  return {
    lessonNo,
    targetJlpt,
    grammarConcept,
    knownGrammarConcepts: [...knownPast, ...currentConcepts],
    fadingStage: step.ABCactivityRef && step.ABCactivityRef.fadingStage,
    currentActivityId: step.activityId || null,
  };
}

function suggestForStep(step, doc, catalogs, knownPast, top) {
  const ctx = buildCtx(doc, step, knownPast);
  const isIntro = step.type === "intro_activity";
  const pool = isIntro ? catalogs.intro : catalogs.main;
  const scorer = isIntro ? scoreIntroCandidate : scoreMainCandidate;

  const scored = pool.map((act) => {
    const { score, reasons } = scorer(act, ctx);
    return { id: act.id, name: act.name, score, reasons, raw: act };
  })
    .filter((x) => x.score > -50) // 明らかな除外は捨てる
    .sort((a, b) => b.score - a.score)
    .slice(0, top);

  return { step, ctx, candidates: scored };
}

function formatText(lessonPath, results, lessonNo) {
  const out = [];
  out.push(`lesson: ${lessonPath} (L${lessonNo})`);
  out.push(``);
  for (const { step, ctx, candidates } of results) {
    out.push(`▼ flow[${step.id}] (type=${step.type}, patternRef=${step.patternRef || "-"})`);
    out.push(`  context: targetJlpt=${ctx.targetJlpt}, grammarConcept=${ctx.grammarConcept || "-"}, fadingStage=${ctx.fadingStage || "-"}`);
    out.push(`  current: activityId=${ctx.currentActivityId || "(unset)"}`);
    if (candidates.length === 0) {
      out.push(`  候補なし (catalog の filter で全 score < -50)`);
    } else {
      out.push(`  候補 top ${candidates.length}:`);
      for (const c of candidates) {
        const mark = c.id === ctx.currentActivityId ? "★" : "  ";
        out.push(`    ${mark} score=${String(c.score).padStart(4)} ${c.id}  「${c.name}」`);
        for (const r of c.reasons) out.push(`             - ${r}`);
      }
    }
    out.push(``);
  }
  return out.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }
  if (args.no === null || Number.isNaN(args.no) || args.no < 1 || args.no > 99) {
    console.error("--no NN (1-99) は必須"); printHelp(); process.exit(2);
  }
  const lessonPath = `data/lesson_${zeroPad(args.no)}.json`;
  if (!fs.existsSync(lessonPath)) { console.error(`lesson file not found: ${lessonPath}`); process.exit(2); }
  const introPath = "data/intro_activity_catalog.json";
  const mainPath = "data/activity_catalog.json";
  if (!fs.existsSync(introPath)) { console.error(`intro_activity_catalog not found: ${introPath}`); process.exit(2); }
  if (!fs.existsSync(mainPath)) { console.error(`activity_catalog not found: ${mainPath}`); process.exit(2); }

  const doc = loadJson(lessonPath);
  const catalogs = {
    intro: loadJson(introPath).activities || [],
    main: loadJson(mainPath).activities || [],
  };
  const knownPast = buildPastGrammarConcepts(args.no);

  const flow = Array.isArray(doc.flow) ? doc.flow : [];
  const targets = flow.filter((s) => {
    if (args.type === "intro" && s.type !== "intro_activity") return false;
    if (args.type === "main" && s.type !== "main_activity") return false;
    return s.type === "intro_activity" || s.type === "main_activity";
  });

  const results = targets.map((step) => suggestForStep(step, doc, catalogs, knownPast, args.top));

  if (args.asJson) {
    process.stdout.write(JSON.stringify({
      file: lessonPath,
      lessonNo: args.no,
      type: args.type,
      results: results.map((r) => ({
        stepId: r.step.id,
        stepType: r.step.type,
        patternRef: r.step.patternRef || null,
        ctx: r.ctx,
        candidates: r.candidates.map((c) => ({ id: c.id, name: c.name, score: c.score, reasons: c.reasons })),
      })),
    }, null, 2) + "\n");
  } else {
    process.stdout.write(formatText(lessonPath, results, args.no) + "\n");
  }
  process.exit(0);
}

main();
