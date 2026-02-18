import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import postgres from 'postgres'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

async function seed() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgres://ecommerce:ecommerce_pass@localhost:5432/ecommerce_identity'

  const sql = postgres(databaseUrl)

  const email = 'admin@ecommerce.com'
  const password = 'Admin123!'
  const name = 'Admin'
  const lastName = 'User'

  const passwordHash = await hashPassword(password)

  await sql`
    INSERT INTO users (email, password_hash, name, last_name)
    VALUES (${email}, ${passwordHash}, ${name}, ${lastName})
    ON CONFLICT (email)
    DO UPDATE SET password_hash = ${passwordHash}
  `

  console.log('Admin user seeded!')
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)

  await sql.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
