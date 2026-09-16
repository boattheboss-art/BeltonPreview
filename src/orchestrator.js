const { toolsDefinition } = require('./tools/schemas.js');
const { executeTool } = require('./tools/handlers.js');
const { BELTON_KNOWLEDGE } = require('./knowledge/belton_knowledge.js');
const { searchSlideKnowledge } = require('./knowledge/slide_knowledge_db.js');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'qwen2.5:3b';

function cleanOutputText(text) {
  if (!text) return '';
  return text
    .replace(/<function[_-]call>.*?<\/function[_-]call>/gis, '')
    .replace(/<function[_-]name>.*?<\/function[_-]name>/gis, '')
    .replace(/<tool[_-]call>.*?<\/tool[_-]call>/gis, '')
    .replace(/<query>.*?<\/query>/gis, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

  const systemPrompt = `You are "Belton AI Copilot", an authoritative expert cleanroom engineer at Belton Technology (Thailand) Co., Ltd. (Navanakorn Plant).
You possess deep, comprehensive knowledge of Belton's manufacturing training slides (Coil Winding, ACA, FCOF, APFA), Cleanroom Class 100 protocols, Gowning procedures, Air Shower rules, and ESD controls.
You also have access to live SCADA Database tools to query real-time production telemetry and command 3D cameras.
${dynamicSlideExcerpts}

${BELTON_KNOWLEDGE}

[STRICT INSTRUCTIONS]:
1. If the user asks for information about a specific machine (e.g. "ขอข้อมูลเครื่องที่ 20 หน่อย", "สถานะเครื่อง 27", "เครื่อง 14 เป็นไง"):
   YOU MUST call the tool get_machine_telemetry with {"machine_num": <number>}. DO NOT guess or answer without calling this tool!
2. If the user asks about problematic, broken, or warning machines (e.g. "มีเครื่องไหนที่ปัญหาไหมตอนนี้", "เครื่องไหนพังบ้าง"):
   YOU MUST call the tool get_problematic_machines with {"filter": "all"}.
3. If the user asks about total production, overall factory yield, or fleet summary:
   YOU MUST call the tool get_factory_overall_summary with {}.
4. If the user asks whether you are connected to the database:
   Confirm politely in Thai that you are 100% connected to the Belton SCADA Database with all 50 machines live via Function Calling.
5. If the user asks about Cleanroom Gowning / Dressing procedures (ขั้นตอนการแต่งตัวเข้าคลีนรูม), Air Shower, or Undressing:
   Explain clearly in Thai the 5-step gowning rule (Top to Bottom: 1. Hairnet หมวกคลุมผม -> 2. Face Mask หน้ากาก -> 3. Cleanroom Jumpsuit with Hood ชุดจั๊มสูทมีฮูดห้ามลากพื้น -> 4. Booties รองเท้าบูทคลีนรูม -> 5. ESD Gloves ถุงมือ ESD), followed by the 360-degree Air Shower (15-20s), and the reverse undressing rule (Gloves -> Booties -> Jumpsuit -> Mask -> Hairnet).
6. If the user asks about manufacturing processes from slides (FCOF 14 steps, ACA 21 steps, Coil Winding 14 steps, APFA 17 steps):
   Provide the accurate, authoritative step-by-step breakdown in polite Thai with engineering parameters.
7. If the user asks about Cleanroom Contamination (สิ่งปนเปื้อนในคลีนรูม เช่น NVS, Silicone, Talc, SiO2, Mesa/Ghost, Outgas):
   Provide authoritative engineering knowledge from Belton slides in natural, professional Thai:
   - NVS / Silicone: สารประกอบซิลิโคน (Organo-silicon / Polysiloxane) ระเหย (Outgassing) และควบแน่นกลายเป็นคราบซิลิโคน (Silicone smear) บนหัวอ่านดิสก์ แม้ระดับ "นาโนกรัม" ก็ทำให้หัวอ่านพังเสียหาย แหล่งกำเนิดคือ เครื่องสำอาง ครีมทาหน้า ครีมทามือ โลชั่น ครีมกันแดด น้ำมันใส่ผม ยางซิลิโคน และเทปต้องห้าม (Nitto 973UL-S, Tienta, Chukoh, 3M-1280) สารต้องห้ามบนฉลากคือ Dimethicone, Cyclomethicone
   - Talc (ทัลคัม / แมกนีเซียมซิลิเกต MgSiO): คือผงแป้ง แหล่งกำเนิดมาจาก แป้งฝุ่น แป้งเด็ก แป้งพัฟ ครีม whitening โลชั่น แป้งโรยถุงมือยาง เมื่อเม็ดแป้งแตกตัวจะขูดขีดหน้าจานดิสก์จนเกิดรอยขีดข่วน (Disk Scratch)
   - SiO2 (ซิลิกอนไดออกไซด์ / ควอตซ์): อนุภาคแข็งแรงจากแก้ว ทราย กระดาษทราย แผ่นใยขัด Scotch-Brite ซิลิกาเจล ขูดขีดหน้าจานดิสก์อย่างรุนแรง
   - Mesa (WD) / Ghost (Seagate): คือข้อบกพร่อง (Defect) ของคราบอนุภาคที่เกิดจากการสลายตัวของไฮโดรคาร์บอน/ยาง (RHC - Rubber Hydrocarbon Compound) เมื่อโดนความร้อน ส่องกล้องจุลทรรศน์จะเห็นเป็นคราบคล้ายเงาผี (ห้ามแปลว่าวิญญาณ)
   - Outgassing: แก๊สระเหยจากสีทาเล็บ น้ำหอม ยาดม ยาหม่อง สารระเหย
8. If the user asks about Cleanroom Discipline & Violations (กฎระเบียบคลีนรูมและบทลงโทษตาม WI-CQA-00-00-19):
   Explain clearly:
   - Critical (2 ข้อ): C1 ห้ามแต่งหน้า ทาแป้ง ครีม ลิปสติกเด็ดขาด, C2 ห้ามกินอาหาร เครื่องดื่ม ลูกอม เคี้ยวหมากฝรั่งเด็ดขาด -> ผิดครั้งที่ 1 พักงาน 3 วัน, ครั้งที่ 2 ให้ออกทันที (Terminated)
   - Major (16 ข้อ): ครั้งที่ 1 หนังสือเตือน -> ครั้งที่ 2 พักงาน 3 วัน -> ครั้งที่ 3 ให้ออก เช่น ไม่สวม Wrist strap ขณะแตะ preamp, บัตรไม่มี certificate, ชุดชำรุด, ดึงหน้ากากลงเห็นรูจมูก, เปิด Pass box 2 ฝั่งพร้อมกัน, มือถือมีเคส/พวงกุญแจ
   - Minor (33 ข้อ): ครั้งที่ 1 วาจา -> ครั้งที่ 2 หนังสือเตือน -> ครั้งที่ 3 พักงาน -> ครั้งที่ 4 ให้ออก เช่น วัตถุเกิด ESD ห้ามเข้าใกล้ preamp ในระยะ 12 นิ้ว, ชิ้นงานห้ามโลหะชนโลหะ (M2M), ห้ามวางของชั้นล่างสุดสูงไม่ถึง 12 นิ้ว, หยิบใกล้-วางไกล, ห้ามวางของบัง Air return
9. If the user asks about ESD Control & EPA Standards (การควบคุมไฟฟ้าสถิต และพื้นที่ EPA):
   Detail the engineering thresholds:
   - HBM (Human Body Model - จากคนสู่ชิ้นงาน) < 100V (>=100V Reject)
   - CDM (Charged Device Model - จากตัวงานเอง) < 200V (>=200V Reject)
   - MM (Machine Model - จากเครื่องจักรสู่งาน) < 35V (>=35V Reject)
   - กฎระยะห่างฉนวน (Insulator): ศักย์ > 125V ห่าง > 1 นิ้ว, ศักย์ > 2,000V ห่าง > 12 นิ้ว (30 ซม.) หรือเป่าล้างด้วย Air Ionizer
   - อุปกรณ์ใน EPA: รถเข็นต้องมีโซ่กราวด์ (Ground drag chain) ลากสัมผัสพื้นตลอดเวลา, โต๊ะปู Table Mat ต่อสายดิน, พัดลม Ionizer เปิดแรงลมถึงขีดเส้นสีแดง, ตรวจสอบสาย Wrist strap ที่ EPA GATE (750 kΩ - 35 MΩ)
10. Always speak in polite Thai using "ผม" and "ครับ". Format answers with clean Markdown headings and bullet points.
11. When answering technical questions regarding cleanroom rules, manufacturing steps, ESD, contamination, or protocols, cite the Document Code and Slide Page number (e.g. "[TM-00-00-05_1 หน้า 5]") so the user can verify directly.
12. Never output raw XML or tool tags like <function_call> or <function-name> in your text response. Speak directly to the operator in natural Thai.`;

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
        temperature: 0.1
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
        temperature: 0.1
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
