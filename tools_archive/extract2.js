const fs = require('fs');
let code = fs.readFileSync('scratch_hdd.js', 'utf8');

const end = code.indexOf('function applyExplosion');
if (end !== -1) {
  code = code.substring(0, end) + '  return { n, x };\n}\n';
}

fs.writeFileSync('scratch_hdd.js', code);
