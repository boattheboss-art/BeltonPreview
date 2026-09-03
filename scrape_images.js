const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://beltontechnology.com/',
  'https://beltontechnology.com/capabilities/',
  'https://beltontechnology.com/products-services/',
  'https://beltontechnology.com/about-us/'
];

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, data, status: res.statusCode }));
    }).on('error', () => resolve({ url, data: '', status: 500 }));
  });
}

async function run() {
  for (const url of urls) {
    const res = await fetch(url);
    const imgMatches = res.data.match(/https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
    const unique = [...new Set(imgMatches)];
    console.log('=== URL:', url, 'Images found:', unique.length);
    console.log(unique.slice(0, 10));
  }
}

run();
