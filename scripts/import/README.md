# Import scripts (one-off, from the live WordPress site)

How `lib/data`, `public/css`, `public/images` and `public/.htaccess` were generated on Oct 23, 2026.
Kept for reference and for re-running against a fresh copy of the live site; after the switch,
content is edited in `/cms`. Run from the repository root; `<live>` is a folder holding the
downloaded site:

- `<live>/html/*.html`: every page (sitemap URLs, the blog listing, a 404), file name = path with `/` as `__`
- `<live>/json/{pages,posts}.json`: the WordPress REST API listings (`/wp-json/wp/v2/pages?per_page=100`, `posts`)
- `<live>/css/`: every stylesheet the pages link (file name = URL path with `/` as `_`), plus Elementor's
  `conditionals/dialog.min.css`; `<live>/groups.json`: which pages share a stylesheet
- `<live>/img/images/uploads/...`: the original uploads; `<live>/used-imgs.txt`: the ones the site uses

| Script | Does |
|---|---|
| `python3 -I scripts/import/extract.py <live> .` | Elementor HTML to `lib/data/pages/*.json`, `chrome.json` (header, footer, pop-ups), `posts.json`, `plain-pages.json`, `icons.json` |
| `node scripts/import/css.js <live> .` | per-page stylesheets in `public/css` (live order, trimmed with PurgeCSS, assets local) and `lib/data/css.json` |
| `node scripts/import/images.js <live> .` | copies the used uploads to `public/images` with all metadata removed |
| `node scripts/import/dims.js` | `lib/data/image-dims.json` (each photo's real size) |
| `python3 scripts/import/htaccess.py <live> public/.htaccess` | `.htaccess` from `htaccess.tpl` plus a `?p=` / `?page_id=` redirect for every page and post |

`lib/data/alt.json` (alt text) was written by hand after looking at every photo.
`purgecss` and `lightningcss` are needed for `css.js` (`npm i --no-save purgecss@7`; lightningcss comes with Tailwind).
