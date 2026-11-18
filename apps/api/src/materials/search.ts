import { schema } from "@lexin/db";
import { and, ilike, or, type SQL } from "drizzle-orm";

const { materials } = schema;

/**
 * Escapes the LIKE wildcards so a user's `%` or `_` matches only itself.
 * Backslash is Postgres's default LIKE escape character, so it is escaped first.
 */
function escapeLike(word: string): string {
  return word.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Search condition for the list query: every word must match material number,
 * description or MPN (case-insensitive substring). Undefined means "no condition".
 * Values are bound parameters via `ilike`, never interpolated into the SQL text.
 */
export function searchWhere(q: string): SQL | undefined {
  const words = q.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;

  return and(
    ...words.map((word) => {
      const pattern = `%${escapeLike(word)}%`;
      return or(
        ilike(materials.materialNumber, pattern),
        ilike(materials.description, pattern),
        ilike(materials.mpn, pattern),
      );
    }),
  );
}
