"""
Belton Technology Group - Industrial AI Copilot (v4.1 High-Precision Balanced Trainer)
"""
import os
import sys
import json
import re
import math
import sqlite3
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

np.random.seed(42)
torch.manual_seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
PUBLIC_MODELS_DIR = os.path.join(BASE_DIR, "public", "models")
DB_PATH = os.path.join(BASE_DIR, "ai", "data", "belton_scada.db")

db_stats = {
    "total_telemetry": 54050,
    "active_lot": "LOT-EPX-2026-09B",
    "epoxy_name": "Nagase ChemteX Low-Outgas Epoxy",
    "viscosity": 8500.0,
    "pot_life_min": 240,
    "total_machines": 50,
    "active_machines": 47,
    "watchlist_machines": 3,
    "yield_rate": 99.26
}

WATCHLIST_DIAGNOSTICS = {
    14: {
        "tag": "ACA-DISP-14",
        "level": "เฝ้าระวัง (Watchlist)",
        "symptom": "อุณหภูมิ Pre-heat เริ่มแกว่งที่ 68.2 °C และอายุกาวในหลอดสะสม 185 นาที ส่งผลให้ค่าความหนืดเริ่มขยับขึ้นแตะ 8,620 mPa·s",
        "action": "ระบบ AI กำลังชดเชยแรงดันลมไดนามิกให้อยู่ แนะนำเตรียมเปลี่ยนหลอดกาวใหม่ก่อนครบ 240 นาที"
    },
    38: {
        "tag": "ACA-DISP-38",
        "level": "เฝ้าระวัง (Watchlist)",
        "symptom": "แรงดันลมจ่ายกาวเริ่มสวิงตกเหลือ 208.5 kPa (สเปกปกติ 212.4 kPa) และแนวขอบกาว (Fillet width) บางลงเล็กน้อย",
        "action": "กำลังมอนิเตอร์ระดับ Micro-void แนะนำให้ Maintenance ตรวจเช็กท่อลม CDA และวาล์วปรับแรงดัน"
    },
    27: {
        "tag": "ACA-DISP-27",
        "level": "วิกฤต (Critical Hold / ซ่อมบำรุง)",
        "symptom": "ค่าการสึกหรอของเข็ม (Needle Wear Index) สูงวิกฤตถึง 0.79 (>75%) ทำให้หัวเข็มตันเรื้อรัง ปริมาณกาวขาด (Severe Underfill) ต่ำกว่า 12.5 mg ติดต่อกัน",
        "action": "ระบบตัด Safety Interlock หยุดจ่ายชิ้นงานอัตโนมัติ ต้องเปลี่ยนหัวเข็ม 32G Ultra-Micro Nozzle หลอดใหม่ทันที"
    }
}

