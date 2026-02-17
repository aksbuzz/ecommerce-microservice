import amqplib from 'amqplib'

export interface IntegrationEvent {
  id: string
  type: string
  timestamp: string
  payload: Record<string, unknown>
  metadata?: {
    traceId?: string
    spanId?: string
    correlationId?: string
    causationId?: string
    [key: string]: unknown
  }
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

    // Primary exchange (existing)
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true })
    // Retry exchange — messages wait in retry queues with TTL before being re-delivered
    await this.channel.assertExchange(`${this.exchange}.retry`, 'topic', { durable: true })
    // Dead-letter exchange — messages that exceeded max retries
    await this.channel.assertExchange(`${this.exchange}.dlq`, 'topic', { durable: true })

    // Reconnection on unexpected close
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

    // Auto-inject trace context from active OTel span (if available)
    try {
      const { trace } = await import('@opentelemetry/api')
      const activeSpan = trace.getActiveSpan()
      if (activeSpan) {
        const spanCtx = activeSpan.spanContext()
        event.metadata = {
          ...event.metadata,
          traceId: spanCtx.traceId,
          spanId: spanCtx.spanId,
        }
      }
    } catch {
      // @opentelemetry/api not available — skip tracing
    }

    const message = Buffer.from(JSON.stringify(event))
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
          headers: event.metadata ?? {},
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

    // Main queue — dead-letters to retry exchange on nack
    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${this.exchange}.retry`,
        'x-dead-letter-routing-key': eventType,
      },
    })
    await this.channel.bindQueue(queue, this.exchange, eventType)

    // Retry queue — TTL causes messages to expire and route back to main exchange
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

    // DLQ — permanent storage for failed messages
    const dlqQueue = `${queue}.dlq`
    await this.channel.assertQueue(dlqQueue, { durable: true })
    await this.channel.bindQueue(dlqQueue, `${this.exchange}.dlq`, eventType)

    // Register handler
    const handlers = this.handlers.get(eventType) ?? []
    handlers.push(handler)
    this.handlers.set(eventType, handlers)

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return

      let event: IntegrationEvent
      try {
        event = JSON.parse(msg.content.toString())
      } catch {
        // Unparseable message — send to DLQ immediately
        this.channel!.publish(`${this.exchange}.dlq`, eventType, msg.content, {
          ...msg.properties,
          headers: { ...msg.properties.headers, 'x-final-error': 'Failed to parse message JSON' },
        })
        this.channel!.ack(msg)
        return
      }

      // Create a consumer span linked to the producer trace (if OTel available)
      let span: any = null
      let otelContext: any = null
      try {
        const { trace, SpanKind, SpanStatusCode, context } = await import('@opentelemetry/api')
        otelContext = { trace, SpanKind, SpanStatusCode, context }
        const tracer = trace.getTracer('@ecommerce/event-bus')
        const parentTraceId = event.metadata?.traceId as string | undefined
        const parentSpanId = event.metadata?.spanId as string | undefined

        span = tracer.startSpan(`process ${event.type}`, {
          kind: SpanKind.CONSUMER,
          attributes: {
            'messaging.system': 'rabbitmq',
            'messaging.operation': 'process',
            'messaging.destination': event.type,
            'event.id': event.id,
          },
          links: parentTraceId && parentSpanId
            ? [{ context: { traceId: parentTraceId, spanId: parentSpanId, traceFlags: 1, isRemote: true } }]
            : [],
        })
      } catch {
        // OTel not available
      }

      const runHandlers = async () => {
        const eventHandlers = this.handlers.get(event.type) ?? []
        for (const h of eventHandlers) {
          await h(event)
        }
      }

      try {
        if (span && otelContext) {
          await otelContext.context.with(
            otelContext.trace.setSpan(otelContext.context.active(), span),
            runHandlers,
          )
          span.setStatus({ code: otelContext.SpanStatusCode.OK })
        } else {
          await runHandlers()
        }
        this.channel!.ack(msg)
      } catch (err) {
        if (span && otelContext) {
          span.setStatus({ code: otelContext.SpanStatusCode.ERROR, message: String(err) })
        }

        const retryCount = this.getRetryCount(msg)
        if (retryCount >= this.maxRetries) {
          // Max retries exceeded — route to DLQ
          this.channel!.publish(`${this.exchange}.dlq`, eventType, msg.content, {
            ...msg.properties,
            headers: { ...msg.properties.headers, 'x-final-error': String(err), 'x-retry-count': retryCount },
          })
          this.channel!.ack(msg)
        } else {
          // nack without requeue — RabbitMQ routes to retry exchange via DLX
          this.channel!.nack(msg, false, false)
        }
      } finally {
        if (span) span.end()
      }
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
    await this.channel?.close()
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
