const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '../../data/scada.db');
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
        console.warn('⚠️ [SlideKnowledgeDB] Could not parse JSON slides:', err.message);
      }
    }
    if (!inMemorySlides) {
      const database = getDb();
      inMemorySlides = database.prepare(`
        SELECT doc_code, doc_name, filename, page_number, title, content, char_count
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
  'แต่งตัว', 'ถอดชุด', 'ชุดคลีนรูม', 'หมวก', 'hairnet', 'หน้ากาก', 'mask', 'face mask',
  'จั๊มสูท', 'jumpsuit', 'smock', 'รองเท้า', 'booties', 'ถุงมือ', 'gloves',
  'แอร์ชาวเวอร์', 'air shower', 'ผ้าดำ', 'คราบขาว', 'ล้างหน้า', 'เช็ดหน้า', 'พับ wiper', 'ipa',
  // Contamination
  'ซิลิโคน', 'silicone', 'polysiloxane', 'nvs', 'talc', 'ทัลค์', 'แป้ง', 'sio2', 'ควอตซ์',
  'mesa', 'ghost', 'outgas', 'สารระเหย', 'เครื่องสำอาง', 'ลิปสติก', 'ครีม', 'โลชั่น',
  // Discipline, Violations, Penalties
  'กฎ', 'ระเบียบ', 'วินัย', 'บทลงโทษ', 'พักงาน', 'ให้ออก', 'เตือน', 'หนังสือเตือน',
  'major', 'minor', 'critical', 'c1', 'c2', 'pass box', 'ชำรุด', 'เคสโทรศัพท์',
  // Manufacturing Processes
  'fcof', 'aca', 'apfa', 'coil', 'coil winding', 'wms', 'flex baking', 'solder paste',
  'die placement', 'reflow', 'underfill', 'dispensing', 'snap cure', 'aoi',
  'cleaning', 'x-ray', 'qmax', 'fvmi', 'oqa', 'packing',
  // ESD & EPA
  'esd', 'epa', 'wrist strap', 'สายรัดข้อมือ', 'สายกราวด์', 'ionizer', 'table mat',
  'hbm', 'cdm', 'mm', '100v', '200v', '35v', 'insulator', 'ฉนวน', 'ground', 'drag chain',
  'โซ่กราวด์', 'รถเข็น', 'epa gate', 'preamp'
];

const HIGH_PRIORITY_TERMS = [
  'spe', 'seagate', 'broken wire', 'expose wire', 'tinning', 'solder ball', 'wet tray', 'tray washing',
  'raw material', 'hookup', 'stiffener', 'accept', 'reject', 'defect', 'รอยบุบ', 'ลวดหัก', 'ลวดเปลือย',
  'fcof', 'aca', 'apfa', 'coil', 'silicone', 'ซิลิโคน', 'nvs', 'talc', 'ทัลค์', 'แป้ง',
  'wrist strap', 'ionizer', 'hbm', 'cdm', 'mm', 'major', 'minor', 'critical', '80%',
  'gowning', 'air shower', 'penalty', 'เกณฑ์', 'สอบ', 'คะแนน', 'บทลงโทษ', 'ผ้าดำ',
  'ชุดคลีนรูม', 'แต่งตัว', 'ถอดชุด', 'face mask', 'hairnet', 'booties', 'epa gate'
];

/**
 * Smart Search across all 669 Belton & Seagate training slides
 * Sub-millisecond execution, robust Thai segmentation, priority scoring
 * @param {string} query - The search query (Thai or English)
 * @param {number} limit - Maximum number of results to return (default: 3)
 */
function searchSlideKnowledge(query, limit = 3) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const slides = loadAllSlides();
  const lowerQ = query.toLowerCase();

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

  // Extract alphanumeric tokens
  const engWords = lowerQ.match(/[a-z0-9%_-]{2,}/g) || [];
  engWords.forEach(w => tokens.add(w));

  // If no known keywords matched, extract 2-4 char ngrams from Thai text
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

    // Exact doc_code match bonus (e.g. SPE-01-08-01, TM-00-00-05)
    if (lowerQ.includes(sDocCode)) {
      score += 200;
    }

    // Specific defect phrase bonus
    for (const dt of DEFECT_SPECIFIC_TERMS) {
      if (lowerQ.includes(dt)) {
        if (sTitle.includes(dt)) {
          score += 350;
        } else if (sContent.split('\n').some(l => /^\s*\d+\.\d+/i.test(l) && l.toLowerCase().includes(dt))) {
          // Defect section header inside slide content (e.g. 6.1.9 Misalignment Damper)
          score += 350;
        }
        if (sContent.includes(dt)) score += 80;
      }
    }

    // Exact phrase match bonus
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

      // If enriched rejection note was cut off, ensure it is appended
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
      console.warn('⚠️ [Exam DB] Failed to load exam questions:', e.message);
    }
  }
  return [];
}

/**
 * Match user query against the 180 official Seagate Master Exam questions
 */
function searchExamQuestion(query) {
  if (!query || typeof query !== 'string') return null;
  const exams = loadAllExamQuestions();
  if (exams.length === 0) return null;

  const lowerQ = query.toLowerCase();
  
  // Check if query looks like an exam question or statement verification
  const isExamLike = /^\s*\d+\.|\bหมายถึง\b|\bเกณฑ์สเปคกำหนดว่า\b|\bยอมรับได้\s*\(Accept\)|\bถือเป็นงานเสีย\s*\(Reject\)|\bถูกหรือผิด\b|\bตรวจข้อสอบ\b/i.test(query);
  if (!isExamLike) return null;

  const numMatch = query.match(/^\s*(\d+)\./);
  const qNum = numMatch ? parseInt(numMatch[1], 10) : null;

  let bestMatch = null;
  let highestScore = 0;

  for (const eq of exams) {
    let score = 0;
    const eqLower = eq.full_question.toLowerCase();

    // Check defect name / title similarity
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

    // Keyword overlap
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
