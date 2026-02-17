import { authGuard } from '@ecommerce/auth'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { CatalogBrandSchema, CreateCatalogBrandSchema } from '../schemas/catalog-brand.schema.ts'
import { ItemByIdParamsSchema } from '../schemas/catalog-item.schema.ts'

export async function brandRoutes(app: FastifyInstance): Promise<void> {
  app.get('/brands', {
    schema: {
      response: { 200: Type.Array(CatalogBrandSchema) },
    },
    handler: async (request) => {
      const { catalogService } = request.diScope.cradle
      return catalogService.getBrands()
    },
  })

  app.post('/brands', {
    preHandler: authGuard,
    schema: {
      body: CreateCatalogBrandSchema,
      response: { 201: CatalogBrandSchema },
    },
    handler: async (request, reply) => {
      const { catalogService } = request.diScope.cradle
      const brand = await catalogService.createBrand(request.body)
      return reply.status(201).send(brand)
    },
  })

  app.delete('/brands/:id', {
    preHandler: authGuard,
    schema: {
      params: ItemByIdParamsSchema,
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { catalogService } = request.diScope.cradle
      await catalogService.deleteBrand(request.params.id)
      return reply.status(204).send()
    },
  })
}
