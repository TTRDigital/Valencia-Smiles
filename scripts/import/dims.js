// Writes lib/data/image-dims.json: { "/images/uploads/...": [width, height] } for every photo in public/images.
const fs = require('fs'), path = require('path');
const sharp = require(require('path').resolve('node_modules/sharp'));
const ROOT = require('path').resolve('public');
const out = {};
function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) yield* walk(f); else if (/\.(png|jpe?g|webp|svg)$/i.test(e.name)) yield f; } }
(async () => {
  for (const f of walk(path.join(ROOT, 'images'))) { const m = await sharp(f).metadata(); out['/' + path.relative(ROOT, f)] = [m.width, m.height]; }
  fs.writeFileSync(require('path').resolve('lib/data/image-dims.json'), JSON.stringify(out, null, 0));
  console.log(Object.keys(out).length);
})();
