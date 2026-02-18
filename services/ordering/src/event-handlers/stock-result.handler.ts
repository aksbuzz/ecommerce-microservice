import { withTransaction, type Sql } from '@ecommerce/db'
import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { OutboxStore } from '@ecommerce/outbox'
import type { Logger } from '@ecommerce/logger'
import type { OrderRepository } from '../repositories/order.repository.ts'

interface Deps {
  orderRepository: OrderRepository
  outboxStore: OutboxStore
  sql: Sql
  log: Logger
}

export function createStockConfirmedHandler({ orderRepository, outboxStore, sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, buyerId } = event.payload as { orderId: number; buyerId: number }
    log.info({ orderId }, 'Stock confirmed — confirming order')

    await withTransaction(sql, async (tx) => {
      const updated = await orderRepository.updateStatusWithTx(tx, orderId, 'confirmed')
      if (!updated) {
        log.warn({ orderId }, 'Order not found for stock confirmation')
        return
      }

      await outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: 'order.confirmed',
        timestamp: new Date().toISOString(),
        payload: { orderId, buyerId, total: updated.total },
      })
    })
  }
}

interface RejectedItem {
  productId: number
  available: number
  requested: number
}

/**
 * COMPENSATING ACTION: Handles stock.rejected — cancels the order.
 */
export function createStockRejectedHandler({ orderRepository, outboxStore, sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, buyerId, rejectedItems } = event.payload as {
      orderId: number; buyerId: number; rejectedItems: RejectedItem[]
    }
    const itemSummary = rejectedItems.map((i) => `product ${i.productId} (need ${i.requested}, have ${i.available})`).join(', ')
    log.warn({ orderId, rejectedItems }, 'Stock rejected — COMPENSATING: cancelling order')

    await withTransaction(sql, async (tx) => {
      const updated = await orderRepository.updateStatusWithTx(tx, orderId, 'cancelled')
      if (!updated) {
        log.warn({ orderId }, 'Order not found for stock rejection compensation')
        return
      }

      await outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: 'order.cancelled',
        timestamp: new Date().toISOString(),
        payload: {
          orderId,
          buyerId,
          previousStatus: 'awaiting_validation',
          newStatus: 'cancelled',
          cancellationReason: `Insufficient stock: ${itemSummary}`,
        },
      })
    })
  }
}
