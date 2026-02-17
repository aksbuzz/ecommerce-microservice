import { authGuard } from '@ecommerce/auth'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import {
  CatalogItemSchema,
  CatalogItemsQuerySchema,
  CreateCatalogItemSchema,
  ItemByIdParamsSchema,
  UpdateCatalogItemSchema,
} from '../schemas/catalog-item.schema.ts'

export async function itemRoutes(app: FastifyInstance): Promise<void> {
  app.get('/items', {
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

  app.get('/items/:id', {
    schema: {
      params: ItemByIdParamsSchema,
      response: { 200: CatalogItemSchema },
    },
    handler: async (request) => {
      const { catalogService } = request.diScope.cradle
      return catalogService.getItemById(request.params.id)
    },
  })

  app.post('/items', {
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

  app.patch('/items/:id', {
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

  app.delete('/items/:id', {
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
