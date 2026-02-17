import { Counter, collectDefaultMetrics, Gauge, Histogram, Registry } from 'prom-client'

export interface MetricsOptions {
  serviceName: string
  prefix?: string
}

export interface Metrics {
  registry: Registry
  httpRequestDuration: Histogram
  httpRequestsTotal: Counter
  httpErrorsTotal: Counter
  activeConnections: Gauge
}

export function createMetrics(options: MetricsOptions): Metrics {
  const registry = new Registry()
  const prefix = options.prefix ?? options.serviceName.replace(/-/g, '_')

  registry.setDefaultLabels({ service: options.serviceName })
  collectDefaultMetrics({ register: registry })

  const httpRequestDuration = new Histogram({
    name: `${prefix}_http_request_duration_seconds`,
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  })

  const httpRequestsTotal = new Counter({
    name: `${prefix}_http_requests_total`,
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [registry],
  })

  const httpErrorsTotal = new Counter({
    name: `${prefix}_http_errors_total`,
    help: 'Total number of HTTP errors (4xx and 5xx)',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [registry],
  })

  const activeConnections = new Gauge({
    name: `${prefix}_active_connections`,
    help: 'Number of active connections',
    registers: [registry],
  })

  return { registry, httpRequestDuration, httpRequestsTotal, httpErrorsTotal, activeConnections }
}
