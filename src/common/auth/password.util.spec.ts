import { hashPassword, verifyPassword } from './password.util'

describe('password.util', () => {
  it('hashes and verifies plain text passwords', async () => {
    const password = 'Admin@123456'
    const passwordHash = await hashPassword(password)

    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', passwordHash)).resolves.toBe(false)
  })
})
