import { authGuard } from '@ecommerce/auth'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import {
  AddItemSchema,
  CheckoutSchema,
  CustomerBasketSchema,
  UpdateBasketSchema,
  UpdateQuantitySchema,
} from '../schemas/basket.schema.ts'

export async function basketRoutes(app: FastifyInstance): Promise<void> {
  // All basket routes require authentication
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

  app.put('/', {
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

  app.post('/items', {
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

  app.patch('/items/:productId', {
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

  app.delete('/items/:productId', {
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

  app.post('/checkout', {
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
