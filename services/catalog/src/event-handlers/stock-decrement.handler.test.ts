import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createStockDecrementHandler } from './stock-decrement.handler.ts'

function createMockLogger() {
  return { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn(), trace: mock.fn(), fatal: mock.fn(), child: mock.fn() }
}

describe('createStockDecrementHandler', () => {
  it('should decrement stock for each item in the order', async () => {
    const log = createMockLogger()

    const mockTx = mock.fn(async () => [{ id: 1 }]) // RETURNING id = success
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )

    const handler = createStockDecrementHandler({ sql: sql as any, log: log as any })

    await handler({
      id: 'evt-1',
      type: 'order.paid',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 1,
        buyerId: 42,
        items: [
          { productId: 10, units: 3 },
          { productId: 20, units: 1 },
        ],
      },
    })

    // Should have called tx for each item
    assert.equal(mockTx.mock.callCount(), 2)
    assert.equal(log.warn.mock.callCount(), 0)
  })

  it('should log warning when stock decrement fails for an item', async () => {
    const log = createMockLogger()

    const mockTx = mock.fn(async () => []) // No RETURNING = failed
    const sql = Object.assign(
      mock.fn(async () => []),
      { begin: mock.fn(async (cb: any) => cb(mockTx)) },
    )

    const handler = createStockDecrementHandler({ sql: sql as any, log: log as any })

    await handler({
      id: 'evt-2',
      type: 'order.paid',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 1,
        buyerId: 42,
        items: [{ productId: 10, units: 100 }],
      },
    })

    assert.equal(log.warn.mock.callCount(), 1)
  })
})
