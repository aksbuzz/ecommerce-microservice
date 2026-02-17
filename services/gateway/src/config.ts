export interface Config {
  port: number
  host: string
  logLevel: string
  nodeEnv: string
  services: {
    catalog: string
    identity: string
    basket: string
    ordering: string
    webhooks: string
  }
  rateLimit: {
    max: number
    timeWindow: string
  }
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    services: {
      catalog: process.env.CATALOG_URL ?? 'http://localhost:3001',
      identity: process.env.IDENTITY_URL ?? 'http://localhost:3002',
      basket: process.env.BASKET_URL ?? 'http://localhost:3003',
      ordering: process.env.ORDERING_URL ?? 'http://localhost:3004',
      webhooks: process.env.WEBHOOKS_URL ?? 'http://localhost:3005',
    },
    rateLimit: {
      max: Number(process.env.RATE_LIMIT_MAX ?? 100),
      timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
    },
  }
}