THAI_WORDS_LEXICON = [
    "บอกมาว่า", "บอกมา", "บอกหน่อย", "ขอข้อมูล", "อธิบาย", "มีกี่ขั้นตอน", "มีอะไรบ้าง", "ขั้นตอน", "กระบวนการ",
    "ตอนนี้", "ตอน", "นี้", "มี", "เครื่อง", "ที่", "อาการ", "ดี", "ปกติ", "กี่", "กี่เครื่อง", "กี่ตัว", "ตัว",
    "พัง", "เสีย", "ซ่อม", "ซ่อมบำรุง", "บำรุง", "เตือน", "แดง", "ส้ม", "เหลือง", "เขียว", "สถานะ", "ภาพรวม",
    "สุขภาพ", "สภาพ", "ปัญหา", "เป็นไง", "เป็นอะไร", "ทำไม", "ทำไมถึง", "สาเหตุ", "เกิดจาก", "อาการดี",
    "เฝ้าระวัง", "วิกฤต", "ความพร้อม", "พร้อมใช้", "หยุด", "หยุดทำงาน",
    "ยอด", "ผลิต", "ยอดผลิต", "ชิ้น", "ช็อต", "ช็อตสะสม", "จำนวน", "เท่าไร", "เท่าไหร่", "วันนี้", "ทั้งหมด",
    "สรุป", "รายงาน", "yield", "เปอรเซ็นต์", "เปอร์เซ็นต์", "อัตรา", "ของเสีย", "ชิ้นงาน", "ผ่าน", "ตก",
    "พา", "พาไป", "วาร์ป", "เดิน", "ไป", "ดู", "ขอดู", "ซูม", "หมุน", "กล้อง", "teleport", "navigate",
    "jump", "look", "show", "goto", "view",
    "สเปก", "ความดัน", "แรงดัน", "ลม", "kpa", "อุณหภูมิ", "องศา", "preheat", "น้ำหนัก", "กาว", "หยอด",
    "หยอดกาว", "mg", "มิลลิกรัม", "เข็ม", "ตัน", "เข็มตัน", "nozzle", "32g", "fillet", "อีพ็อกซี่", "epoxy",
    "หลอด", "ฮูด", "คลีนรูม", "cleanroom", "underfill", "void", "ฟอง", "ฟองอากาศ",
    "lot", "batch", "ล็อต", "แบตช์", "วัตถุดิบ", "หมดอายุ", "ความหนืด", "viscosity", "potlife", "nagase",
    "chemtex", "สารระเหย", "outgas", "outgassing", "scada", "database", "ฐานข้อมูล", "ประวัติ", "ย้อนหลัง",
    "coil", "winding", "คอยล์", "คอย", "ขดลวด", "พันลวด", "ทองแดง", "ฉนวน", "ลอกฉนวน", "ชุบกาว", "353nd",
    "dcr", "ความต้านทาน", "ท่อ", "สวมท่อ", "อบกาว", "180", "180องศา", "อบไล่แก๊ส", "อบ", "เตาอบ",
    "fcof", "flip", "chip", "flex", "fpc", "smt", "reflow", "solder", "ตะกั่ว", "บั๊มป์", "bump",
    "die", "placement", "preamp", "aoi", "xray", "x-ray", "qmax", "snap", "cure", "เตาหลอม",
    "apfa", "arm", "pivot", "ลูกปืน", "แบริ่ง", "bearing", "bending", "ดัด", "สายแพร", "ดัดสายแพร",
    "บัดกรี", "hookup", "bracket", "dcm", "t-ring", "แหวน", "ทอร์ก", "torque", "resonance", "tweaking",
    "สวัสดี", "หวัดดี", "hello", "hi", "hey", "ใคร", "ช่วย", "ทำอะไรได้", "แนะนำตัว", "บอท", "ai", "copilot",
    "ข้าว", "กินข้าว", "อาหาร", "ทำอาหาร", "อร่อย", "เพลง", "เปิดเพลง", "ร้องเพลง", "หนัง",
    "อากาศ", "ฝน", "ฝนตก", "พยากรณ์", "เกม", "เล่นเกม", "หวย", "เลขเด็ด", "กลอน", "ตลก", "มุก",
    "แฟน", "จีบ", "รัก", "ภาษา", "แปลภาษา", "แปล", "เที่ยว", "บิตคอยน์", "หุ้น",
    "การบ้าน", "บอล", "แมนยู", "ลิเวอร์พูล", "การเมือง", "นายก", "อายุ", "เท่าไหร่", "เบอร์",
    "weather", "song", "joke", "music", "cook", "dance", "game", "bitcoin", "football"
]
THAI_WORDS_LEXICON = sorted(list(set([w.lower() for w in THAI_WORDS_LEXICON])), key=lambda x: -len(x))

def max_match_tokenize(text):
    text = text.lower().strip()
    tokens = []
    i = 0
    n = len(text)
    while i < n:
        num_m = re.match(r'^\d+(\.\d+)?', text[i:])
        if num_m:
            tokens.append(num_m.group(0))
            i += len(num_m.group(0))
            continue
        eng_m = re.match(r'^[a-z]+', text[i:])
        if eng_m:
            w = eng_m.group(0)
            tokens.append(w)
            i += len(w)
            continue
        matched = False
        for word in THAI_WORDS_LEXICON:
            if text.startswith(word, i):
                tokens.append(word)
                i += len(word)
                matched = True
                break
        if not matched:
            ch = text[i]
            if not ch.isspace() and ch not in [',', '.', '!', '?', ':', ';', '"', "'", '-', '_', '(', ')']:
                tokens.append(ch)
            i += 1
    return tokens

