import postgres from 'postgres'

export interface DbOptions {
  connectionString: string
  max?: number
}

export function createDb(options: DbOptions): postgres.Sql {
  return postgres(options.connectionString, {
    max: options.max ?? 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
}

export type Sql = postgres.Sql

export { postgres }
