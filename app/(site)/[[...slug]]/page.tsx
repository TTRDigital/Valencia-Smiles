import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getPages, getPlainPage, getPost, getPosts, getSiteSettings, heroImages, plainSlugs } from "@/lib/content";
import { pageMetadata, shortTitle } from "@/lib/seo";
import { articleSchema, breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { accordionFaqs, articleFaqs, docHtml } from "@/lib/faq";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { ElementorDocument } from "@/components/elementor/Elementor";
import { BlogArchive, PER_PAGE, PostArticle } from "@/components/blog/Blog";
import { JsonLd } from "@/components/ui/JsonLd";

/*
 * Every page of the site, at the live site's own addresses:
 *  - the Elementor pages (home, about, services, ...): lib/data/pages
 *  - the two plain WordPress pages (privacy policy, testimonials)
 *  - the blog posts (/<post-slug>/) and the "Blogs" listing (/category/blogs/, /page/2/, ...)
 */

export const dynamicParams = false;

const BLOG = ["category", "blogs"];

type Resolved =
  | { kind: "page"; slug: string }
  | { kind: "plain"; slug: string }
  | { kind: "post"; slug: string }
  | { kind: "archive"; page: number };

async function resolve(parts: string[] = []): Promise<Resolved | null> {
  const path = parts.join("/");
  if (parts[0] === BLOG[0] && parts[1] === BLOG[1]) {
    if (parts.length === 2) return { kind: "archive", page: 1 };
    if (parts.length === 4 && parts[2] === "page" && /^\d+$/.test(parts[3])) return { kind: "archive", page: Number(parts[3]) };
    return null;
  }
  const slug = path === "" ? "home" : parts.join("__");
  if ((await getPages()).some((p) => p.slug === slug)) return { kind: "page", slug };
  if (parts.length === 1 && plainSlugs.includes(slug)) return { kind: "plain", slug };
  if (parts.length === 1 && (await getPosts()).some((p) => p.slug === slug)) return { kind: "post", slug };
  return null;
}

export async function generateStaticParams() {
  const [pages, posts] = await Promise.all([getPages(), getPosts()]);
  const archivePages = Math.ceil(posts.length / PER_PAGE);
  return [
    ...pages.map((p) => ({ slug: p.slug === "home" ? [] : p.slug.split("__") })),
    ...plainSlugs.map((s) => ({ slug: [s] })),
    ...posts.map((p) => ({ slug: [p.slug] })),
    { slug: BLOG },
    ...Array.from({ length: archivePages - 1 }, (_, i) => ({ slug: [...BLOG, "page", String(i + 2)] })),
  ];
}

type Props = { params: Promise<{ slug?: string[] }> };

const pathOf = (parts: string[] = []) => (parts.length ? `/${parts.join("/")}/` : "/");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return {};
  const path = pathOf(slug);
  if (r.kind === "page") return pageMetadata((await getPage(r.slug))!.seo, path);
  if (r.kind === "plain") return pageMetadata((await getPlainPage(r.slug))!.seo, path);
  if (r.kind === "post") {
    const p = (await getPost(r.slug))!;
    return pageMetadata(p.seo, path, { type: "article", published: p.date, modified: p.modified });
  }
  // As on the live site: no description, and noindex (the posts themselves are indexed).
  const title = r.page === 1 ? "Blogs Archives - Valencia Smile Expert" : `Blogs Archives - Page ${r.page} of ${Math.ceil((await getPosts()).length / PER_PAGE)} - Valencia Smile Expert`;
  return pageMetadata({ title, description: "" }, path, { noIndex: true });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const path = pathOf(slug);
  const settings = await getSiteSettings();

  if (r.kind === "page") {
    const page = (await getPage(r.slug))!;
    const pages = await getPages();
    const faqs = accordionFaqs(page.doc.children);
    // Breadcrumb: Home, then each parent page that exists, then this page.
    const crumbs = [{ name: "Home", path: "/" }];
    const parts = slug ?? [];
    for (let i = 1; i <= parts.length; i++) {
      const p = pages.find((x) => x.slug === parts.slice(0, i).join("__"));
      if (p) crumbs.push({ name: shortTitle(p.seo.title), path: p.path });
    }
    const postId = page.doc.postId;
    return (
      <SiteFrame cssKey={page.slug} bodyCls={page.bodyCls} path={path}>
        {crumbs.length > 1 ? <JsonLd data={breadcrumbSchema(crumbs)} /> : null}
        {faqs.length ? <JsonLd data={faqPageSchema(faqs)} /> : null}
        <div className="ast-container">
          <div id="primary" className="content-area primary">
            <main id="main" className="site-main">
              <article className={`post-${postId} page type-page status-publish ast-article-single`} id={`post-${postId}`} itemType="https://schema.org/CreativeWork" itemScope>
                <header className="entry-header ast-no-thumbnail ast-no-title ast-header-without-markup" />
                <div className="entry-content clear" itemProp="text">
                  <ElementorDocument doc={page.doc} ctx={{ path, priority: heroImages(page.doc.children) }} />
                </div>
              </article>
            </main>
          </div>
        </div>
      </SiteFrame>
    );
  }

  if (r.kind === "plain") {
    const page = (await getPlainPage(r.slug))!;
    return (
      <SiteFrame cssKey="plain" bodyCls={page.bodyCls} path={path}>
        <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: page.title, path }])} />
        <div className="ast-container">
          <div id="primary" className="content-area primary">
            <main id="main" className="site-main">
              <article className={page.articleCls} id={`post-${page.id}`} itemType="https://schema.org/CreativeWork" itemScope>
                <header className="entry-header ast-no-thumbnail">
                  <h1 className="entry-title" itemProp="headline">
                    {page.title}
                  </h1>
                </header>
                <div className="entry-content clear" data-ast-blocks-layout="true" itemProp="text" dangerouslySetInnerHTML={{ __html: page.html }} />
              </article>
            </main>
          </div>
        </div>
      </SiteFrame>
    );
  }

  const posts = await getPosts();
  if (r.kind === "post") {
    const post = (await getPost(r.slug))!;
    const faqs = articleFaqs(post.doc ? docHtml(post.doc.children) : post.html ?? "");
    return (
      <SiteFrame cssKey={post.doc ? "post" : "post-html"} bodyCls={post.bodyCls} path={path}>
        <JsonLd
          data={articleSchema({
            title: post.title,
            description: post.seo.description,
            date: post.date,
            modified: post.modified,
            image: post.image?.src,
            path,
            author: post.author.name,
            publisher: settings.name,
            logo: settings.logo.src,
          })}
        />
        <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blogs", path: "/category/blogs/" }, { name: post.title, path }])} />
        {faqs.length ? <JsonLd data={faqPageSchema(faqs)} /> : null}
        <PostArticle post={post} posts={posts} />
      </SiteFrame>
    );
  }

  const last = Math.ceil(posts.length / PER_PAGE);
  if (r.page > last) notFound();
  return (
    <SiteFrame cssKey="archive" bodyCls="archive category category-blogs category-1 wp-custom-logo wp-theme-astra wp-child-theme-valencia ast-plain-container ast-no-sidebar astra-4.11.1 ast-inherit-site-logo-transparent ast-hfb-header elementor-default elementor-kit-8 astra-addon-4.11.0" path={path}>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blogs", path: "/category/blogs/" }])} />
      <BlogArchive posts={posts} page={r.page} />
    </SiteFrame>
  );
}
