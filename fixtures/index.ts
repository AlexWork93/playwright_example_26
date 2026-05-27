import { test as base, expect, type Page } from '@playwright/test'
import { AEClient } from '../api-client/AEClient'
import { userFactory, credentialsFrom, type Credentials } from '../test-data/factories'
import type { CreateAccountPayload } from '../api-client/types'
import { LoginPage } from '../pages/LoginPage'
import { HomePage } from '../pages/HomePage'

// ─────────────────────────────────────────────────────────────────────────────
// Custom Fixtures
// ─────────────────────────────────────────────────────────────────────────────

export type Fixtures = {
  apiClient: AEClient
  testUser: CreateAccountPayload
  userCredentials: Credentials
  loggedInPage: Page
}

export const test = base.extend<Fixtures>({

  // ── apiClient ──────────────────────────────────────────────────────────────
  apiClient: async ({ request }, use) => {
    await use(new AEClient(request))
  },

  // ── testUser ───────────────────────────────────────────────────────────────
  // Works for both API tests and E2E tests.
  testUser: async ({ apiClient }, use) => {
    const user = userFactory()
    const res  = await apiClient.createAccount(user)
    if (res.responseCode !== 201) {
      throw new Error(`testUser fixture: createAccount failed — ${res.message}`)
    }

    await use(user)

    // Teardown always runs, even if the test fails
    await apiClient.deleteAccount({ email: user.email, password: user.password })
      .catch((err) => console.warn('testUser teardown warning:', err))
  },

  // ── userCredentials ────────────────────────────────────────────────────────
  userCredentials: async ({ testUser }, use) => {
    await use(credentialsFrom(testUser))
  },

  loggedInPage: async ({ page, testUser }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWith(testUser.email, testUser.password)

    // Wait for successful redirect to home confirms session is active
    await page.waitForURL('/')

    // At this point page has a live authenticated session.
    // We pass the same `page` object the test can navigate anywhere from here.
    await use(page)

    // No teardown here testUser fixture handles account deletion,
  },
})

export { expect }
