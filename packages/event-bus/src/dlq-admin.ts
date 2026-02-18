import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import type { EventBus } from './event-bus.ts'

export interface DlqAdminOptions {
  eventBus: EventBus
  queues: string[]
}

const dlqAdminPlugin: FastifyPluginAsync<DlqAdminOptions> = async (app: FastifyInstance, opts: DlqAdminOptions) => {
  const { eventBus, queues } = opts

  // GET /admin/dlq — list DLQ message counts for configured queues
  app.get('/admin/dlq', async () => {
    const channel = eventBus.getChannel()
    if (!channel) return { error: 'EventBus not connected' }

    const results: Array<{ queue: string; messageCount: number }> = []
    for (const queue of queues) {
      try {
        const info = await channel.checkQueue(`${queue}.dlq`)
        results.push({ queue: `${queue}.dlq`, messageCount: info.messageCount })
      } catch {
        results.push({ queue: `${queue}.dlq`, messageCount: -1 })
      }
    }
    return { queues: results }
  })

  // POST /admin/dlq/:queue/replay — replay all messages from a DLQ back to the main exchange
  app.post<{ Params: { queue: string } }>('/admin/dlq/:queue/replay', async (request) => {
    const channel = eventBus.getChannel()
    if (!channel) return { error: 'EventBus not connected' }

    const dlqName = `${request.params.queue}.dlq`
    let replayed = 0

    // Drain messages from DLQ and republish to main exchange
    while (true) {
      const msg = await channel.get(dlqName, { noAck: false })
      if (!msg) break

      // Strip x-death headers to reset retry count
      const headers = { ...msg.properties.headers }
      delete headers['x-death']
      delete headers['x-final-error']
      delete headers['x-retry-count']

      const event = JSON.parse(msg.content.toString())
      await eventBus.publish(event)
      channel.ack(msg)
      replayed++
    }

    return { replayed, queue: dlqName }
  })

  // DELETE /admin/dlq/:queue/purge — purge all messages from a DLQ
  app.delete<{ Params: { queue: string } }>('/admin/dlq/:queue/purge', async (request) => {
    const channel = eventBus.getChannel()
    if (!channel) return { error: 'EventBus not connected' }

    const dlqName = `${request.params.queue}.dlq`
    const result = await channel.purgeQueue(dlqName)
    return { purged: result.messageCount, queue: dlqName }
  })
}

export const dlqAdmin = fp(dlqAdminPlugin, { name: '@ecommerce/dlq-admin' })
