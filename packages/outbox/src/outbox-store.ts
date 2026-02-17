import type { Sql } from '@ecommerce/db'
import type { IntegrationEvent } from '@ecommerce/event-bus'

export interface OutboxMessage {
  id: string
  eventType: string
  payload: string
  createdAt: string
  publishedAt: string | null
}

export class OutboxStore {
  sql: Sql

  constructor(sql: Sql) {
    this.sql = sql
  }

  /**
   * Save an event to the outbox within a transaction.
   * MUST be called with the same transaction handle as your business write:
   *
   *   await sql.begin(async (tx) => {
   *     await tx`INSERT INTO orders ...`
   *     await outboxStore.save(tx, event)
   *   })
   */
  async save(tx: Sql, event: IntegrationEvent): Promise<void> {
    await tx`
      INSERT INTO outbox_messages (id, event_type, payload)
      VALUES (${event.id}, ${event.type}, ${JSON.stringify(event)})
    `
  }

  /** Fetch unpublished outbox messages ordered by creation time (FIFO). */
  async getUnpublished(limit = 50): Promise<OutboxMessage[]> {
    return this.sql<OutboxMessage[]>`
      SELECT id, event_type as "eventType", payload, created_at as "createdAt", published_at as "publishedAt"
      FROM outbox_messages
      WHERE published_at IS NULL
      ORDER BY created_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `
  }

  /** Mark outbox messages as published after successful EventBus publish. */
  async markPublished(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.sql`
      UPDATE outbox_messages SET published_at = NOW()
      WHERE id = ANY(${ids})
    `
  }
}
