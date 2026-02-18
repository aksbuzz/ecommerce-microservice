import { withTransaction, type Sql } from '@ecommerce/db'
import type { EventBus } from '@ecommerce/event-bus'
import type { OutboxStore } from '@ecommerce/outbox'
import { NotFoundError, ValidationError } from '@ecommerce/shared'
import type { OrderRepository } from '../repositories/order.repository.ts'
import type { CreateOrderInput, OrderStatus, OrdersQuery } from '../schemas/order.schema.ts'

interface Deps {
  orderRepository: OrderRepository
  eventBus: EventBus
  outboxStore: OutboxStore
  sql: Sql
}

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  submitted: ['awaiting_validation', 'cancelled'],
  awaiting_validation: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
}

export class OrderingService {
  orderRepository: OrderRepository
  eventBus: EventBus
  outboxStore: OutboxStore
  sql: Sql

  constructor({ orderRepository, eventBus, outboxStore, sql }: Deps) {
    this.orderRepository = orderRepository
    this.eventBus = eventBus
    this.outboxStore = outboxStore
    this.sql = sql
  }

  async getOrders(buyerId: number, query: OrdersQuery) {
    return this.orderRepository.findByBuyerId(buyerId, query)
  }

  async getOrderById(id: number, buyerId: number) {
    const order = await this.orderRepository.findById(id)
    if (!order || order.buyerId !== buyerId) throw new NotFoundError('Order', id)
    return order
  }

  async createOrder(buyerId: number, data: CreateOrderInput) {
    return withTransaction(this.sql, async (tx) => {
      const order = await this.orderRepository.createWithTx(tx, buyerId, data)

      await this.outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: 'order.submitted',
        timestamp: new Date().toISOString(),
        payload: { orderId: order.id, buyerId, total: order.total },
      })

      return order
    })
  }

  async updateOrderStatus(id: number, buyerId: number, newStatus: OrderStatus) {
    const order = await this.orderRepository.findById(id)
    if (!order || order.buyerId !== buyerId) throw new NotFoundError('Order', id)

    const allowed = VALID_TRANSITIONS[order.status] ?? []
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from '${order.status}' to '${newStatus}'`)
    }

    return withTransaction(this.sql, async (tx) => {
      const updated = await this.orderRepository.updateStatusWithTx(tx, id, newStatus)

      const eventPayload: Record<string, unknown> = {
        orderId: id,
        buyerId,
        previousStatus: order.status,
        newStatus,
      }

      if (newStatus === 'confirmed' || newStatus === 'paid') {
        eventPayload.total = order.total
      }

      await this.outboxStore.save(tx, {
        id: crypto.randomUUID(),
        type: `order.${newStatus}`,
        timestamp: new Date().toISOString(),
        payload: eventPayload,
      })

      return updated
    })
  }

  async cancelOrder(id: number, buyerId: number) {
    return this.updateOrderStatus(id, buyerId, 'cancelled')
  }
}
