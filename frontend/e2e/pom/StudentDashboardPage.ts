import { expect, type Page } from "@playwright/test";

export class StudentDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async assertCurriculumTrackerVisible() {
    await expect(this.page.getByText("Curriculum & Exam Tracker")).toBeVisible();
  }

  async selectGlobalCurriculum() {
    const globalBtn = this.page.locator("[data-testid='curriculum-global']");
    await globalBtn.click();
    await expect(this.page.getByText("Target: UK Pearson/Edexcel")).toBeVisible();
  }

  async selectLocalCurriculum() {
    const localBtn = this.page.locator("[data-testid='curriculum-local']");
    await localBtn.click();
    await expect(this.page.getByText("Target: SL Syllabus")).toBeVisible();
  }

  async startPomodoroTimer(taskName = "Solving Equations") {
    const taskInput = this.page.locator("[data-testid='pomodoro-task-input']");
    await taskInput.fill(taskName);

    const playBtn = this.page.locator("[data-testid='pomodoro-play-pause']");
    await playBtn.click();
    await expect(playBtn).toContainText("Pause");
  }

  async switchGamificationTab(tab: "stats" | "badges" | "timeline") {
    const tabLocator = this.page.locator(`[data-testid='tab-${tab}']`);
    await tabLocator.click();
  }
}
