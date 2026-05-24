// scripts/lib/audio-naturalness-qc.mjs
// Phase α1：音声「自然さ」QC（発音・アクセント・プロソディ）。
// Gemini 2.5 Flash multimodal で audio + 元テキストを送り、自然さ score と
// 問題点 comments を取得する純粋関数。registry 更新や CLI ループは呼び出し側。
//
// 既存 invariants[D] = validate-audio.mjs::AUDIO_SPEC は LUFS / TP / sample
// rate 等の **技術スペック**だけを検証する。本ファイルは「合成音声が日本語
// として自然に聞こえるか」という意味論的 QC を補助的に追加する。
//
// 設計方針（PHASE_BACKLOG.md §音声自然さチェック・user 確定 2026-05-21）:
//   - Gemini 2.5 Flash audio multimodal（オプション(2)）
//   - score / confidence / comments を返し、registry に WARN 相当として記録
//   - HARD ERROR にはしない（人間レビューを置き換えない・補助のみ）
//   - $0.5 / 500 ファイル想定（promptTokens は audio 32 tokens/sec + 短文 text）
//
// 公開 API:
//   checkNaturalness({ audioBuffer, mimeType, text, word?, apiKey, model? })
//     → { score: 1-5, confidence: 'high'|'medium'|'low', comments: string[],
//         usage: { promptTokens, candidatesTokens } }
//
// score の意味:
//   5 = 完全に自然（学習者に提示して問題なし）
//   4 = 軽微な癖（教員裁量で許容）
//   3 = 注意点あり（人間レビュー要・WARN しきい）
//   2 = 明らかな問題（学習者を誤らせる懸念）
//   1 = 致命的（語彙が不明・誤読・読み飛ばし等）
//
// WARN しきい: score <= 3 または confidence === 'low'

const ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

// Gemini responseSchema は INTEGER に enum を許さないため、score は範囲制約
// なしで受け取り、parser 側で 1-5 にクランプする。
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER', description: '1 (致命的) 〜 5 (完全に自然) の整数' },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    comments: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '具体的な問題点（読み誤り・アクセント位置のずれ・不自然な間 など）。なければ空配列。',
    },
  },
  required: ['score', 'confidence', 'comments'],
};

function buildPrompt(text, word) {
  const wordLine = word ? `\n- 対象語彙（特に注目）: ${word}` : '';
  return [
    'あなたは日本語ネイティブの発音指導者です。次の音声が「初級学習者に提示してよい品質か」を評価してください。',
    '',
    '【評価対象テキスト（音声がこれを読み上げているはず）】',
    text,
    wordLine,
    '',
    '【評価軸】',
    '1. 読み: テキスト通りに発音されているか（誤読・読み飛ばし・追加・置換が無いか）',
    '2. アクセント: 標準語アクセント（NHK 型）として自然か',
    '3. プロソディ: イントネーション・間（ま）・速度が自然か',
    '4. 音質: 雑音・途切れ・無音長すぎ 等の異常が無いか',
    '',
    '【スコア基準】',
    '5 = 完全に自然（学習者に提示して問題なし）',
    '4 = 軽微な癖（教員裁量で許容）',
    '3 = 注意点あり（人間レビュー要）',
    '2 = 明らかな問題（学習者を誤らせる懸念）',
    '1 = 致命的（語彙不明・誤読・読み飛ばし）',
    '',
    '【confidence 基準】',
    'high   = 明確に判定できた',
    'medium = 微妙だがおおむね判定できた',
    'low    = 判定困難（音声が短すぎる・録音が不明瞭 等）',
    '',
    'comments には**具体的な問題点だけ**を 1-3 件、短い日本語で列挙してください（問題なしなら空配列）。',
    '一般論や褒め言葉は不要です。',
  ].join('\n');
}

export async function checkNaturalness({ audioBuffer, mimeType = 'audio/mp3', text, word, apiKey, model = DEFAULT_MODEL }) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    throw new Error('checkNaturalness: audioBuffer must be a non-empty Buffer');
  }
  if (!text || typeof text !== 'string') {
    throw new Error('checkNaturalness: text (元テキスト) is required');
  }
  if (!apiKey) {
    throw new Error('checkNaturalness: apiKey is required (process.env.GEMINI_API_KEY)');
  }

  const url = `${ENDPOINT_BASE}/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: buildPrompt(text, word) },
        { inlineData: { mimeType, data: audioBuffer.toString('base64') } },
      ],
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 512,
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
  // responseSchema 経由でも ```json fence が稀に混入する
  rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`JSON parse 失敗: ${e.message}\nraw: ${rawText.slice(0, 300)}`);
  }

  const score = Number.isInteger(parsed.score) && parsed.score >= 1 && parsed.score <= 5
    ? parsed.score
    : 3; // 不明値は中央に倒して WARN 化
  const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
  const comments = Array.isArray(parsed.comments)
    ? parsed.comments.filter(s => typeof s === 'string').slice(0, 5)
    : [];

  return {
    score,
    confidence,
    comments,
    usage: {
      promptTokens: json.usageMetadata?.promptTokenCount || 0,
      candidatesTokens: json.usageMetadata?.candidatesTokenCount || 0,
      cachedTokens: json.usageMetadata?.cachedContentTokenCount || 0,
    },
  };
}

// WARN 判定（registry / invariants 側で共有する分岐）
export function isWarn(naturalness) {
  if (!naturalness) return false;
  return naturalness.score <= 3 || naturalness.confidence === 'low';
}
