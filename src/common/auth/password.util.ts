import { Buffer } from 'node:buffer'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const SALT_LENGTH = 16
const KEY_LENGTH = 64

export const hashPassword = async (password: string) => {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer

  return `${salt}:${derivedKey.toString('hex')}`
}

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) {
    return false
  }

  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer
  const storedBuffer = Buffer.from(storedHash, 'hex')

  if (derivedKey.length !== storedBuffer.length) {
    return false
  }

  return timingSafeEqual(derivedKey, storedBuffer)
}
