import type { StructureResolver } from "sanity/structure";
import { Cog, FileText, LayoutTemplate, Newspaper, ScrollText } from "lucide-react";

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string, icon: React.ComponentType) =>
  S.listItem().title(title).id(type).icon(icon).child(S.document().schemaType(type).documentId(type).title(title));

/** Sidebar: Settings, Header & footer, Pages, Text pages, Blog posts. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Valencia Smile Expert")
    .items([
      singleton(S, "siteSettings", "Site settings", Cog),
      singleton(S, "layout", "Header, footer & pop-up", LayoutTemplate),
      S.divider(),
      S.listItem().title("Pages").icon(FileText).child(S.documentTypeList("page").title("Pages").defaultOrdering([{ field: "path", direction: "asc" }])),
      S.listItem().title("Text pages").icon(ScrollText).child(S.documentTypeList("plainPage").title("Text pages")),
      S.listItem().title("Blog posts").icon(Newspaper).child(S.documentTypeList("post").title("Blog posts").defaultOrdering([{ field: "date", direction: "desc" }])),
    ]);
