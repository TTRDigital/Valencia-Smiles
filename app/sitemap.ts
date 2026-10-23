import type { MetadataRoute } from "next";
import { getPages, getPlainPage, getPosts, plainSlugs } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Every page and post the live WordPress sitemaps listed (author archives now redirect, so they are left out). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts] = await Promise.all([getPages(), getPosts()]);
  const plain = await Promise.all(plainSlugs.map((s) => getPlainPage(s)));
  return [
    ...pages.map((p) => ({ url: absoluteUrl(p.path), priority: p.path === "/" ? 1 : 0.8 })),
    ...plain.filter(Boolean).map((p) => ({ url: absoluteUrl(p!.path), priority: 0.3 })),
    ...posts.map((p) => ({ url: absoluteUrl(p.path), lastModified: p.modified, priority: 0.6 })),
  ];
}
