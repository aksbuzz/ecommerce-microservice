import type { Redis } from 'ioredis'
import type { EventHandler, IntegrationEvent } from './event-bus.ts'

/**
 * Wraps an EventHandler to ensure idempotency via Redis SET NX.
 * Useful for services without a PostgreSQL database (e.g., payment worker).
 *
 * Uses SET key EX ttl NX: only processes the event if the key doesn't already exist.
 * On handler failure, deletes the key so retries can re-process.
 */
export function idempotentHandlerRedis(
  redis: Redis,
  handler: EventHandler,
  ttlSeconds = 7 * 24 * 3600,
): EventHandler {
  return async (event: IntegrationEvent): Promise<void> => {
    const key = `processed_event:${event.id}`
    const result = await redis.set(key, event.type, 'EX', ttlSeconds, 'NX')
    if (!result) return // Already processed

    try {
      await handler(event)
    } catch (err) {
      // Handler failed — remove key so retries can re-process
      await redis.del(key)
      throw err
    }
  }
}
