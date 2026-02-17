import { authGuard } from '@ecommerce/auth'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'

export async function orderSummaryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard)

  // CQRS read endpoint — queries the denormalized order_summaries table
  app.get('/summaries', {
    schema: {
      querystring: Type.Object({
        page: Type.Integer({ minimum: 1, default: 1 }),
        pageSize: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
      }),
    },
    handler: async (request) => {
      const { orderSummaryRepository } = request.diScope.cradle
      const { page, pageSize } = request.query as { page: number; pageSize: number }
      return orderSummaryRepository.findByBuyerId(request.session.user!.id, page, pageSize)
    },
  })
}
