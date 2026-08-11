/**
 * Section-level visual audit — captures viewport-sized slices of a route so
 * individual sections can be inspected at readable resolution.
 *
 * Usage: bun run e2e/tools/section.ts <route> <viewport> <theme> [slices]
 *   e.g. bun run e2e/tools/section.ts / mobile light 6
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.SHOOT_BASE_URL ?? "http://localhost:5173";
const [routeArg, vpArg, themeArg, slicesArg] = process.argv.slice(2);
const route = routeArg ?? "/";
const theme = themeArg === "dark" ? "dark" : "light";
const slices = Number(slicesArg ?? 6);

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};
const vp = VIEWPORTS[vpArg ?? "desktop"] ?? VIEWPORTS.desktop;

const slug = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
const OUT = path.resolve(import.meta.dirname, "../../.audit-shots/sections");

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2,
    colorScheme: theme as "light" | "dark",
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
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  const total = await page.evaluate(() => document.body.scrollHeight);

  // Trigger every whileInView reveal before slicing. Skippable: scrolling to the
  // very bottom awards ScrollXpMeter's Explorer badge, whose full-viewport
  // confetti overlay then contaminates shots taken back at the top.
  if (!process.env.SKIP_REVEAL) {
    for (let y = 0; y < total; y += Math.floor(vp.height * 0.75)) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(200);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
  }

  for (let i = 0; i < slices; i++) {
    const y = i * vp.height;
    if (y >= total) break;
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(350);
    const file = path.join(OUT, `${slug}--${vpArg ?? "desktop"}--${theme}--s${i}.png`);
    await page.screenshot({ path: file });
    console.log("shot", path.relative(process.cwd(), file));
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
