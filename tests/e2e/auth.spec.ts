import { test, expect } from '../../fixtures'
import { allure } from 'allure-playwright'
import { LoginPage } from '../../pages/LoginPage'
import { SignupPage } from '../../pages/SignupPage'
import { AccountCreatedPage } from '../../pages/AccountCreatedPage'
import { HomePage } from '../../pages/HomePage'
import { userFactory } from '../../test-data/factories'

// ─────────────────────────────────────────────────────────────────────────────
// Auth E2E Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login', () => {

  test('valid credentials logs in and shows username in nav', async ({ page, testUser }) => {
    await allure.epic('Authentication')
    await allure.feature('Login')
    await allure.story('Happy path')
    await allure.severity('critical')
    await allure.description(
      'A registered user submits correct credentials and is redirected to the homepage. ' +
      'The navbar must show "Logged in as <name>" to confirm the session is active.'
    )
    await allure.owner('qa-team')
    await allure.tags('smoke', 'auth', 'login')

    const loginPage = new LoginPage(page)
    const homePage  = new HomePage(page)

    await test.step('Open the login page', async () => {
      await loginPage.goto()
    })

    await test.step('Submit valid credentials', async () => {
      await loginPage.loginWith(testUser.email, testUser.password)
    })

    await test.step('Verify redirect to homepage', async () => {
      await expect(page).toHaveURL('/')
    })

    await test.step('Verify username appears in the navbar', async () => {
      await expect(homePage.loggedInAs).toBeVisible()
      const username = await homePage.getLoggedInUsername()
      expect(username).toBe(testUser.name)
    })
  })

  test('wrong password shows error message', async ({ page, testUser }) => {
    await allure.epic('Authentication')
    await allure.feature('Login')
    await allure.story('Wrong password')
    await allure.severity('critical')
    await allure.description(
      'Submitting the correct email with a wrong password must keep the user on /login ' +
      'and display an inline error message — no redirect should occur.'
    )
    await allure.tags('auth', 'login', 'negative')

    const loginPage = new LoginPage(page)

    await test.step('Open the login page', async () => {
      await loginPage.goto()
    })

    await test.step('Submit wrong password', async () => {
      await loginPage.loginWith(testUser.email, 'completely-wrong-password')
    })

    await test.step('Verify error state — still on /login', async () => {
      await expect(page).toHaveURL('/login')
      await expect(loginPage.loginErrorMessage).toBeVisible()
    })
  })

  test('unknown email shows error message', async ({ page }) => {
    await allure.epic('Authentication')
    await allure.feature('Login')
    await allure.story('Unknown email')
    await allure.severity('normal')
    await allure.description(
      'Attempting to log in with an email that has no account must show an error — ' +
      'the server must not hint whether the email exists (no user enumeration).'
    )
    await allure.tags('auth', 'login', 'negative')

    const loginPage = new LoginPage(page)

    await test.step('Open the login page', async () => {
      await loginPage.goto()
    })

    await test.step('Submit unknown email', async () => {
      await loginPage.loginWith('nobody@nonexistent-domain-xyz.dev', 'anypassword')
    })

    await test.step('Verify error is shown', async () => {
      await expect(page).toHaveURL('/login')
      await expect(loginPage.loginErrorMessage).toBeVisible()
    })
  })

})

test.describe('Logout', () => {

  test('logged-in user can log out', async ({ loggedInPage }) => {
    await allure.epic('Authentication')
    await allure.feature('Logout')
    await allure.story('Happy path')
    await allure.severity('critical')
    await allure.description(
      'An authenticated user clicks logout and is redirected to /login. ' +
      'The navbar must no longer show the username — session must be cleared.'
    )
    await allure.tags('smoke', 'auth', 'logout')

    const homePage = new HomePage(loggedInPage)

    await test.step('Confirm authenticated state', async () => {
      await expect(homePage.loggedInAs).toBeVisible()
    })

    await test.step('Click logout', async () => {
      await homePage.logout()
    })

    await test.step('Verify session is cleared', async () => {
      await expect(loggedInPage).toHaveURL('/login')
      await expect(homePage.loggedInAs).toBeHidden()
      await expect(homePage.navSignupLogin).toBeVisible()
    })
  })

})

test.describe('Signup (full UI flow)', () => {

  test('new user can register through the UI and land on home page', async ({ page, apiClient }) => {
    await allure.epic('Authentication')
    await allure.feature('Registration')
    await allure.story('Full UI signup flow')
    await allure.severity('blocker')
    await allure.description(
      'End-to-end signup: enter name + email on /login → fill full registration form → ' +
      'account_created confirmation → continue to homepage already logged in. ' +
      'This is the most critical user journey — if it breaks, no new users can join.'
    )
    await allure.owner('qa-team')
    await allure.tags('smoke', 'auth', 'signup', 'e2e')

    const user                = userFactory()
    const loginPage           = new LoginPage(page)
    const signupPage          = new SignupPage(page)
    const accountCreatedPage  = new AccountCreatedPage(page)
    const homePage            = new HomePage(page)

    // Capture the generated email for easy identification in the Allure report
    await allure.parameter('email', user.email)
    await allure.parameter('name',  user.name)

    await test.step('Initiate signup — enter name + email on /login', async () => {
      await loginPage.goto()
      await loginPage.initiateSignup(user.name, user.email)
      await expect(page).toHaveURL('/signup')
    })

    await test.step('Complete registration form on /signup', async () => {
      await signupPage.register(user)
    })

    await test.step('Verify account_created confirmation page', async () => {
      await expect(page).toHaveURL('/account_created')
      await expect(accountCreatedPage.heading).toBeVisible()
    })

    await test.step('Continue to homepage — verify logged-in state', async () => {
      await accountCreatedPage.continue()
      await expect(page).toHaveURL('/')
      await expect(homePage.loggedInAs).toBeVisible()
    })

    await test.step('Clean up — delete test account via API', async () => {
      await apiClient.deleteAccount({ email: user.email, password: user.password })
    })
  })

  test('trying to register with an already-used email shows error', async ({ page, testUser }) => {
    await allure.epic('Authentication')
    await allure.feature('Registration')
    await allure.story('Duplicate email')
    await allure.severity('critical')
    await allure.description(
      'Attempting to register with an email that already has an account must ' +
      'show an inline error on the signup form — the user must not reach /account_created.'
    )
    await allure.tags('auth', 'signup', 'negative')

    await allure.parameter('email', testUser.email)

    const loginPage = new LoginPage(page)

    await test.step('Open login page and fill duplicate email', async () => {
      await loginPage.goto()
      await loginPage.signupEmailInput.fill(testUser.email)
      await loginPage.signupNameInput.fill('Any Name')
    })

    await test.step('Submit signup form', async () => {
      await loginPage.signupButton.click()
    })

    await test.step('Verify duplicate email error is shown', async () => {
      await expect(page.getByText(/email address already exist/i)).toBeVisible()
      await expect(page).not.toHaveURL('/account_created')
    })
  })

})
