#!/usr/bin/env node
// invariants.mjs — 高価値の不変条件チェック群。
// `scripts/validate.mjs` から import される（`npm run validate` で一括実行）。
// 単独でも `node scripts/invariants.mjs` で実行可能（同じ結果を返す）。
//
// 含まれる検査:
//   A. GAS monolith のヘッダー版 vs 各セクション版のドリフト検出（情報のみ・エラーにしない）
//   B. canonical プロンプトガイドが v3.2 であることを SHA256 でアサート
//   C. S列プロンプト JSON の 6 不変条件（人物 full-body / 物体 ~50mm /
//      抽象 flat-solid-only / 背景文字列一致 / NOT 表記一致 / 国旗強表現）
//   D. data/audio/*.mp3 の QC スペック（codec/sample_rate/channels/bit_rate/
//      duration/LUFS/TP）— scripts/validate-audio.mjs に委譲
//
// 終了コード（単独実行時）: errors が 1 件以上で 1、それ以外 0。
// （validate.mjs から呼ばれた場合は errors / warns / infos を返すだけ）

import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// 正典パスと期待 hash（実ファイル由来・docs/REFERENCE.md §9）
// hash は LF 正規化（CRLF→LF・末尾改行 strip）後に計算する。
// apply_v3_3.py は Windows で CRLF を出すため raw 比較は偽陽性になる。
const CANONICAL = {
  gas: resolve(ROOT, 'gas/pipeline.gs'),
  promptGuide: resolve(ROOT, 'prompts/master_prompt_design_guide_v3_10.py'),
  promptGuideExpectedHashPrefix: '051af0bc7b64', // v3.10 LF 正規化後 SHA256 先頭 12 桁
  // S列プロンプト JSON の置き場（v3.3 で再生成後はここに置く想定）
  sColumnDir: resolve(ROOT, 'data'),
  sColumnPattern: /^image_prompts_lesson\d{2}_v3_\d+\.json$/,
};

// 6 不変条件の文字列定数
// v3.3 (M-5): C4/C5 は vocab_type 別の背景文字列分岐に対応
//   default（人物 / 物体 / 抽象等）→ off-white
//   building（テンプレ B）       → pale sky-blue full-bleed
const BACKGROUND_BY_TYPE = {
  default:  'soft cream off-white background (warm off-white, NOT pure stark white)',
  building: 'pale sky-blue background fills the entire frame edge to edge (full-bleed); no border, no vignette',
};
const BACKGROUND_EXACT = BACKGROUND_BY_TYPE.default; // 後方互換（既存参照用）
const NOT_TOKEN = 'NOT pure stark white'; // 大文字 NOT が確定。小文字 'not' に揺れていないか
const FORBIDDEN_PERSON_AREA = /fills\s+\d+\s*[-–]?\s*\d*\s*%\s+of\s+the\s+image\s+area/i;
const FORBIDDEN_PORTRAIT_LENS = /85\s*mm\s+portrait\s+lens/i;
const FORBIDDEN_GRADIENT = /\bgradient(s|ed|ing)?\b/i;
const REQUIRED_FULLBODY = /(full[-\s]?body|head[-\s]?to[-\s]?toe)/i;
const REQUIRED_50MM = /~?\s*50\s*mm/i;
const REQUIRED_FLAT_SOLID = /flat[-\s]?solid[-\s]?only/i;
const FLAG_STRONG_TOKEN = /\b(must|never)\b/i;

async function sha256Prefix(path, n = 12) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex').slice(0, n);
}

// 改行を LF に統一し末尾改行を除去してから SHA256（CRLF/LF 差を吸収）
async function sha256PrefixNormalized(path, n = 12) {
  const buf = await readFile(path);
  // Buffer 上で CRLF→LF・CR(単独)→LF 置換し、末尾の \n を strip
  const lf = Buffer.from(
    buf.toString('binary').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, ''),
    'binary'
  );
  return createHash('sha256').update(lf).digest('hex').slice(0, n);
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

