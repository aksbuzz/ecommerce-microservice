import type { Sql } from '@ecommerce/db'
import { type PaginatedResult, paginate } from '@ecommerce/shared'
import type { CreateOrderInput, Order, OrderItem, OrderStatus, OrdersQuery } from '../schemas/order.schema.ts'

interface Deps {
  sql: Sql
}

export class OrderRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findByBuyerId(buyerId: number, query: OrdersQuery): Promise<PaginatedResult<Order>> {
    const { limit, offset } = paginate({ page: query.page ?? 1, pageSize: query.pageSize ?? 10 })

    const statusFilter = query.status
      ? this.sql`AND o.status = ${query.status}`
      : this.sql``

    const [{ count }] = await this.sql<[{ count: string }]>`
      SELECT COUNT(*) as count FROM orders o WHERE o.buyer_id = ${buyerId} ${statusFilter}
    `

    const orders = await this.sql<(Order & { items?: OrderItem[] })[]>`
      SELECT o.id, o.buyer_id as "buyerId", o.status, o.description,
        o.street, o.city, o.state, o.country, o.zip_code as "zipCode",
        o.order_date as "orderDate"
      FROM orders o
      WHERE o.buyer_id = ${buyerId} ${statusFilter}
      ORDER BY o.order_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Fetch items for each order
    for (const order of orders) {
      order.items = await this.findOrderItems(order.id)
      order.total = order.items.reduce((sum, item) => sum + (item.unitPrice * item.units - item.discount), 0)
    }

    const totalItems = Number(count)
    return {
      items: orders as Order[],
      totalItems,
      totalPages: Math.ceil(totalItems / (query.pageSize ?? 10)),
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    }
  }

  async findById(id: number): Promise<Order | undefined> {
    const [order] = await this.sql<Order[]>`
      SELECT o.id, o.buyer_id as "buyerId", o.status, o.description,
        o.street, o.city, o.state, o.country, o.zip_code as "zipCode",
        o.order_date as "orderDate"
      FROM orders o WHERE o.id = ${id}
    `
    if (!order) return undefined

    order.items = await this.findOrderItems(id)
    order.total = order.items.reduce((sum, item) => sum + (item.unitPrice * item.units - item.discount), 0)
    return order
  }

  async create(buyerId: number, data: CreateOrderInput): Promise<Order> {
    return this.createWithTx(this.sql, buyerId, data)
  }

  async createWithTx(tx: Sql, buyerId: number, data: CreateOrderInput): Promise<Order> {
    const [order] = await tx<Order[]>`
      INSERT INTO orders (buyer_id, status, description, street, city, state, country, zip_code)
      VALUES (${buyerId}, 'submitted', ${data.description ?? null},
        ${data.street ?? null}, ${data.city ?? null}, ${data.state ?? null},
        ${data.country ?? null}, ${data.zipCode ?? null})
      RETURNING id, buyer_id as "buyerId", status, description,
        street, city, state, country, zip_code as "zipCode",
        order_date as "orderDate"
    `

    const items: OrderItem[] = []
    for (const item of data.items) {
      const [created] = await tx<OrderItem[]>`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, units, picture_url)
        VALUES (${order.id}, ${item.productId}, ${item.productName},
          ${item.unitPrice}, ${item.units}, ${item.pictureUrl ?? null})
        RETURNING id, product_id as "productId", product_name as "productName",
          unit_price as "unitPrice", units, picture_url as "pictureUrl", discount
      `
      items.push(created)
    }

    order.items = items
    order.total = items.reduce((sum, item) => sum + (item.unitPrice * item.units - item.discount), 0)
    return order
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    return this.updateStatusWithTx(this.sql, id, status)
  }

  async updateStatusWithTx(tx: Sql, id: number, status: OrderStatus): Promise<Order | undefined> {
    const [order] = await tx<Order[]>`
      UPDATE orders SET status = ${status} WHERE id = ${id}
      RETURNING id, buyer_id as "buyerId", status, description,
        street, city, state, country, zip_code as "zipCode",
        order_date as "orderDate"
    `
    if (!order) return undefined

    order.items = await this.findOrderItems(id)
    order.total = order.items.reduce((sum, item) => sum + (item.unitPrice * item.units - item.discount), 0)
    return order
  }

  private async findOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.sql<OrderItem[]>`
      SELECT id, product_id as "productId", product_name as "productName",
        unit_price as "unitPrice", units, picture_url as "pictureUrl", discount
      FROM order_items WHERE order_id = ${orderId}
      ORDER BY id
    `
  }
}
