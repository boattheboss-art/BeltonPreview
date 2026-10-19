const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeBasePath, renderPage } = require('../src/web-paths');

test('supports root and mounted paths without unsafe HTML characters', () => {
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('/beltonpreview/'), '/beltonpreview');
  assert.throws(() => normalizeBasePath('/bad"path'));
  assert.throws(() => normalizeBasePath('//other-host'));
});

test('mounted pages keep navigation and relative 3D assets under the app', () => {
  const html = renderPage('<head><link href="styles.css"></head><a href="/factory">Factory</a><img src="/logo.png"><a href="//example.com">External</a><a href="#part">Part</a>', '/beltonpreview');
  assert.match(html, /<base href="\/beltonpreview\/">/);
  assert.match(html, /href="\/beltonpreview\/factory"/);
  assert.match(html, /src="\/beltonpreview\/logo.png"/);
  assert.match(html, /href="styles.css"/);
  assert.match(html, /href="\/\/example.com"/);
  assert.match(html, /href="#part"/);
});

test('root hosting retains existing root navigation', () => {
  const html = renderPage('<head></head><a href="/factory">Factory</a>', '');
  assert.match(html, /<base href="\/">/);
  assert.match(html, /href="\/factory"/);
});