// A. GAS ヘッダー版 vs セクション版ドリフト（情報のみ）
async function checkGasVersionDrift() {
  const infos = [];
  const errors = [];
  if (!(await exists(CANONICAL.gas))) {
    errors.push(`invariants[A]: 正典 GAS が不在: ${CANONICAL.gas}`);
    return { errors, warns: [], infos };
  }
  const src = await readFile(CANONICAL.gas, 'utf-8');

  // ヘッダー版（先頭 30 行を見る）
  const headerArea = src.split('\n').slice(0, 30).join('\n');
  const headerMatch = /最終更新:\s*\S+\s+\(v([\d.]+)\)/.exec(headerArea);
  const headerVersion = headerMatch ? `v${headerMatch[1]}` : '(unmarked)';

  // セクション版（`// xxx.gs vN.N` または `* xxx.gs vN.N` 形式・名前に数字を含む可能性あり）
  const sectionRe = /(?:\/\/|\*)\s+([A-Za-z][A-Za-z0-9_]*\.gs)\s+v([\d.]+)/g;
  const sections = {};
  let m;
  while ((m = sectionRe.exec(src)) !== null) {
    if (!sections[m[1]]) sections[m[1]] = `v${m[2]}`; // 先に出てきた版を採用
  }

  infos.push(`invariants[A] GAS ヘッダー版: ${headerVersion}`);
  for (const [name, v] of Object.entries(sections)) {
    infos.push(`  - ${name}: ${v}`);
  }
  // ドリフトはエラーにしない（仕様・docs/REFERENCE.md §1-1）
  return { errors, warns: [], infos };
}

// B. canonical プロンプトガイド hash アサート（LF 正規化後に比較）
async function checkPromptGuideHash() {
  const errors = [];
  const infos = [];
  if (!(await exists(CANONICAL.promptGuide))) {
    errors.push(`invariants[B]: canonical プロンプトガイドが不在: ${CANONICAL.promptGuide}`);
    return { errors, warns: [], infos };
  }
  const actual = await sha256PrefixNormalized(CANONICAL.promptGuide);
  const expected = CANONICAL.promptGuideExpectedHashPrefix;
  if (actual !== expected) {
    errors.push(
      `invariants[B]: canonical プロンプトガイド hash 不一致（LF 正規化後）。`
      + ` expected=${expected} / actual=${actual}`
      + ` (${CANONICAL.promptGuide})`
    );
  } else {
    infos.push(`invariants[B] プロンプトガイド hash OK（LF 正規化後）: ${actual}`);
  }
  return { errors, warns: [], infos };
}

