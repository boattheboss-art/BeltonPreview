const express = require('express');
const path = require('path');
const { normalizeBasePath, sendPage } = require('./src/web-paths.js');
const { runOrchestrator, runOrchestratorStream } = require('./src/orchestrator.js');
const { getMachineTelemetry, getProblematicMachines, getFactorySummary } = require('./src/db/database.js');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
require('dotenv').config();

const rootApp = express();
const app = express.Router();
const PORT = process.env.PORT || 8080;
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || '');
const publicDir = path.join(__dirname, 'public');
if (BASE_PATH) {
    rootApp.use((req, res, next) => {
        if (req.path === BASE_PATH) return res.redirect(308, BASE_PATH + '/');
        next();
    });
}
rootApp.use(BASE_PATH || '/', app);

// Detailed Logger Middleware
app.use(express.json());
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString('th-TH');
    if (!req.url.startsWith('/api/copilot-log') && !/\.(jpg|jpeg|png|webp|mp3|wav)$/i.test(req.path)) {
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
    console.log(`[COPILOT CMD LOG - ${time}]`);
    console.log(`User Query : "${query || ''}"`);
    console.log(`Model      : ${model || 'Qwen 2.5 1.5B (WebGPU)'}`);
    if (action) {
        console.log(`3D Action  : ${action} (Target: ACA-DISP-${targetNum < 10 ? '0' + targetNum : targetNum})`);
    }
    if (response) {
        const preview = (response || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 140);
        console.log(`Response   : ${preview}...`);
    }
    console.log(`======================================================\n`);
    res.json({ status: 'ok' });
});

// Agentic Orchestrator Endpoint (Standard JSON)
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
        console.error('[Copilot Chat Error]:', err.message);
        if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed') || err.message.includes('ENOTFOUND')) {
            return res.json({
                reply: 'กรุณาติดต่อผู้เปิดเซิฟเวอร์',
                toolsUsed: [],
                action: null
            });
        }
        res.status(500).json({ error: err.message });
    }
});

// Real-time Streaming Orchestrator Endpoint (Server-Sent Events)
app.post('/api/copilot/chat-stream', async (req, res) => {
    try {
        const { message, history } = req.body || {};
        if (!message) {
            return res.status(400).json({ error: 'message is required' });
        }
        const formattedHistory = (history || []).map(h => ({
            role: h.role === 'bot' ? 'assistant' : 'user',
            content: h.text || h.content || ''
        }));

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        const sendEvent = (event, data) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        await runOrchestratorStream(message, formattedHistory, {
            onMeta: (meta) => sendEvent('meta', meta),
            onToken: (token) => sendEvent('token', { token }),
            onAction: (action) => sendEvent('action', action),
            onDone: (data) => {
                sendEvent('done', data || {});
                res.end();
            },
            onError: (err) => {
                console.error('[Chat-Stream Error]:', err.message);
                const isOllamaDown = err.message.includes('ECONNREFUSED') ||
                                     err.message.includes('fetch failed') ||
                                     err.message.includes('ENOTFOUND') ||
                                     err.message.includes('connect');
                if (isOllamaDown) {
                    sendEvent('token', { token: 'กรุณาติดต่อผู้เปิดเซิฟเวอร์' });
                    sendEvent('done', { fullText: 'กรุณาติดต่อผู้เปิดเซิฟเวอร์' });
                } else {
                    sendEvent('error', { message: err.message });
                }
                res.end();
            }
        });

        req.on('close', () => {
            res.end();
        });
    } catch (err) {
        console.error('[Chat-Stream Error]:', err.message);
        const isOllamaDown = err.message.includes('ECONNREFUSED') ||
                             err.message.includes('fetch failed') ||
                             err.message.includes('ENOTFOUND') ||
                             err.message.includes('connect');
        const fallbackMsg = isOllamaDown ? 'กรุณาติดต่อผู้เปิดเซิฟเวอร์' : err.message;
        if (!res.headersSent) {
            res.status(200).json({ reply: fallbackMsg, error: fallbackMsg });
        } else {
            sendEvent('token', { token: fallbackMsg });
            sendEvent('done', { fullText: fallbackMsg });
            res.end();
        }
    }
});

