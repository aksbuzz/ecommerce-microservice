import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { OutboxStore } from './outbox-store.ts'

describe('OutboxStore', () => {
  it('should save event to outbox within transaction', async () => {
    const mockTx = mock.fn(async () => []) as any
    mockTx.unsafe = mock.fn()
    const store = new OutboxStore({} as any)

    const event = {
      id: 'evt-123',
      type: 'order.submitted',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, buyerId: 42 },
    }

    await store.save(mockTx, event)

    assert.equal(mockTx.mock.callCount(), 1)
  })

  it('should skip markPublished when ids array is empty', async () => {
    const mockSql = mock.fn(async () => []) as any
    const store = new OutboxStore(mockSql)

    await store.markPublished([])

    assert.equal(mockSql.mock.callCount(), 0)
  })
})
