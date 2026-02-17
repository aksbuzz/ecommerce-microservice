import { createDb } from '@ecommerce/db'
import { EventBus } from '@ecommerce/event-bus'
import { OutboxProcessor, OutboxStore } from '@ecommerce/outbox'
import { diContainer } from '@fastify/awilix'
import { asClass, asFunction, Lifetime } from 'awilix'
import type { FastifyBaseLogger } from 'fastify'
import type { Config } from './config.ts'
import { UserRepository } from './repositories/user.repository.ts'
import { IdentityService } from './services/identity.service.ts'
import { PasswordService } from './services/password.service.ts'

declare module '@fastify/awilix' {
  interface Cradle {
    sql: ReturnType<typeof createDb>
    eventBus: EventBus
    outboxStore: OutboxStore
    outboxProcessor: OutboxProcessor
    userRepository: UserRepository
    passwordService: PasswordService
    identityService: IdentityService
  }
}

export function registerDependencies(config: Config, log: FastifyBaseLogger): void {
  diContainer.register({
    sql: asFunction(() => createDb({ connectionString: config.databaseUrl }), {
      lifetime: Lifetime.SINGLETON,
      dispose: (sql) => sql.end(),
    }),

    eventBus: asFunction(() => new EventBus(config.rabbitmqUrl), {
      lifetime: Lifetime.SINGLETON,
      dispose: (bus) => bus.close(),
    }),

    outboxStore: asFunction(({ sql }) => new OutboxStore(sql), {
      lifetime: Lifetime.SINGLETON,
    }),

    outboxProcessor: asFunction(
      ({ outboxStore, eventBus }) => new OutboxProcessor(outboxStore, eventBus, log),
      {
        lifetime: Lifetime.SINGLETON,
        dispose: (processor) => processor.stop(),
      },
    ),

    userRepository: asClass(UserRepository, { lifetime: Lifetime.SCOPED }),
    passwordService: asClass(PasswordService, { lifetime: Lifetime.SINGLETON }),
    identityService: asClass(IdentityService, { lifetime: Lifetime.SCOPED }),
  })
}
