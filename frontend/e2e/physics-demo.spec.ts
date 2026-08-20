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
