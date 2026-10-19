const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const files = ['server.js'];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['vendor', 'libs'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (file.endsWith('.js')) files.push(file);
  }
}
['src', 'public/js', 'tests'].forEach(scan);
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`JavaScript syntax passed: ${files.length} files`);
