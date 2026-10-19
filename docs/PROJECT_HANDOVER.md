# คู่มือส่งมอบงานและสถาปัตยกรรมระบบ (BELTON Project Handover Guide)

**ชื่อโปรเจกต์:** BELTON Industrial 3D Digital Twin, SCADA Fleet & Local AI Copilot  
**สถานะโปรเจกต์:** พร้อมส่งมอบงาน (Production & Handover Ready)  
**Git Repository:** `https://github.com/boattheboss-art/BeltonPreview.git`

---

## 1. ภาพรวมสำหรับการรับมอบงาน (Executive Summary for Handover)

เอกสารฉบับนี้จัดทำขึ้นเพื่อส่งมอบงานพัฒนาโปรเจกต์ **BELTON Live Preview** ให้แก่ทีมวิศวกรและนักพัฒนาซอฟต์แวร์ของบริษัท เพื่อใช้ในการดูแลรักษา ปรับปรุงข้อมูล และพัฒนาต่อยอดได้อย่างต่อเนื่องทันที

โปรเจกต์นี้เป็นแพลตฟอร์มเว็บแอปพลิเคชันแบบครบวงจรที่รวม 3 ระบบหลักเข้าด้วยกัน:
1. **3D Interactive Visualization & Cleanroom Digital Twin**: จำลองโรงงานคลีนรูม Class 100 และชิ้นส่วนผลิตภัณฑ์ด้วย Three.js โดยไม่ต้องพึ่งพาซอฟต์แวร์ภายนอกบนเครื่องผู้ใช้งาน
2. **Real-Time SCADA Fleet Monitoring**: ระบบติดตามพารามิเตอร์เครื่องจักรหยอดกาวอัตโนมัติ (Asymtek Dispenser) จำนวน 50 เครื่อง พร้อมฐานข้อมูล SQLite / PostgreSQL
3. **Local AI Copilot & Engineering RAG**: ผู้ช่วยวิศวกร AI ที่ทำงานร่วมกับ Ollama (Local GPU) ค้นหาข้อมูลจากสไลด์ฝึกอบรมวิศวกรรมและข้อสอบมาตรฐานของบริษัทด้วยความเร็วระดับเสี้ยววินาที พร้อมระบบอ่านออกเสียงภาษาไทย (Neural TTS)

---

## 2. การจัดระเบียบโฟลเดอร์และหน้าที่ของไฟล์สำคัญ (Directory Organization)

โครงสร้างโปรเจกต์ได้รับการจัดระเบียบแยกตามหน้าที่การทำงาน (Modular Architecture) ดังนี้:

