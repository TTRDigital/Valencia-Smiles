import type { Post } from "@/lib/types";
import { Img } from "@/components/elementor/Img";
import { ElementorDocument } from "@/components/elementor/Elementor";

/*
 * Blog markup as the live Astra theme printed it (single post, related posts,
 * post navigation, archive grid and pagination), so the ported CSS applies.
 */

const POST_CLS = "post type-post status-publish format-standard has-post-thumbnail hentry category-blogs";
const BLOG = "/category/blogs/";

function Byline({ post }: { post: Post }) {
  return (
    <>
      <span className="posted-by vcard author" itemProp="author" itemScope itemType="https://schema.org/Person">
        {" "}
        <a title={`View all posts by ${post.author.name}`} href="/about/" rel="author" className="url fn n" itemProp="url">
          {" "}
          <span className="author-name" itemProp="name">
            {post.author.name}
          </span>{" "}
        </a>{" "}
      </span>
    </>
  );
}

function Published({ post }: { post: Post }) {
  return (
    <span className="posted-on">
      <span className="published" itemProp="datePublished">
        {` ${post.dateText} `}
      </span>
    </span>
  );
}

export function PostArticle({ post, posts }: { post: Post; posts: Post[] }) {
  // posts: newest first. Previous = the next older post, Next = the next newer one (WordPress order).
  const i = posts.findIndex((p) => p.slug === post.slug);
  const prev = posts[i + 1];
  const next = i > 0 ? posts[i - 1] : undefined;
  // Astra's related posts: the two oldest other posts in the same category.
  const related = [...posts].reverse().filter((p) => p.slug !== post.slug).slice(0, 2);
  return (
    <div className="ast-container">
      <div id="primary" className="content-area primary">
        <main id="main" className="site-main">
          <article className={post.articleCls} id={`post-${post.id}`} itemType="https://schema.org/CreativeWork" itemScope>
            <div className="ast-post-format- single-layout-1">
              <header className="entry-header ast-header-without-markup">
                <div className="ast-breadcrumbs-wrapper">
                  <div className="ast-breadcrumbs-inner">
                    <nav role="navigation" aria-label="Breadcrumbs" className="breadcrumb-trail breadcrumbs">
                      <div className="ast-breadcrumbs">
                        <ul className="trail-items">
                          <li className="trail-item trail-begin">
                            <a href="/" rel="home">
                              <span>Home</span>
                            </a>
                          </li>
                          <li className="trail-item">
                            <a href={BLOG}>
                              <span>Blogs</span>
                            </a>
                          </li>
                          <li className="trail-item trail-end">
                            <span>
                              <span>{post.title}</span>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </nav>
                  </div>
                </div>
                <h1 className="entry-title" itemProp="headline">
                  {post.title}
                </h1>
                <div className="entry-meta">
                  By <Byline post={post} /> / <Published post={post} />
                </div>
                {post.image ? (
                  <div className="post-thumb-img-content post-thumb">
                    <Img img={post.image} priority itemProp="image" sizes="(max-width: 1024px) 100vw, 1024px" />
                  </div>
                ) : null}
              </header>
              {post.doc ? (
                <div className="entry-content clear" data-ast-blocks-layout="true" itemProp="text">
                  <ElementorDocument doc={post.doc} ctx={{ path: post.path }} />
                </div>
              ) : (
                <div className="entry-content clear" data-ast-blocks-layout="true" itemProp="text" dangerouslySetInnerHTML={{ __html: post.html ?? "" }} />
              )}
            </div>
          </article>
          <nav className="navigation post-navigation" aria-label="Posts">
            <div className="nav-links">
              {prev ? (
                <div className="nav-previous">
                  <a title={prev.title} href={prev.path} rel="prev">
                    <span className="ast-post-nav" aria-hidden="true">
                      <span aria-hidden="true" className="ahfb-svg-iconset ast-inline-flex svg-baseline">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                          <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z" />
                        </svg>
                      </span>{" "}
                      Previous
                    </span>{" "}
                    <p> {prev.title} </p>
                  </a>
                </div>
              ) : null}
              {next ? (
                <div className="nav-next">
                  <a title={next.title} href={next.path} rel="next">
                    <span className="ast-post-nav" aria-hidden="true">
                      Next{" "}
                      <span aria-hidden="true" className="ahfb-svg-iconset ast-inline-flex svg-baseline">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                          <path d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z" />
                        </svg>
                      </span>
                    </span>{" "}
                    <p> {next.title} </p>
                  </a>
                </div>
              ) : null}
            </div>
          </nav>
          {related.length ? (
            <div className="ast-single-related-posts-container ast-container--">
              <div className="ast-related-posts-title-section">
                <h2 className="ast-related-posts-title"> Related Posts </h2>
              </div>
              <div className="ast-related-posts-wrapper">
                {related.map((r) => (
                  <article key={r.slug} className={`ast-related-post post-${r.id} ${POST_CLS}`}>
                    <div className="ast-related-posts-inner-section">
                      <div className="ast-related-post-content">
                        {r.image ? (
                          <div className="ast-related-post-featured-section post-has-thumb">
                            <div className="post-thumb-img-content post-thumb">
                              <a aria-label={`Read more about ${r.title}`} href={r.path}>
                                <Img img={r.image} sizes="(max-width: 1024px) 100vw, 1024px" />
                              </a>
                            </div>
                          </div>
                        ) : null}
                        <header className="entry-header related-entry-header">
                          <h3 className="ast-related-post-title entry-title">
                            <a href={r.path} target="_self" rel="bookmark noopener noreferrer">
                              {r.title}
                            </a>
                          </h3>
                          <div className="entry-meta ast-related-cat-style--none ast-related-tag-style--none">
                            By <Byline post={r} /> / <Published post={r} /> /{" "}
                            <span className="ast-taxonomy-container cat-links default">
                              <a href={BLOG} rel="category tag">
                                Blogs
                              </a>
                            </span>
                          </div>
                        </header>
                        <div className="entry-content clear" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export const PER_PAGE = 10;

export function BlogArchive({ posts, page }: { posts: Post[]; page: number }) {
  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const list = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (n: number) => (n === 1 ? BLOG : `${BLOG}page/${n}/`);
  return (
    <div className="ast-container">
      <div id="primary" className="content-area primary ast-grid-3 ast-blog-layout-4-grid">
        <section className="ast-archive-description">
          <h1 className="page-title ast-archive-title">Blogs</h1>
        </section>
        <main id="main" className="site-main">
          <div className="ast-row">
            {list.map((p, i) => (
              <article key={p.slug} className={`post-${p.id} ${POST_CLS} ast-grid-common-col ast-full-width ast-article-post remove-featured-img-padding`} id={`post-${p.id}`} itemType="https://schema.org/CreativeWork" itemScope>
                <div className="ast-post-format- blog-layout-4 ast-article-inner">
                  <div className="post-content ast-grid-common-col">
                    {p.image ? (
                      <div className="ast-blog-featured-section post-thumb ast-blog-single-element">
                        <div className="post-thumb-img-content post-thumb">
                          <a aria-label={`Read: ${p.title}`} href={p.path}>
                            <Img img={p.image} priority={i < 3} itemProp="image" sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                          </a>
                        </div>
                      </div>
                    ) : null}
                    <h2 className="entry-title ast-blog-single-element" itemProp="headline">
                      <a href={p.path} rel="bookmark">
                        {p.title}
                      </a>
                    </h2>
                    <header className="entry-header ast-blog-single-element ast-blog-meta-container">
                      <div className="entry-meta">
                        <Byline post={p} /> / <Published post={p} />
                      </div>
                    </header>
                    <div className="entry-content clear" itemProp="text" />
                  </div>
                </div>
              </article>
            ))}
          </div>
          {pages > 1 ? (
            <nav className="navigation pagination" aria-label="Post pagination">
              <div className="nav-links">
                {page > 1 ? (
                  <a className="prev page-numbers" href={href(page - 1)}>
                    <span aria-hidden="true" className="ast-left-arrow">
                      ←
                    </span>{" "}
                    Previous
                  </a>
                ) : null}
                {Array.from({ length: pages }, (_, k) => k + 1).map((n) =>
                  n === page ? (
                    <span key={n} aria-current="page" className="page-numbers current">
                      {n}
                    </span>
                  ) : (
                    <a key={n} className="page-numbers" href={href(n)}>
                      {n}
                    </a>
                  ),
                )}
                {page < pages ? (
                  <a className="next page-numbers" href={href(page + 1)}>
                    Next{" "}
                    <span aria-hidden="true" className="ast-right-arrow">
                      →
                    </span>
                  </a>
                ) : null}
              </div>
            </nav>
          ) : null}
        </main>
      </div>
    </div>
  );
}
