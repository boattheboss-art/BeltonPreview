const fs = require('fs');
const html = fs.readFileSync('belton_home.html', 'utf8');

// Find all URLs in the HTML
const urlRegex = /https?:\/\/[a-zA-Z0-9.\-_/]+\.(?:png|jpg|jpeg|webp|gif|svg)/gi;
const matches = html.match(urlRegex) || [];
console.log('All image matches count:', matches.length);
console.log([...new Set(matches)]);

// Look for image keywords like coil, actuator, apfa, plant, factory, cleanroom
const keywords = ['coil', 'actuator', 'apfa', 'cleanroom', 'facility', 'plant', 'machine', 'surface', 'product'];
keywords.forEach(k => {
  const reg = new RegExp(`[a-zA-Z0-9._/-]*${k}[a-zA-Z0-9._/-]*`, 'gi');
  const found = html.match(reg) || [];
  if (found.length) {
    console.log(`Keyword "${k}":`, [...new Set(found)].slice(0, 5));
  }
});
