const { toolsDefinition } = require('./tools/schemas.js');
const { executeTool } = require('./tools/handlers.js');
const { searchSlideKnowledge, searchExamQuestion } = require('./knowledge/slide_knowledge_db.js');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5:14b';
const NUM_GPU = process.env.NUM_GPU ? parseInt(process.env.NUM_GPU, 10) : (MODEL_NAME.includes('14b') ? 26 : undefined);
const NUM_CTX = process.env.NUM_CTX ? parseInt(process.env.NUM_CTX, 10) : (MODEL_NAME.includes('14b') ? 6144 : 8192);

async function fetchWithRetry(url, options, maxRetries = 2, delayMs = 600) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
      console.warn(`[Orchestrator Fetch Warning] Attempt ${attempt}/${maxRetries} failed: ${err.message}. ${attempt < maxRetries ? `Retrying in ${delayMs}ms...` : ''}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

const CHINESE_TO_THAI_MAP = [
  [/\b指的是\b|指的是/g, 'หมายถึง '],
  [/是指/g, 'คือ '],
  [/不符合上述标准/g, 'ไม่เป็นไปตามเกณฑ์มาตรฐานข้างต้น'],
  [/通常发生在/g, 'มักเกิดขึ้นที่ '],
  [/大于或等于/g, 'มากกว่าหรือเท่ากับ '],
  [/小于或等于/g, 'น้อยกว่าหรือเท่ากับ '],
  [/大于/g, 'มากกว่า '],
  [/小于/g, 'น้อยกว่า '],
  [/电线断裂/g, 'การหักของเส้นไฟ'],
  [/的现象|现象/g, ''],
  [/的情况/g, ''],
  [/通常会导致/g, 'มักส่งผลให้ '],
  [/会导致/g, 'ส่งผลให้ '],
  [/如果|若/g, 'หาก '],
  [/断裂后/g, 'หลังจากหักแล้ว '],
  [/剩余的/g, 'ที่เหลืออยู่ '],
  [/低于正常值/g, 'ต่ำกว่าเกณฑ์ปกติ'],
  [/正常长度/g, 'ความยาวปกติ'],
  [/长度/g, 'ความยาว '],
  [/仍然/g, 'ยังคง '],
  [/可能由/g, 'อาจเกิดจาก '],
  [/设备磨损/g, 'การสึกหรอของอุปกรณ์'],
  [/压力异常/g, 'แรงดันลมผิดปกติ'],
  [/产品报废/g, 'เกิดชิ้นงานเสีย (Reject)'],
  [/需要对/g, 'ต้องดำเนินการกับ '],
  [/进行维护检查/g, 'ตรวจสอบและซ่อมบำรุง'],
  [/在正常范围内/g, 'อยู่ในเกณฑ์มาตรฐาน'],
  [/并确保/g, 'และตรวจสอบยืนยัน '],
  [/所有参数/g, 'ค่าพารามิเตอร์ทั้งหมด '],
  [/影响生产效率和质量控制/g, 'กระทบต่อประสิทธิภาพการผลิต'],
  [/在\s*([a-zA-Z0-9_\s-]+)\s*上/g, 'บริเวณ $1'],
  [/上的/g, ' บน '],
  [/上/g, ' บน ']
];

function cleanOutputText(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/<function[_-]call>.*?<\/function[_-]call>/gis, '')
    .replace(/<function[_-]name>.*?<\/function[_-]name>/gis, '')
    .replace(/<tool[_-]call>.*?<\/tool[_-]call>/gis, '')
    .replace(/<query>.*?<\/query>/gis, '')
    // Strip repetitive robotic opening filler phrases if emitted
    .replace(/^(?:จากการตรวจสอบข้อมูลในระบบ(?:ฐานข้อมูล)?(?:พบว่า)?[,\s]*|ตามข้อมูล(?:ในระบบฐานข้อมูล)?[,\s]*)/i, '')
    // Normalize pronouns and polite particles to consistent engineering persona
    .replace(/สวัสดีค่ะ/g, 'สวัสดีครับ')
    .replace(/ฉัน/g, 'ผม')
    .replace(/ค่ะ/g, 'ครับ')
    // Strip echoed prompt headers if leaked
    .replace(/\[EXECUTIVE COMMUNICATION PROTOCOL.*?$/is, '')
    .replace(/\[FEW-SHOT.*?$/is, '')
    .replace(/\[STRICT.*?$/is, '')
    .replace(/\[ข้อกำหนด.*?$/is, '')
    .replace(/\[แนวทาง.*?$/is, '')
    .replace(/\[คำสั่ง.*?$/is, '')
    .replace(/\[คำแนะนำ.*?$/is, '')
    .replace(/\[ข้อมูลสไลด์.*?$/is, '')
    // Strip dismissive phrases if emitted
    .replace(/\n+(?:มีเพียงแค่นี้เท่านั้น(?:ค่ะ|ครับ)|มีเพียงแค่นี้(?:ค่ะ|ครับ)|มีแค่นี้(?:ค่ะ|ครับ)).*$/is, '');

  // Intercept & translate any Chinese fragments to Thai
  for (const [pat, rep] of CHINESE_TO_THAI_MAP) {
    cleaned = cleaned.replace(pat, rep);
  }

  // Convert full-width Chinese punctuation and remove any leftover CJK glyphs
  cleaned = cleaned
    .replace(/，/g, ', ')
    .replace(/、/g, ', ')
    .replace(/。/g, '')
    .replace(/：/g, ': ')
    .replace(/；/g, '; ')
    .replace(/（/g, ' (')
    .replace(/）/g, ') ')
    .replace(/【/g, ' [')
    .replace(/】/g, '] ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/？/g, '')
    .replace(/[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g, '')
    .replace(/[,，、\s]+$/g, '')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

function isGreetingOrChitchat(userMsg) {
  if (!userMsg) return false;
  const m = userMsg.trim().toLowerCase();

  // Exclude if technical keywords or question numbers are present
  if (/\b(spe|tm)-[0-9]{2}/i.test(m) || /(coil|wire|tray|damper|fcof|aca|hookup|burr|scratch|dent|เครื่อง|ตู้|วาร์ป|กล้อง|\b\d+\.|\bข้อ\s*\d+)/i.test(m)) {
    return false;
  }

  // Meta identity / capability questions
  if (/(คุณคือใคร|นายคือใคร|ทำอะไรได้บ้าง|ช่วยอะไรได้บ้าง|แนะนำตัว|ทำอะไรได้|ช่วยอะไรได้|มีความสามารถอะไร|ใครสร้างคุณ|รู้จักโรงงานไหม)/i.test(m)) {
    return true;
  }

  // General greetings & pleasantries
  if (/^(?:สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|hi|hello|hey|yo|morning|good morning|good afternoon|good evening|สบายดีไหม|เป็นไงบ้าง|ทำอะไรอยู่)/i.test(m)) {
    return true;
  }

  if (['hi', 'hello', 'hey', 'yo', 'หวัดดี', 'สวัสดี', 'ดีครับ', 'ดีค่ะ'].includes(m)) {
    return true;
  }

  return false;
}

function isThankYou(userMsg) {
  if (!userMsg) return false;
  const m = userMsg.trim().toLowerCase();
  return /^(?:ขอบคุณ(?:ครับ|ค่ะ|มาก)?|ขอบใจ(?:ครับ|ค่ะ|จ้า)?|thx|thanks|thank you)\s*[!~.]*$/i.test(m);
}

function extractContextKeywords(history) {
  if (!history || !Array.isArray(history) || history.length === 0) return '';
  for (let i = history.length - 1; i >= 0; i--) {
    const text = history[i].content || history[i].text || '';
    const docMatch = text.match(/\b(SPE|TM|PI|II)-[0-9]{2}-[0-9]{2}-[0-9]{2,4}(?:_[0-9]+)?\b/gi);
    const terms = text.match(/\b(pcba|underfill|topfill|spi|pics|routing|microclean|broken wire|expose wire|loose coil|tin wire|tinning|wet tray|damper|hard burr|scratch|dent|solder ball|stiffener|hookup|pcca|fcof|aca|apfa|cleanroom|esd|silicone|wire|coil)\b/gi);
    const parts = [];
    if (docMatch) parts.push(...docMatch);
    if (terms) parts.push(...terms);
    if (parts.length > 0) {
      return [...new Set(parts)].join(' ');
    }
  }
  return '';
}

function isFollowUpQuery(userMsg) {
  if (!userMsg) return false;
  // Normalize double-e (เ + เ -> แ)
  const m = userMsg.trim().replace(/\u0e40\u0e40/g, 'แ').toLowerCase();

  // If user explicitly mentions cleanroom, dress code, or specific engineering topics, it is a new search, NOT a multi-turn carry-over!
  const hasSpecificDomainTopic = /(ชุด|คลีนรูม|cleanroom|สวม|ใส่|ถอด|gowning|degowning|booties|hairnet|jumpsuit|mask|spe-|tm-|pi-|ii-|pcba|underfill|topfill|spi|pics|coil|ขดลวด|คอยล์|wire|ลวด|tray|ถาด|damper|burr|scratch|dent|solder|บัดกรี|epoxy|fcof|aca|apfa|esd|epa|เครื่อง|ตู้|วาร์ป|กล้อง)/i.test(m);
  if (hasSpecificDomainTopic) {
    if (/^(แล้วสเปกล่ะ|แล้วเกณฑ์ล่ะ|แล้วยังไง|แล้วไง|มีอะไรอีก|ขยายความหน่อย|ขอรายละเอียดเพิ่ม)$/i.test(m)) {
      return true;
    }
    return false;
  }

  if (m.length <= 25) return true;
  if (/^(มีอะไรบ้าง|มีอะไรบ้างละ|มีอะไรอีก|แล้วยังไง|แล้วไง|เท่าไหร่|ทำไม|ขยายความ|ขอรายละเอียด|ยังไงต่อ|แล้วต้องทำไง|แล้วสเปก|แล้วเกณฑ์|กี่|ทำไมล่ะ)/i.test(m)) {
    return true;
  }
  return false;
}

const BELTON_MANUFACTURING_PROCESS_FLOWS = {
  coil_winding: {
    key: 'coil_winding',
    productName: 'Coil Winding',
    docCode: 'TM-00-00-01',
    pages: 'หน้า 14-27',
    coverPage: 13,
    totalSteps: 14,
    matches: (msg) => {
      const m = msg.toLowerCase();
      const isCoil = /(coil\s*winding|ขดลวด|คอยล์\s*ไวน์ดิง)/i.test(m);
      const isFlow = /(ขั้นตอน|กระบวนการ|flow|process|มีอะไรบ้าง|กี่ขั้นตอน|กี่ขั้น)/i.test(m);
      return isCoil && isFlow;
    },
    steps: [
      { step: 1, page: 14, name: 'Winding & Unwire', desc: 'กรอขดลวดคอยล์และเตรียมตำแหน่ง Lead wire' },
      { step: 2, page: 15, name: 'Out gassing', desc: 'อบไล่แก๊ส (Baking 180 ± 5 °C นาน 6 ชั่วโมง)' },
      { step: 3, page: 16, name: 'Dip coating', desc: 'จุ่มเคลือบผิวคอยล์ด้วยกาว Epoxy EPO-TEK 353ND' },
      { step: 4, page: 17, name: 'Baking', desc: 'อบกาวในเตาอบ (Baking oven)' },
      { step: 5, page: 18, name: 'Auto 3 in 1 & UV cure', desc: 'จัดแนวสาย (Routing), ตัดสาย (Cutting), แต้มกาว UV และอบ UV' },
      { step: 6, page: 19, name: 'Auto Lead wire stripping', desc: 'ปอกฉนวนสาย Lead wire ด้วยเครื่อง Stripping' },
      { step: 7, page: 20, name: 'Coil cleaning', desc: 'ทำความสะอาดขจัดคราบตกค้างในถัง Ultrasonic cleaning' },
      { step: 8, page: 21, name: 'Coil thickness inspection', desc: 'ตรวจวัดความหนาของคอยล์ด้วยเกจวัดเทียบสเปก' },
      { step: 9, page: 22, name: 'Tube cutting', desc: 'ตัดความยาวส่วนเกินของท่อ Tube' },
      { step: 10, page: 23, name: 'Tube insert & wire tracking', desc: 'สวมท่อเข้าสายไฟและจัดตำแหน่งสาย' },
      { step: 11, page: 24, name: 'Baking', desc: 'อบกาวซ้ำในเตาอบ' },
      { step: 12, page: 25, name: 'Coil resistance', desc: 'ตรวจสอบค่าความต้านทานไฟฟ้าของขดลวดคอยล์' },
      { step: 13, page: 26, name: 'Visual inspection', desc: 'ตรวจสอบความเรียบร้อยของคอยล์ด้วยสายตา' },
      { step: 14, page: 27, name: 'OQA & Packing', desc: 'ตรวจปล่อยคุณภาพขั้นสุดท้าย (OQA) และบรรจุลงบรรจุภัณฑ์' }
    ]
  },
  aca: {
    key: 'aca',
    productName: 'ACA (Actuator Coil Assembly)',
    docCode: 'TM-00-00-01',
    pages: 'หน้า 28-49',
    coverPage: 28,
    totalSteps: 21,
    matches: (msg) => {
      const m = msg.toLowerCase();
      const isAca = /(aca|actuator coil assembly)/i.test(m);
      const isFlow = /(ขั้นตอน|กระบวนการ|flow|process|มีอะไรบ้าง|กี่ขั้นตอน|กี่ขั้น)/i.test(m);
      return isAca && isFlow;
    },
    steps: [
      { step: 1, page: 29, name: 'E-block cleaning', desc: 'ทำความสะอาด E-block ด้วยคลื่นเสียงความถี่สูง Ultrasonic wash/rinse' },
      { step: 2, page: 30, name: 'Pre-curing / plasma bobbin', desc: 'อบ Pre-cure และเตรียมผิวด้วย Plasma บน Bobbin' },
      { step: 3, page: 31, name: 'Laser engraving', desc: 'ยิงเลเซอร์ระบุรหัสชิ้นงาน (CDA pressure 0.4-0.6 MPa)' },
      { step: 4, page: 32, name: 'Coil pre-heating', desc: 'อุ่นขดลวดคอยล์ก่อนเข้าสู่กระบวนการหยอดกาว' },
      { step: 5, page: 33, name: 'E-block & Coil dispensing', desc: 'หยอดกาวประกอบ E-block กับ Coil' },
      { step: 6, page: 34, name: 'Coil & bobbin dispensing', desc: 'หยอดกาวประกอบ Coil กับ Bobbin' },
      { step: 7, page: 35, name: 'Epoxy inspection / mending', desc: 'ตรวจสอบและตกแต่งแนวกาว Epoxy' },
      { step: 8, page: 36, name: '1st curing & unload', desc: 'อบกาวรอบที่ 1 และนำชิ้นงานออกจากเตา' },
      { step: 9, page: 37, name: '2nd curing & unload', desc: 'อบกาวรอบที่ 2 เพื่อให้กาวเซ็ตตัวสมบูรณ์และนำชิ้นงานออก' },
      { step: 10, page: 38, name: 'DI water cleaning', desc: 'ทำความสะอาดชิ้นงานด้วยน้ำบริสุทธิ์ DI (Deionized water)' },
      { step: 11, page: 39, name: 'Hi-pot & open test', desc: 'ทดสอบความเป็นฉนวนไฟฟ้า (Hi-pot) และการนำไฟฟ้า' },
      { step: 12, page: 40, name: 'Combine DVT & Coil height inspection', desc: 'ตรวจวัดโปรไฟล์ DVT และความสูงคอยล์' },
      { step: 13, page: 41, name: 'Coil height inspection', desc: 'ตรวจสอบความสูงของคอยล์ซ้ำเพื่อยืนยันพิกัด' },
      { step: 14, page: 42, name: 'Damper install', desc: 'ติดตั้งชิ้นส่วนแดมเปอร์ (Damper)' },
      { step: 15, page: 43, name: 'Tube length checking', desc: 'ตรวจสอบความยาวท่อ (Tube length)' },
      { step: 16, page: 44, name: 'Slit height checking', desc: 'ตรวจสอบความสูงสลิต (Slit height)' },
      { step: 17, page: 45, name: 'Resonance checking', desc: 'ตรวจสอบค่าการสั่นพ้องเรโซแนนซ์ (Resonance)' },
      { step: 18, page: 46, name: 'Arm height & tweaking', desc: 'ตรวจวัดความสูงอาร์มและปรับแต่ง (Tweaking)' },
      { step: 19, page: 47, name: 'Visual inspection', desc: 'ตรวจสอบความเรียบร้อยของชิ้นงานด้วยสายตา' },
      { step: 20, page: 48, name: 'OQA', desc: 'ตรวจสอบคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ (Sampling AQL 0.65%, C=0)' },
      { step: 21, page: 49, name: 'Packing', desc: 'บรรจุชิ้นงานลงถาด ติดฉลาก และซีลสุญญากาศ' }
    ]
  },
  fcof: {
    key: 'fcof',
    productName: 'FCOF (Flip Chip On Flex)',
    docCode: 'TM-00-00-01',
    pages: 'หน้า 50-64',
    coverPage: 50,
    totalSteps: 14,
    matches: (msg) => {
      const m = msg.toLowerCase();
      const isFcof = /(fcof|flip chip on flex)/i.test(m);
      const isFlow = /(ขั้นตอน|กระบวนการ|flow|process|มีอะไรบ้าง|กี่ขั้นตอน|กี่ขั้น)/i.test(m);
      return isFcof && isFlow;
    },
    steps: [
      { step: 1, page: 51, name: 'Flex Baking', desc: 'อบแผ่น Flex เพื่อไล่ความชื้น (ควบคุม Temp & Duration)' },
      { step: 2, page: 52, name: 'Solder Paste Printing', desc: 'พิมพ์เนื้อครีมบัดกรี (Solder Paste) ลงบนแผ่น Flex' },
      { step: 3, page: 53, name: 'SMT Placement (Chip components)', desc: 'วางชิ้นส่วนอุปกรณ์ Chip ลงบน Solder paste' },
      { step: 4, page: 54, name: 'SMT Placement (Connector placement)', desc: 'วาง Connector ด้วยหัวจับ Pick & Place' },
      { step: 5, page: 55, name: 'Die Placement (Pre-amp placement)', desc: 'วางชิป Pre-amp โดยจุ่มฟลักซ์ Tacky flux' },
      { step: 6, page: 56, name: 'Reflow Soldering', desc: 'เข้าเตาอบ Reflow หลอมประสานตะกั่ว (คุม Temp และ N2/O2)' },
      { step: 7, page: 57, name: 'Underfill Dispensing', desc: 'หยอดกาว Underfill ใต้ชิป Pre-amp เพื่อเสริมความแข็งแรง' },
      { step: 8, page: 58, name: 'AOI Inspection', desc: 'ตรวจสอบความถูกต้องด้วยระบบกล้องอัตโนมัติ (Automated Optical Inspection)' },
      { step: 9, page: 59, name: 'Snap Cure', desc: 'อบกาว Underfill ให้แห้งตัวอย่างรวดเร็ว และถ่ายลงตะกร้าล้าง' },
      { step: 10, page: 60, name: 'Flex Cleaning', desc: 'ล้างทำความสะอาดด้วยน้ำบริสุทธิ์ DI (คุม Temp, Speed, Pressure, pH, Resistivity)' },
      { step: 11, page: 61, name: 'X-Ray Inspection', desc: 'ตรวจสอบรอยเชื่อมบัดกรีและช่องว่างใต้ Pre-amp bumps ด้วยรังสี X-Ray' },
      { step: 12, page: 62, name: 'QMAX Test', desc: 'ทดสอบคุณสมบัติและการทำงานทางไฟฟ้าด้วยเครื่อง QMAX' },
      { step: 13, page: 63, name: 'FMVI / OQA', desc: 'ตรวจสอบชิ้นงานขั้นสุดท้ายด้วยกล้องจุลทรรศน์ (FVMI) และฝ่ายประกันคุณภาพ (OQA)' },
      { step: 14, page: 64, name: 'Packing', desc: 'บรรจุชิ้นงานลงบรรจุภัณฑ์และบันทึก Traveller Card' }
    ]
  },
  apfa: {
    key: 'apfa',
    productName: 'APFA (Arm Pivot Flex Assembly / Hook Up)',
    docCode: 'TM-00-00-01',
    pages: 'หน้า 65-82',
    coverPage: 65,
    totalSteps: 17,
    matches: (msg) => {
      const m = msg.toLowerCase();
      const isApfa = /(apfa|arm pivot flex assembly|hook up|hookup)/i.test(m);
      const isFlow = /(ขั้นตอน|กระบวนการ|flow|process|มีอะไรบ้าง|กี่ขั้นตอน|กี่ขั้น)/i.test(m);
      return isApfa && isFlow;
    },
    steps: [
      { step: 1, page: 66, name: 'Bending', desc: 'ดัดขึ้นรูปชิ้นงาน Flex' },
      { step: 2, page: 67, name: 'Soldering ground pin and VCM pad', desc: 'บัดกรี Ground pin และ VCM pad (คุมอุณหภูมิหัวแร้งและชนิดลวดบัดกรี)' },
      { step: 3, page: 68, name: 'Flex bracket install', desc: 'ประกอบขายึด Flex bracket' },
      { step: 4, page: 69, name: 'Load in carrier', desc: 'วางชิ้นงานลงใน Carrier รองรับ' },
      { step: 5, page: 70, name: 'AQ Cleaning', desc: 'ทำความสะอาดชิ้นงานแบบ Aqueous ด้วยน้ำบริสุทธิ์ DI' },
      { step: 6, page: 71, name: 'Unload from carrier', desc: 'ปลดชิ้นงานออกจาก Carrier' },
      { step: 7, page: 72, name: 'DCM attachment', desc: 'ประกอบชิ้นส่วน DCM' },
      { step: 8, page: 73, name: 'T-ring insertion', desc: 'สวมแหวน T-ring (คุมทิศทาง Orientation และการลงน้ำยา IPA)' },
      { step: 9, page: 74, name: 'Pivot Install', desc: 'ติดตั้งแกน Pivot (ควบคุมความสูง Pivot height และแรงกด Force)' },
      { step: 10, page: 75, name: 'VMI', desc: 'ตรวจสอบชิ้นส่วนเชิงกลด้วยสายตา/กล้องจุลทรรศน์' },
      { step: 11, page: 76, name: 'Pivot height checking', desc: 'ตรวจสอบพิกัดความสูงของ Pivot ตามสเปก' },
      { step: 12, page: 77, name: 'Arm height test', desc: 'ทดสอบความสูงของอาร์ม (Arm height)' },
      { step: 13, page: 78, name: 'Electrical test', desc: 'ทดสอบคุณสมบัติทางไฟฟ้า (Resistance, Polarity, Preamp ID)' },
      { step: 14, page: 79, name: 'Tray label attachment', desc: 'ติดฉลากระบุรายละเอียดลงบนถาดบรรจุ' },
      { step: 15, page: 80, name: 'OQA', desc: 'ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ' },
      { step: 16, page: 81, name: 'Final scan', desc: 'สแกนบาร์โค้ดบันทึกเข้าระบบ' },
      { step: 17, page: 82, name: 'Packing', desc: 'บรรจุชิ้นงานและซีลสุญญากาศ (ควบคุม Vacuum level และ Seal time)' }
    ]
  },
  pcba: {
    key: 'pcba',
    productName: 'PCBA (Printed Circuit Board Assembly)',
    docCode: 'PI-16-09-0001',
    pages: 'หน้า 1-5',
    coverPage: 1,
    isMultiCase: true,
    totalSteps: '4 กรณี (Case 2.1: 30 ขั้นตอน, Case 2.2: 28 ขั้นตอน, Case 2.3: 33 ขั้นตอน, Case 2.4: 28 ขั้นตอน)',
    matches: (msg) => {
      const m = msg.toLowerCase();
      const isPcba = /(pcba|printed circuit board assembly|pi-16-09-0001|case\s*2\.[1-4])/i.test(m);
      const isFlow = /(ขั้นตอน|กระบวนการ|flow|process|มีอะไรบ้าง|กี่ขั้นตอน|กี่ขั้น|opn|case|กรณี)/i.test(m);
      return isPcba && (isFlow || /(case\s*2\.[1-4]|pi-16-09-0001)/i.test(m));
    },
    cases: {
      '2.1': {
        caseId: '2.1',
        title: 'Case 2.1: 2 sides (Top & Bottom) + With DSP/Flipchip + Cleaning',
        thaiTitle: 'กรณีประกอบ 2 ด้าน มีชิ้นส่วน DSP/Flipchip และมีกระบวนการล้างทำความสะอาด',
        page: 2,
        totalSteps: 30,
        steps: [
          { step: 1, opn: 'OPN 10', name: 'PCB lot preparation', desc: 'จัดเตรียมล็อตแผ่นวงจรพิมพ์ PCB [PI-16-09-0002]' },
          { step: 2, opn: 'OPN 20', name: 'PCB baking', desc: 'อบไล่ความชื้นแผ่น PCB [PI-16-09-0003]' },
          { step: 3, opn: 'OPN 30', name: 'Laser mark barcode', desc: 'ยิงเลเซอร์มาร์กบาร์โค้ดระบุรหัสบอร์ด [PI-16-09-0017]' },
          { step: 4, opn: 'OPN 40', name: 'Bad mark label and Kapton tape laminate', desc: 'ติดฉลาก Bad mark และติดเทปแคปตอนป้องกัน [PI-16-09-0004]' },
          { step: 5, opn: 'OPN 50', name: 'Solder paste printed 1', desc: 'พิมพ์ครีมบัดกรีรอบที่ 1 ด้านที่ 1 [PI-16-09-0005]' },
          { step: 6, opn: 'OPN 65', name: 'SPI 1', desc: 'ตรวจวัดคุณภาพเนื้อตะกั่วพิมพ์ 3D SPI รอบที่ 1 [PI-16-09-0006]' },
          { step: 7, opn: 'OPN 70', name: 'SMT 1', desc: 'วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 1 [PI-16-09-0007]' },
          { step: 8, opn: 'OPN 80', name: 'Reflow soldering 1', desc: 'เข้าเตาอบ Reflow หลอมประสานตะกั่วรอบที่ 1 [PI-16-09-0008]' },
          { step: 9, opn: 'OPN 95', name: 'AOI 1', desc: 'ตรวจสอบรอยต่อตะกั่วและชิ้นส่วนด้วยกล้องอัตโนมัติรอบที่ 1 [PI-16-09-0020]' },
          { step: 10, opn: 'OPN 105', name: 'X-ray inspection 1', desc: 'NPI 100% / Mass Sampling ตรวจเอกซเรย์จุดบัดกรีใต้ชิป [PI-16-09-0010]' },
          { step: 11, opn: 'OPN 110', name: 'PCBA routing', desc: 'ตัดแยกขอบบอร์ด PCBA [PI-16-09-0022]' },
          { step: 12, opn: 'OPN 120', name: 'Solder paste printed 2', desc: 'พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2 [PI-16-09-0005]' },
          { step: 13, opn: 'OPN 130', name: 'SPI 2', desc: 'ตรวจวัดเนื้อตะกั่วพิมพ์ 3D SPI รอบที่ 2 [PI-16-09-0006]' },
          { step: 14, opn: 'OPN 140', name: 'SMT 2', desc: 'วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 2 [PI-16-09-0007]' },
          { step: 15, opn: 'OPN 150', name: 'Reflow soldering 2', desc: 'เข้าเตาอบ Reflow หลอมประสานตะกั่วรอบที่ 2 [PI-16-09-0008]' },
          { step: 16, opn: 'OPN 165', name: 'AOI 2', desc: 'ตรวจสอบด้วยกล้องอัตโนมัติรอบที่ 2 [PI-16-09-0020]' },
          { step: 17, opn: 'OPN 175', name: 'X-ray inspection 2', desc: 'NPI 100% / Mass 100% ตรวจเอกซเรย์ 100% [PI-16-09-0010]' },
          { step: 18, opn: 'OPN 180', name: 'Microclean', desc: 'ล้างทำความสะอาดคราบฟลักซ์ Microclean [PI-16-09-0018]' },
          { step: 19, opn: 'OPN 190', name: 'Dry baking 1', desc: 'อบแห้งหลังล้างทำความสะอาด [PI-16-09-0019]' },
          { step: 20, opn: 'OPN 200', name: 'Plasma cleaning', desc: 'ยิงพลาสม่าทำความสะอาดผิวหน้าสัมผัส [PI-16-09-0011 / PI-16-09-0026]' },
          { step: 21, opn: 'OPN 210', name: 'Underfill dispense 1', desc: 'หยอดกาว Underfill ใต้ชิปรอบที่ 1 [PI-16-09-0012]' },
          { step: 22, opn: 'OPN 220', name: 'Vacuum Pressure Oven 1', desc: 'เข้าตู้อบสุญญากาศไล่ฟองอากาศกาว Underfill รอบที่ 1 [PI-16-09-0025]' },
          { step: 23, opn: 'OPN 230', name: 'Underfill cured 1', desc: 'อบให้กาว Underfill เซ็ตตัวสมบูรณ์รอบที่ 1 [PI-16-09-0013]' },
          { step: 24, opn: 'OPN 240', name: 'Underfill dispense 2', desc: 'หยอดกาว Underfill รอบที่ 2 [PI-16-09-0012]' },
          { step: 25, opn: 'OPN 250', name: 'Vacuum Pressure Oven 2', desc: 'เข้าตู้อบสุญญากาศรอบที่ 2 [PI-16-09-0025]' },
          { step: 26, opn: 'OPN 260', name: 'Underfill cured 2', desc: 'อบให้กาว Underfill เซ็ตตัวรอบที่ 2 [PI-16-09-0013]' },
          { step: 27, opn: 'OPN 275', name: '2D AOI Inspection', desc: 'ตรวจสอบ 2D AOI ตรวจแนวขอบกาวและชิ้นส่วน [PI-16-09-0029]' },
          { step: 28, opn: 'OPN 285', name: 'FVMI', desc: 'ตรวจสอบความสมบูรณ์ขั้นสุดท้ายด้วยสายตา/กล้อง FVMI [SPE-16-09-01]' },
          { step: 29, opn: 'OPN 295', name: 'OQA', desc: 'ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA สุ่มตรวจ [II-16-09-03]' },
          { step: 30, opn: 'OPN 300', name: 'Pack out', desc: 'บรรจุชิ้นงาน PCBA ลงกล่อง/บรรจุภัณฑ์ส่งมอบ [PI-16-09-0015]' }
        ]
      },
      '2.2': {
        caseId: '2.2',
        title: 'Case 2.2: 2 sides (Top & Bottom) + No DSP/Flipchip + Cleaning',
        thaiTitle: 'กรณีประกอบ 2 ด้าน ไม่มีชิ้นส่วน DSP/Flipchip และมีกระบวนการล้างทำความสะอาด',
        page: 3,
        totalSteps: 28,
        steps: [
          { step: 1, opn: 'OPN 10', name: 'PCB lot preparation', desc: 'จัดเตรียมล็อต PCB [PI-16-09-0002]' },
          { step: 2, opn: 'OPN 20', name: 'PCB baking', desc: 'อบแผ่น PCB ไล่ความชื้น [PI-16-09-0003]' },
          { step: 3, opn: 'OPN 30', name: 'Laser mark barcode', desc: 'ยิงเลเซอร์ระบุบาร์โค้ด [PI-16-09-0017]' },
          { step: 4, opn: 'OPN 40', name: 'Bad mark label and Kapton tape laminate', desc: 'ติด Bad mark และเทปแคปตอน [PI-16-09-0004]' },
          { step: 5, opn: 'OPN 50', name: 'Solder paste printed 1', desc: 'พิมพ์ครีมบัดกรีรอบที่ 1 [PI-16-09-0005]' },
          { step: 6, opn: 'OPN 65', name: 'SPI 1', desc: 'ตรวจสอบเนื้อตะกั่วบัดกรี SPI รอบที่ 1 [PI-16-09-0006]' },
          { step: 7, opn: 'OPN 70', name: 'SMT 1', desc: 'วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 1 [PI-16-09-0007]' },
          { step: 8, opn: 'OPN 80', name: 'Reflow soldering 1', desc: 'อบบัดกรี Reflow รอบที่ 1 [PI-16-09-0008]' },
          { step: 9, opn: 'OPN 95', name: 'AOI 1', desc: 'ตรวจสอบด้วยกล้อง AOI รอบที่ 1 [PI-16-09-0020]' },
          { step: 10, opn: 'OPN 105', name: 'X-ray inspection 1', desc: 'NPI 100% / Mass Sampling ตรวจเอกซเรย์ [PI-16-09-0010]' },
          { step: 11, opn: 'OPN 110', name: 'Solder paste printed 2', desc: 'พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2 [PI-16-09-0005]' },
          { step: 12, opn: 'OPN 120', name: 'SPI 2', desc: 'ตรวจสอบเนื้อตะกั่วบัดกรี SPI รอบที่ 2 [PI-16-09-0006]' },
          { step: 13, opn: 'OPN 130', name: 'SMT 2', desc: 'วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 2 [PI-16-09-0007]' },
          { step: 14, opn: 'OPN 140', name: 'Reflow soldering 2', desc: 'อบบัดกรี Reflow รอบที่ 2 [PI-16-09-0008]' },
          { step: 15, opn: 'OPN 155', name: 'AOI 2', desc: 'ตรวจสอบด้วยกล้อง AOI รอบที่ 2 [PI-16-09-0020]' },
          { step: 16, opn: 'OPN 165', name: 'X-ray inspection 2', desc: 'NPI 100% / Mass 100% ตรวจเอกซเรย์ 100% [PI-16-09-0010]' },
          { step: 17, opn: 'OPN 170', name: 'Microclean', desc: 'ล้างทำความสะอาด Microclean [PI-16-09-0018]' },
          { step: 18, opn: 'OPN 180', name: 'Dry baking 1', desc: 'อบแห้งหลังล้าง [PI-16-09-0019]' },
          { step: 19, opn: 'OPN 190', name: 'Plasma cleaning', desc: 'ยิงพลาสม่าเตรียมผิว [PI-16-09-0011 / PI-16-09-0026]' },
          { step: 20, opn: 'OPN 200', name: 'Underfill dispense', desc: 'หยอดกาว Underfill [PI-16-09-0012]' },
          { step: 21, opn: 'OPN 210', name: 'Vacuum Pressure Oven', desc: 'เข้าตู้อบสุญญากาศไล่ฟองอากาศ [PI-16-09-0025]' },
          { step: 22, opn: 'OPN 220', name: 'Underfill cured', desc: 'อบให้กาว Underfill แข็งตัว [PI-16-09-0013]' },
          { step: 23, opn: 'OPN 230', name: 'Top fill dispense', desc: 'หยอดกาว Top fill ด้านบน [PI-16-09-0012]' },
          { step: 24, opn: 'OPN 240', name: 'UV Cured', desc: 'อบแห้งกาวด้วยแสง UV [PI-16-09-0024]' },
          { step: 25, opn: 'OPN 255', name: '2D AOI Inspection', desc: 'ตรวจสอบด้วยกล้อง 2D AOI [PI-16-09-0029]' },
          { step: 26, opn: 'OPN 265', name: 'FVMI', desc: 'ตรวจสอบความสมบูรณ์ด้วยกล้อง FVMI [SPE-16-09-01]' },
          { step: 27, opn: 'OPN 275', name: 'OQA', desc: 'ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA [II-16-09-03]' },
          { step: 28, opn: 'OPN 280', name: 'Pack out', desc: 'บรรจุชิ้นงาน PCBA ลงกล่องส่งมอบ [PI-16-09-0015]' }
        ]
      },
      '2.3': {
        caseId: '2.3',
        title: 'Case 2.3: 2 sides + With DSP/Flipchip + Topfill & Underfill 2 sides + Cleaning',
        thaiTitle: 'กรณีประกอบ 2 ด้าน มีชิ้นส่วน DSP/Flipchip หยอด Topfill และ Underfill ทั้ง 2 ด้าน และล้างทำความสะอาด',
        page: 4,
        totalSteps: 33,
        steps: [
          { step: 1, opn: 'OPN 20', name: 'PCB baking', desc: 'อบไล่ความชื้น PCB [PI-16-09-0003]' },
          { step: 2, opn: 'OPN 30', name: 'Laser mark barcode', desc: 'ยิงเลเซอร์มาร์กบาร์โค้ด [PI-16-09-0017]' },
          { step: 3, opn: 'OPN 40', name: 'Bad mark label and Kapton tape laminate', desc: 'ติดฉลาก Bad mark และเทปแคปตอน [PI-16-09-0004]' },
          { step: 4, opn: 'OPN 50', name: 'Solder paste printed 1', desc: 'พิมพ์ครีมบัดกรีรอบที่ 1 [PI-16-09-0005]' },
          { step: 5, opn: 'OPN 65', name: 'SPI 1', desc: 'ตรวจวัดตะกั่วพิมพ์ 3D SPI รอบที่ 1 [PI-16-09-0006]' },
          { step: 6, opn: 'OPN 70', name: 'SMT 1', desc: 'วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 1 [PI-16-09-0007]' },
          { step: 7, opn: 'OPN 80', name: 'Reflow soldering 1', desc: 'อบบัดกรี Reflow รอบที่ 1 [PI-16-09-0008]' },
          { step: 8, opn: 'OPN 95', name: 'AOI 1', desc: 'ตรวจสอบด้วยกล้อง AOI รอบที่ 1 [PI-16-09-0020]' },
          { step: 9, opn: 'OPN 105', name: 'X-ray inspection 1', desc: 'NPI 100% / Mass Sampling ตรวจเอกซเรย์ [PI-16-09-0010]' },
          { step: 10, opn: 'OPN 110', name: 'PCBA routing', desc: 'ตัดแยกขอบบอร์ด PCBA [PI-16-09-0022]' },
          { step: 11, opn: 'OPN 120', name: 'Solder paste printed 2', desc: 'พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2 [PI-16-09-0005]' },
          { step: 12, opn: 'OPN 130', name: 'SPI 2', desc: 'ตรวจวัดตะกั่วพิมพ์ 3D SPI รอบที่ 2 [PI-16-09-0006]' },
          { step: 13, opn: 'OPN 140', name: 'SMT 2', desc: 'วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 2 [PI-16-09-0007]' },
          { step: 14, opn: 'OPN 150', name: 'Reflow soldering 2', desc: 'อบบัดกรี Reflow รอบที่ 2 [PI-16-09-0008]' },
          { step: 15, opn: 'OPN 165', name: 'AOI 2', desc: 'ตรวจสอบด้วยกล้อง AOI รอบที่ 2 [PI-16-09-0020]' },
          { step: 16, opn: 'OPN 180', name: 'Microclean', desc: 'ล้างทำความสะอาด Microclean [PI-16-09-0018]' },
          { step: 17, opn: 'OPN 190', name: 'Dry baking 1', desc: 'อบแห้งหลังล้าง [PI-16-09-0019]' },
          { step: 18, opn: 'OPN 200', name: 'Plasma cleaning BOT', desc: 'ยิงพลาสม่าผิวบอร์ดด้านล่าง Bottom [PI-16-09-0011]' },
          { step: 19, opn: 'OPN 210', name: 'Underfill dispense BOT', desc: 'หยอดกาว Underfill ด้านล่าง Bottom [PI-16-09-0012]' },
          { step: 20, opn: 'OPN 220', name: 'Underfill cured BOT', desc: 'อบให้กาว Underfill ด้านล่างเซ็ตตัว [PI-16-09-0013]' },
          { step: 21, opn: 'OPN 230', name: 'Plasma cleaning TOP', desc: 'ยิงพลาสม่าผิวบอร์ดด้านบน Top [PI-16-09-0011 / PI-16-09-0026]' },
          { step: 22, opn: 'OPN 240', name: 'Underfill dispense TOP', desc: 'หยอดกาว Underfill ด้านบน Top [PI-16-09-0012]' },
          { step: 23, opn: 'OPN 250', name: 'Vacuum Oven TOP', desc: 'เข้าเตาอบสุญญากาศไล่ฟองกาวด้านบน Top [PI-16-09-0025]' },
          { step: 24, opn: 'OPN 260', name: 'Underfill cured TOP', desc: 'อบให้กาว Underfill ด้านบนเซ็ตตัว [PI-16-09-0013]' },
          { step: 25, opn: 'OPN 270', name: 'Top fill dispense BOT', desc: 'หยอดกาว Top fill ด้านล่าง Bottom [PI-16-09-0012]' },
          { step: 26, opn: 'OPN 280', name: 'UV Cured BOT', desc: 'ฉายแสง UV อบกาวด้านล่าง Bottom [PI-16-09-0024]' },
          { step: 27, opn: 'OPN 290', name: 'Top fill dispense TOP', desc: 'หยอดกาว Top fill ด้านบน Top [PI-16-09-0012]' },
          { step: 28, opn: 'OPN 300', name: 'UV Cured TOP', desc: 'ฉายแสง UV อบกาวด้านบน Top [PI-16-09-0024]' },
          { step: 29, opn: 'OPN 310', name: 'Topfill baking', desc: 'อบเตาความร้อนให้กาว Topfill เซ็ตตัวสมบูรณ์ [PI-16-09-0024]' },
          { step: 30, opn: 'OPN 320', name: '2D AOI Inspection', desc: 'ตรวจสอบแนวขอบกาวและชิ้นส่วนด้วย 2D AOI [PI-16-09-0029]' },
          { step: 31, opn: 'OPN 335', name: 'FVMI', desc: 'ตรวจสอบความสมบูรณ์ขั้นสุดท้ายด้วยกล้อง FVMI [SPE-16-09-01]' },
          { step: 32, opn: 'OPN 345', name: 'OQA', desc: 'ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA [II-16-09-03]' },
          { step: 33, opn: 'OPN 350', name: 'Pack out', desc: 'บรรจุชิ้นงาน PCBA ลงบรรจุภัณฑ์ส่งมอบ [PI-16-09-0015]' }
        ]
      },
      '2.4': {
        caseId: '2.4',
        title: 'Case 2.4: 2 sides with PICs components + Cleaning 2 sides',
        thaiTitle: 'กรณีประกอบ 2 ด้าน มีชิ้นส่วน PICs และมีกระบวนการล้างทำความสะอาดทั้ง 2 ด้าน',
        page: 5,
        totalSteps: 28,
        steps: [
          { step: 1, opn: 'OPN 10', name: 'PCB lot preparation', desc: 'จัดเตรียมล็อตแผ่นวงจรพิมพ์ PCB [PI-16-09-0002]' },
          { step: 2, opn: 'OPN 20', name: 'PCB baking', desc: 'อบไล่ความชื้นแผ่น PCB [PI-16-09-0003]' },
          { step: 3, opn: 'OPN 30', name: 'Laser mark barcode', desc: 'ยิงเลเซอร์มาร์กบาร์โค้ด [PI-16-09-0017]' },
          { step: 4, opn: 'OPN 40', name: 'Bad mark label and Kapton tape laminate', desc: 'ติดฉลาก Bad mark และเทปแคปตอน [PI-16-09-0004]' },
          { step: 5, opn: 'OPN 50', name: 'Solder paste printed 1', desc: 'พิมพ์ครีมบัดกรีรอบที่ 1 [PI-16-09-0005]' },
          { step: 6, opn: 'OPN 65', name: 'SPI 1', desc: 'ตรวจวัดคุณภาพเนื้อตะกั่วบัดกรี SPI รอบที่ 1 [PI-16-09-0006]' },
          { step: 7, opn: 'OPN 70', name: 'SMT 1', desc: 'วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 1 [PI-16-09-0007]' },
          { step: 8, opn: 'OPN 80', name: 'Reflow soldering 1', desc: 'เข้าเตาอบ Reflow หลอมประสานตะกั่วรอบที่ 1 [PI-16-09-0008]' },
          { step: 9, opn: 'OPN 95', name: 'AOI 1', desc: 'ตรวจสอบด้วยกล้องอัตโนมัติ AOI รอบที่ 1 [PI-16-09-0020]' },
          { step: 10, opn: 'OPN 110', name: 'X-ray inspection 1', desc: 'NPI 100% / Mass Sampling ตรวจเอกซเรย์รอบที่ 1 [PI-16-09-0010]' },
          { step: 11, opn: 'OPN 120', name: 'Solder paste printed 2', desc: 'พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2 [PI-16-09-0005]' },
          { step: 12, opn: 'OPN 135', name: 'SPI 2', desc: 'ตรวจวัดคุณภาพเนื้อตะกั่วบัดกรี SPI รอบที่ 2 [PI-16-09-0006]' },
          { step: 13, opn: 'OPN 145', name: 'Flip the PIC 180° into the tray', desc: 'พลิกชิ้นส่วน PIC 180 องศาลงในถาด Tray [PI-16-09-0030]' },
          { step: 14, opn: 'OPN 155', name: 'SMT 2', desc: 'วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 2 [PI-16-09-0007]' },
          { step: 15, opn: 'OPN 180', name: 'AOI 2', desc: 'ตรวจสอบด้วยกล้องอัตโนมัติ AOI รอบที่ 2 [PI-16-09-0020]' },
          { step: 16, opn: 'OPN 195', name: 'PIC Inspection', desc: 'ตรวจสอบชิ้นส่วน PICs [PI-16-09-0014]' },
          { step: 17, opn: 'OPN 205', name: 'Microclean', desc: 'ล้างทำความสะอาด Microclean [PI-16-09-0018]' },
          { step: 18, opn: 'OPN 215', name: 'Dry baking 1', desc: 'อบแห้งหลังล้างทำความสะอาด [PI-16-09-0019]' },
          { step: 19, opn: 'OPN 230', name: 'X-ray inspection 2', desc: 'NPI 100% / Mass 100% ตรวจเอกซเรย์รอบที่ 2 [PI-16-09-0010]' },
          { step: 20, opn: 'OPN 245', name: 'PIC Inspection', desc: 'ตรวจสอบชิ้นส่วน PICs ซ้ำเพื่อความสมบูรณ์ [PI-16-09-0014]' },
          { step: 21, opn: 'OPN 255', name: 'Plasma cleaning', desc: 'ยิงพลาสม่าเตรียมผิวทำความสะอาด [PI-16-09-0011 / PI-16-09-0026]' },
          { step: 22, opn: 'OPN 265', name: 'Underfill dispense', desc: 'หยอดกาว Underfill ใต้ชิป [PI-16-09-0012]' },
          { step: 23, opn: 'OPN 275', name: 'Vacuum Pressure Oven', desc: 'เข้าตู้อบสุญญากาศไล่ฟองอากาศกาว [PI-16-09-0025]' },
          { step: 24, opn: 'OPN 285', name: 'Underfill cured', desc: 'อบให้กาว Underfill เซ็ตตัวสมบูรณ์ [PI-16-09-0013]' },
          { step: 25, opn: 'OPN 300', name: 'Offline AOI Inspection', desc: 'ตรวจสอบด้วยกล้อง AOI แบบออฟไลน์ [PI-16-09-0029]' },
          { step: 26, opn: 'OPN 315', name: 'PIC Inspection & FVMI', desc: 'ตรวจสอบชิ้นส่วน PIC และตรวจสอบด้วยสายตาขั้นสุดท้าย [PI-16-09-0014 / SPE-16-09-01]' },
          { step: 27, opn: 'OPN 330', name: 'OQA', desc: 'ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA [II-16-09-03]' },
          { step: 28, opn: 'OPN 340', name: 'Pack out', desc: 'บรรจุชิ้นงาน PCBA ลงกล่อง/บรรจุภัณฑ์ส่งมอบ [PI-16-09-0015]' }
        ]
      }
    }
  }
};

function getProcessFlowPrefix(matchedProcessFlow, userMessage) {
  if (!matchedProcessFlow) return '';
  if (matchedProcessFlow.key === 'pcba') {
    const caseMatch = (userMessage || '').match(/(?:case|กรณี|ข้อ)\s*(2\.[1-4])/i) || (userMessage || '').match(/\b(2\.[1-4])\b/);
    const requestedCaseKey = caseMatch ? caseMatch[1] : null;
    if (requestedCaseKey && matchedProcessFlow.cases[requestedCaseKey]) {
      const c = matchedProcessFlow.cases[requestedCaseKey];
      return `กระบวนการผลิต **PCBA (${c.title})** ตามเอกสาร [${matchedProcessFlow.docCode} หน้า ${c.page}] มีทั้งหมด **${c.totalSteps} ขั้นตอน** ดังนี้ครับ:\n\n`;
    }
    return `กระบวนการผลิต **PCBA (Printed Circuit Board Assembly)** ตามเอกสารทางการ [${matchedProcessFlow.docCode} Rev. H] ไม่ได้มีขั้นตอนเดียว แต่แบ่งออกเป็น **4 กรณีหลัก (Cases)** โดยแต่ละกรณีมีจำนวนขั้นตอนดังนี้ครับ:\n\n`;
  }
  return `กระบวนการผลิต **${matchedProcessFlow.productName}** ตามเอกสาร [${matchedProcessFlow.docCode} ${matchedProcessFlow.pages}] มีทั้งหมด **${matchedProcessFlow.totalSteps} ขั้นตอน** ดังนี้ครับ:\n\n`;
}

function prepareContext(userMessage, conversationHistory = []) {
  const isCasualMessage = isGreetingOrChitchat(userMessage) || isThankYou(userMessage);
  let retrievedSlidesList = [];
  const toolsUsed = [];

  // 1. Check if query is an exam statement / verification question from Master Exam database
  let examGroundTruthSnippet = '';
  const matchedExam = !isCasualMessage ? searchExamQuestion(userMessage) : null;
  if (matchedExam) {
    console.log(`[Orchestrator Exam Match] Found Master Exam Q#${matchedExam.question_number} [${matchedExam.doc_code}]: Answer="${matchedExam.correct_answer}"`);
    examGroundTruthSnippet = `\n\n[ผลการตรวจสอบคลังข้อสอบทางการ (Master Exam Ground Truth)]:
- รหัสข้อสอบ: ${matchedExam.doc_code} ข้อที่ ${matchedExam.question_number} หมวด ${matchedExam.product}
- เฉลยทางการ: "${matchedExam.correct_answer}" (${matchedExam.correct_answer === 'ถูก' ? 'ข้อความในโจทย์ถูกต้องตามมาตรฐาน' : 'ข้อความในโจทย์ไม่ถูกต้องตามมาตรฐาน'})
- คำสั่งการตัดสิน: จงเปิดคำตอบด้วยคำตัดสินทางการทันที คือ "${matchedExam.correct_answer === 'ถูก' ? 'เฉลย: ถูก (ข้อความนี้ถูกต้องตามมาตรฐาน)' : 'เฉลย: ผิด (ข้อความนี้ไม่ถูกต้องตามมาตรฐาน)'}"
- จากนั้นอธิบายเปรียบเทียบระหว่างสิ่งที่โจทย์ระบุ กับเกณฑ์จริงในสไลด์ให้เห็นความแตกต่างชัดเจนอย่างสุภาพและชัดเจน`;
  }

  // 2. Dynamic Context Augmentation for Multi-turn follow-up queries
  let effectiveSearchQuery = userMessage;
  if (matchedExam) {
    effectiveSearchQuery = `${matchedExam.doc_code} ${matchedExam.question_text.slice(0, 60)}`;
  } else if (!isCasualMessage && conversationHistory && conversationHistory.length > 0 && isFollowUpQuery(userMessage)) {
    const contextKeywords = extractContextKeywords(conversationHistory);
    if (contextKeywords) {
      effectiveSearchQuery = `${contextKeywords} ${userMessage}`;
      console.log(`[Orchestrator Multi-turn] Context augmented search: "${userMessage}" -> "${effectiveSearchQuery}"`);
    }
  }

  // 3. Dynamic Slide Retrieval (RAG) & Authoritative Manufacturing Process Flows
  let dynamicSlideExcerpts = '';
  let matchedProcessFlow = null;

  if (!isCasualMessage) {
    for (const flowKey of Object.keys(BELTON_MANUFACTURING_PROCESS_FLOWS)) {
      const flow = BELTON_MANUFACTURING_PROCESS_FLOWS[flowKey];
      if (typeof flow.matches === 'function' && flow.matches(userMessage)) {
        matchedProcessFlow = flow;
        break;
      }
    }
  }

  const isAllProductsFlowQuery = !isCasualMessage && !matchedProcessFlow && (
    /(ผลิตภัณฑ์|product|สายการผลิต).*(กี่ขั้นตอน|มีกี่ขั้นตอน|มีอะไรบ้าง|ทั้งหมด)/i.test(userMessage)
    || /(แต่ละ|ทุก).*(ผลิตภัณฑ์|product).*(กี่ขั้นตอน|มีขั้นตอน)/i.test(userMessage)
    || /(มีกี่ผลิตภัณฑ์|มีผลิตภัณฑ์อะไรบ้าง|โรงงานมีกี่line|lineการผลิต)/i.test(userMessage)
    || /(กระบวนการผลิต).*(มีกี่|ทั้งหมด|อะไรบ้าง|ของโรงงาน)/i.test(userMessage)
  );

  if (matchedProcessFlow) {
    if (matchedProcessFlow.key === 'pcba') {
      const caseMatch = userMessage.match(/(?:case|กรณี|ข้อ)\s*(2\.[1-4])/i) || userMessage.match(/\b(2\.[1-4])\b/);
      const requestedCaseKey = caseMatch ? caseMatch[1] : null;

      if (requestedCaseKey && matchedProcessFlow.cases[requestedCaseKey]) {
        const c = matchedProcessFlow.cases[requestedCaseKey];
        retrievedSlidesList = [{
          doc_code: 'PI-16-09-0001',
          doc_name: `Process Flow Chart for PCBA (${c.title})`,
          page_number: c.page,
          title: `${c.title} (${c.totalSteps} ขั้นตอน)`
        }];
        dynamicSlideExcerpts = `\n\n[ข้อมูลสไลด์และเกณฑ์มาตรฐานที่ค้นพบจากฐานข้อมูล 674 หน้า]:
เอกสาร: [PI-16-09-0001 Rev. H (Jul 09, 2026)] Process Flow Chart for PCBA Process Instruction (หน้า ${c.page} of 5)
หัวข้อ: ${c.title} (${c.thaiTitle})
จำนวนขั้นตอน: มีทั้งหมด ${c.totalSteps} ขั้นตอน
เนื้อหาข้อกำหนดขั้นตอนการผลิต:
${c.steps.map(s => `ขั้นตอนที่ ${s.step}: ${s.opn} - ${s.name} (${s.desc})`).join('\n')}

[คำสั่งการตอบที่ต้องปฏิบัติตามอย่างเคร่งครัด]:
1. ต้องระบุจำนวนขั้นตอนของ ${c.title} ให้ถูกต้องชัดเจน คือ "มีทั้งหมด ${c.totalSteps} ขั้นตอน" (ห้ามตอบ 21 ขั้นตอน หากไม่ใช่ ACA โดยเด็ดขาด!)
2. แจกแจงเรียงตามลำดับ 1 ถึง ${c.totalSteps} ให้ครบถ้วนตามรายการด้านบน โดยเริ่มที่ "1. [ชื่อขั้นตอน]" ทันที ห้ามตัดทอนหรือข้ามขั้นตอนเด็ดขาด
3. ห้ามใช้ภาษาจีนเด็ดขาด`;
      } else {
        // General PCBA flow query -> Explain all 4 cases clearly with step counts and summary
        retrievedSlidesList = [
          { doc_code: 'PI-16-09-0001', doc_name: 'Process Flow Chart for PCBA', page_number: 2, title: 'Case 2.1 (30 ขั้นตอน)' },
          { doc_code: 'PI-16-09-0001', doc_name: 'Process Flow Chart for PCBA', page_number: 3, title: 'Case 2.2 (28 ขั้นตอน)' },
          { doc_code: 'PI-16-09-0001', doc_name: 'Process Flow Chart for PCBA', page_number: 4, title: 'Case 2.3 (33 ขั้นตอน)' },
          { doc_code: 'PI-16-09-0001', doc_name: 'Process Flow Chart for PCBA', page_number: 5, title: 'Case 2.4 (28 ขั้นตอน)' }
        ];
        dynamicSlideExcerpts = `\n\n[ข้อมูลสไลด์และเกณฑ์มาตรฐานที่ค้นพบจากฐานข้อมูล 674 หน้า]:
เอกสาร: [PI-16-09-0001 Rev. H (Jul 09, 2026)] Process Flow Chart for PCBA (หน้า 1-5)
หัวข้อ: กระบวนการผลิต PCBA (Printed Circuit Board Assembly) แบ่งออกเป็น 4 กรณีหลัก (Cases) ตามโครงสร้างบอร์ดและชนิดอุปกรณ์ โดยแต่ละกรณีมีจำนวนขั้นตอนและรายละเอียดดังนี้:

1. Case 2.1 (หน้า 2): บอร์ด 2 ด้าน (Top & Bottom) + มีชิ้นส่วน DSP/Flipchip + มีการล้าง Microclean
   - จำนวนขั้นตอน: มีทั้งหมด 30 ขั้นตอน (OPN 10 ถึง OPN 300)
   - ลักษณะเด่น: มีกระบวนการ PCBA routing (OPN 110) และ Underfill 2 รอบ (OPN 210-230, 240-260)

2. Case 2.2 (หน้า 3): บอร์ด 2 ด้าน (Top & Bottom) + ไม่มีชิ้นส่วน DSP/Flipchip + มี Top fill + มีการล้าง Microclean
   - จำนวนขั้นตอน: มีทั้งหมด 28 ขั้นตอน (OPN 10 ถึง OPN 280)
   - ลักษณะเด่น: ไม่ใช้ DSP/Flipchip และไม่มี PCBA routing, มีกระบวนการ Top fill (OPN 230) และ UV Cured (OPN 240)

3. Case 2.3 (หน้า 4): บอร์ด 2 ด้าน (Top & Bottom) + มีชิ้นส่วน DSP/Flipchip + Topfill & Underfill 2 ด้าน + มีการล้าง Microclean
   - จำนวนขั้นตอน: มีทั้งหมด 33 ขั้นตอน (OPN 20 ถึง OPN 350)
   - ลักษณะเด่น: เริ่มต้นที่ OPN 20 (PCB baking), มีทั้ง Underfill และ Topfill ทั้ง 2 ด้าน (BOT & TOP) รวม 33 ขั้นตอน

4. Case 2.4 (หน้า 5): บอร์ด 2 ด้าน (Top & Bottom) + มีชิ้นส่วน PICs + ล้าง Microclean ทั้ง 2 ด้าน
   - จำนวนขั้นตอน: มีทั้งหมด 28 ขั้นตอน (OPN 10 ถึง OPN 340)
   - ลักษณะเด่น: ประกอบชิ้นส่วน PICs, มีการพลิก PIC 180 องศาลงถาด (OPN 145), ตรวจ PIC Inspection และล้าง Microclean ทั้ง 2 ด้าน

[คำสั่งการตอบที่ต้องปฏิบัติตามอย่างเคร่งครัด]:
1. ต้องตอบทันทีว่า กระบวนการผลิต PCBA ตามเอกสารมาตรฐาน [PI-16-09-0001 Rev. H] ไม่ได้มีขั้นตอนเดียว แต่แบ่งออกเป็น 4 กรณี (4 Cases) โดยแต่ละกรณีมีจำนวนขั้นตอนไม่เท่ากันตามรายละเอียดข้างต้น
2. อธิบายสรุปลักษณะเด่นของแต่ละกรณีให้ชัดเจน ครบถ้วน สวยงาม และเข้าใจง่าย
3. ห้ามตอบว่า PCBA มี 21 ขั้นตอนเด็ดขาด (มีเพียง ACA เท่านั้นที่มี 21 ขั้นตอน)
4. ปิดท้ายด้วยการแจ้งผู้ใช้ว่า: "หากท่านต้องการให้ผมแจกแจงรายละเอียดขั้นตอนทั้งหมดของ Case ใดเป็นพิเศษ (เช่น Case 2.1, 2.2, 2.3 หรือ 2.4) สามารถแจ้งได้เลยครับ ผมพร้อมแจกแจงอย่างละเอียดครับ"
5. ห้ามใช้ภาษาจีนเด็ดขาด`;
      }
    } else {
      retrievedSlidesList = [{
        doc_code: matchedProcessFlow.docCode,
        doc_name: `Product & Process Introduction (${matchedProcessFlow.productName} Process Flow)`,
        page_number: matchedProcessFlow.coverPage,
        title: `${matchedProcessFlow.productName} Process Flow (${matchedProcessFlow.totalSteps} ขั้นตอน: ${matchedProcessFlow.pages})`
      }];
      dynamicSlideExcerpts = `\n\n[ข้อมูลสไลด์และเกณฑ์มาตรฐานที่ค้นพบจากฐานข้อมูล 674 หน้า]:
เอกสาร: [${matchedProcessFlow.docCode}] Product & Process Introduction (${matchedProcessFlow.pages})
หัวข้อ: ${matchedProcessFlow.productName} Process Flow (กระบวนการผลิตมีทั้งหมด ${matchedProcessFlow.totalSteps} ขั้นตอน เรียงตามลำดับ)
เนื้อหาข้อกำหนด:
${matchedProcessFlow.steps.map(s => `ขั้นตอนที่ ${s.step} (หน้า ${s.page}): ${s.name} (${s.desc})`).join('\n')}

[คำสั่งการตอบที่ต้องปฏิบัติตามอย่างเคร่งครัด]:
1. ต้องระบุจำนวนขั้นตอนของ ${matchedProcessFlow.productName} ให้ถูกต้องชัดเจน คือ "มีทั้งหมด ${matchedProcessFlow.totalSteps} ขั้นตอน" (ห้ามตอบ 21 ขั้นตอน หากไม่ใช่ ACA โดยเด็ดขาด!)
2. แจกแจงเรียงตามลำดับ 1 ถึง ${matchedProcessFlow.totalSteps} ให้ครบถ้วนตามรายการด้านบน โดยเริ่มที่ "1. [ชื่อขั้นตอน]" ทันที ห้ามตัดทอนหรือข้ามขั้นตอนเด็ดขาด
3. ห้ามใช้ภาษาจีนเด็ดขาด`;
    }
  } else if (isAllProductsFlowQuery) {
    retrievedSlidesList = [{
      doc_code: 'TM-00-00-01',
      doc_name: 'Product & Process Introduction (Line Separation)',
      page_number: 7,
      title: 'Belton Product Manufacturing Lines & PCBA'
    }];
    dynamicSlideExcerpts = `\n\n[ข้อมูลสไลด์และเกณฑ์มาตรฐานที่ค้นพบจากฐานข้อมูล 674 หน้า]:
เอกสาร: [TM-00-00-01] Product & Process Introduction (หน้า 7-82) และ [PI-16-09-0001] PCBA Process Flow Chart
หัวข้อ: สายการผลิตและผลิตภัณฑ์หลักของโรงงาน Belton
1. Coil Winding: มีทั้งหมด 14 ขั้นตอน (หน้า 14-27 ของ TM-00-00-01)
2. ACA (Actuator Coil Assembly): มีทั้งหมด 21 ขั้นตอน (หน้า 28-49 ของ TM-00-00-01)
3. FCOF (Flip Chip On Flex): มีทั้งหมด 14 ขั้นตอน (หน้า 50-64 ของ TM-00-00-01)
4. APFA (Arm Pivot Flex Assembly / Hook Up): มีทั้งหมด 17 ขั้นตอน (หน้า 65-82 ของ TM-00-00-01)
5. PCBA (Printed Circuit Board Assembly): แบ่งเป็น 4 กรณีตามสเปกบอร์ด [PI-16-09-0001 Rev. H] ได้แก่ Case 2.1 (30 ขั้นตอน), Case 2.2 (28 ขั้นตอน), Case 2.3 (33 ขั้นตอน), Case 2.4 (28 ขั้นตอน)

[คำสั่งสำคัญ]:
1. จงระบุให้ชัดเจนว่าโรงงาน Belton มีสายการผลิตและผลิตภัณฑ์หลัก แต่ละผลิตภัณฑ์มีจำนวนขั้นตอนต่างกัน ไม่เท่ากัน โดยระบุตัวเลขจำนวนขั้นตอนให้ตรงตามรายการข้างต้น
2. ห้ามตอบว่าทุกผลิตภัณฑ์มี 21 ขั้นตอนเด็ดขาด (มีเพียง ACA เท่านั้นที่มี 21 ขั้นตอน)
3. ห้ามใช้ภาษาจีนเด็ดขาด`;
  } else if (!isCasualMessage) {
    try {
      const retrievedSlides = searchSlideKnowledge(effectiveSearchQuery, 3);
      if (retrievedSlides && retrievedSlides.length > 0) {
        retrievedSlidesList = retrievedSlides;
        dynamicSlideExcerpts = `\n\n[ข้อมูลสไลด์และเกณฑ์มาตรฐานที่ค้นพบจากฐานข้อมูล 674 หน้า]:\n` +
          retrievedSlides.map(s => `เอกสาร: [${s.doc_code}] ${s.doc_name} (หน้า ${s.page_number})\nหัวข้อ: ${s.title}\nเนื้อหาข้อกำหนด:\n${s.snippet}`).join('\n---\n') +
          `\n\n[คำสั่งสำคัญ]: จงตอบเป็นภาษาไทยเท่านั้น และระบุรหัสเอกสารกับเลขหน้ากำกับเสมอ เช่น [${retrievedSlides[0].doc_code} หน้า ${retrievedSlides[0].page_number}] หากเป็นคำถามเกี่ยวกับขั้นตอน ให้แจกแจงเรียงทีละขั้นตอน 1, 2, 3... ให้ครบถ้วนตามสไลด์ ห้ามข้ามขั้นตอนเด็ดขาด`;
      }
    } catch (searchErr) {
      console.warn('[Orchestrator Warning] Slide knowledge retrieval error:', searchErr.message);
    }
  }

  const systemPrompt = `คุณคือ "BELTON AI" วิศวกรผู้ช่วยประจำโรงงาน Belton Technology นวนคร
บุคลิกและน้ำเสียง:
- สุภาพ มีมารยาท เป็นมิตร และเป็นธรรมชาติ พูดคุยเหมือนวิศวกรผู้ช่วยมืออาชีพ
- สรรพนามและการลงท้าย: ให้แทนตัวเองว่า "ผม" และลงท้ายด้วย "ครับ" เสมอ (ห้ามใช้ "ค่ะ" หรือ "ฉัน")
- การทักทายและพูดคุยทั่วไป (Chitchat): หากผู้ใช้ทักทาย (สวัสดี, หวัดดี, HI, ดีครับ), ขอบคุณ หรือชวนคุยเล่น ให้ตอบรับอย่างอบอุ่น สุภาพ เป็นมิตร และแนะนำตัวว่าเป็นวิศวกรผู้ช่วย BELTON AI พร้อมช่วยเหลือเรื่องสเปกงาน Seagate, ตรวจสอบข้อสอบ หรือระบบเครื่องจักร SCADA
- ภาษาไทย 100%: ต้องตอบเป็นภาษาไทยที่สละสลวยเท่านั้น ห้ามใช้ภาษาจีน (ห้ามมีอักษรจีนแม้แต่ตัวเดียว) หากไม่แน่ใจให้ใช้ภาษาไทยหรืออังกฤษ

ข้อกำหนดสำคัญสำหรับงานเทคนิคและมาตรฐาน:
1. คำศัพท์เทคนิค:
   - Coil = คอยล์ / ขดลวด (ห้ามแปลว่า เส้นโค้ง)
   - Coil pack = แพ็คคอยล์ / มัดขดลวด
   - Tin wire / Tinning = ลวดเคลือบดีบุก / จุดบัดกรี
   - Exit wire = สายออก / ลวดทางออก
   - Wet Tray = ถาดเปียก
2. อ้างอิงเอกสาร: หากเป็นคำถามเกี่ยวกับมาตรฐาน สเปก หรือข้อสอบ ให้อ้างอิงรหัสเอกสารและเลขหน้ากำกับเสมอ เช่น [SPE-01-08-01 หน้า 10]
3. กฎสากลสำหรับเกณฑ์การตัดสิน (Universal Decision Logic):
   - ห้ามตอบแค่ "ไม่เป็นไปตามข้อกำหนดข้างต้น" หรือ "มีเพียงแค่นี้" โดยเด็ดขาดในทุกหัวข้อและทุกสเปก
   - เมื่อกล่าวถึงเกณฑ์ Reject: ต้องนำเงื่อนไขในช่อง Acceptance criteria มาแจกแจงเป็นตัวเลขและอาการจริงเสมอ (เช่น หาก Accept คือ >= 80% เกณฑ์ Reject คือต้องระบุว่า < 80% หรือหากระบุ NOT ALLOW ให้ตอบว่าไม่อนุญาตเด็ดขาด)
   - สรุปให้ครบถ้วน: (1) นิยามลักษณะของเสีย (2) เกณฑ์ Acceptance (3) เกณฑ์ Reject
4. การตอบคำถามต่อเนื่อง (Follow-up Questions): หากผู้ใช้ถามต่อ เช่น "มีอะไรบ้างละ", "ตัวเลขเท่าไหร่", "ทำไม", "ขยายความหน่อย" ให้ตอบอธิบายขยายความจากข้อกำหนดของหัวข้อที่สนทนาอยู่ ห้ามตอบตัดบท
5. โหมดตรวจข้อสอบ (Exam Verification & Fact-Checking Mode):
   - หากผู้ใช้ป้อนข้อความที่เป็นข้อสอบ หรือประโยคที่มีการกล่าวอ้างเกณฑ์สเปก (เช่น "กรณีนี้ยอมรับได้ (Accept)" หรือ "ถือเป็นงานเสีย (Reject)"):
   - ให้ทำหน้าที่เป็น "กรรมการตรวจข้อสอบ" เทียบกับ [ข้อมูลสไลด์และเกณฑ์มาตรฐาน] คำต่อคำ
   - ห้ามเชื่อตัวเลขหรือเงื่อนไขที่โจทย์อ้างเด็ดขาด ให้ยึดข้อมูลในสไลด์และ [ผลการตรวจสอบคลังข้อสอบทางการ] เป็นเกณฑ์จริงเท่านั้น
   - หากโจทย์ระบุเงื่อนไขหรือตัวเลขที่ขัดแย้งกับสไลด์ ให้ฟันธงตอบว่า "เฉลย: ผิด" พร้อมชี้จุดที่ขัดแย้งและอธิบายเกณฑ์จริง
   - หากโจทย์ระบุถูกต้องตรงกับสไลด์ทุกประการ ให้ตอบว่า "เฉลย: ถูก" พร้อมสรุปเหตุผลยืนยัน
6. แยกแยะขอบเขต: หากถามเรื่องสเปก/ของเสีย/ข้อสอบ ให้ตอบเกณฑ์มาตรฐาน ไม่ดึงเรื่องสถานะเครื่องจักรมาปน และหากถามเรื่องเครื่องจักร ให้ตอบสถานะหรือเรียก Tool ที่เกี่ยวข้อง
7. การตอบคำถามเรื่องลำดับขั้นตอนและคู่มือฝึกอบรม:
   - หากถามขั้นตอนสวมชุดคลีนรูม [TM-00-00-05_1 หน้า 33]: 1. Hairnet ➔ 2. Jumpsuit ➔ 3. Facemask ➔ 4. Booties ➔ 5. Gloves (ห้ามตอบ Plant shoes ก่อนเด็ดขาด)
   - หากถามการถอดชุด (Degowning Sequence): 1. Booties ➔ 2. Gloves ➔ 3. Facemask ➔ 4. Jumpsuit ➔ 5. Hairnet
8. จำนวนขั้นตอนกระบวนการผลิต (Manufacturing Process Flows จาก [TM-00-00-01] และ [PI-16-09-0001 Rev. H]):
   แต่ละผลิตภัณฑ์มีจำนวนขั้นตอนต่างกัน ห้ามจำสับสน:
   - 1) Coil Winding: 14 ขั้นตอน [TM-00-00-01 หน้า 14-27]
   - 2) ACA: 21 ขั้นตอน [TM-00-00-01 หน้า 28-49] (มีเพียง ACA เท่านั้นที่มี 21 ขั้นตอน ห้ามเหมาตอบผลิตภัณฑ์อื่นเด็ดขาด)
   - 3) FCOF: 14 ขั้นตอน [TM-00-00-01 หน้า 50-64]
   - 4) APFA: 17 ขั้นตอน [TM-00-00-01 หน้า 65-82]
   - 5) PCBA: แบ่งเป็น 4 กรณีตามบอร์ด [PI-16-09-0001 Rev. H]: Case 2.1 (30 ขั้นตอน), Case 2.2 (28 ขั้นตอน), Case 2.3 (33 ขั้นตอน), Case 2.4 (28 ขั้นตอน)
   - ให้ยึดรายละเอียดขั้นตอน 1 ถึง N ตาม [ข้อมูลสไลด์และเกณฑ์มาตรฐาน] ที่ค้นพบด้านล่างนี้เสมอ ห้ามแต่งขั้นตอนเองเด็ดขาด
${examGroundTruthSnippet}
${dynamicSlideExcerpts}`;

  // Sliding window and condensation for multi-turn chat history
  // Keep only the last 4 messages and condense long assistant replies (>280 chars) to prevent prompt context overflow
  const recentHistory = (conversationHistory || []).slice(-4);
  const trimmedHistory = recentHistory.map(m => {
    if (m.role === 'assistant' && typeof m.content === 'string' && m.content.length > 280) {
      return {
        ...m,
        content: m.content.slice(0, 260) + '... [สรุปสาระสำคัญเดิม]'
      };
    }
    return m;
  });

  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: userMessage }
  ];

  const isMachineOrSystemQuery = /(เครื่อง|ตู้|วาร์ป|กล้อง|ส่อง|teleport|telemetry|scada|สรุปยอด|ผลิตรวม|ภาพรวมโรงงาน|กี่เครื่อง|ปัญหาเครื่อง|เครื่องเสีย|เครื่องพัง|เบอร์\s*\d+|#\s*\d+)/i.test(userMessage);
  const toolsToProvide = isCasualMessage ? undefined : ((!isMachineOrSystemQuery && dynamicSlideExcerpts) ? undefined : toolsDefinition);

  return {
    isCasualMessage,
    retrievedSlidesList,
    toolsUsed,
    matchedExam,
    matchedProcessFlow,
    dynamicSlideExcerpts,
    systemPrompt,
    messages,
    toolsToProvide
  };
}

function formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam }) {
  const durationMs = Date.now() - startTime;
  const sources = (retrievedSlidesList || []).map(s => ({
    docCode: s.doc_code,
    docName: s.doc_name,
    pageNumber: s.page_number,
    title: s.title
  }));

  const toolsFormatted = (toolsUsed || []).map(t => {
    switch (t.name) {
      case 'get_machine_telemetry':
        return `ดึงค่า Telemetry เครื่องจักร ACA-DISP-${t.args && t.args.machine_num ? (t.args.machine_num < 10 ? '0' + t.args.machine_num : t.args.machine_num) : ''} จาก SCADA`;
      case 'get_problematic_machines':
        return 'สืบค้นเครื่องจักรที่แจ้งเตือน / มีปัญหาจาก SCADA';
      case 'get_factory_overall_summary':
        return 'ประมวลผลยอดผลิตและ Yield รวมของโรงงานจาก SCADA';
      case 'teleport_3d_camera':
        return `ควบคุมมุมมองกล้อง 3D Cleanroom ซูมไปที่เครื่อง #${t.args && t.args.machine_num ? t.args.machine_num : ''}`;
      case 'search_training_slides':
        return 'สืบค้นฐานข้อมูลสไลด์และเกณฑ์มาตรฐาน (FTS5 Search)';
      default:
        return t.name;
    }
  });

  return {
    durationMs,
    model: `${MODEL_NAME.includes('14b') ? 'Qwen 2.5:14b' : MODEL_NAME} (Local NVIDIA RTX 3050 GPU)`,
    sources,
    examMatch: matchedExam ? {
      docCode: matchedExam.doc_code,
      questionNumber: matchedExam.question_number,
      product: matchedExam.product,
      correctAnswer: matchedExam.correct_answer
    } : null,
    tools: toolsFormatted
  };
}

