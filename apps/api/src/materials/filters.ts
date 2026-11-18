import type { MaterialListInput } from "@lexin/shared";
import type { SQL } from "drizzle-orm";

/**
 * Filter condition for type, status, plant and manufacturer (SQL `IN` lists).
 * Stub until T04 implements it; undefined means "no condition".
 */
export function filterWhere(_input: MaterialListInput): SQL | undefined {
  return undefined;
}
