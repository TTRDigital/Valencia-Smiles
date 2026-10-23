// Copies the used originals into public/images with all metadata removed (EXIF, GPS, XMP, ICC kept as sRGB conversion).
const fs = require('fs'), path = require('path');
const sharp = require(require('path').resolve('node_modules/sharp'));
const [, , LIVE, REPO] = process.argv;
const list = fs.readFileSync(path.join(LIVE, 'used-imgs.txt'), 'utf8').split('\n').filter(Boolean);
(async () => {
  const report = [];
  for (let p of list) {
    let src = path.join(LIVE, 'img', p);
    if (!fs.existsSync(src)) {
      const dir = path.dirname(src), base = path.basename(src);
      const hit = fs.existsSync(dir) && fs.readdirSync(dir).find((f) => f.replace(/\.[a-z0-9]+$/i, '') === base);
      if (!hit) { console.log('MISSING', p); continue; }
      src = path.join(dir, hit); p = path.join(path.dirname(p), hit);
    }
    const out = path.join(REPO, 'public', p);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const ext = path.extname(p).toLowerCase();
    const meta = await sharp(src).metadata();
    const had = [meta.exif && 'exif', meta.xmp && 'xmp', meta.iptc && 'iptc'].filter(Boolean).join(',');
    if (ext === '.svg') { fs.copyFileSync(src, out); continue; }
    let img = sharp(src).rotate();
    if (ext === '.png') img = img.png({ compressionLevel: 9, effort: 8 });
    else if (ext === '.jpg' || ext === '.jpeg') img = img.jpeg({ quality: 88, mozjpeg: true });
    else if (ext === '.webp') img = img.webp({ quality: 88 });
    await img.toFile(out);
    report.push([p, meta.width, meta.height, had, fs.statSync(src).size, fs.statSync(out).size]);
  }
  fs.writeFileSync(path.join(LIVE, 'images-report.json'), JSON.stringify(report, null, 1));
  console.log('written', report.length, 'with metadata before:', report.filter((r) => r[3]).map((r) => r[0] + ' [' + r[3] + ']').join('\n'));
})();
