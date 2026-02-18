import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { idempotentHandler } from './idempotent-handler.ts'

function makeEvent(id = 'evt-1') {
  return {
    id,
    type: 'test.event',
    timestamp: new Date().toISOString(),
    payload: { data: 'test' },
  }
}

describe('idempotentHandler (SQL)', () => {
  it('should call handler on first event processing', async () => {
    const mockTx = mock.fn(async () => [])
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )
    const innerHandler = mock.fn(async () => {})
    const handler = idempotentHandler(sql as any, innerHandler)

    await handler(makeEvent())

    assert.equal(mockTx.mock.callCount(), 1) // INSERT processed_events
    assert.equal(innerHandler.mock.callCount(), 1)
  })

  it('should skip handler for duplicate event (code 23505)', async () => {
    const duplicateError = Object.assign(new Error('unique_violation'), { code: '23505' })
    const mockTx = mock.fn(async () => { throw duplicateError })
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )
    const innerHandler = mock.fn(async () => {})
    const handler = idempotentHandler(sql as any, innerHandler)

    await handler(makeEvent())

    assert.equal(innerHandler.mock.callCount(), 0)
  })

  it('should propagate non-duplicate DB errors', async () => {
    const dbError = Object.assign(new Error('connection lost'), { code: '08006' })
    const mockTx = mock.fn(async () => { throw dbError })
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )
    const innerHandler = mock.fn(async () => {})
    const handler = idempotentHandler(sql as any, innerHandler)

    await assert.rejects(
      () => handler(makeEvent()),
      (err: Error) => err.message === 'connection lost',
    )

    assert.equal(innerHandler.mock.callCount(), 0)
  })
})
