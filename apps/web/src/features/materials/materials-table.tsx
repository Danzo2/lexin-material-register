import { sortColumns } from "@lexin/shared";
import { useTable, type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";
import { materialColumns, materialTableFeatures, type MaterialRow } from "./material-columns.tsx";
import { useListParams } from "./use-list-params.ts";

export type { MaterialRow };

const ariaSortFor = { asc: "ascending", desc: "descending" } as const;

/**
 * TanStack Table in manual mode over one server page. The sort is read from the
 * URL and header clicks write back to it (which also resets the page), so the
 * URL stays the only copy of the table state.
 */
export function useMaterialsTable(rows: MaterialRow[]) {
  const { params, setParams } = useListParams();

  const sorting = useMemo<SortingState>(
    () => [{ id: params.sort, desc: params.dir === "desc" }],
    [params.sort, params.dir],
  );

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const first = next[0];
    const column = sortColumns.find((id) => id === first?.id);
    if (!first || !column) return;
    setParams({ sort: column, dir: first.desc ? "desc" : "asc" });
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
    sortDescFirst: false,
  });
}

type MaterialsTableInstance = ReturnType<typeof useMaterialsTable>;

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

interface MaterialsTableProps {
  rows: MaterialRow[];
  /** True while a new page is loading and these rows are the previous result. */
  dimmed: boolean;
}

export function MaterialsTable({ rows, dimmed }: MaterialsTableProps) {
  const table = useMaterialsTable(rows);

  return (
    <Table className={cn("transition-opacity", dimmed && "opacity-50")} aria-busy={dimmed}>
      <MaterialsTableHeader table={table} />
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => {
              const meta = cell.column.columnDef.meta;
              return (
                <TableCell
                  key={cell.id}
                  className={cn(meta?.align === "right" && "text-right", meta?.cellClassName)}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
