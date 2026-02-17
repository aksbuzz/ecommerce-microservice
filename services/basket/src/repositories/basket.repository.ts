import type { Redis } from 'ioredis'
import type { CustomerBasket } from '../schemas/basket.schema.ts'

interface Deps {
  redis: Redis
}

const KEY_PREFIX = 'basket:'
const TTL = 30 * 24 * 60 * 60 // 30 days in seconds

export class BasketRepository {
  redis: Redis

  constructor({ redis }: Deps) {
    this.redis = redis
  }

  async findByBuyerId(buyerId: string): Promise<CustomerBasket | null> {
    const data = await this.redis.get(`${KEY_PREFIX}${buyerId}`)
    if (!data) return null
    return JSON.parse(data) as CustomerBasket
  }

  async save(basket: CustomerBasket): Promise<CustomerBasket> {
    await this.redis.set(
      `${KEY_PREFIX}${basket.buyerId}`,
      JSON.stringify(basket),
      'EX',
      TTL,
    )
    return basket
  }

  async delete(buyerId: string): Promise<boolean> {
    const result = await this.redis.del(`${KEY_PREFIX}${buyerId}`)
    return result > 0
  }
}
