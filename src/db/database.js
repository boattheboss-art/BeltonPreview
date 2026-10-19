const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

let dbClient = null;
let isPostgres = false;

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlitePath = process.env.SQLITE_PATH || path.join(dataDir, 'scada.db');

// Helper to convert SQLite '?' parameter placeholders to PostgreSQL '$1, $2, ...'
function convertQuestionMarksToDollarPlaceholders(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}

// 50 Machine Telemetry Seed Data Generator
function generateSeedMachines() {
  const machines = [];
  for (let i = 1; i <= 50; i++) {
    const tag = i < 10 ? `0${i}` : `${i}`;
    const mId = `ACA-DISP-${tag}`;
    const line = i <= 25 ? 'ACA-LINE-EAST' : 'ACA-LINE-WEST';
    const model = 'Asymtek Dynamic Dispenser';
    const batch = 'LOT-EPX-2026-09B';

    if (i === 27) {
      machines.push([
        27, mId, line, model, 'MAINTENANCE_HOLD', 'วิกฤต (Safety Hold)',
        64.75, 0.10, 1081, 700, 379,
        10.89, 381.2, 57.1, 0.960,
        batch,
        'วิกฤต: ปลายเข็ม 32G สึกหรอแตะ 0.96 เกินขีดจำกัด (>0.75) หัวเข็มอุดตันเรื้อรัง กาวหยอดขาด Underfill ต่ำกว่า 12.5 mg ระบบตัด Safety Hold หยุดจ่ายงานอัตโนมัติ',
        'ช่างซ่อมบำรุงกำลังเข้าเปลี่ยนหัวเข็ม 32G Ultra-Micro Nozzle ชุดใหม่ พร้อม Calibrate กล้อง Vision ใหม่อีกครั้ง'
      ]);
    } else if (i === 14) {
      machines.push([
        14, mId, line, model, 'WARNING', 'เฝ้าระวัง (Watchlist)',
        98.89, 0.59, 1081, 1069, 10,
        12.50, 378.5, 68.2, 0.579,
        batch,
        'เฝ้าระวัง: อุณหภูมิ Pre-heat สวิงขึ้น 68.2 °C และอายุกาวในหลอดสะสม 160 นาที ความหนืดกาวขึ้นแตะ 8,620 mPa·s',
        'AI กำลังชดเชยแรงดันลมไดนามิกให้อยู่ แนะนำ Operator เตรียมเบิกกาวหลอดใหม่มาเปลี่ยนก่อนครบ 240 นาที'
      ]);
    } else if (i === 38) {
      machines.push([
        38, mId, line, model, 'WARNING', 'เฝ้าระวัง (Watchlist)',
        99.17, 0.58, 1081, 1072, 7,
        12.50, 208.5, 60.0, 0.579,
        batch,
        'เฝ้าระวัง: แรงดันลมจ่ายกาว CDA ตกเหลือ 208.5 kPa เสี่ยงเกิดฟองอากาศ Micro-void และแนวฟิเลต์กาวเริ่มบางลง',
        'แนะนำให้ฝ่ายซ่อมบำรุงตรวจเช็กข้อต่อท่อลม CDA และวาล์วปรับแรงดัน Regulator'
      ]);
    } else {
      machines.push([
        i, mId, line, model, 'ACTIVE', 'ปกติ (Active 100%)',
        99.81, 1.20, 1081, 1079, 0,
        12.50, 332.9, 60.0, 0.212,
        batch,
        'ทำงานปกติ 100%: แรงดันลมและปริมาณกาวอยู่ในเกณฑ์ Cpk Nominal สม่ำเสมอ',
        'ทำงานต่อเนื่องตามรอบการผลิตปกติ ไม่พบความเสี่ยงใดๆ'
      ]);
    }
  }
  return machines;
}

// -------------------------------------------------------------
// PostgreSQL Initialization & Schema Creation
// -------------------------------------------------------------
async function initPostgresSchema(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY,
        machine_id VARCHAR(50) NOT NULL,
        line_name VARCHAR(100) NOT NULL,
        model_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        status_label VARCHAR(100) NOT NULL,
        yield_rate DOUBLE PRECISION NOT NULL,
        cpk DOUBLE PRECISION NOT NULL,
        total_shots INTEGER NOT NULL,
        pass_count INTEGER NOT NULL,
        defect_count INTEGER NOT NULL,
        avg_mass_mg DOUBLE PRECISION NOT NULL,
        avg_pressure_kpa DOUBLE PRECISION NOT NULL,
        avg_preheat_c DOUBLE PRECISION NOT NULL,
        needle_wear DOUBLE PRECISION NOT NULL,
        current_batch VARCHAR(100) NOT NULL,
        ai_diagnosis TEXT,
        ai_recommendation TEXT
      );

      CREATE TABLE IF NOT EXISTS slide_pages (
        id SERIAL PRIMARY KEY,
        doc_code VARCHAR(100) NOT NULL,
        doc_name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        page_number INTEGER NOT NULL,
        title VARCHAR(255),
        content TEXT NOT NULL,
        char_count INTEGER NOT NULL
      );
    `);

    const countRes = await pool.query('SELECT count(*) as count FROM machines');
    const count = parseInt(countRes.rows[0].count, 10);

    if (count === 0) {
      const seedData = generateSeedMachines();
      for (const row of seedData) {
        await pool.query(`
          INSERT INTO machines (
            id, machine_id, line_name, model_type, status, status_label,
            yield_rate, cpk, total_shots, pass_count, defect_count,
            avg_mass_mg, avg_pressure_kpa, avg_preheat_c, needle_wear,
            current_batch, ai_diagnosis, ai_recommendation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, row);
      }
      console.log('[PostgreSQL] Seeded 50 SCADA machine records successfully into PostgreSQL.');
    } else {
      console.log(`[PostgreSQL] Database ready with ${count} machine records.`);
    }
  } catch (err) {
    console.error('[PostgreSQL Schema Error]:', err.message);
  }
}

