import { authGuard } from '@ecommerce/auth'
import { type Static, Type } from '@sinclair/typebox'
import type { FastifyInstance } from 'fastify'
import { UpdateProfileSchema, UserSchema } from '../schemas/user.schema.ts'

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard)

  app.patch<{ Body: Static<typeof UpdateProfileSchema> }>('/profile', {
    schema: {
      body: UpdateProfileSchema,
      response: { 200: UserSchema },
    },
    handler: async (request, reply) => {
      const { identityService } = request.diScope.cradle
      const user = await identityService.updateProfile(request.session.user!.id, request.body)
      return reply.send(user)
    },
  })

  app.delete('/profile', {
    schema: {
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { identityService } = request.diScope.cradle
      await identityService.deleteAccount(request.session.user!.id)
      request.session.destroy()
      return reply.status(204).send()
    },
  })
}
