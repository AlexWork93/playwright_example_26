# playwright-suite

Test suite for [automationexercise.com](https://automationexercise.com) — a public e-commerce site with UI, REST API, and database layers.

Part of a two-repo CI system alongside `playwright_app_mocking` https://github.com/AlexWork93/playwright_app_mocking (the app repo).

## Stack

| Tool | Purpose |
|---|---|
| Playwright `^1.60` | Test framework (browser + API) |
| TypeScript (strict) | Language |
| `pg` | PostgreSQL client for DB integration tests |
| Supabase | Hosted PostgreSQL database (eu-west-1) |
| `@faker-js/faker` | Test data generation |
| `@axe-core/playwright` | Accessibility scanning |

---

## Setup

```bash
npm install
npx playwright install
```

For DB tests locally, create a `.env` file in the repo root:

```
SUPABASE_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

---

## Running tests

### Run everything
```bash
npm test
```

### Run by layer
```bash
npm run test:api        # L2 Integration — REST API tests (no browser)
npm run test:db         # L2 Integration — DB tests against Supabase
npm run test:e2e        # L3 E2E — Chromium
npx playwright test --project=firefox       # L3 E2E — Firefox
npm run test:mobile     # L3 E2E — Pixel 7 (mobile Chrome)
npx playwright test --project=visual        # Visual regression
npx playwright test --project=accessibility # Accessibility / WCAG 2 AA
npm run test:perf       # Performance — CDP + Core Web Vitals
```

### Run a specific file or test
```bash
npx playwright test tests/e2e/auth.spec.ts
npx playwright test tests/api/users.api.spec.ts
npx playwright test tests/db/products.db.spec.ts
npx playwright test --grep "login"
npx playwright test --grep-invert "slow"
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
npx playwright test --project=visual                   # compare against baselines
npx playwright test --project=visual --update-snapshots  # regenerate after intentional UI change
```

---

## Reports

```bash
npm run report:html     # open the built-in Playwright HTML report (last run)
```

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

|           Repo                     | Role                                                        |
|`playwright_app_mocking`            | App code. Unit tests live here. Developers open PRs here.   |
|`playwright_example_26` (this repo) | Test suite. Integration (API + DB) and E2E tests live here. |

---

### Branch hierarchy

Both repos follow the same promotion chain:

```
feature/* → dev → staging → main
```

`main` is production. `staging` is the release candidate. `dev` is the integration branch. Merging always goes in that direction.

---

### Testing pyramid

Every pipeline follows the same three-level structure:

```
L3  E2E              chromium + firefox (parallel)
     ↑ needs both L2 jobs green
L2  Integration      API tests  |  DB tests  (parallel)
     ↑ needs L1 green
L1  Unit             app_side_unit_tests.yml in playwright_app_mocking (trigger + wait)
```

Unit tests always run in the **app repo** on the branch being tested (`dev`, `staging`, or `main`).
Integration and E2E tests always run in **this repo**.

---

### Pipelines

#### 1. `daily-dev.yml` — Daily regression (08:00 Kyiv, every day)

Verifies the current state of `dev` every morning. Can also be triggered manually.

```
[cron 08:00 Kyiv / manual]
    │
    ▼
L1  Trigger app_side_unit_tests.yml on playwright_app_mocking @ dev — wait
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
```

#### 2. `dev-to-staging.yml` — Manual QA gate

Triggered manually by a QA engineer from the Actions tab before merging `dev → staging`.
Posts a commit status to `playwright_app_mocking` — the PR merge button stays blocked until this pipeline goes green.

```
[manual dispatch]
    │
    ▼
    Set playwright / staging-gate → pending on app repo dev HEAD
    │
    ▼
L1  Trigger app_side_unit_tests.yml on playwright_app_mocking @ dev — wait
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
    │
    ▼
    Set playwright / staging-gate → success ✓ (or failure ✗)
    → dev → staging PR merge button unblocked (or stays blocked)
```

#### 3. `staging-to-main.yml` — Deployment (09:00 Kyiv every Friday, or manual)

Runs the full pyramid against staging, then promotes staging to main via an auto-created PR with full audit trail. After merging, triggers `post-deploy.yml` automatically.

```
[cron Friday 09:00 Kyiv / manual]
    │
    ▼
L1  Trigger app_side_unit_tests.yml on playwright_app_mocking @ staging — wait
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
    │
    ▼
    Create PR staging → main in playwright_app_mocking, merge it
    │
    ▼
    Dispatch post-deploy.yml on main
```

#### 4. `post-deploy.yml` — Production verification

Triggered automatically by `staging-to-main.yml` after the merge, or manually at any time.

```
[dispatch from staging-to-main / manual]
    │
    ▼
L1  Trigger app_side_unit_tests.yml on playwright_app_mocking @ main — wait
    │
    ├──▶ L2  Integration / API   ──┐
    │                              ├──▶ L3  E2E chromium
    └──▶ L2  Integration / DB    ──┘    L3  E2E firefox
```

Artifacts retained for 60 days (vs 30 days in other pipelines).

#### 5. `on-dispatch.yml` — PR check (triggered by app repo)

Fires when a developer opens a PR in `playwright_app_mocking` targeting `dev`. Unit tests run on the app side first, then this workflow is dispatched. Posts the result back as a commit status — PR is blocked until all checks pass.

```
[repository_dispatch from playwright_app_mocking / manual]
    │
    ▼
L1  Unit (placeholder — unit tests already ran in app repo before dispatch)
    │
    ├──▶ L2  Integration / API (Cloudflare check; skipped with warning if blocked)
    │
    └──▶ L2  Integration / DB
    │
    ▼
L3  Smoke (placeholder — replace with npx playwright test --project=smoke)
    │
    ▼
    Post playwright / api-smoke → success or failure on app repo commit
```

---

### App repo flow (playwright_app_mocking)

#### PR on a feature branch

```
Developer opens PR: feature/* → dev

app_side_flow.yml fires:
  1. Unit tests run (placeholder, always passes)
  2. Dispatch → playwright_example_26 / on-dispatch.yml
  3. Full check result posted back as commit status
  4. Merge button unblocked when status is green
```

#### Merging dev → staging

```
Developer opens PR: dev → staging

app_side_staging_gate.yml fires immediately:
  → Posts playwright / staging-gate → pending
  → Merge button is blocked

QA engineer: playwright_example_26 → Actions → "Dev → Staging — manual QA gate" → Run workflow
  → Full pyramid runs (L1 unit → L2 integration → L3 E2E)
  → On success: posts playwright / staging-gate → success
  → Merge button unblocked
```

#### Merging staging → main

```
Automatically every Friday at 09:00 Kyiv, or triggered manually any time.

staging-to-main.yml:
  → Runs full pyramid on staging
  → Creates and merges PR staging → main (audit trail in PR history)
  → Dispatches post-deploy.yml to verify production
```

---

## Project structure

```
playwright-suite/
├── tests/
│   ├── e2e/            # UI tests — auth, products, cart, mocking
│   ├── api/            # REST API tests (*.api.spec.ts)
│   ├── db/             # Database tests against Supabase (*.db.spec.ts)
│   ├── visual/         # Screenshot regression
│   ├── accessibility/  # axe-core / WCAG 2 AA
│   └── performance/    # CDP metrics + Core Web Vitals
├── pages/              # Page Object Models
├── fixtures/           # Custom test fixtures (testUser, loggedInPage, …)
├── api-client/         # Typed AE REST API wrapper
├── test-data/          # userFactory() + faker helpers
└── utils/              # DB client (db-client.ts), a11y helpers
```

## Test projects explained

| Project | What runs | How to target |
|---|---|---|
| `chromium` | All E2E UI tests | `--project=chromium` |
| `firefox` | All E2E UI tests | `--project=firefox` |
| `mobile-chrome` | All E2E UI tests (Pixel 7) | `--project=mobile-chrome` |
| `api` | `*.api.spec.ts` files only — no browser | `--project=api` |
| `db` | `*.db.spec.ts` files — Supabase integration | `--project=db` |
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
