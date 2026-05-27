import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import type { CreateAccountPayload } from '../api-client/types'

// ─────────────────────────────────────────────────────────────────────────────
// SignupPage - /signup  (the full registration form reached after initiating
// signup on the LoginPage)
// ─────────────────────────────────────────────────────────────────────────────

export class SignupPage extends BasePage {
  readonly url = '/signup'

  // Account information section
  readonly titleMr:       Locator
  readonly titleMrs:      Locator
  readonly passwordInput: Locator
  readonly birthDay:      Locator
  readonly birthMonth:    Locator
  readonly birthYear:     Locator
  readonly newsletterCheckbox: Locator
  readonly offersCheckbox:     Locator

  // Address section
  readonly firstNameInput:    Locator
  readonly lastNameInput:     Locator
  readonly companyInput:      Locator
  readonly address1Input:     Locator
  readonly address2Input:     Locator
  readonly countrySelect:     Locator
  readonly stateInput:        Locator
  readonly cityInput:         Locator
  readonly zipcodeInput:      Locator
  readonly mobileNumberInput: Locator

  // Submit
  readonly createAccountButton: Locator

  constructor(page: Page) {
    super(page)

    this.titleMr  = page.locator('#id_gender1')
    this.titleMrs = page.locator('#id_gender2')

    this.passwordInput    = page.getByTestId('password')
    this.birthDay         = page.getByTestId('days')
    this.birthMonth       = page.getByTestId('months')
    this.birthYear        = page.getByTestId('years')
    this.newsletterCheckbox = page.locator('#newsletter')
    this.offersCheckbox     = page.locator('#optin')

    this.firstNameInput    = page.getByTestId('first_name')
    this.lastNameInput     = page.getByTestId('last_name')
    this.companyInput      = page.getByTestId('company')
    this.address1Input     = page.getByTestId('address')
    this.address2Input     = page.getByTestId('address2')
    this.countrySelect     = page.getByTestId('country')
    this.stateInput        = page.getByTestId('state')
    this.cityInput         = page.getByTestId('city')
    this.zipcodeInput      = page.getByTestId('zipcode')
    this.mobileNumberInput = page.getByTestId('mobile_number')
    this.createAccountButton = page.getByTestId('create-account')
  }

  async fillForm(user: CreateAccountPayload): Promise<void> {
    // Title radio
    if (user.title === 'Mr') {
      await this.titleMr.check()
    } else {
      await this.titleMrs.check()
    }

    await this.passwordInput.fill(user.password)

    // Date of birth dropdowns (select by visible value)
    await this.birthDay.selectOption(user.birth_date)
    await this.birthMonth.selectOption(user.birth_month)
    await this.birthYear.selectOption(user.birth_year)

    // Address details
    await this.firstNameInput.fill(user.firstname)
    await this.lastNameInput.fill(user.lastname)
    if (user.company) await this.companyInput.fill(user.company)
    await this.address1Input.fill(user.address1)
    if (user.address2) await this.address2Input.fill(user.address2)
    await this.countrySelect.selectOption(user.country)
    await this.stateInput.fill(user.state)
    await this.cityInput.fill(user.city)
    await this.zipcodeInput.fill(user.zipcode)
    await this.mobileNumberInput.fill(user.mobile_number)
  }

  async submit(): Promise<void> {
    await this.createAccountButton.click()
    await this.page.waitForURL('/account_created')
  }

  async register(user: CreateAccountPayload): Promise<void> {
    await this.fillForm(user)
    await this.submit()
  }
}
