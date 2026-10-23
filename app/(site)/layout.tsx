import "../globals.css";
import { getSiteSettings } from "@/lib/content";
import { businessSchema } from "@/lib/schema";
import { JsonLd } from "@/components/ui/JsonLd";
import { Analytics } from "@/components/layout/Analytics";
import { assetUrl } from "@/lib/asset-version";
import { HydrationSignal } from "@/components/layout/HydrationSignal";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getSiteSettings();
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
