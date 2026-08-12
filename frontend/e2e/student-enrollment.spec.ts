import { expect, test } from "@playwright/test";

test.describe("Student Course Search, Filter, and Enrollment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as student
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should search, filter, enroll, and view course syllabus", async ({ page }) => {
    // 1. Navigate to Course Catalog
    await page.getByRole("link", { name: "Courses", exact: true }).click();
    await expect(page).toHaveURL(/\/courses/);

    // 2. Test Search Functionality
    const searchInput = page.locator("#course-search");
    await expect(searchInput).toBeVisible();

    // Type "Physics" to search
    await searchInput.fill("Physics");

    // Verify only Physics course card is visible, and Mathematics is NOT visible
    const physicsCard = page
      .locator("[data-testid='course-card']")
      .filter({ hasText: "A/L Physics" })
      .first();
    const mathCard = page
      .locator("[data-testid='course-card']")
      .filter({ hasText: "Grade 10 Mathematics" })
      .first();

    await expect(physicsCard).toBeVisible({ timeout: 5000 });
    await expect(mathCard).not.toBeVisible();

    // Clear search
    await searchInput.fill("");
    await expect(mathCard).toBeVisible({ timeout: 5000 });

    // 3. Test Grade Filters
    const filterToggleBtn = page.getByRole("button", { name: /Filter/i });
    await filterToggleBtn.click();

    // Click A/L grade filter chip
    const alFilterBtn = page.getByRole("button", { name: "A/L", exact: true });
    await expect(alFilterBtn).toBeVisible({ timeout: 5000 });
    await alFilterBtn.click();

    // Verify AL Physics is visible, Grade 10 Math is NOT
    await expect(physicsCard).toBeVisible();
    await expect(mathCard).not.toBeVisible();

    // Click "All Grades" to reset grade filter
    const allGradesFilterBtn = page.getByRole("button", { name: "All Grades", exact: true });
    await allGradesFilterBtn.click();
    await expect(mathCard).toBeVisible({ timeout: 5000 });

    // Close filters panel
    await filterToggleBtn.click();

    // 4. Test Course Enrollment Flow
    // Find a G10 course card to enroll/view
    // We must target G10 because of backend business rule: students can only enroll in courses matching their grade level (G10)
    const enrollableG10Card = page
      .locator("[data-testid='course-card']")
      .filter({ hasText: "G10" })
      .first();

    let targetCard = enrollableG10Card;

    // Open the detail sheet for the G10 course
    await expect(targetCard).toBeVisible({ timeout: 10000 });
    await targetCard.click();

    // The detail sheet shows Enroll Free when not enrolled, else Continue Learning
    const enrollBtn = page.getByRole("button", { name: /Enroll Free/i });
    const continueLink = page.getByRole("link", { name: "Continue Learning" });

    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      // Verify Enrolled success toast
      await expect(page.getByText("Enrolled!")).toBeVisible({ timeout: 15000 });
      await expect(continueLink).toBeVisible({ timeout: 10000 });
    } else {
      await expect(continueLink).toBeVisible({ timeout: 10000 });
    }

    // 5. Navigate to Course Details (Syllabus)
    await continueLink.click();

    // Verify redirected to course detail page
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);
    await expect(page.getByRole("button", { name: "Back to Courses" })).toBeVisible({
      timeout: 10000,
    });

    // Verify lessons and waves are shown on the syllabus
    const syllabusCard = page.locator(".overflow-hidden").first();
    await expect(syllabusCard).toBeVisible();
  });
});
