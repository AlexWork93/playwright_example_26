# playwright-suite

Target app: [automationexercise.com](https://automationexercise.com) — a public e-commerce site with both UI and REST API.

## Stack

| Tool | Purpose |
|---|---|
| Playwright `^1.60` | Test framework (browser + API) |
| TypeScript (strict) | Language |
| `@faker-js/faker` | Test data generation |
| `@axe-core/playwright` | Accessibility scanning |
| `allure-playwright` | Rich HTML reporting |

---

## Setup

```bash
npm install
npx playwright install  
```

---

## Running tests

### Run everything
```bash
npm test
```

### Run by project
```bash
npm run test:api        # REST API tests only (no browser)
npm run test:e2e        # E2E UI tests — Chromium
npm run test:mobile          # E2E UI tests — Pixel 7 (mobile Chrome)
npx playwright test --project=firefox          # E2E UI tests — Firefox
npx playwright test --project=visual           # Visual regression (compare to baselines)
npx playwright test --project=accessibility    # Accessibility / WCAG 2 AA
npm run test:perf       # Performance — CDP + Core Web Vitals
```

### Run a specific file or test
```bash
npx playwright test tests/e2e/auth.spec.ts
npx playwright test tests/api/users.api.spec.ts
npx playwright test --grep "login"             # all tests whose name matches "login"
npx playwright test --grep-invert "slow"       # exclude tests matching "slow"
```

### Debug modes
```bash
npm run test:headed     # visible browser window (Chromium)
npm run test:debug      # Playwright Inspector — step through one test at a time
npm run test:ui         # Playwright UI mode — interactive test explorer
```

---

## Visual regression

Baselines are committed to `tests/visual/__snapshots__/`.

```bash
# Compare screenshots against baselines (normal CI run)
npx playwright test --project=visual

# Regenerate all baselines after an intentional UI change
npx playwright test --project=visual --update-snapshots
```

---

## Reports

```bash
npm run report:html     # open the built-in HTML report (last run)
npm run report:allure   # generate + open Allure report (requires allure CLI)
```

> **Allure CLI** — install once with `npm install -g allure-commandline` or via  
> `brew install allure` (macOS) / `scoop install allure` (Windows).

---

## Type checking

```bash
npm run lint            # runs tsc --noEmit — no output means no errors
```

---

## Project structure

```
playwright-suite/
├── tests/
│   ├── e2e/            # UI tests — auth, products, cart, mocking
│   ├── api/            # REST API tests (*.api.spec.ts)
│   ├── visual/         # Screenshot regression
│   ├── accessibility/  # axe-core / WCAG 2 AA
│   └── performance/    # CDP metrics + Core Web Vitals
├── pages/              # Page Object Models
├── fixtures/           # Custom test fixtures (testUser, loggedInPage, …)
├── api-client/         # Typed AE REST API wrapper
├── test-data/          # userFactory() + faker helpers
└── utils/              # a11y helpers (runAxe, checkA11y)
```

## Test projects explained

| Project | What runs | How to target |
|---|---|---|
| `chromium` | All E2E UI tests | `--project=chromium` |
| `firefox` | All E2E UI tests | `--project=firefox` |
| `mobile-chrome` | All E2E UI tests (Pixel 7) | `--project=mobile-chrome` |
| `api` | `*.api.spec.ts` files only — no browser | `--project=api` |
| `visual` | `tests/visual/**` — screenshot diffs | `--project=visual` |
| `accessibility` | `tests/accessibility/**` — axe scans | `--project=accessibility` |
| `performance` | `tests/performance/**` — CDP / CWV | `--project=performance` |

## Custom fixtures

Imported from `fixtures/` instead of `@playwright/test` directly:

| Fixture | What it gives you |
|---|---|
| `apiClient` | Typed `AEClient` wrapping the test's request context |
| `testUser` | Creates a real user via API before the test; deletes it after — **one fresh user per test** |
| `userCredentials` | `{ email, password }` extracted from `testUser` |
| `loggedInPage` | A `Page` already logged in as `testUser` — no login steps needed in the test body |

> Each fixture is **per-test** — Playwright creates a new instance for every `test()` call.  
> A `describe` block with three tests that all use `testUser` will create and delete **three separate accounts**.
