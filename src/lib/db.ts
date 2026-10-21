import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: import.meta.env.DATABASE_URL,
    max: 5,
  });

globalThis.__pgPool = pool;
