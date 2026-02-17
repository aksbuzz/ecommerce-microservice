import type { Sql } from '@ecommerce/db'
import type { CreateWebhookInput, WebhookSubscription } from '../schemas/webhook.schema.ts'

interface Deps {
  sql: Sql
}

export class WebhookRepository {
  sql: Sql

  constructor({ sql }: Deps) {
    this.sql = sql
  }

  async findAll(): Promise<WebhookSubscription[]> {
    return this.sql<WebhookSubscription[]>`
      SELECT id, url, token, event_type as "eventType", created_at as "createdAt"
      FROM webhook_subscriptions ORDER BY created_at DESC
    `
  }

  async findById(id: number): Promise<WebhookSubscription | undefined> {
    const [row] = await this.sql<WebhookSubscription[]>`
      SELECT id, url, token, event_type as "eventType", created_at as "createdAt"
      FROM webhook_subscriptions WHERE id = ${id}
    `
    return row
  }

  async findByEventType(eventType: string): Promise<WebhookSubscription[]> {
    return this.sql<WebhookSubscription[]>`
      SELECT id, url, token, event_type as "eventType", created_at as "createdAt"
      FROM webhook_subscriptions WHERE event_type = ${eventType}
    `
  }

  async create(data: CreateWebhookInput): Promise<WebhookSubscription> {
    const [row] = await this.sql<WebhookSubscription[]>`
      INSERT INTO webhook_subscriptions (url, token, event_type)
      VALUES (${data.url}, ${data.token}, ${data.eventType})
      RETURNING id, url, token, event_type as "eventType", created_at as "createdAt"
    `
    return row
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.sql`DELETE FROM webhook_subscriptions WHERE id = ${id}`
    return result.count > 0
  }
}
