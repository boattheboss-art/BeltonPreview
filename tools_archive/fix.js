const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

let hdd = fs.readFileSync('scratch_hdd.js', 'utf8');
const end = hdd.indexOf('function applyExplosion');
if (end !== -1) hdd = hdd.substring(0, end);

hdd = hdd.replace(/registerModule\("([^"]+)",\s*([^)]+)\);/g, 'addM(n, $2, MODULE_GROUPS["$1"].offset);');
hdd = hdd.replace(/rootModelGroup\.rotation\.y/g, 'n.rotation.y');
hdd = hdd.replace(/rootModelGroup\.position\.set/g, 'n.position.set');
hdd = hdd.replace('n.position.set(0, 0, 0);', 'n.position.set(0, 0, 0);\n      return { n, x };');

const regStart = hdd.indexOf('function registerModule(key, group) {');
if (regStart !== -1) hdd = hdd.substring(0, regStart);

const start = code.indexOf('const MODULE_GROUPS = {');
const buildEnd = code.indexOf('function buildCapacitor() {');

if (start !== -1 && buildEnd !== -1) {
  code = code.substring(0, start) + hdd + '\n\n        ' + code.substring(buildEnd);
  fs.writeFileSync('public/index.html', code);
}

