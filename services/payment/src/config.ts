export interface Config {
  rabbitmqUrl: string
  redisUrl: string
  logLevel: string
  nodeEnv: string
}

export function loadConfig(): Config {
  return {
    rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://ecommerce:ecommerce_pass@localhost:5672',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  }
}
