import { EventBus, idempotentHandlerRedis } from '@ecommerce/event-bus'
import { createLogger } from '@ecommerce/logger'
import { Redis } from 'ioredis'
import { loadConfig } from './config.ts'
import { PaymentService } from './services/payment.service.ts'

const config = loadConfig()
const log = createLogger({ name: 'payment-service', level: config.logLevel })

const eventBus = new EventBus(config.rabbitmqUrl)
const redis = new Redis(config.redisUrl)

async function start() {
  await eventBus.connectWithRetry()
  log.info('Connected to RabbitMQ')

  const paymentService = new PaymentService(eventBus, log)

  // Listen for order.confirmed events with idempotency via Redis
  const handler = idempotentHandlerRedis(
    redis,
    (event) => paymentService.processPayment(event),
  )
  await eventBus.subscribe('order.confirmed', handler, 'payment.order_confirmed')

  log.info('Payment service started — listening for order.confirmed events')

  // Graceful shutdown
  const shutdown = async () => {
    log.info('Shutting down payment service...')
    await eventBus.close()
    await redis.quit()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

start().catch((err) => {
  log.fatal(err, 'Failed to start payment service')
  process.exit(1)
})
