import { Input } from "@/components/ui/input.tsx";

interface SearchBoxProps {
  value: string;
  onSearch: (q: string) => void;
}

// Stub: T03 adds the debounced local draft that calls onSearch.
export function SearchBox({ value }: SearchBoxProps) {
  return (
    <Input
      type="search"
      placeholder="Search material number, description or MPN"
      defaultValue={value}
      aria-label="Search materials"
      className="max-w-sm"
      disabled
    />
  );
}
