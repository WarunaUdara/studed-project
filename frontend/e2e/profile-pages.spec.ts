import { expect, test } from "@playwright/test";
import { setupMockGraphQL } from "./loop/mock-api";

test.describe("Achievements Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockGraphQL(page);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display achievements with badge wall and XP stats", async ({ page }) => {
    // Navigate to achievements
    await page.goto("/achievements");
    await expect(page).toHaveURL(/\/achievements/);

    // Page heading
    await expect(page.getByRole("heading", { name: /What you've earned/i })).toBeVisible({
      timeout: 10000,
    });

    // The catalog comes from the server and includes what is still locked, so
    // the page can show progress without owning the unlock rules. The previous
    // assertion matched /level|xp|badge/ and resolved to a hidden SVG <title>,
    // so it passed without ever looking at an achievement.
    const cards = page.locator("[data-testid^='achievement-']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(8);

    // Locked achievements must render, which is the point of serving the whole
    // catalog. How many are unlocked depends on the seeded student's progress,
    // so the test does not assume a particular one: an earlier version required
    // an unlocked card and failed against a freshly seeded database where every
    // achievement is still locked.
    await expect(page.locator("[data-unlocked='false']").first()).toBeVisible();

    // Every card reports its state, unlocked or not.
    expect(await page.locator("[data-unlocked]").count()).toBe(await cards.count());

    // The tally is over the real catalog, not a hardcoded length.
    await expect(page.getByText(/\d+ of \d+ unlocked/i)).toBeVisible();
  });
});

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockGraphQL(page);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
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
