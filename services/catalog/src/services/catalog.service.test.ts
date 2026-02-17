import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import { NotFoundError } from '@ecommerce/shared'
import { CatalogService } from './catalog.service.ts'

function createMockRepo() {
  return {
    findAll: mock.fn(),
    findById: mock.fn(),
    create: mock.fn(),
    update: mock.fn(),
    delete: mock.fn(),
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

describe('CatalogService', () => {
  let service: CatalogService
  let itemRepo: ReturnType<typeof createMockRepo>
  let brandRepo: ReturnType<typeof createMockRepo>
  let typeRepo: ReturnType<typeof createMockRepo>
  let outboxStore: ReturnType<typeof createMockOutboxStore>
  let sql: ReturnType<typeof createMockSql>

  beforeEach(() => {
    itemRepo = createMockRepo()
    brandRepo = createMockRepo()
    typeRepo = createMockRepo()
    outboxStore = createMockOutboxStore()
    sql = createMockSql()
    service = new CatalogService({
      catalogItemRepository: itemRepo as any,
      catalogBrandRepository: brandRepo as any,
      catalogTypeRepository: typeRepo as any,
      outboxStore: outboxStore as any,
      sql: sql as any,
    })
  })

  describe('getItemById', () => {
    it('should return item when found', async () => {
      const mockItem = { id: 1, name: 'Test Item', price: 10.00 }
      itemRepo.findById.mock.mockImplementation(async () => mockItem)

      const result = await service.getItemById(1)
      assert.deepEqual(result, mockItem)
    })

    it('should throw NotFoundError when item not found', async () => {
      itemRepo.findById.mock.mockImplementation(async () => undefined)

      await assert.rejects(
        () => service.getItemById(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('createItem', () => {
    it('should create item and save outbox event', async () => {
      const input = {
        name: 'New Mug',
        description: 'A mug',
        price: 9.99,
        catalogTypeId: 1,
        catalogBrandId: 1,
        availableStock: 50,
      }
      const created = { id: 1, ...input }
      itemRepo.create.mock.mockImplementation(async () => created)

      const result = await service.createItem(input)

      assert.equal(result.id, 1)
      assert.equal(outboxStore.save.mock.callCount(), 1)
      const event = outboxStore.save.mock.calls[0].arguments[1]
      assert.equal(event.type, 'catalog.item.created')
    })
  })

  describe('updateItem', () => {
    it('should save outbox event when price changes', async () => {
      const existing = { id: 1, name: 'Mug', price: 10.00 }
      itemRepo.findById.mock.mockImplementation(async () => existing)
      itemRepo.update.mock.mockImplementation(async () => ({ ...existing, price: 15.00 }))

      await service.updateItem(1, { price: 15.00 })

      assert.equal(outboxStore.save.mock.callCount(), 1)
      const event = outboxStore.save.mock.calls[0].arguments[1]
      assert.equal(event.type, 'catalog.item.price_changed')
      assert.equal(event.payload.oldPrice, 10.00)
      assert.equal(event.payload.newPrice, 15.00)
    })

    it('should not save outbox event when price stays the same', async () => {
      const existing = { id: 1, name: 'Mug', price: 10.00 }
      itemRepo.findById.mock.mockImplementation(async () => existing)
      itemRepo.update.mock.mockImplementation(async () => ({ ...existing, name: 'Updated Mug' }))

      await service.updateItem(1, { name: 'Updated Mug' })

      assert.equal(outboxStore.save.mock.callCount(), 0)
    })
  })

  describe('deleteItem', () => {
    it('should delete item and save outbox event', async () => {
      itemRepo.delete.mock.mockImplementation(async () => true)
      await service.deleteItem(1)
      assert.equal(itemRepo.delete.mock.callCount(), 1)
      assert.equal(outboxStore.save.mock.callCount(), 1)
      const event = outboxStore.save.mock.calls[0].arguments[1]
      assert.equal(event.type, 'catalog.item.deleted')
      assert.equal(event.payload.itemId, 1)
    })

    it('should throw NotFoundError when item does not exist', async () => {
      itemRepo.delete.mock.mockImplementation(async () => false)
      await assert.rejects(
        () => service.deleteItem(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('getItems', () => {
    it('should pass query parameters to repository', async () => {
      const items = { data: [{ id: 1, name: 'Mug' }], total: 1, page: 1, pageSize: 10 }
      itemRepo.findAll.mock.mockImplementation(async () => items)

      const result = await service.getItems({ page: 2, pageSize: 5, brandId: 1, search: 'mug' })
      assert.deepEqual(result, items)
      const args = itemRepo.findAll.mock.calls[0].arguments[0]
      assert.equal(args.page, 2)
      assert.equal(args.pageSize, 5)
      assert.equal(args.brandId, 1)
      assert.equal(args.search, 'mug')
    })

    it('should use default pagination when not provided', async () => {
      itemRepo.findAll.mock.mockImplementation(async () => ({ data: [], total: 0, page: 1, pageSize: 10 }))

      await service.getItems({})
      const args = itemRepo.findAll.mock.calls[0].arguments[0]
      assert.equal(args.page, 1)
      assert.equal(args.pageSize, 10)
    })
  })

  describe('getBrands', () => {
    it('should return all brands', async () => {
      const brands = [{ id: 1, brand: 'Azure' }, { id: 2, brand: '.NET' }]
      brandRepo.findAll.mock.mockImplementation(async () => brands)

      const result = await service.getBrands()
      assert.deepEqual(result, brands)
    })
  })

  describe('createBrand', () => {
    it('should create a brand', async () => {
      const created = { id: 1, brand: 'NewBrand' }
      brandRepo.create.mock.mockImplementation(async () => created)

      const result = await service.createBrand({ brand: 'NewBrand' })
      assert.equal(result.id, 1)
      assert.equal(result.brand, 'NewBrand')
    })
  })

  describe('deleteBrand', () => {
    it('should delete a brand', async () => {
      brandRepo.delete.mock.mockImplementation(async () => true)
      await service.deleteBrand(1)
      assert.equal(brandRepo.delete.mock.callCount(), 1)
    })

    it('should throw NotFoundError for missing brand', async () => {
      brandRepo.delete.mock.mockImplementation(async () => false)
      await assert.rejects(
        () => service.deleteBrand(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })

  describe('getTypes', () => {
    it('should return all types', async () => {
      const types = [{ id: 1, type: 'Mug' }, { id: 2, type: 'T-Shirt' }]
      typeRepo.findAll.mock.mockImplementation(async () => types)

      const result = await service.getTypes()
      assert.deepEqual(result, types)
    })
  })

  describe('createType', () => {
    it('should create a type', async () => {
      const created = { id: 1, type: 'Cap' }
      typeRepo.create.mock.mockImplementation(async () => created)

      const result = await service.createType({ type: 'Cap' })
      assert.equal(result.id, 1)
      assert.equal(result.type, 'Cap')
    })
  })

  describe('deleteType', () => {
    it('should delete a type', async () => {
      typeRepo.delete.mock.mockImplementation(async () => true)
      await service.deleteType(1)
      assert.equal(typeRepo.delete.mock.callCount(), 1)
    })

    it('should throw NotFoundError for missing type', async () => {
      typeRepo.delete.mock.mockImplementation(async () => false)
      await assert.rejects(
        () => service.deleteType(999),
        (err: Error) => err instanceof NotFoundError,
      )
    })
  })
})
