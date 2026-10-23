import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Every link is a plain <a> on purpose: pages load in full, like the live site, so
      // public/js/site.js sets up each page's sliders and menus (client-side navigation would skip it).
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // One-off generators run outside the app (see scripts/import/README.md).
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/import/**"]),
]);

export default eslintConfig;
