/**
 * Playwright global setup — pre-warms Vite's lazy-compiled routes before tests begin.
 * Without this, the first E2E test that hits a heavy route (e.g. Puck editor) can
 * time out waiting for Vite to transform and cache the module graph.
 */
import { chromium } from "@playwright/test";

export default async function globalSetup() {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

  // Routes to pre-warm (heaviest first)
  const routes = [
    "/login",
    "/register",
    "/courses",
    "/educator/courses",
    "/educator/courses/new",
    "/dashboard",
  ];

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const route of routes) {
    try {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch {
      // Non-fatal: warmup failures don't block tests
    }
  }

  await browser.close();
}
