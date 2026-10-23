import type { NextConfig } from "next";

/*
 * Static export for SiteGround (Apache) hosting: `npm run build` writes plain
 * HTML/CSS/JS to `out/`, which goes into public_html.
 *
 * What a static host has no Node server for lives elsewhere:
 * - redirects, security headers (CSP) and caching: public/.htaccess
 * - forms: the live site's GoHighLevel embeds (pop-up and contact page)
 * - images: WebP copies made before the build by scripts/optimize-images.mjs
 * - page styles: the live site's CSS, per page, in public/css
 * - CMS updates: rebuild and upload (.github/workflows/deploy-siteground.yml),
 *   started by a push, a Sanity webhook or the "Run workflow" button
 */
const nextConfig: NextConfig = {
  output: "export",
  // /about/ -> about/index.html, which Apache serves as is (same URLs as WordPress).
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
