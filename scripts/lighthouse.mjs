import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: [
    "--headless",
    "--no-sandbox",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});
try {
  const result = await lighthouse("http://127.0.0.1:4321/", {
    port: chrome.port,
    output: ["json", "html"],
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  });
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/lighthouse.json", result.report[0]);
  writeFileSync("test-results/lighthouse.html", result.report[1]);
  console.log(
    Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, value]) => [
        key,
        value.score,
      ]),
    ),
  );
  console.log(
    Object.fromEntries(
      [
        "first-contentful-paint",
        "largest-contentful-paint",
        "speed-index",
        "total-blocking-time",
        "cumulative-layout-shift",
      ].map((key) => [key, result.lhr.audits[key].displayValue]),
    ),
  );
} finally {
  await chrome.kill();
}
