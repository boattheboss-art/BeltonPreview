# คู่มือการติดตั้งและขึ้นระบบ (BELTON Production Deployment Guide)

เอกสารฉบับนี้จัดทำขึ้นสำหรับทีมงานวิศวกรรมซอฟต์แวร์, IT Infrastructure และ DevOps เพื่อใช้เป็นแนวทางมาตรฐานในการติดตั้ง, ตั้งค่า Environment, และขึ้นระบบ (Deploy) โปรเจกต์ **BELTON Industrial Digital Twin & AI SCADA Fleet** ขึ้นสู่ Production Server ของบริษัท

---

## 1. ข้อมูลสถาปัตยกรรมระบบ (Architecture Overview)

โปรเจกต์ประกอบด้วย 4 เลเยอร์หลัก:
1. **Frontend Web Application**: 
   - Vanilla HTML5 / Modern CSS / JavaScript (ES6+)
   - **Three.js 3D Engine**: จำลองโรงงานคลีนรูมเสมือนจริง (Digital Twin) และโมเดลแยกชิ้นส่วน HDD Actuator
   - ไม่จำเป็นต้องมี Build step (No Webpack/Vite overhead) ไฟล์ถูก Serve ตรงจากโฟลเดอร์ `public/`
2. **Backend Application Server**:
   - **Node.js (v18.0+)** และ **Express Framework**
   - ให้บริการทั้ง Static Assets, Web Routes (5 หน้าหลัก) และ RESTful APIs
3. **Database Layer (Dual Engine)**:
   - **Default (Local)**: SQLite พร้อม Full-Text Search (FTS5) ผ่านไลบรารี `better-sqlite3` รองรับการทำงานแบบ Self-bootstrapping
   - **Enterprise (Cloud/Centralized)**: รองรับ PostgreSQL ผ่าน `pg` Pool (เปิดใช้งานโดยตั้งค่า `DATABASE_URL` ใน `.env`)
4. **Local AI Copilot (RAG & Function Calling)**:
   - ประมวลผลบนเครื่อง Local 100% ผ่าน **Ollama Engine** (โมเดล `qwen2.5:14b` หรือเลือกรุ่นที่เหมาะสมกับฮาร์ดแวร์)
   - ไม่มีการส่งข้อมูลโรงงานออกภายนอก (Zero Cloud Dependency)
   - ระบบ RAG ดึงข้อมูลสไลด์ฝึกอบรม 273 หน้า จาก SQLite FTS5 ในเวลา < 1 มิลลิวินาที

---

## 2. ข้อกำหนดของระบบ (System Requirements)

### ฮาร์ดแวร์ที่แนะนำ (Recommended Hardware)
| รายการ | ขั้นต่ำ (Minimum) | แนะนำ (Recommended) |
|---|---|---|
| **CPU** | Intel Core i5 / AMD Ryzen 5 (6 Cores+) | Intel Core i7 / AMD Ryzen 7 (8 Cores+) |
| **RAM** | 16 GB | 16 - 32 GB ขึ้นไป |
| **GPU** | NVIDIA GeForce RTX 3050 (6GB VRAM) | NVIDIA RTX 4060 / RTX 3060 (8GB-12GB VRAM) ขึ้นไป |
| **Storage** | SSD ขั้นต่ำ 15-20 GB (แนะนำจัดเก็บที่ Drive D:) | NVMe SSD |

