import { expect, test } from "@playwright/test";

test.describe("Google authentication entry points", () => {
  for (const path of ["/login", "/register"]) {
    test(`shows the Google button on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
    });
  }
});
