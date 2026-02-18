import { authGuard } from '@ecommerce/auth'
import { type Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import {
  AddItemSchema,
  CheckoutSchema,
  CustomerBasketSchema,
  UpdateBasketSchema,
  UpdateQuantitySchema,
} from '../schemas/basket.schema.ts'

export async function basketRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard)

  app.get('/', {
    schema: {
      response: { 200: CustomerBasketSchema },
    },
    handler: async (request) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      return basketService.getBasket(buyerId)
    },
  })

  app.put<{ Body: Static<typeof UpdateBasketSchema> }>('/', {
    schema: {
      body: UpdateBasketSchema,
      response: { 200: CustomerBasketSchema },
    },
    handler: async (request) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      return basketService.updateBasket(buyerId, request.body)
    },
  })

  app.post<{ Body: Static<typeof AddItemSchema> }>('/items', {
    schema: {
      body: AddItemSchema,
      response: { 200: CustomerBasketSchema },
    },
    handler: async (request) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      return basketService.addItem(buyerId, request.body)
    },
  })

  app.patch<{ Params: { productId: number }; Body: Static<typeof UpdateQuantitySchema> }>('/items/:productId', {
    schema: {
      params: Type.Object({ productId: Type.Integer() }),
      body: UpdateQuantitySchema,
      response: { 200: CustomerBasketSchema },
    },
    handler: async (request) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      return basketService.updateItemQuantity(buyerId, request.params.productId, request.body.quantity)
    },
  })

  app.delete<{ Params: { productId: number } }>('/items/:productId', {
    schema: {
      params: Type.Object({ productId: Type.Integer() }),
      response: { 200: CustomerBasketSchema },
    },
    handler: async (request) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      return basketService.removeItem(buyerId, request.params.productId)
    },
  })

  app.delete('/', {
    schema: {
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      await basketService.deleteBasket(buyerId)
      return reply.status(204).send()
    },
  })

  app.post<{ Body: Static<typeof CheckoutSchema> }>('/checkout', {
    schema: {
      body: CheckoutSchema,
      response: {
        202: Type.Object({ message: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      const { basketService } = request.diScope.cradle
      const buyerId = String(request.session.user!.id)
      await basketService.checkout(buyerId, request.body)
      return reply.status(202).send({ message: 'Checkout initiated' })
    },
  })
}