### ซอฟต์แวร์ที่จำเป็น (Required Software)
1. **Node.js**: เวอร์ชัน `18.x`, `20.x` หรือ `22.x LTS` (ดาวน์โหลดจาก [nodejs.org](https://nodejs.org))
2. **Ollama**: สำหรับรัน AI Model Local (ดาวน์โหลดจาก [ollama.com](https://ollama.com))
3. **Git**: สำหรับดึงซอร์สโค้ดและจัดการ Version Control

---

## 3. ขั้นตอนการติดตั้งทีละขั้น (Step-by-Step Installation)

### ขั้นตอนที่ 1: ดึงซอร์สโค้ด
```bash
git clone https://github.com/boattheboss-art/BeltonPreview.git
cd BeltonPreview
```

### ขั้นตอนที่ 2: ติดตั้ง Node.js Dependencies
```bash
npm install
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables
คัดลอกไฟล์เทมเพลต `.env.example` ไปเป็น `.env`:
```bash
# บน Windows PowerShell:
Copy-Item .env.example .env

# บน Linux / macOS:
cp .env.example .env
```
ปรับแต่งค่าภายในไฟล์ `.env` ตามความเหมาะสมของสภาพแวดล้อม:
```env
# พอร์ตที่ต้องการให้เว็บเซิร์ฟเวอร์เปิดให้บริการ
PORT=8080

# URL และชื่อโมเดลของ Ollama Local AI
OLLAMA_BASE_URL=http://127.0.0.1:11434
MODEL_NAME=qwen2.5:14b

# ที่อยู่ไฟล์ฐานข้อมูล SQLite
SQLITE_PATH=./data/scada.db

# (ทางเลือก) เชื่อมต่อ PostgreSQL แทน SQLite
# DATABASE_URL=postgres://user:password@hostname:5432/belton_scada?sslmode=require
```

### ขั้นตอนที่ 4: ดาวน์โหลดและเปิดใช้งาน Ollama AI
1. กำหนดโฟลเดอร์จัดเก็บโมเดลไว้ที่ไดรฟ์อื่นที่ไม่ใช่ Drive C: (แนะนำสำหรับโมเดล 14B ขนาด ~9.0 GB):
   ```cmd
   # บน Windows CMD / Script:
   set OLLAMA_MODELS=D:\ollama\models

   # หรือรันผ่านสคริปต์ที่เตรียมไว้ในโปรเจกต์:
   scripts\start_ollama.bat
   ```
2. ดาวน์โหลดโมเดล `qwen2.5:14b`:
   ```bash
   ollama pull qwen2.5:14b
   ```
3. ตรวจสอบว่า Ollama Service กำลังทำงาน:
   ```bash
   curl http://127.0.0.1:11434/
   # ได้ผลลัพธ์ตอบกลับว่า: "Ollama is running"
   ```

### ขั้นตอนที่ 5: เริ่มการทำงานของเซิร์ฟเวอร์
```bash
npm start
```
*ระบบจะตรวจสอบฐานข้อมูล SQLite อัตโนมัติ หากเป็นเครื่องใหม่ ระบบจะทำการ Auto-seed เครื่องจักร SCADA ทั้ง 50 เครื่อง และสไลด์ฝึกอบรมทั้ง 273 หน้าเข้าสู่ฐานข้อมูลทันทีโดยอัตโนมัติ*

เปิดเบราว์เซอร์และเข้าใช้งานที่: **`http://localhost:8080`**

---

## 4. โครงสร้างเส้นทางและ API (Routes & API Reference)

### หน้าเว็บหลัก (Web Application Routes)
| Route | หน้าที่การทำงาน | ไฟล์ต้นทาง |
|---|---|---|
| `GET /` | หน้าแรก / Landing Page / หุ่นยนต์ 3D แนะนำโรงงาน | `public/index.html` |
| `GET /explorer` | 3D HDD Component Explorer (แยกชิ้นส่วน Explode View) | `public/explorer.html` |
| `GET /product` | หน้านำเสนอสินค้า 4 หมวดหมู่ (Scrollytelling 240 เฟรม) | `public/product.html` |
| `GET /manufacturing` | แผนภาพและขั้นตอนกระบวนการผลิตทั้งโรงงาน | `public/manufacturing.html` |
| `GET /factory` | หน้า 3D Cleanroom Digital Twin + แผง SCADA 50 เครื่อง + AI Copilot | `public/factory.html` |

### ข้อมูลการล็อกอินเข้าสู่ระบบ (Default Access Credentials)
- **Username**: `admin`
- **Password**: `60632`

### RESTful APIs สำหรับ SCADA & AI
| Method | Endpoint | คำอธิบาย |
|---|---|---|
| `GET` | `/api/scada/fleet` | ข้อมูลเทเลเมตรีสดของเครื่องจักรทั้งหมด 50 เครื่องในไลน์ ACA |
| `GET` | `/api/scada/machine/:id` | ข้อมูลเทเลเมตรีเชิงลึกของเครื่องจักรรายเครื่อง (เช่น `/api/scada/machine/27`) |
| `GET` | `/api/scada/summary` | สรุปยอดรวมผลผลิต (Total Shots, Pass, Defect, Average Yield) |
| `POST` | `/api/copilot/chat` | ส่งคำถามไปยัง AI Copilot พร้อมประวัติการสนทนา (Payload: `{ message: string, history: array }`) |

---

## 5. การติดตั้งบน Production แบบมืออาชีพ (Production Process Management)

### ตัวเลือกที่ 1: รันด้วย PM2 (แนะนำสำหรับ Linux/Windows Server)
PM2 เป็น Process Manager มาตรฐานที่ช่วยรันเซิร์ฟเวอร์ใน Background และรีสตาร์ตให้อัตโนมัติเมื่อเกิดข้อผิดพลาด:
```bash
# ติดตั้ง PM2 ทั่วทั้งระบบ
npm install -g pm2

# สั่งรันเซิร์ฟเวอร์
pm2 start server.js --name "belton-scada"

# บันทึกสถานะเพื่อให้เปิดขึ้นมาใหม่อัตโนมัติเมื่อรีสตาร์ตเครื่องเซิร์ฟเวอร์
pm2 save
pm2 startup
```

### ตัวเลือกที่ 2: รันด้วย Docker / Containerization
ตัวอย่าง `Dockerfile` สำหรับบรรจุระบบ:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
```

### ตัวเลือกที่ 3: Deploy บน Cloud (เช่น Render.com) คู่กับ Local GPU (Hybrid Architecture)
โซลูชันเพื่อความปลอดภัยของข้อมูลสูงสุด (Zero Cloud Leak) และประหยัดค่า Cloud GPU:
1. **บน Cloud (Render.com)**:
   - สั่ง Deploy โปรเจกต์ผ่าน GitHub Repository
   - Build Command: `npm install`
   - Start Command: `node server.js`
2. **บนเครื่อง Local ที่มีการ์ดจอ GPU (NVIDIA RTX 3050)**:
   - ดับเบิลคลิกไฟล์ `StartGpuTunnel.bat` ในโฟลเดอร์โปรเจกต์
   - สังเกตบรรทัด URL HTTPS (เช่น `https://xxxxxx.trycloudflare.com`)
3. **ตั้งค่าใน Cloud Dashboard (Render)**:
   - ไปที่ Environment Variables ของ Web Service
   - เพิ่มตัวแปร: `OLLAMA_BASE_URL` = `https://xxxxxx.trycloudflare.com`
   - เซิร์ฟเวอร์บน Cloud จะส่งคำถามผ่านท่อเข้ารหัส SSL กลับมาประมวลผลบนการ์ดจอของคุณทันที

---

## 6. การตรวจสอบสถานะระบบ (Health Check & Troubleshooting)

1. **พอร์ต 8080 ถูกใช้งานอยู่แล้ว**:
   - ตรวจสอบ PID ด้วย `netstat -ano | findstr 8080`
   - ปิดโปรเซสเก่าด้วย `taskkill /PID <PID> /F` (Windows) หรือ `kill -9 <PID>` (Linux)
2. **AI Copilot ไม่ตอบสนอง หรือตอบช้าผิดปกติ**:
   - ตรวจสอบว่า Ollama เปิดอยู่หรือไม่ผ่าน `curl http://127.0.0.1:11434/`
   - หากใช้เครื่องที่ไม่มี GPU ตัวโมเดล `qwen2.5:3b` จะสลับไปประมวลผลบน CPU อัตโนมัติ โดยอาจใช้เวลาตอบ 10-15 วินาที
3. **การสำรองและรีเซ็ตฐานข้อมูล**:
   - ฐานข้อมูลถูกบันทึกอยู่ที่ `data/scada.db` สามารถคัดลอกไฟล์นี้เพื่อทำ Backup ได้ตลอดเวลา
   - หากต้องการรีเซ็ตฐานข้อมูล ให้ลบไฟล์ `data/scada.db` ทิ้ง เมื่อรัน `npm start` ระบบจะสร้างและ Seed ข้อมูลใหม่ให้อัตโนมัติทันที

