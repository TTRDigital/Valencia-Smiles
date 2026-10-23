import type { Faq, Node } from "@/lib/types";

/** Plain text of a fragment of page HTML (for schema), entities decoded, whitespace collapsed. */
export function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h\d|div)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#8217;|&rsquo;/g, "’")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(nodes: Node[]): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n._type === "box") n.children.forEach(walk);
    else if (n._type === "text" || n._type === "heading") out.push(plain(n.html));
    else if (n._type === "iconList") n.items.forEach((it) => out.push(plain(it.text)));
  };
  nodes.forEach(walk);
  return out.filter(Boolean).join(" ");
}

/** Questions and answers from a page's accordions, word for word. */
export function accordionFaqs(nodes: Node[]): Faq[] {
  const faqs: Faq[] = [];
  const walk = (n: Node) => {
    if (n._type === "accordion") n.items.forEach((it) => faqs.push({ question: plain(it.title), answer: textOf(it.content.children) }));
    else if (n._type === "box") n.children.forEach(walk);
    else if (n._type === "carousel") n.slides.forEach(walk);
  };
  nodes.forEach(walk);
  return faqs;
}

/**
 * Questions and answers from a blog post's FAQ section: the questions are the
 * headings under the "FAQ" / "Frequently Asked Questions" heading, each answer
 * the text up to the next heading.
 */
export function articleFaqs(html: string): Faq[] {
  const start = html.search(/<h2[^>]*>[^<]*(FAQ|Frequently asked questions)[^<]*<\/h2>/i);
  if (start < 0) return [];
  const rest = html.slice(start).replace(/^<h2[^>]*>[\s\S]*?<\/h2>/i, "");
  const end = rest.search(/<h2[\s>]/i);
  const section = end >= 0 ? rest.slice(0, end) : rest;
  const faqs: Faq[] = [];
  const re = /<h([3-4])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[3-4][\s>]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section))) {
    const question = plain(m[2]);
    const answer = plain(m[3]);
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

/** All text-widget HTML of a document, in order (a post's article body). */
export function docHtml(nodes: Node[]): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n._type === "box") n.children.forEach(walk);
    else if (n._type === "text" || n._type === "html") out.push(n.html);
    else if (n._type === "heading") out.push(`<${n.tag}>${n.html}</${n.tag}>`);
  };
  nodes.forEach(walk);
  return out.join("\n");
}
