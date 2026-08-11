import { test } from "@playwright/test";
import { LoginPage } from "./pom/LoginPage";
import { StudentDashboardPage } from "./pom/StudentDashboardPage";

test.describe("Extensible Student Journey E2E Suites (POM Driven)", () => {
  let loginPage: LoginPage;
  let dashboardPage: StudentDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new StudentDashboardPage(page);

    await loginPage.goto();
    await loginPage.login();
    await dashboardPage.assertOnDashboard();
  });

  test("should seamlessly interact with curriculum tracker via POM actions", async () => {
    await dashboardPage.assertCurriculumTrackerVisible();
    await dashboardPage.selectGlobalCurriculum();
    await dashboardPage.selectLocalCurriculum();
  });

  test("should start focus session timer via POM actions", async () => {
    await dashboardPage.startPomodoroTimer("Linear Algebra Exercises");
  });

  test("should switch gamification hub tabs via POM actions", async () => {
    await dashboardPage.switchGamificationTab("badges");
    await dashboardPage.switchGamificationTab("timeline");
    await dashboardPage.switchGamificationTab("stats");
  });
});
