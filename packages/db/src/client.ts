import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  // When Postgres drops an idle pooled connection (restart, shutdown, network
  // blip), pg-pool emits 'error' on the pool. Unhandled, that crashes the
  // process. The pool has already discarded the broken client and opens a new
  // one on the next query, so a warning is all that is needed. Only the error
  // message is logged, never the connection string.
  pool.on("error", (error) => {
    console.warn(`Postgres pool: idle client error: ${error.message}`);
  });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];
