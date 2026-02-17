import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { Logger } from 'pino'
import type { OrderRepository } from '../repositories/order.repository.ts'
import type { OrderSummaryRepository } from '../repositories/order-summary.repository.ts'

interface Deps {
  orderSummaryRepository: OrderSummaryRepository
  orderRepository: OrderRepository
  log: Logger
}

/**
 * CQRS read-model projector.
 * Consumes order lifecycle events and maintains a denormalized order_summaries table.
 * The read model powers the fast GET /api/v1/orders/summaries endpoint.
 */
export function createOrderSummaryProjector({ orderSummaryRepository, orderRepository, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId } = event.payload as { orderId: number; newStatus?: string }

    if (event.type === 'order.submitted') {
      // Full upsert for new orders — need to fetch order details
      const order = await orderRepository.findById(orderId)
      if (order) {
        await orderSummaryRepository.upsert(orderSummaryRepository.sql, {
          orderId: order.id,
          buyerId: order.buyerId,
          status: order.status,
          total: order.total,
          itemCount: order.items?.length ?? 0,
        })
      }
    } else {
      // Status-only update for transitions
      const newStatus = (event.payload as { newStatus?: string }).newStatus ?? event.type.replace('order.', '')
      await orderSummaryRepository.updateStatus(orderId, newStatus)
    }

    log.debug({ orderId, eventType: event.type }, 'Order summary projected')
  }
}
