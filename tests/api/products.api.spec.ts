import { test, expect } from '../../fixtures'

// ─────────────────────────────────────────────────────────────────────────────
// Products API Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Products API', () => {

  test('GET /api/productsList returns 200 with a non-empty products array', async ({ apiClient }) => {
    const res = await apiClient.getProducts()

    expect(res.responseCode).toBe(200)
    expect(res.products).toBeInstanceOf(Array)
    expect(res.products.length).toBeGreaterThan(0)
  })

  test('each product has the required fields', async ({ apiClient }) => {
    const res = await apiClient.getProducts()

    for (const product of res.products) {
      expect(product).toMatchObject({
        id:    expect.any(Number),
        name:  expect.any(String),
        price: expect.any(String),
        brand: expect.any(String),
      })
      expect(product.id).toBeGreaterThan(0)
      expect(product.name.length).toBeGreaterThan(0)
    }
  })

  test('POST /api/searchProduct returns matching results', async ({ apiClient }) => {
    const res = await apiClient.searchProducts({ search_product: 'dress' })

    expect(res.responseCode).toBe(200)
    expect(res.products.length).toBeGreaterThan(0)

    for (const product of res.products) {
      expect(product).toMatchObject({
        id:    expect.any(Number),
        name:  expect.any(String),
        price: expect.any(String),
      })
    }
  })

  test('search with no match returns empty products array, not an error', async ({ apiClient }) => {
    const res = await apiClient.searchProducts({ search_product: 'xyznonexistentproduct123' })

    expect(res.responseCode).toBe(200)
    expect(res.products).toHaveLength(0)
  })

})