VOCAB = ["<PAD>"] + THAI_WORDS_LEXICON + [str(num) for num in range(1, 51)]
WORD2IDX = {w: i for i, w in enumerate(VOCAB)}

def text_to_bow(text):
    tokens = max_match_tokenize(text)
    vec = np.zeros(len(VOCAB), dtype=np.float32)
    for t in tokens:
        if t in WORD2IDX:
            vec[WORD2IDX[t]] += 1.0
    nums = re.findall(r'\d+', text)
    target_num = 0.0
    if nums:
        val = float(nums[0])
        if 1 <= val <= 50:
            target_num = val
    return vec, target_num

INTENTS = [
    "ASK_MACHINE_STATUS", "ASK_DEFECT_CAUSE", "ASK_PRODUCTION_STATS", "NAVIGATE_CAMERA",
    "ASK_BELTON_SPEC", "ASK_FACTORY_HEALTH", "ASK_COIL_WINDING", "ASK_FCOF_PROCESS",
    "ASK_APFA_PROCESS", "ASK_DATABASE_BATCH", "GENERAL_GREETING", "UNKNOWN_OUT_OF_DOMAIN"
]

dataset_samples = []
def expand(patterns, intent_id, target_num=0):
    for p in patterns:
        dataset_samples.append((p, intent_id, target_num))

# High-frequency balanced classes
expand([
    "อาการเครื่องที่ควรเฝ้าระวังละมีกี่เครื่อง", "อาการเครื่องที่ควรเฝ้าระวังมีกี่เครื่อง",
    "เครื่องที่เฝ้าระวังมีอาการยังไงบ้าง", "อาการของเครื่องที่ต้องเฝ้าระวังคืออะไร",
    "มีเครื่องที่ต้องเฝ้าระวังกี่เครื่อง และมีอาการอะไรบ้าง", "เครื่องเฝ้าระวังเป็นอะไร",
    "อาการเครื่องเฝ้าระวัง", "มีกี่เครื่องที่ต้องเฝ้าระวัง", "เครื่องไหนต้องเฝ้าระวังบ้าง",
    "เครื่องที่ต้องเฝ้าระวังมีอาการอะไร", "อาการเครื่อง 14 กับ 38 เป็นยังไง",
    "เครื่องเฝ้าระวังมีกี่ตัว", "เครื่องที่มีปัญหาและเฝ้าระวังมีกี่เครื่อง",
    "ตอนนี้มีเครื่องที่อาการดี กี่เครื่อง", "มีเครื่องที่อาการดีกี่เครื่อง",
    "มีเครื่องปกติกี่เครื่อง", "มีเครื่องพังกี่เครื่อง", "เครื่องไหนพังบ้าง",
    "สุขภาพเครื่องจักรภาพรวมเป็นยังไง", "how many machines on watchlist",
    "what are the symptoms of watchlist machines", "how many good and healthy machines in line",
    "รายงานสุขภาพเครื่องจักร", "สภาพเครื่องจักร 50 เครื่องเป็นยังไง"
], 5, 0)
for pfx in ["ขอทราบ ", "รายงาน ", "สรุป ", "ตรวจดู ", "อยากรู้ว่า ", "บอกหน่อยว่า "]:
    for term in ["อาการของเครื่องที่ต้องเฝ้าระวัง", "เครื่องที่ควรเฝ้าระวัง", "เครื่องที่อาการดี", "เครื่องที่มีปัญหา"]:
        for sfx in [" มีกี่เครื่อง", " มีอะไรบ้าง", " ตอนนี้เป็นยังไง", " กี่ตัว"]:
            dataset_samples.append((f"{pfx}{term}{sfx}", 5, 0))

