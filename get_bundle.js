const https = require('https');
const fs = require('fs');

https.get('https://beltontechnology.com/assets/index-D23F3YZO.js', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('bundle.js', data);
    console.log('Saved bundle.js, size:', data.length);
    const imgRegex = /https?:\/\/[a-zA-Z0-9.\-_/]+\.(?:png|jpg|jpeg|webp|svg)/gi;
    const matches = data.match(imgRegex) || [];
    const unique = [...new Set(matches)];
    console.log('Images in bundle count:', unique.length);
    unique.forEach(u => console.log('IMG:', u));
  });
});
