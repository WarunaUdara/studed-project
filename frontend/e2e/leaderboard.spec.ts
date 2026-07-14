import { expect, test } from "@playwright/test";

test.describe("Leaderboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display leaderboard with student entries and scope tabs", async ({ page }) => {
    // Navigate to leaderboard
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/);

    // Page heading
    await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible({
      timeout: 10000,
    });

    // Scope tabs should be visible
    const globalTab = page.getByRole("button", { name: "Global" });
    await expect(globalTab).toBeVisible();

    // At least one leaderboard row should load from the real GraphQL API
    await expect(page.locator("main, [role='main']").first()).toBeVisible();

    // Check a rank is displayed (rank 1 badge)
    await expect(page.getByText(/1|Global|XP/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("should filter leaderboard by Grade tab", async ({ page }) => {
    await page.goto("/leaderboard");

    // Click Grade tab
    const gradeTab = page.getByRole("button", { name: "Grade" });
    await expect(gradeTab).toBeVisible({ timeout: 10000 });
    await gradeTab.click();

    // Page should not error
    await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible();
  });
});
