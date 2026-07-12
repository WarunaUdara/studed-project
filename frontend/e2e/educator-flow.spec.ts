import { expect, test } from "@playwright/test";

test.describe("Educator Portal Course Lifecycle Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as educator before each test
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.educator@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/educator\/courses/, { timeout: 30000 });
  });

  test("should create and publish a new course", async ({ page }) => {
    const timestamp = Date.now();
    const courseTitle = `E2E Test Course ${timestamp}`;

    // Click link to navigate to creation form
    await page.getByRole("link", { name: "New Course" }).click();
    await page.waitForURL(/\/educator\/courses\/new/, { timeout: 15000 });
    await page.locator("#title").waitFor({ state: "visible", timeout: 15000 });

    // Fill out create course form (slug is auto-generated from title)
    await page.locator("#title").fill(courseTitle);
    await page.locator("#description").fill("Automated test course description.");
    await page.locator("#gradeLevel").selectOption("G10");
    await page.locator("#price").fill("1500");

    // Submit form
    await page.getByRole("button", { name: "Create Course" }).click();

    // Verify redirected back to courses page
    await page.waitForURL(/\/educator\/courses$/, { timeout: 15000 });

    // Verify the new draft course is listed
    const courseCard = page.getByTestId("course-card").filter({ hasText: courseTitle });
    await expect(courseCard).toBeVisible({ timeout: 10000 });
    await expect(courseCard.getByText("Draft")).toBeVisible();

    // Publish the course
    await courseCard.getByRole("button", { name: "Publish" }).click();

    // Verify course state updates to Published and Publish button disappears
    await expect(courseCard.getByText("Published")).toBeVisible({ timeout: 10000 });
    await expect(courseCard.getByRole("button", { name: "Publish" })).not.toBeVisible();
  });
});
