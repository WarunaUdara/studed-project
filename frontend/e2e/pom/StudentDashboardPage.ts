import { expect, type Page } from "@playwright/test";

/**
 * Page object for the student dashboard as it stands after the two-rail
 * redesign: a search and Ask rail, the widget stack, and the course deck.
 */
export class StudentDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async assertSearchRailVisible() {
    await expect(this.page.getByPlaceholder("What do you want to learn?")).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Ask" })).toBeVisible();
  }

  async assertWidgetRailVisible() {
    await expect(this.page.getByText("View all rankings")).toBeVisible();
  }

  async askAbout(topic: string) {
    await this.page.getByPlaceholder("What do you want to learn?").fill(topic);
    await this.page.getByRole("button", { name: "Ask" }).click();
    await expect(
      this.page.getByRole("dialog", { name: "Search lessons and ask a question" }),
    ).toBeVisible();
  }

  async goToCourses() {
    await this.page.getByRole("link", { name: "Courses", exact: true }).first().click();
    await expect(this.page).toHaveURL(/\/courses/);
  }
}
