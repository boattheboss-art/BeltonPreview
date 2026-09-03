const fs = require('fs');
const buf = fs.readFileSync('public/assets/models/nana_scene.splinecode');

const idx = 12000;
const slice = buf.slice(idx - 400, idx + 1000);
console.log('Slice around buttons:');
console.log(slice.toString('latin1').replace(/[^\x20-\x7E]/g, '.'));
