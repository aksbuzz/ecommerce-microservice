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
 * Handles payment.succeeded — transitions order to 'paid'.
 */
export function createPaymentSucceededHandler({ orderRepository, outboxStore, sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, buyerId } = event.payload as { orderId: number; buyerId: number }
    log.info({ orderId }, 'Payment succeeded — updating order to paid')

    await sql.begin(async (tx) => {
      const updated = await orderRepository.updateStatusWithTx(tx, orderId, 'paid')
      if (!updated) {
        log.warn({ orderId }, 'Order not found for payment success')
        return
      }

      // Include items so Catalog can decrement stock
      const items = (updated.items ?? []).map((i) => ({ productId: i.productId, units: i.units }))

      await outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: 'order.paid',
        timestamp: new Date().toISOString(),
        payload: { orderId, buyerId, previousStatus: 'confirmed', newStatus: 'paid', items },
      })
    })
  }
}

/**
 * COMPENSATING ACTION: Handles payment.failed — cancels the order.
 * This is the saga compensation that reverses the order.confirmed step.
 */
export function createPaymentFailedHandler({ orderRepository, outboxStore, sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, buyerId, reason } = event.payload as { orderId: number; buyerId: number; reason: string }
    log.warn({ orderId, reason }, 'Payment failed — COMPENSATING: cancelling order')

    await sql.begin(async (tx) => {
      const updated = await orderRepository.updateStatusWithTx(tx, orderId, 'cancelled')
      if (!updated) {
        log.warn({ orderId }, 'Order not found for payment failure compensation')
        return
      }

      await outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: 'order.cancelled',
        timestamp: new Date().toISOString(),
        payload: {
          orderId,
          buyerId,
          previousStatus: 'confirmed',
          newStatus: 'cancelled',
          cancellationReason: `Payment failed: ${reason}`,
        },
      })
    })
  }
}
