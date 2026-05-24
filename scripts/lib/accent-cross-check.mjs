// scripts/lib/accent-cross-check.mjs
// Phase α3 後半：UniDic+naist-jdic から導出した accent_yomigana が NHK 標準アクセントと
// 一致するかを Gemini 2.5 Flash に確認させる。バッチで複数 entry を一度に送る純粋関数。
// CLI ループ・registry 更新は呼び出し側。
//
// 公開 API:
//   checkAccentBatch({ entries, apiKey, model? })
//     entries: [{ key, word, reading, accent_yomigana, accent_source }, ...]  (最大 ~30 程度)
//     → { results: [{ key, verdict, suggested_yomigana, confidence, note }, ...],
//         usage: { promptTokens, candidatesTokens, cachedTokens } }
//
// verdict の意味:
//   'ok'      = NHK 標準と一致
//   'wrong'   = 明確に違う（suggested_yomigana に正しい記法）
//   'unsure'  = 判定困難（同音異義語・複数許容形・proper noun 等）
//
// レビュー対象（flag 先 = vocab_catalog._meta.accent_review_queue）:
//   verdict === 'wrong'  または  (verdict === 'unsure' && confidence !== 'low')
//   ※ unsure+low は LLM が単に困っただけなので flag しない
//
// 「人間ネイティブが視聴で違和感を訴えた語」を override で上書きする仕組みは
// 別 track（accent_override 列）で実装する。LLM cross-check は flag が役目。

const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    results: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          key: { type: 'STRING', description: '入力 entry の key（vocab_catalog の key と一致）' },
          verdict: { type: 'STRING', enum: ['ok', 'wrong', 'unsure'] },
          suggested_yomigana: { type: 'STRING', description: 'verdict=wrong 時の正しい yomigana 記法（^...! 形式）。それ以外は空文字' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
          note: { type: 'STRING', description: '短い理由（同音異義語の意味確定・複数許容形の説明 等）。不要なら空文字' },
        },
        required: ['key', 'verdict', 'suggested_yomigana', 'confidence', 'note'],
      },
    },
  },
  required: ['results'],
};

function buildPrompt(entries) {
  const lines = entries.map((e, i) =>
    `[${i + 1}] key=${e.key} / 漢字=${e.word} / 読み=${e.reading} / 提案=${e.accent_yomigana}`
  );

  return [
    'あなたは NHK 日本語発音アクセント辞典 / 新明解日本語アクセント辞典に精通した日本語アクセント専門家です。',
    '以下の語彙について、提案された「Google Cloud TTS yomigana 記法」が NHK 標準アクセントと一致するかを判定してください。',
    '',
    '【yomigana 記法ルール】',
    '  ^ = ピッチ句の開始マーカー（先頭に必ず付く）',
    '  ! = ピッチが下がる **直前のモーラの後** に置く（アクセント核）',
    '  例：',
    '    平板型 (例: 端 はし 0 型) → ^はし',
    '    頭高型 (例: 箸 はし 1 型) → ^は!し',
    '    尾高型 (例: 橋 はし 2 型, 2モーラ語) → ^はし!',
    '    中高型 (例: お母さん おかあさん 2 型) → ^おか!あさん',
    '    平板型 (例: 学校 がっこう 0 型) → ^がっこう',
    '',
    '【判定基準】',
    '  ok      = NHK 標準アクセントと完全に一致',
    '  wrong   = 明確に違う（同音異義語の取り違え、アクセント核位置の誤り 等）',
    '            → suggested_yomigana に正しい記法を ^...! 形式で記入',
    '  unsure  = 判定困難（複数許容形がある、proper noun でアクセント不確定、',
    '            同音異義語で文脈なしには確定不能、辞書間で異なる 等）',
    '',
    '【confidence】',
    '  high    = NHK 辞典で確信を持って判定できた',
    '  medium  = ほぼ判定できるが完全な確信はない',
    '  low     = 自信なし（unsure verdict 時に多い）',
    '',
    '【注意】',
    '- 漢字を見て同音異義語を取り違えていないか確認（例：はし=端/箸/橋）。読みと一緒に意味を特定すること',
    '- 外来語・カタカナ語は NHK 標準が複数あることが多い → 提案が許容形なら ok',
    '- 複合語の連濁・アクセント結合規則も考慮（後部要素アクセント単独形と複合語形は異なる）',
    '- note は wrong / unsure のときだけ短く記入（ok は空文字でよい）',
    '',
    '【入力 (' + entries.length + ' 件)】',
    ...lines,
    '',
    '出力は results 配列に、入力と同じ順序・同じ key で ' + entries.length + ' 件返してください。',
  ].join('\n');
}

export async function checkAccentBatch({ entries, apiKey, model = DEFAULT_MODEL }) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('checkAccentBatch: entries must be a non-empty array');
  }
  if (!apiKey) {
    throw new Error('checkAccentBatch: apiKey is required (process.env.GEMINI_API_KEY)');
  }

  const url = `${ENDPOINT_BASE}/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      role: 'user',
      parts: [{ text: buildPrompt(entries) }],
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: Math.max(2048, 120 * entries.length),
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const bodyText = await res.text();
  if (res.status !== 200) {
    const err = new Error(`HTTP ${res.status}: ${bodyText.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const json = JSON.parse(bodyText);
  let rawText;
  try {
    rawText = json.candidates[0].content.parts[0].text.trim();
  } catch {
    throw new Error('レスポンス構造が不正: ' + bodyText.slice(0, 300));
  }
  rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`JSON parse 失敗: ${e.message}\nraw: ${rawText.slice(0, 400)}`);
  }

  const arr = Array.isArray(parsed.results) ? parsed.results : [];
  // entries と results の対応付けは key 一致で行う（順序ズレに耐える）
  const byKey = new Map();
  for (const r of arr) {
    if (!r || typeof r.key !== 'string') continue;
    const verdict = ['ok', 'wrong', 'unsure'].includes(r.verdict) ? r.verdict : 'unsure';
    const confidence = ['high', 'medium', 'low'].includes(r.confidence) ? r.confidence : 'low';
    byKey.set(r.key, {
      key: r.key,
      verdict,
      suggested_yomigana: typeof r.suggested_yomigana === 'string' ? r.suggested_yomigana.trim() : '',
      confidence,
      note: typeof r.note === 'string' ? r.note.trim() : '',
    });
  }
  // 入力順で揃え、欠損は unsure low として補完
  const results = entries.map(e => byKey.get(e.key) || {
    key: e.key, verdict: 'unsure', suggested_yomigana: '', confidence: 'low',
    note: 'LLM response missing for this entry',
  });

  return {
    results,
    usage: {
      promptTokens: json.usageMetadata?.promptTokenCount || 0,
      candidatesTokens: json.usageMetadata?.candidatesTokenCount || 0,
      cachedTokens: json.usageMetadata?.cachedContentTokenCount || 0,
    },
  };
}

// flag 判定（_meta.accent_review_queue に入れるか）
//   wrong       → 常に flag
//   unsure+high → flag（LLM が「判定困難だが自信あり」= 真に曖昧な語）
//   unsure+med  → flag
//   unsure+low  → flag しない（LLM が単に困っただけ・ノイズ多すぎる）
//   ok          → flag しない
export function shouldReview(result) {
  if (!result) return false;
  if (result.verdict === 'wrong') return true;
  if (result.verdict === 'unsure' && result.confidence !== 'low') return true;
  return false;
}
