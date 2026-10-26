import { Fragment, type ReactNode } from "react";
import icons from "@/lib/data/icons.json";
import type {
  Accordion,
  BeforeAfter,
  Box,
  Button,
  Carousel,
  ElementorDoc,
  FormW,
  Heading,
  Icon,
  IconBox,
  IconList,
  ImageBox,
  ImageCarousel,
  ImageW,
  MapW,
  MenuItem,
  NavMenu,
  Node,
  SiteLogo,
  SocialIcons,
  TableW,
} from "@/lib/types";
import { Img } from "@/components/elementor/Img";
import { iframeHtml } from "@/lib/embeds";

/*
 * Renders Elementor documents with the same markup Elementor printed on the
 * live site (class names, nesting), so the ported Elementor CSS in public/css
 * styles it exactly as before. Behaviors (carousels, accordions, menus,
 * pop-ups, before/after sliders) are added by public/js/site.js.
 */

export type Ctx = {
  /** Current path, for the menu's active item. */
  path: string;
  /** Element ids whose first image loads with high priority (above the fold). */
  priority?: Set<string>;
};

const ICONS = icons as Record<string, string>;

function iconHtml(icon: Icon | undefined): string {
  if (!icon) return "";
  if (icon.svg) return ICONS[icon.svg] ?? "";
  if (icon.img) return `<img src="${icon.img.src}" alt="${icon.img.alt ?? ""}"${icon.img.width ? ` width="${icon.img.width}"` : ""}${icon.img.height ? ` height="${icon.img.height}"` : ""} loading="lazy" decoding="async">`;
  if (icon.i) return `<i aria-hidden="true" class="${icon.i}"></i>`;
  return "";
}

const html = (h: string | undefined) => ({ __html: h ?? "" });
const ext = (href?: string) => !!href && /^https?:/.test(href);
/** Pop-up links (#popup-<id>) open the matching pop-up; see public/js/site.js. */
const linkProps = (href?: string, target?: string) => {
  if (!href) return {};
  if (href.startsWith("#popup-")) return { href, "data-popup": href.slice(7) };
  return { href, target, rel: target === "_blank" || ext(href) ? (target === "_blank" ? "noopener" : undefined) : undefined };
};

const WIDGET_CLASS: Record<string, string> = {
  heading: "elementor-widget-heading",
  text: "elementor-widget-text-editor",
  button: "elementor-widget-button",
  image: "elementor-widget-image",
  iconBox: "elementor-widget-icon-box",
  imageBox: "elementor-widget-image-box",
  iconList: "elementor-widget-icon-list",
  map: "elementor-widget-google_maps",
  beforeAfter: "elementor-widget-shortcode",
  accordion: "elementor-widget-n-accordion",
  carousel: "elementor-widget-n-carousel",
  imageCarousel: "elementor-widget-image-carousel",
  table: "elementor-widget-eael-data-table",
  html: "elementor-widget-html",
  socialIcons: "elementor-widget-social-icons",
  siteLogo: "elementor-widget-theme-site-logo",
  navMenu: "elementor-widget-nav-menu",
  form: "elementor-widget-form",
};

function widgetClass(n: Exclude<Node, Box>) {
  // The extracted classes already carry elementor-widget-<type>; add it only if missing.
  const own = n.cls.split(" ");
  const type = WIDGET_CLASS[n._type];
  return ["elementor-element", `elementor-element-${n._key}`, ...own, "elementor-widget", own.includes(type) ? "" : type].filter(Boolean).join(" ");
}

export function ElementorNodes({ nodes, ctx }: { nodes: Node[]; ctx: Ctx }) {
  return (
    <>
      {nodes.map((n) => (
        <ElementorNode key={n._key} node={n} ctx={ctx} />
      ))}
    </>
  );
}

export function ElementorDocument({ doc, ctx, tag = "div", id }: { doc: ElementorDoc; ctx: Ctx; tag?: "div" | "header" | "footer"; id?: string }) {
  const Tag = tag;
  return (
    <Tag className={doc.cls} data-elementor-type={doc.docType} data-elementor-id={doc.postId} id={id}>
      <ElementorNodes nodes={doc.children} ctx={ctx} />
    </Tag>
  );
}

