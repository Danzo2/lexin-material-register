-- Custom SQL migration file, put your code below! --
-- Drizzle can't express extensions in schema.ts, so this one migration is hand-written.
-- pg_trgm ships with Postgres and provides the gin_trgm_ops operator class used by the
-- search indexes in the next migration.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
