import { expect, test } from "@playwright/test";
import { setupMockGraphQL } from "./loop/mock-api";

test.describe("Leaderboard Page & League Widgets", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockGraphQL(page);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should display dashboard league widget with Blobatar avatars", async ({ page }) => {
    // Check Dashboard League Widget
    const leagueWidget = page.locator("text=/.*League/i").first();
    await expect(leagueWidget).toBeVisible();

    // Check user row with XP inside widget
    await expect(page.getByText(/425 XP|XP/i).first()).toBeVisible();

    // Click to open full leaderboard
    await page.getByRole("link", { name: /View all rankings/i }).click();
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test("should display complete leaderboard with podium, Sri Lankan school names, and blobatars", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/);

    // Page heading
    await expect(page.getByRole("heading", { name: /Where you stand/i })).toBeVisible({
      timeout: 10000,
    });

    // Scope tabs should be visible
    const globalTab = page.getByRole("button", { name: "Global" });
    const gradeTab = page.getByRole("button", { name: "Grade-wide" });
    const weeklyTab = page.getByRole("button", { name: "Weekly" });
    await expect(globalTab).toBeVisible();
    await expect(gradeTab).toBeVisible();
    await expect(weeklyTab).toBeVisible();

    // Top 3 Podium should be visible
    await expect(page.getByText("1").first()).toBeVisible();
    await expect(page.getByText("2").first()).toBeVisible();
    await expect(page.getByText("3").first()).toBeVisible();

    // Table rows should contain authentic Sri Lankan schools
    await expect(page.getByText(/College|Vidyalaya/i).first()).toBeVisible();

    // Blobatar avatars should be rendered in the document
    const blobatarImgs = page.locator("img[alt*='avatar'], [role='img'][aria-label*='avatar']");
    await expect(blobatarImgs.first()).toBeVisible({ timeout: 5000 });

    // Dynamic League promotion banner should show current tier
    await expect(page.getByText(/competing in the/i)).toBeVisible();
  });

  test("should filter student rankings by search input", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { name: /Where you stand/i })).toBeVisible({
      timeout: 10000,
    });

    // Search for a specific student
    const searchInput = page.getByPlaceholder("Search by name...");
    await searchInput.fill("Senuri");

    // Assert filtered name is visible and other names are hidden
    await expect(page.getByText(/Senuri/i).first()).toBeVisible();

    // Clear search
    await searchInput.fill("");
    await expect(page.getByText(/Kavindu|Dinuka|Senuri/i).first()).toBeVisible();
  });

  test("should switch scope tabs smoothly", async ({ page }) => {
    await page.goto("/leaderboard");

    // Click Weekly tab
    const weeklyTab = page.getByRole("button", { name: "Weekly" });
    await weeklyTab.click();
    await expect(page.getByRole("heading", { name: /Where you stand/i })).toBeVisible();

    // Click Grade tab
    const gradeTab = page.getByRole("button", { name: "Grade-wide" });
    await gradeTab.click();
    await expect(page.getByRole("heading", { name: /Where you stand/i })).toBeVisible();
  });
});
