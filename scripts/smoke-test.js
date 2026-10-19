const assert = require('node:assert/strict');
const base = (process.argv[2] || 'http://127.0.0.1:8080/beltonpreview/').replace(/\/?$/, '/');
const prefix = new URL(base).pathname;
async function get(route) {
  const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
  return response;
}
(async () => {
  const health = await (await get('api/health')).json();
  assert.equal(health.status, 'ok');
  if (process.env.EXPECTED_REVISION) assert.equal(health.revision, process.env.EXPECTED_REVISION);
  for (const route of ['', 'explorer', 'product', 'manufacturing', 'factory', 'copilot', 'factory.html']) {
    const html = await (await get(route)).text();
    assert.ok(html.includes(`<base href="${prefix}">`), `${route}: missing base path`);
    assert.ok(html.includes(`href="${prefix}factory"`), `${route}: navigation leaves app`);
  }
  for (const route of ['js/app-path.js', 'js/factory.js', 'js/copilot.js', 'styles.css', 'belton_logo.png']) {
    const response = await get(route);
    assert.ok(!response.headers.get('content-type')?.includes('text/html'), `${route}: returned HTML`);
    await response.arrayBuffer();
  }
  const summary = await (await get('api/scada/summary')).json();
  assert.equal(summary.total_machines, 50);
  const machine = await (await get('api/scada/machines/27')).json();
  assert.equal(machine.machine_id, 'ACA-DISP-27');
  console.log(`Smoke tests passed: ${base} (revision ${health.revision}, 50 machines)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
