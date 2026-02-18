import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createStockValidationHandler } from './stock-validation.handler.ts'

function createMockOutboxStore() {
  return { save: mock.fn(async () => {}) }
}

function createMockLogger() {
  return { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn(), trace: mock.fn(), fatal: mock.fn(), child: mock.fn() }
}

describe('createStockValidationHandler', () => {
  it('should emit stock.confirmed when all items have sufficient stock', async () => {
    const outboxStore = createMockOutboxStore()
    const log = createMockLogger()

    // Mock sql tagged template that returns stock rows
    const mockTx = mock.fn(async () => [{ availableStock: 100 }])
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )

    const handler = createStockValidationHandler({
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-1',
      type: 'order.awaiting_validation',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 1,
        buyerId: 42,
        items: [
          { productId: 10, units: 5 },
          { productId: 20, units: 3 },
        ],
      },
    })

    assert.equal(outboxStore.save.mock.callCount(), 1)
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'stock.confirmed')
    assert.equal(savedEvent.payload.orderId, 1)
    assert.equal(savedEvent.payload.buyerId, 42)
  })

  it('should emit stock.rejected when some items have insufficient stock', async () => {
    const outboxStore = createMockOutboxStore()
    const log = createMockLogger()

    let callCount = 0
    const mockTx = mock.fn(async () => {
      callCount++
      // First item has enough stock, second doesn't
      if (callCount === 1) return [{ availableStock: 100 }]
      return [{ availableStock: 2 }]
    })
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )

    const handler = createStockValidationHandler({
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-2',
      type: 'order.awaiting_validation',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 1,
        buyerId: 42,
        items: [
          { productId: 10, units: 5 },
          { productId: 20, units: 10 },
        ],
      },
    })

    assert.equal(outboxStore.save.mock.callCount(), 1)
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'stock.rejected')
    assert.equal(savedEvent.payload.rejectedItems.length, 1)
    assert.equal(savedEvent.payload.rejectedItems[0].productId, 20)
    assert.equal(savedEvent.payload.rejectedItems[0].available, 2)
    assert.equal(savedEvent.payload.rejectedItems[0].requested, 10)
  })

  it('should treat missing product as zero stock', async () => {
    const outboxStore = createMockOutboxStore()
    const log = createMockLogger()

    const mockTx = mock.fn(async () => []) // No rows = product not found
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )

    const handler = createStockValidationHandler({
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-3',
      type: 'order.awaiting_validation',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 1,
        buyerId: 42,
        items: [{ productId: 999, units: 1 }],
      },
    })

    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'stock.rejected')
    assert.equal(savedEvent.payload.rejectedItems[0].available, 0)
  })
})
