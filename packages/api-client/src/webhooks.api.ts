import { api } from './client.ts'
import type { WebhookEventType, WebhookSubscription } from './types.ts'

export const webhooksApi = {
  list: () => api.get<WebhookSubscription[]>('/webhooks'),
  create: (body: { url: string; token: string; eventType: WebhookEventType }) =>
    api.post<WebhookSubscription>('/webhooks', body),
  delete: (id: number) => api.delete<void>(`/webhooks/${id}`),
}
