import type { MaterialListInput } from "@lexin/shared";
import type { ListParamsPatch } from "./use-list-params.ts";

interface FilterBarProps {
  params: MaterialListInput;
  onChange: (patch: ListParamsPatch) => void;
  onClearAll: () => void;
}

// Stub: T04 adds the type, status, plant and manufacturer multi-selects and "Clear all".
export function FilterBar(_props: FilterBarProps) {
  return null;
}
