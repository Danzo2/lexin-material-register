import { schema } from "@lexin/db";
import type { SortColumn, SortDirection } from "@lexin/shared";
import { asc, type SQL } from "drizzle-orm";

const { materials } = schema;

/**
 * Order-by list for the list query, always ending in `id` so pages are stable
 * when sort values tie. Stub until T05: only the default sort (material number
 * ascending) is supported and other columns/directions are ignored.
 */
export function orderByFor(_sort: SortColumn, _dir: SortDirection): SQL[] {
  return [asc(materials.materialNumber), asc(materials.id)];
}
