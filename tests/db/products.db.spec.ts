import { test, expect } from '@playwright/test'
import { query, closePool } from '@utils/db-client'

// DB tests are stateful — each test builds on the previous one's data.
// Serial mode guarantees order and prevents parallel workers from stepping
// on each other's rows.
test.describe.configure({ mode: 'serial' })

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRow {
  id:         number
  name:       string
  price:      string   // pg returns NUMERIC as string
  category:   string
  synced_at:  Date
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PRODUCTS = [
  { id: 1, name: 'Blue Top',         price: 500,  category: 'Women' },
  { id: 2, name: 'Men Tshirt',       price: 400,  category: 'Men'   },
  { id: 3, name: 'Sleeveless Dress', price: 1000, category: 'Women' },
  { id: 4, name: 'Stylish Dress',    price: 1500, category: 'Women' },
  { id: 5, name: 'Winter Top',       price: 600,  category: 'Women' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Products table — Supabase', () => {

  test.afterAll(async () => {
    // Clean up all rows inserted during this run so the suite is re-runnable
    await query('DELETE FROM products WHERE id = ANY($1)', [SEED_PRODUCTS.map(p => p.id)])
    await closePool()
  })

  // ── 1. Connectivity ─────────────────────────────────────────────────────────
  test('connects to Supabase and returns server version', async () => {
    const result = await query<{ version: string }>('SELECT version()')
    const version = result.rows[0].version

    expect(version).toContain('PostgreSQL')
    console.log('Connected to:', version.split(',')[0])
  })

  // ── 2. Insert ────────────────────────────────────────────────────────────────
  test('inserts multiple product rows', async () => {
    for (const p of SEED_PRODUCTS) {
      await query(
        'INSERT INTO products (id, name, price, category) VALUES ($1, $2, $3, $4)',
        [p.id, p.name, p.price, p.category]
      )
    }

    const { rowCount } = await query(
      'SELECT 1 FROM products WHERE id = ANY($1)',
      [SEED_PRODUCTS.map(p => p.id)]
    )
    expect(rowCount).toBe(SEED_PRODUCTS.length)
  })

  // ── 3. Read by primary key ───────────────────────────────────────────────────
  test('reads a product back by primary key', async () => {
    const { rows } = await query<ProductRow>(
      'SELECT * FROM products WHERE id = $1',
      [1]
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Blue Top')
    expect(rows[0].category).toBe('Women')
    expect(Number(rows[0].price)).toBe(500)
  })

  // ── 4. Filter by category ────────────────────────────────────────────────────
  test('filters products by category', async () => {
    const { rows } = await query<ProductRow>(
      'SELECT * FROM products WHERE category = $1 ORDER BY id',
      ['Women']
    )

    const womenProducts = SEED_PRODUCTS.filter(p => p.category === 'Women')
    expect(rows).toHaveLength(womenProducts.length)
    expect(rows.every(r => r.category === 'Women')).toBe(true)
  })

  // ── 5. Update ────────────────────────────────────────────────────────────────
  test('updates a product price and reflects the change', async () => {
    const newPrice = 750

    await query('UPDATE products SET price = $1 WHERE id = $2', [newPrice, 1])

    const { rows } = await query<ProductRow>(
      'SELECT price FROM products WHERE id = $1',
      [1]
    )
    expect(Number(rows[0].price)).toBe(newPrice)
  })

  // ── 6. Unique constraint ─────────────────────────────────────────────────────
  test('rejects duplicate primary key — unique constraint is enforced', async () => {
    await expect(
      query('INSERT INTO products (id, name, price, category) VALUES ($1, $2, $3, $4)', [
        1, 'Duplicate', 100, 'Men',
      ])
    ).rejects.toThrow(/duplicate key/)
  })

  // ── 7. Count with aggregate ──────────────────────────────────────────────────
  test('aggregate count matches number of inserted rows', async () => {
    const { rows } = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM products WHERE id = ANY($1)',
      [SEED_PRODUCTS.map(p => p.id)]
    )
    expect(Number(rows[0].count)).toBe(SEED_PRODUCTS.length)
  })

  // ── 8. Delete ────────────────────────────────────────────────────────────────
  test('deletes a product and verifies it no longer exists', async () => {
    await query('DELETE FROM products WHERE id = $1', [5])

    const { rows } = await query<ProductRow>(
      'SELECT * FROM products WHERE id = $1',
      [5]
    )
    expect(rows).toHaveLength(0)
  })

  // ── 9. synced_at timestamp is set automatically ──────────────────────────────
  test('synced_at is populated automatically on insert', async () => {
    const { rows } = await query<ProductRow>(
      'SELECT synced_at FROM products WHERE id = $1',
      [2]
    )
    expect(rows[0].synced_at).toBeInstanceOf(Date)
    expect(rows[0].synced_at.getTime()).toBeLessThanOrEqual(Date.now())
  })

})
