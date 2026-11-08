/**
 * Seeds the Sanity project with the content built into the site (lib/data).
 *
 *   npm run seed                 DRY RUN (default): lists what would be created, writes nothing, needs no token
 *   npm run seed -- --apply      creates the missing documents (needs SANITY_WRITE_TOKEN in your shell)
 *
 * Safe by design: documents are created with createIfNotExists, so a document
 * that already exists (edited or not, draft or published) is never overwritten,
 * and nothing is ever deleted. Photos are not uploaded: documents keep the
 * built-in file path until someone uploads a photo in the Studio.
 * The token is read from the environment only; never put it in a file.
 */
import { createClient } from "@sanity/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

type Doc = Record<string, unknown> & { _id: string; _type: string };

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ord9drh8";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apply = process.argv.includes("--apply");
const root = join(import.meta.dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

/** Sanity needs a _key on every object inside an array. */
function addKeys<T>(v: T, path = "k"): T {
  if (Array.isArray(v)) {
    return v.map((x, i) => {
      const y = addKeys(x, `${path}${i}`);
      return y && typeof y === "object" && !Array.isArray(y) && !("_key" in y) ? { _key: `${path}${i}`, ...y } : y;
    }) as T;
  }
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, addKeys(x, `${path}${k[0]}`)])) as T;
  return v;
}

/** Sanity reserves the names "text" and "image": those page-builder widgets are stored as textWidget / imageWidget. */
function renameWidgets<T>(v: T): T {
  if (Array.isArray(v)) return v.map(renameWidgets) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "_type" && (x === "text" || x === "image") ? `${x}Widget` : renameWidgets(x)])) as T;
  }
  return v;
}

// lib/data/site.ts is TypeScript with a few typed exports: pull the object literal out of it.
function settings(): Record<string, unknown> {
  const src = readFileSync(join(root, "lib/data/site.ts"), "utf8");
  const body = /export const fallbackSettings = (\{[\s\S]*?\n\});/.exec(src)![1];
  return new Function(`return (${body})`)();
}

function build(): Doc[] {
  const docs: Doc[] = [];
  const { logo: _logo, image: _image, ...site } = settings();
  docs.push({ _id: "siteSettings", _type: "siteSettings", ...site });
  docs.push({ _id: "layout", _type: "layout", ...read("lib/data/chrome.json") });
  for (const f of readdirSync(join(root, "lib/data/pages")).filter((n) => n.endsWith(".json"))) {
    const p = read(`lib/data/pages/${f}`);
    docs.push({ _id: `page-${String(p.slug).replace(/__/g, ".")}`, _type: "page", ...p });
  }
  for (const p of read("lib/data/plain-pages.json")) docs.push({ _id: `page-${String(p.slug).replace(/__/g, ".")}`, _type: "plainPage", ...p });
  for (const p of read("lib/data/posts.json")) {
    const { slug, image, ...rest } = p;
    docs.push({ _id: `post-${slug}`, _type: "post", slug: { _type: "slug", current: slug }, ...(image ? { image: { _type: "elImage", ...image } } : {}), ...rest });
  }
  return addKeys(renameWidgets(docs));
}

const docs = build();
if (process.env.SEED_DUMP) {
  // Used to test the site against a local mock: writes the documents as JSON and exits.
  (await import("node:fs")).writeFileSync(process.env.SEED_DUMP, JSON.stringify(docs));
  process.exit(0);
}
const byType = new Map<string, number>();
for (const d of docs) byType.set(d._type, (byType.get(d._type) ?? 0) + 1);
console.log(`${apply ? "APPLY" : "DRY RUN"} -> project ${projectId}, dataset ${dataset}`);
console.log([...byType].map(([t, n]) => `${n} ${t}`).join(", "), `(${docs.length} documents)`);

const token = process.env.SANITY_WRITE_TOKEN;
const client = createClient({ projectId, dataset, apiVersion: "2025-02-19", useCdn: false, token, perspective: "raw" });

let existing = new Set<string>();
try {
  existing = new Set(await client.fetch<string[]>(`*[_id in $ids || _id in $drafts]._id`, { ids: docs.map((d) => d._id), drafts: docs.map((d) => `drafts.${d._id}`) }));
} catch (e) {
  console.log(`(could not read existing documents: ${(e as Error).message.split("\n")[0]}; treating all as missing)`);
}
const todo = docs.filter((d) => !existing.has(d._id) && !existing.has(`drafts.${d._id}`));
console.log(`already in Sanity (left alone): ${docs.length - todo.length}; to create: ${todo.length}`);
for (const d of todo) console.log(`  + ${d._type.padEnd(12)} ${d._id}  (${Math.round(JSON.stringify(d).length / 1024)} KB)`);

if (!apply) {
  console.log("\nDry run only. Nothing was written. To write: SANITY_WRITE_TOKEN=<editor token> npm run seed -- --apply");
  process.exit(0);
}
if (!token) {
  console.error("\nSANITY_WRITE_TOKEN is not set in the environment; nothing written.");
  process.exit(1);
}
for (let i = 0; i < todo.length; i += 10) {
  const tx = client.transaction();
  for (const d of todo.slice(i, i + 10)) tx.createIfNotExists(d);
  await tx.commit({ visibility: "async" });
  console.log(`  wrote ${Math.min(i + 10, todo.length)}/${todo.length}`);
}
console.log("Done. Nothing was overwritten or deleted.");
