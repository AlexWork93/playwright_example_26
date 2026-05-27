import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// ─────────────────────────────────────────────────────────────────────────────
// ProductDetailPage - /product_details/:id
// ─────────────────────────────────────────────────────────────────────────────

export class ProductDetailPage extends BasePage {
  readonly productName:    Locator
  readonly productPrice:   Locator
  readonly productBrand:   Locator
  readonly availability:   Locator
  readonly quantityInput:  Locator
  readonly addToCartBtn:   Locator

  // Modal shown after adding to cart
  readonly cartModal:           Locator
  readonly continueShoppingBtn: Locator
  readonly viewCartBtn:         Locator

  constructor(page: Page) {
    super(page)

    const info = page.locator('.product-information')
    this.productName  = info.locator('h2')
    this.productPrice = info.locator('span span')
    this.productBrand = info.locator('p').filter({ hasText: 'Brand:' })
    this.availability = info.locator('p').filter({ hasText: 'Availability:' })
    this.quantityInput  = page.locator('#quantity')
    this.addToCartBtn   = info.locator('.btn.cart')

    this.cartModal           = page.locator('#cartModal')
    this.continueShoppingBtn = page.locator('.btn-success.close-modal')
    this.viewCartBtn         = page.locator('#cartModal').getByRole('link', { name: 'View Cart' })
  }

  async goto(productId: number): Promise<void> {
    await this.navigate(`/product_details/${productId}`)
  }

  async setQuantity(qty: number): Promise<void> {
    await this.quantityInput.fill(String(qty))
  }

  async addToCart(): Promise<void> {
    await this.addToCartBtn.click()
    await this.cartModal.waitFor({ state: 'visible' })
  }

  async addToCartAndContinue(): Promise<void> {
    await this.addToCart()
    await this.continueShoppingBtn.click()
    await this.cartModal.waitFor({ state: 'hidden' })
  }

  async addToCartAndView(): Promise<void> {
    await this.addToCart()
    await this.viewCartBtn.click()
    await this.page.waitForURL('/view_cart')
  }
}
