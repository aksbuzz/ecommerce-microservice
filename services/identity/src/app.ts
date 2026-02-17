import { sessionPlugin } from '@ecommerce/auth'
import { healthCheck, observability } from '@ecommerce/observability'
import { fastifyAwilixPlugin } from '@fastify/awilix'
import helmet from '@fastify/helmet'
import Fastify from 'fastify'
import { loadConfig } from './config.ts'
import { registerDependencies } from './container.ts'
import { errorHandler } from './plugins/error-handler.ts'
import { authRoutes } from './routes/auth.routes.ts'
import { profileRoutes } from './routes/profile.routes.ts'

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

await app.register(observability, { serviceName: 'identity' })
await app.register(healthCheck, {
  serviceName: 'identity',
  dependencies: [
    { name: 'postgres', check: async () => { await app.diContainer.cradle.sql`SELECT 1` } },
  ],
})

await app.register(errorHandler)

// API routes
await app.register(authRoutes, { prefix: '/api/v1/identity' })
await app.register(profileRoutes, { prefix: '/api/v1/identity' })

// Connect event bus and start outbox processor
try {
  const { eventBus, outboxProcessor } = app.diContainer.cradle
  await eventBus.connectWithRetry()
  outboxProcessor.start()
  app.log.info('Connected to RabbitMQ')
} catch (err) {
  app.log.error({ err }, 'Failed to connect to RabbitMQ after retries — event bus unavailable')
}

await app.listen({ port: config.port, host: config.host })
app.log.info(`Identity service listening on ${config.host}:${config.port}`)
