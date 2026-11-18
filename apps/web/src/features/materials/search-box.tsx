import { Search, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";

const debounceMs = 300;
// Matches `q`'s max(100) in materialListInput; a longer q would fail to parse from the URL.
const maxLength = 100;

interface SearchBoxProps {
  /** The `q` currently in the URL. */
  value: string;
  /** Writes `q` to the URL. */
  onSearch: (q: string) => void;
}

/**
 * The URL owns `q`; this box only keeps an unsent draft so typing doesn't fire a
 * request per keystroke.
 *
 * - `sentValue` is the last `q` this box wrote (or accepted from the URL). The
 *   debounce effect writes the draft once it has differed from `sentValue` for
 *   300 ms; any newer keystroke or URL change cancels the pending write.
 * - When the URL `q` changes from outside (Clear all, back button), the draft is
 *   reset during render, React's "adjust state when a prop changes" pattern,
 *   rather than in an effect. `seenValue` detects the change. Comparing with
 *   `sentValue` ignores our own write arriving back from the URL, so keys typed
 *   while it was in flight are not overwritten.
 */
export function SearchBox({ value, onSearch }: SearchBoxProps) {
  const [draft, setDraft] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  const [sentValue, setSentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== sentValue) {
      setDraft(value);
      setSentValue(value);
    }
  }

  const send = useEffectEvent((q: string) => {
    setSentValue(q);
    onSearch(q);
  });

  useEffect(() => {
    const q = draft.trim();
    if (q === sentValue) return;
    const timer = setTimeout(() => {
      send(q);
    }, debounceMs);
    return () => {
      clearTimeout(timer);
    };
  }, [draft, sentValue]);

  // Clearing is deliberate, so it skips the debounce.
  function clear() {
    setDraft("");
    setSentValue("");
    onSearch("");
    // The clear button unmounts once the draft is empty, so keep focus in the box.
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search material number, description or MPN"
        aria-label="Search materials"
        value={draft}
        maxLength={maxLength}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && draft !== "") clear();
        }}
        className="px-8 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft !== "" && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          onClick={clear}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
