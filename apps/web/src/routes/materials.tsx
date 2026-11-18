import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc.ts";

// Placeholder that proves web -> API -> Postgres is wired up. The table
// ticket replaces the body with the material register.
export function MaterialsPage() {
  const trpc = useTRPC();
  const health = useQuery(trpc.health.queryOptions());

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Material Register</h1>
      {health.isPending && <p className="mt-4 text-sm text-muted-foreground">Checking API…</p>}
      {health.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          API unreachable: {health.error.message}
        </p>
      )}
      {health.isSuccess && (
        <p className="mt-4 text-sm text-muted-foreground">API ok · database {health.data.db}</p>
      )}
    </main>
  );
}
