import type { Metadata } from "next";
import type { Seo } from "@/lib/types";
import { bgUrl } from "@/components/elementor/Img";

const SITE_NAME = "Valencia Smile Expert";

/** Title, description, canonical, Open Graph and Twitter tags. Titles and descriptions are the live site's, as written. */
export function pageMetadata(seo: Seo, path: string, opts: { noIndex?: boolean; type?: "website" | "article"; published?: string; modified?: string } = {}): Metadata {
  const image = seo.ogImage ? bgUrl(seo.ogImage) : undefined;
  const description = seo.description || undefined;
  return {
    title: { absolute: seo.title },
    description,
    alternates: { canonical: path },
    robots: opts.noIndex ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    openGraph: {
      type: opts.type ?? "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: seo.title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(opts.published ? { publishedTime: opts.published, modifiedTime: opts.modified } : {}),
    },
    twitter: { card: "summary_large_image", title: seo.title, description, ...(image ? { images: [image] } : {}) },
  };
}

/** "Bone Grafting in Santa Clarita | Valencia Smile Expert" -> "Bone Grafting in Santa Clarita" (breadcrumb names). */
export function shortTitle(title: string) {
  return title.replace(/\s+[|\-–]\s+Valencia Smile Expert$/, "").trim();
}
