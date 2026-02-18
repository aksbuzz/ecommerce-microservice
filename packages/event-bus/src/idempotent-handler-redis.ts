import type { Redis } from 'ioredis'
import type { EventHandler, IntegrationEvent } from './event-bus.ts'

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
