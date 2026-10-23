const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.SQLITE_PATH || path.resolve(__dirname, '../../data/scada.db');
const JSON_PATH = path.resolve(__dirname, '../../data/belton_slides_database.json');

let inMemorySlides = null;
let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}

function loadAllSlides(forceReload = false) {
  if (!inMemorySlides || forceReload) {
    if (fs.existsSync(JSON_PATH)) {
      try {
        inMemorySlides = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
      } catch (err) {
        console.warn('[SlideKnowledgeDB] Could not parse JSON slides:', err.message);
      }
    }
    if (!inMemorySlides) {
      const database = getDb();
      inMemorySlides = database.prepare(`
        SELECT doc_code, doc_name, customer, doc_type, filename, page_number, title, content, char_count
        FROM slide_pages
        ORDER BY doc_code, page_number
      `).all();
    }
  }
  return inMemorySlides;
}

// Domain keywords for segmenting Thai text queries without spaces
const DOMAIN_KEYWORDS = [
  // Exam, Passing Criteria, HR
  'เกณฑ์', 'คะแนน', 'สอบ', 'ผ่าน', 'เปอร์เซ็นต์', '80%', '100%', 'อบรม', 'แบบทดสอบ', 'ประเมิน', 'hr', 'human resource', 'ข้อสอบ',
  // Seagate Workmanship Standards & Quality Inspection
  'seagate', 'ซีเกท', 'spe', 'raw material', 'วัตถุดิบ', 'hookup', 'ฮุกอัพ', 'tray', 'tray washing', 'ถาดล้าง', 'ถาดเปียก', 'wet tray', 'cover damper',
  'broken wire', 'ลวดหัก', 'ลวดขาด', 'expose wire', 'ลวดเปลือย', 'poor tinning', 'tinning', 'ชุบดีบุก', 'loose coil', 'คอยล์หลวม',
  'dent wire', 'ลวดบี้', 'kink', 'ลวดงอ', 'solder ball', 'เม็ดบัดกรี', 'ลูกตะกั่ว', 'flux', 'ฟลักซ์', 'void epoxy', 'epoxy', 'กาวอีพอกซี',
  'stiffener', 'bent', 'บิดงอ', 'scratch', 'รอยขีดข่วน', 'dent', 'รอยบุบ', 'burr', 'เสี้ยน', 'particle', 'ฝุ่น', 'สิ่งแปลกปลอม',
  'oxidation', 'สนิม', 'rust', 'grease', 'คราบน้ำมัน', 'oil', 'accept', 'reject', 'ยอมรับ', 'ปฏิเสธ', 'เกณฑ์สเปค', 'defect', 'ของเสีย',
  // Gowning & Cleanroom Entry / Exit
  'แต่งตัว', 'ใส่ชุด', 'สวมชุด', 'ถอดชุด', 'ชุดคลีนรูม', 'หมวก', 'hairnet', 'หน้ากาก', 'mask', 'face mask',
  'จั๊มสูท', 'jumpsuit', 'smock', 'รองเท้า', 'booties', 'plant shoes', 'ถุงมือ', 'gloves',
  'ใส่อันไหนก่อน', 'ใส่อะไรก่อน', 'ลำดับการสวม', 'ลำดับการใส่', 'ถอดอันไหนก่อน', 'ลำดับการถอด',
  'ขั้นตอนการสวม', 'ขั้นตอนการถอด', 'gowning sequence', 'degowning sequence', 'กี่ขั้นตอน',
  'แอร์ชาวเวอร์', 'air shower', 'ผ้าดำ', 'คราบขาว', 'ล้างหน้า', 'เช็ดหน้า', 'พับ wiper', 'ipa',
  // Contamination
  'ซิลิโคน', 'silicone', 'polysiloxane', 'nvs', 'talc', 'ทัลค์', 'แป้ง', 'sio2', 'ควอตซ์',
  'mesa', 'ghost', 'outgas', 'สารระเหย', 'เครื่องสำอาง', 'ลิปสติก', 'ครีม', 'โลชั่น',
  // Discipline, Violations, Penalties
  'กฎ', 'ระเบียบ', 'วินัย', 'บทลงโทษ', 'พักงาน', 'ให้ออก', 'เตือน', 'หนังสือเตือน',
  'major', 'minor', 'critical', 'c1', 'c2', 'pass box', 'ชำรุด', 'เคสโทรศัพท์',
  // Manufacturing Processes
  'pcba', 'pi-16-09-0001', 'microclean', 'topfill', 'dry baking', 'spi', 'pics', 'pcba routing',
  'fcof', 'aca', 'apfa', 'coil', 'coil winding', 'wms', 'flex baking', 'solder paste',
  'die placement', 'reflow', 'underfill', 'dispensing', 'snap cure', 'aoi',
  'cleaning', 'x-ray', 'qmax', 'fvmi', 'oqa', 'packing',
  // ESD & EPA
  'esd', 'epa', 'wrist strap', 'สายรัดข้อมือ', 'สายกราวด์', 'ionizer', 'table mat',
  'hbm', 'cdm', 'mm', '100v', '200v', '35v', 'insulator', 'ฉนวน', 'ground', 'drag chain',
  'โซ่กราวด์', 'รถเข็น', 'epa gate', 'preamp'
];

