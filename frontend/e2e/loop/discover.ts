import * as fs from "node:fs";
import * as path from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
import { setupMockGraphQL } from "./mock-api";
import type { DiscoveredScreen, DiscoveryOutput, StaticRoute, UserRole } from "./types";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const ROUTES_DIR = path.resolve(REPO_ROOT, "frontend/src/routes");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const DISCOVERY_OUTPUT_FILE = path.resolve(__dirname, "discovery.json");

/**
 * Parses TanStack Router file routes under frontend/src/routes/ to static route patterns.
 */
export function scanStaticRoutes(): StaticRoute[] {
  const routes: StaticRoute[] = [];

  function walk(dir: string, prefix = "") {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "__root.tsx") continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(ROUTES_DIR, fullPath);

      if (entry.isDirectory()) {
        walk(fullPath, path.join(prefix, entry.name));
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        // Parse TanStack route pattern
        let routePattern = relativePath
          .replace(/\.tsx?$/, "")
          .replace(/_layout\/?/g, "")
          .replace(/index$/, "")
          .replace(/\./g, "/")
          .replace(/\/+/g, "/");

        if (!routePattern.startsWith("/")) {
          routePattern = "/" + routePattern;
        }
        if (routePattern.length > 1 && routePattern.endsWith("/")) {
          routePattern = routePattern.slice(0, -1);
        }

        const params: string[] = [];
        const paramMatches = routePattern.match(/\$([a-zA-Z0-9_]+)/g);
        if (paramMatches) {
          for (const match of paramMatches) {
            params.push(match.slice(1));
          }
        }

        routes.push({
          routeFile: path.join("frontend/src/routes", relativePath),
          routePattern,
          isDynamic: params.length > 0,
          params,
        });
      }
    }
  }

  walk(ROUTES_DIR);
  return routes;
}

/**
 * Matches a concrete URL pathname against known static route patterns.
 */
