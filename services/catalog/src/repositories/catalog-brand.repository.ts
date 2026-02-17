import type { Sql } from '@ecommerce/db'
import type { CatalogBrand, CreateCatalogBrand } from '../schemas/catalog-brand.schema.ts'

interface Deps {
  sql: Sql
}

export class CatalogBrandRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findAll(): Promise<CatalogBrand[]> {
    return this.sql<CatalogBrand[]>`SELECT id, brand FROM catalog_brands ORDER BY brand`
  }

  async findById(id: number): Promise<CatalogBrand | undefined> {
    const [row] = await this.sql<CatalogBrand[]>`SELECT id, brand FROM catalog_brands WHERE id = ${id}`
    return row
  }

  async create(data: CreateCatalogBrand): Promise<CatalogBrand> {
    const [row] = await this.sql<CatalogBrand[]>`
      INSERT INTO catalog_brands (brand) VALUES (${data.brand}) RETURNING id, brand
    `
    return row
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.sql`DELETE FROM catalog_brands WHERE id = ${id}`
    return result.count > 0
  }
}
