import { createDb } from '@ecommerce/db'
import { EventBus } from '@ecommerce/event-bus'
import { diContainer } from '@fastify/awilix'
import { asClass, asFunction, Lifetime } from 'awilix'
import type { Logger } from '@ecommerce/logger'
import type { Config } from './config.ts'
import { WebhookRepository } from './repositories/webhook.repository.ts'
import { WebhookService } from './services/webhook.service.ts'

declare module '@fastify/awilix' {
  interface Cradle {
    sql: ReturnType<typeof createDb>
    eventBus: EventBus
    log: Logger
    webhookRepository: WebhookRepository
    webhookService: WebhookService
  }
}

export function registerDependencies(config: Config, log: Logger): void {
  diContainer.register({
    sql: asFunction(() => createDb({ connectionString: config.databaseUrl }), {
      lifetime: Lifetime.SINGLETON,
      dispose: (sql) => sql.end(),
    }),

    eventBus: asFunction(() => new EventBus(config.rabbitmqUrl), {
      lifetime: Lifetime.SINGLETON,
      dispose: (bus) => bus.close(),
    }),

    log: asFunction(() => log, { lifetime: Lifetime.SINGLETON }),

    webhookRepository: asClass(WebhookRepository, { lifetime: Lifetime.SCOPED }),
    webhookService: asClass(WebhookService, { lifetime: Lifetime.SCOPED }),
  })
}
