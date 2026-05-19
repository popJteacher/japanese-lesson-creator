# 引き継ぎ資料：画像生成システム移行
**バージョン：image-gen-v2.0（2026-05-17）**
**前資料：image-gen-handoff-v1.md**
**このチャットで完了した作業：STEP 0〜3（Kaggle Notebook構築・テスト生成3枚）**

---

## ⚠️ 次チャットで最初に相談すること

**画風・色がスライド／宿題のデザインと一致していない問題の解決策を検討する。**

現在の状態：
- 画像生成パイプライン自体は動作している（3枚テスト成功）
- LoRA：`Simple_Vector_Flux_v2_renderartist.safetensors`（ファイル名変更済み）
- ストレージ：Cloudinaryに変更済み（Google Drive SA quota問題のため）
- 画風が従来の `master_prompt_design_guide_v2_5.py` のスタイルと異なる

---

## 1. 完了したこと（STEP 0〜3）

| STEP | 内容 | 状態 |
|---|---|---|
| **STEP 0** | Google Service Account 作成・Kaggle Secrets 登録 | ✅ 完了 |
| **STEP 1** | GAS: `resetAllImagesToPendingForKaggle()` 実行（全件pending化） | ✅ 完了 |
| **STEP 2** | Kaggle Notebook 作成・GPU/インターネット設定 | ✅ 完了 |
| **STEP 3** | Cell 1〜9 貼り付け・テスト生成3枚 | ✅ 完了（画風問題あり） |
| **STEP 4** | GAS: `syncAll()` → `build-embedded-data.py` | ❌ 未実施（画風解決後） |

---

## 2. Kaggle Notebook の現在の構成

**URL：** `kaggle.com/code/corn1830/notebook00919e7d52/edit`

### 採用構成（確定）

| コンポーネント | 内容 |
|---|---|
| 実行環境 | Kaggle Notebooks（T4 x2 GPU） |
| ベースモデル | `black-forest-labs/FLUX.1-schnell`（Apache 2.0） |
| LoRA | `renderartist/simplevectorflux`（creativeml-openrail-m） |
| LoRAファイル名 | `Simple_Vector_Flux_v2_renderartist.safetensors`（※変更済み） |
| LoRAトリガー | `v3ct0r` |
| 画像サイズ | 512×512生成 → 1024×1024にリサイズ（VRAM節約のため） |
| ストレージ | **Cloudinary**（Google Drive SA quota問題のため変更） |
| ステップ数 | 4 |
| guidance_scale | 0.0 |

### Kaggle Secrets（登録済み）

| Secret名 | 内容 |
|---|---|
| `GOOGLE_CREDENTIALS` | Service Account JSON |
| `IMAGE_FOLDER_ID` | Drive画像フォルダID（現在未使用・Cloudinaryに変更） |
| `HF_TOKEN` | HuggingFace トークン（FLUX認証用） |
| `CLOUDINARY_CLOUD_NAME` | `dtycx8ylr` |
| `CLOUDINARY_API_KEY` | Cloudinary APIキー |
| `CLOUDINARY_API_SECRET` | Cloudinary APIシークレット |

---

## 3. トラブルシューティング記録

### 問題①：JSONDecodeError（GOOGLE_CREDENTIALS）
- **原因**：Kaggle SecretsにJSONの一部しか貼り付けられていなかった
- **解決**：JSONファイルを開いて`{`から`}`まで全部コピーして再登録

### 問題②：Google Sheets API無効
- **解決**：Google Cloud ConsoleでSheets API・Drive APIを有効化
  - `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=649240124339`
  - `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=649240124339`

### 問題③：ImportError（FLAX_WEIGHTS_NAME）
- **原因**：`diffusers==0.32.2` と新しい `transformers` の非互換
- **解決**：Cell 1を以下に変更
  ```
  diffusers>=0.33.0
  transformers==4.51.3  ← バージョン固定が必須
  ```

### 問題④：GatedRepoError（FLUX.1-schnell）
- **原因**：HuggingFace認証なし・利用規約未同意
- **解決**：
  1. `https://huggingface.co/black-forest-labs/FLUX.1-schnell` で利用規約に同意
  2. HuggingFaceトークン取得 → Kaggle Secretsに `HF_TOKEN` 登録
  3. Cell 5に `login(token=hf_token)` 追加

### 問題⑤：LoRA EntryNotFoundError
- **原因**：LoRAファイル名が変更されていた
- **解決**：`simplevectorflux.safetensors` → `Simple_Vector_Flux_v2_renderartist.safetensors`
- **確認URL**：`https://huggingface.co/renderartist/simplevectorflux/tree/main`
- **ライセンス変更注意**：Apache 2.0 → `creativeml-openrail-m`（商用利用時要確認）

