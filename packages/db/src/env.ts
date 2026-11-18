import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rootEnvFile = fileURLToPath(new URL("../../../.env", import.meta.url));

/** Loads the repo-root .env once (real environment variables win) and returns DATABASE_URL. */
export function databaseUrl(): string {
  if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env at the repo root.");
  return url;
}
