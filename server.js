const express = require('express');
const path = require('path');
const { runOrchestrator } = require('./src/orchestrator.js');
const { getMachineTelemetry, getProblematicMachines, getFactorySummary } = require('./src/db/database.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Detailed Logger Middleware
app.use(express.json());
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString('th-TH');
    if (!req.url.startsWith('/api/copilot-log')) {
        console.log(`[${time}] ${req.method} ${req.url}`);
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Live CMD Terminal Logger for Qwen 2.5 Copilot
app.post('/api/copilot-log', (req, res) => {
    const { query, model, response, action, targetNum } = req.body || {};
    const time = new Date().toLocaleTimeString('th-TH');
    console.log(`\n======================================================`);
    console.log(`🤖 [COPILOT CMD LOG - ${time}]`);
    console.log(`👤 User Query : "${query || ''}"`);
    console.log(`🧠 Model      : ${model || 'Qwen 2.5 1.5B (WebGPU)'}`);
    if (action) {
        console.log(`🎯 3D Action  : ${action} (Target: ACA-DISP-${targetNum < 10 ? '0' + targetNum : targetNum})`);
    }
    if (response) {
        const preview = (response || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 140);
        console.log(`💬 Response   : ${preview}...`);
    }
    console.log(`======================================================\n`);
    res.json({ status: 'ok' });
});

// Agentic Orchestrator Endpoint (Ollama Qwen 2.5:3b + Function Calling + SQLite SCADA DB)
app.post('/api/copilot/chat', async (req, res) => {
    try {
        const { message, history } = req.body || {};
        if (!message) {
            return res.status(400).json({ error: 'message is required' });
        }
        const formattedHistory = (history || []).map(h => ({
            role: h.role === 'bot' ? 'assistant' : 'user',
            content: h.text || h.content || ''
        }));
        const result = await runOrchestrator(message, formattedHistory);
        res.json(result);
    } catch (err) {
        console.error('❌ /api/copilot/chat Error:', err.message);
        if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed')) {
            return res.json({
                reply: '⚠️ ระบบวิศวกร AI Copilot ยังไม่สามารถเชื่อมต่อกับ Ollama Local Service ได้ในขณะนี้\n\n**คำแนะนำสำหรับผู้ดูแลระบบ / IT:**\n1. ตรวจสอบว่าได้เปิดใช้งาน Ollama แล้วหรือยัง โดยเปิด Terminal แล้วสั่ง: `ollama serve`\n2. ตรวจสอบว่าได้ดาวน์โหลดโมเดลแล้วหรือไม่: `ollama pull qwen2.5:3b`\n3. หากต้องการตรวจสอบขั้นตอนขึ้นระบบอย่างละเอียด สามารถเปิดดูได้ที่ไฟล์ `DEPLOYMENT_GUIDE.md` ครับ',
                toolsUsed: [],
                action: null
            });
        }
        res.status(500).json({ error: err.message });
    }
});

// Direct SCADA Database endpoints
app.get('/api/scada/summary', async (req, res) => {
    try {
        const summary = await getFactorySummary();
        res.json(summary);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/scada/machines/:id', async (req, res) => {
    try {
        const machine = await getMachineTelemetry(parseInt(req.params.id, 10));
        res.json(machine);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/explorer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'explorer.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/manufacturing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manufacturing.html'));
});

app.get('/factory', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'factory.html'));
});

app.get('/copilot', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'copilot.html'));
});

app.get('/api/model-status', (req, res) => {
    const glbPath = path.join(__dirname, 'public', 'models', 'belton_factory_cleanroom_full.glb');
    try {
        const stat = require('fs').statSync(glbPath);
        res.json({ exists: true, mtime: stat.mtimeMs, size: stat.size });
    } catch (e) {
        res.json({ exists: false });
    }
});

app.get('/api/scada/live-status', (req, res) => {
    const cachePath = path.join(__dirname, 'ai', 'data', 'scada_live_state.json');
    try {
        if (require('fs').existsSync(cachePath)) {
            const data = JSON.parse(require('fs').readFileSync(cachePath, 'utf-8'));
            res.json(data);
        } else {
            res.json({ status: 'INITIALIZING', total_records: 50000, sync_interval_seconds: 30 });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/lab', (req, res) => {
    res.redirect('/manufacturing');
});

process.on('uncaughtException', (err) => console.error('uncaughtException:', err));
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Belton 3D Component Explorer`);
    console.log(`💻 Open in Chrome: http://localhost:${PORT}`);
    console.log(`🖐️ แบมือ = ดูปกติ  |  ✌️ ชู 2 นิ้ว = แยกร่าง`);
    console.log(`======================================================\n`);
});
