# BELTON — PROJECT HANDOVER & AI CONTEXT CONTINUITY
**Date Updated:** September 16, 2026  
**Conversation ID:** `34f9f303-44c4-4328-998e-ce6d834be561`  
**Project Directory:** `c:\Users\BOAT\Videos\เลขา\belton_live_preview`  
**Git Repository:** `https://github.com/boattheboss-art/BeltonPreview.git`  
**Render Hosting:** `https://beltonpreview.onrender.com`  

---

## 📌 สรุปบริบทสำหรับ AI ที่เข้ามารับช่วงต่อ (Context for AI)

> **คำสั่งสำหรับ AI:**  
> โปรเจกต์นี้คือ **BELTON Live Preview** เป็นเว็บแอปพลิเคชัน Node.js / Express แสดงผล 3D Interactive, Industrial Digital Twin, SCADA Fleet Telemetry, และวิศวกร AI Copilot (Local GPU)  
> ทุกครั้งที่เข้ามาทำงานต่อ **ต้องรักษาวินัยความสะอาดของไฟล์ตามกฎเหล็กด้านล่างนี้อย่างเคร่งครัด 100%**

---

## ⚠️ กฎเหล็กการพัฒนาและรักษาความเป็นระเบียบของไฟล์ (Permanent Rule: Zero-Junk Discipline)

1. **ห้ามสร้างไฟล์ขยะทิ้งไว้ใน Root Directory เด็ดขาด (Zero Junk in Root)**:
   - ห้ามเซฟภาพสกรีนช็อต `.png`, ภาพเทสต์มุมกล้อง, ไฟล์ข้อความสุ่ม (`test.txt`, `temp.txt`), หรือ log files ใน Root
   - หากจำเป็นต้องสร้างไฟล์ทดสอบเพื่อ Verify ผล ให้ทดสอบเสร็จแล้ว **ลบทิ้งทันที** ภายใน Turn เดียวกัน
2. **การจัดวางไฟล์ให้อยู่ในโฟลเดอร์ที่ถูกต้องเสมอ (Strict Modular Placement)**:
   - ไฟล์ Backend Logic ➔ `src/` (แยกย่อยตาม `src/db/`, `src/knowledge/`, `src/tools/`)
   - ไฟล์ข้อมูล Database / JSON Master ➔ `data/`
   - สคริปต์สกัดข้อมูลหรือ Automation ➔ `scripts/`
   - ไฟล์หน้าเว็บและ Asset แสดงผล ➔ `public/` (แยกย่อย `public/js/`, `public/models/`, `public/assets/`, `public/frames/`)
   - สคริปต์เทรนโมเดล AI ออฟไลน์ ➔ `ai/`
3. **ตรวจสอบความสะอาดก่อนส่งมอบงานทุกครั้ง (Self-Auditing before Completion)**:
   - ก่อนสรุปงานให้ผู้ใช้ ตรวจสอบ `git status` เสมอ ต้องไม่มีไฟล์ขยะตกค้าง และโครงสร้างโฟลเดอร์ต้องพร้อมสำหรับนำไป Deploy ทันที

---

## 🏗️ โครงสร้างหน้าเว็บและระบบหลัก (5 Core Routes)

### 1. หน้าแรก (Home / Landing Page)
* **Route:** `/` ➔ ไฟล์: `public/index.html`, `public/styles.css`, `public/js/main.js`, `public/js/robot3d.js`
* **ธีม:** ขาว/เงิน Monochrome หรูหรา สะอาดตา (Spline 3D Scene + หุ่นยนต์ 3D + Bento Grid)
* **ระบบ Access Terminal (Login Modal):**
  * **Username:** `admin` | **Password:** `60632`

### 2. หน้า 3D Model Explorer
* **Route:** `/explorer` ➔ ไฟล์: `public/explorer.html`
* **ระบบ:** Three.js HDD Actuator Coil Model แบบแยกชิ้นส่วนได้ (Explode View) พร้อมระบบหมุนดูรอบทิศทาง 360 องศา

### 3. หน้าสินค้า (Product Scrollytelling Showcase)
* **Route:** `/product` ➔ ไฟล์: `public/product.html`, `public/product.css`, `public/js/product.js`
* **ระบบ Scrollytelling 240 เฟรม:** รองรับ 4 หมวดหมู่ (APFA, ACA, FCOF, COIL) พร้อมระบบ Smooth Center-Glide Zoom บนการ์ดเนื้อหา

