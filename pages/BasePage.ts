import { type Page, type Locator } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// BasePage
// ─────────────────────────────────────────────────────────────────────────────

export abstract class BasePage {
  readonly navHome:          Locator
  readonly navProducts:      Locator
  readonly navCart:          Locator
  readonly navSignupLogin:   Locator
  readonly navLogout:        Locator
  readonly navDeleteAccount: Locator
  readonly loggedInAs:       Locator

  constructor(protected readonly page: Page) {
    // Block known ad/tracker domains at the network level.
    // Prevents ad overlays from appearing and blocking test interactions.
    // This is idempotent Playwright deduplicates identical route handlers.
    void page.route(
      /googletagmanager|doubleclick|googlesyndication|adservice|amazon-adsystem|pagead|nerbalky|hotjar/,
      route => route.abort()
    )

    this.navHome          = page.getByRole('link', { name: 'Home' })
    this.navProducts      = page.getByRole('link', { name: 'Products' })
    this.navCart          = page.getByRole('link', { name: 'Cart' })
    this.navSignupLogin   = page.getByRole('link', { name: ' Signup / Login' })
    this.navLogout        = page.getByRole('link', { name: ' Logout' })
    this.navDeleteAccount = page.getByRole('link', { name: ' Delete Account' })
    this.loggedInAs = page.locator('li').filter({ hasText: 'Logged in as' })
  }

  async navigate(path = '/'): Promise<void> {
    await this.page.goto(path)
  }

  async logout(): Promise<void> {
    await this.navLogout.click()
    await this.page.waitForURL('/login')
  }

  async deleteAccount(): Promise<void> {
    await this.navDeleteAccount.click()
    await this.page.waitForURL('/delete_account')
  }

  async getLoggedInUsername(): Promise<string | null> {
    const visible = await this.loggedInAs.isVisible()
    if (!visible) return null
    const text = await this.loggedInAs.textContent()
    return text?.replace(/.*Logged in as\s+/, '').trim() ?? null
  }

  isLoggedIn(): Promise<boolean> {
    return this.loggedInAs.isVisible()
  }
}
