import { expect, test } from "@playwright/test";

test.describe("E2E Student Registration, Enrollment, and Wave Completion Flow", () => {
  test("should register a new A/L student, enroll in Physics, complete Newton's Laws wave, and check XP", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const studentEmail = `al.student.${timestamp}@studed.lk`;
    const studentName = `AL Student ${timestamp}`;

    // 1. Register a new student
    await page.context().clearCookies();
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);

    await page.locator("#fullName").fill(studentName);
    await page.locator("#email").fill(studentEmail);
    await page.locator("#password").fill("password123");
    await page.locator("#grade").selectOption("AL");

    // Submit registration
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Verify student is initialized with 0 XP
    const initialXpBadge = page.getByText("0 XP").first();
    await expect(initialXpBadge).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Courses catalog
    await page.getByRole("link", { name: "Courses", exact: true }).click();
    await expect(page).toHaveURL(/\/courses/);

    // Search for Physics
    const searchInput = page.locator("#course-search");
    await searchInput.fill("Physics");

    // Locate the A/L Physics card
    const physicsCard = page
      .locator("[data-testid='course-card']")
      .filter({ hasText: "A/L Physics" })
      .first();
    await expect(physicsCard).toBeVisible({ timeout: 5000 });

    // Enroll in the course
    const enrollBtn = physicsCard.getByRole("button", { name: /Enroll Free/i });
    await expect(enrollBtn).toBeVisible({ timeout: 5000 });
    await enrollBtn.click();

    // Verify enrolled toast and view/continue changes
    await expect(page.getByText("Enrolled!")).toBeVisible({ timeout: 10000 });

    // Click View/Continue
    const viewBtn = physicsCard.getByRole("link", { name: /View|Continue/i });
    await viewBtn.click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);

    // 3. Open the Newton's Laws wave
    const waveLink = page
      .locator("a[href*='/waves/']")
      .filter({ hasText: "Newton's Laws" })
      .first();
    await expect(waveLink).toBeVisible({ timeout: 10000 });
    await waveLink.click();
    await expect(page).toHaveURL(/\/waves\/[a-f0-9-]+/);

    // 4. In Wave Player, check Learn block and proceed to Evaluation
    await expect(page.getByRole("tablist").first()).toBeVisible({ timeout: 15000 });

    // Verify Learn tab is present
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();

    // Click "Start Evaluation"
    const startEvalBtn = page.getByRole("button", { name: "Start Evaluation" });
    await expect(startEvalBtn).toBeVisible();
    await startEvalBtn.click();

    // 5. Verify Quiz Questions and answer "Law of inertia"
    await expect(page.getByRole("button", { name: "Submit Answers" })).toBeVisible({
      timeout: 10000,
    });

    // Click the correct radio option for Newton's first law
    const correctOptionLabel = page.locator("label").filter({ hasText: "Law of inertia" }).first();
    await expect(correctOptionLabel).toBeVisible({ timeout: 5000 });
    await correctOptionLabel.click();

    // Submit answers
    await page.getByRole("button", { name: "Submit Answers" }).click();

    // 6. Verify Results Card and XP Increase
    // Newton's Laws wave reward is 100 XP
    await expect(page.getByText("Total XP:")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("100%")).toBeVisible();

    // Verify navigation XP badge has updated to 100 XP
    const updatedXpBadge = page.getByText("100 XP").first();
    await expect(updatedXpBadge).toBeVisible({ timeout: 10000 });

    // 7. Verify leaderboard has updated for the user
    await page.getByRole("link", { name: "Leaderboard", exact: true }).click();
    await expect(page).toHaveURL(/\/leaderboard/);

    const userLeaderboardRow = page.locator("main, [role='main']").getByText(studentName).first();
    await expect(userLeaderboardRow).toBeVisible({ timeout: 10000 });
  });
});
