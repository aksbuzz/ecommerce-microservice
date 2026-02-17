import { sessionPlugin } from '@ecommerce/auth'
import { healthCheck, observability } from '@ecommerce/observability'
import { fastifyAwilixPlugin } from '@fastify/awilix'
import helmet from '@fastify/helmet'
import Fastify from 'fastify'
import { loadConfig } from './config.ts'
import { registerDependencies } from './container.ts'
import { errorHandler } from './plugins/error-handler.ts'
import { webhookRoutes } from './routes/webhooks.routes.ts'

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

await app.register(observability, { serviceName: 'webhooks' })
await app.register(healthCheck, {
  serviceName: 'webhooks',
  dependencies: [
    { name: 'postgres', check: async () => { await app.diContainer.cradle.sql`SELECT 1` } },
  ],
})

await app.register(errorHandler)

// API routes
await app.register(webhookRoutes, { prefix: '/api/v1/webhooks' })

// Connect event bus and subscribe to all events for webhook dispatch
try {
  const { eventBus, webhookService } = app.diContainer.cradle
  await eventBus.connectWithRetry()
  app.log.info('Connected to RabbitMQ')

  // Subscribe to all event types that webhooks can listen for
  const eventTypes = [
    'order.submitted', 'order.confirmed', 'order.paid', 'order.shipped', 'order.cancelled',
    'catalog.item.created', 'catalog.item.price_changed', 'catalog.item.deleted',
    'identity.user.registered', 'identity.user.deleted',
    'stock.confirmed', 'stock.rejected',
    'payment.succeeded', 'payment.failed',
  ]

  for (const eventType of eventTypes) {
    await eventBus.subscribe(
      eventType,
      (event) => webhookService.dispatchEvent(event),
      `webhooks.${eventType.replaceAll('.', '_')}`,
    )
  }

  app.log.info({ eventTypes }, 'Subscribed to events for webhook dispatch')
} catch (err) {
  app.log.warn('RabbitMQ not available — running without event bus')
}

await app.listen({ port: config.port, host: config.host })
app.log.info(`Webhooks service listening on ${config.host}:${config.port}`)
