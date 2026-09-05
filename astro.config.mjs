import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://p1on.github.io",
  output: "static",
  compressHTML: true,
  build: { inlineStylesheets: "always" },
});
