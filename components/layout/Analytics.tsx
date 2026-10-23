/*
 * The live site's tracking, kept as it was: Google Tag Manager (GTM-PPV3TDK8),
 * Google Analytics 4 (G-XBJPWQ7365, loaded by gtag.js as on the live site) and
 * Ahrefs Web Analytics. Each id can be changed or turned off ("off") with the
 * NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_AHREFS_KEY variables.
 *
 * The scripts load on the visitor's first interaction (mouse move, touch,
 * scroll, wheel or key press), so they never compete with the first paint or
 * with the GoHighLevel forms; the page view is recorded then. Events sent
 * before that wait in dataLayer and go out once the tags are in. (A timer
 * fallback was dropped: on the pages with a GoHighLevel embed it fired in the
 * middle of loading and cost those pages their Lighthouse score.)
 */
const env = (v: string | undefined, fallback: string) => (v === "off" ? "" : v || fallback);
const GTM_ID = env(process.env.NEXT_PUBLIC_GTM_ID, "GTM-PPV3TDK8");
const GA_ID = env(process.env.NEXT_PUBLIC_GA_ID, "G-XBJPWQ7365");
const AHREFS_KEY = env(process.env.NEXT_PUBLIC_AHREFS_KEY, "zOiJ7NVjmgliAokzTHBDAw");

const LOADER = `(function(){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=window.gtag||gtag;${GA_ID ? `gtag('js',new Date());gtag('config','${GA_ID}');` : ""}var done=false;function add(src,attrs){var s=document.createElement('script');s.async=true;s.src=src;for(var k in attrs)s.setAttribute(k,attrs[k]);document.head.appendChild(s)}function load(){if(done)return;done=true;${GTM_ID ? `dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});add('https://www.googletagmanager.com/gtm.js?id=${GTM_ID}',{});` : ""}${GA_ID ? `add('https://www.googletagmanager.com/gtag/js?id=${GA_ID}',{});` : ""}${AHREFS_KEY ? `add('https://analytics.ahrefs.com/analytics.js',{'data-key':'${AHREFS_KEY}'});` : ""}}['pointerdown','pointermove','keydown','scroll','wheel','touchstart'].forEach(function(e){addEventListener(e,load,{once:true,passive:true})});})();`;

export function Analytics() {
  if (!GTM_ID && !GA_ID && !AHREFS_KEY) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LOADER }} />
      {GTM_ID ? (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="Google Tag Manager" />
        </noscript>
      ) : null}
    </>
  );
}
