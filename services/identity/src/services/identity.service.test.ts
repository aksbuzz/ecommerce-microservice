import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { ConflictError, NotFoundError, UnauthorizedError } from '@ecommerce/shared'
import { IdentityService } from './identity.service.ts'

function createMockUserRepo() {
  return {
    findById: mock.fn(),
    findByEmail: mock.fn(),
    create: mock.fn(),
    update: mock.fn(),
    delete: mock.fn(),
  }
}

function createMockPasswordService() {
  return {
    hash: mock.fn(async () => 'salt:hashedpassword'),
    verify: mock.fn(async () => true),
  }
}

function createMockOutboxStore() {
  return {
    save: mock.fn(async () => {}),
    getUnpublished: mock.fn(async () => []),
    markPublished: mock.fn(async () => {}),
  }
}

function createMockSql() {
  return Object.assign(
    mock.fn(async () => []),
    { begin: mock.fn(async (cb: any) => cb({})) },
  )
}

function createMockEventBus() {
  return {
    connect: mock.fn(),
    publish: mock.fn(async () => {}),
    subscribe: mock.fn(),
    close: mock.fn(),
  }
}

describe('IdentityService', () => {
  let service: IdentityService
  let userRepo: ReturnType<typeof createMockUserRepo>
  let passwordService: ReturnType<typeof createMockPasswordService>
  let outboxStore: ReturnType<typeof createMockOutboxStore>
  let sql: ReturnType<typeof createMockSql>
  let eventBus: ReturnType<typeof createMockEventBus>

  beforeEach(() => {
    userRepo = createMockUserRepo()
    passwordService = createMockPasswordService()
    outboxStore = createMockOutboxStore()
    sql = createMockSql()
    eventBus = createMockEventBus()
    service = new IdentityService({
      userRepository: userRepo as any,
      passwordService: passwordService as any,
      eventBus: eventBus as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
    })
  })

  describe('register', () => {
    it('should register a new user', async () => {
      const input = { email: 'test@example.com', password: 'password123', name: 'John', lastName: 'Doe' }
      const created = { id: 1, email: input.email, name: input.name, lastName: input.lastName, createdAt: new Date().toISOString() }

      userRepo.findByEmail.mock.mockImplementation(async () => undefined)
      userRepo.create.mock.mockImplementation(async () => created)

      const result = await service.register(input)

      assert.equal(result.id, 1)
      assert.equal(result.email, 'test@example.com')
      assert.equal(passwordService.hash.mock.callCount(), 1)
      assert.equal(outboxStore.save.mock.callCount(), 1)
      const event = outboxStore.save.mock.calls[0].arguments[1]
      assert.equal(event.type, 'identity.user.registered')
    })

    it('should throw ConflictError if email already exists', async () => {
      userRepo.findByEmail.mock.mockImplementation(async () => ({ id: 1, email: 'test@example.com' }))

      await assert.rejects(
        () => service.register({ email: 'test@example.com', password: 'password123', name: 'John', lastName: 'Doe' }),
        (err: Error) => err instanceof ConflictError,
      )
    })
  })

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const user = {
        id: 1, email: 'test@example.com', name: 'John', lastName: 'Doe',
        passwordHash: 'salt:hashedpassword', createdAt: new Date().toISOString(),
      }
      userRepo.findByEmail.mock.mockImplementation(async () => user)
      passwordService.verify.mock.mockImplementation(async () => true)

      const result = await service.login({ email: 'test@example.com', password: 'password123' })

      assert.equal(result.id, 1)
      assert.equal(result.email, 'test@example.com')
      assert.equal((result as any).passwordHash, undefined)
    })

    it('should throw UnauthorizedError for non-existent email', async () => {
      userRepo.findByEmail.mock.mockImplementation(async () => undefined)

      await assert.rejects(
        () => service.login({ email: 'wrong@example.com', password: 'password123' }),
        (err: Error) => err instanceof UnauthorizedError,
      )
    })

    it('should throw UnauthorizedError for wrong password', async () => {
      const user = { id: 1, email: 'test@example.com', passwordHash: 'salt:hash' }
      userRepo.findByEmail.mock.mockImplementation(async () => user)
      passwordService.verify.mock.mockImplementation(async () => false)

      await assert.rejects(
        () => service.login({ email: 'test@example.com', password: 'wrongpassword' }),
        (err: Error) => err instanceof UnauthorizedError,
      )
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'John' }
      userRepo.findById.mock.mockImplementation(async () => user)

      const result = await service.getProfile(1)
      assert.deepEqual(result, user)
    })

    it('should throw NotFoundError for missing user', async () => {
      userRepo.findById.mock.mockImplementation(async () => undefined)

      await assert.rejects(
        () => service.getProfile(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updated = { id: 1, email: 'test@example.com', name: 'Jane', lastName: 'Doe' }
      userRepo.update.mock.mockImplementation(async () => updated)

      const result = await service.updateProfile(1, { name: 'Jane' })
      assert.equal(result.name, 'Jane')
    })

    it('should throw NotFoundError for non-existent user', async () => {
      userRepo.update.mock.mockImplementation(async () => undefined)

      await assert.rejects(
        () => service.updateProfile(999, { name: 'Jane' }),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('deleteAccount', () => {
    it('should delete user and save outbox event', async () => {
      userRepo.delete.mock.mockImplementation(async () => true)

      await service.deleteAccount(1)

      assert.equal(userRepo.delete.mock.callCount(), 1)
      assert.equal(outboxStore.save.mock.callCount(), 1)
      const event = outboxStore.save.mock.calls[0].arguments[1]
      assert.equal(event.type, 'identity.user.deleted')
    })

    it('should throw NotFoundError for non-existent user', async () => {
      userRepo.delete.mock.mockImplementation(async () => false)

      await assert.rejects(
        () => service.deleteAccount(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })
})
