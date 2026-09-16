const { toolsDefinition } = require('./tools/schemas.js');
const { executeTool } = require('./tools/handlers.js');
const { BELTON_KNOWLEDGE } = require('./knowledge/belton_knowledge.js');
const { searchSlideKnowledge } = require('./knowledge/slide_knowledge_db.js');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5:3b';

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
  [/上/g, ' บน '],
  [/的/g, ' ของ '],
  [/或/g, ' หรือ '],
  [/和/g, ' และ '],
  [/是/g, ' คือ '],
  [/有/g, ' มี '],
  [/无/g, ' ไม่มี ']
];

function cleanOutputText(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/<function[_-]call>.*?<\/function[_-]call>/gis, '')
    .replace(/<function[_-]name>.*?<\/function[_-]name>/gis, '')
    .replace(/<tool[_-]call>.*?<\/tool[_-]call>/gis, '')
    .replace(/<query>.*?<\/query>/gis, '')
    // Strip common filler opening pleasantries if emitted
    .replace(/^(สวัสดีครับ[,\s]*|ยินดีที่ได้ช่วยเหลือครับ[,\s]*|จากการตรวจสอบข้อมูลในระบบ(?:ฐานข้อมูล)?(?:พบว่า)?[,\s]*|ตามข้อมูล(?:ในระบบ)?[,\s]*)/i, '')
    // Strip echoed prompt headers if leaked
    .replace(/\[EXECUTIVE COMMUNICATION PROTOCOL.*?$/is, '')
    .replace(/\[FEW-SHOT.*?$/is, '')
    .replace(/\[STRICT.*?$/is, '')
    .replace(/\[ข้อกำหนด.*?$/is, '')
    .replace(/\[แนวทาง.*?$/is, '')
    .replace(/\[คำสั่ง.*?$/is, '')
    .replace(/\[คำแนะนำ.*?$/is, '')
    .replace(/\[ข้อมูลสไลด์.*?$/is, '')
    // Strip trailing pleasantries if emitted
    .replace(/\n+(?:หากคุณมีข้อสงสัย|หากมีข้อสงสัย|สามารถสอบถามเพิ่มเติม|มีอะไรให้ผมช่วยอีกไหม|หวังว่าข้อมูลนี้|หากมีข้อมูลเพิ่มเติม|หากมีคำถามเพิ่มเติม|ต้องการข้อมูล).*$/is, '');

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
    .replace(/[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g, '')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

async function runOrchestrator(userMessage, conversationHistory = []) {
  // 1. Dynamic Slide Retrieval (RAG) from local SQLite FTS5 database (669 pages: Belton + Seagate)
  let dynamicSlideExcerpts = '';
  try {
    const retrievedSlides = searchSlideKnowledge(userMessage, 3);
    if (retrievedSlides && retrievedSlides.length > 0) {
      dynamicSlideExcerpts = `\n\n[ข้อมูลสไลด์และเกณฑ์มาตรฐานที่ค้นพบจากฐานข้อมูล 669 หน้า]:\n` +
        retrievedSlides.map(s => `เอกสาร: [${s.doc_code}] ${s.doc_name} (หน้า ${s.page_number})\nหัวข้อ: ${s.title}\nเนื้อหาข้อกำหนด:\n${s.snippet}`).join('\n---\n') +
        `\n\n[คำสั่งสำคัญ]: จงตอบเป็นภาษาไทยเท่านั้น และระบุรหัสเอกสารกับเลขหน้ากำกับเสมอ เช่น [${retrievedSlides[0].doc_code} หน้า ${retrievedSlides[0].page_number}]`;
    }
  } catch (searchErr) {
    console.warn('⚠️ [Orchestrator] Slide knowledge retrieval error:', searchErr.message);
  }

  const systemPrompt = `คุณคือ "BELTON AI" วิศวกรผู้เชี่ยวชาญด้านมาตรฐานการผลิตและระบบคลีนรูมของ Belton Technology (โรงงานนวนคร)
หน้าที่ของคุณคือตอบคำถามผู้ใช้ให้ตรงประเด็น กระชับ ชัดเจน เนื้อล้วนๆ ไม่เยิ่นเย้อ 0% น้ำ
ข้อกำหนดสำคัญ:
1. ภาษาไทย 100%: ต้องตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาจีน (中文) หรืออักษรจีนปนมาเด็ดขาด
2. คำศัพท์เทคนิค:
   - Coil = คอยล์ / ขดลวด (ห้ามแปลว่า เส้นโค้ง)
   - Coil pack = แพ็คคอยล์ / มัดขดลวด
   - Tin wire / Tinning = ลวดเคลือบดีบุก / จุดบัดกรี
   - Exit wire = สายออก / ลวดทางออก
   - Wet Tray = ถาดเปียก
3. อ้างอิงเอกสาร: หากเป็นคำถามเกี่ยวกับมาตรฐาน สเปก หรือข้อสอบ ให้อ้างอิงรหัสเอกสารและเลขหน้ากำกับเสมอ เช่น [SPE-01-08-01 หน้า 10]
4. โครงสร้างคำตอบเกณฑ์มาตรฐาน (Defect Criteria):
   - นิยาม / ลักษณะอาการ
   - เกณฑ์ Acceptance (ยอมรับ): หากหัวข้อหรือข้อกำหนดระบุว่า NOT ALLOW หรือไม่อนุญาต ให้ระบุว่า "ยอมรับไม่ได้ / ไม่อนุญาตเด็ดขาด (Reject เสมอ)"
   - เกณฑ์ Reject (ปฏิเสธ): (หากเกณฑ์ระบุว่า "ไม่เป็นไปตามข้อกำหนดข้างต้น" ให้อธิบายเงื่อนไขตรงข้ามของ Acceptance ให้ชัดเจน เช่น ความยาว tin wire เหลือน้อยกว่า 80%)
5. ไม่เกริ่นนำ: ห้ามทักทาย ห้ามมีคำว่า "สวัสดีครับ" หรือ "จากการตรวจสอบ" ให้เริ่มที่คำตอบตรงๆ ทันที
6. ห้ามตอบปนเรื่องอื่น: หากถามเรื่องสเปก/ของเสีย/ข้อสอบ ให้ตอบเฉพาะเกณฑ์มาตรฐาน ห้ามดึงเรื่องเครื่องจักรมาตอบ และหากถามเรื่องเครื่องจักร ให้ตอบเฉพาะสถานะเครื่องจักร
${dynamicSlideExcerpts}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  console.log(`🤖 [Orchestrator] Query: "${userMessage}" -> Calling Ollama (${MODEL_NAME})...`);

  const firstRes = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: messages,
      tools: toolsDefinition,
      options: {
        num_ctx: 8192,
        temperature: 0.08,
        top_p: 0.85,
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

  // Intercept text-based tool calling tags if Qwen emitted XML or raw function tags
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
      console.log(`💡 [Orchestrator Text-Tool Parser] Intercepted text tool tag: "${fnName}" with args:`, fnArgs);
      assistantMsg.tool_calls = [{
        function: { name: fnName, arguments: fnArgs }
      }];
    }
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
        console.log(`💡 [Orchestrator Fallback] Intent triggered tool: "${fallbackTool}"`);
        assistantMsg.tool_calls = [{
          function: { name: fallbackTool, arguments: fallbackArgs }
        }];
      } else {
        return {
          reply: 'ขออภัยครับ กรุณาระบุรายละเอียดเพิ่มเติม เช่น ถามข้อมูลเครื่องจักร (เช่น ขอข้อมูลเครื่อง 20), ตรวจสอบเครื่องที่มีปัญหา หรือสั่งให้วาร์ปกล้องได้เลยครับ',
          toolsUsed: [],
          action: null
        };
      }
    } else {
      return {
        reply: cleanOutputText(assistantMsg.content),
        toolsUsed: [],
        action: null
      };
    }
  }

  messages.push(assistantMsg);
  const toolsUsed = [];
  let triggeredAction = null;

  for (const call of assistantMsg.tool_calls) {
    const fnName = call.function.name;
    const fnArgs = call.function.arguments;
    toolsUsed.push({ name: fnName, args: fnArgs });

    const toolResult = await executeTool(fnName, fnArgs);

    if (fnName === 'teleport_3d_camera' && toolResult.action === 'teleport') {
      triggeredAction = toolResult;
    }

    messages.push({
      role: 'tool',
      content: JSON.stringify(toolResult)
    });
  }

  console.log(`🔄 [Orchestrator] ${toolsUsed.length} tool(s) executed. Synthesizing final answer with Qwen 2.5...`);

  const finalRes = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: messages,
      options: {
        num_ctx: 8192,
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
  return {
    reply: cleanOutputText(finalJson.message.content),
    toolsUsed: toolsUsed,
    action: triggeredAction
  };
}

module.exports = { runOrchestrator };
