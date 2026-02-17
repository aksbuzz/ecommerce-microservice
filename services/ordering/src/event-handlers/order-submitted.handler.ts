import type { Sql } from '@ecommerce/db'
import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { OutboxStore } from '@ecommerce/outbox'
import type { Logger } from 'pino'
import type { OrderRepository } from '../repositories/order.repository.ts'

interface Deps {
  orderRepository: OrderRepository
  outboxStore: OutboxStore
  sql: Sql
  log: Logger
}

/**
 * Transitions submitted orders to awaiting_validation and publishes
 * order.awaiting_validation so Catalog can check stock availability.
 * Transitions: submitted → awaiting_validation
 */
export function createOrderSubmittedHandler({ orderRepository, outboxStore, sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, buyerId } = event.payload as { orderId: number; buyerId: number }
    log.info({ orderId }, 'Order submitted — requesting stock validation')

    await sql.begin(async (tx) => {
      const updated = await orderRepository.updateStatusWithTx(tx, orderId, 'awaiting_validation')

      if (!updated) {
        log.warn({ orderId }, 'Order not found for validation transition')
        return
      }

      const items = (updated.items ?? []).map((i) => ({ productId: i.productId, units: i.units }))

      await outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: 'order.awaiting_validation',
        timestamp: new Date().toISOString(),
        payload: { orderId, buyerId, items },
      })
    })

    log.info({ orderId }, 'Order awaiting stock validation from Catalog')
  }
}
