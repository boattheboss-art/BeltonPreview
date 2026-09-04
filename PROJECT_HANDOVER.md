# BELTON — PROJECT HANDOVER & AI CONTEXT CONTINUITY
**Date Generated:** September 3, 2026  
**Original Conversation ID:** `34f9f303-44c4-4328-998e-ce6d834be561`  
**Project Directory:** `c:\Users\BOAT\Videos\เลขา\belton_live_preview`  
**Git Repository:** `https://github.com/boattheboss-art/BeltonPreview.git`  
**Render Hosting:** `https://beltonpreview.onrender.com`  

---

## 📌 สรุปบริบทสำหรับ AI ที่เข้ามารับช่วงต่อ (Quick Context for AI)

> **คำสั่งสำหรับ AI:**  
> โปรเจกต์นี้คือ **BELTON Live Preview** เป็นเว็บแอปพลิเคชัน Node.js / Express แสดงผล 3D Interactive และ Scrollytelling ระดับพรีเมียม (ธีมขาว/เงิน Monochrome ผสม Sci-Fi Cybernetic)  
> สามารถอ่านไฟล์นี้เพื่อทำความเข้าใจโครงสร้าง ระบบ และงานที่ทำไปแล้วทั้งหมด เพื่อทำงานต่อได้อย่างต่อเนื่อง 100%

---

## 🏗️ โครงสร้างหน้าเว็บและระบบ (Core Architecture)

### 1. หน้าแรก (Home / Landing Page)
* **Route:** `/` ➔ ไฟล์: `public/index.html`, `public/styles.css`, `public/js/main.js`, `public/js/robot3d.js`
* **ธีม:** ขาว/เงิน Monochrome หรูหรา สะอาดตา
* **ลำดับเลเยอร์ (Layer Stacking):**
  1. `z-0`: **Fullscreen Spline 3D Scene** (`#bgSplineCanvas`) — แสดงพื้นหลัง 3D (`assets/models/bg_scene.splinecode` หรือ `https://prod.spline.design/MG1LWxb8Jo7FVHqW/scene.splinecode`) มีระบบ Global Mouse & Pointer Event Forwarding ทำให้พื้นหลังขยับตามเมาส์ได้ทุกจุด
  2. `z-1`: **ตัวหนังสือ BELTON** — ฟอนต์ 3D Typography ลอยอยู่หน้าพื้นหลัง
  3. `z-10`: **หุ่นยนต์ 3D Robot Component** (`#bentonCanvas`) — โมเดลหุ่นยนต์ 3D ลอยเด่นอยู่ตรงกลาง
  4. `z-20 & z-50`: **เนื้อหา Bento Grid, ปุ่ม Login และแถบ Navbar**
* **ระบบ Access Terminal (Login Modal):**
  * **Username (ชื่อผู้ใช้):** `60632`
  * **Password (รหัสผ่าน):** `60632`
  * เมื่อล็อกอินสำเร็จ จะปลดล็อกปุ่มและสิทธิ์การเข้าสู่หน้าอื่นๆ

---

### 2. หน้า 3D Model Explorer
* **Route:** `/explorer` ➔ ไฟล์: `public/explorer.html`
* **ระบบ:** Three.js HDD Actuator Coil Model แบบแยกชิ้นส่วนได้ (Explode View) พร้อมระบบหมุนดูรอบทิศทาง 360 องศา

---

### 3. หน้าสินค้า (Product Scrollytelling Showcase)
* **Route:** `/product` ➔ ไฟล์: `public/product.html`, `public/product.css`, `public/js/product.js`
* **ระบบความปลอดภัย:** มี Auth Guard ป้องกัน ถ้ายังไม่ได้ล็อกอินจะเด้งกลับหน้าแรก (`/`)
* **Navbar:** มี **เพียง 2 ปุ่มเท่านั้น** ตามความต้องการของผู้ใช้ คือ:
  1. **`Home`** ➔ กลับหน้าแรก
  2. **`ออกจากระบบ` (Logout)** ➔ เคลียร์ Session แล้วกลับหน้าแรก
