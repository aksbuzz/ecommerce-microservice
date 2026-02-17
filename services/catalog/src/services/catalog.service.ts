import type { Sql } from '@ecommerce/db'
import type { OutboxStore } from '@ecommerce/outbox'
import { NotFoundError } from '@ecommerce/shared'
import type { CatalogBrandRepository } from '../repositories/catalog-brand.repository.ts'
import type { CatalogItemRepository } from '../repositories/catalog-item.repository.ts'
import type { CatalogTypeRepository } from '../repositories/catalog-type.repository.ts'
import type { CreateCatalogBrand } from '../schemas/catalog-brand.schema.ts'
import type { CatalogItemsQuery, CreateCatalogItem, UpdateCatalogItem } from '../schemas/catalog-item.schema.ts'
import type { CreateCatalogType } from '../schemas/catalog-type.schema.ts'

interface Deps {
  catalogItemRepository: CatalogItemRepository
  catalogBrandRepository: CatalogBrandRepository
  catalogTypeRepository: CatalogTypeRepository
  outboxStore: OutboxStore
  sql: Sql
}

export class CatalogService {
  catalogItemRepository: CatalogItemRepository
  catalogBrandRepository: CatalogBrandRepository
  catalogTypeRepository: CatalogTypeRepository
  outboxStore: OutboxStore
  sql: Sql

  constructor({ catalogItemRepository, catalogBrandRepository, catalogTypeRepository, outboxStore, sql }: Deps) {
    this.catalogItemRepository = catalogItemRepository
    this.catalogBrandRepository = catalogBrandRepository
    this.catalogTypeRepository = catalogTypeRepository
    this.outboxStore = outboxStore
    this.sql = sql
  }

  // Items
  async getItems(query: CatalogItemsQuery) {
    return this.catalogItemRepository.findAll({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
      brandId: query.brandId,
      typeId: query.typeId,
      search: query.search,
    })
  }

  async getItemById(id: number) {
    const item = await this.catalogItemRepository.findById(id)
    if (!item) throw new NotFoundError('CatalogItem', id)
    return item
  }

  async createItem(data: CreateCatalogItem) {
    const item = await this.catalogItemRepository.create(data)
    await this.outboxStore.save(this.sql, {
      id: crypto.randomUUID(),
      type: 'catalog.item.created',
      timestamp: new Date().toISOString(),
      payload: { itemId: item.id, name: item.name, price: item.price },
    })
    return item
  }

  async updateItem(id: number, data: UpdateCatalogItem) {
    const existing = await this.catalogItemRepository.findById(id)
    if (!existing) throw new NotFoundError('CatalogItem', id)

    const updated = await this.catalogItemRepository.update(id, data)

    if (data.price !== undefined && data.price !== existing.price) {
      await this.outboxStore.save(this.sql, {
        id: crypto.randomUUID(),
        type: 'catalog.item.price_changed',
        timestamp: new Date().toISOString(),
        payload: { itemId: id, oldPrice: existing.price, newPrice: data.price },
      })
    }

    return updated
  }

  async deleteItem(id: number) {
    const deleted = await this.catalogItemRepository.delete(id)
    if (!deleted) throw new NotFoundError('CatalogItem', id)

    await this.outboxStore.save(this.sql, {
      id: crypto.randomUUID(),
      type: 'catalog.item.deleted',
      timestamp: new Date().toISOString(),
      payload: { itemId: id },
    })
  }

  // Brands
  async getBrands() {
    return this.catalogBrandRepository.findAll()
  }

  async createBrand(data: CreateCatalogBrand) {
    return this.catalogBrandRepository.create(data)
  }

  async deleteBrand(id: number) {
    const deleted = await this.catalogBrandRepository.delete(id)
    if (!deleted) throw new NotFoundError('CatalogBrand', id)
  }

  // Types
  async getTypes() {
    return this.catalogTypeRepository.findAll()
  }

  async createType(data: CreateCatalogType) {
    return this.catalogTypeRepository.create(data)
  }

  async deleteType(id: number) {
    const deleted = await this.catalogTypeRepository.delete(id)
    if (!deleted) throw new NotFoundError('CatalogType', id)
  }
}
