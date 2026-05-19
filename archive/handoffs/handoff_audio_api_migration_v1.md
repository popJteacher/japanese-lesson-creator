# 引き継ぎ資料：音声生成API移行（Gemini TTS → Google Cloud TTS）
**バージョン：v1.2（2026-05-17）**
**前資料：handoff_v2.md（v2.0・2026-05-16）**
**スコープ：ライン B（GASパイプライン）の音声生成部分のみ**
**ステータス：✅ 移行完了・音声生成実行中**

> **v1.1 → v1.2 更新内容**
> - §9-1：全チェックリスト完了を確認・✅ に更新
> - §9-2：次ステップを「完了済み」と「進行中・残タスク」に整理
> - 移行ステータスを「実行中」に更新

> **v1.0 → v1.1 修正内容（自己検証による修正）**
> - §3：WaveNet採用の根拠を明文化（Neural2との無料枠比較）
> - §4-1：「billing設定済み」→「設定要確認」に訂正・billing設定の注意書きを追加
> - §5-1：変更内容を正確に記述（MODELフィールドの削除・デュアルモデル戦略コメントの削除を追記）
> - §9-1：チェックリストを大幅拡充（billing/handoff_v2.md更新/textToSpeak引き継ぎを追加）

> ⚠️ **handoff_v2.md からの変更点（音声生成に関する部分のみ）**
> - `generateAudio.gs` の TTS API を **Gemini TTS → Google Cloud TTS（WaveNet）** に変更
> - `generateAudio.gs` の `MAX_BATCH_SIZE` を **9件 → 50件** に変更
> - `generateAudio.gs` の `DELAY_MS` を **6000ms → 1000ms** に変更
> - ScriptProperties に **`GCP_TTS_KEY`** を新規追加
> - 中長期移行候補として **VOICEVOX / AivisSpeech** の評価を実施・記録

---

## 1. 問題の発端と移行の経緯

### 1-1. 問題

現在の音声生成モデル `gemini-2.5-flash-preview-tts`（ボイス `Aoede`）は**多言語汎用モデル**であり、日本語のピッチアクセントに特化した設計ではない。以下の不具合が確認された。

- 助詞の高低が不自然（例：「**は**」「**を**」のイントネーションが平板）
- 外来語複合語のアクセントが揺れやすい（例：「アメリカじん」「スペインじん」）
- 文末イントネーションが機械的になるケース（疑問文・対比文）

### 1-2. 検討プロセス

| ステップ | 内容 | 結論 |
|---------|------|------|
| 現行モデルの特定 | `gemini-2.5-flash-preview-tts` + `Aoede` / 10件/日 | 汎用TTSが根本原因 |
| 代替候補のリサーチ | Deep Research 資料（2本）を参照 | Google Cloud TTS・VOICEVOX 等が有力 |
| 2候補の詳細比較 | Google Cloud TTS vs VOICEVOX/AivisSpeech | 品質・汎用性・運用コストを7項目で評価 |
| **短期方針の決定** | **Google Cloud TTS（WaveNet）を第一選択** | GAS連携・無料枠・即日移行が決め手 |
| 中長期方針の記録 | VOICEVOX/AivisSpeechを将来候補として保留 | 品質最高・コストゼロだがサーバー構築必要 |

---

## 2. 音声モデル比較（確定した評価）

### 2-1. 現行モデルとの比較

| 比較項目 | Gemini TTS（現行） | Google Cloud TTS WaveNet（移行先） |
|---------|-------------------|-----------------------------------|
| **日本語特化** | ❌ 汎用 | ✅ 最適化済み |
| **ピッチアクセント** | △ 不自然さあり | ◎ SSML `<phoneme>` で修正可 |
| **生成件数上限** | 10件/日（無料枠） | 400万文字/月（無料枠） |
| **1日の処理能力** | 10件 | 実質無制限 |
| **課金設定** | 不要 | 必要（ただし無料枠あり） |
| **GAS連携** | ◎ | ◎（URL変更のみ） |
| **コード変更量** | ─ | 最小限（3か所のみ） |

