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
  const sessionSecret = process.env.SESSION_SECRET
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters')
  }

  return {
    port: Number(process.env.PORT ?? 3002),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://ecommerce:ecommerce_pass@localhost:5432/ecommerce_identity?sslmode=disable',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://ecommerce:ecommerce_pass@localhost:5672',
    sessionSecret,
    logLevel: process.env.LOG_LEVEL ?? 'info',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  }
}
