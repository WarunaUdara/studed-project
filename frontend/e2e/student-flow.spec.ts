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

    // Verify course cards are visible — use data-testid added by the card
    const courseCard = page
      .locator("[data-testid='course-card']")
      .filter({ hasText: "Grade 10 Mathematics" })
      .first();
    await expect(courseCard).toBeVisible({ timeout: 15000 });

    // Wait for the View button to be visible to ensure card actions are fully loaded
    await expect(courseCard.getByRole("link", { name: "View" })).toBeVisible({ timeout: 15000 });

    // Click Enroll if the button is visible (not enrolled yet)
    const enrollButton = courseCard.getByRole("button", { name: /Enroll/i });
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      await expect(page.getByText("Enrolled!")).toBeVisible({ timeout: 10000 });
    }

    // 2. Click "View" or "Continue" on the course card
    const viewLink = courseCard.getByRole("link", { name: /View|Continue/i });
    await expect(viewLink).toBeVisible({ timeout: 10000 });
    await viewLink.click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);

    // Verify course syllabus is visible — wait for the back button
    await expect(page.getByRole("button", { name: "Back to Courses" })).toBeVisible({
      timeout: 15000,
    });

    // The course progress ring shows 'complete' text inside it
    await expect(page.getByText("complete", { exact: true }).first()).toBeVisible();

    // 3. Find first wave link (may be a Start button or a link) - click the wave card directly
    // Use the first Link pointing to /waves/ on this page
    const waveLink = page.locator("a[href*='/waves/']").first();
    await expect(waveLink).toBeVisible({ timeout: 10000 });
    await waveLink.click();
    await expect(page).toHaveURL(/\/waves\/[a-f0-9-]+/);

    // 4. In Wave Player: wait for the page to load (no error state)
    // The wave player renders either the Learn/Evaluate tabs or an error card
    // We wait for the tabs list to be visible — with a longer timeout for API latency
    await expect(page.getByRole("tablist").first()).toBeVisible({ timeout: 20000 });

    // Verify the Learn tab is present
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();

    // Click "Start Evaluation" to move to the Evaluate tab
    const startEvalButton = page.getByRole("button", { name: "Start Evaluation" });
    await expect(startEvalButton).toBeVisible();
    await startEvalButton.click();

    // 5. This wave may already be completed from a prior run against the
    // same seeded backend (waves stay completed across re-runs of this
    // suite) — the player shows a read-only result summary instead of the
    // submit form in that case, so handle both states.
    const submitButton = page.getByRole("button", { name: "Submit Answers" });
    const alreadyCompleted = page.getByText("Total XP:");

    await expect(submitButton.or(alreadyCompleted)).toBeVisible({ timeout: 10000 });

    if (await submitButton.isVisible()) {
      // Answer the first question (text input or radio)
      const textInput = page.locator("input[placeholder='Type your answer']").first();
      const radioOption = page.locator("input[type='radio']").first();

      if (await textInput.isVisible()) {
        await textInput.fill("test answer");
        await textInput.blur();
      } else if (await radioOption.isVisible()) {
        await radioOption.click();
      }

      // 6. Submit answers
      await submitButton.click();
    }

    // 7. Verify results card is displayed
    await expect(alreadyCompleted).toBeVisible({ timeout: 15000 });
  });
});