### 2-2. Google Cloud TTS vs VOICEVOX/AivisSpeech（総合比較）

| 評価軸 | Google Cloud TTS | VOICEVOX/AivisSpeech |
|--------|:---:|:---:|
| ピッチアクセントの正確さ | ★★★★☆ | ★★★★★ |
| 文末イントネーション | ★★★★☆ | ★★★★★ |
| 明瞭さ（初心者向け） | ★★★★★ | ★★★★☆ |
| 読み間違い対策の容易さ | ★★★☆☆ | ★★★★★ |
| 話者バリエーション | ★★★☆☆ | ★★★★★ |
| 音声調整の柔軟性 | ★★★☆☆ | ★★★★★ |
| **GAS自動化の維持** | ★★★★★ | ★★☆☆☆ |
| スケール時のコスト | ★★★☆☆ | ★★★★★ |
| 商用利用の明確さ | ★★★★★ | ★★★☆☆ |
| **導入の容易さ** | ★★★★★ | ★★☆☆☆ |

> **VOICEVOX が音質面では上位**だが、GASから直接呼び出せない（ローカルエンジンのため）。
> サーバー構築が前提となり、現在のパイプライン設計とは相性が悪い。

### 2-3. 調査した全候補サービス一覧（参考）

| サービス | 評価 | 備考 |
|---------|------|------|
| Google Cloud TTS（WaveNet/Neural2） | ◎ **→ 採用** | 教育向け・SSML対応・無料枠大 |
| VOICEVOX / AivisSpeech | ◎（中長期候補） | 品質最高・無料・サーバー構築必要 |
| Microsoft Azure TTS（Nanami） | ○ | 品質最高水準・コストやや高 |
| Amazon Polly（Takumi） | ○ | AWS親和性高い・phoneme制御可 |
| CoeFont | ○ | 日本製・プロ声優・有料プラン要 |
| AITalk WebAPI | ○ | 日本製・教育向け・月額5,000円〜 |
| VoiceText/ReadSpeaker | ○ | 日本製・高品質・有料 |
| IBM Watson TTS | △ | 声が1種類・やや単調 |
| VoiceRSS | △ | 安価だが品質中程度 |
| Open JTalk / Coqui TTS | △ | OSS・自前サーバー必要・品質低め |
| OpenAI TTS | △ | 英語最適化・日本語アクセント弱い |
| ElevenLabs | △ | 品質高いがコスト高・商用条件複雑 |

---

## 3. Google Cloud TTS の無料枠（2026-05-17 公式確認）

公式料金ページ（`cloud.google.com/text-to-speech/pricing`）より確認。

| モデル | 無料枠（月） | 超過後 | 備考 |
|--------|------------|--------|------|
| **WaveNet** | **400万文字/月** | $4/100万文字 | **→ 採用モデル** |
| Neural2 | 100万文字/月 | $16/100万文字 | より高品質だが無料枠が WaveNet の 1/4 |
| Standard | 400万文字/月 | $4/100万文字 | 品質が WaveNet より低い |

> **WaveNet を採用した理由：** 検討初期は Neural2 を候補としていたが、無料枠が 100万文字/月（WaveNet の 1/4）と少なく、N5〜N1 全語彙の長期生成計画には適さないと判断。WaveNet は無料枠が 400万文字/月と大きく、音質も教育教材として十分な水準のため採用。

**重要：課金設定（billing）は必須だが、無料枠内なら請求は発生しない。**

### このプロジェクトの消費量試算

```
現在（L01+L02）：75エントリ × 平均10文字 ≒ 750文字　→ 無料枠の 0.02%
N5全語彙（将来）：語彙800語+例文800件 ≒ 約15,000文字 → 無料枠の 0.4%
N5〜N1全語彙（長期）：約150,000文字 → 無料枠の 約4%
```

**実質無料で全語彙対応が可能。**

### 予算アラートの設定（推奨）

