import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";
import type { MaterialRow } from "./material-columns.tsx";
import { MaterialsTableHeader, useMaterialsTable } from "./use-materials-table.tsx";

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
                  title={meta?.cellTitle?.(row.original)}
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
