import { authGuard } from '@ecommerce/auth'
import { type Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { ItemByIdParamsSchema } from '../schemas/catalog-item.schema.ts'
import { CatalogTypeSchema, CreateCatalogTypeSchema } from '../schemas/catalog-type.schema.ts'

export async function typeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/types', {
    schema: {
      response: { 200: Type.Array(CatalogTypeSchema) },
    },
    handler: async (request) => {
      const { catalogService } = request.diScope.cradle
      return catalogService.getTypes()
    },
  })

  app.post<{ Body: Static<typeof CreateCatalogTypeSchema> }>('/types', {
    preHandler: authGuard,
    schema: {
      body: CreateCatalogTypeSchema,
      response: { 201: CatalogTypeSchema },
    },
    handler: async (request, reply) => {
      const { catalogService } = request.diScope.cradle
      const type = await catalogService.createType(request.body)
      return reply.status(201).send(type)
    },
  })

  app.delete<{ Params: Static<typeof ItemByIdParamsSchema> }>('/types/:id', {
    preHandler: authGuard,
    schema: {
      params: ItemByIdParamsSchema,
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { catalogService } = request.diScope.cradle
      await catalogService.deleteType(request.params.id)
      return reply.status(204).send()
    },
  })
}
