const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Detailed Logger Middleware
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString('th-TH');
    console.log(`[${time}] ${req.method} ${req.url}`);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
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

app.get('/ai-preview', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ai_tool_wear_preview.html'));
});

app.get('/ai-dispensing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ai_dispensing_preview.html'));
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
