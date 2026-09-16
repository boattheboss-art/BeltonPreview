const Database = require('better-sqlite3');
const db = new Database('./data/scada.db');

const rows = db.prepare("SELECT page_number, title, content FROM slide_pages WHERE doc_code = 'TM-00-00-01' AND page_number BETWEEN 28 AND 50 ORDER BY page_number").all();
for (const r of rows) {
  const opMatch = r.content.match(/Operation\s*:\s*([^\n\r]+)/i);
  console.log(`Page ${r.page_number}: title="${r.title}" | Op="${opMatch ? opMatch[1] : 'None'}"`);
}



