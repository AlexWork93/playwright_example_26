import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// ─────────────────────────────────────────────────────────────────────────────
// ProductsPage - /products
// ─────────────────────────────────────────────────────────────────────────────

export class ProductsPage extends BasePage {
  readonly url = '/products'

  readonly productCards:    Locator
  readonly searchInput:     Locator
  readonly searchButton:    Locator
  readonly searchResults:   Locator

  // Modal that appears after clicking "Add to cart"
  readonly addedToCartModal:      Locator
  readonly continueShoppingBtn:   Locator
  readonly viewCartBtn:           Locator

  constructor(page: Page) {
    super(page)

    this.productCards         = page.locator('.product-image-wrapper')
    this.searchInput          = page.locator('#search_product')
    this.searchButton         = page.locator('#submit_search')
    this.searchResults        = page.locator('.features_items .product-image-wrapper')

    this.addedToCartModal     = page.locator('#cartModal')
    this.continueShoppingBtn  = page.locator('.btn-success.close-modal')
    this.viewCartBtn          = page.locator('#cartModal').getByRole('link', { name: 'View Cart' })
  }

  async goto(): Promise<void> {
    await this.navigate(this.url)
  }

  // ── Product card helpers ───────────────────────────────────────────────────

  cardByName(name: string): Locator {
    return this.productCards.filter({ hasText: name })
  }

  addToCartBtn(productId: number): Locator {
    return this.page.locator(`.add-to-cart[data-product-id="${productId}"]`).first()
  }

  viewProductLink(productId: number): Locator {
    return this.page.locator(`a[href="/product_details/${productId}"]`)
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term)
    await this.searchButton.click()
    await this.page.locator('h2.title.text-center', { hasText: 'Searched Products' })
      .waitFor({ state: 'visible' })
  }

  async addToCartAndContinue(productId: number): Promise<void> {
    await this.addToCartBtn(productId).click()
    await this.addedToCartModal.waitFor({ state: 'visible' })
    await this.continueShoppingBtn.click()
    await this.addedToCartModal.waitFor({ state: 'hidden' })
  }

  async addToCartAndView(productId: number): Promise<void> {
    await this.addToCartBtn(productId).click()
    await this.addedToCartModal.waitFor({ state: 'visible' })
    await this.viewCartBtn.click()
    await this.page.waitForURL('/view_cart')
  }
}
