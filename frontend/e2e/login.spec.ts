import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display branding and login form elements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Sign in to continue your learning journey")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should display validation errors for invalid input values", async ({ page }) => {
    await page.locator("#email").fill("not-an-email");
    await page.locator("#password").fill("123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("should navigate to register page when clicking link", async ({ page }) => {
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