const HIGH_PRIORITY_TERMS = [
  'pi-16-09-0001', 'pcba', 'microclean', 'topfill', 'spi', 'pics',
  'spe', 'seagate', 'broken wire', 'expose wire', 'tinning', 'solder ball', 'wet tray', 'tray washing',
  'raw material', 'hookup', 'stiffener', 'accept', 'reject', 'defect', 'รอยบุบ', 'ลวดหัก', 'ลวดเปลือย',
  'fcof', 'aca', 'apfa', 'coil', 'silicone', 'ซิลิโคน', 'nvs', 'talc', 'ทัลค์', 'แป้ง',
  'wrist strap', 'ionizer', 'hbm', 'cdm', 'mm', 'major', 'minor', 'critical', '80%',
  'gowning', 'degowning', 'air shower', 'penalty', 'เกณฑ์', 'สอบ', 'คะแนน', 'บทลงโทษ', 'ผ้าดำ',
  'ชุดคลีนรูม', 'แต่งตัว', 'ใส่ชุด', 'สวมชุด', 'ถอดชุด', 'face mask', 'hairnet', 'booties', 'epa gate',
  'ใส่อันไหนก่อน', 'ใส่อะไรก่อน', 'ลำดับการสวม', 'ลำดับการใส่', 'ถอดอันไหนก่อน', 'ลำดับการถอด',
  'ขั้นตอนการสวม', 'ขั้นตอนการถอด', 'gowning sequence', 'degowning sequence'
];

/**
 * Smart Search across all 7,000+ Belton, Seagate, Western Digital, Hitachi, BYD, Innolight pages
 * Uses SQLite FTS5 BM25 index with fallback to in-memory scored ranking
 * @param {string} query - The search query (Thai or English)
 * @param {number} limit - Maximum number of results to return (default: 3)
 * @param {object} options - Optional filters { customer, doc_type }
 */
