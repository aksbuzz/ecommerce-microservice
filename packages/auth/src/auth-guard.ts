import type { FastifyReply, FastifyRequest } from 'fastify'

export async function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.session?.user) {
    reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }
}
