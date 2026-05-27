import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

// ─────────────────────────────────────────────────────────────────────────────
// CartPage - /view_cart
// ─────────────────────────────────────────────────────────────────────────────

export class CartPage extends BasePage {
  readonly url = '/view_cart'

  readonly cartTable:       Locator
  readonly cartRows:        Locator
  readonly proceedToCheckout: Locator
  readonly emptyCartMessage:  Locator

  constructor(page: Page) {
    super(page)

    this.cartTable          = page.locator('#cart_info_table')
    this.cartRows           = page.locator('#cart_info_table tbody tr')
    this.proceedToCheckout  = page.getByText('Proceed To Checkout')
    this.emptyCartMessage   = page.locator('#empty_cart')
  }

  async goto(): Promise<void> {
    await this.navigate(this.url)
  }

  rowByProductId(productId: number): Locator {
    return this.page.locator(`tr#product-${productId}`)
  }

  productNameInRow(productId: number): Locator {
    return this.rowByProductId(productId).locator('.cart_description h4 a')
  }

  priceInRow(productId: number): Locator {
    return this.rowByProductId(productId).locator('.cart_price p')
  }

  quantityInRow(productId: number): Locator {
    return this.rowByProductId(productId).locator('.cart_quantity button')
  }

  totalInRow(productId: number): Locator {
    return this.rowByProductId(productId).locator('.cart_total_price')
  }

  deleteButtonInRow(productId: number): Locator {
    return this.rowByProductId(productId).locator('.cart_quantity_delete')
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async removeProduct(productId: number): Promise<void> {
    await this.deleteButtonInRow(productId).click()
    await this.rowByProductId(productId).waitFor({ state: 'detached' })
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyCartMessage.isVisible()
  }

  async getCartCount(): Promise<number> {
    return this.cartRows.count()
  }
}
