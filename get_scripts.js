const fs = require('fs');
const html = fs.readFileSync('belton_home.html', 'utf8');

const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
let m;
const scripts = [];
while ((m = scriptRegex.exec(html)) !== null) {
  scripts.push(m[1]);
}
console.log('Scripts:', scripts);
