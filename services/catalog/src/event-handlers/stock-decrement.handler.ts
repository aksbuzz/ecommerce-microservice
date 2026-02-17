import type { Sql } from '@ecommerce/db'
import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { Logger } from 'pino'

interface OrderItem {
  productId: number
  units: number
}

interface OrderPaidPayload {
  orderId: number
  buyerId: number
  items: OrderItem[]
}

interface Deps {
  sql: Sql
  log: Logger
}

/**
 * Decrements stock for each item after a successful payment.
 * Uses optimistic check (available_stock >= units) to prevent negative stock.
 */
export function createStockDecrementHandler({ sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, items } = event.payload as unknown as OrderPaidPayload
    log.info({ orderId, itemCount: items.length }, 'Decrementing stock for paid order')

    await sql.begin(async (tx) => {
      for (const item of items) {
        const [result] = await tx`
          UPDATE catalog_items
          SET available_stock = available_stock - ${item.units}
          WHERE id = ${item.productId} AND available_stock >= ${item.units}
          RETURNING id
        `

        if (!result) {
          log.warn(
            { orderId, productId: item.productId, units: item.units },
            'Stock decrement failed — concurrent depletion or missing item',
          )
        }
      }
    })

    log.info({ orderId }, 'Stock decremented successfully')
  }
}
