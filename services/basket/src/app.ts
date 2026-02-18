import { sessionPlugin } from '@ecommerce/auth'
import type { Logger } from '@ecommerce/logger'
import { idempotentHandlerRedis } from '@ecommerce/event-bus'
import { errorHandler } from '@ecommerce/shared'
import { healthCheck, observability } from '@ecommerce/observability'
import { fastifyAwilixPlugin } from '@fastify/awilix'
import helmet from '@fastify/helmet'
import Fastify from 'fastify'
import { loadConfig } from './config.ts'
import { registerDependencies } from './container.ts'
import { createUserDeletedHandler } from './event-handlers/user-deleted.handler.ts'
import { basketRoutes } from './routes/basket.routes.ts'

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

registerDependencies(config)

await app.register(sessionPlugin, {
  redisUrl: config.redisUrl,
  secret: config.sessionSecret,
})

await app.register(observability, { serviceName: 'basket' })
await app.register(healthCheck, {
  serviceName: 'basket',
  dependencies: [
    { name: 'redis', check: async () => { await app.diContainer.cradle.redis.ping() } },
  ],
})

await app.register(errorHandler)

await app.register(basketRoutes, { prefix: '/api/v1/basket' })

try {
  const { eventBus, redis, basketRepository } = app.diContainer.cradle
  await eventBus.connectWithRetry()
  app.log.info('Connected to RabbitMQ')

  // Clean up basket when a user account is deleted
  const userDeletedHandler = idempotentHandlerRedis(
    redis,
    createUserDeletedHandler({ basketRepository, log: app.log as unknown as Logger }),
  )
  await eventBus.subscribe('identity.user.deleted', userDeletedHandler, 'basket.identity_user_deleted')

  app.log.info('Subscribed to identity.user.deleted for basket cleanup')
} catch (err) {
  app.log.error({ err }, 'Failed to connect to RabbitMQ after retries — event bus unavailable')
}

await app.listen({ port: config.port, host: config.host })
app.log.info(`Basket service listening on ${config.host}:${config.port}`)
