import { expect, test } from "@playwright/test";

test.describe("Educator Portal UX & Page Navigation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as educator before each test
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.educator@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/educator/, { timeout: 30000 });
  });

  test("should render the educator sidebar layout and navigate between pages", async ({ page }) => {
    // 1. Verify navigation items exist on the desktop sidebar
    // We expect 5 navigation links to be present
    const navItems = ["Dashboard", "My Courses", "Leaderboard", "Achievements", "Settings"];
    for (const label of navItems) {
      await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    // 2. Click Leaderboard and verify route
    await page.getByRole("link", { name: "Leaderboard", exact: true }).click();
    await expect(page).toHaveURL(/\/educator\/leaderboard/);
    await expect(page.getByRole("heading", { name: "Student Rankings" })).toBeVisible();

    // Verify scope buttons
    const globalScope = page.locator("[data-testid='scope-global']");
    const courseScope = page.locator("[data-testid='scope-course']");
    const gradeScope = page.locator("[data-testid='scope-grade']");
    await expect(globalScope).toBeVisible();
    await expect(courseScope).toBeVisible();
    await expect(gradeScope).toBeVisible();

    // Click scope filter and check for content update
    await gradeScope.click();
    await expect(page.getByText("Select Grade")).toBeVisible();

    // 3. Click Achievements and verify route
    await page.getByRole("link", { name: "Achievements", exact: true }).click();
    await expect(page).toHaveURL(/\/educator\/achievements/);
    await expect(page.getByRole("heading", { name: "Gamification Badges" })).toBeVisible();
    await expect(page.getByText("Platform Achievement Badges")).toBeVisible();
    await expect(page.getByText("Gamification Guide")).toBeVisible();

    // 4. Click Settings and verify route
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page).toHaveURL(/\/educator\/settings/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Educator Profile")).toBeVisible();
    await expect(page.getByText("Portal Preferences")).toBeVisible();
  });
});
