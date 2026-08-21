import { expect, test } from "@playwright/test";
import { setupMockGraphQL } from "./loop/mock-api";

/**
 * The 60 second judge path for the flagship demo: find the Grade 4-5 physics
 * course, read the lesson with the blob teacher, and answer an Evaluate phase
 * by manipulating things rather than picking letters.
 *
 * Runs against the mocked GraphQL harness because this course ships as a
 * manifest and must play with no backend running.
 */
test.describe("Grade 4-5 Physics demo", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockGraphQL(page);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  });

  test("shows the course in the catalog and opens its syllabus", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByText("Physics Adventures").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Math Foundation").first()).toBeVisible();

    await page.goto("/courses/physics-grade-4-5");
    await expect(page.getByText("Lesson 1: Forces and Motion").first()).toBeVisible();
    await expect(page.getByText("Lesson 2: Electricity").first()).toBeVisible();
  });

  test("plays the forces wave from Learn through a passing Evaluate", async ({ page }) => {
    await page.goto("/waves/physics-grade-4-5-l1-w1");

    // Learn phase: the blob teacher speaks and the force lab is interactive.
    await expect(page.getByText("Hello! I am Blobby. Today we hunt for forces.")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator("#force-lab-push")).toBeVisible();
    await page.getByRole("button", { name: "Fluffy carpet" }).click();

    await page.getByRole("button", { name: "Start Evaluation" }).click();

    // Tap the pull.
    await page.getByRole("button", { name: "Opening a drawer" }).click();

    // Slide into the "just right" band.
    await page.locator('input[type="range"]').last().fill("6");

    // Nudge an ordering step and put it back, which records the authored order.
    await page.getByRole("button", { name: 'Move "The cart speeds up" earlier' }).click();
    await page.getByRole("button", { name: 'Move "The cart speeds up" later' }).click();

    await page.getByRole("button", { name: /Submit/i }).click();

    await expect(page.getByText(/Correct!/).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/100%|Passed|Well done/i).first()).toBeVisible();
  });

  test("opens a coding wave with a runnable editor", async ({ page }) => {
    await page.goto("/waves/ict-grade-6-8-l2-w2");

    await expect(page.getByText("Your program will break. Mine breaks too, every single day.")).toBeVisible({
      timeout: 20000,
    });

    // The editor opens with the deliberately broken program.
    const editor = page.locator("#python-runner-code");
    await expect(editor).toBeVisible();
    await expect(editor).toHaveValue(/totl/);
    await expect(page.getByRole("button", { name: "Run" })).toBeEnabled();
  });

  test("plays the gears wave through the standard player, not a bespoke page", async ({ page }) => {
    await page.goto("/waves/science-thinking-l1-w1");

    // The gear puzzles now arrive as a learn block inside the normal wave
    // shell, so the Learn and Evaluate tabs are both present.
    await expect(
      page.getByText("Two gears with meshing teeth cannot turn the same way. It is physically impossible."),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("tab", { name: /Learn/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Evaluation" })).toBeVisible();
  });

  test("lights the bulb in the electricity wave and warns on a short circuit", async ({ page }) => {
    await page.goto("/waves/physics-grade-4-5-l2-w1");

    await expect(page.getByText("Electricity is shy. It only travels in a full circle.")).toBeVisible({
      timeout: 20000,
    });

    // Wire the circuit: battery in the bottom gap, wire in the top gap.
    await page.getByRole("button", { name: "Battery", exact: true }).click();
    await page.getByRole("button", { name: /Bottom gap: empty/ }).click();
    await page.getByRole("button", { name: "Wire", exact: true }).click();
    await page.getByRole("button", { name: /Top gap: empty/ }).click();

    await expect(page.getByText(/The bulb is glowing/)).toBeVisible();

    // Add the shortcut wire and the lab explains what went wrong.
    await page.getByRole("button", { name: /Shortcut gap: empty/ }).click();
    await expect(page.getByText(/Short circuit/).first()).toBeVisible();
  });
});
