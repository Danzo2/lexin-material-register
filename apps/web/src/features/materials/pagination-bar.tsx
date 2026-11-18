import { pageSizes } from "@lexin/shared";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import type { ListParamsPatch } from "./use-list-params.ts";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (patch: ListParamsPatch) => void;
}

const countFormat = new Intl.NumberFormat("en-AU");

type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * The page buttons to show: always the first and last page plus the current page
 * and its neighbours, e.g. `1 … 4 5 6 … 200`. A gap of exactly one page shows that
 * page instead of an ellipsis, since the ellipsis would take the same space.
 */
function pageItems(current: number, last: number): PageItem[] {
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  const items: PageItem[] = [1];
  if (start === 3) items.push(2);
  if (start > 3) items.push("ellipsis-start");
  for (let page = start; page <= end; page++) items.push(page);
  if (end === last - 2) items.push(last - 1);
  if (end < last - 2) items.push("ellipsis-end");
  if (last > 1) items.push(last);
  return items;
}

export function PaginationBar({ page, pageSize, total, onChange }: PaginationBarProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const goTo = (target: number) => {
    onChange({ page: target });
  };

  // A stale link or a narrower filter can leave `page` beyond the results. Offer a
  // way back instead of numbers that don't exist.
  if (page > lastPage) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <p>
          Page {countFormat.format(page)} is past the end of {countFormat.format(total)}{" "}
          {total === 1 ? "material" : "materials"}.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            goTo(lastPage);
          }}
        >
          Go to last page
        </Button>
      </div>
    );
  }

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);
  const onFirstPage = page <= 1;
  const onLastPage = page >= lastPage;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground tabular-nums">
        Showing {countFormat.format(firstRow)}–{countFormat.format(lastRow)} of{" "}
        {countFormat.format(total)}
      </p>

      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="First page"
          disabled={onFirstPage}
          onClick={() => {
            goTo(1);
          }}
        >
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={onFirstPage}
          onClick={() => {
            goTo(page - 1);
          }}
        >
          <ChevronLeftIcon />
        </Button>

        {pageItems(page, lastPage).map((item) =>
          typeof item === "number" ? (
            <Button
              key={item}
              variant={item === page ? "default" : "ghost"}
              size="sm"
              className="min-w-8 tabular-nums"
              aria-label={`Page ${countFormat.format(item)}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => {
                goTo(item);
              }}
            >
              {countFormat.format(item)}
            </Button>
          ) : (
            <span key={item} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </span>
          ),
        )}

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={onLastPage}
          onClick={() => {
            goTo(page + 1);
          }}
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Last page"
          disabled={onLastPage}
          onClick={() => {
            goTo(lastPage);
          }}
        >
          <ChevronsRightIcon />
        </Button>
      </nav>

      <label className="flex items-center gap-2 text-muted-foreground">
        Rows per page
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            const size = pageSizes.find((option) => String(option) === value);
            // Changing the page size goes back to page 1 (setParams resets `page`).
            if (size !== undefined) onChange({ pageSize: size });
          }}
        >
          <SelectTrigger size="sm" className="w-20" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
