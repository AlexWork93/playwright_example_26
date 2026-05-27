import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage - /login
// ─────────────────────────────────────────────────────────────────────────────

export class LoginPage extends BasePage {
  readonly url = '/login'

  // ── Login form ─────────────────────────────────────────────────────────────
  readonly loginEmailInput:    Locator
  readonly loginPasswordInput: Locator
  readonly loginButton:        Locator
  readonly loginErrorMessage:  Locator

  // ── Signup initiation form ─────────────────────────────────────────────────
  readonly signupNameInput:  Locator
  readonly signupEmailInput: Locator
  readonly signupButton:     Locator

  constructor(page: Page) {
    super(page)

    this.loginEmailInput    = page.getByTestId('login-email')
    this.loginPasswordInput = page.getByTestId('login-password')
    this.loginButton        = page.getByTestId('login-button')
    this.loginErrorMessage  = page.locator('p').filter({ hasText: /Your email or password is incorrect/i })

    this.signupNameInput  = page.getByTestId('signup-name')
    this.signupEmailInput = page.getByTestId('signup-email')
    this.signupButton     = page.getByTestId('signup-button')
  }

  async goto(): Promise<void> {
    await this.navigate(this.url)
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async loginWith(email: string, password: string): Promise<void> {
    await this.loginEmailInput.fill(email)
    await this.loginPasswordInput.fill(password)
    await this.loginButton.click()
  }

  async initiateSignup(name: string, email: string): Promise<void> {
    await this.signupNameInput.fill(name)
    await this.signupEmailInput.fill(email)
    await this.signupButton.click()
    await this.page.waitForURL('/signup')
  }
}
