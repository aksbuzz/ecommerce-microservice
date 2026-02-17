import pino from 'pino'

export interface LoggerOptions {
  name: string
  level?: string
}

export function createLogger(options: LoggerOptions): pino.Logger {
  const isDev = process.env.NODE_ENV !== 'production'

  return pino({
    name: options.name,
    level: options.level ?? process.env.LOG_LEVEL ?? 'info',
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    }),
  })
}

export type { Logger } from 'pino'
