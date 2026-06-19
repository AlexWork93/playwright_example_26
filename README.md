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

## CI/CD pipelines

This repo (`playwright_example_26`) is one half of a two-repo CI system.
The other half is `playwright_app_mocking` — the product/app repo where developers open PRs.

### Repositories

| Repo | Role |
|---|---|
| `playwright_app_mocking` | App code. Unit tests live here. Developers open PRs here. |
| `playwright_example_26` (this repo) | Test suite. Integration (API + DB) and E2E tests live here. |

---

### Branch hierarchy

Both repos follow the same promotion chain:

```
feature/* → dev → staging → main
```

Merging is always in that direction. `main` is production. `staging` is the release candidate. `dev` is the integration branch.

---

### Pipelines

#### 1. `daily-dev.yml` — Daily regression (08:00 Kyiv, every day)

Verifies the current state of `dev` every morning.

```
[cron / manual]
    │
    ▼
L1  Trigger unit-tests.yml on playwright_app_mocking @ dev — wait for result
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
```

#### 2. `dev-to-staging.yml` — Manual QA gate (run from Actions tab)

Triggered manually by a QA engineer before merging `dev → staging`.
Posts a commit status to `playwright_app_mocking` — the `dev → staging` PR merge button stays blocked until this pipeline goes green.

```
[manual dispatch]
    │
    ▼
    Set playwright / staging-gate → pending on app repo dev HEAD
    │
    ▼
L1  Trigger unit-tests.yml on playwright_app_mocking @ dev — wait for result
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
    │
    ▼
    Set playwright / staging-gate → success ✓  (or failure ✗)
    → dev → staging PR is now unblocked (or stays blocked)
```

#### 3. `staging-to-main.yml` — Friday deployment (09:00 Kyiv, every Friday)

Runs the full pyramid against staging, then promotes staging to main via an auto-created PR.
After merging it triggers `post-deploy.yml` automatically.

```
[cron Friday 09:00 / manual]
    │
    ▼
L1  Trigger unit-tests.yml on playwright_app_mocking @ staging — wait for result
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
    │
    ▼
    Promote: create PR staging → main in app repo, merge it
    │
    ▼
    Dispatch post-deploy.yml on main
```

#### 4. `post-deploy.yml` — Production verification (triggered by staging-to-main)

Verifies that main (production) is healthy immediately after a deployment.

```
[dispatch from staging-to-main / manual]
    │
    ▼
L1  Trigger unit-tests.yml on playwright_app_mocking @ main — wait for result
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
```

#### 5. `on-dispatch.yml` — PR smoke test (triggered by app repo)

Fires when a developer opens a PR in `playwright_app_mocking` (excluding PRs targeting `staging` and `main`). The app repo runs unit tests first, then dispatches this workflow. Posts the result back as a commit status so the PR is blocked until smoke tests pass.

```
[repository_dispatch from playwright_app_mocking]
    │
    ▼
    Cloudflare connectivity check
    │
    ▼
    API smoke tests (skipped with warning if Cloudflare blocks the runner)
    │
    ▼
    Post playwright / api-smoke → success or failure on app repo commit
```

---

### App repo flow (playwright_app_mocking)

#### PR on a feature branch

```
Developer opens PR: feature/* → dev

playwright_app_mocking / trigger-tests.yml fires:
  1. Unit tests run (in app repo)
  2. Dispatch → playwright_example_26 / on-dispatch.yml
  3. Smoke test result posted back as commit status
  4. Merge button unblocked when status is green
```

#### Merging dev → staging

```
Developer opens PR: dev → staging

playwright_app_mocking / app_side_staging_gate.yml fires:
  → Posts playwright / staging-gate as "pending — waiting for manual QA gate"
  → Merge button is immediately blocked

QA engineer goes to playwright_example_26 → Actions → "Dev → Staging — manual QA gate" → Run workflow
  → Full pyramid runs (unit → integration → E2E)
  → On success: posts playwright / staging-gate → success
  → Merge button is now unblocked
```

#### Merging staging → main

```
Happens automatically every Friday at 09:00 Kyiv time.
staging-to-main.yml runs the full pyramid on staging, then:
  → Creates PR staging → main in playwright_app_mocking
  → Merges it automatically (audit trail preserved in PR history)
  → Dispatches post-deploy.yml to verify production
```

---

### Testing pyramid

Every pipeline follows the same three-level structure:

```
L3  E2E              chromium + firefox (parallel)
     ↑ needs both L2 jobs green
L2  Integration      API tests  |  DB tests  (parallel)
     ↑ needs L1 green
L1  Unit             unit-tests.yml in playwright_app_mocking (trigger + wait)
```

Unit tests always run in the **app repo** on the branch being tested (`dev`, `staging`, or `main`).
Integration and E2E tests always run in **this repo**.

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
