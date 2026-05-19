# 新画像生成システム構築ガイド
**バージョン：v1.0（2026-05-17）**
**目的：全画像をKaggle + FLUX.1 schnell + simplevectorflux LoRAで統一生成する**

---

## 全体像

```
【旧システム（廃止）】
GAS → Imagen API（有料・失敗多発）

【新システム】
GAS（リセット・管理）
  ↓ imageStatusを全件 pending に
Kaggle Notebook（生成エンジン）
  FLUX.1 schnell + simplevectorflux LoRA
  ↓ 週30時間GPU・完全無料
Google Drive（画像保存）
  ↓
GAS スプレッドシート更新（imageUrl, imageStatus）
  ↓
syncAll() → master_image_registry.json 更新
  ↓
build-embedded-data.py → HTML反映
```

**生成結果の画風は全語彙（N5〜N1）で完全統一される。**
既存の`approved`画像も含めて全件作り直す。

---

## STEP 0：事前準備（Google Service Account）

KaggleからGoogle SheetsとDriveにアクセスするためのAPIキーを準備する。
**1回だけの作業。**

### 0-1. Service Account 作成

1. [Google Cloud Console](https://console.cloud.google.com) を開く
2. プロジェクト `japanese-lesson-creator` を選択
3. 「IAMと管理」→「サービスアカウント」→「サービスアカウントを作成」
4. 名前：`kaggle-image-generator`
5. ロール：付与不要（次のステップでファイル単位に権限を渡す）
6. 作成後、「キー」タブ→「鍵を追加」→「JSON」でダウンロード
7. ダウンロードしたJSONファイルの中身をメモ帳で開いておく

### 0-2. スプレッドシートとDriveフォルダへのアクセス権限を付与

JSONファイル内の `"client_email"` の値（例：`kaggle-image-generator@japanese-lesson-creator.iam.gserviceaccount.com`）をコピーして：

1. **スプレッドシート**を開く → 「共有」→ 上記メールアドレスを編集者として追加
2. **Drive の画像フォルダ**（`IMAGE_FOLDER_ID`）を開く → 「共有」→ 同様に編集者として追加

### 0-3. Kaggle Secrets に登録

1. Kaggle にログイン → 右上アイコン → 「Settings」→「Secrets」
2. 以下の2件を追加：

| Secret名 | 値 |
|---|---|
| `GOOGLE_CREDENTIALS` | JSONファイルの内容を**まるごとコピーして貼り付け** |
| `IMAGE_FOLDER_ID` | Drive画像フォルダのID（ScriptPropertiesに登録済みの値） |

---

## STEP 1：GAS — 全画像をリセット

`generateImages.gs` に以下の関数を追加して実行する。

```javascript
/**
 * resetAllImagesToPendingForKaggle()
 * 
 * 【目的】Kaggle生成システムへの移行のため
 * approved / generated / failed / pending すべてを
 * pending にリセットし、imageUrl を空にする。
 * 
 * ⚠️ 既存の approved 画像も含めて全件対象。
 * 実行前に確認してから実行すること。
 */
function resetAllImagesToPendingForKaggle() {
  const ss    = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")
  );
  const sheet = ss.getSheetByName("Vocabulary");
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("データ行がありません");
    return;
  }

  // H列(imageStatus=8列目) + I列(imageUrl=9列目) を一括取得
  const range = sheet.getRange(2, 8, lastRow - 1, 2);
  const data  = range.getValues();

  let count = 0;
  for (let i = 0; i < data.length; i++) {
    // imageId が空でない行（imageStatusが何であれリセット）
    if (data[i][0] !== "") {
      data[i][0] = "pending";  // imageStatus → pending
      data[i][1] = "";         // imageUrl → クリア
      count++;
    }
  }

  range.setValues(data);
  Logger.log("✅ " + count + " 件を pending にリセット（imageUrl もクリア）");
  Logger.log("次：Kaggle Notebook を実行してください");
}
```

**実行手順：**
1. GASエディタで上記関数を追加して保存
2. `resetAllImagesToPendingForKaggle` を選択して ▶ 実行
3. スプレッドシートのH列が全件 `pending` になったことを確認

---

## STEP 2：Kaggle Notebook — セットアップ

1. [Kaggle](https://www.kaggle.com) にログイン
2. 「Create」→「New Notebook」
3. 右側パネル「Settings」：
   - Accelerator: **GPU T4 x2** を選択（または P100）
   - Internet: **On**（モデルダウンロードに必要）
4. ノートブック名：`japanese-vocab-image-generator`

---

## STEP 3：Kaggle Notebook — 完全コード

以下を **セルに分けて**貼り付ける。

---

### Cell 1｜依存ライブラリのインストール

```python
# ============================================================
# Cell 1: Install
# ============================================================
!pip install -q \
  diffusers==0.32.2 \
  transformers \
  accelerate \
  peft \
  huggingface_hub \
  google-auth \
  google-auth-oauthlib \
  google-api-python-client \
  gspread \
  sentencepiece \
  protobuf

print("✅ インストール完了")
```

---

### Cell 2｜設定

```python
# ============================================================
# Cell 2: Config
# ============================================================
import os, json, hashlib, io, time, warnings
warnings.filterwarnings("ignore")

# ── スプレッドシートID（handoff_audio_api_migration_v1.md §4-3 より）
SPREADSHEET_ID   = "1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk"
VOCAB_SHEET_NAME = "Vocabulary"

# ── 1セッションで処理する最大件数
# T4 x2 / 1枚あたり約15〜25秒 → 9時間で最大約1,200枚
# 安全のため500件ずつ実行し、セッションをまたいで継続
MAX_BATCH = 500

# ── LoRAのスケール（0.7〜1.0で調整）
LORA_SCALE = 0.85

# ── 画像サイズ
IMG_WIDTH  = 1024
IMG_HEIGHT = 1024

def get_seed(image_id: str) -> int:
    """imageIdのMD5ハッシュから再現可能なシード値を生成"""
    return int(hashlib.md5(image_id.encode()).hexdigest(), 16) % (2**31)

print(f"✅ 設定完了")
print(f"   SPREADSHEET_ID: {SPREADSHEET_ID}")
print(f"   MAX_BATCH: {MAX_BATCH}")
```

---

### Cell 3｜Google API 認証

```python
# ============================================================
# Cell 3: Google API Authentication
# ============================================================
from kaggle_secrets import UserSecretsClient
import gspread
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

secrets = UserSecretsClient()

# Kaggle Secrets から認証情報を取得
creds_json     = json.loads(secrets.get_secret("GOOGLE_CREDENTIALS"))
IMAGE_FOLDER_ID = secrets.get_secret("IMAGE_FOLDER_ID")

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]
creds        = Credentials.from_service_account_info(creds_json, scopes=SCOPES)
gc           = gspread.authorize(creds)
drive_svc    = build("drive", "v3", credentials=creds)
sheets_svc   = build("sheets", "v4", credentials=creds)

print("✅ Google API 認証完了")
print(f"   Drive folder: {IMAGE_FOLDER_ID}")
```

---

### Cell 4｜スプレッドシートから pending 行を取得

```python
# ============================================================
# Cell 4: Load Pending Rows from Spreadsheet
# ============================================================

def load_pending_rows():
    sh      = gc.open_by_key(SPREADSHEET_ID)
    ws      = sh.worksheet(VOCAB_SHEET_NAME)
    all_data = ws.get_all_values()

    if not all_data:
        print("❌ スプレッドシートにデータがありません")
        return [], ws

    headers = all_data[0]

    # 列名からインデックスを動的取得（列順変更に対応）
    try:
        col = {h: i for i, h in enumerate(headers)}
        c_word        = col.get("word",        0)
        c_reading     = col.get("reading",     1)
        c_en          = col.get("en",          2)
        c_vocab_type  = col.get("vocab_type",  5)
        c_imageId     = col.get("imageId",     6)
        c_imageStatus = col.get("imageStatus", 7)
    except Exception as e:
        print(f"❌ ヘッダー解析エラー: {e}")
        return [], ws

    pending = []
    for i, row in enumerate(all_data[1:], start=2):  # 2行目から（SS上の行番号）
        if len(row) <= c_imageStatus:
            continue
        if row[c_imageStatus].strip() != "pending":
            continue
        word     = row[c_word].strip()     if len(row) > c_word     else ""
        image_id = row[c_imageId].strip()  if len(row) > c_imageId  else ""
        if not word:
            continue
        if not image_id:
            image_id = f"word_{word}"

        pending.append({
            "rowIndex":  i,
            "word":      word,
            "reading":   row[c_reading].strip()    if len(row) > c_reading    else "",
            "en":        row[c_en].strip()         if len(row) > c_en         else word,
            "vocabType": row[c_vocab_type].strip() if len(row) > c_vocab_type else "other",
            "imageId":   image_id,
        })

    return pending, ws

all_pending, worksheet = load_pending_rows()
batch = all_pending[:MAX_BATCH]

print(f"✅ pending 件数: {len(all_pending)}")
print(f"   今回処理件数: {len(batch)}")
print(f"   残り（次回）: {max(0, len(all_pending) - len(batch))}")
```

---

### Cell 5｜モデルのロード（時間がかかる・約5〜10分）

```python
# ============================================================
# Cell 5: Load FLUX.1 schnell + simplevectorflux LoRA
# ============================================================
import torch
from diffusers import FluxPipeline

print("📥 FLUX.1-schnell をロード中（約5GB・数分かかります）...")
pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-schnell",
    torch_dtype=torch.bfloat16,
)

print("📥 simplevectorflux LoRA をロード中...")
# Apache 2.0 ライセンス・商用利用可
# トリガーワード: v3ct0r
pipe.load_lora_weights(
    "renderartist/simplevectorflux",
    weight_name="simplevectorflux.safetensors",
    adapter_name="simplevector",
)
pipe.set_adapters(["simplevector"], adapter_weights=[LORA_SCALE])

print("🚀 GPUへ転送中...")
pipe.enable_model_cpu_offload()  # T4(15GB)でのVRAM節約

print("✅ モデルロード完了")
print(f"   LoRAスケール: {LORA_SCALE}")
```

---

### Cell 6｜プロンプトビルダー

```python
# ============================================================
# Cell 6: Prompt Builder
# （master_prompt_design_guide_v2_5.py STYLE_BIBLE準拠 + LoRAトリガー）
# ============================================================

# LoRAトリガー + STYLE_BIBLE の色指定・スタイル指定を統合
STYLE_CORE = (
    "v3ct0r style, "                                    # simplevectorflux LoRAトリガー
    "minimalist flat vector illustration, "
    "clean continuous black outlines with consistent line weight, "
    "completely flat solid color fills only, "
    "color palette: soft cream white background #FBFBFB, "
    "deep slate navy outlines #1B2C40, "
    "muted warm blue #4A7FB5 and warm amber gold #FAD141 as accents, "
    "no gradients, no shadows, no 3D effects, no photoreal textures, "
    "zero ambient lighting, zero drop shadows"
)

NEGATIVE = (
    "photorealistic, 3d render, complex background, "
    "multiple objects, text, watermark, signature, "
    "gradient, shadow, glow, blur"
)

# 建物の視覚ヒント辞書（generateImages.gs の BUILDING_CUES と同等）
BUILDING_CUES = {
    "病院":     {"signage": "病院", "feature": "red medical cross symbol, automatic sliding glass doors"},
    "学校":     {"signage": "学校", "feature": "gate with stone pillars, child with randoseru backpack"},
    "大学":     {"signage": "大学", "feature": "wide archway gate, students with backpacks on campus path"},
    "銀行":     {"signage": "銀行", "feature": "revolving door, ATM kiosk on side wall"},
    "デパート": {"signage": "デパート", "feature": "wide automatic glass doors, display windows both sides"},
}

# 人物プロファイル辞書（generateImages.gs の PERSON_PROFILES と同等）
PERSON_PROFILES = {
    "医者":    "doctor in white coat with stethoscope, holding clipboard, professional confident posture",
    "会社員":  "office worker in business casual, collared shirt and trousers, standing upright",
    "学生":    "student in casual clothes carrying school backpack, young adult, friendly expression",
    "先生":    "teacher in smart casual, holding a book or marker pen, implied classroom space",
    "看護師":  "nurse in pale blue scrubs with name badge, caring expression, holding clipboard",
    "警察官":  "police officer in dark navy uniform with cap and badge, calm authoritative posture",
    "子ども":  "young child 8-10 years old in casual clothes, cheerful playful posture",
    "お父さん":"middle-aged man 40s in casual smart clothes, warm paternal expression",
    "お母さん":"middle-aged woman 40s in casual smart clothes, warm caring expression",
}
PERSON_DEFAULT = "generic adult in everyday casual clothes, friendly neutral expression, role communicated through posture and props"

def build_prompt(row: dict) -> str:
    vt   = (row["vocabType"] or "other").lower()
    word = row["word"]
    en   = row["en"] or word

    if vt == "person":
        profile = PERSON_PROFILES.get(word, PERSON_DEFAULT)
        return (
            f"{STYLE_CORE}, "
            f"{profile}, "
            f"full body portrait, character fills 70-80% of frame, "
            f"centered composition, simple flat background, "
            f"no text, no letters"
        )

    elif vt == "building":
        cues = BUILDING_CUES.get(word, {})
        signage = cues.get("signage", word)
        feature = cues.get("feature", f"clearly identifiable {en} building")
        return (
            f"{STYLE_CORE}, "
            f"{en} building, single Japanese signage '{signage}' on building, "
            f"{feature}, "
            f"3/4 front angle view, building fills 70% of frame, "
            f"pale blue sky background, "
            f"EXCEPTION: single Japanese building signage word '{signage}' is permitted"
        )

    elif vt == "concrete_object":
        return (
            f"{STYLE_CORE}, "
            f"{en} ({word}), "
            f"single object centered filling 70-80% of frame, "
            f"canonical 3/4 view 30-45 degrees above and to one side, "
            f"solid white background, isolated, no other objects, "
            f"distinctive identifying visual details clearly rendered, "
            f"no text, no letters"
        )

    elif vt == "action_verb":
        return (
            f"{STYLE_CORE}, "
            f"person performing action of {en} ({word}), "
            f"peak moment of action, motion direction clearly readable, "
            f"directional arrow or motion line permitted, "
            f"character centered filling 70% of frame, "
            f"minimal white or single-color flat background, "
            f"no text, no letters, directional arrows permitted"
        )

    elif vt == "adjective":
        return (
            f"{STYLE_CORE}, "
            f"visual representation of the adjective {en} ({word}), "
            f"two contrasting simple objects clearly showing the quality difference, "
            f"clear visual comparison, centered layout, "
            f"no text, no letters"
        )

    elif vt == "abstract_concept":
        return (
            f"{STYLE_CORE}, "
            f"symbolic icon representing the concept {en} ({word}), "
            f"universally recognizable symbol or metaphor, "
            f"centered filling 70% of frame, white background, "
            f"no text, no letters, no numbers"
        )

    elif vt == "spatial_relation":
        return (
            f"{STYLE_CORE}, "
            f"diagram showing spatial relationship {en} ({word}), "
            f"two simple objects demonstrating the position clearly, "
            f"directional lines or arrows permitted, "
            f"no text, no letters"
        )

    elif vt == "demonstrative":
        zone = "near speaker"
        if word.startswith("そ") or word in ["そこ", "そちら", "それ"]:
            zone = "near listener"
        elif word.startswith("あ") or word in ["あそこ", "あちら", "あれ"]:
            zone = "far from both"
        return (
            f"{STYLE_CORE}, "
            f"two generic adult figures face each other, "
            f"simple object in zone: {zone}, "
            f"colored territory boundary and pointing arrow, "
            f"no text, no letters, territory lines and arrows permitted"
        )

    else:  # other
        return (
            f"{STYLE_CORE}, "
            f"{en} ({word}), "
            f"main subject fills 70-80% of frame, solid white background, "
            f"canonical 3/4 view, "
            f"no text, no letters, no numbers, no symbols"
        )

# テスト確認
test_row = {"word": "医者", "en": "doctor", "vocabType": "person", "imageId": "word_医者"}
print("プロンプトテスト（医者）:")
print(build_prompt(test_row))
print("\n✅ プロンプトビルダー準備完了")
```

---

### Cell 7｜Drive アップロード関数

```python
# ============================================================
# Cell 7: Drive Upload Function
# ============================================================
from PIL import Image
from googleapiclient.http import MediaIoBaseUpload

def upload_to_drive(image: Image.Image, filename: str) -> str:
    """
    PIL Image を Google Drive にアップロードして公開URLを返す。
    同名ファイルが既存の場合は削除してから再アップロード。
    """
    # 同名の既存ファイルを削除
    query = (
        f"name='{filename}' "
        f"and '{IMAGE_FOLDER_ID}' in parents "
        f"and trashed=false"
    )
    existing = drive_svc.files().list(
        q=query, fields="files(id)"
    ).execute().get("files", [])
    for f in existing:
        drive_svc.files().delete(fileId=f["id"]).execute()

    # PIL → BytesIO
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)

    # アップロード
    media = MediaIoBaseUpload(buf, mimetype="image/png", resumable=False)
    file_meta = {"name": filename, "parents": [IMAGE_FOLDER_ID]}
    uploaded = drive_svc.files().create(
        body=file_meta, media_body=media, fields="id"
    ).execute()

    file_id = uploaded["id"]

    # 一般公開（閲覧のみ）
    drive_svc.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    return f"https://drive.google.com/uc?id={file_id}"

print("✅ Drive アップロード関数 準備完了")
```

---

### Cell 8｜スプレッドシート更新関数

```python
# ============================================================
# Cell 8: Spreadsheet Update Function
# ============================================================

def update_sheet_row(row_index: int, status: str, url: str = ""):
    """
    指定行の imageStatus (H列=8) と imageUrl (I列=9) を更新する。
    """
    range_notation = f"{VOCAB_SHEET_NAME}!H{row_index}:I{row_index}"
    body = {
        "values": [[status, url]],
        "majorDimension": "ROWS",
    }
    sheets_svc.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=range_notation,
        valueInputOption="RAW",
        body=body,
    ).execute()

print("✅ スプレッドシート更新関数 準備完了")
```

---

### Cell 9｜メイン生成ループ（ここから実行）

```python
# ============================================================
# Cell 9: Main Generation Loop
# ============================================================

if len(batch) == 0:
    print("✅ 処理対象がありません。全件生成完了済みです。")
else:
    print(f"🚀 生成開始: {len(batch)}件")
    print(f"   推定時間: {len(batch) * 20 // 60}〜{len(batch) * 30 // 60}分")
    print("=" * 50)

    success_count = 0
    error_count   = 0
    start_time    = time.time()

    for i, row in enumerate(batch):
        elapsed = time.time() - start_time
        per_img = elapsed / max(i, 1)
        eta     = per_img * (len(batch) - i)

        print(f"\n[{i+1}/{len(batch)}] {row['imageId']}"
              f" (type: {row['vocabType']})"
              f" | 経過: {int(elapsed//60)}分 | 残り約: {int(eta//60)}分")

        try:
            # ── プロンプト生成
            prompt = build_prompt(row)
            seed   = get_seed(row["imageId"])

            # ── 画像生成
            generator = torch.Generator(device="cpu").manual_seed(seed)
            result = pipe(
                prompt=prompt,
                num_inference_steps=4,        # schnell は 1〜4 ステップ
                guidance_scale=0.0,           # schnell は CFG なし（0固定）
                width=IMG_WIDTH,
                height=IMG_HEIGHT,
                generator=generator,
                max_sequence_length=256,
            )
            image = result.images[0]

            # ── Drive にアップロード
            filename = row["imageId"] + ".png"
            url = upload_to_drive(image, filename)

            # ── スプレッドシート更新
            update_sheet_row(row["rowIndex"], "generated", url)

            print(f"  ✅ 完了: {url[:60]}...")
            success_count += 1

        except Exception as e:
            print(f"  ❌ エラー: {e}")
            update_sheet_row(row["rowIndex"], "failed")
            error_count += 1

        # メモリ解放
        if i % 50 == 0 and i > 0:
            import gc as python_gc
            python_gc.collect()
            torch.cuda.empty_cache()

    total_time = int(time.time() - start_time)
    print("\n" + "=" * 50)
    print(f"✅ バッチ完了")
    print(f"   成功: {success_count} / エラー: {error_count}")
    print(f"   処理時間: {total_time//60}分{total_time%60}秒")
    remaining = len(all_pending) - len(batch)
    if remaining > 0:
        print(f"   残り: {remaining}件 → Cell 4を再実行してからCell 9を再実行")
    else:
        print(f"   🎉 全件完了！GASで syncAll() を実行してください")
```

---

### Cell 10｜エラー件数確認（オプション）

```python
# ============================================================
# Cell 10: 失敗件数確認 + 再試行（オプション）
# ============================================================

def get_failed_rows():
    sh       = gc.open_by_key(SPREADSHEET_ID)
    ws       = sh.worksheet(VOCAB_SHEET_NAME)
    all_data = ws.get_all_values()
    headers  = all_data[0]
    col      = {h: i for i, h in enumerate(headers)}

    failed = []
    for i, row in enumerate(all_data[1:], start=2):
        if len(row) > col.get("imageStatus", 7):
            if row[col["imageStatus"]].strip() == "failed":
                word = row[col.get("word", 0)].strip()
                image_id = row[col.get("imageId", 6)].strip() or f"word_{word}"
                failed.append({
                    "rowIndex":  i,
                    "word":      word,
                    "en":        row[col.get("en", 2)].strip(),
                    "vocabType": row[col.get("vocab_type", 5)].strip(),
                    "imageId":   image_id,
                })
    return failed

# 失敗件数を確認
failed_rows = get_failed_rows()
print(f"failed件数: {len(failed_rows)}")
for r in failed_rows[:5]:  # 最初の5件を表示
    print(f"  - {r['imageId']} ({r['vocabType']})")

# 再試行する場合：以下のコメントを外して実行
# batch = failed_rows
# （Cell 9 のコードを再実行）
```

---

## STEP 4：GAS — syncAll() でレジストリ反映

Kaggle での生成が完了したら、GASで以下を実行する。

```
1. syncRegistries.gs の syncAll() を手動実行
   → master_image_registry.json が更新される

2. ローカルで build-embedded-data.py を実行
   → 教材HTMLに新しい画像URLが反映される
```

---

## 運用フロー（今後の追加生成）

```
新語彙を追加したとき
  ↓
extractFromGoiList.gs または importFromLessonJson.gs
  → imageStatus が「pending」で登録される
  ↓
Kaggle Notebook の Cell 4 で pending 件数を確認
  ↓
Cell 9 を実行（追加分だけ生成）
  ↓
GAS: syncAll() → build-embedded-data.py
```

---

## 注意事項

| 項目 | 内容 |
|---|---|
| Kaggle GPU上限 | 週30時間（T4 x2）。1枚20秒なら1セッション9時間で約1,600枚。 |
| セッション切断対策 | 50件ごとにメモリ解放、Cell 4 再実行で pending の残りから再開できる。 |
| LoRAライセンス | `renderartist/simplevectorflux` は Apache 2.0。辞書サイト商用利用◎ |
| FLUX schnellライセンス | Apache 2.0。商用利用・改変・再配布すべて自由。 |
| シードの一貫性 | imageId のMD5から決定的に計算されるため、再生成しても同じ構図になる。 |
| スタイル統一の保証 | 同じモデル + LoRA + プロンプトテンプレートを使う限り、N5〜N1で画風が揃う。 |

---

## クレジット表記（辞書サイト掲載用）

```
Images generated with FLUX.1 [schnell] by Black Forest Labs (Apache 2.0)
Vector style: simplevectorflux LoRA by renderartist (Apache 2.0)
```
