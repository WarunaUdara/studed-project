import { expect, test } from "@playwright/test";
import { setupMockGraphQL } from "./loop/mock-api";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockGraphQL(page);
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

  test("should execute full forgot password recovery and reset workflow", async ({ page }) => {
    // 1. Click Forgot Password
    const forgotBtn = page.getByRole("button", { name: "Forgot password?" });
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // 2. Request Recovery Screen
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByText("Enter your registered email address")).toBeVisible();

    const emailInput = page.locator("#recoveryEmail");
    await emailInput.fill("student.recovery@studed.lk");
    await page.getByRole("button", { name: "Send recovery link" }).click();

    // 3. Check Inbox Screen
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByText("student.recovery@studed.lk")).toBeVisible();

    // 4. Navigate to Code & Password Reset
    await page.getByRole("button", { name: "Enter 6-digit code & new password" }).click();
    await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible();

    await page.locator("#recoveryCode").fill("982341");
    await page.locator("#newPassword").fill("newSecurePass123!");
    await page.locator("#confirmPassword").fill("newSecurePass123!");
    await page.getByRole("button", { name: "Update password" }).click();

    // 5. Returned to login with success alert
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Password reset successfully! You can now sign in.")).toBeVisible();
  });
});
