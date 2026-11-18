import { materialStatusLabels, materialTypeLabels, type MaterialStatus } from "@lexin/shared";
import type { AppRouter } from "@lexin/api";
import type { inferOutput, TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";
import { formatDate, formatPrice, formatStock } from "./format.ts";
import { SortHeader } from "./sort-header.tsx";

export type MaterialRow = inferOutput<
  TRPCOptionsProxy<AppRouter>["materials"]["list"]
>["rows"][number];

const statusVariant: Record<MaterialStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pending_review: "secondary",
  obsolete: "outline",
};

interface MaterialsTableProps {
  rows: MaterialRow[];
  /** True while a new page is loading and these rows are the previous result. */
  dimmed: boolean;
}

export function MaterialsTable({ rows, dimmed }: MaterialsTableProps) {
  return (
    <Table className={cn("transition-opacity", dimmed && "opacity-50")} aria-busy={dimmed}>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader column="materialNumber" label="Material" />
          </TableHead>
          <TableHead>
            <SortHeader column="description" label="Description" />
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Manufacturer / MPN</TableHead>
          <TableHead>Plant</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>UoM</TableHead>
          <TableHead className="text-right">
            <SortHeader column="unitPrice" label="Unit price" />
          </TableHead>
          <TableHead className="text-right">
            <SortHeader column="stockOnHand" label="Stock" />
          </TableHead>
          <TableHead>
            <SortHeader column="updatedAt" label="Last updated" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">{row.materialNumber}</TableCell>
            <TableCell className="max-w-xs truncate" title={row.description}>
              {row.description}
            </TableCell>
            <TableCell>{materialTypeLabels[row.type]}</TableCell>
            <TableCell>
              <div>{row.manufacturerName}</div>
              <div className="font-mono text-xs text-muted-foreground">{row.mpn}</div>
            </TableCell>
            <TableCell>
              {row.plantCode} · {row.plantName}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[row.status]}>{materialStatusLabels[row.status]}</Badge>
            </TableCell>
            <TableCell>{row.unitOfMeasure}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPrice(row.unitPrice)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatStock(row.stockOnHand)}
            </TableCell>
            <TableCell>{formatDate(row.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
