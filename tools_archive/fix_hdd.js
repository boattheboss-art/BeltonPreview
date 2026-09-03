const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

// Replace registerModule calls
code = code.replace(/registerModule\("([^"]+)",\s*([^)]+)\);/g, 'addM(n, , MODULE_GROUPS[""].offset);');

// Replace rootModelGroup with n
code = code.replace(/rootModelGroup\.rotation\.y/g, 'n.rotation.y');
code = code.replace(/rootModelGroup\.position\.set/g, 'n.position.set');

// The end of buildHDD should be just after the rootModelGroup positioning
code = code.replace('n.position.set(0, 0, 0);', 'n.position.set(0, 0, 0);\n      return { n, x };');

// Now we need to remove the dangling registerModule function definition and the bad return { n, x }; } at the end.
const regStart = code.indexOf('function registerModule(key, group) {');
const regEnd = code.indexOf('function buildCapacitor() {');

if (regStart !== -1 && regEnd !== -1) {
  // Remove everything from regStart up to buildCapacitor
  code = code.substring(0, regStart) + '\n\n        ' + code.substring(regEnd);
}

fs.writeFileSync('public/index.html', code);
