const fs = require('node:fs');
const path = require('node:path');

function normalizeBasePath(value = '') {
  const base = value.replace(/\/+$/, '');
  if (base && !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(base)) {
    throw new Error('BASE_PATH must be an absolute URL path without a trailing slash');
  }
  return base;
}

function renderPage(html, basePath) {
  const base = normalizeBasePath(basePath);
  // Protocol-relative external URLs and fragment references retain their meaning.
  return html.replace(/\b(href|src|action)=(['"])\/(?!\/)/g, `$1=$2${base}/`)
    .replace(/<head([^>]*)>/i,
      `<head$1><base href="${base}/"><script src="${base}/js/app-path.js"></script>`);
}

function sendPage(res, publicDir, filename, basePath) {
  res.type('html').send(renderPage(fs.readFileSync(path.join(publicDir, filename), 'utf8'), basePath));
}

module.exports = { normalizeBasePath, renderPage, sendPage };