### 4. หน้านำเสนอกระบวนการผลิต (Manufacturing Process Flow)
* **Route:** `/manufacturing` ➔ ไฟล์: `public/manufacturing.html`, `public/manufacturing.css`, `public/js/manufacturing.js`
* **ระบบ:** Interactive Engineering Flowchart แสดงขั้นตอนการผลิต Coil Winding, ACA, FCOF, และ APFA

### 5. หน้า 3D Cleanroom Digital Twin & AI SCADA Fleet
* **Route:** `/factory` ➔ ไฟล์: `public/factory.html`, `public/factory.css`, `public/js/factory.js`
* **ระบบ 3D Cleanroom Three.js:** จำลองโรงงานคลีนรูม Belton Class 100 แบบเต็มสเกล พร้อมโหมดเดินสำรวจ First-Person, Bird-Eye View, และระบบวาร์ปกล้อง
* **ระบบ Real-time SCADA Fleet:** ติดตามข้อมูลเครื่องจักร Asymtek Dispenser 50 เครื่อง (Yield, Cpk, CDA Pressure, Preheat Temp, Mass mg, Needle Wear)
* **ระบบ Belton AI Copilot:** วิศวกร AI ตอบคำถามผ่าน Ollama Qwen 2.5:3b (Local GPU) เชื่อมต่อ Function Calling ดึงสเปกเครื่องจักร และ RAG ค้นหาสไลด์ฝึกอบรมวิศวกรรม 273 หน้าแบบเสี้ยววินาที

---

## 📁 โครงสร้างไฟล์ปัจจุบัน (Clean Production Tree)

```text
belton_live_preview/
├── ClickToRun.bat                # 1-Click Launcher รันเซิร์ฟเวอร์อัตโนมัติบน Windows
├── DEPLOYMENT_GUIDE.md           # คู่มือขึ้นระบบ Production สำหรับทีม IT / DevOps
├── README.md                     # เอกสารสถาปัตยกรรมระบบ ภาพรวมเทคโนโลยี และ API Reference
├── PROJECT_HANDOVER.md           # ไฟล์สรุปบริบทและกฎเหล็กการทำงาน (ไฟล์นี้)
├── package.json                  # รายการ Dependencies ของ Node.js
├── package-lock.json             # Lockfile ระบุเวอร์ชันแพ็กเกจที่แน่นอน
├── server.js                     # Express Server หลัก (5 Core Routes, SCADA REST APIs, AI Proxy)
├── .env                          # Local Environment Variables
├── .env.example                  # Production Environment Template
├── .gitignore                    # กฎการละเว้นไฟล์ขยะและ logs
│
├── src/                          # Backend Core Logic
│   ├── db/database.js            # SQLite / PostgreSQL Dual Engine พร้อม Auto-seeder
│   ├── knowledge/                # องค์ความรู้วิศวกรรม และระบบค้นหาสไลด์ความเร็วสูง <1ms
│   ├── tools/                    # Function Calling ของ AI Copilot (5 เครื่องมือ)
│   └── orchestrator.js           # สมองกล AI ควบคุม RAG, กรองคำตอบ และเชื่อมต่อ Ollama
│
├── data/                         # แหล่งจัดเก็บข้อมูลหลัก
│   ├── belton_slides_database.json # ฐานข้อมูลสไลด์ฝึกอบรม 273 หน้า (JSON Master)
│   └── scada.db                  # SQLite Database (เครื่องจักร SCADA 50 เครื่อง + สไลด์ FTS5)
│
├── scripts/                      # สคริปต์อำนวยความสะดวก
│   └── extract_slides_to_db.py   # สคริปต์สกัดสไลด์ PDF เข้าฐานข้อมูล
│
├── ai/                           # AI / ML Training & Offline Pipelines
└── public/                       # Frontend Web Application (HTML, CSS, JS, Models, Frames)
```

---

## ⚙️ คำสั่งรันระบบ (Commands)

```bash
# รันเซิร์ฟเวอร์
npm start

# หรือดับเบิ้ลคลิกไฟล์ ClickToRun.bat บน Windows
```
* เปิดเบราว์เซอร์ที่: **`http://localhost:8080`**