// -------------------------------------------------------------
// SQLite Initialization & Schema Creation (Local Development Fallback)
// -------------------------------------------------------------
function initSqliteSchema(sqliteDb) {
  sqliteDb.exec(`
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
  `);

  const rowCount = sqliteDb.prepare('SELECT count(*) as count FROM machines').get().count;
  if (rowCount === 0) {
    const insert = sqliteDb.prepare(`
      INSERT INTO machines (
        id, machine_id, line_name, model_type, status, status_label,
        yield_rate, cpk, total_shots, pass_count, defect_count,
        avg_mass_mg, avg_pressure_kpa, avg_preheat_c, needle_wear,
        current_batch, ai_diagnosis, ai_recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedData = generateSeedMachines();
    const insertMany = sqliteDb.transaction(() => {
      for (const row of seedData) {
        insert.run(...row);
      }
    });
    insertMany();
    console.log('[SQLite Fallback] Seeded 50 SCADA machine records successfully.');
  }
}

// -------------------------------------------------------------
// Initialize Database Driver (PostgreSQL Primary / SQLite Fallback)
// -------------------------------------------------------------
const hasPostgresConfig = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres';

if (hasPostgresConfig) {
  const pgUrl = process.env.DATABASE_URL || 'postgres://belton:belton_password_2026@localhost:5432/belton_scada';
  const pool = new Pool({
    connectionString: pgUrl,
    ssl: pgUrl.includes('render.com') || pgUrl.includes('amazonaws.com') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 3500
  });

  // Verify connection asynchronously
  pool.query('SELECT 1')
    .then(() => {
      dbClient = pool;
      isPostgres = true;
      console.log('[Database] Connected successfully to PostgreSQL (' + pgUrl.split('@')[1] + ')');
      return initPostgresSchema(pool);
    })
    .catch((err) => {
      console.warn(`[Database] PostgreSQL connection failed (${err.message}). Falling back to local SQLite...`);
      try {
        const Database = require('better-sqlite3');
        dbClient = new Database(sqlitePath);
        isPostgres = false;
        initSqliteSchema(dbClient);
        console.log(`[Database] Connected to local SQLite fallback (${sqlitePath})`);
      } catch (sqErr) {
        console.error('[Database] Failed to initialize SQLite fallback:', sqErr.message);
      }
    });
} else {
  // Local development without DATABASE_URL
  try {
    const Database = require('better-sqlite3');
    dbClient = new Database(sqlitePath);
    isPostgres = false;
    initSqliteSchema(dbClient);
    console.log(`[Database] Running with SQLite (${sqlitePath})`);
  } catch (err) {
    console.warn(`[Database] SQLite init error: ${err.message}. Initializing PostgreSQL...`);
  }
}

// -------------------------------------------------------------
// Unified Query Executor (Cross-Engine SQL Translation)
// -------------------------------------------------------------
async function queryDB(sql, params = []) {
  if (isPostgres && dbClient) {
    const pgSql = convertQuestionMarksToDollarPlaceholders(sql);
    const res = await dbClient.query(pgSql, params);
    return res.rows;
  } else if (dbClient && typeof dbClient.prepare === 'function') {
    const stmt = dbClient.prepare(sql);
    return Promise.resolve(stmt.all(...params));
  } else {
    throw new Error('Database client is not connected or initialized.');
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

  if (!rows || rows.length === 0) return null;
  const r = rows[0];

  return {
    total_machines: parseInt(r.total_machines || 0, 10),
    active_count: parseInt(r.active_count || 0, 10),
    problem_count: parseInt(r.problem_count || 0, 10),
    average_yield: parseFloat(r.average_yield || 0),
    total_shots: parseInt(r.total_shots || 0, 10),
    total_pass: parseInt(r.total_pass || 0, 10),
    total_defect: parseInt(r.total_defect || 0, 10)
  };
}

module.exports = {
  queryDB,
  getMachineTelemetry,
  getProblematicMachines,
  getFactorySummary
};