Cloud Console → 「お支払い」→「予算とアラート」→ 予算 **$1** で通知設定。
誤って無料枠を超えた場合のメール通知で保険をかけられる。

---

## 4. APIキーの構成（確定）

### 4-1. 2キー運用の設計

```
【GCPプロジェクト：japanese-lesson-creator】
  ├── 課金アカウント（1つ・billing 設定要確認 ← §9-1チェックリスト参照）
  ├── 有効化済みAPI
  │     ├── Generative Language API（Gemini/Gemma/Imagen 系）
  │     └── Cloud Text-to-Speech API  ← 今回追加
  └── APIキー（2つ）
        ├── GEMINI_API_KEY（AI Studio発行・既存）
        │     └── 用途：classifyBatch / generateImageBatch
        └── GCP_TTS_KEY（Cloud Console発行・新規・作成済み）
              └── 用途：generateAudioBatch のみ（Cloud TTS 専用に制限済み）
```

**2キーを同一プロジェクトで運用することに問題はない。課金は1か所に集約。**

> ⚠️ **billing（請求先アカウント）の設定が別途必要。** APIキーの作成と billing の設定は独立した手順。billing が未設定のままだと `HTTP 403: BILLING_DISABLED` エラーで音声生成が動作しない。Cloud Console → 「お支払い」から設定する。

### 4-2. APIキーの種別と特性

| 比較項目 | GEMINI_API_KEY（既存） | GCP_TTS_KEY（新規） |
|---------|----------------------|-------------------|
| **発行元** | Google AI Studio | Google Cloud Console |
| **課金設定** | 不要 | 必要（無料枠あり） |
| **制限の単位** | RPD（1日リクエスト数） | 文字数/月 |
| **API制限** | Generative Language API のみ | Cloud TTS API のみ（設定済み） |
| **アプリケーション制限** | ─ | なし（GASはIPが固定でないため） |

### 4-3. ScriptProperties の状態（移行後）

| プロパティキー | 値 | 用途 |
|------------|-----|------|
| `GEMINI_API_KEY` | AI Studio発行のキー | Gemma（分類）・Imagen（画像） |
| `GCP_TTS_KEY` | Cloud Console発行のキー | **Cloud TTS（音声）** |
| `SPREADSHEET_ID` | `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` | 全スクリプト共通 |
| `IMAGE_FOLDER_ID` | 設定済み | generateImages.gs |
| `AUDIO_FOLDER_ID` | 設定済み | generateAudio.gs |

---

## 5. generateAudio.gs の変更内容

### 5-1. 変更箇所の全体像

変更は **3か所のみ**。`buildWavBlob_()` `saveAudioToDrive_()` `updateAudioStatus_()` `syncRegistries.gs` はすべて変更不要。

```
変更①：AUDIO_SETTINGS（冒頭）
  【削除】MODEL フィールド（Gemini TTS 専用・不要になる）
  【変更】VOICE_NAME: "Aoede" → "ja-JP-Wavenet-B"
  【追加】LANGUAGE_CODE / AUDIO_ENCODING / SAMPLE_RATE（Cloud TTS 専用フィールド）
  【変更】DELAY_MS: 6000 → 1000
  【変更】MAX_BATCH_SIZE: 9 → 50
  【削除】コメント行「【2回目】gemini-3.1-flash-preview-tts に変更して再実行 → 合計 20件/日」
          （デュアルモデル戦略は Cloud TTS 移行により廃止）

変更②：callGeminiTTS_()（約40行）を削除
  → callGoogleCloudTTS_()（新関数）に丸ごと置き換え

変更③：processAudioEntry_() 内の1行
  const ttsResult = callGeminiTTS_()  →  callGoogleCloudTTS_()
```

### 5-2. 変更後の AUDIO_SETTINGS（完全版）

