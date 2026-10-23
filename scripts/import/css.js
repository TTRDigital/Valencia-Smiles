/*
 * Builds one stylesheet per page group from the live site's own CSS, in the
 * live document order, trimmed to the selectors the live pages use (PurgeCSS),
 * with uploads, fonts and `body` selectors rewritten for the new site.
 * Usage: node css.js <live dir> <repo dir>
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PurgeCSS } = require('purgecss');
const { transform } = require('lightningcss');

const [, , LIVE, REPO] = process.argv;
const HTML = path.join(LIVE, 'html');
const CSSDIR = path.join(LIVE, 'css');
const OUT = path.join(REPO, 'public/css');
fs.mkdirSync(OUT, { recursive: true });

const SKIP = [/font-awesome/, /fonts\.googleapis/, /wp-content_plugins_elementor-pro_assets_css_widget-form/];

function localName(url) {
  url = url.replace(/&#038;/g, '&');
  if (/fonts\.googleapis/.test(url)) return 'googlefonts.css';
  return url.replace('https://www.valenciasmileexpert.com/', '').replace(/\?.*/, '').replace(/\//g, '_');
}

/** Stylesheets and inline <style> blocks in document order. */
function cssParts(html) {
  const parts = [];
  const re = /<link[^>]*rel=['"]stylesheet['"][^>]*>|<style[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<link')) {
      const href = /href=['"]([^'"]+)/.exec(m[0])[1];
      const name = localName(href);
      if (SKIP.some((r) => r.test(href) || r.test(name))) continue;
      const file = path.join(CSSDIR, name);
      if (!fs.existsSync(file)) { console.warn('missing css', name); continue; }
      // Elementor loads its dialog styles from script when a pop-up opens; here they come with the page.
      if (/conditionals_popup\.min\.css$/.test(name)) {
        const dialog = 'wp-content_plugins_elementor_assets_css_conditionals_dialog.min.css';
        parts.push({ key: dialog, css: fs.readFileSync(path.join(CSSDIR, dialog), 'utf8'), base: href });
      }
      parts.push({ key: name, css: fs.readFileSync(file, 'utf8'), base: href });
    } else {
      const id = (/id=['"]([^'"]+)/.exec(m[0]) || [])[1] || 'inline';
      if (id === 'wp-emoji-styles-inline-css') continue;
      parts.push({ key: id + ':' + crypto.createHash('md5').update(m[1]).digest('hex').slice(0, 6), css: m[1], base: 'https://www.valenciasmileexpert.com/' });
    }
  }
  return parts;
}

const uploadRe = /url\((['"]?)https?:\/\/(?:www\.valenciasmileexpert\.com|staging7\.tiamspa\.com|valencia\.ttrdigitalmarketing\.com)\/wp-content\/uploads\/([^'")?]+)\1\)/g;
function rewrite(css) {
  css = css.replace(uploadRe, (_, q, rel) => {
    const full = rel.replace(/-\d+x\d+(?=\.(png|jpe?g|webp)$)/i, '');
    const webp = `/_img/images/uploads/${full.replace(/\.(png|jpe?g|webp)$/i, '')}-1920.webp`;
    return `url("${webp}")`;
  });
  // The theme's own Cal Sans file; the TTF fallback is not needed by any current browser.
  css = css.replace(/url\(['"]?https:\/\/www\.valenciasmileexpert\.com\/wp-content\/themes\/valencia\/assets\/fonts\/CalSans-Regular\.woff2['"]?\)/g, 'url("/fonts/CalSans-Regular.woff2")');
  css = css.replace(/,\s*url\(['"]?https:\/\/www\.valenciasmileexpert\.com\/wp-content\/themes\/valencia\/assets\/fonts\/CalSans-Regular\.ttf['"]?\)\s*format\(['"]truetype['"]\)/g, '');
  // The theme's slider-dot icon font (Slick), served from /fonts; the old loading GIF is dropped.
  css = css.replace(/src:\s*url\('\.\.\/fonts\/slick\.eot'\);\s*src:[^;]*;/g, 'src:url("/fonts/slick.woff") format("woff");');
  css = css.replace(/url\(['"]?\.\.\/(ajax-loader\.gif|fonts\/slick[^'")]*)['"]?\)/g, 'none');
  return css;
}

/** `body` type selectors -> .site-body (the page wrapper that carries the live body classes). */
function bodySelectors(css) {
  return css.replace(/(^|[\s,>+~(}{;])body(?=[\s.:#[,>+~){])/g, '$1.site-body');
}

const FONTS = `@font-face{font-family:'Lato';font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/Lato-Regular-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Cal Sans';font-style:normal;font-weight:400;font-display:swap;src:url(/fonts/CalSans-Regular.woff2) format('woff2')}
`;

const SAFELIST = {
  standard: [/^site-body$/, /^is-open$/, /^elementor-active$/, /^e-active$/, /^highlighted$/, /^has-submenu$/, /^sub-arrow$/],
  deep: [/^elementor-sticky/, /^swiper/, /^slick/, /^dialog/, /^elementor-popup/, /^twentytwenty/, /^elementor-menu-toggle/, /^elementor-nav-menu/, /^e-n-accordion/, /^elementor-swiper/, /^ast-scroll-to-top/, /^elementor-pagination/],
  greedy: [/swiper/, /slick/, /dialog/, /twentytwenty/],
};

async function build(name, files) {
  const htmls = files.map((f) => fs.readFileSync(path.join(HTML, f), 'utf8'));
  // Order: the first page's parts, then any part another page adds, placed after the last part it follows.
  const order = [];
  const byKey = new Map();
  for (const h of htmls) {
    const parts = cssParts(h);
    let last = -1;
    for (const p of parts) {
      const at = order.indexOf(p.key);
      if (at >= 0) { last = at; continue; }
      order.splice(last + 1, 0, p.key);
      byKey.set(p.key, p.css);
      last++;
    }
  }
  const raw = FONTS + order.map((k) => `/* ${k} */\n` + rewrite(byKey.get(k))).join('\n');
  const [purged] = await new PurgeCSS().purge({
    content: htmls.map((raw) => ({ raw: raw.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<link[^>]*>/g, ''), extension: 'html' })),
    css: [{ raw }],
    safelist: SAFELIST,
    keyframes: true,
    fontFace: false,
    variables: false,
  });
  const css = bodySelectors(purged.css);
  const { code } = transform({ filename: name + '.css', code: Buffer.from(css), minify: true, errorRecovery: true });
  const hash = crypto.createHash('md5').update(code).digest('hex').slice(0, 8);
  fs.writeFileSync(path.join(OUT, name + '.css'), code);
  return [name, { href: `/css/${name}.css?v=${hash}`, bytes: code.length }];
}

(async () => {
  const all = fs.readdirSync(HTML).filter((f) => f.endsWith('.html'));
  const pages = JSON.parse(fs.readFileSync(path.join(LIVE, 'groups.json'), 'utf8'));
  const manifest = {};
  for (const [name, files] of Object.entries(pages)) {
    const [n, info] = await build(name, files.filter((f) => all.includes(f)));
    manifest[n] = info;
    console.log(n.padEnd(48), info.bytes);
  }
  fs.writeFileSync(path.join(REPO, 'lib/data/css.json'), JSON.stringify(manifest, null, 1));
})();
