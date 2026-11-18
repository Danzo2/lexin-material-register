import { createDb, type Db } from "@lexin/db";
import { afterAll, inject } from "vitest";

/** Connects to this run's fixture database and closes the pool after the file's tests. */
export function connectTestDb(): Db {
  const { db, pool } = createDb(inject("databaseUrl"));
  afterAll(async () => {
    await pool.end();
  });
  return db;
}
