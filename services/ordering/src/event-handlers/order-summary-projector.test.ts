import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createOrderSummaryProjector } from './order-summary-projector.ts'

function createMockOrderSummaryRepo() {
  return {
    upsert: mock.fn(async () => {}),
    updateStatus: mock.fn(async () => {}),
    sql: {},
  }
}

function createMockOrderRepo() {
  return { findById: mock.fn() }
}

function createMockLogger() {
  return { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn(), trace: mock.fn(), fatal: mock.fn(), child: mock.fn() }
}

describe('createOrderSummaryProjector', () => {
  it('should upsert full order summary on order.submitted', async () => {
    const orderSummaryRepo = createMockOrderSummaryRepo()
    const orderRepo = createMockOrderRepo()
    const log = createMockLogger()

    orderRepo.findById.mock.mockImplementation(async () => ({
      id: 1, buyerId: 42, status: 'submitted', total: 29.99, items: [{ id: 1 }, { id: 2 }],
    }))

    const projector = createOrderSummaryProjector({
      orderSummaryRepository: orderSummaryRepo as any,
      orderRepository: orderRepo as any,
      log: log as any,
    })

    await projector({
      id: 'evt-1',
      type: 'order.submitted',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1 },
    })

    assert.equal(orderRepo.findById.mock.callCount(), 1)
    assert.equal(orderSummaryRepo.upsert.mock.callCount(), 1)
    const upsertData = orderSummaryRepo.upsert.mock.calls[0].arguments[1]
    assert.equal(upsertData.orderId, 1)
    assert.equal(upsertData.buyerId, 42)
    assert.equal(upsertData.total, 29.99)
    assert.equal(upsertData.itemCount, 2)
  })

  it('should skip upsert when order not found on order.submitted', async () => {
    const orderSummaryRepo = createMockOrderSummaryRepo()
    const orderRepo = createMockOrderRepo()
    const log = createMockLogger()

    orderRepo.findById.mock.mockImplementation(async () => undefined)

    const projector = createOrderSummaryProjector({
      orderSummaryRepository: orderSummaryRepo as any,
      orderRepository: orderRepo as any,
      log: log as any,
    })

    await projector({
      id: 'evt-2',
      type: 'order.submitted',
      timestamp: new Date().toISOString(),
      payload: { orderId: 999 },
    })

    assert.equal(orderSummaryRepo.upsert.mock.callCount(), 0)
  })

  it('should update status only for non-submitted events using newStatus from payload', async () => {
    const orderSummaryRepo = createMockOrderSummaryRepo()
    const orderRepo = createMockOrderRepo()
    const log = createMockLogger()

    const projector = createOrderSummaryProjector({
      orderSummaryRepository: orderSummaryRepo as any,
      orderRepository: orderRepo as any,
      log: log as any,
    })

    await projector({
      id: 'evt-3',
      type: 'order.confirmed',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, newStatus: 'confirmed' },
    })

    assert.equal(orderRepo.findById.mock.callCount(), 0)
    assert.equal(orderSummaryRepo.updateStatus.mock.callCount(), 1)
    assert.equal(orderSummaryRepo.updateStatus.mock.calls[0].arguments[0], 1)
    assert.equal(orderSummaryRepo.updateStatus.mock.calls[0].arguments[1], 'confirmed')
  })

  it('should derive status from event type when newStatus not in payload', async () => {
    const orderSummaryRepo = createMockOrderSummaryRepo()
    const orderRepo = createMockOrderRepo()
    const log = createMockLogger()

    const projector = createOrderSummaryProjector({
      orderSummaryRepository: orderSummaryRepo as any,
      orderRepository: orderRepo as any,
      log: log as any,
    })

    await projector({
      id: 'evt-4',
      type: 'order.cancelled',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1 },
    })

    assert.equal(orderSummaryRepo.updateStatus.mock.calls[0].arguments[1], 'cancelled')
  })
})
