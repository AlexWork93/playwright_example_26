import { test, expect } from '../../fixtures'
import { userFactory } from '../../test-data/factories'

// ─────────────────────────────────────────────────────────────────────────────
// User Account API Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('User Account API', () => {

  // ── CREATE ──────────────────────────────────────────────────────────────────

  test('POST /api/createAccount creates a new user and returns 201', async ({ apiClient }) => {
    const user = userFactory()

    let createRes: Awaited<ReturnType<typeof apiClient.createAccount>>

    await test.step('POST /api/createAccount', async () => {
      createRes = await apiClient.createAccount(user)
    })

    await test.step('Verify 201 Created', async () => {
      expect(createRes.responseCode).toBe(201)
      expect(createRes.message).toMatch(/user created/i)
    })

    await test.step('Clean up — delete test account', async () => {
      await apiClient.deleteAccount({ email: user.email, password: user.password })
    })
  })

  test('creating a duplicate account returns 400', async ({ apiClient, testUser }) => {
    let res: Awaited<ReturnType<typeof apiClient.createAccount>>

    await test.step('POST /api/createAccount with duplicate email', async () => {
      res = await apiClient.createAccount(testUser)
    })

    await test.step('Verify 400 and duplicate-email message', async () => {
      expect(res.responseCode).toBe(400)
      expect(res.message).toMatch(/email already exist/i)
    })
  })

  // ── READ ────────────────────────────────────────────────────────────────────

  test('GET /api/getUserDetailByEmail returns user details', async ({ apiClient, testUser }) => {
    let res: Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('GET /api/getUserDetailByEmail', async () => {
      res = await apiClient.getUserByEmail(testUser.email)
    })

    await test.step('Verify profile fields match creation payload', async () => {
      expect(res.responseCode).toBe(200)
      expect(res.user.email).toBe(testUser.email)
      expect(res.user.first_name).toBe(testUser.firstname)
      expect(res.user.last_name).toBe(testUser.lastname)
    })
  })

  test('GET /api/getUserDetailByEmail with unknown email returns 404', async ({ apiClient }) => {
    const unknownEmail = 'nobody-exists@noreply.dev'
    let res: Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('GET /api/getUserDetailByEmail with unknown email', async () => {
      res = await apiClient.getUserByEmail(unknownEmail)
    })

    await test.step('Verify 404 response', async () => {
      expect(res.responseCode).toBe(404)
    })
  })

  // ── VERIFY LOGIN ────────────────────────────────────────────────────────────

  test('POST /api/verifyLogin succeeds with correct credentials', async ({ apiClient, testUser }) => {
    let res: Awaited<ReturnType<typeof apiClient.verifyLogin>>

    await test.step('POST /api/verifyLogin with correct credentials', async () => {
      res = await apiClient.verifyLogin({ email: testUser.email, password: testUser.password })
    })

    await test.step('Verify 200 and success message', async () => {
      expect(res.responseCode).toBe(200)
      expect(res.message).toMatch(/user exists/i)
    })
  })

  test('POST /api/verifyLogin fails with wrong password', async ({ apiClient, testUser }) => {
    let res: Awaited<ReturnType<typeof apiClient.verifyLogin>>

    await test.step('POST /api/verifyLogin with wrong password', async () => {
      res = await apiClient.verifyLogin({ email: testUser.email, password: 'definitely-wrong' })
    })

    await test.step('Verify 404 and user-not-found message', async () => {
      expect(res.responseCode).toBe(404)
      expect(res.message).toMatch(/user not found/i)
    })
  })

  // ── UPDATE ──────────────────────────────────────────────────────────────────

  test('PUT /api/updateAccount updates user details', async ({ apiClient, testUser }) => {
    const updated = { ...testUser, firstname: 'Updated', city: 'New York' }

    let updateRes: Awaited<ReturnType<typeof apiClient.updateAccount>>
    let fetchRes:  Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('PUT /api/updateAccount', async () => {
      updateRes = await apiClient.updateAccount(updated)
    })

    await test.step('Verify 200 and updated message', async () => {
      expect(updateRes.responseCode).toBe(200)
      expect(updateRes.message).toMatch(/user updated/i)
    })

    await test.step('GET user — verify changes persisted', async () => {
      fetchRes = await apiClient.getUserByEmail(testUser.email)
    })

    await test.step('Verify new values are returned by GET', async () => {
      expect(fetchRes.user.first_name).toBe('Updated')
      expect(fetchRes.user.city).toBe('New York')
    })
  })

  // ── DELETE ──────────────────────────────────────────────────────────────────

  test('DELETE /api/deleteAccount removes the user', async ({ apiClient }) => {
    const user = userFactory()

    let deleteRes: Awaited<ReturnType<typeof apiClient.deleteAccount>>
    let fetchRes:  Awaited<ReturnType<typeof apiClient.getUserByEmail>>

    await test.step('Create a user to delete', async () => {
      const createRes = await apiClient.createAccount(user)
      expect(createRes.responseCode).toBe(201)
    })

    await test.step('DELETE /api/deleteAccount', async () => {
      deleteRes = await apiClient.deleteAccount({ email: user.email, password: user.password })
    })

    await test.step('Verify 200 and deletion message', async () => {
      expect(deleteRes.responseCode).toBe(200)
      expect(deleteRes.message).toMatch(/account deleted/i)
    })

    await test.step('GET user — verify account no longer exists', async () => {
      fetchRes = await apiClient.getUserByEmail(user.email)
    })

    await test.step('Verify 404 on deleted account', async () => {
      expect(fetchRes.responseCode).toBe(404)
    })
  })

})
