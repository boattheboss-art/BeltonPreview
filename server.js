const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Detailed Logger Middleware
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString('th-TH');
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

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
