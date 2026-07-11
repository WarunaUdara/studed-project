/**
 * Playwright global setup — pre-warms Vite's lazy-compiled routes before tests begin.
 * Logs in as both educator and student to ensure protected routes are fully loaded
 * and compiled by Vite, preventing cold-start timeouts.
 */
import { chromium } from "@playwright/test";

export default async function globalSetup() {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Warm up public routes
    for (const route of ["/login", "/register"]) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    }

    // 2. Log in as educator and warm up educator routes
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.locator("#email").fill("demo.educator@studed.lk").catch(() => {});
    await page.locator("#password").fill("password123").catch(() => {});
    await page.getByRole("button", { name: "Sign in" }).click().catch(() => {});
    
    // Wait for the main educator page to load
    await page.waitForURL(/\/educator\/courses/, { timeout: 15000 }).catch(() => {});

    // Now visit all educator routes so Vite compiles them
    const educatorRoutes = [
      "/educator/courses",
      "/educator/courses/new",
    ];
    for (const route of educatorRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    }

    // 3. Clear cookies, log in as student, and warm up student routes
    await context.clearCookies();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.locator("#email").fill("demo.student@studed.lk").catch(() => {});
    await page.locator("#password").fill("password123").catch(() => {});
    await page.getByRole("button", { name: "Sign in" }).click().catch(() => {});
    
    await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {});

    const studentRoutes = [
      "/dashboard",
      "/courses",
    ];
    for (const route of studentRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    }
  } catch (err) {
    console.warn("Global warmup warning:", err);
  } finally {
    await browser.close();
  }
}
