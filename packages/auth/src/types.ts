export interface SessionUser {
  id: number
  email: string
  name: string
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    user?: SessionUser
  }
}
