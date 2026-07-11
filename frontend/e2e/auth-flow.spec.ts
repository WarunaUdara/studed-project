import { expect, test } from "@playwright/test";

test.describe("Authentication and Authorization Flow", () => {
  test("should redirect logged-out users from dashboard to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should authenticate as student and display student dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");

    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Continue Learning" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Level Progress" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("should authenticate as educator and redirect to educator courses", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");

    await page.locator("#email").fill("demo.educator@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/educator\/courses/);
    await expect(page.getByRole("heading", { name: "My Courses" })).toBeVisible();
  });
});
