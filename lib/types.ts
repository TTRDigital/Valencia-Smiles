/* ==========================================================================
   Content types. Pages are Elementor documents converted to plain data
   (see lib/data/README in the project README): a tree of boxes (Elementor
   containers) and widgets. `_key` is the Elementor element id, so the
   ported Elementor CSS (public/css) keeps matching; `cls` holds the
   element's own Elementor classes (layout options, not content).
   ========================================================================== */

export type Img = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** WordPress image classes (attachment-full size-full wp-image-N). */
  cls?: string;
  sizes?: string;
  title?: string;
};

export type Icon = { svg?: string; img?: Img; i?: string } | null;

type Base = { _key: string; cls: string; bare?: boolean };

export type Sticky = { sticky: string; sticky_on?: string[]; sticky_offset?: number; sticky_offset_tablet?: number; sticky_offset_mobile?: number; sticky_effects_offset?: number };
export type Box = Base & { _type: "box"; children: Node[]; sticky?: Sticky };

export type Heading = Base & { _type: "heading"; tag: string; html: string; size?: string; href?: string; target?: string };
export type Text = Base & { _type: "text"; html: string };
export type Button = Base & {
  _type: "button";
  text: string;
  href?: string;
  target?: string;
  buttonId?: string;
  aCls: string;
  icon?: Icon;
  iconAfter?: boolean;
};
export type ImageW = Base & { _type: "image"; img: Img; href?: string; target?: string; caption?: string };
export type IconBox = Base & {
  _type: "iconBox";
  icon?: Icon;
  title?: string;
  titleTag?: string;
  titleBare?: boolean;
  desc?: string;
  descTag?: string;
  href?: string;
};
export type ImageBox = Base & { _type: "imageBox"; img?: Img; title?: string; titleTag?: string; desc?: string; href?: string };
export type IconListItem = { _key: string; text: string; href?: string; target?: string; icon?: Icon; liCls?: string };
export type IconList = Base & { _type: "iconList"; items: IconListItem[]; ulCls?: string };
export type MapW = Base & { _type: "map"; src: string; title: string; label: string };
export type BeforeAfter = Base & {
  _type: "beforeAfter";
  before: Img;
  after: Img;
  n: string;
  offset?: string;
  beforeLabel?: string;
  afterLabel?: string;
};
export type AccordionItem = { _key: string; title: string; open: boolean; content: Box };
export type Accordion = Base & {
  _type: "accordion";
  items: AccordionItem[];
  icons: { opened: Icon; closed: Icon };
  titleTag: string;
  settings?: Record<string, unknown>;
};
export type Carousel = Base & {
  _type: "carousel";
  slides: Box[];
  ariaLive?: string;
  arrows?: { prev: Icon; next: Icon };
  pagination: boolean;
  settings?: Record<string, unknown>;
};
export type ImageCarousel = Base & { _type: "imageCarousel"; images: (Img & { _key: string })[]; settings?: Record<string, unknown> };
export type TableW = Base & { _type: "table"; head: string[]; rows: { _key: string; cells: string[] }[] };
export type Html = Base & { _type: "html"; html: string };
export type SocialIcons = Base & { _type: "socialIcons"; items: { _key: string; network: string; label: string; href: string; icon: Icon }[] };
export type SiteLogo = Base & { _type: "siteLogo"; img: Img; href: string };
export type MenuItem = { _key: string; label: string; href: string; liCls: string; aCls: string; target?: string; children?: MenuItem[] };
export type NavMenu = Base & {
  _type: "navMenu";
  items: MenuItem[];
  navCls: string;
  ulId: string;
  arrowSvg?: string | null;
  subArrow?: Icon;
  toggle?: { open: Icon; close: Icon } | null;
  dropCls?: string | null;
};
export type FormField = { _key: string; groupCls: string; label: string; tag: string; attrs: Record<string, string>; button?: string | null };
export type FormW = Base & { _type: "form"; name: string; fields: FormField[] };

export type Widget =
  | Heading
  | Text
  | Button
  | ImageW
  | IconBox
  | ImageBox
  | IconList
  | MapW
  | BeforeAfter
  | Accordion
  | Carousel
  | ImageCarousel
  | TableW
  | Html
  | SocialIcons
  | SiteLogo
  | NavMenu
  | FormW;

export type Node = Box | Widget;

export type ElementorDoc = { postId: string; docType: string; cls: string; children: Node[]; popupSettings?: Record<string, unknown> };

export type Seo = { title: string; description: string; ogImage?: string | null };

export type ElementorPage = { slug: string; path: string; seo: Seo; bodyCls: string; doc: ElementorDoc };

export type PlainPage = { slug: string; path: string; id: string; seo: Seo; bodyCls: string; articleCls: string; title: string; html: string };

export type Post = {
  slug: string;
  path: string;
  id: string;
  title: string;
  date: string;
  modified: string;
  dateText: string;
  author: { name: string; slug: string };
  image: Img | null;
  seo: Seo;
  bodyCls: string;
  articleCls: string;
  doc?: ElementorDoc;
  html?: string;
};

export type Chrome = { header: ElementorDoc; footer: ElementorDoc; popups: Record<string, ElementorDoc> };

export type Faq = { question: string; answer: string };
