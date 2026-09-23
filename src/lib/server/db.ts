import { Pool, type PoolClient } from "pg";

const globalForPg = globalThis as unknown as { ecomPgPool?: Pool };

export function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

export function isDatabaseEnabled() {
  return Boolean(databaseUrl());
}

export function getPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (!globalForPg.ecomPgPool) {
    globalForPg.ecomPgPool = new Pool({ connectionString: url });
  }
  return globalForPg.ecomPgPool;
}

export async function withClient<T>(
  run: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");
  const client = await pool.connect();
  try {
    return await run(client);
  } finally {
    client.release();
  }
}
