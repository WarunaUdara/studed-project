import { expect, test } from "@playwright/test";

test.describe("Student Course Search, Filter, and Enrollment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as student
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
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
    const physicsCard = page.locator("[data-testid='course-card']").filter({ hasText: "A/L Physics" }).first();
    const mathCard = page.locator("[data-testid='course-card']").filter({ hasText: "Grade 10 Mathematics" }).first();
    
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
      .filter({ has: page.getByRole("button", { name: /Enroll Free/i }) })
      .first();

    const enrolledG10Card = page
      .locator("[data-testid='course-card']")
      .filter({ hasText: "G10" })
      .filter({ has: page.getByRole("link", { name: /View|Continue/i }) })
      .first();

    let targetCard = enrolledG10Card;

    if (await enrollableG10Card.isVisible()) {
      targetCard = enrollableG10Card;
      const enrollBtn = enrollableG10Card.getByRole("button", { name: /Enroll Free/i });
      await enrollBtn.click();
      
      // Verify Enrolled success toast
      await expect(page.getByText("Enrolled!")).toBeVisible({ timeout: 15000 });
    } else {
      console.log("No new G10 courses to enroll. Using an already enrolled G10 course.");
    }

    // 5. Navigate to Course Details (Syllabus)
    const viewBtn = targetCard.getByRole("link", { name: /View|Continue/i });
    await expect(viewBtn).toBeVisible({ timeout: 10000 });
    await viewBtn.click();

    // Verify redirected to course detail page
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);
    await expect(page.getByRole("button", { name: "Back to Courses" })).toBeVisible({ timeout: 10000 });
    
    // Verify lessons and waves are shown on the syllabus
    const syllabusCard = page.locator(".overflow-hidden").first();
    await expect(syllabusCard).toBeVisible();
  });
});
