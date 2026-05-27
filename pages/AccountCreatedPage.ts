import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// ─────────────────────────────────────────────────────────────────────────────
// AccountCreatedPage - /account_created
// ─────────────────────────────────────────────────────────────────────────────

export class AccountCreatedPage extends BasePage {
  readonly heading:         Locator
  readonly continueButton:  Locator

  constructor(page: Page) {
    super(page)
    this.heading        = page.getByTestId('account-created')
    this.continueButton = page.getByTestId('continue-button')
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
    await this.page.waitForURL('/')
  }
}
