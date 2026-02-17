import type { Sql } from '@ecommerce/db'
import type { EventBus } from '@ecommerce/event-bus'
import type { OutboxStore } from '@ecommerce/outbox'
import { ConflictError, NotFoundError, UnauthorizedError } from '@ecommerce/shared'
import type { UserRepository } from '../repositories/user.repository.ts'
import type { LoginInput, RegisterInput, UpdateProfileInput } from '../schemas/user.schema.ts'
import type { PasswordService } from './password.service.ts'

interface Deps {
  userRepository: UserRepository
  passwordService: PasswordService
  eventBus: EventBus
  outboxStore: OutboxStore
  sql: Sql
}

export class IdentityService {
  userRepository: UserRepository
  passwordService: PasswordService
  eventBus: EventBus
  outboxStore: OutboxStore
  sql: Sql

  constructor({ userRepository, passwordService, eventBus, outboxStore, sql }: Deps) {
    this.userRepository = userRepository
    this.passwordService = passwordService
    this.eventBus = eventBus
    this.outboxStore = outboxStore
    this.sql = sql
  }

  async register(data: RegisterInput) {
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) throw new ConflictError(`Email '${data.email}' is already registered`)

    const passwordHash = await this.passwordService.hash(data.password)
    const user = await this.userRepository.create({ ...data, passwordHash })

    await this.outboxStore.save(this.sql, {
      id: crypto.randomUUID(),
      type: 'identity.user.registered',
      timestamp: new Date().toISOString(),
      payload: { userId: user.id, email: user.email },
    })

    return user
  }

  async login(data: LoginInput) {
    const user = await this.userRepository.findByEmail(data.email)
    if (!user) throw new UnauthorizedError('Invalid email or password')

    const valid = await this.passwordService.verify(data.password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid email or password')

    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new NotFoundError('User', userId)
    return user
  }

  async updateProfile(userId: number, data: UpdateProfileInput) {
    const user = await this.userRepository.update(userId, data)
    if (!user) throw new NotFoundError('User', userId)
    return user
  }

  async deleteAccount(userId: number) {
    const deleted = await this.userRepository.delete(userId)
    if (!deleted) throw new NotFoundError('User', userId)

    await this.outboxStore.save(this.sql, {
      id: crypto.randomUUID(),
      type: 'identity.user.deleted',
      timestamp: new Date().toISOString(),
      payload: { userId },
    })
  }
}
