import type { Sql } from '@ecommerce/db'
import type { EventHandler, IntegrationEvent } from './event-bus.ts'

/**
 * Wraps an EventHandler to ensure idempotency via a processed_events table.
 * The handler and dedup check run in a single DB transaction.
 *
 * Requires the consuming service to have a `processed_events` table:
 * CREATE TABLE processed_events (
 *   event_id UUID PRIMARY KEY,
 *   event_type VARCHAR(100) NOT NULL,
 *   processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 */
export function idempotentHandler(sql: Sql, handler: EventHandler): EventHandler {
  return async (event: IntegrationEvent): Promise<void> => {
    await sql.begin(async (tx) => {
      // Check if already processed (SELECT FOR UPDATE to prevent concurrent races)
      const [existing] = await tx`
        SELECT event_id FROM processed_events WHERE event_id = ${event.id} FOR UPDATE
      `
      if (existing) return

      await handler(event)

      await tx`
        INSERT INTO processed_events (event_id, event_type, processed_at)
        VALUES (${event.id}, ${event.type}, NOW())
      `
    })
  }
}
