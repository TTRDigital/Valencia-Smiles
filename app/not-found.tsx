import "./globals.css";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { Analytics } from "@/components/layout/Analytics";
import { assetUrl } from "@/lib/asset-version";

export const metadata = { title: { absolute: "Page not found - Valencia Smile Expert" }, robots: { index: false } };

/* The live 404 (Astra), served with a real 404 status by .htaccess (ErrorDocument). */
export default function NotFound() {
  return (
    <>
      <SiteFrame cssKey="plain" bodyCls="error404 wp-custom-logo wp-theme-astra wp-child-theme-valencia ast-plain-container ast-no-sidebar astra-4.11.1 ast-inherit-site-logo-transparent ast-hfb-header elementor-default elementor-kit-8 astra-addon-4.11.0" path="/404/">
        <div className="ast-container">
          <div id="primary" className="content-area primary">
            <main id="main" className="site-main">
              <section className="error-404 not-found">
                <div className="ast-404-layout-1">
                  <header className="page-header">
                    <h1 className="page-title">This page doesn&apos;t seem to exist.</h1>
                  </header>
                  <div className="page-content">
                    <h3 className="page-sub-title"> It looks like the link pointing here was faulty. Maybe try searching? </h3>
                    <div className="ast-404-search">
                      {/* The live page had a WordPress search box here; a static site has no search, so it links home. */}
                      <p>
                        <a href="/">Go to the home page</a>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </SiteFrame>
      <Analytics />
      <script src={assetUrl("js/site.js")} defer />
    </>
  );
}
