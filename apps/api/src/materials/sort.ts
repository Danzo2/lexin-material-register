import { schema } from "@lexin/db";
import type { SortColumn, SortDirection } from "@lexin/shared";
import { asc, desc, type AnyColumn, type SQL } from "drizzle-orm";

const { materials } = schema;

// The allow-list: each sort value the API accepts maps to one real column, so a
// user string never reaches SQL. A new entry in `sortColumns` fails to compile
// until it is mapped here.
const sortableColumns: Record<SortColumn, AnyColumn> = {
  materialNumber: materials.materialNumber,
  description: materials.description,
  unitPrice: materials.unitPrice,
  stockOnHand: materials.stockOnHand,
  updatedAt: materials.updatedAt,
};

/**
 * Order-by list for the list query. It always ends in `id` ascending so rows that
 * tie on the sort column keep one fixed order and never repeat across pages.
 */
export function orderByFor(sort: SortColumn, dir: SortDirection): SQL[] {
  const column = sortableColumns[sort];
  const primary = dir === "asc" ? asc(column) : desc(column);
  return [primary, asc(materials.id)];
}