async function streamOllamaChat(url, payload, onTokenChunk) {
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama API Error (${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullGeneratedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        if (json.message && json.message.content) {
          const chunk = json.message.content;
          fullGeneratedText += chunk;
          if (typeof onTokenChunk === 'function') {
            onTokenChunk(chunk);
          }
        }
      } catch (e) {}
    }
  }

  if (buffer && buffer.trim()) {
    try {
      const json = JSON.parse(buffer.trim());
      if (json.message && json.message.content) {
        fullGeneratedText += json.message.content;
        if (typeof onTokenChunk === 'function') {
          onTokenChunk(json.message.content);
        }
      }
    } catch (e) {}
  }

  return fullGeneratedText;
}

// -------------------------------------------------------------------------
// 1. Standard Synchronous Orchestrator (Returns full payload JSON)
// -------------------------------------------------------------------------
async function runOrchestrator(userMessage, conversationHistory = []) {
  const startTime = Date.now();
  try {
    const ctx = prepareContext(userMessage, conversationHistory);
    const {
      isCasualMessage,
      retrievedSlidesList,
      toolsUsed,
      matchedExam,
      messages,
      toolsToProvide
    } = ctx;
    let triggeredAction = null;

    console.log(`[Orchestrator] Query: "${userMessage}" -> Calling Ollama (${MODEL_NAME}, tools: ${toolsToProvide ? 'enabled' : 'direct RAG'})...`);

    const firstRes = await fetchWithRetry(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: messages,
      tools: toolsToProvide,
      options: {
        num_ctx: NUM_CTX,
        num_gpu: NUM_GPU,
        num_predict: toolsToProvide ? 128 : 1500,
        temperature: isCasualMessage ? 0.35 : 0.08,
        top_p: 0.9,
        repeat_penalty: 1.15,
        stop: ["[ข้อกำหนด", "[คำแนะนำ", "[คำสั่ง", "User:", "Assistant:", "<|im_end|>"]
      },
      stream: false
    })
  });

  if (!firstRes.ok) {
    const errText = await firstRes.text();
    throw new Error(`Ollama API Error (${firstRes.status}): ${errText}`);
  }

  const responseJson = await firstRes.json();
  const assistantMsg = responseJson.message;

  // Intercept text-based tool calling tags
  if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
    const rawContent = assistantMsg.content || '';
    const funcMatch = rawContent.match(/<function-name>([a-zA-Z0-9_]+)<\/function-name>/i) 
                   || rawContent.match(/<tool_call>\s*{"name":\s*"([^"]+)"/i)
                   || rawContent.match(/\{"name":\s*"([a-zA-Z0-9_]+)"/i);

    if (funcMatch) {
      const fnName = funcMatch[1];
      let fnArgs = {};
      if (fnName === 'search_training_slides') {
        const qMatch = rawContent.match(/<query>([^<]+)<\/query>/i) || rawContent.match(/"query":\s*"([^"]+)"/i);
        fnArgs = { query: qMatch ? qMatch[1] : userMessage };
      } else if (fnName === 'get_machine_telemetry') {
        const numMatch = userMessage.match(/\b([1-9]|[1-4][0-9]|50)\b/);
        fnArgs = { machine_num: numMatch ? parseInt(numMatch[1], 10) : 27 };
      } else if (fnName === 'get_problematic_machines') {
        fnArgs = { filter: 'all' };
      } else if (fnName === 'get_factory_overall_summary') {
        fnArgs = {};
      }
      console.log(`[Orchestrator Text-Tool Parser] Intercepted text tool tag: "${fnName}" with args:`, fnArgs);
      assistantMsg.tool_calls = [{
        function: { name: fnName, arguments: fnArgs }
      }];
    }
  }

  function buildResult(reply, action = null) {
    const meta = formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam });
    return {
      reply,
      toolsUsed,
      action,
      thoughtMetadata: meta
    };
  }

  if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
    if (!assistantMsg.content || assistantMsg.content.trim() === '') {
      const lower = userMessage.toLowerCase();
      let fallbackTool = null;
      let fallbackArgs = {};

      const machineMatch = userMessage.match(/(?:เครื่อง|เบอร์|ตู้|#)\s*(\d+)/i) || userMessage.match(/\b([1-9]|[1-4][0-9]|50)\b/);
      if (lower.includes('วาร์ป') || lower.includes('ไปดู') || lower.includes('ส่อง') || lower.includes('กล้อง')) {
        fallbackTool = 'teleport_3d_camera';
        fallbackArgs = { machine_num: machineMatch ? parseInt(machineMatch[1], 10) : 27 };
      } else if (lower.includes('พัง') || lower.includes('เสีย') || lower.includes('ปัญหา') || lower.includes('เตือน') || lower.includes('ผิดปกติ') || lower.includes('hold') || lower.includes('warning') || lower.includes('อาการ')) {
        fallbackTool = 'get_problematic_machines';
        fallbackArgs = { filter: 'all' };
      } else if (machineMatch && (lower.includes('ข้อมูล') || lower.includes('สถานะ') || lower.includes('สเปก') || lower.includes('เป็นไง') || lower.includes('ขอ'))) {
        fallbackTool = 'get_machine_telemetry';
        fallbackArgs = { machine_num: parseInt(machineMatch[1], 10) };
      } else if (lower.includes('ภาพรวม') || lower.includes('ผลิตรวม') || lower.includes('ยอดรวม') || lower.includes('กี่เครื่อง') || lower.includes('database') || lower.includes('ฐานข้อมูล')) {
        fallbackTool = 'get_factory_overall_summary';
        fallbackArgs = {};
      } else if (lower.includes('สไลด์') || lower.includes('slide') || lower.includes('fcof') || lower.includes('aca') || lower.includes('apfa') || lower.includes('coil') || lower.includes('แต่งตัว') || lower.includes('กฎ') || lower.includes('ระเบียบ') || lower.includes('esd') || lower.includes('ซิลิโคน') || lower.includes('silicone') || lower.includes('สอบ') || lower.includes('เกณฑ์') || lower.includes('seagate') || lower.includes('spe-') || lower.includes('broken wire') || lower.includes('expose wire') || lower.includes('tray') || lower.includes('defect') || lower.includes('reject') || lower.includes('accept') || lower.includes('มาตรฐาน')) {
        fallbackTool = 'search_training_slides';
        fallbackArgs = { query: userMessage };
      }

      if (fallbackTool) {
        console.log(`[Orchestrator Fallback] Intent triggered tool: "${fallbackTool}"`);
        assistantMsg.tool_calls = [{
          function: { name: fallbackTool, arguments: fallbackArgs }
        }];
      } else {
        return buildResult('ขออภัยครับ กรุณาระบุรายละเอียดเพิ่มเติม เช่น ถามข้อมูลเครื่องจักร (เช่น ขอข้อมูลเครื่อง 20), ตรวจสอบเครื่องที่มีปัญหา หรือสั่งให้วาร์ปกล้องได้เลยครับ');
      }
    } else {
      let finalReply = cleanOutputText(assistantMsg.content);
      if (matchedExam) {
        const officialPrefix = matchedExam.correct_answer === 'ถูก'
          ? `**เฉลย: ถูก** (ข้อความในโจทย์ถูกต้องตามมาตรฐาน [${matchedExam.doc_code} ข้อ ${matchedExam.question_number}])\n\n`
          : `**เฉลย: ผิด** (ข้อความในโจทย์ไม่ถูกต้องตามมาตรฐาน [${matchedExam.doc_code} ข้อ ${matchedExam.question_number}])\n\n`;

        finalReply = finalReply.replace(/^(?:[❌✅]?\s*(?:เฉลย\s*:?\s*)?(?:ถูก|ผิด)(?:\s*\([^)]*\))?[^\n]*\n*)+/i, '').trim();
        finalReply = officialPrefix + finalReply;
      }
      return buildResult(finalReply);
    }
  }

  messages.push(assistantMsg);

  for (const call of assistantMsg.tool_calls) {
    const fnName = call.function.name;
    const fnArgs = call.function.arguments;
    toolsUsed.push({ name: fnName, args: fnArgs });

    const toolResult = await executeTool(fnName, fnArgs);
    if (fnName === 'search_training_slides' && toolResult && toolResult.slides) {
      for (const s of toolResult.slides) {
        if (!retrievedSlidesList.some(existing => existing.doc_code === s.doc_code && existing.page_number === s.page_number)) {
          retrievedSlidesList.push(s);
        }
      }
    }

    if (fnName === 'teleport_3d_camera' && toolResult.action === 'teleport') {
      triggeredAction = toolResult;
      const targetStr = toolResult.targetNum < 10 ? '0' + toolResult.targetNum : toolResult.targetNum;
      return buildResult(`กำลังนำมุมมองกล้อง 3D ซูมไปยังเครื่อง **ACA-DISP-${targetStr}** แบบ Real-time เรียบร้อยครับ`, triggeredAction);
    }

    messages.push({
      role: 'tool',
      content: JSON.stringify(toolResult)
    });
  }

  console.log(`[Orchestrator] ${toolsUsed.length} tool(s) executed. Synthesizing final answer with Qwen 2.5...`);

  const finalRes = await fetchWithRetry(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: messages,
      options: {
        num_ctx: NUM_CTX,
        num_gpu: NUM_GPU,
        num_predict: 1500,
        temperature: 0.08,
        top_p: 0.85,
        repeat_penalty: 1.15,
        stop: ["[ข้อกำหนด", "[คำแนะนำ", "[คำสั่ง", "[แนวทาง", "User:", "Assistant:", "<|im_end|>"]
      },
      stream: false
    })
  });

  if (!finalRes.ok) {
    const errText = await finalRes.text();
    throw new Error(`Ollama API Error (${finalRes.status}): ${errText}`);
  }

  const finalJson = await finalRes.json();
  let finalReply = cleanOutputText(finalJson.message.content);
  if (matchedExam) {
    const officialPrefix = matchedExam.correct_answer === 'ถูก'
      ? `**เฉลย: ถูก** (ข้อความในโจทย์ถูกต้องตามมาตรฐาน [${matchedExam.doc_code} ข้อ ${matchedExam.question_number}])\n\n`
      : `**เฉลย: ผิด** (ข้อความในโจทย์ไม่ถูกต้องตามมาตรฐาน [${matchedExam.doc_code} ข้อ ${matchedExam.question_number}])\n\n`;

    finalReply = finalReply.replace(/^(?:[❌✅]?\s*(?:เฉลย\s*:?\s*)?(?:ถูก|ผิด)(?:\s*\([^)]*\))?[^\n]*\n*)+/i, '').trim();
    finalReply = officialPrefix + finalReply;
  } else if (matchedProcessFlow) {
    const flowPrefix = getProcessFlowPrefix(matchedProcessFlow, userMessage);
    finalReply = finalReply.replace(/^(?:กระบวนการผลิต[^\n]*(?:มีทั้งหมด|แบ่งออกเป็น)[^\n]*\n*)+/i, '').trim();
    if (!finalReply.startsWith(flowPrefix)) {
      finalReply = flowPrefix + finalReply;
    }
  }
    return buildResult(finalReply, triggeredAction);
  } catch (err) {
    console.error('[Orchestrator Error]:', err.message);
    const isOllamaDown = err.message.includes('ECONNREFUSED') ||
                         err.message.includes('fetch failed') ||
                         err.message.includes('ENOTFOUND') ||
                         err.message.includes('Ollama API Error') ||
                         err.message.includes('connect');
    if (isOllamaDown) {
      return {
        reply: 'กรุณาติดต่อผู้เปิดเซิฟเวอร์',
        toolsUsed: [],
        action: null,
        thoughtMetadata: formatThoughtMetadata({ startTime, retrievedSlidesList: [], toolsUsed: [], matchedExam: null })
      };
    }
    throw err;
  }
}