```javascript
const AUDIO_SETTINGS = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
                    .getProperty("SPREADSHEET_ID") || "YOUR_SPREADSHEET_ID_HERE",
  VOCAB_SHEET_NAME:    "Vocabulary",
  EXAMPLES_SHEET_NAME: "Examples",
  LOG_SHEET_NAME:      "Log",
  AUDIO_FOLDER_ID: PropertiesService.getScriptProperties()
                     .getProperty("AUDIO_FOLDER_ID") || "YOUR_AUDIO_FOLDER_ID_HERE",

  // ── Google Cloud TTS 設定 ──
  // 日本語 WaveNet 音声の選択肢（無料枠: 400万文字/月）
  //   ja-JP-Wavenet-B : 女性・明瞭・教材向き ★推奨
  //   ja-JP-Wavenet-A : 女性（別声質）
  //   ja-JP-Wavenet-C : 男性
  //   ja-JP-Wavenet-D : 男性（別声質）
  // Neural2（さらに自然・無料枠: 100万文字/月）
  //   ja-JP-Neural2-B : 女性
  //   ja-JP-Neural2-C : 男性
  VOICE_NAME:     "ja-JP-Wavenet-B",
  LANGUAGE_CODE:  "ja-JP",
  AUDIO_ENCODING: "LINEAR16",    // WAV互換PCM → buildWavBlob_() をそのまま流用可
  SAMPLE_RATE:    24000,         // 24kHz（WaveNetデフォルト）

  DELAY_MS:       1000,          // 旧: 6000ms → Cloud TTSはレート制限が緩いため短縮
  MAX_BATCH_SIZE: 50,            // 旧: 9件 → 日次上限なし・GAS 6分制限内に収める
};
```

### 5-3. 新関数 callGoogleCloudTTS_()（完全版）

```javascript
// Gemini TTS の callGeminiTTS_() をこの関数に丸ごと置き換える
// 戻り値形式は buildWavBlob_() との互換性を維持（Gemini TTS と同一）
function callGoogleCloudTTS_(text) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GCP_TTS_KEY");
  if (!apiKey) {
    return { success: false, error: "GCP_TTS_KEY が ScriptProperties に設定されていません" };
  }

  const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;

  const payload = {
    input: { text: text },
    voice: {
      languageCode: AUDIO_SETTINGS.LANGUAGE_CODE,
      name:         AUDIO_SETTINGS.VOICE_NAME,
    },
    audioConfig: {
      audioEncoding:   AUDIO_SETTINGS.AUDIO_ENCODING,
      sampleRateHertz: AUDIO_SETTINGS.SAMPLE_RATE,
      // speakingRate: 1.0,   // 0.25〜4.0（必要に応じてコメントアウト解除）
      // pitch: 0.0,          // -20.0〜20.0半音単位
    }
  };

  const options = {
    method:      "post",
    contentType: "application/json",
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response   = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    return {
      success: false,
      error: "HTTP " + statusCode + ": " + response.getContentText().substring(0, 300)
    };
  }

  let json;
  try {
    json = JSON.parse(response.getContentText());
  } catch (e) {
    return { success: false, error: "JSON パースエラー: " + e.message };
  }

  if (!json.audioContent) {
    return { success: false, error: "audioContent が空。APIキーまたはVOICE_NAMEを確認。" };
  }

  // buildWavBlob_() に渡す形式（Gemini TTS と互換）
  return {
    success:    true,
    pcmBase64:  json.audioContent,
    sampleRate: AUDIO_SETTINGS.SAMPLE_RATE,
  };
}
```

### 5-4. processAudioEntry_() 内の変更（1行のみ）

```javascript
// 変更前
const ttsResult = callGeminiTTS_(row.textToSpeak);

// 変更後
const ttsResult = callGoogleCloudTTS_(row.textToSpeak);
```

### 5-5. 変更しないもの（確認済み）

