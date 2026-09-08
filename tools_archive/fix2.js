const fs = require('fs');

let hdd = fs.readFileSync('scratch_hdd.js', 'utf8');

hdd = hdd.replace(/registerModule\("([^"]+)",\s*([^)]+)\);/g, 'addM(n, $2, MODULE_GROUPS["$1"].offset);');
hdd = hdd.replace(/rootModelGroup\.rotation\.y/g, 'n.rotation.y');
hdd = hdd.replace(/rootModelGroup\.position\.set/g, 'n.position.set');
hdd = hdd.replace('n.position.set(0, 0, 0);', 'n.position.set(0, 0, 0);\n      return { n, x };\n    }');

const regStart = hdd.indexOf('function registerModule(key, group) {');
if (regStart !== -1) {
  hdd = hdd.substring(0, regStart);
}

fs.writeFileSync('scratch_hdd.js', hdd);

const fullCode = 'const THREE = {};\nconst addM = () => {};\n' + hdd;
try {
  new Function(fullCode);
  console.log('scratch_hdd OK');
} catch (e) {
  console.log('scratch_hdd error:', e.message);
}

let code = fs.readFileSync('public/index.html', 'utf8');
const start = code.indexOf('const MODULE_GROUPS = {');
const buildEnd = code.indexOf('function buildCapacitor() {');

if (start !== -1 && buildEnd !== -1) {
  code = code.substring(0, start) + hdd + '\n\n        ' + code.substring(buildEnd);
  fs.writeFileSync('public/index.html', code);
  console.log('index.html replaced successfully');
} else {
  console.log('Could not find markers in index.html');
}