// C. S列プロンプト JSON の 6 不変条件
async function checkSColumnInvariants() {
  const errors = [];
  const warns = [];
  const infos = [];
  // canonical 置き場で v3 系の S列 JSON を探す
  const { readdir } = await import('node:fs/promises');
  let entries;
  try {
    entries = await readdir(CANONICAL.sColumnDir);
  } catch {
    infos.push(`invariants[C]: S列ディレクトリ不在: ${CANONICAL.sColumnDir}`);
    return { errors, warns, infos };
  }
  const candidates = entries.filter((n) => CANONICAL.sColumnPattern.test(n));
  if (candidates.length === 0) {
    infos.push(
      `invariants[C]: canonical S列 JSON 未配置（${CANONICAL.sColumnPattern} を ${CANONICAL.sColumnDir} で探した）。`
      + ` v3.2 SMOKE 後に S列を data/image_prompts_lessonNN_v3_N.json として置けば検査が走る。`
    );
    return { errors, warns, infos };
  }

  for (const name of candidates) {
    const path = resolve(CANONICAL.sColumnDir, name);
    let doc;
    try {
      doc = JSON.parse(await readFile(path, 'utf-8'));
    } catch (e) {
      errors.push(`invariants[C] ${name}: JSON parse 失敗: ${e.message}`);
      continue;
    }
    const items = Array.isArray(doc.vocabulary) ? doc.vocabulary : [];
    if (items.length === 0) {
      warns.push(`invariants[C] ${name}: vocabulary[] が空または無い`);
      continue;
    }
    for (const item of items) {
      const tag = `${name}:${item.imageId ?? item.word ?? '?'}`;
      const prompt = String(item.prompt ?? '');
      if (!prompt) {
        errors.push(`invariants[C] ${tag}: prompt 空`);
        continue;
      }
      const type = item.vocab_type ?? item.vocabType ?? '';
      const expectedBg = type === 'building' ? BACKGROUND_BY_TYPE.building : BACKGROUND_BY_TYPE.default;

      // 4. 背景文字列の一字一句一致（vocab_type 別・v3.3 M-5）
      if (!prompt.includes(expectedBg)) {
        errors.push(
          `invariants[C4] ${tag}: 背景文字列の一字一句一致違反（type=${type || 'default'}）。`
          + ` 必須: "${expectedBg}"`
        );
      }
      // 5. NOT 表記の一字一句一致（building は確定色のためトークン揺れ防止不要）
      if (type !== 'building' && !prompt.includes(NOT_TOKEN)) {
        errors.push(
          `invariants[C5] ${tag}: NOT 表記の一字一句一致違反。`
          + ` 必須: "${NOT_TOKEN}"（小文字 not への揺れ禁止）`
        );
      }

      // タイプ別チェック
      if (type === 'person') {
        // 1. full-body / 面積指定禁止
        if (!REQUIRED_FULLBODY.test(prompt)) {
          errors.push(`invariants[C1] ${tag}: person プロンプトに "full-body" / "head-to-toe" が無い`);
        }
        if (FORBIDDEN_PERSON_AREA.test(prompt)) {
          errors.push(
            `invariants[C1] ${tag}: person プロンプトに面積指定（"fills NN% of..."）が残存`
          );
        }
        if (FORBIDDEN_PORTRAIT_LENS.test(prompt)) {
          errors.push(`invariants[C1] ${tag}: person プロンプトに "85mm portrait lens" が残存`);
        }
      } else if (type === 'concrete_object' || type === 'object') {
        // 2. ~50mm / 85mm portrait 禁止
        if (FORBIDDEN_PORTRAIT_LENS.test(prompt)) {
          errors.push(`invariants[C2] ${tag}: object プロンプトに "85mm portrait lens" が残存`);
        }
        if (!REQUIRED_50MM.test(prompt)) {
          warns.push(`invariants[C2] ${tag}: object プロンプトに "~50mm" が見当たらない`);
        }
      } else if (type === 'abstract_concept') {
        // 3. flat-solid-only / gradient 禁止
        if (FORBIDDEN_GRADIENT.test(prompt)) {
          errors.push(`invariants[C3] ${tag}: abstract プロンプトに "gradient" が残存`);
        }
        if (!REQUIRED_FLAT_SOLID.test(prompt)) {
          warns.push(`invariants[C3] ${tag}: abstract プロンプトに "flat-solid-only" が見当たらない`);
        }
      }

      // 6. 国旗例外規則の強表現（CONSTRAINTS に nationality / flag を含む場合のみ）
      if (/flag|国旗|nationality/i.test(prompt)) {
        if (!FLAG_STRONG_TOKEN.test(prompt)) {
          warns.push(
            `invariants[C6] ${tag}: 国旗関連プロンプトに強表現（must/never）が見当たらない`
          );
        }
      }
    }
    infos.push(`invariants[C] ${name}: vocabulary 件数 ${items.length}`);
  }
  return { errors, warns, infos };
}

// D. data/audio/*.mp3 の QC スペック検証（scripts/validate-audio.mjs に委譲）
async function checkAudioQc() {
  try {
    const mod = await import('./validate-audio.mjs');
    return await mod.runAudioValidation();
  } catch (e) {
    return {
      errors: [`invariants[D] 音声 QC 検証失敗: ${e.message}`],
      warns: [],
      infos: [],
    };
  }
}

export async function runAll() {
  const out = { errors: [], warns: [], infos: [] };
  for (const fn of [checkGasVersionDrift, checkPromptGuideHash, checkSColumnInvariants, checkAudioQc]) {
    const r = await fn();
    out.errors.push(...r.errors);
    out.warns.push(...r.warns);
    out.infos.push(...r.infos);
  }
  return out;
}

// 単独実行時のみ stdout 出力（validate.mjs から import された場合は走らせない）
import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const r = await runAll();
  const lines = ['# invariants.mjs'];
  lines.push(`ERROR: ${r.errors.length}`);
  for (const e of r.errors) lines.push(`  - ${e}`);
  lines.push(`WARN:  ${r.warns.length}`);
  for (const w of r.warns) lines.push(`  - ${w}`);
  lines.push(`INFO:  ${r.infos.length}`);
  for (const i of r.infos) lines.push(`  - ${i}`);
  process.stdout.write(lines.join('\n') + '\n');
  process.exit(r.errors.length > 0 ? 1 : 0);
}
