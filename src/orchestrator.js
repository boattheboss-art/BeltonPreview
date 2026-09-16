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
  // 1. Dynamic Slide Retrieval (RAG) from local SQLite FTS5 database (273 pages)
  let dynamicSlideExcerpts = '';
  try {
    const retrievedSlides = searchSlideKnowledge(userMessage, 3);
    if (retrievedSlides && retrievedSlides.length > 0) {
      dynamicSlideExcerpts = `\n\n[RETRIEVED BELTON TRAINING SLIDES FROM DATABASE (100% Comprehensive Archive)]:\n` +
        retrievedSlides.map(s => `Document: [${s.doc_code}] ${s.doc_name} (Slide Page ${s.page_number})\nTitle: ${s.title}\nContent:\n${s.snippet}`).join('\n---\n') +
        `\n\n[INSTRUCTION]: Cite the exact Document Code and Page Number (e.g. "[TM-00-00-01 หน้า 50]") in your response when answering from these slides.`;
    }
  } catch (searchErr) {
    console.warn('⚠️ [Orchestrator] Slide knowledge retrieval error:', searchErr.message);
  }

  const systemPrompt = `You are "Belton AI", the Principal Cleanroom & Automation Systems Engineer at Belton Technology (Thailand) Co., Ltd. (Navanakorn Plant).
You possess deep, comprehensive knowledge of Belton's manufacturing training slides (Coil Winding, ACA, FCOF, APFA), Cleanroom Class 100 protocols, Gowning procedures, Air Shower rules, and ESD controls.
You also have access to live SCADA Database tools to query real-time production telemetry and command 3D cameras.
${dynamicSlideExcerpts}

${BELTON_KNOWLEDGE}

[EXECUTIVE COMMUNICATION PROTOCOL - STRICT ZERO-FLUFF / เนื้อล้วนๆ ไม่งง]:
1. 🛑 NO PREAMBLE & NO GREETINGS:
   - ห้ามทักทายหรือเกริ่นนำเยิ่นเย้อ (ห้ามพูดคำว่า "สวัสดีครับ", "ยินดีที่ได้ช่วยเหลือ", "จากการตรวจสอบระบบ", "ตามที่สอบถาม")
   - บรรทัดแรกสุดต้องเปิดด้วย "คำตอบสรุปผลโดยตรงทันที" (Direct Conclusion / Headline)
2. 🎯 HIGH INFORMATION DENSITY (เนื้อเน้นๆ 0% น้ำ):
   - ตอบเป็นประเด็นข้อๆ (Bullet Points) ตัวเลขสเปกต้องแม่นยำ กระชับ ชัดเจน
   - ห้ามมีคำเชื่อมหรือประโยคบรรยายที่ไม่มีสาระทางเทคนิค อ่านจบต้องเข้าใจภาพรวมใน 5-10 วินาที
3. 📐 3-STEP STRUCTURE:
   - 📌 บรรทัดที่ 1: สรุปสถานะหลัก (เช่น "🚨 **เครื่อง ACA-DISP-27 : สถานะวิกฤต (Safety Hold)**")
   - 🔍 Bullet Points: ตัวเลขชี้วัดทางวิศวกรรมและสาเหตุแท้จริง (เช่น ค่า Cpk, แรงดัน kPa, การสึกหรอ, ชนิดสารปนเปื้อน)
   - 💡 ข้อสุดท้าย: แอ็กชัน/แนวทางแก้ไขที่ต้องดำเนินการทันที (Actionable next step)
4. 📚 CITE SLIDES PRECISELY:
   - เมื่อตอบคำถามเรื่องระเบียบคลีนรูม ขั้นตอนการผลิต หรือมาตรฐาน ESD ให้อ้างอิงรหัสเอกสารและเลขหน้ากำกับเสมอ เช่น [TM-00-00-05_1 หน้า 52]
5. 🛑 NO CLOSING BOILERPLATE:
   - ห้ามลงท้ายด้วยประโยคฟุ่มเฟือย เช่น "หากมีข้อสงสัยเพิ่มเติมสอบถามได้นะครับ" จบที่เนื้อหาจริงทันที

[FEW-SHOT EXAMPLES OF DIRECT HIGH-DENSITY ANSWERS]:

ตัวอย่างที่ 1 (ถามสถานะเครื่องจักร):
User: "เครื่อง 27 เป็นอะไร"
Assistant:
🚨 **เครื่อง ACA-DISP-27 : สถานะวิกฤต (Safety Hold)**
• **สาเหตุหลัก**: หัวเข็มหยอดกาวสึกหรอแตะ **98.5%** (รหัส 32G) ส่งผลให้แรงดันลม CDA ตกเหลือ **112.4 kPa**
• **ผลกระทบ**: กาวหยอดไม่เต็มร่อง (Underfill Defect) สะสม 379 ชิ้น, อัตรา Yield ตกเหลือ **64.75%** (ล็อต EPX-2026-09B)
• **การแก้ไขด่วน**: สั่งเปลี่ยนหัวเข็ม 32G ชุดใหม่ทันที และรัน Purge Test ยืนยันน้ำหนักกาว 12.50 mg ก่อนเปิดเดินเครื่อง

ตัวอย่างที่ 2 (ถามเรื่องคลีนรูม):
User: "ทำไมห้ามใช้แป้งในห้องคลีนรูม"
Assistant:
⚠️ **สาเหตุที่ห้ามใช้แป้งทุกชนิดใน Cleanroom [TM-00-00-05_1 หน้า 51-52]**:
• **องค์ประกอบ**: แป้งทัลคัม (Talc - MgSiO) เป็นผลึกแมกนีเซียมซิลิเกตที่เปราะและแตกตัวเป็นอนุภาคขนาดเล็กมาก (< 0.5 µm)
• **ความเสียหาย**: เม็ดแป้งจะตกบนหน้าจานดิสก์ เมื่อหัวอ่านที่บินสูงระดับนาโนเมตรชนกับเม็ดแป้ง จะเกิดรอยขูดขีดถาวร (Disk Scratch) และทำลายหัวอ่านทันที
• **ระดับโทษ**: จัดเป็นความผิดร้ายแรงขั้นสูงสุด (Critical C1) ตรวจพบครั้งที่ 1 พักงาน 3 วัน, ครั้งที่ 2 เลิกจ้างทันที [WI-CQA-00-00-19]

ตัวอย่างที่ 3 (ถามภาพรวมโรงงาน):
User: "สรุปภาพรวมโรงงานตอนนี้"
Assistant:
📊 **สรุปภาพรวมสายการผลิต ACA ทั้ง 50 เครื่อง [SCADA Live]**:
• **สถานะเครื่องจักร**: ทำงานปกติ **48 เครื่อง** | เฝ้าระวัง **2 เครื่อง** (#14, #38) | หยุดวิกฤต **1 เครื่อง** (#27)
• **ผลผลิตสะสม**: 54,050 ชิ้น (ของดี 53,654 ชิ้น | ของเสีย 396 ชิ้น)
• **อัตรา Yield รวม**: **99.27%** (เกณฑ์มาตรฐาน >= 99.50%)
• **จุดที่ต้องจัดการ**: เปลี่ยนหัวเข็มเครื่อง #27 และเปลี่ยนหลอดกาวเครื่อง #14 ก่อนครบกำหนด pot-life 240 นาที

[STRICT TOOL USAGE RULES]:
1. If the user asks for information about a specific machine:
   YOU MUST call the tool get_machine_telemetry with {"machine_num": <number>}. DO NOT guess!
2. If the user asks about problematic, broken, or warning machines:
   YOU MUST call the tool get_problematic_machines with {"filter": "all"}.
3. If the user asks about total production, overall factory yield, or fleet summary:
   YOU MUST call the tool get_factory_overall_summary with {}.
4. If the user asks about Cleanroom Gowning / Dressing procedures:
   Provide the 5-step gowning rule (Top to Bottom: 1. Hairnet -> 2. Face Mask -> 3. Jumpsuit with Hood -> 4. Booties -> 5. ESD Gloves), followed by 360-degree Air Shower (15-20s), and reverse undressing rule.
5. If the user asks about manufacturing processes from slides:
   Provide the accurate step-by-step breakdown in concise bullet points with engineering parameters.
6. If the user asks about Cleanroom Contamination:
   Detail NVS/Silicone (outgas & nanogram smear), Talc (MgSiO disk scratch), SiO2 (hard particles), Mesa/Ghost (RHC rubber degradation), and Outgas.
7. Never output raw XML or tool tags like <function_call> or <function-name>. Output only pure high-density Markdown text.`;

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
      } else if (lower.includes('สไลด์') || lower.includes('slide') || lower.includes('fcof') || lower.includes('aca') || lower.includes('apfa') || lower.includes('coil') || lower.includes('แต่งตัว') || lower.includes('กฎ') || lower.includes('ระเบียบ') || lower.includes('esd') || lower.includes('ซิลิโคน') || lower.includes('silicone') || lower.includes('สอบ') || lower.includes('เกณฑ์')) {
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
