import "../globals.css";
import { preload } from "react-dom";
import { getSiteSettings } from "@/lib/content";
import { businessSchema } from "@/lib/schema";
import { JsonLd } from "@/components/ui/JsonLd";
import { Analytics } from "@/components/layout/Analytics";
import { assetUrl } from "@/lib/asset-version";
import { HydrationSignal } from "@/components/layout/HydrationSignal";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getSiteSettings();
  // The two text fonts are fetched with the page, so text does not reflow when they arrive.
  preload("/fonts/Lato-Regular-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  preload("/fonts/CalSans-Regular.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <>
      <JsonLd data={businessSchema(s)} />
      {children}
      <HydrationSignal />
      <Analytics />
      <script src={assetUrl("js/site.js")} defer />
    </>
  );
}
