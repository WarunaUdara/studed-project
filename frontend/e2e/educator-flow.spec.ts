import { expect, test } from "@playwright/test";

test.describe("Educator Portal Course Lifecycle Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as educator before each test
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.educator@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/educator/, { timeout: 30000 });
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

    // Verify course state updates to Live and Publish button disappears
    await expect(courseCard.getByText("Live").first()).toBeVisible({ timeout: 10000 });
    await expect(courseCard.getByRole("button", { name: "Publish" })).not.toBeVisible();

    // Open the course detail page, then drill down through lesson -> wave to
    // reach the Puck editor. Each of these is a nested route that requires
    // its parent to render an <Outlet /> — a regression here previously
    // caused every level to silently keep showing the parent's own content
    // instead of navigating.
    await courseCard.getByRole("link", { name: "Manage" }).click();
    await expect(page.getByRole("heading", { name: courseTitle })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Add Lesson" }).click();
    const lessonTitle = `E2E Lesson ${timestamp}`;
    await page.locator("#lesson-title").fill(lessonTitle);
    await page.getByRole("button", { name: "Create Lesson" }).click();
    await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 10000 });

    await page.getByText(lessonTitle).click();
    await expect(page.getByRole("heading", { name: lessonTitle })).toBeVisible({ timeout: 10000 });
    // This heading only exists on the lesson detail page, not the course
    // page — confirms the nested route actually rendered.
    await expect(page.getByText("Lesson Details")).toBeVisible();

    await page.getByRole("button", { name: "Add Wave" }).click();
    const waveTitle = `E2E Wave ${timestamp}`;
    await page.locator("#wave-title").fill(waveTitle);
    await page.getByRole("button", { name: "Create Wave" }).click();
    await expect(page.getByText(waveTitle)).toBeVisible({ timeout: 10000 });

    await page.getByText(waveTitle).click();
    await expect(page.getByRole("heading", { name: waveTitle })).toBeVisible({ timeout: 15000 });
    // The Puck editor's block palette only renders once the lazy-loaded
    // editor chunk has mounted — confirms both the nested route and the
    // dynamic import resolved.
    await expect(page.getByText("TextBlock").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Save Content" })).toBeVisible();
  });
});
