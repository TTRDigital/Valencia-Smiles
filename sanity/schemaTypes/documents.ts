import { defineArrayMember, defineField, defineType } from "sanity";
import { elementorDoc } from "./elementor";

const seo = defineField({
  name: "seo",
  title: "Search engines",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Page title", type: "string", description: "Shown in the browser tab and in Google." }),
    defineField({ name: "description", title: "Meta description", type: "text", rows: 3 }),
    defineField({ name: "ogImage", title: "Share image (built-in file)", type: "string", readOnly: true }),
  ],
});
const hidden = (name: string) => defineField({ name, type: "string", hidden: true });

export const documentTypes = [
  defineType({
    name: "siteSettings",
    title: "Site settings",
    type: "document",
    fields: [
      defineField({ name: "name", title: "Practice name", type: "string" }),
      defineField({ name: "legalName", title: "Legal name", type: "string" }),
      defineField({ name: "phone", type: "string" }),
      defineField({ name: "email", type: "string" }),
      defineField({ name: "street", type: "string" }),
      defineField({ name: "city", type: "string" }),
      defineField({ name: "region", title: "State", type: "string" }),
      defineField({ name: "postalCode", title: "ZIP", type: "string" }),
      defineField({ name: "latitude", type: "number" }),
      defineField({ name: "longitude", type: "number" }),
      defineField({ name: "mapsUrl", title: "Google Maps link", type: "url" }),
      defineField({ name: "bookingUrl", title: "Online booking link (Weave)", type: "url" }),
      defineField({
        name: "hours",
        title: "Hours (for search engines)",
        type: "array",
        of: [defineArrayMember({ type: "object", name: "hoursRow", fields: [defineField({ name: "day", type: "string" }), defineField({ name: "opens", type: "string", description: "24-hour, e.g. 08:00; empty = closed" }), defineField({ name: "closes", type: "string" })], preview: { select: { title: "day", o: "opens", c: "closes" }, prepare: ({ title, o, c }) => ({ title, subtitle: o ? `${o}–${c}` : "Closed" }) } })],
      }),
      defineField({ name: "social", title: "Social links", type: "array", of: [defineArrayMember({ type: "url" })] }),
    ],
    preview: { prepare: () => ({ title: "Site settings" }) },
  }),
  defineType({
    name: "layout",
    title: "Header, footer & pop-up",
    type: "document",
    fields: [
      elementorDoc("header", "Header"),
      elementorDoc("footer", "Footer"),
      defineField({ name: "popups", title: "Pop-ups", type: "object", fields: [elementorDoc("p566", "Request Appointment pop-up")] }),
    ],
    preview: { prepare: () => ({ title: "Header, footer & pop-up" }) },
  }),
  defineType({
    name: "page",
    title: "Page",
    type: "document",
    fields: [defineField({ name: "path", title: "Address", type: "string", readOnly: true }), hidden("slug"), seo, elementorDoc(), hidden("bodyCls")],
    preview: { select: { title: "seo.title", subtitle: "path" } },
  }),
  defineType({
    name: "plainPage",
    title: "Text page",
    type: "document",
    fields: [defineField({ name: "path", title: "Address", type: "string", readOnly: true }), hidden("slug"), defineField({ name: "title", type: "string" }), seo, defineField({ name: "html", title: "Text (HTML)", type: "text", rows: 20 }), hidden("id"), hidden("bodyCls"), hidden("articleCls")],
    preview: { select: { title: "title", subtitle: "path" } },
  }),
  defineType({
    name: "post",
    title: "Blog post",
    type: "document",
    fields: [
      defineField({ name: "title", type: "string" }),
      defineField({ name: "slug", type: "slug", options: { source: "title" }, description: "The post's address: /<slug>/" }),
      defineField({ name: "date", title: "Published", type: "datetime" }),
      defineField({ name: "modified", title: "Updated", type: "datetime" }),
      defineField({ name: "dateText", title: "Date as shown", type: "string", description: "e.g. July 24, 2026" }),
      defineField({ name: "author", type: "object", fields: [defineField({ name: "name", type: "string" }), defineField({ name: "slug", type: "string", hidden: true })] }),
      defineField({ name: "image", title: "Banner", type: "elImage" }),
      seo,
      elementorDoc("doc", "Article"),
      defineField({ name: "html", title: "Article (HTML, for posts without the page builder)", type: "text", rows: 20 }),
      hidden("id"),
      hidden("bodyCls"),
      hidden("articleCls"),
    ],
    orderings: [{ title: "Newest", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
    preview: { select: { title: "title", subtitle: "dateText", media: "image" } },
  }),
];

export const singletonTypes = new Set(["siteSettings", "layout"]);
