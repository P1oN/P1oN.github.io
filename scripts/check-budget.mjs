import { readFileSync } from "node:fs";
import { gzipSync, brotliCompressSync } from "node:zlib";
const html = readFileSync(new URL("../dist/index.html", import.meta.url));
const gzip = gzipSync(html, { level: 6 }).length;
console.log(
  `HTML ${html.length} bytes | gzip (6) ${gzip} bytes | Brotli ${brotliCompressSync(html).length} bytes | budget 14000 bytes`,
);
if (gzip > 14000) throw new Error("HTML exceeds 14,000 byte gzip budget");
const widget = '<script defer src="https://p1on.github.io/portfolio-achievements/v1/widget.js" data-manifest="https://p1on.github.io/portfolio-achievements/manifest.json"></script>';
const text = html.toString().replace(widget, "");
if (
  /<(?:script|img|iframe|video|audio|source)\b[^>]*\bsrc\s*=/i.test(text) ||
  /<link\b[^>]*rel=["'](?:stylesheet|preload|modulepreload)["']/i.test(text) ||
  /@import\s|url\(\s*["']?https?:/i.test(text)
)
  throw new Error("Page must not load external rendering resources");
