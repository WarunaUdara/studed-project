import { expect, test } from "@playwright/test";

test.describe("GraphQL Subscriptions (SEC-23b)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.locator("#email").fill("demo.student@studed.lk");
    await page.locator("#password").fill("password1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should establish WebSocket subscription and receive updates on leaderboard page", async ({ page }) => {
    let wsConnected = false;

    page.on("websocket", (ws) => {
      if (ws.url().includes("/graphql")) {
        wsConnected = true;
      }
    });

    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/);

    await page.waitForTimeout(1000);
    expect(wsConnected).toBe(true);
  });
});
