import { expect, test } from "@playwright/test";

/**
 * The student dashboard was rebuilt as a two-rail layout: search and widgets on
 * the left, the course deck on the right. These tests cover what it offers now.
 * The curriculum tracker, the dashboard Pomodoro card and the gamification tab
 * strip were removed from this screen in the redesign; the Pomodoro survives as
 * an app-wide floating widget behind a user preference, which is covered where
 * that preference is set rather than here.
 */
test.describe("Student Dashboard UX & Flow Simulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should render the search rail and the widget stack", async ({ page }) => {
    const search = page.getByPlaceholder("What do you want to learn?");
    await expect(search).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask" })).toBeVisible();

    // The league widget sits in the left rail and links onward to the full table.
    await expect(page.getByText("View all rankings")).toBeVisible();
  });

  test("should open the ask modal from the dashboard search", async ({ page }) => {
    const search = page.getByPlaceholder("What do you want to learn?");
    await search.fill("fractions");
    await page.getByRole("button", { name: "Ask" }).click();

    // The modal takes over with the typed query carried into it.
    const dialog = page.getByRole("dialog", { name: "Search lessons and ask a question" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder("Search lessons, waves, or courses...")).toHaveValue(
      "fractions",
    );
  });

  test("should reach the course catalog from the dashboard", async ({ page }) => {
    await page.getByRole("link", { name: "Courses", exact: true }).first().click();
    await expect(page).toHaveURL(/\/courses/);
    await expect(page.getByRole("heading", { name: "Learning Paths" })).toBeVisible();
  });
});
