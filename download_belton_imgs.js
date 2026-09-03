const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'public', 'assets', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = {
  'coil_winding.jpg': 'https://d2xsxph8kpxj0f.cloudfront.net/310519663382322355/fyuF6HMzfk4iJEGizSWAt5/ColiWinding_02571395.JPG',
  'cnc_sparks.webp': 'https://d2xsxph8kpxj0f.cloudfront.net/310519663382322355/fyuF6HMzfk4iJEGizSWAt5/capabilities-cnc-sparks_56af880d.webp',
  'hdd_apfa_assembly.jpg': 'https://d2xsxph8kpxj0f.cloudfront.net/310519663382322355/fyuF6HMzfk4iJEGizSWAt5/FlipChipAssembly_HDDcarriageassy_5af2cdd8.jpg',
  'cleanroom_inspection.webp': 'https://d2xsxph8kpxj0f.cloudfront.net/310519663382322355/fyuF6HMzfk4iJEGizSWAt5/quality-cleanroom-inspection_cacbf815.webp',
  'thai_plant_r3.jpg': 'https://d2xsxph8kpxj0f.cloudfront.net/310519663382322355/fyuF6HMzfk4iJEGizSWAt5/r3-thailand_8c7d042e.jpg',
  'machined_components.png': 'https://d2xsxph8kpxj0f.cloudfront.net/310519663382322355/fyuF6HMzfk4iJEGizSWAt5/machining-components-hd_7166ef3c.png'
};

function download(filename, url) {
  return new Promise((resolve) => {
    const dest = path.join(targetDir, filename);
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log('Saved:', filename, fs.statSync(dest).size, 'bytes');
          resolve();
        });
      });
    }).on('error', err => {
      console.error('Error downloading:', filename, err);
      resolve();
    });
  });
}

async function run() {
  for (const [name, url] of Object.entries(images)) {
    await download(name, url);
  }
}

run();
