import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { Logger } from 'pino'
import type { BasketRepository } from '../repositories/basket.repository.ts'

interface Deps {
  basketRepository: BasketRepository
  log: Logger
}

/**
 * Cleans up a user's basket from Redis when their account is deleted.
 */
export function createUserDeletedHandler({ basketRepository, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { userId } = event.payload as { userId: number }
    log.info({ userId }, 'User deleted — cleaning up basket')

    await basketRepository.delete(String(userId))
  }
}