// -------------------------------------------------------------------------
// 2. Real-time Streaming Orchestrator (Server-Sent Events / Token Streams)
// -------------------------------------------------------------------------
async function runOrchestratorStream(userMessage, conversationHistory = [], callbacks = {}) {
  const startTime = Date.now();
  const { onMeta, onToken, onAction, onDone, onError } = callbacks;

  try {
    const ctx = prepareContext(userMessage, conversationHistory);
    const {
      isCasualMessage,
      retrievedSlidesList,
      toolsUsed,
      matchedExam,
      matchedProcessFlow,
      messages,
      toolsToProvide
    } = ctx;

    // Send initial metadata immediately (<0.1s)
    if (typeof onMeta === 'function') {
      onMeta(formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam }));
    }

    // Direct RAG or casual question (No tool calling required)
    if (!toolsToProvide) {
      console.log(`[Orchestrator Stream] Direct RAG stream (${MODEL_NAME}): "${userMessage}"`);

      let officialPrefix = '';
      if (matchedExam) {
        officialPrefix = matchedExam.correct_answer === 'ถูก'
          ? `**เฉลย: ถูก** (ข้อความในโจทย์ถูกต้องตามมาตรฐาน [${matchedExam.doc_code} ข้อ ${matchedExam.question_number}])\n\n`
          : `**เฉลย: ผิด** (ข้อความในโจทย์ไม่ถูกต้องตามมาตรฐาน [${matchedExam.doc_code} ข้อ ${matchedExam.question_number}])\n\n`;

        if (typeof onToken === 'function') {
          onToken(officialPrefix);
        }
      } else if (matchedProcessFlow) {
        officialPrefix = getProcessFlowPrefix(matchedProcessFlow, userMessage);

        if (typeof onToken === 'function') {
          onToken(officialPrefix);
        }
      }

      let hasChineseBlocked = false;
      let isFirstChunk = true;
      const rawText = await streamOllamaChat(`${OLLAMA_URL}/api/chat`, {
        model: MODEL_NAME,
        messages: messages,
        options: {
          num_ctx: NUM_CTX,
          num_gpu: NUM_GPU,
          num_predict: 1500,
          temperature: isCasualMessage ? 0.35 : 0.08,
          top_p: 0.9,
          repeat_penalty: 1.15,
          stop: ["[ข้อกำหนด", "[คำแนะนำ", "[คำสั่ง", "[แนวทาง", "User:", "Assistant:", "<|im_end|>", "请注意", "根据您", "注：", "注意："]
        },
        stream: true
      }, (chunk) => {
        if (hasChineseBlocked) return;
        if (/[\u4e00-\u9fff]{2,}/.test(chunk)) {
          hasChineseBlocked = true;
          return;
        }
        let cleanChunk = chunk.replace(/[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g, '');
        if (isFirstChunk && (matchedExam || matchedProcessFlow)) {
          if (matchedExam) {
            cleanChunk = cleanChunk.replace(/^(?:[❌✅]?\s*(?:เฉลย\s*:?\s*)?(?:ถูก|ผิด)(?:\s*\([^)]*\))?[^\n]*\n*)+/i, '');
          }
          if (matchedProcessFlow) {
            cleanChunk = cleanChunk.replace(/^(?:กระบวนการผลิต[^\n]*(?:มีทั้งหมด|แบ่งออกเป็น)[^\n]*\n*)+/i, '');
          }
          isFirstChunk = false;
        }
        if (cleanChunk && typeof onToken === 'function') {
          onToken(cleanChunk);
        }
      });

      if (typeof onDone === 'function') {
        const finalMeta = formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam });
        onDone({ fullText: officialPrefix + rawText, thoughtMetadata: finalMeta });
      }
      return;
    }

    // Tool check turn (Max 128 tokens)
    console.log(`[Orchestrator Stream] Tool check turn (${MODEL_NAME}): "${userMessage}"`);

    const firstRes = await fetchWithRetry(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        tools: toolsToProvide,
        options: {
          num_ctx: NUM_CTX,
          num_gpu: NUM_GPU,
          num_predict: 128,
          temperature: 0.08,
          top_p: 0.9,
          repeat_penalty: 1.15,
          stop: ["[ข้อกำหนด", "[คำแนะนำ", "[คำสั่ง", "User:", "Assistant:", "<|im_end|>"]
        },
        stream: false
      })
    });

    if (!firstRes.ok) {
      const errText = await firstRes.text();
      throw new Error(`Ollama API Error (${firstRes.status}): ${errText}`);
    }

    const responseJson = await firstRes.json();
    const assistantMsg = responseJson.message;

    // Text-tool tag fallback
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      const rawContent = assistantMsg.content || '';
      const funcMatch = rawContent.match(/<function-name>([a-zA-Z0-9_]+)<\/function-name>/i) 
                     || rawContent.match(/<tool_call>\s*{"name":\s*"([^"]+)"/i)
                     || rawContent.match(/\{"name":\s*"([a-zA-Z0-9_]+)"/i);

      if (funcMatch) {
        const fnName = funcMatch[1];
        let fnArgs = {};
        if (fnName === 'search_training_slides') {
          const qMatch = rawContent.match(/<query>([^<]+)<\/query>/i) || rawContent.match(/"query":\s*"([^"]+)"/i);
          fnArgs = { query: qMatch ? qMatch[1] : userMessage };
        } else if (fnName === 'get_machine_telemetry') {
          const numMatch = userMessage.match(/\b([1-9]|[1-4][0-9]|50)\b/);
          fnArgs = { machine_num: numMatch ? parseInt(numMatch[1], 10) : 27 };
        } else if (fnName === 'get_problematic_machines') {
          fnArgs = { filter: 'all' };
        } else if (fnName === 'get_factory_overall_summary') {
          fnArgs = {};
        }
        assistantMsg.tool_calls = [{ function: { name: fnName, arguments: fnArgs } }];
      }
    }

    // Intent fallback if empty content and no tool calls
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      if (!assistantMsg.content || assistantMsg.content.trim() === '') {
        const lower = userMessage.toLowerCase();
        let fallbackTool = null;
        let fallbackArgs = {};
        const machineMatch = userMessage.match(/(?:เครื่อง|เบอร์|ตู้|#)\s*(\d+)/i) || userMessage.match(/\b([1-9]|[1-4][0-9]|50)\b/);
        if (lower.includes('วาร์ป') || lower.includes('ไปดู') || lower.includes('ส่อง') || lower.includes('กล้อง')) {
          fallbackTool = 'teleport_3d_camera';
          fallbackArgs = { machine_num: machineMatch ? parseInt(machineMatch[1], 10) : 27 };
        } else if (lower.includes('พัง') || lower.includes('เสีย') || lower.includes('ปัญหา') || lower.includes('เตือน') || lower.includes('ผิดปกติ') || lower.includes('hold') || lower.includes('warning') || lower.includes('อาการ')) {
          fallbackTool = 'get_problematic_machines';
          fallbackArgs = { filter: 'all' };
        } else if (machineMatch && (lower.includes('ข้อมูล') || lower.includes('สถานะ') || lower.includes('สเปก') || lower.includes('เป็นไง') || lower.includes('ขอ'))) {
          fallbackTool = 'get_machine_telemetry';
          fallbackArgs = { machine_num: parseInt(machineMatch[1], 10) };
        } else if (lower.includes('ภาพรวม') || lower.includes('ผลิตรวม') || lower.includes('ยอดรวม') || lower.includes('กี่เครื่อง') || lower.includes('database') || lower.includes('ฐานข้อมูล')) {
          fallbackTool = 'get_factory_overall_summary';
          fallbackArgs = {};
        } else if (lower.includes('สไลด์') || lower.includes('slide') || lower.includes('fcof') || lower.includes('aca') || lower.includes('apfa') || lower.includes('coil') || lower.includes('แต่งตัว') || lower.includes('กฎ') || lower.includes('ระเบียบ') || lower.includes('esd') || lower.includes('ซิลิโคน') || lower.includes('silicone') || lower.includes('สอบ') || lower.includes('เกณฑ์') || lower.includes('seagate') || lower.includes('spe-') || lower.includes('broken wire') || lower.includes('expose wire') || lower.includes('tray') || lower.includes('defect') || lower.includes('reject') || lower.includes('accept') || lower.includes('มาตรฐาน')) {
          fallbackTool = 'search_training_slides';
          fallbackArgs = { query: userMessage };
        }

        if (fallbackTool) {
          assistantMsg.tool_calls = [{ function: { name: fallbackTool, arguments: fallbackArgs } }];
        } else {
          const fallbackMsg = 'ขออภัยครับ กรุณาระบุรายละเอียดเพิ่มเติม เช่น ถามข้อมูลเครื่องจักร (เช่น ขอข้อมูลเครื่อง 20), ตรวจสอบเครื่องที่มีปัญหา หรือสั่งให้วาร์ปกล้องได้เลยครับ';
          if (typeof onToken === 'function') onToken(fallbackMsg);
          if (typeof onDone === 'function') onDone({ fullText: fallbackMsg, thoughtMetadata: formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam }) });
          return;
        }
      } else {
        const cleanAns = cleanOutputText(assistantMsg.content);
        if (typeof onToken === 'function') onToken(cleanAns);
        if (typeof onDone === 'function') onDone({ fullText: cleanAns, thoughtMetadata: formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam }) });
        return;
      }
    }

    // Execute tool(s)
    messages.push(assistantMsg);

    for (const call of assistantMsg.tool_calls) {
      const fnName = call.function.name;
      const fnArgs = call.function.arguments;
      toolsUsed.push({ name: fnName, args: fnArgs });

      const toolResult = await executeTool(fnName, fnArgs);
      if (fnName === 'search_training_slides' && toolResult && toolResult.slides) {
        for (const s of toolResult.slides) {
          if (!retrievedSlidesList.some(existing => existing.doc_code === s.doc_code && existing.page_number === s.page_number)) {
            retrievedSlidesList.push(s);
          }
        }
      }

      if (fnName === 'teleport_3d_camera' && toolResult.action === 'teleport') {
        if (typeof onAction === 'function') onAction(toolResult);
        const targetStr = toolResult.targetNum < 10 ? '0' + toolResult.targetNum : toolResult.targetNum;
        const warpText = `กำลังนำมุมมองกล้อง 3D ซูมไปยังเครื่อง **ACA-DISP-${targetStr}** แบบ Real-time เรียบร้อยครับ`;
        if (typeof onToken === 'function') onToken(warpText);
        if (typeof onDone === 'function') onDone({ fullText: warpText, action: toolResult, thoughtMetadata: formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam }) });
        return;
      }

      messages.push({
        role: 'tool',
        content: JSON.stringify(toolResult)
      });
    }

    // Send updated metadata with executed tools
    if (typeof onMeta === 'function') {
      onMeta(formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam }));
    }

    console.log(`[Orchestrator Stream] Synthesizing tool response with stream (${MODEL_NAME})...`);

    let hasToolChineseBlocked = false;
    const rawFinalText = await streamOllamaChat(`${OLLAMA_URL}/api/chat`, {
      model: MODEL_NAME,
      messages: messages,
      options: {
        num_ctx: NUM_CTX,
        num_gpu: NUM_GPU,
        num_predict: 1500,
        temperature: 0.08,
        top_p: 0.85,
        repeat_penalty: 1.15,
        stop: ["[ข้อกำหนด", "[คำแนะนำ", "[คำสั่ง", "[แนวทาง", "User:", "Assistant:", "<|im_end|>", "请注意", "根据您", "注：", "注意："]
      },
      stream: true
    }, (chunk) => {
      if (hasToolChineseBlocked) return;
      if (/[\u4e00-\u9fff]{2,}/.test(chunk)) {
        hasToolChineseBlocked = true;
        return;
      }
      const cleanChunk = chunk.replace(/[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g, '');
      if (typeof onToken === 'function' && cleanChunk) {
        onToken(cleanChunk);
      }
    });

    if (typeof onDone === 'function') {
      const finalMeta = formatThoughtMetadata({ startTime, retrievedSlidesList, toolsUsed, matchedExam });
      onDone({ fullText: rawFinalText, thoughtMetadata: finalMeta });
    }

  } catch (err) {
    console.error('[Orchestrator Stream Error]:', err.message);
    const isOllamaDown = err.message.includes('ECONNREFUSED') ||
                         err.message.includes('fetch failed') ||
                         err.message.includes('ENOTFOUND') ||
                         err.message.includes('Ollama API Error') ||
                         err.message.includes('connect') ||
                         err.message.includes('terminated') ||
                         err.message.includes('premature') ||
                         err.message.includes('closed');

    if (isOllamaDown) {
      const serverOffMsg = 'กรุณาติดต่อผู้เปิดเซิฟเวอร์';
      if (typeof onToken === 'function') {
        onToken(serverOffMsg);
      }
      if (typeof onDone === 'function') {
        onDone({ fullText: serverOffMsg, thoughtMetadata: formatThoughtMetadata({ startTime, retrievedSlidesList: [], toolsUsed: [], matchedExam: null }) });
      }
      return;
    }

    if (typeof onError === 'function') {
      onError(err);
    }
  }
}

module.exports = { runOrchestrator, runOrchestratorStream, prepareContext };
