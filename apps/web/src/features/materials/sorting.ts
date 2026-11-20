import { sortColumns, type SortColumn, type SortDirection } from "@lexin/shared";
import type { SortingState } from "@tanstack/react-table";

/** The URL sort as TanStack Table's sorting state (always one column). */
export function sortingFromParams(sort: SortColumn, dir: SortDirection): SortingState {
  return [{ id: sort, desc: dir === "desc" }];
}

/**
 * The URL change for a new TanStack sorting state. Column ids are checked
 * against the shared allow-list, so only a sortable column reaches the URL.
 */
export function sortParamsFrom(
  sorting: SortingState,
): { sort: SortColumn; dir: SortDirection } | undefined {
  const first = sorting[0];
  const sort = sortColumns.find((id) => id === first?.id);
  if (!first || !sort) return undefined;
  return { sort, dir: first.desc ? "desc" : "asc" };
}
