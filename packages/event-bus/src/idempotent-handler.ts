import type { Sql } from '@ecommerce/db'
import { withTransaction } from '@ecommerce/db'
import type { EventHandler, IntegrationEvent } from './event-bus.ts'

export type TransactionalEventHandler = (event: IntegrationEvent, tx: Sql) => Promise<void>

export function idempotentHandler(sql: Sql, handler: TransactionalEventHandler): EventHandler {
  return async (event: IntegrationEvent): Promise<void> => {
    await withTransaction(sql, async (tx) => {
      try {
        await tx`
        INSERT INTO processed_events (event_id, event_type, processed_at)
        VALUES (${event.id}, ${event.type}, NOW())
      `;
      } catch (error: any) {
        if (error.code === '23505') return // Already processed
        throw error;
      }

      await handler(event, tx)
    })
  }
}
