import { expect, test } from "@playwright/test";

// The invented Sri Lankan schools the standings page used to print under every
// student's name, assigned by hashing their user id.
const INVENTED_SCHOOLS = [
  "Royal College, Colombo",
  "Visakha Vidyalaya",
  "Ananda College",
  "Nalanda College",
  "Trinity College, Kandy",
];

// The hardcoded classmates and league tier the dashboard and daily spark used
// to render to every student.
const INVENTED_PEOPLE = ["David E", "Jeremy L", "Yolanda J", "Ankit K", "Hydrogen League"];

async function signInAsStudent(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.locator("#email").fill("demo.student@studed.lk");
  await page.locator("#password").fill("password1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Leaderboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsStudent(page);
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { name: /Where you stand/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("ranks real students with masked names", async ({ page }) => {
    // Wait for the board itself, not merely for the page shell.
    const summary = page.getByText(/ranked students|Be the first|No XP earned/i);
    await expect(summary.first()).toBeVisible({ timeout: 15000 });

    const body = await page.locator("body").innerText();

    // Names are masked to "First L." on the way out of the gateway. A full
    // surname on the board means masking regressed.
    expect(body).not.toContain("Demo Student");

    // XP is rendered against real rows.
    await expect(page.getByText(/\bXP\b/).first()).toBeVisible();
  });

  test("shows no invented schools", async ({ page }) => {
    await expect(page.getByText(/ranked students|Be the first|No XP earned/i).first()).toBeVisible({
      timeout: 15000,
    });
    const body = await page.locator("body").innerText();
    for (const school of INVENTED_SCHOOLS) {
      expect(body, `the board printed the invented school "${school}"`).not.toContain(school);
    }
  });

  test("switches between every scope the backend ranks", async ({ page }) => {
    for (const [testId, blurb] of [
      ["scope-global", /Every student on StudEd/i],
      ["scope-grade", /Students in your grade/i],
      ["scope-weekly", /XP earned since Monday/i],
    ] as const) {
      await page.getByTestId(testId).click();
      // The page describes the scope it is actually showing.
      await expect(page.getByText(blurb)).toBeVisible({ timeout: 15000 });
      // And it never errors out on a scope with no board yet.
      await expect(page.getByRole("heading", { name: /Where you stand/i })).toBeVisible();
    }
  });

  test("offers no scope the backend cannot rank", async ({ page }) => {
    // FRIENDS was a tab whose scope had no friends model behind it, so it
    // could only ever render an empty board.
    await expect(page.getByRole("button", { name: "Friends", exact: true })).toHaveCount(0);
  });

  test("has no controls that change nothing", async ({ page }) => {
    // The "This Week / All Time" toggle was never wired to the query.
    await expect(page.getByRole("button", { name: "All Time", exact: true })).toHaveCount(0);
  });

  test("tells the student where they stand", async ({ page }) => {
    const standing = page.getByText(/You are #\d+|students ranked|Be the first|No XP earned/i);
    await expect(standing.first()).toBeVisible({ timeout: 15000 });
  });

  test("searching filters the podium too", async ({ page }) => {
    await expect(page.getByText(/ranked students|Be the first|No XP earned/i).first()).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("textbox", { name: /Search the leaderboard/i }).fill("zzzznobody");

    // With nothing matching, the page says so rather than leaving the top three
    // standing behind the search. On an empty board the empty state shows
    // instead — the test accepts either rather than assuming a seeded database
    // has ranked students.
    await expect(
      page.getByText(/No one here matches|Be the first|No XP earned/i).first(),
    ).toBeVisible({ timeout: 10000 });

    // Either way the podium must not survive the search.
    await expect(page.getByText("Gold", { exact: true })).toHaveCount(0);
  });
});

test.describe("Achievements", () => {
  test("shows locked and unlocked achievements from the server", async ({ page }) => {
    await signInAsStudent(page);
    await page.goto("/achievements");
    await expect(page.getByRole("heading", { name: /What you've earned/i })).toBeVisible({
      timeout: 15000,
    });

    // The catalog is server-owned and includes what is still to earn, so the
    // UI never needs its own copy of the unlock rules.
    const cards = page.locator("[data-testid^='achievement-']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(8);

    // The count in the header is over the real catalog, not a constant.
    await expect(page.getByText(/\d+ of \d+ unlocked/i)).toBeVisible();
  });
});

test.describe("Dashboard progression", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsStudent(page);
  });

  test("shows a real streak, not a filled-in week", async ({ page }) => {
    const streak = page.getByTestId("streak-count");
    await expect(streak).toBeVisible({ timeout: 15000 });
    // A number, whatever it is — the widget used to hardcode "1 Charge" beside
    // a week where every past weekday was pre-filled.
    await expect(streak).toHaveText(/^\d+$/);
    await expect(page.getByText("1 Charge")).toHaveCount(0);
  });

  test("shows where each enrolled course stands", async ({ page }) => {
    // The dashboard previously carried no course progress at all.
    await expect(
      page.getByText(/Continue learning|Nothing on the go/i).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("shows a real standing, not invented classmates", async ({ page }) => {
    await expect(page.getByText(/This week/i).first()).toBeVisible({ timeout: 15000 });
    const body = await page.locator("body").innerText();
    for (const ghost of INVENTED_PEOPLE) {
      expect(body, `the dashboard rendered "${ghost}"`).not.toContain(ghost);
    }
  });
});
