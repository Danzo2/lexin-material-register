// Vitest global setup for API tests: each run gets its own throwaway database on
// the DATABASE_URL server, so parallel worktrees never share or clobber test data.
import { createDb, databaseUrl, migrationsFolder } from "@lexin/db";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { TestProject } from "vitest/node";
import { loadFixture } from "./fixture.ts";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

async function runOnServer(serverUrl: string, statement: ReturnType<typeof sql>): Promise<void> {
  const { db, pool } = createDb(serverUrl);
  try {
    await db.execute(statement);
  } finally {
    await pool.end();
  }
}

export async function setup(project: TestProject): Promise<() => Promise<void>> {
  const serverUrl = databaseUrl();
  const testDbName = `material_register_test_${process.pid}`;
  const testUrl = new URL(serverUrl);
  testUrl.pathname = `/${testDbName}`;

  const dropTestDb = () =>
    runOnServer(serverUrl, sql`drop database if exists ${sql.identifier(testDbName)} with (force)`);

  await dropTestDb();
  await runOnServer(serverUrl, sql`create database ${sql.identifier(testDbName)}`);

  const { db, pool } = createDb(testUrl.toString());
  try {
    await migrate(db, { migrationsFolder });
    await loadFixture(db);
  } catch (error) {
    // Vitest never calls teardown if setup throws, so clean up here.
    await pool.end();
    await dropTestDb();
    throw error;
  }
  await pool.end();

  project.provide("databaseUrl", testUrl.toString());
  return dropTestDb;
}
