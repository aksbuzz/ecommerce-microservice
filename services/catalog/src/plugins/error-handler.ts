import { AppError } from '@ecommerce/shared'
import type { FastifyInstance } from 'fastify'

export async function errorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      })
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: error.message,
      })
    }

    request.log.error(error, 'Unhandled error')
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  })
}