function ElementorNode({ node, ctx }: { node: Node; ctx: Ctx }) {
  if (node._type === "box") return <BoxEl node={node} ctx={ctx} />;
  // Text and HTML widgets print their markup straight into the widget container, as Elementor does.
  if (node._type === "text" || node._type === "html") {
    const markup = html(node._type === "html" ? iframeHtml(node.html) : node.html);
    return node.bare ? (
      <div className={widgetClass(node)} data-id={node._key} data-element_type="widget" dangerouslySetInnerHTML={markup} />
    ) : (
      <div className={widgetClass(node)} data-id={node._key} data-element_type="widget">
        <div className="elementor-widget-container" dangerouslySetInnerHTML={markup} />
      </div>
    );
  }
  const body = widgetBody(node, ctx);
  return (
    <div className={widgetClass(node)} data-id={node._key} data-element_type="widget">
      {node.bare ? body : <div className="elementor-widget-container">{body}</div>}
    </div>
  );
}

function BoxEl({ node, ctx }: { node: Box; ctx: Ctx }) {
  const cls = `elementor-element elementor-element-${node._key} ${node.cls}${node.sticky ? " elementor-sticky" : ""}`;
  const kids = <ElementorNodes nodes={node.children} ctx={ctx} />;
  return (
    <div className={cls} data-id={node._key} data-element_type="container" data-sticky={node.sticky ? JSON.stringify(node.sticky) : undefined}>
      {node.cls.split(" ").includes("e-con-boxed") ? <div className="e-con-inner">{kids}</div> : kids}
    </div>
  );
}

function widgetBody(n: Exclude<Node, Box>, ctx: Ctx): ReactNode {
  switch (n._type) {
    case "heading":
      return <HeadingEl n={n} />;
    case "text":
    case "html":
      return null;
    case "button":
      return <ButtonEl n={n} />;
    case "image":
      return <ImageEl n={n} ctx={ctx} />;
    case "iconBox":
      return <IconBoxEl n={n} />;
    case "imageBox":
      return <ImageBoxEl n={n} />;
    case "iconList":
      return <IconListEl n={n} />;
    case "map":
      return <MapEl n={n} />;
    case "beforeAfter":
      return <BeforeAfterEl n={n} />;
    case "accordion":
      return <AccordionEl n={n} ctx={ctx} />;
    case "carousel":
      return <CarouselEl n={n} ctx={ctx} />;
    case "imageCarousel":
      return <ImageCarouselEl n={n} />;
    case "table":
      return <TableEl n={n} />;
    case "socialIcons":
      return <SocialEl n={n} />;
    case "siteLogo":
      return <LogoEl n={n} />;
    case "navMenu":
      return <NavMenuEl n={n} ctx={ctx} />;
    case "form":
      return <FormEl n={n} />;
  }
}

function HeadingEl({ n }: { n: Heading }) {
  const Tag = n.tag as "h2";
  const cls = `elementor-heading-title ${n.size ?? "elementor-size-default"}`;
  if (n.href)
    return (
      <Tag className={cls}>
        <a {...linkProps(n.href, n.target)} dangerouslySetInnerHTML={html(n.html)} />
      </Tag>
    );
  return <Tag className={cls} dangerouslySetInnerHTML={html(n.html)} />;
}

function ButtonEl({ n }: { n: Button }) {
  const icon = n.icon ? <span className="elementor-button-icon" dangerouslySetInnerHTML={html(iconHtml(n.icon))} /> : null;
  const text = <span className="elementor-button-text">{n.text}</span>;
  const inner = (
    <span className="elementor-button-content-wrapper">
      {n.iconAfter ? text : icon}
      {n.iconAfter ? icon : text}
    </span>
  );
  return (
    <div className="elementor-button-wrapper">
      {n.href !== undefined ? (
        <a className={n.aCls} id={n.buttonId} {...linkProps(n.href, n.target)}>
          {inner}
        </a>
      ) : (
        <a className={n.aCls} id={n.buttonId} role="button">
          {inner}
        </a>
      )}
    </div>
  );
}

function ImageEl({ n, ctx }: { n: ImageW; ctx: Ctx }) {
  const img = <Img img={n.img} priority={ctx.priority?.has(n._key)} />;
  const linked = n.href ? <a {...linkProps(n.href, n.target)}>{img}</a> : img;
  if (n.caption)
    return (
      <figure className="wp-caption">
        {linked}
        <figcaption className="widget-image-caption wp-caption-text" dangerouslySetInnerHTML={html(n.caption)} />
      </figure>
    );
  return linked;
}