| 関数/スクリプト | 変更要否 | 理由 |
|---------------|---------|------|
| `buildWavBlob_()` | 変更不要 | LINEAR16（PCM）は同一形式 |
| `saveAudioToDrive_()` | 変更不要 | Drive保存ロジックは変わらない |
| `updateAudioStatus_()` | 変更不要 | SS書き込みは変わらない |
| `writeAudioLog_()` | 変更不要 | ログ形式は変わらない |
| `getPendingAudioRows_()` | 変更不要 | SS読み込みは変わらない |
| `testSingleAudio()` | 変更不要 | そのまま動作確認に使える |
| `syncRegistries.gs` | 変更不要 | 音声URLの構造は変わらない |
| `classifyAndTranslate.gs` | 変更不要 | GEMINI_API_KEY を引き続き使用 |
| `generateImages.gs` | 変更不要 | GEMINI_API_KEY を引き続き使用 |

---

## 6. タイマートリガーの変更（任意）

`MAX_BATCH_SIZE` が 9→50 に増加したため、現在3回/日に設定されているトリガーを1回/日に集約できる。

| | 変更前（Gemini TTS） | 変更後（Cloud TTS） |
|-|---------------------|---------------------|
| トリガー本数 | 3本（10:00・14:00・18:00） | **1本（10:00）** で十分 |
| 1回の処理上限 | 9件 | 50件 |
| 75エントリの完了日数 | 約8日 | **当日中** |

---

## 7. よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| `HTTP 403: API_KEY_INVALID` | GCP_TTS_KEYが間違い | ScriptPropertiesを再確認 |
| `HTTP 403: ACCESS_DENIED` | Cloud TTS APIが未有効化 | Cloud Consoleでライブラリ→有効化 |
| `HTTP 403: BILLING_DISABLED` | billing設定が未完了 | Cloud Consoleで請求先アカウントを設定 |
| `audioContent が空` | VOICE_NAMEのタイポ | `ja-JP-Wavenet-B` のスペルを確認 |
| `HTTP 400: invalid voice` | 対応外のvoice指定 | 正式なvoice名に変更 |

---

## 8. 中長期の移行シナリオ（保留中）

### 8-1. VOICEVOX / AivisSpeech への移行（Phase 2以降で検討）

音質面では現行の Google Cloud TTS を上回るが、**GASから直接呼び出せない**ため現時点では採用しない。

**移行に必要な前提条件：**
- クラウドサーバー（VPS/Cloud Run）を用意してVOICEVOXエンジンを常時起動
- またはローカルPCをngrokでトンネルし、GASから呼び出す（不安定）
- またはGASを捨ててPython+cronで音声生成を自動化

**移行するタイミングの目安：**
- N5全語彙（約800語）の音声生成が完了し、品質の聴き比べができる段階
- 辞書サイト展開の前（商用ライセンスの詳細確認が必要）

### 8-2. 移行した場合のGASコード変更量

VOICEVOX に移行する場合も `callGoogleCloudTTS_()` を置き換えるだけでよい（`buildWavBlob_()` `saveAudioToDrive_()` は変わらない）。

### 8-3. 利用検討候補のキャラクター（商用利用可能・CC BY 4.0）

教育教材として使用しやすいVOICEVOXキャラクター（最新ライセンスは公式サイトで要確認）：

| 話者名 | 声質 | 備考 |
|--------|------|------|
| 春日部つむぎ | 落ち着いた女性 | 教材向き |
| 雨晴はう | 丁寧な女性 | 教材向き |
| 四国めたん（ノーマル） | 明るい女性 | クレジット表記要 |

---

## 9. 次チャットへの申し送り事項

### 9-1. 移行完了確認チェックリスト

