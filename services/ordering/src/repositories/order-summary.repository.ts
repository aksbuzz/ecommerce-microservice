import type { Sql } from '@ecommerce/db'
import { type PaginatedResult, paginate } from '@ecommerce/shared'

export interface OrderSummary {
  orderId: number
  buyerId: number
  status: string
  total: number
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface Deps {
  sql: Sql
}

export class OrderSummaryRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findByBuyerId(buyerId: number, page = 1, pageSize = 20): Promise<PaginatedResult<OrderSummary>> {
    const { limit, offset } = paginate({ page, pageSize })

    const [{ count }] = await this.sql<[{ count: string }]>`
      SELECT COUNT(*) as count FROM order_summaries WHERE buyer_id = ${buyerId}
    `

    const items = await this.sql<OrderSummary[]>`
      SELECT order_id as "orderId", buyer_id as "buyerId", status, total,
        item_count as "itemCount", created_at as "createdAt", updated_at as "updatedAt"
      FROM order_summaries
      WHERE buyer_id = ${buyerId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalItems = Number(count)
    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      page,
      pageSize,
    }
  }

  async upsert(tx: Sql, summary: { orderId: number; buyerId: number; status: string; total: number; itemCount: number }): Promise<void> {
    await tx`
      INSERT INTO order_summaries (order_id, buyer_id, status, total, item_count)
      VALUES (${summary.orderId}, ${summary.buyerId}, ${summary.status}, ${summary.total}, ${summary.itemCount})
      ON CONFLICT (order_id) DO UPDATE SET
        status = EXCLUDED.status,
        total = EXCLUDED.total,
        item_count = EXCLUDED.item_count,
        updated_at = NOW()
    `
  }

  async updateStatus(orderId: number, status: string): Promise<void> {
    await this.sql`
      UPDATE order_summaries SET status = ${status}, updated_at = NOW()
      WHERE order_id = ${orderId}
    `
  }
}
