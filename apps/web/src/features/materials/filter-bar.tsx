import {
  materialStatuses,
  materialStatusLabels,
  materialTypeLabels,
  materialTypes,
  type MaterialListInput,
} from "@lexin/shared";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useTRPC } from "@/trpc.ts";
import { MultiSelectFilter } from "./multi-select-filter.tsx";
import type { ListParamsUpdate } from "./use-list-params.ts";

interface FilterBarProps {
  params: MaterialListInput;
  onChange: (update: ListParamsUpdate) => void;
  onClearAll: () => void;
}

const typeOptions = materialTypes.map((value) => ({ value, label: materialTypeLabels[value] }));
// Toggling against `prev` (the latest URL) means two quick clicks both land,
// even if the second arrives before React re-renders with the first.
function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const statusOptions = materialStatuses.map((value) => ({
  value,
  label: materialStatusLabels[value],
}));

export function FilterBar({ params, onChange, onClearAll }: FilterBarProps) {
  const trpc = useTRPC();
  const options = useQuery(trpc.materials.filterOptions.queryOptions({}));

  const plantOptions = (options.data?.plants ?? []).map((plant) => ({
    value: plant.code,
    label: `${plant.code} · ${plant.name}`,
  }));
  const manufacturerOptions = (options.data?.manufacturers ?? []).map((manufacturer) => ({
    value: manufacturer.slug,
    label: manufacturer.name,
  }));
  const optionsEmptyText = options.isError
    ? "Couldn't load options."
    : options.isPending
      ? "Loading…"
      : "No matches.";

  const isFiltered =
    params.q !== "" ||
    params.type.length > 0 ||
    params.status.length > 0 ||
    params.plant.length > 0 ||
    params.manufacturer.length > 0;

  return (
    <>
      <MultiSelectFilter
        label="Type"
        options={typeOptions}
        selected={params.type}
        onToggle={(value) => {
          onChange((prev) => ({ type: toggled(prev.type, value) }));
        }}
      />
      <MultiSelectFilter
        label="Status"
        options={statusOptions}
        selected={params.status}
        onToggle={(value) => {
          onChange((prev) => ({ status: toggled(prev.status, value) }));
        }}
      />
      <MultiSelectFilter
        label="Plant"
        options={plantOptions}
        selected={params.plant}
        onToggle={(value) => {
          onChange((prev) => ({ plant: toggled(prev.plant, value) }));
        }}
        emptyText={optionsEmptyText}
      />
      <MultiSelectFilter
        label="Manufacturer"
        options={manufacturerOptions}
        selected={params.manufacturer}
        onToggle={(value) => {
          onChange((prev) => ({ manufacturer: toggled(prev.manufacturer, value) }));
        }}
        emptyText={optionsEmptyText}
      />
      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear all
          <XIcon />
        </Button>
      )}
    </>
  );
}
