import { test, expect } from '../../fixtures'
import { ProductsPage } from '../../pages/ProductsPage'
import { ProductDetailPage } from '../../pages/ProductDetailPage'

// ─────────────────────────────────────────────────────────────────────────────
// Products E2E Tests
// These tests focus only on what can't be tested at the API level:
//   - Visual rendering of product cards
//   - Client-side search interaction
//   - Navigation to detail pages
//   - Quantity input behaviour
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Products listing', () => {

  test('products page shows a non-empty grid of products', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    await productsPage.goto()

    // At least 1 card visible — we validated count=34 via the API,
    // but the count is an implementation detail; we just assert "non-empty"
    await expect(productsPage.productCards.first()).toBeVisible()
    const count = await productsPage.productCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('search returns filtered results', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    await productsPage.goto()

    await productsPage.search('Dress')

    // Results section appears with at least one match
    await expect(productsPage.searchResults.first()).toBeVisible()
    const resultCount = await productsPage.searchResults.count()
    expect(resultCount).toBeGreaterThan(0)

    // The search heading confirms what was searched
    await expect(page.locator('h2.title.text-center')).toContainText('Searched Products')
  })

  test('search with no match shows the heading but zero product cards', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    await productsPage.goto()

    await productsPage.search('xyznonexistentproduct999')

    // The "Searched Products" heading still appears — results section is empty
    await expect(page.locator('h2.title.text-center', { hasText: 'Searched Products' })).toBeVisible()
    const resultCount = await productsPage.searchResults.count()
    expect(resultCount).toBe(0)
  })

  test('clicking "View Product" opens the product detail page', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    await productsPage.goto()

    await productsPage.viewProductLink(1).click()
    await expect(page).toHaveURL('/product_details/1')
  })

})

test.describe('Product detail page', () => {

  test('shows name, price, brand and availability', async ({ page }) => {
    const detailPage = new ProductDetailPage(page)
    await detailPage.goto(1)

    // All key product fields must be visible — if any are missing, the UI broke
    await expect(detailPage.productName).toBeVisible()
    await expect(detailPage.productPrice).toBeVisible()
    await expect(detailPage.productBrand).toContainText('Brand:')
    await expect(detailPage.availability).toContainText('In Stock')
  })

  test('quantity input defaults to 1 and accepts a new value', async ({ page }) => {
    const detailPage = new ProductDetailPage(page)
    await detailPage.goto(1)

    await expect(detailPage.quantityInput).toHaveValue('1')

    await detailPage.setQuantity(3)
    await expect(detailPage.quantityInput).toHaveValue('3')
  })

  test('add to cart shows confirmation modal', async ({ page }) => {
    const detailPage = new ProductDetailPage(page)
    await detailPage.goto(1)

    await detailPage.addToCart()

    // Modal is the feedback signal — no navigation yet
    await expect(detailPage.cartModal).toBeVisible()
    await expect(detailPage.continueShoppingBtn).toBeVisible()
    await expect(detailPage.viewCartBtn).toBeVisible()
  })

  test('"View Cart" in modal navigates to the cart', async ({ page }) => {
    const detailPage = new ProductDetailPage(page)
    await detailPage.goto(1)

    await detailPage.addToCartAndView()

    await expect(page).toHaveURL('/view_cart')
  })

})
