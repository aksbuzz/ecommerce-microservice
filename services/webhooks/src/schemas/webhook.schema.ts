import { type Static, Type } from '@sinclair/typebox'

export const WebhookEventTypeEnum = Type.Union([
  Type.Literal('order.submitted'),
  Type.Literal('order.confirmed'),
  Type.Literal('order.paid'),
  Type.Literal('order.shipped'),
  Type.Literal('order.cancelled'),
  Type.Literal('catalog.item.created'),
  Type.Literal('catalog.item.price_changed'),
  Type.Literal('payment.succeeded'),
  Type.Literal('payment.failed'),
])

export type WebhookEventType = Static<typeof WebhookEventTypeEnum>

export const WebhookSubscriptionSchema = Type.Object({
  id: Type.Integer(),
  url: Type.String({ format: 'uri' }),
  token: Type.String(),
  eventType: Type.String(),
  createdAt: Type.String(),
})

export type WebhookSubscription = Static<typeof WebhookSubscriptionSchema>

export const CreateWebhookSchema = Type.Object({
  url: Type.String({ format: 'uri' }),
  token: Type.String({ minLength: 8, maxLength: 255 }),
  eventType: WebhookEventTypeEnum,
})

export type CreateWebhookInput = Static<typeof CreateWebhookSchema>

export const WebhookByIdParamsSchema = Type.Object({
  id: Type.Integer(),
})
