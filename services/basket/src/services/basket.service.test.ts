import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { NotFoundError } from '@ecommerce/shared'
import { BasketService } from './basket.service.ts'

function createMockBasketRepo() {
  return {
    findByBuyerId: mock.fn(),
    save: mock.fn(async (basket: any) => basket),
    delete: mock.fn(async () => true),
  }
}

function createMockEventBus() {
  return {
    connect: mock.fn(),
    publish: mock.fn(async () => {}),
    subscribe: mock.fn(),
    close: mock.fn(),
  }
}

describe('BasketService', () => {
  let service: BasketService
  let basketRepo: ReturnType<typeof createMockBasketRepo>
  let eventBus: ReturnType<typeof createMockEventBus>

  beforeEach(() => {
    basketRepo = createMockBasketRepo()
    eventBus = createMockEventBus()
    service = new BasketService({
      basketRepository: basketRepo as any,
      eventBus: eventBus as any,
    })
  })

  describe('getBasket', () => {
    it('should return existing basket', async () => {
      const basket = { buyerId: '1', items: [{ productId: 1, productName: 'Mug', unitPrice: 10, quantity: 2 }] }
      basketRepo.findByBuyerId.mock.mockImplementation(async () => basket)

      const result = await service.getBasket('1')
      assert.deepEqual(result, basket)
    })

    it('should return empty basket when none exists', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => null)

      const result = await service.getBasket('1')
      assert.deepEqual(result, { buyerId: '1', items: [] })
    })
  })

  describe('addItem', () => {
    it('should add new item to empty basket', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => null)

      const result = await service.addItem('1', {
        productId: 1, productName: 'Mug', unitPrice: 10, quantity: 1,
      })

      assert.equal(result.items.length, 1)
      assert.equal(result.items[0].productId, 1)
      assert.equal(result.items[0].quantity, 1)
    })

    it('should increment quantity of existing item', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1',
        items: [{ productId: 1, productName: 'Mug', unitPrice: 10, quantity: 2 }],
      }))

      const result = await service.addItem('1', {
        productId: 1, productName: 'Mug', unitPrice: 10, quantity: 3,
      })

      assert.equal(result.items.length, 1)
      assert.equal(result.items[0].quantity, 5)
    })

    it('should add second different item', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1',
        items: [{ productId: 1, productName: 'Mug', unitPrice: 10, quantity: 1 }],
      }))

      const result = await service.addItem('1', {
        productId: 2, productName: 'T-Shirt', unitPrice: 20, quantity: 1,
      })

      assert.equal(result.items.length, 2)
    })
  })

  describe('updateItemQuantity', () => {
    it('should update quantity of existing item', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1',
        items: [{ productId: 1, productName: 'Mug', unitPrice: 10, quantity: 2 }],
      }))

      const result = await service.updateItemQuantity('1', 1, 5)
      assert.equal(result.items[0].quantity, 5)
    })

    it('should throw NotFoundError for missing item', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1', items: [],
      }))

      await assert.rejects(
        () => service.updateItemQuantity('1', 999, 5),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('removeItem', () => {
    it('should remove item from basket', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1',
        items: [
          { productId: 1, productName: 'Mug', unitPrice: 10, quantity: 2 },
          { productId: 2, productName: 'T-Shirt', unitPrice: 20, quantity: 1 },
        ],
      }))

      const result = await service.removeItem('1', 1)
      assert.equal(result.items.length, 1)
      assert.equal(result.items[0].productId, 2)
    })
  })

  describe('updateBasket', () => {
    it('should replace basket contents', async () => {
      const items = [
        { productId: 1, productName: 'Mug', unitPrice: 10, quantity: 3 },
        { productId: 2, productName: 'T-Shirt', unitPrice: 20, quantity: 1 },
      ]

      const result = await service.updateBasket('1', { items })
      assert.equal(result.buyerId, '1')
      assert.deepEqual(result.items, items)
      assert.equal(basketRepo.save.mock.callCount(), 1)
    })
  })

  describe('deleteBasket', () => {
    it('should delete the basket', async () => {
      await service.deleteBasket('1')
      assert.equal(basketRepo.delete.mock.callCount(), 1)
      assert.equal(basketRepo.delete.mock.calls[0].arguments[0], '1')
    })
  })

  describe('checkout', () => {
    it('should publish event and delete basket', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1',
        items: [{ productId: 1, productName: 'Mug', unitPrice: 10, quantity: 2 }],
      }))

      await service.checkout('1')

      assert.equal(eventBus.publish.mock.callCount(), 1)
      const event = eventBus.publish.mock.calls[0].arguments[0]
      assert.equal(event.type, 'basket.checkout')
      assert.equal(basketRepo.delete.mock.callCount(), 1)
    })

    it('should include address fields in checkout event', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1',
        items: [{ productId: 1, productName: 'Mug', unitPrice: 10, quantity: 1 }],
      }))

      await service.checkout('1', { street: '123 Main St', city: 'NYC', state: 'NY', country: 'USA', zipCode: '10001' })

      const event = eventBus.publish.mock.calls[0].arguments[0]
      assert.equal(event.payload.street, '123 Main St')
      assert.equal(event.payload.city, 'NYC')
      assert.equal(event.payload.country, 'USA')
      assert.equal(event.payload.zipCode, '10001')
    })

    it('should throw NotFoundError for empty basket', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => null)

      await assert.rejects(
        () => service.checkout('1'),
        (err: Error) => err instanceof NotFoundError,
      )
    })

    it('should throw NotFoundError for basket with no items', async () => {
      basketRepo.findByBuyerId.mock.mockImplementation(async () => ({
        buyerId: '1', items: [],
      }))

      await assert.rejects(
        () => service.checkout('1'),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })
})
