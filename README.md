# Valencia Smile Expert website

Rebuild of https://www.valenciasmileexpert.com (WordPress + Astra + Elementor Pro, GoHighLevel forms) as a
static **Next.js 16** site (App Router, `output: "export"`, trailing slashes, Tailwind v4) with **Sanity Studio**
at `/cms`, for **SiteGround** hosting. Built by TTR Digital on the same architecture as Diamond-Dental-Group and
Beverly-Hills-Top-Dentist.

- **Same pages, same addresses, same look.** Every page of the live site is rebuilt at its own URL. The
  Elementor pages are rendered from structured data with the markup Elementor printed, and styled by the live
  site's own CSS (ported per page). A layout check compares the position and size of every Elementor element
  on the live and rebuilt pages at 1440 px and 390 px; all pages match (differences listed below).
- **Same text.** Copied word for word from the live pages, with the same page titles and meta descriptions.
  Audit findings (text copied from other pages, writer's notes left in posts, missing descriptions, ...) are
  in [docs/live-site-audit.md](docs/live-site-audit.md) and are **not fixed yet**: they wait for the client's
  decisions.
- **Content in `lib/data`** (generated from the live site) is the built-in fallback; Sanity content is fetched
  at build time and merged over it (`lib/content.ts`), so the site works before Sanity is set up.

## Pages

| URL | Source |
|---|---|
| `/`, `/about/`, `/services/` and the 16 service pages, `/tmj-treatments/`, `/contact/`, `/appointment/`, `/thank-you/`, `/sitemap/`, `/terms-and-services/` | 24 Elementor pages: `lib/data/pages/*.json`, rendered by `components/elementor/Elementor.tsx` |
| `/privacy-policy/`, `/testimonials/` | plain WordPress pages: `lib/data/plain-pages.json` |
| `/<post-slug>/` (30 posts) | `lib/data/posts.json`, `components/blog/Blog.tsx` (breadcrumbs, post navigation, related posts as on the live theme) |
| `/category/blogs/`, `/category/blogs/page/2/`, `/page/3/` | the "Blogs" listing (10 posts a page), noindex as on the live site |
| `/cms` | Sanity Studio |

One route renders them all: `app/(site)/[[...slug]]/page.tsx` (`dynamicParams = false`).
Header, footer and the "Request Appointment" pop-up are the live Elementor templates (`lib/data/chrome.json`).

## How the look is kept

- `public/css/<page>.css`: the live site's stylesheets (Astra, Elementor, Elementor Pro, theme, the page's
  own Elementor CSS, inline styles) in the live document order, trimmed to the selectors the live page uses,
  with fonts and images served from this site. `scripts/postbuild.mjs` inlines each page's stylesheet into
  its HTML. The live `<body>` classes sit on `.site-body` (the CSS was rewritten from `body` to `.site-body`).
- Fonts: Cal Sans (headings) and Lato (text), self-hosted in `public/fonts` (Cal Sans subset to Latin).
- `public/js/site.js` replaces the live site's jQuery/Elementor/Swiper/Slick/Twenty20 scripts: sticky header,
  menu dropdowns and phone menu, pop-up, accordions (one open at a time), carousels, the theme's Slick
  sliders, before/after sliders, scroll-to-top, and loading of the GoHighLevel embeds.
- The menu never wraps: where the live menu broke onto two lines (768–800 px and 1025–1280 px), the
  phone menu shows instead (a width check in `site.js` switches it whenever the full menu would not fit).
- No React in the browser: the pages are static HTML. `scripts/postbuild.mjs` removes Next's runtime and
  hydration data from every page except `/cms` (halves the HTML, about 120 KB less JavaScript). All links are
  ordinary page loads.

## What is different from the live site

Kept identical on purpose, even where the audit found problems (they wait for the client). The changes:

| Change | Why |
|---|---|
| The "Request Appointment" pop-up (opened by "Book Now" / "Request Your Appointment" on 25 pages) shows its GoHighLevel form | On the live site the pop-up's only container is hidden on desktop, tablet and phone, so it opens empty |
| The 6 "Request Your Appointment" buttons that opened the WordPress form pop-up open the same GoHighLevel pop-up | The WordPress form only worked through WordPress's e-mail; both ask for the same four fields |
| The "Transformations Gallery" before/after sliders work | They render empty on the live site |
| The appointment calendar (GoHighLevel) is visible on desktop | It renders 0 px tall on the live site at desktop width |
| No comment form under blog posts | Needs WordPress; no comment was ever published |
| The 404 page links home instead of a search box | No search on a static site; the 404 now answers with a real 404 status |
| Google logo / star images served from this site | They loaded from `staging7.tiamspa.com` and `valencia.ttrdigitalmarketing.com` |
| Alt text on every photo (`lib/data/alt.json`) | 471 image tags had none |
| Photos: WebP copies at fixed widths, metadata removed, lazy below the fold; the hero loads with high priority | Speed |
| Tag Manager (GTM-PPV3TDK8), GA4 (G-XBJPWQ7365) and Ahrefs load on the visitor's first interaction | Speed; the live site loaded them at once |
| Schema: one `Dentist` site-wide, `BreadcrumbList` on inner pages, `FAQPage` from the pages' own accordions and the posts' FAQ sections, `BlogPosting` on posts | Replaces Yoast's graph |
| The author archives redirect (301): Dr. Moezzi's to `/about/`, the other two to `/category/blogs/` | As agreed in the brief |

