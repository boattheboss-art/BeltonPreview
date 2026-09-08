const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.static('public'));
const server = app.listen(3000, async () => {
  console.log('Server started on port 3000');
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
  } catch(e) {
    console.error(e);
  } finally {
    server.close();
  }
});
