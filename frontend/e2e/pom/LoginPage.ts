import { expect, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.context().clearCookies();
    await this.page.goto("/login");
  }

  async login(email = "demo.student@studed.lk", password = "password123") {
    await this.locatorEmail().fill(email);
    await this.locatorPassword().fill(password);
    await this.buttonSignIn().click();
  }

  locatorEmail() {
    return this.page.locator("#email");
  }

  locatorPassword() {
    return this.page.locator("#password");
  }

  buttonSignIn() {
    return this.page.getByRole("button", { name: "Sign in" });
  }

  async assertOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