## Old addresses (`public/.htaccess`)

Generated from the live site's data. All checked against Apache (268 checks):

- One host: `https://www.valenciasmileexpert.com`. The bare domain, `*.sg-host.com` and http go there (301).
  A staging copy at `staging.valenciasmileexpert.com` stays on its own address and is sent `X-Robots-Tag: noindex`.
- URLs without the trailing slash: 301 to the slash version.
- `?p=` / `?page_id=` links (all 56 pages and posts): 301 to the page.
- `/wp-content/uploads/...` images (any WordPress size suffix): 301 to the same file under `/images/uploads/`
  when this site has it; other uploads 410.
- WordPress sitemaps: 301 to `/sitemap.xml`. `/dental-implants/`: 301 to `/services/dental-implants/` (WordPress's own redirect).
- 410 Gone: `wp-admin`, `wp-includes`, `wp-json`, `wp-content` (other than uploads), `wp-login.php`, `xmlrpc.php`,
  feeds, `?rest_route=`.
- Security headers with a content security policy that allows what the pages load (Google Tag Manager,
  Analytics, the Google Ads tag fired by GTM, Ahrefs, GoHighLevel/LeadConnector, Google Maps, Sanity images),
  caching, gzip (including `text/javascript`), and the 404 page with a real 404 status.

## Forms, booking, tracking

As on the live site: Weave "Book Now" links, the GoHighLevel calendar on `/appointment/`, the GoHighLevel
"Request Appointment" form (pop-up) and "valencia contact" form (`/contact/`). The embeds load when needed
(pop-up: when opened; page embeds: once the page has loaded if on screen, otherwise when the visitor scrolls
near). No chat widget (the live site has none).

## Development

```bash
npm install
npm run dev        # local site (http://localhost:3000) and studio (/cms)
npm run lint
npm run typecheck
npm run build      # WebP copies, static export to out/, then scripts/postbuild.mjs
```

If the environment already sets another project's Sanity variables, build with
`env -u NEXT_PUBLIC_SANITY_PROJECT_ID -u NEXT_PUBLIC_SANITY_DATASET npm run build`.

## Deploying (`.github/workflows/deploy-siteground.yml`)

Builds on every push to this branch or `main`, on a Sanity publish (repository dispatch `sanity-publish`) and
from Actions > "Deploy to SiteGround" > Run workflow. Until the FTP secrets and the upload folder are set it
only builds (the site is kept as a run artifact for 14 days).

| Setting | Where | Value |
|---|---|---|
| `SG_FTP_SERVER`, `SG_FTP_USERNAME`, `SG_FTP_PASSWORD` | Secrets | SiteGround Site Tools > Site > FTP Accounts |
| `SG_FTP_DIR` | Variable | the site's document root as seen from the FTP account, e.g. `./` or `./staging.valenciasmileexpert.com/public_html/`. The "Show SiteGround folders" step prints the account's folders: check it before the first upload. |
| `SANITY_PROJECT_ID` | Variable | the Sanity project (empty: built-in content) |
| `GTM_ID`, `GA_ID`, `AHREFS_KEY` | Variables | optional; default to the live site's ids, `off` turns one off |

The upload only adds or replaces this site's files; it never deletes the WordPress files.

## Sanity (not connected yet)

`sanity/env.ts` reads `NEXT_PUBLIC_SANITY_PROJECT_ID` (empty until the project ID is provided); dataset
`production`. The schema (`sanity/schemaTypes`) mirrors the page data: site settings, header/footer/pop-up,
pages (the Elementor tree: boxes and widgets, with text, links and photos editable), text pages and blog posts.
The seed script and the "Load content into Sanity" workflow come with the Sanity setup.

## Regenerating from the live site

The data in `lib/data` and the CSS in `public/css` were generated from the live site on Oct 23, 2026 (Python and
Node scripts run outside the repo: Elementor HTML to page data, per-page CSS trimming, image download with
metadata removed, alt text map). After the switch, edit content in `/cms` instead.
