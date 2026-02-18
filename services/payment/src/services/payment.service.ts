import type { EventBus, IntegrationEvent } from '@ecommerce/event-bus'
import type { Logger } from '@ecommerce/logger'

interface PaymentRequest {
  orderId: number
  buyerId: number
  total: number
}

export class PaymentService {
  eventBus: EventBus
  log: Logger

  constructor(eventBus: EventBus, log: Logger) {
    this.eventBus = eventBus
    this.log = log
  }

  async processPayment(event: IntegrationEvent): Promise<void> {
    const payment = event.payload as unknown as PaymentRequest
    this.log.info({ orderId: payment.orderId, total: payment.total }, 'Processing payment')

    // Simulate payment processing
    const success = await this.simulatePaymentGateway(payment)

    if (success) {
      this.log.info({ orderId: payment.orderId }, 'Payment succeeded')
      await this.eventBus.publish({
        id: crypto.randomUUID(),
        type: 'payment.succeeded',
        timestamp: new Date().toISOString(),
        payload: { orderId: payment.orderId, buyerId: payment.buyerId },
      })
    } else {
      this.log.warn({ orderId: payment.orderId }, 'Payment failed')
      await this.eventBus.publish({
        id: crypto.randomUUID(),
        type: 'payment.failed',
        timestamp: new Date().toISOString(),
        payload: { orderId: payment.orderId, buyerId: payment.buyerId, reason: 'Payment declined' },
      })
    }
  }

  async simulatePaymentGateway(_payment: PaymentRequest): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return Math.random() > 0.05
  }
}
