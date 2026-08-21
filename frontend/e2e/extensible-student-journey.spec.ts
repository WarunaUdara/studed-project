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

  test("should render the dashboard rails via POM actions", async () => {
    await dashboardPage.assertSearchRailVisible();
    await dashboardPage.assertWidgetRailVisible();
  });

  test("should open the ask modal via POM actions", async () => {
    await dashboardPage.askAbout("Linear equations");
  });

  test("should reach the catalog via POM actions", async () => {
    await dashboardPage.goToCourses();
  });
});
