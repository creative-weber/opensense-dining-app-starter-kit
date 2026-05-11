import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}
