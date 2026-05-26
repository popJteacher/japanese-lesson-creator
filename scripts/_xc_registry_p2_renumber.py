"""
X-c master_image_registry.json renumber (2026-05-26)

旧 p3 (ex_L01_011..015) を ex_L01_014..018 に shift し、
旧位置 (ex_L01_011..013) に新 p2-6/2-7/2-8 entry を作成する。

操作:
  1. ex_L01_011 → ex_L01_014 (rename + patternId/sentence は lesson_01.json 新 3-1 に合わせる: タノムさんは東西病院の医者です。)
  2. ex_L01_012 → ex_L01_015 (新 3-2: 鈴木さんは東西学校の先生です。)
  3. ex_L01_013 → ex_L01_016 (新 3-3: キムさんは東西銀行の会社員です。)
  4. ex_L01_014 → ex_L01_017 (新 3-4: リンさんは東西大学の学生です。 アンカー維持)
  5. ex_L01_015 → ex_L01_018 (新 3-5: キムさんは東西デパートの会社員です。)
  6. 新規 ex_L01_011 = p2 新 2-6 (はい、先生です。／いいえ、先生じゃありません。)
  7. 新規 ex_L01_012 = p2 新 2-7 (韓国人ですか。)
  8. 新規 ex_L01_013 = p2 新 2-8 (はい、韓国人です。／いいえ、韓国人じゃありません。)
  9. ex_L01_008 / ex_L01_009 / ex_L01_010 の sentence は p2 新 2-3/2-4/2-5 に合わせて update
"""

import json
import copy

PATH = "data/master_image_registry.json"
with open(PATH, "r", encoding="utf-8") as f:
    reg = json.load(f)

entries = reg["entries"] if "entries" in reg else reg
is_wrapped = "entries" in reg


def build_pending_example_entry(image_id: str, pattern_id: str, sentence: str, sentence_en: str, slot: str):
    """新規 example_images entry を作る (pending status)"""
    return {
        "type": "example_images",
        "lesson": 1,
        "patternId": pattern_id,
        "sentence": sentence,
        "sentenceEn": sentence_en,
        "slot": slot,
        "status": "pending",
        "images": [
            {
                "imageId": f"{image_id}_img",
                "filename": f"{image_id}.png",
                "imageUrl": None,
                "promptRef": f"image_prompts_lesson1_v7.json#{image_id}",
                "generatedAt": None,
                "regenerate": False,
                "pendedReason": "v2.12-new-separation",
                "pendedAt": "2026-05-26",
            }
        ],
    }


# ---------- Phase 1: rename p3 entries (011..015 → 014..018) ----------
# 順序大事: 014..018 が空いている前提で 015 → 018 から逆順に進めると安全。
# ただし 014 が空いていない場合(014 が現存)、collision する。
# 安全策: 一旦 backup dict に旧 entry を退避し、entries から削除した後で新 key に書き戻す。

old_p3_backup = {}
for old_id in ["ex_L01_011", "ex_L01_012", "ex_L01_013", "ex_L01_014", "ex_L01_015"]:
    if old_id in entries:
        old_p3_backup[old_id] = copy.deepcopy(entries[old_id])
        del entries[old_id]

# Apply rename to backup contents (update inner imageId / filename / promptRef references)
rename_map = {
    "ex_L01_011": "ex_L01_014",
    "ex_L01_012": "ex_L01_015",
    "ex_L01_013": "ex_L01_016",
    "ex_L01_014": "ex_L01_017",
    "ex_L01_015": "ex_L01_018",
}
# lesson_01 v2.12 の新 p3 sentence 対応 (旧 sentence と一致するので update 不要だが念のため再設定)
new_p3_sentences = {
    "ex_L01_014": ("p3", "タノムさんは東西病院の医者です。", "Tanom-san is a doctor at Tozai Hospital.", "文型③の例文 (3-1)"),
    "ex_L01_015": ("p3", "鈴木さんは東西学校の先生です。", "Suzuki-san is a teacher at Tozai School.", "文型③の例文 (3-2)"),
    "ex_L01_016": ("p3", "キムさんは東西銀行の会社員です。", "Kim-san is an employee at Tozai Bank.", "文型③の例文 (3-3)"),
    "ex_L01_017": ("p3", "リンさんは東西大学の学生です。", "Lin-san is a student at Tozai University.", "文型③の例文 (3-4 アンカー)"),
    "ex_L01_018": ("p3", "キムさんは東西デパートの会社員です。", "Kim-san is an employee at Tozai Department Store.", "文型③の例文 (3-5)"),
}

