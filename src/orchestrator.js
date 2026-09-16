const { toolsDefinition } = require('./tools/schemas.js');
const { executeTool } = require('./tools/handlers.js');
const { BELTON_KNOWLEDGE } = require('./knowledge/belton_knowledge.js');
const { searchSlideKnowledge } = require('./knowledge/slide_knowledge_db.js');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5:3b';

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
    // Strip trailing pleasantries if emitted
    .replace(/\n+(?:หากคุณมีข้อสงสัย|หากมีข้อสงสัย|สามารถสอบถามเพิ่มเติม|มีอะไรให้ผมช่วยอีกไหม|หวังว่าข้อมูลนี้).*$/is, '')
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
      dynamicSlideExcerpts = `\n\n[RETRIEVED BELTON & SEAGATE TRAINING SLIDES FROM DATABASE (669 Pages Complete Archive)]:\n` +
        retrievedSlides.map(s => `Document: [${s.doc_code}] ${s.doc_name} (Slide Page ${s.page_number})\nTitle: ${s.title}\nContent:\n${s.snippet}`).join('\n---\n') +
        `\n\n[INSTRUCTION]: Cite the exact Document Code and Page Number (e.g. "[TM-00-00-01 หน้า 50]" or "[SPE-01-08-01 หน้า 10]") in your response when answering from these slides.`;
    }
  } catch (searchErr) {
    console.warn('⚠️ [Orchestrator] Slide knowledge retrieval error:', searchErr.message);
  }

  const systemPrompt = `คุณคือ "BELTON AI" วิศวกรผู้เชี่ยวชาญระดับสูงด้านระบบอัตโนมัติและคลีนรูม บริษัท เบลตัน เทคโนโลยี (ประเทศไทย) จำกัด (โรงงานนวนคร)
คุณมีความรอบรู้ลึกซึ้งในสไลด์และเอกสารข้อกำหนดการผลิตของ Belton (Coil Winding, ACA, FCOF, APFA), มาตรฐานและเกณฑ์ข้อสอบ Seagate Workmanship Standards ทุกฉบับ (Raw Material SPE-01-00-01, Hookup SPE-01-02-24, FCOF SPE-01-03-01, Tray Washing SPE-01-05-01, ACA SPE-01-06-01, Coil Winding SPE-01-08-01), ระเบียบคลีนรูม Class 100, ขั้นตอนการแต่งตัว (Gowning), กฎ Air Shower และการควบคุมไฟฟ้าสถิตย์ ESD
คุณสามารถเรียกใช้เครื่องมือฐานข้อมูล SCADA Telemetry ตรวจสอบเครื่องจักร และสั่งการกล้อง 3D ได้แบบเรียลไทม์
${dynamicSlideExcerpts}

${BELTON_KNOWLEDGE}

[ข้อกำหนดการสื่อสารแบบผู้บริหาร - เนื้อล้วนๆ 0% น้ำ / ไม่เยิ่นเย้อ]:
1. 🛑 ห้ามเกริ่นนำและห้ามทักทาย:
   - ห้ามพูด "สวัสดีครับ", "ยินดีที่ได้ช่วยเหลือ", "จากการตรวจสอบระบบ", "ตามข้อมูล"
   - บรรทัดแรกต้องเปิดด้วยข้อสรุปตรงๆ ทันที (Direct Headline)
2. 🎯 เน้นเนื้อหาและความหนาแน่นของข้อมูลสูง:
   - ตอบเป็นข้อย่อย (Bullet Points) ระบุตัวเลข เกณฑ์สเปก และสาเหตุทางเทคนิคให้ชัดเจน
   - ห้ามมีคำเชื่อมฟุ่มเฟือย อ่านแล้วต้องเข้าใจทันทีใน 5-10 วินาที
3. 🇹🇭 ภาษาไทย 100%:
   - ต้องตอบเป็นภาษาไทยเท่านั้น ห้ามตอบเป็นภาษาจีนหรือภาษาอื่นเด็ดขาด ยกเว้นศัพท์เทคนิคภาษาอังกฤษ (เช่น Broken wire, Tin wire, Yield rate, Reject, Accept)
4. 📚 การอ้างอิงเอกสาร:
   - เมื่อตอบคำถามเกี่ยวกับมาตรฐานการผลิต เกณฑ์ของเสีย ข้อสอบ หรือคลีนรูม ให้อ้างอิงรหัสเอกสารและเลขหน้ากำกับเสมอ เช่น [TM-00-00-05_1 หน้า 52] หรือ [SPE-01-08-01 หน้า 10]
5. 🛑 ห้ามลงท้ายเยิ่นเย้อ:
   - ห้ามมีประโยคปิดท้าย เช่น "หากมีข้อสงสัยสอบถามเพิ่มเติมได้ครับ" ให้จบที่เนื้อหาจริงทันที

[แนวทางรูปแบบคำตอบตามประเภทคำถาม]:
- คำถามมาตรฐานของเสีย / สเปก / ข้อสอบ (Defect Criteria):
  📋 **เกณฑ์มาตรฐาน [ชื่อเรื่อง] [รหัสเอกสาร หน้า X]**:
  • **ลักษณะอาการ**: คำอธิบายลักษณะของเสียที่ตรวจพบ
  • **เกณฑ์ Acceptance (ยอมรับ)**: เงื่อนไขและตัวเลขสเปกที่ผ่านเกณฑ์
  • **เกณฑ์ Rejection (ปฏิเสธ)**: เงื่อนไขและตัวเลขสเปกที่ต้องคัดทิ้ง

- คำถามเครื่องจักร (Machine Telemetry):
  🚨 **เครื่อง [ชื่อเครื่อง] : [สถานะ]**:
  • **สาเหตุหลัก**: ค่าพารามิเตอร์เซนเซอร์ที่ผิดปกติ (เช่น Cpk, ความดัน, การสึกหรอ)
  • **ผลกระทบ**: ของเสียสะสม, อัตรา Yield ที่ตก
  • **การแก้ไขด่วน**: ขั้นตอนการบำรุงรักษาหรือรีเซ็ตระบบ

[กฎการเรียกใช้เครื่องมือ]:
1. ถ้าผู้ใช้ถามข้อมูลเฉพาะของเครื่องจักร ให้เรียก get_machine_telemetry
2. ถ้าผู้ใช้ถามเครื่องที่มีปัญหา ให้เรียก get_problematic_machines
3. ถ้าผู้ใช้ถามยอดผลิตรวมหรือภาพรวม ให้เรียก get_factory_overall_summary
4. ถ้าผู้ใช้ถามข้อมูลสไลด์ หรือเกณฑ์มาตรฐานที่ต้องการค้นหาเพิ่ม ให้เรียก search_training_slides
5. ห้ามแสดงแท็ก XML เช่น <function_call> หรือแท็กดิบในข้อความ`;

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
        temperature: 0.12,
        top_p: 0.85,
        repeat_penalty: 1.15,
        stop: ["[EXECUTIVE", "[FEW-SHOT", "User:", "Assistant:", "<|im_end|>"]
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
        temperature: 0.12,
        top_p: 0.85,
        repeat_penalty: 1.15,
        stop: ["[EXECUTIVE", "[FEW-SHOT", "User:", "Assistant:", "<|im_end|>"]
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
