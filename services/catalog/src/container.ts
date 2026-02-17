import { createDb } from '@ecommerce/db'
import { EventBus } from '@ecommerce/event-bus'
import { OutboxProcessor, OutboxStore } from '@ecommerce/outbox'
import { diContainer } from '@fastify/awilix'
import { asClass, asFunction, Lifetime } from 'awilix'
import type { FastifyBaseLogger } from 'fastify'
import type { Config } from './config.ts'
import { CatalogBrandRepository } from './repositories/catalog-brand.repository.ts'
import { CatalogItemRepository } from './repositories/catalog-item.repository.ts'
import { CatalogTypeRepository } from './repositories/catalog-type.repository.ts'
import { CatalogService } from './services/catalog.service.ts'

declare module '@fastify/awilix' {
  interface Cradle {
    sql: ReturnType<typeof createDb>
    eventBus: EventBus
    catalogItemRepository: CatalogItemRepository
    catalogBrandRepository: CatalogBrandRepository
    catalogTypeRepository: CatalogTypeRepository
    catalogService: CatalogService
    outboxStore: OutboxStore
    outboxProcessor: OutboxProcessor
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

    catalogItemRepository: asClass(CatalogItemRepository, { lifetime: Lifetime.SCOPED }),
    catalogBrandRepository: asClass(CatalogBrandRepository, { lifetime: Lifetime.SCOPED }),
    catalogTypeRepository: asClass(CatalogTypeRepository, { lifetime: Lifetime.SCOPED }),
    catalogService: asClass(CatalogService, { lifetime: Lifetime.SCOPED }),
  })
}
