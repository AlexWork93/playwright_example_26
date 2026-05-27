import { test, expect } from '../../fixtures'
import { ProductsPage } from '../../pages/ProductsPage'
import { ProductDetailPage } from '../../pages/ProductDetailPage'
import { CartPage } from '../../pages/CartPage'

// ─────────────────────────────────────────────────────────────────────────────
// Cart E2E Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cart — adding products', () => {

  test('adding a product from the listing puts it in the cart', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    const cartPage     = new CartPage(page)

    await productsPage.goto()
    await productsPage.addToCartAndView(1)   // Blue Top (id=1)

    // Row for product 1 must exist
    await expect(cartPage.rowByProductId(1)).toBeVisible()
    await expect(cartPage.productNameInRow(1)).toContainText('Blue Top')
    await expect(cartPage.priceInRow(1)).toContainText('Rs. 500')
    await expect(cartPage.quantityInRow(1)).toContainText('1')
    await expect(cartPage.totalInRow(1)).toContainText('Rs. 500')
  })

  test('adding a product with qty=2 shows correct quantity and total', async ({ page }) => {
    const detailPage = new ProductDetailPage(page)
    const cartPage   = new CartPage(page)

    await detailPage.goto(1)
    await detailPage.setQuantity(2)
    await detailPage.addToCartAndView()

    await expect(cartPage.quantityInRow(1)).toContainText('2')
    await expect(cartPage.totalInRow(1)).toContainText('Rs. 1000')
  })

  test('multiple different products all appear in cart', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    const cartPage     = new CartPage(page)

    await productsPage.goto()
    await productsPage.addToCartAndContinue(1)   // Blue Top
    await productsPage.addToCartAndContinue(2)   // Men Tshirt
    await page.goto('/view_cart')

    await expect(cartPage.rowByProductId(1)).toBeVisible()
    await expect(cartPage.rowByProductId(2)).toBeVisible()
    expect(await cartPage.getCartCount()).toBe(2)
  })

})

test.describe('Cart — removing products', () => {

  test('removing a product deletes its row from the cart', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    const cartPage     = new CartPage(page)

    await productsPage.goto()
    await productsPage.addToCartAndContinue(1)
    await productsPage.addToCartAndContinue(2)
    await page.goto('/view_cart')

    expect(await cartPage.getCartCount()).toBe(2)

    await cartPage.removeProduct(1)

    // Product 1 gone, product 2 still there
    await expect(cartPage.rowByProductId(1)).toHaveCount(0)
    await expect(cartPage.rowByProductId(2)).toBeVisible()
    expect(await cartPage.getCartCount()).toBe(1)
  })

})

test.describe('Cart — authenticated user', () => {

  // loggedInPage: page already has a live session — no login steps in the test
  test('logged-in user can add to cart and proceed to checkout', async ({ loggedInPage }) => {
    const productsPage = new ProductsPage(loggedInPage)
    const cartPage     = new CartPage(loggedInPage)

    await productsPage.goto()
    await productsPage.addToCartAndView(1)

    await expect(cartPage.rowByProductId(1)).toBeVisible()

    // "Proceed To Checkout" is available for logged-in users
    await expect(cartPage.proceedToCheckout).toBeVisible()
    await cartPage.proceedToCheckout.click()

    // Authenticated users go directly to the checkout address page
    await expect(loggedInPage).toHaveURL('/checkout')
  })

  test('guest user clicking "Proceed To Checkout" is prompted to login', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    const cartPage     = new CartPage(page)

    await productsPage.goto()
    await productsPage.addToCartAndView(1)

    await cartPage.proceedToCheckout.click()

    // Guest sees a modal asking them to register or login
    await expect(page.getByText('Register / Login account to proceed on checkout.')).toBeVisible()
  })

})
