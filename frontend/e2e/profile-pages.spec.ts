import { expect, test } from "@playwright/test";

test.describe("Achievements Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display achievements with badge wall and XP stats", async ({ page }) => {
    // Navigate to achievements
    await page.goto("/achievements");
    await expect(page).toHaveURL(/\/achievements/);

    // Page heading
    await expect(page.getByRole("heading", { name: /achievements/i })).toBeVisible({
      timeout: 10000,
    });

    // Level info should be visible (XP bar / level label)
    await expect(page.getByText(/level|xp|badge/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display student profile settings with user data", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);

    // Settings heading
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({ timeout: 10000 });

    // Profile card with fields
    await expect(page.getByText("Student Profile")).toBeVisible();
    await expect(page.getByText("Full Name")).toBeVisible();
    await expect(page.getByText("Email Address")).toBeVisible();

    // Security card
    await expect(page.getByText("Access & Security")).toBeVisible();
    await expect(page.getByText("Role", { exact: true })).toBeVisible();
  });
});
