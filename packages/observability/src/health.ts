import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

interface DependencyCheck {
  name: string
  check: () => Promise<void>
}

export interface HealthCheckOptions {
  serviceName: string
  dependencies?: DependencyCheck[]
}

interface HealthStatus {
  status: 'healthy' | 'degraded'
  service: string
  uptime: number
  timestamp: string
  dependencies: Record<string, { status: 'up' | 'down'; latencyMs?: number; error?: string }>
}

async function healthCheckPlugin(app: FastifyInstance, opts: HealthCheckOptions) {
  const startTime = Date.now()

  app.get('/health', async () => {
    const result: HealthStatus = {
      status: 'healthy',
      service: opts.serviceName,
      uptime: (Date.now() - startTime) / 1000,
      timestamp: new Date().toISOString(),
      dependencies: {},
    }

    const checks = opts.dependencies ?? []
    for (const dep of checks) {
      const start = Date.now()
      try {
        await dep.check()
        result.dependencies[dep.name] = {
          status: 'up',
          latencyMs: Date.now() - start,
        }
      } catch (err) {
        result.status = 'degraded'
        result.dependencies[dep.name] = {
          status: 'down',
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }

    return result
  })

  app.get('/health/live', async () => ({ status: 'ok' }))
  app.get('/health/ready', async () => {
    const checks = opts.dependencies ?? []
    for (const dep of checks) {
      try {
        await dep.check()
      } catch {
        throw { statusCode: 503, message: `Dependency ${dep.name} is down` }
      }
    }
    return { status: 'ready' }
  })
}

export const healthCheck = fp(healthCheckPlugin, {
  name: '@ecommerce/health-check',
  fastify: '5.x',
})
