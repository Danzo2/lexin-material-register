import type { ReactNode } from "react";
import { CircleAlert, LoaderCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";
import { SortHeader } from "./sort-header.tsx";

const SKELETON_ROWS = 10;

// One entry per column in materials-table.tsx, in the same order, so the
// skeleton has the same header and roughly the same column widths as the
// real table and nothing jumps when the first page arrives.
const skeletonColumns = [
  { key: "materialNumber", header: <SortHeader column="materialNumber" label="Material" /> },
  { key: "description", header: <SortHeader column="description" label="Description" /> },
  { key: "type", header: "Type" },
  { key: "manufacturer", header: "Manufacturer / MPN" },
  { key: "plant", header: "Plant" },
  { key: "status", header: "Status" },
  { key: "uom", header: "UoM" },
  { key: "unitPrice", header: <SortHeader column="unitPrice" label="Unit price" />, right: true },
  { key: "stock", header: <SortHeader column="stockOnHand" label="Stock" />, right: true },
  { key: "updatedAt", header: <SortHeader column="updatedAt" label="Last updated" /> },
] as const;

// Placeholder widths per column, roughly the width of typical content.
const cellWidths: Record<(typeof skeletonColumns)[number]["key"], string> = {
  materialNumber: "w-20",
  description: "w-48",
  type: "w-20",
  manufacturer: "w-24",
  plant: "w-28",
  status: "w-24",
  uom: "w-8",
  unitPrice: "w-16",
  stock: "w-12",
  updatedAt: "w-24",
};

export function TableSkeleton() {
  return (
    <Table aria-busy="true" aria-label="Loading materials">
      <TableHeader>
        <TableRow>
          {skeletonColumns.map((column) => (
            <TableHead key={column.key} className={cn("right" in column && "text-right")}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
          <TableRow key={rowIndex}>
            {skeletonColumns.map((column) => (
              <TableCell key={column.key}>
                <Skeleton
                  className={cn(
                    "my-0.5 h-4",
                    cellWidths[column.key],
                    "right" in column && "ml-auto",
                  )}
                />
                {/* The real manufacturer cell has two lines (name, then MPN). */}
                {column.key === "manufacturer" && <Skeleton className="mt-1 mb-0.5 h-3 w-16" />}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface RefetchIndicatorProps {
  /** True while a new page is loading and the rows on screen are the previous result. */
  active: boolean;
  children: ReactNode;
}

// Wraps the results table. The table dims itself while its rows are stale;
// this adds a small spinner on top so the user can see something is loading.
export function RefetchIndicator({ active, children }: RefetchIndicatorProps) {
  return (
    <div className="relative">
      {children}
      {active && (
        <div
          role="status"
          className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground shadow-sm"
        >
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          Updating…
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  onClearAll: () => void;
}

export function EmptyState({ onClearAll }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed px-6 py-12 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 font-medium">No materials match</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try fewer search words or remove a filter.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClearAll}>
        Clear filters
      </Button>
    </div>
  );
}

interface ErrorStateProps {
  /** `data` is set when the API answered with a tRPC error; it is missing when the request never got a tRPC response. */
  error: { message: string; data?: unknown };
  onRetry: () => void;
}

// Retry re-runs the same query; it never touches the URL, so the user's
// search, filters and page are still there once the API is back.
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  // Without a tRPC error body the API is down or unreachable, and the raw
  // message ("Unexpected end of JSON input") means nothing to a planner.
  const hint =
    error.data == null
      ? "The server could not be reached. Check your connection and try again."
      : "The server returned an error. Please try again.";
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-md border border-destructive/40 px-6 py-12 text-center"
    >
      <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
      <p className="mt-3 font-medium">Couldn't load materials</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {/* The API's own message is already safe and generic; a transport failure's
          message is browser jargon, so it is left out. */}
      {error.data != null && (
        <p className="mt-2 max-w-prose font-mono text-xs break-words text-muted-foreground">
          {error.message}
        </p>
      )}
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
