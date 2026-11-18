import type { SortColumn } from "@lexin/shared";

interface SortHeaderProps {
  column: SortColumn;
  label: string;
}

// Stub: T05 turns this into a button that toggles sort/dir via useListParams.
export function SortHeader({ label }: SortHeaderProps) {
  return <span>{label}</span>;
}
