import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { OutboxProcessor } from './outbox-processor.ts'

function createMockOutboxStore() {
  return {
    getUnpublished: mock.fn(),
    markPublished: mock.fn(),
  }
}

function createMockEventBus() {
  return {
    publish: mock.fn(),
  }
}

function createMockLogger() {
  return {
    info: mock.fn(),
    debug: mock.fn(),
    warn: mock.fn(),
    error: mock.fn(),
  }
}

describe('OutboxProcessor', () => {
  let outboxStore: ReturnType<typeof createMockOutboxStore>
  let eventBus: ReturnType<typeof createMockEventBus>
  let log: ReturnType<typeof createMockLogger>
  let processor: OutboxProcessor

  beforeEach(() => {
    outboxStore = createMockOutboxStore()
    eventBus = createMockEventBus()
    log = createMockLogger()
    processor = new OutboxProcessor(outboxStore as any, eventBus as any, log as any)
  })

  it('should skip poll when no unpublished messages', async () => {
    outboxStore.getUnpublished.mock.mockImplementation(async () => [])
    await processor.poll()
    assert.equal(eventBus.publish.mock.callCount(), 0)
    assert.equal(outboxStore.markPublished.mock.callCount(), 0)
  })

  it('should publish and mark messages as published', async () => {
    const event = {
      id: 'evt-1',
      type: 'order.submitted',
      timestamp: new Date().toISOString(),
      payload: { orderId: 1 },
    }
    outboxStore.getUnpublished.mock.mockImplementation(async () => [
      { id: 'evt-1', eventType: 'order.submitted', payload: JSON.stringify(event) },
    ])
    eventBus.publish.mock.mockImplementation(async () => {})
    outboxStore.markPublished.mock.mockImplementation(async () => {})

    await processor.poll()

    assert.equal(eventBus.publish.mock.callCount(), 1)
    assert.deepEqual(eventBus.publish.mock.calls[0].arguments[0], event)
    assert.equal(outboxStore.markPublished.mock.callCount(), 1)
    assert.deepEqual(outboxStore.markPublished.mock.calls[0].arguments[0], ['evt-1'])
  })

  it('should stop processing on publish error to maintain ordering', async () => {
    const event1 = { id: 'evt-1', type: 'a', timestamp: '', payload: {} }
    const event2 = { id: 'evt-2', type: 'b', timestamp: '', payload: {} }

    outboxStore.getUnpublished.mock.mockImplementation(async () => [
      { id: 'evt-1', payload: JSON.stringify(event1) },
      { id: 'evt-2', payload: JSON.stringify(event2) },
    ])
    eventBus.publish.mock.mockImplementation(async () => { throw new Error('RabbitMQ down') })

    await processor.poll() // should not throw, error is caught

    assert.equal(eventBus.publish.mock.callCount(), 1) // stopped after first failure
    assert.equal(outboxStore.markPublished.mock.callCount(), 0) // nothing published
  })

  it('should start and stop the polling timer', () => {
    processor.start()
    assert.ok(processor.timer !== null)
    processor.stop()
    assert.equal(processor.timer, null)
  })
})
