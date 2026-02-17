import { type Static, Type } from '@sinclair/typebox'

export const CatalogItemSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  description: Type.String(),
  price: Type.Number(),
  pictureFileName: Type.Union([Type.String(), Type.Null()]),
  catalogTypeId: Type.Integer(),
  catalogBrandId: Type.Integer(),
  availableStock: Type.Integer(),
  maxStockThreshold: Type.Integer(),
  onReorder: Type.Boolean(),
  restockThreshold: Type.Integer(),
})

export type CatalogItem = Static<typeof CatalogItemSchema>

export const CreateCatalogItemSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.String({ maxLength: 2000 }),
  price: Type.Number({ minimum: 0 }),
  pictureFileName: Type.Optional(Type.String()),
  catalogTypeId: Type.Integer(),
  catalogBrandId: Type.Integer(),
  availableStock: Type.Integer({ minimum: 0 }),
  maxStockThreshold: Type.Integer({ minimum: 0, default: 100 }),
  restockThreshold: Type.Integer({ minimum: 0, default: 10 }),
})

export type CreateCatalogItem = Static<typeof CreateCatalogItemSchema>

export const UpdateCatalogItemSchema = Type.Partial(CreateCatalogItemSchema)

export type UpdateCatalogItem = Static<typeof UpdateCatalogItemSchema>

export const CatalogItemsQuerySchema = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 100, default: 10 }),
  brandId: Type.Optional(Type.Integer()),
  typeId: Type.Optional(Type.Integer()),
  search: Type.Optional(Type.String()),
})

export type CatalogItemsQuery = Static<typeof CatalogItemsQuerySchema>

export const ItemByIdParamsSchema = Type.Object({
  id: Type.Integer(),
})
