# 引き継ぎ資料：画像生成システム移行
**バージョン：image-gen-v1.0（2026-05-17）**
**スコープ：GAS画像生成 → Kaggle + FLUX.1 schnell + LoRA への完全移行**

---

## ⚠️ 次チャットで最初にやること

`image_generation_system_guide.md` の **STEP 0 から順番に**実施する。

| STEP | 内容 | 状態 |
|---|---|---|
| **STEP 0** | Google Service Account 作成・Kaggle Secrets 登録 | ❌ 未実施 |
| **STEP 1** | GAS: `resetAllImagesToPendingForKaggle()` を実行 | ❌ 未実施 |
| **STEP 2〜3** | Kaggle Notebook 作成・実行（画像生成） | ❌ 未実施 |
| **STEP 4** | GAS: `syncAll()` → `build-embedded-data.py` | ❌ 未実施 |

---

## 1. 問題の経緯

### 何が起きていたか

GASの `generateImages.gs` でスプレッドシートの全件（約80件以上）が `imageStatus = failed` になっていた。
`approved` になっている画像（約17件・人物/建物）は**旧パイプライン適用前に生成されたもの**で、新パイプラインでは1枚も生成できていない。

### エラー内容（GASログより）

```
❌ エラー: word_今 → HTTP 400: {
  "error": {
    "code": 400,
    "message": "Imagen 3 is only available on paid plans.
                Please upgrade your account at https://ai.dev/projects.",
    "status": "INVALID_ARGUMENT"
  }
}
```

### 根本原因

`imagen-4.0-generate-001` は **GA（正式リリース）版 = 有料プランのみ**。

Google Gemini Developer API 料金ページ（2026-05-17 公式確認）：

| モデル | 無料枠 |
|---|---|
| Imagen 4（全バリアント） | ❌ 利用不可 |
| Gemini 2.5/3 Flash Image 系 | ❌ 利用不可 |
| Gemini 2.0 Flash（画像生成） | ❌ シャットダウン済み |

**現時点で Gemini Developer API の無料枠で使える画像生成モデルは存在しない。**

---

## 2. 解決方針の決定

### なぜ Kaggle + LoRA を選んだか

辞書サイト運営を視野に入れると**N5〜N1 全語彙の画風統一が品質の根幹**。

検討した主な無料API（Cloudflare Workers AI / Together AI / Pollinations.AI）はいずれも **LoRA が使えない**。
LoRA なしの API と LoRA ありの Kaggle を混在させると、
N5 と N4 以降で絵柄が変わり、後から全件作り直しになる。
**最初から Kaggle 一本に統一することで、全語彙の画風を完全に揃える。**

### 採用構成

| コンポーネント | 内容 | ライセンス |
|---|---|---|
| 実行環境 | Kaggle Notebooks（T4 GPU / 週30時間・**完全無料**） | — |
| ベースモデル | `black-forest-labs/FLUX.1-schnell` | **Apache 2.0**（商用利用完全自由） |
| スタイル LoRA | `renderartist/simplevectorflux`（weight: `simplevectorflux.safetensors`） | **Apache 2.0** |
| LoRA トリガーワード | `v3ct0r` | — |
| 画像サイズ | 1024 × 1024 px | — |
| ステップ数 | 4（schnell は 1〜4 ステップ） | — |
| guidance_scale | 0.0（schnell は CFG なし・固定） | — |

> ⚠️ **`FLUX.1 [dev]` は非商用ライセンスのため絶対に使わないこと。必ず `[schnell]` を使うこと。**

---

## 3. スプレッドシートの現在の状態

**SPREADSHEET_ID：** `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk`

| imageStatus | 件数（推定） | 内容 |
|---|---|---|
| `approved` | 約17件 | 旧パイプライン生成（人物・建物）/ **要置き換え** |
| `failed` | 約63件 | 新パイプライン移行後に全件エラー |
| `pending` | 残り全件 | 未処理 |

→ `resetAllImagesToPendingForKaggle()` 実行後、**全件が `pending` になる**（approved も含む）。

---

## 4. GAS に追加する関数

`generateImages.gs` に以下を追加して実行する。

```javascript
/**
 * resetAllImagesToPendingForKaggle()
 * approved / generated / failed をすべて pending にリセット。
 * imageUrl も空にする。Kaggle移行前に1回だけ実行する。
 */
function resetAllImagesToPendingForKaggle() {
  const ss    = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
  );
  const sheet = ss.getSheetByName("Vocabulary");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("データ行がありません"); return; }

  const range = sheet.getRange(2, 8, lastRow - 1, 2); // H: imageStatus, I: imageUrl
  const data  = range.getValues();
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] !== "") {
      data[i][0] = "pending";
      data[i][1] = "";
      count++;
    }
  }

  range.setValues(data);
  Logger.log("✅ " + count + " 件を pending にリセット（imageUrl クリア済み）");
}
```

---

## 5. ScriptProperties（確定値）

| キー | 値 / 状態 | 用途 |
|---|---|---|
| `GEMINI_API_KEY` | 設定済み | 画像生成では**使わない**（Gemmaの分類のみ） |
| `SPREADSHEET_ID` | `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk` | 全スクリプト共通 |
| `IMAGE_FOLDER_ID` | 設定済み | Kaggle Secret にも同じ値を登録する |
| `AUDIO_FOLDER_ID` | 設定済み | 音声用（画像移行に無関係） |
| `GCP_TTS_KEY` | 設定済み | 音声用（画像移行に無関係） |

---

## 6. Kaggle Secrets に登録するもの

| Secret 名 | 値 |
|---|---|
| `GOOGLE_CREDENTIALS` | Service Account の JSON ファイルの内容をまるごと貼り付け |
| `IMAGE_FOLDER_ID` | ScriptProperties の `IMAGE_FOLDER_ID` と同じ値 |

---

## 7. 画像生成完了後の次ステップ（GAS）

```
Kaggle で全件 generated になったら：
  1. GAS: syncRegistries.gs の syncAll() を手動実行
     → master_image_registry.json が更新される
  2. ローカル: build-embedded-data.py を手動実行
     → 教材 HTML に新しい画像 URL が反映される
```

---

## 8. 今後の追加生成フロー（運用定着後）

```
新語彙が Vocabulary シートに追加（imageStatus = pending）
  ↓
Kaggle Notebook の Cell 4 で pending 件数を確認
  ↓
Cell 9 を実行（追加分のみ生成）
  ↓
GAS: syncAll() → build-embedded-data.py
```

---

## 9. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 |
|---|---|
| **この資料**（image-gen-handoff-v1.md） | **必須** |
| **image_generation_system_guide.md** | **必須**（全コード・手順書） |

---

## 10. 次チャットの開始コマンド例

```
image-gen-handoff-v1.md と image_generation_system_guide.md をアップロードしました。

【状況】
- 画像生成 API が全件失敗（Imagen 有料化のため）
- 新システム：Kaggle + FLUX.1 schnell + simplevectorflux LoRA に移行決定済み
- image_generation_system_guide.md の構築手順書が完成済み

【依頼】
STEP 0（Google Service Account 作成）から進めてください。
詰まった箇所があれば都度サポートをお願いします。
```

---

## 辞書サイト向けクレジット表記

```
Images generated with FLUX.1 [schnell] by Black Forest Labs (Apache 2.0)
Vector style: simplevectorflux LoRA by renderartist (Apache 2.0)
```

---

*作成日：2026-05-17*
*スコープ：画像生成システム移行のみ（シラバス・音声・lesson_02等は別資料参照）*
