import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { NotFoundError } from '@ecommerce/shared'
import { WebhookService } from './webhook.service.ts'

function createMockWebhookRepo() {
  return {
    findAll: mock.fn(),
    findById: mock.fn(),
    findByEventType: mock.fn(),
    create: mock.fn(),
    delete: mock.fn(),
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

describe('WebhookService', () => {
  let service: WebhookService
  let webhookRepo: ReturnType<typeof createMockWebhookRepo>
  let log: ReturnType<typeof createMockLogger>

  beforeEach(() => {
    webhookRepo = createMockWebhookRepo()
    log = createMockLogger()
    service = new WebhookService({
      webhookRepository: webhookRepo as any,
      log: log as any,
    })
  })

  describe('getSubscriptions', () => {
    it('should return all subscriptions', async () => {
      const subs = [
        { id: 1, url: 'https://example.com/hook', token: 'secret', eventType: 'order.submitted' },
      ]
      webhookRepo.findAll.mock.mockImplementation(async () => subs)

      const result = await service.getSubscriptions()
      assert.deepEqual(result, subs)
    })
  })

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const input = { url: 'https://example.com/hook', token: 'secret12', eventType: 'order.submitted' as const }
      const created = { id: 1, ...input, createdAt: new Date().toISOString() }
      webhookRepo.create.mock.mockImplementation(async () => created)

      const result = await service.createSubscription(input)
      assert.equal(result.id, 1)
    })
  })

  describe('deleteSubscription', () => {
    it('should delete a subscription', async () => {
      webhookRepo.delete.mock.mockImplementation(async () => true)
      await service.deleteSubscription(1)
      assert.equal(webhookRepo.delete.mock.callCount(), 1)
    })

    it('should throw NotFoundError for missing subscription', async () => {
      webhookRepo.delete.mock.mockImplementation(async () => false)
      await assert.rejects(
        () => service.deleteSubscription(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('dispatchEvent', () => {
    it('should dispatch event to matching subscriptions', async () => {
      webhookRepo.findByEventType.mock.mockImplementation(async () => [
        { id: 1, url: 'https://example.com/hook', token: 'secret', eventType: 'order.submitted' },
      ])

      // Mock global fetch
      const originalFetch = globalThis.fetch
      globalThis.fetch = mock.fn(async () => new Response('ok', { status: 200 })) as any

      try {
        await service.dispatchEvent({
          id: 'event-1',
          type: 'order.submitted',
          timestamp: new Date().toISOString(),
          payload: { orderId: 1 },
        })

        assert.equal((globalThis.fetch as any).mock.callCount(), 1)
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('should handle no matching subscriptions', async () => {
      webhookRepo.findByEventType.mock.mockImplementation(async () => [])

      await service.dispatchEvent({
        id: 'event-1',
        type: 'order.submitted',
        timestamp: new Date().toISOString(),
        payload: { orderId: 1 },
      })

      // No error, no fetch calls
    })
  })
})