```
【前提条件】
✅ Cloud Console で billing（My Billing Account）が japanese-lesson-creator に設定済み
✅ Cloud Text-to-Speech API が GCP プロジェクトで有効化済み

【ScriptProperties】
✅ GCP_TTS_KEY が登録済み・キー名も "GCP_TTS_KEY" で一致（Cloud TTS API 専用制限済み）

【generateAudio.gs の変更】
✅ AUDIO_SETTINGS から MODEL フィールドが削除されている
✅ AUDIO_SETTINGS の VOICE_NAME が "ja-JP-Wavenet-B" になっている
✅ AUDIO_SETTINGS に LANGUAGE_CODE / AUDIO_ENCODING / SAMPLE_RATE が追加されている
✅ AUDIO_SETTINGS の DELAY_MS が 1000、MAX_BATCH_SIZE が 50 になっている
✅ デュアルモデル戦略のコメントが削除されている
✅ callGeminiTTS_() が削除され callGoogleCloudTTS_() に置き換えられている
✅ processAudioEntry_() 内の関数名が callGoogleCloudTTS_ に変更されている

【動作確認】
✅ testSingleAudio() で1件生成・音声のイントネーションを確認済み
✅ resetAllAudioToPending() で全エントリを pending にリセット済み
✅ generateAudioBatch() を実行して全75エントリの生成を開始済み

【handoff_v2.md の更新】
✅ トリガー表の generateAudioBatch 行を更新済み
✅ 確定済み設定値の AUDIO_SETTINGS を更新済み

【推奨】
✅ 予算アラート（¥150/月・50%/90%/100%/150% 通知）が Cloud Console に設定済み
```

> **textToSpeak フィールドについて（変更不要）：** スプレッドシートの `textToSpeak` 列に読み仮名（ひらがな）を登録する誤読対策は Cloud TTS 切り替え後も継続して有効。`generateAudio.gs` が `row.textToSpeak` をそのまま API に渡す設計は変わらないため、前処理の仕組みはそのまま引き継がれる。

### 9-2. 音声生成完了後の次ステップ

| タスク | 状態 | 備考 |
|--------|------|------|
| generateAudioBatch() 全件実行 | 🔄 進行中 | タイマー（毎日 10:00）で自動継続 |
| `syncAll()` を手動実行 | ⏳ 待機中 | generateAudioBatch 完了後に実行 |
| `build-embedded-data.py` を実行 | ⏳ 待機中 | syncAll 完了後に実行 |
| 宿題 HTML への音声埋め込み | ⏳ 待機中 | master_audio_registry.json に URL 反映後 |
| L02 音声の生成 | ⏳ 待機中 | L01 完了後・スプレッドシートに L02 エントリが登録済み |
| VOICEVOX 品質比較（任意） | 保留 | N5全語彙完了後に同一語彙をVOICEVOXで生成して聴き比べ |

### 9-3. このチャットで参照した資料

| 資料 | 内容 |
|------|------|
| `deep-research-report__Japanese_API_.md` | TTS比較レポート①（Google・Azure・Polly・CoeFont・VOICEVOX） |
| `deep-research-report__Japanese_API_2.md` | TTS比較レポート②（IBM・VoiceText・AITalk・VoiceRSS・OpenJTalk） |
| `handoff_v2.md`（v2.0） | GASパイプライン全体の引き継ぎ元資料 |
| `generateAudio.gs` | 変更対象スクリプト（プロジェクトナレッジ） |

---

## 10. 次チャットの開始コマンド例

**音声生成の続きをする場合：**
```
handoff_audio_api_migration_v1.md（v1.2）の続きです。

【移行完了済み】
- generateAudio.gs を Google Cloud TTS（WaveNet・ja-JP-Wavenet-B）に切り替え済み
- ScriptProperties に GCP_TTS_KEY 登録済み
- billing・予算アラート（¥150/月）設定済み
- testSingleAudio() 動作確認済み
- resetAllAudioToPending() で全75件をリセット済み
- generateAudioBatch() 実行開始済み（タイマーで自動継続中）

【現在の状態】
- generateAudioBatch() の進捗：[完了 / 処理中（残りXX件）]
- syncAll() の実行：[済み / 未実施]

【確認・対応をお願いしたいこと】
[ここに具体的な作業を書く]
```

---

*作成日：2026-05-17（v1.0）→ v1.1 修正（同日・自己検証） → v1.2 最終更新（同日・移行完了確認）*
*根拠資料：このチャットでの議論 / deep-research-report__Japanese_API_.md / deep-research-report__Japanese_API_2.md / handoff_v2.md / cloud.google.com/text-to-speech/pricing（2026-05-17 公式確認）*