expand([
    "บอกมาว่าขั้นตอนคอย มีกี่ขั้นตอน มีอะไรบ้าง", "บอกมาว่าขั้นตอนคอยล์ มีกี่ขั้นตอน มีอะไรบ้าง",
    "ขั้นตอนคอยมีกี่ขั้นตอนมีอะไรบ้าง", "ขั้นตอนคอยล์มีกี่ขั้นตอนมีอะไรบ้าง",
    "คอยล์มีกี่ขั้นตอน", "ขั้นตอนคอยล์ทั้งหมดมีอะไรบ้าง", "coil winding 14 ขั้นตอนมีอะไรบ้าง",
    "ขอขั้นตอน coil winding ทั้งหมด", "กระบวนการผลิตขดลวด coil winding มีขั้นตอนอะไรบ้าง",
    "coil winding อบกี่องศา", "out gassing อบที่อุณหภูมิเท่าไหร่", "ทำไมต้องอบไล่แก๊สคอยล์",
    "กาวชุบเคลือบคอยล์ใช้เบอร์อะไร", "dip coating ใช้กาว epo-tec-353nd ใช่ไหม",
    "การลอกฉนวนลวดทองแดงระวังอะไร", "lead wire stripping ทำยังไงไม่ให้ลวดคอดกิ่ว",
    "การวัดค่าความต้านทาน dcr ตรวจอะไรในคอยล์", "what are the 14 steps of coil winding"
], 6, 0)
for pfx in ["บอกมาว่า ", "ช่วยอธิบาย ", "สรุป ", "ขอข้อมูล ", ""]:
    for term in ["ขั้นตอนคอย", "ขั้นตอนคอยล์", "กระบวนการ coil winding", "การพันลวดคอยล์", "14 ขั้นตอน coil winding"]:
        for sfx in [" มีกี่ขั้นตอน", " มีอะไรบ้าง", " ทั้งหมดคืออะไร", " ทำยังไงบ้าง", " ให้ฟังหน่อย"]:
            dataset_samples.append((f"{pfx}{term}{sfx}", 6, 0))

expand([
    "fcof มีขั้นตอนอะไรบ้าง", "flip chip on flex มีกี่ขั้นตอน", "fcof 14 ขั้นตอนมีอะไรบ้าง",
    "บอกขั้นตอน fcof ทั้งหมดให้ฟังหน่อย", "การพิมพ์ตะกั่ว solder paste printing ใน fcof คุมอะไร",
    "die placement ใน fcof คือขั้นตอนอะไร", "คว่ำชิป pre-amp ลงบน flex ทำยังไง",
    "reflow soldering ใน fcof คุมอุณหภูมิเท่าไหร่", "underfill dispensing ใน fcof คืออะไร",
    "กาว underfill ไหลซึมเข้าใต้ชิปด้วยแรง capillary action ใช่ไหม", "snap cure อบกาว underfill ทำไม",
    "x-ray inspection ตรวจหา void ในบอลตะกั่วของ fcof ใช่ไหม", "qmax test ตรวจสอบสัญญาณไฟฟ้าของ fcof ยังไง",
    "what are the 14 steps of fcof", "explain flip chip on flex process"
], 7, 0)
for pfx in ["ช่วยอธิบาย ", "อยากทราบว่า ", "ขอขั้นตอน ", "บอกมาหน่อยว่า "]:
    for term in ["fcof", "flip chip on flex", "การประกอบ fcof"]:
        for sfx in [" มีกี่ขั้นตอน", " มีอะไรบ้าง", " 14 ขั้นตอนทำอะไรบ้าง"]:
            dataset_samples.append((f"{pfx}{term}{sfx}", 7, 0))

expand([
    "apfa คืออะไร", "arm pivot flex assembly มีกี่ขั้นตอน", "apfa 17 ขั้นตอนมีอะไรบ้าง",
    "บอกขั้นตอน apfa ทั้งหมดหน่อย", "bending ดัดสายแพร fpc ระวังอะไร",
    "ดัดสายแพรยังไงไม่ให้ทองแดงร้าว", "การบัดกรี soldering ground pin ใน apfa ทำยังไง",
    "การอัดตลับลูกปืน pivot install คุมแรงกด press force เท่าไหร่", "แผ่น dcm ใน apfa ติดเพื่ออะไร",
    "t-ring insertion คือขั้นตอนอะไร", "แหวนยางกันสั่น t-ring ใส่ตรงไหนของ apfa",
    "arm tweaking ตรวจสอบและดัดระนาบแขนจับยังไง", "what are the 17 steps of apfa"
], 8, 0)
for pfx in ["ขอรายละเอียด ", "บอกขั้นตอน ", "อธิบายกระบวนการ "]:
    for term in ["apfa", "arm pivot flex assembly", "การประกอบ apfa"]:
        for sfx in [" 17 ขั้นตอนมีอะไรบ้าง", " มีกี่ขั้นตอน", " ทำยังไง"]:
            dataset_samples.append((f"{pfx}{term}{sfx}", 8, 0))

