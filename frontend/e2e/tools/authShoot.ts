/**
 * Authenticated visual audit — logs in through the real UI and captures the
 * protected surface, which ProtectedRoute otherwise redirects to /login.
 *
 * Requires the backend stack (make dev-up) and the dev server on :5173.
 *
 * Usage: bun run e2e/tools/authShoot.ts <student|educator> <viewport> <theme>
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { type Browser, chromium, type Page } from "@playwright/test";

const BASE = process.env.SHOOT_BASE_URL ?? "http://localhost:5173";
const OUT = path.resolve(import.meta.dirname, "../../.audit-shots/auth");

const [roleArg, vpArg, themeArg] = process.argv.slice(2);
const role = roleArg === "educator" ? "educator" : "student";
const theme = themeArg === "dark" ? "dark" : "light";

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
const vp = VIEWPORTS[vpArg ?? "desktop"] ?? VIEWPORTS.desktop;

const CREDENTIALS = {
  student: { email: "demo.student@studed.lk", password: "password1234" },
  educator: { email: "demo.educator@studed.lk", password: "password1234" },
};

// Real IDs from the seeded demo database.
const COURSE_ID = "2445b2d1-ca7e-4048-b845-87d1d533d37d";
const WAVE_ID = "da233300-dcdf-41ce-8b60-9ed8f804a40e";

const ROUTES: Record<string, { slug: string; url: string }[]> = {
  student: [
    { slug: "dashboard", url: "/dashboard" },
    { slug: "courses", url: "/courses" },
    { slug: "course-detail", url: `/courses/${COURSE_ID}` },
    { slug: "wave-player", url: `/waves/${WAVE_ID}` },
    { slug: "leaderboard", url: "/leaderboard" },
    { slug: "achievements", url: "/achievements" },
    { slug: "settings", url: "/settings" },
    { slug: "subscription", url: "/subscription" },
  ],
  educator: [
    { slug: "edu-home", url: "/educator" },
    { slug: "edu-courses", url: "/educator/courses" },
    { slug: "edu-course-new", url: "/educator/courses/new" },
    { slug: "edu-course-detail", url: `/educator/courses/${COURSE_ID}` },
    { slug: "edu-leaderboard", url: "/educator/leaderboard" },
    { slug: "edu-achievements", url: "/educator/achievements" },
    { slug: "edu-settings", url: "/educator/settings" },
  ],
};

async function login(page: Page): Promise<boolean> {
  const { email, password } = CREDENTIALS[role];
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  try {
    await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

async function settle(page: Page, height: number): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += Math.floor(height * 0.75)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser: Browser = await chromium.launch();
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
  const issues: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") issues.push(`CONSOLE ${m.text()}`);
  });
  page.on("pageerror", (e) => issues.push(`PAGEERROR ${e.message}`));

  if (!(await login(page))) {
    console.error(`login failed for ${role}; aborting`);
    await browser.close();
    process.exit(1);
  }
  console.log(`logged in as ${role}, landed on ${new URL(page.url()).pathname}`);

  for (const route of ROUTES[role]) {
    await page.goto(`${BASE}${route.url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await settle(page, vp.height);
    const landed = new URL(page.url()).pathname;
    const redirected = landed !== route.url ? ` (redirected -> ${landed})` : "";
    const file = path.join(OUT, `${route.slug}--${vpArg ?? "desktop"}--${theme}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("shot", path.relative(process.cwd(), file) + redirected);
  }

  await browser.close();
  if (issues.length > 0) {
    console.log("\n--- console issues ---");
    for (const i of [...new Set(issues)].slice(0, 25)) console.log(i);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