function searchSlideKnowledge(query, limit = 3, options = {}) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const { customer, doc_type } = options;
  const lowerQ = query.toLowerCase().trim();

  // 1. High-Performance SQLite FTS5 Full-Text Search
  try {
    const database = getDb();
    const hasFts = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='slide_pages_fts'").get();
    if (hasFts) {
      const tokens = [];
      const codeMatch = lowerQ.match(/(?:PI|SPE)-[0-9]{2}-[0-9]{2}[A-Za-z]?-[0-9]{2,4}|(?:PI|SPE)-[0-9]{2}-[0-9]{2}[A-Za-z]?-[0-9]{2}/i);
      if (codeMatch) {
        tokens.push('"' + codeMatch[0].replace(/"/g, '') + '"');
      }

      for (const kw of DOMAIN_KEYWORDS) {
        if (lowerQ.includes(kw.toLowerCase())) {
          tokens.push('"' + kw + '"');
        }
      }

      const words = lowerQ.replace(/[^\w\s\u0E00-\u0E7F]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
      const cleanWords = words.filter(w => !['hi', 'hello', 'how', 'what', 'why', 'and', 'the', 'for', 'of', 'is', 'to', 'in'].includes(w.toLowerCase()));
      cleanWords.slice(0, 5).forEach(w => tokens.push('"' + w + '"*'));

      if (tokens.length === 0) {
        tokens.push('"' + lowerQ.slice(0, 20).replace(/["*]/g, '') + '"*');
      }

      const ftsMatchString = tokens.slice(0, 8).join(' OR ');
      let sql = `SELECT doc_code, doc_name, customer, doc_type, page_number, title, snippet(slide_pages_fts, 6, '', '', '...', 35) as snippet, bm25(slide_pages_fts) as rank FROM slide_pages_fts WHERE slide_pages_fts MATCH ?`;
      const params = [ftsMatchString];

      if (customer && customer !== 'all') {
        sql += ' AND customer = ?';
        params.push(customer);
      }
      if (doc_type && doc_type !== 'all') {
        sql += ' AND doc_type = ?';
        params.push(doc_type);
      }

      sql += ' ORDER BY CASE WHEN lower(doc_code) = lower(?) THEN 0 ELSE 1 END, rank LIMIT ?';
      params.push(codeMatch ? codeMatch[0] : lowerQ, limit);

      const ftsResults = database.prepare(sql).all(...params);
      if (ftsResults.length > 0) {
        return ftsResults.map(item => ({
          doc_code: item.doc_code,
          doc_name: item.doc_name,
          customer: item.customer,
          doc_type: item.doc_type,
          page_number: item.page_number,
          title: item.title,
          snippet: item.snippet || ''
        }));
      }
    }
  } catch (err) {
    console.warn('[SlideKnowledgeDB] SQLite FTS5 search fallback to in-memory:', err.message);
  }

  // 2. Fallback to in-memory array search
  const slides = loadAllSlides();

  // Extract domain keywords from Thai and English query with boundary safety
  const tokens = new Set();
  for (const kw of DOMAIN_KEYWORDS) {
    const kwLower = kw.toLowerCase();
    if (/^[a-z0-9_-]+$/.test(kwLower)) {
      const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
      if (regex.test(lowerQ)) {
        tokens.add(kwLower);
      }
    } else {
      if (lowerQ.includes(kwLower)) {
        tokens.add(kwLower);
      }
    }
  }

  const engWords = lowerQ.match(/[a-z0-9%_-]{2,}/g) || [];
  engWords.filter(w => !['hi','hello','how','what','why','and','the','for','of','is'].includes(w)).forEach(w => tokens.add(w));

  if (tokens.size === 0) {
    const thaiMatches = lowerQ.match(/[\u0E00-\u0E7F]+/g) || [];
    for (const tm of thaiMatches) {
      if (tm.length >= 2) {
        tokens.add(tm.substring(0, Math.min(tm.length, 6)));
      }
    }
  }

  if (tokens.size === 0) return [];

  const DEFECT_SPECIFIC_TERMS = [
    'broken wire', 'expose wire', 'loose coil', 'poor tinning', 'dent wire', 'kink',
    'wet tray', 'solder ball', 'void epoxy', 'stiffener', 'burr', 'oxidation',
    'misalignment damper', 'damper', 'bent arm', 'bent', 'scratch', 'dent', 'lifted',
    'contamination', 'particle', 'peeling', 'double damper', 'missing damper',
    'ลวดหัก', 'ลวดเปลือย', 'ถาดเปียก', 'เม็ดบัดกรี', 'รอยบุบ', 'รอยขีดข่วน'
  ];

  const scored = slides.map(s => {
    let score = 0;
    const sTitle = (s.title || '').toLowerCase();
    const sContent = (s.content || '').toLowerCase();
    const sDocCode = (s.doc_code || '').toLowerCase();

    // Customer or DocType filters if specified
    if (customer && customer !== 'all' && s.customer && s.customer.toLowerCase() !== customer.toLowerCase()) {
      return { ...s, score: -1 };
    }
    if (doc_type && doc_type !== 'all' && s.doc_type && s.doc_type.toLowerCase() !== doc_type.toLowerCase()) {
      return { ...s, score: -1 };
    }

    // Exact doc_code match bonus
    if (lowerQ.includes(sDocCode)) {
      score += 200;
    }

    // Specific defect phrase bonus
    for (const dt of DEFECT_SPECIFIC_TERMS) {
      if (lowerQ.includes(dt)) {
        if (sTitle.includes(dt)) {
          score += 350;
        } else if (sContent.split('\n').some(l => /^\s*\d+\.\d+/i.test(l) && l.toLowerCase().includes(dt))) {
          score += 350;
        }
        if (sContent.includes(dt)) score += 80;
      }
    }

    // Cleanroom Gowning & Degowning sequence bonus
    const isGowningOrderQuery = /(สวมชุด|ใส่ชุด|ใส่อันไหนก่อน|ใส่อะไรก่อน|ลำดับการสวม|ลำดับการใส่|ขั้นตอนการสวม|gowning sequence|แต่งตัว)/i.test(lowerQ);
    const isDegowningOrderQuery = /(ถอดชุด|ถอดอันไหนก่อน|ถอดอะไรก่อน|ลำดับการถอด|ขั้นตอนการถอด|degowning)/i.test(lowerQ);

    if (isGowningOrderQuery) {
      if (sDocCode === 'tm-00-00-05_3') {
        if (s.page_number === 1) score += 650;
        else if (s.page_number >= 2 && s.page_number <= 11) score += 420;
      }
      if (sDocCode === 'tm-00-00-05_1' && s.page_number === 33) score += 480;
    }

    if (isDegowningOrderQuery) {
      if (sDocCode === 'tm-00-00-05_3') {
        if (s.page_number === 12) score += 650;
        else if (s.page_number >= 13 && s.page_number <= 22) score += 420;
      }
      if (sDocCode === 'tm-00-00-05_1' && s.page_number === 33) score += 480;
    }

    if (sContent.includes(lowerQ)) score += 80;

    for (const t of tokens) {
      const isHigh = HIGH_PRIORITY_TERMS.some(hp => t.includes(hp) || hp.includes(t));
      const mult = isHigh ? 8 : 1;

      if (sTitle.includes(t)) {
        score += 25 * mult;
      }

      if (sContent.includes(t)) {
        const occurrences = (sContent.split(t).length - 1);
        score += Math.min(occurrences, 6) * 4 * mult;
      }
    }

    return { ...s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter(s => s.score > 0).slice(0, limit);

  return matched.map(item => {
    let text = item.content || '';
    if (text.length > 1200) {
      let bestPos = 0;
      const lowerText = text.toLowerCase();
      for (const t of tokens) {
        const pos = lowerText.indexOf(t);
        if (pos > 0) {
          bestPos = Math.max(0, pos - 80);
          break;
        }
      }
      text = (bestPos > 0 ? '...' : '') + text.substring(bestPos, bestPos + 1100) + '...';

      if (item.content.includes('[สรุปเกณฑ์ปฏิเสธ') && !text.includes('[สรุปเกณฑ์ปฏิเสธ')) {
        const noteMatch = item.content.match(/\[สรุปเกณฑ์ปฏิเสธ.*?$/s);
        if (noteMatch) {
          text += '\n' + noteMatch[0];
        }
      }
    }

    return {
      doc_code: item.doc_code,
      doc_name: item.doc_name,
      customer: item.customer || 'General',
      doc_type: item.doc_type || 'SPE',
      page_number: item.page_number,
      title: item.title,
      snippet: text
    };
  });
}

/**
 * Retrieve exact slide page by document code and page number
 */
function getSlidePage(docCode, pageNumber) {
  const slides = loadAllSlides();
  const num = parseInt(pageNumber, 10);
  return slides.find(s => s.doc_code === docCode && s.page_number === num) || null;
}

/**
 * Reload slide knowledge base from disk
 */
let inMemoryExamQuestions = null;

function loadAllExamQuestions(forceReload = false) {
  if (inMemoryExamQuestions && !forceReload) return inMemoryExamQuestions;
  const examPath = path.resolve(__dirname, '../../data/seagate_exam_questions.json');
  if (fs.existsSync(examPath)) {
    try {
      inMemoryExamQuestions = JSON.parse(fs.readFileSync(examPath, 'utf8'));
      return inMemoryExamQuestions;
    } catch (e) {
      console.warn('[Exam DB] Failed to load exam questions:', e.message);
    }
  }
  return [];
}

/**
 * Match user query against the official Seagate Master Exam questions
 */
function searchExamQuestion(query) {
  if (!query || typeof query !== 'string') return null;
  const exams = loadAllExamQuestions();
  if (exams.length === 0) return null;

  const lowerQ = query.toLowerCase();
  const isExamLike = /^\s*\d+\.|\bหมายถึง\b|\bเกณฑ์สเปคกำหนดว่า\b|\bยอมรับได้\s*\(Accept\)|\bถือเป็นงานเสีย\s*\(Reject\)|\bถูกหรือผิด\b|\bตรวจข้อสอบ\b/i.test(query);
  if (!isExamLike) return null;

  const numMatch = query.match(/^\s*(\d+)\./);
  const qNum = numMatch ? parseInt(numMatch[1], 10) : null;

  let bestMatch = null;
  let highestScore = 0;

  for (const eq of exams) {
    let score = 0;
    const defectMatch = eq.question_text.match(/^([^หมายถึง]+)หมายถึง/);
    if (defectMatch) {
      const defectName = defectMatch[1].trim().toLowerCase();
      if (lowerQ.includes(defectName)) {
        score += 150;
      }
    }

    if (qNum && eq.question_number === qNum) {
      score += 80;
    }

    const words = eq.question_text.split(/[\s,()]+/).filter(w => w.length >= 3);
    for (const w of words) {
      if (lowerQ.includes(w.toLowerCase())) score += 5;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = eq;
    }
  }

  if (bestMatch && highestScore >= 120) {
    return {
      ...bestMatch,
      confidence_score: highestScore
    };
  }

  return null;
}

function reloadSlideKnowledge() {
  inMemorySlides = null;
  inMemoryExamQuestions = null;
  return loadAllSlides(true);
}

module.exports = {
  searchSlideKnowledge,
  getSlidePage,
  reloadSlideKnowledge,
  searchExamQuestion,
  loadAllExamQuestions
};
