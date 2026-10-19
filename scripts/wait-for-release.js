const { setTimeout: pause } = require('node:timers/promises');
const base = (process.argv[2] || '').replace(/\/?$/, '/');
const revision = process.env.EXPECTED_REVISION;
if (!base || !revision) throw new Error('Public URL and EXPECTED_REVISION are required');
(async () => {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const response = await fetch(new URL('api/health', base), {
        headers: { Connection: 'close', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        await response.body.cancel();
        throw new Error(`Proxy transition: HTTP ${response.status}`);
      }
      const health = await response.json();
      if (health.status !== 'ok' || health.revision !== revision) throw new Error('Proxy still serves another release');
      console.log(`HTTPS proxy serves revision ${revision}`);
      return;
    } catch (error) {
      lastError = error;
      await pause(2000);
    }
  }
  throw lastError;
})().catch(error => { console.error(error); process.exitCode = 1; });
