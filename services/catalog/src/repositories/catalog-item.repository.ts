import type { Sql } from '@ecommerce/db'
import { type PaginatedResult, type PaginationParams, paginate } from '@ecommerce/shared'
import type { CatalogItem, CreateCatalogItem, UpdateCatalogItem } from '../schemas/catalog-item.schema.ts'

interface FindAllOptions extends PaginationParams {
  brandId?: number
  typeId?: number
  search?: string
}

interface Deps {
  sql: Sql
}

export class CatalogItemRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<CatalogItem>> {
    const { limit, offset } = paginate(options)

    const conditions = []
    if (options.brandId) conditions.push(this.sql`ci.catalog_brand_id = ${options.brandId}`)
    if (options.typeId) conditions.push(this.sql`ci.catalog_type_id = ${options.typeId}`)
    if (options.search) conditions.push(this.sql`ci.name ILIKE ${'%' + options.search + '%'}`)

    const where = conditions.length > 0
      ? this.sql`WHERE ${conditions.reduce((a, b) => this.sql`${a} AND ${b}`)}`
      : this.sql``

    const [{ count }] = await this.sql<[{ count: string }]>`
      SELECT COUNT(*) as count FROM catalog_items ci ${where}
    `

    const items = await this.sql<CatalogItem[]>`
      SELECT
        ci.id, ci.name, ci.description, ci.price,
        ci.picture_file_name as "pictureFileName",
        ci.catalog_type_id as "catalogTypeId",
        ci.catalog_brand_id as "catalogBrandId",
        ci.available_stock as "availableStock",
        ci.max_stock_threshold as "maxStockThreshold",
        ci.on_reorder as "onReorder",
        ci.restock_threshold as "restockThreshold"
      FROM catalog_items ci
      ${where}
      ORDER BY ci.name
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalItems = Number(count)
    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / options.pageSize),
      page: options.page,
      pageSize: options.pageSize,
    }
  }

  async findById(id: number): Promise<CatalogItem | undefined> {
    const [row] = await this.sql<CatalogItem[]>`
      SELECT
        id, name, description, price,
        picture_file_name as "pictureFileName",
        catalog_type_id as "catalogTypeId",
        catalog_brand_id as "catalogBrandId",
        available_stock as "availableStock",
        max_stock_threshold as "maxStockThreshold",
        on_reorder as "onReorder",
        restock_threshold as "restockThreshold"
      FROM catalog_items WHERE id = ${id}
    `
    return row
  }

  async create(data: CreateCatalogItem): Promise<CatalogItem> {
    const [row] = await this.sql<CatalogItem[]>`
      INSERT INTO catalog_items (
        name, description, price, picture_file_name,
        catalog_type_id, catalog_brand_id, available_stock,
        max_stock_threshold, restock_threshold
      ) VALUES (
        ${data.name}, ${data.description}, ${data.price}, ${data.pictureFileName ?? null},
        ${data.catalogTypeId}, ${data.catalogBrandId}, ${data.availableStock},
        ${data.maxStockThreshold ?? 100}, ${data.restockThreshold ?? 10}
      ) RETURNING
        id, name, description, price,
        picture_file_name as "pictureFileName",
        catalog_type_id as "catalogTypeId",
        catalog_brand_id as "catalogBrandId",
        available_stock as "availableStock",
        max_stock_threshold as "maxStockThreshold",
        on_reorder as "onReorder",
        restock_threshold as "restockThreshold"
    `
    return row
  }

  async update(id: number, data: UpdateCatalogItem): Promise<CatalogItem | undefined> {
    const sets = []
    if (data.name !== undefined) sets.push(this.sql`name = ${data.name}`)
    if (data.description !== undefined) sets.push(this.sql`description = ${data.description}`)
    if (data.price !== undefined) sets.push(this.sql`price = ${data.price}`)
    if (data.pictureFileName !== undefined) sets.push(this.sql`picture_file_name = ${data.pictureFileName}`)
    if (data.catalogTypeId !== undefined) sets.push(this.sql`catalog_type_id = ${data.catalogTypeId}`)
    if (data.catalogBrandId !== undefined) sets.push(this.sql`catalog_brand_id = ${data.catalogBrandId}`)
    if (data.availableStock !== undefined) sets.push(this.sql`available_stock = ${data.availableStock}`)
    if (data.maxStockThreshold !== undefined) sets.push(this.sql`max_stock_threshold = ${data.maxStockThreshold}`)
    if (data.restockThreshold !== undefined) sets.push(this.sql`restock_threshold = ${data.restockThreshold}`)

    if (sets.length === 0) return this.findById(id)

    const [row] = await this.sql<CatalogItem[]>`
      UPDATE catalog_items
      SET ${sets.reduce((a, b) => this.sql`${a}, ${b}`)}
      WHERE id = ${id}
      RETURNING
        id, name, description, price,
        picture_file_name as "pictureFileName",
        catalog_type_id as "catalogTypeId",
        catalog_brand_id as "catalogBrandId",
        available_stock as "availableStock",
        max_stock_threshold as "maxStockThreshold",
        on_reorder as "onReorder",
        restock_threshold as "restockThreshold"
    `
    return row
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.sql`DELETE FROM catalog_items WHERE id = ${id}`
    return result.count > 0
  }
}
