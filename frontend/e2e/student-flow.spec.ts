import { expect, test } from "@playwright/test";

test.describe("Student Course Journey Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as student
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should browse courses catalog, view a course, and complete a wave evaluation", async ({
    page,
  }) => {
    // 1. Navigate to Course Catalog
    await page.getByRole("link", { name: "Courses", exact: true }).click();
    await expect(page).toHaveURL(/\/courses/);

    // Verify course cards are visible
    const courseCard = page.locator("div.group").filter({ hasText: "Grade 10 Mathematics" }).first();
    await expect(courseCard).toBeVisible();

    // Wait for the View button to be visible to ensure card actions are fully loaded
    await expect(courseCard.getByRole("link", { name: "View" })).toBeVisible({ timeout: 15000 });

    // Click Enroll if the button is visible (not enrolled yet)
    const enrollButton = courseCard.getByRole("button", { name: "Enroll" });
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await expect(page.getByText("Enrolled!")).toBeVisible({ timeout: 10000 });
    }

    // 2. Click "View" on the course card
    await courseCard.getByRole("link", { name: "View" }).click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);

    // Verify course syllabus details are visible (wait for page transition to finish)
    await expect(page.getByRole("button", { name: "Back to Courses" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Lessons" })).toBeVisible();
    await expect(page.getByText("complete")).toBeVisible();

    // 3. Find first unlocked wave and start it
    const startButton = page.getByRole("button", { name: "Start" }).first();
    await expect(startButton).toBeVisible();
    await startButton.click();
    await expect(page).toHaveURL(/\/waves\/[a-f0-9-]+/);

    // 4. In Wave Player, verify Learn block renders and click "Start Evaluation"
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
    const startEvalButton = page.getByRole("button", { name: "Start Evaluation" });
    await expect(startEvalButton).toBeVisible();
    await startEvalButton.click();

    // 5. Verify the Evaluate tab is active and questions are present
    await expect(page.getByRole("button", { name: "Submit Answers" })).toBeVisible();

    // Answer the first question (type answer or select option)
    const textInput = page.locator("input[placeholder='Type your answer']").first();
    const radioOption = page.locator("input[type='radio']").first();

    if (await textInput.isVisible()) {
      await textInput.fill("test answer");
      await textInput.blur();
    } else if (await radioOption.isVisible()) {
      await radioOption.click();
    }

    // 6. Submit answers
    await page.getByRole("button", { name: "Submit Answers" }).click();

    // Verify results card is displayed (either completed or try again)
    await expect(page.locator("text=Total XP:")).toBeVisible();
  });
});
