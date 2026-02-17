import { EventBus } from '@ecommerce/event-bus'
import { diContainer } from '@fastify/awilix'
import { asClass, asFunction, Lifetime } from 'awilix'
import { Redis } from 'ioredis'
import type { Config } from './config.ts'
import { BasketRepository } from './repositories/basket.repository.ts'
import { BasketService } from './services/basket.service.ts'

declare module '@fastify/awilix' {
  interface Cradle {
    redis: Redis
    eventBus: EventBus
    basketRepository: BasketRepository
    basketService: BasketService
  }
}

export function registerDependencies(config: Config): void {
  diContainer.register({
    redis: asFunction(() => new Redis(config.redisUrl), {
      lifetime: Lifetime.SINGLETON,
      dispose: (redis) => redis.disconnect(),
    }),

    eventBus: asFunction(() => new EventBus(config.rabbitmqUrl), {
      lifetime: Lifetime.SINGLETON,
      dispose: (bus) => bus.close(),
    }),

    basketRepository: asClass(BasketRepository, { lifetime: Lifetime.SCOPED }),
    basketService: asClass(BasketService, { lifetime: Lifetime.SCOPED }),
  })
}