* **ระบบ Scrollytelling 240 เฟรม:**
  * รองรับ 4 สินค้า (A: APFA, B: ACA, C: FCOF, D: COIL) พร้อมเมนู Holographic สไตล์ SAO ที่มุมซ้ายบน
* **ระบบ Smooth Center-Glide Zoom บนกล่องข้อความ:**
  * กล่องข้อความอยู่ฝั่งซ้ายและขวา เมื่อคลิกที่กล่องใดๆ:
    * กล่องจะ **เคลื่อนตัวมาร่อนจอดอยู่กึ่งกลางหน้าจอพอดี (Dead-Center)** พร้อมขยายใหญ่ขึ้น **1.24x** อย่างนุ่มนวลด้วยฟิสิกส์ `cubic-bezier(0.19, 1, 0.22, 1)`
    * มีแสงเรือง Cybernetic Living Aura (`cardBreathingAura`) คมชัดระดับคริสตัล
    * **วิดีโอ/โมเดล 3D ข้างหลังอยู่นิ่งที่เดิม 100% ไม่มีการซูมตาม**
    * มีม่านสลัว (`.card-dim-backdrop` ที่ z-index: 8) ช่วยเพิ่มคอนทราสต์
  * **การปิดซูม:** คลิกที่กล่องซ้ำ, คลิกที่ฉากหลังว่างๆ, หรือกดปุ่ม `ESC` กล่องจะร่อนกลับตำแหน่งเดิมอย่างนิ่มนวล

---

## ⚙️ การรันเซิร์ฟเวอร์ในเครื่อง (Local Development)

```bash
# ติดตั้ง dependencies (ถ้าจำเป็น)
npm install

# รันเซิร์ฟเวอร์
node server.js
```
* เปิดเบราว์เซอร์ที่: **`http://localhost:8080`**
* พอร์ต: `process.env.PORT || 8080`

---

## 🚀 การ Deploy ขึ้น Hosting (Render.com)

1. **Git Repository:**
   * จัดการผ่าน **GitHub Desktop** หรือคำสั่ง Git
   * Remote: `https://github.com/boattheboss-art/BeltonPreview.git`
   * Branch หลัก: `main`
2. **ขั้นตอนเมื่ออัปเดตงาน:**
   * ใน GitHub Desktop ให้ไปที่แท็บ `Changes`
   * ช่อง `Summary` พิมพ์ชื่อบันทึก เช่น `update` แล้วกด `Commit to main`
   * กดปุ่ม `Push origin`
3. **การเปิดเว็บที่ Render (กรณี Suspended):**
   * เข้า dashboard.render.com
   * กดเข้า `BeltonPreview`
   * กด `Resume Web Service` เพื่อเปิดเซิร์ฟเวอร์
   * กด `Manual Deploy` ➔ `Deploy latest commit`
4. **URL เว็บจริง:** `https://beltonpreview.onrender.com`

---

## 📁 โครงสร้างไฟล์สำคัญ (Key Files Directory)

```text
belton_live_preview/
├── server.js                     # Express server & Dynamic PORT router
├── package.json                  # Node dependencies
├── .gitignore                    # Git exclusions
├── PROJECT_HANDOVER.md           # ไฟล์สรุปนี้ (Context Continuity)
└── public/
    ├── index.html                # หน้า Home (Landing)
    ├── styles.css                # สไตล์หน้า Home & Login Modal
    ├── explorer.html             # หน้า 3D Model Explorer
    ├── product.html              # หน้า Product Scrollytelling
    ├── product.css               # สไตล์หน้า Product & Center-Glide Zoom
    ├── js/
    │   ├── main.js               # Logic หน้า Home & Login Auth
    │   ├── robot3d.js            # Engine โหลด Spline Robot & Bg Spline
    │   ├── product.js            # Scrollytelling & Center-Glide Zoom Controller
    │   └── audio.js              # Sound effects engine
    ├── assets/models/
    │   ├── bg_scene.splinecode   # ไฟล์ Spline พื้นหลัง 3D (Home)
    │   ├── scene.splinecode      # ไฟล์ Spline หุ่นยนต์ 3D (Home)
    │   └── coil.glb              # โมเดล 3D Hard Drive Actuator
    └── frames/                   # ชุดภาพ 240 เฟรมสำหรับ Product A, B, C, D
```
