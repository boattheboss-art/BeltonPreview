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

function loadAllSlides() {
  if (!inMemorySlides) {
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
  'เกณฑ์', 'คะแนน', 'สอบ', 'ผ่าน', 'เปอร์เซ็นต์', '80%', '100%', 'อบรม', 'แบบทดสอบ', 'ประเมิน', 'hr', 'human resource',
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
  'fcof', 'aca', 'apfa', 'coil', 'silicone', 'ซิลิโคน', 'nvs', 'talc', 'ทัลค์', 'แป้ง',
  'wrist strap', 'ionizer', 'hbm', 'cdm', 'mm', 'major', 'minor', 'critical', '80%',
  'gowning', 'air shower', 'penalty', 'เกณฑ์', 'สอบ', 'คะแนน', 'บทลงโทษ', 'ผ้าดำ',
  'ชุดคลีนรูม', 'แต่งตัว', 'ถอดชุด', 'face mask', 'hairnet', 'booties', 'epa gate'
];

/**
 * Smart Search across all 273 Belton training slides
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

  // Extract domain keywords from Thai query
  const tokens = new Set();
  for (const kw of DOMAIN_KEYWORDS) {
    if (lowerQ.includes(kw.toLowerCase())) {
      tokens.add(kw.toLowerCase());
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

  const scored = slides.map(s => {
    let score = 0;
    const sTitle = (s.title || '').toLowerCase();
    const sContent = (s.content || '').toLowerCase();

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
    if (text.length > 650) {
      let bestPos = 0;
      const lowerText = text.toLowerCase();
      for (const t of tokens) {
        const pos = lowerText.indexOf(t);
        if (pos > 0) {
          bestPos = Math.max(0, pos - 100);
          break;
        }
      }
      text = (bestPos > 0 ? '...' : '') + text.substring(bestPos, bestPos + 600) + '...';
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

module.exports = {
  searchSlideKnowledge,
  getSlidePage
};
