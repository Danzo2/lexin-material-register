// Seed entry point. The seed ticket replaces this stub with a deterministic
// generator for at least 5,000 realistic materials (fixed faker seed, batched
// inserts, idempotent: truncates before inserting).
import { sql } from "drizzle-orm";
import { createDb } from "./client.ts";
import { databaseUrl } from "./env.ts";

const { db, pool } = createDb(databaseUrl());
try {
  await db.execute(sql`select 1`);
  console.log("Connected to Postgres. Nothing to seed yet: the schema ticket adds tables.");
} finally {
  await pool.end();
}
