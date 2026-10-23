import type { SiteSettings } from "@/lib/data/site";
import type { Faq } from "@/lib/types";
import { absoluteUrl, siteUrl } from "@/lib/site";
import { bgUrl } from "@/components/elementor/Img";

const abs = (src: string) => (src.startsWith("http") ? src : absoluteUrl(bgUrl(src)));

/** The one Dentist entity for the whole site: name, address, phone and hours exactly as the site states them. */
export function businessSchema(s: SiteSettings) {
  const groups = new Map<string, string[]>();
  for (const h of s.hours) {
    if (!h.opens || !h.closes) continue;
    const k = `${h.opens}-${h.closes}`;
    groups.set(k, [...(groups.get(k) ?? []), h.day]);
  }
  const digits = s.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${siteUrl}/#dentist`,
    name: s.name,
    url: absoluteUrl("/"),
    telephone: `+1-${digits.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3")}`,
    email: s.email,
    image: abs(s.image.src),
    logo: abs(s.logo.src),
    address: { "@type": "PostalAddress", streetAddress: s.street, addressLocality: s.city, addressRegion: s.region, postalCode: s.postalCode, addressCountry: "US" },
    geo: { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude },
    hasMap: s.mapsUrl,
    openingHoursSpecification: [...groups].map(([k, days]) => {
      const [opens, closes] = k.split("-");
      return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
    }),
    ...(s.social.length ? { sameAs: s.social } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** FAQPage with the questions and answers exactly as they appear on the page. */
export function faqPageSchema(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.filter((f) => f.question && f.answer).map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

export function articleSchema(p: { title: string; description: string; date: string; modified: string; image?: string; path: string; author: string; publisher: string; logo: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    ...(p.description ? { description: p.description } : {}),
    ...(p.image ? { image: [abs(p.image)] } : {}),
    datePublished: p.date,
    dateModified: p.modified,
    author: { "@type": "Person", name: p.author, url: absoluteUrl("/about/") },
    publisher: { "@type": "Organization", name: p.publisher, logo: { "@type": "ImageObject", url: abs(p.logo) } },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(p.path) },
  };
}