### 問題⑥：CUDA out of memory
- **解決**：Cell 5とCell 9を変更
  - `enable_sequential_cpu_offload()`（より積極的なメモリ節約）
  - `vae.enable_slicing()` / `vae.enable_tiling()`
  - 生成サイズを512×512に縮小 → 1024×1024にリサイズ

### 問題⑦：Google Drive storageQuotaExceeded
- **原因**：サービスアカウントは個人Google Driveへのアップロード不可（quota=0）
- **解決**：Cloudinaryの無料プランに変更
  - Cloud name：`dtycx8ylr`
  - Cell 7を差し替え・Cell 1に `cloudinary` パッケージ追加

---

## 4. 現在のCell構成（Cell 1〜9）

### Cell 1：インストール
```python
!pip install -q \
  "diffusers>=0.33.0" \
  "transformers==4.51.3" \
  accelerate peft huggingface_hub \
  google-auth google-auth-oauthlib \
  google-api-python-client gspread \
  sentencepiece protobuf \
  cloudinary
```

### Cell 2：設定
```python
MAX_BATCH = 3  # ← テスト中。本番は500に戻す
LORA_SCALE = 0.85
IMG_WIDTH = IMG_HEIGHT = 512  # ← メモリ節約のため512
```

### Cell 3：Google API認証（スプレッドシート読み書き用）

### Cell 4：スプレッドシートからpending行を取得

### Cell 5：FLUX.1-schnell + LoRA ロード
- `enable_sequential_cpu_offload()` を使用
- HuggingFace認証あり

### Cell 6：プロンプトビルダー（完全版）
- `master_prompt_design_guide_v2_5.py` 準拠
- OBJECT_SIGNATURES・ABSTRACT_METAPHORS辞書を含む完全版

### Cell 7：Cloudinaryアップロード関数

### Cell 8：スプレッドシート更新関数

### Cell 9：メイン生成ループ（512生成→1024リサイズ）

---

## 5. 未解決問題（次チャットで相談）

### 🔴 画風・色がデザインと一致しない

**症状**：生成された画像の画風・色が従来の教材デザイン（スライド・宿題HTML）と一致しない

**考えられる原因**：
1. LoRAのバージョンが変わった（v1 → v2）
2. FLUX.1-schnellとこのLoRAの相性
3. `v3ct0r` トリガーワードの効き方が変わった
4. 512×512生成→リサイズによる画質の変化
5. プロンプトの色指定（#カラーコード）がFLUXで正しく機能していない

**次チャットで検討すべき選択肢**：
- LoRAのスケール（LORA_SCALE）を調整（現在0.85）
- 別のLoRAを探す（FLUX対応・Apache 2.0・フラットベクター系）
- プロンプトの書き方を変える
- 1024×1024で直接生成する（メモリ問題の別解を探す）
- 別のベースモデルを検討

---

## 6. スプレッドシートの現在の状態

**SPREADSHEET_ID：** `1l-gH5MPfRyqNyuzj9x3c2xQoQeji60yF7mKc7_50Nlk`

| imageStatus | 件数（推定） | 内容 |
|---|---|---|
| `pending` | 約375件 | Kaggle移行リセット後・全件未生成 |
| `generated` | 3件 | テスト生成済み（画風問題あり） |
| `failed` | 0件 | — |

---

## 7. 次チャットへのアップロード必須ファイル

| ファイル | 必須/任意 |
|---|---|
| **この資料**（image_gen_handoff_v2.md） | **必須** |
| **image_generation_system_guide.md** | **必須** |
| 生成されたテスト画像（スクリーンショット等） | 推奨（画風比較のため） |

---

## 8. 次チャットの開始コマンド例

```
image_gen_handoff_v2.md と image_generation_system_guide.md をアップロードしました。

【状況】
- Kaggle + FLUX.1 schnell + simplevectorflux LoRA でテスト生成3枚成功
- ただし画風・色が教材デザイン（スライド・宿題HTML）と一致しない
- ストレージはCloudinaryに変更済み（Google Drive SA quota問題のため）

【相談したいこと】
画風を教材デザインに合わせるにはどうすればよいか、
プロンプト調整・LoRA変更・その他の選択肢を一緒に検討してください。
```

---

## 9. クレジット表記（辞書サイト掲載用・要ライセンス再確認）

```
Images generated with FLUX.1 [schnell] by Black Forest Labs (Apache 2.0)
Vector style: simplevectorflux LoRA v2 by renderartist (creativeml-openrail-m)
```

---

*作成日：2026-05-17*
*スコープ：画像生成システム移行のみ（シラバス・音声・lesson_02等は handoff_v4_0.md 参照）*
