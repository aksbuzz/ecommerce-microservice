import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createOrderSubmittedHandler } from './order-submitted.handler.ts'

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

describe('createOrderSubmittedHandler', () => {
  it('should transition order to awaiting_validation and save outbox event', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    const updatedOrder = {
      id: 1,
      status: 'awaiting_validation',
      items: [{ productId: 10, units: 3 }, { productId: 20, units: 1 }],
    }
    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => updatedOrder)

    const handler = createOrderSubmittedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    const event = {
      id: 'evt-1',
      type: 'order.submitted',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, buyerId: 42 },
    }

    await handler(event)

    assert.equal(orderRepo.updateStatusWithTx.mock.callCount(), 1)
    assert.equal(orderRepo.updateStatusWithTx.mock.calls[0].arguments[1], 1)
    assert.equal(orderRepo.updateStatusWithTx.mock.calls[0].arguments[2], 'awaiting_validation')

    assert.equal(outboxStore.save.mock.callCount(), 1)
    const savedEvent = outboxStore.save.mock.calls[0].arguments[1]
    assert.equal(savedEvent.type, 'order.awaiting_validation')
    assert.equal(savedEvent.payload.orderId, 1)
    assert.equal(savedEvent.payload.buyerId, 42)
    assert.equal(savedEvent.payload.items.length, 2)
    assert.equal(savedEvent.payload.items[0].productId, 10)
  })

  it('should log warning and skip outbox when order not found', async () => {
    const orderRepo = createMockOrderRepo()
    const outboxStore = createMockOutboxStore()
    const sql = createMockSql()
    const log = createMockLogger()

    orderRepo.updateStatusWithTx.mock.mockImplementation(async () => undefined)

    const handler = createOrderSubmittedHandler({
      orderRepository: orderRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
      log: log as any,
    })

    const event = {
      id: 'evt-2',
      type: 'order.submitted',
      timestamp: new Date().toISOString(),
      payload: { orderId: 999, buyerId: 1 },
    }

    await handler(event)

    assert.equal(log.warn.mock.callCount(), 1)
    assert.equal(outboxStore.save.mock.callCount(), 0)
  })
})
