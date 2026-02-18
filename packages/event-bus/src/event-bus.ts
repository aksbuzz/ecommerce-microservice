import amqplib from 'amqplib'

export interface IntegrationEvent {
  id: string
  type: string
  timestamp: string
  payload: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type EventHandler = (event: IntegrationEvent) => Promise<void>

export interface EventBusOptions {
  exchange?: string
  maxRetries?: number
  retryDelayMs?: number
  prefetch?: number
}

export class EventBus {
  url: string
  exchange: string
  maxRetries: number
  retryDelayMs: number
  prefetchCount: number
  connection: amqplib.ChannelModel | null = null
  channel: amqplib.ConfirmChannel | null = null
  handlers = new Map<string, EventHandler[]>()
  closed = false

  constructor(url: string, options?: EventBusOptions) {
    this.url = url
    this.exchange = options?.exchange ?? 'ecommerce_events'
    this.maxRetries = options?.maxRetries ?? 3
    this.retryDelayMs = options?.retryDelayMs ?? 1000
    this.prefetchCount = options?.prefetch ?? 10
  }

  async connect(): Promise<void> {
    const conn = await amqplib.connect(this.url)
    this.connection = conn
    this.channel = await conn.createConfirmChannel()
    await this.channel.prefetch(this.prefetchCount)

    await this.channel.assertExchange(this.exchange, 'topic', { durable: true })
    await this.channel.assertExchange(`${this.exchange}.retry`, 'topic', { durable: true })
    await this.channel.assertExchange(`${this.exchange}.dlq`, 'topic', { durable: true })

    conn.on('close', () => {
      if (!this.closed) {
        this.connection = null
        this.channel = null
        setTimeout(() => this.reconnect(), 5000)
      }
    })
  }

  async publish(event: IntegrationEvent): Promise<void> {
    if (!this.channel) throw new Error('EventBus not connected')

    const message = Buffer.from(JSON.stringify(event))

    let headers: Record<string, unknown> = {}

    try {
      const { propagation, context } = await import('@opentelemetry/api')
      propagation.inject(context.active(), headers)
    } catch {
      // @opentelemetry/api not available — skip tracing
    }

    return new Promise((resolve, reject) => {
      this.channel!.publish(
        this.exchange,
        event.type,
        message,
        {
          persistent: true,
          contentType: 'application/json',
          messageId: event.id,
          timestamp: Date.now(),
          headers,
        },
        (err) => {
          if (err) reject(err)
          else resolve()
        },
      )
    })
  }

  async subscribe(eventType: string, handler: EventHandler, queue: string): Promise<void> {
    if (!this.channel) throw new Error('EventBus not connected')

    const handlers = this.handlers.get(eventType) ?? []
    handlers.push(handler)
    this.handlers.set(eventType, handlers)

    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${this.exchange}.retry`,
        'x-dead-letter-routing-key': eventType,
      },
    })
    await this.channel.bindQueue(queue, this.exchange, eventType)

    const retryQueue = `${queue}.retry`
    await this.channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': this.exchange,
        'x-dead-letter-routing-key': eventType,
        'x-message-ttl': this.retryDelayMs,
      },
    })
    await this.channel.bindQueue(retryQueue, `${this.exchange}.retry`, eventType)

    const dlqQueue = `${queue}.dlq`
    await this.channel.assertQueue(dlqQueue, { durable: true })
    await this.channel.bindQueue(dlqQueue, `${this.exchange}.dlq`, eventType)

    await this.channel.consume(queue, async msg => {
      if (!msg) return

      let event: IntegrationEvent
      try {
        event = JSON.parse(msg.content.toString())
      } catch {
        this.channel!.publish(`${this.exchange}.dlq`, eventType, msg.content, {
          ...msg.properties,
          headers: { ...msg.properties.headers, 'x-final-error': 'Failed to parse message JSON' },
        })
        this.channel!.ack(msg)
        return
      }

      let span: any
      let otel: any

      try {
        const { trace, SpanKind, SpanStatusCode, context, propagation } =
          await import('@opentelemetry/api')

        otel = { trace, SpanStatusCode, context }

        const extractedContext = propagation.extract(context.active(), msg.properties.headers)
        await context.with(extractedContext, async () => {
          const tracer = trace.getTracer('@ecommerce/event-bus')

          span = tracer.startSpan(`process ${event.type}`, {
            kind: SpanKind.CONSUMER,
            attributes: {
              'messaging.system': 'rabbitmq',
              'messaging.operation': 'process',
              'messaging.destination': msg.fields.routingKey,
              'messaging.destination_kind': 'queue',
              'messaging.rabbitmq.routing_key': msg.fields.routingKey,
              'event.id': event.id,
            },
          })

          await context.with(trace.setSpan(context.active(), span), async () => {
            const eventHandlers = this.handlers.get(event.type) ?? []
            for (const h of eventHandlers) {
              await h(event)
            }
          })

          span.setStatus({ code: SpanStatusCode.OK })
        })
      } catch (err) {
        if (span && otel) {
          span.recordException(err)
          span.setStatus({ code: otel.SpanStatusCode.ERROR, message: String(err) })
          span.end()
        }

        const retryCount = this.getRetryCount(msg)
        if (retryCount >= this.maxRetries) {
          this.channel!.publish(`${this.exchange}.dlq`, eventType, msg.content, {
            headers: {
              ...msg.properties.headers,
              'x-final-error': String(err),
              'x-retry-count': retryCount,
            },
          })
          this.channel!.ack(msg)
        } else {
          this.channel!.nack(msg, false, false)
        }
        return
      }

      this.channel?.ack(msg)
      span?.end()
    })
  }

  getRetryCount(msg: amqplib.ConsumeMessage): number {
    const xDeath = msg.properties.headers?.['x-death']
    if (!Array.isArray(xDeath) || xDeath.length === 0) return 0
    return xDeath.reduce((sum: number, entry: any) => sum + (entry.count ?? 0), 0)
  }

  /** Access the underlying channel for DLQ admin operations */
  getChannel(): amqplib.ConfirmChannel | null {
    return this.channel
  }

  async connectWithRetry(maxRetries = 5, delayMs = 2000): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.connect()
        return
      } catch (err) {
        if (attempt === maxRetries) throw err
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  async close(): Promise<void> {
    this.closed = true
    if (this.channel) {
      await this.channel.waitForConfirms()
      await this.channel?.close()
    }

    await this.connection?.close()

    this.channel = null
    this.connection = null
  }

  private async reconnect(): Promise<void> {
    if (this.closed) return
    try {
      await this.connect()
    } catch {
      setTimeout(() => this.reconnect(), 5000)
    }
  }
}
