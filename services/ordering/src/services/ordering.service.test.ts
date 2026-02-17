import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { NotFoundError, ValidationError } from '@ecommerce/shared'
import { OrderingService } from './ordering.service.ts'

function createMockOrderRepo() {
  return {
    findByBuyerId: mock.fn(),
    findById: mock.fn(),
    createWithTx: mock.fn(),
    updateStatusWithTx: mock.fn(),
  }
}

function createMockOutboxStore() {
  return {
    save: mock.fn(async () => {}),
    getUnpublished: mock.fn(async () => []),
    markPublished: mock.fn(async () => {}),
  }
}

function createMockSql() {
  return Object.assign(
    mock.fn(async () => []),
    { begin: mock.fn(async (cb: any) => cb({})) },
  )
}

function createMockEventBus() {
  return {
    connect: mock.fn(),
    publish: mock.fn(async () => {}),
    subscribe: mock.fn(),
    close: mock.fn(),
  }
}

describe('OrderingService', () => {
  let service: OrderingService
  let orderRepo: ReturnType<typeof createMockOrderRepo>
  let outboxStore: ReturnType<typeof createMockOutboxStore>
  let sql: ReturnType<typeof createMockSql>
  let eventBus: ReturnType<typeof createMockEventBus>

  beforeEach(() => {
    orderRepo = createMockOrderRepo()
    outboxStore = createMockOutboxStore()
    sql = createMockSql()
    eventBus = createMockEventBus()
    service = new OrderingService({
      orderRepository: orderRepo as any,
      eventBus: eventBus as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
    })
  })

  describe('getOrders', () => {
    it('should return orders for buyer', async () => {
      const orders = { data: [{ id: 1, buyerId: 1, status: 'submitted' }], total: 1, page: 1, pageSize: 10 }
      orderRepo.findByBuyerId.mock.mockImplementation(async () => orders)

      const result = await service.getOrders(1, { page: 1, pageSize: 10 })
      assert.deepEqual(result, orders)
      assert.equal(orderRepo.findByBuyerId.mock.calls[0].arguments[0], 1)
    })
  })

  describe('createOrder', () => {
    it('should create order and save outbox event', async () => {
      const order = { id: 1, buyerId: 1, status: 'submitted', total: 20.00, items: [] }
      orderRepo.createWithTx.mock.mockImplementation(async () => order)

      const result = await service.createOrder(1, {
        items: [{ productId: 1, productName: 'Mug', unitPrice: 10, units: 2 }],
      })

      assert.equal(result.id, 1)
      assert.equal(sql.begin.mock.callCount(), 1)
      assert.equal(outboxStore.save.mock.callCount(), 1)
      const event = outboxStore.save.mock.calls[0].arguments[1]
      assert.equal(event.type, 'order.submitted')
      assert.equal(event.payload.orderId, 1)
      assert.equal(event.payload.buyerId, 1)
    })
  })

  describe('getOrderById', () => {
    it('should return order for correct buyer', async () => {
      const order = { id: 1, buyerId: 1, status: 'submitted' }
      orderRepo.findById.mock.mockImplementation(async () => order)

      const result = await service.getOrderById(1, 1)
      assert.equal(result.id, 1)
    })

    it('should throw NotFoundError for wrong buyer', async () => {
      const order = { id: 1, buyerId: 1, status: 'submitted' }
      orderRepo.findById.mock.mockImplementation(async () => order)

      await assert.rejects(
        () => service.getOrderById(1, 999),
        (err: Error) => err instanceof NotFoundError,
      )
    })

    it('should throw NotFoundError for missing order', async () => {
      orderRepo.findById.mock.mockImplementation(async () => undefined)

      await assert.rejects(
        () => service.getOrderById(999, 1),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('updateOrderStatus', () => {
    it('should allow valid transition submitted -> awaiting_validation', async () => {
      const order = { id: 1, buyerId: 1, status: 'submitted', total: 20.00 }
      const updated = { ...order, status: 'awaiting_validation' }
      orderRepo.findById.mock.mockImplementation(async () => order)
      orderRepo.updateStatusWithTx.mock.mockImplementation(async () => updated)

      const result = await service.updateOrderStatus(1, 1, 'awaiting_validation')

      assert.equal(result.status, 'awaiting_validation')
      assert.equal(sql.begin.mock.callCount(), 1)
      assert.equal(outboxStore.save.mock.callCount(), 1)
    })

    it('should reject invalid transition submitted -> shipped', async () => {
      const order = { id: 1, buyerId: 1, status: 'submitted' }
      orderRepo.findById.mock.mockImplementation(async () => order)

      await assert.rejects(
        () => service.updateOrderStatus(1, 1, 'shipped'),
        (err: Error) => err instanceof ValidationError,
      )
    })

    it('should reject transition from cancelled', async () => {
      const order = { id: 1, buyerId: 1, status: 'cancelled' }
      orderRepo.findById.mock.mockImplementation(async () => order)

      await assert.rejects(
        () => service.updateOrderStatus(1, 1, 'confirmed'),
        (err: Error) => err instanceof ValidationError,
      )
    })
  })

  describe('cancelOrder', () => {
    it('should cancel a submitted order', async () => {
      const order = { id: 1, buyerId: 1, status: 'submitted', total: 20.00 }
      const cancelled = { ...order, status: 'cancelled' }
      orderRepo.findById.mock.mockImplementation(async () => order)
      orderRepo.updateStatusWithTx.mock.mockImplementation(async () => cancelled)

      const result = await service.cancelOrder(1, 1)
      assert.equal(result.status, 'cancelled')
    })

    it('should not cancel a shipped order', async () => {
      const order = { id: 1, buyerId: 1, status: 'shipped' }
      orderRepo.findById.mock.mockImplementation(async () => order)

      await assert.rejects(
        () => service.cancelOrder(1, 1),
        (err: Error) => err instanceof ValidationError,
      )
    })
  })
})