expand([
    "กาว lot ล่าสุดเบอร์อะไร", "ล็อตวัตถุดิบปัจจุบันคือล็อตไหน", "กาว nagase lot ไหนกำลังใช้งาน",
    "ความหนืดของกาว batch ปัจจุบันเท่าไหร่", "viscosity ของกาวกี่ mpa.s", "อายุ pot life ของกาวได้กี่นาที",
    "batch กาวหมดอายุตอนไหน", "ขอดูข้อมูล batch วัตถุดิบใน database", "current active epoxy batch"
], 9, 0)

expand([
    "อุณหภูมิ preheat ต้องตั้งกี่องศา", "สเปกน้ำหนักกาวต้องหยอดกี่ mg", "ความดันลมมาตรฐานเท่าไร",
    "เข็มหยอดกาวใช้เบอร์อะไร", "สเปกการหยอดกาว aca มีอะไรบ้าง", "dispensing mass specification"
], 4, 0)

expand([
    "วันนี้ผลิตไปกี่ชิ้นแล้ว", "ยอดผลิตรวมตอนนี้เท่าไร", "ตอนนี้หยอดกาวไปกี่ช็อตแล้ว",
    "อัตราของเสียวันนี้เป็นยังไง", "yield วันนี้ได้กี่เปอร์เซ็นต์", "สรุปยอดการผลิตวันนี้หน่อย",
    "total production shots today", "what is the overall yield"
], 2, 0)

expand([
    "สวัสดีครับ", "สวัสดี", "หวัดดี", "hello", "hi copilot", "นายทำอะไรได้บ้าง",
    "ช่วยอะไรฉันได้บ้าง", "คุณคือใคร", "who are you"
], 10, 0)

# Intent 11: UNKNOWN_OUT_OF_DOMAIN (คำถามที่ไม่รู้จัก / นอกสายงานโรงงาน)
expand([
    "ข้าวมันไก่อร่อยไหม", "วันนี้กินข้าวกับอะไรดี", "กินข้าวหรือยัง", "ขอเพลงหน่อย", "เปิดเพลงให้ฟังหน่อย",
    "ร้องเพลงให้ฟังหน่อย", "สภาพอากาศวันนี้เป็นอย่างไร", "พรุ่งนี้ฝนตกไหม", "1+1 ได้เท่าไหร่", "บวกเลขให้หน่อย",
    "แต่งกลอนให้หน่อย", "เล่าเรื่องตลกให้ฟังหน่อย", "นายอายุเท่าไหร่", "เธอมีแฟนหรือยัง",
    "หวยงวดนี้ออกอะไร", "ราคาบิตคอยน์วันนี้เท่าไหร่", "ราคาหุ้นวันนี้เป็นยังไง", "เขียนโค้ด python ให้หน่อย",
    "สอนทำอาหารหน่อย", "ไปเที่ยวไหนดี", "เล่นเกมกันไหม", "ทำไมท้องฟ้าเป็นสีฟ้า",
    "แปลภาษาให้หน่อย", "แปลภาษาอังกฤษ", "ขอเบอร์หน่อย", "แมนยูชนะไหม", "ลิเวอร์พูลเมื่อคืนเป็นไง",
    "ใครเป็นนายก", "วันนี้วันอะไร", "พรุ่งนี้วันพระไหม", "ช่วยทำการบ้านหน่อย", "รักฉันไหม",
    "what is the weather today", "tell me a joke", "sing a song", "write code for me",
    "how to cook", "who is the president", "can you dance", "play game with me", "recommend a movie"
], 11, 0)
for pfx in ["ช่วยบอกหน่อยว่า ", "อยากรู้ว่า ", "ถามหน่อยว่า ", "คิดว่า ", ""]:
    for term in ["ข้าวมันไก่", "ผัดกะเพรา", "เพลงสากล", "หนังเข้าใหม่", "อากาศวันนี้", "ราคาบิตคอยน์", "ฟุตบอล"]:
        for sfx in [" อร่อยไหม", " เป็นยังไง", " ดีไหม", " ชอบไหม"]:
            dataset_samples.append((f"{pfx}{term}{sfx}", 11, 0))

