import type { SortColumn, SortDirection } from "@lexin/shared";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useListParams } from "./use-list-params.ts";

interface SortHeaderProps {
  column: SortColumn;
  label: string;
}

const ariaSortFor: Record<SortDirection, "ascending" | "descending"> = {
  asc: "ascending",
  desc: "descending",
};

/**
 * Column header that sorts the table. Clicking a new column sorts it ascending;
 * clicking the active column flips the direction. The sort lives only in the URL,
 * and `setParams` sends the user back to page 1.
 */
export function SortHeader({ column, label }: SortHeaderProps) {
  const { params, setParams } = useListParams();
  const activeDir = params.sort === column ? params.dir : undefined;

  function handleClick() {
    const dir: SortDirection = activeDir === "asc" ? "desc" : "asc";
    setParams({ sort: column, dir });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-mx-2 px-2"
      aria-sort={activeDir ? ariaSortFor[activeDir] : "none"}
      onClick={handleClick}
    >
      {label}
      <SortIcon dir={activeDir} />
    </Button>
  );
}

function SortIcon({ dir }: { dir: SortDirection | undefined }) {
  if (dir === "asc") return <ArrowUpIcon aria-hidden="true" />;
  if (dir === "desc") return <ArrowDownIcon aria-hidden="true" />;
  return <ArrowUpDownIcon aria-hidden="true" className="text-muted-foreground" />;
}
