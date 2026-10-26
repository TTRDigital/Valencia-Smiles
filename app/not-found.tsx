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
                      {/* The live search box, as it was. With no search on a static site, a search opens the home page. */}
                      <div className="widget widget_search">
                        <form role="search" method="get" className="search-form" action="/">
                          <label htmlFor="search-field">
                            <span className="screen-reader-text">Search for:</span>
                            <input type="search" id="search-field" className="search-field" placeholder="Search..." name="s" tabIndex={-1} defaultValue="" />
                            <button className="search-submit ast-search-submit" aria-label="Search Submit">
                              <span hidden>Search</span>
                              <i>
                                <span className="ast-icon icon-search">
                                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="-893 477 142 142" enableBackground="new -888 480 142 142">
                                    <path d="M-787.4,568.7h-6.3l-2.4-2.4c7.9-8.7,12.6-20.5,12.6-33.1c0-28.4-22.9-51.3-51.3-51.3 c-28.4,0-51.3,22.9-51.3,51.3c0,28.4,22.9,51.3,51.3,51.3c12.6,0,24.4-4.7,33.1-12.6l2.4,2.4v6.3l39.4,39.4l11.8-11.8L-787.4,568.7 L-787.4,568.7z M-834.7,568.7c-19.7,0-35.5-15.8-35.5-35.5c0-19.7,15.8-35.5,35.5-35.5c19.7,0,35.5,15.8,35.5,35.5 C-799.3,553-815,568.7-834.7,568.7L-834.7,568.7z" />
                                  </svg>
                                </span>
                              </i>
                            </button>
                          </label>
                          <input type="submit" className="search-submit" value="Search" />
                        </form>
                      </div>
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
