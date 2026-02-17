import type { EventBus } from '@ecommerce/event-bus'
import { NotFoundError } from '@ecommerce/shared'
import type { BasketRepository } from '../repositories/basket.repository.ts'
import type { AddItemInput, CheckoutInput, CustomerBasket, UpdateBasketInput } from '../schemas/basket.schema.ts'

interface Deps {
  basketRepository: BasketRepository
  eventBus: EventBus
}

export class BasketService {
  basketRepository: BasketRepository
  eventBus: EventBus

  constructor({ basketRepository, eventBus }: Deps) {
    this.basketRepository = basketRepository
    this.eventBus = eventBus
  }

  async getBasket(buyerId: string): Promise<CustomerBasket> {
    const basket = await this.basketRepository.findByBuyerId(buyerId)
    return basket ?? { buyerId, items: [] }
  }

  async updateBasket(buyerId: string, data: UpdateBasketInput): Promise<CustomerBasket> {
    const basket: CustomerBasket = { buyerId, items: data.items }
    return this.basketRepository.save(basket)
  }

  async addItem(buyerId: string, item: AddItemInput): Promise<CustomerBasket> {
    const basket = await this.getBasket(buyerId)

    const existing = basket.items.find((i) => i.productId === item.productId)
    if (existing) {
      existing.quantity += item.quantity
      existing.unitPrice = item.unitPrice
    } else {
      basket.items.push({ ...item })
    }

    return this.basketRepository.save(basket)
  }

  async updateItemQuantity(buyerId: string, productId: number, quantity: number): Promise<CustomerBasket> {
    const basket = await this.getBasket(buyerId)

    const item = basket.items.find((i) => i.productId === productId)
    if (!item) throw new NotFoundError('BasketItem', productId)

    item.quantity = quantity
    return this.basketRepository.save(basket)
  }

  async removeItem(buyerId: string, productId: number): Promise<CustomerBasket> {
    const basket = await this.getBasket(buyerId)
    basket.items = basket.items.filter((i) => i.productId !== productId)
    return this.basketRepository.save(basket)
  }

  async deleteBasket(buyerId: string): Promise<void> {
    await this.basketRepository.delete(buyerId)
  }

  async checkout(buyerId: string, data?: CheckoutInput): Promise<void> {
    const basket = await this.basketRepository.findByBuyerId(buyerId)
    if (!basket || basket.items.length === 0) {
      throw new NotFoundError('Basket', buyerId)
    }

    await this.eventBus.publish({
      id: crypto.randomUUID(),
      type: 'basket.checkout',
      timestamp: new Date().toISOString(),
      payload: {
        buyerId: basket.buyerId,
        items: basket.items,
        ...(data?.street && { street: data.street }),
        ...(data?.city && { city: data.city }),
        ...(data?.state && { state: data.state }),
        ...(data?.country && { country: data.country }),
        ...(data?.zipCode && { zipCode: data.zipCode }),
      },
    })

    await this.basketRepository.delete(buyerId)
  }
}
