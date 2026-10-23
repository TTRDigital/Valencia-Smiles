import "server-only";
import { cache } from "react";
import { sanityFetch } from "@/lib/sanity/fetch";
import { merge } from "@/lib/merge";
import { dataset, projectId } from "@/sanity/env";
import { fallbackPages } from "@/lib/data/pages";
import fallbackPostsJson from "@/lib/data/posts.json";
import fallbackPlainJson from "@/lib/data/plain-pages.json";
import fallbackChromeJson from "@/lib/data/chrome.json";
import altText from "@/lib/data/alt.json";
import imageDims from "@/lib/data/image-dims.json";
import { fallbackSettings, type SiteSettings } from "@/lib/data/site";
import type { Chrome, ElementorPage, Node, PlainPage, Post } from "@/lib/types";

/* ==========================================================================
   Content layer
   Every page reads through these functions. Sanity values win when present;
   anything missing falls back to lib/data (the live site's content, copied
   word for word), so the site works before the CMS is filled in and an
   empty field never breaks a page.
   ========================================================================== */

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

const ALT = altText as Record<string, string>;
const DIMS = imageDims as Record<string, number[]>;

/**
 * Applied to every photo wherever it is used: the written alt text (the live
 * site had none on most photos), and the file's real size when the markup did
 * not give one (so the browser reserves the space before the photo loads).
 */
function withAlt<T>(v: T): T {
  if (Array.isArray(v)) return v.map(withAlt) as T;
  if (!isObj(v)) return v;
  const out: Loose = {};
  for (const [k, x] of Object.entries(v)) out[k] = withAlt(x);
  if (typeof out.src === "string" && "alt" in out) {
    const src = out.src as string;
    if (ALT[src] !== undefined) out.alt = ALT[src];
    const dims = DIMS[src];
    if (dims && !out.width && !out.height) {
      out.width = dims[0];
      out.height = dims[1];
    }
  }
  return out as T;
}

/**
 * Sanity image -> { src, alt, width, height }, read straight from the asset
 * reference (image-<id>-<w>x<h>-<ext>), so no query has to list image paths.
 */
function toImg(v: Loose) {
  const ref = (v.asset as Loose | undefined)?._ref;
  if (typeof ref !== "string") return null;
  const m = ref.match(/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/);
  if (!m) return null;
  return {
    src: `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}x${m[3]}.${m[4]}`,
    alt: typeof v.alt === "string" ? v.alt : "",
    width: Number(m[2]),
    height: Number(m[3]),
    ...(typeof v.cls === "string" ? { cls: v.cls } : {}),
  };
}

/** Drops Sanity's system keys (but keeps _key and _type, which the page tree uses), turns images into Img and slugs into strings. */
function normalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalize).filter((x) => x !== null && x !== undefined);
  if (!isObj(v)) return v;
  if (v._type === "altImage" || (isObj(v.asset) && typeof v.asset._ref === "string" && v.asset._ref.startsWith("image-"))) return toImg(v);
  if (v._type === "slug") return v.current;
  const out: Loose = {};
  for (const [k, x] of Object.entries(v)) {
    if (k.startsWith("_") && k !== "_key" && k !== "_type") continue;
    out[k] = normalize(x);
  }
  return out;
}

async function byId<T>(id: string, fallback: T): Promise<T> {
  const cms = await sanityFetch<Loose>(`*[_id == $id][0]`, { id }, [id]);
  return merge(fallback, normalize(cms));
}

/* ---------- Site-wide ---------- */

export const getSiteSettings = cache(async (): Promise<SiteSettings> => byId("siteSettings", fallbackSettings));

/** Header, footer and the two pop-ups (Elementor templates on the live site). */
export const getChrome = cache(async (): Promise<Chrome> => withAlt(await byId("layout", fallbackChromeJson as unknown as Chrome)));

/* ---------- Pages ---------- */

const pageId = (slug: string) => `page-${slug.replace(/__/g, ".")}`;

export const getPages = cache(async (): Promise<ElementorPage[]> => Promise.all(fallbackPages.map((p) => getPage(p.slug) as Promise<ElementorPage>)));

export const getPage = cache(async (slug: string): Promise<ElementorPage | undefined> => {
  const base = fallbackPages.find((p) => p.slug === slug);
  if (!base) return undefined;
  return withAlt(await byId(pageId(slug), base));
});

export const getPlainPage = cache(async (slug: string): Promise<PlainPage | undefined> => {
  const base = (fallbackPlainJson as PlainPage[]).find((p) => p.slug === slug);
  if (!base) return undefined;
  return withAlt(await byId(pageId(slug), base));
});

export const plainSlugs = (fallbackPlainJson as PlainPage[]).map((p) => p.slug);

/* ---------- Blog ---------- */

const fallbackPosts = fallbackPostsJson as unknown as Post[];

/** CMS posts merge over the built-in post with the same slug; CMS-only posts are added. Newest first. */
export const getPosts = cache(async (): Promise<Post[]> => {
  const cms = await sanityFetch<Loose[]>(`*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))]`, {}, ["post"]);
  if (!cms?.length) return withAlt(fallbackPosts);
  const bySlug = new Map(fallbackPosts.map((f) => [f.slug, f]));
  // Posts the CMS cannot render yet (no title or date) are skipped rather than breaking the build.
  const merged = cms.filter((raw) => typeof raw.title === "string" && typeof raw.date === "string").map((raw) => {
    const c = normalize(raw) as Partial<Post>;
    const base = bySlug.get(c.slug ?? "");
    return (base ? merge(base, c) : { ...c, path: `/${c.slug}/` }) as Post;
  });
  const missing = fallbackPosts.filter((f) => !merged.some((m) => m.slug === f.slug));
  return withAlt([...merged, ...missing].sort((a, b) => b.date.localeCompare(a.date)));
});

export const getPost = cache(async (slug: string) => (await getPosts()).find((p) => p.slug === slug));

/* ---------- Helpers ---------- */

/** Element ids of the first image in the page's first section (loads with high priority; everything else is lazy). */
export function heroImages(nodes: Node[]): Set<string> {
  const ids = new Set<string>();
  const first = nodes[0];
  const walk = (n: Node) => {
    if (ids.size) return;
    if (n._type === "image") ids.add(n._key);
    else if (n._type === "box") n.children.forEach(walk);
  };
  if (first) walk(first);
  return ids;
}
