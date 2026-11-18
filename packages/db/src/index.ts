import { fileURLToPath } from "node:url";

export { createDb, type Db } from "./client.ts";
export { databaseUrl } from "./env.ts";
export * as schema from "./schema.ts";

/** Absolute path of the generated SQL migrations, for running them programmatically (tests). */
export const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
