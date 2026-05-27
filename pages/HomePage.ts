import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// ─────────────────────────────────────────────────────────────────────────────
// HomePage - /
// ─────────────────────────────────────────────────────────────────────────────

export class HomePage extends BasePage {
  readonly url = '/'

  readonly heading:        Locator
  readonly featuredItems:  Locator
  readonly subscribeEmail: Locator
  readonly subscribeButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading         = page.getByRole('heading', { name: /features items/i })
    this.featuredItems   = page.locator('.features_items .product-image-wrapper')
    this.subscribeEmail  = page.locator('#susbscribe_email')
    this.subscribeButton = page.locator('#subscribe')
  }

  async goto(): Promise<void> {
    await this.navigate(this.url)
  }
}
