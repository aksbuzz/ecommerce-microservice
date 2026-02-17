export interface Config {
  port: number
  host: string
  databaseUrl: string
  redisUrl: string
  rabbitmqUrl: string
  sessionSecret: string
  logLevel: string
  nodeEnv: string
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 3004),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://ecommerce:ecommerce_pass@localhost:5432/ecommerce_ordering?sslmode=disable',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://ecommerce:ecommerce_pass@localhost:5672',
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production-min-32-chars',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  }
}
