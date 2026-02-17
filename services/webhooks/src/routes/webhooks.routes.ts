import { authGuard } from '@ecommerce/auth'
import { Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { CreateWebhookSchema, WebhookByIdParamsSchema, WebhookSubscriptionSchema } from '../schemas/webhook.schema.ts'

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard)

  app.get('/', {
    schema: {
      response: { 200: Type.Array(WebhookSubscriptionSchema) },
    },
    handler: async (request) => {
      const { webhookService } = request.diScope.cradle
      return webhookService.getSubscriptions()
    },
  })

  app.post('/', {
    schema: {
      body: CreateWebhookSchema,
      response: { 201: WebhookSubscriptionSchema },
    },
    handler: async (request, reply) => {
      const { webhookService } = request.diScope.cradle
      const sub = await webhookService.createSubscription(request.body)
      return reply.status(201).send(sub)
    },
  })

  app.delete('/:id', {
    schema: {
      params: WebhookByIdParamsSchema,
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { webhookService } = request.diScope.cradle
      await webhookService.deleteSubscription(request.params.id)
      return reply.status(204).send()
    },
  })
}
