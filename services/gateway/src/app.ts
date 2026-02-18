import { healthCheck, observability } from '@ecommerce/observability'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import httpProxy from '@fastify/http-proxy'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { loadConfig } from './config.ts'

const config = loadConfig()

const app = Fastify({
  logger: {
    level: config.logLevel,
    ...(config.nodeEnv !== 'production' && {
      transport: { target: 'pino-pretty', options: { colorize: true } },
    }),
  },
  trustProxy: true,
})

await app.register(helmet, { contentSecurityPolicy: false })

await app.register(cors, {
  origin: true,
  credentials: true,
})

await app.register(rateLimit, {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
})

await app.register(observability, { serviceName: 'gateway' })

await app.register(healthCheck, {
  serviceName: 'gateway',
  dependencies: [
    {
      name: 'catalog',
      check: async () => {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 2000)
        try {
          const res = await fetch(`${config.services.catalog}/health/live`, { signal: ac.signal })
          if (!res.ok) throw new Error(`catalog health returned ${res.status}`)
        } finally {
          clearTimeout(timer)
        }
      },
    },
    {
      name: 'identity',
      check: async () => {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 2000)
        try {
          const res = await fetch(`${config.services.identity}/health/live`, { signal: ac.signal })
          if (!res.ok) throw new Error(`identity health returned ${res.status}`)
        } finally {
          clearTimeout(timer)
        }
      },
    },
    {
      name: 'basket',
      check: async () => {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 2000)
        try {
          const res = await fetch(`${config.services.basket}/health/live`, { signal: ac.signal })
          if (!res.ok) throw new Error(`basket health returned ${res.status}`)
        } finally {
          clearTimeout(timer)
        }
      },
    },
    {
      name: 'ordering',
      check: async () => {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 2000)
        try {
          const res = await fetch(`${config.services.ordering}/health/live`, { signal: ac.signal })
          if (!res.ok) throw new Error(`ordering health returned ${res.status}`)
        } finally {
          clearTimeout(timer)
        }
      },
    },
    {
      name: 'webhooks',
      check: async () => {
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 2000)
        try {
          const res = await fetch(`${config.services.webhooks}/health/live`, { signal: ac.signal })
          if (!res.ok) throw new Error(`webhooks health returned ${res.status}`)
        } finally {
          clearTimeout(timer)
        }
      },
    },
  ],
})

app.addHook('onRequest', async (request, reply) => {
  const existing = request.headers['x-request-id'] as string | undefined
  const requestId = existing ?? crypto.randomUUID()
  request.headers['x-request-id'] = requestId
  reply.header('x-request-id', requestId)
})

function buildUpstreamHeaders(request: { headers: Record<string, string | string[] | undefined> }) {
  return {
    'x-request-id': request.headers['x-request-id'] as string,
    ...(request.headers['x-forwarded-for'] && {
      'x-forwarded-for': request.headers['x-forwarded-for'] as string,
    }),
    ...(request.headers['x-forwarded-host'] && {
      'x-forwarded-host': request.headers['x-forwarded-host'] as string,
    }),
  }
}

// Proxy: /api/v1/catalog → catalog service
await app.register(httpProxy, {
  upstream: config.services.catalog,
  prefix: '/api/v1/catalog',
  rewritePrefix: '/api/v1/catalog',
  httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  replyOptions: {
    rewriteRequestHeaders: (_req, headers) => ({
      ...headers,
      ...buildUpstreamHeaders({ headers: _req.headers as Record<string, string | string[] | undefined> }),
    }),
  },
})

// Proxy: /api/v1/identity → identity service
await app.register(httpProxy, {
  upstream: config.services.identity,
  prefix: '/api/v1/identity',
  rewritePrefix: '/api/v1/identity',
  httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  replyOptions: {
    rewriteRequestHeaders: (_req, headers) => ({
      ...headers,
      ...buildUpstreamHeaders({ headers: _req.headers as Record<string, string | string[] | undefined> }),
    }),
  },
})

// Proxy: /api/v1/basket → basket service
await app.register(httpProxy, {
  upstream: config.services.basket,
  prefix: '/api/v1/basket',
  rewritePrefix: '/api/v1/basket',
  httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  replyOptions: {
    rewriteRequestHeaders: (_req, headers) => ({
      ...headers,
      ...buildUpstreamHeaders({ headers: _req.headers as Record<string, string | string[] | undefined> }),
    }),
  },
})

// Proxy: /api/v1/orders → ordering service
await app.register(httpProxy, {
  upstream: config.services.ordering,
  prefix: '/api/v1/orders',
  rewritePrefix: '/api/v1/orders',
  httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  replyOptions: {
    rewriteRequestHeaders: (_req, headers) => ({
      ...headers,
      ...buildUpstreamHeaders({ headers: _req.headers as Record<string, string | string[] | undefined> }),
    }),
  },
})

// Proxy: /api/v1/webhooks → webhooks service
await app.register(httpProxy, {
  upstream: config.services.webhooks,
  prefix: '/api/v1/webhooks',
  rewritePrefix: '/api/v1/webhooks',
  httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  replyOptions: {
    rewriteRequestHeaders: (_req, headers) => ({
      ...headers,
      ...buildUpstreamHeaders({ headers: _req.headers as Record<string, string | string[] | undefined> }),
    }),
  },
})

await app.listen({ port: config.port, host: config.host })
app.log.info(`Gateway service listening on ${config.host}:${config.port}`)
