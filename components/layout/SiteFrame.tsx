import type { ReactNode } from "react";
import { getChrome } from "@/lib/content";
import cssManifest from "@/lib/data/css.json";
import { ElementorDocument } from "@/components/elementor/Elementor";

const CSS = cssManifest as Record<string, { href: string }>;

/**
 * The live site's page frame (Astra theme + Elementor header and footer),
 * with the same element ids and classes, so the ported CSS applies as before.
 *
 * `cssKey` picks the page's stylesheet (public/css, built from the live
 * site's CSS). `bodyCls` holds the live <body> classes; they sit on
 * .site-body because one root layout serves every page (the ported CSS
 * targets .site-body where the original targeted body).
 */
export async function SiteFrame({ cssKey, bodyCls, path, children }: { cssKey: string; bodyCls: string; path: string; children: ReactNode }) {
  const chrome = await getChrome();
  const css = CSS[cssKey] ?? CSS.plain;
  const ctx = { path };
  return (
    <>
      {/*
        The page's stylesheet (public/css/<key>.css, built from the live site's CSS) is inlined into
        <head> after the build by scripts/inline-css.mjs, found through data-css below: one fewer
        render-blocking request, and the CSS is not repeated in Next's page data. `next dev` links it.
      */}
      {process.env.NODE_ENV === "development" ? <link rel="stylesheet" href={css.href} precedence="default" /> : null}
      <div className={`site-body ${bodyCls}`} data-css={cssKey}>
        <a className="skip-link screen-reader-text" href="#content">
          Skip to content
        </a>
        <div className="hfeed site" id="page">
          <ElementorDocument doc={chrome.header} ctx={ctx} tag="header" />
          <div id="content" className="site-content">
            {children}
          </div>
          <ElementorDocument doc={chrome.footer} ctx={ctx} tag="footer" />
        </div>
        <div id="ast-scroll-top" tabIndex={0} className="ast-scroll-top-icon ast-scroll-to-top-right" data-on-devices="both" style={{ display: "none" }}>
          <span className="ast-icon icon-arrow">
            <svg className="ast-arrow-svg" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="26px" height="16.043px" viewBox="57 35.171 26 16.043" aria-hidden="true">
              <path d="M57.5,38.193l12.5,12.5l12.5-12.5l-2.5-2.5l-10,10l-10-10L57.5,38.193z" />
            </svg>
          </span>
          <span className="screen-reader-text">Scroll to Top</span>
        </div>
        {Object.entries(chrome.popups).map(([id, doc]) =>
          // Only the GoHighLevel pop-up is used; the WordPress form pop-up's buttons open it too (see Elementor.tsx).
          id === "566" ? <ElementorDocument key={id} doc={doc} ctx={ctx} /> : null,
        )}
      </div>
    </>
  );
}
