import { test, expect } from '../../fixtures'
import { allure } from 'allure-playwright'
import { userFactory } from '../../test-data/factories'

// ─────────────────────────────────────────────────────────────────────────────
// User Account API Tests — with Allure steps + attachments
// ─────────────────────────────────────────────────────────────────────────────

/** Attach a JSON object as a formatted response body to the current step. */
async function attachJson(name: string, data: unknown): Promise<void> {
  await allure.attachment(name, JSON.stringify(data, null, 2), 'application/json')
}

test.describe('User Account API', () => {

  // ── CREATE ──────────────────────────────────────────────────────────────────

  test('POST /api/createAccount creates a new user and returns 201', async ({ apiClient }) => {
    await allure.epic('User Management')
    await allure.feature('Account CRUD')
    await allure.story('Create account')
    await allure.severity('blocker')
    await allure.description(
      'The create-account endpoint must return 201 and a "User Created!" message. ' +
      'This is the foundational operation — if it breaks, every test using testUser fails.'
    )
    await allure.tags('api', 'users', 'create', 'smoke')

    const user = userFactory()
    await allure.parameter('email', user.email)

    let createRes: Awaited<ReturnType<typeof apiClient.createAccount>>

    await test.step('POST /api/createAccount', async () => {
      createRes = await apiClient.createAccount(user)
      await attachJson('Response', createRes)
    })

    await test.step('Verify 201 Created', async () => {
      expect(createRes.responseCode).toBe(201)
      expect(createRes.message).toMatch(/user created/i)
    })

    await test.step('Clean up — delete test account', async () => {
      const deleteRes = await apiClient.deleteAccount({ email: user.email, password: user.password })
      await attachJson('Delete response', deleteRes)
    })
  })

  test('creating a duplicate account returns 400', async ({ apiClient, testUser }) => {
    await allure.epic('User Management')
    await allure.feature('Account CRUD')
    await allure.story('Duplicate email rejected')
    await allure.severity('critical')
    await allure.description(
      'Registering the same email twice must return 400 with an "Email already exists" message. ' +
      'The server must not create a second account or return 500.'
    )
    await allure.tags('api', 'users', 'create', 'negative')
    await allure.parameter('email', testUser.email)

    let res: Awaited<ReturnType<typeof apiClient.createAccount>>

    await test.step('POST /api/createAccount with duplicate email', async () => {
      res = await apiClient.createAccount(testUser)
      await attachJson('Response', res)
    })

    await test.step('Verify 400 and duplicate-email message', async () => {
      expect(res.responseCode).toBe(400)
      expect(res.message).toMatch(/email already exist/i)
    })
  })

  // ── READ ────────────────────────────────────────────────────────────────────

  test('GET /api/getUserDetailByEmail returns user details', async ({ apiClient, testUser }) => {
    await allure.epic('User Management')
    await allure.feature('Account CRUD')
    await allure.story('Read account')
    await allure.severity('critical')
    await allure.description(
      'Fetching a user by email must return 200 with all profile fields matching ' +
      'the values used during account creation.'
    )
    await allure.tags('api', 'users', 'read')
    await allure.parameter('email', testUser.email)

    let res: Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('GET /api/getUserDetailByEmail', async () => {
      res = await apiClient.getUserByEmail(testUser.email)
      await attachJson('Response', res)
    })

    await test.step('Verify profile fields match creation payload', async () => {
      expect(res.responseCode).toBe(200)
      expect(res.user.email).toBe(testUser.email)
      expect(res.user.first_name).toBe(testUser.firstname)
      expect(res.user.last_name).toBe(testUser.lastname)
    })
  })

  test('GET /api/getUserDetailByEmail with unknown email returns 404', async ({ apiClient }) => {
    await allure.epic('User Management')
    await allure.feature('Account CRUD')
    await allure.story('Read non-existent account')
    await allure.severity('normal')
    await allure.description('Fetching a user that does not exist must return 404, not 500.')
    await allure.tags('api', 'users', 'read', 'negative')

    const unknownEmail = 'nobody-exists@noreply.dev'
    await allure.parameter('email', unknownEmail)

    let res: Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('GET /api/getUserDetailByEmail with unknown email', async () => {
      res = await apiClient.getUserByEmail(unknownEmail)
      await attachJson('Response', res)
    })

    await test.step('Verify 404 response', async () => {
      expect(res.responseCode).toBe(404)
    })
  })

  // ── VERIFY LOGIN ────────────────────────────────────────────────────────────

  test('POST /api/verifyLogin succeeds with correct credentials', async ({ apiClient, testUser }) => {
    await allure.epic('User Management')
    await allure.feature('Authentication API')
    await allure.story('Valid credentials')
    await allure.severity('critical')
    await allure.description('Correct email + password must return 200 with "User exists!" message.')
    await allure.tags('api', 'auth', 'login')
    await allure.parameter('email', testUser.email)

    let res: Awaited<ReturnType<typeof apiClient.verifyLogin>>

    await test.step('POST /api/verifyLogin with correct credentials', async () => {
      res = await apiClient.verifyLogin({ email: testUser.email, password: testUser.password })
      await attachJson('Response', res)
    })

    await test.step('Verify 200 and success message', async () => {
      expect(res.responseCode).toBe(200)
      expect(res.message).toMatch(/user exists/i)
    })
  })

  test('POST /api/verifyLogin fails with wrong password', async ({ apiClient, testUser }) => {
    await allure.epic('User Management')
    await allure.feature('Authentication API')
    await allure.story('Wrong password')
    await allure.severity('critical')
    await allure.description('A wrong password must return 404 — not 401, not 500, not 200.')
    await allure.tags('api', 'auth', 'login', 'negative')
    await allure.parameter('email', testUser.email)

    let res: Awaited<ReturnType<typeof apiClient.verifyLogin>>

    await test.step('POST /api/verifyLogin with wrong password', async () => {
      res = await apiClient.verifyLogin({ email: testUser.email, password: 'definitely-wrong' })
      await attachJson('Response', res)
    })

    await test.step('Verify 404 and user-not-found message', async () => {
      expect(res.responseCode).toBe(404)
      expect(res.message).toMatch(/user not found/i)
    })
  })

  // ── UPDATE ──────────────────────────────────────────────────────────────────

  test('PUT /api/updateAccount updates user details', async ({ apiClient, testUser }) => {
    await allure.epic('User Management')
    await allure.feature('Account CRUD')
    await allure.story('Update account')
    await allure.severity('normal')
    await allure.description(
      'Updating firstname and city must return 200. ' +
      'A subsequent GET must reflect the new values — verifying persistence, not just the response.'
    )
    await allure.tags('api', 'users', 'update')
    await allure.parameter('email', testUser.email)

    const updated = { ...testUser, firstname: 'Updated', city: 'New York' }
    await allure.parameter('new firstName', updated.firstname)
    await allure.parameter('new city',      updated.city)

    let updateRes: Awaited<ReturnType<typeof apiClient.updateAccount>>
    let fetchRes:  Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('PUT /api/updateAccount', async () => {
      updateRes = await apiClient.updateAccount(updated)
      await attachJson('Update response', updateRes)
    })

    await test.step('Verify 200 and updated message', async () => {
      expect(updateRes.responseCode).toBe(200)
      expect(updateRes.message).toMatch(/user updated/i)
    })

    await test.step('GET user — verify changes persisted', async () => {
      fetchRes = await apiClient.getUserByEmail(testUser.email)
      await attachJson('Fetch response', fetchRes)
    })

    await test.step('Verify new values are returned by GET', async () => {
      expect(fetchRes.user.first_name).toBe('Updated')
      expect(fetchRes.user.city).toBe('New York')
    })
  })

  // ── DELETE ──────────────────────────────────────────────────────────────────

  test('DELETE /api/deleteAccount removes the user', async ({ apiClient }) => {
    await allure.epic('User Management')
    await allure.feature('Account CRUD')
    await allure.story('Delete account')
    await allure.severity('normal')
    await allure.description(
      'After deletion the account must be gone: DELETE returns 200, ' +
      'and a subsequent GET for the same email must return 404.'
    )
    await allure.tags('api', 'users', 'delete')

    const user = userFactory()
    await allure.parameter('email', user.email)

    let deleteRes: Awaited<ReturnType<typeof apiClient.deleteAccount>>
    let fetchRes:  Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('Create a user to delete', async () => {
      const createRes = await apiClient.createAccount(user)
      await attachJson('Create response', createRes)
      expect(createRes.responseCode).toBe(201)
    })

    await test.step('DELETE /api/deleteAccount', async () => {
      deleteRes = await apiClient.deleteAccount({ email: user.email, password: user.password })
      await attachJson('Delete response', deleteRes)
    })

    await test.step('Verify 200 and deletion message', async () => {
      expect(deleteRes.responseCode).toBe(200)
      expect(deleteRes.message).toMatch(/account deleted/i)
    })

    await test.step('GET user — verify account no longer exists', async () => {
      fetchRes = await apiClient.getUserByEmail(user.email)
      await attachJson('Fetch response (post-delete)', fetchRes)
    })

    await test.step('Verify 404 on deleted account', async () => {
      expect(fetchRes.responseCode).toBe(404)
    })
  })

})
