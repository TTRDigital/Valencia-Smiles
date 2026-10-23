import { defineArrayMember, defineField, defineType } from "sanity";

/*
 * The page builder tree, as converted from the live Elementor pages: boxes
 * (Elementor containers) hold widgets and other boxes. Each item's key is its
 * Elementor element id, and `cls` its Elementor layout classes: both tie the
 * item to the ported CSS, so they are read-only. Text, links and photos are
 * editable; HTML fields accept the same simple HTML the live site used
 * (<strong>, <em>, <br>, <a href="...">, <p>, <ul><li>).
 */

const cls = defineField({ name: "cls", title: "Layout classes", type: "string", readOnly: true, hidden: true });
const bare = defineField({ name: "bare", type: "boolean", hidden: true });
const htmlField = (name: string, title: string, rows = 3) => defineField({ name, title, type: "text", rows });
const link = (name = "href", title = "Link") => defineField({ name, title, type: "string", description: "A page address (/about/), a full web address, tel:, mailto:, or #popup-566 for the appointment pop-up." });
const target = defineField({ name: "target", title: "Open in", type: "string", options: { list: [{ title: "Same tab", value: "" }, { title: "New tab", value: "_blank" }] } });
const icon = defineField({ name: "icon", title: "Icon", type: "elIcon" });

export const WIDGET_TYPES = ["heading", "text", "button", "image", "iconBox", "imageBox", "iconList", "map", "beforeAfter", "accordion", "carousel", "imageCarousel", "table", "html", "socialIcons", "siteLogo", "navMenu", "form"];
const children = (name = "children", title = "Content") =>
  defineField({ name, title, type: "array", of: ["box", ...WIDGET_TYPES].map((t) => defineArrayMember({ type: t })) });

