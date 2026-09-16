const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let dbClient = null;
const isPostgres = !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlitePath = process.env.SQLITE_PATH || path.join(dataDir, 'scada.db');

if (isPostgres) {
  const { Pool } = require('pg');
  dbClient = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('📦 [Database] Connected to PostgreSQL');
} else {
  dbClient = new Database(sqlitePath);
  console.log(`📦 [Database] Connected to local SQLite (${sqlitePath})`);
  initSqliteSchema();
}

function initSqliteSchema() {
  dbClient.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY,
      machine_id TEXT NOT NULL,
      line_name TEXT NOT NULL,
      model_type TEXT NOT NULL,
      status TEXT NOT NULL,
      status_label TEXT NOT NULL,
      yield_rate REAL NOT NULL,
      cpk REAL NOT NULL,
      total_shots INTEGER NOT NULL,
      pass_count INTEGER NOT NULL,
      defect_count INTEGER NOT NULL,
      avg_mass_mg REAL NOT NULL,
      avg_pressure_kpa REAL NOT NULL,
      avg_preheat_c REAL NOT NULL,
      needle_wear REAL NOT NULL,
      current_batch TEXT NOT NULL,
      ai_diagnosis TEXT,
      ai_recommendation TEXT
    );
  `);

  const rowCount = dbClient.prepare('SELECT count(*) as count FROM machines').get().count;
  if (rowCount === 0) {
    const insert = dbClient.prepare(`
      INSERT INTO machines (
        id, machine_id, line_name, model_type, status, status_label,
        yield_rate, cpk, total_shots, pass_count, defect_count,
        avg_mass_mg, avg_pressure_kpa, avg_preheat_c, needle_wear,
        current_batch, ai_diagnosis, ai_recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = dbClient.transaction(() => {
      for (let i = 1; i <= 50; i++) {
        const tag = i < 10 ? `0${i}` : `${i}`;
        const mId = `ACA-DISP-${tag}`;
        const line = i <= 25 ? 'ACA-LINE-EAST' : 'ACA-LINE-WEST';
        const model = 'Asymtek Dynamic Dispenser';
        const batch = 'LOT-EPX-2026-09B';

        if (i === 27) {
          insert.run(
            27, mId, line, model, 'MAINTENANCE_HOLD', 'วิกฤต (Safety Hold)',
            64.75, 0.10, 1081, 700, 379,
            10.89, 381.2, 57.1, 0.960,
            batch,
            '🚨 วิกฤต: ปลายเข็ม 32G สึกหรอแตะ 0.96 เกินขีดจำกัด (>0.75) หัวเข็มอุดตันเรื้อรัง กาวหยอดขาด Underfill ต่ำกว่า 12.5 mg ระบบตัด Safety Hold หยุดจ่ายงานอัตโนมัติ',
            'ช่างซ่อมบำรุงกำลังเข้าเปลี่ยนหัวเข็ม 32G Ultra-Micro Nozzle ชุดใหม่ พร้อม Calibrate กล้อง Vision ใหม่อีกครั้ง'
          );
        } else if (i === 14) {
          insert.run(
            14, mId, line, model, 'WARNING', 'เฝ้าระวัง (Watchlist)',
            98.89, 0.59, 1081, 1069, 10,
            12.50, 378.5, 68.2, 0.579,
            batch,
            '⚠️ เฝ้าระวัง: อุณหภูมิ Pre-heat สวิงขึ้น 68.2 °C และอายุกาวในหลอดสะสม 160 นาที ความหนืดกาวขึ้นแตะ 8,620 mPa·s',
            'AI กำลังชดเชยแรงดันลมไดนามิกให้อยู่ แนะนำ Operator เตรียมเบิกกาวหลอดใหม่มาเปลี่ยนก่อนครบ 240 นาที'
          );
        } else if (i === 38) {
          insert.run(
            38, mId, line, model, 'WARNING', 'เฝ้าระวัง (Watchlist)',
            99.17, 0.58, 1081, 1072, 7,
            12.50, 208.5, 60.0, 0.579,
            batch,
            '⚠️ เฝ้าระวัง: แรงดันลมจ่ายกาว CDA ตกเหลือ 208.5 kPa เสี่ยงเกิดฟองอากาศ Micro-void และแนวฟิเลต์กาวเริ่มบางลง',
            'แนะนำให้ฝ่ายซ่อมบำรุงตรวจเช็กข้อต่อท่อลม CDA และวาล์วปรับแรงดัน Regulator'
          );
        } else {
          insert.run(
            i, mId, line, model, 'ACTIVE', 'ปกติ (Active 100%)',
            99.81, 1.20, 1081, 1079, 0,
            12.50, 332.9, 60.0, 0.212,
            batch,
            '✅ ทำงานปกติ 100%: แรงดันลมและปริมาณกาวอยู่ในเกณฑ์ Cpk Nominal สม่ำเสมอ',
            'ทำงานต่อเนื่องตามรอบการผลิตปกติ ไม่พบความเสี่ยงใดๆ'
          );
        }
      }
    });

    insertMany();
    console.log('✅ [Database] Seeded 50 SCADA machine records successfully into SQLite.');
  }

  // 2. Ensure slide_pages and FTS5 tables exist and are auto-seeded
  dbClient.exec(`
    CREATE TABLE IF NOT EXISTS slide_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_code TEXT NOT NULL,
      doc_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      char_count INTEGER NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS slides_fts USING fts5(
      page_id UNINDEXED,
      doc_code,
      doc_name,
      page_number UNINDEXED,
      title,
      content,
      tokenize='unicode61'
    );
  `);

  const slideRowCount = dbClient.prepare('SELECT count(*) as count FROM slide_pages').get().count;
  if (slideRowCount === 0) {
    const jsonPath = path.join(dataDir, 'belton_slides_database.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const slides = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const insertSlide = dbClient.prepare(`
          INSERT INTO slide_pages (doc_code, doc_name, filename, page_number, title, content, char_count)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const insertFts = dbClient.prepare(`
          INSERT INTO slides_fts (page_id, doc_code, doc_name, page_number, title, content)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const seedSlides = dbClient.transaction(() => {
          for (const s of slides) {
            const info = insertSlide.run(
              s.doc_code, s.doc_name, s.filename || '', s.page_number, s.title || '', s.content || '', s.char_count || (s.content ? s.content.length : 0)
            );
            insertFts.run(info.lastInsertRowid, s.doc_code, s.doc_name, s.page_number, s.title || '', s.content || '');
          }
        });
        seedSlides();
        console.log(`✅ [Database] Auto-seeded ${slides.length} training slides into SQLite.`);
      } catch (err) {
        console.warn('⚠️ [Database] Slide auto-seeding warning:', err.message);
      }
    }
  }
}

function queryDB(sql, params = []) {
  if (isPostgres) {
    return dbClient.query(sql, params).then(res => res.rows);
  } else {
    const stmt = dbClient.prepare(sql);
    return Promise.resolve(stmt.all(...params));
  }
}

async function getMachineTelemetry(machineNum) {
  const rows = await queryDB('SELECT * FROM machines WHERE id = ?', [machineNum]);
  return rows[0] || null;
}

async function getProblematicMachines(filter = 'all') {
  let sql = "SELECT * FROM machines WHERE status != 'ACTIVE' ORDER BY yield_rate ASC";
  if (filter === 'critical_only') {
    sql = "SELECT * FROM machines WHERE status = 'MAINTENANCE_HOLD' ORDER BY yield_rate ASC";
  } else if (filter === 'warning_only') {
    sql = "SELECT * FROM machines WHERE status = 'WARNING' ORDER BY yield_rate ASC";
  }
  const rows = await queryDB(sql);
  return { total_problem_count: rows.length, machines: rows };
}

async function getFactorySummary() {
  const rows = await queryDB(`
    SELECT 
      count(*) as total_machines,
      sum(case when status = 'ACTIVE' then 1 else 0 end) as active_count,
      sum(case when status != 'ACTIVE' then 1 else 0 end) as problem_count,
      avg(yield_rate) as average_yield,
      sum(total_shots) as total_shots,
      sum(pass_count) as total_pass,
      sum(defect_count) as total_defect
    FROM machines
  `);
  return rows[0] || null;
}

module.exports = {
  queryDB,
  getMachineTelemetry,
  getProblematicMachines,
  getFactorySummary
};
