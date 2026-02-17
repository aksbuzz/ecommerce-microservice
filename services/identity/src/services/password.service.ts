import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const SALT_LENGTH = 32
const KEY_LENGTH = 64

export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex')
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
    return `${salt}:${derivedKey.toString('hex')}`
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':')
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
    const keyBuffer = Buffer.from(key, 'hex')
    return timingSafeEqual(derivedKey, keyBuffer)
  }
}