function IconBoxEl({ n }: { n: IconBox }) {
  const Title = (n.titleTag ?? "h3") as "h3";
  const Desc = (n.descTag ?? "p") as "p";
  return (
    <div className="elementor-icon-box-wrapper">
      {n.icon ? (
        <div className="elementor-icon-box-icon">
          {n.href ? (
            <a className="elementor-icon" tabIndex={-1} {...linkProps(n.href)} dangerouslySetInnerHTML={html(iconHtml(n.icon))} />
          ) : (
            <span className="elementor-icon" dangerouslySetInnerHTML={html(iconHtml(n.icon))} />
          )}
        </div>
      ) : null}
      <div className="elementor-icon-box-content">
        {n.title !== undefined ? (
          <Title className="elementor-icon-box-title">
            {n.href ? <a {...linkProps(n.href)} dangerouslySetInnerHTML={html(n.title)} /> : n.titleBare ? <Fragment>{n.title}</Fragment> : <span dangerouslySetInnerHTML={html(n.title)} />}
          </Title>
        ) : null}
        {n.desc !== undefined ? <Desc className="elementor-icon-box-description" dangerouslySetInnerHTML={html(n.desc)} /> : null}
      </div>
    </div>
  );
}

function ImageBoxEl({ n }: { n: ImageBox }) {
  const Title = (n.titleTag ?? "h3") as "h3";
  return (
    <div className="elementor-image-box-wrapper">
      {n.img ? (
        <figure className="elementor-image-box-img">
          {n.href ? (
            <a {...linkProps(n.href)} tabIndex={-1}>
              <Img img={n.img} />
            </a>
          ) : (
            <Img img={n.img} />
          )}
        </figure>
      ) : null}
      {n.title !== undefined || n.desc !== undefined ? (
        <div className="elementor-image-box-content">
          {n.title !== undefined ? (
            n.href ? (
              <Title className="elementor-image-box-title">
                <a {...linkProps(n.href)} dangerouslySetInnerHTML={html(n.title)} />
              </Title>
            ) : (
              <Title className="elementor-image-box-title" dangerouslySetInnerHTML={html(n.title)} />
            )
          ) : null}
          {n.desc !== undefined ? <p className="elementor-image-box-description" dangerouslySetInnerHTML={html(n.desc)} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function IconListEl({ n }: { n: IconList }) {
  return (
    <ul className={`elementor-icon-list-items${n.ulCls ? ` ${n.ulCls}` : ""}`}>
      {n.items.map((it) => {
        const body = (
          <>
            {it.icon ? <span className="elementor-icon-list-icon" dangerouslySetInnerHTML={html(iconHtml(it.icon))} /> : null}
            <span className="elementor-icon-list-text" dangerouslySetInnerHTML={html(it.text)} />
          </>
        );
        return (
          <li key={it._key} className={`elementor-icon-list-item${it.liCls ? ` ${it.liCls}` : ""}`}>
            {it.href ? <a {...linkProps(it.href, it.target)}>{body}</a> : body}
          </li>
        );
      })}
    </ul>
  );
}

function MapEl({ n }: { n: MapW }) {
  return (
    <div className="elementor-custom-embed">
      <iframe loading="lazy" src={n.src} title={n.title} aria-label={n.label} />
    </div>
  );
}

function BeforeAfterEl({ n }: { n: BeforeAfter }) {
  return (
    <div className="elementor-shortcode">
      <div id={n.n} className="twenty20" style={{ width: "100%", clear: "both" }}>
        <div className={`twentytwenty-container ${n.n}`} data-offset={n.offset ?? "0.5"} data-before={n.beforeLabel} data-after={n.afterLabel}>
          <Img img={n.before} />
          <Img img={n.after} />
        </div>
      </div>
    </div>
  );
}

function AccordionEl({ n, ctx }: { n: Accordion; ctx: Ctx }) {
  const TitleTag = (n.titleTag || "div") as "div";
  return (
    <div className="e-n-accordion" aria-label="Accordion. Open links with Enter or Space, close with Escape, and navigate with Arrow Keys" data-max-one={n.settings?.max_items_expended === "one" ? "" : undefined}>
      {n.items.map((it, i) => {
        const id = `e-n-accordion-item-${n._key}-${i}`;
        return (
          <details key={it._key} className="e-n-accordion-item" id={id} open={it.open || undefined}>
            <summary className="e-n-accordion-item-title" data-accordion-index={i + 1} tabIndex={0} aria-expanded={it.open ? "true" : "false"} aria-controls={id}>
              <span className="e-n-accordion-item-title-header">
                <TitleTag className="e-n-accordion-item-title-text" dangerouslySetInnerHTML={html(` ${it.title} `)} />
              </span>
              <span className="e-n-accordion-item-title-icon">
                <span className="e-opened" dangerouslySetInnerHTML={html(iconHtml(n.icons.opened))} />
                <span className="e-closed" dangerouslySetInnerHTML={html(iconHtml(n.icons.closed))} />
              </span>
            </summary>
            <BoxEl node={it.content} ctx={ctx} />
          </details>
        );
      })}
    </div>
  );
}

function CarouselEl({ n, ctx }: { n: Carousel; ctx: Ctx }) {
  return (
    <>
      <div className="e-n-carousel swiper" role="region" aria-roledescription="carousel" aria-label="Carousel" dir="ltr" data-settings={JSON.stringify(carouselSettings(n.settings))}>
        <div className="swiper-wrapper" aria-live={n.ariaLive === "polite" ? "polite" : "off"}>
          {n.slides.map((s, i) => (
            <div key={s._key} className="swiper-slide" data-slide={i + 1} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n.slides.length}`}>
              <BoxEl node={s} ctx={ctx} />
            </div>
          ))}
        </div>
      </div>
      {n.arrows ? (
        <>
          <div className="elementor-swiper-button elementor-swiper-button-prev" role="button" tabIndex={0} aria-label="Previous" dangerouslySetInnerHTML={html(iconHtml(n.arrows.prev))} />
          <div className="elementor-swiper-button elementor-swiper-button-next" role="button" tabIndex={0} aria-label="Next" dangerouslySetInnerHTML={html(iconHtml(n.arrows.next))} />
        </>
      ) : null}
      {n.pagination ? <div className="swiper-pagination" /> : null}
    </>
  );
}

/** Only the settings the carousel script reads. */
function carouselSettings(s?: Record<string, unknown>) {
  if (!s) return {};
  const keys = ["slides_to_show", "slides_to_show_tablet", "slides_to_show_mobile", "slides_to_scroll", "autoplay", "autoplay_speed", "infinite", "speed", "image_spacing_custom", "image_spacing_custom_tablet", "image_spacing_custom_mobile", "pause_on_hover"];
  const out: Record<string, unknown> = {};
  for (const k of keys) if (s[k] !== undefined && s[k] !== "") out[k] = s[k];
  return out;
}

function ImageCarouselEl({ n }: { n: ImageCarousel }) {
  return (
    <div className="elementor-image-carousel-wrapper swiper" role="region" aria-roledescription="carousel" aria-label="Image Carousel" dir="ltr" data-settings={JSON.stringify(carouselSettings(n.settings))}>
      <div className="elementor-image-carousel swiper-wrapper" aria-live="off">
        {n.images.map((img, i) => (
          <div key={img._key} className="swiper-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n.images.length}`}>
            <figure className="swiper-slide-inner">
              <Img img={img} className="swiper-slide-image" />
            </figure>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableEl({ n }: { n: TableW }) {
  const id = n._key;
  return (
    <div className="eael-data-table-wrap" data-table_id={id} id={`eael-data-table-wrapper-${id}`} data-custom_responsive="false">
      <table className="tablesorter eael-data-table center" id={`eael-data-table-${id}`}>
        <thead>
          <tr className="table-header">
            {n.head.map((h, i) => (
              <th key={i}>
                <span className="data-table-header-text" dangerouslySetInnerHTML={html(h)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {n.rows.map((r) => (
            <tr key={r._key}>
              {r.cells.map((c, i) => (
                <td key={i}>
                  <div className="td-content-wrapper">
                    <div className="td-content" dangerouslySetInnerHTML={html(c)} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SocialEl({ n }: { n: SocialIcons }) {
  return (
    <div className="elementor-social-icons-wrapper elementor-grid" role="list">
      {/* The icons are inline blocks spaced by word-spacing, so they need the whitespace the live markup has between them. */}
      {n.items.map((it) => (
        <Fragment key={it._key}>
          {" "}
          <span className="elementor-grid-item" role="listitem">
            <a
              className={`elementor-icon elementor-social-icon elementor-social-icon-${it.network} elementor-repeater-item-${it._key}`}
              href={it.href}
              target="_blank"
              rel="noopener"
              aria-label={it.label || it.network || "Instagram"}
              dangerouslySetInnerHTML={html(`<span class="elementor-screen-only">${it.label}</span>${iconHtml(it.icon)}`)}
            />
          </span>
        </Fragment>
      ))}{" "}
    </div>
  );
}

function LogoEl({ n }: { n: SiteLogo }) {
  return (
    <a href={n.href}>
      <Img img={n.img} />
    </a>
  );
}

/* ---------- Menu ---------- */

const samePath = (a: string, b: string) => a.replace(/\/?$/, "/") === b.replace(/\/?$/, "/");

function isActive(it: MenuItem, path: string): boolean {
  return samePath(it.href, path) || !!it.children?.some((c) => isActive(c, path));
}

function MenuList({ items, n, ctx, mobile, sub }: { items: MenuItem[]; n: NavMenu; ctx: Ctx; mobile: boolean; sub?: boolean }) {
  return (
    <ul className={sub ? "sub-menu elementor-nav-menu--dropdown" : "elementor-nav-menu"} id={sub ? undefined : `${n.ulId.replace(/^menu-\d-/, mobile ? "menu-2-" : "menu-1-")}`}>
      {items.map((it) => {
        const current = samePath(it.href, ctx.path);
        const ancestor = !current && isActive(it, ctx.path);
        const li = [it.liCls, current ? "current-menu-item current_page_item" : "", ancestor ? "current-menu-ancestor current-menu-parent" : ""].filter(Boolean).join(" ");
        const a = [it.aCls, current ? "elementor-item-active" : ""].filter(Boolean).join(" ");
        const isSub = it.aCls.includes("elementor-sub-item");
        const arrow = n.arrowSvg ? `<span class="ast-icon icon-arrow">${n.arrowSvg}</span>` : "";
        const label = escapeHtml(it.label);
        const toggle = it.children ? `<span class="dropdown-menu-toggle ast-header-navigation-arrow" tabindex="${mobile ? -1 : 0}" role="application" aria-expanded="false" aria-label="Menu Toggle">${arrow}</span><span class="sub-arrow">${iconHtml(n.subArrow)}</span>` : "";
        return (
          <li key={it._key} className={li}>
            <a
              href={it.href}
              className={a}
              target={it.target}
              aria-current={current ? "page" : undefined}
              aria-expanded={it.children ? "false" : undefined}
              tabIndex={mobile ? -1 : undefined}
              dangerouslySetInnerHTML={html(`${isSub ? arrow : ""}${label}${toggle}`)}
            />
            {it.children ? <MenuList items={it.children} n={n} ctx={ctx} mobile={mobile} sub /> : null}
          </li>
        );
      })}
    </ul>
  );
}

function NavMenuEl({ n, ctx }: { n: NavMenu; ctx: Ctx }) {
  return (
    <>
      <nav aria-label="Menu" className={n.navCls}>
        <MenuList items={n.items} n={n} ctx={ctx} mobile={false} />
      </nav>
      {n.toggle ? (
        <div className="elementor-menu-toggle" role="button" tabIndex={0} aria-label="Menu Toggle" aria-expanded="false" dangerouslySetInnerHTML={html(iconHtml(n.toggle.open) + iconHtml(n.toggle.close))} />
      ) : null}
      {n.dropCls ? (
        <nav className={n.dropCls} aria-hidden="true">
          <MenuList items={n.items} n={n} ctx={ctx} mobile />
        </nav>
      ) : null}
    </>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- Form (the live Elementor pop-up form) ---------- */

function FormEl({ n }: { n: FormW }) {
  return (
    <form className="elementor-form" method="post" name={n.name} aria-label={n.name} action="#" data-lead-form="">
      <div className="elementor-form-fields-wrapper elementor-labels-above">
        {n.fields.map((f) => {
          const { class: cls, ...rest } = f.attrs;
          const attrs = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k === "for" ? "htmlFor" : k === "tabindex" ? "tabIndex" : k, v === "" && k === "required" ? true : v]));
          return (
            <div key={f._key} className={f.groupCls}>
              {f.label ? (
                <label htmlFor={f.attrs.id} className="elementor-field-label">
                  {f.label}
                </label>
              ) : null}
              {f.tag === "textarea" ? <textarea className={cls} {...attrs} /> : f.tag === "button" ? <button className={cls} {...attrs} dangerouslySetInnerHTML={html(f.button ?? "")} /> : <input className={cls} {...attrs} />}
            </div>
          );
        })}
      </div>
    </form>
  );
}
