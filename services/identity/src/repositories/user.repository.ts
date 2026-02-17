import type { Sql } from '@ecommerce/db'
import type { RegisterInput, UpdateProfileInput, User } from '../schemas/user.schema.ts'

interface Deps {
  sql: Sql
}

interface UserRow extends User {
  passwordHash: string
}

export class UserRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findById(id: number): Promise<User | undefined> {
    const [row] = await this.sql<User[]>`
      SELECT id, email, name, last_name as "lastName",
        street, city, state, country, zip_code as "zipCode",
        created_at as "createdAt"
      FROM users WHERE id = ${id}
    `
    return row
  }

  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [row] = await this.sql<UserRow[]>`
      SELECT id, email, name, last_name as "lastName",
        password_hash as "passwordHash",
        street, city, state, country, zip_code as "zipCode",
        created_at as "createdAt"
      FROM users WHERE email = ${email}
    `
    return row
  }

  async create(data: RegisterInput & { passwordHash: string }): Promise<User> {
    const [row] = await this.sql<User[]>`
      INSERT INTO users (email, password_hash, name, last_name)
      VALUES (${data.email}, ${data.passwordHash}, ${data.name}, ${data.lastName})
      RETURNING id, email, name, last_name as "lastName",
        street, city, state, country, zip_code as "zipCode",
        created_at as "createdAt"
    `
    return row
  }

  async update(id: number, data: UpdateProfileInput): Promise<User | undefined> {
    const sets = []
    if (data.name !== undefined) sets.push(this.sql`name = ${data.name}`)
    if (data.lastName !== undefined) sets.push(this.sql`last_name = ${data.lastName}`)
    if (data.street !== undefined) sets.push(this.sql`street = ${data.street}`)
    if (data.city !== undefined) sets.push(this.sql`city = ${data.city}`)
    if (data.state !== undefined) sets.push(this.sql`state = ${data.state}`)
    if (data.country !== undefined) sets.push(this.sql`country = ${data.country}`)
    if (data.zipCode !== undefined) sets.push(this.sql`zip_code = ${data.zipCode}`)

    if (sets.length === 0) return this.findById(id)

    const [row] = await this.sql<User[]>`
      UPDATE users
      SET ${sets.reduce((a, b) => this.sql`${a}, ${b}`)}
      WHERE id = ${id}
      RETURNING id, email, name, last_name as "lastName",
        street, city, state, country, zip_code as "zipCode",
        created_at as "createdAt"
    `
    return row
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.sql`DELETE FROM users WHERE id = ${id}`
    return result.count > 0
  }
}