for m in range(1, 51):
    dataset_samples.append((f"ขอข้อมูลเครื่องที่ {m}หน่อย", 0, m))
    dataset_samples.append((f"ขอข้อมูลเครื่องที่ {m}", 0, m))
    dataset_samples.append((f"ขอข้อมูลเครื่อง {m} หน่อย", 0, m))
    dataset_samples.append((f"ขอข้อมูลเครื่อง {m}", 0, m))
    dataset_samples.append((f"ข้อมูลเครื่องที่ {m}", 0, m))
    dataset_samples.append((f"ข้อมูลเครื่อง {m}", 0, m))
    dataset_samples.append((f"สถิติเครื่อง {m}", 0, m))
    dataset_samples.append((f"ประวัติเครื่อง {m}", 0, m))
    dataset_samples.append((f"ค่าเซนเซอร์เครื่อง {m}", 0, m))
    dataset_samples.append((f"สถานะเครื่อง {m} เป็นยังไงบ้าง", 0, m))
    dataset_samples.append((f"เครื่อง {m} ปกติดีไหม", 0, m))
    dataset_samples.append((f"เช็คเครื่อง {m} ให้หน่อย", 0, m))
    dataset_samples.append((f"status of machine {m}", 0, m))
    dataset_samples.append((f"data of machine {m}", 0, m))
    dataset_samples.append((f"ทำไมเครื่อง {m} ถึงพัง", 1, m))
    dataset_samples.append((f"ทำไมเครื่อง {m} ถึงขึ้นสีแดง", 1, m))
    dataset_samples.append((f"สาเหตุที่เครื่อง {m} เสียคืออะไร", 1, m))
    dataset_samples.append((f"why machine {m} broken", 1, m))
    dataset_samples.append((f"พาไปดูเครื่อง {m} หน่อย", 3, m))
    dataset_samples.append((f"วาร์ปไปเครื่อง {m}", 3, m))
    dataset_samples.append((f"เดินไปที่เครื่อง {m}", 3, m))
    dataset_samples.append((f"teleport to machine {m}", 3, m))

print(f"Total Dataset Size: {len(dataset_samples)} samples")

X_list, Y_intent_list, Y_num_list = [], [], []
for text, intent_idx, target_num in dataset_samples:
    vec, num = text_to_bow(text)
    if target_num > 0:
        num = target_num
    X_list.append(vec)
    Y_intent_list.append(intent_idx)
    Y_num_list.append(num / 50.0)

X_tensor = torch.tensor(np.array(X_list), dtype=torch.float32)
Y_intent_tensor = torch.tensor(np.array(Y_intent_list), dtype=torch.long)
Y_num_tensor = torch.tensor(np.array(Y_num_list), dtype=torch.float32).unsqueeze(1)

dataset = TensorDataset(X_tensor, Y_intent_tensor, Y_num_tensor)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True, drop_last=True)

class BeltonCopilotNN(nn.Module):
    def __init__(self, input_dim, num_intents=len(INTENTS)):
        super(BeltonCopilotNN, self).__init__()
        self.trunk = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Linear(128, 64),
            nn.ReLU()
        )
        self.intent_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, num_intents)
        )
        self.entity_head = nn.Sequential(
            nn.Linear(64, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x):
        h = self.trunk(x)
        return self.intent_head(h), self.entity_head(h)

input_dim = len(VOCAB)
model = BeltonCopilotNN(input_dim=input_dim, num_intents=len(INTENTS))

optimizer = optim.AdamW(model.parameters(), lr=0.008, weight_decay=1e-4)
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=45, eta_min=0.0002)
criterion_intent = nn.CrossEntropyLoss()
criterion_num = nn.MSELoss()

