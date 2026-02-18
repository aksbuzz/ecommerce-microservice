import { withTransaction, type Sql } from '@ecommerce/db'
import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { OutboxStore } from '@ecommerce/outbox'
import type { Logger } from '@ecommerce/logger'

interface OrderItem {
  productId: number
  units: number
}

interface AwaitingValidationPayload {
  orderId: number
  buyerId: number
  items: OrderItem[]
}

interface Deps {
  outboxStore: OutboxStore
  sql: Sql
  log: Logger
}

export function createStockValidationHandler({ outboxStore, sql, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const { orderId, buyerId, items } = event.payload as unknown as AwaitingValidationPayload
    log.info({ orderId, itemCount: items.length }, 'Validating stock for order')

    await withTransaction(sql, async tx => {
      const rejectedItems: Array<{ productId: number; available: number; requested: number }> = [];

      for (const item of items) {
        const [row] = await tx<[{ availableStock: number }?]>`
          SELECT available_stock as "availableStock"
          FROM catalog_items WHERE id = ${item.productId}
        `;

        const available = row?.availableStock ?? 0;
        if (available < item.units) {
          rejectedItems.push({ productId: item.productId, available, requested: item.units });
        }
      }

      if (rejectedItems.length === 0) {
        await outboxStore.save(tx, {
          id: crypto.randomUUID(),
          type: 'stock.confirmed',
          timestamp: new Date().toISOString(),
          payload: { orderId, buyerId },
        });
        log.info({ orderId }, 'Stock confirmed for all items');
      } else {
        await outboxStore.save(tx, {
          id: crypto.randomUUID(),
          type: 'stock.rejected',
          timestamp: new Date().toISOString(),
          payload: { orderId, buyerId, rejectedItems },
        });
        log.warn({ orderId, rejectedItems }, 'Stock rejected — insufficient inventory');
      }
    });
  }
}
