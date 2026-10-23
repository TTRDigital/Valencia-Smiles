import "server-only";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

/** Content hash for a file in public/, so it can be cached for a year (.htaccess) and still update on every deploy. */
export function assetUrl(file: string) {
  const hash = createHash("md5").update(readFileSync(path.join(process.cwd(), "public", file))).digest("hex").slice(0, 8);
  return `/${file}?v=${hash}`;
}