export const elementorTypes = [
  defineType({
    name: "elImage",
    title: "Photo",
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({ name: "alt", title: "Alt text", type: "string", description: "Describe the photo for visitors who cannot see it." }),
      defineField({ name: "src", title: "Built-in file", type: "string", readOnly: true, description: "The photo from the original site, used until a new one is uploaded here." }),
      defineField({ name: "width", type: "number", hidden: true }),
      defineField({ name: "height", type: "number", hidden: true }),
      defineField({ name: "cls", type: "string", hidden: true }),
      defineField({ name: "sizes", type: "string", hidden: true }),
    ],
  }),
  defineType({
    name: "elIcon",
    title: "Icon",
    type: "object",
    fields: [defineField({ name: "svg", title: "Icon name", type: "string", readOnly: true }), defineField({ name: "img", title: "Icon image", type: "elImage" }), defineField({ name: "i", type: "string", hidden: true })],
  }),
  defineType({ name: "box", title: "Box", type: "object", fields: [cls, children()], preview: { select: { c: "cls" }, prepare: ({ c }) => ({ title: "Box", subtitle: c }) } }),
  defineType({
    name: "heading",
    title: "Heading",
    type: "object",
    fields: [htmlField("html", "Heading", 2), defineField({ name: "tag", title: "Level", type: "string", options: { list: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span"] } }), link(), target, defineField({ name: "size", type: "string", hidden: true }), cls, bare],
    preview: { select: { t: "html", tag: "tag" }, prepare: ({ t, tag }) => ({ title: String(t ?? "").replace(/<[^>]+>/g, " "), subtitle: `Heading ${tag ?? ""}` }) },
  }),
  defineType({
    name: "text",
    title: "Text",
    type: "object",
    fields: [htmlField("html", "Text (HTML)", 8), cls, bare],
    preview: { select: { t: "html" }, prepare: ({ t }) => ({ title: String(t ?? "").replace(/<[^>]+>/g, " ").slice(0, 80), subtitle: "Text" }) },
  }),
  defineType({
    name: "button",
    title: "Button",
    type: "object",
    fields: [defineField({ name: "text", title: "Label", type: "string" }), link(), target, icon, defineField({ name: "iconAfter", type: "boolean", hidden: true }), defineField({ name: "aCls", type: "string", hidden: true }), defineField({ name: "buttonId", type: "string", hidden: true }), cls, bare],
    preview: { select: { title: "text", subtitle: "href" } },
  }),
  defineType({ name: "image", title: "Photo", type: "object", fields: [defineField({ name: "img", title: "Photo", type: "elImage" }), link(), target, htmlField("caption", "Caption", 2), cls, bare], preview: { select: { media: "img", title: "img.alt" }, prepare: ({ media, title }) => ({ media, title: title || "Photo" }) } }),
  defineType({
    name: "iconBox",
    title: "Icon box",
    type: "object",
    fields: [icon, htmlField("title", "Title", 2), defineField({ name: "titleTag", type: "string", hidden: true }), defineField({ name: "titleBare", type: "boolean", hidden: true }), htmlField("desc", "Description", 3), defineField({ name: "descTag", type: "string", hidden: true }), link(), cls, bare],
    preview: { select: { title: "title", subtitle: "desc" } },
  }),
  defineType({
    name: "imageBox",
    title: "Photo box",
    type: "object",
    fields: [defineField({ name: "img", title: "Photo", type: "elImage" }), htmlField("title", "Title", 2), defineField({ name: "titleTag", type: "string", hidden: true }), htmlField("desc", "Description", 3), link(), cls, bare],
    preview: { select: { title: "title", subtitle: "desc", media: "img" } },
  }),
  defineType({
    name: "iconList",
    title: "Icon list",
    type: "object",
    fields: [
      defineField({
        name: "items",
        title: "Items",
        type: "array",
        of: [defineArrayMember({ type: "object", name: "iconListItem", fields: [htmlField("text", "Text", 2), link(), target, icon, defineField({ name: "liCls", type: "string", hidden: true })], preview: { select: { title: "text", subtitle: "href" } } })],
      }),
      defineField({ name: "ulCls", type: "string", hidden: true }),
      cls,
      bare,
    ],
    preview: { select: { t: "items.0.text" }, prepare: ({ t }) => ({ title: String(t ?? "List").replace(/<[^>]+>/g, " "), subtitle: "Icon list" }) },
  }),
  defineType({ name: "map", title: "Map", type: "object", fields: [defineField({ name: "src", title: "Google Maps embed address", type: "url" }), defineField({ name: "title", type: "string" }), defineField({ name: "label", type: "string" }), cls, bare] }),
  defineType({
    name: "beforeAfter",
    title: "Before / after",
    type: "object",
    fields: [defineField({ name: "before", type: "elImage" }), defineField({ name: "after", type: "elImage" }), defineField({ name: "n", type: "string", hidden: true }), defineField({ name: "offset", type: "string", hidden: true }), defineField({ name: "beforeLabel", type: "string" }), defineField({ name: "afterLabel", type: "string" }), cls, bare],
    preview: { select: { media: "after" }, prepare: ({ media }) => ({ media, title: "Before / after" }) },
  }),
  defineType({
    name: "accordion",
    title: "Questions (accordion)",
    type: "object",
    fields: [
      defineField({
        name: "items",
        title: "Questions",
        type: "array",
        of: [defineArrayMember({ type: "object", name: "accordionItem", fields: [htmlField("title", "Question", 2), defineField({ name: "open", title: "Open at first", type: "boolean" }), defineField({ name: "content", title: "Answer", type: "box" })], preview: { select: { title: "title" } } })],
      }),
      defineField({ name: "icons", type: "object", hidden: true, fields: [defineField({ name: "opened", type: "elIcon" }), defineField({ name: "closed", type: "elIcon" })] }),
      defineField({ name: "titleTag", type: "string", hidden: true }),
      defineField({ name: "settings", type: "object", hidden: true, fields: [defineField({ name: "max_items_expended", type: "string" })] }),
      cls,
      bare,
    ],
    preview: { select: { t: "items.0.title" }, prepare: ({ t }) => ({ title: String(t ?? "Questions"), subtitle: "Accordion" }) },
  }),
  defineType({
    name: "carousel",
    title: "Carousel",
    type: "object",
    fields: [
      defineField({ name: "slides", title: "Slides", type: "array", of: [defineArrayMember({ type: "box" })] }),
      defineField({ name: "ariaLive", type: "string", hidden: true }),
      defineField({ name: "arrows", type: "object", hidden: true, fields: [defineField({ name: "prev", type: "elIcon" }), defineField({ name: "next", type: "elIcon" })] }),
      defineField({ name: "pagination", type: "boolean", hidden: true }),
      defineField({ name: "settingsJson", title: "Carousel settings", type: "text", rows: 3, hidden: true }),
      cls,
      bare,
    ],
    preview: { prepare: () => ({ title: "Carousel" }) },
  }),
  defineType({
    name: "imageCarousel",
    title: "Photo carousel",
    type: "object",
    fields: [defineField({ name: "images", title: "Photos", type: "array", of: [defineArrayMember({ type: "elImage" })] }), defineField({ name: "settingsJson", type: "text", hidden: true }), cls, bare],
  }),
  defineType({
    name: "table",
    title: "Table",
    type: "object",
    fields: [
      defineField({ name: "head", title: "Column headings", type: "array", of: [defineArrayMember({ type: "string" })] }),
      defineField({ name: "rows", title: "Rows", type: "array", of: [defineArrayMember({ type: "object", name: "tableRow", fields: [defineField({ name: "cells", title: "Cells (HTML)", type: "array", of: [defineArrayMember({ type: "string" })] })] })] }),
      cls,
      bare,
    ],
  }),
  defineType({ name: "html", title: "Embed / HTML", type: "object", fields: [htmlField("html", "HTML", 6), cls, bare] }),
  defineType({
    name: "socialIcons",
    title: "Social icons",
    type: "object",
    fields: [defineField({ name: "items", type: "array", of: [defineArrayMember({ type: "object", name: "socialItem", fields: [defineField({ name: "network", type: "string" }), defineField({ name: "label", type: "string" }), defineField({ name: "href", title: "Link", type: "url" }), icon], preview: { select: { title: "network", subtitle: "href" } } })] }), cls, bare],
  }),
  defineType({ name: "siteLogo", title: "Logo", type: "object", fields: [defineField({ name: "img", type: "elImage" }), link(), cls, bare] }),
  defineType({
    name: "navMenu",
    title: "Menu",
    type: "object",
    fields: [
      defineField({ name: "items", title: "Menu items", type: "array", of: [defineArrayMember({ type: "menuItem" })] }),
      ...["navCls", "ulId", "arrowSvg", "dropCls"].map((n) => defineField({ name: n, type: "string", hidden: true })),
      defineField({ name: "subArrow", type: "elIcon", hidden: true }),
      defineField({ name: "toggle", type: "object", hidden: true, fields: [defineField({ name: "open", type: "elIcon" }), defineField({ name: "close", type: "elIcon" })] }),
      cls,
      bare,
    ],
  }),
  defineType({
    name: "menuItem",
    title: "Menu item",
    type: "object",
    fields: [defineField({ name: "label", type: "string" }), link(), target, defineField({ name: "children", title: "Sub-menu", type: "array", of: [defineArrayMember({ type: "menuItem" })] }), defineField({ name: "liCls", type: "string", hidden: true }), defineField({ name: "aCls", type: "string", hidden: true })],
    preview: { select: { title: "label", subtitle: "href" } },
  }),
  defineType({
    name: "form",
    title: "Form (not used)",
    type: "object",
    fields: [defineField({ name: "name", type: "string" }), defineField({ name: "fieldsJson", type: "text", hidden: true }), cls, bare],
  }),
];

export const elementorDoc = (name = "doc", title = "Page content") =>
  defineField({
    name,
    title,
    type: "object",
    fields: [defineField({ name: "postId", title: "Original page id", type: "string", readOnly: true }), defineField({ name: "docType", type: "string", hidden: true }), defineField({ name: "cls", type: "string", hidden: true }), children("children", "Sections")],
  });
