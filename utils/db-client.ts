import { Pool, QueryResult } from 'pg'

// Single pool shared across the test run, Playwright workers will reuse it.
// The pool is created on first call to getPool().
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.SUPABASE_DATABASE_URL) {
      throw new Error(
        'SUPABASE_DATABASE_URL is not set. ' +
        'Add it to .env for local runs or to GitHub Secrets for CI.'
      )
    }
    pool = new Pool({
      connectionString: process.env.SUPABASE_DATABASE_URL,
      ssl: { rejectUnauthorized: false },  // required for Supabase
      max: 5,
    })
  }
  return pool
}

export async function query<T extends object = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(sql, params)
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
