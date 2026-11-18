import type { ListParamsPatch } from "./use-list-params.ts";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (patch: ListParamsPatch) => void;
}

// Stub: T06 adds numbered pages, the page-size select and "Showing 51–100 of 10,000".
export function PaginationBar({ total }: PaginationBarProps) {
  return <p className="text-sm text-muted-foreground">{total.toLocaleString("en-AU")} materials</p>;
}