// Text sanitizer and Phonetic mapping for natural Thai speech delivery
function cleanTextForSpeech(text) {
    if (!text) return '';
    let s = text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/\[ACTION:[^\]]+\]/gi, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/^#+\s*/gm, '')
        .replace(/^[-*•]\s*/gm, '')
        .replace(/^\d+\.\s*/gm, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/<[^>]*>/g, '');

    // 1. Belton Machine Naming
    s = s.replace(/(?:เครื่อง\s*)?ACA-DISP-0?(\d+)/gi, (m, num) => `เครื่อง เอซีเอ ดิสเพนเซอร์ เบอร์ ${parseInt(num, 10)}`);
    s = s.replace(/\bACA\b/gi, 'เอซีเอ');
    s = s.replace(/\bDISP\b/gi, 'ดิสเพนเซอร์');

    // 2. Relative Humidity & Percentages
    s = s.replace(/(\d+)\s*(?:%\s*)?RH\b/gi, '$1 เปอร์เซ็นต์ความชื้นสัมพัทธ์');
    s = s.replace(/(\d+)\s*%/g, '$1 เปอร์เซ็นต์');

    // 3. Cleanroom & Facility Specifications
    s = s.replace(/Cleanroom\s+Class\s+(\d+)/gi, 'คลีนรูม คลาส $1');
    s = s.replace(/Class\s+(\d+)\s+Cleanroom/gi, 'คลีนรูม คลาส $1');
    s = s.replace(/\bCleanroom\b/gi, 'คลีนรูม');
    s = s.replace(/\bClass\s+(\d+)/gi, 'คลาส $1');
    s = s.replace(/Nava\s*Nakorn/gi, 'นวนคร');
    s = s.replace(/\bBelton\b/gi, 'เบลตัน');

    // 4. Industry & Process Acronyms
    s = s.replace(/(?:ระบบ\s*)?SCADA\b/gi, 'ระบบ สะกาด้า');
    s = s.replace(/\bHDD\b/gi, 'ฮาร์ดดิสก์');
    s = s.replace(/\bHDA\b/gi, 'เอชดีเอ');
    s = s.replace(/\bVCM\b/gi, 'วีซีเอ็ม');
    s = s.replace(/\bSOP\b/gi, 'เอสโอพี');
    s = s.replace(/\bESD\b/gi, 'อีเอสดี');
    s = s.replace(/\bOEE\b/gi, 'โออีอี');
    s = s.replace(/\bSmock\b/gi, 'ชุดสม็อค');
    s = s.replace(/\bBooties\b/gi, 'รองเท้าบูทตี้');
    s = s.replace(/\bSticky\s*Mat\b/gi, 'แผ่นกาวดักฝุ่น');
    s = s.replace(/\bAir\s*Shower\b/gi, 'แอร์ชาวเวอร์');
    s = s.replace(/\bPass\s*Box\b/gi, 'พาสบ็อกซ์');
    s = s.replace(/\bFFU\b/gi, 'เอฟเอฟยู');
    s = s.replace(/\bHEPA\b/gi, 'เฮป้าฟิลเตอร์');
    s = s.replace(/\bULPA\b/gi, 'อัลป้าฟิลเตอร์');
    s = s.replace(/\bDI\s*Water\b/gi, 'น้ำบริสุทธิ์ดีไอ');
    s = s.replace(/\bIPA\b/gi, 'แอลกอฮอล์ไอพีเอ');

    // 5. Units of Measurement
    s = s.replace(/(\d+)\s*°\s*C/g, '$1 องศาเซลเซียส');
    s = s.replace(/(\d+(?:\.\d+)?)\s*µm/gi, '$1 ไมครอน');
    s = s.replace(/(\d+(?:\.\d+)?)\s*um/gi, '$1 ไมครอน');
    s = s.replace(/(\d+(?:\.\d+)?)\s*mm/gi, '$1 มิลลิเมตร');
    s = s.replace(/(\d+)\s*RPM/gi, '$1 รอบต่อนาที');

    // 6. Conversational Prosody Pauses
    s = s.replace(/([.?!])\s+/g, '$1, ');
    s = s.replace(/[:]/g, ' คือ ');

    return s.replace(/\s+/g, ' ').trim();
}

