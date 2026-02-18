import type { IntegrationEvent } from '@ecommerce/event-bus'
import { CircuitBreaker, CircuitOpenError, NotFoundError } from '@ecommerce/shared'
import type { Logger } from '@ecommerce/logger'
import type { WebhookRepository } from '../repositories/webhook.repository.ts'
import type { CreateWebhookInput } from '../schemas/webhook.schema.ts'

interface Deps {
  webhookRepository: WebhookRepository
  log: Logger
}

export class WebhookService {
  webhookRepository: WebhookRepository
  log: Logger
  circuits: Map<string, CircuitBreaker> = new Map()

  constructor({ webhookRepository, log }: Deps) {
    this.webhookRepository = webhookRepository
    this.log = log
  }

  getCircuit(url: string): CircuitBreaker {
    let circuit = this.circuits.get(url)
    if (!circuit) {
      circuit = new CircuitBreaker({ name: url })
      this.circuits.set(url, circuit)
    }
    return circuit
  }

  async getSubscriptions() {
    return this.webhookRepository.findAll()
  }

  async createSubscription(data: CreateWebhookInput) {
    return this.webhookRepository.create(data)
  }

  async deleteSubscription(id: number) {
    const deleted = await this.webhookRepository.delete(id)
    if (!deleted) throw new NotFoundError('WebhookSubscription', id)
  }

  async dispatchEvent(event: IntegrationEvent): Promise<void> {
    const subscriptions = await this.webhookRepository.findByEventType(event.type)

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const circuit = this.getCircuit(sub.url)
        try {
          await circuit.execute(async () => {
            const response = await fetch(sub.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Token': sub.token,
                'X-Event-Type': event.type,
                'X-Event-Id': event.id,
              },
              body: JSON.stringify(event),
              signal: AbortSignal.timeout(10_000),
            })

            if (!response.ok) {
              throw new Error(`Webhook delivery failed with status ${response.status}`)
            }

            return response
          })

          this.log.info({ subscriptionId: sub.id }, 'Webhook delivered')
        } catch (err) {
          if (err instanceof CircuitOpenError) {
            this.log.warn({ subscriptionId: sub.id, url: sub.url }, 'Webhook skipped — circuit breaker is open')
          } else {
            this.log.error({ subscriptionId: sub.id, err }, 'Webhook delivery error')
          }
        }
      }),
    )

    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) {
      this.log.warn({ eventType: event.type, total: subscriptions.length, failed }, 'Some webhook deliveries failed')
    }
  }
}
