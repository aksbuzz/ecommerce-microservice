import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import type { Metrics } from './metrics.ts'
import { createMetrics } from './metrics.ts'

export interface ObservabilityPluginOptions {
  serviceName: string
  metricsPath?: string
}

async function observabilityPlugin(app: FastifyInstance, opts: ObservabilityPluginOptions) {
  const metrics = createMetrics({ serviceName: opts.serviceName })
  const metricsPath = opts.metricsPath ?? '/metrics'

  // Expose metrics endpoint
  app.get(metricsPath, async (_request: FastifyRequest, reply: FastifyReply) => {
    const content = await metrics.registry.metrics()
    return reply.header('Content-Type', metrics.registry.contentType).send(content)
  })

  // Request-ID + tracing context hooks
  app.addHook('onRequest', async (request: FastifyRequest) => {
    const requestId = (request.headers['x-request-id'] as string) ?? crypto.randomUUID()
    request.requestId = requestId

    // Add trace context to request for log correlation
    const span = trace.getActiveSpan()
    if (span) {
      const spanContext = span.spanContext()
      request.traceId = spanContext.traceId
      request.spanId = spanContext.spanId
    }

    metrics.activeConnections.inc()
  })

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const route = request.routeOptions?.url ?? request.url
    const labels = {
      method: request.method,
      route,
      status_code: String(reply.statusCode),
    }

    const duration = reply.elapsedTime / 1000
    metrics.httpRequestDuration.observe(labels, duration)
    metrics.httpRequestsTotal.inc(labels)

    if (reply.statusCode >= 400) {
      metrics.httpErrorsTotal.inc(labels)
    }

    metrics.activeConnections.dec()
  })

  // Add trace/request context to Pino log serializer
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.log = request.log.child({
      requestId: request.requestId,
      ...(request.traceId && { traceId: request.traceId }),
      ...(request.spanId && { spanId: request.spanId }),
    })
  })
}

export const observability = fp(observabilityPlugin, {
  name: '@ecommerce/observability',
  fastify: '5.x',
})

// Augment Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string
    traceId?: string
    spanId?: string
  }
}
