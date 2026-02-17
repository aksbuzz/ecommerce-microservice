import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import { RedisStore } from 'connect-redis'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Redis } from 'ioredis'

export interface SessionConfig {
  redisUrl: string
  secret: string
  cookieName?: string
  maxAge?: number
}

export const sessionPlugin = fp<SessionConfig>(async (app: FastifyInstance, config) => {
  const redis = new Redis(config.redisUrl)

  const store = new RedisStore({ client: redis })

  await app.register(fastifyCookie)
  await app.register(fastifySession, {
    store,
    secret: config.secret,
    cookieName: config.cookieName ?? 'eshop.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: config.maxAge ?? 24 * 60 * 60 * 1000, // 24 hours
    },
    saveUninitialized: false,
  })

  app.addHook('onClose', async () => {
    redis.disconnect()
  })
}, { name: 'session-plugin' })
