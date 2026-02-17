import { type Static, Type } from '@sinclair/typebox'

export const CatalogTypeSchema = Type.Object({
  id: Type.Integer(),
  type: Type.String(),
})

export type CatalogType = Static<typeof CatalogTypeSchema>

export const CreateCatalogTypeSchema = Type.Object({
  type: Type.String({ minLength: 1, maxLength: 100 }),
})

export type CreateCatalogType = Static<typeof CreateCatalogTypeSchema>