print("\n--- Training High-Precision PyTorch Model (45 Epochs) ---")
for epoch in range(1, 46):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for bx, by_intent, by_num in dataloader:
        optimizer.zero_grad()
        pred_intent, pred_num = model(bx)
        loss = criterion_intent(pred_intent, by_intent) + 0.5 * criterion_num(pred_num, by_num)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * bx.size(0)
        preds = torch.argmax(pred_intent, dim=1)
        correct += (preds == by_intent).sum().item()
        total += bx.size(0)
    scheduler.step()
    acc = (correct / total) * 100.0
    if epoch == 1 or epoch % 5 == 0 or epoch == 45:
        bar_len = 22
        filled = int(bar_len * (epoch / 45))
        bar = "█" * filled + "░" * (bar_len - filled)
        print(f"  Epoch [{epoch:02d}/45] |{bar}| Loss: {total_loss/total:.4f} | Accuracy: {acc:5.1f}% | lr: {scheduler.get_last_lr()[0]:.5f}")

print(f"\n✅ Training Finished! Final Measured Accuracy: {acc:.2f}%")

model.eval()
weights_export = {
    "metadata": {
        "model_name": "BeltonCopilotNN-v4.1-HighPrecision",
        "intents": INTENTS,
        "input_dim": input_dim,
        "training_samples": len(dataset_samples),
        "final_accuracy": round(acc, 2),
        "db_stats": db_stats,
        "watchlist_diagnostics": WATCHLIST_DIAGNOSTICS
    },
    "vocab": VOCAB,
    "thai_lexicon": THAI_WORDS_LEXICON,
    "layers": {}
}
for name, param in model.named_parameters():
    weights_export["layers"][name.replace(".", "_")] = param.detach().cpu().numpy().tolist()
for name, buf in model.named_buffers():
    weights_export["layers"][name.replace(".", "_")] = buf.detach().cpu().numpy().tolist()

public_json_path = os.path.join(PUBLIC_MODELS_DIR, "chatbot_copilot_weights.json")
models_json_path = os.path.join(MODELS_DIR, "chatbot_copilot_weights.json")
with open(public_json_path, "w", encoding="utf-8") as f:
    json.dump(weights_export, f, ensure_ascii=False)
with open(models_json_path, "w", encoding="utf-8") as f:
    json.dump(weights_export, f, ensure_ascii=False)

pt_model_path = os.path.join(MODELS_DIR, "chatbot_copilot_model.pt")
with open(pt_model_path, "wb") as f:
    torch.save({"model_state_dict": model.state_dict(), "vocab": VOCAB, "intents": INTENTS}, f)

print(f"📦 Saved Updated Weights: {public_json_path} ({os.path.getsize(public_json_path)/1024:.1f} KB)")

# Benchmark
print("\n" + "=" * 78)
print("  🔍 REAL-TIME BENCHMARK TEST")
print("=" * 78)
test_qs = [
    "อาการเครื่องที่ควรเฝ้าระวังละมีกี่เครื่อง",
    "เครื่องที่เฝ้าระวังมีอาการยังไงบ้าง",
    "บอกมาว่าขั้นตอนคอย มีกี่ขั้นตอน มีอะไรบ้าง",
    "ตอนนี้มีเครื่องที่อาการดี กี่เครื่อง",
    "fcof 14 ขั้นตอนมีอะไรบ้าง",
    "apfa 17 ขั้นตอนมีอะไรบ้าง",
    "ทำไมเครื่อง 27 ถึงพัง",
    "กาว lot ล่าสุดเบอร์อะไร",
    "ขอข้อมูลเครื่องที่ 1หน่อย",
    "ขอข้อมูลเครื่อง 27 หน่อย",
    "ข้าวมันไก่อร่อยไหม",
    "ขอเพลงเพราะๆ หน่อย",
    "1+1 ได้เท่าไหร่"
]
for q in test_qs:
    vec, _ = text_to_bow(q)
    x = torch.tensor(vec, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logits, _ = model(x)
        probs = torch.softmax(logits, dim=1)
        pred_idx = torch.argmax(probs, dim=1).item()
        conf = probs[0][pred_idx].item() * 100.0
    print(f"Q: \"{q}\" -> [{pred_idx}] {INTENTS[pred_idx]} (Confidence: {conf:.1f}%)")
