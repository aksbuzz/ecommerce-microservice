import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { PaymentService } from './payment.service.ts'

function createMockEventBus() {
  return {
    connect: mock.fn(),
    publish: mock.fn(async () => {}),
    subscribe: mock.fn(),
    close: mock.fn(),
  }
}

function createMockLogger() {
  return {
    info: mock.fn(),
    warn: mock.fn(),
    error: mock.fn(),
    fatal: mock.fn(),
    debug: mock.fn(),
    trace: mock.fn(),
    child: mock.fn(),
  }
}

describe('PaymentService', () => {
  it('should process a payment and publish result event', async () => {
    const eventBus = createMockEventBus()
    const log = createMockLogger()
    const service = new PaymentService(eventBus as any, log as any)

    const event = {
      id: 'test-id',
      type: 'order.confirmed',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1, buyerId: 1, total: 29.99 },
    }

    await service.processPayment(event)

    // Should have published either payment.succeeded or payment.failed
    assert.equal(eventBus.publish.mock.callCount(), 1)
    const published = eventBus.publish.mock.calls[0].arguments[0]
    assert.ok(
      published.type === 'payment.succeeded' || published.type === 'payment.failed',
      `Expected payment.succeeded or payment.failed, got ${published.type}`,
    )
    assert.equal(published.payload.orderId, 1)
  })
})
