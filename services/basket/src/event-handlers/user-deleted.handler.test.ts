import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createUserDeletedHandler } from './user-deleted.handler.ts'

function createMockBasketRepo() {
  return {
    delete: mock.fn(async () => {}),
  }
}

function createMockLogger() {
  return { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn(), trace: mock.fn(), fatal: mock.fn(), child: mock.fn() }
}

describe('createUserDeletedHandler', () => {
  it('should delete basket for the deleted user', async () => {
    const basketRepo = createMockBasketRepo()
    const log = createMockLogger()

    const handler = createUserDeletedHandler({
      basketRepository: basketRepo as any,
      log: log as any,
    })

    await handler({
      id: 'evt-1',
      type: 'identity.user.deleted',
      timestamp: new Date().toISOString(),
      payload: { userId: 42 },
    })

    assert.equal(basketRepo.delete.mock.callCount(), 1)
    assert.equal(basketRepo.delete.mock.calls[0].arguments[0], '42')
  })

  it('should convert userId to string for basket lookup', async () => {
    const basketRepo = createMockBasketRepo()
    const log = createMockLogger()

    const handler = createUserDeletedHandler({
      basketRepository: basketRepo as any,
      log: log as any,
    })

    await handler({
      id: 'evt-2',
      type: 'identity.user.deleted',
      timestamp: new Date().toISOString(),
      payload: { userId: 123 },
    })

    const deletedKey = basketRepo.delete.mock.calls[0].arguments[0]
    assert.equal(typeof deletedKey, 'string')
    assert.equal(deletedKey, '123')
  })
})