export function matchRouteFile(pathname: string, staticRoutes: StaticRoute[]): string {
  const cleanPath = pathname.split("?")[0].split("#")[0] || "/";

  // 1. Exact match
  const exact = staticRoutes.find((r) => r.routePattern === cleanPath);
  if (exact) return exact.routeFile;

  // 2. Pattern match (convert $param to regex)
  for (const route of staticRoutes) {
    if (!route.isDynamic) continue;
    const regexStr =
      "^" +
      route.routePattern
        .replace(/\$([a-zA-Z0-9_]+)/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$";
    const regex = new RegExp(regexStr);
    if (regex.test(cleanPath)) {
      return route.routeFile;
    }
  }

  return "unknown";
}

/**
 * Authenticates a Playwright page with given email and password.
 */
async function authenticateUser(page: Page, email: string, pass: string): Promise<boolean> {
  try {
    await setupMockGraphQL(page);
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector("#email", { timeout: 8000 });
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(pass);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for either dashboard or educator route
    const navigated = await page
      .waitForFunction(() => window.location.pathname !== "/login", { timeout: 4000 })
      .catch(() => false);

    if (!navigated) {
      await page.evaluate(() => {
        window.localStorage.setItem("studed_has_session", "true");
      });
      const dest = email.includes("educator") ? `${BASE_URL}/educator/courses` : `${BASE_URL}/dashboard`;
      await page.goto(dest, { waitUntil: "domcontentloaded" });
    }
    return true;
  } catch (err) {
    console.warn(`[discover] Auth warning for ${email}:`, err);
    return false;
  }
}

/**
 * Dynamically crawls reachable screens for a specific role.
 */
export async function crawlRole(
  browser: Browser,
  role: UserRole,
  credentials: { email: string; pass: string },
  staticRoutes: StaticRoute[],
  maxDepth = 3,
  maxScreens = 25
): Promise<{
  screens: DiscoveredScreen[];
  redirects: Array<{ from: string; to: string }>;
  errors404: string[];
}> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await setupMockGraphQL(page);

  const screens: DiscoveredScreen[] = [];
  const visitedPaths = new Set<string>();
  const redirects: Array<{ from: string; to: string }> = [];
  const errors404: string[] = [];

  const queue: Array<{ path: string; depth: number; parent?: string }> = [];

  // Authenticate
  const authed = await authenticateUser(page, credentials.email, credentials.pass);
  if (!authed) {
    console.warn(`[discover] Failed to authenticate as ${role}. Crawling unauthenticated.`);
    queue.push({ path: "/", depth: 0 });
  } else {
    const initialPath = page.url().replace(BASE_URL, "") || "/";
    queue.push({ path: initialPath, depth: 0 });
    // Also enqueue known key student/educator start points
    if (role === "student") {
      queue.push({ path: "/dashboard", depth: 0 });
      queue.push({ path: "/courses", depth: 0 });
      queue.push({ path: "/courses/science-thinking", depth: 1, parent: "/courses" });
      queue.push({ path: "/waves/science-gears-1", depth: 2, parent: "/courses/science-thinking" });
      queue.push({ path: "/leaderboard", depth: 1, parent: "/dashboard" });
      queue.push({ path: "/achievements", depth: 1, parent: "/dashboard" });
      queue.push({ path: "/subscription", depth: 1, parent: "/dashboard" });
      queue.push({ path: "/settings", depth: 1, parent: "/dashboard" });
    } else if (role === "educator") {
      queue.push({ path: "/educator/courses", depth: 0 });
      queue.push({ path: "/educator/courses/new", depth: 1, parent: "/educator/courses" });
      queue.push({ path: "/educator/leaderboard", depth: 1, parent: "/educator/courses" });
      queue.push({ path: "/educator/settings", depth: 1, parent: "/educator/courses" });
    }
  }

  while (queue.length > 0 && screens.length < maxScreens) {
    const current = queue.shift()!;
    const cleanCurrentPath = current.path.split("?")[0].split("#")[0] || "/";

    if (visitedPaths.has(cleanCurrentPath)) continue;
    visitedPaths.add(cleanCurrentPath);

    try {
      const targetUrl = `${BASE_URL}${cleanCurrentPath}`;
      const response = await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 12000,
      });

      // Brief settling period for React Router & client state
      await page.waitForTimeout(300);

      const finalUrl = page.url();
      const finalPath = finalUrl.replace(BASE_URL, "").split("?")[0].split("#")[0] || "/";

      // Detect redirect
      if (finalPath !== cleanCurrentPath && !visitedPaths.has(finalPath)) {
        redirects.push({ from: cleanCurrentPath, to: finalPath });
      }

      // Detect 404 or Not Found
      const title = await page.title().catch(() => "");
      const is404 =
        response?.status() === 404 ||
        title.toLowerCase().includes("not found") ||
        (await page.locator("text=Wave Not Found, text=Course Not Found, text=404").count().catch(() => 0)) > 0;

      if (is404) {
        errors404.push(cleanCurrentPath);
        continue;
      }

      const routeFile = matchRouteFile(finalPath, staticRoutes);
      screens.push({
        path: finalPath,
        routeFile,
        depth: current.depth,
        title: title || finalPath,
        role,
        parentPath: current.parent,
      });

      // Extract clickable internal links if within depth limit
      if (current.depth < maxDepth) {
        const links = await page
          .locator("a[href]")
          .evaluateAll((elements) =>
            elements
              .map((el) => el.getAttribute("href"))
              .filter((href): href is string => !!href && href.startsWith("/") && !href.startsWith("/api"))
          )
          .catch(() => []);

        for (const link of links) {
          const cleanLink = link.split("?")[0].split("#")[0];
          // Filter out logouts, externals, and already queued
          if (
            cleanLink &&
            cleanLink !== "/logout" &&
            !cleanLink.includes("login") &&
            !visitedPaths.has(cleanLink) &&
            !queue.some((q) => q.path === cleanLink)
          ) {
            queue.push({
              path: cleanLink,
              depth: current.depth + 1,
              parent: finalPath,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[discover] Error visiting ${cleanCurrentPath}:`, err);
    }
  }

  await context.close();
  return { screens, redirects, errors404 };
}

/**
 * Runs the full Phase 0 Discovery engine.
 */
export async function runDiscovery(): Promise<DiscoveryOutput> {
  console.log("[discover] Scanning static routes in frontend/src/routes...");
  const staticRoutes = scanStaticRoutes();
  console.log(`[discover] Found ${staticRoutes.length} static route definitions.`);

  console.log("[discover] Launching Playwright for dynamic crawl...");
  const browser = await chromium.launch({ headless: true });

  try {
    console.log("[discover] Crawling Student journey...");
    const studentCrawl = await crawlRole(
      browser,
      "student",
      { email: "demo.student@studed.lk", pass: "password1234" },
      staticRoutes
    );

    console.log("[discover] Crawling Educator journey...");
    const educatorCrawl = await crawlRole(
      browser,
      "educator",
      { email: "demo.educator@studed.lk", pass: "password1234" },
      staticRoutes
    );

    const output: DiscoveryOutput = {
      timestamp: new Date().toISOString(),
      staticRoutes,
      roles: {
        student: studentCrawl,
        educator: educatorCrawl,
      },
    };

    fs.writeFileSync(DISCOVERY_OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
    console.log(`[discover] Discovery output written to ${DISCOVERY_OUTPUT_FILE}`);
    return output;
  } finally {
    await browser.close();
  }
}

// Standalone CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiscovery()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[discover] Failed:", err);
      process.exit(1);
    });
}
