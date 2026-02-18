import { type Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { LoginSchema, RegisterSchema, UserSchema } from '../schemas/user.schema.ts'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: Static<typeof RegisterSchema> }>('/register', {
    schema: {
      body: RegisterSchema,
      response: { 201: UserSchema },
    },
    handler: async (request, reply) => {
      const { identityService } = request.diScope.cradle
      const user = await identityService.register(request.body)

      request.session.user = { id: user.id, email: user.email, name: user.name }
      return reply.status(201).send(user)
    },
  })

  app.post<{ Body: Static<typeof LoginSchema> }>('/login', {
    schema: {
      body: LoginSchema,
      response: {
        200: Type.Object({
          user: UserSchema,
          message: Type.String(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { identityService } = request.diScope.cradle
      const user = await identityService.login(request.body)

      request.session.user = { id: user.id, email: user.email, name: user.name }
      return reply.send({ user, message: 'Login successful' })
    },
  })

  app.post('/logout', {
    handler: async (request, reply) => {
      request.session.destroy()
      return reply.send({ message: 'Logged out' })
    },
  })

  app.get('/me', {
    handler: async (request, reply) => {
      if (!request.session.user) {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Not logged in' })
      }
      const { identityService } = request.diScope.cradle
      const user = await identityService.getProfile(request.session.user.id)
      return reply.send(user)
    },
  })
}
