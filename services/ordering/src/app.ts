import { sessionPlugin } from '@ecommerce/auth'
import { dlqAdmin, idempotentHandler } from '@ecommerce/event-bus'
import type { Logger } from '@ecommerce/logger'
import { healthCheck, observability } from '@ecommerce/observability'
import { errorHandler } from '@ecommerce/shared'
import { fastifyAwilixPlugin } from '@fastify/awilix'
import helmet from '@fastify/helmet'
import Fastify from 'fastify'
import { loadConfig } from './config.ts'
import { registerDependencies } from './container.ts'
import { createBasketCheckoutHandler } from './event-handlers/basket-checkout.handler.ts'
import { createOrderSubmittedHandler } from './event-handlers/order-submitted.handler.ts'
import { createOrderSummaryProjector } from './event-handlers/order-summary-projector.ts'
import { createPaymentFailedHandler, createPaymentSucceededHandler } from './event-handlers/payment-result.handler.ts'
import { createStockConfirmedHandler, createStockRejectedHandler } from './event-handlers/stock-result.handler.ts'
import { orderSummaryRoutes } from './routes/order-summaries.routes.ts'
import { orderRoutes } from './routes/orders.routes.ts'

const config = loadConfig()

const app = Fastify({
  logger: {
    level: config.logLevel,
    ...(config.nodeEnv !== 'production' && {
      transport: { target: 'pino-pretty', options: { colorize: true } },
    }),
  },
})

await app.register(helmet, { contentSecurityPolicy: false })

await app.register(fastifyAwilixPlugin, {
  disposeOnClose: true,
  disposeOnResponse: true,
  strictBooleanEnforced: true,
})

registerDependencies(config, app.log)

await app.register(sessionPlugin, {
  redisUrl: config.redisUrl,
  secret: config.sessionSecret,
})

await app.register(observability, { serviceName: 'ordering' })
await app.register(healthCheck, {
  serviceName: 'ordering',
  dependencies: [
    { name: 'postgres', check: async () => { await app.diContainer.cradle.sql`SELECT 1` } },
  ],
})

await app.register(errorHandler)

await app.register(orderRoutes, { prefix: '/api/v1/orders' })
await app.register(orderSummaryRoutes, { prefix: '/api/v1/orders' })

try {
  const { eventBus, outboxProcessor, orderingService, orderRepository, outboxStore, orderSummaryRepository, sql } = app.diContainer.cradle
  await eventBus.connectWithRetry()
  outboxProcessor.start()
  app.log.info('Connected to RabbitMQ')

  const sagaDeps = { orderRepository, outboxStore, sql, log: app.log as unknown as Logger };

  // --- Saga event subscriptions (all wrapped with idempotent consumers) ---

  // 1. basket.checkout → create order (publishes order.submitted via outbox)
  const checkoutHandler = idempotentHandler(
    sql,
    createBasketCheckoutHandler({ orderingService, log: sagaDeps.log }),
  )
  await eventBus.subscribe('basket.checkout', checkoutHandler, 'ordering.basket_checkout')

  // 2. order.submitted → awaiting_validation (publishes order.awaiting_validation for Catalog)
  const orderSubmittedHandler = idempotentHandler(
    sql,
    createOrderSubmittedHandler(sagaDeps),
  )
  await eventBus.subscribe('order.submitted', orderSubmittedHandler, 'ordering.order_submitted')

  // 3. stock.confirmed → confirm order (publishes order.confirmed via outbox)
  const stockConfirmedHandler = idempotentHandler(
    sql,
    createStockConfirmedHandler(sagaDeps),
  )
  await eventBus.subscribe('stock.confirmed', stockConfirmedHandler, 'ordering.stock_confirmed')

  // 4. stock.rejected → COMPENSATE: cancel order
  const stockRejectedHandler = idempotentHandler(
    sql,
    createStockRejectedHandler(sagaDeps),
  )
  await eventBus.subscribe('stock.rejected', stockRejectedHandler, 'ordering.stock_rejected')

  // 5. payment.succeeded → mark order as paid
  const paymentSucceededHandler = idempotentHandler(
    sql,
    createPaymentSucceededHandler(sagaDeps),
  )
  await eventBus.subscribe('payment.succeeded', paymentSucceededHandler, 'ordering.payment_succeeded')

  // 6. payment.failed → COMPENSATE: cancel order
  const paymentFailedHandler = idempotentHandler(
    sql,
    createPaymentFailedHandler(sagaDeps),
  )
  await eventBus.subscribe('payment.failed', paymentFailedHandler, 'ordering.payment_failed')

  // --- CQRS projector (updates read model) ---
  const projector = idempotentHandler(
    sql,
    createOrderSummaryProjector({ orderSummaryRepository, orderRepository, log: sagaDeps.log }),
  )
  for (const eventType of ['order.submitted', 'order.confirmed', 'order.paid', 'order.shipped', 'order.cancelled']) {
    await eventBus.subscribe(eventType, projector, `ordering.summary_${eventType.replaceAll('.', '_')}`)
  }

  // --- DLQ admin endpoints ---
  await app.register(dlqAdmin, {
    eventBus,
    queues: [
      'ordering.basket_checkout', 'ordering.order_submitted',
      'ordering.stock_confirmed', 'ordering.stock_rejected',
      'ordering.payment_succeeded', 'ordering.payment_failed',
    ],
  })

  app.log.info('Subscribed to saga events and CQRS projections')
} catch (err) {
  app.log.error({ err }, 'Failed to connect to RabbitMQ after retries — event bus unavailable')
}

await app.listen({ port: config.port, host: config.host })
app.log.info(`Ordering service listening on ${config.host}:${config.port}`)
