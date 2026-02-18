import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createStockConfirmedHandler, createStockRejectedHandler } from './stock-result.handler.ts'

function createMockOrderRepo() {
  return {
    updateStatusWithTx: mock.fn(),
    findById: mock.fn(),
  }
}

function createMockOutboxStore() {
  return { save: mock.fn(async () => {}) }
}

function createMockSql() {
  return Object.assign(
    mock.fn(async () => []),
    { begin: mock.fn(async (cb: any) => cb({})) },
  )
}

function createMockLogger() {
  return { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn(), trace: mock.fn(), fatal: mock.fn(), child: mock.fn() }
}

describe('createStockConfirmedHandler', () => {
  it('should confirm order and save outbox event with total', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => ({
      id: 1, status: 'confirmed', total: 49.99,
    }))

    const handler = createStockConfirmedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-1',
      type: 'stock.confirmed',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, buyerId: 42 },
    })

    assert.equal(orderRepo.updateStatusWithTx.mock.calls[0].arguments[2], 'confirmed')
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'order.confirmed')
    assert.equal(savedEvent.payload.total, 49.99)
    assert.equal(savedEvent.payload.orderId, 1)
    assert.equal(savedEvent.payload.buyerId, 42)
  })

  it('should skip outbox when order not found', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => undefined)

    const handler = createStockConfirmedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-2',
      type: 'stock.confirmed',
      timestamp: new Date().toISOString(),
      payload: { orderId: 999, buyerId: 1 },
    })

    assert.equal(log.warn.mock.callCount(), 1)
    assert.equal(outboxStore.save.mock.callCount(), 0)
  })
})

describe('createStockRejectedHandler', () => {
  it('should cancel order and include cancellation reason with item summary', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => ({
      id: 1, status: 'cancelled',
    }))

    const handler = createStockRejectedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-3',
      type: 'stock.rejected',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 1,
        buyerId: 42,
        rejectedItems: [
          { productId: 10, available: 2, requested: 5 },
        ],
      },
    })

    assert.equal(orderRepo.updateStatusWithTx.mock.calls[0].arguments[2], 'cancelled')
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'order.cancelled')
    assert.equal(savedEvent.payload.previousStatus, 'awaiting_validation')
    assert.ok(savedEvent.payload.cancellationReason.includes('product 10'))
    assert.ok(savedEvent.payload.cancellationReason.includes('need 5'))
    assert.ok(savedEvent.payload.cancellationReason.includes('have 2'))
  })

  it('should skip outbox when order not found', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => undefined)

    const handler = createStockRejectedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-4',
      type: 'stock.rejected',
      timestamp: new Date().toISOString(),
      payload: { orderId: 999, buyerId: 1, rejectedItems: [] },
    })

    // Two warn calls: one for the rejection event itself, one for "order not found"
    assert.equal(log.warn.mock.callCount(), 2)
    assert.equal(outboxStore.save.mock.callCount(), 0)
  })
})
