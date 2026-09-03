const fs = require('fs');
const code = fs.readFileSync('3d_index.html', 'utf8');

const m_start = code.indexOf('const MODULE_GROUPS = {');
const m_end = code.indexOf('function init() {');
const moduleCode = code.substring(m_start, m_end);

const start = code.indexOf('function generateBrushedMetalTexture() {');
const end = code.indexOf('function resetExplode() {');
let hddCode = code.substring(start, end);

// Wrap buildMacroPhotoModel logic inside buildHDD
hddCode = hddCode.replace('function buildMacroPhotoModel() {', 'function buildHDD() {\n      const n = new THREE.Group();\n      const x = new THREE.Group();');

// replace assignments
hddCode = hddCode.replace(/interactiveModules\["([^"]+)"\] = {[\s\S]*?group:\s*([^,]+),[\s\S]*?};/g, 'addM(n, , MODULE_GROUPS[""].offset);');
hddCode = hddCode.replace(/rootModelGroup\.add\(.*?\);/g, '');
hddCode = hddCode.replace(/updateHUDLeaderLine\(\);/g, '');

// Append return
hddCode += '\n      return { n, x };\n    }';

fs.writeFileSync('scratch_hdd.js', moduleCode + '\n' + hddCode);
