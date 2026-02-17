import { type Static, Type } from '@sinclair/typebox'

export const CatalogBrandSchema = Type.Object({
  id: Type.Integer(),
  brand: Type.String(),
})

export type CatalogBrand = Static<typeof CatalogBrandSchema>

export const CreateCatalogBrandSchema = Type.Object({
  brand: Type.String({ minLength: 1, maxLength: 100 }),
})

export type CreateCatalogBrand = Static<typeof CreateCatalogBrandSchema>
