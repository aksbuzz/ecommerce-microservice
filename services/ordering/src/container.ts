import { createDb } from '@ecommerce/db'
import { EventBus } from '@ecommerce/event-bus'
import { OutboxProcessor, OutboxStore } from '@ecommerce/outbox'
import { diContainer } from '@fastify/awilix'
import { asClass, asFunction, Lifetime } from 'awilix'
import type { FastifyBaseLogger } from 'fastify'
import type { Config } from './config.ts'
import { OrderRepository } from './repositories/order.repository.ts'
import { OrderSummaryRepository } from './repositories/order-summary.repository.ts'
import { OrderingService } from './services/ordering.service.ts'

declare module '@fastify/awilix' {
  interface Cradle {
    sql: ReturnType<typeof createDb>
    eventBus: EventBus
    outboxStore: OutboxStore
    outboxProcessor: OutboxProcessor
    orderRepository: OrderRepository
    orderSummaryRepository: OrderSummaryRepository
    orderingService: OrderingService
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

    orderRepository: asClass(OrderRepository, { lifetime: Lifetime.SCOPED }),
    orderSummaryRepository: asClass(OrderSummaryRepository, { lifetime: Lifetime.SCOPED }),
    orderingService: asClass(OrderingService, { lifetime: Lifetime.SCOPED }),
  })
}
