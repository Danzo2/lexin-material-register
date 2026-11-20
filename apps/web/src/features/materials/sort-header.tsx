import type { SortDirection } from "@lexin/shared";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

/** The parts of a TanStack Table column the header button needs. */
interface SortableColumn {
  getIsSorted: () => false | SortDirection;
  getToggleSortingHandler: () => undefined | ((event: unknown) => void);
}

interface SortHeaderProps {
  label: string;
  column: SortableColumn;
}

/**
 * Header button for a sortable column. TanStack Table works out the next sort
 * (a new column sorts ascending, the active column flips) and the table writes
 * it to the URL. `aria-sort` is set on the surrounding <th> by the table.
 */
export function SortHeader({ label, column }: SortHeaderProps) {
  const dir = column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-mx-2 px-2"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      <SortIcon dir={dir} />
    </Button>
  );
}

function SortIcon({ dir }: { dir: false | SortDirection }) {
  if (dir === "asc") return <ArrowUpIcon aria-hidden="true" />;
  if (dir === "desc") return <ArrowDownIcon aria-hidden="true" />;
  return <ArrowUpDownIcon aria-hidden="true" className="text-muted-foreground" />;
}
