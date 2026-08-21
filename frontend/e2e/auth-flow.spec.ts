import { expect, test } from "@playwright/test";
import { setupMockGraphQL } from "./loop/mock-api";

test.describe("Authentication and Authorization Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockGraphQL(page);
  });

  test("should redirect logged-out users from dashboard to login", async ({ page }) => {
    await page.context().clearCookies();
    // Navigate to dashboard — the SPA auth guard will redirect to /login
    await page.goto("/dashboard");
    // Wait up to 15 seconds for the JS-driven redirect to happen
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate to /login when clicking Sign in on the landing page", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    const signInBtn = page.getByRole("link", { name: "Sign in" }).first();
    await expect(signInBtn).toBeVisible({ timeout: 10000 });
    await signInBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should authenticate as student and display student dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");

    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    // The student dashboard is the two-rail layout: search, the widget rail,
    // and the course deck.
    await expect(page.getByPlaceholder("What do you want to learn?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: "User profile menu" })).toBeVisible();
  });

  test("should trigger logout confirmation modal with emotional reactions", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // If Daily Spark modal opened on login, dismiss it
    const exitSpark = page.getByRole("button", { name: "Exit Daily Spark" });
    if (await exitSpark.isVisible({ timeout: 1500 }).catch(() => false)) {
      await exitSpark.click();
    }

    // Open user menu
    const profileBtn = page.getByRole("banner").getByRole("button", { name: "User profile menu" });
    await profileBtn.click();

    // Click Log Out in dropdown
    const logOutItem = page.getByRole("button", { name: "Log Out" });
    await expect(logOutItem).toBeVisible();
    await logOutItem.click();

    // Modal appears with mascot and speech bubble
    await expect(page.getByRole("heading", { name: "Log Out?" })).toBeVisible();
    await expect(page.getByText(/Going somewhere\?/i)).toBeVisible();

    // Hover Cancel -> speech changes to happy "Yay, stay with me!"
    const cancelBtn = page.getByRole("button", { name: "Cancel" });
    await cancelBtn.hover();
    await expect(page.getByText(/Yay, stay with me!/i)).toBeVisible();

    // Hover Log Out -> speech changes to sad "Aww, don't go..."
    const confirmBtn = page.getByRole("button", { name: "Log Out" }).last();
    await confirmBtn.hover();
    await expect(page.getByText(/Aww, don't go\.\.\./i)).toBeVisible();

    // Cancel stays on dashboard
    await cancelBtn.click();
    await expect(page.getByRole("heading", { name: "Log Out?" })).not.toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should authenticate as educator and redirect to educator courses", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");

    await page.locator("#email").fill("demo.educator@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/educator\/courses/);
    await expect(page.getByRole("heading", { name: "My Courses" })).toBeVisible();
  });
});
