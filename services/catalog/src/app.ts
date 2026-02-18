import { sessionPlugin } from '@ecommerce/auth'
import { idempotentHandler } from '@ecommerce/event-bus'
import { healthCheck, observability } from '@ecommerce/observability'
import type { Logger } from '@ecommerce/logger'
import { errorHandler } from '@ecommerce/shared'
import { fastifyAwilixPlugin } from '@fastify/awilix'
import helmet from '@fastify/helmet'
import Fastify from 'fastify'
import { loadConfig } from './config.ts'
import { registerDependencies } from './container.ts'
import { createStockDecrementHandler } from './event-handlers/stock-decrement.handler.ts'
import { createStockValidationHandler } from './event-handlers/stock-validation.handler.ts'
import { brandRoutes } from './routes/brands.routes.ts'
import { itemRoutes } from './routes/items.routes.ts'
import { typeRoutes } from './routes/types.routes.ts'

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

await app.register(observability, { serviceName: 'catalog' })
await app.register(healthCheck, {
  serviceName: 'catalog',
  dependencies: [
    { name: 'postgres', check: async () => { await app.diContainer.cradle.sql`SELECT 1` } },
  ],
})

await app.register(errorHandler)

await app.register(itemRoutes, { prefix: '/api/v1/catalog' })
await app.register(brandRoutes, { prefix: '/api/v1/catalog' })
await app.register(typeRoutes, { prefix: '/api/v1/catalog' })

try {
  const { eventBus, outboxProcessor, outboxStore, sql } = app.diContainer.cradle
  await eventBus.connectWithRetry()
  outboxProcessor.start()
  app.log.info('Connected to RabbitMQ')

  const handlerDeps = { outboxStore, sql, log: app.log as unknown as Logger }

  // Stock validation: check availability when order is awaiting validation
  const stockValidationHandler = idempotentHandler(
    sql,
    createStockValidationHandler(handlerDeps),
  )
  await eventBus.subscribe('order.awaiting_validation', stockValidationHandler, 'catalog.order_awaiting_validation')

  // Stock decrement: reduce stock after payment succeeds
  const stockDecrementHandler = idempotentHandler(
    sql,
    createStockDecrementHandler({ sql, log: handlerDeps.log }),
  )
  await eventBus.subscribe('order.paid', stockDecrementHandler, 'catalog.order_paid')

  app.log.info('Subscribed to stock validation and decrement events')
} catch (err) {
  app.log.error({ err }, 'Failed to connect to RabbitMQ after retries — event bus unavailable')
}

await app.listen({ port: config.port, host: config.host })
app.log.info(`Catalog service listening on ${config.host}:${config.port}`)
