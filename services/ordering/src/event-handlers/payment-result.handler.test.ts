import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createPaymentSucceededHandler, createPaymentFailedHandler } from './payment-result.handler.ts'

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

describe('createPaymentSucceededHandler', () => {
  it('should transition order to paid and include items in outbox event', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => ({
      id: 1, status: 'paid', items: [{ productId: 10, units: 3 }],
    }))

    const handler = createPaymentSucceededHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-1',
      type: 'payment.succeeded',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, buyerId: 42 },
    })

    assert.equal(orderRepo.updateStatusWithTx.mock.calls[0].arguments[2], 'paid')
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'order.paid')
    assert.equal(savedEvent.payload.previousStatus, 'confirmed')
    assert.equal(savedEvent.payload.newStatus, 'paid')
    assert.equal(savedEvent.payload.items.length, 1)
    assert.equal(savedEvent.payload.items[0].productId, 10)
  })

  it('should skip outbox when order not found', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => undefined)

    const handler = createPaymentSucceededHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-2',
      type: 'payment.succeeded',
      timestamp: new Date().toISOString(),
      payload: { orderId: 999, buyerId: 1 },
    })

    assert.equal(log.warn.mock.callCount(), 1)
    assert.equal(outboxStore.save.mock.callCount(), 0)
  })
})

describe('createPaymentFailedHandler', () => {
  it('should cancel order and include payment failure reason', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => ({
      id: 1, status: 'cancelled',
    }))

    const handler = createPaymentFailedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-3',
      type: 'payment.failed',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, buyerId: 42, reason: 'Payment declined' },
    })

    assert.equal(orderRepo.updateStatusWithTx.mock.calls[0].arguments[2], 'cancelled')
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'order.cancelled')
    assert.equal(savedEvent.payload.previousStatus, 'confirmed')
    assert.equal(savedEvent.payload.cancellationReason, 'Payment failed: Payment declined')
  })

  it('should skip outbox when order not found', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => undefined)

    const handler = createPaymentFailedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    await handler({
      id: 'evt-4',
      type: 'payment.failed',
      timestamp: new Date().toISOString(),
      payload: { orderId: 999, buyerId: 1, reason: 'Declined' },
    })

    assert.equal(log.warn.mock.callCount(), 2) // one from handler + one for "not found"
    assert.equal(outboxStore.save.mock.callCount(), 0)
  })
})
