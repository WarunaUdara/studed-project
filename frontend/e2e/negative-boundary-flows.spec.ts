import { expect, test } from "@playwright/test";

test.describe("Negative & Boundary Flow Simulations", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should reject login with wrong password and display error message", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Verify user remains on login page and error toast or message is shown
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("That email or password doesn't match our records.")).toBeVisible();
  });

  test("should enforce client-side validation on empty registration form", async ({ page }) => {
    await page.goto("/register");

    // Click Register without filling inputs
    await page.getByRole("button", { name: "Create account" }).click();

    // Assert URL remains /register
    await expect(page).toHaveURL(/\/register/);
  });

  test("should redirect unauthenticated users attempting to access educator routes", async ({
    page,
  }) => {
    await page.goto("/educator/courses");

    // Assert auto-redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect student trying to access educator portal back to student dashboard", async ({
    page,
  }) => {
    // 1. Log in as student
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Try navigating to educator area
    await page.goto("/educator/courses");

    // Assert student is blocked / redirected away from educator courses
    await expect(page).not.toHaveURL(/\/educator\/courses/);
  });
});
