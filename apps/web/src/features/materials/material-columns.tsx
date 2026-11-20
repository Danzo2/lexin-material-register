import { materialStatusLabels, materialTypeLabels, type MaterialStatus } from "@lexin/shared";
import type { AppRouter } from "@lexin/api";
import {
  createColumnHelper,
  metaHelper,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import type { inferOutput, TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Badge } from "@/components/ui/badge.tsx";
import { formatDate, formatPrice, formatStock } from "./format.ts";
import { SortHeader } from "./sort-header.tsx";

export type MaterialRow = inferOutput<
  TRPCOptionsProxy<AppRouter>["materials"]["list"]
>["rows"][number];

interface MaterialColumnMeta {
  /** Numbers are right-aligned in the header, cells and loading skeleton. */
  align?: "right";
  cellClassName?: string;
}

/**
 * Only the sorting feature is registered, and no sorted or paginated row model,
 * so the table cannot reorder or slice rows in the browser. Postgres returns one
 * page already sorted; TanStack Table only tracks which column is sorted.
 */
export const materialTableFeatures = tableFeatures({
  rowSortingFeature,
  columnMeta: metaHelper<MaterialColumnMeta>(),
});

const statusVariant: Record<MaterialStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pending_review: "secondary",
  obsolete: "outline",
};

const helper = createColumnHelper<typeof materialTableFeatures, MaterialRow>();

/** Column ids of sortable columns match the shared `sortColumns` list. */
export const materialColumns = helper.columns([
  helper.accessor("materialNumber", {
    header: ({ column }) => <SortHeader label="Material" column={column} />,
    meta: { cellClassName: "font-mono text-xs" },
  }),
  helper.accessor("description", {
    header: ({ column }) => <SortHeader label="Description" column={column} />,
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
    meta: { cellClassName: "max-w-xs truncate" },
  }),
  helper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => materialTypeLabels[getValue()],
    enableSorting: false,
  }),
  helper.display({
    id: "manufacturer",
    header: "Manufacturer / MPN",
    cell: ({ row }) => (
      <>
        <div>{row.original.manufacturerName}</div>
        <div className="font-mono text-xs text-muted-foreground">{row.original.mpn}</div>
      </>
    ),
  }),
  helper.display({
    id: "plant",
    header: "Plant",
    cell: ({ row }) => `${row.original.plantCode} · ${row.original.plantName}`,
  }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]}>{materialStatusLabels[getValue()]}</Badge>
    ),
    enableSorting: false,
  }),
  helper.accessor("unitOfMeasure", {
    header: "UoM",
    enableSorting: false,
  }),
  helper.accessor("unitPrice", {
    header: ({ column }) => <SortHeader label="Unit price" column={column} />,
    cell: ({ getValue }) => formatPrice(getValue()),
    meta: { align: "right", cellClassName: "tabular-nums" },
  }),
  helper.accessor("stockOnHand", {
    header: ({ column }) => <SortHeader label="Stock" column={column} />,
    cell: ({ getValue }) => formatStock(getValue()),
    meta: { align: "right", cellClassName: "tabular-nums" },
  }),
  helper.accessor("updatedAt", {
    header: ({ column }) => <SortHeader label="Last updated" column={column} />,
    cell: ({ getValue }) => formatDate(getValue()),
  }),
]);