```text
belton_live_preview/
├── ClickToRun.bat                # ไฟล์หลักสำหรับดับเบิลคลิกเปิดระบบบน Windows ทันที
├── server.js                     # จุดเริ่มต้นของ Backend Server (Express, Routes, APIs, TTS)
├── package.json                  # กำหนดรายการไลบรารีและคำสั่ง npm scripts
├── .env.example                  # ตัวอย่างการตั้งค่าตัวแปรสภาพแวดล้อม (คัดลอกเป็น .env เพื่อใช้งาน)
│
├── src/                          # โค้ดส่วนประมวลผลฝั่งเซิร์ฟเวอร์ (Backend Core)
│   ├── orchestrator.js           # ตัวควบคุมหลักของ AI Copilot (จัดการ Prompt, RAG, Tool Calls, Streaming)
│   ├── db/
│   │   └── database.js           # ระบบจัดการฐานข้อมูลรองรับทั้ง SQLite และ PostgreSQL
│   ├── knowledge/
│   │   ├── belton_knowledge.js   # ข้อมูลมาตรฐานคลีนรูมและพารามิเตอร์วิศวกรรม
│   │   └── slide_knowledge_db.js # เครื่องมือค้นหาสไลด์ฝึกอบรมและข้อสอบ (RAG Search Engine)
│   └── tools/
│       ├── schemas.js            # โครงสร้างคำสั่ง Function Calling สำหรับ AI
│       └── handlers.js           # ฟังก์ชันดึงข้อมูลเครื่องจักรและสั่งการมุมกล้อง 3D
│
├── public/                       # โค้ดและสื่อแสดงผลฝั่งหน้าเว็บทั้งหมด (Frontend)
│   ├── index.html                # หน้าแรก (Landing Page)
│   ├── explorer.html             # หน้าสำรวจชิ้นส่วน 3 มิติ (3D Component Explorer)
│   ├── product.html              # หน้านำเสนอผลิตภัณฑ์ 4 หมวดหมู่ (Product Scrollytelling)
│   ├── manufacturing.html        # หน้าแผนผังกระบวนการผลิต (Manufacturing Process Flow)
│   ├── factory.html              # หน้าโรงงาน 3D Digital Twin + แผงควบคุม SCADA + AI Copilot
│   ├── copilot.html              # หน้าสนทนา AI Copilot แบบเต็มหน้าจอ
│   ├── css/belton-navbar.css     # สไตล์ของแถบเมนูนำทางส่วนกลาง
│   ├── js/                       # โค้ด JavaScript ควบคุมการทำงานของแต่ละหน้า
│   ├── models/                   # ไฟล์โมเดล 3D (.glb) ที่พร้อมแสดงผลบนเว็บเบราว์เซอร์
│   └── frames/ (และ frames_b..d) # ชุดภาพอนิเมชันสำหรับหน้า Product
│
├── data/                         # ข้อมูลฐานข้อมูลและไฟล์ต้นฉบับเอกสารความรู้
│   ├── scada.db                  # ฐานข้อมูล SQLite หลักของระบบ
│   ├── belton_slides_database.json # ข้อมูลสไลด์ฝึกอบรมในรูปแบบ JSON (ใช้สำหรับ Auto-seed)
│   ├── seagate_exam_questions.json # ข้อมูลคลังข้อสอบมาตรฐานในรูปแบบ JSON
│   └── documents/                # ไฟล์เอกสาร PDF ต้นฉบับอ้างอิง
│
├── ai/                           # โค้ดส่วนการเทรนโมเดล AI และการจำลองข้อมูลเครื่องจักร
│   ├── models/                   # ไฟล์โมเดลที่ผ่านการเทรนแล้ว (.pt, .json)
│   ├── data/                     # ข้อมูลสกัดสำหรับเทรนและไฟล์สถานะจำลอง SCADA
│   └── scripts/                  # สคริปต์ Python สำหรับสร้างและสตรีมข้อมูลจำลอง
│
├── scripts/                      # สคริปต์อรรถประโยชน์สำหรับผู้ดูแลระบบ
│   ├── start_ollama.bat          # สคริปต์เปิด Ollama Engine
│   ├── start_gpu_tunnel.bat      # สคริปต์เชื่อมต่อ Local GPU ออกสู่เซิร์ฟเวอร์ภายนอกผ่าน Cloudflare
│   ├── train_ai.bat              # สคริปต์สั่งรันไปป์ไลน์เทรน AI
│   ├── extract_slides_to_db.py   # สคริปต์สกัดเนื้อหาจากสไลด์เข้าฐานข้อมูล
│   ├── enrich_cleanroom_slides.js# สคริปต์เพิ่มความละเอียดข้อมูลขั้นตอนการแต่งกายคลีนรูม
│   ├── ingest_pcba_slides.py     # สคริปต์นำเข้าข้อมูลกระบวนการผลิต PCBA
│   └── ingest_exam_questions.py  # สคริปต์นำเข้าข้อมูลข้อสอบเข้าฐานข้อมูล
│
├── raw_assets/                   # ไฟล์ต้นฉบับสำหรับงานออกแบบ 3 มิติ
│   └── belton_factory_cleanroom_full.blend # ไฟล์ Blender ต้นฉบับของโรงงานคลีนรูม
│
└── docs/                         # เอกสารคู่มือและรายงานทั้งหมดของโปรเจกต์
```

---

## 3. รายละเอียดหน้าเว็บทั้ง 6 ส่วน (Web Routes & Frontend Modules)

1. **หน้าแรก (`/`)**
   - **ไฟล์หลัก:** [`public/index.html`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/index.html), [`public/styles.css`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/styles.css), [`public/js/main.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/main.js)
   - **การทำงาน:** หน้าต้อนรับ แสดงภาพรวมเทคโนโลยี หุ่นยนต์ 3 มิติ และระบบยืนยันตัวตนก่อนเข้าถึงส่วนปฏิบัติการ
2. **หน้าสำรวจโมเดล 3 มิติ (`/explorer`)**
   - **ไฟล์หลัก:** [`public/explorer.html`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/explorer.html)
   - **การทำงาน:** แสดงโมเดล `public/models/coil.glb` สามารถหมุนดูได้ 360 องศา และสั่งแยกชิ้นส่วน (Exploded View)
3. **หน้าผลิตภัณฑ์ (`/product`)**
   - **ไฟล์หลัก:** [`public/product.html`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/product.html), [`public/product.css`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/product.css), [`public/js/product.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/product.js)
   - **การทำงาน:** แสดงรายละเอียดผลิตภัณฑ์ 4 หมวด (APFA, ACA, FCOF, COIL) ด้วยเทคนิค Scrollytelling 240 เฟรมต่อหมวด
4. **หน้ากระบวนการผลิต (`/manufacturing`)**
   - **ไฟล์หลัก:** [`public/manufacturing.html`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/manufacturing.html), [`public/manufacturing.css`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/manufacturing.css), [`public/js/manufacturing.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/manufacturing.js)
   - **การทำงาน:** แผนผังขั้นตอนการผลิตเชิงโต้ตอบ แสดงรายละเอียดแต่ละสถานีงานและมาตรฐานการควบคุมคุณภาพ
5. **หน้าโรงงานจำลองและระบบ SCADA (`/factory`)**
   - **ไฟล์หลัก:** [`public/factory.html`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/factory.html), [`public/factory.css`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/factory.css), [`public/js/factory.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/factory.js)
   - **การทำงาน:** แสดงโมเดลคลีนรูม 3 มิติ (`public/models/belton_factory_cleanroom_full.glb`) เชื่อมต่อกับข้อมูลเครื่องจักร ACA-DISP-01 ถึง 50 พร้อมหน้าต่างผู้ช่วย AI Copilot
