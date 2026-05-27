import { faker } from '@faker-js/faker'
import type { CreateAccountPayload } from '../api-client/types'

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories
// ─────────────────────────────────────────────────────────────────────────────

const uniqueTag = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function userFactory(overrides: Partial<CreateAccountPayload> = {}): CreateAccountPayload {
  const firstName = faker.person.firstName()
  const lastName  = faker.person.lastName()

  return {
    name:          `${firstName} ${lastName}`,
    email:         `test-${uniqueTag()}@playwright.dev`,
    password:      faker.internet.password({ length: 12, memorable: false }),
    title:         faker.helpers.arrayElement(['Mr', 'Mrs'] as const),
    birth_date:    faker.number.int({ min: 1, max: 28 }).toString(),
    birth_month:   faker.number.int({ min: 1, max: 12 }).toString(),
    birth_year:    faker.number.int({ min: 1970, max: 2000 }).toString(),
    firstname:     firstName,
    lastname:      lastName,
    company:       faker.company.name(),
    address1:      faker.location.streetAddress(),
    address2:      faker.location.secondaryAddress(),
    country:       'United States',
    zipcode:       faker.location.zipCode('#####'),
    state:         faker.location.state(),
    city:          faker.location.city(),
    mobile_number: faker.phone.number({ style: 'national' }),
    ...overrides,
  }
}

export interface Credentials {
  email:    string
  password: string
}

export function credentialsFrom(user: CreateAccountPayload): Credentials {
  return { email: user.email, password: user.password }
}
