/**
 * Visual audit harness — captures full-page screenshots of routes across
 * viewports and themes into frontend/.audit-shots/.
 *
 * Usage: bun run e2e/tools/shoot.ts [tag]
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.SHOOT_BASE_URL ?? "http://localhost:5173";
const OUT = path.resolve(import.meta.dirname, "../../.audit-shots", process.argv[2] ?? "base");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const ROUTES = [
  { slug: "landing", url: "/" },
  { slug: "login", url: "/login" },
  { slug: "register", url: "/register" },
  { slug: "notfound", url: "/this-route-does-not-exist" },
];

const THEMES = ["light", "dark"] as const;

/**
 * Landing sections reveal via framer-motion `whileInView`, which fires from an
 * IntersectionObserver against the real viewport. A fullPage screenshot alone
 * never triggers them, so scroll the page in viewport-sized steps first; every
 * reveal uses `viewport={{ once: true }}`, so they stay visible afterwards.
 */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const height = await page.evaluate(() => window.innerHeight);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += Math.floor(height * 0.75)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.evaluate(() => document.fonts.ready);
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const consoleIssues: string[] = [];

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        colorScheme: theme,
      });
      await context.addInitScript((t) => {
        localStorage.setItem(
          "studed-ui-prefs",
          JSON.stringify({
            language: "EN",
            theme: t,
            reducedMotion: false,
            leaderboardOptOut: false,
            showRankNotifs: true,
            soundEnabled: false,
          }),
        );
      }, theme);

      const page = await context.newPage();
      page.on("console", (m) => {
        if (m.type() === "error") consoleIssues.push(`[${vp.name}/${theme}] ${m.text()}`);
      });
      page.on("pageerror", (e) =>
        consoleIssues.push(`[${vp.name}/${theme}] PAGEERROR ${e.message}`),
      );

      for (const route of ROUTES) {
        await page.goto(`${BASE}${route.url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        // Re-assert theme class after router hydration.
        await page.evaluate((t) => {
          document.documentElement.classList.toggle("dark", t === "dark");
        }, theme);
        await settle(page);
        const file = path.join(OUT, `${route.slug}--${vp.name}--${theme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log("shot", path.relative(process.cwd(), file));
      }
      await context.close();
    }
  }

  await browser.close();
  if (consoleIssues.length > 0) {
    console.log("\n--- console errors ---");
    for (const i of [...new Set(consoleIssues)]) console.log(i);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
