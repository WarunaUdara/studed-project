import { expect, test } from "@playwright/test";

test.describe("Student Dashboard UX & Flow Simulation", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as student
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should render the curriculum tracker and allow switching modes", async ({ page }) => {
    // 1. Verify Curriculum & Exam Tracker Card is visible
    await expect(page.getByText("Curriculum & Exam Tracker")).toBeVisible();
    await expect(page.getByText("G.C.E. O/L Examination")).toBeVisible();

    // 2. Select Global Curriculum and verify state update
    const slButton = page.locator("[data-testid='curriculum-local']");
    const globalButton = page.locator("[data-testid='curriculum-global']");

    await expect(slButton).toBeVisible();
    await expect(globalButton).toBeVisible();

    // Click Global
    await globalButton.click();
    await expect(page.getByText("Target: UK Pearson/Edexcel")).toBeVisible();

    // Click local back
    await slButton.click();
    await expect(page.getByText("Target: SL Syllabus")).toBeVisible();
  });

  test("should render the Pomodoro timer and allow starting focus blocks", async ({ page }) => {
    // 1. Verify Focus Timer elements
    await expect(page.getByText("Focus Session Hub")).toBeVisible();
    await expect(page.locator("[data-testid='pomodoro-time']")).toBeVisible();

    // 2. Fill task field
    const taskInput = page.locator("[data-testid='pomodoro-task-input']");
    await expect(taskInput).toBeVisible();
    await taskInput.fill("Solving algebraic equations");
    await expect(taskInput).toHaveValue("Solving algebraic equations");

    // 3. Play/Pause toggle
    const playButton = page.locator("[data-testid='pomodoro-play-pause']");
    await expect(playButton).toContainText("Start");
    await playButton.click();
    await expect(playButton).toContainText("Pause");

    // 4. Reset timer
    const resetButton = page.locator("[data-testid='pomodoro-reset']");

    // Set up dialog handler to accept the confirmation dialog
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    await resetButton.click();
    await expect(playButton).toContainText("Start");
  });

  test("should toggle between gamification tabs inside the Hub card", async ({ page }) => {
    // 1. Verify Gamification Hub Card
    await expect(page.getByText("Gamification Hub")).toBeVisible();

    const tabStats = page.locator("[data-testid='tab-stats']");
    const tabBadges = page.locator("[data-testid='tab-badges']");
    const tabTimeline = page.locator("[data-testid='tab-timeline']");

    await expect(tabStats).toBeVisible();
    await expect(tabBadges).toBeVisible();
    await expect(tabTimeline).toBeVisible();

    // Verify stats tab content: check default XP indicator
    await expect(page.getByText("Total XP", { exact: true })).toBeVisible();

    // Click Badges Tab and check badges are rendered
    await tabBadges.click();
    await expect(page.getByText("badges unlocked")).toBeVisible();

    // Click Path Timeline tab
    await tabTimeline.click();
    await expect(page.getByText("You are here")).toBeVisible();
  });
});
