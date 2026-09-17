const fs = require('fs');
const path = require('path');

const slides = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/belton_slides_database.json'), 'utf8'));
const tm01 = slides.filter(s => s.doc_code === 'TM-00-00-01');

console.log('=== COIL WINDING (p. 13 - 27) ===');
tm01.filter(s => s.page_number >= 13 && s.page_number <= 27).forEach(s => {
  console.log(`\n--- Page ${s.page_number}: ${s.title} ---`);
  console.log(s.content.slice(0, 300));
});

console.log('\n=== FCOF (p. 50 - 64) ===');
tm01.filter(s => s.page_number >= 50 && s.page_number <= 64).forEach(s => {
  console.log(`\n--- Page ${s.page_number}: ${s.title} ---`);
  console.log(s.content.slice(0, 300));
});

console.log('\n=== APFA (p. 65 - 83) ===');
tm01.filter(s => s.page_number >= 65 && s.page_number <= 83).forEach(s => {
  console.log(`\n--- Page ${s.page_number}: ${s.title} ---`);
  console.log(s.content.slice(0, 300));
});

