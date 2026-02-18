import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { createBasketCheckoutHandler } from './basket-checkout.handler.ts'

function createMockOrderingService() {
  return {
    createOrder: mock.fn(async () => ({ id: 1, status: 'submitted' })),
  }
}

function createMockLogger() {
  return { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn(), trace: mock.fn(), fatal: mock.fn(), child: mock.fn() }
}

describe('createBasketCheckoutHandler', () => {
  it('should create an order from basket checkout event', async () => {
    const orderingService = createMockOrderingService()
    const log = createMockLogger()
    const handler = createBasketCheckoutHandler({ orderingService: orderingService as any, log: log as any })

    const event = {
      id: 'evt-1',
      type: 'basket.checkout',
      timestamp: new Date().toISOString(),
      payload: {
        buyerId: '42',
        items: [
          { productId: 1, productName: 'Mug', unitPrice: 10.00, quantity: 2 },
          { productId: 2, productName: 'Shirt', unitPrice: 25.00, quantity: 1, pictureUrl: 'http://img/shirt.png' },
        ],
        street: '123 Main St',
        city: 'Seattle',
      },
    }

    await handler(event)

    assert.equal(orderingService.createOrder.mock.callCount(), 1)
    const [buyerId, data] = orderingService.createOrder.mock.calls[0].arguments
    assert.equal(buyerId, 42)
    assert.equal(data.items.length, 2)
    // quantity should be mapped to units
    assert.equal(data.items[0].units, 2)
    assert.equal(data.items[0].productName, 'Mug')
    assert.equal(data.items[1].pictureUrl, 'http://img/shirt.png')
    assert.equal(data.street, '123 Main St')
    assert.equal(data.city, 'Seattle')
  })

  it('should convert buyerId from string to number', async () => {
    const orderingService = createMockOrderingService()
    const log = createMockLogger()
    const handler = createBasketCheckoutHandler({ orderingService: orderingService as any, log: log as any })

    const event = {
      id: 'evt-2',
      type: 'basket.checkout',
      timestamp: new Date().toISOString(),
      payload: {
        buyerId: '99',
        items: [{ productId: 1, productName: 'Mug', unitPrice: 5.00, quantity: 1 }],
      },
    }

    await handler(event)

    const [buyerId] = orderingService.createOrder.mock.calls[0].arguments
    assert.equal(buyerId, 99)
    assert.equal(typeof buyerId, 'number')
  })
})
