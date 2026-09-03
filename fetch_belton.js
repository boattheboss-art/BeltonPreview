const https = require('https');
const fs = require('fs');

https.get('https://beltontechnology.com/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('belton_home.html', data);
    console.log('Saved belton_home.html, size:', data.length);
    // search for cloudfront or static assets
    const matches = data.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|svg)/gi) || [];
    console.log('Matches count:', matches.length);
    console.log([...new Set(matches)]);
  });
});