// Neural TTS Endpoint (Edge-TTS Thai Voice with Phonetic Dictionary)
app.post('/api/tts', async (req, res) => {
    try {
        const { text, voice = 'th-TH-PremwadeeNeural' } = req.body || {};
        const cleaned = cleanTextForSpeech(text);
        if (!cleaned) {
            return res.status(400).json({ error: 'Text is empty or invalid for speech' });
        }

        const speechText = cleaned.length > 1200 
            ? cleaned.slice(0, 1200) + ' และอื่นๆ ตามรายละเอียดบนหน้าจอครับ' 
            : cleaned;

        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        
        // Natural vocal delivery: remove artificial negative pitch and sluggish speed drag
        const prosody = {
            pitch: '+0Hz',
            rate: '+0%',
            volume: '+0%'
        };

        const { audioStream } = tts.toStream(speechText, prosody);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store');

        audioStream.pipe(res);

        audioStream.on('error', (err) => {
            console.error('[TTS Stream Error]:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
            try { tts.close(); } catch (e) {}
        });

        res.on('close', () => {
            try { tts.close(); } catch (e) {}
        });
    } catch (err) {
        console.error('[TTS Endpoint Error]:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
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

app.get('/api/health', async (req, res) => {
    try {
        const summary = await getFactorySummary();
        res.json({ status: 'ok', revision: process.env.APP_REVISION || 'development',
            basePath: BASE_PATH, machines: summary.total_machines,
            model: process.env.MODEL_NAME || 'qwen2.5:14b',
            provider: process.env.LLM_PROVIDER || 'ollama' });
    } catch (err) {
        res.status(503).json({ status: 'starting' });
    }
});

app.get(/^\/(index|explorer|product|manufacturing|factory|copilot)\.html$/, (req, res) => {
    sendPage(res, publicDir, path.basename(req.path), BASE_PATH);
});

app.use(express.static(publicDir, {
    index: false,
    etag: true,
    setHeaders: (res, filePath) => {
        if (/\.(glb|splinecode|wasm|jpg|jpeg|png|webp|mp3|wav|woff2)$/i.test(filePath)) {
            res.set('Cache-Control', 'public, max-age=86400');
        } else {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        }
    }
}));

app.get('/', (req, res) => {
    sendPage(res, publicDir, 'index.html', BASE_PATH);
});

app.get('/explorer', (req, res) => {
    sendPage(res, publicDir, 'explorer.html', BASE_PATH);
});

app.get('/product', (req, res) => {
    sendPage(res, publicDir, 'product.html', BASE_PATH);
});

app.get('/manufacturing', (req, res) => {
    sendPage(res, publicDir, 'manufacturing.html', BASE_PATH);
});

app.get('/factory', (req, res) => {
    sendPage(res, publicDir, 'factory.html', BASE_PATH);
});

app.get('/copilot', (req, res) => {
    sendPage(res, publicDir, 'copilot.html', BASE_PATH);
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
    res.redirect(BASE_PATH + '/manufacturing');
});

process.on('uncaughtException', (err) => console.error('uncaughtException:', err));
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));

rootApp.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`Belton 3D Component Explorer`);
    console.log(`Open in Chrome: http://localhost:${PORT}`);
    console.log(`Open Hand = View Normal  |  Peace Sign = Exploded View`);
    console.log(`======================================================\n`);
});
