import { authGuard } from '@ecommerce/auth'
import { type Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import {
  CatalogItemSchema,
  CatalogItemsQuerySchema,
  CreateCatalogItemSchema,
  ItemByIdParamsSchema,
  UpdateCatalogItemSchema,
} from '../schemas/catalog-item.schema.ts'

export async function itemRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: Static<typeof CatalogItemsQuerySchema> }>('/items', {
    schema: {
      querystring: CatalogItemsQuerySchema,
      response: {
        200: Type.Object({
          items: Type.Array(CatalogItemSchema),
          totalItems: Type.Integer(),
          totalPages: Type.Integer(),
          page: Type.Integer(),
          pageSize: Type.Integer(),
        }),
      },
    },
    handler: async (request) => {
      const { catalogService } = request.diScope.cradle
      return catalogService.getItems(request.query)
    },
  })

  app.get<{ Params: Static<typeof ItemByIdParamsSchema> }>('/items/:id', {
    schema: {
      params: ItemByIdParamsSchema,
      response: { 200: CatalogItemSchema },
    },
    handler: async (request) => {
      const { catalogService } = request.diScope.cradle
      return catalogService.getItemById(request.params.id)
    },
  })

  app.post<{ Body: Static<typeof CreateCatalogItemSchema> }>('/items', {
    preHandler: authGuard,
    schema: {
      body: CreateCatalogItemSchema,
      response: { 201: CatalogItemSchema },
    },
    handler: async (request, reply) => {
      const { catalogService } = request.diScope.cradle
      const item = await catalogService.createItem(request.body)
      return reply.status(201).send(item)
    },
  })

  app.patch<{ Params: Static<typeof ItemByIdParamsSchema>; Body: Static<typeof UpdateCatalogItemSchema> }>('/items/:id', {
    preHandler: authGuard,
    schema: {
      params: ItemByIdParamsSchema,
      body: UpdateCatalogItemSchema,
      response: { 200: CatalogItemSchema },
    },
    handler: async (request) => {
      const { catalogService } = request.diScope.cradle
      return catalogService.updateItem(request.params.id, request.body)
    },
  })

  app.delete<{ Params: Static<typeof ItemByIdParamsSchema> }>('/items/:id', {
    preHandler: authGuard,
    schema: {
      params: ItemByIdParamsSchema,
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { catalogService } = request.diScope.cradle
      await catalogService.deleteItem(request.params.id)
      return reply.status(204).send()
    },
  })
}