6. **หน้าผู้ช่วยวิศวกร AI เต็มรูปแบบ (`/copilot`)**
   - **ไฟล์หลัก:** [`public/copilot.html`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/copilot.html), [`public/copilot.css`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/copilot.css), [`public/js/copilot.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/copilot.js)
   - **การทำงาน:** หน้าอินเทอร์เฟซสนทนากับ AI แบบเต็มหน้าจอ รองรับการตอบกลับแบบ Streaming (SSE), แสดงภาพสไลด์อ้างอิง และอ่านออกเสียงภาษาไทย

---

## 4. คู่มือการดูแลรักษาและพัฒนาต่อยอดสำหรับทีมบริษัท (Maintenance & Extension Guide)

### 4.1 การแก้ไขโมเดล 3 มิติของโรงงาน
1. เปิดไฟล์ต้นฉบับที่ [`raw_assets/belton_factory_cleanroom_full.blend`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/raw_assets/belton_factory_cleanroom_full.blend) ด้วยโปรแกรม Blender
2. เมื่อปรับปรุงโมเดลเสร็จสิ้น ให้ทำการ Export เป็นรูปแบบ **glTF 2.0 (`.glb`)**
3. บันทึกทับไฟล์ที่ [`public/models/belton_factory_cleanroom_full.glb`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/models/belton_factory_cleanroom_full.glb)
4. รีเฟรชหน้าเว็บ `/factory` โมเดลใหม่จะแสดงผลทันที

### 4.2 การเพิ่มหรืออัปเดตฐานข้อมูลความรู้ของ AI (RAG Knowledge Base)
- ข้อมูลสไลด์ฝึกอบรมถูกจัดเก็บไว้ที่ [`data/belton_slides_database.json`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/data/belton_slides_database.json) และในตาราง `slide_pages` ของ [`data/scada.db`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/data/scada.db)
- ข้อมูลข้อสอบมาตรฐานถูกจัดเก็บไว้ที่ [`data/seagate_exam_questions.json`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/data/seagate_exam_questions.json)
- หากต้องการสกัดข้อมูลจากเอกสารชุดใหม่ สามารถดูตัวอย่างและรันสคริปต์ในโฟลเดอร์ `scripts/` ได้แก่:
  - [`scripts/extract_slides_to_db.py`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/scripts/extract_slides_to_db.py)
  - [`scripts/ingest_pcba_slides.py`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/scripts/ingest_pcba_slides.py)
  - [`scripts/enrich_cleanroom_slides.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/scripts/enrich_cleanroom_slides.js)
  - [`scripts/ingest_exam_questions.py`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/scripts/ingest_exam_questions.py)

### 4.3 การเชื่อมโยงข้อมูลเครื่องจักร SCADA จริงของโรงงาน
- ปัจจุบันระบบอ่านข้อมูลผ่านฟังก์ชันใน [`src/db/database.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/src/db/database.js)
- หากต้องการเชื่อมต่อกับฐานข้อมูล PostgreSQL ของโรงงาน ให้กำหนดค่า `DATABASE_URL` ในไฟล์ `.env` ระบบจะสลับจากการใช้ SQLite ไปใช้ PostgreSQL อัตโนมัติโดยไม่ต้องแก้โค้ดส่วนอื่น

### 4.4 การตั้งค่าโมเดล AI (Ollama)
- ตั้งค่า URL และชื่อโมเดลได้ที่ไฟล์ `.env`:
  ```env
  OLLAMA_BASE_URL=http://127.0.0.1:11434
  MODEL_NAME=qwen2.5:14b
  ```
- หากเครื่องเซิร์ฟเวอร์มี VRAM จำกัด (เช่น 4GB - 6GB) สามารถเปลี่ยนค่า `MODEL_NAME` เป็น `qwen2.5:3b` หรือ `qwen2.5:7b` ได้ทันที

---

## 5. คำสั่งการใช้งานและรหัสผ่าน (Quick Reference)

### คำสั่งรันระบบ
```bash
# เริ่มการทำงานของเว็บเซิร์ฟเวอร์ (Port 8080)
npm start

# เปิดบริการ Ollama Local AI
npm run ollama

# เปิด Cloudflare Tunnel สำหรับเชื่อม GPU ออกภายนอก
npm run tunnel

# รันไปป์ไลน์เทรนโมเดล AI
npm run train:ai
```

### ข้อมูลการเข้าสู่ระบบเริ่มต้น
- **URL:** `http://localhost:8080`
- **Username:** `admin`
- **Password:** `60632`
  *(สามารถแก้ไขรหัสผ่านและสิทธิ์การเข้าถึงได้ที่ไฟล์ [`public/js/belton-navbar.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/belton-navbar.js) และ [`public/js/main.js`](file:///c:/Users/BOAT/Videos/เลขา/belton_live_preview/public/js/main.js))*
