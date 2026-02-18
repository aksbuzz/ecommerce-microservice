import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyError } from 'fastify';
import { AppError } from './errors.ts'; 

export const errorHandler = fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    const fastifyError = error as FastifyError;

    if (fastifyError.validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: fastifyError.message,
      });
    }

    request.log.error(error, 'Unhandled error');

    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });
});
