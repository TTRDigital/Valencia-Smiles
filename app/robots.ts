import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// As on the live site (Yoast): everything open to crawlers; the studio is off limits.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/cms/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
