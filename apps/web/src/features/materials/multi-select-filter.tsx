import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface MultiSelectFilterProps<T extends string> {
  label: string;
  options: FilterOption<T>[];
  selected: T[];
  /** Reports the option the user toggled; the parent applies it to the latest URL state. */
  onToggle: (value: T) => void;
  /** Shown when there are no options to pick, e.g. while they load. */
  emptyText?: string;
}

/**
 * A popover of checkboxes for one filter. It holds no state of its own: the
 * selection comes from the URL and every toggle is reported straight back.
 */
export function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  emptyText = "No matches.",
}: MultiSelectFilterProps<T>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selected.length}
              <span className="sr-only"> selected</span>
            </Badge>
          )}
          <ChevronDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          {/* Always rendered: it takes focus when the popover opens, which is what
              lets keyboard users move through the options and toggle them. */}
          <CommandInput placeholder={`Find ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // cmdk matches the search box against `value`, so use the visible label.
                  value={option.label}
                  // cmdk's aria-selected tracks the keyboard highlight, so expose
                  // the filter's own checked state for screen readers here.
                  aria-checked={selected.includes(option.value)}
                  onSelect={() => {
                    onToggle(option.value);
                  }}
                >
                  {/* The whole row toggles; the checkbox only shows the state. */}
                  <Checkbox
                    checked={selected.includes(option.value)}
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none"
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
