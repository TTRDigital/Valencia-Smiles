/*
 * After `next build`, for every page except the Sanity Studio (/cms):
 *
 * 1. Inlines the page's stylesheet (public/css/<key>.css, named by the data-css
 *    attribute SiteFrame prints) into <head>, in place of its <link>. Each page
 *    group has its own stylesheet, so this saves a render-blocking request and
 *    loses no caching that mattered. Without this step the pages still work:
 *    they link the same file.
 * 2. Removes Next's client runtime: its script chunks and the page's React
 *    hydration data (a second copy of all the page's content). The pages are
 *    plain HTML with no client components; links are ordinary page loads and
 *    every behavior (menus, pop-up, sliders) comes from public/js/site.js, so
 *    nothing on the page needs React in the browser. This halves the HTML and
 *    drops about 120 KB of JavaScript per page.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out");
const css = new Map();

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (path.relative(OUT, f) === "cms") continue; // the Studio is a React app
      yield* walk(f);
    } else if (e.name.endsWith(".html")) yield f;
  }
}

let pages = 0;
let saved = 0;
for await (const file of walk(OUT)) {
  let html = await readFile(file, "utf8");
  const before = html.length;

  // 2. Next's runtime and hydration data.
  html = html
    .replace(/<script\b[^>]*\bsrc="\/_next\/[^"]*"[^>]*>\s*<\/script>/g, "")
    .replace(/<link\b[^>]*\bas="script"[^>]*\bhref="\/_next\/[^"]*"[^>]*\/?>/g, "")
    .replace(/<script\b[^>]*\bid="_R_"[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<script>\s*\(?self\.__next_f[\s\S]*?<\/script>/g, "");

  // 1. The page's own stylesheet: its <link> (printed by SiteFrame) becomes the same CSS inline, placed
  //    before Next's own styles so the cascade is the live site's CSS, then ours. Preloads of other
  //    pages' stylesheets (the 404 page's, which Next hints on every page) are dropped.
  const key = /\sdata-css="([a-z0-9_-]+)"/.exec(html)?.[1];
  if (key && !html.includes('id="page-css"')) {
    if (!css.has(key)) css.set(key, (await readFile(path.join(OUT, "css", `${key}.css`), "utf8")).replace(/<\/style/gi, "<\\/style"));
    html = html
      .replace(new RegExp(`<link\\b[^>]*\\brel="stylesheet"[^>]*\\bhref="/css/${key}\\.css[^"]*"[^>]*/?>`, "g"), "")
      .replace(/<link\b[^>]*\brel="preload"[^>]*\bhref="\/css\/[^"]*"[^>]*\/?>/g, "");
    const at = html.search(/<style[^>]*data-precedence|<link[^>]*rel="stylesheet"|<\/head>/);
    html = `${html.slice(0, at)}<style id="page-css">${css.get(key)}</style>${html.slice(at)}`;
  }

  saved += before - html.length;
  pages++;
  await writeFile(file, html);
}
console.log(`[postbuild] ${pages} pages: stylesheet inlined, Next runtime removed (net ${Math.round(saved / 1024)} KB smaller in total)`);
