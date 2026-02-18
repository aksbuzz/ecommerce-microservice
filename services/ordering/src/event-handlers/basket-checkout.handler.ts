import type { IntegrationEvent } from '@ecommerce/event-bus'
import type { Logger } from '@ecommerce/logger'
import type { OrderingService } from '../services/ordering.service.ts'

interface BasketCheckoutPayload {
  buyerId: string
  items: Array<{
    productId: number
    productName: string
    unitPrice: number
    quantity: number
    pictureUrl?: string
  }>
  street?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
}

interface Deps {
  orderingService: OrderingService
  log: Logger
}

export function createBasketCheckoutHandler({ orderingService, log }: Deps) {
  return async (event: IntegrationEvent): Promise<void> => {
    const payload = event.payload as unknown as BasketCheckoutPayload
    log.info({ buyerId: payload.buyerId, eventId: event.id }, 'Processing basket checkout event')

    await orderingService.createOrder(Number(payload.buyerId), {
      items: payload.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        units: item.quantity,
        pictureUrl: item.pictureUrl,
      })),
      street: payload.street,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      zipCode: payload.zipCode,
    })

    log.info({ buyerId: payload.buyerId }, 'Order created from basket checkout')
  }
}