for old_id, new_id in rename_map.items():
    if old_id not in old_p3_backup:
        print(f"[skip] {old_id} not in backup")
        continue
    e = old_p3_backup[old_id]
    # Inner image entry rename
    for img in e.get("images", []):
        img["imageId"] = img["imageId"].replace(old_id, new_id)
        img["filename"] = img["filename"].replace(old_id, new_id)
        if isinstance(img.get("promptRef"), str):
            img["promptRef"] = img["promptRef"].replace(old_id, new_id)
    # Re-affirm sentence/patternId/slot (これらは元々一致しているが、idempotent)
    pid, s_ja, s_en, slot = new_p3_sentences[new_id]
    e["patternId"] = pid
    e["sentence"] = s_ja
    e["sentenceEn"] = s_en
    e["slot"] = slot
    entries[new_id] = e
    print(f"[rename] {old_id} → {new_id}")

# ---------- Phase 2: p2 expansion (新規 011/012/013 作成 + 既存 006-010 sentence 整合) ----------

# 既存 006/007 はそのまま (sentence 一致)
# 008 (旧 2-1) → 新 2-3 (だれですか。)
# 009 (旧 2-5 韓国Q+A) → 新 2-4 (キムさんです。) ※注: imageRole も vocab_person に
# 010 (旧 2-4 先生Q+A) → 新 2-5 (先生ですか。)
# 011 (新規) → 新 2-6 (はい、先生です/いいえ、先生じゃありません)
# 012 (新規) → 新 2-7 (韓国人ですか。)
# 013 (新規) → 新 2-8 (はい、韓国人です/いいえ、韓国人じゃありません)

p2_updates = {
    "ex_L01_006": ("p2", "リンさんですか。", "Is it Lin-san?", "文型②の例文 (2-1 アンカー)"),
    "ex_L01_007": ("p2", "はい、リンさんです。／いいえ、リンさんじゃありません。", "Yes, it's Lin-san. / No, it's not Lin-san.", "文型②の例文 (2-2)"),
    "ex_L01_008": ("p2", "だれですか。", "Who is it?", "文型②の例文 (2-3 Q 単独)"),
    "ex_L01_009": ("p2", "キムさんです。", "It's Kim-san.", "文型②の例文 (2-4 A 単独)"),
    "ex_L01_010": ("p2", "先生ですか。", "Are you a teacher?", "文型②の例文 (2-5 Q 単独)"),
}

for image_id, (pid, s_ja, s_en, slot) in p2_updates.items():
    if image_id in entries:
        e = entries[image_id]
        e["patternId"] = pid
        e["sentence"] = s_ja
        e["sentenceEn"] = s_en
        e["slot"] = slot
        # status は pending 維持 (再生成対象)
        # images[].imageUrl は null 維持
        print(f"[p2 update] {image_id} sentence: {s_ja}")
    else:
        print(f"[warn] {image_id} not in entries (creating fresh)")
        entries[image_id] = build_pending_example_entry(image_id, pid, s_ja, s_en, slot)

# 新規 entries
new_p2_entries = {
    "ex_L01_011": ("p2", "はい、先生です。／いいえ、先生じゃありません。", "Yes, I am a teacher. / No, I am not a teacher.", "文型②の例文 (2-6 A セット)"),
    "ex_L01_012": ("p2", "韓国人ですか。", "Are you Korean?", "文型②の例文 (2-7 Q 単独)"),
    "ex_L01_013": ("p2", "はい、韓国人です。／いいえ、韓国人じゃありません。", "Yes, I am Korean. / No, I am not Korean.", "文型②の例文 (2-8 A セット)"),
}
for image_id, (pid, s_ja, s_en, slot) in new_p2_entries.items():
    entries[image_id] = build_pending_example_entry(image_id, pid, s_ja, s_en, slot)
    print(f"[p2 new] {image_id}: {s_ja}")

# ---------- Phase 3: p1 entries の sentence 一致確認 (sceneCharacters は registry には保存しない設計) ----------
p1_sentences = {
    "ex_L01_001": "鈴木さんは先生です。",
    "ex_L01_002": "リンさんは大学生です。",
    "ex_L01_003": "キムさんは会社員です。",
    "ex_L01_004": "鈴木さんは日本人です。",
    "ex_L01_005": "リンさんは中国人です。",
}
for image_id, s_ja in p1_sentences.items():
    if image_id in entries and entries[image_id].get("sentence") != s_ja:
        print(f"[p1 mismatch] {image_id}: registry={entries[image_id].get('sentence')!r} vs lesson={s_ja!r}")

# ---------- Phase 4: _meta totalEntries update ----------
total = len(entries)
if "_meta" in reg:
    reg["_meta"]["totalEntries"] = total
elif "_meta" in entries:
    entries["_meta"]["totalEntries"] = total
print(f"[_meta] totalEntries = {total}")

# ---------- write ----------
with open(PATH, "w", encoding="utf-8") as f:
    json.dump(reg, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("done.")
