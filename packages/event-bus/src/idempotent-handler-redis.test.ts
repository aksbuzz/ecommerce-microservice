import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { idempotentHandlerRedis } from './idempotent-handler-redis.ts'

function createMockRedis(setResult: string | null = 'OK') {
  return {
    set: mock.fn(async () => setResult),
    del: mock.fn(async () => 1),
  }
}

function makeEvent(id = 'evt-1') {
  return {
    id,
    type: 'test.event',
    timestamp: new Date().toISOString(),
    payload: { data: 'test' },
  }
}

describe('idempotentHandlerRedis', () => {
  it('should call handler on first event processing', async () => {
    const redis = createMockRedis('OK')
    const innerHandler = mock.fn(async () => {})
    const handler = idempotentHandlerRedis(redis as any, innerHandler)

    await handler(makeEvent())

    assert.equal(innerHandler.mock.callCount(), 1)
    assert.equal(redis.set.mock.callCount(), 1)
    assert.equal(redis.del.mock.callCount(), 0)
  })

  it('should skip handler for duplicate event', async () => {
    const redis = createMockRedis(null) // NX returns null = key already exists
    const innerHandler = mock.fn(async () => {})
    const handler = idempotentHandlerRedis(redis as any, innerHandler)

    await handler(makeEvent())

    assert.equal(innerHandler.mock.callCount(), 0)
  })

  it('should delete key and re-throw when handler fails', async () => {
    const redis = createMockRedis('OK')
    const innerHandler = mock.fn(async () => { throw new Error('handler error') })
    const handler = idempotentHandlerRedis(redis as any, innerHandler)

    await assert.rejects(
      () => handler(makeEvent()),
      (err: Error) => err.message === 'handler error',
    )

    assert.equal(redis.del.mock.callCount(), 1)
    assert.equal(redis.del.mock.calls[0].arguments[0], 'processed_event:evt-1')
  })

  it('should use correct key format and TTL', async () => {
    const redis = createMockRedis('OK')
    const innerHandler = mock.fn(async () => {})
    const handler = idempotentHandlerRedis(redis as any, innerHandler, 3600)

    await handler(makeEvent('my-unique-id'))

    const setArgs = redis.set.mock.calls[0].arguments
    assert.equal(setArgs[0], 'processed_event:my-unique-id')
    assert.equal(setArgs[1], 'test.event')
    assert.equal(setArgs[2], 'EX')
    assert.equal(setArgs[3], 3600)
    assert.equal(setArgs[4], 'NX')
  })
})
