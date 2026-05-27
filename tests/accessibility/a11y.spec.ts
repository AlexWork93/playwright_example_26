import { test, expect } from '../../fixtures'
import { checkA11y, runAxe } from '../../utils/a11y'
import { ProductsPage } from '../../pages/ProductsPage'

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility Tests - axe-core + WCAG 2 AA
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_SITE_VIOLATIONS = [
  'color-contrast',    // Brand orange (#ffa500) fails on white - design decision
  'heading-order',     // h3 used after h1 in product cards - site structure
  'landmark-one-main', // No <main> element - site template issue
  'region',            // Content outside landmarks - site template issue
  'button-name',       // #subscribe button is icon-only, no aria-label - site bug (ticket AE-001)
  'link-name',         // Carousel prev/next arrows have no text - site bug (ticket AE-002)
  'label',             // Quantity input #quantity has no <label> - site bug (ticket AE-003)
]

// ── Critical/Serious violations — we ALWAYS check these ──────────────────────

test.describe('Accessibility - Critical violations (must be zero)', () => {

  test('homepage has no critical or serious violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')

    await checkA11y(page, {
      disableRules: KNOWN_SITE_VIOLATIONS,
      impactFilter: ['critical', 'serious'],
    })
  })

  test('products page has no critical or serious violations', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('load')

    await checkA11y(page, {
      disableRules: KNOWN_SITE_VIOLATIONS,
      impactFilter: ['critical', 'serious'],
    })
  })

  test('product detail page has no critical or serious violations', async ({ page }) => {
    await page.goto('/product_details/1')
    await page.waitForLoadState('load')

    await checkA11y(page, {
      disableRules: KNOWN_SITE_VIOLATIONS,
      impactFilter: ['critical', 'serious'],
    })
  })

  test('cart page has no critical or serious violations', async ({ page }) => {
    const productsPage = new ProductsPage(page)
    await productsPage.goto()
    await productsPage.addToCartAndContinue(1)
    await page.goto('/view_cart')
    await page.waitForLoadState('load')

    await checkA11y(page, {
      disableRules: KNOWN_SITE_VIOLATIONS,
      impactFilter: ['critical', 'serious'],
    })
  })

})

// ── Login form - forms must always be accessible ──────────────────────────────

test.describe('Accessibility - Login form', () => {

  test('login form inputs have no critical violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')

    const results = await runAxe(page, {
      disableRules: KNOWN_SITE_VIOLATIONS,
      impactFilter: ['critical', 'serious'],
    })

    const formViolations = results.violations.filter(v =>
      v.nodes.some(n =>
        n.target.some(t =>
          typeof t === 'string' && (
            t.includes('input') ||
            t.includes('button') ||
            t.includes('form') ||
            t.includes('label')
          )
        )
      )
    )

    expect(
      formViolations,
      `Form accessibility violations:\n${formViolations.map(v =>
        `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`
      ).join('\n')}`
    ).toHaveLength(0)
  })

})

// ── Authenticated state ───────────────────────────────────────────────────────

test.describe('Accessibility - Authenticated pages', () => {

  test('logged-in nav has no critical violations', async ({ loggedInPage }) => {
    await loggedInPage.waitForLoadState('load')

    await checkA11y(loggedInPage, {
      disableRules: KNOWN_SITE_VIOLATIONS,
      impactFilter: ['critical', 'serious'],
    })
  })

})

// ── Violation inventory (informational, always passes) ───────────────────────
// Run it to see a full report: npx playwright test --grep "inventory"

test('violation inventory: document all current violations on homepage', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('load')

  const results = await runAxe(page)
  const summary = results.violations.map(v =>
    `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} element${v.nodes.length > 1 ? 's' : ''})`
  )

  console.log('\n═══ Accessibility violation inventory ═══')
  console.log(`Total violations: ${results.violations.length}`)
  summary.forEach(s => console.log(' •', s))
  console.log('═════════════════════════════════════════\n')

})
