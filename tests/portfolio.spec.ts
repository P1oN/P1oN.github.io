import { test, expect } from "@playwright/test";
for (const width of [360, 768, 1440])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${width}px ${colorScheme}: self-contained and readable`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        colorScheme,
      });
      const page = await context.newPage();
      const requests: string[] = [],
        errors: string[] = [];
      page.on("request", (request) => requests.push(request.url()));
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://127.0.0.1:4321");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Thoughtful interfaces.",
      );
      await expect(
        page.getByRole("button", {
          name: `Switch to ${colorScheme === "dark" ? "light" : "dark"} theme`,
        }),
      ).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(
        page.getByRole("link", { name: "borispion@gmail.com" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(requests.filter(url => !url.startsWith("https://p1on.github.io/portfolio-achievements/"))).toEqual(["http://127.0.0.1:4321/"]);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: `test-results/portfolio-${width}-${colorScheme}.png`,
        fullPage: true,
      });
      await context.close();
    });
  }
test("theme follows system, then preserves explicit choice", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
  await page.getByRole("button").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();
});
test("blocked storage still allows switching", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage denied");
      },
    }),
  );
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("without JavaScript content and native navigation work", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4321");
  await expect(page.getByRole("button")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Demo Registry Widget" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Contact" })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(17, 24, 21)");
  await context.close();
});
test("keyboard skip link, anchors, metadata, and enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  const missing = await page
    .locator('a[href^="#"]')
    .evaluateAll(
      (links) =>
        links.filter(
          (link) =>
            !document.getElementById(link.getAttribute("href")!.slice(1)),
        ).length,
    );
  expect(missing).toBe(0);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://p1on.github.io/",
  );
  await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>(
      "h1,h2,h3,p,a,button",
    ))
      el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`;
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
