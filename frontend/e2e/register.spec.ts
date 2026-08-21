import { expect, test } from "@playwright/test";

test.describe("Register Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("should display branding and registration form elements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(
      page.getByText("Start your learning journey and claim your starter rewards"),
    ).toBeVisible();
    await expect(page.locator("#fullName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#grade")).toBeVisible();
    await expect(page.locator("#preferredLanguage")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("should display validation errors for invalid fields", async ({ page }) => {
    await page.locator("#fullName").fill("A");
    await page.locator("#email").fill("invalid-email");
    await page.locator("#password").fill("123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Full name must be at least 2 characters")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("should navigate to login page when clicking link", async ({ page }) => {
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
