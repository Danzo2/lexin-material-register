import { Button } from "@/components/ui/button.tsx";

// Stubs: T07 adds skeleton rows, the empty-state design and the error visuals.

export function TableSkeleton() {
  return <p className="py-8 text-sm text-muted-foreground">Loading materials…</p>;
}

interface EmptyStateProps {
  onClearAll: () => void;
}

export function EmptyState({ onClearAll }: EmptyStateProps) {
  return (
    <div className="py-8 text-sm">
      <p>No materials match.</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onClearAll}>
        Clear filters
      </Button>
    </div>
  );
}

interface ErrorStateProps {
  error: { message: string };
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="py-8 text-sm">
      <p className="text-destructive">Couldn't load materials: {error.message}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
