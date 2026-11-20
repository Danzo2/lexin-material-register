import { useTable, type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";
import { materialColumns, materialTableFeatures, type MaterialRow } from "./material-columns.tsx";
import { sortParamsFrom, sortingFromParams } from "./sorting.ts";
import { useListParams } from "./use-list-params.ts";

const ariaSortFor = { asc: "ascending", desc: "descending" } as const;

/**
 * TanStack Table in manual mode over one server page. The sort is read from the
 * URL and header clicks write back to it (which also resets the page), so the
 * URL stays the only copy of the table state.
 */
export function useMaterialsTable(rows: MaterialRow[]) {
  const { params, setParams } = useListParams();

  const sorting = useMemo(
    () => sortingFromParams(params.sort, params.dir),
    [params.sort, params.dir],
  );

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const patch = sortParamsFrom(next);
    if (patch) setParams(patch);
  };

  return useTable({
    features: materialTableFeatures,
    columns: materialColumns,
    data: rows,
    getRowId: (row) => String(row.id),
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    // Without this, TanStack starts number and date columns descending.
    sortDescFirst: false,
  });
}

export type MaterialsTableInstance = ReturnType<typeof useMaterialsTable>;

/** Header row shared by the real table and the loading skeleton. */
export function MaterialsTableHeader({ table }: { table: MaterialsTableInstance }) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => {
            const dir = header.column.getIsSorted();
            return (
              <TableHead
                key={header.id}
                className={cn(header.column.columnDef.meta?.align === "right" && "text-right")}
                aria-sort={
                  header.column.getCanSort() ? (dir ? ariaSortFor[dir] : "none") : undefined
                }
              >
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}
