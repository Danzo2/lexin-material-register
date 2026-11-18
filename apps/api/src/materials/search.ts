import type { SQL } from "drizzle-orm";

/**
 * Search condition for the list query: every word must match material number,
 * description or MPN. Stub until T03 implements it; undefined means "no condition".
 */
export function searchWhere(_q: string): SQL | undefined {
  return undefined;
}
