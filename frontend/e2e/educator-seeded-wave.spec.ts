import { expect, test } from "@playwright/test";

/**
 * The curriculum is seeded from `content/courses/*` by content-sync during CI
 * setup. This walks an educator to one of those seeded waves and checks that
 * the interactive blocks arrive in the editor as their own block types rather
 * than being flattened into text, which is what used to happen and what made
 * saving a physics wave destroy it.
 */
test.describe("Seeded interactive content in the educator editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.educator@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/educator/, { timeout: 30000 });
  });

  test("opens a seeded physics wave with its interactive blocks intact", async ({ page }) => {
    const physicsCard = page.getByTestId("course-card").filter({ hasText: "Physics Adventures" });
    await expect(physicsCard).toBeVisible({ timeout: 15000 });

    await physicsCard.getByRole("link", { name: "Manage" }).click();
    await expect(page.getByRole("heading", { name: "Physics Adventures" })).toBeVisible({
      timeout: 15000,
    });

    await page.getByText("Lesson 1: Forces and Motion").first().click();
    await expect(page.getByText("Lesson Details")).toBeVisible({ timeout: 15000 });

    await page.getByText("1. Pushes and Pulls").first().click();
    await expect(page.getByRole("heading", { name: "1. Pushes and Pulls" })).toBeVisible({
      timeout: 20000,
    });

    // The lazy-loaded editor chunk has to mount before anything else is real.
    await expect(page.getByText("TextBlock").first()).toBeVisible({ timeout: 20000 });

    // Puck renders the canvas inside an iframe, so the block badges live there.
    // Each badge is the editor naming a block type it recognised: seeing them
    // means the wave arrived as typed blocks rather than flattened into text.
    const canvas = page.frameLocator("iframe").first();
    await expect(canvas.getByText("Learn · Blob Teacher Dialog").first()).toBeVisible({
      timeout: 20000,
    });
    await expect(
      canvas.getByText("Learn · Force Lab (push, pull, friction)").first(),
    ).toBeVisible();
    await expect(canvas.getByText("Evaluate · Tap the right thing").first()).toBeVisible();
  });
});
