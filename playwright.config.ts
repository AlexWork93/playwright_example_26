import { defineConfig, devices } from '@playwright/test'

// Environment-aware base URL swap target without touching test code
const BASE_URL = process.env.BASE_URL ?? 'https://automationexercise.com'
const API_URL  = process.env.API_URL  ?? 'https://automationexercise.com'

export default defineConfig({
  testDir: './tests',

  // Discover test files in nested folders by extension convention:
  //   *.spec.ts     → all test types
  //   *.api.spec.ts → API tests only (matched by api project below)
  testMatch: '**/*.spec.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '100%' : 2,

  // Allure + list on every run; HTML report generated but not auto-opened
  reporter: [
    ['list'],
    ['html',   { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results', open: 'never' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'on-first-retry',

    testIdAttribute: 'data-qa',

    // Extra HTTP headers sent on every browser request
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },

  projects: [
    // ── UI projects ────────────────────────────────────────────────────────
    {
      name: 'chromium',
      testIgnore: ['**/*.api.spec.ts', '**/contract/**', '**/performance/**', '**/visual/**', '**/accessibility/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: ['**/*.api.spec.ts', '**/contract/**', '**/performance/**', '**/visual/**', '**/accessibility/**'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      testIgnore: ['**/*.api.spec.ts', '**/contract/**', '**/performance/**', '**/visual/**', '**/accessibility/**'],
      use: { ...devices['Pixel 7'] },
    },

    // ── API project no browser, just HTTP ────────────────────────────────
    // testMatch scoped so only *.api.spec.ts files run here
    {
      name: 'api',
      testMatch: ['**/*.api.spec.ts'],
      use: {
        baseURL: API_URL,
        // Only set Accept globally never Content-Type.
        // Setting Content-Type globally overrides the per-request value that
        // Playwright sets automatically when using form: or multipart: options.
        // Each request method (form, json, multipart) sets its own Content-Type.
        extraHTTPHeaders: {
          'Accept': 'application/json',
        },
      },
    },

    // ── Visual project pinned viewport, Chromium only ───────────────────────
    // Visual snapshots are engine-specific  running on multiple browsers would
    // produce different baselines. We pin to one engine and one viewport.
    // Snapshots are stored next to the spec in __snapshots__ directories.
    {
      name: 'visual',
      testMatch: ['**/visual/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        // Fixed viewport so screenshots never differ due to window size
        viewport: { width: 1280, height: 720 },
        // Mask dynamic elements inline per test — see visual spec for examples
      },
      // Visual tests must NOT run in parallel screenshot comparison is
      // deterministic only when the page renders identically every time.
      fullyParallel: false,
    },

    // ── Accessibility project Chromium, all pages ────────────────────────
    {
      name: 'accessibility',
      testMatch: ['**/accessibility/**/*.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Performance project CDP-enabled Chromium ─────────────────────────
    {
      name: 'performance',
      testMatch: ['**/performance/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--enable-precise-memory-info'] },
      },
    },
  ],

  // Global setup/teardown seed data, clean DB state, etc.
  // globalSetup:    './test-data/global-setup.ts',
  // globalTeardown: './test-data/global-teardown.ts',
})
