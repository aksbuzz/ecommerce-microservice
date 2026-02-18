import { authGuard } from '@ecommerce/auth'
import { type Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import {
  CreateOrderSchema,
  OrderByIdParamsSchema,
  OrderSchema,
  OrderStatusEnum,
  OrdersQuerySchema,
} from '../schemas/order.schema.ts'

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard)

  app.get<{ Querystring: Static<typeof OrdersQuerySchema> }>('/', {
    schema: {
      querystring: OrdersQuerySchema,
      response: {
        200: Type.Object({
          items: Type.Array(OrderSchema),
          totalItems: Type.Integer(),
          totalPages: Type.Integer(),
          page: Type.Integer(),
          pageSize: Type.Integer(),
        }),
      },
    },
    handler: async (request) => {
      const { orderingService } = request.diScope.cradle
      return orderingService.getOrders(request.session.user!.id, request.query)
    },
  })

  app.get<{ Params: Static<typeof OrderByIdParamsSchema> }>('/:id', {
    schema: {
      params: OrderByIdParamsSchema,
      response: { 200: OrderSchema },
    },
    handler: async (request) => {
      const { orderingService } = request.diScope.cradle
      return orderingService.getOrderById(request.params.id, request.session.user!.id)
    },
  })

  app.post<{ Body: Static<typeof CreateOrderSchema> }>('/', {
    schema: {
      body: CreateOrderSchema,
      response: { 201: OrderSchema },
    },
    handler: async (request, reply) => {
      const { orderingService } = request.diScope.cradle
      const order = await orderingService.createOrder(request.session.user!.id, request.body)
      return reply.status(201).send(order)
    },
  })

  app.patch<{ Params: Static<typeof OrderByIdParamsSchema>; Body: { status: Static<typeof OrderStatusEnum> } }>('/:id/status', {
    schema: {
      params: OrderByIdParamsSchema,
      body: Type.Object({ status: OrderStatusEnum }),
      response: { 200: OrderSchema },
    },
    handler: async (request) => {
      const { orderingService } = request.diScope.cradle
      return orderingService.updateOrderStatus(request.params.id, request.session.user!.id, request.body.status)
    },
  })

  app.post<{ Params: Static<typeof OrderByIdParamsSchema> }>('/:id/cancel', {
    schema: {
      params: OrderByIdParamsSchema,
      response: { 200: OrderSchema },
    },
    handler: async (request) => {
      const { orderingService } = request.diScope.cradle
      return orderingService.cancelOrder(request.params.id, request.session.user!.id)
    },
  })
}
