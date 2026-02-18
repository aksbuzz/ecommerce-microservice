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
export type TransactionSql = postgres.TransactionSql

export { postgres }

export function withTransaction<T>(sql: Sql, cb: (tx: Sql) => T | Promise<T>) {
  return sql.begin(cb as unknown as (tx: TransactionSql) => T | Promise<T>);
}
