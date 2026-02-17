import type { EventBus, IntegrationEvent } from '@ecommerce/event-bus'
import type { OutboxStore } from './outbox-store.ts'

interface BaseLogger {
  info(obj: unknown, msg?: string): void
  info(msg: string): void
  debug(obj: unknown, msg?: string): void
  error(obj: unknown, msg?: string): void
}

export class OutboxProcessor {
  outboxStore: OutboxStore
  eventBus: EventBus
  log: BaseLogger
  intervalMs: number
  timer: ReturnType<typeof setInterval> | null = null

  constructor(outboxStore: OutboxStore, eventBus: EventBus, log: BaseLogger, intervalMs = 1000) {
    this.outboxStore = outboxStore
    this.eventBus = eventBus
    this.log = log
    this.intervalMs = intervalMs
  }

  start(): void {
    this.timer = setInterval(() => this.poll(), this.intervalMs)
    this.log.info({ intervalMs: this.intervalMs }, 'Outbox processor started')
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.log.info('Outbox processor stopped')
  }

  async poll(): Promise<void> {
    try {
      const messages = await this.outboxStore.getUnpublished()
      if (messages.length === 0) return

      const publishedIds: string[] = []
      for (const msg of messages) {
        try {
          const event: IntegrationEvent = JSON.parse(msg.payload)
          await this.eventBus.publish(event)
          publishedIds.push(msg.id)
        } catch (err) {
          this.log.error({ messageId: msg.id, err }, 'Failed to publish outbox message')
          break // Stop on error to maintain ordering guarantee
        }
      }

      if (publishedIds.length > 0) {
        await this.outboxStore.markPublished(publishedIds)
        this.log.debug({ count: publishedIds.length }, 'Published outbox messages')
      }
    } catch (err) {
      this.log.error({ err }, 'Outbox poll error')
    }
  }
}
