import { chromium } from "@playwright/test";
import { setupMockGraphQL } from "./mock-api";
import { runDiscovery } from "./discover";
import { captureScreenSnapshot } from "./snapshot";

async function main() {
  console.log("==========================================");
  console.log("StudEd UX Loop - Phase 0 & Phase 1 Engine Runner");
  console.log("==========================================");

  // 1. Run Phase 0: Discovery
  console.log("\n--- PHASE 0: DISCOVERY ---");
  const discovery = await runDiscovery();

  console.log(`Discovered ${discovery.roles.student.screens.length} Student screens:`);
  for (const s of discovery.roles.student.screens) {
    console.log(`  [depth ${s.depth}] ${s.path} -> ${s.routeFile} ("${s.title}")`);
  }

  console.log(`\nDiscovered ${discovery.roles.educator.screens.length} Educator screens:`);
  for (const s of discovery.roles.educator.screens) {
    console.log(`  [depth ${s.depth}] ${s.path} -> ${s.routeFile} ("${s.title}")`);
  }

  // 2. Run Phase 1: Capture Sample Snapshots
  console.log("\n--- PHASE 1: SNAPSHOT ENGINE (SAMPLE RUN) ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await setupMockGraphQL(page);

  try {
    // Authenticate as student
    console.log("Authenticating as demo.student@studed.lk...");
    await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    const navigated = await page
      .waitForFunction(() => window.location.pathname !== "/login", { timeout: 4000 })
      .catch(() => false);
    if (!navigated) {
      await page.evaluate(() => {
        window.localStorage.setItem("studed_has_session", "true");
      });
      await page.goto("http://localhost:5173/dashboard", { waitUntil: "domcontentloaded" });
    }

    // Capture Student Dashboard (Desktop + Mobile)
    const dashboardScreen = discovery.roles.student.screens.find((s) => s.path === "/dashboard") || {
      path: "/dashboard",
      routeFile: "frontend/src/routes/dashboard.tsx",
      depth: 0,
      title: "Dashboard",
      role: "student" as const,
    };

    console.log("Capturing Student Dashboard (desktop)...");
    const desktopSnap = await captureScreenSnapshot(page, dashboardScreen, "desktop", "default");
    console.log(`Captured ${desktopSnap.styledElements.length} styled elements, ${desktopSnap.linkInventory.length} links, ${desktopSnap.focusOrder.length} focusable items.`);

    console.log("Capturing Student Dashboard (mobile)...");
    const mobileSnap = await captureScreenSnapshot(page, dashboardScreen, "mobile", "default");
    console.log(`Captured mobile fingerprint: ${mobileSnap.styledElements.length} styled elements.`);

    // Capture Course Map (Desktop)
    const courseScreen = discovery.roles.student.screens.find((s) => s.path.includes("science")) || {
      path: "/courses/science-thinking",
      routeFile: "frontend/src/routes/courses.$courseId.tsx",
      depth: 1,
      title: "Scientific Thinking",
      role: "student" as const,
    };

    console.log(`Capturing Science Course Map (${courseScreen.path})...`);
    const courseSnap = await captureScreenSnapshot(page, courseScreen, "desktop", "default");
    console.log(`Captured course map fingerprint: ${courseSnap.styledElements.length} styled elements.`);

    console.log("\nPhase 0 and Phase 1 test run completed successfully!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Runner failed:", err);
  process.exit(1);
});
