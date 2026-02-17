import type { Sql } from '@ecommerce/db'
import type { CatalogType, CreateCatalogType } from '../schemas/catalog-type.schema.ts'

interface Deps {
  sql: Sql
}

export class CatalogTypeRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findAll(): Promise<CatalogType[]> {
    return this.sql<CatalogType[]>`SELECT id, type FROM catalog_types ORDER BY type`
  }

  async findById(id: number): Promise<CatalogType | undefined> {
    const [row] = await this.sql<CatalogType[]>`SELECT id, type FROM catalog_types WHERE id = ${id}`
    return row
  }

  async create(data: CreateCatalogType): Promise<CatalogType> {
    const [row] = await this.sql<CatalogType[]>`
      INSERT INTO catalog_types (type) VALUES (${data.type}) RETURNING id, type
    `
    return row
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.sql`DELETE FROM catalog_types WHERE id = ${id}`
    return result.count > 0
  }
}
